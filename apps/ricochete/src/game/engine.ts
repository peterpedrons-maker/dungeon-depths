// ─── Game engine ─────────────────────────────────────────────────────────────
// Core loop: aim (pick an angle) -> launch (fixed speed, free angle) -> the
// ball bounces wall-to-wall breaking blocks for a fixed round duration -> it
// stops and the round-end summary shows the score. Collision is a real 2D
// circle-vs-AABB reflection off the nearest point on each block, plus the true
// screen edges as a safety net so the ball can never escape even once the
// outer ring of blocks is gone. Movement is split into small fixed substeps
// so a fast ball can't tunnel through a block in a single frame.

import { AudioEngine } from './audio';
import { generateArena, LEVEL_POINTS } from './arena';
import { Block, GameState } from './types';
import { InputState } from './input';

export const VIEW_W = 540;
export const VIEW_H = 960;
export const BALL_RADIUS = 9;
export const LAUNCH_SPEED = 540; // px/s, fixed — only the angle is player-controlled
export const ROUND_DURATION = 18; // seconds the ball stays alive for
const COMBO_WINDOW = 0.6; // seconds to chain another break into the combo
const SUBSTEP = 1 / 120;

export function createState(): GameState {
  return {
    phase: 'title',
    ball: { x: VIEW_W / 2, y: VIEW_H / 2, vx: 0, vy: 0, radius: BALL_RADIUS },
    blocks: [],
    particles: [],
    scorePops: [],
    score: 0,
    blocksBroken: 0,
    combo: 1,
    comboTimer: 0,
    roundTime: 0,
    roundDuration: ROUND_DURATION,
    shake: 0,
  };
}

export function startRound(state: GameState, seed = Date.now()) {
  state.blocks = generateArena(VIEW_W, VIEW_H, seed);
  state.ball.x = VIEW_W / 2;
  state.ball.y = VIEW_H / 2;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.particles = [];
  state.scorePops = [];
  state.score = 0;
  state.blocksBroken = 0;
  state.combo = 1;
  state.comboTimer = 0;
  state.roundTime = 0;
  state.roundDuration = ROUND_DURATION;
  state.shake = 0;
  state.phase = 'aiming';
}

export function launchBall(state: GameState, angle: number) {
  if (state.phase !== 'aiming') return;
  state.ball.vx = Math.cos(angle) * LAUNCH_SPEED;
  state.ball.vy = Math.sin(angle) * LAUNCH_SPEED;
  state.phase = 'flying';
}

function spawnBreakEffect(state: GameState, x: number, y: number, color: string, value: number, combo: number) {
  for (let i = 0; i < 8; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 160;
    state.particles.push({
      x, y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: 0.4,
      maxLife: 0.4,
      color,
      size: 2 + Math.random() * 2.5,
    });
  }
  state.scorePops.push({ x, y, vy: -60, life: 0.7, value, combo });
}

function resolveBlockCollision(state: GameState, block: Block, audio?: AudioEngine) {
  const ball = state.ball;
  const nearestX = Math.max(block.x, Math.min(ball.x, block.x + block.w));
  const nearestY = Math.max(block.y, Math.min(ball.y, block.y + block.h));
  const dx = ball.x - nearestX;
  const dy = ball.y - nearestY;
  const distSq = dx * dx + dy * dy;
  if (distSq >= ball.radius * ball.radius) return false;

  const dist = Math.sqrt(distSq) || 0.0001;
  const nx = dist > 0.0001 ? dx / dist : 0;
  const ny = dist > 0.0001 ? dy / dist : -1;
  const overlap = ball.radius - dist;
  ball.x += nx * overlap;
  ball.y += ny * overlap;

  const dot = ball.vx * nx + ball.vy * ny;
  ball.vx -= 2 * dot * nx;
  ball.vy -= 2 * dot * ny;

  block.level -= 1;
  block.flash = 0.12;

  if (block.level <= 0) {
    state.blocks.splice(state.blocks.indexOf(block), 1);
    if (state.comboTimer > 0) state.combo += 1;
    else state.combo = 1;
    state.comboTimer = COMBO_WINDOW;

    const points = (LEVEL_POINTS[block.maxLevel] ?? 10) * state.combo;
    state.score += points;
    state.blocksBroken += 1;
    state.shake = Math.min(1, state.shake + 0.25);

    const cx = block.x + block.w / 2;
    const cy = block.y + block.h / 2;
    const color = block.maxLevel >= 3 ? '#ffd23f' : block.maxLevel === 2 ? '#ff3fb0' : '#2fe6ff';
    spawnBreakEffect(state, cx, cy, color, points, state.combo);
    audio?.onBreak(block.maxLevel, state.combo);
  }

  return true;
}

function simulateFlyingStep(state: GameState, dt: number, audio?: AudioEngine) {
  const ball = state.ball;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.x - ball.radius < 0) {
    ball.x = ball.radius;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x + ball.radius > VIEW_W) {
    ball.x = VIEW_W - ball.radius;
    ball.vx = -Math.abs(ball.vx);
  }
  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ball.vy = Math.abs(ball.vy);
  } else if (ball.y + ball.radius > VIEW_H) {
    ball.y = VIEW_H - ball.radius;
    ball.vy = -Math.abs(ball.vy);
  }

  for (const block of state.blocks) {
    if (resolveBlockCollision(state, block, audio)) break;
  }
}

function updateEffects(state: GameState, dt: number) {
  for (const b of state.blocks) {
    if (b.flash > 0) b.flash = Math.max(0, b.flash - dt);
  }

  state.particles = state.particles.filter((p) => p.life > 0);
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 220 * dt;
    p.life -= dt;
  }

  state.scorePops = state.scorePops.filter((s) => s.life > 0);
  for (const s of state.scorePops) {
    s.y += s.vy * dt;
    s.life -= dt;
  }

  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 1;
  }

  state.shake = Math.max(0, state.shake - dt * 2.5);
}

export function update(state: GameState, dt: number, input: InputState, audio?: AudioEngine) {
  if (state.phase === 'aiming' && input.launchRequested) {
    input.launchRequested = false;
    launchBall(state, input.angle);
  }

  if (state.phase === 'flying') {
    let remaining = dt;
    while (remaining > 0 && state.phase === 'flying') {
      const step = Math.min(SUBSTEP, remaining);
      simulateFlyingStep(state, step, audio);
      remaining -= step;
    }

    state.roundTime += dt;
    if (state.roundTime >= state.roundDuration) {
      state.roundTime = state.roundDuration;
      state.ball.vx = 0;
      state.ball.vy = 0;
      state.phase = 'roundEnd';
    }
  }

  updateEffects(state, dt);
}
