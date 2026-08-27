import { CSSProperties, useEffect, useRef, useState } from 'react';
import {
  AbilityDef, Character, CrowdControlKind, EnemyAbility, EnemyInstance, DungeonDef, ItemSlot,
  Rarity, StatModStat, StatusEffectKind,
} from '../types/game';
import { spawnEnemy, enemySpeedMult } from '../lib/enemies';
import { CLASS_SPEED_MULT, CLASSES, grantXp, MAGICAL_CLASSES } from '../lib/classes';
import { computeCombatStats, effectiveMaxHp, BASE_CRIT_DMG_MULT } from '../lib/combatStats';
import { baseDropChanceForLevel, generateItem, pickBossDropRarity, rarityColor, rarityName, sellValue } from '../lib/equipment';
import { difficultyProgress } from '../lib/dungeons';
import { RUNE_DROP_CHANCE_REGULAR, RUNE_DROP_CHANCE_BOSS, rollRuneDrop, addRune } from '../lib/runes';
import { itemDisplayName } from '../lib/enhancement';
import { OFFHAND_KIND } from '../lib/itemTiers';
import { canFitInInventory, placeInInventory } from '../lib/inventoryGrid';
import { computeSkillBonuses, getEquippedAbilities } from '../lib/skills';
import { HEAT_AFTER_OVERHEAT, HEAT_OVERHEAT_AT, ThermalState, advanceThermal, circuitAfterCast, circuitPulseMult, fireDamageBonus, nextRunes, thermalAfterFrozenEnds, thermalAfterShatter, thermalShatterMult } from '../lib/mago';
import { DECOMPOSITION_MAX, EnemyStackInstance, PeriodicEffectInstance, PLAGUE_EFFECT_ID, SOUL_MAX, SummonInstance, advanceSummonClock, applyEnemyStack, clampResource, makeBoneServant, plagueTickDamage, reaperExecuteMultiplier, soulsForCrossedThresholds, soulsForNextEnemy } from '../lib/necromancer';
import {
  ROGUE_AMBUSH_ACCURACY, ROGUE_AMBUSH_CRIT,
  ROGUE_AMBUSH_DEF_PEN, ROGUE_EXPOSED_MAIN_LIMIT, ROGUE_IMAGE_MAX,
  ROGUE_STEALTH_MAIN_LIMIT, ROGUE_TIME_STEAL_DELAY, RoguePreparedTrick,
  advantageAccuracy, clampImages, firstEligibleQuick, imageEchoCoefficient,
  loadedDieResult, prepareTrick,
} from '../lib/rogue';
import {
  PaladinAegis, PaladinLiturgyState, PaladinVerdictSnapshot, PaladinVirtue,
  advancePaladinLiturgy, consumePaladinVerdict, createPaladinAegis,
  createPaladinLiturgyState, invokePaladinVirtue, paladinActiveHealAmount,
  paladinAegisAttributeCapBonus, paladinAegisReduction, paladinConviction,
  paladinRadiantBonusPct,
} from '../lib/paladin';
import {
  ArcherCombatState, advanceArcherReflex, alignInFlightArrows,
  archerDistanceLabel, archerDistanceShift,
  consumeArcherReflex, consumeArcherSteps, consumePerfectRhythm, createArcherCombatState,
  flightSnapshotFromAbility, gainArcherCadence, gainArcherSteps, gainArcherTension,
  loseArcherCadence, loseArcherTension, prepareArcherReflex, scheduleInFlightArrows,
  tensionForPreciseHit, accelerateOldestArrow,
} from '../lib/archer';
import { DruidCycleState, GardenUnit, createDruidCycle, advanceDruidSeason, markDruidAttunement, addDruidDissonance, pickDruidSeasonalAbility, growGarden, addGardenSeeds, matureGarden, consumeGardenFruit, activateAvatar, consumeDruidRenewal, consumeDruidReequilibrium } from '../lib/druid';
import { WarlockPlayerState, WarlockEnemyNameState, createWarlockPlayerState, createWarlockEnemyNameState, projectWarlockCast, applyWarlockDebt, payWarlockDebt, setWarlockDebt, grantWarlockCredit, consumeTrueName, consumeTrueNameAndRefragment, bindWarlockEnemy, addNameFragment, consumeMandamento, resolveCollection, borrowedPowerPct, overcontractDamagePct, collectionAmount } from '../lib/warlock';
import {
  GUARD_BREAK_ACCURACY_BONUS, GUARD_BREAK_ACTIONS, GUARD_BREAK_DEF_PEN,
  GUARD_BREAK_MAX_ACTIONS, GUARD_BREAK_RESET, GUARD_BREAK_RESET_VANGUARD,
  GUARD_BREAK_TICKS, POSTURE_BASIC_DAMAGE, POSTURE_MAX, PreparedGuardState,
  ReadingKind, RiposteKind, WarriorEnemyState, applyPostureDamage, bandValue,
  createWarriorEnemyState, crossesLowerBand, duelPostureDamage, parryReduction,
  postureBand, recoverPosture,
} from '../lib/warrior';
import {
  FURY_MAX, FURY_MIN, FURY_GAIN_BASIC_HIT, FURY_GAIN_BASIC_HIT_SANGUE_QUENTE, FURY_GAIN_ABILITY_HIT,
  FURY_GAIN_CRIT_BONUS, FURY_GAIN_TAKE_DAMAGE, FURY_GAIN_TAKE_DAMAGE_SANGUE_QUENTE, FURY_GAIN_PAIN_TICK,
  FURY_GAIN_WALL_HIT_TAKEN, FURY_GAIN_PREDADOR_SUPREMO, FRENZY_DRAIN_PER_ACTION, FRENZY_DRAIN_PER_ACTION_IMPARAVEL,
  FRENZY_DMG_BONUS, FRENZY_DMG_BONUS_SEM_FREIOS, FRENZY_SPEED_BONUS, FRENZY_DMG_TAKEN_BONUS,
  WOUND_MAX_STACKS, WOUND_TICK_DURATION, WOUND_DMG_PCT_PER_STACK, WOUND_DMG_PCT_PER_STACK_MUSCULO_RASGADOR,
  WOUND_CRIT_PCT_PER_STACK, WOUND_ACCURACY_PCT_PER_STACK,
  PREDADOR_SUPREMO_DMG_BONUS, PAIN_MAX_PCT, PAIN_TICKS, PAIN_TICKS_INQUEBRAVEL,
  PAIN_PASSIVE_REDIRECT_PCT, PAIN_TICK_REDUCTION_LOW_HP_PCT, PAIN_TICK_REDUCTION_LOW_HP_THRESHOLD,
  FURY_INTERACTION_THRESHOLD, POSTURA_BASE_REDIRECT_PCT, INQUEBRAVEL_PAIN_CAP_BONUS,
  FURIA_FORCA_FURIOSA_RATE, FURIA_FORCA_FURIOSA_CAP, FURIA_CORACAO_DE_GUERRA_RATE, FURIA_CORACAO_DE_GUERRA_CAP,
  FURIA_OLHO_DE_SANGUE_RATE, FURIA_OLHO_DE_SANGUE_CAP, FURIA_PRESSAO_CRESCENTE_PER_25_FURY,
  FURIA_CORPO_EM_FRENESI_RATE, FURIA_CORPO_EM_FRENESI_CAP, FURIA_GOLPE_DEVASTADOR_RATE, FURIA_GOLPE_DEVASTADOR_CAP,
  FURIA_FORCA_SEM_LIMITE_MIN_FURY_COST, FURIA_FORCA_SEM_LIMITE_RATE, FURIA_FORCA_SEM_LIMITE_CAP,
  RESISTENCIA_PELE_ENDURECIDA_RATE, RESISTENCIA_PELE_ENDURECIDA_CAP,
  RESISTENCIA_ESPIRITO_INDOMAVEL_RATE, RESISTENCIA_ESPIRITO_INDOMAVEL_CAP,
  RESISTENCIA_CORPO_DURO_HIT_THRESHOLD_PCT, RESISTENCIA_CORPO_DURO_RATE, RESISTENCIA_CORPO_DURO_CAP,
  RESISTENCIA_CONSTITUICAO_PAIN_THRESHOLD_PCT, RESISTENCIA_CONSTITUICAO_RATE, RESISTENCIA_CONSTITUICAO_CAP,
  RESISTENCIA_OSSOS_FORTES_RATE, RESISTENCIA_OSSOS_FORTES_CAP,
  RESISTENCIA_VIGOR_DOLOROSO_RATE, RESISTENCIA_VIGOR_DOLOROSO_CAP,
  RESISTENCIA_CORACAO_SELVAGEM_HP_THRESHOLD, RESISTENCIA_CORACAO_SELVAGEM_RATE, RESISTENCIA_CORACAO_SELVAGEM_CAP,
  POSTURA_VIT_RATE, POSTURA_VIT_CAP,
  FOME_SANGUINARIA_BASE_PCT, FOME_SANGUINARIA_VIT_RATE, FOME_SANGUINARIA_VIT_CAP,
  MURALHA_BASE_DMG_TAKEN_PCT, MURALHA_VIT_RATE, MURALHA_VIT_CAP,
  RESISTENCIA_ABSOLUTA_BASE_PCT, RESISTENCIA_ABSOLUTA_VIT_RATE, RESISTENCIA_ABSOLUTA_VIT_CAP,
  SELVAGERIA_OLHAR_PREDADOR_RATE, SELVAGERIA_OLHAR_PREDADOR_CAP,
  SELVAGERIA_FORCA_DA_CACA_RATE, SELVAGERIA_FORCA_DA_CACA_CAP,
  SANGUE_DE_CACA_MIN_WOUNDS, SANGUE_DE_CACA_BASE_HEAL_PCT, SANGUE_DE_CACA_VIT_RATE, SANGUE_DE_CACA_VIT_CAP,
  SELVAGERIA_MAO_PESADA_RATE, SELVAGERIA_MAO_PESADA_CAP,
  SELVAGERIA_INSTINTO_MORTAL_RATE, SELVAGERIA_INSTINTO_MORTAL_CAP,
  capped, attrTotal,
  hasSkill, evalAbilityCondition, PainPacket, AbilityConditionContext,
} from '../lib/barbarian';
import {
  FAITH_MAX, FAITH_MIN, FAITH_START_FIRST_ENEMY, nextFaithForNewEnemy,
  MAOS_CONSAGRADAS_HEAL_EFFICIENCY_PCT,
  BARRIER_FAITH_THRESHOLD_PCT, JUDGMENT_FAITH_MILESTONES, isDevotionAbilityId,
  GRACE_BASE_CONVERSION_PCT, GRACE_DIVINA_CONVERSION_PCT, GRACE_BASE_CAP_PCT, GRACE_DIVINA_CAP_PCT,
  GRACE_BASE_DURATION_TICKS, GRACE_DIVINA_DURATION_TICKS, GRACE_FOLEGO_VIT_RATE, GRACE_FOLEGO_VIT_CAP,
  GRACE_CORACAO_DEVOTO_HP_THRESHOLD, GRACE_CORACAO_DEVOTO_BONUS_PCT,
  SANTUARIO_VIVO_MAX_ROUNDS_BONUS, SANTUARIO_VIVO_BURST_THRESHOLD_PCT, SANTUARIO_VIVO_BURST_REDUCTION_PCT,
  SOLO_CONSAGRADO_MDEF_BONUS, SOLO_CONSAGRADO_TENACITY_BONUS, SOLO_CONSAGRADO_FIRST_NEGATIVE_DURATION_CUT,
  VIGILIA_FIRST_DOT_TICK_REDUCTION_PCT, INTERCESSAO_HEAL_PCT, FE_VIGILANTE_EXTEND_ROUNDS,
  BARREIRA_RITUAL_EFFICIENCY_BONUS, GUARDA_DA_ALMA_SHIELD_DEF_PCT,
  COURACA_ESPIRITUAL_CONSECRATION_MDEF_PCT,
  ANCORA_SAGRADA_WINDOW_TICKS, ANCORA_SAGRADA_NEXT_HIT_REDUCTION_PCT,
  VOTO_PROTECAO_BASE_DMG_REDUCTION_PCT, VOTO_PROTECAO_DMG_REDUCTION_CAP_PCT,
  VOTO_PROTECAO_TENACITY_BONUS_PCT, MARTELO_DA_FE_SUPPORT_FACTOR,
  MURALHA_DIVINA_SHIELD_CAP_PCT, MURALHA_DIVINA_CONSECRATION_ROUNDS, MURALHA_DIVINA_DMG_TAKEN_PCT,
  JUDGMENT_MAX_STACKS, JUDGMENT_BASE_DURATION_TICKS, JUDGMENT_CONVICCAO_DURATION_TICKS, JUDGMENT_DMG_PCT_PER_STACK,
  FOGO_DA_FE_DMG_VS_JUDGMENT_PCT, OLHAR_DO_JUIZ_HIGH_JUDGMENT_THRESHOLD, OLHAR_DO_JUIZ_HIGH_JUDGMENT_ACCURACY_PCT,
  PALAVRA_ARDENTE_DMG_PCT, ZELO_INFLEXIVEL_EXTEND_ROUNDS, VEREDITO_PRECISO_ACCURACY_PER_STACK,
  PURIFICACAO_DIVINA_JUDGMENT_PER_2_CLEANSED, PURIFICACAO_DIVINA_JUDGMENT_CAP,
  SABEDORIA_JULGAMENTO_MIN_CONSUMED, SABEDORIA_JULGAMENTO_HEAL_PCT,
  JUIZO_FINAL_MATK_BUFF_PCT, JUIZO_FINAL_MATK_BUFF_ROUNDS, APOCALIPSE_SAGRADO_REQUIRED_JUDGMENT,
  SABEDORIA_COMPASSIVA_HP_THRESHOLD, SABEDORIA_COMPASSIVA_HEAL_EFFICIENCY_PCT,
  PRECE_SERENA_CDR_PCT, LITURGIA_CONTINUA_CDR_PCT, LITURGIA_CONTINUA_CDR_BOOSTED_PCT, LITURGIA_CONTINUA_FAITH_THRESHOLD,
  VEU_DA_ALMA_HEAL_EFFICIENCY_PCT, MISERICORDIA_ATIVA_DOT_REDUCTION_TICKS,
  BarrierPortion, clericBaseHp, clericDirectHealAmount, clericPassiveHealAmount, significantHealAmount,
} from '../lib/clerigo';
import {
  DETERMINATION_MAX, DETERMINATION_GEN_BLOCK, DETERMINATION_GEN_BLOCK_GUARDA_ELEVADA,
  DETERMINATION_GEN_BARRIER_PER_3PCT, DETERMINATION_GEN_BARRIER_CAP_PER_ACTION,
  RETALIATION_MAX_CHARGES, RETALIATION_BLOCKS_PER_CHARGE, RETALIATION_DEF_FACTOR, RETALIATION_ATK_FACTOR,
  MOMENTUM_MAX_BASE, MOMENTUM_GAIN_FIRST_HIT, MOMENTUM_GAIN_NEXT_HIT, MOMENTUM_GAIN_FIRST_HIT_PASSO_DE_GUERRA_BONUS,
  MOMENTUM_LOSS_HEAVY_HIT_PCT_BASE, MOMENTUM_LOSS_AMOUNT_BASE,
  SANGUE_DE_COMBATE_THRESHOLD_RATE, SANGUE_DE_COMBATE_THRESHOLD_CAP,
  INSTINTO_SOBREVIVENCIA_VIT_DIVISOR, INSTINTO_SOBREVIVENCIA_LOSS_REDUCTION_CAP, MOMENTUM_LOSS_MIN,
  MOMENTUM_BONUS_DMG_PER_20_BASE, MOMENTUM_BONUS_SPEED_PER_20_BASE,
  MOMENTUM_BONUS_DMG_PER_20_UPGRADED, MOMENTUM_BONUS_SPEED_PER_20_UPGRADED,
  MOMENTUM_MAX_VETERANO_BONUS, SEDE_DE_VITORIA_HEAL_PCT, SEDE_DE_VITORIA_MOMENTUM_CARRY_CAP,
  IMPARAVEL_HITS_PER_MAX_BONUS, IMPARAVEL_MAX_BONUS_PER_TRIGGER, IMPARAVEL_MAX_BONUS_CAP_PER_ENEMY,
  IMPARAVEL_HIGH_MOMENTUM_PCT_THRESHOLD, IMPARAVEL_HIGH_MOMENTUM_DMG_BONUS, IMPARAVEL_HIGH_MOMENTUM_TENACITY_BONUS,
  PRESSAO_CONSTANTE_PER_STACK, PRESSAO_CONSTANTE_MAX_STACKS,
  ORDERS_MAX, COMMAND_POTENCY_COEF_BASE, COMMAND_POTENCY_COEF_VOZ_DE_COMANDO, commandPotency,
  PRESENCA_LIDER_VIT_THRESHOLD, PRESENCA_LIDER_DURATION_BONUS,
  ESTRATEGIA_DE_CAMPO_SAB_THRESHOLD, ESTRATEGIA_DE_CAMPO_DURATION_BONUS, COMANDO_BUFF_DURATION_BONUS_COMBINED_CAP,
  DISCIPLINA_MILITAR_TENACITY_RATE, DISCIPLINA_MILITAR_TENACITY_CAP,
  ESTRATEGIA_CDR_RATE, ESTRATEGIA_CDR_CAP, FORMACAO_DEF_RATE, FORMACAO_DEF_CAP, DISCIPLINA_INABALAVEL_THRESHOLD,
  ORDEM_ATAQUE_DMG_MULT_SUPREME, ORDEM_ATAQUE_ATK_BUFF_SUPREME,
  ORDEM_AVANCAR_DMG_MULT_SUPREME, ORDEM_AVANCAR_SPEED_BUFF_SUPREME, ORDEM_AVANCAR_DMG_BUFF_SUPREME,
  ORDEM_RESISTIR_SHIELD_BASE_SUPREME, ORDEM_RESISTIR_SHIELD_CAP_SUPREME, ORDEM_RESISTIR_DMG_RED_SUPREME,
  ESTANDARTE_ATK_SUPREME, ESTANDARTE_DEF_SUPREME, ESTANDARTE_TENACITY_SUPREME, ESTANDARTE_DURATION,
  ARMADURA_ACO_HEAVY_HIT_PCT, ARMADURA_ACO_RATE, ARMADURA_ACO_CAP,
  PULSO_VITAL_BARRIER_EFF_RATE, PULSO_VITAL_BARRIER_EFF_CAP,
  PESO_ARMADURA_RATE, PESO_ARMADURA_CAP,
  ESCUDO_DISCIPLINADO_WINDOW_TICKS, ESCUDO_DISCIPLINADO_REDUCTION_PCT,
  CORPO_BLINDADO_DEF_TO_MDEF_PCT, CORPO_BLINDADO_CAP_PCT_OF_MDEF,
  JURAMENTO_RESISTENCIA_THRESHOLD, JURAMENTO_RESISTENCIA_DURATION_CUT,
  NUCLEO_ACO_HP_THRESHOLD, NUCLEO_ACO_RATE, NUCLEO_ACO_CAP,
  IRON_WALL_DMG_RED_BASE, IRON_WALL_DMG_RED_CAP, IRON_WALL_DET_GEN_PER_2PCT, IRON_WALL_DET_GEN_CAP_PER_ACTION,
  LIVING_FORTRESS_DMG_RED_BASE, LIVING_FORTRESS_DMG_RED_CAP, LIVING_FORTRESS_SPEED_PENALTY, LIVING_FORTRESS_MIN_BLOCK_CHANCE,
  COLOSSAL_SHIELD_CC_NEGATE_CONSUME_PCT,
  LAST_GUARD_POST_BARRIER_BASE, LAST_GUARD_POST_BARRIER_PER_VIT, LAST_GUARD_POST_BARRIER_CAP,
  COUNTER_STANCE_CAP_BASE, COUNTER_STANCE_CAP_PER_VIT, COUNTER_STANCE_CAP_CAP, COUNTER_STANCE_STORE_PCT,
  COUNTER_STANCE_RELEASE_STORED_FACTOR, COUNTER_STANCE_RELEASE_ATK_FACTOR,
  BASTIAO_INQUEBRAVEL_BARRIER_PCT, BASTIAO_INQUEBRAVEL_DETERMINATION_GAIN,
  BASTIAO_INQUEBRAVEL_DMG_REDUCTION_PCT, BASTIAO_INQUEBRAVEL_DMG_REDUCTION_ROUNDS,
  FORCA_DE_IMPACTO_HP_THRESHOLD, FORCA_DE_IMPACTO_RATE, FORCA_DE_IMPACTO_CAP,
  CAVALGADA_MOMENTUM_THRESHOLD, CAVALGADA_RATE, CAVALGADA_CAP,
  CARGA_IMPLACAVEL_DMG_CAP, ULTIMA_CARGA_DMG_CAP, INVESTIDA_ABILITY_HIGH_HP_THRESHOLD,
  ABALADO_DMG_TAKEN_PCT, ABALADO_ROUNDS,
  isGolpePesado,
} from '../lib/knight';
import {
  TRAP_MAX_ARMED_BASE, TRAP_MAX_ARMED_MESTRE_ARMADILHEIRO, PRIMED_TRAP_BONUS_PCT, MESTRE_ARMADILHEIRO_NEXT_TRAP_BONUS_PCT,
  RECENT_TRAP_TRIGGER_WINDOW_TICKS,
  ENGENHARIA_PRECISA_TRAP_DMG_RATE, ENGENHARIA_PRECISA_TRAP_DMG_CAP,
  CONHECIMENTO_VENENOS_POISON_RATE, CONHECIMENTO_VENENOS_POISON_CAP,
  PASSOS_ARMADILHEIRO_SPEED_UNCONDITIONAL_PCT, PASSOS_ARMADILHEIRO_SPEED_RATE, PASSOS_ARMADILHEIRO_SPEED_CAP,
  MAO_DO_ARMEIRO_NEXT_SHOT_RATE, MAO_DO_ARMEIRO_NEXT_SHOT_CAP,
  SOBREVIVENCIA_CAMPO_DMG_REDUCTION_RATE, SOBREVIVENCIA_CAMPO_DMG_REDUCTION_CAP,
  MECANICA_REFINADA_TRAP_DMG_RATE, MECANICA_REFINADA_TRAP_DMG_CAP,
  DESORIENTADO_ACCURACY_PCT, DESORIENTADO_ACCURACY_PCT_MARKED, DESORIENTADO_ROUNDS,
  PACIENCIA_DA_CACA_EVASION_RATE, PACIENCIA_DA_CACA_EVASION_CAP,
  TIRO_ENVENENADO_FALLBACK_POISON_ROUNDS, TIRO_ENVENENADO_FALLBACK_POISON_DMG_MULT_PER_TICK,
  GOLPE_MISERICORDIA_DMG_MULT_VS_POISON,
  EXECUCAO_PRESA_PER_TRAP_MULT, EXECUCAO_PRESA_MAX_TRAPS_COUNTED, EXECUCAO_PRESA_MARKED_BONUS_MULT,
  TRAIL_MAX, TRAIL_GAIN_PER_ACTION, MEMORIA_DA_TRILHA_FIRST_ACTION_BONUS, MARKED_PREY_THRESHOLD,
  OLHOS_RASTREADOR_ACCURACY_RATE, OLHOS_RASTREADOR_ACCURACY_CAP,
  PASSOS_SILENCIOSOS_EVASION_RATE, PASSOS_SILENCIOSOS_EVASION_CAP,
  LEITURA_MOVIMENTO_DMG_REDUCTION_RATE, LEITURA_MOVIMENTO_DMG_REDUCTION_CAP,
  MIRA_PERSEGUICAO_ACCURACY_RATE, MIRA_PERSEGUICAO_ACCURACY_CAP,
  PRESA_MARCADA_DMG_BONUS_PCT, PRESA_MARCADA_ACCURACY_BONUS_PCT, PRESA_MARCADA_TRAP_DMG_BONUS_PCT,
  FOLEGO_PERSEGUICAO_SPEED_BASE, FOLEGO_PERSEGUICAO_SPEED_RATE, FOLEGO_PERSEGUICAO_SPEED_CAP,
  INSTINTO_FUGA_DMG_BONUS_PCT, INSTINTO_FUGA_WINDOW_TICKS,
  LEITURA_COMPLETA_CRIT_RATE, LEITURA_COMPLETA_CRIT_CAP,
  SUMIR_NA_MATA_TRAIL_GAIN,
  PASSO_ETEREO_TRAIL_GAIN, PASSO_ETEREO_TRAIL_GAIN_ON_MISS,
  MANTO_SOMBRAS_MAX_BREACHES_PER_CAST,
  PREDADOR_PACIENTE_HITS_PER_CDR,
  BREACH_MAX, BREACH_DURATION_TICKS,
  MIRA_CIRURGICA_ACCURACY_RATE, MIRA_CIRURGICA_ACCURACY_CAP,
  CONTROLE_RECUO_BREACH_CONSUME_DMG_RATE, CONTROLE_RECUO_BREACH_CONSUME_DMG_CAP,
  PULSO_FRIO_CRIT_RATE, PULSO_FRIO_CRIT_CAP,
  LEITURA_BALISTICA_CRIT_DMG_BONUS_AT_3_BREACHES,
  MUNICAO_SELECIONADA_CRIT_DMG_RATE, MUNICAO_SELECIONADA_CRIT_DMG_CAP,
  RITMO_ABATE_SPEED_UNCONDITIONAL_PCT, RITMO_ABATE_SPEED_RATE, RITMO_ABATE_SPEED_CAP,
  PONTO_FRACO_ACCURACY_PER_BREACH, PONTO_FRACO_CRIT_DMG_PER_BREACH,
  ABRIR_A_GUARDA_CRITS_PER_BREACH,
  TIRO_DUPLO_SECOND_HIT_BONUS_PCT_MARKED,
  ABATE_DEFPEN_PCT_MARKED,
  FOCO_CARRASCO_HP_THRESHOLD, FOCO_CARRASCO_CRIT_RATE, FOCO_CARRASCO_CRIT_CAP,
  DISPARO_MORTAL_CRIT_DMG_BONUS_MARKED,
  CACA_PERFEITA_DMG_MULT_TRAIL_5,
  JANELA_PERFEITA_DMG_BONUS_PCT, JANELA_PERFEITA_SPEED_BONUS_PCT, JANELA_PERFEITA_SPEED_ROUNDS,
} from '../lib/hunter';
import { rollAttack, rollAbilityHit, mitigatedBase } from '../game/combat';
import { heroSprites, enemySprite, drawSprite } from '../game/sprites';
import { battleBackground } from '../game/battleBackgrounds';
import { Panel } from './Panel';
import { Modal } from './Modal';
import { Button } from './Button';
import { MechanicQuickModal, MechanicText } from './ClassMechanics';
import { CombatMechanicDisplay, CombatMechanicState } from './CombatMechanics';
import { getClassMechanics } from '../lib/classMechanics';
import { formatGameNumber, formatGamePercent } from '../lib/format';
import { IconActive, IconSkull, IconSword } from './icons';
import { activeAbilityIconStyle } from '../lib/abilityIcons';
import {
  playBattleMusic, playBossMusic, stopCombatMusic, playMagicAttackSfx, playPhysicalAttackSfx, playHurtSfx, playBuySellSfx,
} from '../lib/audio';
import skillFrame from '../assets/slot-habilidade.webp';
import pocaoIcon from '../assets/pocao.webp';
import moedaIcon from '../assets/moeda.webp';
import iconVeneno from '../assets/effects/effect-veneno.webp';
import iconQueimadura from '../assets/effects/effect-queimadura.webp';
import iconSangramento from '../assets/effects/effect-sangramento.webp';
import iconMaldicao from '../assets/effects/effect-maldicao.webp';
import iconAtordoado from '../assets/effects/effect-atordoado.webp';
import iconDormindo from '../assets/effects/effect-dormindo.webp';
import iconSilenciado from '../assets/effects/effect-silenciado.webp';
import iconAtkBuff from '../assets/effects/effect-atk-buff.webp';
import iconAtkDebuff from '../assets/effects/effect-atk-debuff.webp';
import iconDefBuff from '../assets/effects/effect-def-buff.webp';
import iconDefDebuff from '../assets/effects/effect-def-debuff.webp';
import iconCritBuff from '../assets/effects/effect-crit-buff.webp';
import iconCritDebuff from '../assets/effects/effect-crit-debuff.webp';
import iconCritDmgBuff from '../assets/effects/effect-critdmg-buff.webp';
import iconCritDmgDebuff from '../assets/effects/effect-critdmg-debuff.webp';
import iconPrecisaoBuff from '../assets/effects/effect-precisao-buff.webp';
import iconPrecisaoDebuff from '../assets/effects/effect-precisao-debuff.webp';
import iconEvasaoBuff from '../assets/effects/effect-evasao-buff.webp';
import iconEvasaoDebuff from '../assets/effects/effect-evasao-debuff.webp';
import iconDanoRecebidoBuff from '../assets/effects/effect-danorecebido-buff.webp';
import iconDanoRecebidoDebuff from '../assets/effects/effect-danorecebido-debuff.webp';
import iconDefPenBuff from '../assets/effects/effect-defpen-buff.webp';
import iconRouboVidaBuff from '../assets/effects/effect-roubovida-buff.webp';

const ATTACK_INTERVAL = 2200;
// How long a floating damage number stays on screen — kept in one place so
// the JS unmount timer and the CSS animation duration below never drift
// apart. Bumped up from the original 900ms so a hit has time to actually
// register before it's gone.
const FLOAT_DURATION_MS = 1500;
// Single source of truth for the battle canvas's own pixel size — read by
// both the <canvas> element itself and the floating-number math below, so
// the two can never drift apart the way they did when the canvas grew
// taller but the floaters' anchor points stayed hard-coded percentages.
const CANVAS_W = 640;
const CANVAS_H = 360;
// Sprites are drawn anchored to this ground line (see the draw() effect),
// feet at groundY, extending upward by the sprite's own pixel height.
const GROUND_Y = CANVAS_H - 42;
// Where a floating number should anchor on a given sprite — 25% down from
// its top (roughly chest/head height) expressed as a % of the canvas, so a
// number lands near the character no matter how tall the canvas is or how
// tall that particular sprite happens to be (a tiny Fada Sombria and a
// towering chefe both get a sensible spot instead of one shared constant
// tuned for neither).
function floatBaseTopPct(spriteHeightPx: number): number {
  const spriteTopY = GROUND_Y - spriteHeightPx;
  return ((spriteTopY + spriteHeightPx * 0.25) / CANVAS_H) * 100;
}
const PLAYER_FLOAT_LEFT_PCT = 24;
const ENEMY_FLOAT_LEFT_PCT = 68;
// Small scatter per stacked slot (see FloatingNumber.slot) — replaces the
// old approach of stacking simultaneous numbers straight upward, which read
// like a staircase once 3-4 were on screen at once. A tight cluster close
// to the character reads as "several things just happened to them" without
// numbers drifting away from the sprite or piling into a tower.
const FLOATER_JITTER: { x: number; y: number }[] = [
  { x: 0, y: 0 },
  { x: 16, y: 10 },
  { x: -16, y: 10 },
  { x: 26, y: -8 },
  { x: -26, y: -8 },
  { x: 0, y: 20 },
];
// Ability-cast callouts linger a bit longer than a plain floating number —
// there's a name to actually read, not just a number at a glance.
const ABILITY_CAST_DURATION_MS = 1800;
// Player and enemy now run on independent action clocks (see playerAct/
// enemyAct); this only offsets whichever side loses the opening coin flip
// (see the mount effect) so the two don't visually land in the exact same
// instant on the opening exchange. Previously this was ALWAYS applied to
// the enemy's first action (with an even bigger +120ms stacked on top at
// the call site, 380ms total) — the player unconditionally struck first on
// every single dungeon start, no matter the build. Reducing the number
// alone (as a prior fix did, 260ms -> 90ms) only shrank the edge, it never
// removed the guarantee. Now the mount effect coin-flips who gets this
// small lead each run, so first strike is fair over time instead of always
// going to the player.
const LEAN_MS = 90;
const POTION_COOLDOWN_ROUNDS = 4;
const BASE_POTION_HEAL_PCT = 0.4;
const DROP_SLOTS: ItemSlot[] = ['weapon', 'body', 'legs', 'hands', 'offhand', 'accessory'];
// A phone locking or a tab backgrounding pauses every setTimeout in it —
// there's no way for a web page to keep actually running while suspended
// by the OS/browser. Instead, on return the fight fast-forwards silently
// (see runCatchUp) through however much real time passed, using the exact
// same combat functions as live play, just driven synchronously instead of
// through their normal setTimeout chain. Capped so a forgotten tab open for
// days doesn't turn into unattended multi-day farming — a few hours is
// "went out and came back", not an idle-game exploit.
const MAX_CATCHUP_MS = 3 * 60 * 60 * 1000;
// Below this, whatever drift the live timers picked up while backgrounded
// isn't worth a silent fast-forward pass over — a quick tab switch already
// mostly keeps pace.
const CATCHUP_MIN_MS = 4000;
const CATCHUP_SAFETY_MAX_STEPS = 30000;

