// Diablo-style Item System with Class-Specific Items

export type ItemRarity = 'normal' | 'uncommon' | 'magic' | 'rare' | 'legendary';

export type EquipmentSlot = 
  | 'helm' 
  | 'amulet' 
  | 'chest' 
  | 'gloves' 
  | 'belt' 
  | 'boots' 
  | 'weapon' 
  | 'offhand' 
  | 'ring1' 
  | 'ring2';

// Item tier with level requirement
export interface ItemTier {
  name: string;
  requiredLevel: number;
  statMultiplier: number; // Multiplier for base stats
}

// Extended mod types for the new attribute system
export type ModType = 
  | 'attack'
  | 'defense'
  | 'health'
  | 'maxHealth'
  | 'critChance'
  | 'critDamage'
  | 'dodge'
  | 'lifeSteal'
  | 'goldFind'
  | 'expBonus'
  // New attribute-based mods
  | 'magicAttack'
  | 'magicDefense'
  | 'maxMana'
  | 'manaRegen'
  | 'strength'
  | 'dexterity'
  | 'vitality'
  | 'intelligence'
  | 'charisma'
  | 'agility'
  // Consumable mods
  | 'mana';

export interface ItemMod {
  type: ModType;
  value: number;
  description: string;
}

export interface LootItem {
  id: string;
  name: string;
  baseName: string;
  slot: EquipmentSlot | 'consumable';
  rarity: ItemRarity;
  level: number;
  requiredLevel: number; // Level required to equip this item
  mods: ItemMod[];
  value: number;
  icon: string;
  classRestriction?: string[]; // Optional class restriction
  weight?: ArmorWeight; // Armor weight category (light/medium/heavy)
}

// Combat Power weights for different mod types
export const COMBAT_POWER_WEIGHTS: Record<ModType, number> = {
  attack: 2.0,
  defense: 1.5,
  health: 0.5,
  maxHealth: 0.3,
  critChance: 3.0,
  critDamage: 1.5,
  dodge: 2.5,
  lifeSteal: 3.0,
  goldFind: 0.5,
  expBonus: 0.5,
  magicAttack: 2.0,
  magicDefense: 1.5,
  maxMana: 0.2,
  manaRegen: 1.0,
  strength: 2.5,
  dexterity: 2.5,
  vitality: 2.0,
  intelligence: 2.5,
  charisma: 1.5,
  agility: 2.0,
  mana: 0.3,
};

// Calculate Combat Power for an item
export function calculateCombatPower(item: LootItem): number {
  let power = 0;
  
  // Base power from item level and rarity
  const rarityMultiplier = {
    normal: 1,
    uncommon: 1.2,
    magic: 1.5,
    rare: 2.0,
    legendary: 3.0,
  }[item.rarity];
  
  // Base power from level
  power += item.level * 5 * rarityMultiplier;
  
  // Add power from mods
  item.mods.forEach(mod => {
    const weight = COMBAT_POWER_WEIGHTS[mod.type] || 1;
    power += mod.value * weight;
  });
  
  return Math.floor(power);
}

export interface EquippedItems {
  helm: LootItem | null;
  amulet: LootItem | null;
  chest: LootItem | null;
  gloves: LootItem | null;
  belt: LootItem | null;
  boots: LootItem | null;
  weapon: LootItem | null;
  offhand: LootItem | null;
  ring1: LootItem | null;
  ring2: LootItem | null;
}

export const RARITY_COLORS: Record<ItemRarity, string> = {
  normal: 'text-gray-300',
  uncommon: 'text-green-400',
  magic: 'text-blue-400',
  rare: 'text-yellow-400',
  legendary: 'text-orange-400',
};

export const RARITY_BORDER_COLORS: Record<ItemRarity, string> = {
  normal: 'border-gray-500',
  uncommon: 'border-green-500',
  magic: 'border-blue-500',
  rare: 'border-yellow-500',
  legendary: 'border-orange-500',
};

