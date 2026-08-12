import { ReactNode } from 'react';

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative rounded-sm border-4 border-wood bg-panel shadow-[0_10px_30px_rgba(0,0,0,0.55)] overflow-hidden">
      <div className="absolute inset-[3px] rounded-sm border border-woodlight/50 pointer-events-none" />
      <div className="relative bg-gradient-to-b from-panel2 to-panel border-b-2 border-gold/40 px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-center gap-2 sm:gap-3">
        <Diamond />
        <h2 className="font-display text-gold text-xs sm:text-sm md:text-base tracking-[0.15em] sm:tracking-[0.2em] uppercase text-center [text-shadow:0_1px_0_rgba(0,0,0,0.8)]">
          {title}
        </h2>
        <Diamond />
      </div>
      <div className="relative p-3 sm:p-5">{children}</div>
    </div>
  );
}

function Diamond() {
  return <span className="w-2 h-2 bg-gold/70 rotate-45 shrink-0" aria-hidden />;
}
