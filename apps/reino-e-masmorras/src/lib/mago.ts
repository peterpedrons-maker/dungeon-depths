// ── Mago redesign — Runas Arcanas / Calor / Estado Térmico / Circuito ──
// Pure rules live here so combat and tests use the same values.

export const RUNE_MAX = 2;
export const HEAT_OVERHEAT_AT = 100;
export const HEAT_AFTER_OVERHEAT = 50;
export const HEAT_NEW_ENEMY_CAP = 40;
export const HEAT_NON_FIRE_COOLING = 10;
export const HEAT_DISSIPATION_COOLING = 15;

export type ThermalState = 'normal' | 'chilled' | 'fragile' | 'frozen';
export type MagePolarity = 'none' | 'positive' | 'negative';

export function nextRunes(current: number): { next: number; amplified: boolean } {
  return current >= RUNE_MAX ? { next: 0, amplified: true } : { next: Math.max(0, current) + 1, amplified: false };
}

export function nextRunesForEnemy(previous: number): number { return Math.min(Math.max(0, previous), 1); }
export function heatBand(heat: number): 'neutral' | 'warm' | 'incandescent' | 'limit' {
  if (heat >= 90) return 'limit';
  if (heat >= 60) return 'incandescent';
  if (heat >= 30) return 'warm';
  return 'neutral';
}
export function fireDamageBonus(heat: number): number {
  return heat >= 90 ? 0.15 : heat >= 60 ? 0.09 : heat >= 30 ? 0.04 : 0;
}
export function advanceThermal(state: ThermalState, amount: number): ThermalState {
  const states: ThermalState[] = ['normal', 'chilled', 'fragile', 'frozen'];
  return states[Math.min(states.length - 1, states.indexOf(state) + Math.max(0, amount))];
}
export function thermalShatterMult(state: ThermalState): number {
  return state === 'frozen' ? 2.75 : state === 'fragile' ? 2.15 : state === 'chilled' ? 1.55 : 0;
}
export function thermalAfterFrozenEnds(perpetual: boolean): ThermalState { return perpetual ? 'fragile' : 'chilled'; }
export function thermalAfterShatter(state: ThermalState, perpetual: boolean): ThermalState {
  return state === 'frozen' && perpetual ? 'chilled' : 'normal';
}
export function circuitAfterCast(last: MagePolarity, current: MagePolarity, circuit: number, perfect: boolean) {
  if (last === 'none') return { last: current, circuit, closed: false };
  const closed = perfect || last !== current;
  return { last: current, circuit: Math.max(0, Math.min(3, circuit + (closed ? 1 : -1))), closed };
}
export function circuitPulseMult(stage: number, master: boolean): number {
  if (stage >= 3) return master ? 0.40 : 0.32;
  return stage === 2 ? 0.22 : 0.15;
}
