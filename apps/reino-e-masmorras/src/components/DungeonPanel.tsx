import { CSSProperties, useEffect, useRef, useState } from 'react';
import {
  AbilityDef, Character, CrowdControlKind, EnemyAbility, EnemyInstance, DungeonDef, ItemSlot,
  Rarity, StatModStat, StatusEffectKind,
} from '../types/game';
import { spawnEnemy, enemySpeedMult } from '../lib/enemies';
import { CLASS_SPEED_MULT, CLASSES, grantXp } from '../lib/classes';
import { computeCombatStats, effectiveMaxHp, BASE_CRIT_DMG_MULT, LIFESTEAL_CAP } from '../lib/combatStats';
import { baseDropChanceForLevel, generateItem, pickBossDropRarity, rarityColor, rarityName, sellValue } from '../lib/equipment';
import { difficultyProgress } from '../lib/dungeons';
import { RUNE_DROP_CHANCE_REGULAR, RUNE_DROP_CHANCE_BOSS, rollRuneDrop, addRune } from '../lib/runes';
import { itemDisplayName } from '../lib/enhancement';
import { OFFHAND_KIND } from '../lib/itemTiers';
import { thornsDamageForAction } from '../lib/thorns';
import { canFitInInventory, placeInInventory } from '../lib/inventoryGrid';
import { computeSkillBonuses, getEquippedAbilities } from '../lib/skills';
import { ThermalState, advanceThermal, thermalAfterFrozenEnds } from '../lib/mago';
import { DECOMPOSITION_MAX, EnemyStackInstance, PeriodicEffectInstance, PLAGUE_EFFECT_ID, SOUL_MAX, SummonInstance, advanceSummonClock, clampResource, makeBoneServant, plagueTickDamage, soulsForCrossedThresholds, soulsForNextEnemy } from '../lib/necromancer';
import { ROGUE_IMAGE_MAX, ROGUE_STEALTH_MAIN_LIMIT, RoguePreparedTrick, RogueTrickKind, firstEligibleQuick, prepareTrick } from '../lib/rogue';
import { PaladinAegis, PaladinLiturgyState, PaladinVirtue, createPaladinLiturgyState, paladinAegisReduction, paladinConviction } from '../lib/paladin';
import { ArcherCombatState, archerDistanceLabel, archerDistanceShift, createArcherCombatState, gainArcherSteps, loseArcherTension, prepareArcherReflex, accelerateOldestArrow } from '../lib/archer';
import { DruidCycleState, GardenUnit, createDruidCycle, advanceDruidSeason, pickDruidSeasonalAbility, addGardenSeeds, type DruidSeason, type DruidForm } from '../lib/druid';
import { WarlockPlayerState, WarlockEnemyNameState, createWarlockPlayerState, createWarlockEnemyNameState, projectWarlockCast, addNameFragment, consumeMandamento, collectionAmount } from '../lib/warlock';
import { SorcererState, SorcererEnemyState, createSorcererState, createSorcererEnemyState } from '../lib/sorcerer';
import { BardScoreState, countertempoEcho, createBardState, resetBardEnemy } from '../lib/bardo';
import { GUARD_BREAK_ACTIONS, GUARD_BREAK_MAX_ACTIONS, GUARD_BREAK_RESET, GUARD_BREAK_RESET_VANGUARD, GUARD_BREAK_TICKS, POSTURE_MAX, PreparedGuardState, recoverablePosture, ReadingKind, RiposteKind, WarriorEnemyState, applyPostureDamage, createWarriorEnemyState, crossesLowerBand, parryReduction, postureBand } from '../lib/warrior';
import { FURY_MAX, FURY_MIN, FURY_GAIN_TAKE_DAMAGE, FURY_GAIN_TAKE_DAMAGE_SANGUE_QUENTE, FURY_GAIN_PAIN_TICK, FRENZY_SPEED_BONUS, FRENZY_DMG_TAKEN_BONUS, WOUND_DMG_PCT_PER_STACK, WOUND_DMG_PCT_PER_STACK_MUSCULO_RASGADOR, PAIN_MAX_PCT, PAIN_TICKS, PAIN_TICKS_INQUEBRAVEL, PAIN_PASSIVE_REDIRECT_PCT, PAIN_TICK_REDUCTION_LOW_HP_PCT, PAIN_TICK_REDUCTION_LOW_HP_THRESHOLD, POSTURA_BASE_REDIRECT_PCT, INQUEBRAVEL_PAIN_CAP_BONUS, FURIA_CORACAO_DE_GUERRA_RATE, FURIA_CORACAO_DE_GUERRA_CAP, FURIA_CORPO_EM_FRENESI_RATE, FURIA_CORPO_EM_FRENESI_CAP, FURIA_GOLPE_DEVASTADOR_RATE, FURIA_GOLPE_DEVASTADOR_CAP, RESISTENCIA_PELE_ENDURECIDA_RATE, RESISTENCIA_PELE_ENDURECIDA_CAP, RESISTENCIA_ESPIRITO_INDOMAVEL_RATE, RESISTENCIA_ESPIRITO_INDOMAVEL_CAP, RESISTENCIA_CORPO_DURO_HIT_THRESHOLD_PCT, RESISTENCIA_CORPO_DURO_RATE, RESISTENCIA_CORPO_DURO_CAP, RESISTENCIA_CONSTITUICAO_PAIN_THRESHOLD_PCT, RESISTENCIA_CONSTITUICAO_RATE, RESISTENCIA_CONSTITUICAO_CAP, RESISTENCIA_OSSOS_FORTES_RATE, RESISTENCIA_OSSOS_FORTES_CAP, RESISTENCIA_CORACAO_SELVAGEM_HP_THRESHOLD, RESISTENCIA_CORACAO_SELVAGEM_RATE, RESISTENCIA_CORACAO_SELVAGEM_CAP, POSTURA_VIT_RATE, POSTURA_VIT_CAP, SANGUE_DE_CACA_MIN_WOUNDS, SANGUE_DE_CACA_BASE_HEAL_PCT, SANGUE_DE_CACA_VIT_RATE, SANGUE_DE_CACA_VIT_CAP, capped, attrTotal, hasSkill, evalAbilityCondition, PainPacket, AbilityConditionContext, createPainPacket, tickPainPackets, consumeWildPostureAction } from '../lib/barbarian';
import { FAITH_MAX, FAITH_START_FIRST_ENEMY, nextFaithForNewEnemy, MAOS_CONSAGRADAS_HEAL_EFFICIENCY_PCT, BARRIER_FAITH_THRESHOLD_PCT, GRACE_BASE_CAP_PCT, GRACE_DIVINA_CAP_PCT, GRACE_FOLEGO_VIT_RATE, GRACE_FOLEGO_VIT_CAP, SANTUARIO_VIVO_MAX_ROUNDS_BONUS, SANTUARIO_VIVO_BURST_THRESHOLD_PCT, SANTUARIO_VIVO_BURST_REDUCTION_PCT, SOLO_CONSAGRADO_MDEF_BONUS, SOLO_CONSAGRADO_TENACITY_BONUS, SOLO_CONSAGRADO_FIRST_NEGATIVE_DURATION_CUT, VIGILIA_FIRST_DOT_TICK_REDUCTION_PCT, INTERCESSAO_HEAL_PCT, FE_VIGILANTE_EXTEND_ROUNDS, GUARDA_DA_ALMA_SHIELD_DEF_PCT, COURACA_ESPIRITUAL_CONSECRATION_MDEF_PCT, ANCORA_SAGRADA_WINDOW_TICKS, ANCORA_SAGRADA_NEXT_HIT_REDUCTION_PCT, MURALHA_DIVINA_CONSECRATION_ROUNDS, MURALHA_DIVINA_DMG_TAKEN_PCT, JUDGMENT_DMG_PCT_PER_STACK, SABEDORIA_COMPASSIVA_HP_THRESHOLD, SABEDORIA_COMPASSIVA_HEAL_EFFICIENCY_PCT, VEU_DA_ALMA_HEAL_EFFICIENCY_PCT, BarrierPortion, tickJudgmentState, clericBaseHp, clericDirectHealAmount, clericPassiveHealAmount } from '../lib/clerigo';
import { CLERIC_APOCALIPSE_SAGRADO_ABILITY_ID, prioritizeClericTrialRotation } from '../lib/clerigo';
import { DETERMINATION_MAX, determinationForDirectHit, determinationForPreventedDamage, addDetermination, DETERMINATION_GEN_BARRIER_PER_3PCT, DETERMINATION_GEN_BARRIER_CAP_PER_ACTION, DETERMINATION_GEN_BARRIER_THRESHOLD_PCT, IRON_WALL_DETERMINATION_THRESHOLD_PCT, RETALIATION_MAX_CHARGES, RETALIATION_BLOCKS_PER_CHARGE, MOMENTUM_MAX_BASE, MOMENTUM_LOSS_HEAVY_HIT_PCT_BASE, MOMENTUM_LOSS_AMOUNT_BASE, SANGUE_DE_COMBATE_THRESHOLD_RATE, SANGUE_DE_COMBATE_THRESHOLD_CAP, INSTINTO_SOBREVIVENCIA_VIT_DIVISOR, INSTINTO_SOBREVIVENCIA_LOSS_REDUCTION_CAP, MOMENTUM_LOSS_MIN, MOMENTUM_BONUS_SPEED_PER_20_BASE, MOMENTUM_BONUS_SPEED_PER_20_UPGRADED, MOMENTUM_MAX_VETERANO_BONUS, SEDE_DE_VITORIA_HEAL_PCT, SEDE_DE_VITORIA_MOMENTUM_CARRY_CAP, IMPARAVEL_HIGH_MOMENTUM_PCT_THRESHOLD, IMPARAVEL_HIGH_MOMENTUM_TENACITY_BONUS, ORDERS_MAX, DISCIPLINA_MILITAR_TENACITY_RATE, DISCIPLINA_MILITAR_TENACITY_CAP, FORMACAO_DEF_RATE, FORMACAO_DEF_CAP, DISCIPLINA_INABALAVEL_THRESHOLD, ARMADURA_ACO_HEAVY_HIT_PCT, ARMADURA_ACO_RATE, ARMADURA_ACO_CAP, PULSO_VITAL_BARRIER_EFF_RATE, PULSO_VITAL_BARRIER_EFF_CAP, PESO_ARMADURA_RATE, PESO_ARMADURA_CAP, ESCUDO_DISCIPLINADO_WINDOW_TICKS, ESCUDO_DISCIPLINADO_REDUCTION_PCT, CORPO_BLINDADO_DEF_TO_MDEF_PCT, CORPO_BLINDADO_CAP_PCT_OF_MDEF, JURAMENTO_RESISTENCIA_THRESHOLD, JURAMENTO_RESISTENCIA_DURATION_CUT, NUCLEO_ACO_HP_THRESHOLD, NUCLEO_ACO_RATE, NUCLEO_ACO_CAP, IRON_WALL_DMG_RED_BASE, IRON_WALL_DMG_RED_CAP, IRON_WALL_DET_GEN_PER_2PCT, IRON_WALL_DET_GEN_CAP_PER_ACTION, LIVING_FORTRESS_DMG_RED_BASE, LIVING_FORTRESS_DMG_RED_CAP, LIVING_FORTRESS_MIN_BLOCK_CHANCE, COLOSSAL_SHIELD_CC_NEGATE_CONSUME_PCT, LAST_GUARD_POST_BARRIER_BASE, LAST_GUARD_POST_BARRIER_PER_VIT, LAST_GUARD_POST_BARRIER_CAP, COUNTER_STANCE_CAP_BASE, COUNTER_STANCE_CAP_PER_VIT, COUNTER_STANCE_CAP_CAP, COUNTER_STANCE_STORE_PCT, BASTIAO_INQUEBRAVEL_BARRIER_PCT, BASTIAO_INQUEBRAVEL_DETERMINATION_GAIN, BASTIAO_INQUEBRAVEL_DMG_REDUCTION_PCT, BASTIAO_INQUEBRAVEL_DMG_REDUCTION_ROUNDS, isGolpePesado } from '../lib/knight';
import { TRAP_MAX_ARMED_BASE, TRAP_MAX_ARMED_MESTRE_ARMADILHEIRO, PRIMED_TRAP_BONUS_PCT, MESTRE_ARMADILHEIRO_NEXT_TRAP_BONUS_PCT, RECENT_TRAP_TRIGGER_WINDOW_TICKS, ENGENHARIA_PRECISA_TRAP_DMG_RATE, ENGENHARIA_PRECISA_TRAP_DMG_CAP, CONHECIMENTO_VENENOS_POISON_RATE, CONHECIMENTO_VENENOS_POISON_CAP, PASSOS_ARMADILHEIRO_SPEED_UNCONDITIONAL_PCT, PASSOS_ARMADILHEIRO_SPEED_RATE, PASSOS_ARMADILHEIRO_SPEED_CAP, SOBREVIVENCIA_CAMPO_DMG_REDUCTION_RATE, SOBREVIVENCIA_CAMPO_DMG_REDUCTION_CAP, MECANICA_REFINADA_TRAP_DMG_RATE, MECANICA_REFINADA_TRAP_DMG_CAP, DESORIENTADO_ACCURACY_PCT, DESORIENTADO_ACCURACY_PCT_MARKED, DESORIENTADO_ROUNDS, PACIENCIA_DA_CACA_EVASION_RATE, PACIENCIA_DA_CACA_EVASION_CAP, TRAIL_MAX, TRAIL_GAIN_PER_ACTION, MEMORIA_DA_TRILHA_FIRST_ACTION_BONUS, MARKED_PREY_THRESHOLD, OLHOS_RASTREADOR_ACCURACY_RATE, OLHOS_RASTREADOR_ACCURACY_CAP, PASSOS_SILENCIOSOS_EVASION_RATE, PASSOS_SILENCIOSOS_EVASION_CAP, LEITURA_MOVIMENTO_DMG_REDUCTION_RATE, LEITURA_MOVIMENTO_DMG_REDUCTION_CAP, MIRA_PERSEGUICAO_ACCURACY_RATE, MIRA_PERSEGUICAO_ACCURACY_CAP, PRESA_MARCADA_ACCURACY_BONUS_PCT, PRESA_MARCADA_TRAP_DMG_BONUS_PCT, FOLEGO_PERSEGUICAO_SPEED_BASE, FOLEGO_PERSEGUICAO_SPEED_RATE, FOLEGO_PERSEGUICAO_SPEED_CAP, INSTINTO_FUGA_WINDOW_TICKS, LEITURA_COMPLETA_CRIT_RATE, LEITURA_COMPLETA_CRIT_CAP, PASSO_ETEREO_TRAIL_GAIN_ON_MISS, MANTO_SOMBRAS_MAX_BREACHES_PER_CAST, BREACH_MAX, applyBreach, tickBreach, MIRA_CIRURGICA_ACCURACY_RATE, MIRA_CIRURGICA_ACCURACY_CAP, PULSO_FRIO_CRIT_RATE, PULSO_FRIO_CRIT_CAP, LEITURA_BALISTICA_CRIT_DMG_BONUS_AT_3_BREACHES, MUNICAO_SELECIONADA_CRIT_DMG_RATE, MUNICAO_SELECIONADA_CRIT_DMG_CAP, RITMO_ABATE_SPEED_UNCONDITIONAL_PCT, RITMO_ABATE_SPEED_RATE, RITMO_ABATE_SPEED_CAP, PONTO_FRACO_ACCURACY_PER_BREACH, PONTO_FRACO_CRIT_DMG_PER_BREACH, FOCO_CARRASCO_HP_THRESHOLD, FOCO_CARRASCO_CRIT_RATE, FOCO_CARRASCO_CRIT_CAP } from '../lib/hunter';
import { rollAbilityHit, mitigatedBase } from '../game/combat';
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
import { consumeCombatEvents, createCombatState, recoverAfterEncounter, resolvePlayerAction, type CombatEvent } from '../lib/combatEngine';
import { buildAbilityConditionContext } from '../lib/combatConditions';
import { isSelfAbilityKind } from '../lib/abilityResolver';
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
  // Optional events emitted by the shared combat engine. The legacy live
  // scheduler remains compatible, while engine-backed callers can feed the
  // exact same log/floater/flash presentation boundary.
  engineEvents?: CombatEvent[];
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
  character, dungeon, onLiveUpdate, onRunEnd, onRestart, autoSellRarities, noPotions, repeatCurrent, repeatTotal, engineEvents,
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
  // Postura Selvagem's temporary 35%-total redirect window. The value is
  // action charges (three direct enemy hits), not an envTick countdown.
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
  const knightBannerRefundWindowRef = useRef(false);

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
  function warlockOnEnemyRealAction() {
    if (!isWarlock() || !warlockNode6('maldicao') || !warlockEnemyRef.current.bound) return;
    warlockEnemyRef.current = addNameFragment(warlockEnemyRef.current, 1);
    pushLog('FRAGMENTO DO NOME +1');
    warlockSync();
  }
  function isDruid(){return chRef.current.classId==='druida';}
  function druidSync(){if(!silentRef.current)setDruidCycleState({...druidCycleRef.current,completed:new Set(druidCycleRef.current.completed)});}
  function druidAdvance(){if(!isDruid())return; druidCycleRef.current=advanceDruidSeason(druidCycleRef.current); druidSync();}
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

  // Feiticeiro — session-only Pulso/Ressonância/Controle and per-enemy
  // Fraturas. Resources deliberately live in refs so the timer loop always
  // sees the current value and carries only the resources specified by the
  // class between enemies.
  const sorcererStateRef = useRef<SorcererState>(createSorcererState());
  const sorcererEnemyRef = useRef<SorcererEnemyState>(createSorcererEnemyState());
  const [sorcererState, setSorcererState] = useState(sorcererStateRef.current);
  const [sorcererEnemyState, setSorcererEnemyState] = useState(sorcererEnemyRef.current);
  const sorcererAwakenedRef = useRef(false);
  const sorcererEnemyReductionRef = useRef(0);
  function isSorcerer(): boolean { return chRef.current.classId === 'feiticeiro'; }
  function sorcererHasSkill(id: string): boolean { return isSorcerer() && hasSkill(chRef.current, id); }
  function sorcererSync() { if (!silentRef.current) { setSorcererState({ ...sorcererStateRef.current }); setSorcererEnemyState({ ...sorcererEnemyRef.current }); } }
  function sorcererResetEnemy() { if (!isSorcerer()) return; sorcererEnemyRef.current=createSorcererEnemyState(); sorcererSync(); }

  // Bardo — Partitura é estado de performance (ref como fonte de verdade,
  // espelho React apenas para a HUD). O score/ovação atravessa inimigos;
  // Contratempo/Eco/Fora de Tom e memória do Bis são reiniciados por alvo.
  const bardStateRef = useRef<BardScoreState>(createBardState());
  const [bardState, setBardState] = useState(bardStateRef.current);
  function isBard(): boolean { return chRef.current.classId === 'bardo'; }
  function bardSync() { if (!silentRef.current) setBardState({ ...bardStateRef.current, notes: [...bardStateRef.current.notes] }); }
  function bardHasSkill(id: string): boolean { return isBard() && hasSkill(chRef.current, id); }
  function bardResetEnemy() { if (!isBard()) return; bardStateRef.current = resetBardEnemy(bardStateRef.current); bardSync(); }
  function bardOnEnemyAction(directHitsAttempted: number, directHitsLanded: number): void {
    if (!isBard()) return;
    const hadCountertempo = bardStateRef.current.countertempo;
    const wasOutOfTune = bardStateRef.current.outOfTune;
    const echoBefore = bardStateRef.current.echo;
    bardStateRef.current = countertempoEcho(bardStateRef.current, directHitsAttempted, directHitsLanded, true);
    if (!bardHasSkill('bardo:melodia-sombria:6')) bardStateRef.current = { ...bardStateRef.current, echo: echoBefore };
    // Contratempo Perfeito turns the enemy action that was both marked by
    // Contratempo and delayed by Fora de Tom into one additional Echo.
    if (hadCountertempo && wasOutOfTune && bardHasSkill('bardo:melodia-sombria:6') && bardHasSkill('bardo:melodia-sombria:8')) {
      bardStateRef.current = { ...bardStateRef.current, echo: Math.min(2, bardStateRef.current.echo + 1) };
    }
    if (bardStateRef.current.outOfTune) bardStateRef.current = { ...bardStateRef.current, outOfTune: false };
    if (bardStateRef.current.sustain) bardStateRef.current = { ...bardStateRef.current, sustain: false };
    bardStateRef.current = { ...bardStateRef.current, harmonyProtection: false, lyricTenacity: false, echoTenacity: false, nextEnemyDamageReductionPct: 0 };
    bardStateRef.current = { ...bardStateRef.current, accentSpeed: false };
    bardSync();
  }

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

  useEffect(() => {
    if (!engineEvents?.length) return;
    consumeCombatEvents(engineEvents, {
      onLog: (line) => pushLog(line),
      onFloat: (side, amount, crit, miss, heal) => pushFloat(side, amount, !!crit, undefined, !!miss, !!heal),
      onAbilityCast: (side, name, amount) => pushAbilityCast(side, name, side === 'player' ? activeAbilityIconStyle(chRef.current.classId, engineEvents.find((event) => event.type === 'abilityCast' && event.name === name)?.abilityId ?? '') : null, amount ?? null, false),
      onFlash: (side) => flash(side),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineEvents]);

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
    const ctx: AbilityConditionContext = buildAbilityConditionContext({
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
        pulse: sorcererStateRef.current.pulse,
        resonance: sorcererStateRef.current.resonance,
        control: sorcererStateRef.current.control,
        ovation: bardStateRef.current.ovation,
        echo: bardStateRef.current.echo,
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
        fortissimo: bardStateRef.current.fortissimo,
        accent: bardStateRef.current.accent,
        encoreReady: bardStateRef.current.encoreReady,
        countertempo: bardStateRef.current.countertempo,
        outOfTune: bardStateRef.current.outOfTune,
        sustain: bardStateRef.current.sustain,
      },
      enemyStacks: { wounds: barbEnemyWoundStacks(), judgment: clerigoEnemyJudgmentStacks(), decomposition: necroDecompositionRef.current?.stacks ?? 0, fracture: sorcererEnemyRef.current.fractures, control: sorcererStateRef.current.control },
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
    });
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
  function roguePlanB(trick: RoguePreparedTrick) {
    if (!rogueHasSkill('ladino:laminas:8')) return;
    cooldownsRef.current[trick.sourceAbilityId] = Math.max(0, (cooldownsRef.current[trick.sourceAbilityId] ?? 0) - 1);
  }
  function isPaladin(): boolean { return chRef.current.classId === 'paladino'; }
  function paladinHasSkill(id: string): boolean { return isPaladin() && hasSkill(chRef.current, id); }
  function paladinSync() {
    if (silentRef.current) return;
    setPaladinLiturgyState({ ...paladinLiturgyRef.current, virtues: { ...paladinLiturgyRef.current.virtues } });
    setPaladinAegisState(paladinAegisRef.current ? { ...paladinAegisRef.current } : null);
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
  function warriorOnEnemyRealAction() {
    if (!isWarrior()) return;
    const state = warriorEnemyState();
    if (state.guardBroken) {
      warriorCommitEnemy({ ...state, suppressedActionsLeft: Math.max(0, state.suppressedActionsLeft - 1) });
      return;
    }
    const zero = state.zeroRecoveryPending;
    const recoveryOptions = {
      zero,
      pressure: state.pressureRecoveryPending,
      suppressed: state.suppressedActionsLeft > 0,
      breathless: warriorHasSkill('guerreiro:furioso:8'),
    };
    const recovered = zero ? 0 : recoverablePosture(state, recoveryOptions);
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

  function mageOnEnemyRealAction() {
    if (!isMage() || mageThermalRef.current !== 'frozen') return;
    mageThermalRef.current = thermalAfterFrozenEnds(chRef.current.unlockedSkills.includes('mago:gelido:14'));
    mageThermalTicksRef.current = 0;
    mageSync();
  }

  // ── Bárbaro redesign helpers (lib/barbarian.ts has the shared constants) ──
  function isBarbaro(): boolean { return chRef.current.classId === 'barbaro'; }
  function barbHasSkill(nodeId: string): boolean { return hasSkill(chRef.current, nodeId); }
  function syncBarbFury() { if (!silentRef.current) setBarbFuryState(barbFuryRef.current); }
  function syncBarbFrenzy() { if (!silentRef.current) setBarbFrenzyState(barbFrenzyRef.current); }
  function syncBarbPain() { if (!silentRef.current) setBarbPainState(barbPainTotal()); }

  // Every Fúria change funnels through here so entering Frenesi at 100 is
  // never missed regardless of which source pushed it over the line.
  function barbApplyFuryDelta(delta: number) {
    if (!isBarbaro()) return;
    const next = Math.max(FURY_MIN, Math.min(FURY_MAX, barbFuryRef.current + delta));
    barbFuryRef.current = next;
    syncBarbFury();
    if (next >= FURY_MAX && !barbFrenzyRef.current) {
      barbFrenzyRef.current = true;
      syncBarbFrenzy();
      pushLog([{ text: 'Fúria no máximo — Frenesi!', color: '#f59e0b' }]);
    }
  }
  // "Fontes normais" (ataque básico/habilidade que acerta/bônus de
  // crítico/receber dano/Dor Alimenta a Raiva/Muralha Selvagem/Predador
  // Supremo) — bloqueadas por completo durante Frenesi.
  function barbGainNormalFury(amount: number) {
    if (!isBarbaro() || barbFrenzyRef.current || amount <= 0) return;
    barbApplyFuryDelta(amount);
  }

  function barbEnemyWoundStacks(): number { return enemyRef.current.barbarianWounds?.stacks ?? 0; }
  // Called once per envTick — Feridas deal real damage and CAN kill (see the
  // redesign spec's "morte por efeito indireto"), routed through the same
  // applyEnemyHp (boss-phase-aware) + resolveEnemyDeath every other kill
  // source uses. Guarded the same way playerAct/enemyAct guard against a
  // pending-respawn window (hp already <= 0).
  function barbTickWounds() {
    const w = enemyRef.current.barbarianWounds;
    if (!w || w.stacks <= 0 || enemyRef.current.hp <= 0) return;
    // Músculo Rasgador (barbaro:selvageria:5) raises the per-stack/tick
    // coefficient from 3.0% to 3.2% of ATK.
    const woundPct = barbHasSkill('barbaro:selvageria:5') ? WOUND_DMG_PCT_PER_STACK_MUSCULO_RASGADOR : WOUND_DMG_PCT_PER_STACK;
    const dmg = Math.max(1, Math.round(computePlayerStats().atk * woundPct * w.stacks));
    const ticksLeft = w.ticksLeft - 1;
    const nextHp = Math.max(0, enemyRef.current.hp - dmg);
    applyEnemyHp(nextHp);
    updateEnemy({ ...enemyRef.current, barbarianWounds: ticksLeft > 0 ? { stacks: w.stacks, ticksLeft } : undefined });
    pushFloat('enemy', dmg, false);
    flash('enemy');
    if (nextHp <= 0) resolveEnemyDeath();
  }

  function barbEffMaxHp(): number { return effectiveMaxHp(chRef.current); }
  function barbPainTotal(): number { return barbPainPacketsRef.current.reduce((s, p) => s + p.amountLeft, 0); }
  function barbPainMaxAllowed(): number {
    // Additive per the "definitivo" spec: base 35% + Pele Endurecida's own
    // VIT-scaled bonus (up to +4pp) + Inquebrável's flat +5pp on top of
    // whatever that already is (up to 44% total) — never a flat swap.
    const peleBonus = barbHasSkill('barbaro:resistencia:0')
      ? capped(RESISTENCIA_PELE_ENDURECIDA_RATE, attrTotal(chRef.current, 'vit'), RESISTENCIA_PELE_ENDURECIDA_CAP)
      : 0;
    const inquebravelBonus = barbHasSkill('barbaro:resistencia:14') ? INQUEBRAVEL_PAIN_CAP_BONUS : 0;
    return barbEffMaxHp() * (PAIN_MAX_PCT + peleBonus + inquebravelBonus);
  }
  // Dor is stored as real HP amounts (not a %), each packet paid off in
  // equal installments over its own fixed tick count — capped so it can
  // never exceed barbPainMaxAllowed() (the OVERFLOW — the part that
  // wouldn't fit — is simply lost, not applied to HP instead; the redirect
  // call sites already only ever redirect damage that would otherwise have
  // hit HP, so a full Dor bar effectively caps how much of a single big hit
  // can be deferred at all, same spirit as the spec's own worked example).
  function barbAddPainPacket(rawAmount: number) {
    if (rawAmount <= 0) return;
    const room = Math.max(0, barbPainMaxAllowed() - barbPainTotal());
    const amount = Math.min(rawAmount, room);
    if (amount <= 0) return;
    const ticks = barbHasSkill('barbaro:resistencia:14') ? PAIN_TICKS_INQUEBRAVEL : PAIN_TICKS;
    barbPainPacketsRef.current = [...barbPainPacketsRef.current, createPainPacket(amount, ticks)];
    syncBarbPain();
  }
  // Called once per envTick — Dor CAN kill the player (same "morte por
  // efeito indireto" requirement as Feridas above), routed through
  // resolvePlayerDeath.
  function barbTickPain() {
    if (barbPainPacketsRef.current.length === 0) return;
    const lowHp = barbHasSkill('barbaro:resistencia:14') && chRef.current.hp / barbEffMaxHp() < PAIN_TICK_REDUCTION_LOW_HP_THRESHOLD;
    const tick = tickPainPackets(barbPainPacketsRef.current);
    const totalPay = tick.paid;
    barbPainPacketsRef.current = tick.packets;
    syncBarbPain();
    if (totalPay <= 0) return;
    // Ossos Fortes (barbaro:resistencia:5) — reduces Dor's own tick damage
    // by VIT total, unconditional once unlocked (stacks with Inquebrável's
    // separate low-HP reduction).
    const ossosBonus = barbHasSkill('barbaro:resistencia:5')
      ? capped(RESISTENCIA_OSSOS_FORTES_RATE, attrTotal(chRef.current, 'vit'), RESISTENCIA_OSSOS_FORTES_CAP)
      : 0;
    const dmg = Math.max(1, Math.round(totalPay * (1 - ossosBonus) * (lowHp ? 1 - PAIN_TICK_REDUCTION_LOW_HP_PCT : 1)));
    const nextHp = Math.max(0, chRef.current.hp - dmg);
    updateCh({ ...chRef.current, hp: nextHp });
    pushFloat('player', dmg, false);
    flash('player');
    if (barbHasSkill('barbaro:resistencia:6')) barbGainNormalFury(FURY_GAIN_PAIN_TICK);
    if (nextHp <= 0) resolvePlayerDeath();
  }

  // ── Clérigo redesign helpers (lib/clerigo.ts has the shared constants) ──
  function isClerigo(): boolean { return chRef.current.classId === 'clerigo'; }
  function clerigoHasSkill(nodeId: string): boolean { return hasSkill(chRef.current, nodeId); }
  function syncClerigoFaith() { if (!silentRef.current) setClerigoFaithState(clerigoFaithRef.current); }
  function syncClerigoGrace() { if (!silentRef.current) setClerigoGraceState(clerigoGraceRef.current.amount); }
  function syncClerigoConsecration() { if (!silentRef.current) setClerigoConsecrationState(clerigoConsecrationRoundsLeftRef.current); }
  // Same baseline used by every class's heal formula (see the shared
  // 'heal' branch) — class/level curve, deliberately not the gear-inflated
  // EffectiveMaxHp, so VIT+gear+heal% can't compound into near-immortality.
  function clerigoBaselineMaxHp(): number { return clericBaseHp(CLASSES[chRef.current.classId].baseHp, chRef.current.level); }
  function clerigoEffMaxHp(): number { return effectiveMaxHp(chRef.current); }

  function clerigoGainFaith(amount: number) {
    if (!isClerigo() || amount <= 0) return;
    clerigoFaithRef.current = Math.min(FAITH_MAX, clerigoFaithRef.current + amount);
    syncClerigoFaith();
  }
  // Heal-efficiency bonuses stacked on top of the shared BaselineMaxHp*
  // healPct*healingPower formula — Mãos Consagradas is unconditional, Sabedoria
  // Compassiva only below 40% HP, Véu da Alma only while carrying a DOT,
  // negative stat mod, or silence.
  function clerigoHealEfficiencyBonus(): number {
    if (!isClerigo()) return 0;
    let bonus = 0;
    if (clerigoHasSkill('clerigo:devocao:3')) bonus += MAOS_CONSAGRADAS_HEAL_EFFICIENCY_PCT;
    if (clerigoHasSkill('clerigo:devocao:0') && chRef.current.hp / clerigoEffMaxHp() < SABEDORIA_COMPASSIVA_HP_THRESHOLD) {
      bonus += SABEDORIA_COMPASSIVA_HEAL_EFFICIENCY_PCT;
    }
    const debuffed = playerStatusRef.current.length > 0 || hasCC(playerCCRef.current, 'silence') || playerModsRef.current.some((m) => m.pct < 0);
    if (clerigoHasSkill('clerigo:devocao:5') && debuffed) bonus += VEU_DA_ALMA_HEAL_EFFICIENCY_PCT;
    return bonus;
  }

  // ── GRAÇA ──
  function clerigoGraceCapPct(): number {
    const base = clerigoHasSkill('clerigo:devocao:14') ? GRACE_DIVINA_CAP_PCT : GRACE_BASE_CAP_PCT;
    const folego = clerigoHasSkill('clerigo:devocao:2')
      ? capped(GRACE_FOLEGO_VIT_RATE, attrTotal(chRef.current, 'vit'), GRACE_FOLEGO_VIT_CAP)
      : 0;
    return base + folego;
  }
  // Absorbs up to `amount` of incoming direct damage from Graça, returning
  // how much it actually absorbed. Graça Divina (clerigo:devocao:14) grants
  // +1 Fé the moment a Graça reserve is fully drained by damage.
  function clerigoAbsorbGrace(amount: number): number {
    if (!isClerigo() || clerigoGraceRef.current.amount <= 0 || amount <= 0) return 0;
    const absorbed = Math.min(clerigoGraceRef.current.amount, amount);
    const remaining = clerigoGraceRef.current.amount - absorbed;
    clerigoGraceRef.current = remaining > 0.01 ? { ...clerigoGraceRef.current, amount: remaining } : { amount: 0, ticksLeft: 0 };
    syncClerigoGrace();
    if (remaining <= 0.01 && clerigoHasSkill('clerigo:devocao:14')) clerigoGainFaith(1);
    return absorbed;
  }
  function clerigoTickGrace() {
    if (clerigoGraceRef.current.amount <= 0) return;
    const ticksLeft = clerigoGraceRef.current.ticksLeft - 1;
    clerigoGraceRef.current = ticksLeft > 0 ? { ...clerigoGraceRef.current, ticksLeft } : { amount: 0, ticksLeft: 0 };
    syncClerigoGrace();
  }
  // Registra uma nova barreira normal (já somada ao pool genérico
  // playerShieldRef pelo call-site) como uma "instância" própria, para que
  // Fé-por-threshold/Intercessão/Ancora Sagrada saibam quando ELA
  // especificamente se esgota — o pool genérico não distingue fontes.
  function clerigoAddBarrierPortion(amount: number, opts?: { isWallBonus?: boolean }) {
    if (!isClerigo() || amount <= 0) return;
    clerigoBarrierPortionsRef.current = [
      ...clerigoBarrierPortionsRef.current,
      { remaining: amount, absorbedTotal: 0, faithThresholdAmount: BARRIER_FAITH_THRESHOLD_PCT * clerigoEffMaxHp(), faithGranted: false, isWallBonus: opts?.isWallBonus },
    ];
  }
  // Distribui `amount` de dano já absorvido pelo pool genérico entre as
  // instâncias de barreira (mais antiga primeiro), disparando Fé-por-
  // threshold, a cura de Intercessão e a janela de Ancora Sagrada quando uma
  // instância se esgota por dano (não quando é apenas substituída).
  function clerigoAbsorbBarriers(amount: number) {
    if (!isClerigo() || amount <= 0 || clerigoBarrierPortionsRef.current.length === 0) return;
    let remaining = amount;
    const kept: BarrierPortion[] = [];
    for (const portion of clerigoBarrierPortionsRef.current) {
      if (remaining <= 0) { kept.push(portion); continue; }
      const take = Math.min(portion.remaining, remaining);
      remaining -= take;
      const absorbedTotal = portion.absorbedTotal + take;
      const nextRemaining = portion.remaining - take;
      let faithGranted = portion.faithGranted;
      if (!faithGranted && portion.faithThresholdAmount !== undefined && absorbedTotal >= portion.faithThresholdAmount) {
        clerigoGainFaith(1);
        faithGranted = true;
      }
      if (nextRemaining <= 0.01 && take > 0) {
        if (clerigoHasSkill('clerigo:retidao:8') && clerigoConsecrationRoundsLeftRef.current > 0) {
          const healAmt = clericPassiveHealAmount(clerigoBaselineMaxHp(), INTERCESSAO_HEAL_PCT, computePlayerStats().healingPowerPct);
          const effectiveHeal = Math.min(healAmt, Math.max(0, clerigoEffMaxHp() - chRef.current.hp));
          if (effectiveHeal > 0) {
            updateCh({ ...chRef.current, hp: chRef.current.hp + effectiveHeal });
            pushFloat('player', effectiveHeal, false, undefined, undefined, true);
          }
        }
        if (clerigoHasSkill('clerigo:retidao:11')) clerigoAncoraSagradaWindowRef.current = ANCORA_SAGRADA_WINDOW_TICKS;
      } else {
        kept.push({ ...portion, remaining: nextRemaining, absorbedTotal, faithGranted });
      }
    }
    clerigoBarrierPortionsRef.current = kept;
  }
  function clerigoWallBonusActive(): boolean {
    return clerigoBarrierPortionsRef.current.some((p) => p.isWallBonus && p.remaining > 0);
  }

  // ── CONSAGRAÇÃO ──
  function clerigoConsecrationActive(): boolean { return clerigoConsecrationRoundsLeftRef.current > 0; }
  function clerigoConsecrationCeiling(): number {
    return MURALHA_DIVINA_CONSECRATION_ROUNDS + (clerigoHasSkill('clerigo:retidao:14') ? SANTUARIO_VIVO_MAX_ROUNDS_BONUS : 0);
  }
  function clerigoExtendConsecration(ticks: number) {
    if (!isClerigo() || !clerigoConsecrationActive()) return;
    clerigoConsecrationRoundsLeftRef.current = Math.min(clerigoConsecrationCeiling(), clerigoConsecrationRoundsLeftRef.current + ticks);
    syncClerigoConsecration();
  }
  function clerigoTickConsecration() {
    if (clerigoConsecrationRoundsLeftRef.current <= 0) return;
    clerigoConsecrationRoundsLeftRef.current -= 1;
    syncClerigoConsecration();
  }

  // ── JULGAMENTO ──
  function clerigoEnemyJudgmentStacks(): number { return enemyRef.current.judgment?.stacks ?? 0; }
  function clerigoTickJudgment() {
    const w = enemyRef.current.judgment;
    if (!w || w.stacks <= 0) return;
    updateEnemy({ ...enemyRef.current, judgment: tickJudgmentState(w) });
  }
  // Chamado do início de resolvePlayerDeath, antes de qualquer resolução
  // definitiva — se a janela estiver aberta e ainda não tiver sido usada
  // nesta tentativa, consome-a e restaura HP em vez de finalizar a morte.
  function clerigoCheckDeathPrevention(): boolean {
    if (!isClerigo() || clerigoReviveWindowRoundsLeftRef.current <= 0 || clerigoResurrectionTriggeredRef.current) return false;
    clerigoResurrectionTriggeredRef.current = true;
    clerigoReviveWindowRoundsLeftRef.current = 0;
    const maxHp = clerigoEffMaxHp();
    const { healPct, capPct } = clerigoReviveHealRef.current;
    const raw = clericPassiveHealAmount(clerigoBaselineMaxHp(), healPct, 0);
    const healed = Math.min(maxHp, Math.round(Math.min(raw, maxHp * capPct)));
    playerStatusRef.current = [];
    syncPlayerStatuses();
    updateCh({ ...chRef.current, hp: Math.max(1, healed) });
    pushLog([{ text: 'Ressurreição Menor evita sua morte!', color: '#c9a86a' }]);
    pushFloat('player', Math.max(1, healed), false, undefined, undefined, true);
    return true;
  }

  // ── Cavaleiro redesign helpers (lib/knight.ts has the shared constants) ──
  function isKnight(): boolean { return chRef.current.classId === 'cavaleiro'; }
  function knightHasSkill(nodeId: string): boolean { return hasSkill(chRef.current, nodeId); }
  function knightEffMaxHp(): number { return effectiveMaxHp(chRef.current); }
  // Each resource is only "ativada" once the Cavaleiro has at least one
  // talent in its own specialization (per spec sections 7/9/11) — a
  // Cavaleiro with zero Bastião nodes never generates Determinação, etc.
  function knightBastiaoActive(): boolean { return isKnight() && chRef.current.unlockedSkills.some((s) => s.startsWith('cavaleiro:bastiao:')); }
  function knightComandoActive(): boolean { return isKnight() && chRef.current.unlockedSkills.some((s) => s.startsWith('cavaleiro:comando:')); }
  // Pulso Vital (cavaleiro:bastiao:1) — every barrier the Cavaleiro creates
  // (Escudo Colossal, Ordem: Resistir, Última Guarda's post-barrier,
  // Bastião Inquebrável's emergency barrier) gets multiplicatively bigger by
  // VIT, up to +4%. Never applies to Clérigo/generic barriers.
  function knightBarrierMult(): number {
    return (1 + capped(PULSO_VITAL_BARRIER_EFF_RATE, attrTotal(chRef.current, 'vit'), PULSO_VITAL_BARRIER_EFF_CAP))
      * (1 + computePlayerStats().barrierPowerPct);
  }
  function syncKnightDetermination() { if (!silentRef.current) setKnightDeterminationState(knightDeterminationRef.current); }
  function syncKnightRetaliation() { if (!silentRef.current) setKnightRetaliationState(knightRetaliationChargesRef.current); }
  function syncKnightMomentum() { if (!silentRef.current) setKnightMomentumState(knightMomentumRef.current); }
  function syncKnightOrders() { if (!silentRef.current) setKnightOrdersState(knightOrdersRef.current); }
  function syncKnightCommandSupreme() { if (!silentRef.current) setKnightCommandSupremeState(knightCommandSupremeRef.current); }

  // ── DETERMINAÇÃO ──
  function knightGainDetermination(amount: number) {
    if (!knightBastiaoActive() || amount <= 0) return;
    knightDeterminationRef.current = addDetermination(knightDeterminationRef.current, amount);
    syncKnightDetermination();
  }
  // ── RETALIAÇÃO (cavaleiro:bastiao:6 Reação Defensiva) ──
  function knightOnBlockSuccess() {
    if (!isKnight() || !knightHasSkill('cavaleiro:bastiao:6')) return;
    knightBlockCountRef.current += 1;
    if (knightBlockCountRef.current >= RETALIATION_BLOCKS_PER_CHARGE) {
      knightBlockCountRef.current = 0;
      knightRetaliationChargesRef.current = Math.min(RETALIATION_MAX_CHARGES, knightRetaliationChargesRef.current + 1);
      syncKnightRetaliation();
    }
  }

  // ── JURAMENTO DE RESISTÊNCIA (cavaleiro:bastiao:8) / DISCIPLINA INABALÁVEL (cavaleiro:comando:8) ──
  // Called once for every negative effect that actually lands on the
  // Cavaleiro (never for one that was resisted) — DOT, stat debuff,
  // silence, stun, sleep.
  function knightOnNegativeEffectApplied() {
    if (!isKnight()) return;
    if (knightHasSkill('cavaleiro:bastiao:8')) {
      knightNegativeCounterBastiaoRef.current += 1;
      if (knightNegativeCounterBastiaoRef.current >= JURAMENTO_RESISTENCIA_THRESHOLD) {
        knightNegativeCounterBastiaoRef.current = 0;
        knightJuramentoReductionReadyRef.current = true;
      }
    }
    if (knightHasSkill('cavaleiro:comando:8')) {
      knightNegativeCounterComandoRef.current += 1;
      if (knightNegativeCounterComandoRef.current >= DISCIPLINA_INABALAVEL_THRESHOLD && knightNegativeCounterComandoTickRef.current === 0) {
        knightNegativeCounterComandoRef.current = 0;
        knightNegativeCounterComandoTickRef.current = 1;
        knightGainOrders(1);
      }
    }
  }
  // Shaves 1 off an about-to-land negative effect's own duration if
  // Juramento de Resistência's counter is ready — consumed immediately,
  // never stacks. Called BEFORE knightOnNegativeEffectApplied() registers
  // this same effect toward the NEXT reduction.
  function knightJuramentoConsumeReduction(rounds: number): number {
    if (!isKnight() || !knightJuramentoReductionReadyRef.current) return rounds;
    knightJuramentoReductionReadyRef.current = false;
    return Math.max(0, rounds - JURAMENTO_RESISTENCIA_DURATION_CUT);
  }

  // ── MURALHA DE FERRO / FORTALEZA VIVA (posturas mutuamente exclusivas) ──
  function knightIronWallActive(): boolean { return knightIronWallRoundsLeftRef.current > 0; }
  function knightFortressActive(): boolean { return knightFortressRoundsLeftRef.current > 0; }
  function knightIronWallDmgReductionPct(): number {
    return IRON_WALL_DMG_RED_BASE + capped(0.001, attrTotal(chRef.current, 'vit'), IRON_WALL_DMG_RED_CAP);
  }
  function knightFortressDmgReductionPct(): number {
    return LIVING_FORTRESS_DMG_RED_BASE + capped(0.001, attrTotal(chRef.current, 'vit'), LIVING_FORTRESS_DMG_RED_CAP);
  }

  // ── ESCUDO DISCIPLINADO (cavaleiro:bastiao:5) ──
  function knightEscudoDisciplinadoActive(): boolean { return knightNextHitReductionWindowRef.current > 0; }

  // ── ÚLTIMA GUARDA (cavaleiro:bastiao:10) ──
  function knightLastGuardActive(): boolean { return knightLastGuardRoundsLeftRef.current > 0; }
  // Chamado quando o pool genérico de escudo absorve dano — reduz também a
  // porção específica do Escudo Colossal, e detecta sua destruição para o
  // bônus de Retaliação.
  function knightAbsorbColossalShield(amount: number) {
    const portion = knightColossalShieldRef.current;
    if (!portion || amount <= 0) return;
    const remaining = portion.remaining - amount;
    if (remaining <= 0.01) {
      knightColossalShieldRef.current = null;
      if (knightHasSkill('cavaleiro:bastiao:6')) {
        knightRetaliationChargesRef.current = Math.min(RETALIATION_MAX_CHARGES, knightRetaliationChargesRef.current + 1);
        syncKnightRetaliation();
      }
    } else {
      knightColossalShieldRef.current = { ...portion, remaining };
    }
  }
  // Nega o primeiro stun/sleep recebido enquanto a barreira existir,
  // consumindo 25% do que resta dela. Retorna se negou.
  function knightColossalShieldNegateCC(): boolean {
    const portion = knightColossalShieldRef.current;
    if (!portion || portion.ccNegated) return false;
    const consumed = portion.remaining * COLOSSAL_SHIELD_CC_NEGATE_CONSUME_PCT;
    const remaining = portion.remaining - consumed;
    if (remaining <= 0.01) {
      knightColossalShieldRef.current = null;
    } else {
      knightColossalShieldRef.current = { remaining, ccNegated: true };
    }
    playerShieldRef.current = Math.max(0, playerShieldRef.current - consumed);
    syncShield();
    return true;
  }

  // ── CONTRA-ATAQUE ABSOLUTO (cavaleiro:bastiao:12) ──
  function knightCounterStanceActive(): boolean { return knightCounterStanceRoundsLeftRef.current > 0; }
  function knightCounterStanceCap(): number {
    return COUNTER_STANCE_CAP_BASE + capped(COUNTER_STANCE_CAP_PER_VIT, attrTotal(chRef.current, 'vit'), COUNTER_STANCE_CAP_CAP);
  }
  function knightStoreCounterDamage(amount: number) {
    if (!knightCounterStanceActive() || amount <= 0) return;
    const cap = knightCounterStanceCap() * knightEffMaxHp();
    knightCounterStoredDmgRef.current = Math.min(cap, knightCounterStoredDmgRef.current + amount * COUNTER_STANCE_STORE_PCT);
  }

  // ── MOMENTUM (Investida) ──
  function knightMomentumMax(): number {
    let max = MOMENTUM_MAX_BASE;
    if (knightHasSkill('cavaleiro:investida:7')) max += MOMENTUM_MAX_VETERANO_BONUS;
    max += knightMomentumMaxBonusRef.current;
    return max;
  }
  function knightLoseMomentum(amount: number) {
    if (!isKnight()) return;
    knightMomentumRef.current = Math.max(0, knightMomentumRef.current - amount);
    syncKnightMomentum();
  }
  // Golpe Pesado (perda de Momentum) — base 15% da vida máxima efetiva,
  // elevado por Sangue de Combate (cavaleiro:investida:2) até 18%.
  function knightMomentumLossThresholdPct(): number {
    return MOMENTUM_LOSS_HEAVY_HIT_PCT_BASE + (knightHasSkill('cavaleiro:investida:2')
      ? capped(SANGUE_DE_COMBATE_THRESHOLD_RATE, attrTotal(chRef.current, 'vit'), SANGUE_DE_COMBATE_THRESHOLD_CAP) : 0);
  }
  // Instinto de Sobrevivência (cavaleiro:investida:11) reduz a perda (mínimo 8).
  function knightMomentumLossAmount(): number {
    const reduction = knightHasSkill('cavaleiro:investida:11')
      ? Math.min(INSTINTO_SOBREVIVENCIA_LOSS_REDUCTION_CAP, Math.floor(attrTotal(chRef.current, 'vit') / INSTINTO_SOBREVIVENCIA_VIT_DIVISOR))
      : 0;
    return Math.max(MOMENTUM_LOSS_MIN, MOMENTUM_LOSS_AMOUNT_BASE - reduction);
  }
  function knightMomentumBonusSpeedPct(): number {
    const perTier = knightHasSkill('cavaleiro:investida:6') ? MOMENTUM_BONUS_SPEED_PER_20_UPGRADED : MOMENTUM_BONUS_SPEED_PER_20_BASE;
    return Math.floor(knightMomentumRef.current / 20) * perTier;
  }

  // ── ORDENS (Comando) ──
  function knightGainOrders(amount: number) {
    if (!knightComandoActive() || amount <= 0) return;
    knightOrdersRef.current = Math.min(ORDERS_MAX, knightOrdersRef.current + amount);
    syncKnightOrders();
    knightMaybeEnterCommandSupreme();
  }
  // Grande Comandante (cavaleiro:comando:14) — 3 Ordens entra automaticamente
  // em Comando Supremo.
  function knightMaybeEnterCommandSupreme() {
    if (!isKnight() || !knightHasSkill('cavaleiro:comando:14') || knightCommandSupremeRef.current) return;
    if (knightOrdersRef.current >= ORDERS_MAX) {
      knightCommandSupremeRef.current = true;
      syncKnightCommandSupreme();
    }
  }

  // ── Caçador (lib/hunter.ts) ──
  function isHunter(): boolean { return chRef.current.classId === 'cacador'; }
  function hunterHasSkill(nodeId: string): boolean { return hasSkill(chRef.current, nodeId); }
  // Each resource is only "ativada" once the Caçador has at least one talent
  // in its own specialization (per spec sections 6/11/14), mirroring the
  // same per-specialization gate used by Cavaleiro's Determinação/Momentum/
  // Ordens.
  function hunterHasArmadilhas(): boolean { return isHunter() && chRef.current.unlockedSkills.some((s) => s.startsWith('cacador:armadilhas:')); }
  function hunterHasRastreio(): boolean { return isHunter() && chRef.current.unlockedSkills.some((s) => s.startsWith('cacador:rastreio:')); }
  function hunterHasPrecisao(): boolean { return isHunter() && chRef.current.unlockedSkills.some((s) => s.startsWith('cacador:precisao-caca:')); }
  function hunterTrail(): number { return enemyRef.current.hunterTrail ?? 0; }
  function hunterMarkedPrey(): boolean { return hunterTrail() >= MARKED_PREY_THRESHOLD; }
  function hunterBreachStacks(): number { return enemyRef.current.hunterBreaches?.stacks ?? 0; }
  function hunterMaxTraps(): number { return hunterHasSkill('cacador:armadilhas:14') ? TRAP_MAX_ARMED_MESTRE_ARMADILHEIRO : TRAP_MAX_ARMED_BASE; }
  function syncHunterTraps() { if (!silentRef.current) setHunterTrapsState([...hunterTrapsRef.current]); }

  // ── RASTRO ──
  function hunterGainTrail(amount: number) {
    if (!hunterHasRastreio() || amount <= 0) return;
    const next = Math.min(TRAIL_MAX, hunterTrail() + amount);
    if (next !== hunterTrail()) updateEnemy({ ...enemyRef.current, hunterTrail: next });
  }
  // The universal "+1 Rastro per real enemy action" gain (see hunterOnEnemyRealAction
  // call-sites in enemyAct) — includes Memória da Trilha's one-time +1 bonus
  // on the very first real action against a new enemy.
  function hunterGainTrailOnEnemyAction() {
    if (!hunterHasRastreio()) return;
    let amount = TRAIL_GAIN_PER_ACTION;
    if (hunterHasSkill('cacador:rastreio:2') && !hunterMemoriaTrilhaGrantedRef.current) {
      amount += MEMORIA_DA_TRILHA_FIRST_ACTION_BONUS;
      hunterMemoriaTrilhaGrantedRef.current = true;
    }
    hunterGainTrail(amount);
  }

  // ── BRECHAS ──
  // Applying a new Brecha stack renews the FULL duration for every stack
  // already present — same shape as Feridas/Julgamento.
  function hunterGainBreach(amount: number) {
    if (!hunterHasPrecisao() || amount <= 0) return;
    const next = applyBreach(enemyRef.current.hunterBreaches, amount);
    updateEnemy({ ...enemyRef.current, hunterBreaches: next });
  }
  function hunterTickBreaches() {
    const b = enemyRef.current.hunterBreaches;
    if (!b) return;
    updateEnemy({ ...enemyRef.current, hunterBreaches: tickBreach(b) });
  }

  // ── ARMADILHAS (traps) ──
  function hunterArmTrap(ab: AbilityDef) {
    if (!hunterHasArmadilhas()) return;
    const eff = ab.effect;
    if (hunterTrapsRef.current.length >= hunterMaxTraps()) return; // guarded by cooldown/abilityAlreadyActive in practice
    const trap: CombatTrap = {
      sourceAbilityId: ab.id, name: ab.name,
      directDmgMultBase: eff.trapDirectDmgMultBase ?? 1,
      directDmgMultMarked: eff.trapDirectDmgMultMarked,
      poisonRounds: eff.trapPoisonRounds,
      poisonDmgMultPerTick: eff.trapPoisonDmgMultPerTick,
      debuffStat: eff.trapDebuffStat,
      debuffPct: eff.trapDebuffPct,
      debuffPctMarked: eff.trapDebuffPctMarked,
      debuffRounds: eff.trapDebuffRounds,
      trailGainBase: eff.trapTrailGainBase,
      trailGainMarked: eff.trapTrailGainMarked,
      primed: false, nextTrapBonus: false,
    };
    hunterTrapsRef.current = [...hunterTrapsRef.current, trap];
    syncHunterTraps();
    // Mão do Armeiro (cacador:armadilhas:3) — a fresh trap re-arms the bonus.
    if (hunterHasSkill('cacador:armadilhas:3')) hunterNextShotBonusAvailableRef.current = true;
  }
  function hunterAbilityIsTrap(ab: AbilityDef): boolean { return ab.effect.kind === 'armTrap'; }
  // Preparação em Cadeia (cacador:armadilhas:6) — reduces the highest-CD
  // OTHER trap-tagged ability by 1 envTick, at most once per enemy action.
  function hunterChainCooldownReduction(excludeAbilityId: string) {
    if (!hunterHasSkill('cacador:armadilhas:6')) return;
    let bestId: string | null = null, bestCd = 0;
    for (const ab of equippedAbilities()) {
      if (!hunterAbilityIsTrap(ab) || ab.id === excludeAbilityId) continue;
      const cd = cooldownsRef.current[ab.id] ?? 0;
      if (cd > bestCd) { bestCd = cd; bestId = ab.id; }
    }
    if (bestId) cooldownsRef.current[bestId] = Math.max(0, bestCd - 1);
  }
  // Resolves the oldest ARMED trap once the enemy completes a real action
  // (see enemyAct) — the sole place trap direct damage/Poison/debuffs/Rastro
  // riders are ever applied, all read at THIS trigger moment (never at arm
  // time), per the redesign spec's own worked examples.
  function hunterTriggerOldestTrap() {
    if (!isHunter() || hunterTrapsRef.current.length === 0) return;
    const trap = hunterTrapsRef.current[0];
    const rest = hunterTrapsRef.current.slice(1);
    // Mestre Armadilheiro (cacador:armadilhas:14) — the next trap in queue
    // gets a one-shot +15% direct dmg bonus once this one fires.
    hunterTrapsRef.current = hunterHasSkill('cacador:armadilhas:14') && rest.length > 0
      ? rest.map((t, i) => (i === 0 ? { ...t, nextTrapBonus: true } : t))
      : rest;
    syncHunterTraps();

    const marked = hunterMarkedPrey();
    const stats = computePlayerStats();
    let dmgMult = marked && trap.directDmgMultMarked !== undefined ? trap.directDmgMultMarked : trap.directDmgMultBase;
    if (trap.primed) dmgMult *= 1 + PRIMED_TRAP_BONUS_PCT;
    if (trap.nextTrapBonus) dmgMult *= 1 + MESTRE_ARMADILHEIRO_NEXT_TRAP_BONUS_PCT;
    let extraPct = 0;
    if (hunterHasSkill('cacador:armadilhas:0')) extraPct += capped(ENGENHARIA_PRECISA_TRAP_DMG_RATE, attrTotal(chRef.current, 'dex'), ENGENHARIA_PRECISA_TRAP_DMG_CAP);
    if (hunterHasSkill('cacador:armadilhas:7')) extraPct += capped(MECANICA_REFINADA_TRAP_DMG_RATE, attrTotal(chRef.current, 'dex'), MECANICA_REFINADA_TRAP_DMG_CAP);
    if (marked && hunterHasSkill('cacador:rastreio:6')) extraPct += PRESA_MARCADA_TRAP_DMG_BONUS_PCT;
    dmgMult *= 1 + extraPct;

    // Trap direct damage: no accuracy roll, no crit, no lifesteal, no
    // "on direct hit" triggers — only normal DEF mitigation.
    const dmg = Math.max(1, Math.round(mitigatedBase(Math.max(1, Math.round(stats.atk * dmgMult)), computeEnemyDef())));
    const newHp = Math.max(0, enemyRef.current.hp - dmg);
    applyEnemyHp(newHp);
    pushFloat('enemy', dmg, false);
    pushLog(`${trap.name} ativa!`);
    hunterTrapsTriggeredThisEnemyRef.current += 1;
    hunterRecentTrapTriggerTicksRef.current = RECENT_TRAP_TRIGGER_WINDOW_TICKS;
    hunterChainCooldownReduction(trap.sourceAbilityId);
    if (newHp <= 0) { resolveEnemyDeath(); return; }

    // Armadilheiro Adaptável (cacador:armadilhas:8).
    if (hunterHasSkill('cacador:armadilhas:8')) {
      const accPct = marked ? DESORIENTADO_ACCURACY_PCT_MARKED : DESORIENTADO_ACCURACY_PCT;
      enemyModsRef.current = enemyModsRef.current.filter((m) => m.sourceAbilityId !== 'cacador:desoriented');
      enemyModsRef.current.push({ stat: 'accuracy', pct: accPct, roundsLeft: DESORIENTADO_ROUNDS, sourceAbilityId: 'cacador:desoriented' });
      syncEnemyMods();
      if (!hunterFirstTrapTriggeredThisEnemyRef.current) {
        hunterFirstTrapTriggeredThisEnemyRef.current = true;
        hunterGainBreach(1);
      } else if (marked) {
        hunterGainBreach(1);
      }
    }
    // Poison rider (Armadilha de Veneno) — locked in at trigger time.
    if (trap.poisonRounds && trap.poisonDmgMultPerTick) {
      enemyStatusRef.current.push({ kind: 'poison', roundsLeft: trap.poisonRounds, dmgPerTick: Math.max(1, Math.round(stats.atk * trap.poisonDmgMultPerTick * (1 + (hunterHasSkill('cacador:armadilhas:1') ? capped(CONHECIMENTO_VENENOS_POISON_RATE, attrTotal(chRef.current, 'wis'), CONHECIMENTO_VENENOS_POISON_CAP) : 0)))) });
      syncEnemyStatuses();
    }
    // Stat debuff rider (Armadilha Mortal's -ATK / Armadilha de Ferro's -DEF).
    if (trap.debuffStat && trap.debuffPct !== undefined) {
      const pct = marked && trap.debuffPctMarked !== undefined ? trap.debuffPctMarked : trap.debuffPct;
      enemyModsRef.current.push({ stat: trap.debuffStat, pct, roundsLeft: trap.debuffRounds ?? 2, sourceAbilityId: trap.sourceAbilityId });
      syncEnemyMods();
    }
    // Rastro rider (Armadilha de Ferro).
    if (trap.trailGainBase !== undefined) {
      hunterGainTrail(marked && trap.trailGainMarked !== undefined ? trap.trailGainMarked : trap.trailGainBase);
    }
  }
  // Called once per completed real enemy action (hit OR miss, never on a
  // stun/sleep-negated action) — advances every Caçador mechanic that reacts
  // to "the presa acted", in the exact order the spec's own death-ordering
  // rule requires (this only ever runs AFTER the player-death check).
  function hunterOnEnemyRealAction() {
    if (!isHunter()) return;
    hunterGainTrailOnEnemyAction();
    hunterTriggerOldestTrap();
  }
  // Enemy attack MISSED the player — Instinto de Fuga / Passo Etéreo / Manto
  // das Sombras all react to this specific sub-case (never to a stun/sleep
  // skip, which never reaches the accuracy roll at all).
  function hunterOnEnemyMiss() {
    if (!isHunter()) return;
    if (hunterHasSkill('cacador:rastreio:8')) {
      hunterInstintoFugaWindowTicksRef.current = INSTINTO_FUGA_WINDOW_TICKS;
      hunterGainBreach(1);
    }
    if (hunterPassoEthereoMissPendingRef.current) {
      hunterPassoEthereoMissPendingRef.current = false;
      hunterGainTrail(PASSO_ETEREO_TRAIL_GAIN_ON_MISS);
      hunterGainBreach(1);
    }
    if (playerModsRef.current.some((m) => m.sourceAbilityId === 'cacador:rastreio:12')) {
      hunterGainTrail(1);
      if (hunterMantoSombrasBreachesGrantedRef.current < MANTO_SOMBRAS_MAX_BREACHES_PER_CAST) {
        hunterGainBreach(1);
        hunterMantoSombrasBreachesGrantedRef.current += 1;
      }
    }
  }

  function equippedAbilities(): AbilityDef[] {
    const c = chRef.current;
    return getEquippedAbilities(c.classId, c.unlockedSkills, c.equippedAbilities);
  }

  // Combines class/gear/skill stats with every temporary modifier currently
  // affecting the player: legacy def/block buffs, the new generic stat mods
  // (atk/def/crit/accuracy/evasion/dmgTakenPct/defPenPct), from either a
  // self-cast buff or a debuff an enemy just landed on the player.
  function computePlayerStats() {
    const base = computeCombatStats(chRef.current);
    let defMult = 1, blockAdd = 0;
    for (const b of playerBuffsRef.current) {
      if (b.kind === 'def') defMult *= 1 + b.pct;
      else blockAdd += b.pct;
    }
    defMult *= 1 + getModTotal(playerModsRef.current, 'def');
    const atkPct = getModTotal(playerModsRef.current, 'atk');
    const critAdd = getModTotal(playerModsRef.current, 'critChance');
    const critDmgAdd = getModTotal(playerModsRef.current, 'critDmgMult');

    // Bárbaro "definitivo" attribute interactions that don't depend on the
    // current enemy's Ferida state (those live in playerAct, where the
    // enemy context is available) — all VIT/SOR-total-scaled, each with its
    // own mandatory cap per lib/barbarian.ts.
    const ch = chRef.current;
    const barbActive = isBarbaro();
    const clerigoActive = isClerigo();
    const bardStatsActive = isBard();
    let bardTenacityBonus = 0, bardCritDmgBonus = 0, bardDmgTakenBonus = 0, bardSpeedBonus = 0;
    if (barbActive) {
      // Constituição Selvagem (barbaro:resistencia:3) — DEF% bonus while Dor
      // accumulated is >= 10% of effective max HP.
      if (barbHasSkill('barbaro:resistencia:3') && barbPainTotal() / barbEffMaxHp() >= RESISTENCIA_CONSTITUICAO_PAIN_THRESHOLD_PCT) {
        defMult *= 1 + capped(RESISTENCIA_CONSTITUICAO_RATE, attrTotal(ch, 'vit'), RESISTENCIA_CONSTITUICAO_CAP);
      }
    }
    let tenacityBonus = 0;
    let critDmgBonus = 0;
    if (barbActive) {
      // Espírito Indomável (barbaro:resistencia:1) — permanent Tenacidade.
      if (barbHasSkill('barbaro:resistencia:1')) {
        tenacityBonus += capped(RESISTENCIA_ESPIRITO_INDOMAVEL_RATE, attrTotal(ch, 'vit'), RESISTENCIA_ESPIRITO_INDOMAVEL_CAP);
      }
      if (barbFrenzyRef.current) {
        // Corpo em Frenesi (barbaro:furia:5) — Tenacidade only during Frenesi.
        if (barbHasSkill('barbaro:furia:5')) {
          tenacityBonus += capped(FURIA_CORPO_EM_FRENESI_RATE, attrTotal(ch, 'vit'), FURIA_CORPO_EM_FRENESI_CAP);
        }
        // Golpe Devastador (barbaro:furia:7) — critDmg only during Frenesi.
        if (barbHasSkill('barbaro:furia:7')) {
          critDmgBonus += capped(FURIA_GOLPE_DEVASTADOR_RATE, attrTotal(ch, 'luk'), FURIA_GOLPE_DEVASTADOR_CAP);
        }
      }
    }

    // Clérigo conditional bonuses — Couraça Espiritual/Solo Consagrado only
    // while Consagração is active (Solo Consagrado also adds Tenacidade),
    // Guarda da Alma only while a normal barrier (shield pool or its own
    // barrier-portion ledger) is up. Each node's own UNCONDITIONAL bonus
    // (its mdefPct/defPct effect field) is already folded into `base` by
    // computeCombatStats — only the extra conditional slice lives here.
    let clerigoDefBonusMult = 1, clerigoMdefBonusMult = 1;
    if (clerigoActive) {
      if (clerigoConsecrationActive()) {
        if (clerigoHasSkill('clerigo:retidao:0')) clerigoMdefBonusMult *= 1 + COURACA_ESPIRITUAL_CONSECRATION_MDEF_PCT;
        if (clerigoHasSkill('clerigo:retidao:6')) {
          clerigoMdefBonusMult *= 1 + SOLO_CONSAGRADO_MDEF_BONUS;
          tenacityBonus += SOLO_CONSAGRADO_TENACITY_BONUS;
        }
      }
      if (clerigoHasSkill('clerigo:retidao:5') && (playerShieldRef.current > 0 || clerigoBarrierPortionsRef.current.length > 0)) {
        clerigoDefBonusMult *= 1 + GUARDA_DA_ALMA_SHIELD_DEF_PCT;
      }
    }

    if (bardStatsActive) {
      // The Bardo's conditional attributes are evaluated from the live
      // performance state, never baked into the persisted character sheet.
      if (bardHasSkill('bardo:melodia-sombria:2') && bardStateRef.current.echo > 0) defMult *= 1.02;
      if (bardHasSkill('bardo:inspiracao:11') && bardStateRef.current.ovation > 0) defMult *= 1.03;
      if (bardHasSkill('bardo:melodia-sombria:5')) bardTenacityBonus += 0.02 + (bardStateRef.current.echo >= 2 ? 0.02 : 0);
      if (bardStateRef.current.echoTenacity) bardTenacityBonus += 0.04;
      if (bardStateRef.current.lyricTenacity) bardTenacityBonus += 0.02;
      if (bardStateRef.current.accentSpeed) bardSpeedBonus += 0.02;
      if (bardHasSkill('bardo:melodia-sombria:7')) bardCritDmgBonus += 0.03 + (bardStateRef.current.echo >= 2 ? 0.03 : 0);
      if (bardHasSkill('bardo:cancao-guerra:2') && bardStateRef.current.fortissimo) bardCritDmgBonus += 0.03;
      if (bardHasSkill('bardo:cancao-guerra:11') && bardStateRef.current.fortissimo) bardDmgTakenBonus -= 0.03;
      if (bardStateRef.current.harmonyProtection) bardDmgTakenBonus -= 0.03;
    }

    // Cavaleiro conditional bonuses that don't need the live enemy hit
    // context — the per-hit ones (Armadura de Aço/Peso da Armadura's extra
    // mitigation against a big single hit, Núcleo de Aço's low-HP direct-dmg
    // reduction) live in enemyAct instead, mirroring Bárbaro's Corpo Duro.
    let knightDefBonusMult = 1, knightMdefBonusMult = 1;
    const knightActiveStats = isKnight();
    if (knightActiveStats) {
      // Disciplina Militar (cavaleiro:comando:2) — unconditional Tenacidade
      // by VIT total.
      if (knightHasSkill('cavaleiro:comando:2')) {
        tenacityBonus += capped(DISCIPLINA_MILITAR_TENACITY_RATE, attrTotal(ch, 'vit'), DISCIPLINA_MILITAR_TENACITY_CAP);
      }
      // Cavaleiro Imparável (cavaleiro:investida:14) — while Momentum sits at
      // >=90% of its CURRENT max, extra Tenacidade (the dmg-bonus half of
      // this same passive is applied live in playerAct's damage pipeline).
      if (knightHasSkill('cavaleiro:investida:14') && knightMomentumRef.current >= IMPARAVEL_HIGH_MOMENTUM_PCT_THRESHOLD * knightMomentumMax()) {
        tenacityBonus += IMPARAVEL_HIGH_MOMENTUM_TENACITY_BONUS;
      }
      // Formação (cavaleiro:comando:5) — extra DEF while >=1 Comando buff is
      // currently active on the player (never stacks with more than one).
      if (knightHasSkill('cavaleiro:comando:5') && playerModsRef.current.some((m) => m.sourceAbilityId?.startsWith('cavaleiro:comando:'))) {
        knightDefBonusMult *= 1 + capped(FORMACAO_DEF_RATE, attrTotal(ch, 'vit'), FORMACAO_DEF_CAP);
      }
      // Corpo Blindado (cavaleiro:bastiao:8) — a slice of DEF converts into
      // MDEF, capped as a fraction of MDEF BEFORE the conversion (so it can
      // never spiral by feeding its own cap).
      if (knightHasSkill('cavaleiro:bastiao:8')) {
        const preConversionMdef = base.mdef * defMult;
        const converted = Math.min(preConversionMdef * CORPO_BLINDADO_CAP_PCT_OF_MDEF, base.def * defMult * CORPO_BLINDADO_DEF_TO_MDEF_PCT);
        if (preConversionMdef > 0) knightMdefBonusMult *= 1 + converted / preConversionMdef;
      }
    }

    // Caçador conditional bonuses — each node's own UNCONDITIONAL slice
    // (accuracyPct/evasionPct/critPct/critDmgPct/dmgPct/maxHpFlat) is already
    // folded into `base` by computeCombatStats; only the extra conditional
    // interaction lives here. Reads enemyRef.current directly (Rastro/
    // Brechas/HP all live on the current enemy instance), same closure
    // access every other class's conditional block above already relies on.
    let hunterAccuracyBonus = 0, hunterEvasionBonus = 0, hunterCritBonus = 0, hunterCritDmgBonus = 0;
    let hunterSpeedBonus = 0, hunterDmgTakenBonus = 0;
    const hunterActiveStats = isHunter();
    if (hunterActiveStats) {
      const trapArmed = hunterTrapsRef.current.length > 0;
      const marked = hunterMarkedPrey();
      const trail5 = hunterTrail() === TRAIL_MAX;
      const breaches = hunterBreachStacks();
      // Passos do Armadilheiro (armadilhas:2) — unconditional base + AGI
      // while a trap is armed.
      hunterSpeedBonus += PASSOS_ARMADILHEIRO_SPEED_UNCONDITIONAL_PCT;
      if (trapArmed && hunterHasSkill('cacador:armadilhas:2')) {
        hunterSpeedBonus += capped(PASSOS_ARMADILHEIRO_SPEED_RATE, attrTotal(ch, 'agi'), PASSOS_ARMADILHEIRO_SPEED_CAP);
      }
      // Sobrevivência de Campo (armadilhas:5) — VIT-scaled direct-dmg
      // reduction while a trap is armed.
      if (trapArmed && hunterHasSkill('cacador:armadilhas:5')) {
        hunterDmgTakenBonus -= capped(SOBREVIVENCIA_CAMPO_DMG_REDUCTION_RATE, attrTotal(ch, 'vit'), SOBREVIVENCIA_CAMPO_DMG_REDUCTION_CAP);
      }
      // Paciência da Caça (armadilhas:11) — AGI-scaled evasion while a trap
      // is armed (its own unconditional evasionPct is already in `base`).
      if (trapArmed && hunterHasSkill('cacador:armadilhas:11')) {
        hunterEvasionBonus += capped(PACIENCIA_DA_CACA_EVASION_RATE, attrTotal(ch, 'agi'), PACIENCIA_DA_CACA_EVASION_CAP);
      }
      // Olhos do Rastreador (rastreio:0) / Mira de Perseguição (rastreio:5) —
      // DES-scaled accuracy vs Presa Marcada.
      if (marked && hunterHasSkill('cacador:rastreio:0')) {
        hunterAccuracyBonus += capped(OLHOS_RASTREADOR_ACCURACY_RATE, attrTotal(ch, 'dex'), OLHOS_RASTREADOR_ACCURACY_CAP);
      }
      if (marked && hunterHasSkill('cacador:rastreio:5')) {
        hunterAccuracyBonus += capped(MIRA_PERSEGUICAO_ACCURACY_RATE, attrTotal(ch, 'dex'), MIRA_PERSEGUICAO_ACCURACY_CAP);
      }
      // Passos Silenciosos (rastreio:1) — AGI-scaled evasion vs Presa Marcada.
      if (marked && hunterHasSkill('cacador:rastreio:1')) {
        hunterEvasionBonus += capped(PASSOS_SILENCIOSOS_EVASION_RATE, attrTotal(ch, 'agi'), PASSOS_SILENCIOSOS_EVASION_CAP);
      }
      // Leitura de Movimento (rastreio:3) — AGI-scaled dmg reduction at
      // Rastro máximo (its own unconditional evasionPct is already baked).
      if (trail5 && hunterHasSkill('cacador:rastreio:3')) {
        hunterDmgTakenBonus -= capped(LEITURA_MOVIMENTO_DMG_REDUCTION_RATE, attrTotal(ch, 'agi'), LEITURA_MOVIMENTO_DMG_REDUCTION_CAP);
      }
      // Presa Marcada (rastreio:6) — its own +4pp precisão half; the +4%
      // dmg half is applied live in playerAct's damage pipeline instead
      // (a direct-dmg multiplier, not a stat).
      if (marked && hunterHasSkill('cacador:rastreio:6')) {
        hunterAccuracyBonus += PRESA_MARCADA_ACCURACY_BONUS_PCT;
      }
      // Fôlego da Perseguição (rastreio:7) — base + AGI speed at Rastro máx.
      if (trail5 && hunterHasSkill('cacador:rastreio:7')) {
        hunterSpeedBonus += FOLEGO_PERSEGUICAO_SPEED_BASE + capped(FOLEGO_PERSEGUICAO_SPEED_RATE, attrTotal(ch, 'agi'), FOLEGO_PERSEGUICAO_SPEED_CAP);
      }
      // Leitura Completa (rastreio:11) — SOR-scaled crit at Rastro máximo.
      if (trail5 && hunterHasSkill('cacador:rastreio:11')) {
        hunterCritBonus += capped(LEITURA_COMPLETA_CRIT_RATE, attrTotal(ch, 'luk'), LEITURA_COMPLETA_CRIT_CAP);
      }
      // Mira Cirúrgica (precisao-caca:0) — DES-scaled accuracy vs a target
      // carrying at least 1 Brecha.
      if (breaches >= 1 && hunterHasSkill('cacador:precisao-caca:0')) {
        hunterAccuracyBonus += capped(MIRA_CIRURGICA_ACCURACY_RATE, attrTotal(ch, 'dex'), MIRA_CIRURGICA_ACCURACY_CAP);
      }
      // Pulso Frio (precisao-caca:2) — SOR-scaled crit vs a target with a Brecha.
      if (breaches >= 1 && hunterHasSkill('cacador:precisao-caca:2')) {
        hunterCritBonus += capped(PULSO_FRIO_CRIT_RATE, attrTotal(ch, 'luk'), PULSO_FRIO_CRIT_CAP);
      }
      // Leitura Balística (precisao-caca:3) — flat critDmg vs exactly 3 Brechas.
      if (breaches === BREACH_MAX && hunterHasSkill('cacador:precisao-caca:3')) {
        hunterCritDmgBonus += LEITURA_BALISTICA_CRIT_DMG_BONUS_AT_3_BREACHES;
      }
      // Munição Selecionada (precisao-caca:5) — SOR-scaled critDmg vs marked.
      if (marked && hunterHasSkill('cacador:precisao-caca:5')) {
        hunterCritDmgBonus += capped(MUNICAO_SELECIONADA_CRIT_DMG_RATE, attrTotal(ch, 'luk'), MUNICAO_SELECIONADA_CRIT_DMG_CAP);
      }
      // Ritmo de Abate (precisao-caca:7) — base + AGI speed while the enemy
      // carries at least 1 Brecha.
      if (hunterHasSkill('cacador:precisao-caca:7')) {
        hunterSpeedBonus += RITMO_ABATE_SPEED_UNCONDITIONAL_PCT;
        if (breaches >= 1) hunterSpeedBonus += capped(RITMO_ABATE_SPEED_RATE, attrTotal(ch, 'agi'), RITMO_ABATE_SPEED_CAP);
      }
      // Ponto Fraco (precisao-caca:8) — per active Brecha stack, up to 3.
      if (hunterHasSkill('cacador:precisao-caca:8') && breaches > 0) {
        hunterAccuracyBonus += breaches * PONTO_FRACO_ACCURACY_PER_BREACH;
        hunterCritDmgBonus += breaches * PONTO_FRACO_CRIT_DMG_PER_BREACH;
      }
      // Foco do Carrasco (precisao-caca:11) — SOR-scaled crit vs a weak,
      // opened-up target.
      if (breaches >= 1 && enemyRef.current.hp / enemyRef.current.maxHp < FOCO_CARRASCO_HP_THRESHOLD && hunterHasSkill('cacador:precisao-caca:11')) {
        hunterCritBonus += capped(FOCO_CARRASCO_CRIT_RATE, attrTotal(ch, 'luk'), FOCO_CARRASCO_CRIT_CAP);
      }
    }

    let warriorMdefMult = 1, warriorCritBonus = 0, warriorSpeedBonus = 0, warriorDmgTakenBonus = 0;
    if (isWarrior()) {
      const band = postureBand(warriorEnemyState().current);
      if (warriorPreparedGuardRef.current && warriorHasSkill('guerreiro:guardiao:0')) warriorMdefMult += 0.02;
      if (band === 'open' && warriorHasSkill('guerreiro:duelista:1')) warriorCritBonus += 0.01;
      if (warriorHasSkill('guerreiro:furioso:5')) warriorSpeedBonus += warriorEnemyState().current <= 50 ? 0.03 : 0.02;
      if (warriorEnemyState().current <= 33 && warriorHasSkill('guerreiro:furioso:2')) warriorDmgTakenBonus -= 0.03;
      if (warriorRiposteRef.current && warriorHasSkill('guerreiro:guardiao:11')) tenacityBonus += 0.05;
    }
    const necroMdefMult = isNecromancer() && necroHasSkill('necromante:ceifador:2') ? 1 + Math.min(0.03, necroSoulsRef.current * 0.005) : 1;
    const necroMatkMult = isNecromancer() ? 1 + computeSkillBonuses(ch.classId, ch.unlockedSkills).magicDmgPct : 1;
    let rogueEvasionBonus = 0, rogueSpeedBonus = 0;
    if (isRogue()) {
      if (rogueHasSkill('ladino:sombras:0')) rogueSpeedBonus += 0.015;
      if (rogueHasSkill('ladino:laminas:5')) rogueSpeedBonus += 0.02;
      if (rogueImagesRef.current > 0 && rogueHasSkill('ladino:sombras:2')) rogueEvasionBonus += 0.01;
      if (roguePreparedTrickRef.current && rogueHasSkill('ladino:laminas:1')) rogueEvasionBonus += 0.01;
      if (rogueFirstQuickEvasionRef.current) rogueEvasionBonus += 0.02;
    }
    let paladinDefMult = 1, paladinMdefMult = 1, paladinLifestealBonus = 0;
    if (isPaladin()) {
      const conviction = paladinConviction(paladinLiturgyRef.current.virtues);
      if (paladinLiturgyRef.current.regent === 'courage' && paladinHasSkill('paladino:voto:1')) paladinMdefMult *= 1.02;
      if (conviction >= 2 && paladinHasSkill('paladino:voto:11')) paladinMdefMult *= 1.02;
      if (conviction >= 2 && paladinHasSkill('paladino:luz:11')) paladinMdefMult *= 1.02;
      if (ch.hp / effectiveMaxHp(ch) < 0.35 && paladinHasSkill('paladino:luz:7')) paladinDefMult *= 1.02;
      if (paladinLiturgyRef.current.virtues.mercy && paladinHasSkill('paladino:luz:3')) paladinLifestealBonus += 0.01;
    }

    // Arqueiro: bônus dinâmicos nunca são persistidos no personagem. A
    // Distância é aplicada à Precisão base; os nós de cada caminho apenas
    // acrescentam os escalamentos declarados pelo prompt.
    let archerAccuracyBonus = 0, archerCritBonus = 0, archerCritDmgBonus = 0, archerEvasionBonus = 0;
    let archerSpeedBonus = 0, archerDmgTakenBonus = 0, archerDefMult = 1;
    if (isArcher()) {
      const a = archerStateRef.current;
      archerAccuracyBonus += a.distance === 0 ? (archerHasSkill('arqueiro:instinto:1') ? -0.03 : -0.06) : a.distance === 2 ? 0.02 : a.distance === 3 ? 0.04 : 0;
      if (a.distance === 3) archerCritDmgBonus += 0.05;
      if (archerHasSkill('arqueiro:precisao:0') && a.tension >= 50) archerAccuracyBonus += Math.min(0.02, attrTotal(ch, 'dex') * 0.0008);
      if (archerHasSkill('arqueiro:precisao:1') && a.tension >= 75) archerCritBonus += Math.min(0.02, attrTotal(ch, 'luk') * 0.0008);
      if (archerHasSkill('arqueiro:precisao:7') && a.distance >= 2) archerEvasionBonus += Math.min(0.02, attrTotal(ch, 'agi') * 0.0008);
      if (archerHasSkill('arqueiro:tiro-rapido:0') && a.cadence >= 3) archerSpeedBonus += Math.min(0.02, attrTotal(ch, 'agi') * 0.0008);
      if (archerHasSkill('arqueiro:tiro-rapido:1') && (a.distance === 1 || a.distance === 2)) archerAccuracyBonus += Math.min(0.02, attrTotal(ch, 'dex') * 0.0008);
      if (archerHasSkill('arqueiro:tiro-rapido:2') && a.cadence >= 4) archerCritBonus += Math.min(0.02, attrTotal(ch, 'luk') * 0.0008);
      if (archerHasSkill('arqueiro:tiro-rapido:6')) archerSpeedBonus += Math.max(0, Math.min(0.08, Math.max(0, a.cadence - 2) * 0.02));
      if (archerHasSkill('arqueiro:instinto:0')) archerEvasionBonus += a.distance !== 3 ? Math.min(0.02, attrTotal(ch, 'agi') * 0.0008) : 0;
      if (archerHasSkill('arqueiro:instinto:2')) archerSpeedBonus += archerSpeedBuffRef.current;
      if (archerHasSkill('arqueiro:instinto:5') && archerDmgTakenBonusRef.current) archerDmgTakenBonus -= 0.03;
      if (archerHasSkill('arqueiro:instinto:11')) { archerDefMult *= 1.02; if (a.steps >= 3) archerSpeedBonus += 0.02; }
      if (a.steps >= 3 && archerHasSkill('arqueiro:instinto:6')) archerEvasionBonus += 0.04;
      archerAccuracyBonus += archerAccuracyBuffRef.current;
      archerEvasionBonus += archerEvasionBuffRef.current;
      archerSpeedBonus += archerSpeedBuffRef.current;
      if (archerHasSkill('arqueiro:tiro-rapido:11') && a.cadence >= 4) archerDmgTakenBonus -= Math.min(0.05, 0.03 + attrTotal(ch, 'vit') * 0.0008);
    }

    let druidMdef = 1, druidDmgTaken = 0, druidAccuracy = 0, druidSpeed = 0, druidCrit = 0, druidPen = 0;
    if (isDruid()) {
      const form = druidCycleRef.current.form;
      if (form === 'cervo') druidMdef *= 1.04;
      if (form === 'lobo') { druidSpeed += 0.05; druidAccuracy += 0.02; druidCrit += 0.02; }
      if (form === 'urso') druidDmgTaken -= 0.05;
      if (form === 'coruja') { druidAccuracy += 0.04; druidPen += 0.08; }
      if (druidAvatarActionsRef.current > 0) { druidMdef *= 1.04; druidSpeed += 0.05; druidDmgTaken -= 0.05; druidAccuracy += 0.04; druidCrit += 0.02; druidPen += 0.08; }
    }
    let warlockMdef = 1, warlockDmgTaken = 0, warlockAccuracy = 0, warlockTenacity = 0, warlockCritDmg = 0;
    if (isWarlock()) {
      if (warlockHasSkill('bruxo:maldicao:2')) { warlockMdef *= 1.02; if (warlockEnemyRef.current.bound) defMult *= 1.02; }
      if (warlockHasSkill('bruxo:pacto:1')) { warlockMdef *= 1.02; if (warlockStateRef.current.debt >= 4) warlockMdef *= 1.02; }
      if (warlockHasSkill('bruxo:pacto:5') && warlockStateRef.current.credit > 0) warlockMdef *= 1.02;
      if (warlockHasSkill('bruxo:corrupcao:2')) warlockMdef *= 1.02;
      if (warlockStateRef.current.scars > 0) warlockMdef *= Math.max(0, 1 - warlockStateRef.current.scars * 0.02);
      if (warlockHasSkill('bruxo:maldicao:0')) warlockAccuracy += 0.015 + (warlockEnemyRef.current.bound ? 0.02 : 0);
      if (warlockHasSkill('bruxo:corrupcao:1')) warlockAccuracy += 0.015 + (warlockStateRef.current.scars >= 2 ? 0.02 : 0);
      if (warlockHasSkill('bruxo:pacto:2')) warlockTenacity += 0.02;
      if (warlockHasSkill('bruxo:corrupcao:11')) warlockTenacity += 0.02;
      if (warlockHasSkill('bruxo:maldicao:5')) warlockCritDmg += 0.03 + (warlockEnemyRef.current.nameFragments >= 3 ? 0.02 : 0);
      if (warlockHasSkill('bruxo:corrupcao:7')) warlockCritDmg += 0.03 + (warlockStateRef.current.scars >= 3 ? 0.03 : 0);
    }
    let sorcererMdef = 1;
    if (isSorcerer()) {
      if (sorcererHasSkill('feiticeiro:dominio:2')) sorcererMdef *= 1.02 + (sorcererStateRef.current.control >= 2 ? 0.02 : 0);
      if (sorcererHasSkill('feiticeiro:dominio:11')) sorcererMdef *= 1.02;
    }
    return {
      ...base,
      atk: Math.round(base.atk * (1 + atkPct)),
      matk: Math.round(base.matk * (1 + atkPct) * necroMatkMult),
      def: Math.max(0, Math.round(base.def * defMult * clerigoDefBonusMult * knightDefBonusMult * paladinDefMult * archerDefMult)),
      mdef: Math.max(0, Math.round(base.mdef * defMult * (1 + getModTotal(playerModsRef.current, 'mdef')) * clerigoMdefBonusMult * knightMdefBonusMult * warriorMdefMult * necroMdefMult * paladinMdefMult * druidMdef * warlockMdef * sorcererMdef)),
      critChance: Math.min(0.9, Math.max(0, base.critChance + critAdd + hunterCritBonus + warriorCritBonus + archerCritBonus + druidCrit)),
      critDmgMult: base.critDmgMult + critDmgAdd + critDmgBonus + bardCritDmgBonus + hunterCritDmgBonus + archerCritDmgBonus + warlockCritDmg,
      // Fortaleza Viva (cavaleiro:bastiao:13) guarantees a 45% Bloqueio floor
      // while active, still respecting the global 60% cap.
      blockChance: Math.min(0.6, Math.max(0, base.blockChance + blockAdd, (knightActiveStats && knightFortressActive()) ? LIVING_FORTRESS_MIN_BLOCK_CHANCE : 0)),
      evasion: Math.max(0, base.evasion + getModTotal(playerModsRef.current, 'evasion') + hunterEvasionBonus + rogueEvasionBonus + archerEvasionBonus),
      accuracy: base.accuracy + getModTotal(playerModsRef.current, 'accuracy') + hunterAccuracyBonus + archerAccuracyBonus + druidAccuracy + warlockAccuracy + (isSorcerer() && sorcererHasSkill('feiticeiro:dominio:0') ? 0.015 : 0),
      dmgTakenPct: getModTotal(playerModsRef.current, 'dmgTakenPct') + hunterDmgTakenBonus + warriorDmgTakenBonus + archerDmgTakenBonus + druidDmgTaken + warlockDmgTaken + bardDmgTakenBonus,
      defPenPct: Math.max(0, getModTotal(playerModsRef.current, 'defPenPct') + druidPen),
      lifestealPct: Math.min(LIFESTEAL_CAP, Math.max(0, base.lifestealPct + getModTotal(playerModsRef.current, 'lifestealPct') + paladinLifestealBonus)),
      tenacityPct: base.tenacityPct + tenacityBonus + warlockTenacity + bardTenacityBonus,
      // Momentum's own base speed bonus (per-20 tiers, upgraded by the
      // Momentum passive node) — mirrors the dmg-bonus half applied live in
      // playerAct's damage pipeline.
      speedPct: Math.max(-0.5, base.speedPct + getModTotal(playerModsRef.current, 'speedPct') + (knightActiveStats ? knightMomentumBonusSpeedPct() : 0) + hunterSpeedBonus + warriorSpeedBonus + rogueSpeedBonus + archerSpeedBonus + druidSpeed + bardSpeedBonus),
    };
  }

  function computeEnemyDef(): number {
    return Math.max(0, Math.round(enemyRef.current.def * (1 + getModTotal(enemyModsRef.current, 'def'))));
  }
  function computeEnemyAtk(): number {
    return Math.max(0, Math.round(enemyRef.current.atk * (1 + getModTotal(enemyModsRef.current, 'atk'))));
  }
  // Enemies don't carry a separate magical stat-mod pool — a debuff landed on
  // 'atk'/'def' proportionally affects whichever power/defense channel is
  // actually rolled, same symmetric reuse as the player's mods above.
  function computeEnemyMatk(): number {
    return Math.max(0, Math.round((enemyRef.current.matk ?? 0) * (1 + getModTotal(enemyModsRef.current, 'atk'))));
  }
  function computeEnemyMdef(): number {
    return Math.max(0, Math.round((enemyRef.current.mdef ?? 0) * (1 + getModTotal(enemyModsRef.current, 'def'))));
  }
  function computeEnemyAccuracy(): number {
    return getModTotal(enemyModsRef.current, 'accuracy');
  }

  // A debuff/CC/DOT an enemy is trying to land on the player is blocked
  // outright while the player's Immunity buff is active — everything the
  // player already had before Immunity was cast keeps ticking down normally.
  function playerImmune(): boolean {
    return playerImmuneRoundsRef.current > 0;
  }

  // tenacityPct (see CombatStats.tenacityPct, WIS/VIT-derived + item affix)
  // rolls a chance to fully resist a new status effect or CC an enemy is
  // trying to land — a permanent, always-on defense distinct from
  // playerImmune()'s temporary Immunity buff. Deliberately NOT checked by
  // applyEnemyHp's BossPhase.cc above: a boss's scripted phase-transition CC
  // stays guaranteed by design, only the regular per-hit status/CC rolls
  // below can be resisted.
  function playerResists(defStats: { tenacityPct: number }): boolean {
    const resisted = Math.random() < defStats.tenacityPct;
    // Fé Vigilante (clerigo:retidao:2) — the first negative effect you fully
    // resist during a Consagração instance extends it by 1 tick.
    if (resisted && isClerigo() && clerigoConsecrationActive() && clerigoHasSkill('clerigo:retidao:2') && !clerigoConsecrationFlagsRef.current.feVigilante) {
      clerigoConsecrationFlagsRef.current = { ...clerigoConsecrationFlagsRef.current, feVigilante: true };
      clerigoExtendConsecration(FE_VIGILANTE_EXTEND_ROUNDS);
    }
    return resisted;
  }

  // Solo Consagrado (clerigo:retidao:6) — the FIRST negative effect (status/
  // CC) that lands on you during a Consagração instance has its duration cut
  // by 1 tick and grants +1 Fé, once per instance. Returns the (possibly
  // shortened) duration to actually apply; a result of 0 means the effect
  // shouldn't be applied at all.
  function clerigoSoloConsagradoFirstNegative(rounds: number): number {
    if (!isClerigo() || !clerigoConsecrationActive() || !clerigoHasSkill('clerigo:retidao:6') || clerigoConsecrationFlagsRef.current.soloConsagrado) return rounds;
    clerigoConsecrationFlagsRef.current = { ...clerigoConsecrationFlagsRef.current, soloConsagrado: true };
    clerigoGainFaith(1);
    return Math.max(0, rounds - SOLO_CONSAGRADO_FIRST_NEGATIVE_DURATION_CUT);
  }

  // True while an ability's own persistent effect is still up — lets
  // pickAbility() skip re-casting a buff/shield/regen/etc. on top of itself
  // just because its cooldown happens to be ready again. Heal/dispel/bigHit
  // and friends have no persistent state of their own, so they're never
  // filtered here.
  function abilityAlreadyActive(ab: AbilityDef): boolean {
    const eff = ab.effect;
    if (eff.kind === 'buffDef' || eff.kind === 'buffBlock') {
      return playerBuffsRef.current.some((b) => b.sourceAbilityId === ab.id);
    }
    if (eff.kind === 'shield') return playerShieldRef.current > 0;
    if (eff.kind === 'regen') return playerRegenRef.current.some((r) => r.sourceAbilityId === ab.id);
    if (eff.kind === 'immunity') return playerImmuneRoundsRef.current > 0;
    if (eff.kind === 'haste') return playerHasteRoundsRef.current > 0;
    if (eff.kind === 'berserk' || eff.kind === 'taunt' || eff.kind === 'lifestealBuff' || eff.kind === 'atkBuff') {
      return playerModsRef.current.some((m) => m.sourceAbilityId === ab.id);
    }
    if (eff.kind === 'statMod' && eff.statModTarget === 'self') return playerModsRef.current.some((m) => m.sourceAbilityId === ab.id);
    if (eff.kind === 'wallStance') return barbWallRoundsLeftRef.current > 0;
    if (eff.kind === 'painGuard') return barbPostureRoundsLeftRef.current > 0;
    if (eff.kind === 'divineWall') return clerigoWallBonusActive();
    if (eff.kind === 'consecrationGuard') return playerModsRef.current.some((m) => m.sourceAbilityId === ab.id);
    if (eff.kind === 'reviveWindow') return clerigoReviveWindowRoundsLeftRef.current > 0 || clerigoResurrectionTriggeredRef.current;
    if (eff.kind === 'ironWall') return knightIronWallActive();
    if (eff.kind === 'livingFortress') return knightFortressActive();
    if (eff.kind === 'colossalShield') return knightColossalShieldRef.current !== null;
    if (eff.kind === 'lastGuard') return knightLastGuardActive() || knightLastGuardUsedThisEnemyRef.current;
    if (eff.kind === 'counterStance') return knightCounterStanceActive();
    if (eff.kind === 'orderResist' || eff.kind === 'kingsBanner') return playerModsRef.current.some((m) => m.sourceAbilityId === ab.id);
    // Caçador: an already-armed trap from THIS ability blocks re-arming it
    // (spec section 36's "no trap respam") — a DIFFERENT trap ability can
    // still be picked, and this one frees up again once its trap triggers.
    if (eff.kind === 'armTrap') return hunterTrapsRef.current.some((t) => t.sourceAbilityId === ab.id);
    if (eff.kind === 'buffEvasion' || eff.kind === 'huntWithPrey') return playerModsRef.current.some((m) => m.sourceAbilityId === ab.id);
    if (eff.kind === 'preparedGuard') return warriorPreparedGuardRef.current !== null;
    if (eff.kind === 'feint') return warriorFeintReadyRef.current;
    return false;
  }

  // The single ability (of any kind — self or offense) the priority list
  // picks for this round's one action, if any is off cooldown, its condition
  // is met, and it isn't already active on the player — otherwise the round
  // falls back to a plain attack. Silence only blocks offense-kind picks;
  // self-targeted support abilities still work while silenced.
  function pickAbility(actionType?: 'main' | 'quick'): AbilityDef | null {
    const silenced = hasCC(playerCCRef.current, 'silence');
    const eligible: AbilityDef[] = [];
    const equipped = equippedAbilities();
    for (const ab of equipped) {
      if (actionType && (ab.actionType ?? 'main') !== actionType) continue;
      if (silenced && !isSelfAbilityKind(ab.effect.kind)) continue;
      if ((cooldownsRef.current[ab.id] ?? 0) > 0) continue;
      if (!conditionMet(ab)) continue;
      if (abilityAlreadyActive(ab)) continue;
      if (isWarlock()) {
        const e = ab.effect;
        const projection = projectWarlockCast({
          debt: warlockStateRef.current.debt,
          debtGain: e.warlockDebtGain,
          credit: warlockStateRef.current.credit,
          forgeryReady: warlockStateRef.current.forgeryReady,
          lawyer: warlockLawyer(),
          maxHp: effectiveMaxHp(chRef.current),
          currentHp: chRef.current.hp,
          selfHpCostPct: e.warlockSelfHpCostPct,
          collectionPct: e.warlockForcedCollectionPct ?? e.warlockEarlyCollectionPct,
        });
        if (!projection.safeToCast) continue;
      }
      eligible.push(ab);
    }
    if (isClerigo()) {
      return prioritizeClericTrialRotation(eligible, {
        apocalypseEquipped: equipped.some((ability) => ability.id === CLERIC_APOCALIPSE_SAGRADO_ABILITY_ID),
        apocalypseCooldown: cooldownsRef.current[CLERIC_APOCALIPSE_SAGRADO_ABILITY_ID] ?? 0,
        judgmentStacks: clerigoEnemyJudgmentStacks(),
        faith: clerigoFaithRef.current,
      })[0] ?? null;
    }
    return isDruid() ? pickDruidSeasonalAbility(eligible, druidCycleRef.current.season) : (eligible[0] ?? null);
  }

  // Mirrors pickAbility() for the enemy side — a silenced enemy can't use
  // its signature move at all (falls back to a plain attack), and even
  // off-cooldown it only fires useChance of the time so it reads as a
  // move the enemy sometimes breaks out, not its default action.
  function pickEnemyAbility(): EnemyAbility | null {
    if (hasCC(enemyCCRef.current, 'silence')) return null;
    for (const ab of enemyRef.current.abilities ?? []) {
      if ((enemyAbilityCooldownsRef.current[ab.id] ?? 0) > 0) continue;
      if (Math.random() < ab.useChance) return ab;
    }
    return null;
  }


  // DOT ticks (poison/burn/bleed/curse) at the start of every round, for
  // whichever side is carrying them. Deliberately never lets a tick finish
  // the kill outright (clamped to 1 HP) — reward granting (XP/gold/depth
  // advance) only happens from the direct attack-roll codepath, so a DOT
  // "kill" would otherwise vanish silently. Same clamp applied to the player
  // for consistency (death is only ever detected from the enemy's direct hit).
  // Reports through the same floating-number/flash feedback as any other
  // hit (see pushFloat) instead of a log line — a status tick used to only
  // show up as combat-log text, so poison/burn/bleed/curse damage was the
  // one kind of damage in the whole fight with no floating number at all.
  // The persistent status badge already names which effect is ticking, so a
  // log line would just repeat that.
  function tickStatus(ref: { current: StatusInstance[] }, hp: number, applyHp: (hp: number) => void, side: 'player' | 'enemy'): void {
    if (ref.current.length === 0) return;
    const ticking = ref.current;
    let totalDmg = ticking.reduce((s, e) => s + e.dmgPerTick, 0);
    ref.current = ticking.map((s) => ({ ...s, roundsLeft: s.roundsLeft - 1 })).filter((s) => s.roundsLeft > 0);
    if (totalDmg <= 0) return;
    // Vigília (clerigo:retidao:7) — the first DOT tick you suffer during a
    // Consagração instance is reduced, once per instance.
    if (side === 'player' && isClerigo() && clerigoConsecrationActive() && clerigoHasSkill('clerigo:retidao:7') && !clerigoConsecrationFlagsRef.current.vigilia) {
      clerigoConsecrationFlagsRef.current = { ...clerigoConsecrationFlagsRef.current, vigilia: true };
      totalDmg = Math.round(totalDmg * (1 - VIGILIA_FIRST_DOT_TICK_REDUCTION_PCT));
    }
    applyHp(Math.max(1, hp - totalDmg));
    pushFloat(side, totalDmg, false);
    flash(side);
  }

  // Duration-based decay (cooldowns, DOT, buffs/debuffs, CC, regen) — kept on
  // its own fixed cadence, untouched by either side's action speed, so no
  // ability/status duration needs rebalancing now that actions themselves
  // can run faster or slower than this.
  function envTick() {
    if (!mountedRef.current || phaseRef.current !== 'fight') return;

    const hasteBonus = playerHasteRoundsRef.current > 0 ? 1 : 0;
    for (const id in cooldownsRef.current) cooldownsRef.current[id] = Math.max(0, cooldownsRef.current[id] - (1 + hasteBonus));
    for (const id in enemyAbilityCooldownsRef.current) enemyAbilityCooldownsRef.current[id] = Math.max(0, enemyAbilityCooldownsRef.current[id] - 1);
    if (playerHasteRoundsRef.current > 0) playerHasteRoundsRef.current -= 1;
    if (playerImmuneRoundsRef.current > 0) playerImmuneRoundsRef.current -= 1;
    if (potionCooldownRef.current > 0) potionCooldownRef.current -= 1;
    playerModsRef.current = tickMods(playerModsRef.current);
    enemyModsRef.current = tickMods(enemyModsRef.current);
    syncPlayerMods();
    syncEnemyMods();

    tickStatus(enemyStatusRef, enemyRef.current.hp, (hp) => applyEnemyHp(hp), 'enemy');
    syncEnemyStatuses();
    if (isRogue() && rogueToxinRef.current && enemyRef.current.hp > 0) {
      const toxin = rogueToxinRef.current;
      const damage = Math.max(1, Math.round(toxin.snapshotPower * toxin.dmgMultiplier));
      toxin.ticksRemaining -= 1;
      if (toxin.ticksRemaining <= 0) rogueToxinRef.current = undefined;
      applyEnemyHp(Math.max(0, enemyRef.current.hp - damage));
      pushFloat('enemy', damage, false);
      rogueSync();
      if (enemyRef.current.hp <= 0) { resolveEnemyDeath(); return; }
    }
    if (isBarbaro()) barbTickWounds();
    tickStatus(playerStatusRef, chRef.current.hp, (hp) => updateCh({ ...chRef.current, hp }), 'player');
    syncPlayerStatuses();
    if (isBarbaro()) {
      barbTickPain();
      if (barbWallRoundsLeftRef.current > 0) barbWallRoundsLeftRef.current -= 1;
    }
    if (isClerigo()) {
      clerigoTickGrace();
      clerigoTickConsecration();
      clerigoTickJudgment();
      if (clerigoAncoraSagradaWindowRef.current > 0) clerigoAncoraSagradaWindowRef.current -= 1;
      // Juízo Final's buff decays via the generic playerModsRef timer above
      // (tickMods) — once it's gone, clear the "can't renew while active"
      // flag so the next 5-stack consumption can trigger it again.
      if (clerigoJuizoFinalActiveRef.current && !playerModsRef.current.some((m) => m.sourceAbilityId === 'clerigo:provacao:14')) {
        clerigoJuizoFinalActiveRef.current = false;
      }
    }
    if (isKnight()) {
      // Disciplina Inabalável's own "no máximo uma geração por envTick" gate.
      knightNegativeCounterComandoTickRef.current = 0;
      if (knightIronWallRoundsLeftRef.current > 0) knightIronWallRoundsLeftRef.current -= 1;
      if (knightFortressRoundsLeftRef.current > 0) knightFortressRoundsLeftRef.current -= 1;
      if (knightNextHitReductionWindowRef.current > 0) knightNextHitReductionWindowRef.current -= 1;
      if (knightCounterStanceRoundsLeftRef.current > 0) knightCounterStanceRoundsLeftRef.current -= 1;
      if (knightBastiaoInquebravelActiveRoundsRef.current > 0) knightBastiaoInquebravelActiveRoundsRef.current -= 1;
      // Última Guarda — the barrier is only granted once the window ends
      // naturally AND the player is still alive (updateCh's floor already
      // guaranteed hp stayed at 1+ throughout).
      if (knightLastGuardRoundsLeftRef.current > 0) {
        knightLastGuardRoundsLeftRef.current -= 1;
        if (knightLastGuardRoundsLeftRef.current === 0 && chRef.current.hp > 0) {
          const pct = LAST_GUARD_POST_BARRIER_BASE + capped(LAST_GUARD_POST_BARRIER_PER_VIT, attrTotal(chRef.current, 'vit'), LAST_GUARD_POST_BARRIER_CAP);
          playerShieldRef.current += Math.round(pct * knightEffMaxHp() * knightBarrierMult());
          syncShield();
        }
      }
    }
    if (isRogue() && rogueEnemyDmgDebuffRef.current > 0) rogueEnemyDmgDebuffRef.current -= 1;
    if (isPaladin()) {
      if (paladinNextOffenseBuffTicksRef.current > 0) paladinNextOffenseBuffTicksRef.current -= 1;
      if (paladinLawHammerTicksRef.current > 0) paladinLawHammerTicksRef.current -= 1;
      if (paladinAegisRef.current) {
        const expiring = paladinAegisRef.current.ticksLeft <= 1;
        paladinAegisRef.current = expiring ? null : { ...paladinAegisRef.current, ticksLeft: paladinAegisRef.current.ticksLeft - 1 };
        if (expiring && paladinHasSkill('paladino:voto:8')) paladinHeal(effectiveMaxHp(chRef.current) * 0.03, false);
      }
      paladinSync();
    }

    if (playerRegenRef.current.length > 0) {
      const maxHp = effectiveMaxHp(chRef.current);
      const healPct = playerRegenRef.current.reduce((s, r) => s + r.pct, 0);
      playerRegenRef.current = playerRegenRef.current.map((r) => ({ ...r, roundsLeft: r.roundsLeft - 1 })).filter((r) => r.roundsLeft > 0);
      if (healPct > 0 && chRef.current.hp > 0) {
        const healed = Math.min(maxHp, chRef.current.hp + Math.round(maxHp * healPct));
        if (healed > chRef.current.hp) {
          const healedAmount = healed - chRef.current.hp;
          updateCh({ ...chRef.current, hp: healed });
          pushLog(`Você regenera ${healedAmount} de vida.`);
          pushFloat('player', healedAmount, false, undefined, undefined, true);
        }
      }
    }

    playerCCRef.current = tickCC(playerCCRef.current);
    syncPlayerCC();
    enemyCCRef.current = tickCC(enemyCCRef.current);
    syncEnemyCC();

    if (isWarrior()) {
      if (warriorPreparedGuardRef.current) {
        const ticksLeft = warriorPreparedGuardRef.current.ticksLeft - 1;
        warriorPreparedGuardRef.current = ticksLeft > 0 ? { ...warriorPreparedGuardRef.current, ticksLeft } : null;
        warriorSyncPlayer();
      }
      const ws = warriorEnemyState();
      if (ws.guardBroken) {
        const ticksLeft = ws.ticksLeft - 1;
        if (ticksLeft <= 0) warriorEndGuardBreak();
        else warriorCommitEnemy({ ...ws, ticksLeft });
      }
    }

    if (isHunter()) {
      if (hunterRecentTrapTriggerTicksRef.current > 0) hunterRecentTrapTriggerTicksRef.current -= 1;
      if (hunterInstintoFugaWindowTicksRef.current > 0) hunterInstintoFugaWindowTicksRef.current -= 1;
      hunterTickBreaches();
    }
    // Gélido: Resfriado/Frágil naturally warm one step after four full
    // environmental cycles without a new frost application. Congelado ends
    // through the enemy action or an explicit shatter, never through this timer.
    if (isMage() && mageThermalRef.current !== 'normal' && mageThermalRef.current !== 'frozen') {
      mageThermalTicksRef.current += 1;
      if (mageThermalTicksRef.current >= 4) {
        mageThermalRef.current = mageThermalRef.current === 'fragile' ? 'chilled' : 'normal';
        mageThermalTicksRef.current = 0; mageSync();
      }
    }

    if (isNecromancer()) {
      if (necroPlagueRef.current && enemyRef.current.hp > 0) {
        const plague = necroPlagueRef.current;
        const damage = plagueTickDamage(plague, necroDecompositionRef.current?.stacks ?? 0);
        necroMetric('plagueDamage', damage);
        necroPlagueRef.current = plague.ticksRemaining > 1 ? { ...plague, ticksRemaining: plague.ticksRemaining - 1 } : undefined;
        applyEnemyHp(Math.max(0, enemyRef.current.hp - damage));
        pushFloat('enemy', damage, false); flash('enemy');
        if (necroHasSkill('necromante:decomposicao:6')) {
          const heal = Math.min(Math.round(effectiveMaxHp(chRef.current) * 0.0075), Math.round(damage * 0.08));
          necroMetric('healing', heal);
          if (heal > 0) { updateCh({ ...chRef.current, hp: Math.min(effectiveMaxHp(chRef.current), chRef.current.hp + heal) }); pushFloat('player', heal, false, undefined, undefined, true); }
        }
        if (necroHasSkill('necromante:decomposicao:8') && (necroDecompositionRef.current?.stacks ?? 0) >= 4) {
          enemyModsRef.current = enemyModsRef.current.filter((m) => m.sourceAbilityId !== 'necromante:decomposicao:8');
          enemyModsRef.current.push({ stat: 'atk', pct: -0.06, roundsLeft: 1, sourceAbilityId: 'necromante:decomposicao:8' }); syncEnemyMods();
        }
        if (enemyRef.current.hp <= 0) { necroSync(); resolveEnemyDeath(); return; }
      }
      if (necroDecompositionRef.current) {
        const ticks = necroDecompositionRef.current.ticksRemaining - 1;
        necroDecompositionRef.current = ticks > 0 ? { ...necroDecompositionRef.current, ticksRemaining: ticks } : undefined;
      }
      const survivors: SummonInstance[] = [];
      for (const summon of necroSummonsRef.current) {
        const advanced = advanceSummonClock(summon, ATTACK_INTERVAL);
        for (let i = 0; i < advanced.attacks && enemyRef.current.hp > 0; i++) {
          const stats = computePlayerStats();
          const bonus = necroHasSkill('necromante:drenar-vida:1') ? capped(0.001, attrTotal(chRef.current, 'int'), 0.04) : 0;
          const damage = Math.max(1, Math.round(mitigatedBase(stats.matk * summon.damageMultiplier * (1 + bonus), computeEnemyMdef())));
          necroMetric('servantDamage', damage); necroMetric('servantAttacks', 1);
          applyEnemyHp(Math.max(0, enemyRef.current.hp - damage)); pushFloat('enemy', damage, false);
          if (necroHasSkill('necromante:drenar-vida:8')) necroRetributionStacksRef.current = Math.min(3, necroRetributionStacksRef.current + 1);
          if (enemyRef.current.hp <= 0) break;
        }
        if (advanced.next.attacksRemaining > 0 && enemyRef.current.hp > 0) survivors.push(advanced.next);
        else if (advanced.next.attacksRemaining <= 0 && enemyRef.current.hp > 0 && !necroNaturalExpirySoulRef.current && necroHasSkill('necromante:drenar-vida:14')) { necroNaturalExpirySoulRef.current = true; necroGainSouls(1); }
      }
      necroSummonsRef.current = survivors;
      if (necroNextMagicBonusRef.current) {
        necroNextMagicBonusRef.current.ticks -= 1;
        if (necroNextMagicBonusRef.current.ticks <= 0) necroNextMagicBonusRef.current = null;
      }
      if (necroDeathVeilTicksRef.current > 0) necroDeathVeilTicksRef.current -= 1;
      if (necroVigorTicksRef.current > 0) necroVigorTicksRef.current -= 1;
      const decompositionNow = necroDecompositionRef.current?.stacks ?? 0;
      necroMetric('decompositionSamples', 1); necroMetric('decompositionTotal', decompositionNow);
      if (decompositionNow === DECOMPOSITION_MAX) necroMetric('ticksAtFive', 1);
      necroSync();
      if (enemyRef.current.hp <= 0) { resolveEnemyDeath(); return; }
    }

    scheduleEnv();
  }

  // The player's own action clock — paced independently of the enemy's via
  // nextPlayerDelay() (shorter with more AGI), so a fast build genuinely
  // gets more of these per enemy action instead of just better dodge/block
  // odds. Stun/sleep are read live here (envTick only advances their
  // remaining duration) since this can now fire between envTick pulses.
  // Centralized "an enemy's HP just reached 0" closure — every kill source
  // (a direct hit here in playerAct, or a Bárbaro Ferida tick in
  // barbTickWounds) resolves through this ONE path, so XP/gold/loot/rune/
  // boss-victory/depth-advance can never be granted twice or skipped
  // depending on which source landed the killing blow (see the redesign
  // spec's "morte por efeito indireto").
  function resolveEnemyDeath() {
    const prevLevel = chRef.current.level;
    const isBossKill = enemyRef.current.isBoss === true;
    const isEliteKill = enemyRef.current.isElite === true;
    const necroDeathSetup = isNecromancer() && (necroPlagueRef.current !== undefined || (necroDecompositionRef.current?.stacks ?? 0) >= 3);
    const necroPreservedServant = isNecromancer() && necroHasSkill('necromante:drenar-vida:14') && necroSummonsRef.current[0]
      ? { ...necroSummonsRef.current[0], attacksRemaining: Math.min(2, necroSummonsRef.current[0].attacksRemaining), elapsedMs: 0 }
      : undefined;
    if (isNecromancer()) necroGainSouls(1);
    const bossBonusGold = isBossKill ? Math.round(enemyRef.current.goldReward * 0.5) : 0;
    const xpGain = Math.round(enemyRef.current.xpReward * (dungeon.xpMult ?? 1));
    const goldGain = Math.round(enemyRef.current.goldReward * (dungeon.goldMult ?? 1)) + bossBonusGold;
    const withXp = grantXp(chRef.current, xpGain);
    // grantXp() heals to its own raw maxHp field on every level gained,
    // which undercounts equipment/attribute/building bonuses — bump it
    // up to the real cap so a level-up genuinely tops the player off.
    if (withXp.level > prevLevel) withXp.hp = effectiveMaxHp(withXp);
    const shape = enemyRef.current.shape;
    const kills = { ...withXp.kills, [shape]: (withXp.kills?.[shape] ?? 0) + 1 };
    let finalChar = { ...withXp, gold: withXp.gold + goldGain, bestDepth: Math.max(withXp.bestDepth, depthRef.current), kills };
    // Sangue de Caça (barbaro:selvageria:2) — heal on kill if the enemy
    // carried 3+ Feridas at the moment it died (read before any state below
    // clears barbarianWounds), base 1% of max HP, VIT-scaled up to 2%.
    if (isBarbaro() && barbHasSkill('barbaro:selvageria:2') && (enemyRef.current.barbarianWounds?.stacks ?? 0) >= SANGUE_DE_CACA_MIN_WOUNDS) {
      const healPct = SANGUE_DE_CACA_BASE_HEAL_PCT + capped(SANGUE_DE_CACA_VIT_RATE, attrTotal(finalChar, 'vit'), SANGUE_DE_CACA_VIT_CAP);
      const maxHp = effectiveMaxHp(finalChar);
      const healAmt = Math.round(maxHp * healPct);
      if (healAmt > 0) {
        finalChar = { ...finalChar, hp: Math.min(maxHp, finalChar.hp + healAmt) };
        pushFloat('player', healAmt, false, undefined, undefined, true);
      }
    }
    // Sede de Vitória (cavaleiro:investida:8) — flat heal on every kill,
    // VIT-uninvolved (fixed % of effective max HP).
    if (isKnight() && knightHasSkill('cavaleiro:investida:8')) {
      const maxHp = effectiveMaxHp(finalChar);
      const healAmt = Math.round(maxHp * SEDE_DE_VITORIA_HEAL_PCT);
      if (healAmt > 0) {
        finalChar = { ...finalChar, hp: Math.min(maxHp, finalChar.hp + healAmt) };
        pushFloat('player', healAmt, false, undefined, undefined, true);
      }
    }
    if (necroDeathSetup && necroHasSkill('necromante:decomposicao:14')) {
      const baseline = CLASSES[finalChar.classId].baseHp + 6 * (finalChar.level - 1);
      // Death restoration is explicitly outside Healing Power's scope.
      const healAmt = Math.round(baseline * 0.04);
      finalChar = { ...finalChar, hp: Math.min(effectiveMaxHp(finalChar), finalChar.hp + healAmt) };
      pushFloat('player', healAmt, false, undefined, undefined, true);
    }
    if (!isBossKill) finalChar = { ...finalChar, hp: recoverAfterEncounter(finalChar, finalChar.hp) };
    updateCh(finalChar);
    runStatsRef.current.kills += 1;
    runStatsRef.current.goldFromKills += goldGain;
    runStatsRef.current.xpGained += xpGain;
    pushLog([{ text: `${enemyRef.current.name} foi derrotado! +${xpGain} XP, +${goldGain} de ouro.`, color: '#4ade80' }]);
    if (finalChar.level > prevLevel) pushLog([{ text: `Você subiu para o nível ${finalChar.level}!`, color: '#c89a2e' }]);
    // Elite checkpoint kills always drop something too, same as a
    // boss — clearing one of these mid-run milestones is meant to
    // feel worth the extra danger, not just riskier for the same odds.
    tryDropEquipment(isBossKill || isEliteKill);
    tryDropRune(isBossKill || isEliteKill);

    // Both transitions below normally wait 900ms so the kill lands
    // before the screen moves on — pointless during a silent
    // catch-up pass (see runCatchUp), where they instead resolve the
    // instant this function returns so the fast-forward loop can move
    // straight to the next action.
    if (isBossKill) {
      const finishVictory = () => {
        if (!mountedRef.current) return;
        pushLog([{ text: `Você derrotou o guardião de ${dungeon.name} — masmorra concluída!`, color: '#c89a2e' }]);
        phaseRef.current = 'ended';
        endedReasonRef.current = 'victory';
        setEndedReason('victory');
        setPhase('ended');
        if (!silentRef.current) {
          setResultBanner('victory');
          setTimeout(() => { if (mountedRef.current) setResultBanner(null); }, 2000);
        }
      };
      if (silentRef.current) finishVictory(); else setTimeout(finishVictory, 900);
      return;
    }

    const advanceToNextEnemy = () => {
      if (!mountedRef.current) return;
      const nextDepth = depthRef.current + 1;
      updateDepth(nextDepth);
      const next = spawnEnemy(nextDepth, dungeon);
      updateEnemy(isWarrior() ? { ...next, warrior: createWarriorEnemyState() } : next);
      enemyGenRef.current += 1; // invalidates the old enemy's still-pending action timer, see scheduleEnemy()
      if (next.isElite) pushLog([{ text: `${next.name} bloqueia seu caminho — parece bem mais forte que o normal!`, color: '#f59e0b' }]);
      enemyStatusRef.current = [];
      enemyModsRef.current = [];
      enemyCCRef.current = [];
      enemyAbilityCooldownsRef.current = {};
      bossPhaseIndexRef.current = 0;
      setBossPhaseName(null);
      if (isDruid()) {
        for (const a of equippedAbilities()) if (a.effect.druidSeason === druidCycleRef.current.season) cooldownsRef.current[a.id] = 0;
        druidSync();
      }
      syncEnemyStatuses();
      syncEnemyCC();
      syncEnemyMods();
      // Bárbaro's Fúria/Frenesi/Feridas reset every new enemy (Dor persists
      // across the whole dungeon attempt — see barbPainPacketsRef's comment).
      if (isBarbaro()) {
        barbFuryRef.current = 0;
        barbFrenzyRef.current = false;
        barbPostureRoundsLeftRef.current = 0;
        barbWallRoundsLeftRef.current = 0;
        syncBarbFury();
        syncBarbFrenzy();
      }
      // Clérigo: Fé partially carries over (nextFaithForNewEnemy), Graça/
      // Consagração/barreiras/Ancora Sagrada/Juízo Final reset like Fúria/
      // Frenesi, and Julgamento just doesn't exist on the freshly spawned
      // enemy — per-enemy Fé-milestone tracking resets with it.
      if (isClerigo()) {
        clerigoFaithRef.current = nextFaithForNewEnemy(clerigoFaithRef.current);
        clerigoGraceRef.current = { amount: 0, ticksLeft: 0 };
        clerigoConsecrationRoundsLeftRef.current = 0;
        clerigoConsecrationFlagsRef.current = { soloConsagrado: false, feVigilante: false, vigilia: false, santuarioVivo: false };
        clerigoBarrierPortionsRef.current = [];
        clerigoAncoraSagradaWindowRef.current = 0;
        clerigoJudgmentFaithMilestonesRef.current = new Set();
        clerigoJuizoFinalActiveRef.current = false;
        syncClerigoFaith();
        syncClerigoGrace();
        syncClerigoConsecration();
      }
      if (isMage()) {
        mageRunesRef.current = Math.min(mageRunesRef.current, 1);
        mageHeatRef.current = Math.min(mageHeatRef.current, 40);
        mageThermalRef.current = 'normal'; mageThermalTicksRef.current = 0;
        mageLastPolarityRef.current = 'none'; mageCircuitRef.current = 0; mageResonanceRef.current = false;
        mageInverterPendingRef.current = false; mageOverheatUsedThisEnemyRef.current = false;
        mageFirstFireHitThisEnemyRef.current = false; mageFirstFrostHitThisEnemyRef.current = false;
        mageFrozenAccuracyPendingRef.current = false; mageNextDamageReductionRef.current = 0;
        mageFrostBarrierAdvanceRef.current = 0; mageCurrentCastAmplifiedRef.current = false;
        mageSync();
      }
      if (isArcher()) archerResetEncounter();
      if (isWarlock()) warlockResetEnemy();
      if (isSorcerer()) sorcererResetEnemy();
      if (isBard()) bardResetEnemy();
      sorcererEnemyReductionRef.current = 0;
      if (isNecromancer()) {
        necroSoulsRef.current = soulsForNextEnemy(necroSoulsRef.current, necroDeathSetup && necroHasSkill('necromante:decomposicao:14'));
        necroMetric('soulsCarried', necroSoulsRef.current);
        necroDecompositionRef.current = undefined; necroPlagueRef.current = undefined;
        necroSummonsRef.current = necroPreservedServant ? [necroPreservedServant] : [];
        necroSoulThresholdsRef.current = new Set(); necroFirstScytheSoulRef.current = false;
        necroFirstSummonRef.current = false; necroNaturalExpirySoulRef.current = false;
        necroReaperDiscountRef.current = false; necroNextMagicBonusRef.current = null;
        necroRetributionStacksRef.current = 0; necroDeathVeilTicksRef.current = 0; necroVigorTicksRef.current = 0;
        necroSync();
      }
      if (isRogue()) {
        rogueStealthRef.current = rogueHasSkill('ladino:veneno:14');
        rogueStealthMainLeftRef.current = rogueStealthRef.current ? ROGUE_STEALTH_MAIN_LIMIT : 0;
        rogueExposedMainLeftRef.current = 0;
        rogueToxicBladeMainLeftRef.current = 0;
        rogueToxinRef.current = undefined;
        rogueImagesRef.current = 0;
        rogueSharpenedEchoRef.current = false;
        roguePreparedTrickRef.current = null;
        rogueAdvantageRef.current = false;
        rogueNextMainAccuracyRef.current = false;
        rogueFlowUntouchableRef.current = false;
        rogueFirstQuickEvasionRef.current = false;
        rogueFirstAmbushRef.current = false;
        rogueFirstTrickRef.current = false;
        rogueQuickWindowRef.current = false;
        rogueTimeStolenRef.current = false;
        rogueEnemyDmgDebuffRef.current = 0;
        rogueSync();
      }
      if (isPaladin()) {
        paladinLiturgyRef.current = createPaladinLiturgyState();
        paladinAegisRef.current = null;
        paladinAegisBonusPendingRef.current = false;
        paladinVotoMantidoUsedRef.current = false;
        paladinMercyDutyUsedRef.current = false;
        paladinAegisPerfectUsedEnemyRef.current = false;
        paladinNextOffenseBuffTicksRef.current = 0;
        paladinLawHammerTicksRef.current = 0;
        paladinSync();
      }
      // Cavaleiro: everything resets per enemy EXCEPT Sede de Vitória's
      // capped Momentum carry and Liderança's capped Ordens carry, and
      // EXCEPT Bastião Inquebrável's once-per-ATTEMPT save (untouched here).
      if (isKnight()) {
        knightDeterminationRef.current = 0;
        knightBlockCountRef.current = 0;
        knightRetaliationChargesRef.current = 0;
        knightIronWallRoundsLeftRef.current = 0;
        knightFortressRoundsLeftRef.current = 0;
        knightNextHitReductionWindowRef.current = 0;
        knightLastGuardRoundsLeftRef.current = 0;
        knightLastGuardUsedThisEnemyRef.current = false;
        knightCounterStanceRoundsLeftRef.current = 0;
        knightCounterStoredDmgRef.current = 0;
        knightColossalShieldRef.current = null;
        knightBastiaoInquebravelActiveRoundsRef.current = 0;
        const carriedMomentum = knightHasSkill('cavaleiro:investida:8') ? Math.min(SEDE_DE_VITORIA_MOMENTUM_CARRY_CAP, knightMomentumRef.current) : 0;
        knightMomentumRef.current = carriedMomentum;
        knightFirstHitLandedRef.current = false;
        knightMomentumMaxBonusRef.current = 0;
        knightConsecutiveHitsRef.current = 0;
        knightPressureStacksRef.current = 0;
        const carriedOrders = knightHasSkill('cavaleiro:comando:6') && knightOrdersRef.current >= 1 ? 1 : 0;
        knightOrdersRef.current = carriedOrders;
        knightCommandSupremeRef.current = false;
        knightBannerRefundWindowRef.current = false;
        syncKnightDetermination();
        syncKnightRetaliation();
        syncKnightMomentum();
        syncKnightOrders();
        syncKnightCommandSupreme();
      }
      // Caçador: Rastro/Brechas live ON the enemy instance itself, so they
      // reset for free the instant spawnEnemy() hands back a fresh one with
      // no hunterTrail/hunterBreaches fields — only the session-only refs
      // below (traps, per-enemy counters/windows) need an explicit reset.
      // Traps never persist between enemies or dungeon runs (spec section 6).
      if (isHunter()) {
        hunterTrapsRef.current = [];
        syncHunterTraps();
        hunterRecentTrapTriggerTicksRef.current = 0;
        hunterTrapsTriggeredThisEnemyRef.current = 0;
        hunterFirstTrapTriggeredThisEnemyRef.current = false;
        hunterNextShotBonusAvailableRef.current = false;
        hunterInstintoFugaWindowTicksRef.current = 0;
        hunterPassoEthereoMissPendingRef.current = false;
        hunterMantoSombrasBreachesGrantedRef.current = 0;
        hunterConsecutiveHitCounterRef.current = 0;
        hunterCritCounterRef.current = 0;
        hunterMemoriaTrilhaGrantedRef.current = false;
      }
      if (isWarrior()) {
        warriorPreparedGuardRef.current = null;
        warriorRiposteRef.current = null;
        warriorReadingRef.current = null;
        warriorFeintReadyRef.current = false;
        warriorNextBasicPostureBonusRef.current = false;
        warriorSyncPlayer();
      }
      // Both clocks restart clean for the new encounter — previously
      // only the player's got a fresh schedulePlayer() call here, so
      // the enemy inherited whatever was left on the OLD enemy's timer
      // (its ATB bar would visibly pick up mid-fill instead of empty).
      schedulePlayer(nextPlayerDelay());
      scheduleEnemy();
    };
    if (silentRef.current) advanceToNextEnemy(); else setTimeout(advanceToNextEnemy, 900);
  }

  function playerAct() {
    if (!mountedRef.current || phaseRef.current !== 'fight') return;
    if (enemyRef.current.hp <= 0) { schedulePlayer(nextPlayerDelay()); return; }

    const playerStunned = hasCC(playerCCRef.current, 'stun') || hasCC(playerCCRef.current, 'sleep');
    const chosen = playerStunned ? null : pickAbility(isRogue() ? 'main' : undefined);
    const stats = computePlayerStats();
    const selectedIds = chosen ? [chosen.id] : [];
    const core = createCombatState(
      chRef.current,
      { ...enemyRef.current },
      Math.floor(Math.random() * 0xFFFFFFFF),
      selectedIds,
      selectedIds,
    );
    const panelBarrierAtCast = playerShieldRef.current;
    core.playerHp = chRef.current.hp;
    core.enemyHp = enemyRef.current.hp;
    core.playerBarrier = playerShieldRef.current;
    core.playerMods = playerModsRef.current.map((mod) => ({ stat: mod.stat, pct: mod.pct, roundsLeft: mod.roundsLeft }));
    core.enemyMods = enemyModsRef.current.map((mod) => ({ stat: mod.stat, pct: mod.pct, roundsLeft: mod.roundsLeft }));
    core.playerStatuses = playerStatusRef.current.map((status) => ({ kind: status.kind, roundsLeft: status.roundsLeft, damagePct: status.dmgPerTick / Math.max(1, stats.matk || stats.atk) }));
    core.enemyStatuses = enemyStatusRef.current.map((status) => ({ kind: status.kind, roundsLeft: status.roundsLeft, damagePct: status.dmgPerTick / Math.max(1, stats.matk || stats.atk) }));
    core.playerCC = playerCCRef.current.map((cc) => ({ kind: cc.kind, roundsLeft: cc.roundsLeft }));
    core.enemyCC = enemyCCRef.current.map((cc) => ({ kind: cc.kind, roundsLeft: cc.roundsLeft }));
    core.hots = playerRegenRef.current.map((hot) => ({ pct: hot.pct, roundsLeft: hot.roundsLeft }));
    core.preparedGuard = warriorPreparedGuardRef.current ? { ...warriorPreparedGuardRef.current } : undefined;
    core.aegis = paladinAegisRef.current ? {
      reductionPct: paladinAegisRef.current.reductionPct,
      capPct: paladinAegisRef.current.maxHpCapPct,
      hits: paladinAegisRef.current.hitsRemaining,
      roundsLeft: paladinAegisRef.current.ticksLeft,
    } : undefined;
    core.reviveWindow = clerigoReviveWindowRoundsLeftRef.current;
    const equippedById = new Map(equippedAbilities().map((ability) => [ability.id, ability]));
    core.traps = hunterTrapsRef.current.flatMap((trap) => {
      const ability = equippedById.get(trap.sourceAbilityId);
      return ability ? [{ effect: ability.effect, sourceAbilityId: ability.id, roundsLeft: 99 }] : [];
    });

    const raw = core.classState as unknown as Record<string, unknown>;
    raw.playerHpPctAtCast = core.playerHp / effectiveMaxHp(core.character);
    const resource = (key: string, value: number) => { core.classState.resources[key] = value; raw[key] = value; };
    switch (chRef.current.classId) {
      case 'barbaro':
        resource('fury', barbFuryRef.current);
        raw.pain = barbPainTotal();
        raw.frenzy = barbFrenzyRef.current;
        raw.wildPostureRounds = barbPostureRoundsLeftRef.current;
        break;
      case 'clerigo':
        resource('faith', clerigoFaithRef.current);
        raw.consecration = clerigoConsecrationRoundsLeftRef.current;
        break;
      case 'cavaleiro':
        resource('determination', knightDeterminationRef.current);
        resource('momentum', knightMomentumRef.current);
        resource('orders', knightOrdersRef.current);
        break;
      case 'mago':
        resource('heat', mageHeatRef.current);
        raw.thermal = mageThermalRef.current;
        raw.thermalTicks = mageThermalTicksRef.current;
        raw.mageCircuit = mageCircuitRef.current;
        raw.magePolarity = mageLastPolarityRef.current;
        break;
      case 'ladino':
        raw.images = rogueImagesRef.current;
        raw.stealthed = rogueStealthRef.current;
        raw.exposed = rogueExposedMainLeftRef.current > 0;
        raw.advantageReady = rogueAdvantageRef.current;
        raw.preparedTrick = roguePreparedTrickRef.current?.kind ?? null;
        break;
      case 'feiticeiro':
        resource('pulse', sorcererStateRef.current.pulse);
        resource('resonance', sorcererStateRef.current.resonance);
        resource('control', sorcererStateRef.current.control);
        core.sorcererEnemy = { ...sorcererEnemyRef.current };
        break;
      case 'bruxo':
        core.warlockPlayer = { ...warlockStateRef.current };
        core.warlockEnemy = { ...warlockEnemyRef.current };
        break;
      case 'arqueiro':
        core.archerState = { ...archerStateRef.current, arrows: [...archerStateRef.current.arrows] };
        break;
      case 'bardo':
        core.bardState = { ...bardStateRef.current, notes: [...bardStateRef.current.notes] };
        break;
      case 'necromante':
        resource('souls', necroSoulsRef.current);
        raw.decomposition = necroDecompositionRef.current?.stacks ?? 0;
        raw.plague = necroPlagueRef.current?.ticksRemaining ?? 0;
        raw.servantAttacks = necroSummonsRef.current.map((summon) => summon.attacksRemaining);
        raw.servants = necroSummonsRef.current.length;
        break;
      case 'druida':
        raw.season = druidCycleRef.current.season;
        raw.attunement = druidCycleRef.current.attunement;
        raw.form = druidCycleRef.current.form;
        raw.gardenSeeds = druidGardenRef.current.length;
        break;
      case 'paladino':
        raw.virtues = { ...paladinLiturgyRef.current.virtues };
        raw.liturgy = paladinLiturgyRef.current.actionsLeft;
        raw.verdictRegent = paladinLiturgyRef.current.regent;
        resource('conviction', paladinConviction(paladinLiturgyRef.current.virtues));
        break;
      case 'cacador':
        raw.trapsTriggered = hunterTrapsTriggeredThisEnemyRef.current;
        break;
      case 'guerreiro':
        break;
    }

    if (playerStunned) pushLog('Você está incapacitado e não consegue atacar!');
    resolvePlayerAction(core);

    updateCh({ ...chRef.current, hp: core.playerHp });
    updateEnemy({ ...core.enemy, hp: core.enemyHp });
    playerShieldRef.current = core.playerBarrier;
    if (chRef.current.classId === 'clerigo' && core.playerBarrier > panelBarrierAtCast) clerigoAddBarrierPortion(core.playerBarrier - panelBarrierAtCast);
    syncShield();
    playerModsRef.current = core.playerMods.map((mod) => ({ stat: mod.stat as StatModStat, pct: mod.pct, roundsLeft: mod.roundsLeft, sourceAbilityId: chosen?.id }));
    enemyModsRef.current = core.enemyMods.map((mod) => ({ stat: mod.stat as StatModStat, pct: mod.pct, roundsLeft: mod.roundsLeft, sourceAbilityId: chosen?.id }));
    const statusPower = Math.max(1, stats.matk || stats.atk);
    playerStatusRef.current = core.playerStatuses.map((status) => ({ kind: status.kind, roundsLeft: status.roundsLeft, dmgPerTick: Math.max(1, Math.round(status.damagePct * statusPower)) }));
    enemyStatusRef.current = core.enemyStatuses.map((status) => ({ kind: status.kind, roundsLeft: status.roundsLeft, dmgPerTick: Math.max(1, Math.round(status.damagePct * statusPower)) }));
    playerCCRef.current = core.playerCC.map((cc) => ({ ...cc }));
    enemyCCRef.current = core.enemyCC.map((cc) => ({ ...cc }));
    playerRegenRef.current = core.hots.map((hot) => ({ pct: hot.pct, roundsLeft: hot.roundsLeft, sourceAbilityId: chosen?.id }));
    syncPlayerMods(); syncEnemyMods(); syncPlayerStatuses(); syncEnemyStatuses(); syncPlayerCC(); syncEnemyCC();

    if (chRef.current.classId === 'barbaro') {
      barbFuryRef.current = Number(raw.fury ?? core.classState.resources.fury ?? 0);
      barbFrenzyRef.current = Boolean(raw.frenzy);
      barbPostureRoundsLeftRef.current = Number(raw.wildPostureRounds ?? barbPostureRoundsLeftRef.current);
      setBarbFuryState(barbFuryRef.current);
      setBarbFrenzyState(barbFrenzyRef.current);
    }
    if (chRef.current.classId === 'clerigo') {
      clerigoFaithRef.current = Number(raw.faith ?? core.classState.resources.faith ?? 0);
      clerigoConsecrationRoundsLeftRef.current = Number(raw.consecration ?? 0);
      setClerigoFaithState(clerigoFaithRef.current);
      setClerigoConsecrationState(clerigoConsecrationRoundsLeftRef.current);
    }
    if (chRef.current.classId === 'cavaleiro') {
      knightDeterminationRef.current = Number(raw.determination ?? 0);
      knightMomentumRef.current = Number(raw.momentum ?? 0);
      knightOrdersRef.current = Number(raw.orders ?? 0);
      setKnightDeterminationState(knightDeterminationRef.current);
      setKnightMomentumState(knightMomentumRef.current);
      setKnightOrdersState(knightOrdersRef.current);
    }
    if (chRef.current.classId === 'mago') {
      mageHeatRef.current = Number(raw.heat ?? 0);
      mageThermalRef.current = String(raw.thermal ?? 'normal') as ThermalState;
      mageCircuitRef.current = Number(raw.mageCircuit ?? 0);
      mageSync();
    }
    if (chRef.current.classId === 'ladino') {
      rogueImagesRef.current = Number(raw.images ?? 0);
      rogueStealthRef.current = Boolean(raw.stealthed);
      rogueAdvantageRef.current = Boolean(raw.advantageReady);
      rogueSync();
    }
    if (chRef.current.classId === 'feiticeiro') {
      sorcererStateRef.current = {
        pulse: Number(raw.pulse ?? 0),
        resonance: Number(raw.resonance ?? 0),
        control: Number(raw.control ?? 0),
      };
      sorcererEnemyRef.current = { ...core.sorcererEnemy };
      sorcererSync();
    }
    if (chRef.current.classId === 'bruxo') {
      warlockStateRef.current = { ...core.warlockPlayer };
      warlockEnemyRef.current = { ...core.warlockEnemy };
      warlockSync();
    }
    if (chRef.current.classId === 'arqueiro') {
      archerStateRef.current = { ...core.archerState, arrows: [...core.archerState.arrows] };
      archerSync();
    }
    if (chRef.current.classId === 'bardo') {
      bardStateRef.current = { ...core.bardState, notes: [...core.bardState.notes] };
      bardSync();
    }
    if (chRef.current.classId === 'necromante') {
      necroSoulsRef.current = Number(raw.souls ?? 0);
      const attacks = Array.isArray(raw.servantAttacks) ? raw.servantAttacks.map(Number).slice(0, necroMaxSummons()) : [];
      necroSummonsRef.current = necroSummonsRef.current.slice(0, attacks.length);
      while (necroSummonsRef.current.length < attacks.length) necroSummonOne(chosen?.id ?? 'necromante:core', attacks[necroSummonsRef.current.length]);
      necroSummonsRef.current = necroSummonsRef.current.map((summon, index) => ({ ...summon, attacksRemaining: attacks[index] ?? summon.attacksRemaining }));
      necroSync();
    }
    if (chRef.current.classId === 'druida') {
      druidCycleRef.current = {
        ...druidCycleRef.current,
        season: String(raw.season ?? druidCycleRef.current.season) as DruidSeason,
        attunement: Number(raw.attunement ?? druidCycleRef.current.attunement),
        form: raw.form && raw.form !== 'none' ? String(raw.form) as DruidForm : null,
      };
      const targetSeeds = Math.max(0, Number(raw.gardenSeeds ?? druidGardenRef.current.length));
      if (targetSeeds < druidGardenRef.current.length) druidGardenRef.current = druidGardenRef.current.slice(0, targetSeeds);
      else if (targetSeeds > druidGardenRef.current.length) {
        const seedsToAdd = targetSeeds - druidGardenRef.current.length;
        druidGardenRef.current = addGardenSeeds(
          druidGardenRef.current,
          druidGardenIdRef.current,
          seedsToAdd,
          hasSkill(chRef.current, 'druida:cura-natural:6') ? 3 : 2,
        );
        druidGardenIdRef.current += seedsToAdd;
      }
      druidSync();
    }
    if (chRef.current.classId === 'paladino') {
      const paladinCore = core.classState as Extract<typeof core.classState, { classId: 'paladino' }>;
      paladinLiturgyRef.current = {
        ...paladinLiturgyRef.current,
        virtues: { ...paladinCore.virtues },
        actionsLeft: paladinCore.liturgy,
        regent: (raw.verdictRegent as PaladinVirtue | null | undefined) ?? paladinLiturgyRef.current.regent,
      };
      paladinAegisRef.current = core.aegis ? {
        sourceAbilityId: chosen?.id ?? paladinAegisRef.current?.sourceAbilityId ?? 'paladino:aegis',
        reductionPct: core.aegis.reductionPct,
        maxHpCapPct: core.aegis.capPct,
        ticksLeft: core.aegis.roundsLeft,
        hitsRemaining: core.aegis.hits,
        maxHits: core.aegis.hits,
        secondHitEfficiency: 0.5,
      } : null;
      paladinSync();
    }
    if (chRef.current.classId === 'cacador') {
      hunterTrapsTriggeredThisEnemyRef.current = Number(raw.trapsTriggered ?? hunterTrapsTriggeredThisEnemyRef.current);
      for (const trap of core.traps) {
        if (hunterTrapsRef.current.some((item) => item.sourceAbilityId === trap.sourceAbilityId)) continue;
        const ability = equippedById.get(trap.sourceAbilityId);
        if (ability) hunterArmTrap(ability);
      }
      syncHunterTraps();
    }
    warriorPreparedGuardRef.current = core.preparedGuard ? { ...core.preparedGuard } : null;
    warriorSyncPlayer();
    if (chRef.current.classId === 'clerigo') {
      clerigoReviveWindowRoundsLeftRef.current = core.reviveWindow;
      if (core.reviveWindow > 0) clerigoReviveHealRef.current = {
        healPct: Number(raw.reviveHealPct ?? 0.4),
        capPct: Number(raw.reviveHealCapPct ?? 0.25),
      };
    }

    const castEvent = chosen ? core.events.find((event) => event.type === 'abilityCast' && event.abilityId === chosen.id) : undefined;
    if (chosen && castEvent) cooldownsRef.current[chosen.id] = Math.max(1, core.cooldowns[chosen.id] ?? chosen.cooldown);
    consumeCombatEvents(core.events, {
      onLog: (line) => pushLog(line),
      onFloat: (side, amount, wasCrit, miss, healEvent) => pushFloat(side, amount, !!wasCrit, undefined, !!miss, !!healEvent),
      onAbilityCast: (side, name) => pushAbilityCast(side, name, side === 'player' && chosen ? activeAbilityIconStyle(chRef.current.classId, chosen.id) : null, null, false),
      onFlash: (side) => flash(side),
    });
    if (core.enemyHp <= 0) { resolveEnemyDeath(); return; }
    if (isRogue()) rogueQuickAct();
    schedulePlayer(nextPlayerDelay());
  }

  // Ladino's "Janela de Iniciativa": right after a Principal resolves, one
  // eligible Ação Rápida (actionType: 'quick') fires immediately in the same
  // turn — it never competes with the Principal for the ATB cycle itself.
  // This was previously entirely unreachable: pickAbility() was only ever
  // called with 'main', so every quick node (Passo Sombrio, Lâmina
  // Envenenada, Passo Cortante, Lâmina Reversa, Finta Baixa, Dado Viciado)
  // could never be selected, and rogueQuickWindowRef never left its initial
  // `false` — so even Finta Baixa/Dado Viciado's own `quickWindow` condition
  // could never pass. The window here is real but narrow: true only for the
  // single eligibility check below, closed again immediately after.
  function rogueQuickAct() {
    if (enemyRef.current.hp <= 0 || chRef.current.hp <= 0) return;
    rogueQuickWindowRef.current = true;
    const quick = firstEligibleQuick(
      equippedAbilities(),
      cooldownsRef.current,
      (ability) => (!hasCC(playerCCRef.current, 'silence') || isSelfAbilityKind(ability.effect.kind)) && conditionMet(ability) && !abilityAlreadyActive(ability),
    );
    rogueQuickWindowRef.current = false;
    if (!quick) return;

    const stats = computePlayerStats();
    const core = createCombatState(chRef.current, { ...enemyRef.current }, Math.floor(Math.random() * 0xFFFFFFFF), [quick.id], [quick.id]);
    const panelBarrierAtCast = playerShieldRef.current;
    core.playerHp = chRef.current.hp;
    core.enemyHp = enemyRef.current.hp;
    core.playerBarrier = playerShieldRef.current;
    core.playerMods = playerModsRef.current.map((mod) => ({ stat: mod.stat, pct: mod.pct, roundsLeft: mod.roundsLeft }));
    core.enemyMods = enemyModsRef.current.map((mod) => ({ stat: mod.stat, pct: mod.pct, roundsLeft: mod.roundsLeft }));
    core.playerStatuses = playerStatusRef.current.map((status) => ({ kind: status.kind, roundsLeft: status.roundsLeft, damagePct: status.dmgPerTick / Math.max(1, stats.matk || stats.atk) }));
    core.enemyStatuses = enemyStatusRef.current.map((status) => ({ kind: status.kind, roundsLeft: status.roundsLeft, damagePct: status.dmgPerTick / Math.max(1, stats.matk || stats.atk) }));
    core.playerCC = playerCCRef.current.map((cc) => ({ kind: cc.kind, roundsLeft: cc.roundsLeft }));
    core.enemyCC = enemyCCRef.current.map((cc) => ({ kind: cc.kind, roundsLeft: cc.roundsLeft }));
    core.hots = playerRegenRef.current.map((hot) => ({ pct: hot.pct, roundsLeft: hot.roundsLeft }));

    const raw = core.classState as unknown as Record<string, unknown>;
    raw.images = rogueImagesRef.current;
    raw.stealthed = rogueStealthRef.current;
    raw.exposed = rogueExposedMainLeftRef.current > 0;
    raw.advantageReady = rogueAdvantageRef.current;
    raw.preparedTrick = roguePreparedTrickRef.current?.kind ?? null;

    resolvePlayerAction(core);

    updateCh({ ...chRef.current, hp: core.playerHp });
    updateEnemy({ ...core.enemy, hp: core.enemyHp });
    playerShieldRef.current = core.playerBarrier;
    if (chRef.current.classId === 'clerigo' && core.playerBarrier > panelBarrierAtCast) clerigoAddBarrierPortion(core.playerBarrier - panelBarrierAtCast);
    syncShield();
    playerModsRef.current = core.playerMods.map((mod) => ({ stat: mod.stat as StatModStat, pct: mod.pct, roundsLeft: mod.roundsLeft, sourceAbilityId: quick.id }));
    enemyModsRef.current = core.enemyMods.map((mod) => ({ stat: mod.stat as StatModStat, pct: mod.pct, roundsLeft: mod.roundsLeft, sourceAbilityId: quick.id }));
    const statusPower = Math.max(1, stats.matk || stats.atk);
    playerStatusRef.current = core.playerStatuses.map((status) => ({ kind: status.kind, roundsLeft: status.roundsLeft, dmgPerTick: Math.max(1, Math.round(status.damagePct * statusPower)) }));
    enemyStatusRef.current = core.enemyStatuses.map((status) => ({ kind: status.kind, roundsLeft: status.roundsLeft, dmgPerTick: Math.max(1, Math.round(status.damagePct * statusPower)) }));
    playerCCRef.current = core.playerCC.map((cc) => ({ ...cc }));
    enemyCCRef.current = core.enemyCC.map((cc) => ({ ...cc }));
    playerRegenRef.current = core.hots.map((hot) => ({ pct: hot.pct, roundsLeft: hot.roundsLeft, sourceAbilityId: quick.id }));
    syncPlayerMods(); syncEnemyMods(); syncPlayerStatuses(); syncEnemyStatuses(); syncPlayerCC(); syncEnemyCC();

    rogueImagesRef.current = Number(raw.images ?? 0);
    rogueStealthRef.current = Boolean(raw.stealthed);
    rogueAdvantageRef.current = Boolean(raw.advantageReady);
    const preparedKind = raw.preparedTrick as RogueTrickKind | null;
    roguePreparedTrickRef.current = preparedKind ? prepareTrick(preparedKind, quick.id) : null;
    rogueSync();

    const castEvent = core.events.find((event) => event.type === 'abilityCast' && event.abilityId === quick.id);
    if (castEvent) cooldownsRef.current[quick.id] = Math.max(1, core.cooldowns[quick.id] ?? quick.cooldown);
    consumeCombatEvents(core.events, {
      onLog: (line) => pushLog(line),
      onFloat: (side, amount, wasCrit, miss, healEvent) => pushFloat(side, amount, !!wasCrit, undefined, !!miss, !!healEvent),
      onAbilityCast: (side, name) => pushAbilityCast(side, name, side === 'player' ? activeAbilityIconStyle(chRef.current.classId, quick.id) : null, null, false),
      onFlash: (side) => flash(side),
    });
    if (core.enemyHp <= 0) resolveEnemyDeath();
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
    const bardOutOfTuneAtAction = isBard() && bardStateRef.current.outOfTune;
    if (bardOutOfTuneAtAction) enemyAccuracy -= 0.10;
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
      bardOnEnemyAction(1, 0);
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
    // A landed direct enemy action consumes at most one Postura Selvagem
    // charge, regardless of block, barrier or multi-impact details.
    const barbPostureHitWindow = barbActive && barbPostureRoundsLeftRef.current > 0;
    if (barbPostureHitWindow) barbPostureRoundsLeftRef.current = consumeWildPostureAction(barbPostureRoundsLeftRef.current, true);
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
    if (isBard() && bardOutOfTuneAtAction) edmg = Math.round(edmg * 0.88);
    if (isBard() && bardStateRef.current.sustain) edmg = Math.round(edmg * 0.92);
    if (isBard() && bardStateRef.current.nextEnemyDamageReductionPct > 0) {
      edmg = Math.round(edmg * (1 - bardStateRef.current.nextEnemyDamageReductionPct));
      bardStateRef.current = { ...bardStateRef.current, nextEnemyDamageReductionPct: 0 };
      bardSync();
    }
    if (isSorcerer() && sorcererEnemyReductionRef.current > 0) {
      edmg = Math.round(edmg * (1 - sorcererEnemyReductionRef.current));
      sorcererEnemyReductionRef.current = 0;
    }
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
    // Espinhos uses the landed direct-action damage after mitigation and
    // defensive modifiers, but before block or any barrier absorption.
    // Keeping this snapshot here also means a fully blocked/shielded hit can
    // still reflect damage, as required by the combat contract.
    const thornsBaseDamage = edmg;
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
      // A direct hit that reaches the defensive pipeline grants +3. A block
      // replaces that base grant with its existing +10/+12 generation.
      knightGainDetermination(determinationForDirectHit({
        landed: true,
        blocked,
        fortressActive: false,
        elevatedBlock: knightHasSkill('cavaleiro:bastiao:2'),
      }));
      const knightBarrierAbsorbed = shieldAbsorbed + knightEscudoReduced;
      if (knightBarrierAbsorbed > 0) {
        knightGainDetermination(determinationForPreventedDamage({
          amountPrevented: knightBarrierAbsorbed,
          effectiveMaxHp: knightEffMaxHp(),
          thresholdPct: DETERMINATION_GEN_BARRIER_THRESHOLD_PCT,
          pointsPerThreshold: DETERMINATION_GEN_BARRIER_PER_3PCT,
          capPoints: DETERMINATION_GEN_BARRIER_CAP_PER_ACTION,
          fortressActive: false,
        }));
      }
      if (knightPostureReduced > 0 && knightIronWallActive()) {
        knightGainDetermination(determinationForPreventedDamage({
          amountPrevented: knightPostureReduced,
          effectiveMaxHp: knightEffMaxHp(),
          thresholdPct: IRON_WALL_DETERMINATION_THRESHOLD_PCT,
          pointsPerThreshold: IRON_WALL_DET_GEN_PER_2PCT,
          capPoints: IRON_WALL_DET_GEN_CAP_PER_ACTION,
          fortressActive: false,
        }));
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
      const redirectPct = barbPostureHitWindow
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

    // Only this landed direct enemy action can trigger Espinhos. DOTs,
    // passive procs, reflection chains and other sources never call this
    // hook. A thorns kill follows the same single death pipeline as every
    // other real enemy HP reduction.
    if (defStats.thornsPct > 0 && thornsBaseDamage > 0) {
      const reflected = thornsDamageForAction([thornsBaseDamage], defStats.thornsPct, enemyRef.current.maxHp);
      if (reflected > 0) {
        applyEnemyHp(Math.max(0, enemyRef.current.hp - reflected));
        pushFloat('enemy', reflected, false);
        if (enemyRef.current.hp <= 0) { resolveEnemyDeath(); return; }
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
    bardOnEnemyAction(1, 1);
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
  const enemySorcerer = sorcererEnemyState;
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
    'feiticeiro:pulse': { value: sorcererState.pulse, maxValue: 6, detail: sorcererState.pulse === 6 ? 'SURTO INATO — próxima habilidade ativa DESPERTA' : undefined, visible: ch.classId === 'feiticeiro' },
    'feiticeiro:surge': { value: sorcererState.pulse === 6 ? 1 : 0, visible: ch.classId === 'feiticeiro' },
    'feiticeiro:awakened': { value: sorcererAwakenedRef.current ? 1 : 0, visible: ch.classId === 'feiticeiro' },
    'feiticeiro:fracture': { value: enemySorcerer.fractures, maxValue: 3, visible: ch.classId === 'feiticeiro' },
    'feiticeiro:resonance': { value: sorcererState.resonance, maxValue: 2, visible: ch.classId === 'feiticeiro' },
    'feiticeiro:control': { value: sorcererState.control, maxValue: 2, visible: ch.classId === 'feiticeiro' },
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
    'bardo:score': { value: bardState.notes.length, maxValue: 3, detail: bardState.notes.map((n) => n === 'marcato' ? 'M' : n === 'dissonant' ? 'D' : 'L').join(' | ') + (bardState.notes.length < 3 ? (bardState.notes.length ? ' | ○' : '○ | ○ | ○') : ''), visible: ch.classId === 'bardo' },
    'bardo:phrase': { value: bardState.notes.length === 3 ? 1 : 0, detail: bardState.notes.length === 3 ? 'PRONTA' : undefined, visible: ch.classId === 'bardo' },
    'bardo:ovation': { value: bardState.ovation, maxValue: 1, detail: bardState.ovation ? '★ PRONTA' : '☆', visible: ch.classId === 'bardo' },
    'bardo:accent': { value: bardState.accent ? 1 : 0, visible: ch.classId === 'bardo' },
    'bardo:fortissimo': { value: bardState.fortissimo ? 1 : 0, visible: ch.classId === 'bardo' },
    'bardo:countertempo': { value: bardState.countertempo ? 1 : 0, visible: ch.classId === 'bardo' },
    'bardo:echo': { value: bardState.echo, maxValue: 2, visible: ch.classId === 'bardo' },
    'bardo:wildcard': { value: 0, visible: ch.classId === 'bardo' },
    'bardo:encore': { value: bardState.encoreReady ? 1 : 0, detail: bardState.encoreReady ? 'PRONTA' : undefined, visible: ch.classId === 'bardo' },
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
    ? clericDirectHealAmount(clerigoBaselineMaxHp(), openCombatAbility.effect.healPct ?? 0, computePlayerStats().healingPowerPct, clerigoHealEfficiencyBonus())
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
