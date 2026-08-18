import { CSSProperties, useEffect, useRef, useState } from 'react';
import {
  AbilityDef, Character, CrowdControlKind, EnemyInstance, DungeonDef, ItemSlot, KingdomBonuses,
  StatModStat, StatusEffectKind,
} from '../types/game';
import { spawnEnemy } from '../lib/enemies';
import { CLASSES, grantXp, MAGICAL_CLASSES } from '../lib/classes';
import { computeCombatStats, effectiveMaxHp } from '../lib/combatStats';
import { generateItem, rarityColor } from '../lib/equipment';
import { itemDisplayName } from '../lib/enhancement';
import { OFFHAND_KIND } from '../lib/itemTiers';
import { canFitInInventory, placeInInventory } from '../lib/inventoryGrid';
import { getEquippedAbilities } from '../lib/skills';
import { rollAttack, rollAbilityHit } from '../game/combat';
import { heroSprites, enemySprite, drawSprite } from '../game/sprites';
import { battleBackground } from '../game/battleBackgrounds';
import { Panel } from './Panel';
import { Button } from './Button';
import { IconActive, IconSkull, IconSword } from './icons';
import { activeAbilityIconStyle } from '../lib/abilityIcons';
import {
  playBattleMusic, playBossMusic, stopCombatMusic, playMagicAttackSfx, playPhysicalAttackSfx, playHurtSfx,
} from '../lib/audio';
import skillFrame from '../assets/slot-habilidade.webp';

const ATTACK_INTERVAL = 1600;
// Player and enemy now run on independent action clocks (see playerAct/
// enemyAct); this only offsets the enemy's very first action so the two
// don't visually land in the exact same instant every round for a
// zero-AGI build, matching the stagger the old single shared round had.
const LEAN_MS = 260;
const POTION_COOLDOWN_ROUNDS = 4;
const BASE_DROP_CHANCE = 0.12;
const BASE_POTION_HEAL_PCT = 0.4;
const DROP_SLOTS: ItemSlot[] = ['weapon', 'body', 'legs', 'hands', 'offhand', 'accessory'];
// Self-targeted kinds resolve as the round's whole action — no basic attack,
// no offense ability, just this — same as any offense pick. They compete for
// the one action exactly like everything else in the priority list; a
// self-targeted 'statMod' is the one exception, since it's a hybrid hit+buff
// that already rolls damage in the offense branch below.
const SELF_ABILITY_KINDS = ['heal', 'buffDef', 'buffBlock', 'shield', 'regen', 'immunity', 'haste', 'berserk', 'dispel', 'taunt', 'lifestealBuff', 'atkBuff'];
const MISS_CHANCE_CAP = 0.45;

const STATUS_LABEL: Record<StatusEffectKind, string> = { poison: 'Envenenado', burn: 'Em Chamas', bleed: 'Sangrando', curse: 'Amaldiçoado' };
const STATUS_VERB: Record<StatusEffectKind, string> = { poison: 'envenenado', burn: 'incendiado', bleed: 'posto a sangrar', curse: 'amaldiçoado' };
const STATUS_TICK_LABEL: Record<StatusEffectKind, string> = { poison: 'veneno', burn: 'queimadura', bleed: 'sangramento', curse: 'maldição' };
const CC_LABEL: Record<CrowdControlKind, string> = { stun: 'Atordoado', sleep: 'Dormindo', silence: 'Silenciado' };

