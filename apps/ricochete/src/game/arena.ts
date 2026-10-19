// ─── Arena layout ───────────────────────────────────────────────────────────
// A rectangular shell of breakable blocks framing the whole screen, leaving
// the center empty so the ball always has room to launch and travel. Blocks
// closer to the true edge are tougher (more hits to break) than the ones
// nearer the open center, so clearing a path inward feels like cracking a
// shell. A generous goal strip sits at one end of the open center (top or
// bottom, chosen per level) — reach it to clear the phase. A few hazard
// zones ("holes") sit along the true edges on the other sides; they're
// hidden behind the solid shell at first, so they only become reachable
// once the player has broken a path there, not from the first bounce.
// Layout is generated once with a small seeded PRNG so it's reproducible,
// not reshuffled every frame.

import { Block, Edge, GoalZone, Hole } from './types';

const COLS = 11;
const FRAME_DEPTH = 4; // how many rings of blocks deep the shell is
const GOAL_ROWS = 2; // how many rows tall the goal strip is, before upgrades

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
// Neutral monochrome "brushed metal" tiers — darker reads as tougher.
export const LEVEL_COLOR: Record<number, string> = { 1: '#e4e6ea', 2: '#9aa0ab', 3: '#4b4f58' };

export interface GeneratedLevel {
  blocks: Block[];
  holes: Hole[];
  goal: GoalZone;
}

export function generateLevel(
  viewW: number,
  viewH: number,
  seed: number,
  levelIndex: number,
  goalSizeMult = 1,
): GeneratedLevel {
  const rand = mulberry32(seed);
  const blockW = viewW / COLS;
  const rows = Math.max(FRAME_DEPTH * 2 + 3, Math.round(viewH / blockW));
  const blockH = viewH / rows;
  const toughBias = Math.min(0.15, levelIndex * 0.02);

  const blocks: Block[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < COLS; col++) {
      const ring = Math.min(col, COLS - 1 - col, row, rows - 1 - row);
      if (ring >= FRAME_DEPTH) continue; // open center — no block here

      let level = FRAME_DEPTH - ring;
      if (rand() < 0.18 + toughBias) level = Math.min(3, level + 1);
      else if (rand() < 0.12) level = Math.max(1, level - 1);

      blocks.push({
        x: col * blockW, y: row * blockH, w: blockW, h: blockH,
        level, maxLevel: level, flash: 0,
      });
    }
  }

  const centerColStart = FRAME_DEPTH;
  const centerColEnd = COLS - FRAME_DEPTH;
  const centerRowStart = FRAME_DEPTH;
  const centerRowEnd = rows - FRAME_DEPTH;
  const goalAtTop = rand() < 0.5;
  const goalRows = GOAL_ROWS * goalSizeMult;
  const goalH = goalRows * blockH;
  const goal: GoalZone = {
    x: centerColStart * blockW,
    y: goalAtTop ? centerRowStart * blockH : centerRowEnd * blockH - goalH,
    w: (centerColEnd - centerColStart) * blockW,
    h: goalH,
  };

  const holeCount = Math.min(3, 1 + Math.floor(levelIndex / 2));
  const candidateEdges: Edge[] = (['top', 'bottom', 'left', 'right'] as Edge[]).filter(
    (e) => e !== (goalAtTop ? 'top' : 'bottom'),
  );
  const holeWidth = Math.min(blockW, blockH) * 1.4;
  const holes: Hole[] = [];
  for (let i = 0; i < holeCount; i++) {
    const edge = candidateEdges[Math.floor(rand() * candidateEdges.length)];
    const span = edge === 'top' || edge === 'bottom' ? viewW : viewH;
    const from = holeWidth + rand() * (span - holeWidth * 2);
    holes.push({ edge, from, to: from + holeWidth });
  }

  return { blocks, holes, goal };
}
