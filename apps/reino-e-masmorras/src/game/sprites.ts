// ─── Sprite system ──────────────────────────────────────────────────────────
// Hand-drawn pixel-art character art (AI-generated from prompts in the art
// kit, chroma-keyed and cropped), loaded once and blitted to the combat
// canvas scaled up with smoothing off.
import { ClassId, EnemyShape } from '../types/game';

import guerreiroUrl from '../assets/sprites/guerreiro.webp';
import magoUrl from '../assets/sprites/mago.webp';
import assassinoUrl from '../assets/sprites/assassino.webp';
import clerigoUrl from '../assets/sprites/clerigo.webp';
import cavaleiroUrl from '../assets/sprites/cavaleiro.webp';
import paladinoUrl from '../assets/sprites/paladino.webp';
import barbaroUrl from '../assets/sprites/barbaro.webp';
import arqueiroUrl from '../assets/sprites/arqueiro.webp';
import cacadorUrl from '../assets/sprites/cacador.webp';
import feiticeiroUrl from '../assets/sprites/feiticeiro.webp';
import bruxoUrl from '../assets/sprites/bruxo.webp';
import druidaUrl from '../assets/sprites/druida.webp';
import bardoUrl from '../assets/sprites/bardo.webp';
import necromanteUrl from '../assets/sprites/necromante.webp';
import goblinUrl from '../assets/sprites/goblin.webp';
import loboUrl from '../assets/sprites/lobo.webp';
import esqueletoUrl from '../assets/sprites/esqueleto.webp';
import orcUrl from '../assets/sprites/orc.webp';
import trollUrl from '../assets/sprites/troll.webp';
import dragaoUrl from '../assets/sprites/dragao.webp';
import aberracaoUrl from '../assets/sprites/aberracao.webp';
import ruinBatUrl from '../assets/sprites/ruinBat.webp';
import acidSlimeUrl from '../assets/sprites/acidSlime.webp';
import ruinBanditUrl from '../assets/sprites/ruinBandit.webp';
import carrionCrowUrl from '../assets/sprites/carrionCrow.webp';
import boneKingUrl from '../assets/sprites/boneKing.webp';
import goblinWolfRiderUrl from '../assets/sprites/goblinWolfRider.webp';
import goblinFanaticUrl from '../assets/sprites/goblinFanatic.webp';
import goblinThrowerUrl from '../assets/sprites/goblinThrower.webp';
import goblinShamanUrl from '../assets/sprites/goblinShaman.webp';
import grashUrl from '../assets/sprites/grash.webp';

export interface Sprite {
  image: HTMLImageElement;
  w: number;
  h: number;
  scale: number;
}

// Target on-screen height (px) for each character, roughly matching their
// relative size in the fiction (a goblin is small, a troll looms large).
// Common (non-boss) enemies got a bigger relative bump than bosses here —
// bosses already read as large, so the fiction's size gap stays intact.
const HERO_DISPLAY_H = 165;
const ENEMY_DISPLAY_H: Record<EnemyShape, number> = {
  goblin: 120, wolf: 95, skeleton: 132, orc: 144, troll: 163, dragon: 150, horror: 144,

  // Região 1 — Ruínas Superficiais
  ruinBat: 88, acidSlime: 90, ruinBandit: 121, carrionCrow: 88, boneKing: 173,
  // Região 1 — Caverna dos Goblins
  goblinShaman: 117, goblinThrower: 119, goblinFanatic: 119, goblinWolfRider: 124, grash: 168,
  // Região 1 — Cripta do Tesouro
  zombieLooter: 121, stoneGuardian: 150, greedyWraith: 115, wrappedMummy: 121, mimicChest: 100, cursedCustodian: 173,
  // Região 1 — Pântano Podre
  poisonToad: 94, swampViper: 88, crawlingBog: 113, cursedWisp: 81, rottingGator: 115, mudMother: 179,
  // Região 1 — Covil de Aranhas
  huntingSpider: 113, venomSpider: 106, giantSpider: 138, spiderlingSwarm: 81, darkWeaver: 132, blackMatriarch: 184,

  // Bosses da Região 2+ reaproveitando o shape base — maiores que o normal
  horrorAncient: 163, orcWarlord: 163, trollChieftain: 184, dragonElder: 168, skeletonLord: 152,

  // Alvos de Caçada (lib/hunts.ts) — maiores ainda, para reforçar visualmente
  // que são o desafio mais duro disponível.
  boneTyrant: 190, swampLeviathan: 196, infernalWyrm: 184,
};

function loadImage(url: string, displayH: number): Sprite {
  const image = new Image();
  image.src = url;
  // Natural size isn't known until the image decodes; drawSprite recomputes
  // the scale lazily from image.naturalWidth/Height once it's available.
  return { image, w: 0, h: 0, scale: displayH };
}

