import type { AbilityDef } from '../types/game.ts';

export const ARCHER_DISTANCE_MAX = 3;
export const ARCHER_TENSION_MAX = 100;
export const ARCHER_CADENCE_MAX = 6;
export const ARCHER_STEPS_MAX = 3;
export const ARCHER_FLIGHT_MAX = 4;
export const ARCHER_REFLEX_ACTIONS = 2;

export type ArcherDistance = 0 | 1 | 2 | 3;
export type ArcherPath = 'precision' | 'rapid' | 'instinct';
export type ArcherShotType = 'precise' | 'volley' | 'ballistic' | 'movement';

export interface InFlightArrow {
  id: number;
  sourceAbilityId: string;
  sourceName: string;
  atk: number;
  accuracy: number;
  critChance: number;
  critDmgMult: number;
  defPenPct: number;
  dmgMult: number;
  actionsRemaining: number;
  createdOrder: number;
}

export interface ArcherCombatState {
  distance: ArcherDistance;
  tension: number;
  cadence: number;
  perfectRhythm: boolean;
  steps: number;
  reflexActionsLeft: number;
  arrows: InFlightArrow[];
  nextArrowId: number;
  actionCount: number;
  preciseActionsSinceReposition: number;
}

export function createArcherCombatState(): ArcherCombatState {
  return {
    distance: 3, tension: 0, cadence: 0, perfectRhythm: false, steps: 0,
    reflexActionsLeft: 0, arrows: [], nextArrowId: 1, actionCount: 0,
    preciseActionsSinceReposition: 0,
  };
}

export function clampArcherDistance(value: number): ArcherDistance {
  return Math.max(0, Math.min(ARCHER_DISTANCE_MAX, Math.trunc(value))) as ArcherDistance;
}
export function clampArcherTension(value: number): number { return Math.max(0, Math.min(ARCHER_TENSION_MAX, Math.round(value))); }
export function clampArcherCadence(value: number): number { return Math.max(0, Math.min(ARCHER_CADENCE_MAX, Math.trunc(value))); }
export function clampArcherSteps(value: number): number { return Math.max(0, Math.min(ARCHER_STEPS_MAX, Math.trunc(value))); }
export function archerDistanceLabel(distance: number): string {
  return (['ENCURRALADO', 'CURTA', 'IDEAL', 'HORIZONTE'] as const)[clampArcherDistance(distance)];
}
export function archerDistanceShift(state: ArcherCombatState, amount: number): ArcherCombatState {
  return { ...state, distance: clampArcherDistance(state.distance + amount) };
}
export function gainArcherTension(state: ArcherCombatState, amount: number): ArcherCombatState {
  return { ...state, tension: clampArcherTension(state.tension + amount) };
}
export function loseArcherTension(state: ArcherCombatState, amount: number): ArcherCombatState {
  return { ...state, tension: clampArcherTension(state.tension - Math.max(0, amount)) };
}
export function tensionForPreciseHit(distance: number): number {
  return [4, 10, 18, 24][clampArcherDistance(distance)];
}
export function gainArcherCadence(state: ArcherCombatState, amount: number): ArcherCombatState {
  const cadence = clampArcherCadence(state.cadence + amount);
  return { ...state, cadence, perfectRhythm: state.perfectRhythm || cadence >= ARCHER_CADENCE_MAX };
}
export function loseArcherCadence(state: ArcherCombatState, amount: number): ArcherCombatState {
  return { ...state, cadence: clampArcherCadence(state.cadence - Math.max(0, amount)) };
}
export function consumePerfectRhythm(state: ArcherCombatState): ArcherCombatState {
  return state.perfectRhythm ? { ...state, perfectRhythm: false, cadence: 2 } : state;
}
export function gainArcherSteps(state: ArcherCombatState, amount = 1): ArcherCombatState {
  return { ...state, steps: clampArcherSteps(state.steps + amount) };
}
export function consumeArcherSteps(state: ArcherCombatState, amount: number): { state: ArcherCombatState; consumed: number } {
  const consumed = Math.min(clampArcherSteps(state.steps), Math.max(0, Math.trunc(amount)));
  return { state: { ...state, steps: state.steps - consumed }, consumed };
}
export function prepareArcherReflex(state: ArcherCombatState): ArcherCombatState {
  return { ...state, reflexActionsLeft: ARCHER_REFLEX_ACTIONS };
}
export function consumeArcherReflex(state: ArcherCombatState): ArcherCombatState {
  return { ...state, reflexActionsLeft: 0 };
}
export function advanceArcherReflex(state: ArcherCombatState): ArcherCombatState {
  return { ...state, reflexActionsLeft: Math.max(0, state.reflexActionsLeft - 1) };
}

