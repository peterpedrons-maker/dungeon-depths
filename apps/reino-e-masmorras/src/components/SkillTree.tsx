import { useState } from 'react';
import { ClassId, Character, ScalingRole, SkillNode, SkillNodeType, SkillPath } from '../types/game';
import { SKILL_TREES, canUnlockNode, unlockedCountInPath, MAX_EQUIPPED_ABILITIES } from '../lib/skills';
import { activeAbilityIconStyle, exclusivePassiveIconStyle, passiveIconStyle } from '../lib/abilityIcons';
import { Panel } from './Panel';
import { SmallButton } from './Button';
import { Modal } from './Modal';
import { IconActive } from './icons';
import { ClassMechanicsButton, MechanicRefsRow, MechanicText } from './ClassMechanics';
import { skillPresentationRows } from '../lib/skillPresentation';
import { GlossaryText } from './Glossary';

interface Props {
  character: Character;
  onUnlock: (nodeId: string) => void;
  onEquipAbility: (abilityId: string) => void;
  onUnequipAbility: (abilityId: string) => void;
  onReorderAbility: (index: number, dir: -1 | 1) => void;
  onResetSkills: () => void;
  resetCost: number;
  onBack: () => void;
}

const TYPE_LABEL: Record<SkillNodeType, string> = { attribute: 'Atributo', passive: 'Passiva', active: 'Ativa' };
// Display-only — feeds the "ESCALA:" tooltip block in NodeModal, never read
// by the combat engine itself (see SkillNode.scaling in types/game.ts).
const SCALING_ROLE_COLOR: Record<ScalingRole, string> = {
  principal: 'text-amber-400',
  secundario: 'text-sky-400',
  terciario: 'text-emerald-400',
  mecanica: 'text-purple-400',
  fixo: 'text-parchment/50',
};

// Active nodes get their own unique painted icon (per-ability sheet, when
// the class has one) instead of the generic star; attribute/passive nodes
// share one small library of icons keyed by effect kind (see
// lib/abilityIcons.ts) instead of a plain diamond/shield for every node.
function NodeIconView({ node, classId, color }: { node: SkillNode; classId: ClassId; color: string }) {
  if (node.type === 'active') {
    const bg = activeAbilityIconStyle(classId, node.id);
    if (bg) return <div className="w-full h-full rounded-full overflow-hidden" style={bg} />;
    return <IconActive className="w-full h-full" style={{ color }} />;
  }
  if (node.type === 'passive') {
    const bg = exclusivePassiveIconStyle(classId, node.id);
    if (bg) return <div className="w-full h-full rounded-full overflow-hidden" style={bg} />;
  }
  return <div className="w-full h-full rounded-full overflow-hidden" style={passiveIconStyle(node.effect)} />;
}

type NodeState = 'unlocked' | 'available' | 'locked';

// Three-tier sizing by node type — actives are the ones the player actually
// casts in combat, so they read as the "important" nodes on the tree;
// passives sit in between; attribute nodes (the plain +X% stat bumps) are
// the smallest since there are far more of them and each matters less on
// its own. Now that node art carries its own painted rim (see NodeIconView
// above), there's no separate frame image fighting the icon for space, so
// each tier can fill its own button almost edge-to-edge.
const NODE_SIZE_CLASS: Record<SkillNodeType, string> = {
  active: 'w-20 h-20',
  passive: 'w-12 h-12',
  attribute: 'w-9 h-9',
};
// Pixel sizes matching NODE_SIZE_CLASS above (Tailwind w-20/w-12/w-9 at the
// default 16px root), used for the row-height math below — the two must be
// kept in sync by hand since one is a Tailwind class and the other a number.
const NODE_PX: Record<SkillNodeType, number> = { active: 80, passive: 48, attribute: 36 };

// 15-node layout: 5 tiers (rows) × 3 columns (Left/Mid/Right), reading the
// path's node array in tier-major order (index 0-14 → row = i/3, col = i%3).
// This mirrors the branching topology in lib/skills.ts — connectors below
// are derived from each node's actual prereqIds, not a hardcoded chain, so
// the cross-links (a tier-3 node reachable from two different tier-2
// columns) render correctly without special-casing them here.
const COL_X = [16, 50, 84]; // percent

// Row Y positions used to be fixed percentages of a fixed-height box, which
// assumed every row was roughly the same visual weight. It wasn't: some
// rows hold two 80px active nodes side by side while others hold three 36px
// attribute nodes, so a fixed row pitch let two stacked active rows overlap
// each other. Instead, each row's height is however tall its biggest node
// actually is, plus a fixed breathing-room gap — so rows with big nodes get
// more room automatically and nothing ever collides, at the cost of a
// taller (sometimes scrollable) tree, which is the trade the art needs.
const ROW_GAP = 32; // px of clear space between the edges of two stacked nodes
const SIDE_PAD = 40; // px from the graph's top/bottom edge to the first/last row's center

