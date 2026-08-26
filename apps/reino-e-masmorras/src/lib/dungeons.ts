import { Character, DungeonDef } from '../types/game';

// The full roster is planned across 7 level-bracket "regions" shown on the
// Dungeon Map (see lib/dungeonMap.ts) — only Região 1 (Iniciante, nível
// 1-10) and Região 2 (Aprendiz, nível 11-20) have art and dungeons defined
// so far; regions 3-7 are reserved for future updates. startDepth matches
// levelReq for every new dungeon, keeping the "how far in you start"
// difficulty in step with "what level you need to enter". Every dungeon
// ends at its own bossDepth — reaching it and defeating the boss clears the
// run (see DungeonPanel). Every one of the 12 dungeons across Região 1 and
// Região 2 has its own bespoke 5-shape roster + a unique boss (see
// lib/enemies.ts) — no dungeon reuses another's enemies, so each one's
// roster actually matches its own theme (a mine has miners and golems, not
// generic trolls). Covil dos Dragões is the one deliberate exception on the
// boss side: its boss is "Dragão Jovem", the same young-dragon shape used
// nowhere else — full-grown/ancient/legendary dragon bosses are saved for
// dungeons in regions 3-7, so this theme has somewhere stronger to escalate
// to later instead of being spent this early. itemTier
// (1-10, see lib/itemTiers.ts) is hand-authored per dungeon exactly like
// bossDepth/boss — every item found inside always rolls at that tier,
// regardless of in-run depth, so item power tracks dungeon progression
// rather than the floor counter. Tiers 6-10 are reserved for regions 3-7.
// difficultyMult below is the CP-anchor knob (see DungeonDef in
// types/game.ts). 2026 rebalance, take three: the first two passes both
// tried to DERIVE this curve from simulation against an anchor character —
// take one anchored too weak (levelReq-2, gear a tier behind), take two
// fixed the anchor but still let simulation alone pick the numbers. The
// game still played easy both times. This pass instead follows an explicit,
// monotonically-increasing curve specified directly (D1=1.00 ... D12=2.65,
// a flat +0.15 per dungeon, never decreasing) —
// simulation's job here is verification, not derivation: confirm the curve
// produces the intended shape (mobs farmable but dangerous, boss a real
// wall) and flag anything so far off that it needs a small correction, not
// pick the base numbers from scratch again. D1-D12 map to the 12 dungeons
// below in ascending level order (ruinas..arena). Layered on top of the
// REGULAR_/BOSS_*_MULT global constants in lib/enemies.ts (also raised this
// pass) rather than replacing them — the per-dungeon curve and the global
// mob/boss toughness are two independent knobs that both needed raising.
// unlockAfter chains the non-special dungeons into a single mainline —
// grinding the very first dungeon over and over used to be the only way to
// reach the level a later one required, which got old fast. A dungeon with
// no unlockAfter and no `special` (only Ruínas Superficiais) is always
// open; every other non-special one opens once ANY of its unlockAfter ids
// is in Character.clearedDungeons. `special` dungeons (Cripta, Torre,
// Arena) are the stated exception — bonus/side content, not the path a
// player has to walk in order, so they keep the old levelReq gate instead
// (see isDungeonUnlocked below).
export const DUNGEONS: DungeonDef[] = [
  // ── Região 1 — Iniciante (nível 1-10) — o "aprendizado do mercador":
  // frouxo de propósito, sobrevivível mesmo com equipamento fraco/incompleto ──
  {
    id: 'ruinas', name: 'Ruínas Superficiais',
    desc: 'Criaturas fracas perto da entrada da masmorra. Boa para começar.',
    startDepth: 1, levelReq: 1,
    enemyPool: ['skeleton', 'ruinBat', 'acidSlime', 'ruinBandit', 'carrionCrow'],
    bossDepth: 12, boss: 'boneKing', itemTier: 1, miniBossDepths: [5, 9], difficultyMult: 1.0,
  },
  {
    id: 'goblins', name: 'Caverna dos Goblins',
    desc: 'Uma tribo de goblins fez desta caverna seu covil.',
    startDepth: 4, levelReq: 4,
    enemyPool: ['goblin', 'goblinShaman', 'goblinThrower', 'goblinFanatic', 'goblinWolfRider'],
    bossDepth: 15, boss: 'grash', itemTier: 1, miniBossDepths: [8, 12], difficultyMult: 1.15,
    unlockAfter: ['ruinas'],
  },
  {
    id: 'cripta', name: 'Cripta do Tesouro',
    desc: 'Guardada por criaturas comuns, mas rica em equipamentos.',
    startDepth: 5, levelReq: 5, special: true,
    // goldMult cut from 2 (double gold) to a token 1.05 per direct user
    // feedback — gold is meant to be scarce game-wide now (see
    // GOLD_YIELD_MULT in lib/enemies.ts), so a dungeon doubling it
    // undermined that on its own. dropMult (better loot, not more gold) is
    // this dungeon's real identity now.
    goldMult: 1.05, xpMult: 0.7, dropMult: 2.5,
    enemyPool: ['zombieLooter', 'stoneGuardian', 'greedyWraith', 'wrappedMummy', 'mimicChest'],
    bossDepth: 12, boss: 'cursedCustodian', itemTier: 1, miniBossDepths: [8], difficultyMult: 1.3,
  },
  {
    id: 'pantano', name: 'Pântano Podre',
    desc: 'Água estagnada e árvores mortas escondem predadores famintos.',
    startDepth: 7, levelReq: 7,
    enemyPool: ['poisonToad', 'swampViper', 'crawlingBog', 'cursedWisp', 'rottingGator'],
    bossDepth: 18, boss: 'mudMother', itemTier: 1, miniBossDepths: [11, 15], difficultyMult: 1.45,
    unlockAfter: ['goblins'],
  },
  {
    id: 'aranhas', name: 'Covil de Aranhas',
    desc: 'Uma fenda rochosa coberta de teias — algo grande tece lá dentro.',
    startDepth: 10, levelReq: 10,
    enemyPool: ['huntingSpider', 'venomSpider', 'giantSpider', 'spiderlingSwarm', 'darkWeaver'],
    bossDepth: 21, boss: 'blackMatriarch', itemTier: 2, miniBossDepths: [14, 18], difficultyMult: 1.6,
    unlockAfter: ['pantano'],
  },

  // ── Região 2 — Aprendiz (nível 11-20) — mais exigente: já espera o
  // jogador fora de itens comuns, mas ainda não no topo da qualidade ──
  {
    id: 'torre', name: 'Torre Amaldiçoada',
    desc: 'Guardiões de pedra e horrores arcanos vigiam suas escadarias. Perigosa, mas generosa em experiência.',
    startDepth: 12, levelReq: 12, special: true,
    enemyPool: ['gargoyle', 'spectralMage', 'cursedKnight', 'watchingEye', 'crawlingShadow'],
    xpMult: 1.6, dmgTakenMult: 1.25, dropMult: 1.5,
    bossDepth: 23, boss: 'fallenArchmage', itemTier: 2, miniBossDepths: [16, 20], difficultyMult: 1.75,
  },
  {
    id: 'minas', name: 'Minas Abandonadas',
    desc: 'Trilhos enferrujados descem além do que os mineiros ousaram explorar.',
    startDepth: 13, levelReq: 13,
    enemyPool: ['cursedMiner', 'oreGolem', 'koboldRaider', 'batSwarm', 'gasWisp'],
    bossDepth: 24, boss: 'oreTitan', itemTier: 2, miniBossDepths: [17, 21], difficultyMult: 1.9,
    unlockAfter: ['aranhas'],
  },
  {
    id: 'floresta', name: 'Floresta Amaldiçoada',
    desc: 'Árvores retorcidas escondem olhos brilhando na escuridão.',
    startDepth: 16, levelReq: 16,
    enemyPool: ['corruptedEnt', 'ghostWolf', 'darkFairy', 'cursedBear', 'stranglingVine'],
    bossDepth: 27, boss: 'forestHeart', itemTier: 2, miniBossDepths: [20, 24], difficultyMult: 2.05,
    unlockAfter: ['minas'],
  },
  {
    id: 'covil', name: 'Covil dos Dragões',
    desc: 'Filhotes e criaturas ligadas a dragões guardam o ninho — dragões realmente antigos ainda dormem em masmorras mais distantes.',
    startDepth: 18, levelReq: 18,
    enemyPool: ['dragonHatchling', 'wildWyvern', 'scaledGuardian', 'draconicCultist', 'fireSerpent'],
    bossDepth: 29, boss: 'dragon', itemTier: 2, miniBossDepths: [22, 26], difficultyMult: 2.2,
    unlockAfter: ['floresta'],
  },
  {
    id: 'necropole', name: 'Necrópole Esquecida',
    desc: 'Um cemitério em ruínas onde os mortos não descansam.',
    startDepth: 18, levelReq: 18,
    enemyPool: ['darkReaper', 'deathCrow', 'boneExecutioner', 'wailingGhost', 'graveWorm'],
    bossDepth: 29, boss: 'skeletonLord', itemTier: 2, miniBossDepths: [22, 26], difficultyMult: 2.35,
    unlockAfter: ['floresta'],
  },
  {
    id: 'elficas', name: 'Ruínas Élficas',
    desc: 'Colunas élficas cobertas de vinhas, tomadas por criaturas selvagens.',
    startDepth: 20, levelReq: 20,
    enemyPool: ['corruptedGuardian', 'whisperingVine', 'ruinBeast', 'elvenWraith', 'crystalGolem'],
    bossDepth: 31, boss: 'ancestralGuardian', itemTier: 3, miniBossDepths: [24, 28], difficultyMult: 2.5,
    unlockAfter: ['covil', 'necropole'],
  },
  {
    id: 'arena', name: 'Arena de Sangue',
    desc: 'Um gauntlet de combate contínuo — arriscado, mas generoso em espólios.',
    startDepth: 20, levelReq: 20, special: true,
    enemyPool: ['cursedGladiator', 'arenaBeast', 'maskedExecutioner', 'beastTamer', 'fallenChampion'],
    dmgTakenMult: 1.2, dropMult: 1.8,
    bossDepth: 34, boss: 'grandChampion', itemTier: 3, miniBossDepths: [26, 30], difficultyMult: 2.65,
  },

  // ── Região 3 — Thurgard (nível 21-30) — os nomes/temas das 7 masmorras
  // abaixo (incl. o par de fork Templo Afundado/Cavernas de Cristal e a
  // masmorra especial Poço sem Fundo) vêm diretamente do prompt de arte do
  // mapa dessa região em KIT-DE-ARTE.md, não foram inventados aqui. A partir
  // desta região o design da masmorra "especial" muda: ela NÃO faz parte da
  // cadeia obrigatória de unlockAfter (Catacumbas Reais, a penúltima
  // masmorra regular na ordem do mapa, já libera a Região 4 sozinha) — em
  // vez disso ela é conteúdo opcional/side-content ao qual o jogador volta
  // depois, gated apenas por levelReq (mesmo mecanismo de isDungeonUnlocked
  // já usado por Cripta/Torre/Arena), estruturada como majoritariamente
  // minibosses via uma densidade bem maior de miniBossDepths (poucos ou
  // nenhum trash mob "puro" entre eles) culminando num chefe final
  // desproporcionalmente mais forte que o de qualquer masmorra regular da
  // região. difficultyMult continua a progressão linear de +0.15 por
  // masmorra herdada de Região 1-2 (arena=2.65); itemTier 6-7, já que Tiers
  // 6-10 são reservados para as regiões 3-7 (ver lib/itemTiers.ts).
  {
    id: 'fortalezaOrc', name: 'Fortaleza Orc',
    desc: 'Um acampamento de guerra orc fortificado nas montanhas nevadas.',
    startDepth: 21, levelReq: 21,
    enemyPool: ['orcWarrior', 'orcArcher', 'orcShaman', 'orcBerserker', 'orcStandardBearer'],
    bossDepth: 32, boss: 'orcWarchief', itemTier: 3, miniBossDepths: [25, 29], difficultyMult: 2.80,
    unlockAfter: ['elficas'],
  },
  {
    id: 'labirintoGelo', name: 'Labirinto de Gelo',
    desc: 'Corredores de gelo translúcido que confundem qualquer sentido de direção.',
    startDepth: 23, levelReq: 23,
    enemyPool: ['iceElemental', 'frostWolf', 'glacialBat', 'iceWraith', 'frozenSentinel'],
    bossDepth: 34, boss: 'iceMonarch', itemTier: 3, miniBossDepths: [27, 31], difficultyMult: 2.95,
    unlockAfter: ['fortalezaOrc'],
  },
  {
    id: 'temploAfundado', name: 'Templo Afundado',
    desc: 'Um templo meio submerso num lago congelado — águas antigas guardam segredos.',
    startDepth: 25, levelReq: 25,
    enemyPool: ['drownedAcolyte', 'frozenPriest', 'lakeWraith', 'submergedGuardian', 'iceEel'],
    bossDepth: 36, boss: 'sunkenHighPriest', itemTier: 3, miniBossDepths: [29, 33], difficultyMult: 3.10,
    unlockAfter: ['labirintoGelo'],
  },
  {
    id: 'cavernasCristal', name: 'Cavernas de Cristal',
    desc: 'Cavernas brilhando com cristais azulados — beleza que esconde perigo.',
    startDepth: 25, levelReq: 25,
    enemyPool: ['crystalBat', 'crystalSpider', 'prismGolem', 'crystalWisp', 'glimmeringStalker'],
    bossDepth: 36, boss: 'crystalSovereign', itemTier: 3, miniBossDepths: [29, 33], difficultyMult: 3.25,
    unlockAfter: ['labirintoGelo'],
  },
  {
    id: 'covilLoboAlfa', name: 'Covil do Lobo Alfa',
    desc: 'Um covil entre rochas — enormes pegadas na neve revelam algo maior por perto.',
    startDepth: 27, levelReq: 27,
    enemyPool: ['alphaWolfPup', 'direWolf', 'snowStalker', 'packHunter', 'frostFangWolf'],
    bossDepth: 38, boss: 'alphaDireWolf', itemTier: 3, miniBossDepths: [31, 35], difficultyMult: 3.40,
    unlockAfter: ['temploAfundado', 'cavernasCristal'],
  },
  {
    id: 'catacumbasReais', name: 'Catacumbas Reais',
    desc: 'Escadas de pedra descem sob um túmulo real esquecido pelo tempo.',
    startDepth: 29, levelReq: 29,
    enemyPool: ['royalSkeleton', 'cryptSentinel', 'boneNoble', 'spectralChamberlain', 'entombedKnight'],
    bossDepth: 40, boss: 'royalLich', itemTier: 4, miniBossDepths: [33, 37], difficultyMult: 3.55,
    unlockAfter: ['covilLoboAlfa'],
  },
  {
    id: 'pocoSemFundo', name: 'Poço sem Fundo',
    desc: 'Um poço de pedra com uma corrente balançando na escuridão — conteúdo opcional muito perigoso, para quando estiver pronto para voltar.',
    startDepth: 30, levelReq: 30, special: true,
    dmgTakenMult: 1.3, dropMult: 2.0, xpMult: 1.4,
    enemyPool: ['wellCrawler', 'voidTendril', 'drowningWraith', 'abyssalStalker', 'hollowDweller'],
    bossDepth: 42, boss: 'pitDweller', itemTier: 4, miniBossDepths: [32, 34, 36, 38, 40], difficultyMult: 3.70,
  },

  // ── Região 4 — Xilvana (nível 31-40) — mesma convenção: nomes/temas vêm
  // do prompt de mapa em KIT-DE-ARTE.md, Fortaleza dos Ossos (penúltima
  // regular) já libera a Região 5 sozinha, Torre dos Ecos é especial/opcional. ──
  {
    id: 'covilAranhaRainha', name: 'Covil da Aranha-Rainha',
    desc: 'Uma teia gigante cobre a gruta — algo enorme tece nas sombras.',
    startDepth: 31, levelReq: 31,
    enemyPool: ['jungleSpider', 'silkStalker', 'spiderBrood', 'webWeaverJungle', 'venomousBroodling'],
    bossDepth: 42, boss: 'spiderQueen', itemTier: 4, miniBossDepths: [35, 39], difficultyMult: 3.85,
    unlockAfter: ['catacumbasReais'],
  },
  {
    id: 'cidadelaRuinas', name: 'Cidadela em Ruínas',
    desc: 'Muralhas em ruínas tomadas por vinhas — a selva reivindica o que sobrou.',
    startDepth: 33, levelReq: 33,
    enemyPool: ['ruinedSentinel', 'vineWarrior', 'crumblingGolem', 'junglePhantom', 'overgrownGuardian'],
    bossDepth: 44, boss: 'citadelGuardian', itemTier: 4, miniBossDepths: [37, 41], difficultyMult: 4.00,
    unlockAfter: ['covilAranhaRainha'],
  },
  {
    id: 'santuarioProfanado', name: 'Santuário Profanado',
    desc: 'Um altar quebrado com símbolos desfigurados — algo profano ainda ronda o local.',
    startDepth: 35, levelReq: 35,
    enemyPool: ['defiledPriest', 'profaneIdol', 'corruptedAcolyte', 'hexedStatue', 'ritualCultist'],
    bossDepth: 46, boss: 'profaneHighPriest', itemTier: 4, miniBossDepths: [39, 43], difficultyMult: 4.15,
    unlockAfter: ['cidadelaRuinas'],
  },
  {
    id: 'minaObsidiana', name: 'Mina de Obsidiana',
    desc: 'Rocha vulcânica brilhante escavada nas profundezas da selva.',
    startDepth: 35, levelReq: 35,
    enemyPool: ['obsidianGolem', 'magmaBat', 'obsidianMiner', 'emberWraith', 'obsidianBeetle'],
    bossDepth: 46, boss: 'obsidianColossus', itemTier: 4, miniBossDepths: [39, 43], difficultyMult: 4.30,
    unlockAfter: ['cidadelaRuinas'],
  },
  {
    id: 'selvaEsquecida', name: 'Selva Esquecida',
    desc: 'Estátuas de pedra engolidas por raízes gigantes — ninguém vem aqui há eras.',
    startDepth: 37, levelReq: 37,
    enemyPool: ['forgottenGuardian', 'junglePredator', 'ancientVine', 'feralJaguar', 'sporeling'],
    bossDepth: 48, boss: 'forgottenColossus', itemTier: 4, miniBossDepths: [41, 45], difficultyMult: 4.45,
    unlockAfter: ['santuarioProfanado', 'minaObsidiana'],
  },
  {
    id: 'fortalezaOssos', name: 'Fortaleza dos Ossos',
    desc: 'Uma muralha erguida com ossos empilhados — construída por algo que não teme a morte.',
    startDepth: 39, levelReq: 39,
    enemyPool: ['boneSoldier', 'boneArcher', 'marrowGolem', 'boneCatapultBeast', 'ossuaryWraith'],
    bossDepth: 50, boss: 'boneWarlord', itemTier: 4, miniBossDepths: [43, 47], difficultyMult: 4.60,
    unlockAfter: ['selvaEsquecida'],
  },
  {
    id: 'torreDosEcos', name: 'Torre dos Ecos',
    desc: 'Uma torre esguia onde a luz ecoa nas runas — conteúdo opcional muito perigoso, para quando estiver pronto para voltar.',
    startDepth: 40, levelReq: 40, special: true,
    dmgTakenMult: 1.3, dropMult: 2.0, xpMult: 1.4,
    enemyPool: ['echoWraith', 'resonantSpecter', 'mirroredHorror', 'echoSentinel', 'hollowChant'],
    bossDepth: 52, boss: 'echoSovereign', itemTier: 5, miniBossDepths: [42, 44, 46, 48, 50], difficultyMult: 4.75,
  },

  // ── Região 5 — Ignares (nível 41-50) — mesma convenção: nomes/temas vêm
  // do prompt de mapa em KIT-DE-ARTE.md, Palácio Submerso (penúltima
  // regular) já libera a Região 6 sozinha, Arena do Campeão é especial/opcional. ──
  {
    id: 'abismoGelo', name: 'Abismo de Gelo',
    desc: 'Uma fenda glacial profunda exala uma névoa fria constante.',
    startDepth: 41, levelReq: 41,
    enemyPool: ['glacialWraith', 'abyssalIceElemental', 'frostcrawler', 'iceBehemoth', 'hollowFrost'],
    bossDepth: 52, boss: 'glacialAbyssLord', itemTier: 5, miniBossDepths: [45, 49], difficultyMult: 4.90,
    unlockAfter: ['fortalezaOssos', 'torreDosEcos'],
  },
  {
    id: 'ruinasVulcanicas', name: 'Ruínas Vulcânicas',
    desc: 'Colunas de pedra rachadas pelo calor de rios de lava próximos.',
    startDepth: 43, levelReq: 43,
    enemyPool: ['magmaGolem', 'ashWraith', 'emberBat', 'volcanicStalker', 'cinderHound'],
    bossDepth: 54, boss: 'infernoColossus', itemTier: 5, miniBossDepths: [47, 51], difficultyMult: 5.05,
    unlockAfter: ['abismoGelo'],
  },
  {
    id: 'covilDragaoAnciao', name: 'Covil do Dragão Ancião',
    desc: 'Marcas de garras gigantes cobrem a rocha — algo muito antigo dorme aqui.',
    startDepth: 45, levelReq: 45,
    enemyPool: ['ancientDrakeling', 'dragonCultistElder', 'scaleWyrmling', 'drakeGuardian', 'emberDrake'],
    bossDepth: 56, boss: 'elderDragon', itemTier: 5, miniBossDepths: [49, 53], difficultyMult: 5.20,
    unlockAfter: ['ruinasVulcanicas'],
  },
  {
    id: 'salaoTitas', name: 'Salão dos Titãs',
    desc: 'Um portal de pedra colossal guarda um salão além da compreensão humana.',
    startDepth: 45, levelReq: 45,
    enemyPool: ['titanGuardian', 'stoneColossus', 'ancientSentinel', 'runicGolem', 'titanWarden'],
    bossDepth: 56, boss: 'fallenTitan', itemTier: 5, miniBossDepths: [49, 53], difficultyMult: 5.35,
    unlockAfter: ['ruinasVulcanicas'],
  },
  {
    id: 'necropoleReal', name: 'Necrópole Real',
    desc: 'Um mausoléu dourado meio soterrado em cinzas vulcânicas.',
    startDepth: 47, levelReq: 47,
    enemyPool: ['royalWraith', 'ashenGuard', 'cursedEmbalmer', 'royalMummy', 'deathHerald'],
    bossDepth: 58, boss: 'royalNecromancer', itemTier: 5, miniBossDepths: [51, 55], difficultyMult: 5.50,
    unlockAfter: ['covilDragaoAnciao', 'salaoTitas'],
  },
  {
    id: 'palacioSubmerso', name: 'Palácio Submerso',
    desc: 'Uma cúpula de pedra afundando lentamente em águas escuras.',
    startDepth: 49, levelReq: 49,
    enemyPool: ['drownedCourtier', 'submergedGuard', 'tidalWraith', 'coralHorror', 'deepOneAcolyte'],
    bossDepth: 60, boss: 'drownedMonarch', itemTier: 5, miniBossDepths: [53, 57], difficultyMult: 5.65,
    unlockAfter: ['necropoleReal'],
  },
  {
    id: 'arenaCampeao', name: 'Arena do Campeão',
    desc: 'Uma arena erguida com bandeirolas rasgadas — conteúdo opcional muito perigoso, para quando estiver pronto para voltar.',
    startDepth: 50, levelReq: 50, special: true,
    dmgTakenMult: 1.3, dropMult: 2.0, xpMult: 1.4,
    enemyPool: ['championGladiator', 'arenaChampionBeast', 'veteranDuelist', 'arenaWarlord', 'bloodiedChampion'],
    bossDepth: 62, boss: 'eternalChampion', itemTier: 6, miniBossDepths: [52, 54, 56, 58, 60], difficultyMult: 5.80,
  },
];

