import type { CSSProperties } from 'react';
import { EquipmentItem, ItemSlot } from '../types/game';
import { itemSheetStyle } from '../lib/itemIcons';
import { IconSword, IconChest, IconLegs, IconGloves, IconShield, IconRing } from './icons';

const SLOT_GLYPH: Record<ItemSlot, typeof IconSword> = {
  weapon: IconSword, body: IconChest, legs: IconLegs, hands: IconGloves, offhand: IconShield, accessory: IconRing,
};

// Renders the real per-tier sprite for slots that have art (weapon/offhand
// today) or falls back to the plain per-slot glyph otherwise (armor/
// accessory, until their sheets are generated) — same className/style API
// either way, so callers don't need to care which one they got.
export function ItemIcon({ item, className, style }: { item: EquipmentItem; className?: string; style?: CSSProperties }) {
  const sheetStyle = itemSheetStyle(item);
  if (sheetStyle) {
    return <div className={className} style={{ ...sheetStyle, ...style }} />;
  }
  const Glyph = SLOT_GLYPH[item.slot];
  return <Glyph className={className} style={style} />;
}
