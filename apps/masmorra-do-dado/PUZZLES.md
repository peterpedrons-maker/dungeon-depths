# Puzzles — soluções (spoilers!)

> Regra do projeto: **todo puzzle novo entra aqui com a solução** (e é explicado ao jogador/autor
> quando é criado).

Controles rápidos: **arremessar** (clique esq. / botão ARREMESSAR) · **posicionar** (botão direito, `G`,
botão POSICIONAR) · **trocar a face** (`1`–`6`, roda do mouse, botão GIRAR) · **dado ↔ giz** (`Tab`/`Q`,
botão GIZ/DADO). Faces: **1 Ricochete**, **2 Peso**, **3 Fogo**. O jogador **começa sem nada nas mãos**: o **dado** é achado na Sala 1 e o **giz** só na Sala 4 (cena do Escrivão). Interagir com o que está à frente (porta, giz no chão): **E** (PC) ou o botão **AGIR** (celular). O dado tem **Fogo (3) e Peso (2)**;
o **Ricochete (1) fica selado** por enquanto (só chega bem mais tarde; a gema escondida da Sala 4 espera por ele).
Ao acender um braseiro o dado queima: 1,5 s na 1ª vez de cada braseiro, ~0,3 s nas seguintes.
Olhar uns segundos para uma inscrição na parede manda os símbolos dela ao diário (como "avistado").

## Sala 1 — O Poço  (só ACENDER)
Você acorda no chão, **sem nada nas mãos**, olha o poço de luz no teto e a cena termina. A sala é pequena.
1. Vá até a **porta** (fundo da sala): aparece "E · Tentar abrir a porta" (no celular, o botão AGIR). **Não abre.** Logo em seguida você ouve **um barulho lá em cima**: a câmera vira para o poço e **o dado despenca pelo buraco**, bate no chão e para junto do entulho, brilhando. Ele "fala" em glifos (`EU CAIR`, `VOCÊ AJUDAR EU ?`) e depois **murmura** (`AJUDAR EU`, `VOCÊ VIR`, `EU ESPERAR`) a cada ~9 s enquanto você não o pega.
2. Você tem o controle: aproxime-se do dado e **pressione E / AGIR ("Pegar o dado")**. O dado voa para a sua mão, vem para o **centro da tela** (com faixas de cinema) e explica, uma frase curta por vez: `VOCÊ CONDENADO` · `EU BOATO` · `EU AJUDAR VOCÊ` · `ACENDER BRASEIRO` (com o desenho do braseiro).
3. Agora você tem o dado, na face **Fogo (3)**. Na parede esquerda da porta está talhada **uma só palavra: ACENDER**. Acenda o **único braseiro** (canto direito, perto da porta): arremesse o dado dentro da tigela ou posicione-o nela. O glifo brilha, o dado comemora (`VOCÊ ACENDER CONFIRMADO`, `EU SENTIR ALEGRIA`) e a porta abre. Se você demorar 50 s, ele repete o pedido.
- O dado queima ~1,5 s na 1ª vez (rápido nas seguintes). **Você ainda não tem o giz.**

## Sala 2 — O Vestíbulo  (ACENDER · DOIS)  — o salão comprido, com colunas
Três braseiros apagados; a frase diz DOIS (o símbolo de DOIS são dois pontos na diagonal).
1. Acenda **exatamente dois** braseiros (quaisquer). Com dois acesos a porta abre.
2. Se acender o **terceiro**, depois de ~1,5 s a Casa apaga todos ("dizer é fazer": o número tem que ser exato). Aí é só acender dois de novo.

## Sala 3 — A Lousa  (ACENDER · ▢ · BRASEIRO)  — NÍVEL 2 (acender em grade é ESCREVER; os números são as faces do dado)
Sala pequena e baixa. Logo na entrada, uma **grade de ferro** fecha o resto da sala. Na parede direita há **lousas de fogo**: um quadro de pedra com **nove lampiões em grade 3×3**. O dado de Fogo (arremessado ou posicionado mirando o lampião) acende o lampião mirado; os acesos ficam acesos. Ao lado de cada lousa há um glifo talhado numa moldura.
Regra das lousas: quando o conjunto aceso é **exatamente** o glifo, o glifo talhado brilha e a lousa trava acesa. Se passam **5 s sem lampião novo** e o desenho não bate, tudo se apaga (sem pena).
1. **Lousa 1** (antes da grade; glifo **DOIS** ao lado): acenda o **canto de cima à esquerda** e o **canto de baixo à direita**. A grade sobe.
2. **Lousa 2** (depois da grade; glifo **TRÊS**): acenda a **diagonal inteira** (canto, centro, canto). A **porta acorda**: os nove pontinhos de bronze da própria porta passam a acender (antes, o dado só bate seco).
3. **A porta é a lousa.** Acima dela: «ACENDER ▢ BRASEIRO», e a casa lisa **copia ao vivo** o que está aceso na porta. A frase tem de ficar **verdadeira**: quantos braseiros estão acesos? Há **quatro**: à esquerda da porta, à direita da porta, no meio da parede esquerda e **um num nicho alto em cima do arco da entrada** (atrás de quem entra). Quem conta só os da frente escreve TRÊS: depois de ~6 s a Casa lê, **não aceita** e os pontinhos se apagam.
4. A resposta é **QUATRO**, que ninguém ensinou: o DOIS e o TRÊS eram **faces de dado** (o **dado de pedra meio enterrado** no canto direito, perto da porta, mostra UM em cima e DOIS e TRÊS dos lados). A face quatro de um dado são **os quatro cantos**: acenda os **quatro cantos da porta**. A casa lisa mostra QUATRO, a Casa lê a frase (as palavras acendem uma a uma) e a porta abre.
- **Segredo S1 (gema):** atrás da **coluna esquerda**, na parede esquerda, há uma lousa com um **soquete frio** (pedra sem brasa) e um **dado de cinco pontos** talhado acima. Escreva **CINCO** (os quatro cantos e o centro): um nicho se abre ao lado, com uma **gema** (E / AGIR para pegar).
- **Por que é única** (`node tools/verify_lousa.mjs`): os números do léxico são as faces de um dado comum; cada lousa aceita 1 desenho entre 512; a frase só fica verdadeira com QUATRO; "quatro pontos quaisquer" são 126 desenhos e só a face do dado serve; acender os cantos um a um não abre nada antes do quarto.
- **Palavras novas:** TRÊS, QUATRO, BRASEIRO. **Dificuldade: 2 de 10.**

