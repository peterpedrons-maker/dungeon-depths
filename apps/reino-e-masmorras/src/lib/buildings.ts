import { KingdomBonuses } from '../types/game';

export interface BuildingDef {
  id: string;
  name: string;
  desc: string;
  maxLevel: number;
  costForLevel: (level: number) => number; // gold cost to go from `level` to `level + 1`
  effectForLevel: (level: number) => Partial<KingdomBonuses>;
  effectLabel: (level: number) => string; // human-readable current effect, for the UI
}

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'forja', name: 'Forja',
    desc: 'Melhora a chance de encontrar equipamentos em masmorras e a qualidade dos itens forjados.',
    maxLevel: 5,
    costForLevel: (level) => Math.round(40 * Math.pow(1.6, level)),
    effectForLevel: (level) => ({ dropChanceBonusPct: level * 0.03, itemQualityBonusPct: level * 0.05 }),
    effectLabel: (level) => `+${Math.round(level * 3)}% chance de drop, +${Math.round(level * 5)}% qualidade dos itens`,
  },
  {
    id: 'capela', name: 'Capela',
    desc: 'Bênçãos que fazem suas poções de vida curarem uma porcentagem maior da vida máxima.',
    maxLevel: 5,
    costForLevel: (level) => Math.round(35 * Math.pow(1.6, level)),
    effectForLevel: (level) => ({ potionHealBonusPct: level * 0.08 }),
    effectLabel: (level) => `+${Math.round(level * 8)}% de cura das poções`,
  },
  {
    id: 'guilda', name: 'Guilda dos Aventureiros',
    desc: 'Contatos e conhecimento acumulado fazem você ganhar mais experiência por inimigo derrotado.',
    maxLevel: 5,
    costForLevel: (level) => Math.round(45 * Math.pow(1.6, level)),
    effectForLevel: (level) => ({ xpBonusPct: level * 0.06 }),
    effectLabel: (level) => `+${Math.round(level * 6)}% de experiência`,
  },
];

export function computeKingdomBonuses(buildings: Record<string, number>): KingdomBonuses {
  const totals: KingdomBonuses = { dropChanceBonusPct: 0, itemQualityBonusPct: 0, potionHealBonusPct: 0, xpBonusPct: 0 };
  for (const b of BUILDINGS) {
    const level = buildings[b.id] ?? 0;
    if (level <= 0) continue;
    const eff = b.effectForLevel(level);
    totals.dropChanceBonusPct += eff.dropChanceBonusPct ?? 0;
    totals.itemQualityBonusPct += eff.itemQualityBonusPct ?? 0;
    totals.potionHealBonusPct += eff.potionHealBonusPct ?? 0;
    totals.xpBonusPct += eff.xpBonusPct ?? 0;
  }
  return totals;
}
