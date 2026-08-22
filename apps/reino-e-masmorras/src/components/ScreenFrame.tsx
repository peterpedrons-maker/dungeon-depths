import { ReactNode } from 'react';
import moldura from '../assets/moldura.webp';
import { InstallPrompt } from './InstallPrompt';

// Wraps the whole app in the wooden window frame — applied once here instead
// of per-panel, so the frame reads as the edge of the game itself. The
// install prompt also lives here (not in App.tsx's per-screen branches) so
// it renders on every screen — loading, login, title, in-game — instead of
// needing to be threaded into each return statement separately.
export function ScreenFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        borderImageSource: `url(${moldura})`,
        borderImageSlice: 96,
        borderImageWidth: 'clamp(8px, 2.2vw, 22px)',
        borderImageRepeat: 'round',
        borderStyle: 'solid',
        borderWidth: 'clamp(8px, 2.2vw, 22px)',
        boxSizing: 'border-box',
      }}
    >
      {children}
      <InstallPrompt />
    </div>
  );
}
