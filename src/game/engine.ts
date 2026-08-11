import {
  GameState, Player, PlayerStats, Enemy, EnemyKind, Bolt, Gem, Upgrade, WIN_TIME,
} from './types';
import { rollUpgrades } from './upgrades';
import { Input } from './input';
import { sound } from './sound';

const ENEMY_BASE: Record<EnemyKind, { hp: number; speed: number; radius: number; damage: number; xp: number }> = {
  slime:    { hp: 14, speed: 40, radius: 15, damage: 8,  xp: 1 },
  bat:      { hp: 8,  speed: 82, radius: 12, damage: 6,  xp: 1 },
  skeleton: { hp: 26, speed: 54, radius: 14, damage: 12, xp: 3 },
};

function baseStats(): PlayerStats {
  return {
    maxHp: 100,
    moveSpeed: 72,
    damage: 10,
    attackCd: 0.62,
    boltSpeed: 310,
    boltCount: 1,
    pierce: 0,
    knockback: 175,
    pickupRadius: 60,
    critChance: 0.05,
  };
}

function makePlayer(): Player {
  const stats = baseStats();
  return {
    x: 0, y: 0, radius: 13,
    hp: stats.maxHp,
    level: 1, xp: 0, xpToNext: 5,
    facingLeft: false, bob: 0,
    invuln: 0, hurtFlash: 0, attackTimer: 0,
    aimX: 0, aimY: 1, moving: false, animTime: 0, attackAnim: 0,
    stats,
  };
}

export function createState(): GameState {
  return {
    phase: 'title',
    player: makePlayer(),
    enemies: [], bolts: [], gems: [], particles: [], damageNumbers: [],
    time: 0, spawnTimer: 0, nextId: 1, kills: 0, shake: 0,
    offeredUpgrades: [],
  };
}

export function startGame(state: GameState): void {
  state.phase = 'playing';
  state.player = makePlayer();
  state.enemies = []; state.bolts = []; state.gems = [];
  state.particles = []; state.damageNumbers = [];
  state.time = 0; state.spawnTimer = 0.6; state.nextId = 1; state.kills = 0; state.shake = 0;
  state.offeredUpgrades = [];
}

export function chooseUpgrade(state: GameState, up: Upgrade): void {
  const before = state.player.stats.maxHp;
  up.apply(state.player.stats);
  if (up.id === 'hp') {
    const gained = state.player.stats.maxHp - before;
    state.player.hp = Math.min(state.player.stats.maxHp, state.player.hp + gained + 10);
  }
  // Another pending level?
  if (state.player.xp >= state.player.xpToNext) {
    levelUp(state);
  } else {
    state.phase = 'playing';
    state.offeredUpgrades = [];
  }
}

function levelUp(state: GameState): void {
  const p = state.player;
  p.xp -= p.xpToNext;
  p.level += 1;
  p.xpToNext = Math.ceil(p.xpToNext * 1.28) + 3;
  state.phase = 'levelup';
  state.offeredUpgrades = rollUpgrades(3);
  spawnBurst(state, p.x, p.y, '#f0c04a', 14);
  sound.levelUp();
}

// ─── Spawning ───────────────────────────────────────────────────────────────
function pickKind(time: number): EnemyKind {
  const r = Math.random();
  if (time < 20) return 'slime';
  if (time < 50) return r < 0.65 ? 'slime' : 'bat';
  if (r < 0.45) return 'slime';
  if (r < 0.75) return 'bat';
  return 'skeleton';
}

function spawnEnemy(state: GameState, spawnRadius: number): void {
  const kind = pickKind(state.time);
  const b = ENEMY_BASE[kind];
  const hpMul = 1 + state.time / 55;      // scales up over the run
  const dmgMul = 1 + state.time / 230;
  const a = Math.random() * Math.PI * 2;
  const dist = spawnRadius + Math.random() * 60;
  const e: Enemy = {
    id: state.nextId++,
    kind,
    x: state.player.x + Math.cos(a) * dist,
    y: state.player.y + Math.sin(a) * dist,
    hp: b.hp * hpMul, maxHp: b.hp * hpMul,
    speed: b.speed * (0.9 + Math.random() * 0.2),
    radius: b.radius,
    damage: b.damage * dmgMul,
    xp: b.xp,
    flash: 0, knockX: 0, knockY: 0, hitCd: 0,
    facingLeft: false, bob: Math.random() * 6, anim: Math.random() * 6,
  };
  state.enemies.push(e);
}

function spawnInterval(time: number): number {
  return Math.max(0.34, 1.5 - time * 0.014);
}

