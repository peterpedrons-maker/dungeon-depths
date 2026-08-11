// ─── Pixel-art sprite system ──────────────────────────────────────────────
// Each sprite is drawn on a tiny canvas at 1 unit = 1 pixel, then given a dark
// outline and cached. At render time we blit it scaled up with smoothing off,
// which yields crisp, cohesive pixel art.

export interface Sprite {
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
}

const OUTLINE = '#140f1c';
const cache: Record<string, Sprite> = {};

function px(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}

// Add a 1px dark outline around the opaque silhouette of `base`.
function outline(base: HTMLCanvasElement): HTMLCanvasElement {
  const w = base.width + 2;
  const h = base.height + 2;

  // Black silhouette of the base
  const sil = document.createElement('canvas');
  sil.width = base.width;
  sil.height = base.height;
  const sg = sil.getContext('2d')!;
  sg.drawImage(base, 0, 0);
  sg.globalCompositeOperation = 'source-in';
  sg.fillStyle = OUTLINE;
  sg.fillRect(0, 0, base.width, base.height);

  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const g = out.getContext('2d')!;
  const offs = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [-1, 1], [1, -1], [-1, -1],
  ];
  for (const [dx, dy] of offs) g.drawImage(sil, 1 + dx, 1 + dy);
  g.drawImage(base, 1, 1);
  return out;
}

function make(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): Sprite {
  if (cache[key]) return cache[key];
  const base = document.createElement('canvas');
  base.width = w;
  base.height = h;
  const g = base.getContext('2d')!;
  draw(g);
  const canvas = outline(base);
  const spr: Sprite = { canvas, w: canvas.width, h: canvas.height };
  cache[key] = spr;
  return spr;
}

// ─── Palette ───────────────────────────────────────────────────────────────
const C = {
  skin: '#e8b17a', skinD: '#c98a55',
  hair: '#5a3a1e',
  steel: '#c9d2dc', steelD: '#8794a3', steelL: '#eef2f6',
  blue: '#3f78c4', blueD: '#2a4f85', blueL: '#7fb0e0',
  gold: '#f0c04a', goldD: '#b07d1c',
  red: '#c23b2e', redD: '#8a271d',
  legs: '#3a3550',
  // slime
  slime: '#5fbf46', slimeL: '#9be86f', slimeD: '#357a26',
  // bat
  bat: '#8a5ad0', batD: '#4e2f86', batL: '#b494e8',
  // skeleton
  bone: '#e8e4d4', boneD: '#a49f8c',
  // gem
  gem: '#38bdf8', gemL: '#bdeaff', gemD: '#1e6ea8',
};

// ═══ HERO (top-down knight, facing down) ════════════════════════════════════
export function heroSprite(): Sprite {
  return make('hero', 14, 16, (g) => {
    // Helmet dome
    px(g, 4, 0, 6, 1, C.steel);
    px(g, 3, 1, 8, 2, C.steel);
    px(g, 3, 1, 8, 1, C.steelL);        // top shine
    px(g, 4, 1, 1, 1, C.steelL);
    // Gold trim
    px(g, 3, 3, 8, 1, C.gold);
    // Face
    px(g, 4, 4, 6, 3, C.skin);
    px(g, 3, 4, 1, 3, C.steel);          // helmet side L
    px(g, 10, 4, 1, 3, C.steel);         // helmet side R
    px(g, 5, 5, 1, 1, C.hair);           // eyes
    px(g, 8, 5, 1, 1, C.hair);
    px(g, 4, 6, 6, 1, C.skinD);          // jaw shade
    // Shoulders / arms
    px(g, 2, 7, 2, 4, C.blueD);
    px(g, 10, 7, 2, 4, C.blueD);
    px(g, 2, 10, 2, 2, C.skin);          // hands
    px(g, 10, 10, 2, 2, C.skin);
    // Torso armor
    px(g, 4, 7, 6, 5, C.blue);
    px(g, 4, 7, 6, 1, C.blueL);          // top shine
    px(g, 6, 8, 2, 2, C.gold);           // chest emblem
    px(g, 4, 11, 6, 1, C.gold);          // belt
    // Legs
    px(g, 4, 12, 2, 3, C.legs);
    px(g, 8, 12, 2, 3, C.legs);
    px(g, 4, 15, 2, 1, C.steelD);        // boots
    px(g, 8, 15, 2, 1, C.steelD);
  });
}

