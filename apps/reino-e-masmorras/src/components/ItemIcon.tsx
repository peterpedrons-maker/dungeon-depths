import type { CSSProperties } from 'react';
import { EquipmentItem, ItemSlot } from '../types/game';
import { itemSheetStyle } from '../lib/itemIcons';
import { IconSword, IconChest, IconLegs, IconGloves, IconShield, IconRing } from './icons';

const SLOT_GLYPH: Record<ItemSlot, typeof IconSword> = {
  weapon: IconSword, body: IconChest, legs: IconLegs, hands: IconGloves, offhand: IconShield, accessory: IconRing,
};

// Renders the real per-tier sprite for slots that have art, or falls back
// to the plain per-slot glyph for any class/slot combination that doesn't
// (e.g. a class with no offhand) — same className/style API either way, so
// callers don't need to care which one they got.
//
// Sprite cells aren't square (a sword's tall silhouette vs. a crossbow's
// wide one), so the real-art branch letterboxes to the sprite's own aspect
// ratio inside whatever box the caller gives it, using the container-query
// "contain" formula (width = min(100cqw, 100cqh*aspect), and vice versa)
// instead of stretching the sprite to match the box.
export function ItemIcon({ item, className, style }: { item: EquipmentItem; className?: string; style?: CSSProperties }) {
  const sheet = itemSheetStyle(item);
  if (sheet) {
    return (
      <div className={`flex items-center justify-center ${className ?? ''}`} style={{ ...style, containerType: 'size' }}>
        <div
          style={{
            width: `min(100cqw, ${100 * sheet.aspect}cqh)`,
            height: `min(100cqh, ${100 / sheet.aspect}cqw)`,
            ...sheet.backgroundStyle,
          }}
        />
      </div>
    );
  }
  const Glyph = SLOT_GLYPH[item.slot];
  return <Glyph className={className} style={style} />;
}
