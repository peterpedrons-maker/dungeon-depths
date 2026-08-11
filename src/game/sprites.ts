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
type ArmMode = 'idle' | 'a' | 'b' | 'attack';
function heroArms(g: CanvasRenderingContext2D, mode: ArmMode) {
  if (mode === 'attack') {
    // hands raised forward, weapon thrust with a cast glow
    px(g, 3, 8, 2, 2, C.blueD);
    px(g, 9, 8, 2, 2, C.blueD);
    px(g, 3, 10, 2, 2, C.skin);
    px(g, 9, 10, 2, 2, C.skin);
    px(g, 6, 12, 2, 2, '#ffe9a8');   // spark at hands
    px(g, 6, 12, 2, 1, '#ffffff');
  } else if (mode === 'a') {         // left arm back, right arm forward
    px(g, 2, 8, 2, 4, C.blueD); px(g, 2, 11, 2, 2, C.skin);
    px(g, 10, 6, 2, 4, C.blueD); px(g, 10, 9, 2, 2, C.skin);
  } else if (mode === 'b') {         // right arm back, left arm forward
    px(g, 2, 6, 2, 4, C.blueD); px(g, 2, 9, 2, 2, C.skin);
    px(g, 10, 8, 2, 4, C.blueD); px(g, 10, 11, 2, 2, C.skin);
  } else {                          // idle
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
function heroFrameFront(key: string, legs: 0 | 1 | 2, arms: ArmMode): Sprite {
  return make('heroF_' + key, 14, 17, (g) => { heroArms(g, arms); heroBody(g); heroLegs(g, legs); });
}

// Back view (walking away / up): back of the helmet, hair at the nape, red cloak.
function heroBackBody(g: CanvasRenderingContext2D) {
  px(g, 4, 0, 6, 1, C.steel); px(g, 3, 1, 8, 2, C.steel); px(g, 3, 1, 8, 1, C.steelL); px(g, 3, 3, 8, 1, C.gold);
  px(g, 4, 4, 6, 3, C.steel);
  px(g, 5, 6, 4, 1, C.hair);
  px(g, 4, 7, 6, 5, C.red);
  px(g, 4, 7, 6, 1, '#d0655a');
  px(g, 6, 7, 1, 4, '#a3312a');
  px(g, 4, 7, 1, 5, C.blueD); px(g, 9, 7, 1, 5, C.blueD);
  px(g, 4, 11, 6, 1, C.gold);
}
function heroFrameBack(key: string, legs: 0 | 1 | 2, arms: ArmMode): Sprite {
  return make('heroB_' + key, 14, 17, (g) => { heroArms(g, arms); heroBackBody(g); heroLegs(g, legs); });
}

// Side view (profile, facing right; flipped for left).
function heroSideBody(g: CanvasRenderingContext2D) {
  px(g, 3, 0, 5, 1, C.steel); px(g, 2, 1, 6, 2, C.steel); px(g, 2, 1, 6, 1, C.steelL); px(g, 3, 3, 5, 1, C.gold);
  px(g, 4, 4, 4, 3, C.skin);
  px(g, 3, 4, 1, 3, C.steel);      // back of helmet
  px(g, 8, 5, 1, 1, C.skinD);      // nose
  px(g, 5, 5, 1, 1, C.hair);       // eye
  px(g, 4, 6, 4, 1, C.skinD);
  px(g, 3, 7, 5, 5, C.blue); px(g, 3, 7, 5, 1, C.blueL); px(g, 3, 11, 5, 1, C.gold);
  px(g, 3, 8, 1, 3, C.blueD);      // far arm
  px(g, 7, 8, 2, 3, C.blueD); px(g, 8, 10, 2, 2, C.skin);  // forward arm + hand
  px(g, 10, 10, 4, 1, C.steel); px(g, 10, 9, 1, 3, C.gold); // sword
  px(g, 14, 10, 1, 1, '#7dd3fc');
}
function heroSideLegs(g: CanvasRenderingContext2D, mode: 0 | 1 | 2) {
  if (mode === 0) { px(g, 3, 12, 2, 3, C.legs); px(g, 6, 12, 2, 3, C.legs); px(g, 3, 15, 2, 1, C.steelD); px(g, 6, 15, 2, 1, C.steelD); }
  else if (mode === 1) { px(g, 2, 12, 2, 3, C.legs); px(g, 6, 13, 2, 2, C.legsD); px(g, 2, 15, 3, 1, C.steelD); }
  else { px(g, 3, 13, 2, 2, C.legsD); px(g, 7, 12, 2, 3, C.legs); px(g, 7, 15, 3, 1, C.steelD); }
}
function heroFrameSide(key: string, legs: 0 | 1 | 2): Sprite {
  return make('heroS_' + key, 16, 17, (g) => { heroSideBody(g); heroSideLegs(g, legs); });
}

export function heroSprites() {
  return {
    down: {
      idle: heroFrameFront('idle', 0, 'idle'),
      walk: [heroFrameFront('a', 1, 'a'), heroFrameFront('i', 0, 'idle'), heroFrameFront('b', 2, 'b'), heroFrameFront('i2', 0, 'idle')],
      attack: heroFrameFront('atk', 0, 'attack'),
    },
    up: {
      idle: heroFrameBack('idle', 0, 'idle'),
      walk: [heroFrameBack('a', 1, 'a'), heroFrameBack('i', 0, 'idle'), heroFrameBack('b', 2, 'b'), heroFrameBack('i2', 0, 'idle')],
      attack: heroFrameBack('idle', 0, 'idle'),
    },
    side: {
      idle: heroFrameSide('idle', 0),
      walk: [heroFrameSide('a', 1), heroFrameSide('i', 0), heroFrameSide('b', 2), heroFrameSide('i2', 0)],
      attack: heroFrameSide('idle', 0),
    },
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

// ═══ BOSS (big horned brute) ══════════════════════════════════════════════════
export function bossSprite(): Sprite {
  const body = '#8a2f46', bodyD = '#5a1e2e', bodyL = '#b3455f';
  return make('boss', 24, 22, (g) => {
    // horns
    px(g, 3, 0, 3, 2, C.bone); px(g, 4, 2, 2, 2, C.bone);
    px(g, 18, 0, 3, 2, C.bone); px(g, 18, 2, 2, 2, C.bone);
    // head
    px(g, 7, 2, 10, 6, body);
    px(g, 7, 2, 10, 1, bodyL);
    px(g, 9, 4, 2, 2, '#ffd257'); px(g, 13, 4, 2, 2, '#ffd257');   // glowing eyes
    px(g, 9, 4, 1, 1, '#ffffff'); px(g, 13, 4, 1, 1, '#ffffff');
    px(g, 9, 7, 6, 1, '#2a0f14');                                   // mouth
    // torso
    px(g, 3, 8, 18, 8, body);
    px(g, 3, 8, 18, 1, bodyL);
    px(g, 6, 10, 12, 4, bodyD);
    px(g, 10, 9, 4, 2, '#c94a66');                                  // chest crest
    // arms + claws
    px(g, 0, 9, 3, 5, body); px(g, 21, 9, 3, 5, body);
    px(g, 0, 13, 3, 2, C.bone); px(g, 21, 13, 3, 2, C.bone);
    // legs
    px(g, 6, 16, 4, 5, bodyD); px(g, 14, 16, 4, 5, bodyD);
    px(g, 6, 21, 4, 1, '#2a0f14'); px(g, 14, 21, 4, 1, '#2a0f14');
  });
}
