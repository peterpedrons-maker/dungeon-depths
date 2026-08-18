import { Character, DungeonDef } from '../types/game';
import { HUNTS } from '../lib/hunts';
import { Panel } from './Panel';
import { Button } from './Button';
import { IconLock, IconTarget } from './icons';

interface Props {
  character: Character;
  onEnterHunt: (dungeon: DungeonDef) => void;
}

// Salão da Caçada — lista os Alvos de Caçada (lib/hunts.ts): superchefes
// opcionais e repetíveis, sem pisos regulares, sempre bem mais fortes que o
// chefe de uma masmorra do mesmo nível. Mesma lógica de bloqueio por nível
// do Mapa de Masmorras (DungeonMap.tsx), só que em grade de cartas em vez de
// marcadores sobre uma imagem de região — Caçadas não têm mapa próprio.
export function HuntHall({ character, onEnterHunt }: Props) {
  return (
    <Panel title="Salão da Caçada">
      <p className="text-parchment/60 text-sm mb-4">
        Alvos de caçada são desafios opcionais — muito mais fortes que o chefe de uma masmorra comum do mesmo nível.
        Vença um e ele continua ali, pronto para ser caçado de novo.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {HUNTS.map((hunt) => {
          const locked = character.level < hunt.levelReq;
          return (
            <div
              key={hunt.id}
              className={`rounded border p-4 flex flex-col gap-2 ${locked ? 'border-panelborder/30 bg-black/20 opacity-60' : 'border-crimson/50 bg-black/25'}`}
            >
              <div className="flex items-center gap-2">
                <span className={locked ? 'text-parchment/40' : 'text-crimson'}>
                  {locked ? <IconLock className="w-5 h-5" /> : <IconTarget className="w-5 h-5" />}
                </span>
                <h3 className="font-display text-sm font-bold uppercase tracking-wide text-parchment">{hunt.name}</h3>
              </div>
              <p className="text-parchment/60 text-xs leading-relaxed flex-1">{hunt.desc}</p>
              {locked ? (
                <p className="text-xs text-parchment/40">Requer nível {hunt.levelReq}.</p>
              ) : (
                <Button className="w-full text-sm py-2" onClick={() => onEnterHunt(hunt)}>Iniciar Caçada</Button>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
