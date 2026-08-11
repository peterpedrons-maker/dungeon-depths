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
  // ── boss-only ──
  isBoss?: boolean;
  name?: string;
  bstate?: 'chase' | 'telegraph' | 'charge' | 'recover';
  btimer?: number;    // time left in current boss state
  batkCd?: number;    // time until next attack
  cvx?: number; cvy?: number; // charge velocity
}

export interface Hazard {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  radius: number;
  damage: number;
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
  hazards: Hazard[];
  particles: Particle[];
  damageNumbers: DamageNumber[];
  time: number;
  spawnTimer: number;
  nextId: number;
  kills: number;
  shake: number;
  offeredUpgrades: Upgrade[];
  // ── floor / descent ──
  floor: number;
  floorPhase: 'waves' | 'boss' | 'cleared';
  floorTimer: number;
  stair: { x: number; y: number } | null;
}

export const FLOOR_COUNT = 3;
export const FLOOR_WAVE_TIME = 35; // seconds of waves before the boss

export interface Biome {
  name: string;
  ground: string; seam: string; hi1: string; hi2: string;
}
export const BIOMES: Biome[] = [
  { name: 'Catacumbas', ground: '#2a2438', seam: '#221d30', hi1: '#312a44', hi2: '#3a3350' },
  { name: 'Cavernas Úmidas', ground: '#1f2e2a', seam: '#182420', hi1: '#26382f', hi2: '#2f463a' },
  { name: 'O Abismo', ground: '#301b22', seam: '#24141a', hi1: '#3c222a', hi2: '#4a2730' },
];
export const BOSS_NAMES = ['Guardião de Osso', 'Horror da Caverna', 'Coração das Trevas'];
