import { Character } from '../types/game';
import { TITLES, unlockedTitles } from '../lib/titles';
import { Panel } from './Panel';
import { SmallButton } from './Button';
import { IconRibbon, IconLock } from './icons';

interface Props {
  character: Character;
  onEquip: (id: string | null) => void;
}

export function Titulos({ character, onEquip }: Props) {
  const earnedIds = new Set(unlockedTitles(character).map((t) => t.id));

  return (
    <Panel title="Títulos">
      <p className="text-parchment/60 text-sm mb-1">
        Conquistas do seu herói — equipe uma para exibir ao lado do nome.
      </p>
      <p className="text-gold/80 text-xs font-bold mb-4">{earnedIds.size}/{TITLES.length} conquistados</p>

      {character.equippedTitle && (
        <div className="mb-4">
          <SmallButton onClick={() => onEquip(null)} variant="ghost">Remover título equipado</SmallButton>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {TITLES.map((t) => {
          const earned = earnedIds.has(t.id);
          const equipped = character.equippedTitle === t.id;
          return (
            <div
              key={t.id}
              className={`rounded border p-3 flex items-center gap-3 ${
                equipped ? 'border-gold bg-gold/10' : earned ? 'border-panelborder/40 bg-black/20' : 'border-panelborder/20 bg-black/10 opacity-60'
              }`}
            >
              <span className={earned ? 'text-gold' : 'text-parchment/30'}>
                {earned ? <IconRibbon className="w-6 h-6" /> : <IconLock className="w-6 h-6" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold leading-tight ${earned ? 'text-parchment' : 'text-parchment/40'}`}>{t.name}</p>
                <p className="text-[11px] text-parchment/50 leading-snug mt-0.5">{t.desc}</p>
              </div>
              {earned && (
                <SmallButton onClick={() => onEquip(t.id)} disabled={equipped} variant={equipped ? 'solid' : 'ghost'}>
                  {equipped ? 'Equipado' : 'Equipar'}
                </SmallButton>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
