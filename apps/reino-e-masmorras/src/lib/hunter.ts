// ── Caçador redesign — ARMADILHAS + RASTRO + BRECHAS ──
// Shared constants/pure math, imported by both DungeonPanel.tsx (the live
// combat engine, session-only refs/state) and any future balance simulator,
// so the two can never drift on a number. Per the spec: traps never persist
// between enemies (cleared on death/dungeon end); Rastro resets per enemy;
// Brechas reset per enemy (they live entirely on the enemy, like Feridas/
// Julgamento).

export function hasSkill(unlockedSkills: string[], nodeId: string): boolean {
  return unlockedSkills.includes(nodeId);
}

// ── ARMADILHAS (traps) ──
export const TRAP_MAX_ARMED_BASE = 2;
export const TRAP_MAX_ARMED_MESTRE_ARMADILHEIRO = 3; // cacador:armadilhas:14
export const PRIMED_TRAP_BONUS_PCT = 0.25;
export const MESTRE_ARMADILHEIRO_NEXT_TRAP_BONUS_PCT = 0.15;
// How long (in envTicks) a just-triggered trap keeps "trapTriggeredRecently"
// true for conditions like Golpe de Misericórdia's own gate.
export const RECENT_TRAP_TRIGGER_WINDOW_TICKS = 2;

// ── Armadilhas attribute-node interactions ──
export const ENGENHARIA_PRECISA_TRAP_DMG_RATE = 0.0008; // per DES total
export const ENGENHARIA_PRECISA_TRAP_DMG_CAP = 0.03;
export const CONHECIMENTO_VENENOS_POISON_RATE = 0.005; // per SAB total
export const CONHECIMENTO_VENENOS_POISON_CAP = 0.10;
export const PASSOS_ARMADILHEIRO_SPEED_UNCONDITIONAL_PCT = 0.015; // no speedPct SkillEffect field exists, so this base slice is applied live too
export const PASSOS_ARMADILHEIRO_SPEED_RATE = 0.0008; // per AGI total, while >=1 trap armed
export const PASSOS_ARMADILHEIRO_SPEED_CAP = 0.02;
export const MAO_DO_ARMEIRO_NEXT_SHOT_RATE = 0.0008; // per DES total, while >=1 trap armed
export const MAO_DO_ARMEIRO_NEXT_SHOT_CAP = 0.03;
export const SOBREVIVENCIA_CAMPO_DMG_REDUCTION_RATE = 0.0008; // per VIT total, while >=1 trap armed
export const SOBREVIVENCIA_CAMPO_DMG_REDUCTION_CAP = 0.03;
export const MECANICA_REFINADA_TRAP_DMG_RATE = 0.001; // per DES total — separate cap from Engenharia Precisa
export const MECANICA_REFINADA_TRAP_DMG_CAP = 0.04;
// Armadilheiro Adaptável (cacador:armadilhas:8).
export const DESORIENTADO_ACCURACY_PCT = -0.08;
export const DESORIENTADO_ACCURACY_PCT_MARKED = -0.12;
export const DESORIENTADO_ROUNDS = 2;
export const PACIENCIA_DA_CACA_EVASION_RATE = 0.0008; // per AGI total, while >=1 trap armed
export const PACIENCIA_DA_CACA_EVASION_CAP = 0.03;

// ── Armadilha de Veneno (cacador:armadilhas:4) ──
export const ARMADILHA_VENENO_COOLDOWN = 4;
export const ARMADILHA_VENENO_DIRECT_DMG_MULT = 0.85;
export const ARMADILHA_VENENO_POISON_ROUNDS = 3;
export const ARMADILHA_VENENO_POISON_DMG_MULT_PER_TICK = 0.22;

// ── Tiro Envenenado (cacador:armadilhas:9) ──
export const TIRO_ENVENENADO_COOLDOWN = 4;
export const TIRO_ENVENENADO_DMG_MULT = 1.45;
export const TIRO_ENVENENADO_FALLBACK_POISON_ROUNDS = 2;
export const TIRO_ENVENENADO_FALLBACK_POISON_DMG_MULT_PER_TICK = 0.15;

// ── Armadilha Mortal (cacador:armadilhas:10) ──
export const ARMADILHA_MORTAL_COOLDOWN = 7;
export const ARMADILHA_MORTAL_DIRECT_DMG_MULT = 1.65;
export const ARMADILHA_MORTAL_DIRECT_DMG_MULT_MARKED = 1.85;
export const ARMADILHA_MORTAL_ATK_DEBUFF_PCT = -0.12;
export const ARMADILHA_MORTAL_ATK_DEBUFF_ROUNDS = 2;

// ── Golpe de Misericórdia (cacador:armadilhas:12) ──
export const GOLPE_MISERICORDIA_COOLDOWN = 5;
export const GOLPE_MISERICORDIA_DMG_MULT = 2.10;
export const GOLPE_MISERICORDIA_DMG_MULT_VS_POISON = 2.30;

