import { useEffect, useRef, useState, CSSProperties, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { BUILDINGS, BuildingDef } from '../lib/buildings';
import { Panel } from './Panel';
import pergaminho from '../assets/pergaminho.webp';
import mapaConstrucoes from '../assets/reino-construcoes.webp';

interface Props {
  onOpenFerreiro: () => void;
  onOpenMercador: () => void;
  onOpenBau: () => void;
}

// Coordinates were measured directly from the generated map art (each
// building's own sign-post) — %-based so they stay aligned even if the
// image is regenerated at a different resolution. Same pattern as
// lib/dungeonMap.ts's markers. The 'capela' plot was repurposed into the
// Baú de Armazém — same marker position, new purpose.
const MARKERS: Record<string, { xPct: number; yPct: number }> = {
  forja: { xPct: 15.6, yPct: 68.3 },
  bau: { xPct: 40.6, yPct: 61.7 },
  mercador: { xPct: 68.1, yPct: 63.3 },
};
const RESERVED_MARKER = { xPct: 89.4, yPct: 56.4 };

// Every marker opens straight into its own scene — there's no "melhorar
// nível" purchase flow anymore (the whole building-level meta was removed:
// Forja's success chance, Mercador's prices and the old Capela's heal bonus
// are all flat now, nothing to invest gold into).
export function KingdomBuildings({ onOpenFerreiro, onOpenMercador, onOpenBau }: Props) {
  const [openBuildingId, setOpenBuildingId] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const markerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const popoverRef = useRef<HTMLDivElement>(null);

  const openBuilding = BUILDINGS.find((b) => b.id === openBuildingId) ?? null;

  const talkActions: Record<string, { label: string; onOpen: () => void }> = {
    forja: { label: 'Conversar com o Ferreiro', onOpen: onOpenFerreiro },
    mercador: { label: 'Conversar com o Mercador', onOpen: onOpenMercador },
    bau: { label: 'Abrir o Baú', onOpen: onOpenBau },
  };

  useEffect(() => {
    if (!openBuildingId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenBuildingId(null); };
    window.addEventListener('keydown', onKey);
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (Object.values(markerRefs.current).some((el) => el?.contains(target))) return;
      setOpenBuildingId(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [openBuildingId]);

  function toggleBuilding(id: string) {
    if (openBuildingId === id) { setOpenBuildingId(null); return; }
    const el = markerRefs.current[id];
    if (el) setAnchorRect(el.getBoundingClientRect());
    setOpenBuildingId(id);
  }

  return (
    <Panel title="Reino — Mercadores">
      <p className="text-parchment/70 mb-4">
        Toque numa construção no mapa pra visitá-la.
      </p>

      <div className="relative rounded overflow-hidden border border-black/50 shadow-[0_4px_16px_rgba(0,0,0,0.5)] aspect-[2/1]">
        <img
          src={mapaConstrucoes}
          alt="Mapa de construções do Reino"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ imageRendering: 'pixelated', objectPosition: '50% 62%' }}
          draggable={false}
        />
        {BUILDINGS.map((b) => {
          const marker = MARKERS[b.id];
          if (!marker) return null;
          return (
            <button
              key={b.id}
              ref={(el) => { markerRefs.current[b.id] = el; }}
              onClick={() => toggleBuilding(b.id)}
              title={b.name}
              className={`absolute w-16 h-16 sm:w-20 sm:h-20 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition hover:bg-gold/15 hover:ring-2 hover:ring-gold/50 ${
                openBuildingId === b.id ? 'bg-gold/15 ring-2 ring-gold/50' : ''
              }`}
              style={{ left: `${marker.xPct}%`, top: `${markerYPct(marker.yPct)}%` }}
            />
          );
        })}
        <div
          title="Reservado para uma futura construção"
          className="absolute w-16 h-16 sm:w-20 sm:h-20 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center opacity-70"
          style={{ left: `${RESERVED_MARKER.xPct}%`, top: `${markerYPct(RESERVED_MARKER.yPct)}%` }}
        >
          <span className="text-[10px] font-bold text-parchment [text-shadow:0_1px_3px_rgba(0,0,0,0.95),0_0_4px_rgba(0,0,0,0.95)]">Em breve</span>
        </div>
      </div>

      {openBuilding && anchorRect && (
        <BuildingPopover
          popoverRef={popoverRef}
          anchorRect={anchorRect}
          building={openBuilding}
          talk={talkActions[openBuilding.id]}
          onClose={() => setOpenBuildingId(null)}
        />
      )}
    </Panel>
  );
}

// Marker Y coordinates were measured against the full uncropped image; the
// map now renders cropped to a 2:1 box (see objectPosition below), so the
// same source-pixel position needs remapping into the cropped viewport.
function markerYPct(sourceYPct: number): number {
  const cropTopPct = 12; // matches objectPosition '50% 62%' at aspect-[2/1] on a 2.44:1 source
  const cropHeightPct = 82;
  return ((sourceYPct - cropTopPct) / cropHeightPct) * 100;
}

// A small balloon anchored right next to the marker that was tapped, instead
// of a centered full-screen Modal — keeps opening a building feeling like
// part of the map rather than a separate window. Portaled to <body> and
// positioned via the marker's own getBoundingClientRect() so it's never
// clipped by an ancestor's overflow-hidden (the map crop, the Panel card,
// etc.) no matter where on the page it renders.
function BuildingPopover({ popoverRef, anchorRect, building: b, talk, onClose }: {
  popoverRef: RefObject<HTMLDivElement>; anchorRect: DOMRect; building: BuildingDef;
  talk?: { label: string; onOpen: () => void }; onClose: () => void;
}) {
  const centerX = anchorRect.left + anchorRect.width / 2;
  const placeBelow = anchorRect.top < window.innerHeight / 2;
  const vertical: CSSProperties = placeBelow
    ? { top: anchorRect.bottom + 10 }
    : { bottom: window.innerHeight - anchorRect.top + 10 };

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-50 w-56 rounded-sm border-2 border-gold/50 bg-panel shadow-[0_12px_30px_rgba(0,0,0,0.6)] p-3 text-xs"
      style={{
        left: `clamp(120px, ${centerX}px, calc(100vw - 120px))`,
        transform: 'translateX(-50%)',
        backgroundImage: `url(${pergaminho})`, backgroundSize: '200px', backgroundBlendMode: 'multiply',
        ...vertical,
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-display text-gold font-bold tracking-wide leading-tight">{b.name}</span>
        <button onClick={onClose} className="text-parchment/50 hover:text-parchment text-base leading-none px-1 shrink-0" aria-label="Fechar">×</button>
      </div>
      <p className="text-parchment/70 mb-2">{b.desc}</p>
      {talk && (
        <button
          onClick={() => { talk.onOpen(); onClose(); }}
          className="w-full text-center font-bold text-ink bg-gold rounded px-2 py-1.5 hover:brightness-110 active:brightness-95"
        >
          {talk.label}
        </button>
      )}
    </div>,
    document.body,
  );
}
