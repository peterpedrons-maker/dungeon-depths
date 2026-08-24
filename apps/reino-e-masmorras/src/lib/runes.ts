import { EquipmentItem, Rarity, RuneStack } from '../types/game';
import { pickRarityForTier, pickBossDropRarity, rarityIndex } from './equipment';

// Drop chance for a Runa de Aprimoramento, rolled independently of the
// normal equipment drop (see DungeonPanel.tsx's tryDropRune) — "não precisa
// ser tão alto... mas também não pode ser baixo" was the ask, so this sits
// well above equipment's own late-game floor (~5-9%) without competing with
// it: a regular kill has a real but occasional shot, a boss/elite kill
// (which already guarantees an equipment drop) adds a second, much better
// shot at one on top.
export const RUNE_DROP_CHANCE_REGULAR = 0.08;
export const RUNE_DROP_CHANCE_BOSS = 0.30;

// A rune's rarity/tier gate what it can be used on at the Ferreiro — both
// axes work the same way: a rune can be equal or HIGHER than the item on
// either one, never lower. "Se ela for lendária, pode ser usada em itens
// lendários, épicos, raros, tudo um pra baixo... só não pode fazer o
// sentido oposto."
export function canUseRuneOn(rune: RuneStack, item: EquipmentItem): boolean {
  return rune.tier >= item.tier && rarityIndex(rune.rarity) >= rarityIndex(item.rarity);
}

// Rolls what a rune drop should be — same rarity curve as regular loot
// (progress-based, boosted by Sorte/Qualidade dos Itens the same way), tier
// pinned to the dungeon's own itemTier like equipment. `guaranteed` (a
// boss/elite kill) reuses the boss table, same as a guaranteed equipment
// drop does.
export function rollRuneDrop(tier: number, progress: number, qualityBonusPct: number, guaranteed: boolean): RuneStack {
  const rarity: Rarity = guaranteed ? pickBossDropRarity(progress, qualityBonusPct) : pickRarityForTier(progress, qualityBonusPct).id;
  return { rarity, tier, count: 1 };
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
