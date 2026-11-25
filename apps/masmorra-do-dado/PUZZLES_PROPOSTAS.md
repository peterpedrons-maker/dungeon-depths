# Propostas de puzzles (sessão de design de puzzles) — v2

> Arquivo da sessão de **projeto de puzzles**. Nada aqui está no jogo ainda: são propostas para o Pedro aprovar e para a
> sessão principal implementar. Quando uma sala for aprovada e implementada, a solução passa para `PUZZLES.md`.
> Toda sala com lógica combinatória ganha um verificador em `tools/verify_<nome>.mjs` que prova por força bruta que a solução é única.
>
> **v2 (pedido do Pedro):** repensar o capítulo 1 inteiro, da sala 3 em diante (as salas 1 e 2 ficam: são as do "descobrir que acende").
> Meta: puzzles inteligentes e difíceis, uma mecânica só (o fogo) levada ao máximo, epifanias, camadas escondidas e puzzles secretos,
> no espírito de *The Witness*. Pode inventar mecânica nova; a sessão principal implementa.

---

## 0. Princípios (o que eu tirei dos jogos que fazem isso bem)

1. **Uma mecânica, muitas leituras** (*The Witness*: é sempre "desenhar uma linha", mas a linha passa a significar outra coisa a cada área).
   Aqui é sempre **pôr fogo com o dado**, mas o fogo vai significando outra coisa: acender → **contar** → **escrever** → **correr** →
   **queimar** (apagar o que está escrito) → **iluminar** (fazer sombra) → **apagar** (o escuro também fala).
2. **O ambiente é o painel.** O maior momento do *Witness* é perceber que o cenário inteiro é um puzzle. Aqui: os glifos da língua são
   pontos numa grade 3×3, **e os números são as faces do dado** (UM = o centro, DOIS e TRÊS = a diagonal, QUATRO = os cantos, CINCO = o
   quincunce; confere em `tools/lexicon.mjs`). Então **braseiros em grade são escrita**. Primeiro num painel pequeno, depois no chão
   da sala, depois em coisas que o jogador nunca achou que eram uma grade.
3. **Ensinar sem palavras, em fileiras** (regra → torção → reprise; já aprovado em `DESIGN.md` §19). Uma sala pode ter **3 a 5 painéis
   pequenos** em sequência antes da porta, e não um puzzle só. Mais densidade, mais desafio, sem sala vazia.
4. **A primeira impressão engana, mas a armadilha se denuncia.** Quem lê errado chega a uma **contradição** ou a um resultado
   visivelmente errado, nunca a uma punição cega. Errar ensina.
5. **Epifania = reler o que já se viu.** As melhores viradas não trazem coisa nova: mostram que algo visto desde a sala 2 sempre esteve
   lá ("o escuro que a Casa faz quando eu erro… tinha escrita nele o tempo todo").
6. **"Resolvi… mas será que resolvi mesmo?"** Algumas salas têm uma **segunda leitura**: a porta abre com a resposta certa, mas a sala
   ainda mostra uma anomalia (um glifo a mais, um soquete frio, um painel que ninguém pediu). Quem olha de novo acha a camada escondida.
7. **Todo segredo tem uma anomalia à vista**, e o vocabulário visual é **consistente**: soquete com brasa = a Casa oferece
   (já existe, §25); **soquete frio, sem brasa** = acendível, mas a Casa não anuncia. Nada de caçar pixel.
8. **Conhecimento é a chave** (*Outer Wilds*, *Tunic*): vários segredos não pedem item nenhum, só **entender** algo aprendido depois.
   É isso que dá vontade de voltar às salas antigas (o mundo já é conectado e com volta livre).
9. **Sem tentativa e erro barata** (§18): o errado custa tempo (braseiros frios) e, quando dá, a Casa julga o **conjunto inteiro**, não cada passo.
10. **Nada irreversível que trave o jogo**: o que queima (pano, madeira, corda) volta quando o jogador sai da sala.
11. **Celular primeiro**: alvos pequenos (lampiões de um painel) são escolhidos pela **mira** (raio da câmera + posicionar), não por física fina.

---

## 1. A gramática do fogo (mecânicas)

