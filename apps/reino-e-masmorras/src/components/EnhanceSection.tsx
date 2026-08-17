import { EquipmentItem } from '../types/game';
import { fmt } from '../lib/format';
import { enhanceCost, MAX_ENHANCE_LEVEL, maxEnhanceLevelForForja, successChanceForLevel } from '../lib/enhancement';
import { SmallButton } from './Button';

// Shared between CharacterOverview's quick item modal (instant — click and
// the roll happens immediately) and the Forja screen's simple cap/cost
// messaging. The Ferreiro's own confirm/animation flow builds its buttons
// separately since it needs a preview step before actually spending gold.
export function EnhanceSection({ item, gold, forjaLevel, onEnhance }: {
  item: EquipmentItem; gold: number; forjaLevel: number; onEnhance: (item: EquipmentItem) => boolean | undefined;
}) {
  const cap = maxEnhanceLevelForForja(forjaLevel);
  const cost = enhanceCost(item);
  const chance = successChanceForLevel(item.enhanceLevel);
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
        <>
          <SmallButton onClick={() => onEnhance(item)} disabled={gold < cost}>
            Aprimorar para +{item.enhanceLevel + 1} — {fmt(cost)} ouro
          </SmallButton>
          <p className="text-[11px] text-parchment/40 mt-1">Chance de sucesso: {Math.round(chance * 100)}%</p>
        </>
      )}
    </div>
  );
}
