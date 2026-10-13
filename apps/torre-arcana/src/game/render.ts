import { GameState } from './types';
import { depthToScreen, View } from './projection';
import { enemySprite, bossSprite } from './sprites';
import { ENEMY_DEFS } from './enemies';
import { runeDef } from './runes';
import { Input } from './input';
import { renderScenery } from './scenery';

const SKY_TOP = '#0a0714';
const SKY_HORIZON = '#2c2050';
const GROUND_FAR = '#211a3e';
const GROUND_NEAR = '#120c1f';
const PATH_LIGHT = 'rgba(124,92,255,0.07)';

let staffAngle = -Math.PI / 2; // eased so the staff doesn't snap between frames

export function render(ctx: CanvasRenderingContext2D, state: GameState, view: View, input: Input): void {
  const w = view.w, h = view.h;
  const horizonY = h * 0.30;

  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }

  // ── Sky, with a faint glow behind the horizon toward the aim lane ──
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

  // Center path, a lighter band so the ground doesn't read as flat void.
  ctx.fillStyle = PATH_LIGHT;
  ctx.beginPath();
  ctx.moveTo(w * 0.5 - w * 0.012, horizonY);
  ctx.lineTo(w * 0.5 + w * 0.012, horizonY);
  ctx.lineTo(w * 0.72, h + 20);
  ctx.lineTo(w * 0.28, h + 20);
  ctx.closePath();
  ctx.fill();

  // Depth guide lines — a cheap but legible cue for how far enemies are.
  ctx.strokeStyle = 'rgba(124,92,255,0.10)';
  ctx.lineWidth = 1;
  for (let d = 0.15; d < 1; d += 0.15) {
    const left = depthToScreen(d, -1, view);
    const right = depthToScreen(d, 1, view);
    ctx.beginPath(); ctx.moveTo(left.x, left.y); ctx.lineTo(right.x, right.y); ctx.stroke();
  }

  // Trees/rocks/ruins framing both edges of the path, so it reads as a cut
  // through a forest instead of an empty void with enemies floating in it.
  renderScenery(ctx, view);

  // ── Lane guide — a soft column from the horizon down, showing exactly
  // where shots are headed, independent of where the thumb physically is. ──
  const laneTop = depthToScreen(0, input.aimLane, view);
  const laneBottom = depthToScreen(1, input.aimLane, view);
  const laneGlow = ctx.createLinearGradient(0, laneTop.y, 0, laneBottom.y);
  laneGlow.addColorStop(0, input.firing ? 'rgba(232,200,104,0.22)' : 'rgba(124,92,255,0.14)');
  laneGlow.addColorStop(1, 'rgba(124,92,255,0)');
  ctx.strokeStyle = laneGlow;
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(laneTop.x, laneTop.y); ctx.lineTo(laneBottom.x, laneBottom.y); ctx.stroke();

  // ── Enemies, far to near so closer ones overlap correctly ──
  // Smoothing on: these are rasterized vector icons, not hand-drawn pixel
  // art, so they should scale with clean antialiasing instead of going blocky.
  const sorted = [...state.enemies].sort((a, b) => a.depth - b.depth);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  for (const e of sorted) {
    const pos = depthToScreen(e.depth, e.lane, view);
    const spr = e.isBoss ? bossSprite(e.flash) : enemySprite(e.kind, e.flash);
    const baseR = e.isBoss ? 34 : ENEMY_DEFS[e.kind].radius;
    const size = baseR * 2 * pos.scale;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4 * pos.scale;
    ctx.drawImage(spr.canvas, Math.round(pos.x - size / 2), Math.round(pos.y - size / 2), size, size);
    ctx.restore();

    if (e.isBoss) {
      const bw = 140, bh = 9;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(pos.x - bw / 2, pos.y - size / 2 - 20, bw, bh);
      ctx.fillStyle = '#ff4a4a';
      ctx.fillRect(pos.x - bw / 2 + 1, pos.y - size / 2 - 19, (bw - 2) * Math.max(0, e.hp / e.maxHp), bh - 2);
    }
  }

  // ── Projectiles — travel through depth/lane space like enemies do, so
  // their screen position (and the trail behind them) comes from the same
  // projection, shrinking into the distance as they near the horizon. A
  // gradient-faded trail plus a glowing-outer/white-hot-core pair reads as a
  // much punchier bolt than a flat dot; each rune gets its own accent shape
  // on top so the four feel distinct at a glance, not just recolored. ──
  for (const p of state.projectiles) {
    const def = runeDef(p.style);
    const pos = depthToScreen(p.depth, p.lane, view);
    const trail = depthToScreen(Math.min(1, p.depth + 0.09), p.lane, view);
    const r = p.radius * pos.scale;

    ctx.save();
    const grad = ctx.createLinearGradient(pos.x, pos.y, trail.x, trail.y);
    grad.addColorStop(0, def.color + 'cc');
    grad.addColorStop(1, def.color + '00');
    ctx.strokeStyle = grad;
    ctx.lineWidth = Math.max(1.5, r * 0.9);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(trail.x, trail.y);
    ctx.stroke();

    ctx.shadowColor = def.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r * 0.75, 0, Math.PI * 2);
    ctx.fill();

    switch (p.style) {
      case 'frost': { // small rotating crystal facet instead of a plain dot
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(p.depth * 6);
        ctx.fillStyle = '#eaf8ff';
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.6); ctx.lineTo(r * 0.45, 0); ctx.lineTo(0, r * 0.6); ctx.lineTo(-r * 0.45, 0);
        ctx.closePath(); ctx.fill();
        ctx.restore();
        break;
      }
      case 'firecore': { // layered warm core, bigger and flickering
        ctx.fillStyle = '#ffe9a8';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      default: { // missiles / chain — a bright white-hot pinpoint core
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // ── Particles ──
  for (const pt of state.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── Tower / mage — fixed at the bottom, staff eases toward the lane ──
  const towerX = w * 0.5, towerY = h * 0.92;
  const targetAng = Math.atan2(laneTop.y - towerY, laneTop.x - towerX);
  let delta = targetAng - staffAngle;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  staffAngle += delta * 0.25;

  ctx.save();
  ctx.translate(towerX, towerY);

  // Soft ground glow beneath the mage.
  const glow = ctx.createRadialGradient(0, 10, 4, 0, 10, 70);
  glow.addColorStop(0, 'rgba(124,92,255,0.25)');
  glow.addColorStop(1, 'rgba(124,92,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.ellipse(0, 14, 70, 20, 0, 0, Math.PI * 2); ctx.fill();

  // Robe, with a lighter front panel for a touch of volume.
  ctx.fillStyle = '#1b1430';
  ctx.beginPath();
  ctx.moveTo(-58, 60); ctx.lineTo(-30, -36); ctx.lineTo(30, -36); ctx.lineTo(58, 60);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(124,92,255,0.12)';
  ctx.beginPath();
  ctx.moveTo(-14, 58); ctx.lineTo(-7, -30); ctx.lineTo(7, -30); ctx.lineTo(14, 58);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#4a3a7a'; ctx.lineWidth = 3; ctx.stroke();

  // Hood + glowing eyes.
  ctx.fillStyle = '#241a3a';
  ctx.beginPath(); ctx.arc(0, -44, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = input.firing ? '#ffd257' : '#7c5cff';
  ctx.beginPath(); ctx.ellipse(-6, -42, 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(6, -42, 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();

  // Staff, eased toward the current lane.
  ctx.save();
  ctx.rotate(staffAngle + Math.PI / 2);
  ctx.strokeStyle = '#5a4a2a'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, -95); ctx.stroke();
  ctx.save();
  ctx.shadowColor = input.firing ? '#ffd257' : '#7c5cff';
  ctx.shadowBlur = 14;
  ctx.fillStyle = input.firing ? '#ffd257' : '#7c5cff';
  ctx.beginPath(); ctx.arc(0, -98, 9, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
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

  // ── Aim marker — sits near the horizon at the chosen lane, never under
  // the player's thumb (which can stay low on the screen). ──
  ctx.strokeStyle = input.firing ? '#ffd257' : '#e8dcff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(laneTop.x, laneTop.y + 14, 12, 0, Math.PI * 2);
  ctx.moveTo(laneTop.x - 18, laneTop.y + 14); ctx.lineTo(laneTop.x - 7, laneTop.y + 14);
  ctx.moveTo(laneTop.x + 7, laneTop.y + 14); ctx.lineTo(laneTop.x + 18, laneTop.y + 14);
  ctx.moveTo(laneTop.x, laneTop.y + 2); ctx.lineTo(laneTop.x, laneTop.y + 9);
  ctx.moveTo(laneTop.x, laneTop.y + 19); ctx.lineTo(laneTop.x, laneTop.y + 26);
  ctx.stroke();

  ctx.restore();
}