export const RARITY_GLOW: Record<ItemRarity, string> = {
  normal: '',
  uncommon: 'shadow-[0_0_10px_rgba(34,197,94,0.3)]',
  magic: 'shadow-[0_0_10px_rgba(59,130,246,0.4)]',
  rare: 'shadow-[0_0_15px_rgba(234,179,8,0.5)]',
  legendary: 'shadow-[0_0_20px_rgba(249,115,22,0.6)]',
};

export const RARITY_MOD_COUNT: Record<ItemRarity, { min: number; max: number }> = {
  normal: { min: 1, max: 1 },
  uncommon: { min: 1, max: 2 },
  magic: { min: 2, max: 3 },
  rare: { min: 3, max: 5 },
  legendary: { min: 5, max: 6 },
};

export const MOD_DESCRIPTIONS: Record<ModType, (value: number) => string> = {
  attack: (v) => `+${v} Attack`,
  defense: (v) => `+${v} Defense`,
  health: (v) => `+${v} Health on Kill`,
  maxHealth: (v) => `+${v} Max Health`,
  critChance: (v) => `+${v}% Critical Chance`,
  critDamage: (v) => `+${v}% Critical Damage`,
  dodge: (v) => `+${v}% Dodge Chance`,
  lifeSteal: (v) => `+${v}% Life Steal`,
  goldFind: (v) => `+${v}% Gold Find`,
  expBonus: (v) => `+${v}% Experience`,
  // New mod descriptions
  magicAttack: (v) => `+${v} Magic Attack`,
  magicDefense: (v) => `+${v} Magic Defense`,
  maxMana: (v) => `+${v} Max Mana`,
  manaRegen: (v) => `+${v} Mana Regen`,
  strength: (v) => `+${v} Strength`,
  dexterity: (v) => `+${v} Dexterity`,
  vitality: (v) => `+${v} Vitality`,
  intelligence: (v) => `+${v} Intelligence`,
  charisma: (v) => `+${v} Charisma`,
  agility: (v) => `+${v} Agility`,
  mana: (v) => `Restores ${v} MP`,
};

// Item tiers with level requirements for each slot
// 5 tiers: Level 1, 15, 30, 45, 60
export const ITEM_TIERS: ItemTier[] = [
  { name: '', requiredLevel: 1, statMultiplier: 1.0 },
  { name: 'Reinforced', requiredLevel: 15, statMultiplier: 2.0 },
  { name: 'Superior', requiredLevel: 30, statMultiplier: 3.5 },
  { name: 'Elite', requiredLevel: 45, statMultiplier: 5.0 },
  { name: 'Godly', requiredLevel: 60, statMultiplier: 7.0 },
];

// Armor weight categories with inherent bonuses
export type ArmorWeight = 'light' | 'medium' | 'heavy';

export interface WeightBonus {
  weight: ArmorWeight;
  bonusMods: { type: ModType; value: number }[];
  description: string;
}

export const ARMOR_WEIGHT_BONUSES: Record<ArmorWeight, { bonusMods: { type: ModType; baseValue: number }[]; description: string }> = {
  light: {
    bonusMods: [
      { type: 'dodge', baseValue: 3 },
      { type: 'agility', baseValue: 2 },
    ],
    description: 'Light armor grants +Dodge and +Agility',
  },
  medium: {
    bonusMods: [
      { type: 'defense', baseValue: 2 },
      { type: 'maxHealth', baseValue: 10 },
    ],
    description: 'Medium armor grants balanced +Defense and +Health',
  },
  heavy: {
    bonusMods: [
      { type: 'defense', baseValue: 5 },
      { type: 'magicDefense', baseValue: 3 },
    ],
    description: 'Heavy armor grants high +Defense and +Magic Defense',
  },
};

