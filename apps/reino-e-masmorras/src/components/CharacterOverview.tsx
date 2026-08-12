import { Character, Weapon } from '../types/game';
import { CLASSES } from '../lib/classes';
import { fmt } from '../lib/format';
import { rarityColor, rarityName } from '../lib/equipment';
import { Panel } from './Panel';

interface Props {
  character: Character;
  onEquip: (weapon: Weapon) => void;
}

export function CharacterOverview({ character: ch, onEquip }: Props) {
  const cls = CLASSES[ch.classId];
  const xpPct = Math.min(100, (ch.xp / ch.xpToNext) * 100);
  const weapon = ch.equipment.weapon;

  return (
    <Panel title="Personagem — Visão Geral">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-4 h-4 rounded-full inline-block" style={{ background: cls.color }} />
        <div>
          <div className="font-bold text-lg text-parchment">{ch.name}</div>
          <div className="text-parchment/50 text-sm">{cls.name} · Nível {ch.level}</div>
        </div>
        {ch.skillPoints > 0 && (
          <span className="ml-auto text-xs bg-gold/20 border border-gold/50 text-gold rounded-full px-3 py-1 font-bold">
            {ch.skillPoints} ponto{ch.skillPoints > 1 ? 's' : ''} de habilidade disponível{ch.skillPoints > 1 ? 'is' : ''}
          </span>
        )}
      </div>

      <div className="text-xs text-parchment/50 mb-1">Experiência: {fmt(ch.xp)}/{fmt(ch.xpToNext)}</div>
      <div className="h-2.5 bg-black/50 rounded-sm mb-4 border border-black/40">
        <div className="h-full bg-sky-500 rounded-sm" style={{ width: `${xpPct}%` }} />
      </div>

      <dl className="grid grid-cols-2 gap-y-2 text-sm mb-5">
        <Row label="Vida" value={`${fmt(ch.hp)} / ${fmt(ch.maxHp)}`} />
        <Row label="Ataque" value={fmt(ch.atk)} />
        <Row label="Defesa" value={fmt(ch.def)} />
        <Row label="Ouro" value={fmt(ch.gold)} />
        <Row label="Poções" value={fmt(ch.potions)} />
        <Row label="Maior profundidade" value={fmt(ch.bestDepth)} />
      </dl>

      <h3 className="font-display text-gold/90 text-xs uppercase tracking-[0.15em] mb-2">Equipamento</h3>
      {weapon ? (
        <div className="rounded border px-3 py-2 mb-4" style={{ borderColor: rarityColor(weapon.rarity) }}>
          <div className="font-bold" style={{ color: rarityColor(weapon.rarity) }}>{weapon.name}</div>
          <div className="text-xs text-parchment/50">
            {rarityName(weapon.rarity)} · +{weapon.dmgBonus} dano
            {weapon.secondaryStat && weapon.secondaryStat.type === 'crit' && ` · +${Math.round(weapon.secondaryStat.value * 100)}% crítico`}
            {weapon.secondaryStat && weapon.secondaryStat.type === 'def' && ` · +${weapon.secondaryStat.value} defesa`}
          </div>
        </div>
      ) : (
        <p className="text-parchment/40 text-sm mb-4 italic">Nenhuma arma equipada — golpes desarmados apenas.</p>
      )}

      <h3 className="font-display text-gold/90 text-xs uppercase tracking-[0.15em] mb-2">Inventário</h3>
      {ch.inventory.length === 0 ? (
        <p className="text-parchment/40 text-sm italic">Vazio. Derrote inimigos nas masmorras para encontrar armas.</p>
      ) : (
        <ul className="space-y-1.5">
          {ch.inventory.map((w) => (
            <li key={w.id} className="flex items-center justify-between rounded border border-panelborder/60 bg-panel2/50 px-3 py-1.5">
              <div>
                <span className="font-bold text-sm" style={{ color: rarityColor(w.rarity) }}>{w.name}</span>
                <span className="text-xs text-parchment/40 ml-2">{rarityName(w.rarity)} · +{w.dmgBonus} dano</span>
              </div>
              <button onClick={() => onEquip(w)} className="text-xs px-3 py-1 bg-gold text-ink rounded font-bold hover:brightness-110 shrink-0">
                Equipar
              </button>
            </li>
          ))}
        </ul>
      )}
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
