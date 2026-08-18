import { Section } from '../types/game';
import pergaminho from '../assets/pergaminho.webp';
import { IconScroll, IconActive, IconSkull, IconCastle, IconHammer, IconTrophy } from './icons';

interface Props {
  section: Section;
  open: boolean;
  onClose: () => void;
  onNavigate: (s: Section) => void;
  onAbandon: () => void;
}

export function Sidebar({ section, open, onClose, onNavigate, onAbandon }: Props) {
  const nav = (s: Section) => { onNavigate(s); onClose(); };
  const abandon = () => { onAbandon(); onClose(); };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={onClose} aria-hidden />}
      <nav
        className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto border-r-2 border-gold/30 flex flex-col bg-panel
          transform transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:static md:translate-x-0 md:z-auto md:w-56 md:shrink-0`}
        style={{ backgroundImage: `url(${pergaminho})`, backgroundSize: '340px', backgroundBlendMode: 'multiply' }}
      >
        <Group title="Personagem">
          <NavItem icon={<IconScroll className="w-4 h-4" />} active={section === 'character'} onClick={() => nav('character')}>Personagem</NavItem>
          <NavItem icon={<IconActive className="w-4 h-4" />} active={section === 'skills'} onClick={() => nav('skills')}>Habilidades</NavItem>
        </Group>

        <Group title="Masmorras">
          <NavItem icon={<IconSkull className="w-4 h-4" />} active={section === 'dungeon-select' || section === 'dungeon'} onClick={() => nav('dungeon-select')}>
            Explorar
          </NavItem>
        </Group>

        <Group title="Reino">
          <NavItem icon={<IconCastle className="w-4 h-4" />} active={section === 'kingdom'} onClick={() => nav('kingdom')}>Visão Geral</NavItem>
          <NavItem icon={<IconHammer className="w-4 h-4" />} active={section === 'buildings'} onClick={() => nav('buildings')}>Pátio</NavItem>
        </Group>

        <Group title="Ranking">
          <NavItem icon={<IconTrophy className="w-4 h-4" />} active={section === 'highscore'} onClick={() => nav('highscore')}>Colocação</NavItem>
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

function NavItem({ active, onClick, children, title, icon }: {
  active: boolean; onClick: () => void; children: React.ReactNode; title?: string; icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-full flex items-center gap-2.5 text-left px-4 py-2 md:py-1.5 text-sm border-l-2 transition ${
        active
          ? 'border-gold text-gold bg-gradient-to-r from-gold/15 to-transparent'
          : 'border-transparent text-parchment/70 hover:text-parchment hover:bg-white/5'
      }`}
    >
      <span className={`shrink-0 ${active ? 'text-gold' : 'text-parchment/40'}`}>{icon}</span>
      <span className="truncate">{children}</span>
    </button>
  );
}
