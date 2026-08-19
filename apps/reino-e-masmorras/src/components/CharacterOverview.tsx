import { CSSProperties, useState } from 'react';
import { AttributeKey, Attributes, Character, EquipmentItem, ItemSlot } from '../types/game';
import { ATTR_META, ATTR_ORDER, CLASSES } from '../lib/classes';
import { computeCombatPower, computeCombatStats, effectiveMaxHp } from '../lib/combatStats';
import { fmt } from '../lib/format';
import { hexToRgba, rarityColor, sellValue, SLOT_NAMES } from '../lib/equipment';
import { compareItemStatRows, itemDisplayName, itemStatLines } from '../lib/enhancement';
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

// Neutral slate-blue used for an empty slot (nothing to tint by rarity yet).
const NEUTRAL_SLOT_BG = 'rgba(96,148,210,0.09)';
const NEUTRAL_SLOT_BG_HOVER = 'rgba(96,148,210,0.17)';
const NEUTRAL_SLOT_BORDER = 'rgba(96,148,210,0.4)';
const NEUTRAL_SLOT_BORDER_HOVER = 'rgba(96,148,210,0.65)';

// Tints an item slot's background/border by the item's own rarity color
// (via CSS custom properties, so the existing Tailwind hover: classes still
// work) instead of every slot sharing one fixed neutral blue regardless of
// what's inside — an empty slot keeps the neutral look.
function slotTintStyle(item: EquipmentItem | null): CSSProperties {
  if (!item) {
    return {
      ['--slot-bg' as string]: NEUTRAL_SLOT_BG,
      ['--slot-bg-hover' as string]: NEUTRAL_SLOT_BG_HOVER,
      ['--slot-border' as string]: NEUTRAL_SLOT_BORDER,
      ['--slot-border-hover' as string]: NEUTRAL_SLOT_BORDER_HOVER,
    } as CSSProperties;
  }
  const color = rarityColor(item.rarity);
  return {
    ['--slot-bg' as string]: hexToRgba(color, 0.16),
    ['--slot-bg-hover' as string]: hexToRgba(color, 0.26),
    ['--slot-border' as string]: hexToRgba(color, 0.5),
    ['--slot-border-hover' as string]: hexToRgba(color, 0.75),
  } as CSSProperties;
}

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
        style={slotTintStyle(item)}
        className={`relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center rounded-[2px] bg-[var(--slot-bg)] border border-[var(--slot-border)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)] transition-[background-color,border-color,transform] duration-150 ${
          isGhostOffhand ? 'opacity-40 cursor-default' : 'hover:scale-105 hover:bg-[var(--slot-bg-hover)] hover:border-[var(--slot-border-hover)]'
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
                      className={`absolute flex items-center justify-center rounded-[2px] bg-[var(--slot-bg)] border border-[var(--slot-border)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)] transition-[background-color,border-color,opacity] duration-150 hover:bg-[var(--slot-bg-hover)] hover:border-[var(--slot-border-hover)] ${dimmed ? 'opacity-30 grayscale' : ''}`}
                      style={{
                        ...slotTintStyle(item),
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
              <div className="flex gap-2">
                <SmallButton onClick={confirmAlloc}>Confirmar</SmallButton>
                <SmallButton onClick={cancelAlloc} variant="ghost">Cancelar</SmallButton>
              </div>
            )}
            <div>
              <div className="text-[10px] uppercase tracking-wide text-gold/80 font-bold mb-0.5">Bônus</div>
              <PreviewStatRow label="Redução de Recarga" from={Math.round(stats.cooldownReductionPct * 100)} to={Math.round(previewStats.cooldownReductionPct * 100)} suffix="%" />
              <PreviewStatRow label="Roubo de Vida" from={Math.round(stats.lifestealPct * 100)} to={Math.round(previewStats.lifestealPct * 100)} suffix="%" />
              <PreviewStatRow label="Espinhos" from={Math.round(stats.thornsPct * 100)} to={Math.round(previewStats.thornsPct * 100)} suffix="%" />
              <PreviewStatRow label="Cura ao Crítico" from={Math.round(stats.onCritHealPct * 100)} to={Math.round(previewStats.onCritHealPct * 100)} suffix="%" />
              <PreviewStatRow label="Dano vs. Envenenado" from={Math.round(stats.dmgPctVsPoison * 100)} to={Math.round(previewStats.dmgPctVsPoison * 100)} suffix="%" />
              <PreviewStatRow label="Dano vs. Queimando" from={Math.round(stats.dmgPctVsBurn * 100)} to={Math.round(previewStats.dmgPctVsBurn * 100)} suffix="%" />
              <PreviewStatRow label="Poder de Suporte" from={Math.round(stats.supportPowerPct * 100)} to={Math.round(previewStats.supportPowerPct * 100)} suffix="%" />
              <PreviewStatRow label="Chance de Item" from={Math.round(stats.dropChanceBonusPct * 100)} to={Math.round(previewStats.dropChanceBonusPct * 100)} suffix="%" prefix="+" />
              <PreviewStatRow label="Qualidade de Item" from={Math.round(stats.itemQualityBonusPct * 100)} to={Math.round(previewStats.itemQualityBonusPct * 100)} suffix="%" prefix="+" />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-gold/80 font-bold mb-0.5">Vida</div>
              <PreviewStatRow label="Vida Máxima" from={effectiveMaxHp(ch)} to={previewMaxHp} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-gold/80 font-bold mb-0.5">Físico</div>
              <PreviewStatRow label="Ataque" from={stats.atk} to={previewStats.atk} />
              <PreviewStatRow label="Defesa" from={stats.def} to={previewStats.def} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-gold/80 font-bold mb-0.5">Mágico</div>
              <PreviewStatRow label="Ataque" from={stats.matk} to={previewStats.matk} />
              <PreviewStatRow label="Defesa" from={stats.mdef} to={previewStats.mdef} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-gold/80 font-bold mb-0.5">Combate</div>
              <PreviewStatRow label="Chance de Crítico" from={Math.round(stats.critChance * 100)} to={Math.round(previewStats.critChance * 100)} suffix="%" />
              <PreviewStatRow label="Dano Crítico" from={Math.round(stats.critDmgMult * 100)} to={Math.round(previewStats.critDmgMult * 100)} suffix="%" />
              <PreviewStatRow label="Bloqueio" from={Math.round(stats.blockChance * 100)} to={Math.round(previewStats.blockChance * 100)} suffix="%" />
              <PreviewStatRow label="Evasão" from={Math.round(stats.evasion * 100)} to={Math.round(previewStats.evasion * 100)} suffix="%" />
              <PreviewStatRow label="Precisão" from={Math.round(stats.accuracy * 100)} to={Math.round(previewStats.accuracy * 100)} suffix="%" />
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

function fmtStatValue(v: number, isPct: boolean): string {
  return isPct ? `${Math.round(v * 100)}%` : `${Math.round(v)}`;
}

// One column of the compare window — just the item's icon/name plus its
// stat lines. `compareAgainst` controls whether those lines carry a colored
// ▲/▼ delta: the equipped side reads its stats plainly (nothing to compare
// itself to), the new/bag side shows the delta against what's equipped, so
// only one side ever claims a direction — no more "6 ▲" on one column and
// "5 ▼" on the other for what is really a single -1 change.
function ItemStatWindow({ item, label, compareAgainst }: {
  item: EquipmentItem | null;
  label: string;
  compareAgainst: EquipmentItem | null | undefined;
}) {
  const color = item ? rarityColor(item.rarity) : undefined;
  const showDelta = compareAgainst !== undefined;
  // The "Novo" column (showDelta=true) must also surface stats the equipped
  // item grants that this item doesn't — otherwise a swap that drops, say,
  // Ataque Mágico entirely just silently omits that line instead of showing
  // the loss. compareItemStatRows() includes both sides' nonzero stats;
  // itemStatLines() (used for the plain "Equipado" listing) only lists the
  // item's own stats, which is correct there since nothing is being lost.
  const lines = !item
    ? []
    : showDelta
    ? compareItemStatRows(item, compareAgainst ?? null).map((r) => ({ label: r.label, isPct: r.isPct, value: r.newValue, delta: r.newValue - r.equippedValue }))
    : itemStatLines(item, null);
  return (
    <div className="flex flex-col items-center gap-1.5 rounded border border-panelborder/40 bg-black/25 p-2.5 min-w-0 shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]">
      <span className="text-[10px] uppercase tracking-wide text-parchment/40 font-bold">{label}</span>
      <div style={slotTintStyle(item)} className="w-14 h-14 rounded-[2px] bg-[var(--slot-bg)] border border-[var(--slot-border)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)] flex items-center justify-center shrink-0">
        {item ? <ItemIcon item={item} className="w-[85%] h-[85%]" style={{ color }} /> : <span className="text-parchment/30 text-[9px]">Vazio</span>}
      </div>
      <span className="text-xs font-bold text-center leading-tight break-words" style={item ? { color } : undefined}>
        {item ? itemDisplayName(item) : '—'}
      </span>
      {lines.length > 0 && (
        <div className="w-full mt-1 space-y-1 border-t border-panelborder/30 pt-1.5">
          {lines.map((l) => (
            <div key={l.label} className="flex items-center justify-between gap-1 text-[11px]">
              <span className="text-parchment/60 truncate min-w-0">{l.label}</span>
              <span className="flex items-center gap-1 font-bold tabular-nums shrink-0">
                <span className="text-parchment">{fmtStatValue(l.value, l.isPct)}</span>
                {showDelta && l.delta !== 0 && (
                  <span className={l.delta > 0 ? 'text-green-400' : 'text-crimson'}>
                    {l.delta > 0 ? '▲' : '▼'}{l.delta > 0 ? '+' : ''}{fmtStatValue(l.delta, l.isPct)}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemModal({ selected, equippedInSlot, onClose, onEquip, onUnequip, onSell }: {
  selected: Selected;
  // Only meaningful for an inventory item — what's presently equipped in
  // that same slot, so the compare window can show the delta of swapping in.
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

  // An inventory item gets the two-window compare: the equipped item on the
  // left reads plainly, the new item on the right carries the ▲/▼ delta.
  if (selected.kind === 'inventory') {
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
            <ItemStatWindow item={equippedInSlot} label="Equipado" compareAgainst={undefined} />
            <ItemStatWindow item={item} label="Novo" compareAgainst={equippedInSlot} />
          </div>

          <div className="flex gap-2 mt-1">
            <SmallButton onClick={() => onEquip(item)}>Equipar</SmallButton>
            <SmallButton onClick={() => onSell(item)} variant="ghost">Vender ({sellValue(item)} ouro)</SmallButton>
          </div>
        </div>
      </Modal>
    );
  }

  const color = rarityColor(item.rarity);
  const lines = itemStatLines(item, null);

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

        <div style={slotTintStyle(item)} className="w-24 h-24 rounded-[2px] bg-[var(--slot-bg)] border border-[var(--slot-border)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)] flex items-center justify-center shrink-0">
          <ItemIcon item={item} className="w-[88%] h-[88%]" style={{ color }} />
        </div>

        <div className="flex flex-col items-center gap-0.5">
          {lines.map((l) => (
            <div key={l.label} className="text-sm text-parchment/90">+{fmtStatValue(l.value, l.isPct)} {l.label.toLowerCase()}</div>
          ))}
        </div>

        <div className="flex gap-2 mt-2">
          <SmallButton onClick={() => onUnequip(item.slot)}>Desequipar</SmallButton>
        </div>
      </div>
    </Modal>
  );
}

// Every derived-stat row in the Atributos tab goes through this — shows the
// live value, and once a point is staged (see pendingAlloc), an inline
// "→ new value" in sky blue right where the stat already lives instead of
// a second floating box duplicating a subset of the same numbers below.
function PreviewStatRow({ label, from, to, suffix = '', prefix = '' }: { label: string; from: number; to: number; suffix?: string; prefix?: string }) {
  const changed = to !== from;
  return (
    <div className="flex items-center justify-between gap-1.5 text-xs">
      <span className="text-parchment/60 truncate min-w-0">{label}</span>
      <span className="font-bold tabular-nums shrink-0">
        <span className={changed ? 'text-parchment/50' : 'text-parchment'}>{prefix}{fmt(from)}{suffix}</span>
        {changed && <span className="text-sky-300"> → {prefix}{fmt(to)}{suffix}</span>}
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

