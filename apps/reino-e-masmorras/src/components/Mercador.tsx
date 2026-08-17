import { Character, ItemSlot } from '../types/game';
import { fmt } from '../lib/format';
import { computeKingdomBonuses } from '../lib/buildings';
import { generateItem, rarityColor } from '../lib/equipment';
import { itemDisplayName } from '../lib/enhancement';
import { highestAccessibleItemTier } from '../lib/dungeons';
import { OFFHAND_KIND } from '../lib/itemTiers';
import { MAX_POTIONS } from '../lib/consumables';
import { canFitInInventory, placeInInventory } from '../lib/inventoryGrid';
import { Button } from './Button';
import { IconSword, IconChest, IconLegs, IconGloves, IconShield, IconRing, IconCoin } from './icons';
import pergaminho from '../assets/pergaminho.webp';
import slotFrame from '../assets/slot-equipamento.webp';
import pocaoIcon from '../assets/pocao.webp';

const POTION_BASE_COST = 15;
const ITEM_BASE_COST = 40;
const SLOTS: ItemSlot[] = ['weapon', 'body', 'legs', 'hands', 'offhand', 'accessory'];
const MYSTERY_LABEL: Record<ItemSlot, string> = {
  weapon: 'Arma Misteriosa', body: 'Peitoral Misterioso', legs: 'Perneira Misteriosa',
  hands: 'Luvas Misteriosas', offhand: 'Item Misterioso', accessory: 'Acessório Misterioso',
};
const SLOT_ICON: Record<ItemSlot, typeof IconSword> = {
  weapon: IconSword, body: IconChest, legs: IconLegs, hands: IconGloves, offhand: IconShield, accessory: IconRing,
};

interface Props {
  character: Character;
  onBuyPotion: () => void;
  onCharacterChange: (c: Character) => void;
  onClose: () => void;
}

// Full-screen scene opened from the Mercador building's "Conversar com o
// Mercador" balloon action, same pattern as the Ferreiro scene — the shop
// used to be its own sidebar section, but now lives at the building marker
// like every other NPC. No dedicated banner art yet (see KIT-DE-ARTE.md's
// "Cena do Mercador" prompt), so the banner is a plain gradient placeholder
// until that lands, rather than blocking the feature on it.
export function Mercador({ character: ch, onBuyPotion, onCharacterChange, onClose }: Props) {
  const kingdomBonuses = computeKingdomBonuses(ch.buildings);
  const discount = kingdomBonuses.merchantDiscountPct;
  const potionCost = Math.max(1, Math.round(POTION_BASE_COST * (1 - discount)));
  const itemCost = Math.max(1, Math.round(ITEM_BASE_COST * (1 - discount)));
  const offhandKind = OFFHAND_KIND[ch.classId];
  const shopSlots = offhandKind ? SLOTS : SLOTS.filter((s) => s !== 'offhand');
  const offhandLabel = offhandKind === 'shield' ? 'Escudo Misterioso' : 'Relicário Misterioso';

  function buyMysteryItem(slot: ItemSlot) {
    if (ch.gold < itemCost || !canFitInInventory(ch.inventory, slot)) return;
    const item = generateItem(slot, ch.classId, highestAccessibleItemTier(ch.level), kingdomBonuses.itemQualityBonusPct);
    onCharacterChange({ ...ch, gold: ch.gold - itemCost, inventory: placeInInventory(ch.inventory, item) });
  }

  return (
    <div className="fixed inset-0 z-40 bg-nightsky overflow-y-auto flex flex-col">
      <div
        className="relative w-full shrink-0 overflow-hidden bg-gradient-to-b from-[#2b2140] to-[#120d1e] flex items-center justify-center"
        style={{ height: '44vh', minHeight: 260 }}
      >
        <IconCoin className="w-24 h-24 text-gold/25" />
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

        <div className="grid grid-cols-2 gap-3">
          <ShopCard
            icon={<img src={pocaoIcon} alt="" className="w-full h-full object-contain" />}
            name="Poção de Vida"
            desc={`Recupera 40% da vida máxima em combate. Limite: ${ch.potions}/${MAX_POTIONS}.`}
            cost={potionCost}
            disabled={ch.gold < potionCost || ch.potions >= MAX_POTIONS}
            onBuy={onBuyPotion}
          />
          {shopSlots.map((slot) => {
            const Icon = SLOT_ICON[slot];
            const full = !canFitInInventory(ch.inventory, slot);
            return (
              <ShopCard
                key={slot}
                icon={<Icon className="w-full h-full text-parchment/70" />}
                frame
                name={slot === 'offhand' ? offhandLabel : MYSTERY_LABEL[slot]}
                desc={full ? 'Inventário cheio — abra espaço pra comprar.' : 'Item da sua classe, raridade incerta.'}
                cost={itemCost}
                disabled={ch.gold < itemCost || full}
                onBuy={() => buyMysteryItem(slot)}
              />
            );
          })}
        </div>

        <p className="mt-4 text-xs text-parchment/40">Você possui {fmt(ch.potions)} poção(ões) e {fmt(ch.gold)} de ouro.</p>
        {ch.equipment.weapon && (
          <p className="mt-1 text-xs">
            Arma equipada: <span style={{ color: rarityColor(ch.equipment.weapon.rarity) }}>{itemDisplayName(ch.equipment.weapon)}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function ShopCard({ icon, frame, name, desc, cost, disabled, onBuy }: {
  icon: React.ReactNode; frame?: boolean; name: string; desc: string; cost: number; disabled: boolean; onBuy: () => void;
}) {
  return (
    <div className="rounded border border-panelborder/60 bg-panel2/40 p-3 flex flex-col items-center text-center gap-1.5">
      <div className="relative w-14 h-14">
        <div className="absolute inset-[17%] flex items-center justify-center">{icon}</div>
        {frame && <img src={slotFrame} alt="" className="absolute inset-0 w-full h-full pointer-events-none select-none" draggable={false} />}
      </div>
      <div className="font-bold text-xs text-parchment leading-tight">{name}</div>
      <div className="text-[10px] text-parchment/50 leading-snug">{desc}</div>
      <Button onClick={onBuy} disabled={disabled} className="w-full !min-w-0 !px-2 !py-2 text-xs mt-1">
        {fmt(cost)} ouro
      </Button>
    </div>
  );
}
