import { Enemy, GameState, Player, ENEMY_STATS } from './types';

const TILE = 64;

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  viewW: number,
  viewH: number,
): void {
  const cam = state.player.pos; // camera centered on player
  const cx = viewW / 2;
  const cy = viewH / 2;

  // World -> screen helper
  const sx = (wx: number) => wx - cam.x + cx;
  const sy = (wy: number) => wy - cam.y + cy;

  drawGround(ctx, cam, viewW, viewH);

  // Draw enemies sorted by y so lower ones overlap correctly (top-down depth)
  const sorted = [...state.enemies].sort((a, b) => a.pos.y - b.pos.y);
  for (const e of sorted) {
    drawEnemy(ctx, e, sx(e.pos.x), sy(e.pos.y));
  }

  drawPlayer(ctx, state.player, cx, cy);
}

// ── Ground: dark stone with a subtle grid, drawn relative to camera ──
function drawGround(
  ctx: CanvasRenderingContext2D,
  cam: { x: number; y: number },
  viewW: number,
  viewH: number,
): void {
  ctx.fillStyle = '#161b26';
  ctx.fillRect(0, 0, viewW, viewH);

  const offX = ((-cam.x % TILE) + TILE) % TILE;
  const offY = ((-cam.y % TILE) + TILE) % TILE;

  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = offX; x < viewW; x += TILE) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, viewH);
  }
  for (let y = offY; y < viewH; y += TILE) {
    ctx.moveTo(0, y);
    ctx.lineTo(viewW, y);
  }
  ctx.stroke();

  // Faint vignette to focus the eye on the center
  const grad = ctx.createRadialGradient(
    viewW / 2, viewH / 2, Math.min(viewW, viewH) * 0.25,
    viewW / 2, viewH / 2, Math.max(viewW, viewH) * 0.75,
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, viewW, viewH);
}

function drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.7, r * 0.95, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Player: top-down hero (cloak + head + weapon) ──
function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, x: number, y: number): void {
  const bob = Math.sin(p.bob) * 1.5;
  const r = p.radius;
  const py = y + bob;

  drawShadow(ctx, x, py, r);

  // Weapon (staff/blade) pointing toward facing
  ctx.save();
  ctx.translate(x, py);
  ctx.rotate(p.facing);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(r * 0.2, 0);
  ctx.lineTo(r * 1.7, 0);
  ctx.stroke();
  // glowing tip
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(r * 1.7, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Cloak / body (viewed from above)
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.arc(x, py, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Shoulders hint
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath();
  ctx.arc(x, py, r * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Head (skin) slightly offset toward facing
  const hx = x + Math.cos(p.facing) * r * 0.28;
  const hy = py + Math.sin(p.facing) * r * 0.28;
  ctx.fillStyle = '#f1c27d';
  ctx.beginPath();
  ctx.arc(hx, hy, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
  // hair cap
  ctx.fillStyle = '#3b2417';
  ctx.beginPath();
  ctx.arc(hx - Math.cos(p.facing) * 2, hy - Math.sin(p.facing) * 2, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f1c27d';
  ctx.beginPath();
  ctx.arc(hx, hy, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
}

// ── Enemies: top-down monsters ──
function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, x: number, y: number): void {
  const stats = ENEMY_STATS[e.kind];
  drawShadow(ctx, x, y, e.radius);

  const flash = e.hitFlash > 0;

  if (e.kind === 'slime') {
    const squish = 1 + Math.sin(e.wobble) * 0.08;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1 / squish, squish);
    ctx.fillStyle = flash ? '#ffffff' : stats.color;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = flash ? '#ffffff' : stats.accent;
    ctx.beginPath();
    ctx.arc(0, e.radius * 0.35, e.radius * 0.6, 0, Math.PI, false);
    ctx.fill();
    ctx.restore();
    // eyes
    if (!flash) {
      ctx.fillStyle = '#0b1220';
      ctx.beginPath();
      ctx.arc(x - 5, y - 2, 2.2, 0, Math.PI * 2);
      ctx.arc(x + 5, y - 2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (e.kind === 'bat') {
    const flap = Math.sin(e.wobble) * e.radius * 0.6;
    ctx.fillStyle = flash ? '#ffffff' : stats.color;
    // wings
    ctx.beginPath();
    ctx.ellipse(x - e.radius * 0.9, y, e.radius * 0.7, e.radius * 0.35 + Math.abs(flap) * 0.3, 0, 0, Math.PI * 2);
    ctx.ellipse(x + e.radius * 0.9, y, e.radius * 0.7, e.radius * 0.35 + Math.abs(flap) * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    // body
    ctx.fillStyle = flash ? '#ffffff' : stats.accent;
    ctx.beginPath();
    ctx.arc(x, y, e.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    if (!flash) {
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(x - 3, y - 1, 1.8, 0, Math.PI * 2);
      ctx.arc(x + 3, y - 1, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // skeleton
    ctx.fillStyle = flash ? '#ffffff' : stats.color;
    ctx.beginPath();
    ctx.arc(x, y, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = flash ? '#ffffff' : stats.accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    if (!flash) {
      ctx.fillStyle = '#0b1220';
      ctx.beginPath();
      ctx.arc(x - 5, y - 2, 2.6, 0, Math.PI * 2);
      ctx.arc(x + 5, y - 2, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 4, y + 4, 8, 2);
    }
  }

  // HP bar (only if damaged)
  if (e.hp < e.maxHp) {
    const w = e.radius * 2;
    const bx = x - e.radius;
    const by = y - e.radius - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(bx, by, w, 3);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(bx, by, w * (e.hp / e.maxHp), 3);
  }
}
