export type Phase = 'title' | 'playing' | 'dead' | 'won';

export type EnemyKind = 'husk' | 'wisp' | 'brute';

export type RuneId = 'missiles' | 'frost' | 'chain' | 'firecore';

export interface RuneDef {
  id: RuneId;
  name: string;
  color: string;
  desc: string;
  baseDamage: number;
  baseCooldown: number; // seconds between shots
  projectileSpeed: number; // screen px/sec
  unlockCost: number;
  upgradeCostBase: number;
  maxStars: number;
}

export interface RuneSlot {
  id: RuneId;
  unlocked: boolean;
  stars: number; // 0 while locked, 1..maxStars once unlocked
  cooldownTimer: number;
}

export type BossState = 'advance' | 'telegraph' | 'recover';

export interface Enemy {
  id: number;
  kind: EnemyKind;
  depth: number; // 0 = horizon (just spawned), 1 = reached the tower
  lane: number; // -1..1, lateral position
  speed: number; // depth units per second
  hp: number;
  maxHp: number;
  damage: number; // damage dealt to the tower on arrival / per boss attack
  slowTimer: number;
  slowMult: number;
  flash: number; // hit-flash seconds remaining
  wobble: number; // per-enemy animation phase
  isBoss?: boolean;
  name?: string;
  bstate?: BossState;
  btimer?: number;
  batkCd?: number;
  phase2?: boolean;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  life: number;
  style: RuneId;
  radius: number;
  slowOnHit?: { mult: number; duration: number };
  chainOnHit?: { pct: number; radius: number };
  splashRadius?: number;
  splashPct?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface DamageNumber {
  x: number;
  y: number;
  vy: number;
  life: number;
  value: number;
  crit: boolean;
}

export interface GameState {
  phase: Phase;
  enemies: Enemy[];
  projectiles: Projectile[];
  particles: Particle[];
  damageNumbers: DamageNumber[];
  runes: RuneSlot[];
  gold: number;
  towerHp: number;
  towerMaxHp: number;
  waveIndex: number;
  waveTime: number;
  spawnTimer: number;
  bossActive: boolean;
  bossMaxHp: number;
  kills: number;
  nextId: number;
  shake: number;
  aimX: number;
  aimY: number;
}
