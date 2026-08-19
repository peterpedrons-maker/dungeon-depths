import { AccessoryType, ClassId, EquipmentItem, ItemSlot, Rarity, SecondaryStatType } from '../types/game';
import { CLASSES, MAGICAL_CLASSES } from './classes';
import {
  ACCESSORY_NOUN, ACCESSORY_STAT_POOL, ACCESSORY_TYPES, ARMOR_NOUN, OFFHAND_KIND, OFFHAND_NOUN,
  WEIGHT_GROUP, tierName,
} from './itemTiers';

// multMin/multMax replaced a single fixed `mult` — each item now rolls its
// own quality within its rarity's band instead of every item of a rarity
// hitting the exact same number. Bands deliberately overlap (incomum's top
// end sits inside raro's range, raro's inside épico's, ...) so a lucky roll
// on a lower rarity can occasionally rival an unlucky roll one tier up —
// the "magic item that's still relevant" moment ARPGs lean on. This is
// layered on top of tier (see rollPrimaryValue) being the real progression
// axis; rarity is the variance layer within a tier, not the power axis
// itself — a raro from a higher-tier dungeon already outscales a legendário
// from a lower-tier one on tier alone, same as before this change.
interface RarityDef { id: Rarity; name: string; color: string; weight: number; multMin: number; multMax: number; }
export const RARITIES: RarityDef[] = [
  { id: 'comum', name: 'Comum', color: '#b8ada0', weight: 55, multMin: 1.0, multMax: 1.0 },
  { id: 'incomum', name: 'Incomum', color: '#4f9d4f', weight: 27, multMin: 0.8, multMax: 1.3 },
  { id: 'raro', name: 'Raro', color: '#3f7ab8', weight: 12, multMin: 1.1, multMax: 1.8 },
  { id: 'epico', name: 'Épico', color: '#9b4fc9', weight: 5, multMin: 1.5, multMax: 2.3 },
  { id: 'legendario', name: 'Legendário', color: '#e0a030', weight: 1, multMin: 2.0, multMax: 3.5 },
];

// How many affixes (secondaryStats entries) an item of each rarity rolls —
// a range, not a fixed count, so two items of the same rarity can still feel
// different. Sampled without repeats from the slot's affix pool below.
const AFFIX_COUNT_RANGE: Record<Rarity, [number, number]> = {
  comum: [1, 3], incomum: [2, 3], raro: [2, 4], epico: [3, 5], legendario: [4, 6],
};

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

// Which slot each item rolls its affixes from — themed so gear finally has
// an identity beyond "bigger number": Corpo/Pernas lean defensive-mobile,
// Mãos leans offense/utility, a escudo leans block/magic-resist since Bloqueio
// lost its attribute source entirely (see combatStats.ts), a foco leans
// caster-support, and Acessório stays the "build customization" slot with
// the widest pool of all. itemFind/itemQuality (loot luck) are appended
// separately, gated to raro+ (see LUCK_AFFIXES below) — a comum/incomum item
// finding more loot for you felt like too generous a gift for the rarity
// that's supposed to still feel middling.
const SLOT_AFFIX_POOL: Record<'weapon' | 'body' | 'legs' | 'hands' | 'shield' | 'foco' | 'accessory', SecondaryStatType[]> = {
  weapon: ['crit', 'critDmg', 'atk', 'matk', 'accuracy', 'lifesteal'],
  body: ['def', 'mdef', 'hp', 'tenacity', 'thorns'],
  legs: ['def', 'hp', 'evasion', 'speed'],
  hands: ['crit', 'critDmg', 'accuracy', 'cdr'],
  shield: ['def', 'mdef', 'block', 'tenacity'],
  foco: ['matk', 'mdef', 'cdr', 'tenacity'],
  accessory: [
    'crit', 'critDmg', 'def', 'mdef', 'hp', 'block', 'atk', 'matk',
    'evasion', 'accuracy', 'tenacity', 'speed', 'lifesteal', 'thorns', 'cdr',
  ],
};
const LUCK_AFFIXES: SecondaryStatType[] = ['itemFind', 'itemQuality'];
const LUCK_AFFIX_MIN_RARITY_INDEX = 2; // raro (0=comum, 1=incomum, 2=raro, ...)

