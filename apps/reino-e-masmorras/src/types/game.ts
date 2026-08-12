export type ClassId = 'guerreiro' | 'mago' | 'arqueiro' | 'clerigo';

export interface ClassDef {
  id: ClassId;
  name: string;
  color: string;
  desc: string;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  critChance: number;
  lifesteal: number; // fraction of damage dealt recovered as HP
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

export interface RankEntry {
  name: string;
  classId: ClassId;
  depth: number;
  level: number;
  date: string;
}

export type Screen = 'title' | 'create' | 'hub' | 'dungeon' | 'ranking';
