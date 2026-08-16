import { Fragment, useEffect, useState } from 'react';
import { Character, EquipmentItem, ItemSlot } from '../types/game';
import { rarityColor, rarityName, SLOT_NAMES } from '../lib/equipment';
import { enhancedItem, itemDisplayName } from '../lib/enhancement';
import { EnhanceSection } from './EnhanceSection';
import { IconSword, IconChest, IconLegs, IconGloves, IconShield, IconRing, IconHammer, IconAnvil } from './icons';
import slotFrame from '../assets/slot-equipamento.webp';
import pergaminho from '../assets/pergaminho.webp';

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

const ANIM_MS = 1600;

// Plays for a few seconds when the player confirms an "Aprimorar" — purely
// theatrical (the stat change already happened via onEnhance when the
// animation started, same as the instant-apply flow everywhere else in the
// game), but gives the Ferreiro visit the "sabe? Como se a arma tivesse se
// aprimorando mesmo" moment that was asked for: item before vs. after side
// by side with a hammer striking an anvil between them.
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

      <div className="relative h-16 flex items-center justify-center mb-4">
        <span
          className="absolute w-9 h-9 rounded-full animate-[anvilSpark_1.6s_ease-in-out]"
          style={{ background: 'radial-gradient(circle, rgba(255,200,120,0.95) 0%, rgba(255,140,50,0.5) 55%, transparent 75%)' }}
        />
        <IconAnvil className="relative w-9 h-9 text-parchment/60" />
        <div className="absolute" style={{ transformOrigin: '85% 85%' }}>
          <IconHammer className="w-7 h-7 text-gold animate-[hammerSwing_1.6s_ease-in-out]" />
        </div>
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
// balloon action, replacing the old plain item-grid Modal. The banner area
// is a CSS forge-glow placeholder, sized to the same 2.4:1 aspect as every
// other painted "Cena" in this game — a future pass drops in the real
// illustration from the KIT-DE-ARTE.md prompt below with no layout changes
// needed, same write-prompt-then-integrate-later pattern used for the
// Kingdom scene and the Construções map.
export function Ferreiro({ character: ch, onEnhance, onClose }: Props) {
  const [openItem, setOpenItem] = useState<EquipmentItem | null>(null);
  const [animatingItem, setAnimatingItem] = useState<EquipmentItem | null>(null);
  const forjaLevel = ch.buildings.forja ?? 0;
  const forgeableItems = [...Object.values(ch.equipment).filter((i): i is EquipmentItem => i !== null), ...ch.inventory];

  return (
    <div className="fixed inset-0 z-40 bg-nightsky overflow-y-auto">
      <div className="max-w-md mx-auto p-3 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-gold text-sm sm:text-base font-bold tracking-[0.12em] sm:tracking-[0.18em] uppercase [text-shadow:0_1px_0_rgba(0,0,0,0.8)]">
            Ferreiro
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 border border-gold/40 text-parchment/70 hover:text-parchment hover:border-gold text-lg leading-none flex items-center justify-center shrink-0"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div
          className="relative rounded overflow-hidden border border-black/50 shadow-[0_4px_16px_rgba(0,0,0,0.5)] aspect-[2.4/1] flex items-center justify-center"
          style={{ background: 'radial-gradient(ellipse 75% 65% at 50% 60%, rgba(210,100,30,0.4) 0%, rgba(20,12,8,0.97) 60%, #0c0703 100%)' }}
        >
          <div className="absolute inset-0 animate-[forgeFlicker_4s_ease-in-out_infinite]" style={{ background: 'radial-gradient(ellipse 55% 40% at 50% 65%, rgba(255,140,50,0.3) 0%, transparent 70%)' }} />
          <IconHammer className="relative w-10 h-10 text-gold/50" />
        </div>

        <div className="flex items-start gap-3 mt-4 mb-4">
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
