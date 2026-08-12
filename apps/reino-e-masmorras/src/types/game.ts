export type ClassId = 'guerreiro' | 'mago' | 'assassino';

export interface ClassDef {
  id: ClassId;
  name: string;
  color: string;
  desc: string;
  weaponBase: string; // base weapon name, e.g. "Espada"
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  critChance: number;
}

export type Rarity = 'comum' | 'incomum' | 'raro' | 'epico' | 'legendario';

export interface Weapon {
  id: string;
  name: string;
  classId: ClassId;
  rarity: Rarity;
  dmgBonus: number;
  secondaryStat?: { type: 'crit' | 'def'; value: number };
}

export interface Equipment {
  weapon: Weapon | null;
}

export interface Character {
  name: string;
  classId: ClassId;
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  gold: number;
  potions: number;
  bestDepth: number;
  skillPoints: number;
  unlockedSkills: string[]; // node ids, e.g. "guerreiro:furioso:0"
  equipment: Equipment;
  inventory: Weapon[];
}

export type EnemyShape = 'goblin' | 'wolf' | 'skeleton' | 'orc' | 'troll' | 'dragon' | 'horror';

export interface EnemyTier {
  shape: EnemyShape;
  name: string;
  color: string;
  minDepth: number;
  hp: number;
  atk: number;
  def: number;
  xp: number;
  gold: number;
}

export interface EnemyInstance {
  name: string;
  shape: EnemyShape;
  color: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  xpReward: number;
  goldReward: number;
}

export interface DungeonDef {
  id: string;
  name: string;
  desc: string;
  startDepth: number;
  special?: boolean;
  enemyPool?: EnemyShape[];
  goldMult?: number;
  xpMult?: number;
  dropMult?: number;
  dmgTakenMult?: number;
}

export interface RankEntry {
  name: string;
  classId: ClassId;
  depth: number;
  level: number;
  date: string;
}

export type Screen = 'title' | 'create' | 'game';
export type Section = 'kingdom' | 'character' | 'skills' | 'merchant' | 'highscore' | 'dungeon';

// ── Combat-facing stat bundle, after class base + level growth + equipment + skill tree ──
export interface CombatStats {
  atk: number;
  def: number;
  critChance: number;
  critDmgMult: number;
  blockChance: number;
}