## Sala 4 — O Fio de Fogo  (ACENDER · DOIS + o glifo CINCO)  — NÍVEL 3 (o fogo CORRE; «ACENDER N» = N ignições)
A sala tem dois níveis: entra-se embaixo e **sobe-se a escada** junto da parede esquerda até um **balcão alto** (3 m), de onde se vê o chão inteiro; do outro lado do balcão, a escada da parede direita **desce** até o chão. No chão, **9 braseiros em grade** ligados por **canaletas de óleo** talhadas no piso, com **chevrons** que mostram para onde o óleo escorre. Pôr fogo num braseiro faz o fogo **correr** (~0,6 s por canaleta) e acender o do outro lado, e dali seguir adiante; cada canaleta por onde o fogo passou fica queimada (uma **linha**). A Casa lê a grade assim: **pontos** = braseiros acesos; **linhas** = canaletas queimadas (número = só os pontos; verbo = pontos e linhas).
**No balcão, três lousas** (uma ignição cada; quando o fogo para, ou escreveu o glifo e fica acesa, ou se apaga em ~3 s):
1. **Lousa 1** (dois lampiões e uma canaleta): demonstração. Fogo no de cima: desce e acende o de baixo.
2. **Lousa 2** («ACENDER UM» em cima, **TRÊS** ao lado): fogo **no centro**. Ele desce aos dois cantos da diagonal. (Armadilhas: o canto de cima à esquerda só acende ele mesmo; a casa de baixo à esquerda acende o TRÊS **e** sobra fogo.)
3. **Lousa 3** (**ACENDER**, o triângulo, ao lado; canaletas só nos três lados): fogo **em qualquer ponta**: o fogo corre em roda e **desenha as linhas** do glifo. Ensina que linha = fogo que correu.
**A porta** (no chão, embaixo): plaquinha «**ACENDER DOIS**» e um **CINCO** grande talhado sobre o arco. São **duas ignições** (dois soquetes ao lado da porta acendem conforme você as gasta). Canaletas (de → para): fundo-direita → centro; centro → fundo-esquerda e frente-direita; fundo-meio → fundo-direita; meio-direita → frente-direita; meio-esquerda → frente-meio; frente-meio → frente-esquerda ("fundo" = lado da porta; esquerda/direita de quem olha do balcão para a porta).
- **Solução: fogo no canto do FUNDO À DIREITA e no canto da FRENTE À ESQUERDA.** Do fundo-direita o fogo desce ao centro e dali aos cantos fundo-esquerda e frente-direita; o frente-esquerda não recebe fogo de dentro do glifo, então precisa da 2ª ignição. Resultado: os quatro cantos e o centro = CINCO.
- **A primeira impressão engana:** a lição da lousa 2 foi "comece pelo meio", mas aqui o meio acende só três e sobra uma ignição para dois cantos. Começar pelas casas do meio das bordas acende uma casa fora do glifo.
- **Errar:** quando as duas ignições acabaram e o fogo para sem escrever CINCO, em ~3 s a Casa apaga tudo e os braseiros ficam **frios por 4 s**.
- **Segredo S10 (para voltar depois):** no parapeito do balcão (à esquerda) há uma plaquinha «**DIZER IGUAL ▢**» · «**ACENDER UM**» com um **soquete frio**. Só se entende com o lema dos Contáveis, «DIZER IGUAL FAZER», de um diário que ainda não existe no jogo. Solução: **acenda o soquete frio** (o chão passa a aceitar só **uma** ignição e espera FAZER) e ponha fogo **só no canto do fundo à direita**: o fogo desce ao centro e dali aos cantos fundo-esquerda e frente-direita, e as canaletas queimadas desenham as três linhas de **FAZER**. Abre-se um nicho **sob o balcão** (do lado do chão) com uma gema. (Quem resolveu a porta acendendo o fundo-direita primeiro **já escreveu FAZER** sem saber.)
- **Por que é única** (`node tools/verify_fio.mjs`): lousa 2, só o centro escreve TRÊS; porta, dos 36 pares só {fundo-direita, frente-esquerda} escreve CINCO, com uma ignição é impossível e nenhum par com o centro serve; com uma ignição o chão só escreve FAZER (fundo-direita) e TRÊS (centro).
- **Palavras novas:** UM, CINCO. **Dificuldade: 3 de 10.**

