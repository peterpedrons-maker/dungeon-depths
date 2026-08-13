import { useEffect, useRef, useState } from 'react';
import {
  AbilityDef, Character, CrowdControlKind, EnemyInstance, DungeonDef, ItemSlot, KingdomBonuses,
  StatModStat, StatusEffectKind,
} from '../types/game';
import { spawnEnemy } from '../lib/enemies';
import { grantXp, MAGICAL_CLASSES } from '../lib/classes';
import { computeCombatStats, effectiveMaxHp } from '../lib/combatStats';
import { generateItem, rarityColor } from '../lib/equipment';
import { getEquippedAbilities } from '../lib/skills';
import { rollAttack, rollAbilityHit } from '../game/combat';
import { heroSprites, enemySprite, drawSprite } from '../game/sprites';
import { Panel } from './Panel';
import { Button } from './Button';

const ATTACK_INTERVAL = 1600;
const LEAN_MS = 260;
const HEAL_THRESHOLD = 0.35;
const BASE_DROP_CHANCE = 0.12;
const BASE_POTION_HEAL_PCT = 0.4;
const DROP_SLOTS: ItemSlot[] = ['weapon', 'body', 'legs', 'hands', 'accessory'];
// Self-targeted kinds fire as a bonus action alongside the round's attack —
// they never compete for it. Enemy-targeted kinds (applyStatus, bonusVsStatus,
// crowdControl, statMod w/ target:'enemy') compete for the one attack action,
// exactly like bigHit always has.
const SELF_ABILITY_KINDS = ['heal', 'buffDef', 'buffBlock', 'shield', 'regen', 'immunity', 'haste', 'berserk', 'dispel', 'taunt'];
const MISS_CHANCE_CAP = 0.45;

const STATUS_LABEL: Record<StatusEffectKind, string> = { poison: 'Envenenado', burn: 'Em Chamas', bleed: 'Sangrando', curse: 'Amaldiçoado' };
const STATUS_VERB: Record<StatusEffectKind, string> = { poison: 'envenenado', burn: 'incendiado', bleed: 'posto a sangrar', curse: 'amaldiçoado' };
const STATUS_TICK_LABEL: Record<StatusEffectKind, string> = { poison: 'veneno', burn: 'queimadura', bleed: 'sangramento', curse: 'maldição' };
const CC_LABEL: Record<CrowdControlKind, string> = { stun: 'Atordoado', sleep: 'Dormindo', silence: 'Silenciado' };

