import { useState } from 'react';
import { Rarity, RuneStack } from '../types/game';
import { rarityColor, rarityName } from '../lib/equipment';
import { IconGem } from './icons';
import { SmallButton } from './Button';
import { Modal } from './Modal';

interface Props {
  runes: RuneStack[];
  // Omitted on a read-only surface (none currently) — every screen that
  // renders this today can also sell from it.
  onSell: (rarity: Rarity, tier: number, count: number) => void;
}

// A compact strip of every Runa de Aprimoramento stack the player owns —
// no dedicated art exists yet (see KIT-DE-ARTE.md's pending prompt), so
// each chip reuses the shared gem glyph tinted by the stack's own rarity
// color, same "placeholder now, real art later" pattern equipment icons
// used before their own art shipped. Shown identically on the Inventário,
// Baú, Ferreiro and Mercador screens so the player always knows what they
// have on hand, wherever they might want to spend or sell one.
export function RuneShelf({ runes, onSell }: Props) {
  const [selling, setSelling] = useState<RuneStack | null>(null);
  if (runes.length === 0) return null;
  return (
    <div className="mb-3">
      <p className="text-[10px] text-parchment/40 uppercase tracking-wide mb-1.5">Runas de Aprimoramento</p>
      <div className="flex flex-wrap gap-1.5">
        {runes.map((r) => (
          <button
            key={`${r.rarity}-${r.tier}`}
            onClick={() => setSelling(r)}
            style={{ color: rarityColor(r.rarity), borderColor: rarityColor(r.rarity) }}
            className="flex items-center gap-1 text-[11px] font-bold rounded-full pl-1.5 pr-2.5 py-1 border bg-black/25 hover:bg-black/40"
          >
            <IconGem className="w-3.5 h-3.5 shrink-0" />
            {rarityName(r.rarity)} T{r.tier} ×{r.count}
          </button>
        ))}
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
