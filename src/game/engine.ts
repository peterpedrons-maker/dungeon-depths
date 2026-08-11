import {
  GameState, Player, PlayerStats, Enemy, EnemyKind, Bolt, Gem, Upgrade, ClassId,
  FLOOR_COUNT, FLOOR_WAVE_TIME, BOSS_NAMES, DASH_COOLDOWN, ORBIT_RADIUS, WORLD,
} from './types';
import { rollUpgrades } from './upgrades';
import { Input } from './input';
import { sound } from './sound';
import { getClass, worldStats } from './classes';

const ENEMY_BASE: Record<EnemyKind, { hp: number; speed: number; radius: number; damage: number; xp: number }> = {
  slime:    { hp: 14, speed: 40, radius: 15, damage: 8,  xp: 1 },
  bat:      { hp: 8,  speed: 82, radius: 12, damage: 6,  xp: 1 },
  skeleton: { hp: 26, speed: 54, radius: 14, damage: 12, xp: 3 },
};

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
    enemies: [], bolts: [], swings: [], gems: [], hazards: [], particles: [], damageNumbers: [],
    time: 0, spawnTimer: 0, nextId: 1, kills: 0, shake: 0,
    offeredUpgrades: [],
    floor: 1, floorPhase: 'waves', floorTimer: 0, stair: null,
  };
}

export function startGame(state: GameState, classId: ClassId = 'knight'): void {
  state.phase = 'playing';
  state.player = makePlayer(classId);
  state.enemies = []; state.bolts = []; state.swings = []; state.gems = []; state.hazards = [];
  state.particles = []; state.damageNumbers = [];
  state.time = 0; state.spawnTimer = 1.2; state.nextId = 1; state.kills = 0; state.shake = 0;
  state.offeredUpgrades = [];
  state.floor = 1; state.floorPhase = 'waves'; state.floorTimer = 0; state.stair = null;
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
  // Gentle linear growth (was compounding ×1.28, which ballooned fast).
  p.xpToNext = 3 + p.level * 2;
  state.phase = 'levelup';
  state.offeredUpgrades = rollUpgrades(3);
  spawnBurst(state, p.x, p.y, '#f0c04a', 14);
  sound.levelUp();
}

// ─── Spawning ───────────────────────────────────────────────────────────────
function pickKind(time: number, floor: number): EnemyKind {
  const r = Math.random();
  if (floor >= 2) {                     // deeper floors: full roster right away
    if (r < 0.4) return 'slime';
    if (r < 0.72) return 'bat';
    return 'skeleton';
  }
  if (time < 18) return 'slime';
  if (time < 45) return r < 0.65 ? 'slime' : 'bat';
  if (r < 0.45) return 'slime';
  if (r < 0.75) return 'bat';
  return 'skeleton';
}

// Pick a point just outside the visible rectangle, so enemies always walk in
// from the nearest screen edge instead of from a far-off circle's corners.
function offscreenPoint(state: GameState, view: { w: number; h: number }): { x: number; y: number } {
  const p = state.player;
  const halfW = view.w / 2, halfH = view.h / 2;
  const margin = 30 * WORLD + Math.random() * 40 * WORLD;
  const perimeter = 2 * (view.w + view.h);
  let t = Math.random() * perimeter;
  if (t < view.w) return { x: p.x - halfW + t, y: p.y - halfH - margin };            // top
  t -= view.w;
  if (t < view.w) return { x: p.x - halfW + t, y: p.y + halfH + margin };            // bottom
  t -= view.w;
  if (t < view.h) return { x: p.x - halfW - margin, y: p.y - halfH + t };            // left
  t -= view.h;
  return { x: p.x + halfW + margin, y: p.y - halfH + t };                            // right
}

