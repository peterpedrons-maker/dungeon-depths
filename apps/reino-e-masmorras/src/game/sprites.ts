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

const OUTLINE = '#0e0a18';
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
  guerreiro: { hood: C.steel, hoodL: C.steelL, trim: '#c0392b', body: '#8794a3', bodyL: '#c9d2dc', bodyD: '#5f6b78' },
  mago:      { hood: '#5b21b6', hoodL: '#8b5cf6', trim: C.gold,  body: '#6d28d9', bodyL: '#9370db', bodyD: '#3c1361' },
  arqueiro:  { hood: '#1e5636', hoodL: '#2f7d4f', trim: '#c9a04a', body: '#2f7d4f', bodyL: '#57b877', bodyD: '#163d26' },
  clerigo:   { hood: C.gold, hoodL: C.goldL, trim: '#8a2030', body: C.white, bodyL: '#ffffff', bodyD: '#c9c2a8' },
};

type Pose = 'idle' | 'attack';

function heroBody(g: CanvasRenderingContext2D, pal: HeroPalette): void {
  // head covering
  px(g, 5, 0, 6, 1, pal.hood);
  px(g, 4, 1, 8, 2, pal.hood);
  px(g, 4, 1, 8, 1, pal.hoodL);
  px(g, 4, 3, 8, 1, pal.trim);
  // face
  px(g, 5, 4, 6, 3, C.skin);
  px(g, 4, 4, 1, 3, pal.hood);
  px(g, 11, 4, 1, 3, pal.hood);
  px(g, 6, 5, 1, 1, C.hair);
  px(g, 9, 5, 1, 1, C.hair);
  px(g, 5, 6, 6, 1, C.skinD);
  // torso
  px(g, 4, 7, 8, 6, pal.body);
  px(g, 4, 7, 8, 1, pal.bodyL);
  px(g, 6, 9, 4, 2, pal.trim);
  px(g, 4, 12, 8, 1, pal.trim);
  // arms
  px(g, 2, 8, 2, 5, pal.bodyD);
  px(g, 12, 8, 2, 5, pal.bodyD);
  px(g, 2, 12, 2, 2, C.skin);
  px(g, 12, 12, 2, 2, C.skin);
  // legs
  px(g, 5, 14, 3, 6, C.legs);
  px(g, 8, 14, 3, 6, C.legsD);
  px(g, 5, 19, 3, 1, C.steelD);
  px(g, 8, 19, 3, 1, C.steelD);
}

function heroWeapon(g: CanvasRenderingContext2D, classId: ClassId, pose: Pose): void {
  if (classId === 'guerreiro') {
    // shield on the left arm (both poses)
    px(g, 0, 9, 3, 6, C.brown);
    px(g, 0, 9, 3, 1, C.steelD);
    px(g, 0, 14, 3, 1, C.steelD);
    if (pose === 'idle') {
      px(g, 13, 16, 1, 3, C.gold);
      px(g, 13, 8, 2, 8, C.steelL);
    } else {
      px(g, 13, 2, 2, 8, C.steelL);
      px(g, 12, 9, 2, 2, C.gold);
      px(g, 15, 1, 1, 1, '#ffffff');
    }
  } else if (classId === 'mago') {
    px(g, 13, 2, 2, 17, C.brown);
    if (pose === 'idle') {
      px(g, 12, 0, 4, 3, '#40e0d0');
    } else {
      px(g, 11, 0, 6, 3, '#9df5ec');
      px(g, 13, 0, 2, 2, '#ffffff');
    }
  } else if (classId === 'arqueiro') {
    px(g, 0, 6, 2, 2, C.brown);
    px(g, 0, 8, 1, 6, C.brown);
    px(g, 0, 14, 2, 2, C.brown);
    px(g, 1, 9, 1, 4, C.brownD);
    if (pose === 'attack') {
      px(g, 2, 10, 3, 1, C.white);
      px(g, 4, 10, 1, 1, '#ffffff');
    }
  } else {
    // clerigo: golden staff with a sun ornament
    px(g, 13, 3, 2, 16, C.gold);
    px(g, 12, 0, 4, 4, pose === 'attack' ? C.goldL : C.gold);
    if (pose === 'attack') px(g, 13, 0, 2, 1, '#ffffff');
  }
}

function heroFrame(classId: ClassId, pose: Pose): Sprite {
  const pal = HERO_PALETTES[classId];
  return make(`hero_${classId}_${pose}`, 16, 20, (g) => {
    heroBody(g, pal);
    heroWeapon(g, classId, pose);
  });
}

export function heroSprites(classId: ClassId): { idle: Sprite; attack: Sprite } {
  return { idle: heroFrame(classId, 'idle'), attack: heroFrame(classId, 'attack') };
}

// ═══ ENEMIES ═════════════════════════════════════════════════════════════════
function goblinSprite(): Sprite {
  return make('goblin', 14, 16, (g) => {
    const green = '#5a8a3c', greenL = '#7ab85c', greenD = '#3a5c26', leather = '#5a4020', leatherL = '#7a5a30';
    px(g, 3, 0, 2, 1, green);
    px(g, 9, 0, 2, 1, green);
    px(g, 2, 1, 10, 4, green);
    px(g, 2, 1, 10, 1, greenL);
    px(g, 4, 3, 1, 1, '#ff5050'); px(g, 9, 3, 1, 1, '#ff5050');
    px(g, 4, 5, 6, 1, greenD);
    px(g, 2, 6, 10, 5, leather);
    px(g, 2, 6, 10, 1, leatherL);
    px(g, 1, 7, 1, 4, green); px(g, 12, 7, 1, 4, green);
    px(g, 3, 11, 3, 4, greenD); px(g, 8, 11, 3, 4, greenD);
  });
}