function affixPoolKeyFor(slot: ItemSlot, classId: ClassId): keyof typeof SLOT_AFFIX_POOL | null {
  if (slot === 'weapon' || slot === 'body' || slot === 'legs' || slot === 'hands' || slot === 'accessory') return slot;
  const kind = OFFHAND_KIND[classId];
  return kind ?? null;
}

// Percent-fraction affixes (stored 0-1, same convention as their equivalent
// CombatStats field) vs. flat-number ones — mirrors the old crit/critDmg/
// block special-case, just widened to every new affix-only stat type.
const PCT_AFFIX_TYPES = new Set<SecondaryStatType>([
  'crit', 'critDmg', 'block', 'evasion', 'accuracy', 'tenacity', 'speed', 'lifesteal', 'thorns', 'cdr', 'itemFind', 'itemQuality',
]);

// Per-stat-type scale applied to an item's affix roll — smaller than a
// primary stat's own scale (an affix is a bonus, not the main stat), but
// reuses the exact same rollPrimaryValue growth curve so the same stat type
// never reads the same twice across rarities/tiers: a comum tier-1 "+FOR"
// affix and a legendário tier-10 one on the same stat type are worlds apart.
// Velocidade/Redução de Recarga/Roubo de Vida roll conservatively (0.12-0.15)
// since they're strong per-point and already stack with attributes/talentos;
// sorte de item stays modest too since it's pure loot-rate, not combat power.
const AFFIX_SCALE: Record<SecondaryStatType, number> = {
  crit: 0.3, critDmg: 0.4, block: 0.25, hp: 2, def: 0.5, mdef: 0.5, atk: 0.5, matk: 0.5,
  evasion: 0.25, accuracy: 0.25, tenacity: 0.25, speed: 0.12, lifesteal: 0.15, thorns: 0.3, cdr: 0.12,
  itemFind: 0.15, itemQuality: 0.15,
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

// Armor no longer always rolls Defesa as its primary — each slot picks from
// a small themed pool of the *existing* primary fields (no new stat types
// invented just for this), so "every armor piece is just defense" stops
// being true: Corpo/Pernas can come up as a pure HP roll or (Corpo only) a
// Defesa Mágica roll, and Mãos always rolls the class's crit identity
// instead of defense at all — gloves rolling crit/dano crítico is the
// genre's own convention. Scale keeps each option roughly the same overall
// magnitude as the old always-defBonus roll: hp uses the accessory's own
// hp-vs-def ratio (4x, same numbers already used for Amuleto), crit/critDmg
// reuse the accessory ratios too (0.5x/0.8x) scaled down by the slot's own
// DEF_SLOT_SCALE so Mãos stays the lightest armor piece either way.
const ARMOR_PRIMARY_POOL: Record<'body' | 'legs' | 'hands', { field: keyof PrimaryFields; scale: number; isPct: boolean }[]> = {
  body: [
    { field: 'defBonus', scale: DEF_SLOT_SCALE.body, isPct: false },
    { field: 'hpBonus', scale: DEF_SLOT_SCALE.body * 4, isPct: false },
    { field: 'mdefBonus', scale: DEF_SLOT_SCALE.body, isPct: false },
  ],
  legs: [
    { field: 'defBonus', scale: DEF_SLOT_SCALE.legs, isPct: false },
    { field: 'hpBonus', scale: DEF_SLOT_SCALE.legs * 4, isPct: false },
  ],
  hands: [
    { field: 'critChanceBonus', scale: DEF_SLOT_SCALE.hands * 0.5, isPct: true },
    { field: 'critDmgBonus', scale: DEF_SLOT_SCALE.hands * 0.8, isPct: true },
  ],
};

function primaryFieldsFor(
  slot: ItemSlot, classId: ClassId, baseTier: number, rarityMult: number, qualityMult: number, accessoryType?: AccessoryType,
): Partial<PrimaryFields> {
  if (slot === 'weapon') {
    // Magic classes' basic attack already rolls off matk, not atk (see
    // MAGICAL_CLASSES in classes.ts, applied in DungeonPanel's plain-attack
    // branch) — their weapon's own primary stat needs to feed the same
    // resource, or a Mago's Cajado would roll a physical-attack number their
    // basic swing never actually uses.
    const isMagicWeapon = MAGICAL_CLASSES.includes(classId);
    const raw = Math.round(rollPrimaryValue(baseTier, rarityMult, 1) * qualityMult);
    return isMagicWeapon ? { matkBonus: raw } : { dmgBonus: raw };
  }
  if (slot === 'body' || slot === 'legs' || slot === 'hands') {
    const options = ARMOR_PRIMARY_POOL[slot];
    const choice = options[Math.floor(Math.random() * options.length)];
    const raw = rollPrimaryValue(baseTier, rarityMult, choice.scale) * qualityMult;
    return { [choice.field]: choice.isPct ? Math.round(raw) / 100 : Math.round(raw) };
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

// Every item gets 1+ affixes (see AFFIX_COUNT_RANGE) sampled without repeats
// from `pool` — a Fisher-Yates-ish shuffle-and-slice, so a 6-affix legendário
// can't roll the same stat type twice just because the pool is small.
function rollSecondaryStats(baseTier: number, rarityMult: number, pool: SecondaryStatType[], count: number): EquipmentItem['secondaryStats'] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((type) => {
    const raw = rollPrimaryValue(baseTier, rarityMult, AFFIX_SCALE[type]);
    const value = PCT_AFFIX_TYPES.has(type) ? raw / 100 : raw;
    return { type, value };
  });
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
  // One roll governs the whole item's luck — primary AND every affix reuse
  // it, instead of each stat re-rolling its own independent quality, so
  // "this item rolled well" reads as one consistent fact about the item, not
  // a coin flip per line.
  const rolledMult = rarity.multMin + Math.random() * (rarity.multMax - rarity.multMin);
  const accessoryType = slot === 'accessory' ? ACCESSORY_TYPES[Math.floor(Math.random() * ACCESSORY_TYPES.length)] : undefined;
  const base = tierName(baseNounFor(slot, classId, accessoryType), baseTier);
  const prefix = PREFIXES[rarity.id][Math.floor(Math.random() * PREFIXES[rarity.id].length)];
  const name = rarityTier >= 3
    ? `${base} ${prefix} ${SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]}`
    : `${base} ${prefix}`;

  const qualityMult = 1 + qualityBonusPct;
  const primary = primaryFieldsFor(slot, classId, baseTier, rolledMult, qualityMult, accessoryType);

  const poolKey = affixPoolKeyFor(slot, classId);
  let pool = poolKey ? SLOT_AFFIX_POOL[poolKey] : [];
  if (rarityTier >= LUCK_AFFIX_MIN_RARITY_INDEX) pool = [...pool, ...LUCK_AFFIXES];
  const [minCount, maxCount] = AFFIX_COUNT_RANGE[rarity.id];
  const count = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));

  return {
    id: `i${++_iid}_${Date.now()}`, name, classId, slot, rarity: rarity.id, tier: baseTier,
    accessoryType,
    ...ZERO_PRIMARY, ...primary,
    secondaryStats: rollSecondaryStats(baseTier, rolledMult, pool, count),
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
// Items no longer carry one fixed mult (each rolls its own within the
// rarity's band — see generateItem) — this returns the band's midpoint,
// good enough for pricing (see merchantStock.ts), which only needs a
// representative number per rarity, not any one item's exact roll.
export function rarityMult(r: Rarity): number {
  const def = RARITIES.find((x) => x.id === r);
  return def ? (def.multMin + def.multMax) / 2 : 1;
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
