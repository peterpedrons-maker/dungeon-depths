// The art sheet currently has five columns × two rows. Tier 11 intentionally
// reuses the Tier 10 art until a third row is authored, keeping icon lookups
// valid without weakening the numeric tier progression.
export const VISUAL_MAX_TIER = 10;

export function visualTierForItem(tier: number): number {
  return Math.max(1, Math.min(VISUAL_MAX_TIER, Math.round(tier)));
}