// ── Execução da Presa (cacador:armadilhas:13) ──
export const EXECUCAO_PRESA_COOLDOWN = 8;
export const EXECUCAO_PRESA_HP_THRESHOLD = 0.25;
export const EXECUCAO_PRESA_BASE_MULT = 2.50;
export const EXECUCAO_PRESA_PER_TRAP_MULT = 0.12;
export const EXECUCAO_PRESA_MAX_TRAPS_COUNTED = 3;
export const EXECUCAO_PRESA_MARKED_BONUS_MULT = 0.20;

// ── RASTRO ──
export const TRAIL_MAX = 5;
export const TRAIL_GAIN_PER_ACTION = 1;
export const MEMORIA_DA_TRILHA_FIRST_ACTION_BONUS = 1; // on top of the normal +1 (total +2)
export const MARKED_PREY_THRESHOLD = 3;

// ── Rastreio attribute-node interactions ──
export const OLHOS_RASTREADOR_ACCURACY_RATE = 0.0008; // per DES, vs Presa Marcada
export const OLHOS_RASTREADOR_ACCURACY_CAP = 0.02;
export const PASSOS_SILENCIOSOS_EVASION_RATE = 0.0008; // per AGI, vs Presa Marcada
export const PASSOS_SILENCIOSOS_EVASION_CAP = 0.02;
export const LEITURA_MOVIMENTO_DMG_REDUCTION_RATE = 0.0008; // per AGI, Rastro=5
export const LEITURA_MOVIMENTO_DMG_REDUCTION_CAP = 0.03;
export const MIRA_PERSEGUICAO_ACCURACY_RATE = 0.001; // per DES, vs Presa Marcada
export const MIRA_PERSEGUICAO_ACCURACY_CAP = 0.025;
// Presa Marcada (cacador:rastreio:6).
export const PRESA_MARCADA_DMG_BONUS_PCT = 0.04;
export const PRESA_MARCADA_ACCURACY_BONUS_PCT = 0.04;
export const PRESA_MARCADA_TRAP_DMG_BONUS_PCT = 0.04;
export const FOLEGO_PERSEGUICAO_SPEED_BASE = 0.02; // Rastro=5
export const FOLEGO_PERSEGUICAO_SPEED_RATE = 0.0008; // per AGI
export const FOLEGO_PERSEGUICAO_SPEED_CAP = 0.02;
// Instinto de Fuga (cacador:rastreio:8).
export const INSTINTO_FUGA_DMG_BONUS_PCT = 0.12;
export const INSTINTO_FUGA_WINDOW_TICKS = 2;
export const LEITURA_COMPLETA_CRIT_RATE = 0.001; // per SOR, Rastro=5
export const LEITURA_COMPLETA_CRIT_CAP = 0.03;

// ── Sumir na Mata (cacador:rastreio:4) ──
export const SUMIR_NA_MATA_COOLDOWN = 6;
export const SUMIR_NA_MATA_DURATION = 2;
export const SUMIR_NA_MATA_EVASION_PCT = 0.15;
export const SUMIR_NA_MATA_TRAIL_GAIN = 2;

// ── Armadilha de Ferro (cacador:rastreio:9) ──
export const ARMADILHA_FERRO_COOLDOWN = 5;
export const ARMADILHA_FERRO_DIRECT_DMG_MULT = 1.00;
export const ARMADILHA_FERRO_DEF_DEBUFF_PCT = -0.12;
export const ARMADILHA_FERRO_DEF_DEBUFF_PCT_MARKED = -0.16;
export const ARMADILHA_FERRO_DEF_DEBUFF_ROUNDS = 3;
export const ARMADILHA_FERRO_TRAIL_GAIN = 2;
export const ARMADILHA_FERRO_TRAIL_GAIN_MARKED = 1;

// ── Passo Etéreo (cacador:rastreio:10) ──
export const PASSO_ETEREO_HP_THRESHOLD = 0.45;
export const PASSO_ETEREO_COOLDOWN = 10;
export const PASSO_ETEREO_DURATION = 2;
export const PASSO_ETEREO_EVASION_PCT = 0.25;
export const PASSO_ETEREO_TRAIL_GAIN = 1;
export const PASSO_ETEREO_TRAIL_GAIN_ON_MISS = 1;

// ── Manto das Sombras (cacador:rastreio:12) ──
export const MANTO_SOMBRAS_COOLDOWN = 10;
export const MANTO_SOMBRAS_DURATION = 3;
export const MANTO_SOMBRAS_EVASION_PCT = 0.20;
export const MANTO_SOMBRAS_MAX_BREACHES_PER_CAST = 2;