function computeLayout(path: SkillPath): { rowY: number[]; totalHeight: number } {
  const rowCount = Math.ceil(path.nodes.length / 3);
  const rowSize: number[] = [];
  for (let r = 0; r < rowCount; r++) {
    let max = 0;
    for (let c = 0; c < 3; c++) {
      const node = path.nodes[r * 3 + c];
      if (node) max = Math.max(max, NODE_PX[node.type]);
    }
    rowSize.push(max);
  }
  const rowY: number[] = [SIDE_PAD + rowSize[0] / 2];
  for (let r = 1; r < rowCount; r++) {
    rowY.push(rowY[r - 1] + rowSize[r - 1] / 2 + ROW_GAP + rowSize[r] / 2);
  }
  const totalHeight = rowY[rowCount - 1] + rowSize[rowCount - 1] / 2 + SIDE_PAD;
  return { rowY, totalHeight };
}

export function SkillTree({ character: ch, onUnlock, onEquipAbility, onUnequipAbility, onReorderAbility, onResetSkills, resetCost, onBack }: Props) {
  const paths = SKILL_TREES[ch.classId];
  const [activePath, setActivePath] = useState(0);
  const [selected, setSelected] = useState<{ node: SkillNode; state: NodeState } | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const path = paths[activePath];

  // Equipped-loadout slots, in priority order, padded with empty placeholders.
  const equippedNodes: (SkillNode | null)[] = ch.equippedAbilities.map((id) =>
    paths.flatMap((p) => p.nodes).find((n) => n.id === id) ?? null,
  );
  while (equippedNodes.length < MAX_EQUIPPED_ABILITIES) equippedNodes.push(null);

  return (
    <Panel title="Árvore de Habilidades" onBack={onBack}>
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <p className="text-parchment/60 text-sm">Toque num nó pra ver detalhes, desbloquear ou equipar.</p>
        <div className="flex flex-wrap items-center justify-end gap-1.5 ml-auto">
          <ClassMechanicsButton classId={ch.classId} />
          {ch.unlockedSkills.length > 0 && (
            <button
              onClick={() => setConfirmingReset(true)}
              className="text-[11px] font-bold text-crimson/80 border border-crimson/40 rounded-full px-2.5 py-1 hover:text-crimson hover:border-crimson"
            >
              Resetar
            </button>
          )}
          <span className="text-xs bg-gold/20 border border-gold/50 text-gold rounded-full px-3 py-1 font-bold">
            {ch.skillPoints} disponível{ch.skillPoints !== 1 ? 'is' : ''}
          </span>
        </div>
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
              className="relative w-20 h-20 transition-transform duration-150 hover:scale-110 shrink-0"
              title={node.name}
            >
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <NodeIconView node={node} classId={ch.classId} color="#c89a2e" />
              </div>
              <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-gold text-ink text-[9px] font-bold flex items-center justify-center z-10">{i + 1}</span>
            </button>
          ) : (
            <div key={i} className="relative w-20 h-20 rounded-full border border-panelborder/50 bg-black/20 opacity-30 shrink-0" />
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
          character={ch}
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

      {confirmingReset && (
        <Modal
          title="Resetar Habilidades"
          onClose={() => setConfirmingReset(false)}
          footer={
            <>
              <SmallButton onClick={() => setConfirmingReset(false)} variant="ghost">Cancelar</SmallButton>
              <SmallButton
                onClick={() => { onResetSkills(); setConfirmingReset(false); }}
                disabled={ch.gold < resetCost}
              >
                Confirmar — {resetCost} ouro
              </SmallButton>
            </>
          }
        >
          <p>
            Isso devolve todos os {ch.unlockedSkills.length} pontos de habilidade já gastos (e desequipa qualquer
            habilidade ativa em uso), por {resetCost} de ouro. Não dá pra desfazer.
          </p>
        </Modal>
      )}
    </Panel>
  );
}

