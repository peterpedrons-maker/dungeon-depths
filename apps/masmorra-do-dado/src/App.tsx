import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createScene, type SceneApi, type StickState } from './scene/scene';

const STICK_R = 52;

interface Caption {
  id: number;
  title: string;
  sub: string;
  color: string;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneApi | null>(null);
  const [stick, setStick] = useState<StickState>({ active: false, ox: 0, oy: 0, x: 0, y: 0 });
  const [caption, setCaption] = useState<Caption | null>(null);
  const [complete, setComplete] = useState<{ gem: boolean } | null>(null);
  const [hint, setHint] = useState(true);
  const [dieOut, setDieOut] = useState(false);
  const captionTimer = useRef(0);

  useEffect(() => {
    const scene = createScene(canvasRef.current!, {
      onStick: setStick,
      onCaption: (title, sub, color) => {
        setCaption({ id: performance.now(), title, sub, color });
        window.clearTimeout(captionTimer.current);
        captionTimer.current = window.setTimeout(() => setCaption(null), 2600);
      },
      onComplete: setComplete,
      onDie: (st) => setDieOut(st !== 'hand'),
    });
    sceneRef.current = scene;
    const hintTimer = window.setTimeout(() => setHint(false), 9000);
    return () => {
      window.clearTimeout(hintTimer);
      scene.dispose();
    };
  }, []);

  const reset = () => {
    setComplete(null);
    setCaption(null);
    sceneRef.current?.reset();
  };

  const fullscreen = () => {
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    document.documentElement
      .requestFullscreen?.()
      .then(() => orientation.lock?.('landscape'))
      .catch(() => {});
  };

  return (
    <div className="stage">
      <canvas ref={canvasRef} />
      <div className="vignette" />
      <div className="crosshair" />

      <div className="corner">
        <button onClick={reset} aria-label="Reiniciar sala" title="Reiniciar sala (R)">
          ↺
        </button>
        {document.fullscreenEnabled && (
          <button onClick={fullscreen} aria-label="Tela cheia" title="Tela cheia">
            ⛶
          </button>
        )}
      </div>

      {stick.active && (
        <div className="stick" style={{ left: stick.ox - STICK_R, top: stick.oy - STICK_R }}>
          <div className="thumb" style={{ transform: `translate(${stick.x * STICK_R}px, ${stick.y * STICK_R}px)` }} />
        </div>
      )}

      {caption && (
        <div key={caption.id} className="caption" style={{ '--accent': caption.color } as CSSProperties}>
          <b>{caption.title}</b>
          <span>{caption.sub}</span>
        </div>
      )}

      {hint && (
        <div className="hint">
          <span className="hint-pc">clique: arremessar / recolher · 1–6 ou roda do mouse: face · WASD: andar · R: reiniciar</span>
          <span className="hint-touch">botões à direita: arremessar e girar o dado · esquerda: andar · arraste pra olhar</span>
        </div>
      )}

      {!complete && (
        <div className="touchbtns">
          <button
            className="btn-rotate"
            onPointerDown={(e) => {
              e.preventDefault();
              sceneRef.current?.rotate();
            }}
            aria-label="Girar o dado"
          >
            <span className="ico">↻</span>
            <span>GIRAR</span>
          </button>
          <button
            className="btn-throw"
            onPointerDown={(e) => {
              e.preventDefault();
              sceneRef.current?.action();
            }}
            aria-label={dieOut ? 'Recolher o dado' : 'Arremessar o dado'}
          >
            <span className="ico">{dieOut ? '↩' : '⤴'}</span>
            <span>{dieOut ? 'RECOLHER' : 'ARREMESSAR'}</span>
          </button>
        </div>
      )}

      {complete && (
        <div className="done">
          <h1>Sala concluída</h1>
          <p>{complete.gem ? 'Gema encontrada ✦' : 'Ainda há uma gema escondida nesta sala…'}</p>
          <button onClick={reset}>Jogar de novo</button>
        </div>
      )}

      <div className="rotate">
        <div className="phone" />
        <p>Gire o celular para o modo horizontal</p>
      </div>
    </div>
  );
}
