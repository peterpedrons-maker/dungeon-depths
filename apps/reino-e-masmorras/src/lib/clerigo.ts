// ── Clérigo redesign — FÉ + GRAÇA + CONSAGRAÇÃO + JULGAMENTO ──
import { healingBaseHp as universalHealingBaseHp } from './healing.ts';
// Shared constants/pure math for the mechanic, imported by both
// DungeonPanel.tsx (the live combat engine, session-only refs) and any
// future balance simulator, so the two can never drift on a number. Per the
// spec: Fé is session-only (never persisted on Character), reset every new
// attempt, partially carried between enemies within one attempt (see
// nextFaithForNewEnemy). Graça/Consagração/Julgamento are likewise
// session-only — Graça/Consagração live on the player, Julgamento lives on
// the current EnemyInstance and simply doesn't exist on the next spawn.

export const FAITH_MAX = 5;
export const FAITH_MIN = 0;
// Ao derrotar um inimigo, o próximo começa com no máximo 2 Fé (nunca menos
// que 1) — ver a fórmula exata em nextFaithForNewEnemy.
export const FAITH_CARRYOVER_CAP = 2;
export const FAITH_START_FIRST_ENEMY = 1;

export function nextFaithForNewEnemy(previousFaith: number): number {
  return Math.max(FAITH_START_FIRST_ENEMY, Math.min(previousFaith, FAITH_CARRYOVER_CAP));
}

// "Cura Significativa" — uma cura ATIVA direta que restaura pelo menos esta
// fração do BaselineMaxHp gera +1 Fé (máximo uma vez por ação). Mãos
// Consagradas (clerigo:devocao:3) reduz para SIGNIFICANT_HEAL_PCT_LOWERED.
export const SIGNIFICANT_HEAL_PCT = 0.15;
export const SIGNIFICANT_HEAL_PCT_LOWERED = 0.12; // Mãos Consagradas
// Mãos Consagradas (clerigo:devocao:3) — flat +3% heal efficiency, always on.
export const MAOS_CONSAGRADAS_HEAL_EFFICIENCY_PCT = 0.03;

// "Barreira Protetora" — uma barreira NORMAL (não Graça) que absorver
// acumuladamente pelo menos esta fração do EffectiveMaxHp antes de
// desaparecer gera +1 Fé, uma vez por instância.
export const BARRIER_FAITH_THRESHOLD_PCT = 0.08;

// "Julgamento" — marcos de Fé (uma vez por inimigo, cada um).
export const JUDGMENT_FAITH_MILESTONES = [3, 5];

export function hasSkill(unlockedSkills: string[], nodeId: string): boolean {
  return unlockedSkills.includes(nodeId);
}

// A habilidade pertence à Devoção puramente pelo prefixo do seu id — nunca
// pelo nome, per a regra "não hardcodar nomes de skills".
export function isDevotionAbilityId(abilityId: string): boolean {
  return abilityId.startsWith('clerigo:devocao:');
}

// ── GRAÇA (clerigo:devocao:6 Graça Transbordante desbloqueia; 14 Graça
// Divina melhora) ──
export const GRACE_BASE_CONVERSION_PCT = 0.40;
export const GRACE_DIVINA_CONVERSION_PCT = 0.55;
export const GRACE_BASE_CAP_PCT = 0.08; // fração do EffectiveMaxHp
export const GRACE_DIVINA_CAP_PCT = 0.12;
export const GRACE_BASE_DURATION_TICKS = 3;
export const GRACE_DIVINA_DURATION_TICKS = 4;
// Fôlego Abençoado (clerigo:devocao:2) — cap adicional por VIT total, até
// +2 pontos percentuais (cap absoluto com Graça Divina: 12% + 2% = 14%).
export const GRACE_FOLEGO_VIT_RATE = 0.0008;
export const GRACE_FOLEGO_VIT_CAP = 0.02;
// Coração Devoto (clerigo:devocao:11) — +10pp de conversão enquanto HP<35%.
export const GRACE_CORACAO_DEVOTO_HP_THRESHOLD = 0.35;
export const GRACE_CORACAO_DEVOTO_BONUS_PCT = 0.10;