function wolfSprite(): Sprite {
  return make('wolf', 18, 12, (g) => {
    const grey = '#6b6b78', greyL = '#8a8a98', greyD = '#45454f';
    px(g, 0, 5, 3, 2, greyD);
    px(g, 2, 4, 13, 5, grey);
    px(g, 2, 4, 13, 1, greyL);
    px(g, 13, 1, 5, 5, grey);
    px(g, 17, 2, 1, 2, greyD);
    px(g, 14, 2, 1, 1, '#ffe070');
    px(g, 13, 0, 1, 1, greyD); px(g, 15, 0, 1, 1, greyD);
    px(g, 3, 9, 2, 3, greyD); px(g, 7, 9, 2, 3, greyD); px(g, 10, 9, 2, 3, greyD); px(g, 13, 9, 2, 3, greyD);
  });
}

function skeletonSprite(): Sprite {
  return make('skeleton', 12, 18, (g) => {
    const bone = '#d8d2b8', boneL = '#f0ecd8', boneD = '#a49f88', dark = '#1a1420';
    px(g, 3, 0, 6, 5, bone);
    px(g, 3, 0, 6, 1, boneL);
    px(g, 4, 2, 1, 2, dark); px(g, 7, 2, 1, 2, dark);
    px(g, 5, 4, 2, 1, boneD);
    px(g, 5, 5, 2, 7, bone);
    px(g, 2, 6, 8, 1, bone);
    px(g, 3, 8, 6, 1, boneD);
    px(g, 3, 10, 6, 1, boneD);
    px(g, 1, 6, 1, 5, bone); px(g, 10, 6, 1, 5, bone);
    px(g, 4, 12, 1, 5, bone); px(g, 7, 12, 1, 5, bone);
  });
}

function orcSprite(): Sprite {
  return make('orc', 18, 18, (g) => {
    const green = '#4f7a3a', greenL = '#6fa050', greenD = '#345128', dark2 = '#1c1c22', tusk = '#eee6cc';
    px(g, 6, 0, 6, 4, green);
    px(g, 6, 0, 6, 1, greenL);
    px(g, 7, 2, 1, 1, '#1a1420'); px(g, 10, 2, 1, 1, '#1a1420');
    px(g, 7, 3, 1, 1, tusk); px(g, 10, 3, 1, 1, tusk);
    px(g, 3, 4, 12, 8, greenD);
    px(g, 3, 4, 12, 1, green);
    px(g, 0, 5, 3, 6, greenD); px(g, 15, 5, 3, 6, greenD);
    px(g, 0, 10, 3, 2, tusk); px(g, 15, 10, 3, 2, tusk);
    px(g, 5, 12, 4, 6, dark2); px(g, 9, 12, 4, 6, dark2);
  });
}

function trollSprite(): Sprite {
  return make('troll', 22, 22, (g) => {
    const brown = '#7a5230', brownL = '#9a6f45', brownD = '#4f3420', dark2 = '#241a12';
    px(g, 7, 0, 8, 5, brown);
    px(g, 7, 0, 8, 1, brownL);
    px(g, 8, 2, 1, 1, '#1a1420'); px(g, 13, 2, 1, 1, '#1a1420');
    px(g, 3, 5, 16, 10, brownD);
    px(g, 3, 5, 16, 1, brown);
    px(g, 0, 6, 4, 8, brownD); px(g, 18, 6, 4, 8, brownD);
    px(g, 6, 15, 4, 7, dark2); px(g, 12, 15, 4, 7, dark2);
  });
}

function dragonSprite(): Sprite {
  return make('dragon', 24, 18, (g) => {
    const red = '#a5271f', redL = '#c8433a', redD = '#6e1a15', wing = '#3a1a2a', dark2 = '#1c1214';
    px(g, 2, 0, 9, 6, wing);
    px(g, 4, 6, 14, 8, red);
    px(g, 4, 6, 14, 1, redL);
    px(g, 16, 4, 6, 4, red);
    px(g, 21, 5, 2, 2, redD);
    px(g, 17, 5, 1, 1, '#f0c840');
    px(g, 0, 10, 4, 4, redD);
    px(g, 6, 14, 3, 4, dark2); px(g, 13, 14, 3, 4, dark2);
  });
}

function horrorSprite(): Sprite {
  return make('horror', 18, 18, (g) => {
    const purple = '#3a2a52', purpleL = '#5a4278';
    px(g, 0, 2, 3, 3, purple); px(g, 15, 2, 3, 3, purple);
    px(g, 0, 13, 3, 3, purple); px(g, 15, 13, 3, 3, purple);
    px(g, 3, 3, 12, 12, purple);
    px(g, 3, 3, 12, 1, purpleL);
    px(g, 6, 7, 2, 2, '#ff5050'); px(g, 10, 7, 2, 2, '#ff5050');
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