// Weighted floor for a Hunt boss's guaranteed drop — Raro is the baseline,
// with a real (not token) shot at Épico or Lendário, since the fight itself
// is deliberately much harder than a normal same-level dungeon boss.
const HUNT_RARITY_WEIGHTS: [Rarity, number][] = [['raro', 55], ['epico', 35], ['legendario', 10]];
function pickHuntDropRarity(): Rarity {
  const total = HUNT_RARITY_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of HUNT_RARITY_WEIGHTS) {
    if (roll < weight) return rarity;
    roll -= weight;
  }
  return 'raro';
}
// Self-targeted kinds resolve as the round's whole action — no basic attack,
// no offense ability, just this — same as any offense pick. They compete for
// the one action exactly like everything else in the priority list; a
// self-targeted 'statMod' is the one exception, since it's a hybrid hit+buff
// that already rolls damage in the offense branch below.
const SELF_ABILITY_KINDS = [
  'heal', 'buffDef', 'buffBlock', 'shield', 'regen', 'immunity', 'haste', 'berserk', 'dispel', 'taunt', 'lifestealBuff', 'atkBuff',
  // Bárbaro redesign (lib/barbarian.ts) — all consume the whole action, no attack roll.
  'furyBoost', 'furyMaxFrenzy', 'painGuard', 'wallStance', 'lastStand', 'bloodFeast',
  // Clérigo redesign (lib/clerigo.ts) — all consume the whole action, no attack roll.
  'cleanseOne', 'consecrationGuard', 'divineWall', 'reviveWindow',
  // Cavaleiro redesign (lib/knight.ts) — all consume the whole action, no attack roll.
  'ironWall', 'livingFortress', 'colossalShield', 'lastGuard', 'counterStance', 'orderResist', 'kingsBanner',
  // Caçador redesign (lib/hunter.ts) — all consume the whole action, no attack roll.
  'armTrap', 'buffEvasion', 'huntWithPrey',
  // Guerreiro — support actions; neither consumes Guarda Quebrada actions.
  'preparedGuard', 'feint', 'aegis', 'archerMove',
  // Necromante — invocações/proteções consomem a ação inteira.
  'boneShield', 'deathVeil', 'boneFortress', 'mortalVoracity',
  // Ladino — suportes Rápidos resolvem dentro da Janela de Iniciativa.
  'rogueStealth', 'rogueToxicBlade', 'roguePrepareTrick',
];
const MISS_CHANCE_CAP = 0.45;

const STATUS_LABEL: Record<StatusEffectKind, string> = { poison: 'Envenenado', burn: 'Em Chamas', bleed: 'Sangrando', curse: 'Amaldiçoado' };
const STATUS_VERB: Record<StatusEffectKind, string> = { poison: 'envenenado', burn: 'incendiado', bleed: 'posto a sangrar', curse: 'amaldiçoado' };
const STATUS_DESC: Record<StatusEffectKind, string> = {
  poison: 'Sofre dano de veneno a cada rodada até o efeito passar.',
  burn: 'Sofre dano de fogo a cada rodada até o efeito passar.',
  bleed: 'Sofre dano por sangramento a cada rodada até o efeito passar.',
  curse: 'Sofre dano mágico contínuo a cada rodada por estar amaldiçoado.',
};
const CC_LABEL: Record<CrowdControlKind, string> = { stun: 'Atordoado', sleep: 'Dormindo', silence: 'Silenciado' };
const CC_DESC: Record<CrowdControlKind, string> = {
  stun: 'Perde a próxima ação — não consegue atacar nem usar habilidades.',
  sleep: 'Não age enquanto dorme; qualquer dano sofrido interrompe o sono.',
  silence: 'Não pode usar habilidades — só ataques básicos, até o efeito passar.',
};

// Small icon badges rendered right next to each combatant's sprite (see
// EffectBadgeRow below) — painted art from the buff/debuff icon sheet.
const STATUS_BADGE_ICON: Record<StatusEffectKind, string> = {
  poison: iconVeneno, burn: iconQueimadura, bleed: iconSangramento, curse: iconMaldicao,
};
const CC_BADGE_ICON: Record<CrowdControlKind, string> = {
  stun: iconAtordoado, sleep: iconDormindo, silence: iconSilenciado,
};
// Two icons per stat (buff/debuff) except defPenPct and lifestealPct, which
// only ever appear as buffs in actual effect data — no debuff variant exists.
const STAT_MOD_ICON: Record<StatModStat, { buff: string; debuff: string }> = {
  atk: { buff: iconAtkBuff, debuff: iconAtkDebuff },
  def: { buff: iconDefBuff, debuff: iconDefDebuff },
  mdef: { buff: iconDefBuff, debuff: iconDefDebuff },
  critChance: { buff: iconCritBuff, debuff: iconCritDebuff },
  critDmgMult: { buff: iconCritDmgBuff, debuff: iconCritDmgDebuff },
  accuracy: { buff: iconPrecisaoBuff, debuff: iconPrecisaoDebuff },
  evasion: { buff: iconEvasaoBuff, debuff: iconEvasaoDebuff },
  dmgTakenPct: { buff: iconDanoRecebidoBuff, debuff: iconDanoRecebidoDebuff },
  defPenPct: { buff: iconDefPenBuff, debuff: iconDefPenBuff },
  lifestealPct: { buff: iconRouboVidaBuff, debuff: iconRouboVidaBuff },
  // No dedicated Tenacidade/Velocidade icon exists yet — reuses the Defesa/
  // Ataque glyphs, same "buff-only in practice" treatment as defPenPct/
  // lifestealPct above.
  tenacityPct: { buff: iconDefBuff, debuff: iconDefDebuff },
  speedPct: { buff: iconAtkBuff, debuff: iconAtkDebuff },
};
const STAT_MOD_LABEL: Record<StatModStat, string> = {
  atk: 'Ataque', def: 'Defesa', mdef: 'Defesa Mágica', critChance: 'Crítico', critDmgMult: 'Dano Crítico', accuracy: 'Precisão',
  evasion: 'Evasão', dmgTakenPct: 'Dano Recebido', defPenPct: 'Penetração de Defesa', lifestealPct: 'Roubo de Vida',
  tenacityPct: 'Tenacidade', speedPct: 'Velocidade',
};

interface EffectBadge { key: string; icon: string; title: string; desc: string; }

// dmgTakenPct is the one stat where a negative roll is the good outcome
// (less damage taken) — everything else follows "higher is better for
// whoever holds the mod."
function statModBadgeIsBuff(m: StatModInstance): boolean {
  return m.stat === 'dmgTakenPct' ? m.pct < 0 : m.pct > 0;
}

function buildEffectBadges(side: 'player' | 'enemy', statuses: StatusEffectKind[], ccs: CrowdControlKind[], mods: StatModInstance[]): EffectBadge[] {
  return [
    ...statuses.map((s, i) => ({ key: `${side}-s${i}`, icon: STATUS_BADGE_ICON[s], title: STATUS_LABEL[s], desc: STATUS_DESC[s] })),
    ...ccs.map((c, i) => ({ key: `${side}-c${i}`, icon: CC_BADGE_ICON[c], title: CC_LABEL[c], desc: CC_DESC[c] })),
    ...mods.map((m, i) => {
      const isBuff = statModBadgeIsBuff(m);
      const pctText = `${m.pct > 0 ? '+' : ''}${Math.round(m.pct * 100)}%`;
      const roundsText = `${m.roundsLeft} rodada${m.roundsLeft === 1 ? '' : 's'} restante${m.roundsLeft === 1 ? '' : 's'}`;
      return {
        key: `${side}-m${i}`,
        icon: isBuff ? STAT_MOD_ICON[m.stat].buff : STAT_MOD_ICON[m.stat].debuff,
        title: `${STAT_MOD_LABEL[m.stat]} ${pctText}`,
        desc: `${isBuff ? 'Bônus' : 'Penalidade'} de ${pctText} em ${STAT_MOD_LABEL[m.stat]} — ${roundsText}.`,
      };
    }),
  ];
}

// One ambient color wash per side's sprite (see drawSprite's statusTint
// param) so a poisoned/burning/etc. combatant visibly looks the part instead
// of that only being communicated by the small badge icons above them. A DOT
// status wins over a CC wins over a plain stat buff/debuff — the most
// "you don't look like yourself right now" case takes priority — and only
// ever one color shows at once so several active effects don't blend into
// mud; the badges are still the place to see everything that's active.
const STATUS_TINT_COLOR: Record<StatusEffectKind, string> = {
  poison: '#22c55e', burn: '#f97316', bleed: '#dc2626', curse: '#a855f7',
};
const CC_TINT_COLOR: Record<CrowdControlKind, string> = {
  stun: '#eab308', sleep: '#38bdf8', silence: '#64748b',
};
function statusTintFor(
  statuses: StatusEffectKind[], ccs: CrowdControlKind[], mods: StatModInstance[],
): { color: string; alpha: number } | undefined {
  if (statuses.length > 0) return { color: STATUS_TINT_COLOR[statuses[0]], alpha: 0.38 };
  if (ccs.length > 0) return { color: CC_TINT_COLOR[ccs[0]], alpha: 0.34 };
  if (mods.length > 0) {
    if (mods.some((m) => !statModBadgeIsBuff(m))) return { color: '#ef4444', alpha: 0.22 };
    return { color: '#fbbf24', alpha: 0.2 };
  }
  return undefined;
}

interface StatusInstance { kind: StatusEffectKind; roundsLeft: number; dmgPerTick: number; }
// sourceAbilityId tags who cast this — lets pickAbility() skip an ability
// whose effect is already active instead of blindly re-casting it on top.
interface PlayerBuff { kind: 'def' | 'block'; pct: number; roundsLeft: number; sourceAbilityId?: string; }
interface StatModInstance { stat: StatModStat; pct: number; roundsLeft: number; sourceAbilityId?: string; }
interface CCInstance { kind: CrowdControlKind; roundsLeft: number; }
interface RegenInstance { pct: number; roundsLeft: number; sourceAbilityId?: string; }
// Caçador redesign (lib/hunter.ts) — a generic combat object, never a
// per-ability `if (name === ...)` branch (see the redesign spec's own
// "TRAP SYSTEM GENÉRICO"). Armed by an 'armTrap' ability, resolved once the
// enemy completes a real action (see enemyAct's hunterTriggerOldestTrap()).
// primed/nextTrapBonus are one-shot flags consumed the instant this trap
// itself activates.
interface CombatTrap {
  sourceAbilityId: string;
  name: string;
  directDmgMultBase: number;
  directDmgMultMarked?: number;
  poisonRounds?: number;
  poisonDmgMultPerTick?: number;
  debuffStat?: StatModStat;
  debuffPct?: number;
  debuffPctMarked?: number;
  debuffRounds?: number;
  trailGainBase?: number;
  trailGainMarked?: number;
  primed: boolean;
  nextTrapBonus: boolean; // Mestre Armadilheiro — +15% direct dmg, granted when the trap ahead of it activated
}
// heal marks a recovery instead of a hit — rendered as a green "+value"
// instead of the usual red/yellow "-value", and never carries crit/blocked/
// miss (a heal is never any of those). Added because every healing source
// (ability heal, regen tick, potion, lifesteal) used to update HP silently
// and only ever show up as a combat-log line — damage got a floating
// number for every source, but recovering HP got none at all.
// slot is a stable per-floater vertical stacking position, assigned once at
// creation (see pushFloat) and never recomputed afterward — an earlier
// version derived it from this floater's live index in the `floaters` array,
// which meant every other floater on the same side silently shifted
// position the instant one of them expired (a heal sitting still while a
// poison tick above it vanished would visibly jump down). Assigning it once
// and reusing the lowest free slot keeps simultaneous numbers (a poison
// tick, the hit that follows it, a heal, a block tag — all in the same
// round) each in their own fixed spot near the character, never overlapping
// and never relocating mid-flight.
interface FloatingNumber { id: number; side: 'player' | 'enemy'; value: number; crit: boolean; blocked?: boolean; miss?: boolean; heal?: boolean; slot: number }
// A coin-icon + down-arrow burst over the player whenever an enemy's
// stealGold effect actually takes gold — separate from FloatingNumber
// since it isn't a damage number at all, just a distinct "you were
// robbed" cue riding the same fixed-duration fade-out pattern.
interface GoldStealFx { id: number; amount: number }
// The ability-icon-in-the-middle-of-the-screen callout — shown whenever
// either side actually uses a named ability (not the plain attack), naming
// it and, when it deals damage or heals, the amount, instead of that only
// ever being legible in the combat log below the fold. `icon` is null for
// enemy abilities (no per-shape ability art exists) and for a player class
// with no active-ability sheet yet, both of which fall back to the generic
// star glyph — same fallback activeAbilityIconStyle's own callers already
// use everywhere else in this file.
interface AbilityCastFx {
  id: number; side: 'player' | 'enemy'; name: string; icon: CSSProperties | null; value: number | null; heal: boolean;
}
// A log line is a list of segments instead of a plain string so a single
// line can mix normal text with a rarity-colored item name (see
// tryDropEquipment) without resorting to raw HTML in the log.
interface LogSegment { text: string; color?: string }
type LogLine = LogSegment[];
// What one attempt actually produced — folded by GameShell into a running
// total across a "repetir automaticamente" sequence (see repeatProgress
// below) and shown on the summary once the sequence ends.
export interface RunStats {
  kills: number;
  goldFromKills: number;
  xpGained: number;
  itemsDropped: number;
  itemsAutoSold: number;
  goldFromAutoSell: number;
  necromancer?: {
    directDamage: number; plagueDamage: number; servantDamage: number;
    servantsSummoned: number; servantAttacks: number; servantsSacrificed: number;
    soulsGenerated: number; soulsSpent: number; soulsLostAtCap: number; soulsCarried: number;
    decompositionSamples: number; decompositionTotal: number; ticksAtFive: number;
    plaguesApplied: number; plaguesDetonated: number; apocalypses: number; reaps: number;
    healing: number; barriers: number; deaths: number;
  };
}
export const EMPTY_RUN_STATS: RunStats = { kills: 0, goldFromKills: 0, xpGained: 0, itemsDropped: 0, itemsAutoSold: 0, goldFromAutoSell: 0 };

// What runCatchUp fast-forwarded through while the tab was backgrounded —
// shown once in a summary modal on return (see CATCHUP_MIN_MS/MAX_CATCHUP_MS).
interface CatchUpSummary {
  elapsedMs: number;
  kills: number;
  gold: number;
  xp: number;
  itemsFound: number;
  itemsAutoSold: number;
  leveledUp: boolean;
  died: boolean;
  won: boolean;
}

interface Props {
  character: Character;
  dungeon: DungeonDef;
  onLiveUpdate: (c: Character) => void;
  onRunEnd: (finalCharacter: Character, deepestDepth: number, endedReason: 'death' | 'retreat' | 'victory', runStats: RunStats) => void;
  // Same finalization as onRunEnd (heal, reroll stock, record depth) but
  // GameShell reacts by immediately re-entering this same dungeon instead
  // of returning to the kingdom — the "Reiniciar Masmorra" shortcut on the
  // ended screen, for a death or a finished run.
  onRestart: (finalCharacter: Character, deepestDepth: number, endedReason: 'death' | 'retreat' | 'victory', runStats: RunStats) => void;
  // Rarities the player armed "Vender Automático" for on the loadout screen
  // — a drop of one of these never touches the inventory, it's sold on the
  // spot. Undefined/empty = off.
  autoSellRarities?: Rarity[];
  // "Não Utilizar Poção de HP" from the loadout screen — for a pure farm
  // run where the player doesn't want potions spent (or auto-triggered)
  // getting in the way of a clean repeat sequence.
  noPotions?: boolean;
  // Set only while a "repetir automaticamente" sequence (GameShell) is
  // running — this attempt's 1-indexed position in it (repeatCurrent) out of
  // the sequence's total (repeatTotal). Passed as two primitives rather than
  // one object so the auto-advance effect below can depend on them directly
  // without an object literal (rebuilt fresh every GameShell render) making
  // that effect re-fire on every unrelated re-render while sitting in
  // 'ended'. Drives the ended screen to auto-advance instead of waiting for
  // a click (current < total -> next attempt, current >= total -> back to
  // the kingdom with the sequence's summary), unless the player retreated
  // or hit "Parar".
  repeatCurrent?: number;
  repeatTotal?: number;
}

type Phase = 'fight' | 'ended';

function getModTotal(mods: StatModInstance[], stat: StatModStat): number {
  return mods.reduce((s, m) => (m.stat === stat ? s + m.pct : s), 0);
}
function tickMods(mods: StatModInstance[]): StatModInstance[] {
  return mods.map((m) => ({ ...m, roundsLeft: m.roundsLeft - 1 })).filter((m) => m.roundsLeft > 0);
}
function tickCC(list: CCInstance[]): CCInstance[] {
  return list.map((c) => ({ ...c, roundsLeft: c.roundsLeft - 1 })).filter((c) => c.roundsLeft > 0);
}
function hasCC(list: CCInstance[], kind: CrowdControlKind): boolean {
  return list.some((c) => c.kind === kind);
}
function rollMiss(attackerAccuracy: number, defenderEvasion: number): boolean {
  const missChance = Math.max(0, Math.min(MISS_CHANCE_CAP, defenderEvasion - attackerAccuracy));
  return Math.random() < missChance;
}
// Permanent cooldown reduction from skill-tree secondary-attribute nodes
// shortens every ability's cooldown when it's set, never below 1 round.
function applyCd(cooldown: number, cooldownReductionPct: number): number {
  return Math.max(1, Math.round(cooldown * (1 - cooldownReductionPct)));
}

// Round-timer gauge ("ATB") for a single side — remounted via `roundKey`
// every round so the CSS fill animation restarts from empty instead of
// jumping backwards, and frozen via animation-play-state while paused.
function AtbBar({ roundKey, roundMs, paused, colorClass }: {
  roundKey: number; roundMs: number; paused: boolean; colorClass: string;
}) {
  return (
    <div className="h-1 bg-black/50 rounded overflow-hidden mt-0.5">
      <div
        key={roundKey}
        className={`h-1 rounded ${colorClass}`}
        style={{
          animation: `atbFill ${roundMs}ms linear forwards`,
          animationPlayState: paused ? 'paused' : 'running',
        }}
      />
    </div>
  );
}

