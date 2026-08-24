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
import corruptedEntUrl from '../assets/sprites/corruptedEnt.webp';
import ghostWolfUrl from '../assets/sprites/ghostWolf.webp';
import darkFairyUrl from '../assets/sprites/darkFairy.webp';
import cursedBearUrl from '../assets/sprites/cursedBear.webp';
import stranglingVineUrl from '../assets/sprites/stranglingVine.webp';
import forestHeartUrl from '../assets/sprites/forestHeart.webp';
import dragonHatchlingUrl from '../assets/sprites/dragonHatchling.webp';
import wildWyvernUrl from '../assets/sprites/wildWyvern.webp';
import scaledGuardianUrl from '../assets/sprites/scaledGuardian.webp';
import draconicCultistUrl from '../assets/sprites/draconicCultist.webp';
import fireSerpentUrl from '../assets/sprites/fireSerpent.webp';
import darkReaperUrl from '../assets/sprites/darkReaper.webp';
import deathCrowUrl from '../assets/sprites/deathCrow.webp';
import boneExecutionerUrl from '../assets/sprites/boneExecutioner.webp';
import wailingGhostUrl from '../assets/sprites/wailingGhost.webp';
import graveWormUrl from '../assets/sprites/graveWorm.webp';
import skeletonLordUrl from '../assets/sprites/skeletonLord.webp';
import corruptedGuardianUrl from '../assets/sprites/corruptedGuardian.webp';
import whisperingVineUrl from '../assets/sprites/whisperingVine.webp';
import ruinBeastUrl from '../assets/sprites/ruinBeast.webp';
import elvenWraithUrl from '../assets/sprites/elvenWraith.webp';
import ancestralGuardianUrl from '../assets/sprites/ancestralGuardian.webp';
import cursedGladiatorUrl from '../assets/sprites/cursedGladiator.webp';
import arenaBeastUrl from '../assets/sprites/arenaBeast.webp';
import maskedExecutionerUrl from '../assets/sprites/maskedExecutioner.webp';
import beastTamerUrl from '../assets/sprites/beastTamer.webp';
import fallenChampionUrl from '../assets/sprites/fallenChampion.webp';
import grandChampionUrl from '../assets/sprites/grandChampion.webp';
import orcWarriorUrl from '../assets/sprites/orcWarrior.webp';
import orcArcherUrl from '../assets/sprites/orcArcher.webp';
import orcShamanUrl from '../assets/sprites/orcShaman.webp';
import orcBerserkerUrl from '../assets/sprites/orcBerserker.webp';
import orcStandardBearerUrl from '../assets/sprites/orcStandardBearer.webp';
import orcWarchiefUrl from '../assets/sprites/orcWarchief.webp';
import iceElementalUrl from '../assets/sprites/iceElemental.webp';
import frostWolfUrl from '../assets/sprites/frostWolf.webp';
import glacialBatUrl from '../assets/sprites/glacialBat.webp';
import iceWraithUrl from '../assets/sprites/iceWraith.webp';
import frozenSentinelUrl from '../assets/sprites/frozenSentinel.webp';
import iceMonarchUrl from '../assets/sprites/iceMonarch.webp';
import alphaWolfPupUrl from '../assets/sprites/alphaWolfPup.webp';
import direWolfUrl from '../assets/sprites/direWolf.webp';
import snowStalkerUrl from '../assets/sprites/snowStalker.webp';
import packHunterUrl from '../assets/sprites/packHunter.webp';
import frostFangWolfUrl from '../assets/sprites/frostFangWolf.webp';
import alphaDireWolfUrl from '../assets/sprites/alphaDireWolf.webp';
import royalSkeletonUrl from '../assets/sprites/royalSkeleton.webp';
import cryptSentinelUrl from '../assets/sprites/cryptSentinel.webp';
import boneNobleUrl from '../assets/sprites/boneNoble.webp';
import spectralChamberlainUrl from '../assets/sprites/spectralChamberlain.webp';
import entombedKnightUrl from '../assets/sprites/entombedKnight.webp';
import royalLichUrl from '../assets/sprites/royalLich.webp';

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

  // Região 3 — Fortaleza Orc
  orcWarrior: 122, orcArcher: 118, orcShaman: 116, orcBerserker: 124, orcStandardBearer: 128, orcWarchief: 176,
  // Região 3 — Labirinto de Gelo
  iceElemental: 128, frostWolf: 100, glacialBat: 84, iceWraith: 120, frozenSentinel: 148, iceMonarch: 182,
  // Região 3 — Templo Afundado
  drownedAcolyte: 118, frozenPriest: 120, lakeWraith: 116, submergedGuardian: 150, iceEel: 96, sunkenHighPriest: 184,
  // Região 3 — Cavernas de Cristal
  crystalBat: 84, crystalSpider: 118, prismGolem: 150, crystalWisp: 82, glimmeringStalker: 122, crystalSovereign: 184,
  // Região 3 — Covil do Lobo Alfa
  alphaWolfPup: 92, direWolf: 108, snowStalker: 104, packHunter: 106, frostFangWolf: 112, alphaDireWolf: 190,
  // Região 3 — Catacumbas Reais
  royalSkeleton: 130, cryptSentinel: 150, boneNoble: 126, spectralChamberlain: 118, entombedKnight: 152, royalLich: 186,
  // Região 3 — Poço sem Fundo (especial)
  wellCrawler: 120, voidTendril: 122, drowningWraith: 118, abyssalStalker: 126, hollowDweller: 128, pitDweller: 200,

  // Região 4 — Covil da Aranha-Rainha
  jungleSpider: 118, silkStalker: 122, spiderBrood: 90, webWeaverJungle: 134, venomousBroodling: 100, spiderQueen: 192,
  // Região 4 — Cidadela em Ruínas
  ruinedSentinel: 150, vineWarrior: 126, crumblingGolem: 152, junglePhantom: 122, overgrownGuardian: 155, citadelGuardian: 194,
  // Região 4 — Santuário Profanado
  defiledPriest: 122, profaneIdol: 148, corruptedAcolyte: 124, hexedStatue: 150, ritualCultist: 120, profaneHighPriest: 196,
  // Região 4 — Mina de Obsidiana
  obsidianGolem: 152, magmaBat: 86, obsidianMiner: 122, emberWraith: 120, obsidianBeetle: 110, obsidianColossus: 198,
  // Região 4 — Selva Esquecida
  forgottenGuardian: 152, junglePredator: 112, ancientVine: 118, feralJaguar: 108, sporeling: 96, forgottenColossus: 196,
  // Região 4 — Fortaleza dos Ossos
  boneSoldier: 128, boneArcher: 124, marrowGolem: 154, boneCatapultBeast: 140, ossuaryWraith: 122, boneWarlord: 198,
  // Região 4 — Torre dos Ecos (especial)
  echoWraith: 124, resonantSpecter: 122, mirroredHorror: 130, echoSentinel: 150, hollowChant: 120, echoSovereign: 202,

  // Região 5 — Abismo de Gelo
  glacialWraith: 126, abyssalIceElemental: 132, frostcrawler: 120, iceBehemoth: 158, hollowFrost: 118, glacialAbyssLord: 206,
  // Região 5 — Ruínas Vulcânicas
  magmaGolem: 154, ashWraith: 124, emberBat: 88, volcanicStalker: 122, cinderHound: 110, infernoColossus: 208,
  // Região 5 — Covil do Dragão Ancião
  ancientDrakeling: 118, dragonCultistElder: 122, scaleWyrmling: 128, drakeGuardian: 148, emberDrake: 126, elderDragon: 210,
  // Região 5 — Salão dos Titãs
  titanGuardian: 156, stoneColossus: 160, ancientSentinel: 132, runicGolem: 150, titanWarden: 154, fallenTitan: 210,
  // Região 5 — Necrópole Real
  royalWraith: 126, ashenGuard: 150, cursedEmbalmer: 122, royalMummy: 128, deathHerald: 130, royalNecromancer: 208,
  // Região 5 — Palácio Submerso
  drownedCourtier: 122, submergedGuard: 150, tidalWraith: 124, coralHorror: 116, deepOneAcolyte: 120, drownedMonarch: 208,
  // Região 5 — Arena do Campeão (especial)
  championGladiator: 128, arenaChampionBeast: 148, veteranDuelist: 126, arenaWarlord: 130, bloodiedChampion: 128, eternalChampion: 212,
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
  // Região 2 — Floresta Amaldiçoada
  corruptedEnt: corruptedEntUrl, ghostWolf: ghostWolfUrl, darkFairy: darkFairyUrl, cursedBear: cursedBearUrl, stranglingVine: stranglingVineUrl, forestHeart: forestHeartUrl,
  // Região 2 — Covil dos Dragões
  dragonHatchling: dragonHatchlingUrl, wildWyvern: wildWyvernUrl, scaledGuardian: scaledGuardianUrl, draconicCultist: draconicCultistUrl, fireSerpent: fireSerpentUrl,
  // Região 2 — Necrópole Esquecida
  darkReaper: darkReaperUrl, deathCrow: deathCrowUrl, boneExecutioner: boneExecutionerUrl, wailingGhost: wailingGhostUrl, graveWorm: graveWormUrl, skeletonLord: skeletonLordUrl,
  // Região 2 — Ruínas Élficas (crystalGolem ainda placeholder — sem arte própria)
  corruptedGuardian: corruptedGuardianUrl, whisperingVine: whisperingVineUrl, ruinBeast: ruinBeastUrl, elvenWraith: elvenWraithUrl, crystalGolem: trollUrl, ancestralGuardian: ancestralGuardianUrl,
  // Região 2 — Arena de Sangue
  cursedGladiator: cursedGladiatorUrl, arenaBeast: arenaBeastUrl, maskedExecutioner: maskedExecutionerUrl, beastTamer: beastTamerUrl, fallenChampion: fallenChampionUrl, grandChampion: grandChampionUrl,

  // Alvos de Caçada (lib/hunts.ts) — placeholder no shape temático mais
  // próximo (mesmo padrão acima) até ganharem arte própria.
  boneTyrant: esqueletoUrl, swampLeviathan: trollUrl, infernalWyrm: dragaoUrl,

  // Região 3 — Fortaleza Orc
  orcWarrior: orcWarriorUrl, orcArcher: orcArcherUrl, orcShaman: orcShamanUrl, orcBerserker: orcBerserkerUrl, orcStandardBearer: orcStandardBearerUrl, orcWarchief: orcWarchiefUrl,
  // Região 3 — Labirinto de Gelo
  iceElemental: iceElementalUrl, frostWolf: frostWolfUrl, glacialBat: glacialBatUrl, iceWraith: iceWraithUrl, frozenSentinel: frozenSentinelUrl, iceMonarch: iceMonarchUrl,
  // Região 3 — Templo Afundado (placeholder: bandido pros humanoides, aberração pro espectro, guardião de pedra, limo pra enguia)
  drownedAcolyte: ruinBanditUrl, frozenPriest: ruinBanditUrl, lakeWraith: aberracaoUrl, submergedGuardian: stoneGuardianUrl, iceEel: acidSlimeUrl, sunkenHighPriest: trollUrl,
  // Região 3 — Cavernas de Cristal (placeholder: aranha caçadora pras aranhas/rastreador, morcego das ruínas pro morcego, vagalume amaldiçoado pro vagalume, guardião de pedra pro golem)
  crystalBat: ruinBatUrl, crystalSpider: huntingSpiderUrl, prismGolem: stoneGuardianUrl, crystalWisp: cursedWispUrl, glimmeringStalker: huntingSpiderUrl, crystalSovereign: trollUrl,
  // Região 3 — Covil do Lobo Alfa
  alphaWolfPup: alphaWolfPupUrl, direWolf: direWolfUrl, snowStalker: snowStalkerUrl, packHunter: packHunterUrl, frostFangWolf: frostFangWolfUrl, alphaDireWolf: alphaDireWolfUrl,
  // Região 3 — Catacumbas Reais
  royalSkeleton: royalSkeletonUrl, cryptSentinel: cryptSentinelUrl, boneNoble: boneNobleUrl, spectralChamberlain: spectralChamberlainUrl, entombedKnight: entombedKnightUrl, royalLich: royalLichUrl,
  // Região 3 — Poço sem Fundo (especial, placeholder: aberração pros horrores do vazio, aranha caçadora pro perseguidor, troll pro chefe final)
  wellCrawler: aberracaoUrl, voidTendril: aberracaoUrl, drowningWraith: aberracaoUrl, abyssalStalker: huntingSpiderUrl, hollowDweller: aberracaoUrl, pitDweller: trollUrl,

  // Região 4 — Covil da Aranha-Rainha (placeholder: reaproveita o tema aracnídeo já existente)
  jungleSpider: huntingSpiderUrl, silkStalker: huntingSpiderUrl, spiderBrood: spiderlingSwarmUrl, webWeaverJungle: darkWeaverUrl, venomousBroodling: venomSpiderUrl, spiderQueen: blackMatriarchUrl,
  // Região 4 — Cidadela em Ruínas (placeholder: guardião de pedra pros golens/sentinelas, bandido pro guerreiro, aberração pro fantasma, troll pro guardião coberto/chefe)
  ruinedSentinel: stoneGuardianUrl, vineWarrior: ruinBanditUrl, crumblingGolem: stoneGuardianUrl, junglePhantom: aberracaoUrl, overgrownGuardian: trollUrl, citadelGuardian: trollUrl,
  // Região 4 — Santuário Profanado (placeholder: bandido pros humanos, guardião de pedra pros ídolos/estátuas, troll pro chefe)
  defiledPriest: ruinBanditUrl, profaneIdol: stoneGuardianUrl, corruptedAcolyte: ruinBanditUrl, hexedStatue: stoneGuardianUrl, ritualCultist: ruinBanditUrl, profaneHighPriest: trollUrl,
  // Região 4 — Mina de Obsidiana (placeholder: guardião de pedra pro golem, morcego das ruínas pro morcego, coveiro amaldiçoado pro mineiro, aberração pro espectro, limo pro besouro, troll pro chefe)
  obsidianGolem: stoneGuardianUrl, magmaBat: ruinBatUrl, obsidianMiner: cursedMinerUrl, emberWraith: aberracaoUrl, obsidianBeetle: acidSlimeUrl, obsidianColossus: trollUrl,
  // Região 4 — Selva Esquecida (placeholder: guardião de pedra pro guardião, lobo pro predador/jaguar, limo pra vinha/esporídeo, troll pro chefe)
  forgottenGuardian: stoneGuardianUrl, junglePredator: loboUrl, ancientVine: acidSlimeUrl, feralJaguar: loboUrl, sporeling: acidSlimeUrl, forgottenColossus: trollUrl,
  // Região 4 — Fortaleza dos Ossos (placeholder: esqueleto/rei ossos pros mortos-vivos, troll pra fera catapulta, aberração pro espectro)
  boneSoldier: esqueletoUrl, boneArcher: esqueletoUrl, marrowGolem: boneKingUrl, boneCatapultBeast: trollUrl, ossuaryWraith: aberracaoUrl, boneWarlord: boneKingUrl,
  // Região 4 — Torre dos Ecos (especial, placeholder: aberração pros ecos/horrores, guardião de pedra pra sentinela, troll pro chefe final)
  echoWraith: aberracaoUrl, resonantSpecter: aberracaoUrl, mirroredHorror: aberracaoUrl, echoSentinel: stoneGuardianUrl, hollowChant: aberracaoUrl, echoSovereign: trollUrl,

  // Região 5 — Abismo de Gelo (placeholder: aberração pros elementais/espectros, aranha caçadora pro rastejante, troll pros grandões/chefe)
  glacialWraith: aberracaoUrl, abyssalIceElemental: aberracaoUrl, frostcrawler: huntingSpiderUrl, iceBehemoth: trollUrl, hollowFrost: aberracaoUrl, glacialAbyssLord: trollUrl,
  // Região 5 — Ruínas Vulcânicas (placeholder: guardião de pedra pro golem, aberração pro espectro, morcego das ruínas pro morcego, lobo pros caçadores, troll pro chefe)
  magmaGolem: stoneGuardianUrl, ashWraith: aberracaoUrl, emberBat: ruinBatUrl, volcanicStalker: loboUrl, cinderHound: loboUrl, infernoColossus: trollUrl,
  // Região 5 — Covil do Dragão Ancião (placeholder: reaproveita o tema dracônico já existente)
  ancientDrakeling: dragaoUrl, dragonCultistElder: ruinBanditUrl, scaleWyrmling: dragaoUrl, drakeGuardian: dragaoUrl, emberDrake: dragaoUrl, elderDragon: dragaoUrl,
  // Região 5 — Salão dos Titãs (placeholder: guardião de pedra/troll pros titãs e colossos)
  titanGuardian: stoneGuardianUrl, stoneColossus: trollUrl, ancientSentinel: stoneGuardianUrl, runicGolem: stoneGuardianUrl, titanWarden: trollUrl, fallenTitan: trollUrl,
  // Região 5 — Necrópole Real (placeholder: reaproveita o tema morto-vivo/múmia já existente)
  royalWraith: aberracaoUrl, ashenGuard: boneKingUrl, cursedEmbalmer: ruinBanditUrl, royalMummy: wrappedMummyUrl, deathHerald: esqueletoUrl, royalNecromancer: boneKingUrl,
  // Região 5 — Palácio Submerso (placeholder: bandido pros cortesãos/acólitos, guardião de pedra pro guarda, aberração pro espectro, limo pro horror de coral, troll pro chefe)
  drownedCourtier: ruinBanditUrl, submergedGuard: stoneGuardianUrl, tidalWraith: aberracaoUrl, coralHorror: acidSlimeUrl, deepOneAcolyte: ruinBanditUrl, drownedMonarch: trollUrl,
  // Região 5 — Arena do Campeão (especial, placeholder: bandido pros duelistas humanos, troll pra fera, rei ossos pro campeão ensanguentado/chefe final)
  championGladiator: ruinBanditUrl, arenaChampionBeast: trollUrl, veteranDuelist: ruinBanditUrl, arenaWarlord: ruinBanditUrl, bloodiedChampion: boneKingUrl, eternalChampion: boneKingUrl,
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
  // Região 2 — Ruínas Élficas (crystalGolem ainda sem arte própria)
  'crystalGolem',
  // Alvos de Caçada (lib/hunts.ts)
  'boneTyrant', 'swampLeviathan', 'infernalWyrm',
  // Região 3 — Templo Afundado
  'drownedAcolyte', 'frozenPriest', 'lakeWraith', 'submergedGuardian', 'iceEel', 'sunkenHighPriest',
  // Região 3 — Cavernas de Cristal
  'crystalBat', 'crystalSpider', 'prismGolem', 'crystalWisp', 'glimmeringStalker', 'crystalSovereign',
  // Região 3 — Poço sem Fundo (especial)
  'wellCrawler', 'voidTendril', 'drowningWraith', 'abyssalStalker', 'hollowDweller', 'pitDweller',
  // Região 4 — Covil da Aranha-Rainha
  'jungleSpider', 'silkStalker', 'spiderBrood', 'webWeaverJungle', 'venomousBroodling', 'spiderQueen',
  // Região 4 — Cidadela em Ruínas
  'ruinedSentinel', 'vineWarrior', 'crumblingGolem', 'junglePhantom', 'overgrownGuardian', 'citadelGuardian',
  // Região 4 — Santuário Profanado
  'defiledPriest', 'profaneIdol', 'corruptedAcolyte', 'hexedStatue', 'ritualCultist', 'profaneHighPriest',
  // Região 4 — Mina de Obsidiana
  'obsidianGolem', 'magmaBat', 'obsidianMiner', 'emberWraith', 'obsidianBeetle', 'obsidianColossus',
  // Região 4 — Selva Esquecida
  'forgottenGuardian', 'junglePredator', 'ancientVine', 'feralJaguar', 'sporeling', 'forgottenColossus',
  // Região 4 — Fortaleza dos Ossos
  'boneSoldier', 'boneArcher', 'marrowGolem', 'boneCatapultBeast', 'ossuaryWraith', 'boneWarlord',
  // Região 4 — Torre dos Ecos (especial)
  'echoWraith', 'resonantSpecter', 'mirroredHorror', 'echoSentinel', 'hollowChant', 'echoSovereign',
  // Região 5 — Abismo de Gelo
  'glacialWraith', 'abyssalIceElemental', 'frostcrawler', 'iceBehemoth', 'hollowFrost', 'glacialAbyssLord',
  // Região 5 — Ruínas Vulcânicas
  'magmaGolem', 'ashWraith', 'emberBat', 'volcanicStalker', 'cinderHound', 'infernoColossus',
  // Região 5 — Covil do Dragão Ancião
  'ancientDrakeling', 'dragonCultistElder', 'scaleWyrmling', 'drakeGuardian', 'emberDrake', 'elderDragon',
  // Região 5 — Salão dos Titãs
  'titanGuardian', 'stoneColossus', 'ancientSentinel', 'runicGolem', 'titanWarden', 'fallenTitan',
  // Região 5 — Necrópole Real
  'royalWraith', 'ashenGuard', 'cursedEmbalmer', 'royalMummy', 'deathHerald', 'royalNecromancer',
  // Região 5 — Palácio Submerso
  'drownedCourtier', 'submergedGuard', 'tidalWraith', 'coralHorror', 'deepOneAcolyte', 'drownedMonarch',
  // Região 5 — Arena do Campeão (especial)
  'championGladiator', 'arenaChampionBeast', 'veteranDuelist', 'arenaWarlord', 'bloodiedChampion', 'eternalChampion',
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
// Keyed by image src + color, not just src — drawSprite used to only ever
// tint white for the hit-flash, so keying on src alone was harmless, but now
// also tints per status-effect color (see statusTintFor in DungeonPanel.tsx)
// a src-only key would silently return a stale, wrong-colored canvas the
// first time two different colors were requested for the same sprite.
const tintCache = new Map<string, HTMLCanvasElement>();
function tint(spr: Sprite, color: string): HTMLCanvasElement | null {
  const { image } = spr;
  if (!image.complete || image.naturalWidth === 0) return null;
  const key = `${image.src}::${color}`;
  const cached = tintCache.get(key);
  if (cached) return cached;
  const c = document.createElement('canvas');
  c.width = image.naturalWidth; c.height = image.naturalHeight;
  const g = c.getContext('2d')!;
  g.drawImage(image, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  tintCache.set(key, c);
  return c;
}

export function drawSprite(
  ctx: CanvasRenderingContext2D, spr: Sprite, cx: number, cy: number,
  flip: boolean, flashAlpha = 0, lean = 0, statusTint?: { color: string; alpha: number },
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
  // A persistent, low-alpha color wash over the sprite's own silhouette
  // (same source-in tint trick as the white hit-flash below, just a
  // standing wash instead of a brief pulse) — the small buff/debuff badges
  // already name exactly what's active, but a poisoned enemy that doesn't
  // visibly look poisoned is easy to miss mid-fight at a glance.
  if (statusTint) {
    const tinted = tint(spr, statusTint.color);
    if (tinted) {
      ctx.globalAlpha = statusTint.alpha;
      ctx.drawImage(tinted, Math.round(-w / 2), Math.round(-h), w, h);
      ctx.globalAlpha = 1;
    }
  }
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
