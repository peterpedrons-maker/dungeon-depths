// ─── Pixel-art sprite system ────────────────────────────────────────────────
// Same technique as the sibling game (apps/dungeon-depths): tiny canvases
// drawn pixel-by-pixel with px(), given an automatic 1px dark outline, then
// cached and blitted scaled up with smoothing off. No external art assets.
import { ClassId, EnemyShape } from '../types/game';

export interface Sprite {
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
}

const OUTLINE = '#140f08';
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
  skin: '#e8b17a', skinD: '#c98a55', hair: '#2a1c12',
  steel: '#c9d2dc', steelL: '#eef2f6', steelD: '#8794a3',
  gold: '#e8c04a', goldL: '#fff6c8',
  brown: '#8a6030', brownD: '#5a3f1e', brownL: '#b0824a',
  legs: '#3a3550', legsD: '#241f36',
  white: '#f0ece0',
};

// ═══ HERO ════════════════════════════════════════════════════════════════════
interface HeroPalette { hood: string; hoodL: string; trim: string; body: string; bodyL: string; bodyD: string; }
const HERO_PALETTES: Record<ClassId, HeroPalette> = {
  guerreiro: { hood: C.steel,   hoodL: C.steelL,  trim: '#a5432f', body: '#8794a3', bodyL: '#c9d2dc', bodyD: '#5f6b78' },
  mago:      { hood: '#2f5a8a', hoodL: '#4a7ab0', trim: C.gold,    body: '#3a6da0', bodyL: '#5f8fc0', bodyD: '#234868' },
  assassino: { hood: '#2a2a26', hoodL: '#42423c', trim: '#4a5a48', body: '#33332e', bodyL: '#4a4a42', bodyD: '#1e1e1a' },
};

type Pose = 'idle' | 'attack';
const HW = 18, HH = 24; // hero canvas size

function heroBody(g: CanvasRenderingContext2D, pal: HeroPalette): void {
  // cape — peeks out behind the shoulders and trails past the boots
  px(g, 3, 10, 1, 8, pal.bodyD);
  px(g, 14, 10, 1, 8, pal.bodyD);
  px(g, 7, 21, 4, 2, pal.bodyD);

  // head covering
  px(g, 6, 0, 6, 1, pal.hood);
  px(g, 5, 1, 8, 2, pal.hood);
  px(g, 5, 1, 8, 1, pal.hoodL);
  px(g, 12, 1, 1, 2, pal.hoodL);
  px(g, 5, 3, 8, 1, pal.trim);
  // face
  px(g, 6, 4, 6, 4, C.skin);
  px(g, 5, 4, 1, 4, pal.hood);
  px(g, 12, 4, 1, 4, pal.hood);
  px(g, 7, 5, 1, 1, C.hair);
  px(g, 10, 5, 1, 1, C.hair);
  px(g, 6, 7, 6, 1, C.skinD);
  // torso
  px(g, 5, 8, 8, 7, pal.body);
  px(g, 5, 8, 8, 1, pal.bodyL);
  px(g, 11, 9, 1, 5, pal.bodyL);
  px(g, 7, 10, 4, 2, pal.trim);
  px(g, 5, 13, 8, 1, pal.trim);
  // arms
  px(g, 3, 9, 2, 6, pal.bodyD);
  px(g, 13, 9, 2, 6, pal.bodyD);
  px(g, 3, 13, 2, 2, C.skin);
  px(g, 13, 13, 2, 2, C.skin);
  // legs
  px(g, 6, 15, 3, 6, C.legs);
  px(g, 9, 15, 3, 6, C.legsD);
  px(g, 6, 20, 1, 1, C.steelL);
  px(g, 9, 20, 1, 1, C.steelL);
  px(g, 6, 21, 3, 1, C.steelD);
  px(g, 9, 21, 3, 1, C.steelD);
}

function heroWeapon(g: CanvasRenderingContext2D, classId: ClassId, pose: Pose): void {
  if (classId === 'guerreiro') {
    // shield on the left arm (both poses)
    px(g, 1, 10, 3, 7, C.brown);
    px(g, 1, 10, 3, 1, C.steelD);
    px(g, 1, 16, 3, 1, C.steelD);
    px(g, 2, 11, 1, 5, C.brownL);
    if (pose === 'idle') {
      px(g, 15, 19, 1, 3, C.gold);
      px(g, 15, 9, 2, 10, C.steelL);
      px(g, 16, 9, 1, 10, C.steelD);
    } else {
      px(g, 15, 1, 2, 10, C.steelL);
      px(g, 16, 1, 1, 10, C.steelD);
      px(g, 14, 10, 2, 2, C.gold);
      px(g, 17, 0, 1, 1, '#ffffff');
    }
  } else if (classId === 'mago') {
    px(g, 15, 3, 2, 19, C.brown);
    px(g, 15, 3, 1, 19, C.brownL);
    if (pose === 'idle') {
      px(g, 14, 0, 4, 4, '#40e0d0');
      px(g, 15, 1, 2, 2, '#bdf5ef');
    } else {
      px(g, 13, 0, 6, 4, '#9df5ec');
      px(g, 14, 1, 4, 2, '#ffffff');
    }
  } else {
    // assassino: twin daggers, dark leather-wrapped hilts
    px(g, 2, 15, 1, 4, '#9098a0');
    px(g, 2, 19, 1, 1, C.brownD);
    if (pose === 'idle') {
      px(g, 15, 15, 1, 4, '#9098a0');
      px(g, 15, 19, 1, 1, C.brownD);
    } else {
      px(g, 15, 3, 2, 10, '#c4ccd4');
      px(g, 14, 12, 2, 1, C.brownD);
      px(g, 17, 2, 1, 1, '#ffffff');
    }
  }
}

