import {
  ItemRarity,
  EquipmentSlot,
  ModType,
  ItemMod,
  LootItem,
  BASE_ITEMS,
  LEGENDARY_NAMES,
  RARITY_MOD_COUNT,
  MOD_DESCRIPTIONS,
  getItemTier,
  getRequiredLevel,
  ITEM_TIERS,
  ArmorWeight,
  ARMOR_WEIGHT_BONUSES,
} from '@/types/items';

const RARE_PREFIXES = [
  'Ancient', 'Blazing', 'Frozen', 'Cursed', 'Blessed', 'Shadow', 'Storm',
  'Savage', 'Divine', 'Infernal', 'Ethereal', 'Vengeful', 'Corrupted'
];

const RARE_SUFFIXES = [
  'of Power', 'of the Bear', 'of the Eagle', 'of Destruction', 'of Fortune',
  'of the Phoenix', 'of Shadows', 'of the Void', 'of Dominion', 'of Wrath'
];

const MAGIC_PREFIXES = ['Sharp', 'Sturdy', 'Swift', 'Mighty', 'Keen', 'Heavy', 'Light', 'Arcane', 'Holy'];
const MAGIC_SUFFIXES = ['of Strength', 'of Agility', 'of Vitality', 'of Protection', 'of the Mage', 'of the Healer'];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get available mods based on slot - expanded for new attribute system
function getAvailableMods(slot: EquipmentSlot): ModType[] {
  const baseMods: ModType[] = ['attack', 'defense', 'maxHealth'];
  
  switch (slot) {
    case 'weapon':
      return [...baseMods, 'critChance', 'critDamage', 'lifeSteal', 'attack', 'magicAttack', 'strength', 'dexterity', 'intelligence'];
    case 'offhand':
      return [...baseMods, 'defense', 'dodge', 'maxHealth', 'magicDefense', 'maxMana', 'vitality'];
    case 'helm':
      return [...baseMods, 'defense', 'maxHealth', 'expBonus', 'intelligence', 'maxMana', 'magicDefense'];
    case 'chest':
      return [...baseMods, 'defense', 'maxHealth', 'vitality', 'magicDefense', 'strength'];
    case 'gloves':
      return [...baseMods, 'critChance', 'attack', 'critDamage', 'dexterity', 'magicAttack'];
    case 'boots':
      return [...baseMods, 'dodge', 'goldFind', 'defense', 'agility', 'dexterity'];
    case 'belt':
      return [...baseMods, 'maxHealth', 'health', 'goldFind', 'vitality', 'maxMana'];
    case 'amulet':
      return [...baseMods, 'critChance', 'critDamage', 'expBonus', 'lifeSteal', 'intelligence', 'charisma', 'magicAttack'];
    case 'ring1':
    case 'ring2':
      return [...baseMods, 'critChance', 'goldFind', 'expBonus', 'lifeSteal', 'charisma', 'strength', 'dexterity', 'intelligence'];
    default:
      return baseMods;
  }
}

function generateMod(modType: ModType, itemLevel: number, rarity: ItemRarity): ItemMod {
  const rarityMultiplier = {
    normal: 1,
    uncommon: 1.3,
    magic: 1.6,
    rare: 2,
    legendary: 3,
  }[rarity];
  
  // Get tier multiplier for scaling stats
  const tier = getItemTier(itemLevel);
  const tierMultiplier = tier.statMultiplier;

  let baseValue: number;
  
  switch (modType) {
    case 'attack':
      baseValue = randomRange(2, 5) + Math.floor(itemLevel * 1.5);
      break;
    case 'defense':
      baseValue = randomRange(1, 4) + Math.floor(itemLevel * 1.2);
      break;
    case 'maxHealth':
      baseValue = randomRange(5, 15) + itemLevel * 3;
      break;
    case 'health':
      baseValue = randomRange(1, 3) + Math.floor(itemLevel * 0.5);
      break;
    case 'critChance':
      baseValue = randomRange(2, 8);
      break;
    case 'critDamage':
      baseValue = randomRange(10, 30);
      break;
    case 'dodge':
      baseValue = randomRange(2, 6);
      break;
    case 'lifeSteal':
      baseValue = randomRange(1, 5);
      break;
    case 'goldFind':
      baseValue = randomRange(5, 20);
      break;
    case 'expBonus':
      baseValue = randomRange(3, 12);
      break;
    // New attribute-based mods
    case 'magicAttack':
      baseValue = randomRange(2, 6) + Math.floor(itemLevel * 1.5);
      break;
    case 'magicDefense':
      baseValue = randomRange(1, 4) + Math.floor(itemLevel * 1.0);
      break;
    case 'maxMana':
      baseValue = randomRange(5, 12) + itemLevel * 2;
      break;
    case 'manaRegen':
      baseValue = randomRange(1, 3);
      break;
    case 'strength':
      baseValue = randomRange(1, 3) + Math.floor(itemLevel * 0.3);
      break;
    case 'dexterity':
      baseValue = randomRange(1, 3) + Math.floor(itemLevel * 0.3);
      break;
    case 'vitality':
      baseValue = randomRange(1, 3) + Math.floor(itemLevel * 0.3);
      break;
    case 'intelligence':
      baseValue = randomRange(1, 3) + Math.floor(itemLevel * 0.3);
      break;
    case 'charisma':
      baseValue = randomRange(1, 2) + Math.floor(itemLevel * 0.2);
      break;
    case 'agility':
      baseValue = randomRange(1, 4) + Math.floor(itemLevel * 0.5);
      break;
    default:
      baseValue = randomRange(1, 5);
  }

  const finalValue = Math.floor(baseValue * rarityMultiplier * tierMultiplier);
  
  return {
    type: modType,
    value: finalValue,
    description: MOD_DESCRIPTIONS[modType](finalValue),
  };
}

