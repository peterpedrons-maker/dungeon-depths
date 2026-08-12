import { EnemyKind } from './types';

export type Movement = 'chase' | 'weave' | 'ranged' | 'erratic';

export interface EnemyDef {
  hp: number;
  speed: number;
  radius: number;
  damage: number;
  xp: number;
  movement: Movement;
  color: string;
  splitsInto?: EnemyKind;
  splitCount?: number;
  rangedRange?: number;
  rangedCd?: number;
  rangedSpread?: number;  // extra shots fired in a fan around the aimed shot
  rangedBurst?: boolean;  // shoot in all directions instead of aimed
}

export const ENEMY_DEFS: Record<EnemyKind, EnemyDef> = {
  slime:    { hp: 14,  speed: 40,  radius: 15, damage: 8,  xp: 1, movement: 'chase',   color: '#5fbf46' },
  bat:      { hp: 8,   speed: 82,  radius: 12, damage: 6,  xp: 1, movement: 'weave',   color: '#8a5ad0' },
  skeleton: { hp: 26,  speed: 54,  radius: 14, damage: 12, xp: 3, movement: 'chase',   color: '#e8e4d4' },
  runner:   { hp: 12,  speed: 118, radius: 11, damage: 9,  xp: 2, movement: 'chase',   color: '#f0873a' },
  brute:    { hp: 90,  speed: 34,  radius: 22, damage: 20, xp: 6, movement: 'chase',   color: '#b3455f' },
  caster:   { hp: 30,  speed: 44,  radius: 13, damage: 8,  xp: 4, movement: 'ranged',  color: '#c084fc',
              rangedRange: 190, rangedCd: 2.2 },
  spider:   { hp: 18,  speed: 70,  radius: 13, damage: 10, xp: 2, movement: 'erratic', color: '#6b7280' },
  ghost:    { hp: 22,  speed: 60,  radius: 13, damage: 11, xp: 3, movement: 'chase',   color: '#a5f3fc' },
  bigSlime: { hp: 46,  speed: 30,  radius: 22, damage: 12, xp: 4, movement: 'chase',   color: '#5fbf46',
              splitsInto: 'slime', splitCount: 3 },
  // ── New enemies ──
  demon:    { hp: 35,  speed: 100, radius: 13, damage: 14, xp: 3, movement: 'chase',   color: '#e84040' },
  golem:    { hp: 180, speed: 22,  radius: 24, damage: 25, xp: 8, movement: 'chase',   color: '#9a9080' },
  witch:    { hp: 28,  speed: 50,  radius: 13, damage: 9,  xp: 4, movement: 'ranged',  color: '#a060d0',
              rangedRange: 200, rangedCd: 1.8, rangedSpread: 2 },
  mushroom: { hp: 20,  speed: 18,  radius: 14, damage: 7,  xp: 2, movement: 'ranged',  color: '#d03020',
              rangedRange: 70,  rangedCd: 2.8, rangedBurst: true },
};
