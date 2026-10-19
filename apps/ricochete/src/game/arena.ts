// ─── Arena layout ───────────────────────────────────────────────────────────
// Each phase is carved as a proper maze (randomized Prim's algorithm): thin
// 1-cell-wide corridors branching out from a forced-open starting pocket at
// dead center, where the ball launches from. Every other cell is a
// breakable block (tougher near the true edge). The goal is placed at
// whichever open cell ends up *farthest along the corridor* from the start
// — never a straight shot from the launch point, since reaching it means
// actually following the maze's turns, not just aiming well once. The
// outermost ring of cells is never carved, so the true edges stay behind at
// least one layer of blocks — hazard zones ("holes") sit along those edges,
// only reachable once the player has broken a path there. Both the maze
// shape and the goal/hole placement come from a seeded PRNG, so every phase
// gets its own distinct layout, never the same shell twice.

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
// Neutral monochrome "brushed metal" tiers — darker reads as tougher.
export const LEVEL_COLOR: Record<number, string> = { 1: '#e4e6ea', 2: '#9aa0ab', 3: '#4b4f58' };

export interface GeneratedLevel {
  blocks: Block[];
  holes: Hole[];
  goal: GoalZone;
}

function openNeighborCount(open: boolean[][], r: number, c: number, rows: number, cols: number): number {
  let n = 0;
  if (r > 0 && open[r - 1][c]) n++;
  if (r < rows - 1 && open[r + 1][c]) n++;
  if (c > 0 && open[r][c - 1]) n++;
  if (c < cols - 1 && open[r][c + 1]) n++;
  return n;
}

// Randomized Prim's maze: grows a perfect (loop-free) maze of 1-wide
// corridors from the starting pocket. Never touches the outermost ring, so
// the true edges always stay solid until the player breaks through.
function carveMaze(rows: number, cols: number, rand: () => number, startRow: number, startCol: number, openRatio: number) {
  const open: boolean[][] = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const inInterior = (r: number, c: number) => r >= 1 && r < rows - 1 && c >= 1 && c < cols - 1;

  const frontier: [number, number][] = [];
  const openCell = (r: number, c: number) => {
    open[r][c] = true;
    [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([nr, nc]) => {
      if (inInterior(nr, nc) && !open[nr][nc]) frontier.push([nr, nc]);
    });
  };

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = startRow + dr;
      const c = startCol + dc;
      if (inInterior(r, c)) open[r][c] = true;
    }
  }
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = startRow + dr;
      const c = startCol + dc;
      if (!inInterior(r, c)) continue;
      [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([nr, nc]) => {
        if (inInterior(nr, nc) && !open[nr][nc]) frontier.push([nr, nc]);
      });
    }
  }

  const interiorCells = (rows - 2) * (cols - 2);
  const targetOpen = Math.floor(interiorCells * openRatio);
  let openCount = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (open[r][c]) openCount++;

  while (openCount < targetOpen && frontier.length > 0) {
    const idx = Math.floor(rand() * frontier.length);
    const [r, c] = frontier[idx];
    frontier.splice(idx, 1);
    if (open[r][c]) continue;
    if (openNeighborCount(open, r, c, rows, cols) !== 1) continue; // keeps corridors 1-wide, loop-free
    openCell(r, c);
    openCount++;
  }

  return open;
}

// BFS over the carved corridors to find the cell reached by the longest
// path from the start — the goal, so getting there means following the
// maze, not aiming once from the launch point.
function farthestCell(open: boolean[][], startRow: number, startCol: number, rows: number, cols: number) {
  const dist: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(-1));
  dist[startRow][startCol] = 0;
  const queue: [number, number][] = [[startRow, startCol]];
  let best = { row: startRow, col: startCol, d: 0 };

  for (let i = 0; i < queue.length; i++) {
    const [r, c] = queue[i];
    const d = dist[r][c];
    if (d > best.d) best = { row: r, col: c, d };
    [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([nr, nc]) => {
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && open[nr][nc] && dist[nr][nc] === -1) {
        dist[nr][nc] = d + 1;
        queue.push([nr, nc]);
      }
    });
  }
  return best;
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
  const openRatio = Math.max(0.26, 0.48 - levelIndex * 0.015);
  const open = carveMaze(rows, COLS, rand, startRow, startCol, openRatio);

  const goalCell = farthestCell(open, startRow, startCol, rows, COLS);
  const goalRadius = 1 + Math.floor(goalSizeLevel / 2); // 3x3 at level 0, up to 7x7 at max level
  for (let dr = -goalRadius; dr <= goalRadius; dr++) {
    for (let dc = -goalRadius; dc <= goalRadius; dc++) {
      const r = goalCell.row + dr;
      const c = goalCell.col + dc;
      if (r >= 1 && r < rows - 1 && c >= 1 && c < COLS - 1) open[r][c] = true;
    }
  }

  const toughBias = Math.min(0.15, levelIndex * 0.02);
  const blocks: Block[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < COLS; col++) {
      if (open[row][col]) continue;

      const edgeDist = Math.min(col, COLS - 1 - col, row, rows - 1 - row);
      let level = edgeDist <= 1 ? 3 : edgeDist <= 3 ? 2 : 1;
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