// ── CONSAGRAÇÃO (múltiplas habilidades de Retidão criam/renovam) ──
export const CONSECRATION_DEFAULT_ROUNDS = 3;
// Santuário Vivo (clerigo:retidao:14) — +1 tick de duração MÁXIMA.
export const SANTUARIO_VIVO_MAX_ROUNDS_BONUS = 1;
export const SANTUARIO_VIVO_BURST_THRESHOLD_PCT = 0.15; // fração do EffectiveMaxHp
export const SANTUARIO_VIVO_BURST_REDUCTION_PCT = 0.20;
// Solo Consagrado (clerigo:retidao:6) — enquanto Consagração ativa.
export const SOLO_CONSAGRADO_MDEF_BONUS = 0.08;
export const SOLO_CONSAGRADO_TENACITY_BONUS = 0.06;
export const SOLO_CONSAGRADO_FIRST_NEGATIVE_DURATION_CUT = 1; // envTicks
// Vigília (clerigo:retidao:7) — primeiro tick de DOT sofrido na Consagração.
export const VIGILIA_FIRST_DOT_TICK_REDUCTION_PCT = 0.15;
// Intercessão (clerigo:retidao:8) — cura ao ver uma barreira normal
// destruída enquanto Consagração ativa.
export const INTERCESSAO_HEAL_PCT = 0.04; // fração do BaselineMaxHp
// Fé Vigilante (clerigo:retidao:2) — resistiu um efeito negativo durante
// Consagração: +1 tick de duração, uma vez por instância.
export const FE_VIGILANTE_EXTEND_ROUNDS = 1;
// Barreira Ritual (clerigo:retidao:3) — eficiência multiplicativa extra em
// barreiras NORMAIS do Clérigo (não Graça).
export const BARREIRA_RITUAL_EFFICIENCY_BONUS = 0.04;
// Guarda da Alma (clerigo:retidao:5) — DEF física base + bônus com barreira ativa.
export const GUARDA_DA_ALMA_BASE_DEF_PCT = 0.02;
export const GUARDA_DA_ALMA_SHIELD_DEF_PCT = 0.03;
// Couraça Espiritual (clerigo:retidao:0).
export const COURACA_ESPIRITUAL_BASE_MDEF_PCT = 0.02;
export const COURACA_ESPIRITUAL_CONSECRATION_MDEF_PCT = 0.03;
// Ancora Sagrada (clerigo:retidao:11) — próximo golpe direto após uma
// barreira normal ser destruída, dentro de uma janela curta.
export const ANCORA_SAGRADA_WINDOW_TICKS = 2;
export const ANCORA_SAGRADA_NEXT_HIT_REDUCTION_PCT = 0.08;
// Golpe Sagrado (clerigo:retidao:9).
export const GOLPE_SAGRADO_BASE_MULT = 1.45;
export const GOLPE_SAGRADO_CONSECRATION_BONUS_MULT = 0.25; // 1.45 -> 1.70
export const GOLPE_SAGRADO_EXTEND_ROUNDS = 1;
// Voto de Proteção (clerigo:retidao:10).
export const VOTO_PROTECAO_BASE_DMG_REDUCTION_PCT = 0.08;
export const VOTO_PROTECAO_DMG_REDUCTION_CAP_PCT = 0.12;
export const VOTO_PROTECAO_TENACITY_BONUS_PCT = 0.08;
export const VOTO_PROTECAO_CONSECRATION_ROUNDS = 4;
export const VOTO_PROTECAO_BUFF_ROUNDS = 3;
// Martelo da Fé (clerigo:retidao:12).
export const MARTELO_DA_FE_MULT = 1.80;
export const MARTELO_DA_FE_SHIELD_FROM_DMG_PCT = 0.20;
export const MARTELO_DA_FE_SHIELD_CAP_PCT = 0.06; // fração do EffectiveMaxHp
export const MARTELO_DA_FE_SUPPORT_FACTOR = 0.50;
// Muralha Divina (clerigo:retidao:13).
export const MURALHA_DIVINA_SHIELD_PCT = 0.12;
export const MURALHA_DIVINA_SHIELD_CAP_PCT = 0.24;
export const MURALHA_DIVINA_CONSECRATION_ROUNDS = 4;
export const MURALHA_DIVINA_SHIELD_ROUNDS = 4;
export const MURALHA_DIVINA_DMG_TAKEN_PCT = -0.10;

