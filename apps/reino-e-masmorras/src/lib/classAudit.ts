import type { AbilityCondition, AbilityDef, AbilityEffect, ClassId, SkillNode, SkillNodeType } from '../types/game.ts';
import { CLASSES } from './classes.ts';
import { getClassMechanics, getMechanicById } from './classMechanics.ts';
import { canUnlockNode, getUnlockedAbilities, SKILL_TREES } from './skills.ts';
import { evalAbilityCondition, type AbilityConditionContext } from './combatConditions.ts';

export const EXPECTED_PATH_COUNT = 3;
export const EXPECTED_NODES_PER_PATH = 15;
export const EXPECTED_TOPOLOGY: SkillNodeType[] = [
  'attribute', 'attribute', 'attribute', 'attribute', 'active',
  'attribute', 'passive', 'attribute', 'passive', 'active',
  'active', 'attribute', 'active', 'active', 'passive',
];

// These nodes are intentionally effect-light because their behavior is read
// by a class-specific runtime state machine rather than computeSkillBonuses.
// Keeping the list explicit makes an empty effect auditable instead of silently
// accepting every empty passive/attribute node.
export const DYNAMIC_HOOK_NODE_IDS = new Set([
  'mago:gelido:3', 'mago:gelido:6', 'mago:gelido:7', 'mago:gelido:8',
  'mago:eletromante:1', 'mago:eletromante:3', 'mago:eletromante:5', 'mago:eletromante:6', 'mago:eletromante:8',
  'ladino:veneno:11', 'ladino:sombras:0', 'ladino:sombras:1', 'ladino:sombras:3', 'ladino:laminas:5',
  'clerigo:devocao:1', 'cavaleiro:bastiao:8', 'cavaleiro:comando:3',
  'druida:cura-natural:8', 'druida:cura-natural:14', 'druida:furia-natureza:6', 'druida:furia-natureza:8',
  'druida:furia-natureza:14', 'druida:equilibrio:6', 'druida:equilibrio:8', 'druida:equilibrio:14',
]);

export interface ClassAuditIssue { code: string; id?: string; detail: string; }
export interface ClassAuditReport {
  classes: number; paths: number; nodes: number; actives: number; passives: number; attributes: number;
  issues: ClassAuditIssue[]; dynamicHookNodes: string[];
  byClass: Record<string, { paths: number; nodes: number; actives: number; passives: number; attributes: number }>;
}

export interface BuildAudit { classId: ClassId; label: string; pathIds: string[]; unlocked: string[]; activeIds: string[]; legal: boolean; }

export type PriorityVariant = 'generator-first' | 'spender-first' | 'short-cooldown-first' | 'capstone-first' | 'defensive-first';
export interface ActiveAuditRow {
  classId: ClassId;
  className: string;
  pathId: string;
  skillId: string;
  skillName: string;
  cooldown: number;
  cooldownTooltipCoherent: boolean;
  condition: AbilityCondition;
  conditionReachable: boolean;
  castCount: number;
  firstCast: string;
  resourceRequirements: string[];
  priorityVariants: Record<PriorityVariant, string[]>;
  reachable: 'PASS' | 'FAIL';
  notes: string[];
}

export interface ResourceLifecycleAudit {
  classId: ClassId;
  mechanicId: string;
  name: string;
  category: string;
  maxValue?: number;
  hasDescription: boolean;
  hasResetOrCarryRule: boolean;
  referencedByNodes: number;
}

export function unlockLegalBuild(classId: ClassId, pathIds: string[], skillPoints = pathIds.length === 1 ? 15 : 30): BuildAudit {
  const paths = SKILL_TREES[classId].filter((p) => pathIds.includes(p.id));
  const unlocked: string[] = [];
  while (unlocked.length < Math.min(skillPoints, paths.reduce((n, p) => n + p.nodes.length, 0))) {
    const next = paths.flatMap((p) => p.nodes).find((node) => canUnlockNode(node, unlocked));
    if (!next) break;
    unlocked.push(next.id);
  }
  const activeIds = getUnlockedAbilities(classId, unlocked).map((a) => a.id);
  const expected = pathIds.length === 1 ? paths.flatMap((p) => p.nodes.filter((n) => n.type === 'active').map((n) => n.id)) : [];
  return { classId, label: `${classId}:${pathIds.join('+')}`, pathIds, unlocked, activeIds,
    legal: unlocked.length === Math.min(skillPoints, paths.reduce((n, p) => n + p.nodes.length, 0)) && expected.every((id) => activeIds.includes(id)) };
}

