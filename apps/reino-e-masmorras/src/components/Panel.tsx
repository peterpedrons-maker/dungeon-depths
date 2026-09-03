import { ReactNode } from 'react';
import pergaminho from '../assets/pergaminho.webp';
import { IconArrowLeft } from './icons';

// `onBack` is what the Sidebar's always-visible nav used to give every
// screen for free — now that navigation only happens from the Reino hub's
// buildings/shortcut icons, a screen reached that way has no other route
// back, so any caller passing it gets a consistent, on-theme way out
// without having to build its own (same circular gold-ring "×" button
// language already used by Ferreiro/Mercador/Bau, just an arrow instead).
export function Panel({ title, onBack, children }: { title: string; onBack?: () => void; children: ReactNode }) {
  return (
    <div
      className="relative rounded-sm border border-gold/40 bg-panel shadow-[0_10px_30px_rgba(0,0,0,0.55)] overflow-hidden"
      style={{ backgroundImage: `url(${pergaminho})`, backgroundSize: '340px', backgroundBlendMode: 'multiply' }}
    >
      <div className="relative border-b-2 border-gold/40 px-4 py-3 sm:py-4">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Voltar"
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/70 border-2 border-gold/70 text-gold hover:bg-black/85 hover:border-gold flex items-center justify-center shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.6)] transition"
          >
            <IconArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
        <h2 className="font-display text-gold text-xs sm:text-sm md:text-base font-bold tracking-[0.12em] sm:tracking-[0.18em] uppercase text-center leading-snug [text-shadow:0_1px_0_rgba(0,0,0,0.8)] px-9 sm:px-10">
          {title}
        </h2>
      </div>
      <div className="relative p-3 sm:p-5">{children}</div>
    </div>
  );
}
