import { GameState, BIOMES, ORBIT_RADIUS, ZOOM } from './types';
import { Input } from './input';
import {
  Sprite, heroSprites, slimeFrames, batFrames, skeletonFrames, gemSprite, boltSprite, bossSprite,
  fireballSprite, arrowSprite, skullOrbSprite,
} from './sprites';

// Sprite pixels -> screen px. Kept an integer so pixel art stays crisp.
export const ART = 2;
export { ZOOM };
const TILE_WORLD = 48;                     // world units per ground tile
const TILE_SCREEN = TILE_WORLD * ZOOM;     // exactly 32 px

// ── Ground tile per biome (cached by floor) ──
const groundCache: Record<number, HTMLCanvasElement> = {};
function groundTile(floor: number): HTMLCanvasElement {
  const key = Math.min(floor, BIOMES.length) - 1;
  if (groundCache[key]) return groundCache[key];
  const bi = BIOMES[key];
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const g = c.getContext('2d')!;
  g.fillStyle = bi.ground; g.fillRect(0, 0, 16, 16);
  g.fillStyle = bi.seam;
  g.fillRect(0, 7, 16, 1); g.fillRect(7, 0, 1, 8);
  g.fillRect(3, 8, 1, 8); g.fillRect(11, 8, 1, 8);
  g.fillStyle = bi.hi1;
  g.fillRect(1, 1, 5, 5); g.fillRect(9, 1, 5, 5);
  g.fillRect(4, 9, 6, 5); g.fillRect(12, 9, 3, 5);
  g.fillStyle = bi.hi2;
  g.fillRect(1, 1, 5, 1); g.fillRect(9, 1, 5, 1); g.fillRect(4, 9, 6, 1);
  groundCache[key] = c;
  return c;
}

