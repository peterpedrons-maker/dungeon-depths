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
// Per-class palettes: head covering + tunic tones so each class reads distinctly.
interface HeroSkin { hat: string; hatL: string; trim: string; body: string; bodyL: string; bodyD: string; }
const HERO_SKINS: Record<string, HeroSkin> = {
  knight: { hat: C.steel, hatL: C.steelL, trim: C.gold,     body: C.blue,     bodyL: C.blueL,   bodyD: C.blueD },
  mage:   { hat: '#7c3aed', hatL: '#a78bfa', trim: '#f0c04a', body: '#c2408a', bodyL: '#e56fae', bodyD: '#8e2563' },
  hunter: { hat: '#2f7d4f', hatL: '#57b877', trim: '#d8b45a', body: '#3f9d5f', bodyL: '#74cf90', bodyD: '#256b3d' },
  necro:  { hat: '#3b3550', hatL: '#5c5478', trim: '#9be86f', body: '#4a4468', bodyL: '#6d648f', bodyD: '#2c2740' },
};

function heroBody(g: CanvasRenderingContext2D, s: HeroSkin) {
  // Head covering (helmet / hood / hat)
  px(g, 4, 0, 6, 1, s.hat);
  px(g, 3, 1, 8, 2, s.hat);
  px(g, 3, 1, 8, 1, s.hatL);
  px(g, 3, 3, 8, 1, s.trim);
  // Face
  px(g, 4, 4, 6, 3, C.skin);
  px(g, 3, 4, 1, 3, s.hat);
  px(g, 10, 4, 1, 3, s.hat);
  px(g, 5, 5, 1, 1, C.hair);
  px(g, 8, 5, 1, 1, C.hair);
  px(g, 4, 6, 6, 1, C.skinD);
  // Torso
  px(g, 4, 7, 6, 5, s.body);
  px(g, 4, 7, 6, 1, s.bodyL);
  px(g, 6, 8, 2, 2, s.trim);
  px(g, 4, 11, 6, 1, s.trim);
}
type ArmMode = 'idle' | 'a' | 'b' | 'attack';
function heroArms(g: CanvasRenderingContext2D, mode: ArmMode, s: HeroSkin) {
  if (mode === 'attack') {
    // hands raised forward, weapon thrust with a cast glow
    px(g, 3, 8, 2, 2, s.bodyD);
    px(g, 9, 8, 2, 2, s.bodyD);
    px(g, 3, 10, 2, 2, C.skin);
    px(g, 9, 10, 2, 2, C.skin);
    px(g, 6, 12, 2, 2, '#ffe9a8');   // spark at hands
    px(g, 6, 12, 2, 1, '#ffffff');
  } else if (mode === 'a') {         // left arm back, right arm forward
    px(g, 2, 8, 2, 4, s.bodyD); px(g, 2, 11, 2, 2, C.skin);
    px(g, 10, 6, 2, 4, s.bodyD); px(g, 10, 9, 2, 2, C.skin);
  } else if (mode === 'b') {         // right arm back, left arm forward
    px(g, 2, 6, 2, 4, s.bodyD); px(g, 2, 9, 2, 2, C.skin);
    px(g, 10, 8, 2, 4, s.bodyD); px(g, 10, 11, 2, 2, C.skin);
  } else {                          // idle
    px(g, 2, 7, 2, 4, s.bodyD);
    px(g, 10, 7, 2, 4, s.bodyD);
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
function heroFrame(cls: string, key: string, legs: 0 | 1 | 2, arms: ArmMode): Sprite {
  const s = HERO_SKINS[cls] ?? HERO_SKINS.knight;
  return make(`hero_${cls}_${key}`, 14, 17, (g) => { heroArms(g, arms, s); heroBody(g, s); heroLegs(g, legs); });
}

export function heroSprites(cls: string) {
  return {
    idle: heroFrame(cls, 'idle', 0, 'idle'),
    walk: [heroFrame(cls, 'a', 1, 'a'), heroFrame(cls, 'i', 0, 'idle'), heroFrame(cls, 'b', 2, 'b'), heroFrame(cls, 'i2', 0, 'idle')],
    attack: heroFrame(cls, 'atk', 0, 'attack'),
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

// ═══ RUNNER (imp) ═══════════════════════════════════════════════════════════
function runnerFrame(key: string, step: 0 | 1): Sprite {
  return make('runner_' + key, 12, 13, (g) => {
    px(g, 2, 0, 2, 2, '#7a2a12'); px(g, 8, 0, 2, 2, '#7a2a12');   // horns
    px(g, 3, 2, 6, 4, '#f0873a');                                  // head
    px(g, 3, 2, 6, 1, '#ff9d52');
    px(g, 4, 3, 1, 1, '#ffec99'); px(g, 7, 3, 1, 1, '#ffec99');    // eyes
    px(g, 3, 6, 6, 3, '#c2410c');                                  // body
    if (step === 0) { px(g, 3, 9, 2, 4, '#7a2a12'); px(g, 7, 9, 2, 3, '#7a2a12'); }
    else { px(g, 3, 9, 2, 3, '#7a2a12'); px(g, 7, 9, 2, 4, '#7a2a12'); }
  });
}
export function runnerFrames(): Sprite[] { return [runnerFrame('a', 0), runnerFrame('b', 1)]; }

// ═══ BRUTE (ogre) ═══════════════════════════════════════════════════════════
function bruteFrame(key: string, step: 0 | 1): Sprite {
  return make('brute_' + key, 20, 18, (g) => {
    px(g, 6, 0, 8, 4, '#7fae52');                                  // head
    px(g, 6, 0, 8, 1, '#9bc96e');
    px(g, 7, 2, 2, 1, '#241a0f'); px(g, 11, 2, 2, 1, '#241a0f');   // eyes
    px(g, 8, 4, 4, 1, '#dfe6cf');                                  // tusks
    px(g, 3, 4, 14, 8, '#6b9245');                                 // torso
    px(g, 3, 4, 14, 1, '#84ad58');
    px(g, 6, 6, 8, 4, '#557636');                                  // belly shade
    px(g, 0, 5, 3, 6, '#6b9245'); px(g, 17, 5, 3, 6, '#6b9245');   // arms
    px(g, 0, 10, 3, 2, '#dfe6cf'); px(g, 17, 10, 3, 2, '#dfe6cf'); // fists
    if (step === 0) { px(g, 5, 12, 5, 6, '#41582a'); px(g, 12, 12, 4, 5, '#41582a'); }
    else { px(g, 5, 12, 4, 5, '#41582a'); px(g, 11, 12, 5, 6, '#41582a'); }
  });
}
export function bruteFrames(): Sprite[] { return [bruteFrame('a', 0), bruteFrame('b', 1)]; }

// ═══ CASTER (dark mage) ═════════════════════════════════════════════════════
function casterFrame(key: string, glow: boolean): Sprite {
  return make('caster_' + key, 14, 16, (g) => {
    px(g, 4, 0, 6, 3, '#4c1d95');                                  // hood
    px(g, 3, 2, 8, 2, '#5b21b6');
    px(g, 5, 3, 4, 2, '#160a2e');                                  // shadow face
    px(g, 5, 4, 1, 1, glow ? '#f0abfc' : '#c084fc');               // eyes
    px(g, 8, 4, 1, 1, glow ? '#f0abfc' : '#c084fc');
    px(g, 3, 5, 8, 8, '#6d28d9');                                  // robe
    px(g, 3, 5, 8, 1, '#8b5cf6');
    px(g, 3, 13, 8, 2, '#4c1d95');
    px(g, 10, 7, 2, 3, '#e9d5ff');                                 // staff hand
    if (glow) { px(g, 10, 4, 2, 2, '#f0abfc'); px(g, 10, 4, 2, 1, '#ffffff'); }
  });
}
export function casterFrames(): Sprite[] { return [casterFrame('a', false), casterFrame('b', true)]; }

// ═══ SPIDER ═════════════════════════════════════════════════════════════════
function spiderFrame(key: string, step: 0 | 1): Sprite {
  return make('spider_' + key, 16, 12, (g) => {
    const y = step === 0 ? 0 : 1;
    px(g, 0, 3 + y, 3, 1, '#4b5563'); px(g, 13, 3 + y, 3, 1, '#4b5563'); // legs
    px(g, 0, 6 - y, 3, 1, '#4b5563'); px(g, 13, 6 - y, 3, 1, '#4b5563');
    px(g, 1, 4, 3, 1, '#374151'); px(g, 12, 4, 3, 1, '#374151');
    px(g, 5, 3, 6, 6, '#374151');                                  // abdomen
    px(g, 5, 3, 6, 1, '#4b5563');
    px(g, 6, 2, 4, 2, '#1f2937');                                  // head
    px(g, 6, 2, 1, 1, '#f87171'); px(g, 9, 2, 1, 1, '#f87171');    // eyes
    px(g, 7, 5, 2, 2, '#111827');
  });
}
export function spiderFrames(): Sprite[] { return [spiderFrame('a', 0), spiderFrame('b', 1)]; }

// ═══ GHOST ══════════════════════════════════════════════════════════════════
function ghostFrame(key: string, step: 0 | 1): Sprite {
  return make('ghost_' + key, 12, 14, (g) => {
    px(g, 3, 0, 6, 2, '#cffafe');
    px(g, 2, 2, 8, 6, '#a5f3fc');
    px(g, 2, 2, 8, 1, '#e0fdff');
    px(g, 4, 3, 1, 2, '#155e75'); px(g, 7, 3, 1, 2, '#155e75');    // eyes
    px(g, 4, 6, 4, 1, '#67e8f9');                                  // mouth
    // wispy tail
    if (step === 0) { px(g, 2, 8, 2, 3, '#a5f3fc'); px(g, 5, 8, 2, 4, '#a5f3fc'); px(g, 8, 8, 2, 3, '#a5f3fc'); }
    else { px(g, 2, 8, 2, 4, '#a5f3fc'); px(g, 5, 8, 2, 3, '#a5f3fc'); px(g, 8, 8, 2, 4, '#a5f3fc'); }
  });
}
export function ghostFrames(): Sprite[] { return [ghostFrame('a', 0), ghostFrame('b', 1)]; }

// ═══ SLASH (crescent) ═══════════════════════════════════════════════════════
function slashFrame(key: string): Sprite {
  return make('slash_' + key, 14, 20, (g) => {
    // a crescent curving along +x, centered vertically
    px(g, 8, 2, 3, 2, '#e8f1ff'); px(g, 10, 4, 2, 3, '#e8f1ff');
    px(g, 11, 6, 2, 4, '#ffffff'); px(g, 11, 10, 2, 4, '#ffffff');
    px(g, 10, 13, 2, 3, '#e8f1ff'); px(g, 8, 16, 3, 2, '#e8f1ff');
    px(g, 9, 8, 2, 4, '#bcd6ff');
  });
}
let SLASH_SPR: Sprite | null = null;
export function slashSprite(): Sprite { return SLASH_SPR ?? (SLASH_SPR = slashFrame('x')); }

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

export function fireballSprite(): Sprite {
  return make('fireball', 10, 10, (g) => {
    px(g, 3, 0, 4, 1, '#ff9d4a');
    px(g, 2, 1, 6, 2, '#ff7a2a');
    px(g, 1, 3, 8, 4, '#ff9d4a');
    px(g, 2, 7, 6, 2, '#ff7a2a');
    px(g, 4, 8, 2, 1, '#c2410c');
    px(g, 3, 3, 4, 3, '#ffe08a');
    px(g, 4, 4, 2, 2, '#ffffff');
  });
}

export function arrowSprite(): Sprite {
  return make('arrow', 12, 5, (g) => {
    px(g, 0, 2, 8, 1, '#8b5a2b');   // shaft
    px(g, 8, 1, 3, 3, '#dfe6ee');   // head
    px(g, 11, 2, 1, 1, '#ffffff');
    px(g, 0, 1, 2, 1, '#e8e4d4');   // fletching
    px(g, 0, 3, 2, 1, '#e8e4d4');
  });
}

export function skullOrbSprite(): Sprite {
  return make('skullorb', 9, 9, (g) => {
    px(g, 2, 0, 5, 1, C.bone);
    px(g, 1, 1, 7, 4, C.bone);
    px(g, 1, 1, 7, 1, '#fbf9ef');
    px(g, 2, 2, 2, 2, '#1a1420');   // eye sockets
    px(g, 5, 2, 2, 2, '#1a1420');
    px(g, 2, 5, 5, 2, C.bone);
    px(g, 3, 6, 1, 1, '#1a1420');
    px(g, 5, 6, 1, 1, '#1a1420');
    px(g, 2, 7, 5, 1, C.boneD);
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
