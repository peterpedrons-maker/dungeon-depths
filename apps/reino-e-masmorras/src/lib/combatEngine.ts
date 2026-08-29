import type { AbilityDef, AbilityEffect, Character, ClassId, CrowdControlKind, DungeonDef, EnemyInstance, StatusEffectKind } from '../types/game.ts';
import { CLASSES, MAGICAL_CLASSES } from './classes.ts';
import { computeCombatStats, effectiveMaxHp } from './combatStats.ts';
import { buildAbilityConditionContext, evalAbilityCondition, type AbilityConditionContext } from './combatConditions.ts';
import { getEquippedAbilities } from './skills.ts';
import { spawnEnemy } from './enemies.ts';
import { DUNGEONS } from './dungeons.ts';
import { rollAbilityHit, rollAttack } from '../game/combat.ts';
import { appendBardNote, canEncore, chooseWildcardNote, consumeEcho, consumeOvation, countertempoEcho, createBardState, createCountertempo, createEncorePayload, materializeEncoreEffect, resetBardEnemy, type BardNote, type BardScoreState } from './bardo.ts';
import { addFractures, beginActiveCast, consumeFractures, consumeResonance, resolvePulseGain } from './sorcerer.ts';
import { addNameFragment, addWarlockScar, applyWarlockDebt, bindWarlockEnemy, consumeScars, consumeTrueName, consumeTrueNameAndRefragment, createWarlockEnemyNameState, createWarlockPlayerState, grantWarlockCredit, projectWarlockCast, setWarlockDebt } from './warlock.ts';
import { accelerateOldestArrow, advanceArcherReflex, advanceInFlightArrows, alignInFlightArrows, archerDistanceShift, consumeArcherReflex, consumeArcherSteps, consumePerfectRhythm, createArcherCombatState, gainArcherCadence, gainArcherSteps, gainArcherTension, loseArcherCadence, loseArcherTension, prepareArcherReflex, scheduleInFlightArrows, flightSnapshotFromAbility, tensionForPreciseHit } from './archer.ts';
import { FRENZY_DRAIN_PER_ACTION, FURY_GAIN_BASIC_HIT, FURY_GAIN_TAKE_DAMAGE, WOUND_DMG_PCT_PER_STACK, WOUND_MAX_STACKS, WOUND_TICK_DURATION } from './barbarian.ts';
import { applyJudgmentState, consumeJudgmentState, tickJudgmentState, clericBaseHp, clericDirectHealAmount, significantHealAmount, nextFaithForNewEnemy, FAITH_START_FIRST_ENEMY, JUDGMENT_BASE_DURATION_TICKS, JUDGMENT_FAITH_MILESTONES, judgmentDurationForSkills, prioritizeClericTrialRotation, CLERIC_APOCALIPSE_SAGRADO_ABILITY_ID, JUIZO_FINAL_MATK_BUFF_PCT, JUIZO_FINAL_MATK_BUFF_ROUNDS } from './clerigo.ts';
import { POSTURE_BASIC_DAMAGE, parryReduction, recoverablePosture, type PreparedGuardState } from './warrior.ts';
import { determinationForDirectHit, determinationForPreventedDamage, DETERMINATION_GEN_BARRIER_PER_3PCT, DETERMINATION_GEN_BARRIER_CAP_PER_ACTION, DETERMINATION_GEN_BARRIER_THRESHOLD_PCT } from './knight.ts';
import { invokePaladinVirtue, type PaladinVirtueSet } from './paladin.ts';
import { soulsForCrossedThresholds, soulsForNextEnemy } from './necromancer.ts';
import { SELF_ABILITY_KINDS, abilityEffectFields, abilityResolutionPlan, assertAbilityEffectContract, resolveAbilityEffect, traceAbilityEffect } from './abilityResolver.ts';
import { SKILL_TREES } from './skills.ts';
import { circuitAfterCast, nextRunes, thermalAfterShatter, thermalShatterMult } from './mago.ts';
import { totalAttributes } from './attributes.ts';

export type CombatClassState =
  | { classId: 'guerreiro'; posture: number; guardBroken: boolean; riposteReady: boolean; resources: Record<string, number> }
  | { classId: 'mago'; heat: number; thermal: string; resources: Record<string, number> }
  | { classId: 'ladino'; images: number; stealthed: boolean; exposed: boolean; resources: Record<string, number> }
  | { classId: 'clerigo'; faith: number; grace: number; consecration: number; resources: Record<string, number> }
  | { classId: 'cavaleiro'; determination: number; momentum: number; orders: number; resources: Record<string, number> }
  | { classId: 'paladino'; virtues: PaladinVirtueSet; liturgy: number; resources: Record<string, number> }
  | { classId: 'barbaro'; fury: number; pain: number; wounds: number; frenzy: boolean; resources: Record<string, number> }
  | { classId: 'arqueiro'; tension: number; cadence: number; distance: number; steps: number; flight: number; resources: Record<string, number> }
  | { classId: 'cacador'; trail: number; breach: number; traps: number; marked: boolean; resources: Record<string, number> }
  | { classId: 'feiticeiro'; pulse: number; resonance: number; fractures: number; control: number; resources: Record<string, number> }
  | { classId: 'bruxo'; debt: number; credit: number; scars: number; nameFragments: number; resources: Record<string, number> }
  | { classId: 'druida'; season: string; attunement: number; form: string; resources: Record<string, number> }
  | { classId: 'bardo'; score: number; phrases: number; ovation: number; echo: number; resources: Record<string, number> }
  | { classId: 'necromante'; souls: number; decomposition: number; plague: number; servants: number; resources: Record<string, number> };

export interface CombatStatus { kind: StatusEffectKind; roundsLeft: number; damagePct: number }
export interface CombatEvent {
  type: 'abilityCast' | 'effectApplied' | 'hit' | 'miss' | 'crit' | 'damage' | 'heal' | 'barrierGain' | 'barrierAbsorb' | 'resourceGain' | 'resourceSpend' | 'statusApply' | 'statusExpire' | 'dotTick' | 'summonAttack' | 'enemyAction' | 'bossPhase' | 'enemyDeath' | 'playerDeath';
  tick: number; actor?: 'player' | 'enemy'; abilityId?: string; name?: string; amount?: number; damageType?: 'physical' | 'magical'; crit?: boolean; resource?: string; status?: StatusEffectKind; phase?: string; field?: string;
}
export interface CombatState {
  character: Character; classState: CombatClassState; playerHp: number; enemy: EnemyInstance; enemyHp: number;
  playerBarrier: number; enemyBarrier: number; playerStatuses: CombatStatus[]; enemyStatuses: CombatStatus[];
  playerCC: Array<{ kind: CrowdControlKind; roundsLeft: number }>; enemyCC: Array<{ kind: CrowdControlKind; roundsLeft: number }>;
  playerMods: Array<{ stat: string; pct: number; roundsLeft: number }>; enemyMods: Array<{ stat: string; pct: number; roundsLeft: number }>;
  cooldowns: Record<string, number>; equippedAbilityIds: string[]; priorities: string[]; hots: Array<{ pct: number; roundsLeft: number }>;
  bossPhaseIndex: number; envTick: number; actions: number; enemyActions: number; dead: boolean; won: boolean; rngState: number;
  potionCooldown: number;
  bardState: BardScoreState; warlockPlayer: ReturnType<typeof createWarlockPlayerState>; warlockEnemy: ReturnType<typeof createWarlockEnemyNameState>;
  sorcererEnemy: { fractures: number; spontaneousUsed: boolean; correctionUsed: boolean };
  archerState: ReturnType<typeof createArcherCombatState>;
  traps: Array<{ effect: AbilityEffect; sourceAbilityId: string; roundsLeft: number }>;
  reviveWindow: number; deathVeil: number; aegis?: { reductionPct: number; capPct: number; hits: number; roundsLeft: number };
  preparedGuard?: PreparedGuardState;
  barrierPortions: Array<{ remaining: number; absorbedTotal: number; faithThresholdAmount: number; faithGranted: boolean; isWallBonus?: boolean }>;
  soulThresholds: Set<number>;
  events: CombatEvent[]; logs: string[];
}
export interface CombatRunResult { state: CombatState; won: boolean; actions: number; playerDamage: number; enemyDamage: number; casts: number; abilityCasts: string[] }
export interface FullDungeonRunResult { dungeonId: string; won: boolean; fights: number; actions: number; checkpoints: Array<{ depth: number; won: boolean; playerHp: number }>; events: CombatEvent[]; state: CombatState }
export interface CombatEventConsumer {
  onLog?: (line: string) => void;
  onFloat?: (side: 'player' | 'enemy', amount: number, crit?: boolean, miss?: boolean, heal?: boolean) => void;
  onAbilityCast?: (side: 'player' | 'enemy', name: string, amount?: number) => void;
  onFlash?: (side: 'player' | 'enemy') => void;
}

/** Presentation boundary shared by simulations and the live panel. */
export function consumeCombatEvents(events: CombatEvent[], consumer: CombatEventConsumer): void {
  for (const item of events) {
    if (item.type === 'abilityCast' && item.actor && item.name) consumer.onAbilityCast?.(item.actor, item.name, item.amount);
    if (item.type === 'damage' && item.actor && item.amount != null) {
      const side = item.actor === 'player' ? 'enemy' : 'player';
      consumer.onFloat?.(side, item.amount, item.crit === true);
      consumer.onFlash?.(side);
    }
    if (item.type === 'heal' && item.amount != null) consumer.onFloat?.('player', item.amount, false, false, true);
    if (item.type === 'miss' && item.actor) consumer.onFloat?.(item.actor === 'player' ? 'enemy' : 'player', 0, false, true);
    if (item.type === 'resourceGain' && item.resource && item.amount != null) consumer.onLog?.(`${item.resource}: +${item.amount}`);
    if (item.type === 'resourceSpend' && item.resource && item.amount != null) consumer.onLog?.(`${item.resource}: -${item.amount}`);
    if (item.type === 'statusApply' && item.status) consumer.onLog?.(`${item.status} aplicado`);
    if (item.type === 'statusExpire' && item.status) consumer.onLog?.(`${item.status} expirou`);
    if (item.type === 'summonAttack' && item.amount != null) consumer.onLog?.(`Servo causou ${Math.round(item.amount)} de dano`);
    if (item.type === 'bossPhase' && item.phase) consumer.onLog?.(`Fase do chefe: ${item.phase}`);
    if (item.type === 'enemyDeath') consumer.onLog?.('Inimigo derrotado');
    if (item.type === 'playerDeath') consumer.onLog?.('Você foi derrotado');
  }
}

/**
 * Real between-encounter recovery. HP remains persistent: only two percent
 * of effective maximum HP is restored after a non-boss victory, and the
 * result is clamped to the current cap. Both the panel and full-run harness
 * call this rule.
 */