## Sala 5 — A Casa Escreve  (ACENDER · BRASEIRO · ORDEM)  — NÍVEL 3 (a lousa é um MAPA)
Salão quadrado amplo com **9 colunas em grade 3×3**, todas com uma **tocha apagada**, e mais três tochas apagadas nas paredes. **Quatro colunas** têm um **braseiro sem número** ao pé. Sobre a porta, a **lousa da Casa** (9 lampiões) com o glifo **PORTA** talhado na borda de cima. Ela **se acende sozinha, em laço**: um lampião por ~1,5 s, apaga, o próximo… quatro quadros e então ~2,5 s de **escuro**, quando o glifo **ORDEM** da frase pulsa (é o "ponto final" do laço).
1. A lousa não mostra números (nenhum quadro é o ponto do meio): mostra **posições**. Ela tem a forma do salão (3×3, como as colunas) e o glifo PORTA diz que **o lado de cima da lousa é o lado da porta**. Cada ponto é uma coluna.
2. O laço começa logo **depois do escuro**. Quadros, em ordem: **meio-direita · fundo-esquerda · frente-meio · fundo-direita**.
3. **Acenda os braseiros ao pé dessas colunas, nessa ordem** ("fundo" = lado da porta). Errar a ordem apaga tudo e deixa os braseiros **frios por 6 s**.
- **A armadilha se denuncia:** quem lê a lousa de cabeça para baixo, espelhada ou girada manda pelo menos um quadro para uma **coluna sem braseiro**.
- **Por que é única** (`node tools/verify_casa_escreve.mjs`): lida como mapa, uma ordem entre 24; as leituras erradas caem em colunas vazias (3, 1 ou 4 quadros); começar o laço no meio dá ordens erradas.
- **Constelação C1 (gema):** com a porta aberta, **a cada três voltas** a lousa mostra um 5º quadro antes do escuro: **cinco pontos de uma vez**, os quatro cantos e o centro (**CINCO**), que não é de braseiro nenhum. Lido como mapa: **acenda as tochas das quatro colunas dos cantos e da coluna do centro, e nenhuma outra** (as tochas se apagam sozinhas em ~40 s; planeje o caminho). As **rachaduras frias** no chão (entre a coluna do centro e a da frente-meio) se abrem e um braseiro sobe; **acenda-o**: um nicho se abre na parede esquerda, perto da entrada, com uma **gema**. (`tools/verify_constelacoes.mjs`: 1 conjunto aceito entre 4096.)
- **Palavra nova:** ORDEM. **Dificuldade: 3 de 10.**

## Sala 6 — A Chama Curta  (ACENDER · QUATRO · BRASEIRO · TEMPO)  — NÍVEL 4
Salão **muito comprido** (27 m) com **quatro braseiros de tamanhos diferentes**: pequeno (junto da entrada, esquerda), médio-pequeno (direita), médio-grande (esquerda) e **grande** (direita, junto da porta). A frase é a das salas anteriores com a palavra **TEMPO** e fecha com a marca CONFIRMADO.
As chamas **se apagam sozinhas**; quanto maior o braseiro, mais dura: ~6 s, ~10 s, ~15 s e ~22 s (a chama encolhe quando está acabando). A porta só abre quando os **quatro estão acesos ao mesmo tempo** (e abre para sempre). As gemas do arco mostram quais estão acesos.
1. O jeito natural (do mais perto da entrada para o mais longe) **falha**: o pequeno apaga muito antes de você chegar ao último, e a sala é longa.
2. O certo: **grande → médio-grande → médio-pequeno → pequeno** (o que dura mais primeiro). Cada trecho leva uns 5 s entre andar, arremessar e recolher; o primeiro precisa durar mais que três trechos, o segundo mais que dois, o terceiro mais que um.
3. Se falhar, reacenda só o que apagou, desde que os outros ainda estejam acesos.
- O tempo **espera** durante as cenas de queima, conversas e o diário.
- **Dificuldade: 4 de 10**: a regra já é conhecida (sala do TEMPO antiga), mas agora exige **planejar o caminho e o tempo** com quatro braseiros.

