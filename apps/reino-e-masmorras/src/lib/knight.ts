// ── Cavaleiro redesign — DETERMINAÇÃO + RETALIAÇÃO + MOMENTUM + ORDENS ──
// Shared constants/pure math for the mechanic, imported by both
// DungeonPanel.tsx (the live combat engine, session-only refs) and any
// future balance simulator, so the two can never drift on a number. Per the
// spec: all four resources are session-only (never persisted on Character),
// reset every new enemy EXCEPT Momentum's Sede de Vitória carry-over and
// Ordens' Liderança carry-over (both capped, see below) — and Bastião
// Inquebrável's once-per-ATTEMPT save, which persists across enemies.

export function hasSkill(unlockedSkills: string[], nodeId: string): boolean {
  return unlockedSkills.includes(nodeId);
}

// ── DETERMINAÇÃO (Bastião) ──
export const DETERMINATION_MAX = 100;
export const DETERMINATION_MIN = 0;
export const DETERMINATION_GEN_BLOCK = 10;
export const DETERMINATION_GEN_BLOCK_GUARDA_ELEVADA = 12; // clerigo-style talent bump, but Bastião's own (cavaleiro:bastiao:2)
export const DETERMINATION_GEN_DIRECT_HIT = 3;
export const DETERMINATION_GEN_BARRIER_PER_3PCT = 1; // +1 per 3% of EffectiveMaxHp a Cavaleiro-made barrier absorbs in one enemy action
export const DETERMINATION_GEN_BARRIER_CAP_PER_ACTION = 4;
export const DETERMINATION_GEN_BARRIER_THRESHOLD_PCT = 0.03;
export const IRON_WALL_DETERMINATION_THRESHOLD_PCT = 0.02;

/**
 * Determinação gerada por um único ataque direto real do inimigo.
 * Bloqueio substitui a geração base; Fortaleza Viva bloqueia ambas.
 */
export function determinationForDirectHit(options: { landed: boolean; blocked: boolean; fortressActive: boolean; elevatedBlock?: boolean }): number {
  if (!options.landed || options.fortressActive) return 0;
  if (options.blocked) return options.elevatedBlock ? DETERMINATION_GEN_BLOCK_GUARDA_ELEVADA : DETERMINATION_GEN_BLOCK;
  return DETERMINATION_GEN_DIRECT_HIT;
}
export function addDetermination(current: number, amount: number): number {
  return Math.max(DETERMINATION_MIN, Math.min(DETERMINATION_MAX, current + Math.max(0, amount)));
}

/** Converte dano realmente impedido em Determinação, por instância e com
 * teto. Fortaleza Viva desliga também esta fonte, assim como a geração por
 * bloqueio/ataque direto. */
export function determinationForPreventedDamage(options: {
  amountPrevented: number;
  effectiveMaxHp: number;
  thresholdPct: number;
  pointsPerThreshold?: number;
  capPoints: number;
  fortressActive?: boolean;
}): number {
  if (options.fortressActive || options.amountPrevented <= 0 || options.effectiveMaxHp <= 0 || options.thresholdPct <= 0) return 0;
  return Math.min(options.capPoints, Math.floor(options.amountPrevented / options.effectiveMaxHp / options.thresholdPct) * (options.pointsPerThreshold ?? 1));
}

// ── RETALIAÇÃO (cavaleiro:bastiao:6 Reação Defensiva) ──
export const RETALIATION_MAX_CHARGES = 2;
export const RETALIATION_BLOCKS_PER_CHARGE = 3;
export const RETALIATION_DEF_FACTOR = 0.45;
export const RETALIATION_ATK_FACTOR = 0.60;

