import { useState } from 'react';
import { Character, EquipmentItem } from '../types/game';
import { rarityColor, slotTintStyle } from '../lib/equipment';
import { itemDisplayName } from '../lib/enhancement';
import { ItemCompareGrid } from './ItemCompare';
import { canFitInInventory } from '../lib/inventoryGrid';
import { SmallButton } from './Button';
import { Modal } from './Modal';
import { ItemIcon as ItemIconGlyph } from './ItemIcon';
import { IconGem } from './icons';
import pergaminho from '../assets/pergaminho.webp';

interface Props {
  character: Character;
  vaultItems: EquipmentItem[];
  onDeposit: (item: EquipmentItem) => void;
  onWithdraw: (item: EquipmentItem) => void;
  onClose: () => void;
}

// One item's circular icon, same visual language as Ferreiro/Mercador's own
// local ItemIcon wrappers — no dedicated Baú art exists yet (see
// KIT-DE-ARTE.md), so this reuses the shared rarity-tinted slot frame
// instead of a bespoke icon per screen.
function ItemIcon({ item }: { item: EquipmentItem }) {
  const color = rarityColor(item.rarity);
  return (
    <div
      style={slotTintStyle(item)}
      className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center rounded-[2px] bg-[var(--slot-bg)] border border-[var(--slot-border)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)]"
    >
      <div className="w-[88%] h-[88%] flex items-center justify-center">
        <ItemIconGlyph item={item} className="w-full h-full" style={{ color }} />
      </div>
      {item.enhanceLevel > 0 && (
        <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-gold text-ink rounded-full px-1 min-w-[16px] text-center border border-black/40 shadow">
          +{item.enhanceLevel}
        </span>
      )}
    </div>
  );
}

function ItemDetailModal({ item, equippedInSlot, actionLabel, disabled, onClose, onAct }: {
  item: EquipmentItem; equippedInSlot: EquipmentItem | null; actionLabel: string; disabled?: boolean;
  onClose: () => void; onAct: (item: EquipmentItem) => void;
}) {
  return (
    <Modal onClose={onClose} bare>
      <div className="relative flex flex-col items-center gap-2 px-5 py-5 rounded-md border border-gold/30 bg-black/55 backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.6)] w-[min(94vw,420px)]">
        <button onClick={onClose} className="absolute top-2 right-2 text-parchment/50 hover:text-parchment text-lg leading-none px-1" aria-label="Fechar">×</button>
        <div className="font-bold text-base text-center" style={{ color: rarityColor(item.rarity) }}>{itemDisplayName(item)}</div>
        <ItemCompareGrid equipped={equippedInSlot} candidate={item} labels={{ left: 'Equipado', right: 'Este item' }} />
        <div className="flex gap-2 mt-2">
          <SmallButton onClick={() => onAct(item)} disabled={disabled}>{actionLabel}</SmallButton>
        </div>
        {disabled && <p className="text-[11px] text-crimson/80 italic">Mochila cheia — libere espaço antes de retirar.</p>}
      </div>
    </Modal>
  );
}

// Full-screen scene opened from the Baú's "Abrir o Baú" balloon action, same
// pattern as Ferreiro/Mercador. Two tabs instead of one grid: "Sua Mochila"
// (tap an item, then "Guardar" moves it into the account-wide vault) and
// "Baú" (tap an item, then "Retirar" moves it back into this character's
// own inventory — blocked if the bag has no free footprint for it). The
// vault itself has no cell cap and is shared across every character on the
// account (see ProfileState.vaultItems in App.tsx).
export function Bau({ character: ch, vaultItems, onDeposit, onWithdraw, onClose }: Props) {
  const [tab, setTab] = useState<'mochila' | 'bau'>('mochila');
  const [selected, setSelected] = useState<EquipmentItem | null>(null);

  const list = tab === 'mochila' ? ch.inventory : vaultItems;

  return (
    <div className="fixed inset-0 z-40 bg-nightsky overflow-y-auto flex flex-col">
      <div
        className="relative w-full shrink-0 overflow-hidden border-b-2 border-gold/40"
        style={{ backgroundImage: `url(${pergaminho})`, backgroundSize: '260px', backgroundBlendMode: 'multiply', backgroundColor: '#1c1712' }}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-panel border-2 border-gold/50 flex items-center justify-center shrink-0">
              <IconGem className="w-4 h-4 text-gold" />
            </div>
            <h2 className="font-display text-gold text-sm sm:text-base font-bold tracking-[0.12em] sm:tracking-[0.18em] uppercase">
              Baú de Armazém
            </h2>
          </div>
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
        <p className="text-xs text-parchment/60 mb-3">
          Compartilhado entre todos os seus personagens desta conta, sem limite de espaço. Toque num item pra
          guardar ou retirar.
        </p>

        <div className="flex gap-1.5 mb-3">
          <button
            onClick={() => setTab('mochila')}
            className={`flex-1 text-xs font-bold rounded px-3 py-1.5 border ${tab === 'mochila' ? 'bg-gold/25 border-gold text-gold' : 'border-panelborder/50 text-parchment/60 hover:border-gold/50'}`}
          >
            Sua Mochila ({ch.inventory.length})
          </button>
          <button
            onClick={() => setTab('bau')}
            className={`flex-1 text-xs font-bold rounded px-3 py-1.5 border ${tab === 'bau' ? 'bg-gold/25 border-gold text-gold' : 'border-panelborder/50 text-parchment/60 hover:border-gold/50'}`}
          >
            Baú ({vaultItems.length})
          </button>
        </div>

        {list.length === 0 ? (
          <p className="text-parchment/40 text-sm italic">
            {tab === 'mochila' ? 'Sua mochila está vazia.' : 'O baú está vazio.'}
          </p>
        ) : (
          <div className="rounded border border-black/50 bg-black/30 p-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
            <div className="grid grid-cols-5 gap-2.5">
              {list.map((item) => (
                <button key={item.id} onClick={() => setSelected(item)} title={itemDisplayName(item)} className="transition-transform duration-150 hover:scale-105">
                  <ItemIcon item={item} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {selected && tab === 'mochila' && (
        <ItemDetailModal
          item={selected}
          equippedInSlot={ch.equipment[selected.slot] ?? null}
          actionLabel="Guardar no Baú"
          onClose={() => setSelected(null)}
          onAct={(item) => { onDeposit(item); setSelected(null); }}
        />
      )}
      {selected && tab === 'bau' && (
        <ItemDetailModal
          item={selected}
          equippedInSlot={ch.equipment[selected.slot] ?? null}
          actionLabel="Retirar para a Mochila"
          disabled={!canFitInInventory(ch.inventory, selected.slot)}
          onClose={() => setSelected(null)}
          onAct={(item) => { onWithdraw(item); setSelected(null); }}
        />
      )}
    </div>
  );
}
