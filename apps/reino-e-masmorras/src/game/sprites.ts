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
import crystalGolemUrl from '../assets/sprites/crystalGolem.webp';
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
// relative size in the fiction. Rebalanced after feedback that everything
// read too close to the hero's own 165px: bosses now sit well above hero
// height across the board (210-290, climbing with region tier) so every
// boss actually reads as a real threat, not just a reskinned regular; any
// human-scale or bigger humanoid (knights, orcs, cultists, guardians,
// executioners...) sits at or above hero height instead of shrunken next
// to it; and only genuinely small-in-the-fiction creatures (goblins, bats,
// snakes, insects, wisps, swarms) stay meaningfully smaller.
const HERO_DISPLAY_H = 165;
const ENEMY_DISPLAY_H: Record<EnemyShape, number> = {
  goblin: 115, wolf: 110, skeleton: 150,
  // Dragão Jovem is now Covil dos Dragões' own boss (see lib/enemies.ts).
  dragon: 225,

  // Região 1 — Ruínas Superficiais
  ruinBat: 85, acidSlime: 85, ruinBandit: 172, carrionCrow: 85, boneKing: 212,
  // Região 1 — Caverna dos Goblins
  goblinShaman: 108, goblinThrower: 108, goblinFanatic: 108, goblinWolfRider: 132, grash: 216,
  // Região 1 — Cripta do Tesouro
  zombieLooter: 172, stoneGuardian: 198, greedyWraith: 160, wrappedMummy: 172, mimicChest: 100, cursedCustodian: 212,
  // Região 1 — Pântano Podre
  poisonToad: 85, swampViper: 80, crawlingBog: 100, cursedWisp: 75, rottingGator: 142, mudMother: 222,
  // Região 1 — Covil de Aranhas
  huntingSpider: 115, venomSpider: 112, giantSpider: 168, spiderlingSwarm: 80, darkWeaver: 158, blackMatriarch: 226,

  // Região 2 — Torre Amaldiçoada
  gargoyle: 168, spectralMage: 170, cursedKnight: 180, watchingEye: 85, crawlingShadow: 112, fallenArchmage: 226,
  // Região 2 — Minas Abandonadas
  cursedMiner: 172, oreGolem: 198, koboldRaider: 100, batSwarm: 80, gasWisp: 80, oreTitan: 222,
  // Região 2 — Floresta Amaldiçoada
  corruptedEnt: 212, ghostWolf: 112, darkFairy: 75, cursedBear: 168, stranglingVine: 122, forestHeart: 228,
  // Região 2 — Covil dos Dragões (dragon acima é o chefe)
  dragonHatchling: 142, wildWyvern: 178, scaledGuardian: 178, draconicCultist: 172, fireSerpent: 112,
  // Região 2 — Necrópole Esquecida
  darkReaper: 178, deathCrow: 85, boneExecutioner: 182, wailingGhost: 162, graveWorm: 85, skeletonLord: 216,
  // Região 2 — Ruínas Élficas
  corruptedGuardian: 178, whisperingVine: 122, ruinBeast: 152, elvenWraith: 168, crystalGolem: 202, ancestralGuardian: 230,
  // Região 2 — Arena de Sangue
  cursedGladiator: 178, arenaBeast: 158, maskedExecutioner: 180, beastTamer: 172, fallenChampion: 184, grandChampion: 234,

  // Alvos de Caçada (lib/hunts.ts) — maiores ainda, para reforçar visualmente
  // que são o desafio mais duro disponível fora das regiões.
  boneTyrant: 236, swampLeviathan: 246, infernalWyrm: 242,

  // Região 3 — Fortaleza Orc
  orcWarrior: 182, orcArcher: 178, orcShaman: 176, orcBerserker: 186, orcStandardBearer: 188, orcWarchief: 238,
  // Região 3 — Labirinto de Gelo
  iceElemental: 178, frostWolf: 112, glacialBat: 80, iceWraith: 162, frozenSentinel: 198, iceMonarch: 244,
  // Região 3 — Templo Afundado
  drownedAcolyte: 170, frozenPriest: 170, lakeWraith: 162, submergedGuardian: 198, iceEel: 95, sunkenHighPriest: 246,
  // Região 3 — Cavernas de Cristal
  crystalBat: 80, crystalSpider: 122, prismGolem: 202, crystalWisp: 75, glimmeringStalker: 132, crystalSovereign: 246,
  // Região 3 — Covil do Lobo Alfa
  alphaWolfPup: 95, direWolf: 132, snowStalker: 118, packHunter: 122, frostFangWolf: 128, alphaDireWolf: 242,
  // Região 3 — Catacumbas Reais
  royalSkeleton: 170, cryptSentinel: 198, boneNoble: 166, spectralChamberlain: 162, entombedKnight: 182, royalLich: 252,
  // Região 3 — Poço sem Fundo (especial)
  wellCrawler: 132, voidTendril: 112, drowningWraith: 162, abyssalStalker: 136, hollowDweller: 162, pitDweller: 258,

  // Região 4 — Covil da Aranha-Rainha
  jungleSpider: 122, silkStalker: 132, spiderBrood: 85, webWeaverJungle: 158, venomousBroodling: 95, spiderQueen: 252,
  // Região 4 — Cidadela em Ruínas
  ruinedSentinel: 198, vineWarrior: 172, crumblingGolem: 202, junglePhantom: 162, overgrownGuardian: 202, citadelGuardian: 260,
  // Região 4 — Santuário Profanado
  defiledPriest: 170, profaneIdol: 188, corruptedAcolyte: 170, hexedStatue: 188, ritualCultist: 170, profaneHighPriest: 260,
  // Região 4 — Mina de Obsidiana
  obsidianGolem: 202, magmaBat: 80, obsidianMiner: 170, emberWraith: 162, obsidianBeetle: 100, obsidianColossus: 264,
  // Região 4 — Selva Esquecida
  forgottenGuardian: 198, junglePredator: 128, ancientVine: 128, feralJaguar: 132, sporeling: 85, forgottenColossus: 264,
  // Região 4 — Fortaleza dos Ossos
  boneSoldier: 166, boneArcher: 166, marrowGolem: 202, boneCatapultBeast: 198, ossuaryWraith: 162, boneWarlord: 264,
  // Região 4 — Torre dos Ecos (especial)
  echoWraith: 162, resonantSpecter: 162, mirroredHorror: 168, echoSentinel: 198, hollowChant: 132, echoSovereign: 268,

  // Região 5 — Abismo de Gelo
  glacialWraith: 162, abyssalIceElemental: 182, frostcrawler: 132, iceBehemoth: 218, hollowFrost: 162, glacialAbyssLord: 272,
  // Região 5 — Ruínas Vulcânicas
  magmaGolem: 202, ashWraith: 162, emberBat: 80, volcanicStalker: 128, cinderHound: 116, infernoColossus: 274,
  // Região 5 — Covil do Dragão Ancião
  ancientDrakeling: 142, dragonCultistElder: 170, scaleWyrmling: 148, drakeGuardian: 192, emberDrake: 178, elderDragon: 278,
  // Região 5 — Salão dos Titãs
  titanGuardian: 218, stoneColossus: 218, ancientSentinel: 198, runicGolem: 202, titanWarden: 218, fallenTitan: 280,
  // Região 5 — Necrópole Real
  royalWraith: 162, ashenGuard: 178, cursedEmbalmer: 170, royalMummy: 172, deathHerald: 182, royalNecromancer: 278,
  // Região 5 — Palácio Submerso
  drownedCourtier: 170, submergedGuard: 178, tidalWraith: 162, coralHorror: 152, deepOneAcolyte: 170, drownedMonarch: 280,
  // Região 5 — Arena do Campeão (especial)
  championGladiator: 180, arenaChampionBeast: 178, veteranDuelist: 180, arenaWarlord: 180, bloodiedChampion: 184, eternalChampion: 292,
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
  // Região 2 — Ruínas Élficas
  corruptedGuardian: corruptedGuardianUrl, whisperingVine: whisperingVineUrl, ruinBeast: ruinBeastUrl, elvenWraith: elvenWraithUrl, crystalGolem: crystalGolemUrl, ancestralGuardian: ancestralGuardianUrl,
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