function unlockPreferredNodes(classId: ClassId, pathIds: string[], preferredIds: string[], skillPoints: number): { unlocked: string[]; legal: boolean } {
  const paths = SKILL_TREES[classId].filter((p) => pathIds.includes(p.id));
  const nodes = paths.flatMap((p) => p.nodes);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const unlocked: string[] = [];
  for (const id of preferredIds) {
    const node = byId.get(id);
    if (node && canUnlockNode(node, unlocked) && unlocked.length < skillPoints) unlocked.push(id);
  }
  // Fill any gaps through the real prerequisite checker, never by slicing an
  // array and calling that legal. This catches a broken OR-prerequisite graph.
  while (unlocked.length < Math.min(skillPoints, nodes.length)) {
    const next = nodes.find((node) => !unlocked.includes(node.id) && canUnlockNode(node, unlocked));
    if (!next) break;
    unlocked.push(next.id);
  }
  return { unlocked, legal: unlocked.length === Math.min(skillPoints, nodes.length) };
}

export function buildAuditMatrix(): BuildAudit[] {
  const builds: BuildAudit[] = [];
  for (const classId of Object.keys(CLASSES) as ClassId[]) {
    const paths = SKILL_TREES[classId].map((p) => p.id);
    for (const path of paths) builds.push(unlockLegalBuild(classId, [path]));
    for (let i = 0; i < paths.length; i += 1) for (let j = i + 1; j < paths.length; j += 1) builds.push(unlockLegalBuild(classId, [paths[i], paths[j]]));
    // A tri-hybrid is deliberately representative: the level-60 budget is
    // finite, so it samples ten legal nodes per path rather than claiming
    // that 45 nodes can be purchased with 30 skill points.
    const tri = paths.flatMap((path) => SKILL_TREES[classId].find((p) => p.id === path)!.nodes.slice(0, 10).map((n) => n.id));
    const result = unlockPreferredNodes(classId, paths, tri, 30);
    builds.push({ classId, label: `${classId}:${paths.join('+')}`, pathIds: paths, unlocked: result.unlocked, activeIds: getUnlockedAbilities(classId, result.unlocked).map((a) => a.id), legal: result.legal && tri.every((id) => result.unlocked.includes(id)) });
  }
  return builds;
}

function collectConditionResources(condition: AbilityCondition, out: Set<string>): void {
  if (condition.type === 'resourceAtLeast' || condition.type === 'resourceAtMost' || condition.type === 'resourceBelow') {
    if (condition.resource) out.add(`${condition.resource} ${condition.type.replace('resource', '').toLowerCase()} ${condition.value ?? 0}`);
  }
  for (const child of condition.conditions ?? []) collectConditionResources(child, out);
}

const RESOURCE_FIELDS: Array<[keyof AbilityEffect, string]> = [
  ['furyCost', 'fury'], ['faithCost', 'faith'], ['determinationCost', 'determination'], ['orderCost', 'orders'],
  ['soulCost', 'souls'], ['heatCost', 'heat'], ['heatCostAll', 'heat (all)'], ['momentumConsumeAll', 'momentum (all)'],
  ['painConsumeMaxPct', 'pain (%)'], ['sorcererFractureConsume', 'fracture'], ['sorcererResonanceConsume', 'resonance'],
  ['sorcererControlConsume', 'control'], ['warlockDebtPay', 'debt'], ['warlockDebtGain', 'debt +'],
  ['warlockConsumeTrueName', 'trueName'], ['warlockGrantCredits', 'credit +'], ['breachConsumeOnHit', 'breach'],
];

function effectResourceRequirements(effect: AbilityEffect): string[] {
  const result = new Set<string>();
  for (const [field, label] of RESOURCE_FIELDS) {
    const value = effect[field];
    if (value === true) result.add(label);
    else if (typeof value === 'number' && value > 0) result.add(`${label} ${value}`);
  }
  return [...result];
}

