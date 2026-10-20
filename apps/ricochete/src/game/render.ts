// ─── Rendering ───────────────────────────────────────────────────────────────
// Pure draw code — reads GameState, never mutates it (except the ball-trail
// buffer kept locally here, which is a visual-only artifact, not game state).
// Synthwave/vaporwave look: a near-black void with a soft magenta/violet
// ambient glow, blocks as dark glass panels with a glowing neon outline
// (cool cyan = weak, hot magenta = tough) rather than filled pastel tiles,
// a two-tone cyan/magenta ball and trail, a pulsing cyan-magenta goal
// portal, and a bright neon-red hazard strip for holes. Everything
// world-space (blocks, goal, holes, ball, trail, particles, score pops) is
// drawn inside the camera transform, so it pans/zooms as one piece; the
// vignette is screen-space and drawn after the transform is popped.

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

  ctx.fillStyle = '#0b0618';
  ctx.fillRect(0, 0, viewW, viewH);

  const cam = state.camera;
  ctx.translate(viewW / 2, viewH / 2);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-cam.x, -cam.y);

  drawAmbientGlow(ctx, viewW, viewH);

  ctx.strokeStyle = 'rgba(46,230,255,0.05)';
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

function drawAmbientGlow(ctx: CanvasRenderingContext2D, viewW: number, viewH: number) {
  ctx.save();
  const glow = ctx.createRadialGradient(
    viewW / 2, viewH / 2, 0,
    viewW / 2, viewH / 2, viewH * 0.55,
  );
  glow.addColorStop(0, 'rgba(139,92,246,0.16)');
  glow.addColorStop(0.5, 'rgba(255,45,149,0.07)');
  glow.addColorStop(1, 'rgba(11,6,24,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, viewW, viewH);
  ctx.restore();
}

// The goal is hidden until the ball gets close enough to it (as a path
// gets broken through nearby) — it should never be visible as a beacon
// across the whole arena from the first bounce.
const GOAL_REVEAL_DIST = 150;

function drawGoal(ctx: CanvasRenderingContext2D, state: GameState) {
  const g = state.goal;
  const b = state.ball;
  const nearestX = Math.max(g.x, Math.min(b.x, g.x + g.w));
  const nearestY = Math.max(g.y, Math.min(b.y, g.y + g.h));
  const dist = Math.hypot(b.x - nearestX, b.y - nearestY);
  if (dist > GOAL_REVEAL_DIST) return;

  const proximity = 1 - dist / GOAL_REVEAL_DIST; // 0 just revealed .. 1 right on top of it
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 450);
  const fade = 0.35 + proximity * 0.65;
  const cx = g.x + g.w / 2;
  const cy = g.y + g.h / 2;

  ctx.save();
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(g.w, g.h) * 0.7);
  grad.addColorStop(0, `rgba(46,230,255,${(0.22 + pulse * 0.12) * fade})`);
  grad.addColorStop(0.6, `rgba(255,45,149,${(0.14 + pulse * 0.08) * fade})`);
  grad.addColorStop(1, 'rgba(11,6,24,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(g.x, g.y, g.w, g.h);

  ctx.strokeStyle = `rgba(46,230,255,${(0.45 + pulse * 0.3) * fade})`;
  ctx.shadowBlur = 16;
  ctx.shadowColor = `rgba(255,45,149,${0.6 * fade})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(g.x + 1, g.y + 1, g.w - 2, g.h - 2);
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;

  ctx.globalAlpha = (0.6 + pulse * 0.3) * fade;
  ctx.fillStyle = '#eafcff';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#2ee6ff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SAÍDA', cx, cy + 4);
  ctx.restore();
}

function drawHoles(ctx: CanvasRenderingContext2D, state: GameState, viewW: number, viewH: number) {
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 300);

  ctx.save();
  ctx.strokeStyle = `rgba(255,77,77,${0.6 + pulse * 0.35})`;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.shadowBlur = 14;
  ctx.shadowColor = 'rgba(255,77,77,0.95)';
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
    const color = LEVEL_COLOR[b.maxLevel] ?? LEVEL_COLOR[1];
    const damageRatio = b.level / b.maxLevel;

    // Dark glass panel — gets a touch more opaque as it takes damage, so
    // cracks read clearly against it.
    ctx.globalAlpha = 0.1 + 0.14 * (1 - damageRatio);
    ctx.fillStyle = color;
    ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);

    const hits = b.maxLevel - b.level;
    if (hits > 0) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
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
      ctx.shadowBlur = 24;
      ctx.shadowColor = color;
      ctx.globalAlpha = Math.min(1, b.flash * 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
      ctx.restore();
    }

    // Glowing neon edge — brighter and thicker while healthy, dims as it
    // gets chipped away, so toughness reads at a glance.
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.55 * damageRatio;
    ctx.shadowBlur = 7;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3);
    ctx.restore();
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
  ctx.shadowColor = 'rgba(255,45,149,0.7)';
  for (let i = 0; i < trail.length; i++) {
    const t = trail[i];
    const ratio = (i + 1) / trail.length;
    ctx.beginPath();
    ctx.arc(t.x, t.y, state.ball.radius * (0.3 + 0.5 * ratio), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,45,149,${ratio * 0.3})`;
    ctx.fill();
  }
  ctx.restore();
}

function drawBall(ctx: CanvasRenderingContext2D, state: GameState) {
  const b = state.ball;
  const gradient = ctx.createRadialGradient(b.x - 3, b.y - 3, 1, b.x, b.y, b.radius);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.4, '#d9fbff');
  gradient.addColorStop(0.75, '#2ee6ff');
  gradient.addColorStop(1, '#ff2d95');

  ctx.save();
  ctx.shadowBlur = 18;
  ctx.shadowColor = 'rgba(196,79,255,0.95)';
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();

  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.stroke();
}

function drawAimLine(ctx: CanvasRenderingContext2D, state: GameState, angle: number) {
  const b = state.ball;
  const len = 170;
  const tipX = b.x + Math.cos(angle) * len;
  const tipY = b.y + Math.sin(angle) * len;

  ctx.save();
  ctx.strokeStyle = '#2ee6ff';
  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(46,230,255,0.8)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(tipX, tipY, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ff2d95';
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
    const color = s.combo > 1 ? '#ffb84d' : '#eafcff';
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
  vignette.addColorStop(1, 'rgba(8,4,16,0.6)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, viewW, viewH);
  ctx.restore();
}
