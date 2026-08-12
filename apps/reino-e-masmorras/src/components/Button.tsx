import { ButtonHTMLAttributes } from 'react';
import dourado from '../assets/botao-dourado.webp';
import carmesim from '../assets/botao-carmesim.webp';
import neutro from '../assets/botao-neutro.webp';

const VARIANTS = { dourado, carmesim, neutro };
type Variant = keyof typeof VARIANTS;

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: Variant;
}

export function Button({ variant, className = '', children, style, ...rest }: Props) {
  const textColor = variant === 'dourado' ? 'text-ink' : 'text-parchment';
  return (
    <button
      {...rest}
      className={`relative inline-flex items-center justify-center font-bold tracking-wide bg-no-repeat bg-center px-6 py-3 min-w-[130px] transition hover:brightness-110 active:brightness-95 disabled:opacity-40 disabled:grayscale disabled:hover:brightness-100 ${textColor} ${className}`}
      style={{ backgroundImage: `url(${VARIANTS[variant]})`, backgroundSize: '100% 100%', ...style }}
    >
      <span className="relative [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">{children}</span>
    </button>
  );
}
