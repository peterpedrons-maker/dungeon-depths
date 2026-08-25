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
import { getEquippedAbilities } from '../lib/skills';
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
  FAITH_MAX, FAITH_MIN, FAITH_START_FIRST_ENEMY, nextFaithForNewEnemy, SIGNIFICANT_HEAL_PCT, SIGNIFICANT_HEAL_PCT_LOWERED,
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
  BarrierPortion,
} from '../lib/clerigo';
import { rollAttack, rollAbilityHit } from '../game/combat';
import { heroSprites, enemySprite, drawSprite } from '../game/sprites';
import { battleBackground } from '../game/battleBackgrounds';
import { Panel } from './Panel';
import { Modal } from './Modal';
import { Button } from './Button';
import { MechanicQuickModal } from './ClassMechanics';
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
  critChance: { buff: iconCritBuff, debuff: iconCritDebuff },
  critDmgMult: { buff: iconCritDmgBuff, debuff: iconCritDmgDebuff },
  accuracy: { buff: iconPrecisaoBuff, debuff: iconPrecisaoDebuff },
  evasion: { buff: iconEvasaoBuff, debuff: iconEvasaoDebuff },
  dmgTakenPct: { buff: iconDanoRecebidoBuff, debuff: iconDanoRecebidoDebuff },
  defPenPct: { buff: iconDefPenBuff, debuff: iconDefPenBuff },
  lifestealPct: { buff: iconRouboVidaBuff, debuff: iconRouboVidaBuff },
  // No dedicated Tenacidade icon exists yet — reuses the Defesa glyph, same
  // "buff-only in practice" treatment as defPenPct/lifestealPct above.
  tenacityPct: { buff: iconDefBuff, debuff: iconDefDebuff },
};
const STAT_MOD_LABEL: Record<StatModStat, string> = {
  atk: 'Ataque', def: 'Defesa', critChance: 'Crítico', critDmgMult: 'Dano Crítico', accuracy: 'Precisão',
  evasion: 'Evasão', dmgTakenPct: 'Dano Recebido', defPenPct: 'Penetração de Defesa', lifestealPct: 'Roubo de Vida',
  tenacityPct: 'Tenacidade',
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
  const clerigoResurrectionTriggeredRef = useRef(false); // once per attempt
  const clerigoJudgmentFaithMilestonesRef = useRef<Set<number>>(new Set()); // per-enemy, see JUDGMENT_FAITH_MILESTONES
  const clerigoJuizoFinalActiveRef = useRef(false); // Juízo Final's own buff can't be renewed while active
  const [clerigoFaithState, setClerigoFaithState] = useState(0);
  const [clerigoGraceState, setClerigoGraceState] = useState(0);
  const [clerigoConsecrationState, setClerigoConsecrationState] = useState(0);

  const heroSpr = heroSprites(ch.classId);

  // onLiveUpdate persists to storage/cloud — skipped mid-catch-up (which can
  // touch chRef hundreds of times in one synchronous pass) in favor of a
  // single call with the final state once runCatchUp finishes.
  function updateCh(next: Character) { chRef.current = next; setCh(next); if (!silentRef.current) onLiveUpdate(next); }
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
      resources: { fury: barbFuryRef.current, faith: clerigoFaithRef.current },
      states: { frenzy: barbFrenzyRef.current, consecration: clerigoConsecrationActive() },
      enemyStacks: { wounds: barbEnemyWoundStacks(), judgment: clerigoEnemyJudgmentStacks() },
      painPct: barbPainTotal() / effectiveMaxHp(chRef.current),
    };
    if (cond.type === 'hpBelow') return ctx.hp / ctx.maxHp < threshold;
    return evalAbilityCondition(cond, ctx);
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
  // Fúria concedida diretamente por uma habilidade (custo/reembolso/ganho
  // explícito no seu próprio effect) — funciona dentro ou fora de Frenesi.
  function barbGainFuryDirect(amount: number) {
    if (!isBarbaro() || amount <= 0) return;
    barbApplyFuryDelta(amount);
  }
  function barbSpendFury(amount: number) {
    if (!isBarbaro()) return;
    barbFuryRef.current = Math.max(FURY_MIN, barbFuryRef.current - amount);
    syncBarbFury();
  }
  function barbSetFury(value: number) { barbApplyFuryDelta(value - barbFuryRef.current); }
  function barbFrenzyDmgBonus(): number {
    return barbHasSkill('barbaro:furia:8') ? FRENZY_DMG_BONUS_SEM_FREIOS : FRENZY_DMG_BONUS;
  }
  // Chamado uma vez ao final de toda ação NÃO incapacitada do Bárbaro (self
  // ou ofensiva, acerto ou erro) — o dreno de Frenesi é sempre o último
  // ajuste de Fúria da rodada, depois de qualquer custo/ganho já aplicado.
  function barbEndOfActionDrain() {
    if (!isBarbaro() || !barbFrenzyRef.current) return;
    const drain = barbHasSkill('barbaro:furia:14') ? FRENZY_DRAIN_PER_ACTION_IMPARAVEL : FRENZY_DRAIN_PER_ACTION;
    const next = Math.max(FURY_MIN, barbFuryRef.current - drain);
    barbFuryRef.current = next;
    syncBarbFury();
    if (next <= 0) {
      barbFrenzyRef.current = false;
      syncBarbFrenzy();
      pushLog('Frenesi termina.');
    }
  }

  function barbEnemyWoundStacks(): number { return enemyRef.current.barbarianWounds?.stacks ?? 0; }
  function barbApplyWounds(n: number) {
    if (n <= 0) return;
    const stacks = Math.min(WOUND_MAX_STACKS, barbEnemyWoundStacks() + n);
    updateEnemy({ ...enemyRef.current, barbarianWounds: { stacks, ticksLeft: WOUND_TICK_DURATION } });
  }
  function barbRenewWounds() {
    const w = enemyRef.current.barbarianWounds;
    if (!w || w.stacks <= 0) return;
    updateEnemy({ ...enemyRef.current, barbarianWounds: { stacks: w.stacks, ticksLeft: WOUND_TICK_DURATION } });
  }
  function barbConsumeWounds() {
    if (!enemyRef.current.barbarianWounds) return;
    updateEnemy({ ...enemyRef.current, barbarianWounds: undefined });
  }
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
    barbPainPacketsRef.current = [...barbPainPacketsRef.current, { amountLeft: amount, perTick: amount / ticks, ticksLeft: ticks }];
    syncBarbPain();
  }
  // Consumes up to maxPct*effMaxHp of Dor, oldest packet first, and returns
  // the amount actually consumed (never more than what existed).
  function barbConsumePain(maxPct: number): number {
    let remaining = maxPct * barbEffMaxHp();
    let consumed = 0;
    const kept: PainPacket[] = [];
    for (const p of barbPainPacketsRef.current) {
      if (remaining <= 0) { kept.push(p); continue; }
      const take = Math.min(p.amountLeft, remaining);
      remaining -= take;
      consumed += take;
      const left = p.amountLeft - take;
      if (left > 0.01) kept.push({ amountLeft: left, perTick: left / p.ticksLeft, ticksLeft: p.ticksLeft });
    }
    barbPainPacketsRef.current = kept;
    syncBarbPain();
    return consumed;
  }
  // Called once per envTick — Dor CAN kill the player (same "morte por
  // efeito indireto" requirement as Feridas above), routed through
  // resolvePlayerDeath.
  function barbTickPain() {
    if (barbPainPacketsRef.current.length === 0) return;
    const lowHp = barbHasSkill('barbaro:resistencia:14') && chRef.current.hp / barbEffMaxHp() < PAIN_TICK_REDUCTION_LOW_HP_THRESHOLD;
    let totalPay = 0;
    const kept: PainPacket[] = [];
    for (const p of barbPainPacketsRef.current) {
      const pay = Math.min(p.perTick, p.amountLeft);
      totalPay += pay;
      const amountLeft = p.amountLeft - pay;
      const ticksLeft = p.ticksLeft - 1;
      if (amountLeft > 0.01 && ticksLeft > 0) kept.push({ amountLeft, perTick: p.perTick, ticksLeft });
    }
    barbPainPacketsRef.current = kept;
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
  // Same baseline used by every class's heal formula (see resolveSelfAbility's
  // 'heal' branch) — class/level curve, deliberately not the gear-inflated
  // EffectiveMaxHp, so VIT+gear+heal% can't compound into near-immortality.
  function clerigoBaselineMaxHp(): number { return CLASSES[chRef.current.classId].baseHp + 6 * (chRef.current.level - 1); }
  function clerigoEffMaxHp(): number { return effectiveMaxHp(chRef.current); }

  function clerigoGainFaith(amount: number) {
    if (!isClerigo() || amount <= 0) return;
    clerigoFaithRef.current = Math.min(FAITH_MAX, clerigoFaithRef.current + amount);
    syncClerigoFaith();
  }
  function clerigoSpendFaith(amount: number) {
    if (!isClerigo()) return;
    clerigoFaithRef.current = Math.max(FAITH_MIN, clerigoFaithRef.current - amount);
    syncClerigoFaith();
  }
  // Mãos Consagradas (clerigo:devocao:3) lowers the "Cura Significativa"
  // threshold that generates Fé from 8% to 7% of BaselineMaxHp.
  function clerigoSignificantHealThresholdPct(): number {
    return clerigoHasSkill('clerigo:devocao:3') ? SIGNIFICANT_HEAL_PCT_LOWERED : SIGNIFICANT_HEAL_PCT;
  }
  // Heal-efficiency bonuses stacked on top of the shared BaselineMaxHp*
  // healPct*supportMult formula — Mãos Consagradas is unconditional, Sabedoria
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
  // Removes the single most severe negative effect on the player (CC, then
  // DOT, then a negative stat mod) — used by Milagre's extraEffects entry.
  // Returns whether anything was actually removed.
  function clerigoCleanseOne(): boolean {
    if (playerCCRef.current.length > 0) {
      playerCCRef.current = playerCCRef.current.slice(1);
      syncPlayerCC();
      return true;
    }
    if (playerStatusRef.current.length > 0) {
      playerStatusRef.current = playerStatusRef.current.slice(1);
      syncPlayerStatuses();
      return true;
    }
    const negIdx = playerModsRef.current.findIndex((m) => m.pct < 0);
    if (negIdx >= 0) {
      playerModsRef.current = playerModsRef.current.filter((_, i) => i !== negIdx);
      syncPlayerMods();
      return true;
    }
    return false;
  }

  // ── GRAÇA ──
  function clerigoGraceCapPct(): number {
    const base = clerigoHasSkill('clerigo:devocao:14') ? GRACE_DIVINA_CAP_PCT : GRACE_BASE_CAP_PCT;
    const folego = clerigoHasSkill('clerigo:devocao:2')
      ? capped(GRACE_FOLEGO_VIT_RATE, attrTotal(chRef.current, 'vit'), GRACE_FOLEGO_VIT_CAP)
      : 0;
    return base + folego;
  }
  function clerigoGraceConversionPct(): number {
    const base = clerigoHasSkill('clerigo:devocao:14') ? GRACE_DIVINA_CONVERSION_PCT : GRACE_BASE_CONVERSION_PCT;
    const coracaoDevoto = clerigoHasSkill('clerigo:devocao:11') && chRef.current.hp / clerigoEffMaxHp() < GRACE_CORACAO_DEVOTO_HP_THRESHOLD
      ? GRACE_CORACAO_DEVOTO_BONUS_PCT : 0;
    return base + coracaoDevoto;
  }
  function clerigoGraceDurationTicks(): number {
    return clerigoHasSkill('clerigo:devocao:14') ? GRACE_DIVINA_DURATION_TICKS : GRACE_BASE_DURATION_TICKS;
  }
  // Overheal from a heal ABILITY (never regen/lifesteal/passive cura) turns
  // into Graça once Graça Transbordante (clerigo:devocao:6) is unlocked —
  // adds up to the cap and renews duration, never generates Fé itself.
  function clerigoAddOverhealAsGrace(rawOverheal: number) {
    if (!isClerigo() || !clerigoHasSkill('clerigo:devocao:6') || rawOverheal <= 0) return;
    const converted = rawOverheal * clerigoGraceConversionPct();
    const capAmount = clerigoGraceCapPct() * clerigoEffMaxHp();
    const nextAmount = Math.min(capAmount, clerigoGraceRef.current.amount + converted);
    clerigoGraceRef.current = { amount: nextAmount, ticksLeft: clerigoGraceDurationTicks() };
    syncClerigoGrace();
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

  // ── BARREIRAS NORMAIS (não Graça) ──
  // Barreira Ritual (clerigo:retidao:3) — +4% de eficiência multiplicativa
  // em barreiras normais (nunca em Graça). Aplicado no ponto de criação.
  function clerigoBarrierEfficiencyMult(): number {
    return clerigoHasSkill('clerigo:retidao:3') ? 1 + BARREIRA_RITUAL_EFFICIENCY_BONUS : 1;
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
          const healAmt = Math.round(clerigoBaselineMaxHp() * INTERCESSAO_HEAL_PCT * (1 + computePlayerStats().supportPowerPct));
          if (healAmt > 0) {
            updateCh({ ...chRef.current, hp: Math.min(clerigoEffMaxHp(), chRef.current.hp + healAmt) });
            pushFloat('player', healAmt, false, undefined, undefined, true);
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
  function clerigoStartConsecration(baseRounds: number) {
    if (!isClerigo()) return;
    clerigoConsecrationRoundsLeftRef.current = Math.min(clerigoConsecrationCeiling(), baseRounds + (clerigoHasSkill('clerigo:retidao:14') ? SANTUARIO_VIVO_MAX_ROUNDS_BONUS : 0));
    clerigoConsecrationFlagsRef.current = { soloConsagrado: false, feVigilante: false, vigilia: false, santuarioVivo: false };
    syncClerigoConsecration();
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
  function clerigoJudgmentDurationTicks(): number {
    return clerigoHasSkill('clerigo:provacao:5') ? JUDGMENT_CONVICCAO_DURATION_TICKS : JUDGMENT_BASE_DURATION_TICKS;
  }
  // Aplica N stacks (renovando a duração de TODOS) e dispara os marcos de Fé
  // de 3/5 — cada um só uma vez por inimigo (ver clerigoJudgmentFaithMilestonesRef).
  function clerigoApplyJudgment(n: number) {
    if (n <= 0) return;
    const stacks = Math.min(JUDGMENT_MAX_STACKS, clerigoEnemyJudgmentStacks() + n);
    updateEnemy({ ...enemyRef.current, judgment: { stacks, ticksLeft: clerigoJudgmentDurationTicks() } });
    for (const milestone of JUDGMENT_FAITH_MILESTONES) {
      if (stacks >= milestone && !clerigoJudgmentFaithMilestonesRef.current.has(milestone)) {
        clerigoJudgmentFaithMilestonesRef.current.add(milestone);
        clerigoGainFaith(1);
      }
    }
  }
  function clerigoRenewJudgmentDuration() {
    const w = enemyRef.current.judgment;
    if (!w || w.stacks <= 0) return;
    updateEnemy({ ...enemyRef.current, judgment: { stacks: w.stacks, ticksLeft: clerigoJudgmentDurationTicks() } });
  }
  // Consome até N stacks atuais, retornando quantos foram realmente consumidos.
  function clerigoConsumeJudgment(maxN: number): number {
    const w = enemyRef.current.judgment;
    if (!w || w.stacks <= 0 || maxN <= 0) return 0;
    const consumed = Math.min(w.stacks, maxN);
    const stacks = w.stacks - consumed;
    updateEnemy({ ...enemyRef.current, judgment: stacks > 0 ? { stacks, ticksLeft: w.ticksLeft } : undefined });
    return consumed;
  }
  function clerigoReduceJudgmentDuration(ticks: number) {
    const w = enemyRef.current.judgment;
    if (!w || w.stacks <= 0) return;
    updateEnemy({ ...enemyRef.current, judgment: { stacks: w.stacks, ticksLeft: Math.max(1, w.ticksLeft - ticks) } });
  }
  function clerigoTickJudgment() {
    const w = enemyRef.current.judgment;
    if (!w || w.stacks <= 0) return;
    const ticksLeft = w.ticksLeft - 1;
    updateEnemy({ ...enemyRef.current, judgment: ticksLeft > 0 ? { stacks: w.stacks, ticksLeft } : undefined });
  }

  // ── RESSURREIÇÃO MENOR (prevenção de morte) ──
  function clerigoOpenReviveWindow(rounds: number) { clerigoReviveWindowRoundsLeftRef.current = rounds; }
  // Chamado do início de resolvePlayerDeath, antes de qualquer resolução
  // definitiva — se a janela estiver aberta e ainda não tiver sido usada
  // nesta tentativa, consome-a e restaura HP em vez de finalizar a morte.
  function clerigoCheckDeathPrevention(): boolean {
    if (!isClerigo() || clerigoReviveWindowRoundsLeftRef.current <= 0 || clerigoResurrectionTriggeredRef.current) return false;
    clerigoResurrectionTriggeredRef.current = true;
    clerigoReviveWindowRoundsLeftRef.current = 0;
    const maxHp = clerigoEffMaxHp();
    const supportMult = 1 + computePlayerStats().supportPowerPct;
    const raw = clerigoBaselineMaxHp() * 0.18 * supportMult;
    const healed = Math.min(maxHp, Math.round(Math.min(raw, maxHp * 0.20)));
    playerStatusRef.current = [];
    syncPlayerStatuses();
    updateCh({ ...chRef.current, hp: Math.max(1, healed) });
    pushLog([{ text: 'Ressurreição Menor evita sua morte!', color: '#c9a86a' }]);
    pushFloat('player', Math.max(1, healed), false, undefined, undefined, true);
    return true;
  }
  // Prece Serena/Liturgia Contínua — CDR extra SOMENTE em habilidades de
  // Devoção (checado pelo prefixo do id, nunca pelo nome).
  function clerigoCdrBonusFor(abilityId: string): number {
    if (!isClerigo() || !isDevotionAbilityId(abilityId)) return 0;
    let bonus = 0;
    if (clerigoHasSkill('clerigo:devocao:1')) bonus += PRECE_SERENA_CDR_PCT;
    if (clerigoHasSkill('clerigo:devocao:7')) {
      bonus += clerigoFaithRef.current >= LITURGIA_CONTINUA_FAITH_THRESHOLD ? LITURGIA_CONTINUA_CDR_BOOSTED_PCT : LITURGIA_CONTINUA_CDR_PCT;
    }
    return bonus;
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

    return {
      ...base,
      atk: Math.round(base.atk * (1 + atkPct)),
      matk: Math.round(base.matk * (1 + atkPct)),
      def: Math.max(0, Math.round(base.def * defMult * clerigoDefBonusMult)),
      mdef: Math.max(0, Math.round(base.mdef * defMult * clerigoMdefBonusMult)),
      critChance: Math.min(0.9, Math.max(0, base.critChance + critAdd)),
      critDmgMult: base.critDmgMult + critDmgAdd + critDmgBonus,
      blockChance: Math.min(0.6, Math.max(0, base.blockChance + blockAdd)),
      evasion: Math.max(0, base.evasion + getModTotal(playerModsRef.current, 'evasion')),
      accuracy: base.accuracy + getModTotal(playerModsRef.current, 'accuracy'),
      dmgTakenPct: getModTotal(playerModsRef.current, 'dmgTakenPct'),
      defPenPct: Math.max(0, getModTotal(playerModsRef.current, 'defPenPct')),
      lifestealPct: Math.max(0, base.lifestealPct + getModTotal(playerModsRef.current, 'lifestealPct')),
      tenacityPct: base.tenacityPct + tenacityBonus,
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
  function computeEnemyEvasion(): number {
    return Math.max(0, (enemyRef.current.evasion ?? 0) + getModTotal(enemyModsRef.current, 'evasion'));
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
    return false;
  }

  // The single ability (of any kind — self or offense) the priority list
  // picks for this round's one action, if any is off cooldown, its condition
  // is met, and it isn't already active on the player — otherwise the round
  // falls back to a plain attack. Silence only blocks offense-kind picks;
  // self-targeted support abilities still work while silenced.
  function pickAbility(): AbilityDef | null {
    const silenced = hasCC(playerCCRef.current, 'silence');
    for (const ab of equippedAbilities()) {
      if (silenced && !SELF_ABILITY_KINDS.includes(ab.effect.kind)) continue;
      if ((cooldownsRef.current[ab.id] ?? 0) > 0) continue;
      if (!conditionMet(ab)) continue;
      if (abilityAlreadyActive(ab)) continue;
      return ab;
    }
    return null;
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

  // Resolves a self-targeted ability as the round's whole action — it
  // replaces the attack entirely rather than riding along with it. Heal
  // magnitude is based on the class's baseline HP curve at the caster's
  // level (not their live, gear/attribute-inflated max HP), so stacking
  // VIT/maxHpFlat/gear can't turn a % heal into a source of near-immortality
  // — cooldown stays the one knob that actually balances how much a build
  // can out-heal incoming damage. Heal/buff magnitudes still scale with
  // supportPowerPct (WIS), same as before.
  function resolveSelfAbility(ab: AbilityDef, stats: ReturnType<typeof computePlayerStats>): string | null {
    const supportMult = 1 + stats.supportPowerPct;
    const eff = ab.effect;
    const icon = activeAbilityIconStyle(chRef.current.classId, ab.id);
    if (eff.kind === 'heal') {
      if (eff.faithCost) clerigoSpendFaith(eff.faithCost);
      const c = chRef.current;
      const baselineMaxHp = CLASSES[c.classId].baseHp + 6 * (c.level - 1);
      const maxHp = effectiveMaxHp(c);
      const prevHp = c.hp;
      // Clérigo: Mãos Consagradas (flat)/Sabedoria Compassiva (HP<40%)/Véu da
      // Alma (DOT/debuff/silêncio ativo) stack as heal-efficiency bonuses on
      // top of the shared BaselineMaxHp*healPct*supportMult formula — inert
      // (0) for every other class.
      const efficiencyBonus = clerigoHealEfficiencyBonus();
      const rawHeal = Math.round(baselineMaxHp * (eff.healPct ?? 0.2) * supportMult * (1 + efficiencyBonus));
      const healed = Math.min(maxHp, c.hp + rawHeal);
      updateCh({ ...c, hp: healed });
      const healedAmount = healed - prevHp;
      const overheal = Math.max(0, rawHeal - healedAmount);
      pushFloat('player', healedAmount, false, undefined, undefined, true);
      pushAbilityCast('player', ab.name, icon, healedAmount, true);
      // "Cura Significativa" — a Fé-generating heal ability that actually
      // restored enough of BaselineMaxHp (Mãos Consagradas lowers the bar).
      if (eff.faithGainOnHeal && healedAmount / baselineMaxHp >= clerigoSignificantHealThresholdPct()) {
        clerigoGainFaith(1);
        // Misericórdia Ativa (clerigo:devocao:8) — shaves 1 tick off your
        // own first active DOT whenever a heal like this generates Fé.
        if (clerigoHasSkill('clerigo:devocao:8') && playerStatusRef.current.length > 0) {
          playerStatusRef.current = playerStatusRef.current
            .map((s, i) => (i === 0 ? { ...s, roundsLeft: s.roundsLeft - MISERICORDIA_ATIVA_DOT_REDUCTION_TICKS } : s))
            .filter((s) => s.roundsLeft > 0);
          syncPlayerStatuses();
        }
      }
      // Graça Transbordante — overheal from THIS heal (never regen/lifesteal/
      // passive cura) converts into Graça once unlocked; no-op otherwise.
      clerigoAddOverhealAsGrace(overheal);
      let extraLine = '';
      if (ab.extraEffects) {
        for (const ex of ab.extraEffects) {
          if (ex.kind === 'cleanseOne' && clerigoCleanseOne()) extraLine = ' Um efeito negativo é removido.';
        }
      }
      return `${ab.name}: você recupera ${healedAmount} de vida.${extraLine}`;
    } else if (eff.kind === 'buffDef') {
      playerBuffsRef.current.push({ kind: 'def', pct: (eff.buffPct ?? 0.2) * supportMult, roundsLeft: eff.buffRounds ?? 3, sourceAbilityId: ab.id });
      pushAbilityCast('player', ab.name, icon, null, false);
      return `${ab.name}: sua defesa aumenta.`;
    } else if (eff.kind === 'buffBlock') {
      playerBuffsRef.current.push({ kind: 'block', pct: (eff.buffPct ?? 0.2) * supportMult, roundsLeft: eff.buffRounds ?? 3, sourceAbilityId: ab.id });
      pushAbilityCast('player', ab.name, icon, null, false);
      return `${ab.name}: sua chance de bloqueio aumenta.`;
    } else if (eff.kind === 'shield') {
      if (eff.faithCost) clerigoSpendFaith(eff.faithCost);
      // Barreira Ritual (+4% multiplicativo) only ever applies to a NORMAL
      // barrier like this one, never to Graça — clerigoBarrierEfficiencyMult
      // returns 1 for every other class/without the talent.
      const amount = Math.round(effectiveMaxHp(chRef.current) * (eff.shieldPct ?? 0.25) * supportMult * clerigoBarrierEfficiencyMult());
      playerShieldRef.current += amount;
      clerigoAddBarrierPortion(amount);
      syncShield();
      if (eff.consecrationRoundsOnCast) clerigoStartConsecration(eff.consecrationRoundsOnCast);
      pushAbilityCast('player', ab.name, icon, null, false);
      return `${ab.name}: um escudo absorve ${amount} de dano.`;
    } else if (eff.kind === 'regen') {
      if (eff.faithCost) clerigoSpendFaith(eff.faithCost);
      playerRegenRef.current.push({ pct: (eff.regenPct ?? 0.08) * supportMult, roundsLeft: eff.regenRounds ?? 4, sourceAbilityId: ab.id });
      pushAbilityCast('player', ab.name, icon, null, false);
      return `${ab.name}: você começa a regenerar vida.`;
    } else if (eff.kind === 'immunity') {
      playerImmuneRoundsRef.current = Math.max(playerImmuneRoundsRef.current, eff.immunityRounds ?? 3);
      pushAbilityCast('player', ab.name, icon, null, false);
      return `${ab.name}: você fica imune a novos efeitos negativos.`;
    } else if (eff.kind === 'haste') {
      playerHasteRoundsRef.current = Math.max(playerHasteRoundsRef.current, eff.hasteRounds ?? 4);
      pushAbilityCast('player', ab.name, icon, null, false);
      return `${ab.name}: suas habilidades recarregam mais rápido.`;
    } else if (eff.kind === 'berserk') {
      playerModsRef.current.push({ stat: 'atk', pct: eff.berserkAtkPct ?? 0.3, roundsLeft: eff.berserkRounds ?? 4, sourceAbilityId: ab.id });
      playerModsRef.current.push({ stat: 'def', pct: eff.berserkDefPct ?? -0.2, roundsLeft: eff.berserkRounds ?? 4, sourceAbilityId: ab.id });
      syncPlayerMods();
      pushAbilityCast('player', ab.name, icon, null, false);
      return `${ab.name}: fúria berserker — mais dano, menos defesa.`;
    } else if (eff.kind === 'taunt') {
      // Provoca o inimigo — hoje é só a redução de dano recebido (útil já
      // em 1v1); a parte de "forçar o alvo" fica pronta para quando um
      // sistema de múltiplos inimigos/coop existir.
      playerModsRef.current.push({ stat: 'dmgTakenPct', pct: eff.buffPct ?? -0.20, roundsLeft: eff.buffRounds ?? 4, sourceAbilityId: ab.id });
      syncPlayerMods();
      pushAbilityCast('player', ab.name, icon, null, false);
      return `${ab.name}: você provoca o inimigo, reduzindo o dano recebido.`;
    } else if (eff.kind === 'dispel') {
      const removedCount = playerModsRef.current.filter((m) => m.pct < 0).length + playerStatusRef.current.length + playerCCRef.current.length;
      playerModsRef.current = playerModsRef.current.filter((m) => m.pct >= 0);
      playerStatusRef.current = [];
      playerCCRef.current = [];
      syncPlayerStatuses();
      syncPlayerCC();
      syncPlayerMods();
      pushAbilityCast('player', ab.name, icon, null, false);
      // Purificação Divina (clerigo:provacao:9) — Fé if it actually removed
      // something, and converts every 2 effects removed into Julgamento
      // (capped) — no-op (removedCount stays consistent) for every other
      // dispel-kind ability in the game.
      if (eff.cleanseFaithGain && removedCount > 0) clerigoGainFaith(1);
      if (eff.cleanseJudgmentPer2 && removedCount > 0) {
        const stacks = Math.min(PURIFICACAO_DIVINA_JUDGMENT_CAP, Math.floor(removedCount / 2) * PURIFICACAO_DIVINA_JUDGMENT_PER_2_CLEANSED);
        if (stacks > 0) clerigoApplyJudgment(stacks);
      }
      return `${ab.name}: você remove os efeitos negativos.`;
    } else if (eff.kind === 'cleanseOne') {
      const removed = clerigoCleanseOne();
      pushAbilityCast('player', ab.name, icon, null, false);
      return removed ? `${ab.name}: um efeito negativo é removido.` : `${ab.name}: não havia efeito negativo para remover.`;
    } else if (eff.kind === 'consecrationGuard') {
      // Voto de Proteção (clerigo:retidao:10) — creates/renews Consagração
      // and a temporary damage-reduction + Tenacidade buff, SAB-scaled up
      // to the cap.
      if (eff.faithCost) clerigoSpendFaith(eff.faithCost);
      if (eff.consecrationRoundsOnCast) clerigoStartConsecration(eff.consecrationRoundsOnCast);
      const reductionPct = Math.min(VOTO_PROTECAO_DMG_REDUCTION_CAP_PCT, VOTO_PROTECAO_BASE_DMG_REDUCTION_PCT * supportMult);
      playerModsRef.current.push({ stat: 'dmgTakenPct', pct: -reductionPct, roundsLeft: eff.buffRounds ?? 3, sourceAbilityId: ab.id });
      playerModsRef.current.push({ stat: 'tenacityPct', pct: VOTO_PROTECAO_TENACITY_BONUS_PCT, roundsLeft: eff.buffRounds ?? 3, sourceAbilityId: ab.id });
      syncPlayerMods();
      pushAbilityCast('player', ab.name, icon, null, false);
      return `${ab.name}: Consagração se firma, e o dano recebido cai.`;
    } else if (eff.kind === 'divineWall') {
      // Muralha Divina (clerigo:retidao:13) — the biggest single barrier in
      // the kit, tracked as its own barrier-portion (isWallBonus) so the
      // -10% dmg-taken reduction can gate on THIS specific portion still
      // having HP, not the shared pool as a whole.
      if (eff.faithCost) clerigoSpendFaith(eff.faithCost);
      const amount = Math.round(Math.min(MURALHA_DIVINA_SHIELD_CAP_PCT, (eff.shieldPct ?? 0.12) * supportMult) * clerigoEffMaxHp() * clerigoBarrierEfficiencyMult());
      playerShieldRef.current += amount;
      clerigoAddBarrierPortion(amount, { isWallBonus: true });
      syncShield();
      if (eff.consecrationRoundsOnCast) clerigoStartConsecration(eff.consecrationRoundsOnCast);
      pushAbilityCast('player', ab.name, icon, null, false);
      return `${ab.name}: uma grande barreira surge, reduzindo o dano recebido enquanto durar.`;
    } else if (eff.kind === 'reviveWindow') {
      // Ressurreição Menor (clerigo:devocao:13) — opens a short window
      // checked by clerigoCheckDeathPrevention() inside resolvePlayerDeath,
      // at most once per attempt.
      if (eff.faithCost) clerigoSpendFaith(eff.faithCost);
      clerigoOpenReviveWindow(eff.reviveWindowRounds ?? 3);
      pushAbilityCast('player', ab.name, icon, null, false);
      return `${ab.name}: por alguns instantes, sua morte será evitada.`;
    } else if (eff.kind === 'lifestealBuff') {
      playerModsRef.current.push({ stat: 'lifestealPct', pct: (eff.buffPct ?? 0.2) * supportMult, roundsLeft: eff.buffRounds ?? 3, sourceAbilityId: ab.id });
      syncPlayerMods();
      pushAbilityCast('player', ab.name, icon, null, false);
      return `${ab.name}: você começa a roubar vida do inimigo.`;
    } else if (eff.kind === 'atkBuff') {
      playerModsRef.current.push({ stat: 'atk', pct: (eff.buffPct ?? 0.2) * supportMult, roundsLeft: eff.buffRounds ?? 3, sourceAbilityId: ab.id });
      syncPlayerMods();
      pushAbilityCast('player', ab.name, icon, null, false);
      return `${ab.name}: seu ataque aumenta.`;
    } else if (eff.kind === 'furyBoost') {
      // Bárbaro (Grito de Guerra) — flat Fúria grant, no supportMult (that
      // scales heal/buff MAGNITUDE, not a resource grant); may itself push
      // Fúria to 100 and trigger Frenesi, per barbApplyFuryDelta.
      barbGainFuryDirect(eff.furyGainFlat ?? 0);
      pushAbilityCast('player', ab.name, icon, null, false);
      return `${ab.name}: você ganha ${eff.furyGainFlat ?? 0} de Fúria.`;
    } else if (eff.kind === 'furyMaxFrenzy') {
      // Bárbaro (Fúria Berserker, furia tree) — emergency Frenesi entry.
      barbSetFury(FURY_MAX);
      pushAbilityCast('player', ab.name, icon, null, false);
      return `${ab.name}: sua Fúria dispara ao máximo — Frenesi!`;
    } else if (eff.kind === 'painGuard') {
      // Bárbaro (Postura Selvagem) — opens the temporary 35%-total redirect
      // window read by enemyAct; see barbPostureRoundsLeftRef.
      barbPostureRoundsLeftRef.current = eff.buffRounds ?? 3;
      pushAbilityCast('player', ab.name, icon, null, false);
      return `${ab.name}: parte do dano recebido agora vira Dor.`;
    } else if (eff.kind === 'wallStance') {
      // Bárbaro (Muralha Selvagem) — dmgTakenPct debuff via the existing
      // generic StatModStat channel, plus a Fúria-per-hit-taken window
      // tracked separately (no existing channel fits "gain a resource each
      // time you're hit"). Base -15%, VIT-scaled up to -19% total.
      const wallPct = MURALHA_BASE_DMG_TAKEN_PCT - capped(MURALHA_VIT_RATE, attrTotal(chRef.current, 'vit'), MURALHA_VIT_CAP);
      playerModsRef.current.push({ stat: 'dmgTakenPct', pct: wallPct, roundsLeft: eff.buffRounds ?? 4, sourceAbilityId: ab.id });
      syncPlayerMods();
      barbWallRoundsLeftRef.current = eff.buffRounds ?? 4;
      barbWallFuryPerHitRef.current = eff.furyPerHitTaken ?? FURY_GAIN_WALL_HIT_TAKEN;
      pushAbilityCast('player', ab.name, icon, null, false);
      return `${ab.name}: você se firma para o impacto.`;
    } else if (eff.kind === 'lastStand') {
      // Bárbaro (Resistência Absoluta) — cleanse (same filter dispel uses)
      // + consume Dor + Fúria grant + temporary damage reduction, via
      // AbilityDef.extraEffects-style composition kept inline here since
      // it's a single bespoke bundle, not a combination other abilities
      // reuse piecemeal.
      playerStatusRef.current = [];
      playerCCRef.current = [];
      playerModsRef.current = playerModsRef.current.filter((m) => m.pct >= 0);
      syncPlayerStatuses();
      syncPlayerCC();
      // Base 12% of max HP in Dor cleared, VIT-scaled up to 16% total.
      const absolutaPct = RESISTENCIA_ABSOLUTA_BASE_PCT + capped(RESISTENCIA_ABSOLUTA_VIT_RATE, attrTotal(chRef.current, 'vit'), RESISTENCIA_ABSOLUTA_VIT_CAP);
      const consumed = barbConsumePain(absolutaPct);
      barbGainFuryDirect(eff.furyGainFlat ?? 0);
      playerModsRef.current.push({ stat: 'dmgTakenPct', pct: eff.buffPct ?? -0.20, roundsLeft: eff.buffRounds ?? 2, sourceAbilityId: ab.id });
      syncPlayerMods();
      pushAbilityCast('player', ab.name, icon, null, false);
      return `${ab.name}: você se recompõe, apagando ${Math.round(consumed)} de Dor.`;
    } else if (eff.kind === 'bloodFeast') {
      // Bárbaro (Fome Sanguinária) — consume Dor + temporary lifesteal
      // (reuses the existing lifestealPct StatModStat channel) + Fúria.
      // Base 8% of max HP in Dor cleared, VIT-scaled up to 11% total.
      const feastPct = FOME_SANGUINARIA_BASE_PCT + capped(FOME_SANGUINARIA_VIT_RATE, attrTotal(chRef.current, 'vit'), FOME_SANGUINARIA_VIT_CAP);
      const consumed = barbConsumePain(feastPct);
      playerModsRef.current.push({ stat: 'lifestealPct', pct: eff.buffPct ?? 0.15, roundsLeft: eff.buffRounds ?? 3, sourceAbilityId: ab.id });
      syncPlayerMods();
      barbGainFuryDirect(eff.furyGainFlat ?? 0);
      pushAbilityCast('player', ab.name, icon, null, false);
      return `${ab.name}: você se alimenta da própria dor, apagando ${Math.round(consumed)} de Dor.`;
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
    if (isBarbaro()) barbTickWounds();
    tickStatus(playerStatusRef, chRef.current.hp, (hp) => updateCh({ ...chRef.current, hp }), 'player');
    syncPlayerStatuses();
    if (isBarbaro()) {
      barbTickPain();
      if (barbPostureRoundsLeftRef.current > 0) barbPostureRoundsLeftRef.current -= 1;
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
      updateEnemy(next);
      enemyGenRef.current += 1; // invalidates the old enemy's still-pending action timer, see scheduleEnemy()
      if (next.isElite) pushLog([{ text: `${next.name} bloqueia seu caminho — parece bem mais forte que o normal!`, color: '#f59e0b' }]);
      enemyStatusRef.current = [];
      enemyModsRef.current = [];
      enemyCCRef.current = [];
      enemyAbilityCooldownsRef.current = {};
      bossPhaseIndexRef.current = 0;
      setBossPhaseName(null);
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

    // A kill just landed and the enemy is mid-respawn (see the 900ms
    // setTimeout below) — nothing to swing at yet, just wait our turn out.
    if (enemyRef.current.hp <= 0) { schedulePlayer(nextPlayerDelay()); return; }

    const playerStunned = hasCC(playerCCRef.current, 'stun') || hasCC(playerCCRef.current, 'sleep');
    const enemyStunned = hasCC(enemyCCRef.current, 'stun') || hasCC(enemyCCRef.current, 'sleep');
    const barbActive = isBarbaro();
    // Captured once, before this action can consume/renew Feridas itself —
    // Fúria Total/Aniquilação's dmgMultPerWoundStack, Cheiro de Sangue's
    // crit bonus and Predador Supremo's +8%/+3 Fúria all read the stack
    // count as it stood at the START of the action, not after their own
    // consumeWoundsOnHit clears it.
    const woundsAtActionStart = barbActive ? barbEnemyWoundStacks() : 0;
    const clerigoActive = isClerigo();
    // Same "snapshot before this action can itself consume/renew the stack"
    // discipline as woundsAtActionStart above — Peso do Veredito/Fogo da
    // Fé/Olhar do Juiz/Veredito Preciso all read Julgamento as it stood at
    // the START of the action, not after a consuming ability (Sentença
    // Final/Apocalipse Sagrado) clears it mid-resolution.
    const judgmentAtActionStart = clerigoActive ? clerigoEnemyJudgmentStacks() : 0;

    {
      const stats = computePlayerStats();
      let dmg = 0, crit = false, abilityTag = '', statusLine = '', missed = false, playerHitMagical = false;
      let castAbility: AbilityDef | null = null;

      if (playerStunned) {
        pushLog('Você está incapacitado e não consegue atacar!');
      } else {
        // One action per round, full stop — support abilities (heal, buff,
        // dispel...) now compete on equal footing with offense abilities and
        // the plain attack for the single pick, instead of firing for free
        // alongside whatever else happened. Using a heal costs you the
        // round's damage, exactly like choosing to use any other ability.
        const chosen = pickAbility();
        if (chosen && SELF_ABILITY_KINDS.includes(chosen.effect.kind)) {
          cooldownsRef.current[chosen.id] = applyCd(chosen.cooldown, stats.cooldownReductionPct + clerigoCdrBonusFor(chosen.id));
          const line = resolveSelfAbility(chosen, stats);
          if (line) pushLog(line);
        } else {
          const offenseAbility = chosen;
          // Bárbaro: a Fúria-costed ability spends its cost and locks its
          // cooldown the instant it's CHOSEN — before the hit roll — so
          // missing still pays the cost and starts the cooldown (redesign
          // spec section 12). Only Bárbaro abilities ever carry furyCost,
          // so every other class's timing is completely unaffected.
          if (offenseAbility && offenseAbility.effect.furyCost !== undefined) {
            barbSpendFury(offenseAbility.effect.furyCost);
            cooldownsRef.current[offenseAbility.id] = applyCd(offenseAbility.cooldown, stats.cooldownReductionPct);
          }
          // Clérigo: same timing as Fúria above — a Fé-costed offense
          // ability (Martelo da Fé/Sentença Final/Ira Consumidora/Apocalipse
          // Sagrado) pays its cost and starts its cooldown the instant it's
          // chosen, never refunded on a miss.
          if (offenseAbility && offenseAbility.effect.faithCost !== undefined) {
            clerigoSpendFaith(offenseAbility.effect.faithCost);
            cooldownsRef.current[offenseAbility.id] = applyCd(offenseAbility.cooldown, stats.cooldownReductionPct + clerigoCdrBonusFor(offenseAbility.id));
          }
          const enemyEvasion = enemyStunned ? 0 : computeEnemyEvasion();
          // Cheiro de Sangue (barbaro:selvageria:8) — +2% crit chance per
          // current Ferida stack against this enemy, capped by the same 0.9
          // ceiling computePlayerStats() already applies. Olho de Sangue
          // (barbaro:furia:2) — SOR-scaled crit, only with Fúria >= 50.
          const woundCritBonus = barbActive && barbHasSkill('barbaro:selvageria:8') ? woundsAtActionStart * WOUND_CRIT_PCT_PER_STACK : 0;
          const olhoDeSangueBonus = barbActive && barbHasSkill('barbaro:furia:2') && barbFuryRef.current >= FURY_INTERACTION_THRESHOLD
            ? capped(FURIA_OLHO_DE_SANGUE_RATE, attrTotal(chRef.current, 'luk'), FURIA_OLHO_DE_SANGUE_CAP) : 0;
          const critChanceForRoll = Math.min(0.9, stats.critChance + woundCritBonus + olhoDeSangueBonus);
          // Mão Pesada / Instinto Mortal (barbaro:selvageria:3 / :11) —
          // SOR-scaled critDmg vs a wounded enemy (any Ferida / exactly max).
          const maoPesadaBonus = barbActive && barbHasSkill('barbaro:selvageria:3') && woundsAtActionStart >= 1
            ? capped(SELVAGERIA_MAO_PESADA_RATE, attrTotal(chRef.current, 'luk'), SELVAGERIA_MAO_PESADA_CAP) : 0;
          const instintoMortalBonus = barbActive && barbHasSkill('barbaro:selvageria:11') && woundsAtActionStart === WOUND_MAX_STACKS
            ? capped(SELVAGERIA_INSTINTO_MORTAL_RATE, attrTotal(chRef.current, 'luk'), SELVAGERIA_INSTINTO_MORTAL_CAP) : 0;
          const critDmgMultForRoll = stats.critDmgMult + maoPesadaBonus + instintoMortalBonus;
          // Olhar Predador (barbaro:selvageria:0) — DES-scaled accuracy vs a
          // wounded enemy. Olfato Aguçado (barbaro:selvageria:7) — flat
          // +0.4% accuracy per current Ferida stack (mechanic, not attribute).
          const olharPredadorBonus = barbActive && barbHasSkill('barbaro:selvageria:0') && woundsAtActionStart >= 1
            ? capped(SELVAGERIA_OLHAR_PREDADOR_RATE, attrTotal(chRef.current, 'dex'), SELVAGERIA_OLHAR_PREDADOR_CAP) : 0;
          const olfatoBonus = barbActive && barbHasSkill('barbaro:selvageria:7') ? woundsAtActionStart * WOUND_ACCURACY_PCT_PER_STACK : 0;
          // Olhar do Juiz (clerigo:provacao:1) — extra accuracy vs an enemy
          // sitting at 3+ Julgamento. Veredito Preciso (clerigo:provacao:7)
          // — small accuracy bonus per current Julgamento stack (up to +2%
          // at 5). Both read the action-start snapshot, same as Bárbaro's
          // Ferida-based accuracy bonuses above.
          const olharDoJuizBonus = clerigoActive && clerigoHasSkill('clerigo:provacao:1') && judgmentAtActionStart >= OLHAR_DO_JUIZ_HIGH_JUDGMENT_THRESHOLD
            ? OLHAR_DO_JUIZ_HIGH_JUDGMENT_ACCURACY_PCT : 0;
          const vereditoPrecisoBonus = clerigoActive && clerigoHasSkill('clerigo:provacao:7') ? judgmentAtActionStart * VEREDITO_PRECISO_ACCURACY_PER_STACK : 0;
          const accuracyForRoll = stats.accuracy + olharPredadorBonus + olfatoBonus + olharDoJuizBonus + vereditoPrecisoBonus;
          missed = rollMiss(accuracyForRoll, enemyEvasion);

          if (missed) {
            // No log line — the floater's "erro!" already shows this on screen.
            pushFloat('enemy', 0, false, false, true);
          } else if (offenseAbility) {
            if (offenseAbility.effect.furyCost === undefined && offenseAbility.effect.faithCost === undefined) {
              cooldownsRef.current[offenseAbility.id] = applyCd(offenseAbility.cooldown, stats.cooldownReductionPct + clerigoCdrBonusFor(offenseAbility.id));
            }
            const eff = offenseAbility.effect;
            // Abilities from magical classes cast as spells by default (matk vs
            // mdef) — only an ability's own dmgType override or the caster's
            // class decides which channel a spell uses. The plain attack (the
            // `else` branch below) follows the same class split now, so a
            // caster's INT/matk investment does something before their first
            // active ability unlocks, not just after.
            const dmgType = eff.dmgType ?? (MAGICAL_CLASSES.includes(chRef.current.classId) ? 'magical' : 'physical');
            playerHitMagical = dmgType === 'magical';
            const power = dmgType === 'magical' ? stats.matk : stats.atk;
            const effDef = Math.max(0, (dmgType === 'magical' ? computeEnemyMdef() : computeEnemyDef()) * (1 - stats.defPenPct));
            // Bárbaro: Fúria Total/Aniquilação add dmgMult per current
            // Ferida stack; Resistência's Fúria Berserker trades consumed
            // Dor for extra dmgMult (up to +0.08x per 2% max HP consumed).
            let dmgMult = eff.dmgMult ?? 1;
            if (eff.dmgMultPerWoundStack) dmgMult += eff.dmgMultPerWoundStack * woundsAtActionStart;
            if (eff.painConsumeMaxPct && eff.painConsumeDmgMultPer2Pct) {
              const consumed = barbConsumePain(eff.painConsumeMaxPct);
              dmgMult += eff.painConsumeDmgMultPer2Pct * (consumed / (barbEffMaxHp() * 0.02));
            }
            // Clérigo: Golpe Sagrado's own dmgMult jumps while Consagração is
            // active. Sentença Final scales by how many Julgamentos this very
            // hit is about to consume (capped by judgmentConsumeMax); Ira
            // Consumidora (judgmentReadOnly) instead scales by the CURRENT
            // stack count without consuming any.
            if (eff.consecrationDmgMultBonus && clerigoConsecrationActive()) dmgMult += eff.consecrationDmgMultBonus;
            const judgmentStacksToConsume = eff.judgmentConsumeMax !== undefined && !eff.judgmentReadOnly
              ? Math.min(eff.judgmentConsumeMax, judgmentAtActionStart) : 0;
            if (eff.dmgMultPerJudgmentStack) {
              dmgMult += eff.dmgMultPerJudgmentStack * (eff.judgmentReadOnly ? judgmentAtActionStart : judgmentStacksToConsume);
            }
            const r = rollAbilityHit(power, effDef, dmgMult, critChanceForRoll, critDmgMultForRoll, eff.kind === 'guaranteedCrit');
            dmg = r.dmg; crit = r.crit;
            abilityTag = ` [${offenseAbility.name}]`;
            castAbility = offenseAbility;
            if (eff.kind === 'applyStatus' && eff.status) {
              enemyStatusRef.current.push({ kind: eff.status, roundsLeft: eff.statusRounds ?? 3, dmgPerTick: Math.max(1, Math.round(power * (eff.statusDmgPct ?? 0.4))) });
              syncEnemyStatuses();
              statusLine = ` ${enemyRef.current.name} foi ${STATUS_VERB[eff.status]}!`;
            } else if (eff.kind === 'crowdControl' && eff.cc) {
              enemyCCRef.current.push({ kind: eff.cc, roundsLeft: eff.ccRounds ?? 1 });
              syncEnemyCC();
              statusLine = ` ${enemyRef.current.name} ficou ${CC_LABEL[eff.cc].toLowerCase()}!`;
            } else if (eff.kind === 'statMod' && eff.statMod) {
              if (eff.statModTarget === 'self') {
                playerModsRef.current.push({ stat: eff.statMod, pct: eff.statModPct ?? 0.2, roundsLeft: eff.statModRounds ?? 3, sourceAbilityId: offenseAbility.id });
                syncPlayerMods();
                statusLine = ' Você ganha um efeito temporário!';
              } else {
                enemyModsRef.current.push({ stat: eff.statMod, pct: eff.statModPct ?? -0.2, roundsLeft: eff.statModRounds ?? 3 });
                syncEnemyMods();
                statusLine = ` ${enemyRef.current.name} foi enfraquecido!`;
              }
            }
            // Bárbaro: Ferida apply/renew/consume + fury-on-hit/-on-crit —
            // only ever set on Bárbaro abilities, inert for every other class.
            if (eff.woundStacksOnHit) barbApplyWounds(eff.woundStacksOnHit);
            if (eff.renewWoundsOnHit) barbRenewWounds();
            if (eff.consumeWoundsOnHit) barbConsumeWounds();
            if (eff.furyGainOnHit) barbGainFuryDirect(eff.furyGainOnHit);
            if (eff.furyGainOnCrit && crit) barbGainFuryDirect(eff.furyGainOnCrit);
            // Clérigo: Julgamento apply (Chama Purificadora)/consume
            // (Sentença Final/Apocalipse Sagrado)/duration-cut (Ira
            // Consumidora)/Consagração-extend-on-hit (Golpe Sagrado) — all
            // gated on this actually connecting (this whole branch already
            // sits inside "not missed").
            if (eff.judgmentStacksOnHit) clerigoApplyJudgment(eff.judgmentStacksOnHit);
            if (judgmentStacksToConsume > 0) {
              const consumed = clerigoConsumeJudgment(judgmentStacksToConsume);
              // Sabedoria do Julgamento (clerigo:provacao:11) — small heal
              // when a single ability consumes 3+ Julgamentos at once.
              if (consumed >= SABEDORIA_JULGAMENTO_MIN_CONSUMED && clerigoHasSkill('clerigo:provacao:11')) {
                const healAmt = Math.round(clerigoBaselineMaxHp() * SABEDORIA_JULGAMENTO_HEAL_PCT);
                if (healAmt > 0) {
                  updateCh({ ...chRef.current, hp: Math.min(clerigoEffMaxHp(), chRef.current.hp + healAmt) });
                  pushFloat('player', healAmt, false, undefined, undefined, true);
                }
              }
              // Juízo Final (clerigo:provacao:14) — consuming EXACTLY 5 at
              // once grants +1 Fé and a temporary MATK buff that can't be
              // renewed while it's still up.
              if (consumed === APOCALIPSE_SAGRADO_REQUIRED_JUDGMENT && clerigoHasSkill('clerigo:provacao:14') && !clerigoJuizoFinalActiveRef.current) {
                clerigoGainFaith(1);
                clerigoJuizoFinalActiveRef.current = true;
                playerModsRef.current.push({ stat: 'atk', pct: JUIZO_FINAL_MATK_BUFF_PCT, roundsLeft: JUIZO_FINAL_MATK_BUFF_ROUNDS, sourceAbilityId: 'clerigo:provacao:14' });
                syncPlayerMods();
              }
            }
            if (eff.judgmentDurationCutOnHit) clerigoReduceJudgmentDuration(eff.judgmentDurationCutOnHit);
            if (eff.extendConsecrationOnHit && clerigoConsecrationActive()) clerigoExtendConsecration(eff.extendConsecrationOnHit);
          } else {
            // Plain attack — magical classes swing with matk/mdef instead of
            // atk/def, same class split as an ability's default dmgType
            // above, so their INT investment isn't dead weight before they
            // have an ability equipped.
            const isMagicalClass = MAGICAL_CLASSES.includes(chRef.current.classId);
            playerHitMagical = isMagicalClass;
            const power = isMagicalClass ? stats.matk : stats.atk;
            const effDef = Math.max(0, (isMagicalClass ? computeEnemyMdef() : computeEnemyDef()) * (1 - stats.defPenPct));
            const r = rollAttack(power, effDef, critChanceForRoll, critDmgMultForRoll);
            dmg = r.dmg; crit = r.crit;
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

      if (!missed && dmg > 0) {
        const enemyHp = Math.max(0, enemyRef.current.hp - dmg);
        applyEnemyHp(enemyHp);
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

        if (enemyHp <= 0) { resolveEnemyDeath(); return; }
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

    const enemyStunned = hasCC(enemyCCRef.current, 'stun') || hasCC(enemyCCRef.current, 'sleep');
    if (enemyStunned) {
      pushLog(`${enemyRef.current.name} está incapacitado e não consegue atacar!`);
      scheduleEnemy();
      return;
    }

    const defStats = computePlayerStats();
    const enemyAccuracy = computeEnemyAccuracy();
    const enemyMissed = rollMiss(enemyAccuracy, defStats.evasion);

    if (enemyMissed) {
      // No log line — the floater's "erro!" already shows this on screen.
      pushFloat('player', 0, false, false, true);
      scheduleEnemy();
      return;
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

    const blocked = Math.random() < defStats.blockChance;
    if (blocked) edmg = Math.round(edmg * 0.5);

    let shieldAbsorbed = 0;
    if (playerShieldRef.current > 0 && edmg > 0) {
      shieldAbsorbed = Math.min(playerShieldRef.current, edmg);
      playerShieldRef.current -= shieldAbsorbed;
      edmg -= shieldAbsorbed;
      syncShield();
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
          const rounds = clerigoSoloConsagradoFirstNegative(abEffect.statusRounds ?? 3);
          if (rounds > 0) {
            playerStatusRef.current.push({ kind: abEffect.status, roundsLeft: rounds, dmgPerTick: Math.max(1, Math.round(enemyPower * 0.35)) });
            syncPlayerStatuses();
          }
          pushLog(`Você foi ${STATUS_VERB[abEffect.status]}!`);
        }
      } else if (abEffect.kind === 'controlSlam' && abEffect.cc && !playerImmune()) {
        if (playerResists(defStats)) {
          pushLog('Você resistiu ao efeito!');
        } else {
          const rounds = clerigoSoloConsagradoFirstNegative(abEffect.ccRounds ?? 1);
          if (rounds > 0) {
            playerCCRef.current.push({ kind: abEffect.cc, roundsLeft: rounds });
            syncPlayerCC();
          }
          pushLog(`Você ficou ${CC_LABEL[abEffect.cc].toLowerCase()}!`);
        }
      } else if (abEffect.kind === 'weakenNova' && abEffect.statMod && !playerImmune()) {
        playerModsRef.current.push({ stat: abEffect.statMod, pct: abEffect.statModPct ?? -0.2, roundsLeft: abEffect.statModRounds ?? 3 });
        syncPlayerMods();
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
          const rounds = clerigoSoloConsagradoFirstNegative(proc.rounds);
          if (rounds > 0) {
            playerStatusRef.current.push({ kind: proc.status, roundsLeft: rounds, dmgPerTick: Math.max(1, Math.round(enemyPower * 0.35)) });
            syncPlayerStatuses();
          }
          pushLog(proc.label);
        } else if (proc.cc) {
          const rounds = clerigoSoloConsagradoFirstNegative(proc.rounds);
          if (rounds > 0) {
            playerCCRef.current.push({ kind: proc.cc, roundsLeft: rounds });
            syncPlayerCC();
          }
          pushLog(proc.label);
        } else if (proc.statMod) {
          playerModsRef.current.push({ stat: proc.statMod, pct: proc.statModPct ?? -0.15, roundsLeft: proc.rounds });
          syncPlayerMods();
          pushLog(proc.label);
        }
      }
    }

    if (hp <= 0 && !resolvePlayerDeath()) return;
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
        drawSprite(g, enemySprite(enemy.shape), ex, groundY, false, flashSide === 'enemy' ? 0.7 : 0, 0, enemyTint);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [
    ch.classId, enemy.shape, phase, flashSide, heroSpr,
    playerStatuses, playerCCState, playerModsState, enemyStatuses, enemyCCState, enemyModsState,
  ]);

  const hpPct = (v: number, max: number) => Math.max(0, Math.min(100, (v / max) * 100));
  const weapon = ch.equipment.weapon;
  const effMaxHp = effectiveMaxHp(ch);
  // Bárbaro redesign UI (lib/barbarian.ts) — Fúria/Frenesi/Dor bars near the
  // player's own HP, Feridas badge near the enemy's. Every value here reads
  // off state (barbFuryState/barbFrenzyState/barbPainState), never refs, so
  // it re-renders like everything else on screen.
  const isBarbaroChar = ch.classId === 'barbaro';
  const barbPeleBonus = ch.unlockedSkills.includes('barbaro:resistencia:0')
    ? capped(RESISTENCIA_PELE_ENDURECIDA_RATE, attrTotal(ch, 'vit'), RESISTENCIA_PELE_ENDURECIDA_CAP)
    : 0;
  const barbInquebravelBonus = ch.unlockedSkills.includes('barbaro:resistencia:14') ? INQUEBRAVEL_PAIN_CAP_BONUS : 0;
  const barbPainCap = effMaxHp * (PAIN_MAX_PCT + barbPeleBonus + barbInquebravelBonus);
  const enemyWounds = enemy.barbarianWounds;
  const woundBadge = enemyWounds && enemyWounds.stacks > 0 ? (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); setOpenMechanicId('barbaro:wounds'); }}
      className="inline-flex items-center gap-0.5 text-[10px] text-red-400 ml-1 shrink-0"
      title={`Feridas x${enemyWounds.stacks}`}
    >
      <img src={iconSangramento} alt="" className="w-3.5 h-3.5 rounded-full" />x{enemyWounds.stacks}
    </button>
  ) : null;
  // Clérigo redesign UI (lib/clerigo.ts) — Fé/Graça/Consagração near the
  // player's own HP, Julgamento badge near the enemy's, same read-off-state
  // discipline as Bárbaro's bars above.
  const isClerigoChar = ch.classId === 'clerigo';
  const enemyJudgment = enemy.judgment;
  const judgmentBadge = enemyJudgment && enemyJudgment.stacks > 0 ? (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); setOpenMechanicId('clerigo:judgment'); }}
      className="inline-flex items-center gap-0.5 text-[10px] text-amber-300 ml-1 shrink-0"
      title={`Julgamento x${enemyJudgment.stacks}`}
    >
      ⚖ x{enemyJudgment.stacks}
    </button>
  ) : null;
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
              ✦ {enemy.name}{bossPhaseName && <span className="text-amber-400"> — {bossPhaseName}</span>}{woundBadge}{judgmentBadge}
            </span>
            <span className="text-xs text-parchment/70 shrink-0">{Math.max(0, enemy.hp)}/{enemy.maxHp}</span>
          </div>
          <div className="h-3 bg-black/50 rounded mt-1 overflow-hidden">
            <div className="h-3 bg-crimson rounded transition-[width] duration-300" style={{ width: `${hpPct(enemy.hp, enemy.maxHp)}%` }} />
          </div>
          <AtbBar roundKey={enemyRoundKey} roundMs={enemyRoundMs} paused={paused} colorClass="bg-amber-400" />
          {enemyTags.length > 0 && <div className="text-[11px] text-green-400/90 mt-1 truncate">{enemyTags.join(', ')}</div>}
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
                +{f.value}
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
                  -{f.value}{f.crit ? '!' : ''}
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
            <span className="text-parchment font-bold text-sm drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">-{g.amount}</span>
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
                  {a.heal ? '+' : '-'}{a.value}
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
              <div key={ab.id} className="relative w-11 h-11 shrink-0" title={`${ab.name}${onCooldown ? ` — recarregando` : ''}`}>
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
              </div>
            );
          })}
        </div>
      )}

      {isBarbaroChar && phase === 'fight' && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOpenMechanicId('barbaro:fury')}
            className="w-full flex justify-between items-baseline text-[10px] text-parchment/50 uppercase tracking-wide underline decoration-dotted decoration-parchment/30 underline-offset-2"
          >
            <span>
              Fúria
              {barbFrenzyState && (
                <span
                  onClick={(e) => { e.stopPropagation(); setOpenMechanicId('barbaro:frenzy'); }}
                  className="text-amber-400"
                > — FRENESI!</span>
              )}
            </span>
            <span>{Math.round(barbFuryState)}/{FURY_MAX}</span>
          </button>
          <div className="h-2 bg-black/50 rounded overflow-hidden">
            <div
              className={`h-2 rounded transition-[width] duration-300 ${barbFrenzyState ? 'bg-amber-400' : 'bg-orange-600'}`}
              style={{ width: `${(barbFuryState / FURY_MAX) * 100}%` }}
            />
          </div>
          {barbPainState > 0 && (
            <>
              <button
                type="button"
                onClick={() => setOpenMechanicId('barbaro:pain')}
                className="w-full flex justify-between items-baseline text-[10px] text-purple-300/70 uppercase tracking-wide mt-1 underline decoration-dotted decoration-purple-300/30 underline-offset-2"
              >
                <span>Dor</span>
                <span>{Math.round(barbPainState)}</span>
              </button>
              <div className="h-1.5 bg-black/50 rounded overflow-hidden">
                <div className="h-1.5 bg-purple-500 rounded transition-[width] duration-300" style={{ width: `${Math.min(100, (barbPainState / barbPainCap) * 100)}%` }} />
              </div>
            </>
          )}
        </div>
      )}
      {isClerigoChar && phase === 'fight' && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOpenMechanicId('clerigo:faith')}
            className="w-full flex justify-between items-baseline text-[10px] text-parchment/50 uppercase tracking-wide underline decoration-dotted decoration-parchment/30 underline-offset-2"
          >
            <span>Fé</span>
            <span className="text-sm tracking-wider text-amber-300">
              {Array.from({ length: FAITH_MAX }, (_, i) => (i < clerigoFaithState ? '◆' : '◇')).join(' ')}
            </span>
          </button>
          {clerigoGraceState > 0 && (
            <>
              <button
                type="button"
                onClick={() => setOpenMechanicId('clerigo:grace')}
                className="w-full flex justify-between items-baseline text-[10px] text-sky-300/80 uppercase tracking-wide mt-1 underline decoration-dotted decoration-sky-300/30 underline-offset-2"
              >
                <span>Graça</span>
                <span>{Math.round(clerigoGraceState)}</span>
              </button>
              <div className="h-1.5 bg-black/50 rounded overflow-hidden">
                <div className="h-1.5 bg-sky-300 rounded transition-[width] duration-300" style={{ width: `${Math.min(100, (clerigoGraceState / effMaxHp) * 100)}%` }} />
              </div>
            </>
          )}
          {clerigoConsecrationState > 0 && (
            <button
              type="button"
              onClick={() => setOpenMechanicId('clerigo:consecration')}
              className="w-full flex justify-between items-baseline text-[10px] text-gold uppercase tracking-wide mt-1 underline decoration-dotted decoration-gold/30 underline-offset-2"
            >
              <span>✦ Consagração</span>
              <span>{clerigoConsecrationState}</span>
            </button>
          )}
        </div>
      )}
      {openMechanicId && <MechanicQuickModal mechanicId={openMechanicId} onClose={() => setOpenMechanicId(null)} />}

      <div className={`grid gap-4 mt-3 text-sm ${enemy.isBoss ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <div>
          <div className="flex justify-between items-baseline gap-2">
            <span className="truncate">{ch.name}{playerShieldState > 0 && <span className="text-sky-300 text-xs"> (+{playerShieldState} escudo)</span>}</span>
            <span className="shrink-0">{Math.max(0, ch.hp)}/{effMaxHp}</span>
          </div>
          <div className="h-2 bg-black/50 rounded"><div className="h-2 bg-red-500 rounded" style={{ width: `${hpPct(ch.hp, effMaxHp)}%` }} /></div>
          {phase === 'fight' && <AtbBar roundKey={playerRoundKey} roundMs={playerRoundMs} paused={paused} colorClass="bg-sky-400" />}
          {playerTags.length > 0 && <div className="text-[11px] text-amber-300/90 mt-0.5 truncate">{playerTags.join(', ')}</div>}
        </div>
        {!enemy.isBoss && (
          <div>
            <div className="flex justify-between">
              <span className={`truncate flex items-center ${enemy.isElite ? 'text-amber-400 font-bold' : ''}`}>{enemy.isElite ? '★ ' : ''}{enemy.name}{woundBadge}{judgmentBadge}</span>
              <span className="shrink-0">{Math.max(0, enemy.hp)}/{enemy.maxHp}</span>
            </div>
            <div className="h-2 bg-black/50 rounded"><div className="h-2 bg-yellow-500 rounded" style={{ width: `${hpPct(enemy.hp, enemy.maxHp)}%` }} /></div>
            {phase === 'fight' && <AtbBar roundKey={enemyRoundKey} roundMs={enemyRoundMs} paused={paused} colorClass="bg-amber-400" />}
            {enemyTags.length > 0 && <div className="text-[11px] text-green-400/90 mt-0.5 truncate">{enemyTags.join(', ')}</div>}
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
