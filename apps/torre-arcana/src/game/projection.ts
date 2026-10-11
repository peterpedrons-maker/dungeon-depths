// ─── Fixed-camera perspective ──────────────────────────────────────────────
// This is not real 3D — just the classic "rail shooter" trick: a depth value
// (0 = horizon, 1 = at the tower) is eased with smoothstep so near objects
// grow faster than far ones, and mapped to a screen Y between the horizon
// line and the ground line, with lateral `lane` spread widening as depth
// increases (narrow near the vanishing point, wide up close).

export interface View {
  w: number;
  h: number;
}

export interface ScreenPos {
  x: number;
  y: number;
  scale: number;
}

const HORIZON_Y_FRAC = 0.30;
const GROUND_Y_FRAC = 0.86;
const MIN_SCALE = 0.14;
const MAX_SCALE = 1.0;
const MIN_SPREAD_FRAC = 0.05;
const MAX_SPREAD_FRAC = 0.62;

export function depthToScreen(depth: number, lane: number, view: View): ScreenPos {
  const d = Math.max(0, Math.min(1, depth));
  const eased = d * d * (3 - 2 * d); // smoothstep
  const y = view.h * (HORIZON_Y_FRAC + (GROUND_Y_FRAC - HORIZON_Y_FRAC) * eased);
  const spread = view.w * (MIN_SPREAD_FRAC + (MAX_SPREAD_FRAC - MIN_SPREAD_FRAC) * eased);
  const x = view.w / 2 + lane * spread;
  const scale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * eased;
  return { x, y, scale };
}

export const HORIZON_Y_FRACTION = HORIZON_Y_FRAC;
