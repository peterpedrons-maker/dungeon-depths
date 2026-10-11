import {
  GameState, Enemy, EnemyKind, RuneDef, RuneId, Projectile,
} from './types';
import { Input } from './input';
import { depthToScreen, View } from './projection';
import { RUNES, runeDef, runeDamage, runeCooldown, upgradeCost } from './runes';
import { ENEMY_DEFS } from './enemies';
import { WAVES } from './wave';

const TOWER_MAX_HP = 100;
const MAX_ALIVE_ENEMIES = 16; // soft cap so a rough patch never snowballs into an unreadable swarm
// How forgiving the lane hit-test is per enemy kind — bigger silhouettes are
// easier to land a shot on, on top of each rune's own hitWidth.
const ENEMY_LANE_RADIUS: Record<EnemyKind, number> = { husk: 0.05, wisp: 0.04, brute: 0.08 };

export function createState(): GameState {
  return {
    phase: 'title',
    enemies: [], projectiles: [], particles: [], damageNumbers: [],
    runes: RUNES.map((r, i) => ({ id: r.id, unlocked: i === 0, stars: i === 0 ? 1 : 0, cooldownTimer: 0 })),
    gold: 0,
    towerHp: TOWER_MAX_HP, towerMaxHp: TOWER_MAX_HP,
    waveIndex: 0, waveTime: 0, spawnTimer: 1.0,
    bossActive: false, bossMaxHp: 0,
    kills: 0, nextId: 1, shake: 0,
    aimX: 0, aimY: 0,
  };
}

export function startGame(state: GameState): void {
  state.phase = 'playing';
  state.enemies = []; state.projectiles = []; state.particles = []; state.damageNumbers = [];
  state.towerHp = state.towerMaxHp;
  state.waveIndex = 0; state.waveTime = 0; state.spawnTimer = 1.0;
  state.bossActive = false; state.bossMaxHp = 0;
  state.kills = 0; state.shake = 0;
}

export function purchaseRune(state: GameState, runeId: RuneId): void {
  const def = runeDef(runeId);
  const slot = state.runes.find((r) => r.id === runeId);
  if (!slot) return;
  if (!slot.unlocked) {
    if (state.gold < def.unlockCost) return;
    state.gold -= def.unlockCost;
    slot.unlocked = true;
    slot.stars = 1;
    return;
  }
  if (slot.stars >= def.maxStars) return;
  const cost = upgradeCost(def, slot.stars);
  if (state.gold < cost) return;
  state.gold -= cost;
  slot.stars += 1;
}

// ─── Spawning ───────────────────────────────────────────────────────────────
function spawnInterval(t: number): number {
  return Math.max(0.5, 1.8 - t * 0.012);
}

function spawnEnemy(state: GameState): void {
  const wave = WAVES[state.waveIndex];
  const kind = wave.pool[Math.floor(Math.random() * wave.pool.length)];
  const def = ENEMY_DEFS[kind];
  const stageMul = 1 + state.waveTime / 90;
  const hp = def.hp * stageMul;
  state.enemies.push({
    id: state.nextId++, kind, depth: 0, lane: (Math.random() * 2 - 1) * 0.9,
    speed: def.speed * (0.9 + Math.random() * 0.2),
    hp, maxHp: hp, damage: def.damage,
    slowTimer: 0, slowMult: 1, flash: 0, wobble: Math.random() * Math.PI * 2,
  });
}

function spawnBoss(state: GameState): void {
  const wave = WAVES[state.waveIndex];
  state.bossActive = true;
  const hp = wave.bossHp;
  state.enemies.push({
    id: state.nextId++, kind: 'brute', depth: 0, lane: 0, speed: 0.032,
    hp, maxHp: hp, damage: wave.bossDamage,
    slowTimer: 0, slowMult: 1, flash: 0, wobble: 0,
    isBoss: true, name: wave.bossName, bstate: 'advance', btimer: 0, batkCd: 0, phase2: false,
  });
  state.bossMaxHp = hp;
  state.shake = 10;
}

// ─── Effects ────────────────────────────────────────────────────────────────
function spawnBurst(state: GameState, x: number, y: number, color: string, n: number): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 60 + Math.random() * 140;
    state.particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: 0.35 + Math.random() * 0.25, maxLife: 0.6, color, size: 2 + Math.random() * 2,
    });
  }
}

function damageNumber(state: GameState, x: number, y: number, value: number, crit: boolean): void {
  state.damageNumbers.push({ x: x + (Math.random() * 8 - 4), y, vy: -42, life: 0.7, value: Math.round(value), crit });
}

