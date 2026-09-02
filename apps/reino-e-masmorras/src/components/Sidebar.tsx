import { useState } from 'react';
import { Character, Section } from '../types/game';
import { IconScroll, IconActive, IconSkull, IconCastle, IconHammer, IconTrophy, IconTarget, IconGem, IconBook, IconRibbon, IconSpeaker, IconSpeakerMuted, IconRestart, IconDoorExit } from './icons';
import { playClickSfx, isMuted, toggleMuted } from '../lib/audio';

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

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={onClose} aria-hidden />}
      <nav
        className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto border-r border-gold/25 flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:static md:translate-x-0 md:z-auto md:w-56 md:shrink-0`}
        style={{
          // Dark, flat panel behind every nav "button" below. An earlier
          // version added a repeating hairline pattern to suggest riveted
          // metal seams, but on real phone screens that pattern rendered as
          // visible vertical stripes instead of a subtle texture — a plain
          // two-stop gradient reads as intended everywhere.
          backgroundImage: 'linear-gradient(180deg, #1c150e 0%, #0f0a06 100%)',
          boxShadow: 'inset 6px 0 14px -10px rgba(0,0,0,0.9)',
        }}
      >
        <div className="p-2.5">
          <HeroNavItem
            icon={<IconSkull className="w-5 h-5" />}
            active={section === 'dungeon-select' || section === 'dungeon'}
            onClick={() => nav('dungeon-select')}
          >
            Campanha
          </HeroNavItem>
        </div>

        <Group title="Personagem">
          <NavItem icon={<IconScroll className="w-4 h-4" />} active={section === 'character'} onClick={() => nav('character')} attention={hasAttrPoints ? 'sky' : undefined}>Personagem</NavItem>
          <NavItem icon={<IconActive className="w-4 h-4" />} active={section === 'skills'} onClick={() => nav('skills')} attention={hasSkillPoints ? 'gold' : undefined}>Habilidades</NavItem>
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
          <NavItem icon={<IconHammer className="w-4 h-4" />} active={section === 'buildings'} onClick={() => nav('buildings')}>Mercadores</NavItem>
        </Group>

        <Group title="Ranking">
          <NavItem icon={<IconTrophy className="w-4 h-4" />} active={section === 'highscore'} onClick={() => nav('highscore')}>Colocação</NavItem>
          <NavItem icon={<IconGem className="w-4 h-4" />} active={section === 'prestige-shop'} onClick={() => nav('prestige-shop')}>Loja de Prestígio</NavItem>
        </Group>

        <div className="mt-auto p-3 border-t border-white/5 flex flex-col items-start gap-1.5">
          <button onClick={toggleSound} className="flex items-center gap-1.5 text-xs text-parchment/30 hover:text-parchment/60 transition-colors">
            {muted ? <IconSpeakerMuted className="w-3.5 h-3.5" /> : <IconSpeaker className="w-3.5 h-3.5" />}
            {muted ? 'Som Desativado' : 'Som Ativado'}
          </button>
          <button onClick={abandon} className="flex items-center gap-1.5 text-xs text-parchment/30 hover:text-parchment/60 transition-colors">
            <IconRestart className="w-3.5 h-3.5" />
            Abandonar Herói / Novo Jogo
          </button>
          <button onClick={signOut} className="flex items-center gap-1.5 text-xs text-parchment/30 hover:text-parchment/60 transition-colors">
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
    <div className="mt-3 first:mt-0">
      <div className="mx-3 pb-1.5 mb-1.5 border-b border-white/5 text-gold/45 text-[10px] font-display font-bold uppercase tracking-[0.2em]">{title}</div>
      {children}
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
      className={`w-full flex items-center justify-center gap-2 rounded py-2.5 font-display font-bold uppercase tracking-wider text-sm border transition-transform hover:scale-[1.02] active:scale-[0.98] ${
        active ? 'border-gold text-gold' : 'border-gold/70 text-gold/90'
      }`}
      style={{
        background: 'linear-gradient(180deg, rgba(200,154,46,0.16), rgba(20,16,12,0.85) 70%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -2px 4px rgba(0,0,0,0.6)',
        animation: 'sidebarHeroGlow 2.4s ease-in-out infinite',
      }}
    >
      {icon}
      {children}
    </button>
  );
}

// Riveted-metal pill buttons, one per nav row, instead of the old flat list
// with a left-border highlight — each button is its own beveled plate (light
// hairline on top, dark inset shadow on bottom) with a small diamond stud
// marking its far end, echoing the ornate-but-restrained hardware look of
// Divinity: Original Sin 2's menu rather than the parchment/scroll look used
// inside the panels this nav opens onto.
// `attention` replaces the old small icon-corner dot with a pulsing glow on
// the WHOLE button — per direct user feedback, a 2px dot on a phone screen
// was too easy to miss entirely. Color matches the badge/pill the player
// will see once they get where this points them (gold = skill points/
// Mercador stock, sky = attribute points), so the nav glow and the panel
// notification it leads to read as the same signal.
function NavItem({ active, onClick, children, title, icon, attention }: {
  active: boolean; onClick: () => void; children: React.ReactNode; title?: string; icon: React.ReactNode; attention?: 'gold' | 'sky';
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-full flex items-center gap-2.5 text-left mx-2 mb-1.5 px-3 py-2 md:py-1.5 rounded text-xs font-display uppercase tracking-wider border transition-all ${
        active ? 'border-gold/60 text-gold' : attention ? '' : 'border-black/50 text-parchment/55 hover:border-gold/35 hover:text-parchment/85'
      } ${attention && !active ? (attention === 'sky' ? 'text-sky-200' : 'text-gold/90') : ''}`}
      style={{
        width: 'calc(100% - 1rem)',
        background: active
          ? 'linear-gradient(180deg, rgba(200,154,46,0.16), rgba(20,16,12,0.85) 60%)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.30) 55%, rgba(0,0,0,0.45))',
        boxShadow: active
          ? 'inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 2px rgba(0,0,0,0.5), 0 0 8px rgba(200,154,46,0.18)'
          : attention ? undefined
          : 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 2px rgba(0,0,0,0.65)',
        animation: !active && attention ? `${attention === 'sky' ? 'navAttentionGlowSky' : 'navAttentionGlow'} 1.8s ease-in-out infinite` : undefined,
      }}
    >
      <span className={`relative shrink-0 ${active ? 'text-gold drop-shadow-[0_0_4px_rgba(212,175,55,0.6)]' : attention ? (attention === 'sky' ? 'text-sky-300' : 'text-gold') : 'text-parchment/40'}`}>
        {icon}
      </span>
      <span className="truncate flex-1">{children}</span>
      <span aria-hidden className={`text-[7px] shrink-0 ${active ? 'text-gold/70' : 'text-gold/15'}`}>◆</span>
    </button>
  );
}
