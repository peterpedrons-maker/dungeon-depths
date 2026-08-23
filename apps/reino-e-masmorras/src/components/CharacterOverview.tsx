import { useState } from 'react';
import { AttributeKey, Attributes, Character, EquipmentItem, ItemSlot } from '../types/game';
import { ATTR_META, ATTR_ORDER, CLASSES } from '../lib/classes';
import { computeCombatPower, computeCombatStats, describeAttribute, effectiveMaxHp, equipmentContribution } from '../lib/combatStats';
import { fmt } from '../lib/format';
import { rarityColor, sellValue, slotTintStyle, SLOT_NAMES } from '../lib/equipment';
import { itemDisplayName, itemStatLines } from '../lib/enhancement';
import { OFFHAND_KIND } from '../lib/itemTiers';
import { GRID_CELLS, GRID_COLS, GRID_ROWS, SLOT_FOOTPRINT, usedCells } from '../lib/inventoryGrid';
import { computeAttributeTotals } from '../lib/skills';
import { heroSprites } from '../game/sprites';
import { Panel } from './Panel';
import { SmallButton } from './Button';
import { Modal } from './Modal';
import { ItemIcon } from './ItemIcon';
import { AFFIX_ACCENT, BASE_ACCENT, fmtStatValue, ItemCompareGrid } from './ItemCompare';
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
  const equip = equipmentContribution(ch);
  const heroImg = heroSprites(ch.classId).idle.image.src;
  const [tab, setTab] = useState<'equipamentos' | 'atributos'>('equipamentos');
  const [selected, setSelected] = useState<Selected | null>(null);
  const [attrInfo, setAttrInfo] = useState<AttributeKey | null>(null);
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
                    <span className="text-parchment/60 truncate min-w-0 flex items-center gap-1">
                      {meta.label}:
                      <button
                        onClick={() => setAttrInfo(key)}
                        className="w-3.5 h-3.5 shrink-0 flex items-center justify-center rounded-full bg-black/40 border border-parchment/30 text-parchment/60 text-[9px] font-bold leading-none hover:border-gold/60 hover:text-gold"
                        aria-label={`O que ${meta.label} faz`}
                      >
                        ?
                      </button>
                    </span>
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
              <PreviewStatRow label="Redução de Recarga" from={Math.round(stats.cooldownReductionPct * 100)} to={Math.round(previewStats.cooldownReductionPct * 100)} suffix="%" equip={Math.round(equip.cdr * 100)} />
              <PreviewStatRow label="Roubo de Vida" from={Math.round(stats.lifestealPct * 100)} to={Math.round(previewStats.lifestealPct * 100)} suffix="%" equip={Math.round(equip.lifesteal * 100)} />
              <PreviewStatRow label="Espinhos" from={Math.round(stats.thornsPct * 100)} to={Math.round(previewStats.thornsPct * 100)} suffix="%" equip={Math.round(equip.thorns * 100)} />
              <PreviewStatRow label="Cura ao Crítico" from={Math.round(stats.onCritHealPct * 100)} to={Math.round(previewStats.onCritHealPct * 100)} suffix="%" />
              <PreviewStatRow label="Dano vs. Envenenado" from={Math.round(stats.dmgPctVsPoison * 100)} to={Math.round(previewStats.dmgPctVsPoison * 100)} suffix="%" />
              <PreviewStatRow label="Dano vs. Queimando" from={Math.round(stats.dmgPctVsBurn * 100)} to={Math.round(previewStats.dmgPctVsBurn * 100)} suffix="%" />
              <PreviewStatRow label="Poder de Suporte" from={Math.round(stats.supportPowerPct * 100)} to={Math.round(previewStats.supportPowerPct * 100)} suffix="%" />
              <PreviewStatRow label="Chance de Item" from={Math.round(stats.dropChanceBonusPct * 100)} to={Math.round(previewStats.dropChanceBonusPct * 100)} suffix="%" prefix="+" equip={Math.round(equip.dropChance * 100)} />
              <PreviewStatRow label="Qualidade de Item" from={Math.round(stats.itemQualityBonusPct * 100)} to={Math.round(previewStats.itemQualityBonusPct * 100)} suffix="%" prefix="+" equip={Math.round(equip.itemQuality * 100)} />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-gold/80 font-bold mb-0.5">Vida</div>
              <PreviewStatRow label="Vida Máxima" from={effectiveMaxHp(ch)} to={previewMaxHp} equip={Math.round(equip.hp)} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-gold/80 font-bold mb-0.5">Físico</div>
              <PreviewStatRow label="Ataque" from={stats.atk} to={previewStats.atk} equip={Math.round(equip.dmg)} />
              <PreviewStatRow label="Defesa" from={stats.def} to={previewStats.def} equip={Math.round(equip.def)} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-gold/80 font-bold mb-0.5">Mágico</div>
              <PreviewStatRow label="Ataque" from={stats.matk} to={previewStats.matk} equip={Math.round(equip.matk)} />
              <PreviewStatRow label="Defesa" from={stats.mdef} to={previewStats.mdef} equip={Math.round(equip.mdef)} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-gold/80 font-bold mb-0.5">Combate</div>
              <PreviewStatRow label="Chance de Crítico" from={Math.round(stats.critChance * 100)} to={Math.round(previewStats.critChance * 100)} suffix="%" equip={Math.round(equip.crit * 100)} />
              <PreviewStatRow label="Dano Crítico" from={Math.round(stats.critDmgMult * 100)} to={Math.round(previewStats.critDmgMult * 100)} suffix="%" equip={Math.round(equip.critDmg * 100)} />
              <PreviewStatRow label="Bloqueio" from={Math.round(stats.blockChance * 100)} to={Math.round(previewStats.blockChance * 100)} suffix="%" equip={Math.round(equip.block * 100)} />
              <PreviewStatRow label="Evasão" from={Math.round(stats.evasion * 100)} to={Math.round(previewStats.evasion * 100)} suffix="%" equip={Math.round(equip.evasion * 100)} />
              <PreviewStatRow label="Precisão" from={Math.round(stats.accuracy * 100)} to={Math.round(previewStats.accuracy * 100)} suffix="%" equip={Math.round(equip.accuracy * 100)} />
              <PreviewStatRow label="Tenacidade" from={Math.round(stats.tenacityPct * 100)} to={Math.round(previewStats.tenacityPct * 100)} suffix="%" equip={Math.round(equip.tenacity * 100)} />
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

      {attrInfo && <AttrInfoModal ch={ch} attrKey={attrInfo} onClose={() => setAttrInfo(null)} />}
    </Panel>
  );
}

