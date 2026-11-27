// O caderno de "a que veio antes" (HISTORIA.md): outra condenada, que não saiu dali. O jogador acha o caderno dela na sala 2 e continua escrevendo nele.
// Algumas folhas foram ARRANCADAS e estão espalhadas pela Casa; achadas, voltam para o lugar. Em português, na voz dela (às vezes certa, às vezes não).

// (cada folha: no máximo 13 linhas de 16 letras na página; o que passa disso é cortado)
export interface HerPage {
  id: string;
  where: string; // onde se acha (para o autor; o jogo não mostra)
  body: string[];
}

// O RELATO dela: as duas primeiras páginas do caderno, logo depois do índice (é a primeira coisa que o jogador lê). Ela não sabe o que está
// acontecendo; conta o que vê e para no meio da frase. Cada página tem no máximo 13 linhas de 16 letras (a página é estreita; as duas estão cheias).
// É LENDO o relato que o jogador descobre que o caderno é de outra pessoa, uma mulher, condenada ("condenada" é a marca); antes, o tutorial não diz "ela".
// ("Dizem que" é como ela mesma lê a marca de BOATO, p3: sem saber, ecoa a 1ª frase do dado, VOCÊ CONDENADO BOATO. Não revela nada; só se relê no fim.)
export const HER_RELATO: string[][] = [
  ['Não sei mais que dia é.', 'A Casa apagou tudo de novo.', 'Acordei embaixo da luz. Sempre embaixo da luz.', 'Leram algo comprido para mim.'],
  ['Dizem que estou condenada.', 'Conto tudo. Os passos, os braseiros, as vezes que o dado me olha.', 'Se alguém achar isto, não acredite em tudo o que eu'],
];

