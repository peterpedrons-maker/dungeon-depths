import type { Attributes, Character, ClassId, EquipmentItem, ProfileState } from '../types/game';
import { CLASSES, MAX_LEVEL } from './classes.ts';
import { SKILL_TREES } from './skills.ts';
import { MAX_POTIONS } from './consumables.ts';
import { repackInventory } from './inventoryGrid.ts';
import { generateMerchantStock, STOCK_COLS } from './merchantStock.ts';

export const EQUIPMENT_SCHEMA_VERSION = 2;

const ZERO_ATTRS: Attributes = { str: 0, dex: 0, agi: 0, vit: 0, int: 0, wis: 0, luk: 0 };

// Legacy pre-multi-slot key (one save per browser, no slot concept) — still
// read as a fallback for slot 0 so nobody's local cache silently vanishes
// just from this rework; the real migration of that single old save into a
// proper cloud slot happens once, in App.tsx, right after login.
const LEGACY_CHAR_KEY = 'rm_character_v1';
function charKey(slot: number): string { return `rm_character_v1_slot${slot}`; }
export const MAX_CHARACTER_SLOTS = 10;

// The Assassino class was renamed to Ladino when the class roster expanded —
// old saves/rankings referencing the old id are remapped transparently.
function migrateClassId(id: string): string {
  return id === 'assassino' ? 'ladino' : id;
}

// Old saves may have items from before the weapon-only-slot rework, or from
// before the base-tier/offhand/accessory-domain rework, missing the newer
// bonus fields entirely — back-fill with 0 (or tier 1, the bottom rung of
// the ladder) rather than let NaN leak into every stat sum downstream.
// Input is raw parsed JSON, hence `any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateItem(item: any): EquipmentItem {
  const oldVersion = item.itemSchemaVersion ?? 1;
  const secondaryStats = (Array.isArray(item.secondaryStats)
    ? item.secondaryStats
    : item.secondaryStat ? [item.secondaryStat] : []).map((stat: any) => {
    const ratios: Record<string, number> = {
      crit: 0.40, critDmg: 0.55, block: 0.48, evasion: 0.40, accuracy: 0.342857,
      tenacity: 0.40, speed: 0.50, lifesteal: 0.30, thorns: 0.533333, cdr: 0.458333,
    };
    const ratio = oldVersion < EQUIPMENT_SCHEMA_VERSION ? ratios[stat.type] : undefined;
    return { ...stat, value: ratio === undefined ? stat.value : stat.value * ratio };
  });
  const primary = {
    dmgBonus: item.dmgBonus ?? 0, defBonus: item.defBonus ?? 0, hpBonus: item.hpBonus ?? 0,
    matkBonus: item.matkBonus ?? 0, mdefBonus: item.mdefBonus ?? 0,
    critChanceBonus: item.critChanceBonus ?? 0, critDmgBonus: item.critDmgBonus ?? 0, cdrBonus: item.cdrBonus ?? 0,
  };
  if (oldVersion < EQUIPMENT_SCHEMA_VERSION && item.slot === 'accessory') {
    if (item.accessoryType === 'anel') {
      primary.critChanceBonus *= 0.44;
      primary.critDmgBonus *= 0.45;
    } else if (item.accessoryType === 'amuleto') {
      primary.hpBonus *= 0.70;
      primary.defBonus *= 0.75;
      primary.mdefBonus *= 0.75;
    } else if (item.accessoryType === 'bracelete') {
      primary.dmgBonus *= 0.458333;
      primary.matkBonus *= 0.458333;
    }
  }
  return {
    id: item.id, name: item.name, classId: migrateClassId(item.classId) as ClassId, rarity: item.rarity, slot: item.slot ?? 'weapon',
    tier: Math.max(1, Math.min(11, item.tier ?? 1)), itemSchemaVersion: EQUIPMENT_SCHEMA_VERSION, accessoryType: item.accessoryType,
    ...primary,
    // Pre-multi-affix saves had a single optional `secondaryStat` object
    // instead of an array — wrap it into a 1-element array rather than lose
    // that item's one rolled affix on load.
    secondaryStats,
    enhanceLevel: item.enhanceLevel ?? 0,
    // These three were missing from this whitelist entirely — every reload
    // (localStorage OR the Supabase cloud round-trip, both go through this
    // same function) silently wiped any Forja affix progress (affixBoosts),
    // the original-affix-count Resetar needs, and an inventory item's grid
    // position (repackInventory papered over that last one by re-placing
    // the item somewhere, so it never crashed, just quietly moved/reset
    // things a reload shouldn't touch).
    affixBoosts: item.affixBoosts,
    originalAffixCount: item.originalAffixCount,
    gridX: item.gridX,
    gridY: item.gridY,
    identified: item.identified ?? true,
  };
}

