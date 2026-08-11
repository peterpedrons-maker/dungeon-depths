import { Enemy, EnemyKind, GameState, ENEMY_STATS } from './types';

export function createInitialState(): GameState {
  return {
    player: {
      pos: { x: 0, y: 0 },
      radius: 18,
      hp: 100,
      maxHp: 100,
      facing: -Math.PI / 2,
      bob: 0,
    },
    enemies: [],
    time: 0,
    spawnTimer: 0.5,
    nextId: 1,
    kills: 0,
    running: true,
  };
}

// Which enemy types are allowed to spawn, based on elapsed time.
function pickEnemyKind(time: number): EnemyKind {
  const roll = Math.random();
  if (time < 15) {
    return 'slime';
  }
  if (time < 35) {
    return roll < 0.7 ? 'slime' : 'bat';
  }
  if (roll < 0.5) return 'slime';
  if (roll < 0.8) return 'bat';
  return 'skeleton';
}

// Spawn distance: just beyond the visible area so foes "come from afar".
function spawnEnemy(state: GameState, spawnRadius: number): void {
  const kind = pickEnemyKind(state.time);
  const stats = ENEMY_STATS[kind];
  const angle = Math.random() * Math.PI * 2;
  const dist = spawnRadius + Math.random() * 80;

  const enemy: Enemy = {
    id: state.nextId++,
    kind,
    pos: {
      x: state.player.pos.x + Math.cos(angle) * dist,
      y: state.player.pos.y + Math.sin(angle) * dist,
    },
    radius: stats.radius,
    speed: stats.speed,
    hp: stats.hp,
    maxHp: stats.hp,
    hitFlash: 0,
    wobble: Math.random() * Math.PI * 2,
    heading: angle + Math.PI, // face back toward the player from the spawn ring
    age: 0,
  };
  state.enemies.push(enemy);
}

// Difficulty curve: enemies spawn faster over time.
function spawnInterval(time: number): number {
  return Math.max(0.35, 1.6 - time * 0.02);
}

export function updateGame(state: GameState, dt: number, spawnRadius: number): void {
  if (!state.running) return;

  state.time += dt;
  state.player.bob += dt * 4;

  // ── Spawning ────────────────────────────────────────────────
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    const count = state.time > 45 ? 2 : 1;
    for (let i = 0; i < count; i++) spawnEnemy(state, spawnRadius);
    state.spawnTimer = spawnInterval(state.time);
  }

  const player = state.player;
  let nearest: Enemy | null = null;
  let nearestDist = Infinity;

  // ── Enemy movement toward player ────────────────────────────
  for (const e of state.enemies) {
    const dx = player.pos.x - e.pos.x;
    const dy = player.pos.y - e.pos.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = e;
    }

    // Orient toward the player (top-down heading), smoothed.
    const targetHeading = Math.atan2(dy, dx);
    e.heading = lerpAngle(e.heading, targetHeading, Math.min(1, dt * 8));

    const touchDist = e.radius + player.radius;
    if (dist > touchDist) {
      // Move toward the player.
      e.pos.x += (dx / dist) * e.speed * dt;
      e.pos.y += (dy / dist) * e.speed * dt;
    } else {
      // Contact: gentle chip damage so the scene feels alive.
      player.hp = Math.max(0, player.hp - 6 * dt);
    }

    if (e.hitFlash > 0) e.hitFlash -= dt;
    e.wobble += dt * 6;
    e.age += dt;
  }

  // ── Separate overlapping enemies so they surround, not stack ─
  for (let i = 0; i < state.enemies.length; i++) {
    for (let j = i + 1; j < state.enemies.length; j++) {
      const a = state.enemies[i];
      const b = state.enemies[j];
      const dx = b.pos.x - a.pos.x;
      const dy = b.pos.y - a.pos.y;
      const d = Math.hypot(dx, dy) || 1;
      const minD = a.radius + b.radius;
      if (d < minD) {
        const push = (minD - d) / 2;
        const nx = dx / d;
        const ny = dy / d;
        a.pos.x -= nx * push;
        a.pos.y -= ny * push;
        b.pos.x += nx * push;
        b.pos.y += ny * push;
      }
    }
  }

  // ── Player faces the nearest threat ─────────────────────────
  if (nearest) {
    const target = Math.atan2(nearest.pos.y - player.pos.y, nearest.pos.x - player.pos.x);
    player.facing = lerpAngle(player.facing, target, Math.min(1, dt * 6));
  }

  if (player.hp <= 0) {
    player.hp = 0;
    state.running = false;
  }
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}
