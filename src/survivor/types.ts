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
  hitFlash: number; // seconds of white flash after taking damage
  wobble: number;   // per-enemy phase for idle animation
  heading: number;  // radians, direction the enemy is oriented (top-down)
  age: number;      // seconds since spawn (used for a spawn-in animation)
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

export interface EnemyStyle {
  radius: number;
  speed: number;
  hp: number;
  light: string; // top-lit highlight
  base: string;  // mid tone
  dark: string;  // shadowed underside / edge
}

export const ENEMY_STATS: Record<EnemyKind, EnemyStyle> = {
  slime:    { radius: 17, speed: 34, hp: 12, light: '#a7f3d0', base: '#34d399', dark: '#065f46' },
  bat:      { radius: 15, speed: 62, hp: 7,  light: '#a78bfa', base: '#7c3aed', dark: '#2e1065' },
  skeleton: { radius: 16, speed: 46, hp: 18, light: '#ffffff', base: '#d6d3c8', dark: '#78716c' },
};
