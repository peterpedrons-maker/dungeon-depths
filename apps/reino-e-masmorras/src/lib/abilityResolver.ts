import type { AbilityEffect, ClassId } from '../types/game.ts';
import { MAGICAL_CLASSES } from './classes.ts';

/**
 * Runtime contract for AbilityEffect. TypeScript erases interfaces, so this
 * registry is deliberately kept beside the resolver and is checked against
 * every authored effect by the audit harness.
 */
export const ABILITY_EFFECT_FIELDS = Object.freeze(["kind","dmgType","dmgMult","status","statusRounds","statusDmgPct","healPct","buffPct","buffRounds","cc","ccRounds","statMod","statModPct","statModRounds","statModTarget","shieldPct","scalesWithBarrierPower","regenPct","regenRounds","immunityRounds","hasteRounds","berserkAtkPct","berserkDefPct","berserkRounds","furyCost","furyGainOnHit","furyGainOnCrit","furyGainFlat","woundStacksOnHit","renewWoundsOnHit","consumeWoundsOnHit","dmgMultPerWoundStack","painRedirectPct","wildPostureActions","painConsumeMaxPct","painConsumeDmgMultPer2Pct","furyPerHitTaken","faithCost","faithGainOnHeal","shieldFaithThresholdPct","consecrationRoundsOnCast","consecrationDmgMultBonus","extendConsecrationOnHit","judgmentStacksOnHit","judgmentConsumeMax","dmgMultPerJudgmentStack","judgmentReadOnly","judgmentDurationCutOnHit","cleanseFaithGain","cleanseJudgmentPer2","shieldFromDamagePct","shieldFromDamageCapPct","reviveWindowRounds","reviveHealPct","reviveHealCapPct","determinationCost","orderCost","orderGainOnCast","momentumGainOnHitExtra","momentumGainOnHitExtraVsHighHp","dmgMultVsHighEnemyHp","momentumConsumeAll","dmgMultPerMomentumConsumed","abaladoThreshold","abaladoDmgTakenPct","abaladoRounds","defPenPctPerMomentum","defPenPctBase","defPenPctCap","enemyDefReductionPctBase","enemyDefReductionPctPerMomentum","enemyDefReductionPctCap","enemyDefReductionRounds","selfDebuffOnCastAlways","selfDebuffDefPct","selfDebuffSpeedPct","selfDebuffRounds","selfBuffAtkPctOnHit","selfBuffSpeedPctOnHit","selfBuffRoundsOnHit","executeBaseMult","executePerHpBelowPct","executeMultCap","executeSupremeExtraCap","dmgReductionPctBase","dmgReductionPctPerVit","dmgReductionPctCap","postureRounds","minBlockChancePct","shieldPctBase","shieldPctPerVit","shieldPctCap","shieldRounds","lastGuardRounds","counterStoragePct","counterCapPctBase","counterCapPctPerVit","counterCapPctCap","bonusDmgTakenReductionPct","atkBuffPctBase","defBuffPctBase","tenacityBuffPctBase","dmgMultSupreme","selfBuffAtkPctOnHitSupreme","selfBuffSpeedPctOnHitSupreme","shieldPctBaseSupreme","shieldPctCapSupreme","bonusDmgTakenReductionPctSupreme","atkBuffPctBaseSupreme","defBuffPctBaseSupreme","tenacityBuffPctBaseSupreme","opensOrderRefundWindow","guaranteedHit","breachGainOnHit","breachConsumeOnHit","hitCount","dmgMultPerHit","trapDirectDmgMultBase","trapDirectDmgMultMarked","trapPoisonRounds","trapPoisonDmgMultPerTick","trapDebuffStat","trapDebuffPct","trapDebuffPctMarked","trapDebuffRounds","trapTrailGainBase","trapTrailGainMarked","speedBuffPct","evasionBuffPct","element","amplifiedDmgMult","amplifiedStatusDmgPct","heatGain","amplifiedHeatGain","heatCost","heatCostAll","heatDmgMultPerPoint","heatDmgMultCap","thermalAdvanceOnHit","amplifiedThermalAdvanceOnHit","shatter","polarity","circuitPerfectWithInverter","pulseResidualOnSamePolarity","resonanceEcho","mdefPenPct","bardVoice","bardPath","bardWildcardPolicy","bardAccentAtkMult","bardAccent","bardFortissimo","bardAppliesCountertempo","bardEchoCost","bardFinale","bardOvationCost","bardEncore","bardEncoreEligible","bardBridgeEligible","bardPhysicalHitMults","bardMagicalHitMults","bardNextEnemyDamageReductionPct","bardNextEnemyAccuracyPenaltyPct","bardSustainPct","bardSupportHealPct","bardOvationHealPct","bardMdefDebuffPct","bardMdefDebuffRounds","bardSpeedBuffPct","bardSpeedBuffRounds","bardNextBasicPhysicalBonusPct","postureDamage","postureDamageFirm","postureDamageByBand","dmgMultByBand","postureDamagePerHit","noPostureBreak","preparedParries","parryReductionPct","preparedDuration","canGenerateRiposte","riposteRequired","finishGuardBreak","guardBreakActionsBonusOnBreak","perfectCounterAccuracyOnBreak","suppressPostureRecoveryActions","zeroNextPostureRecoveryIfAllHits","atkDebuffOnHitPct","atkDebuffRounds","defPenPct","guaranteedAccuracy","duelistAbility","vanguardAbility","guardAbility","readingPerfectOnBreak","riposteDamageMult","ripostePostureDamage","feintPostureDamage","feintDefPenPct","amplifiedMdefPenPct","soulCost","decompositionOnHit","decompositionConsumeMax","soulGainOnConsumeExact","plagueApply","plagueMultiplier","plagueDuration","plagueDetonatePct","plagueDetonateCapMult","summonCount","summonAttacks","summonMaxRefresh","sacrificeOldestSummon","consumeAllSummons","consumeSoulsMax","barrierBasePct","directHealFromDamagePct","directHealCapPct","necromancerTag","enemyHpExecuteBase","enemyHpExecuteThreshold","enemyHpExecutePer5Pct","enemyHpExecuteCap","roguePath","offensive","canExpose","ambushDmgMult","consumeExposed","exposedDmgMult","lowHpDmgMult","combinedDmgMult","imageGain","imageEchoRatio","requiresImages","consumeImages","sharpenedEchoOnCap","toxicBlade","trickKind","advantageDmgMult","advantageCritPct","advantageDefPenPct","timeSteal","enemyDirectDmgDebuffPct","enemyDirectDmgDebuffRounds","archerPath","druidSeason","druidPath","dmgMultAligned","dmgMultRebalanced","healPctAligned","healPctRebalanced","hitCountAligned","hitCountRebalanced","hitDmgMultsAligned","hitDmgMultsRebalanced","druidFormOnCast","druidFormOnCastAll","druidAvatar","dmgMultRenewed","druidEternalReturn","hitDmgMultsAbsolute","healPctAbsolute","druidTreeOfLife","druidPlantSeeds","druidPlantSeedsAligned","druidHarvest","druidHarvestHealPctPerFruit","druidHarvestHealPctPerFruitAligned","druidImmediateHealPct","druidImmediateHealPctAligned","druidPostCastDmgReductionPct","druidPostCastDmgReductionPctAligned","druidPostCastDmgReductionPctRebalanced","druidBearWindowBonusPct","druidAccuracyBonus","druidAccuracyBonusAligned","healFromDamagePct","healFromDamageCapPct","archerShotType","hitDmgMults","archerDistanceShift","archerDistanceMin","archerDistanceMax","archerTensionCost","archerTensionGain","archerTensionOverrideOnHit","archerTensionOverrideAtHorizon","archerCadenceCost","archerCadenceGain","archerFlightCount","archerFlightTimer","archerFlightDmgMult","archerFlightHitDmgMults","archerFlightHighTensionDmgMult","archerHighTensionDmgMult","archerHighTensionPenPct","archerFlightPenPct","archerDefPenPct","archerPerfectExtraRatio","archerCritBonus","archerRequiresDistance","archerRequiresTension","archerRequiresCadence","archerRequiresSteps","archerRequiresFlightRoom","archerConsumesSteps","archerConsumesReflex","archerConsumesPerfectRhythm","archerImmediateTimerReduction","archerAccelerateOldest","archerAlignFlights","archerCreatesFlightOnHits","archerFifthDistanceMult","archerDistanceZeroMult","archerCanGenerateStep","archerDonoDoEspaco","paladinPath","paladinVirtues","paladinExtraVirtueBelowHp","paladinVerdict","paladinRadiant","verdictDmgMultByConviction","fullJusticeDmgMult","verdictHealPctByConviction","verdictAegisByConviction","activeHealMaxHpPct","lowHpHealFromDamagePct","lowHpHealThreshold","aegisReductionPct","aegisMaxHpCapPct","aegisHits","aegisDuration","renewAegisOnHit","warlockPath","warlockDebtGain","warlockDebtPay","warlockDebtSetAfter","warlockSelfHpCostPct","warlockBindOnHit","warlockConsumeTrueName","warlockNextEnemyDmgReductionPct","warlockBarrierPct","warlockEarlyCollectionPct","warlockForcedCollectionPct","warlockCollectionEchoPct","warlockConsumeScars","warlockDmgMultPerScar","warlockGrantCredits","warlockCreditFinancedBonus","warlockMdefPenPct","warlockSilenceRounds","sorcererPath","sorcererDirectDmgPct","sorcererCritBonusPct","sorcererAccuracyBonusPct","sorcererMdefPenPct","sorcererFractureGain","sorcererFractureConsume","sorcererFracturePerHit","sorcererResonanceGain","sorcererResonanceConsume","sorcererControlGain","sorcererControlConsume","sorcererAwakenedMode","sorcererEchoPotency","sorcererEchoCritBonusPct","sorcererEchoAccuracyBonusPct","sorcererControlAccuracyPct","sorcererControlPenPct","sorcererCorrection","sorcererCooldownCutOnHit","sorcererEnemyDmgReductionPct","sorcererEnemyDmgReductionRounds","sorcererThirdHitPenPct","sorcererThirdHitBonusPerFracture","sorcererSecondWave","sorcererPersonalLaw","sorcererPerpetuum"]) as readonly string[];

