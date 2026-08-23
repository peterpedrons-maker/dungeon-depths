import { EquipmentItem } from '../types/game';
import { rarityColor, slotTintStyle } from '../lib/equipment';
import { compareItemStatRows, itemDisplayName, StatCompareRow } from '../lib/enhancement';
import { ItemIcon } from './ItemIcon';

// Shared between CharacterOverview's inventory-vs-equipped compare window
// and the Mercador's shop-item-vs-equipped compare window — same visual
// language (amber base / sky-blue affix, green improvement / crimson
// downgrade, a dedicated "Atributos Perdidos" callout) wherever the player
// is deciding whether a candidate item should replace what they're wearing.

export const BASE_ACCENT = { dot: 'bg-amber-300', text: 'text-amber-200/90' };
export const AFFIX_ACCENT = { dot: 'bg-sky-400', text: 'text-sky-300/90' };

export function fmtStatValue(v: number, isPct: boolean): string {
  return isPct ? `${Math.round(v * 100)}%` : `${Math.round(v)}`;
}

function CompareStatRow({ row, side }: { row: StatCompareRow; side: 'equipped' | 'new' }) {
  const { label, isPct, equippedValue: eq, newValue: nv, isBase } = row;
  const isNew = side === 'new' && eq === 0 && nv !== 0;
  const improved = side === 'new' && eq !== 0 && nv !== 0 && nv > eq;
  const worsened = side === 'new' && eq !== 0 && nv !== 0 && nv < eq;
  const accent = isBase ? BASE_ACCENT : AFFIX_ACCENT;

  let valueNode: React.ReactNode;
  if (side === 'equipped') {
    // Plain read of what's currently equipped — no arrows here, the change
    // itself only claims a direction once, on the Novo side below.
    valueNode = <span className="text-parchment">{fmtStatValue(eq, isPct)}</span>;
  } else if (isNew) {
    valueNode = <span className="text-green-400">{fmtStatValue(nv, isPct)}</span>;
  } else if (improved || worsened) {
    // "delta → total": the amount changing reads first, left to right,
    // before the number it lands on — e.g. "-7 → 17" for a stat going from
    // 24 down to 17, so the size of the change is the first thing read.
    const delta = improved ? nv - eq : eq - nv;
    const changeColor = improved ? 'text-green-400' : 'text-crimson';
    valueNode = (
      <>
        <span className={changeColor}>{improved ? '+' : '-'}{fmtStatValue(delta, isPct)}</span>
        <span className="text-parchment/40">→</span>
        <span className={changeColor}>{fmtStatValue(nv, isPct)}</span>
      </>
    );
  } else {
    valueNode = <span className="text-parchment">{fmtStatValue(nv, isPct)}</span>;
  }

  return (
    <div className="flex items-center justify-between gap-1.5 text-[11px]">
      {/* Base (the item's guaranteed slot stat) reads amber; affixes (the
          rolled bonuses) read sky blue — same dot+color pairing as the
          section caption above, repeated per row so it still reads once
          rows from both categories sit next to each other. */}
      <span className="flex items-center gap-1.5 min-w-0">
        <span className={`w-1 h-1 rounded-full shrink-0 ${accent.dot}`} />
        <span className={`truncate ${accent.text}`}>{label}</span>
      </span>
      <span className="flex items-center gap-1 font-bold tabular-nums shrink-0">
        {valueNode}
        {isNew && <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wide">Novo</span>}
      </span>
    </div>
  );
}

// One column of the compare window — icon, name, and this item's OWN stat
// picture, kept fully separate from the other item's column (each reads its
// own real numbers, never a shared/merged total) while still carrying the
// NOVO/delta verdict from `rows` (see CompareStatRow) so the two columns
// stay easy to read against each other despite listing different stats.
// `rows` is the full compareItemStatRows() output for the pair, shared so
// both columns agree on what counts as base vs affix and what changed;
// each column just filters to the stats *it* actually has. A stat the swap
// would drop entirely (nonzero here, zero on the other side) still shows
// up plainly in its own column — see LostAttributesSection below for the
// dedicated callout about what specifically disappears on the swap.
function ItemCompareColumn({ item, label, rows, side }: {
  item: EquipmentItem | null;
  label: string;
  rows: StatCompareRow[];
  side: 'equipped' | 'new';
}) {
  const color = item ? rarityColor(item.rarity) : undefined;
  const own = rows.filter((r) => (side === 'equipped' ? r.equippedValue !== 0 : r.newValue !== 0));
  const baseRows = own.filter((r) => r.isBase);
  const affixRows = own.filter((r) => !r.isBase);
  return (
    <div className="relative flex flex-col items-center gap-1.5 rounded overflow-hidden border border-panelborder/40 bg-black/25 p-2.5 pt-3.5 min-w-0 shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]">
      {/* Rarity-colored strip along the top, echoing the icon frame's own
          rarity tint below — makes the whole card read as "this item",
          not just the little icon square in the middle of it. */}
      {item && <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: color }} />}
      <span className="text-[10px] uppercase tracking-wide text-parchment/40 font-bold">{label}</span>
      <div style={slotTintStyle(item)} className="w-16 h-16 rounded-[3px] bg-[var(--slot-bg)] border-2 border-[var(--slot-border)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)] flex items-center justify-center shrink-0">
        {item ? <ItemIcon item={item} className="w-[85%] h-[85%]" style={{ color }} /> : <span className="text-parchment/30 text-[9px]">Vazio</span>}
      </div>
      <span className="text-xs font-bold text-center leading-tight break-words" style={item ? { color } : undefined}>
        {item ? itemDisplayName(item) : '—'}
      </span>
      {/* No "Atributo Base"/"Afixos" caption above each group — every row
          already carries its own dot+color (amber vs sky blue, see
          CompareStatRow), so the split reads clearly without spending a
          text line on it. A slightly larger gap between the two groups
          (vs. within a group) keeps the base/affix split visible. */}
      {own.length > 0 && (
        <div className="w-full mt-1 space-y-2.5 border-t border-panelborder/30 pt-2">
          {baseRows.length > 0 && (
            <div className="space-y-1">{baseRows.map((r) => <CompareStatRow key={r.label} row={r} side={side} />)}</div>
          )}
          {affixRows.length > 0 && (
            <div className="space-y-1">{affixRows.map((r) => <CompareStatRow key={r.label} row={r} side={side} />)}</div>
          )}
        </div>
      )}
    </div>
  );
}

