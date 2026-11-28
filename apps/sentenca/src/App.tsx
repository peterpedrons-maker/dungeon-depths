import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createScene, type ChalkMode, type SceneApi, type StickState, type Tool } from './scene/scene';
import { startMapDemo } from './book/mapdemo';
import { LAB_WORDS } from './scene/rooms/lab';
import { diary, diaryStore } from './story/diary';
import { progressStore } from './story/progress';
import { dialogue, dialogueStore } from './story/dialogue';
import { chatterStore } from './story/chatter';
import { useStore } from './story/store';
import { ui, uiStore } from './story/ui';
import { PixelIcon } from './ui/PixelIcon';
import { BoatoBubble } from './ui/BoatoBubble';
import { DialogueBox } from './ui/DialogueBox';
import { QuizPanel } from './ui/QuizPanel';
import { quiz } from './story/quiz';
import { WordGlyph } from './ui/Glyph';
import { useUiScale } from './ui/scale';
import { Credits, LanguagePick, PauseMenu, SaveIndicator, TitleScreen, type TitleApi } from './ui/Menus';
import { Splash } from './ui/Splash';
import { LoadingScreen } from './ui/LoadingScreen';
import { SkipIntro } from './ui/SkipIntro';
import { AimNote, ReadingStrip } from './ui/NoteTags';
import { Bench } from './ui/Bench';
import { saves } from './story/save';
import { config, configStore, keyName } from './story/config';
import type { IconName } from './ui/PixelIcon';
import { T, tx, useLang } from './i18n';

// o ícone de cada aviso de ação (pelo verbo do texto)
// (o aviso já chega no idioma escolhido: os verbos dos três idiomas)
const actionIcon = (label: string | null): IconName =>
  !label ? 'agir' : /^(Pegar|Take|Tomar)/i.test(label) ? 'pegar' : /(abrir|open)/i.test(label) ? 'abrir' : /^(Ler|Olhar|Read|Look|Leer|Mirar)/i.test(label) ? 'ler' : 'agir';

// os textos da interface do jogo, nos três idiomas (src/i18n.ts)
const A = {
  notebook: T('Caderno', 'Notebook', 'Cuaderno'),
  pause: T('Pausa', 'Pause', 'Pausa'),
  noted: T('Anotado no caderno.', 'Noted in the notebook.', 'Anotado en el cuaderno.'),
  hintPc1: T('WASD anda · clique arremessa · G posiciona', 'WASD moves · click throws · G places', 'WASD mueve · clic lanza · G coloca'),
  hintPc2: T('1-6 trocam a face · E age · J caderno', '1-6 change the face · E acts · J notebook', '1-6 cambian la cara · E actúa · J cuaderno'),
  hintT1: T('esquerda: andar · direita: olhar', 'left: walk · right: look', 'izquierda: andar · derecha: mirar'),
  hintT2: T('botões: arremessar, posicionar, girar', 'buttons: throw, place, turn', 'botones: lanzar, colocar, girar'),
  act: T('AGIR', 'ACT', 'ACTUAR'),
  turnDie: T('Girar o dado', 'Turn the die', 'Girar el dado'),
  turn: T('GIRAR', 'TURN', 'GIRAR'),
  placeDie: T('Posicionar o dado onde a mira aponta', 'Place the die where the crosshair points', 'Colocar el dado donde apunta la mira'),
  place: T('POSICIONAR', 'PLACE', 'COLOCAR'),
  recallDie: T('Recolher o dado', 'Recall the die', 'Recoger el dado'),
  throwDie: T('Arremessar o dado', 'Throw the die', 'Lanzar el dado'),
  recall: T('RECOLHER', 'RECALL', 'RECOGER'),
  throw: T('ARREMESSAR', 'THROW', 'LANZAR'),
  takeChalk: T('Pegar o giz', 'Take the chalk', 'Tomar la tiza'),
  takeDie: T('Pegar o dado', 'Take the die', 'Tomar el dado'),
  chalk: T('GIZ', 'CHALK', 'TIZA'),
  die: T('DADO', 'DIE', 'DADO'),
  draw: T('Desenhar', 'Draw', 'Dibujar'),
  erase: T('Apagar', 'Erase', 'Borrar'),
  eraseAll: T('Apagar tudo', 'Erase everything', 'Borrar todo'),
  clear: T('LIMPAR', 'CLEAR', 'LIMPIAR'),
  look: T('OLHAR', 'LOOK', 'MIRAR'),
  clickPlay: T('Clique para jogar', 'Click to play', 'Haz clic para jugar'),
  clickHelp: T('WASD anda · Shift corre · mouse olha · Esc solta o mouse', 'WASD moves · Shift runs · mouse looks · Esc frees the mouse', 'WASD mueve · Shift corre · ratón mira · Esc suelta el ratón'),
  demoEnd: T('Fim da demonstração', 'End of the demo', 'Fin de la demostración'),
  gemFound: T('Você achou uma gema escondida.', 'You found a hidden gem.', 'Encontraste una gema escondida.'),
  gemsLeft: T('Ainda havia gemas escondidas pelo caminho.', 'There were still gems hidden along the way.', 'Aún quedaban gemas escondidas por el camino.'),
  credits: T('Créditos', 'Credits', 'Créditos'),
  toTitle: T('Voltar à tela inicial', 'Back to the title screen', 'Volver a la pantalla de inicio'),
  rotate: T('Gire o celular para o modo horizontal', 'Turn your phone to landscape', 'Gira el móvil a horizontal'),
};

