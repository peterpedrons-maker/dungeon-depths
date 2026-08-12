import { Character } from '../types/game';
import { CLASSES } from '../lib/classes';
import { fmt } from '../lib/format';
import { Panel } from './Panel';

export function CharacterOverview({ character: ch }: { character: Character }) {
  const cls = CLASSES[ch.classId];
  const xpPct = Math.min(100, (ch.xp / ch.xpToNext) * 100);

  return (
    <Panel title="Personagem — Visão Geral">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-4 h-4 rounded-full inline-block" style={{ background: cls.color }} />
        <div>
          <div className="font-bold text-lg text-parchment">{ch.name}</div>
          <div className="text-parchment/50 text-sm">{cls.name} · Nível {ch.level}</div>
        </div>
      </div>

      <div className="text-xs text-parchment/50 mb-1">Experiência: {fmt(ch.xp)}/{fmt(ch.xpToNext)}</div>
      <div className="h-2.5 bg-black/50 rounded-sm mb-4 border border-black/40">
        <div className="h-full bg-sky-500 rounded-sm" style={{ width: `${xpPct}%` }} />
      </div>

      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <Row label="Vida" value={`${fmt(ch.hp)} / ${fmt(ch.maxHp)}`} />
        <Row label="Ataque" value={fmt(ch.atk)} />
        <Row label="Defesa" value={fmt(ch.def)} />
        <Row label="Ouro" value={fmt(ch.gold)} />
        <Row label="Poções" value={fmt(ch.potions)} />
        <Row label="Maior profundidade" value={fmt(ch.bestDepth)} />
        {cls.critChance >= 0.15 && <Row label="Crítico" value={`${Math.round(cls.critChance * 100)}%`} />}
        {cls.lifesteal > 0 && <Row label="Roubo de vida" value={`${Math.round(cls.lifesteal * 100)}%`} />}
      </dl>
    </Panel>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-parchment/50">{label}</dt>
      <dd className="text-parchment font-bold text-right">{value}</dd>
    </>
  );
}