// Saves from before the class/skill/equipment rework may be missing fields
// (or reference a class that no longer exists) — back-fill or discard rather
// than let the app crash on an old save. Shared by loadCharacter (localStorage)
// and App.tsx's cloud-fetch effect (Supabase) — a character can reach this
// app from either source, and a row saved to the cloud before some later
// schema change (e.g. the multi-affix rework) is just as "old" as a stale
// localStorage entry, so it needs the exact same back-fill, not a narrower
// one. Input is raw parsed JSON/DB data, hence `any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateCharacter(raw: any): Character | null {
  try {
    const c = raw as Character;
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

    // Saves from before the potion cap could have stockpiled more than
    // MAX_POTIONS — clamp down rather than let the cap only apply going
    // forward, and back-fill the auto-use threshold new saves get by default.
    const potions = Math.min(c.potions ?? 1, MAX_POTIONS);
    const potionThreshold = c.potionThreshold ?? 0.3;
    // Runas de Aprimoramento are a brand-new resource — old saves simply
    // have none yet.
    const runes = c.runes ?? [];

    // Saves from before the Mercador redesign have no stock at all — roll a
    // fresh one rather than leave the shop empty until the next time-based
    // refresh is due.
    const merchantStock = c.merchantStock
      ? repackInventory(c.merchantStock.map(migrateItem), STOCK_COLS)
      : generateMerchantStock({ ...c, classId, level } as Character);
    // Saves from before the time-based refresh existed read as "due for a
    // refresh immediately" (0), rather than granting a full free hour.
    const merchantRefreshedAt = c.merchantRefreshedAt ?? 0;

    return {
      ...c,
      equipmentSchemaVersion: EQUIPMENT_SCHEMA_VERSION,
      classId,
      level,
      matk,
      mdef,
      potions,
      potionThreshold,
      skillPoints: (c.skillPoints ?? 0) + refundedPoints,
      attributePoints,
      allocatedAttrs,
      unlockedSkills,
      equippedAbilities,
      abilityThresholds: c.abilityThresholds ?? {},
      equipment: {
        weapon: eq.weapon ? migrateItem(eq.weapon) : null,
        body: eq.body ? migrateItem(eq.body) : null,
        legs: eq.legs ? migrateItem(eq.legs) : null,
        hands: eq.hands ? migrateItem(eq.hands) : null,
        offhand: eq.offhand ? migrateItem(eq.offhand) : null,
        accessory: eq.accessory ? migrateItem(eq.accessory) : null,
      },
      // Old saves have no gridX/gridY at all, and a slot-footprint rebalance
      // could invalidate previously-saved positions anyway — repacking from
      // scratch on every load is cheap and guarantees no overlaps either way.
      inventory: repackInventory((c.inventory ?? []).map(migrateItem)),
      runes,
      merchantStock,
      merchantRefreshedAt,
    };
  } catch { return null; }
}

export function loadCharacter(slot: number): Character | null {
  const raw = localStorage.getItem(charKey(slot)) ?? (slot === 0 ? localStorage.getItem(LEGACY_CHAR_KEY) : null);
  if (!raw) return null;
  try { return migrateCharacter(JSON.parse(raw)); } catch { return null; }
}

export function saveCharacter(slot: number, c: Character): void {
  try { localStorage.setItem(charKey(slot), JSON.stringify(c)); } catch { /* ignore */ }
}

export function clearCharacter(slot: number): void {
  try {
    localStorage.removeItem(charKey(slot));
    if (slot === 0) localStorage.removeItem(LEGACY_CHAR_KEY);
  } catch { /* ignore */ }
}

// Loja de Prestígio's local cache — account-wide, so unlike character saves
// this key isn't slot-scoped at all. Same local-first/cloud-authoritative
// pattern as characters: read instantly from here, then App.tsx reconciles
// against Supabase once the session is known.
const PROFILE_KEY = 'rm_profile_v1';
export function loadProfile(): ProfileState {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { prestige: 0, ownedCosmetics: [], equippedCosmetic: null, vaultItems: [] };
    const p = JSON.parse(raw) as Partial<ProfileState>;
    return {
      prestige: p.prestige ?? 0, ownedCosmetics: p.ownedCosmetics ?? [], equippedCosmetic: p.equippedCosmetic ?? null,
      vaultItems: (p.vaultItems ?? []).map(migrateItem),
    };
  } catch { return { prestige: 0, ownedCosmetics: [], equippedCosmetic: null, vaultItems: [] }; }
}
export function saveProfileLocal(p: ProfileState): void {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}
