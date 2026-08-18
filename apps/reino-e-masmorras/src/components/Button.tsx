import { ButtonHTMLAttributes, MouseEvent } from 'react';
import dourado from '../assets/botao-dourado.webp';
import { playClickSfx } from '../lib/audio';

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className = '', children, style, onClick, ...rest }: Props) {
  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    playClickSfx();
    onClick?.(e);
  }
  return (
    <button
      {...rest}
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center font-bold tracking-wide text-ink bg-no-repeat bg-center px-6 py-3 min-w-[130px] transition hover:brightness-110 active:brightness-95 disabled:opacity-40 disabled:grayscale disabled:hover:brightness-100 ${className}`}
      style={{ backgroundImage: `url(${dourado})`, backgroundSize: '100% 100%', ...style }}
    >
      <span className="relative [text-shadow:0_1px_1px_rgba(255,255,255,0.3)]">{children}</span>
    </button>
  );
}

// Small inline action button for list-row actions (Equipar/Vender in
// CharacterOverview, priority reorder in SkillTree) — one shared style
// instead of a mismatched one-off <button> per screen.
export function SmallButton({ children, onClick, variant = 'solid', disabled = false }: {
  children: React.ReactNode; onClick: () => void; variant?: 'solid' | 'ghost'; disabled?: boolean;
}) {
  return (
    <button
      onClick={() => { playClickSfx(); onClick(); }}
      disabled={disabled}
      className={
        (variant === 'solid'
          ? 'text-xs px-3 py-1 bg-gold text-ink rounded font-bold hover:brightness-110 shrink-0 whitespace-nowrap'
          : 'text-xs px-3 py-1 border border-panelborder text-parchment/70 rounded font-bold hover:text-parchment hover:border-gold/50 shrink-0 whitespace-nowrap'
        ) + ' disabled:opacity-40 disabled:grayscale disabled:hover:brightness-100 disabled:hover:text-parchment/70'
      }
    >
      {children}
    </button>
  );
}
