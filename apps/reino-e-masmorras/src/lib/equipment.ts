import { ClassId, Rarity, Weapon } from '../types/game';
import { CLASSES } from './classes';

interface RarityDef { id: Rarity; name: string; color: string; weight: number; mult: number; }
export const RARITIES: RarityDef[] = [
  { id: 'comum', name: 'Comum', color: '#b8ada0', weight: 55, mult: 1.0 },
  { id: 'incomum', name: 'Incomum', color: '#4f9d4f', weight: 27, mult: 1.3 },
  { id: 'raro', name: 'Raro', color: '#3f7ab8', weight: 12, mult: 1.7 },
  { id: 'epico', name: 'Épico', color: '#9b4fc9', weight: 5, mult: 2.3 },
  { id: 'legendario', name: 'Legendário', color: '#e0a030', weight: 1, mult: 3.2 },
];

const PREFIXES: Record<Rarity, string[]> = {
  comum: ['Enferrujada', 'Simples', 'Rústica'],
  incomum: ['Afiada', 'Reforçada', 'Batida'],
  raro: ['Élfica', 'Rúnica', 'do Templário'],
  epico: ['Sagrada', 'Amaldiçoada', 'do Abismo'],
  legendario: ['Lendária', 'Divina', 'do Fim dos Tempos'],
};
const SUFFIXES = ['do Dragão', 'da Aurora', 'das Sombras', 'do Rei Eterno', 'da Tempestade'];

function pickRarity(): RarityDef {
  const total = RARITIES.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const r of RARITIES) {
    if (roll < r.weight) return r;
    roll -= r.weight;
  }
  return RARITIES[0];
}

function rarityIndex(id: Rarity): number {
  return RARITIES.findIndex((r) => r.id === id);
}

let _wid = 0;

export function generateWeapon(classId: ClassId, depth: number): Weapon {
  const rarity = pickRarity();
  const base = CLASSES[classId].weaponBase;
  const prefix = PREFIXES[rarity.id][Math.floor(Math.random() * PREFIXES[rarity.id].length)];
  const tier = rarityIndex(rarity.id);
  const name = tier >= 3
    ? `${base} ${prefix} ${SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]}`
    : `${base} ${prefix}`;

  const roll = 3 + Math.floor(Math.random() * 5) + Math.floor(depth / 3);
  const dmgBonus = Math.round(roll * rarity.mult);

  let secondaryStat: Weapon['secondaryStat'];
  if (tier >= 1) {
    const useCrit = Math.random() < 0.5;
    secondaryStat = useCrit
      ? { type: 'crit', value: Math.round(tier * 3) / 100 }
      : { type: 'def', value: tier * 2 };
  }

  return { id: `w${++_wid}_${Date.now()}`, name, classId, rarity: rarity.id, dmgBonus, secondaryStat };
}

export function rarityColor(r: Rarity): string {
  return RARITIES.find((x) => x.id === r)?.color ?? '#b8ada0';
}
export function rarityName(r: Rarity): string {
  return RARITIES.find((x) => x.id === r)?.name ?? 'Comum';
}
