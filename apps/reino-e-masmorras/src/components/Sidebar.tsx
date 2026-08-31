import { useState } from 'react';
import { Character, Section } from '../types/game';
import pergaminho from '../assets/pergaminho.webp';
import { IconScroll, IconActive, IconSkull, IconCastle, IconHammer, IconTrophy, IconTarget, IconGem, IconBook, IconRibbon, IconSpeaker, IconSpeakerMuted, IconRestart, IconDoorExit } from './icons';
import { playClickSfx, isMuted, toggleMuted } from '../lib/audio';
import { MERCHANT_REFRESH_MS } from '../lib/merchantStock';

interface Props {
  character: Character;
  section: Section;
  open: boolean;
  onClose: () => void;
  onNavigate: (s: Section) => void;
  onAbandon: () => void;
  onSignOut: () => void;
}

export function Sidebar({ character: ch, section, open, onClose, onNavigate, onAbandon, onSignOut }: Props) {
  const [muted, setMutedState] = useState(isMuted());
  const nav = (s: Section) => { playClickSfx(); onNavigate(s); onClose(); };
  const abandon = () => { playClickSfx(); onAbandon(); onClose(); };
  const signOut = () => { playClickSfx(); onSignOut(); onClose(); };
  const toggleSound = () => setMutedState(toggleMuted());

  // Binary "something's waiting for you" signals, not quantities — a dot is
  // enough to pull the eye without spelling out a count at nav-item scale.
  const hasAttrPoints = ch.attributePoints > 0;
  const hasSkillPoints = ch.skillPoints > 0;
  const merchantHasFreshStock = Date.now() - (ch.merchantRefreshedAt ?? 0) >= MERCHANT_REFRESH_MS;

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={onClose} aria-hidden />}
      <nav
        className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto border-r-2 border-gold/30 flex flex-col bg-panel
          transform transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:static md:translate-x-0 md:z-auto md:w-56 md:shrink-0`}
        style={{
          // A flat multiply blend against the very dark panel color crushed
          // the parchment grain down to near-black, which is what read as a
          // plain muddy overlay. Layering a translucent dark-brown scrim OVER
          // the untinted texture instead keeps its mottling/fiber visible
          // while still landing in the same moody palette as every other panel.
          backgroundImage: `linear-gradient(rgba(43,32,19,0.80), rgba(43,32,19,0.88)), url(${pergaminho})`,
          backgroundSize: 'auto, 300px',
        }}
      >
        <div className="p-2.5 border-b-2 border-gold/20">
          <HeroNavItem
            icon={<IconSkull className="w-5 h-5" />}
            active={section === 'dungeon-select' || section === 'dungeon'}
            onClick={() => nav('dungeon-select')}
          >
            Campanha
          </HeroNavItem>
        </div>

        <Group title="Personagem">
          <NavItem icon={<IconScroll className="w-4 h-4" />} active={section === 'character'} onClick={() => nav('character')} dot={hasAttrPoints}>Personagem</NavItem>
          <NavItem icon={<IconActive className="w-4 h-4" />} active={section === 'skills'} onClick={() => nav('skills')} dot={hasSkillPoints}>Habilidades</NavItem>
          <NavItem icon={<IconBook className="w-4 h-4" />} active={section === 'bestiary'} onClick={() => nav('bestiary')}>Bestiário</NavItem>
          <NavItem icon={<IconRibbon className="w-4 h-4" />} active={section === 'titles'} onClick={() => nav('titles')}>Títulos</NavItem>
        </Group>

        <Group title="Desafios">
          <NavItem icon={<IconTarget className="w-4 h-4" />} active={section === 'hunts'} onClick={() => nav('hunts')}>
            Caçadas
          </NavItem>
        </Group>

        <Group title="Reino">
          <NavItem icon={<IconCastle className="w-4 h-4" />} active={section === 'kingdom'} onClick={() => nav('kingdom')}>Visão Geral</NavItem>
          <NavItem icon={<IconHammer className="w-4 h-4" />} active={section === 'buildings'} onClick={() => nav('buildings')} dot={merchantHasFreshStock}>Mercadores</NavItem>
        </Group>

        <Group title="Ranking">
          <NavItem icon={<IconTrophy className="w-4 h-4" />} active={section === 'highscore'} onClick={() => nav('highscore')}>Colocação</NavItem>
          <NavItem icon={<IconGem className="w-4 h-4" />} active={section === 'prestige-shop'} onClick={() => nav('prestige-shop')}>Loja de Prestígio</NavItem>
        </Group>

        <div className="mt-auto p-3 border-t border-panelborder flex flex-col items-start gap-1.5">
          <button onClick={toggleSound} className="flex items-center gap-1.5 text-xs text-parchment/40 hover:text-parchment/70 transition-colors">
            {muted ? <IconSpeakerMuted className="w-3.5 h-3.5" /> : <IconSpeaker className="w-3.5 h-3.5" />}
            {muted ? 'Som Desativado' : 'Som Ativado'}
          </button>
          <button onClick={abandon} className="flex items-center gap-1.5 text-xs text-parchment/40 hover:text-parchment/70 transition-colors">
            <IconRestart className="w-3.5 h-3.5" />
            Abandonar Herói / Novo Jogo
          </button>
          <button onClick={signOut} className="flex items-center gap-1.5 text-xs text-parchment/40 hover:text-parchment/70 transition-colors">
            <IconDoorExit className="w-3.5 h-3.5" />
            Sair da Conta
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

// The single most important action in the game — entering a dungeon run —
// gets its own permanently-glowing full-width button above every grouped
// nav item instead of living inside "Masmorras" as just another NavItem,
// so a new player's eye lands on it first without needing a tutorial arrow.
function HeroNavItem({ active, onClick, children, icon }: {
  active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-2 rounded-md border-2 py-2.5 font-display font-bold uppercase tracking-wider text-sm transition-transform hover:scale-[1.03] active:scale-[0.98] ${
        active
          ? 'border-gold bg-gradient-to-b from-gold/30 to-gold/10 text-gold'
          : 'border-gold/70 bg-gradient-to-b from-gold/20 to-transparent text-gold'
      }`}
      style={{ animation: 'sidebarHeroGlow 2.4s ease-in-out infinite' }}
    >
      {icon}
      {children}
    </button>
  );
}

function NavItem({ active, onClick, children, title, icon, dot }: {
  active: boolean; onClick: () => void; children: React.ReactNode; title?: string; icon: React.ReactNode; dot?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-full flex items-center gap-2.5 text-left px-4 py-2 md:py-1.5 text-sm border-l-2 transition-all ${
        active
          ? 'border-gold text-gold bg-gradient-to-r from-gold/15 to-transparent'
          : 'border-transparent text-parchment/70 hover:text-parchment hover:bg-white/5 hover:border-gold/40 hover:pl-[18px]'
      }`}
    >
      <span className={`relative shrink-0 ${active ? 'text-gold drop-shadow-[0_0_4px_rgba(212,175,55,0.6)]' : 'text-parchment/40'}`}>
        {icon}
        {dot && (
          <span
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gold shadow-[0_0_4px_rgba(212,175,55,0.9)]"
            style={{ animation: 'attentionDotPulse 1.4s ease-in-out infinite' }}
          />
        )}
      </span>
      <span className="truncate">{children}</span>
    </button>
  );
}