// ── MOMENTUM (Investida) ──
export const MOMENTUM_MAX_BASE = 100;
export const MOMENTUM_MIN = 0;
export const MOMENTUM_GAIN_FIRST_HIT = 15;
export const MOMENTUM_GAIN_NEXT_HIT = 8;
export const MOMENTUM_GAIN_FIRST_HIT_PASSO_DE_GUERRA_BONUS = 10; // cavaleiro:investida:1
export const MOMENTUM_LOSS_HEAVY_HIT_PCT_BASE = 0.15; // fraction of EffectiveMaxHp a single hit must deal to cost Momentum
export const MOMENTUM_LOSS_AMOUNT_BASE = 15;
// Sangue de Combate (cavaleiro:investida:2) raises the heavy-hit threshold.
export const SANGUE_DE_COMBATE_THRESHOLD_RATE = 0.001; // per VIT total
export const SANGUE_DE_COMBATE_THRESHOLD_CAP = 0.03;
// Instinto de Sobrevivência (cavaleiro:investida:11) lowers the loss amount.
export const INSTINTO_SOBREVIVENCIA_VIT_DIVISOR = 6;
export const INSTINTO_SOBREVIVENCIA_LOSS_REDUCTION_CAP = 7;
export const MOMENTUM_LOSS_MIN = 8;
// Per-20-Momentum passive benefit, before/after cavaleiro:investida:6 (Momentum passive node).
export const MOMENTUM_BONUS_DMG_PER_20_BASE = 0.0075;
export const MOMENTUM_BONUS_SPEED_PER_20_BASE = 0.0075;
export const MOMENTUM_BONUS_DMG_PER_20_UPGRADED = 0.0125;
export const MOMENTUM_BONUS_SPEED_PER_20_UPGRADED = 0.0100;
export const MOMENTUM_MAX_VETERANO_BONUS = 20; // cavaleiro:investida:7 — 100 -> 120
// Sede de Vitória (cavaleiro:investida:8).
export const SEDE_DE_VITORIA_HEAL_PCT = 0.025; // fraction of EffectiveMaxHp on kill
export const SEDE_DE_VITORIA_MOMENTUM_CARRY_CAP = 30;
// Cavaleiro Imparável (cavaleiro:investida:14).
export const IMPARAVEL_HITS_PER_MAX_BONUS = 4;
export const IMPARAVEL_MAX_BONUS_PER_TRIGGER = 10;
export const IMPARAVEL_MAX_BONUS_CAP_PER_ENEMY = 30;
export const IMPARAVEL_HIGH_MOMENTUM_PCT_THRESHOLD = 0.90; // fraction of CURRENT max
export const IMPARAVEL_HIGH_MOMENTUM_DMG_BONUS = 0.05;
export const IMPARAVEL_HIGH_MOMENTUM_TENACITY_BONUS = 0.10;
// Pressão Constante (cavaleiro:investida:5).
export const PRESSAO_CONSTANTE_PER_STACK = 0.005;
export const PRESSAO_CONSTANTE_MAX_STACKS = 5;

// ── ORDENS (Comando) ──
export const ORDERS_MAX = 3;
// CommandPotency — a Comando buff's own base % is scaled directly from SAB.
// Voz de Comando (cavaleiro:comando:0) raises the coefficient; the cap never moves.
export const COMMAND_POTENCY_COEF_BASE = 0.50;
export const COMMAND_POTENCY_COEF_VOZ_DE_COMANDO = 0.60;
export const COMMAND_POTENCY_CAP = 0.30;
export function commandPotencyFromWis(totalWis: number, affinity: number, coef: number): number {
  return Math.min(COMMAND_POTENCY_CAP, Math.max(0, totalWis) * 0.01 * affinity * coef);
}
// Presença de Líder / Estratégia de Campo (cavaleiro:comando:1 / :7) — extra
// envTick(s) on a Comando ability's own temporary buff, combined cap 2.
export const PRESENCA_LIDER_VIT_THRESHOLD = 20;
export const PRESENCA_LIDER_DURATION_BONUS = 1;
export const ESTRATEGIA_DE_CAMPO_SAB_THRESHOLD = 18;
export const ESTRATEGIA_DE_CAMPO_DURATION_BONUS = 1;
export const COMANDO_BUFF_DURATION_BONUS_COMBINED_CAP = 2;
// Disciplina Militar (cavaleiro:comando:2).
export const DISCIPLINA_MILITAR_TENACITY_RATE = 0.001; // per VIT total
export const DISCIPLINA_MILITAR_TENACITY_CAP = 0.03;
// Estratégia (cavaleiro:comando:3) — CDR only for cavaleiro:comando:* abilities.
export const ESTRATEGIA_CDR_RATE = 0.0025; // per SAB total
export const ESTRATEGIA_CDR_CAP = 0.07;
// Formação (cavaleiro:comando:5) — extra DEF while >=1 Comando buff is active.
export const FORMACAO_DEF_RATE = 0.0012; // per VIT total
export const FORMACAO_DEF_CAP = 0.04;
// Disciplina Inabalável (cavaleiro:comando:8).
export const DISCIPLINA_INABALAVEL_THRESHOLD = 2;

