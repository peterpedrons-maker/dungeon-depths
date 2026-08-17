import type { CSSProperties } from 'react';
import { AccessoryType, ClassId, EquipmentItem } from '../types/game';
import { OFFHAND_KIND, OffhandKind, WEIGHT_GROUP, WeightGroup } from './itemTiers';

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
import bodyLight from '../assets/items/body-light.webp';
import legsLight from '../assets/items/legs-light.webp';
import handsLight from '../assets/items/hands-light.webp';
import bodyMedium from '../assets/items/body-medium.webp';
import legsMedium from '../assets/items/legs-medium.webp';
import handsMedium from '../assets/items/hands-medium.webp';
import bodyHeavy from '../assets/items/body-heavy.webp';
import legsHeavy from '../assets/items/legs-heavy.webp';
import handsHeavy from '../assets/items/hands-heavy.webp';
import accessoryAnel from '../assets/items/accessory-anel.webp';
import accessoryBracelete from '../assets/items/accessory-bracelete.webp';
import accessoryAmuleto from '../assets/items/accessory-amuleto.webp';

interface Sheet {
  url: string;
  // width/height of a single cell — each weapon sheet was cropped tight
  // around its own (now vertically-oriented) silhouette, so a slim dagger
  // and a chunky crossbow each get their own natural cell proportions
  // instead of being squeezed into one shared aspect ratio.
  aspect: number;
}

// Each sheet is a 5-column x 2-row grid covering tiers 1-10 (see
// KIT-DE-ARTE.md's "Ícones de Itens" section).
const WEAPON_SHEET: Partial<Record<ClassId, Sheet>> = {
  guerreiro: { url: weaponGuerreiro, aspect: 0.3895 },
  mago: { url: weaponMago, aspect: 0.431 },
  ladino: { url: weaponLadino, aspect: 0.4547 },
  clerigo: { url: weaponClerigo, aspect: 0.5678 },
  cavaleiro: { url: weaponCavaleiro, aspect: 0.3868 },
  paladino: { url: weaponPaladino, aspect: 0.5824 },
  barbaro: { url: weaponBarbaro, aspect: 0.9583 },
  arqueiro: { url: weaponArqueiro, aspect: 0.3268 },
  cacador: { url: weaponCacador, aspect: 0.9276 },
  feiticeiro: { url: weaponFeiticeiro, aspect: 0.8378 },
  bruxo: { url: weaponBruxo, aspect: 0.8405 },
  druida: { url: weaponDruida, aspect: 0.4286 },
  bardo: { url: weaponBardo, aspect: 0.5343 },
  necromante: { url: weaponNecromante, aspect: 0.4025 },
};

const OFFHAND_SHEET: Record<OffhandKind, Sheet> = {
  shield: { url: offhandShield, aspect: 1 },
  foco: { url: offhandFoco, aspect: 1 },
};

const ARMOR_SHEET: Record<WeightGroup, { body: Sheet; legs: Sheet; hands: Sheet }> = {
  light: {
    body: { url: bodyLight, aspect: 1.0485 },
    legs: { url: legsLight, aspect: 0.8834 },
    hands: { url: handsLight, aspect: 1.0192 },
  },
  medium: {
    body: { url: bodyMedium, aspect: 0.807 },
    legs: { url: legsMedium, aspect: 0.8947 },
    hands: { url: handsMedium, aspect: 1.1144 },
  },
  heavy: {
    body: { url: bodyHeavy, aspect: 1.015 },
    legs: { url: legsHeavy, aspect: 0.7908 },
    hands: { url: handsHeavy, aspect: 0.9397 },
  },
};

const ACCESSORY_SHEET: Record<AccessoryType, Sheet> = {
  anel: { url: accessoryAnel, aspect: 0.9398 },
  bracelete: { url: accessoryBracelete, aspect: 1.1336 },
  amuleto: { url: accessoryAmuleto, aspect: 0.6696 },
};

const SHEET_COLS = 5;
const SHEET_ROWS = 2;

function sheetFor(item: EquipmentItem): Sheet | null {
  if (item.slot === 'weapon') return WEAPON_SHEET[item.classId] ?? null;
  if (item.slot === 'offhand') {
    const kind = OFFHAND_KIND[item.classId];
    return kind ? OFFHAND_SHEET[kind] : null;
  }
  if (item.slot === 'body' || item.slot === 'legs' || item.slot === 'hands') {
    return ARMOR_SHEET[WEIGHT_GROUP[item.classId]][item.slot];
  }
  if (item.slot === 'accessory') {
    return item.accessoryType ? ACCESSORY_SHEET[item.accessoryType] : null;
  }
  return null;
}

export interface ItemSheetStyle {
  // natural width/height ratio of one cell — callers letterbox to this so
  // the sprite never gets stretched to match whatever box shape they have.
  aspect: number;
  backgroundStyle: CSSProperties;
}

// Returns the background-image style that crops the right tier cell out of
// the item's sprite sheet, or null if no real art exists yet for this
// item's slot (caller should fall back to the generic glyph in that case).
export function itemSheetStyle(item: EquipmentItem): ItemSheetStyle | null {
  const sheet = sheetFor(item);
  if (!sheet) return null;
  const tier = Math.max(1, Math.min(10, Math.round(item.tier)));
  const col = (tier - 1) % SHEET_COLS;
  const row = Math.floor((tier - 1) / SHEET_COLS);
  return {
    aspect: sheet.aspect,
    backgroundStyle: {
      backgroundImage: `url(${sheet.url})`,
      backgroundSize: `${SHEET_COLS * 100}% ${SHEET_ROWS * 100}%`,
      backgroundPosition: `${(col / (SHEET_COLS - 1)) * 100}% ${(row / (SHEET_ROWS - 1)) * 100}%`,
      backgroundRepeat: 'no-repeat',
    },
  };
}