## Sala 7 — O Que a Casa Confirma  (ACENDER · CONFIRMADO)  — NÍVEL 5 (ensina CONFIRMADO×BOATO e ANTES/DEPOIS)
Primeira sala do **dado que acende palavras**. Na parede há **sete frases** em três parágrafos pequenos (esquerda: 2 + 2 linhas; direita: 3 linhas). Cada frase é «X ANTES Y» ou «X DEPOIS Y» e termina numa **marca**: CONFIRMADO ou BOATO. **Não há braseiros à vista**: os quatro pilares estão escondidos sob o chão.
A porta diz «ACENDER CONFIRMADO»: **acenda as frases CONFIRMADAS**.
**Passo 1 — ler e acender (liberar o puzzle):** (dicas: cada frase acendível tem um **soquete com brasa fraca** no começo; no chão há **rachaduras com brasas** onde os pilares vão subir)
1. Com o **Fogo (3)**, arremesse (ou posicione) o dado **junto de cada frase CONFIRMADA** (na parede, perto do texto): a frase brilha em brasa, com uma chama ao lado.
2. As frases de **BOATO** não podem ser acesas: tocar uma delas **apaga todas as frases acesas** e a Casa **recusa o fogo por 4 s**. É preciso **ler a marca final de cada frase**.
3. As confirmadas são quatro: **TRÊS antes de UM · UM antes de QUATRO · QUATRO antes de DOIS · DOIS depois de UM**. Ao acender as quatro, ouve-se um estrondo e **os quatro pilares sobem do chão**, cada um com seu número.
**Passo 2 — acender os pilares na ordem:**
4. As frases confirmadas (que ficam acesas na parede) formam uma cadeia: **3 → 1 → 4 → 2**. Acenda os pilares **nessa ordem**: **TRÊS, UM, QUATRO, DOIS**. Os boatos (apagados) dizem o contrário (ex.: «DOIS antes de QUATRO»): quem os segue erra.
5. Se errar um pilar, a Casa apaga todos e os pilares ficam **frios por 8 s**.
- **O que o jogador aprende:** a marca no fim da frase **muda o que ela vale** (CONFIRMADO/BOATO); ANTES/DEPOIS dão uma ordem; o dado de Fogo também **acende escrita**, não só braseiros; um puzzle pode ter **dois passos** (liberar e resolver). O Tribunal (nível 10) vai exigir tudo isso.
- **Dificuldade: 5 de 10**: ler marcas (novas) + acender frases certas + deduzir a ordem por uma cadeia de ANTES/DEPOIS.

## Sala 8 — O Pano  (ACENDER · ▢ · BRASEIRO · CONFIRMADO)  — NÍVEL 5 (o fogo queima o BOATO)
Capela alta e estreita (teto de 7 m), seis pilares com tocha (apagada), quatro braseiros com número no pedestal (UM a QUATRO). O que é **talhado** na pedra é da Casa; o que é **tecido** é de alguém: cada **pano** tem a marca **BOATO** bordada embaixo. O dado de **Fogo** queima um pano (de baixo para cima, ~2 s) e mostra a pedra; os panos **voltam quando você sai da sala**.
| Onde | Pedra (talhado) | Pano por cima | Debaixo do pano |
|---|---|---|---|
| porta | «ACENDER ▢ BRASEIRO CONFIRMADO» | **TODOS** sobre a casa do meio | **DOIS** |
| parede esquerda, no alto | «▢ ANTES QUATRO CONFIRMADO» | **UM** sobre a 1ª palavra | **TRÊS** |
| parede direita, no alto | (nada) | «DOIS ANTES UM» inteiro | pedra lisa |
1. Lendo os panos: acender TODOS, com UM antes de QUATRO e DOIS antes de UM. Não dá certo (a Casa apaga tudo e os braseiros ficam frios por 8 s).
2. Repare que as palavras de pano têm **BOATO** bordado e são outro material. **Queime o pano da porta** (arremesse ou posicione o dado de Fogo nele): aparece **DOIS** → «ACENDER **DOIS** BRASEIRO».
3. **Queime o pano alto da parede esquerda** (arremessando): aparece **TRÊS** → «**TRÊS** ANTES QUATRO».
4. **Acenda o TRÊS e depois o QUATRO.** A porta abre.
- O pano da direita é boato puro: queimado, mostra pedra lisa. Quem acredita nele junto com a pedra cai em contradição.
- **Por que é única** (`node tools/verify_pano.mjs`): lendo a pedra, 1 resposta entre 64; acreditando nos panos, nenhuma aceita; queimar só um dos dois panos certos não basta.
- **Constelação C2 (gema):** os **frisos de pedra do teto** ligam só três pilares num **triângulo** com a ponta no meio da fileira do fundo: é o glifo **ACENDER**. **Acenda as tochas do pilar do meio do fundo (lado da porta) e dos dois pilares dos cantos da frente (lado da entrada), e nenhuma outra** (há iscas: uma perto da porta e duas na parede da entrada). O fogo corre pelos frisos e desenha o triângulo no teto; um braseiro sobe das rachaduras frias no centro; **acenda-o**: um nicho abre na parede direita, perto da entrada, com uma gema. (`tools/verify_constelacoes.mjs`: 1 conjunto entre 512; só ACENDER tem as linhas dos frisos.)
- **Dificuldade: 5 de 10.**

