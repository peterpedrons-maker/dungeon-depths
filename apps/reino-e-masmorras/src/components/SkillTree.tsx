import { useState } from 'react';
import { Character, SkillNode, SkillNodeType } from '../types/game';
import { SKILL_TREES, canUnlock, unlockedCountInPath, MAX_EQUIPPED_ABILITIES } from '../lib/skills';
import { Panel } from './Panel';
import { SmallButton } from './Button';
import { Modal } from './Modal';
import { IconAttribute, IconPassive, IconActive } from './icons';

interface Props {
  character: Character;
  onUnlock: (nodeId: string) => void;
  onEquipAbility: (abilityId: string) => void;
  onUnequipAbility: (abilityId: string) => void;
  onReorderAbility: (index: number, dir: -1 | 1) => void;
}

const TYPE_LABEL: Record<SkillNodeType, string> = { attribute: 'Atributo', passive: 'Passiva', active: 'Ativa' };
const TYPE_ICON: Record<SkillNodeType, typeof IconAttribute> = { attribute: IconAttribute, passive: IconPassive, active: IconActive };

type NodeState = 'unlocked' | 'available' | 'locked';

export function SkillTree({ character: ch, onUnlock, onEquipAbility, onUnequipAbility, onReorderAbility }: Props) {
  const paths = SKILL_TREES[ch.classId];
  const [selected, setSelected] = useState<{ node: SkillNode; state: NodeState } | null>(null);

  // Equipped-loadout slots, in priority order, padded with empty placeholders.
  const equippedNodes: (SkillNode | null)[] = ch.equippedAbilities.map((id) =>
    paths.flatMap((p) => p.nodes).find((n) => n.id === id) ?? null,
  );
  while (equippedNodes.length < MAX_EQUIPPED_ABILITIES) equippedNodes.push(null);

  return (
    <Panel title="Árvore de Habilidades">
      <div className="flex items-center justify-between mb-4">
        <p className="text-parchment/60 text-sm">Clique num nó para ver detalhes, desbloquear ou equipar.</p>
        <span className="text-xs bg-gold/20 border border-gold/50 text-gold rounded-full px-3 py-1 font-bold shrink-0 ml-3">
          {ch.skillPoints} disponível{ch.skillPoints !== 1 ? 'is' : ''}
        </span>
      </div>

      <h3 className="font-display text-gold/90 text-xs uppercase tracking-[0.15em] mb-2">
        Habilidades Equipadas ({ch.equippedAbilities.length}/{MAX_EQUIPPED_ABILITIES})
      </h3>
      <div className="flex gap-2 mb-5">
        {equippedNodes.map((node, i) =>
          node ? (
            <button
              key={node.id}
              onClick={() => setSelected({ node, state: 'unlocked' })}
              className="relative w-14 h-14 rounded-full border-2 border-gold bg-gold/15 flex items-center justify-center transition-all duration-150 hover:scale-110 hover:brightness-125 shrink-0"
              title={node.name}
            >
              <IconActive className="w-7 h-7 text-gold" />
              <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-gold text-ink text-[9px] font-bold flex items-center justify-center">{i + 1}</span>
            </button>
          ) : (
            <div key={i} className="w-14 h-14 rounded-full border-2 border-dashed border-panelborder/50 bg-black/20 shrink-0" />
          ),
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {paths.map((path) => {
          const unlockedInPath = unlockedCountInPath(path, ch.unlockedSkills);
          return (
            <div key={path.id} className="rounded border border-panelborder/60 bg-panel2/40 p-3">
              <h3 className="font-display text-sm uppercase tracking-[0.1em] mb-3 text-center" style={{ color: path.color }}>
                {path.name}
              </h3>
              <div className="flex flex-col items-center">
                {path.nodes.map((node, i) => {
                  const unlocked = ch.unlockedSkills.includes(node.id);
                  const available = !unlocked && ch.skillPoints > 0 && canUnlock(path, i, ch.unlockedSkills);
                  const state: NodeState = unlocked ? 'unlocked' : available ? 'available' : 'locked';
                  const NodeIcon = TYPE_ICON[node.type];
                  const isEquipped = node.type === 'active' && ch.equippedAbilities.includes(node.id);
                  return (
                    <div key={node.id} className="flex flex-col items-center">
                      {i > 0 && (
                        <div
                          className="w-0.5 h-4 -my-px"
                          style={{ background: unlocked ? path.color : '#4a3f30' }}
                        />
                      )}
                      <button
                        onClick={() => setSelected({ node, state })}
                        title={node.name}
                        className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-150 hover:scale-110 hover:brightness-125 ${
                          state === 'locked' ? 'border-panelborder/30 bg-black/20 opacity-40' : 'hover:border-gold/70'
                        } ${state === 'available' ? 'animate-pulse' : ''}`}
                        style={
                          state === 'unlocked' ? { borderColor: path.color, background: `${path.color}26` }
                          : state === 'available' ? { borderColor: path.color }
                          : undefined
                        }
                      >
                        <NodeIcon className="w-6 h-6" style={{ color: state === 'locked' ? '#6b6355' : path.color }} />
                        <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-panel border border-panelborder/60 text-[8px] font-bold text-parchment/60 flex items-center justify-center">{i + 1}</span>
                        {isEquipped && <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-gold border border-black/40" />}
                      </button>
                    </div>
                  );
                })}
              </div>
              {unlockedInPath < path.nodes.length && (
                <p className="text-[10px] text-parchment/30 mt-2 text-center uppercase tracking-wide">Desbloqueie em ordem</p>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <NodeModal
          selected={selected}
          equipped={ch.equippedAbilities}
          equippedCount={ch.equippedAbilities.length}
          onClose={() => setSelected(null)}
          onUnlock={(id) => { onUnlock(id); setSelected(null); }}
          onEquipAbility={(id) => { onEquipAbility(id); setSelected(null); }}
          onUnequipAbility={(id) => { onUnequipAbility(id); setSelected(null); }}
          onReorderAbility={onReorderAbility}
        />
      )}
    </Panel>
  );
}

function NodeModal({ selected, equipped, equippedCount, onClose, onUnlock, onEquipAbility, onUnequipAbility, onReorderAbility }: {
  selected: { node: SkillNode; state: NodeState };
  equipped: string[];
  equippedCount: number;
  onClose: () => void;
  onUnlock: (id: string) => void;
  onEquipAbility: (id: string) => void;
  onUnequipAbility: (id: string) => void;
  onReorderAbility: (index: number, dir: -1 | 1) => void;
}) {
  const { node, state } = selected;
  const isEquipped = equipped.includes(node.id);
  const equippedIndex = equipped.indexOf(node.id);

  return (
    <Modal
      title={node.name}
      onClose={onClose}
      footer={
        state === 'available' ? (
          <SmallButton onClick={() => onUnlock(node.id)}>Desbloquear (1 ponto)</SmallButton>
        ) : state === 'unlocked' && node.type === 'active' ? (
          isEquipped ? (
            <>
              <SmallButton onClick={() => onReorderAbility(equippedIndex, -1)} variant="ghost">▲ Prioridade</SmallButton>
              <SmallButton onClick={() => onReorderAbility(equippedIndex, 1)} variant="ghost">▼ Prioridade</SmallButton>
              <SmallButton onClick={() => onUnequipAbility(node.id)}>Desequipar</SmallButton>
            </>
          ) : (
            <SmallButton onClick={() => onEquipAbility(node.id)}>
              {equippedCount >= MAX_EQUIPPED_ABILITIES ? 'Loadout cheio' : 'Equipar'}
            </SmallButton>
          )
        ) : undefined
      }
    >
      <span className="inline-block text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-panel2 text-parchment/60 border border-panelborder/60">
        {TYPE_LABEL[node.type]}
      </span>
      <p className="text-parchment/80">{node.desc}</p>
      {node.type === 'active' && node.ability && (
        <p className="text-xs text-parchment/50">Recarga: {node.ability.cooldown} rodadas.</p>
      )}
      {state === 'locked' && <p className="text-xs text-parchment/40 italic">Desbloqueie o nó anterior desta trilha primeiro.</p>}
    </Modal>
  );
}
