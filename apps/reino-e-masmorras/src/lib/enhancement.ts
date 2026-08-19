import { EquipmentItem } from '../types/game';

// Forja upgrade system (v1 — deliberately simple, gets more complex later):
// spend gold at the Forja to push an item's enhanceLevel up, which scales
// only its *Bonus fields (dmgBonus/defBonus/hpBonus/matkBonus/mdefBonus/
// critChanceBonus/critDmgBonus) by a flat % per level. secondaryStat (the
// rolled affix) is untouched — enhancement is about the item's own base
// stat, not its bonus roll. The stored item's *Bonus fields always stay the
// original rolled values; enhancedItem() below is the one place the +%
// actually gets applied, so every consumer (combat, item modals, sell
// value) reads the same number and the formula can be retuned later
// without needing to "unwind" anything already saved.
export const MAX_ENHANCE_LEVEL = 10;
const PCT_PER_LEVEL = 0.10;

// The Forja building's own level gates how far items can be pushed — level
// 0 (not built yet) locks enhancement entirely, level 5 (maxed) unlocks the
// full +10, so investing in the building's passive bonuses also buys into
// the active system.
export function maxEnhanceLevelForForja(forjaLevel: number): number {
  return Math.min(MAX_ENHANCE_LEVEL, forjaLevel * 2);
}

// Chance to succeed when attempting to push FROM this enhanceLevel to the
// next one — early levels are basically free, but risk climbs steeply
// toward +10 so the gold spent on a late attempt is a real gamble, not just
// a formality. Index = current enhanceLevel (0-9).
const SUCCESS_CHANCE = [1.00, 1.00, 0.95, 0.90, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35];

export function successChanceForLevel(level: number): number {
  return SUCCESS_CHANCE[level] ?? 0;
}

// Gold cost to push `item` from its current enhanceLevel to the next one —
// scales with the item's own tier (a tier-1 scrap sword is cheap to enhance,
// a tier-10 legend isn't) and grows per level so +9→+10 costs far more than
// +0→+1.
export function enhanceCost(item: EquipmentItem): number {
  return Math.round(15 * item.tier * Math.pow(1.45, item.enhanceLevel));
}

const PRIMARY_KEYS = ['dmgBonus', 'defBonus', 'hpBonus', 'matkBonus', 'mdefBonus', 'critChanceBonus', 'critDmgBonus'] as const;

// Returns a copy of `item` with its *Bonus fields scaled up by its current
// enhanceLevel — this is what combat, item modals and sell value should
// read instead of the raw stored fields.
export function enhancedItem(item: EquipmentItem): EquipmentItem {
  if (item.enhanceLevel <= 0) return item;
  const mult = 1 + PCT_PER_LEVEL * item.enhanceLevel;
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

export function secondaryStatLabel(item: EquipmentItem): string {
  const s = item.secondaryStat!;
  if (s.type === 'crit') return `+${Math.round(s.value * 100)}% chance de crítico`;
  if (s.type === 'critDmg') return `+${Math.round(s.value * 100)}% dano crítico`;
  if (s.type === 'block') return `+${Math.round(s.value * 100)}% chance de bloqueio`;
  if (s.type === 'def') return `+${s.value} defesa`;
  if (s.type === 'mdef') return `+${s.value} defesa mágica`;
  if (s.type === 'atk') return `+${s.value} ataque físico`;
  if (s.type === 'matk') return `+${s.value} ataque mágico`;
  return `+${s.value} vida máxima`;
}

// One shared key space for both the 7 flat *Bonus fields and the rolled
// secondaryStat affix, so an item's full stat picture (base roll + affix)
// can be compared against another item's picture stat-for-stat instead of
// comparing two different shapes. blockBonus only ever comes from a
// secondaryStat roll — no item slot has a base block stat of its own.
type StatKey = typeof PRIMARY_KEYS[number] | 'blockBonus';
const STAT_META: { key: StatKey; label: string; isPct: boolean }[] = [
  { key: 'dmgBonus', label: 'Ataque Físico', isPct: false },
  { key: 'defBonus', label: 'Defesa', isPct: false },
  { key: 'hpBonus', label: 'Vida Máxima', isPct: false },
  { key: 'matkBonus', label: 'Ataque Mágico', isPct: false },
  { key: 'mdefBonus', label: 'Defesa Mágica', isPct: false },
  { key: 'critChanceBonus', label: 'Chance de Crítico', isPct: true },
  { key: 'critDmgBonus', label: 'Dano Crítico', isPct: true },
  { key: 'blockBonus', label: 'Chance de Bloqueio', isPct: true },
];
const SECONDARY_TO_STAT_KEY: Record<NonNullable<EquipmentItem['secondaryStat']>['type'], StatKey> = {
  crit: 'critChanceBonus', critDmg: 'critDmgBonus', block: 'blockBonus',
  def: 'defBonus', mdef: 'mdefBonus', atk: 'dmgBonus', matk: 'matkBonus', hp: 'hpBonus',
};

function statTotals(item: EquipmentItem): Record<StatKey, number> {
  const totals = { blockBonus: 0 } as Record<StatKey, number>;
  for (const key of PRIMARY_KEYS) totals[key] = item[key];
  if (item.secondaryStat) {
    const key = SECONDARY_TO_STAT_KEY[item.secondaryStat.type];
    totals[key] = (totals[key] ?? 0) + item.secondaryStat.value;
  }
  return totals;
}

export interface StatCompareRow { label: string; isPct: boolean; equippedValue: number; newValue: number }

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
    .map(({ key, label, isPct }) => ({ label, isPct, equippedValue: b[key] ?? 0, newValue: a[key] ?? 0 }))
    .filter((row) => row.equippedValue !== 0 || row.newValue !== 0);
}

export interface ItemStatLine { label: string; isPct: boolean; value: number; delta: number }

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
    .map((r) => ({ label: r.label, isPct: r.isPct, value: r.newValue, delta: r.newValue - r.equippedValue }));
}
