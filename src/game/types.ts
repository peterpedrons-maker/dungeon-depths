export interface Vec2 { x: number; y: number; }

export type EnemyKind =
  | 'slime' | 'bat' | 'skeleton'
  | 'runner' | 'brute' | 'caster' | 'spider' | 'ghost' | 'bigSlime';

export type BossAttack = 'charge' | 'burst' | 'summon' | 'slam' | 'volley';

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
  orbCd: number;      // per-enemy cooldown for orbiting-weapon hits
  atkCd: number;      // ranged attack cooldown (casters)
  facingLeft: boolean;
  bob: number;
  anim: number;       // animation clock (frame timing)
  age: number;        // seconds since spawn (spawn-in pop)
  wobble: number;     // per-enemy movement phase (weaving)
  // ── boss-only ──
  isBoss?: boolean;
  name?: string;
  bstate?: 'chase' | 'telegraph' | 'act' | 'charge' | 'recover';
  bnext?: BossAttack; // attack queued during telegraph
  btimer?: number;    // time left in current boss state
  batkCd?: number;    // time until next attack
  cvx?: number; cvy?: number; // charge velocity
  phase2?: boolean;   // enraged below 50% hp
}

export interface Hazard {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  radius: number;
  damage: number;
  telegraph?: number; // seconds of warn-up before it becomes dangerous
  color?: string;
}

export type BoltStyle = 'bolt' | 'fire' | 'arrow' | 'slash';

export interface Bolt {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  pierce: number;     // enemies it can still pass through
  life: number;       // seconds remaining
  maxLife: number;
  hitIds: number[];   // enemies already hit (avoid double hits)
  rot: number;
  style: BoltStyle;
  hitR: number;       // world-space hit radius (fat for slashes)
  // ── melee slash: swings in an arc anchored to the hero ──
  anchor?: boolean;
  ang?: number;       // current swing angle
  angVel?: number;    // radians/sec swept
  reach?: number;     // distance from the hero the blade travels
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
  boltCount: number;      // projectiles per shot (or orbiting orbs)
  pierce: number;
  knockback: number;
  pickupRadius: number;
  critChance: number;
  range: number;          // reach (melee slash length / etc.)
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
  bob: number;
  invuln: number;         // seconds of post-hit invulnerability
  hurtFlash: number;
  attackTimer: number;
  aimX: number;           // current aim direction
  aimY: number;
  moving: boolean;
  animTime: number;       // walk-cycle clock
  attackAnim: number;     // seconds of attack pose remaining
  dashTimer: number;      // seconds of active dash remaining
  dashCd: number;         // seconds until dash is ready again
  dashX: number; dashY: number; // dash direction
  classId: ClassId;
  weapon: WeaponKind;
  orbAngle: number;       // rotation of orbiting weapon
  stats: PlayerStats;
}

export const DASH_COOLDOWN = 1.1;

// ── Camera zoom ──
// World units -> screen px. Zooming out shows more of the arena, but it also
// makes every world distance (the off-screen spawn ring, weapon reach, …)
// larger in world units. WORLD scales speeds and distances by the same factor
// so the game plays exactly as it looks at 1:1 — just with a wider view.
export const ZOOM = 2 / 3;
export const WORLD = 1 / ZOOM;

export const ORBIT_RADIUS = 34 * WORLD;

export type Phase =
  | 'title' | 'stageSelect' | 'classSelect'
  | 'playing' | 'levelup' | 'dead' | 'won';

export type ClassId = 'knight' | 'mage' | 'hunter' | 'necro';
export type WeaponKind = 'melee' | 'fireball' | 'arrow' | 'orbit';

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
  // ── stage / run ──
  stageIndex: number;      // which stage is being played
  stageTime: number;       // seconds into the stage
  bossActive: boolean;     // the stage boss is on the field
  bossMaxHp: number;
}

export interface Biome {
  name: string;
  ground: string; seam: string; hi1: string; hi2: string;
}
export const BIOMES: Biome[] = [
  { name: 'Catacumbas', ground: '#2a2438', seam: '#221d30', hi1: '#312a44', hi2: '#3a3350' },
  { name: 'Cavernas Úmidas', ground: '#1f2e2a', seam: '#182420', hi1: '#26382f', hi2: '#2f463a' },
  { name: 'O Abismo', ground: '#301b22', seam: '#24141a', hi1: '#3c222a', hi2: '#4a2730' },
  { name: 'Trono do Fim', ground: '#241a2e', seam: '#180f20', hi1: '#2e2038', hi2: '#3a2846' },
];