// ─── Effects ─────────────────────────────────────────────────────────────────
function spawnBurst(state: GameState, x: number, y: number, color: string, n: number): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 120;
    state.particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: 0.4 + Math.random() * 0.3, maxLife: 0.7,
      color, size: 2 + Math.random() * 2,
    });
  }
}

function damageNumber(state: GameState, x: number, y: number, value: number, crit: boolean): void {
  state.damageNumbers.push({ x: x + (Math.random() * 10 - 5), y, vy: -40, life: 0.7, value: Math.round(value), crit });
}

// ─── Main update ─────────────────────────────────────────────────────────────
export function update(state: GameState, dt: number, view: { w: number; h: number }, input: Input): void {
  if (state.phase !== 'playing') return;

  const p = state.player;
  state.time += dt;
  p.bob += dt * 6;
  if (p.invuln > 0) p.invuln -= dt;
  if (p.hurtFlash > 0) p.hurtFlash -= dt;
  if (p.attackAnim > 0) p.attackAnim -= dt;
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 60);

  if (state.time >= WIN_TIME) {
    state.phase = 'won';
    sound.win();
    return;
  }

  const spawnRadius = Math.hypot(view.w, view.h) / 2 + 50;

  // Spawn
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    const count = 1 + (state.time > 75 ? 1 : 0) + (state.time > 140 ? 1 : 0);
    for (let i = 0; i < count; i++) spawnEnemy(state, spawnRadius);
    state.spawnTimer = spawnInterval(state.time);
  }

  // ── Player movement (left stick / WASD) ──
  const mv = input.move;
  p.moving = mv.active && mv.mag > 0.15;
  if (p.moving) {
    p.x += mv.vx * p.stats.moveSpeed * mv.mag * dt;
    p.y += mv.vy * p.stats.moveSpeed * mv.mag * dt;
    p.animTime += dt;
  }

  // ── Aim (right stick) or auto-aim nearest enemy ──
  let aimX = 0, aimY = 0, aiming = false;
  if (input.aim.active && input.aim.mag > 0.2) {
    aimX = input.aim.vx; aimY = input.aim.vy; aiming = true;
  } else {
    let best = Infinity, bx = 0, by = 0;
    for (const e of state.enemies) {
      const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
      if (d < best) { best = d; bx = e.x - p.x; by = e.y - p.y; }
    }
    if (best < Infinity) {
      const d = Math.hypot(bx, by) || 1;
      aimX = bx / d; aimY = by / d;
    }
  }
  if (aimX !== 0 || aimY !== 0) {
    p.aimX = aimX; p.aimY = aimY;
    p.facingLeft = aimX < -0.15 ? true : (aimX > 0.15 ? false : p.facingLeft);
  } else if (p.moving) {
    p.facingLeft = mv.vx < -0.15 ? true : (mv.vx > 0.15 ? false : p.facingLeft);
  }

  // ── Auto-attack in aim direction ──
  p.attackTimer -= dt;
  const canFire = aiming || state.enemies.length > 0;
  if (p.attackTimer <= 0 && canFire && (p.aimX !== 0 || p.aimY !== 0)) {
    p.attackTimer = p.stats.attackCd;
    p.attackAnim = 0.16;
    fireBolts(state, p.aimX, p.aimY);
    sound.shoot();
  }

  // ── Bolts ──
  for (let i = state.bolts.length - 1; i >= 0; i--) {
    const b = state.bolts[i];
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    let remove = b.life <= 0;
    for (const e of state.enemies) {
      if (b.hitIds.includes(e.id)) continue;
      const rr = e.radius + 5;
      if ((b.x - e.x) ** 2 + (b.y - e.y) ** 2 < rr * rr) {
        b.hitIds.push(e.id);
        const crit = Math.random() < p.stats.critChance;
        const dmg = b.damage * (crit ? 2 : 1);
        e.hp -= dmg;
        e.flash = 0.12;
        const bl = Math.hypot(b.vx, b.vy) || 1;
        e.knockX += (b.vx / bl) * p.stats.knockback;
        e.knockY += (b.vy / bl) * p.stats.knockback;
        damageNumber(state, e.x, e.y - e.radius, dmg, crit);
        spawnBurst(state, b.x, b.y, '#ffe9a8', 4);
        sound.hit();
        if (b.pierce <= 0) { remove = true; break; }
        b.pierce -= 1;
      }
    }
    if (remove) state.bolts.splice(i, 1);
  }

  // ── Enemies ──
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    if (e.flash > 0) e.flash -= dt;
    if (e.hitCd > 0) e.hitCd -= dt;
    e.bob += dt * 5;
    e.anim += dt;

    // knockback
    e.x += e.knockX * dt; e.y += e.knockY * dt;
    e.knockX *= Math.pow(0.0001, dt); e.knockY *= Math.pow(0.0001, dt);

    // move toward player
    const dx = p.x - e.x, dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    e.x += (dx / d) * e.speed * dt;
    e.y += (dy / d) * e.speed * dt;
    e.facingLeft = dx < 0;

    // death
    if (e.hp <= 0) {
      state.kills++;
      dropGem(state, e);
      spawnBurst(state, e.x, e.y, enemyColor(e.kind), 8);
      state.shake = Math.min(6, state.shake + 2);
      sound.enemyDie();
      state.enemies.splice(i, 1);
      continue;
    }

    // contact damage
    const touch = e.radius + p.radius;
    if (d < touch && e.hitCd <= 0 && p.invuln <= 0) {
      p.hp -= e.damage;
      p.invuln = 0.6; p.hurtFlash = 0.3; e.hitCd = 0.8;
      state.shake = Math.min(9, state.shake + 5);
      spawnBurst(state, p.x, p.y, '#c23b2e', 8);
      sound.hurt();
      if (p.hp <= 0) { p.hp = 0; state.phase = 'dead'; sound.gameOver(); return; }
    }
  }

  // separation between enemies
  separate(state.enemies);

  // ── Gems: brief outward pop, then always magnetize to the hero ──
  for (let i = state.gems.length - 1; i >= 0; i--) {
    const g = state.gems[i];
    g.bob += dt * 5;
    // initial scatter fades quickly
    g.x += g.vx * dt; g.y += g.vy * dt;
    g.vx *= Math.pow(0.0005, dt); g.vy *= Math.pow(0.0005, dt);

    const dx = p.x - g.x, dy = p.y - g.y;
    const d = Math.hypot(dx, dy) || 1;
    const pull = d < p.stats.pickupRadius ? 320 : 90 + (p.stats.pickupRadius / d) * 90;
    g.x += (dx / d) * pull * dt;
    g.y += (dy / d) * pull * dt;
    if (d < 14) {
      p.xp += g.value;
      spawnBurst(state, p.x, p.y, '#38bdf8', 3);
      state.gems.splice(i, 1);
      if (p.xp >= p.xpToNext) levelUp(state);
    }
  }

  // ── Particles & numbers ──
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const pt = state.particles[i];
    pt.x += pt.vx * dt; pt.y += pt.vy * dt;
    pt.vx *= Math.pow(0.02, dt); pt.vy *= Math.pow(0.02, dt);
    pt.life -= dt;
    if (pt.life <= 0) state.particles.splice(i, 1);
  }
  for (let i = state.damageNumbers.length - 1; i >= 0; i--) {
    const dnm = state.damageNumbers[i];
    dnm.y += dnm.vy * dt; dnm.vy *= Math.pow(0.1, dt); dnm.life -= dt;
    if (dnm.life <= 0) state.damageNumbers.splice(i, 1);
  }
}