## Sala 9 — Os Apelidos  (ACENDER · GRANDE · ANTES · PEQUENO · CONFIRMADO)  — NÍVEL 6
Cinco braseiros: UM, DOIS, TRÊS e QUATRO com número no pedestal, e um **GRANDE**, no meio da sala, **sem número** (o pedestal mostra o glifo GRANDE). O **QUATRO é o menor** braseiro da sala (é o PEQUENO). Frases: parede esquerda «UM DEPOIS DOIS» e «GRANDE DEPOIS TRÊS»; parede direita «PEQUENO ANTES DOIS»; a porta: «ACENDER GRANDE ANTES PEQUENO» (todas confirmadas).
- **Armadilha:** o glifo PEQUENO parece UM numa moldura e o GRANDE parece QUATRO. Quem lê pelo desenho cai em **contradição** (nenhuma ordem fecha) e percebe que leu errado.
- **Dedução:** GRANDE = o braseiro grande do meio; PEQUENO = o QUATRO (o menor). Porta: GRANDE antes do 4. «1 depois 2» → 2 antes de 1. «GRANDE depois 3» → 3 antes do GRANDE. «PEQUENO antes 2» → 4 antes de 2. Cadeia: 3 → GRANDE → 4 → 2 → 1.
- **Solução: TRÊS, GRANDE, QUATRO, DOIS, UM.** Errar: tudo se apaga e os braseiros ficam frios por 10 s. Na frase da porta, GRANDE e PEQUENO brilham quando o braseiro deles está aceso.
- **Por que é única** (`node tools/verify_apelidos.mjs`): uma ordem entre 120; sem qualquer frase sobram 5 a 10; ler pelo desenho dá 0 ordens; só com as frases de número sobram 60.
- **Palavras novas:** GRANDE, PEQUENO. **Dificuldade: 6 de 10.**

## Sala 10 — O Boato Verdadeiro  (ACENDER · VERDADE · CONFIRMADO)  — NÍVEL 6 (boato não é mentira)
Como na Sala 7, as frases da parede se acendem com o dado de Fogo e há quatro pilares escondidos sob o chão. Mas a porta diz «**ACENDER VERDADE**»: acenda **toda frase verdadeira, inclusive boatos verdadeiros, e nenhuma falsa**. Acender ou apagar frases **não pune**; tocar de novo numa frase acesa a **apaga** (para desfazer um engano). A Casa **só julga quando você acende a frase da porta** (ela também tem um soquete com brasa).
0. **Demonstração** (parede esquerda, perto da entrada, **já acesa**): «UM ANTES DOIS CONFIRMADO» e «DOIS DEPOIS UM BOATO». Um boato aceso, porque diz o mesmo que a confirmada.
1. Confirmadas: **1 antes de 2** (a demonstração), **1 depois de 3**, **4 depois de 2** → cadeia **3 → 1 → 2 → 4**.
2. Boatos: «4 ANTES 1» falso; «3 ANTES 4» **verdade**; «2 DEPOIS 3» **verdade**; «3 DEPOIS 1» falso.
3. **Acenda as quatro:** «UM DEPOIS TRÊS» (confirmada, parede esquerda, perto da porta), «QUATRO DEPOIS DOIS» (confirmada, parede direita, perto da entrada), «TRÊS ANTES QUATRO» (boato, parede direita, perto da entrada) e «DOIS DEPOIS TRÊS» (boato, parede direita, perto da porta). Depois **acenda a frase da porta**. Errado: a Casa apaga tudo (menos a demonstração) e recusa o fogo por 10 s.
4. Os pilares sobem: **TRÊS, UM, DOIS, QUATRO** (errar: frios por 8 s).
- O hábito da Sala 7 («acender só as confirmadas») é recusado; "boato é sempre mentira" dá contradição.
- **Por que é única** (`node tools/verify_verdade.mjs`): dos 64 conjuntos de frases só um é consistente; as confirmadas dão uma ordem só.
- **Palavra nova:** VERDADE. **Dificuldade: 6 de 10.**

## Sala 11 — O Tribunal dos Rumores  — NÍVEL 10 (**provisório aqui**: a posição final é a sala 18, depois das salas da curva de `PUZZLES_PROPOSTAS.md` §2)
Puzzle de **leitura e lógica**, só com o dado de Fogo. **Cinco braseiros** com um **número no pedestal** (um a cinco) e **tamanhos diferentes** (o 3 é GRANDE, o 2 é PEQUENO, os outros são médios). Nas paredes há **sete frases** da forma «X ANTES Y» ou «X DEPOIS Y» (X e Y são números **ou** os apelidos GRANDE e PEQUENO, que só se resolvem **olhando os braseiros**). Cada frase termina com uma marca: **CONFIRMADO** (verdade; a frase tem moldura talhada) ou **BOATO** (talvez falso; a frase é gasta, sem moldura). Na porta estão a ordem do que fazer («ACENDER TODOS BRASEIRO ORDEM») e **a lei da casa**: «DOIS BOATO = VERDADE», isto é, **exatamente dois dos boatos são verdadeiros**.
Objetivo: acender os cinco **na ordem certa**. Errar apaga tudo e deixa os braseiros **frios por 12 s** (o dado só faz um som seco); **não há gema de progresso por passo**, então não dá para ir descobrindo aos poucos. Chutar não compensa (120 ordens).