// ── Um com a Caça (cacador:rastreio:13) ──
export const UM_COM_CACA_COOLDOWN = 12;
export const UM_COM_CACA_DURATION = 4;
export const UM_COM_CACA_DMG_PCT = 0.08;
export const UM_COM_CACA_SPEED_PCT = 0.08;
export const UM_COM_CACA_EVASION_PCT = 0.12;

// Predador Paciente (cacador:rastreio:14).
export const PREDADOR_PACIENTE_HITS_PER_CDR = 3;

// ── BRECHAS ──
export const BREACH_MAX = 3;
export const BREACH_DURATION_TICKS = 4;

// ── Precisão da Caça attribute-node interactions ──
export const MIRA_CIRURGICA_ACCURACY_RATE = 0.0008; // per DES, target has >=1 breach
export const MIRA_CIRURGICA_ACCURACY_CAP = 0.02;
export const CONTROLE_RECUO_BREACH_CONSUME_DMG_RATE = 0.00075; // per DES, abilities that consume breaches
export const CONTROLE_RECUO_BREACH_CONSUME_DMG_CAP = 0.03;
export const PULSO_FRIO_CRIT_RATE = 0.0008; // per SOR, target has >=1 breach
export const PULSO_FRIO_CRIT_CAP = 0.02;
export const LEITURA_BALISTICA_CRIT_DMG_BONUS_AT_3_BREACHES = 0.05;
export const MUNICAO_SELECIONADA_CRIT_DMG_RATE = 0.001; // per SOR, vs Presa Marcada
export const MUNICAO_SELECIONADA_CRIT_DMG_CAP = 0.03;
export const RITMO_ABATE_SPEED_UNCONDITIONAL_PCT = 0.015; // no speedPct SkillEffect field exists, so this base slice is applied live too
export const RITMO_ABATE_SPEED_RATE = 0.0008; // per AGI, target has >=1 breach
export const RITMO_ABATE_SPEED_CAP = 0.02;
// Ponto Fraco (cacador:precisao-caca:8) — per breach stack.
export const PONTO_FRACO_ACCURACY_PER_BREACH = 0.01;
export const PONTO_FRACO_CRIT_DMG_PER_BREACH = 0.02;
// Abrir a Guarda (cacador:precisao-caca:6).
export const ABRIR_A_GUARDA_CRITS_PER_BREACH = 2;

// ── Disparo Preciso (cacador:precisao-caca:4) ──
export const DISPARO_PRECISO_COOLDOWN = 4;
export const DISPARO_PRECISO_DMG_MULT = 1.30;

// ── Tiro Duplo (cacador:precisao-caca:9) ──
export const TIRO_DUPLO_COOLDOWN = 4;
export const TIRO_DUPLO_HIT_COUNT = 2;
export const TIRO_DUPLO_DMG_MULT_PER_HIT = 0.80;
export const TIRO_DUPLO_SECOND_HIT_BONUS_PCT_MARKED = 0.15;

// ── Abate (cacador:precisao-caca:10) ──
export const ABATE_HP_THRESHOLD = 0.40;
export const ABATE_COOLDOWN = 5;
export const ABATE_DMG_MULT = 2.05;
export const ABATE_DEFPEN_PCT = 0.10;
export const ABATE_DEFPEN_PCT_MARKED = 0.15;

// Foco do Carrasco (cacador:precisao-caca:11).
export const FOCO_CARRASCO_HP_THRESHOLD = 0.30;
export const FOCO_CARRASCO_CRIT_RATE = 0.001; // per SOR
export const FOCO_CARRASCO_CRIT_CAP = 0.03;

// ── Disparo Mortal (cacador:precisao-caca:12) ──
export const DISPARO_MORTAL_BREACH_MIN = 2;
export const DISPARO_MORTAL_COOLDOWN = 7;
export const DISPARO_MORTAL_DMG_MULT = 1.80;
export const DISPARO_MORTAL_BREACH_COST = 2;
export const DISPARO_MORTAL_CRIT_DMG_BONUS_MARKED = 0.15;

// ── Caça Perfeita (cacador:precisao-caca:13) ──
export const CACA_PERFEITA_HP_THRESHOLD = 0.25;
export const CACA_PERFEITA_BREACH_REQUIRED = 3;
export const CACA_PERFEITA_COOLDOWN = 9;
export const CACA_PERFEITA_DMG_MULT = 2.75;
export const CACA_PERFEITA_DMG_MULT_TRAIL_5 = 3.05;
export const CACA_PERFEITA_DEFPEN_PCT = 0.12;

// Janela Perfeita (cacador:precisao-caca:14).
export const JANELA_PERFEITA_DMG_BONUS_PCT = 0.08;
export const JANELA_PERFEITA_SPEED_BONUS_PCT = 0.10;
export const JANELA_PERFEITA_SPEED_ROUNDS = 2;