function priorityVariants(classId: ClassId, pathId: string): Record<PriorityVariant, string[]> {
  const path = SKILL_TREES[classId].find((item) => item.id === pathId);
  const nodes = path?.nodes ?? [];
  const actives = nodes.filter((node): node is SkillNode & { ability: AbilityDef } => node.type === 'active' && !!node.ability);
  const ids = actives.map((node) => node.id);
  const by = (predicate: (node: SkillNode & { ability: AbilityDef }) => number): string[] => [...actives].sort((a, b) => predicate(a) - predicate(b)).map((node) => node.id);
  const defensiveKinds = new Set(['heal', 'shield', 'regen', 'buffDef', 'buffBlock', 'divineWall', 'reviveWindow', 'boneShield', 'deathVeil', 'boneFortress', 'mortalVoracity', 'aegis', 'ironWall', 'livingFortress', 'colossalShield', 'lastGuard', 'counterStance', 'orderResist', 'kingsBanner', 'painGuard', 'wallStance', 'lastStand']);
  const generatorScore = (node: SkillNode & { ability: AbilityDef }) => {
    const effect = node.ability.effect;
    return effect.furyGainOnHit || effect.furyGainFlat || effect.heatGain || effect.orderGainOnCast || effect.momentumGainOnHitExtra || effect.faithGainOnHeal || effect.judgmentStacksOnHit || effect.breachGainOnHit || effect.sorcererFractureGain || effect.sorcererResonanceGain || effect.warlockDebtGain || effect.warlockGrantCredits || 0;
  };
  const spenderScore = (node: SkillNode & { ability: AbilityDef }) => effectResourceRequirements(node.ability.effect).length ? 0 : 1;
  const defensiveScore = (node: SkillNode & { ability: AbilityDef }) => defensiveKinds.has(node.ability.effect.kind) ? 0 : 1;
  return {
    'generator-first': by((node) => -generatorScore(node)),
    'spender-first': by((node) => spenderScore(node)),
    'short-cooldown-first': by((node) => node.ability.cooldown),
    'capstone-first': [...ids].reverse(),
    'defensive-first': by(defensiveScore),
  };
}

export function auditActiveAbilities(): ActiveAuditRow[] {
  const rows: ActiveAuditRow[] = [];
  for (const classId of Object.keys(CLASSES) as ClassId[]) for (const path of SKILL_TREES[classId]) for (const node of path.nodes) {
    if (node.type !== 'active' || !node.ability) continue;
    const witnesses = CONDITION_WITNESSES.filter((ctx) => evalAbilityCondition(node.ability!.condition, ctx));
    const requirements = new Set<string>();
    collectConditionResources(node.ability.condition, requirements);
    for (const item of effectResourceRequirements(node.ability.effect)) requirements.add(item);
    const reachable = witnesses.length > 0;
    rows.push({ classId, className: CLASSES[classId].name, pathId: path.id, skillId: node.id, skillName: node.ability.name,
      cooldown: node.ability.cooldown,
      cooldownTooltipCoherent: /Recarga\s*(?::|de)\s*\d+(?:[,.]\d+)?\s*(?:s|segundos?|ciclos?)/i.test(node.desc),
      condition: node.ability.condition, conditionReachable: reachable,
      castCount: reachable ? 1 : 0, firstCast: reachable ? 'cenário testemunha' : '—', resourceRequirements: [...requirements],
      priorityVariants: priorityVariants(classId, path.id), reachable: reachable ? 'PASS' : 'FAIL',
      notes: reachable ? ['Elegibilidade verificada por testemunha sintética; castCount não substitui simulação integral de combate.'] : ['Nenhum estado legal satisfaz a condição.'] });
  }
  return rows;
}

export function auditResourceLifecycles(): ResourceLifecycleAudit[] {
  const rows: ResourceLifecycleAudit[] = [];
  for (const classId of Object.keys(CLASSES) as ClassId[]) for (const mechanic of getClassMechanics(classId)) {
    const referencedByNodes = (SKILL_TREES[classId] ?? []).flatMap((path) => path.nodes).filter((node) => node.mechanicRefs?.includes(mechanic.id)).length;
    rows.push({ classId, mechanicId: mechanic.id, name: mechanic.name, category: mechanic.category,
      maxValue: mechanic.combatDisplay?.maxValue, hasDescription: mechanic.fullDescription.trim().length > 0,
      hasResetOrCarryRule: /reinici|persiste|entre inimigos|nova tentativa|novo inimigo|dura|consum/i.test(mechanic.fullDescription), referencedByNodes });
  }
  return rows;
}

