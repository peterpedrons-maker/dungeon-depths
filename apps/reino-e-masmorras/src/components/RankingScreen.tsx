import { useState } from 'react';
import { ItemSlot, RankEntry } from '../types/game';
import { CLASSES } from '../lib/classes';
import { CLASS_ICON } from '../lib/classIcons';
import { itemDisplayName, primaryStatLines, secondaryStatLabels } from '../lib/enhancement';
import { rarityColor, SLOT_NAMES, slotTintStyle } from '../lib/equipment';
import { Panel } from './Panel';
import { Modal } from './Modal';
import { ItemIcon } from './ItemIcon';
import { IconTrophy } from './icons';

const MEDAL_COLOR = ['#e0b93c', '#c9c9d4', '#c98a55'];
const EQUIPMENT_SLOTS: ItemSlot[] = ['weapon', 'body', 'legs', 'hands', 'offhand', 'accessory'];

// debugError: the raw error from the last leaderboard read OR write attempt,
// if any — shown inline instead of only logged to console, since a phone
// has no devtools to read that console from. Temporary diagnostic surface,
// not a permanent UI feature.
export function RankingScreen({ ranking, debugError, onBack }: { ranking: RankEntry[]; debugError?: string | null; onBack: () => void }) {
  const [selected, setSelected] = useState<RankEntry | null>(null);
  // Server already orders by level desc / cp desc, but sort again client-side
  // so the screen is correct even if `ranking` ever arrives unsorted (e.g. a
  // future local/offline source).
  const sorted = [...ranking].sort((a, b) => b.level - a.level || b.cp - a.cp);
  return (
    <Panel title="Ranking do Reino" onBack={onBack}>
      {debugError && (
        <p className="text-crimson text-xs bg-crimson/10 border border-crimson/40 rounded px-3 py-2 mb-3">
          O ranking não carregou direito: {debugError}
        </p>
      )}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center text-center py-10 gap-3">
          <IconTrophy className="w-12 h-12 text-parchment/20" />
          <p className="text-parchment/50">Nenhuma expedição registrada ainda.</p>
          <p className="text-parchment/30 text-xs max-w-xs">Complete uma masmorra (ou recue em segurança) pra aparecer aqui com seu nível e poder de combate.</p>
        </div>
      ) : (
        <ol className="space-y-1.5">
          {sorted.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setSelected(r)}
                className={`w-full flex justify-between items-center gap-2 py-2 px-3 rounded border transition hover:brightness-125 ${
                  i < 3 ? 'border-gold/30 bg-gold/5' : 'border-transparent hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: i < 3 ? MEDAL_COLOR[i] : 'transparent', color: i < 3 ? '#1a1208' : undefined }}
                  >
                    <span className={i < 3 ? '' : 'text-parchment/40'}>{i + 1}</span>
                  </span>
                  <img
                    src={CLASS_ICON[r.classId]}
                    alt={CLASSES[r.classId].name}
                    title={CLASSES[r.classId].name}
                    className="w-6 h-6 rounded-full shrink-0 ring-1 ring-black/40"
                    style={{ imageRendering: 'pixelated', boxShadow: r.cosmeticColor ? `0 0 6px 1px ${r.cosmeticColor}80` : undefined }}
                  />
                  <span className="min-w-0 flex flex-col leading-tight">
                    <span className={`truncate ${r.cosmeticColor ? '' : 'text-parchment'}`} style={r.cosmeticColor ? { color: r.cosmeticColor } : undefined}>
                      {r.name}
                    </span>
                    {r.equippedTitleName && (
                      <span className="text-[10px] text-gold/60 italic truncate">{r.equippedTitleName}</span>
                    )}
                  </span>
                  {r.ironMode && <span className="text-crimson text-xs shrink-0" title="Modo Ferro">☠</span>}
                  <span className="text-parchment/40 text-xs shrink-0">Nv.{r.level}</span>
                </span>
                <span className="text-gold font-bold shrink-0">CP {r.cp}</span>
              </button>
            </li>
          ))}
        </ol>
      )}

      {selected && <RankEntryModal entry={selected} onClose={() => setSelected(null)} />}
    </Panel>
  );
}

// Read-only view of a leaderboard entry's equipment snapshot (see
// RankEntry.equipment) — opened by tapping a row above. Older rows written
// before that field existed simply have nothing to show per slot.
function RankEntryModal({ entry, onClose }: { entry: RankEntry; onClose: () => void }) {
  const cls = CLASSES[entry.classId];
  return (
    <Modal onClose={onClose} bare>
      <div className="relative w-72 flex flex-col gap-3 px-5 py-5 rounded-md border border-gold/30 bg-black/55 backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-parchment/50 hover:text-parchment text-lg leading-none px-1"
          aria-label="Fechar"
        >
          ×
        </button>

        <div className="flex items-center gap-2.5">
          <img
            src={CLASS_ICON[entry.classId]}
            alt={cls.name}
            className="w-9 h-9 rounded-full ring-2 ring-black/40"
            style={{ imageRendering: 'pixelated', boxShadow: entry.cosmeticColor ? `0 0 8px 2px ${entry.cosmeticColor}80` : undefined }}
          />
          <div className="min-w-0">
            <div className="font-bold text-base truncate" style={{ color: entry.cosmeticColor ?? cls.color }}>
              {entry.name}{entry.ironMode && <span className="text-crimson ml-1" title="Modo Ferro">☠</span>}
            </div>
            {entry.equippedTitleName && (
              <div className="text-[11px] text-gold/70 italic truncate">{entry.equippedTitleName}</div>
            )}
            <div className="text-[11px] text-parchment/50">{cls.name} · Nv.{entry.level} · CP {entry.cp}</div>
          </div>
        </div>

        {!entry.equipment ? (
          <p className="text-xs text-parchment/40 italic">Sem dados de equipamento para esta expedição.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {EQUIPMENT_SLOTS.map((slot) => {
              const item = entry.equipment![slot];
              return (
                <div key={slot} className="flex items-center gap-2 rounded border border-black/40 bg-black/25 px-2 py-1.5">
                  <div
                    style={slotTintStyle(item)}
                    className="w-9 h-9 rounded-[2px] bg-[var(--slot-bg)] border border-[var(--slot-border)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)] flex items-center justify-center shrink-0"
                  >
                    {item ? <ItemIcon item={item} className="w-[88%] h-[88%]" style={{ color: rarityColor(item.rarity) }} /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-parchment/40 uppercase tracking-wide">{SLOT_NAMES[slot]}</div>
                    {item ? (
                      <>
                        <div className="text-xs font-bold truncate" style={{ color: rarityColor(item.rarity) }}>{itemDisplayName(item)}</div>
                        <div className="text-[10px] text-parchment/60 truncate">{[...primaryStatLines(item), ...secondaryStatLabels(item)].join(' · ')}</div>
                      </>
                    ) : (
                      <div className="text-xs text-parchment/30 italic">Vazio</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