export function recoverAfterEncounter(character: Character, hp: number): number {
  return Math.min(effectiveMaxHp(character), hp + Math.round(effectiveMaxHp(character) * 0.02));
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const assertNever = (x: never): never => { throw new Error(`AbilityEffect sem resolver: ${String(x)}`); };
function step(s: CombatState): number { let x = (s.rngState + 0x6D2B79F5) >>> 0; let t = x; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); s.rngState = x; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function event(s: CombatState, e: CombatEvent): void { s.events.push(e); }
function stateResource(s: CombatState, key: string): number {
  if (key === 'fractures' && s.sorcererEnemy) return s.sorcererEnemy.fractures;
  if ((key === 'debt' || key === 'credit' || key === 'scars') && s.warlockPlayer) return s.warlockPlayer[key];
  if ((key === 'echo' || key === 'ovation') && s.bardState) return s.bardState[key];
  if (key === 'tension' && s.archerState) return s.archerState.tension;
  if (key === 'cadence' && s.archerState) return s.archerState.cadence;
  if (key === 'distance' && s.archerState) return s.archerState.distance;
  if (key === 'steps' && s.archerState) return s.archerState.steps;
  if (key === 'flightCount' && s.archerState) return s.archerState.arrows.length;
  return s.classState.resources[key] ?? (s.classState as unknown as Record<string, number>)[key] ?? 0;
}
function changeResource(s: CombatState, key: string, delta: number): void {
  const caps: Record<string, number> = { fury: 100, faith: 5, determination: 100, momentum: 100, orders: 3, heat: 100, souls: 10, debt: 10, credit: 5, scars: 5, pulse: 6, resonance: 2, fractures: 5, control: 2, tension: 100, cadence: 6, steps: 5, flightCount: 3, trail: 5, breach: 3, ovation: 1, echo: 2, conviction: 3 };
  setClassNumber(s, key, stateResource(s, key) + delta, caps[key] ?? 100);
}
function initialClassState(id: ClassId): CombatClassState {
  const resources = {};
  switch (id) {
    case 'guerreiro': return { classId: id, posture: 100, guardBroken: false, riposteReady: false, resources };
    case 'mago': return { classId: id, heat: 0, thermal: 'normal', resources };
    case 'ladino': return { classId: id, images: 0, stealthed: false, exposed: false, resources };
    case 'clerigo': return { classId: id, faith: FAITH_START_FIRST_ENEMY, grace: 0, consecration: 0, resources };
    case 'cavaleiro': return { classId: id, determination: 0, momentum: 0, orders: 0, resources };
    case 'paladino': return { classId: id, virtues: { justice: false, courage: false, mercy: false }, liturgy: 0, resources };
    case 'barbaro': return { classId: id, fury: 0, pain: 0, wounds: 0, frenzy: false, resources };
    case 'arqueiro': return { classId: id, tension: 0, cadence: 0, distance: 3, steps: 0, flight: 0, resources };
    case 'cacador': return { classId: id, trail: 0, breach: 0, traps: 0, marked: false, resources };
    case 'feiticeiro': return { classId: id, pulse: 0, resonance: 0, fractures: 0, control: 0, resources };
    case 'bruxo': return { classId: id, debt: 0, credit: 0, scars: 0, nameFragments: 0, resources };
    case 'druida': return { classId: id, season: 'spring', attunement: 0, form: 'none', resources };
    case 'bardo': return { classId: id, score: 0, phrases: 0, ovation: 0, echo: 0, resources };
    case 'necromante': return { classId: id, souls: 1, decomposition: 0, plague: 0, servants: 0, resources };
    default: return assertNever(id);
  }
}
export function createCombatState(character: Character, enemy: EnemyInstance, seed = 1, equipped = character.equippedAbilities.slice(0, 5), priorities = equipped): CombatState {
  const abilities = getEquippedAbilities(character.classId, character.unlockedSkills, equipped);
  const classState = initialClassState(character.classId);
  if (character.classId === 'necromante') (classState as unknown as Record<string, unknown>).servantAttacks = [];
  const liveEnemy = { ...enemy };
  if (character.classId === 'guerreiro' && !liveEnemy.warrior) liveEnemy.warrior = { current: 100, max: 100, guardBroken: false, offensiveActionsLeft: 0, ticksLeft: 999, pressureRecoveryPending: false, suppressedActionsLeft: 0, zeroRecoveryPending: false, vanguardFirstHitUsed: false, duelistFirmFirstHitUsed: false, perfectCounterAccuracyPending: false };
  for (const key of ['fury','faith','determination','momentum','orders','heat','souls','debt','credit','scars','pulse','resonance','fractures','control','tension','cadence','distance','steps','flightCount','trail','breach','ovation','echo','conviction']) classState.resources[key] = stateResource({ classState } as CombatState, key);
  return { character: { ...character, hp: effectiveMaxHp(character) }, classState, playerHp: effectiveMaxHp(character), enemy: liveEnemy, enemyHp: liveEnemy.maxHp, playerBarrier: 0, enemyBarrier: 0, playerStatuses: [], enemyStatuses: [], playerCC: [], enemyCC: [], playerMods: [], enemyMods: [], cooldowns: Object.fromEntries(abilities.map((a) => [a.id, 0])), equippedAbilityIds: abilities.map((a) => a.id), priorities: priorities.filter((id) => abilities.some((a) => a.id === id)), hots: [], bossPhaseIndex: 0, envTick: 0, actions: 0, enemyActions: 0, potionCooldown: 0, dead: false, won: false, rngState: seed >>> 0, bardState: createBardState(), warlockPlayer: createWarlockPlayerState(), warlockEnemy: createWarlockEnemyNameState(), sorcererEnemy: { fractures: 0, spontaneousUsed: false, correctionUsed: false }, archerState: createArcherCombatState(), traps: [], reviveWindow: 0, deathVeil: 0, aegis: undefined, preparedGuard: undefined, barrierPortions: [], soulThresholds: new Set(), events: [], logs: [] };
}
function playerStats(s: CombatState) { return computeCombatStats({ ...s.character, hp: s.playerHp }); }
function enemyAttack(s: CombatState, magical: boolean): number {
  const base = magical ? (s.enemy.matk ?? s.enemy.atk) : s.enemy.atk;
  return Math.max(0, Math.round(base * (1 + modTotal(s.enemyMods, 'atk'))));
}
function enemyDefense(s: CombatState, magical: boolean): number {
  const base = magical ? (s.enemy.mdef ?? s.enemy.def) : s.enemy.def;
  return Math.max(0, Math.round(base * (1 + modTotal(s.enemyMods, magical ? 'mdef' : 'def'))));
}
function autoPotion(s: CombatState): void {
  if (s.character.potions <= 0 || s.potionCooldown > 0) return;
  const maxHp = effectiveMaxHp(s.character);
  if (s.playerHp / maxHp > s.character.potionThreshold) return;
  const before = s.playerHp;
  const healed = Math.min(maxHp, before + Math.round(maxHp * 0.4));
  s.playerHp = healed;
  s.character = { ...s.character, hp: healed, potions: s.character.potions - 1 };
  s.potionCooldown = 4;
  if (healed > before) event(s, { type: 'heal', tick: s.envTick, actor: 'player', amount: healed - before });
}
function ctx(s: CombatState): AbilityConditionContext {
  const cs = s.classState as unknown as Record<string, unknown>; const resources: Record<string, number> = { ...s.classState.resources }; for (const k of ['fury','faith','determination','momentum','orders','heat','souls','debt','credit','scars','pulse','resonance','fractures','control','tension','cadence','distance','steps','flightCount','trail','breach','ovation','echo','conviction']) resources[k] = stateResource(s, k);
  resources.distance = s.archerState.distance; resources.flightCount = s.archerState.arrows.length; resources.ovation = s.bardState.ovation; resources.echo = s.bardState.echo; resources.pulse = Number(cs.pulse ?? resources.pulse); resources.fractures = s.sorcererEnemy.fractures; resources.debt = s.warlockPlayer.debt; resources.credit = s.warlockPlayer.credit; resources.scars = s.warlockPlayer.scars;
  const states: Record<string, boolean> = { frenzy: !!cs.frenzy, thermal: cs.thermal !== 'normal', consecration: Number(cs.consecration ?? 0) > 0, stealth: !!cs.stealthed, trueName: s.warlockEnemy.nameFragments >= 3, bound: s.warlockEnemy.bound, encoreReady: canEncore(s.bardState), trapTriggeredRecently: Number(cs.trapsTriggered ?? 0) > 0, perfectRhythm: s.archerState.perfectRhythm, reflex: s.archerState.reflexActionsLeft > 0, reverseWasted: !!cs.reverseWasted, quickWindow: s.classState.classId === 'ladino' };
  const wounds = s.enemy.barbarianWounds?.stacks ?? 0; const breach = s.enemy.hunterBreaches?.stacks ?? 0;
  return buildAbilityConditionContext({ hp: s.playerHp, maxHp: effectiveMaxHp(s.character), enemyHp: s.enemyHp, enemyMaxHp: s.enemy.maxHp, enemyStatuses: s.enemyStatuses.map((x) => x.kind), selfDebuffed: s.playerStatuses.length > 0 || s.playerCC.length > 0 || s.playerMods.some((m) => m.pct < 0), resources, states: { ...states, commandSupreme: !!cs.commandSupreme, justice: !!(cs.virtues as Record<string, boolean> | undefined)?.justice, courage: !!(cs.virtues as Record<string, boolean> | undefined)?.courage, mercy: !!(cs.virtues as Record<string, boolean> | undefined)?.mercy, liturgy: Number(cs.liturgy ?? 0) > 0, aegis: !!s.aegis, fullDraw: s.archerState.tension >= 100 }, enemyStacks: { wounds, breach, decomposition: Number(cs.decomposition ?? 0), judgment: s.enemy.judgment?.stacks ?? 0, trail: s.enemy.hunterTrail ?? 0, trapsTriggered: Number(cs.trapsTriggered ?? 0), fracture: s.sorcererEnemy.fractures }, painPct: Number(cs.pain ?? 0) / effectiveMaxHp(s.character), enemyPosture: s.enemy.warrior?.current ?? 100, enemyPostureBand: enemyPostureBand(s), guardBroken: !!s.enemy.warrior?.guardBroken, riposteReady: !!cs.riposteReady, periodicEffects: { 'necromante:plague': Number(cs.plague ?? 0) > 0 }, summonCount: Number(cs.servants ?? 0), summonMax: 3, isStealthed: !!cs.stealthed, enemyExposed: !!cs.exposed, imageCount: Number(cs.images ?? 0), advantageReady: !!cs.advantageReady, preparedTrick: (cs.preparedTrick as 'feint'|'loaded_die'|null) ?? null, quickWindow: s.classState.classId === 'ladino', round: s.actions });
}
function costs(e: AbilityEffect): Array<[string, number]> { const x = e as unknown as Record<string, number>; return [['fury', x.furyCost],['faith', x.faithCost],['determination', x.determinationCost],['orders', x.orderCost],['souls', x.soulCost],['heat', x.heatCost],['tension', x.archerTensionCost],['cadence', x.archerCadenceCost],['fractures', x.sorcererFractureConsume],['resonance', x.sorcererResonanceConsume],['control', x.sorcererControlConsume],['debt', x.warlockDebtPay],['echo', x.bardEchoCost],['ovation', x.bardOvationCost]].filter(([,n]) => !!n) as Array<[string, number]>; }
function pay(s: CombatState, e: AbilityEffect): boolean { const x = e as Record<string, any>; const list = costs(e); if (e.heatCostAll && stateResource(s, 'heat') <= 0) return false; if (e.momentumConsumeAll && stateResource(s, 'momentum') <= 0) return false; if (e.warlockConsumeScars && stateResource(s, 'scars') <= 0) return false; if (x.requiresImages && Number(classRecord(s).images ?? 0) < x.requiresImages) return false; if (x.archerRequiresTension && stateResource(s, 'tension') < x.archerRequiresTension) return false; if (x.archerRequiresDistance !== undefined && stateResource(s, 'distance') < x.archerRequiresDistance) return false; if (x.archerDistanceMin !== undefined && stateResource(s, 'distance') < x.archerDistanceMin) return false; if (x.archerDistanceMax !== undefined && stateResource(s, 'distance') > x.archerDistanceMax) return false; if (x.archerRequiresSteps && stateResource(s, 'steps') < x.archerRequiresSteps) return false; if (x.archerRequiresFlightRoom && stateResource(s, 'flightCount') + x.archerFlightCount > 3) return false; if (x.riposteRequired && !classRecord(s).riposteReady) return false; return !list.some(([k,n]) => stateResource(s, k) < n); }
function addStatus(s: CombatState, actor: 'player'|'enemy', kind: StatusEffectKind, rounds: number, pct = 0): void {
  if (actor === 'player' && Number(classRecord(s).immunityRounds ?? 0) > 0) return;
  const list = actor === 'player' ? s.playerStatuses : s.enemyStatuses; const old = list.find((x) => x.kind === kind);
  if (old) old.roundsLeft = Math.max(old.roundsLeft, rounds); else list.push({ kind, roundsLeft: rounds, damagePct: pct });
  event(s, { type: 'statusApply', tick: s.envTick, actor, status: kind });
}
function heal(s: CombatState, n: number): number { const before = s.playerHp; s.playerHp = clamp(Math.round(s.playerHp + n), 0, effectiveMaxHp(s.character)); const actual = s.playerHp - before; if (actual > 0) event(s, { type: 'heal', tick: s.envTick, actor: 'player', amount: actual }); return actual; }
function barrier(s: CombatState, n: number, isWallBonus = false): void {
  const amount = Math.max(0, Math.round(n));
  s.playerBarrier += amount;
  if (amount) {
    event(s, { type: 'barrierGain', tick: s.envTick, actor: 'player', amount });
    if (s.classState.classId === 'clerigo') {
      const thresholdPct = Number(classRecord(s).shieldFaithThresholdPct ?? 0.08);
      s.barrierPortions.push({ remaining: amount, absorbedTotal: 0, faithThresholdAmount: effectiveMaxHp(s.character) * thresholdPct, faithGranted: false, isWallBonus });
      delete classRecord(s).shieldFaithThresholdPct;
    }
  }
}
function absorbPlayerBarrier(s: CombatState, absorbed: number): void {
  if (absorbed <= 0) return;
  let left = absorbed;
  const kept: CombatState['barrierPortions'] = [];
  for (const portion of s.barrierPortions) {
    if (left <= 0) { kept.push(portion); continue; }
    const taken = Math.min(left, portion.remaining); left -= taken;
    const total = portion.absorbedTotal + taken;
    const exhausted = portion.remaining - taken <= 0.01;
    const faithGranted = portion.faithGranted || total >= portion.faithThresholdAmount;
    if (!portion.faithGranted && faithGranted) addClassNumber(s, 'faith', 1, 5);
    if (exhausted) {
      if (s.classState.classId === 'clerigo' && Number(classRecord(s).consecration ?? 0) > 0 && s.character.unlockedSkills.includes('clerigo:retidao:8')) heal(s, clericBaseHp(CLASSES.clerigo.baseHp, s.character.level) * 0.04);
      if (s.classState.classId === 'clerigo' && s.character.unlockedSkills.includes('clerigo:retidao:11')) classRecord(s).ancoraWindow = 2;
    } else kept.push({ ...portion, remaining: portion.remaining - taken, absorbedTotal: total, faithGranted });
  }
  s.barrierPortions = kept;
}
function recordEnemyHpDamage(s: CombatState, beforeHp: number): void {
  if (s.classState.classId !== 'necromante' || s.enemyHp >= beforeHp || beforeHp <= 0) return;
  const crossed = soulsForCrossedThresholds(beforeHp, s.enemyHp, s.enemy.maxHp, s.soulThresholds);
  s.soulThresholds = crossed.crossed;
  if (crossed.gained > 0) addClassNumber(s, 'souls', crossed.gained, 10);
}
const SELF_KINDS = SELF_ABILITY_KINDS;
const classRecord = (s: CombatState) => s.classState as unknown as Record<string, unknown>;
function setClassNumber(s: CombatState, key: string, value: number, cap = 100): void {
  const next = clamp(value, 0, cap); const before = stateResource(s, key); s.classState.resources[key] = next; const raw = classRecord(s); if (key in raw) raw[key] = next;
  if (key === 'fractures' && s.sorcererEnemy) s.sorcererEnemy = { ...s.sorcererEnemy, fractures: next };
  if (key === 'debt' && s.warlockPlayer) s.warlockPlayer = setWarlockDebt(s.warlockPlayer, next);
  if (key === 'credit' && s.warlockPlayer) s.warlockPlayer = { ...s.warlockPlayer, credit: next };
  if (key === 'scars' && s.warlockPlayer) s.warlockPlayer = { ...s.warlockPlayer, scars: next };
  if (key === 'echo' && s.bardState) s.bardState = { ...s.bardState, echo: next };
  if (key === 'ovation' && s.bardState) s.bardState = { ...s.bardState, ovation: next };
  if (key === 'tension' && s.archerState) s.archerState = { ...s.archerState, tension: next };
  if (key === 'cadence' && s.archerState) s.archerState = { ...s.archerState, cadence: next };
  if (key === 'steps' && s.archerState) s.archerState = { ...s.archerState, steps: next };
  if (next > before) event(s, { type: 'resourceGain', tick: s.envTick, actor: 'player', resource: key, amount: next - before });
  if (next < before) event(s, { type: 'resourceSpend', tick: s.envTick, actor: 'player', resource: key, amount: before - next });
}
function addClassNumber(s: CombatState, key: string, delta: number, cap = 100): void { setClassNumber(s, key, stateResource(s, key) + delta, cap); }
function modTotal(list: Array<{ stat: string; pct: number }>, stat: string): number { return list.filter((m) => m.stat === stat).reduce((sum, m) => sum + m.pct, 0); }
function enemyPostureBand(s: CombatState): 'firm'|'unstable'|'open'|'broken' { const n = s.enemy.warrior?.current ?? 100; return n <= 0 ? 'broken' : n <= 33 ? 'open' : n <= 66 ? 'unstable' : 'firm'; }
function judgmentDuration(s: CombatState): number { return judgmentDurationForSkills(s.character.unlockedSkills); }
function attack(s: CombatState, e: AbilityEffect | null, abilityId?: string, forcedMultiplier?: number, hitIndex = 0): { damage: number; landed: boolean; crit: boolean } {
  const stats = playerStats(s); const x = e as (Record<string, any> | null); const magical = e ? abilityResolutionPlan(e, s.character.classId).damageType === 'magical' : MAGICAL_CLASSES.includes(s.character.classId);
  const accuracy = stats.accuracy + modTotal(s.playerMods, 'accuracy') + Number(x?.sorcererAccuracyBonusPct ?? 0); const evasion = Math.max(0, (s.enemy.evasion ?? 0) + modTotal(s.enemyMods, 'evasion'));
  if (!x?.guaranteedHit && !x?.guaranteedAccuracy && step(s) < clamp(evasion - accuracy, 0, 0.75)) { event(s, { type: 'miss', tick: s.envTick, actor: 'player', abilityId }); return { damage: 0, landed: false, crit: false }; }
  const power = magical ? stats.matk : stats.atk; const baseDefense = enemyDefense(s, magical); let pen = Number(x?.defPenPct ?? x?.defPenPctBase ?? 0) + Number(x?.mdefPenPct ?? 0) + (magical && s.classState.classId === 'feiticeiro' ? Number(x?.sorcererMdefPenPct ?? 0) : 0) + (magical && s.classState.classId === 'bruxo' ? Number(x?.warlockMdefPenPct ?? 0) : 0) + (magical && s.classState.classId === 'feiticeiro' && hitIndex === 2 ? Number(x?.sorcererThirdHitPenPct ?? 0) : 0);
  const authoredMultiplier = Number(x?.dmgMult ?? 1);
  let mult = forcedMultiplier ?? authoredMultiplier; const cs = classRecord(s); const wounds = s.enemy.barbarianWounds?.stacks ?? 0; const judgment = s.enemy.judgment?.stacks ?? 0;
  if (!e && s.classState.classId === 'druida' && Number(cs.druidDamageMult ?? 0) > 0) { mult *= Number(cs.druidDamageMult); delete cs.druidDamageMult; }
  if (x?.dmgMultByBand) mult = Number(x.dmgMultByBand[enemyPostureBand(s)] ?? mult); if (x?.dmgMultPerWoundStack) mult += wounds * Number(x.dmgMultPerWoundStack); if (x?.dmgMultPerJudgmentStack) mult += judgment * Number(x.dmgMultPerJudgmentStack); if (x?.dmgMultPerMomentumConsumed) mult += Number(cs.momentumSpentThisCast ?? 0) * Number(x.dmgMultPerMomentumConsumed); if (x?.warlockDmgMultPerScar) mult += Number(cs.scarsThisCast ?? 0) * Number(x.warlockDmgMultPerScar); if (x?.lowHpDmgMult && s.playerHp / effectiveMaxHp(s.character) <= 0.35) mult = Number(x.lowHpDmgMult); if (x?.exposedDmgMult && cs.exposed) mult = Number(x.exposedDmgMult); if (x?.combinedDmgMult && cs.exposed && s.enemyHp / s.enemy.maxHp <= 0.3) mult = Number(x.combinedDmgMult); if (x?.advantageDmgMult && cs.advantageReady) mult = Number(x.advantageDmgMult); if (x?.dmgMultVsHighEnemyHp && s.enemyHp / s.enemy.maxHp >= 0.9) mult = Number(x.dmgMultVsHighEnemyHp); if (x?.enemyHpExecuteBase && s.enemyHp / s.enemy.maxHp <= Number(x.enemyHpExecuteThreshold ?? 0)) mult = Math.min(Number(x.enemyHpExecuteCap ?? mult), Number(x.enemyHpExecuteBase) + Math.floor((1 - s.enemyHp / s.enemy.maxHp) / 0.05) * Number(x.enemyHpExecutePer5Pct ?? 0)); if (x?.executeBaseMult && s.enemyHp / s.enemy.maxHp <= 0.3) mult = Math.min(Number(x.executeBaseMult) + Number(x.executeMultCap ?? 0) + Number(x.executeSupremeExtraCap ?? 0), Number(x.executeBaseMult) + (1 - s.enemyHp / s.enemy.maxHp) * Number(x.executePerHpBelowPct ?? 0));
  const ambushDmgMult = Number(x?.ambushDmgMult ?? mult);
  if (s.classState.classId === 'ladino' && cs.stealthed && x?.ambushDmgMult !== undefined) mult = ambushDmgMult;
  const advantageDefPenPct = Number(x?.advantageDefPenPct ?? 0);
  if (s.classState.classId === 'ladino' && cs.advantageReady && advantageDefPenPct) pen += advantageDefPenPct;
  if (s.classState.classId === 'arqueiro') {
    if (x?.archerHighTensionDmgMult !== undefined && stateResource(s, 'tension') >= 75) mult = Number(x.archerHighTensionDmgMult);
    if (x?.archerDistanceZeroMult !== undefined && s.archerState.distance === 0) mult = Number(x.archerDistanceZeroMult);
    if (x?.archerFifthDistanceMult !== undefined && hitIndex === 4 && (s.archerState.distance === 1 || s.archerState.distance === 2)) mult = Number(x.archerFifthDistanceMult);
    if (x?.archerHighTensionPenPct !== undefined && stateResource(s, 'tension') >= 75) pen += Number(x.archerHighTensionPenPct);
    if (x?.archerDefPenPct !== undefined) pen += Number(x.archerDefPenPct);
  }
  if (x?.defPenPctPerMomentum) pen += Math.min(Number(x.defPenPctCap ?? 1), Number(x.defPenPctPerMomentum) * Number(cs.momentumAtCast ?? stateResource(s, 'momentum')));
  const consecrationDmgMultBonus = Number(x?.consecrationDmgMultBonus ?? 0);
  if (s.classState.classId === 'clerigo' && Number(cs.consecration ?? 0) > 0 && consecrationDmgMultBonus) mult += consecrationDmgMultBonus;
  if (x?.paladinVerdict && x.verdictDmgMultByConviction) mult = Number(x.verdictDmgMultByConviction[stateResource(s, 'conviction') as 1 | 2 | 3] ?? mult);
  if (x?.fullJusticeDmgMult && (cs.verdictRegent === 'justice' || (cs.virtues as Record<string, boolean> | undefined)?.justice) && stateResource(s, 'conviction') >= 3) mult = Number(x.fullJusticeDmgMult);
  if (x?.paladinRadiant) mult *= 1 + Math.min(0.25, stateResource(s, 'conviction') * 0.03);
  if (s.classState.classId === 'barbaro' && x?.painConsumeMaxPct) {
    const painBefore = Number(cs.pain ?? 0); const maxPain = effectiveMaxHp(s.character) * Number(x.painConsumeMaxPct);
    const spent = Math.min(painBefore, maxPain); cs.pain = painBefore - spent;
    if (spent > 0 && x.painConsumeDmgMultPer2Pct) mult += (spent / effectiveMaxHp(s.character) / 0.02) * Number(x.painConsumeDmgMultPer2Pct);
  }
  if (s.classState.classId === 'feiticeiro' && cs.awakenedCast) {
    if (x?.sorcererAwakenedMode === 'intensified') mult *= 1.18;
    if (x?.sorcererAwakenedMode === 'molded') mult *= 1.08;
  }
  if (s.classState.classId === 'mago' && cs.mageAmplified && x?.amplifiedMdefPenPct) pen += Number(x.amplifiedMdefPenPct);
  const amplifiedDmgMult = Number(x?.amplifiedDmgMult ?? mult);
  if ((s.classState.classId === 'feiticeiro' && cs.awakenedCast || s.classState.classId === 'mago' && cs.mageAmplified) && x?.amplifiedDmgMult !== undefined) mult = amplifiedDmgMult;
  if (s.classState.classId === 'mago' && x?.shatter) {
    const thermal = String(cs.thermal ?? 'normal') as 'normal' | 'chilled' | 'fragile' | 'frozen';
    const shatterMultiplier = thermalShatterMult(thermal);
    if (shatterMultiplier > 0) mult *= shatterMultiplier;
  }
  if (s.classState.classId === 'mago' && Number(cs.heatAtCast ?? 0) > 0 && x?.heatDmgMultPerPoint) mult += Math.min(Number(x.heatDmgMultCap ?? 1), Number(cs.heatAtCast) * Number(x.heatDmgMultPerPoint));
  const critChance = Math.min(0.9, stats.critChance + Number(x?.archerCritBonus ?? 0) + Number(x?.advantageCritPct ?? 0) + (s.bardState.fortissimo ? 0.05 : 0)); const r = rollAbilityHit(power, baseDefense * (1 - clamp(pen, 0, 0.9)), mult, critChance, stats.critDmgMult, x?.kind === 'guaranteedCrit', () => step(s));
  let amount = r.dmg;
  if (s.classState.classId === 'cavaleiro' && Number(cs.counterStored ?? 0) > 0) { amount += Number(cs.counterStored); cs.counterStored = 0; }
  if (s.enemyBarrier > 0) { const absorbed = Math.min(s.enemyBarrier, amount); s.enemyBarrier -= absorbed; amount -= absorbed; event(s, { type: 'barrierAbsorb', tick: s.envTick, actor: 'enemy', amount: absorbed }); }
  event(s, { type: 'hit', tick: s.envTick, actor: 'player', abilityId }); if (r.crit) event(s, { type: 'crit', tick: s.envTick, actor: 'player', abilityId }); const beforeHp = s.enemyHp; s.enemyHp = Math.max(0, s.enemyHp - amount); recordEnemyHpDamage(s, beforeHp); event(s, { type: 'damage', tick: s.envTick, actor: 'player', amount, damageType: magical ? 'magical' : 'physical', crit: r.crit }); return { damage: amount, landed: true, crit: r.crit };
}
function applyWounds(s: CombatState, amount: number, renew = true): void { const old = s.enemy.barbarianWounds?.stacks ?? 0; if (!amount && !old) return; s.enemy.barbarianWounds = { stacks: Math.min(WOUND_MAX_STACKS, old + amount), ticksLeft: renew ? WOUND_TICK_DURATION : (s.enemy.barbarianWounds?.ticksLeft ?? WOUND_TICK_DURATION) }; }
function applyBreaches(s: CombatState, amount: number, consume = 0): void { const current = s.enemy.hunterBreaches?.stacks ?? 0; const next = Math.max(0, Math.min(3, current - consume + amount)); s.enemy.hunterBreaches = next ? { stacks: next, ticksLeft: 6 } : undefined; }
function executeCombatAbilityEffect(s: CombatState, e: AbilityEffect, id: string, plan: ReturnType<typeof abilityResolutionPlan>): { damage: number; healed: number; hits: number; landed: number; crits: number } {
  const x = e as AbilityEffect & Record<string, any>; let damage = 0; let healed = 0; let hits = 0; let landed = 0; let crits = 0; const self = SELF_KINDS.has(e.kind);
  // Path/tag fields are runtime state, not decorative metadata. Reading and
  // storing them here keeps every class branch on the same resolved effect.
  const raw = classRecord(s);
  if (x.guardAbility !== undefined) raw.guardAbility = x.guardAbility;
  if (x.duelistAbility !== undefined) raw.duelistAbility = x.duelistAbility;
  if (x.vanguardAbility !== undefined) raw.vanguardAbility = x.vanguardAbility;
  if (x.roguePath !== undefined) raw.roguePath = x.roguePath;
  if (x.offensive !== undefined) raw.rogueOffensive = x.offensive;
  if (x.toxicBlade !== undefined) raw.toxicBlade = x.toxicBlade;
  if (x.archerPath !== undefined) raw.archerPath = x.archerPath;
  if (x.paladinPath !== undefined) raw.paladinPath = x.paladinPath;
  if (x.warlockPath !== undefined) raw.warlockPath = x.warlockPath;
  if (x.necromancerTag !== undefined) raw.necromancerTag = x.necromancerTag;
  if (x.bardPath !== undefined) raw.bardPath = x.bardPath;
  if (x.druidSeason !== undefined) raw.season = x.druidSeason;
  if (x.druidAction !== undefined) raw.druidAction = x.druidAction;
  if (x.dmgMult !== undefined && s.classState.classId === 'druida') raw.druidDamageMult = Number(x.dmgMult);
  if (x.abaladoThreshold !== undefined) {
    raw.abaladoDmgTakenPct = Number(x.abaladoDmgTakenPct ?? 0);
    raw.abaladoRounds = Number(x.abaladoRounds ?? 0);
  }
  if (!self || ['statMod','crowdControl','applyStatus'].includes(e.kind)) {
    // Bard finale arrays are the complete physical+magical payload. They
    // replace (rather than duplicate) the generic multi-hit list.
    const hasBardPayload = Array.isArray(x.bardPhysicalHitMults) || Array.isArray(x.bardMagicalHitMults);
    const extraPerfectHit = s.classState.classId === 'arqueiro' && x.archerPerfectExtraRatio && s.archerState.perfectRhythm ? 1 : 0;
    const count = hasBardPayload ? 0 : plan.attackCount + extraPerfectHit; const multipliers = plan.multipliers;
    for (let i = 0; i < count && s.enemyHp > 0; i += 1) {
      const hitEffect = x;
      const thirdHitBonusPerFracture = Number(x.sorcererThirdHitBonusPerFracture ?? 0);
      const perHitMultiplier = Number(x.dmgMultPerHit ?? x.dmgMult ?? 1);
      const thirdHitBonus = s.classState.classId === 'feiticeiro' && i === 2 && thirdHitBonusPerFracture
        ? thirdHitBonusPerFracture * Number(classRecord(s).sorcererFracturesAtCast ?? s.sorcererEnemy.fractures)
        : 0;
      const forced = multipliers[i] ?? (i >= plan.attackCount && extraPerfectHit ? (multipliers[plan.attackCount - 1] ?? perHitMultiplier) * Number(x.archerPerfectExtraRatio) : (e.kind === 'multiHit' ? perHitMultiplier : undefined));
      const r = attack(s, hitEffect, id, forced === undefined ? undefined : forced + thirdHitBonus, i);
      hits += 1; if (r.landed) { landed += 1; damage += r.damage; if (r.crit) crits += 1; }
    }
    if (e.kind === 'applyStatus' && landed > 0 && x.status) addStatus(s, 'enemy', x.status, x.statusRounds ?? 3, (classRecord(s).awakenedCast || classRecord(s).mageAmplified) && x.amplifiedStatusDmgPct !== undefined ? x.amplifiedStatusDmgPct : (x.statusDmgPct ?? 0));
    if (e.kind === 'crowdControl' && landed > 0 && x.cc) s.enemyCC.push({ kind: x.cc, roundsLeft: x.ccRounds ?? 1 });
    if (e.kind === 'statMod' && landed > 0 && x.statMod && x.statModTarget === 'enemy') s.enemyMods.push({ stat: x.statMod, pct: x.statModPct ?? 0, roundsLeft: x.statModRounds ?? 2 });
    if (e.kind === 'statMod' && landed > 0 && x.statMod && x.statModTarget === 'self') s.playerMods.push({ stat: x.statMod, pct: x.statModPct ?? 0, roundsLeft: x.statModRounds ?? 2 });
    // Bardo's finale payload is explicitly two-channel. Both rolls are part
    // of the same ability, so the physical instrument hit cannot be lost
    // merely because the magical payload missed (or vice versa).
    if (x.bardPhysicalHitMults || x.bardMagicalHitMults) {
      for (const [damageType, list] of [['physical', x.bardPhysicalHitMults], ['magical', x.bardMagicalHitMults]] as const) {
        for (const multiplier of (Array.isArray(list) ? list : [])) {
          const typedEffect = Object.create(x) as AbilityEffect;
          Object.defineProperty(typedEffect, 'dmgType', { value: damageType, enumerable: true });
          const r = attack(s, typedEffect, id, Number(multiplier));
          hits += 1; if (r.landed) { landed += 1; damage += r.damage; if (r.crit) crits += 1; }
        }
      }
    }
    const bardAccent = x.bardAccent === true;
    const bardAccentAtkMult = Number(x.bardAccentAtkMult ?? 0);
    if (s.classState.classId === 'bardo' && (bardAccent || x.bardFinale) && bardAccentAtkMult > 0 && s.bardState.accent) {
      const accent = attack(s, { kind: 'bigHit', dmgType: 'physical', dmgMult: bardAccentAtkMult }, id, bardAccentAtkMult);
      hits += 1; if (accent.landed) { landed += 1; damage += accent.damage; if (accent.crit) crits += 1; }
      s.bardState = { ...s.bardState, accent: false };
    }
    // Magia Refratada repeats each landed primary impact at its authored
    // potency. The repeat is damage only: it does not replay riders.
    if (s.classState.classId === 'feiticeiro' && x.sorcererEchoPotency && classRecord(s).awakenedCast && landed > 0) {
      const echoCount = Math.max(1, count || multipliers.length || 1);
      for (let i = 0; i < echoCount && s.enemyHp > 0; i += 1) {
        const base = multipliers[i] ?? Number(x.dmgMultPerHit ?? x.dmgMult ?? 1);
        const r = attack(s, x, id, base * Number(x.sorcererEchoPotency));
        hits += 1; if (r.landed) { landed += 1; damage += r.damage; if (r.crit) crits += 1; }
      }
    }
  }
  switch (e.kind) {
    case 'ballistic':
      // A ballistic cast schedules a real delayed arrow; it does not also
      // deal an immediate hit. The caller uses landed=1 as the successful
      // launch signal and the arrow then resolves through the normal flight
      // snapshot/impact path.
      landed = 1;
      break;
    case 'heal': {
      const paladinConviction = stateResource(s, 'conviction') as 1 | 2 | 3;
      const authoredHealPct = Number(x.healPct ?? 0.15);
      const supportHealPct = Number(x.bardSupportHealPct ?? authoredHealPct);
      const ovationHealPct = Number(x.bardOvationHealPct ?? supportHealPct);
      const pct = x.verdictHealPctByConviction?.[paladinConviction] ?? (Number(classRecord(s).bardOvationAtCast ?? 0) > 0 ? ovationHealPct : supportHealPct);
      const baseline = clericBaseHp(CLASSES[s.character.classId].baseHp, s.character.level);
      const efficiency = s.classState.classId === 'clerigo' && s.character.unlockedSkills.includes('clerigo:devocao:3') ? 0.03 : 0;
      const amount = s.classState.classId === 'paladino' && x.verdictHealPctByConviction?.[paladinConviction]
        ? effectiveMaxHp(s.character) * pct * (1 + playerStats(s).healingPowerPct)
        : s.classState.classId === 'paladino' && x.activeHealMaxHpPct
        ? effectiveMaxHp(s.character) * x.activeHealMaxHpPct * (1 + playerStats(s).healingPowerPct)
        : clericDirectHealAmount(baseline, pct, playerStats(s).healingPowerPct, efficiency);
      healed += heal(s, amount);
      if (x.faithGainOnHeal && healed >= significantHealAmount(baseline, s.character.unlockedSkills.includes('clerigo:devocao:3'))) addClassNumber(s, 'faith', 1, 5);
      break;
    }
    case 'shield': case 'divineWall': case 'colossalShield': case 'lastGuard': case 'boneShield': case 'boneFortress': case 'aegis': {
      if (e.kind === 'aegis') s.aegis = { reductionPct: x.aegisReductionPct ?? 0.35, capPct: x.aegisMaxHpCapPct ?? 0.1, hits: x.aegisHits ?? 1, roundsLeft: x.aegisDuration ?? 3 };
      else if (x.shieldPct || x.shieldPctBase || x.barrierBasePct || x.shieldPctPerVit !== undefined) {
        const ritual = s.classState.classId === 'clerigo' && s.character.unlockedSkills.includes('clerigo:retidao:3') ? 1.04 : 1;
        const vit = totalAttributes(s.character).vit;
        const basePct = Number(x.shieldPct ?? x.shieldPctBase ?? x.barrierBasePct ?? 0.1);
        const perVit = Number(x.shieldPctPerVit ?? 0);
        const cap = Number(x.shieldPctCap ?? 0);
        const authoredPct = x.shieldPctPerVit !== undefined ? Math.min(basePct + cap, basePct + vit * perVit) : basePct;
        const frostBarrier = s.classState.classId === 'mago' && x.element === 'frost';
        const amplifiedPct = Number(x.amplifiedDmgMult ?? authoredPct);
        const shieldPct = frostBarrier && classRecord(s).mageAmplified ? amplifiedPct : authoredPct;
        const shieldAmount = effectiveMaxHp(s.character) * shieldPct * (x.scalesWithBarrierPower ? 1 + playerStats(s).barrierPowerPct : 1) * ritual;
        if (x.shieldFaithThresholdPct !== undefined) classRecord(s).shieldFaithThresholdPct = x.shieldFaithThresholdPct;
        barrier(s, shieldAmount, e.kind === 'divineWall');
      }
      if (e.kind === 'lastGuard') classRecord(s).lastGuardRounds = x.lastGuardRounds ?? 2;
      if (x.shieldRounds) classRecord(s).shieldRounds = x.shieldRounds;
      if (e.kind === 'boneShield' || e.kind === 'boneFortress') {
        const rawSummons = classRecord(s);
        const attacks = Array.isArray(rawSummons.servantAttacks) ? [...rawSummons.servantAttacks as number[]] : [];
        if (e.kind === 'boneFortress') {
          const refresh = Number(x.summonMaxRefresh ?? 3);
          for (let i = 0; i < attacks.length; i += 1) attacks[i] = Math.max(attacks[i], refresh);
        }
        while (attacks.length < Math.min(3, Number(x.summonCount ?? 1) + (e.kind === 'boneFortress' ? 2 : 0))) attacks.push(Number(x.summonAttacks ?? 3));
        rawSummons.servantAttacks = attacks.slice(0, 3);
        rawSummons.servants = attacks.length;
      }
      break;
    }
    case 'regen': s.hots.push({ pct: x.regenPct ?? 0.05, roundsLeft: x.regenRounds ?? 3 }); break;
    case 'dispel': case 'cleanseOne': { const removed = s.playerStatuses.length + s.playerCC.length; s.playerStatuses = []; s.playerCC = []; if (removed && x.cleanseFaithGain) addClassNumber(s, 'faith', 1, 5); if (removed && x.cleanseJudgmentPer2) s.enemy.judgment = applyJudgmentState(s.enemy.judgment, Math.min(2, Math.floor(removed / 2)), judgmentDuration(s)); break; }
    case 'buffDef': case 'buffBlock': case 'immunity': case 'haste': case 'berserk': case 'taunt': case 'lifestealBuff': case 'atkBuff': case 'buffEvasion': case 'huntWithPrey': case 'consecrationGuard': case 'ironWall': case 'livingFortress': case 'orderResist': case 'kingsBanner': case 'counterStance': case 'painGuard': case 'wallStance': case 'lastStand': case 'bloodFeast': case 'reviveWindow': case 'deathVeil': { const stat = e.kind === 'buffEvasion' ? 'evasion' : e.kind === 'buffBlock' ? 'block' : e.kind === 'buffDef' ? 'def' : e.kind === 'atkBuff' || e.kind === 'berserk' ? 'atk' : e.kind === 'taunt' || e.kind === 'painGuard' || e.kind === 'wallStance' || e.kind === 'lastStand' || e.kind === 'consecrationGuard' || e.kind === 'ironWall' || e.kind === 'livingFortress' || e.kind === 'orderResist' ? 'dmgTakenPct' : ''; const vit = totalAttributes(s.character).vit; const mitigation = e.kind === 'ironWall' || e.kind === 'livingFortress' ? -(Number(x.dmgReductionPctBase ?? 0.2) + Math.min(Number(x.dmgReductionPctCap ?? 1), vit * Number(x.dmgReductionPctPerVit ?? 0))) : e.kind === 'orderResist' ? -Number(x.bonusDmgTakenReductionPct ?? 0.1) : e.kind === 'buffDef' ? Number(x.defBuffPctBase ?? x.buffPct ?? 0.1) : (x.buffPct ?? (stat === 'dmgTakenPct' ? -0.1 : 0.1)); if (e.kind === 'orderResist' && (x.shieldPct || x.shieldPctBase || x.barrierBasePct)) barrier(s, effectiveMaxHp(s.character) * (Number(x.shieldPct ?? x.shieldPctBase ?? x.barrierBasePct ?? 0.1) + Math.min(Number(x.shieldPctCap ?? 0), vit * Number(x.shieldPctPerVit ?? 0))) * (x.scalesWithBarrierPower ? 1 + playerStats(s).barrierPowerPct : 1)); if (stat) s.playerMods.push({ stat, pct: mitigation, roundsLeft: x.buffRounds ?? x.postureRounds ?? 3 }); if (e.kind === 'huntWithPrey') { s.playerMods.push({ stat: 'speedPct', pct: x.speedBuffPct ?? 0, roundsLeft: x.buffRounds ?? 3 }); s.playerMods.push({ stat: 'evasion', pct: x.evasionBuffPct ?? 0, roundsLeft: x.buffRounds ?? 3 }); } if (e.kind === 'berserk' && x.berserkDefPct) s.playerMods.push({ stat: 'def', pct: -Math.abs(x.berserkDefPct), roundsLeft: x.berserkRounds ?? 3 }); if (e.kind === 'kingsBanner') { s.playerMods.push({ stat: 'atk', pct: x.atkBuffPctBase ?? 0.1, roundsLeft: x.buffRounds ?? 4 }); s.playerMods.push({ stat: 'def', pct: x.defBuffPctBase ?? 0.12, roundsLeft: x.buffRounds ?? 4 }); s.playerMods.push({ stat: 'tenacity', pct: x.tenacityBuffPctBase ?? 0.1, roundsLeft: x.buffRounds ?? 4 }); } if (e.kind === 'wallStance') classRecord(s).wallStance = true; if (e.kind === 'counterStance') { classRecord(s).counterStanceActive = true; classRecord(s).counterStanceRounds = x.postureRounds ?? 2; classRecord(s).counterCapPctBase = x.counterCapPctBase; classRecord(s).counterCapPctPerVit = x.counterCapPctPerVit; classRecord(s).counterCapPctCap = x.counterCapPctCap; classRecord(s).counterStoragePct = x.counterStoragePct; } if (e.kind === 'kingsBanner') classRecord(s).kingsBannerActive = true; if (e.kind === 'painGuard') { classRecord(s).painRedirectPct = x.painRedirectPct ?? 0.3; classRecord(s).painGuardRounds = x.buffRounds ?? 3; } if (e.kind === 'reviveWindow') { s.reviveWindow = x.reviveWindowRounds ?? 3; classRecord(s).reviveHealPct = x.reviveHealPct ?? 0.4; classRecord(s).reviveHealCapPct = x.reviveHealCapPct ?? 1; } if (e.kind === 'deathVeil') s.deathVeil = x.buffRounds ?? 3; if (e.kind === 'immunity') classRecord(s).immunityRounds = x.immunityRounds ?? 3; if (e.kind === 'haste') classRecord(s).hasteRounds = x.hasteRounds ?? 2; break; }
    case 'rogueStealth': classRecord(s).stealthed = true; break;
    case 'rogueToxicBlade': classRecord(s).toxicBlade = true; break;
    case 'roguePrepareTrick': classRecord(s).preparedTrick = x.trickKind; break;
    case 'preparedGuard': s.preparedGuard = { sourceAbilityId: id, name: s.equippedAbilityIds.includes(id) ? (abilities(s).find((a) => a.id === id)?.name ?? id) : id, remainingParries: x.preparedParries ?? 1, damageReductionPct: x.parryReductionPct ?? 0.28, postureDamage: x.postureDamage ?? 0, ticksLeft: x.preparedDuration ?? 3, canGenerateRiposte: x.canGenerateRiposte !== false, parriesResolved: 0 }; break;
    case 'feint': if (s.enemy.warrior) { const postureDamage = Number(x.postureDamage ?? x.feintPostureDamage ?? 16); const remaining = Math.max(0, s.enemy.warrior.current - postureDamage); s.enemy.warrior.current = x.noPostureBreak ? Math.max(1, remaining) : remaining; } if (x.duelistAbility) classRecord(s).duelistAbility = true; break;
    case 'archerMove': { s.archerState = archerDistanceShift(s.archerState, x.archerDistanceShift ?? 0); const consumed = consumeArcherSteps(s.archerState, x.archerConsumesSteps ?? 0); s.archerState = consumed.state; break; }
    case 'armTrap': s.traps.push({ effect: e, sourceAbilityId: id, roundsLeft: 99 }); break;
    case 'furyBoost': case 'furyMaxFrenzy': addClassNumber(s, 'fury', x.furyGainFlat ?? 40, 100); if (e.kind === 'furyMaxFrenzy') classRecord(s).frenzy = true; break;
    case 'mortalVoracity': if (x.consumeAllSummons) { classRecord(s).servants = 0; classRecord(s).servantAttacks = []; } addClassNumber(s, 'souls', -(x.consumeSoulsMax ?? 0), 10); s.playerMods.push({ stat: 'lifestealPct', pct: 0.12, roundsLeft: Number(x.buffRounds ?? 3) }); break;
    // Offensive kinds already resolve their hit in the shared attack loop.
    // Keeping every member explicit is intentional: adding a new kind now
    // makes TypeScript fail here instead of silently doing nothing.
    case 'bigHit': case 'guaranteedCrit': case 'applyStatus': case 'bonusVsStatus':
    case 'crowdControl': case 'statMod':
      break;
  }
  // These mechanics are attached to self abilities but are consumed by
  // later combat phases, so resolve them at the same mechanical boundary.
  if (e.kind === 'haste' && x.element === 'lightning' && x.circuitPerfectWithInverter) classRecord(s).mageInverterPending = true;
  if (e.kind === 'wallStance') classRecord(s).furyPerHitTaken = Number(x.furyPerHitTaken ?? 0);
  if (e.kind === 'livingFortress') classRecord(s).minBlockChancePct = Number(x.minBlockChancePct ?? 0);
  if (e.kind === 'bloodFeast' || e.kind === 'lastStand') {
    const painLimit = Number(x.painConsumeMaxPct ?? 0);
    classRecord(s).pain = Math.max(0, Number(classRecord(s).pain ?? 0) - effectiveMaxHp(s.character) * painLimit);
    if (x.furyGainFlat) addClassNumber(s, 'fury', Number(x.furyGainFlat), 100);
  }
  if (e.kind === 'bloodFeast') s.playerMods.push({ stat: 'lifestealPct', pct: Number(x.buffPct ?? 0.15), roundsLeft: Number(x.buffRounds ?? 3) });
  if (e.kind === 'lastStand') s.playerMods = s.playerMods.filter((mod) => mod.stat !== 'dmgTakenPct' || mod.pct >= 0);
  if (landed > 0) {
    const judgmentBeforeResolution = s.enemy.judgment?.stacks ?? 0;
    if (s.classState.classId === 'guerreiro' && s.enemy.warrior && (x.postureDamage || x.postureDamagePerHit || x.postureDamageFirm || x.postureDamageByBand)) { const band = enemyPostureBand(s); const posture = Number(x.postureDamageByBand?.[band] ?? (band === 'firm' ? (x.postureDamageFirm ?? x.postureDamage ?? x.postureDamagePerHit ?? 0) : (x.postureDamage ?? x.postureDamagePerHit ?? 0))); s.enemy.warrior.current = Math.max(0, s.enemy.warrior.current - posture * landed); s.enemy.warrior.pressureRecoveryPending = true; if (x.suppressPostureRecoveryActions) s.enemy.warrior.suppressedActionsLeft = Math.max(s.enemy.warrior.suppressedActionsLeft, x.suppressPostureRecoveryActions); if (x.zeroNextPostureRecoveryIfAllHits && landed === hits) s.enemy.warrior.zeroRecoveryPending = true; if (s.enemy.warrior.current <= 0) s.enemy.warrior.guardBroken = true; }
    if (s.classState.classId === 'guerreiro' && s.enemy.warrior) {
      if (x.vanguardAbility && !s.enemy.warrior.vanguardFirstHitUsed) { s.enemy.warrior.current = Math.max(0, s.enemy.warrior.current - 6); s.enemy.warrior.vanguardFirstHitUsed = true; }
      if (x.duelistAbility && !s.enemy.warrior.duelistFirmFirstHitUsed && enemyPostureBand(s) === 'firm') { s.enemy.warrior.current = Math.max(0, s.enemy.warrior.current - 5); s.enemy.warrior.duelistFirmFirstHitUsed = true; }
      if (x.noPostureBreak && s.enemy.warrior.current <= 0) { s.enemy.warrior.current = 1; s.enemy.warrior.guardBroken = false; }
      if (x.perfectCounterAccuracyOnBreak && s.enemy.warrior.guardBroken) s.enemy.warrior.perfectCounterAccuracyPending = true;
      if (x.readingPerfectOnBreak && s.enemy.warrior.guardBroken) classRecord(s).riposteReady = true;
      const guardBreakActionsBonus = Number(x.guardBreakActionsBonusOnBreak ?? 0);
      if ((x.finishGuardBreak || guardBreakActionsBonus > 0) && s.enemy.warrior.guardBroken) s.enemy.warrior.offensiveActionsLeft = Math.max(s.enemy.warrior.offensiveActionsLeft, guardBreakActionsBonus || 1);
    }
    if (s.classState.classId === 'guerreiro' && x.atkDebuffOnHitPct) s.enemyMods.push({ stat: 'atk', pct: -Number(x.atkDebuffOnHitPct), roundsLeft: x.atkDebuffRounds ?? 2 });
    if (s.classState.classId === 'cacador') s.enemy.hunterTrail = Math.min(5, (s.enemy.hunterTrail ?? 0) + 1);
    if (s.classState.classId === 'mago' && x.element === 'frost' && (x.thermalAdvanceOnHit || x.amplifiedThermalAdvanceOnHit)) { const advance = classRecord(s).mageAmplified ? (x.amplifiedThermalAdvanceOnHit ?? x.thermalAdvanceOnHit ?? 0) : (x.thermalAdvanceOnHit ?? 0); classRecord(s).thermalTicks = Number(classRecord(s).thermalTicks ?? 0) + advance; classRecord(s).thermal = Number(classRecord(s).thermalTicks) >= 3 ? 'frozen' : 'fragile'; }
    if (s.classState.classId === 'mago' && x.shatter) classRecord(s).thermal = thermalAfterShatter(String(classRecord(s).thermal ?? 'normal') as 'normal' | 'chilled' | 'fragile' | 'frozen', false);
    if (s.classState.classId === 'clerigo' && x.consecrationRoundsOnCast) classRecord(s).consecration = x.consecrationRoundsOnCast;
    if (x.furyGainOnHit) addClassNumber(s, 'fury', x.furyGainOnHit, 100); if (crits && x.furyGainOnCrit) addClassNumber(s, 'fury', x.furyGainOnCrit * crits, 100); if (x.woundStacksOnHit) applyWounds(s, x.woundStacksOnHit); if (crits && s.classState.classId === 'barbaro' && s.character.unlockedSkills.includes('barbaro:selvageria:6')) applyWounds(s, 1); if (x.renewWoundsOnHit && s.enemy.barbarianWounds) applyWounds(s, 0, true); if (x.consumeWoundsOnHit) s.enemy.barbarianWounds = undefined; if (x.breachGainOnHit || x.breachConsumeOnHit) applyBreaches(s, x.breachGainOnHit ?? 0, x.breachConsumeOnHit ?? 0); if (x.judgmentStacksOnHit) { const beforeJudgment = s.enemy.judgment?.stacks ?? 0; s.enemy.judgment = applyJudgmentState(s.enemy.judgment, x.judgmentStacksOnHit, JUDGMENT_BASE_DURATION_TICKS); if (s.classState.classId === 'clerigo') for (const milestone of JUDGMENT_FAITH_MILESTONES) if (beforeJudgment < milestone && (s.enemy.judgment?.stacks ?? 0) >= milestone) addClassNumber(s, 'faith', 1, 5); } if (x.judgmentReadOnly) classRecord(s).judgmentReadOnly = true; if (x.judgmentConsumeMax && !x.judgmentReadOnly) s.enemy.judgment = consumeJudgmentState(s.enemy.judgment, x.judgmentConsumeMax); if (x.judgmentDurationCutOnHit && s.enemy.judgment) s.enemy.judgment.ticksLeft = Math.max(1, s.enemy.judgment.ticksLeft - x.judgmentDurationCutOnHit); if (x.extendConsecrationOnHit && Number(classRecord(s).consecration ?? 0) > 0) classRecord(s).consecration = Number(classRecord(s).consecration) + x.extendConsecrationOnHit; if (x.decompositionOnHit) classRecord(s).decomposition = Math.min(5, Number(classRecord(s).decomposition ?? 0) + x.decompositionOnHit); if (x.decompositionConsumeMax) { const consumed = Math.min(Number(classRecord(s).decomposition ?? 0), x.decompositionConsumeMax); classRecord(s).decomposition = Number(classRecord(s).decomposition ?? 0) - consumed; if (x.soulGainOnConsumeExact && consumed === x.decompositionConsumeMax) addClassNumber(s, 'souls', x.soulGainOnConsumeExact, 10); } if (x.plagueApply) { classRecord(s).plague = x.plagueDuration ?? 4; classRecord(s).plagueMultiplier = x.plagueMultiplier ?? 0.16; } if (x.plagueDetonatePct && Number(classRecord(s).plague ?? 0) > 0) { const detonation = Math.min(s.enemy.maxHp * (x.plagueDetonatePct ?? 0), playerStats(s).matk * (x.plagueDetonateCapMult ?? 1)); const beforePlagueDamage = s.enemyHp; s.enemyHp = Math.max(0, s.enemyHp - detonation); recordEnemyHpDamage(s, beforePlagueDamage); classRecord(s).plague = 0; event(s, { type: 'damage', tick: s.envTick, actor: 'player', amount: detonation, damageType: 'magical' }); } if (x.sorcererFractureGain) s.sorcererEnemy = addFractures(s.sorcererEnemy, x.sorcererFractureGain); if (x.sorcererResonanceGain) addClassNumber(s, 'resonance', x.sorcererResonanceGain, 2); if (x.sorcererControlGain) addClassNumber(s, 'control', x.sorcererControlGain, 2); if (x.warlockBindOnHit) s.warlockEnemy = bindWarlockEnemy(s.warlockEnemy); if (x.warlockGrantCredits) s.warlockPlayer = grantWarlockCredit(s.warlockPlayer, x.warlockGrantCredits); if (x.directHealFromDamagePct) healed += heal(s, Math.min(effectiveMaxHp(s.character) * (x.directHealCapPct ?? 0.06), damage * x.directHealFromDamagePct)); if (x.healFromDamagePct || x.lowHpHealFromDamagePct) { const lowHpThreshold = Number(x.lowHpHealThreshold ?? 0); const normalHealPct = Number(x.healFromDamagePct ?? 0); const lowHpHealPct = Number(x.lowHpHealFromDamagePct ?? normalHealPct); const selectedHealPct = s.playerHp / effectiveMaxHp(s.character) <= lowHpThreshold ? lowHpHealPct : normalHealPct; healed += heal(s, Math.min(effectiveMaxHp(s.character) * Number(x.healFromDamageCapPct ?? 1), damage * selectedHealPct)); } if (x.healPct) healed += heal(s, effectiveMaxHp(s.character) * x.healPct); if (x.regenPct) s.hots.push({ pct: x.regenPct, roundsLeft: x.regenRounds ?? 3 }); if (x.shieldFromDamagePct) { const barrierScale = x.scalesWithBarrierPower ? 1 + playerStats(s).barrierPowerPct : 1; barrier(s, Math.min(effectiveMaxHp(s.character) * (x.shieldFromDamageCapPct ?? 1), damage * x.shieldFromDamagePct * barrierScale)); }
    if (s.classState.classId === 'clerigo' && x.judgmentStacksOnHit && s.enemy.judgment) {
      s.enemy.judgment.ticksLeft = judgmentDuration(s);
    }
    const judgmentConsumed = Math.max(0, judgmentBeforeResolution - (s.enemy.judgment?.stacks ?? 0));
    if (s.classState.classId === 'clerigo'
      && judgmentConsumed === 5
      && s.character.unlockedSkills.includes('clerigo:provacao:14')
      && Number(classRecord(s).juizoFinalRounds ?? 0) <= 0) {
      addClassNumber(s, 'faith', 1, 5);
      s.playerMods.push({ stat: 'matk', pct: JUIZO_FINAL_MATK_BUFF_PCT, roundsLeft: JUIZO_FINAL_MATK_BUFF_ROUNDS });
      classRecord(s).juizoFinalRounds = JUIZO_FINAL_MATK_BUFF_ROUNDS;
    }
    if (x.heatGain) addClassNumber(s, 'heat', x.heatGain, 100);
    if (x.amplifiedHeatGain && (classRecord(s).awakenedCast || classRecord(s).mageAmplified)) addClassNumber(s, 'heat', x.amplifiedHeatGain, 100);
    if (s.classState.classId === 'feiticeiro') {
      const pulse = resolvePulseGain({ pulse: stateResource(s, 'pulse'), resonance: stateResource(s, 'resonance'), control: stateResource(s, 'control') }, true, crits > 0);
      addClassNumber(s, 'pulse', pulse.state.pulse - stateResource(s, 'pulse'), 6);
    }
    if (s.classState.classId === 'cavaleiro') {
      const highHp = s.enemyHp / s.enemy.maxHp >= 0.9;
      const momentumGain = highHp && x.momentumGainOnHitExtraVsHighHp !== undefined ? x.momentumGainOnHitExtraVsHighHp : (x.momentumGainOnHitExtra ?? 0);
      if (momentumGain) addClassNumber(s, 'momentum', momentumGain, 100);
      if (x.enemyDefReductionPctBase !== undefined) {
        const reduction = Math.min(x.enemyDefReductionPctCap ?? 1, x.enemyDefReductionPctBase + Number(classRecord(s).momentumAtCast ?? 0) * (x.enemyDefReductionPctPerMomentum ?? 0));
        s.enemyMods.push({ stat: 'def', pct: -reduction, roundsLeft: x.enemyDefReductionRounds ?? 2 });
      }
      if (x.selfBuffAtkPctOnHit) s.playerMods.push({ stat: 'atk', pct: x.selfBuffAtkPctOnHit, roundsLeft: x.selfBuffRoundsOnHit ?? 2 });
      if (x.selfBuffSpeedPctOnHit) s.playerMods.push({ stat: 'speedPct', pct: x.selfBuffSpeedPctOnHit, roundsLeft: x.selfBuffRoundsOnHit ?? 2 });
      if (x.abaladoThreshold !== undefined && Number(classRecord(s).momentumSpentThisCast ?? 0) >= x.abaladoThreshold) s.enemyMods.push({ stat: 'dmgTakenPct', pct: x.abaladoDmgTakenPct ?? 0.1, roundsLeft: x.abaladoRounds ?? 2 });
    }
    if (s.classState.classId === 'ladino' && x.imageGain) classRecord(s).images = Math.min(3, Number(classRecord(s).images ?? 0) + x.imageGain);
    if (s.classState.classId === 'druida') {
      classRecord(s).attunement = Math.min(5, Number(classRecord(s).attunement ?? 0) + 1);
      if (x.druidAction === 'seed') classRecord(s).gardenSeeds = Number(classRecord(s).gardenSeeds ?? 0) + 1;
      if (x.druidAction === 'harvest') {
        const seeds = Number(classRecord(s).gardenSeeds ?? 0);
        classRecord(s).gardenSeeds = 0;
        if (seeds > 0) healed += heal(s, effectiveMaxHp(s.character) * Math.min(0.12, seeds * 0.04));
      }
      if (x.druidAction === 'cycle') classRecord(s).season = x.druidSeason ?? classRecord(s).season;
      if (x.druidAction === 'form' || x.druidAction === 'equilibrium') classRecord(s).form = x.druidSeason ?? 'cycle';
    }
  }
  if (s.classState.classId === 'bardo' && x.bardAppliesCountertempo) s.bardState = createCountertempo(s.bardState);
  if (s.classState.classId === 'bardo' && x.bardEncoreEligible) s.bardState = { ...s.bardState, encoreReady: true, encoreMemory: createEncorePayload(x) };
  if (s.classState.classId === 'bardo' && x.bardVoice && !x.bardFinale && !x.bardEncore) { const note = x.bardVoice === 'marcato' || x.bardVoice === 'dissonant' || x.bardVoice === 'lyrical' ? x.bardVoice as BardNote : chooseWildcardNote(s.bardState.notes, x.bardWildcardPolicy ?? 'harmonyFirst'); const out = appendBardNote(s.bardState, note); s.bardState = out.state; if (out.state.ovation) setClassNumber(s, 'ovation', 1, 1); }
  if (x.consecrationRoundsOnCast) classRecord(s).consecration = Math.max(Number(classRecord(s).consecration ?? 0), x.consecrationRoundsOnCast);
  if (x.shieldFaithThresholdPct !== undefined) classRecord(s).shieldFaithThresholdPct = x.shieldFaithThresholdPct;
  if (x.warlockBarrierPct && landed > 0) barrier(s, effectiveMaxHp(s.character) * x.warlockBarrierPct * (x.scalesWithBarrierPower ? 1 + playerStats(s).barrierPowerPct : 1));
  if (x.warlockNextEnemyDmgReductionPct && landed > 0) s.playerMods.push({ stat: 'dmgTakenPct', pct: -x.warlockNextEnemyDmgReductionPct, roundsLeft: 1 });
  if (x.warlockCollectionEchoPct && landed > 0) barrier(s, effectiveMaxHp(s.character) * Math.min(0.15, x.warlockCollectionEchoPct * 0.01));
  if (s.classState.classId === 'ladino' && landed > 0) {
    if (x.canExpose) classRecord(s).exposed = true;
    if (x.requiresImages && Number(classRecord(s).images ?? 0) < x.requiresImages) return { damage, healed, hits, landed, crits };
    const images = Number(classRecord(s).images ?? 0);
    const imageEchoRatio = Number(x.imageEchoRatio ?? 0);
    const sharpenedEchoOnCap = Boolean(x.sharpenedEchoOnCap && images >= 3);
    if (images > 0 && imageEchoRatio > 0 && damage > 0) {
      const echoDamage = Math.max(1, Math.round(damage * imageEchoRatio * images * (sharpenedEchoOnCap ? 1.15 : 1)));
      const beforeHp = s.enemyHp; s.enemyHp = Math.max(0, s.enemyHp - echoDamage); recordEnemyHpDamage(s, beforeHp);
      event(s, { type: 'damage', tick: s.envTick, actor: 'player', abilityId: id, amount: echoDamage, damageType: 'physical' });
    }
    if (x.consumeImages) classRecord(s).images = 0;
    if (x.consumeExposed) classRecord(s).exposed = false;
    if (x.enemyDirectDmgDebuffPct) s.enemyMods.push({ stat: 'atk', pct: -x.enemyDirectDmgDebuffPct, roundsLeft: x.enemyDirectDmgDebuffRounds ?? 2 });
    if (classRecord(s).stealthed) classRecord(s).stealthed = false;
    if (x.timeSteal) classRecord(s).timeStolen = true;
  }
  if (x.wildPostureActions) {
    classRecord(s).wildPostureRounds = Math.max(Number(classRecord(s).wildPostureRounds ?? 0), Number(x.wildPostureActions));
    classRecord(s).painRedirectPct = Number(x.painRedirectPct ?? classRecord(s).painRedirectPct ?? 0.3);
  }
  if (x.immunityRounds) classRecord(s).immunityRounds = x.immunityRounds;
  if (x.hasteRounds) classRecord(s).hasteRounds = x.hasteRounds;
  if (x.bardSpeedBuffPct) s.playerMods.push({ stat: 'speedPct', pct: x.bardSpeedBuffPct, roundsLeft: x.bardSpeedBuffRounds ?? 2 });
  if (x.bardMdefDebuffPct) s.enemyMods.push({ stat: 'mdef', pct: -x.bardMdefDebuffPct, roundsLeft: x.bardMdefDebuffRounds ?? 2 });
  if (x.bardNextEnemyDamageReductionPct) s.bardState = { ...s.bardState, nextEnemyDamageReductionPct: x.bardNextEnemyDamageReductionPct };
  if (x.bardNextEnemyAccuracyPenaltyPct) s.bardState = { ...s.bardState, outOfTune: true };
  if (s.classState.classId === 'feiticeiro' && landed > 0 && x.sorcererCooldownCutOnHit) s.cooldowns[id] = Math.max(0, (s.cooldowns[id] ?? 0) - 1);
  if (s.classState.classId === 'feiticeiro' && landed > 0 && x.sorcererEnemyDmgReductionPct) s.playerMods.push({ stat: 'dmgTakenPct', pct: -Number(x.sorcererEnemyDmgReductionPct), roundsLeft: x.sorcererEnemyDmgReductionRounds ?? 1 });
  if (x.paladinVerdict) classRecord(s).verdictActive = true;
  if (x.verdictAegisByConviction && landed > 0) {
    const aegis = x.verdictAegisByConviction[stateResource(s, 'conviction') as 1 | 2 | 3];
    if (aegis) s.aegis = { reductionPct: aegis.reductionPct, capPct: aegis.maxHpCapPct, hits: aegis.hits ?? 1, roundsLeft: x.aegisDuration ?? 3 };
  }
  if (x.renewAegisOnHit && landed > 0 && s.aegis) s.aegis.roundsLeft = Math.max(s.aegis.roundsLeft, x.renewAegisOnHit);
  if (s.classState.classId === 'paladino' && landed > 0 && x.activeHealMaxHpPct) healed += heal(s, effectiveMaxHp(s.character) * Number(x.activeHealMaxHpPct) * (1 + playerStats(s).healingPowerPct));
  if (x.druidAction === 'form') classRecord(s).form = x.druidSeason ?? 'cycle';
  if (x.druidAction === 'cycle') classRecord(s).season = x.druidSeason ?? classRecord(s).season;
  return { damage, healed, hits, landed, crits };
}

export interface ExecutedAbilityEffect {
  damage: number; healed: number; hits: number; landed: number; crits: number;
  plan: ReturnType<typeof abilityResolutionPlan>;
  appliedFields: string[];
}

/**
 * Shared stateful AbilityEffect executor used by the harness and live panel.
 * It owns both self-targeted and offensive resolution; callers only provide
 * a normalized CombatState and synchronize presentation afterwards.
 */
export function executeAbilityEffect(s: CombatState, effect: AbilityEffect, abilityId: string): ExecutedAbilityEffect {
  const raw = classRecord(s);
  if (raw.playerHpPctAtCast === undefined) raw.playerHpPctAtCast = s.playerHp / effectiveMaxHp(s.character);
  const fields = new Set<string>();
  const emitted = new Set<string>();
  const resolved = resolveAbilityEffect(effect, s.character.classId, fields, (field) => {
    if (emitted.has(field)) return;
    emitted.add(field);
    event(s, { type: 'effectApplied', tick: s.envTick, actor: 'player', abilityId, field });
  });
  const result = executeCombatAbilityEffect(s, resolved.effect, abilityId, resolved.plan);
  const x = resolved.effect as AbilityEffect & Record<string, any>;
  if (result.landed > 0 && x.warlockDebtSetAfter !== undefined) s.warlockPlayer = setWarlockDebt(s.warlockPlayer, x.warlockDebtSetAfter);
  if (result.landed > 0 && s.classState.classId === 'paladino' && x.paladinExtraVirtueBelowHp && Number(raw.playerHpPctAtCast) <= x.paladinExtraVirtueBelowHp.pct) {
    const paladin = s.classState as Extract<CombatClassState, { classId: 'paladino' }>;
    paladin.virtues[x.paladinExtraVirtueBelowHp.virtue as keyof PaladinVirtueSet] = true;
    setClassNumber(s, 'conviction', Object.values(paladin.virtues).filter(Boolean).length, 3);
  }
  return { ...result, plan: resolved.plan, appliedFields: [...fields] };
}
function abilities(s: CombatState): AbilityDef[] { return getEquippedAbilities(s.character.classId, s.character.unlockedSkills, s.equippedAbilityIds); }
function actionUseful(s: CombatState, ability: AbilityDef): boolean {
  if (ability.effect.kind === 'heal') return s.playerHp < effectiveMaxHp(s.character) - 1;
  if (ability.effect.kind === 'regen') return s.hots.length === 0;
  if (['shield','divineWall','orderResist','colossalShield','lastGuard','boneShield','boneFortress'].includes(ability.effect.kind)) return s.playerBarrier <= 0;
  if (['ironWall','livingFortress','wallStance','painGuard','lastStand'].includes(ability.effect.kind)) return !s.playerMods.some((mod) => mod.stat === 'dmgTakenPct' && mod.pct < 0 && mod.roundsLeft > 0);
  if (ability.effect.kind === 'aegis') return !s.aegis;
  if (ability.effect.kind === 'counterStance') return !classRecord(s).counterStanceActive;
  if (ability.effect.kind === 'kingsBanner') return !classRecord(s).kingsBannerActive;
  const actionEffect = ability.effect as Record<string, any>;
  if (actionEffect.paladinExtraVirtueBelowHp && s.playerHp / effectiveMaxHp(s.character) > actionEffect.paladinExtraVirtueBelowHp.pct) return false;
  if (ability.effect.kind === 'armTrap') return s.traps.length < 2;
  if (ability.effect.kind === 'preparedGuard') return !s.preparedGuard;
  return true;
}
function selected(s: CombatState): AbilityDef | undefined {
  const c = ctx(s);
  const equipped = abilities(s);
  const eligible = s.priorities
    .map((id) => equipped.find((ability) => ability.id === id))
    .filter((ability): ability is AbilityDef => !!ability
      && actionUseful(s, ability)
      && (s.cooldowns[ability.id] ?? 0) <= 0
      && payCheck(s, ability.effect)
      && evalAbilityCondition(ability.condition, c));
  if (s.classState.classId !== 'clerigo') return eligible[0];
  return prioritizeClericTrialRotation(eligible, {
    apocalypseEquipped: equipped.some((ability) => ability.id === CLERIC_APOCALIPSE_SAGRADO_ABILITY_ID),
    apocalypseCooldown: s.cooldowns[CLERIC_APOCALIPSE_SAGRADO_ABILITY_ID] ?? 0,
    judgmentStacks: s.enemy.judgment?.stacks ?? 0,
    faith: stateResource(s, 'faith'),
  })[0];
}
function payCheck(s: CombatState, e: AbilityEffect): boolean { return pay(s, e); }
function conditionResources(condition: AbilityDef['condition'], out = new Set<string>()): Set<string> {
  if (condition.type === 'resourceAtLeast' || condition.type === 'resourceAtMost' || condition.type === 'resourceBelow') if (condition.resource) out.add(condition.resource);
  for (const child of condition.conditions ?? []) conditionResources(child, out);
  return out;
}
function conditionStacks(condition: AbilityDef['condition'], out = new Set<string>()): Set<string> {
  if (condition.type === 'enemyStacksAtLeast' || condition.type === 'enemyStacksEqual') if (condition.stackId) out.add(condition.stackId);
  for (const child of condition.conditions ?? []) conditionStacks(child, out);
  return out;
}
function conditionHas(condition: AbilityDef['condition'], ...types: AbilityDef['condition']['type'][]): boolean {
  if (types.includes(condition.type)) return true;
  return (condition.conditions ?? []).some((child) => conditionHas(child, ...types));
}
function conditionStates(condition: AbilityDef['condition'], out = new Set<string>()): Set<string> {
  if (condition.type === 'stateActive' || condition.type === 'stateInactive') if (condition.state) out.add(condition.state);
  for (const child of condition.conditions ?? []) conditionStates(child, out);
  return out;
}
function effectCostResources(effect: AbilityEffect, out = new Set<string>()): Set<string> {
  const x = effect as Record<string, any>;
  const fields: Array<[string, string]> = [['furyCost','fury'],['faithCost','faith'],['determinationCost','determination'],['orderCost','orders'],['soulCost','souls'],['heatCost','heat'],['heatCostAll','heat'],['archerTensionCost','tension'],['archerCadenceCost','cadence'],['sorcererFractureConsume','fractures'],['sorcererResonanceConsume','resonance'],['sorcererControlConsume','control'],['warlockDebtPay','debt'],['warlockConsumeScars','scars'],['bardEchoCost','echo'],['bardOvationCost','ovation']];
  for (const [field, resource] of fields) if (x[field]) out.add(resource);
  if (x.momentumConsumeAll) out.add('momentum');
  return out;
}
function generatesResource(effect: AbilityEffect, resource: string): boolean {
  const x = effect as Record<string, any>;
  if (resource === 'fury') return !!(x.furyGainOnHit || x.furyGainFlat || x.kind === 'furyBoost' || x.kind === 'furyMaxFrenzy');
  if (resource === 'faith') return !!(x.shieldPct || x.shieldPctBase || x.healPct || x.faithGainOnHeal || x.kind === 'dispel');
  if (resource === 'determination' || resource === 'momentum') return !!(x.kind === 'bigHit' || x.kind === 'multiHit' || x.momentumGainOnHitExtra);
  if (resource === 'orders') return !!x.orderGainOnCast;
  if (resource === 'souls') return !!x.summonCount;
  if (resource === 'tension') return !!(x.archerShotType || x.kind === 'bigHit' || x.kind === 'multiHit');
  if (resource === 'cadence') return !!(x.archerShotType === 'volley' || x.archerCadenceGain);
  if (resource === 'steps') return !!x.archerDistanceShift;
  if (resource === 'debt') return !!x.warlockDebtGain;
  if (resource === 'scars') return !!x.warlockDebtGain || !!x.warlockSelfHpCostPct || !!x.warlockForcedCollectionPct || !!x.warlockEarlyCollectionPct;
  if (resource === 'echo' || resource === 'ovation') return !!x.bardVoice || !!x.bardAppliesCountertempo;
  if (resource === 'control') return !!x.sorcererControlGain || !!x.sorcererPath;
  if (resource === 'resonance') return !!x.sorcererResonanceGain || !!x.sorcererPath;
  if (resource === 'fractures') return !!x.sorcererFractureGain || !!x.sorcererPath;
  if (resource === 'breach') return !!x.breachGainOnHit;
  if (resource === 'conviction') return !!x.paladinVirtues || !!x.paladinExtraVirtueBelowHp;
  if (resource === 'heat') return !!x.heatGain;
  return false;
}
function consumesResource(effect: AbilityEffect, resource: string): boolean {
  const x = effect as Record<string, any>;
  return (resource === 'fury' && !!x.furyCost) || (resource === 'faith' && !!x.faithCost) ||
    (resource === 'determination' && !!x.determinationCost) || (resource === 'momentum' && !!x.momentumConsumeAll) ||
    (resource === 'orders' && !!x.orderCost) || (resource === 'souls' && !!x.soulCost) ||
    (resource === 'heat' && (!!x.heatCost || !!x.heatCostAll)) || (resource === 'tension' && !!x.archerTensionCost) ||
    (resource === 'cadence' && !!x.archerCadenceCost) || (resource === 'debt' && !!x.warlockDebtPay) ||
    (resource === 'scars' && !!x.warlockConsumeScars) || (resource === 'echo' && !!x.bardEchoCost) ||
    (resource === 'ovation' && !!x.bardOvationCost) || (resource === 'fractures' && !!x.sorcererFractureConsume) ||
    (resource === 'resonance' && !!x.sorcererResonanceConsume) || (resource === 'control' && !!x.sorcererControlConsume);
}
function generatesStack(effect: AbilityEffect, stack: string): boolean {
  const x = effect as Record<string, any>;
  return (stack === 'wounds' && !!x.woundStacksOnHit) || (stack === 'breach' && !!x.breachGainOnHit) ||
    (stack === 'judgment' && !!x.judgmentStacksOnHit) || (stack === 'decomposition' && !!x.decompositionOnHit) ||
    (stack === 'fracture' && !!x.sorcererFractureGain) || (stack === 'trapsTriggered' && x.kind === 'armTrap') ||
    (stack === 'trail' && (x.kind === 'armTrap' || !!x.trapTrailGainBase));
}
function reducesPosture(effect: AbilityEffect): boolean {
  const x = effect as Record<string, any>;
  return !!(x.postureDamage || x.postureDamagePerHit || x.postureDamageFirm || x.postureDamageByBand || x.kind === 'feint');
}
export function naturalAbilityPriorities(target: AbilityDef, supportingAbilityIds: string[], character: Pick<Character, 'classId' | 'unlockedSkills'>): string[] {
  const support = supportingAbilityIds.map((id) => getEquippedAbilities(character.classId, character.unlockedSkills, [id])[0]).filter(Boolean) as AbilityDef[];
  const required = conditionResources(target.condition);
  for (const resource of effectCostResources(target.effect)) required.add(resource);
  const stacks = conditionStacks(target.condition);
  const states = conditionStates(target.condition);
  // A proof priority is deliberately a small real rotation: abilities that
  // create the requested condition come first, then the target.  Other
  // equipped skills remain equipped but are omitted from the priority list so
  // they cannot consume the very resource/state being proved; the engine then
  // performs its normal basic attack when no prioritized skill is eligible.
  const preparatory = support.filter((a) => {
    const x = a.effect as Record<string, any>;
    const resourceGenerator = [...required].some((resource) => generatesResource(a.effect, resource) && !consumesResource(a.effect, resource));
    const distanceGenerator = required.has('distance') && Number(x.archerDistanceShift ?? 0) > 0;
    const stackGenerator = [...stacks].some((stack) => generatesStack(a.effect, stack));
    const postureGenerator = conditionHas(target.condition, 'enemyPostureAtMost', 'enemyPostureBand', 'guardBroken') && reducesPosture(a.effect);
    const stateGenerator = [...states].some((state) => (state === 'encoreReady' && !!x.bardEncoreEligible) || (state === 'consecration' && !!x.consecrationRoundsOnCast) || (state === 'thermal' && !!x.thermalAdvanceOnHit) || (state === 'trapTriggeredRecently' && x.kind === 'armTrap') || (state === 'riposteReady' && x.kind === 'preparedGuard') || (state === 'trueName' && !!x.warlockBindOnHit));
    const conditionStateGenerator = conditionHas(target.condition, 'riposteReady') && x.kind === 'preparedGuard';
    const imageGenerator = conditionHas(target.condition, 'imageCountAtLeast') && !!x.imageGain;
    const virtueGenerator = required.has('conviction') && generatesResource(a.effect, 'conviction');
    const safeDefense = required.size > 0 && SELF_KINDS.has(a.effect.kind) && !Object.keys(x).some((key) => key.endsWith('Cost'));
    return resourceGenerator || distanceGenerator || stackGenerator || postureGenerator || stateGenerator || conditionStateGenerator || imageGenerator || virtueGenerator || safeDefense;
  });
  return [target.id, ...preparatory.map((a) => a.id)];
}
function advanceArcherFlights(s: CombatState, existingIds: number[]): void {
  if (s.classState.classId !== 'arqueiro' || existingIds.length === 0 || s.enemyHp <= 0) return;
  const advanced = advanceInFlightArrows(s.archerState, existingIds);
  s.archerState = advanced.state;
  for (const arrow of advanced.landed) {
    if (s.enemyHp <= 0) break;
    if (step(s) < clamp((s.enemy.evasion ?? 0) - arrow.accuracy, 0, 0.75)) {
      event(s, { type: 'miss', tick: s.envTick, actor: 'player', abilityId: arrow.sourceAbilityId });
      continue;
    }
    const magical = false;
    const result = rollAbilityHit(arrow.atk, s.enemy.def * (1 - clamp(arrow.defPenPct, 0, 0.9)), arrow.dmgMult, arrow.critChance, arrow.critDmgMult, false, () => step(s));
    let amount = result.dmg;
    if (s.enemyBarrier > 0) {
      const absorbed = Math.min(s.enemyBarrier, amount);
      s.enemyBarrier -= absorbed; amount -= absorbed;
      event(s, { type: 'barrierAbsorb', tick: s.envTick, actor: 'enemy', amount: absorbed });
    }
    event(s, { type: 'hit', tick: s.envTick, actor: 'player', abilityId: arrow.sourceAbilityId });
    if (result.crit) event(s, { type: 'crit', tick: s.envTick, actor: 'player', abilityId: arrow.sourceAbilityId });
    const beforeHp = s.enemyHp; s.enemyHp = Math.max(0, s.enemyHp - amount); recordEnemyHpDamage(s, beforeHp);
    event(s, { type: 'damage', tick: s.envTick, actor: 'player', abilityId: arrow.sourceAbilityId, amount, damageType: magical ? 'magical' : 'physical', crit: result.crit });
  }
  if (s.enemyHp <= 0) finishEnemy(s);
}
export function resolvePlayerAction(s: CombatState): CombatState {
  if (s.dead || s.won || s.enemyHp <= 0) return s;
  s.actions += 1;
  const incapacitated = s.playerCC.some((x) => x.kind === 'stun' || x.kind === 'sleep');
  if (incapacitated) return s;
  const archerDistanceAtActionStart = s.archerState.distance;
  let a = selected(s);
  if (!a) {
    const r = attack(s, null);
    if (r.landed && s.classState.classId === 'guerreiro' && s.enemy.warrior && !s.enemy.warrior.guardBroken) {
      s.enemy.warrior.current = Math.max(0, s.enemy.warrior.current - POSTURE_BASIC_DAMAGE);
      if (s.enemy.warrior.current <= 0) s.enemy.warrior.guardBroken = true;
    }
    if (r.landed && s.classState.classId === 'barbaro') addClassNumber(s, 'fury', FURY_GAIN_BASIC_HIT, 100);
    if (r.landed && s.classState.classId === 'feiticeiro') addClassNumber(s, 'pulse', 2, 6);
    if (r.landed && s.classState.classId === 'cavaleiro') {
      addClassNumber(s, 'momentum', 10, 100);
      addClassNumber(s, 'determination', 3, 100);
    }
    if (s.classState.classId === 'arqueiro') {
      s.archerState = r.landed
        ? gainArcherTension(s.archerState, tensionForPreciseHit(archerDistanceAtActionStart))
        : loseArcherTension(s.archerState, 8);
    }
    if (s.enemyHp <= 0) finishEnemy(s);
    return s;
  }
  const fieldTrace = new Set<string>();
  const emittedFields = new Set<string>();
  const markFieldApplied = (field: string) => {
    if (emittedFields.has(field)) return;
    emittedFields.add(field);
    event(s, { type: 'effectApplied', tick: s.envTick, actor: 'player', abilityId: a!.id, field });
  };
  a = { ...a, effect: traceAbilityEffect(a.effect, fieldTrace, markFieldApplied), extraEffects: a.extraEffects?.map((extra) => traceAbilityEffect(extra, fieldTrace, markFieldApplied)) };
  if (!pay(s, a.effect)) return s;
  const bardOvationAtCast = s.classState.classId === 'bardo' ? s.bardState.ovation : 0;
  classRecord(s).bardOvationAtCast = bardOvationAtCast;
  let effectToResolve = a.effect;
  if (a.effect.bardEncore) {
    if (!canEncore(s.bardState) || !s.bardState.encoreMemory) return s;
    effectToResolve = materializeEncoreEffect(a.effect, s.bardState.encoreMemory);
  }
  effectToResolve = traceAbilityEffect(effectToResolve, fieldTrace, markFieldApplied);
  const x = effectToResolve as Record<string, any>; classRecord(s).momentumAtCast = stateResource(s, 'momentum'); classRecord(s).heatAtCast = stateResource(s, 'heat'); classRecord(s).sorcererFracturesAtCast = s.sorcererEnemy.fractures; classRecord(s).playerHpPctAtCast = s.playerHp / effectiveMaxHp(s.character);
  if (x.selfDebuffOnCastAlways) {
    if (x.selfDebuffDefPct) s.playerMods.push({ stat: 'def', pct: x.selfDebuffDefPct, roundsLeft: x.selfDebuffRounds ?? 2 });
    if (x.selfDebuffSpeedPct) s.playerMods.push({ stat: 'speedPct', pct: x.selfDebuffSpeedPct, roundsLeft: x.selfDebuffRounds ?? 2 });
  }
  if (x.opensOrderRefundWindow) classRecord(s).orderRefundWindow = true;
  for (const [resource, amount] of costs(a.effect)) {
    if (resource === 'fractures') s.sorcererEnemy = consumeFractures(s.sorcererEnemy, amount);
    else if (resource === 'debt') s.warlockPlayer = setWarlockDebt(s.warlockPlayer, s.warlockPlayer.debt - amount);
    else if (resource === 'echo') s.bardState = consumeEcho(s.bardState, amount);
    else if (resource === 'ovation') s.bardState = consumeOvation(s.bardState, s.character.unlockedSkills.includes('bardo:inspiracao:14'));
    else changeResource(s, resource, -amount);
  }
  if (a.effect.bardEncore) s.bardState = { ...s.bardState, encoreReady: false, encoreMemory: null };
  if (x.heatCostAll) changeResource(s, 'heat', -stateResource(s, 'heat'));
  if (x.momentumConsumeAll) { classRecord(s).momentumSpentThisCast = stateResource(s, 'momentum'); setClassNumber(s, 'momentum', 0, 100); }
  if (x.warlockConsumeScars) { const consumed = consumeScars(s.warlockPlayer); s.warlockPlayer = consumed.state; classRecord(s).scarsThisCast = consumed.snapshot; }
  if (s.classState.classId === 'feiticeiro') { const cast = beginActiveCast({ pulse: stateResource(s, 'pulse'), resonance: stateResource(s, 'resonance'), control: stateResource(s, 'control') }); setClassNumber(s, 'pulse', cast.next.pulse, 6); classRecord(s).awakenedCast = cast.awakened; if (cast.awakened && x.sorcererPath === 'rupture') s.sorcererEnemy = addFractures(s.sorcererEnemy, 1); if (cast.awakened && x.sorcererPath === 'reverberation') addClassNumber(s, 'resonance', 1, 2); if (cast.awakened && x.sorcererPath === 'shaping') addClassNumber(s, 'control', 1, 2); if (!cast.awakened && x.sorcererResonanceConsume && stateResource(s, 'resonance') > 0) s.classState.resources.resonance = consumeResonance({ pulse: cast.next.pulse, resonance: stateResource(s, 'resonance'), control: stateResource(s, 'control') }).resonance; }
  if (s.classState.classId === 'mago') {
    const runes = nextRunes(Number(classRecord(s).runes ?? 0));
    classRecord(s).runes = runes.next;
    classRecord(s).mageAmplified = runes.amplified;
    if (x.polarity) {
      const circuit = circuitAfterCast((classRecord(s).magePolarity ?? 'none') as 'none' | 'positive' | 'negative', x.polarity, Number(classRecord(s).mageCircuit ?? 0), x.circuitPerfectWithInverter === true && classRecord(s).mageInverterPending === true);
      classRecord(s).magePolarity = circuit.last; classRecord(s).mageCircuit = circuit.circuit;
      classRecord(s).mageInverterPending = false;
    }
  }
  if (s.classState.classId === 'bruxo') { const projection = projectWarlockCast({ debt: s.warlockPlayer.debt, debtGain: x.warlockDebtGain, credit: s.warlockPlayer.credit, forgeryReady: s.warlockPlayer.forgeryReady, maxHp: effectiveMaxHp(s.character), currentHp: s.playerHp, selfHpCostPct: x.warlockSelfHpCostPct, collectionPct: x.warlockForcedCollectionPct ?? x.warlockEarlyCollectionPct }); if (!projection.safeToCast) return s; s.warlockPlayer = applyWarlockDebt(s.warlockPlayer, projection); if (projection.selfHpCost + projection.collectionHpCost) { s.playerHp = Math.max(1, s.playerHp - projection.selfHpCost - projection.collectionHpCost); s.warlockPlayer = addWarlockScar(s.warlockPlayer, projection.collectionHpCost, effectiveMaxHp(s.character)); } if (x.warlockConsumeTrueName) { s.warlockPlayer = consumeTrueName(s.warlockPlayer); s.warlockEnemy = consumeTrueNameAndRefragment(s.warlockEnemy, false); } }
  if (s.classState.classId === 'paladino') {
    const paladin = s.classState as Extract<CombatClassState, { classId: 'paladino' }>;
    const virtue = x.paladinVirtues?.[0] ?? (x.paladinPath === 'aegis' ? 'courage' : x.paladinPath === 'verdict' ? 'justice' : x.paladinPath === 'redemption' ? 'mercy' : undefined);
    if (virtue) {
      const next = invokePaladinVirtue({ virtues: paladin.virtues, regent: null, actionsLeft: paladin.liturgy, skipNextAdvance: false }, virtue as 'justice' | 'courage' | 'mercy');
      paladin.virtues = next.virtues; paladin.liturgy = next.actionsLeft;
      classRecord(s).verdictRegent = virtue;
      classRecord(s).liturgyRefresh = true;
      setClassNumber(s, 'conviction', Object.values(paladin.virtues).filter(Boolean).length, 3);
    }
  }
  if (s.classState.classId === 'arqueiro') { if (x.archerTensionCost) s.archerState = loseArcherTension(s.archerState, x.archerTensionCost); if (x.archerCadenceCost) s.archerState = loseArcherCadence(s.archerState, x.archerCadenceCost); if (x.archerConsumesSteps) s.archerState = consumeArcherSteps(s.archerState, x.archerConsumesSteps).state; if (x.archerConsumesPerfectRhythm) s.archerState = consumePerfectRhythm(s.archerState); if (x.archerDistanceShift) s.archerState = archerDistanceShift(s.archerState, x.archerDistanceShift); }
  if (x.sacrificeOldestSummon && s.classState.classId === 'necromante') { const raw = classRecord(s); const attacks = Array.isArray(raw.servantAttacks) ? raw.servantAttacks as number[] : []; attacks.shift(); raw.servantAttacks = attacks; raw.servants = attacks.length; }
  if (x.orderGainOnCast) addClassNumber(s, 'orders', x.orderGainOnCast, 3); s.cooldowns[a.id] = Math.max(1, a.cooldown); event(s, { type: 'abilityCast', tick: s.envTick, actor: 'player', abilityId: a.id, name: a.name }); const result = executeAbilityEffect(s, effectToResolve, a.id); for (const extra of a.extraEffects ?? []) executeAbilityEffect(s, extra, a.id); if (s.classState.classId === 'arqueiro') { if (result.landed && x.archerTensionOverrideOnHit !== undefined) s.archerState = gainArcherTension(s.archerState, archerDistanceAtActionStart === 3 ? (x.archerTensionOverrideAtHorizon ?? x.archerTensionOverrideOnHit) : x.archerTensionOverrideOnHit); else if (result.landed && (x.archerShotType === 'precise')) s.archerState = gainArcherTension(s.archerState, tensionForPreciseHit(archerDistanceAtActionStart)); else if (!result.landed && x.archerShotType === 'precise') s.archerState = loseArcherTension(s.archerState, 8); if (result.landed && x.archerShotType === 'volley') s.archerState = gainArcherCadence(s.archerState, 1); if (x.archerFlightCount || (x.archerCreatesFlightOnHits && result.landed >= x.archerCreatesFlightOnHits)) { const stats = playerStats(s); const authoredFlightDmgMult = Number(x.archerFlightDmgMult ?? x.dmgMult ?? 0.5); const flightCount = x.archerFlightCount ?? 1; const room = Math.max(0, 3 - s.archerState.arrows.length); s.archerState = scheduleInFlightArrows(s.archerState, Array.from({ length: Math.min(flightCount, room) }, (_, i) => flightSnapshotFromAbility(a, { ...stats, defPenPct: 0 }, s.archerState.distance, x.archerFlightHitDmgMults?.[i] ?? (stateResource(s, 'tension') >= 50 ? (x.archerFlightHighTensionDmgMult ?? x.archerFlightDmgMult ?? 0.5) : authoredFlightDmgMult), x.archerFlightTimer ?? 1))); } }
  if (result.landed && x.warlockBindOnHit) { s.warlockEnemy = bindWarlockEnemy(s.warlockEnemy); if (x.warlockPath === 'maldicao') s.warlockEnemy = addNameFragment(s.warlockEnemy, 1); } if (result.landed && x.warlockDebtSetAfter !== undefined) s.warlockPlayer = setWarlockDebt(s.warlockPlayer, x.warlockDebtSetAfter); if (s.classState.classId === 'paladino' && x.paladinExtraVirtueBelowHp && Number(classRecord(s).playerHpPctAtCast ?? (s.playerHp / effectiveMaxHp(s.character))) <= x.paladinExtraVirtueBelowHp.pct) { const p = x.paladinExtraVirtueBelowHp.virtue as keyof PaladinVirtueSet; (s.classState as Extract<CombatClassState, { classId: 'paladino' }>).virtues[p] = true; setClassNumber(s, 'conviction', Object.values((s.classState as Extract<CombatClassState, { classId: 'paladino' }>).virtues).filter(Boolean).length, 3); } if (result.landed && s.classState.classId === 'bardo' && x.bardEncoreEligible) { s.bardState = { ...s.bardState, encoreReady: true, encoreMemory: createEncorePayload(x) }; } if (s.enemyHp <= 0) finishEnemy(s); return s; }
function finishEnemy(s: CombatState): void { if (s.classState.classId === 'necromante') addClassNumber(s, 'souls', 1, 10); s.won = true; event(s, { type: 'enemyDeath', tick: s.envTick }); }
function triggerArmedTrap(s: CombatState): void {
  if (s.classState.classId !== 'cacador' || s.traps.length === 0 || s.enemyHp <= 0) return;
  const trap = s.traps.shift()!; const x = trap.effect as Record<string, any>; const marked = (s.enemy.hunterTrail ?? 0) >= 3;
  const baseMultiplier = Number(x.trapDirectDmgMultBase ?? 1);
  const markedMultiplier = Number(x.trapDirectDmgMultMarked ?? baseMultiplier);
  const multiplier = marked ? markedMultiplier : baseMultiplier;
  const result = attack(s, { kind: 'bigHit', dmgType: 'physical', dmgMult: multiplier, guaranteedHit: true }, trap.sourceAbilityId);
  if (!result.landed) return;
  classRecord(s).trapsTriggered = Number(classRecord(s).trapsTriggered ?? 0) + 1;
  if (x.trapPoisonRounds) addStatus(s, 'enemy', 'poison', x.trapPoisonRounds, x.trapPoisonDmgMultPerTick ?? 0);
  if (x.trapDebuffStat) s.enemyMods.push({ stat: x.trapDebuffStat, pct: marked ? (x.trapDebuffPctMarked ?? x.trapDebuffPct ?? 0) : (x.trapDebuffPct ?? 0), roundsLeft: x.trapDebuffRounds ?? 2 });
  if (x.trapTrailGainBase) s.enemy.hunterTrail = Math.min(5, (s.enemy.hunterTrail ?? 0) + (marked ? (x.trapTrailGainMarked ?? 0) : x.trapTrailGainBase));
  if (s.enemyHp <= 0) finishEnemy(s);
}
export function resolveEnemyAction(s: CombatState): CombatState {
  if (s.dead || s.won || s.enemyHp <= 0) return s;
  s.enemyActions += 1;
  event(s, { type: 'enemyAction', tick: s.envTick, name: 'Ataque' });
  if (s.enemyCC.some((x) => x.kind === 'stun' || x.kind === 'sleep')) return s;
  if (s.classState.classId === 'barbaro' && Number(classRecord(s).wildPostureRounds ?? 0) > 0) {
    classRecord(s).wildPostureRounds = Number(classRecord(s).wildPostureRounds) - 1;
  }
  const enemyAccuracy = Number((s.enemy as unknown as Record<string, number>).accuracy ?? 0);
  autoPotion(s);
  if (s.dead || s.won || s.enemyHp <= 0) return s;
  const stats = playerStats(s);
  const evaded = step(s) < clamp(stats.evasion + modTotal(s.playerMods, 'evasion') - enemyAccuracy, 0, 0.75);
  if (evaded) {
    event(s, { type: 'miss', tick: s.envTick, actor: 'enemy' });
    if (s.classState.classId === 'arqueiro') { s.archerState = gainArcherSteps(s.archerState, 1); if (s.character.unlockedSkills.includes('arqueiro:instinto:8')) s.archerState = prepareArcherReflex(s.archerState); }
    triggerArmedTrap(s);
    s.bardState = countertempoEcho(s.bardState, 1, 0, true);
    return s;
  }
  const magical = s.enemy.atkType === 'magical';
  const r = rollAttack(enemyAttack(s, magical), magical ? stats.mdef : stats.def, .06, 1.6, () => step(s));
  const preParryDamage = r.dmg * Math.max(0, 1 + modTotal(s.playerMods, 'dmgTakenPct'));
  let damage = preParryDamage;
  const blockChance = Math.max(Number(classRecord(s).minBlockChancePct ?? 0), stats.blockChance + modTotal(s.playerMods, 'block'));
  const blocked = step(s) < clamp(blockChance, 0, 0.75);
  if (blocked) damage = 0;
  if (s.classState.classId === 'guerreiro' && s.preparedGuard && damage > 0) {
    const guard = s.preparedGuard;
    const reduced = parryReduction(guard.damageReductionPct, 0, false, false);
    damage = Math.max(0, Math.round(damage * (1 - reduced)));
    if (s.enemy.warrior) {
      s.enemy.warrior.current = Math.max(0, s.enemy.warrior.current - guard.postureDamage);
      s.enemy.warrior.pressureRecoveryPending = true;
    }
    if (guard.canGenerateRiposte && guard.parriesResolved === 0) classRecord(s).riposteReady = true;
    s.preparedGuard = guard.remainingParries > 1 ? { ...guard, remainingParries: guard.remainingParries - 1, parriesResolved: guard.parriesResolved + 1 } : undefined;
  }
  if (s.deathVeil > 0) damage *= 0.5;
  if (s.aegis) {
    const reduced = Math.min(damage * s.aegis.reductionPct, effectiveMaxHp(s.character) * s.aegis.capPct);
    damage -= reduced; s.aegis.hits -= 1; if (s.aegis.hits <= 0) s.aegis = undefined;
  }
  if (Number(classRecord(s).lastGuardRounds ?? 0) > 0) damage = Math.min(damage, Math.max(0, s.playerHp - 1));
  if (s.classState.classId === 'cavaleiro' && classRecord(s).counterStanceActive && damage > 0) {
    const vit = totalAttributes(s.character).vit;
    const cap = effectiveMaxHp(s.character) * Math.min(Number(classRecord(s).counterCapPctCap ?? 0.04), Number(classRecord(s).counterCapPctBase ?? 0.08) + vit * Number(classRecord(s).counterCapPctPerVit ?? 0));
    classRecord(s).counterStored = Math.min(cap, Number(classRecord(s).counterStored ?? 0) + damage * Number(classRecord(s).counterStoragePct ?? 0.3));
  }
  if (s.playerBarrier) {
    const absorbed = Math.min(s.playerBarrier, damage); s.playerBarrier -= absorbed; damage -= absorbed;
    event(s, { type: 'barrierAbsorb', tick: s.envTick, actor: 'player', amount: absorbed });
    absorbPlayerBarrier(s, absorbed);
    if (s.classState.classId === 'cavaleiro') {
      const gained = determinationForPreventedDamage({ amountPrevented: absorbed, effectiveMaxHp: effectiveMaxHp(s.character), thresholdPct: DETERMINATION_GEN_BARRIER_THRESHOLD_PCT, pointsPerThreshold: DETERMINATION_GEN_BARRIER_PER_3PCT, capPoints: DETERMINATION_GEN_BARRIER_CAP_PER_ACTION });
      if (gained > 0) addClassNumber(s, 'determination', gained, 100);
    }
  }
  const rawDamageAfterBarrier = damage;
  const painRedirectPct = s.classState.classId === 'barbaro' ? Number(classRecord(s).painRedirectPct ?? 0) : 0;
  const currentPain = s.classState.classId === 'barbaro' ? Number(classRecord(s).pain ?? 0) : 0;
  const painCap = effectiveMaxHp(s.character) * 0.35;
  const redirected = Math.min(rawDamageAfterBarrier * painRedirectPct, Math.max(0, painCap - currentPain));
  damage = Math.max(0, damage - redirected);
  s.playerHp = Math.max(0, s.playerHp - damage);
  event(s, { type: 'hit', tick: s.envTick, actor: 'enemy' });
  if (r.crit) event(s, { type: 'crit', tick: s.envTick, actor: 'enemy' });
  event(s, { type: 'damage', tick: s.envTick, actor: 'enemy', amount: damage, damageType: magical ? 'magical' : 'physical', crit: r.crit });
  if (s.classState.classId === 'barbaro') {
    addClassNumber(s, 'fury', FURY_GAIN_TAKE_DAMAGE, 100);
    classRecord(s).pain = Math.min(painCap, currentPain + redirected + rawDamageAfterBarrier * 0.3);
  }
  if (s.classState.classId === 'cavaleiro') {
    const gained = determinationForDirectHit({ landed: true, blocked, fortressActive: false });
    if (gained > 0) addClassNumber(s, 'determination', gained, 100);
  }
  if (s.classState.classId === 'arqueiro') {
    s.archerState = loseArcherTension(s.archerState, 18);
    if (s.archerState.distance > 0) s.archerState = archerDistanceShift(s.archerState, -1);
  }
  if (s.classState.classId === 'barbaro' && classRecord(s).wallStance) addClassNumber(s, 'fury', Number(classRecord(s).furyPerHitTaken ?? 4), 100);
  if (s.playerHp <= 0 && s.reviveWindow > 0) {
    s.reviveWindow = 0; const revivePct = Number(classRecord(s).reviveHealPct ?? 0.4); const capPct = Number(classRecord(s).reviveHealCapPct ?? 1); s.playerHp = Math.max(1, Math.round(Math.min(effectiveMaxHp(s.character) * capPct, effectiveMaxHp(s.character) * revivePct)));
    event(s, { type: 'heal', tick: s.envTick, actor: 'player', amount: s.playerHp });
  } else if (s.playerHp <= 0) {
    s.dead = true; event(s, { type: 'playerDeath', tick: s.envTick });
  }
  if (s.enemy.proc && step(s) < s.enemy.proc.chance) {
    if (s.enemy.proc.status) addStatus(s, 'player', s.enemy.proc.status, s.enemy.proc.rounds, s.enemy.proc.statModPct ?? 0);
    if (s.enemy.proc.cc) s.playerCC.push({ kind: s.enemy.proc.cc, roundsLeft: s.enemy.proc.rounds });
    if (s.enemy.proc.statMod) s.playerMods.push({ stat: s.enemy.proc.statMod, pct: s.enemy.proc.statModPct ?? -0.1, roundsLeft: s.enemy.proc.rounds });
  }
  triggerArmedTrap(s);
  s.bardState = countertempoEcho(s.bardState, 1, 1, true);
  return s;
}
export function resolveEnvironmentTick(s: CombatState): CombatState {
  if (s.dead || s.won) return s;
  s.envTick += 1;
  s.potionCooldown = Math.max(0, s.potionCooldown - 1);
  const cooldownStep = Number(classRecord(s).hasteRounds ?? 0) > 0 ? 2 : 1;
  for (const id of Object.keys(s.cooldowns)) s.cooldowns[id] = Math.max(0, s.cooldowns[id] - cooldownStep);

  const tickStatuses = (statuses: CombatStatus[], actor: 'player' | 'enemy') => {
    for (const status of statuses) {
      if (status.damagePct > 0) {
        const amount = Math.max(1, Math.round((actor === 'player' ? effectiveMaxHp(s.character) : playerStats(s).atk) * status.damagePct));
        if (actor === 'player') s.playerHp = Math.max(0, s.playerHp - amount);
        else { const beforeHp = s.enemyHp; s.enemyHp = Math.max(0, s.enemyHp - amount); recordEnemyHpDamage(s, beforeHp); }
        event(s, { type: 'dotTick', tick: s.envTick, actor, status: status.kind, amount });
      }
      status.roundsLeft -= 1;
      if (status.roundsLeft <= 0) event(s, { type: 'statusExpire', tick: s.envTick, actor, status: status.kind });
    }
  };
  tickStatuses(s.playerStatuses, 'player');
  tickStatuses(s.enemyStatuses, 'enemy');
  s.playerStatuses = s.playerStatuses.filter((status) => status.roundsLeft > 0);
  s.enemyStatuses = s.enemyStatuses.filter((status) => status.roundsLeft > 0);
  if (s.classState.classId === 'necromante' && Number(classRecord(s).plague ?? 0) > 0 && s.enemyHp > 0) {
    const amount = Math.max(1, Math.round(playerStats(s).matk * Number(classRecord(s).plagueMultiplier ?? 0.16)));
    const beforeHp = s.enemyHp; s.enemyHp = Math.max(0, s.enemyHp - amount); recordEnemyHpDamage(s, beforeHp);
    event(s, { type: 'dotTick', tick: s.envTick, actor: 'enemy', amount });
    classRecord(s).plague = Number(classRecord(s).plague) - 1;
  }

  const wounds = s.enemy.barbarianWounds;
  if (wounds && s.enemyHp > 0) {
    const amount = Math.max(1, Math.round(playerStats(s).atk * WOUND_DMG_PCT_PER_STACK * wounds.stacks));
    const beforeHp = s.enemyHp; s.enemyHp = Math.max(0, s.enemyHp - amount); recordEnemyHpDamage(s, beforeHp);
    event(s, { type: 'dotTick', tick: s.envTick, actor: 'enemy', amount });
    wounds.ticksLeft -= 1; if (wounds.ticksLeft <= 0) s.enemy.barbarianWounds = undefined;
  }
  for (const hot of s.hots) { heal(s, effectiveMaxHp(s.character) * hot.pct); hot.roundsLeft -= 1; }
  s.hots = s.hots.filter((hot) => hot.roundsLeft > 0);
  if (s.classState.classId === 'necromante' && s.enemyHp > 0) {
    const rawSummons = classRecord(s);
    const attacks = Array.isArray(rawSummons.servantAttacks) ? rawSummons.servantAttacks as number[] : [];
    let total = 0;
    for (let i = attacks.length - 1; i >= 0; i -= 1) {
      if (attacks[i] <= 0) { attacks.splice(i, 1); continue; }
      const amount = Math.max(1, Math.round(playerStats(s).matk * 0.2));
      const beforeHp = s.enemyHp; s.enemyHp = Math.max(0, s.enemyHp - amount); recordEnemyHpDamage(s, beforeHp);
      total += amount; attacks[i] -= 1;
      if (s.enemyHp <= 0) break;
    }
    rawSummons.servantAttacks = attacks;
    rawSummons.servants = attacks.length;
    if (total > 0) event(s, { type: 'summonAttack', tick: s.envTick, amount: total });
  }
  if (s.classState.classId === 'paladino') {
    const paladin = s.classState as Extract<CombatClassState, { classId: 'paladino' }>;
    if (classRecord(s).liturgyRefresh) delete classRecord(s).liturgyRefresh;
    else if (paladin.liturgy > 0) {
      paladin.liturgy -= 1;
      if (paladin.liturgy <= 0) { paladin.virtues = { justice: false, courage: false, mercy: false }; setClassNumber(s, 'conviction', 0, 3); classRecord(s).verdictRegent = null; }
    }
  }
  for (const list of [s.playerMods, s.enemyMods]) for (const mod of list) mod.roundsLeft -= 1;
  s.playerMods = s.playerMods.filter((mod) => mod.roundsLeft > 0);
  s.enemyMods = s.enemyMods.filter((mod) => mod.roundsLeft > 0);
  s.playerCC = s.playerCC.map((cc) => ({ ...cc, roundsLeft: cc.roundsLeft - 1 })).filter((cc) => cc.roundsLeft > 0);
  s.enemyCC = s.enemyCC.map((cc) => ({ ...cc, roundsLeft: cc.roundsLeft - 1 })).filter((cc) => cc.roundsLeft > 0);

  if (s.enemy.warrior) {
    const warrior = s.enemy.warrior;
    const recovery = recoverablePosture(warrior, { pressure: warrior.pressureRecoveryPending, suppressed: warrior.suppressedActionsLeft > 0, zero: warrior.zeroRecoveryPending });
    warrior.current = Math.min(warrior.max, warrior.current + recovery);
    warrior.pressureRecoveryPending = false; warrior.zeroRecoveryPending = false;
    warrior.suppressedActionsLeft = Math.max(0, warrior.suppressedActionsLeft - 1);
    warrior.ticksLeft -= 1; if (warrior.ticksLeft <= 0) s.enemy.warrior = undefined;
  }
  if (s.enemy.judgment) s.enemy.judgment = tickJudgmentState(s.enemy.judgment);
  if (s.enemy.hunterBreaches) { s.enemy.hunterBreaches.ticksLeft -= 1; if (s.enemy.hunterBreaches.ticksLeft <= 0) s.enemy.hunterBreaches = undefined; }
  if (s.classState.classId === 'barbaro' && classRecord(s).frenzy) { addClassNumber(s, 'fury', -FRENZY_DRAIN_PER_ACTION, 100); if (stateResource(s, 'fury') <= 0) classRecord(s).frenzy = false; }
  for (const key of ['immunityRounds','hasteRounds','painGuardRounds','lastGuardRounds','counterStanceRounds','juizoFinalRounds']) if (Number(classRecord(s)[key] ?? 0) > 0) classRecord(s)[key] = Number(classRecord(s)[key]) - 1;
  if (Number(classRecord(s).painGuardRounds ?? 0) <= 0) classRecord(s).painRedirectPct = 0;
  if (Number(classRecord(s).counterStanceRounds ?? 0) <= 0) classRecord(s).counterStanceActive = false;
  if (s.deathVeil > 0) s.deathVeil -= 1;
  if (s.aegis) { s.aegis.roundsLeft -= 1; if (s.aegis.roundsLeft <= 0) s.aegis = undefined; }
  if (s.enemy.isBoss && s.enemy.phases) while (s.bossPhaseIndex < s.enemy.phases.length && s.enemyHp / s.enemy.maxHp <= s.enemy.phases[s.bossPhaseIndex].hpPct) {
    const phase = s.enemy.phases[s.bossPhaseIndex++]; event(s, { type: 'bossPhase', tick: s.envTick, phase: phase.name });
    s.enemy.atk = Math.round(s.enemy.atk * (phase.atkMult ?? 1));
    if (phase.cc) s.playerCC.push({ kind: phase.cc, roundsLeft: phase.ccRounds ?? 1 });
  }
  if (s.enemyHp <= 0) finishEnemy(s);
  if (s.playerHp <= 0 && !s.dead) { s.dead = true; event(s, { type: 'playerDeath', tick: s.envTick }); }
  return s;
}
export function runCombat(s: CombatState, maxActions = 300): CombatRunResult { let pd = 0; let ed = 0; const casts: string[] = []; while (!s.dead && !s.won && s.actions < maxActions) { const beforeEvents = s.events.length; const before = s.enemyHp; const existingFlightIds = s.archerState.arrows.map((arrow) => arrow.id); advanceArcherFlights(s, existingFlightIds); if (s.won) break; resolvePlayerAction(s); const playerCast = s.events.slice(beforeEvents).find((item) => item.type === 'abilityCast' && item.actor === 'player' && item.abilityId); if (s.classState.classId === 'arqueiro' && playerCast?.abilityId) { const ab = abilities(s).find((item) => item.id === playerCast.abilityId); const x = ab ? traceAbilityEffect(ab.effect, new Set(), (field) => event(s, { type: 'effectApplied', tick: s.envTick, actor: 'player', abilityId: playerCast.abilityId, field })) as Record<string, any> : undefined; if (x?.archerImmediateTimerReduction) s.archerState = { ...s.archerState, arrows: s.archerState.arrows.map((arrow) => existingFlightIds.includes(arrow.id) ? { ...arrow, actionsRemaining: arrow.actionsRemaining - x.archerImmediateTimerReduction } : arrow) }; if (x?.archerAccelerateOldest) s.archerState = accelerateOldestArrow(s.archerState); if (x?.archerAlignFlights) s.archerState = alignInFlightArrows(s.archerState); if (x?.archerConsumesReflex) s.archerState = consumeArcherReflex(s.archerState); } pd += before - s.enemyHp; const beforePlayer = s.playerHp; if (!s.won) resolveEnemyAction(s); ed += beforePlayer - s.playerHp; if (s.classState.classId === 'arqueiro') { s.archerState = { ...s.archerState, actionCount: s.archerState.actionCount + 1, preciseActionsSinceReposition: s.archerState.preciseActionsSinceReposition + 1 }; s.archerState = advanceArcherReflex(s.archerState); } resolveEnvironmentTick(s); for (const cast of s.events.slice(beforeEvents)) if (cast.type === 'abilityCast' && cast.abilityId) casts.push(cast.abilityId); } return { state: s, won: s.won, actions: s.actions, playerDamage: pd, enemyDamage: ed, casts: casts.length, abilityCasts: casts }; }
export function proveAbilityReachability(character: Character, enemy: EnemyInstance, abilityId: string, seed = 1, maxActions = 240, supportingAbilityIds: string[] = []): { abilityId: string; castCount: number; firstCastTick?: number; events: CombatEvent[]; effectFields: string[]; unappliedEffectFields: string[]; pass: boolean } {
  const ids = [...new Set([abilityId, ...supportingAbilityIds])].slice(0, 5); const ability = getEquippedAbilities(character.classId, character.unlockedSkills, [abilityId])[0]; if (!ability) return { abilityId, castCount: 0, events: [], effectFields: [], unappliedEffectFields: [], pass: false };
  // The first encounter is supplied by the caller and is always a real
  // catalog encounter.  It must be allowed to establish the condition before
  // the proof moves through additional real encounters; sorting all enemies
  // by attack made low-HP, posture and accumulation conditions impossible on
  // a weak first fight, while carrying a state across the real progression
  // remains the rule after that first fight.
  const encounters = [enemy, ...DUNGEONS.flatMap((dungeon) => [spawnEnemy(dungeon.startDepth, dungeon), spawnEnemy(dungeon.bossDepth, dungeon)])]
    .filter((candidate, index, list) => list.findIndex((item) => item.name === candidate.name && item.maxHp === candidate.maxHp) === index);
  let encounterIndex = 0; const firstPriorities = naturalAbilityPriorities(ability, supportingAbilityIds, character); let state = createCombatState(character, { ...encounters[encounterIndex] }, seed, ids, firstPriorities); const events: CombatEvent[] = []; let actions = 0;
  const latePriorities = firstPriorities;
  while (actions < maxActions && !state.dead) {
    if (encounterIndex === 0 && actions >= 24) state.priorities = latePriorities;
    const actionBudget = encounterIndex === 0 && actions < 24 ? Math.min(24 - actions, maxActions - actions) : maxActions - actions;
    const beforeActions = state.actions; const beforeEvents = state.events.length; const result = runCombat(state, beforeActions + actionBudget); actions += result.state.actions - beforeActions; events.push(...result.state.events.slice(beforeEvents));
    if (!result.won && result.state.dead) break;
    if (!result.won) continue;
    if (actions >= maxActions) break;
    encounterIndex += 1; if (encounterIndex >= encounters.length) break;
    const hp = result.state.playerHp; const nextPriorities = firstPriorities; const next = createCombatState({ ...character, hp }, { ...encounters[encounterIndex] }, seed + actions + 1, ids, nextPriorities);
    carryEncounterState(next, result.state, hp);
    state = next;
  }
  const casts = events.filter((e) => e.type === 'abilityCast' && e.abilityId === abilityId);
  const effectFields = [...new Set([ability.effect, ...(ability.extraEffects ?? [])].flatMap(abilityEffectFields))];
  const observed = new Set(events.filter((item) => item.type === 'effectApplied' && item.abilityId === abilityId && item.field).map((item) => item.field!));
  const unappliedEffectFields = effectFields.filter((field) => !observed.has(field));
  return { abilityId, castCount: casts.length, firstCastTick: casts[0]?.tick, events, effectFields, unappliedEffectFields, pass: casts.length > 0 && unappliedEffectFields.length === 0 };
}
export function realDungeonRun(character: Character, dungeon: DungeonDef, seed = 1): CombatRunResult { return runCombat(createCombatState(character, spawnEnemy(dungeon.bossDepth, dungeon), seed)); }
function carryEncounterState(next: CombatState, previous: CombatState, hp: number): void {
  const previousRaw = classRecord(previous);
  const nextRaw = classRecord(next);
  const set = (key: string, value: number) => { next.classState.resources[key] = value; if (key in nextRaw) nextRaw[key] = value; };
  switch (next.classState.classId) {
    case 'clerigo': set('faith', nextFaithForNewEnemy(stateResource(previous, 'faith'))); break;
    case 'mago': set('heat', Math.min(40, stateResource(previous, 'heat'))); break;
    case 'cavaleiro': {
      set('determination', 0);
      set('momentum', next.character.unlockedSkills.includes('cavaleiro:investida:8') ? Math.min(20, stateResource(previous, 'momentum')) : 0);
      set('orders', next.character.unlockedSkills.includes('cavaleiro:comando:6') && stateResource(previous, 'orders') >= 1 ? 1 : 0);
      break;
    }
    case 'barbaro': set('fury', 0); nextRaw.pain = Number(previousRaw.pain ?? 0); nextRaw.wounds = 0; nextRaw.frenzy = false; break;
    case 'feiticeiro': set('pulse', stateResource(previous, 'pulse')); set('resonance', stateResource(previous, 'resonance')); set('control', stateResource(previous, 'control')); break;
    case 'bruxo': set('debt', stateResource(previous, 'debt')); set('credit', stateResource(previous, 'credit')); set('scars', stateResource(previous, 'scars')); break;
    case 'necromante': {
      const carryThree = next.character.unlockedSkills.includes('necromante:decomposicao:14');
      set('souls', soulsForNextEnemy(stateResource(previous, 'souls'), carryThree));
      nextRaw.servantAttacks = carryThree && Array.isArray(previousRaw.servantAttacks) ? (previousRaw.servantAttacks as number[]).slice(0, 1) : [];
      nextRaw.servants = Array.isArray(nextRaw.servantAttacks) ? nextRaw.servantAttacks.length : 0;
      break;
    }
    case 'guerreiro': case 'ladino': case 'paladino': case 'arqueiro':
    case 'cacador': case 'druida': case 'bardo':
      break;
  }
  next.bardState = resetBardEnemy(previous.bardState);
  next.warlockPlayer = { ...previous.warlockPlayer };
  next.archerState = createArcherCombatState();
  next.soulThresholds = new Set();
  next.character = { ...next.character, potions: previous.character.potions };
  next.playerHp = Math.min(Math.max(1, recoverAfterEncounter(next.character, hp)), effectiveMaxHp(next.character));
}
export function runFullDungeon(character: Character, dungeon: DungeonDef, seed = 1, priorities = character.equippedAbilities): FullDungeonRunResult { let s = createCombatState(character, spawnEnemy(dungeon.startDepth, dungeon), seed, character.equippedAbilities, priorities); const checkpoints: FullDungeonRunResult['checkpoints'] = []; const events: CombatEvent[] = []; let actions = 0; for (let depth = dungeon.startDepth; depth <= dungeon.bossDepth && !s.dead; depth += 1) { if (depth !== dungeon.startDepth) { const hp = s.playerHp; const previous = s; s = createCombatState({ ...character, hp }, spawnEnemy(depth, dungeon), seed + depth, previous.equippedAbilityIds, previous.priorities); carryEncounterState(s, previous, hp); } const r = runCombat(s); s = r.state; actions += r.actions; events.push(...s.events); checkpoints.push({ depth, won: r.won, playerHp: s.playerHp }); if (!r.won) break; s.won = false; } return { dungeonId: dungeon.id, won: checkpoints.length === dungeon.bossDepth - dungeon.startDepth + 1 && checkpoints[checkpoints.length - 1]?.won === true, fights: checkpoints.length, actions, checkpoints, events, state: s }; }
export { ABILITY_EFFECT_KINDS } from './abilityResolver.ts';
export function assertAllAbilityKindsResolved(): true {
  const effects: AbilityEffect[] = [];
  for (const paths of Object.values(SKILL_TREES)) for (const path of paths) for (const node of path.nodes) {
    if (node.ability) effects.push(node.ability.effect, ...(node.ability.extraEffects ?? []));
  }
  assertAbilityEffectContract(effects);
  return true;
}
