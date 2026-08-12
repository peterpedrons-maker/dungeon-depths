import { useState } from 'react';
import { Character, EquipmentItem, ItemSlot } from '../types/game';
import { CLASSES } from '../lib/classes';
import { effectiveMaxHp } from '../lib/combatStats';
import { fmt } from '../lib/format';
import { rarityColor, rarityName, sellValue, SLOT_NAMES } from '../lib/equipment';
import { Panel } from './Panel';
import { SmallButton } from './Button';
import { Modal } from './Modal';
import { IconSword, IconChest, IconLegs, IconGloves, IconRing } from './icons';
import slotFrame from '../assets/slot-equipamento.webp';

const SLOTS: ItemSlot[] = ['weapon', 'body', 'legs', 'hands', 'accessory'];
const SLOT_ICON: Record<ItemSlot, typeof IconSword> = {
  weapon: IconSword, body: IconChest, legs: IconLegs, hands: IconGloves, accessory: IconRing,
};
// Classic RPG paperdoll arrangement: accessory up top, weapon/hands flanking
// the body piece, legs below.
const SLOT_AREA: Record<ItemSlot, string> = {
  accessory: '1 / 2 / 2 / 3',
  hands: '2 / 1 / 3 / 2', body: '2 / 2 / 3 / 3', weapon: '2 / 3 / 3 / 4',
  legs: '3 / 2 / 4 / 3',
};

interface Props {
  character: Character;
  onEquip: (item: EquipmentItem) => void;
  onUnequip: (slot: ItemSlot) => void;
  onSell: (item: EquipmentItem) => void;
}

type Selected = { kind: 'equipped'; slot: ItemSlot; item: EquipmentItem | null } | { kind: 'inventory'; item: EquipmentItem };

export function CharacterOverview({ character: ch, onEquip, onUnequip, onSell }: Props) {
  const cls = CLASSES[ch.classId];
  const xpPct = Math.min(100, (ch.xp / ch.xpToNext) * 100);
  const maxHp = effectiveMaxHp(ch);
  const [selected, setSelected] = useState<Selected | null>(null);

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
      <div
        className="grid gap-3 mx-auto mb-6 max-w-[300px]"
        style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)' }}
      >
        {SLOTS.map((slot) => {
          const item = ch.equipment[slot];
          const Icon = SLOT_ICON[slot];
          const color = item ? rarityColor(item.rarity) : '#4a4038';
          return (
            <button
              key={slot}
              onClick={() => setSelected({ kind: 'equipped', slot, item })}
              style={{ gridArea: SLOT_AREA[slot] }}
              className="relative aspect-square transition-transform duration-150 hover:scale-105"
            >
              {item && (
                <div
                  className="absolute inset-[16%] rounded-full"
                  style={{ boxShadow: `0 0 10px 2px ${color}99`, background: `${color}22` }}
                />
              )}
              <div className="absolute inset-[17%] flex items-center justify-center">
                <Icon className="w-full h-full" style={{ color }} />
              </div>
              <img src={slotFrame} alt="" className="absolute inset-0 w-full h-full pointer-events-none select-none" draggable={false} />
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-wide text-parchment/50 bg-nightsky/90 px-1 rounded-sm leading-tight whitespace-nowrap">
                {SLOT_NAMES[slot]}
              </span>
            </button>
          );
        })}
      </div>

      <h3 className="font-display text-gold/90 text-xs uppercase tracking-[0.15em] mb-2">Inventário</h3>
      {ch.inventory.length === 0 ? (
        <p className="text-parchment/40 text-sm italic">Vazio. Derrote inimigos nas masmorras para encontrar equipamentos.</p>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {ch.inventory.map((item) => {
            const Icon = SLOT_ICON[item.slot];
            const color = rarityColor(item.rarity);
            return (
              <button
                key={item.id}
                onClick={() => setSelected({ kind: 'inventory', item })}
                className="relative aspect-square transition-transform duration-150 hover:scale-105"
              >
                <div className="absolute inset-[16%] rounded-full" style={{ boxShadow: `0 0 10px 2px ${color}99`, background: `${color}22` }} />
                <div className="absolute inset-[17%] flex items-center justify-center">
                  <Icon className="w-full h-full" style={{ color }} />
                </div>
                <img src={slotFrame} alt="" className="absolute inset-0 w-full h-full pointer-events-none select-none" draggable={false} />
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <ItemModal
          selected={selected}
          onClose={() => setSelected(null)}
          onEquip={(item) => { onEquip(item); setSelected(null); }}
          onUnequip={(slot) => { onUnequip(slot); setSelected(null); }}
          onSell={(item) => { onSell(item); setSelected(null); }}
        />
      )}
    </Panel>
  );
}

function ItemModal({ selected, onClose, onEquip, onUnequip, onSell }: {
  selected: Selected;
  onClose: () => void;
  onEquip: (item: EquipmentItem) => void;
  onUnequip: (slot: ItemSlot) => void;
  onSell: (item: EquipmentItem) => void;
}) {
  if (selected.kind === 'equipped' && !selected.item) {
    return (
      <Modal title={SLOT_NAMES[selected.slot]} onClose={onClose}>
        <p className="text-parchment/50 italic">Nenhum item equipado neste slot.</p>
      </Modal>
    );
  }

  const item = selected.item as EquipmentItem;
  return (
    <Modal
      title={SLOT_NAMES[item.slot]}
      onClose={onClose}
      footer={
        selected.kind === 'equipped' ? (
          <SmallButton onClick={() => onUnequip(item.slot)}>Desequipar</SmallButton>
        ) : (
          <>
            <SmallButton onClick={() => onEquip(item)}>Equipar</SmallButton>
            <SmallButton onClick={() => onSell(item)} variant="ghost">Vender ({sellValue(item)} ouro)</SmallButton>
          </>
        )
      }
    >
      <div className="font-bold text-base" style={{ color: rarityColor(item.rarity) }}>{item.name}</div>
      <div className="text-xs text-parchment/50">{rarityName(item.rarity)}</div>
      <ul className="text-sm space-y-0.5 pt-1">
        {item.dmgBonus > 0 && <li>+{item.dmgBonus} dano</li>}
        {item.defBonus > 0 && <li>+{item.defBonus} defesa</li>}
        {item.hpBonus > 0 && <li>+{item.hpBonus} vida máxima</li>}
        {item.secondaryStat && <li>{secondaryStatLabel(item)}</li>}
      </ul>
    </Modal>
  );
}

function secondaryStatLabel(item: EquipmentItem): string {
  const s = item.secondaryStat!;
  if (s.type === 'crit') return `+${Math.round(s.value * 100)}% chance de crítico`;
  if (s.type === 'block') return `+${Math.round(s.value * 100)}% chance de bloqueio`;
  if (s.type === 'def') return `+${s.value} defesa`;
  return `+${s.value} vida máxima`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-parchment/50">{label}</dt>
      <dd className="text-parchment font-bold text-right">{value}</dd>
    </>
  );
}
