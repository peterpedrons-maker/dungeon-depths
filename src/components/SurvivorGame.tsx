import { useEffect, useRef, useState } from 'react';
import { createInitialState, updateGame } from '@/survivor/engine';
import { render } from '@/survivor/render';
import { GameState } from '@/survivor/types';

export function SurvivorGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const [hud, setHud] = useState({ hp: 100, maxHp: 100, time: 0, count: 0, running: true });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    let last = performance.now();
    let hudAccum = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.1) dt = 0.1; // clamp after tab switches

      const w = window.innerWidth;
      const h = window.innerHeight;
      const spawnRadius = Math.hypot(w, h) / 2 + 60;

      const state = stateRef.current;
      updateGame(state, dt, spawnRadius);
      render(ctx, state, w, h);

      hudAccum += dt;
      if (hudAccum > 0.1) {
        hudAccum = 0;
        setHud({
          hp: Math.ceil(state.player.hp),
          maxHp: state.player.maxHp,
          time: Math.floor(state.time),
          count: state.enemies.length,
          running: state.running,
        });
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const restart = () => {
    stateRef.current = createInitialState();
  };

  const mins = String(Math.floor(hud.time / 60)).padStart(2, '0');
  const secs = String(hud.time % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#161b26] touch-none select-none">
      <canvas ref={canvasRef} className="block" />

      {/* ── HUD ─────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
        {/* HP */}
        <div className="w-40 max-w-[45vw]">
          <div className="mb-1 flex items-center gap-1 text-xs font-bold text-red-300">
            <span>❤️</span>
            <span>{hud.hp} / {hud.maxHp}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full border border-black/40 bg-black/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-150"
              style={{ width: `${(hud.hp / hud.maxHp) * 100}%` }}
            />
          </div>
        </div>

        {/* Timer + count */}
        <div className="text-right">
          <div className="font-mono text-lg font-black text-white tabular-nums drop-shadow">
            {mins}:{secs}
          </div>
          <div className="text-xs font-semibold text-white/70">👹 {hud.count}</div>
        </div>
      </div>

      {/* Hint */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-white/40">
        Os inimigos se aproximam pelas bordas…
      </div>

      {/* ── Game over ───────────────────────────────── */}
      {!hud.running && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mb-2 text-6xl">💀</div>
          <h2 className="mb-1 text-3xl font-black text-red-400">Você caiu</h2>
          <p className="mb-6 text-sm text-white/60">Sobreviveu {mins}:{secs}</p>
          <button
            onClick={restart}
            className="rounded-xl border-2 border-yellow-400 bg-gradient-to-b from-yellow-500 to-yellow-700 px-8 py-3 font-black text-gray-900 transition-all active:scale-95"
          >
            Tentar de novo
          </button>
        </div>
      )}
    </div>
  );
}
