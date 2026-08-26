import { AbilityCondition, AttributeKey, Character } from '../types/game';
import { CLASSES } from './classes';

// ── Generic combat-condition infrastructure ──
// Extracted out of lib/barbarian.ts once a second class (Clérigo, Fé/Graça/
// Consagração/Julgamento) needed the same resource/state/stack-gated ability
// engine — this file knows nothing about any specific class's mechanics.
// Every class-specific module (barbarian.ts, clerigo.ts, ...) imports these
// helpers and supplies its own resource id ('fury', 'faith', ...), state id
// ('frenzy', 'consecration', ...) and stack id ('wounds', 'judgment', ...)
// strings into the same generic maps below.

export function capped(rate: number, total: number, cap: number): number {
  return Math.max(0, Math.min(cap, rate * total));
}

// "FOR total"/"VIT total"/etc. means baseAttrs + allocatedAttrs — deliberately
// NOT equipment, which doesn't grant the seven primary attributes directly.
export function attrTotal(ch: Character, key: AttributeKey): number {
  return (CLASSES[ch.classId].baseAttrs[key] ?? 0) + ch.allocatedAttrs[key];
}

export function hasSkill(ch: Character, nodeId: string): boolean {
  return ch.unlockedSkills.includes(nodeId);
}

// ── Composable AbilityCondition evaluator ──
// 'all'/'any'/'not' recurse into `conditions`; every other leaf reads off
// this one live snapshot built once per conditionMet() call in
// DungeonPanel.tsx. resources/states/enemyStacks are generic string-keyed
// maps so any number of classes' resources/states/enemy-stacks can coexist
// in the same context without one class's leaf types needing to know about
// another's ids.
export interface AbilityConditionContext {
  hp: number;
  maxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  enemyStatuses: string[];
  selfDebuffed: boolean;
  resources: Record<string, number>; // e.g. { fury: 40, faith: 2 }
  states: Record<string, boolean>; // e.g. { frenzy: true, consecration: false }
  enemyStacks: Record<string, number>; // e.g. { wounds: 3, judgment: 5 }
  painPct: number; // Bárbaro-specific: Dor total / effective max HP (see barbaro:pain)
  enemyPosture?: number;
  enemyPostureBand?: 'firm' | 'unstable' | 'open' | 'broken';
  guardBroken?: boolean;
  riposteReady?: boolean;
}

export function evalAbilityCondition(cond: AbilityCondition, ctx: AbilityConditionContext): boolean {
  switch (cond.type) {
    case 'always': return true;
    case 'all': return (cond.conditions ?? []).every((c) => evalAbilityCondition(c, ctx));
    case 'any': return (cond.conditions ?? []).some((c) => evalAbilityCondition(c, ctx));
    case 'not': return !evalAbilityCondition((cond.conditions ?? [])[0] ?? { type: 'always' }, ctx);
    case 'enemyHasStatus': return ctx.enemyStatuses.includes(cond.status ?? '');
    case 'hpBelow': return ctx.hp / ctx.maxHp < (cond.pct ?? 0.5);
    case 'enemyHpBelow': return ctx.enemyHp / ctx.enemyMaxHp < (cond.pct ?? 0.5);
    case 'selfDebuffed': return ctx.selfDebuffed;
    case 'resourceAtLeast': return (ctx.resources[cond.resource ?? 'fury'] ?? 0) >= (cond.value ?? 0);
    case 'resourceBelow': return (ctx.resources[cond.resource ?? 'fury'] ?? 0) < (cond.value ?? 0);
    case 'resourceAtMost': return (ctx.resources[cond.resource ?? 'fury'] ?? 0) <= (cond.value ?? 0);
    case 'stateActive': return ctx.states[cond.state ?? 'frenzy'] === true;
    case 'stateInactive': return ctx.states[cond.state ?? 'frenzy'] !== true;
    case 'painAtLeastPct': return ctx.painPct >= (cond.pct ?? 0);
    // Generic stack-by-id leaves — replace the old Bárbaro-only
    // enemyWoundsAtLeast/enemyWoundsEqual (see stackId: 'wounds'/'judgment').
    case 'enemyStacksAtLeast': return (ctx.enemyStacks[cond.stackId ?? 'wounds'] ?? 0) >= (cond.stacks ?? 1);
    case 'enemyStacksEqual': return (ctx.enemyStacks[cond.stackId ?? 'wounds'] ?? 0) === (cond.stacks ?? 0);
    case 'enemyPostureAtMost': return (ctx.enemyPosture ?? 100) <= (cond.value ?? 0);
    case 'enemyPostureBand': return ctx.enemyPostureBand === cond.postureBand;
    case 'guardBroken': return ctx.guardBroken === true;
    case 'notGuardBroken': return ctx.guardBroken !== true;
    case 'riposteReady': return ctx.riposteReady === true;
    default: return false;
  }
}
