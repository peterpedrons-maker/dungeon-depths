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

export function enemySprite(kind: EnemyKind, flash: number): Sprite {
  const hit = flash > 0;
  const key = `${kind}:${hit ? 'hit' : 'base'}`;
  return make(key, 16, 16, (g) => {
    const tint = hit ? '#ffffff' : undefined;
    switch (kind) {
      case 'husk':
        px(g, 4, 3, 8, 6, tint ?? '#6a7a4a');
        px(g, 5, 9, 6, 5, tint ?? '#566339');
        px(g, 6, 5, 2, 2, '#1a1410');
        px(g, 9, 5, 2, 2, '#1a1410');
        break;
      case 'wisp':
        px(g, 5, 2, 6, 6, tint ?? '#a87cf0');
        px(g, 4, 8, 8, 6, tint ?? '#8a5ac0');
        px(g, 6, 5, 1, 1, '#1a1410');
        px(g, 9, 5, 1, 1, '#1a1410');
        break;
      case 'brute':
        px(g, 2, 2, 12, 8, tint ?? '#9a3a2a');
        px(g, 1, 10, 14, 5, tint ?? '#7a2e20');
        px(g, 5, 5, 2, 2, '#1a1410');
        px(g, 9, 5, 2, 2, '#1a1410');
        break;
    }
  });
}

export function bossSprite(flash: number): Sprite {
  const hit = flash > 0;
  const key = `boss:${hit ? 'hit' : 'base'}`;
  return make(key, 24, 24, (g) => {
    const tint = hit ? '#ffffff' : undefined;
    px(g, 4, 2, 16, 10, tint ?? '#3a1f4a');
    px(g, 2, 12, 20, 9, tint ?? '#2a1538');
    px(g, 6, 0, 4, 3, tint ?? '#2a1538');
    px(g, 14, 0, 4, 3, tint ?? '#2a1538');
    px(g, 8, 6, 2, 3, '#ffb020');
    px(g, 14, 6, 2, 3, '#ffb020');
  });
}