// Standalone callout for stats the equipped item has that the candidate
// item doesn't roll at all (equippedValue nonzero, newValue zero) — pulled
// out of both columns into its own "Atributos Perdidos" block instead of a
// small inline tag, so a swap's full cost is legible at a glance instead of
// buried one row at a time inside the Equipado column.
function LostAttributesSection({ rows }: { rows: StatCompareRow[] }) {
  const lost = rows.filter((r) => r.equippedValue !== 0 && r.newValue === 0);
  if (lost.length === 0) return null;
  return (
    <div className="w-full rounded border border-crimson/30 bg-crimson/10 p-2.5">
      <span className="text-[10px] uppercase tracking-wider font-bold text-crimson block mb-1.5">Atributos Perdidos</span>
      <div className="space-y-1">
        {lost.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-1.5 text-[11px]">
            <span className="text-crimson/80 truncate min-w-0">{r.label}</span>
            <span className="text-crimson font-bold tabular-nums shrink-0">-{fmtStatValue(r.equippedValue, r.isPct)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Full two-column compare block (Equipado vs. Novo by default) plus the
// lost-attributes callout beneath it — the one thing CharacterOverview's
// inventory item view, the Mercador's shop item view, and the Ferreiro's
// pre/post-enhance reveal all need, so a candidate item always reads
// against whatever it's being compared to the same way no matter where the
// player is looking at it from. `labels` lets the Ferreiro relabel the
// columns "Antes"/"Depois" for an enhance reveal instead of the
// equip-a-new-item framing the default wording assumes.
export function ItemCompareGrid({ equipped, candidate, labels }: {
  equipped: EquipmentItem | null; candidate: EquipmentItem; labels?: { left: string; right: string };
}) {
  const rows = compareItemStatRows(candidate, equipped);
  const left = labels?.left ?? 'Equipado';
  const right = labels?.right ?? 'Novo';
  return (
    <>
      <div className="grid grid-cols-2 gap-3 w-full items-start">
        <ItemCompareColumn item={equipped} label={left} rows={rows} side="equipped" />
        <ItemCompareColumn item={candidate} label={right} rows={rows} side="new" />
      </div>
      <LostAttributesSection rows={rows} />
    </>
  );
}
