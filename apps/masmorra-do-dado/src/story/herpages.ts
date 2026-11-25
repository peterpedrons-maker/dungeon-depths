// O caderno de "a que veio antes" (HISTORIA.md): outra condenada, que não saiu dali. O jogador acha o caderno dela na sala 2 e continua escrevendo nele.
// Algumas folhas foram ARRANCADAS e estão espalhadas pela Casa; achadas, voltam para o lugar. Em português, na voz dela (às vezes certa, às vezes não).

// (cada folha: no máximo 13 linhas de 16 letras na página; o que passa disso é cortado)
export interface HerPage {
  id: string;
  where: string; // onde se acha (para o autor; o jogo não mostra)
  body: string[];
}

// O RELATO dela: as duas primeiras páginas do caderno, logo depois do índice (é a primeira coisa que o jogador lê). Ela não sabe o que está
// acontecendo; conta o que vê e para no meio da frase. Cada página tem no máximo 13 linhas de 16 letras (a página é estreita).
export const HER_RELATO: string[][] = [
  ['Não sei mais que dia é.', 'A Casa apagou tudo de novo.', 'Acordei embaixo da luz. Sempre embaixo da luz.', 'Leram algo comprido para mim.'],
  ['Conto tudo. Os passos, os braseiros, as vezes que o dado me olha.', 'Se alguém achar isto, não acredite em tudo o que eu'],
];

// as folhas arrancadas, na ordem do caderno (os buracos ficam no lugar delas até serem achadas)
export const HER_PAGES: HerPage[] = [
  {
    id: 'p1',
    where: 'Corredor dos Nichos (o nicho vazio, depois de escrever QUATRO)',
    body: ['O dado me olha quando eu erro. Não sei se é pena ou se é conta.', 'Hoje acendi quatro e a Casa ficou quieta. Quando ela fica quieta, acho que é porque acertei.'],
  },
  {
    id: 'p2',
    where: 'Pátio da Cisterna (numa câmara lateral)',
    body: ['Os pontos são números. Eu já sabia disso antes de cair aqui?', 'Contei os nichos três vezes. Um está vazio. Aqui tudo falta um pedaço. Eu também?'],
  },
  {
    id: 'p3',
    where: 'O Que a Casa Confirma (junto da grade)',
    body: ['Duas frases quase iguais. A Casa fez a de cima e apagou a de baixo.', 'Acho que o risquinho com o ponto em cima quer dizer "é verdade". O outro, "dizem que".'],
  },
  {
    id: 'p4',
    where: 'Os Banhos Secos (num banco da câmara de banho do oeste)',
    body: ['O que está talhado não mente. O que alguém só disse, às vezes mente.', 'Acendi uma frase de boato e a Casa me apagou, como a uma vela.'],
  },
  { id: 'p5', where: '(ainda não está no jogo)', body: [] },
  { id: 'p6', where: '(ainda não está no jogo)', body: [] },
  { id: 'p7', where: '(ainda não está no jogo)', body: [] },
];

// as anotações dela no dicionário de símbolos (tinta sépia, desbotada; o jogador não apaga)
export const HER_NOTES: Record<string, { text: string; doodle?: 'brasa' }> = {
  acender: { text: 'acho que é acender' },
  brasa: { text: '?', doodle: 'brasa' },
};
