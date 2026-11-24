import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { AudioMode } from './scene/audio';
import { createScene, type ChalkMode, type SceneApi, type StickState, type Tool } from './scene/scene';
import { startMapDemo } from './book/mapdemo';
import { LAB_WORDS } from './scene/rooms/lab';
import { diary, diaryStore } from './story/diary';
import { dialogue, dialogueStore } from './story/dialogue';
import { useStore } from './story/store';
import { ui, uiStore } from './story/ui';
import { BookIcon } from './ui/BookIcon';
import { BoatoBubble } from './ui/BoatoBubble';
import { DialogueBox } from './ui/DialogueBox';
import { WordGlyph } from './ui/Glyph';

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
  // o que o jogador já tem nas mãos (começa sem nada) e o que está ao alcance pra interagir
  const [inv, setInv] = useState({ die: false, chalk: false });
  const [prompt, setPrompt] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>('die');
  const [chalkMode, setChalkMode] = useState<ChalkMode>('draw');
  const [credits, setCredits] = useState(false);
  // PC: o mouse precisa ser capturado (clique) pra olhar livremente
  const [look, setLook] = useState<'locked' | 'free' | 'denied'>('free');
  const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  const [audio, setAudio] = useState<AudioMode>(() => {
    try {
      const v = Number(localStorage.getItem('mdd-audio'));
      return v === 1 || v === 2 ? v : 0;
    } catch {
      return 0;
    }
  });
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(null);
  const captionTimer = useRef(0);
  const dry = useStore(diaryStore);
  const talking = useStore(dialogueStore) !== null;
  const uis = useStore(uiStore);
  const diaryOpen = uis.diaryOpen;
  const [toast, setToast] = useState<{ id: string; n: number } | null>(null);
  const toastTimer = useRef(0);

  const sound = useCallback((name: 'uiblip' | 'uiopen' | 'uiclose' | 'uinew', v?: number) => sceneRef.current?.playUi(name, v), []);
  const toggleDiary = useCallback(() => {
    if (dialogue.blocking) return;
    ui.setDiary(!ui.diaryOpen()); // o livro (src/book) cuida da animação e dos sons
  }, []);

  // J abre o diário (Esc e J fecham, dentro do próprio diário)
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k !== 'j' || e.repeat || ui.diaryOpen()) return;
      if ((e.target as HTMLElement | null)?.tagName === 'TEXTAREA') return;
      toggleDiary();
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [toggleDiary]);

  // símbolo novo: aviso rápido no topo
  useEffect(() => {
    if (!dry.last) return;
    setToast(dry.last);
    sound('uinew');
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }, [dry.last, sound]);

  // ?demo=1: pré-visualização do diário e da conversa (não grava nada no aparelho)
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.has('lab')) diary.lab(LAB_WORDS); // sala de teste: as palavras da sala já estão no diário
    if (!q.has('demo')) return;
    diary.demo();
    if (q.get('demo') === 'mapa') {
      const m = startMapDemo();
      diary.demoMap(m.rooms, m.here, m.strokes, m.stamps);
    }
    // Falas de EXEMPLO: a história de verdade será escrita depois.
    const t = window.setTimeout(
      () =>
        dialogue.say([
          { who: 'boato', glyphs: ['eu', 'ter', 'medo'] },
          { who: 'thought', text: 'Ele fala sem voz. Os símbolos aparecem no ar, como se alguém os escrevesse.' },
          { who: 'escrivao', glyphs: ['voce', 'poder', 'ajudar', 'eu', 'perg'] },
          { who: 'thought', text: 'Parece uma pergunta. Vou anotar no diário o que eu acho que significa.' },
        ]),
      1400,
    );
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    let hintTimer = 0;
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
      onLook: setLook,
      onPrompt: setPrompt,
      onInventory: (i) => {
        setInv(i);
        // ganhou o dado: mostra de novo as dicas de controle
        if (i.die) {
          setHint(true);
          window.clearTimeout(hintTimer);
          hintTimer = window.setTimeout(() => setHint(false), 9000);
        }
      },
    });
    sceneRef.current = scene;
    return () => {
      window.clearTimeout(hintTimer);
      scene.dispose();
    };
  }, []);

  // som: 0 = música + efeitos, 1 = só efeitos, 2 = mudo (lembra a escolha)
  useEffect(() => {
    sceneRef.current?.setAudio(audio);
    try {
      localStorage.setItem('mdd-audio', String(audio));
    } catch {
      /* sem armazenamento: tudo bem */
    }
  }, [audio]);

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
        <button className="diary-btn" onClick={toggleDiary} aria-label="Diário" title="Diário (J)">
          <BookIcon />
          {dry.unread > 0 && <span className="badge">{dry.unread > 9 ? '9+' : dry.unread}</span>}
        </button>
        <button
          onClick={() => setAudio(((audio + 1) % 3) as AudioMode)}
          aria-label="Som"
          title={['Som: música e efeitos', 'Som: só efeitos', 'Som: mudo'][audio]}
        >
          {['♫', '♪', '∅'][audio]}
        </button>
        <button onClick={reset} aria-label="Reiniciar sala" title="Reiniciar sala (R)">
          ↺
        </button>
        <button onClick={() => setCredits(true)} aria-label="Créditos" title="Créditos dos sons">
          ⓘ
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

      {toast && (
        <div key={toast.n} className="toast">
          <WordGlyph id={toast.id} size={30} />
          <span>
            <b>AVISTADO</b> · anotado no diário (J)
          </span>
        </div>
      )}

      {prompt && (
        <div className="prompt">
          <b className="hint-pc">E</b>
          {prompt}
        </div>
      )}
      <BoatoBubble left={tool === 'chalk'} />

      {inv.die && hint && (
        <div className="hint">
          <span className="hint-pc">
            clique: capturar o mouse · esq.: arremessar · dir./G: posicionar · Tab: trocar dado ↔ giz · J: diário · com o giz: segure esq. p/ desenhar, dir. p/ apagar, X limpa tudo · WASD
          </span>
          <span className="hint-touch">à direita: arremessar, posicionar, girar · esquerda: andar · GIZ no canto (com o giz, a borda direita gira a câmera)</span>
        </div>
      )}

      {!complete && !inv.die && prompt && (
        <div className="touchbtns">
          <button className="btn-throw" onPointerDown={(e) => { e.preventDefault(); sceneRef.current?.action(); }} aria-label={prompt}>
            <span className="ico">✋</span>
            <span>AGIR</span>
          </button>
        </div>
      )}

      {!complete && inv.die && tool === 'die' && (
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
            <span className="ico">{prompt ? '✋' : dieOut ? '↩' : '⤴'}</span>
            <span>{prompt ? 'AGIR' : dieOut ? 'RECOLHER' : 'ARREMESSAR'}</span>
          </button>
        </div>
      )}

      {!complete && inv.die && inv.chalk && (
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

      {tool === 'chalk' && !complete && (
        <div className="lookzone" aria-hidden="true">
          <span>◉</span>
          <span>OLHAR</span>
        </div>
      )}

      {!coarse && look === 'free' && !complete && !credits && !diaryOpen && !uis.bookOut && !talking && (
        <div className="clicktoplay" aria-hidden="true">
          <b>Clique para jogar</b>
          <span>WASD anda · Shift corre · mouse olha · Esc solta o mouse</span>
        </div>
      )}

      <DialogueBox onSound={sound} />

      {credits && (
        <div className="credits" onPointerDown={() => setCredits(false)}>
          <div className="credits-box" onPointerDown={(e) => e.stopPropagation()}>
            <h2>Créditos dos sons</h2>
            <p>
              <b>Instrumentos</b> (música, sinos e notas): amostras reais do soundfont <i>FluidR3_GM</i>, de Frank Wen
              (CC BY 3.0) — violoncelo, cordas, coro, harpa, celesta, glockenspiel, flauta, tímpano e sinos tubulares.
            </p>
            <p>
              <b>Efeitos</b> (CC0, via OpenGameArt.org): Kenney (RPG Sound Pack), rubberduck (100 CC0 SFX), Fantozzi
              (passos), qubodup (bola rolando), e gravações de giz, borracha, porta de pedra, arrastos, chama, lareira
              e vapor.
            </p>
            <button onClick={() => setCredits(false)}>Fechar</button>
          </div>
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
