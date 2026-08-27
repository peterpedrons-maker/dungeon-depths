// Regras puras do redesign do Bruxo: Dívida Profana, Nome Verdadeiro,
// Crédito Sombrio e Estigmas. O componente de combate apenas aplica o
// resultado destas funções ao estado vivo.
export type WarlockPath = 'maldicao' | 'pacto' | 'corrupcao';
export type WarlockCollectionKind = 'normal' | 'early' | 'forced';
export interface WarlockPlayerState {
  debt: number;
  credit: number;
  scars: number;
  forgeryReady: boolean;
  scarInsightReady: boolean;
}
export interface WarlockEnemyNameState {
  bound: boolean;
  nameFragments: number;
  firstLetterUsed: boolean;
  mandamento: boolean;
  deadlineDmgReduction: number;
}
export interface WarlockDebtProjection {
  effectiveDebtGain: number;
  usesForgery: boolean;
  usesCredit: boolean;
  willOvercontract: boolean;
  debtForPower: number;
  collectionHpCost: number;
  selfHpCost: number;
  safeToCast: boolean;
}

export const WARLOCK_DEBT_MAX = 6;
export const WARLOCK_BORROWED_POWER_PCT = 0.015;
export const WARLOCK_OVERCONTRACT_DAMAGE_PCT = 0.15;
export const WARLOCK_OVERCONTRACT_COLLECTION_PCT = 0.10;
export const WARLOCK_EARLY_COLLECTION_PCT = 0.07;
export const WARLOCK_FORCED_COLLECTION_PCT = 0.12;

export function clampWarlockDebt(value: number): number {
  return Math.max(0, Math.min(WARLOCK_DEBT_MAX, Math.round(value)));
}
export function clampWarlockCredit(value: number, lawyer = false): number {
  return Math.max(0, Math.min(lawyer ? 3 : 2, Math.round(value)));
}
export function clampWarlockScars(value: number): number { return Math.max(0, Math.min(3, Math.round(value))); }
export function clampNameFragments(value: number): number { return Math.max(0, Math.min(3, Math.round(value))); }
export function createWarlockPlayerState(): WarlockPlayerState {
  return { debt: 0, credit: 0, scars: 0, forgeryReady: false, scarInsightReady: false };
}
export function createWarlockEnemyNameState(): WarlockEnemyNameState {
  return { bound: false, nameFragments: 0, firstLetterUsed: false, mandamento: false, deadlineDmgReduction: 0 };
}
export function resetWarlockEnemy(): WarlockEnemyNameState { return createWarlockEnemyNameState(); }

/** Projects every cast cost without mutating either player or enemy state. */
export function projectWarlockCast(args: {
  debt: number; debtGain?: number; credit?: number; forgeryReady?: boolean;
  maxHp: number; currentHp: number; selfHpCostPct?: number;
  collectionPct?: number; lawyer?: boolean;
}): WarlockDebtProjection {
  const debt = clampWarlockDebt(args.debt);
  const gain = Math.max(0, Math.floor(args.debtGain ?? 0));
  const usesForgery = gain > 0 && !!args.forgeryReady;
  const afterForgery = Math.max(0, gain - (usesForgery ? 1 : 0));
  const usesCredit = afterForgery > 0 && (args.credit ?? 0) > 0;
  const afterCredit = Math.max(0, afterForgery - (usesCredit ? 1 : 0));
  const effectiveDebtGain = Math.min(afterCredit, WARLOCK_DEBT_MAX - debt);
  const willOvercontract = afterCredit > 0 && debt >= WARLOCK_DEBT_MAX;
  const debtForPower = Math.min(WARLOCK_DEBT_MAX, debt + afterCredit + (usesCredit && args.lawyer ? 1 : 0));
  const collectionHpCost = willOvercontract ? Math.ceil(args.maxHp * WARLOCK_OVERCONTRACT_COLLECTION_PCT) : 0;
  const selfHpCost = Math.ceil(args.maxHp * Math.max(0, args.selfHpCostPct ?? 0));
  return {
    effectiveDebtGain, usesForgery, usesCredit, willOvercontract,
    debtForPower, collectionHpCost, selfHpCost,
    safeToCast: args.currentHp - selfHpCost - collectionHpCost > 0,
  };
}

