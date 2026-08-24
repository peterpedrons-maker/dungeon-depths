import { BUILDINGS } from '../lib/buildings';
import { Panel } from './Panel';
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
// are all flat now, nothing to invest gold into). A tap used to open a small
// popover with the building's description and a "Conversar com X" button —
// removed in favor of jumping straight into the NPC's own scene, since that
// confirm step no longer does anything a first-time player needs (there's
// no purchase to review) and was just one extra tap on every single visit.
export function KingdomBuildings({ onOpenFerreiro, onOpenMercador, onOpenBau }: Props) {
  const openActions: Record<string, () => void> = {
    forja: onOpenFerreiro,
    mercador: onOpenMercador,
    bau: onOpenBau,
  };

  return (
    <Panel title="Reino — Mercadores">
      <p className="text-parchment/70 mb-4">
        Toque numa construção no mapa pra visitá-la.
      </p>

      <div className="relative rounded overflow-hidden border border-black/50 shadow-[0_4px_16px_rgba(0,0,0,0.5)] aspect-[4/3]">
        <img
          src={mapaConstrucoes}
          alt="Mapa de construções do Reino"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ imageRendering: 'pixelated', objectPosition: '50% 62%' }}
          draggable={false}
        />
        {BUILDINGS.map((b) => {
          const marker = MARKERS[b.id];
          const onOpen = openActions[b.id];
          if (!marker || !onOpen) return null;
          return (
            <button
              key={b.id}
              onClick={onOpen}
              title={b.name}
              className="absolute w-16 h-16 sm:w-20 sm:h-20 -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-end pb-1 transition hover:bg-gold/15 hover:ring-2 hover:ring-gold/50"
              style={{ left: `${marker.xPct}%`, top: `${markerYPct(marker.yPct)}%` }}
            >
              {/* Name tag — a first-time player has no other way to tell the
                  three buildings apart (the generated art has no readable
                  signage of its own), so every marker always shows its
                  building's name, not just on hover. */}
              <span className="text-[10px] sm:text-[11px] font-bold text-gold bg-black/70 border border-gold/40 rounded-full px-2 py-0.5 whitespace-nowrap [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
                {b.name}
              </span>
            </button>
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
    </Panel>
  );
}

// Marker Y coordinates were measured against the full uncropped image; the
// map renders cropped into a 4:3 box (see objectPosition below), so the
// same source-pixel position needs remapping into the cropped viewport.
function markerYPct(sourceYPct: number): number {
  const cropTopPct = 28.1; // matches objectPosition '50% 62%' at aspect-[4/3] on a 2.44:1 source
  const cropHeightPct = 54.7;
  return ((sourceYPct - cropTopPct) / cropHeightPct) * 100;
}
