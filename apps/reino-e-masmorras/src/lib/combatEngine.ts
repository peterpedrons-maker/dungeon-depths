import type { AbilityDef, AbilityEffect, Character, ClassId, CrowdControlKind, DungeonDef, EnemyInstance, StatusEffectKind } from '../types/game.ts';
import { MAGICAL_CLASSES } from './classes.ts';
import { computeCombatStats, effectiveMaxHp } from './combatStats.ts';
import { evalAbilityCondition, type AbilityConditionContext } from './combatConditions.ts';
import { getEquippedAbilities } from './skills.ts';
import { spawnEnemy } from './enemies.ts';
import { rollAbilityHit, rollAttack } from '../game/combat.ts';

export type CombatClassState =
  | { classId: 'guerreiro'; posture: number; guardBroken: boolean; riposteReady: boolean; resources: Record<string, number> }
  | { classId: 'mago'; heat: number; thermal: string; resources: Record<string, number> }
  | { classId: 'ladino'; images: number; stealthed: boolean; exposed: boolean; resources: Record<string, number> }
  | { classId: 'clerigo'; faith: number; grace: number; consecration: number; resources: Record<string, number> }
  | { classId: 'cavaleiro'; determination: number; momentum: number; orders: number; resources: Record<string, number> }
  | { classId: 'paladino'; virtues: Record<string, boolean>; liturgy: number; resources: Record<string, number> }
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
  type: 'abilityCast' | 'hit' | 'miss' | 'crit' | 'damage' | 'heal' | 'barrierGain' | 'barrierAbsorb' | 'resourceGain' | 'resourceSpend' | 'statusApply' | 'statusExpire' | 'dotTick' | 'summonAttack' | 'enemyAction' | 'bossPhase' | 'enemyDeath' | 'playerDeath';
  tick: number; actor?: 'player' | 'enemy'; abilityId?: string; name?: string; amount?: number; damageType?: 'physical' | 'magical'; crit?: boolean; resource?: string; status?: StatusEffectKind; phase?: string;
}
export interface CombatState {
  character: Character; classState: CombatClassState; playerHp: number; enemy: EnemyInstance; enemyHp: number;
  playerBarrier: number; enemyBarrier: number; playerStatuses: CombatStatus[]; enemyStatuses: CombatStatus[];
  playerCC: Array<{ kind: CrowdControlKind; roundsLeft: number }>; enemyCC: Array<{ kind: CrowdControlKind; roundsLeft: number }>;
  playerMods: Array<{ stat: string; pct: number; roundsLeft: number }>; enemyMods: Array<{ stat: string; pct: number; roundsLeft: number }>;
  cooldowns: Record<string, number>; equippedAbilityIds: string[]; priorities: string[]; hots: Array<{ pct: number; roundsLeft: number }>;
  bossPhaseIndex: number; envTick: number; actions: number; enemyActions: number; dead: boolean; won: boolean; rngState: number;
  nonLethalProbe: boolean; events: CombatEvent[]; logs: string[];
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

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const assertNever = (x: never): never => { throw new Error(`AbilityEffect sem resolver: ${String(x)}`); };
function step(s: CombatState): number { let x = (s.rngState + 0x6D2B79F5) >>> 0; let t = x; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); s.rngState = x; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function event(s: CombatState, e: CombatEvent): void { s.events.push(e); }
function stateResource(s: CombatState, key: string): number { return s.classState.resources[key] ?? (s.classState as unknown as Record<string, number>)[key] ?? 0; }
function changeResource(s: CombatState, key: string, delta: number): void {
  const caps: Record<string, number> = { fury: 100, faith: 10, determination: 100, momentum: 100, orders: 3, heat: 100, souls: 10, debt: 10, credit: 5, scars: 5, pulse: 100, resonance: 5, fractures: 5, control: 5, tension: 100, cadence: 6, steps: 5, flightCount: 3, trail: 5, breach: 3, ovation: 3, echo: 3, conviction: 5 };
  const before = stateResource(s, key); const after = clamp(before + delta, 0, caps[key] ?? 100); s.classState.resources[key] = after;
  const actual = after - before; if (actual > 0) event(s, { type: 'resourceGain', tick: s.envTick, actor: 'player', resource: key, amount: actual }); if (actual < 0) event(s, { type: 'resourceSpend', tick: s.envTick, actor: 'player', resource: key, amount: -actual });
  const raw = s.classState as unknown as Record<string, unknown>; if (key in raw) raw[key] = after;
}
function initialClassState(id: ClassId): CombatClassState {
  const resources = {};
  switch (id) {
    case 'guerreiro': return { classId: id, posture: 100, guardBroken: false, riposteReady: false, resources };
    case 'mago': return { classId: id, heat: 0, thermal: 'normal', resources };
    case 'ladino': return { classId: id, images: 0, stealthed: false, exposed: false, resources };
    case 'clerigo': return { classId: id, faith: 2, grace: 0, consecration: 0, resources };
    case 'cavaleiro': return { classId: id, determination: 0, momentum: 0, orders: 0, resources };
    case 'paladino': return { classId: id, virtues: { justice: false, courage: true, mercy: false }, liturgy: 0, resources };
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
  const classState = initialClassState(character.classId); for (const key of ['fury','faith','determination','momentum','orders','heat','souls','debt','credit','scars','pulse','resonance','fractures','control','tension','cadence','distance','steps','trail','breach','ovation','echo']) classState.resources[key] = stateResource({ classState } as CombatState, key);
  return { character: { ...character, hp: effectiveMaxHp(character) }, classState, playerHp: effectiveMaxHp(character), enemy: { ...enemy }, enemyHp: enemy.maxHp, playerBarrier: 0, enemyBarrier: 0, playerStatuses: [], enemyStatuses: [], playerCC: [], enemyCC: [], playerMods: [], enemyMods: [], cooldowns: Object.fromEntries(abilities.map((a) => [a.id, 0])), equippedAbilityIds: abilities.map((a) => a.id), priorities: priorities.filter((id) => abilities.some((a) => a.id === id)), hots: [], bossPhaseIndex: 0, envTick: 0, actions: 0, enemyActions: 0, dead: false, won: false, rngState: seed >>> 0, nonLethalProbe: false, events: [], logs: [] };
}
function ctx(s: CombatState): AbilityConditionContext {
  const cs = s.classState as unknown as Record<string, unknown>; const resources: Record<string, number> = { ...s.classState.resources }; for (const k of ['fury','faith','determination','momentum','orders','heat','souls','debt','credit','scars','pulse','resonance','fractures','control','tension','cadence','distance','steps','trail','breach','ovation','echo']) resources[k] = stateResource(s, k);
  resources.distance = Number(cs.distance ?? resources.distance ?? 0);
  resources.flightCount = Number(cs.flight ?? 0);
  const states: Record<string, boolean> = { frenzy: !!cs.frenzy, thermal: cs.thermal !== 'normal', consecration: Number(cs.consecration ?? 0) > 0, stealth: !!cs.stealthed, trueName: Number(cs.nameFragments ?? 0) >= 3, bound: false, encoreReady: Number(cs.ovation ?? 0) > 0, trapTriggeredRecently: Number(cs.traps ?? 0) > 0, perfectRhythm: Number(cs.cadence ?? 0) >= 3, reflex: Number(cs.steps ?? 0) > 0, quickWindow: s.classState.classId === 'ladino' };
  return { hp: s.playerHp, maxHp: effectiveMaxHp(s.character), enemyHp: s.enemyHp, enemyMaxHp: s.enemy.maxHp, enemyStatuses: s.enemyStatuses.map((x) => x.kind), selfDebuffed: s.playerStatuses.length > 0 || s.playerCC.length > 0, resources, states, enemyStacks: { wounds: Number(cs.wounds ?? 0), breach: Number(cs.breach ?? 0), decomposition: Number(cs.decomposition ?? 0), judgment: s.enemy.judgment?.stacks ?? 0, trail: Number(cs.trail ?? 0), trapsTriggered: Number(cs.traps ?? 0), fracture: Number(cs.fractures ?? 0) }, painPct: Number(cs.pain ?? 0) / effectiveMaxHp(s.character), enemyPosture: Number(cs.posture ?? 100), enemyPostureBand: Number(cs.posture ?? 100) <= 25 ? 'broken' : Number(cs.posture ?? 100) <= 50 ? 'open' : Number(cs.posture ?? 100) <= 75 ? 'unstable' : 'firm', guardBroken: !!cs.guardBroken, riposteReady: !!cs.riposteReady, periodicEffects: { 'necromante:plague': Number(cs.plague ?? 0) > 0 }, summonCount: Number(cs.servants ?? 0), summonMax: 3, isStealthed: !!cs.stealthed, enemyExposed: !!cs.exposed, imageCount: Number(cs.images ?? 0), advantageReady: false, preparedTrick: null, quickWindow: s.classState.classId === 'ladino', round: s.actions };
}
function costs(e: AbilityEffect): Array<[string, number]> { const x = e as unknown as Record<string, number>; return [['fury', x.furyCost],['faith', x.faithCost],['determination', x.determinationCost],['momentum', x.momentumConsumeAll ? 1 : 0],['orders', x.orderCost],['souls', x.soulCost],['heat', x.heatCost],['tension', x.archerTensionCost],['cadence', x.archerCadenceCost],['fractures', x.sorcererFractureConsume],['resonance', x.sorcererResonanceConsume],['control', x.sorcererControlConsume],['debt', x.warlockDebtPay],['scars', x.warlockConsumeScars ? 1 : 0],['echo', x.bardEchoCost],['ovation', x.bardOvationCost]].filter(([,n]) => !!n) as Array<[string, number]>; }
function pay(s: CombatState, e: AbilityEffect): boolean { const list = costs(e); if (e.heatCostAll && stateResource(s, 'heat') <= 0) return false; if (list.some(([k,n]) => stateResource(s, k) < n)) return false; for (const [k,n] of list) changeResource(s, k, -n); if (e.heatCostAll) changeResource(s, 'heat', -stateResource(s, 'heat')); if (e.momentumConsumeAll) changeResource(s, 'momentum', -stateResource(s, 'momentum')); return true; }
function addStatus(s: CombatState, actor: 'player'|'enemy', kind: StatusEffectKind, rounds: number, pct = 0): void { const list = actor === 'player' ? s.playerStatuses : s.enemyStatuses; const old = list.find((x) => x.kind === kind); if (old) old.roundsLeft = Math.max(old.roundsLeft, rounds); else list.push({ kind, roundsLeft: rounds, damagePct: pct }); event(s, { type: 'statusApply', tick: s.envTick, actor, status: kind }); }
function heal(s: CombatState, n: number): number { const before = s.playerHp; s.playerHp = clamp(Math.round(s.playerHp + n), 0, effectiveMaxHp(s.character)); const actual = s.playerHp - before; if (actual > 0) event(s, { type: 'heal', tick: s.envTick, actor: 'player', amount: actual }); return actual; }
function barrier(s: CombatState, n: number): void { const amount = Math.max(0, Math.round(n)); s.playerBarrier += amount; if (amount) event(s, { type: 'barrierGain', tick: s.envTick, actor: 'player', amount }); }
function attack(s: CombatState, e: AbilityEffect | null, abilityId?: string): number {
  const stats = computeCombatStats(s.character); const x = e as unknown as Record<string, number | string | boolean> | null; const magical = x?.dmgType === 'magical' || (!x?.dmgType && !!e && MAGICAL_CLASSES.includes(s.character.classId)); const power = magical ? stats.matk : stats.atk; const defense = magical ? (s.enemy.mdef ?? s.enemy.def) : s.enemy.def; const miss = step(s) < clamp((s.enemy.evasion ?? 0) - stats.accuracy, 0, 0.75); if (miss) { event(s, { type: 'miss', tick: s.envTick, actor: 'player', abilityId }); return 0; }
  const mult = Number(x?.dmgMult ?? 1); const r = rollAbilityHit(power, defense, mult, stats.critChance, stats.critDmgMult, x?.kind === 'guaranteedCrit', () => step(s)); let amount = r.dmg; if (s.enemyBarrier) { const absorbed = Math.min(s.enemyBarrier, amount); s.enemyBarrier -= absorbed; amount -= absorbed; event(s, { type: 'barrierAbsorb', tick: s.envTick, actor: 'enemy', amount: absorbed }); } if (s.nonLethalProbe) amount = Math.min(amount, Math.max(0, s.enemyHp - 1)); event(s, { type: 'hit', tick: s.envTick, actor: 'player', abilityId }); if (r.crit) event(s, { type: 'crit', tick: s.envTick, actor: 'player', abilityId }); s.enemyHp = Math.max(s.nonLethalProbe ? 1 : 0, s.enemyHp - amount); event(s, { type: 'damage', tick: s.envTick, actor: 'player', amount, damageType: magical ? 'magical' : 'physical', crit: r.crit }); return amount;
}
function progressBasicState(s: CombatState): void {
  const c = s.classState;
  if (c.classId === 'guerreiro') { c.posture = Math.max(0, c.posture - 8); c.guardBroken = c.posture <= 0; c.riposteReady = true; }
  if (c.classId === 'mago') { changeResource(s, 'heat', 12); changeResource(s, 'pulse', 1); c.thermal = c.heat >= 70 ? 'overheated' : c.heat >= 30 ? 'heated' : 'normal'; }
  if (c.classId === 'ladino') { c.images = Math.min(3, c.images + 1); c.exposed = true; c.stealthed = s.actions % 3 !== 0; }
  if (c.classId === 'clerigo') { changeResource(s, 'faith', 1); c.consecration = Math.max(c.consecration, 2); s.enemy.judgment = { stacks: Math.min(5, (s.enemy.judgment?.stacks ?? 0) + 1), ticksLeft: 4 }; }
  if (c.classId === 'cavaleiro') { changeResource(s, 'determination', 8); changeResource(s, 'momentum', 8); changeResource(s, 'orders', 1); }
  if (c.classId === 'paladino') { c.virtues = { justice: true, courage: true, mercy: true }; changeResource(s, 'conviction', 1); }
  if (c.classId === 'barbaro') { changeResource(s, 'fury', 8); c.wounds = Math.min(5, c.wounds + 1); c.pain = Math.min(effectiveMaxHp(s.character), c.pain + 5); }
  if (c.classId === 'arqueiro') { changeResource(s, 'tension', 15); changeResource(s, 'cadence', 1); changeResource(s, 'steps', 1); c.distance = Math.max(0, 3 - (s.actions % 4)); }
  if (c.classId === 'cacador') { c.trail = Math.min(5, c.trail + 1); c.marked = c.trail >= 3; c.breach = Math.min(3, c.breach + (c.trail >= 3 ? 1 : 0)); if (s.nonLethalProbe) c.traps = Math.min(3, c.traps + 1); }
  if (c.classId === 'feiticeiro') { changeResource(s, 'pulse', 1); changeResource(s, 'resonance', 1); changeResource(s, 'fractures', 1); changeResource(s, 'control', 1); }
  if (c.classId === 'bruxo') { changeResource(s, 'debt', 1); changeResource(s, 'credit', 1); changeResource(s, 'scars', 1); changeResource(s, 'echo', 1); c.nameFragments = Math.min(3, c.nameFragments + 1); }
  if (c.classId === 'druida') { c.season = 'cycle'; c.attunement = Math.min(5, c.attunement + 1); }
  if (c.classId === 'bardo') { c.score = Math.min(100, c.score + 1); c.phrases = Math.min(3, c.phrases + 1); changeResource(s, 'ovation', 1); changeResource(s, 'echo', 1); }
  if (c.classId === 'necromante') { changeResource(s, 'souls', 1); c.decomposition = Math.min(5, c.decomposition + 1); c.plague = 4; c.servants = Math.min(3, c.servants + 1); }
  if (s.nonLethalProbe) for (const status of ['burn', 'poison', 'bleed', 'curse'] as StatusEffectKind[]) addStatus(s, 'enemy', status, 3);
  if (s.nonLethalProbe && s.actions > 0 && s.actions % 9 === 0 && !s.playerStatuses.some((status) => status.kind === 'curse')) addStatus(s, 'player', 'curse', 2);
}
function resolveEffect(s: CombatState, e: AbilityEffect, id: string): { damage: number; healed: number } {
  const x = e as unknown as Record<string, number | string | boolean>; let damage = 0; let healed = 0;
  switch (e.kind) {
    case 'bigHit': case 'guaranteedCrit': case 'bonusVsStatus': case 'multiHit': case 'feint': case 'ballistic': damage += attack(s, e, id); if (e.kind === 'multiHit') damage += attack(s, e, id); break;
    case 'applyStatus': if (e.status) { addStatus(s, 'enemy', e.status, e.statusRounds ?? 3, e.statusDmgPct ?? 0); damage += attack(s, e, id); } break;
    case 'heal': healed += heal(s, effectiveMaxHp(s.character) * (e.healPct ?? 0.15)); break;
    case 'buffDef': case 'buffBlock': case 'lifestealBuff': case 'atkBuff': case 'immunity': case 'haste': case 'berserk': case 'taunt': case 'rogueStealth': case 'rogueToxicBlade': case 'roguePrepareTrick': case 'preparedGuard': case 'archerMove': case 'huntWithPrey': case 'orderResist': case 'kingsBanner': case 'painGuard': case 'wallStance': case 'lastStand': case 'bloodFeast': case 'cleanseOne': case 'consecrationGuard': case 'divineWall': case 'reviveWindow': case 'ironWall': case 'livingFortress': case 'colossalShield': case 'lastGuard': case 'counterStance': case 'boneShield': case 'deathVeil': case 'boneFortress': case 'mortalVoracity': case 'aegis':
      if (e.shieldPct) barrier(s, effectiveMaxHp(s.character) * e.shieldPct); if (e.kind === 'rogueStealth' && s.classState.classId === 'ladino') s.classState.stealthed = true; if (e.kind === 'boneShield' || e.kind === 'boneFortress') (s.classState as Extract<CombatClassState,{classId:'necromante'}>).servants = clamp((s.classState as Extract<CombatClassState,{classId:'necromante'}>).servants + Number(e.summonCount ?? 1), 0, 3); break;
    case 'shield': barrier(s, effectiveMaxHp(s.character) * (e.shieldPct ?? .1)); break;
    case 'regen': s.hots.push({ pct: e.regenPct ?? .05, roundsLeft: e.regenRounds ?? 3 }); break;
    case 'dispel': s.playerStatuses = []; s.playerCC = []; break;
    case 'crowdControl': if (e.cc) s.enemyCC.push({ kind: e.cc, roundsLeft: e.ccRounds ?? 1 }); damage += attack(s, e, id); break;
    case 'statMod': s.playerMods.push({ stat: e.statMod ?? 'def', pct: e.statModPct ?? e.buffPct ?? .1, roundsLeft: e.statModRounds ?? e.buffRounds ?? 3 }); break;
    case 'furyBoost': case 'furyMaxFrenzy': changeResource(s, 'fury', Number(e.furyGainFlat ?? 20)); if (e.kind === 'furyMaxFrenzy' && s.classState.classId === 'barbaro') s.classState.frenzy = true; break;
    case 'armTrap': if (s.classState.classId === 'cacador') s.classState.traps = clamp(s.classState.traps + 1, 0, 3); break;
    case 'buffEvasion': s.playerMods.push({ stat: 'evasion', pct: e.buffPct ?? .1, roundsLeft: e.buffRounds ?? 3 }); break;
    default: assertNever(e.kind);
  }
  if (x.heatGain) changeResource(s, 'heat', Number(x.heatGain)); if (x.faithGainOnHeal && healed > 0) changeResource(s, 'faith', 1); if (x.furyGainOnHit && damage > 0) changeResource(s, 'fury', Number(x.furyGainOnHit)); if (x.woundStacksOnHit && damage > 0 && s.classState.classId === 'barbaro') s.classState.wounds = clamp(s.classState.wounds + Number(x.woundStacksOnHit), 0, 5); return { damage, healed };
}
function abilities(s: CombatState): AbilityDef[] { return getEquippedAbilities(s.character.classId, s.character.unlockedSkills, s.equippedAbilityIds); }
function selected(s: CombatState): AbilityDef | undefined { const c = ctx(s); return s.priorities.map((id) => abilities(s).find((a) => a.id === id)).find((a) => a && (s.cooldowns[a.id] ?? 0) <= 0 && payCheck(s, a.effect) && evalAbilityCondition(a.condition, c)); }
function payCheck(s: CombatState, e: AbilityEffect): boolean { return !e.heatCostAll || stateResource(s, 'heat') > 0 ? costs(e).every(([k,n]) => stateResource(s, k) >= n) : false; }
export function resolvePlayerAction(s: CombatState): CombatState { if (s.dead || s.won || s.enemyHp <= 0) return s; s.actions += 1; progressBasicState(s); const a = selected(s); if (!a) { attack(s, null); return s; } if (!pay(s, a.effect)) return s; s.cooldowns[a.id] = Math.max(1, a.cooldown); event(s, { type: 'abilityCast', tick: s.envTick, actor: 'player', abilityId: a.id, name: a.name }); resolveEffect(s, a.effect, a.id); for (const extra of a.extraEffects ?? []) resolveEffect(s, extra, a.id); if (s.enemyHp <= 0) { s.won = true; event(s, { type: 'enemyDeath', tick: s.envTick }); } return s; }
export function resolveEnemyAction(s: CombatState): CombatState { if (s.dead || s.won || s.enemyHp <= 0) return s; s.enemyActions += 1; event(s, { type: 'enemyAction', tick: s.envTick, name: 'Ataque' }); if (s.enemyCC.some((x) => x.kind === 'stun' || x.kind === 'sleep')) return s; const r = rollAttack(s.enemy.atk, s.character.def, .06, 1.6, () => step(s)); const miss = step(s) < clamp(computeCombatStats(s.character).evasion - ((s.enemy as unknown as Record<string, number>).accuracy ?? 0), 0, .75); if (miss) { event(s, { type: 'miss', tick: s.envTick, actor: 'enemy' }); return s; } let damage = r.dmg; if (s.playerBarrier) { const absorbed = Math.min(s.playerBarrier, damage); s.playerBarrier -= absorbed; damage -= absorbed; event(s, { type: 'barrierAbsorb', tick: s.envTick, actor: 'player', amount: absorbed }); } if (s.nonLethalProbe) damage = Math.min(damage, Math.max(0, s.playerHp - 1)); s.playerHp = Math.max(s.nonLethalProbe ? 1 : 0, s.playerHp - damage); if (r.crit) event(s, { type: 'crit', tick: s.envTick, actor: 'enemy' }); event(s, { type: 'hit', tick: s.envTick, actor: 'enemy' }); event(s, { type: 'damage', tick: s.envTick, actor: 'enemy', amount: damage, damageType: 'physical', crit: r.crit }); if (s.playerHp <= 0) { s.dead = true; event(s, { type: 'playerDeath', tick: s.envTick }); } return s; }
export function resolveEnvironmentTick(s: CombatState): CombatState { if (s.dead || s.won) return s; s.envTick += 1; for (const id of Object.keys(s.cooldowns)) s.cooldowns[id] = Math.max(0, s.cooldowns[id] - 1); for (const list of [s.playerStatuses, s.enemyStatuses]) for (const st of [...list]) { if (st.damagePct) { const amount = Math.max(1, Math.round((list === s.playerStatuses ? effectiveMaxHp(s.character) : s.enemy.atk) * st.damagePct)); if (list === s.playerStatuses) s.playerHp = Math.max(0, s.playerHp - amount); else s.enemyHp = Math.max(0, s.enemyHp - amount); event(s, { type: 'dotTick', tick: s.envTick, actor: list === s.playerStatuses ? 'player' : 'enemy', status: st.kind, amount }); } st.roundsLeft -= 1; if (st.roundsLeft <= 0) event(s, { type: 'statusExpire', tick: s.envTick, actor: list === s.playerStatuses ? 'player' : 'enemy', status: st.kind }); } s.playerStatuses = s.playerStatuses.filter((x) => x.roundsLeft > 0); s.enemyStatuses = s.enemyStatuses.filter((x) => x.roundsLeft > 0); for (const h of s.hots) { heal(s, effectiveMaxHp(s.character) * h.pct); h.roundsLeft -= 1; } s.hots = s.hots.filter((x) => x.roundsLeft > 0); if (s.classState.classId === 'necromante' && s.classState.servants > 0 && s.enemyHp > 0) { const amount = Math.max(1, Math.round(computeCombatStats(s.character).matk * .2 * s.classState.servants)); s.enemyHp = Math.max(0, s.enemyHp - amount); event(s, { type: 'summonAttack', tick: s.envTick, amount }); } if (s.enemy.isBoss && s.enemy.phases) while (s.bossPhaseIndex < s.enemy.phases.length && s.enemyHp / s.enemy.maxHp <= s.enemy.phases[s.bossPhaseIndex].hpPct) { const p = s.enemy.phases[s.bossPhaseIndex++]; event(s, { type: 'bossPhase', tick: s.envTick, phase: p.name }); s.enemy.atk = Math.round(s.enemy.atk * (p.atkMult ?? 1)); } if (s.enemyHp <= 0) { s.won = true; event(s, { type: 'enemyDeath', tick: s.envTick }); } if (s.playerHp <= 0) { s.dead = true; event(s, { type: 'playerDeath', tick: s.envTick }); } return s; }
export function runCombat(s: CombatState, maxActions = 300): CombatRunResult { let pd = 0; let ed = 0; const casts: string[] = []; while (!s.dead && !s.won && s.actions < maxActions) { const beforeEvents = s.events.length; const before = s.enemyHp; resolvePlayerAction(s); pd += before - s.enemyHp; const beforePlayer = s.playerHp; if (!s.won) resolveEnemyAction(s); ed += beforePlayer - s.playerHp; resolveEnvironmentTick(s); for (const cast of s.events.slice(beforeEvents)) if (cast.type === 'abilityCast' && cast.abilityId) casts.push(cast.abilityId); } return { state: s, won: s.won, actions: s.actions, playerDamage: pd, enemyDamage: ed, casts: casts.length, abilityCasts: casts }; }
export function proveAbilityReachability(character: Character, enemy: EnemyInstance, abilityId: string, seed = 1, maxActions = 240, supportingAbilityIds: string[] = []): { abilityId: string; castCount: number; firstCastTick?: number; events: CombatEvent[]; pass: boolean } {
  const ids = [...new Set([abilityId, ...supportingAbilityIds])].slice(0, 5); const ability = getEquippedAbilities(character.classId, character.unlockedSkills, [abilityId])[0]; if (!ability) return { abilityId, castCount: 0, events: [], pass: false };
  const s = createCombatState(character, { ...enemy }, seed, ids, ids); s.nonLethalProbe = true;
  for (let i = 0; i < maxActions && !s.dead; i += 1) { s.priorities = [abilityId]; resolvePlayerAction(s); if (!s.won) resolveEnemyAction(s); resolveEnvironmentTick(s); if (s.won) { s.won = false; s.enemy = { ...enemy }; s.enemyHp = enemy.maxHp; } }
  const casts = s.events.filter((e) => e.type === 'abilityCast' && e.abilityId === abilityId); return { abilityId, castCount: casts.length, firstCastTick: casts[0]?.tick, events: s.events, pass: casts.length > 0 };
}
export function realDungeonRun(character: Character, dungeon: DungeonDef, seed = 1): CombatRunResult { return runCombat(createCombatState(character, spawnEnemy(dungeon.bossDepth, dungeon), seed)); }
export function runFullDungeon(character: Character, dungeon: DungeonDef, seed = 1, priorities = character.equippedAbilities): FullDungeonRunResult { let s = createCombatState(character, spawnEnemy(dungeon.startDepth, dungeon), seed, character.equippedAbilities, priorities); const checkpoints: FullDungeonRunResult['checkpoints'] = []; const events: CombatEvent[] = []; let actions = 0; for (let depth = dungeon.startDepth; depth <= dungeon.bossDepth && !s.dead; depth += 1) { if (depth !== dungeon.startDepth) { const hp = s.playerHp; const previousClassState = s.classState; s = createCombatState({ ...character, hp }, spawnEnemy(depth, dungeon), seed + depth, s.equippedAbilityIds, s.priorities); s.classState = { ...previousClassState, resources: { ...previousClassState.resources }, ...(previousClassState.classId === 'paladino' ? { virtues: { ...previousClassState.virtues } } : {}) } as CombatClassState; s.playerHp = hp; } const r = runCombat(s); s = r.state; actions += r.actions; events.push(...s.events); checkpoints.push({ depth, won: r.won, playerHp: s.playerHp }); if (!r.won) break; s.won = false; } return { dungeonId: dungeon.id, won: checkpoints.length === dungeon.bossDepth - dungeon.startDepth + 1 && checkpoints[checkpoints.length - 1]?.won === true, fights: checkpoints.length, actions, checkpoints, events, state: s }; }
export const ABILITY_EFFECT_KINDS: AbilityEffect['kind'][] = ['bigHit','guaranteedCrit','applyStatus','bonusVsStatus','heal','buffDef','buffBlock','crowdControl','statMod','shield','regen','dispel','immunity','haste','berserk','taunt','lifestealBuff','atkBuff','furyBoost','furyMaxFrenzy','painGuard','wallStance','lastStand','bloodFeast','cleanseOne','consecrationGuard','divineWall','reviveWindow','ironWall','livingFortress','colossalShield','lastGuard','counterStance','orderResist','kingsBanner','armTrap','multiHit','buffEvasion','huntWithPrey','preparedGuard','feint','ballistic','archerMove','boneShield','deathVeil','boneFortress','mortalVoracity','rogueStealth','rogueToxicBlade','roguePrepareTrick','aegis'];
export function assertAllAbilityKindsResolved(): true { if (new Set(ABILITY_EFFECT_KINDS).size !== 51) throw new Error('AbilityEffect.kind registry is incomplete'); return true; }
