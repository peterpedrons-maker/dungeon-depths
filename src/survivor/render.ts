import { Enemy, GameState, Player, ENEMY_STATS } from './types';

const TILE = 92;

// ── Deterministic per-tile hash so ground detail never shimmers ──
function hash2(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

// ── Cached radial body gradients (created once at origin, reused via translate) ──
const gradCache = new Map<string, CanvasGradient>();
function radial(
  ctx: CanvasRenderingContext2D,
  key: string,
  r: number,
  stops: [number, string][],
  ox = 0,
  oy = 0,
): CanvasGradient {
  const cached = gradCache.get(key);
  if (cached) return cached;
  const g = ctx.createRadialGradient(ox, oy, r * 0.1, 0, 0, r);
  for (const [t, c] of stops) g.addColorStop(t, c);
  gradCache.set(key, g);
  return g;
}

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  viewW: number,
  viewH: number,
): void {
  const cam = state.player.pos;
  const cx = viewW / 2;
  const cy = viewH / 2;
  const sx = (wx: number) => wx - cam.x + cx;
  const sy = (wy: number) => wy - cam.y + cy;

  drawGround(ctx, cam, viewW, viewH);

  // Depth sort: things lower on screen draw on top
  const sorted = [...state.enemies].sort((a, b) => a.pos.y - b.pos.y);
  const playerY = state.player.pos.y;
  let drewPlayer = false;
  for (const e of sorted) {
    if (!drewPlayer && e.pos.y > playerY) {
      drawPlayer(ctx, state.player, cx, cy);
      drewPlayer = true;
    }
    drawEnemy(ctx, e, sx(e.pos.x), sy(e.pos.y));
  }
  if (!drewPlayer) drawPlayer(ctx, state.player, cx, cy);

  drawLighting(ctx, viewW, viewH);
}

