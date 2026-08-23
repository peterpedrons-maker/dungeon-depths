import { EquipmentItem, SecondaryStatType } from '../types/game';

// Forja upgrade system (v1 — deliberately simple, gets more complex later):
// spend gold at the Forja to push an item's enhanceLevel up, which scales
// only its *Bonus fields (dmgBonus/defBonus/hpBonus/matkBonus/mdefBonus/
// critChanceBonus/critDmgBonus) by a flat % per level. secondaryStats (the
// rolled affixes) are untouched — enhancement is about the item's own base
// stat, not its bonus roll. The stored item's *Bonus fields always stay the
// original rolled values; enhancedItem() below is the one place the +%
// actually gets applied, so every consumer (combat, item modals, sell
// value) reads the same number and the formula can be retuned later
// without needing to "unwind" anything already saved.
export const MAX_ENHANCE_LEVEL = 10;
// Cumulative bonus multiplier by enhance level — per-level increments grow
// instead of staying flat (was a flat 5%/level, so +10 = +50% no matter
// which levels it came from). A late push (+9->+10, +8%) now adds
// noticeably more raw power than an early one (+0->+1, +3%), matching how
// much harder/rarer a late success actually is (see SUCCESS_CHANCE_BASE
// and enhanceCost below) — the early levels are the "easy, cheap" ones, so
// they shouldn't hand out equally aggressive power as the late "expensive,
// near-lottery" ones. Total at +10 (54%) stays close to the old flat curve
// (50%) on purpose — this reshapes WHERE the power comes from, not how
// much overall.
const ENHANCE_PCT_BY_LEVEL = [0, 0.03, 0.06, 0.10, 0.14, 0.19, 0.24, 0.30, 0.37, 0.45, 0.54];

// Enhancement itself is available from the very first visit to the
// Ferreiro — no Forja level required. The Forja building's own level used
// to gate how far an item could be pushed at all; now it just nudges the
// success chance a little (see successChanceForLevel below), so investing
// in the building is a bonus, not a prerequisite. Matches BUILDINGS'
// forja.maxLevel in lib/buildings.ts (kept as a literal here rather than
// imported, since buildings.ts already imports FROM this file).
const FORJA_MAX_LEVEL = 5;

// Chance to succeed when attempting to push FROM this enhanceLevel to the
// next one — only the first two levels are still a pure formality; +3/+4/+5
// already ask for a real (if still favorable) roll instead of all five
// being free, +5 and +6 are real but still-favorable coinflips-and-better,
// and from +7 on the odds fall off a cliff so a late attempt is a genuine
// gamble, down to a near-lottery 0.5% shot at the very last step. Index =
// current enhanceLevel (0-9).
const SUCCESS_CHANCE_BASE = [1.00, 1.00, 0.80, 0.75, 0.65, 0.50, 0.20, 0.08, 0.02, 0.005];

// The Forja's passive bonus: up to double the base chance at max Forja
// level (5), scaled linearly in between. Doubling only matters where the
// base chance is already small (e.g. +9→+10 goes from 0.5% to at most 1%
// at a maxed Forja) — every level under +7 is already at or near 100% and
// the multiplier just gets clamped away, so in practice this reads as a
// subtle, late-game-only bonus rather than a game-wide chance overhaul.
export function successChanceForLevel(level: number, forjaLevel = 0): number {
  const base = SUCCESS_CHANCE_BASE[level] ?? 0;
  const mult = 1 + (Math.min(forjaLevel, FORJA_MAX_LEVEL) / FORJA_MAX_LEVEL);
  return Math.min(1, base * mult);
}

// Gold cost to push `item` from its current enhanceLevel to the next one —
// scales with the item's own tier (a tier-1 scrap sword is cheap to enhance,
// a tier-10 legend isn't) and grows per level so +9→+10 costs far more than
// +0→+1. 2026 rebalance, take three: base 15->20 and exponent 1.45->1.55,
// specified directly — +1-+4 stay affordable, +5-+6 start to bite, +7 hurts,
// +8-+9 are expensive, +10 is a deliberate long-term investment (its own
// 0.5% success chance already makes it a near-lottery — see
// SUCCESS_CHANCE_BASE — so the cost multiplies onto an already-low
// expected-attempts count, not a compounding trivial one).
export function enhanceCost(item: EquipmentItem): number {
  return Math.round(20 * item.tier * Math.pow(1.55, item.enhanceLevel));
}

const PRIMARY_KEYS = ['dmgBonus', 'defBonus', 'hpBonus', 'matkBonus', 'mdefBonus', 'critChanceBonus', 'critDmgBonus'] as const;