**Chave de leitura (para o autor):**
| Frase | Marca | Significa | Na solução |
|---|---|---|---|
| 4 ANTES 1 | confirmado | o 4 acende antes do 1 | verdade |
| GRANDE ANTES 1 | confirmado | o 3 (grande) antes do 1 | verdade |
| 3 DEPOIS 5 | confirmado | o 3 depois do 5 | verdade |
| 2 DEPOIS 1 | boato | o 2 (pequeno) depois do 1 | **falso** |
| 4 DEPOIS PEQUENO | boato | o 4 depois do 2 | verdade |
| 1 ANTES PEQUENO | boato | o 1 antes do 2 | **falso** |
| 3 ANTES PEQUENO | boato | o 3 antes do 2 | verdade |

**Solução (ordem de acender): 5, depois 3, depois 2, depois 4, depois 1.**
**Como se deduz (sem chutar):**
1. Olhar os braseiros: o **GRANDE é o 3** e o **PEQUENO é o 2**. As frases falam do mesmo braseiro por dois nomes (a 2ª confirmada é «3 antes do 1»).
2. Com os **confirmados** (certos): 5 → 3 → 1 e também 4 → 1. O 2 ainda não tem lugar (15 ordens possíveis).
3. **Percebe-se que dois boatos dizem a mesma coisa**: «2 depois do 1» e «1 antes do **pequeno**» (= antes do 2). Então os dois são ambos verdadeiros ou ambos falsos.
4. A **lei** diz que exatamente dois boatos são verdade. Só há duas possibilidades: **ou esses dois** são os verdadeiros, **ou os outros dois**.
5. Testar a 1ª: se «1 antes do 2» é verdade, então 5 → 3 → 1 → 2; mas o outro boato «3 antes do 2»… seria falso, e isso exige o 3 depois do 2, **contradição** (o 3 vem antes do 1, que vem antes do 2). Descartada.
6. Então os verdadeiros são **«4 depois do 2»** e **«3 antes do 2»** (e os outros dois boatos são falsos, logo o 2 vem **antes** do 1): 5 → 3 → 2, e o 4 fica depois do 2 e antes do 1: **5, 3, 2, 4, 1**.
- **Provado por busca exaustiva** (`tools/verify_tribunal.mjs`, dados em `src/scene/rooms/tribunal.json`): a solução é **única**; sem qualquer uma das 7 frases ou sem a lei da contagem sobram **várias** soluções (nenhuma pista é descartável); só com os confirmados há 15 ordens; tratar todos os boatos como falsos dá 3 soluções e como verdadeiros dá 0; a ordem 1-2-3-4-5 não é a resposta.
- **Para o jogador anotar:** o diário (Notas e o mapa à mão livre) é a ferramenta natural: copiar as frases e riscar as hipóteses.
- **Vocabulário que as salas anteriores precisam ensinar antes** (a fazer): ANTES e DEPOIS, GRANDE e PEQUENO (a Sala 5 pode rotular os braseiros por tamanho), TODOS, IGUAL, VERDADE e o conceito de BOATO × CONFIRMADO (marcas), além dos números 1 a 5 e ORDEM (já existem).
- **Dificuldade: 9 a 10.** É o teto do capítulo de Fogo, não uma sala de início de jogo.


## RESERVA — salas fora do jogo por ora (voltam nos capítulos 2 e 3, usam Peso e/ou giz)
> As soluções abaixo continuam valendo para o código guardado (`vestibulo.ts` v3 e v4, `FIRE_ORDEM`, `room1.ts`, `room2.ts`, `room3.ts`, `room4.ts`, `FIRE_SEGREDO`). Os números das seções são os antigos. Os Quatro e A Ordem saíram quando entraram A Lousa e A Casa Escreve (as ideias delas estão nas novas).

### Os Quatro (antiga Sala 3) — (ACENDER · TRÊS · BRASEIRO)  — `vestibulo.ts` v3
Quatro braseiros apagados (nos quatro cantos); a frase diz TRÊS (três pontos na diagonal).
1. Acenda **exatamente três**. Com três acesos a porta abre.
2. Se acender o **quarto**, a Casa apaga todos depois de ~1,5 s. Acenda três de novo.
- Aqui o jogador vê (e o diário guarda) o símbolo de **TRÊS**: vai precisar dele na Sala 5.

### A Ordem (antiga Sala 4) — (ACENDER · DOIS · TRÊS · UM · BRASEIRO)  — `FIRE_ORDEM`
Sala larga (10 m) com duas colunas e **três braseiros**, cada um com um **símbolo talhado numa plaquinha no pedestal**: um ponto (UM), dois pontos (DOIS) e três pontos (TRÊS). Eles estão espalhados de propósito (TRÊS à esquerda, perto da entrada; UM à direita, no meio; DOIS à direita, perto da porta). A frase na parede ao lado da porta lista os números **fora de ordem**: DOIS · TRÊS · UM.
1. Leia a frase: a ordem de acender é **DOIS, depois TRÊS, depois UM**.
2. Acenda primeiro o braseiro marcado com **dois pontos**, depois o de **três pontos**, depois o de **um ponto**. A cada passo certo uma gema acende no arco da porta (são três).
3. Se acender um braseiro **fora de ordem** (quem assume "1, 2, 3" erra logo no 1º), ele acende, queima um instante e a Casa **apaga todos** (e as gemas). É só recomeçar.
4. Com os três na ordem certa a porta abre.
- O que o jogador aprende: uma sequência de números na frase é uma **ordem**; os símbolos nos objetos dizem qual é qual; errar é barato e dá resposta (a Casa apaga), sem texto.
- Ideia das próximas salas de ordem (mais difíceis): ordem pedida em palavras diferentes, braseiros sem plaquinha (a ordem vem da posição), uma ordem vista duas salas atrás.


