import { GameState } from './types';
import { depthToScreen, View } from './projection';
import { enemySprite, bossSprite } from './sprites';
import { ENEMY_DEFS } from './enemies';
import { runeDef } from './runes';
import { Input } from './input';

const SKY_TOP = '#0a0714';
const SKY_HORIZON = '#241a3a';
const GROUND_FAR = '#1d1530';
const GROUND_NEAR = '#140f20';

export function render(ctx: CanvasRenderingContext2D, state: GameState, view: View, input: Input): void {
  const w = view.w, h = view.h;
  const horizonY = h * 0.30;

  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }

  // ── Sky ──
  const sky = ctx.createLinearGradient(0, 0, 0, horizonY);
  sky.addColorStop(0, SKY_TOP);
  sky.addColorStop(1, SKY_HORIZON);
  ctx.fillStyle = sky;
  ctx.fillRect(-20, -20, w + 40, horizonY + 20);

  // ── Ground (trapezoid, narrow at the horizon, wide at the camera) ──
  const ground = ctx.createLinearGradient(0, horizonY, 0, h);
  ground.addColorStop(0, GROUND_FAR);
  ground.addColorStop(1, GROUND_NEAR);
  ctx.fillStyle = ground;
  ctx.beginPath();
  ctx.moveTo(w * 0.5 - w * 0.03, horizonY);
  ctx.lineTo(w * 0.5 + w * 0.03, horizonY);
  ctx.lineTo(w * 1.3, h + 20);
  ctx.lineTo(-w * 0.3, h + 20);
  ctx.closePath();
  ctx.fill();

  // Depth guide lines — a cheap but legible cue for how far enemies are.
  ctx.strokeStyle = 'rgba(124,92,255,0.12)';
  ctx.lineWidth = 1;
  for (let d = 0.15; d < 1; d += 0.15) {
    const left = depthToScreen(d, -1, view);
    const right = depthToScreen(d, 1, view);
    ctx.beginPath(); ctx.moveTo(left.x, left.y); ctx.lineTo(right.x, right.y); ctx.stroke();
  }

  // ── Enemies, far to near so closer ones overlap correctly ──
  const sorted = [...state.enemies].sort((a, b) => a.depth - b.depth);
  ctx.imageSmoothingEnabled = false;
  for (const e of sorted) {
    const pos = depthToScreen(e.depth, e.lane, view);
    const spr = e.isBoss ? bossSprite(e.flash) : enemySprite(e.kind, e.flash);
    const baseR = e.isBoss ? 34 : ENEMY_DEFS[e.kind].radius;
    const size = baseR * 2 * pos.scale;
    ctx.drawImage(spr.canvas, Math.round(pos.x - size / 2), Math.round(pos.y - size / 2), size, size);

    if (e.isBoss) {
      const bw = 140, bh = 9;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(pos.x - bw / 2, pos.y - size / 2 - 20, bw, bh);
      ctx.fillStyle = '#ff4a4a';
      ctx.fillRect(pos.x - bw / 2 + 1, pos.y - size / 2 - 19, (bw - 2) * Math.max(0, e.hp / e.maxHp), bh - 2);
    }
  }

  // ── Projectiles ──
  for (const p of state.projectiles) {
    const def = runeDef(p.style);
    const m = Math.hypot(p.vx, p.vy) || 1;
    ctx.strokeStyle = def.color + 'aa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - (p.vx / m) * 14, p.y - (p.vy / m) * 14);
    ctx.stroke();
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Particles ──
  for (const pt of state.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── Tower / mage — fixed at the bottom, staff rotates toward the reticle ──
  const towerX = w * 0.5, towerY = h * 0.92;
  const aimAng = Math.atan2(input.y - towerY, input.x - towerX);
  ctx.save();
  ctx.translate(towerX, towerY);
  ctx.fillStyle = '#1b1430';
  ctx.beginPath();
  ctx.moveTo(-58, 60); ctx.lineTo(-30, -36); ctx.lineTo(30, -36); ctx.lineTo(58, 60);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#4a3a7a'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#241a3a';
  ctx.beginPath(); ctx.arc(0, -44, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7c5cff';
  ctx.beginPath(); ctx.ellipse(0, -42, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.rotate(aimAng + Math.PI / 2);
  ctx.strokeStyle = '#5a4a2a'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, -95); ctx.stroke();
  ctx.fillStyle = input.firing ? '#e8c868' : '#7c5cff';
  ctx.beginPath(); ctx.arc(0, -98, 9, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.restore();

  // ── Damage numbers ──
  ctx.textAlign = 'center';
  for (const d of state.damageNumbers) {
    ctx.globalAlpha = Math.max(0, Math.min(1, d.life / 0.7));
    ctx.font = d.crit ? 'bold 22px sans-serif' : 'bold 15px sans-serif';
    ctx.fillStyle = d.crit ? '#ffd257' : '#ffffff';
    ctx.fillText(String(d.value), d.x, d.y);
  }
  ctx.globalAlpha = 1;

  // ── Reticle ──
  ctx.strokeStyle = input.firing ? '#ffd257' : '#e8dcff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(input.x, input.y, 14, 0, Math.PI * 2);
  ctx.moveTo(input.x - 20, input.y); ctx.lineTo(input.x - 8, input.y);
  ctx.moveTo(input.x + 8, input.y); ctx.lineTo(input.x + 20, input.y);
  ctx.moveTo(input.x, input.y - 20); ctx.lineTo(input.x, input.y - 8);
  ctx.moveTo(input.x, input.y + 8); ctx.lineTo(input.x, input.y + 20);
  ctx.stroke();

  ctx.restore();
}