// Get the appropriate tier for a given item level
export function getItemTier(itemLevel: number): ItemTier {
  // Find the highest tier the item level qualifies for
  let selectedTier = ITEM_TIERS[0];
  for (const tier of ITEM_TIERS) {
    if (itemLevel >= tier.requiredLevel) {
      selectedTier = tier;
    } else {
      break;
    }
  }
  return selectedTier;
}

// Get required level for an item based on its item level
export function getRequiredLevel(itemLevel: number): number {
  const tier = getItemTier(itemLevel);
  return tier.requiredLevel;
}

// Extended base items with weight categories and class restrictions
// Light = rogue/archer focused, Medium = mage/cleric focused, Heavy = warrior/barbarian focused
export const BASE_ITEMS: Record<EquipmentSlot, { name: string; icon: string; classes?: string[]; weight?: ArmorWeight }[]> = {
  helm: [
    { name: 'Leather Cap', icon: '🎩', classes: ['rogue', 'archer'], weight: 'light' },
    { name: 'Hood', icon: '🥷', classes: ['mage', 'cleric'], weight: 'medium' },
    { name: 'Iron Helm', icon: '⛑️', classes: ['warrior', 'barbarian'], weight: 'heavy' },
  ],
  amulet: [
    { name: 'Amulet', icon: '💎' },
  ],
  chest: [
    { name: 'Leather Armor', icon: '🎽', classes: ['rogue', 'archer'], weight: 'light' },
    { name: 'Chainmail', icon: '🛡️', classes: ['mage', 'cleric'], weight: 'medium' },
    { name: 'Plate Armor', icon: '🦺', classes: ['warrior', 'barbarian'], weight: 'heavy' },
  ],
  gloves: [
    { name: 'Leather Gloves', icon: '🧤', classes: ['rogue', 'archer'], weight: 'light' },
    { name: 'Bracers', icon: '💪', classes: ['mage', 'cleric'], weight: 'medium' },
    { name: 'Gauntlets', icon: '🥊', classes: ['warrior', 'barbarian'], weight: 'heavy' },
  ],
  belt: [
    { name: 'Leather Belt', icon: '🎗️' },
  ],
  boots: [
    { name: 'Sandals', icon: '👡', classes: ['rogue', 'archer'], weight: 'light' },
    { name: 'Leather Boots', icon: '🥾', classes: ['mage', 'cleric'], weight: 'medium' },
    { name: 'Plated Boots', icon: '👢', classes: ['warrior', 'barbarian'], weight: 'heavy' },
  ],
  weapon: [
    // General weapons
    { name: 'Short Sword', icon: 'sword' },
    // Warrior weapons
    { name: 'Long Sword', icon: 'sword', classes: ['warrior'] },
    { name: 'Claymore', icon: 'sword', classes: ['warrior'] },
    { name: 'Bastard Sword', icon: 'sword', classes: ['warrior'] },
    // Barbarian weapons
    { name: 'Battle Axe', icon: '🪓', classes: ['barbarian', 'warrior'] },
    { name: 'Great Axe', icon: '🪓', classes: ['barbarian'] },
    { name: 'Warhammer', icon: '🔨', classes: ['barbarian'] },
    { name: 'Maul', icon: '🔨', classes: ['barbarian'] },
    // Mage weapons
    { name: 'Staff', icon: '🪄', classes: ['mage', 'cleric'] },
    { name: 'Wand', icon: '✨', classes: ['mage'] },
    { name: 'Arcane Staff', icon: '🪄', classes: ['mage'] },
    // Cleric weapons
    { name: 'Mace', icon: '🔨', classes: ['cleric', 'warrior'] },
    { name: 'Holy Mace', icon: '⚡', classes: ['cleric'] },
    { name: 'Flail', icon: '🔗', classes: ['cleric'] },
    // Rogue weapons
    { name: 'Dagger', icon: 'sword', classes: ['rogue'] },
    { name: 'Rapier', icon: 'sword', classes: ['rogue'] },
    { name: 'Stiletto', icon: 'sword', classes: ['rogue'] },
    { name: 'Kris', icon: 'sword', classes: ['rogue'] },
    // Archer weapons
    { name: 'Bow', icon: '🏹', classes: ['archer'] },
    { name: 'Crossbow', icon: '🎯', classes: ['archer'] },
    { name: 'Longbow', icon: '🏹', classes: ['archer'] },
    { name: 'Composite Bow', icon: '🏹', classes: ['archer'] },
  ],
  offhand: [
    { name: 'Buckler', icon: '🛡️', classes: ['rogue', 'archer'], weight: 'light' },
    { name: 'Kite Shield', icon: '🛡️', classes: ['mage', 'cleric'], weight: 'medium' },
    { name: 'Tower Shield', icon: '🔰', classes: ['warrior', 'barbarian'], weight: 'heavy' },
  ],
  ring1: [
    { name: 'Ring', icon: '💍' },
    { name: 'Signet', icon: '💍' },
    { name: 'Band', icon: '💍' },
  ],
  ring2: [
    { name: 'Ring', icon: '💍' },
    { name: 'Signet', icon: '💍' },
    { name: 'Band', icon: '💍' },
  ],
};

