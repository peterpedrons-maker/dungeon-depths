import { useEffect, useRef, useState, type MouseEvent } from 'react';
import gsap from 'gsap';
import { createState, startRound, update, VIEW_W, VIEW_H } from '../game/engine';
import { render } from '../game/render';
import { createInput, attachInput, InputState } from '../game/input';
import { AudioEngine } from '../game/audio';
import { GameState, Phase } from '../game/types';
import {
  tweenNumber,
  resetNumber,
  punch,
  comboFlash,
  tapPunch,
  startUrgencyPulse,
  stopUrgencyPulse,
  slideDownIn,
  slideUpIn,
  titleEntrance,
  idlePulse,
  roundEndEntrance,
} from '../game/fx';

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

const COMBO_FLASH_COLOR: Record<number, string> = { 1: '#2fe6ff', 2: '#ff3fb0', 3: '#ffd23f' };

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createState());
  const inputRef = useRef<InputState>(createInput());
  const audioRef = useRef<AudioEngine>(new AudioEngine());
  const [hud, setHud] = useState<Hud>(() => snapshot(stateRef.current));
  const [muted, setMuted] = useState(false);

  // Live score pill (top HUD) — a GSAP tween drives this via React state so
  // it chases the real score smoothly instead of snapping on every sync.
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const liveScoreObj = useRef({ value: 0 });

  const statusBarRef = useRef<HTMLDivElement>(null);
  const comboBadgeRef = useRef<HTMLDivElement>(null);
  const comboFlashRef = useRef<HTMLDivElement>(null);
  const timerBarRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const titleBallRef = useRef<HTMLDivElement>(null);
  const titleHeadingRef = useRef<HTMLHeadingElement>(null);
  const titleSubtitleRef = useRef<HTMLParagraphElement>(null);
  const titlePlayBtnRef = useRef<HTMLButtonElement>(null);
  const titleTipRef = useRef<HTMLDivElement>(null);

  const roundEndFlagRef = useRef<HTMLDivElement>(null);
  const roundEndHeadingRef = useRef<HTMLHeadingElement>(null);
  const roundEndScoreWrapRef = useRef<HTMLParagraphElement>(null);
  const roundEndBlocksRef = useRef<HTMLParagraphElement>(null);
  const roundEndButtonRef = useRef<HTMLButtonElement>(null);
  const roundEndScoreObj = useRef({ value: 0 });
  const [roundEndScoreDisplay, setRoundEndScoreDisplay] = useState(0);

  const prevComboRef = useRef(1);
  const urgencyTweenRef = useRef<gsap.core.Tween | null>(null);

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
      urgencyTweenRef.current?.kill();
    };
  }, []);

  // Fresh round: snap the live score counter back to 0 instantly (no tween —
  // animating down from last round's score would read as points being lost).
  useEffect(() => {
    if (hud.phase !== 'aiming') return;
    resetNumber(liveScoreObj.current, setScoreDisplay);
    prevComboRef.current = 1;
    slideDownIn(statusBarRef.current);
    slideUpIn(tipRef.current);
  }, [hud.phase]);

  // Live score pill chases the real score with a short tween instead of
  // snapping on every HUD sync.
  useEffect(() => {
    tweenNumber(liveScoreObj.current, hud.score, setScoreDisplay);
  }, [hud.score]);

  // Combo badge punches every time the combo climbs, with a bigger radial
  // flash across the screen every 3rd step — the "full dopamine" beats.
  useEffect(() => {
    if (hud.combo > prevComboRef.current) {
      punch(comboBadgeRef.current);
      if (hud.combo % 3 === 0) {
        const tier = hud.combo >= 9 ? 3 : hud.combo >= 6 ? 2 : 1;
        comboFlash(comboFlashRef.current, COMBO_FLASH_COLOR[tier]);
      }
    }
    prevComboRef.current = hud.combo;
  }, [hud.combo]);

  // Timer bar pulses with urgency in the final 3 seconds of a round.
  useEffect(() => {
    const remaining = hud.roundDuration - hud.roundTime;
    const shouldPulse = hud.phase === 'flying' && remaining <= 3 && remaining > 0;
    if (shouldPulse && !urgencyTweenRef.current) {
      urgencyTweenRef.current = startUrgencyPulse(timerBarRef.current);
    } else if (!shouldPulse && urgencyTweenRef.current) {
      stopUrgencyPulse(urgencyTweenRef.current, timerBarRef.current);
      urgencyTweenRef.current = null;
    }
  }, [hud.phase, hud.roundTime, hud.roundDuration]);

  // Title screen: ball drops in, text/button stagger in, then the button
  // idles with a gentle breathing pulse until tapped.
  useEffect(() => {
    if (hud.phase !== 'title') return;
    const tl = titleEntrance({
      ball: titleBallRef.current,
      heading: titleHeadingRef.current,
      subtitle: titleSubtitleRef.current,
      button: titlePlayBtnRef.current,
      tip: titleTipRef.current,
    });
    let pulse: gsap.core.Tween | null = null;
    tl.eventCallback('onComplete', () => {
      pulse = idlePulse(titlePlayBtnRef.current);
    });
    return () => {
      tl.kill();
      pulse?.kill();
      gsap.set(titlePlayBtnRef.current, { scale: 1 });
    };
  }, [hud.phase]);

  // Round-end: flag bounces in, heading/score/blocks/button stagger in, and
  // the score counts up from zero to the final tally.
  useEffect(() => {
    if (hud.phase !== 'roundEnd') return;
    const tl = roundEndEntrance(
      {
        flag: roundEndFlagRef.current,
        heading: roundEndHeadingRef.current,
        scoreWrap: roundEndScoreWrapRef.current,
        blocksLine: roundEndBlocksRef.current,
        button: roundEndButtonRef.current,
      },
      roundEndScoreObj.current,
      hud.score,
      setRoundEndScoreDisplay,
    );
    return () => {
      tl.kill();
    };
  }, [hud.phase]);

  const play = (e?: MouseEvent<HTMLButtonElement>) => {
    if (e) tapPunch(e.currentTarget);
    audioRef.current.start();
    startRound(stateRef.current);
    inputRef.current.dragging = false;
    inputRef.current.launchRequested = false;
    sync();
  };

  const toggleMute = (e: MouseEvent<HTMLButtonElement>) => {
    tapPunch(e.currentTarget);
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

      <div ref={comboFlashRef} className="pointer-events-none absolute inset-0 opacity-0" />

      {(hud.phase === 'aiming' || hud.phase === 'flying') && (
        <div ref={statusBarRef} className="pointer-events-none absolute inset-x-0 top-0 p-3">
          <div className="mx-auto flex max-w-sm items-center justify-between gap-2">
            <div className="rounded-full bg-black/50 px-3 py-1 text-sm font-bold text-neon3">★ {scoreDisplay}</div>
            {hud.combo > 1 && (
              <div ref={comboBadgeRef} className="rounded-full bg-black/50 px-3 py-1 text-sm font-bold text-combo">
                x{hud.combo} combo
              </div>
            )}
            <div className="rounded-full bg-black/50 px-3 py-1 text-sm font-bold text-white">🧱 {hud.blocksBroken}</div>
          </div>
          <div className="mx-auto mt-2 max-w-sm">
            <div ref={timerBarRef} className="h-2 overflow-hidden rounded-full border border-black/50 bg-black/50">
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
        <div ref={tipRef} className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <div className="rounded-full bg-black/50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/70">
            Arraste pra mirar e solte pra lançar
          </div>
        </div>
      )}

      {hud.phase === 'title' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#120f1f]/90 to-[#07060d]/95 px-4">
          <div ref={titleBallRef} className="mb-2 text-6xl">⚪</div>
          <h1 ref={titleHeadingRef} className="mb-1 text-4xl font-black text-neon1">RICOCHETE</h1>
          <p ref={titleSubtitleRef} className="mb-8 text-xs uppercase tracking-[0.2em] text-white/50">
            Quique. Quebre. Pontue.
          </p>
          <button
            ref={titlePlayBtnRef}
            onClick={play}
            className="rounded-xl border-2 border-neon1 bg-gradient-to-b from-neon1 to-neon2 px-10 py-3.5 text-lg font-black text-void shadow-lg"
          >
            ▶ Jogar
          </button>
          <div ref={titleTipRef} className="mt-8 max-w-xs text-center text-xs leading-relaxed text-white/45">
            <p className="mb-1">🎯 Arraste a partir da bola pra mirar</p>
            <p>Solte pra lançar e quebre o máximo de blocos antes do tempo acabar!</p>
          </div>
        </div>
      )}

      {hud.phase === 'roundEnd' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 px-4">
          <div ref={roundEndFlagRef} className="mb-2 text-6xl">🏁</div>
          <h2 ref={roundEndHeadingRef} className="mb-1 text-3xl font-black text-neon3">Fim do round!</h2>
          <p ref={roundEndScoreWrapRef} className="mb-1 text-2xl font-black text-white">{roundEndScoreDisplay} pontos</p>
          <p ref={roundEndBlocksRef} className="mb-6 text-sm text-white/60">🧱 {hud.blocksBroken} blocos quebrados</p>
          <button
            ref={roundEndButtonRef}
            onClick={play}
            className="rounded-xl border-2 border-neon1 bg-gradient-to-b from-neon1 to-neon2 px-8 py-3 font-black text-void"
          >
            Jogar de novo
          </button>
        </div>
      )}
    </div>
  );
}
