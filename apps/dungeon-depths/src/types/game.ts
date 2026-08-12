// Game Types for Dungeon Crawler
import { LootItem, EquippedItems } from './items';

// Game constants
export const MAX_LEVEL = 60;
import { PrimaryAttributes, CharacterStats as DerivedCharacterStats } from './attributes';
import { CharacterClass } from './classes';
import { LearnedSkill, ActiveBuff } from './skills';

// Re-export CharacterClass for backwards compatibility
export type { CharacterClass } from './classes';

export interface CharacterStats extends DerivedCharacterStats {
  // All stats now come from DerivedCharacterStats
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'potion';
  value: number;
  effect: number; // Attack boost for weapons, defense for armor, heal for potions
  description: string;
}

export interface Character {
  name: string;
  class: CharacterClass;
  stats: CharacterStats;
  attributes: PrimaryAttributes;
  attributePoints: number; // Unspent attribute points
  skillPoints: number; // Unspent skill points
  skills: LearnedSkill[]; // Learned skills with ranks
  equippedWeapon: Item | null;
  equippedArmor: Item | null;
  inventory: LootItem[];
  equippedItems: EquippedItems;
}

// Enemy special ability types
export type EnemyAbilityType = 
  | 'poison'      // DoT damage over time
  | 'stun'        // Skip player's next auto-attack
  | 'multi_hit'   // Attack multiple times
  | 'lifesteal'   // Heal when dealing damage
  | 'enrage'      // Boost own attack temporarily
  | 'weaken';     // Reduce player's attack

export interface EnemyAbility {
  type: EnemyAbilityType;
  chance: number;     // % chance to use (0-100)
  value: number;      // Effect value (damage, duration, etc.)
  duration?: number;  // Duration in seconds for DoT/buffs
  description: string;
}

export interface Enemy {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  magicAttack?: number;
  magicDefense?: number;
  goldReward: number;
  expReward: number;
  description: string;
  abilities?: EnemyAbility[];
}

export type EncounterType = 
  | 'battle' 
  | 'merchant'
  | 'treasure';

export type PathDirection = 'forward' | 'left' | 'right';

export interface PathChoice {
  id: string;
  name: string;
  direction: PathDirection;
  description: string;
  riskLevel: 1 | 2 | 3; // 1 = low, 2 = medium, 3 = high
  encounterType: EncounterType;
}

export interface DiscoveredRoom extends DungeonRoom {
  directionTaken: PathDirection;
  visited: boolean;
}

export interface DungeonRoom {
  id: string;
  name: string;
  description: string;
  theme: 'mossy' | 'crypt' | 'lava' | 'ice';
  floor: number;
  paths: PathChoice[];
}

export type GameScreen = 
  | 'menu' 
  | 'character-creation' 
  | 'dungeon' 
  | 'combat' 
  | 'encounter'
  | 'merchant'
  | 'game-over'
  | 'victory';

export interface CombatState {
  enemy: Enemy;
  playerTurn: boolean;
  combatLog: string[];
  isDefending: boolean;
  activeBuffs: ActiveBuff[]; // Active buffs on player
  enemyDebuffs: ActiveBuff[]; // Debuffs on enemy
  playerDebuffs: ActiveBuff[]; // Debuffs on player (poison, weaken, etc.)
  enemyBuffs: ActiveBuff[]; // Buffs on enemy (enrage, etc.)
  shieldAmount: number; // Damage absorption shield
  isStunned: boolean; // Player is stunned (skips next auto-attack)
  // Semi-idle combat additions
  playerActionBar: number; // 0-100, auto-attacks when full
  enemyActionBar: number; // 0-100, attacks when full
  isPaused: boolean; // Pause combat (e.g., when using menus)
  lastTickTime: number; // For calculating delta time
}

export interface GameState {
  screen: GameScreen;
  character: Character | null;
  currentRoom: DungeonRoom | null;
  currentEncounter: EncounterType | null;
  currentPathId: string | null; // Track which path was chosen
  combat: CombatState | null;
  dungeonFloor: number;
  roomsCleared: number;
  discoveredRooms: DiscoveredRoom[];
  lastDirection: PathDirection | null;
  clearedPathIds: string[]; // Track completed paths by their unique ID
  pathToRoom: Record<string, string>; // Maps pathId -> roomId for persistence
}

// Legacy compatibility - import from classes.ts
export { CLASS_DESCRIPTIONS } from './classes';

// Legacy compatibility - calculate base stats from attributes
import { CLASS_BASE_ATTRIBUTES, getClassStartingStats } from './classes';

export const CLASS_BASE_STATS: Record<CharacterClass, Omit<CharacterStats, 'gold' | 'experience' | 'level'>> = {
  warrior: (() => {
    const stats = getClassStartingStats('warrior');
    const { gold, experience, level, ...rest } = stats;
    return rest;
  })(),
  rogue: (() => {
    const stats = getClassStartingStats('rogue');
    const { gold, experience, level, ...rest } = stats;
    return rest;
  })(),
  mage: (() => {
    const stats = getClassStartingStats('mage');
    const { gold, experience, level, ...rest } = stats;
    return rest;
  })(),
  cleric: (() => {
    const stats = getClassStartingStats('cleric');
    const { gold, experience, level, ...rest } = stats;
    return rest;
  })(),
  barbarian: (() => {
    const stats = getClassStartingStats('barbarian');
    const { gold, experience, level, ...rest } = stats;
    return rest;
  })(),
  archer: (() => {
    const stats = getClassStartingStats('archer');
    const { gold, experience, level, ...rest } = stats;
    return rest;
  })(),
};