function updateEffects(state: GameState, dt: number): void {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const pt = state.particles[i];
    pt.x += pt.vx * dt; pt.y += pt.vy * dt;
    pt.vx *= Math.pow(0.02, dt); pt.vy *= Math.pow(0.02, dt);
    pt.life -= dt;
    if (pt.life <= 0) state.particles.splice(i, 1);
  }
  for (let i = state.damageNumbers.length - 1; i >= 0; i--) {
    const d = state.damageNumbers[i];
    d.y += d.vy * dt; d.vy *= Math.pow(0.1, dt); d.life -= dt;
    if (d.life <= 0) state.damageNumbers.splice(i, 1);
  }
}

function clampLane(v: number): number {
  return Math.max(-1, Math.min(1, v));
}

// ─── Weapons — manual aim, each rune its own projectile behavior ──────────
// Fired straight at the player's chosen lane — see the note on Projectile in
// types.ts for why it travels through depth/lane space instead of a 2D line.
function fireRune(state: GameState, def: RuneDef, stars: number, lane: number): void {
  const dmg = runeDamage(def, stars);
  const base = { depth: 1, speed: def.projectileSpeed, style: def.id, radius: 7, hitWidth: 0.07 };
  if (def.id === 'frost') {
    for (const off of [-0.09, 0, 0.09]) {
      state.projectiles.push({
        ...base, lane: clampLane(lane + off),
        damage: dmg * 0.75, slowOnHit: { mult: 0.55, duration: 1.4 },
      });
    }
    return;
  }
  const extra: Partial<Projectile> =
    def.id === 'chain' ? { chainOnHit: { pct: 0.6, radius: 90 } }
    : def.id === 'firecore' ? { splashRadius: 50, splashPct: 0.45, radius: 10, hitWidth: 0.09 }
    : {};
  state.projectiles.push({ ...base, lane, damage: dmg, ...extra });
}

function hitEnemy(state: GameState, e: Enemy, p: Projectile, view: View): void {
  const crit = Math.random() < 0.08;
  const dmg = p.damage * (crit ? 1.8 : 1);
  e.hp -= dmg;
  e.flash = 0.12;
  const pos = depthToScreen(e.depth, e.lane, view);
  damageNumber(state, pos.x, pos.y - 10 * pos.scale, dmg, crit);
  spawnBurst(state, pos.x, pos.y, runeDef(p.style).color, 6);

  if (p.slowOnHit) {
    e.slowMult = p.slowOnHit.mult;
    e.slowTimer = Math.max(e.slowTimer, p.slowOnHit.duration);
  }

  if (p.chainOnHit) {
    let best: Enemy | null = null;
    let bestD = p.chainOnHit.radius;
    for (const other of state.enemies) {
      if (other === e || other.hp <= 0) continue;
      const op = depthToScreen(other.depth, other.lane, view);
      const d = Math.hypot(op.x - pos.x, op.y - pos.y);
      if (d < bestD) { bestD = d; best = other; }
    }
    if (best) {
      const chainDmg = p.damage * p.chainOnHit.pct;
      best.hp -= chainDmg;
      best.flash = 0.12;
      const bp = depthToScreen(best.depth, best.lane, view);
      damageNumber(state, bp.x, bp.y - 10 * bp.scale, chainDmg, false);
      spawnBurst(state, bp.x, bp.y, '#c084fc', 4);
    }
  }

  if (p.splashRadius) {
    for (const other of state.enemies) {
      if (other === e || other.hp <= 0) continue;
      const op = depthToScreen(other.depth, other.lane, view);
      const d = Math.hypot(op.x - pos.x, op.y - pos.y);
      if (d < p.splashRadius) {
        const sdmg = p.damage * (p.splashPct ?? 0.4);
        other.hp -= sdmg;
        other.flash = 0.12;
        damageNumber(state, op.x, op.y - 10 * op.scale, sdmg, false);
      }
    }
  }
}

// ─── Boss AI — simple telegraph/attack/recover loop once it reaches the tower ──
function bossAI(e: Enemy, state: GameState, dt: number): void {
  if (!e.phase2 && e.hp <= e.maxHp * 0.5) {
    e.phase2 = true;
    e.damage *= 1.4;
    state.shake = 10;
  }
  e.btimer = (e.btimer ?? 0) - dt;
  switch (e.bstate) {
    case 'advance':
      e.bstate = 'telegraph';
      e.btimer = 0.6;
      break;
    case 'telegraph':
      e.flash = 0.08;
      if ((e.btimer ?? 0) <= 0) {
        state.towerHp -= e.damage;
        state.shake = Math.min(14, state.shake + 8);
        e.bstate = 'recover';
        e.btimer = e.phase2 ? 0.9 : 1.3;
      }
      break;
    case 'recover':
      if ((e.btimer ?? 0) <= 0) {
        e.bstate = 'telegraph';
        e.btimer = e.phase2 ? 0.5 : 0.75;
      }
      break;
  }
}

