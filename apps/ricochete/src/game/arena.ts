// ─── Arena layout ───────────────────────────────────────────────────────────
// The phase starts almost entirely solid: just a small pocket at dead
// center (where the ball launches from) and the goal — a small hidden
// pocket tucked in one random corner, picked fresh each phase. Everything
// else is a breakable block the player has to chip away through plain
// chaotic bouncing; there's no pre-opened path to either one, so finding
// the goal takes genuinely breaking a lot of blocks, not just aiming well
// once. Hazard zones ("holes") sit along the true edges too, hidden behind
// that same solid field — they only become reachable once a path has been
// broken through to them. Blocks closer to the true edge are tougher,
// mirroring a shell that gets harder to crack the further out you go.
// Layout is generated once with a small seeded PRNG so it's reproducible,
// not reshuffled every frame — and since the corner and seed both change
// every phase, no two phases look alike.

import { Block, Edge, GoalZone, Hole } from './types';

const COLS = 11;

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
// Synthwave trio — cool cyan reads as weak, hot magenta as the toughest.
export const LEVEL_COLOR: Record<number, string> = { 1: '#2ee6ff', 2: '#8b5cf6', 3: '#ff2d95' };

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
  goalSizeLevel = 0,
): GeneratedLevel {
  const rand = mulberry32(seed);
  const blockW = viewW / COLS;
  let rows = Math.round(viewH / blockW);
  if (rows % 2 === 0) rows += 1;
  rows = Math.max(rows, 11);
  const blockH = viewH / rows;

  const startRow = Math.floor(rows / 2);
  const startCol = Math.floor(COLS / 2);

  const cornerMargin = 2; // cells in from the true edge, so the pocket stays behind at least a layer of blocks
  const corners = [
    { row: cornerMargin, col: cornerMargin },
    { row: cornerMargin, col: COLS - 1 - cornerMargin },
    { row: rows - 1 - cornerMargin, col: cornerMargin },
    { row: rows - 1 - cornerMargin, col: COLS - 1 - cornerMargin },
  ];
  const goalCell = corners[Math.floor(rand() * corners.length)];
  const goalRadius = 1 + Math.floor(goalSizeLevel / 2); // 3x3 pocket at level 0, up to 7x7 at max

  const open: boolean[][] = Array.from({ length: rows }, () => new Array(COLS).fill(false));
  const openPocket = (row: number, col: number, radius: number) => {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r >= 1 && r < rows - 1 && c >= 1 && c < COLS - 1) open[r][c] = true;
      }
    }
  };
  openPocket(startRow, startCol, 1);
  openPocket(goalCell.row, goalCell.col, goalRadius);

  const toughBias = Math.min(0.15, levelIndex * 0.02);
  const blocks: Block[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < COLS; col++) {
      if (open[row][col]) continue;

      const edgeDist = Math.min(col, COLS - 1 - col, row, rows - 1 - row);
      let level = edgeDist === 0 ? 3 : edgeDist <= 2 ? 2 : 1;
      if (rand() < 0.18 + toughBias) level = Math.min(3, level + 1);
      else if (rand() < 0.12) level = Math.max(1, level - 1);

      blocks.push({
        x: col * blockW, y: row * blockH, w: blockW, h: blockH,
        level, maxLevel: level, flash: 0,
      });
    }
  }

  const goal: GoalZone = {
    x: (goalCell.col - goalRadius) * blockW,
    y: (goalCell.row - goalRadius) * blockH,
    w: (goalRadius * 2 + 1) * blockW,
    h: (goalRadius * 2 + 1) * blockH,
  };

  const holeCount = Math.min(3, 1 + Math.floor(levelIndex / 2));
  const edges: Edge[] = ['top', 'bottom', 'left', 'right'];
  const holeWidth = Math.min(blockW, blockH) * 1.4;
  const holes: Hole[] = [];
  for (let i = 0; i < holeCount; i++) {
    const edge = edges[Math.floor(rand() * edges.length)];
    const span = edge === 'top' || edge === 'bottom' ? viewW : viewH;
    const from = holeWidth + rand() * (span - holeWidth * 2);
    holes.push({ edge, from, to: from + holeWidth });
  }

  return { blocks, holes, goal };
}
