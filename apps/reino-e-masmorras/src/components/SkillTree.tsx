import { Character, SkillNodeType } from '../types/game';
import { SKILL_TREES, canUnlock, unlockedCountInPath, getUnlockedAbilities, getEquippedAbilities, MAX_EQUIPPED_ABILITIES } from '../lib/skills';
import { Panel } from './Panel';
import { SmallButton } from './Button';

interface Props {
  character: Character;
  onUnlock: (nodeId: string) => void;
  onEquipAbility: (abilityId: string) => void;
  onUnequipAbility: (abilityId: string) => void;
  onReorderAbility: (index: number, dir: -1 | 1) => void;
}

const TYPE_LABEL: Record<SkillNodeType, string> = { attribute: 'Atributo', passive: 'Passiva', active: 'Ativa' };
const TYPE_BADGE: Record<SkillNodeType, string> = {
  attribute: 'bg-panelborder/30 text-parchment/60',
  passive: 'bg-sky-500/20 text-sky-300',
  active: 'bg-gold/20 text-gold',
};

export function SkillTree({ character: ch, onUnlock, onEquipAbility, onUnequipAbility, onReorderAbility }: Props) {
  const paths = SKILL_TREES[ch.classId];
  const known = getUnlockedAbilities(ch.classId, ch.unlockedSkills);
  const equipped = getEquippedAbilities(ch.classId, ch.unlockedSkills, ch.equippedAbilities);
  const equippedIds = new Set(ch.equippedAbilities);
  const unequippedKnown = known.filter((a) => !equippedIds.has(a.id));

  return (
    <Panel title="Árvore de Habilidades">
      <div className="flex items-center justify-between mb-4">
        <p className="text-parchment/60 text-sm">Distribua pontos ganhos ao subir de nível entre os três caminhos.</p>
        <span className="text-xs bg-gold/20 border border-gold/50 text-gold rounded-full px-3 py-1 font-bold shrink-0 ml-3">
          {ch.skillPoints} disponível{ch.skillPoints !== 1 ? 'is' : ''}
        </span>
      </div>

      {known.length > 0 && (
        <div className="rounded border border-panelborder/60 bg-panel2/40 p-3 mb-4">
          <h3 className="font-display text-gold/90 text-xs uppercase tracking-[0.15em] mb-2">
            Habilidades Equipadas ({equipped.length}/{MAX_EQUIPPED_ABILITIES})
          </h3>
          <p className="text-xs text-parchment/50 mb-2">
            Verificadas em ordem de prioridade a cada rodada de combate — a primeira disponível (sem recarga, condição atendida) é usada.
          </p>
          {equipped.length === 0 ? (
            <p className="text-parchment/40 text-sm italic mb-2">Nenhuma habilidade equipada — você só usa ataques básicos em combate.</p>
          ) : (
            <ul className="space-y-1.5 mb-2">
              {equipped.map((ab, i) => (
                <li key={ab.id} className="flex items-center justify-between gap-2 rounded border border-gold/30 bg-gold/5 px-3 py-1.5">
                  <div className="min-w-0">
                    <span className="font-bold text-sm text-gold">{i + 1}. {ab.name}</span>
                    <span className="text-xs text-parchment/40 ml-2">{ab.desc} · recarga {ab.cooldown} rodadas</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <SmallButton onClick={() => onReorderAbility(i, -1)} variant="ghost">▲</SmallButton>
                    <SmallButton onClick={() => onReorderAbility(i, 1)} variant="ghost">▼</SmallButton>
                    <SmallButton onClick={() => onUnequipAbility(ab.id)} variant="ghost">Desequipar</SmallButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {unequippedKnown.length > 0 && (
            <ul className="space-y-1.5">
              {unequippedKnown.map((ab) => (
                <li key={ab.id} className="flex items-center justify-between gap-2 rounded border border-panelborder/60 bg-panel2/50 px-3 py-1.5">
                  <div className="min-w-0">
                    <span className="font-bold text-sm text-parchment">{ab.name}</span>
                    <span className="text-xs text-parchment/40 ml-2">{ab.desc} · recarga {ab.cooldown} rodadas</span>
                  </div>
                  <SmallButton onClick={() => onEquipAbility(ab.id)}>
                    Equipar{equipped.length >= MAX_EQUIPPED_ABILITIES ? ' (cheio)' : ''}
                  </SmallButton>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-bold ${unlocked ? 'text-gold' : 'text-parchment'}`}>
                          {i + 1}. {node.name}
                        </span>
                        <span className={`text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 ${TYPE_BADGE[node.type]}`}>
                          {TYPE_LABEL[node.type]}
                        </span>
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