function PathGraph({ path, ch, onSelect }: {
  path: SkillPath; ch: Character; onSelect: (s: { node: SkillNode; state: NodeState }) => void;
}) {
  const idToIndex = new Map(path.nodes.map((n, i) => [n.id, i]));
  const { rowY, totalHeight } = computeLayout(path);
  const posOf = (index: number): { x: number; y: number } => ({ x: COL_X[index % 3], y: rowY[Math.floor(index / 3)] });

  return (
    <div className="rounded border border-panelborder/60 bg-panel2/40 p-3">
      <div className="relative mx-auto w-full max-w-[300px] overflow-x-hidden" style={{ height: totalHeight }}>
        <svg viewBox={`0 0 100 ${totalHeight}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          <defs>
            <filter id="skillLineGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="1.6" result="blur" />
            </filter>
          </defs>
          {path.nodes.map((node, i) =>
            node.prereqIds.map((prereqId) => {
              const p = idToIndex.get(prereqId);
              if (p === undefined) return null;
              const from = posOf(p);
              const to = posOf(i);
              const lit = ch.unlockedSkills.includes(prereqId) && ch.unlockedSkills.includes(node.id);
              const key = `${prereqId}->${node.id}`;
              if (!lit) {
                return (
                  <line
                    key={key}
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke="#5a4d3a"
                    strokeWidth={1.1}
                    strokeLinecap="round"
                    strokeDasharray="0.2 3"
                    opacity={0.6}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              }
              // Lit connections get a soft blurred halo underneath a crisp
              // core line — two separate <line> passes read as a glowing
              // energy conduit far better than one filtered line, and avoid
              // the filter region interacting oddly with the node buttons
              // painted on top of it.
              return (
                <g key={key}>
                  <line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={path.color} strokeWidth={4} strokeLinecap="round"
                    opacity={0.5} filter="url(#skillLineGlow)"
                    vectorEffect="non-scaling-stroke"
                  />
                  <line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={path.color} strokeWidth={1.6} strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            }),
          )}
        </svg>
        {path.nodes.map((node, i) => {
          const unlocked = ch.unlockedSkills.includes(node.id);
          const available = !unlocked && ch.skillPoints > 0 && canUnlockNode(node, ch.unlockedSkills);
          const state: NodeState = unlocked ? 'unlocked' : available ? 'available' : 'locked';
          const isEquipped = node.type === 'active' && ch.equippedAbilities.includes(node.id);
          const { x, y } = posOf(i);
          return (
            <button
              key={node.id}
              onClick={() => onSelect({ node, state })}
              title={node.name}
              style={{ left: `${x}%`, top: `${y}px` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-150 hover:scale-110 rounded-full ${NODE_SIZE_CLASS[node.type]}`}
            >
              {/* No container drawn behind the art at all — just the icon,
                  centered, at its native size. Dimming/pulsing/desaturating
                  is applied as a CSS filter directly on this same icon
                  layer (never a separately-sized overlay box) — a filter
                  only alters pixels the icon actually painted and leaves
                  its transparent margin untouched, so a locked node never
                  shows a dark patch bigger than its own art. Whole-element
                  opacity would also composite this button into one
                  translucent group and let the connector line drawn behind
                  it bleed through, which a filter avoids too. */}
              <div
                className="absolute inset-0 rounded-full overflow-hidden"
                style={
                  state === 'available'
                    ? { color: path.color, animation: 'skillNodeAvailablePulse 1.6s ease-in-out infinite' }
                    : state === 'locked'
                      ? { filter: 'grayscale(1) brightness(0.45)' }
                      : undefined
                }
              >
                <NodeIconView node={node} classId={ch.classId} color={state === 'locked' ? '#6b6355' : path.color} />
              </div>
              {isEquipped && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-gold border border-black/40 z-10" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NodeModal({ character, selected, equipped, equippedCount, onClose, onUnlock, onEquipAbility, onUnequipAbility, onReorderAbility }: {
  character: Character;
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
  const details = skillPresentationRows(character, node);

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
      <p className="text-parchment/80"><MechanicText text={node.desc} mechanicRefs={node.mechanicRefs} character={character} ability={node.ability} /></p>
      <MechanicRefsRow mechanicRefs={node.mechanicRefs} />
      {node.scaling && node.scaling.length > 0 && (
        <div className="mt-1 pt-1 border-t border-panelborder/40">
          <p className="text-[10px] uppercase tracking-wide text-parchment/50 mb-1">Escala:</p>
          <ul className="space-y-0.5">
            {node.scaling.map((s, i) => (
              <li key={i} className="text-xs text-parchment/70 flex gap-1.5">
                <span className={`shrink-0 uppercase text-[10px] font-bold ${SCALING_ROLE_COLOR[s.role]}`}><GlossaryText text={s.label} character={character} ability={node.ability} /></span>
                <span className="text-parchment/60"><GlossaryText text={s.description} character={character} ability={node.ability} /></span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {details.length > 0 && (
        <div className="mt-1 pt-1 border-t border-panelborder/40 space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-parchment/50">Detalhes:</p>
          {details.map((detail) => <p key={`${detail.label}:${detail.value}`} className="text-xs text-parchment/70"><span className="text-parchment/45">{detail.label}: </span><GlossaryText text={detail.value} character={character} ability={node.ability} /></p>)}
        </div>
      )}
      {state === 'locked' && <p className="text-xs text-parchment/40 italic">Desbloqueie um dos nós conectados a este primeiro.</p>}
    </Modal>
  );
}
