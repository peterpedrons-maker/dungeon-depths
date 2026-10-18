import { useEffect, useRef, useState } from 'react';
import { createState, startRound, update, VIEW_W, VIEW_H } from '../game/engine';
import { render } from '../game/render';
import { createInput, attachInput, InputState } from '../game/input';
import { AudioEngine } from '../game/audio';
import { GameState, Phase } from '../game/types';

interface Hud {
  phase: Phase;
  score: number;
  combo: number;
  blocksBroken: number;
  roundTime: number;
  roundDuration: number;
}

function snapshot(s: GameState): Hud {
  return {
    phase: s.phase,
    score: Math.floor(s.score),
    combo: s.combo,
    blocksBroken: s.blocksBroken,
    roundTime: s.roundTime,
    roundDuration: s.roundDuration,
  };
}

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createState());
  const inputRef = useRef<InputState>(createInput());
  const audioRef = useRef<AudioEngine>(new AudioEngine());
  const [hud, setHud] = useState<Hud>(() => snapshot(stateRef.current));
  const [muted, setMuted] = useState(false);

  const sync = () => setHud(snapshot(stateRef.current));

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const input = inputRef.current;
    const detach = attachInput(canvas, input, VIEW_W, VIEW_H);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
      canvas.width = Math.floor(VIEW_W * dpr);
      canvas.height = Math.floor(VIEW_H * dpr);
      canvas.style.width = `${VIEW_W * scale}px`;
      canvas.style.height = `${VIEW_H * scale}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let lastPhase: Phase = stateRef.current.phase;

    const loop = (now: number) => {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;

      const s = stateRef.current;
      update(s, dt, input, audioRef.current);
      render(ctx, s, VIEW_W, VIEW_H, input.angle);

      if (s.phase !== lastPhase) {
        lastPhase = s.phase;
        sync();
      }
      acc += dt;
      if (acc > 0.1) {
        acc = 0;
        if (s.phase === 'flying') sync();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      detach();
    };
  }, []);

  const play = () => {
    audioRef.current.start();
    startRound(stateRef.current);
    inputRef.current.dragging = false;
    inputRef.current.launchRequested = false;
    sync();
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audioRef.current.setMuted(next);
  };

  const timePct = Math.min(100, (hud.roundTime / hud.roundDuration) * 100);

  return (
    <div className="fixed inset-0 overflow-hidden bg-void touch-none select-none">
      <div className="flex h-full w-full items-center justify-center">
        <canvas ref={canvasRef} className="block touch-none" />
      </div>

      {(hud.phase === 'aiming' || hud.phase === 'flying') && (
        <div className="pointer-events-none absolute inset-x-0 top-0 p-3">
          <div className="mx-auto flex max-w-sm items-center justify-between gap-2">
            <div className="rounded-full bg-black/50 px-3 py-1 text-sm font-bold text-neon3">★ {hud.score}</div>
            {hud.combo > 1 && (
              <div className="rounded-full bg-black/50 px-3 py-1 text-sm font-bold text-combo">x{hud.combo} combo</div>
            )}
            <div className="rounded-full bg-black/50 px-3 py-1 text-sm font-bold text-white">🧱 {hud.blocksBroken}</div>
          </div>
          <div className="mx-auto mt-2 max-w-sm">
            <div className="h-2 overflow-hidden rounded-full border border-black/50 bg-black/50">
              <div
                className="h-full bg-gradient-to-r from-neon1 to-neon2 transition-all"
                style={{ width: `${timePct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <button
        onClick={toggleMute}
        className="pointer-events-auto absolute right-3 top-3 rounded-full bg-black/50 px-3 py-2 text-sm font-bold text-white"
      >
        {muted ? '🔇' : '🔊'}
      </button>

      {hud.phase === 'aiming' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <div className="rounded-full bg-black/50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/70">
            Arraste pra mirar e solte pra lançar
          </div>
        </div>
      )}

      {hud.phase === 'title' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#120f1f]/90 to-[#07060d]/95 px-4">
          <div className="mb-2 text-6xl">⚪</div>
          <h1 className="mb-1 text-4xl font-black text-neon1">RICOCHETE</h1>
          <p className="mb-8 text-xs uppercase tracking-[0.2em] text-white/50">Quique. Quebre. Pontue.</p>
          <button
            onClick={play}
            className="rounded-xl border-2 border-neon1 bg-gradient-to-b from-neon1 to-neon2 px-10 py-3.5 text-lg font-black text-void shadow-lg active:scale-95"
          >
            ▶ Jogar
          </button>
          <div className="mt-8 max-w-xs text-center text-xs leading-relaxed text-white/45">
            <p className="mb-1">🎯 Arraste a partir da bola pra mirar</p>
            <p>Solte pra lançar e quebre o máximo de blocos antes do tempo acabar!</p>
          </div>
        </div>
      )}

      {hud.phase === 'roundEnd' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 px-4">
          <div className="mb-2 text-6xl">🏁</div>
          <h2 className="mb-1 text-3xl font-black text-neon3">Fim do round!</h2>
          <p className="mb-1 text-2xl font-black text-white">{hud.score} pontos</p>
          <p className="mb-6 text-sm text-white/60">🧱 {hud.blocksBroken} blocos quebrados</p>
          <button
            onClick={play}
            className="rounded-xl border-2 border-neon1 bg-gradient-to-b from-neon1 to-neon2 px-8 py-3 font-black text-void active:scale-95"
          >
            Jogar de novo
          </button>
        </div>
      )}
    </div>
  );
}
