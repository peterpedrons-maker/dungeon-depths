// Guerreiro — regras puras de Postura, Guarda Quebrada, Aparo e leitura.
// O painel de combate e os testes usam estas mesmas funções.
export const POSTURE_MAX = 100;
export const POSTURE_BASIC_DAMAGE = 6;
export const POSTURE_NATURAL_RECOVERY = 8;
export const GUARD_BREAK_ACTIONS = 2;
export const GUARD_BREAK_MAX_ACTIONS = 3;
export const GUARD_BREAK_TICKS = 4;
export const GUARD_BREAK_RESET = 75;
export const GUARD_BREAK_RESET_VANGUARD = 65;
export const GUARD_BREAK_ACCURACY_BONUS = 0.10;
export const GUARD_BREAK_DEF_PEN = 0.20;
export const PARRY_REDUCTION_CAP = 0.45;

export type PostureBand = 'firm' | 'unstable' | 'open' | 'broken';
export type RiposteKind = 'normal' | 'heavy' | null;
export type ReadingKind = 'normal' | 'perfect' | null;

export interface WarriorEnemyState {
  current: number;
  max: number;
  guardBroken: boolean;
  offensiveActionsLeft: number;
  ticksLeft: number;
  pressureRecoveryPending: boolean;
  suppressedActionsLeft: number;
  zeroRecoveryPending: boolean;
  vanguardFirstHitUsed: boolean;
  duelistFirmFirstHitUsed: boolean;
  perfectCounterAccuracyPending: boolean;
}

export interface PreparedGuardState {
  sourceAbilityId: string;
  name: string;
  remainingParries: number;
  damageReductionPct: number;
  postureDamage: number;
  ticksLeft: number;
  canGenerateRiposte: boolean;
  parriesResolved: number;
}

export function createWarriorEnemyState(): WarriorEnemyState {
  return {
    current: POSTURE_MAX, max: POSTURE_MAX, guardBroken: false,
    offensiveActionsLeft: 0, ticksLeft: 0,
    pressureRecoveryPending: false, suppressedActionsLeft: 0,
    zeroRecoveryPending: false, vanguardFirstHitUsed: false,
    duelistFirmFirstHitUsed: false, perfectCounterAccuracyPending: false,
  };
}

export function postureBand(value: number): PostureBand {
  if (value <= 0) return 'broken';
  if (value <= 33) return 'open';
  if (value <= 66) return 'unstable';
  return 'firm';
}

export function applyPostureDamage(current: number, amount: number, floor = 0): number {
  return Math.max(floor, Math.min(POSTURE_MAX, Math.round(current - Math.max(0, amount))));
}

export function recoverPosture(current: number, options: { pressure?: boolean; suppressed?: boolean; breathless?: boolean; zero?: boolean } = {}): number {
  if (options.zero) return 0;
  let recovery = POSTURE_NATURAL_RECOVERY;
  if (options.pressure) recovery = Math.min(recovery, 5);
  if (options.suppressed) recovery = Math.min(recovery, 4);
  if (options.breathless && current <= 50) recovery -= 2;
  return Math.max(2, recovery);
}

export function parryReduction(base: number, vit: number, technique: boolean, master: boolean): number {
  const vitBonus = technique ? Math.min(0.08, Math.max(0, vit) * 0.0015) : 0;
  return Math.min(PARRY_REDUCTION_CAP, base + (master ? 0.05 : 0) + vitBonus);
}

export function duelPostureDamage(base: number, dex: number, enabled: boolean): number {
  return Math.round(base * (1 + (enabled ? Math.min(0.12, Math.max(0, dex) * 0.003) : 0)));
}

export function crossesLowerBand(before: number, after: number): boolean {
  const rank: Record<PostureBand, number> = { firm: 3, unstable: 2, open: 1, broken: 0 };
  return rank[postureBand(after)] < rank[postureBand(before)];
}

export function bandValue<T>(values: Partial<Record<PostureBand, T>> | undefined, current: PostureBand | number, fallback: T): T {
  const band = typeof current === 'number' ? postureBand(current) : current;
  return values?.[band] ?? fallback;
}