export function scheduleInFlightArrow(
  state: ArcherCombatState,
  snapshot: Omit<InFlightArrow, 'id' | 'createdOrder'>,
): ArcherCombatState {
  if (state.arrows.length >= ARCHER_FLIGHT_MAX) return state;
  const id = state.nextArrowId;
  const arrow: InFlightArrow = { ...snapshot, id, createdOrder: id };
  return { ...state, arrows: [...state.arrows, arrow], nextArrowId: id + 1 };
}
export function scheduleInFlightArrows(
  state: ArcherCombatState,
  snapshots: Array<Omit<InFlightArrow, 'id' | 'createdOrder'>>,
): ArcherCombatState {
  return snapshots.reduce((current, snapshot) => scheduleInFlightArrow(current, snapshot), state);
}

/** Advance only arrows present at the beginning of the action. */
export function advanceInFlightArrows(state: ArcherCombatState, existingIds: number[], amount = 1): { state: ArcherCombatState; landed: InFlightArrow[] } {
  const ids = new Set(existingIds);
  const next: InFlightArrow[] = [];
  const landed: InFlightArrow[] = [];
  for (const arrow of state.arrows) {
    if (!ids.has(arrow.id)) { next.push(arrow); continue; }
    const remaining = arrow.actionsRemaining - amount;
    if (remaining <= 0) landed.push({ ...arrow, actionsRemaining: remaining });
    else next.push({ ...arrow, actionsRemaining: remaining });
  }
  landed.sort((a, b) => a.createdOrder - b.createdOrder);
  return { state: { ...state, arrows: next }, landed };
}

/** Align the oldest and newest timers, preserving deterministic creation order. */
export function alignInFlightArrows(state: ArcherCombatState): ArcherCombatState {
  if (state.arrows.length < 2) return state;
  const sorted = [...state.arrows].sort((a, b) => a.actionsRemaining - b.actionsRemaining || a.createdOrder - b.createdOrder);
  const low = sorted[0];
  const high = sorted[sorted.length - 1];
  if (low.actionsRemaining === high.actionsRemaining) return state;
  const next = state.arrows.map((arrow) => arrow.id === low.id
    ? { ...arrow, actionsRemaining: Math.min(4, arrow.actionsRemaining + 1) }
    : arrow.id === high.id
      ? { ...arrow, actionsRemaining: Math.max(1, arrow.actionsRemaining - 1) }
      : arrow);
  return { ...state, arrows: next };
}
export function accelerateOldestArrow(state: ArcherCombatState, amount = 1): ArcherCombatState {
  if (!state.arrows.length) return state;
  const oldest = [...state.arrows].sort((a, b) => a.createdOrder - b.createdOrder)[0];
  return { ...state, arrows: state.arrows.map((arrow) => arrow.id === oldest.id ? { ...arrow, actionsRemaining: arrow.actionsRemaining - amount } : arrow) };
}
export function convergenceMultiplier(index: number): number {
  return 1 + Math.max(0, Math.min(3, Math.trunc(index))) * 0.10;
}
export function archerAttributeBonus(rate: number, total: number, cap: number): number {
  return Math.min(Math.max(0, cap), Math.max(0, total) * Math.max(0, rate));
}
export function archerDexBonus(total: number, cap = 0.02): number { return archerAttributeBonus(0.0008, total, cap); }
export function archerAgiBonus(total: number, cap = 0.02): number { return archerAttributeBonus(0.0008, total, cap); }
export function archerLukBonus(total: number, cap = 0.02): number { return archerAttributeBonus(0.0008, total, cap); }

/** Small helper used by the combat layer to construct a stable launch snapshot. */
export function flightSnapshotFromAbility(ab: AbilityDef, stats: { atk: number; accuracy: number; critChance: number; critDmgMult: number; defPenPct: number }, distance: number, dmgMult: number, actionsRemaining: number): Omit<InFlightArrow, 'id' | 'createdOrder'> {
  return {
    sourceAbilityId: ab.id, sourceName: ab.name, atk: stats.atk,
    accuracy: stats.accuracy + (clampArcherDistance(distance) === 3 ? 0.04 : clampArcherDistance(distance) === 2 ? 0.02 : 0),
    critChance: stats.critChance,
    critDmgMult: stats.critDmgMult + (clampArcherDistance(distance) === 3 ? 0.05 : 0),
    defPenPct: stats.defPenPct, dmgMult, actionsRemaining,
  };
}
