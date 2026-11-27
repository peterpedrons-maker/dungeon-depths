# A Sentença: resumo da história (rascunho v1)

> Falas e nomes são provisórios. O que importa aqui é a estrutura. Itens marcados **[DECIDIR]** esperam escolha.

## Em uma frase
Você foi **lançado, como um dado**, dentro de uma Casa que é ao mesmo tempo o seu julgamento e a frase que o condena, escrita numa língua que você não lê. Para sair, é preciso aprender a ler essa frase até o fim e **escrever a palavra que falta**.

## O mundo
- **Os Contáveis** foram um povo que só falava com pontos de dado. Para eles **dizer era fazer**: uma frase só era verdadeira se o dado a **confirmasse**. Uma frase sem confirmação era boato.
- **A Casa** é a sentença deles: cada sala é uma palavra, cada porta uma pausa. Quem entra "cumpre a pena" aprendendo a ler.
- **A língua** é feita do dado: pontos, linhas e molduras. Todo o mundo fala nela. Só os humanos (o jogador e os outros condenados) escrevem em português.

## Quem é você
- **Sem nome.** Lembra de duas coisas: de ter sido **lançado** (de cair, não de ter sido carregado) e de uma voz lendo algo comprido, numa língua que não entendeu. **Não lembra do crime.**
- Ganha um **dado** logo no começo (o Escrivão o joga pelo poço). O **giz** (todo condenado recebe um) só chega no capítulo 2, com o Escrivão.

## O dado: o Boato
- É **o boato sobre você**: a acusação que ninguém confirmou. Por isso te segue para todo lado: ele é *sobre* você.
- Companheiro e ferramenta. Fala em glifos e **pode mentir**: usa a marca CONFIRMADO em frases falsas, e o jogador aprende a desconfiar.
- **Nunca morre.** Queima no fogo e renasce na mão. Só quer uma coisa: **pousar**, ser confirmado.

## Os NPCs (4, mais o dado)
| NPC | Quando aparece | Papel |
|---|---|---|
| **O Escrivão** | fim do 1º capítulo; de novo no meio; e no fim | Escreve com o mesmo giz branco. Ensina **fazendo**: escreve uma frase e a sala a obedece. Fala em glifos. Foi quem escreveu a sua sentença, e **deixou de fora a marca de confirmação**. |
| **O Contador** | capítulo 2 ou 3 | Eco de um Contável que só fala em números. Ensina a base 6. Humor seco. |
| **A que veio antes** | os diários dela estão pelo caminho (em português); aparece **uma vez**, perto do fim | Outra condenada. Errou o final. Seus diários são as dicas: às vezes certas, às vezes não. |
| **O Juiz** | sala do veredito | Quem leu a sentença. Só fala com as marcas CONFIRMADO e BOATO. |

## Como começa
**Decidido: o poço** (implementado: acordar deitado, olhar a luz no teto, ver `DESIGN.md` §12). A primeira sala tem um **buraco redondo no teto, com luz lá em cima**, alto demais para alcançar. Não há porta atrás de você: ninguém te trouxe, você foi **jogado**. Isso liga com o tema (você é um dado lançado) e dá o final de graça: a luz do começo é o destino.
- **Alternativa B:** acordar numa sala com a porta de trás trancada. Mais simples, mas some o tema do lançamento.
- **Alternativa C:** acordar numa cela. Mais comum e menos misterioso.

### A primeira mensagem (rascunho)
1. Tela preta, um baque surdo, poeira. A luz entra.
2. O dado fala, em glifos: `VOCÊ · CONDENADO · BOATO` ("dizem que você está condenado"). O jogador **não entende nada**, mas os símbolos vão para o diário.
3. Pensamentos do jogador, em português: ele acorda **sem nada**. A porta está trancada; um barulho no poço, ele vai até lá e vê, no alto, o **Escrivão**, que diz `VOCÊ VIVER ?` · `EU DAR DADO` · `VOCÊ LER` e joga o dado lá de cima (primeira aparição dele, de longe). O dado é quem fala com o jogador e vai para a sua mão. O giz só vem depois, deixado pelo Escrivão.
- **Detalhe:** essa primeira frase do dado só é entendida **no final do jogo**. Quando o jogador a relê, ela diz que ele foi acusado, e que ninguém nunca confirmou.

## Como a premissa é revelada cedo (palavras-chave)
O jogador não precisa de tudo, só de poucas palavras logo de início. Elas viram **puzzle do começo** (não opcionais): **VOCÊ, EU, ESCREVER, LER, SENTENÇA**.
1. Os 3 primeiros puzzles ensinam números e ACENDER.
2. No fim do capítulo 1, **o Escrivão aparece** escrevendo na parede: `EU · ESCREVER · SENTENÇA`. Cada símbolo brilha conforme ele escreve.
3. Em seguida ele escreve `VOCÊ · LER · SENTENÇA` com a marca de pergunta, e **espera**.
4. As frases das portas já vistas acendem uma depois da outra: a Casa inteira é uma frase. O jogador pensa: *"(Esta casa inteira é uma frase. E eu estou dentro dela.)"*
- Pronto: ele sabe que está preso a uma sentença, que ler é o caminho, e que o Escrivão é um aliado estranho. **Sem explicação, só demonstração.**