// as folhas arrancadas, na ordem do caderno (os buracos ficam no lugar delas até serem achadas). A ordem é a do caminho da Casa (sala 3 → sala 20):
// ela escrevia por onde passava. No capítulo 1 são 18: as 7 primeiras e as 11 (p8 a p18) dos segredos que não guardam gema (story/gems.ts).
// Fios que atravessam as folhas, sempre de leve e sem resolver (HISTORIA.md, "O epílogo" e "As folhas dela"). Ninguém manda contar nada: ela fica embaixo da
// LUZ do teto sem saber por quê (p8), conta tudo, por mania, até as luzes (p7), e um dia para de contar (p18); acha PEDRAS que brilham e não sabe onde pôr
// (p10); sonha dentro de uma mão fechada (p13); lembra de cair de muito alto, com a luz redonda lá em cima (p16). (Pedido do Pedro: a p8 antiga, "vou anotar
// os furos, só os redondos", entregava o fim; tudo aqui tem de ser ambíguo e discreto.)
export const HER_PAGES: HerPage[] = [
  {
    id: 'p8',
    where: 'A Lousa (sala 3; o nicho atrás da coluna esquerda, depois de escrever CINCO no soquete frio sob o dado de cinco pontos)',
    body: ['Tem luz entrando pelo teto aqui também.', 'Fiquei parada embaixo dela um tempo. Não sei esperando o quê.'],
  },
  {
    id: 'p9',
    where: 'O Fio de Fogo (sala 4; o nicho sob o balcão, o segredo FAZER)',
    body: ['Escrevi no chão com fogo e uma parede se abriu.', 'Não sei o que eu disse. Espero que não tenha sido contra mim.'],
  },
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
    id: 'p10',
    where: 'A Casa Escreve (sala 6; a constelação C1: o nicho da parede esquerda, perto da entrada)',
    body: ['Achei uma pedra que brilha sozinha. Guardei.', 'Não serve em porta nenhuma. Não sei onde pôr.'],
  },
  {
    id: 'p3',
    where: 'O Que a Casa Confirma (junto da grade)',
    body: ['Quase a mesma frase, duas vezes. A Casa fez uma e apagou a outra.', 'Acho que o risquinho com o ponto no meio quer dizer "é verdade". O de ponto em cima, "dizem que".'],
  },
  {
    id: 'p4',
    where: 'Os Banhos Secos (num banco da câmara de banho do oeste)',
    // (ERRO PLANTADO, decidido: ela está enganada; O Boato Verdadeiro e o Tribunal mostram que o talhado também pode ser boato)
    body: ['O que está talhado não mente. O que alguém só disse, às vezes mente.', 'Acendi uma frase de boato e a Casa me apagou, como a uma vela.'],
  },
  {
    id: 'p11',
    where: 'Os Banhos Secos (sala 9; sobe do ralo da piscina mais funda, com exatamente DOIS braseiros acesos)',
    body: ['Desci na piscina funda. Seca há muito tempo.', 'Eu também. Não tenho sede, nem fome, desde que cheguei.'],
  },
  {
    id: 'p12',
    where: 'Os Banhos Secos (sala 9; o nicho atrás do estandarte de BOATO bordado, depois que ele queima)',
    // (ERRO PLANTADO, de pavio longo: o dado PODE mentir, HISTORIA.md "O dado: o Boato"; quando ele mentir pela 1ª vez, esta folha vira o engano dela)
    body: ['Joguei o dado no fogo para ver se ele morria. Voltou para a minha mão, quente.', 'Pedi desculpa. Ele nunca mentiu para mim.'],
  },
  {
    id: 'p13',
    where: 'O Pano (sala 10; a constelação C2, os frisos do teto: o nicho da parede direita, perto da entrada)',
    body: ['Dormi perto de um braseiro. Sonhei que estava dentro de uma mão fechada. Ela me sacudia.', 'Acordei tonta, com gosto de poeira.'],
  },
  {
    id: 'p14',
    where: 'A Biblioteca (sala 11; a constelação C-Bib, a página da mesa do Escrivão: o nicho do Átrio, parede do fundo, à esquerda da porta)',
    // (o "de capuz" é o Escrivão; ela não sabe o nome. Ambíguo de propósito: nunca dizer se ele traiu ou protegeu)
    body: ['O de capuz escreve de costas, sem parar. Nunca vi o rosto dele.', 'Acho que escreve sobre mim. Não sei se isso é bom.'],
  },
  {
    id: 'p15',
    where: 'A Biblioteca (sala 11; o nicho da Sala de Aula, aberto por uma das três lousas)',
    // (ERRO PLANTADO: nenhuma parede escreve o seis num glifo só, mas ele existe: é a portinha dos seis pontos da Escadaria e, na base 6 do Contador, UM ZERO)
    body: ['Contei nos dedos, como criança: um, dois, três, quatro, cinco.', 'Depois do cinco, nenhuma parede escreve nada. Acho que aqui o seis não existe.'],
  },
  {
    id: 'p16',
    where: 'A Ponte de Madeira (sala 13; a constelação C3, as tochas da boca do fosso: a câmara no patamar da rampa)',
    body: ['Na beira do fosso, lembrei de cair. Não daqui. De muito mais alto.', 'A luz ia ficando pequena lá em cima. Redonda.'],
  },
  {
    id: 'p5',
    where: 'A Galeria dos Condenados (no banco do fundo; a pista da sala do Escuro)',
    body: ['Quando eu erro, a Casa apaga tudo.', 'Por um instante, no escuro, juro que vi alguma coisa brilhando no teto.'],
  },
  {
    id: 'p6',
    where: 'A Galeria dos Condenados (perto do desenho a giz do braseiro grande e do pequeno)',
    // (ela erra de novo: o glifo é PEQUENO; quem fez Os Apelidos sabe)
    body: ['O ponto no meio, com as duas barras do lado, quer dizer UM.', 'Tenho certeza.'],
  },
  {
    id: 'p17',
    where: 'A Galeria dos Condenados (sala 15; o nicho da câmara lateral, depois da ordem da lei: DOIS, TRÊS, UM)',
    // (ERRO PLANTADO: ela lê o UM de «UM BOATO IGUAL VERDADE» como artigo, "um boato é igual à verdade"; é o número: EXATAMENTE UM boato é verdade,
    // como a própria câmara acabou de mostrar. Somado ao erro da p4, "o talhado não mente", ela conclui que o que leram para ela é verdade, e para)
    body: ['Na câmara, a pedra diz: um boato é igual à verdade.', 'Então o que leram para mim é'],
  },
  {
    id: 'p7',
    where: 'A Escadaria (no meio da subida)',
    body: ['Contei tudo aqui. Os cantos, os degraus, as luzes lá em cima.', 'Esta casa tem a forma de alguma coisa que eu conheço. Não lembro do quê.'],
  },
  {
    id: 'p18',
    where: 'O Fogo que Corre (sala 20; a constelação C5, MENOS em cal no teto: o nicho da parede direita, perto da porta)',
    // (a última folha arrancada do capítulo 1; o relato, escrito depois que "a Casa apagou tudo de novo", mostra que ela voltou a contar)
    body: ['Parei de contar. Cada vez dava outro número.', 'Contar não me tira daqui.'],
  },
];

// as anotações dela no dicionário de símbolos (tinta sépia, desbotada; o jogador não apaga)
export const HER_NOTES: Record<string, { text: string; doodle?: 'brasa' }> = {
  acender: { text: 'acho que é acender' },
  brasa: { text: '?', doodle: 'brasa' },
};
