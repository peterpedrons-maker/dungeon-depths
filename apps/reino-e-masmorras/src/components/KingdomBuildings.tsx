import { useState } from 'react';
import { Character } from '../types/game';
import { fmt } from '../lib/format';
import { BUILDINGS, BuildingDef } from '../lib/buildings';
import { Panel } from './Panel';
import { Button } from './Button';
import { Modal } from './Modal';
import mapaConstrucoes from '../assets/reino-construcoes.webp';

interface Props {
  character: Character;
  onUpgrade: (buildingId: string) => void;
}

// Coordinates were measured directly from the generated map art (each
// building's own sign-post, or the scaffolding for the reserved plot) —
// %-based so they stay aligned even if the image is regenerated at a
// different resolution. Same pattern as lib/dungeonMap.ts's markers.
const MARKERS: Record<string, { xPct: number; yPct: number }> = {
  forja: { xPct: 15.6, yPct: 68.3 },
  capela: { xPct: 40.6, yPct: 61.7 },
  guilda: { xPct: 68.1, yPct: 63.3 },
};
const RESERVED_MARKER = { xPct: 89.4, yPct: 56.4 };

export function KingdomBuildings({ character: ch, onUpgrade }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openBuilding = BUILDINGS.find((b) => b.id === openId) ?? null;

  return (
    <Panel title="Reino — Construções">
      <p className="text-parchment/70 mb-4">
        Invista seu ouro em melhorias permanentes que continuam valendo em toda expedição futura. Toque numa
        construção no mapa pra ver os detalhes.
      </p>

      <div className="relative rounded overflow-hidden border border-black/50 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
        <img src={mapaConstrucoes} alt="Mapa de construções do Reino" className="w-full h-auto block" draggable={false} style={{ imageRendering: 'pixelated' }} />
        {BUILDINGS.map((b) => {
          const marker = MARKERS[b.id];
          if (!marker) return null;
          const level = ch.buildings[b.id] ?? 0;
          return (
            <button
              key={b.id}
              onClick={() => setOpenId(b.id)}
              title={b.name}
              className="absolute w-14 h-14 sm:w-16 sm:h-16 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition hover:bg-gold/15 hover:ring-2 hover:ring-gold/50"
              style={{ left: `${marker.xPct}%`, top: `${marker.yPct}%` }}
            >
              {level > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-gold text-ink rounded-full w-5 h-5 flex items-center justify-center border border-black/40 shadow">
                  {level}
                </span>
              )}
            </button>
          );
        })}
        <div
          title="Reservado para uma futura construção"
          className="absolute w-14 h-14 sm:w-16 sm:h-16 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center opacity-70"
          style={{ left: `${RESERVED_MARKER.xPct}%`, top: `${RESERVED_MARKER.yPct}%` }}
        >
          <span className="text-[10px] font-bold text-parchment [text-shadow:0_1px_3px_rgba(0,0,0,0.95),0_0_4px_rgba(0,0,0,0.95)]">Em breve</span>
        </div>
      </div>

      {openBuilding && (
        <BuildingModal building={openBuilding} level={ch.buildings[openBuilding.id] ?? 0} gold={ch.gold} onUpgrade={onUpgrade} onClose={() => setOpenId(null)} />
      )}
    </Panel>
  );
}

function BuildingModal({ building: b, level, gold, onUpgrade, onClose }: {
  building: BuildingDef; level: number; gold: number; onUpgrade: (id: string) => void; onClose: () => void;
}) {
  const maxed = level >= b.maxLevel;
  const cost = maxed ? 0 : b.costForLevel(level);
  return (
    <Modal title={b.name} onClose={onClose}>
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="text-xs bg-gold/20 border border-gold/50 text-gold rounded-full px-3 py-1 font-bold shrink-0">
          Nível {level}/{b.maxLevel}
        </span>
      </div>
      <p className="text-xs text-parchment/50 mb-2">{b.desc}</p>
      {level > 0 && <p className="text-xs text-emerald-400 mb-3">Efeito atual: {b.effectLabel(level)}</p>}
      <Button onClick={() => onUpgrade(b.id)} disabled={maxed || gold < cost} className="w-full">
        {maxed ? 'Nível Máximo' : `Melhorar — ${fmt(cost)} ouro`}
      </Button>
    </Modal>
  );
}
