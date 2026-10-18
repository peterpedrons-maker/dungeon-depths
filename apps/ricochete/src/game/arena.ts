// ─── Arena layout ───────────────────────────────────────────────────────────
// A rectangular shell of breakable blocks framing the whole screen, leaving
// the center empty so the ball always has room to launch and travel. The
// real screen edges are always solid (engine.ts bounces the ball off them
// as a safety net), so blocks are purely targets — breaking the outer ring
// never lets the ball escape. Blocks closer to the true edge are tougher
// (more hits to break) than the ones nearer the open center, so clearing a
// path inward feels like cracking a shell. Layout is generated once with a
// small seeded PRNG (same mulberry32 used by the old Torre Arcana scenery)
// so it's reproducible, not reshuffled every frame.

import { Block } from './types';

const COLS = 11;
const FRAME_DEPTH = 3; // how many rings of blocks deep the shell is

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const LEVEL_POINTS: Record<number, number> = { 1: 10, 2: 25, 3: 50 };
export const LEVEL_COLOR: Record<number, string> = { 1: '#2fe6ff', 2: '#ff3fb0', 3: '#ffd23f' };

export function generateArena(viewW: number, viewH: number, seed: number): Block[] {
  const rand = mulberry32(seed);
  const blockW = viewW / COLS;
  const rows = Math.max(FRAME_DEPTH * 2 + 3, Math.round(viewH / blockW));
  const blockH = viewH / rows;

  const blocks: Block[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < COLS; col++) {
      const ring = Math.min(col, COLS - 1 - col, row, rows - 1 - row);
      if (ring >= FRAME_DEPTH) continue; // open center — no block here

      // Toughest right at the true edge, softer as the shell gets closer
      // to the open center, with a little random variance so it doesn't
      // read as a perfectly uniform staircase.
      let level = FRAME_DEPTH - ring;
      if (rand() < 0.18) level = Math.min(3, level + 1);
      else if (rand() < 0.12) level = Math.max(1, level - 1);

      blocks.push({
        x: col * blockW, y: row * blockH, w: blockW, h: blockH,
        level, maxLevel: level, flash: 0,
      });
    }
  }
  return blocks;
}
