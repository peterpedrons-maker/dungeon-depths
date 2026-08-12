import { Character } from '../types/game';
import { CLASSES } from '../lib/classes';
import { fmt } from '../lib/format';

export function TopBar({ character: ch }: { character: Character }) {
  const cls = CLASSES[ch.classId];
  const hpPct = Math.max(0, Math.min(100, (ch.hp / ch.maxHp) * 100));
  const xpPct = Math.max(0, Math.min(100, (ch.xp / ch.xpToNext) * 100));

  return (
    <header className="flex items-center gap-5 px-4 py-2 bg-panel border-b-2 border-panelborder text-sm flex-wrap">
      <div className="flex items-center gap-2 shrink-0">
        <span className="w-3 h-3 rounded-full inline-block" style={{ background: cls.color }} />
        <span className="font-bold text-parchment">{ch.name}</span>
        <span className="text-parchment/50">Nv. {ch.level}</span>
      </div>

      <Stat label="Ouro" value={fmt(ch.gold)} color="text-gold" />
      <Stat label="Poções" value={fmt(ch.potions)} color="text-emerald-400" />

      <Bar label="Vida" cur={ch.hp} max={ch.maxHp} pct={hpPct} barColor="bg-red-600" />
      <Bar label="XP" cur={ch.xp} max={ch.xpToNext} pct={xpPct} barColor="bg-sky-500" />
    </header>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="text-parchment/40 text-xs uppercase tracking-wide">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}

function Bar({ label, cur, max, pct, barColor }: { label: string; cur: number; max: number; pct: number; barColor: string }) {
  return (
    <div className="flex items-center gap-2 shrink-0 min-w-[140px]">
      <span className="text-parchment/40 text-xs uppercase tracking-wide">{label}</span>
      <div className="w-24 h-2.5 bg-black/50 rounded-sm overflow-hidden border border-black/40">
        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-parchment/70 text-xs tabular-nums">{fmt(cur)}/{fmt(max)}</span>
    </div>
  );
}
