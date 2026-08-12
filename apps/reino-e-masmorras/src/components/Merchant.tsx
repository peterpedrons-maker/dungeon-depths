import { Character, ItemSlot } from '../types/game';
import { fmt } from '../lib/format';
import { computeKingdomBonuses } from '../lib/buildings';
import { generateItem, rarityColor } from '../lib/equipment';
import { Panel } from './Panel';
import { Button } from './Button';

const POTION_COST = 15;
const ITEM_COST = 40;
const SLOTS: ItemSlot[] = ['weapon', 'body', 'legs', 'hands', 'accessory'];
const MYSTERY_LABEL: Record<ItemSlot, string> = {
  weapon: 'Arma Misteriosa', body: 'Peitoral Misterioso', legs: 'Perneira Misteriosa',
  hands: 'Luvas Misteriosas', accessory: 'Acessório Misterioso',
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
      <p className="text-parchment/70 mb-4">
        "Poções frescas, direto da destilaria, e umas peças... encontradas por aí. Nunca pergunto de onde vêm."
        — o mercador aponta para o balcão.
      </p>

      <div className="flex items-center justify-between bg-panel2 border border-panelborder rounded px-4 py-3 mb-3">
        <div>
          <div className="font-bold text-parchment">Poção de Vida</div>
          <div className="text-xs text-parchment/50">Recupera 40% da vida máxima em combate.</div>
        </div>
        <Button onClick={onBuyPotion} disabled={ch.gold < POTION_COST} className="shrink-0">
          Comprar — {fmt(POTION_COST)} ouro
        </Button>
      </div>

      <div className="space-y-2">
        {SLOTS.map((slot) => (
          <div key={slot} className="flex items-center justify-between bg-panel2 border border-panelborder rounded px-4 py-3">
            <div>
              <div className="font-bold text-parchment">{MYSTERY_LABEL[slot]}</div>
              <div className="text-xs text-parchment/50">Um item da sua classe, de raridade incerta. Pode valer a pena arriscar.</div>
            </div>
            <Button onClick={() => buyMysteryItem(slot)} disabled={ch.gold < ITEM_COST} className="shrink-0">
              Comprar — {fmt(ITEM_COST)} ouro
            </Button>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-parchment/40">Você possui {fmt(ch.potions)} poção(ões) e {fmt(ch.gold)} de ouro.</p>
      {ch.equipment.weapon && (
        <p className="mt-1 text-xs">
          Arma equipada: <span style={{ color: rarityColor(ch.equipment.weapon.rarity) }}>{ch.equipment.weapon.name}</span>
        </p>
      )}
    </Panel>
  );
}