// Single source of truth for whether `character` can walk into `dungeon` —
// used both by the map (DungeonMap.tsx) and by the Mercador's stock scaling
// below, so the two can never drift apart on what's actually reachable.
export function isDungeonUnlocked(dungeon: DungeonDef, character: Pick<Character, 'level' | 'clearedDungeons'>): boolean {
  if (dungeon.special) return character.level >= dungeon.levelReq;
  if (!dungeon.unlockAfter || dungeon.unlockAfter.length === 0) return true;
  return dungeon.unlockAfter.some((id) => character.clearedDungeons?.includes(id));
}

// The Mercador sells items scaled to the toughest dungeon the player could
// currently walk into, replacing the old bestDepth-based scaling — a
// lifetime "deepest floor ever reached" no longer means anything now that
// item tier tracks dungeon progression, not depth.
export function highestAccessibleItemTier(character: Pick<Character, 'level' | 'clearedDungeons'>): number {
  const reachable = DUNGEONS.filter((d) => isDungeonUnlocked(d, character)).map((d) => d.itemTier);
  return reachable.length > 0 ? Math.max(...reachable) : 1;
}

// A dungeon's position (0-1) on the rarity-roll curve (see lib/equipment.ts's
// pickRarityForTier/pickBossDropRarity) — derived from difficultyMult
// instead of itemTier. itemTier only has 10 rungs for 30+ dungeons (several
// dungeons share the same one today), which meant every dungeon in a shared
// rung rolled identical rarity odds and the easiest of them was always the
// optimal farm. difficultyMult is unique per dungeon and strictly
// increasing by design (see its own comment in DUNGEONS above), so this
// gives every dungeon its own distinct spot on the curve — min/max are
// computed from DUNGEONS itself, so this keeps working with no changes
// needed once Regiões 6-7 add more dungeons on top.
const DIFFICULTY_MULTS = DUNGEONS.map((d) => d.difficultyMult ?? 1);
const MIN_DIFFICULTY_MULT = Math.min(...DIFFICULTY_MULTS);
const MAX_DIFFICULTY_MULT = Math.max(...DIFFICULTY_MULTS);
export function difficultyProgress(dungeon: DungeonDef): number {
  const range = MAX_DIFFICULTY_MULT - MIN_DIFFICULTY_MULT;
  if (range <= 0) return 0;
  return ((dungeon.difficultyMult ?? 1) - MIN_DIFFICULTY_MULT) / range;
}