interface StatusInstance { kind: StatusEffectKind; roundsLeft: number; dmgPerTick: number; }
// sourceAbilityId tags who cast this — lets pickAbility() skip an ability
// whose effect is already active instead of blindly re-casting it on top.
interface PlayerBuff { kind: 'def' | 'block'; pct: number; roundsLeft: number; sourceAbilityId?: string; }
interface StatModInstance { stat: StatModStat; pct: number; roundsLeft: number; sourceAbilityId?: string; }
interface CCInstance { kind: CrowdControlKind; roundsLeft: number; }
interface RegenInstance { pct: number; roundsLeft: number; sourceAbilityId?: string; }
interface FloatingNumber { id: number; side: 'player' | 'enemy'; value: number; crit: boolean; blocked?: boolean; miss?: boolean }
interface Props {
  character: Character;
  dungeon: DungeonDef;
  kingdomBonuses: KingdomBonuses;
  onLiveUpdate: (c: Character) => void;
  onRunEnd: (finalCharacter: Character, deepestDepth: number, endedReason: 'death' | 'retreat' | 'victory') => void;
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

export function DungeonPanel({ character, dungeon, kingdomBonuses, onLiveUpdate, onRunEnd }: Props) {
  const [ch, setCh] = useState<Character>(character);
  const [depth, setDepth] = useState(dungeon.startDepth);
  const [enemy, setEnemy] = useState<EnemyInstance>(() => spawnEnemy(dungeon.startDepth, dungeon));
  const [phase, setPhase] = useState<Phase>('fight');
  const [paused, setPaused] = useState(false);
  const [log, setLog] = useState<string[]>([`Você entra em ${dungeon.name}...`]);
  const [floaters, setFloaters] = useState<FloatingNumber[]>([]);
  const [flashSide, setFlashSide] = useState<'player' | 'enemy' | null>(null);
  const [endedReason, setEndedReason] = useState<'death' | 'retreat' | 'victory' | null>(null);
  const [enemyStatuses, setEnemyStatuses] = useState<StatusEffectKind[]>([]);
  const [playerStatuses, setPlayerStatuses] = useState<StatusEffectKind[]>([]);
  const [enemyCCState, setEnemyCCState] = useState<CrowdControlKind[]>([]);
  const [playerCCState, setPlayerCCState] = useState<CrowdControlKind[]>([]);
  const [playerShieldState, setPlayerShieldState] = useState(0);
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

  // Ability/status engine state — session-only, reset whenever this dungeon
  // run starts (never persisted). enemyStatusRef/playerStatusRef are the DOT
  // family (poison/burn/bleed/curse); *ModsRef are generic buff/debuff stat
  // modifiers (atk/def/crit/accuracy/evasion/dmgTakenPct/defPenPct); *CCRef
  // is the action-denial family (stun/sleep/silence).
  const cooldownsRef = useRef<Record<string, number>>({});
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

  const heroSpr = heroSprites(ch.classId);

  function updateCh(next: Character) { chRef.current = next; setCh(next); onLiveUpdate(next); }
  function updateEnemy(next: EnemyInstance) { enemyRef.current = next; setEnemy(next); }
  function updateDepth(next: number) { depthRef.current = next; setDepth(next); }
  function syncEnemyStatuses() { setEnemyStatuses(enemyStatusRef.current.map((s) => s.kind)); }
  function syncPlayerStatuses() { setPlayerStatuses(playerStatusRef.current.map((s) => s.kind)); }
  function syncEnemyCC() { setEnemyCCState(enemyCCRef.current.map((c) => c.kind)); }
  function syncPlayerCC() { setPlayerCCState(playerCCRef.current.map((c) => c.kind)); }
  function syncShield() { setPlayerShieldState(playerShieldRef.current); }

  function pushLog(line: string) {
    setLog((l) => [...l.slice(-4), line]);
  }
  function pushFloat(side: 'player' | 'enemy', value: number, crit: boolean, blocked?: boolean, miss?: boolean) {
    const id = floaterId.current++;
    setFloaters((f) => [...f, { id, side, value, crit, blocked, miss }]);
    setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 900);
  }
  function flash(side: 'player' | 'enemy') {
    setFlashSide(side);
    setTimeout(() => { if (mountedRef.current) setFlashSide(null); }, 150);
  }

  // Three independent clocks instead of one shared round: envTick owns every
  // duration-based decay (cooldowns, DOT, buffs/debuffs, CC, regen) on the
  // original fixed cadence so none of that balance shifts, while the player
  // and enemy each act on their own pace. The player's pace shortens with
  // AGI (stats.speedPct) — a fast build genuinely gets more actions in than
  // a slow one, not just better odds to dodge/block. Enemies stay at the
  // baseline pace for now (no per-shape speed stat yet).
  function scheduleEnv(delay = ATTACK_INTERVAL) {
    setTimeout(() => {
      if (!mountedRef.current) return;
      if (!pausedRef.current && phaseRef.current === 'fight') envTick();
    }, delay);
  }

  function schedulePlayer(delay: number) {
    setPlayerRoundMs(delay);
    setPlayerRoundKey((k) => k + 1);
    setTimeout(() => {
      if (!mountedRef.current) return;
      if (!pausedRef.current && phaseRef.current === 'fight') playerAct();
    }, delay);
  }

  function scheduleEnemy(delay = ATTACK_INTERVAL) {
    setEnemyRoundMs(delay);
    setEnemyRoundKey((k) => k + 1);
    setTimeout(() => {
      if (!mountedRef.current) return;
      if (!pausedRef.current && phaseRef.current === 'fight') enemyAct();
    }, delay);
  }

  function nextPlayerDelay(): number {
    const speedPct = computePlayerStats().speedPct;
    return Math.round(ATTACK_INTERVAL / (1 + speedPct));
  }

