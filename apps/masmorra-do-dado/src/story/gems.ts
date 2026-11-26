// AS GEMAS (DESIGN.md §69, decidido com o Pedro): são 21 no jogo todo, a soma das faces de um dado (1+2+3+4+5+6). Cada uma vai para um FURO
// do dado aberto em cruz talhado no fundo do caderno (a parte dura de dentro da capa de trás). Elas enchem o dado EM ORDEM, não por sala: a 1ª
// fecha a face 1; a 2ª e a 3ª, a face 2; da 4ª à 6ª, a face 3; e assim até a 21ª. Por capítulo: 3, 3, 3, 4, 4, 4.
// Com as 21, depois de qualquer um dos três finais, vem o epílogo (HISTORIA.md).

export const GEM_TOTAL = 21;
export const GEMS_PER_CHAPTER = [3, 3, 3, 4, 4, 4] as const;

// as gemas que já existem no jogo (o id é o que fica salvo no caderno; `room` é o nome da sala, para o salvamento antigo)
export const GEMS: { id: string; chapter: number; room: string; where: string }[] = [
  { id: 'cisterna', chapter: 1, room: 'Os Nichos e a Cisterna', where: 'o reflexo na água da Cisterna (sala 5)' },
  { id: 'papel', chapter: 1, room: 'A Biblioteca', where: 'atrás do terceiro livro de boato queimado, na Ala do Papel (sala 11)' },
  { id: 'c6', chapter: 1, room: 'Os Que Dizem o Mesmo', where: 'a constelação C6 (sala 21)' },
];

// quantas faces estão completas com n gemas
export function facesDone(n: number) {
  let f = 0;
  let need = 0;
  while (f < 6 && n >= need + f + 1) {
    need += f + 1;
    f++;
  }
  return f;
}
