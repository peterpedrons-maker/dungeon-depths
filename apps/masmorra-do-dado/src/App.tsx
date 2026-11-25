import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { createScene, type ChalkMode, type SceneApi, type StickState, type Tool } from './scene/scene';
import { startMapDemo } from './book/mapdemo';
import { LAB_WORDS } from './scene/rooms/lab';
import { diary, diaryStore } from './story/diary';
import { progressStore } from './story/progress';
import { dialogue, dialogueStore } from './story/dialogue';
import { chatterStore } from './story/chatter';
import { useStore } from './story/store';
import { ui, uiStore } from './story/ui';
import { BookIcon } from './ui/BookIcon';
import { PixelIcon } from './ui/PixelIcon';
import { BoatoBubble } from './ui/BoatoBubble';
import { DialogueBox } from './ui/DialogueBox';
import { QuizPanel } from './ui/QuizPanel';
import { quiz } from './story/quiz';
import { WordGlyph } from './ui/Glyph';
import { useUiScale } from './ui/scale';
import { Credits, PauseMenu, SaveIndicator, TitleScreen } from './ui/Menus';
import { saves } from './story/save';
import { configStore } from './story/config';

// TELA INICIAL ao abrir a página (INTERFACE.md §3.1); não aparece logo depois de escolher um espaço (a página recarrega já no jogo)
// nem nas pré-visualizações e testes (?demo, ?lab, ?intro=0, ?titulo=0)
const Q = new URLSearchParams(location.search);
const PLAY_NOW = saves.consumePlay();
const SHOW_TITLE = !PLAY_NOW && !Q.has('demo') && !Q.has('lab') && Q.get('intro') !== '0' && Q.get('titulo') !== '0';

const STICK_R = 46;

interface Caption {
  id: number;
  title: string;
  sub: string;
  color: string;
}

