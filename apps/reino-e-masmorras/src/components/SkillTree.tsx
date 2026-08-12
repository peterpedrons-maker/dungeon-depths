import { useState } from 'react';
import { Character, SkillNode, SkillNodeType, SkillPath } from '../types/game';
import { SKILL_TREES, canUnlockNode, unlockedCountInPath, MAX_EQUIPPED_ABILITIES } from '../lib/skills';
import { Panel } from './Panel';
import { SmallButton } from './Button';
import { Modal } from './Modal';
import { IconAttribute, IconPassive, IconActive } from './icons';
import skillFrame from '../assets/slot-habilidade.webp';

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

// 15-node layout: 5 tiers (rows) × 3 columns (Left/Mid/Right), reading the
// path's node array in tier-major order (index 0-14 → row = i/3, col = i%3).
// This mirrors the branching topology in lib/skills.ts — connectors below
// are derived from each node's actual prereqIds, not a hardcoded chain, so
// the cross-links (a tier-3 node reachable from two different tier-2
// columns) render correctly without special-casing them here.
const COL_X = [16, 50, 84]; // percent
const ROW_Y = [9, 28, 50, 72, 91]; // percent
function posOf(index: number): { x: number; y: number } {
  return { x: COL_X[index % 3], y: ROW_Y[Math.floor(index / 3)] };
}

