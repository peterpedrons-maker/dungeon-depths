import type { CSSProperties } from 'react';
import { AccessoryType, ClassId, EquipmentItem, ItemSlot, Rarity, SecondaryStatType } from '../types/game';
import { CLASSES, MAGICAL_CLASSES } from './classes';
import {
  ACCESSORY_NOUN, ACCESSORY_STAT_POOL, ACCESSORY_TYPES, ARMOR_NOUN, MAX_TIER, MERCHANT_RARITY_PRICE_MULT,
  OFFHAND_KIND, OFFHAND_NOUN, WEIGHT_GROUP, merchantBasePrice, tierName,
} from './itemTiers';

// multMin/multMax roll its own quality within its rarity's band instead of
// every item of a rarity hitting the exact same number. Bands deliberately
// overlap — a lucky roll on a lower rarity can occasionally rival, or even
// beat, an unlucky roll one or two tiers up (Raro can outroll Épico,
// Incomum can outroll Raro, a Comum can even reach a Raro on a good day) —
// the "magic item that's still relevant" moment ARPGs lean on. Lendário is
// the one rarity that's deliberately walled off from this at the low end:
// its floor (1.50x) sits above every other rarity's ceiling, so nothing
// below it can ever roll higher on this axis alone — see AFFIX_COUNT_RANGE
// below for the other half of that guarantee (a Lendário's affix-count
// floor was raised to close a similar gap on that axis). This is layered on
// top of tier being the real progression axis; rarity is the variance layer
// within a tier, not the power axis itself — see rollPrimaryValue's own
// tier-growth cut for why a single rarity roll still can't double a
// character's power on its own the way the old, much wider bands
// (Lendário reaching 3.5x) could.
interface RarityDef { id: Rarity; name: string; color: string; weight: number; multMin: number; multMax: number; }
export const RARITIES: RarityDef[] = [
  { id: 'comum', name: 'Comum', color: '#b8ada0', weight: 55, multMin: 0.90, multMax: 1.30 },
  { id: 'incomum', name: 'Incomum', color: '#4f9d4f', weight: 27, multMin: 1.00, multMax: 1.38 },
  { id: 'raro', name: 'Raro', color: '#3f7ab8', weight: 12, multMin: 1.18, multMax: 1.55 },
  { id: 'epico', name: 'Épico', color: '#9b4fc9', weight: 5, multMin: 1.34, multMax: 1.85 },
  { id: 'legendario', name: 'Legendário', color: '#e0a030', weight: 1, multMin: 1.50, multMax: 2.10 },
];