export default function App() {
  const uiK = useUiScale();
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
  const [credits, setCredits] = useState(false); // créditos no fim da demonstração
  // PC: o mouse precisa ser capturado (clique) pra olhar livremente
  const [look, setLook] = useState<'locked' | 'free' | 'denied'>('free');
  const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  const captionTimer = useRef(0);
  const completeRef = useRef(false);
  const openPauseRef = useRef<() => void>(() => {});
  const dry = useStore(diaryStore);
  const talking = useStore(dialogueStore) !== null;
  const dieTalking = useStore(chatterStore) !== null; // o balão do dado
  const uis = useStore(uiStore);
  const prog = useStore(progressStore);
  // o diário só existe depois que o jogador acha o caderno (sala 2); a demonstração e a sala de teste já começam com ele
  const hasBook = !!prog.flags.caderno || /[?&](demo|lab)=/.test(location.search);
  // REGRA: nada se sobrepõe na tela. Enquanto alguém fala (caixa de conversa, balão do dado) ou há cena (faixas), avisos, legendas, dicas e botões esperam ou somem.
  const speaking = talking || dieTalking || uis.bars;
  const diaryOpen = uis.diaryOpen;
  const [toast, setToast] = useState<{ id: string; n: number } | null>(null);
  const [toastQ, setToastQ] = useState<{ id: string; n: number }[]>([]); // avisos de "avistado" esperando o fim da conversa
  const toastTimer = useRef(0);

  const sound = useCallback((name: 'uiblip' | 'uiopen' | 'uiclose' | 'uinew' | 'write', v?: number) => sceneRef.current?.playUi(name, v), []);
  const hasBookRef = useRef(hasBook);
  hasBookRef.current = hasBook;
  const toggleDiary = useCallback(() => {
    if (dialogue.blocking || quiz.active() || !hasBookRef.current) return;
    if (!ui.diaryOpen() && ui.bookCall()) {
      // 1ª abertura do caderno: modo guiado (vira até BRASEIRO e pede uma anotação)
      ui.setBookCall(false);
      ui.setGuided(true);
    }
    if (ui.diaryOpen() && ui.guided() && !ui.uiGuidedOk()) return; // no modo guiado, só fecha depois de escrever alguma coisa
    ui.setDiary(!ui.diaryOpen()); // o livro (src/book) cuida da animação e dos sons
  }, []);

  // PAUSA (INTERFACE.md §3.2): Esc, o mouse solto no meio do jogo ou o botão do celular. O jogo salva ao pausar.
  const pausable = () => ui.menu() === null && !ui.diaryOpen() && !uiStore.get().bookOut && !dialogue.blocking && !quiz.active() && !completeRef.current;
  const openPause = useCallback(() => {
    if (!pausable()) return;
    ui.setMenu('pause');
    sceneRef.current?.saveNow();
    sound('uiopen', 0.7);
    if (document.pointerLockElement) document.exitPointerLock();
  }, [sound]);
  const resume = () => {
    ui.setMenu(null);
    sceneRef.current?.lock(); // (no PC, captura o mouse de novo: estamos dentro do clique)
  };
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.repeat) return;
      if (ui.menu() === null) openPause(); // (com o menu aberto, o próprio menu cuida do Esc)
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [openPause]);

  // J (ou a tecla escolhida) abre o diário (Esc e J fecham, dentro do próprio diário)
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k !== configStore.get().keys.diario || e.repeat || ui.diaryOpen() || ui.menu() !== null) return;
      if ((e.target as HTMLElement | null)?.tagName === 'TEXTAREA') return;
      toggleDiary();
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [toggleDiary]);

  // a dica de controles some 9 s depois de aparecer (só conta o tempo em que ela está visível)
  const hintShown = inv.die && hint && !speaking && !toast && !caption && !uis.bookOut && uis.menu === null;
  useEffect(() => {
    if (!hintShown) return;
    const t = window.setTimeout(() => setHint(false), 9000);
    return () => window.clearTimeout(t);
  }, [hintShown]);

  // símbolo novo: aviso rápido no topo
  // (os avisos entram numa fila e só aparecem DEPOIS da conversa; no máximo os 3 mais recentes)
  useEffect(() => {
    if (!dry.last || !hasBookRef.current) return; // sem o caderno, o jogo guarda os símbolos em silêncio
    const l = dry.last;
    setToastQ((q) => (q.some((x) => x.n === l.n) ? q : [...q, l].slice(-3)));
  }, [dry.last]);
  useEffect(() => {
    if (speaking || uis.bookOut || uis.bookCall || toast || !toastQ.length) return;
    const [next, ...rest] = toastQ;
    setToastQ(rest);
    setToast(next);
    sound('uinew');
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }, [speaking, uis.bookOut, uis.bookCall, toast, toastQ, sound]);

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
          { who: 'thought', text: 'Ele fala sem voz. Os símbolos aparecem no ar, como se alguém os escrevesse.' },
          { who: 'escrivao', glyphs: ['voce', 'poder', 'ajudar', 'eu', 'perg'] },
          { who: 'thought', text: 'Parece uma pergunta. Vou anotar no diário o que eu acho que significa.' },
        ]),
      1400,
    );
    return () => window.clearTimeout(t);
  }, []);

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
      onComplete: (c) => {
        completeRef.current = true;
        setComplete(c);
      },
      title: SHOW_TITLE,
      onPause: () => openPauseRef.current(),
      onDie: (st) => setDieOut(st !== 'hand'),
      onTool: setTool,
      onLook: setLook,
      onPrompt: setPrompt,
      onInventory: (i) => {
        setInv(i);
        // ganhou o dado: mostra de novo as dicas de controle
        if (i.die) {
          setHint(true);
        }
      },
    });
    sceneRef.current = scene;
    return () => {
      scene.dispose();
    };
  }, []);

  openPauseRef.current = openPause;

  const resetRoom = () => {
    setCaption(null);
    ui.setMenu(null);
    sceneRef.current?.reset();
    sceneRef.current?.lock();
  };
  const pickMode = (m: ChalkMode) => {
    setChalkMode(m);
    sceneRef.current?.setChalkMode(m);
  };

  const inMenu = uis.menu !== null;

  return (
    <div className="stage">
      <canvas ref={canvasRef} />
      <div className="vignette" />
      <div className={`bars${uis.bars ? ' on' : ''}`} aria-hidden="true">
        <i />
        <i />
      </div>
      {!inMenu && <div className={`crosshair${prompt && !speaking ? ' on' : ''}`} />}
      {/* o caderno acabou de ser achado: a tela escurece e só o botão do diário fica aceso, pulsando */}
      <div className={`book-call${uis.bookCall && !uis.bookOut ? ' on' : ''}`} aria-hidden="true" />

      {/* NADA FIXO NO PC (INTERFACE.md §4). No celular, só a pausa; o diário ganha um botão depois do caderno. No PC o botão do diário só aparece
          no momento em que o caderno é achado (a tela escurece e ele pulsa) */}
      {!inMenu && !complete && (
        <div className="hudbtns">
          {hasBook && (coarse || uis.bookCall) && !uis.bookOut && (
            <button className={`diary-btn${uis.bookCall || (uis.guided && uis.guidedNote) ? ' call' : ''}`} onClick={toggleDiary} aria-label="Diário" title="Diário (J)">
              <BookIcon />
              {dry.unread > 0 && !uis.bookCall && <span className="badge">{dry.unread > 9 ? '9+' : dry.unread}</span>}
            </button>
          )}
          {coarse && !uis.bookOut && (
            <button onClick={openPause} aria-label="Pausa">
              <PixelIcon name="pausa" />
            </button>
          )}
        </div>
      )}

      <div ref={stickRef} className="stick" style={{ display: stickOn ? 'block' : 'none' }}>
        <div ref={thumbRef} className="thumb" />
      </div>

      {caption && !speaking && !toast && !uis.bookOut && !inMenu && (
        <div key={caption.id} className="caption" style={{ '--accent': caption.color } as CSSProperties}>
          <b>{caption.title}</b>
          <span>{caption.sub}</span>
        </div>
      )}

      {toast && !speaking && !uis.bookOut && (
        <div key={toast.n} className="toast">
          <WordGlyph id={toast.id} size={Math.round(30 * uiK)} />
          <span>
            <b>AVISTADO</b> · anotado no diário (J)
          </span>
        </div>
      )}

      {prompt && !speaking && !inMenu && (
        <div className="prompt">
          <b className="hint-pc">E</b>
          {prompt}
        </div>
      )}
      <BoatoBubble onSound={sound} />

      {hintShown && (
        <div className="hint">
          <span className="hint-pc">
            WASD anda · clique arremessa · G posiciona
            <br />
            1-6 trocam a face · E age · J diário
          </span>
          <span className="hint-touch">
            esquerda: andar · direita: olhar
            <br />
            botões: arremessar, posicionar, girar
          </span>
        </div>
      )}

      {!complete && !inMenu && !inv.die && prompt && !speaking && (
        <div className="touchbtns">
          <button className="btn-throw" onPointerDown={(e) => { e.preventDefault(); sceneRef.current?.action(); }} aria-label={prompt}>
            <span className="ico"><PixelIcon name="agir" /></span>
            <span>AGIR</span>
          </button>
        </div>
      )}

      {!complete && !inMenu && inv.die && tool === 'die' && !uis.bars && (
        <div className="touchbtns">
          <button
            className="btn-rotate"
            onPointerDown={(e) => {
              e.preventDefault();
              sceneRef.current?.rotate();
            }}
            aria-label="Girar o dado"
          >
            <span className="ico"><PixelIcon name="girar" /></span>
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
              <span className="ico"><PixelIcon name="posicionar" /></span>
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
            <span className="ico"><PixelIcon name={prompt ? 'agir' : dieOut ? 'recolher' : 'arremessar'} /></span>
            <span>{prompt ? 'AGIR' : dieOut ? 'RECOLHER' : 'ARREMESSAR'}</span>
          </button>
        </div>
      )}

      {!complete && !inMenu && inv.die && inv.chalk && (
        <div className={`soapbtns${tool === 'chalk' ? ' chalk' : ''}`} style={uis.bars ? { display: 'none' } : undefined}>
          <button
            className="soap-swap"
            aria-label={tool === 'die' ? 'Pegar o giz' : 'Pegar o dado'}
            onPointerDown={(e) => {
              e.preventDefault();
              sceneRef.current?.swapTool();
            }}
          >
            <span className="ico"><PixelIcon name={tool === 'die' ? 'giz' : 'dado'} size={20} /></span>
            <span>{tool === 'die' ? 'GIZ' : 'DADO'}</span>
          </button>
          {tool === 'chalk' && (
            <>
              {(
                [
                  ['draw', 'giz', 'Desenhar'],
                  ['erase', 'apagar', 'Apagar'],
                ] as [ChalkMode, 'giz' | 'apagar', string][]
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
                  <span className="ico"><PixelIcon name={ico} size={20} /></span>
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
                <span className="ico"><PixelIcon name="limpar" size={20} /></span>
                <span>LIMPAR</span>
              </button>
            </>
          )}
        </div>
      )}

      {tool === 'chalk' && !complete && (
        <div className="lookzone" aria-hidden="true">
          <span><PixelIcon name="olhar" /></span>
          <span>OLHAR</span>
        </div>
      )}

      {!coarse && look === 'free' && !complete && !inMenu && !diaryOpen && !uis.bookOut && !speaking && (
        <div className="clicktoplay" aria-hidden="true">
          <b>Clique para jogar</b>
          <span>WASD anda · Shift corre · mouse olha · Esc solta o mouse</span>
        </div>
      )}

      <DialogueBox onSound={sound} />
      <QuizPanel onSound={sound} />

      {uis.menu === 'title' && <TitleScreen onBegin={() => sceneRef.current?.begin()} snd={sound} />}
      {uis.menu === 'pause' && (
        <PauseMenu
          hasBook={hasBook}
          onResume={resume}
          onDiary={() => {
            ui.setMenu(null);
            toggleDiary();
          }}
          onResetRoom={resetRoom}
          onTitle={() => sceneRef.current?.toTitle()}
          snd={sound}
        />
      )}
      <SaveIndicator hidden={uis.menu === 'title'} />

      {complete && (
        <div className="done">
          <h1>Fim da demonstração</h1>
          <p>{complete.gem ? 'Você achou uma gema escondida.' : 'Ainda havia gemas escondidas pelo caminho.'}</p>
          <div className="row-btns">
            <button onClick={() => setCredits(true)}>Créditos</button>
            <button onClick={() => sceneRef.current?.toTitle()}>Voltar à tela inicial</button>
          </div>
        </div>
      )}
      {credits && <Credits onBack={() => setCredits(false)} snd={sound} />}

      <div className="rotate">
        <div className="phone" />
        <p>Gire o celular para o modo horizontal</p>
      </div>
    </div>
  );
}
