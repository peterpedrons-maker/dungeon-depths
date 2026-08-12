import { Section, DungeonDef } from '../types/game';
import { DUNGEONS } from '../lib/dungeons';

interface Props {
  section: Section;
  open: boolean;
  onClose: () => void;
  onNavigate: (s: Section) => void;
  onEnterDungeon: (dungeon: DungeonDef) => void;
  onAbandon: () => void;
}

export function Sidebar({ section, open, onClose, onNavigate, onEnterDungeon, onAbandon }: Props) {
  const nav = (s: Section) => { onNavigate(s); onClose(); };
  const enter = (d: DungeonDef) => { onEnterDungeon(d); onClose(); };
  const abandon = () => { onAbandon(); onClose(); };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={onClose} aria-hidden />}
      <nav
        className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto bg-panel border-r-2 border-gold/30 flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:static md:translate-x-0 md:z-auto md:w-56 md:shrink-0`}
      >
        <Group title="Personagem">
          <NavItem active={section === 'character'} onClick={() => nav('character')}>Visão Geral</NavItem>
          <NavItem active={section === 'skills'} onClick={() => nav('skills')}>Habilidades</NavItem>
        </Group>

        <Group title="Masmorras">
          {DUNGEONS.map((d) => (
            <NavItem key={d.id} active={section === 'dungeon'} onClick={() => enter(d)} title={d.desc}>
              {d.special && <span className="text-gold mr-1">✦</span>}
              {d.name}
            </NavItem>
          ))}
        </Group>

        <Group title="Reino">
          <NavItem active={section === 'kingdom'} onClick={() => nav('kingdom')}>Visão Geral</NavItem>
          <NavItem active={section === 'merchant'} onClick={() => nav('merchant')}>Mercador</NavItem>
        </Group>

        <Group title="Ranking">
          <NavItem active={section === 'highscore'} onClick={() => nav('highscore')}>Colocação</NavItem>
        </Group>

        <div className="mt-auto p-3 border-t border-panelborder">
          <button onClick={abandon} className="text-xs text-parchment/40 hover:text-parchment/70">
            Abandonar Herói / Novo Jogo
          </button>
        </div>
      </nav>
    </>
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

function NavItem({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-full text-left px-4 py-2 md:py-1.5 text-sm border-l-2 transition ${
        active
          ? 'border-gold text-gold bg-white/5'
          : 'border-transparent text-parchment/70 hover:text-parchment hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  );
}
