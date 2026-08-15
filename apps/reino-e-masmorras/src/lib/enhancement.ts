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
