import { Character, EquipmentItem, ItemSlot, KingdomBonuses } from '../types/game';
import { generateItem, rarityMult } from './equipment';
import { highestAccessibleItemTier } from './dungeons';
import { OFFHAND_KIND } from './itemTiers';
import { findFreeSlot, SLOT_FOOTPRINT } from './inventoryGrid';

// Smaller than the player's own 50-cell bag (10×5) — big enough to browse,
// but "quase igual ao inventário" per the design call, not identical to it.
export const STOCK_COLS = 6;
export const STOCK_ROWS = 5;
const STOCK_CELLS = STOCK_COLS * STOCK_ROWS;

// How many items to roll per stock refresh — a range, not a fixed count, so
// the shop doesn't always look equally full (see the empty cells left over
// once a roll can't fit anymore, or just runs out of rolls).
const MIN_ITEMS = 10;
const MAX_ITEMS = 18;

// One in ~8 rolled items comes up unidentified — hidden name/icon/stats in
// the UI (see EquipmentItem.identified) until the player actually buys it,
// at a flat price instead of one reflecting its real (hidden) rarity.
const MYSTERY_CHANCE = 1 / 8;
export const MYSTERY_BASE_PRICE = 55;

const SLOTS: ItemSlot[] = ['weapon', 'body', 'legs', 'hands', 'offhand', 'accessory'];

// Re-rolls the Mercador's entire stock — called only when a dungeon run
// actually ends in victory or death (see GameShell.handleRunEnd), never just
// from opening the shop, so the player can't cheaply farm it for a good
// roll. Stops as soon as a rolled item's footprint no longer fits the grid,
// which is what naturally leaves empty cells behind instead of always
// packing the shop completely full.
export function generateMerchantStock(ch: Character, kingdomBonuses: KingdomBonuses): EquipmentItem[] {
  const offhandKind = OFFHAND_KIND[ch.classId];
  const slots = offhandKind ? SLOTS : SLOTS.filter((s) => s !== 'offhand');
  const itemTier = highestAccessibleItemTier(ch.level);
  const targetCount = MIN_ITEMS + Math.floor(Math.random() * (MAX_ITEMS - MIN_ITEMS + 1));

  let stock: EquipmentItem[] = [];
  for (let i = 0; i < targetCount; i++) {
    const slot = slots[Math.floor(Math.random() * slots.length)];
    const { w, h } = SLOT_FOOTPRINT[slot];
    const pos = findFreeSlot(stock, w, h, STOCK_COLS, STOCK_ROWS);
    if (!pos) break;
    const item = generateItem(slot, ch.classId, itemTier, kingdomBonuses.itemQualityBonusPct);
    const identified = Math.random() >= MYSTERY_CHANCE;
    stock.push({ ...item, identified, gridX: pos.x, gridY: pos.y });
  }
  return stock;
}

export function canFitInStock(stock: EquipmentItem[], slot: ItemSlot): boolean {
  const { w, h } = SLOT_FOOTPRINT[slot];
  return findFreeSlot(stock, w, h, STOCK_COLS, STOCK_ROWS) !== null;
}

// A revealed item's price scales with its real tier and rarity — a mystery
// item's is flat (see MYSTERY_BASE_PRICE), since the player is paying for a
// gamble, not for stats they can't see. Both get the Mercador building's
// discount applied the same way potions/the old mystery slots already did.
export function priceForStockItem(item: EquipmentItem, discountPct: number): number {
  const base = item.identified === false ? MYSTERY_BASE_PRICE : Math.round((18 + item.tier * 9) * rarityMult(item.rarity));
  return Math.max(1, Math.round(base * (1 - discountPct)));
}

export { STOCK_CELLS };