function heroFrame(classId: ClassId, pose: Pose): Sprite {
  const pal = HERO_PALETTES[classId];
  return make(`hero_${classId}_${pose}`, HW, HH, (g) => {
    heroBody(g, pal);
    heroWeapon(g, classId, pose);
  });
}

export function heroSprites(classId: ClassId): { idle: Sprite; attack: Sprite } {
  return { idle: heroFrame(classId, 'idle'), attack: heroFrame(classId, 'attack') };
}

// ═══ ENEMIES ═════════════════════════════════════════════════════════════════
function goblinSprite(): Sprite {
  return make('goblin', 16, 18, (g) => {
    const green = '#5a8a3c', greenL = '#7ab85c', greenD = '#3a5c26', leather = '#5a4020', leatherL = '#7a5a30';
    px(g, 3, 0, 2, 1, green);
    px(g, 10, 0, 2, 1, green);
    px(g, 3, 1, 10, 5, green);
    px(g, 3, 1, 10, 1, greenL);
    px(g, 5, 3, 1, 1, '#ff5050'); px(g, 10, 3, 1, 1, '#ff9d9d');
    px(g, 10, 4, 1, 1, '#ff5050');
    px(g, 5, 6, 6, 1, greenD);
    px(g, 3, 7, 10, 6, leather);
    px(g, 3, 7, 10, 1, leatherL);
    px(g, 6, 9, 3, 2, C.brownD);
    px(g, 2, 8, 1, 5, green); px(g, 13, 8, 1, 5, green);
    px(g, 4, 13, 3, 5, greenD); px(g, 9, 13, 3, 5, greenD);
    px(g, 4, 17, 3, 1, C.legsD); px(g, 9, 17, 3, 1, C.legsD);
  });
}

function wolfSprite(): Sprite {
  return make('wolf', 20, 14, (g) => {
    const grey = '#6b6b78', greyL = '#8a8a98', greyD = '#45454f';
    px(g, 0, 6, 3, 2, greyD);
    px(g, 2, 5, 14, 6, grey);
    px(g, 2, 5, 14, 1, greyL);
    px(g, 3, 10, 1, 1, greyL); px(g, 7, 10, 1, 1, greyL); px(g, 11, 10, 1, 1, greyL);
    px(g, 14, 1, 6, 6, grey);
    px(g, 19, 3, 1, 2, greyD);
    px(g, 15, 3, 1, 1, '#ffe070');
    px(g, 14, 0, 1, 1, greyD); px(g, 16, 0, 1, 1, greyD);
    px(g, 3, 11, 2, 3, greyD); px(g, 7, 11, 2, 3, greyD); px(g, 11, 11, 2, 3, greyD); px(g, 14, 11, 2, 3, greyD);
  });
}

function skeletonSprite(): Sprite {
  return make('skeleton', 14, 20, (g) => {
    const bone = '#d8d2b8', boneL = '#f0ecd8', boneD = '#a49f88', dark = '#1a1420';
    px(g, 4, 0, 6, 6, bone);
    px(g, 4, 0, 6, 1, boneL);
    px(g, 5, 2, 1, 2, dark); px(g, 8, 2, 1, 2, dark);
    px(g, 6, 5, 2, 1, boneD);
    px(g, 6, 6, 2, 8, bone);
    px(g, 3, 7, 8, 1, bone);
    px(g, 4, 9, 6, 1, boneD);
    px(g, 4, 11, 6, 1, boneD);
    px(g, 1, 7, 1, 6, bone); px(g, 12, 7, 1, 6, bone);
    px(g, 1, 7, 1, 1, boneL); px(g, 12, 7, 1, 1, boneL);
    px(g, 4, 14, 1, 6, bone); px(g, 9, 14, 1, 6, bone);
    px(g, 4, 14, 1, 1, boneL); px(g, 9, 14, 1, 1, boneL);
  });
}

