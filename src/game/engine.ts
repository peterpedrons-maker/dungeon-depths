import {
  GameState, Player, PlayerStats, Enemy, EnemyKind, Bolt, BossAttack, Upgrade, ClassId,
  DASH_COOLDOWN, ORBIT_RADIUS, WORLD,
} from './types';
import { rollUpgrades } from './upgrades';
import { Input } from './input';
import { sound } from './sound';
import { getClass, worldStats } from './classes';
import { ENEMY_DEFS } from './enemyData';
import { STAGES, unlockNext } from './stages';

function makePlayer(classId: ClassId = 'knight'): Player {
  const def = getClass(classId);
  const stats: PlayerStats = worldStats(classId);
  return {
    x: 0, y: 0, radius: 13,
    hp: stats.maxHp,
    level: 1, xp: 0, xpToNext: 4,
    facingLeft: false, bob: 0,
    invuln: 0, hurtFlash: 0, attackTimer: 0,
    aimX: 0, aimY: 1, moving: false, animTime: 0, attackAnim: 0,
    dashTimer: 0, dashCd: 0, dashX: 1, dashY: 0,
    classId, weapon: def.weapon, orbAngle: 0,
    stats,
  };
}

export function createState(): GameState {
  return {
    phase: 'title',
    player: makePlayer(),
    enemies: [], bolts: [], gems: [], hazards: [], particles: [], damageNumbers: [],
    time: 0, spawnTimer: 0, nextId: 1, kills: 0, shake: 0,
    offeredUpgrades: [],
    stageIndex: 0, stageTime: 0, bossActive: false, bossMaxHp: 0,
  };
}

export function startGame(state: GameState, classId: ClassId, stageIndex: number): void {
  state.phase = 'playing';
  state.player = makePlayer(classId);
  state.enemies = []; state.bolts = []; state.gems = []; state.hazards = [];
  state.particles = []; state.damageNumbers = [];
  state.time = 0; state.spawnTimer = 1.2; state.nextId = 1; state.kills = 0; state.shake = 0;
  state.offeredUpgrades = [];
  state.stageIndex = stageIndex; state.stageTime = 0; state.bossActive = false; state.bossMaxHp = 0;
}

export function chooseUpgrade(state: GameState, up: Upgrade): void {
  const before = state.player.stats.maxHp;
  up.apply(state.player.stats);
  if (up.id === 'hp') {
    const gained = state.player.stats.maxHp - before;
    state.player.hp = Math.min(state.player.stats.maxHp, state.player.hp + gained + 10);
  }
  if (state.player.xp >= state.player.xpToNext) levelUp(state);
  else { state.phase = 'playing'; state.offeredUpgrades = []; }
}

function levelUp(state: GameState): void {
  const p = state.player;
  p.xp -= p.xpToNext;
  p.level += 1;
  p.xpToNext = 3 + p.level * 2;
  state.phase = 'levelup';
  state.offeredUpgrades = rollUpgrades(3);
  spawnBurst(state, p.x, p.y, '#f0c04a', 14);
  sound.levelUp();
}

// ─── Spawning ───────────────────────────────────────────────────────────────
function offscreenPoint(state: GameState, view: { w: number; h: number }): { x: number; y: number } {
  const p = state.player;
  const halfW = view.w / 2, halfH = view.h / 2;
  const margin = 30 * WORLD + Math.random() * 40 * WORLD;
  const perimeter = 2 * (view.w + view.h);
  let t = Math.random() * perimeter;
  if (t < view.w) return { x: p.x - halfW + t, y: p.y - halfH - margin };
  t -= view.w;
  if (t < view.w) return { x: p.x - halfW + t, y: p.y + halfH + margin };
  t -= view.w;
  if (t < view.h) return { x: p.x - halfW - margin, y: p.y - halfH + t };
  t -= view.h;
  return { x: p.x + halfW + margin, y: p.y - halfH + t };
}