// ═══ SLIME ══════════════════════════════════════════════════════════════════
export function slimeSprite(): Sprite {
  return make('slime', 14, 11, (g) => {
    px(g, 3, 1, 8, 2, C.slime);
    px(g, 2, 3, 10, 3, C.slime);
    px(g, 1, 6, 12, 3, C.slime);
    px(g, 2, 9, 10, 1, C.slimeD);
    // top highlight
    px(g, 3, 1, 5, 1, C.slimeL);
    px(g, 2, 3, 3, 2, C.slimeL);
    // shine dot
    px(g, 4, 2, 2, 2, '#e8ffd8');
    // eyes
    px(g, 5, 5, 1, 2, '#1a1420');
    px(g, 8, 5, 1, 2, '#1a1420');
    // dark underside
    px(g, 1, 8, 12, 1, C.slimeD);
  });
}

// ═══ BAT ══════════════════════════════════════════════════════════════════
export function batSprite(): Sprite {
  return make('bat', 16, 10, (g) => {
    // wings
    px(g, 0, 2, 3, 2, C.bat);
    px(g, 1, 1, 3, 1, C.bat);
    px(g, 2, 4, 4, 2, C.batD);
    px(g, 13, 2, 3, 2, C.bat);
    px(g, 12, 1, 3, 1, C.bat);
    px(g, 10, 4, 4, 2, C.batD);
    px(g, 1, 2, 2, 1, C.batL);
    px(g, 13, 2, 2, 1, C.batL);
    // body
    px(g, 6, 3, 4, 5, C.bat);
    px(g, 6, 3, 4, 1, C.batL);
    px(g, 6, 1, 1, 2, C.batD);           // ears
    px(g, 9, 1, 1, 2, C.batD);
    px(g, 7, 5, 1, 1, '#f05a5a');        // eyes
    px(g, 8, 5, 1, 1, '#f05a5a');
  });
}

// ═══ SKELETON ═══════════════════════════════════════════════════════════════
export function skeletonSprite(): Sprite {
  return make('skeleton', 12, 15, (g) => {
    // skull
    px(g, 3, 0, 6, 5, C.bone);
    px(g, 3, 0, 6, 1, '#fbf9ef');
    px(g, 4, 2, 1, 2, '#1a1420');        // eye sockets
    px(g, 7, 2, 1, 2, '#1a1420');
    px(g, 5, 4, 2, 1, C.boneD);          // teeth line
    // spine + ribs
    px(g, 5, 5, 2, 6, C.bone);
    px(g, 2, 6, 8, 1, C.bone);           // shoulders
    px(g, 3, 8, 6, 1, C.boneD);          // rib
    px(g, 3, 10, 6, 1, C.boneD);         // rib
    // arms
    px(g, 1, 7, 1, 4, C.bone);
    px(g, 10, 7, 1, 4, C.bone);
    // legs
    px(g, 4, 11, 1, 4, C.bone);
    px(g, 7, 11, 1, 4, C.bone);
  });
}

// ═══ XP GEM ═══════════════════════════════════════════════════════════════
export function gemSprite(): Sprite {
  return make('gem', 8, 8, (g) => {
    px(g, 3, 0, 2, 1, C.gemL);
    px(g, 2, 1, 4, 1, C.gem);
    px(g, 1, 2, 6, 3, C.gem);
    px(g, 2, 5, 4, 1, C.gemD);
    px(g, 3, 6, 2, 1, C.gemD);
    px(g, 2, 2, 2, 2, C.gemL);           // facet shine
  });
}

// ═══ PROJECTILE (magic bolt) ════════════════════════════════════════════════
export function boltSprite(): Sprite {
  return make('bolt', 6, 6, (g) => {
    px(g, 2, 0, 2, 6, '#ffe9a8');
    px(g, 0, 2, 6, 2, '#ffe9a8');
    px(g, 2, 2, 2, 2, '#ffffff');
    px(g, 1, 1, 4, 4, '#ffd257');
  });
}