// ── JULGAMENTO (Provação) ──
export const JUDGMENT_MAX_STACKS = 5;
export const JUDGMENT_BASE_DURATION_TICKS = 5;
export const JUDGMENT_CONVICCAO_DURATION_TICKS = 6; // Convicção (clerigo:provacao:5)
// Peso do Veredito (clerigo:provacao:8) é a ÚNICA fonte do bônus de dano por
// stack — Julgamento em si só guarda stacks (evita duplicar o bônus).
export const JUDGMENT_DMG_PCT_PER_STACK = 0.015;

export interface JudgmentState {
  stacks: number;
  ticksLeft: number;
}
export function applyJudgmentState(current: JudgmentState | undefined, amount: number, duration: number): JudgmentState | undefined {
  if (amount <= 0) return current;
  return { stacks: Math.min(JUDGMENT_MAX_STACKS, (current?.stacks ?? 0) + amount), ticksLeft: duration };
}
export function consumeJudgmentState(current: JudgmentState | undefined, amount: number): JudgmentState | undefined {
  if (!current || amount <= 0) return current;
  const stacks = Math.max(0, current.stacks - amount);
  return stacks > 0 ? { ...current, stacks, ticksLeft: current.ticksLeft } : undefined;
}
export function tickJudgmentState(current: JudgmentState | undefined): JudgmentState | undefined {
  if (!current) return undefined;
  const ticksLeft = current.ticksLeft - 1;
  return ticksLeft > 0 ? { ...current, ticksLeft } : undefined;
}
// Fogo da Fé (clerigo:provacao:0).
export const FOGO_DA_FE_DMG_VS_JUDGMENT_PCT = 0.01;
// Olhar do Juiz (clerigo:provacao:1).
export const OLHAR_DO_JUIZ_HIGH_JUDGMENT_THRESHOLD = 3;
export const OLHAR_DO_JUIZ_HIGH_JUDGMENT_ACCURACY_PCT = 0.02;
// Palavra Ardente (clerigo:provacao:2) — dano direto final extra em
// habilidades que aplicam Julgamento.
export const PALAVRA_ARDENTE_DMG_PCT = 0.03;
// Zelo Inflexível (clerigo:provacao:3).
export const ZELO_INFLEXIVEL_EXTEND_ROUNDS = 1;
// Chama Purificadora (clerigo:provacao:4).
export const CHAMA_PURIFICADORA_MULT = 1.35;
export const CHAMA_PURIFICADORA_JUDGMENT_STACKS = 2;
// Veredito Preciso (clerigo:provacao:7).
export const VEREDITO_PRECISO_ACCURACY_PER_STACK = 0.004;
// Purificação Divina (clerigo:provacao:9).
export const PURIFICACAO_DIVINA_JUDGMENT_PER_2_CLEANSED = 1;
export const PURIFICACAO_DIVINA_JUDGMENT_CAP = 2;
// Sentença Final (clerigo:provacao:10).
export const SENTENCA_FINAL_HP_THRESHOLD = 0.40;
export const SENTENCA_FINAL_MIN_JUDGMENT = 2;
export const SENTENCA_FINAL_MAX_CONSUME = 3;
export const SENTENCA_FINAL_BASE_MULT = 1.75;
export const SENTENCA_FINAL_MULT_PER_STACK = 0.20;
// Sabedoria do Julgamento (clerigo:provacao:11) — cura ao consumir 3+ de uma vez.
export const SABEDORIA_JULGAMENTO_MIN_CONSUMED = 3;
export const SABEDORIA_JULGAMENTO_HEAL_PCT = 0.02; // fração do BaselineMaxHp
// Ira Consumidora (clerigo:provacao:12).
export const IRA_CONSUMIDORA_MIN_JUDGMENT = 3;
export const IRA_CONSUMIDORA_BASE_MULT = 1.55;
export const IRA_CONSUMIDORA_MULT_PER_CURRENT_STACK = 0.16;
export const IRA_CONSUMIDORA_DURATION_CUT_TICKS = 2;
// Apocalipse Sagrado (clerigo:provacao:13).
export const APOCALIPSE_SAGRADO_REQUIRED_JUDGMENT = 5;
export const APOCALIPSE_SAGRADO_MULT = 2.85;
// Juízo Final (clerigo:provacao:14).
export const JUIZO_FINAL_MATK_BUFF_PCT = 0.10;
export const JUIZO_FINAL_MATK_BUFF_ROUNDS = 2;