### A Confirmação (Mastermind) — A Confirmação  (ACENDER · BRASEIRO · ORDEM · ?)  — dedução, nível 3
Sala média com **quatro braseiros iguais** (dois à esquerda, dois à direita, sem nenhuma marca). A frase **pergunta a ordem** (a marca ? no fim) e não a dá. O jogador acende os quatro, **em qualquer ordem**; quando os quatro estão acesos, a Casa **confirma** quantos estavam na posição certa: as **gemas do arco da porta** acendem na quantidade de acertos (só a contagem, não quais). Depois de uns 3 s ela apaga tudo para uma nova tentativa. Com os quatro certos a porta abre para sempre.
- **Resolver é deduzir, não adivinhar:** são 24 ordens possíveis, e cada contagem elimina várias. A contagem pode ser 0, 1, 2 ou 4 (3 é impossível: se três estão certos, o quarto também está). Um método: tente uma ordem; se a contagem for 1, troque só dois braseiros de lugar e veja se a contagem sobe, desce ou fica (isso diz qual deles estava certo); repita. Costuma levar de 3 a 5 tentativas.
- **A ordem certa desta sala** (para o autor): 1º o braseiro **da direita, do lado da porta**; 2º o **da esquerda, do lado da entrada**; 3º o **da esquerda, do lado da porta**; 4º o **da direita, do lado da entrada**.
- O que o jogador já sabe e reaproveita: a ordem importa (Sala 4) e as gemas do arco **confirmam** passos certos (Sala 4); a marca ? e a palavra ORDEM entram no diário.
- **Dificuldade: 3 de 10.** Próxima da mesma família: **cinco** braseiros ou **com tempo** (as chamas duram pouco, então cada tentativa vira uma corrida), e uma versão em que a ordem vem de números vistos em outra sala.

### A Entrada (antiga Sala 7) — A Entrada  (e a cena do Escrivão)
Ao andar até o meio da sala, **o Escrivão** (criatura encapuzada, de rosto coberto) aparece junto da parede esquerda e escreve
EU · ESCREVER · SENTENÇA e depois VOCÊ · LER · SENTENÇA ? (a câmera vira sozinha; é só olhar e avançar a conversa). Ele se vira para
você, some, e **deixa cair o giz no chão**: aparece "E · Pegar o giz". **Só a partir daí o jogador tem o giz** (Tab/Q para trocar com o dado).
O puzzle da sala:
A porta tem duas gemas: placa (esquerda) e fogo (direita). As duas precisam estar acesas.
1. **Fogo (3)** no braseiro do fundo, à direita: arremesse o dado dentro da tigela (ou posicione-o
   nela). A chama acende e a gema da direita também.
2. **Peso (2)** na placa de pressão (no chão, à esquerda, no meio da sala): posicione o dado em
   cima dela. A placa afunda e a gema da esquerda acende.
3. **Não recolha o dado** — ele segura a placa. A porta abre; atravesse o corredor.
   (Ao entrar na sala seguinte o dado volta pra mão e a porta fecha atrás de você.)
- **Gema escondida (opcional):** no nicho alto da parede direita. Só **arremessando** com
  **Ricochete (1)** — o dado *posicionado* não conta. (O Ricochete está selado no começo: dá para voltar aqui mais tarde.)

### A Lacuna (antiga Sala 8) — A Lacuna  (ACENDER · ▢ · BRASEIRO)  — o 1º puzzle com o giz
A sala é baixa e apertada. Os três braseiros já estão acesos. Na parede esquerda, a frase tem uma **placa lisa** no lugar da palavra do meio.
1. Conte os braseiros acesos: **três**. O símbolo de TRÊS é o que você viu na Sala 3 (e está no diário): **três pontos na diagonal**.
2. Pegue o giz (`Tab`/`Q`) e desenhe na placa três pontos: canto superior esquerdo, centro e canto inferior direito. Uma linha ligando os
   três também vale. Pontos nos outros cantos (os de QUATRO) **não** valem.
3. A porta abre. (Como o dado já tem Fogo e Peso, a sala não pede mais nada.)

### O Selo (antiga Sala 9) — O Selo
O Selo é uma grade 3×3 na **lousa** (ao lado da porta). Três peças, cada uma numa casa. Três gemas
sobre a porta acendem, uma por peça certa.

