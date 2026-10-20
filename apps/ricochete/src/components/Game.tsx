import { useEffect, useRef, useState, type MouseEvent } from 'react';
import gsap from 'gsap';
import { createState, startRun, continueToNextLevel, update, VIEW_W, VIEW_H } from '../game/engine';
import { render } from '../game/render';
import { createInput, attachInput, InputState } from '../game/input';
import { AudioEngine } from '../game/audio';
import { GameState, Phase } from '../game/types';
import { loadSave, purchaseUpgrade, upgradeCost, UPGRADES, type Save, type UpgradeId } from '../game/progression';
import {
  tweenNumber,
  resetNumber,
  punch,
  comboFlash,
  tapPunch,
  slideDownIn,
  slideUpIn,
  titleEntrance,
  idlePulse,
  resultEntrance,
} from '../game/fx';

interface Hud {
  phase: Phase;
  score: number;
  combo: number;
  blocksBroken: number;
  levelIndex: number;
  shieldsLeft: number;
}

function snapshot(s: GameState): Hud {
  return {
    phase: s.phase,
    score: Math.floor(s.score),
    combo: s.combo,
    blocksBroken: s.blocksBroken,
    levelIndex: s.levelIndex,
    shieldsLeft: s.shieldsLeft,
  };
}

const COMBO_FLASH_COLOR: Record<number, string> = { 1: '#2ee6ff', 2: '#8b5cf6', 3: '#ff2d95' };

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createState());
  const inputRef = useRef<InputState>(createInput());
  const audioRef = useRef<AudioEngine>(new AudioEngine());
  const [hud, setHud] = useState<Hud>(() => snapshot(stateRef.current));
  const [muted, setMuted] = useState(false);

  const [save, setSave] = useState<Save>(() => loadSave());
  const [goldEarned, setGoldEarned] = useState(0);
  const prevGoldRef = useRef(save.gold);

  const [scoreDisplay, setScoreDisplay] = useState(0);
  const liveScoreObj = useRef({ value: 0 });

  const statusBarRef = useRef<HTMLDivElement>(null);
  const comboBadgeRef = useRef<HTMLDivElement>(null);
  const comboFlashRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const titleBallRef = useRef<HTMLDivElement>(null);
  const titleHeadingRef = useRef<HTMLHeadingElement>(null);
  const titleSubtitleRef = useRef<HTMLParagraphElement>(null);
  const titlePlayBtnRef = useRef<HTMLButtonElement>(null);
  const titleTipRef = useRef<HTMLDivElement>(null);

  const shopPanelRef = useRef<HTMLDivElement>(null);

  const resultIconRef = useRef<HTMLDivElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const resultScoreWrapRef = useRef<HTMLParagraphElement>(null);
  const resultDetailRef = useRef<HTMLParagraphElement>(null);
  const resultButtonRef = useRef<HTMLButtonElement>(null);
  const resultScoreObj = useRef({ value: 0 });
  const [resultScoreDisplay, setResultScoreDisplay] = useState(0);

  const prevComboRef = useRef(1);

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

  // Refresh the persisted save whenever we land on a non-gameplay screen,
  // and on the two "a run just ended" screens, work out how much gold was
  // just banked since the last time we were on one of these screens.
  useEffect(() => {
    if (hud.phase === 'aiming' || hud.phase === 'flying') return;
    const fresh = loadSave();
    if (hud.phase === 'levelComplete' || hud.phase === 'gameOver') {
      setGoldEarned(Math.max(0, fresh.gold - prevGoldRef.current));
    }
    prevGoldRef.current = fresh.gold;
    setSave(fresh);
  }, [hud.phase]);

  // Entering aiming (fresh level, carried over from the previous one or a
  // brand new run) slides the HUD bar/tip in.
  useEffect(() => {
    if (hud.phase !== 'aiming') return;
    prevComboRef.current = 1;
    slideDownIn(statusBarRef.current);
    slideUpIn(tipRef.current);
  }, [hud.phase]);

  // Live score pill chases the real (run-cumulative) score with a short
  // tween instead of snapping on every HUD sync.
  useEffect(() => {
    tweenNumber(liveScoreObj.current, hud.score, setScoreDisplay);
  }, [hud.score]);

  // Combo badge punches every time the combo climbs, with a bigger radial
  // flash across the screen every 3rd step.
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

  useEffect(() => {
    if (hud.phase !== 'shop') return;
    gsap.fromTo(shopPanelRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
  }, [hud.phase]);

  // Level-complete / game-over share one entrance: icon bounces in,
  // heading/score/detail stagger in, score counts up, button last.
  useEffect(() => {
    if (hud.phase !== 'levelComplete' && hud.phase !== 'gameOver') return;
    const tl = resultEntrance(
      {
        icon: resultIconRef.current,
        heading: resultHeadingRef.current,
        scoreWrap: resultScoreWrapRef.current,
        detailLine: resultDetailRef.current,
        button: resultButtonRef.current,
      },
      resultScoreObj.current,
      hud.score,
      setResultScoreDisplay,
    );
    return () => {
      tl.kill();
    };
  }, [hud.phase]);

  const startNewRun = (e: MouseEvent<HTMLButtonElement>) => {
    tapPunch(e.currentTarget);
    audioRef.current.start();
    startRun(stateRef.current);
    inputRef.current.dragging = false;
    inputRef.current.launchRequested = false;
    resetNumber(liveScoreObj.current, setScoreDisplay);
    prevComboRef.current = 1;
    sync();
  };

  const continueLevel = (e: MouseEvent<HTMLButtonElement>) => {
    tapPunch(e.currentTarget);
    continueToNextLevel(stateRef.current);
    inputRef.current.dragging = false;
    inputRef.current.launchRequested = false;
    sync();
  };

  const openShop = (e?: MouseEvent<HTMLButtonElement>) => {
    if (e) tapPunch(e.currentTarget);
    stateRef.current.phase = 'shop';
    sync();
  };

  const closeShop = (e: MouseEvent<HTMLButtonElement>) => {
    tapPunch(e.currentTarget);
    stateRef.current.phase = 'title';
    sync();
  };

  const buyUpgrade = (id: UpgradeId) => (e: MouseEvent<HTMLButtonElement>) => {
    tapPunch(e.currentTarget);
    const ok = purchaseUpgrade(save, id);
    if (ok) setSave({ ...save, upgrades: { ...save.upgrades } });
  };

  const toggleMute = (e: MouseEvent<HTMLButtonElement>) => {
    tapPunch(e.currentTarget);
    const next = !muted;
    setMuted(next);
    audioRef.current.setMuted(next);
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-void touch-none select-none">
      <div className="flex h-full w-full items-center justify-center">
        <canvas ref={canvasRef} className="block touch-none" />
      </div>

      <div ref={comboFlashRef} className="pointer-events-none absolute inset-0 opacity-0" />

      {(hud.phase === 'aiming' || hud.phase === 'flying') && (
        <div ref={statusBarRef} className="pointer-events-none absolute inset-x-0 top-0 p-3">
          <div className="mx-auto flex max-w-sm items-center justify-between gap-2">
            <div className="rounded-full bg-black/50 px-3 py-1 text-sm font-bold text-gold">★ {scoreDisplay}</div>
            {hud.combo > 1 && (
              <div ref={comboBadgeRef} className="rounded-full bg-black/50 px-3 py-1 text-sm font-bold text-neon2">
                x{hud.combo} combo
              </div>
            )}
            <div className="rounded-full bg-black/50 px-3 py-1 text-sm font-bold text-white">🧱 {hud.blocksBroken}</div>
          </div>
          <div className="mx-auto mt-2 flex max-w-sm items-center justify-between px-1 text-xs font-bold text-white/50">
            <span>Fase {hud.levelIndex + 1}</span>
            {hud.shieldsLeft > 0 && <span>🛡️ x{hud.shieldsLeft}</span>}
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#180f2e]/90 to-[#0b0618]/95 px-4">
          <div ref={titleBallRef} className="neon-halo mb-2 text-6xl">⚪</div>
          <h1 ref={titleHeadingRef} className="neon-glow-cyan mb-1 text-4xl font-black text-neon1">RICOCHETE</h1>
          <p ref={titleSubtitleRef} className="mb-6 text-xs uppercase tracking-[0.2em] text-white/50">
            Quique. Sobreviva. Avance.
          </p>
          <div className="mb-6 rounded-full bg-black/50 px-4 py-1.5 text-sm font-bold text-gold">💰 {save.gold}</div>
          <button
            ref={titlePlayBtnRef}
            onClick={startNewRun}
            className="rounded-xl border-2 border-neon1 bg-gradient-to-r from-neon1 to-neon2 px-10 py-3.5 text-lg font-black text-void shadow-[0_0_24px_rgba(46,230,255,0.45)]"
          >
            ▶ Jogar
          </button>
          <button onClick={openShop} className="mt-3 text-xs font-bold uppercase tracking-wide text-white/50 underline">
            Loja
          </button>
          <div ref={titleTipRef} className="mt-8 max-w-xs text-center text-xs leading-relaxed text-white/45">
            <p className="mb-1">🎯 Arraste a partir da bola pra mirar</p>
            <p>Encontre a saída pra avançar de fase — cuidado com os buracos nas bordas!</p>
          </div>
        </div>
      )}

      {hud.phase === 'shop' && (
        <div className="absolute inset-0 flex flex-col items-center overflow-y-auto bg-gradient-to-b from-[#180f2e]/95 to-[#0b0618]/98 px-4 py-10">
          <div ref={shopPanelRef} className="w-full max-w-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="neon-glow-cyan text-2xl font-black text-neon1">Loja</h2>
              <div className="rounded-full bg-black/50 px-3 py-1 text-sm font-bold text-gold">💰 {save.gold}</div>
            </div>
            <div className="flex flex-col gap-3">
              {UPGRADES.map((def) => {
                const level = save.upgrades[def.id];
                const maxed = level >= def.maxLevel;
                const cost = maxed ? 0 : upgradeCost(def.id, level);
                const canAfford = !maxed && save.gold >= cost;
                return (
                  <div key={def.id} className="rounded-xl border border-panelborder bg-panel/90 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neon1">{def.name}</span>
                      <span className="text-xs text-white/50">{level}/{def.maxLevel}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/50">{def.description}</p>
                    <button
                      onClick={buyUpgrade(def.id)}
                      disabled={maxed || !canAfford}
                      className="mt-2 w-full rounded-lg border border-neon3/50 bg-neon3/15 py-2 text-sm font-bold text-neon1 disabled:border-panelborder disabled:bg-transparent disabled:opacity-40"
                    >
                      {maxed ? 'Máximo' : `Comprar — 💰 ${cost}`}
                    </button>
                  </div>
                );
              })}
            </div>
            <button onClick={closeShop} className="mt-6 w-full rounded-xl border-2 border-neon3 py-3 font-black text-neon1">
              Voltar
            </button>
          </div>
        </div>
      )}

      {(hud.phase === 'levelComplete' || hud.phase === 'gameOver') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 px-4">
          <div ref={resultIconRef} className="mb-2 text-6xl">
            {hud.phase === 'levelComplete' ? '🏁' : '🕳️'}
          </div>
          <h2
            ref={resultHeadingRef}
            className={`mb-1 text-3xl font-black ${hud.phase === 'levelComplete' ? 'neon-glow-cyan text-neon1' : 'text-danger'}`}
            style={hud.phase === 'gameOver' ? { textShadow: '0 0 8px rgba(255,77,77,0.85), 0 0 24px rgba(255,77,77,0.45)' } : undefined}
          >
            {hud.phase === 'levelComplete' ? `Fase ${hud.levelIndex + 1} concluída!` : 'Você caiu!'}
          </h2>
          <p ref={resultScoreWrapRef} className="mb-1 text-2xl font-black text-white">{resultScoreDisplay} pontos</p>
          <p ref={resultDetailRef} className="mb-6 text-sm text-white/60">
            🧱 {hud.blocksBroken} blocos · 💰 +{goldEarned} ouro
          </p>
          <button
            ref={resultButtonRef}
            onClick={hud.phase === 'levelComplete' ? continueLevel : startNewRun}
            className="rounded-xl border-2 border-neon1 bg-gradient-to-r from-neon1 to-neon2 px-8 py-3 font-black text-void shadow-[0_0_24px_rgba(46,230,255,0.4)]"
          >
            {hud.phase === 'levelComplete' ? 'Continuar' : 'Jogar de novo'}
          </button>
          {hud.phase === 'gameOver' && (
            <button onClick={openShop} className="mt-3 text-xs font-bold uppercase tracking-wide text-white/50 underline">
              Ir pra loja
            </button>
          )}
        </div>
      )}
    </div>
  );
}
