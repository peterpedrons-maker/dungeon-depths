import { ReactNode } from 'react';
import moldura from '../assets/moldura.webp';
import pergaminho from '../assets/pergaminho.webp';
import banner from '../assets/banner.webp';

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="relative shadow-[0_10px_30px_rgba(0,0,0,0.55)]"
      style={{
        borderImageSource: `url(${moldura})`,
        borderImageSlice: 96,
        borderImageWidth: '28px',
        borderImageRepeat: 'round',
        borderStyle: 'solid',
        borderWidth: '28px',
      }}
    >
      <div
        className="relative bg-panel"
        style={{ backgroundImage: `url(${pergaminho})`, backgroundSize: '340px', backgroundBlendMode: 'multiply' }}
      >
        <div className="relative flex items-center justify-center px-10 sm:px-14 min-h-[60px] sm:min-h-[72px] -mb-2">
          <div
            className="absolute inset-2 sm:inset-3 bg-no-repeat bg-center"
            style={{ backgroundImage: `url(${banner})`, backgroundSize: '100% 100%' }}
            aria-hidden
          />
          <h2 className="relative font-display text-gold text-xs sm:text-sm md:text-base tracking-[0.15em] sm:tracking-[0.2em] uppercase text-center [text-shadow:0_1px_0_rgba(0,0,0,0.8)]">
            {title}
          </h2>
        </div>
        <div className="relative p-3 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
