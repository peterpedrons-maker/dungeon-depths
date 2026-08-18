import { DungeonDef } from '../types/game';

// The full roster is planned across 7 level-bracket "regions" shown on the
// Dungeon Map (see lib/dungeonMap.ts) — only Região 1 (Iniciante, nível
// 1-10) and Região 2 (Aprendiz, nível 11-20) have art and dungeons defined
// so far; regions 3-7 are reserved for future updates. startDepth matches
// levelReq for every new dungeon, keeping the "how far in you start"
// difficulty in step with "what level you need to enter". Every dungeon
// ends at its own bossDepth — reaching it and defeating the boss clears the
// run (see DungeonPanel). Região 1's five dungeons each have a bespoke
// 5-shape roster + a unique boss; Região 2's dungeons keep their original
// generic pool and use a boosted "elder/warlord"-style boss built from
// their own strongest shape until they get a bespoke roster too. itemTier
// (1-10, see lib/itemTiers.ts) is hand-authored per dungeon exactly like
// bossDepth/boss — every item found inside always rolls at that tier,
// regardless of in-run depth, so item power tracks dungeon progression
// rather than the floor counter. Tiers 6-10 are reserved for regions 3-7.
export const DUNGEONS: DungeonDef[] = [
  // ── Região 1 — Iniciante (nível 1-10) ──
  {
    id: 'ruinas', name: 'Ruínas Superficiais',
    desc: 'Criaturas fracas perto da entrada da masmorra. Boa para começar.',
    startDepth: 1, levelReq: 1,
    enemyPool: ['skeleton', 'ruinBat', 'acidSlime', 'ruinBandit', 'carrionCrow'],
    bossDepth: 12, boss: 'boneKing', itemTier: 1, miniBossDepths: [5, 9],
  },
  {
    id: 'goblins', name: 'Caverna dos Goblins',
    desc: 'Uma tribo de goblins fez desta caverna seu covil.',
    startDepth: 4, levelReq: 4,
    enemyPool: ['goblin', 'goblinShaman', 'goblinThrower', 'goblinFanatic', 'goblinWolfRider'],
    bossDepth: 15, boss: 'grash', itemTier: 1, miniBossDepths: [8, 12],
  },
  {
    id: 'cripta', name: 'Cripta do Tesouro',
    desc: 'Guardada por criaturas comuns, mas rica em ouro e equipamentos.',
    startDepth: 5, levelReq: 5, special: true,
    goldMult: 2, xpMult: 0.7, dropMult: 2.5,
    enemyPool: ['zombieLooter', 'stoneGuardian', 'greedyWraith', 'wrappedMummy', 'mimicChest'],
    bossDepth: 12, boss: 'cursedCustodian', itemTier: 2, miniBossDepths: [8],
  },
  {
    id: 'pantano', name: 'Pântano Podre',
    desc: 'Água estagnada e árvores mortas escondem predadores famintos.',
    startDepth: 7, levelReq: 7,
    enemyPool: ['poisonToad', 'swampViper', 'crawlingBog', 'cursedWisp', 'rottingGator'],
    bossDepth: 18, boss: 'mudMother', itemTier: 2, miniBossDepths: [11, 15],
  },
  {
    id: 'aranhas', name: 'Covil de Aranhas',
    desc: 'Uma fenda rochosa coberta de teias — algo grande tece lá dentro.',
    startDepth: 10, levelReq: 10,
    enemyPool: ['huntingSpider', 'venomSpider', 'giantSpider', 'spiderlingSwarm', 'darkWeaver'],
    bossDepth: 21, boss: 'blackMatriarch', itemTier: 3, miniBossDepths: [14, 18],
  },

  // ── Região 2 — Aprendiz (nível 11-20) ──
  {
    id: 'torre', name: 'Torre Amaldiçoada',
    desc: 'Apenas horrores e criaturas ancestrais habitam suas escadarias. Perigosa, mas generosa em experiência.',
    startDepth: 12, levelReq: 12, special: true, enemyPool: ['horror', 'dragon'],
    xpMult: 1.6, dmgTakenMult: 1.25, dropMult: 1.5,
    bossDepth: 23, boss: 'horrorAncient', itemTier: 3, miniBossDepths: [16, 20],
  },
  {
    id: 'minas', name: 'Minas Abandonadas',
    desc: 'Trilhos enferrujados descem além do que os mineiros ousaram explorar.',
    startDepth: 13, levelReq: 13, enemyPool: ['orc', 'troll'],
    bossDepth: 24, boss: 'orcWarlord', itemTier: 3, miniBossDepths: [17, 21],
  },
  {
    id: 'floresta', name: 'Floresta Amaldiçoada',
    desc: 'Árvores retorcidas escondem olhos brilhando na escuridão.',
    startDepth: 16, levelReq: 16, enemyPool: ['troll', 'horror'],
    bossDepth: 27, boss: 'trollChieftain', itemTier: 4, miniBossDepths: [20, 24],
  },
  {
    id: 'covil', name: 'Covil dos Dragões',
    desc: 'O ninho de criaturas verdadeiramente perigosas.',
    startDepth: 18, levelReq: 18, enemyPool: ['troll', 'dragon', 'horror'],
    bossDepth: 29, boss: 'dragonElder', itemTier: 4, miniBossDepths: [22, 26],
  },
  {
    id: 'necropole', name: 'Necrópole Esquecida',
    desc: 'Um cemitério em ruínas onde os mortos não descansam.',
    startDepth: 18, levelReq: 18, enemyPool: ['skeleton', 'horror'],
    bossDepth: 29, boss: 'skeletonLord', itemTier: 4, miniBossDepths: [22, 26],
  },
  {
    id: 'elficas', name: 'Ruínas Élficas',
    desc: 'Colunas élficas cobertas de vinhas, tomadas por criaturas selvagens.',
    startDepth: 20, levelReq: 20, enemyPool: ['troll', 'dragon'],
    bossDepth: 31, boss: 'trollChieftain', itemTier: 5, miniBossDepths: [24, 28],
  },
  {
    id: 'arena', name: 'Arena de Sangue',
    desc: 'Um gauntlet de combate contínuo — arriscado, mas generoso em espólios.',
    startDepth: 20, levelReq: 20, special: true, enemyPool: ['orc', 'troll', 'dragon'],
    dmgTakenMult: 1.2, dropMult: 1.8,
    bossDepth: 34, boss: 'orcWarlord', itemTier: 5, miniBossDepths: [26, 30],
  },
];

// The Mercador sells items scaled to the toughest dungeon the player could
// currently walk into (by levelReq), replacing the old bestDepth-based
// scaling — a lifetime "deepest floor ever reached" no longer means
// anything now that item tier tracks dungeon progression, not depth.
export function highestAccessibleItemTier(level: number): number {
  const reachable = DUNGEONS.filter((d) => level >= d.levelReq).map((d) => d.itemTier);
  return reachable.length > 0 ? Math.max(...reachable) : 1;
}
