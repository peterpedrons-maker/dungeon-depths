import { useState } from 'react';
import { Rarity, RuneStack } from '../types/game';
import { rarityColor, rarityIndex, rarityName, hexToRgba } from '../lib/equipment';
import { SmallButton } from './Button';
import { Modal } from './Modal';
import runaComumUrl from '../assets/runa-comum.webp';
import runaIncomumUrl from '../assets/runa-incomum.webp';
import runaRaroUrl from '../assets/runa-raro.webp';
import runaEpicoUrl from '../assets/runa-epico.webp';
import runaLendarioUrl from '../assets/runa-lendario.webp';

interface Props {
  runes: RuneStack[];
  // Omitted on a read-only surface (none currently) — every screen that
  // renders this today can also sell from it.
  onSell: (rarity: Rarity, tier: number, count: number) => void;
}

const RUNE_ART: Record<Rarity, string> = {
  comum: runaComumUrl, incomum: runaIncomumUrl, raro: runaRaroUrl,
  epico: runaEpicoUrl, legendario: runaLendarioUrl,
};

// A compact grid of every Runa de Aprimoramento stack the player owns, one
// square tile per stack — replaces the old text-heavy pill row ("Épico T3
// ×115", "Raro T3 ×177", ...) once real per-rarity art shipped, which let
// the tile carry rarity by its own color/shape instead of spelling the name
// out every time. Tier and count sit as small corner badges on the art
// itself, same footprint as an equipment slot. Sorted best-rarity-first
// (then highest tier first) so the runes worth paying attention to aren't
// buried in whatever order they happened to drop — the old flex-wrap row had
// no sort at all, which read as genuinely disordered once a player had more
// than a couple of stacks. Shown identically on the Inventário, Baú,
// Ferreiro and Mercador screens so the player always knows what they have on
// hand, wherever they might want to spend or sell one.
export function RuneShelf({ runes, onSell }: Props) {
  const [selling, setSelling] = useState<RuneStack | null>(null);
  if (runes.length === 0) return null;
  const sorted = [...runes].sort((a, b) => {
    const byRarity = rarityIndex(b.rarity) - rarityIndex(a.rarity);
    return byRarity !== 0 ? byRarity : b.tier - a.tier;
  });
  return (
    <div className="mb-3">
      <p className="text-[10px] text-parchment/40 uppercase tracking-wide mb-1.5">Runas de Aprimoramento</p>
      <div className="flex flex-wrap gap-2">
        {sorted.map((r) => {
          const color = rarityColor(r.rarity);
          return (
            <button
              key={`${r.rarity}-${r.tier}`}
              onClick={() => setSelling(r)}
              title={`${rarityName(r.rarity)} T${r.tier} ×${r.count}`}
              className="relative w-14 h-14 shrink-0 rounded-[2px] border transition-transform hover:scale-105"
              style={{ background: hexToRgba(color, 0.12), borderColor: hexToRgba(color, 0.55) }}
            >
              <img
                src={RUNE_ART[r.rarity]} alt={rarityName(r.rarity)}
                className="absolute inset-0 w-full h-full object-contain p-1"
                draggable={false}
              />
              <span
                className="absolute top-0 left-0 text-[9px] font-bold leading-none px-1 py-0.5 rounded-br-[2px] bg-black/70"
                style={{ color }}
              >
                T{r.tier}
              </span>
              <span className="absolute bottom-0 right-0 text-[10px] font-extrabold leading-none px-1 py-0.5 rounded-tl-[2px] bg-black/70 text-parchment">
                ×{r.count}
              </span>
            </button>
          );
        })}
      </div>
      {selling && (
        <SellRuneModal
          stack={selling}
          onSell={(count) => { onSell(selling.rarity, selling.tier, count); setSelling(null); }}
          onClose={() => setSelling(null)}
        />
      )}
    </div>
  );
}

function SellRuneModal({ stack, onSell, onClose }: { stack: RuneStack; onSell: (count: number) => void; onClose: () => void }) {
  const [qty, setQty] = useState(stack.count);
  const clamp = (n: number) => Math.max(1, Math.min(stack.count, Math.floor(n) || 1));
  return (
    <Modal
      title={`Vender Runa — ${rarityName(stack.rarity)} T${stack.tier}`}
      onClose={onClose}
      footer={
        <>
          <SmallButton onClick={onClose} variant="ghost">Cancelar</SmallButton>
          <SmallButton onClick={() => onSell(qty)}>Vender ({qty} ouro)</SmallButton>
        </>
      }
    >
      <p className="text-sm text-parchment/70 mb-3">1 ouro por runa — você tem {stack.count}.</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={stack.count}
          value={qty}
          onChange={(e) => setQty(clamp(Number(e.target.value)))}
          className="w-24 bg-black/30 border border-panelborder/50 rounded px-2 py-1.5 text-sm text-parchment"
        />
        <SmallButton onClick={() => setQty(stack.count)} variant="ghost">Vender Tudo</SmallButton>
      </div>
    </Modal>
  );
}
