import { ReactNode } from 'react';

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative rounded-sm border-2 border-gold/60 bg-panel shadow-[0_10px_30px_rgba(0,0,0,0.55)] overflow-hidden">
      <div className="absolute inset-[3px] rounded-sm border border-panelborder/70 pointer-events-none" />
      <div className="relative bg-gradient-to-b from-panel2 to-panel border-b-2 border-gold/40 px-5 py-3 flex items-center justify-center gap-3">
        <Diamond />
        <h2 className="font-display text-gold text-sm md:text-base tracking-[0.2em] uppercase text-center [text-shadow:0_1px_0_rgba(0,0,0,0.8)]">
          {title}
        </h2>
        <Diamond />
      </div>
      <div className="relative p-5">{children}</div>
    </div>
  );
}

function Diamond() {
  return <span className="w-2 h-2 bg-gold/70 rotate-45 shrink-0" aria-hidden />;
}
