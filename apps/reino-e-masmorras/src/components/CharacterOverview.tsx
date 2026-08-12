import { Character, EquipmentItem, ItemSlot } from '../types/game';
import { CLASSES } from '../lib/classes';
import { effectiveMaxHp } from '../lib/combatStats';
import { fmt } from '../lib/format';
import { rarityColor, rarityName, sellValue, SLOT_NAMES } from '../lib/equipment';
import { Panel } from './Panel';
import { SmallButton } from './Button';

const SLOTS: ItemSlot[] = ['weapon', 'body', 'legs', 'hands', 'accessory'];

interface Props {
  character: Character;
  onEquip: (item: EquipmentItem) => void;
  onSell: (item: EquipmentItem) => void;
}

export function CharacterOverview({ character: ch, onEquip, onSell }: Props) {
  const cls = CLASSES[ch.classId];
  const xpPct = Math.min(100, (ch.xp / ch.xpToNext) * 100);
  const maxHp = effectiveMaxHp(ch);

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
        <Row label="Vida" value={`${fmt(ch.hp)} / ${fmt(maxHp)}`} />
        <Row label="Ataque" value={fmt(ch.atk)} />
        <Row label="Defesa" value={fmt(ch.def)} />
        <Row label="Ouro" value={fmt(ch.gold)} />
        <Row label="Poções" value={fmt(ch.potions)} />
        <Row label="Maior profundidade" value={fmt(ch.bestDepth)} />
      </dl>

      <h3 className="font-display text-gold/90 text-xs uppercase tracking-[0.15em] mb-2">Equipamento</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
        {SLOTS.map((slot) => {
          const item = ch.equipment[slot];
          return (
            <div key={slot} className="rounded border border-panelborder/60 bg-panel2/40 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-parchment/40 mb-0.5">{SLOT_NAMES[slot]}</div>
              {item ? (
                <>
                  <div className="font-bold text-sm" style={{ color: rarityColor(item.rarity) }}>{item.name}</div>
                  <div className="text-xs text-parchment/50">{itemStatSummary(item)}</div>
                </>
              ) : (
                <div className="text-parchment/40 text-sm italic">Vazio</div>
              )}
            </div>
          );
        })}
      </div>

      <h3 className="font-display text-gold/90 text-xs uppercase tracking-[0.15em] mb-2">Inventário</h3>
      {ch.inventory.length === 0 ? (
        <p className="text-parchment/40 text-sm italic">Vazio. Derrote inimigos nas masmorras para encontrar equipamentos.</p>
      ) : (
        <ul className="space-y-1.5">
          {ch.inventory.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 rounded border border-panelborder/60 bg-panel2/50 px-3 py-1.5">
              <div className="min-w-0">
                <span className="font-bold text-sm" style={{ color: rarityColor(item.rarity) }}>{item.name}</span>
                <span className="text-xs text-parchment/40 ml-2">{SLOT_NAMES[item.slot]} · {itemStatSummary(item)}</span>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <SmallButton onClick={() => onEquip(item)}>Equipar</SmallButton>
                <SmallButton onClick={() => onSell(item)} variant="ghost">Vender ({sellValue(item)})</SmallButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function itemStatSummary(item: EquipmentItem): string {
  const parts = [rarityName(item.rarity)];
  if (item.dmgBonus > 0) parts.push(`+${item.dmgBonus} dano`);
  if (item.defBonus > 0) parts.push(`+${item.defBonus} defesa`);
  if (item.hpBonus > 0) parts.push(`+${item.hpBonus} vida`);
  if (item.secondaryStat) {
    const s = item.secondaryStat;
    if (s.type === 'crit') parts.push(`+${Math.round(s.value * 100)}% crítico`);
    else if (s.type === 'block') parts.push(`+${Math.round(s.value * 100)}% bloqueio`);
    else if (s.type === 'def') parts.push(`+${s.value} defesa`);
    else parts.push(`+${s.value} vida`);
  }
  return parts.join(' · ');
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-parchment/50">{label}</dt>
      <dd className="text-parchment font-bold text-right">{value}</dd>
    </>
  );
}
