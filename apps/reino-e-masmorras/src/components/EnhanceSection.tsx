import { EquipmentItem } from '../types/game';
import { fmt } from '../lib/format';
import { enhanceCost, MAX_ENHANCE_LEVEL, maxEnhanceLevelForForja } from '../lib/enhancement';
import { SmallButton } from './Button';

// Shared between CharacterOverview's item modal and the Forja screen — the
// same "spend gold to push +N" control, wherever the player opens an item
// from.
export function EnhanceSection({ item, gold, forjaLevel, onEnhance }: {
  item: EquipmentItem; gold: number; forjaLevel: number; onEnhance: (item: EquipmentItem) => void;
}) {
  const cap = maxEnhanceLevelForForja(forjaLevel);
  const cost = enhanceCost(item);
  const atHardCap = item.enhanceLevel >= MAX_ENHANCE_LEVEL;
  const atForjaCap = item.enhanceLevel >= cap;

  return (
    <div className="mt-3 pt-2 border-t border-panelborder/40">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-parchment/60">Aprimoramento na Forja</span>
        <span className="font-bold tabular-nums text-gold">+{item.enhanceLevel}/{MAX_ENHANCE_LEVEL}</span>
      </div>
      {atHardCap ? (
        <p className="text-xs text-parchment/40 italic">Nível máximo de aprimoramento atingido.</p>
      ) : atForjaCap ? (
        <p className="text-xs text-parchment/40 italic">
          Requer Forja nível {Math.ceil((item.enhanceLevel + 1) / 2)} (atual: {forjaLevel}).
        </p>
      ) : (
        <SmallButton onClick={() => onEnhance(item)} disabled={gold < cost}>
          Aprimorar para +{item.enhanceLevel + 1} — {fmt(cost)} ouro
        </SmallButton>
      )}
    </div>
  );
}