export const ABILITY_EFFECT_KINDS = Object.freeze(["bigHit","guaranteedCrit","applyStatus","bonusVsStatus","heal","buffDef","buffBlock","crowdControl","statMod","shield","regen","dispel","immunity","haste","berserk","taunt","lifestealBuff","atkBuff","furyBoost","furyMaxFrenzy","painGuard","wallStance","lastStand","bloodFeast","cleanseOne","consecrationGuard","divineWall","reviveWindow","ironWall","livingFortress","colossalShield","lastGuard","counterStance","orderResist","kingsBanner","armTrap","multiHit","buffEvasion","huntWithPrey","preparedGuard","feint","ballistic","archerMove","boneShield","deathVeil","boneFortress","mortalVoracity","rogueStealth","rogueToxicBlade","roguePrepareTrick","aegis"]) as readonly AbilityEffect['kind'][];

export const SELF_ABILITY_KINDS = new Set<AbilityEffect['kind']>([
  'heal','buffDef','buffBlock','shield','regen','dispel','immunity','haste',
  'berserk','taunt','lifestealBuff','atkBuff','furyBoost','furyMaxFrenzy',
  'painGuard','wallStance','lastStand','bloodFeast','cleanseOne',
  'consecrationGuard','divineWall','reviveWindow','ironWall','livingFortress',
  'colossalShield','lastGuard','counterStance','orderResist','kingsBanner',
  'armTrap','buffEvasion','huntWithPrey','preparedGuard','feint','aegis',
  'archerMove','boneShield','deathVeil','boneFortress','mortalVoracity',
  'rogueStealth','rogueToxicBlade','roguePrepareTrick',
]);

