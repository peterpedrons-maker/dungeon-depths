import { ReactNode } from 'react';
import moldura from '../assets/moldura.webp';

// Wraps the whole app in the wooden window frame — applied once here instead
// of per-panel, so the frame reads as the edge of the game itself.
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
    </div>
  );
}
