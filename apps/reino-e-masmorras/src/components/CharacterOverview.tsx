import { useState } from 'react';
import { AttributeKey, Character, EquipmentItem, ItemSlot } from '../types/game';
import { CLASSES } from '../lib/classes';
import { computeCombatStats } from '../lib/combatStats';
import { fmt } from '../lib/format';
import { rarityColor, rarityName, sellValue, SLOT_NAMES } from '../lib/equipment';
import { OFFHAND_KIND } from '../lib/itemTiers';
import { computeAttributeTotals } from '../lib/skills';
import { heroSprites } from '../game/sprites';
import { Panel } from './Panel';
import { SmallButton } from './Button';
import { Modal } from './Modal';
import { IconSword, IconChest, IconLegs, IconGloves, IconShield, IconRing } from './icons';
import slotFrame from '../assets/slot-equipamento.webp';

const ATTR_META: Record<AttributeKey, { label: string; color: string }> = {
  str: { label: 'Força', color: '#c1502e' },
  dex: { label: 'Destreza', color: '#4f9d4f' },
  agi: { label: 'Agilidade', color: '#4fb8b0' },
  vit: { label: 'Vitalidade', color: '#c9863c' },
  int: { label: 'Inteligência', color: '#3f7ab8' },
  wis: { label: 'Sabedoria', color: '#9b6fc9' },
  luk: { label: 'Sorte', color: '#e0b93c' },
};
const ATTR_ORDER: AttributeKey[] = ['str', 'dex', 'agi', 'vit', 'int', 'wis', 'luk'];

const SLOTS: ItemSlot[] = ['weapon', 'body', 'legs', 'hands', 'offhand', 'accessory'];
const SLOT_ICON: Record<ItemSlot, typeof IconSword> = {
  weapon: IconSword, body: IconChest, legs: IconLegs, hands: IconGloves, offhand: IconShield, accessory: IconRing,
};
// WoW-style paperdoll: gear slots stacked in two vertical columns flanking
// the character portrait, instead of arranged around it in a cross. Offhand
// only joins the left column for classes that actually have one to equip
// (see OFFHAND_KIND) — a class with a two-handed weapon or dual-wield never
// shows an unusable empty slot.
const LEFT_SLOTS: ItemSlot[] = ['weapon', 'hands'];
const RIGHT_SLOTS: ItemSlot[] = ['body', 'legs', 'accessory'];

interface Props {
  character: Character;
  onEquip: (item: EquipmentItem) => void;
  onUnequip: (slot: ItemSlot) => void;
  onSell: (item: EquipmentItem) => void;
  onAllocateAttr: (key: AttributeKey) => void;
}

type Selected = { kind: 'equipped'; slot: ItemSlot; item: EquipmentItem | null } | { kind: 'inventory'; item: EquipmentItem };

