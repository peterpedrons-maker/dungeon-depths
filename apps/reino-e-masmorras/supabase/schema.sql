-- Reino & Masmorras — schema for account/cloud-save/global-ranking.
-- Run this once in the Supabase project's SQL Editor (Dashboard → SQL Editor
-- → New query → paste → Run). Safe to re-run (every statement is idempotent).

-- Up to 10 rows per account (one per character slot, see
-- MAX_CHARACTER_SLOTS in lib/storage.ts), each holding a full character
-- save as JSON — mirrors what used to live under the browser's
-- localStorage, just keyed by the authenticated user instead of the
-- browser. auth.users is Supabase's own built-in table; we never touch it
-- directly, only reference its id.
create table if not exists public.characters (
  user_id uuid not null references auth.users(id) on delete cascade,
  slot integer not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, slot)
);

-- Migration: earlier installs had `user_id` alone as the primary key (one
-- character per account, no slot concept) — bring them up to the composite
-- (user_id, slot) key so multiple characters per account works. No-ops on
-- a fresh install, since the table above is already created with the right
-- shape in that case.
alter table public.characters add column if not exists slot integer not null default 0;
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.characters'::regclass
      and contype = 'p'
      and array_length(conkey, 1) = 1
  ) then
    alter table public.characters drop constraint characters_pkey;
    alter table public.characters add primary key (user_id, slot);
  end if;
end $$;

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

-- Badges a Modo Ferro run on the leaderboard — added after the table
-- already existed on installs from before Modo Ferro shipped, hence the
-- idempotent add-column instead of just being in the create table above.
alter table public.ranking add column if not exists iron_mode boolean not null default false;

-- Ranking sort switched from "maior profundidade" to "maior nível, empate
-- por CP" — cp is the new tiebreaker column; depth stays in place
-- unused rather than dropped, so no data is destroyed on installs that
-- already have rows keyed on it.
alter table public.ranking add column if not exists cp integer not null default 0;

alter table public.ranking enable row level security;

drop policy if exists "ranking_select_all" on public.ranking;
create policy "ranking_select_all" on public.ranking
  for select using (true);

drop policy if exists "ranking_insert_own" on public.ranking;
create policy "ranking_insert_own" on public.ranking
  for insert with check (auth.uid() = user_id);

-- One row per account (not per character slot) — prestígio and cosméticos
-- da Loja de Prestígio survive character deletion, including Modo Ferro
-- permadeath, and are shared across every slot on the account, same as the
-- Supabase login itself.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  prestige integer not null default 0,
  owned_cosmetics text[] not null default '{}',
  equipped_cosmetic text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id);