// Icons alone don't explain themselves at 24px, and a hover title tooltip
// never fires on a touchscreen — so each badge is a tap target that toggles
// a small text popover instead, dismissed by tapping the badge again or the
// backdrop rendered by the caller.
function EffectBadgeRow({ badges, align, activeKey, onToggle }: {
  badges: EffectBadge[]; align: 'left' | 'right'; activeKey: string | null; onToggle: (key: string) => void;
}) {
  if (badges.length === 0) return null;
  const active = badges.find((b) => b.key === activeKey);
  return (
    <div className={`absolute top-1.5 z-20 flex gap-1 flex-wrap max-w-[45%] ${align === 'left' ? 'left-1.5' : 'right-1.5 justify-end'}`}>
      {badges.map((b) => (
        <button
          key={b.key}
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggle(b.key); }}
          className="w-6 h-6 rounded-full ring-1 ring-black/60 shadow-[0_1px_3px_rgba(0,0,0,0.8)] shrink-0"
        >
          <img src={b.icon} alt={b.title} className="w-full h-full rounded-full pointer-events-none" />
        </button>
      ))}
      {active && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-7 z-30 w-44 rounded border border-gold/40 bg-black/95 px-2 py-1.5 shadow-lg ${align === 'left' ? 'left-0' : 'right-0'}`}
        >
          <p className="text-[11px] font-bold text-gold">{active.title}</p>
          <p className="text-[10px] text-parchment/80 mt-0.5 leading-snug">{active.desc}</p>
        </div>
      )}
    </div>
  );
}

export function DungeonPanel({
  character, dungeon, onLiveUpdate, onRunEnd, onRestart, autoSellRarities, noPotions, repeatCurrent, repeatTotal,
}: Props) {
  const [ch, setCh] = useState<Character>(character);
  const [depth, setDepth] = useState(dungeon.startDepth);
  const [enemy, setEnemy] = useState<EnemyInstance>(() => spawnEnemy(dungeon.startDepth, dungeon));
  const [phase, setPhase] = useState<Phase>('fight');
  const [paused, setPaused] = useState(false);
  const [log, setLog] = useState<LogLine[]>([[{ text: `Você entra em ${dungeon.name}...` }]]);
  const [floaters, setFloaters] = useState<FloatingNumber[]>([]);
  const [goldSteals, setGoldSteals] = useState<GoldStealFx[]>([]);
  const [abilityCasts, setAbilityCasts] = useState<AbilityCastFx[]>([]);
  const [activeBadgeKey, setActiveBadgeKey] = useState<string | null>(null);
  const [flashSide, setFlashSide] = useState<'player' | 'enemy' | null>(null);
  const [endedReason, setEndedReason] = useState<'death' | 'retreat' | 'victory' | null>(null);
  // Big "VITÓRIA"/"DERROTA" banner over the canvas — set the instant the
  // boss falls or the player does, cleared ~2s later by its own timeout.
  // Skipped entirely during a silent catch-up pass (see runCatchUp/
  // silentRef) same as every other on-screen effect, and never set on a
  // retreat, which isn't a win or a loss.
  const [resultBanner, setResultBanner] = useState<'victory' | 'defeat' | null>(null);
  // Non-null only right after a runCatchUp pass (see the visibilitychange
  // effect below) — shows the "enquanto você estava fora" summary modal
  // once, then goes back to null on dismiss.
  const [catchUpSummary, setCatchUpSummary] = useState<CatchUpSummary | null>(null);
  const [enemyStatuses, setEnemyStatuses] = useState<StatusEffectKind[]>([]);
  const [playerStatuses, setPlayerStatuses] = useState<StatusEffectKind[]>([]);
  const [enemyCCState, setEnemyCCState] = useState<CrowdControlKind[]>([]);
  const [playerCCState, setPlayerCCState] = useState<CrowdControlKind[]>([]);
  // Buffs/debuffs (StatModInstance) — mirrors the statuses/CC sync pattern
  // above, so the sprite-side badges (see badgesFor below) can show them too.
  const [playerModsState, setPlayerModsState] = useState<StatModInstance[]>([]);
  const [enemyModsState, setEnemyModsState] = useState<StatModInstance[]>([]);
  const [playerShieldState, setPlayerShieldState] = useState(0);
  // Boss-only: label of the highest phase transition reached so far, shown
  // next to the boss's name in its HP bar (see applyEnemyHp below). Stays
  // null for every regular encounter, which never carries a phases array.
  const [bossPhaseName, setBossPhaseName] = useState<string | null>(null);
  // ATB gauges — player and enemy now run on independent action clocks (the
  // player's AGI shortens their own interval via stats.speedPct; enemies
  // stay at the baseline pace for now), so each side tracks its own
  // key/duration pair. The *Key bump remounts the fill div at the start of
  // each of that side's actions so the CSS animation restarts from empty
  // instead of snapping backwards; *Ms is the actual delay that side's
  // scheduler used, so pause/resume and speed changes stay visually honest.
  const [playerRoundKey, setPlayerRoundKey] = useState(0);
  const [playerRoundMs, setPlayerRoundMs] = useState(ATTACK_INTERVAL);
  const [enemyRoundKey, setEnemyRoundKey] = useState(0);
  const [enemyRoundMs, setEnemyRoundMs] = useState(ATTACK_INTERVAL);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const floaterId = useRef(0);

  // Refs mirror the latest state so the timer-driven combat loop always acts
  // on fresh values, even though each step was scheduled several closures ago.
  const chRef = useRef(ch);
  const enemyRef = useRef(enemy);
  const depthRef = useRef(depth);
  const pausedRef = useRef(false);
  const phaseRef = useRef<Phase>('fight');
  const mountedRef = useRef(true);
  // True only while runCatchUp is fast-forwarding through backgrounded
  // time — every visual/audio side effect (log lines, floaters, flashes,
  // sfx, the ATB-bar sync* setters) short-circuits while this is up, and
  // the two 900ms kill/victory transition delays resolve immediately
  // instead of via setTimeout, so a loop of real combat functions can run
  // synchronously instead of trickling out over real wall-clock time.
  const silentRef = useRef(false);
  // Mirrors the `endedReason` state so runCatchUp (running synchronously,
  // outside React's render cycle) can read the just-set value immediately
  // instead of the stale one React would still return before its next
  // render — every setEndedReason call below also writes this ref.
  const endedReasonRef = useRef<'death' | 'retreat' | 'victory' | null>(null);
  // Set the instant the tab goes hidden (see the visibilitychange effect
  // below); cleared back to null once a catch-up pass (or a no-op skip) has
  // been handled for that hidden period.
  const hiddenAtRef = useRef<number | null>(null);
  // Bumped every time a new enemy actually spawns — nothing in this file
  // ever clearTimeout()s a pending scheduleEnemy() callback, so when the
  // previous enemy dies mid-cycle its own still-pending action timer stays
  // alive. Before this ref existed, that stale timer (scheduled against the
  // OLD enemy's remaining delay) would go on to attack with the NEW enemy
  // once it fired, landing a hit well before the freshly-reset ATB bar had
  // actually filled. scheduleEnemy() captures the generation at schedule
  // time and a mismatch at fire time means "this timer belongs to an enemy
  // that's already gone" — silently drop it instead of acting.
  const enemyGenRef = useRef(0);
  // Bumped once at the start of every runCatchUp() pass (see the
  // visibilitychange effect below) — same stale-timer problem as
  // enemyGenRef above, but for the OTHER two clocks (player/env), and
  // triggered by resuming from the background instead of an enemy dying.
  // A setTimeout already in flight when the tab was hidden doesn't get
  // cancelled (nothing here ever clearTimeout()s one), so it was still
  // sitting in the queue once the tab came back — and since browsers fire
  // backlogged/throttled background timers promptly on resume, it landed
  // right on top of the fresh schedulePlayer/scheduleEnemy/scheduleEnv
  // calls runCatchUp makes once it's done fast-forwarding, causing a
  // second live action (double damage) immediately after catch-up already
  // resolved that exact round. All three schedulers capture this at
  // schedule time and refuse to fire if it's moved on by the time their
  // timeout lands.
  const catchUpGenRef = useRef(0);
  // This attempt's own tally, reported alongside onRunEnd/onRestart so
  // GameShell can fold it into a repeat sequence's running summary.
  const runStatsRef = useRef<RunStats>({ ...EMPTY_RUN_STATS });

  // Ability/status engine state — session-only, reset whenever this dungeon
  // run starts (never persisted). enemyStatusRef/playerStatusRef are the DOT
  // family (poison/burn/bleed/curse); *ModsRef are generic buff/debuff stat
  // modifiers (atk/def/crit/accuracy/evasion/dmgTakenPct/defPenPct); *CCRef
  // is the action-denial family (stun/sleep/silence).
  const cooldownsRef = useRef<Record<string, number>>({});
  const enemyAbilityCooldownsRef = useRef<Record<string, number>>({});
  // Boss-only: how many of the current boss's phases (see BossPhase in
  // types/game.ts) have already fired this fight, so each threshold only
  // triggers once as HP drops past it, never re-fires, and can't fire out
  // of order. No-op for a regular enemy, which has no phases array.
  const bossPhaseIndexRef = useRef(0);
  const enemyStatusRef = useRef<StatusInstance[]>([]);
  const playerStatusRef = useRef<StatusInstance[]>([]);
  const playerBuffsRef = useRef<PlayerBuff[]>([]);
  const playerModsRef = useRef<StatModInstance[]>([]);
  const enemyModsRef = useRef<StatModInstance[]>([]);
  const playerCCRef = useRef<CCInstance[]>([]);
  const enemyCCRef = useRef<CCInstance[]>([]);
  const playerRegenRef = useRef<RegenInstance[]>([]);
  const playerShieldRef = useRef(0);
  const playerImmuneRoundsRef = useRef(0);
  const playerHasteRoundsRef = useRef(0);
  const potionCooldownRef = useRef(0);

  // ── Bárbaro redesign — FÚRIA/FRENESI/FERIDAS/DOR, session-only, never
  // persisted on Character (see lib/barbarian.ts). Fúria/Frenesi/Feridas
  // reset every new enemy (see resolveEnemyDeath's advanceToNextEnemy);
  // Dor persists across enemies within the same attempt and only resets
  // because this whole component remounts fresh on the next attempt. Inert
  // (never read) for every other class.
  const barbFuryRef = useRef(0);
  const barbFrenzyRef = useRef(false);
  const barbPainPacketsRef = useRef<PainPacket[]>([]);
  // Postura Selvagem's temporary 35%-total redirect window.
  const barbPostureRoundsLeftRef = useRef(0);
  // Muralha Selvagem's temporary dmgTakenPct-debuff-for-attacker window —
  // furyPerHitTaken is captured at cast time so the passive's own default
  // constant doesn't need to be re-read every enemy action.
  const barbWallRoundsLeftRef = useRef(0);
  const barbWallFuryPerHitRef = useRef(0);
  const [barbFuryState, setBarbFuryState] = useState(0);
  const [barbFrenzyState, setBarbFrenzyState] = useState(false);
  const [barbPainState, setBarbPainState] = useState(0);
  // Universal class-mechanic explainer (see components/ClassMechanics.tsx) —
  // any combat-UI element tied to a mechanic (Fúria/Frenesi/Dor bars,
  // Feridas badge) opens the same generic quick-explain popup by id.
  const [openMechanicId, setOpenMechanicId] = useState<string | null>(null);
  const [openAbilityId, setOpenAbilityId] = useState<string | null>(null);

  // ── Clérigo redesign — FÉ/GRAÇA/CONSAGRAÇÃO/JULGAMENTO, session-only,
  // never persisted (see lib/clerigo.ts). Fé partially carries between
  // enemies within one attempt (see nextFaithForNewEnemy); Graça/Consagração
  // reset every new enemy same as Fúria/Frenesi; Julgamento lives on the
  // EnemyInstance itself so it simply doesn't exist on the next spawn. Inert
  // for every other class.
  const clerigoFaithRef = useRef(character.classId === 'clerigo' ? FAITH_START_FIRST_ENEMY : 0);
  const clerigoConsecrationRoundsLeftRef = useRef(0);
  // One-shot-per-Consagração-instance flags (Solo Consagrado/Fé Vigilante/
  // Vigília/Santuário Vivo) — cleared whenever a new Consagração starts.
  const clerigoConsecrationFlagsRef = useRef({ soloConsagrado: false, feVigilante: false, vigilia: false, santuarioVivo: false });
  const clerigoGraceRef = useRef<{ amount: number; ticksLeft: number }>({ amount: 0, ticksLeft: 0 });
  // Barreiras NORMAIS (não Graça) criadas pelo Clérigo, na ordem em que
  // foram criadas — ver clerigoAbsorbBarriers() para como o dano as consome
  // (FIFO) e dispara os eventos de Fé/instância-destruída que várias
  // habilidades de Retidão reagem a.
  const clerigoBarrierPortionsRef = useRef<BarrierPortion[]>([]);
  const clerigoAncoraSagradaWindowRef = useRef(0);
  const clerigoReviveWindowRoundsLeftRef = useRef(0);
  const clerigoReviveHealRef = useRef({ healPct: 0.40, capPct: 0.25 });
  const clerigoResurrectionTriggeredRef = useRef(false); // once per attempt
  const clerigoJudgmentFaithMilestonesRef = useRef<Set<number>>(new Set()); // per-enemy, see JUDGMENT_FAITH_MILESTONES
  const clerigoJuizoFinalActiveRef = useRef(false); // Juízo Final's own buff can't be renewed while active
  const [clerigoFaithState, setClerigoFaithState] = useState(0);
  const [clerigoGraceState, setClerigoGraceState] = useState(0);
  const [clerigoConsecrationState, setClerigoConsecrationState] = useState(0);

  // ── Cavaleiro redesign — DETERMINAÇÃO/RETALIAÇÃO/MOMENTUM/ORDENS, session-
  // only, never persisted (see lib/knight.ts). All four reset every new
  // enemy EXCEPT Momentum's Sede de Vitória carry-over (capped) and Ordens'
  // Liderança carry-over (capped at 1) — and Bastião Inquebrável's once-per-
  // ATTEMPT save, which persists across enemies. Inert for every other class.
  const knightDeterminationRef = useRef(0);
  const knightBlockCountRef = useRef(0); // toward the next Retaliação charge (every 3)
  const knightRetaliationChargesRef = useRef(0);
  const knightIronWallRoundsLeftRef = useRef(0);
  const knightFortressRoundsLeftRef = useRef(0); // mutually exclusive with Muralha de Ferro
  const knightNextHitReductionWindowRef = useRef(0); // Escudo Disciplinado — ticks left on the -8% next-hit window
  const knightLastGuardRoundsLeftRef = useRef(0);
  const knightLastGuardUsedThisEnemyRef = useRef(false);
  const knightCounterStanceRoundsLeftRef = useRef(0);
  const knightCounterStoredDmgRef = useRef(0);
  const knightColossalShieldRef = useRef<{ remaining: number; ccNegated: boolean } | null>(null);
  const knightBastiaoInquebravelUsedThisRunRef = useRef(false); // once per ATTEMPT, never resets per enemy
  const knightBastiaoInquebravelActiveRoundsRef = useRef(0); // -25% dmg taken for a couple rounds after it saves you
  const knightNegativeCounterBastiaoRef = useRef(0); // Juramento de Resistência
  const knightJuramentoReductionReadyRef = useRef(false); // set once the counter hits 3 — consumed by the NEXT negative effect
  const knightNegativeCounterComandoRef = useRef(0); // Disciplina Inabalável
  const knightNegativeCounterComandoTickRef = useRef(0); // "no máximo uma geração por envTick" — reset to 0 every envTick

  const knightMomentumRef = useRef(0);
  const knightFirstHitLandedRef = useRef(false); // per-enemy — the first successful hit gains more Momentum
  const knightMomentumMaxBonusRef = useRef(0); // Cavaleiro Imparável's per-enemy stacking bonus (max +30)
  const knightConsecutiveHitsRef = useRef(0); // Cavaleiro Imparável's 4-hit trigger
  const knightPressureStacksRef = useRef(0); // Pressão Constante

  const knightOrdersRef = useRef(0);
  const knightCommandSupremeRef = useRef(false);
  const knightBannerRefundWindowRef = useRef(false); // Estandarte do Rei — first other Comando ability during its window refunds +1 Ordem
  const knightContraordemUsedThisActionRef = useRef(false);

  const [knightDeterminationState, setKnightDeterminationState] = useState(0);
  const [knightRetaliationState, setKnightRetaliationState] = useState(0);
  const [knightMomentumState, setKnightMomentumState] = useState(0);
  const [knightOrdersState, setKnightOrdersState] = useState(0);
  const [knightCommandSupremeState, setKnightCommandSupremeState] = useState(false);

  // ── Caçador redesign — ARMADILHAS/RASTRO/BRECHAS, session-only, never
  // persisted (see lib/hunter.ts). Rastro/Brechas live ON the enemy instance
  // itself (hunterTrail/hunterBreaches, same shape as barbarianWounds/
  // judgment) so they already reset with a fresh spawnEnemy() and need no
  // dedicated reset logic here. Traps are the Caçador's own combat objects —
  // they never persist between enemies (cleared on death/dungeon end).
  const hunterTrapsRef = useRef<CombatTrap[]>([]);
  const hunterRecentTrapTriggerTicksRef = useRef(0); // Golpe de Misericórdia's own gate
  const hunterTrapsTriggeredThisEnemyRef = useRef(0); // Execução da Presa's scaling + condition
  const hunterFirstTrapTriggeredThisEnemyRef = useRef(false); // Armadilheiro Adaptável's first-trap Brecha
  const hunterNextShotBonusAvailableRef = useRef(false); // Mão do Armeiro — granted when a trap is newly armed, consumed on the next landed hit
  const hunterInstintoFugaWindowTicksRef = useRef(0); // Instinto de Fuga's +12% dmg window after an enemy miss
  const hunterPassoEthereoMissPendingRef = useRef(false); // Passo Etéreo's "primeiro erro durante o efeito"
  const hunterMantoSombrasBreachesGrantedRef = useRef(0); // Manto das Sombras — max 2 Brechas per cast
  const hunterConsecutiveHitCounterRef = useRef(0); // Predador Paciente's 3-hit CDR trigger
  const hunterCritCounterRef = useRef(0); // Abrir a Guarda's 2-crit Brecha trigger
  const hunterMemoriaTrilhaGrantedRef = useRef(false); // per enemy — Memória da Trilha's extra first-action Rastro

  const [hunterTrapsState, setHunterTrapsState] = useState<CombatTrap[]>([]);

  // Arqueiro redesign — estado de combate efêmero, reiniciado por inimigo.
  const archerStateRef = useRef<ArcherCombatState>(createArcherCombatState());
  const archerDonoDoEspacoUsedRef = useRef(false);
  const archerAccuracyBuffRef = useRef(0);
  const archerEvasionBuffRef = useRef(0);
  const archerSpeedBuffRef = useRef(0);
  const archerPerfectCastRef = useRef(false);
  const archerLastActionHitsRef = useRef(0);
  const [archerState, setArcherState] = useState(archerStateRef.current);
  const druidCycleRef = useRef<DruidCycleState>(createDruidCycle());
  const druidGardenRef = useRef<GardenUnit[]>([]);
  const druidGardenIdRef = useRef(1);
  const druidAvatarActionsRef = useRef(0);
  const [druidCycleState, setDruidCycleState] = useState(druidCycleRef.current);
  // Bruxo redesign — resources persist across enemies in the same attempt;
  // the enemy name state resets on each spawn.
  const warlockStateRef = useRef<WarlockPlayerState>(createWarlockPlayerState());
  const warlockEnemyRef = useRef<WarlockEnemyNameState>(createWarlockEnemyNameState());
  const [warlockState, setWarlockState] = useState(warlockStateRef.current);
  const [warlockEnemyState, setWarlockEnemyState] = useState(warlockEnemyRef.current);
  function isWarlock(): boolean { return chRef.current.classId === 'bruxo'; }
  function warlockHasSkill(id: string): boolean { return isWarlock() && hasSkill(chRef.current, id); }
  function warlockSync() { if (!silentRef.current) { setWarlockState({ ...warlockStateRef.current }); setWarlockEnemyState({ ...warlockEnemyRef.current }); } }
  function warlockResetEnemy() { if (!isWarlock()) return; warlockEnemyRef.current = createWarlockEnemyNameState(); warlockSync(); }
  function warlockLawyer() { return warlockHasSkill('bruxo:pacto:14'); }
  function warlockNode6(path: 'maldicao'|'pacto'|'corrupcao') { return warlockHasSkill(`bruxo:${path}:6`); }
  function warlockCdrBonusFor(id: string): number {
    if (!isWarlock()) return 0;
    const path = id.split(':')[1] as 'maldicao'|'pacto'|'corrupcao';
    return warlockHasSkill(`bruxo:${path}:3`) ? 0.03 : 0;
  }
  function warlockOnEnemyRealAction() {
    if (!isWarlock() || !warlockNode6('maldicao') || !warlockEnemyRef.current.bound) return;
    warlockEnemyRef.current = addNameFragment(warlockEnemyRef.current, 1);
    pushLog('FRAGMENTO DO NOME +1');
    warlockSync();
  }
  function isDruid(){return chRef.current.classId==='druida';}
  function druidSync(){if(!silentRef.current)setDruidCycleState({...druidCycleRef.current,completed:new Set(druidCycleRef.current.completed)});}
  function druidAdvance(){if(!isDruid())return; druidCycleRef.current=advanceDruidSeason(druidCycleRef.current); druidSync();}
  function druidAction(mode:'synced'|'neutral'|'dissonant'='dissonant'){if(!isDruid())return; const synced=mode==='synced'; if(druidCycleRef.current.avatarActions>0)druidCycleRef.current={...druidCycleRef.current,avatarActions:druidCycleRef.current.avatarActions-1}; if(synced)druidGardenRef.current=growGarden(druidGardenRef.current); if(mode==='synced')druidCycleRef.current=markDruidAttunement(druidCycleRef.current); else if(mode==='dissonant' && hasSkill(chRef.current,'druida:equilibrio:6'))druidCycleRef.current=addDruidDissonance(druidCycleRef.current); if(druidCycleRef.current.awakening)druidCycleRef.current={...druidCycleRef.current,awakening:false}; const before=druidCycleRef.current.season; druidCycleRef.current=advanceDruidSeason(druidCycleRef.current); if(before==='winter'&&druidCycleRef.current.perfectYear){druidCycleRef.current={...druidCycleRef.current,renewals:1};druidGardenRef.current=growGarden(druidGardenRef.current);} druidSync();}
  void druidAdvance;

  function archerSync() { setArcherState({ ...archerStateRef.current, arrows: [...archerStateRef.current.arrows] }); }
  function isArcher(): boolean { return chRef.current.classId === 'arqueiro'; }
  function archerHasSkill(id: string): boolean { return isArcher() && hasSkill(chRef.current, id); }
  function archerResetEncounter() {
    archerStateRef.current = createArcherCombatState();
    archerDonoDoEspacoUsedRef.current = false;
    archerAccuracyBuffRef.current = 0; archerEvasionBuffRef.current = 0; archerSpeedBuffRef.current = 0;
    archerDmgTakenBonusRef.current = false;
    archerPerfectCastRef.current = false;
    archerLastActionHitsRef.current = 0;
    archerSync();
  }
  function archerMoveDistance(amount: number, voluntary = true, consumeStepGeneration = true) {
    if (!isArcher() || amount === 0) return false;
    const before = archerStateRef.current.distance;
    const next = archerDistanceShift(archerStateRef.current, amount);
    if (next.distance === before) return false;
    archerStateRef.current = next;
    if (voluntary) {
      const cost = archerHasSkill('arqueiro:instinto:11') ? 8 : 15;
      archerStateRef.current = loseArcherTension(archerStateRef.current, cost);
    }
    if (consumeStepGeneration && archerHasSkill('arqueiro:instinto:6')) archerStateRef.current = gainArcherSteps(archerStateRef.current, 1);
    if (archerHasSkill('arqueiro:instinto:0')) archerEvasionBuffRef.current = Math.min(0.02, attrTotal(chRef.current, 'agi') * 0.0008);
    if (archerHasSkill('arqueiro:instinto:5')) archerDmgTakenBonusRef.current = true;
    archerSync();
    return true;
  }
  const archerDmgTakenBonusRef = useRef(false);
  function archerOnEnemyMiss() {
    if (!isArcher()) return;
    if (archerHasSkill('arqueiro:instinto:6')) archerStateRef.current = gainArcherSteps(archerStateRef.current, 1);
    if (archerHasSkill('arqueiro:instinto:8')) archerStateRef.current = prepareArcherReflex(archerStateRef.current);
    if (archerHasSkill('arqueiro:instinto:2')) archerSpeedBuffRef.current = 0.02;
    archerSync();
  }
  function archerOnEnemyHit() {
    if (!isArcher()) return;
    archerStateRef.current = loseArcherTension(archerStateRef.current, 18);
    const dono = archerHasSkill('arqueiro:instinto:14') && !archerDonoDoEspacoUsedRef.current && archerStateRef.current.distance === 1;
    if (dono) {
      archerDonoDoEspacoUsedRef.current = true;
      archerStateRef.current = gainArcherSteps(prepareArcherReflex(archerStateRef.current), 3);
      archerStateRef.current = accelerateOldestArrow(archerStateRef.current);
    } else if (archerStateRef.current.distance > 0) archerMoveDistance(-1, false, true);
    archerSync();
  }
  function archerResolveFlightWindow(existingIds: number[], immediateReduction = 0) {
    if (!isArcher() || existingIds.length === 0) return;
    const ids = new Set(existingIds);
    const landed = archerStateRef.current.arrows.filter((a) => ids.has(a.id) && a.actionsRemaining - 1 - immediateReduction <= 0)
      .sort((a, b) => a.createdOrder - b.createdOrder);
    archerStateRef.current = {
      ...archerStateRef.current,
      arrows: archerStateRef.current.arrows
        .filter((a) => !ids.has(a.id) || a.actionsRemaining - 1 - immediateReduction > 0)
        .map((a) => ids.has(a.id) ? { ...a, actionsRemaining: a.actionsRemaining - 1 - immediateReduction } : a),
    };
    if (!landed.length) { archerSync(); return; }
    const convergence = landed.length >= 2 ? (1 + Math.min(3, landed.length) * 0.10) : 1;
    for (const arrow of landed) {
      if (enemyRef.current.hp <= 0) break;
      const hit = rollMiss(arrow.accuracy, computeEnemyEvasion()) === false;
      if (!hit) { pushFloat('enemy', 0, false, false, true); continue; }
      const def = computeEnemyDef() * (1 - arrow.defPenPct);
      const r = rollAbilityHit(arrow.atk, def, arrow.dmgMult * convergence, arrow.critChance, arrow.critDmgMult);
      applyEnemyHp(Math.max(0, enemyRef.current.hp - r.dmg));
      pushFloat('enemy', r.dmg, r.crit); flash('enemy');
      if (enemyRef.current.hp <= 0) break;
    }
    if (landed.length >= 2 && archerHasSkill('arqueiro:tiro-rapido:14')) {
      archerStateRef.current = gainArcherCadence(archerStateRef.current, landed.length >= 3 ? 2 : 1);
    }
    archerSync();
    if (enemyRef.current.hp <= 0) resolveEnemyDeath();
  }

  // ── Mago redesign — all session-only. The data is deliberately keyed by
  // mechanic, never ability name: any future spell can participate through
  // AbilityEffect metadata.
  const mageRunesRef = useRef(0);
  const mageHeatRef = useRef(0);
  const mageThermalRef = useRef<ThermalState>('normal');
  const mageThermalTicksRef = useRef(0);
  const mageLastPolarityRef = useRef<'none' | 'positive' | 'negative'>('none');
  const mageCircuitRef = useRef(0);
  const mageResonanceRef = useRef(false);
  const mageInverterPendingRef = useRef(false);
  const mageOverheatUsedThisEnemyRef = useRef(false);
  const mageFirstFireHitThisEnemyRef = useRef(false);
  const mageFirstFrostHitThisEnemyRef = useRef(false);
  const mageFrozenAccuracyPendingRef = useRef(false);
  const mageNextDamageReductionRef = useRef(0);
  const mageFrostBarrierAdvanceRef = useRef(0);
  const mageCurrentCastAmplifiedRef = useRef(false);
  const [mageRunesState, setMageRunesState] = useState(0);
  const [mageHeatState, setMageHeatState] = useState(0);
  const [mageThermalState, setMageThermalState] = useState<ThermalState>('normal');
  const [magePolarityState, setMagePolarityState] = useState<'none' | 'positive' | 'negative'>('none');
  const [mageCircuitState, setMageCircuitState] = useState(0);
  const [mageResonanceState, setMageResonanceState] = useState(false);

  // Guerreiro: Postura lives on EnemyInstance; these are player-side,
  // encounter-only preparations and their display mirrors.
  const warriorPreparedGuardRef = useRef<PreparedGuardState | null>(null);
  const warriorRiposteRef = useRef<RiposteKind>(null);
  const warriorReadingRef = useRef<ReadingKind>(null);
  const warriorFeintReadyRef = useRef(false);
  const warriorNextBasicPostureBonusRef = useRef(false);
  const [warriorPreparedGuardState, setWarriorPreparedGuardState] = useState<PreparedGuardState | null>(null);
  const [warriorRiposteState, setWarriorRiposteState] = useState<RiposteKind>(null);
  const [warriorReadingState, setWarriorReadingState] = useState<ReadingKind>(null);
  const [warriorFeintReadyState, setWarriorFeintReadyState] = useState(false);

  // Necromante: recurso e invocações pertencem à tentativa; stacks/Praga e
  // gates de threshold pertencem ao inimigo atual. Os relógios dos Servos
  // avançam no mesmo envTick usado pelo catch-up, evitando duas simulações.
  const necroSoulsRef = useRef(character.classId === 'necromante' ? 1 : 0);
  const necroDecompositionRef = useRef<EnemyStackInstance | undefined>();
  const necroPlagueRef = useRef<PeriodicEffectInstance | undefined>();
  const necroSummonsRef = useRef<SummonInstance[]>([]);
  const necroSoulThresholdsRef = useRef<Set<number>>(new Set());
  const necroFirstScytheSoulRef = useRef(false);
  const necroFirstSummonRef = useRef(false);
  const necroNaturalExpirySoulRef = useRef(false);
  const necroReaperDiscountRef = useRef(false);
  const necroNextMagicBonusRef = useRef<{ ticks: number; dmgPct: number; critDmgPct: number } | null>(null);
  const necroRetributionStacksRef = useRef(0);
  const necroDeathVeilTicksRef = useRef(0);
  const necroVigorTicksRef = useRef(0);
  const [necroSoulsState, setNecroSoulsState] = useState(necroSoulsRef.current);
  const [necroDecompositionState, setNecroDecompositionState] = useState<EnemyStackInstance | undefined>();
  const [necroPlagueState, setNecroPlagueState] = useState<PeriodicEffectInstance | undefined>();
  const [necroSummonsState, setNecroSummonsState] = useState<SummonInstance[]>([]);

  // Ladino: todos os estados são da tentativa/inimigo e vivem fora do
  // Character persistido. Quick resolve dentro da Main, sem envTick extra.
  const rogueStealthRef = useRef(character.classId === 'ladino' && character.unlockedSkills.includes('ladino:veneno:14'));
  const rogueStealthMainLeftRef = useRef(character.classId === 'ladino' && character.unlockedSkills.includes('ladino:veneno:14') ? ROGUE_STEALTH_MAIN_LIMIT : 0);
  const rogueExposedMainLeftRef = useRef(0);
  const rogueToxicBladeMainLeftRef = useRef(0);
  const rogueToxinRef = useRef<PeriodicEffectInstance | undefined>();
  const rogueImagesRef = useRef(0);
  const rogueSharpenedEchoRef = useRef(false);
  const roguePreparedTrickRef = useRef<RoguePreparedTrick | null>(null);
  const rogueAdvantageRef = useRef(false);
  const rogueNextMainAccuracyRef = useRef(false);
  const rogueFlowUntouchableRef = useRef(false);
  const rogueFirstQuickEvasionRef = useRef(false);
  const rogueFirstAmbushRef = useRef(false);
  const rogueFirstTrickRef = useRef(false);
  const rogueQuickWindowRef = useRef(false);
  const rogueTimeStolenRef = useRef(false);
  const rogueEnemyDmgDebuffRef = useRef(0);
  const [rogueStealthState, setRogueStealthState] = useState(rogueStealthRef.current);
  const [rogueExposedState, setRogueExposedState] = useState(0);
  const [rogueToxinState, setRogueToxinState] = useState<PeriodicEffectInstance | undefined>();
  const [rogueImagesState, setRogueImagesState] = useState(0);
  const [rogueSharpenedEchoState, setRogueSharpenedEchoState] = useState(false);
  const [roguePreparedTrickState, setRoguePreparedTrickState] = useState<RoguePreparedTrick | null>(null);
  const [rogueAdvantageState, setRogueAdvantageState] = useState(false);
  const [rogueTimeStolenState, setRogueTimeStolenState] = useState(false);

  // Paladino: Virtudes/Convicção existem somente dentro da Liturgia atual.
  // Vereditos tiram um snapshot e limpam o estado no início do cast; Égide
  // é uma proteção própria, posterior à mitigação e anterior a barreiras.
  const paladinLiturgyRef = useRef<PaladinLiturgyState>(createPaladinLiturgyState());
  const paladinAegisRef = useRef<PaladinAegis | null>(null);
  const paladinAegisBonusPendingRef = useRef(false);
  const paladinVotoMantidoUsedRef = useRef(false);
  const paladinMercyDutyUsedRef = useRef(false);
  const paladinAegisPerfectUsedEnemyRef = useRef(false);
  const paladinNextOffenseBuffTicksRef = useRef(0);
  const paladinLawHammerTicksRef = useRef(0);
  const [paladinLiturgyState, setPaladinLiturgyState] = useState(paladinLiturgyRef.current);
  const [paladinAegisState, setPaladinAegisState] = useState<PaladinAegis | null>(null);

  const heroSpr = heroSprites(ch.classId);

  // onLiveUpdate persists to storage/cloud — skipped mid-catch-up (which can
  // touch chRef hundreds of times in one synchronous pass) in favor of a
  // single call with the final state once runCatchUp finishes.
  // Última Guarda (cavaleiro:bastiao:10) floors HP at 1 for its whole
  // window regardless of which source dropped it there (direct hit, DOT
  // tick, thorns) — checked centrally here since every HP change on the
  // player funnels through this one setter.
  function updateCh(next: Character) {
    if (next.hp <= 0 && isKnight() && knightLastGuardActive()) next = { ...next, hp: 1 };
    chRef.current = next; setCh(next); if (!silentRef.current) onLiveUpdate(next);
  }
  function updateEnemy(next: EnemyInstance) { enemyRef.current = next; setEnemy(next); }

  // Every hp-reducing hit on the enemy (the player's own attack, thorns
  // reflection, a DOT tick) routes through here instead of calling
  // updateEnemy directly, so a boss's phases (see BossPhase in
  // types/game.ts) can never be skipped depending on which of those three
  // sources happened to land the crossing blow. Each threshold only ever
  // fires once (bossPhaseIndexRef only moves forward), and a single big hit
  // that jumps past more than one threshold at once fires them all in order.
  function applyEnemyHp(hp: number) {
    const current = enemyRef.current;
    if (chRef.current.classId === 'necromante' && hp < current.hp) {
      const threshold = soulsForCrossedThresholds(current.hp, hp, current.maxHp, necroSoulThresholdsRef.current);
      necroSoulThresholdsRef.current = threshold.crossed;
      if (threshold.gained > 0) {
        necroGainSouls(threshold.gained, true);
        if (threshold.crossed.has(0.25) && necroHasSkill('necromante:ceifador:14') && !necroReaperDiscountRef.current) {
          necroGainSouls(1); necroReaperDiscountRef.current = true;
        }
      }
    }
    let next: EnemyInstance = { ...current, hp };
    const phases = current.phases;
    if (phases && hp > 0) {
      while (bossPhaseIndexRef.current < phases.length && hp / current.maxHp <= phases[bossPhaseIndexRef.current].hpPct) {
        const p = phases[bossPhaseIndexRef.current];
        bossPhaseIndexRef.current += 1;
        pushLog(`✦ ${p.transitionMsg}`);
        setBossPhaseName(p.name);
        if (p.atkMult) { enemyModsRef.current = [...enemyModsRef.current, { stat: 'atk', pct: p.atkMult - 1, roundsLeft: 999 }]; syncEnemyMods(); }
        if (p.extraAbilities?.length) next = { ...next, abilities: [...(next.abilities ?? []), ...p.extraAbilities] };
        if (p.cc && !playerImmune()) {
          playerCCRef.current.push({ kind: p.cc, roundsLeft: p.ccRounds ?? 1 });
          syncPlayerCC();
          pushLog(`Você ficou ${CC_LABEL[p.cc].toLowerCase()}!`);
        }
      }
    }
    updateEnemy(next);
  }

  function updateDepth(next: number) { depthRef.current = next; setDepth(next); }
  // All seven mirror a ref into displayed React state purely for the UI —
  // pointless (and, at catch-up volume, wasteful) while nothing is on
  // screen to show it to.
  function syncEnemyStatuses() { if (!silentRef.current) setEnemyStatuses(enemyStatusRef.current.map((s) => s.kind)); }
  function syncPlayerStatuses() { if (!silentRef.current) setPlayerStatuses(playerStatusRef.current.map((s) => s.kind)); }
  function syncEnemyCC() { if (!silentRef.current) setEnemyCCState(enemyCCRef.current.map((c) => c.kind)); }
  function syncPlayerCC() { if (!silentRef.current) setPlayerCCState(playerCCRef.current.map((c) => c.kind)); }
  function syncPlayerMods() { if (!silentRef.current) setPlayerModsState([...playerModsRef.current]); }
  function syncEnemyMods() { if (!silentRef.current) setEnemyModsState([...enemyModsRef.current]); }
  function syncShield() { if (!silentRef.current) setPlayerShieldState(playerShieldRef.current); }

  // The combat log, damage floaters, and hit-flash are all pure on-screen
  // feedback for something the player is watching happen live — none of it
  // means anything during a silent catch-up pass (see runCatchUp), which
  // ends with its own summary instead. Skipping them there also avoids
  // hundreds of pointless setState/setTimeout calls in one synchronous loop.
  function pushLog(line: string | LogLine) {
    if (silentRef.current) return;
    const segments = typeof line === 'string' ? [{ text: line }] : line;
    setLog((l) => [...l.slice(-4), segments]);
  }
  function pushFloat(side: 'player' | 'enemy', value: number, crit: boolean, blocked?: boolean, miss?: boolean, heal?: boolean) {
    if (silentRef.current) return;
    if (heal && value <= 0) return;
    const id = floaterId.current++;
    setFloaters((f) => {
      // Lowest slot not already held by a still-visible floater on this same
      // side — reused the instant its previous occupant's timeout clears it.
      const used = new Set(f.filter((x) => x.side === side).map((x) => x.slot));
      let slot = 0;
      while (used.has(slot)) slot++;
      return [...f, { id, side, value, crit, blocked, miss, heal, slot }];
    });
    setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), FLOAT_DURATION_MS);
  }
  // The name+icon(+amount) callout over the middle of the canvas whenever
  // either side actually uses a named ability — see AbilityCastFx's own
  // comment for why this exists alongside pushFloat instead of replacing it:
  // a damage/heal ability still gets its usual floater over the
  // player/enemy sprite too, this just additionally names what caused it
  // front-and-center instead of that only ever being legible in the log.
  function pushAbilityCast(side: 'player' | 'enemy', name: string, icon: CSSProperties | null, value: number | null, heal: boolean) {
    if (silentRef.current) return;
    const id = floaterId.current++;
    setAbilityCasts((a) => [...a, { id, side, name, icon, value, heal }]);
    setTimeout(() => setAbilityCasts((a) => a.filter((x) => x.id !== id)), ABILITY_CAST_DURATION_MS);
  }
  function flash(side: 'player' | 'enemy') {
    if (silentRef.current) return;
    setFlashSide(side);
    setTimeout(() => { if (mountedRef.current) setFlashSide(null); }, 150);
  }
  function pushGoldSteal(amount: number) {
    if (silentRef.current || amount <= 0) return;
    const id = floaterId.current++;
    setGoldSteals((g) => [...g, { id, amount }]);
    playBuySellSfx();
    setTimeout(() => setGoldSteals((g) => g.filter((x) => x.id !== id)), FLOAT_DURATION_MS);
  }

  // Three independent clocks instead of one shared round: envTick owns every
  // duration-based decay (cooldowns, DOT, buffs/debuffs, CC, regen) on the
  // original fixed cadence so none of that balance shifts, while the player
  // and enemy each act on their own pace. The player's pace shortens with
  // AGI (stats.speedPct) — a fast build genuinely gets more actions in than
  // a slow one, not just better odds to dodge/block. The enemy's own pace
  // now shortens/lengthens the same way, keyed off its shape (see
  // enemySpeedMult in lib/enemies.ts) — a bat swarm or crow visibly
  // out-paces a stone golem instead of every shape sharing one identical
  // cadence.
  // All three no-op while silentRef is up — runCatchUp drives playerAct/
  // enemyAct/envTick directly in a tight synchronous loop instead, and none
  // of them should also queue a real setTimeout that would otherwise fire
  // (and double up on) an action a moment after catch-up already resolved it.
  function scheduleEnv(delay = ATTACK_INTERVAL) {
    if (silentRef.current) return;
    const cGen = catchUpGenRef.current;
    setTimeout(() => {
      if (!mountedRef.current) return;
      if (cGen !== catchUpGenRef.current) return; // stale timer from before a catch-up pass
      if (!pausedRef.current && phaseRef.current === 'fight') envTick();
    }, delay);
  }

  function schedulePlayer(delay: number) {
    if (silentRef.current) return;
    const cGen = catchUpGenRef.current;
    setPlayerRoundMs(delay);
    setPlayerRoundKey((k) => k + 1);
    setTimeout(() => {
      if (!mountedRef.current) return;
      if (cGen !== catchUpGenRef.current) return; // stale timer from before a catch-up pass
      if (!pausedRef.current && phaseRef.current === 'fight') playerAct();
    }, delay);
  }

  function scheduleEnemy(delay = nextEnemyDelay()) {
    if (silentRef.current) return;
    // Congelado delays exactly the next real enemy action.  The delay is
    // attached to the scheduler (rather than repeatedly applied on every
    // reapplication of Gelo), so it cannot stack while the target is frozen.
    if (isMage() && mageThermalRef.current === 'frozen') delay = Math.round(delay * 1.25);
    const gen = enemyGenRef.current;
    const cGen = catchUpGenRef.current;
    setEnemyRoundMs(delay);
    setEnemyRoundKey((k) => k + 1);
    setTimeout(() => {
      if (!mountedRef.current) return;
      if (gen !== enemyGenRef.current) return; // stale timer from an enemy that's already gone
      if (cGen !== catchUpGenRef.current) return; // stale timer from before a catch-up pass
      if (!pausedRef.current && phaseRef.current === 'fight') enemyAct();
    }, delay);
  }

  function nextPlayerDelay(): number {
    const speedPct = computePlayerStats().speedPct;
    const frenzySpeedBonus = isBarbaro() && barbFrenzyRef.current ? FRENZY_SPEED_BONUS : 0;
    return Math.round(ATTACK_INTERVAL / ((1 + speedPct + frenzySpeedBonus) * CLASS_SPEED_MULT[chRef.current.classId]));
  }

  function nextEnemyDelay(): number {
    return Math.round(ATTACK_INTERVAL / enemySpeedMult(enemyRef.current.shape));
  }

  function tryDropEquipment(guaranteed = false) {
    const stats = computeCombatStats(chRef.current);
    if (!guaranteed) {
      const chance = Math.min(0.6, baseDropChanceForLevel(dungeon.levelReq) * (dungeon.dropMult ?? 1) + stats.dropChanceBonusPct);
      if (Math.random() >= chance) return;
    }
    const availableSlots = OFFHAND_KIND[chRef.current.classId] ? DROP_SLOTS : DROP_SLOTS.filter((s) => s !== 'offhand');
    const slot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
    // Um Alvo de Caçada é bem mais difícil que o chefe normal do seu nível
    // (ver HUNT_STAT_MULT em lib/enemies.ts) — a recompensa precisa refletir
    // isso: em vez da rolagem normal de raridade, força pelo menos Raro,
    // com uma chance real de Épico ou até Lendário.
    // A guaranteed drop (boss/elite kill) always rolls from the boss rarity
    // table instead of the one regular trash uses — see pickBossDropRarity's
    // own comment in lib/equipment.ts. Hunt bosses still get their own
    // even-higher floor. Both tables key off this dungeon's own
    // difficultyProgress (0-1, from its difficultyMult), not its coarser
    // itemTier — see difficultyProgress's own comment in lib/dungeons.ts for
    // why (several dungeons share an itemTier; none share a difficultyMult).
    const qualityBonusPct = stats.itemQualityBonusPct;
    const progress = difficultyProgress(dungeon);
    const forcedRarity = dungeon.isHunt ? pickHuntDropRarity() : guaranteed ? pickBossDropRarity(progress, qualityBonusPct) : undefined;
    const item = generateItem(slot, chRef.current.classId, dungeon.itemTier, qualityBonusPct, forcedRarity, progress);
    runStatsRef.current.itemsDropped += 1;

    // "Vender Automático" (armado na tela de preparação) — o item nem passa
    // pelo inventário, vai direto pro ouro. Não compete pelo espaço da
    // mochila, então o "inventário cheio" abaixo nunca se aplica a ele.
    if (autoSellRarities?.includes(item.rarity)) {
      const gold = sellValue(item);
      updateCh({ ...chRef.current, gold: chRef.current.gold + gold });
      runStatsRef.current.itemsAutoSold += 1;
      runStatsRef.current.goldFromAutoSell += gold;
      pushLog([
        { text: 'Você encontrou: ' },
        { text: itemDisplayName(item), color: rarityColor(item.rarity) },
        { text: ` — vendido automaticamente por ${gold} de ouro.` },
      ]);
      return;
    }

    if (!canFitInInventory(chRef.current.inventory, slot)) {
      pushLog('Inventário cheio — o item foi perdido.');
      return;
    }
    updateCh({ ...chRef.current, inventory: placeInInventory(chRef.current.inventory, item) });
    pushLog([
      { text: 'Você encontrou: ' },
      { text: itemDisplayName(item), color: rarityColor(item.rarity) },
      { text: '!' },
    ]);
  }

  // Rolled independently of tryDropEquipment (a separate chance, not
  // competing with the equipment roll) — see RUNE_DROP_CHANCE_REGULAR/BOSS
  // in lib/runes.ts. Runas stack by (rarity, tier), never occupy inventory
  // grid space, so there's no "inventário cheio" case to handle here.
  function tryDropRune(guaranteed = false) {
    const chance = guaranteed ? RUNE_DROP_CHANCE_BOSS : RUNE_DROP_CHANCE_REGULAR;
    if (Math.random() >= chance) return;
    const drop = rollRuneDrop(dungeon.itemTier);
    updateCh({ ...chRef.current, runes: addRune(chRef.current.runes, drop) });
    pushLog([
      { text: 'Você encontrou: ' },
      { text: `Runa de Aprimoramento (Tier ${drop.tier})`, color: rarityColor(drop.rarity) },
      { text: ` — ${rarityName(drop.rarity)}!` },
    ]);
  }

  function conditionMet(ability: AbilityDef): boolean {
    const cond = ability.condition;
    // hpBelow's own player-customizable threshold (abilityThresholds) is a
    // per-ability override no generic leaf could express — resolved here,
    // same as before, then everything (including hpBelow itself, composed
    // inside all/any/not) delegates to the shared evaluator in
    // lib/barbarian.ts so Bárbaro's resource/state-gated kit and any future
    // class's composed conditions share one evaluator.
    const threshold = chRef.current.abilityThresholds[ability.id] ?? cond.pct ?? 0.5;
    const ctx: AbilityConditionContext = {
      hp: chRef.current.hp,
      maxHp: effectiveMaxHp(chRef.current),
      enemyHp: enemyRef.current.hp,
      enemyMaxHp: enemyRef.current.maxHp,
      enemyStatuses: enemyStatusRef.current.map((s) => s.kind),
      selfDebuffed: playerStatusRef.current.length > 0 || playerCCRef.current.length > 0 || playerModsRef.current.some((m) => m.pct < 0),
      resources: {
        fury: barbFuryRef.current, faith: clerigoFaithRef.current,
        determination: knightDeterminationRef.current, momentum: knightMomentumRef.current, orders: knightOrdersRef.current,
        heat: mageHeatRef.current,
        souls: necroSoulsRef.current,
        conviction: paladinConviction(paladinLiturgyRef.current.virtues),
        distance: archerStateRef.current.distance,
        tension: archerStateRef.current.tension,
        cadence: archerStateRef.current.cadence,
        steps: archerStateRef.current.steps,
        flightCount: archerStateRef.current.arrows.length,
        debt: warlockStateRef.current.debt,
        credit: warlockStateRef.current.credit,
        scars: warlockStateRef.current.scars,
        nameFragments: warlockEnemyRef.current.nameFragments,
      },
      states: {
        frenzy: barbFrenzyRef.current, consecration: clerigoConsecrationActive(), commandSupreme: knightCommandSupremeRef.current,
        thermal: mageThermalRef.current !== 'normal', stealth: rogueStealthRef.current,
        toxicBlade: rogueToxicBladeMainLeftRef.current > 0,
        reverseWasted: rogueImagesRef.current >= ROGUE_IMAGE_MAX && rogueSharpenedEchoRef.current,
        justice: paladinLiturgyRef.current.virtues.justice,
        courage: paladinLiturgyRef.current.virtues.courage,
        mercy: paladinLiturgyRef.current.virtues.mercy,
        liturgy: paladinLiturgyRef.current.actionsLeft > 0,
        aegis: paladinAegisRef.current !== null,
        fullDraw: archerStateRef.current.tension >= 100,
        perfectRhythm: archerStateRef.current.perfectRhythm,
        reflex: archerStateRef.current.reflexActionsLeft > 0,
        deadline: warlockStateRef.current.debt >= 6,
        bound: warlockEnemyRef.current.bound,
        trueName: warlockEnemyRef.current.nameFragments >= 3,
        forgery: warlockStateRef.current.forgeryReady,
        scarInsight: warlockStateRef.current.scarInsightReady,
      },
      enemyStacks: { wounds: barbEnemyWoundStacks(), judgment: clerigoEnemyJudgmentStacks(), decomposition: necroDecompositionRef.current?.stacks ?? 0 },
      painPct: barbPainTotal() / effectiveMaxHp(chRef.current),
      enemyPosture: isWarrior() ? warriorEnemyState().current : undefined,
      enemyPostureBand: isWarrior() ? postureBand(warriorEnemyState().current) : undefined,
      guardBroken: isWarrior() ? warriorEnemyState().guardBroken : false,
      riposteReady: isWarrior() ? warriorRiposteRef.current !== null : false,
      periodicEffects: { [PLAGUE_EFFECT_ID]: necroPlagueRef.current !== undefined },
      summonCount: necroSummonsRef.current.length,
      summonMax: necroMaxSummons(),
      isStealthed: rogueStealthRef.current,
      enemyExposed: rogueExposedMainLeftRef.current > 0,
      imageCount: rogueImagesRef.current,
      advantageReady: rogueAdvantageRef.current,
      preparedTrick: roguePreparedTrickRef.current?.kind ?? null,
      quickWindow: rogueQuickWindowRef.current,
    };
    if (cond.type === 'hpBelow') return ctx.hp / ctx.maxHp < threshold;
    return evalAbilityCondition(cond, ctx);
  }
  function isRogue(): boolean { return chRef.current.classId === 'ladino'; }
  function rogueHasSkill(id: string): boolean { return isRogue() && hasSkill(chRef.current, id); }
  function rogueSync() {
    if (silentRef.current) return;
    setRogueStealthState(rogueStealthRef.current);
    setRogueExposedState(rogueExposedMainLeftRef.current);
    setRogueToxinState(rogueToxinRef.current ? { ...rogueToxinRef.current } : undefined);
    setRogueImagesState(rogueImagesRef.current);
    setRogueSharpenedEchoState(rogueSharpenedEchoRef.current);
    setRoguePreparedTrickState(roguePreparedTrickRef.current ? { ...roguePreparedTrickRef.current } : null);
    setRogueAdvantageState(rogueAdvantageRef.current);
    setRogueTimeStolenState(rogueTimeStolenRef.current);
  }
  function rogueCdrBonusFor(ab: AbilityDef): number {
    if (!isRogue()) return 0;
    if (ab.effect.roguePath === 'assassin' && rogueHasSkill('ladino:veneno:3')) return 0.03;
    if (ab.effect.roguePath === 'blade' && rogueHasSkill('ladino:sombras:3')) return 0.03;
    if (ab.effect.roguePath === 'trickster' && rogueHasSkill('ladino:laminas:3')) return 0.03;
    return 0;
  }
  function rogueEnterStealth() {
    rogueStealthRef.current = true;
    rogueStealthMainLeftRef.current = ROGUE_STEALTH_MAIN_LIMIT;
    rogueSync();
  }
  function roguePrepareTrick(kind: 'feint' | 'loaded_die', sourceAbilityId: string) {
    const bonus = (rogueHasSkill('ladino:laminas:3') ? 1 : 0) + (!rogueFirstTrickRef.current && rogueHasSkill('ladino:laminas:0') ? 1 : 0);
    rogueFirstTrickRef.current = true;
    roguePreparedTrickRef.current = prepareTrick(kind, sourceAbilityId, 3 + bonus);
    rogueSync();
  }
  function roguePlanB(trick: RoguePreparedTrick) {
    if (!rogueHasSkill('ladino:laminas:8')) return;
    cooldownsRef.current[trick.sourceAbilityId] = Math.max(0, (cooldownsRef.current[trick.sourceAbilityId] ?? 0) - 1);
  }
  function rogueReduceHighestPriorityQuickCooldown() {
    const quick = equippedAbilities().find((ab) => ab.actionType === 'quick' && (cooldownsRef.current[ab.id] ?? 0) > 0);
    if (quick) cooldownsRef.current[quick.id] = Math.max(0, (cooldownsRef.current[quick.id] ?? 0) - 1);
  }
  function rogueStealTime() {
    if (rogueTimeStolenRef.current) return;
    rogueTimeStolenRef.current = true;
    rogueReduceHighestPriorityQuickCooldown();
    // Invalida o timer inimigo atual e o agenda novamente com o ticket de
    // atraso. O ticket só é limpo quando essa ação efetivamente acontece.
    enemyGenRef.current += 1;
    scheduleEnemy(Math.round(nextEnemyDelay() * (1 + ROGUE_TIME_STEAL_DELAY)));
    rogueSync();
  }
  function rogueAdvanceMainDurations(offensive: boolean, exposedAtStart: boolean, toxicAtStart: boolean, trickAtStart: boolean) {
    if (exposedAtStart && rogueExposedMainLeftRef.current > 0) rogueExposedMainLeftRef.current -= 1;
    if (toxicAtStart && rogueToxicBladeMainLeftRef.current > 0) rogueToxicBladeMainLeftRef.current -= 1;
    if (trickAtStart && roguePreparedTrickRef.current?.kind === 'feint') {
      roguePreparedTrickRef.current.actionsLeft -= 1;
      if (roguePreparedTrickRef.current.actionsLeft <= 0) roguePreparedTrickRef.current = null;
    }
    if (rogueStealthRef.current && !offensive) {
      rogueStealthMainLeftRef.current -= 1;
      if (rogueStealthMainLeftRef.current <= 0) rogueStealthRef.current = false;
    }
    rogueFirstQuickEvasionRef.current = false;
    rogueFlowUntouchableRef.current = false;
    rogueSync();
  }
  function isPaladin(): boolean { return chRef.current.classId === 'paladino'; }
  function paladinHasSkill(id: string): boolean { return isPaladin() && hasSkill(chRef.current, id); }
  function paladinSync() {
    if (silentRef.current) return;
    setPaladinLiturgyState({ ...paladinLiturgyRef.current, virtues: { ...paladinLiturgyRef.current.virtues } });
    setPaladinAegisState(paladinAegisRef.current ? { ...paladinAegisRef.current } : null);
  }
  function paladinCdrBonusFor(ab: AbilityDef): number {
    if (!isPaladin()) return 0;
    const path = ab.effect.paladinPath;
    if (path === 'aegis' && paladinHasSkill('paladino:voto:3')) return 0.03;
    if (path === 'verdict' && paladinHasSkill('paladino:martelo:3')) return 0.03;
    if (path === 'redemption' && paladinHasSkill('paladino:luz:2')) return 0.03;
    return 0;
  }
  function paladinHeal(raw: number, active = false): number {
    const maxHp = effectiveMaxHp(chRef.current);
    const before = chRef.current.hp;
    const next = Math.min(maxHp, before + Math.max(0, Math.round(raw)));
    updateCh({ ...chRef.current, hp: next });
    const actual = next - before;
    if (actual > 0) pushFloat('player', actual, false, undefined, undefined, true);
    if (active && actual >= maxHp * 0.08 && paladinHasSkill('paladino:luz:8')) paladinNextOffenseBuffTicksRef.current = 2;
    return actual;
  }
  function paladinInvoke(virtue: PaladinVirtue) {
    const wasEmpty = paladinConviction(paladinLiturgyRef.current.virtues) === 0;
    if (wasEmpty) { paladinVotoMantidoUsedRef.current = false; paladinMercyDutyUsedRef.current = false; }
    paladinLiturgyRef.current = invokePaladinVirtue(paladinLiturgyRef.current, virtue);
    if (virtue === 'mercy' && paladinHasSkill('paladino:luz:6') && !paladinMercyDutyUsedRef.current
      && chRef.current.hp / effectiveMaxHp(chRef.current) < 0.60) {
      paladinMercyDutyUsedRef.current = true;
      paladinHeal(effectiveMaxHp(chRef.current) * 0.03, false);
    }
    paladinSync();
  }
  function paladinInvokeAbility(ab: AbilityDef) {
    for (const virtue of ab.effect.paladinVirtues ?? []) {
      paladinInvoke(virtue);
      if (virtue === 'courage' && ab.effect.paladinPath === 'aegis' && paladinHasSkill('paladino:voto:2')) paladinAegisBonusPendingRef.current = true;
    }
    const extra = ab.effect.paladinExtraVirtueBelowHp;
    if (extra && chRef.current.hp / effectiveMaxHp(chRef.current) < extra.pct) {
      paladinInvoke(extra.virtue);
      if (extra.virtue === 'courage' && ab.effect.paladinPath === 'aegis' && paladinHasSkill('paladino:voto:2')) paladinAegisBonusPendingRef.current = true;
    }
  }
  function paladinMakeAegis(reductionPct: number, maxHpCapPct: number, hits = 1, duration = 3) {
    const hpPct = chRef.current.hp / effectiveMaxHp(chRef.current);
    let reduction = reductionPct + (paladinAegisBonusPendingRef.current ? 0.03 : 0);
    if (hpPct < 0.40 && paladinHasSkill('paladino:voto:7')) reduction += 0.05;
    let cap = maxHpCapPct;
    if (paladinHasSkill('paladino:voto:0')) cap += paladinAegisAttributeCapBonus(attrTotal(chRef.current, 'vit'));
    if (paladinHasSkill('paladino:voto:5')) cap += paladinAegisAttributeCapBonus(attrTotal(chRef.current, 'wis'));
    paladinAegisRef.current = createPaladinAegis('paladino:aegis', reduction, cap, hits, duration);
    paladinAegisBonusPendingRef.current = false;
    paladinSync();
  }
  function paladinReduceHighestRedemptionCooldown() {
    const target = equippedAbilities().find((x) => x.effect.paladinPath === 'redemption' && (cooldownsRef.current[x.id] ?? 0) > 0);
    if (target) cooldownsRef.current[target.id] = Math.max(0, (cooldownsRef.current[target.id] ?? 0) - 1);
  }
  function paladinFinishVerdict(snapshot: PaladinVerdictSnapshot, ab: AbilityDef) {
    const entry = ab.effect.verdictAegisByConviction?.[snapshot.conviction as 1 | 2 | 3];
    if (entry) paladinMakeAegis(entry.reductionPct, entry.maxHpCapPct, snapshot.full && snapshot.regent === 'courage' ? 2 : 1, 3);
    else if (snapshot.full && snapshot.regent === 'courage') paladinMakeAegis(0.50, 0.16, 2, 3);
    if (snapshot.full && snapshot.regent === 'mercy') paladinHeal((effectiveMaxHp(chRef.current) - chRef.current.hp) * 0.08, true);
  }
  function isMage(): boolean { return chRef.current.classId === 'mago'; }
  function isNecromancer(): boolean { return chRef.current.classId === 'necromante'; }
  function necroHasSkill(id: string): boolean { return isNecromancer() && hasSkill(chRef.current, id); }
  function necroSync() {
    if (silentRef.current) return;
    setNecroSoulsState(necroSoulsRef.current);
    setNecroDecompositionState(necroDecompositionRef.current ? { ...necroDecompositionRef.current } : undefined);
    setNecroPlagueState(necroPlagueRef.current ? { ...necroPlagueRef.current } : undefined);
    setNecroSummonsState(necroSummonsRef.current.map((s) => ({ ...s })));
  }
  function necroMetric<K extends keyof NonNullable<RunStats['necromancer']>>(key: K, amount: number) {
    const current = runStatsRef.current.necromancer ?? { directDamage: 0, plagueDamage: 0, servantDamage: 0, servantsSummoned: 0, servantAttacks: 0, servantsSacrificed: 0, soulsGenerated: 0, soulsSpent: 0, soulsLostAtCap: 0, soulsCarried: 0, decompositionSamples: 0, decompositionTotal: 0, ticksAtFive: 0, plaguesApplied: 0, plaguesDetonated: 0, apocalypses: 0, reaps: 0, healing: 0, barriers: 0, deaths: 0 };
    runStatsRef.current.necromancer = { ...current, [key]: current[key] + amount };
  }
  function necroGainSouls(amount: number, fromThreshold = false) {
    const before = necroSoulsRef.current;
    necroSoulsRef.current = clampResource(before + amount);
    necroMetric('soulsGenerated', necroSoulsRef.current - before);
    necroMetric('soulsLostAtCap', Math.max(0, amount - (necroSoulsRef.current - before)));
    if (necroSoulsRef.current > before && (necroHasSkill('necromante:ceifador:5') || (fromThreshold && necroHasSkill('necromante:ceifador:6')))) {
      necroNextMagicBonusRef.current = { ticks: 2, dmgPct: necroHasSkill('necromante:ceifador:5') ? capped(0.00075, attrTotal(chRef.current, 'int'), 0.03) : 0, critDmgPct: fromThreshold && necroHasSkill('necromante:ceifador:6') ? Math.min(0.16, amount * 0.08) : 0 };
    }
    necroSync();
  }
  function necroSpendSouls(amount: number): number {
    const paid = Math.min(necroSoulsRef.current, Math.max(0, amount));
    necroSoulsRef.current -= paid;
    necroMetric('soulsSpent', paid);
    if (paid > 0 && necroHasSkill('necromante:ceifador:8')) {
      const baseline = CLASSES[chRef.current.classId].baseHp + (chRef.current.level - 1) * 5;
      const heal = Math.round(Math.min(0.0225, paid * 0.0075) * baseline * (1 + computePlayerStats().supportPowerPct));
      updateCh({ ...chRef.current, hp: Math.min(effectiveMaxHp(chRef.current), chRef.current.hp + heal) });
      pushFloat('player', heal, false, undefined, undefined, true);
    }
    necroSync(); return paid;
  }
  function necroMaxSummons(): number { return necroHasSkill('necromante:drenar-vida:6') ? 2 : 1; }
  function necroSummonAttacks(): number { return necroHasSkill('necromante:drenar-vida:14') ? 5 : 4; }
  function necroSummonOne(sourceAbilityId: string, requestedAttacks?: number) {
    if (necroSummonsRef.current.length >= necroMaxSummons()) return false;
    let attacks = requestedAttacks ?? necroSummonAttacks();
    if (!necroFirstSummonRef.current && necroHasSkill('necromante:drenar-vida:5') && attrTotal(chRef.current, 'wis') >= 20) attacks += 1;
    necroFirstSummonRef.current = true;
    const speed = necroHasSkill('necromante:drenar-vida:7') ? capped(0.003, attrTotal(chRef.current, 'wis'), 0.06) : 0;
    necroSummonsRef.current.push(makeBoneServant(`bone-${Date.now()}-${necroSummonsRef.current.length}`, sourceAbilityId, attacks, speed));
    necroMetric('servantsSummoned', 1);
    necroSync(); return true;
  }
  function necroSacrificeOldest(voluntary = true): SummonInstance | undefined {
    const summon = necroSummonsRef.current.shift();
    if (summon && voluntary) necroMetric('servantsSacrificed', 1);
    if (summon && voluntary && necroHasSkill('necromante:drenar-vida:11')) necroVigorTicksRef.current = 2;
    necroSync(); return summon;
  }
  function necroApplyDecomposition(amount: number) { necroDecompositionRef.current = applyEnemyStack(necroDecompositionRef.current, amount); necroSync(); }
  function necroApplyPlague(sourceId: string, stats: ReturnType<typeof computePlayerStats>, multiplier: number, duration: number) {
    const essence = necroHasSkill('necromante:decomposicao:7') ? 0.01 : 0;
    const extraDuration = necroHasSkill('necromante:decomposicao:1') && attrTotal(chRef.current, 'wis') >= 20 ? 1 : 0;
    necroPlagueRef.current = { id: PLAGUE_EFFECT_ID, sourceId, snapshotPower: stats.matk, dmgMultiplier: multiplier + essence, ticksRemaining: duration + extraDuration, tags: ['dot', 'necrotic', 'plague'], canCrit: false, bypassDefense: true };
    necroMetric('plaguesApplied', 1);
    necroSync();
  }
  function necroCdrBonusFor(ability: AbilityDef): number {
    if (!isNecromancer() || ability.effect.necromancerTag !== 'decomposition' || !necroHasSkill('necromante:decomposicao:5')) return 0;
    return necroPlagueRef.current && attrTotal(chRef.current, 'wis') >= 18 ? 0.05 : 0.03;
  }
  function isWarrior(): boolean { return chRef.current.classId === 'guerreiro'; }
  function warriorHasSkill(id: string): boolean { return isWarrior() && hasSkill(chRef.current, id); }
  function warriorEnemyState(): WarriorEnemyState {
    if (!enemyRef.current.warrior) enemyRef.current = { ...enemyRef.current, warrior: createWarriorEnemyState() };
    return enemyRef.current.warrior!;
  }
  function warriorCommitEnemy(next: WarriorEnemyState) {
    updateEnemy({ ...enemyRef.current, warrior: next });
  }
  function warriorSyncPlayer() {
    if (silentRef.current) return;
    setWarriorPreparedGuardState(warriorPreparedGuardRef.current ? { ...warriorPreparedGuardRef.current } : null);
    setWarriorRiposteState(warriorRiposteRef.current);
    setWarriorReadingState(warriorReadingRef.current);
    setWarriorFeintReadyState(warriorFeintReadyRef.current);
  }
  function warriorEndGuardBreak() {
    if (!isWarrior()) return;
    const state = warriorEnemyState();
    if (!state.guardBroken) return;
    warriorCommitEnemy({
      ...state,
      current: warriorHasSkill('guerreiro:furioso:14') ? GUARD_BREAK_RESET_VANGUARD : GUARD_BREAK_RESET,
      guardBroken: false, offensiveActionsLeft: 0, ticksLeft: 0,
      perfectCounterAccuracyPending: false,
    });
    pushLog('Guarda recomposta.');
  }
  function warriorTriggerGuardBreak(extraActions = 0) {
    const state = warriorEnemyState();
    if (state.guardBroken) return;
    warriorCommitEnemy({
      ...state, current: 0, guardBroken: true,
      offensiveActionsLeft: Math.min(GUARD_BREAK_MAX_ACTIONS, GUARD_BREAK_ACTIONS + extraActions),
      ticksLeft: GUARD_BREAK_TICKS,
    });
    pushLog([{ text: 'GUARDA QUEBRADA!', color: '#f59e0b' }]);
  }
  function warriorApplyPosture(amount: number, options: {
    noBreak?: boolean; duelist?: boolean; breakActionsBonus?: number;
    perfectCounterAccuracy?: boolean; perfectReading?: boolean; parry?: boolean;
  } = {}): { applied: number; broke: boolean; crossed: boolean } {
    if (!isWarrior() || amount <= 0) return { applied: 0, broke: false, crossed: false };
    const state = warriorEnemyState();
    if (state.guardBroken) return { applied: 0, broke: false, crossed: false };
    const before = state.current;
    const after = applyPostureDamage(before, amount, options.noBreak ? 1 : 0);
    const crossed = crossesLowerBand(before, after);
    const broke = after === 0;
    let next: WarriorEnemyState = { ...state, current: after };
    if (options.perfectCounterAccuracy && broke) next.perfectCounterAccuracyPending = true;
    warriorCommitEnemy(next);
    if (after !== before) pushLog([{ text: `-${before - after} Postura`, color: '#f59e0b' }]);
    if (options.duelist && crossed) {
      if (warriorHasSkill('guerreiro:duelista:6') && warriorReadingRef.current !== 'perfect') {
        warriorReadingRef.current = 'normal';
        pushLog([{ text: 'LEITURA', color: '#eab308' }]);
      }
      const from = postureBand(before), to = postureBand(after);
      if (warriorHasSkill('guerreiro:duelista:2') && (from === 'firm' || from === 'unstable') && to !== from) {
        playerModsRef.current = playerModsRef.current.filter((m) => m.sourceAbilityId !== 'guerreiro:duelista:2');
        playerModsRef.current.push({ stat: 'evasion', pct: 0.02, roundsLeft: 2, sourceAbilityId: 'guerreiro:duelista:2' });
        syncPlayerMods();
      }
    }
    if (broke) {
      warriorTriggerGuardBreak(options.breakActionsBonus ?? (options.parry && warriorHasSkill('guerreiro:guardiao:14') ? 1 : 0));
      if (options.perfectReading) {
        warriorReadingRef.current = 'perfect';
        pushLog([{ text: 'LEITURA PERFEITA', color: '#eab308' }]);
      }
    }
    warriorSyncPlayer();
    return { applied: before - after, broke, crossed };
  }
  function warriorConsumeGuardBreakAction(activeAtStart: boolean) {
    if (!isWarrior() || !activeAtStart) return;
    const state = warriorEnemyState();
    if (!state.guardBroken) return;
    const left = Math.max(0, state.offensiveActionsLeft - 1);
    warriorCommitEnemy({ ...state, offensiveActionsLeft: left });
    if (left === 0) warriorEndGuardBreak();
  }
  function warriorOnEnemyRealAction() {
    if (!isWarrior()) return;
    const state = warriorEnemyState();
    if (state.guardBroken) {
      warriorCommitEnemy({ ...state, suppressedActionsLeft: Math.max(0, state.suppressedActionsLeft - 1) });
      return;
    }
    const zero = state.zeroRecoveryPending;
    const amount = recoverPosture(state.current, {
      zero,
      pressure: state.pressureRecoveryPending,
      suppressed: state.suppressedActionsLeft > 0,
      breathless: warriorHasSkill('guerreiro:furioso:8'),
    });
    const recovered = zero ? 0 : Math.min(amount, state.max - state.current);
    warriorCommitEnemy({
      ...state,
      current: Math.min(state.max, state.current + recovered),
      pressureRecoveryPending: false,
      zeroRecoveryPending: false,
      suppressedActionsLeft: Math.max(0, state.suppressedActionsLeft - 1),
    });
    pushLog(zero ? 'Recuperação de Postura anulada.' : recovered > 0 ? `RECUPEROU ${recovered} POSTURA` : 'Postura já está no máximo.');
  }
  function warriorSetRiposte(kind: Exclude<RiposteKind, null>) {
    if (kind === 'heavy' || warriorRiposteRef.current === null) warriorRiposteRef.current = kind;
    pushLog([{ text: warriorRiposteRef.current === 'heavy' ? 'RIPOSTA PESADA' : 'RIPOSTA PRONTA', color: '#eab308' }]);
    warriorSyncPlayer();
  }
  function mageSync() {
    if (silentRef.current) return;
    setMageRunesState(mageRunesRef.current); setMageHeatState(mageHeatRef.current);
    setMageThermalState(mageThermalRef.current); setMagePolarityState(mageLastPolarityRef.current);
    setMageCircuitState(mageCircuitRef.current); setMageResonanceState(mageResonanceRef.current);
  }
  function mageGainHeat(amount: number) {
    if (!isMage() || amount <= 0) return;
    mageHeatRef.current += amount;
    if (mageHeatRef.current >= HEAT_OVERHEAT_AT) {
      const emergencyValve = chRef.current.unlockedSkills.includes('mago:piromante:8') && !mageOverheatUsedThisEnemyRef.current;
      const damage = Math.max(1, Math.round(effectiveMaxHp(chRef.current) * (emergencyValve ? 0.03 : 0.05)));
      updateCh({ ...chRef.current, hp: Math.max(1, chRef.current.hp - damage) });
      mageOverheatUsedThisEnemyRef.current = true;
      mageHeatRef.current = HEAT_AFTER_OVERHEAT;
      pushLog([{ text: `Superaquecimento: -${damage} Vida; Calor → 50.`, color: '#ef4444' }]);
    }
    mageSync();
  }
  function mageThermalAdvance(amount: number) {
    if (!isMage() || amount <= 0) return;
    const wasFrozen = mageThermalRef.current === 'frozen';
    mageThermalRef.current = advanceThermal(mageThermalRef.current, amount);
    if (!wasFrozen && mageThermalRef.current === 'frozen') {
      mageFrozenAccuracyPendingRef.current = chRef.current.unlockedSkills.includes('mago:gelido:3');
      if (chRef.current.unlockedSkills.includes('mago:gelido:8')) {
        playerShieldRef.current += Math.max(1, Math.round(effectiveMaxHp(chRef.current) * 0.04));
        syncShield();
      }
    }
    if (mageThermalRef.current !== 'frozen') mageThermalTicksRef.current = 0;
    mageSync();
  }

  function mageElementDamageBonus(element: string | undefined): number {
    if (!element) return 0;
    const unlocked = chRef.current.unlockedSkills;
    if (element === 'fire') return (unlocked.includes('mago:piromante:0') ? 0.02 : 0) + (unlocked.includes('mago:piromante:7') ? 0.02 : 0) + (unlocked.includes('mago:piromante:11') ? 0.03 : 0);
    if (element === 'frost') return (unlocked.includes('mago:gelido:1') ? 0.02 : 0) + (unlocked.includes('mago:gelido:11') ? 0.03 : 0);
    return (unlocked.includes('mago:eletromante:0') ? 0.02 : 0) + (unlocked.includes('mago:eletromante:7') ? 0.02 : 0) + (unlocked.includes('mago:eletromante:11') ? 0.03 : 0);
  }

  // Resolves the Mage's cast-level effects after its core hit(s).  This is
  // intentionally called once per spell, never once per multi-hit impact.
  function mageOnSpellHit(ab: AbilityDef, stats: ReturnType<typeof computePlayerStats>, amplified: boolean, landedHits = 1) {
    if (!isMage()) return;
    const eff = ab.effect;
    if (eff.element === 'fire' && !mageFirstFireHitThisEnemyRef.current) {
      mageFirstFireHitThisEnemyRef.current = true;
      mageGainHeat(5);
    }
    if (eff.element === 'frost') {
      const wasFragileOrFrozen = mageThermalRef.current === 'fragile' || m…56263 tokens truncated…
            // the normal per-hit gain, applied later below); Golpe de
            // Ruptura's enemy DEF debuff; Carga Implacável's Abalado;
            // Ordem: Ataque/Avançar's on-hit self buffs (Comando Supremo
            // swaps in the literal Supreme values).
            if (eff.momentumGainOnHitExtra !== undefined) {
              knightGainMomentum(knightHighEnemyHp && eff.momentumGainOnHitExtraVsHighHp !== undefined ? eff.momentumGainOnHitExtraVsHighHp : eff.momentumGainOnHitExtra);
            }
            if (eff.enemyDefReductionPctBase !== undefined) {
              const pct = -Math.min(eff.enemyDefReductionPctCap ?? 1, eff.enemyDefReductionPctBase + (eff.enemyDefReductionPctPerMomentum ?? 0) * momentumAtActionStart);
              enemyModsRef.current.push({ stat: 'def', pct, roundsLeft: eff.enemyDefReductionRounds ?? 3 });
              syncEnemyMods();
            }
            if (eff.abaladoThreshold !== undefined && knightMomentumConsumed >= eff.abaladoThreshold) {
              enemyModsRef.current.push({ stat: 'dmgTakenPct', pct: ABALADO_DMG_TAKEN_PCT, roundsLeft: ABALADO_ROUNDS });
              syncEnemyMods();
            }
            if (eff.selfBuffAtkPctOnHit !== undefined) {
              const potency = knightCommandPotency(stats.supportPowerPct);
              let atkPct = eff.selfBuffAtkPctOnHit * (1 + potency);
              if (knightSupremeThisCast) {
                if (offenseAbility.id === 'cavaleiro:comando:4') atkPct = ORDEM_ATAQUE_ATK_BUFF_SUPREME * (1 + potency);
                else if (offenseAbility.id === 'cavaleiro:comando:9') atkPct = ORDEM_AVANCAR_DMG_BUFF_SUPREME * (1 + potency);
              }
              const rounds = (eff.selfBuffRoundsOnHit ?? 3) + knightCommandBuffDurationBonus();
              playerModsRef.current.push({ stat: 'atk', pct: atkPct, roundsLeft: rounds, sourceAbilityId: offenseAbility.id });
              syncPlayerMods();
            }
            if (eff.selfBuffSpeedPctOnHit !== undefined) {
              const potency = knightCommandPotency(stats.supportPowerPct);
              const speedPct = (knightSupremeThisCast ? ORDEM_AVANCAR_SPEED_BUFF_SUPREME : eff.selfBuffSpeedPctOnHit) * (1 + potency);
              const rounds = (eff.selfBuffRoundsOnHit ?? 3) + knightCommandBuffDurationBonus();
              playerModsRef.current.push({ stat: 'speedPct', pct: speedPct, roundsLeft: rounds, sourceAbilityId: offenseAbility.id });
              syncPlayerMods();
            }
            // Guerreiro: Postura is reduced only by a landed direct hit.
            // It never alters the HP damage result above.
            if (isWarrior()) {
              const band = postureBand(warriorEnemyState().current);
              let posture = bandValue(eff.postureDamageByBand, band, band === 'firm' ? (eff.postureDamageFirm ?? eff.postureDamage ?? 0) : (eff.postureDamage ?? 0));
              if (eff.duelistAbility) posture = duelPostureDamage(posture, attrTotal(chRef.current, 'dex'), warriorHasSkill('guerreiro:duelista:7'));
              const wsBeforeHit = warriorEnemyState();
              if (eff.vanguardAbility && warriorHasSkill('guerreiro:furioso:0') && !wsBeforeHit.vanguardFirstHitUsed) {
                posture += 6; warriorCommitEnemy({ ...wsBeforeHit, vanguardFirstHitUsed: true });
              } else if (eff.duelistAbility && warriorHasSkill('guerreiro:duelista:0') && !wsBeforeHit.duelistFirmFirstHitUsed && band === 'firm') {
                posture += 5; warriorCommitEnemy({ ...wsBeforeHit, duelistFirmFirstHitUsed: true });
              }
              posture += warriorCastPostureBonus;
              const outcome = warriorApplyPosture(posture, {
                duelist: eff.duelistAbility, breakActionsBonus: eff.guardBreakActionsBonusOnBreak,
                perfectCounterAccuracy: eff.perfectCounterAccuracyOnBreak, perfectReading: eff.readingPerfectOnBreak,
              });
              if (eff.vanguardAbility && warriorHasSkill('guerreiro:furioso:3')) warriorNextBasicPostureBonusRef.current = true;
              if (eff.vanguardAbility && warriorHasSkill('guerreiro:furioso:6')) {
                const ws = warriorEnemyState(); warriorCommitEnemy({ ...ws, pressureRecoveryPending: true });
              }
              if (eff.suppressPostureRecoveryActions) {
                const ws = warriorEnemyState(); warriorCommitEnemy({ ...ws, suppressedActionsLeft: Math.max(ws.suppressedActionsLeft, eff.suppressPostureRecoveryActions) });
              }
              if (eff.atkDebuffOnHitPct) {
                enemyModsRef.current.push({ stat: 'atk', pct: -eff.atkDebuffOnHitPct, roundsLeft: eff.atkDebuffRounds ?? 2, sourceAbilityId: offenseAbility.id }); syncEnemyMods();
              }
              if (outcome.applied >= 20 && warriorHasSkill('guerreiro:furioso:7')) {
                playerModsRef.current = playerModsRef.current.filter((m) => m.sourceAbilityId !== 'guerreiro:furioso:7');
                playerModsRef.current.push({ stat: 'def', pct: 0.03, roundsLeft: 2, sourceAbilityId: 'guerreiro:furioso:7' }); syncPlayerMods();
              }
            }
          } else {
            // Plain attack — magical classes swing with matk/mdef instead of
            // atk/def, same class split as an ability's default dmgType
            // above, so their INT investment isn't dead weight before they
            // have an ability equipped.
            const isMagicalClass = MAGICAL_CLASSES.includes(chRef.current.classId);
            playerHitMagical = isMagicalClass;
            const power = isMagicalClass ? stats.matk : stats.atk;
            const warriorPlainDefPen = isWarrior()
              ? (warriorBreakActiveAtStart ? GUARD_BREAK_DEF_PEN : 0)
                + (warriorHasSkill('guerreiro:furioso:11') && warriorPostureAtActionStart <= 50 ? 0.05 : 0)
                + (warriorHasSkill('guerreiro:duelista:11') ? (warriorBreakActiveAtStart ? 0.08 : postureBand(warriorPostureAtActionStart) === 'open' ? 0.05 : 0) : 0)
              : 0;
            const effDef = Math.max(0, (isMagicalClass ? computeEnemyMdef() : computeEnemyDef()) * (1 - stats.defPenPct - warriorPlainDefPen));
            const r = rollAttack(power, effDef, critChanceForRoll, critDmgMultForRoll);
            dmg = r.dmg; crit = r.crit;
            if (archerActive) archerLastActionHitsRef.current = 1;
            if (isWarrior()) {
              const bonus = warriorNextBasicPostureBonusRef.current ? 2 : 0;
              warriorNextBasicPostureBonusRef.current = false;
              warriorApplyPosture(POSTURE_BASIC_DAMAGE + bonus);
            }
          }

          // Damage-modifier pipeline order per the "definitivo" spec's
          // Section 18: ATK/DEF/dmgMult/crítico are already baked into `dmg`
          // by the roll above — from here it's bônus diretos condicionais,
          // then Frenesi, then (last) the enemy's own vulnerability.
          if (!missed) {
            if (enemyStatusRef.current.some((s) => s.kind === 'poison') && stats.dmgPctVsPoison > 0) dmg = Math.round(dmg * (1 + stats.dmgPctVsPoison));
            if (enemyStatusRef.current.some((s) => s.kind === 'burn') && stats.dmgPctVsBurn > 0) dmg = Math.round(dmg * (1 + stats.dmgPctVsBurn));
            if (clerigoActive && playerHitMagical) {
              // Fogo da Fé (clerigo:provacao:0) — small flat bonus vs an
              // enemy carrying at least 1 Julgamento. Peso do Veredito
              // (clerigo:provacao:8) is the ONE source of the per-stack
              // bonus (never duplicated onto Julgamento's own base effect).
              // Both apply to ANY direct magical hit, ability or plain.
              if (clerigoHasSkill('clerigo:provacao:0') && judgmentAtActionStart >= 1) {
                dmg = Math.round(dmg * (1 + FOGO_DA_FE_DMG_VS_JUDGMENT_PCT));
              }
              if (clerigoHasSkill('clerigo:provacao:2') && castAbility && (castAbility.effect.judgmentStacksOnHit ?? 0) >= 1) {
                dmg = Math.round(dmg * (1 + PALAVRA_ARDENTE_DMG_PCT));
              }
              if (clerigoHasSkill('clerigo:provacao:8') && judgmentAtActionStart > 0) {
                dmg = Math.round(dmg * (1 + JUDGMENT_DMG_PCT_PER_STACK * judgmentAtActionStart));
              }
            }
            if (knightActive) {
              // Força de Impacto (cavaleiro:investida:0) — bonus while the
              // enemy is still nearly untouched. Cavalgada (cavaleiro:
              // investida:3) — bonus while Momentum (read at action start)
              // is 60+. Both apply to any direct hit, ability or plain.
              if (knightHasSkill('cavaleiro:investida:0') && enemyRef.current.hp / enemyRef.current.maxHp >= FORCA_DE_IMPACTO_HP_THRESHOLD) {
                dmg = Math.round(dmg * (1 + capped(FORCA_DE_IMPACTO_RATE, attrTotal(chRef.current, 'str'), FORCA_DE_IMPACTO_CAP)));
              }
              if (knightHasSkill('cavaleiro:investida:3') && momentumAtActionStart >= CAVALGADA_MOMENTUM_THRESHOLD) {
                dmg = Math.round(dmg * (1 + capped(CAVALGADA_RATE, attrTotal(chRef.current, 'str'), CAVALGADA_CAP)));
              }
              // Momentum's own per-20 passive dmg bonus (base, or upgraded by
              // cavaleiro:investida:6's Momentum passive node).
              dmg = Math.round(dmg * (1 + knightMomentumBonusDmgPct()));
              // Cavaleiro Imparável (cavaleiro:investida:14) — bonus while
              // near the CURRENT (possibly boosted) Momentum max.
              if (knightHasSkill('cavaleiro:investida:14') && knightMomentumRef.current >= IMPARAVEL_HIGH_MOMENTUM_PCT_THRESHOLD * knightMomentumMax()) {
                dmg = Math.round(dmg * (1 + IMPARAVEL_HIGH_MOMENTUM_DMG_BONUS));
              }
              // Pressão Constante (cavaleiro:investida:5) — stacks per
              // consecutive direct hit on the SAME enemy (reset on miss/new
              // enemy, see below and resolveEnemyDeath).
              if (knightHasSkill('cavaleiro:investida:5')) {
                dmg = Math.round(dmg * (1 + knightPressureStacksRef.current * PRESSAO_CONSTANTE_PER_STACK));
              }
            }
            if (barbActive) {
              // Força Furiosa (barbaro:furia:0) — FOR-scaled, only with Fúria >= 50.
              if (barbHasSkill('barbaro:furia:0') && barbFuryRef.current >= FURY_INTERACTION_THRESHOLD) {
                dmg = Math.round(dmg * (1 + capped(FURIA_FORCA_FURIOSA_RATE, attrTotal(chRef.current, 'str'), FURIA_FORCA_FURIOSA_CAP)));
              }
              // Pressão Crescente (barbaro:furia:3) — +0.5% per 25 Fúria atual.
              if (barbHasSkill('barbaro:furia:3')) {
                dmg = Math.round(dmg * (1 + Math.floor(barbFuryRef.current / 25) * FURIA_PRESSAO_CRESCENTE_PER_25_FURY));
              }
              // Força sem Limite (barbaro:furia:11) — FOR-scaled, only for
              // abilities whose own furyCost is >= 30.
              if (barbHasSkill('barbaro:furia:11') && castAbility && (castAbility.effect.furyCost ?? 0) >= FURIA_FORCA_SEM_LIMITE_MIN_FURY_COST) {
                dmg = Math.round(dmg * (1 + capped(FURIA_FORCA_SEM_LIMITE_RATE, attrTotal(chRef.current, 'str'), FURIA_FORCA_SEM_LIMITE_CAP)));
              }
              // Força da Caça (barbaro:selvageria:1) — FOR-scaled, only on
              // the initiating hit of an ability that itself applies a
              // Ferida (never the renew/consume-only ones).
              if (barbHasSkill('barbaro:selvageria:1') && castAbility && (castAbility.effect.woundStacksOnHit ?? 0) >= 1) {
                dmg = Math.round(dmg * (1 + capped(SELVAGERIA_FORCA_DA_CACA_RATE, attrTotal(chRef.current, 'str'), SELVAGERIA_FORCA_DA_CACA_CAP)));
              }
              // Predador Supremo (barbaro:selvageria:14) — while the enemy
              // sat at exactly 5 Feridas at the START of this action.
              if (woundsAtActionStart === WOUND_MAX_STACKS && barbHasSkill('barbaro:selvageria:14')) {
                dmg = Math.round(dmg * (1 + PREDADOR_SUPREMO_DMG_BONUS));
                barbGainNormalFury(FURY_GAIN_PREDADOR_SUPREMO);
              }
              // Frenesi's own direct-damage multiplier — deliberately never
              // touches Ferida tick damage (barbTickWounds doesn't call this).
              if (barbFrenzyRef.current) dmg = Math.round(dmg * (1 + barbFrenzyDmgBonus()));
            }
            if (isHunter()) {
              // Presa Marcada (rastreio:6) — its own +4% direct dmg half
              // (the +4pp precisão half lives in computePlayerStats), applies
              // to ANY direct hit (ability or plain attack).
              if (hunterMarkedPrey() && hunterHasSkill('cacador:rastreio:6')) dmg = Math.round(dmg * (1 + PRESA_MARCADA_DMG_BONUS_PCT));
              // Janela Perfeita (precisao-caca:14) — +8% while the target
              // sits at 3 Brechas, read here before any consuming ability
              // (handled separately above) actually spends them.
              if (hunterHasSkill('cacador:precisao-caca:14') && hunterBreachStacks() === BREACH_MAX) {
                dmg = Math.round(dmg * (1 + JANELA_PERFEITA_DMG_BONUS_PCT));
              }
              // Instinto de Fuga (rastreio:8) — one-shot +12% dmg window
              // opened by the enemy's last miss, consumed on the next direct
              // hit regardless of path.
              const instintoBonus = hunterInstintoFugaBonusPct();
              if (instintoBonus > 0) dmg = Math.round(dmg * (1 + instintoBonus));
              // Mão do Armeiro (armadilhas:3) — DES-scaled next-shot bonus,
              // consumed the instant a direct hit lands, regardless of path.
              const maoArmeiroBonus = hunterConsumeNextShotBonusPct();
              if (maoArmeiroBonus > 0) dmg = Math.round(dmg * (1 + maoArmeiroBonus));
              hunterOnPlayerDirectHit(crit);
            }
            if (isWarrior() && warriorHasSkill('guerreiro:duelista:5')) {
              const band = postureBand(warriorPostureAtActionStart);
              if (band === 'open' || band === 'broken') dmg = Math.round(dmg * 1.02);
            }
            if (isRogue()) {
              if (rogueAmbushThisCast && rogueHasSkill('ladino:veneno:6')) dmg = Math.round(dmg * 1.05);
              if (rogueExposedAtCast && castAbility?.effect.roguePath === 'assassin' && rogueHasSkill('ladino:veneno:8')) dmg = Math.round(dmg * 1.04);
              if (enemyRef.current.hp / enemyRef.current.maxHp <= 0.35 && rogueHasSkill('ladino:veneno:11')) dmg = Math.round(dmg * 1.03);
              if (rogueImagesAtCast === 2 && rogueHasSkill('ladino:sombras:11')) dmg = Math.round(dmg * 1.03);
              if (rogueAdvantageAtCast && rogueHasSkill('ladino:laminas:7')) dmg = Math.round(dmg * 1.02);
            }
            if (isPaladin()) {
              if (paladinMercyArmedThisCast) dmg = Math.round(dmg * 1.06);
              if (paladinLawHammerThisCast) dmg = Math.round(dmg * 1.20);
              if (paladinVerdictAtCast && enemyRef.current.hp / enemyRef.current.maxHp < 0.35 && paladinHasSkill('paladino:martelo:2')) dmg = Math.round(dmg * 1.02);
            }
            if (archerActive) {
              const precise = castAbility?.effect.archerShotType === 'precise' || !castAbility;
              if (precise && archerHasSkill('arqueiro:precisao:6')) dmg = Math.round(dmg * (1 + (archerTensionAtActionStart >= 100 ? 0.08 : archerTensionAtActionStart >= 50 ? 0.04 : 0)));
              if (precise && archerTensionAtActionStart >= 75 && archerHasSkill('arqueiro:precisao:2')) dmg = Math.round(dmg * (1 + Math.min(0.03, attrTotal(chRef.current, 'dex') * 0.00075)));
              if (castAbility?.effect.archerShotType === 'volley' && (archerDistanceAtActionStart === 1 || archerDistanceAtActionStart === 2) && archerHasSkill('arqueiro:tiro-rapido:7')) dmg = Math.round(dmg * 1.02);
              if ((archerDistanceAtActionStart === 0 || archerDistanceAtActionStart === 1) && archerHasSkill('arqueiro:instinto:7')) dmg = Math.round(dmg * (1 + Math.min(0.02, attrTotal(chRef.current, 'dex') * 0.0008)));
            }
            // Vulnerabilidade do inimigo — sempre por último, per Section 18.
            if (getModTotal(enemyModsRef.current, 'dmgTakenPct') !== 0) dmg = Math.max(1, Math.round(dmg * (1 + getModTotal(enemyModsRef.current, 'dmgTakenPct'))));
            if (barbActive) {
              // Cortes Abertos (barbaro:selvageria:6) — any direct crit
              // applies 1 Ferida, at most once per action; naturally stacks
              // with an ability's own woundStacksOnHit (e.g. Fúria
              // Explosiva's guaranteed crit both applies its own stack AND
              // triggers this one).
              if (crit && barbHasSkill('barbaro:selvageria:6')) barbApplyWounds(1);
              // Sangue Quente (barbaro:furia:6) raises the basic-hit rate;
              // ability-hit generation is unaffected by it either way.
              barbGainNormalFury(castAbility ? FURY_GAIN_ABILITY_HIT : (barbHasSkill('barbaro:furia:6') ? FURY_GAIN_BASIC_HIT_SANGUE_QUENTE : FURY_GAIN_BASIC_HIT));
              if (crit) barbGainNormalFury(FURY_GAIN_CRIT_BONUS);
            }
            if (clerigoActive && playerHitMagical && crit) {
              // Acusação (clerigo:provacao:6) / Zelo Inflexível
              // (clerigo:provacao:3) — apply to ANY direct magical crit
              // (ability or plain attack), each at most once per action.
              if (clerigoHasSkill('clerigo:provacao:6')) clerigoApplyJudgment(1);
              if (clerigoHasSkill('clerigo:provacao:3') && clerigoEnemyJudgmentStacks() > 0) {
                clerigoRenewJudgmentDuration();
                const w = enemyRef.current.judgment;
                if (w) updateEnemy({ ...enemyRef.current, judgment: { stacks: w.stacks, ticksLeft: w.ticksLeft + ZELO_INFLEXIVEL_EXTEND_ROUNDS } });
              }
            }
          }
        }
      }

      // Fúria's per-action Frenesi drain — the LAST Fúria adjustment of the
      // round, after any cost/gain already applied above, whether this
      // action hit, missed, or was a self-ability. No-op for every other
      // class and for a Bárbaro not currently in Frenesi.
      barbEndOfActionDrain();

      if (isPaladin() && !playerStunned) {
        const before = paladinConviction(paladinLiturgyRef.current.virtues);
        paladinLiturgyRef.current = advancePaladinLiturgy(paladinLiturgyRef.current);
        if (before > 0 && paladinConviction(paladinLiturgyRef.current.virtues) === 0) {
          paladinVotoMantidoUsedRef.current = false;
          paladinMercyDutyUsedRef.current = false;
        }
        paladinSync();
      }

      if (isWarrior() && !playerStunned && (!chosen || !SELF_ABILITY_KINDS.includes(chosen.effect.kind))) {
        if (chosen?.effect.finishGuardBreak) warriorEndGuardBreak();
        else warriorConsumeGuardBreakAction(warriorBreakActiveAtStart);
      }

      if (!missed && dmg > 0) {
        const enemyHp = Math.max(0, enemyRef.current.hp - dmg);
        applyEnemyHp(enemyHp);
        if (isRogue()) {
          if (rogueAmbushThisCast && castAbility?.effect.canExpose) rogueExposedMainLeftRef.current = ROGUE_EXPOSED_MAIN_LIMIT;
          if (rogueToxicBladeMainLeftRef.current > 0) {
            const toxinMult = (rogueAmbushThisCast ? 0.15 : 0.12) * (rogueHasSkill('ladino:veneno:7') ? 1.10 : 1);
            rogueToxinRef.current = {
              id: 'ladino:toxin', sourceId: castAbility?.id ?? 'ladino:toxin', snapshotPower: stats.atk,
              dmgMultiplier: toxinMult, ticksRemaining: 3, tags: ['poison'], canCrit: false, bypassDefense: false,
            };
            rogueToxicBladeMainLeftRef.current = 0;
          }
          if (rogueLoadedDieSaved) rogueAdvantageRef.current = true;
          if (rogueAdvantageAtCast && castAbility?.effect.enemyDirectDmgDebuffPct) {
            rogueEnemyDmgDebuffRef.current = castAbility.effect.enemyDirectDmgDebuffRounds ?? 2;
          }
          if (rogueAdvantageAtCast && castAbility?.effect.timeSteal && enemyRef.current.hp > 0) rogueStealTime();
          if (castAbility?.id === 'ladino:veneno:13' && rogueHasSkill('ladino:veneno:14') && enemyRef.current.hp > 0) rogueEnterStealth();

          if (castAbility?.effect.consumeImages && rogueImagesAtCast > 0) {
            const authoredBase = castAbility.effect.kind === 'multiHit'
              ? (castAbility.effect.hitCount ?? 1) * (castAbility.effect.dmgMultPerHit ?? 0)
              : (castAbility.effect.dmgMult ?? 1);
            let ratio = castAbility.effect.imageEchoRatio ?? 0;
            if (castAbility.effect.roguePath === 'blade' && rogueHasSkill('ladino:sombras:14')) ratio += 0.05;
            if (rogueSharpenedAtCast) ratio += 0.05;
            const echoCoeff = imageEchoCoefficient(authoredBase, ratio) * (rogueHasSkill('ladino:sombras:5') ? 1.05 : 1);
            const echoDefPen = (rogueHasSkill('ladino:sombras:6') ? 0.10 : 0) + (rogueHasSkill('ladino:sombras:11') ? 0.02 : 0);
            for (let i = 0; i < rogueImagesAtCast && enemyRef.current.hp > 0; i++) {
              const echo = Math.max(1, Math.round(mitigatedBase(Math.round(stats.atk * echoCoeff), computeEnemyDef() * (1 - stats.defPenPct - echoDefPen))));
              applyEnemyHp(Math.max(0, enemyRef.current.hp - echo));
              pushFloat('enemy', echo, false);
            }
          }
          rogueSync();
        }
        if (isNecromancer()) { necroMetric('directDamage', dmg); if (castAbility?.effect.necromancerTag === 'reaper') necroMetric('reaps', 1); }
        if (isMage() && castAbility) mageOnSpellHit(castAbility, stats, mageAmplifiedThisCast);
        pushFloat('enemy', dmg, crit);
        flash('enemy');
        if (!silentRef.current) { if (playerHitMagical) playMagicAttackSfx(); else playPhysicalAttackSfx(); }
        // Value stays null: the damage this ability dealt to the enemy is
        // already shown at the enemy's own position via pushFloat above —
        // repeating it here, over the player who cast it, read as if the
        // caster took its own hit.
        if (castAbility) pushAbilityCast('player', castAbility.name, activeAbilityIconStyle(chRef.current.classId, castAbility.id), null, false);
        // Plain-attack damage already shows on screen via the floater — the
        // log only needs to note it when an ability (and/or the status/CC/
        // buff it applied) made the round more than just a routine hit.
        if (abilityTag) pushLog(`Você usa${abilityTag}!${statusLine}`);

        // Martelo da Fé (clerigo:retidao:12) — a small barrier sized off the
        // damage this very hit just dealt (SAB benefits it at half rate,
        // MARTELO_DA_FE_SUPPORT_FACTOR, since it isn't a heal/shield-% base).
        if (castAbility?.effect.shieldFromDamagePct) {
          const supportMult = 1 + stats.supportPowerPct * MARTELO_DA_FE_SUPPORT_FACTOR;
          const cap = (castAbility.effect.shieldFromDamageCapPct ?? 1) * clerigoEffMaxHp();
          const shieldAmt = Math.round(Math.min(dmg * castAbility.effect.shieldFromDamagePct * supportMult, cap) * clerigoBarrierEfficiencyMult());
          if (shieldAmt > 0) {
            playerShieldRef.current += shieldAmt;
            clerigoAddBarrierPortion(shieldAmt);
            syncShield();
          }
        }

        if (isNecromancer() && castAbility?.effect.directHealFromDamagePct) {
          const baseline = CLASSES[chRef.current.classId].baseHp + (chRef.current.level - 1) * 5;
          const efficiency = necroHasSkill('necromante:drenar-vida:3') ? 1 + capped(0.0015, attrTotal(chRef.current, 'wis'), 0.05) : 1;
          const heal = Math.min(Math.round(baseline * (castAbility.effect.directHealCapPct ?? 1)), Math.round(dmg * castAbility.effect.directHealFromDamagePct * efficiency));
          if (heal > 0) { updateCh({ ...chRef.current, hp: Math.min(effectiveMaxHp(chRef.current), chRef.current.hp + heal) }); pushFloat('player', heal, false, undefined, undefined, true); }
          necroMetric('healing', heal);
        }
        if (isDruid() && castAbility?.effect.healFromDamagePct) {
          const baseline = CLASSES[chRef.current.classId].baseHp + 6 * (chRef.current.level - 1);
          const cap = effectiveMaxHp(chRef.current) * (castAbility.effect.healFromDamageCapPct ?? 1);
          const heal = Math.min(cap, dmg * castAbility.effect.healFromDamagePct * (1 + stats.supportPowerPct));
          if (heal > 0) { updateCh({ ...chRef.current, hp: Math.min(effectiveMaxHp(chRef.current), chRef.current.hp + heal) }); pushFloat('player', Math.round(heal), false, undefined, undefined, true); }
          void baseline;
        }

        if (isPaladin() && castAbility) {
          const pe = castAbility.effect;
          if (pe.renewAegisOnHit && paladinAegisRef.current) {
            paladinAegisRef.current = { ...paladinAegisRef.current, ticksLeft: Math.min(3, paladinAegisRef.current.ticksLeft + pe.renewAegisOnHit) };
          }
          const paladinHealEfficiency = 1 + paladinRadiantBonusPct(attrTotal(chRef.current, 'wis'))
            + (paladinHasSkill('paladino:luz:1') ? Math.min(0.03, attrTotal(chRef.current, 'vit') * 0.0008) : 0)
            + (paladinHasSkill('paladino:luz:0') && paladinHpPctAtCast < 0.50 ? 0.04 : 0);
          const beforePaladinHealing = chRef.current.hp;
          const damageHealPct = paladinHpPctAtCast < (pe.lowHpHealThreshold ?? 0) ? (pe.lowHpHealFromDamagePct ?? pe.healFromDamagePct ?? 0) : (pe.healFromDamagePct ?? 0);
          if (damageHealPct > 0) paladinHeal(dmg * damageHealPct * paladinHealEfficiency, true);
          if (pe.activeHealMaxHpPct) paladinHeal(effectiveMaxHp(chRef.current) * pe.activeHealMaxHpPct * paladinHealEfficiency, true);
          if (paladinVerdictAtCast) {
            paladinFinishVerdict(paladinVerdictAtCast, castAbility);
            if (paladinVerdictAtCast.full && paladinVerdictAtCast.regent === 'justice' && paladinHasSkill('paladino:martelo:14') && enemyRef.current.hp > 0) paladinLawHammerTicksRef.current = 2;
            const totalVerdictHeal = chRef.current.hp - beforePaladinHealing;
            if (paladinVerdictAtCast.full && paladinVerdictAtCast.regent === 'mercy' && paladinHasSkill('paladino:luz:14') && totalVerdictHeal >= effectiveMaxHp(chRef.current) * 0.15) paladinReduceHighestRedemptionCooldown();
          }
          paladinSync();
        }

        if (stats.lifestealPct > 0 || (crit && stats.onCritHealPct > 0)) {
          const maxHp = effectiveMaxHp(chRef.current);
          // Vigor Doloroso (barbaro:resistencia:7) — multiplies the HEAL
          // AMOUNT from lifesteal specifically (not the onCritHealPct part)
          // while there's Dor accumulated, VIT-scaled.
          const vigorBonus = isBarbaro() && barbHasSkill('barbaro:resistencia:7') && barbPainTotal() > 0
            ? capped(RESISTENCIA_VIGOR_DOLOROSO_RATE, attrTotal(chRef.current, 'vit'), RESISTENCIA_VIGOR_DOLOROSO_CAP)
            : 0;
          const healAmount = Math.round(dmg * stats.lifestealPct * (1 + vigorBonus)) + (crit ? Math.round(maxHp * stats.onCritHealPct) : 0);
          if (healAmount > 0) {
            updateCh({ ...chRef.current, hp: Math.min(maxHp, chRef.current.hp + healAmount) });
            pushFloat('player', healAmount, false, undefined, undefined, true);
          }
        }

        if (isMage() && chosen && !mageCastFinished) { mageFinishCast(chosen, mageAmplifiedThisCast); mageCastFinished = true; }
        if (warlockActive && castAbility) finalizeWarlock(!missed && dmg > 0);
        if (enemyRef.current.hp <= 0) { resolveEnemyDeath(); return; }

        if (knightActive) {
          const knightFirstHit = !knightFirstHitLandedRef.current;
          knightFirstHitLandedRef.current = true;
          const knightBaseGain = knightFirstHit
            ? MOMENTUM_GAIN_FIRST_HIT + (knightHasSkill('cavaleiro:investida:1') ? MOMENTUM_GAIN_FIRST_HIT_PASSO_DE_GUERRA_BONUS : 0)
            : MOMENTUM_GAIN_NEXT_HIT;
          knightGainMomentum(knightBaseGain);
          if (knightHasSkill('cavaleiro:investida:5')) {
            knightPressureStacksRef.current = Math.min(PRESSAO_CONSTANTE_MAX_STACKS, knightPressureStacksRef.current + 1);
          }
          if (knightHasSkill('cavaleiro:investida:14')) {
            knightConsecutiveHitsRef.current += 1;
            if (knightConsecutiveHitsRef.current >= IMPARAVEL_HITS_PER_MAX_BONUS) {
              knightConsecutiveHitsRef.current = 0;
              knightMomentumMaxBonusRef.current = Math.min(IMPARAVEL_MAX_BONUS_CAP_PER_ENEMY, knightMomentumMaxBonusRef.current + IMPARAVEL_MAX_BONUS_PER_TRIGGER);
            }
          }
          let knightBonusRaw = 0;
          if (knightCounterStanceActive() && knightCounterStoredDmgRef.current > 0) {
            knightBonusRaw = knightReleaseCounterDamage(stats.atk);
          } else if (knightConsumeRetaliationCharge()) {
            knightBonusRaw = knightReactivePower(stats);
          }
          if (knightBonusRaw > 0) {
            const knightBonusDmg = Math.max(1, Math.round(mitigatedBase(knightBonusRaw, computeEnemyDef())));
            const enemyHpAfterBonus = Math.max(0, enemyRef.current.hp - knightBonusDmg);
            applyEnemyHp(enemyHpAfterBonus);
            pushFloat('enemy', knightBonusDmg, false);
            if (enemyHpAfterBonus <= 0) { resolveEnemyDeath(); return; }
          }
        }
      }
      if (isMage() && chosen && !mageCastFinished) mageFinishCast(chosen, mageAmplifiedThisCast);
      if (isRogue() && !playerStunned) {
        if (missed && rogueAdvantageAtCast && chosen?.effect.roguePath === 'trickster' && rogueHasSkill('ladino:laminas:14')) rogueAdvantageRef.current = true;
        if (rogueLoadedDieSaved) rogueAdvantageRef.current = true;
        if (chosen?.effect.consumeImages && rogueImagesAtCast === 2 && rogueHasSkill('ladino:sombras:14')) rogueImagesRef.current = 1;
        if (rogueAmbushThisCast) rogueFirstAmbushRef.current = true;
        rogueNextMainAccuracyRef.current = false;
        rogueAdvanceMainDurations(!!chosen?.effect.offensive || !chosen, rogueExposedAtCast, rogueToxicBladeAtCast, rogueTrickAtCast);
        rogueSync();
        if (rogueResolveInitiative()) return;
      }
      if (archerActive && !playerStunned) {
        const offensive = !chosen || !SELF_ABILITY_KINDS.includes(chosen.effect.kind);
        const effect = chosen?.effect;
        if (offensive && !archerBallisticLaunched) {
          if (archerLastActionHitsRef.current > 0) {
            const gain = effect?.archerTensionOverrideOnHit
              ? (archerDistanceAtActionStart === 3 ? (effect.archerTensionOverrideAtHorizon ?? effect.archerTensionOverrideOnHit) : effect.archerTensionOverrideOnHit)
              : (effect?.archerShotType === 'precise' || !chosen ? tensionForPreciseHit(archerDistanceAtActionStart) : 0);
            if (gain > 0) archerStateRef.current = gainArcherTension(archerStateRef.current, gain);
          } else if (effect?.archerShotType === 'precise' || !chosen) archerStateRef.current = loseArcherTension(archerStateRef.current, 8);
          if ((effect?.archerTensionCost ?? 0) >= 60 && archerLastActionHitsRef.current > 0 && archerHasSkill('arqueiro:precisao:14')) archerStateRef.current = gainArcherTension(archerStateRef.current, 15);
        }
        if (effect?.archerDistanceShift && effect.kind !== 'archerMove') archerMoveDistance(effect.archerDistanceShift, true, true);
        if (effect?.archerAlignFlights) archerStateRef.current = archerStateRef.current.arrows.length === 1 ? accelerateOldestArrow(archerStateRef.current) : alignInFlightArrows(archerStateRef.current);
        if (effect?.archerAccelerateOldest) archerStateRef.current = accelerateOldestArrow(archerStateRef.current);
        archerResolveFlightWindow(archerFlightsAtActionStart, effect?.archerImmediateTimerReduction ?? 0);
        archerStateRef.current = { ...archerStateRef.current, actionCount: archerStateRef.current.actionCount + 1 };
        if (!archerReflexThisCast && archerStateRef.current.reflexActionsLeft > 0) archerStateRef.current = advanceArcherReflex(archerStateRef.current);
        archerSpeedBuffRef.current = 0;
        archerDmgTakenBonusRef.current = false;
        if (effect?.archerShotType === 'volley') archerAccuracyBuffRef.current = 0;
        archerSync();
        if (enemyRef.current.hp <= 0) return;
      }
    }

    schedulePlayer(nextPlayerDelay());
  }

  // Centralized "the player's HP just reached 0" closure — mirrors
  // resolveEnemyDeath above. Both a direct enemy hit here in enemyAct and a
  // Bárbaro Dor tick (barbTickPain) resolve through this ONE path.
  // Returns true when death was PREVENTED (Ressurreição Menor) — callers
  // must keep scheduling the fight's clocks in that case instead of the
  // usual "combat is over" assumption. Returns false/undefined when death
  // was finalized as normal.
  function resolvePlayerDeath(): boolean {
    // Ressurreição Menor (clerigo:devocao:13) — checked BEFORE any death is
    // finalized; if the window is open and unused this attempt, it restores
    // HP and combat simply continues instead of ending.
    if (isClerigo() && clerigoCheckDeathPrevention()) return true;
    // Última Guarda (cavaleiro:bastiao:10) — updateCh already floors HP at 1
    // for the whole window (see updateCh), so by the time a caller's own
    // locally-computed "would be <= 0" check gets here, chRef.current.hp is
    // already back above 0 — just confirm that and continue the fight.
    if (isKnight() && knightLastGuardActive() && chRef.current.hp > 0) return true;
    if (isNecromancer()) necroMetric('deaths', 1);
    pushLog([{ text: 'Você caiu em combate...', color: '#8a2030' }]);
    phaseRef.current = 'ended';
    endedReasonRef.current = 'death';
    setEndedReason('death');
    setPhase('ended');
    if (!silentRef.current) {
      setResultBanner('defeat');
      setTimeout(() => { if (mountedRef.current) setResultBanner(null); }, 2000);
    }
    return false;
  }

  // The enemy's own action clock — independent of the player's, currently
  // always at the baseline pace (no per-shape speed stat yet, see the
  // player-only AGI investigation this feature grew out of).
  function enemyAct() {
    if (!mountedRef.current || phaseRef.current !== 'fight') return;

    // Player just landed the killing blow and a respawn is pending (see
    // playerAct's 900ms setTimeout) — nothing to swing with yet.
    if (enemyRef.current.hp <= 0) { scheduleEnemy(); return; }

    maybeAutoHeal();
    if (isRogue() && rogueTimeStolenRef.current) {
      rogueTimeStolenRef.current = false;
      rogueSync();
    }

    const enemyStunned = hasCC(enemyCCRef.current, 'stun') || hasCC(enemyCCRef.current, 'sleep');
    if (enemyStunned) {
      pushLog(`${enemyRef.current.name} está incapacitado e não consegue atacar!`);
      scheduleEnemy();
      return;
    }

    const defStats = computePlayerStats();
    let enemyAccuracy = computeEnemyAccuracy();
    const rogueFeint = isRogue() && roguePreparedTrickRef.current?.kind === 'feint' ? roguePreparedTrickRef.current : null;
    if (isRogue() && rogueStealthRef.current) enemyAccuracy -= rogueHasSkill('ladino:veneno:2') ? 0.12 : 0.10;
    if (rogueFeint) enemyAccuracy -= 0.15;
    const enemyMissed = rollMiss(enemyAccuracy, defStats.evasion);

    if (enemyMissed) {
      if (rogueFeint) {
        roguePreparedTrickRef.current = null;
        rogueAdvantageRef.current = true;
        if (rogueHasSkill('ladino:laminas:5')) rogueNextMainAccuracyRef.current = true;
        rogueSync();
      }
      // No log line — the floater's "erro!" already shows this on screen.
      pushFloat('player', 0, false, false, true);
      // Caçador: a miss is still a "real action" from the presa (Rastro
      // gain + oldest-trap trigger), PLUS its own miss-specific reactions
      // (Instinto de Fuga/Passo Etéreo/Manto das Sombras).
      hunterOnEnemyRealAction();
      hunterOnEnemyMiss();
      archerOnEnemyMiss();
      archerEvasionBuffRef.current = 0;
      mageOnEnemyRealAction();
      warriorOnEnemyRealAction();
      warlockOnEnemyRealAction();
      scheduleEnemy();
      return;
    }

    if (isRogue()) {
      if (rogueFeint) {
        roguePreparedTrickRef.current = null;
        roguePlanB(rogueFeint);
        if (rogueHasSkill('ladino:laminas:5')) rogueNextMainAccuracyRef.current = true;
      }
      if (rogueStealthRef.current) {
        rogueStealthRef.current = false;
        rogueStealthMainLeftRef.current = 0;
      }
      rogueSync();
    }

    // Only the shapes explicitly flagged atkType: 'magical' (Dragão,
    // Aberração) roll their attack as a spell against the player's mdef —
    // everyone else attacks physically, same as always.
    const enemyAtkType = enemyRef.current.atkType ?? 'physical';
    const enemyPower = enemyAtkType === 'magical' ? computeEnemyMatk() : computeEnemyAtk();
    const enemyDefStat = enemyAtkType === 'magical' ? defStats.mdef : defStats.def;

    // A signature ability replaces the plain attack for the round when
    // picked. Every kind (bigHit, lifestealHit, statusBite, controlSlam,
    // weakenNova, stealGold) rolls a hit through the same pipeline below,
    // just with that ability's own dmgMult and a guaranteed extra effect
    // instead of the plain attack's chance-based EnemyProc rider — stealGold
    // used to short-circuit before any damage roll at all (a Saqueador that
    // only picked your pocket and never hurt you), which is why it now joins
    // everyone else here instead of returning early.
    const chosenAbility = pickEnemyAbility();
    const abEffect = chosenAbility?.effect;

    const barbActive = isBarbaro();
    const { dmg: rawDmg, crit: ecrit } = rollAbilityHit(enemyPower, enemyDefStat, abEffect?.dmgMult ?? 1, 0.06, BASE_CRIT_DMG_MULT);
    // Frenesi's own +10% dano recebido applies at the same point as the
    // dungeon's own dmgTakenMult/dmgTakenPct — before block/shield/Dor, same
    // as everything else here that scales the incoming hit itself. Coração
    // de Guerra (barbaro:furia:1) shaves this penalty down by VIT total,
    // floored at +6% (10% - up to 4pp).
    const coracaoDeGuerraReduction = barbActive && barbFrenzyRef.current && barbHasSkill('barbaro:furia:1')
      ? capped(FURIA_CORACAO_DE_GUERRA_RATE, attrTotal(chRef.current, 'vit'), FURIA_CORACAO_DE_GUERRA_CAP)
      : 0;
    const frenzyTakenBonus = barbActive && barbFrenzyRef.current ? FRENZY_DMG_TAKEN_BONUS - coracaoDeGuerraReduction : 0;
    // Muralha Divina's -10% sits at this same initial multiplier line as
    // dungeon.dmgTakenMult/Frenesi's own bonus, per Section 18 precedent —
    // gated on ITS OWN barrier portion (isWallBonus) still having HP.
    const clerigoActiveEnemy = isClerigo();
    const clerigoWallReduction = clerigoActiveEnemy && clerigoWallBonusActive() ? MURALHA_DIVINA_DMG_TAKEN_PCT : 0;
    let edmg = Math.round(rawDmg * (dungeon.dmgTakenMult ?? 1) * (1 + defStats.dmgTakenPct) * (1 + frenzyTakenBonus) * (1 + clerigoWallReduction));
    if (isWarlock() && warlockEnemyRef.current.mandamento) {
      edmg = Math.round(edmg * (1 - (warlockEnemyRef.current.deadlineDmgReduction || 0.10)));
      warlockEnemyRef.current = consumeMandamento(warlockEnemyRef.current);
      warlockSync();
    }
    if (isRogue() && rogueEnemyDmgDebuffRef.current > 0) edmg = Math.round(edmg * 0.90);
    if (isRogue() && rogueFlowUntouchableRef.current) {
      edmg = Math.round(edmg * 0.94);
      rogueFlowUntouchableRef.current = false;
    }
    if (isMage() && mageThermalRef.current === 'frozen') edmg = Math.round(edmg * 0.90);
    if (isMage() && mageHeatRef.current >= 90) edmg = Math.round(edmg * 1.08);
    if (isMage() && mageNextDamageReductionRef.current > 0) {
      edmg = Math.round(edmg * (1 - mageNextDamageReductionRef.current));
      mageNextDamageReductionRef.current = 0;
    }
    if (isMage() && chRef.current.unlockedSkills.includes('mago:gelido:5') && (mageThermalRef.current === 'fragile' || mageThermalRef.current === 'frozen')) edmg = Math.round(edmg * 0.96);
    if (isNecromancer() && edmg > 0) {
      if (necroHasSkill('necromante:decomposicao:2') && necroPlagueRef.current) edmg = Math.round(edmg * (1 - capped(0.001, attrTotal(chRef.current, 'wis'), 0.03)));
      if (necroSummonsRef.current.length > 0) {
        if (necroHasSkill('necromante:drenar-vida:2')) edmg = Math.round(edmg * (1 - capped(0.001, attrTotal(chRef.current, 'wis'), 0.03)));
        if (necroHasSkill('necromante:drenar-vida:6')) edmg = Math.round(edmg * 0.96);
      }
      if (necroVigorTicksRef.current > 0) edmg = Math.round(edmg * (1 - capped(0.001, attrTotal(chRef.current, 'vit'), 0.04)));
      if (necroDeathVeilTicksRef.current > 0) {
        const servant = necroSummonsRef.current[0];
        edmg = Math.round(edmg * (servant ? 0.85 : 0.92));
        if (servant) {
          servant.attacksRemaining -= 1;
          if (servant.attacksRemaining <= 0) necroSummonsRef.current.shift();
          necroSync();
        }
      }
    }
    if (barbActive && edmg > 0) {
      // Corpo Duro (barbaro:resistencia:2) — a single direct hit exceeding
      // 15% of effective max HP gets reduced further, VIT-scaled.
      if (barbHasSkill('barbaro:resistencia:2') && edmg > RESISTENCIA_CORPO_DURO_HIT_THRESHOLD_PCT * barbEffMaxHp()) {
        edmg = Math.round(edmg * (1 - capped(RESISTENCIA_CORPO_DURO_RATE, attrTotal(chRef.current, 'vit'), RESISTENCIA_CORPO_DURO_CAP)));
      }
      // Coração Selvagem (barbaro:resistencia:11) — direct dmg-taken
      // reduction while HP < 35%, VIT-scaled (never touches Dor/DOT ticks).
      if (barbHasSkill('barbaro:resistencia:11') && chRef.current.hp / barbEffMaxHp() < RESISTENCIA_CORACAO_SELVAGEM_HP_THRESHOLD) {
        edmg = Math.round(edmg * (1 - capped(RESISTENCIA_CORACAO_SELVAGEM_RATE, attrTotal(chRef.current, 'vit'), RESISTENCIA_CORACAO_SELVAGEM_CAP)));
      }
    }
    // Santuário Vivo (clerigo:retidao:14) — once per Consagração instance,
    // negates part of a genuinely big hit (after mitigation, before
    // block/barreiras) and ends the Consagração immediately as the cost.
    if (clerigoActiveEnemy && edmg > 0 && clerigoHasSkill('clerigo:retidao:14') && clerigoConsecrationActive()
      && !clerigoConsecrationFlagsRef.current.santuarioVivo && edmg >= SANTUARIO_VIVO_BURST_THRESHOLD_PCT * clerigoEffMaxHp()) {
      clerigoConsecrationFlagsRef.current = { ...clerigoConsecrationFlagsRef.current, santuarioVivo: true };
      edmg = Math.round(edmg * (1 - SANTUARIO_VIVO_BURST_REDUCTION_PCT));
      clerigoConsecrationRoundsLeftRef.current = 0;
      syncClerigoConsecration();
    }
    // Ancora Sagrada (clerigo:retidao:11) — the next direct hit after a
    // normal barrier was destroyed takes a small guaranteed reduction,
    // consumed the instant it applies (never stacks).
    if (clerigoActiveEnemy && edmg > 0 && clerigoAncoraSagradaWindowRef.current > 0) {
      edmg = Math.round(edmg * (1 - ANCORA_SAGRADA_NEXT_HIT_REDUCTION_PCT));
      clerigoAncoraSagradaWindowRef.current = 0;
    }

    const knightActiveEnemy = isKnight();
    if (knightActiveEnemy && edmg > 0) {
      // Armadura de Aço (cavaleiro:bastiao:0) — a direct physical hit that,
      // even after normal mitigation, still represents >=15% of effective
      // max HP gets reduced further, VIT-scaled (never touches DOT).
      if (enemyAtkType !== 'magical' && knightHasSkill('cavaleiro:bastiao:0') && edmg >= ARMADURA_ACO_HEAVY_HIT_PCT * knightEffMaxHp()) {
        edmg = Math.round(edmg * (1 - capped(ARMADURA_ACO_RATE, attrTotal(chRef.current, 'vit'), ARMADURA_ACO_CAP)));
      }
      // Peso da Armadura (cavaleiro:bastiao:3) — same idea against an even
      // bigger "Golpe Pesado" (>=18%), its own separate threshold/rate/cap.
      if (enemyAtkType !== 'magical' && knightHasSkill('cavaleiro:bastiao:3') && isGolpePesado(edmg, knightEffMaxHp())) {
        edmg = Math.round(edmg * (1 - capped(PESO_ARMADURA_RATE, attrTotal(chRef.current, 'vit'), PESO_ARMADURA_CAP)));
      }
      // Núcleo de Aço (cavaleiro:bastiao:11) — extra direct-dmg reduction
      // while HP is below 35% (never touches DOT).
      if (knightHasSkill('cavaleiro:bastiao:11') && chRef.current.hp / knightEffMaxHp() < NUCLEO_ACO_HP_THRESHOLD) {
        edmg = Math.round(edmg * (1 - capped(NUCLEO_ACO_RATE, attrTotal(chRef.current, 'vit'), NUCLEO_ACO_CAP)));
      }
    }
    if (isWarrior() && edmg > 0 && warriorPreparedGuardRef.current) {
      const guard = warriorPreparedGuardRef.current;
      const preParryDamage = edmg;
      const reduction = parryReduction(guard.damageReductionPct, attrTotal(chRef.current, 'vit'), warriorHasSkill('guerreiro:guardiao:7'), warriorHasSkill('guerreiro:guardiao:14'));
      edmg = Math.max(0, Math.round(edmg * (1 - reduction)));
      const heavy = preParryDamage >= effectiveMaxHp(chRef.current) * 0.15 && warriorHasSkill('guerreiro:guardiao:8');
      warriorApplyPosture(guard.postureDamage + (heavy ? 8 : 0), { parry: true });
      if (warriorHasSkill('guerreiro:guardiao:1')) {
        playerModsRef.current = playerModsRef.current.filter((m) => m.sourceAbilityId !== 'guerreiro:guardiao:1');
        playerModsRef.current.push({ stat: 'def', pct: 0.03, roundsLeft: 2, sourceAbilityId: 'guerreiro:guardiao:1' });
      }
      if (warriorHasSkill('guerreiro:guardiao:5')) {
        playerModsRef.current = playerModsRef.current.filter((m) => m.sourceAbilityId !== 'guerreiro:guardiao:5');
        playerModsRef.current.push({ stat: 'mdef', pct: 0.04, roundsLeft: 2, sourceAbilityId: 'guerreiro:guardiao:5' });
      }
      syncPlayerMods();
      if (heavy) warriorSetRiposte('heavy');
      else if (guard.canGenerateRiposte && warriorHasSkill('guerreiro:guardiao:6') && guard.parriesResolved === 0) warriorSetRiposte('normal');
      const remaining = guard.remainingParries - 1;
      warriorPreparedGuardRef.current = remaining > 0 ? { ...guard, remainingParries: remaining, parriesResolved: guard.parriesResolved + 1 } : null;
      warriorSyncPlayer();
      pushLog(`${guard.name} apara ${Math.max(0, preParryDamage - edmg)} de dano.`);
    }
    // Escudo Colossal nega o primeiro stun/sleep desta luta enquanto
    // durar — checado antes de qualquer outra coisa, pois CC nem chega a
    // ser aplicado depois (esse branch só cuida de dano; a negação de CC
    // em si roda no ponto onde o inimigo tenta aplicar o status).
    const blocked = Math.random() < defStats.blockChance;
    if (blocked) {
      edmg = Math.round(edmg * 0.5);
      if (knightActiveEnemy) {
        knightOnBlockSuccess();
        // Escudo Disciplinado (cavaleiro:bastiao:5) — opens/renews the
        // next-hit reduction window; consumed at the first hit inside it.
        if (knightHasSkill('cavaleiro:bastiao:5')) knightNextHitReductionWindowRef.current = ESCUDO_DISCIPLINADO_WINDOW_TICKS;
      }
    }
    // Bastião Inquebrável (cavaleiro:bastiao:13) — uma vez por TENTATIVA de
    // masmorra: se este golpe seria fatal, a vida fica em 1 em vez de 0 (não
    // cura), concede uma barreira/Determinação/redução temporária. O resto
    // da resolução (resolvePlayerDeath) nunca chega a rodar para este hit.
    if (knightActiveEnemy && knightHasSkill('cavaleiro:bastiao:13') && !knightBastiaoInquebravelUsedThisRunRef.current
      && chRef.current.hp > 0 && chRef.current.hp - edmg <= 0) {
      knightBastiaoInquebravelUsedThisRunRef.current = true;
      edmg = chRef.current.hp - 1;
      playerShieldRef.current += Math.round(BASTIAO_INQUEBRAVEL_BARRIER_PCT * knightEffMaxHp() * knightBarrierMult());
      syncShield();
      knightGainDetermination(BASTIAO_INQUEBRAVEL_DETERMINATION_GAIN);
      knightBastiaoInquebravelActiveRoundsRef.current = BASTIAO_INQUEBRAVEL_DMG_REDUCTION_ROUNDS;
      pushLog('Bastião Inquebrável salva você de um golpe fatal!');
    }
    // Muralha de Ferro / Fortaleza Viva — reduções de postura, mutuamente
    // exclusivas (nunca ambas ativas ao mesmo tempo, ver knightStartIronWall/
    // knightStartFortress). Fortaleza Viva também garante um piso de
    // Bloqueio mínimo mesmo sem gear/talento (ver computePlayerStats).
    let knightPostureReduced = 0;
    if (knightActiveEnemy && edmg > 0) {
      if (knightIronWallActive()) knightPostureReduced = edmg * knightIronWallDmgReductionPct();
      else if (knightFortressActive()) knightPostureReduced = edmg * knightFortressDmgReductionPct();
      if (knightBastiaoInquebravelActiveRoundsRef.current > 0) {
        knightPostureReduced += edmg * BASTIAO_INQUEBRAVEL_DMG_REDUCTION_PCT;
      }
      if (knightPostureReduced > 0) {
        knightPostureReduced = Math.min(edmg, knightPostureReduced);
        edmg -= knightPostureReduced;
      }
    }
    // Escudo Disciplinado (cavaleiro:bastiao:5) — reduz o PRÓXIMO golpe após
    // um bloqueio bem-sucedido, consumido nesta mesma janela.
    let knightEscudoReduced = 0;
    // !blocked — the window opens on a block success just above, but the
    // reduction it grants is for the NEXT separate hit, not this same one
    // (which already got the normal block halving).
    if (knightActiveEnemy && !blocked && edmg > 0 && knightEscudoDisciplinadoActive()) {
      knightEscudoReduced = Math.round(edmg * ESCUDO_DISCIPLINADO_REDUCTION_PCT);
      edmg -= knightEscudoReduced;
      knightNextHitReductionWindowRef.current = 0;
    }

    if (isPaladin() && paladinAegisRef.current && edmg > 0) {
      const beforeAegis = edmg;
      const result = paladinAegisReduction(paladinAegisRef.current, edmg, effectiveMaxHp(chRef.current), 'direct');
      edmg = result.damage;
      paladinAegisRef.current = result.aegis;
      if (result.absorbed >= effectiveMaxHp(chRef.current) * 0.05 && paladinHasSkill('paladino:voto:6') && !paladinVotoMantidoUsedRef.current
        && paladinConviction(paladinLiturgyRef.current.virtues) > 0) {
        paladinVotoMantidoUsedRef.current = true;
        paladinLiturgyRef.current = { ...paladinLiturgyRef.current, actionsLeft: Math.min(4, paladinLiturgyRef.current.actionsLeft + 1) };
      }
      if (beforeAegis >= effectiveMaxHp(chRef.current) * 0.12 && paladinHasSkill('paladino:voto:14') && !paladinAegisPerfectUsedEnemyRef.current) {
        paladinAegisPerfectUsedEnemyRef.current = true;
        edmg = Math.round(edmg * 0.95);
      }
      pushLog(`Égide absorve ${result.absorbed} de dano.`);
      paladinSync();
    }

    let shieldAbsorbed = 0;
    if (playerShieldRef.current > 0 && edmg > 0) {
      shieldAbsorbed = Math.min(playerShieldRef.current, edmg);
      playerShieldRef.current -= shieldAbsorbed;
      edmg -= shieldAbsorbed;
      syncShield();
      if (isMage() && shieldAbsorbed > 0 && mageFrostBarrierAdvanceRef.current > 0) {
        mageThermalAdvance(mageFrostBarrierAdvanceRef.current);
        mageFrostBarrierAdvanceRef.current = 0;
      }
      if (knightActiveEnemy) knightAbsorbColossalShield(shieldAbsorbed);
    }
    // Contra-Ataque Absoluto (cavaleiro:bastiao:12) — armazena uma fração do
    // dano que a postura acabou de absorver/bloquear, liberado como bônus no
    // próximo golpe do Cavaleiro (ver playerAct).
    if (knightActiveEnemy && knightCounterStanceActive()) {
      knightStoreCounterDamage(knightPostureReduced + knightEscudoReduced + shieldAbsorbed);
    }
    // Determinação — gerada por bloqueio bem-sucedido e por barreiras/
    // posturas do Cavaleiro que absorveram dano (nunca por DEF/MDEF comuns,
    // regen, evasão ou miss). Fortaleza Viva desliga essa geração por
    // completo enquanto ativa (ver Seção 24 do redesign).
    if (knightActiveEnemy && !knightFortressActive()) {
      if (blocked) {
        knightGainDetermination(knightHasSkill('cavaleiro:bastiao:2') ? DETERMINATION_GEN_BLOCK_GUARDA_ELEVADA : DETERMINATION_GEN_BLOCK);
      }
      const knightBarrierAbsorbed = shieldAbsorbed + knightEscudoReduced;
      if (knightBarrierAbsorbed > 0) {
        knightGainDetermination(knightDeterminationFromPct(knightBarrierAbsorbed, DETERMINATION_GEN_BARRIER_PER_3PCT, DETERMINATION_GEN_BARRIER_CAP_PER_ACTION));
      }
      if (knightPostureReduced > 0 && knightIronWallActive()) {
        knightGainDetermination(knightDeterminationFromPct(knightPostureReduced, IRON_WALL_DET_GEN_PER_2PCT, IRON_WALL_DET_GEN_CAP_PER_ACTION));
      }
    }
    // Clérigo absorption order per spec: mitigation → shield/barreira normal
    // (the generic pool above) → distribute that same absorption across the
    // per-instance barrier ledger (Fé-threshold/Intercessão/Ancora Sagrada
    // triggers) → Graça → HP.
    if (clerigoActiveEnemy) {
      if (shieldAbsorbed > 0) clerigoAbsorbBarriers(shieldAbsorbed);
      if (edmg > 0) edmg -= clerigoAbsorbGrace(edmg);
    }

    // Bárbaro: Postura Selvagem (35% total while active) or the passive
    // Carne que Não Cede (10% permanent, not additive with Postura) defers
    // part of the damage that would otherwise hit HP right now into Dor,
    // paid off over the next few envTicks (see barbTickPain) — only ever
    // applied to the part of the hit that survives block/shield, per the
    // redesign spec's own worked example.
    if (barbActive && edmg > 0) {
      // Postura Selvagem — base 30%, VIT-scaled up to 35% total while active.
      const redirectPct = barbPostureRoundsLeftRef.current > 0
        ? POSTURA_BASE_REDIRECT_PCT + capped(POSTURA_VIT_RATE, attrTotal(chRef.current, 'vit'), POSTURA_VIT_CAP)
        : (barbHasSkill('barbaro:resistencia:8') ? PAIN_PASSIVE_REDIRECT_PCT : 0);
      if (redirectPct > 0) {
        const redirected = Math.round(edmg * redirectPct);
        if (redirected > 0) {
          edmg -= redirected;
          barbAddPainPacket(redirected);
        }
      }
    }

    const hp = Math.max(0, chRef.current.hp - edmg);
    updateCh({ ...chRef.current, hp });
    pushFloat('player', edmg, ecrit, blocked);
    // Momentum loss — a single direct hit dealing >= the Golpe Pesado
    // threshold (base 15% of effective max HP, raised by Sangue de Combate)
    // costs Momentum, at most once per enemy action.
    if (knightActiveEnemy && edmg > 0 && edmg >= knightMomentumLossThresholdPct() * knightEffMaxHp()) {
      knightLoseMomentum(knightMomentumLossAmount());
    }
    if (!silentRef.current) {
      if (enemyAtkType === 'magical') playMagicAttackSfx(); else playPhysicalAttackSfx();
      if (edmg > 0) playHurtSfx();
    }
    flash('player');
    if (barbActive) {
      // Muralha Selvagem — Fúria per enemy hit that actually lands while
      // its window is open, regardless of how much (if any) HP it cost
      // after block/shield/Dor.
      if (barbWallRoundsLeftRef.current > 0) barbGainNormalFury(barbWallFuryPerHitRef.current);
      // "Receber dano direto" — the base normal-generation trigger, gated
      // on HP actually dropping (post pain-redirect), same reading as the
      // spec's own "Receber dano direto de um ataque/habilidade inimiga".
      if (edmg > 0) barbGainNormalFury(barbHasSkill('barbaro:furia:6') ? FURY_GAIN_TAKE_DAMAGE_SANGUE_QUENTE : FURY_GAIN_TAKE_DAMAGE);
    }
    const shieldTag = shieldAbsorbed > 0 ? ` (escudo absorveu ${shieldAbsorbed})` : '';
    // Plain-attack damage already shows on screen via the floater — the log
    // only needs to note it when the enemy used a named ability this round.
    if (chosenAbility) {
      pushLog(`${enemyRef.current.name} usa ${chosenAbility.name}!${shieldTag}`);
      // No per-shape ability art exists yet, so icon is always null here —
      // pushAbilityCast/AbilityCastCallout fall back to the generic glyph.
      // Value stays null: the damage lands on the player and already shows
      // there via pushFloat — showing it again over the enemy that cast it
      // read as the enemy taking damage from its own attack.
      pushAbilityCast('enemy', chosenAbility.name, null, null, false);
    }

    // Sleep breaks the instant its target takes damage.
    if (hasCC(playerCCRef.current, 'sleep') && (edmg > 0 || shieldAbsorbed > 0)) {
      playerCCRef.current = playerCCRef.current.filter((c) => c.kind !== 'sleep');
      syncPlayerCC();
      pushLog('O impacto desperta você!');
    }

    // Thorns is capped so it can never land the killing blow itself —
    // that reward flow only runs from the direct attack-roll above.
    if (defStats.thornsPct > 0 && edmg > 0) {
      const reflected = Math.round(edmg * defStats.thornsPct);
      if (reflected > 0) {
        applyEnemyHp(Math.max(1, enemyRef.current.hp - reflected));
        pushFloat('enemy', reflected, false);
      }
    }

    if (chosenAbility && abEffect) {
      // A chosen ability's own guaranteed effect replaces the chance-based
      // EnemyProc rider for this round — landing both would double up.
      enemyAbilityCooldownsRef.current[chosenAbility.id] = chosenAbility.cooldown;
      if (abEffect.kind === 'lifestealHit' && edmg > 0) {
        const healAmt = Math.round(edmg * (abEffect.lifestealPct ?? 0.5));
        if (healAmt > 0) {
          updateEnemy({ ...enemyRef.current, hp: Math.min(enemyRef.current.maxHp, enemyRef.current.hp + healAmt) });
          pushLog(`${enemyRef.current.name} recupera ${healAmt} de vida!`);
          pushFloat('enemy', healAmt, false, undefined, undefined, true);
        }
      } else if (abEffect.kind === 'statusBite' && abEffect.status && !playerImmune()) {
        if (playerResists(defStats)) {
          pushLog('Você resistiu ao efeito!');
        } else {
          const rounds = knightJuramentoConsumeReduction(clerigoSoloConsagradoFirstNegative(abEffect.statusRounds ?? 3));
          knightOnNegativeEffectApplied();
          if (rounds > 0) {
            playerStatusRef.current.push({ kind: abEffect.status, roundsLeft: rounds, dmgPerTick: Math.max(1, Math.round(enemyPower * 0.35)) });
            syncPlayerStatuses();
          }
          pushLog(`Você foi ${STATUS_VERB[abEffect.status]}!`);
        }
      } else if (abEffect.kind === 'controlSlam' && abEffect.cc && !playerImmune()) {
        if (playerResists(defStats)) {
          pushLog('Você resistiu ao efeito!');
        } else if (isKnight() && (abEffect.cc === 'stun' || abEffect.cc === 'sleep') && knightColossalShieldNegateCC()) {
          // Escudo Colossal (cavaleiro:bastiao:9) — negates the first stun
          // or sleep while its barrier lasts, at the cost of 25% of what's
          // left of it. Silence is never negated (per spec).
          pushLog('Seu Escudo Colossal absorve o golpe atordoante!');
        } else {
          const rounds = knightJuramentoConsumeReduction(clerigoSoloConsagradoFirstNegative(abEffect.ccRounds ?? 1));
          knightOnNegativeEffectApplied();
          if (rounds > 0) {
            playerCCRef.current.push({ kind: abEffect.cc, roundsLeft: rounds });
            syncPlayerCC();
          }
          pushLog(`Você ficou ${CC_LABEL[abEffect.cc].toLowerCase()}!`);
        }
      } else if (abEffect.kind === 'weakenNova' && abEffect.statMod && !playerImmune()) {
        const rounds = knightJuramentoConsumeReduction(abEffect.statModRounds ?? 3);
        knightOnNegativeEffectApplied();
        if (rounds > 0) {
          playerModsRef.current.push({ stat: abEffect.statMod, pct: abEffect.statModPct ?? -0.2, roundsLeft: rounds });
          syncPlayerMods();
        }
        pushLog('Você foi enfraquecido!');
      } else if (abEffect.kind === 'stealGold') {
        const stolen = chRef.current.gold > 0
          ? Math.min(chRef.current.gold, Math.max(1, Math.round(chRef.current.gold * (abEffect.goldPct ?? 0.04))))
          : 0;
        if (stolen > 0) {
          updateCh({ ...chRef.current, gold: chRef.current.gold - stolen });
          pushGoldSteal(stolen);
          pushLog(`${enemyRef.current.name} rouba ${stolen} de ouro!`);
        }
      }
    } else if (!hasCC(enemyCCRef.current, 'silence') && edmg + shieldAbsorbed > 0) {
      // The enemy's signature proc — a chance-based extra debuff riding its
      // normal attack, skipped if the enemy is silenced or the player is
      // shielded by Immunity, and only ever on the plain-attack path.
      const proc = enemyRef.current.proc;
      if (proc && Math.random() < proc.chance && !playerImmune()) {
        if ((proc.status || proc.cc) && playerResists(defStats)) {
          pushLog('Você resistiu ao efeito!');
        } else if (proc.status) {
          const rounds = knightJuramentoConsumeReduction(clerigoSoloConsagradoFirstNegative(proc.rounds));
          knightOnNegativeEffectApplied();
          if (rounds > 0) {
            playerStatusRef.current.push({ kind: proc.status, roundsLeft: rounds, dmgPerTick: Math.max(1, Math.round(enemyPower * 0.35)) });
            syncPlayerStatuses();
          }
          pushLog(proc.label);
        } else if (proc.cc && isKnight() && (proc.cc === 'stun' || proc.cc === 'sleep') && knightColossalShieldNegateCC()) {
          pushLog('Seu Escudo Colossal absorve o golpe atordoante!');
        } else if (proc.cc) {
          const rounds = knightJuramentoConsumeReduction(clerigoSoloConsagradoFirstNegative(proc.rounds));
          knightOnNegativeEffectApplied();
          if (rounds > 0) {
            playerCCRef.current.push({ kind: proc.cc, roundsLeft: rounds });
            syncPlayerCC();
          }
          pushLog(proc.label);
        } else if (proc.statMod) {
          const rounds = knightJuramentoConsumeReduction(proc.rounds);
          knightOnNegativeEffectApplied();
          if (rounds > 0) {
            playerModsRef.current.push({ stat: proc.statMod, pct: proc.statModPct ?? -0.15, roundsLeft: rounds });
            syncPlayerMods();
          }
          pushLog(proc.label);
        }
      }
    }

    if (hp <= 0 && !resolvePlayerDeath()) return;
    archerOnEnemyHit();
    archerEvasionBuffRef.current = 0;
    archerDmgTakenBonusRef.current = false;
    // Caçador: the enemy just completed a real (landed) action — Rastro gain
    // + oldest-trap trigger. Deliberately AFTER the death check above, so a
    // hit that finishes the Caçador off resolves death first and never lets
    // a trap still activate against an already-dead run (spec section 8).
    hunterOnEnemyRealAction();
    mageOnEnemyRealAction();
    warriorOnEnemyRealAction();
    warlockOnEnemyRealAction();
    scheduleEnemy();
  }

  function maybeAutoHeal() {
    if (noPotions) return;
    const c = chRef.current;
    const maxHp = effectiveMaxHp(c);
    if (c.hp / maxHp > c.potionThreshold || c.potions <= 0 || potionCooldownRef.current > 0) return;
    const prevHp = c.hp;
    const heal = Math.round(maxHp * BASE_POTION_HEAL_PCT);
    const healed = Math.min(maxHp, c.hp + heal);
    updateCh({ ...c, hp: healed, potions: c.potions - 1 });
    potionCooldownRef.current = POTION_COOLDOWN_ROUNDS;
    pushLog([{ text: `Vida baixa — você bebe uma poção e recupera ${healed - prevHp} de vida.`, color: '#38bdf8' }]);
    pushFloat('player', healed - prevHp, false, undefined, undefined, true);
  }

  function drinkPotionManually() {
    if (noPotions) return;
    const c = chRef.current;
    const maxHp = effectiveMaxHp(c);
    if (phaseRef.current !== 'fight' || c.potions <= 0 || c.hp >= maxHp || potionCooldownRef.current > 0) return;
    const prevHp = c.hp;
    const heal = Math.round(maxHp * BASE_POTION_HEAL_PCT);
    const healed = Math.min(maxHp, c.hp + heal);
    updateCh({ ...c, hp: healed, potions: c.potions - 1 });
    potionCooldownRef.current = POTION_COOLDOWN_ROUNDS;
    pushLog(`Você bebe uma poção e recupera ${healed - prevHp} de vida.`);
    pushFloat('player', healed - prevHp, false, undefined, undefined, true);
  }

  function togglePause() {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (!next) {
      // Same stale-timer risk as backgrounding (see catchUpGenRef) — a timer
      // scheduled before the player hit "Pausar" is still sitting in the
      // queue with its original delay, and could still land after this
      // resume's own fresh schedule if it fires late enough.
      catchUpGenRef.current += 1;
      scheduleEnv(500);
      schedulePlayer(500);
      scheduleEnemy(500);
    }
  }

  function retreatSafely() {
    phaseRef.current = 'ended';
    endedReasonRef.current = 'retreat';
    setEndedReason('retreat');
    setPhase('ended');
  }

  function finalRunCharacter(): Character {
    return { ...chRef.current, bestDepth: Math.max(chRef.current.bestDepth, depthRef.current) };
  }

  function confirmReturnToHub() {
    onRunEnd(finalRunCharacter(), depthRef.current, endedReason ?? 'retreat', runStatsRef.current);
  }

  // Same finalization as returning to the hub, just handed to onRestart
  // instead — GameShell reacts by remounting this panel fresh on the same
  // dungeon rather than navigating to the kingdom screen.
  function confirmRestart() {
    onRestart(finalRunCharacter(), depthRef.current, endedReason ?? 'death', runStatsRef.current);
  }

  function formatCatchUpDuration(ms: number): string {
    const totalMinutes = Math.round(ms / 60000);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h <= 0) return `${m}min`;
    if (m <= 0) return `${h}h`;
    return `${h}h ${m}min`;
  }

  // Fast-forwards through however much real time passed while the tab was
  // backgrounded (see the visibilitychange effect below), driving envTick/
  // playerAct/enemyAct directly in a tight synchronous loop instead of
  // relying on their normal setTimeout self-scheduling — same abilities,
  // status effects, CC, drop/reward formulas as live play, since it's
  // literally the same functions, just silenced (silentRef) and stepped
  // through virtual time instead of real time. Capped at MAX_CATCHUP_MS so
  // a tab forgotten open for days doesn't turn into unattended multi-day
  // farming, and step-capped (CATCHUP_SAFETY_MAX_STEPS) as a backstop against
  // any runaway loop.
  function runCatchUp(elapsedMs: number) {
    // Invalidates any live setTimeout already in flight from before the tab
    // was backgrounded (see catchUpGenRef's own comment) — without this, a
    // stale player/enemy/env timer scheduled pre-background would still fire
    // (browsers deliver backlogged background timers promptly on resume)
    // right on top of the fresh schedule this function arms once it's done
    // fast-forwarding, landing a second live action for whatever round just
    // got resolved by the catch-up loop below.
    catchUpGenRef.current += 1;

    const capped = Math.min(elapsedMs, MAX_CATCHUP_MS);
    const before = { ...runStatsRef.current };
    const levelBefore = chRef.current.level;

    silentRef.current = true;
    let nextPlayerAt = 0;
    let nextEnemyAt = 0;
    let nextEnvAt = ATTACK_INTERVAL;
    let steps = 0;

    while (phaseRef.current === 'fight' && steps < CATCHUP_SAFETY_MAX_STEPS) {
      const nextAt = Math.min(nextPlayerAt, nextEnemyAt, nextEnvAt);
      if (nextAt > capped) break;
      steps += 1;
      if (nextAt === nextPlayerAt) {
        playerAct();
        nextPlayerAt += nextPlayerDelay();
      } else if (nextAt === nextEnemyAt) {
        enemyAct();
        nextEnemyAt += nextEnemyDelay();
      } else {
        envTick();
        nextEnvAt += ATTACK_INTERVAL;
      }
    }

    silentRef.current = false;

    const after = runStatsRef.current;
    const summary: CatchUpSummary = {
      elapsedMs: capped,
      kills: after.kills - before.kills,
      gold: after.goldFromKills - before.goldFromKills + (after.goldFromAutoSell - before.goldFromAutoSell),
      xp: after.xpGained - before.xpGained,
      itemsFound: after.itemsDropped - before.itemsDropped,
      itemsAutoSold: after.itemsAutoSold - before.itemsAutoSold,
      leveledUp: chRef.current.level > levelBefore,
      died: endedReasonRef.current === 'death',
      won: endedReasonRef.current === 'victory',
    };
    onLiveUpdate(chRef.current);
    setCatchUpSummary(summary);

    if (phaseRef.current === 'fight') {
      schedulePlayer(nextPlayerDelay());
      scheduleEnemy();
      scheduleEnv();
    }
  }

  // Kick off the auto-battle loop once, and make sure no stray timeout
  // touches state after this panel is unmounted (leaving for another section).
  useEffect(() => {
    mountedRef.current = true;
    scheduleEnv(700);
    // Who gets the opening strike is a coin flip, not a guarantee — this used
    // to always hand the player's timer the shorter delay (see LEAN_MS above),
    // so every single dungeon start had the player land a free hit before the
    // enemy's clock had even fired once. Now either side can win the flip.
    if (Math.random() < 0.5) {
      schedulePlayer(700);
      scheduleEnemy(700 + LEAN_MS);
    } else {
      schedulePlayer(700 + LEAN_MS);
      scheduleEnemy(700);
    }
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A phone locking or the tab going to the background pauses every
  // setTimeout in this component — there's no way for a web page to keep a
  // fight actually running while suspended by the OS/browser. Instead, note
  // when it happened, and on return fast-forward silently through however
  // much real time passed (see runCatchUp) rather than just leaving the
  // fight frozen at the moment the player left.
  useEffect(() => {
    function onVisibility() {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        return;
      }
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt === null) return;
      const elapsed = Date.now() - hiddenAt;
      // A quick tab switch isn't worth a fast-forward pass over — the live
      // timers barely drifted. Also skip if the player had deliberately
      // paused before backgrounding, or the fight already ended.
      if (elapsed < CATCHUP_MIN_MS) return;
      if (pausedRef.current || phaseRef.current !== 'fight' || !mountedRef.current) return;
      runCatchUp(elapsed);
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Repetir automaticamente" (GameShell) — once this attempt ends, move on
  // to the next one (or, on the last attempt, back to the kingdom so the
  // sequence's summary shows up) without waiting for a click. A manual
  // retreat always breaks the sequence — that's the player choosing to
  // stop, not an outcome to auto-continue past.
  useEffect(() => {
    if (phase !== 'ended' || !repeatTotal || endedReason === 'retreat') return;
    const isLast = (repeatCurrent ?? 1) >= repeatTotal;
    const t = setTimeout(() => {
      if (!mountedRef.current) return;
      if (isLast) confirmReturnToHub(); else confirmRestart();
    }, 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, endedReason, repeatCurrent, repeatTotal]);

  // Combat music swaps in for the kingdom loop for every fight — the battle
  // track for regular encounters, the boss track the instant the guardian
  // spawns — switching tracks again without ever handing back to the
  // kingdom loop mid-run.
  useEffect(() => {
    if (phase !== 'fight') return;
    if (enemy.isBoss) playBossMusic();
    else playBattleMusic();
  }, [enemy.isBoss, phase]);

  useEffect(() => {
    return () => stopCombatMusic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Canvas render loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext('2d')!;
    let raf: number;
    const draw = (t: number) => {
      const w = canvas.width, h = canvas.height;
      g.clearRect(0, 0, w, h);

      const bg = battleBackground(dungeon.id);
      if (bg && bg.complete && bg.naturalWidth > 0) {
        g.drawImage(bg, 0, 0, w, h);
      } else {
        // Procedural fallback for dungeons without dedicated art yet.
        // back wall
        g.fillStyle = '#1e1610';
        g.fillRect(0, 0, w, h - 40);
        // floor
        g.fillStyle = '#241a12';
        g.fillRect(0, h - 40, w, 40);
        g.fillStyle = '#2e2118';
        for (let x = 0; x < w; x += 28) g.fillRect(x, h - 40, 2, 40);
        // torches flicker
        const flick = 0.6 + Math.sin(t / 130) * 0.15;
        g.fillStyle = `rgba(255,150,60,${0.09 * flick})`;
        g.beginPath(); g.arc(w * 0.15, h * 0.32, 100, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.arc(w * 0.85, h * 0.32, 100, 0, Math.PI * 2); g.fill();
      }

      const groundY = h - 42;
      if (phase !== 'ended') {
        const px1 = w * 0.27, ex = w * 0.73;
        const playerTint = statusTintFor(playerStatuses, playerCCState, playerModsState);
        const enemyTint = statusTintFor(enemyStatuses, enemyCCState, enemyModsState);
        drawSprite(g, heroSpr.idle, px1, groundY, false, flashSide === 'player' ? 0.7 : 0, 0, playerTint);
        if (ch.classId === 'necromante') {
          necroSummonsState.forEach((summon, i) => {
            const sx = px1 - 34 + i * 68, sy = groundY - 24 - Math.sin(t / 280 + i) * 3;
            g.save(); g.shadowColor = '#a7f3d0'; g.shadowBlur = 8; g.fillStyle = '#d1fae5';
            g.beginPath(); g.arc(sx, sy, 10, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#10251f'; g.beginPath(); g.arc(sx - 3, sy - 2, 2, 0, Math.PI * 2); g.arc(sx + 3, sy - 2, 2, 0, Math.PI * 2); g.fill();
            g.fillRect(sx - 4, sy + 5, 8, 3); g.restore();
            g.fillStyle = '#d1fae5'; g.font = '9px sans-serif'; g.textAlign = 'center'; g.fillText(`${summon.attacksRemaining}`, sx, sy - 15);
          });
        }
        drawSprite(g, enemySprite(enemy.shape), ex, groundY, false, flashSide === 'enemy' ? 0.7 : 0, 0, enemyTint);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [
    ch.classId, enemy.shape, phase, flashSide, heroSpr,
    playerStatuses, playerCCState, playerModsState, enemyStatuses, enemyCCState, enemyModsState, necroSummonsState,
  ]);

  const hpPct = (v: number, max: number) => Math.max(0, Math.min(100, (v / max) * 100));
  const weapon = ch.equipment.weapon;
  const effMaxHp = effectiveMaxHp(ch);
  // Bárbaro redesign UI (lib/barbarian.ts) — Fúria/Frenesi/Dor bars near the
  // player's own HP, Feridas badge near the enemy's. Every value here reads
  // off state (barbFuryState/barbFrenzyState/barbPainState), never refs, so
  // it re-renders like everything else on screen.
  const barbPeleBonus = ch.unlockedSkills.includes('barbaro:resistencia:0')
    ? capped(RESISTENCIA_PELE_ENDURECIDA_RATE, attrTotal(ch, 'vit'), RESISTENCIA_PELE_ENDURECIDA_CAP)
    : 0;
  const barbInquebravelBonus = ch.unlockedSkills.includes('barbaro:resistencia:14') ? INQUEBRAVEL_PAIN_CAP_BONUS : 0;
  const barbPainCap = effMaxHp * (PAIN_MAX_PCT + barbPeleBonus + barbInquebravelBonus);
  const enemyWounds = enemy.barbarianWounds;
  // Clérigo redesign UI (lib/clerigo.ts) — Fé/Graça/Consagração near the
  // player's own HP, Julgamento badge near the enemy's, same read-off-state
  // discipline as Bárbaro's bars above.
  // Cavaleiro redesign UI (lib/knight.ts) — Determinação/Retaliação
  // (Bastião), Momentum (Investida), Ordens/Comando Supremo (Comando) —
  // each block only shows once the player actually has a talent in that
  // specialization, same "at least one node unlocked" gate the engine uses.
  const knightHasBastiao = ch.unlockedSkills.some((s) => s.startsWith('cavaleiro:bastiao:'));
  const knightHasInvestida = ch.unlockedSkills.some((s) => s.startsWith('cavaleiro:investida:'));
  const knightHasComando = ch.unlockedSkills.some((s) => s.startsWith('cavaleiro:comando:'));
  // Caçador redesign UI (lib/hunter.ts) — Armadilhas (traps), Rastro/Presa
  // Marcada (Rastreio), Brechas (Precisão da Caça) — same per-specialization
  // gate as Cavaleiro above. Rastro/Brechas live on the enemy instance
  // itself, so they read straight off `enemy` (the render-side mirror of
  // enemyRef) instead of a dedicated ref/state pair.
  const hunterHasArmadilhasChar = ch.unlockedSkills.some((s) => s.startsWith('cacador:armadilhas:'));
  const hunterHasRastreioChar = ch.unlockedSkills.some((s) => s.startsWith('cacador:rastreio:'));
  const hunterHasPrecisaoChar = ch.unlockedSkills.some((s) => s.startsWith('cacador:precisao-caca:'));
  const enemyTrail = enemy.hunterTrail ?? 0;
  const enemyMarkedPrey = enemyTrail >= MARKED_PREY_THRESHOLD;
  const enemyBreaches = enemy.hunterBreaches?.stacks ?? 0;
  const enemyJudgment = enemy.judgment;
  const warriorDisplay = enemy.warrior ?? createWarriorEnemyState();
  const warriorBandLabel = ({ firm: 'FIRME', unstable: 'INSTÁVEL', open: 'ABERTO', broken: 'GUARDA QUEBRADA' } as const)[postureBand(warriorDisplay.current)];
  const mechanicValues: Record<string, Omit<CombatMechanicState, 'mechanic'>> = {
    'guerreiro:posture': { value: warriorDisplay.current, maxValue: POSTURE_MAX, detail: warriorBandLabel, visible: ch.classId === 'guerreiro' },
    'guerreiro:guardbreak': { value: warriorDisplay.guardBroken ? 1 : 0, duration: warriorDisplay.offensiveActionsLeft, detail: warriorDisplay.guardBroken ? `${warriorDisplay.offensiveActionsLeft} ações ofensivas` : undefined, visible: ch.classId === 'guerreiro' },
    'guerreiro:parry': { value: warriorPreparedGuardState?.remainingParries ?? 0, maxValue: warriorPreparedGuardState?.remainingParries ?? 1, duration: warriorPreparedGuardState?.ticksLeft, detail: warriorPreparedGuardState?.name, visible: ch.classId === 'guerreiro' },
    'guerreiro:riposte': { value: warriorRiposteState ? 1 : 0, maxValue: 1, detail: warriorRiposteState === 'heavy' ? 'RIPOSTA PESADA' : undefined, visible: ch.classId === 'guerreiro' },
    'guerreiro:reading': { value: warriorReadingState ? 1 : 0, maxValue: 1, detail: warriorReadingState === 'perfect' ? 'LEITURA PERFEITA' : undefined, visible: ch.classId === 'guerreiro' },
    'guerreiro:feint': { value: warriorFeintReadyState ? 1 : 0, maxValue: 1, visible: ch.classId === 'guerreiro' },
    'barbaro:fury': { value: barbFuryState, maxValue: FURY_MAX },
    'barbaro:frenzy': { value: barbFrenzyState ? 1 : 0 },
    'barbaro:pain': { value: barbPainState, maxValue: barbPainCap },
    'barbaro:wounds': { value: enemyWounds?.stacks ?? 0, duration: enemyWounds?.ticksLeft },
    'clerigo:faith': { value: clerigoFaithState, maxValue: FAITH_MAX },
    'clerigo:grace': { value: clerigoGraceState, maxValue: effMaxHp * clerigoGraceCapPct() },
    'clerigo:consecration': { value: clerigoConsecrationState, duration: clerigoConsecrationState },
    'clerigo:judgment': {
      value: enemyJudgment?.stacks ?? 0, duration: enemyJudgment?.ticksLeft,
      detail: ch.unlockedSkills.includes('clerigo:provacao:8')
        ? `Peso do Veredito: +${formatGamePercent((enemyJudgment?.stacks ?? 0) * JUDGMENT_DMG_PCT_PER_STACK)} de dano mágico direto`
        : 'Julgamento não causa dano por si só',
    },
    'cavaleiro:determination': { value: knightDeterminationState, maxValue: DETERMINATION_MAX, visible: knightHasBastiao },
    'cavaleiro:retaliation': { value: knightRetaliationState, maxValue: RETALIATION_MAX_CHARGES, visible: knightHasBastiao },
    'cavaleiro:momentum': { value: knightMomentumState, maxValue: knightMomentumMax(), visible: knightHasInvestida },
    'cavaleiro:orders': { value: knightOrdersState, maxValue: ORDERS_MAX, visible: knightHasComando },
    'cavaleiro:commandSupreme': { value: knightCommandSupremeState ? 1 : 0, visible: knightHasComando },
    'cacador:traps': { value: hunterTrapsState.length, maxValue: hunterMaxTraps(), visible: hunterHasArmadilhasChar, detail: hunterTrapsState.some((trap) => trap.primed) ? 'Há uma armadilha primada' : undefined },
    'cacador:trail': { value: enemyTrail, maxValue: TRAIL_MAX, visible: hunterHasRastreioChar },
    'cacador:markedPrey': { value: enemyMarkedPrey ? 1 : 0, visible: hunterHasRastreioChar },
    'cacador:breaches': { value: enemyBreaches, maxValue: BREACH_MAX, duration: enemy.hunterBreaches?.ticksLeft, visible: hunterHasPrecisaoChar },
    'arqueiro:distance': { value: archerState.distance, maxValue: 3, detail: archerDistanceLabel(archerState.distance), visible: ch.classId === 'arqueiro' },
    'arqueiro:tension': { value: archerState.tension, maxValue: 100, visible: ch.classId === 'arqueiro' },
    'arqueiro:full_draw': { value: archerState.tension >= 100 ? 1 : 0, visible: ch.classId === 'arqueiro' },
    'arqueiro:cadence': { value: archerState.cadence, maxValue: 6, visible: ch.classId === 'arqueiro' },
    'arqueiro:perfect_rhythm': { value: archerState.perfectRhythm ? 1 : 0, visible: ch.classId === 'arqueiro' },
    'arqueiro:steps': { value: archerState.steps, maxValue: 3, visible: ch.classId === 'arqueiro' },
    'arqueiro:reflex': { value: archerState.reflexActionsLeft, maxValue: 2, duration: archerState.reflexActionsLeft, visible: ch.classId === 'arqueiro' },
    'arqueiro:flight': { value: archerState.arrows.length, maxValue: 4, detail: archerState.arrows.map((a) => `${a.sourceName}: ↓${a.actionsRemaining}`).join(' · '), visible: ch.classId === 'arqueiro' },
    'arqueiro:convergence': { value: 0, visible: ch.classId === 'arqueiro' },
    'druida:season': { value: ['spring','summer','autumn','winter'].indexOf(druidCycleState.season), detail: ({spring:'PRIMAVERA',summer:'VERÃO',autumn:'OUTONO',winter:'INVERNO'} as const)[druidCycleState.season], visible: ch.classId === 'druida' },
    'druida:garden': { value: druidGardenRef.current.length, maxValue: ch.unlockedSkills.includes('druida:cura-natural:6') ? 3 : 2, detail: druidGardenRef.current.map((u) => u.stage.toUpperCase()).join(' · '), visible: ch.classId === 'druida' },
    'druida:attunement': { value: druidCycleState.attunement, maxValue: 3, visible: ch.classId === 'druida' },
    'druida:perfect_year': { value: druidCycleState.perfectYear ? 1 : 0, visible: ch.classId === 'druida' },
    'druida:renewal': { value: druidCycleState.renewals, maxValue: 1, visible: ch.classId === 'druida' },
    'druida:dissonance': { value: druidCycleState.dissonance, maxValue: 3, visible: ch.classId === 'druida' },
    'druida:form': { value: druidCycleState.form ? 1 : 0, detail: druidCycleState.form?.toUpperCase(), visible: ch.classId === 'druida' },
    'druida:avatar': { value: druidAvatarActionsRef.current, maxValue: 4, duration: druidAvatarActionsRef.current, visible: ch.classId === 'druida' },
    'bruxo:debt': { value: warlockState.debt, maxValue: 6, detail: warlockState.debt >= 6 ? 'PRAZO FINAL — próxima geração pode causar Sobrecontrato' : undefined, visible: ch.classId === 'bruxo' },
    'bruxo:deadline': { value: warlockState.debt >= 6 ? 1 : 0, detail: warlockState.debt >= 6 ? `Cobrança: ${collectionAmount(effMaxHp, 'normal')} HP` : undefined, visible: ch.classId === 'bruxo' },
    'bruxo:overcontract': { value: 0, detail: warlockState.debt >= 6 ? 'SOBRECONTRATO: +15% dano e cobrança de 10%' : undefined, visible: ch.classId === 'bruxo' },
    'bruxo:binding': { value: warlockEnemyState.bound ? 1 : 0, detail: warlockEnemyState.bound ? 'VINCULADO' : undefined, visible: ch.classId === 'bruxo' },
    'bruxo:true-name': { value: warlockEnemyState.nameFragments, maxValue: 3, detail: warlockEnemyState.nameFragments >= 3 ? 'NOME VERDADEIRO REVELADO' : undefined, visible: ch.classId === 'bruxo' },
    'bruxo:credit': { value: warlockState.credit, maxValue: warlockHasSkill('bruxo:pacto:14') ? 3 : 2, detail: warlockState.credit > 0 ? 'Um Crédito cancela a próxima Dívida gerada' : undefined, visible: ch.classId === 'bruxo' },
    'bruxo:scars': { value: warlockState.scars, maxValue: 3, detail: warlockState.scars > 0 ? `+${warlockState.scars * 3}% dano Transgressão · -${warlockState.scars * 2}% MDEF` : undefined, visible: ch.classId === 'bruxo' },
    'bruxo:forgery': { value: warlockState.forgeryReady ? 1 : 0, detail: warlockState.forgeryReady ? 'ASSINATURA FALSA PRONTA' : undefined, visible: ch.classId === 'bruxo' },
    'mago:runes': { value: mageRunesState, maxValue: 2 },
    'mago:heat': { value: mageHeatState, maxValue: 100 },
    'mago:overheat': { value: 0 },
    'mago:thermal_state': { value: mageThermalState === 'normal' ? 0 : 1, detail: mageThermalState === 'normal' ? undefined : ({ chilled: 'RESFRIADO', fragile: 'FRÁGIL', frozen: 'CONGELADO' }[mageThermalState]) },
    'mago:frozen': { value: mageThermalState === 'frozen' ? 1 : 0 },
    'mago:polarity': { value: magePolarityState === 'none' ? 0 : 1, detail: magePolarityState === 'positive' ? '+' : magePolarityState === 'negative' ? '−' : undefined },
    'mago:circuit': { value: mageCircuitState, maxValue: 3 },
    'mago:resonance': { value: mageResonanceState ? 1 : 0 },
    'necromante:souls': { value: necroSoulsState, maxValue: SOUL_MAX, visible: ch.classId === 'necromante' },
    'necromante:decomposition': { value: necroDecompositionState?.stacks ?? 0, maxValue: DECOMPOSITION_MAX, duration: necroDecompositionState?.ticksRemaining, visible: ch.classId === 'necromante' },
    'necromante:plague': { value: necroPlagueState ? 1 : 0, duration: necroPlagueState?.ticksRemaining, detail: necroPlagueState ? `${formatGameNumber(plagueTickDamage(necroPlagueState, necroDecompositionState?.stacks ?? 0))} por ciclo` : undefined, visible: ch.classId === 'necromante' },
    'necromante:servants': { value: necroSummonsState.length, maxValue: necroMaxSummons(), detail: necroSummonsState.map((s, i) => `Servo ${i + 1}: ${s.attacksRemaining} ataques`).join(' · '), visible: ch.classId === 'necromante' },
    'ladino:initiative': { value: rogueQuickWindowRef.current ? 1 : 0, detail: 'PRINCIPAL → RÁPIDA', visible: ch.classId === 'ladino' },
    'ladino:stealth': { value: rogueStealthState ? 1 : 0, duration: rogueStealthMainLeftRef.current, visible: ch.classId === 'ladino' },
    'ladino:exposed': { value: rogueExposedState > 0 ? 1 : 0, duration: rogueExposedState, visible: ch.classId === 'ladino' },
    'ladino:toxin': { value: rogueToxinState ? 1 : 0, duration: rogueToxinState?.ticksRemaining, detail: rogueToxinState ? `${formatGameNumber(Math.round(rogueToxinState.snapshotPower * rogueToxinState.dmgMultiplier))} por ciclo` : undefined, visible: ch.classId === 'ladino' },
    'ladino:images': { value: rogueImagesState, maxValue: ROGUE_IMAGE_MAX, visible: ch.classId === 'ladino' },
    'ladino:sharpened_echo': { value: rogueSharpenedEchoState ? 1 : 0, visible: ch.classId === 'ladino' },
    'ladino:prepared_trick': { value: roguePreparedTrickState ? 1 : 0, duration: roguePreparedTrickState?.actionsLeft, detail: roguePreparedTrickState?.kind === 'feint' ? 'FINTA' : roguePreparedTrickState?.kind === 'loaded_die' ? 'DADO VICIADO' : undefined, visible: ch.classId === 'ladino' },
    'ladino:advantage': { value: rogueAdvantageState ? 1 : 0, detail: rogueAdvantageState ? 'PRONTA' : undefined, visible: ch.classId === 'ladino' },
    'ladino:time_stolen': { value: rogueTimeStolenState ? 1 : 0, visible: ch.classId === 'ladino' },
    'paladino:conviction': { value: paladinConviction(paladinLiturgyState.virtues), maxValue: 3, visible: ch.classId === 'paladino' },
    'paladino:virtues': { value: paladinConviction(paladinLiturgyState.virtues), detail: `J ${paladinLiturgyState.virtues.justice ? '✓' : '—'} · C ${paladinLiturgyState.virtues.courage ? '✓' : '—'} · M ${paladinLiturgyState.virtues.mercy ? '✓' : '—'}`, visible: ch.classId === 'paladino' },
    'paladino:liturgy': { value: paladinLiturgyState.actionsLeft, duration: paladinLiturgyState.actionsLeft, visible: ch.classId === 'paladino' },
    'paladino:regent': { value: paladinLiturgyState.regent ? 1 : 0, detail: paladinLiturgyState.regent === 'justice' ? 'JUSTIÇA' : paladinLiturgyState.regent === 'courage' ? 'CORAGEM' : paladinLiturgyState.regent === 'mercy' ? 'MISERICÓRDIA' : undefined, visible: ch.classId === 'paladino' },
    'paladino:aegis': { value: paladinAegisState ? 1 : 0, duration: paladinAegisState?.ticksLeft, detail: paladinAegisState ? `${paladinAegisState.hitsRemaining} golpe(s) · ${formatGamePercent(paladinAegisState.reductionPct)} / teto ${formatGamePercent(paladinAegisState.maxHpCapPct)}` : undefined, visible: ch.classId === 'paladino' },
  };
  const combatMechanicStates: CombatMechanicState[] = getClassMechanics(ch.classId)
    .filter((mechanic) => mechanic.combatDisplay)
    .map((mechanic) => ({ mechanic, ...(mechanicValues[mechanic.id] ?? { value: 0 }) }));
  const openMechanicState = combatMechanicStates.find(({ mechanic }) => mechanic.id === openMechanicId);
  const openCombatAbility = equippedAbilities().find((ability) => ability.id === openAbilityId);
  const combatAbilityRequirements = openCombatAbility ? (() => {
    const walk = (condition: AbilityDef['condition']): string[] => {
      if (condition.type === 'all' || condition.type === 'any') return (condition.conditions ?? []).flatMap(walk);
      if (condition.type === 'resourceAtLeast') {
        const current = condition.resource === 'faith' ? clerigoFaithState
          : condition.resource === 'fury' ? barbFuryState
          : condition.resource === 'determination' ? knightDeterminationState
          : condition.resource === 'momentum' ? knightMomentumState
          : condition.resource === 'orders' ? knightOrdersState
          : condition.resource === 'conviction' ? paladinConviction(paladinLiturgyState.virtues) : 0;
        const archerCurrent = condition.resource === 'tension' ? archerState.tension : condition.resource === 'cadence' ? archerState.cadence : condition.resource === 'steps' ? archerState.steps : condition.resource === 'distance' ? archerState.distance : condition.resource === 'flightCount' ? archerState.arrows.length : undefined;
        const resolvedCurrent = condition.resource === 'souls' ? necroSoulsState : archerCurrent ?? current;
        const label = condition.resource === 'faith' ? 'Fé' : condition.resource === 'souls' ? 'Almas' : condition.resource === 'tension' ? 'Tensão' : condition.resource === 'cadence' ? 'Cadência' : condition.resource === 'steps' ? 'Passos' : condition.resource === 'distance' ? 'Distância' : condition.resource === 'flightCount' ? 'Flechas em Voo' : condition.resource;
        return [`${label}: ${formatGameNumber(resolvedCurrent)}/${formatGameNumber(condition.value ?? 0)}`];
      }
      if (condition.type === 'enemyStacksAtLeast' || condition.type === 'enemyStacksEqual') {
        const current = condition.stackId === 'judgment' ? (enemyJudgment?.stacks ?? 0)
          : condition.stackId === 'wounds' ? (enemyWounds?.stacks ?? 0)
          : condition.stackId === 'trail' ? enemyTrail
          : condition.stackId === 'breach' ? enemyBreaches : 0;
        const resolvedCurrent = condition.stackId === 'decomposition' ? (necroDecompositionState?.stacks ?? 0) : current;
        const label = condition.stackId === 'judgment' ? 'Julgamento' : condition.stackId;
        return [`${condition.stackId === 'decomposition' ? 'Decomposição' : label}: ${formatGameNumber(resolvedCurrent)}/${formatGameNumber(condition.stacks ?? 0)} necessários`];
      }
      if (condition.type === 'enemyPostureAtMost') return [`Postura atual: ${warriorDisplay.current}/100 — requer ${condition.value ?? 0} ou menos`];
      if (condition.type === 'enemyPostureBand') return [`Faixa atual: ${warriorBandLabel} — requer ${condition.postureBand === 'open' ? 'ABERTO' : condition.postureBand}`];
      if (condition.type === 'guardBroken') return [`Guarda Quebrada: ${warriorDisplay.guardBroken ? 'pronta' : 'necessária'}`];
      if (condition.type === 'riposteReady') return [`Riposta: ${warriorRiposteState ? 'pronta' : 'necessária'}`];
      if (condition.type === 'notGuardBroken') return [`Guarda normal: ${warriorDisplay.guardBroken ? 'aguarde recompor' : 'ativa'}`];
      if (condition.type === 'periodicEffectActive') return [`Praga Necrótica: ${necroPlagueState ? 'ativa' : 'necessária'}`];
      if (condition.type === 'summonCountAtLeast') return [`Servos: ${necroSummonsState.length}/${condition.count ?? 1} necessários`];
      if (condition.type === 'summonCountBelow') return [`Servos: ${necroSummonsState.length}/${necroMaxSummons()} — requer espaço`];
      if (condition.type === 'enemyExposed') return [`Exposto: ${rogueExposedState > 0 ? 'SIM' : 'NÃO'}`];
      if (condition.type === 'imageCountAtLeast') return [`Imagens: ${rogueImagesState}/${condition.count ?? 1} necessárias`];
      if (condition.type === 'imageCountBelow') return [`Imagens: ${rogueImagesState}/${condition.count ?? 2} — requer espaço`];
      if (condition.type === 'advantageReady') return [`Vantagem: ${rogueAdvantageState ? 'PRONTA' : 'NECESSÁRIA'}`];
      if (condition.type === 'isStealthed') return [`Furtivo: ${rogueStealthState ? 'SIM' : 'NÃO'}`];
      return [];
    };
    return walk(openCombatAbility.condition);
  })() : [];
  const combatAbilityHeal = openCombatAbility?.effect.kind === 'heal'
    ? clericDirectHealAmount(clerigoBaselineMaxHp(), openCombatAbility.effect.healPct ?? 0, computePlayerStats().supportPowerPct, clerigoHealEfficiencyBonus())
    : null;
  const allStatusLabel: Record<StatusEffectKind, string> = STATUS_LABEL;
  const playerTags = [...playerStatuses.map((s) => allStatusLabel[s]), ...playerCCState.map((c) => CC_LABEL[c])];
  const enemyTags = [...enemyStatuses.map((s) => allStatusLabel[s]), ...enemyCCState.map((c) => CC_LABEL[c])];
  const playerBadges = buildEffectBadges('player', playerStatuses, playerCCState, playerModsState);
  const enemyBadges = buildEffectBadges('enemy', enemyStatuses, enemyCCState, enemyModsState);
  // Progress toward the dungeon's own boss, replacing the old raw
  // "Profundidade N" floor counter — every dungeon now has a defined end
  // (bossDepth), so a fill bar communicates "how close to done" far better
  // than an ever-climbing number ever did. Once the boss itself is up, the
  // marker/fill snap to 100% regardless of the raw depth fraction (the boss
  // sits AT bossDepth, not past it).
  const depthPct = (d: number) => Math.round(Math.max(0, Math.min(1, (d - dungeon.startDepth) / (dungeon.bossDepth - dungeon.startDepth))) * 100);
  const dungeonProgressPct = depthPct(depth);
  const playerBarPct = enemy.isBoss ? 100 : dungeonProgressPct;
  // Modo Ferro: death here is permanent — see App.tsx's handleRunEnd, which
  // deletes the character instead of healing it. No "Reiniciar Masmorra"
  // option makes sense for a character that's about to cease existing.
  const ironDeath = character.ironMode === true && endedReason === 'death';
  const miniBossPcts = (dungeon.miniBossDepths ?? []).map(depthPct);

  return (
    <>
    <Panel title={dungeon.name}>
      {(phase === 'fight' || phase === 'ended') && (
        <div className="mb-4">
          <div className="flex justify-between items-baseline text-[11px] text-parchment/50 uppercase tracking-wide mb-1">
            <span>Progresso da Masmorra</span>
            <span>{enemy.isBoss ? 'Chefe!' : `${dungeonProgressPct}%`}</span>
          </div>
          <div className="relative h-1.5 mt-4 mb-1">
            <div className="absolute inset-0 bg-black/50 rounded overflow-hidden">
              <div className="h-full bg-gold rounded transition-[width] duration-500" style={{ width: `${playerBarPct}%` }} />
              {/* 50% milestone tick */}
              <div className="absolute top-0 bottom-0 w-px bg-parchment/40" style={{ left: '50%' }} />
              {/* mini-boss ticks — no dungeon defines any yet, so this renders nothing today */}
              {miniBossPcts.map((pct, i) => (
                <div key={i} className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80" style={{ left: `${pct}%` }} />
              ))}
            </div>
            {/* boss marker, fixed at the end of the track */}
            <div className="absolute -top-3 -right-0.5 text-crimson/90" title={dungeon.boss}>
              <IconSkull className="w-3.5 h-3.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
            </div>
            {/* player position marker, slides along the track as depth advances */}
            <div
              className="absolute -top-3 -translate-x-1/2 text-gold transition-[left] duration-500"
              style={{ left: `${playerBarPct}%` }}
              title={ch.name}
            >
              <IconSword className="w-3 h-3 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
            </div>
          </div>
        </div>
      )}

      {phase === 'fight' && enemy.isBoss && (
        <div className="mb-3 bg-black/40 border-2 border-crimson/60 rounded px-3 py-2">
          <div className="flex justify-between items-baseline gap-2">
            <span className="font-display text-crimson text-xs sm:text-sm uppercase tracking-[0.1em] truncate flex items-center">
              ✦ {enemy.name}{bossPhaseName && <span className="text-amber-400"> — {bossPhaseName}</span>}
            </span>
            <span className="text-xs text-parchment/70 shrink-0">{formatGameNumber(Math.max(0, enemy.hp))}/{formatGameNumber(enemy.maxHp)}</span>
          </div>
          <div className="h-3 bg-black/50 rounded mt-1 overflow-hidden">
            <div className="h-3 bg-crimson rounded transition-[width] duration-300" style={{ width: `${hpPct(enemy.hp, enemy.maxHp)}%` }} />
          </div>
          <AtbBar roundKey={enemyRoundKey} roundMs={enemyRoundMs} paused={paused} colorClass="bg-amber-400" />
          {enemyTags.length > 0 && <div className="text-[11px] text-green-400/90 mt-1 truncate">{enemyTags.join(', ')}</div>}
          <CombatMechanicDisplay owner="enemy" states={combatMechanicStates} onOpen={(state) => setOpenMechanicId(state.mechanic.id)} />
        </div>
      )}

      <div className="relative rounded border-2 border-black/60 overflow-hidden bg-black/30">
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="w-full block" style={{ imageRendering: 'pixelated' }} />
        {resultBanner && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <span
              className={`font-display text-5xl sm:text-6xl font-bold uppercase tracking-[0.15em] ${
                resultBanner === 'victory' ? 'text-amber-300' : 'text-crimson'
              }`}
              style={{
                animation: 'resultBannerPop 2000ms ease-out forwards',
                textShadow: resultBanner === 'victory'
                  ? '0 0 18px rgba(255,200,60,0.85), 0 3px 0 rgba(0,0,0,0.9)'
                  : '0 0 18px rgba(220,40,40,0.85), 0 3px 0 rgba(0,0,0,0.9)',
              }}
            >
              {resultBanner === 'victory' ? 'Vitória!' : 'Derrota'}
            </span>
          </div>
        )}
        {activeBadgeKey && (
          <div className="absolute inset-0 z-10" onClick={() => setActiveBadgeKey(null)} />
        )}
        <EffectBadgeRow
          badges={playerBadges} align="left" activeKey={activeBadgeKey}
          onToggle={(key) => setActiveBadgeKey((cur) => (cur === key ? null : key))}
        />
        <EffectBadgeRow
          badges={enemyBadges} align="right" activeKey={activeBadgeKey}
          onToggle={(key) => setActiveBadgeKey((cur) => (cur === key ? null : key))}
        />
        {floaters.map((f) => {
          // Damage dealt to the player stays put above the character (not
          // rising) and reads bigger/sharper — it was hard to read as a
          // pale, moving red against the busy background.
          const playerHit = f.side === 'player';
          const spriteHeight = playerHit ? heroSpr.idle.scale : enemySprite(enemy.shape).scale;
          const baseTopPct = floatBaseTopPct(spriteHeight);
          const baseLeftPct = playerHit ? PLAYER_FLOAT_LEFT_PCT : ENEMY_FLOAT_LEFT_PCT;
          const jitter = FLOATER_JITTER[f.slot % FLOATER_JITTER.length];
          return (
          <div
            key={f.id}
            className="absolute font-extrabold pointer-events-none"
            style={{
              // f.slot is assigned once at creation (see pushFloat) and never
              // recomputed — keeps every simultaneous number (a poison tick,
              // the hit right after it, a heal, a block tag) in its own
              // fixed spot near the character the whole time it's visible,
              // instead of jumping every time an unrelated floater expires.
              // baseTopPct/baseLeftPct anchor to the actual sprite (see
              // floatBaseTopPct) instead of a fixed screen position, and
              // FLOATER_JITTER scatters simultaneous numbers slightly instead
              // of stacking them into a tall staircase.
              left: `calc(${baseLeftPct}% + ${jitter.x}px)`,
              top: `calc(${baseTopPct}% + ${jitter.y}px)`,
              animation: `${playerHit ? 'floatStatic' : 'float'} ${FLOAT_DURATION_MS}ms ease-out forwards`,
            }}
          >
            {f.miss ? (
              <span className="text-lg text-parchment/60 drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">erro!</span>
            ) : f.heal ? (
              // Green "+value" for any HP recovered — ability heal, regen
              // tick, potion, lifesteal — all of which used to update HP
              // silently with no on-screen number at all, only ever a
              // combat-log line.
              <span className="inline-block text-3xl text-green-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                +{formatGameNumber(f.value)}
              </span>
            ) : (
              <>
                {/* A crit is the same color as a normal hit on that side,
                    just one size step up with a "!" appended directly to
                    the number — a separate gold-gradient treatment (tried
                    earlier) read as muddy/hard to parse against the busy
                    background, so it's gone. */}
                <span
                  className={`inline-block ${
                    playerHit
                      ? (f.crit ? 'text-4xl' : 'text-3xl')
                      : `${f.crit ? 'text-3xl' : 'text-2xl'} text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]`
                  }`}
                  style={{
                    color: playerHit ? '#ff4040' : undefined,
                    textShadow: playerHit ? '0 0 3px #000, 0 2px 2px #000, 0 0 12px rgba(0,0,0,0.85)' : undefined,
                  }}
                >
                  -{formatGameNumber(f.value)}{f.crit ? '!' : ''}
                </span>
                {/* Cutting the number in half already shows the effect, but
                    a tiny " bloq." suffix was easy to miss entirely — this
                    is meant to read as unmistakably as the crit "!" does. */}
                {f.blocked && (
                  <div className="text-center text-sm font-bold text-sky-300 leading-tight drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
                    Bloqueado!
                  </div>
                )}
              </>
            )}
          </div>
          );
        })}
        {goldSteals.map((g) => (
          <div
            key={g.id}
            className="absolute left-[24%] flex items-center gap-1 pointer-events-none"
            style={{ top: '4%', animation: `float ${FLOAT_DURATION_MS}ms ease-out forwards` }}
          >
            <img src={moedaIcon} alt="" className="w-5 h-5" style={{ imageRendering: 'pixelated' }} />
            <span className="text-red-400 font-extrabold text-base drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">▼</span>
            <span className="text-parchment font-bold text-sm drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">-{formatGameNumber(g.amount)}</span>
          </div>
        ))}
        {abilityCasts.map((a) => {
          const playerCast = a.side === 'player';
          return (
            <div
              key={a.id}
              // Player side sits behind/beside the hero (further left than
              // the hero's own X, toward their back — away from the enemy
              // they're facing) AND a bit above chest height, instead of
              // dead center — center (top-1/2) turned out to still land in
              // the same vertical band the player's own floating numbers
              // cluster in (floatBaseTopPct anchors ~54% up the sprite), so
              // once 2+ floaters jittered at once (see FLOATER_JITTER —
              // e.g. a heal and a hit landing the same instant) one of them
              // could still slide close enough to left-9%/center to clip
              // the callout. Pushed further left AND up onto the
              // shoulder/head band, clear of that whole cluster on both
              // axes, while staying part of the hero's own silhouette
              // instead of floating disconnected near the frame's top edge
              // (see PLAYER_FLOAT_LEFT_PCT + floatBaseTopPct above). Enemy
              // side has no icon (see below) so it stays up top out of the
              // way of its own floaters instead.
              className={`absolute flex flex-col items-center gap-1 pointer-events-none -translate-x-1/2 ${playerCast ? 'left-[4%] top-[34%] -translate-y-1/2' : 'left-[68%] top-[13%]'}`}
              style={{ animation: `abilityCastPop ${ABILITY_CAST_DURATION_MS}ms ease-out forwards` }}
            >
              {/* Only the player's own class has real per-ability icon art
                  (see activeAbilityIconStyle) — an enemy callout stays
                  text-only (name + damage) instead of showing a made-up
                  placeholder glyph that would look like missing/wrong art
                  next to everything else in the game that IS hand-drawn.
                  Small enough to just confirm "an ability fired" without
                  dominating the stage. */}
              {playerCast && (
                <div
                  className="w-6 h-6 rounded border-2 border-gold bg-black/70 flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.7)]"
                  style={a.icon ?? undefined}
                >
                  {!a.icon && <IconActive className="w-3 h-3 text-gold" />}
                </div>
              )}
              <span className="text-[11px] font-bold text-parchment text-center leading-tight whitespace-nowrap drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
                {a.name}
              </span>
              {a.value !== null && (
                <span className={`text-sm font-extrabold drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] ${a.heal ? 'text-green-400' : 'text-parchment'}`}>
                  {a.heal ? '+' : '-'}{formatGameNumber(a.value)}
                </span>
              )}
            </div>
          );
        })}
        {paused && phase === 'fight' && (
          <div className="absolute top-2 right-2 bg-black/70 text-gold text-xs font-bold uppercase tracking-wider px-2 py-1 rounded">
            Pausado
          </div>
        )}
        {dungeon.isNightmare && (
          <div className="absolute top-2 left-2 bg-black/70 text-crimson text-xs font-bold px-2 py-1 rounded">
            ☠ Modo Pesadelo
          </div>
        )}
        {phase === 'ended' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 px-6">
            <div className="text-center">
              <p className={`font-display text-lg sm:text-xl [text-shadow:0_2px_6px_rgba(0,0,0,0.9)] mb-4 ${
                ironDeath ? 'text-crimson' : 'text-gold'
              }`}>
                {endedReason === 'victory' && `Você derrotou o guardião de ${dungeon.name} — masmorra concluída!`}
                {endedReason === 'death' && (ironDeath ? 'Modo Ferro não perdoa — seu herói caiu para sempre.' : 'Sua expedição terminou.')}
                {endedReason === 'retreat' && 'Você retornou em segurança.'}
              </p>
              {repeatTotal && endedReason !== 'retreat' ? (
                <>
                  <p className="text-xs text-parchment/60 mb-3">
                    Expedição {repeatCurrent ?? 1}/{repeatTotal} concluída —{' '}
                    {(repeatCurrent ?? 1) >= repeatTotal ? 'voltando ao Reino' : 'a próxima começa'} automaticamente...
                  </p>
                  <Button onClick={confirmReturnToHub}>Parar Sequência</Button>
                </>
              ) : (
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button onClick={confirmReturnToHub}>{ironDeath ? 'Aceitar o Destino' : 'Voltar ao Reino'}</Button>
                  {endedReason !== 'retreat' && !ironDeath && (
                    <Button onClick={confirmRestart}>Reiniciar Masmorra</Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {weapon && (
        <p className="mt-2 text-xs text-parchment/50">
          Empunhando: <span style={{ color: rarityColor(weapon.rarity) }}>{itemDisplayName(weapon)}</span>
        </p>
      )}

      {phase === 'fight' && (
        <div className="flex gap-2 mt-3">
          {(() => {
            const potionLeft = potionCooldownRef.current;
            const potionOnCooldown = potionLeft > 0;
            const potionPct = potionOnCooldown ? potionLeft / POTION_COOLDOWN_ROUNDS : 0;
            const potionDisabled = noPotions || ch.potions <= 0 || ch.hp >= effMaxHp || potionOnCooldown;
            return (
              <button
                onClick={drinkPotionManually}
                disabled={potionDisabled}
                className={`relative w-11 h-11 shrink-0 ${potionDisabled ? 'cursor-default' : 'hover:brightness-110'}`}
                title={noPotions ? 'Poções desativadas nesta expedição' : `Poção (${ch.potions})${potionOnCooldown ? ` — recarregando` : ''}`}
              >
                <img
                  src={pocaoIcon}
                  alt=""
                  className={`absolute inset-[16%] w-[68%] h-[68%] object-contain pointer-events-none select-none ${potionDisabled ? 'opacity-40 grayscale' : ''}`}
                  draggable={false}
                />
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: 'conic-gradient(rgba(0,0,0,0.75) var(--cd-pct), transparent var(--cd-pct))',
                    ['--cd-pct' as string]: `${potionPct * 100}%`,
                    transition: potionPct === 1 ? 'none' : `--cd-pct ${ATTACK_INTERVAL}ms linear`,
                  } as CSSProperties}
                />
                <img src={skillFrame} alt="" className="absolute inset-0 w-full h-full pointer-events-none select-none" draggable={false} />
                <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-gold text-ink rounded-full px-1 min-w-[16px] text-center border border-black/40 shadow pointer-events-none">
                  {ch.potions}
                </span>
              </button>
            );
          })()}
          {equippedAbilities().map((ab) => {
            const left = cooldownsRef.current[ab.id] ?? 0;
            const onCooldown = left > 0;
            const pct = onCooldown ? left / ab.cooldown : 0;
            // A fresh cast snaps the wedge to full instantly (pct === 1);
            // every round after that eases it down smoothly over the same
            // ATTACK_INTERVAL the round loop itself ticks on, so the wipe
            // reads as one continuous sweep instead of a per-round jump.
            const iconBg = activeAbilityIconStyle(ch.classId, ab.id);
            return (
              <button type="button" onClick={() => setOpenAbilityId(ab.id)} key={ab.id} className="relative w-11 h-11 shrink-0" title={`${ab.name}${onCooldown ? ` — recarregando` : ''}`}>
                {iconBg ? (
                  <div
                    className={`absolute inset-[18%] rounded-full overflow-hidden ${onCooldown ? 'opacity-50' : ''}`}
                    style={iconBg}
                  />
                ) : (
                  <IconActive className={`absolute inset-[18%] ${onCooldown ? 'text-parchment/40' : 'text-gold'}`} />
                )}
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: 'conic-gradient(rgba(0,0,0,0.75) var(--cd-pct), transparent var(--cd-pct))',
                    ['--cd-pct' as string]: `${pct * 100}%`,
                    transition: pct === 1 ? 'none' : `--cd-pct ${ATTACK_INTERVAL}ms linear`,
                  } as CSSProperties}
                />
                <img src={skillFrame} alt="" className="absolute inset-0 w-full h-full pointer-events-none select-none" draggable={false} />
                {ch.classId === 'ladino' && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-black/90 border border-gold/50 px-1 text-[7px] font-bold text-gold pointer-events-none">{ab.actionType === 'quick' ? 'RÁPIDA' : 'PRINCIPAL'}</span>}
              </button>
            );
          })}
        </div>
      )}

      {phase === 'fight' && (
        <CombatMechanicDisplay
          owner="player"
          states={combatMechanicStates}
          onOpen={(state) => setOpenMechanicId(state.mechanic.id)}
        />
      )}
      {openMechanicId && <MechanicQuickModal
        mechanicId={openMechanicId}
        currentValue={openMechanicState?.value}
        maxValue={openMechanicState?.maxValue ?? openMechanicState?.mechanic.combatDisplay?.maxValue}
        duration={openMechanicState?.duration}
        detail={openMechanicState?.detail}
        onClose={() => setOpenMechanicId(null)}
      />}
      {openCombatAbility && <Modal title={openCombatAbility.name} onClose={() => setOpenAbilityId(null)}>
        <p className="text-parchment/80"><MechanicText text={openCombatAbility.desc} character={ch} ability={openCombatAbility} /></p>
        <div className="rounded border border-panelborder/50 bg-panel2/50 p-2 text-xs space-y-1">
          {ch.classId === 'ladino' && <p><span className="text-parchment/45">Ação: </span>{openCombatAbility.actionType === 'quick' ? 'RÁPIDA — usada na Janela de Iniciativa' : 'PRINCIPAL'}</p>}
          <p><span className="text-parchment/45">Recarga: </span>{openCombatAbility.cooldown} ciclos</p>
          {combatAbilityRequirements.map((requirement) => <p key={requirement}><span className="text-parchment/45">Estado atual: </span>{requirement}</p>)}
          {openCombatAbility.effect.faithCost && <p><span className="text-parchment/45">Custo: </span>{openCombatAbility.effect.faithCost} Fé, cobrada ao usar</p>}
          {openCombatAbility.effect.soulCost && <p><span className="text-parchment/45">Custo: </span>{openCombatAbility.effect.soulCost} {openCombatAbility.effect.soulCost === 1 ? 'Alma' : 'Almas'}, cobrada ao usar</p>}
          {combatAbilityHeal !== null && <p className="text-green-300"><span className="text-parchment/45">Cura atual: </span>recupera até {formatGameNumber(combatAbilityHeal)}</p>}
        </div>
      </Modal>}

      <div className={`grid gap-4 mt-3 text-sm ${enemy.isBoss ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <div>
          <div className="flex justify-between items-baseline gap-2">
            <span className="truncate">{ch.name}{playerShieldState > 0 && <span className="text-sky-300 text-xs"> (+{playerShieldState} escudo)</span>}</span>
            <span className="shrink-0">{formatGameNumber(Math.max(0, ch.hp))}/{formatGameNumber(effMaxHp)}</span>
          </div>
          <div className="h-2 bg-black/50 rounded"><div className="h-2 bg-red-500 rounded" style={{ width: `${hpPct(ch.hp, effMaxHp)}%` }} /></div>
          {phase === 'fight' && <AtbBar roundKey={playerRoundKey} roundMs={playerRoundMs} paused={paused} colorClass="bg-sky-400" />}
          {playerTags.length > 0 && <div className="text-[11px] text-amber-300/90 mt-0.5 truncate">{playerTags.join(', ')}</div>}
        </div>
        {!enemy.isBoss && (
          <div>
            <div className="flex justify-between">
              <span className={`truncate flex items-center ${enemy.isElite ? 'text-amber-400 font-bold' : ''}`}>{enemy.isElite ? '★ ' : ''}{enemy.name}</span>
              <span className="shrink-0">{formatGameNumber(Math.max(0, enemy.hp))}/{formatGameNumber(enemy.maxHp)}</span>
            </div>
            <div className="h-2 bg-black/50 rounded"><div className="h-2 bg-yellow-500 rounded" style={{ width: `${hpPct(enemy.hp, enemy.maxHp)}%` }} /></div>
            {phase === 'fight' && <AtbBar roundKey={enemyRoundKey} roundMs={enemyRoundMs} paused={paused} colorClass="bg-amber-400" />}
            {enemyTags.length > 0 && <div className="text-[11px] text-green-400/90 mt-0.5 truncate">{enemyTags.join(', ')}</div>}
            <CombatMechanicDisplay owner="enemy" states={combatMechanicStates} onOpen={(state) => setOpenMechanicId(state.mechanic.id)} />
          </div>
        )}
      </div>

      {phase === 'fight' && (
        <div className="mt-4 flex gap-2">
          <Button className="flex-1 !min-w-0 !px-2 text-sm" onClick={togglePause}>
            {paused ? 'Retomar Combate' : 'Pausar'}
          </Button>
          <Button className="flex-1 !min-w-0 !px-2 text-sm" onClick={retreatSafely}>Retornar ao Reino</Button>
        </div>
      )}

      <div className="mt-3 bg-black/30 border border-white/10 rounded p-2 h-24 overflow-y-auto text-sm text-parchment/80 flex flex-col-reverse">
        <div>
          {log.slice().reverse().map((segments, i) => (
            <p key={i} className="leading-tight py-0.5">
              {segments.map((s, j) => (
                <span key={j} style={s.color ? { color: s.color } : undefined}>{s.text}</span>
              ))}
            </p>
          ))}
        </div>
      </div>
    </Panel>
    {catchUpSummary && (
      <Modal
        title="Enquanto você estava fora"
        onClose={() => setCatchUpSummary(null)}
        footer={<Button onClick={() => setCatchUpSummary(null)}>Continuar</Button>}
      >
        <p>
          Se passaram {formatCatchUpDuration(catchUpSummary.elapsedMs)} enquanto você estava fora — o combate
          continuou sozinho nesse tempo. Veja o que aconteceu:
        </p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Inimigos derrotados: {catchUpSummary.kills}</li>
          <li>Ouro ganho: {catchUpSummary.gold}</li>
          <li>XP ganho: {catchUpSummary.xp}</li>
          <li>
            Itens encontrados: {catchUpSummary.itemsFound}
            {catchUpSummary.itemsAutoSold > 0 ? ` (${catchUpSummary.itemsAutoSold} vendidos automaticamente)` : ''}
          </li>
          {catchUpSummary.leveledUp && <li className="text-gold font-bold">Você subiu de nível!</li>}
          {catchUpSummary.died && <li className="text-red-400 font-bold">Você caiu em combate enquanto estava fora.</li>}
          {catchUpSummary.won && <li className="text-emerald-400 font-bold">Você derrotou o guardião da masmorra enquanto estava fora!</li>}
        </ul>
      </Modal>
    )}
    </>
  );
}