export function CharacterOverview({ character: ch, onEquip, onUnequip, onSell, onAllocateAttr }: Props) {
  const cls = CLASSES[ch.classId];
  const attrs = computeAttributeTotals(ch.classId, ch.allocatedAttrs);
  const stats = computeCombatStats(ch);
  const heroImg = heroSprites(ch.classId).idle.image.src;
  const [tab, setTab] = useState<'equipamentos' | 'inventario'>('equipamentos');
  const [selected, setSelected] = useState<Selected | null>(null);
  const [filter, setFilter] = useState<'all' | ItemSlot>('all');
  const visibleInventory = filter === 'all' ? ch.inventory : ch.inventory.filter((i) => i.slot === filter);
  const hasOffhand = !!OFFHAND_KIND[ch.classId];
  const paperdollLeftSlots: ItemSlot[] = hasOffhand ? ['weapon', 'offhand', 'hands'] : LEFT_SLOTS;
  const visibleSlots = hasOffhand ? SLOTS : SLOTS.filter((s) => s !== 'offhand');

  const slotButton = (slot: ItemSlot) => {
    const item = ch.equipment[slot];
    const Icon = SLOT_ICON[slot];
    const color = item ? rarityColor(item.rarity) : '#4a4038';
    return (
      <button
        key={slot}
        onClick={() => setSelected({ kind: 'equipped', slot, item })}
        className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 transition-transform duration-150 hover:scale-105"
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
      </button>
    );
  };

  return (
    <Panel title="Personagem">
      {/* Sub-tabs replace the old static "Visão Geral" title — the avatar,
          name, level and XP bar already live in the TopBar above, so this
          screen no longer repeats them. */}
      <div className="flex gap-2 mb-3">
        <MainTab active={tab === 'equipamentos'} onClick={() => setTab('equipamentos')}>Equipamentos</MainTab>
        <MainTab active={tab === 'inventario'} onClick={() => setTab('inventario')}>Inventário</MainTab>
      </div>

      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <span className="text-parchment/50 text-sm">{cls.name}</span>
        <div className="flex items-center gap-2 flex-wrap">
          {ch.skillPoints > 0 && (
            <span className="text-xs bg-gold/20 border border-gold/50 text-gold rounded-full px-3 py-1 font-bold">
              {ch.skillPoints} ponto{ch.skillPoints > 1 ? 's' : ''} de habilidade
            </span>
          )}
          {ch.attributePoints > 0 && (
            <span className="text-xs bg-sky-500/20 border border-sky-400/50 text-sky-300 rounded-full px-3 py-1 font-bold">
              {ch.attributePoints} ponto{ch.attributePoints > 1 ? 's' : ''} de atributo
            </span>
          )}
        </div>
      </div>

      {tab === 'equipamentos' ? (
        <>
          {/* Paperdoll: gear flanks the character portrait, WoW-style. */}
          <div className="rounded border border-black/50 bg-black/25 p-3 mb-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-center gap-3 sm:gap-6">
              <div className="flex flex-col gap-2.5 sm:gap-3.5">{paperdollLeftSlots.map(slotButton)}</div>
              <div className="flex-1 flex items-end justify-center min-h-[180px] sm:min-h-[230px] relative">
                <div
                  className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full blur-2xl opacity-30"
                  style={{ background: cls.color }}
                />
                <img
                  src={heroImg}
                  alt={cls.name}
                  className="relative h-[180px] sm:h-[230px] w-auto object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)]"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="flex flex-col gap-2.5 sm:gap-3.5">{RIGHT_SLOTS.map(slotButton)}</div>
            </div>
          </div>

          {/* Stats box: attributes on the left, physical/magical power on the right. */}
          <div className="rounded border border-black/50 bg-black/25 p-3 mb-4 grid grid-cols-2 gap-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
            <div className="space-y-1 pr-3 border-r border-panelborder/40">
              {ATTR_ORDER.map((key) => {
                const meta = ATTR_META[key];
                return (
                  <div key={key} className="flex items-center justify-between text-xs gap-1.5">
                    <span className="text-parchment/60 truncate">{meta.label}:</span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className="font-bold tabular-nums" style={{ color: meta.color }}>{attrs[key]}</span>
                      {ch.attributePoints > 0 && (
                        <button
                          onClick={() => onAllocateAttr(key)}
                          className="w-4 h-4 flex items-center justify-center rounded-full bg-sky-500/30 border border-sky-400/60 text-sky-300 text-[10px] font-bold leading-none hover:bg-sky-500/50"
                          aria-label={`+1 ${meta.label}`}
                        >
                          +
                        </button>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-gold/80 font-bold mb-0.5">Físico</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-parchment/60">Ataque</span>
                  <span className="font-bold tabular-nums text-parchment">{fmt(stats.atk)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-parchment/60">Defesa</span>
                  <span className="font-bold tabular-nums text-parchment">{fmt(stats.def)}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-gold/80 font-bold mb-0.5">Mágico</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-parchment/60">Ataque</span>
                  <span className="font-bold tabular-nums text-parchment">{fmt(stats.matk)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-parchment/60">Defesa</span>
                  <span className="font-bold tabular-nums text-parchment">{fmt(stats.mdef)}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-gold/80 font-bold mb-0.5">Combate</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-parchment/60">Chance de Crítico</span>
                  <span className="font-bold tabular-nums text-parchment">{Math.round(stats.critChance * 100)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-parchment/60">Dano Crítico</span>
                  <span className="font-bold tabular-nums text-parchment">{Math.round(stats.critDmgMult * 100)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-parchment/60">Bloqueio</span>
                  <span className="font-bold tabular-nums text-parchment">{Math.round(stats.blockChance * 100)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-parchment/60">Evasão</span>
                  <span className="font-bold tabular-nums text-parchment">{Math.round(stats.evasion * 100)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-parchment/60">Precisão</span>
                  <span className="font-bold tabular-nums text-parchment">{Math.round(stats.accuracy * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2 gap-3">
            <span className="text-[10px] text-parchment/40 shrink-0">{ch.inventory.length} item{ch.inventory.length !== 1 ? 's' : ''}</span>
          </div>

          {ch.inventory.length > 0 && (
            <div className="flex gap-1.5 mb-2 flex-wrap">
              <FilterTab active={filter === 'all'} onClick={() => setFilter('all')}>Todos</FilterTab>
              {visibleSlots.map((slot) => (
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
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5 max-h-[28rem] overflow-y-auto pr-0.5">
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
        </>
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
      <div className="text-xs text-parchment/50">{rarityName(item.rarity)} · Tier {item.tier}</div>
      <ul className="text-sm space-y-0.5 pt-1">
        {item.dmgBonus > 0 && <li>+{item.dmgBonus} dano</li>}
        {item.defBonus > 0 && <li>+{item.defBonus} defesa</li>}
        {item.hpBonus > 0 && <li>+{item.hpBonus} vida máxima</li>}
        {item.matkBonus > 0 && <li>+{item.matkBonus} ataque mágico</li>}
        {item.mdefBonus > 0 && <li>+{item.mdefBonus} defesa mágica</li>}
        {item.critChanceBonus > 0 && <li>+{Math.round(item.critChanceBonus * 100)}% chance de crítico</li>}
        {item.critDmgBonus > 0 && <li>+{Math.round(item.critDmgBonus * 100)}% dano crítico</li>}
        {item.secondaryStat && <li>{secondaryStatLabel(item)}</li>}
      </ul>
    </Modal>
  );
}

function secondaryStatLabel(item: EquipmentItem): string {
  const s = item.secondaryStat!;
  if (s.type === 'crit') return `+${Math.round(s.value * 100)}% chance de crítico`;
  if (s.type === 'critDmg') return `+${Math.round(s.value * 100)}% dano crítico`;
  if (s.type === 'block') return `+${Math.round(s.value * 100)}% chance de bloqueio`;
  if (s.type === 'def') return `+${s.value} defesa`;
  if (s.type === 'mdef') return `+${s.value} defesa mágica`;
  if (s.type === 'atk') return `+${s.value} ataque`;
  if (s.type === 'matk') return `+${s.value} ataque mágico`;
  return `+${s.value} vida máxima`;
}

function MainTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 rounded font-display text-xs uppercase tracking-wider font-bold transition ${
        active ? 'bg-gold text-ink' : 'bg-panel2/60 text-parchment/50 hover:text-parchment hover:bg-panel2'
      }`}
    >
      {children}
    </button>
  );
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

