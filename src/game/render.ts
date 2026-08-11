import { GameState } from './types';
import {
  Sprite, heroSprite, slimeSprite, batSprite, skeletonSprite, gemSprite, boltSprite,
} from './sprites';

export const ART = 3; // pixels per sprite-pixel

let ground: HTMLCanvasElement | null = null;
function groundTile(): HTMLCanvasElement {
  if (ground) return ground;
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const g = c.getContext('2d')!;
  g.fillStyle = '#2a2438'; g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#221d30';
  g.fillRect(0, 7, 16, 1); g.fillRect(7, 0, 1, 8);
  g.fillRect(3, 8, 1, 8); g.fillRect(11, 8, 1, 8);
  g.fillStyle = '#312a44';
  g.fillRect(1, 1, 5, 5); g.fillRect(9, 1, 5, 5);
  g.fillRect(4, 9, 6, 5); g.fillRect(12, 9, 3, 5);
  g.fillStyle = '#3a3350';
  g.fillRect(1, 1, 5, 1); g.fillRect(9, 1, 5, 1); g.fillRect(4, 9, 6, 1);
  ground = c;
  return c;
}

const tintCache: Record<string, HTMLCanvasElement> = {};
function tint(spr: Sprite, color: string): HTMLCanvasElement {
  const key = color + spr.w + 'x' + spr.h + (spr.canvas as any)._id;
  if (tintCache[key]) return tintCache[key];
  const c = document.createElement('canvas');
  c.width = spr.canvas.width; c.height = spr.canvas.height;
  const g = c.getContext('2d')!;
  g.drawImage(spr.canvas, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  tintCache[key] = c;
  return c;
}

let _sid = 0;
function sid(spr: Sprite): Sprite {
  if (!(spr.canvas as any)._id) (spr.canvas as any)._id = ++_sid;
  return spr;
}

export function render(ctx: CanvasRenderingContext2D, state: GameState, view: { w: number; h: number }): void {
  const p = state.player;
  let camX = p.x, camY = p.y;
  if (state.shake > 0) {
    camX += (Math.random() * 2 - 1) * state.shake;
    camY += (Math.random() * 2 - 1) * state.shake;
  }
  const ox = view.w / 2 - camX;
  const oy = view.h / 2 - camY;
  const sx = (wx: number) => wx + ox;
  const sy = (wy: number) => wy + oy;

  ctx.imageSmoothingEnabled = false;

  // ── Ground ──
  const tile = groundTile();
  const ts = 16 * ART;
  const startX = Math.floor((camX - view.w / 2) / ts) * ts;
  const startY = Math.floor((camY - view.h / 2) / ts) * ts;
  for (let y = startY; y < camY + view.h / 2 + ts; y += ts) {
    for (let x = startX; x < camX + view.w / 2 + ts; x += ts) {
      ctx.drawImage(tile, Math.round(sx(x)), Math.round(sy(y)), ts, ts);
    }
  }

  // ── Gems (on the ground) ──
  const gem = sid(gemSprite());
  for (const g of state.gems) {
    const bob = Math.sin(g.bob) * 2;
    drawShadow(ctx, sx(g.x), sy(g.y) + 6, 7, 3);
    drawSprite(ctx, gem, sx(g.x), sy(g.y) + bob, false);
  }

  // ── Shadows + depth-sorted actors ──
  const hero = sid(heroSprite());
  const sprFor = { slime: sid(slimeSprite()), bat: sid(batSprite()), skeleton: sid(skeletonSprite()) };

  interface Drawable { y: number; draw: () => void; }
  const actors: Drawable[] = [];

  for (const e of state.enemies) {
    actors.push({
      y: e.y,
      draw: () => {
        const bob = e.kind === 'bat' ? Math.sin(e.bob) * 3 : Math.sin(e.bob) * 1;
        drawShadow(ctx, sx(e.x), sy(e.y) + e.radius * 0.7, e.radius, e.radius * 0.4);
        drawSprite(ctx, sprFor[e.kind], sx(e.x), sy(e.y) + bob, e.facingLeft, e.flash > 0 ? '#ffffff' : undefined);
      },
    });
  }
  actors.push({
    y: p.y,
    draw: () => {
      const bob = Math.sin(p.bob) * 1.5;
      drawShadow(ctx, sx(p.x), sy(p.y) + p.radius, p.radius * 1.1, p.radius * 0.45);
      const flash = p.hurtFlash > 0 && Math.floor(p.hurtFlash * 20) % 2 === 0 ? '#ff5a4a'
        : (p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0 ? '#ffffff88' : undefined);
      drawSprite(ctx, hero, sx(p.x), sy(p.y) + bob, p.facingLeft, flash);
    },
  });
  actors.sort((a, b) => a.y - b.y);
  for (const a of actors) a.draw();

  // ── Bolts (with glow) ──
  const bolt = sid(boltSprite());
  for (const b of state.bolts) {
    ctx.save();
    ctx.shadowBlur = 8; ctx.shadowColor = '#ffd257';
    drawSprite(ctx, bolt, sx(b.x), sy(b.y), false);
    ctx.restore();
  }

  // ── Particles ──
  for (const pt of state.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    const s = pt.size * ART * 0.6;
    ctx.fillRect(Math.round(sx(pt.x) - s / 2), Math.round(sy(pt.y) - s / 2), s, s);
  }
  ctx.globalAlpha = 1;

  // ── Damage numbers ──
  ctx.textAlign = 'center';
  for (const d of state.damageNumbers) {
    ctx.globalAlpha = Math.min(1, d.life * 2);
    ctx.font = `900 ${d.crit ? 20 : 14}px system-ui, sans-serif`;
    ctx.fillStyle = d.crit ? '#ffd257' : '#ffffff';
    ctx.strokeStyle = '#140f1c';
    ctx.lineWidth = 3;
    const txt = String(d.value) + (d.crit ? '!' : '');
    ctx.strokeText(txt, sx(d.x), sy(d.y));
    ctx.fillText(txt, sx(d.x), sy(d.y));
  }
  ctx.globalAlpha = 1;
}

function drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSprite(
  ctx: CanvasRenderingContext2D, spr: Sprite, cx: number, cy: number, flip: boolean, flashColor?: string,
): void {
  const w = spr.w * ART, h = spr.h * ART;
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(cy));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(spr.canvas, Math.round(-w / 2), Math.round(-h / 2), w, h);
  if (flashColor) {
    ctx.globalAlpha = flashColor.length > 7 ? 0.5 : 0.85;
    ctx.drawImage(tint(spr, flashColor.slice(0, 7)), Math.round(-w / 2), Math.round(-h / 2), w, h);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
