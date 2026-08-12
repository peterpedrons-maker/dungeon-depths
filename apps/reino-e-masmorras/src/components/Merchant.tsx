import { Character } from '../types/game';
import { fmt } from '../lib/format';
import { Panel } from './Panel';

const POTION_COST = 15;

interface Props {
  character: Character;
  onBuyPotion: () => void;
}

export function Merchant({ character: ch, onBuyPotion }: Props) {
  return (
    <Panel title="Mercador">
      <p className="text-parchment/70 mb-4">
        "Poções de vida frescas, direto da destilaria. Nunca sabe quando vai precisar
        lá embaixo." — o mercador aponta para o balcão.
      </p>
      <div className="flex items-center justify-between bg-panel2 border border-panelborder rounded px-4 py-3">
        <div>
          <div className="font-bold text-parchment">Poção de Vida</div>
          <div className="text-xs text-parchment/50">Recupera 40% da vida máxima em combate.</div>
        </div>
        <button
          onClick={onBuyPotion}
          disabled={ch.gold < POTION_COST}
          className="px-4 py-2 bg-emerald-800 rounded font-bold disabled:opacity-40 hover:brightness-110 shrink-0"
        >
          Comprar — {fmt(POTION_COST)} ouro
        </button>
      </div>
      <p className="mt-3 text-xs text-parchment/40">Você possui {fmt(ch.potions)} poção(ões) e {fmt(ch.gold)} de ouro.</p>
    </Panel>
  );
}
