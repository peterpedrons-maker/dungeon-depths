import type { EquipmentItem, Rarity, RuneStack } from '../types/game';
import { RARITIES, rarityIndex } from './equipment.ts';
import { MAX_TIER } from './itemTiers.ts';

// Drop chance for a Runa de Aprimoramento, rolled independently of the
// normal equipment drop (see DungeonPanel.tsx's tryDropRune) — "não precisa
// ser tão alto... mas também não pode ser baixo" was the ask, so this sits
// well above equipment's own late-game floor (~5-9%) without competing with
// it: a regular kill has a real but occasional shot, a boss/elite kill
// (which already guarantees an equipment drop) adds a second, much better
// shot at one on top.
export const RUNE_DROP_CHANCE_REGULAR = 0.30;
export const RUNE_DROP_CHANCE_BOSS = 0.60;

// A rune's rarity/tier gate what it can be used on at the Ferreiro — both
// axes work the same way: a rune can be equal or HIGHER than the item on
// either one, never lower. "Se ela for lendária, pode ser usada em itens
// lendários, épicos, raros, tudo um pra baixo... só não pode fazer o
// sentido oposto."
export function canUseRuneOn(rune: RuneStack, item: EquipmentItem): boolean {
  return rune.tier >= item.tier && rarityIndex(rune.rarity) >= rarityIndex(item.rarity);
}

// Picks which owned rune stack to spend on `item`, so the Ferreiro's UI can
// just ask "which affix?" without also making the player pick a stack —
// the smallest (lowest rarity, then lowest tier) stack that still qualifies,
// so a player naturally conserves their rarer/higher-tier runes for the
// items that actually need them instead of burning them on anything.
export function pickBestRuneFor(runes: RuneStack[], item: EquipmentItem): RuneStack | null {
  const usable = runes.filter((r) => canUseRuneOn(r, item));
  if (usable.length === 0) return null;
  return usable.reduce((best, r) => {
    const byRarity = rarityIndex(r.rarity) - rarityIndex(best.rarity);
    const better = byRarity !== 0 ? byRarity < 0 : r.tier < best.tier;
    return better ? r : best;
  });
}

// A rune's own rarity curve — deliberately its own table, not a reuse of
// equipment's (pickRarityForTier/pickBossDropRarity): a rune is a
// consumable spent repeatedly across a whole gear set, not a single big
// roll, so it needs to be noticeably easier to come by at every rarity
// (not just Comum) than the equivalent equipment rarity — "não precisa ser
// tão baixo... a não ser o comum, que pode dropar bastante". Flat across
// the whole game (doesn't scale with dungeon progress like equipment does)
// — only the rune's TIER tracks progress (pinned to the dungeon's own
// itemTier below), rarity odds stay the same from the first dungeon to the
// last. Order matches RARITIES: comum, incomum, raro, épico, legendario.
const RUNE_RARITY_WEIGHTS = [45, 27, 16, 9, 3];

function pickRuneRarity(): Rarity {
  const total = RUNE_RARITY_WEIGHTS.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < RARITIES.length; i++) {
    if (roll < RUNE_RARITY_WEIGHTS[i]) return RARITIES[i].id;
    roll -= RUNE_RARITY_WEIGHTS[i];
  }
  return RARITIES[0].id;
}

// Rolls what a rune drop should be — tier pinned to the dungeon's own
// itemTier, same as equipment. A boss/elite kill vs. a regular one only
// changes whether a rune drops AT ALL (RUNE_DROP_CHANCE_BOSS vs.
// RUNE_DROP_CHANCE_REGULAR, checked by the caller) — its rarity odds
// (RUNE_RARITY_WEIGHTS above) are the same either way.
export function rollRuneDrop(tier: number): RuneStack {
  return { rarity: pickRuneRarity(), tier: Math.max(1, Math.min(MAX_TIER, Math.round(tier))), count: 1 };
}

// Adds one rune to `runes`, stacking onto an existing (rarity, tier) entry
// instead of creating a duplicate — mirrors how potions stack as a single
// count rather than N separate items.
export function addRune(runes: RuneStack[], drop: RuneStack): RuneStack[] {
  const idx = runes.findIndex((r) => r.rarity === drop.rarity && r.tier === drop.tier);
  if (idx === -1) return [...runes, { ...drop }];
  return runes.map((r, i) => (i === idx ? { ...r, count: r.count + drop.count } : r));
}

// Removes one rune from the given (rarity, tier) stack, dropping the entry
// entirely once its count hits 0 rather than leaving a stale 0-count row.
export function removeRune(runes: RuneStack[], rarity: Rarity, tier: number): RuneStack[] {
  return runes
    .map((r) => (r.rarity === rarity && r.tier === tier ? { ...r, count: r.count - 1 } : r))
    .filter((r) => r.count > 0);
}