// ── Ground: beveled stone tiles + stable cracks/pebbles + moss ──
function drawGround(
  ctx: CanvasRenderingContext2D,
  cam: { x: number; y: number },
  viewW: number,
  viewH: number,
): void {
  ctx.fillStyle = '#12161f';
  ctx.fillRect(0, 0, viewW, viewH);

  const startTX = Math.floor((cam.x - viewW / 2) / TILE) - 1;
  const endTX = Math.floor((cam.x + viewW / 2) / TILE) + 1;
  const startTY = Math.floor((cam.y - viewH / 2) / TILE) - 1;
  const endTY = Math.floor((cam.y + viewH / 2) / TILE) + 1;

  for (let ty = startTY; ty <= endTY; ty++) {
    for (let tx = startTX; tx <= endTX; tx++) {
      const px = tx * TILE - cam.x + viewW / 2;
      const py = ty * TILE - cam.y + viewH / 2;
      const n = hash2(tx, ty);

      // Slab base — slight tone variation per tile
      const shade = 22 + Math.floor(n * 10);
      ctx.fillStyle = `rgb(${shade},${shade + 4},${shade + 10})`;
      ctx.fillRect(px, py, TILE, TILE);

      // Bevel: light top-left, dark bottom-right
      ctx.fillStyle = 'rgba(255,255,255,0.045)';
      ctx.fillRect(px, py, TILE, 2);
      ctx.fillRect(px, py, 2, TILE);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(px, py + TILE - 2, TILE, 2);
      ctx.fillRect(px + TILE - 2, py, 2, TILE);

      // Occasional detail
      if (n > 0.82) {
        // moss patch
        const mx = px + 12 + hash2(tx + 7, ty) * (TILE - 30);
        const my = py + 12 + hash2(tx, ty + 7) * (TILE - 30);
        ctx.fillStyle = 'rgba(52,120,60,0.22)';
        ctx.beginPath();
        ctx.ellipse(mx, my, 12, 8, n * 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (n > 0.62) {
        // crack
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        const cxp = px + hash2(tx + 3, ty) * TILE;
        const cyp = py + hash2(tx, ty + 3) * TILE;
        ctx.beginPath();
        ctx.moveTo(cxp, cyp);
        ctx.lineTo(cxp + (n - 0.5) * 30, cyp + (hash2(tx, ty + 9) - 0.5) * 30);
        ctx.stroke();
      } else if (n < 0.14) {
        // pebbles
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.arc(px + n * TILE * 5 % TILE, py + hash2(ty, tx) * TILE, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// ── Lighting: warm torch pool around hero + heavy edge vignette ──
function drawLighting(ctx: CanvasRenderingContext2D, viewW: number, viewH: number): void {
  const cx = viewW / 2;
  const cy = viewH / 2;
  const R = Math.max(viewW, viewH);

  const warm = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.45);
  warm.addColorStop(0, 'rgba(255,190,120,0.10)');
  warm.addColorStop(0.5, 'rgba(255,160,90,0.03)');
  warm.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, viewW, viewH);

  const vig = ctx.createRadialGradient(cx, cy, R * 0.28, cx, cy, R * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, viewW, viewH);
}

function softShadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
  ctx.save();
  ctx.filter = 'blur(3px)';
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Player: top-down warrior (hair crown, shoulders, sword + shield) ──
function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, x: number, y: number): void {
  const bob = Math.sin(p.bob) * 1.5;
  const r = p.radius;
  const py = y + bob;

  softShadow(ctx, x, py + r * 0.75, r * 1.05, r * 0.5);

  ctx.save();
  ctx.translate(x, py);
  ctx.rotate(p.facing); // +x = forward

  // Cloak flaring behind
  ctx.fillStyle = '#7f1d1d';
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, -r * 0.9);
  ctx.quadraticCurveTo(-r * 1.9, 0, -r * 0.3, r * 0.9);
  ctx.quadraticCurveTo(-r * 0.6, 0, -r * 0.3, -r * 0.9);
  ctx.fill();

  // Torso (top-lit)
  const torso = radial(ctx, 'p-torso', r, [
    [0, '#3b82f6'],
    [0.6, '#2563eb'],
    [1, '#1e3a8a'],
  ]);
  ctx.fillStyle = torso;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.82, r, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belt line
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.82, r, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Shoulder pads (steel)
  const pad = radial(ctx, 'p-pad', r * 0.42, [
    [0, '#e2e8f0'],
    [1, '#64748b'],
  ]);
  for (const sign of [-1, 1]) {
    ctx.save();
    ctx.translate(r * 0.15, sign * r * 0.92);
    ctx.fillStyle = pad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Shield (left / -y)
  ctx.save();
  ctx.translate(r * 0.55, -r * 1.05);
  const shieldG = radial(ctx, 'p-shield', r * 0.6, [
    [0, '#b45309'],
    [1, '#78350f'],
  ]);
  ctx.fillStyle = shieldG;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.55, r * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#fcd34d';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Sword (right / +y) — metallic blade with glowing rune
  ctx.save();
  ctx.translate(r * 0.5, r * 0.95);
  // grip + guard
  ctx.fillStyle = '#3f2a14';
  ctx.fillRect(-r * 0.12, -r * 0.18, r * 0.24, r * 0.36);
  ctx.fillStyle = '#a16207';
  ctx.fillRect(r * 0.1, -r * 0.28, r * 0.14, r * 0.56);
  // blade forward (+x)
  const blade = ctx.createLinearGradient(r * 0.24, 0, r * 2.1, 0);
  blade.addColorStop(0, '#94a3b8');
  blade.addColorStop(0.5, '#f8fafc');
  blade.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = blade;
  ctx.beginPath();
  ctx.moveTo(r * 0.24, -r * 0.16);
  ctx.lineTo(r * 1.9, -r * 0.09);
  ctx.lineTo(r * 2.15, 0);
  ctx.lineTo(r * 1.9, r * 0.09);
  ctx.lineTo(r * 0.24, r * 0.16);
  ctx.closePath();
  ctx.fill();
  // glow tip
  ctx.save();
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#38bdf8';
  ctx.fillStyle = '#7dd3fc';
  ctx.beginPath();
  ctx.arc(r * 2.05, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();

  // Head — crown of hair with a tiny nose bump forward
  const head = radial(ctx, 'p-head', r * 0.5, [
    [0, '#6b4a2b'],
    [1, '#3b2417'],
  ]);
  ctx.fillStyle = head;
  ctx.beginPath();
  ctx.arc(r * 0.22, 0, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
  // hair swirl highlight
  ctx.fillStyle = 'rgba(255,220,170,0.18)';
  ctx.beginPath();
  ctx.arc(r * 0.12, -r * 0.12, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  // nose/brow bump peeking forward
  ctx.fillStyle = '#e3aa72';
  ctx.beginPath();
  ctx.arc(r * 0.6, 0, r * 0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ── Enemies: true top-down monsters, oriented by heading ──
function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, x: number, y: number): void {
  const s = ENEMY_STATS[e.kind];
  // Spawn-in: fade + scale up over the first ~0.35s
  const t = Math.min(1, e.age / 0.35);
  const grow = 0.4 + 0.6 * t;
  const flash = e.hitFlash > 0;

  softShadow(ctx, x, y + s.radius * 0.6, s.radius * 0.95 * grow, s.radius * 0.42 * grow);

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.25 + 0.75 * t;
  ctx.scale(grow, grow);
  ctx.rotate(e.heading + Math.PI / 2); // +y (after rotate) = forward

  if (e.kind === 'slime') {
    drawSlime(ctx, e, s, flash);
  } else if (e.kind === 'bat') {
    drawBat(ctx, e, s, flash);
  } else {
    drawSkeleton(ctx, e, s, flash);
  }

  ctx.restore();
  ctx.globalAlpha = 1;

  // HP bar (screen-aligned, only when hurt)
  if (e.hp < e.maxHp && t > 0.5) {
    const w = s.radius * 2;
    const bx = x - s.radius;
    const by = y - s.radius * grow - 9;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(bx - 1, by - 1, w + 2, 5);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(bx, by, w * (e.hp / e.maxHp), 3);
  }
}

function drawSlime(ctx: CanvasRenderingContext2D, e: Enemy, s: typeof ENEMY_STATS['slime'], flash: boolean): void {
  const r = e.radius;
  const squish = 1 + Math.sin(e.wobble) * 0.07;
  ctx.save();
  ctx.scale(1 / squish, squish);
  // gel body
  ctx.fillStyle = flash ? '#ffffff' : radial(ctx, 'slime-body', r, [
    [0, s.light],
    [0.55, s.base],
    [1, s.dark],
  ]);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (!flash) {
    // translucent rim
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.stroke();
    // specular highlight (top)
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.28, -r * 0.34, r * 0.22, r * 0.14, -0.5, 0, Math.PI * 2);
    ctx.fill();
    // inner bubbles
    ctx.fillStyle = 'rgba(6,95,70,0.5)';
    ctx.beginPath();
    ctx.arc(r * 0.25, r * 0.18, r * 0.16, 0, Math.PI * 2);
    ctx.arc(-r * 0.1, r * 0.35, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBat(ctx: CanvasRenderingContext2D, e: Enemy, s: typeof ENEMY_STATS['bat'], flash: boolean): void {
  const r = e.radius;
  const flap = (Math.sin(e.wobble * 1.6) * 0.5 + 0.5); // 0..1
  const spread = 0.5 + flap * 0.55;
  ctx.fillStyle = flash ? '#ffffff' : s.base;
  // wings (forward = +y). Draw two membranes left/right of body.
  for (const sign of [-1, 1]) {
    ctx.save();
    ctx.scale(sign, 1);
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.1);
    ctx.quadraticCurveTo(r * 1.5, -r * spread, r * 1.35, r * 0.2);
    ctx.quadraticCurveTo(r * 0.9, r * 0.1, r * 0.5, r * 0.5);
    ctx.quadraticCurveTo(r * 0.5, 0, 0, r * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // body
  ctx.fillStyle = flash ? '#ffffff' : radial(ctx, 'bat-body', r * 0.6, [
    [0, s.light],
    [1, s.dark],
  ]);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.38, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  // ear nubs poking up-forward
  if (!flash) {
    ctx.fillStyle = s.dark;
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sign * r * 0.2, -r * 0.4);
      ctx.lineTo(sign * r * 0.32, -r * 0.7);
      ctx.lineTo(sign * r * 0.05, -r * 0.5);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawSkeleton(ctx: CanvasRenderingContext2D, e: Enemy, s: typeof ENEMY_STATS['skeleton'], flash: boolean): void {
  const r = e.radius;
  // shoulder / clavicle bones (perpendicular to forward)
  ctx.strokeStyle = flash ? '#ffffff' : s.dark;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.75, r * 0.15);
  ctx.lineTo(r * 0.75, r * 0.15);
  ctx.stroke();
  // arm bones
  ctx.lineWidth = 3;
  for (const sign of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sign * r * 0.7, r * 0.15);
    ctx.lineTo(sign * r * 0.85, r * 0.8);
    ctx.stroke();
  }
  // skull dome (top of head)
  ctx.fillStyle = flash ? '#ffffff' : radial(ctx, 'skull', r * 0.72, [
    [0, s.light],
    [0.7, s.base],
    [1, s.dark],
  ]);
  ctx.beginPath();
  ctx.arc(0, -r * 0.15, r * 0.72, 0, Math.PI * 2);
  ctx.fill();
  if (!flash) {
    // cranial suture lines
    ctx.strokeStyle = 'rgba(80,70,60,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.85);
    ctx.lineTo(0, r * 0.45);
    ctx.moveTo(-r * 0.6, -r * 0.15);
    ctx.quadraticCurveTo(0, -r * 0.3, r * 0.6, -r * 0.15);
    ctx.stroke();
    // shadow of brow at front (+y)
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.3, r * 0.5, r * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
