import { Character, EquipmentItem, ItemSlot, KingdomBonuses } from '../types/game';
import { generateItem } from './equipment';
import { highestAccessibleItemTier } from './dungeons';
import { merchantBasePrice, MERCHANT_RARITY_PRICE_MULT, OFFHAND_KIND } from './itemTiers';
import { findFreeSlot, SLOT_FOOTPRINT } from './inventoryGrid';

// Smaller than the player's own 50-cell bag (10×5) — big enough to browse,
// but "quase igual ao inventário" per the design call, not identical to it.
export const STOCK_COLS = 6;
export const STOCK_ROWS = 5;
const STOCK_CELLS = STOCK_COLS * STOCK_ROWS;

// How many items to roll per stock refresh — a range, not a fixed count, so
// the shop doesn't always look equally full (see the empty cells left over
// once a roll can't fit anymore, or just runs out of rolls). Cut from
// 10-18 to 6-10 — the Mercador is meant to be an occasional opportunity to
// weigh against saving/Forjar, not a browsable catalog that rivals the
// player's own loot.
const MIN_ITEMS = 6;
const MAX_ITEMS = 10;

// One in ~8 rolled items comes up unidentified — hidden name/icon/stats in
// the UI (see EquipmentItem.identified) until the player actually buys it,
// at a price that scales with tier but not rarity (see priceForStockItem),
// since the player is paying for a gamble, not for stats they can't see.
const MYSTERY_CHANCE = 1 / 8;
// A moderate premium over a "typical" item at this tier — the player is
// buying a gamble, and gambles cost extra, but it still has to scale with
// tier or a late-game mystery slot would stay a trivially cheap reroll
// forever while every identified item around it costs hundreds/thousands.
const MYSTERY_PRICE_MULT = 1.3;

// The stock stays put until this much real time has passed since its last
// refresh (see maybeRefreshMerchantStock) — replaces the old "re-rolls
// every time a dungeon run ends" trigger, which let a player farming short
// runs effectively browse a fresh shop every few minutes for free.
export const MERCHANT_REFRESH_MS = 60 * 60 * 1000;

const SLOTS: ItemSlot[] = ['weapon', 'body', 'legs', 'hands', 'offhand', 'accessory'];

// Rolls a brand-new stock — called by maybeRefreshMerchantStock once the
// refresh interval has actually elapsed, and once up front at character
// creation so a fresh hero never sees a bare shop. Stops as soon as a
// rolled item's footprint no longer fits the grid, which is what naturally
// leaves empty cells behind instead of always packing the shop completely
// full.
export function generateMerchantStock(ch: Character, kingdomBonuses: KingdomBonuses): EquipmentItem[] {
  const offhandKind = OFFHAND_KIND[ch.classId];
  const slots = offhandKind ? SLOTS : SLOTS.filter((s) => s !== 'offhand');
  const itemTier = highestAccessibleItemTier(ch);
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

// Checked wherever the player opens the shop (see GameShell) instead of at
// every run's end — re-rolls the stock (and stamps merchantRefreshedAt)
// only once MERCHANT_REFRESH_MS has actually passed, otherwise returns `ch`
// untouched so callers can skip writing an update at all.
export function maybeRefreshMerchantStock(ch: Character, kingdomBonuses: KingdomBonuses): Character {
  const last = ch.merchantRefreshedAt ?? 0;
  if (Date.now() - last < MERCHANT_REFRESH_MS) return ch;
  return { ...ch, merchantStock: generateMerchantStock(ch, kingdomBonuses), merchantRefreshedAt: Date.now() };
}

export function canFitInStock(stock: EquipmentItem[], slot: ItemSlot): boolean {
  const { w, h } = SLOT_FOOTPRINT[slot];
  return findFreeSlot(stock, w, h, STOCK_COLS, STOCK_ROWS) !== null;
}

// A revealed item's price scales with its real tier AND rarity (see
// merchantBasePrice/MERCHANT_RARITY_PRICE_MULT in lib/itemTiers.ts — the
// same curve lib/equipment.ts's sellValue prices a sale against, so buying
// and selling stay in sync); a mystery item's scales with tier only (its
// rarity is exactly what the player doesn't get to see). Both get the
// Mercador building's discount applied the same way potions already do.
export function priceForStockItem(item: EquipmentItem, discountPct: number): number {
  const base = item.identified === false
    ? Math.round(merchantBasePrice(item.tier) * MYSTERY_PRICE_MULT)
    : Math.round(merchantBasePrice(item.tier) * MERCHANT_RARITY_PRICE_MULT[item.rarity]);
  return Math.max(1, Math.round(base * (1 - discountPct)));
}

export { STOCK_CELLS };
