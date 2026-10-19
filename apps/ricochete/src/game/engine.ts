// ─── Game engine ─────────────────────────────────────────────────────────────
// Core loop: aim (pick an angle) -> launch (fixed speed, free angle) -> the
// ball bounces wall-to-wall, breaking blocks for points, until one of two
// things happens: it reaches the goal strip (phase clears, advance to a
// harder one) or it finds its way through a worn-down patch of the shell
// into a hole at the true edge (run over). Collision is a real 2D
// circle-vs-AABB reflection off the nearest point on each block, plus the
// true screen edges as a safety net — a hole only matters exactly where it
// is, every other point on the boundary still bounces normally. Movement is
// split into small fixed substeps so a fast ball can't tunnel through a
// block (or a hole) in a single frame.

import { AudioEngine } from './audio';
import { generateLevel, LEVEL_POINTS } from './arena';
import { ballRadiusBonus, goalSizeMultiplier, loadSave, saveSave, scoreMultiplier, GOLD_RATE } from './progression';
import { Block, Edge, GameState } from './types';
import { InputState } from './input';

export const VIEW_W = 540;
export const VIEW_H = 960;
export const BASE_BALL_RADIUS = 9;
export const LAUNCH_SPEED = 540; // px/s, fixed — only the angle is player-controlled
const COMBO_WINDOW = 0.6; // seconds to chain another break into the combo
const SUBSTEP = 1 / 120;
const MAX_PHASE_TIME = 45; // safety net so a pathological trajectory can't hang forever

const BASE_ZOOM = 1;
const FOLLOW_ZOOM = 1.6; // how close the camera gets while the ball is flying
const CAMERA_FOLLOW_SPEED = 6; // higher = camera catches up to its target faster

export function createState(): GameState {
  return {
    phase: 'title',
    ball: { x: VIEW_W / 2, y: VIEW_H / 2, vx: 0, vy: 0, radius: BASE_BALL_RADIUS },
    camera: { x: VIEW_W / 2, y: VIEW_H / 2, zoom: BASE_ZOOM },
    blocks: [],
    holes: [],
    goal: { x: 0, y: 0, w: 0, h: 0 },
    particles: [],
    scorePops: [],
    score: 0,
    goldBankedAt: 0,
    blocksBroken: 0,
    combo: 1,
    comboTimer: 0,
    levelIndex: 0,
    shieldsLeft: 0,
    scoreMult: 1,
    roundTime: 0,
    shake: 0,
  };
}

// Begins a brand new run: fresh score, shields and a level-1 arena, with
// whatever upgrades the player has bought so far applied.
export function startRun(state: GameState) {
  const save = loadSave();
  state.score = 0;
  state.goldBankedAt = 0;
  state.blocksBroken = 0;
  state.scoreMult = scoreMultiplier(save.upgrades.multiplier);
  startLevel(state, 0);
}

export function startLevel(state: GameState, levelIndex: number, seed = Date.now()) {
  const save = loadSave();
  const { blocks, holes, goal } = generateLevel(VIEW_W, VIEW_H, seed, levelIndex, goalSizeMultiplier(save.upgrades.goalSize));
  state.blocks = blocks;
  state.holes = holes;
  state.goal = goal;
  state.ball.x = VIEW_W / 2;
  state.ball.y = VIEW_H / 2;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.ball.radius = BASE_BALL_RADIUS + ballRadiusBonus(save.upgrades.ballSize);
  state.camera.x = VIEW_W / 2;
  state.camera.y = VIEW_H / 2;
  state.camera.zoom = BASE_ZOOM;
  state.particles = [];
  state.scorePops = [];
  state.combo = 1;
  state.comboTimer = 0;
  state.levelIndex = levelIndex;
  state.shieldsLeft = save.upgrades.shield;
  state.roundTime = 0;
  state.shake = 0;
  state.phase = 'aiming';
}

export function continueToNextLevel(state: GameState) {
  startLevel(state, state.levelIndex + 1);
}

export function launchBall(state: GameState, angle: number) {
  if (state.phase !== 'aiming') return;
  state.ball.vx = Math.cos(angle) * LAUNCH_SPEED;
  state.ball.vy = Math.sin(angle) * LAUNCH_SPEED;
  state.phase = 'flying';
}