// Returns a copy of `item` with its *Bonus fields scaled up by its current
// enhanceLevel — this is what combat, item modals and sell value should
// read instead of the raw stored fields.
export function enhancedItem(item: EquipmentItem): EquipmentItem {
  if (item.enhanceLevel <= 0) return item;
  const mult = 1 + (ENHANCE_PCT_BY_LEVEL[item.enhanceLevel] ?? 0);
  const scaled = { ...item };
  for (const key of PRIMARY_KEYS) {
    if (item[key] === 0) continue;
    const isPct = key === 'critChanceBonus' || key === 'critDmgBonus';
    scaled[key] = isPct ? item[key] * mult : Math.round(item[key] * mult);
  }
  return scaled;
}

export function itemDisplayName(item: EquipmentItem): string {
  return item.enhanceLevel > 0 ? `${item.name} +${item.enhanceLevel}` : item.name;
}

// Bare "+N stat" lines for an item's primary roll (already enhance-scaled —
// pass the item through enhancedItem() first), shared by every item-detail
// card (CharacterOverview's quick-view, the Mercador's buy card) so the two
// never drift apart on wording.
export function primaryStatLines(item: EquipmentItem): string[] {
  return [
    item.dmgBonus > 0 && `+${item.dmgBonus} ataque físico`,
    item.defBonus > 0 && `+${item.defBonus} defesa`,
    item.hpBonus > 0 && `+${item.hpBonus} vida máxima`,
    item.matkBonus > 0 && `+${item.matkBonus} ataque mágico`,
    item.mdefBonus > 0 && `+${item.mdefBonus} defesa mágica`,
    item.critChanceBonus > 0 && `+${Math.round(item.critChanceBonus * 100)}% chance de crítico`,
    item.critDmgBonus > 0 && `+${Math.round(item.critDmgBonus * 100)}% dano crítico`,
  ].filter((l): l is string => !!l);
}

function affixLabel(type: SecondaryStatType, value: number): string {
  switch (type) {
    case 'crit': return `+${Math.round(value * 100)}% chance de crítico`;
    case 'critDmg': return `+${Math.round(value * 100)}% dano crítico`;
    case 'block': return `+${Math.round(value * 100)}% chance de bloqueio`;
    case 'def': return `+${value} defesa`;
    case 'mdef': return `+${value} defesa mágica`;
    case 'atk': return `+${value} ataque físico`;
    case 'matk': return `+${value} ataque mágico`;
    case 'hp': return `+${value} vida máxima`;
    case 'evasion': return `+${Math.round(value * 100)}% evasão`;
    case 'accuracy': return `+${Math.round(value * 100)}% precisão`;
    case 'tenacity': return `+${Math.round(value * 100)}% tenacidade`;
    case 'speed': return `+${Math.round(value * 100)}% velocidade`;
    case 'lifesteal': return `+${Math.round(value * 100)}% roubo de vida`;
    case 'thorns': return `+${Math.round(value * 100)}% espinhos`;
    case 'cdr': return `+${Math.round(value * 100)}% redução de recarga`;
    case 'itemFind': return `+${Math.round(value * 100)}% chance de item`;
    case 'itemQuality': return `+${Math.round(value * 100)}% qualidade de item`;
  }
}

// An item can now roll several affixes (see AFFIX_COUNT_RANGE in
// lib/equipment.ts) — one line per rolled affix, in roll order.
export function secondaryStatLabels(item: EquipmentItem): string[] {
  return item.secondaryStats.map((s) => affixLabel(s.type, s.value));
}

