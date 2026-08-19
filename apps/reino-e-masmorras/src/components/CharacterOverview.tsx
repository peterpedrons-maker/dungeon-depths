import { useState } from 'react';
import { AttributeKey, Attributes, Character, EquipmentItem, ItemSlot } from '../types/game';
import { ATTR_META, ATTR_ORDER, CLASSES } from '../lib/classes';
import { computeCombatPower, computeCombatStats, effectiveMaxHp } from '../lib/combatStats';
import { fmt } from '../lib/format';
import { rarityColor, sellValue, SLOT_NAMES } from '../lib/equipment';
import { compareItemStatRows, enhancedItem, itemDisplayName, primaryStatLines, secondaryStatLabel, StatCompareRow } from '../lib/enhancement';
import { OFFHAND_KIND } from '../lib/itemTiers';
import { GRID_CELLS, GRID_COLS, GRID_ROWS, SLOT_FOOTPRINT, usedCells } from '../lib/inventoryGrid';
import { computeAttributeTotals } from '../lib/skills';
import { heroSprites } from '../game/sprites';
import { Panel } from './Panel';
import { SmallButton } from './Button';
import { Modal } from './Modal';
import { ItemIcon } from './ItemIcon';
import emptyWeapon from '../assets/items/empty-weapon.webp';
import emptyBody from '../assets/items/empty-body.webp';
import emptyLegs from '../assets/items/empty-legs.webp';
import emptyHands from '../assets/items/empty-hands.webp';
import emptyOffhand from '../assets/items/empty-offhand.webp';
import emptyAccessory from '../assets/items/empty-accessory.webp';

const SLOTS: ItemSlot[] = ['weapon', 'body', 'legs', 'hands', 'offhand', 'accessory'];
// Faint painted silhouettes shown in an empty paperdoll slot — same style
// as the real item art, unlike the old flat SVG line-glyph, so an empty
// slot no longer visually clashes with an equipped one next to it.
const EMPTY_SLOT_ICON: Record<ItemSlot, string> = {
  weapon: emptyWeapon, body: emptyBody, legs: emptyLegs, hands: emptyHands, offhand: emptyOffhand, accessory: emptyAccessory,
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
  onAllocateAttrs: (deltas: Partial<Record<AttributeKey, number>>) => void;
}

type Selected = { kind: 'equipped'; slot: ItemSlot; item: EquipmentItem | null } | { kind: 'inventory'; item: EquipmentItem };

const ZERO_ALLOC: Record<AttributeKey, number> = { str: 0, dex: 0, agi: 0, vit: 0, int: 0, wis: 0, luk: 0 };

