import type { AttributeKey, Attributes, Character, ClassId, ItemSlot, SecondaryStatType } from '../types/game';
import { CLASSES } from './classes.ts';
import { enhancedItem } from './enhancement.ts';
import { OFFHAND_KIND } from './itemTiers.ts';

export const ATTRIBUTE_KEYS: AttributeKey[] = ['str', 'dex', 'agi', 'vit', 'int', 'wis', 'luk'];
export const ATTRIBUTE_AFFIX_TYPES = new Set<SecondaryStatType>(ATTRIBUTE_KEYS);

// The order is also the weighting order used by equipment rolls: the first
// entries are the class's principal attributes, followed by secondary ones.
export const CLASS_ATTRIBUTE_PRIORITIES: Record<ClassId, AttributeKey[]> = {
  guerreiro: ['str', 'vit'], mago: ['int', 'wis'], ladino: ['dex', 'agi', 'luk'], clerigo: ['wis', 'int', 'vit'],
  cavaleiro: ['vit', 'str'], paladino: ['str', 'wis', 'vit'], barbaro: ['str', 'vit', 'luk'],
  arqueiro: ['dex', 'agi', 'luk'], cacador: ['dex', 'agi', 'wis'], feiticeiro: ['int', 'luk'],
  bruxo: ['int', 'wis', 'luk'], druida: ['wis', 'int', 'vit'], bardo: ['wis', 'dex', 'luk'],
  necromante: ['int', 'wis', 'luk'],
};

export const ATTRIBUTE_SLOT_POOL: Record<ItemSlot, AttributeKey[]> = {
  weapon: ['str', 'dex', 'int', 'luk'],
  body: ['vit', 'wis'],
  legs: ['dex', 'agi', 'vit'],
  hands: ['dex', 'int', 'luk'],
  offhand: ['str', 'vit', 'wis'],
  accessory: ATTRIBUTE_KEYS,
};

export interface ClassGearCapabilities {
  usesHealingPower: boolean;
  usesBarrierPower: boolean;
}

// Only classes with explicit, live healing/barrier effects can roll those
// affixes. This prevents a secondary stat from becoming a dead number in the
// item sheet for classes that never read it.
export const CLASS_GEAR_CAPABILITIES: Record<ClassId, ClassGearCapabilities> = {
  guerreiro: { usesHealingPower: false, usesBarrierPower: false },
  mago: { usesHealingPower: false, usesBarrierPower: true },
  ladino: { usesHealingPower: false, usesBarrierPower: false },
  clerigo: { usesHealingPower: true, usesBarrierPower: true },
  cavaleiro: { usesHealingPower: false, usesBarrierPower: true },
  paladino: { usesHealingPower: true, usesBarrierPower: false },
  barbaro: { usesHealingPower: false, usesBarrierPower: false },
  arqueiro: { usesHealingPower: false, usesBarrierPower: false },
  cacador: { usesHealingPower: false, usesBarrierPower: false },
  feiticeiro: { usesHealingPower: false, usesBarrierPower: false },
  bruxo: { usesHealingPower: false, usesBarrierPower: true },
  druida: { usesHealingPower: true, usesBarrierPower: false },
  bardo: { usesHealingPower: true, usesBarrierPower: false },
  necromante: { usesHealingPower: true, usesBarrierPower: true },
};

export function classAttributePriorities(classId: ClassId): AttributeKey[] {
  return CLASS_ATTRIBUTE_PRIORITIES[classId];
}

export function classGearCapabilities(classId: ClassId): ClassGearCapabilities {
  return CLASS_GEAR_CAPABILITIES[classId];
}

export function compatibleAttributeKeys(slot: ItemSlot, classId: ClassId): AttributeKey[] {
  const pool = slot === 'offhand'
    ? (OFFHAND_KIND[classId] === 'foco' ? ['int', 'wis', 'luk'] : ['str', 'vit', 'wis'])
    : ATTRIBUTE_SLOT_POOL[slot];
  const allowed = new Set(pool);
  return CLASS_ATTRIBUTE_PRIORITIES[classId].filter((key) => allowed.has(key));
}

export function isAttributeStat(type: SecondaryStatType): type is AttributeKey {
  return ATTRIBUTE_AFFIX_TYPES.has(type);
}

export function attributeKeyForStat(type: SecondaryStatType): AttributeKey | null {
  return isAttributeStat(type) ? type : null;
}

export function baseAttributes(classId: ClassId): Attributes {
  const source = CLASSES[classId].baseAttrs;
  return Object.fromEntries(ATTRIBUTE_KEYS.map((key) => [key, source[key] ?? 0])) as Attributes;
}

export function allocatedAttributes(ch: Character): Attributes {
  return Object.fromEntries(ATTRIBUTE_KEYS.map((key) => [key, ch.allocatedAttrs[key] ?? 0])) as Attributes;
}

export function equipmentAttributes(ch: Character): Attributes {
  const totals = Object.fromEntries(ATTRIBUTE_KEYS.map((key) => [key, 0])) as Attributes;
  for (const raw of Object.values(ch.equipment)) {
    if (!raw) continue;
    for (const affix of enhancedItem(raw).secondaryStats) {
      const key = attributeKeyForStat(affix.type);
      if (key) totals[key] += affix.value;
    }
  }
  return totals;
}

export function totalAttributes(ch: Character): Attributes {
  const base = baseAttributes(ch.classId);
  const allocated = allocatedAttributes(ch);
  const gear = equipmentAttributes(ch);
  return Object.fromEntries(ATTRIBUTE_KEYS.map((key) => [key, base[key] + allocated[key] + gear[key]])) as Attributes;
}

export function totalAttributesFromParts(classId: ClassId, allocated: Attributes): Attributes {
  const base = baseAttributes(classId);
  return Object.fromEntries(ATTRIBUTE_KEYS.map((key) => [key, base[key] + allocated[key]])) as Attributes;
}

export interface AttributeBreakdown {
  base: Attributes;
  allocated: Attributes;
  equipment: Attributes;
  total: Attributes;
}

export function attributeBreakdown(ch: Character): AttributeBreakdown {
  const base = baseAttributes(ch.classId);
  const allocated = allocatedAttributes(ch);
  const equipment = equipmentAttributes(ch);
  const total = Object.fromEntries(ATTRIBUTE_KEYS.map((key) => [key, base[key] + allocated[key] + equipment[key]])) as Attributes;
  return { base, allocated, equipment, total };
}
