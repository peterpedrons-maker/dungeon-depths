import { useEffect, useRef, useState } from 'react';
import { createState, update, startGame, chooseUpgrade } from '@/game/engine';
import { render } from '@/game/render';
import { Input } from '@/game/input';
import { sound } from '@/game/sound';
import { GameState, Phase, Upgrade, BIOMES, FLOOR_WAVE_TIME } from '@/game/types';

interface Hud {
  phase: Phase;
  hp: number; maxHp: number;
  level: number; xp: number; xpToNext: number;
  time: number; kills: number;
  upgrades: Upgrade[];
  floor: number; floorPhase: 'waves' | 'boss' | 'cleared'; floorProgress: number;
  bossHp: number; bossMaxHp: number; bossName: string;
}

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createState());
  const inputRef = useRef<Input>(new Input());
  const [muted, setMuted] = useState(false);
  const [hud, setHud] = useState<Hud>({
    phase: 'title', hp: 100, maxHp: 100, level: 1, xp: 0, xpToNext: 5,
    time: 0, kills: 0, upgrades: [],
    floor: 1, floorPhase: 'waves', floorProgress: 0, bossHp: 0, bossMaxHp: 0, bossName: '',
  });

  const syncHud = () => {
    const s = stateRef.current;
    const boss = s.enemies.find(e => e.isBoss);
    setHud({
      phase: s.phase,
      hp: Math.ceil(s.player.hp), maxHp: s.player.stats.maxHp,
      level: s.player.level, xp: s.player.xp, xpToNext: s.player.xpToNext,
      time: Math.floor(s.time), kills: s.kills,
      upgrades: s.offeredUpgrades,
      floor: s.floor, floorPhase: s.floorPhase,
      floorProgress: Math.min(1, s.floorTimer / FLOOR_WAVE_TIME),
      bossHp: boss ? Math.ceil(boss.hp) : 0, bossMaxHp: boss ? boss.maxHp : 0,
      bossName: boss?.name ?? '',
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const input = inputRef.current;
    input.attach(canvas);
    let raf = 0, last = performance.now(), acc = 0;
    const view = { w: window.innerWidth, h: window.innerHeight };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      view.w = window.innerWidth; view.h = window.innerHeight;
      canvas.width = Math.floor(view.w * dpr);
      canvas.height = Math.floor(view.h * dpr);
      canvas.style.width = view.w + 'px';
      canvas.style.height = view.h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let lastPhase: Phase = stateRef.current.phase;
    const loop = (now: number) => {
      let dt = (now - last) / 1000; last = now;
      if (dt > 0.05) dt = 0.05;
      const s = stateRef.current;
      update(s, dt, view, input);
      render(ctx, s, view, input);
      if (s.phase !== lastPhase) {
        if (s.phase === 'levelup' || s.phase === 'dead' || s.phase === 'won') input.clear();
        lastPhase = s.phase; syncHud();
      }
      acc += dt;
      if (acc > 0.1) { acc = 0; if (s.phase === 'playing') syncHud(); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); input.detach(); };
  }, []);

  const start = () => {
    sound.unlock();
    sound.startMusic();
    startGame(stateRef.current);
    inputRef.current.clear();
    syncHud();
  };
  const pick = (u: Upgrade) => { sound.ui(); chooseUpgrade(stateRef.current, u); inputRef.current.clear(); syncHud(); };
  const toggleMute = () => { const m = !muted; setMuted(m); sound.setMuted(m); };

  const mm = String(Math.floor(hud.time / 60)).padStart(2, '0');
  const ss = String(hud.time % 60).padStart(2, '0');
  const hpPct = Math.max(0, (hud.hp / hud.maxHp) * 100);
  const xpPct = Math.min(100, (hud.xp / hud.xpToNext) * 100);
  const playing = hud.phase === 'playing' || hud.phase === 'levelup';

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#12101a] touch-none select-none">
      <canvas ref={canvasRef} className="block touch-none" />

      {/* Mute button */}
      {hud.phase !== 'title' && (
        <button onClick={toggleMute} className="absolute right-2 bottom-2 z-30 grid h-9 w-9 place-items-center rounded-full bg-black/45 text-lg backdrop-blur">
          {muted ? '🔇' : '🔊'}
        </button>
      )}

      {/* HUD */}
      {playing && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 p-2.5">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-md bg-cyan-500 text-xs font-black text-white shadow">{hud.level}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full border border-black/50 bg-black/50">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-300 transition-all" style={{ width: `${xpPct}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex w-40 max-w-[46vw] items-center gap-1.5">
                <span className="text-sm">❤️</span>
                <div className="relative h-4 flex-1 overflow-hidden rounded-full border border-black/50 bg-black/50">
                  <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all" style={{ width: `${hpPct}%` }} />
                  <span className="absolute inset-0 grid place-items-center text-[10px] font-bold text-white drop-shadow">{hud.hp}/{hud.maxHp}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-full bg-black/40 px-3 py-1 font-mono text-sm font-bold text-white tabular-nums">
                <span>⏱️ {mm}:{ss}</span>
                <span className="text-red-300">💀 {hud.kills}</span>
              </div>
            </div>
            {/* Floor label + progress / boss bar */}
            <div className="mt-2">
              {hud.floorPhase === 'boss' && hud.bossMaxHp > 0 ? (
                <div>
                  <div className="mb-0.5 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-red-300">
                    <span>☠️ {hud.bossName}</span>
                  </div>
                  <div className="mx-auto h-3 max-w-md overflow-hidden rounded-full border border-black/60 bg-black/60">
                    <div className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-400 transition-all" style={{ width: `${(hud.bossHp / hud.bossMaxHp) * 100}%` }} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-white/55">
                    Andar {hud.floor} · {BIOMES[Math.min(hud.floor, BIOMES.length) - 1].name}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/40">
                    <div className="h-full rounded-full bg-white/40" style={{ width: `${hud.floorProgress * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Descend prompt */}
          {hud.floorPhase === 'cleared' && (
            <div className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center">
              <div className="animate-pulse rounded-full border border-cyan-400/50 bg-black/60 px-4 py-2 text-sm font-bold text-cyan-200">
                ⬇️ Vá até o portal para descer
              </div>
            </div>
          )}
        </>
      )}

      {/* Level-up */}
      {hud.phase === 'levelup' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-cyan-300">Level {hud.level}</div>
          <h2 className="mb-5 text-2xl font-black text-white">Escolha uma melhoria</h2>
          <div className="flex w-full max-w-md flex-col gap-2.5">
            {hud.upgrades.map((u, i) => (
              <button key={u.id + i} onClick={() => pick(u)}
                className="flex items-center gap-3 rounded-xl border-2 border-cyan-500/40 bg-slate-800/90 p-3 text-left transition-all hover:border-cyan-400 hover:bg-slate-700/90 active:scale-[0.98]">
                <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg bg-slate-900 text-2xl">{u.icon}</span>
                <div>
                  <div className="font-bold text-white">{u.title}</div>
                  <div className="text-xs text-cyan-200/80">{u.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Title */}
      {hud.phase === 'title' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1530]/80 to-[#12101a]/95 px-4">
          <div className="mb-2 text-6xl">🗡️</div>
          <h1 className="mb-1 text-center text-4xl font-black leading-none text-cyan-300 drop-shadow">DUNGEON<br />DEPTHS</h1>
          <p className="mb-8 text-xs uppercase tracking-[0.2em] text-white/50">Twin-Stick Survivor</p>
          <button onClick={start} className="rounded-xl border-2 border-cyan-400 bg-gradient-to-b from-cyan-500 to-cyan-700 px-10 py-3.5 text-lg font-black text-white shadow-lg transition-all active:scale-95">▶ Jogar</button>
          <div className="mt-8 max-w-xs text-center text-xs leading-relaxed text-white/45">
            <p className="mb-1">🕹️ <b className="text-cyan-300">Esquerda</b> da tela: mover</p>
            <p className="mb-1">🎯 <b className="text-yellow-300">Direita</b> da tela: mirar e atirar</p>
            <p className="mt-3 text-white/35">Suba de nível, derrote o chefe de cada andar e desça até o fundo!</p>
          </div>
        </div>
      )}

      {/* Death */}
      {hud.phase === 'dead' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm px-4">
          <div className="mb-2 text-6xl">💀</div>
          <h2 className="mb-1 text-3xl font-black text-red-400">Você caiu</h2>
          <p className="mb-6 text-sm text-white/60">Nível {hud.level} • {mm}:{ss} • 💀 {hud.kills}</p>
          <button onClick={start} className="rounded-xl border-2 border-cyan-400 bg-gradient-to-b from-cyan-500 to-cyan-700 px-8 py-3 font-black text-white transition-all active:scale-95">Jogar de novo</button>
        </div>
      )}

      {/* Win */}
      {hud.phase === 'won' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm px-4">
          <div className="mb-2 text-6xl">🏆</div>
          <h2 className="mb-1 text-3xl font-black text-yellow-400">Profundezas conquistadas!</h2>
          <p className="mb-6 text-sm text-white/60">Você derrotou o Coração das Trevas • Nível {hud.level} • 💀 {hud.kills}</p>
          <button onClick={start} className="rounded-xl border-2 border-cyan-400 bg-gradient-to-b from-cyan-500 to-cyan-700 px-8 py-3 font-black text-white transition-all active:scale-95">Jogar de novo</button>
        </div>
      )}
    </div>
  );
}
