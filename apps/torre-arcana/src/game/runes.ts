import { RuneDef, RuneId } from './types';

// Four distinct "shooters" — deliberately not reskins of the same bolt.
// Each has its own projectile behavior (see engine.ts's fireRune): Mísseis
// is the reliable default, Rajada fans out and slows, Corrente jumps to a
// second target, Núcleo trades rate of fire for a heavy splash hit.
export const RUNES: RuneDef[] = [
  {
    id: 'missiles', name: 'Mísseis Arcanos', color: '#38bdf8',
    desc: 'Disparo confiável de energia arcana. Sempre acerta onde você mirar.',
    baseDamage: 9, baseCooldown: 0.42, projectileSpeed: 820,
    unlockCost: 0, upgradeCostBase: 18, maxStars: 5,
  },
  {
    id: 'frost', name: 'Rajada de Gelo', color: '#8fd9ff',
    desc: 'Três cristais em leque. Reduz a velocidade de quem acertar.',
    baseDamage: 5, baseCooldown: 0.95, projectileSpeed: 620,
    unlockCost: 40, upgradeCostBase: 24, maxStars: 5,
  },
  {
    id: 'chain', name: 'Corrente de Raio', color: '#c084fc',
    desc: 'O raio salta pro inimigo mais próximo ao impactar.',
    baseDamage: 7, baseCooldown: 0.7, projectileSpeed: 980,
    unlockCost: 70, upgradeCostBase: 30, maxStars: 5,
  },
  {
    id: 'firecore', name: 'Núcleo de Fogo', color: '#ff7a45',
    desc: 'Um golpe lento e pesado que explode numa pequena área.',
    baseDamage: 24, baseCooldown: 1.6, projectileSpeed: 520,
    unlockCost: 110, upgradeCostBase: 42, maxStars: 5,
  },
];

export function runeDef(id: RuneId): RuneDef {
  const def = RUNES.find((r) => r.id === id);
  if (!def) throw new Error(`unknown rune id: ${id}`);
  return def;
}

// Cost to go from `currentStars` to `currentStars + 1` (or to unlock, when
// currentStars is 0) — grows linearly with the star being bought.
export function upgradeCost(def: RuneDef, currentStars: number): number {
  return Math.round(def.upgradeCostBase * (currentStars + 1));
}

export function runeDamage(def: RuneDef, stars: number): number {
  return def.baseDamage * (1 + 0.22 * stars);
}

export function runeCooldown(def: RuneDef, stars: number): number {
  return def.baseCooldown * Math.max(0.55, 1 - 0.07 * stars);
}
