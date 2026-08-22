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

-- Reserves a case-insensitive-unique display name per character slot,
-- world-readable (like ranking below) so CharacterCreation can check
-- availability before letting the player commit to a name — `characters`
-- itself can't be queried across accounts for this (its RLS above only lets
-- an account see its own rows), and the name lives inside its jsonb `data`
-- blob anyway, not its own column. Kept in sync by saveCloudCharacter
-- (upserts the reservation alongside every character save) and
-- deleteCloudCharacter (frees it back up on delete/permadeath) in
-- lib/cloudSave.ts.
create table if not exists public.character_names (
  user_id uuid not null references auth.users(id) on delete cascade,
  slot integer not null,
  name_lower text not null,
  primary key (user_id, slot)
);

create unique index if not exists character_names_unique_idx on public.character_names (name_lower);

alter table public.character_names enable row level security;

drop policy if exists "character_names_select_all" on public.character_names;
create policy "character_names_select_all" on public.character_names
  for select using (true);

drop policy if exists "character_names_insert_own" on public.character_names;
create policy "character_names_insert_own" on public.character_names
  for insert with check (auth.uid() = user_id);

drop policy if exists "character_names_update_own" on public.character_names;
create policy "character_names_update_own" on public.character_names
  for update using (auth.uid() = user_id);

drop policy if exists "character_names_delete_own" on public.character_names;
create policy "character_names_delete_own" on public.character_names
  for delete using (auth.uid() = user_id);

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
-- Collapsed back down to a single create (previously a create-table plus a
-- trail of incremental `alter table add column` migrations for iron_mode,
-- cp, and dropping depth's NOT NULL) after the real install's table was
-- found stuck on an old shape those alters were never actually landing on
-- — ranking rows are a disposable leaderboard, not a save, so losing old
-- ones in a rebuild is a non-issue. `if not exists` keeps this a no-op on
-- an install that already has the current shape.
create table if not exists public.ranking (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  class_id text not null,
  level integer not null,
  cp integer not null default 0,
  iron_mode boolean not null default false,
  equipment jsonb,
  created_at timestamptz not null default now()
);

-- Migration: snapshot of the 6 equipment slots at run-end, so clicking a
-- leaderboard row can show what that character was wearing (RankingScreen)
-- instead of just their name/level/CP. Nullable — an old row written before
-- this column existed just has nothing to show.
alter table public.ranking add column if not exists equipment jsonb;

-- Migration: collapse pre-existing duplicate rows (same account+character
-- name) down to the most recent one before the unique index below goes on,
-- or it fails to attach on old data — a run ending used to INSERT a fresh
-- row every time, so a character finishing several runs flooded the board
-- with duplicates of itself instead of the leaderboard showing one row per
-- player. New runs now UPSERT onto (user_id, name) instead (see
-- insertGlobalRankEntry in lib/cloudSave.ts).
delete from public.ranking a using public.ranking b
  where a.user_id = b.user_id and a.name = b.name and a.id < b.id;

create unique index if not exists ranking_user_name_idx on public.ranking (user_id, name);

alter table public.ranking enable row level security;

drop policy if exists "ranking_select_all" on public.ranking;
create policy "ranking_select_all" on public.ranking
  for select using (true);

drop policy if exists "ranking_insert_own" on public.ranking;
create policy "ranking_insert_own" on public.ranking
  for insert with check (auth.uid() = user_id);

drop policy if exists "ranking_update_own" on public.ranking;
create policy "ranking_update_own" on public.ranking
  for update using (auth.uid() = user_id);

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

-- PostgREST (the API layer the app's supabase-js client talks to) caches
-- the schema and doesn't always notice DDL run through the SQL Editor right
-- away — a column that was just added/altered above can 404 as "does not
-- exist" from the app for a bit until the cache catches up. This forces an
-- immediate reload instead of waiting on it. Harmless to run any time.
notify pgrst, 'reload schema';
