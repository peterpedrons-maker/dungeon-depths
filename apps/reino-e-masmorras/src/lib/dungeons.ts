import { DungeonDef } from '../types/game';

export const DUNGEONS: DungeonDef[] = [
  {
    id: 'ruinas', name: 'Ruínas Superficiais',
    desc: 'Criaturas fracas perto da entrada da masmorra. Boa para começar.',
    startDepth: 1, enemyPool: ['goblin', 'wolf', 'skeleton'],
  },
  {
    id: 'cavernas', name: 'Cavernas Profundas',
    desc: 'Passagens escuras habitadas por orcs e trolls.',
    startDepth: 8, enemyPool: ['skeleton', 'orc', 'troll'],
  },
  {
    id: 'covil', name: 'Covil dos Dragões',
    desc: 'O ninho de criaturas verdadeiramente perigosas.',
    startDepth: 18, enemyPool: ['troll', 'dragon', 'horror'],
  },
  {
    id: 'cripta', name: 'Cripta do Tesouro',
    desc: 'Guardada por criaturas comuns, mas rica em ouro e equipamentos.',
    startDepth: 5, special: true,
    goldMult: 2, xpMult: 0.7, dropMult: 2.5,
  },
  {
    id: 'torre', name: 'Torre Amaldiçoada',
    desc: 'Apenas horrores e criaturas ancestrais habitam suas escadarias. Perigosa, mas generosa em experiência.',
    startDepth: 12, special: true, enemyPool: ['horror', 'dragon'],
    xpMult: 1.6, dmgTakenMult: 1.25, dropMult: 1.5,
  },
];
