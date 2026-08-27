/** Pure helpers for Feiticeiro's session-only resources. */
export type SorcererState = { pulse: number; resonance: number; control: number };
export type SorcererEnemyState = { fractures: number; spontaneousUsed: boolean; correctionUsed: boolean };
export const SORCERER_PULSE_MAX = 6;
export const SORCERER_RESONANCE_MAX = 2;
export const SORCERER_CONTROL_MAX = 2;
export const SORCERER_FRACTURE_MAX = 3;
export const ECHO_POTENCY = 0.40;

export const createSorcererState = (): SorcererState => ({ pulse: 0, resonance: 0, control: 0 });
export const createSorcererEnemyState = (): SorcererEnemyState => ({ fractures: 0, spontaneousUsed: false, correctionUsed: false });
export const clampPulse = (n: number) => Math.max(0, Math.min(SORCERER_PULSE_MAX, Math.trunc(n)));
export const clampResonance = (n: number) => Math.max(0, Math.min(SORCERER_RESONANCE_MAX, Math.trunc(n)));
export const clampControl = (n: number) => Math.max(0, Math.min(SORCERER_CONTROL_MAX, Math.trunc(n)));
export const clampFractures = (n: number) => Math.max(0, Math.min(SORCERER_FRACTURE_MAX, Math.trunc(n)));

export function beginActiveCast(state: SorcererState): { awakened: boolean; next: SorcererState } {
  return state.pulse === SORCERER_PULSE_MAX
    ? { awakened: true, next: { ...state, pulse: 0 } }
    : { awakened: false, next: state };
}

export function resolvePulseGain(state: SorcererState, hit: boolean, crit: boolean, resonanceBonus = 0) {
  const innate = 1 + (hit ? 1 : 0) + (crit ? 1 : 0);
  const raw = state.pulse + innate;
  return { state: { ...state, pulse: clampPulse(raw + resonanceBonus) }, innateGain: innate, overflow: Math.max(0, raw - SORCERER_PULSE_MAX) };
}

export function consumeResonance(state: SorcererState): SorcererState {
  return state.resonance > 0 ? { ...state, resonance: state.resonance - 1 } : state;
}
export function addResonance(state: SorcererState, amount = 1): SorcererState { return { ...state, resonance: clampResonance(state.resonance + amount) }; }
export function addControl(state: SorcererState, amount = 1): SorcererState { return { ...state, control: clampControl(state.control + amount) }; }
export function consumeControl(state: SorcererState, amount = 1): SorcererState { return { ...state, control: clampControl(state.control - amount) }; }

export function addFractures(state: SorcererEnemyState, amount = 1): SorcererEnemyState { return { ...state, fractures: clampFractures(state.fractures + amount) }; }
export function consumeFractures(state: SorcererEnemyState, amount = state.fractures): SorcererEnemyState { return { ...state, fractures: clampFractures(state.fractures - amount) }; }
export function rupturePenetration(fractures: number) { return clampFractures(fractures) * 0.03; }
export function collapseMultiplier(fractures: number) { return 1.55 + clampFractures(fractures) * 0.25; }
export function supernovaHitMultipliers(fractures: number) { return [0.70, 0.70, 0.70 + clampFractures(fractures) * 0.12]; }
export function echoMultipliers(base: number | number[]) { return Array.isArray(base) ? base.map((x) => x * ECHO_POTENCY) : base * ECHO_POTENCY; }

