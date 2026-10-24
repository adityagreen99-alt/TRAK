// Netlify function: signed-in users only, with a daily cap, calls Gemini with a key that stays on the server.
const reply = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'POST only' });

  const { SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_API_KEY } = process.env;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !GEMINI_API_KEY) {
    return reply(500, { error: 'Server is not configured yet.' });
  }

  const auth = event.headers.authorization || event.headers.Authorization || '';
  if (!auth.startsWith('Bearer ')) return reply(401, { error: 'Please sign in.' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'Bad request.' }); }
  const prompt = String(body.prompt || '').slice(0, 8000);
  if (!prompt) return reply(400, { error: 'Empty prompt.' });

  // Checks the user's login and counts today's usage (limit is set in supabase-setup.sql).
  const usage = await fetch(`${SUPABASE_URL}/rest/v1/rpc/use_ai`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: auth, 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!usage.ok) return reply(401, { error: 'Please sign in again.' });
  if ((await usage.json()) !== true) return reply(429, { error: 'Daily AI limit reached. Try again tomorrow.' });

  const generationConfig = { maxOutputTokens: 2048 };
  if (body.json) generationConfig.responseMimeType = 'application/json';

  const g = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
  });
  if (!g.ok) return reply(502, { error: 'AI service error. Try again.' });

  const d = await g.json();
  const text = (d.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
  return reply(200, { text });
};
