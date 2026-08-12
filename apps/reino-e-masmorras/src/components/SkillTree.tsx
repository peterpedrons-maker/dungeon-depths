import { Character } from '../types/game';
import { SKILL_TREES, canUnlock, unlockedCountInPath } from '../lib/skills';
import { Panel } from './Panel';

interface Props {
  character: Character;
  onUnlock: (nodeId: string) => void;
}

export function SkillTree({ character: ch, onUnlock }: Props) {
  const paths = SKILL_TREES[ch.classId];

  return (
    <Panel title="Árvore de Habilidades">
      <div className="flex items-center justify-between mb-4">
        <p className="text-parchment/60 text-sm">Distribua pontos ganhos ao subir de nível entre os três caminhos.</p>
        <span className="text-xs bg-gold/20 border border-gold/50 text-gold rounded-full px-3 py-1 font-bold shrink-0 ml-3">
          {ch.skillPoints} disponível{ch.skillPoints !== 1 ? 'is' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {paths.map((path) => {
          const unlockedInPath = unlockedCountInPath(path, ch.unlockedSkills);
          return (
            <div key={path.id} className="rounded border border-panelborder/60 bg-panel2/40 p-3">
              <h3 className="font-display text-sm uppercase tracking-[0.1em] mb-3 text-center" style={{ color: path.color }}>
                {path.name}
              </h3>
              <div className="flex flex-col gap-2">
                {path.nodes.map((node, i) => {
                  const unlocked = ch.unlockedSkills.includes(node.id);
                  const available = !unlocked && ch.skillPoints > 0 && canUnlock(path, i, ch.unlockedSkills);
                  const locked = !unlocked && !available;
                  return (
                    <button
                      key={node.id}
                      disabled={!available}
                      onClick={() => available && onUnlock(node.id)}
                      className={`text-left rounded border px-2.5 py-2 transition ${
                        unlocked ? 'border-gold bg-gold/10' :
                        available ? 'border-panelborder hover:border-gold/70 hover:bg-white/5 cursor-pointer' :
                        'border-panelborder/30 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div className={`text-sm font-bold ${unlocked ? 'text-gold' : 'text-parchment'}`}>
                        {i + 1}. {node.name}
                      </div>
                      <div className="text-xs text-parchment/50 mt-0.5">{node.desc}</div>
                      {locked && i > unlockedInPath && (
                        <div className="text-[10px] text-parchment/30 mt-1 uppercase tracking-wide">Requer o nó anterior</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