// ── Ordem: Ataque (cavaleiro:comando:4) ──
export const ORDEM_ATAQUE_DMG_MULT = 1.25;
export const ORDEM_ATAQUE_DMG_MULT_SUPREME = 1.60;
export const ORDEM_ATAQUE_ATK_BUFF_BASE = 0.10;
export const ORDEM_ATAQUE_ATK_BUFF_SUPREME = 0.15;
export const ORDEM_ATAQUE_BUFF_ROUNDS = 3;

// ── Ordem: Avançar (cavaleiro:comando:9) ──
export const ORDEM_AVANCAR_DMG_MULT = 1.45;
export const ORDEM_AVANCAR_DMG_MULT_SUPREME = 1.75;
export const ORDEM_AVANCAR_SPEED_BUFF_BASE = 0.08;
export const ORDEM_AVANCAR_SPEED_BUFF_SUPREME = 0.12;
export const ORDEM_AVANCAR_DMG_BUFF_BASE = 0.05;
export const ORDEM_AVANCAR_DMG_BUFF_SUPREME = 0.08;
export const ORDEM_AVANCAR_BUFF_ROUNDS = 3;

// ── Ordem: Resistir (cavaleiro:comando:10) ──
export const ORDEM_RESISTIR_HP_THRESHOLD = 0.75;
export const ORDEM_RESISTIR_SHIELD_BASE = 0.09;
export const ORDEM_RESISTIR_SHIELD_PER_VIT = 0.0008;
export const ORDEM_RESISTIR_SHIELD_CAP = 0.03;
export const ORDEM_RESISTIR_SHIELD_BASE_SUPREME = 0.13;
export const ORDEM_RESISTIR_SHIELD_CAP_SUPREME = 0.03;
export const ORDEM_RESISTIR_DMG_RED_BASE = 0.10;
export const ORDEM_RESISTIR_DMG_RED_SUPREME = 0.15;
export const ORDEM_RESISTIR_BUFF_ROUNDS = 3;

// ── Ordem: Executar (cavaleiro:comando:12) ──
export const ORDEM_EXECUTAR_HP_THRESHOLD = 0.30;
export const ORDEM_EXECUTAR_DMG_BASE = 2.10;
export const ORDEM_EXECUTAR_PER_HP_BELOW_PCT = 0.015; // per 1 percentage point of HP below the threshold
export const ORDEM_EXECUTAR_CAP = 0.45;
export const ORDEM_EXECUTAR_SUPREME_EXTRA_CAP = 0.45;

// ── Estandarte do Rei (cavaleiro:comando:13) ──
export const ESTANDARTE_DURATION = 4;
export const ESTANDARTE_ATK_BASE = 0.10;
export const ESTANDARTE_ATK_SUPREME = 0.15;
export const ESTANDARTE_DEF_BASE = 0.12;
export const ESTANDARTE_DEF_SUPREME = 0.17;
export const ESTANDARTE_TENACITY_BASE = 0.10;
export const ESTANDARTE_TENACITY_SUPREME = 0.15;

