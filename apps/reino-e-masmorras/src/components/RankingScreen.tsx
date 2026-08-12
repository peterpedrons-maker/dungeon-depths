import { RankEntry } from '../types/game';
import { CLASSES } from '../lib/classes';

interface Props {
  ranking: RankEntry[];
  onBack: () => void;
}

export function RankingScreen({ ranking, onBack }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <h2 className="text-3xl text-gold font-bold">Ranking do Reino</h2>

      <div className="w-full max-w-md bg-black/25 border border-white/10 rounded p-4">
        {ranking.length === 0 ? (
          <p className="text-parchment/50 text-center py-4">Nenhuma expedição registrada ainda.</p>
        ) : (
          <ol className="text-sm">
            {ranking.map((r, i) => (
              <li key={i} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                <span className="flex items-center gap-2">
                  <span className="text-parchment/40 w-5">{i + 1}.</span>
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: CLASSES[r.classId].color }} />
                  <span>{r.name}</span>
                  <span className="text-parchment/40 text-xs">Nv.{r.level}</span>
                </span>
                <span className="text-gold font-bold">Prof. {r.depth}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <button onClick={onBack} className="px-4 py-2 bg-neutral-700 rounded hover:brightness-110">Voltar</button>
    </div>
  );
}
