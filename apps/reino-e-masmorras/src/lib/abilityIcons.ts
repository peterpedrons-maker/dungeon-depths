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

function sheetBackgroundStyle(url: string, cols: number, rows: number, col: number, row: number): CSSProperties {
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${(col / (cols - 1)) * 100}% ${(row / (rows - 1)) * 100}%`,
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
  return sheetBackgroundStyle(url, ACTIVE_COLS, ACTIVE_ROWS, col, row);
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
  return sheetBackgroundStyle(passivasSheet, PASSIVE_COLS, PASSIVE_ROWS, col, row);
}