// One shared label space for both the 7 flat *Bonus fields and every
// possible secondaryStats affix, so an item's full stat picture (base roll +
// every affix) can be compared against another item's picture stat-for-stat
// instead of comparing two different shapes. The 10 affix-only stats (block
// plus the 9 added alongside it — see SecondaryStatType) have no primary
// *Bonus field of their own, so they key straight off their own affix type
// name instead of an EquipmentItem field.
type StatKey = typeof PRIMARY_KEYS[number] | 'block' | 'evasion' | 'accuracy' | 'tenacity' | 'speed' | 'lifesteal' | 'thorns' | 'cdr' | 'itemFind' | 'itemQuality';
const STAT_META: { key: StatKey; label: string; isPct: boolean }[] = [
  { key: 'dmgBonus', label: 'Ataque Físico', isPct: false },
  { key: 'defBonus', label: 'Defesa', isPct: false },
  { key: 'hpBonus', label: 'Vida Máxima', isPct: false },
  { key: 'matkBonus', label: 'Ataque Mágico', isPct: false },
  { key: 'mdefBonus', label: 'Defesa Mágica', isPct: false },
  { key: 'critChanceBonus', label: 'Chance de Crítico', isPct: true },
  { key: 'critDmgBonus', label: 'Dano Crítico', isPct: true },
  { key: 'block', label: 'Chance de Bloqueio', isPct: true },
  { key: 'evasion', label: 'Evasão', isPct: true },
  { key: 'accuracy', label: 'Precisão', isPct: true },
  { key: 'tenacity', label: 'Tenacidade', isPct: true },
  { key: 'speed', label: 'Velocidade', isPct: true },
  { key: 'lifesteal', label: 'Roubo de Vida', isPct: true },
  { key: 'thorns', label: 'Espinhos', isPct: true },
  { key: 'cdr', label: 'Redução de Recarga', isPct: true },
  { key: 'itemFind', label: 'Chance de Item', isPct: true },
  { key: 'itemQuality', label: 'Qualidade de Item', isPct: true },
];
// crit/critDmg/def/mdef/atk/matk/hp affixes fold into the same totals line
// as their matching primary field (a weapon's secondary "atk" affix stacks
// with its primary dmgBonus into one "Ataque Físico" number) — every other
// affix type has no primary twin and keys off its own name.
const SECONDARY_TO_STAT_KEY: Record<SecondaryStatType, StatKey> = {
  crit: 'critChanceBonus', critDmg: 'critDmgBonus', block: 'block',
  def: 'defBonus', mdef: 'mdefBonus', atk: 'dmgBonus', matk: 'matkBonus', hp: 'hpBonus',
  evasion: 'evasion', accuracy: 'accuracy', tenacity: 'tenacity', speed: 'speed',
  lifesteal: 'lifesteal', thorns: 'thorns', cdr: 'cdr', itemFind: 'itemFind', itemQuality: 'itemQuality',
};

function statTotals(item: EquipmentItem): Record<StatKey, number> {
  const totals = {} as Record<StatKey, number>;
  for (const key of PRIMARY_KEYS) totals[key] = item[key];
  for (const s of item.secondaryStats) {
    const key = SECONDARY_TO_STAT_KEY[s.type];
    totals[key] = (totals[key] ?? 0) + s.value;
  }
  return totals;
}

// isBase marks the item's own primary roll (the 7 PRIMARY_KEYS — a weapon's
// Ataque Físico, armor's Defesa, etc., the stat every item of that slot is
// guaranteed to roll) as opposed to a secondary affix (Precisão, Chance de
// Item, and the other roll-of-the-dice bonuses with no primary field of
// their own) — lets the UI color the two differently instead of listing
// them as one undifferentiated pile of numbers.
export interface StatCompareRow { label: string; isPct: boolean; equippedValue: number; newValue: number; isBase: boolean }

const PRIMARY_KEY_SET: ReadonlySet<string> = new Set(PRIMARY_KEYS);

// Side-by-side stat picture of `newItem` vs. whatever's currently equipped
// in its slot — both sides go through enhancedItem() first so a comparison
// against a forged item reflects what's actually in play, not the raw roll.
// A null `equipped` (empty slot) reads as zero on every stat, which is
// exactly right for "nothing to lose here" — every one of the new item's
// stats shows as a pure gain.
export function compareItemStatRows(newItem: EquipmentItem, equipped: EquipmentItem | null): StatCompareRow[] {
  const a = statTotals(enhancedItem(newItem));
  const b = equipped ? statTotals(enhancedItem(equipped)) : ({} as Record<StatKey, number>);
  return STAT_META
    .map(({ key, label, isPct }) => ({ label, isPct, equippedValue: b[key] ?? 0, newValue: a[key] ?? 0, isBase: PRIMARY_KEY_SET.has(key) }))
    .filter((row) => row.equippedValue !== 0 || row.newValue !== 0);
}

export interface ItemStatLine { label: string; isPct: boolean; value: number; delta: number; isBase: boolean }

// `target`'s own stat picture — Path of Exile style: one item's real stats,
// each line optionally carrying a delta against whatever's equipped in that
// slot (delta = target's value minus the equipped item's value for that
// same stat, 0 when there's nothing to compare against or nothing changed).
// Unlike compareItemStatRows this only lists stats `target` itself actually
// has — the equipped item's stats that target lacks don't show up at all,
// since this reads as a single tooltip, not a two-item table.
export function itemStatLines(target: EquipmentItem, equipped: EquipmentItem | null): ItemStatLine[] {
  const rows = compareItemStatRows(target, equipped);
  return rows
    .filter((r) => r.newValue !== 0)
    .map((r) => ({ label: r.label, isPct: r.isPct, value: r.newValue, delta: r.newValue - r.equippedValue, isBase: r.isBase }));
}
