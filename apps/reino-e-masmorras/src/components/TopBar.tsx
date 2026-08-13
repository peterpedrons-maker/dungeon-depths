import { Character } from '../types/game';
import { CLASSES, MAX_LEVEL } from '../lib/classes';
import { effectiveMaxHp } from '../lib/combatStats';
import { fmt } from '../lib/format';
import moedaIcon from '../assets/moeda.webp';
import pocaoIcon from '../assets/pocao.webp';

export function TopBar({ character: ch, onMenuClick }: { character: Character; onMenuClick: () => void }) {
  const cls = CLASSES[ch.classId];
  const maxHp = effectiveMaxHp(ch);
  const hpPct = Math.max(0, Math.min(100, (ch.hp / maxHp) * 100));
  const xpPct = Math.max(0, Math.min(100, (ch.xp / ch.xpToNext) * 100));
  const maxed = ch.level >= MAX_LEVEL;

  return (
    <header className="bg-panel border-b-2 border-gold/40 px-3 sm:px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        <button onClick={onMenuClick} className="md:hidden flex flex-col justify-center gap-1 w-7 h-7 shrink-0" aria-label="Abrir menu">
          <span className="block w-5 h-0.5 bg-parchment" />
          <span className="block w-5 h-0.5 bg-parchment" />
          <span className="block w-5 h-0.5 bg-parchment" />
        </button>

        <span
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full shrink-0 ring-2 ring-gold/60"
          style={{ background: cls.color, boxShadow: `0 0 10px 2px ${cls.color}80` }}
        />

        <div className="min-w-0 flex items-baseline gap-1.5">
          <span className="font-display font-bold text-parchment tracking-wide truncate">{ch.name}</span>
          <span className="text-gold/70 text-xs font-bold shrink-0">Nv. {ch.level}</span>
        </div>

        <div className="ml-auto flex items-center gap-3 shrink-0">
          <Stat icon={<img src={moedaIcon} alt="" className="w-5 h-5 shrink-0" />} value={fmt(ch.gold)} color="text-gold" />
          <Stat icon={<img src={pocaoIcon} alt="" className="w-4 h-5 shrink-0" />} value={fmt(ch.potions)} color="text-emerald-400" />
        </div>
      </div>

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
