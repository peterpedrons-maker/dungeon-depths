import { Attributes, Character, ClassId, EquipmentItem, RankEntry } from '../types/game';
import { CLASSES, MAX_LEVEL } from './classes';
import { SKILL_TREES } from './skills';

const ZERO_ATTRS: Attributes = { str: 0, dex: 0, agi: 0, vit: 0, int: 0, wis: 0, luk: 0 };

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

    // Saves from before the physical/magical split have no matk/mdef at all —
    // back-fill using the same class-base + per-level growth (+2/+1) that
    // grantXp() applies going forward, so an old character doesn't suddenly
    // roll NaN spell damage/defense.
    const cls = CLASSES[classId];
    const level = Math.min(c.level ?? 1, MAX_LEVEL);
    const matk = c.matk ?? cls.baseMatk + 2 * (level - 1);
    const mdef = c.mdef ?? cls.baseMdef + 1 * (level - 1);

    // Saves from before the attribute-point rework have no attributePoints/
    // allocatedAttrs at all — back-fill 1 point per level already earned
    // (the old rate) as an unspent balance, rather than clawing back
    // progress the player already has. skillPoints is left untouched for
    // the same reason: the new "every 2 levels" rate only applies to future
    // level-ups via grantXp(), never retroactively to an existing balance.
    const attributePoints = c.attributePoints ?? Math.max(0, level - 1);
    const allocatedAttrs = c.allocatedAttrs ?? { ...ZERO_ATTRS };

    return {
      ...c,
      classId,
      level,
      matk,
      mdef,
      skillPoints: (c.skillPoints ?? 0) + refundedPoints,
      attributePoints,
      allocatedAttrs,
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