function issue(issues: ClassAuditIssue[], code: string, detail: string, id?: string): void { issues.push({ code, detail, ...(id ? { id } : {}) }); }

function validateCondition(cond: AbilityCondition, issues: ClassAuditIssue[], id: string): void {
  if (cond.type === 'all' || cond.type === 'any' || cond.type === 'not') {
    if (!cond.conditions?.length) issue(issues, 'empty-condition', `${cond.type} has no children`, id);
    for (const child of cond.conditions ?? []) validateCondition(child, issues, id);
    return;
  }
  const missing = (ok: boolean, field: string) => { if (!ok) issue(issues, 'invalid-condition', `${cond.type} requires ${field}`, id); };
  if (cond.type === 'enemyHasStatus') missing(!!cond.status, 'status');
  if (cond.type === 'hpBelow' || cond.type === 'enemyHpBelow') missing(Number.isFinite(cond.pct) && (cond.pct ?? 0) > 0 && (cond.pct ?? 0) < 1, 'pct');
  if (cond.type.startsWith('resource')) missing(!!cond.resource && Number.isFinite(cond.value), 'resource/value');
  if (cond.type === 'stateActive' || cond.type === 'stateInactive') missing(!!cond.state, 'state');
  if (cond.type === 'enemyStacksAtLeast' || cond.type === 'enemyStacksEqual') missing(!!cond.stackId && Number.isFinite(cond.stacks), 'stackId/stacks');
  if (cond.type === 'enemyPostureBand') missing(!!cond.postureBand, 'postureBand');
  if (cond.type === 'periodicEffectActive') missing(!!cond.effectId, 'effectId');
  if (cond.type === 'summonCountAtLeast' || cond.type === 'imageCountAtLeast' || cond.type === 'imageCountBelow') missing(Number.isFinite(cond.count), 'count');
  if (cond.type === 'preparedTrick') missing(!!cond.trick, 'trick');
}

function conditionWitnesses(): AbilityConditionContext[] {
  const out: AbilityConditionContext[] = [];
  const statuses = [[], ['poison'], ['burn'], ['bleed'], ['curse']];
  for (const hp of [0.2, 0.5, 0.8]) for (const enemyHp of [0.2, 0.5, 0.8]) for (const enemyStatuses of statuses)
    for (const value of [0, 1, 2, 3, 5, 6, 20, 50, 100]) for (const state of [false, true])
      for (const stacks of [0, 1, 3, 5]) for (const posture of [10, 30, 50, 80, 100])
        for (const flag of [false, true]) out.push({ hp, maxHp: 1, enemyHp, enemyMaxHp: 1, enemyStatuses, selfDebuffed: flag,
          resources: { fury: value, faith: value, debt: value, souls: value, determination: value, orders: value, resonance: value, echo: value, heat: value, momentum: value, conviction: value, tension: value, distance: value, cadence: value, steps: value, control: value, scars: value, ovation: value },
          states: { frenzy: state, thermal: state, consecration: state, trueName: state, resonance: state, trapTriggeredRecently: state, perfectRhythm: state, reflex: state, encoreReady: state },
          enemyStacks: { wounds: stacks, judgment: stacks, decomposition: stacks, trapsTriggered: stacks, trail: stacks, breach: stacks, fracture: stacks }, painPct: hp, enemyPosture: posture,
          enemyPostureBand: posture <= 25 ? 'broken' : posture <= 50 ? 'open' : posture <= 75 ? 'unstable' : 'firm', guardBroken: flag,
          riposteReady: flag, periodicEffects: { poison: flag, burn: flag, curse: flag, 'necromante:plague': flag }, summonCount: value % 3, summonMax: 2,
          isStealthed: flag, enemyExposed: flag, imageCount: value % 3, advantageReady: flag, preparedTrick: flag ? 'feint' : null, quickWindow: flag });
  return out;
}
const CONDITION_WITNESSES = conditionWitnesses();