const HERO_SOURCES: Record<ClassId, string> = {
  // Assassino's sprite file carries over unchanged for Ladino (same class,
  // renamed). Every class now has dedicated art.
  guerreiro: guerreiroUrl, mago: magoUrl, ladino: assassinoUrl,
  clerigo: clerigoUrl,
  cavaleiro: cavaleiroUrl, paladino: paladinoUrl, barbaro: barbaroUrl, arqueiro: arqueiroUrl,
  cacador: cacadorUrl, bardo: bardoUrl,
  feiticeiro: feiticeiroUrl, bruxo: bruxoUrl, druida: druidaUrl, necromante: necromanteUrl,
};
// Ruínas Superficiais and Caverna dos Goblins now have their own dedicated
// art (regulars + boss). The remaining Região 1 shapes (Cripta, Pântano,
// Aranhas) still don't — each temporarily reuses the sprite of an existing
// shape from the same dungeon (or the closest thematic fit) until real art
// is generated and integrated, same placeholder pattern already used for
// classes without their own sprite. Região 2+ bosses intentionally and
// permanently reuse their own base shape's sprite (a boss there literally
// IS a bigger version of that same creature), not a placeholder.
const ENEMY_SOURCES: Record<EnemyShape, string> = {
  goblin: goblinUrl, wolf: loboUrl, skeleton: esqueletoUrl, orc: orcUrl,
  troll: trollUrl, dragon: dragaoUrl, horror: aberracaoUrl,

  // Região 1 — Ruínas Superficiais
  ruinBat: ruinBatUrl, acidSlime: acidSlimeUrl, ruinBandit: ruinBanditUrl, carrionCrow: carrionCrowUrl, boneKing: boneKingUrl,
  // Região 1 — Caverna dos Goblins
  goblinShaman: goblinShamanUrl, goblinThrower: goblinThrowerUrl, goblinFanatic: goblinFanaticUrl, goblinWolfRider: goblinWolfRiderUrl, grash: grashUrl,
  // Região 1 — Cripta do Tesouro (placeholder: esqueleto, tema morto-vivo)
  zombieLooter: esqueletoUrl, stoneGuardian: esqueletoUrl, greedyWraith: esqueletoUrl, wrappedMummy: esqueletoUrl, mimicChest: esqueletoUrl, cursedCustodian: esqueletoUrl,
  // Região 1 — Pântano Podre (placeholder: orc)
  poisonToad: orcUrl, swampViper: orcUrl, crawlingBog: orcUrl, cursedWisp: orcUrl, rottingGator: orcUrl, mudMother: orcUrl,
  // Região 1 — Covil de Aranhas (placeholder: troll)
  huntingSpider: trollUrl, venomSpider: trollUrl, giantSpider: trollUrl, spiderlingSwarm: trollUrl, darkWeaver: trollUrl, blackMatriarch: trollUrl,

  // Bosses da Região 2+ — reaproveitam o sprite do próprio shape base
  horrorAncient: aberracaoUrl, orcWarlord: orcUrl, trollChieftain: trollUrl, dragonElder: dragaoUrl, skeletonLord: esqueletoUrl,

  // Alvos de Caçada (lib/hunts.ts) — placeholder no shape temático mais
  // próximo (mesmo padrão acima) até ganharem arte própria.
  boneTyrant: esqueletoUrl, swampLeviathan: trollUrl, infernalWyrm: dragaoUrl,
};

const heroCache: Partial<Record<ClassId, Sprite>> = {};
export function heroSprites(classId: ClassId): { idle: Sprite; attack: Sprite } {
  if (!heroCache[classId]) {
    heroCache[classId] = loadImage(HERO_SOURCES[classId], HERO_DISPLAY_H);
  }
  const spr = heroCache[classId]!;
  // A single static pose is used for both idle and attack; the lean/rotate
  // animation in drawSprite already sells the swing.
  return { idle: spr, attack: spr };
}

const enemyCache: Partial<Record<EnemyShape, Sprite>> = {};
export function enemySprite(shape: EnemyShape): Sprite {
  if (!enemyCache[shape]) {
    enemyCache[shape] = loadImage(ENEMY_SOURCES[shape], ENEMY_DISPLAY_H[shape]);
  }
  return enemyCache[shape]!;
}

// ═══ Draw helpers ════════════════════════════════════════════════════════════
const tintCache = new Map<string, HTMLCanvasElement>();
function tint(spr: Sprite, color: string): HTMLCanvasElement | null {
  const { image } = spr;
  if (!image.complete || image.naturalWidth === 0) return null;
  const cached = tintCache.get(image.src);
  if (cached) return cached;
  const c = document.createElement('canvas');
  c.width = image.naturalWidth; c.height = image.naturalHeight;
  const g = c.getContext('2d')!;
  g.drawImage(image, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  tintCache.set(image.src, c);
  return c;
}

export function drawSprite(
  ctx: CanvasRenderingContext2D, spr: Sprite, cx: number, cy: number,
  flip: boolean, flashAlpha = 0, lean = 0,
): void {
  const { image } = spr;
  if (!image.complete || image.naturalWidth === 0) return;
  const h = spr.scale;
  const w = (image.naturalWidth / image.naturalHeight) * h;
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(cy));
  ctx.scale(flip ? -1 : 1, 1);
  if (lean) ctx.rotate(lean * (flip ? -0.12 : 0.12));
  ctx.drawImage(image, Math.round(-w / 2), Math.round(-h), w, h);
  if (flashAlpha > 0) {
    const tinted = tint(spr, '#ffffff');
    if (tinted) {
      ctx.globalAlpha = flashAlpha;
      ctx.drawImage(tinted, Math.round(-w / 2), Math.round(-h), w, h);
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}
