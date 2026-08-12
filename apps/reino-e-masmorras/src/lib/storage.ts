import { Character, RankEntry } from '../types/game';
import { CLASSES } from './classes';

const CHAR_KEY = 'rm_character_v1';
const RANK_KEY = 'rm_ranking_v1';
const MAX_RANK_ENTRIES = 10;

// Saves from before the class/skill/equipment rework may be missing fields
// (or reference a class that no longer exists) — back-fill or discard rather
// than let the app crash on an old localStorage save.
export function loadCharacter(): Character | null {
  try {
    const raw = localStorage.getItem(CHAR_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Character;
    if (!(c.classId in CLASSES)) return null;
    return {
      ...c,
      skillPoints: c.skillPoints ?? 0,
      unlockedSkills: c.unlockedSkills ?? [],
      equipment: c.equipment ?? { weapon: null },
      inventory: c.inventory ?? [],
    };
  } catch { return null; }
}

export function saveCharacter(c: Character): void {
  try { localStorage.setItem(CHAR_KEY, JSON.stringify(c)); } catch { /* ignore */ }
}

export function clearCharacter(): void {
  try { localStorage.removeItem(CHAR_KEY); } catch { /* ignore */ }
}

export function loadRanking(): RankEntry[] {
  try {
    const raw = localStorage.getItem(RANK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addRankEntry(entry: RankEntry): RankEntry[] {
  const list = [...loadRanking(), entry]
    .sort((a, b) => b.depth - a.depth)
    .slice(0, MAX_RANK_ENTRIES);
  try { localStorage.setItem(RANK_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  return list;
}
