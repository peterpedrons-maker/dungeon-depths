import { useState } from 'react';
import { Character, EquipmentItem, ItemSlot } from '../types/game';
import { fmt } from '../lib/format';
import { BUILDINGS, BuildingDef } from '../lib/buildings';
import { rarityColor, rarityName, SLOT_NAMES } from '../lib/equipment';
import { itemDisplayName } from '../lib/enhancement';
import { Panel } from './Panel';
import { Button } from './Button';
import { Modal } from './Modal';
import { EnhanceSection } from './EnhanceSection';
import { IconSword, IconChest, IconLegs, IconGloves, IconShield, IconRing } from './icons';
import mapaConstrucoes from '../assets/reino-construcoes.webp';
import slotFrame from '../assets/slot-equipamento.webp';

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
  const openBuilding = BUILDINGS.find((b) => b.id === openBuildingId) ?? null;

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
              onClick={() => setOpenBuildingId(b.id)}
              title={b.name}
              className="absolute w-16 h-16 sm:w-20 sm:h-20 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition hover:bg-gold/15 hover:ring-2 hover:ring-gold/50"
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

      {openBuilding && (
        openBuilding.id === 'forja' ? (
          <ForjaModal character={ch} building={openBuilding} onUpgrade={onUpgrade} onEnhance={onEnhance} onClose={() => setOpenBuildingId(null)} />
        ) : (
          <BuildingModal building={openBuilding} level={ch.buildings[openBuilding.id] ?? 0} gold={ch.gold} onUpgrade={onUpgrade} onClose={() => setOpenBuildingId(null)} />
        )
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

// The Forja is the only construction with a second, non-upgrade interaction
// today (aprimorar itens com o Ferreiro) — so its modal gets its own small
// step machine (menu → lista de itens → detalhe do item) instead of reusing
// the plain BuildingModal. Other buildings fall back to BuildingModal until
// they grow a similar second action.
function ForjaModal({ character: ch, building: b, onUpgrade, onEnhance, onClose }: {
  character: Character; building: BuildingDef; onUpgrade: (id: string) => void; onEnhance: (item: EquipmentItem) => void; onClose: () => void;
}) {
  const [step, setStep] = useState<'menu' | 'items'>('menu');
  const [openItem, setOpenItem] = useState<EquipmentItem | null>(null);
  const level = ch.buildings.forja ?? 0;
  const maxed = level >= b.maxLevel;
  const cost = maxed ? 0 : b.costForLevel(level);
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
          forjaLevel={level}
          onEnhance={(item) => { onEnhance(item); setOpenItem({ ...item, enhanceLevel: item.enhanceLevel + 1 }); }}
        />
      </Modal>
    );
  }

  if (step === 'items') {
    return (
      <Modal title="Ferreiro" onClose={onClose}>
        <button onClick={() => setStep('menu')} className="text-xs text-parchment/50 hover:text-parchment mb-1">‹ Voltar</button>
        <p className="text-xs text-parchment/50 mb-3">
          {level > 0
            ? `Nível da Forja: ${level}/5 — aprimoramento liberado até +${Math.min(10, level * 2)}. Toque num item pra aprimorar.`
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

  return (
    <Modal title={b.name} onClose={onClose}>
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="text-xs bg-gold/20 border border-gold/50 text-gold rounded-full px-3 py-1 font-bold shrink-0">
          Nível {level}/{b.maxLevel}
        </span>
      </div>
      <p className="text-xs text-parchment/50 mb-2">{b.desc}</p>
      {level > 0 && <p className="text-xs text-emerald-400 mb-3">Efeito atual: {b.effectLabel(level)}</p>}
      <Button onClick={() => onUpgrade(b.id)} disabled={maxed || ch.gold < cost} className="w-full">
        {maxed ? 'Nível Máximo' : `Melhorar Forja — ${fmt(cost)} ouro`}
      </Button>
      <Button onClick={() => setStep('items')} className="w-full mt-2">
        Conversar com o Ferreiro
      </Button>
    </Modal>
  );
}
