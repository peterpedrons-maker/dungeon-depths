import { GameState, BIOMES, ORBIT_RADIUS, ZOOM, Enemy } from './types';
import { Input } from './input';
import { STAGES } from './stages';
import {
  Sprite, heroSprites, slimeFrames, batFrames, skeletonFrames, gemSprite, boltSprite, bossSprite,
  fireballSprite, arrowSprite, skullOrbSprite, slashSprite,
  runnerFrames, bruteFrames, casterFrames, spiderFrames, ghostFrames,
} from './sprites';

export const ART = 2;
export { ZOOM };
const TILE_WORLD = 48;
const TILE_SCREEN = TILE_WORLD * ZOOM;

// ── Ground tile per biome ──
const groundCache: Record<number, HTMLCanvasElement> = {};
function groundTile(biome: number): HTMLCanvasElement {
  const key = Math.min(Math.max(biome, 0), BIOMES.length - 1);
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

// ── Sprite caches ──
const HEROES: Record<string, ReturnType<typeof heroSprites>> = {};
const S: Record<string, Sprite[] | Sprite> = {};
function ensureSprites(cls: string) {
  if (!HEROES[cls]) HEROES[cls] = heroSprites(cls);
  if (!S.slime) {
    S.slime = slimeFrames(); S.bat = batFrames(); S.skeleton = skeletonFrames();
    S.runner = runnerFrames(); S.brute = bruteFrames(); S.caster = casterFrames();
    S.spider = spiderFrames(); S.ghost = ghostFrames();
    S.gem = gemSprite(); S.bolt = boltSprite(); S.boss = bossSprite();
    S.fire = fireballSprite(); S.arrow = arrowSprite(); S.skull = skullOrbSprite();
    S.slash = slashSprite();
  }
}
const arr = (k: string) => S[k] as Sprite[];
const one = (k: string) => S[k] as Sprite;

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

  // On the menus there is no live arena — paint a plain backdrop so the hero
  // sprite doesn't poke through the overlay.
  if (state.phase === 'title' || state.phase === 'stageSelect' || state.phase === 'classSelect') {
    ctx.fillStyle = '#141024';
    ctx.fillRect(0, 0, view.w, view.h);
    return;
  }

  let camX = p.x, camY = p.y;
  if (state.shake > 0) {
    camX += (Math.random() * 2 - 1) * state.shake;
    camY += (Math.random() * 2 - 1) * state.shake;
  }
  const sx = (wx: number) => (wx - camX) * ZOOM + view.w / 2;
  const sy = (wy: number) => (wy - camY) * ZOOM + view.h / 2;

  ctx.imageSmoothingEnabled = false;

  // Ground
  const tile = groundTile(STAGES[state.stageIndex].biome);
  const halfW = view.w / 2 / ZOOM, halfH = view.h / 2 / ZOOM;
  const startX = Math.floor((camX - halfW) / TILE_WORLD) * TILE_WORLD;
  const startY = Math.floor((camY - halfH) / TILE_WORLD) * TILE_WORLD;
  for (let y = startY; y < camY + halfH + TILE_WORLD; y += TILE_WORLD) {
    for (let x = startX; x < camX + halfW + TILE_WORLD; x += TILE_WORLD) {
      ctx.drawImage(tile, Math.round(sx(x)), Math.round(sy(y)), TILE_SCREEN + 1, TILE_SCREEN + 1);
    }
  }

  // Boss telegraph markers (drawn on the ground)
  for (const e of state.enemies) {
    if (e.isBoss && e.bstate === 'telegraph') drawBossTelegraph(ctx, e, sx, sy);
  }

  // Gems
  for (const g of state.gems) {
    const bob = Math.sin(g.bob) * 2;
    const pulse = 1 + Math.sin(g.bob * 1.6) * 0.14;
    drawShadow(ctx, sx(g.x), sy(g.y) + 5, 6, 2.5);
    drawSprite(ctx, one('gem'), sx(g.x), sy(g.y) + bob, false, undefined, pulse);
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
          const bs = 1.6 * grow * breathe;
          drawShadow(ctx, sx(e.x), sy(e.y) + e.radius * 0.8 * ZOOM, e.radius * 1.3 * ZOOM, e.radius * 0.55 * ZOOM);
          const flash = e.flash > 0 ? '#ffffff' : (e.phase2 ? '#ff8a7a' : undefined);
          drawSprite(ctx, one('boss'), sx(e.x), sy(e.y) - 6, e.facingLeft, flash, bs);
        },
      });
      continue;
    }
    actors.push({ y: e.y, draw: () => drawEnemy(ctx, e, sx, sy) });
  }
  actors.push({
    y: p.y,
    draw: () => {
      const H = HEROES[p.classId];
      let spr: Sprite;
      let yBob = 0, rx = 0, ry = 0;
      if (p.attackAnim > 0) {
        spr = H.attack;
        const k = p.attackAnim / 0.16;
        rx = -p.aimX * 3 * k; ry = -p.aimY * 3 * k;
      } else if (p.moving) {
        spr = H.walk[Math.floor(p.animTime * 9) % 4];
        yBob = -Math.abs(Math.sin(p.animTime * 9)) * 2;
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

  // Orbiting skulls
  if (p.weapon === 'orbit') {
    const orbs = p.stats.boltCount;
    for (let i = 0; i < orbs; i++) {
      const a = p.orbAngle + (i / orbs) * Math.PI * 2;
      const ox = p.x + Math.cos(a) * ORBIT_RADIUS;
      const oy = p.y + Math.sin(a) * ORBIT_RADIUS;
      ctx.save();
      ctx.shadowBlur = 10; ctx.shadowColor = '#9be86f';
      drawSprite(ctx, one('skull'), sx(ox), sy(oy), false);
      ctx.restore();
    }
  }

  // Bolts (player projectiles)
  for (const b of state.bolts) {
    if (b.style === 'slash') {
      drawSlash(ctx, b, sx(p.x), sy(p.y));
      continue;
    }
    ctx.save();
    if (b.style === 'fire') {
      streak(ctx, b, sx, sy, 22, '#ff7a2a');
      // pulsing fire core with a strong glow
      const px = sx(b.x), py = sy(b.y);
      ctx.shadowBlur = 16; ctx.shadowColor = '#ff5a1a';
      ctx.fillStyle = 'rgba(255,120,40,0.35)';
      ctx.beginPath(); ctx.arc(px, py, 12 + Math.sin(performance.now() / 40) * 2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 12; ctx.shadowColor = '#ff9d3a';
      drawSprite(ctx, one('fire'), px, py, false);
    } else if (b.style === 'arrow') {
      streak(ctx, b, sx, sy, 20, 'rgba(220,235,255,0.9)');
      ctx.translate(sx(b.x), sy(b.y));
      ctx.rotate(b.rot);
      ctx.shadowBlur = 6; ctx.shadowColor = '#dfe6ee';
      const a = one('arrow');
      const w = a.w * ART, h = a.h * ART;
      ctx.drawImage(a.canvas, Math.round(-w / 2), Math.round(-h / 2), w, h);
    } else {
      streak(ctx, b, sx, sy, 16, '#ffd257');
      ctx.shadowBlur = 12; ctx.shadowColor = '#ffd257';
      drawSprite(ctx, one('bolt'), sx(b.x), sy(b.y), false);
    }
    ctx.restore();
  }

  // Hazards (enemy/boss projectiles)
  for (const h of state.hazards) {
    const col = h.color ?? '#ff7a5a';
    ctx.save();
    if (h.telegraph && h.telegraph > 0) {
      ctx.globalAlpha = 0.4 + Math.sin(performance.now() / 60) * 0.2;
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx(h.x), sy(h.y), h.radius * ZOOM + 3, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.shadowBlur = 10; ctx.shadowColor = col;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(sx(h.x), sy(h.y), h.radius * ZOOM + 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(sx(h.x), sy(h.y), h.radius * 0.4 * ZOOM + 1, 0, Math.PI * 2); ctx.fill();
    }
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

  if (state.phase === 'playing') drawJoysticks(ctx, input);
}

// ── Per-kind enemy rendering ──
function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, sx: (n: number) => number, sy: (n: number) => number): void {
  const grow = e.age < 0.18 ? 0.4 + 0.6 * (e.age / 0.18) : 1;
  let spr: Sprite;
  let yOff = 0, scale = grow, alpha = 1;

  switch (e.kind) {
    case 'slime': case 'bigSlime': {
      const hop = Math.abs(Math.sin(e.anim * 6));
      yOff = -hop * 8;
      spr = arr('slime')[hop < 0.28 ? 1 : 0];
      scale = grow * (e.kind === 'bigSlime' ? 1.5 : 1);
      break;
    }
    case 'bat':
      spr = arr('bat')[Math.floor(e.anim * 14) % 2]; yOff = Math.sin(e.bob) * 3; break;
    case 'skeleton':
      spr = arr('skeleton')[Math.floor(e.anim * 7) % 2]; yOff = -Math.abs(Math.sin(e.anim * 7)) * 2; break;
    case 'runner':
      spr = arr('runner')[Math.floor(e.anim * 12) % 2]; yOff = -Math.abs(Math.sin(e.anim * 12)) * 2; break;
    case 'brute':
      spr = arr('brute')[Math.floor(e.anim * 4) % 2]; yOff = -Math.abs(Math.sin(e.anim * 4)) * 2; break;
    case 'caster':
      spr = arr('caster')[e.atkCd < 0.6 ? 1 : 0]; yOff = Math.sin(e.bob) * 2; break;
    case 'spider':
      spr = arr('spider')[Math.floor(e.anim * 12) % 2]; yOff = -Math.abs(Math.sin(e.anim * 12)) * 1.5; break;
    case 'ghost':
      spr = arr('ghost')[Math.floor(e.anim * 4) % 2]; yOff = Math.sin(e.bob) * 4; alpha = 0.72; break;
    default:
      spr = arr('slime')[0];
  }

  const shR = e.radius * grow;
  drawShadow(ctx, sx(e.x), sy(e.y) + e.radius * 0.7 * ZOOM,
    shR * ZOOM * (e.kind === 'slime' || e.kind === 'bigSlime' ? 1 - Math.abs(Math.sin(e.anim * 6)) * 0.3 : 1),
    e.radius * 0.4 * grow * ZOOM);
  if (alpha < 1) ctx.globalAlpha = alpha;
  drawSprite(ctx, spr, sx(e.x), sy(e.y) + yOff, e.facingLeft, e.flash > 0 ? '#ffffff' : undefined, scale);
  if (alpha < 1) ctx.globalAlpha = 1;
}

function drawBossTelegraph(ctx: CanvasRenderingContext2D, e: Enemy, sx: (n: number) => number, sy: (n: number) => number): void {
  const bx = sx(e.x), by = sy(e.y);
  const pulse = 0.35 + Math.abs(Math.sin(performance.now() / 90)) * 0.4;
  ctx.save();
  ctx.globalAlpha = pulse;
  if (e.bnext === 'charge') {
    // aim line toward where the boss faces the player
    const dir = e.facingLeft ? -1 : 1;
    ctx.strokeStyle = '#ff4a4a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + dir * 240, by); ctx.stroke();
  } else if (e.bnext === 'summon') {
    ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(bx, by, 60, 0, Math.PI * 2); ctx.stroke();
  } else {
    // burst / slam / volley → expanding ring warning
    ctx.strokeStyle = e.bnext === 'volley' ? '#ffb020' : '#ff5a4a';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(bx, by, 40 + pulse * 30, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
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

// A sword swing: a bright arc swept around the hero, tapering to a blade tip.
function drawSlash(ctx: CanvasRenderingContext2D, b: import('./types').Bolt, px: number, py: number): void {
  const k = Math.max(0, b.life / b.maxLife);         // 1 -> 0
  const R = (b.reach ?? 0) * ZOOM;
  const dir = Math.sign(b.angVel ?? 1) || 1;
  const trail = 1.3;
  const a2 = b.ang ?? 0;                              // leading edge
  const a1 = a2 - dir * trail;                        // trailing edge
  const lo = Math.min(a1, a2), hi = Math.max(a1, a2);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.globalAlpha = Math.min(1, k * 1.8);
  // outer glow
  ctx.strokeStyle = 'rgba(150,195,255,0.28)'; ctx.lineWidth = 22;
  ctx.beginPath(); ctx.arc(px, py, R, lo, hi); ctx.stroke();
  // mid body
  ctx.strokeStyle = 'rgba(205,228,255,0.75)'; ctx.lineWidth = 11;
  ctx.beginPath(); ctx.arc(px, py, R, lo, hi); ctx.stroke();
  // bright leading edge
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5;
  const cLo = dir > 0 ? a2 - 0.55 : a2;
  const cHi = dir > 0 ? a2 : a2 + 0.55;
  ctx.beginPath(); ctx.arc(px, py, R, cLo, cHi); ctx.stroke();
  // blade glint at the tip
  ctx.shadowBlur = 10; ctx.shadowColor = '#bcd6ff';
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(px + Math.cos(a2) * R, py + Math.sin(a2) * R, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// A fading motion tail drawn behind a flying projectile.
function streak(ctx: CanvasRenderingContext2D, b: import('./types').Bolt, sx: (n: number) => number, sy: (n: number) => number, len: number, color: string): void {
  const bl = Math.hypot(b.vx, b.vy) || 1;
  const tx = b.vx / bl, ty = b.vy / bl;
  const x2 = sx(b.x), y2 = sy(b.y);
  const x1 = x2 - tx * len, y1 = y2 - ty * len;
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, color);
  ctx.strokeStyle = grad; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
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
