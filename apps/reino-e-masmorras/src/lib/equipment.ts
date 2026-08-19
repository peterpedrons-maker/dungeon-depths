import { AccessoryType, ClassId, EquipmentItem, ItemSlot, Rarity, SecondaryStatType } from '../types/game';
import { CLASSES } from './classes';
import {
  ACCESSORY_NOUN, ACCESSORY_STAT_POOL, ACCESSORY_TYPES, ARMOR_NOUN, OFFHAND_KIND, OFFHAND_NOUN,
  WEIGHT_GROUP, tierName,
} from './itemTiers';

interface RarityDef { id: Rarity; name: string; color: string; weight: number; mult: number; }
export const RARITIES: RarityDef[] = [
  { id: 'comum', name: 'Comum', color: '#b8ada0', weight: 55, mult: 1.0 },
  { id: 'incomum', name: 'Incomum', color: '#4f9d4f', weight: 27, mult: 1.3 },
  { id: 'raro', name: 'Raro', color: '#3f7ab8', weight: 12, mult: 1.7 },
  { id: 'epico', name: 'Épico', color: '#9b4fc9', weight: 5, mult: 2.3 },
  { id: 'legendario', name: 'Legendário', color: '#e0a030', weight: 1, mult: 3.2 },
];

// Rarity prefixes/suffixes wrap around whatever base-tier name the item
// already has (e.g. "Espada de Aço Élfica") — rarity no longer picks the
// item's name on its own, it only decorates the base type from lib/itemTiers.ts.
const PREFIXES: Record<Rarity, string[]> = {
  comum: ['Enferrujada', 'Simples', 'Rústica'],
  incomum: ['Afiada', 'Reforçada', 'Batida'],
  raro: ['Élfica', 'Rúnica', 'do Templário'],
  epico: ['Sagrada', 'Amaldiçoada', 'do Abismo'],
  legendario: ['Lendária', 'Divina', 'do Fim dos Tempos'],
};
const SUFFIXES = ['do Dragão', 'da Aurora', 'das Sombras', 'do Rei Eterno', 'da Tempestade'];

export const SLOT_NAMES: Record<ItemSlot, string> = {
  weapon: 'Arma', body: 'Corpo', legs: 'Pernas', hands: 'Mãos', offhand: 'Mão Secundária', accessory: 'Acessório',
};

// How strongly each slot rolls its flat primary stat relative to a weapon's
// flat damage roll — body is the main armor piece, hands the lightest, and a
// shield sits below a full armor piece since it's only ever the off hand.
const DEF_SLOT_SCALE: Record<'body' | 'legs' | 'hands', number> = {
  body: 0.6, legs: 0.45, hands: 0.35,
};
const SHIELD_SCALE = 0.5;
const FOCO_SCALE = 1;

// Per-stat-type scale applied to an accessory's themed primary roll — keeps
// chance-based stats (crit/critDmg, stored as 0-1 fractions) from rolling as
// large raw numbers as flat stats like hp.
const ACCESSORY_PRIMARY_SCALE: Partial<Record<SecondaryStatType, number>> = {
  crit: 0.5, critDmg: 0.8, hp: 4, def: 1, mdef: 1, atk: 1.2, matk: 1.2,
};

// Every item rolls exactly one affix (secondary stat) on top of its primary,
// regardless of slot or theme — gives every item a chance at a hybrid stat.
const FULL_SECONDARY_POOL: SecondaryStatType[] = ['crit', 'critDmg', 'def', 'mdef', 'hp', 'block', 'atk', 'matk'];

// Per-stat-type scale applied to an item's affix roll — smaller than a
// primary stat's own scale (an affix is a bonus, not the main stat), but
// reuses the exact same rollPrimaryValue growth curve so the same stat type
// never reads the same twice across rarities/tiers: a comum tier-1 "+FOR"
// affix and a legendário tier-10 one on the same stat type are worlds apart.
const AFFIX_SCALE: Record<SecondaryStatType, number> = {
  crit: 0.3, critDmg: 0.4, block: 0.25, hp: 2, def: 0.5, mdef: 0.5, atk: 0.5, matk: 0.5,
};