## Começo, meio e fim
**Começo (cap. 1, Fogo).** O poço, o Vestíbulo dos Números, o Escrivão. O jogador aprende a ler números e ACENDER, e a premissa.

**Meio (cap. 2 a 6).** Cada face do dado é um capítulo e um altar (Peso, Eco, Troca, Deslizar, Atravessar). Os diários de "a que veio antes" mostram erros e destinos. Os ecos dos Contáveis ensinam a lei. O Boato mente e diz a verdade. A virada do meio: o jogador descobre que **a sentença dele não tem a marca de confirmação**. Ele está condenado por um boato.

**Fim (cap. 7, o veredito).** A sala do Juiz: **parede lisa, sem ajuda**. O jogador escreve a última palavra de memória. Ele chega **pelo alto, sob a mesma luz do poço do começo**.

## Os três finais (decididos pela gramática, não por um menu)
- **Cumprir (confirmar a sentença).** O dado pousa sobre ela e vira fato. O Boato descansa. O jogador cumpre a pena.
- **Absolver (negar, com NÃO).** A frase é falsa. A Casa se desfaz. A acusação some, e o dado vira um dado comum, que pousa.
- **Repetir (DE NOVO).** O julgamento é lançado outra vez. O jogador **cai pelo poço de novo**, agora sabendo ler: a primeira frase do dado, que antes era ilegível, passa a ser legível.

## O epílogo: o dado das 21 gemas (decidido pelo Pedro)
**Não é um quarto final.** A gramática continua decidindo só entre Cumprir, Absolver e Repetir. O epílogo vem **depois de qualquer um dos três**, e só
para quem achou **as 21 gemas**.
- **As gemas.** São 21 no jogo todo, a soma das faces de um dado (1+2+3+4+5+6): **3, 3, 3, 4, 4, 4** por capítulo. Cada uma vai para um furo do
  **dado aberto em cruz** talhado no fundo do caderno (a parte dura de dentro da capa de trás). Elas enchem o dado **em ordem**, não por sala: a 1ª
  fecha a face 1; a 2ª e a 3ª, a face 2; da 4ª à 6ª, a face 3; e assim até a 21ª (`src/story/gems.ts`). No capítulo 1 são três: a da Cisterna (sala 5),
  a da Ala do Papel (sala 11) e a da constelação C6 (sala 21). Os outros 11 segredos do capítulo guardam **folhas arrancadas dela** (p8 a p18).
- **Os furos.** Em todo o jogo há exatamente **21 furos redondos de luz** nos tetos: os pontos do dado. **Só os redondos contam** (frestas, pátios e o
  claustro não). A Casa fica dentro do dado e o capítulo 1 é a borda (`DIRECAO_DE_ARTE.md` §9), então quase todos ficam nos capítulos 1 e 2; o **Poço**
  do começo é o furo do UM. Ninguém diz isso no jogo. Só as folhas dela, de leve: ela anota os furos, "só os redondos" (p8), e um dia para de contar (p18).
- **A cena.** O dado montado no fundo do caderno sai do livro: a cruz se dobra e vira um cubo. Zoom: ele está rachando, e a luz vaza pelos 21 furos.
  Ele rola e para no UM. O furo do UM é o Poço do começo: a câmera entra nele com a luz brilhando, tudo fica branco, e o jogador se vê caindo dentro do
  poço de novo. Um laço: **a Casa fica dentro do dado**.
- **Não é o Repetir.** O Repetir também volta ao poço, mas é o **julgamento recomeçando** (a sentença lançada outra vez, a primeira frase do dado
  agora legível). O epílogo é a **revelação da escala**: a mesma queda, vista de fora. Por isso alguma coisa tem de estar diferente na volta.
  **Decidido (Pedro): a boca do poço vazia.** A queda e o acordar são os mesmos, mas lá em cima não há ninguém: nem o Escrivão na mureta, nem
  `VOCÊ VIVER ?`, nem o dado caindo. Ninguém lança o julgamento; o jogador veio de fora e caiu sozinho. É a diferença mais clara para o Repetir (em
  que alguém joga o dado de novo), não precisa de palavra nenhuma e custa pouco (a abertura sem a cena do Escrivão). Fecha na luz redonda lá em cima,
  em silêncio. (As outras propostas do `narrador`, guardadas: ele acordar no ponto exato onde o dado caiu; uma sombra passando pela luz do furo.)
  - **Não:** a primeira frase do dado ficar legível (é o que o Repetir já faz) nem uma frase nova que diga a escala em glifos (o dado explicaria o
    que a cena acabou de mostrar).
- **Depois do epílogo (para bem depois, quando os finais existirem):** a ideia do Pedro é um **New Game Plus** com outras coisas, para qualquer
  final. Também fica para lá decidir a ordem com o Repetir, que também termina numa queda (o epílogo no lugar da queda do Repetir ou depois dela,
  com os créditos no meio).