function generateMods(slot: EquipmentSlot, level: number, rarity: ItemRarity): ItemMod[] {
  const { min, max } = RARITY_MOD_COUNT[rarity];
  const modCount = randomRange(min, max);
  const availableMods = getAvailableMods(slot);
  const mods: ItemMod[] = [];
  const usedTypes = new Set<ModType>();

  for (let i = 0; i < modCount && usedTypes.size < availableMods.length; i++) {
    let modType: ModType;
    do {
      modType = getRandomElement(availableMods);
    } while (usedTypes.has(modType));
    
    usedTypes.add(modType);
    mods.push(generateMod(modType, level, rarity));
  }

  return mods;
}

function generateItemName(baseName: string, rarity: ItemRarity, slot: EquipmentSlot, itemLevel: number): string {
  const tier = getItemTier(itemLevel);
  const tierPrefix = tier.name ? `${tier.name} ` : '';
  
  switch (rarity) {
    case 'normal':
      return `${tierPrefix}${baseName}`;
    case 'uncommon':
      return `Fine ${tierPrefix}${baseName}`;
    case 'magic':
      return `${getRandomElement(MAGIC_PREFIXES)} ${tierPrefix}${baseName} ${getRandomElement(MAGIC_SUFFIXES)}`;
    case 'rare':
      return `${getRandomElement(RARE_PREFIXES)} ${tierPrefix}${baseName} ${getRandomElement(RARE_SUFFIXES)}`;
    case 'legendary':
      return getRandomElement(LEGENDARY_NAMES[slot]);
    default:
      return `${tierPrefix}${baseName}`;
  }
}

function calculateItemValue(level: number, rarity: ItemRarity, modCount: number): number {
  const baseValue = 10 + level * 5;
  const rarityMultiplier = {
    normal: 1,
    uncommon: 2,
    magic: 4,
    rare: 8,
    legendary: 20,
  }[rarity];
  
  // Apply tier multiplier for higher level items
  const tier = getItemTier(level);
  const tierMultiplier = tier.statMultiplier;
  
  return Math.floor(baseValue * rarityMultiplier * tierMultiplier * (1 + modCount * 0.2));
}

export function rollRarity(floor: number): ItemRarity {
  const roll = Math.random() * 100;
  const legendaryChance = Math.min(1 + floor * 0.5, 5);
  const rareChance = Math.min(5 + floor * 1, 15);
  const magicChance = Math.min(15 + floor * 2, 30);
  const uncommonChance = Math.min(30 + floor * 2, 50);

  if (roll < legendaryChance) return 'legendary';
  if (roll < legendaryChance + rareChance) return 'rare';
  if (roll < legendaryChance + rareChance + magicChance) return 'magic';
  if (roll < legendaryChance + rareChance + magicChance + uncommonChance) return 'uncommon';
  return 'normal';
}