function bankGold(state: GameState) {
  const delta = state.score - state.goldBankedAt;
  state.goldBankedAt = state.score;
  const earned = Math.floor(delta / GOLD_RATE);
  if (earned <= 0) return;
  const save = loadSave();
  save.gold += earned;
  saveSave(save);
}

function triggerGameOver(state: GameState) {
  bankGold(state);
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.phase = 'gameOver';
}

function triggerLevelComplete(state: GameState) {
  bankGold(state);
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.phase = 'levelComplete';
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

    const points = Math.round((LEVEL_POINTS[block.maxLevel] ?? 10) * state.combo * state.scoreMult);
    state.score += points;
    state.blocksBroken += 1;
    state.shake = Math.min(1, state.shake + 0.25);

    const cx = block.x + block.w / 2;
    const cy = block.y + block.h / 2;
    const color = block.maxLevel >= 3 ? '#4b4f58' : block.maxLevel === 2 ? '#9aa0ab' : '#e4e6ea';
    spawnBreakEffect(state, cx, cy, color, points, state.combo);
    audio?.onBreak(block.maxLevel);
  }

  return true;
}

function crossesHole(state: GameState, edge: Edge, coord: number): boolean {
  return state.holes.some((h) => h.edge === edge && coord >= h.from && coord <= h.to);
}

// Returns true if the ball should bounce off this edge; false means it fell
// through (a shield, if any, silently buys back one fall).
function resolveEdge(state: GameState, edge: Edge, coord: number): boolean {
  if (!crossesHole(state, edge, coord)) return true;
  if (state.shieldsLeft > 0) {
    state.shieldsLeft -= 1;
    return true;
  }
  return false;
}

function simulateFlyingStep(state: GameState, dt: number, audio?: AudioEngine) {
  const ball = state.ball;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.x - ball.radius < 0) {
    if (!resolveEdge(state, 'left', ball.y)) return triggerGameOver(state);
    ball.x = ball.radius;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x + ball.radius > VIEW_W) {
    if (!resolveEdge(state, 'right', ball.y)) return triggerGameOver(state);
    ball.x = VIEW_W - ball.radius;
    ball.vx = -Math.abs(ball.vx);
  }
  if (ball.y - ball.radius < 0) {
    if (!resolveEdge(state, 'top', ball.x)) return triggerGameOver(state);
    ball.y = ball.radius;
    ball.vy = Math.abs(ball.vy);
  } else if (ball.y + ball.radius > VIEW_H) {
    if (!resolveEdge(state, 'bottom', ball.x)) return triggerGameOver(state);
    ball.y = VIEW_H - ball.radius;
    ball.vy = -Math.abs(ball.vy);
  }

  const g = state.goal;
  if (ball.x > g.x && ball.x < g.x + g.w && ball.y > g.y && ball.y < g.y + g.h) {
    return triggerLevelComplete(state);
  }

  for (const block of state.blocks) {
    if (resolveBlockCollision(state, block, audio)) break;
  }
}

// Camera zooms out to show the whole arena while aiming/title/shop/
// level-complete/game-over, and zooms in to follow the ball while it's
// flying, clamped so the visible window never shows past the arena's true
// bounds — exponential smoothing (framerate-independent) instead of a
// linear lerp so it still feels right under a jittery dt.
function updateCamera(state: GameState, dt: number) {
  const cam = state.camera;
  const targetZoom = state.phase === 'flying' ? FOLLOW_ZOOM : BASE_ZOOM;
  const visW = VIEW_W / targetZoom;
  const visH = VIEW_H / targetZoom;

  const targetX = visW >= VIEW_W ? VIEW_W / 2 : Math.min(Math.max(state.ball.x, visW / 2), VIEW_W - visW / 2);
  const targetY = visH >= VIEW_H ? VIEW_H / 2 : Math.min(Math.max(state.ball.y, visH / 2), VIEW_H - visH / 2);

  const t = 1 - Math.exp(-CAMERA_FOLLOW_SPEED * dt);
  cam.x += (targetX - cam.x) * t;
  cam.y += (targetY - cam.y) * t;
  cam.zoom += (targetZoom - cam.zoom) * t;
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

    if (state.phase === 'flying') {
      state.roundTime += dt;
      if (state.roundTime >= MAX_PHASE_TIME) {
        triggerGameOver(state);
      }
    }
  }

  updateCamera(state, dt);
  updateEffects(state, dt);
}
