import { useEffect, useState } from 'react';
import gameLogo from '../assets/reino-masmorras-logo.webp';
import pergaminho from '../assets/pergaminho.webp';
import { Button, SmallButton } from './Button';

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

  // A separate front-and-center window rather than a bottom banner — a
  // dismissible strip along the edge of the screen was too easy to miss or
  // mistake for a lesser notification. Hand-rolled instead of the shared
  // Modal component (rather than reusing it) so this can sit on its own
  // z-[100] layer, above any other Modal (z-50) that might already be open
  // when the prompt fires.
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70" onClick={() => setVisible(false)}>
      <div
        className="relative w-full max-w-sm rounded-sm border-2 border-gold/60 shadow-[0_20px_50px_rgba(0,0,0,0.7)] bg-panel overflow-hidden"
        style={{ backgroundImage: `url(${pergaminho})`, backgroundSize: '340px', backgroundBlendMode: 'multiply' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative border-b-2 border-gold/40 px-4 py-3 flex items-center justify-between gap-3">
          <h3 className="font-display text-gold text-sm font-bold tracking-[0.1em] uppercase leading-snug">Instale Reino & Masmorras</h3>
          <button onClick={() => setVisible(false)} className="text-parchment/50 hover:text-parchment text-xl leading-none px-1 shrink-0" aria-label="Fechar">×</button>
        </div>
        <div className="relative p-4 flex items-center gap-3">
          <img src={gameLogo} alt="" className="w-14 h-14 object-contain shrink-0" style={{ imageRendering: 'pixelated' }} />
          <p className="text-sm text-parchment/90 leading-snug">
            {ios
              ? 'Toque em Compartilhar e depois em "Adicionar à Tela de Início".'
              : 'Jogue direto da tela inicial, sem precisar abrir o navegador.'}
          </p>
        </div>
        <div className="relative border-t border-gold/20 p-3 flex gap-2 justify-end">
          {ios ? (
            <SmallButton onClick={() => setVisible(false)}>Entendi</SmallButton>
          ) : (
            <>
              <SmallButton onClick={() => setVisible(false)} variant="ghost">Agora não</SmallButton>
              <Button className="!min-w-0 !px-4 !py-1.5 text-xs" onClick={handleInstallClick}>Instalar</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
