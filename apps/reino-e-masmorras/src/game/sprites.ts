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
// Região 1 — Cripta do Tesouro
import zombieLooterUrl from '../assets/sprites/zombieLooter.webp';
import stoneGuardianUrl from '../assets/sprites/stoneGuardian.webp';
import greedyWraithUrl from '../assets/sprites/greedyWraith.webp';
import wrappedMummyUrl from '../assets/sprites/wrappedMummy.webp';
import mimicChestUrl from '../assets/sprites/mimicChest.webp';
import cursedCustodianUrl from '../assets/sprites/cursedCustodian.webp';
// Região 1 — Pântano Podre
import poisonToadUrl from '../assets/sprites/poisonToad.webp';
import swampViperUrl from '../assets/sprites/swampViper.webp';
import crawlingBogUrl from '../assets/sprites/crawlingBog.webp';
import cursedWispUrl from '../assets/sprites/cursedWisp.webp';
import rottingGatorUrl from '../assets/sprites/rottingGator.webp';
import mudMotherUrl from '../assets/sprites/mudMother.webp';
// Região 1 — Covil de Aranhas
import huntingSpiderUrl from '../assets/sprites/huntingSpider.webp';
import venomSpiderUrl from '../assets/sprites/venomSpider.webp';
import giantSpiderUrl from '../assets/sprites/giantSpider.webp';
import spiderlingSwarmUrl from '../assets/sprites/spiderlingSwarm.webp';
import darkWeaverUrl from '../assets/sprites/darkWeaver.webp';
import blackMatriarchUrl from '../assets/sprites/blackMatriarch.webp';
// Região 2 — Torre Amaldiçoada
import gargoyleUrl from '../assets/sprites/gargoyle.webp';
import spectralMageUrl from '../assets/sprites/spectralMage.webp';
import cursedKnightUrl from '../assets/sprites/cursedKnight.webp';
import watchingEyeUrl from '../assets/sprites/watchingEye.webp';
import crawlingShadowUrl from '../assets/sprites/crawlingShadow.webp';
import fallenArchmageUrl from '../assets/sprites/fallenArchmage.webp';
// Região 2 — Minas Abandonadas
import cursedMinerUrl from '../assets/sprites/cursedMiner.webp';
import oreGolemUrl from '../assets/sprites/oreGolem.webp';
import koboldRaiderUrl from '../assets/sprites/koboldRaider.webp';
import batSwarmUrl from '../assets/sprites/batSwarm.webp';
import gasWispUrl from '../assets/sprites/gasWisp.webp';
import oreTitanUrl from '../assets/sprites/oreTitan.webp';

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
  goblin: 120, wolf: 95, skeleton: 132,
  // Dragão Jovem is now Covil dos Dragões' own boss (see lib/enemies.ts) —
  // bumped up from its old regular-enemy height accordingly.
  dragon: 180,

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

  // Região 2 — Torre Amaldiçoada
  gargoyle: 140, spectralMage: 118, cursedKnight: 150, watchingEye: 85, crawlingShadow: 120, fallenArchmage: 175,
  // Região 2 — Minas Abandonadas
  cursedMiner: 120, oreGolem: 148, koboldRaider: 100, batSwarm: 82, gasWisp: 90, oreTitan: 178,
  // Região 2 — Floresta Amaldiçoada
  corruptedEnt: 155, ghostWolf: 100, darkFairy: 85, cursedBear: 145, stranglingVine: 110, forestHeart: 182,
  // Região 2 — Covil dos Dragões (dragon acima é o chefe)
  dragonHatchling: 110, wildWyvern: 130, scaledGuardian: 140, draconicCultist: 118, fireSerpent: 100,
  // Região 2 — Necrópole Esquecida (skeletonLord já existia)
  darkReaper: 135, deathCrow: 90, boneExecutioner: 150, wailingGhost: 120, graveWorm: 95, skeletonLord: 152,
  // Região 2 — Ruínas Élficas
  corruptedGuardian: 150, whisperingVine: 115, ruinBeast: 130, elvenWraith: 118, crystalGolem: 148, ancestralGuardian: 184,
  // Região 2 — Arena de Sangue
  cursedGladiator: 122, arenaBeast: 140, maskedExecutioner: 125, beastTamer: 118, fallenChampion: 130, grandChampion: 186,

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
// Ruínas Superficiais, Caverna dos Goblins, Cripta do Tesouro, Pântano
// Podre, Covil de Aranhas (Região 1), and Torre Amaldiçoada + Minas
// Abandonadas (Região 2) now have their own dedicated art (regulars +
// boss). Every other dungeon's roster still doesn't — each shape
// temporarily reuses the sprite of an existing, already-integrated shape
// with the closest thematic fit (a cultist borrows the ruin bandit's
// robed-human one, ...) until real art is generated and integrated, same
// placeholder pattern already used for classes without their own sprite.
// skeletonLord (Necrópole's boss) and dragon (Covil dos Dragões' boss,
// "Dragão Jovem") are also exceptions with real dedicated art already —
// they're existing shapes wearing their own actual sprite, not a stand-in.
const ENEMY_SOURCES: Record<EnemyShape, string> = {
  goblin: goblinUrl, wolf: loboUrl, skeleton: esqueletoUrl, dragon: dragaoUrl,

  // Região 1 — Ruínas Superficiais
  ruinBat: ruinBatUrl, acidSlime: acidSlimeUrl, ruinBandit: ruinBanditUrl, carrionCrow: carrionCrowUrl, boneKing: boneKingUrl,
  // Região 1 — Caverna dos Goblins
  goblinShaman: goblinShamanUrl, goblinThrower: goblinThrowerUrl, goblinFanatic: goblinFanaticUrl, goblinWolfRider: goblinWolfRiderUrl, grash: grashUrl,
  // Região 1 — Cripta do Tesouro
  zombieLooter: zombieLooterUrl, stoneGuardian: stoneGuardianUrl, greedyWraith: greedyWraithUrl, wrappedMummy: wrappedMummyUrl, mimicChest: mimicChestUrl, cursedCustodian: cursedCustodianUrl,
  // Região 1 — Pântano Podre
  poisonToad: poisonToadUrl, swampViper: swampViperUrl, crawlingBog: crawlingBogUrl, cursedWisp: cursedWispUrl, rottingGator: rottingGatorUrl, mudMother: mudMotherUrl,
  // Região 1 — Covil de Aranhas
  huntingSpider: huntingSpiderUrl, venomSpider: venomSpiderUrl, giantSpider: giantSpiderUrl, spiderlingSwarm: spiderlingSwarmUrl, darkWeaver: darkWeaverUrl, blackMatriarch: blackMatriarchUrl,

  // Região 2 — Torre Amaldiçoada
  gargoyle: gargoyleUrl, spectralMage: spectralMageUrl, cursedKnight: cursedKnightUrl, watchingEye: watchingEyeUrl, crawlingShadow: crawlingShadowUrl, fallenArchmage: fallenArchmageUrl,
  // Região 2 — Minas Abandonadas
  cursedMiner: cursedMinerUrl, oreGolem: oreGolemUrl, koboldRaider: koboldRaiderUrl, batSwarm: batSwarmUrl, gasWisp: gasWispUrl, oreTitan: oreTitanUrl,
  // Região 2 — Floresta Amaldiçoada (placeholder: troll pros grandões, lobo/aberração pros menores)
  corruptedEnt: trollUrl, ghostWolf: loboUrl, darkFairy: aberracaoUrl, cursedBear: trollUrl, stranglingVine: acidSlimeUrl, forestHeart: trollUrl,
  // Região 2 — Covil dos Dragões (placeholder: dragão pros dracônicos, bandido pro cultista humano)
  dragonHatchling: dragaoUrl, wildWyvern: dragaoUrl, scaledGuardian: dragaoUrl, draconicCultist: ruinBanditUrl, fireSerpent: dragaoUrl,
  // Região 2 — Necrópole Esquecida (placeholder: esqueleto/corvo/aberração/limo conforme o tema; skeletonLord já tem arte própria)
  darkReaper: boneKingUrl, deathCrow: carrionCrowUrl, boneExecutioner: boneKingUrl, wailingGhost: aberracaoUrl, graveWorm: acidSlimeUrl, skeletonLord: esqueletoUrl,
  // Região 2 — Ruínas Élficas (placeholder: troll pros grandões, lobo pra fera, aberração pro espectro)
  corruptedGuardian: trollUrl, whisperingVine: acidSlimeUrl, ruinBeast: loboUrl, elvenWraith: aberracaoUrl, crystalGolem: trollUrl, ancestralGuardian: trollUrl,
  // Região 2 — Arena de Sangue (placeholder: bandido pros lutadores humanos, troll pra fera, esqueleto morto-vivo pro campeão caído)
  cursedGladiator: ruinBanditUrl, arenaBeast: trollUrl, maskedExecutioner: ruinBanditUrl, beastTamer: ruinBanditUrl, fallenChampion: boneKingUrl, grandChampion: boneKingUrl,

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

// Shapes still borrowing another shape's sprite as a stand-in (see the
// "(placeholder: ...)" comments above) rather than skeleton/dragon-style
// intentional reuse — Bestiario.tsx shows a "?" for these instead of a
// picture that would otherwise look like some unrelated creature's, or
// worse, an exact duplicate of a different entry's sprite.
export const PLACEHOLDER_ENEMY_SHAPES = new Set<EnemyShape>([
  // Região 2 — Floresta Amaldiçoada
  'corruptedEnt', 'ghostWolf', 'darkFairy', 'cursedBear', 'stranglingVine', 'forestHeart',
  // Região 2 — Covil dos Dragões (dragon, o chefe, já tem arte própria)
  'dragonHatchling', 'wildWyvern', 'scaledGuardian', 'draconicCultist', 'fireSerpent',
  // Região 2 — Necrópole Esquecida (skeletonLord, o chefe, já tem arte própria)
  'darkReaper', 'deathCrow', 'boneExecutioner', 'wailingGhost', 'graveWorm',
  // Região 2 — Ruínas Élficas
  'corruptedGuardian', 'whisperingVine', 'ruinBeast', 'elvenWraith', 'crystalGolem', 'ancestralGuardian',
  // Região 2 — Arena de Sangue
  'cursedGladiator', 'arenaBeast', 'maskedExecutioner', 'beastTamer', 'fallenChampion', 'grandChampion',
  // Alvos de Caçada (lib/hunts.ts)
  'boneTyrant', 'swampLeviathan', 'infernalWyrm',
]);

export function hasOwnEnemyArt(shape: EnemyShape): boolean {
  return !PLACEHOLDER_ENEMY_SHAPES.has(shape);
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
