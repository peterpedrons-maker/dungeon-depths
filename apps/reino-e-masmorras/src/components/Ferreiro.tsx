import { Fragment, useEffect, useState } from 'react';
import { Character, EquipmentItem, ItemSlot } from '../types/game';
import { rarityColor, rarityName, SLOT_NAMES } from '../lib/equipment';
import { enhancedItem, itemDisplayName } from '../lib/enhancement';
import { EnhanceSection } from './EnhanceSection';
import { IconSword, IconChest, IconLegs, IconGloves, IconShield, IconRing, IconHammer } from './icons';
import slotFrame from '../assets/slot-equipamento.webp';
import pergaminho from '../assets/pergaminho.webp';
import ferreiroCena from '../assets/ferreiro-cena.webp';
import martelo from '../assets/aprimoramento-martelo.webp';

interface Props {
  character: Character;
  onEnhance: (item: EquipmentItem) => void;
  onClose: () => void;
}

const SLOT_ICON: Record<ItemSlot, typeof IconSword> = {
  weapon: IconSword, body: IconChest, legs: IconLegs, hands: IconGloves, offhand: IconShield, accessory: IconRing,
};

const STAT_ROWS: { key: 'dmgBonus' | 'defBonus' | 'hpBonus' | 'matkBonus' | 'mdefBonus' | 'critChanceBonus' | 'critDmgBonus'; label: string; pct?: boolean }[] = [
  { key: 'dmgBonus', label: 'Dano' },
  { key: 'defBonus', label: 'Defesa' },
  { key: 'hpBonus', label: 'Vida Máxima' },
  { key: 'matkBonus', label: 'Ataque Mágico' },
  { key: 'mdefBonus', label: 'Defesa Mágica' },
  { key: 'critChanceBonus', label: 'Chance de Crítico', pct: true },
  { key: 'critDmgBonus', label: 'Dano Crítico', pct: true },
];

const ANIM_MS = 1300;

