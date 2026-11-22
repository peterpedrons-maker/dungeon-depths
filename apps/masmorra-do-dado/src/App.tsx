import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { FACES } from './faces';
import { dieFaceCanvas } from './scene/textures';
import { createScene, type SceneApi, type StickState } from './scene/scene';

const STICK_R = 52;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneApi | null>(null);
  const [face, setFace] = useState(1);
  const [shaking, setShaking] = useState(0);
  const [stick, setStick] = useState<StickState>({ active: false, ox: 0, oy: 0, x: 0, y: 0 });

  const icons = useMemo(() => FACES.map((f) => dieFaceCanvas(f.n, f.color, !f.unlocked).toDataURL()), []);

  useEffect(() => {
    sceneRef.current = createScene(canvasRef.current!, { onStick: setStick });
    return () => sceneRef.current?.dispose();
  }, []);

  const select = (n: number) => {
    if (!FACES[n - 1].unlocked) {
      setShaking(n);
      window.setTimeout(() => setShaking(0), 260);
      return;
    }
    setFace(n);
    sceneRef.current?.setFace(n);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[1-6]$/.test(e.key)) select(Number(e.key));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const fullscreen = () => {
    const root = document.documentElement;
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    root
      .requestFullscreen?.()
      .then(() => orientation.lock?.('landscape'))
      .catch(() => {});
  };

  const current = FACES[face - 1];

  return (
    <div className="stage">
      <canvas ref={canvasRef} />
      <div className="vignette" />
      <div className="crosshair" />
      <div className="tag">
        MASMORRA DO DADO
        <small>protótipo visual · nome provisório</small>
      </div>
      {document.fullscreenEnabled && (
        <button className="fs" onClick={fullscreen} aria-label="Tela cheia">
          ⛶
        </button>
      )}

      {stick.active && (
        <div className="stick" style={{ left: stick.ox - STICK_R, top: stick.oy - STICK_R }}>
          <div className="thumb" style={{ transform: `translate(${stick.x * STICK_R}px, ${stick.y * STICK_R}px)` }} />
        </div>
      )}

      <div className="hud" style={{ '--accent': current.color } as CSSProperties}>
        <div className="label">
          <b>
            {current.n} · {current.name}
          </b>{' '}
          — {current.desc}
        </div>
        <div className="slots">
          {FACES.map((f, i) => (
            <button
              key={f.n}
              className={`slot ${f.n === face ? 'selected' : ''} ${f.unlocked ? '' : 'locked'} ${shaking === f.n ? 'shake' : ''}`}
              style={{ '--accent': f.color } as CSSProperties}
              onClick={() => select(f.n)}
              aria-label={f.unlocked ? `Face ${f.n}: ${f.name}` : `Face ${f.n} bloqueada`}
            >
              <img src={icons[i]} alt="" />
            </button>
          ))}
        </div>
        <div className="hint hint-pc">arraste pra olhar · WASD anda · 1–6 troca a face (4–6 ainda bloqueadas)</div>
        <div className="hint hint-touch">esquerda: andar · direita: olhar · toque nas faces embaixo</div>
      </div>

      <div className="rotate">
        <div className="phone" />
        <p>Gire o celular para o modo horizontal</p>
      </div>
    </div>
  );
}
