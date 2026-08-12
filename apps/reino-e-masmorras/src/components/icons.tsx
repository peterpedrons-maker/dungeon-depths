// Small monochrome glyphs (inherit color via `currentColor`) used as icons
// for equipment slots and skill-node types — no external art dependency,
// just enough shape to be legible at 28-40px.
import { CSSProperties } from 'react';

interface IconProps { className?: string; style?: CSSProperties; }

export function IconSword({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M12 2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.5 15.5h5L12 21z" fill="currentColor" />
    </svg>
  );
}

export function IconChest({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M8 4 5 6.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6.5L16 4l-4 3-4-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLegs({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M7 3h10l1 8-2 10h-3l-1-9-1 9h-3L6 11 7 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function IconGloves({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M7 13V6a2 2 0 0 1 4 0v5V4.5a2 2 0 0 1 4 0V11V5.5a2 2 0 0 1 4 0V13a6 6 0 0 1-6 6h-1a5 5 0 0 1-5-5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function IconRing({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <circle cx="12" cy="15" r="6" stroke="currentColor" strokeWidth="2" />
      <path d="M9 8l3-5 3 5-3 2-3-2Z" fill="currentColor" />
    </svg>
  );
}

export function IconAttribute({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 13.5 12 9l3.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 17 12 12.5 15.5 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  );
}

export function IconPassive({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M12 3 5 5.5V11c0 5 3 8.5 7 10 4-1.5 7-5 7-10V5.5L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function IconActive({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path
        d="M12 2l2.2 6.2L20 10l-5.8 1.8L12 18l-2.2-6.2L4 10l5.8-1.8L12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconEmptySlot({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
    </svg>
  );
}