function createEnemy(state: GameState, kind: EnemyKind, x: number, y: number): Enemy {
  const b = ENEMY_DEFS[kind];
  const stageMul = 1 + state.stageIndex * 0.3;
  const hpMul = (1 + state.stageTime / 60) * stageMul;
  const dmgMul = (1 + state.stageTime / 240) * (1 + state.stageIndex * 0.12);
  const hp = b.hp * hpMul;
  return {
    id: state.nextId++, kind, x, y,
    hp, maxHp: hp,
    speed: b.speed * WORLD * (0.9 + Math.random() * 0.2),
    radius: b.radius,
    damage: b.damage * dmgMul,
    xp: b.xp,
    flash: 0, knockX: 0, knockY: 0, hitCd: 0, orbCd: 0, atkCd: (b.rangedCd ?? 2) * (0.5 + Math.random()),
    facingLeft: false, bob: Math.random() * 6, anim: Math.random() * 6, age: 0, wobble: Math.random() * Math.PI * 2,
  };
}

function spawnWave(state: GameState, view: { w: number; h: number }): void {
  const stage = STAGES[state.stageIndex];
  const kind = stage.pool[Math.floor(Math.random() * stage.pool.length)];
  const at = offscreenPoint(state, view);
  state.enemies.push(createEnemy(state, kind, at.x, at.y));
}

