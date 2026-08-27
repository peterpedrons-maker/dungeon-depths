import type { AbilityDef } from '../types/game';

export const ROGUE_IMAGE_MAX = 2;
export const ROGUE_STEALTH_MAIN_LIMIT = 3;
export const ROGUE_EXPOSED_MAIN_LIMIT = 3;
export const ROGUE_TRICK_MAIN_LIMIT = 3;
export const ROGUE_AMBUSH_ACCURACY = 0.08;
export const ROGUE_AMBUSH_CRIT = 0.08;
export const ROGUE_AMBUSH_DEF_PEN = 0.10;
export const ROGUE_ADVANTAGE_ACCURACY = 0.05;
export const ROGUE_ADVANTAGE_MASTER_ACCURACY = 0.08;
export const ROGUE_TIME_STEAL_DELAY = 0.18;

// Registro de design para o futuro Attribute System V2. Não altera nenhuma
// fórmula atual: DES geral; DES+SOR no Assassino; DES+AGI no Dançarino;
// DES+SOR/AGI no Trapaceiro.
export const ROGUE_FUTURE_ATTRIBUTE_PROFILE = {
  general: ['dex'], assassin: ['dex', 'luk'], bladeDancer: ['dex', 'agi'], trickster: ['dex', 'luk', 'agi'],
} as const;

export type RogueTrickKind = 'feint' | 'loaded_die';
export interface RoguePreparedTrick {
  kind: RogueTrickKind;
  actionsLeft: number;
  sourceAbilityId: string;
}

export interface LoadedDieResult {
  hit: boolean;
  saved: boolean;
  failed: boolean;
}

export function clampImages(value: number): number {
  return Math.max(0, Math.min(ROGUE_IMAGE_MAX, Math.trunc(value)));
}

export function prepareTrick(kind: RogueTrickKind, sourceAbilityId: string, duration = ROGUE_TRICK_MAIN_LIMIT): RoguePreparedTrick {
  return { kind, sourceAbilityId, actionsLeft: Math.max(1, Math.trunc(duration)) };
}

export function loadedDieResult(firstHit: boolean, secondHit: boolean): LoadedDieResult {
  if (firstHit) return { hit: true, saved: false, failed: false };
  if (secondHit) return { hit: true, saved: true, failed: false };
  return { hit: false, saved: false, failed: true };
}

export function imageEchoCoefficient(baseDirectCoefficient: number, ratio: number): number {
  return Math.min(0.80, Math.max(0, baseDirectCoefficient * ratio));
}

export function synchronizedTotal(baseDirectCoefficient: number, images: number, ratio: number): number {
  return baseDirectCoefficient + clampImages(images) * imageEchoCoefficient(baseDirectCoefficient, ratio);
}

export function advantageAccuracy(masterImproviser: boolean): number {
  return masterImproviser ? ROGUE_ADVANTAGE_MASTER_ACCURACY : ROGUE_ADVANTAGE_ACCURACY;
}

export function silentExecutionCoefficient(exposed: boolean, hpPct: number): number | null {
  const low = hpPct <= 0.30;
  if (exposed && low) return 2.85;
  if (exposed) return 2.55;
  if (low) return 2.35;
  return null;
}

export function aceInTheSleeveCoefficient(advantage: boolean, hpPct: number, masterImproviser: boolean): number | null {
  const low = hpPct <= 0.25;
  if (!advantage && !low) return null;
  const base = advantage && low ? 2.75 : advantage ? 2.55 : 2.20;
  return base + (advantage && masterImproviser ? 0.10 : 0);
}

export function firstEligibleQuick(
  abilities: AbilityDef[],
  cooldowns: Record<string, number>,
  eligible: (ability: AbilityDef) => boolean,
): AbilityDef | null {
  return abilities.find((ability) => ability.actionType === 'quick' && (cooldowns[ability.id] ?? 0) <= 0 && eligible(ability)) ?? null;
}

export function actionSequence(mainCompleted: boolean, quickAvailable: boolean): Array<'main' | 'quick'> {
  if (!mainCompleted) return [];
  return quickAvailable ? ['main', 'quick'] : ['main'];
}
