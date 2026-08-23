// How many potions a character can carry at once — buying stops at the cap,
// forcing a real decision about when to spend them instead of stockpiling
// infinitely.
export const MAX_POTIONS = 5;

// Presets for the auto-potion HP% trigger, configured on the pre-dungeon
// loadout screen.
export const POTION_THRESHOLD_OPTIONS = [0.2, 0.3, 0.4, 0.5];

// 2026 rebalance: potions used to cost a flat 19 gold everywhere, no matter
// how far the player had progressed — by the later regions that was pocket
// change next to a single piece of gear, so sustain never got more of a
// real decision the way everything else already had. Now scales with the
// same itemTier a player's own gear/Mercador stock already tracks (see
// highestAccessibleItemTier in lib/dungeons.ts) — reaching a new region's
// dungeon raises this the same way it raises what drops there. Base is
// more than double the old flat 19 at tier 1, then keeps climbing (milder
// growth than gear's own 1.6/tier, since a potion is a repeat consumable
// purchase, not a one-time upgrade).
// Take two, per direct user feedback: tripled again (40 -> 120) and the
// growth steepened (1.35 -> 1.5) — a repeat consumable purchase needing to
// stay this relevant at every tier, on top of gold income being cut hard
// again (see GOLD_YIELD_MULT in lib/enemies.ts), is exactly the sustain
// pressure the Forja/Mercador economy is meant to create.
const POTION_TIER_BASE = 120;
const POTION_TIER_GROWTH = 1.5;
export function potionBasePrice(tier: number): number {
  return Math.round(POTION_TIER_BASE * Math.pow(POTION_TIER_GROWTH, Math.max(1, tier) - 1));
}
