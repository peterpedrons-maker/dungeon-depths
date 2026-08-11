export interface Vec2 {
  x: number;
  y: number;
}

export type EnemyKind = 'slime' | 'bat' | 'skeleton';

export interface Enemy {
  id: number;
  kind: EnemyKind;
  pos: Vec2;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
  hitFlash: number; // frames of white flash after taking damage
  wobble: number;   // per-enemy phase for idle animation
}

export interface Player {
  pos: Vec2;
  radius: number;
  hp: number;
  maxHp: number;
  facing: number; // radians
  bob: number;    // idle bob phase
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  time: number;        // seconds elapsed
  spawnTimer: number;  // seconds until next spawn
  nextId: number;
  kills: number;
  running: boolean;
}

export const ENEMY_STATS: Record<
  EnemyKind,
  { radius: number; speed: number; hp: number; color: string; accent: string }
> = {
  slime:    { radius: 16, speed: 34, hp: 12, color: '#4ade80', accent: '#166534' },
  bat:      { radius: 13, speed: 62, hp: 7,  color: '#7c3aed', accent: '#2e1065' },
  skeleton: { radius: 15, speed: 46, hp: 18, color: '#e5e7eb', accent: '#6b7280' },
};
