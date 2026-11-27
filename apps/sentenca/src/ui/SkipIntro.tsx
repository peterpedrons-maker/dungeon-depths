import { useEffect, useRef, useState } from 'react';

// PULAR A INTRODUÇÃO (DESIGN.md §92, pedido do Pedro): uma plaquinha de pedra no alto, à direita, enquanto a abertura dura (do acordar até o dado
// estar na mão). SEGURAR (não basta tocar, para ninguém pular sem querer): no PC, a tecla Espaço (o mouse está preso no jogo); no celular, o
// dedo na plaquinha. Uma faixa de ouro enche em 1 segundo; cheia, pula.
const HOLD_MS = 1000;

export function SkipIntro({ onSkip, coarse }: { onSkip: () => void; coarse: boolean }) {
  const [k, setK] = useState(0);
  const key = useRef(false);
  const ptr = useRef(false);
  const t0 = useRef(0);
  const fired = useRef(false);
  const raf = useRef(0);
  const run = useRef<() => void>(() => {});
  run.current = () => {
    cancelAnimationFrame(raf.current);
    const loop = (now: number) => {
      if (!key.current && !ptr.current) {
        t0.current = 0;
        setK(0);
        return;
      }
      if (!t0.current) t0.current = now;
      const p = Math.min(1, (now - t0.current) / HOLD_MS);
      setK(p);
      if (p >= 1) {
        if (!fired.current) {
          fired.current = true;
          onSkip();
        }
        return;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  };
  useEffect(() => {
    // (na fase de captura, no window: a caixa de conversa também ouve o Espaço ali, para passar a fala, e isso não pode engolir o segurar)
    const down = (e: KeyboardEvent) => {
      if (e.key !== ' ' || key.current) return;
      key.current = true;
      run.current();
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === ' ') key.current = false;
    };
    const blur = () => {
      key.current = false;
      ptr.current = false;
    };
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down, true);
      window.removeEventListener('keyup', up, true);
      window.removeEventListener('blur', blur);
      cancelAnimationFrame(raf.current);
    };
  }, []);
  const release = () => {
    ptr.current = false;
  };
  return (
    <div
      className={`skipintro${k > 0 ? ' holding' : ''}`}
      role="button"
      aria-label="Segure para pular a introdução"
      onPointerDown={(e) => {
        e.stopPropagation();
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* (sem captura: soltar fora da plaquinha só não é visto) */
        }
        ptr.current = true;
        run.current();
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      {!coarse && <span className="keycap-hud">Espaço</span>}
      <span className="skipintro-t">Segure para pular a introdução</span>
      <i className="skipintro-bar" style={{ transform: `scaleX(${k})` }} />
    </div>
  );
}
