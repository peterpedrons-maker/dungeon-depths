// Necromante — regras puras e estruturas genéricas de recurso, stacks,
// efeitos periódicos e invocações. O combate e os testes usam a mesma fonte.
export const SOUL_RESOURCE_ID = 'necromante:souls';
export const DECOMPOSITION_STACK_ID = 'necromante:decomposition';
export const PLAGUE_EFFECT_ID = 'necromante:plague';
export const SOUL_MAX = 6;
export const DECOMPOSITION_MAX = 5;
export const DECOMPOSITION_DURATION = 4;
export const PLAGUE_BASE_MULT = 0.16;
export const PLAGUE_DEVASTATING_MULT = 0.20;
export const SOUL_THRESHOLDS = [0.75, 0.50, 0.25] as const;

export interface CombatResourceState { id: string; value: number; max: number; }
export interface EnemyStackInstance { id: string; stacks: number; ticksRemaining: number; maxStacks: number; }
export interface PeriodicEffectInstance { id: string; sourceId: string; snapshotPower: number; dmgMultiplier: number; ticksRemaining: number; tags: string[]; canCrit: boolean; bypassDefense: boolean; }
export interface SummonInstance { id: string; ownerClassId: string; sourceAbilityId: string; attackIntervalMs: number; elapsedMs: number; attacksRemaining: number; maxAttacks: number; damageType: 'physical' | 'magical'; damageMultiplier: number; canCrit: boolean; canLifesteal: boolean; tags: string[]; }

export function clampResource(value: number, max = SOUL_MAX): number { return Math.max(0, Math.min(max, Math.floor(value))); }
export function soulsForCrossedThresholds(beforeHp: number, afterHp: number, maxHp: number, crossed: ReadonlySet<number>): { gained: number; crossed: Set<number> } {
  const next = new Set(crossed); let gained = 0;
  for (const threshold of SOUL_THRESHOLDS) if (!next.has(threshold) && beforeHp / maxHp > threshold && afterHp / maxHp <= threshold) { next.add(threshold); gained += 1; }
  return { gained, crossed: next };
}
export function soulsForNextEnemy(current: number, carryThree: boolean): number { return Math.max(1, Math.min(current, carryThree ? 3 : 2)); }
export function applyEnemyStack(current: EnemyStackInstance | undefined, amount: number): EnemyStackInstance { return { id: DECOMPOSITION_STACK_ID, stacks: Math.min(DECOMPOSITION_MAX, (current?.stacks ?? 0) + amount), ticksRemaining: DECOMPOSITION_DURATION, maxStacks: DECOMPOSITION_MAX }; }
export function plagueTickDamage(effect: PeriodicEffectInstance, decomposition: number): number { return Math.max(1, Math.round(effect.snapshotPower * effect.dmgMultiplier * (1 + Math.min(DECOMPOSITION_MAX, decomposition) * 0.04))); }
export function makeBoneServant(id: string, sourceAbilityId: string, attacks: number, speedBonus = 0): SummonInstance { return { id, ownerClassId: 'necromante', sourceAbilityId, attackIntervalMs: 3000 / (1 + speedBonus), elapsedMs: 0, attacksRemaining: attacks, maxAttacks: attacks, damageType: 'magical', damageMultiplier: 0.38, canCrit: false, canLifesteal: false, tags: ['undead', 'bone-servant'] }; }
export function advanceSummonClock(summon: SummonInstance, elapsedMs: number): { next: SummonInstance; attacks: number } { let accumulated = summon.elapsedMs + elapsedMs; let attacks = 0; while (accumulated >= summon.attackIntervalMs && attacks < summon.attacksRemaining) { accumulated -= summon.attackIntervalMs; attacks += 1; } return { next: { ...summon, elapsedMs: accumulated, attacksRemaining: summon.attacksRemaining - attacks }, attacks }; }
export function reaperExecuteMultiplier(enemyHpPct: number, base: number, threshold: number, perStep: number, cap: number): number { const steps = Math.floor(Math.max(0, threshold - enemyHpPct) / 0.05 + 1e-9); return Math.min(cap, base + steps * perStep); }
