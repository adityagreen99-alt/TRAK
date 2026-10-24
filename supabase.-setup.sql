-- Run once in Supabase: SQL Editor > New query > paste > Run.

create table if not exists trackers (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

create table if not exists board (
  user_id uuid primary key references auth.users on delete cascade,
  name text,
  xp int default 0,
  lvl int default 1,
  streak int default 0,
  updated_at timestamptz default now()
);

create table if not exists ai_usage (
  user_id uuid references auth.users on delete cascade,
  day date default current_date,
  n int default 0,
  primary key (user_id, day)
);

alter table trackers enable row level security;
alter table board enable row level security;
alter table ai_usage enable row level security;

-- Each person can read and write only their own tracker data.
create policy "own tracker" on trackers for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Leaderboard: any signed-in user can read it; you can only change your own row.
create policy "read board" on board for select using (auth.role() = 'authenticated');
create policy "insert own board" on board for insert with check (auth.uid() = user_id);
create policy "update own board" on board for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own board" on board for delete using (auth.uid() = user_id);

-- Daily AI limit per user (change 30 to whatever you like).
create or replace function use_ai() returns boolean
language plpgsql security definer set search_path = public as $$
declare c int;
begin
  if auth.uid() is null then return false; end if;
  insert into ai_usage (user_id, day, n) values (auth.uid(), current_date, 1)
  on conflict (user_id, day) do update set n = ai_usage.n + 1
  returning n into c;
  return c <= 30;
end $$;

grant execute on function use_ai() to authenticated;
