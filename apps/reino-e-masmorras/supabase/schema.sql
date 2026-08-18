-- Reino & Masmorras — schema for account/cloud-save/global-ranking.
-- Run this once in the Supabase project's SQL Editor (Dashboard → SQL Editor
-- → New query → paste → Run). Safe to re-run (every statement is idempotent).

-- One row per account, holding the full character save as JSON — mirrors
-- exactly what used to live under the browser's localStorage key
-- rm_character_v1, just keyed by the authenticated user instead of the
-- browser. auth.users is Supabase's own built-in table; we never touch it
-- directly, only reference its id.
create table if not exists public.characters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.characters enable row level security;

drop policy if exists "characters_select_own" on public.characters;
create policy "characters_select_own" on public.characters
  for select using (auth.uid() = user_id);

drop policy if exists "characters_insert_own" on public.characters;
create policy "characters_insert_own" on public.characters
  for insert with check (auth.uid() = user_id);

drop policy if exists "characters_update_own" on public.characters;
create policy "characters_update_own" on public.characters
  for update using (auth.uid() = user_id);

drop policy if exists "characters_delete_own" on public.characters;
create policy "characters_delete_own" on public.characters
  for delete using (auth.uid() = user_id);

-- One row per completed/retreated run, across every account — the global
-- leaderboard the Ranking screen reads from. Anyone can read it (it's a
-- public leaderboard); only the run's own owner can insert their own row.
create table if not exists public.ranking (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  class_id text not null,
  depth integer not null,
  level integer not null,
  created_at timestamptz not null default now()
);

alter table public.ranking enable row level security;

drop policy if exists "ranking_select_all" on public.ranking;
create policy "ranking_select_all" on public.ranking
  for select using (true);

drop policy if exists "ranking_insert_own" on public.ranking;
create policy "ranking_insert_own" on public.ranking
  for insert with check (auth.uid() = user_id);
