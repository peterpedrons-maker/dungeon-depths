import { useState } from 'react';
import { Character, EquipmentItem } from '../types/game';
import { fmt } from '../lib/format';
import { computeKingdomBonuses } from '../lib/buildings';
import { rarityColor } from '../lib/equipment';
import { itemDisplayName, primaryStatLines, secondaryStatLabel } from '../lib/enhancement';
import { priceForStockItem, STOCK_COLS, STOCK_ROWS } from '../lib/merchantStock';
import { canFitInInventory, placeInInventory, SLOT_FOOTPRINT } from '../lib/inventoryGrid';
import { MAX_POTIONS } from '../lib/consumables';
import { playBuySellSfx } from '../lib/audio';
import { Button, SmallButton } from './Button';
import { Modal } from './Modal';
import { ItemIcon } from './ItemIcon';
import { IconCoin } from './icons';
import pergaminho from '../assets/pergaminho.webp';
import pocaoIcon from '../assets/pocao.webp';
import mercadorCena from '../assets/mercador-cena.webp';

const POTION_BASE_COST = 15;

interface Props {
  character: Character;
  onBuyPotion: () => void;
  onCharacterChange: (c: Character) => void;
  onClose: () => void;
}

// Full-screen scene opened from the Mercador building's "Conversar com o
// Mercador" balloon action, same pattern as the Ferreiro scene. The stock
// grid reads like the player's own inventory (same footprint/packing rules,
// same item card on click) instead of the old "pick a slot, get something
// random" mystery cards — real items sitting in the shop that the player
// can see and choose between, closer to a PoE vendor tab. Stock only
// re-rolls when a dungeon run ends in victory or death (see
// GameShell.handleRunEnd) — opening/closing this screen never changes it,
// so there's no free re-roll by walking in and out.
export function Mercador({ character: ch, onBuyPotion, onCharacterChange, onClose }: Props) {
  const [selected, setSelected] = useState<EquipmentItem | null>(null);
  const kingdomBonuses = computeKingdomBonuses(ch.buildings);
  const discount = kingdomBonuses.merchantDiscountPct;
  const potionCost = Math.max(1, Math.round(POTION_BASE_COST * (1 - discount)));

  function buyStockItem(item: EquipmentItem) {
    const price = priceForStockItem(item, discount);
    if (ch.gold < price || !canFitInInventory(ch.inventory, item.slot)) return;
    onCharacterChange({
      ...ch,
      gold: ch.gold - price,
      merchantStock: ch.merchantStock.filter((i) => i.id !== item.id),
      inventory: placeInInventory(ch.inventory, { ...item, identified: true }),
    });
    playBuySellSfx();
    setSelected(null);
  }

  return (
    <div className="fixed inset-0 z-40 bg-nightsky overflow-y-auto flex flex-col">
      <div className="relative w-full shrink-0 overflow-hidden" style={{ height: '44vh', minHeight: 260 }}>
        <img
          src={mercadorCena}
          alt="O Mercador em sua barraca"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ imageRendering: 'pixelated' }}
          draggable={false}
        />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="absolute top-3 inset-x-3 flex items-center justify-between">
          <h2 className="font-display text-gold text-sm sm:text-base font-bold tracking-[0.12em] sm:tracking-[0.18em] uppercase [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
            Mercador
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
            <IconCoin className="w-5 h-5 text-gold" />
          </div>
          <div
            className="relative bg-panel border-2 border-gold/40 rounded-sm px-4 py-3 text-sm text-parchment/90 shadow-[0_6px_16px_rgba(0,0,0,0.5)]"
            style={{ backgroundImage: `url(${pergaminho})`, backgroundSize: '200px', backgroundBlendMode: 'multiply' }}
          >
            <span className="absolute -left-[7px] top-4 w-3 h-3 bg-panel border-l-2 border-b-2 border-gold/40 rotate-45" />
            "Poções frescas, direto da destilaria, e umas peças... encontradas por aí. Nunca pergunto de onde vêm."
          </div>
        </div>

        <div className="rounded border border-panelborder/60 bg-panel2/40 p-3 flex items-center gap-3 mb-4">
          <img src={pocaoIcon} alt="" className="w-10 h-11 object-contain shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xs text-parchment leading-tight">Poção de Vida</div>
            <div className="text-[10px] text-parchment/50 leading-snug">
              Recupera 40% da vida máxima em combate. Limite: {ch.potions}/{MAX_POTIONS}.
            </div>
          </div>
          <Button onClick={onBuyPotion} disabled={ch.gold < potionCost || ch.potions >= MAX_POTIONS} className="!min-w-0 !px-3 !py-2 text-xs shrink-0">
            {fmt(potionCost)} ouro
          </Button>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-parchment/60">Itens à venda</span>
          <span className="text-[10px] text-gold/80 font-bold">{ch.merchantStock.length} disponíve{ch.merchantStock.length === 1 ? 'l' : 'is'}</span>
        </div>

        {ch.merchantStock.length === 0 ? (
          <p className="text-parchment/40 text-sm italic">
            Sem itens no estoque agora. Termine ou sobreviva a uma expedição pra o Mercador reabastecer.
          </p>
        ) : (
          <div className="rounded border border-black/50 bg-black/25 p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
            <div
              className="relative w-full bg-[rgba(0,0,0,0.45)] rounded-sm overflow-hidden"
              style={{
                aspectRatio: `${STOCK_COLS} / ${STOCK_ROWS}`,
                backgroundImage:
                  'linear-gradient(to right, rgba(122,90,52,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(122,90,52,0.35) 1px, transparent 1px)',
                backgroundSize: `${100 / STOCK_COLS}% ${100 / STOCK_ROWS}%`,
              }}
            >
              {ch.merchantStock.map((item) => {
                const identified = item.identified !== false;
                const color = identified ? rarityColor(item.rarity) : '#8a8078';
                const { w, h } = SLOT_FOOTPRINT[item.slot];
                const x = item.gridX ?? 0;
                const y = item.gridY ?? 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className="absolute flex items-center justify-center rounded-[2px] bg-[rgba(96,148,210,0.09)] border border-[rgba(96,148,210,0.4)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)] transition-[background-color,border-color] duration-150 hover:bg-[rgba(96,148,210,0.17)] hover:border-[rgba(96,148,210,0.65)]"
                    style={{
                      left: `${(x / STOCK_COLS) * 100}%`,
                      top: `${(y / STOCK_ROWS) * 100}%`,
                      width: `${(w / STOCK_COLS) * 100}%`,
                      height: `${(h / STOCK_ROWS) * 100}%`,
                      containerType: 'size',
                    }}
                  >
                    {identified ? (
                      <ItemIcon item={item} className="relative w-[97%] h-[97%]" style={{ color }} />
                    ) : (
                      <span className="text-2xl font-display text-parchment/40">?</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-parchment/40">Você possui {fmt(ch.potions)} poção(ões) e {fmt(ch.gold)} de ouro.</p>
        {ch.equipment.weapon && (
          <p className="mt-1 text-xs">
            Arma equipada: <span style={{ color: rarityColor(ch.equipment.weapon.rarity) }}>{itemDisplayName(ch.equipment.weapon)}</span>
          </p>
        )}
      </div>

      {selected && (
        <StockItemModal
          item={selected}
          price={priceForStockItem(selected, discount)}
          disabled={ch.gold < priceForStockItem(selected, discount) || !canFitInInventory(ch.inventory, selected.slot)}
          onClose={() => setSelected(null)}
          onBuy={buyStockItem}
        />
      )}
    </div>
  );
}

function StockItemModal({ item, price, disabled, onClose, onBuy }: {
  item: EquipmentItem; price: number; disabled: boolean; onClose: () => void; onBuy: (item: EquipmentItem) => void;
}) {
  const identified = item.identified !== false;
  const color = identified ? rarityColor(item.rarity) : '#8a8078';
  const primaryLines = identified ? primaryStatLines(item) : [];

  return (
    <Modal onClose={onClose} bare>
      <div className="relative w-64 flex flex-col items-center gap-2 px-5 py-5 rounded-md border border-gold/30 bg-black/55 backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-parchment/50 hover:text-parchment text-lg leading-none px-1"
          aria-label="Fechar"
        >
          ×
        </button>

        <div className="font-bold text-base text-center" style={{ color }}>
          {identified ? itemDisplayName(item) : 'Item Misterioso'}
        </div>

        <div className="w-24 h-24 rounded-[2px] bg-[rgba(96,148,210,0.09)] border border-[rgba(96,148,210,0.4)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)] flex items-center justify-center shrink-0">
          {identified ? (
            <ItemIcon item={item} className="w-[88%] h-[88%]" style={{ color }} />
          ) : (
            <span className="text-4xl font-display text-parchment/40">?</span>
          )}
        </div>

        {identified ? (
          <div className="flex flex-col items-center gap-0.5">
            {primaryLines.map((line) => <div key={line} className="text-sm text-parchment/90">{line}</div>)}
            {item.secondaryStat && <div className="text-sm text-sky-300">{secondaryStatLabel(item)}</div>}
          </div>
        ) : (
          <p className="text-xs text-parchment/50 italic text-center">A identidade só é revelada depois da compra.</p>
        )}

        <div className="flex gap-2 mt-2">
          <SmallButton onClick={() => onBuy(item)} disabled={disabled}>Comprar ({fmt(price)} ouro)</SmallButton>
        </div>
      </div>
    </Modal>
  );
}
