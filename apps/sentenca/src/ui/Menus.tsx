import { useEffect, useRef, useState, type ReactNode } from 'react';
import { SLOTS, occupied, readMeta, saveStore, saves, type SlotMeta } from '../story/save';
import { ACTION_LABEL, DEFAULT_KEYS, config, configStore, keyName, type Action, type Config } from '../story/config';
import { useStore } from '../story/store';
import { PixelIcon } from './PixelIcon';
import { LOGO } from './logo';
import { uiScaleStore } from './scale';
import type React from 'react';
import './menus.css';

// AS TELAS DE MENU (INTERFACE.md §3): tela inicial, espaços de jogo, pausa, configurações e créditos.
// Visual (DIRECAO_DE_ARTE.md §4.11 e INTERFACE.md §5): tudo em PEDRA (é o mundo): tábuas e plaquinhas talhadas, ouro só onde o olho deve ir,
// a fonte em pixel do diário em todo texto, ícones desenhados à mão. Navega com mouse, toque ou teclado (setas, Enter, Esc).

export type UiSound = (name: 'uiblip' | 'uiopen' | 'uiclose' | 'uinew' | 'write', v?: number) => void;

// ── navegação pelo teclado: setas andam entre os itens da tela de cima; Esc volta ──
function useMenuKeys(active: boolean, root: React.RefObject<HTMLElement | null>, onBack: (() => void) | null, snd: UiSound) {
  const back = useRef(onBack);
  back.current = onBack;
  useEffect(() => {
    if (!active) return;
    const opened = performance.now();
    const kd = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === 'Escape') {
        if (performance.now() - opened < 450) return; // (o Esc que soltou o mouse e abriu a pausa não a fecha de novo)
        e.preventDefault();
        if (back.current) {
          snd('uiclose');
          back.current();
        }
        return;
      }
      const dir = k === 'ArrowDown' || k === 'ArrowRight' ? 1 : k === 'ArrowUp' || k === 'ArrowLeft' ? -1 : 0;
      if (!dir || !root.current) return;
      const el = document.activeElement as HTMLElement | null;
      // dentro de um ajuste (setas laterais mudam o valor): deixa o ajuste cuidar
      if (el?.dataset.adjust && (k === 'ArrowLeft' || k === 'ArrowRight')) return;
      const items = [...root.current.querySelectorAll<HTMLElement>('[data-nav]:not(:disabled)')];
      if (!items.length) return;
      e.preventDefault();
      const i = el ? items.indexOf(el) : -1;
      const next = items[(i + dir + items.length) % items.length] ?? items[0];
      next.focus();
      snd('uiblip', 0.4);
    };
    window.addEventListener('keydown', kd);
    // o 1º item já vem escolhido (teclado e controle)
    const first = root.current?.querySelector<HTMLElement>('[data-nav]:not(:disabled)');
    if (first && !root.current?.contains(document.activeElement)) first.focus({ preventScroll: true });
    return () => window.removeEventListener('keydown', kd);
  }, [active, root, snd]);
}

// ── a tábua grande rola só no meio (menus.css): quando ainda há opções embaixo, a borda de baixo esmaece em degraus e três pontinhos de
// ouro piscam acima do Voltar; já rolada, a borda de cima também esmaece. No celular a barra de rolagem só aparece enquanto se rola, e sem
// isso nada dizia que Brilho, Campo de visão etc. estavam lá embaixo ──
function useScrollCue(board: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = board.current?.querySelector<HTMLElement>(':scope > .opts-wrap > .opts, :scope > .slots, :scope > .credits-t');
    if (!el) return;
    const upd = () => {
      const below = el.scrollTop + el.clientHeight < el.scrollHeight - 2;
      el.classList.toggle('more', below);
      el.classList.toggle('above', el.scrollTop > 2);
      board.current?.classList.toggle('more-below', below); // os três pontinhos acima do Voltar
    };
    upd();
    el.addEventListener('scroll', upd, { passive: true });
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    const mo = new MutationObserver(upd); // (trocar de aba troca o conteúdo)
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener('scroll', upd);
      ro.disconnect();
      mo.disconnect();
    };
  }, [board]);
}