## As folhas dela no capítulo 1
- São **18**: p1 a p7 e, nos segredos que não guardam gema, p8 a p18 (`src/story/herpages.ts`). A ordem do caderno é a do caminho da Casa, da sala 3
  à sala 20: ela escrevia por onde passava.
- **Fios que atravessam as folhas**, sempre de leve e sem resolver nada: os furos redondos do teto (p7, p8, p18), uma pedra que brilha e não serve em
  porta nenhuma (p10), o corpo que não sente sede nem fome (p11), o sonho dentro de uma mão fechada (p13), "o de capuz" que escreve "sobre mim" (p14,
  sem dizer se é bom), a lembrança de cair de muito mais alto, com a luz redonda ficando pequena (p16).
- **Erros plantados** (além da p4, "o que está talhado não mente", e da p6, PEQUENO = UM):
  - p12, "Ele nunca mentiu para mim": pavio longo; vira engano quando o dado mentir pela primeira vez.
  - p15, "aqui o seis não existe": nenhuma parede escreve o seis num glifo só, mas ele existe (a portinha dos seis pontos da Escadaria; na base 6 do
    Contador, UM ZERO).
  - p17, "um boato é igual à verdade": ela lê o UM de «UM BOATO IGUAL VERDADE» como artigo; é o número (exatamente um boato é verdade, como a câmara
    onde a folha está acabou de mostrar). Somado ao erro da p4, ela conclui que o que leram para ela é verdade, e para no meio da frase.
- O relato (as duas páginas do começo) é a última coisa que ela escreveu, depois que "a Casa apagou tudo de novo": por isso ali ela volta a "contar
  tudo", depois de ter parado na p18.

## Segredos opcionais (para depois)
Como nos Metroidvanias: dá para chegar ao fim sem ver quase nada. A profundidade é opcional: salas secretas, a língua inteira, os diários completos, o passado do Escrivão. Quem só passa correndo acha um final. Quem lê tudo acha o porquê. Quem acha as 21 gemas vê o epílogo.

## Decisões em aberto
1. ~~O poço é a abertura?~~ **Sim** (decidido).
2. **O dado mente.** Pode ser que o jogador só descubra isso no meio? Ou desde o começo?
3. **O Escrivão traiu ou protegeu?** Ele deixou a sentença sem confirmação por maldade ou porque não acreditou na acusação? Recomendo deixar **ambíguo**.
4. **Quem são os outros 2 NPCs?** (o Contador e o Juiz são proposta; "a que veio antes" é a diarista)
5. ~~O que muda na volta do epílogo?~~ **A boca do poço vazia** (decidido). Para depois: o New Game Plus e a ordem com a queda do Repetir.

## Duração e ritmo
O jogo deve durar **algumas horas** (meta 4 a 6 h), não 20 minutos. O dado começa com **só Fogo e Peso** e fica com eles por
um bom tempo; novas faces chegam por capítulo e nunca todas de uma vez (ver `DESIGN.md` §13).

## O tom da narração (decidido)
**Ler sem entender.** O jogador lê e pensa como quem está diante de algo que não compreende: constata o que vê, quase sem explicar, e só de vez em quando faz uma pergunta a si mesmo (o Pedro pediu menos indagações).
O caderno começa pelo **relato de "a que veio antes"** (duas páginas logo depois do índice: data perdida, "a Casa apagou tudo de novo", "acordei
embaixo da luz", "leram algo comprido para mim", "não acredite em tudo o que eu" — e para). Nada explica o jogo: nem o caderno, nem as legendas
das salas, nem os pensamentos. O subagente `narrador` (`.claude/agents/narrador.md`) guarda essas regras.

**Economia (decidido):** o personagem fala pouco, só nos momentos críticos, em frases curtas e assertivas, sem redundância.

## Decisões da revisão de coerência (narrador, com o Pedro)
- **A primeira frase do dado** é uma só: `VOCÊ · CONDENADO · BOATO` ("dizem que você está condenado"), ilegível no começo, legível no fim.
- **Ela erra:** a folha "O que está talhado não mente." é um erro plantado; O Boato Verdadeiro e o Tribunal mostram que o talhado também pode ser boato.
- **CONFIRMADO nas portas** só depois de a sala 8 (O Que a Casa Confirma) ensinar a marca; as portas antes dela não a têm.
- **O quiz** não traduz: as opções são só palavras ("confirmado", "boato"), sem a explicação entre parênteses.
- **O objeto é o "caderno"** em todo texto do jogo e da interface (nunca "diário" ou "livro" na tela).
- **De quem é o caderno se descobre lendo:** antes do relato nada diz "ela" (o índice mostra "Folhas"); só depois de ler "Dizem que estou condenada." o jogador sabe que era de uma mulher, condenada, e o índice passa a dizer "Dela".
- **A R5 (A Antecâmara Fria) fica no capítulo 1, entre as salas 16 e 17:** ela existe para ensinar o que a sala 17 pede (soquete frio → escuro → a
  moldura vazia mostra em cal uma frase CONFIRMADA e a Casa obedece). Enquanto as salas 15 a 17 não existem, fica logo antes do Tribunal.