| Peça | Casa da grade | Onde está o fragmento |
|------|---------------|------------------------|
| Triângulo | cima, no meio | parede esquerda, perto da entrada |
| Círculo | centro | parede direita |
| Cruz (X) | embaixo, à direita | parede esquerda, no fundo (perto do braseiro) — **só aparece depois de acender o braseiro** com Fogo (3) |

1. Pegue o giz (`Tab` / botão GIZ) e leia os fragmentos nas paredes.
2. Acenda o braseiro do canto esquerdo do fundo com o **Fogo** para revelar o fragmento da cruz.
3. Na lousa, desenhe cada forma na casa certa. Traços limpos, tamanho de uns 2/3 da casa.
4. Muito rabisco anula as peças ("Rabisco demais"): apague (`botão direito` / modo APAGAR) e refaça.
5. Com as 3 gemas acesas a porta abre e fica aberta.

### O Salão das Brasas (antiga Sala 10) — O Salão das Brasas (sala redonda)
Três braseiros na parede; as gemas sobre a porta mostram quais estão acesos. Cada chama dura **40 s**
(encolhe nos últimos 8 s).
1. Com o **Fogo (3)**, acenda os **três** braseiros — rápido: arremesse, recolha (`E`), arremesse...
2. Troque para **Peso (2)** e **posicione** o dado na placa do centro. Com as três chamas acesas
   e a placa pressionada a porta abre.
3. Atravesse sem recolher o dado. Se uma chama se apagar, reacenda (a placa só vale com as três).

### O Mirante (antiga Sala 11) — O Mirante (dois níveis)
A porta e um braseiro ficam no **palco** (alto, no fundo); a placa fica **embaixo** (esquerda).
A única subida é a **rampa** da parede direita; a beirada do palco é queda livre (dá pra descer
pulando, mas a volta é pela rampa).
1. Suba a rampa e, do palco, acenda o braseiro (canto esquerdo do fundo) com o **Fogo (3)**.
2. Desça (rampa ou beirada) e **posicione o Peso (2)** na placa embaixo, à esquerda. Não recolha.
3. Suba de novo pela rampa e atravesse a porta do palco: ela só fica aberta enquanto o dado
   segura a placa lá embaixo.


## Sala de teste — A Placa que Julga  (`?lab=1`; Fogo + Peso + giz; fora do jogo principal)
Sala isolada para mostrar o que as três ferramentas fazem juntas. Abre com `…/masmorra-do-dado/?lab=1` (nada é salvo no aparelho; o dado e o giz já
estão nas mãos e as palavras da sala já estão no diário). Dados em `src/scene/rooms/lab.json`; `node tools/verify_lab.mjs` prova que a solução é única
e que nenhuma pista é descartável.

**Palavras novas (legenda):** SE, ENTÃO (a seta →), NÃO (o símbolo de "atravessar/não"), E, PLACA, e as marcas CONFIRMADO e BOATO do Tribunal.
- Porta: «ACENDER TRÊS BRASEIRO PLACA» + a marca CONFIRMADO no fim = acenda três braseiros e depois pese a placa (a placa é o juiz: confere o conjunto aceso).
- Lei da casa (ao lado da porta): «DOIS BOATO = VERDADE» = exatamente dois dos boatos são verdadeiros.
- As paredes têm **três parágrafos pequenos** (frases completas, uma embaixo da outra, alinhadas à esquerda, lidas de cima para baixo; cada frase termina na sua marca): um de 3 linhas na esquerda e dois de 2 linhas na direita.
- Frases: «SE a → b» (se a está aceso, b também); «SE a → NÃO b» (a e b nunca juntos); «a E b» (os dois acesos).

**Solução (spoiler): acender UM, DOIS e QUATRO e pesar a placa.**
1. No parágrafo da **parede direita mais perto da porta** a **1ª linha está lisa**: é uma frase CONFIRMADA apagada. Com o **giz**, risque por cima dela: as palavras
   aparecem. Ela diz «SE CINCO → UM».
2. Com os 3 confirmados (SE TRÊS → UM · SE CINCO → UM · TRÊS e CINCO nunca juntos) e a regra «três acesos», **o UM sempre está aceso** e sobram 5 conjuntos:
   123, 124, 125, 134, 145.
3. Teste cada conjunto contra os 4 boatos e a lei «exatamente dois verdadeiros» (um «SE» com o primeiro apagado é verdadeiro):
   123 → 1 verdadeiro ✗ · 125 → 1 ✗ · 134 → 3 ✗ · 145 → 3 ✗ · **124 → 2 ✓**.
4. Acenda 1, 2 e 4 (Fogo) e **pese a placa** (Peso, posicionar o dado nela). Se o conjunto estiver errado, a placa **abafa o fogo** (apaga tudo) e os
   braseiros ficam **frios por 6 s**: chutar não compensa. Para recomeçar, recolha o dado (`E`).

> **Convenção de escrita (atualizada):** as frases das portas das salas 1 a 6 mostram **só as palavras que a sala ensina** (uma nova por sala; ver `DESIGN.md` §24); a marca final (CONFIRMADO) volta a fechar as frases do Tribunal e da sala de teste. Os glifos **brilham** quando o que eles dizem acontece. As soluções não mudam.
