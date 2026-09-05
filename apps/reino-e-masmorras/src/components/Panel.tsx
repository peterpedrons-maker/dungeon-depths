import { ReactNode, useEffect, useRef, useState } from 'react';
import pergaminho from '../assets/pergaminho.webp';
import { IconArrowLeft } from './icons';

const BACK_BTN_CLASS =
  'w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/80 border-2 border-gold/70 text-gold hover:bg-black/90 hover:border-gold flex items-center justify-center shrink-0 shadow-[0_2px_12px_rgba(0,0,0,0.7)] transition';

// `onBack` is what the Sidebar's always-visible nav used to give every
// screen for free — now that navigation only happens from the Reino hub's
// buildings/shortcut icons, a screen reached that way has no other route
// back, so any caller passing it gets a consistent, on-theme way out
// without having to build its own (same circular gold-ring "×" button
// language already used by Ferreiro/Mercador/Bau, just an arrow instead).
//
// On a screen tall enough to scroll (the page itself scrolls, not an inner
// container), this in-header button scrolls away with everything else —
// once that happens a `position: fixed` clone takes over at the same
// on-screen spot, so the player is never more than one tap from "back"
// without hunting back up to the top. CSS `position: sticky` would need
// the header's containing block reaching down the whole panel to stay
// pinned that long, which `overflow-hidden` on this same panel (kept for
// the background art's rounded corners) blocks in most browsers — so this
// tracks the anchor's own screen position instead and swaps buttons rather
// than fighting that. The fixed clone only ever appears once the header's
// own button has scrolled off, so the two are never visible at once, and
// TopBar (above this panel) is by then already scrolled out of the way too.
export function Panel({ title, onBack, children }: { title: string; onBack?: () => void; children: ReactNode }) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [floating, setFloating] = useState(false);

  useEffect(() => {
    if (!onBack) return;
    function check() {
      const top = anchorRef.current?.getBoundingClientRect().top;
      if (top !== undefined) setFloating(top < 8);
    }
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [onBack]);

  return (
    <div
      className="relative rounded-sm border border-gold/40 bg-panel shadow-[0_10px_30px_rgba(0,0,0,0.55)] overflow-hidden"
      style={{ backgroundImage: `url(${pergaminho})`, backgroundSize: '340px', backgroundBlendMode: 'multiply' }}
    >
      <div className="relative border-b-2 border-gold/40 px-4 py-3 sm:py-4">
        {onBack && (
          <button
            ref={anchorRef}
            onClick={onBack}
            aria-label="Voltar"
            className={`absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 ${BACK_BTN_CLASS} ${floating ? 'invisible' : ''}`}
          >
            <IconArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
        <h2 className="font-display text-gold text-xs sm:text-sm md:text-base font-bold tracking-[0.12em] sm:tracking-[0.18em] uppercase text-center leading-snug [text-shadow:0_1px_0_rgba(0,0,0,0.8)] px-9 sm:px-10">
          {title}
        </h2>
      </div>
      <div className="relative p-3 sm:p-5">{children}</div>
      {onBack && floating && (
        <button
          onClick={onBack}
          aria-label="Voltar"
          className={`fixed left-2 sm:left-3 top-2 sm:top-3 z-30 ${BACK_BTN_CLASS}`}
        >
          <IconArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}
    </div>
  );
}
