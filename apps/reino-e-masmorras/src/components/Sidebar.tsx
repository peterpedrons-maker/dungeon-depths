import { Section } from '../types/game';

interface HuntTier { label: string; startDepth: number; }
const HUNTS: HuntTier[] = [
  { label: 'Ruínas Superficiais', startDepth: 1 },
  { label: 'Cavernas Profundas', startDepth: 8 },
  { label: 'Covil dos Dragões', startDepth: 18 },
];

interface Props {
  section: Section;
  onNavigate: (s: Section) => void;
  onEnterDungeon: (startDepth: number) => void;
  onAbandon: () => void;
}

export function Sidebar({ section, onNavigate, onEnterDungeon, onAbandon }: Props) {
  return (
    <nav className="w-56 shrink-0 bg-panel border-r-2 border-gold/30 flex flex-col">
      <Group title="Personagem">
        <NavItem active={section === 'character'} onClick={() => onNavigate('character')}>Visão Geral</NavItem>
      </Group>

      <Group title="Caçadas">
        {HUNTS.map((h) => (
          <NavItem key={h.label} active={section === 'dungeon'} onClick={() => onEnterDungeon(h.startDepth)}>
            {h.label}
          </NavItem>
        ))}
      </Group>

      <Group title="Reino">
        <NavItem active={section === 'kingdom'} onClick={() => onNavigate('kingdom')}>Visão Geral</NavItem>
        <NavItem active={section === 'merchant'} onClick={() => onNavigate('merchant')}>Mercador</NavItem>
      </Group>

      <Group title="Ranking">
        <NavItem active={section === 'highscore'} onClick={() => onNavigate('highscore')}>Colocação</NavItem>
      </Group>

      <div className="mt-auto p-3 border-t border-panelborder">
        <button onClick={onAbandon} className="text-xs text-parchment/40 hover:text-parchment/70">
          Abandonar Herói / Novo Jogo
        </button>
      </div>
    </nav>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gold/20">
      <div className="px-3 py-1.5 bg-panel2 text-gold/80 text-xs font-display font-bold uppercase tracking-[0.15em]">{title}</div>
      <div className="py-1">{children}</div>
    </div>
  );
}

function NavItem({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-1.5 text-sm border-l-2 transition ${
        active
          ? 'border-gold text-gold bg-white/5'
          : 'border-transparent text-parchment/70 hover:text-parchment hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  );
}
