import { EnemyKind } from './types';

export interface EnemyDef {
  kind: EnemyKind;
  name: string;
  color: string;
  hp: number;
  speed: number; // depth units per second (1.0 = full horizon-to-tower crossing in 1s)
  damage: number; // dealt to the tower if it reaches depth 1
  radius: number; // base screen radius at scale 1
  gold: number;
}

export const ENEMY_DEFS: Record<EnemyKind, EnemyDef> = {
  husk: { kind: 'husk', name: 'Corrompido', color: '#6a7a4a', hp: 18, speed: 0.065, damage: 6, radius: 20, gold: 3 },
  wisp: { kind: 'wisp', name: 'Espectro', color: '#8a5ac0', hp: 10, speed: 0.11, damage: 4, radius: 15, gold: 4 },
  brute: { kind: 'brute', name: 'Brutamontes', color: '#9a3a2a', hp: 60, speed: 0.04, damage: 14, radius: 30, gold: 9 },
};