interface StatusInstance { kind: StatusEffectKind; roundsLeft: number; dmgPerTick: number; }
interface PlayerBuff { kind: 'def' | 'block'; pct: number; roundsLeft: number; }
interface StatModInstance { stat: StatModStat; pct: number; roundsLeft: number; }
interface CCInstance { kind: CrowdControlKind; roundsLeft: number; }
interface RegenInstance { pct: number; roundsLeft: number; }
interface FloatingNumber { id: number; side: 'player' | 'enemy'; value: number; crit: boolean; blocked?: boolean; miss?: boolean }
interface Props {
  character: Character;
  dungeon: DungeonDef;
  kingdomBonuses: KingdomBonuses;
  onLiveUpdate: (c: Character) => void;
  onRunEnd: (finalCharacter: Character, deepestDepth: number) => void;
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

export function DungeonPanel({ character, dungeon, kingdomBonuses, onLiveUpdate, onRunEnd }: Props) {
  const [ch, setCh] = useState<Character>(character);
  const [depth, setDepth] = useState(dungeon.startDepth);
  const [enemy, setEnemy] = useState<EnemyInstance>(() => spawnEnemy(dungeon.startDepth, dungeon.enemyPool));
  const [phase, setPhase] = useState<Phase>('fight');
  const [paused, setPaused] = useState(false);
  const [log, setLog] = useState<string[]>([`Você entra em ${dungeon.name}...`]);
  const [floaters, setFloaters] = useState<FloatingNumber[]>([]);
  const [playerLean, setPlayerLean] = useState(0);
  const [enemyLean, setEnemyLean] = useState(0);
  const [flashSide, setFlashSide] = useState<'player' | 'enemy' | null>(null);
  const [endedReason, setEndedReason] = useState<'death' | 'retreat' | null>(null);
  const [enemyStatuses, setEnemyStatuses] = useState<StatusEffectKind[]>([]);
  const [playerStatuses, setPlayerStatuses] = useState<StatusEffectKind[]>([]);
  const [enemyCCState, setEnemyCCState] = useState<CrowdControlKind[]>([]);
  const [playerCCState, setPlayerCCState] = useState<CrowdControlKind[]>([]);
  const [playerShieldState, setPlayerShieldState] = useState(0);
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

  function scheduleTick(delay = ATTACK_INTERVAL) {
    setTimeout(() => {
      if (!mountedRef.current) return;
      if (!pausedRef.current && phaseRef.current === 'fight') runRound();
    }, delay);
  }

  function tryDropEquipment() {
    const stats = computeCombatStats(chRef.current);
    const chance = Math.min(0.6, BASE_DROP_CHANCE * (dungeon.dropMult ?? 1) + kingdomBonuses.dropChanceBonusPct + stats.dropChanceBonusPct);
    if (Math.random() >= chance) return;
    const slot = DROP_SLOTS[Math.floor(Math.random() * DROP_SLOTS.length)];
    const item = generateItem(slot, chRef.current.classId, depthRef.current, kingdomBonuses.itemQualityBonusPct + stats.itemQualityBonusPct);
    updateCh({ ...chRef.current, inventory: [...chRef.current.inventory, item] });
    pushLog(`Você encontrou: ${item.name}!`);
  }

  function conditionMet(ability: AbilityDef): boolean {
    const cond = ability.condition;
    if (cond.type === 'always') return true;
    if (cond.type === 'enemyHasStatus') return enemyStatusRef.current.some((s) => s.kind === cond.status);
    if (cond.type === 'hpBelow') return chRef.current.hp / effectiveMaxHp(chRef.current) < (cond.pct ?? 0.5);
    if (cond.type === 'enemyHpBelow') return enemyRef.current.hp / enemyRef.current.maxHp < (cond.pct ?? 0.5);
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

  // Self-targeted abilities fire as a bonus action alongside the normal
  // attack, whenever off cooldown and their condition is met — they don't
  // compete for the round's one attack action. Heal/buff magnitudes scale
  // with supportPowerPct (WIS), so a healer/support build gets more out of
  // the exact same ability list.
  function fireSelfAbilities(stats: ReturnType<typeof computePlayerStats>): string[] {
    const lines: string[] = [];
    const supportMult = 1 + stats.supportPowerPct;
    for (const ab of equippedAbilities()) {
      if (!SELF_ABILITY_KINDS.includes(ab.effect.kind)) continue;
      if ((cooldownsRef.current[ab.id] ?? 0) > 0) continue;
      if (!conditionMet(ab)) continue;
      cooldownsRef.current[ab.id] = applyCd(ab.cooldown, stats.cooldownReductionPct);
      const eff = ab.effect;
      if (eff.kind === 'heal') {
        const maxHp = effectiveMaxHp(chRef.current);
        const healed = Math.min(maxHp, chRef.current.hp + Math.round(maxHp * (eff.healPct ?? 0.2) * supportMult));
        updateCh({ ...chRef.current, hp: healed });
        lines.push(`${ab.name}: você recupera vida.`);
      } else if (eff.kind === 'buffDef') {
        playerBuffsRef.current.push({ kind: 'def', pct: (eff.buffPct ?? 0.2) * supportMult, roundsLeft: eff.buffRounds ?? 3 });
        lines.push(`${ab.name}: sua defesa aumenta.`);
      } else if (eff.kind === 'buffBlock') {
        playerBuffsRef.current.push({ kind: 'block', pct: (eff.buffPct ?? 0.2) * supportMult, roundsLeft: eff.buffRounds ?? 3 });
        lines.push(`${ab.name}: sua chance de bloqueio aumenta.`);
      } else if (eff.kind === 'shield') {
        const amount = Math.round(effectiveMaxHp(chRef.current) * (eff.shieldPct ?? 0.25) * supportMult);
        playerShieldRef.current += amount;
        syncShield();
        lines.push(`${ab.name}: um escudo absorve ${amount} de dano.`);
      } else if (eff.kind === 'regen') {
        playerRegenRef.current.push({ pct: (eff.regenPct ?? 0.08) * supportMult, roundsLeft: eff.regenRounds ?? 4 });
        lines.push(`${ab.name}: você começa a regenerar vida.`);
      } else if (eff.kind === 'immunity') {
        playerImmuneRoundsRef.current = Math.max(playerImmuneRoundsRef.current, eff.immunityRounds ?? 3);
        lines.push(`${ab.name}: você fica imune a novos efeitos negativos.`);
      } else if (eff.kind === 'haste') {
        playerHasteRoundsRef.current = Math.max(playerHasteRoundsRef.current, eff.hasteRounds ?? 4);
        lines.push(`${ab.name}: suas habilidades recarregam mais rápido.`);
      } else if (eff.kind === 'berserk') {
        playerModsRef.current.push({ stat: 'atk', pct: eff.berserkAtkPct ?? 0.3, roundsLeft: eff.berserkRounds ?? 4 });
        playerModsRef.current.push({ stat: 'def', pct: eff.berserkDefPct ?? -0.2, roundsLeft: eff.berserkRounds ?? 4 });
        lines.push(`${ab.name}: fúria berserker — mais dano, menos defesa.`);
      } else if (eff.kind === 'taunt') {
        // Provoca o inimigo — hoje é só a redução de dano recebido (útil já
        // em 1v1); a parte de "forçar o alvo" fica pronta para quando um
        // sistema de múltiplos inimigos/coop existir.
        playerModsRef.current.push({ stat: 'dmgTakenPct', pct: eff.buffPct ?? -0.20, roundsLeft: eff.buffRounds ?? 4 });
        lines.push(`${ab.name}: você provoca o inimigo, reduzindo o dano recebido.`);
      } else if (eff.kind === 'dispel') {
        playerModsRef.current = playerModsRef.current.filter((m) => m.pct >= 0);
        playerStatusRef.current = [];
        playerCCRef.current = [];
        syncPlayerStatuses();
        syncPlayerCC();
        lines.push(`${ab.name}: você remove os efeitos negativos.`);
      }
    }
    return lines;
  }

  // The one offensive ability the priority list picks for this round's
  // attack, if any is off cooldown and its condition is met — otherwise the
  // round falls back to a plain attack. Silence blocks this entirely.
  function pickOffenseAbility(): AbilityDef | null {
    if (hasCC(playerCCRef.current, 'silence')) return null;
    for (const ab of equippedAbilities()) {
      if (SELF_ABILITY_KINDS.includes(ab.effect.kind)) continue;
      if ((cooldownsRef.current[ab.id] ?? 0) > 0) continue;
      if (!conditionMet(ab)) continue;
      return ab;
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

  function runRound() {
    if (!mountedRef.current || phaseRef.current !== 'fight') return;

    const hasteBonus = playerHasteRoundsRef.current > 0 ? 1 : 0;
    for (const id in cooldownsRef.current) cooldownsRef.current[id] = Math.max(0, cooldownsRef.current[id] - (1 + hasteBonus));
    if (playerHasteRoundsRef.current > 0) playerHasteRoundsRef.current -= 1;
    if (playerImmuneRoundsRef.current > 0) playerImmuneRoundsRef.current -= 1;
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

    const playerStunned = hasCC(playerCCRef.current, 'stun') || hasCC(playerCCRef.current, 'sleep');
    playerCCRef.current = tickCC(playerCCRef.current);
    syncPlayerCC();
    const enemyStunned = hasCC(enemyCCRef.current, 'stun') || hasCC(enemyCCRef.current, 'sleep');
    enemyCCRef.current = tickCC(enemyCCRef.current);
    syncEnemyCC();

    setPlayerLean(1);
    setTimeout(() => {
      if (!mountedRef.current) return;
      setPlayerLean(0);

      const baseStats = computePlayerStats();
      let dmg = 0, crit = false, abilityTag = '', statusLine = '', missed = false;

      if (!playerStunned) {
        const selfLines = fireSelfAbilities(baseStats);
        selfLines.forEach(pushLog);
      }

      const stats = computePlayerStats();

      if (playerStunned) {
        pushLog('Você está incapacitado e não consegue atacar!');
      } else {
        const offenseAbility = pickOffenseAbility();
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
              playerModsRef.current.push({ stat: eff.statMod, pct: eff.statModPct ?? 0.2, roundsLeft: eff.statModRounds ?? 3 });
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

      if (!missed && dmg > 0) {
        const enemyHp = Math.max(0, enemyRef.current.hp - dmg);
        updateEnemy({ ...enemyRef.current, hp: enemyHp });
        pushFloat('enemy', dmg, crit);
        flash('enemy');
        pushLog(`Você acerta ${enemyRef.current.name} em ${dmg}${crit ? ' (crítico!)' : ''}${abilityTag}.${statusLine}`);

        if (stats.lifestealPct > 0 || (crit && stats.onCritHealPct > 0)) {
          const maxHp = effectiveMaxHp(chRef.current);
          const healAmount = Math.round(dmg * stats.lifestealPct) + (crit ? Math.round(maxHp * stats.onCritHealPct) : 0);
          if (healAmount > 0) updateCh({ ...chRef.current, hp: Math.min(maxHp, chRef.current.hp + healAmount) });
        }

        if (enemyHp <= 0) {
          const prevLevel = chRef.current.level;
          const xpGain = Math.round(enemyRef.current.xpReward * (dungeon.xpMult ?? 1) * (1 + kingdomBonuses.xpBonusPct));
          const goldGain = Math.round(enemyRef.current.goldReward * (dungeon.goldMult ?? 1));
          const withXp = grantXp(chRef.current, xpGain);
          const finalChar = { ...withXp, gold: withXp.gold + goldGain, bestDepth: Math.max(withXp.bestDepth, depthRef.current) };
          updateCh(finalChar);
          pushLog(`${enemyRef.current.name} foi derrotado! +${xpGain} XP, +${goldGain} de ouro.`);
          if (finalChar.level > prevLevel) pushLog(`Você subiu para o nível ${finalChar.level}!`);
          tryDropEquipment();

          setTimeout(() => {
            if (!mountedRef.current) return;
            const nextDepth = depthRef.current + 1;
            updateDepth(nextDepth);
            updateEnemy(spawnEnemy(nextDepth, dungeon.enemyPool));
            enemyStatusRef.current = [];
            enemyModsRef.current = [];
            enemyCCRef.current = [];
            syncEnemyStatuses();
            syncEnemyCC();
            pushLog(`Você avança mais fundo em ${dungeon.name}. Profundidade ${nextDepth}.`);
            scheduleTick();
          }, 900);
          return;
        }
      }

      setEnemyLean(1);
      setTimeout(() => {
        if (!mountedRef.current) return;
        setEnemyLean(0);
        maybeAutoHeal();

        if (enemyStunned) {
          pushLog(`${enemyRef.current.name} está incapacitado e não consegue atacar!`);
          scheduleTick();
          return;
        }

        const defStats = computePlayerStats();
        const enemyAccuracy = computeEnemyAccuracy();
        const enemyMissed = rollMiss(enemyAccuracy, defStats.evasion);

        if (enemyMissed) {
          pushFloat('player', 0, false, false, true);
          pushLog(`${enemyRef.current.name} erra o ataque!`);
          scheduleTick();
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
        scheduleTick();
      }, LEAN_MS + 120);
    }, LEAN_MS);
  }

  function maybeAutoHeal() {
    const c = chRef.current;
    const maxHp = effectiveMaxHp(c);
    if (c.hp / maxHp >= HEAL_THRESHOLD || c.potions <= 0) return;
    const prevHp = c.hp;
    const heal = Math.round(maxHp * (BASE_POTION_HEAL_PCT + kingdomBonuses.potionHealBonusPct));
    const healed = Math.min(maxHp, c.hp + heal);
    updateCh({ ...c, hp: healed, potions: c.potions - 1 });
    pushLog(`Vida baixa — você bebe uma poção e recupera ${healed - prevHp} de vida.`);
  }

  function drinkPotionManually() {
    const c = chRef.current;
    const maxHp = effectiveMaxHp(c);
    if (phaseRef.current !== 'fight' || c.potions <= 0 || c.hp >= maxHp) return;
    const prevHp = c.hp;
    const heal = Math.round(maxHp * (BASE_POTION_HEAL_PCT + kingdomBonuses.potionHealBonusPct));
    const healed = Math.min(maxHp, c.hp + heal);
    updateCh({ ...c, hp: healed, potions: c.potions - 1 });
    pushLog(`Você bebe uma poção e recupera ${healed - prevHp} de vida.`);
  }

  function togglePause() {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (!next) scheduleTick(500);
  }

  function retreatSafely() {
    phaseRef.current = 'ended';
    setEndedReason('retreat');
    setPhase('ended');
  }

  function confirmReturnToHub() {
    onRunEnd({ ...chRef.current, bestDepth: Math.max(chRef.current.bestDepth, depthRef.current) }, depthRef.current);
  }

  // Kick off the auto-battle loop once, and make sure no stray timeout
  // touches state after this panel is unmounted (leaving for another section).
  useEffect(() => {
    mountedRef.current = true;
    scheduleTick(700);
    return () => { mountedRef.current = false; };
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

      const groundY = h - 42;
      const bobP = Math.sin(t / 260) * 3;
      const bobE = Math.sin(t / 240 + 1) * 3;
      if (phase !== 'ended') {
        const px1 = w * 0.27, ex = w * 0.73;
        g.fillStyle = 'rgba(0,0,0,0.4)';
        g.beginPath(); g.ellipse(px1, groundY + 3, 16, 5, 0, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.ellipse(ex, groundY + 3, 16, 5, 0, 0, Math.PI * 2); g.fill();

        const heroFrame = playerLean ? heroSpr.attack : heroSpr.idle;
        drawSprite(g, heroFrame, px1, groundY + bobP, false, flashSide === 'player' ? 0.7 : 0, playerLean);
        drawSprite(g, enemySprite(enemy.shape), ex, groundY + bobE, false, flashSide === 'enemy' ? 0.7 : 0, enemyLean);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ch.classId, enemy.shape, phase, playerLean, enemyLean, flashSide, heroSpr]);

  const hpPct = (v: number, max: number) => Math.max(0, Math.min(100, (v / max) * 100));
  const weapon = ch.equipment.weapon;
  const effMaxHp = effectiveMaxHp(ch);
  const allStatusLabel: Record<StatusEffectKind, string> = STATUS_LABEL;
  const playerTags = [...playerStatuses.map((s) => allStatusLabel[s]), ...playerCCState.map((c) => CC_LABEL[c])];
  const enemyTags = [...enemyStatuses.map((s) => allStatusLabel[s]), ...enemyCCState.map((c) => CC_LABEL[c])];

  return (
    <Panel title={`${dungeon.name} — Profundidade ${depth}`}>
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
      </div>

      {weapon && (
        <p className="mt-2 text-xs text-parchment/50">
          Empunhando: <span style={{ color: rarityColor(weapon.rarity) }}>{weapon.name}</span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
        <div>
          <div className="flex justify-between items-baseline gap-2">
            <span className="truncate">{ch.name}{playerShieldState > 0 && <span className="text-sky-300 text-xs"> (+{playerShieldState} escudo)</span>}</span>
            <span className="shrink-0">{Math.max(0, ch.hp)}/{effMaxHp}</span>
          </div>
          <div className="h-2 bg-black/50 rounded"><div className="h-2 bg-red-500 rounded" style={{ width: `${hpPct(ch.hp, effMaxHp)}%` }} /></div>
          {playerTags.length > 0 && <div className="text-[11px] text-amber-300/90 mt-0.5 truncate">{playerTags.join(', ')}</div>}
        </div>
        <div>
          <div className="flex justify-between">
            <span className="truncate">{enemy.name}</span>
            <span className="shrink-0">{Math.max(0, enemy.hp)}/{enemy.maxHp}</span>
          </div>
          <div className="h-2 bg-black/50 rounded"><div className="h-2 bg-yellow-500 rounded" style={{ width: `${hpPct(enemy.hp, enemy.maxHp)}%` }} /></div>
          {enemyTags.length > 0 && <div className="text-[11px] text-green-400/90 mt-0.5 truncate">{enemyTags.join(', ')}</div>}
        </div>
      </div>

      <div className="mt-3 bg-black/30 border border-white/10 rounded p-2 h-24 overflow-y-auto text-sm text-parchment/80 flex flex-col-reverse">
        <div>
          {log.slice().reverse().map((l, i) => <p key={i} className="leading-tight py-0.5">{l}</p>)}
        </div>
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        {phase === 'fight' && (
          <>
            <Button onClick={togglePause}>
              {paused ? 'Retomar Combate' : 'Pausar'}
            </Button>
            <Button onClick={drinkPotionManually} disabled={ch.potions <= 0 || ch.hp >= effMaxHp}>
              Poção ({ch.potions})
            </Button>
            <Button onClick={retreatSafely}>Retornar ao Reino</Button>
          </>
        )}
        {phase === 'ended' && (
          <div className="w-full text-center">
            <p className="mb-3 text-parchment/80">
              {endedReason === 'death' ? 'Sua expedição terminou.' : 'Você retornou em segurança.'} Profundidade alcançada: {depth}.
            </p>
            <Button onClick={confirmReturnToHub}>Voltar ao Reino</Button>
          </div>
        )}
      </div>
    </Panel>
  );
}