export function borrowedPowerPct(debtForPower: number, path: WarlockPath, startsWithThreeScars = false): number {
  const rate = path === 'corrupcao' && startsWithThreeScars ? 0.02 : WARLOCK_BORROWED_POWER_PCT;
  return Math.min(0.12, Math.max(0, debtForPower) * rate);
}
export function overcontractDamagePct(path: WarlockPath, startsWithThreeScars = false): number {
  return path === 'corrupcao' && startsWithThreeScars ? 0.20 : WARLOCK_OVERCONTRACT_DAMAGE_PCT;
}
export function applyWarlockDebt(state: WarlockPlayerState, projection: WarlockDebtProjection): WarlockPlayerState {
  return { ...state, debt: clampWarlockDebt(state.debt + projection.effectiveDebtGain), credit: Math.max(0, state.credit - (projection.usesCredit ? 1 : 0)), forgeryReady: projection.usesForgery ? false : state.forgeryReady };
}
export function payWarlockDebt(state: WarlockPlayerState, amount: number): WarlockPlayerState {
  return { ...state, debt: clampWarlockDebt(state.debt - Math.max(0, amount)) };
}
export function setWarlockDebt(state: WarlockPlayerState, value: number): WarlockPlayerState { return { ...state, debt: clampWarlockDebt(value) }; }
export function grantWarlockCredit(state: WarlockPlayerState, amount = 1, lawyer = false): WarlockPlayerState { return { ...state, credit: clampWarlockCredit(state.credit + amount, lawyer) }; }
export function consumeTrueName(state: WarlockPlayerState): WarlockPlayerState { return { ...state, forgeryReady: true }; }
export function addNameFragment(enemy: WarlockEnemyNameState, amount = 1): WarlockEnemyNameState { return { ...enemy, nameFragments: clampNameFragments(enemy.nameFragments + amount) }; }
export function consumeTrueNameAndRefragment(enemy: WarlockEnemyNameState, landed: boolean): WarlockEnemyNameState {
  return { ...enemy, nameFragments: landed ? 1 : 0 };
}
export function bindWarlockEnemy(enemy: WarlockEnemyNameState): WarlockEnemyNameState { return { ...enemy, bound: true }; }
export function markFirstNameHit(enemy: WarlockEnemyNameState): WarlockEnemyNameState { return { ...enemy, firstLetterUsed: true }; }
export function consumeMandamento(enemy: WarlockEnemyNameState): WarlockEnemyNameState { return { ...enemy, mandamento: false }; }
export function prepareMandamento(enemy: WarlockEnemyNameState): WarlockEnemyNameState { return { ...enemy, mandamento: true }; }
export function addWarlockScar(state: WarlockPlayerState, paidHp: number, effectiveMaxHp: number, node6 = true, node8 = true): WarlockPlayerState {
  if (!node6 || effectiveMaxHp <= 0 || paidHp < effectiveMaxHp * 0.05) return state;
  const next = clampWarlockScars(state.scars + 1);
  return { ...state, scars: next, scarInsightReady: node8 ? true : state.scarInsightReady };
}
export function consumeScars(state: WarlockPlayerState): { state: WarlockPlayerState; snapshot: number } {
  return { state: { ...state, scars: 0, scarInsightReady: false }, snapshot: state.scars };
}
export function collectionAmount(maxHp: number, kind: WarlockCollectionKind): number {
  const pct = kind === 'forced' ? WARLOCK_FORCED_COLLECTION_PCT : kind === 'early' ? WARLOCK_EARLY_COLLECTION_PCT : WARLOCK_OVERCONTRACT_COLLECTION_PCT;
  return Math.ceil(Math.max(0, maxHp) * pct);
}
export function resolveCollection(state: WarlockPlayerState, maxHp: number, kind: WarlockCollectionKind, actualHp = collectionAmount(maxHp, kind)): { state: WarlockPlayerState; hpPaid: number; scarCreated: boolean } {
  const hpPaid = Math.max(0, actualHp);
  const next = addWarlockScar(state, hpPaid, maxHp);
  return { state: next, hpPaid, scarCreated: next.scars > state.scars };
}
export function warlockDebtAfterPayment(state: WarlockPlayerState, pay?: number, setAfter?: number): WarlockPlayerState {
  return setAfter === undefined ? payWarlockDebt(state, pay ?? 0) : setWarlockDebt(state, setAfter);
}
