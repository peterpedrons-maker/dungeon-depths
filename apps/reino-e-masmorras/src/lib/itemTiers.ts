import { AccessoryType, ClassId, Rarity, SecondaryStatType } from '../types/game';

// ── Base-type tier ladder ─────────────────────────────────────────────────
// One shared 10-step material/power progression, reused across every slot by
// swapping in a different base noun ("Espada" vs "Peitoral" vs "Anel" ...).
// This is what actually carries the item's power level now — Rarity (see
// lib/equipment.ts) is a separate layer on top controlling affix count, not
// the name. Every step uses gender-invariant "de/das X" phrasing so it reads
// correctly regardless of the base noun's grammatical gender (unlike the
// existing rarity prefixes, which are adjectives and don't bother with this).
export const TIER_MATERIAL: string[] = [
  'de Sucata', 'de Ferro', 'de Aço', 'de Prata', 'de Ouro',
  'de Mithril', 'de Adamantina', 'de Obsidiana', 'de Escamas de Dragão', 'das Lendas',
];
export const MAX_TIER = TIER_MATERIAL.length;

export function tierName(baseNoun: string, tier: number): string {
  const clamped = Math.max(1, Math.min(MAX_TIER, Math.round(tier)));
  return `${baseNoun} ${TIER_MATERIAL[clamped - 1]}`;
}

// ── Armor weight groups ──────────────────────────────────────────────────
// Keeps body/legs/hands art down to 3 shared ladders instead of 14 — grouped
// by the same cloth/leather/plate split the existing per-class bodyBase
// flavor text already implies (see lib/classes.ts).
export type WeightGroup = 'light' | 'medium' | 'heavy';

export const WEIGHT_GROUP: Record<ClassId, WeightGroup> = {
  mago: 'light', clerigo: 'light', feiticeiro: 'light', bruxo: 'light',
  druida: 'light', necromante: 'light', bardo: 'light',
  ladino: 'medium', barbaro: 'medium', arqueiro: 'medium', cacador: 'medium',
  guerreiro: 'heavy', cavaleiro: 'heavy', paladino: 'heavy',
};

// Bare shape nouns only — no material baked in here, since tierName() already
// appends one (e.g. "de Aço"). A noun like "Grevas de Ferro" would double up
// into "Grevas de Ferro de Ouro" once a tier material was appended, so the
// weight class is conveyed by the shape word alone (Robe vs Colete vs
// Peitoral), not by a redundant second material.
export const ARMOR_NOUN: Record<WeightGroup, { body: string; legs: string; hands: string }> = {
  light: { body: 'Robe', legs: 'Calças', hands: 'Luvas' },
  medium: { body: 'Colete', legs: 'Culotes', hands: 'Braçadeiras' },
  heavy: { body: 'Peitoral', legs: 'Grevas', hands: 'Manoplas' },
};

// ── Offhand (mão secundária) ─────────────────────────────────────────────
// Only classes wielding a one-handed weapon get something to put in the
// other hand — everyone else (two-handed weapons, or dual-wielding like
// Ladino) has no entry here at all, and never generates/sees an offhand slot.
export type OffhandKind = 'shield' | 'foco';

export const OFFHAND_KIND: Partial<Record<ClassId, OffhandKind>> = {
  guerreiro: 'shield', cavaleiro: 'shield', paladino: 'shield',
  clerigo: 'foco', feiticeiro: 'foco', bruxo: 'foco', necromante: 'foco',
};

export const OFFHAND_NOUN: Record<OffhandKind, string> = {
  shield: 'Escudo', foco: 'Relicário',
};

// ── Acessórios ────────────────────────────────────────────────────────────
// The 3 base names now each have their own stat identity — a build choice,
// since only one accessory slot exists (see equipment.ts's generateItem).
export const ACCESSORY_NOUN: Record<AccessoryType, string> = {
  anel: 'Anel', amuleto: 'Amuleto', bracelete: 'Bracelete',
};

export const ACCESSORY_STAT_POOL: Record<AccessoryType, SecondaryStatType[]> = {
  anel: ['crit', 'critDmg'],
  amuleto: ['hp', 'def', 'mdef'],
  bracelete: ['atk', 'matk'],
};

export const ACCESSORY_TYPES: AccessoryType[] = ['anel', 'amuleto', 'bracelete'];

// ── Preço de Mercador ────────────────────────────────────────────────────
// Rebalanceamento: um item precisa custar o equivalente a várias runs de
// farm, não uma compra trivial de 10-15 minutos — Tier 1 gira em ~60-160
// ouro, Tier 10 em ~4400-11800. Compartilhada pelo preço de COMPRA
// (merchantStock.ts) e, como uma fração dela, pelo preço de VENDA
// (equipment.ts's sellValue) — um item de Tier alto que vendesse barato
// quebraria o loop "vendi um lixo, comprei algo melhor" assim que a compra
// ficasse cara nesse Tier.
// 2026 rebalance, take three: base raised ~50% (60 -> 90) per direct
// instruction — the Mercador should read as an opportunity worth saving
// for, not an easy alternate source of gear.
// Take four: still too cheap per direct user feedback — base doubled again
// (90 -> 180) and the growth exponent steepened (1.6 -> 1.75) so high-tier
// gear costs noticeably more than a linear doubling alone would give
// (Tier 10 goes from ~6.2k to ~24k gold), on top of the same pass halving
// gold income yet again (see GOLD_YIELD_MULT in lib/enemies.ts) — the
// Mercador needs to feel like a real long-term saving goal at every tier,
// not just early game.
const MERCHANT_TIER_BASE = 180;
const MERCHANT_TIER_GROWTH = 1.75;
export const MERCHANT_RARITY_PRICE_MULT: Record<Rarity, number> = {
  comum: 1.0, incomum: 1.15, raro: 1.5, epico: 2.0, legendario: 2.7,
};
export function merchantBasePrice(tier: number): number {
  return Math.round(MERCHANT_TIER_BASE * Math.pow(MERCHANT_TIER_GROWTH, Math.max(1, tier) - 1));
}