  function tryDropEquipment(guaranteed = false) {
    const stats = computeCombatStats(chRef.current);
    if (!guaranteed) {
      const chance = Math.min(0.6, BASE_DROP_CHANCE * (dungeon.dropMult ?? 1) + kingdomBonuses.dropChanceBonusPct + stats.dropChanceBonusPct);
      if (Math.random() >= chance) return;
    }
    const availableSlots = OFFHAND_KIND[chRef.current.classId] ? DROP_SLOTS : DROP_SLOTS.filter((s) => s !== 'offhand');
    const slot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
    if (!canFitInInventory(chRef.current.inventory, slot)) {
      pushLog('Inventário cheio — o item foi perdido.');
      return;
    }
    const item = generateItem(slot, chRef.current.classId, dungeon.itemTier, kingdomBonuses.itemQualityBonusPct + stats.itemQualityBonusPct);
    updateCh({ ...chRef.current, inventory: placeInInventory(chRef.current.inventory, item) });
    pushLog(`Você encontrou: ${item.name}!`);
  }

  function conditionMet(ability: AbilityDef): boolean {
    const cond = ability.condition;
    if (cond.type === 'always') return true;
    if (cond.type === 'enemyHasStatus') return enemyStatusRef.current.some((s) => s.kind === cond.status);
    if (cond.type === 'hpBelow') {
      const threshold = chRef.current.abilityThresholds[ability.id] ?? cond.pct ?? 0.5;
      return chRef.current.hp / effectiveMaxHp(chRef.current) < threshold;
    }
    if (cond.type === 'enemyHpBelow') return enemyRef.current.hp / enemyRef.current.maxHp < (cond.pct ?? 0.5);
    if (cond.type === 'selfDebuffed') {
      return playerStatusRef.current.length > 0 || playerCCRef.current.length > 0 || playerModsRef.current.some((m) => m.pct < 0);
    }
    return false;
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
    return {
      ...base,
      atk: Math.round(base.atk * (1 + atkPct)),
      matk: Math.round(base.matk * (1 + atkPct)),
      def: Math.max(0, Math.round(base.def * defMult)),
      mdef: Math.max(0, Math.round(base.mdef * defMult)),
      critChance: Math.min(0.9, Math.max(0, base.critChance + critAdd)),
      critDmgMult: base.critDmgMult + critDmgAdd,
      blockChance: Math.min(0.6, Math.max(0, base.blockChance + blockAdd)),
      evasion: Math.max(0, base.evasion + getModTotal(playerModsRef.current, 'evasion')),
      accuracy: base.accuracy + getModTotal(playerModsRef.current, 'accuracy'),
      dmgTakenPct: getModTotal(playerModsRef.current, 'dmgTakenPct'),
      defPenPct: Math.max(0, getModTotal(playerModsRef.current, 'defPenPct')),
      lifestealPct: Math.max(0, base.lifestealPct + getModTotal(playerModsRef.current, 'lifestealPct')),
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
    if (eff.kind === 'heal') {
      const c = chRef.current;
      const baselineMaxHp = CLASSES[c.classId].baseHp + 6 * (c.level - 1);
      const maxHp = effectiveMaxHp(c);
      const prevHp = c.hp;
      const healed = Math.min(maxHp, c.hp + Math.round(baselineMaxHp * (eff.healPct ?? 0.2) * supportMult));
      updateCh({ ...c, hp: healed });
      return `${ab.name}: você recupera ${healed - prevHp} de vida.`;
    } else if (eff.kind === 'buffDef') {
      playerBuffsRef.current.push({ kind: 'def', pct: (eff.buffPct ?? 0.2) * supportMult, roundsLeft: eff.buffRounds ?? 3, sourceAbilityId: ab.id });
      return `${ab.name}: sua defesa aumenta.`;
    } else if (eff.kind === 'buffBlock') {
      playerBuffsRef.current.push({ kind: 'block', pct: (eff.buffPct ?? 0.2) * supportMult, roundsLeft: eff.buffRounds ?? 3, sourceAbilityId: ab.id });
      return `${ab.name}: sua chance de bloqueio aumenta.`;
    } else if (eff.kind === 'shield') {
      const amount = Math.round(effectiveMaxHp(chRef.current) * (eff.shieldPct ?? 0.25) * supportMult);
      playerShieldRef.current += amount;
      syncShield();
      return `${ab.name}: um escudo absorve ${amount} de dano.`;
    } else if (eff.kind === 'regen') {
      playerRegenRef.current.push({ pct: (eff.regenPct ?? 0.08) * supportMult, roundsLeft: eff.regenRounds ?? 4, sourceAbilityId: ab.id });
      return `${ab.name}: você começa a regenerar vida.`;
    } else if (eff.kind === 'immunity') {
      playerImmuneRoundsRef.current = Math.max(playerImmuneRoundsRef.current, eff.immunityRounds ?? 3);
      return `${ab.name}: você fica imune a novos efeitos negativos.`;
    } else if (eff.kind === 'haste') {
      playerHasteRoundsRef.current = Math.max(playerHasteRoundsRef.current, eff.hasteRounds ?? 4);
      return `${ab.name}: suas habilidades recarregam mais rápido.`;
    } else if (eff.kind === 'berserk') {
      playerModsRef.current.push({ stat: 'atk', pct: eff.berserkAtkPct ?? 0.3, roundsLeft: eff.berserkRounds ?? 4, sourceAbilityId: ab.id });
      playerModsRef.current.push({ stat: 'def', pct: eff.berserkDefPct ?? -0.2, roundsLeft: eff.berserkRounds ?? 4, sourceAbilityId: ab.id });
      return `${ab.name}: fúria berserker — mais dano, menos defesa.`;
    } else if (eff.kind === 'taunt') {
      // Provoca o inimigo — hoje é só a redução de dano recebido (útil já
      // em 1v1); a parte de "forçar o alvo" fica pronta para quando um
      // sistema de múltiplos inimigos/coop existir.
      playerModsRef.current.push({ stat: 'dmgTakenPct', pct: eff.buffPct ?? -0.20, roundsLeft: eff.buffRounds ?? 4, sourceAbilityId: ab.id });
      return `${ab.name}: você provoca o inimigo, reduzindo o dano recebido.`;
    } else if (eff.kind === 'dispel') {
      playerModsRef.current = playerModsRef.current.filter((m) => m.pct >= 0);
      playerStatusRef.current = [];
      playerCCRef.current = [];
      syncPlayerStatuses();
      syncPlayerCC();
      return `${ab.name}: você remove os efeitos negativos.`;
    } else if (eff.kind === 'lifestealBuff') {
      playerModsRef.current.push({ stat: 'lifestealPct', pct: (eff.buffPct ?? 0.2) * supportMult, roundsLeft: eff.buffRounds ?? 3, sourceAbilityId: ab.id });
      return `${ab.name}: você começa a roubar vida do inimigo.`;
    } else if (eff.kind === 'atkBuff') {
      playerModsRef.current.push({ stat: 'atk', pct: (eff.buffPct ?? 0.2) * supportMult, roundsLeft: eff.buffRounds ?? 3, sourceAbilityId: ab.id });
      return `${ab.name}: seu ataque aumenta.`;
    }
    return null;
  }

  // DOT ticks (poison/burn/bleed/curse) at the start of every round, for
  // whichever side is carrying them. Deliberately never lets a tick finish
  // the kill outright (clamped to 1 HP) — reward granting (XP/gold/depth
  // advance) only happens from the direct attack-roll codepath, so a DOT
  // "kill" would otherwise vanish silently. Same clamp applied to the player
  // for consistency (death is only ever detected from the enemy's direct hit).
  function tickStatus(ref: { current: StatusInstance[] }, hp: number, applyHp: (hp: number) => void, name: string): string | null {
    if (ref.current.length === 0) return null;
    const ticking = ref.current;
    const totalDmg = ticking.reduce((s, e) => s + e.dmgPerTick, 0);
    ref.current = ticking.map((s) => ({ ...s, roundsLeft: s.roundsLeft - 1 })).filter((s) => s.roundsLeft > 0);
    if (totalDmg <= 0) return null;
    applyHp(Math.max(1, hp - totalDmg));
    const label = STATUS_TICK_LABEL[ticking[0].kind];
    return `${name} sofre ${totalDmg} de dano de ${label}.`;
  }

  // Duration-based decay (cooldowns, DOT, buffs/debuffs, CC, regen) — kept on
  // its own fixed cadence, untouched by either side's action speed, so no
  // ability/status duration needs rebalancing now that actions themselves
  // can run faster or slower than this.
  function envTick() {
    if (!mountedRef.current || phaseRef.current !== 'fight') return;

    const hasteBonus = playerHasteRoundsRef.current > 0 ? 1 : 0;
    for (const id in cooldownsRef.current) cooldownsRef.current[id] = Math.max(0, cooldownsRef.current[id] - (1 + hasteBonus));
    if (playerHasteRoundsRef.current > 0) playerHasteRoundsRef.current -= 1;
    if (playerImmuneRoundsRef.current > 0) playerImmuneRoundsRef.current -= 1;
    if (potionCooldownRef.current > 0) potionCooldownRef.current -= 1;
    playerModsRef.current = tickMods(playerModsRef.current);
    enemyModsRef.current = tickMods(enemyModsRef.current);

    const enemyDotLine = tickStatus(enemyStatusRef, enemyRef.current.hp, (hp) => updateEnemy({ ...enemyRef.current, hp }), enemyRef.current.name);
    syncEnemyStatuses();
    if (enemyDotLine) pushLog(enemyDotLine);
    const playerDotLine = tickStatus(playerStatusRef, chRef.current.hp, (hp) => updateCh({ ...chRef.current, hp }), ch.name);
    syncPlayerStatuses();
    if (playerDotLine) pushLog(playerDotLine);

    if (playerRegenRef.current.length > 0) {
      const maxHp = effectiveMaxHp(chRef.current);
      const healPct = playerRegenRef.current.reduce((s, r) => s + r.pct, 0);
      playerRegenRef.current = playerRegenRef.current.map((r) => ({ ...r, roundsLeft: r.roundsLeft - 1 })).filter((r) => r.roundsLeft > 0);
      if (healPct > 0 && chRef.current.hp > 0) {
        const healed = Math.min(maxHp, chRef.current.hp + Math.round(maxHp * healPct));
        if (healed > chRef.current.hp) { updateCh({ ...chRef.current, hp: healed }); pushLog(`Você regenera ${healed - chRef.current.hp} de vida.`); }
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
  function playerAct() {
    if (!mountedRef.current || phaseRef.current !== 'fight') return;

    // A kill just landed and the enemy is mid-respawn (see the 900ms
    // setTimeout below) — nothing to swing at yet, just wait our turn out.
    if (enemyRef.current.hp <= 0) { schedulePlayer(nextPlayerDelay()); return; }

    const playerStunned = hasCC(playerCCRef.current, 'stun') || hasCC(playerCCRef.current, 'sleep');
    const enemyStunned = hasCC(enemyCCRef.current, 'stun') || hasCC(enemyCCRef.current, 'sleep');

    {
      const stats = computePlayerStats();
      let dmg = 0, crit = false, abilityTag = '', statusLine = '', missed = false, playerHitMagical = false;

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
          cooldownsRef.current[chosen.id] = applyCd(chosen.cooldown, stats.cooldownReductionPct);
          const line = resolveSelfAbility(chosen, stats);
          if (line) pushLog(line);
        } else {
          const offenseAbility = chosen;
          const enemyEvasion = enemyStunned ? 0 : computeEnemyEvasion();
          missed = rollMiss(stats.accuracy, enemyEvasion);

          if (missed) {
            pushLog(`Seu ataque erra ${enemyRef.current.name}!`);
            pushFloat('enemy', 0, false, false, true);
          } else if (offenseAbility) {
            cooldownsRef.current[offenseAbility.id] = applyCd(offenseAbility.cooldown, stats.cooldownReductionPct);
            const eff = offenseAbility.effect;
            // Abilities from magical classes cast as spells by default (matk vs
            // mdef); basic attacks (the `else` branch below) are always
            // physical regardless of class — only an ability's own dmgType
            // override or the caster's class decides which channel a spell uses.
            const dmgType = eff.dmgType ?? (MAGICAL_CLASSES.includes(chRef.current.classId) ? 'magical' : 'physical');
            playerHitMagical = dmgType === 'magical';
            const power = dmgType === 'magical' ? stats.matk : stats.atk;
            const effDef = Math.max(0, (dmgType === 'magical' ? computeEnemyMdef() : computeEnemyDef()) * (1 - stats.defPenPct));
            const r = rollAbilityHit(power, effDef, eff.dmgMult ?? 1, stats.critChance, stats.critDmgMult, eff.kind === 'guaranteedCrit');
            dmg = r.dmg; crit = r.crit;
            abilityTag = ` [${offenseAbility.name}]`;
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
                statusLine = ' Você ganha um efeito temporário!';
              } else {
                enemyModsRef.current.push({ stat: eff.statMod, pct: eff.statModPct ?? -0.2, roundsLeft: eff.statModRounds ?? 3 });
                statusLine = ` ${enemyRef.current.name} foi enfraquecido!`;
              }
            }
          } else {
            const effDef = Math.max(0, computeEnemyDef() * (1 - stats.defPenPct));
            const r = rollAttack(stats.atk, effDef, stats.critChance, stats.critDmgMult);
            dmg = r.dmg; crit = r.crit;
          }

          // Conditional passives ("+15% dano contra inimigo envenenado") and
          // Vulnerability-family debuffs apply on top of whatever hit landed.
          if (!missed) {
            if (enemyStatusRef.current.some((s) => s.kind === 'poison') && stats.dmgPctVsPoison > 0) dmg = Math.round(dmg * (1 + stats.dmgPctVsPoison));
            if (enemyStatusRef.current.some((s) => s.kind === 'burn') && stats.dmgPctVsBurn > 0) dmg = Math.round(dmg * (1 + stats.dmgPctVsBurn));
            if (getModTotal(enemyModsRef.current, 'dmgTakenPct') !== 0) dmg = Math.max(1, Math.round(dmg * (1 + getModTotal(enemyModsRef.current, 'dmgTakenPct'))));
          }
        }
      }

      if (!missed && dmg > 0) {
        const enemyHp = Math.max(0, enemyRef.current.hp - dmg);
        updateEnemy({ ...enemyRef.current, hp: enemyHp });
        pushFloat('enemy', dmg, crit);
        flash('enemy');
        if (playerHitMagical) playMagicAttackSfx(); else playPhysicalAttackSfx();
        pushLog(`Você acerta ${enemyRef.current.name} em ${dmg}${crit ? ' (crítico!)' : ''}${abilityTag}.${statusLine}`);

        if (stats.lifestealPct > 0 || (crit && stats.onCritHealPct > 0)) {
          const maxHp = effectiveMaxHp(chRef.current);
          const healAmount = Math.round(dmg * stats.lifestealPct) + (crit ? Math.round(maxHp * stats.onCritHealPct) : 0);
          if (healAmount > 0) updateCh({ ...chRef.current, hp: Math.min(maxHp, chRef.current.hp + healAmount) });
        }

        if (enemyHp <= 0) {
          const prevLevel = chRef.current.level;
          const isBossKill = enemyRef.current.isBoss === true;
          const bossBonusGold = isBossKill ? Math.round(enemyRef.current.goldReward * 0.5) : 0;
          const xpGain = Math.round(enemyRef.current.xpReward * (dungeon.xpMult ?? 1));
          const goldGain = Math.round(enemyRef.current.goldReward * (dungeon.goldMult ?? 1)) + bossBonusGold;
          const withXp = grantXp(chRef.current, xpGain);
          const finalChar = { ...withXp, gold: withXp.gold + goldGain, bestDepth: Math.max(withXp.bestDepth, depthRef.current) };
          updateCh(finalChar);
          pushLog(`${enemyRef.current.name} foi derrotado! +${xpGain} XP, +${goldGain} de ouro.`);
          if (finalChar.level > prevLevel) pushLog(`Você subiu para o nível ${finalChar.level}!`);
          tryDropEquipment(isBossKill);

          if (isBossKill) {
            setTimeout(() => {
              if (!mountedRef.current) return;
              pushLog(`Você derrotou o guardião de ${dungeon.name} — masmorra concluída!`);
              phaseRef.current = 'ended';
              setEndedReason('victory');
              setPhase('ended');
            }, 900);
            return;
          }

          setTimeout(() => {
            if (!mountedRef.current) return;
            const nextDepth = depthRef.current + 1;
            updateDepth(nextDepth);
            updateEnemy(spawnEnemy(nextDepth, dungeon));
            enemyStatusRef.current = [];
            enemyModsRef.current = [];
            enemyCCRef.current = [];
            syncEnemyStatuses();
            syncEnemyCC();
            schedulePlayer(nextPlayerDelay());
          }, 900);
          return;
        }
      }
    }

    schedulePlayer(nextPlayerDelay());
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
      pushFloat('player', 0, false, false, true);
      pushLog(`${enemyRef.current.name} erra o ataque!`);
      scheduleEnemy();
      return;
    }