| # | Mecânica | O que é | Existe? |
|---|---|---|---|
| M1 | **Lousa de fogo** | painel 3×3 de lampiões (na parede) ou 9 braseiros em grade (no chão). Os acesos formam um **glifo**. A frase da porta pode ter uma **casa lisa** que copia ao vivo o desenho da lousa. | **nova** |
| M2 | **Canaletas** | sulcos de óleo entre lampiões vizinhos, **descendo num sentido só** (a inclinação se vê). Pôr fogo num lampião faz o fogo **correr** e acender os de baixo. A plaquinha «ACENDER N» passa a significar **N ignições**. | **nova** |
| M3 | **O que queima** | **pano** (tapeçarias, estandartes), **madeira** (pranchas, pontes sobre canaletas), **corda**. Queimar é **apagar escrita** e mudar o caminho do fogo. Volta ao sair da sala. | **nova** |
| M4 | **Fumaça** | um braseiro aceso solta fumaça que **anda com o ar**: entorta na direção de frestas, panos que são paredes falsas, passagens. | **nova** (visual) |
| M5 | **Sombra** | uma tela de pedra furada entre os braseiros e a parede: cada braseiro aceso **projeta os furos** como pontos na parede, deslocados conforme a posição dele. A sombra **escreve**. | **nova** |
| M6 | **O escuro** | tinta de cal fosforescente que **só aparece no escuro total**. A Casa já apaga tudo quando o jogador erra (salas 2 a 7)… | **nova** |
| M7 | **Tempo** | chamas que duram pelo tamanho (sala 5 atual), fogo que **leva tempo** para correr numa canaleta. | parcial (`burn`) |
| M8 | **Frases** | CONFIRMADO/BOATO, ANTES/DEPOIS, acender frases, lei da contagem (salas 6 e Tribunal). | sim (`lit`, `lock`) |
| M9 | **A Casa escreve com fogo** | um painel M1 que **se acende sozinho**, em laço, mostrando glifos: a Casa fala em fogo. | **nova** |

**Convenção de material (proposta forte, mexe na história):** o que é **talhado na pedra** é da Casa (CONFIRMADO); o que é **tecido ou
pintado** é de alguém (BOATO). **O fogo queima o boato e deixa o confirmado.** Isso amarra a mecânica M3 ao tema do jogo.

---

## 2. O capítulo 1 inteiro (só Fogo), sala por sala

Curva: 1 e 2 ficam; da 3 em diante **só sobe**. Ficam **18 salas** no capítulo (o plano dizia ~16; o Peso entra logo depois).

| # | Sala | Nível | O que o jogador descobre | Mecânica | Palavra nova |
|---|---|---|---|---|---|
| 1 | O Poço | 1 | o dado acende | (fica) | ACENDER |
| 2 | O Vestíbulo | 1 | o número é exato | (fica) | DOIS |
| 3 | **A Lousa** | 2 | acender em grade é **escrever**; os números são **as faces do dado** | M1 | TRÊS, QUATRO, BRASEIRO |
| 4 | **O Fio de Fogo** ✔ | 3 | o fogo **corre**; «ACENDER UM» pode acender vários | M1+M2 | UM, CINCO |
| 5 | **A Casa Escreve** | 3 | a Casa fala em fogo; a ordem é lida numa lousa que pisca | M9 + ordem | (ORDEM implícita) |
| 6 | A Chama Curta | 4 | tempo e tamanho (a sala 5 atual, quase igual) | M7 | TEMPO |
| 7 | O Que a Casa Confirma | 5 | marcas; o dado acende frases (a sala 6 atual) | M8 | CONFIRMADO, BOATO, ANTES, DEPOIS |
| 8 | **O Pano** | 5 | **o fogo queima o boato**: o pano tecido mente, a pedra embaixo diz a verdade | M3 | (nenhuma) |
| 9 | **Os Apelidos** ✔ | 6 | o mesmo braseiro tem dois nomes; o glifo engana | M8 | GRANDE, PEQUENO |
| 10 | **A Ponte de Madeira** | 6 | o fogo **destrói o próprio caminho**: a ordem das ignições importa | M2+M3 | (nenhuma) |
| 11 | **O Boato Verdadeiro** ✔ | 6 | boato não é mentira; acender o que é VERDADE | M8 | VERDADE |
| 12 | **A Sombra** | 7 | a luz escreve pela sombra | M5 | (nenhuma) |
| 13 | **O Escuro** | 7 | **errar de propósito**: o escuro da Casa tem escrita | M6 | ESCURO |
| 14 | **A Lei Pequena** | 8 | 1ª lei da contagem; a resposta é escrita na lousa | M8+M1 | IGUAL |
| 15 | **O Fogo que Corre** | 8 | canaletas com tempo: dois fogos que se encontram se apagam | M2+M7 | (nenhuma) |
| 16 | **Os Que Dizem o Mesmo** | 9 | lei + boatos equivalentes + **queimar um boato muda a conta** | M8+M3 | (nenhuma) |
| 17 | **A Memória da Casa** | 9 | ensaio do Tribunal; uma pista só existe no diário (vista no escuro de outra sala) | tudo | TODOS, ORDEM |
| 18 | O Tribunal dos Rumores | 10 | (já existe) | M8 | — |

