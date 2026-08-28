import type { ClassId, EquipmentItem, ItemSlot, Rarity, SecondaryStatType } from '../types/game.ts';
import { MAGICAL_CLASSES } from './classes.ts';
import { generateItem } from './equipment.ts';
import { ATTRIBUTE_KEYS, CLASS_GEAR_CAPABILITIES, classGearCapabilities, classAttributePriorities, isAttributeStat } from './attributes.ts';

export const ITEM_HARNESS_TIERS = [1, 3, 6, 9, 11] as const;
export const ITEM_HARNESS_RARITIES: Rarity[] = ['comum', 'incomum', 'raro', 'epico', 'legendario'];
export const ITEM_HARNESS_QUALITIES = [0, 0.1, 0.2, 0.4] as const;
export const ITEM_HARNESS_SLOTS: ItemSlot[] = ['weapon', 'body', 'legs', 'hands', 'accessory'];

export interface Distribution { min: number; median: number; mean: number; p90: number; max: number; }
export interface ItemRollSummary {
  itemCount: number;
  affixCount: Distribution;
  statValues: Partial<Record<SecondaryStatType, Distribution>>;
  typeFrequency: Partial<Record<SecondaryStatType, number>>;
  attributeFrequency: Partial<Record<typeof ATTRIBUTE_KEYS[number], number>>;
  priorityFrequency: { primary: number; secondary: number; tertiary: number; other: number };
  healingPowerFrequency: number;
  barrierPowerFrequency: number;
  deadAffixCount: number;
}

function distribution(values: number[]): Distribution {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return { min: 0, median: 0, mean: 0, p90: 0, max: 0 };
  const at = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
  return {
    min: sorted[0], median, mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    p90: at(0.9), max: sorted[sorted.length - 1],
  };
}

export function summarizeItemRolls(items: EquipmentItem[]): ItemRollSummary {
  const typeValues: Partial<Record<SecondaryStatType, number[]>> = {};
  const typeFrequency: Partial<Record<SecondaryStatType, number>> = {};
  const attributeFrequency: Partial<Record<typeof ATTRIBUTE_KEYS[number], number>> = {};
  const priorityFrequency = { primary: 0, secondary: 0, tertiary: 0, other: 0 };
  let healingPowerFrequency = 0;
  let barrierPowerFrequency = 0;
  let deadAffixCount = 0;
  const affixCounts = items.map((item) => item.secondaryStats.length);

  for (const item of items) {
    const capabilities = classGearCapabilities(item.classId);
    const priorities = classAttributePriorities(item.classId);
    for (const affix of item.secondaryStats) {
      (typeValues[affix.type] ??= []).push(affix.value);
      typeFrequency[affix.type] = (typeFrequency[affix.type] ?? 0) + 1;
      if (isAttributeStat(affix.type)) {
        attributeFrequency[affix.type] = (attributeFrequency[affix.type] ?? 0) + 1;
        const priority = priorities.indexOf(affix.type);
        if (priority === 0) priorityFrequency.primary += 1;
        else if (priority === 1) priorityFrequency.secondary += 1;
        else if (priority === 2) priorityFrequency.tertiary += 1;
        else priorityFrequency.other += 1;
      }
      if (affix.type === 'healingPower') healingPowerFrequency += 1;
      if (affix.type === 'barrierPower') barrierPowerFrequency += 1;
      const deadForClass = (MAGICAL_CLASSES.includes(item.classId) && affix.type === 'atk')
        || (!MAGICAL_CLASSES.includes(item.classId) && affix.type === 'matk')
        || (affix.type === 'healingPower' && !capabilities.usesHealingPower)
        || (affix.type === 'barrierPower' && !capabilities.usesBarrierPower);
      if (deadForClass) deadAffixCount += 1;
    }
  }

  return {
    itemCount: items.length,
    affixCount: distribution(affixCounts),
    statValues: Object.fromEntries(Object.entries(typeValues).map(([type, values]) => [type, distribution(values as number[])])) as ItemRollSummary['statValues'],
    typeFrequency, attributeFrequency, priorityFrequency, healingPowerFrequency, barrierPowerFrequency, deadAffixCount,
  };
}

export interface ItemHarnessScenario {
  tier: number;
  rarity: Rarity;
  quality: number;
  summary: ItemRollSummary;
}

export function runItemHarness(samplesPerSlot = 20): ItemHarnessScenario[] {
  const scenarios: ItemHarnessScenario[] = [];
  const classIds = Object.keys(CLASS_GEAR_CAPABILITIES) as ClassId[];
  for (const tier of ITEM_HARNESS_TIERS) {
    for (const rarity of ITEM_HARNESS_RARITIES) {
      for (const quality of ITEM_HARNESS_QUALITIES) {
        const items: EquipmentItem[] = [];
        for (const classId of classIds) {
          for (const slot of ITEM_HARNESS_SLOTS) {
            for (let sample = 0; sample < samplesPerSlot; sample++) items.push(generateItem(slot, classId, tier, quality, rarity));
          }
        }
        scenarios.push({ tier, rarity, quality, summary: summarizeItemRolls(items) });
      }
    }
  }
  return scenarios;
}