function pickRarity(): RarityDef {
  const total = RARITIES.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const r of RARITIES) {
    if (roll < r.weight) return r;
    roll -= r.weight;
  }
  return RARITIES[0];
}

function rarityIndex(id: Rarity): number {
  return RARITIES.findIndex((r) => r.id === id);
}

function baseNounFor(slot: ItemSlot, classId: ClassId, accessoryType?: AccessoryType): string {
  const c = CLASSES[classId];
  if (slot === 'weapon') return c.weaponBase;
  if (slot === 'body' || slot === 'legs' || slot === 'hands') return ARMOR_NOUN[WEIGHT_GROUP[classId]][slot];
  if (slot === 'offhand') {
    const kind = OFFHAND_KIND[classId];
    return kind ? OFFHAND_NOUN[kind] : 'Item Misterioso';
  }
  return ACCESSORY_NOUN[accessoryType ?? 'anel'];
}

// Same base roll for every slot, just scaled differently — a weapon's flat
// damage and an accessory's flat HP need very different magnitudes to feel
// meaningful next to the class's base stats. baseTier (1-10, from the
// dungeon it dropped in — see DungeonDef.itemTier) replaces the old in-run
// depth counter as the power-progression driver. The per-tier term is
// deliberately steep (6.5/tier, not 2) — this is the "buff gear" half of
// the balance pass alongside the attribute diminishing-returns curve in
// combatStats.ts: a tier-5 legendary weapon now contributes roughly as
// much ATK as a level-60 character's own attribute investment, instead of
// a fraction of it, so gear choice is a real part of a build's power
// rather than a rounding error next to level/attributes.
function rollPrimaryValue(baseTier: number, mult: number, scale: number): number {
  const roll = 3 + Math.floor(Math.random() * 5) + baseTier * 6.5;
  return Math.round(roll * mult * scale);
}

type PrimaryFields = Pick<EquipmentItem, 'dmgBonus' | 'defBonus' | 'hpBonus' | 'matkBonus' | 'mdefBonus' | 'critChanceBonus' | 'critDmgBonus'>;
const ZERO_PRIMARY: PrimaryFields = { dmgBonus: 0, defBonus: 0, hpBonus: 0, matkBonus: 0, mdefBonus: 0, critChanceBonus: 0, critDmgBonus: 0 };

function primaryFieldsFor(
  slot: ItemSlot, classId: ClassId, baseTier: number, rarityMult: number, qualityMult: number, accessoryType?: AccessoryType,
): Partial<PrimaryFields> {
  if (slot === 'weapon') {
    return { dmgBonus: Math.round(rollPrimaryValue(baseTier, rarityMult, 1) * qualityMult) };
  }
  if (slot === 'body' || slot === 'legs' || slot === 'hands') {
    return { defBonus: Math.round(rollPrimaryValue(baseTier, rarityMult, DEF_SLOT_SCALE[slot]) * qualityMult) };
  }
  if (slot === 'offhand') {
    const kind = OFFHAND_KIND[classId];
    if (kind === 'shield') return { defBonus: Math.round(rollPrimaryValue(baseTier, rarityMult, SHIELD_SCALE) * qualityMult) };
    if (kind === 'foco') return { matkBonus: Math.round(rollPrimaryValue(baseTier, rarityMult, FOCO_SCALE) * qualityMult) };
    return {};
  }
  // accessory — rolls one stat from its themed pool as the primary
  const pool = ACCESSORY_STAT_POOL[accessoryType ?? 'anel'];
  const statType = pool[Math.floor(Math.random() * pool.length)];
  const raw = rollPrimaryValue(baseTier, rarityMult, ACCESSORY_PRIMARY_SCALE[statType] ?? 1) * qualityMult;
  switch (statType) {
    case 'crit': return { critChanceBonus: Math.round(raw) / 100 };
    case 'critDmg': return { critDmgBonus: Math.round(raw) / 100 };
    case 'hp': return { hpBonus: Math.round(raw) };
    case 'def': return { defBonus: Math.round(raw) };
    case 'mdef': return { mdefBonus: Math.round(raw) };
    case 'atk': return { dmgBonus: Math.round(raw) };
    case 'matk': return { matkBonus: Math.round(raw) };
    default: return {};
  }
}

