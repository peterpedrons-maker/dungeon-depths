import { Character, ItemSlot } from '../types/game';
import { fmt } from '../lib/format';
import { computeKingdomBonuses } from '../lib/buildings';
import { generateItem, rarityColor } from '../lib/equipment';
import { MAX_POTIONS } from '../lib/consumables';
import { Panel } from './Panel';
import { Button } from './Button';
import { IconSword, IconChest, IconLegs, IconGloves, IconRing } from './icons';
import slotFrame from '../assets/slot-equipamento.webp';
import pocaoIcon from '../assets/pocao.webp';

const POTION_COST = 15;
const ITEM_COST = 40;
const SLOTS: ItemSlot[] = ['weapon', 'body', 'legs', 'hands', 'accessory'];
const MYSTERY_LABEL: Record<ItemSlot, string> = {
  weapon: 'Arma Misteriosa', body: 'Peitoral Misterioso', legs: 'Perneira Misteriosa',
  hands: 'Luvas Misteriosas', accessory: 'Acessório Misterioso',
};
const SLOT_ICON: Record<ItemSlot, typeof IconSword> = {
  weapon: IconSword, body: IconChest, legs: IconLegs, hands: IconGloves, accessory: IconRing,
};

interface Props {
  character: Character;
  onBuyPotion: () => void;
  onCharacterChange: (c: Character) => void;
}

export function Merchant({ character: ch, onBuyPotion, onCharacterChange }: Props) {
  const kingdomBonuses = computeKingdomBonuses(ch.buildings);

  function buyMysteryItem(slot: ItemSlot) {
    if (ch.gold < ITEM_COST) return;
    const item = generateItem(slot, ch.classId, Math.max(1, ch.bestDepth), kingdomBonuses.itemQualityBonusPct);
    onCharacterChange({ ...ch, gold: ch.gold - ITEM_COST, inventory: [...ch.inventory, item] });
  }

  return (
    <Panel title="Mercador">
      <p className="text-parchment/70 mb-4 text-sm">
        "Poções frescas, direto da destilaria, e umas peças... encontradas por aí. Nunca pergunto de onde vêm."
        — o mercador aponta para o balcão.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <ShopCard
          icon={<img src={pocaoIcon} alt="" className="w-full h-full object-contain" />}
          name="Poção de Vida"
          desc={`Recupera 40% da vida máxima em combate. Limite: ${ch.potions}/${MAX_POTIONS}.`}
          cost={POTION_COST}
          disabled={ch.gold < POTION_COST || ch.potions >= MAX_POTIONS}
          onBuy={onBuyPotion}
        />
        {SLOTS.map((slot) => {
          const Icon = SLOT_ICON[slot];
          return (
            <ShopCard
              key={slot}
              icon={<Icon className="w-full h-full text-parchment/70" />}
              frame
              name={MYSTERY_LABEL[slot]}
              desc="Item da sua classe, raridade incerta."
              cost={ITEM_COST}
              disabled={ch.gold < ITEM_COST}
              onBuy={() => buyMysteryItem(slot)}
            />
          );
        })}
      </div>

      <p className="mt-4 text-xs text-parchment/40">Você possui {fmt(ch.potions)} poção(ões) e {fmt(ch.gold)} de ouro.</p>
      {ch.equipment.weapon && (
        <p className="mt-1 text-xs">
          Arma equipada: <span style={{ color: rarityColor(ch.equipment.weapon.rarity) }}>{ch.equipment.weapon.name}</span>
        </p>
      )}
    </Panel>
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