// ─── Main update ─────────────────────────────────────────────────────────────
export function update(state: GameState, dt: number, view: View, input: Input): void {
  if (state.phase !== 'playing') return;
  const wave = WAVES[state.waveIndex];
  state.waveTime += dt;
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 60);
  const aimTarget = depthToScreen(0, input.aimLane, view); // horizon point at the chosen lane
  state.aimX = aimTarget.x; state.aimY = aimTarget.y;

  // ── Spawning: escalating waves, then the boss ──
  if (!state.bossActive) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      if (state.enemies.length < MAX_ALIVE_ENEMIES) spawnEnemy(state);
      state.spawnTimer = spawnInterval(state.waveTime);
    }
    if (state.waveTime >= wave.duration) spawnBoss(state);
  }

  // ── Rune firing — horizontal-only aim: the player just picks a lane
  // (ignoring where their thumb sits vertically) and shots travel the full
  // length of the field along it, same as the enemies walking it. ──
  for (const slot of state.runes) {
    if (!slot.unlocked || slot.stars <= 0) continue;
    if (slot.cooldownTimer > 0) slot.cooldownTimer -= dt;
    if (slot.cooldownTimer > 0) continue;
    if (!input.firing) continue;
    const def = runeDef(slot.id);
    fireRune(state, def, slot.stars, input.aimLane);
    slot.cooldownTimer = runeCooldown(def, slot.stars);
  }

  // ── Projectiles — move through the same depth/lane space as enemies, so
  // a hit is "same lane, crossed depths" rather than a 2D screen-space
  // circle. A projectile travels fast enough (and dt can be large enough
  // under load) that comparing depths at a single instant lets it tunnel
  // straight past an enemy between two frames — instead this checks whether
  // the projectile's depth crossed the enemy's depth DURING the step. ──
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const p = state.projectiles[i];
    const prevDepth = p.depth;
    p.depth -= p.speed * dt;
    let remove = p.depth <= 0;
    if (!remove) {
      for (const e of state.enemies) {
        if (e.hp <= 0) continue;
        const laneTol = p.hitWidth + (e.isBoss ? 0.12 : ENEMY_LANE_RADIUS[e.kind]);
        if (Math.abs(e.lane - p.lane) >= laneTol) continue;
        if (prevDepth >= e.depth && p.depth <= e.depth) {
          hitEnemy(state, e, p, view);
          remove = true;
          break;
        }
      }
    }
    if (remove) state.projectiles.splice(i, 1);
  }

  // ── Enemies ──
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    if (e.flash > 0) e.flash -= dt;
    if (e.slowTimer > 0) {
      e.slowTimer -= dt;
      if (e.slowTimer <= 0) e.slowMult = 1;
    }
    e.wobble += dt * 3;

    if (e.hp <= 0) {
      if (e.isBoss) {
        state.gold += 150;
        const pos = depthToScreen(e.depth, e.lane, view);
        spawnBurst(state, pos.x, pos.y, '#ffd257', 40);
        state.shake = 16;
        state.enemies.splice(i, 1);
        state.bossActive = false;
        state.phase = 'won';
        return;
      }
      state.kills++;
      state.gold += ENEMY_DEFS[e.kind].gold;
      const pos = depthToScreen(e.depth, e.lane, view);
      spawnBurst(state, pos.x, pos.y, ENEMY_DEFS[e.kind].color, 8);
      state.enemies.splice(i, 1);
      continue;
    }

    if (e.isBoss) {
      if (e.depth < 1) e.depth = Math.min(1, e.depth + e.speed * e.slowMult * dt);
      else bossAI(e, state, dt);
      continue;
    }

    e.depth += e.speed * e.slowMult * dt;
    if (e.depth >= 1) {
      state.towerHp -= e.damage;
      state.shake = Math.min(10, state.shake + 4);
      state.enemies.splice(i, 1);
      if (state.towerHp <= 0) {
        state.towerHp = 0;
        state.phase = 'dead';
        return;
      }
    }
  }

  updateEffects(state, dt);
}
