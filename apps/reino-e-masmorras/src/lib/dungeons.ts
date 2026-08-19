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
// types/game.ts): calibrated by simulating an "anchor" character — roughly
// levelReq-2, geared to what the region expects (Região 1: comum/tier-1
// gear, even missing the accessory slot; Região 2: incomum gear at the
// highest tier the anchor level can already reach) — through a full clear
// (every regular encounter + the boss) with the real combat formulas, then
// tuned per dungeon until the clear rate matched each region's target: high
// and forgiving for Região 1 (still teaching the player, beatable even
// under-geared), moderate and gear-rewarding for Região 2 (expects the
// player to have moved past comum gear by now). See CP-anchor sim notes.
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
    bossDepth: 12, boss: 'boneKing', itemTier: 1, miniBossDepths: [5, 9], difficultyMult: 0.75,
  },
  {
    id: 'goblins', name: 'Caverna dos Goblins',
    desc: 'Uma tribo de goblins fez desta caverna seu covil.',
    startDepth: 4, levelReq: 4,
    enemyPool: ['goblin', 'goblinShaman', 'goblinThrower', 'goblinFanatic', 'goblinWolfRider'],
    bossDepth: 15, boss: 'grash', itemTier: 1, miniBossDepths: [8, 12], difficultyMult: 0.6,
    unlockAfter: ['ruinas'],
  },
  {
    id: 'cripta', name: 'Cripta do Tesouro',
    desc: 'Guardada por criaturas comuns, mas rica em ouro e equipamentos.',
    startDepth: 5, levelReq: 5, special: true,
    goldMult: 2, xpMult: 0.7, dropMult: 2.5,
    enemyPool: ['zombieLooter', 'stoneGuardian', 'greedyWraith', 'wrappedMummy', 'mimicChest'],
    bossDepth: 12, boss: 'cursedCustodian', itemTier: 2, miniBossDepths: [8], difficultyMult: 0.85,
  },
  {
    id: 'pantano', name: 'Pântano Podre',
    desc: 'Água estagnada e árvores mortas escondem predadores famintos.',
    startDepth: 7, levelReq: 7,
    enemyPool: ['poisonToad', 'swampViper', 'crawlingBog', 'cursedWisp', 'rottingGator'],
    bossDepth: 18, boss: 'mudMother', itemTier: 2, miniBossDepths: [11, 15], difficultyMult: 0.65,
    unlockAfter: ['goblins'],
  },
  {
    id: 'aranhas', name: 'Covil de Aranhas',
    desc: 'Uma fenda rochosa coberta de teias — algo grande tece lá dentro.',
    startDepth: 10, levelReq: 10,
    enemyPool: ['huntingSpider', 'venomSpider', 'giantSpider', 'spiderlingSwarm', 'darkWeaver'],
    bossDepth: 21, boss: 'blackMatriarch', itemTier: 3, miniBossDepths: [14, 18], difficultyMult: 0.5,
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
    bossDepth: 23, boss: 'fallenArchmage', itemTier: 3, miniBossDepths: [16, 20], difficultyMult: 0.75,
  },
  {
    id: 'minas', name: 'Minas Abandonadas',
    desc: 'Trilhos enferrujados descem além do que os mineiros ousaram explorar.',
    startDepth: 13, levelReq: 13,
    enemyPool: ['cursedMiner', 'oreGolem', 'koboldRaider', 'batSwarm', 'gasWisp'],
    bossDepth: 24, boss: 'oreTitan', itemTier: 3, miniBossDepths: [17, 21], difficultyMult: 1.0,
    unlockAfter: ['aranhas'],
  },
  {
    id: 'floresta', name: 'Floresta Amaldiçoada',
    desc: 'Árvores retorcidas escondem olhos brilhando na escuridão.',
    startDepth: 16, levelReq: 16,
    enemyPool: ['corruptedEnt', 'ghostWolf', 'darkFairy', 'cursedBear', 'stranglingVine'],
    bossDepth: 27, boss: 'forestHeart', itemTier: 4, miniBossDepths: [20, 24], difficultyMult: 0.6,
    unlockAfter: ['minas'],
  },
  {
    id: 'covil', name: 'Covil dos Dragões',
    desc: 'Filhotes e criaturas ligadas a dragões guardam o ninho — dragões realmente antigos ainda dormem em masmorras mais distantes.',
    startDepth: 18, levelReq: 18,
    enemyPool: ['dragonHatchling', 'wildWyvern', 'scaledGuardian', 'draconicCultist', 'fireSerpent'],
    bossDepth: 29, boss: 'dragon', itemTier: 4, miniBossDepths: [22, 26], difficultyMult: 0.55,
    unlockAfter: ['floresta'],
  },
  {
    id: 'necropole', name: 'Necrópole Esquecida',
    desc: 'Um cemitério em ruínas onde os mortos não descansam.',
    startDepth: 18, levelReq: 18,
    enemyPool: ['darkReaper', 'deathCrow', 'boneExecutioner', 'wailingGhost', 'graveWorm'],
    bossDepth: 29, boss: 'skeletonLord', itemTier: 4, miniBossDepths: [22, 26], difficultyMult: 0.7,
    unlockAfter: ['floresta'],
  },
  {
    id: 'elficas', name: 'Ruínas Élficas',
    desc: 'Colunas élficas cobertas de vinhas, tomadas por criaturas selvagens.',
    startDepth: 20, levelReq: 20,
    enemyPool: ['corruptedGuardian', 'whisperingVine', 'ruinBeast', 'elvenWraith', 'crystalGolem'],
    bossDepth: 31, boss: 'ancestralGuardian', itemTier: 5, miniBossDepths: [24, 28], difficultyMult: 0.55,
    unlockAfter: ['covil', 'necropole'],
  },
  {
    id: 'arena', name: 'Arena de Sangue',
    desc: 'Um gauntlet de combate contínuo — arriscado, mas generoso em espólios.',
    startDepth: 20, levelReq: 20, special: true,
    enemyPool: ['cursedGladiator', 'arenaBeast', 'maskedExecutioner', 'beastTamer', 'fallenChampion'],
    dmgTakenMult: 1.2, dropMult: 1.8,
    bossDepth: 34, boss: 'grandChampion', itemTier: 5, miniBossDepths: [26, 30], difficultyMult: 0.55,
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