// How many affixes (secondaryStats entries) an item of each rarity rolls —
// a range, not a fixed count, so two items of the same rarity can still feel
// different. Sampled without repeats from the slot's affix pool below.
// Cut down from the original (up to 6 on a Lendário) — Tier + raridade +
// qualidade + Forja already stack on the primary roll; letting a single
// item also carry 6 independent affix rolls turned "one great drop" into a
// whole build's worth of power by itself.
// Ranges deliberately overlap wide across rarities now — a Comum can roll
// as low as 0 affixes (a plain, no-frills piece) or as many as a Raro.
// Affix count alone no longer signals rarity on its own — the per-affix
// VALUE still scales with the item's rolled rarity multiplier (see
// RARITIES above), so a Lendário with the same affix count as a Comum
// still hits harder per line; count is now purely a variance knob, not a
// power tier. Lendário's floor is raised to 3 (not 2) specifically so its
// worst-case total (min rarity roll × min affix count) can never fall
// below a Comum or Incomum's best-case total — see the RARITIES comment
// above for the matching floor on the multiplier side of that guarantee.
const AFFIX_COUNT_RANGE: Record<Rarity, [number, number]> = {
  comum: [0, 3], incomum: [1, 3], raro: [1, 4], epico: [2, 4], legendario: [3, 5],
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
// A Foco's second possible primary, alongside matkBonus (see
// primaryFieldsFor's offhand branch) — a caster built around ability uptime
// can now roll a "cooldown focus" instead of a flat magic-power one, the
// same 2-option pattern Mãos already uses for Crítico/Dano Crítico. Set
// above cdr's own AFFIX_SCALE (0.12) since this is a guaranteed primary
// roll, not a rider, but still modest given how strong cdr already reads
// per point in real combat (see AFFIX_SCALE's own comment).
const FOCO_CDR_SCALE = 0.18;

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
// atk/matk/def/mdef/hp were cut (0.5->0.25/0.3, 2->1.1) and accuracy raised
// slightly (0.25->0.35) after simulation showed these "mirror the primary
// attribute" affixes contributing 2-7x the Combat Power of the other
// support-flavored affixes (Crítico/Bloqueio/Evasão/etc.) at the exact same
// rarity roll — a weapon's own dmgBonus already carries the "this item hits
// harder" job; the atk/matk/def/mdef/hp AFFIX shouldn't also dwarf every
// other affix option just because it reuses the same big attribute weight.
const AFFIX_SCALE: Record<SecondaryStatType, number> = {
  crit: 0.3, critDmg: 0.4, block: 0.25, hp: 1.1, def: 0.3, mdef: 0.3, atk: 0.25, matk: 0.25,
  evasion: 0.25, accuracy: 0.35, tenacity: 0.25, speed: 0.12, lifesteal: 0.15, thorns: 0.3, cdr: 0.12,
  itemFind: 0.15, itemQuality: 0.15,
};

// Odds shift with the item's own tier instead of every tier rolling the
// same split — but the low end was raised a lot (2026 pass, user feedback:
// raro/épico/lendário felt "basically impossible" this early) while the high
// end was left untouched, so the CURVE got gentler instead of just sliding
// up: tier 1's raro/épico/lendário odds are now a real, if still uncommon,
// possibility instead of a lottery ticket, while tier MAX_TIER is exactly as
// hard-won as before — "início: mais fácil de ver algo bom cedo; fim:
// lendário continua sendo o item que você caça por último."
// This is the other half of the drop-rate rework alongside
// baseDropChanceForLevel below: fewer drops at high level, but each one is
// more likely to matter, instead of the same trickle of mostly-comum items
// forever.
// This is the REGULAR-enemy table specifically — every rarity above comum
// stays strictly at or below pickBossDropRarity's own fixed weights (see
// below) at both ends of the tier range, so a boss kill is always at least
// as likely to drop something good as farming trash ever is, no matter how
// deep into a dungeon's tier ladder that trash sits. applyLuckBoost below
// scales both tables by the exact same per-rarity factor, so that ordering
// survives any amount of Sorte/Qualidade dos Itens too.
const RARITY_WEIGHTS_LOW_TIER = [78, 15, 5, 1.7, 0.3]; // tier 1
// Lendário's high-tier weight sits at 0.45, not the boss table's 0.50 — with
// applyLuckBoost's differing comum/incomum split between this table and
// pickBossDropRarity's, a flat 0.50/0.50 tie at tier MAX_TIER could invert
// under normalization once luck scales both, letting farming trash edge out
// a guaranteed boss kill; this keeps a hair of margin so that never happens.
const RARITY_WEIGHTS_HIGH_TIER = [72, 19, 6.5, 2, 0.45]; // tier MAX_TIER

// Sorte (LUK) and the Qualidade dos Itens affix already boost how good an
// item's own stat roll is (qualityMult, see generateItem below) — this is
// the second half of the same feedback: the same qualityBonusPct value now
// also nudges which RARITY gets picked, shifting weight away from
// comum/incomum and toward raro/épico/lendário. Capped well short of "no
// amount of Sorte guarantees anything" — a maxed-out luck build meaningfully
// improves its odds without turning rarity into a non-issue. Shared between
// pickRarityForTier and pickBossDropRarity so a lucky boss kill scales up
// the exact same way a lucky trash drop does.
const LUCK_RARITY_BOOST_CAP = 0.6;
function applyLuckBoost(weights: number[], qualityBonusPct: number): number[] {
  const boost = Math.max(0, Math.min(LUCK_RARITY_BOOST_CAP, qualityBonusPct));
  return weights.map((w, i) => w * (i >= 2 ? 1 + boost * 1.5 : 1 - boost * 0.35));
}

function pickRarityForTier(tier: number, qualityBonusPct = 0): RarityDef {
  const t = Math.max(0, Math.min(1, (tier - 1) / (MAX_TIER - 1)));
  const base = RARITY_WEIGHTS_LOW_TIER.map((low, i) => low + (RARITY_WEIGHTS_HIGH_TIER[i] - low) * t);
  const weights = applyLuckBoost(base, qualityBonusPct);
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < RARITIES.length; i++) {
    if (roll < weights[i]) return RARITIES[i];
    roll -= weights[i];
  }
  return RARITIES[0];
}

