import type { CSSProperties } from 'react';
import { ClassId, SkillEffect } from '../types/game';
import { SKILL_TREES } from './skills';

import guerreiroSheet from '../assets/abilities/guerreiro.webp';
import magoSheet from '../assets/abilities/mago.webp';
import ladinoSheet from '../assets/abilities/ladino.webp';
import clerigoSheet from '../assets/abilities/clerigo.webp';
import cavaleiroSheet from '../assets/abilities/cavaleiro.webp';
import paladinoSheet from '../assets/abilities/paladino.webp';
import barbaroSheet from '../assets/abilities/barbaro.webp';
import arqueiroSheet from '../assets/abilities/arqueiro.webp';
import feiticeiroSheet from '../assets/abilities/feiticeiro.webp';
import bruxoSheet from '../assets/abilities/bruxo.webp';
import druidaSheet from '../assets/abilities/druida.webp';
import bardoSheet from '../assets/abilities/bardo.webp';
import necromanteSheet from '../assets/abilities/necromante.webp';
import passivasSheet from '../assets/abilities/passivas.webp';
import guerreiroPassivasSheet from '../assets/abilities/guerreiro-passivas.webp';

// Each class's 15 active abilities (5 per path × 3 paths) live on one sheet,
// one row per path in SKILL_TREES[classId] order. cacador has no sheet yet
// (still waiting on art) — activeAbilityIconStyle returns null for it and
// callers fall back to the generic star glyph, same as before this existed.
const ACTIVE_SHEET: Partial<Record<ClassId, string>> = {
  guerreiro: guerreiroSheet, mago: magoSheet, ladino: ladinoSheet, clerigo: clerigoSheet,
  cavaleiro: cavaleiroSheet, paladino: paladinoSheet, barbaro: barbaroSheet, arqueiro: arqueiroSheet,
  feiticeiro: feiticeiroSheet, bruxo: bruxoSheet, druida: druidaSheet, bardo: bardoSheet,
  necromante: necromanteSheet,
};

const ACTIVE_COLS = 5;
const ACTIVE_ROWS = 3;

// The 15-node topology (lib/skills.ts TOPOLOGY) places actives at these 5
// tier slots, in the order the art sheets lay them out left-to-right.
const ACTIVE_NODE_INDEX_COL: Record<number, number> = { 4: 0, 9: 1, 10: 2, 12: 3, 13: 4 };

// `cropX`/`cropY` (0-1, default 1 = no change) zoom into the center of each
// cell on each axis independently, cutting away a `1-crop` fraction of
// margin — needed because the painted medallions don't all reach the edge
// of their nominal grid cell by the same amount, and not always by the same
// amount on both axes (varies per sheet/icon), which otherwise shows as a
// mismatched gap between the art and its equally-sized `bg-ink` backing
// disc in SkillTree.
function sheetBackgroundStyle(
  url: string,
  cols: number,
  rows: number,
  col: number,
  row: number,
  cropX = 1,
  cropY = 1,
): CSSProperties {
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: `${(cols / cropX) * 100}% ${(rows / cropY) * 100}%`,
    backgroundPosition: `${(100 * (2 * col + 1 - cropX)) / (2 * (cols - cropX))}% ${(100 * (2 * row + 1 - cropY)) / (2 * (rows - cropY))}%`,
    backgroundRepeat: 'no-repeat',
  };
}

// Returns the background-image style for a specific active ability's unique
// icon, or null if this class has no art sheet yet (caller falls back to
// the generic IconActive glyph).
export function activeAbilityIconStyle(classId: ClassId, abilityId: string): CSSProperties | null {
  const url = ACTIVE_SHEET[classId];
  if (!url) return null;
  const [, pathId, indexStr] = abilityId.split(':');
  const col = ACTIVE_NODE_INDEX_COL[Number(indexStr)];
  const row = SKILL_TREES[classId].findIndex((p) => p.id === pathId);
  if (col === undefined || row < 0) return null;
  // Guerreiro's active sheet leaves a small (~8-9%) margin inside each cell —
  // measured worst case 91.5%/91.1% fill — so a mild zoom closes the gap
  // with zero clipping risk.
  return sheetBackgroundStyle(url, ACTIVE_COLS, ACTIVE_ROWS, col, row, 0.93, 0.93);
}

