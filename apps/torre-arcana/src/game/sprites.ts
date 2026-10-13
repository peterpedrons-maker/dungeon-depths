// ─── Sprites — real vector art (game-icons.net, CC BY 3.0), not procedural
// shapes ───────────────────────────────────────────────────────────────────
// Each enemy kind is a licensed silhouette icon (see icons.ts), recolored
// per kind and given a dark outline the same way the original dungeon-depths
// game outlines its pixel sprites — sample the shape's alpha, stamp a dark
// copy behind it in 8 directions, then draw the colored shape on top. That
// outline() trick works on any rasterized shape, not just hand-drawn pixel
// art, so it applies just as well to a rendered SVG. Builds happen once,
// asynchronously, right when the module loads; until a given variant is
// ready, enemySprite()/bossSprite() return a blank placeholder instead of
// throwing, which only ever shows for a frame or two on the very first spawn.

import { EnemyKind } from './types';
import { ICON_BODY, ICON_VIEWBOX } from './icons';

export interface Sprite {
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
}

const OUTLINE = '#0a0714';
const SIZE = 64; // base raster size each icon is built at, before per-frame scaling
const cache: Record<string, Sprite> = {};
const blank: Sprite = { canvas: document.createElement('canvas'), w: 1, h: 1 };

function outline(base: HTMLCanvasElement): HTMLCanvasElement {
  const sil = document.createElement('canvas');
  sil.width = base.width; sil.height = base.height;
  const sg = sil.getContext('2d')!;
  sg.drawImage(base, 0, 0);
  sg.globalCompositeOperation = 'source-in';
  sg.fillStyle = OUTLINE;
  sg.fillRect(0, 0, base.width, base.height);

  const out = document.createElement('canvas');
  out.width = base.width + 4; out.height = base.height + 4;
  const g = out.getContext('2d')!;
  for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2], [2, 2], [-2, 2], [2, -2], [-2, -2]]) {
    g.drawImage(sil, 2 + dx, 2 + dy);
  }
  g.drawImage(base, 2, 2);
  return out;
}

function loadIcon(iconKey: string, fillColor: string): Promise<HTMLImageElement> {
  const body = ICON_BODY[iconKey];
  // The path data uses fill="currentColor" (standard Iconify convention), so
  // the color has to be set via the CSS `color` property, not an SVG `fill`
  // attribute (which a literal "currentColor" value on the path ignores).
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ICON_VIEWBOX}" style="color:${fillColor}">${body}</svg>`;
  const blob = new Blob([markup], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

async function build(key: string, iconKey: string, fillColor: string): Promise<void> {
  const img = await loadIcon(iconKey, fillColor);
  const base = document.createElement('canvas');
  base.width = SIZE; base.height = SIZE;
  const g = base.getContext('2d')!;
  g.drawImage(img, 2, 2, SIZE - 4, SIZE - 4); // small margin so the outline stamp has room
  const canvas = outline(base);
  cache[key] = { canvas, w: canvas.width, h: canvas.height };
}

const ENEMY_ICON: Record<EnemyKind, { icon: string; color: string }> = {
  husk: { icon: 'zombie', color: '#6a8a4a' },
  wisp: { icon: 'ghost', color: '#a87cf0' },
  brute: { icon: 'ogre', color: '#c0432a' },
};
const BOSS_COLOR = '#c99a3a';
const HIT_COLOR = '#ffffff';

// Kick off every variant once, in the background, as soon as this module
// loads — well before the first enemy can spawn.
void (async () => {
  for (const kind of Object.keys(ENEMY_ICON) as EnemyKind[]) {
    const { icon, color } = ENEMY_ICON[kind];
    await build(`${kind}:base`, icon, color);
    await build(`${kind}:hit`, icon, HIT_COLOR);
  }
  await build('boss:base', 'skull', BOSS_COLOR);
  await build('boss:hit', 'skull', HIT_COLOR);
})();

export function enemySprite(kind: EnemyKind, flash: number): Sprite {
  return cache[`${kind}:${flash > 0 ? 'hit' : 'base'}`] ?? blank;
}

export function bossSprite(flash: number): Sprite {
  return cache[`boss:${flash > 0 ? 'hit' : 'base'}`] ?? blank;
}
