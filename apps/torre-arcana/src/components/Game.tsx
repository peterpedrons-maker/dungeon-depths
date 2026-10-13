import { useEffect, useRef, useState } from 'react';
import { createState, update, startGame, purchaseRune } from '../game/engine';
import { render } from '../game/render';
import { Input } from '../game/input';
import { RUNES, upgradeCost } from '../game/runes';
import { WAVES } from '../game/wave';
import { ICON_BODY, ICON_VIEWBOX } from '../game/icons';
import { GameState, Phase, RuneId, RuneSlot } from '../game/types';

interface Hud {
  phase: Phase;
  gold: number;
  towerHp: number;
  towerMaxHp: number;
  waveTime: number;
  waveDuration: number;
  bossActive: boolean;
  bossHp: number;
  bossMaxHp: number;
  bossName: string;
  kills: number;
  runes: RuneSlot[];
}

function snapshot(s: GameState): Hud {
  const boss = s.enemies.find((e) => e.isBoss);
  return {
    phase: s.phase, gold: Math.floor(s.gold),
    towerHp: Math.ceil(s.towerHp), towerMaxHp: s.towerMaxHp,
    waveTime: s.waveTime, waveDuration: WAVES[s.waveIndex].duration,
    bossActive: s.bossActive, bossHp: boss ? Math.ceil(boss.hp) : 0, bossMaxHp: s.bossMaxHp,
    bossName: boss?.name ?? WAVES[s.waveIndex].bossName,
    kills: s.kills, runes: s.runes,
  };
}

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createState());
  const inputRef = useRef<Input>(new Input());
  const [hud, setHud] = useState<Hud>(() => snapshot(stateRef.current));

  const sync = () => setHud(snapshot(stateRef.current));

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
      if (s.phase !== lastPhase) { lastPhase = s.phase; sync(); }
      acc += dt;
      if (acc > 0.1) { acc = 0; if (s.phase === 'playing') sync(); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); input.detach(); };
  }, []);

  const start = () => { startGame(stateRef.current); inputRef.current.clear(); sync(); };
  const restart = () => { stateRef.current = createState(); start(); };
  const buy = (id: RuneId) => { purchaseRune(stateRef.current, id); sync(); };

  const hpPct = Math.max(0, (hud.towerHp / hud.towerMaxHp) * 100);
  const wavePct = Math.min(100, (hud.waveTime / hud.waveDuration) * 100);
  const playing = hud.phase === 'playing';

  return (
    <div className="fixed inset-0 overflow-hidden bg-void touch-none select-none">
      <canvas ref={canvasRef} className="block touch-none" />

      {playing && (
        <div className="pointer-events-none absolute inset-x-0 top-0 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="rounded-full bg-black/50 px-3 py-1 text-sm font-bold text-gold">🪙 {hud.gold}</div>
            <div className="rounded-full bg-black/50 px-3 py-1 text-sm font-bold text-white">💀 {hud.kills}</div>
          </div>
          <div className="mx-auto mt-2 max-w-md">
            <div className="h-3 overflow-hidden rounded-full border border-black/50 bg-black/50">
              <div className="h-full bg-gradient-to-r from-arcane to-arcane2 transition-all" style={{ width: `${hpPct}%` }} />
            </div>
          </div>
          <div className="mx-auto mt-1.5 max-w-md">
            {hud.bossActive ? (
              <div>
                <div className="mb-0.5 text-center text-xs font-black uppercase tracking-wider text-red-300">☠️ {hud.bossName}</div>
                <div className="h-2.5 overflow-hidden rounded-full border border-black/60 bg-black/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-400"
                    style={{ width: `${hud.bossMaxHp ? (hud.bossHp / hud.bossMaxHp) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
                <div className="h-full bg-white/40" style={{ width: `${wavePct}%` }} />
              </div>
            )}
          </div>
        </div>
      )}

      {playing && (
        <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex justify-center gap-2 p-3">
          {RUNES.map((def, i) => {
            const slot = hud.runes[i];
            const locked = !slot.unlocked;
            const cost = locked ? def.unlockCost : upgradeCost(def, slot.stars);
            const maxed = !locked && slot.stars >= def.maxStars;
            return (
              <button
                key={def.id}
                onClick={() => !maxed && buy(def.id)}
                disabled={maxed}
                className="flex w-20 flex-col items-center gap-0.5 rounded-xl border-2 bg-panel/90 p-1.5 text-center active:scale-95"
                style={{ borderColor: locked ? '#4a3a7a' : def.color }}
              >
                <span
                  className="grid h-9 w-9 place-items-center rounded-full border border-black/30 p-1.5"
                  style={{ background: locked ? '#2a2240' : def.color }}
                >
                  <svg viewBox={ICON_VIEWBOX} className="h-full w-full" style={{ color: locked ? '#584a7a' : '#140f20' }}>
                    <g dangerouslySetInnerHTML={{ __html: ICON_BODY[def.id] }} />
                  </svg>
                </span>
                <span className="truncate text-[9px] font-bold text-white">{def.name}</span>
                <span className="text-[9px] text-white/60">{locked ? '🔒' : '★'.repeat(slot.stars)}</span>
                {!maxed && <span className="text-[9px] font-bold text-gold">{cost}🪙</span>}
              </button>
            );
          })}
        </div>
      )}

      {hud.phase === 'title' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#1b1430]/90 to-[#0a0714]/95 px-4">
          <div className="mb-2 text-6xl">🔮</div>
          <h1 className="mb-1 text-4xl font-black text-arcane2">TORRE ARCANA</h1>
          <p className="mb-8 text-xs uppercase tracking-[0.2em] text-white/50">Defesa Estática</p>
          <button
            onClick={start}
            className="rounded-xl border-2 border-arcane2 bg-gradient-to-b from-arcane to-arcane2 px-10 py-3.5 text-lg font-black text-white shadow-lg active:scale-95"
          >
            ▶ Jogar
          </button>
          <div className="mt-8 max-w-xs text-center text-xs leading-relaxed text-white/45">
            <p className="mb-1">🎯 Segure e arraste pra mirar os disparos</p>
            <p>Sobreviva à horda e derrote o chefe!</p>
          </div>
        </div>
      )}

      {hud.phase === 'dead' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 px-4">
          <div className="mb-2 text-6xl">💀</div>
          <h2 className="mb-1 text-3xl font-black text-red-400">A torre caiu</h2>
          <p className="mb-6 text-sm text-white/60">💀 {hud.kills} abatidos</p>
          <button
            onClick={restart}
            className="rounded-xl border-2 border-arcane2 bg-gradient-to-b from-arcane to-arcane2 px-8 py-3 font-black text-white active:scale-95"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {hud.phase === 'won' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 px-4">
          <div className="mb-2 text-6xl">🏆</div>
          <h2 className="mb-1 text-3xl font-black text-gold">Onda conquistada!</h2>
          <p className="mb-6 text-sm text-white/60">💀 {hud.kills} abatidos</p>
          <button
            onClick={restart}
            className="rounded-xl border-2 border-arcane2 bg-gradient-to-b from-arcane to-arcane2 px-8 py-3 font-black text-white active:scale-95"
          >
            Jogar de novo
          </button>
        </div>
      )}
    </div>
  );
}