// plaquinha de pedra (botão)
function Plaque({ children, onClick, disabled, tone, small, snd, onFocus }: { children: ReactNode; onClick: () => void; disabled?: boolean; tone?: 'gold' | 'danger' | 'plain'; small?: boolean; snd: UiSound; onFocus?: (el: HTMLElement) => void }) {
  return (
    <button
      data-nav
      onFocus={(e) => onFocus?.(e.currentTarget)}
      className={`plq${tone ? ` plq-${tone}` : ''}${small ? ' plq-s' : ''}`}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.focus({ preventScroll: true });
      }}
      onClick={() => {
        snd('uiblip', 0.8);
        onClick();
      }}
    >
      {children}
    </button>
  );
}

// ── o LOGO «SENTENÇA» em pixel, em pedra talhada (INTERFACE.md §7; a grade vem de tools/build_logo.py) ──
// As letras: luz em cima, sombra embaixo, contorno escuro e sombra projetada. O último A é o glifo ACENDER (ouro), com a brasa no vértice de cima.
const LOGO_COL: Record<string, string> = { g: '#c9a35a', y: '#ffd36b', r: '#ff8a3a' };
export function Logo({ px, big }: { px?: number; big?: boolean }) {
  const k = useStore(uiScaleStore);
  const [vw, setVw] = useState(() => [window.innerWidth, window.innerHeight]);
  useEffect(() => {
    if (!big) return;
    const f = () => setVw([window.innerWidth, window.innerHeight]);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, [big]);
  // grande, na tela inicial: ~62% da largura (pixel inteiro, para ficar nítido), sem passar de um quarto da altura
  const bigPx = Math.max(3, Math.floor(Math.min((vw[0] * 0.62) / (LOGO[0].length + 2), (vw[1] * 0.26) / (LOGO.length + 2))));
  const p = px ?? (big ? bigPx : Math.max(3, Math.round(4 * k)));
  const W = LOGO[0].length;
  const Hh = LOGO.length;
  const at = (x: number, y: number) => (y >= 0 && y < Hh && x >= 0 && x < W ? LOGO[y][x] : '.');
  const rects: React.ReactElement[] = [];
  // sombra projetada (2 pixels) e contorno
  LOGO.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === '.') return;
      rects.push(<rect key={`d${x}-${y}`} x={x + 1} y={y + 2} width={1} height={1} fill="#05040a" />);
      rects.push(<rect key={`e${x}-${y}`} x={x + 1} y={y + 1} width={1} height={1} fill="#2a2232" />);
    }),
  );
  LOGO.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === '.') return;
      let fill = LOGO_COL[c];
      if (!fill) fill = at(x, y - 1) === '.' ? '#f6eedc' : at(x, y + 1) === '.' ? '#8a8278' : at(x - 1, y) === '.' ? '#e8dfca' : '#cfc6b2';
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />);
    }),
  );
  return (
    <div className="logo" aria-label="Sentença" role="img">
      <svg viewBox={`0 0 ${W + 2} ${Hh + 2}`} width={(W + 2) * p} height={(Hh + 2) * p} shapeRendering="crispEdges" aria-hidden="true">
        {/* o brilho da brasa */}
        <circle cx={W - 6} cy={1.5} r={2.6} fill="#ff8a3a" opacity={0.12} />
        {rects}
      </svg>
    </div>
  );
}

// ── o dadinho girando: "salvou" (INTERFACE.md §2) ──
export function SaveIndicator({ hidden }: { hidden: boolean }) {
  const n = useStore(saveStore);
  const [on, setOn] = useState(0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setOn(n);
    const t = window.setTimeout(() => setOn(0), 1200);
    return () => window.clearTimeout(t);
  }, [n]);
  if (!on || hidden) return null;
  return (
    <div key={on} className="saving" aria-label="Jogo salvo">
      <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">
        <rect x={1} y={1} width={10} height={10} fill="#ffd36b" />
        <rect x={2} y={2} width={8} height={8} fill="#1d1922" />
        <rect x={3} y={3} width={2} height={2} fill="#ffd36b" />
        <rect x={7} y={7} width={2} height={2} fill="#ffd36b" />
        <rect x={5} y={5} width={2} height={2} fill="#ff8a3a" />
      </svg>
    </div>
  );
}

