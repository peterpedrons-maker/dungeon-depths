import { useState } from 'react';
import { Character } from '../types/game';
import { CLASSES, MAX_LEVEL } from '../lib/classes';
import { effectiveMaxHp } from '../lib/combatStats';
import { TITLES } from '../lib/titles';
import { fmt } from '../lib/format';
import { CLASS_ICON } from '../lib/classIcons';
import { playClickSfx, isMuted, toggleMuted } from '../lib/audio';
import { IconGear, IconSpeaker, IconSpeakerMuted, IconRestart, IconDoorExit } from './icons';
import moedaIcon from '../assets/moeda.webp';
import pocaoIcon from '../assets/pocao.webp';

interface Props {
  character: Character;
  accentColor?: string;
  onAbandon: () => void;
  onSignOut: () => void;
}

// With the Sidebar gone, this is the one place left for the handful of
// account-level actions (sound, abandon hero, sign out) that used to live
// in its footer — tucked behind a gear icon instead of laid out permanently,
// since none of them are things a player reaches for during normal play.
export function TopBar({ character: ch, accentColor, onAbandon, onSignOut }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [muted, setMutedState] = useState(isMuted());
  const toggleSound = () => setMutedState(toggleMuted());
  const cls = CLASSES[ch.classId];
  const avatarColor = accentColor ?? cls.color;
  const maxHp = effectiveMaxHp(ch);
  const hpPct = Math.max(0, Math.min(100, (ch.hp / maxHp) * 100));
  const xpPct = Math.max(0, Math.min(100, (ch.xp / ch.xpToNext) * 100));
  const maxed = ch.level >= MAX_LEVEL;
  // Re-validated live, not just trusted from storage — a title can only be
  // shown while its condition still holds (it always will once earned,
  // since every condition in lib/titles.ts is monotonic, but this is the
  // one place a stale/renamed id from an old save would otherwise leak
  // through as a blank equipped-but-unknown title).
  const equippedTitle = ch.equippedTitle ? TITLES.find((t) => t.id === ch.equippedTitle && t.condition(ch)) : undefined;

  return (
    <header className="relative bg-panel border-b-2 border-gold/40 px-3 sm:px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        <span
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full shrink-0 ring-2 ring-gold/60 overflow-hidden flex items-center justify-center"
          style={{ background: avatarColor, boxShadow: `0 0 10px 2px ${avatarColor}80` }}
        >
          <img src={CLASS_ICON[ch.classId]} alt={cls.name} className="w-full h-full object-cover" draggable={false} />
        </span>

        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`font-display font-bold tracking-wide truncate ${accentColor ? '' : 'text-parchment'}`}
              style={accentColor ? { color: accentColor } : undefined}
            >
              {ch.name}
            </span>
            {ch.ironMode && (
              <span className="text-crimson text-[10px] font-bold uppercase tracking-wide shrink-0" title="Modo Ferro — morte é permanente">
                ☠ Ferro
              </span>
            )}
            <span className="text-gold/70 text-xs font-bold shrink-0">Nv. {ch.level}</span>
          </div>
          {equippedTitle && <p className="text-[10px] text-gold/60 italic truncate leading-tight">{equippedTitle.name}</p>}
        </div>

        <div className="ml-auto flex items-center gap-3 shrink-0">
          <Stat icon={<img src={moedaIcon} alt="" className="w-5 h-5 shrink-0" />} value={fmt(ch.gold)} color="text-gold" />
          <Stat icon={<img src={pocaoIcon} alt="" className="w-4 h-5 shrink-0" />} value={fmt(ch.potions)} color="text-emerald-400" />
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-parchment/50 hover:text-gold hover:bg-black/25 transition shrink-0"
            aria-label="Configurações"
          >
            <IconGear className="w-4 h-4" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden />
          <div className="absolute right-2 sm:right-3 top-full mt-1.5 z-50 w-52 rounded-sm border border-gold/40 bg-panel shadow-[0_10px_30px_rgba(0,0,0,0.6)] overflow-hidden">
            <MenuAction
              icon={muted ? <IconSpeakerMuted className="w-4 h-4" /> : <IconSpeaker className="w-4 h-4" />}
              onClick={() => { playClickSfx(); toggleSound(); }}
            >
              {muted ? 'Som Desativado' : 'Som Ativado'}
            </MenuAction>
            <MenuAction
              icon={<IconRestart className="w-4 h-4" />}
              onClick={() => { playClickSfx(); setMenuOpen(false); onAbandon(); }}
            >
              Abandonar Herói / Novo Jogo
            </MenuAction>
            <MenuAction
              icon={<IconDoorExit className="w-4 h-4" />}
              onClick={() => { playClickSfx(); setMenuOpen(false); onSignOut(); }}
            >
              Sair da Conta
            </MenuAction>
          </div>
        </>
      )}

      <div className="flex items-center gap-4 mt-2">
        <Bar icon={<HeartIcon />} cur={ch.hp} max={maxHp} pct={hpPct} barColor="bg-red-600" />
        {maxed ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <StarIcon />
            <span className="text-gold text-[11px] font-bold uppercase tracking-wider">Nível Máximo</span>
          </div>
        ) : (
          <Bar icon={<StarIcon />} cur={ch.xp} max={ch.xpToNext} pct={xpPct} barColor="bg-sky-500" />
        )}
      </div>
    </header>
  );
}

function MenuAction({ icon, onClick, children }: { icon: React.ReactNode; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-display uppercase tracking-wide text-parchment/70 hover:bg-black/25 hover:text-parchment transition border-b border-black/30 last:border-b-0"
    >
      <span className="text-gold/70 shrink-0">{icon}</span>
      {children}
    </button>
  );
}

function Stat({ icon, value, color }: { icon: React.ReactNode; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {icon}
      <span className={`font-bold tabular-nums text-sm ${color}`}>{value}</span>
    </div>
  );
}

function Bar({ icon, cur, max, pct, barColor }: { icon: React.ReactNode; cur: number; max: number; pct: number; barColor: string }) {
  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      {icon}
      <div className="flex-1 h-2.5 bg-black/50 rounded-sm overflow-hidden border border-black/40">
        <div className={`h-full ${barColor} transition-[width] duration-300`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-parchment/70 text-[11px] tabular-nums shrink-0">{fmt(cur)}/{fmt(max)}</span>
    </div>
  );
}

function HeartIcon() {
  return (
    <span className="relative w-3 h-3 shrink-0 rotate-45 bg-red-600 rounded-[2px] block">
      <span className="absolute -top-1.5 left-0 w-3 h-3 bg-red-600 rounded-full" />
      <span className="absolute top-0 -left-1.5 w-3 h-3 bg-red-600 rounded-full" />
    </span>
  );
}
function StarIcon() {
  return <span className="w-3 h-3 bg-sky-400 shrink-0" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />;
}
