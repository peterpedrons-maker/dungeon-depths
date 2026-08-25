import { AbilityCondition, AttributeKey, Character } from '../types/game';
import { CLASSES } from './classes';

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
// Músculo Rasgador (barbaro:selvageria:5) raises this to 3.2%.
export const WOUND_DMG_PCT_PER_STACK_MUSCULO_RASGADOR = 0.032;
// Cheiro de Sangue (barbaro:selvageria:8) — cut from 2.0% to 1.5% per stack
// in the "definitivo" pass (direct user spec revision).
export const WOUND_CRIT_PCT_PER_STACK = 0.015;
// Olfato Aguçado (barbaro:selvageria:7) — Precisão per Ferida on the enemy,
// not attribute-scaled (see its own ScalingEntry: role 'mecanica').
export const WOUND_ACCURACY_PCT_PER_STACK = 0.004;
// Predador Supremo (barbaro:selvageria:14) — only while exactly at max stacks.
export const PREDADOR_SUPREMO_DMG_BONUS = 0.08;

export const PAIN_MAX_PCT = 0.35;
export const PAIN_TICKS = 3;
export const PAIN_TICKS_INQUEBRAVEL = 4;
// Carne que Não Cede (barbaro:resistencia:8) — permanent, overridden (not
// stacked) by Postura Selvagem's own active window while that's active.
export const PAIN_PASSIVE_REDIRECT_PCT = 0.10;
// Postura Selvagem (barbaro:resistencia:4) — base 30%, +VIT scaling below,
// capped at 35% total (see POSTURA_VIT_RATE/CAP).
export const POSTURA_BASE_REDIRECT_PCT = 0.30;
// Inquebrável — only while HP < 35%, only reduces Dor's OWN tick damage.
export const PAIN_TICK_REDUCTION_LOW_HP_PCT = 0.20;
export const PAIN_TICK_REDUCTION_LOW_HP_THRESHOLD = 0.35;

// Fúria threshold several Fúria-tree attribute nodes gate on (Força
// Furiosa's dmg bonus, Olho de Sangue's crit bonus) — a flat, non-attribute-
// scaled trigger point, same for every character.
export const FURY_INTERACTION_THRESHOLD = 50;

// ── "Definitivo" pass — VIT/FOR/SOR/DES-total-scaled interactions layered
// onto specific attribute nodes, each with its own rate (per attribute
// point) and CAP (mandatory per the spec's section 5: "todo scaling
// adicional diretamente baseado em atributo possui CAP"). Named
// `<TREE>_<NODE-SLUG>_RATE`/`_CAP` so each pair sits next to the node it
// belongs to. All rates are expressed as a fraction per point (e.g. "0.10
// ponto percentual por ponto" = 0.001).
export const FURIA_FORCA_FURIOSA_RATE = 0.001; // FOR, dmg direto final, while Fúria >= 50
export const FURIA_FORCA_FURIOSA_CAP = 0.04;
export const FURIA_CORACAO_DE_GUERRA_RATE = 0.001; // VIT, reduces Frenesi's own +10% dmg-taken penalty
export const FURIA_CORACAO_DE_GUERRA_CAP = 0.04; // floors the penalty at +6%
export const FURIA_OLHO_DE_SANGUE_RATE = 0.001; // SOR, crit chance, while Fúria >= 50
export const FURIA_OLHO_DE_SANGUE_CAP = 0.03;
// Pressão Crescente (barbaro:furia:3) — scales with CURRENT Fúria, not a
// character attribute total, hence no per-point rate/cap pair: +0.5% dmg
// direto final per 25 Fúria currently held (floor), capped naturally at
// +2% by Fúria's own 100 ceiling.
export const FURIA_PRESSAO_CRESCENTE_PER_25_FURY = 0.005;
export const FURIA_CORPO_EM_FRENESI_RATE = 0.001; // VIT, Tenacidade, while Frenesi active
export const FURIA_CORPO_EM_FRENESI_CAP = 0.04;
export const FURIA_GOLPE_DEVASTADOR_RATE = 0.002; // SOR, dano crítico, during Frenesi
export const FURIA_GOLPE_DEVASTADOR_CAP = 0.04;
// Força sem Limite (barbaro:furia:11) — dmg direto final for any ability
// whose own furyCost is >= this threshold, scaled by FOR total.
export const FURIA_FORCA_SEM_LIMITE_MIN_FURY_COST = 30;
export const FURIA_FORCA_SEM_LIMITE_RATE = 0.00075;
export const FURIA_FORCA_SEM_LIMITE_CAP = 0.03;