// ── Bastião attribute-node interactions ──
export const ARMADURA_ACO_HEAVY_HIT_PCT = 0.15;
export const ARMADURA_ACO_RATE = 0.001; // per VIT total
export const ARMADURA_ACO_CAP = 0.04;
export const PULSO_VITAL_BARRIER_EFF_RATE = 0.001; // per VIT total
export const PULSO_VITAL_BARRIER_EFF_CAP = 0.04;
export const PESO_ARMADURA_GOLPE_PESADO_PCT = 0.18;
export const PESO_ARMADURA_RATE = 0.0015; // per VIT total
export const PESO_ARMADURA_CAP = 0.06;
export const ESCUDO_DISCIPLINADO_WINDOW_TICKS = 2;
export const ESCUDO_DISCIPLINADO_REDUCTION_PCT = 0.08;
export const CORPO_BLINDADO_DEF_TO_MDEF_PCT = 0.08;
export const CORPO_BLINDADO_CAP_PCT_OF_MDEF = 0.20;
export const JURAMENTO_RESISTENCIA_THRESHOLD = 3;
export const JURAMENTO_RESISTENCIA_DURATION_CUT = 1;
export const NUCLEO_ACO_HP_THRESHOLD = 0.35;
export const NUCLEO_ACO_RATE = 0.0012; // per VIT total
export const NUCLEO_ACO_CAP = 0.05;

// ── Bastião actives ──
export const IRON_WALL_COOLDOWN = 7;
export const IRON_WALL_DURATION = 3;
export const IRON_WALL_DMG_RED_BASE = 0.20;
export const IRON_WALL_DMG_RED_PER_VIT = 0.001;
export const IRON_WALL_DMG_RED_CAP = 0.03;
export const IRON_WALL_DET_GEN_PER_2PCT = 1;
export const IRON_WALL_DET_GEN_CAP_PER_ACTION = 8;

export const COLOSSAL_SHIELD_COST = 25;
export const COLOSSAL_SHIELD_COOLDOWN = 8;
export const COLOSSAL_SHIELD_BASE = 0.10;
export const COLOSSAL_SHIELD_PER_VIT = 0.001;
export const COLOSSAL_SHIELD_CAP = 0.04;
export const COLOSSAL_SHIELD_DURATION = 4;
export const COLOSSAL_SHIELD_CC_NEGATE_CONSUME_PCT = 0.25;

export const LAST_GUARD_HP_THRESHOLD = 0.25;
export const LAST_GUARD_DURATION = 2;
export const LAST_GUARD_POST_BARRIER_BASE = 0.04;
export const LAST_GUARD_POST_BARRIER_PER_VIT = 0.0005;
export const LAST_GUARD_POST_BARRIER_CAP = 0.02;
export const LAST_GUARD_POST_BARRIER_DURATION = 2;

export const COUNTER_STANCE_COST = 25;
export const COUNTER_STANCE_COOLDOWN = 9;
export const COUNTER_STANCE_DURATION = 2;
export const COUNTER_STANCE_STORE_PCT = 0.30;
export const COUNTER_STANCE_CAP_BASE = 0.08;
export const COUNTER_STANCE_CAP_PER_VIT = 0.001;
export const COUNTER_STANCE_CAP_CAP = 0.04;
export const COUNTER_STANCE_RELEASE_STORED_FACTOR = 0.60;
export const COUNTER_STANCE_RELEASE_ATK_FACTOR = 0.75;

export const LIVING_FORTRESS_COST = 50;
export const LIVING_FORTRESS_COOLDOWN = 15;
export const LIVING_FORTRESS_DURATION = 3;
export const LIVING_FORTRESS_DMG_RED_BASE = 0.22;
export const LIVING_FORTRESS_DMG_RED_PER_VIT = 0.001;
export const LIVING_FORTRESS_DMG_RED_CAP = 0.03;
export const LIVING_FORTRESS_MIN_BLOCK_CHANCE = 0.45;
export const LIVING_FORTRESS_SPEED_PENALTY = -0.15;

