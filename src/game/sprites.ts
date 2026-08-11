// ─── Pixel-art sprite system with animation frames ────────────────────────
// Sprites are drawn at 1 unit = 1 pixel on a tiny canvas, given a dark
// outline, cached, then blitted scaled up with smoothing off.

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

let _sid = 0;
function make(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): Sprite {
  if (cache[key]) return cache[key];
  const base = document.createElement('canvas');
  base.width = w; base.height = h;
  draw(base.getContext('2d')!);
  const canvas = outline(base);
  (canvas as any)._id = ++_sid;
  cache[key] = { canvas, w: canvas.width, h: canvas.height };
  return cache[key];
}

const C = {
  skin: '#e8b17a', skinD: '#c98a55',
  hair: '#5a3a1e',
  steel: '#c9d2dc', steelD: '#8794a3', steelL: '#eef2f6',
  blue: '#3f78c4', blueD: '#2a4f85', blueL: '#7fb0e0',
  gold: '#f0c04a', goldD: '#b07d1c',
  legs: '#3a3550', legsD: '#2a2740',
  slime: '#5fbf46', slimeL: '#9be86f', slimeD: '#357a26',
  bat: '#8a5ad0', batD: '#4e2f86', batL: '#b494e8',
  bone: '#e8e4d4', boneD: '#a49f8c',
  gem: '#38bdf8', gemL: '#bdeaff', gemD: '#1e6ea8',
};

// ═══ HERO ════════════════════════════════════════════════════════════════════
function heroBody(g: CanvasRenderingContext2D) {
  // Helmet
  px(g, 4, 0, 6, 1, C.steel);
  px(g, 3, 1, 8, 2, C.steel);
  px(g, 3, 1, 8, 1, C.steelL);
  px(g, 3, 3, 8, 1, C.gold);
  // Face
  px(g, 4, 4, 6, 3, C.skin);
  px(g, 3, 4, 1, 3, C.steel);
  px(g, 10, 4, 1, 3, C.steel);
  px(g, 5, 5, 1, 1, C.hair);
  px(g, 8, 5, 1, 1, C.hair);
  px(g, 4, 6, 6, 1, C.skinD);
  // Torso
  px(g, 4, 7, 6, 5, C.blue);
  px(g, 4, 7, 6, 1, C.blueL);
  px(g, 6, 8, 2, 2, C.gold);
  px(g, 4, 11, 6, 1, C.gold);
}
function heroArms(g: CanvasRenderingContext2D, attack: boolean) {
  if (attack) {
    // hands raised forward, weapon thrust with a cast glow
    px(g, 3, 8, 2, 2, C.blueD);
    px(g, 9, 8, 2, 2, C.blueD);
    px(g, 3, 10, 2, 2, C.skin);
    px(g, 9, 10, 2, 2, C.skin);
    px(g, 6, 12, 2, 2, '#ffe9a8');   // spark at hands
    px(g, 6, 12, 2, 1, '#ffffff');
  } else {
    px(g, 2, 7, 2, 4, C.blueD);
    px(g, 10, 7, 2, 4, C.blueD);
    px(g, 2, 10, 2, 2, C.skin);
    px(g, 10, 10, 2, 2, C.skin);
  }
}
function heroLegs(g: CanvasRenderingContext2D, mode: 0 | 1 | 2) {
  if (mode === 0) { // idle
    px(g, 4, 12, 2, 3, C.legs); px(g, 8, 12, 2, 3, C.legs);
    px(g, 4, 15, 2, 1, C.steelD); px(g, 8, 15, 2, 1, C.steelD);
  } else if (mode === 1) { // left forward
    px(g, 4, 12, 2, 4, C.legs); px(g, 8, 13, 2, 2, C.legsD);
    px(g, 4, 16, 2, 1, C.steelD); px(g, 8, 15, 2, 1, C.steelD);
  } else { // right forward
    px(g, 4, 13, 2, 2, C.legsD); px(g, 8, 12, 2, 4, C.legs);
    px(g, 4, 15, 2, 1, C.steelD); px(g, 8, 16, 2, 1, C.steelD);
  }
}
function heroFrame(key: string, legs: 0 | 1 | 2, attack: boolean): Sprite {
  return make('hero_' + key, 14, 17, (g) => {
    heroArms(g, attack);
    heroBody(g);
    heroLegs(g, legs);
  });
}
export function heroSprites() {
  return {
    idle: heroFrame('idle', 0, false),
    walk: [heroFrame('w1', 1, false), heroFrame('w2', 2, false)],
    attack: heroFrame('atk', 0, true),
  };
}