// Powered by describeAttribute() (lib/combatStats.ts), so every number shown
// here is this specific character's real current contribution — same
// coefficients/curve/class-weight computeCombatStats() itself uses, not a
// generic class-agnostic blurb. The weight badge makes visible why the same
// attribute point is worth more on some classes than others (2.0×/1.5×/1.0×
// depending on how much that class's baseAttrs prioritizes it) — except for
// Chance/Qualidade de Item, LUK's two loot-luck lines, which deliberately
// never get the class weight (see describeAttribute's own comment).
function AttrInfoModal({ ch, attrKey, onClose }: { ch: Character; attrKey: AttributeKey; onClose: () => void }) {
  const meta = ATTR_META[attrKey];
  const { weight, contributions } = describeAttribute(ch, attrKey);
  const isLuk = attrKey === 'luk';
  return (
    <Modal onClose={onClose} bare>
      <div className="relative w-[min(90vw,300px)] flex flex-col gap-2.5 px-5 py-4 rounded-md border border-gold/30 bg-black/55 backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-parchment/50 hover:text-parchment text-lg leading-none px-1"
          aria-label="Fechar"
        >
          ×
        </button>
        <div className="font-bold text-base" style={{ color: meta.color }}>{meta.label}</div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-parchment/50">Peso para {CLASSES[ch.classId].name}:</span>
          <span className="font-bold text-gold">×{weight.toFixed(1)}</span>
        </div>
        <div className="border-t border-panelborder/30 pt-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span />
            <span className="flex items-center gap-3 text-[9px] uppercase tracking-wide text-parchment/40 font-bold">
              <span className="w-12 text-right">Total</span>
              <span className="w-14 text-right">Próx. ponto</span>
            </span>
          </div>
          <div className="space-y-1">
            {contributions.map((c) => (
              <div key={c.label} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-parchment/70 truncate min-w-0">{c.label}</span>
                <span className="flex items-center gap-3 shrink-0">
                  <span className="w-12 text-right font-bold tabular-nums text-parchment">{c.total}</span>
                  <span className="w-14 text-right font-bold tabular-nums text-sky-300">{c.nextPoint}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        {isLuk && (
          <p className="text-[10px] text-parchment/40 italic border-t border-panelborder/30 pt-2">
            Chance/Qualidade de Item não recebem o peso de classe — sorte de item é universal, não amarrada à identidade de combate da classe.
          </p>
        )}
      </div>
    </Modal>
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

  // An inventory item gets the two-column compare: each column lists that
  // item's own real stats (never a shared/merged number) — the equipped
  // side plain, the new side carrying NOVO or a "delta → total" change
  // against whatever's currently equipped. Anything the swap would drop
  // entirely gets pulled into its own callout below instead (see
  // LostAttributesSection).
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

          <ItemCompareGrid equipped={equippedInSlot} candidate={item} />

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
          {/* Base (the slot's guaranteed roll) in amber, affixes (everything
              else) in sky blue — same dot+color pairing as the compare
              window's columns (see BASE_ACCENT/AFFIX_ACCENT above), so an
              item reads the same way whether it's being compared or just
              viewed on its own. */}
          {lines.map((l) => (
            <div key={l.label} className={`text-sm flex items-center gap-1.5 ${l.isBase ? BASE_ACCENT.text : AFFIX_ACCENT.text}`}>
              <span className={`w-1 h-1 rounded-full shrink-0 ${l.isBase ? BASE_ACCENT.dot : AFFIX_ACCENT.dot}`} />
              +{fmtStatValue(l.value, l.isPct)} {l.label.toLowerCase()}
            </div>
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
// `equip`, when passed and nonzero, tags on exactly how much of that live
// value currently comes from gear — the numbers already included equipment
// (see equipmentContribution in combatStats.ts, folded into computeCombatStats
// the same as always), but with no visible line ever singling that portion
// out, a stronger weapon or a new affix roll just silently became part of
// one bigger number with no confirmation gear was counted at all.
function PreviewStatRow({ label, from, to, suffix = '', prefix = '', equip }: {
  label: string; from: number; to: number; suffix?: string; prefix?: string; equip?: number;
}) {
  const changed = to !== from;
  return (
    <div className="flex items-center justify-between gap-1.5 text-xs">
      <span className="text-parchment/60 truncate min-w-0">{label}</span>
      <span className="flex items-center gap-1 shrink-0">
        {!!equip && (
          <span className="text-[9px] text-amber-300/80 font-bold" title="Contribuição do equipamento">
            (equip {prefix}{fmt(equip)}{suffix})
          </span>
        )}
        <span className="font-bold tabular-nums">
          <span className={changed ? 'text-parchment/50' : 'text-parchment'}>{prefix}{fmt(from)}{suffix}</span>
          {changed && <span className="text-sky-300"> → {prefix}{fmt(to)}{suffix}</span>}
        </span>
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