function orcSprite(): Sprite {
  return make('orc', 20, 20, (g) => {
    const green = '#4f7a3a', greenL = '#6fa050', greenD = '#345128', dark2 = '#1c1c22', tusk = '#eee6cc';
    px(g, 7, 0, 6, 5, green);
    px(g, 7, 0, 6, 1, greenL);
    px(g, 8, 2, 1, 1, '#1a1420'); px(g, 11, 2, 1, 1, '#1a1420');
    px(g, 8, 3, 1, 1, tusk); px(g, 11, 3, 1, 1, tusk);
    px(g, 12, 1, 3, 1, greenD);
    px(g, 3, 5, 14, 9, greenD);
    px(g, 3, 5, 14, 1, green);
    px(g, 6, 8, 8, 1, greenL);
    px(g, 0, 6, 3, 7, greenD); px(g, 17, 6, 3, 7, greenD);
    px(g, 0, 11, 3, 2, tusk); px(g, 17, 11, 3, 2, tusk);
    px(g, 5, 14, 4, 6, dark2); px(g, 11, 14, 4, 6, dark2);
  });
}

function trollSprite(): Sprite {
  return make('troll', 24, 24, (g) => {
    const brown = '#7a5230', brownL = '#9a6f45', brownD = '#4f3420', dark2 = '#241a12';
    px(g, 8, 0, 8, 6, brown);
    px(g, 8, 0, 8, 1, brownL);
    px(g, 9, 2, 1, 1, '#1a1420'); px(g, 14, 2, 1, 1, '#1a1420');
    px(g, 9, 4, 5, 1, brownD);
    px(g, 3, 6, 18, 11, brownD);
    px(g, 3, 6, 18, 1, brown);
    px(g, 8, 9, 8, 1, brownL);
    px(g, 0, 7, 4, 9, brownD); px(g, 20, 7, 4, 9, brownD);
    px(g, 0, 14, 4, 2, brownL);
    px(g, 20, 14, 4, 2, brownL);
    px(g, 6, 17, 5, 7, dark2); px(g, 13, 17, 5, 7, dark2);
  });
}

function dragonSprite(): Sprite {
  return make('dragon', 27, 20, (g) => {
    const red = '#a5271f', redL = '#c8433a', redD = '#6e1a15', wing = '#3a1a2a', wingL = '#4f2436', dark2 = '#1c1214';
    px(g, 2, 0, 10, 7, wing);
    px(g, 3, 1, 1, 5, wingL); px(g, 6, 1, 1, 5, wingL); px(g, 9, 1, 1, 5, wingL);
    px(g, 4, 7, 16, 9, red);
    px(g, 4, 7, 16, 1, redL);
    px(g, 8, 11, 8, 1, redD);
    px(g, 18, 5, 7, 4, red);
    px(g, 24, 6, 2, 2, redD);
    px(g, 19, 6, 1, 1, '#f0c840');
    px(g, 0, 11, 4, 4, redD);
    px(g, 6, 16, 3, 4, dark2); px(g, 15, 16, 3, 4, dark2);
  });
}

function horrorSprite(): Sprite {
  return make('horror', 20, 20, (g) => {
    const purple = '#3a2a52', purpleL = '#5a4278', purpleD = '#241a38';
    for (const [dx, dy] of [[0, 3], [16, 3], [0, 14], [16, 14]]) {
      px(g, dx, dy, 3, 3, purple);
      px(g, dx + 1, dy + 1, 1, 1, purpleD);
    }
    px(g, 4, 4, 12, 12, purple);
    px(g, 4, 4, 12, 1, purpleL);
    px(g, 6, 13, 8, 2, purpleD);
    px(g, 7, 8, 2, 2, '#ff5050'); px(g, 11, 8, 2, 2, '#ff5050');
    px(g, 7, 8, 1, 1, '#ffb0b0'); px(g, 11, 8, 1, 1, '#ffb0b0');
  });
}

const ENEMY_SPRITES: Record<EnemyShape, () => Sprite> = {
  goblin: goblinSprite, wolf: wolfSprite, skeleton: skeletonSprite,
  orc: orcSprite, troll: trollSprite, dragon: dragonSprite, horror: horrorSprite,
};

export function enemySprite(shape: EnemyShape): Sprite {
  return ENEMY_SPRITES[shape]();
}

// ═══ Draw helpers ════════════════════════════════════════════════════════════
const tintCache: Record<string, HTMLCanvasElement> = {};
function tint(spr: Sprite, color: string): HTMLCanvasElement {
  const key = color + ((spr.canvas as any)._id);
  if (tintCache[key]) return tintCache[key];
  const c = document.createElement('canvas');
  c.width = spr.canvas.width; c.height = spr.canvas.height;
  const g = c.getContext('2d')!;
  g.drawImage(spr.canvas, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  tintCache[key] = c;
  return c;
}

const ART = 5;

export function drawSprite(
  ctx: CanvasRenderingContext2D, spr: Sprite, cx: number, cy: number,
  flip: boolean, flashAlpha = 0, lean = 0,
): void {
  const w = spr.w * ART, h = spr.h * ART;
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(cy));
  ctx.scale(flip ? -1 : 1, 1);
  if (lean) ctx.rotate(lean * (flip ? -0.12 : 0.12));
  ctx.drawImage(spr.canvas, Math.round(-w / 2), Math.round(-h), w, h);
  if (flashAlpha > 0) {
    ctx.globalAlpha = flashAlpha;
    ctx.drawImage(tint(spr, '#ffffff'), Math.round(-w / 2), Math.round(-h), w, h);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
