import { DungeonDef } from '../types/game';

// The full roster is planned across 7 level-bracket "regions" shown on the
// Dungeon Map (see lib/dungeonMap.ts) — only Região 1 (Iniciante, nível
// 1-10) and Região 2 (Aprendiz, nível 11-20) have art and dungeons defined
// so far; regions 3-7 are reserved for future updates. startDepth matches
// levelReq for every new dungeon, keeping the "how far in you start"
// difficulty in step with "what level you need to enter".
export const DUNGEONS: DungeonDef[] = [
  // ── Região 1 — Iniciante (nível 1-10) ──
  {
    id: 'ruinas', name: 'Ruínas Superficiais',
    desc: 'Criaturas fracas perto da entrada da masmorra. Boa para começar.',
    startDepth: 1, levelReq: 1, enemyPool: ['goblin', 'wolf', 'skeleton'],
  },
  {
    id: 'goblins', name: 'Caverna dos Goblins',
    desc: 'Uma tribo de goblins fez desta caverna seu covil.',
    startDepth: 4, levelReq: 4, enemyPool: ['goblin', 'wolf'],
  },
  {
    id: 'cripta', name: 'Cripta do Tesouro',
    desc: 'Guardada por criaturas comuns, mas rica em ouro e equipamentos.',
    startDepth: 5, levelReq: 5, special: true,
    goldMult: 2, xpMult: 0.7, dropMult: 2.5,
  },
  {
    id: 'pantano', name: 'Pântano Podre',
    desc: 'Água estagnada e árvores mortas escondem predadores famintos.',
    startDepth: 7, levelReq: 7, enemyPool: ['wolf', 'skeleton'],
  },
  {
    id: 'aranhas', name: 'Covil de Aranhas',
    desc: 'Uma fenda rochosa coberta de teias — algo grande tece lá dentro.',
    startDepth: 10, levelReq: 10, enemyPool: ['skeleton', 'orc'],
  },

  // ── Região 2 — Aprendiz (nível 11-20) ──
  {
    id: 'torre', name: 'Torre Amaldiçoada',
    desc: 'Apenas horrores e criaturas ancestrais habitam suas escadarias. Perigosa, mas generosa em experiência.',
    startDepth: 12, levelReq: 12, special: true, enemyPool: ['horror', 'dragon'],
    xpMult: 1.6, dmgTakenMult: 1.25, dropMult: 1.5,
  },
  {
    id: 'minas', name: 'Minas Abandonadas',
    desc: 'Trilhos enferrujados descem além do que os mineiros ousaram explorar.',
    startDepth: 13, levelReq: 13, enemyPool: ['orc', 'troll'],
  },
  {
    id: 'floresta', name: 'Floresta Amaldiçoada',
    desc: 'Árvores retorcidas escondem olhos brilhando na escuridão.',
    startDepth: 16, levelReq: 16, enemyPool: ['troll', 'horror'],
  },
  {
    id: 'covil', name: 'Covil dos Dragões',
    desc: 'O ninho de criaturas verdadeiramente perigosas.',
    startDepth: 18, levelReq: 18, enemyPool: ['troll', 'dragon', 'horror'],
  },
  {
    id: 'necropole', name: 'Necrópole Esquecida',
    desc: 'Um cemitério em ruínas onde os mortos não descansam.',
    startDepth: 18, levelReq: 18, enemyPool: ['skeleton', 'horror'],
  },
  {
    id: 'elficas', name: 'Ruínas Élficas',
    desc: 'Colunas élficas cobertas de vinhas, tomadas por criaturas selvagens.',
    startDepth: 20, levelReq: 20, enemyPool: ['troll', 'dragon'],
  },
  {
    id: 'arena', name: 'Arena de Sangue',
    desc: 'Um gauntlet de combate contínuo — arriscado, mas generoso em espólios.',
    startDepth: 20, levelReq: 20, special: true, enemyPool: ['orc', 'troll', 'dragon'],
    dmgTakenMult: 1.2, dropMult: 1.8,
  },
];