export function auditAllClasses(): ClassAuditReport {
  const issues: ClassAuditIssue[] = [];
  const byClass: ClassAuditReport['byClass'] = {};
  const seen = new Set<string>();
  let paths = 0, nodes = 0, actives = 0, passives = 0, attributes = 0;
  for (const classId of Object.keys(CLASSES) as ClassId[]) {
    const tree = SKILL_TREES[classId] ?? [];
    const row = byClass[classId] = { paths: tree.length, nodes: 0, actives: 0, passives: 0, attributes: 0 };
    if (tree.length !== EXPECTED_PATH_COUNT) issue(issues, 'path-count', `expected ${EXPECTED_PATH_COUNT}, got ${tree.length}`, classId);
    for (const path of tree) {
      paths += 1;
      if (path.nodes.length !== EXPECTED_NODES_PER_PATH) issue(issues, 'node-count', `expected ${EXPECTED_NODES_PER_PATH}, got ${path.nodes.length}`, path.id);
      for (let i = 0; i < path.nodes.length; i += 1) {
        const node = path.nodes[i]; nodes += 1; row.nodes += 1;
        if (seen.has(node.id)) issue(issues, 'duplicate-id', 'ID appears more than once', node.id); seen.add(node.id);
        const expectedId = `${classId}:${path.id}:${i}`;
        if (node.id !== expectedId) issue(issues, 'wrong-id', `expected ${expectedId}`, node.id);
        if (node.type !== EXPECTED_TOPOLOGY[i]) issue(issues, 'topology', `index ${i} expected ${EXPECTED_TOPOLOGY[i]}, got ${node.type}`, node.id);
        for (const ref of node.mechanicRefs ?? []) {
          const mechanic = getMechanicById(ref);
          if (!mechanic) issue(issues, 'unknown-mechanic-ref', ref, node.id);
          else if (mechanic.classId !== classId) issue(issues, 'cross-class-mechanic-ref', ref, node.id);
        }
        if (node.type === 'active') {
          actives += 1; row.actives += 1;
          const ability = node.ability;
          if (!ability || ability.id !== node.id || !ability.name || !ability.desc || !Number.isFinite(ability.cooldown) || ability.cooldown < 0) issue(issues, 'invalid-active', 'active node lacks a valid AbilityDef', node.id);
          if (ability) {
            validateCondition(ability.condition, issues, node.id);
            if (!/Recarga\s*(?::|de)\s*\d+(?:[,.]\d+)?\s*(?:s|segundos?|ciclos?)/i.test(node.desc)) issue(issues, 'missing-cooldown-tooltip', 'active node does not expose its cooldown in cycles', node.id);
            if (!CONDITION_WITNESSES.some((ctx) => evalAbilityCondition(ability.condition, ctx))) issue(issues, 'unreachable-condition', 'no valid generic witness satisfies condition', node.id);
          }
          const cooldownText = node.desc.match(/Recarga:\s*(\d+(?:[,.]\d+)?)/i)?.[1];
          if (cooldownText && ability && Number(cooldownText.replace(',', '.')) !== ability.cooldown) issue(issues, 'cooldown-tooltip-mismatch', `tooltip ${cooldownText}, engine ${ability.cooldown}`, node.id);
        } else if (node.type === 'passive') {
          passives += 1; row.passives += 1;
          if (Object.keys(node.effect ?? {}).length === 0 && !node.mechanicRefs?.length && !DYNAMIC_HOOK_NODE_IDS.has(node.id)) issue(issues, 'empty-passive', 'passive has no effect or registered runtime hook', node.id);
        } else {
          attributes += 1; row.attributes += 1;
          if (Object.keys(node.effect ?? {}).length === 0 && !node.mechanicRefs?.length && !DYNAMIC_HOOK_NODE_IDS.has(node.id)) issue(issues, 'empty-attribute', 'attribute node has no effect or registered runtime hook', node.id);
        }
      }
    }
  }
  const expectedIds = new Set((Object.keys(CLASSES) as ClassId[]).flatMap((c) => (SKILL_TREES[c] ?? []).flatMap((p) => p.nodes.map((n) => n.id))));
  if (seen.size !== expectedIds.size) issue(issues, 'id-cardinality', `unique IDs ${seen.size}, observed nodes ${nodes}`);
  return { classes: Object.keys(CLASSES).length, paths, nodes, actives, passives, attributes, issues,
    dynamicHookNodes: [...DYNAMIC_HOOK_NODE_IDS].filter((id) => seen.has(id)), byClass };
}
