# Coding Journey Tracker

Free setup using GitHub, Supabase, Netlify and Google Gemini. Free-tier limits change, so check each site's pricing page.

## Files
- `index.html` – the app
- `netlify/functions/ai.js` – server function that holds your AI key
- `supabase-setup.sql` – creates the tables and privacy rules
- `README.md` – this file

## Steps
1. **Supabase:** create a free project. Open SQL Editor, paste `supabase-setup.sql`, click Run.
   - Authentication > Providers > Email: while testing you can turn off "Confirm email".
   - Project Settings > API: copy the Project URL and the `anon` public key.
2. **index.html:** near the top of the script, replace `PASTE_YOUR_SUPABASE_URL` and `PASTE_YOUR_SUPABASE_ANON_KEY` with those two values.
3. **Gemini key:** create a free API key in Google AI Studio.
4. **GitHub:** create a new public repository, then add the files. For the function use Add file > Create new file and type the name `netlify/functions/ai.js` so the folders are created.
5. **Netlify:** Add new site > Import from GitHub > pick the repository > Deploy.
   - Site configuration > Environment variables, add: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`. Optional: `GEMINI_MODEL` (default `gemini-2.5-flash`; use a current model name from Google's docs if that one is retired).
   - Deploys > Trigger deploy so the variables take effect.
6. Open your site, create an account, add a task, and try an AI button.

## Safety
- Never put the Gemini key or Supabase `service_role` key in any file or on GitHub. Only the `anon` key goes in `index.html`; the privacy rules in the SQL file are what protect user data.
- Add a privacy policy before sharing the site, since it stores people's study data.