// TELA INICIAL ao abrir a página (INTERFACE.md §3.1); não aparece logo depois de escolher um espaço (a página recarrega já no jogo)
// nem nas pré-visualizações e testes (?demo, ?lab, ?intro=0, ?titulo=0)
const Q = new URLSearchParams(location.search);
const PLAY_NOW = saves.consumePlay();
// as transições que atravessam o recarregar: jogo novo (o branco do feixe vira o preto) e outro espaço (aparece em pontilhado do preto)
const take = (k: string) => {
  try {
    const v = sessionStorage.getItem(k);
    sessionStorage.removeItem(k);
    return v === '1';
  } catch {
    return false;
  }
};
const FROM_WHITE = take('mdd-white');
const mark = (k: string) => {
  try {
    sessionStorage.setItem(k, '1');
  } catch {
    /* ok */
  }
};
// O TESTE DE DESEMPENHO (?bench=1, ui/Bench.tsx, DESIGN.md §102): sem tela inicial, sem interface do jogo, nada gravado
const BENCH = Q.has('bench');
const SHOW_TITLE = !PLAY_NOW && !BENCH && !Q.has('demo') && !Q.has('lab') && Q.get('intro') !== '0' && Q.get('titulo') !== '0';
// O IDIOMA (src/i18n.ts): ?lang=pt|en|es escolhe direto (testes, links); senão, na 1ª vez que o jogo abre, uma tela pergunta (antes da abertura)
{
  const l = Q.get('lang');
  if (l === 'pt' || l === 'en' || l === 'es') {
    config.set('lang', l);
    config.set('langChosen', true);
  }
}
const ASK_LANG = SHOW_TITLE && !configStore.get().langChosen;
// A TELA DE CARREGAMENTO DA ABERTURA (pedido do Pedro, DESIGN.md §105): a mesma do Novo jogo, logo que o jogo abre, até tudo chegar; depois
// vêm o idioma (na 1ª vez), a editora e a tela inicial. ?boot=0 pula (testes)
const BOOT = SHOW_TITLE && Q.get('boot') !== '0';
// A ABERTURA DA EDITORA (Pedra-Sabão): ao abrir o jogo, uma vez por sessão do navegador (voltar à tela inicial no meio do jogo não repete).
// ?splash=0 pula, ?splash=1 força (testes)
const SPLASH = (() => {
  if (!SHOW_TITLE || Q.get('splash') === '0') return false;
  if (Q.get('splash') === '1') return true;
  try {
    if (sessionStorage.getItem('mdd-splash') === '1') return false;
    sessionStorage.setItem('mdd-splash', '1');
  } catch {
    /* ok */
  }
  return true;
})();

const STICK_R = 46;

interface Caption {
  id: number;
  title: string;
  sub: string;
  color: string;
}

