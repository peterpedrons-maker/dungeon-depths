import { Character, ClassId, RankEntry } from '../types/game';
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
}

export async function deleteCloudCharacter(userId: string, slot: number): Promise<void> {
  await supabase.from('characters').delete().eq('user_id', userId).eq('slot', slot);
}

// Top 20 across every account, not just this browser — the whole point of
// a global leaderboard. Unlike the local-only version this never caps or
// dedupes per player: every completed/retreated run gets its own row, and
// only the best 20 overall are shown.
export async function fetchGlobalRanking(): Promise<RankEntry[]> {
  const { data, error } = await supabase
    .from('ranking')
    .select('name,class_id,depth,level,created_at')
    .order('depth', { ascending: false })
    .limit(20);
  if (error || !data) return [];
  return data.map((r) => ({
    name: r.name as string,
    classId: r.class_id as ClassId,
    depth: r.depth as number,
    level: r.level as number,
    date: (r.created_at as string).slice(0, 10),
  }));
}

export async function insertGlobalRankEntry(userId: string, entry: RankEntry): Promise<void> {
  await supabase.from('ranking').insert({
    user_id: userId, name: entry.name, class_id: entry.classId, depth: entry.depth, level: entry.level,
  });
}