// Legendary item prefixes with unique names - expanded for all classes
export const LEGENDARY_NAMES: Record<EquipmentSlot, string[]> = {
  helm: [
    "Veil of the Void", 
    "Crown of Eternal Night", 
    "Frostheart Circlet",
    "Barbarian's Fury Helm",
    "Archer's Eagle Eye",
    "Cleric's Divine Halo",
    "Helm of the Undying",
    "Nightstalker's Hood",
  ],
  amulet: [
    "Eye of the Abyss", 
    "Soulstone Pendant", 
    "Heart of the Dragon",
    "Talisman of the Titans",
    "Necklace of Eternity",
  ],
  chest: [
    "Dreadplate of Doom", 
    "Mantle of the Phoenix", 
    "Armor of the Ancients",
    "Berserker's Warharness",
    "Robes of the Archmage",
    "Vestments of Faith",
    "Chains of the Damned",
    "Shadowweave Tunic",
  ],
  gloves: [
    "Grip of the Reaper", 
    "Frostbite Gauntlets", 
    "Hands of Fury",
    "Archer's Precision Grips",
    "Healer's Blessed Touch",
    "Gloves of the Assassin",
    "Titan's Fist",
  ],
  belt: [
    "Girdle of Giants", 
    "Chain of Eternity",
    "Belt of the Immortal",
    "Sash of the Titans",
    "Binding of Souls",
  ],
  boots: [
    "Shadowstep Treads", 
    "Stormwalkers", 
    "Boots of the Titan",
    "Windrunner's Swift",
    "Crusader's March",
    "Footfalls of the Phantom",
    "Greaves of the Colossus",
  ],
  weapon: [
    "Soulreaver", 
    "Frostmourne", 
    "The Grandfather", 
    "Doombringer", 
    "Windforce",
    "Skull of Gul'dan",
    "Heaven's Light",
    "Butcher's Cleaver",
    "Eaglehorn",
    "Azurewrath",
    "Deathbringer",
    "Starfire",
    "Shadowfang",
  ],
  offhand: [
    "Aegis of Valor", 
    "Lidless Wall", 
    "Stormshield",
    "Tome of the Dead",
    "Sacred Relic",
    "Rakanishu's Blade",
    "Orb of Infinite Wisdom",
    "Defender of the Light",
  ],
  ring1: [
    "Stone of Jordan", 
    "Band of Skulls", 
    "Ring of Power",
    "Archer's Mark",
    "Berserker's Rage Ring",
    "Circle of the Ancients",
  ],
  ring2: [
    "Unity", 
    "Obsidian Ring of the Zodiac", 
    "Circle of Nailuj",
    "Healer's Blessing",
    "Ring of Royal Grandeur",
    "Eternal Band",
  ],
};