// Plays for a bit over one loop of the hammer-strike sprite when the player
// confirms an "Aprimorar" — purely theatrical (the stat change already
// happened via onEnhance when the animation started, same as the
// instant-apply flow everywhere else in the game), but gives the Ferreiro
// visit the "sabe? Como se a arma tivesse se aprimorando mesmo" moment that
// was asked for: item before vs. after side by side with the hammer/anvil
// animation between them.
function EnhanceAnimation({ item, onDone }: { item: EquipmentItem; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, ANIM_MS);
    return () => window.clearTimeout(t);
  }, [onDone]);

  const before = enhancedItem(item);
  const after = enhancedItem({ ...item, enhanceLevel: item.enhanceLevel + 1 });
  const rows = STAT_ROWS.filter((r) => item[r.key] !== 0);
  const fmtVal = (v: number, pct?: boolean) => (pct ? `+${Math.round(v * 100)}%` : `+${v}`);

  return (
    <div className="rounded border border-black/50 bg-black/30 p-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] text-center">
      <div className="font-bold text-base mb-1" style={{ color: rarityColor(item.rarity) }}>{item.name}</div>
      <div className="text-xs text-gold mb-3">+{item.enhanceLevel} → +{item.enhanceLevel + 1}</div>

      <div className="flex items-center justify-center mb-4">
        <img src={martelo} alt="" className="h-28 w-auto" style={{ imageRendering: 'pixelated' }} draggable={false} />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-2 gap-y-1 items-center text-xs max-w-[220px] mx-auto">
        {rows.map((r) => (
          <Fragment key={r.key}>
            <span className="text-right text-parchment/45">{fmtVal(before[r.key], r.pct)}</span>
            <span className="text-gold">→</span>
            <span className="text-left text-emerald-400 font-bold">{fmtVal(after[r.key], r.pct)}</span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// Full-screen scene opened from the Forja's "Conversar com o Ferreiro"
// balloon action, replacing the old plain item-grid Modal. The banner is a
// full-bleed hero area sized to a near-square crop that stays safe across
// phone aspect ratios (see KIT-DE-ARTE.md's Cena do Ferreiro prompt for why
// the source art is a 1536x1536 square).
export function Ferreiro({ character: ch, onEnhance, onClose }: Props) {
  const [openItem, setOpenItem] = useState<EquipmentItem | null>(null);
  const [animatingItem, setAnimatingItem] = useState<EquipmentItem | null>(null);
  const forjaLevel = ch.buildings.forja ?? 0;
  const forgeableItems = [...Object.values(ch.equipment).filter((i): i is EquipmentItem => i !== null), ...ch.inventory];

  return (
    <div className="fixed inset-0 z-40 bg-nightsky overflow-y-auto flex flex-col">
      <div className="relative w-full shrink-0 overflow-hidden" style={{ height: '44vh', minHeight: 260 }}>
        <img
          src={ferreiroCena}
          alt="O Ferreiro em sua forja"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ imageRendering: 'pixelated' }}
          draggable={false}
        />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="absolute top-3 inset-x-3 flex items-center justify-between">
          <h2 className="font-display text-gold text-sm sm:text-base font-bold tracking-[0.12em] sm:tracking-[0.18em] uppercase [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
            Ferreiro
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/50 border border-gold/40 text-parchment/80 hover:text-parchment hover:border-gold text-lg leading-none flex items-center justify-center shrink-0"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      </div>

      <div className="max-w-md w-full mx-auto p-3 sm:p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-panel border-2 border-gold/50 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <IconHammer className="w-5 h-5 text-gold" />
          </div>
          <div
            className="relative bg-panel border-2 border-gold/40 rounded-sm px-4 py-3 text-sm text-parchment/90 shadow-[0_6px_16px_rgba(0,0,0,0.5)]"
            style={{ backgroundImage: `url(${pergaminho})`, backgroundSize: '200px', backgroundBlendMode: 'multiply' }}
          >
            <span className="absolute -left-[7px] top-4 w-3 h-3 bg-panel border-l-2 border-b-2 border-gold/40 rotate-45" />
            {animatingItem
              ? 'Segura aí... uns golpes bem colocados e já sai.'
              : openItem
              ? 'Boa escolha. Deixa eu ver o que consigo fazer com essa peça...'
              : `Fala, ${ch.name}. Qual peça você quer que eu aprimore hoje?`}
          </div>
        </div>

        {animatingItem ? (
          <EnhanceAnimation
            item={animatingItem}
            onDone={() => {
              onEnhance(animatingItem);
              setOpenItem({ ...animatingItem, enhanceLevel: animatingItem.enhanceLevel + 1 });
              setAnimatingItem(null);
            }}
          />
        ) : openItem ? (
          <div className="rounded border border-black/50 bg-black/30 p-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
            <button onClick={() => setOpenItem(null)} className="text-xs text-parchment/50 hover:text-parchment mb-2">‹ Voltar</button>
            <div className="font-bold text-base" style={{ color: rarityColor(openItem.rarity) }}>{itemDisplayName(openItem)}</div>
            <div className="text-xs text-parchment/50">{rarityName(openItem.rarity)} · Tier {openItem.tier} · {SLOT_NAMES[openItem.slot]}</div>
            <EnhanceSection
              item={openItem}
              gold={ch.gold}
              forjaLevel={forjaLevel}
              onEnhance={(item) => setAnimatingItem(item)}
            />
          </div>
        ) : (
          <>
            <p className="text-xs text-parchment/60 mb-3">
              {forjaLevel > 0
                ? `Nível da Forja: ${forjaLevel}/5 — aprimoramento liberado até +${Math.min(10, forjaLevel * 2)}. Toque num item pra aprimorar.`
                : 'Construa a Forja pra liberar o aprimoramento de itens.'}
            </p>
            {forgeableItems.length === 0 ? (
              <p className="text-parchment/40 text-sm italic">Nenhum item pra aprimorar ainda.</p>
            ) : (
              <div className="rounded border border-black/50 bg-black/30 p-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
                <div className="grid grid-cols-5 gap-2.5">
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
          </>
        )}
      </div>
    </div>
  );
}
