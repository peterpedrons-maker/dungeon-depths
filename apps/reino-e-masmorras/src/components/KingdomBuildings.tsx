import { useEffect, useRef, useState, CSSProperties, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Character, EquipmentItem, ItemSlot } from '../types/game';
import { fmt } from '../lib/format';
import { BUILDINGS, BuildingDef } from '../lib/buildings';
import { rarityColor, rarityName, SLOT_NAMES } from '../lib/equipment';
import { itemDisplayName } from '../lib/enhancement';
import { Panel } from './Panel';
import { Modal } from './Modal';
import { EnhanceSection } from './EnhanceSection';
import { IconSword, IconChest, IconLegs, IconGloves, IconShield, IconRing } from './icons';
import mapaConstrucoes from '../assets/reino-construcoes.webp';
import slotFrame from '../assets/slot-equipamento.webp';
import pergaminho from '../assets/pergaminho.webp';

interface Props {
  character: Character;
  onUpgrade: (buildingId: string) => void;
  onEnhance: (item: EquipmentItem) => void;
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

const SLOT_ICON: Record<ItemSlot, typeof IconSword> = {
  weapon: IconSword, body: IconChest, legs: IconLegs, hands: IconGloves, offhand: IconShield, accessory: IconRing,
};

export function KingdomBuildings({ character: ch, onUpgrade, onEnhance }: Props) {
  const [openBuildingId, setOpenBuildingId] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [ferreiroOpen, setFerreiroOpen] = useState(false);
  const [glowId, setGlowId] = useState<string | null>(null);
  const markerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const popoverRef = useRef<HTMLDivElement>(null);
  const glowTimer = useRef<number | undefined>(undefined);

  const openBuilding = BUILDINGS.find((b) => b.id === openBuildingId) ?? null;

  useEffect(() => {
    if (!openBuildingId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenBuildingId(null); };
    window.addEventListener('keydown', onKey);
    // A full-screen click-catcher would intercept the click needed to swap
    // straight from one marker's balloon to another's, so instead we just
    // watch for clicks that land outside both the balloon and every marker.
    // Marker clicks are left alone — toggleBuilding already handles them
    // (close if same marker, switch anchor if a different one).
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

  useEffect(() => () => window.clearTimeout(glowTimer.current), []);

  function toggleBuilding(id: string) {
    if (openBuildingId === id) { setOpenBuildingId(null); return; }
    const el = markerRefs.current[id];
    if (el) setAnchorRect(el.getBoundingClientRect());
    setOpenBuildingId(id);
  }

  function handleUpgradeClick(id: string) {
    onUpgrade(id);
    setGlowId(id);
    window.clearTimeout(glowTimer.current);
    glowTimer.current = window.setTimeout(() => setGlowId(null), 900);
  }

  return (
    <Panel title="Reino — Construções">
      <p className="text-parchment/70 mb-4">
        Invista seu ouro em melhorias permanentes que continuam valendo em toda expedição futura. Toque numa
        construção no mapa pra ver os detalhes.
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
          const level = ch.buildings[b.id] ?? 0;
          return (
            <button
              key={b.id}
              ref={(el) => { markerRefs.current[b.id] = el; }}
              onClick={() => toggleBuilding(b.id)}
              title={b.name}
              className={`absolute w-16 h-16 sm:w-20 sm:h-20 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition hover:bg-gold/15 hover:ring-2 hover:ring-gold/50 ${
                glowId === b.id ? 'animate-[buildingGlow_0.9s_ease-out]' : ''
              } ${openBuildingId === b.id ? 'bg-gold/15 ring-2 ring-gold/50' : ''}`}
              style={{ left: `${marker.xPct}%`, top: `${markerYPct(marker.yPct)}%` }}
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
          level={ch.buildings[openBuilding.id] ?? 0}
          gold={ch.gold}
          onUpgrade={() => handleUpgradeClick(openBuilding.id)}
          onOpenFerreiro={openBuilding.id === 'forja' ? () => { setFerreiroOpen(true); setOpenBuildingId(null); } : undefined}
          onClose={() => setOpenBuildingId(null)}
        />
      )}

      {ferreiroOpen && (
        <FerreiroModal character={ch} forjaLevel={ch.buildings.forja ?? 0} onEnhance={onEnhance} onClose={() => setFerreiroOpen(false)} />
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
// of a centered full-screen Modal — keeps the "melhorar / conversar" choice
// feeling like part of the map rather than a separate window. Portaled to
// <body> and positioned via the marker's own getBoundingClientRect() so it's
// never clipped by an ancestor's overflow-hidden (the map crop, the Panel
// card, etc.) no matter where on the page it renders.
function BuildingPopover({ popoverRef, anchorRect, building: b, level, gold, onUpgrade, onOpenFerreiro, onClose }: {
  popoverRef: RefObject<HTMLDivElement>; anchorRect: DOMRect; building: BuildingDef; level: number; gold: number;
  onUpgrade: () => void; onOpenFerreiro?: () => void; onClose: () => void;
}) {
  const maxed = level >= b.maxLevel;
  const cost = maxed ? 0 : b.costForLevel(level);
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
      <span className="inline-block text-[10px] bg-gold/20 border border-gold/50 text-gold rounded-full px-2 py-0.5 font-bold mb-2">
        Nível {level}/{b.maxLevel}
      </span>
      <button
        onClick={onUpgrade}
        disabled={maxed || gold < cost}
        className="w-full text-center font-bold text-ink bg-gold rounded px-2 py-1.5 mb-1.5 hover:brightness-110 active:brightness-95 disabled:opacity-40 disabled:grayscale disabled:hover:brightness-100"
      >
        {maxed ? 'Nível Máximo' : `Melhorar — ${fmt(cost)} ouro`}
      </button>
      {onOpenFerreiro && (
        <button
          onClick={onOpenFerreiro}
          className="w-full text-center font-bold text-parchment/80 border border-panelborder rounded px-2 py-1.5 hover:border-gold/50 hover:text-parchment"
        >
          Conversar com o Ferreiro
        </button>
      )}
    </div>,
    document.body
  );
}

// Opened from the Forja's popover — the item grid + per-item enhance detail.
// Still a plain Modal for now; a future pass replaces this with a full scene
// (background art + dialogue) once that art exists.
function FerreiroModal({ character: ch, forjaLevel, onEnhance, onClose }: {
  character: Character; forjaLevel: number; onEnhance: (item: EquipmentItem) => void; onClose: () => void;
}) {
  const [openItem, setOpenItem] = useState<EquipmentItem | null>(null);
  const forgeableItems = [...Object.values(ch.equipment).filter((i): i is EquipmentItem => i !== null), ...ch.inventory];

  if (openItem) {
    return (
      <Modal title={SLOT_NAMES[openItem.slot]} onClose={onClose}>
        <button onClick={() => setOpenItem(null)} className="text-xs text-parchment/50 hover:text-parchment mb-1">‹ Voltar</button>
        <div className="font-bold text-base" style={{ color: rarityColor(openItem.rarity) }}>{itemDisplayName(openItem)}</div>
        <div className="text-xs text-parchment/50">{rarityName(openItem.rarity)} · Tier {openItem.tier}</div>
        <EnhanceSection
          item={openItem}
          gold={ch.gold}
          forjaLevel={forjaLevel}
          onEnhance={(item) => { onEnhance(item); setOpenItem({ ...item, enhanceLevel: item.enhanceLevel + 1 }); }}
        />
      </Modal>
    );
  }

  return (
    <Modal title="Ferreiro" onClose={onClose}>
      <p className="text-xs text-parchment/50 mb-3">
        {forjaLevel > 0
          ? `Nível da Forja: ${forjaLevel}/5 — aprimoramento liberado até +${Math.min(10, forjaLevel * 2)}. Toque num item pra aprimorar.`
          : 'Construa a Forja pra liberar o aprimoramento de itens.'}
      </p>
      {forgeableItems.length === 0 ? (
        <p className="text-parchment/40 text-sm italic">Nenhum item pra aprimorar ainda.</p>
      ) : (
        <div className="rounded border border-black/50 bg-black/25 p-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
          <div className="grid grid-cols-5 gap-2.5 max-h-[16rem] overflow-y-auto pr-0.5">
            {forgeableItems.map((item) => {
              const Icon = SLOT_ICON[item.slot];
              const color = rarityColor(item.rarity);
              return (
                <button
                  key={item.id}
                  onClick={() => setOpenItem(item)}
                  title={itemDisplayName(item)}
                  className="relative aspect-square transition-transform duration-150 hover:scale-105"
                >
                  <div className="absolute inset-[16%] rounded-full" style={{ boxShadow: `0 0 10px 2px ${color}99`, background: `${color}22` }} />
                  <div className="absolute inset-[17%] flex items-center justify-center">
                    <Icon className="w-full h-full" style={{ color }} />
                  </div>
                  {item.enhanceLevel > 0 && (
                    <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-gold text-ink rounded-full px-1 min-w-[16px] text-center border border-black/40 shadow">
                      +{item.enhanceLevel}
                    </span>
                  )}
                  <img src={slotFrame} alt="" className="absolute inset-0 w-full h-full pointer-events-none select-none" draggable={false} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}
