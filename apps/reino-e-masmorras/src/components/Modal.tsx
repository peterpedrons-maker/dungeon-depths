import { ReactNode, useEffect } from 'react';
import pergaminho from '../assets/pergaminho.webp';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  // Drops the parchment texture for a flat dark panel instead — used for
  // item tooltips (Path of Exile-style stat sheet), where a busy background
  // fights with reading the item's own stats. Other modals (skills, building
  // confirmations) keep the textured book-panel look by default.
  plain?: boolean;
}

export function Modal({ title, onClose, children, footer, plain }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className={`relative w-full max-w-sm rounded-sm border-2 border-gold/50 shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden ${plain ? 'bg-nightsky' : 'bg-panel'}`}
        style={plain ? undefined : { backgroundImage: `url(${pergaminho})`, backgroundSize: '340px', backgroundBlendMode: 'multiply' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative border-b-2 border-gold/40 px-4 py-3 flex items-center justify-between gap-3">
          <h3 className="font-display text-gold text-sm font-bold tracking-[0.1em] uppercase leading-snug">{title}</h3>
          <button onClick={onClose} className="text-parchment/50 hover:text-parchment text-xl leading-none px-1 shrink-0" aria-label="Fechar">×</button>
        </div>
        <div className="relative p-4 text-sm text-parchment/90 space-y-2">{children}</div>
        {footer && <div className="relative border-t border-gold/20 p-3 flex gap-2 justify-end flex-wrap">{footer}</div>}
      </div>
    </div>
  );
}
