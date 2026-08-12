import { RankEntry } from '../types/game';
import { CLASSES } from '../lib/classes';
import { Panel } from './Panel';
import { IconTrophy } from './icons';

const MEDAL_COLOR = ['#e0b93c', '#c9c9d4', '#c98a55'];

export function RankingScreen({ ranking }: { ranking: RankEntry[] }) {
  return (
    <Panel title="Ranking do Reino">
      {ranking.length === 0 ? (
        <div className="flex flex-col items-center text-center py-10 gap-3">
          <IconTrophy className="w-12 h-12 text-parchment/20" />
          <p className="text-parchment/50">Nenhuma expedição registrada ainda.</p>
          <p className="text-parchment/30 text-xs max-w-xs">Complete uma masmorra (ou recue em segurança) pra aparecer aqui com sua maior profundidade alcançada.</p>
        </div>
      ) : (
        <ol className="space-y-1.5">
          {ranking.map((r, i) => (
            <li
              key={i}
              className={`flex justify-between items-center gap-2 py-2 px-3 rounded border ${
                i < 3 ? 'border-gold/30 bg-gold/5' : 'border-transparent'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: i < 3 ? MEDAL_COLOR[i] : 'transparent', color: i < 3 ? '#1a1208' : undefined }}
                >
                  <span className={i < 3 ? '' : 'text-parchment/40'}>{i + 1}</span>
                </span>
                <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: CLASSES[r.classId].color }} />
                <span className="text-parchment truncate">{r.name}</span>
                <span className="text-parchment/40 text-xs shrink-0">Nv.{r.level}</span>
              </span>
              <span className="text-gold font-bold shrink-0">Prof. {r.depth}</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
