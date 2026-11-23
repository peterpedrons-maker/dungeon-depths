import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createScene, type ChalkMode, type SceneApi, type StickState, type Tool } from './scene/scene';

const STICK_R = 46;

interface InstallEvent extends Event {
  prompt(): Promise<void>;
}

interface Caption {
  id: number;
  title: string;
  sub: string;
  color: string;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneApi | null>(null);
  const [stickOn, setStickOn] = useState(false);
  const stickRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [caption, setCaption] = useState<Caption | null>(null);
  const [complete, setComplete] = useState<{ gem: boolean } | null>(null);
  const [hint, setHint] = useState(true);
  const [dieOut, setDieOut] = useState(false);
  const [tool, setTool] = useState<Tool>('die');
  const [chalkMode, setChalkMode] = useState<ChalkMode>('draw');
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(null);
  const captionTimer = useRef(0);

  useEffect(() => {
    const scene = createScene(canvasRef.current!, {
      // o analógico mexe direto no DOM (sem re-renderizar o React a cada toque)
      onStick: (st: StickState) => {
        setStickOn((on) => (on === st.active ? on : st.active));
        if (stickRef.current) {
          stickRef.current.style.left = `${st.ox - STICK_R}px`;
          stickRef.current.style.top = `${st.oy - STICK_R}px`;
        }
        if (thumbRef.current) thumbRef.current.style.transform = `translate(${st.x * STICK_R}px, ${st.y * STICK_R}px)`;
      },
      onCaption: (title, sub, color) => {
        setCaption({ id: performance.now(), title, sub, color });
        window.clearTimeout(captionTimer.current);
        captionTimer.current = window.setTimeout(() => setCaption(null), 3800);
      },
      onComplete: setComplete,
      onDie: (st) => setDieOut(st !== 'hand'),
      onTool: setTool,
    });
    sceneRef.current = scene;
    const hintTimer = window.setTimeout(() => setHint(false), 9000);
    return () => {
      window.clearTimeout(hintTimer);
      scene.dispose();
    };
  }, []);

  // "Instalar": o navegador avisa quando o jogo pode ser instalado (PWA)
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as InstallEvent);
    };
    const onInstalled = () => setInstallEvt(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = () => {
    installEvt?.prompt().finally(() => setInstallEvt(null));
  };

  const reset = () => {
    setCaption(null);
    sceneRef.current?.reset();
  };
  const restart = () => {
    setComplete(null);
    setCaption(null);
    sceneRef.current?.restart();
  };
  const pickMode = (m: ChalkMode) => {
    setChalkMode(m);
    sceneRef.current?.setChalkMode(m);
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
        {installEvt && (
          <button onClick={install} aria-label="Instalar o jogo" title="Instalar o jogo">
            ⤓
          </button>
        )}
        {document.fullscreenEnabled && (
          <button onClick={fullscreen} aria-label="Tela cheia" title="Tela cheia">
            ⛶
          </button>
        )}
      </div>

      <div ref={stickRef} className="stick" style={{ display: stickOn ? 'block' : 'none' }}>
        <div ref={thumbRef} className="thumb" />
      </div>

      {caption && (
        <div key={caption.id} className="caption" style={{ '--accent': caption.color } as CSSProperties}>
          <b>{caption.title}</b>
          <span>{caption.sub}</span>
        </div>
      )}

      {hint && (
        <div className="hint">
          <span className="hint-pc">
            clique: capturar o mouse · esq.: arremessar · dir./G: posicionar · Tab: trocar dado ↔ giz · com o giz: segure esq. p/ desenhar, dir. p/ apagar, X limpa tudo · WASD
          </span>
          <span className="hint-touch">à direita: arremessar, posicionar e girar · esquerda: andar · arraste: olhar · GIZ no canto</span>
        </div>
      )}

      {!complete && tool === 'die' && (
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
          {!dieOut && (
            <button
              className="btn-place"
              onPointerDown={(e) => {
                e.preventDefault();
                sceneRef.current?.place();
              }}
              aria-label="Posicionar o dado onde a mira aponta"
            >
              <span className="ico">⌖</span>
              <span>POSICIONAR</span>
            </button>
          )}
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

      {!complete && (
        <div className={`soapbtns${tool === 'chalk' ? ' chalk' : ''}`}>
          <button
            className="soap-swap"
            aria-label={tool === 'die' ? 'Pegar o giz' : 'Pegar o dado'}
            onPointerDown={(e) => {
              e.preventDefault();
              sceneRef.current?.swapTool();
            }}
          >
            <span className="ico">{tool === 'die' ? '✎' : '⚀'}</span>
            <span>{tool === 'die' ? 'GIZ' : 'DADO'}</span>
          </button>
          {tool === 'chalk' && (
            <>
              {(
                [
                  ['draw', '✎', 'Desenhar'],
                  ['erase', '⌫', 'Apagar'],
                  ['look', '◉', 'Olhar'],
                ] as [ChalkMode, string, string][]
              ).map(([m, ico, label]) => (
                <button
                  key={m}
                  className={`soap-mode${chalkMode === m ? ' on' : ''}`}
                  aria-label={label}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    pickMode(m);
                  }}
                >
                  <span className="ico">{ico}</span>
                  <span>{label.toUpperCase()}</span>
                </button>
              ))}
              <button
                className="soap-clear"
                aria-label="Apagar tudo"
                onPointerDown={(e) => {
                  e.preventDefault();
                  sceneRef.current?.clearChalk();
                }}
              >
                <span className="ico">⌧</span>
                <span>LIMPAR</span>
              </button>
            </>
          )}
        </div>
      )}

      {complete && (
        <div className="done">
          <h1>Fim da demonstração</h1>
          <p>{complete.gem ? 'Você achou a gema escondida da primeira sala ✦' : 'Ainda havia uma gema escondida na primeira sala…'}</p>
          <button onClick={restart}>Jogar de novo</button>
        </div>
      )}

      <div className="rotate">
        <div className="phone" />
        <p>Gire o celular para o modo horizontal</p>
      </div>
    </div>
  );
}
