import type { CSSProperties } from 'react';
import { ClassId, EquipmentItem } from '../types/game';
import { OFFHAND_KIND, OffhandKind } from './itemTiers';

import weaponGuerreiro from '../assets/items/weapon-guerreiro.webp';
import weaponMago from '../assets/items/weapon-mago.webp';
import weaponLadino from '../assets/items/weapon-ladino.webp';
import weaponClerigo from '../assets/items/weapon-clerigo.webp';
import weaponCavaleiro from '../assets/items/weapon-cavaleiro.webp';
import weaponPaladino from '../assets/items/weapon-paladino.webp';
import weaponBarbaro from '../assets/items/weapon-barbaro.webp';
import weaponArqueiro from '../assets/items/weapon-arqueiro.webp';
import weaponCacador from '../assets/items/weapon-cacador.webp';
import weaponFeiticeiro from '../assets/items/weapon-feiticeiro.webp';
import weaponBruxo from '../assets/items/weapon-bruxo.webp';
import weaponDruida from '../assets/items/weapon-druida.webp';
import weaponBardo from '../assets/items/weapon-bardo.webp';
import weaponNecromante from '../assets/items/weapon-necromante.webp';
import offhandShield from '../assets/items/offhand-shield.webp';
import offhandFoco from '../assets/items/offhand-foco.webp';

// Each sheet is a 5-column x 2-row grid covering tiers 1-10 (see
// KIT-DE-ARTE.md's "Ícones de Itens" section) — armor and accessory sheets
// haven't been generated yet, so those slots still fall back to the plain
// per-slot glyph in icons.tsx until their art arrives too.
const WEAPON_SHEET: Partial<Record<ClassId, string>> = {
  guerreiro: weaponGuerreiro, mago: weaponMago, ladino: weaponLadino, clerigo: weaponClerigo,
  cavaleiro: weaponCavaleiro, paladino: weaponPaladino, barbaro: weaponBarbaro, arqueiro: weaponArqueiro,
  cacador: weaponCacador, feiticeiro: weaponFeiticeiro, bruxo: weaponBruxo, druida: weaponDruida,
  bardo: weaponBardo, necromante: weaponNecromante,
};

const OFFHAND_SHEET: Record<OffhandKind, string> = { shield: offhandShield, foco: offhandFoco };

const SHEET_COLS = 5;
const SHEET_ROWS = 2;

function sheetUrlFor(item: EquipmentItem): string | null {
  if (item.slot === 'weapon') return WEAPON_SHEET[item.classId] ?? null;
  if (item.slot === 'offhand') {
    const kind = OFFHAND_KIND[item.classId];
    return kind ? OFFHAND_SHEET[kind] : null;
  }
  return null;
}

// Returns a background-image style that crops the right tier cell out of the
// item's sprite sheet, or null if no real art exists yet for this item's
// slot (caller should fall back to the generic glyph in that case).
export function itemSheetStyle(item: EquipmentItem): CSSProperties | null {
  const url = sheetUrlFor(item);
  if (!url) return null;
  const tier = Math.max(1, Math.min(10, Math.round(item.tier)));
  const col = (tier - 1) % SHEET_COLS;
  const row = Math.floor((tier - 1) / SHEET_COLS);
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: `${SHEET_COLS * 100}% ${SHEET_ROWS * 100}%`,
    backgroundPosition: `${(col / (SHEET_COLS - 1)) * 100}% ${(row / (SHEET_ROWS - 1)) * 100}%`,
    backgroundRepeat: 'no-repeat',
  };
}