export const BASTIAO_INQUEBRAVEL_BARRIER_PCT = 0.10;
export const BASTIAO_INQUEBRAVEL_DETERMINATION_GAIN = 40;
export const BASTIAO_INQUEBRAVEL_DMG_REDUCTION_PCT = 0.25;
export const BASTIAO_INQUEBRAVEL_DMG_REDUCTION_ROUNDS = 2;

// ── Investida attribute-node interactions ──
export const FORCA_DE_IMPACTO_HP_THRESHOLD = 0.90;
export const FORCA_DE_IMPACTO_RATE = 0.001; // per FOR total
export const FORCA_DE_IMPACTO_CAP = 0.03;
export const CAVALGADA_MOMENTUM_THRESHOLD = 60;
export const CAVALGADA_RATE = 0.00075; // per FOR total
export const CAVALGADA_CAP = 0.03;

// ── Investida actives ──
export const INVESTIDA_ABILITY_COOLDOWN = 4;
export const INVESTIDA_ABILITY_DMG_MULT = 1.65;
export const INVESTIDA_ABILITY_DMG_MULT_HIGH_HP = 2.00;
export const INVESTIDA_ABILITY_MOMENTUM_GAIN = 25;
export const INVESTIDA_ABILITY_MOMENTUM_GAIN_HIGH_HP = 35;
export const INVESTIDA_ABILITY_HIGH_HP_THRESHOLD = 0.90;

export const ROMPER_FORMACAO_COOLDOWN = 5;
export const ROMPER_FORMACAO_DMG_MULT = 1.70;
export const ROMPER_FORMACAO_DEFPEN_BASE = 0.08;
export const ROMPER_FORMACAO_DEFPEN_PER_MOMENTUM = 0.0008;
export const ROMPER_FORMACAO_DEFPEN_CAP = 0.18;

export const CARGA_IMPLACAVEL_MOMENTUM_MIN = 40;
export const CARGA_IMPLACAVEL_COOLDOWN = 6;
export const CARGA_IMPLACAVEL_DMG_BASE = 1.45;
export const CARGA_IMPLACAVEL_DMG_PER_MOMENTUM = 0.0105;
export const CARGA_IMPLACAVEL_DMG_CAP = 2.85;
export const CARGA_IMPLACAVEL_ABALADO_THRESHOLD = 100;
export const ABALADO_DMG_TAKEN_PCT = 0.08;
export const ABALADO_ROUNDS = 2;

export const GOLPE_DE_RUPTURA_MOMENTUM_MIN = 30;
export const GOLPE_DE_RUPTURA_COOLDOWN = 7;
export const GOLPE_DE_RUPTURA_DMG_MULT = 1.80;
export const GOLPE_DE_RUPTURA_DEFRED_BASE = 0.10;
export const GOLPE_DE_RUPTURA_DEFRED_PER_MOMENTUM = 0.0006;
export const GOLPE_DE_RUPTURA_DEFRED_CAP = 0.18;
export const GOLPE_DE_RUPTURA_DEFRED_ROUNDS = 3;

export const ULTIMA_CARGA_HP_THRESHOLD = 0.30;
export const ULTIMA_CARGA_MOMENTUM_MIN = 40;
export const ULTIMA_CARGA_COOLDOWN = 10;
export const ULTIMA_CARGA_DMG_BASE = 1.80;
export const ULTIMA_CARGA_DMG_PER_MOMENTUM = 0.012;
export const ULTIMA_CARGA_DMG_CAP = 3.45;
export const ULTIMA_CARGA_SELF_DEBUFF_DEF_PCT = -0.15;
export const ULTIMA_CARGA_SELF_DEBUFF_SPEED_PCT = -0.10;
export const ULTIMA_CARGA_SELF_DEBUFF_ROUNDS = 3;

// A hit "grande o suficiente" per Golpe Pesado's own definition (used by
// Peso da Armadura) is a SEPARATE concept from Armadura de Aço's own 15%
// threshold — two different nodes, two different numbers, never merged.
export function isGolpePesado(dmg: number, effMaxHp: number): boolean {
  return dmg / effMaxHp >= PESO_ARMADURA_GOLPE_PESADO_PCT;
}
