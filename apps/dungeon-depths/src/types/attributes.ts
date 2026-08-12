// Comprehensive Attribute System - Diablo-style RPG Attributes

// Primary Attributes
export interface PrimaryAttributes {
  strength: number;     // STR - Physical damage, carry capacity
  dexterity: number;    // DEX - Agility, crit chance, dodge
  vitality: number;     // VIT - Health, stamina
  intelligence: number; // INT - Magic damage, mana, magic resist
  charisma: number;     // CHA - Gold find, merchant prices, companion bonuses
}

// Derived/Secondary Stats calculated from attributes
export interface DerivedStats {
  // Offensive Stats
  attack: number;           // Physical damage (base from STR)
  magicAttack: number;      // Magic damage (base from INT)
  critChance: number;       // Critical hit chance % (base from DEX)
  critDamage: number;       // Critical damage multiplier % (base 150%)
  
  // Defensive Stats  
  defense: number;          // Physical damage reduction (base from STR + VIT)
  magicDefense: number;     // Magic damage reduction (base from INT)
  dodge: number;            // Chance to evade attacks % (base from DEX)
  
  // Resource Stats
  maxHealth: number;        // Maximum HP (base from VIT)
  health: number;           // Current HP
  maxMana: number;          // Maximum Mana (base from INT)
  mana: number;             // Current Mana
  
  // Utility Stats
  agility: number;          // Turn order, action speed (base from DEX)
  goldFind: number;         // Bonus gold % (base from CHA)
  expBonus: number;         // Bonus experience % (base from CHA + INT)
  lifeSteal: number;        // HP on hit % (from items)
}

// Full character stats including resources
export interface CharacterStats extends DerivedStats {
  gold: number;
  experience: number;
  level: number;
}

// Attribute scaling formulas - how each attribute affects derived stats
// BALANCED: Reduced player stat scaling for more challenging combat
export const ATTRIBUTE_SCALING = {
  // STR scaling (reduced from 1.5/0.5 to 1.0/0.3)
  attackPerStr: 1.0,           // +1.0 attack per STR
  defensePerStr: 0.3,          // +0.3 defense per STR
  
  // DEX scaling (reduced crit and dodge)
  agilityPerDex: 1.0,          // +1 agility per DEX
  critChancePerDex: 0.2,       // +0.2% crit per DEX (was 0.3)
  dodgePerDex: 0.15,           // +0.15% dodge per DEX (was 0.25)
  attackPerDex: 0.3,           // +0.3 attack per DEX (was 0.5)
  
  // VIT scaling (reduced HP per VIT)
  healthPerVit: 8,             // +8 HP per VIT (was 10)
  defensePerVit: 0.2,          // +0.2 defense per VIT (was 0.3)
  
  // INT scaling (reduced magic attack)
  magicAttackPerInt: 1.5,      // +1.5 magic attack per INT (was 2.0)
  magicDefensePerInt: 0.4,     // +0.4 magic defense per INT (was 0.5)
  manaPerInt: 6,               // +6 mana per INT (was 8)
  expBonusPerInt: 0.2,         // +0.2% exp per INT
  
  // CHA scaling
  goldFindPerCha: 0.5,         // +0.5% gold find per CHA
  expBonusPerCha: 0.3,         // +0.3% exp per CHA
} as const;

// Calculate derived stats from primary attributes
// BALANCED: Lower base stats for more challenging early game
export function calculateDerivedStats(attrs: PrimaryAttributes, level: number): DerivedStats {
  const { strength, dexterity, vitality, intelligence, charisma } = attrs;
  const s = ATTRIBUTE_SCALING;
  
  // Reduced base HP (40 from 50) and level scaling (4 from 5)
  const maxHealth = 40 + (vitality * s.healthPerVit) + (level * 4);
  // Reduced base mana (15 from 20) and level scaling (2 from 3)
  const maxMana = 15 + (intelligence * s.manaPerInt) + (level * 2);
  
  return {
    // Offensive - reduced base values
    attack: Math.floor(3 + (strength * s.attackPerStr) + (dexterity * s.attackPerDex)),
    magicAttack: Math.floor(3 + (intelligence * s.magicAttackPerInt)),
    critChance: Math.floor(3 + (dexterity * s.critChancePerDex)), // was 5
    critDamage: 140, // Base 140%, was 150%
    
    // Defensive - reduced base values
    defense: Math.floor(1 + (strength * s.defensePerStr) + (vitality * s.defensePerVit)),
    magicDefense: Math.floor(1 + (intelligence * s.magicDefensePerInt)),
    dodge: Math.floor(dexterity * s.dodgePerDex),
    
    // Resources
    maxHealth: Math.floor(maxHealth),
    health: Math.floor(maxHealth),
    maxMana: Math.floor(maxMana),
    mana: Math.floor(maxMana),
    
    // Utility
    agility: Math.floor(10 + (dexterity * s.agilityPerDex)),
    goldFind: Math.floor(charisma * s.goldFindPerCha),
    expBonus: Math.floor((intelligence * s.expBonusPerInt) + (charisma * s.expBonusPerCha)),
    lifeSteal: 0, // Only from items
  };
}

// Attribute points per level
export const ATTRIBUTE_POINTS_PER_LEVEL = 3;

// Level up stat bonuses per attribute point invested
export function getAttributePointBonus(attr: keyof PrimaryAttributes): Partial<DerivedStats> {
  switch (attr) {
    case 'strength':
      return { attack: 2, defense: 1 };
    case 'dexterity':
      return { agility: 1, critChance: 0.5, dodge: 0.3 };
    case 'vitality':
      return { maxHealth: 10, defense: 0.5 };
    case 'intelligence':
      return { magicAttack: 2, maxMana: 8, magicDefense: 1 };
    case 'charisma':
      return { goldFind: 1, expBonus: 0.5 };
    default:
      return {};
  }
}

// Attribute display info
export const ATTRIBUTE_INFO: Record<keyof PrimaryAttributes, { 
  name: string; 
  abbrev: string; 
  description: string;
  color: string;
}> = {
  strength: {
    name: 'Strength',
    abbrev: 'STR',
    description: 'Increases physical attack and defense. Essential for Warriors and Barbarians.',
    color: 'text-red-400',
  },
  dexterity: {
    name: 'Dexterity',
    abbrev: 'DEX',
    description: 'Increases agility, critical chance, and dodge. Essential for Rogues and Archers.',
    color: 'text-green-400',
  },
  vitality: {
    name: 'Vitality',
    abbrev: 'VIT',
    description: 'Increases maximum health and physical resistance. Important for all classes.',
    color: 'text-orange-400',
  },
  intelligence: {
    name: 'Intelligence',
    abbrev: 'INT',
    description: 'Increases magic attack, mana, and magic defense. Essential for Mages and Clerics.',
    color: 'text-blue-400',
  },
  charisma: {
    name: 'Charisma',
    abbrev: 'CHA',
    description: 'Increases gold find and experience gain. Useful for all classes.',
    color: 'text-purple-400',
  },
};
