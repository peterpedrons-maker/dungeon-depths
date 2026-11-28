// O caderno de "a que veio antes" (HISTORIA.md): outra condenada, que não saiu dali. O jogador acha o caderno dela na sala 2 e continua escrevendo nele.
// Algumas folhas foram ARRANCADAS e estão espalhadas pela Casa; achadas, voltam para o lugar. Na voz dela (às vezes certa, às vezes não), nos três
// idiomas (src/i18n.ts): o inglês e o espanhol são a voz dela em cada língua, não tradução palavra por palavra.
import { T, type Tx } from '../i18n';

// (cada folha: no máximo 13 linhas de 16 letras na página, NOS TRÊS IDIOMAS; o que passa disso é cortado. Se não couber, enxugar a tradução, nunca o português)
export interface HerPage {
  id: string;
  where: string; // onde se acha (para o autor; o jogo não mostra)
  body: Tx[];
}

// O RELATO dela: as duas primeiras páginas do caderno, logo depois do índice (é a primeira coisa que o jogador lê). Ela não sabe o que está
// acontecendo; conta o que vê e para no meio da frase. Cada página tem no máximo 13 linhas de 16 letras (a página é estreita; as duas estão cheias).
// É LENDO o relato que o jogador descobre que o caderno é de outra pessoa, uma mulher, condenada ("condenada" é a marca); antes, o tutorial não diz "ela".
// (Em inglês o adjetivo não tem gênero: a marca é "a condemned woman", que ecoa o "condemned man" da língua. Em espanhol, "condenada", como no português.)
// ("Dizem que" é como ela mesma lê a marca de BOATO, p3: sem saber, ecoa a 1ª frase do dado, VOCÊ CONDENADO BOATO. Não revela nada; só se relê no fim.
// Em inglês "They say", em espanhol "Dicen que"; o mesmo sujeito sem rosto de "Leram algo comprido para mim": "They read me", "Me leyeron".)
// ("A Casa apagou tudo": a luz e a memória. Em inglês "blacked it all out", que é escurecer e também perder a memória; em espanhol "apagó todo".)
export const HER_RELATO: Tx[][] = [
  [
    T('Não sei mais que dia é.', "I've lost track of the days.", 'Ya no sé qué día es.'),
    T('A Casa apagou tudo de novo.', 'The House blacked it all out again.', 'La Casa apagó todo otra vez.'),
    T('Acordei embaixo da luz. Sempre embaixo da luz.', 'I woke under the light. Always under the light.', 'Desperté debajo de la luz. Siempre debajo de la luz.'),
    T('Leram algo comprido para mim.', 'They read me something long.', 'Me leyeron algo largo.'),
  ],
  [
    T('Dizem que estou condenada.', "They say I'm a condemned woman.", 'Dicen que estoy condenada.'),
    T(
      'Conto tudo. Os passos, os braseiros, as vezes que o dado me olha.',
      'I count everything. Steps, braziers, the times the die looks at me.',
      'Cuento todo. Los pasos, los braseros, las veces que el dado me mira.',
    ),
    T('Se alguém achar isto, não acredite em tudo o que eu', "If anyone finds this, don't believe everything I", 'Si alguien encuentra esto, no creas todo lo que yo'),
  ],
];

