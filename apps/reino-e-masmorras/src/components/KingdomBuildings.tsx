import { Character } from '../types/game';
import { fmt } from '../lib/format';
import { BUILDINGS } from '../lib/buildings';
import { Panel } from './Panel';
import { Button } from './Button';

interface Props {
  character: Character;
  onUpgrade: (buildingId: string) => void;
}

export function KingdomBuildings({ character: ch, onUpgrade }: Props) {
  return (
    <Panel title="Reino — Construções">
      <p className="text-parchment/70 mb-4">
        Invista seu ouro em melhorias permanentes que continuam valendo em toda expedição futura.
      </p>
      <div className="space-y-3">
        {BUILDINGS.map((b) => {
          const level = ch.buildings[b.id] ?? 0;
          const maxed = level >= b.maxLevel;
          const cost = maxed ? 0 : b.costForLevel(level);
          return (
            <div key={b.id} className="bg-panel2 border border-panelborder rounded px-4 py-3">
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="font-bold text-parchment">{b.name}</div>
                <span className="text-xs bg-gold/20 border border-gold/50 text-gold rounded-full px-3 py-1 font-bold shrink-0">
                  Nível {level}/{b.maxLevel}
                </span>
              </div>
              <p className="text-xs text-parchment/50 mb-2">{b.desc}</p>
              {level > 0 && <p className="text-xs text-emerald-400 mb-2">Efeito atual: {b.effectLabel(level)}</p>}
              <Button onClick={() => onUpgrade(b.id)} disabled={maxed || ch.gold < cost} className="w-full sm:w-auto">
                {maxed ? 'Nível Máximo' : `Melhorar — ${fmt(cost)} ouro`}
              </Button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
