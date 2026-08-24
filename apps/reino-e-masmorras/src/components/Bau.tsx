import { useState } from 'react';
import { Character, EquipmentItem, Rarity } from '../types/game';
import { RuneShelf } from './RuneShelf';
import { rarityColor, slotTintStyle } from '../lib/equipment';
import { fmtItemPct, itemDisplayName, itemStatLines } from '../lib/enhancement';
import { GRID_COLS, GRID_ROWS, SLOT_FOOTPRINT, repackInventory } from '../lib/inventoryGrid';
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
  onSellRunes: (rarity: Rarity, tier: number, count: number) => void;
  onClose: () => void;
}

function statLineText(line: ReturnType<typeof itemStatLines>[number]): string {
  const value = line.isPct ? `${fmtItemPct(line.value)}%` : line.value;
  return `+${value} ${line.label}`;
}

function ItemDetailModal({ item, actionLabel, disabled, isEquipped, onClose, onAct }: {
  item: EquipmentItem; actionLabel: string; disabled?: boolean; isEquipped: boolean;
  onClose: () => void; onAct: (item: EquipmentItem) => void;
}) {
  // Confirming the action here (as opposed to depositing/withdrawing on the
  // first tap) only exists as a second step when the item is equipped — the
  // player needs to know they're about to unequip something before it's
  // whisked into the Baú.
  const [confirmingEquipped, setConfirmingEquipped] = useState(false);
  const lines = itemStatLines(item, null);

  return (
    <Modal onClose={onClose} bare>
      <div className="relative flex flex-col items-center gap-2 px-5 py-5 rounded-md border border-gold/30 bg-black/55 backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.6)] w-[min(94vw,360px)]">
        <button onClick={onClose} className="absolute top-2 right-2 text-parchment/50 hover:text-parchment text-lg leading-none px-1" aria-label="Fechar">×</button>
        <div className="font-bold text-base text-center" style={{ color: rarityColor(item.rarity) }}>{itemDisplayName(item)}</div>
        {isEquipped && (
          <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-600 text-white rounded-full px-2 py-0.5">Equipado</span>
        )}
        <ul className="w-full text-sm text-parchment/80 space-y-1 my-1">
          {lines.map((l, i) => <li key={i}>{statLineText(l)}</li>)}
        </ul>
        {confirmingEquipped ? (
          <div className="w-full text-center">
            <p className="text-xs text-crimson/90 mb-2">Este item está equipado — guardar vai desequipá-lo. Confirma?</p>
            <div className="flex gap-2 justify-center">
              <SmallButton onClick={() => setConfirmingEquipped(false)} variant="ghost">Cancelar</SmallButton>
              <SmallButton onClick={() => onAct(item)}>Confirmar</SmallButton>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 mt-2">
            <SmallButton onClick={() => (isEquipped ? setConfirmingEquipped(true) : onAct(item))} disabled={disabled}>
              {actionLabel}
            </SmallButton>
          </div>
        )}
        {disabled && <p className="text-[11px] text-crimson/80 italic">Mochila cheia — libere espaço antes de retirar.</p>}
      </div>
    </Modal>
  );
}

