import { DungeonDef } from '../types/game';

// Caçadas — masmorras especiais separadas do Mapa de Masmorras (ver
// components/HuntHall.tsx): nenhum piso, nenhum encontro regular, o jogador
// entra e já cai direto no Alvo de Caçada (startDepth === bossDepth, então
// spawnEnemy já retorna o chefe no primeiro encontro — ver spawnEnemy em
// lib/enemies.ts). isHunt:true aciona o multiplicador extra de dificuldade
// (HUNT_STAT_MULT/HUNT_DEF_MULT em enemies.ts) e a raridade garantida em
// pickHuntDropRarity (DungeonPanel.tsx) — cada abate garante Raro ou melhor.
// bossDepth aqui é só a profundidade "virtual" usada pela curva de
// escalonamento normal (a mesma de lib/enemies.ts), reaproveitada para que a
// dificuldade base do alvo já saia equivalente à de um chefe de masmorra com
// bossDepth parecido, antes do multiplicador de Caçada entrar em cena.
// Repetível livremente — não é um contrato de uso único, é uma masmorra como
// qualquer outra, só que sempre com o mesmo (duro) chefe te esperando.
export const HUNTS: DungeonDef[] = [
  {
    id: 'sepulcro', name: 'Sepulcro do Tirano',
    desc: 'Um alvo de caçada: o Tirano Ossudo. Muito mais forte que qualquer chefe de masmorra do seu nível — não é para amadores.',
    startDepth: 24, levelReq: 12, special: true, isHunt: true,
    bossDepth: 24, boss: 'boneTyrant', itemTier: 3,
  },
  {
    id: 'abismo', name: 'Abismo do Leviatã',
    desc: 'Um alvo de caçada: o Leviatã do Pântano. Uma fera colossal que exige um herói bem equipado.',
    startDepth: 29, levelReq: 16, special: true, isHunt: true,
    bossDepth: 29, boss: 'swampLeviathan', itemTier: 4,
  },
  {
    id: 'inferno', name: 'Covil do Wyrm Infernal',
    desc: 'Um alvo de caçada: o Wyrm Infernal. O desafio mais difícil disponível — poucos heróis conseguem abatê-lo.',
    startDepth: 34, levelReq: 20, special: true, isHunt: true,
    bossDepth: 34, boss: 'infernalWyrm', itemTier: 5,
  },
];
