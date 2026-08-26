import { ClassMechanic } from '../types/game';
import { formatGameNumber } from '../lib/format';

export interface CombatMechanicState {
  mechanic: ClassMechanic;
  value: number;
  maxValue?: number;
  duration?: number;
  visible?: boolean;
  detail?: string;
}

const COLOR = {
  amber: { text: 'text-amber-300', fill: 'bg-amber-400', dot: 'decoration-amber-300/40' },
  red: { text: 'text-red-400', fill: 'bg-red-500', dot: 'decoration-red-400/40' },
  purple: { text: 'text-purple-300', fill: 'bg-purple-500', dot: 'decoration-purple-300/40' },
  sky: { text: 'text-sky-300', fill: 'bg-sky-300', dot: 'decoration-sky-300/40' },
  gold: { text: 'text-gold', fill: 'bg-gold', dot: 'decoration-gold/40' },
  slate: { text: 'text-slate-300', fill: 'bg-slate-300', dot: 'decoration-slate-300/40' },
  orange: { text: 'text-orange-300', fill: 'bg-orange-500', dot: 'decoration-orange-300/40' },
  lime: { text: 'text-lime-300', fill: 'bg-lime-400', dot: 'decoration-lime-300/40' },
  emerald: { text: 'text-emerald-300', fill: 'bg-emerald-400', dot: 'decoration-emerald-300/40' },
};

function MechanicItem({ state, onOpen }: { state: CombatMechanicState; onOpen: (state: CombatMechanicState) => void }) {
  const display = state.mechanic.combatDisplay;
  if (!display) return null;
  const max = state.maxValue ?? display.maxValue;
  const color = COLOR[display.color];
  const valueText = display.displayType === 'status' ? 'Ativo' : max ? `${formatGameNumber(state.value)}/${formatGameNumber(max)}` : formatGameNumber(state.value);
  const duration = state.duration && state.duration > 0 ? ` · ${state.duration} ${state.duration === 1 ? 'ciclo' : 'ciclos'}` : '';
  return (
    <button key={`${state.mechanic.id}:${state.value}:${state.duration ?? 0}`} type="button" onClick={() => onOpen(state)} className={`w-full min-w-0 animate-[fadeIn_.18s_ease-out] ${color.text}`}>
      <div className={`flex items-baseline justify-between gap-2 text-[10px] uppercase tracking-wide underline decoration-dotted ${color.dot} underline-offset-2`}>
        <span className="truncate">{display.icon && <span aria-hidden="true">{display.icon} </span>}{state.mechanic.name}</span>
        <span className="shrink-0 normal-case">{valueText}{duration}</span>
      </div>
      {display.displayType === 'bar' && max && max > 0 && <div className="h-1.5 bg-black/50 rounded overflow-hidden"><div className={`h-1.5 rounded transition-[width] duration-300 ${color.fill}`} style={{ width: `${Math.min(100, Math.max(0, state.value / max * 100))}%` }} /></div>}
      {display.displayType === 'charges' && max && max <= 8 && <div className="text-left text-sm tracking-wider leading-none mt-0.5">{Array.from({ length: max }, (_, i) => i < state.value ? '◆' : '◇').join(' ')}</div>}
      {state.detail && <div className="text-left text-[10px] text-parchment/45 normal-case truncate">{state.detail}</div>}
    </button>
  );
}

export function CombatMechanicDisplay({ owner, states, onOpen }: { owner: 'player' | 'enemy'; states: CombatMechanicState[]; onOpen: (state: CombatMechanicState) => void }) {
  const visible = states.filter(({ mechanic, value, visible }) => {
    const display = mechanic.combatDisplay;
    return visible !== false && display?.owner === owner && !(display.hideWhenZero && value <= 0);
  }).sort((a, b) => (a.mechanic.combatDisplay?.priority ?? 0) - (b.mechanic.combatDisplay?.priority ?? 0));
  if (!visible.length) return null;
  return <div className="mt-1.5 space-y-1 rounded border border-panelborder/30 bg-black/15 p-1.5">{visible.map((state) => <MechanicItem key={`${state.mechanic.id}:${state.value}:${state.duration ?? 0}`} state={state} onOpen={onOpen} />)}</div>;
}
