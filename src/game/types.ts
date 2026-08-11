export interface Vec2 { x: number; y: number; }

export type EnemyKind = 'slime' | 'bat' | 'skeleton';

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  damage: number;
  xp: number;
  flash: number;      // seconds of hit-flash remaining
  knockX: number;     // knockback velocity
  knockY: number;
  hitCd: number;      // per-enemy cooldown before it can damage player again
  facingLeft: boolean;
  bob: number;
  anim: number;       // animation clock (frame timing)
  age: number;        // seconds since spawn (spawn-in pop)
}

export interface Bolt {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  pierce: number;     // enemies it can still pass through
  life: number;       // seconds remaining
  hitIds: number[];   // enemies already hit (avoid double hits)
  rot: number;
}

export interface Gem {
  x: number;
  y: number;
  value: number;
  vx: number;
  vy: number;
  homing: boolean;
  bob: number;
}

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string;
  size: number;
}

export interface DamageNumber {
  x: number; y: number;
  vy: number;
  life: number;
  value: number;
  crit: boolean;
}

export interface PlayerStats {
  maxHp: number;
  moveSpeed: number;
  damage: number;
  attackCd: number;       // seconds between shots
  boltSpeed: number;
  boltCount: number;
  pierce: number;
  knockback: number;
  pickupRadius: number;
  critChance: number;
}

export interface Player {
  x: number;
  y: number;
  radius: number;
  hp: number;
  level: number;
  xp: number;
  xpToNext: number;
  facingLeft: boolean;
  faceDir: 'down' | 'up' | 'side';   // body orientation (top-down)
  bob: number;
  invuln: number;         // seconds of post-hit invulnerability
  hurtFlash: number;
  attackTimer: number;
  aimX: number;           // current aim direction
  aimY: number;
  moving: boolean;
  animTime: number;       // walk-cycle clock
  attackAnim: number;     // seconds of attack pose remaining
  stats: PlayerStats;
}

export type Phase = 'title' | 'playing' | 'levelup' | 'dead' | 'won';

export interface Upgrade {
  id: string;
  icon: string;
  title: string;
  desc: string;
  apply: (s: PlayerStats) => void;
}

export interface GameState {
  phase: Phase;
  player: Player;
  enemies: Enemy[];
  bolts: Bolt[];
  gems: Gem[];
  particles: Particle[];
  damageNumbers: DamageNumber[];
  time: number;
  spawnTimer: number;
  nextId: number;
  kills: number;
  shake: number;
  offeredUpgrades: Upgrade[];
}

export const WIN_TIME = 180; // survive 3 minutes
