import { Character, EquipmentItem, RankEntry } from '../types/game';
import { CLASSES } from './classes';

const CHAR_KEY = 'rm_character_v1';
const RANK_KEY = 'rm_ranking_v1';
const MAX_RANK_ENTRIES = 10;

// Old saves may have items from before the weapon-only-slot rework, missing
// the newer bonus fields entirely — back-fill with 0 rather than let NaN
// leak into every stat sum downstream. Input is raw parsed JSON, hence `any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateItem(item: any): EquipmentItem {
  return {
    id: item.id, name: item.name, classId: item.classId, rarity: item.rarity, slot: item.slot ?? 'weapon',
    dmgBonus: item.dmgBonus ?? 0, defBonus: item.defBonus ?? 0, hpBonus: item.hpBonus ?? 0,
    secondaryStat: item.secondaryStat,
  };
}

// Saves from before the class/skill/equipment rework may be missing fields
// (or reference a class that no longer exists) — back-fill or discard rather
// than let the app crash on an old localStorage save.
export function loadCharacter(): Character | null {
  try {
    const raw = localStorage.getItem(CHAR_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Character;
    if (!(c.classId in CLASSES)) return null;
    const eq = c.equipment ?? ({} as Character['equipment']);
    return {
      ...c,
      skillPoints: c.skillPoints ?? 0,
      unlockedSkills: c.unlockedSkills ?? [],
      equippedAbilities: c.equippedAbilities ?? [],
      equipment: {
        weapon: eq.weapon ? migrateItem(eq.weapon) : null,
        body: eq.body ? migrateItem(eq.body) : null,
        legs: eq.legs ? migrateItem(eq.legs) : null,
        hands: eq.hands ? migrateItem(eq.hands) : null,
        accessory: eq.accessory ? migrateItem(eq.accessory) : null,
      },
      inventory: (c.inventory ?? []).map(migrateItem),
      buildings: c.buildings ?? {},
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
