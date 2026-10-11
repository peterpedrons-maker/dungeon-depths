// ─── Procedural pixel-art sprites ──────────────────────────────────────────
// Ports the make()/outline() technique from the original dungeon-depths game:
// each sprite is drawn pixel-by-pixel on a tiny offscreen canvas, given a
// dark outline, then cached and blitted scaled up with smoothing off. No
// external image assets — placeholder art for this vertical slice, swapped
// for painted art later only if the core loop proves fun.

import { EnemyKind } from './types';

export interface Sprite {
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
}

const OUTLINE = '#0a0714';
const cache: Record<string, Sprite> = {};

function px(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}

function outline(base: HTMLCanvasElement): HTMLCanvasElement {
  const sil = document.createElement('canvas');
  sil.width = base.width; sil.height = base.height;
  const sg = sil.getContext('2d')!;
  sg.drawImage(base, 0, 0);
  sg.globalCompositeOperation = 'source-in';
  sg.fillStyle = OUTLINE;
  sg.fillRect(0, 0, base.width, base.height);

  const out = document.createElement('canvas');
  out.width = base.width + 2; out.height = base.height + 2;
  const g = out.getContext('2d')!;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    g.drawImage(sil, 1 + dx, 1 + dy);
  }
  g.drawImage(base, 1, 1);
  return out;
}

function make(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): Sprite {
  if (cache[key]) return cache[key];
  const base = document.createElement('canvas');
  base.width = w; base.height = h;
  draw(base.getContext('2d')!);
  const canvas = outline(base);
  cache[key] = { canvas, w: canvas.width, h: canvas.height };
  return cache[key];
}

// Shared palette helper: a `tint` override (hit-flash white) replaces every
// color, otherwise each shape gets a dark base + a lighter top-left highlight
// so flat rectangles read with a bit of volume instead of being pure silhouettes.
export function enemySprite(kind: EnemyKind, flash: number): Sprite {
  const hit = flash > 0;
  const key = `${kind}:${hit ? 'hit' : 'base'}`;
  return make(key, 20, 20, (g) => {
    const w = hit ? '#ffffff' : undefined;
    switch (kind) {
      case 'husk':
        // Hunched corrupted creature: dark moss body, paler hunched back, glowing eyes.
        px(g, 5, 7, 10, 9, w ?? '#3f4a2a');
        px(g, 6, 5, 8, 3, w ?? '#566339');
        px(g, 5, 15, 10, 3, w ?? '#2c3420');
        px(g, 4, 9, 2, 5, w ?? '#2c3420');
        px(g, 14, 9, 2, 5, w ?? '#2c3420');
        px(g, 7, 9, 2, 2, hit ? '#ffffff' : '#9fe85a');
        px(g, 11, 9, 2, 2, hit ? '#ffffff' : '#9fe85a');
        break;
      case 'wisp':
        // Floating spectral orb, lighter crown fading to a trailing wisp tail.
        px(g, 6, 2, 8, 7, w ?? '#b996f5');
        px(g, 5, 9, 10, 5, w ?? '#8a5ac0');
        px(g, 7, 14, 6, 3, w ?? '#5e3a8c');
        px(g, 9, 17, 2, 2, w ?? '#3a2460');
        px(g, 8, 6, 1, 2, hit ? '#ffffff' : '#2a1538');
        px(g, 11, 6, 1, 2, hit ? '#ffffff' : '#2a1538');
        break;
      case 'brute':
        // Bulky armored silhouette, broad shoulders, dim ember eyes.
        px(g, 2, 3, 16, 7, w ?? '#7a2e20');
        px(g, 1, 10, 18, 7, w ?? '#5c2318');
        px(g, 0, 11, 2, 5, w ?? '#431a12');
        px(g, 18, 11, 2, 5, w ?? '#431a12');
        px(g, 3, 1, 5, 3, w ?? '#5c2318');
        px(g, 12, 1, 5, 3, w ?? '#5c2318');
        px(g, 6, 6, 2, 2, hit ? '#ffffff' : '#ffb020');
        px(g, 12, 6, 2, 2, hit ? '#ffffff' : '#ffb020');
        break;
    }
  });
}

export function bossSprite(flash: number): Sprite {
  const hit = flash > 0;
  const key = `boss:${hit ? 'hit' : 'base'}`;
  return make(key, 30, 30, (g) => {
    const w = hit ? '#ffffff' : undefined;
    // Hooded, horned silhouette wrapped in a tattered cloak, two glowing eyes.
    px(g, 5, 6, 20, 12, w ?? '#3a1f4a');
    px(g, 3, 17, 24, 10, w ?? '#2a1538');
    px(g, 1, 19, 3, 7, w ?? '#1c0e28');
    px(g, 26, 19, 3, 7, w ?? '#1c0e28');
    px(g, 7, 1, 4, 6, w ?? '#2a1538');
    px(g, 19, 1, 4, 6, w ?? '#2a1538');
    px(g, 10, 10, 3, 4, hit ? '#ffffff' : '#ffb020');
    px(g, 17, 10, 3, 4, hit ? '#ffffff' : '#ffb020');
    px(g, 11, 16, 8, 2, w ?? '#1c0e28');
  });
}
