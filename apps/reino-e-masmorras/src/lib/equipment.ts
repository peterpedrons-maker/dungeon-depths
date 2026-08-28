import type { CSSProperties } from 'react';
import type { AccessoryType, ClassId, EquipmentItem, ItemSlot, Rarity, SecondaryStatType } from '../types/game';
import { CLASSES, MAGICAL_CLASSES } from './classes.ts';
import {
  ACCESSORY_NOUN, ACCESSORY_STAT_POOL, ACCESSORY_TYPES, ARMOR_NOUN, MAX_TIER, MERCHANT_RARITY_PRICE_MULT,
  OFFHAND_KIND, OFFHAND_NOUN, WEIGHT_GROUP, merchantBasePrice, tierName,
} from './itemTiers.ts';
import { classAttributePriorities, classGearCapabilities, compatibleAttributeKeys, isAttributeStat } from './attributes.ts';

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
export const AFFIX_COUNT_RANGE: Record<Rarity, [number, number]> = {
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
export const ACCESSORY_PRIMARY_SCALE: Partial<Record<SecondaryStatType, number>> = {
  crit: 0.22, critDmg: 0.36, hp: 2.80, def: 0.75, mdef: 0.75, atk: 0.55, matk: 0.55,
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
  weapon: ['crit', 'critDmg', 'atk', 'matk', 'accuracy', 'lifesteal', 'str', 'dex', 'int', 'luk'],
  body: ['def', 'mdef', 'hp', 'tenacity', 'thorns', 'vit', 'wis'],
  legs: ['def', 'hp', 'evasion', 'speed', 'dex', 'agi', 'vit'],
  hands: ['crit', 'critDmg', 'accuracy', 'cdr', 'dex', 'int', 'luk'],
  shield: ['def', 'mdef', 'block', 'tenacity', 'str', 'vit', 'wis'],
  foco: ['matk', 'mdef', 'cdr', 'tenacity', 'int', 'wis', 'luk'],
  accessory: [
    'crit', 'critDmg', 'def', 'mdef', 'hp', 'block', 'atk', 'matk',
    'evasion', 'accuracy', 'tenacity', 'speed', 'lifesteal', 'thorns', 'cdr',
    'str', 'dex', 'agi', 'vit', 'int', 'wis', 'luk',
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
export const PCT_AFFIX_TYPES = new Set<SecondaryStatType>([
  'crit', 'critDmg', 'block', 'evasion', 'accuracy', 'tenacity', 'speed', 'lifesteal', 'thorns', 'cdr', 'itemFind', 'itemQuality', 'healingPower', 'barrierPower',
]);

// Per-stat-type scale applied to an item's affix roll — smaller than a
// primary stat's own scale (an affix is a bonus, not the main stat), but
// reuses the exact same rollPrimaryValue growth curve so the same stat type
// never reads the same twice across rarities/tiers: a comum tier-1 "+FOR"
// affix and a legendário tier-11 one on the same stat type are worlds apart.
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
export const AFFIX_SCALE: Record<SecondaryStatType, number> = {
  atk: 0.25, matk: 0.25, def: 0.30, mdef: 0.30, hp: 1.10,
  crit: 0.12, critDmg: 0.22, block: 0.12, evasion: 0.10, accuracy: 0.12, tenacity: 0.10,
  speed: 0.06, lifesteal: 0.045, thorns: 0.16, cdr: 0.055, itemFind: 0.15, itemQuality: 0.15,
  healingPower: 0.12, barrierPower: 0.10,
  str: 0.30, int: 0.30, dex: 0.20, vit: 0.18, agi: 0.055, wis: 0.045, luk: 0.045,
};
export const ATTRIBUTE_AFFIX_SCALE: Record<SecondaryStatType, number> = AFFIX_SCALE;

// 2026 rebalance, take two — replaces the old itemTier-based curve.
// Two problems with keying this off itemTier: (1) only 10 buckets for 30+
// dungeons meant every dungeon sharing a bucket (e.g. today, 7 different
// dungeons all sit at itemTier 7) rolled identical odds, so the easiest
// dungeon in a shared bucket was always the optimal farm — no reason to
// ever touch the harder ones. (2) Comum/Incomum drifting across tiers on
// top of raro/épico/lendário added a knob nobody asked to tune. Both are
// fixed by keying off `progress` (0-1), a continuous position derived from
// each dungeon's own difficultyMult (see lib/dungeons.ts's
// difficultyProgress) instead of its coarse itemTier — every dungeon gets a
// distinct spot on the curve now, so there's no shared bucket to farm the
// easy end of.
// Comum/Incomum are now flat across the whole curve (60/15 always) — user
// call: "só muda mesmo entre raro, épico e lendário." Raro falls and Épico
// rises with progress like before. Lendário is deliberately INVERTED from
// the old design: it peaks at progress 0 (early dungeons) and tapers to its
// lowest at progress 1 — a new player can get hooked by an early miracle
// drop, while a late-game Lendário (built on far higher itemTier power)
// stays the rarer, more meaningful pull the user wanted for endgame.
// Lendário's floor at progress 0 was cut twice after this comment was first
// written (3% -> 1% -> 0.4%, comum absorbing the difference each time), then
// raised back to 1% in a later pass — explicit user call, wanting the very
// first dungeon's trash kills to feel a bit more generous again, comum
// giving back the same 0.6% it had absorbed.
const RARITY_WEIGHTS_LOW = [62.0, 15, 16, 6, 1.0];  // progress 0 — easiest dungeon in the game
// Lendário's floor at progress 1 was 2%, cut to 0.15%, then raised slightly
// to 0.3% (comum gives back 0.15%) in the same pass as the progress-0 bump
// above — user wanted both ends nudged, endgame kept meaningfully rarer than
// early-game but not quite as vanishingly small as 0.15%. This also had to
// stay strictly below the boss table's own endgame floor — see
// BOSS_WEIGHTS_HIGH.
const RARITY_WEIGHTS_HIGH = [61.70, 15, 12, 11, 0.3]; // progress 1 — hardest dungeon in the game
// Interpolating LOW->HIGH on progress directly (t itself) fell at a constant
// rate the whole way — user wanted the opposite feel: early/mid dungeons
// keep dropping close to the progress-0 rate, and the fall only picks up
// pace once a dungeon's itemTier crosses into the ~7/8 range (progress
// ~0.5-0.9, see lib/dungeons.ts's difficultyProgress). Raising t to a power
// > 1 does exactly this — a 0-1 fraction raised to a power stays small (so
// the interpolation stays close to LOW) across most of the range and only
// climbs toward 1 near the top end, so the same LOW/HIGH endpoints above are
// preserved exactly (progress 0 and 1 are unaffected — 0^p=0, 1^p=1) while
// everything in between now falls more gently at first, more steeply later.
const LOOT_CURVE_EXPONENT = 3;
function shapedProgress(progress: number): number {
  const t = Math.max(0, Math.min(1, progress));
  return t ** LOOT_CURVE_EXPONENT;
}

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

// progress is 0-1 — see lib/dungeons.ts's difficultyProgress for how a
// dungeon maps onto this axis. Kept as a plain number (not re-deriving it
// from a tier here) so callers without a specific dungeon in hand (the
// Mercador's stock, starting gear) can still fall back to an itemTier-based
// approximation at the call site instead of this function needing to know
// about dungeons at all.
export function pickRarityForTier(progress: number, qualityBonusPct = 0): RarityDef {
  const t = shapedProgress(progress);
  const base = RARITY_WEIGHTS_LOW.map((low, i) => low + (RARITY_WEIGHTS_HIGH[i] - low) * t);
  const weights = applyLuckBoost(base, qualityBonusPct);
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < RARITIES.length; i++) {
    if (roll < weights[i]) return RARITIES[i];
    roll -= weights[i];
  }
  return RARITIES[0];
}

// Boss/elite guaranteed drop — used to be one fixed table for literally
// every boss in the game (a Ruínas kill and an Arena do Campeão kill rolled
// identically), which meant regressing to an early, fast boss for loot was
// never actually worse than fighting the current one. Now scales with the
// same `progress` axis as regular drops.
// 2026 pass: every rarity here now moves the SAME direction as trash's own
// Lendário (easier early, harder late), not just Lendário — explicit user
// call, reasoning that a boss is a repeatable, guaranteed-drop farm target
// (via "repetir sequência"), so the SAME "early miracle hook, earned late-
// game" logic that already justified trash's inverted Lendário should
// apply across the board here too, not just to one rarity. This does
// technically reopen a duller version of the old "farm an easy boss"
// question the previous (rising) design closed — accepted deliberately,
// since an early boss's Lendário/Épico still rolls on a far lower baseTier
// than a late one, so it's a weaker item either way, same tradeoff trash's
// own inverted Lendário already leans on. Every weight here still sits at
// or above RARITY_WEIGHTS_LOW/HIGH's own raro/épico/lendário at the
// matching end, so a boss kill is never a worse bet than farming trash at
// the same dungeon.
// Lendário's floor at progress 0 was cut twice more after this comment was
// written (10% -> 3% -> 1.5%), then raised back to 3% in the same later pass
// that bumped trash's own floor — direct user call, giving the very first
// dungeon's boss the more generous "early miracle" odds back, comum giving
// up the same 1.5% it had absorbed.
// Lendário's endgame floor was raised too, 0.3% -> 0.9% (comum absorbs
// 0.6%) — same pass, keeping the endgame boss meaningfully above endgame
// trash's own 0.3% without going back to how generous it used to be.
const BOSS_WEIGHTS_LOW = [17.0, 15, 30, 35, 3.0];      // progress 0 — easiest dungeon's boss
const BOSS_WEIGHTS_HIGH = [41.1, 28, 15, 15, 0.9]; // progress 1 — hardest dungeon's boss

export function pickBossDropRarity(progress: number, qualityBonusPct = 0): Rarity {
  const t = shapedProgress(progress);
  const base = BOSS_WEIGHTS_LOW.map((low, i) => low + (BOSS_WEIGHTS_HIGH[i] - low) * t);
  const weights = applyLuckBoost(base, qualityBonusPct);
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < RARITIES.length; i++) {
    if (roll < weights[i]) return RARITIES[i].id;
    roll -= weights[i];
  }
  return RARITIES[0].id;
}

// Keyed by the dungeon's own levelReq (1-60), not itemTier (1-11) — the
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

export function rarityIndex(id: Rarity): number {
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
// meaningful next to the class's base stats. baseTier (1-11, from the
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
  const effectiveStatType = statType === 'atk' || statType === 'matk'
    ? (MAGICAL_CLASSES.includes(classId) ? 'matk' : 'atk')
    : statType;
  const raw = rollPrimaryValue(baseTier, rarityMult, ACCESSORY_PRIMARY_SCALE[effectiveStatType] ?? 1) * qualityMult;
  switch (effectiveStatType) {
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

function filteredAffixPool(slot: ItemSlot, classId: ClassId, rarityTier: number): SecondaryStatType[] {
  const poolKey = affixPoolKeyFor(slot, classId);
  if (!poolKey) return [];
  const capabilities = classGearCapabilities(classId);
  const allowedAttributes = new Set(compatibleAttributeKeys(slot, classId));
  const physical = !MAGICAL_CLASSES.includes(classId);
  let pool = SLOT_AFFIX_POOL[poolKey].filter((type) => {
    if (type === 'atk') return physical;
    if (type === 'matk') return !physical;
    if (isAttributeStat(type)) return allowedAttributes.has(type);
    return true;
  });
  if (capabilities.usesHealingPower) pool.push('healingPower');
  if (capabilities.usesBarrierPower) pool.push('barrierPower');
  if (rarityTier >= LUCK_AFFIX_MIN_RARITY_INDEX) pool = [...pool, ...LUCK_AFFIXES];
  return [...new Set(pool)];
}

function affixWeight(type: SecondaryStatType, classId: ClassId): number {
  if (type === 'healingPower' || type === 'barrierPower') return 0.8;
  if (isAttributeStat(type)) {
    const index = classAttributePriorities(classId).indexOf(type);
    if (index === 0) return 1.25;
    if (index === 1) return 0.90;
    if (index === 2) return 0.65;
  }
  return 1;
}

function roundedPctAffix(type: SecondaryStatType, raw: number): number {
  const step = type === 'speed' || type === 'cdr' || type === 'lifesteal' ? 0.25 : 0.5;
  const roundedPoints = Math.max(step, Math.round(raw / step) * step);
  return roundedPoints / 100;
}

// Quality does not change the rarity band. It only skews the count toward the
// upper end of that rarity's own band, so the declared min/max are immutable.
export function affixCountForRarity(rarity: Rarity, qualityBonusPct = 0, random = Math.random): number {
  const [min, max] = AFFIX_COUNT_RANGE[rarity];
  const q = Math.max(0, Math.min(0.4, qualityBonusPct));
  const upward = 1 - random() ** (1 + q * 4);
  return Math.min(max, min + Math.floor(upward * (max - min + 1)));
}

export function rollSecondaryStats(baseTier: number, rarityMult: number, pool: SecondaryStatType[], count: number, classId: ClassId): EquipmentItem['secondaryStats'] {
  const remaining = [...new Set(pool)].map((type) => ({ type, weight: affixWeight(type, classId) }));
  const rolled: EquipmentItem['secondaryStats'] = [];
  let attributeRolled = false;
  for (let i = 0; i < count && remaining.length > 0; i++) {
    const candidates = attributeRolled ? remaining.filter((candidate) => !isAttributeStat(candidate.type)) : remaining;
    if (candidates.length === 0) break;
    const totalWeight = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
    let roll = Math.random() * totalWeight;
    const selectedIndex = candidates.findIndex((candidate) => {
      if (roll < candidate.weight) return true;
      roll -= candidate.weight;
      return false;
    });
    const candidate = candidates[selectedIndex < 0 ? candidates.length - 1 : selectedIndex];
    remaining.splice(remaining.indexOf(candidate), 1);
    const type = candidate.type;
    if (isAttributeStat(type)) attributeRolled = true;
    const variance = AFFIX_VARIANCE_RANGE[0] + Math.random() * (AFFIX_VARIANCE_RANGE[1] - AFFIX_VARIANCE_RANGE[0]);
    const raw = rollPrimaryValue(baseTier, rarityMult * variance, AFFIX_SCALE[type]);
    const value = PCT_AFFIX_TYPES.has(type) ? roundedPctAffix(type, raw) : Math.max(1, raw);
    rolled.push({ type, value });
  }
  return rolled;
}

let _iid = 0;

// baseTier (1-11) comes from the dungeon the item dropped in (or, for the
// Mercador, the toughest dungeon the player currently qualifies for — see
// highestAccessibleItemTier in lib/dungeons.ts) and drives both the item's
// base name (lib/itemTiers.ts) and the magnitude of its primary stat.
// qualityBonusPct comes from the kingdom's Forja building — a flat % bonus
// stacked on top of the item's rolled primary stat. forcedRarity skips the
// normal weighted roll entirely — used for a brand-new character's
// guaranteed starter gear (see createCharacter in lib/classes.ts), which
// always wants exactly comum, never whatever pickRarityForTier() would've
// rolled, and for a Hunt's guaranteed Raro+ floor (see pickHuntDropRarity
// in DungeonPanel.tsx). rarityProgress (0-1, see lib/dungeons.ts's
// difficultyProgress) drives the RARITY roll specifically — a finer-grained
// axis than baseTier, since many dungeons share the same itemTier but each
// has its own distinct difficultyMult. Callers with an actual dungeon in
// hand (DungeonPanel) should always pass it; callers without one (the
// Mercador's stock, which isn't tied to one specific dungeon) can omit it
// and fall back to baseTier's own coarse position on the curve.
export function generateItem(
  slot: ItemSlot, classId: ClassId, baseTier: number, qualityBonusPct = 0, forcedRarity?: Rarity, rarityProgress?: number,
): EquipmentItem {
  const progress = rarityProgress ?? Math.max(0, Math.min(1, (baseTier - 1) / (MAX_TIER - 1)));
  const rarity = forcedRarity ? RARITIES.find((r) => r.id === forcedRarity)! : pickRarityForTier(progress, qualityBonusPct);
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

  const quality = Math.max(0, Math.min(0.4, qualityBonusPct));
  const qualityMult = 1 + quality;
  const primary = primaryFieldsFor(slot, classId, baseTier, rolledMult, qualityMult, accessoryType);

  const pool = filteredAffixPool(slot, classId, rarityTier);
  const count = affixCountForRarity(rarity.id, quality);

  return {
    id: `i${++_iid}_${Date.now()}`, name, classId, slot, rarity: rarity.id, tier: baseTier,
    accessoryType,
    ...ZERO_PRIMARY, ...primary,
    itemSchemaVersion: 2,
    secondaryStats: rollSecondaryStats(baseTier, rolledMult, pool, count, classId),
    enhanceLevel: 0,
    originalAffixCount: count,
  };
}

// Rolls exactly one brand-new affix for `item`, from the same slot-themed
// pool generateItem itself draws from, excluding any type it already has.
// Used only by the Ferreiro's Runa de Aprimoramento flow, on a Comum item
// that rolled zero affixes (see AFFIX_COUNT_RANGE's comum floor of 0) — a
// rune there has nothing existing to improve, so it grants one instead.
// Approximates the item's original rarity roll with rarityMult()'s band
// midpoint (the item itself doesn't store its exact rolledMult) — the same
// approximation merchantStock.ts's pricing already leans on.
export function rollAffixForItem(item: EquipmentItem): { type: SecondaryStatType; value: number } | null {
  const rarityTier = rarityIndex(item.rarity);
  const pool = filteredAffixPool(item.slot, item.classId, rarityTier).filter((t) => !item.secondaryStats.some((s) => s.type === t));
  if (pool.length === 0) return null;
  const rolled = rollSecondaryStats(item.tier, rarityMult(item.rarity), pool, 1, item.classId);
  return rolled[0] ?? null;
}

// Priced as a fraction of the Mercador's own buy price for an equivalent
// item (same tier + rarity — see merchantBasePrice/MERCHANT_RARITY_PRICE_MULT
// in lib/itemTiers.ts) instead of a flat raridade-only formula. A Tier-1 and
// a Tier-11 Lendário used to sell for the same handful of gold despite the
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
