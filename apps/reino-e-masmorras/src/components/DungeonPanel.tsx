import { useEffect, useRef, useState } from 'react';
import { Character, EnemyInstance } from '../types/game';
import { spawnEnemy } from '../lib/enemies';
import { CLASSES, grantXp } from '../lib/classes';
import { rollAttack } from '../game/combat';
import { drawPlayer, drawEnemy } from '../game/sprites';

interface FloatingNumber { id: number; x: number; side: 'player' | 'enemy'; value: number; crit: boolean; born: number; }
interface Props {
  character: Character;
  onRunEnd: (finalCharacter: Character, deepestDepth: number) => void;
}

type Phase = 'fight' | 'resolving' | 'choice' | 'ended';

export function DungeonPanel({ character, onRunEnd }: Props) {
  const [ch, setCh] = useState<Character>(character);
  const [depth, setDepth] = useState(1);
  const [enemy, setEnemy] = useState<EnemyInstance>(() => spawnEnemy(1));
  const [phase, setPhase] = useState<Phase>('fight');
  const [log, setLog] = useState<string[]>(['Você desce as escadas em direção à masmorra...']);
  const [floaters, setFloaters] = useState<FloatingNumber[]>([]);
  const [playerLean, setPlayerLean] = useState(0);
  const [enemyLean, setEnemyLean] = useState(0);
  const [flashSide, setFlashSide] = useState<'player' | 'enemy' | null>(null);
  const [endedReason, setEndedReason] = useState<'death' | 'retreat' | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const floaterId = useRef(0);

  const cls = CLASSES[ch.classId];

  function pushLog(line: string) {
    setLog((l) => [...l.slice(-4), line]);
  }
  function pushFloat(side: 'player' | 'enemy', value: number, crit: boolean) {
    const id = floaterId.current++;
    setFloaters((f) => [...f, { id, x: 0, side, value, crit, born: performance.now() }]);
    setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 900);
  }

  function playerAction(kind: 'attack' | 'potion' | 'flee') {
    if (phase !== 'fight') return;
    setPhase('resolving');

    if (kind === 'flee') {
      const success = Math.random() < 0.7;
      if (success) {
        pushLog('Você escapa da masmorra em segurança.');
        setEndedReason('retreat');
        setPhase('ended');
        return;
      }
      pushLog('A fuga falhou! O inimigo ataca.');
      setEnemyLean(1);
      setTimeout(() => resolveEnemyTurn(ch), 450);
      return;
    }

    if (kind === 'potion') {
      if (ch.potions <= 0) { setPhase('fight'); return; }
      const heal = Math.round(ch.maxHp * 0.4);
      const healed = Math.min(ch.maxHp, ch.hp + heal);
      const next = { ...ch, hp: healed, potions: ch.potions - 1 };
      setCh(next);
      pushLog(`Você bebe uma poção e recupera ${healed - ch.hp} de vida.`);
      setTimeout(() => resolveEnemyTurn(next), 450);
      return;
    }

    // attack
    setPlayerLean(1);
    setTimeout(() => {
      setPlayerLean(0);
      const { dmg, crit } = rollAttack(ch.atk, enemy.def, cls.critChance);
      const enemyHp = Math.max(0, enemy.hp - dmg);
      setEnemy((e) => ({ ...e, hp: enemyHp }));
      pushFloat('enemy', dmg, crit);
      setFlashSide('enemy'); setTimeout(() => setFlashSide(null), 150);
      pushLog(`Você acerta ${enemy.name} em ${dmg}${crit ? ' (crítico!)' : ''}.`);

      let next = ch;
      if (cls.lifesteal > 0) {
        const heal = Math.round(dmg * cls.lifesteal);
        next = { ...ch, hp: Math.min(ch.maxHp, ch.hp + heal) };
        setCh(next);
      }

      if (enemyHp <= 0) {
        const withXp = grantXp(next, enemy.xpReward);
        const finalChar = { ...withXp, gold: withXp.gold + enemy.goldReward, bestDepth: Math.max(withXp.bestDepth, depth) };
        setCh(finalChar);
        pushLog(`${enemy.name} foi derrotado! +${enemy.xpReward} XP, +${enemy.goldReward} de ouro.`);
        if (finalChar.level > next.level) pushLog(`Você subiu para o nível ${finalChar.level}!`);
        setPhase('choice');
        return;
      }
      setTimeout(() => resolveEnemyTurn(next), 350);
    }, 300);
  }

  function resolveEnemyTurn(currentChar: Character) {
    setEnemyLean(1);
    setTimeout(() => {
      setEnemyLean(0);
      const { dmg, crit } = rollAttack(enemy.atk, currentChar.def, 0.06);
      const hp = Math.max(0, currentChar.hp - dmg);
      const next = { ...currentChar, hp };
      setCh(next);
      pushFloat('player', dmg, crit);
      setFlashSide('player'); setTimeout(() => setFlashSide(null), 150);
      pushLog(`${enemy.name} acerta você em ${dmg}${crit ? ' (crítico!)' : ''}.`);

      if (hp <= 0) {
        pushLog('Você caiu em combate...');
        setEndedReason('death');
        setPhase('ended');
        return;
      }
      setPhase('fight');
    }, 300);
  }

  function advance() {
    const nextDepth = depth + 1;
    setDepth(nextDepth);
    setEnemy(spawnEnemy(nextDepth));
    pushLog(`Você avança mais fundo na masmorra. Profundidade ${nextDepth}.`);
    setPhase('fight');
  }

  function retreatSafely() {
    setEndedReason('retreat');
    setPhase('ended');
  }

  function confirmReturnToHub() {
    onRunEnd({ ...ch, bestDepth: Math.max(ch.bestDepth, depth) }, depth);
  }

  // ── Canvas render loop (idle bob + shapes) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext('2d')!;
    let raf: number;
    const draw = (t: number) => {
      const w = canvas.width, h = canvas.height;
      g.clearRect(0, 0, w, h);
      // floor
      g.fillStyle = '#241a12';
      g.fillRect(0, h - 40, w, 40);
      g.fillStyle = '#2e2118';
      for (let x = 0; x < w; x += 28) g.fillRect(x, h - 40, 2, 40);
      // torches flicker
      const flick = 0.6 + Math.sin(t / 130) * 0.15;
      g.fillStyle = `rgba(255,150,60,${0.06 * flick})`;
      g.beginPath(); g.arc(w * 0.15, h * 0.35, 90, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(w * 0.85, h * 0.35, 90, 0, Math.PI * 2); g.fill();

      const bobP = Math.sin(t / 260) * 3;
      const bobE = Math.sin(t / 240 + 1) * 3;
      const groundY = h - 46;
      if (phase !== 'ended') {
        drawPlayer(g, w * 0.26, groundY, ch.classId, cls.color, bobP, playerLean);
        drawEnemy(g, w * 0.74, groundY, enemy.shape, enemy.color, bobE, -enemyLean);
        if (flashSide === 'player') { g.fillStyle = 'rgba(255,60,60,0.25)'; g.fillRect(0, 0, w * 0.5, h); }
        if (flashSide === 'enemy') { g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(w * 0.5, 0, w * 0.5, h); }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ch.classId, cls.color, enemy, phase, playerLean, enemyLean, flashSide]);

  const hpPct = (v: number, max: number) => Math.max(0, Math.min(100, (v / max) * 100));

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-baseline mb-2">
        <h2 className="text-xl text-gold font-bold">Masmorra — Profundidade {depth}</h2>
        <span className="text-sm text-parchment/60">{ch.name}, Nv. {ch.level}</span>
      </div>

      <div className="relative rounded border-2 border-black/60 overflow-hidden bg-black/30">
        <canvas ref={canvasRef} width={640} height={280} className="w-full block" />
        {floaters.map((f) => (
          <div
            key={f.id}
            className={`absolute font-bold text-lg pointer-events-none animate-[float_0.9s_ease-out_forwards] ${
              f.side === 'player' ? 'text-red-400 left-[22%]' : 'text-yellow-300 left-[70%]'
            }`}
            style={{ top: '40%' }}
          >
            -{f.value}{f.crit ? '!' : ''}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
        <div>
          <div className="flex justify-between"><span>{ch.name}</span><span>{Math.max(0, ch.hp)}/{ch.maxHp}</span></div>
          <div className="h-2 bg-black/50 rounded"><div className="h-2 bg-red-500 rounded" style={{ width: `${hpPct(ch.hp, ch.maxHp)}%` }} /></div>
        </div>
        <div>
          <div className="flex justify-between"><span>{enemy.name}</span><span>{Math.max(0, enemy.hp)}/{enemy.maxHp}</span></div>
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
            <button onClick={() => playerAction('attack')} className="px-4 py-2 bg-crimson rounded font-bold hover:brightness-110">Atacar</button>
            <button onClick={() => playerAction('potion')} disabled={ch.potions <= 0}
              className="px-4 py-2 bg-emerald-800 rounded disabled:opacity-40 hover:brightness-110">
              Poção ({ch.potions})
            </button>
            <button onClick={() => playerAction('flee')} className="px-4 py-2 bg-neutral-700 rounded hover:brightness-110">Fugir</button>
          </>
        )}
        {phase === 'choice' && (
          <>
            <button onClick={advance} className="px-4 py-2 bg-gold text-ink rounded font-bold hover:brightness-110">Avançar</button>
            <button onClick={retreatSafely} className="px-4 py-2 bg-neutral-700 rounded hover:brightness-110">Retornar ao Reino</button>
          </>
        )}
        {phase === 'ended' && (
          <div className="w-full text-center">
            <p className="mb-3 text-parchment/80">
              {endedReason === 'death' ? 'Sua expedição terminou.' : 'Você retornou em segurança.'} Profundidade alcançada: {depth}.
            </p>
            <button onClick={confirmReturnToHub} className="px-4 py-2 bg-gold text-ink rounded font-bold hover:brightness-110">
              Voltar ao Reino
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