export const RESISTENCIA_PELE_ENDURECIDA_RATE = 0.0012; // VIT, Dor cap (fraction of max HP)
export const RESISTENCIA_PELE_ENDURECIDA_CAP = 0.04;
export const RESISTENCIA_ESPIRITO_INDOMAVEL_RATE = 0.001; // VIT, permanent Tenacidade
export const RESISTENCIA_ESPIRITO_INDOMAVEL_CAP = 0.03;
// Corpo Duro (barbaro:resistencia:2) — only fires when a single direct
// enemy hit, after normal mitigation, would exceed this fraction of
// effective max HP.
export const RESISTENCIA_CORPO_DURO_HIT_THRESHOLD_PCT = 0.15;
export const RESISTENCIA_CORPO_DURO_RATE = 0.001; // VIT, extra reduction on that hit
export const RESISTENCIA_CORPO_DURO_CAP = 0.04;
// Constituição Selvagem (barbaro:resistencia:3) — DEF% bonus while Dor >= this.
export const RESISTENCIA_CONSTITUICAO_PAIN_THRESHOLD_PCT = 0.10;
export const RESISTENCIA_CONSTITUICAO_RATE = 0.0012; // VIT
export const RESISTENCIA_CONSTITUICAO_CAP = 0.04;
export const RESISTENCIA_OSSOS_FORTES_RATE = 0.001; // VIT, reduces Dor's OWN tick damage (unconditional)
export const RESISTENCIA_OSSOS_FORTES_CAP = 0.04;
// Vigor Doloroso (barbaro:resistencia:7) — multiplies the HEAL AMOUNT from
// lifesteal specifically (not the lifestealPct stat) while Dor > 0.
export const RESISTENCIA_VIGOR_DOLOROSO_RATE = 0.0015; // VIT
export const RESISTENCIA_VIGOR_DOLOROSO_CAP = 0.05;
// Coração Selvagem (barbaro:resistencia:11) — direct dmg-taken reduction
// while HP < 35% (never touches Dor/DOT).
export const RESISTENCIA_CORACAO_SELVAGEM_HP_THRESHOLD = 0.35;
export const RESISTENCIA_CORACAO_SELVAGEM_RATE = 0.0015; // VIT
export const RESISTENCIA_CORACAO_SELVAGEM_CAP = 0.05;
// Postura Selvagem's own VIT scaling on top of POSTURA_BASE_REDIRECT_PCT.
export const POSTURA_VIT_RATE = 0.0015;
export const POSTURA_VIT_CAP = 0.05;
// Fome Sanguinária — base % of max HP of Dor cleared, +VIT scaling, capped.
export const FOME_SANGUINARIA_BASE_PCT = 0.08;
export const FOME_SANGUINARIA_VIT_RATE = 0.001;
export const FOME_SANGUINARIA_VIT_CAP = 0.03;
// Muralha Selvagem — base dmgTakenPct reduction, +VIT scaling, capped.
export const MURALHA_BASE_DMG_TAKEN_PCT = -0.15;
export const MURALHA_VIT_RATE = 0.001;
export const MURALHA_VIT_CAP = 0.04;
// Resistência Absoluta — base % of max HP of Dor cleared, +VIT scaling, capped.
export const RESISTENCIA_ABSOLUTA_BASE_PCT = 0.12;
export const RESISTENCIA_ABSOLUTA_VIT_RATE = 0.0012;
export const RESISTENCIA_ABSOLUTA_VIT_CAP = 0.04;
// Inquebrável — flat addition to whatever the current Dor cap already is
// (base 35% + Pele Endurecida's own VIT-scaled bonus, up to 44% total).
export const INQUEBRAVEL_PAIN_CAP_BONUS = 0.05;

// Olhar Predador (barbaro:selvageria:0) — Precisão vs an enemy carrying at
// least 1 Ferida.
export const SELVAGERIA_OLHAR_PREDADOR_RATE = 0.001; // DES
export const SELVAGERIA_OLHAR_PREDADOR_CAP = 0.02;
// Força da Caça (barbaro:selvageria:1) — dmg direto final on a hit that
// itself applies >= 1 Ferida (the initiating hit only, never the tick).
export const SELVAGERIA_FORCA_DA_CACA_RATE = 0.00075; // FOR
export const SELVAGERIA_FORCA_DA_CACA_CAP = 0.03;
// Sangue de Caça (barbaro:selvageria:2) — on-kill heal, only if the enemy
// carried >= this many Feridas at the moment it died.
export const SANGUE_DE_CACA_MIN_WOUNDS = 3;
export const SANGUE_DE_CACA_BASE_HEAL_PCT = 0.01;
export const SANGUE_DE_CACA_VIT_RATE = 0.0005;
export const SANGUE_DE_CACA_VIT_CAP = 0.01; // total heal caps at 2% max HP
// Mão Pesada (barbaro:selvageria:3) — critDmg vs an enemy carrying a Ferida.
export const SELVAGERIA_MAO_PESADA_RATE = 0.0015; // SOR
export const SELVAGERIA_MAO_PESADA_CAP = 0.03;
// Instinto Mortal (barbaro:selvageria:11) — critDmg vs an enemy at EXACTLY
// max Feridas (distinct from Mão Pesada's own "any Ferida" trigger).
export const SELVAGERIA_INSTINTO_MORTAL_RATE = 0.0015; // SOR
export const SELVAGERIA_INSTINTO_MORTAL_CAP = 0.03;

export function capped(rate: number, total: number, cap: number): number {
  return Math.max(0, Math.min(cap, rate * total));
}

// Section 5 of the spec: "FOR total"/"VIT total"/etc. means baseAttrs +
// allocatedAttrs — deliberately NOT equipment, which doesn't grant the
// seven primary attributes directly today.
export function attrTotal(ch: Character, key: AttributeKey): number {
  return (CLASSES[ch.classId].baseAttrs[key] ?? 0) + ch.allocatedAttrs[key];
}

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
    case 'resourceAtMost': return (ctx.resources[cond.resource ?? 'fury'] ?? 0) <= (cond.value ?? 0);
    case 'stateActive': return ctx.states[cond.state ?? 'frenzy'] === true;
    case 'stateInactive': return ctx.states[cond.state ?? 'frenzy'] !== true;
    case 'painAtLeastPct': return ctx.painPct >= (cond.pct ?? 0);
    case 'enemyWoundsAtLeast': return ctx.enemyWoundStacks >= (cond.stacks ?? 1);
    case 'enemyWoundsEqual': return ctx.enemyWoundStacks === (cond.stacks ?? 0);
    default: return false;
  }
}
