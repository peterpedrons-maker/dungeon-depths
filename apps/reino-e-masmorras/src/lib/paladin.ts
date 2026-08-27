export type PaladinVirtue = 'justice' | 'courage' | 'mercy';

export const PALADIN_VIRTUES: readonly PaladinVirtue[] = ['justice', 'courage', 'mercy'];
export const PALADIN_LITURGY_MAX_ACTIONS = 4;
export const PALADIN_CONVICTION_MAX = 3;
export const PALADIN_AEGIS_DURATION = 3;
export const PALADIN_RADIANT_WIS_RATE = 0.005;
export const PALADIN_RADIANT_WIS_CAP = 0.15;
export const PALADIN_AEGIS_ATTR_RATE = 0.0008;
export const PALADIN_AEGIS_ATTR_CAP = 0.02;
export const PALADIN_REDEMPTION_VIT_CAP = 0.03;

export const PALADIN_PATH_IDS = ['voto', 'martelo', 'luz'] as const;
export const PALADIN_ATTRIBUTE_INDICES = [0, 1, 2, 3, 5, 7, 11] as const;
export const PALADIN_PASSIVE_INDICES = [6, 8, 14] as const;
export const PALADIN_ACTIVE_INDICES = [4, 9, 10, 12, 13] as const;

export interface PaladinVirtueSet {
  justice: boolean;
  courage: boolean;
  mercy: boolean;
}

export interface PaladinLiturgyState {
  virtues: PaladinVirtueSet;
  regent: PaladinVirtue | null;
  actionsLeft: number;
  skipNextAdvance: boolean;
}

export interface PaladinVerdictSnapshot {
  virtues: PaladinVirtueSet;
  conviction: number;
  regent: PaladinVirtue | null;
  full: boolean;
}

export interface PaladinAegis {
  sourceAbilityId: string;
  reductionPct: number;
  maxHpCapPct: number;
  ticksLeft: number;
  hitsRemaining: number;
  maxHits: number;
  secondHitEfficiency: number;
}

export interface PaladinAegisResolution {
  damage: number;
  absorbed: number;
  aegis: PaladinAegis | null;
  consumed: boolean;
}

export function emptyPaladinVirtues(): PaladinVirtueSet {
  return { justice: false, courage: false, mercy: false };
}

export function createPaladinLiturgyState(): PaladinLiturgyState {
  return { virtues: emptyPaladinVirtues(), regent: null, actionsLeft: 0, skipNextAdvance: false };
}

export function paladinConviction(virtues: PaladinVirtueSet): number {
  return PALADIN_VIRTUES.reduce((total, virtue) => total + (virtues[virtue] ? 1 : 0), 0);
}

export function invokePaladinVirtue(state: PaladinLiturgyState, virtue: PaladinVirtue): PaladinLiturgyState {
  const startsLiturgy = state.actionsLeft <= 0 || paladinConviction(state.virtues) === 0;
  const alreadyActive = !startsLiturgy && state.virtues[virtue];
  const virtues = startsLiturgy ? emptyPaladinVirtues() : { ...state.virtues };
  virtues[virtue] = true;
  const actionsLeft = startsLiturgy
    ? PALADIN_LITURGY_MAX_ACTIONS
    : alreadyActive
      ? state.actionsLeft
      : Math.min(PALADIN_LITURGY_MAX_ACTIONS, state.actionsLeft + 1);
  return {
    virtues,
    regent: virtue,
    actionsLeft,
    skipNextAdvance: startsLiturgy || state.skipNextAdvance,
  };
}

export function invokePaladinVirtues(state: PaladinLiturgyState, virtues: readonly PaladinVirtue[]): PaladinLiturgyState {
  return virtues.reduce((current, virtue) => invokePaladinVirtue(current, virtue), state);
}

export function advancePaladinLiturgy(state: PaladinLiturgyState): PaladinLiturgyState {
  if (state.actionsLeft <= 0) return createPaladinLiturgyState();
  if (state.skipNextAdvance) return { ...state, skipNextAdvance: false };
  const actionsLeft = state.actionsLeft - 1;
  return actionsLeft > 0 ? { ...state, actionsLeft } : createPaladinLiturgyState();
}

export function consumePaladinVerdict(state: PaladinLiturgyState): { snapshot: PaladinVerdictSnapshot; state: PaladinLiturgyState } {
  const conviction = paladinConviction(state.virtues);
  return {
    snapshot: {
      virtues: { ...state.virtues }, conviction, regent: state.regent,
      full: conviction === PALADIN_CONVICTION_MAX,
    },
    state: createPaladinLiturgyState(),
  };
}

export function createPaladinAegis(
  sourceAbilityId: string,
  reductionPct: number,
  maxHpCapPct: number,
  hits = 1,
  ticksLeft = PALADIN_AEGIS_DURATION,
): PaladinAegis {
  const safeHits = Math.max(1, Math.trunc(hits));
  return {
    sourceAbilityId,
    reductionPct: Math.max(0, reductionPct),
    maxHpCapPct: Math.max(0, maxHpCapPct),
    ticksLeft: Math.max(1, Math.trunc(ticksLeft)),
    hitsRemaining: safeHits,
    maxHits: safeHits,
    secondHitEfficiency: 0.5,
  };
}

export function paladinAegisReduction(
  aegis: PaladinAegis,
  incomingDamage: number,
  effectiveMaxHp: number,
  source: 'direct' | 'dot' = 'direct',
): PaladinAegisResolution {
  const incoming = Math.max(0, incomingDamage);
  if (source !== 'direct' || incoming <= 0) return { damage: incoming, absorbed: 0, aegis, consumed: false };
  const secondHit = aegis.maxHits > 1 && aegis.hitsRemaining < aegis.maxHits;
  const efficiency = secondHit ? aegis.secondHitEfficiency : 1;
  const absorbed = Math.min(
    incoming,
    Math.round(incoming * aegis.reductionPct * efficiency),
    Math.round(Math.max(0, effectiveMaxHp) * aegis.maxHpCapPct * efficiency),
  );
  const hitsRemaining = aegis.hitsRemaining - 1;
  return {
    damage: Math.max(0, incoming - absorbed),
    absorbed,
    aegis: hitsRemaining > 0 ? { ...aegis, hitsRemaining } : null,
    consumed: true,
  };
}

export function paladinRadiantBonusPct(wisdom: number, efficiency = 1): number {
  return Math.min(PALADIN_RADIANT_WIS_CAP, Math.max(0, wisdom) * PALADIN_RADIANT_WIS_RATE * Math.max(0, efficiency));
}

export function paladinAegisAttributeCapBonus(attribute: number): number {
  return Math.min(PALADIN_AEGIS_ATTR_CAP, Math.max(0, attribute) * PALADIN_AEGIS_ATTR_RATE);
}

export function paladinRedemptionVitBonusPct(vitality: number): number {
  return Math.min(PALADIN_REDEMPTION_VIT_CAP, Math.max(0, vitality) * PALADIN_AEGIS_ATTR_RATE);
}

export function paladinActiveHealAmount(maxHp: number, basePct: number, wisdom: number, vitality: number, lowHpBonus = 0): number {
  const efficiency = 1 + paladinRadiantBonusPct(wisdom) + paladinRedemptionVitBonusPct(vitality) + Math.max(0, lowHpBonus);
  return Math.max(0, Math.round(Math.max(0, maxHp) * Math.max(0, basePct) * efficiency));
}
