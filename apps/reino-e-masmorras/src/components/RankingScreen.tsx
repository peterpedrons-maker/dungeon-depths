import { RankEntry } from '../types/game';
import { CLASSES } from '../lib/classes';
import { Panel } from './Panel';

export function RankingScreen({ ranking }: { ranking: RankEntry[] }) {
  return (
    <Panel title="Ranking do Reino">
      {ranking.length === 0 ? (
        <p className="text-parchment/50 text-center py-4">Nenhuma expedição registrada ainda.</p>
      ) : (
        <ol className="text-sm">
          {ranking.map((r, i) => (
            <li key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
              <span className="flex items-center gap-2">
                <span className="text-parchment/40 w-5">{i + 1}.</span>
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: CLASSES[r.classId].color }} />
                <span className="text-parchment">{r.name}</span>
                <span className="text-parchment/40 text-xs">Nv.{r.level}</span>
              </span>
              <span className="text-gold font-bold">Prof. {r.depth}</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