    // Only the shapes explicitly flagged atkType: 'magical' (Dragão,
    // Aberração) roll their attack as a spell against the player's mdef —
    // everyone else attacks physically, same as always.
    const enemyAtkType = enemyRef.current.atkType ?? 'physical';
    const enemyPower = enemyAtkType === 'magical' ? computeEnemyMatk() : computeEnemyAtk();
    const enemyDefStat = enemyAtkType === 'magical' ? defStats.mdef : defStats.def;
    const { dmg: rawDmg, crit: ecrit } = rollAttack(enemyPower, enemyDefStat, 0.06);
    let edmg = Math.round(rawDmg * (dungeon.dmgTakenMult ?? 1) * (1 + defStats.dmgTakenPct));
    const blocked = Math.random() < defStats.blockChance;
    if (blocked) edmg = Math.round(edmg * 0.5);

    let shieldAbsorbed = 0;
    if (playerShieldRef.current > 0 && edmg > 0) {
      shieldAbsorbed = Math.min(playerShieldRef.current, edmg);
      playerShieldRef.current -= shieldAbsorbed;
      edmg -= shieldAbsorbed;
      syncShield();
    }

    const hp = Math.max(0, chRef.current.hp - edmg);
    updateCh({ ...chRef.current, hp });
    pushFloat('player', edmg, ecrit, blocked);
    if (enemyAtkType === 'magical') playMagicAttackSfx(); else playPhysicalAttackSfx();
    if (edmg > 0) playHurtSfx();
    flash('player');
    const shieldTag = shieldAbsorbed > 0 ? ` (escudo absorveu ${shieldAbsorbed})` : '';
    pushLog(`${enemyRef.current.name} acerta você em ${edmg}${ecrit ? ' (crítico!)' : ''}${blocked ? ' — parcialmente bloqueado!' : ''}${shieldTag}.`);

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
      if (reflected > 0) updateEnemy({ ...enemyRef.current, hp: Math.max(1, enemyRef.current.hp - reflected) });
    }

    // The enemy's signature proc — a chance-based extra debuff riding
    // its normal attack, skipped if the enemy is silenced or the player
    // is shielded by Immunity.
    if (!hasCC(enemyCCRef.current, 'silence') && edmg + shieldAbsorbed > 0) {
      const proc = enemyRef.current.proc;
      if (proc && Math.random() < proc.chance && !playerImmune()) {
        if (proc.status) {
          playerStatusRef.current.push({ kind: proc.status, roundsLeft: proc.rounds, dmgPerTick: Math.max(1, Math.round(enemyPower * 0.35)) });
          syncPlayerStatuses();
        } else if (proc.cc) {
          playerCCRef.current.push({ kind: proc.cc, roundsLeft: proc.rounds });
          syncPlayerCC();
        } else if (proc.statMod) {
          playerModsRef.current.push({ stat: proc.statMod, pct: proc.statModPct ?? -0.15, roundsLeft: proc.rounds });
        }
        pushLog(proc.label);
      }
    }

    if (hp <= 0) {
      pushLog('Você caiu em combate...');
      phaseRef.current = 'ended';
      setEndedReason('death');
      setPhase('ended');
      return;
    }
    scheduleEnemy();
  }

  function maybeAutoHeal() {
    const c = chRef.current;
    const maxHp = effectiveMaxHp(c);
    if (c.hp / maxHp > c.potionThreshold || c.potions <= 0 || potionCooldownRef.current > 0) return;
    const prevHp = c.hp;
    const heal = Math.round(maxHp * (BASE_POTION_HEAL_PCT + kingdomBonuses.potionHealBonusPct));
    const healed = Math.min(maxHp, c.hp + heal);
    updateCh({ ...c, hp: healed, potions: c.potions - 1 });
    potionCooldownRef.current = POTION_COOLDOWN_ROUNDS;
    pushLog(`Vida baixa — você bebe uma poção e recupera ${healed - prevHp} de vida.`);
  }

  function drinkPotionManually() {
    const c = chRef.current;
    const maxHp = effectiveMaxHp(c);
    if (phaseRef.current !== 'fight' || c.potions <= 0 || c.hp >= maxHp || potionCooldownRef.current > 0) return;
    const prevHp = c.hp;
    const heal = Math.round(maxHp * (BASE_POTION_HEAL_PCT + kingdomBonuses.potionHealBonusPct));
    const healed = Math.min(maxHp, c.hp + heal);
    updateCh({ ...c, hp: healed, potions: c.potions - 1 });
    potionCooldownRef.current = POTION_COOLDOWN_ROUNDS;
    pushLog(`Você bebe uma poção e recupera ${healed - prevHp} de vida.`);
  }

  function togglePause() {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (!next) {
      scheduleEnv(500);
      schedulePlayer(500);
      scheduleEnemy(500);
    }
  }

  function retreatSafely() {
    phaseRef.current = 'ended';
    setEndedReason('retreat');
    setPhase('ended');
  }

  function confirmReturnToHub() {
    onRunEnd(
      { ...chRef.current, bestDepth: Math.max(chRef.current.bestDepth, depthRef.current) },
      depthRef.current,
      endedReason ?? 'retreat',
    );
  }

  // Kick off the auto-battle loop once, and make sure no stray timeout
  // touches state after this panel is unmounted (leaving for another section).
  useEffect(() => {
    mountedRef.current = true;
    scheduleEnv(700);
    schedulePlayer(700);
    scheduleEnemy(700 + LEAN_MS + 120);
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Battle music swaps in for the kingdom loop for the duration of the
  // fight, switching to the boss track the instant the guardian spawns, and
  // handing playback back to the kingdom loop (picking up where it left
  // off) on the way out.
  useEffect(() => {
    if (phase !== 'fight') return;
    if (enemy.isBoss) playBossMusic(); else playBattleMusic();
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
        drawSprite(g, heroSpr.idle, px1, groundY, false, flashSide === 'player' ? 0.7 : 0);
        drawSprite(g, enemySprite(enemy.shape), ex, groundY, false, flashSide === 'enemy' ? 0.7 : 0);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ch.classId, enemy.shape, phase, flashSide, heroSpr]);

  const hpPct = (v: number, max: number) => Math.max(0, Math.min(100, (v / max) * 100));
  const weapon = ch.equipment.weapon;
  const effMaxHp = effectiveMaxHp(ch);
  const allStatusLabel: Record<StatusEffectKind, string> = STATUS_LABEL;
  const playerTags = [...playerStatuses.map((s) => allStatusLabel[s]), ...playerCCState.map((c) => CC_LABEL[c])];
  const enemyTags = [...enemyStatuses.map((s) => allStatusLabel[s]), ...enemyCCState.map((c) => CC_LABEL[c])];
  // Progress toward the dungeon's own boss, replacing the old raw
  // "Profundidade N" floor counter — every dungeon now has a defined end
  // (bossDepth), so a fill bar communicates "how close to done" far better
  // than an ever-climbing number ever did. Once the boss itself is up, the
  // marker/fill snap to 100% regardless of the raw depth fraction (the boss
  // sits AT bossDepth, not past it).
  const depthPct = (d: number) => Math.round(Math.max(0, Math.min(1, (d - dungeon.startDepth) / (dungeon.bossDepth - dungeon.startDepth))) * 100);
  const dungeonProgressPct = depthPct(depth);
  const playerBarPct = enemy.isBoss ? 100 : dungeonProgressPct;
  const miniBossPcts = (dungeon.miniBossDepths ?? []).map(depthPct);

  return (
    <Panel title={dungeon.name}>
      {phase === 'fight' && (
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
            <span className="font-display text-crimson text-xs sm:text-sm uppercase tracking-[0.1em] truncate">✦ {enemy.name}</span>
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
        <canvas ref={canvasRef} width={640} height={280} className="w-full block" style={{ imageRendering: 'pixelated' }} />
        {floaters.map((f) => (
          <div
            key={f.id}
            className={`absolute font-bold text-lg pointer-events-none animate-[float_0.9s_ease-out_forwards] ${
              f.side === 'player' ? 'text-red-400 left-[24%]' : 'text-yellow-300 left-[68%]'
            }`}
            style={{ top: '38%' }}
          >
            {f.miss ? <span className="text-sm text-parchment/60">erro!</span> : (
              <>-{f.value}{f.crit ? '!' : ''}{f.blocked ? <span className="text-xs text-sky-300 align-top"> bloq.</span> : ''}</>
            )}
          </div>
        ))}
        {paused && phase === 'fight' && (
          <div className="absolute top-2 right-2 bg-black/70 text-gold text-xs font-bold uppercase tracking-wider px-2 py-1 rounded">
            Pausado
          </div>
        )}
        {dungeon.special && (
          <div className="absolute top-2 left-2 bg-black/70 text-gold text-xs font-bold px-2 py-1 rounded">
            ✦ Masmorra Especial
          </div>
        )}
        {phase === 'ended' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 px-6">
            <div className="text-center">
              <p className="font-display text-lg sm:text-xl text-gold [text-shadow:0_2px_6px_rgba(0,0,0,0.9)] mb-4">
                {endedReason === 'victory' && `Você derrotou o guardião de ${dungeon.name} — masmorra concluída!`}
                {endedReason === 'death' && 'Sua expedição terminou.'}
                {endedReason === 'retreat' && 'Você retornou em segurança.'}
              </p>
              <Button onClick={confirmReturnToHub}>Voltar ao Reino</Button>
            </div>
          </div>
        )}
      </div>

      {weapon && (
        <p className="mt-2 text-xs text-parchment/50">
          Empunhando: <span style={{ color: rarityColor(weapon.rarity) }}>{itemDisplayName(weapon)}</span>
        </p>
      )}

      {phase === 'fight' && equippedAbilities().length > 0 && (
        <div className="flex gap-2 mt-3">
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
              <span className="truncate">{enemy.name}</span>
              <span className="shrink-0">{Math.max(0, enemy.hp)}/{enemy.maxHp}</span>
            </div>
            <div className="h-2 bg-black/50 rounded"><div className="h-2 bg-yellow-500 rounded" style={{ width: `${hpPct(enemy.hp, enemy.maxHp)}%` }} /></div>
            {phase === 'fight' && <AtbBar roundKey={enemyRoundKey} roundMs={enemyRoundMs} paused={paused} colorClass="bg-amber-400" />}
            {enemyTags.length > 0 && <div className="text-[11px] text-green-400/90 mt-0.5 truncate">{enemyTags.join(', ')}</div>}
          </div>
        )}
      </div>

      {phase === 'fight' && (
        <div className="mt-4 flex gap-2 flex-wrap">
          <Button onClick={togglePause}>
            {paused ? 'Retomar Combate' : 'Pausar'}
          </Button>
          <Button onClick={drinkPotionManually} disabled={ch.potions <= 0 || ch.hp >= effMaxHp || potionCooldownRef.current > 0}>
            Poção ({ch.potions}){potionCooldownRef.current > 0 ? ` — ${potionCooldownRef.current}` : ''}
          </Button>
          <Button onClick={retreatSafely}>Retornar ao Reino</Button>
        </div>
      )}

      <div className="mt-3 bg-black/30 border border-white/10 rounded p-2 h-24 overflow-y-auto text-sm text-parchment/80 flex flex-col-reverse">
        <div>
          {log.slice().reverse().map((l, i) => <p key={i} className="leading-tight py-0.5">{l}</p>)}
        </div>
      </div>
    </Panel>
  );
}
