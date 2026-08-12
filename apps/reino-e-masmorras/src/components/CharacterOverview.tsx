import { useState } from 'react';
import { Character, EquipmentItem, ItemSlot } from '../types/game';
import { CLASSES } from '../lib/classes';
import { effectiveMaxHp } from '../lib/combatStats';
import { fmt } from '../lib/format';
import { rarityColor, rarityName, sellValue, SLOT_NAMES } from '../lib/equipment';
import { Panel } from './Panel';
import { SmallButton } from './Button';
import { Modal } from './Modal';
import { StatChip } from './StatChip';
import { IconSword, IconChest, IconLegs, IconGloves, IconRing, IconHeart, IconPassive, IconCoin, IconStairs } from './icons';
import slotFrame from '../assets/slot-equipamento.webp';
import pocaoIcon from '../assets/pocao.webp';

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
  const [filter, setFilter] = useState<'all' | ItemSlot>('all');
  const visibleInventory = filter === 'all' ? ch.inventory : ch.inventory.filter((i) => i.slot === filter);

  return (
    <Panel title="Personagem — Visão Geral">
      <div className="flex items-center gap-3 mb-4">
        <span
          className="w-11 h-11 rounded-full shrink-0 ring-2 ring-gold/60"
          style={{ background: cls.color, boxShadow: `0 0 12px 3px ${cls.color}80` }}
        />
        <div>
          <div className="font-bold text-lg text-parchment leading-tight">{ch.name}</div>
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

      <div className="grid grid-cols-3 gap-2 mb-6">
        <StatChip icon={<IconHeart className="w-full h-full" />} color="#e0574a" label="Vida" value={`${fmt(ch.hp)}/${fmt(maxHp)}`} />
        <StatChip icon={<IconSword className="w-full h-full" />} color="#c89a2e" label="Ataque" value={fmt(ch.atk)} />
        <StatChip icon={<IconPassive className="w-full h-full" />} color="#6b8fc9" label="Defesa" value={fmt(ch.def)} />
        <StatChip icon={<IconCoin className="w-full h-full" />} color="#e0b93c" label="Ouro" value={fmt(ch.gold)} />
        <StatChip icon={<img src={pocaoIcon} alt="" className="w-full h-full object-contain" />} color="#4f9d4f" label="Poções" value={fmt(ch.potions)} />
        <StatChip icon={<IconStairs className="w-full h-full" />} color="#9b6fc9" label="Profundidade" value={fmt(ch.bestDepth)} />
      </div>

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

      <div className="flex items-center justify-between mb-2 gap-3">
        <h3 className="font-display text-gold/90 text-xs uppercase tracking-[0.15em]">Inventário</h3>
        <span className="text-[10px] text-parchment/40 shrink-0">{ch.inventory.length} item{ch.inventory.length !== 1 ? 's' : ''}</span>
      </div>

      {ch.inventory.length > 0 && (
        <div className="flex gap-1.5 mb-2 flex-wrap">
          <FilterTab active={filter === 'all'} onClick={() => setFilter('all')}>Todos</FilterTab>
          {SLOTS.map((slot) => (
            <FilterTab key={slot} active={filter === slot} onClick={() => setFilter(slot)}>{SLOT_NAMES[slot]}</FilterTab>
          ))}
        </div>
      )}

      {ch.inventory.length === 0 ? (
        <p className="text-parchment/40 text-sm italic">Vazio. Derrote inimigos nas masmorras para encontrar equipamentos.</p>
      ) : (
        <div className="rounded border border-black/50 bg-black/25 p-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
          {visibleInventory.length === 0 ? (
            <p className="text-parchment/40 text-sm italic text-center py-4">Nenhum item nessa categoria.</p>
          ) : (
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5 max-h-72 overflow-y-auto pr-0.5">
              {visibleInventory.map((item) => {
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

function FilterTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide transition ${
        active ? 'bg-gold text-ink' : 'bg-panel2 text-parchment/50 hover:text-parchment hover:bg-panel2/80'
      }`}
    >
      {children}
    </button>
  );
}