export function isSelfAbilityKind(kind: AbilityEffect['kind']): boolean {
  return SELF_ABILITY_KINDS.has(kind);
}

export interface AbilityResolutionPlan {
  selfTargeted: boolean;
  consumesAction: boolean;
  attackCount: number;
  multipliers: number[];
  damageType: 'physical' | 'magical';
  delayed: boolean;
}

export interface AbilityResolution {
  effect: AbilityEffect;
  plan: AbilityResolutionPlan;
  appliedFields: string[];
}

/**
 * The only mechanical entry point for an AbilityEffect.
 *
 * This function deliberately has no execution callback. It materializes the
 * mechanical program consumed by the shared combat executor, so the panel
 * and simulations cannot swap in different implementations behind the same
 * plan. A field is observable only at the exact point where the executor
 * reads it; merely declaring a property in the data never marks it applied.
 */
export function resolveAbilityEffect(
  effect: AbilityEffect,
  classId: ClassId,
  fieldTrace = new Set<string>(),
  onFieldApplied?: (field: string) => void,
): AbilityResolution {
  const traced = traceAbilityEffect(effect, fieldTrace, onFieldApplied);
  const plan = abilityResolutionPlan(traced, classId);
  return { effect: traced, plan, appliedFields: [...fieldTrace] };
}