export default function App() {
  useLang(); // (o idioma mudou: a interface se redesenha)
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
  const [fireAim, setFireAim] = useState(false); // a mira está sobre uma frase que o Fogo acende
  const [tool, setTool] = useState<Tool>('die');
  const [chalkMode, setChalkMode] = useState<ChalkMode>('draw');
  const [credits, setCredits] = useState(false); // créditos no fim da demonstração
  // PC: o mouse precisa ser capturado (clique) pra olhar livremente
  const [look, setLook] = useState<'locked' | 'free' | 'denied'>('free');
  const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  const captionTimer = useRef(0);
  const completeRef = useRef(false);
  const [cine, setCine] = useState(true); // cena em curso (a mira some). Começa escondida: a cena avisa no 1º quadro se o jogo já começou
  const [introSkip, setIntroSkip] = useState(false); // a abertura está em curso e dá para pular (DESIGN.md §92)
  const [sceneReady, setSceneReady] = useState(false); // a cena já desenhou e os modelos chegaram (a tela inicial pode aparecer)
  const [splashOn, setSplashOn] = useState(SPLASH);
  const [langAsk, setLangAsk] = useState(ASK_LANG);
  const [booting, setBooting] = useState(BOOT);
  const [titleShown, setTitleShown] = useState(false);
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

  // FOLHA DELA ACHADA (DESIGN.md §78): o personagem pensa uma frase curta, e o botão do caderno pulsa até ele ler (o caderno abre nela)
  const lastPage = useRef<string | null | undefined>(dry.newPage);
  useEffect(() => {
    const np = dry.newPage ?? null;
    if (np === lastPage.current) return;
    lastPage.current = np;
    if (!np) return;
    const n = (dry.pages ?? []).length;
    const known = dry.herKnown ?? !!(dry.notes?.brasa ?? '').trim();
    const lines = !known ? [T('Uma folha arrancada. A mesma letra do caderno.', 'A torn-out page. The same handwriting as the notebook.', 'Una hoja arrancada. La misma letra del cuaderno.')] : n <= 1 ? [T('Uma folha arrancada. A letra dela.', 'A torn-out page. Her handwriting.', 'Una hoja arrancada. Su letra.')] : [[T('Outra folha dela.', 'Another page of hers.', 'Otra hoja suya.'), T('Mais uma folha dela.', 'One more page of hers.', 'Una hoja más de ella.'), T('A letra dela de novo.', 'Her handwriting again.', 'Su letra otra vez.')][n % 3]];
    window.setTimeout(() => dialogue.say(lines.map((text) => ({ who: 'thought' as const, text })), { block: false }), 450);
  }, [dry.newPage, dry.pages, dry.herKnown, dry.notes]);

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
          { who: 'thought', text: T('Fala sem voz.', 'Speech without a voice.', 'Habla sin voz.') },
          { who: 'escrivao', glyphs: ['voce', 'poder', 'ajudar', 'eu', 'perg'] },
          { who: 'thought', text: T('Uma pergunta, acho.', 'A question, I think.', 'Una pregunta, creo.') },
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
      load: PLAY_NOW,
      onReady: () => setSceneReady(true),
      boot: BOOT,
      onBooted: () => setBooting(false),
      onCine: setCine,
      onIntroSkip: setIntroSkip,
      onPause: () => openPauseRef.current(),
      onDie: (st) => setDieOut(st !== 'hand'),
      onTool: setTool,
      onLook: setLook,
      onPrompt: setPrompt,
      onFireAim: setFireAim,
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
  const titleNow = uis.menu === 'title' && sceneReady && !splashOn && !langAsk && !booting;
  useEffect(() => {
    if (titleNow && !titleShown) {
      setTitleShown(true);
      sceneRef.current?.titleReveal();
    }
  }, [titleNow, titleShown]);
  const cfg = useStore(configStore);
  const [whiteIn, setWhiteIn] = useState(FROM_WHITE);
  const titleApi = useMemo<TitleApi>(
    () => ({
      look: (x, y) => sceneRef.current?.titleLook(x, y),
      mood: (m) => sceneRef.current?.titleMood(m),
      credits: (on) => sceneRef.current?.titleCredits(on),
      newGame: (slot) =>
        sceneRef.current?.titleNew(() => {
          mark('mdd-white');
          saves.newGame(slot);
        }),
      play: (slot) => {
        if (slot === saves.active()) sceneRef.current?.titleGo();
        else sceneRef.current?.titleGo(() => saves.play(slot), true);
      },
    }),
    [],
  );

  if (BENCH)
    return (
      <div className="stage bench">
        <canvas ref={canvasRef} />
        <div className="vignette" />
        <Bench api={sceneRef} ready={sceneReady} />
      </div>
    );
  return (
    <div className={`stage${uis.bookOut ? ' book-out' : ''}`}>
      <canvas ref={canvasRef} />
      <div className="vignette" />
      <div className={`bars${uis.bars ? ' on' : ''}`} aria-hidden="true">
        <i />
        <i />
      </div>
      {!inMenu && !cine && !uis.bars && !uis.bookCall &&
        (fireAim && !speaking ? (
          <div className="crosshair fire on" aria-hidden="true">
            <PixelIcon name="fogo" size={32} />
          </div>
        ) : (
          <div className={`crosshair${prompt && !speaking ? ' on' : ''}`} />
        ))}
      {/* (DESIGN.md §101) a anotação da palavra sob a mira e, com a opção ligada, a tira de leitura da escrita olhada */}
      {!inMenu && !cine && !uis.bars && !uis.bookOut && !speaking && <AimNote />}
      {!inMenu && !cine && !uis.bars && !uis.bookOut && !speaking && <ReadingStrip />}
      {/* o caderno acabou de ser achado: a tela escurece e só o botão do diário fica aceso, pulsando */}
      <div className={`book-call${uis.bookCall && !uis.bookOut ? ' on' : ''}`} aria-hidden="true" />

      {introSkip && !inMenu && !uis.bookOut && <SkipIntro coarse={coarse} onSkip={() => sceneRef.current?.skipIntro()} />}
      {/* NADA FIXO NO PC (INTERFACE.md §4). No celular, só a pausa; o diário ganha um botão depois do caderno. No PC o botão do diário só aparece
          no momento em que o caderno é achado (a tela escurece e ele pulsa) */}
      {!inMenu && !complete && (
        <div className="hudbtns">
          {hasBook && (coarse || uis.bookCall || !!dry.newPage) && !uis.bookOut && (
            <button className={`diary-btn${uis.bookCall || (uis.guided && uis.guidedNote) || dry.newPage ? ' call' : ''}`} onClick={toggleDiary} aria-label={tx(A.notebook)} title={`${tx(A.notebook)} (J)`}>
              <PixelIcon name="diario" size={32} />
              {dry.unread > 0 && !uis.bookCall && <span className="badge">{dry.unread > 9 ? '9+' : dry.unread}</span>}
              {/* (no PC, que não tem botão fixo: a folha nova faz o botão aparecer pulsando, com a tecla do caderno embaixo) */}
              {dry.newPage && !uis.bookCall && <span className="keycap-hud hint-pc book-key">{keyName(cfg.keys.diario)}</span>}
            </button>
          )}
          {coarse && !uis.bookOut && (
            <button onClick={openPause} aria-label={tx(A.pause)}>
              <PixelIcon name="pausa" size={32} />
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
          {caption.sub && <span>{caption.sub}</span>}
        </div>
      )}

      {toast && !speaking && !uis.bookOut && (
        <div key={toast.n} className="toast">
          <WordGlyph id={toast.id} size={Math.round(30 * uiK)} />
          <span>{tx(A.noted)}</span>
        </div>
      )}

      {/* AVISO DE AÇÃO (INTERFACE.md §4): a TECLA (de pedra, com a letra na fonte do jogo) + o ÍCONE da ação + o texto curto */}
      {prompt && !speaking && !inMenu && (
        <div className="prompt">
          <span className="keycap-hud hint-pc">{keyName(cfg.keys.agir)}</span>
          <PixelIcon name={actionIcon(prompt)} size={32} />
          <span>{prompt}</span>
        </div>
      )}
      <BoatoBubble onSound={sound} />

      {hintShown && (
        <div className="hint">
          <span className="hint-pc">
            {tx(A.hintPc1)}
            <br />
            {tx(A.hintPc2)}
          </span>
          <span className="hint-touch">
            {tx(A.hintT1)}
            <br />
            {tx(A.hintT2)}
          </span>
        </div>
      )}

      {!complete && !inMenu && !inv.die && prompt && !speaking && (
        <div className="touchbtns">
          <button className="btn-throw" onPointerDown={(e) => { e.preventDefault(); sceneRef.current?.action(); }} aria-label={prompt}>
            <span className="ico"><PixelIcon name={actionIcon(prompt)} size={32} /></span>
            <span>{tx(A.act)}</span>
          </button>
        </div>
      )}

      {!complete && !inMenu && inv.die && tool === 'die' && !uis.bars && !uis.bookOut && !cine && ( // (com o caderno na mão ou numa cena, os botões do dado somem: nada deles funciona ali e eles tapavam a página)
        <div className="touchbtns">
          <button
            className="btn-rotate"
            onPointerDown={(e) => {
              e.preventDefault();
              sceneRef.current?.rotate();
            }}
            aria-label={tx(A.turnDie)}
          >
            <span className="ico"><PixelIcon name="girar" size={32} /></span>
            <span>{tx(A.turn)}</span>
          </button>
          {!dieOut && (
            <button
              className="btn-place"
              onPointerDown={(e) => {
                e.preventDefault();
                sceneRef.current?.place();
              }}
              aria-label={tx(A.placeDie)}
            >
              <span className="ico"><PixelIcon name="posicionar" size={32} /></span>
              <span>{tx(A.place)}</span>
            </button>
          )}
          <button
            className="btn-throw"
            onPointerDown={(e) => {
              e.preventDefault();
              sceneRef.current?.action();
            }}
            aria-label={dieOut ? tx(A.recallDie) : tx(A.throwDie)}
          >
            <span className="ico"><PixelIcon name={prompt ? actionIcon(prompt) : dieOut ? 'recolher' : 'arremessar'} size={32} /></span>
            <span>{prompt ? tx(A.act) : dieOut ? tx(A.recall) : tx(A.throw)}</span>
          </button>
        </div>
      )}

      {!complete && !inMenu && inv.die && inv.chalk && (
        <div className={`soapbtns${tool === 'chalk' ? ' chalk' : ''}`} style={uis.bars ? { display: 'none' } : undefined}>
          <button
            className="soap-swap"
            aria-label={tool === 'die' ? tx(A.takeChalk) : tx(A.takeDie)}
            onPointerDown={(e) => {
              e.preventDefault();
              sceneRef.current?.swapTool();
            }}
          >
            <span className="ico"><PixelIcon name={tool === 'die' ? 'giz' : 'dado'} size={16} /></span>
            <span>{tool === 'die' ? tx(A.chalk) : tx(A.die)}</span>
          </button>
          {tool === 'chalk' && (
            <>
              {(
                [
                  ['draw', 'desenhar', tx(A.draw)],
                  ['erase', 'apagar', tx(A.erase)],
                ] as [ChalkMode, 'desenhar' | 'apagar', string][]
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
                  <span className="ico"><PixelIcon name={ico} size={16} /></span>
                  <span>{label.toUpperCase()}</span>
                </button>
              ))}
              <button
                className="soap-clear"
                aria-label={tx(A.eraseAll)}
                onPointerDown={(e) => {
                  e.preventDefault();
                  sceneRef.current?.clearChalk();
                }}
              >
                <span className="ico"><PixelIcon name="limpar" size={16} /></span>
                <span>{tx(A.clear)}</span>
              </button>
            </>
          )}
        </div>
      )}

      {tool === 'chalk' && !complete && (
        <div className="lookzone" aria-hidden="true">
          <span><PixelIcon name="olhar" size={32} /></span>
          <span>{tx(A.look)}</span>
        </div>
      )}

      {!coarse && look === 'free' && !complete && !inMenu && !diaryOpen && !uis.bookOut && !speaking && (
        <div className="clicktoplay" aria-hidden="true">
          <b>{tx(A.clickPlay)}</b>
          <span>{tx(A.clickHelp)}</span>
        </div>
      )}

      <DialogueBox onSound={sound} />
      <QuizPanel onSound={sound} />

      {uis.menu === 'title' && titleShown && <TitleScreen api={titleApi} snd={sound} />}
      {uis.menu === 'loading' && <LoadingScreen onGo={() => sceneRef.current?.loadGo()} />}
      {booting && <LoadingScreen auto onGo={() => sceneRef.current?.bootGo()} />}
      {whiteIn && <div className="white-in" onAnimationEnd={() => setWhiteIn(false)} />}
      {splashOn && !langAsk && !booting && <Splash ready={sceneReady} onDone={() => setSplashOn(false)} />}
      {langAsk && !booting && (
        <LanguagePick
          snd={sound}
          onPick={(l) => {
            config.set('lang', l);
            config.set('langChosen', true);
            setLangAsk(false);
          }}
        />
      )}
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
      <SaveIndicator hidden={uis.menu === 'title' || uis.menu === 'loading'} />

      {complete && (
        <div className="done">
          <h1>{tx(A.demoEnd)}</h1>
          <p>{complete.gem ? tx(A.gemFound) : tx(A.gemsLeft)}</p>
          <div className="row-btns">
            <button onClick={() => setCredits(true)}>{tx(A.credits)}</button>
            <button onClick={() => sceneRef.current?.toTitle()}>{tx(A.toTitle)}</button>
          </div>
        </div>
      )}
      {credits && <Credits onBack={() => setCredits(false)} snd={sound} />}

      <div className="rotate">
        <div className="phone" />
        <p>{tx(A.rotate)}</p>
      </div>
    </div>
  );
}
