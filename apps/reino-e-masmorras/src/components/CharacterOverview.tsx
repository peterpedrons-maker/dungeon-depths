import { useState } from 'react';
import { AttributeKey, Character, EquipmentItem, ItemSlot } from '../types/game';
import { ATTR_META, ATTR_ORDER, CLASSES } from '../lib/classes';
import { computeCombatStats, effectiveMaxHp } from '../lib/combatStats';
import { fmt } from '../lib/format';
import { rarityColor, rarityName, sellValue, SLOT_NAMES } from '../lib/equipment';
import { enhancedItem, itemDisplayName } from '../lib/enhancement';
import { EnhanceSection } from './EnhanceSection';
import { OFFHAND_KIND } from '../lib/itemTiers';
import { GRID_CELLS, GRID_COLS, GRID_ROWS, SLOT_FOOTPRINT, usedCells } from '../lib/inventoryGrid';
import { computeAttributeTotals } from '../lib/skills';
import { heroSprites } from '../game/sprites';
import { Panel } from './Panel';
import { SmallButton } from './Button';
import { Modal } from './Modal';
import { IconSword, IconChest, IconLegs, IconGloves, IconShield, IconRing } from './icons';
import { ItemIcon } from './ItemIcon';

const SLOTS: ItemSlot[] = ['weapon', 'body', 'legs', 'hands', 'offhand', 'accessory'];
const SLOT_ICON: Record<ItemSlot, typeof IconSword> = {
  weapon: IconSword, body: IconChest, legs: IconLegs, hands: IconGloves, offhand: IconShield, accessory: IconRing,
};
// WoW-style paperdoll: gear slots stacked in two vertical columns flanking
// the character portrait, instead of arranged around it in a cross. Every
// class always shows all 6 slots for visual consistency — a class with no
// real offhand (two-handed weapon or dual-wield, see OFFHAND_KIND) instead
// gets a dimmed "ghost" echo of its weapon in that slot, PoE/Diablo-style,
// showing the two-handed weapon occupies both hands rather than leaving an
// empty, unusable frame.
const PAPERDOLL_LEFT_SLOTS: ItemSlot[] = ['weapon', 'offhand', 'hands'];
const RIGHT_SLOTS: ItemSlot[] = ['body', 'legs', 'accessory'];

interface Props {
  character: Character;
  onEquip: (item: EquipmentItem) => void;
  onUnequip: (slot: ItemSlot) => void;
  onSell: (item: EquipmentItem) => void;
  onEnhance: (item: EquipmentItem) => boolean | undefined;
  onAllocateAttr: (key: AttributeKey) => void;
}

type Selected = { kind: 'equipped'; slot: ItemSlot; item: EquipmentItem | null } | { kind: 'inventory'; item: EquipmentItem };

