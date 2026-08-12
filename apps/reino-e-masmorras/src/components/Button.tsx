import { ButtonHTMLAttributes } from 'react';
import dourado from '../assets/botao-dourado.webp';

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className = '', children, style, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`relative inline-flex items-center justify-center font-bold tracking-wide text-ink bg-no-repeat bg-center px-6 py-3 min-w-[130px] transition hover:brightness-110 active:brightness-95 disabled:opacity-40 disabled:grayscale disabled:hover:brightness-100 ${className}`}
      style={{ backgroundImage: `url(${dourado})`, backgroundSize: '100% 100%', ...style }}
    >
      <span className="relative [text-shadow:0_1px_1px_rgba(255,255,255,0.3)]">{children}</span>
    </button>
  );
}