// A read-only grid of item slots sharing the exact visual language of
// CharacterOverview's own inventory grid (faint gridlines behind, each item
// snapped into a footprint-sized bordered cell) instead of a loose wrapped
// row of icons — "células prontinhas, igual o inventário" was the ask.
// `items` is repacked fresh on every render (see repackInventory) purely
// for DISPLAY purposes — this never touches gridX/gridY on the actual
// stored character/vault data, so it's safe to call on the vault's flat
// list (which has no persisted positions) and on a temporary "mochila +
// equipados" merge alike.
function ItemGrid({ items, equippedIds, onSelect }: { items: EquipmentItem[]; equippedIds: Set<string>; onSelect: (item: EquipmentItem) => void }) {
  const packed = repackInventory(items, GRID_COLS);
  const gridRows = Math.max(GRID_ROWS, ...packed.map((i) => (i.gridY ?? 0) + SLOT_FOOTPRINT[i.slot].h));
  return (
    <div className="rounded border border-black/50 bg-black/25 p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
      <div
        className="relative w-full bg-[rgba(0,0,0,0.45)] rounded-sm overflow-hidden"
        style={{
          aspectRatio: `${GRID_COLS} / ${gridRows}`,
          backgroundImage:
            'linear-gradient(to right, rgba(122,90,52,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(122,90,52,0.35) 1px, transparent 1px)',
          backgroundSize: `${100 / GRID_COLS}% ${100 / gridRows}%`,
        }}
      >
        {packed.map((item) => {
          const { w, h } = SLOT_FOOTPRINT[item.slot];
          const x = item.gridX ?? 0;
          const y = item.gridY ?? 0;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              title={itemDisplayName(item)}
              className="absolute flex items-center justify-center rounded-[2px] bg-[var(--slot-bg)] border border-[var(--slot-border)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)] transition-[background-color,border-color] duration-150 hover:bg-[var(--slot-bg-hover)] hover:border-[var(--slot-border-hover)]"
              style={{
                ...slotTintStyle(item),
                left: `${(x / GRID_COLS) * 100}%`,
                top: `${(y / gridRows) * 100}%`,
                width: `${(w / GRID_COLS) * 100}%`,
                height: `${(h / gridRows) * 100}%`,
              }}
            >
              <ItemIconGlyph item={item} className="relative w-[80%] h-[80%]" style={{ color: rarityColor(item.rarity) }} />
              {item.enhanceLevel > 0 && (
                <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-gold text-ink rounded-full px-1 min-w-[16px] text-center border border-black/40 shadow">
                  +{item.enhanceLevel}
                </span>
              )}
              {equippedIds.has(item.id) && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-bold uppercase tracking-wide bg-emerald-600 text-white rounded-full px-1 py-px border border-black/40 shadow whitespace-nowrap">
                  Equipado
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Full-screen scene opened from the Baú's "Abrir o Baú" balloon action, same
// pattern as Ferreiro/Mercador. Two tabs: "Sua Mochila" (inventory AND every
// currently-equipped item, tagged "Equipado" — tap one, then "Guardar" moves
// it into the account-wide vault, confirming first if it's equipped since
// that also unequips it) and "Baú" (tap an item, then "Retirar" moves it
// back into this character's own inventory — blocked if the bag has no free
// footprint for it). The vault itself has no cell cap and is shared across
// every character on the account (see ProfileState.vaultItems in App.tsx).
export function Bau({ character: ch, vaultItems, onDeposit, onWithdraw, onSellRunes, onClose }: Props) {
  const [tab, setTab] = useState<'mochila' | 'bau'>('mochila');
  const [selected, setSelected] = useState<EquipmentItem | null>(null);

  const equippedItems = Object.values(ch.equipment).filter((i): i is EquipmentItem => i !== null);
  const equippedIds = new Set(equippedItems.map((i) => i.id));
  const mochilaItems = [...equippedItems, ...ch.inventory];
  const list = tab === 'mochila' ? mochilaItems : vaultItems;

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

        <RuneShelf runes={ch.runes} onSell={onSellRunes} />

        <div className="flex gap-1.5 mb-3">
          <button
            onClick={() => setTab('mochila')}
            className={`flex-1 text-xs font-bold rounded px-3 py-1.5 border ${tab === 'mochila' ? 'bg-gold/25 border-gold text-gold' : 'border-panelborder/50 text-parchment/60 hover:border-gold/50'}`}
          >
            Sua Mochila ({mochilaItems.length})
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
          <ItemGrid items={list} equippedIds={tab === 'mochila' ? equippedIds : new Set()} onSelect={setSelected} />
        )}
      </div>

      {selected && tab === 'mochila' && (
        <ItemDetailModal
          item={selected}
          isEquipped={equippedIds.has(selected.id)}
          actionLabel="Guardar no Baú"
          onClose={() => setSelected(null)}
          onAct={(item) => { onDeposit(item); setSelected(null); }}
        />
      )}
      {selected && tab === 'bau' && (
        <ItemDetailModal
          item={selected}
          isEquipped={false}
          actionLabel="Retirar para a Mochila"
          disabled={!canFitInInventory(ch.inventory, selected.slot)}
          onClose={() => setSelected(null)}
          onAct={(item) => { onWithdraw(item); setSelected(null); }}
        />
      )}
    </div>
  );
}