function spawnEnemy(state: GameState, view: { w: number; h: number }): void {
  const kind = pickKind(state.floorTimer, state.floor);
  const b = ENEMY_BASE[kind];
  const floorMul = 1 + (state.floor - 1) * 0.5;                 // tougher each floor
  const hpMul = (1 + state.floorTimer / 55) * floorMul;
  const dmgMul = (1 + state.floorTimer / 230) * (1 + (state.floor - 1) * 0.15);
  const at = offscreenPoint(state, view);
  const e: Enemy = {
    id: state.nextId++,
    kind,
    x: at.x,
    y: at.y,
    hp: b.hp * hpMul, maxHp: b.hp * hpMul,
    speed: b.speed * WORLD * (0.9 + Math.random() * 0.2),
    radius: b.radius,
    damage: b.damage * dmgMul,
    xp: b.xp,
    flash: 0, knockX: 0, knockY: 0, hitCd: 0, orbCd: 0,
    facingLeft: false, bob: Math.random() * 6, anim: Math.random() * 6, age: 0,
  };
  state.enemies.push(e);
}

function spawnInterval(time: number): number {
  // Gentle early game, ramps up as the floor goes on.
  return Math.max(0.34, 1.7 - time * 0.012);
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


  // ── Floor flow: waves -> boss -> cleared (walk to stairs) ──
  if (state.floorPhase === 'waves') {
    state.floorTimer += dt;
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      const t = state.floorTimer;
      const count = 1 + (t > 20 ? 1 : 0) + (t > 30 ? 1 : 0) + (state.floor - 1);
      for (let i = 0; i < count; i++) spawnEnemy(state, view);
      state.spawnTimer = spawnInterval(t);
    }
    if (state.floorTimer >= FLOOR_WAVE_TIME) spawnBoss(state, view);
  } else if (state.floorPhase === 'cleared' && state.stair) {
    const dsx = p.x - state.stair.x, dsy = p.y - state.stair.y;
    if (Math.hypot(dsx, dsy) < 30 * WORLD) { descend(state); return; }
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

  // ── Player movement (left stick / WASD), or dash override ──
  p.moving = mv.active && mv.mag > 0.15;
  if (p.dashTimer > 0) {
    const DASH_SPEED = 540 * WORLD;
    p.x += p.dashX * DASH_SPEED * dt;
    p.y += p.dashY * DASH_SPEED * dt;
    p.animTime += dt;
    p.invuln = Math.max(p.invuln, p.dashTimer);
    if (Math.abs(p.dashX) > 0.15) p.facingLeft = p.dashX < 0;
    // afterimage trail
    state.particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.2, maxLife: 0.2, color: '#8fc0f0', size: 3.5 });
  } else if (p.moving) {
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
    fireWeapon(state, p.aimX, p.aimY);
  }

  // ── Orbiting weapon (Necromancer): persistent contact damage ──
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

  // Swing arc visuals
  for (let i = state.swings.length - 1; i >= 0; i--) {
    state.swings[i].life -= dt;
    if (state.swings[i].life <= 0) state.swings.splice(i, 1);
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
    e.bob += dt * 5;
    e.anim += dt;
    e.age += dt;

    const dx = p.x - e.x, dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;

    if (e.isBoss) {
      bossAI(e, state, dt);
    } else {
      // knockback
      e.x += e.knockX * dt; e.y += e.knockY * dt;
      e.knockX *= Math.pow(0.0001, dt); e.knockY *= Math.pow(0.0001, dt);
      // move toward player
      e.x += (dx / d) * e.speed * dt;
      e.y += (dy / d) * e.speed * dt;
      e.facingLeft = dx < 0;
    }

    // death
    if (e.hp <= 0) {
      if (e.isBoss) {
        spawnBurst(state, e.x, e.y, '#ffd257', 40);
        spawnBurst(state, e.x, e.y, '#c23b2e', 30);
        state.shake = 12;
        sound.enemyDie(); sound.levelUp();
        for (let k = 0; k < 6; k++) dropGem(state, e);   // boss loot
        state.enemies.splice(i, 1);
        onBossDefeated(state, e.x, e.y);   // clears remaining enemies/hazards
        break;                              // array was reset — stop iterating
      }
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
      p.invuln = 0.6; p.hurtFlash = 0.3; e.hitCd = e.isBoss ? 0.5 : 0.8;
      state.shake = Math.min(9, state.shake + (e.isBoss ? 8 : 5));
      spawnBurst(state, p.x, p.y, '#c23b2e', 8);
      sound.hurt();
      if (p.hp <= 0) { p.hp = 0; state.phase = 'dead'; sound.gameOver(); return; }
    }
  }

  // ── Hazards (boss projectiles) ──
  for (let i = state.hazards.length - 1; i >= 0; i--) {
    const h = state.hazards[i];
    h.x += h.vx * dt; h.y += h.vy * dt; h.life -= dt;
    const rr = h.radius + p.radius;
    if (p.invuln <= 0 && (h.x - p.x) ** 2 + (h.y - p.y) ** 2 < rr * rr) {
      p.hp -= h.damage;
      p.invuln = 0.6; p.hurtFlash = 0.3;
      state.shake = Math.min(9, state.shake + 5);
      spawnBurst(state, p.x, p.y, '#c23b2e', 6);
      sound.hurt();
      state.hazards.splice(i, 1);
      if (p.hp <= 0) { p.hp = 0; state.phase = 'dead'; sound.gameOver(); return; }
      continue;
    }
    if (h.life <= 0) state.hazards.splice(i, 1);
  }

  // separation between enemies
  separate(state.enemies);

  // ── Gems: rest on the ground; only magnetize once you get close ──
  for (let i = state.gems.length - 1; i >= 0; i--) {
    const g = state.gems[i];
    g.bob += dt * 5;
    const dx = p.x - g.x, dy = p.y - g.y;
    const d = Math.hypot(dx, dy) || 1;

    if (!g.homing) {
      // Brief scatter, then rest on the ground. Walk over them to collect —
      // the zoomed-out camera keeps drops in view.
      g.x += g.vx * dt; g.y += g.vy * dt;
      g.vx *= Math.pow(0.0005, dt); g.vy *= Math.pow(0.0005, dt);
      if (d < p.stats.pickupRadius) g.homing = true;   // snap in when close
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

function fireWeapon(state: GameState, aimX: number, aimY: number): void {
  const p = state.player;
  const baseAng = Math.atan2(aimY, aimX);

  if (p.weapon === 'melee') {
    // Sweeping arc that hits everything in front of the hero.
    const arc = Math.PI * 0.95;
    const radius = p.stats.range;
    state.swings.push({ x: p.x, y: p.y, ang: baseAng, arc, radius, life: 0.18, maxLife: 0.18 });
    for (const e of state.enemies) {
      const dx = e.x - p.x, dy = e.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > radius + e.radius) continue;
      let diff = Math.atan2(dy, dx) - baseAng;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > arc / 2) continue;
      applyHit(state, e, p.stats.damage, dx / d, dy / d);
    }
    sound.swing();
    return;
  }

  if (p.weapon === 'orbit') return;   // orbs damage continuously, not on a timer

  const style = p.weapon === 'fireball' ? 'fire' : p.weapon === 'arrow' ? 'arrow' : 'bolt';
  const n = p.stats.boltCount;
  const spread = 0.18;
  for (let i = 0; i < n; i++) {
    const offset = n === 1 ? 0 : (i - (n - 1) / 2) * spread;
    const ang = baseAng + offset;
    state.bolts.push({
      x: p.x + Math.cos(baseAng) * 8, y: p.y + Math.sin(baseAng) * 8,
      vx: Math.cos(ang) * p.stats.boltSpeed,
      vy: Math.sin(ang) * p.stats.boltSpeed,
      damage: p.stats.damage,
      pierce: p.stats.pierce,
      life: 1.6, hitIds: [], rot: ang, style,
    });
  }
  sound.shoot();
}

