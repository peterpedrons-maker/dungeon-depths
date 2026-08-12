import { Character } from '../types/game';
import { fmt } from '../lib/format';
import { generateWeapon, rarityColor } from '../lib/equipment';
import { Panel } from './Panel';
import { Button } from './Button';

const POTION_COST = 15;
const WEAPON_COST = 40;

interface Props {
  character: Character;
  onBuyPotion: () => void;
  onCharacterChange: (c: Character) => void;
}

export function Merchant({ character: ch, onBuyPotion, onCharacterChange }: Props) {
  function buyMysteryWeapon() {
    if (ch.gold < WEAPON_COST) return;
    const weapon = generateWeapon(ch.classId, Math.max(1, ch.bestDepth));
    onCharacterChange({ ...ch, gold: ch.gold - WEAPON_COST, inventory: [...ch.inventory, weapon] });
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
        <Button variant="neutro" onClick={onBuyPotion} disabled={ch.gold < POTION_COST} className="shrink-0">
          Comprar — {fmt(POTION_COST)} ouro
        </Button>
      </div>

      <div className="flex items-center justify-between bg-panel2 border border-panelborder rounded px-4 py-3">
        <div>
          <div className="font-bold text-parchment">Arma Misteriosa</div>
          <div className="text-xs text-parchment/50">Uma arma da sua classe, de raridade incerta. Pode valer a pena arriscar.</div>
        </div>
        <Button variant="dourado" onClick={buyMysteryWeapon} disabled={ch.gold < WEAPON_COST} className="shrink-0">
          Comprar — {fmt(WEAPON_COST)} ouro
        </Button>
      </div>

      <p className="mt-3 text-xs text-parchment/40">Você possui {fmt(ch.potions)} poção(ões) e {fmt(ch.gold)} de ouro.</p>
      {ch.equipment.weapon && (
        <p className="mt-1 text-xs">
          Equipado: <span style={{ color: rarityColor(ch.equipment.weapon.rarity) }}>{ch.equipment.weapon.name}</span>
        </p>
      )}
    </Panel>
  );
}