// ── DEVOÇÃO — nós de atributo com interação ──
// Sabedoria Compassiva (clerigo:devocao:0).
export const SABEDORIA_COMPASSIVA_HP_THRESHOLD = 0.40;
export const SABEDORIA_COMPASSIVA_HEAL_EFFICIENCY_PCT = 0.05;
// Prece Serena (clerigo:devocao:1) / Liturgia Contínua (clerigo:devocao:7).
export const PRECE_SERENA_CDR_PCT = 0.03;
export const LITURGIA_CONTINUA_CDR_PCT = 0.03;
export const LITURGIA_CONTINUA_CDR_BOOSTED_PCT = 0.05;
export const LITURGIA_CONTINUA_FAITH_THRESHOLD = 3;
// Véu da Alma (clerigo:devocao:5).
export const VEU_DA_ALMA_HEAL_EFFICIENCY_PCT = 0.05;
// Misericórdia Ativa (clerigo:devocao:8) — reduz duração de 1 DOT em 1 tick.
export const MISERICORDIA_ATIVA_DOT_REDUCTION_TICKS = 1;

// Portion of a barrier the Clérigo created, tracked so several talents can
// react to "this specific barrier" rather than the shared shield pool as a
// whole (which stacks numbers from any number of casts additively with no
// concept of "instance" on its own). Consumed oldest-first alongside the
// pooled shield value whenever it absorbs damage — see DungeonPanel's
// clerigoAbsorbShield(). isWallBonus flags Muralha Divina's own portion,
// whose remaining>0 gates its -10% dmg-taken reduction.
export interface BarrierPortion {
  remaining: number;
  absorbedTotal: number;
  faithThresholdAmount?: number; // absolute HP (already resolved from a %) — grants +1 Fé once absorbedTotal reaches it
  faithGranted: boolean;
  isWallBonus?: boolean;
}

export interface GracePacket {
  amount: number;
  ticksLeft: number;
}

/** Fonte única da Vida Base usada pelas curas do Clérigo. */
export function clericBaseHp(baseHp: number, level: number): number {
  return universalHealingBaseHp(baseHp, level);
}

/** Fonte única do valor bruto de uma cura direta antes de limitar pelo HP perdido. */
export function clericDirectHealAmount(
  baseHp: number,
  healPct: number,
  supportPowerPct: number,
  healEfficiencyPct = 0,
): number {
  return Math.round(baseHp * healPct * (1 + supportPowerPct) * (1 + healEfficiencyPct));
}

export function clericPassiveHealAmount(baseHp: number, healPct: number, supportPowerPct: number): number {
  return Math.round(baseHp * healPct * (1 + supportPowerPct));
}

export function significantHealAmount(baseHp: number, lowered: boolean): number {
  return Math.ceil(baseHp * (lowered ? SIGNIFICANT_HEAL_PCT_LOWERED : SIGNIFICANT_HEAL_PCT));
}