✔ = detalhada e com verificador. As outras têm solução descrita abaixo e ganham verificador quando forem detalhadas (uma por vez).

### Sala 3 — A Lousa (nível 2) · "acender em grade é escrever"
**Sala:** pequena, três **lousas de fogo** (M1) na parede direita, em fileira, e a porta no fundo.
1. **Lousa 1:** ao lado dela está talhado o glifo **DOIS** (o jogador já o viu na sala 2). Acender os dois lampiões da diagonal
   (cantos de cima à esquerda e de baixo à direita) faz o glifo talhado brilhar e abre uma grade. *Demonstração sem punição:* se o
   desenho não bate, nada acontece; os lampiões se apagam sozinhos depois de uns segundos.
2. **Lousa 2:** ao lado, o glifo **TRÊS** (novo, mas é o DOIS com o ponto do meio). Acender a diagonal inteira.
3. **A porta:** «ACENDER ▢ BRASEIRO». A casa lisa **copia ao vivo** o que está aceso na lousa 3 (epifania: "eu estou escrevendo na
   porta"). Na sala há **quatro braseiros já acesos pela Casa**, um em cada canto. É preciso escrever QUATRO, que o jogador **nunca viu**.
   Dedução: o DOIS e o TRÊS eram faces do dado. A face 4 do dado tem os **quatro cantos**. Acender os quatro cantos.
- **Solução:** lousa 1 = cantos 0 e 8; lousa 2 = 0, 4, 8; porta = 0, 2, 6, 8.
- **Camada escondida (S1):** atrás de uma coluna há uma 4ª lousa com **soquete frio** e, talhado acima dela, **um dado com cinco pontos**.
  Escrever o quincunce (0, 2, 4, 6, 8) abre um nicho com uma gema. É CINCO antes de alguém ensinar CINCO: só quem entendeu "número = face do dado".
- **Motor:** M1 (lampião = alvo pela mira; o painel compara o conjunto aceso com o glifo), casa lisa que espelha a lousa.

### Sala 4 — O Fio de Fogo (nível 3) · "o fogo corre" ✔ `tools/verify_fio.mjs`
**Sala:** fileira de 3 lousas com **canaletas** (M2) e, no chão do fundo, **9 braseiros em grade 3×3** ligados por canaletas grandes.
1. **Lousa 1 (demonstração):** dois lampiões e uma canaleta. Acender o de cima: o fogo desce e acende o de baixo.
2. **Lousa 2:** plaquinha «ACENDER UM» e o glifo **TRÊS**. Canaletas: do centro para os dois cantos da diagonal, e outras que vêm de fora
   (da casa 6 para o centro e para a 7; da 3 para o canto 0 e para a 1; da 7 para o canto 8; da 5 para a 2).
   **Solução: pôr fogo no centro (4).** O fogo desce para 0 e 8 e escreve TRÊS. Armadilhas: começar pelo canto 0 (o "começo da leitura")
   só acende ele; pôr fogo na 6 acende o TRÊS **e** a 7 (sobra fogo, a Casa apaga).
3. **Porta (o chão):** «ACENDER DOIS» e o glifo **CINCO** (talhado como um dado de cinco pontos). Canaletas: 2→4, 4→0, 4→8, 1→2, 5→8, 3→7, 7→6.
   **Solução: pôr fogo na 2 (canto de cima à direita) e na 6 (canto de baixo à esquerda).** Da 2 o fogo desce ao centro e dali aos cantos
   0 e 8; a 6 não tem canaleta que chegue nela de dentro do glifo, então precisa da 2ª ignição.
   **A primeira impressão engana:** a lição da lousa 2 era "comece pelo meio", e aqui o meio só acende 0, 4 e 8 e sobra uma ignição para
   dois cantos. Começar por 1, 3, 5 ou 7 acende uma casa de fora do glifo.
- **Por que é única:** o verificador testa todas as 9 ignições simples (lousa 2) e os 36 pares (porta): só {4} e {2, 6} escrevem
  exatamente o glifo; com uma ignição a porta é impossível; qualquer par com o centro falha.
- **Palavra nova:** UM aparece na plaquinha (é a face 1: o ponto do meio), CINCO no glifo talhado.
- **Motor:** M2 (propagação por canaletas dirigidas, ~0,6 s por canaleta, para o jogador VER o fogo correr), contador de ignições.

### Sala 5 — A Casa Escreve (nível 3) · "a Casa fala em fogo"
**Sala:** quatro braseiros com número no pedestal (UM a QUATRO) e, sobre a porta, uma lousa (M9) que **se acende sozinha em laço**:
mostra um glifo de número por 2 s, apaga, mostra o próximo… e um tempo escuro no fim do laço.
- O laço mostra **DOIS · QUATRO · UM · TRÊS** (escuro) e repete. A frase talhada da porta é só «ACENDER BRASEIRO»: a ordem não está na
  pedra, está no fogo.
- **Solução:** acender DOIS, QUATRO, UM, TRÊS. Errar apaga tudo (frios por 6 s).
- **Torção:** o laço não começa quando o jogador entra; começa no meio. É preciso perceber **onde ele começa** (o tempo escuro é o
  "ponto final"; depois dele vem o primeiro).
- **"Será que resolvi?" (S2):** com a porta aberta, a lousa continua em laço, mas agora **a cada três voltas** aparece um 5º glifo
  (CINCO) antes do escuro. Não há quinto braseiro… à vista. Um alçapão de grade no chão, com **soquete frio**, esconde um pequeno
  braseiro embaixo. Acender a sequência com o CINCO no fim (o dado cai pela grade e acende o de baixo) abre um nicho: uma página de
  diário de "a que veio antes".
- **Motor:** M9 (lousa animada pelo motor), alçapão com braseiro embaixo da grade.

### Sala 6 — A Chama Curta (nível 4) · a atual (tempo e tamanho), quase igual
Mantém a solução de `PUZZLES.md` (grande → médio-grande → médio-pequeno → pequeno).
- **Camada escondida para depois (S3, volta):** a fumaça do braseiro grande **entorta** sempre para a mesma parede, onde um trecho de
  "pedra" **balança de leve** com o ar. É um **pano pintado como pedra** (só se entende depois da sala 8). Queimado, mostra um corredor
  curto com um diário achado.
- **Motor:** M4 (partículas de fumaça com vento por sala), pano-parede.

### Sala 7 — O Que a Casa Confirma (nível 5) · a atual
Fica como está (ver `PUZZLES.md`). Ela ensina as marcas, e as salas 9, 11, 14, 16 e 17 dependem disso.

### Sala 8 — O Pano (nível 5) · "o fogo queima o boato"
**Sala:** quatro braseiros com número (UM a QUATRO). Na porta, a frase «ACENDER ▢ BRASEIRO CONFIRMADO» tem, pendurado sobre a casa do
meio, um **pano tecido** com o glifo **TODOS** e, bordado embaixo, a marca **BOATO**. Há outros dois panos na sala, nas paredes.
1. Acender os quatro (fazer "TODOS") → a Casa apaga tudo. A frase não aceita.
2. **Epifania:** o pano é de pano; a frase em volta é de pedra. O pano **tem a marca BOATO**. Atirar o dado de Fogo **no pano**: ele
   queima de baixo para cima (bonito, lento, 2 s) e mostra **o glifo talhado embaixo: DOIS**. A frase verdadeira é
   «ACENDER DOIS BRASEIRO CONFIRMADO». Mas quais dois?
3. Os panos das paredes também são boatos (marca bordada): um diz «TRÊS ANTES UM», o outro «QUATRO DEPOIS DOIS». Queimados, mostram as
   frases talhadas por baixo: **«UM QUATRO CONFIRMADO»** (a dupla) numa parede, e na outra nada (pedra lisa: o boato não escondia nada).
- **Solução:** queimar o pano da porta e o pano certo da parede; acender o UM e o QUATRO.
- **Por que é nível 5:** a regra é simples, mas exige a ideia que ninguém deu: **atirar o dado em algo que não é braseiro**, e ler a
  diferença pano × pedra pela marca. Quem queima tudo sem ler também resolve, mas perde a camada S4.
- **Camada escondida (S4):** o pano liso da parede (o que não escondia nada) **não** devia ser queimado: atrás dele, olhando de perto
  antes de queimar, a luz do braseiro atravessa o tecido e mostra uma silhueta de glifo (ESCURO) **ao contrário**. Queimado, perde-se
  nesta visita (volta ao sair). É a primeira pista da sala 13.
- **Motor:** M3 (pano queimável com revelação por baixo; restaura ao sair), luz atravessando pano (opcional).

### Sala 9 — Os Apelidos (nível 6) ✔ `tools/verify_apelidos.mjs`
(Detalhada na seção 5.) Cinco braseiros, um GRANDE sem número e o QUATRO pequeno; o glifo PEQUENO parece UM numa moldura e
o GRANDE parece QUATRO: quem lê pelo desenho cai em contradição. **Solução: TRÊS, GRANDE, QUATRO, DOIS, UM.**

### Sala 10 — A Ponte de Madeira (nível 6) · "o fogo destrói o próprio caminho"
**Sala:** grade de 9 braseiros no chão com canaletas (M2). Algumas canaletas passam **por baixo de pranchas de madeira** que servem de
ponte para **outras** canaletas cruzando por cima. Quando o fogo passa por baixo, **a prancha queima e cai**, e a canaleta de cima é cortada.
- A porta pede um glifo com **duas ignições**. Com a ordem A depois B o fogo de B ainda atravessa a ponte; com B depois A a ponte já caiu.
- A ideia: **a ordem das ignições** muda o resultado. Só uma ordem de um só par escreve o glifo.
- **Solução:** a definir com o verificador (busca em pares ordenados × posições de pontes), como fiz na sala 4.
- **Motor:** prancha que queima quando o fogo passa embaixo e desliga a canaleta de cima.

### Sala 11 — O Boato Verdadeiro (nível 6) ✔ `tools/verify_verdade.mjs`
(Detalhada na seção 5.) A porta diz «ACENDER VERDADE»: acender as frases verdadeiras, inclusive **boatos verdadeiros**, e a Casa só
julga quando o jogador acende a frase da porta. **Solução: as frases «1 DEPOIS 3», «4 DEPOIS 2», «3 ANTES 4» e «2 DEPOIS 3»; depois os
pilares TRÊS, UM, DOIS, QUATRO.**

### Sala 12 — A Sombra (nível 7) · "a luz escreve pela sombra"
**Sala:** no meio, uma **tela de pedra furada** (uns 5 furos). Em volta dela, 4 braseiros em posições diferentes. Na parede do fundo, uma
**moldura 3×3** talhada vazia. Cada braseiro aceso projeta os furos como **pontos de luz** dentro da moldura, deslocados conforme o lado
de onde vem a luz (o da esquerda joga os pontos para a direita etc.). Com dois braseiros acesos, as duas projeções se somam.
- A porta pede um glifo (ex.: QUATRO). Nenhum braseiro sozinho o forma; um par certo forma exatamente QUATRO dentro da moldura (os pontos
  que caem fora não contam).
- **Epifania:** o jogador vê os pontos de luz na parede ao acender o primeiro braseiro e percebe que **a luz escreve**, não o braseiro.
- **Solução:** a definir com o verificador (cada braseiro = um deslocamento da máscara de furos; busca nos pares).
- **Motor:** M5. Não precisa de sombra real: o motor calcula os pontos (máscara deslocada) e desenha manchas de luz na moldura.

### Sala 13 — O Escuro (nível 7) · "errar de propósito"
**Sala:** já começa com **todos os braseiros acesos pela Casa** e uma porta com a frase «ACENDER ▢ BRASEIRO» (lousa M1 ao lado).
Não há informação suficiente na sala para saber o que escrever.
- **Epifania:** toda vez que o jogador errou desde a sala 2, a Casa apagou tudo por um segundo. Aqui, se ele **errar de propósito**
  (acender um lampião a mais), a sala fica no **escuro total** por uns segundos e aparece, na cal fosforescente do teto, o glifo pedido.
  Errar vira ferramenta.
- **Solução:** errar uma vez, ler o glifo no teto (ex.: CINCO), escrever na lousa.
- **Camada retroativa (S5, a grande):** desde a sala 2, **toda sala tem uma palavra fosforescente** escondida, que só aparece no escuro
  da punição. Ninguém percebe na 1ª vez (dura 1 s e o jogador está olhando para o braseiro). Depois da sala 13, voltar e errar de
  propósito em cada sala revela uma palavra por sala. Juntas formam **uma frase** (ver S7).
- **Palavra nova:** ESCURO (a do pano da sala 8, agora no lugar certo).
- **Motor:** M6 (material que só aparece quando a luz da sala cai abaixo de um limite; a punição apaga também a luz ambiente por 2,5 s).

### Sala 14 — A Lei Pequena (nível 8) · 1ª lei da contagem
Quatro braseiros, duas confirmadas, três boatos e a lei «UM BOATO = VERDADE» (exatamente um boato é verdade). A resposta não é uma ordem:
é **o número** do braseiro que vem primeiro, escrito **na lousa** (junta M8 e M1). Ensina IGUAL. Verificador a fazer.

### Sala 15 — O Fogo que Corre (nível 8) · canaletas com tempo
Grade com canaletas longas e curtas (o fogo leva 1 a 3 s em cada). **Dois fogos que se encontram numa canaleta se apagam** (o óleo
já queimou). Com duas ignições em momentos diferentes, o encontro acontece num ponto ou noutro e corta ramos diferentes. Escrever o glifo
pedindo **quando** acender cada um (o segundo depois de o primeiro chegar a um certo lampião). Verificador = simulação em passos de tempo.

### Sala 16 — Os Que Dizem o Mesmo (nível 9) · "dizer é fazer"
Lei + boatos, como no Tribunal, mas os **boatos estão em panos** (M3). Com todos os panos, a lei não tem solução (contradição).
**Queimar um boato tira ele da conta.** Só queimando **o** boato certo (um que diz o mesmo que outro com outro nome: número × apelido) a
lei passa a ter **uma** solução. O jogador edita as provas. Verificador: busca em (boato queimado × ordem).

### Sala 17 — A Memória da Casa (nível 9) · ensaio do Tribunal
Cinco braseiros, apelidos, lei «DOIS BOATO = VERDADE», e uma das confirmadas **não está nesta sala**: está escrita no escuro (S5) de uma
sala anterior. O diário guarda (o jogador copiou ou carimbou). Porta: «ACENDER TODOS BRASEIRO ORDEM CONFIRMADO» (TODOS, ORDEM). Verificador a fazer.

### Sala 18 — O Tribunal dos Rumores (nível 10)
Como está (`PUZZLES.md`, `tools/verify_tribunal.mjs`).

---

## 3. Mapa dos segredos (três camadas, como em *Animal Well* / *Fez*)

| Camada | Como se acha | Segredos | Recompensa |
|---|---|---|---|
| **1 · Notar** | na mesma visita, olhando de novo | S1 (sala 3, o CINCO antes da hora), S2 (sala 5, o 5º glifo do laço), S4 (sala 8, o pano liso) | gemas, páginas de diário |
| **2 · Voltar** | entendeu algo depois e volta | S3 (sala 6, pano-parede, depois da sala 8), S5 (o escuro de cada sala, depois da 13) | diários, a frase escondida |
| **3 · Meta** | junta tudo | S6, S7, S8 | o porquê da história |

- **S6 · O soquete frio do poço (sala 1):** desde o começo há, embaixo do poço, um **soquete frio** (sem brasa). Não reage a nada na
  1ª vez (o jogador não tem o dado; depois, acender ali "não faz nada"… no claro).
- **S7 · A frase do escuro:** as palavras fosforescentes das salas 2 a 17, na ordem das salas, formam uma frase em glifos (proposta:
  algo como **«VOCÊ ACENDER POÇO ESCURO»**; o texto final eu escrevo com o léxico quando o Pedro aprovar). Ela manda voltar ao poço.
- **S8 · O poço no escuro:** na sala 1, pôr fogo no soquete frio **e** errar de propósito (a Casa apaga tudo, inclusive a luz do poço).
  No escuro, as paredes do tubo do poço mostram, em cal fosforescente, **o texto do Escrivão**: a frase da sentença do jogador **sem a
  marca de confirmação** (`HISTORIA.md`). É a virada da história escondida no 1º cenário do jogo.
- **Ideias guardadas para depois:** (a) o **mapa do diário** como lousa: as salas onde o jogador achou segredos formam um glifo no mapa
  (exige pôr as salas nas posições certas); (b) **SEIS não existe**: o dado tem seis faces, a língua é em base 6 («10» = UM ZERO); num
  capítulo posterior, duas lousas lado a lado sob um dado de seis pontos pedem UM e ZERO (o ZERO é um lampião dentro de um anel de pedra).

---

## 4. O que a sessão principal precisa construir (resumo)

| Prioridade | Peça | Para que salas |
|---|---|---|
| 1 | **Lousa de fogo** (M1): painel 3×3, alvo pela mira, comparação com glifo, casa lisa que espelha | 3, 4, 5, 13, 14 |
| 1 | **Canaletas** (M2): propagação dirigida e visível, contador de ignições | 4, 10, 15 |
| 2 | **Pano queimável** (M3) que revela pedra talhada e volta ao sair; pano-parede | 6, 8, 16 |
| 2 | **Escuro e cal fosforescente** (M6): a punição apaga também a luz ambiente; material que só aparece no escuro | 2–17 (S5), 13 |
| 3 | **Lousa animada da Casa** (M9) | 5 |
| 3 | `lock.judge: 'door'`, `FireLine.preLit`, brilho de PEQUENO | 9, 11 |
| 3 | Sombra calculada (M5), pranchas que queimam, tempo nas canaletas, fumaça com vento | 10, 12, 15, 6 |

---

## 5. As salas detalhadas

### Sala 9 — Os Apelidos (NÍVEL 6) · ensina GRANDE e PEQUENO

**A ideia:** um braseiro pode ser chamado pelo **número** ou pelo **tamanho**. As frases misturam os dois nomes, e a cadeia só fecha
quando o jogador percebe quem é quem **olhando a sala**. A armadilha é o próprio desenho dos glifos: no léxico, GRANDE é a moldura de
qualidade (⏐ ⏐) com os **quatro pontos dos cantos** (parece QUATRO) e PEQUENO é a mesma moldura com **um ponto no meio** (parece UM).
Quem lê "PEQUENO = UM" chega a uma **contradição** (não a outra resposta): percebe sozinho que leu errado, sem chutar.

```ts
export const FIRE_APELIDOS: FireSpec = {
  name: 'Os Apelidos',
  subtitle: 'Cinco braseiros. Um deles não tem número.',
  hx: 5.6, z0: -17, h: 3.8,
  braziers: [
    { x: -3.4, dz: 13.5, mark: 'n1' },                 // médio
    { x: 3.4, dz: 12, mark: 'n2' },                    // médio
    { x: -3.6, dz: 4.5, mark: 'n3' },                  // médio, perto da porta, à esquerda
    { x: 2.6, dz: 7.5, mark: 'n4', scale: 0.6 },       // PEQUENO (o maior número é o menor braseiro)
    { x: 0, dz: 9.5, mark: 'grande', scale: 1.5 },     // GRANDE, no meio da sala, sem número: o pedestal mostra o glifo GRANDE
  ],
  rule: { kind: 'order', seq: [2, 4, 3, 1, 0], hints: false, penalty: 10 }, // TRÊS, GRANDE, QUATRO, DOIS, UM
  words: ['acender', 'grande', 'antes', 'pequeno', 'conf'],                // a porta: «ACENDER GRANDE ANTES PEQUENO CONFIRMADO»
  tablets: [
    { lines: [{ words: ['n1', 'depois', 'n2', 'conf'] }, { words: ['grande', 'depois', 'n3', 'conf'] }], wall: 'left', dz: 9, size: 0.45 },
    { lines: [{ words: ['pequeno', 'antes', 'n2', 'conf'] }], wall: 'right', dz: 10, size: 0.45 },
  ],
  pillars: [[-1.8, 6.5], [1.8, 12.5]],
};
```
**Solução:** porta = GRANDE antes do PEQUENO (o 4); «1 DEPOIS 2» → 2 antes de 1; «GRANDE DEPOIS 3» → 3 antes do GRANDE;
«PEQUENO ANTES 2» → 4 antes de 2. Cadeia 3 → GRANDE → 4 → 2 → 1. **Acender TRÊS, GRANDE, QUATRO, DOIS, UM** (errar: frios por 10 s).
**Unicidade** (`node tools/verify_apelidos.mjs`): uma ordem só entre 120; sem qualquer uma das 4 frases sobram 5 a 10; ler pelo desenho
(PEQUENO = UM e/ou GRANDE = QUATRO) dá 0 ordens; só com as frases de número sobram 60.
**Como ensina sem explicar:** GRANDE está no pedestal do braseiro maior; PEQUENO por contraste; na porta, GRANDE e PEQUENO brilham com o
braseiro deles aceso. **Motor:** `mark: 'grande'` e o brilho de GRANDE já funcionam; falta mapear o brilho de `pequeno` para o braseiro de menor `scale`.

### Sala 11 — O Boato Verdadeiro (NÍVEL 6) · ensina VERDADE (e que boato ≠ mentira)

**A ideia:** na sala 7 (a das marcas) todo boato era falso, então o jogador aprendeu "boato = mentira". Aqui a porta troca a palavra:
**«ACENDER VERDADE»** (o glifo VERDADE é a marca CONFIRMADO dentro da moldura de conceito ⊓). É preciso acender **toda frase verdadeira**,
inclusive **boatos verdadeiros**, e nenhuma falsa. A verdade de cada boato se decide pela cadeia das confirmadas.

```ts
const f = (a, rel, b, mark, extra = {}) => ({ words: [a, rel, b, mark], ...extra });
export const FIRE_VERDADE: FireSpec = {
  name: 'O Boato Verdadeiro',
  subtitle: 'Algumas frases já estão acesas.',
  hx: 5.6, z0: -19, h: 3.8,
  braziers: [ // pilares escondidos, como na sala das marcas
    { x: -3.2, dz: 12.5, mark: 'n1', hidden: true },
    { x: 3.4, dz: 6, mark: 'n2', hidden: true },
    { x: 3.0, dz: 13, mark: 'n3', hidden: true },
    { x: -3.0, dz: 4.5, mark: 'n4', hidden: true },
  ],
  rule: { kind: 'order', seq: [2, 0, 1, 3], hints: false, penalty: 8 }, // TRÊS, UM, DOIS, QUATRO
  lock: { judge: 'door', penalty: 10 },                                // NOVO: a Casa só julga quando o jogador acende a frase da porta
  words: ['acender', 'verdade', 'conf'],                               // a porta: «ACENDER VERDADE CONFIRMADO»
  tablets: [
    { lines: [f('n1', 'antes', 'n2', 'conf', { preLit: true }), f('n2', 'depois', 'n1', 'boato', { preLit: true })], wall: 'left', dz: 17, size: 0.45, lit: true }, // demonstração (NOVO: preLit)
    { lines: [f('n1', 'depois', 'n3', 'conf', { good: true }), f('n4', 'antes', 'n1', 'boato')], wall: 'left', dz: 9, size: 0.45, lit: true },
    { lines: [f('n3', 'antes', 'n4', 'boato', { good: true }), f('n4', 'depois', 'n2', 'conf', { good: true })], wall: 'right', dz: 14, size: 0.45, lit: true },
    { lines: [f('n2', 'depois', 'n3', 'boato', { good: true }), f('n3', 'depois', 'n1', 'boato')], wall: 'right', dz: 6, size: 0.45, lit: true },
  ],
};
```
**Solução:** (0) a demonstração já acesa mostra «1 ANTES 2 CONFIRMADO» e «2 DEPOIS 1 BOATO» acesas: um boato aceso, porque diz o mesmo.
(1) Confirmadas: 1 antes 2, 1 depois 3, 4 depois 2 → cadeia **3 → 1 → 2 → 4**. (2) Boatos: «4 ANTES 1» falso; «3 ANTES 4» verdade;
«2 DEPOIS 3» verdade; «3 DEPOIS 1» falso. (3) Acender as duas confirmadas e os dois boatos verdadeiros; acender a frase da porta para a
Casa julgar (errado: apaga tudo, menos a demonstração, e recusa o fogo por 10 s). (4) Os pilares sobem: **TRÊS, UM, DOIS, QUATRO**.
**Unicidade** (`node tools/verify_verdade.mjs`): as confirmadas dão uma ordem só e cada uma é necessária; dos 64 conjuntos de frases só um
é consistente; "só as confirmadas" é recusado; "boato é sempre mentira" dá contradição; os boatos verdadeiros não repetem nenhuma
confirmada (só se provam pela cadeia). **Motor:** `lock.judge: 'door'`, `FireLine.preLit`, poder apagar uma frase acesa por engano, brilho de VERDADE.

---

## 6. Decisões para o Pedro
1. **Lousa de fogo e canaletas** viram o eixo do capítulo 1 (escrever com fogo)?
2. **Pedra = CONFIRMADO, pano = BOATO, o fogo queima o boato**: aprovar como regra do mundo?
3. **Errar de propósito** (o escuro da punição esconde escrita desde a sala 2): aprovar? Exige mudar a punição das salas 2 a 7 (apagar também a luz ambiente por ~2,5 s).
4. A recompensa dos segredos: só história (diários, a frase do poço) ou também um **4º final** escondido?
5. As salas atuais 3 (Os Quatro) e 4 (A Ordem) saem; as ideias delas entram nas novas 3 (TRÊS, BRASEIRO) e 5 (ordem). A 5 e a 6 atuais viram 6 e 7.
