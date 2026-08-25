import { AbilityCondition, Character } from '../types/game';

// ── Bárbaro redesign — FÚRIA + FRENESI + FERIDAS + DOR ──
// Shared constants/pure math for the mechanic, imported by both
// DungeonPanel.tsx (the live combat engine, session-only refs) and the
// scratchpad balance simulator, so the two can never drift on a number.
// Per the spec: session-only state, never persisted on Character — Fúria and
// Feridas reset every new enemy, Dor persists across enemies within the same
// dungeon attempt but resets when the attempt itself ends (naturally true
// here since DungeonPanel remounts fresh per attempt).

export const FURY_MAX = 100;
export const FURY_MIN = 0;

// Normal generation — see Sangue Quente (barbaro:furia:6), which raises the
// two "outside Frenesi" rates while that passive is known.
export const FURY_GAIN_BASIC_HIT = 10;
export const FURY_GAIN_BASIC_HIT_SANGUE_QUENTE = 12;
export const FURY_GAIN_ABILITY_HIT = 6;
export const FURY_GAIN_CRIT_BONUS = 4;
export const FURY_GAIN_TAKE_DAMAGE = 8;
export const FURY_GAIN_TAKE_DAMAGE_SANGUE_QUENTE = 10;
// Dor Alimenta a Raiva (barbaro:resistencia:6) — up to once per envTick,
// regardless of how many Dor packets actually paid out that tick.
export const FURY_GAIN_PAIN_TICK = 3;
// Muralha Selvagem (barbaro:resistencia:12) — once per enemy action.
export const FURY_GAIN_WALL_HIT_TAKEN = 4;
// Predador Supremo (barbaro:selvageria:14) — on top of normal generation,
// only from a direct hit landing while the enemy sits at exactly 5 Feridas.
export const FURY_GAIN_PREDADOR_SUPREMO = 3;

export const FRENZY_DRAIN_PER_ACTION = 25;
// Frenesi Imparável (barbaro:furia:14).
export const FRENZY_DRAIN_PER_ACTION_IMPARAVEL = 20;
export const FRENZY_DMG_BONUS = 0.18;
// Sem Freios (barbaro:furia:8).
export const FRENZY_DMG_BONUS_SEM_FREIOS = 0.23;
export const FRENZY_SPEED_BONUS = 0.10;
export const FRENZY_DMG_TAKEN_BONUS = 0.10;

export const WOUND_MAX_STACKS = 5;
export const WOUND_TICK_DURATION = 4;
export const WOUND_DMG_PCT_PER_STACK = 0.03;
// Cheiro de Sangue (barbaro:selvageria:8).
export const WOUND_CRIT_PCT_PER_STACK = 0.02;
// Predador Supremo (barbaro:selvageria:14) — only while exactly at max stacks.
export const PREDADOR_SUPREMO_DMG_BONUS = 0.08;

export const PAIN_MAX_PCT = 0.35;
// Inquebrável (barbaro:resistencia:14).
export const PAIN_MAX_PCT_INQUEBRAVEL = 0.40;
export const PAIN_TICKS = 3;
export const PAIN_TICKS_INQUEBRAVEL = 4;
// Carne que Não Cede (barbaro:resistencia:8) — permanent, overridden (not
// stacked) by Postura Selvagem's own 35% while that's active.
export const PAIN_PASSIVE_REDIRECT_PCT = 0.10;
// Inquebrável — only while HP < 35%, only reduces Dor's OWN tick damage.
export const PAIN_TICK_REDUCTION_LOW_HP_PCT = 0.20;
export const PAIN_TICK_REDUCTION_LOW_HP_THRESHOLD = 0.35;

export function hasSkill(ch: Character, nodeId: string): boolean {
  return ch.unlockedSkills.includes(nodeId);
}

export interface PainPacket {
  amountLeft: number; // total HP still owed
  perTick: number; // HP paid per remaining tick (amountLeft / ticksLeft, recomputed isn't needed — fixed at creation)
  ticksLeft: number;
}

// ── Composable AbilityCondition evaluator ──
// Built generically (not Bárbaro-only in shape) per the redesign spec's
// request for reusable `all`/`any`/`not` composition + a handful of new leaf
// types, even though Bárbaro is the only kit using it today.
export interface AbilityConditionContext {
  hp: number;
  maxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  enemyStatuses: string[];
  selfDebuffed: boolean;
  resources: Partial<Record<'fury', number>>;
  states: Partial<Record<'frenzy', boolean>>;
  painPct: number; // current Dor total / effective max HP
  enemyWoundStacks: number;
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
    case 'stateActive': return ctx.states[cond.state ?? 'frenzy'] === true;
    case 'stateInactive': return ctx.states[cond.state ?? 'frenzy'] !== true;
    case 'painAtLeastPct': return ctx.painPct >= (cond.pct ?? 0);
    case 'enemyWoundsAtLeast': return ctx.enemyWoundStacks >= (cond.stacks ?? 1);
    default: return false;
  }
}
