import { useLayoutEffect, useRef, useState } from 'react';
import { AttributeKey, Attributes, Character, ClassId } from '../types/game';
import { ATTR_META, ATTR_ORDER, CLASSES, STARTING_ATTR_POINTS, createCharacter } from '../lib/classes';
import { effectiveMaxHp } from '../lib/combatStats';
import { CLASS_ICON } from '../lib/classIcons';
import { WEIGHT_GROUP, WeightGroup } from '../lib/itemTiers';
import { heroSprites } from '../game/sprites';
import { Button, SmallButton } from './Button';
import { Modal } from './Modal';
import pergaminho from '../assets/pergaminho.webp';

interface Props {
  onCreated: (c: Character) => void;
  // Case-insensitive global name-availability check (see character_names in
  // schema.sql) — the leaderboard shows names alone, so two heroes sharing
  // one would be genuinely ambiguous there, not just a cosmetic clash.
  checkNameTaken: (name: string) => Promise<boolean>;
}

// Fixed declaration order in classes.ts happens to split into 5+5+4 — the
// grid below relies on that (a 5-column grid wraps every 5 items into a new
// row on its own) plus one extra "reserved" cell so the layout always reads
// as 3 full rows of 5, with a visible slot for a future 15th class already
// in place rather than an awkward half-empty last row.
const CLASS_IDS = Object.keys(CLASSES) as ClassId[];
const ZERO_ATTRS: Attributes = { str: 0, dex: 0, agi: 0, vit: 0, int: 0, wis: 0, luk: 0 };
const WEIGHT_LABEL: Record<WeightGroup, string> = {
  light: 'Vestes leves', medium: 'Armadura média', heavy: 'Armadura pesada',
};
// Highest a single attribute total can reach at creation: a primary
// baseAttrs of 5 plus every starting point dumped into it.
const RADAR_MAX = 5 + STARTING_ATTR_POINTS;