// ═══ SLIME (hop) ══════════════════════════════════════════════════════════════
function slimeFrame(key: string, squish: boolean): Sprite {
  return make('slime_' + key, 14, 12, (g) => {
    if (squish) {
      px(g, 1, 5, 12, 2, C.slime);
      px(g, 0, 7, 14, 3, C.slime);
      px(g, 1, 10, 12, 1, C.slimeD);
      px(g, 1, 5, 6, 1, C.slimeL);
      px(g, 3, 6, 2, 2, '#e8ffd8');
      px(g, 5, 7, 1, 2, '#1a1420');
      px(g, 8, 7, 1, 2, '#1a1420');
    } else {
      px(g, 3, 1, 8, 2, C.slime);
      px(g, 2, 3, 10, 3, C.slime);
      px(g, 1, 6, 12, 3, C.slime);
      px(g, 2, 9, 10, 1, C.slimeD);
      px(g, 3, 1, 5, 1, C.slimeL);
      px(g, 2, 3, 3, 2, C.slimeL);
      px(g, 4, 2, 2, 2, '#e8ffd8');
      px(g, 5, 5, 1, 2, '#1a1420');
      px(g, 8, 5, 1, 2, '#1a1420');
    }
  });
}
export function slimeFrames(): Sprite[] {
  return [slimeFrame('a', false), slimeFrame('b', true)];
}

// ═══ BAT (flap) ══════════════════════════════════════════════════════════════
function batFrame(key: string, up: boolean): Sprite {
  return make('bat_' + key, 16, 11, (g) => {
    const wy = up ? 0 : 4;
    // wings
    px(g, 0, 2 + wy, 3, 2, C.bat);
    px(g, 1, 1 + wy, 3, 1, C.bat);
    px(g, 2, 4 + wy, 4, 2, C.batD);
    px(g, 13, 2 + wy, 3, 2, C.bat);
    px(g, 12, 1 + wy, 3, 1, C.bat);
    px(g, 10, 4 + wy, 4, 2, C.batD);
    px(g, 1, 2 + wy, 2, 1, C.batL);
    px(g, 13, 2 + wy, 2, 1, C.batL);
    // body
    px(g, 6, 3, 4, 5, C.bat);
    px(g, 6, 3, 4, 1, C.batL);
    px(g, 6, 1, 1, 2, C.batD);
    px(g, 9, 1, 1, 2, C.batD);
    px(g, 7, 5, 1, 1, '#f05a5a');
    px(g, 8, 5, 1, 1, '#f05a5a');
  });
}
export function batFrames(): Sprite[] {
  return [batFrame('up', true), batFrame('down', false)];
}

// ═══ SKELETON (walk) ══════════════════════════════════════════════════════════
function skeletonFrame(key: string, step: 0 | 1): Sprite {
  return make('skel_' + key, 12, 15, (g) => {
    // skull
    px(g, 3, 0, 6, 5, C.bone);
    px(g, 3, 0, 6, 1, '#fbf9ef');
    px(g, 4, 2, 1, 2, '#1a1420');
    px(g, 7, 2, 1, 2, '#1a1420');
    px(g, 5, 4, 2, 1, C.boneD);
    // spine + shoulders + ribs
    px(g, 5, 5, 2, 6, C.bone);
    px(g, 2, 6, 8, 1, C.bone);
    px(g, 3, 8, 6, 1, C.boneD);
    px(g, 3, 10, 6, 1, C.boneD);
    // arms swing with step
    if (step === 0) {
      px(g, 1, 6, 1, 4, C.bone);
      px(g, 10, 7, 1, 4, C.bone);
    } else {
      px(g, 1, 7, 1, 4, C.bone);
      px(g, 10, 6, 1, 4, C.bone);
    }
    // legs alternate
    if (step === 0) {
      px(g, 4, 11, 1, 4, C.bone);
      px(g, 7, 11, 1, 3, C.bone);
    } else {
      px(g, 4, 11, 1, 3, C.bone);
      px(g, 7, 11, 1, 4, C.bone);
    }
  });
}
export function skeletonFrames(): Sprite[] {
  return [skeletonFrame('a', 0), skeletonFrame('b', 1)];
}

// ═══ GEM / BOLT ══════════════════════════════════════════════════════════════
export function gemSprite(): Sprite {
  return make('gem', 8, 8, (g) => {
    px(g, 3, 0, 2, 1, C.gemL);
    px(g, 2, 1, 4, 1, C.gem);
    px(g, 1, 2, 6, 3, C.gem);
    px(g, 2, 5, 4, 1, C.gemD);
    px(g, 3, 6, 2, 1, C.gemD);
    px(g, 2, 2, 2, 2, C.gemL);
  });
}
export function boltSprite(): Sprite {
  return make('bolt', 6, 6, (g) => {
    px(g, 2, 0, 2, 6, '#ffe9a8');
    px(g, 0, 2, 6, 2, '#ffe9a8');
    px(g, 2, 2, 2, 2, '#ffffff');
    px(g, 1, 1, 4, 4, '#ffd257');
  });
}