export function CharacterOverview({ character: ch, onEquip, onUnequip, onSell, onEnhance, onAllocateAttr }: Props) {
  const cls = CLASSES[ch.classId];
  const attrs = computeAttributeTotals(ch.classId, ch.allocatedAttrs);
  const stats = computeCombatStats(ch);
  const heroImg = heroSprites(ch.classId).idle.image.src;
  const [tab, setTab] = useState<'equipamentos' | 'inventario'>('equipamentos');
  const [selected, setSelected] = useState<Selected | null>(null);
  const [filter, setFilter] = useState<'all' | ItemSlot>('all');
  const used = usedCells(ch.inventory);
  // Equip/unequip can push the inventory past the nominal 50-cell cap (that
  // cap is only enforced on loot/purchase, never on gear you already own) —
  // grow the grid's row count to fit whatever actually landed there instead
  // of clipping the overflow items invisibly under a fixed 5-row viewport.
  const gridRows = Math.max(GRID_ROWS, ...ch.inventory.map((i) => (i.gridY ?? 0) + SLOT_FOOTPRINT[i.slot].h));
  const hasOffhand = !!OFFHAND_KIND[ch.classId];
  // The inventory filter only offers "Mão Secundária" for classes that can
  // actually find/buy one — a two-handed class never has that item in its
  // bag, so the tab would just always be empty for it.
  const visibleSlots = hasOffhand ? SLOTS : SLOTS.filter((s) => s !== 'offhand');

  const slotButton = (slot: ItemSlot) => {
    // A two-handed class' weapon "ghosts" into the offhand slot — same icon,
    // dimmed and non-interactive — instead of leaving an empty frame there.
    const isGhostOffhand = slot === 'offhand' && !hasOffhand;
    const item = isGhostOffhand ? ch.equipment.weapon : ch.equipment[slot];
    const Icon = isGhostOffhand ? SLOT_ICON.weapon : SLOT_ICON[slot];
    const color = item ? rarityColor(item.rarity) : '#4a4038';
    return (
      <button
        key={slot}
        onClick={() => { if (!isGhostOffhand) setSelected({ kind: 'equipped', slot, item }); }}
        disabled={isGhostOffhand}
        title={isGhostOffhand ? 'Arma de duas mãos — ocupa as duas mãos' : undefined}
        className={`relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center rounded-[2px] bg-[rgba(96,148,210,0.09)] border border-[rgba(96,148,210,0.4)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)] transition-[background-color,border-color,transform] duration-150 ${
          isGhostOffhand ? 'opacity-40 cursor-default' : 'hover:scale-105 hover:bg-[rgba(96,148,210,0.17)] hover:border-[rgba(96,148,210,0.65)]'
        }`}
      >
        <div className="w-[88%] h-[88%] flex items-center justify-center">
          {item ? <ItemIcon item={item} className="w-full h-full" style={{ color }} /> : <Icon className="w-full h-full" style={{ color }} />}
        </div>
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
              <div className="flex flex-col gap-2.5 sm:gap-3.5">{PAPERDOLL_LEFT_SLOTS.map(slotButton)}</div>
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
            <div className="space-y-3 pr-3 border-r border-panelborder/40">
              <div className="space-y-1">
                {ATTR_ORDER.map((key) => {
                  const meta = ATTR_META[key];
                  return (
                    <div key={key} className="flex items-center justify-between text-xs gap-1.5">
                      <span className="text-parchment/60 truncate min-w-0">{meta.label}:</span>
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
              <div>
                <div className="text-[10px] uppercase tracking-wide text-gold/80 font-bold mb-0.5">Bônus</div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-parchment/60 truncate min-w-0">Redução de Recarga</span>
                  <span className="font-bold tabular-nums text-parchment shrink-0">{Math.round(stats.cooldownReductionPct * 100)}%</span>
                </div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-parchment/60 truncate min-w-0">Roubo de Vida</span>
                  <span className="font-bold tabular-nums text-parchment shrink-0">{Math.round(stats.lifestealPct * 100)}%</span>
                </div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-parchment/60 truncate min-w-0">Espinhos</span>
                  <span className="font-bold tabular-nums text-parchment shrink-0">{Math.round(stats.thornsPct * 100)}%</span>
                </div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-parchment/60 truncate min-w-0">Cura ao Crítico</span>
                  <span className="font-bold tabular-nums text-parchment shrink-0">{Math.round(stats.onCritHealPct * 100)}%</span>
                </div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-parchment/60 truncate min-w-0">Dano vs. Envenenado</span>
                  <span className="font-bold tabular-nums text-parchment shrink-0">{Math.round(stats.dmgPctVsPoison * 100)}%</span>
                </div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-parchment/60 truncate min-w-0">Dano vs. Queimando</span>
                  <span className="font-bold tabular-nums text-parchment shrink-0">{Math.round(stats.dmgPctVsBurn * 100)}%</span>
                </div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-parchment/60 truncate min-w-0">Poder de Suporte</span>
                  <span className="font-bold tabular-nums text-parchment shrink-0">{Math.round(stats.supportPowerPct * 100)}%</span>
                </div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-parchment/60 truncate min-w-0">Chance de Item</span>
                  <span className="font-bold tabular-nums text-parchment shrink-0">+{Math.round(stats.dropChanceBonusPct * 100)}%</span>
                </div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-parchment/60 truncate min-w-0">Qualidade de Item</span>
                  <span className="font-bold tabular-nums text-parchment shrink-0">+{Math.round(stats.itemQualityBonusPct * 100)}%</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-gold/80 font-bold mb-0.5">Vida</div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-parchment/60 truncate min-w-0">Vida Máxima</span>
                  <span className="font-bold tabular-nums text-parchment shrink-0">{fmt(effectiveMaxHp(ch))}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-gold/80 font-bold mb-0.5">Físico</div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-parchment/60 truncate min-w-0">Ataque</span>
                  <span className="font-bold tabular-nums text-parchment shrink-0">{fmt(stats.atk)}</span>
                </div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-parchment/60 truncate min-w-0">Defesa</span>
                  <span className="font-bold tabular-nums text-parchment shrink-0">{fmt(stats.def)}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-gold/80 font-bold mb-0.5">Mágico</div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-parchment/60 truncate min-w-0">Ataque</span>
                  <span className="font-bold tabular-nums text-parchment shrink-0">{fmt(stats.matk)}</span>
                </div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-parchment/60 truncate min-w-0">Defesa</span>
                  <span className="font-bold tabular-nums text-parchment shrink-0">{fmt(stats.mdef)}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-gold/80 font-bold mb-0.5">Combate</div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-parchment/60 truncate min-w-0">Chance de Crítico</span>
                  <span className="font-bold tabular-nums text-parchment shrink-0">{Math.round(stats.critChance * 100)}%</span>
                </div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-parchment/60 truncate min-w-0">Dano Crítico</span>
                  <span className="font-bold tabular-nums text-parchment shrink-0">{Math.round(stats.critDmgMult * 100)}%</span>
                </div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-parchment/60 truncate min-w-0">Bloqueio</span>
                  <span className="font-bold tabular-nums text-parchment shrink-0">{Math.round(stats.blockChance * 100)}%</span>
                </div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-parchment/60 truncate min-w-0">Evasão</span>
                  <span className="font-bold tabular-nums text-parchment shrink-0">{Math.round(stats.evasion * 100)}%</span>
                </div>
                <div className="flex items-center justify-between gap-1.5 text-xs">
                  <span className="text-parchment/60 truncate min-w-0">Precisão</span>
                  <span className="font-bold tabular-nums text-parchment shrink-0">{Math.round(stats.accuracy * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2 gap-3">
            <span className="text-[10px] text-parchment/40 shrink-0">
              {ch.inventory.length} item{ch.inventory.length !== 1 ? 's' : ''}
            </span>
            <span className={`text-[10px] font-bold shrink-0 ${used >= GRID_CELLS ? 'text-crimson' : 'text-gold/80'}`}>
              {used}/{GRID_CELLS} células
            </span>
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
            <div className="rounded border border-black/50 bg-black/25 p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
              <div
                className="relative w-full bg-[rgba(0,0,0,0.45)] rounded-sm overflow-hidden"
                style={{
                  aspectRatio: `${GRID_COLS} / ${gridRows}`,
                  backgroundImage:
                    'linear-gradient(to right, rgba(122,90,52,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(122,90,52,0.35) 1px, transparent 1px)',
                  backgroundSize: `${100 / GRID_COLS}% ${100 / gridRows}%`,
                }}
              >
                {ch.inventory.map((item) => {
                  const color = rarityColor(item.rarity);
                  const { w, h } = SLOT_FOOTPRINT[item.slot];
                  const x = item.gridX ?? 0;
                  const y = item.gridY ?? 0;
                  const dimmed = filter !== 'all' && item.slot !== filter;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelected({ kind: 'inventory', item })}
                      className={`absolute flex items-center justify-center rounded-[2px] bg-[rgba(96,148,210,0.09)] border border-[rgba(96,148,210,0.4)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)] transition-[background-color,border-color,opacity] duration-150 hover:bg-[rgba(96,148,210,0.17)] hover:border-[rgba(96,148,210,0.65)] ${dimmed ? 'opacity-30 grayscale' : ''}`}
                      style={{
                        left: `${(x / GRID_COLS) * 100}%`,
                        top: `${(y / gridRows) * 100}%`,
                        width: `${(w / GRID_COLS) * 100}%`,
                        height: `${(h / gridRows) * 100}%`,
                        containerType: 'size',
                      }}
                    >
                      <ItemIcon item={item} className="relative w-[97%] h-[97%]" style={{ color }} />
                      {item.enhanceLevel > 0 && (
                        <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-gold text-ink rounded-full px-1 min-w-[16px] text-center border border-black/40 shadow">
                          +{item.enhanceLevel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {selected && (
        <ItemModal
          selected={selected}
          gold={ch.gold}
          forjaLevel={ch.buildings.forja ?? 0}
          onClose={() => setSelected(null)}
          onEquip={(item) => { onEquip(item); setSelected(null); }}
          onUnequip={(slot) => { onUnequip(slot); setSelected(null); }}
          onSell={(item) => { onSell(item); setSelected(null); }}
          onEnhance={(item) => {
            const success = onEnhance(item);
            if (success) {
              setSelected(selected.kind === 'equipped' ? { ...selected, item: { ...item, enhanceLevel: item.enhanceLevel + 1 } } : { kind: 'inventory', item: { ...item, enhanceLevel: item.enhanceLevel + 1 } });
            }
            return success;
          }}
        />
      )}
    </Panel>
  );
}

function ItemModal({ selected, gold, forjaLevel, onClose, onEquip, onUnequip, onSell, onEnhance }: {
  selected: Selected;
  gold: number;
  forjaLevel: number;
  onClose: () => void;
  onEquip: (item: EquipmentItem) => void;
  onUnequip: (slot: ItemSlot) => void;
  onSell: (item: EquipmentItem) => void;
  onEnhance: (item: EquipmentItem) => boolean | undefined;
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
      <div className="font-bold text-base" style={{ color: rarityColor(item.rarity) }}>{itemDisplayName(item)}</div>
      <div className="text-xs text-parchment/50">{rarityName(item.rarity)} · Tier {item.tier}</div>
      <ul className="text-sm space-y-0.5 pt-1">
        {(() => {
          const boosted = enhancedItem(item);
          return (
            <>
              {boosted.dmgBonus > 0 && <li>+{boosted.dmgBonus} dano</li>}
              {boosted.defBonus > 0 && <li>+{boosted.defBonus} defesa</li>}
              {boosted.hpBonus > 0 && <li>+{boosted.hpBonus} vida máxima</li>}
              {boosted.matkBonus > 0 && <li>+{boosted.matkBonus} ataque mágico</li>}
              {boosted.mdefBonus > 0 && <li>+{boosted.mdefBonus} defesa mágica</li>}
              {boosted.critChanceBonus > 0 && <li>+{Math.round(boosted.critChanceBonus * 100)}% chance de crítico</li>}
              {boosted.critDmgBonus > 0 && <li>+{Math.round(boosted.critDmgBonus * 100)}% dano crítico</li>}
            </>
          );
        })()}
        {item.secondaryStat && <li>{secondaryStatLabel(item)}</li>}
      </ul>

      <EnhanceSection item={item} gold={gold} forjaLevel={forjaLevel} onEnhance={onEnhance} />
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

