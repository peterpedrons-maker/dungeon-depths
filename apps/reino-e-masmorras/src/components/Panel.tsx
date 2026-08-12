import { ReactNode } from 'react';
import pergaminho from '../assets/pergaminho.webp';

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="relative rounded-sm border border-gold/40 bg-panel shadow-[0_10px_30px_rgba(0,0,0,0.55)] overflow-hidden"
      style={{ backgroundImage: `url(${pergaminho})`, backgroundSize: '340px', backgroundBlendMode: 'multiply' }}
    >
      <div className="relative border-b-2 border-gold/40 px-4 py-3 sm:py-4">
        <h2 className="font-display text-gold text-xs sm:text-sm md:text-base font-bold tracking-[0.12em] sm:tracking-[0.18em] uppercase text-center leading-snug [text-shadow:0_1px_0_rgba(0,0,0,0.8)]">
          {title}
        </h2>
      </div>
      <div className="relative p-3 sm:p-5">{children}</div>
    </div>
  );
}
