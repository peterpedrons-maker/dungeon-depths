// ─── Persistent progression: gold + upgrades ────────────────────────────────
// Score earned during a run converts to gold whenever a phase resolves
// (cleared or fallen), banked immediately so nothing is lost even on a loss.
// Gold buys permanent upgrades, stored in localStorage — no backend, this is
// a single-player, single-device game like every other app in this repo.

const SAVE_KEY = 'ricochete:save:v1';
export const GOLD_RATE = 12; // score points per gold

export type UpgradeId = 'ballSize' | 'goalSize' | 'shield' | 'multiplier';

interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costGrowth: number;
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'ballSize',
    name: 'Bola Maior',
    description: 'Bola maior acerta os blocos com mais facilidade.',
    maxLevel: 5,
    baseCost: 15,
    costGrowth: 1.6,
  },
  {
    id: 'goalSize',
    name: 'Saída Maior',
    description: 'Aumenta a área de saída de cada fase.',
    maxLevel: 5,
    baseCost: 15,
    costGrowth: 1.6,
  },
  {
    id: 'shield',
    name: 'Escudo Anti-Queda',
    description: 'Cada nível sobrevive a uma queda em buraco, renovado a cada fase.',
    maxLevel: 3,
    baseCost: 40,
    costGrowth: 2.1,
  },
  {
    id: 'multiplier',
    name: 'Multiplicador de Pontos',
    description: 'Aumenta a pontuação (e o ouro) ganhos.',
    maxLevel: 5,
    baseCost: 25,
    costGrowth: 1.7,
  },
];

export interface Save {
  gold: number;
  upgrades: Record<UpgradeId, number>;
}

function defaultSave(): Save {
  return { gold: 0, upgrades: { ballSize: 0, goalSize: 0, shield: 0, multiplier: 0 } };
}

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    const base = defaultSave();
    return {
      gold: typeof parsed.gold === 'number' ? parsed.gold : base.gold,
      upgrades: { ...base.upgrades, ...parsed.upgrades },
    };
  } catch {
    return defaultSave();
  }
}

export function saveSave(save: Save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Private mode / storage disabled — progression just won't persist.
  }
}

export function upgradeCost(id: UpgradeId, currentLevel: number): number {
  const def = UPGRADES.find((u) => u.id === id)!;
  return Math.round(def.baseCost * Math.pow(def.costGrowth, currentLevel));
}

export function purchaseUpgrade(save: Save, id: UpgradeId): boolean {
  const def = UPGRADES.find((u) => u.id === id)!;
  const level = save.upgrades[id];
  if (level >= def.maxLevel) return false;
  const cost = upgradeCost(id, level);
  if (save.gold < cost) return false;
  save.gold -= cost;
  save.upgrades[id] = level + 1;
  saveSave(save);
  return true;
}

export function ballRadiusBonus(level: number): number {
  return level * 1.2;
}

export function goalSizeMultiplier(level: number): number {
  return 1 + level * 0.18;
}

export function scoreMultiplier(level: number): number {
  return 1 + level * 0.1;
}