// ── tábua de confirmação ──
function Confirm({ text, sub, yes, no = 'Cancelar', onYes, onNo, snd }: { text: string; sub?: string; yes: string; no?: string; onYes: () => void; onNo: () => void; snd: UiSound }) {
  const ref = useRef<HTMLDivElement>(null);
  useMenuKeys(true, ref, onNo, snd);
  return (
    <div className="mnu-veil top">
      <div ref={ref} className="board board-s">
        <p className="board-q">{text}</p>
        {sub && <p className="board-sub">{sub}</p>}
        <div className="row-btns">
          <Plaque onClick={onNo} snd={snd}>
            {no}
          </Plaque>
          <Plaque onClick={onYes} tone="danger" snd={snd}>
            {yes}
          </Plaque>
        </div>
      </div>
    </div>
  );
}

// ── espaços de jogo ──
const fmtTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
};
const fmtDate = (ms: number) => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
const roomLabel = (m: SlotMeta | null) => (m ? m.roomName.replace(/\s*·\s*/, ' - ') : 'O começo');

function Slots({ purpose, onBack, onPlay, onNew, snd }: { purpose: 'load' | 'new'; onBack: () => void; onPlay: (slot: number) => void; onNew: (slot: number) => void; snd: UiSound }) {
  const ref = useRef<HTMLDivElement>(null);
  const [, force] = useState(0);
  const [ask, setAsk] = useState<{ slot: number; step: 'new' | 'erase1' | 'erase2' } | null>(null);
  useMenuKeys(!ask, ref, onBack, snd);
  useScrollCue(ref);
  const slots = Array.from({ length: SLOTS }, (_, i) => i + 1);
  return (
    <div className="mnu-veil">
      <div ref={ref} className="board board-w">
        <h2>{purpose === 'new' ? 'Novo jogo: escolha um espaço' : 'Carregar'}</h2>
        <div className="slots">
          {slots.map((s) => {
            const occ = occupied(s);
            const m = readMeta(s);
            return (
              <div key={s} className={`slot${occ ? '' : ' empty'}${s === saves.active() && occ ? ' last' : ''}`}>
                <div className="slot-thumb">{m?.thumb ? <img src={m.thumb} alt="" /> : <span>{occ ? '' : 'Vazio'}</span>}</div>
                <b>Espaço {s}</b>
                {occ ? (
                  <ul>
                    <li>{roomLabel(m)}</li>
                    <li>
                      Capítulo {m?.chapter ?? 1} - {fmtTime(m?.time ?? 0)}
                    </li>
                    <li className="gems">
                      <PixelIcon name="gema" size={16} /> {m?.gems ?? 0} {m?.gems === 1 ? 'gema' : 'gemas'}
                    </li>
                    <li className="dim">{m ? fmtDate(m.at) : ''}</li>
                  </ul>
                ) : (
                  <ul>
                    <li className="dim">Nenhum jogo aqui</li>
                  </ul>
                )}
                <div className="slot-btns">
                  {purpose === 'load' ? (
                    <>
                      <Plaque small tone="gold" disabled={!occ} onClick={() => onPlay(s)} snd={snd}>
                        Carregar
                      </Plaque>
                      <Plaque small tone="plain" disabled={!occ} onClick={() => setAsk({ slot: s, step: 'erase1' })} snd={snd}>
                        Apagar
                      </Plaque>
                    </>
                  ) : (
                    <Plaque small tone="gold" onClick={() => (occ ? setAsk({ slot: s, step: 'new' }) : onNew(s))} snd={snd}>
                      {occ ? 'Usar este' : 'Começar aqui'}
                    </Plaque>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="row-btns">
          <Plaque onClick={onBack} snd={snd}>
            Voltar
          </Plaque>
        </div>
      </div>
      {ask?.step === 'new' && <Confirm text="Apagar este jogo e começar outro?" sub={`Espaço ${ask.slot}`} yes="Apagar e começar" onYes={() => onNew(ask.slot)} onNo={() => setAsk(null)} snd={snd} />}
      {ask?.step === 'erase1' && <Confirm text="Apagar este jogo?" sub={`Espaço ${ask.slot}: ${roomLabel(readMeta(ask.slot))}`} yes="Apagar" onYes={() => setAsk({ slot: ask.slot, step: 'erase2' })} onNo={() => setAsk(null)} snd={snd} />}
      {ask?.step === 'erase2' && (
        <Confirm
          text="Tem certeza? Não dá para desfazer."
          sub="O progresso, o caderno e o mapa deste espaço somem."
          yes="Sim, apagar"
          onYes={() => {
            const wasActive = ask.slot === saves.active();
            saves.erase(ask.slot);
            setAsk(null);
            force((n) => n + 1);
            if (wasActive) location.replace(location.pathname + location.search); // o jogo na memória era este: recomeça a tela inicial limpa
          }}
          onNo={() => setAsk(null)}
          snd={snd}
        />
      )}
    </div>
  );
}

// ── configurações ──
function Adjust({ label, value, min, max, step = 1, fmt, onChange, snd }: { label: string; value: number; min: number; max: number; step?: number; fmt?: (v: number) => string; onChange: (v: number) => void; snd: UiSound }) {
  const set = (v: number) => {
    const c = Math.min(max, Math.max(min, Math.round(v / step) * step));
    if (c !== value) {
      onChange(c);
      snd('uiblip', 0.5);
    }
  };
  const n = Math.round((max - min) / step);
  const k = Math.round((value - min) / step);
  return (
    <div className="opt">
      <span className="opt-l">{label}</span>
      <div
        className="adj"
        data-nav
        data-adjust="1"
        tabIndex={0}
        role="slider"
        aria-label={label}
        aria-valuenow={value}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            set(value - step);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            set(value + step);
          }
        }}
      >
        <button tabIndex={-1} className="adj-b l" aria-label="Menos" onClick={() => set(value - step)} />
        <span className="adj-bar">
          {Array.from({ length: Math.min(n, 20) + 1 }, (_, i) => (
            <i key={i} className={i <= (k * Math.min(n, 20)) / n ? 'on' : ''} />
          ))}
        </span>
        <button tabIndex={-1} className="adj-b r" aria-label="Mais" onClick={() => set(value + step)} />
        <span className="adj-v">{fmt ? fmt(value) : value}</span>
      </div>
    </div>
  );
}
function Choice<T extends string | number | boolean>({ label, value, options, onChange, snd }: { label: string; value: T; options: { v: T; label: string; off?: boolean }[]; onChange: (v: T) => void; snd: UiSound }) {
  return (
    <div className="opt">
      <span className="opt-l">{label}</span>
      <div className="choice">
        {options.map((o) => (
          <button
            key={String(o.v)}
            data-nav
            disabled={o.off}
            className={`chip${o.v === value ? ' on' : ''}`}
            onClick={() => {
              snd('uiblip', 0.6);
              onChange(o.v);
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
const yesNo = [
  { v: true, label: 'Sim' },
  { v: false, label: 'Não' },
];

type Tab = 'audio' | 'imagem' | 'controles' | 'acess' | 'idioma';
const TABS: [Tab, string, 'audio' | 'imagem' | 'controles' | 'acess' | 'idioma'][] = [
  ['audio', 'Áudio', 'audio'],
  ['imagem', 'Imagem', 'imagem'],
  ['controles', 'Controles', 'controles'],
  ['acess', 'Acessibilidade', 'acess'],
  ['idioma', 'Idioma', 'idioma'],
];

function Settings({ onBack, snd }: { onBack: () => void; snd: UiSound }) {
  const ref = useRef<HTMLDivElement>(null);
  const c = useStore(configStore);
  const [tab, setTab] = useState<Tab>('audio');
  const [wait, setWait] = useState<Action | null>(null); // remapeando: esperando a tecla
  const [full, setFull] = useState(!!document.fullscreenElement);
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  useMenuKeys(!wait, ref, onBack, snd);
  useScrollCue(ref);
  useEffect(() => {
    const f = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', f);
    return () => document.removeEventListener('fullscreenchange', f);
  }, []);
  // remapear: a próxima tecla apertada vira a da ação (Esc cancela)
  useEffect(() => {
    if (!wait) return;
    const kd = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      const k = e.key.toLowerCase();
      if (k !== 'escape' && !/^[1-6]$/.test(k)) {
        config.setKey(wait, k);
        snd('write', 0.6);
      }
      setWait(null);
    };
    window.addEventListener('keydown', kd, true);
    return () => window.removeEventListener('keydown', kd, true);
  }, [wait, snd]);
  const set = <K extends keyof Config>(k: K) => (v: Config[K]) => config.set(k, v);
  const screenMode = (fullOn: boolean) => {
    if (fullOn && !document.fullscreenElement) {
      const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
      document.documentElement
        .requestFullscreen?.()
        .then(() => orientation.lock?.('landscape'))
        .catch(() => {});
    } else if (!fullOn && document.fullscreenElement) void document.exitFullscreen();
  };
  return (
    <div className="mnu-veil">
      <div ref={ref} className="board board-w settings">
        <h2>
          <PixelIcon name="config" size={48} /> Configurações
        </h2>
        <div className="tabs" role="tablist">
          {TABS.map(([t, label, ico]) => (
            <button
              key={t}
              data-nav
              role="tab"
              aria-selected={tab === t}
              className={`tab${tab === t ? ' on' : ''}`}
              onClick={() => {
                snd('uiblip', 0.6);
                setTab(t);
              }}
            >
              <PixelIcon name={ico} size={24} />
              {label}
            </button>
          ))}
        </div>
        <div className="opts-wrap">
          <div className="opts">
            {tab === 'audio' && (
              <>
                <Adjust label="Volume geral" value={c.volMaster} min={0} max={10} onChange={set('volMaster')} snd={snd} />
                <Adjust label="Música" value={c.volMusic} min={0} max={10} onChange={set('volMusic')} snd={snd} />
                <Adjust label="Efeitos" value={c.volSfx} min={0} max={10} onChange={set('volSfx')} snd={snd} />
              </>
            )}
            {tab === 'imagem' && (
              <>
                {document.fullscreenEnabled && (
                  <Choice
                    label="Modo de tela"
                    value={full}
                    options={[
                      { v: false, label: 'Janela' },
                      { v: true, label: 'Tela cheia' },
                    ]}
                    onChange={screenMode}
                    snd={snd}
                  />
                )}
                <Choice
                  label="Qualidade"
                  value={c.quality}
                  options={[
                    { v: 'baixa', label: 'Baixa' },
                    { v: 'media', label: 'Média' },
                    { v: 'alta', label: 'Alta' },
                  ]}
                  onChange={set('quality')}
                  snd={snd}
                />
                <Choice
                  label="Sombras"
                  value={c.shadows}
                  options={[
                    { v: 'desligadas', label: 'Desligadas' },
                    { v: 'baixas', label: 'Baixas' },
                    { v: 'medias', label: 'Médias' },
                    { v: 'altas', label: 'Altas' },
                  ]}
                  onChange={set('shadows')}
                  snd={snd}
                />
                <Choice
                  label="Tamanho do pixel"
                  value={c.pixel}
                  options={[
                    { v: 'fino', label: 'Fino' },
                    { v: 'medio', label: 'Médio' },
                    { v: 'grosso', label: 'Grosso' },
                  ]}
                  onChange={set('pixel')}
                  snd={snd}
                />
                <Adjust label="Brilho" value={c.brightness} min={-5} max={5} fmt={(v) => (v > 0 ? `+${v}` : String(v))} onChange={set('brightness')} snd={snd} />
                <Adjust label="Campo de visão" value={c.fov} min={75} max={115} step={5} fmt={(v) => `${v} graus`} onChange={set('fov')} snd={snd} />
                <Choice
                  label="Limitar quadros"
                  value={c.fpsCap}
                  options={[
                    { v: 0, label: 'Sem limite' },
                    { v: 60, label: '60 por s' },
                    { v: 30, label: '30 por s' },
                  ]}
                  onChange={set('fpsCap')}
                  snd={snd}
                />
              </>
            )}
            {tab === 'controles' && (
              <>
                {!coarse && <Adjust label="Sensibilidade do mouse" value={c.mouseSens} min={1} max={10} onChange={set('mouseSens')} snd={snd} />}
                <Adjust label="Sensibilidade do toque" value={c.touchSens} min={1} max={10} onChange={set('touchSens')} snd={snd} />
                <Choice label="Inverter o eixo Y" value={c.invertY} options={yesNo} onChange={set('invertY')} snd={snd} />
                {coarse && <Choice label="Vibração" value={c.vibration} options={yesNo} onChange={set('vibration')} snd={snd} />}
                {!coarse && (
                  <>
                    <p className="opt-h">Teclas</p>
                    {(Object.keys(DEFAULT_KEYS) as Action[]).map((a) => (
                      <div key={a} className="opt">
                        <span className="opt-l">{ACTION_LABEL[a]}</span>
                        <button
                          data-nav
                          className={`keycap${wait === a ? ' wait' : ''}`}
                          onClick={() => {
                            snd('uiblip', 0.6);
                            setWait(a);
                          }}
                        >
                          {wait === a ? 'Aperte uma tecla' : keyName(c.keys[a])}
                        </button>
                      </div>
                    ))}
                    <div className="row-btns left">
                      <Plaque small onClick={() => config.resetKeys()} snd={snd}>
                        Voltar às teclas padrão
                      </Plaque>
                    </div>
                  </>
                )}
              </>
            )}
            {tab === 'acess' && (
              <>
                <Adjust label="Tamanho da interface" value={c.uiSize} min={80} max={160} step={10} fmt={(v) => `${v}%`} onChange={set('uiSize')} snd={snd} />
                <Choice
                  label="Velocidade do texto"
                  value={c.textSpeed}
                  options={[
                    { v: 'lenta', label: 'Lenta' },
                    { v: 'normal', label: 'Normal' },
                    { v: 'rapida', label: 'Rápida' },
                  ]}
                  onChange={set('textSpeed')}
                  snd={snd}
                />
                <Choice label="Reduzir tremores e clarões" value={c.reduceFlash} options={yesNo} onChange={set('reduceFlash')} snd={snd} />
                <Choice label="Reduzir o movimento da câmera" value={c.reduceMotion} options={yesNo} onChange={set('reduceMotion')} snd={snd} />
                <Choice label="Alto contraste nos glifos" value={c.highContrast} options={yesNo} onChange={set('highContrast')} snd={snd} />
                <Choice label="Mira sempre visível" value={c.crosshair} options={yesNo} onChange={set('crosshair')} snd={snd} />
                {/* (DESIGN.md §99) as palavras do PRÓPRIO jogador embaixo dos símbolos; o jogo continua sem traduzir */}
                <Choice label="Minhas anotações embaixo dos símbolos" value={c.glyphNotes} options={yesNo} onChange={set('glyphNotes')} snd={snd} />
              </>
            )}
            {tab === 'idioma' && (
              <>
                <Choice
                  label="Idioma"
                  value={c.lang}
                  options={[
                    { v: 'pt', label: 'Português' },
                    { v: 'en' as 'pt', label: 'English (em breve)', off: true },
                  ]}
                  onChange={set('lang')}
                  snd={snd}
                />
                <p className="opt-note">O idioma muda o caderno, os pensamentos e a interface. Os glifos não mudam.</p>
              </>
            )}
          </div>
        </div>
        <div className="row-btns">
          <Plaque onClick={onBack} snd={snd}>
            Voltar
          </Plaque>
        </div>
      </div>
    </div>
  );
}

// ── créditos (os sons CC0 e o soundfont CC BY pedem crédito) ──
export function Credits({ onBack, snd, roll }: { onBack: () => void; snd: UiSound; roll?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useMenuKeys(true, ref, onBack, snd);
  useScrollCue(ref);
  if (roll)
    // na tela inicial: os nomes sobem devagar enquanto a câmera gira em volta do dado (INTERFACE.md §3.1)
    return (
      <div ref={ref} className="credits-roll">
        <div className="roll-win">
          <div className="roll-txt">
            <Logo />
            <h3>Instrumentos</h3>
            <p>Amostras reais do soundfont FluidR3_GM, de Frank Wen (CC BY 3.0)</p>
            <p>violoncelo, contrabaixo, cordas, coro, vozes, harpa, celesta, glockenspiel, flauta, garrafa soprada, tímpano e sinos tubulares</p>
            <h3>Efeitos</h3>
            <p>CC0, via OpenGameArt.org</p>
            <p>Kenney (RPG Sound Pack)</p>
            <p>rubberduck (100 CC0 SFX)</p>
            <p>Fantozzi (passos)</p>
            <p>qubodup (bola rolando)</p>
            <p>Independent.nu (gotas)</p>
            <p>LEGIT Audio (fogo)</p>
            <p>Tsorthan Grove (vento)</p>
            <p>NenadSimic (tambor ao longe)</p>
            <p>gravações de giz, borracha, porta de pedra, arrastos, pedras, estalos e vapor</p>
            <h3>Modelos 3D</h3>
            <p>braseiro: Stone Column Brazier, de Amarveer (Sketchfab, CC BY 4.0), adaptado para o pixel</p>
            <p>tocha de parede: Medieval Wall Torch, de Kigha (Sketchfab, CC BY 4.0), adaptada para o pixel</p>
            <p>animações do Escrivão: esqueleto e movimentos do Mixamo (Adobe)</p>
            <p>Biblioteca: estantes de Paul Wortmann, velas da AnyRPG e livros da Quaternius (CC0); candelabro de Marco Antonio Meireles Carvalho, do jogo Radya: Visions From The Past</p>
            <h3>Letra</h3>
            <p>a letra do caderno, desenhada pixel a pixel para o jogo</p>
          </div>
        </div>
        <Plaque onClick={onBack} snd={snd}>
          Voltar
        </Plaque>
      </div>
    );
  return (
    <div className="mnu-veil top">
      <div ref={ref} className="board board-w credits-b">
        <h2>Créditos</h2>
        <div className="credits-t">
          <p>
            <b>Instrumentos</b> (música, sinos e notas): amostras reais do soundfont <i>FluidR3_GM</i>, de Frank Wen (CC BY 3.0): violoncelo, contrabaixo, cordas, coro,
            vozes, harpa, celesta, glockenspiel, flauta, garrafa soprada, tímpano e sinos tubulares.
          </p>
          <p>
            <b>Efeitos</b> (CC0, via OpenGameArt.org): Kenney (RPG Sound Pack), rubberduck (100 CC0 SFX), Fantozzi (passos), qubodup (bola rolando), Independent.nu (gotas),
            LEGIT Audio (fogo), Tsorthan Grove (vento), NenadSimic (tambor ao longe), e gravações de giz, borracha, porta de pedra, arrastos, pedras, estalos e vapor.
          </p>
          <p>
            <b>Modelos 3D</b>: o braseiro é baseado em <i>Stone Column Brazier</i>, de Amarveer (sketchfab.com/amarveer), licença CC BY 4.0; adaptado para o
            pixel (sem a chama original, texturas reduzidas). A tocha de parede é baseada em <i>Medieval Wall Torch</i>, de Kigha (sketchfab.com/Kigha),
            licença CC BY 4.0; adaptada para o pixel (texturas reduzidas, com a oclusão do modelo na cor). O esqueleto e as animações do Escrivão
            (andar e olhar para baixo) foram feitos no Mixamo (mixamo.com, Adobe). Na Biblioteca: estantes de Paul Wortmann, velas da AnyRPG, atril e
            livros da Quaternius (todos CC0) e o candelabro de Marco Antonio Meireles Carvalho, feito para o jogo <i>Radya: Visions From The Past</i>
            (marco-antonio.itch.io/radya-visions-from-the-past), domínio público.
          </p>
          <p>
            <b>Fonte</b>: a letra do caderno, desenhada pixel a pixel para o jogo.
          </p>
        </div>
        <div className="row-btns">
          <Plaque onClick={onBack} snd={snd}>
            Voltar
          </Plaque>
        </div>
      </div>
    </div>
  );
}

// o espaço de onde "Continuar" segue: o último usado; se ele estiver vazio, o salvo mais recente
const continueSlot = (): number | null => {
  if (occupied(saves.active())) return saves.active();
  let best: number | null = null;
  let at = -1;
  for (let s = 1; s <= SLOTS; s++) {
    const m = readMeta(s);
    if (occupied(s) && (m?.at ?? 0) > at) {
      at = m?.at ?? 0;
      best = s;
    }
  }
  return best;
};

type Sub = 'main' | 'load' | 'new' | 'settings' | 'credits' | 'askTitle';

// ── TELA INICIAL ──
// O que a tela inicial pede ao motor (o dado caído, o olho, as transições; scene.ts)
export interface TitleApi {
  look(x: number, y: number): void;
  mood(m: 'new' | 'quit' | null): void;
  credits(on: boolean): void;
  newGame(slot: number): void; // o dado pisca, a câmera sobe pelo feixe até o branco
  play(slot: number): void; // o dado pula para fora e a imagem se desfaz em pontilhado
}
export function TitleScreen({ api, snd }: { api: TitleApi; snd: UiSound }) {
  const ref = useRef<HTMLDivElement>(null);
  const [sub, setSub] = useState<Sub>('main');
  const [leaving, setLeaving] = useState(false);
  const cont = continueSlot();
  useMenuKeys(sub === 'main' && !leaving, ref, null, snd);
  useEffect(() => api.credits(sub === 'credits'), [sub, api]);
  const go = (slot: number) => {
    setLeaving(true);
    setSub('main');
    api.play(slot);
  };
  const fresh = (slot: number) => {
    setLeaving(true);
    setSub('main');
    api.newGame(slot);
  };
  // a opção marcada pelo teclado: o olho do dado vai até ela
  const focusLook = (mood: 'new' | 'quit' | null) => (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    api.look(r.left + r.width / 2, r.top + r.height / 2);
    api.mood(mood);
  };
  const anySaved = Array.from({ length: SLOTS }, (_, i) => occupied(i + 1)).some(Boolean);
  return (
    <div className={`title-scr${leaving ? ' leaving' : ''}${sub === 'credits' ? ' rolling' : ''}`}>
      {/* o título grande, centralizado no alto (não em cima dos botões) */}
      <div className="title-logo" style={sub !== 'main' ? { visibility: 'hidden' } : undefined}>
        <Logo big />
      </div>
      <div ref={ref} className="title-col" style={sub !== 'main' ? { visibility: 'hidden' } : undefined} onMouseLeave={() => api.mood(null)}>
        <div className="title-list">
          {cont !== null && (
            <Plaque tone="gold" onClick={() => go(cont)} snd={snd} onFocus={focusLook(null)}>
              Continuar
            </Plaque>
          )}
          <Plaque onClick={() => setSub('new')} snd={snd} onFocus={focusLook('new')}>
            Novo jogo
          </Plaque>
          <Plaque disabled={!anySaved} onClick={() => setSub('load')} snd={snd} onFocus={focusLook(null)}>
            Carregar
          </Plaque>
          <Plaque onClick={() => setSub('settings')} snd={snd} onFocus={focusLook(null)}>
            Configurações
          </Plaque>
          <Plaque onClick={() => setSub('credits')} snd={snd} onFocus={focusLook(null)}>
            Créditos
          </Plaque>
          {/* Sair: só nas versões instaladas pelas lojas (na web, fecha-se a aba); com o cursor nele, o dado fica abatido (api.mood('quit')) */}
        </div>
      </div>
      {(sub === 'load' || sub === 'new') && <Slots purpose={sub} onBack={() => setSub('main')} onPlay={go} onNew={fresh} snd={snd} />}
      {sub === 'settings' && <Settings onBack={() => setSub('main')} snd={snd} />}
      {sub === 'credits' && <Credits roll onBack={() => setSub('main')} snd={snd} />}
    </div>
  );
}

// ── PAUSA ──
export function PauseMenu({ onResume, onDiary, onResetRoom, onTitle, hasBook, snd }: { onResume: () => void; onDiary: () => void; onResetRoom: () => void; onTitle: () => void; hasBook: boolean; snd: UiSound }) {
  const ref = useRef<HTMLDivElement>(null);
  const [sub, setSub] = useState<Sub>('main');
  useMenuKeys(sub === 'main', ref, onResume, snd);
  return (
    <div className="mnu-veil pause">
      <div ref={ref} className="board board-s" style={sub !== 'main' ? { visibility: 'hidden' } : undefined}>
        <h2>
          <PixelIcon name="pausa" size={48} /> Pausa
        </h2>
        <div className="title-list">
          <Plaque tone="gold" onClick={onResume} snd={snd}>
            Continuar
          </Plaque>
          {hasBook && (
            <Plaque onClick={onDiary} snd={snd}>
              Caderno
            </Plaque>
          )}
          <Plaque onClick={() => setSub('settings')} snd={snd}>
            Configurações
          </Plaque>
          <Plaque onClick={onResetRoom} snd={snd}>
            Reiniciar a sala
          </Plaque>
          <Plaque onClick={() => setSub('askTitle')} snd={snd}>
            Voltar à tela inicial
          </Plaque>
        </div>
      </div>
      {sub === 'settings' && <Settings onBack={() => setSub('main')} snd={snd} />}
      {sub === 'askTitle' && <Confirm text="Voltar à tela inicial?" sub="O jogo é salvo antes." yes="Voltar" no="Ficar" onYes={onTitle} onNo={() => setSub('main')} snd={snd} />}
    </div>
  );
}
