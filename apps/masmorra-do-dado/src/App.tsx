import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { FACES } from './faces';
import { pipCanvas } from './scene/textures';
import { createScene, type SceneApi } from './scene/scene';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneApi | null>(null);
  const [face, setFace] = useState(1);
  const [shaking, setShaking] = useState(0);

  const icons = useMemo(() => FACES.map((f) => pipCanvas(f.n).toDataURL()), []);

  useEffect(() => {
    sceneRef.current = createScene(canvasRef.current!);
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
        <div className="hint">arraste pra olhar · WASD anda · 1–6 troca a face (4–6 ainda bloqueadas)</div>
      </div>
    </div>
  );
}