// ── Sprite frame caches ──
const HEROES: Record<string, ReturnType<typeof heroSprites>> = {};
let SLIME: Sprite[] | null = null;
let BAT: Sprite[] | null = null;
let SKEL: Sprite[] | null = null;
let GEM: Sprite | null = null;
let BOLT: Sprite | null = null;
let BOSS: Sprite | null = null;
let FIRE: Sprite | null = null;
let ARROW: Sprite | null = null;
let SKULL: Sprite | null = null;
function ensureSprites(cls: string) {
  if (!HEROES[cls]) HEROES[cls] = heroSprites(cls);
  if (!SLIME) SLIME = slimeFrames();
  if (!BAT) BAT = batFrames();
  if (!SKEL) SKEL = skeletonFrames();
  if (!GEM) GEM = gemSprite();
  if (!BOLT) BOLT = boltSprite();
  if (!BOSS) BOSS = bossSprite();
  if (!FIRE) FIRE = fireballSprite();
  if (!ARROW) ARROW = arrowSprite();
  if (!SKULL) SKULL = skullOrbSprite();
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
  const p = state.player;
  ensureSprites(p.classId);
  let camX = p.x, camY = p.y;
  if (state.shake > 0) {
    camX += (Math.random() * 2 - 1) * state.shake;
    camY += (Math.random() * 2 - 1) * state.shake;
  }
  // World -> screen (camera centered on the hero, zoomed out by ZOOM)
  const sx = (wx: number) => (wx - camX) * ZOOM + view.w / 2;
  const sy = (wy: number) => (wy - camY) * ZOOM + view.h / 2;

  ctx.imageSmoothingEnabled = false;

  // Ground — iterate the world rectangle the (zoomed-out) view covers
  const tile = groundTile(state.floor);
  const halfW = view.w / 2 / ZOOM, halfH = view.h / 2 / ZOOM;
  const startX = Math.floor((camX - halfW) / TILE_WORLD) * TILE_WORLD;
  const startY = Math.floor((camY - halfH) / TILE_WORLD) * TILE_WORLD;
  for (let y = startY; y < camY + halfH + TILE_WORLD; y += TILE_WORLD) {
    for (let x = startX; x < camX + halfW + TILE_WORLD; x += TILE_WORLD) {
      ctx.drawImage(tile, Math.round(sx(x)), Math.round(sy(y)), TILE_SCREEN + 1, TILE_SCREEN + 1);
    }
  }

  // Stairway portal (drawn on the ground so the hero can stand over it)
  if (state.floorPhase === 'cleared' && state.stair) {
    const t = performance.now() / 1000;
    const px = sx(state.stair.x), py = sy(state.stair.y);
    for (let r = 3; r >= 0; r--) {
      const rad = 10 + r * 7 + Math.sin(t * 3 - r) * 2;
      ctx.strokeStyle = `rgba(120,220,255,${0.5 - r * 0.1})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(120,220,255,0.25)';
    ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bdeaff';
    ctx.font = '900 16px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('▼', px, py + 6);
  }

  // Gems — bob + pulse
  for (const g of state.gems) {
    const bob = Math.sin(g.bob) * 2;
    const pulse = 1 + Math.sin(g.bob * 1.6) * 0.14;
    drawShadow(ctx, sx(g.x), sy(g.y) + 5, 6, 2.5);
    drawSprite(ctx, GEM!, sx(g.x), sy(g.y) + bob, false, undefined, pulse);
  }

  // Melee swing arcs
  for (const s of state.swings) {
    const k = s.life / s.maxLife;                 // 1 -> 0
    const sweep = s.arc * (0.35 + 0.65 * (1 - k)); // arc opens as it swings
    ctx.save();
    ctx.globalAlpha = Math.min(1, k * 1.4);
    ctx.strokeStyle = '#e8f1ff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(sx(s.x), sy(s.y), s.radius * ZOOM, s.ang - sweep / 2, s.ang + sweep / 2);
    ctx.stroke();
    ctx.globalAlpha *= 0.45;
    ctx.strokeStyle = '#7fb0e0';
    ctx.lineWidth = 12;
    ctx.stroke();
    ctx.restore();
  }

  // Depth-sorted actors
  interface Drawable { y: number; draw: () => void; }
  const actors: Drawable[] = [];

  for (const e of state.enemies) {
    if (e.isBoss) {
      actors.push({
        y: e.y,
        draw: () => {
          const grow = e.age < 0.3 ? 0.5 + 0.5 * (e.age / 0.3) : 1;
          const breathe = 1 + Math.sin(e.bob * 0.6) * 0.03;
          drawShadow(ctx, sx(e.x), sy(e.y) + e.radius * 0.8 * ZOOM, e.radius * 1.2 * ZOOM, e.radius * 0.5 * ZOOM);
          drawSprite(ctx, BOSS!, sx(e.x), sy(e.y) - 4, e.facingLeft, e.flash > 0 ? '#ffffff' : undefined, grow * breathe);
        },
      });
      continue;
    }
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
        drawShadow(ctx, sx(e.x), sy(e.y) + e.radius * 0.7 * ZOOM, shR * ZOOM * (e.kind === 'slime' ? 1 - Math.abs(Math.sin(e.anim * 6)) * 0.3 : 1), e.radius * 0.4 * grow * ZOOM);
        drawSprite(ctx, spr, sx(e.x), sy(e.y) + yOff, e.facingLeft, e.flash > 0 ? '#ffffff' : undefined, grow);
      },
    });
  }
  actors.push({
    y: p.y,
    draw: () => {
      const H = HEROES[p.classId];
      let spr: Sprite;
      let yBob = 0, rx = 0, ry = 0;
      if (p.attackAnim > 0) {
        spr = H.attack;
        const k = p.attackAnim / 0.16;        // recoil kick opposite the aim
        rx = -p.aimX * 3 * k; ry = -p.aimY * 3 * k;
      } else if (p.moving) {
        spr = H.walk[Math.floor(p.animTime * 9) % 4];
        yBob = -Math.abs(Math.sin(p.animTime * 9)) * 2;   // bouncy walk
      } else {
        spr = H.idle;
        yBob = Math.sin(p.bob) * 1.2;
      }
      drawShadow(ctx, sx(p.x), sy(p.y) + p.radius * ZOOM, p.radius * 1.1 * ZOOM, p.radius * 0.45 * ZOOM);
      const flash = p.hurtFlash > 0 && Math.floor(p.hurtFlash * 20) % 2 === 0 ? '#ff5a4a'
        : (p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0 ? '#ffffff88' : undefined);
      drawSprite(ctx, spr, sx(p.x) + rx, sy(p.y) + yBob + ry, p.facingLeft, flash);
    },
  });
  actors.sort((a, b) => a.y - b.y);
  for (const a of actors) a.draw();

  // Orbiting skulls (Necromancer)
  if (p.weapon === 'orbit') {
    const orbs = p.stats.boltCount;
    for (let i = 0; i < orbs; i++) {
      const a = p.orbAngle + (i / orbs) * Math.PI * 2;
      const ox = p.x + Math.cos(a) * ORBIT_RADIUS;
      const oy = p.y + Math.sin(a) * ORBIT_RADIUS;
      ctx.save();
      ctx.shadowBlur = 10; ctx.shadowColor = '#9be86f';
      drawSprite(ctx, SKULL!, sx(ox), sy(oy), false);
      ctx.restore();
    }
  }

  // Bolts — fireballs spin, arrows point along their flight
  for (const b of state.bolts) {
    ctx.save();
    if (b.style === 'fire') {
      ctx.shadowBlur = 12; ctx.shadowColor = '#ff7a2a';
      drawSprite(ctx, FIRE!, sx(b.x), sy(b.y), false);
    } else if (b.style === 'arrow') {
      ctx.translate(sx(b.x), sy(b.y));
      ctx.rotate(b.rot);
      const w = ARROW!.w * ART, h = ARROW!.h * ART;
      ctx.drawImage(ARROW!.canvas, Math.round(-w / 2), Math.round(-h / 2), w, h);
    } else {
      ctx.shadowBlur = 8; ctx.shadowColor = '#ffd257';
      drawSprite(ctx, BOLT!, sx(b.x), sy(b.y), false);
    }
    ctx.restore();
  }

  // Hazards (boss projectiles) — glowing red orbs
  for (const h of state.hazards) {
    ctx.save();
    ctx.shadowBlur = 10; ctx.shadowColor = '#ff5a4a';
    ctx.fillStyle = '#ff7a5a';
    ctx.beginPath(); ctx.arc(sx(h.x), sy(h.y), h.radius * ZOOM + 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe0d0';
    ctx.beginPath(); ctx.arc(sx(h.x), sy(h.y), h.radius * 0.45 * ZOOM + 1, 0, Math.PI * 2); ctx.fill();
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