// as folhas arrancadas, na ordem do caderno (os buracos ficam no lugar delas até serem achadas). A ordem é a do caminho da Casa (sala 3 → sala 20):
// ela escrevia por onde passava. No capítulo 1 são 18: as 7 primeiras e as 11 (p8 a p18) dos segredos que não guardam gema (story/gems.ts).
// Fios que atravessam as folhas, sempre de leve e sem resolver (HISTORIA.md, "O epílogo" e "As folhas dela"). Ninguém manda contar nada: ela fica embaixo da
// LUZ do teto sem saber por quê (p8), conta tudo, por mania, até as luzes (p7), e um dia para de contar (p18); acha PEDRAS que brilham e não sabe onde pôr
// (p10); sonha dentro de uma mão fechada (p13); lembra de cair de muito alto, com a luz redonda lá em cima (p16). (Pedido do Pedro: a p8 antiga, "vou anotar
// os furos, só os redondos", entregava o fim; tudo aqui tem de ser ambíguo e discreto.) Os fios valem nos três idiomas: a mão é "closed hand"/"mano cerrada"
// (não "fist"/"puño": é a mão que sacode o dado), a luz é sempre "light"/"luz", e o "apagar" da Casa é o mesmo verbo em cada língua (p4, p5, o relato).
export const HER_PAGES: HerPage[] = [
  {
    id: 'p8',
    where: 'A Lousa (sala 3; o nicho atrás da coluna esquerda, depois de escrever CINCO no soquete frio sob o dado de cinco pontos)',
    body: [
      T('Tem luz entrando pelo teto aqui também.', "There's light coming in through the ceiling here too.", 'Aquí también entra luz por el techo.'),
      T(
        'Fiquei parada embaixo dela um tempo. Não sei esperando o quê.',
        "I stood under it for a while. Waiting for I don't know what.",
        'Me quedé parada debajo de ella un rato. Esperando no sé qué.',
      ),
    ],
  },
  {
    id: 'p9',
    where: 'O Fio de Fogo (sala 4; o nicho sob o balcão, o segredo FAZER)',
    body: [
      T('Escrevi no chão com fogo e uma parede se abriu.', 'I wrote on the floor with fire and a wall opened.', 'Escribí en el suelo con fuego y se abrió una pared.'),
      T(
        'Não sei o que eu disse. Espero que não tenha sido contra mim.',
        "I don't know what I said. I hope it wasn't against me.",
        'No sé qué dije. Espero que no haya sido contra mí.',
      ),
    ],
  },
  {
    id: 'p1',
    where: 'Corredor dos Nichos (o nicho vazio, depois de escrever QUATRO)',
    // ("pena": dó e castigo, nos dois sentidos; o espanhol guarda os dois, o inglês fica com "pity" e põe o castigo no "keeping score")
    body: [
      T(
        'O dado me olha quando eu erro. Não sei se é pena ou se é conta.',
        "The die looks at me when I'm wrong. I don't know if it's pity or if it's keeping score.",
        'El dado me mira cuando me equivoco. No sé si es pena o si lleva la cuenta.',
      ),
      T(
        'Hoje acendi quatro e a Casa ficou quieta. Quando ela fica quieta, acho que é porque acertei.',
        'Today I lit four and the House went quiet. When it goes quiet, I think it means I got it right.',
        'Hoy encendí cuatro y la Casa se quedó callada. Cuando se calla, creo que es porque acerté.',
      ),
    ],
  },
  {
    id: 'p2',
    where: 'Pátio da Cisterna (numa câmara lateral)',
    body: [
      T(
        'Os pontos são números. Eu já sabia disso antes de cair aqui?',
        'The dots are numbers. Did I know that before I fell in here?',
        'Los puntos son números. ¿Ya lo sabía antes de caer aquí?',
      ),
      T(
        'Contei os nichos três vezes. Um está vazio. Aqui tudo falta um pedaço. Eu também?',
        'I counted the niches three times. One is empty. Everything here is missing a piece. Me too?',
        'Conté los nichos tres veces. Uno está vacío. Aquí a todo le falta un pedazo. ¿A mí también?',
      ),
    ],
  },
  {
    id: 'p10',
    where: 'A Casa Escreve (sala 6; a constelação C1: o nicho da parede esquerda, perto da entrada)',
    body: [
      T('Achei uma pedra que brilha sozinha. Guardei.', 'I found a stone that glows on its own. I kept it.', 'Encontré una piedra que brilla sola. La guardé.'),
      T('Não serve em porta nenhuma. Não sei onde pôr.', "It doesn't fit any door. I don't know where to put it.", 'No sirve en ninguna puerta. No sé dónde ponerla.'),
    ],
  },
  {
    id: 'p3',
    where: 'O Que a Casa Confirma (junto da grade)',
    body: [
      T(
        'Quase a mesma frase, duas vezes. A Casa fez uma e apagou a outra.',
        'Almost the same sentence, twice. The House did one and put out the other.',
        'Casi la misma frase, dos veces. La Casa hizo una y apagó la otra.',
      ),
      T(
        'Acho que o risquinho com o ponto no meio quer dizer "é verdade". O de ponto em cima, "dizem que".',
        'The little line with the dot in the middle means "it\'s true", I think. With the dot on top, "they say".',
        'Creo que la rayita con el punto en medio quiere decir "es verdad". La del punto arriba, "dicen que".',
      ),
    ],
  },
  {
    id: 'p4',
    where: 'Os Banhos Secos (num banco da câmara de banho do oeste)',
    // (ERRO PLANTADO, decidido: ela está enganada; A Ponte de Frases e o Tribunal mostram que o talhado também pode ser boato)
    body: [
      T(
        'O que está talhado não mente. O que alguém só disse, às vezes mente.',
        "What is carved doesn't lie. What someone only said, sometimes lies.",
        'Lo que está tallado no miente. Lo que alguien solo dijo, a veces miente.',
      ),
      T(
        'Acendi uma frase de boato e a Casa me apagou, como a uma vela.',
        'I lit a rumor and the House snuffed me out, like a candle.',
        'Encendí un rumor y la Casa me apagó, como a una vela.',
      ),
    ],
  },
  {
    id: 'p11',
    where: 'Os Banhos Secos (sala 9; sobe do ralo da piscina mais funda, com exatamente DOIS braseiros acesos)',
    body: [
      T('Desci na piscina funda. Seca há muito tempo.', 'I went down into the deep pool. Dry for a long time.', 'Bajé a la piscina honda. Seca hace mucho tiempo.'),
      T(
        'Eu também. Não tenho sede, nem fome, desde que cheguei.',
        "Me too. I haven't been thirsty, or hungry, since I got here.",
        'Yo también. No tengo sed, ni hambre, desde que llegué.',
      ),
    ],
  },
  {
    id: 'p12',
    where: 'Os Banhos Secos (sala 9; o nicho atrás do estandarte de BOATO bordado, depois que ele queima)',
    // (ERRO PLANTADO, de pavio longo: o dado PODE mentir, HISTORIA.md "O dado: o Boato"; quando ele mentir pela 1ª vez, esta folha vira o engano dela)
    // (em inglês, "to see if it would die" faria trocadilho com "die", o dado; fica "to see if I could kill it", que leva bem ao "I said sorry")
    body: [
      T(
        'Joguei o dado no fogo para ver se ele morria. Voltou para a minha mão, quente.',
        'I threw the die in the fire to see if I could kill it. It came back to my hand, hot.',
        'Tiré el dado al fuego para ver si se moría. Volvió a mi mano, caliente.',
      ),
      T('Pedi desculpa. Ele nunca mentiu para mim.', "I said sorry. It's never lied to me.", 'Le pedí perdón. Nunca me mintió.'),
    ],
  },
  {
    id: 'p13',
    where: 'O Pano (sala 10; a constelação C2, os frisos do teto: o nicho da parede direita, perto da entrada)',
    body: [
      T(
        'Dormi perto de um braseiro. Sonhei que estava dentro de uma mão fechada. Ela me sacudia.',
        'I slept near a brazier. I dreamed I was inside a closed hand. It was shaking me.',
        'Dormí cerca de un brasero. Soñé que estaba dentro de una mano cerrada. Me sacudía.',
      ),
      T('Acordei tonta, com gosto de poeira.', 'I woke up dizzy, tasting dust.', 'Desperté mareada, con sabor a polvo.'),
    ],
  },
  {
    id: 'p14',
    where: 'A Biblioteca (sala 11; a constelação C-Bib, a página da mesa do Escrivão: o nicho do Átrio, parede do fundo, à esquerda da porta)',
    // (o "de capuz" é o Escrivão; ela não sabe o nome. Ambíguo de propósito: nunca dizer se ele traiu ou protegeu)
    body: [
      T(
        'O de capuz escreve de costas, sem parar. Nunca vi o rosto dele.',
        "The hooded one writes with his back turned, never stopping. I've never seen his face.",
        'El de capucha escribe de espaldas, sin parar. Nunca le vi la cara.',
      ),
      T('Acho que escreve sobre mim. Não sei se isso é bom.', "I think he writes about me. I don't know if that's good.", 'Creo que escribe sobre mí. No sé si eso es bueno.'),
    ],
  },
  {
    id: 'p15',
    where: 'A Biblioteca (sala 11; o nicho da Sala de Aula, aberto por uma das três lousas)',
    // (ERRO PLANTADO: nenhuma parede escreve o seis num glifo só, mas ele existe: é a portinha dos seis pontos da Escadaria e, na base 6 do Contador, UM ZERO)
    body: [
      T(
        'Contei nos dedos, como criança: um, dois, três, quatro, cinco.',
        'I counted on my fingers, like a child: one, two, three, four, five.',
        'Conté con los dedos, como los niños: uno, dos, tres, cuatro, cinco.',
      ),
      T(
        'Depois do cinco, nenhuma parede escreve nada. Acho que aqui o seis não existe.',
        'After five, no wall writes anything. I think there is no six here.',
        'Después del cinco, ninguna pared escribe nada. Creo que aquí el seis no existe.',
      ),
    ],
  },
  {
    id: 'p16',
    where: 'A Ponte de Madeira (sala 13; a constelação C3, as tochas da boca do fosso: a câmara no patamar da rampa)',
    body: [
      T(
        'Na beira do fosso, lembrei de cair. Não daqui. De muito mais alto.',
        'At the edge of the pit, I remembered falling. Not from here. From much higher.',
        'Al borde del foso, recordé que caía. No de aquí. De mucho más alto.',
      ),
      T('A luz ia ficando pequena lá em cima. Redonda.', 'The light kept getting smaller up there. Round.', 'La luz se iba haciendo pequeña allá arriba. Redonda.'),
    ],
  },
  {
    id: 'p5',
    where: 'A Galeria dos Condenados (no banco do fundo; a pista da sala do Escuro)',
    body: [
      T('Quando eu erro, a Casa apaga tudo.', "When I'm wrong, the House blacks it all out.", 'Cuando me equivoco, la Casa apaga todo.'),
      T(
        'Por um instante, no escuro, juro que vi alguma coisa brilhando no teto.',
        'For a moment, in the dark, I swear I saw something shining on the ceiling.',
        'Por un instante, a oscuras, juro que vi algo brillando en el techo.',
      ),
    ],
  },
  {
    id: 'p6',
    where: 'A Galeria dos Condenados (perto do desenho a giz do braseiro grande e do pequeno)',
    // (ela erra de novo: o glifo é PEQUENO; quem fez A Balança sabe)
    body: [
      T(
        'O ponto no meio, com as duas barras do lado, quer dizer UM.',
        'The dot in the middle, with the two bars beside it, means ONE.',
        'El punto en el medio, con las dos barras al lado, quiere decir UNO.',
      ),
      T('Tenho certeza.', "I'm sure of it.", 'Estoy segura.'),
    ],
  },
  {
    id: 'p17',
    where: 'A Galeria dos Condenados (sala 15; o nicho da câmara lateral, depois da ordem da lei: DOIS, TRÊS, UM)',
    // (ERRO PLANTADO: ela lê o UM de «UM BOATO IGUAL VERDADE» como artigo, "um boato é igual à verdade"; é o número: EXATAMENTE UM boato é verdade,
    // como a própria câmara acabou de mostrar. Somado ao erro da p4, "o talhado não mente", ela conclui que o que leram para ela é verdade, e para)
    // (o espanhol tem o mesmo "un" de artigo e de número; em inglês ela escreve "a rumor" onde a pedra diz UM, e o engano fica à vista de quem já lê o UM)
    body: [
      T(
        'Na câmara, a pedra diz: um boato é igual à verdade.',
        'In the chamber, the stone says: a rumor is equal to the truth.',
        'En la cámara, la piedra dice: un rumor es igual a la verdad.',
      ),
      T('Então o que leram para mim é', 'So what they read me is', 'Entonces lo que me leyeron es'),
    ],
  },
  {
    id: 'p7',
    where: 'A Escadaria (no meio da subida)',
    body: [
      T(
        'Contei tudo aqui. Os cantos, os degraus, as luzes lá em cima.',
        'I counted everything here. The corners, the steps, the lights up there.',
        'Conté todo aquí. Los rincones, los escalones, las luces allá arriba.',
      ),
      T(
        'Esta casa tem a forma de alguma coisa que eu conheço. Não lembro do quê.',
        "This house has the shape of something I know. I don't remember what.",
        'Esta casa tiene la forma de algo que conozco. No me acuerdo de qué.',
      ),
    ],
  },
  {
    id: 'p18',
    where: 'O Fogo que Corre (sala 20; a constelação C5, MENOS em cal no teto: o nicho da parede direita, perto da porta)',
    // (a última folha arrancada do capítulo 1; o relato, escrito depois que "a Casa apagou tudo de novo", mostra que ela voltou a contar)
    body: [
      T('Parei de contar. Cada vez dava outro número.', 'I stopped counting. Every time it came out a different number.', 'Dejé de contar. Cada vez daba otro número.'),
      T('Contar não me tira daqui.', "Counting won't get me out of here.", 'Contar no me saca de aquí.'),
    ],
  },
];

// as anotações dela no dicionário de símbolos (tinta sépia, desbotada; o jogador não apaga). Uma linha só, sem quebra: no máximo 18 letras.
// (o "acender" dela em inglês é "ignite", a palavra do léxico (tools/lexicon.mjs); se a pergunta do dado usar outra, as duas têm de ser a mesma.
// O "?" fica igual nos três: o tutorial do caderno manda escrever "embaixo do ? dela")
export const HER_NOTES: Record<string, { text: Tx; doodle?: 'brasa' }> = {
  acender: { text: T('acho que é acender', 'ignite, I think', 'encender, creo') },
  brasa: { text: T('?', '?', '?'), doodle: 'brasa' },
};