// Fixed (not tier-interpolated) rarity split for a boss/elite's guaranteed
// drop — user-specified directly, unrelated to the dungeon's own item tier,
// so a Ruínas boss and an Arena boss roll from the exact same table. Every
// non-comum weight here sits at or above pickRarityForTier's own ceiling
// (see RARITY_WEIGHTS_HIGH_TIER above), so a guaranteed boss/elite drop is
// never a worse bet than a lucky trash-mob roll.
const BOSS_RARITY_WEIGHTS = [70, 20, 7, 2.5, 0.5];

export function pickBossDropRarity(qualityBonusPct = 0): Rarity {
  const weights = applyLuckBoost(BOSS_RARITY_WEIGHTS, qualityBonusPct);
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < RARITIES.length; i++) {
    if (roll < weights[i]) return RARITIES[i].id;
    roll -= weights[i];
  }
  return RARITIES[0].id;
}

// Keyed by the dungeon's own levelReq (1-60), not itemTier (1-10) — the
// requested curve is specified in level buckets that run all the way to 60
// (5 dungeons' worth of tiers wouldn't have enough resolution), and level is
// also what "dungeon 1-5 / 6-15 / 16-30 / 31-45 / 46-60" naturally maps to
// once regions 3-7 exist. Five buckets, each linearly interpolated across
// its own range, monotonically decreasing overall: "início: mais frequente
// / endgame: menos frequente," paired with pickRarityForTier's rising
// quality curve above so a rarer drop is also a better one, not just a
// rarer version of the same average item. Dungeons with their own dropMult
// (Cripta/Torre/Arena) still multiply on top of this, same as before.
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
export function baseDropChanceForLevel(level: number): number {
  if (level <= 5) return lerp(0.30, 0.25, (level - 1) / 4);
  if (level <= 15) return lerp(0.22, 0.18, (level - 6) / 9);
  if (level <= 30) return lerp(0.16, 0.12, (level - 16) / 14);
  if (level <= 45) return lerp(0.12, 0.08, (level - 31) / 14);
  return lerp(0.09, 0.05, Math.min(1, (level - 46) / 14));
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
// depth counter as the power-progression driver. Cut from the original
// 6.5/tier (which, stacked across rarity, up to 6 affixes, Forja and 6
// equipment slots at once, let gear alone dwarf level/attribute/skill power)
// down to 4/tier — equipment stays a major, but no longer dominant, source
// of power. See the 2026 rebalance pass notes for the full reasoning.
function rollPrimaryValue(baseTier: number, mult: number, scale: number): number {
  const roll = 3 + Math.floor(Math.random() * 5) + baseTier * 4;
  return Math.round(roll * mult * scale);
}

type PrimaryFields = Pick<EquipmentItem, 'dmgBonus' | 'defBonus' | 'hpBonus' | 'matkBonus' | 'mdefBonus' | 'critChanceBonus' | 'critDmgBonus' | 'cdrBonus'>;
const ZERO_PRIMARY: PrimaryFields = { dmgBonus: 0, defBonus: 0, hpBonus: 0, matkBonus: 0, mdefBonus: 0, critChanceBonus: 0, critDmgBonus: 0, cdrBonus: 0 };

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
    if (kind === 'foco') {
      if (Math.random() < 0.5) {
        const raw = rollPrimaryValue(baseTier, rarityMult, FOCO_CDR_SCALE) * qualityMult;
        return { cdrBonus: Math.round(raw) / 100 };
      }
      return { matkBonus: Math.round(rollPrimaryValue(baseTier, rarityMult, FOCO_SCALE) * qualityMult) };
    }
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

// Independent +/-5% wobble applied per affix, on top of the item's shared
// rarity roll — the rarity mult still decides "how good is this item
// overall" (identical across the primary stat and every affix), but each
// affix also gets its own tiny nudge so two lines on the same item don't
// read as literally proportional copies of each other. Deliberately narrow:
// wide enough to give each affix some personality, narrow enough that it
// can't meaningfully reopen the power gap RARITIES' multMin and
// AFFIX_COUNT_RANGE's Lendário floor were raised to close (a Comum/Incomum
// beating a Lendário stays astronomically unlikely, not just "rare").
const AFFIX_VARIANCE_RANGE: [number, number] = [0.95, 1.05];

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
    const variance = AFFIX_VARIANCE_RANGE[0] + Math.random() * (AFFIX_VARIANCE_RANGE[1] - AFFIX_VARIANCE_RANGE[0]);
    const raw = rollPrimaryValue(baseTier, rarityMult * variance, AFFIX_SCALE[type]);
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
// always wants exactly comum, never whatever pickRarityForTier() would've
// rolled, and for a Hunt's guaranteed Raro+ floor (see pickHuntDropRarity
// in DungeonPanel.tsx).
export function generateItem(slot: ItemSlot, classId: ClassId, baseTier: number, qualityBonusPct = 0, forcedRarity?: Rarity): EquipmentItem {
  const rarity = forcedRarity ? RARITIES.find((r) => r.id === forcedRarity)! : pickRarityForTier(baseTier, qualityBonusPct);
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

// Priced as a fraction of the Mercador's own buy price for an equivalent
// item (same tier + rarity — see merchantBasePrice/MERCHANT_RARITY_PRICE_MULT
// in lib/itemTiers.ts) instead of a flat raridade-only formula. A Tier-1 and
// a Tier-10 Lendário used to sell for the same handful of gold despite the
// Mercador charging wildly different prices for them — once buy prices
// actually scale hard with Tier, sell price has to follow or vendoring a
// high-tier item stops being worth doing at all in the late game.
// 2026 rebalance, take three: cut a further ~25% (0.25 -> 0.19) alongside
// the Mercador's own buy prices going up ~50% — selling stayed too close to
// a fast way to fund the next upgrade otherwise.
const SELL_FRACTION = 0.19;
export function sellValue(item: EquipmentItem): number {
  const base = merchantBasePrice(item.tier) * MERCHANT_RARITY_PRICE_MULT[item.rarity];
  return Math.max(1, Math.round(base * SELL_FRACTION + item.enhanceLevel * 4));
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

// Neutral slate-blue used for an empty slot (nothing to tint by rarity yet).
const NEUTRAL_SLOT_BG = 'rgba(96,148,210,0.09)';
const NEUTRAL_SLOT_BG_HOVER = 'rgba(96,148,210,0.17)';
const NEUTRAL_SLOT_BORDER = 'rgba(96,148,210,0.4)';
const NEUTRAL_SLOT_BORDER_HOVER = 'rgba(96,148,210,0.65)';

// Tints an item slot's background/border by the item's own rarity color (via
// CSS custom properties, so callers' existing Tailwind hover: classes still
// work) instead of every slot sharing one fixed neutral blue regardless of
// what's inside — an empty slot (or, for a merchant/loot grid, an unidentified
// one) keeps the neutral look. Shared by CharacterOverview's paperdoll/
// inventory grid and Mercador's stock grid, so a rare item reads as rare
// everywhere it's shown, not just in the player's own bag.
export function slotTintStyle(item: EquipmentItem | null): CSSProperties {
  if (!item) {
    return {
      ['--slot-bg' as string]: NEUTRAL_SLOT_BG,
      ['--slot-bg-hover' as string]: NEUTRAL_SLOT_BG_HOVER,
      ['--slot-border' as string]: NEUTRAL_SLOT_BORDER,
      ['--slot-border-hover' as string]: NEUTRAL_SLOT_BORDER_HOVER,
    } as CSSProperties;
  }
  const color = rarityColor(item.rarity);
  return {
    ['--slot-bg' as string]: hexToRgba(color, 0.16),
    ['--slot-bg-hover' as string]: hexToRgba(color, 0.26),
    ['--slot-border' as string]: hexToRgba(color, 0.5),
    ['--slot-border-hover' as string]: hexToRgba(color, 0.75),
  } as CSSProperties;
}
