import { GameState } from './types';
import { Input } from './input';
import {
  Sprite, heroSprites, slimeFrames, batFrames, skeletonFrames, gemSprite, boltSprite,
} from './sprites';

export const ART = 3;

// ── Ground tile ──
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

// ── Sprite frame caches ──
let HERO: ReturnType<typeof heroSprites> | null = null;
let SLIME: Sprite[] | null = null;
let BAT: Sprite[] | null = null;
let SKEL: Sprite[] | null = null;
let GEM: Sprite | null = null;
let BOLT: Sprite | null = null;
function ensureSprites() {
  if (!HERO) HERO = heroSprites();
  if (!SLIME) SLIME = slimeFrames();
  if (!BAT) BAT = batFrames();
  if (!SKEL) SKEL = skeletonFrames();
  if (!GEM) GEM = gemSprite();
  if (!BOLT) BOLT = boltSprite();
}

const tintCache: Record<string, HTMLCanvasElement> = {};
function tint(spr: Sprite, color: string): HTMLCanvasElement {
  const key = color + ((spr.canvas as any)._id);
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

export function render(ctx: CanvasRenderingContext2D, state: GameState, view: { w: number; h: number }, input: Input): void {
  ensureSprites();
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

  // Ground
  const tile = groundTile();
  const ts = 16 * ART;
  const startX = Math.floor((camX - view.w / 2) / ts) * ts;
  const startY = Math.floor((camY - view.h / 2) / ts) * ts;
  for (let y = startY; y < camY + view.h / 2 + ts; y += ts) {
    for (let x = startX; x < camX + view.w / 2 + ts; x += ts) {
      ctx.drawImage(tile, Math.round(sx(x)), Math.round(sy(y)), ts, ts);
    }
  }

  // Gems — bob + pulse
  for (const g of state.gems) {
    const bob = Math.sin(g.bob) * 2;
    const pulse = 1 + Math.sin(g.bob * 1.6) * 0.14;
    drawShadow(ctx, sx(g.x), sy(g.y) + 6, 7, 3);
    drawSprite(ctx, GEM!, sx(g.x), sy(g.y) + bob, false, undefined, pulse);
  }

  // Depth-sorted actors
  interface Drawable { y: number; draw: () => void; }
  const actors: Drawable[] = [];

  for (const e of state.enemies) {
    actors.push({
      y: e.y,
      draw: () => {
        let spr: Sprite;
        let yOff = 0;
        // spawn-in pop
        const grow = e.age < 0.18 ? 0.4 + 0.6 * (e.age / 0.18) : 1;
        if (e.kind === 'slime') {
          // real hop: vertical arc, squished on landing, rounded in the air
          const hop = Math.abs(Math.sin(e.anim * 6));
          yOff = -hop * 8;
          spr = hop < 0.28 ? SLIME![1] : SLIME![0];
        } else if (e.kind === 'bat') {
          spr = BAT![Math.floor(e.anim * 14) % 2];
          yOff = Math.sin(e.bob) * 3;
        } else {
          spr = SKEL![Math.floor(e.anim * 7) % 2];
          yOff = -Math.abs(Math.sin(e.anim * 7)) * 2;   // walk bob
        }
        const shR = e.radius * grow;
        drawShadow(ctx, sx(e.x), sy(e.y) + e.radius * 0.7, shR * (e.kind === 'slime' ? 1 - Math.abs(Math.sin(e.anim * 6)) * 0.3 : 1), e.radius * 0.4 * grow);
        drawSprite(ctx, spr, sx(e.x), sy(e.y) + yOff, e.facingLeft, e.flash > 0 ? '#ffffff' : undefined, grow);
      },
    });
  }
  actors.push({
    y: p.y,
    draw: () => {
      const H = HERO!;
      const set = p.faceDir === 'up' ? H.up : p.faceDir === 'side' ? H.side : H.down;
      let spr: Sprite;
      let yBob = 0, rx = 0, ry = 0;
      if (p.attackAnim > 0) {
        spr = set.attack;
        const k = p.attackAnim / 0.16;        // recoil kick opposite the aim
        rx = -p.aimX * 3 * k; ry = -p.aimY * 3 * k;
      } else if (p.moving) {
        spr = set.walk[Math.floor(p.animTime * 9) % 4];
        yBob = -Math.abs(Math.sin(p.animTime * 9)) * 2;   // bouncy walk
      } else {
        spr = set.idle;
        yBob = Math.sin(p.bob) * 1.2;
      }
      const flip = p.faceDir === 'side' && p.facingLeft;
      drawShadow(ctx, sx(p.x), sy(p.y) + p.radius, p.radius * 1.1, p.radius * 0.45);
      const flash = p.hurtFlash > 0 && Math.floor(p.hurtFlash * 20) % 2 === 0 ? '#ff5a4a'
        : (p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0 ? '#ffffff88' : undefined);
      drawSprite(ctx, spr, sx(p.x) + rx, sy(p.y) + yBob + ry, flip, flash);
    },
  });
  actors.sort((a, b) => a.y - b.y);
  for (const a of actors) a.draw();

  // Bolts
  for (const b of state.bolts) {
    ctx.save();
    ctx.shadowBlur = 8; ctx.shadowColor = '#ffd257';
    drawSprite(ctx, BOLT!, sx(b.x), sy(b.y), false);
    ctx.restore();
  }

  // Particles
  for (const pt of state.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    const s = pt.size * ART * 0.6;
    ctx.fillRect(Math.round(sx(pt.x) - s / 2), Math.round(sy(pt.y) - s / 2), s, s);
  }
  ctx.globalAlpha = 1;

  // Damage numbers
  ctx.textAlign = 'center';
  for (const d of state.damageNumbers) {
    ctx.globalAlpha = Math.min(1, d.life * 2);
    ctx.font = `900 ${d.crit ? 20 : 14}px system-ui, sans-serif`;
    ctx.fillStyle = d.crit ? '#ffd257' : '#ffffff';
    ctx.strokeStyle = '#140f1c'; ctx.lineWidth = 3;
    const txt = String(d.value) + (d.crit ? '!' : '');
    ctx.strokeText(txt, sx(d.x), sy(d.y));
    ctx.fillText(txt, sx(d.x), sy(d.y));
  }
  ctx.globalAlpha = 1;

  // Joysticks
  if (state.phase === 'playing') drawJoysticks(ctx, input);
}

function drawJoysticks(ctx: CanvasRenderingContext2D, input: Input): void {
  const draw = (ox: number, oy: number, kx: number, ky: number, color: string) => {
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath(); ctx.arc(ox, oy, input.maxR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(ox + kx, oy + ky, 22, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
  if (input.move.active) draw(input.move.ox, input.move.oy, input.move.kx, input.move.ky, '#38bdf8');
  if (input.aim.active) draw(input.aim.ox, input.aim.oy, input.aim.kx, input.aim.ky, '#f0c04a');
}

function drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSprite(ctx: CanvasRenderingContext2D, spr: Sprite, cx: number, cy: number, flip: boolean, flashColor?: string, scale = 1): void {
  const w = spr.w * ART, h = spr.h * ART;
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(cy));
  if (flip || scale !== 1) ctx.scale(flip ? -scale : scale, scale);
  ctx.drawImage(spr.canvas, Math.round(-w / 2), Math.round(-h / 2), w, h);
  if (flashColor) {
    ctx.globalAlpha = flashColor.length > 7 ? 0.5 : 0.85;
    ctx.drawImage(tint(spr, flashColor.slice(0, 7)), Math.round(-w / 2), Math.round(-h / 2), w, h);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
