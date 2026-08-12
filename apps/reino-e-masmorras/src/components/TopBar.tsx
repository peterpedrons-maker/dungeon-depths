import { Character } from '../types/game';
import { CLASSES } from '../lib/classes';
import { fmt } from '../lib/format';

export function TopBar({ character: ch }: { character: Character }) {
  const cls = CLASSES[ch.classId];
  const hpPct = Math.max(0, Math.min(100, (ch.hp / ch.maxHp) * 100));
  const xpPct = Math.max(0, Math.min(100, (ch.xp / ch.xpToNext) * 100));

  return (
    <header className="flex items-center gap-5 px-4 py-2 bg-panel border-b-2 border-gold/40 text-sm flex-wrap">
      <div className="flex items-center gap-2 shrink-0">
        <span className="w-3 h-3 rounded-full inline-block ring-2 ring-black/40" style={{ background: cls.color }} />
        <span className="font-display font-bold text-parchment tracking-wide">{ch.name}</span>
        <span className="text-parchment/50 text-xs">Nv. {ch.level}</span>
      </div>

      <Stat icon={<CoinIcon />} value={fmt(ch.gold)} color="text-gold" />
      <Stat icon={<PotionIcon />} value={fmt(ch.potions)} color="text-emerald-400" />

      <Bar icon={<HeartIcon />} cur={ch.hp} max={ch.maxHp} pct={hpPct} barColor="bg-red-600" />
      <Bar icon={<StarIcon />} cur={ch.xp} max={ch.xpToNext} pct={xpPct} barColor="bg-sky-500" />
    </header>
  );
}

function Stat({ icon, value, color }: { icon: React.ReactNode; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {icon}
      <span className={`font-bold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

function Bar({ icon, cur, max, pct, barColor }: { icon: React.ReactNode; cur: number; max: number; pct: number; barColor: string }) {
  return (
    <div className="flex items-center gap-2 shrink-0 min-w-[130px]">
      {icon}
      <div className="w-24 h-2.5 bg-black/50 rounded-sm overflow-hidden border border-black/40">
        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-parchment/70 text-xs tabular-nums">{fmt(cur)}/{fmt(max)}</span>
    </div>
  );
}

function CoinIcon() {
  return <span className="w-3.5 h-3.5 rounded-full bg-gold border border-yellow-800 shadow-[inset_0_-1px_0_rgba(0,0,0,0.35)] shrink-0" />;
}
function PotionIcon() {
  return (
    <span className="relative w-3 h-3.5 shrink-0 block">
      <span className="absolute left-1/2 -translate-x-1/2 -top-0.5 w-1 h-1 bg-emerald-700 rounded-sm" />
      <span className="absolute bottom-0 w-3 h-3 rounded-full rounded-t-sm bg-emerald-500 border border-emerald-800" />
    </span>
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
