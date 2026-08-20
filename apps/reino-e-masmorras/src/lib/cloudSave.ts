import { Character, ClassId, ProfileState, RankEntry } from '../types/game';
import { supabase } from './supabaseClient';

// Cloud counterpart of lib/storage.ts's local-only loadCharacter/
// saveCharacter — up to MAX_CHARACTER_SLOTS (see lib/storage.ts) rows per
// account in `characters` (see supabase/schema.sql), one per slot, all
// keyed by the authenticated user's id instead of a single browser's
// localStorage.

// One round-trip for the whole character-select screen instead of
// MAX_CHARACTER_SLOTS separate fetches — returns only the slots that
// actually have a character; empty slots simply aren't in the map.
export async function fetchCloudCharacterSlots(userId: string): Promise<Map<number, Character>> {
  const { data, error } = await supabase.from('characters').select('slot,data').eq('user_id', userId);
  const map = new Map<number, Character>();
  if (error || !data) return map;
  for (const row of data) map.set(row.slot as number, row.data as Character);
  return map;
}

export async function saveCloudCharacter(userId: string, slot: number, character: Character): Promise<void> {
  await supabase.from('characters').upsert({ user_id: userId, slot, data: character, updated_at: new Date().toISOString() });
  // Keeps the world-readable name reservation (see character_names in
  // schema.sql) in step with every save, not just creation — covers both a
  // brand-new character and the one-time upload of a pre-account local save
  // (App.tsx's slot-migration effect) without needing its own call site.
  // Name never changes post-creation, so this is a no-op upsert most saves.
  await supabase.from('character_names').upsert({ user_id: userId, slot, name_lower: character.name.trim().toLowerCase() });
}

export async function deleteCloudCharacter(userId: string, slot: number): Promise<void> {
  await supabase.from('characters').delete().eq('user_id', userId).eq('slot', slot);
  // Frees the name back up — otherwise a deleted (or Modo Ferro permadeath)
  // character's name would stay reserved forever with no character left to
  // own it.
  await supabase.from('character_names').delete().eq('user_id', userId).eq('slot', slot);
}

// Case-insensitive global availability check backing CharacterCreation's
// name field — reads the world-readable character_names reservation table
// (see schema.sql) instead of `characters` itself, whose RLS only lets an
// account see its own rows.
export async function isCharacterNameTaken(name: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('character_names')
    .select('user_id')
    .eq('name_lower', name.trim().toLowerCase())
    .limit(1);
  if (error) {
    console.error('isCharacterNameTaken failed', error);
    return false; // fail open — a spurious read error shouldn't block creating a character
  }
  return (data?.length ?? 0) > 0;
}

export interface RankingFetchResult { ranking: RankEntry[]; error: string | null }

// Top 20 across every account, not just this browser — the whole point of
// a global leaderboard. One row per character (see insertGlobalRankEntry),
// so this is naturally already deduped per player — no repeat runs by the
// same character flooding the top 20 with copies of themselves.
//
// Also returns the raw error (if any) alongside the (possibly empty) list —
// a prior version swallowed read errors just like insertGlobalRankEntry
// used to swallow write errors, which meant "the insert reported success
// but the ranking still shows nothing" had no way to be told apart from
// "there really is nothing to show" without direct DB access.
export async function fetchGlobalRanking(): Promise<RankingFetchResult> {
  const { data, error } = await supabase
    .from('ranking')
    .select('name,class_id,cp,level,created_at,iron_mode')
    .order('level', { ascending: false })
    .order('cp', { ascending: false })
    .limit(20);
  if (error) {
    console.error('fetchGlobalRanking failed', error);
    return { ranking: [], error: `${error.message}${error.hint ? ` (${error.hint})` : ''}` };
  }
  if (!data) return { ranking: [], error: null };
  return {
    ranking: data.map((r) => ({
      name: r.name as string,
      classId: r.class_id as ClassId,
      cp: (r.cp as number | null) ?? 0,
      level: r.level as number,
      date: (r.created_at as string).slice(0, 10),
      ironMode: r.iron_mode as boolean,
    })),
    error: null,
  };
}

// Upserts onto (user_id, name) — see the unique index in schema.sql —
// instead of always inserting, so a character finishing several runs
// updates its one leaderboard row in place rather than piling up a fresh
// duplicate of itself every time.
//
// Returns null on success, or the Postgres/PostgREST error message on
// failure — callers can surface this in the UI. A failed leaderboard write
// shouldn't interrupt the run-end flow, but this used to be swallowed
// outright (a NOT NULL constraint on an unrelated column, depth, quietly
// dropped every insert with no visible symptom beyond "the ranking never
// fills in"), which made that class of bug unfindable without direct DB
// access. Logged to console either way, but the return value lets a caller
// show it on-screen too, which matters on mobile where devtools aren't an
// option.
export async function insertGlobalRankEntry(userId: string, entry: RankEntry): Promise<string | null> {
  const { error } = await supabase.from('ranking').upsert({
    user_id: userId, name: entry.name, class_id: entry.classId, cp: entry.cp, level: entry.level,
    iron_mode: entry.ironMode ?? false, created_at: new Date().toISOString(),
  }, { onConflict: 'user_id,name' });
  if (error) {
    console.error('insertGlobalRankEntry failed', error);
    return `${error.message}${error.hint ? ` (${error.hint})` : ''}`;
  }
  return null;
}

// Loja de Prestígio — uma linha por conta (não por slot de personagem), ver
// supabase/schema.sql. Ausência de linha (conta nova, ainda sem compra)
// resolve para o estado zerado em vez de erro.
export async function fetchProfile(userId: string): Promise<ProfileState> {
  const { data, error } = await supabase
    .from('profiles')
    .select('prestige,owned_cosmetics,equipped_cosmetic')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return { prestige: 0, ownedCosmetics: [], equippedCosmetic: null };
  return {
    prestige: data.prestige as number,
    ownedCosmetics: (data.owned_cosmetics as string[]) ?? [],
    equippedCosmetic: (data.equipped_cosmetic as string | null) ?? null,
  };
}

export async function saveProfile(userId: string, profile: ProfileState): Promise<void> {
  await supabase.from('profiles').upsert({
    user_id: userId,
    prestige: profile.prestige,
    owned_cosmetics: profile.ownedCosmetics,
    equipped_cosmetic: profile.equippedCosmetic,
    updated_at: new Date().toISOString(),
  });
}