function fireBolts(state: GameState, aimX: number, aimY: number): void {
  const p = state.player;
  const baseAng = Math.atan2(aimY, aimX);
  const n = p.stats.boltCount;
  const spread = 0.18;
  for (let i = 0; i < n; i++) {
    // fan bolts symmetrically around the aim direction
    const offset = n === 1 ? 0 : (i - (n - 1) / 2) * spread;
    const ang = baseAng + offset;
    const b: Bolt = {
      x: p.x + Math.cos(baseAng) * 8, y: p.y + Math.sin(baseAng) * 8,
      vx: Math.cos(ang) * p.stats.boltSpeed,
      vy: Math.sin(ang) * p.stats.boltSpeed,
      damage: p.stats.damage,
      pierce: p.stats.pierce,
      life: 1.6, hitIds: [], rot: ang,
    };
    state.bolts.push(b);
  }
}

function dropGem(state: GameState, e: Enemy): void {
  const a = Math.random() * Math.PI * 2;
  state.gems.push({
    x: e.x, y: e.y, value: e.xp,
    vx: Math.cos(a) * 30, vy: Math.sin(a) * 30,
    homing: false, bob: Math.random() * 6,
  });
}

function separate(enemies: Enemy[]): void {
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      const a = enemies[i], b = enemies[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const min = a.radius + b.radius;
      if (d < min) {
        const push = (min - d) / 2;
        const nx = dx / d, ny = dy / d;
        a.x -= nx * push; a.y -= ny * push;
        b.x += nx * push; b.y += ny * push;
      }
    }
  }
}

function enemyColor(k: EnemyKind): string {
  return k === 'slime' ? '#5fbf46' : k === 'bat' ? '#8a5ad0' : '#e8e4d4';
}
