// ─── Rendering ───────────────────────────────────────────────────────────────
// Pure draw code — reads GameState, never mutates it (except the ball-trail
// buffer kept locally here, which is a visual-only artifact, not game state).
// Everything world-space (blocks, goal, holes, ball, trail, particles, score
// pops) is drawn inside the camera transform, so it pans/zooms as one piece;
// the vignette is screen-space and drawn after the transform is popped.

import { LEVEL_COLOR } from './arena';
import { GameState } from './types';

const TRAIL_MAX = 14;
let trail: { x: number; y: number }[] = [];

function blockHash(x: number, y: number): number {
  const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return h - Math.floor(h);
}

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

  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, viewW, viewH);

  const cam = state.camera;
  ctx.translate(viewW / 2, viewH / 2);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-cam.x, -cam.y);

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

  drawGoal(ctx, state);
  drawBlocks(ctx, state);
  drawHoles(ctx, state, viewW, viewH);
  drawTrail(ctx, state);
  drawBall(ctx, state);
  if (state.phase === 'aiming') drawAimLine(ctx, state, aimAngle);
  drawParticles(ctx, state);
  drawScorePops(ctx, state);

  ctx.restore();

  drawVignette(ctx, viewW, viewH);
}

function drawGoal(ctx: CanvasRenderingContext2D, state: GameState) {
  const g = state.goal;
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 500);

  ctx.save();
  const grad = ctx.createLinearGradient(g.x, g.y, g.x, g.y + g.h);
  grad.addColorStop(0, `rgba(228,230,234,${0.05 + pulse * 0.08})`);
  grad.addColorStop(1, `rgba(228,230,234,${0.16 + pulse * 0.1})`);
  ctx.fillStyle = grad;
  ctx.fillRect(g.x, g.y, g.w, g.h);

  ctx.strokeStyle = `rgba(228,230,234,${0.3 + pulse * 0.25})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(g.x + 1, g.y + 1, g.w - 2, g.h - 2);
  ctx.setLineDash([]);

  ctx.globalAlpha = 0.55 + pulse * 0.25;
  ctx.fillStyle = '#e4e6ea';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SAÍDA', g.x + g.w / 2, g.y + g.h / 2 + 4);
  ctx.restore();
}

function drawHoles(ctx: CanvasRenderingContext2D, state: GameState, viewW: number, viewH: number) {
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 320);

  ctx.save();
  ctx.strokeStyle = `rgba(154,90,82,${0.55 + pulse * 0.35})`;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(154,90,82,0.85)';
  for (const h of state.holes) {
    ctx.beginPath();
    if (h.edge === 'top') {
      ctx.moveTo(h.from, 1);
      ctx.lineTo(h.to, 1);
    } else if (h.edge === 'bottom') {
      ctx.moveTo(h.from, viewH - 1);
      ctx.lineTo(h.to, viewH - 1);
    } else if (h.edge === 'left') {
      ctx.moveTo(1, h.from);
      ctx.lineTo(1, h.to);
    } else {
      ctx.moveTo(viewW - 1, h.from);
      ctx.lineTo(viewW - 1, h.to);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawBlocks(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const b of state.blocks) {
    const color = LEVEL_COLOR[b.maxLevel] ?? '#9aa0ab';
    const damageRatio = b.level / b.maxLevel;

    ctx.globalAlpha = 0.3 + 0.7 * damageRatio;
    ctx.fillStyle = color;
    ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);

    const hits = b.maxLevel - b.level;
    if (hits > 0) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 1.3;
      for (let i = 0; i < Math.min(hits, 2); i++) {
        const h1 = blockHash(b.x + i * 13.7, b.y + i * 5.3);
        const h2 = blockHash(b.x + i * 2.1 + 7, b.y + i * 9.9 + 3);
        const x1 = b.x + b.w * (0.15 + h1 * 0.2);
        const y1 = b.y + b.h * (0.15 + h2 * 0.2);
        const xm = b.x + b.w * (0.4 + h1 * 0.2);
        const ym = b.y + b.h * (0.5 + h2 * 0.15);
        const x2 = b.x + b.w * (0.65 + h2 * 0.2);
        const y2 = b.y + b.h * (0.65 + h1 * 0.2);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(xm, ym);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (b.flash > 0) {
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = color;
      ctx.globalAlpha = Math.min(1, b.flash * 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
      ctx.restore();
    }

    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
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

  ctx.save();
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(228,230,234,0.65)';
  for (let i = 0; i < trail.length; i++) {
    const t = trail[i];
    const ratio = (i + 1) / trail.length;
    ctx.beginPath();
    ctx.arc(t.x, t.y, state.ball.radius * (0.3 + 0.5 * ratio), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(228,230,234,${ratio * 0.32})`;
    ctx.fill();
  }
  ctx.restore();
}

function drawBall(ctx: CanvasRenderingContext2D, state: GameState) {
  const b = state.ball;
  const gradient = ctx.createRadialGradient(b.x - 3, b.y - 3, 1, b.x, b.y, b.radius);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.45, '#d8dce3');
  gradient.addColorStop(1, '#5c6168');

  ctx.save();
  ctx.shadowBlur = 16;
  ctx.shadowColor = 'rgba(228,230,234,0.9)';
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();

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
  ctx.strokeStyle = '#cfd3db';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(tipX, tipY, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#cfd3db';
  ctx.fill();
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();
  for (const p of state.particles) {
    const ratio = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = ratio;
    ctx.shadowBlur = 8 * ratio;
    ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawScorePops(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px sans-serif';
  for (const s of state.scorePops) {
    ctx.globalAlpha = Math.max(0, s.life / 0.7);
    const color = s.combo > 1 ? '#c9a86a' : '#e4e6ea';
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.fillText(`+${s.value}${s.combo > 1 ? ' x' + s.combo : ''}`, s.x, s.y);
  }
  ctx.restore();
}

function drawVignette(ctx: CanvasRenderingContext2D, viewW: number, viewH: number) {
  ctx.save();
  const vignette = ctx.createRadialGradient(
    viewW / 2, viewH / 2, viewH * 0.25,
    viewW / 2, viewH / 2, viewH * 0.72,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, viewW, viewH);
  ctx.restore();
}