export function generateLootItem(floor: number, forcedSlot?: EquipmentSlot, forcedRarity?: ItemRarity): LootItem {
  const slots: EquipmentSlot[] = ['helm', 'amulet', 'chest', 'gloves', 'belt', 'boots', 'weapon', 'offhand', 'ring1', 'ring2'];
  const slot = forcedSlot || getRandomElement(slots);
  const rarity = forcedRarity || rollRarity(floor);
  const level = Math.max(1, floor);
  
  const baseItems = BASE_ITEMS[slot];
  const baseItem = getRandomElement(baseItems);
  let mods = generateMods(slot, level, rarity);
  const requiredLevel = getRequiredLevel(level);
  
  // Apply armor weight bonuses if the item has a weight category
  const weight = baseItem.weight as ArmorWeight | undefined;
  if (weight) {
    const weightBonus = ARMOR_WEIGHT_BONUSES[weight];
    const tier = getItemTier(level);
    const tierMultiplier = tier.statMultiplier;
    
    // Add weight bonus mods
    weightBonus.bonusMods.forEach(bonus => {
      const scaledValue = Math.floor(bonus.baseValue * tierMultiplier);
      mods.push({
        type: bonus.type,
        value: scaledValue,
        description: MOD_DESCRIPTIONS[bonus.type](scaledValue),
      });
    });
  }
  
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: generateItemName(baseItem.name, rarity, slot, level),
    baseName: baseItem.name,
    slot,
    rarity,
    level,
    requiredLevel,
    mods,
    value: calculateItemValue(level, rarity, mods.length),
    icon: baseItem.icon,
    classRestriction: baseItem.classes,
    weight,
  };
}

export function generateLootDrop(floor: number, count: number = 1): LootItem[] {
  const items: LootItem[] = [];
  for (let i = 0; i < count; i++) {
    items.push(generateLootItem(floor));
  }
  return items;
}

// Generate a random potion (health or mana)
export function generatePotion(floor: number): LootItem {
  const isManaPotion = Math.random() < 0.4; // 40% chance for mana potion
  const baseValue = 25 + Math.floor(floor * 5);
  
  if (isManaPotion) {
    const manaValue = Math.floor(baseValue * 0.8);
    return {
      id: `mana-potion-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: floor >= 5 ? 'Greater Mana Potion' : floor >= 3 ? 'Mana Potion' : 'Minor Mana Potion',
      baseName: 'Mana Potion',
      slot: 'consumable',
      rarity: floor >= 5 ? 'magic' : floor >= 3 ? 'uncommon' : 'normal',
      level: floor,
      requiredLevel: 0, // Consumables have no level requirement
      mods: [{ type: 'mana', value: manaValue, description: `Restores ${manaValue} MP` }],
      value: 20 + floor * 5,
      icon: '💧',
    };
  } else {
    const healthValue = baseValue;
    return {
      id: `health-potion-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: floor >= 5 ? 'Greater Health Potion' : floor >= 3 ? 'Health Potion' : 'Minor Health Potion',
      baseName: 'Health Potion',
      slot: 'consumable',
      rarity: floor >= 5 ? 'magic' : floor >= 3 ? 'uncommon' : 'normal',
      level: floor,
      requiredLevel: 0, // Consumables have no level requirement
      mods: [{ type: 'health', value: healthValue, description: `Restores ${healthValue} HP` }],
      value: 25 + floor * 5,
      icon: '🧪',
    };
  }
}

// Generate guaranteed drops based on enemy/encounter
export function generateCombatLoot(floor: number, enemyTier: 'normal' | 'elite' | 'boss'): LootItem[] {
  const items: LootItem[] = [];
  
  switch (enemyTier) {
    case 'normal':
      if (Math.random() < 0.3) items.push(generateLootItem(floor));
      // 25% chance to drop a potion
      if (Math.random() < 0.25) items.push(generatePotion(floor));
      break;
    case 'elite':
      items.push(generateLootItem(floor));
      if (Math.random() < 0.5) items.push(generateLootItem(floor, undefined, 'magic'));
      // Always drop a potion from elites
      items.push(generatePotion(floor));
      break;
    case 'boss':
      items.push(generateLootItem(floor, undefined, 'rare'));
      items.push(generateLootItem(floor));
      if (Math.random() < 0.3) items.push(generateLootItem(floor, undefined, 'legendary'));
      // Drop 2 potions from bosses
      items.push(generatePotion(floor));
      items.push(generatePotion(floor));
      break;
  }
  
  return items;
}

export function generateTreasureLoot(floor: number): LootItem[] {
  const items: LootItem[] = [];
  const itemCount = randomRange(1, 3);
  
  for (let i = 0; i < itemCount; i++) {
    items.push(generateLootItem(floor));
  }
  
  // Treasure also has 40% chance for a potion
  if (Math.random() < 0.4) {
    items.push(generatePotion(floor));
  }
  
  return items;
}