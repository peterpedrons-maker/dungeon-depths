import { ClassId, EquipmentItem, ItemSlot, Rarity, SecondaryStatType } from '../types/game';
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

const ACCESSORY_BASES = ['Anel', 'Amuleto', 'Bracelete'];

export const SLOT_NAMES: Record<ItemSlot, string> = {
  weapon: 'Arma', body: 'Corpo', legs: 'Pernas', hands: 'Mãos', accessory: 'Acessório',
};

// How strongly each armor slot rolls its flat defense bonus relative to a
// weapon's flat damage roll — body is the main piece, hands the lightest.
const DEF_SLOT_SCALE: Record<'body' | 'legs' | 'hands', number> = {
  body: 0.6, legs: 0.45, hands: 0.35,
};

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

function baseNameFor(slot: ItemSlot, classId: ClassId): string {
  const c = CLASSES[classId];
  if (slot === 'weapon') return c.weaponBase;
  if (slot === 'body') return c.bodyBase;
  if (slot === 'legs') return c.legsBase;
  if (slot === 'hands') return c.handsBase;
  return ACCESSORY_BASES[Math.floor(Math.random() * ACCESSORY_BASES.length)];
}

// Same base roll for every slot, just scaled differently: a weapon's flat
// damage and an accessory's flat HP need very different magnitudes to feel
// meaningful next to the class's base stats.
function rollPrimaryValue(depth: number, mult: number, scale: number): number {
  const roll = 3 + Math.floor(Math.random() * 5) + Math.floor(depth / 3);
  return Math.round(roll * mult * scale);
}

function rollSecondaryStat(tier: number): EquipmentItem['secondaryStat'] {
  if (tier < 1) return undefined;
  const types: SecondaryStatType[] = ['crit', 'def', 'hp', 'block'];
  const type = types[Math.floor(Math.random() * types.length)];
  const value = type === 'crit' ? Math.round(tier * 3) / 100
    : type === 'block' ? Math.round(tier * 2) / 100
    : type === 'hp' ? tier * 4
    : tier * 2; // def
  return { type, value };
}

let _iid = 0;

// qualityBonusPct comes from the kingdom's Forja building — a flat % bonus
// stacked on top of the item's rolled primary stat.
export function generateItem(slot: ItemSlot, classId: ClassId, depth: number, qualityBonusPct = 0): EquipmentItem {
  const rarity = pickRarity();
  const tier = rarityIndex(rarity.id);
  const base = baseNameFor(slot, classId);
  const prefix = PREFIXES[rarity.id][Math.floor(Math.random() * PREFIXES[rarity.id].length)];
  const name = tier >= 3
    ? `${base} ${prefix} ${SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]}`
    : `${base} ${prefix}`;

  const qualityMult = 1 + qualityBonusPct;
  const dmgBonus = slot === 'weapon' ? rollPrimaryValue(depth, rarity.mult, 1) * qualityMult : 0;
  const defBonus = slot === 'body' || slot === 'legs' || slot === 'hands'
    ? rollPrimaryValue(depth, rarity.mult, DEF_SLOT_SCALE[slot]) * qualityMult : 0;
  const hpBonus = slot === 'accessory' ? rollPrimaryValue(depth, rarity.mult, 3.5) * qualityMult : 0;

  return {
    id: `i${++_iid}_${Date.now()}`, name, classId, slot, rarity: rarity.id,
    dmgBonus: Math.round(dmgBonus), defBonus: Math.round(defBonus), hpBonus: Math.round(hpBonus),
    secondaryStat: rollSecondaryStat(tier),
  };
}

export function sellValue(item: EquipmentItem): number {
  const tier = rarityIndex(item.rarity);
  return 6 + tier * 8;
}

export function rarityColor(r: Rarity): string {
  return RARITIES.find((x) => x.id === r)?.color ?? '#b8ada0';
}
export function rarityName(r: Rarity): string {
  return RARITIES.find((x) => x.id === r)?.name ?? 'Comum';
}