export function SkillTree({ character: ch, onUnlock, onEquipAbility, onUnequipAbility, onReorderAbility }: Props) {
  const paths = SKILL_TREES[ch.classId];
  const [activePath, setActivePath] = useState(0);
  const [selected, setSelected] = useState<{ node: SkillNode; state: NodeState } | null>(null);
  const path = paths[activePath];

  // Equipped-loadout slots, in priority order, padded with empty placeholders.
  const equippedNodes: (SkillNode | null)[] = ch.equippedAbilities.map((id) =>
    paths.flatMap((p) => p.nodes).find((n) => n.id === id) ?? null,
  );
  while (equippedNodes.length < MAX_EQUIPPED_ABILITIES) equippedNodes.push(null);

  return (
    <Panel title="Árvore de Habilidades">
      <div className="flex items-center justify-between mb-4">
        <p className="text-parchment/60 text-sm">Toque num nó pra ver detalhes, desbloquear ou equipar.</p>
        <span className="text-xs bg-gold/20 border border-gold/50 text-gold rounded-full px-3 py-1 font-bold shrink-0 ml-3">
          {ch.skillPoints} disponível{ch.skillPoints !== 1 ? 'is' : ''}
        </span>
      </div>

      <h3 className="font-display text-gold/90 text-xs uppercase tracking-[0.15em] mb-2">
        Habilidades Equipadas ({ch.equippedAbilities.length}/{MAX_EQUIPPED_ABILITIES})
      </h3>
      <div className="flex gap-3 mb-6">
        {equippedNodes.map((node, i) =>
          node ? (
            <button
              key={node.id}
              onClick={() => setSelected({ node, state: 'unlocked' })}
              className="relative w-16 h-16 transition-transform duration-150 hover:scale-110 shrink-0"
              title={node.name}
            >
              <div className="absolute inset-[14%] rounded-full" style={{ boxShadow: '0 0 10px 3px #c89a2e99', background: '#c89a2e26' }} />
              <div className="absolute inset-[18%] flex items-center justify-center">
                <IconActive className="w-full h-full text-gold" />
              </div>
              <img src={skillFrame} alt="" className="absolute inset-0 w-full h-full pointer-events-none select-none" draggable={false} />
              <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-gold text-ink text-[9px] font-bold flex items-center justify-center z-10">{i + 1}</span>
            </button>
          ) : (
            <div key={i} className="relative w-16 h-16 opacity-30 shrink-0">
              <img src={skillFrame} alt="" className="absolute inset-0 w-full h-full pointer-events-none select-none grayscale" draggable={false} />
            </div>
          ),
        )}
      </div>

      {/* One tree at a time, switched via tabs — avoids stacking 3 trees and endless scrolling on mobile */}
      <div className="flex gap-1.5 mb-3">
        {paths.map((p, i) => {
          const count = unlockedCountInPath(p, ch.unlockedSkills);
          const active = i === activePath;
          return (
            <button
              key={p.id}
              onClick={() => setActivePath(i)}
              className={`flex-1 rounded-t px-2 py-2 text-center transition border-b-2 ${active ? 'bg-panel2/60' : 'bg-black/20 hover:bg-panel2/30'}`}
              style={{ borderColor: active ? p.color : 'transparent' }}
            >
              <div className="text-xs font-display font-bold uppercase tracking-wide truncate" style={{ color: active ? p.color : '#9c8f78' }}>
                {p.name}
              </div>
              <div className="text-[10px] text-parchment/40 mt-0.5">{count}/{p.nodes.length}</div>
            </button>
          );
        })}
      </div>

      <PathGraph path={path} ch={ch} onSelect={setSelected} />

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

function PathGraph({ path, ch, onSelect }: {
  path: SkillPath; ch: Character; onSelect: (s: { node: SkillNode; state: NodeState }) => void;
}) {
  const idToIndex = new Map(path.nodes.map((n, i) => [n.id, i]));

  return (
    <div className="rounded border border-panelborder/60 bg-panel2/40 p-3">
      <div className="relative mx-auto w-full max-w-[300px]" style={{ height: 400 }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          {path.nodes.map((node, i) =>
            node.prereqIds.map((prereqId) => {
              const p = idToIndex.get(prereqId);
              if (p === undefined) return null;
              const from = posOf(p);
              const to = posOf(i);
              const lit = ch.unlockedSkills.includes(prereqId) && ch.unlockedSkills.includes(node.id);
              return (
                <line
                  key={`${prereqId}->${node.id}`}
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={lit ? path.color : '#4a3f30'}
                  strokeWidth={lit ? 1.4 : 1}
                  vectorEffect="non-scaling-stroke"
                />
              );
            }),
          )}
        </svg>
        {path.nodes.map((node, i) => {
          const unlocked = ch.unlockedSkills.includes(node.id);
          const available = !unlocked && ch.skillPoints > 0 && canUnlockNode(node, ch.unlockedSkills);
          const state: NodeState = unlocked ? 'unlocked' : available ? 'available' : 'locked';
          const NodeIcon = TYPE_ICON[node.type];
          const isEquipped = node.type === 'active' && ch.equippedAbilities.includes(node.id);
          const { x, y } = posOf(i);
          return (
            <button
              key={node.id}
              onClick={() => onSelect({ node, state })}
              title={node.name}
              style={{ left: `${x}%`, top: `${y}%` }}
              className={`absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 transition-all duration-150 hover:scale-110 ${
                state === 'locked' ? 'opacity-35 grayscale' : ''
              } ${state === 'available' ? 'animate-pulse' : ''}`}
            >
              {state !== 'locked' && (
                <div className="absolute inset-[14%] rounded-full" style={{ boxShadow: `0 0 8px 2px ${path.color}99`, background: `${path.color}26` }} />
              )}
              <div className="absolute inset-[18%] flex items-center justify-center">
                <NodeIcon className="w-full h-full" style={{ color: state === 'locked' ? '#6b6355' : path.color }} />
              </div>
              <img src={skillFrame} alt="" className="absolute inset-0 w-full h-full pointer-events-none select-none" draggable={false} />
              {isEquipped && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-gold border border-black/40 z-10" />}
            </button>
          );
        })}
      </div>
    </div>
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
      {state === 'locked' && <p className="text-xs text-parchment/40 italic">Desbloqueie um dos nós conectados a este primeiro.</p>}
    </Modal>
  );
}