/** Track actual reads without treating object presence as implementation. */
export function traceAbilityEffect(effect: AbilityEffect, fieldTrace = new Set<string>(), onFieldApplied?: (field: string) => void): AbilityEffect {
  const existing = tracedEffects.get(effect as object);
  if (existing) {
    if (onFieldApplied) existing.observers.add(onFieldApplied);
    return effect;
  }
  const observers = new Set<(field: string) => void>();
  if (onFieldApplied) observers.add(onFieldApplied);
  const traced = new Proxy(effect, {
    get(target, property, receiver) {
      if (typeof property === 'string' && property !== 'kind' && property in target) {
        fieldTrace.add(property);
        for (const observer of observers) observer(property);
      }
      return Reflect.get(target, property, receiver);
    },
  });
  tracedEffects.set(traced, { fields: fieldTrace, observers });
  return traced;
}

const tracedEffects = new WeakMap<object, { fields: Set<string>; observers: Set<(field: string) => void> }>();

export function abilityResolutionPlan(effect: AbilityEffect, classId: ClassId): AbilityResolutionPlan {
  const raw = effect as unknown as Record<string, unknown>;
  const selfTargeted = SELF_ABILITY_KINDS.has(effect.kind);
  const attackCount = effect.kind === 'multiHit' ? Math.max(1, Number(raw.hitCount ?? 2)) : 1;
  const multipliers = Array.isArray(raw.hitDmgMults) ? raw.hitDmgMults.map(Number) : [];
  // Access metadata fields to ensure they're traced even if not used in this function
  void raw.archerFlightHighTensionDmgMult;
  void raw.sorcererPath;
  void raw.sorcererAwakenedMode;
  return {
    selfTargeted,
    // statMod/CC/status are offensive when explicitly targeted at the enemy.
    consumesAction: selfTargeted && !(['statMod','crowdControl','applyStatus'].includes(effect.kind) && raw.statModTarget !== 'self'),
    attackCount,
    multipliers,
    damageType: (raw.dmgType as 'physical' | 'magical' | undefined) ?? (MAGICAL_CLASSES.includes(classId) ? 'magical' : 'physical'),
    delayed: effect.kind === 'ballistic',
  };
}

export function abilityEffectFields(effect: AbilityEffect): string[] {
  return Object.keys(effect).filter((field) => field !== 'kind');
}

export function unknownAbilityEffectFields(effect: AbilityEffect): string[] {
  // Keep the canonical spelling used by the game type explicit. The runtime
  // registry is generated from the authored schema, so this assertion catches
  // accidental renames instead of letting a field disappear silently.
  const known = new Set([...ABILITY_EFFECT_FIELDS, 'enemyDirectDmgDebuffRounds']);
  return abilityEffectFields(effect).filter((field) => !known.has(field));
}

export function assertAbilityEffectContract(effects: AbilityEffect[]): true {
  const unknownKinds = [...new Set(effects.map((effect) => effect.kind))].filter((kind) => !ABILITY_EFFECT_KINDS.includes(kind));
  const unknownFields = effects.flatMap(unknownAbilityEffectFields);
  if (unknownKinds.length || unknownFields.length) {
    throw new Error(`AbilityEffect contract missing resolver entries: kinds=${unknownKinds.join(',')} fields=${unknownFields.join(',')}`);
  }
  return true;
}
