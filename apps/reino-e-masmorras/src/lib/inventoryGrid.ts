import { EquipmentItem, ItemSlot } from '../types/game';

export const GRID_COLS = 10;
export const GRID_ROWS = 5;
export const GRID_CELLS = GRID_COLS * GRID_ROWS; // 50 — generous starting capacity, raised later via a Kingdom upgrade

// How many grid cells each slot type's item occupies — matches the item's
// real shape (a sword reads tall and thin, a chest piece reads chunky).
export const SLOT_FOOTPRINT: Record<ItemSlot, { w: number; h: number }> = {
  weapon: { w: 1, h: 3 },
  body: { w: 2, h: 2 },
  legs: { w: 1, h: 2 },
  hands: { w: 1, h: 1 },
  offhand: { w: 2, h: 2 },
  accessory: { w: 1, h: 1 },
};

function occupiedCells(inventory: EquipmentItem[]): Set<string> {
  const occ = new Set<string>();
  for (const item of inventory) {
    if (item.gridX == null || item.gridY == null) continue;
    const { w, h } = SLOT_FOOTPRINT[item.slot];
    for (let dx = 0; dx < w; dx++) {
      for (let dy = 0; dy < h; dy++) occ.add(`${item.gridX + dx},${item.gridY + dy}`);
    }
  }
  return occ;
}

function fitsAt(occ: Set<string>, x: number, y: number, w: number, h: number): boolean {
  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < h; dy++) {
      if (occ.has(`${x + dx},${y + dy}`)) return false;
    }
  }
  return true;
}

// First free top-left position (row-major scan) for a w×h block within a
// cols×rows grid (defaults to the nominal GRID_COLS×GRID_ROWS player
// inventory, but the Mercador's stock grid passes its own smaller
// dimensions). Null means it doesn't fit anywhere — used to gate new
// acquisitions (loot, purchases) or to stop generating shop stock early.
export function findFreeSlot(
  inventory: EquipmentItem[], w: number, h: number, cols: number = GRID_COLS, rows: number = GRID_ROWS,
): { x: number; y: number } | null {
  const occ = occupiedCells(inventory);
  for (let y = 0; y <= rows - h; y++) {
    for (let x = 0; x <= cols - w; x++) {
      if (fitsAt(occ, x, y, w, h)) return { x, y };
    }
  }
  return null;
}

// Same scan, but keeps extending downward past `rows` if the nominal grid
// has no room — used only for moves that must never lose an item the player
// already owns (unequip, equip-swap). Should only ever kick in a cell or two
// over cap, since those moves free one item's footprint right before placing
// another.
function findFreeSlotOrExtend(inventory: EquipmentItem[], w: number, h: number, cols: number): { x: number; y: number } {
  const found = findFreeSlot(inventory, w, h, cols);
  if (found) return found;
  const occ = occupiedCells(inventory);
  for (let y = 0; ; y++) {
    for (let x = 0; x <= cols - w; x++) {
      if (fitsAt(occ, x, y, w, h)) return { x, y };
    }
  }
}

export function canFitInInventory(inventory: EquipmentItem[], slot: ItemSlot): boolean {
  const { w, h } = SLOT_FOOTPRINT[slot];
  return findFreeSlot(inventory, w, h) !== null;
}

// Places `item` into `inventory`, finding it a free grid position. Always
// succeeds (see findFreeSlotOrExtend) — callers gating the cap should check
// canFitInInventory() (or findFreeSlot() directly, for a non-default grid
// like the Mercador's stock) first and skip calling this otherwise.
export function placeInInventory(inventory: EquipmentItem[], item: EquipmentItem, cols: number = GRID_COLS): EquipmentItem[] {
  const { w, h } = SLOT_FOOTPRINT[item.slot];
  const pos = findFreeSlotOrExtend(inventory, w, h, cols);
  return [...inventory, { ...item, gridX: pos.x, gridY: pos.y }];
}

export function usedCells(inventory: EquipmentItem[]): number {
  return occupiedCells(inventory).size;
}

// Re-derives every item's grid position from scratch, in array order —
// guarantees no overlaps regardless of what was saved (there's no manual
// drag-to-rearrange, so a stored position is just cached placement output,
// safe to recompute). Used on load so old saves without gridX/gridY — or
// any inventory whose footprints changed after a rebalance — always end up
// valid.
export function repackInventory(items: EquipmentItem[], cols: number = GRID_COLS): EquipmentItem[] {
  return items.reduce<EquipmentItem[]>((acc, item) => placeInInventory(acc, item, cols), []);
}
