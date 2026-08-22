import { useEffect, useState } from 'react';
import gameLogo from '../assets/reino-masmorras-logo.webp';
import { Button } from './Button';

// Fires once per Chrome/Android page load (as long as install criteria are
// still met and the app isn't already installed) — captured instead of
// letting the browser show its own mini-infobar, so we control exactly
// when/how the install pitch appears instead of depending on Chrome's own
// display heuristics for that infobar.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isMobile(): boolean {
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

// A player who dismisses this shouldn't have it block the screen again for
// the rest of that same visit — but the very next time they open the game
// in the browser (a fresh load), it's back, per how often this Mercador...
// er, this banner is meant to nag: every browser visit until the app is
// actually installed.
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (!isMobile() || isStandalone()) return;

    if (isIOS()) {
      // Safari never fires beforeinstallprompt — "Adicionar à Tela de
      // Início" only exists as a manual step under the Share sheet, so the
      // best this can do is point the player at it.
      setIos(true);
      setVisible(true);
      return;
    }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  if (!visible) return null;

  async function handleInstallClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center px-3 pb-3 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 max-w-sm w-full rounded border-2 border-gold/60 bg-nightsky/95 shadow-lg px-3 py-2.5">
        <img src={gameLogo} alt="" className="w-10 h-10 object-contain shrink-0" style={{ imageRendering: 'pixelated' }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gold leading-tight">Instale Reino & Masmorras</p>
          <p className="text-[11px] text-parchment/80 leading-snug mt-0.5">
            {ios
              ? 'Toque em Compartilhar e depois em "Adicionar à Tela de Início".'
              : 'Jogue direto da tela inicial, sem precisar abrir o navegador.'}
          </p>
        </div>
        {ios ? (
          <button
            onClick={() => setVisible(false)}
            className="text-parchment/60 hover:text-parchment text-lg leading-none px-1 shrink-0"
            aria-label="Fechar"
          >
            ×
          </button>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            <Button className="!min-w-0 !px-3 !py-1.5 text-xs" onClick={handleInstallClick}>Instalar</Button>
            <button
              onClick={() => setVisible(false)}
              className="text-parchment/60 hover:text-parchment text-lg leading-none px-1"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