function spawnInterval(time: number): number {
  return Math.max(0.3, 1.6 - time * 0.011);
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
  const stage = STAGES[state.stageIndex];
  state.time += dt;
  state.stageTime += dt;
  p.bob += dt * 6;
  if (p.invuln > 0) p.invuln -= dt;
  if (p.hurtFlash > 0) p.hurtFlash -= dt;
  if (p.attackAnim > 0) p.attackAnim -= dt;
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 60);

  // ── Stage flow: escalating waves, then the boss ──
  if (!state.bossActive) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      const t = state.stageTime;
      const count = 1 + (t > 25 ? 1 : 0) + (t > 55 ? 1 : 0) + (t > 85 ? 1 : 0) + state.stageIndex;
      for (let i = 0; i < count; i++) spawnWave(state, view);
      state.spawnTimer = spawnInterval(t);
    }
    if (state.stageTime >= stage.duration) spawnBoss(state, view);
  }

  // ── Dash (dodge with i-frames) ──
  const mv = input.move;
  if (p.dashCd > 0) p.dashCd -= dt;
  if (p.dashTimer > 0) p.dashTimer -= dt;
  if (input.consumeDash() && p.dashCd <= 0 && p.dashTimer <= 0) {
    let dxn = 0, dyn = 0;
    if (mv.active && mv.mag > 0.15) { dxn = mv.vx; dyn = mv.vy; }
    else { dxn = p.aimX; dyn = p.aimY; }
    const m = Math.hypot(dxn, dyn) || 1;
    p.dashX = dxn / m; p.dashY = dyn / m;
    p.dashTimer = 0.16; p.dashCd = DASH_COOLDOWN;
    p.invuln = Math.max(p.invuln, 0.3);
    sound.dash();
  }

  // ── Player movement ──
  p.moving = mv.active && mv.mag > 0.15;
  if (p.dashTimer > 0) {
    const DASH_SPEED = 540 * WORLD;
    p.x += p.dashX * DASH_SPEED * dt;
    p.y += p.dashY * DASH_SPEED * dt;
    p.animTime += dt;
    p.invuln = Math.max(p.invuln, p.dashTimer);
    if (Math.abs(p.dashX) > 0.15) p.facingLeft = p.dashX < 0;
    state.particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.2, maxLife: 0.2, color: '#8fc0f0', size: 3.5 });
  } else if (p.moving) {
    p.x += mv.vx * p.stats.moveSpeed * mv.mag * dt;
    p.y += mv.vy * p.stats.moveSpeed * mv.mag * dt;
    p.animTime += dt;
  }

  // ── Aim ──
  let aimX = 0, aimY = 0, aiming = false;
  if (input.aim.active && input.aim.mag > 0.2) {
    aimX = input.aim.vx; aimY = input.aim.vy; aiming = true;
  } else {
    let best = Infinity, bx = 0, by = 0;
    for (const e of state.enemies) {
      const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
      if (d < best) { best = d; bx = e.x - p.x; by = e.y - p.y; }
    }
    if (best < Infinity) { const d = Math.hypot(bx, by) || 1; aimX = bx / d; aimY = by / d; }
  }
  if (aimX !== 0 || aimY !== 0) {
    p.aimX = aimX; p.aimY = aimY;
    p.facingLeft = aimX < -0.15 ? true : (aimX > 0.15 ? false : p.facingLeft);
  } else if (p.moving) {
    p.facingLeft = mv.vx < -0.15 ? true : (mv.vx > 0.15 ? false : p.facingLeft);
  }

  // ── Auto-attack ──
  p.attackTimer -= dt;
  const canFire = aiming || state.enemies.length > 0;
  if (p.attackTimer <= 0 && canFire && (p.aimX !== 0 || p.aimY !== 0)) {
    p.attackTimer = p.stats.attackCd;
    p.attackAnim = 0.16;
    fireWeapon(state, p.aimX, p.aimY);
  }

  // ── Orbiting weapon (Necromancer) ──
  if (p.weapon === 'orbit') {
    p.orbAngle += dt * 3.2;
    const orbs = p.stats.boltCount;
    for (let i = 0; i < orbs; i++) {
      const a = p.orbAngle + (i / orbs) * Math.PI * 2;
      const ox = p.x + Math.cos(a) * ORBIT_RADIUS;
      const oy = p.y + Math.sin(a) * ORBIT_RADIUS;
      for (const e of state.enemies) {
        if (e.orbCd > 0) continue;
        const rr = e.radius + 15 * WORLD;
        const dx = e.x - ox, dy = e.y - oy;
        if (dx * dx + dy * dy < rr * rr) {
          const d = Math.hypot(dx, dy) || 1;
          applyHit(state, e, p.stats.damage, dx / d, dy / d);
          e.orbCd = 0.45;
        }
      }
    }
  }

  // ── Bolts (all attacks are projectiles) ──
  for (let i = state.bolts.length - 1; i >= 0; i--) {
    const b = state.bolts[i];
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    let remove = b.life <= 0;
    for (const e of state.enemies) {
      if (b.hitIds.includes(e.id)) continue;
      const rr = e.radius + b.hitR;
      if ((b.x - e.x) ** 2 + (b.y - e.y) ** 2 < rr * rr) {
        b.hitIds.push(e.id);
        const bl = Math.hypot(b.vx, b.vy) || 1;
        applyHit(state, e, b.damage, b.vx / bl, b.vy / bl);
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
    if (e.orbCd > 0) e.orbCd -= dt;
    e.bob += dt * 5; e.anim += dt; e.age += dt; e.wobble += dt * 4;

    const dx = p.x - e.x, dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;

    if (e.isBoss) {
      bossAI(e, state, dt, view);
    } else {
      moveEnemy(e, state, dt, dx, dy, d);
      e.facingLeft = dx < 0;
    }

    // death
    if (e.hp <= 0) {
      if (e.isBoss) {
        spawnBurst(state, e.x, e.y, '#ffd257', 40);
        spawnBurst(state, e.x, e.y, '#c23b2e', 30);
        state.shake = 14;
        sound.enemyDie(); sound.win();
        for (let k = 0; k < 10; k++) dropGem(state, e);
        state.enemies.splice(i, 1);
        state.bossActive = false;
        unlockNext(state.stageIndex);
        state.phase = 'won';
        return;
      }
      state.kills++;
      dropGem(state, e);
      spawnBurst(state, e.x, e.y, ENEMY_DEFS[e.kind].color, 8);
      state.shake = Math.min(6, state.shake + 2);
      sound.enemyDie();
      const def = ENEMY_DEFS[e.kind];
      if (def.splitsInto) {
        for (let s = 0; s < (def.splitCount ?? 2); s++) {
          const a = Math.random() * Math.PI * 2;
          const child = createEnemy(state, def.splitsInto, e.x + Math.cos(a) * 12, e.y + Math.sin(a) * 12);
          child.hp = child.maxHp = Math.max(6, child.maxHp * 0.6);
          state.enemies.push(child);
        }
      }
      state.enemies.splice(i, 1);
      continue;
    }

    // contact damage
    const touch = e.radius + p.radius;
    if (d < touch && e.hitCd <= 0 && p.invuln <= 0) {
      p.hp -= e.damage;
      p.invuln = 0.6; p.hurtFlash = 0.3; e.hitCd = e.isBoss ? 0.5 : 0.8;
      state.shake = Math.min(10, state.shake + (e.isBoss ? 8 : 5));
      spawnBurst(state, p.x, p.y, '#c23b2e', 8);
      sound.hurt();
      if (p.hp <= 0) { p.hp = 0; state.phase = 'dead'; sound.gameOver(); return; }
    }
  }

  // ── Hazards (boss/caster projectiles + shockwaves) ──
  for (let i = state.hazards.length - 1; i >= 0; i--) {
    const h = state.hazards[i];
    if (h.telegraph && h.telegraph > 0) { h.telegraph -= dt; continue; } // warning phase, harmless
    h.x += h.vx * dt; h.y += h.vy * dt; h.life -= dt;
    const rr = h.radius + p.radius;
    if (p.invuln <= 0 && (h.x - p.x) ** 2 + (h.y - p.y) ** 2 < rr * rr) {
      p.hp -= h.damage;
      p.invuln = 0.6; p.hurtFlash = 0.3;
      state.shake = Math.min(10, state.shake + 5);
      spawnBurst(state, p.x, p.y, '#c23b2e', 6);
      sound.hurt();
      state.hazards.splice(i, 1);
      if (p.hp <= 0) { p.hp = 0; state.phase = 'dead'; sound.gameOver(); return; }
      continue;
    }
    if (h.life <= 0) state.hazards.splice(i, 1);
  }

  separate(state.enemies);

  // ── Gems ──
  for (let i = state.gems.length - 1; i >= 0; i--) {
    const g = state.gems[i];
    g.bob += dt * 5;
    const dx = p.x - g.x, dy = p.y - g.y;
    const d = Math.hypot(dx, dy) || 1;
    if (!g.homing) {
      g.x += g.vx * dt; g.y += g.vy * dt;
      g.vx *= Math.pow(0.0005, dt); g.vy *= Math.pow(0.0005, dt);
      if (d < p.stats.pickupRadius) g.homing = true;
    }
    if (g.homing) {
      g.x += (dx / d) * 300 * WORLD * dt;
      g.y += (dy / d) * 300 * WORLD * dt;
      if (d < 14) {
        p.xp += g.value;
        spawnBurst(state, p.x, p.y, '#38bdf8', 3);
        state.gems.splice(i, 1);
        if (p.xp >= p.xpToNext) levelUp(state);
      }
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

// ─── Enemy movement per behavior ───────────────────────────────────────────────
function moveEnemy(e: Enemy, state: GameState, dt: number, dx: number, dy: number, d: number): void {
  // knockback first
  e.x += e.knockX * dt; e.y += e.knockY * dt;
  e.knockX *= Math.pow(0.0001, dt); e.knockY *= Math.pow(0.0001, dt);

  const def = ENEMY_DEFS[e.kind];
  const nx = dx / d, ny = dy / d;

  if (def.movement === 'ranged') {
    const want = (def.rangedRange ?? 180) * WORLD;
    if (d > want + 20 * WORLD) { e.x += nx * e.speed * dt; e.y += ny * e.speed * dt; }
    else if (d < want - 20 * WORLD) { e.x -= nx * e.speed * 0.8 * dt; e.y -= ny * e.speed * 0.8 * dt; }
    else { // strafe
      e.x += -ny * e.speed * 0.5 * dt; e.y += nx * e.speed * 0.5 * dt;
    }
    e.atkCd -= dt;
    if (e.atkCd <= 0 && d < (def.rangedRange ?? 180) * WORLD + 60 * WORLD) {
      e.atkCd = def.rangedCd ?? 2.2;
      const sp = 150 * WORLD;
      state.hazards.push({ x: e.x, y: e.y, vx: nx * sp, vy: ny * sp, life: 3, radius: 6, damage: e.damage, color: '#c084fc' });
    }
    return;
  }

  let mx = nx, my = ny;
  if (def.movement === 'weave') {          // bats sway side to side
    const px = -ny, py = nx;
    const s = Math.sin(e.wobble * 1.6) * 0.7;
    mx += px * s; my += py * s;
  } else if (def.movement === 'erratic') { // spiders jitter
    const j = 0.5;
    mx += (Math.random() - 0.5) * j; my += (Math.random() - 0.5) * j;
  }
  const ml = Math.hypot(mx, my) || 1;
  e.x += (mx / ml) * e.speed * dt;
  e.y += (my / ml) * e.speed * dt;
}

// ─── Weapons — everything is a projectile ──────────────────────────────────────
function fireWeapon(state: GameState, aimX: number, aimY: number): void {
  const p = state.player;
  const baseAng = Math.atan2(aimY, aimX);
  const s = p.stats;

  if (p.weapon === 'orbit') return; // orbs damage continuously

  const n = Math.max(1, s.boltCount);
  const spread = p.weapon === 'melee' ? 0.5 : 0.18;

  for (let i = 0; i < n; i++) {
    const offset = n === 1 ? 0 : (i - (n - 1) / 2) * spread;
    const ang = baseAng + offset;

    if (p.weapon === 'melee') {
      // Crescent slash: short reach, fat hitbox, pierces the whole arc.
      const speed = 150 * WORLD;
      state.bolts.push({
        x: p.x + Math.cos(baseAng) * 6, y: p.y + Math.sin(baseAng) * 6,
        vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
        damage: s.damage, pierce: 999, life: 0.22, maxLife: 0.22,
        hitIds: [], rot: ang, style: 'slash', hitR: s.range * 0.55,
      });
    } else {
      const style = p.weapon === 'fireball' ? 'fire' : p.weapon === 'arrow' ? 'arrow' : 'bolt';
      state.bolts.push({
        x: p.x + Math.cos(baseAng) * 8, y: p.y + Math.sin(baseAng) * 8,
        vx: Math.cos(ang) * s.boltSpeed, vy: Math.sin(ang) * s.boltSpeed,
        damage: s.damage, pierce: s.pierce, life: 1.6, maxLife: 1.6,
        hitIds: [], rot: ang, style, hitR: 6 * WORLD,
      });
    }
  }
  if (p.weapon === 'melee') sound.swing();
  else sound.shoot();
}

function applyHit(state: GameState, e: Enemy, rawDamage: number, nx: number, ny: number): void {
  const p = state.player;
  const crit = Math.random() < p.stats.critChance;
  const dmg = rawDamage * (crit ? 2 : 1);
  e.hp -= dmg;
  e.flash = 0.12;
  const kb = e.isBoss ? p.stats.knockback * 0.12 : p.stats.knockback;
  e.knockX += nx * kb; e.knockY += ny * kb;
  damageNumber(state, e.x, e.y - e.radius, dmg, crit);
  spawnBurst(state, e.x, e.y, '#ffe9a8', 4);
  sound.hit();
}

function dropGem(state: GameState, e: Enemy): void {
  const a = Math.random() * Math.PI * 2;
  state.gems.push({
    x: e.x, y: e.y, value: e.xp,
    vx: Math.cos(a) * 30 * WORLD, vy: Math.sin(a) * 30 * WORLD,
    homing: false, bob: Math.random() * 6,
  });
}

function separate(enemies: Enemy[]): void {
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      const a = enemies[i], b = enemies[j];
      if (a.isBoss || b.isBoss) continue;
      if (a.kind === 'ghost' || b.kind === 'ghost') continue; // ghosts phase through
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

// ─── Boss (RPG-style, multi-mechanic) ──────────────────────────────────────────
function spawnBoss(state: GameState, view: { w: number; h: number }): void {
  state.bossActive = true;
  const stage = STAGES[state.stageIndex];
  const at = offscreenPoint(state, view);
  const boss: Enemy = {
    id: state.nextId++, kind: 'skeleton', x: at.x, y: at.y,
    hp: stage.bossHp, maxHp: stage.bossHp,
    speed: 44 * WORLD, radius: 32,
    damage: stage.bossDamage, xp: 20,
    flash: 0, knockX: 0, knockY: 0, hitCd: 0, orbCd: 0, atkCd: 0,
    facingLeft: false, bob: 0, anim: 0, age: 0, wobble: 0,
    isBoss: true, name: stage.bossName,
    bstate: 'chase', btimer: 0, batkCd: 2.2, cvx: 0, cvy: 0, phase2: false,
  };
  state.enemies.push(boss);
  state.bossMaxHp = stage.bossHp;
  state.shake = 12;
  sound.gameOver(); // ominous cue
}

function bossAI(e: Enemy, state: GameState, dt: number, view: { w: number; h: number }): void {
  const p = state.player;
  const dx = p.x - e.x, dy = p.y - e.y;
  const d = Math.hypot(dx, dy) || 1;
  const nx = dx / d, ny = dy / d;
  e.facingLeft = dx < 0;
  e.btimer = (e.btimer ?? 0) - dt;
  e.batkCd = (e.batkCd ?? 0) - dt;

  // Enrage at half health
  if (!e.phase2 && e.hp <= e.maxHp * 0.5) {
    e.phase2 = true;
    e.speed *= 1.35;
    state.shake = 12;
    spawnBurst(state, e.x, e.y, '#ff5a4a', 30);
    radialHazards(state, e.x, e.y, 20, 150 * WORLD, e.damage * 0.5, '#ff7a5a');
  }

  switch (e.bstate) {
    case 'chase':
      e.x += nx * e.speed * dt; e.y += ny * e.speed * dt;
      if ((e.batkCd ?? 0) <= 0) {
        e.bnext = pickBossAttack(e);
        e.bstate = 'telegraph';
        e.btimer = e.bnext === 'charge' ? 0.6 : 0.75;
      }
      break;
    case 'telegraph':
      e.flash = 0.1; // glows white before it strikes
      if ((e.btimer ?? 0) <= 0) executeBossAttack(e, state, view, nx, ny);
      break;
    case 'charge':
      e.x += (e.cvx ?? 0) * dt; e.y += (e.cvy ?? 0) * dt;
      if ((e.btimer ?? 0) <= 0) { e.bstate = 'chase'; e.batkCd = e.phase2 ? 1.4 : 2.0; }
      break;
    case 'recover':
      if ((e.btimer ?? 0) <= 0) { e.bstate = 'chase'; e.batkCd = e.phase2 ? 1.2 : 1.8; }
      break;
  }
}

function pickBossAttack(e: Enemy): BossAttack {
  const pool: BossAttack[] = e.phase2
    ? ['charge', 'burst', 'volley', 'summon', 'slam']
    : ['charge', 'burst', 'volley'];
  return pool[Math.floor(Math.random() * pool.length)];
}

function executeBossAttack(e: Enemy, state: GameState, view: { w: number; h: number }, nx: number, ny: number): void {
  const dmg = e.damage;
  switch (e.bnext) {
    case 'charge':
      e.cvx = nx * 420 * WORLD; e.cvy = ny * 420 * WORLD;
      e.bstate = 'charge'; e.btimer = 0.5;
      return;
    case 'burst':
      radialHazards(state, e.x, e.y, 16, 140 * WORLD, dmg * 0.6, '#ff7a5a');
      break;
    case 'volley': {  // aimed fan of bolts
      const base = Math.atan2(ny, nx);
      for (let i = -2; i <= 2; i++) {
        const a = base + i * 0.2;
        const sp = 190 * WORLD;
        state.hazards.push({ x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 3, radius: 7, damage: dmg * 0.6, color: '#ffb020' });
      }
      break;
    }
    case 'summon': {
      const stage = STAGES[state.stageIndex];
      const adds = stage.pool.filter(k => ENEMY_DEFS[k].hp < 40);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const k = adds.length ? adds[Math.floor(Math.random() * adds.length)] : 'bat';
        state.enemies.push(createEnemy(state, k, e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40));
      }
      spawnBurst(state, e.x, e.y, '#a78bfa', 18);
      break;
    }
    case 'slam': {   // expanding shockwave ring the player must escape
      state.shake = 12;
      for (let r = 0; r < 3; r++) {
        radialHazards(state, e.x, e.y, 24, (110 + r * 55) * WORLD, dmg * 0.55, '#ff5a4a');
      }
      break;
    }
  }
  e.bstate = 'recover';
  e.btimer = 0.6;
}

function radialHazards(state: GameState, x: number, y: number, n: number, speed: number, damage: number, color: string): void {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    state.hazards.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 3.2, radius: 7, damage, color });
  }
}
