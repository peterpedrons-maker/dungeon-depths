import { useEffect, useRef, useState } from 'react';
import { AbilityDef, Character, EnemyInstance, DungeonDef, ItemSlot, KingdomBonuses, StatusEffectKind } from '../types/game';
import { spawnEnemy } from '../lib/enemies';
import { grantXp } from '../lib/classes';
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
const SELF_ABILITY_KINDS = ['heal', 'buffDef', 'buffBlock'];

interface StatusInstance { kind: StatusEffectKind; roundsLeft: number; dmgPerTick: number; }
interface PlayerBuff { kind: 'def' | 'block'; pct: number; roundsLeft: number; }
interface FloatingNumber { id: number; side: 'player' | 'enemy'; value: number; crit: boolean; blocked?: boolean; }
interface Props {
  character: Character;
  dungeon: DungeonDef;
  kingdomBonuses: KingdomBonuses;
  onLiveUpdate: (c: Character) => void;
  onRunEnd: (finalCharacter: Character, deepestDepth: number) => void;
}

type Phase = 'fight' | 'ended';

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

  // Ability engine state — session-only, reset whenever this dungeon run
  // starts (never persisted): cooldowns per ability id, active status
  // effects on the enemy (poison/burn DOT), and temporary buffs on the
  // player (from buffDef/buffBlock abilities).
  const cooldownsRef = useRef<Record<string, number>>({});
  const enemyStatusRef = useRef<StatusInstance[]>([]);
  const playerBuffsRef = useRef<PlayerBuff[]>([]);

  const heroSpr = heroSprites(ch.classId);

  function updateCh(next: Character) { chRef.current = next; setCh(next); onLiveUpdate(next); }
  function updateEnemy(next: EnemyInstance) { enemyRef.current = next; setEnemy(next); }
  function updateDepth(next: number) { depthRef.current = next; setDepth(next); }
  function syncEnemyStatuses() { setEnemyStatuses(enemyStatusRef.current.map((s) => s.kind)); }

  function pushLog(line: string) {
    setLog((l) => [...l.slice(-4), line]);
  }
  function pushFloat(side: 'player' | 'enemy', value: number, crit: boolean, blocked?: boolean) {
    const id = floaterId.current++;
    setFloaters((f) => [...f, { id, side, value, crit, blocked }]);
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
    const chance = Math.min(0.6, BASE_DROP_CHANCE * (dungeon.dropMult ?? 1) + kingdomBonuses.dropChanceBonusPct);
    if (Math.random() >= chance) return;
    const slot = DROP_SLOTS[Math.floor(Math.random() * DROP_SLOTS.length)];
    const item = generateItem(slot, chRef.current.classId, depthRef.current, kingdomBonuses.itemQualityBonusPct);
    updateCh({ ...chRef.current, inventory: [...chRef.current.inventory, item] });
    pushLog(`Você encontrou: ${item.name}!`);
  }

  function conditionMet(ability: AbilityDef): boolean {
    const cond = ability.condition;
    if (cond.type === 'always') return true;
    if (cond.type === 'enemyHasStatus') return enemyStatusRef.current.some((s) => s.kind === cond.status);
    if (cond.type === 'hpBelow') return chRef.current.hp / effectiveMaxHp(chRef.current) < (cond.pct ?? 0.5);
    return false;
  }

  function equippedAbilities(): AbilityDef[] {
    const c = chRef.current;
    return getEquippedAbilities(c.classId, c.unlockedSkills, c.equippedAbilities);
  }

  // Self-targeted abilities (heal/buffDef/buffBlock) fire as a bonus action
  // alongside the normal attack, whenever off cooldown and their condition
  // is met — they don't compete for the round's one attack action.
  function fireSelfAbilities(): string[] {
    const lines: string[] = [];
    for (const ab of equippedAbilities()) {
      if (!SELF_ABILITY_KINDS.includes(ab.effect.kind)) continue;
      if ((cooldownsRef.current[ab.id] ?? 0) > 0) continue;
      if (!conditionMet(ab)) continue;
      cooldownsRef.current[ab.id] = ab.cooldown;
      if (ab.effect.kind === 'heal') {
        const maxHp = effectiveMaxHp(chRef.current);
        const healed = Math.min(maxHp, chRef.current.hp + Math.round(maxHp * (ab.effect.healPct ?? 0.2)));
        updateCh({ ...chRef.current, hp: healed });
        lines.push(`${ab.name}: você recupera vida.`);
      } else if (ab.effect.kind === 'buffDef') {
        playerBuffsRef.current.push({ kind: 'def', pct: ab.effect.buffPct ?? 0.2, roundsLeft: ab.effect.buffRounds ?? 3 });
        lines.push(`${ab.name}: sua defesa aumenta.`);
      } else if (ab.effect.kind === 'buffBlock') {
        playerBuffsRef.current.push({ kind: 'block', pct: ab.effect.buffPct ?? 0.2, roundsLeft: ab.effect.buffRounds ?? 3 });
        lines.push(`${ab.name}: sua chance de esquiva aumenta.`);
      }
    }
    return lines;
  }

  // The one offensive ability the priority list picks for this round's
  // attack, if any is off cooldown and its condition is met — otherwise the
  // round falls back to a plain attack.
  function pickOffenseAbility(): AbilityDef | null {
    for (const ab of equippedAbilities()) {
      if (SELF_ABILITY_KINDS.includes(ab.effect.kind)) continue;
      if ((cooldownsRef.current[ab.id] ?? 0) > 0) continue;
      if (!conditionMet(ab)) continue;
      return ab;
    }
    return null;
  }

  function applyTempBuffs(stats: ReturnType<typeof computeCombatStats>) {
    let defMult = 1, blockAdd = 0;
    for (const b of playerBuffsRef.current) {
      if (b.kind === 'def') defMult *= 1 + b.pct;
      else blockAdd += b.pct;
    }
    return { ...stats, def: Math.round(stats.def * defMult), blockChance: Math.min(0.6, stats.blockChance + blockAdd) };
  }

  // Poison/burn tick at the start of every round. Deliberately never lets a
  // DOT tick finish the kill outright (clamped to 1 HP) — reward granting
  // (XP/gold/depth advance) only happens from the direct attack-roll
  // codepath below, so a DOT "kill" would otherwise vanish silently.
  function tickEnemyStatus(): string | null {
    if (enemyStatusRef.current.length === 0) return null;
    const ticking = enemyStatusRef.current;
    const totalDmg = ticking.reduce((s, e) => s + e.dmgPerTick, 0);
    enemyStatusRef.current = ticking
      .map((s) => ({ ...s, roundsLeft: s.roundsLeft - 1 }))
      .filter((s) => s.roundsLeft > 0);
    syncEnemyStatuses();
    if (totalDmg <= 0) return null;
    const newHp = Math.max(1, enemyRef.current.hp - totalDmg);
    updateEnemy({ ...enemyRef.current, hp: newHp });
    const label = ticking.some((s) => s.kind === 'poison') ? 'veneno' : 'queimadura';
    return `${enemyRef.current.name} sofre ${totalDmg} de dano de ${label}.`;
  }

  function runRound() {
    if (!mountedRef.current || phaseRef.current !== 'fight') return;

    for (const id in cooldownsRef.current) cooldownsRef.current[id] = Math.max(0, cooldownsRef.current[id] - 1);
    const dotLine = tickEnemyStatus();
    if (dotLine) pushLog(dotLine);

    setPlayerLean(1);
    setTimeout(() => {
      if (!mountedRef.current) return;
      setPlayerLean(0);

      const selfLines = fireSelfAbilities();
      selfLines.forEach(pushLog);

      const stats = applyTempBuffs(computeCombatStats(chRef.current));
      const offenseAbility = pickOffenseAbility();
      let dmg: number, crit: boolean, abilityTag = '';
      let statusLine = '';

      if (offenseAbility) {
        cooldownsRef.current[offenseAbility.id] = offenseAbility.cooldown;
        const eff = offenseAbility.effect;
        const r = rollAbilityHit(stats.atk, enemyRef.current.def, eff.dmgMult ?? 1, stats.critChance, stats.critDmgMult, eff.kind === 'guaranteedCrit');
        dmg = r.dmg; crit = r.crit;
        abilityTag = ` [${offenseAbility.name}]`;
        if (eff.kind === 'applyStatus' && eff.status) {
          enemyStatusRef.current.push({ kind: eff.status, roundsLeft: eff.statusRounds ?? 3, dmgPerTick: Math.max(1, Math.round(stats.atk * (eff.statusDmgPct ?? 0.4))) });
          syncEnemyStatuses();
          statusLine = ` ${enemyRef.current.name} foi ${eff.status === 'poison' ? 'envenenado' : 'incendiado'}!`;
        }
      } else {
        const r = rollAttack(stats.atk, enemyRef.current.def, stats.critChance, stats.critDmgMult);
        dmg = r.dmg; crit = r.crit;
      }

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
          syncEnemyStatuses();
          pushLog(`Você avança mais fundo em ${dungeon.name}. Profundidade ${nextDepth}.`);
          scheduleTick();
        }, 900);
        return;
      }

      setEnemyLean(1);
      setTimeout(() => {
        if (!mountedRef.current) return;
        setEnemyLean(0);
        maybeAutoHeal();
        const defStats = applyTempBuffs(computeCombatStats(chRef.current));
        const { dmg: rawDmg, crit: ecrit } = rollAttack(enemyRef.current.atk, defStats.def, 0.06);
        let edmg = Math.round(rawDmg * (dungeon.dmgTakenMult ?? 1));
        const blocked = Math.random() < defStats.blockChance;
        if (blocked) edmg = Math.round(edmg * 0.5);
        const hp = Math.max(0, chRef.current.hp - edmg);
        updateCh({ ...chRef.current, hp });
        pushFloat('player', edmg, ecrit, blocked);
        flash('player');
        pushLog(`${enemyRef.current.name} acerta você em ${edmg}${ecrit ? ' (crítico!)' : ''}${blocked ? ' — parcialmente bloqueado!' : ''}.`);

        // Thorns is capped so it can never land the killing blow itself —
        // that reward flow only runs from the direct attack-roll above.
        if (defStats.thornsPct > 0) {
          const reflected = Math.round(edmg * defStats.thornsPct);
          if (reflected > 0) updateEnemy({ ...enemyRef.current, hp: Math.max(1, enemyRef.current.hp - reflected) });
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
  const statusLabel: Record<StatusEffectKind, string> = { poison: 'Envenenado', burn: 'Em Chamas' };

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
            -{f.value}{f.crit ? '!' : ''}{f.blocked ? <span className="text-xs text-sky-300 align-top"> bloq.</span> : ''}
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
          <div className="flex justify-between"><span>{ch.name}</span><span>{Math.max(0, ch.hp)}/{effMaxHp}</span></div>
          <div className="h-2 bg-black/50 rounded"><div className="h-2 bg-red-500 rounded" style={{ width: `${hpPct(ch.hp, effMaxHp)}%` }} /></div>
        </div>
        <div>
          <div className="flex justify-between">
            <span>{enemy.name}{enemyStatuses.length > 0 && <span className="text-green-400"> ({enemyStatuses.map((s) => statusLabel[s]).join(', ')})</span>}</span>
            <span>{Math.max(0, enemy.hp)}/{enemy.maxHp}</span>
          </div>
          <div className="h-2 bg-black/50 rounded"><div className="h-2 bg-yellow-500 rounded" style={{ width: `${hpPct(enemy.hp, enemy.maxHp)}%` }} /></div>
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