// Shared damage application (bolts, melee, orbs)
function applyHit(state: GameState, e: Enemy, rawDamage: number, nx: number, ny: number): void {
  const p = state.player;
  const crit = Math.random() < p.stats.critChance;
  const dmg = rawDamage * (crit ? 2 : 1);
  e.hp -= dmg;
  e.flash = 0.12;
  e.knockX += nx * p.stats.knockback;
  e.knockY += ny * p.stats.knockback;
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
      if (a.isBoss || b.isBoss) continue;     // the boss shoves through
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

// ─── Boss & floor descent ─────────────────────────────────────────────────────
function spawnBoss(state: GameState, view: { w: number; h: number }): void {
  state.floorPhase = 'boss';
  const at = offscreenPoint(state, view);
  const hp = 240 * (1 + (state.floor - 1) * 0.8);
  const boss: Enemy = {
    id: state.nextId++,
    kind: 'skeleton',
    x: at.x,
    y: at.y,
    hp, maxHp: hp,
    speed: 46 * WORLD, radius: 30,
    damage: 20 * (1 + (state.floor - 1) * 0.2),
    xp: 5,
    flash: 0, knockX: 0, knockY: 0, hitCd: 0, orbCd: 0,
    facingLeft: false, bob: 0, anim: 0, age: 0,
    isBoss: true, name: BOSS_NAMES[state.floor - 1],
    bstate: 'chase', btimer: 0, batkCd: 2.4, cvx: 0, cvy: 0,
  };
  state.enemies.push(boss);
}

function bossAI(e: Enemy, state: GameState, dt: number): void {
  const p = state.player;
  const dx = p.x - e.x, dy = p.y - e.y;
  const d = Math.hypot(dx, dy) || 1;
  e.facingLeft = dx < 0;
  e.btimer = (e.btimer ?? 0) - dt;
  e.batkCd = (e.batkCd ?? 0) - dt;

  switch (e.bstate) {
    case 'chase':
      e.x += (dx / d) * e.speed * dt;
      e.y += (dy / d) * e.speed * dt;
      if ((e.batkCd ?? 0) <= 0) { e.bstate = 'telegraph'; e.btimer = 0.7; }
      break;
    case 'telegraph':
      e.flash = 0.1;                         // glows white before striking
      if ((e.btimer ?? 0) <= 0) {
        if (Math.random() < 0.55) {          // charge
          e.cvx = (dx / d) * 380 * WORLD; e.cvy = (dy / d) * 380 * WORLD;
          e.bstate = 'charge'; e.btimer = 0.45;
        } else {                             // radial burst
          radialHazards(state, e.x, e.y, 14, 130 * WORLD, 12 * (1 + (state.floor - 1) * 0.15));
          e.bstate = 'recover'; e.btimer = 0.7;
        }
      }
      break;
    case 'charge':
      e.x += (e.cvx ?? 0) * dt; e.y += (e.cvy ?? 0) * dt;
      if ((e.btimer ?? 0) <= 0) { e.bstate = 'chase'; e.batkCd = 2.2; }
      break;
    case 'recover':
      if ((e.btimer ?? 0) <= 0) { e.bstate = 'chase'; e.batkCd = 1.8; }
      break;
  }
}

function radialHazards(state: GameState, x: number, y: number, n: number, speed: number, damage: number): void {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    state.hazards.push({
      x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      life: 3.2, radius: 7, damage,
    });
  }
}

function onBossDefeated(state: GameState, x: number, y: number): void {
  // Clear the field so the way to the stairs is safe.
  state.enemies = [];
  state.hazards = [];
  if (state.floor >= FLOOR_COUNT) {
    state.phase = 'won';
    sound.win();
  } else {
    state.floorPhase = 'cleared';
    state.stair = { x, y };
  }
}

function descend(state: GameState): void {
  state.floor += 1;
  state.floorPhase = 'waves';
  state.floorTimer = 0;
  state.spawnTimer = 1.2;
  state.stair = null;
  state.enemies = []; state.hazards = []; state.gems = []; state.bolts = []; state.swings = [];
  const p = state.player;
  p.x = 0; p.y = 0;
  p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.maxHp * 0.25);   // heal on descent
  sound.levelUp();
}
