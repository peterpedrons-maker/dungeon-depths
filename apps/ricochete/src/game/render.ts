// ─── Rendering ───────────────────────────────────────────────────────────────
// Pure draw code — reads GameState, never mutates it (except the ball-trail
// buffer kept locally here, which is a visual-only artifact, not game state).

import { LEVEL_COLOR } from './arena';
import { GameState } from './types';

const TRAIL_MAX = 14;
let trail: { x: number; y: number }[] = [];

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  viewW: number,
  viewH: number,
  aimAngle: number,
) {
  ctx.save();

  if (state.shake > 0) {
    const s = state.shake * 6;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }

  ctx.fillStyle = '#07060d';
  ctx.fillRect(0, 0, viewW, viewH);

  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < viewW; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, viewH);
    ctx.stroke();
  }
  for (let y = 0; y < viewH; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(viewW, y);
    ctx.stroke();
  }

  drawBlocks(ctx, state);
  drawTrail(ctx, state);
  drawBall(ctx, state);
  if (state.phase === 'aiming') drawAimLine(ctx, state, aimAngle);
  drawParticles(ctx, state);
  drawScorePops(ctx, state);

  ctx.restore();
}

function drawBlocks(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const b of state.blocks) {
    const color = LEVEL_COLOR[b.maxLevel] ?? '#2fe6ff';
    const damageRatio = b.level / b.maxLevel;

    ctx.globalAlpha = 0.3 + 0.7 * damageRatio;
    ctx.fillStyle = color;
    ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);

    if (b.flash > 0) {
      ctx.globalAlpha = Math.min(1, b.flash * 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
    }

    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
  }
}

function drawTrail(ctx: CanvasRenderingContext2D, state: GameState) {
  if (state.phase === 'flying') {
    trail.push({ x: state.ball.x, y: state.ball.y });
    if (trail.length > TRAIL_MAX) trail.shift();
  } else if (trail.length > 0) {
    trail = [];
  }

  for (let i = 0; i < trail.length; i++) {
    const t = trail[i];
    const ratio = (i + 1) / trail.length;
    ctx.beginPath();
    ctx.arc(t.x, t.y, state.ball.radius * (0.3 + 0.5 * ratio), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(47,230,255,${ratio * 0.35})`;
    ctx.fill();
  }
}

function drawBall(ctx: CanvasRenderingContext2D, state: GameState) {
  const b = state.ball;
  const gradient = ctx.createRadialGradient(b.x - 3, b.y - 3, 1, b.x, b.y, b.radius);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.45, '#d8e4ff');
  gradient.addColorStop(1, '#5c6a8a');

  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.stroke();
}

function drawAimLine(ctx: CanvasRenderingContext2D, state: GameState, angle: number) {
  const b = state.ball;
  const len = 170;
  const tipX = b.x + Math.cos(angle) * len;
  const tipY = b.y + Math.sin(angle) * len;

  ctx.save();
  ctx.strokeStyle = '#2fe6ff';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(tipX, tipY, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#2fe6ff';
  ctx.fill();
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawScorePops(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px sans-serif';
  for (const s of state.scorePops) {
    ctx.globalAlpha = Math.max(0, s.life / 0.7);
    ctx.fillStyle = s.combo > 1 ? '#39ff88' : '#ffffff';
    ctx.fillText(`+${s.value}${s.combo > 1 ? ' x' + s.combo : ''}`, s.x, s.y);
  }
  ctx.globalAlpha = 1;
}
