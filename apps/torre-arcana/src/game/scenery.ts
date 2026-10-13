// ─── Static background scenery ─────────────────────────────────────────────
// Framing silhouettes along both edges of the path — pines, dead trees,
// rocks, broken pillars — so the field reads as a cut-through-the-forest
// road instead of an empty void with enemies floating in it. Positions are
// generated once with a small seeded PRNG (not Math.random() at render
// time, which would make them flicker/jitter every frame) and projected
// through the same depth/lane perspective as everything else, so they
// recede into the distance correctly and naturally fall out of frame as
// their depth gets close to the tower — exactly like real foreground framing.

import { View, depthToScreen } from './projection';

export type SceneryKind = 'pine' | 'deadTree' | 'rock' | 'pillar';

export interface SceneryProp {
  lane: number;
  depth: number;
  kind: SceneryKind;
  scale: number;
  flipX: boolean;
}

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const KINDS: SceneryKind[] = ['pine', 'pine', 'pine', 'deadTree', 'rock', 'pillar'];

export const SCENERY: SceneryProp[] = (() => {
  const rand = mulberry32(90125);
  const props: SceneryProp[] = [];
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 18; i++) {
      const depth = 0.04 + rand() * 0.88;
      const lane = side * (0.78 + rand() * 0.55); // just past where enemies/shots live
      props.push({
        lane, depth,
        kind: KINDS[Math.floor(rand() * KINDS.length)],
        scale: 0.65 + rand() * 0.75,
        flipX: rand() > 0.5,
      });
    }
  }
  return props.sort((a, b) => a.depth - b.depth);
})();

function drawPine(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.moveTo(0, -s * 2.5);
  ctx.lineTo(-s * 0.85, -s * 1.05);
  ctx.lineTo(-s * 0.45, -s * 1.05);
  ctx.lineTo(-s * 1.15, 0);
  ctx.lineTo(s * 1.15, 0);
  ctx.lineTo(s * 0.45, -s * 1.05);
  ctx.lineTo(s * 0.85, -s * 1.05);
  ctx.closePath();
  ctx.fill();
}

function drawDeadTree(ctx: CanvasRenderingContext2D, s: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, s * 0.16);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(s * 0.08, -s * 2.1);
  ctx.moveTo(s * 0.03, -s * 1.3); ctx.lineTo(-s * 0.75, -s * 2);
  ctx.moveTo(s * 0.05, -s * 1); ctx.lineTo(s * 0.7, -s * 1.7);
  ctx.moveTo(s * 0.06, -s * 1.7); ctx.lineTo(-s * 0.5, -s * 2.35);
  ctx.stroke();
}

function drawRock(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.32, s * 1.15, s * 0.68, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPillar(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.moveTo(-s * 0.38, 0);
  ctx.lineTo(-s * 0.42, -s * 2.3);
  ctx.lineTo(-s * 0.1, -s * 2.75);
  ctx.lineTo(s * 0.22, -s * 2.4);
  ctx.lineTo(s * 0.4, 0);
  ctx.closePath();
  ctx.fill();
}

export function renderScenery(ctx: CanvasRenderingContext2D, view: View): void {
  for (const prop of SCENERY) {
    const pos = depthToScreen(prop.depth, prop.lane, view);
    if (pos.x < -view.w * 0.3 || pos.x > view.w * 1.3 || pos.y < view.h * 0.2) continue;
    const s = prop.scale * pos.scale * view.h * 0.1;
    const color = `rgba(8,6,16,${(0.72 + pos.scale * 0.26).toFixed(2)})`;
    ctx.save();
    ctx.translate(pos.x, pos.y);
    if (prop.flipX) ctx.scale(-1, 1);
    ctx.fillStyle = color;
    switch (prop.kind) {
      case 'pine': drawPine(ctx, s); break;
      case 'deadTree': drawDeadTree(ctx, s, color); break;
      case 'rock': drawRock(ctx, s); break;
      case 'pillar': drawPillar(ctx, s); break;
    }
    ctx.restore();
  }
}