export function CharacterOverview({ character: ch, onEquip, onUnequip, onSell, onAllocateAttrs }: Props) {
  const cls = CLASSES[ch.classId];
  const attrs = computeAttributeTotals(ch.classId, ch.allocatedAttrs);
  const stats = computeCombatStats(ch);
  const heroImg = heroSprites(ch.classId).idle.image.src;
  const [tab, setTab] = useState<'equipamentos' | 'atributos'>('equipamentos');
  const [selected, setSelected] = useState<Selected | null>(null);
  const [filter, setFilter] = useState<'all' | ItemSlot>('all');
  // Points the player is staging before committing — lets them see the
  // secondary-stat payoff (atk/def/hp/...) of a spend before it's permanent,
  // instead of finding out only after clicking. Reset whenever the pool of
  // spendable points shrinks (a confirm just happened) or grows (leveled up
  // mid-allocation) — either way any earlier staged plan no longer applies.
  const [pendingAlloc, setPendingAlloc] = useState<Record<AttributeKey, number>>(ZERO_ALLOC);
  const pendingTotal = Object.values(pendingAlloc).reduce((s, n) => s + n, 0);
  const previewAllocatedAttrs: Attributes = { ...ch.allocatedAttrs };
  for (const key of ATTR_ORDER) previewAllocatedAttrs[key] += pendingAlloc[key];
  const previewCh: Character = { ...ch, allocatedAttrs: previewAllocatedAttrs };
  const previewStats = computeCombatStats(previewCh);
  const previewMaxHp = effectiveMaxHp(previewCh);

  function stagePoint(key: AttributeKey, delta: number) {
    setPendingAlloc((prev) => {
      const next = Math.max(0, prev[key] + delta);
      if (delta > 0 && pendingTotal >= ch.attributePoints) return prev;
      return { ...prev, [key]: next };
    });
  }
  function confirmAlloc() {
    if (pendingTotal === 0) return;
    onAllocateAttrs(pendingAlloc);
    setPendingAlloc(ZERO_ALLOC);
  }
  function cancelAlloc() {
    setPendingAlloc(ZERO_ALLOC);
  }
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
    const emptyIcon = isGhostOffhand ? EMPTY_SLOT_ICON.weapon : EMPTY_SLOT_ICON[slot];
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
          {item ? <ItemIcon item={item} className="w-full h-full" style={{ color }} /> : <img src={emptyIcon} alt="" className="w-full h-full object-contain opacity-70" />}
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
        <MainTab active={tab === 'atributos'} onClick={() => setTab('atributos')}>Atributos</MainTab>
      </div>

      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <span className="flex items-center gap-2 text-sm">
          <span className="text-parchment/50">{cls.name}</span>
          <span className="text-parchment/30">·</span>
          <span className="text-amber-300 font-bold" title="Poder de Combate — soma dos seus atributos, com peso conforme sua classe">
            ⚔ {fmt(computeCombatPower(ch))}
          </span>
        </span>
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

          {/* Inventory lives right below the paperdoll now — equip/unequip
              and "what's in the bag" used to be two separate tabs, but in
              practice the player almost always wants both in view at once
              (comparing a bag item against what's worn), so they're merged
              into one tab. Secondary stats moved to their own tab below. */}
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
      ) : (
        /* Attribute allocation + secondary stats — its own tab now that the
           inventory moved in with the paperdoll above. */
        <div className="rounded border border-black/50 bg-black/25 p-3 mb-4 grid grid-cols-2 gap-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
          <div className="space-y-3 pr-3 border-r border-panelborder/40">
            <div className="space-y-1">
              {ATTR_ORDER.map((key) => {
                const meta = ATTR_META[key];
                const staged = pendingAlloc[key];
                return (
                  <div key={key} className="flex items-center justify-between text-xs gap-1.5">
                    <span className="text-parchment/60 truncate min-w-0">{meta.label}:</span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className="font-bold tabular-nums" style={{ color: meta.color }}>{attrs[key]}</span>
                      {staged > 0 && <span className="font-bold tabular-nums text-sky-300">+{staged}</span>}
                      {staged > 0 && (
                        <button
                          onClick={() => stagePoint(key, -1)}
                          className="w-4 h-4 flex items-center justify-center rounded-full bg-black/40 border border-parchment/30 text-parchment/70 text-[10px] font-bold leading-none hover:border-parchment/60"
                          aria-label={`-1 ${meta.label}`}
                        >
                          −
                        </button>
                      )}
                      {ch.attributePoints - pendingTotal > 0 && (
                        <button
                          onClick={() => stagePoint(key, 1)}
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
            {pendingTotal > 0 && (
              <div className="rounded border border-sky-400/40 bg-sky-500/10 p-2 space-y-1">
                <div className="text-[10px] uppercase tracking-wide text-sky-300 font-bold mb-0.5">Prévia com {pendingTotal} ponto{pendingTotal > 1 ? 's' : ''}</div>
                <PreviewStatRow label="Vida Máxima" from={effectiveMaxHp(ch)} to={previewMaxHp} />
                <PreviewStatRow label="Ataque" from={stats.atk} to={previewStats.atk} />
                <PreviewStatRow label="Defesa" from={stats.def} to={previewStats.def} />
                <PreviewStatRow label="Ataque Mágico" from={stats.matk} to={previewStats.matk} />
                <PreviewStatRow label="Defesa Mágica" from={stats.mdef} to={previewStats.mdef} />
                <PreviewStatRow label="Crítico" from={Math.round(stats.critChance * 100)} to={Math.round(previewStats.critChance * 100)} suffix="%" />
                <PreviewStatRow label="Bloqueio" from={Math.round(stats.blockChance * 100)} to={Math.round(previewStats.blockChance * 100)} suffix="%" />
                <div className="flex gap-2 pt-1">
                  <SmallButton onClick={confirmAlloc}>Confirmar</SmallButton>
                  <SmallButton onClick={cancelAlloc} variant="ghost">Cancelar</SmallButton>
                </div>
              </div>
            )}
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
      )}

      {selected && (
        <ItemModal
          selected={selected}
          equippedInSlot={selected.kind === 'inventory' ? ch.equipment[selected.item.slot] : null}
          onClose={() => setSelected(null)}
          onEquip={(item) => { onEquip(item); setSelected(null); }}
          onUnequip={(slot) => { onUnequip(slot); setSelected(null); }}
          onSell={(item) => { onSell(item); setSelected(null); }}
        />
      )}
    </Panel>
  );
}

function ItemModal({ selected, equippedInSlot, onClose, onEquip, onUnequip, onSell }: {
  selected: Selected;
  // Only meaningful for an inventory item — what's presently equipped in
  // that same slot, so the modal can show what swapping in would change.
  equippedInSlot: EquipmentItem | null;
  onClose: () => void;
  onEquip: (item: EquipmentItem) => void;
  onUnequip: (slot: ItemSlot) => void;
  onSell: (item: EquipmentItem) => void;
}) {
  if (selected.kind === 'equipped' && !selected.item) {
    return (
      <Modal onClose={onClose} bare>
        <div className="px-5 py-4 rounded-md border border-gold/30 bg-black/55 backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <p className="text-parchment/50 italic text-sm">Nenhum item equipado neste slot.</p>
        </div>
      </Modal>
    );
  }

  const item = selected.item as EquipmentItem;

  // An inventory item gets the full side-by-side compare view; an equipped
  // slot (nothing to compare it against but itself) keeps the simple
  // single-card tooltip.
  if (selected.kind === 'inventory') {
    return (
      <ItemCompareModal
        item={item}
        equipped={equippedInSlot}
        onClose={onClose}
        onEquip={onEquip}
        onSell={onSell}
      />
    );
  }

  const color = rarityColor(item.rarity);
  const boosted = enhancedItem(item);
  const primaryLines = primaryStatLines(boosted);

  return (
    <Modal onClose={onClose} bare>
      {/* Path of Exile-style floating tooltip: name on top, big art in the
          middle, bare stat lines below — no title bar, no section labels,
          no boxes-within-boxes. Enhancing now only happens via the Ferreiro
          (which already has its own full confirm/roll/result screen), so
          there's no enhance widget cluttering this quick-view card. */}
      <div className="relative w-64 flex flex-col items-center gap-2 px-5 py-5 rounded-md border border-gold/30 bg-black/55 backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-parchment/50 hover:text-parchment text-lg leading-none px-1"
          aria-label="Fechar"
        >
          ×
        </button>

        <div className="font-bold text-base text-center" style={{ color }}>{itemDisplayName(item)}</div>

        <div className="w-24 h-24 rounded-[2px] bg-[rgba(96,148,210,0.09)] border border-[rgba(96,148,210,0.4)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)] flex items-center justify-center shrink-0">
          <ItemIcon item={item} className="w-[88%] h-[88%]" style={{ color }} />
        </div>

        <div className="flex flex-col items-center gap-0.5">
          {primaryLines.map((line) => <div key={line} className="text-sm text-parchment/90">{line}</div>)}
          {item.secondaryStat && <div className="text-sm text-sky-300">{secondaryStatLabel(item)}</div>}
        </div>

        <div className="flex gap-2 mt-2">
          <SmallButton onClick={() => onUnequip(item.slot)}>Desequipar</SmallButton>
        </div>
      </div>
    </Modal>
  );
}

function fmtStatValue(v: number, isPct: boolean): string {
  return isPct ? `${Math.round(v * 100)}%` : `${Math.round(v)}`;
}

// Two fully independent item windows side by side — each one reads exactly
// like the single-item tooltip (icon, name, its own stat list), just placed
// next to its counterpart instead of merged into one shared table, which
// read as a single confusing block. `mine`/`other` pick which side of each
// StatCompareRow this window's stats come from, so the same row list drives
// both windows without duplicating the comparison math.
function ItemStatWindow({ item, label, rows, mine, other }: {
  item: EquipmentItem | null;
  label: string;
  rows: StatCompareRow[];
  mine: 'equippedValue' | 'newValue';
  other: 'equippedValue' | 'newValue';
}) {
  const color = item ? rarityColor(item.rarity) : undefined;
  return (
    <div className="flex flex-col items-center gap-1.5 rounded border border-panelborder/40 bg-black/25 p-2.5 min-w-0 shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]">
      <span className="text-[10px] uppercase tracking-wide text-parchment/40 font-bold">{label}</span>
      <div className="w-14 h-14 rounded-[2px] bg-[rgba(96,148,210,0.09)] border border-[rgba(96,148,210,0.4)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)] flex items-center justify-center shrink-0">
        {item ? <ItemIcon item={item} className="w-[85%] h-[85%]" style={{ color }} /> : <span className="text-parchment/30 text-[9px]">Vazio</span>}
      </div>
      <span className="text-xs font-bold text-center leading-tight break-words" style={item ? { color } : undefined}>
        {item ? itemDisplayName(item) : '—'}
      </span>
      {rows.length > 0 && (
        <div className="w-full mt-1 space-y-1 border-t border-panelborder/30 pt-1.5">
          {rows.map((r) => {
            const mineVal = r[mine];
            const otherVal = r[other];
            const arrow = mineVal === otherVal ? null : mineVal > otherVal ? 'up' : 'down';
            return (
              <div key={r.label} className="flex items-center justify-between gap-1 text-[11px]">
                <span className="text-parchment/60 truncate min-w-0">{r.label}</span>
                <span className="flex items-center gap-1 font-bold tabular-nums shrink-0">
                  <span className={arrow === 'up' ? 'text-green-400' : arrow === 'down' ? 'text-crimson' : 'text-parchment'}>
                    {fmtStatValue(mineVal, r.isPct)}
                  </span>
                  {arrow === 'up' && <span className="text-green-400 text-[9px] leading-none">▲</span>}
                  {arrow === 'down' && <span className="text-crimson text-[9px] leading-none">▼</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Diablo/PoE-style side-by-side compare: the equipped item and the bag item
// as two independent windows, each with its own icon/name/stat list, so the
// player reads either side on its own instead of parsing a shared table.
// Every stat that differs gets a colored ▲/▼ pointing toward whichever side
// wins it.
function ItemCompareModal({ item, equipped, onClose, onEquip, onSell }: {
  item: EquipmentItem;
  equipped: EquipmentItem | null;
  onClose: () => void;
  onEquip: (item: EquipmentItem) => void;
  onSell: (item: EquipmentItem) => void;
}) {
  const rows = compareItemStatRows(item, equipped);

  return (
    <Modal onClose={onClose} bare>
      <div className="relative w-[min(94vw,420px)] flex flex-col items-center gap-3 px-4 py-5 rounded-md border border-gold/30 bg-black/55 backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-parchment/50 hover:text-parchment text-lg leading-none px-1"
          aria-label="Fechar"
        >
          ×
        </button>

        <div className="font-bold text-base text-center" style={{ color: rarityColor(item.rarity) }}>{itemDisplayName(item)}</div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <ItemStatWindow item={equipped} label="Equipado" rows={rows} mine="equippedValue" other="newValue" />
          <ItemStatWindow item={item} label="Novo" rows={rows} mine="newValue" other="equippedValue" />
        </div>

        <div className="flex gap-2 mt-1">
          <SmallButton onClick={() => onEquip(item)}>Equipar</SmallButton>
          <SmallButton onClick={() => onSell(item)} variant="ghost">Vender ({sellValue(item)} ouro)</SmallButton>
        </div>
      </div>
    </Modal>
  );
}

function PreviewStatRow({ label, from, to, suffix = '' }: { label: string; from: number; to: number; suffix?: string }) {
  const changed = to !== from;
  return (
    <div className="flex items-center justify-between gap-1.5 text-[11px]">
      <span className="text-parchment/60 truncate min-w-0">{label}</span>
      <span className="font-bold tabular-nums shrink-0">
        <span className={changed ? 'text-parchment/50' : 'text-parchment'}>{from}{suffix}</span>
        {changed && <span className="text-sky-300"> → {to}{suffix}</span>}
      </span>
    </div>
  );
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

