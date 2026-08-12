// Character Classes with Attribute-based stats

import { PrimaryAttributes, calculateDerivedStats, CharacterStats } from './attributes';

export type CharacterClass = 
  | 'warrior' 
  | 'rogue' 
  | 'mage' 
  | 'cleric' 
  | 'barbarian' 
  | 'archer';

// Base attributes for each class at level 1
export const CLASS_BASE_ATTRIBUTES: Record<CharacterClass, PrimaryAttributes> = {
  // Warrior: Balanced melee fighter with good defense
  warrior: {
    strength: 14,
    dexterity: 10,
    vitality: 12,
    intelligence: 6,
    charisma: 8,
  },
  
  // Rogue: High crit and dodge, finesse fighter
  rogue: {
    strength: 8,
    dexterity: 16,
    vitality: 8,
    intelligence: 8,
    charisma: 10,
  },
  
  // Mage: Glass cannon with high magic damage
  mage: {
    strength: 5,
    dexterity: 8,
    vitality: 6,
    intelligence: 18,
    charisma: 8,
  },
  
  // Cleric: Healer/support with good magic and vitality
  cleric: {
    strength: 8,
    dexterity: 8,
    vitality: 12,
    intelligence: 14,
    charisma: 10,
  },
  
  // Barbarian: Pure damage dealer with massive health
  barbarian: {
    strength: 18,
    dexterity: 8,
    vitality: 14,
    intelligence: 4,
    charisma: 6,
  },
  
  // Archer: Ranged specialist with high precision
  archer: {
    strength: 10,
    dexterity: 18,
    vitality: 8,
    intelligence: 6,
    charisma: 8,
  },
};

// Attribute growth per level for each class
export const CLASS_ATTRIBUTE_GROWTH: Record<CharacterClass, Partial<PrimaryAttributes>> = {
  warrior: { strength: 2, dexterity: 1, vitality: 2, intelligence: 0, charisma: 1 },
  rogue: { strength: 1, dexterity: 3, vitality: 1, intelligence: 1, charisma: 1 },
  mage: { strength: 0, dexterity: 1, vitality: 1, intelligence: 3, charisma: 1 },
  cleric: { strength: 1, dexterity: 1, vitality: 2, intelligence: 2, charisma: 1 },
  barbarian: { strength: 3, dexterity: 1, vitality: 2, intelligence: 0, charisma: 0 },
  archer: { strength: 1, dexterity: 3, vitality: 1, intelligence: 1, charisma: 1 },
};

// Class descriptions
export const CLASS_DESCRIPTIONS: Record<CharacterClass, string> = {
  warrior: 'Balanced melee fighter with strong defense and reliable damage.',
  rogue: 'Agile assassin with high critical hits and evasion.',
  mage: 'Arcane master dealing devastating magical damage.',
  cleric: 'Divine healer with supportive magic and holy power.',
  barbarian: 'Unstoppable berserker with massive health and brutal attacks.',
  archer: 'Precision marksman with deadly accuracy and range.',
};

// Class special abilities (for future implementation)
export const CLASS_ABILITIES: Record<CharacterClass, { name: string; description: string; manaCost: number }[]> = {
  warrior: [
    { name: 'Shield Bash', description: 'Stun enemy for 1 turn', manaCost: 15 },
    { name: 'Battle Cry', description: 'Boost attack by 25% for 3 turns', manaCost: 20 },
  ],
  rogue: [
    { name: 'Backstab', description: 'Deal 200% damage with guaranteed crit', manaCost: 20 },
    { name: 'Vanish', description: 'Become invisible, next attack deals bonus damage', manaCost: 25 },
  ],
  mage: [
    { name: 'Fireball', description: 'Deal magic damage to enemy', manaCost: 15 },
    { name: 'Ice Shield', description: 'Increase magic defense by 50% for 3 turns', manaCost: 18 },
  ],
  cleric: [
    { name: 'Heal', description: 'Restore 30% of max health', manaCost: 20 },
    { name: 'Smite', description: 'Deal holy damage based on INT', manaCost: 15 },
  ],
  barbarian: [
    { name: 'Rage', description: 'Increase attack by 50% but reduce defense by 25%', manaCost: 10 },
    { name: 'Whirlwind', description: 'Deal damage ignoring 50% of enemy defense', manaCost: 25 },
  ],
  archer: [
    { name: 'Aimed Shot', description: 'Deal 150% damage with +20% crit chance', manaCost: 15 },
    { name: 'Rain of Arrows', description: 'Deal damage 3 times', manaCost: 30 },
  ],
};

// Calculate starting stats for a class
export function getClassStartingStats(characterClass: CharacterClass): CharacterStats {
  const attrs = CLASS_BASE_ATTRIBUTES[characterClass];
  const derived = calculateDerivedStats(attrs, 1);
  
  return {
    ...derived,
    gold: 50,
    experience: 0,
    level: 1,
  };
}

// Get attribute total for display
export function getAttributeTotal(attrs: PrimaryAttributes): number {
  return attrs.strength + attrs.dexterity + attrs.vitality + attrs.intelligence + attrs.charisma;
}

// Class recommended equipment types
export const CLASS_PREFERRED_WEAPONS: Record<CharacterClass, string[]> = {
  warrior: ['Long Sword', 'Short Sword', 'Battle Axe'],
  rogue: ['Dagger', 'Short Sword'],
  mage: ['Staff', 'Tome'],
  cleric: ['Staff', 'Tome'],
  barbarian: ['Battle Axe', 'Long Sword'],
  archer: ['Bow', 'Crossbow'],
};

// Class icons mapping
export const CLASS_ICONS: Record<CharacterClass, string> = {
  warrior: 'Sword',
  rogue: 'Eye',
  mage: 'Sparkles',
  cleric: 'Heart',
  barbarian: 'Axe',
  archer: 'Target',
};