function AttributeRadar({ totals }: { totals: Attributes }) {
  const size = 200;
  const center = size / 2;
  const maxR = size / 2 - size * 0.24;
  const angleFor = (i: number) => ((-90 + i * (360 / 7)) * Math.PI) / 180;

  const ringPoints = (r: number) =>
    ATTR_ORDER.map((_, i) => {
      const rad = angleFor(i);
      return `${(center + Math.cos(rad) * r * maxR).toFixed(1)},${(center + Math.sin(rad) * r * maxR).toFixed(1)}`;
    }).join(' ');

  const dataPoints = ATTR_ORDER.map((key, i) => {
    const rad = angleFor(i);
    const ratio = Math.max(0, Math.min(1, totals[key] / RADAR_MAX));
    return `${(center + Math.cos(rad) * ratio * maxR).toFixed(1)},${(center + Math.sin(rad) * ratio * maxR).toFixed(1)}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto max-w-[210px]">
      {[0.33, 0.66, 1].map((r) => (
        <polygon key={r} points={ringPoints(r)} fill="none" className="stroke-panelborder/45" strokeWidth={1} />
      ))}
      {ATTR_ORDER.map((key, i) => {
        const rad = angleFor(i);
        const x = center + Math.cos(rad) * maxR;
        const y = center + Math.sin(rad) * maxR;
        const lx = center + Math.cos(rad) * (maxR + 15);
        const ly = center + Math.sin(rad) * (maxR + 15);
        return (
          <g key={key}>
            <line x1={center} y1={center} x2={x} y2={y} className="stroke-panelborder/45" strokeWidth={1} />
            <text
              x={lx} y={ly}
              textAnchor="middle" dominantBaseline="middle"
              className="fill-current text-parchment/60 text-[9.5px] font-bold font-display"
            >
              {ATTR_META[key].abbr}
            </text>
          </g>
        );
      })}
      <polygon
        points={dataPoints}
        className="fill-current stroke-current text-woodlight"
        fillOpacity={0.35}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CharacterCreation({ onCreated, checkNameTaken }: Props) {
  const [name, setName] = useState('');
  const [selectedId, setSelectedId] = useState<ClassId | null>(null);
  const [closing, setClosing] = useState(false);
  const [allocated, setAllocated] = useState<Attributes>({ ...ZERO_ATTRS });
  // Naming happens last, in its own modal, after the class + attribute
  // points are already locked in — keeps the class-select screen focused on
  // one decision at a time instead of asking for a name before the player
  // even knows which hero they're naming.
  const [naming, setNaming] = useState(false);
  const [ironMode, setIronMode] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [checkingName, setCheckingName] = useState(false);

  const cardRefs = useRef<Partial<Record<ClassId, HTMLButtonElement>>>({});
  const panelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches).current;

  const spent = ATTR_ORDER.reduce((sum, key) => sum + allocated[key], 0);
  const remaining = STARTING_ATTR_POINTS - spent;
  const selected = selectedId ? CLASSES[selectedId] : null;
  const totals: Attributes = selected
    ? {
        str: (selected.baseAttrs.str ?? 0) + allocated.str,
        dex: (selected.baseAttrs.dex ?? 0) + allocated.dex,
        agi: (selected.baseAttrs.agi ?? 0) + allocated.agi,
        vit: (selected.baseAttrs.vit ?? 0) + allocated.vit,
        int: (selected.baseAttrs.int ?? 0) + allocated.int,
        wis: (selected.baseAttrs.wis ?? 0) + allocated.wis,
        luk: (selected.baseAttrs.luk ?? 0) + allocated.luk,
      }
    : ZERO_ATTRS;

  function openClass(id: ClassId) {
    setSelectedId(id);
    setClosing(false);
    setAllocated({ ...ZERO_ATTRS });
  }

  function closeFocus() {
    const panel = panelRef.current;
    const card = selectedId ? cardRefs.current[selectedId] : null;
    if (!panel || !card || reduceMotion) { setSelectedId(null); return; }
    setClosing(true);
    const startRect = panel.getBoundingClientRect();
    const endRect = card.getBoundingClientRect();
    const dx = (endRect.left + endRect.width / 2) - (startRect.left + startRect.width / 2);
    const dy = (endRect.top + endRect.height / 2) - (startRect.top + startRect.height / 2);
    const scaleX = endRect.width / startRect.width;
    const scaleY = endRect.height / startRect.height;
    panel.style.transition = 'transform 0.3s cubic-bezier(.4,0,.6,1), opacity 0.25s ease';
    panel.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
    panel.style.opacity = '0.3';
    window.setTimeout(() => { setSelectedId(null); setClosing(false); }, 300);
  }

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const card = selectedId ? cardRefs.current[selectedId] : null;
    if (!panel || !card || closing) return;
    if (reduceMotion) {
      panel.style.transform = 'translate(-50%, -50%)';
      panel.style.opacity = '1';
      return;
    }
    const startRect = card.getBoundingClientRect();
    const endRect = panel.getBoundingClientRect();
    const dx = (startRect.left + startRect.width / 2) - (endRect.left + endRect.width / 2);
    const dy = (startRect.top + startRect.height / 2) - (endRect.top + endRect.height / 2);
    const scaleX = startRect.width / endRect.width;
    const scaleY = startRect.height / endRect.height;
    panel.style.transition = 'none';
    panel.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
    panel.style.opacity = '0.4';
    requestAnimationFrame(() => {
      panel.style.transition = 'transform 0.4s cubic-bezier(.2,.8,.2,1), opacity 0.25s ease';
      panel.style.transform = 'translate(-50%, -50%)';
      panel.style.opacity = '1';
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  function adjust(key: AttributeKey, delta: number) {
    setAllocated((prev) => {
      const next = prev[key] + delta;
      if (next < 0) return prev;
      if (delta > 0 && remaining <= 0) return prev;
      return { ...prev, [key]: next };
    });
  }

  function confirm() {
    if (!selectedId || remaining !== 0) return;
    setNaming(true);
  }

  async function finalizeCreate() {
    if (!selectedId || checkingName) return;
    const finalName = name.trim();
    if (!finalName) return;
    setNameError(null);
    setCheckingName(true);
    const taken = await checkNameTaken(finalName);
    setCheckingName(false);
    if (taken) { setNameError('Esse nome já está em uso — escolha outro.'); return; }
    const created = createCharacter(finalName, selectedId, allocated, ironMode);
    // createCharacter() sets hp to the class's raw baseHp, before the
    // starting equipment/attribute-point bonuses above it are counted —
    // a fresh hero otherwise began already short of their real max.
    onCreated({ ...created, hp: effectiveMaxHp(created) });
  }

  return (
    <div className="flex-1 flex flex-col items-center gap-5 px-4 py-6 bg-nightsky overflow-y-auto">
      <h2 className="font-display text-2xl md:text-3xl text-gold tracking-[0.1em] uppercase [text-shadow:0_2px_0_rgba(0,0,0,0.8)] text-center">
        Crie seu Herói
      </h2>

      <p className="text-xs text-parchment/50 text-center max-w-md -mt-1">
        Toque numa classe para conhecê-la de perto e distribuir seus pontos de atributo iniciais.
      </p>

      <div
        className={`grid grid-cols-5 gap-2 sm:gap-3 w-full max-w-2xl transition-[filter,opacity] duration-300 ${
          selectedId ? 'blur-[2px] brightness-50 opacity-60 pointer-events-none' : ''
        }`}
      >
        {CLASS_IDS.map((id) => {
          const c = CLASSES[id];
          const sprite = heroSprites(id).idle.image.src;
          return (
            <button
              key={id}
              ref={(el) => { cardRefs.current[id] = el ?? undefined; }}
              type="button"
              onClick={() => openClass(id)}
              style={{ borderColor: `${c.color}55` }}
              className="flex flex-col items-center gap-1 rounded-lg border bg-panel/80 px-1 py-2 transition hover:-translate-y-0.5 hover:brightness-110"
            >
              <img src={CLASS_ICON[id]} alt="" className="w-8 h-8 drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]" draggable={false} />
              <img
                src={sprite}
                alt=""
                className="h-12 sm:h-14 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                style={{ imageRendering: 'pixelated' }}
              />
              <span className="font-display text-[11px] sm:text-xs leading-tight text-center" style={{ color: c.color }}>
                {c.name}
              </span>
            </button>
          );
        })}

        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-panelborder/50 px-1 py-2 opacity-50">
          <span className="w-7 h-7 rounded-full border border-dashed border-parchment/40 flex items-center justify-center text-[11px] text-parchment/40">
            ?
          </span>
          <span className="h-12 sm:h-14" />
          <span className="font-serif italic text-[10px] text-parchment/50 text-center leading-tight">Em breve</span>
        </div>
      </div>

      {/* Scrim */}
      <div
        onClick={closeFocus}
        className={`fixed inset-0 z-30 bg-black/70 transition-opacity duration-300 ${
          selectedId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Focus panel */}
      {selectedId && selected && (
        <div
          ref={panelRef}
          role="dialog" aria-modal="true"
          className="fixed z-40 top-1/2 left-1/2 w-[min(94vw,420px)] max-h-[88vh] overflow-y-auto rounded-lg border border-gold/40 bg-panel shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-4"
          style={{ backgroundImage: `url(${pergaminho})`, backgroundSize: '340px', backgroundBlendMode: 'multiply' }}
        >
          <button
            type="button"
            onClick={closeFocus}
            className="text-xs px-3 py-1.5 rounded border border-panelborder text-parchment/70 hover:text-parchment hover:border-gold/50 font-bold"
          >
            ‹ Voltar
          </button>

          <div className="flex flex-row items-center gap-3 mt-3">
            <div className="flex flex-col items-center text-center w-24 shrink-0">
              <img src={CLASS_ICON[selectedId]} alt="" className="w-11 h-11 mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" draggable={false} />
              <div className="relative flex items-center justify-center mb-1">
                <div
                  className="absolute w-14 h-14 rounded-full blur-xl opacity-30"
                  style={{ background: selected.color }}
                />
                <img
                  src={heroSprites(selectedId).idle.image.src}
                  alt={selected.name}
                  className="relative h-16 sm:h-20 w-auto object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <h3 className="font-display text-lg leading-none" style={{ color: selected.color }}>{selected.name}</h3>
              <span className="font-serif italic text-[10px] text-parchment/50 mt-1">{WEIGHT_LABEL[WEIGHT_GROUP[selectedId]]}</span>
            </div>

            <div className="flex-1 min-w-0 flex items-center justify-center">
              <AttributeRadar totals={totals} />
            </div>
          </div>

          <div className="mt-4 border-t border-panelborder/60 pt-3">
            <div className="flex items-baseline justify-between font-serif text-xs uppercase tracking-wide text-parchment/60">
              <span>Pontos livres</span>
              <strong className="font-display text-xl text-gold tabular-nums normal-case tracking-normal">{remaining}</strong>
            </div>
            <p className="font-serif italic text-[11px] text-parchment/50 mt-0.5 mb-3">
              Base do nível 1 já aplicada por classe · {STARTING_ATTR_POINTS} pontos extras para distribuir
            </p>

            <div className="flex flex-col gap-1.5">
              {ATTR_ORDER.map((key) => {
                const meta = ATTR_META[key];
                const base = selected.baseAttrs[key] ?? 0;
                const val = allocated[key];
                return (
                  <div key={key} className="grid grid-cols-[24px_1fr_auto_74px] items-center gap-2 px-2 py-1.5 rounded bg-black/20 border border-panelborder/30">
                    <span className="text-[11px] font-serif" style={{ color: meta.color }}>{meta.abbr}</span>
                    <span className="text-sm text-parchment">{meta.label}</span>
                    <span className="text-sm tabular-nums text-right">
                      <span className="text-parchment/60">{base}</span>
                      {val > 0 && <span className="text-gold"> +{val}</span>}
                    </span>
                    <span className="flex items-center gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => adjust(key, -1)}
                        disabled={val <= 0}
                        aria-label={`Diminuir ${meta.label}`}
                        className="w-6 h-6 rounded border border-panelborder bg-panel2 text-parchment flex items-center justify-center text-sm leading-none disabled:opacity-30 enabled:hover:border-gold enabled:hover:text-gold"
                      >
                        −
                      </button>
                      <span className="text-gold text-xs tabular-nums w-3 text-center">{val}</span>
                      <button
                        type="button"
                        onClick={() => adjust(key, 1)}
                        disabled={remaining <= 0}
                        aria-label={`Aumentar ${meta.label}`}
                        className="w-6 h-6 rounded border border-panelborder bg-panel2 text-parchment flex items-center justify-center text-sm leading-none disabled:opacity-30 enabled:hover:border-gold enabled:hover:text-gold"
                      >
                        +
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>

            <Button onClick={confirm} disabled={remaining !== 0} className="w-full mt-4">
              Iniciar Jornada
            </Button>
          </div>
        </div>
      )}

      {naming && selected && (
        <Modal title="Nomeie seu Herói" onClose={() => setNaming(false)}>
          <div className="flex flex-col items-center gap-3 py-1">
            <span className="w-11 h-11 rounded-full border-2 border-dashed flex items-center justify-center text-base font-display" style={{ borderColor: `${selected.color}90`, color: selected.color, background: `${selected.color}22` }}>
              {selected.name.slice(0, 1)}
            </span>
            <p className="text-xs text-parchment/50 text-center">Como esse {selected.name.toLowerCase()} vai ser conhecido pelo reino?</p>
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') finalizeCreate(); }}
              placeholder="Nome do herói"
              maxLength={18}
              className="w-56 px-3 py-2 rounded bg-black/40 border border-white/20 text-center text-parchment placeholder:text-parchment/40 focus:outline-none focus:border-gold"
            />
            {nameError && <p className="text-xs text-crimson -mt-1">{nameError}</p>}

            <label className={`flex items-start gap-2 w-full max-w-xs px-3 py-2 rounded border cursor-pointer text-left transition ${
              ironMode ? 'border-crimson bg-crimson/15' : 'border-panelborder/40 bg-black/20 hover:border-crimson/40'
            }`}>
              <input
                type="checkbox"
                checked={ironMode}
                onChange={(e) => setIronMode(e.target.checked)}
                className="mt-0.5 accent-crimson"
              />
              <span>
                <span className={`block text-xs font-bold uppercase tracking-wide ${ironMode ? 'text-crimson' : 'text-parchment/80'}`}>
                  ☠ Modo Ferro
                </span>
                <span className="block text-[11px] text-parchment/50 mt-0.5">
                  Morte é permanente — se esse herói cair em uma masmorra, ele é perdido para sempre. Em troca, todo prestígio ganho é triplicado.
                </span>
              </span>
            </label>

            <div className="flex gap-2 mt-1">
              <SmallButton onClick={() => setNaming(false)} variant="ghost">Voltar</SmallButton>
              <SmallButton onClick={finalizeCreate} disabled={!name.trim() || checkingName}>
                {checkingName ? 'Verificando...' : 'Iniciar Jornada'}
              </SmallButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