// Every item — comum included — gets exactly one affix; only its magnitude
// changes across rarities/tiers, never whether it's present at all.
function rollSecondaryStat(baseTier: number, rarityMult: number, pool: SecondaryStatType[]): EquipmentItem['secondaryStat'] {
  const type = pool[Math.floor(Math.random() * pool.length)];
  const raw = rollPrimaryValue(baseTier, rarityMult, AFFIX_SCALE[type]);
  const value = (type === 'crit' || type === 'critDmg' || type === 'block') ? raw / 100 : raw;
  return { type, value };
}

let _iid = 0;

// baseTier (1-10) comes from the dungeon the item dropped in (or, for the
// Mercador, the toughest dungeon the player currently qualifies for — see
// highestAccessibleItemTier in lib/dungeons.ts) and drives both the item's
// base name (lib/itemTiers.ts) and the magnitude of its primary stat.
// qualityBonusPct comes from the kingdom's Forja building — a flat % bonus
// stacked on top of the item's rolled primary stat. forcedRarity skips the
// normal weighted roll entirely — used for a brand-new character's
// guaranteed starter gear (see createCharacter in lib/classes.ts), which
// always wants exactly comum, never whatever pickRarity() would've rolled.
export function generateItem(slot: ItemSlot, classId: ClassId, baseTier: number, qualityBonusPct = 0, forcedRarity?: Rarity): EquipmentItem {
  const rarity = forcedRarity ? RARITIES.find((r) => r.id === forcedRarity)! : pickRarity();
  const rarityTier = rarityIndex(rarity.id);
  const accessoryType = slot === 'accessory' ? ACCESSORY_TYPES[Math.floor(Math.random() * ACCESSORY_TYPES.length)] : undefined;
  const base = tierName(baseNounFor(slot, classId, accessoryType), baseTier);
  const prefix = PREFIXES[rarity.id][Math.floor(Math.random() * PREFIXES[rarity.id].length)];
  const name = rarityTier >= 3
    ? `${base} ${prefix} ${SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]}`
    : `${base} ${prefix}`;

  const qualityMult = 1 + qualityBonusPct;
  const primary = primaryFieldsFor(slot, classId, baseTier, rarity.mult, qualityMult, accessoryType);

  return {
    id: `i${++_iid}_${Date.now()}`, name, classId, slot, rarity: rarity.id, tier: baseTier,
    accessoryType,
    ...ZERO_PRIMARY, ...primary,
    secondaryStat: rollSecondaryStat(baseTier, rarity.mult, FULL_SECONDARY_POOL),
    enhanceLevel: 0,
  };
}

export function sellValue(item: EquipmentItem): number {
  const tier = rarityIndex(item.rarity);
  return 6 + tier * 8 + item.enhanceLevel * 4;
}

export function rarityColor(r: Rarity): string {
  return RARITIES.find((x) => x.id === r)?.color ?? '#b8ada0';
}
export function rarityName(r: Rarity): string {
  return RARITIES.find((x) => x.id === r)?.name ?? 'Comum';
}
export function rarityMult(r: Rarity): number {
  return RARITIES.find((x) => x.id === r)?.mult ?? 1;
}

// `#rrggbb` -> `rgba(r,g,b,alpha)` — used to tint an item slot's background
// by its own rarity color at a low alpha, instead of every slot sharing one
// fixed neutral blue regardless of what's in it.
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
