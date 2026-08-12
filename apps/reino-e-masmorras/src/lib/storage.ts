import { Character, ClassId, EquipmentItem, RankEntry } from '../types/game';
import { CLASSES } from './classes';
import { SKILL_TREES } from './skills';

const CHAR_KEY = 'rm_character_v1';
const RANK_KEY = 'rm_ranking_v1';
const MAX_RANK_ENTRIES = 10;

// The Assassino class was renamed to Ladino when the class roster expanded —
// old saves/rankings referencing the old id are remapped transparently.
function migrateClassId(id: string): string {
  return id === 'assassino' ? 'ladino' : id;
}

// Old saves may have items from before the weapon-only-slot rework, missing
// the newer bonus fields entirely — back-fill with 0 rather than let NaN
// leak into every stat sum downstream. Input is raw parsed JSON, hence `any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateItem(item: any): EquipmentItem {
  return {
    id: item.id, name: item.name, classId: migrateClassId(item.classId) as ClassId, rarity: item.rarity, slot: item.slot ?? 'weapon',
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
    const classId = migrateClassId(c.classId as unknown as string) as ClassId;
    if (!(classId in CLASSES)) return null;
    const eq = c.equipment ?? ({} as Character['equipment']);

    // Every rebalance of SKILL_TREES (denser trees, renamed class, reordered
    // nodes) can leave old unlockedSkills pointing at node ids that no
    // longer exist — drop those and refund the skill point instead of
    // crashing or silently keeping a bonus tied to nothing.
    const validIds = new Set(SKILL_TREES[classId].flatMap((p) => p.nodes.map((n) => n.id)));
    const rawUnlocked = c.unlockedSkills ?? [];
    const unlockedSkills = rawUnlocked.filter((id) => validIds.has(id));
    const refundedPoints = rawUnlocked.length - unlockedSkills.length;
    const equippedAbilities = (c.equippedAbilities ?? []).filter((id) => unlockedSkills.includes(id));

    return {
      ...c,
      classId,
      skillPoints: (c.skillPoints ?? 0) + refundedPoints,
      unlockedSkills,
      equippedAbilities,
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
    if (!raw) return [];
    const list = JSON.parse(raw) as RankEntry[];
    return list.map((r) => ({ ...r, classId: migrateClassId(r.classId as unknown as string) as ClassId }));
  } catch { return []; }
}

export function addRankEntry(entry: RankEntry): RankEntry[] {
  const list = [...loadRanking(), entry]
    .sort((a, b) => b.depth - a.depth)
    .slice(0, MAX_RANK_ENTRIES);
  try { localStorage.setItem(RANK_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  return list;
}