// A class's 9 EXCLUSIVE passive nodes (3 per path, always at node-index
// 6/8/14 within each path — verified fixed across every class's topology)
// get their own painted icon here, same one-sheet-per-class pattern as
// actives, kept fully separate from the shared generic-stat library below.
// Classes without a sheet yet fall through to that shared library instead
// (see NodeIconView in SkillTree.tsx), same fallback pattern as actives.
const EXCLUSIVE_PASSIVE_SHEET: Partial<Record<ClassId, string>> = {
  guerreiro: guerreiroPassivasSheet,
};

const EXCLUSIVE_PASSIVE_COLS = 3;
const EXCLUSIVE_PASSIVE_ROWS = 3;
const EXCLUSIVE_PASSIVE_NODE_INDEX_COL: Record<number, number> = { 6: 0, 8: 1, 14: 2 };

// Returns the background-image style for a class's own exclusive passive
// icon, or null if this class has no bespoke passive sheet yet (caller
// falls back to the shared generic-stat library keyed by effect kind).
export function exclusivePassiveIconStyle(classId: ClassId, nodeId: string): CSSProperties | null {
  const url = EXCLUSIVE_PASSIVE_SHEET[classId];
  if (!url) return null;
  const [, pathId, indexStr] = nodeId.split(':');
  const col = EXCLUSIVE_PASSIVE_NODE_INDEX_COL[Number(indexStr)];
  const row = SKILL_TREES[classId].findIndex((p) => p.id === pathId);
  if (col === undefined || row < 0) return null;
  // Already fills ~98% of its cell — a negligible zoom is enough.
  return sheetBackgroundStyle(url, EXCLUSIVE_PASSIVE_COLS, EXCLUSIVE_PASSIVE_ROWS, col, row, 0.98, 0.98);
}

const PASSIVE_COLS = 6;
const PASSIVE_ROWS = 3;
const GENERIC_CELL = 17;

// Maps a passive/secondary-stat node's single-key effect to its shared icon
// cell (see the "Biblioteca de Passivas" sheet in KIT-DE-ARTE.md for what
// each cell depicts) — same underlying bonus always gets the same icon,
// regardless of which class's tree it appears on.
const PASSIVE_CELL: Partial<Record<keyof SkillEffect, number>> = {
  critPct: 0, critDmgPct: 1, accuracyPct: 2, flatBonusDmg: 3, flatBonusMagicDmg: 4,
  defPct: 6, mdefPct: 7, blockChance: 8, evasionPct: 9, thornsPct: 10,
  maxHpFlat: 12, lifestealPct: 13, onCritHealPct: 14, lowHpDmgScale: 15, cooldownReductionPct: 16,
};

// This shared library was painted under the old "cover the margin with a
// metal frame" convention (now removed) and its 18 icons fill their cell
// very unevenly and non-uniformly between axes — anywhere from 37.9%/63.3%
// (cell 4) up to 76.1%/77.1% (cell 10). A single sheet-wide zoom can only
// ever match the least-filled icon, so instead each cell gets its own
// [cropX, cropY] pair sized to its own measured alpha-channel content
// bounding box (fraction of cell width/height actually painted, +2% safety
// margin so anti-aliased edges never get clipped) — this is what actually
// makes every icon fill its `bg-ink` backing the same way, without having
// to repaint the sheet.
const PASSIVE_CROP: [number, number][] = [
  [0.725, 0.735], [0.743, 0.727], [0.743, 0.675], [0.653, 0.671], [0.387, 0.646],
  [0.676, 0.650], [0.682, 0.693], [0.592, 0.706], [0.730, 0.702], [0.682, 0.667],
  [0.776, 0.786], [0.659, 0.722], [0.696, 0.604], [0.579, 0.667], [0.714, 0.671],
  [0.696, 0.735], [0.571, 0.646], [0.500, 0.659],
];

export function passiveIconStyle(effect: SkillEffect): CSSProperties {
  let cell = GENERIC_CELL;
  if (effect.dmgPctVsStatus) {
    cell = effect.dmgPctVsStatus.status === 'burn' ? 5 : 11;
  } else {
    for (const key of Object.keys(PASSIVE_CELL) as (keyof SkillEffect)[]) {
      if (effect[key] !== undefined) { cell = PASSIVE_CELL[key]!; break; }
    }
  }
  const col = cell % PASSIVE_COLS;
  const row = Math.floor(cell / PASSIVE_COLS);
  const [cropX, cropY] = PASSIVE_CROP[cell];
  return sheetBackgroundStyle(passivasSheet, PASSIVE_COLS, PASSIVE_ROWS, col, row, cropX, cropY);
}
