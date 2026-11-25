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
| 3 | **A Lousa** ✔ | 2 | acender em grade é **escrever**; os números são **as faces do dado** | M1 | TRÊS, QUATRO, BRASEIRO |
| 4 | **O Fio de Fogo** ✔ | 3 | o fogo **corre**; «ACENDER UM» pode acender vários | M1+M2 | UM, CINCO |
| 5 | **A Casa Escreve** ✔ | 3 | a Casa fala em fogo; **a lousa é um mapa** do salão | M9 + ordem | ORDEM |
| 6 | **A Chama Curta** ✔ | 4 | tempo e tamanho; **uma canaleta longa é um pavio** (o fogo espera) | M7+M2 | TEMPO |
| 7 | **O Que a Casa Confirma** ✔ | 5 | marcas; o dado acende frases; cadeia de ANTES/DEPOIS com 5 pilares (a sala 6 atual, revisada) | M8 | CONFIRMADO, BOATO, ANTES, DEPOIS |
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

### A forma de cada sala (nenhuma igual à anterior)
O motor liga as salas em fila, mas **dentro** de cada módulo a forma é livre (O Mirante já tem dois níveis e rampa; O Salão das Brasas já é redondo).
A forma não é enfeite: em várias salas ela **faz parte do puzzle**. Por exemplo, o óleo das canaletas **desce**, então a altura mostra para onde o fogo corre.

| # | Sala | Forma e tamanho | Por que essa forma |
|---|---|---|---|
| 3 | A Lousa | **pequena e baixa** (6×9 m, teto 2,8): um corredor íntimo com as lousas na parede | concentra o olhar nos painéis |
| 4 | O Fio de Fogo | entra-se por um **balcão alto** e **desce-se** uma escada até um chão com 9 braseiros | do balcão se **lê a grade inteira de cima**; embaixo se perde a visão de conjunto |
| 5 | A Casa Escreve | **salão quadrado amplo** (14×14, teto 5) com **9 colunas em grade** | a grade de colunas é a 1ª constelação (§3) |
| 6 | A Chama Curta | **galeria comprida** (27 m), opção: **um declive suave** (descer é rápido, voltar é lento) | o declive vira parte do cálculo de tempo |
| 7 | O Que a Casa Confirma | retangular média (como está) | — |
| 8 | O Pano | **capela alta e estreita** (8×14, teto 7), panos pendurados lá no alto, 6 pilares | panos altos exigem **arremessar**; frisos do teto = constelação |
| 9 | Os Apelidos | **rotunda** (redonda, ~12 m) com o GRANDE no centro | sala redonda não tem "começo" óbvio de leitura |
| 10 | A Ponte de Madeira | **fosso**: entra-se pelo alto, uma **rampa em espiral desce** pelas paredes até o fundo; pontes de madeira cruzam o vão | o fogo nas pontes se vê de cima; a ordem se planeja descendo |
| 11 | O Boato Verdadeiro | **sala em L** (duas alas) | as frases ficam em alas diferentes: não se vê tudo de um ponto |
| 12 | A Sombra | **salão escuro e amplo**, teto alto, a tela de pedra no centro | a luz projetada só se lê com escuro em volta |
| 13 | O Escuro | **pequena, baixa e opressiva** | o escuro total tem que assustar um pouco |
| 14 | A Lei Pequena | **sobe**: rampa até um **mezanino**; frases embaixo, lousa lá em cima | o jogador tem de **lembrar** (ou anotar) o que leu embaixo |
| 15 | O Fogo que Corre | **salão aberto** (20×20) em **plataformas de alturas diferentes** | a altura diz a direção do óleo |
| 16 | Os Que Dizem o Mesmo | **claustro**: pátio interno **a céu aberto** com galerias em volta | a sala mais aberta do capítulo, um respiro antes do fim |
| 17 | A Memória da Casa | **hub com três anexos** (§20, opção a) | a informação fica espalhada em câmaras |
| 18 | O Tribunal | (como está) | — |

### Sala 3 — A Lousa (nível 2) · "acender em grade é escrever" ✔ `tools/verify_lousa.mjs`
(Detalhada na seção 5.) Duas lousas de copiar (DOIS, TRÊS) e a **porta-lousa**: escrever na porta quantos braseiros estão acesos.
Um deles está num nicho atrás do jogador. **Solução: lousa 1 = diagonal curta (0, 8); lousa 2 = diagonal (0, 4, 8); porta = QUATRO, os quatro cantos.**

### Sala 4 — O Fio de Fogo (nível 3) · "o fogo corre" ✔ `tools/verify_fio.mjs`
(Detalhada na seção 5.) Balcão alto com três lousas de canaletas; embaixo, 9 braseiros no chão ligados por canaletas.
**Solução: lousa 2 = fogo no centro; lousa 3 = fogo em qualquer ponta do triângulo; porta (CINCO com duas ignições) = canto de cima à direita e canto de baixo à esquerda.**
Segredo de voltar depois (S10): com UMA ignição, o chão escreve FAZER.

### Sala 5 — A Casa Escreve (nível 3) · "a lousa é um mapa" ✔ `tools/verify_casa_escreve.mjs`
(Detalhada na seção 5, com a constelação C1.) Salão de 9 colunas; a lousa da Casa acende uma posição de cada vez, em laço: é o **mapa** do
salão. **Solução: acender os braseiros das colunas meio-direita, fundo-esquerda, frente-meio, fundo-direita.**

### Sala 6 — A Chama Curta (nível 4) · "o fogo que espera" ✔ `tools/verify_chama_curta.mjs`
(Detalhada na seção 5; **refaz** a sala 5 atual do jogo.) Antecâmara com um portão que só fica aberto enquanto a chama vive; depois, a
galeria com quatro braseiros que se apagam. Os dois mínimos ficam um em cada ponta, longe demais para a mão: o labirinto talhado no chão
perto da porta é um **pavio**. **Solução: acender o grande e o médio (o médio acende o pavio), voltar até o mínimo da entrada e acendê-lo
quando o mínimo do fundo pegar fogo sozinho.** Segredo de voltar depois: S3 (pano-parede).

### Sala 7 — O Que a Casa Confirma (nível 5) · revisada ✔ `tools/verify_confirma.mjs`
(Detalhada na seção 5.) A sala 6 atual do jogo, com **5 pilares** em vez de 4 (na versão antiga uma frase confirmada sobrava).
**Solução: acender as quatro frases CONFIRMADAS; os pilares sobem; acender QUATRO, UM, CINCO, DOIS, TRÊS.**

### Sala 8 — O Pano (nível 5) · "o fogo queima o boato" ✔ `tools/verify_pano.mjs`
(Detalhada na seção 5, com a constelação C2.) Panos tecidos (marca BOATO bordada) cobrem partes de frases talhadas. Queimados com o dado,
mostram a pedra. **Solução: queimar o pano da porta (TODOS → DOIS) e o pano da parede esquerda (UM → TRÊS); acender TRÊS e depois QUATRO.**

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

## 2b. Respiros: lugares livres entre os puzzles (pedido do Pedro)

O jogo não pode ser só "sala, puzzle, porta, sala, puzzle". De tempos em tempos o jogador entra num lugar **sem porta trancada**, onde ele
anda à vontade, olha, lê e acha coisas. É o descanso depois de uma sequência difícil e é onde o **mundo** se mostra: quem foram os
Contáveis, quem passou por ali antes, o que é a Casa. Também é onde ficam os segredos fáceis e os **atalhos** de volta.

**Regras dos respiros:**
- **Nada obrigatório.** A passagem para a frente está sempre aberta. Dá para atravessar em 1 minuto ou ficar 10.
- **Nenhuma mecânica nova obrigatória**, nenhuma punição, nenhum tempo correndo.
- Cada respiro tem **pelo menos um diário achado** (em português, de outros condenados), **uma inscrição do mundo** em glifos (só palavras
  conhecidas, no máximo uma nova, demonstrada) e **um pequeno puzzle opcional** (nível 1 a 3) com gema ou página de diário.
- Cada respiro tem **uma coisa que só faz sentido depois** (semente da camada 2), para dar vontade de voltar.
- Cada respiro abre um **atalho** para trás (uma grade que só abre deste lado), para a volta às salas antigas ser rápida.
- **Forma livre:** corredores que viram, pátios, escadarias, varandas com vista para salas já resolvidas. Nunca um retângulo com uma porta.
- No motor, um respiro é uma sala da lista como outra qualquer (a numeração e o mapa continuam automáticos), só que **sem trava na porta**,
  e pode ter **câmaras laterais** (§20, opção a).

**Ritmo do capítulo 1** (puzzle = P, respiro = R): P1 P2 P3 P4 · **R1** · P5 P6 P7 · **R2** · P8 P9 P10 P11 · **R3** · P12 P13 P14 · **R4** · P15 P16 P17 · P18 (Tribunal).
Os respiros não entram na numeração dos puzzles deste documento (para não renumerar tudo); no jogo a numeração das salas é automática.

### R1 · O Corredor dos Nichos (entre as salas 4 e 5)
- **Forma:** corredor estreito que vira três vezes, com **nichos** nas paredes, cada um com um objeto velho (uma tigela, um giz gasto,
  uma corrente). Luz baixa de velas. Numa curva, uma **janela de grade** para uma galeria distante.
- **O Escrivão de longe (2ª aparição):** pela janela, ele passa na galeria do outro lado, devagar, e some. Não dá para chegar lá (ainda).
- **Inscrição do mundo:** «ACENDER BRASEIRO» repetida acima de cada nicho, mas num nicho só aparece «ACENDER» e o resto está **quebrado**
  (a pedra caiu): a Casa é velha, as frases se gastam.
- **Puzzle opcional (nível 1):** pela parede, **dados talhados** mostram as faces 1, 2, 3, (nicho vazio), 5. No fim do corredor, uma lousa
  pequena ao lado do nicho vazio. **Solução:** escrever a face que falta, **QUATRO** (os quatro cantos). Abre o nicho: uma página de diário.
- **Diário 1 (de "a que veio antes"):** *"Os pontos são números. Os números são dados. Eu já sabia disso antes de cair aqui, só não
  sabia que sabia. Contei os nichos três vezes. Um está vazio. Tudo aqui está faltando um pedaço."*
- **Semente (camada 2):** um nicho tem uma **tapeçaria pequena** com um glifo tecido. Na 1ª passagem não dá para fazer nada (o jogador nem
  sabe que pano queima). Depois da sala 8, queimada, mostra embaixo uma palavra talhada que vai para o diário.
- **Atalho:** uma grade do lado direito abre para o balcão da sala 4.

### R2 · O Pátio da Cisterna (entre as salas 7 e 8)
- **Forma:** o **primeiro espaço aberto**. Um pátio quadrado alto, com galerias em volta em **dois andares** (escadas nos cantos) e, no
  meio, uma **cisterna** redonda com água parada. Lá no alto, muito acima, um **buraco redondo** deixa entrar luz pálida (é um "ponto" do dado:
  semente do S9, não comentada).
- **Inscrições do mundo:** nas galerias, frases curtas sobre os Contáveis com as marcas que o jogador acabou de aprender, por exemplo
  «CONTÁVEIS DIZER CONFIRMADO» e, gasta, «CONTÁVEIS MENTIR BOATO». (Palavras novas aparecem uma por frase e sem obrigação: são de história.)
- **Puzzle opcional (nível 2):** na beira da cisterna há uma pedra com o glifo **DOIS** talhado (a diagonal do canto de cima à esquerda
  ao de baixo à direita) e quatro braseiros apagados nos cantos do pátio, que se refletem na água como os cantos de uma grade. A pedra
  pede que **o reflexo** escreva DOIS. Quem acende a diagonal "certa" vê, na água, a **outra** diagonal (o reflexo inverte de cima para
  baixo). **Solução:** acender os dois braseiros da diagonal contrária (o canto do fundo à direita e o da frente à esquerda); na água
  aparece o DOIS e sobe uma gema do fundo da cisterna. Prepara o "ver de outro ponto de vista" das constelações C3 e C4.
- **Diário 2:** *"Aqui o que está talhado não mente. O que alguém só disse, mente às vezes. Eu acendi uma frase de boato e a Casa me
  apagou como quem apaga uma vela. Acho que eles não gostavam de quem repete o que ouviu."*
- **Semente (camada 2):** um **estandarte tecido** pendurado alto na galeria de cima, com a marca BOATO bordada. Na sala 8 o jogador
  aprende que pano queima. Voltando, queima o estandarte: atrás dele, uma **porta secreta** para uma câmara com diário e gema.
- **Atalho:** a galeria de baixo tem uma grade que dá para o fundo da sala 6 (a galeria comprida).

### R3 · A Galeria dos Condenados (entre as salas 11 e 12)
- **Forma:** galeria longa e alta, com **bancos de pedra** e, nas paredes, centenas de **marcas de contagem** riscadas a giz por outros
  condenados (dias? tentativas?). Algumas paredes têm desenhos de giz de outras pessoas: um braseiro, uma porta, um rosto apagado.
- **O Escrivão de longe (3ª aparição):** sentado no fim da galeria, escrevendo. Quando o jogador se aproxima, ele se levanta e some
  numa porta que não estava lá. Deixa no banco uma marca de giz fresca.
- **Inscrição do mundo:** a frase «CONDENADO LER SENTENÇA» talhada sobre a porta de saída (CONDENADO e SENTENÇA já foram vistas: o dado diz
  VOCÊ CONDENADO na sala 1). Primeira vez que o jogador vê a palavra SENTENÇA na pedra.
- **Puzzle opcional (nível 3):** quatro frases riscadas a giz por condenados (boatos, porque giz não é pedra) sobre "qual braseiro
  acender primeiro" numa câmara lateral com três braseiros; uma frase talhada (confirmada) diz quantos dos boatos são verdade. É a 1ª
  vez que o jogador vê uma **lei da contagem**, sem obrigação (prepara a sala 14). Solução a fechar com verificador quando chegarmos lá.
- **Diário 3 (que erra):** *"O símbolo com o ponto no meio e as duas barras do lado quer dizer UM, tenho certeza."* (é PEQUENO; quem fez a
  sala 9 sabe que ela errou: os diários nem sempre acertam.)
- **Semente:** uma das marcas de giz é um **rosto** igual ao do dado, quase apagado (eco bem fraco do S11).
- **Atalho:** escada lateral que desce até o pátio R2.

### R4 · A Escadaria (entre as salas 14 e 15)
- **Forma:** um poço vertical largo com uma **escada em espiral** subindo pelas paredes. Em cada volta, uma **janela** dá para uma sala já
  resolvida, vista **de cima** (a sala 5 com suas 9 colunas; o fosso da sala 10; a capela da sala 8). O mundo é conectado: o jogador entende
  onde está.
- **Puzzle opcional (nível 3):** da janela que dá para a sala 5, **vista de cima**, as colunas da sala formam a grade inteira. Se a constelação
  C1 já foi feita, a câmara secreta dela aparece acesa. Se não, é a dica mais clara de que aquelas colunas eram uma grade.
- **Diário 4:** *"Contei as faces de tudo aqui. Salas de quatro cantos, buracos redondos no teto, sempre um, dois… Esta casa tem a forma
  de alguma coisa que eu conheço. Não consigo lembrar do quê."* (dica suave do S9.)
- **Semente:** no topo, uma porta com **seis** pontinhos de bronze (a face seis, que a língua não tem): só se abre num capítulo posterior.
- **Atalho:** a escada desce até a Galeria R3.

## 3. Constelações: tochas que escrevem (ideia do Pedro) ✔ `tools/verify_constelacoes.mjs`

**A regra.** Algumas salas têm pilares com tochas. **Vistas de cima**, as posições caem numa grade 3×3 (a mesma das lousas). Acender
**exatamente** as tochas que formam um glifo, e nenhuma outra, faz **subir um braseiro no centro** (pelas mesmas rachaduras de brasa da
sala das marcas, só que **frias**). Acendê-lo abre uma **porta secreta**: uma câmara com uma **gema** (o colecionável dos 100%) e, às
vezes, um **diário** que ensina vocabulário de história. Os **verbos** têm linhas: elas aparecem como **frisos de pedra no teto**
entre os pilares, e quando as tochas das pontas acendem, o fogo corre pelo friso e **desenha a linha** (é a canaleta M2, no alto).

**Decisões do Pedro:**
- **No capítulo 1, toda constelação se resolve só com o Fogo** (acender tochas; o glifo pode ser um número ou o verbo ACENDER). A partir
  do capítulo 2, as constelações passam a pedir as ferramentas novas, **em paralelo** com os puzzles principais (§3c).
- **Sempre tochas a mais.** Nunca só as tochas do glifo: a sala tem tochas em **todos** os pilares e colunas, mais tochas nas paredes.
  O verificador exige pelo menos tantas tochas sobrando quanto tochas no glifo. O que diz quais acender é a **pista**, nunca a quantidade.
- **Gemas, diários e um 4º final**, mas o 4º final **se acumula**: não se ganha numa sala secreta, ele muda o fim do jogo (§3d).

**Por que não é demais:** nunca é obrigatória, usa a mesma língua do resto do jogo (o jogador já escreveu nas lousas), e só aparece em
algumas salas. Para não virar chute:
- **o conjunto é exato** (acender todas as tochas não resolve, e há tochas-isca nas paredes, fora da grade);
- as **tochas se apagam sozinhas** depois de uns 40 s: chutar custa caminhar e esperar, ler é mais rápido;
- **toda constelação tem uma pista que aponta para UMA palavra** (o verificador confere isso);
- o **sinal** é sempre o mesmo: **rachaduras frias** no chão do centro (sem brasa). Depois da 1ª vez, o jogador reconhece.

**Escalada (cada uma com uma pista mais escondida):**

| # | Onde | A pista | Glifo | Camada |
|---|---|---|---|---|
| C1 | Sala 5, salão de 9 colunas (todas com tocha + 3 de parede) | depois de a porta abrir, a lousa da Casa mostra às vezes um 5º glifo, **CINCO**, que não é de braseiro nenhum | CINCO | ensina que constelações existem; nasce do "será que resolvi?" |
| C2 | Sala 8, capela de 6 pilares | os 6 pilares têm tocha; os **frisos do teto** só ligam três posições num **triângulo** | ACENDER | 1º verbo; olhar para cima |
| C3 | Sala 10, o fosso | tochas no **alto** (na borda) e no **fundo**: só **de cima, olhando para baixo**, elas caem na grade | (número do fosso) | perspectiva: a grade só existe de um ponto de vista |
| C4 | Sala 12, A Sombra | não há tochas na grade: a **sombra das colunas** que a tela projeta é que cai nas casas | (a definir) | a constelação é de sombra, não de fogo |
| C5 | Sala 13 em diante | a palavra da constelação de cada sala **só aparece no escuro** (S5): errar de propósito diz o que desenhar | (uma por sala) | junta as constelações com o escuro |
| C6 | Salas 15 e 16 | um verbo **atravessa a porta**: metade das tochas numa sala, metade na outra, ligadas pelo friso do corredor | DE NOVO | o glifo maior que uma sala |
| C7 | Volta às salas 1 a 4 | as **colunas do Vestíbulo** (sala 2) sempre tiveram suportes vazios: tochas que o jogador nunca acendeu | (a frase do escuro) | a grande volta ao começo |

Detalhadas e verificadas: **C1** (9 tochas de coluna + 3 de parede: 1 conjunto aceito de 4096; as colunas escrevem 38 palavras,
a pista mostra uma) e **C2** (6 tochas de pilar + 3 iscas: 1 de 512; as tochas conseguem escrever 11 palavras, mas **só ACENDER tem as
linhas dos frisos**).

**Como resolver C1:** depois de abrir a porta, espere o laço da lousa: aparece CINCO (os quatro cantos e o centro). Acenda as tochas das
quatro colunas dos cantos e da coluna do centro, nenhuma outra. Um braseiro sobe das rachaduras frias; acenda-o; a câmara abre.
**Como resolver C2:** olhe o teto: os frisos formam um triângulo com a ponta no meio da fileira do fundo (o glifo ACENDER, a 1ª palavra
do jogo). Acenda a tocha do pilar do meio do fundo e as dos dois pilares dos cantos da frente; o fogo corre pelos frisos e desenha o
triângulo; o braseiro sobe no centro.

**Motor:** tocha de parede/pilar acendível pelo dado (com tempo de chama), "grade de constelação" por sala (que tocha é qual casa),
rachaduras frias + braseiro que sobe (já existe: `hidden`), friso no teto com fogo correndo (M2), porta secreta com câmara.

## 3c. Constelações e ferramentas evoluem juntas (por capítulo)
Cada face nova muda **o puzzle principal e a constelação ao mesmo tempo**. A constelação de um capítulo usa tudo o que o jogador já tem.

| Cap. | Face nova | Puzzles principais | Constelações |
|---|---|---|---|
| 1 | Fogo (ACENDER) | lousas, canaletas, panos, sombra, escuro, frases | **só acender tochas**; pistas: lousa, frisos, perspectiva, sombra, escuro, glifo que atravessa a porta |
| 2 | Peso (IGUAL) | placas que pesam o número da face, balanças | uma tocha só **conta** quando está na altura da grade: pilares com **contrapeso** sobem e descem com o Peso; e **placas como pontos** (o glifo é feito de placas, e cada uma pede um peso) |
| 2–3 | giz | escrever em lacunas; o giz **lê** (esfregar mostra o liso) | **linhas de giz** no chão entre tochas fazem o papel do friso: o jogador desenha a linha que falta |
| 3 | Eco (DE NOVO) | repetir a última ação | o glifo tem que ser **traçado na ordem de escrita** (moldura → ligações → pontos, como `writing.ts`); o Eco repete um traço longe |
| 4 | Troca (EM VEZ DE) | trocar estados ou palavras | uma tocha **presa** fora do lugar: trocar o estado dela com o de uma tocha da grade |
| 5 | Deslizar (ENTÃO) | sequências, trilhos | o fogo **desliza** por trilhos de tocha em tocha; a constelação vira um caminho com começo e fim |
| 6 | Atravessar (NÃO) | negar, apagar | **a constelação em negativo**: o glifo é o das tochas **apagadas** numa sala toda acesa ("NÃO acender") |

## 3d. O 4º final: o que se acumula
Os três finais já nascem da gramática (`HISTORIA.md`: cumprir, absolver, repetir), escritos na sala do veredito. O 4º segue a mesma
regra: **é uma frase que o jogador escreve no fim**, mas que ele só consegue escrever se tiver juntado, ao longo do jogo, três coisas:
1. **As palavras:** **LANÇAR** e **CASA** (as duas existem no léxico) só aparecem nos **diários das câmaras secretas**. Sem elas não há como escrever a frase.
2. **O entendimento:** que **a Casa é um dado** (S9). Ninguém diz isso; o jogador junta os poços e as faces no mapa.
3. **O dado inteiro:** as gemas de cada capítulo desenham aquela **face** no mapa (S9). Com as seis faces completas, a Casa está
   "inteira", e um dado inteiro pode ser lançado. Com face faltando, a frase é escrita, mas a Casa não responde.
- **O 4º final: «LANÇAR CASA».** Em vez de cumprir, negar ou repetir a sentença que nunca foi lançada, o jogador **lança a Casa inteira**:
  quem decide o veredito passa a ser o dado, como os Contáveis faziam. O jogador sai pelo poço e vê, de fora, o dado gigante rolar e pousar.
- É um final de **conhecimento e coleção juntos**: quem fez 100% mas não entendeu não sabe escrever a frase; quem entendeu mas não
  juntou as faces escreve e nada acontece.
- **A decidir:** o que o dado pousado mostra (uma face fixa ou acaso de verdade), e se o 4º final destrava algo (o "Repetir" com tudo entendido?).

## 3b. Mapa dos segredos (três camadas, como em *Animal Well* / *Fez*)

| Camada | Como se acha | Segredos | Recompensa |
|---|---|---|---|
| **1 · Notar** | na mesma visita, olhando de novo | S1 (sala 3, o CINCO antes da hora) e as constelações C1 e C2 (§3) | gemas, páginas de diário |
| **2 · Voltar** | entendeu algo depois e volta | S3 (sala 6, pano-parede, depois da sala 8), S5 (o escuro de cada sala, depois da 13) | diários, a frase escondida |
| **3 · Meta** | junta tudo | S6, S7, S8 | o porquê da história |

- **S6 · O soquete frio do poço (sala 1):** desde o começo há, embaixo do poço, um **soquete frio** (sem brasa). Não reage a nada na
  1ª vez (o jogador não tem o dado; depois, acender ali "não faz nada"… no claro).
- **S7 · A frase do escuro:** as palavras fosforescentes das salas 2 a 17, na ordem das salas, formam uma frase em glifos (proposta:
  algo como **«VOCÊ ACENDER POÇO ESCURO»**; o texto final eu escrevo com o léxico quando o Pedro aprovar). Ela manda voltar ao poço.
- **S8 · O poço no escuro:** na sala 1, pôr fogo no soquete frio **e** errar de propósito (a Casa apaga tudo, inclusive a luz do poço).
  No escuro, as paredes do tubo do poço mostram, em cal fosforescente, **o texto do Escrivão**: a frase da sentença do jogador **sem a
  marca de confirmação** (`HISTORIA.md`). É a virada da história escondida no 1º cenário do jogo.
- **S10 · «DIZER IGUAL FAZER» (sala 4, camada 2):** a plaquinha fria do balcão só se entende com o lema dos Contáveis, achado num diário
  bem depois. Com uma ignição, o chão da sala 4 escreve FAZER (ver a sala 4 na seção 5).
- **S11 · O rosto do Boato (capítulo final; ideia do Pedro):** numa sala do último capítulo, a **saída fica no alto** (o jogador sobe
  uma rampa ou escada até a porta). Lá embaixo, a sala está cheia de **ruínas**: colunas tombadas, rachaduras, entulho, dois braseiros.
  **De um ponto exato perto da saída**, olhando para trás e para baixo, as ruínas formam **o rosto do dado**: as colunas tombadas são as
  sobrancelhas e a boca, uma rachadura é o nariz, os dois braseiros são os olhos (o rosto só "liga" com os dois acesos). De qualquer
  outro lugar, é só entulho. Não pode ser escancarado: quem está atento percebe.
  - **Por que no fim e não antes:** a dica é forte demais. Quem vê o rosto entende que **a Casa é um dado** (S9), e isso explica tudo o
    que vem depois. Perto do fim ela vira **confirmação**: quem já tinha percebido sente "eu sabia"; quem não tinha ganha a epifania a
    tempo de entender o resto (os poços, as faces do mapa, o 4º final).
  - **O rosto olha de volta:** o dado é o Boato, "o boato sobre você". Se a Casa tem o rosto dele, o jogador passou o jogo inteiro
    **dentro do boato**. É uma virada de história, não só de puzzle.
  - **Não entrega o 4º final:** ver o rosto dá o *entendimento*; o 4º final continua pedindo as palavras (LANÇAR, CASA) e as seis faces (§3d).
  - **Eco opcional no capítulo 1:** dois pontos de luz num teto qualquer, que só parecem "olhos" depois de o jogador ter visto o rosto.
- **S9 · A Casa é um dado (a maior epifania; a história já diz isso):** os **pontos de um dado são buracos**. **O poço do teto da sala 1
  é um ponto**: o jogador caiu pela face UM. O capítulo 1 é a face UM (um ponto só: o poço). O capítulo 2 tem **dois poços**, o 3 tem
  **três**, sempre na diagonal… Quem presta atenção percebe, no meio do jogo, que está **dentro de um dado gigante** e que cada capítulo é
  uma face. As gemas reforçam: no mapa do diário, as câmaras secretas de cada capítulo ficam nas posições dos pontos daquela face, então
  um capítulo 100% desenha a sua face do dado no mapa. No fim, o mapa dobra num cubo.
- **Ideias guardadas para depois:**
  - (c) **a sala é a moldura**: nos capítulos seguintes, a **forma da sala** dá a família do glifo: sala fechada = coisa,
    sala em U aberta em cima = ser… (as constelações passam a escrever palavras com moldura). (a) o **mapa do diário** como lousa: as salas onde o jogador achou segredos formam um glifo no mapa
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

### Sala 3 — A Lousa (NÍVEL 2) · "acender em grade é escrever"

**A ideia:** a 1ª sala de **escrever com fogo**. Três passos (regra → torção → reprise): copiar, copiar com um ponto a mais, e escrever
uma palavra que o jogador **nunca viu**, deduzida de uma coisa que todo mundo conhece: **os números da língua são as faces do dado**.

**Forma:** pequena e baixa (6×10 m, teto 2,8): um corredor íntimo. Duas colunas no meio. Entrada ao sul, porta ao norte.
- Parede direita: **lousa 1** (9 lampiões em grade, num quadro de pedra clara) com o glifo **DOIS** talhado ao lado; **lousa 2** com **TRÊS** talhado ao lado.
- Canto esquerdo, perto da porta: um **dado de pedra enorme, meio enterrado**, mostrando três faces: UM em cima, DOIS e TRÊS dos lados
  (cenário; é a pista de que os glifos de número são faces de dado).
- **A porta é a lousa:** 9 pontinhos de bronze embutidos nela, em grade. Acima: «ACENDER ▢ BRASEIRO», com a casa lisa copiando ao vivo
  o que está aceso na porta.
- **Quatro braseiros acesos pela Casa:** à esquerda da porta, à direita da porta, no meio da parede esquerda e **um num nicho alto em cima
  do arco da entrada** (atrás do jogador quando ele entra; a luz dele joga a **sombra do jogador para a frente**, pista de que há fogo atrás).
- Atrás da coluna esquerda: a **lousa secreta (S1)**, com **soquete frio** e um dado de **cinco pontos** talhado acima.

**Como funciona uma lousa:** o dado (posicionar ou arremessar, alvo pela mira) acende o lampião mirado. Os acesos ficam acesos. Quando o
conjunto aceso é **exatamente** o glifo, o glifo talhado ao lado brilha e a lousa trava acesa. Se passam 5 s sem lampião novo e o desenho
não bate, todos se apagam, **sem pena** (é sala de ensino).

**Solução (passo a passo):**
1. **Lousa 1:** acenda os lampiões dos cantos de cima à esquerda e de baixo à direita (o DOIS talhado ao lado). Abre-se uma grade baixa
   na parede (passagem para a parte da frente da sala).
2. **Lousa 2:** acenda a diagonal inteira, canto, centro, canto (o TRÊS).
3. **A porta:** a frase pede um número, e ela tem de ficar **verdadeira**: quantos braseiros estão acesos? Quem conta só os da frente
   escreve TRÊS (que já sabe): a porta não aceita, e os pontinhos se apagam. Olhando em volta (ou reparando na própria sombra), acha o
   **quarto braseiro, no nicho em cima da entrada**. A resposta é QUATRO, que ninguém ensinou. O DOIS e o TRÊS eram faces do dado; o dado
   de pedra mostra isso. **A face quatro de um dado são os quatro cantos.** Acenda os quatro pontinhos dos cantos da porta. A casa lisa da
   frase mostra QUATRO, a Casa lê a frase (as palavras acendem uma a uma) e a porta abre.
- **Segredo S1:** na lousa atrás da coluna, escreva a face **cinco** (os quatro cantos e o centro). Um nicho abre: uma **gema**.

**Por que é única** (`node tools/verify_lousa.mjs`):
- os números do léxico **são** as faces de um dado comum (UM a CINCO), então a dedução do jogador está certa, não é coincidência;
- cada lousa aceita **um** desenho entre 512;
- a frase só fica verdadeira com QUATRO (há 4 braseiros acesos); contar só os da frente (TRÊS) é recusado;
- chutar "quatro pontos quaisquer" são 126 desenhos: só a face do dado serve;
- acender os cantos um por um não abre nada antes do quarto (os passos do meio, como o DOIS, não disparam nada).

**O que ensina:** acender em grade **escreve**; uma frase com uma casa lisa pede que o jogador a **torne verdadeira**; os números são as
faces do dado (a base de toda escrita com fogo e da ideia "a Casa é um dado"); olhar a sala inteira, inclusive para trás.
**Palavras novas:** TRÊS, QUATRO (e BRASEIRO, na frase da porta; o glifo BRASEIRO pisca quando o jogador olha um braseiro aceso).

**Motor:** lousa de fogo (M1: alvo pela mira, comparação com glifo, apagar depois de 5 s parado); porta-lousa com casa lisa que espelha;
o dado de pedra (cenário); braseiros pré-acesos (`lit: true`), um num nicho alto.

### Sala 4 — O Fio de Fogo (NÍVEL 3) · "o fogo corre"

**A ideia:** o fogo não fica parado onde o dado o pôs: ele **corre** por canaletas de óleo e acende o que está mais abaixo. Com isso,
«ACENDER UM» deixa de querer dizer "um braseiro" e passa a querer dizer **"uma ignição"**. O jogador precisa **prever** por onde o fogo
vai antes de acender. E as **linhas de fogo** (canaletas queimadas) também são escrita: os verbos têm linhas.

**Forma:** a sala **desce**. A entrada dá num **balcão alto** (3 m acima do chão), com parapeito. Do balcão se vê o chão inteiro lá
embaixo: **9 braseiros em grade** (2,4 m entre eles) ligados por canaletas talhadas no piso. Uma **escada** desce junto da parede
esquerda. A porta fica embaixo, no fundo, com o glifo **CINCO** talhado (como um dado de cinco pontos) e a plaquinha **«ACENDER DOIS»**.
Embaixo, no meio dos braseiros, não se vê mais a grade inteira: **planeja-se de cima, faz-se embaixo** (ou arremessando do balcão).
- **Canaletas com sentido:** o fundo de cada canaleta tem **chevrons talhados** apontando para onde o óleo escorre, e a canaleta é mais
  funda na ponta de baixo. O fogo corre ~0,6 s por canaleta, devagar o bastante para se **ver** o caminho.
- **Ignições:** dois soquetes ao lado da porta acendem um a um, conforme o jogador gasta as ignições. Quando o fogo para de correr por 2 s:
  se o desenho é o pedido, a porta abre; senão, depois de 3 s tudo se apaga, os soquetes voltam e os braseiros ficam **frios por 4 s**.
- **Como a Casa lê:** pontos = o que está aceso; linhas = canaletas queimadas. Glifo **sem linhas** (número) é lido só pelos pontos;
  glifo **com linhas** (verbo) tem de bater nos dois.

**No balcão, três lousas em fileira (regra → torção → reprise):**
1. **Lousa 1 (demonstração):** dois lampiões e uma canaleta entre eles. Fogo no de cima: o fogo desce e acende o de baixo.
2. **Lousa 2:** «ACENDER UM» e o glifo **TRÊS** talhado ao lado. Canaletas: do centro para os dois cantos da diagonal, e outras que
   vêm de fora (da casa 6 para o centro e para a 7; da 3 para o canto 0 e para a 1; da 7 para o canto 8; da 5 para a 2).
   **Solução: fogo no centro.** Armadilhas: o canto de cima à esquerda (o "começo da leitura") só acende ele mesmo; a casa 6 acende o TRÊS
   **e** a 7 (sobra fogo).
3. **Lousa 3 (linhas):** o glifo **ACENDER** (o triângulo) talhado ao lado; canaletas **só** nos três lados do triângulo, em roda.
   Fogo em qualquer ponta: o fogo corre e **desenha as linhas** do glifo. Ensina que **linha = fogo correndo**. Sem armadilha.

**A porta (o chão):** «ACENDER DOIS» + **CINCO**. Canaletas (de → para): 2→4, 4→0, 4→8, 1→2, 5→8, 3→7, 7→6 (casa 0 = canto do fundo à esquerda,
olhando do balcão para a porta).
**Solução: fogo no canto do fundo à direita (2) e no canto da frente à esquerda (6).** Da 2 o fogo desce ao centro e dali aos cantos 0 e 8;
a 6 não recebe fogo de dentro do glifo, então precisa da 2ª ignição.
**A primeira impressão engana:** a lição da lousa 2 foi "comece pelo meio", mas aqui o meio acende 0, 4 e 8 e sobra uma ignição para dois
cantos. Começar pelas casas do meio das bordas (1, 3, 5 ou 7) acende uma casa de fora do glifo.

**Por que é única** (`node tools/verify_fio.mjs`): na lousa 2, das 9 ignições só o centro escreve TRÊS; na porta, dos 36 pares só
{2, 6} escreve CINCO, com uma ignição é impossível, e qualquer par com o centro falha; no chão, toda canaleta liga braseiros vizinhos.

**Segredo S10 (camada 2, voltar depois):** no parapeito do balcão há uma plaquinha com **soquete frio** e a frase «DIZER IGUAL ▢»
mais «ACENDER UM». Na sala 4 o jogador não conhece DIZER nem IGUAL. Bem mais tarde, um diário achado mostra o lema dos Contáveis,
**«DIZER IGUAL FAZER»** ("dizer é fazer"), com o glifo FAZER anotado. Quem volta e lê a plaquinha precisa escrever **FAZER** no chão
com **uma** ignição, olhando as canaletas do balcão. **Solução: acender o soquete frio e pôr fogo só no canto do fundo à direita (2):** o
fogo desce ao centro e dali aos cantos 0 e 8, e as canaletas queimadas desenham as três linhas de FAZER. Abre um nicho sob o balcão (gema).
- O verificador prova que, com uma ignição, a grade só escreve duas palavras: FAZER (casa 2) e TRÊS (casa 4). Só FAZER é verbo e completa
  «DIZER IGUAL ▢». FAZER não abre a porta.
- **O arrepio:** quem resolveu a porta acendendo a 2 primeiro **já escreveu FAZER** na primeira visita, sem saber. A palavra estava no
  chão desde o começo.

**O que ensina:** o fogo corre e precisa ser previsto; «ACENDER N» = N ignições; linhas de fogo são escrita (base dos frisos da C2);
ver de cima e agir embaixo. **Palavras novas:** UM (na plaquinha: o ponto do meio) e CINCO (o glifo da porta).

**Motor:** canaletas dirigidas com fogo visível correndo; contador de ignições na porta; leitura da grade por pontos e linhas; balcão com
escada (dois níveis: já existe um precedente em O Mirante); o dado pode ser arremessado do balcão para os braseiros do chão; plaquinha
com soquete frio que só funciona com o lema do diário.

### Sala 5 — A Casa Escreve (NÍVEL 3) · "a lousa é um mapa" + constelação C1

**A ideia:** até aqui a escrita estava parada (talhada) ou era do jogador. Aqui **a Casa escreve com fogo**, numa lousa que se acende
sozinha. E a lousa não mostra números: mostra **posições**. Ela é o **mapa do salão**, que tem 9 colunas em grade. É a ponte para as
constelações: "a sala inteira é uma grade".

**Forma:** salão quadrado amplo (14×14 m, teto 5), **9 colunas** em grade 3×3 (todas com tocha apagada), três tochas de parede.
Quatro colunas têm um **braseiro ao pé** (sem número): **meio-direita, fundo-esquerda, frente-meio, fundo-direita** ("fundo" = lado da porta).
Na parede da porta, acima dela, a **lousa da Casa** (9 lampiões), com um pequeno glifo **PORTA** talhado na borda de cima da moldura.
No centro do chão, **rachaduras frias** (sem brasa).

**A lousa em laço:** acende um lampião por 1,5 s, apaga, acende o próximo… quatro quadros e então **2,5 s de escuro**; repete. O laço
já está rodando quando o jogador entra (ele chega no meio). A frase da porta é **«ACENDER BRASEIRO ORDEM»**, e o glifo **ORDEM** pulsa
**no tempo escuro**: é o "ponto final" do laço.
- Quadros, do primeiro ao último: **meio-direita · fundo-esquerda · frente-meio · fundo-direita** · (escuro).

**Solução (passo a passo):**
1. Ver que a lousa acende **um ponto de cada vez** e que os pontos não são números (nenhum é o ponto do meio; um ponto no canto não é palavra).
2. Perceber que a lousa tem a **forma do salão**: 3×3, como as colunas. O glifo PORTA na borda de cima diz que o **lado de cima da
   lousa é o lado da porta**. Cada ponto é uma coluna.
3. Achar o começo: o laço termina no escuro (quando ORDEM pulsa). O primeiro quadro é o que vem logo depois do escuro.
4. **Acender os braseiros ao pé das colunas: meio-direita, fundo-esquerda, frente-meio, fundo-direita.** Errar a ordem apaga tudo e
   deixa os braseiros **frios por 6 s**.

**A primeira impressão engana, e se denuncia:** quem lê a lousa de cabeça para baixo (com a entrada em cima), espelhada ou girada, manda
pelo menos um quadro para uma **coluna sem braseiro**, e percebe sozinho que leu errado.

**Por que é única** (`node tools/verify_casa_escreve.mjs`): lida como mapa, todo quadro cai num braseiro e há **uma** ordem entre 24;
de cabeça para baixo, 3 quadros caem em colunas vazias; espelhada, 1; girada, 4; começar o laço no meio dá ordens erradas; a ordem não é
a de leitura (esquerda para direita, cima para baixo).

**"Resolvi… mas será que resolvi?" → constelação C1 (só Fogo):** com a porta aberta, a lousa continua em laço, e **a cada três voltas**
aparece um 5º quadro antes do escuro: **cinco pontos de uma vez**, os quatro cantos e o centro (CINCO). Não há quinto braseiro.
Lido como mapa (a lição da sala), são **cinco colunas**: as quatro dos cantos e a do centro. **Acender as tochas dessas cinco colunas, e
nenhuma outra** (há 9 colunas com tocha e 3 tochas de parede): as rachaduras frias se abrem, um braseiro sobe no centro; acendê-lo abre a
**câmara secreta** (gema + diário). Verificado em `tools/verify_constelacoes.mjs`: 1 conjunto aceito entre 4096. As tochas se apagam
sozinhas em ~40 s, então é preciso planejar o caminho entre as cinco colunas.

**O que ensina:** a Casa fala em fogo; uma lousa pode ser um **mapa**; a sala inteira é uma grade (prepara todas as constelações); uma
frase em laço tem começo e fim (ORDEM). **Palavra nova:** ORDEM (usada depois no Tribunal).

**Motor:** lousa animada (M9) com laço, tempo escuro e o 5º quadro a cada 3 voltas depois de resolvida; brilho de ORDEM no escuro; braseiros
sem número; tochas de coluna com tempo de chama; rachaduras frias + braseiro `hidden`; câmara secreta.

### Sala 6 — A Chama Curta (NÍVEL 4) · "o fogo que espera"

**A ideia:** a sala antiga ensinava "o que dura mais, primeiro". Aqui entra o **tempo** (a palavra TEMPO) e ele se junta ao que a sala 4
ensinou: o fogo corre por canaletas. A virada: **uma canaleta longa é um pavio**. O fogo leva segundos para atravessá-la, então ela
**acende uma coisa mais tarde, sozinha, longe do jogador**. A sala é impossível só com as mãos.

**Forma:** a sala antiga, galeria **comprida** (~27 m), escura, com colunas em zigue-zague. Na frente, uma **antecâmara** curta separada
por um **portão de grade**.

**1. Antecâmara (regra, sem punição):** um braseiro pequeno ao lado do portão. O portão **sobe enquanto a chama está viva** e **desce quando
ela se apaga** (~4 s). Acender e passar. Se demorar, é só acender de novo. Ensina, pelo efeito, que **chama pequena dura pouco** e que o
mundo reage **enquanto** algo queima. O glifo TEMPO, na frase da porta lá no fundo, pulsa quando uma chama está acabando.

**2. A galeria:** a porta diz «ACENDER QUATRO BRASEIRO TEMPO» (os quatro acesos ao mesmo tempo; a porta então abre para sempre).
| Braseiro | Onde (distância da entrada da galeria) | Dura |
|---|---|---|
| **grande** | meio da galeria, à esquerda (13 m) | 25 s |
| **médio** | fundo, à direita, junto da porta (26 m) | 12 s |
| **mínimo da entrada** (uma tigela de mão) | logo depois do portão, à direita (8 m) | 2,5 s |
| **mínimo do fundo** | fundo, à esquerda, junto da porta (27 m) | 2,5 s |

Entre o médio e o mínimo do fundo, o chão tem um **desenho de labirinto talhado** (uns 3 m de largura). Parece decoração. É uma **canaleta
enrolada**: quando o médio acende, o fogo entra no labirinto, anda devagar pelas voltas (dá para ver a brasa caminhando) e acende o mínimo
do fundo **6,5 s depois**.

**Solução (passo a passo):**
1. Acender o **grande** (no meio) e o **médio** (no fundo). Ao acender o médio, o fogo começa a andar pelo labirinto.
2. **Voltar até o mínimo da entrada** (uns 19 m, ~5 s andando) e **esperar com o dado na mão, olhando para o fundo**.
3. Quando o mínimo do fundo **pega fogo sozinho** (a chama aparece lá longe), acender o mínimo da entrada. Os quatro ficam acesos juntos
   por um instante e a porta abre.
- Também funcionam: médio → grande → mínimo da entrada, e médio → mínimo da entrada → grande (apertado). O que não muda: **o mínimo do
  fundo tem de ser aceso pelo pavio**.

**Por que a mão não chega** (`node tools/verify_chama_curta.mjs`, simulação de caminho com a velocidade real do motor e espera livre):
- andando (4,2 m/s), chegando a 2 m de cada braseiro: **3 planos funcionam, e todos usam o pavio**;
- acender os dois mínimos à mão: **nenhum plano funciona**, nem correndo (Shift do PC, 5,7 m/s) e arremessando de 5 m: de um mínimo ao
  outro leva 3,2 s, e a chama mínima dura 2,5 s;
- o hábito da sala antiga ("o que dura mais primeiro, tudo à mão") falha.

**Epifania:** o jogador tenta, corre, erra por meio segundo, e então olha de novo para o "enfeite" do chão perto da porta. Ele já sabe que
canaleta leva fogo (sala 4). Agora descobre que **canaleta também é tempo**.

**Segredo S3 (camada 2, voltar depois da sala 8):** a fumaça do braseiro grande **entorta** sempre para o mesmo trecho da parede direita,
que **balança de leve**. É um **pano pintado como pedra**. Depois que a sala 8 ensinar que pano queima, o jogador volta, atira o fogo no
"muro" e acha um corredor curto com um diário achado.

**O que ensina:** tamanho = duração; o mundo reage **enquanto** algo queima (o portão); uma canaleta longa é um **pavio** (atraso); planejar
o caminho e **esperar** no lugar certo. **Palavras novas:** QUATRO (já vista na sala 3) e TEMPO.

**Motor:** regra `together` com `burn` (já existe); portão que fica aberto só enquanto um braseiro queima (novo, pequeno); canaleta-pavio com
atraso e brasa visível andando (M2 com tempo); fumaça com vento e pano-parede (S3).

### Sala 7 — O Que a Casa Confirma (NÍVEL 5) · revisada

**O que muda da versão atual (sala 6 do jogo, `FIRE_FRASES`):** a ideia e as duas etapas ficam; muda o conteúdo. Na versão atual, a 4ª
frase confirmada («DOIS DEPOIS UM») **sobra**: as outras três já dão a ordem. Pela regra do projeto, nenhuma pista pode ser descartável.
Com **cinco** pilares (CINCO o jogador já escreveu na sala 4), quatro confirmadas viram exatamente o necessário.

**A ideia:** a marca no fim da frase **muda o que ela vale**. CONFIRMADO (com moldura talhada) vale; BOATO (gasto) não. As frases com
ANTES/DEPOIS dão uma **ordem**, e ela não está na ordem de leitura.

**Forma:** retangular média (11×20 m), como a atual. Sem braseiros à vista: **cinco rachaduras com brasa** no chão, onde os pilares vão subir.
Três parágrafos pequenos nas paredes, cada frase com o **soquete de brasa** no começo (o símbolo de "isto se acende", §25).

**Frases:**
| Parede | Linha | Marca |
|---|---|---|
| esquerda, perto da entrada | «DOIS DEPOIS CINCO» | CONFIRMADO |
| | «CINCO ANTES UM» | boato |
| esquerda, perto da porta | «TRÊS DEPOIS DOIS» | CONFIRMADO |
| | «TRÊS ANTES QUATRO» | boato |
| direita | «UM DEPOIS QUATRO» | CONFIRMADO |
| | «DOIS DEPOIS TRÊS» | boato |
| | «UM ANTES CINCO» | CONFIRMADO |
A porta: «ACENDER CONFIRMADO».

**Solução (passo a passo):**
1. **Ensino (passo 1):** com o Fogo, acender as frases **CONFIRMADAS** (o dado junto da frase, na parede). Uma frase de BOATO **apaga as acesas**
   e a Casa recusa o fogo por 4 s. É aqui que a marca se explica pelo efeito; por isso a resposta frase a frase continua (é ensino, não o puzzle).
2. Com as quatro confirmadas acesas, ouve-se um estrondo e **cinco pilares sobem** (UM a CINCO), cada um com seu número.
3. **O puzzle (passo 2):** montar a cadeia com as quatro frases acesas:
   - «UM DEPOIS QUATRO» → 4 antes de 1;
   - «UM ANTES CINCO» → 1 antes de 5;
   - «DOIS DEPOIS CINCO» → 5 antes de 2;
   - «TRÊS DEPOIS DOIS» → 2 antes de 3.
   Cadeia: **4 → 1 → 5 → 2 → 3**.
4. **Acender QUATRO, UM, CINCO, DOIS, TRÊS.** Errar apaga tudo e deixa os pilares **frios por 8 s** (sem gema por passo).

**Por que é única** (`node tools/verify_confirma.mjs`): uma ordem só entre 120; sem qualquer uma das quatro confirmadas sobram 5 a 10
ordens (todas são necessárias); os três boatos são falsos e, se alguém acreditar neles, cai em contradição; a ordem não é 1-2-3-4-5 nem a
ordem em que os números aparecem lidos nas frases (2-5-3-1-4).

**Por que todos os boatos são falsos aqui:** de propósito. O jogador sai desta sala achando que "boato = mentira". A sala 11 (O Boato
Verdadeiro) quebra esse hábito. É a "primeira impressão que engana" em duas salas.

**Sem segredo próprio:** nem toda sala precisa ter (o respiro R2 vem logo depois, cheio de coisas para achar).

**O que ensina:** CONFIRMADO × BOATO; ANTES/DEPOIS formam uma cadeia; a ordem certa não é a de leitura; o dado de Fogo também acende escrita.
**Motor:** já existe quase tudo (`FIRE_FRASES`, tablete `lit`, `lock`, `hidden`); muda só o conteúdo (5 pilares, as frases acima, `seq` = 4, 1, 5, 2, 3).

### Sala 8 — O Pano (NÍVEL 5) · "o fogo queima o boato" + constelação C2

**A ideia:** o que é **talhado** é da Casa; o que é **tecido** é boato (cada pano tem a marca BOATO bordada embaixo). O jogador nunca
atirou o dado em nada que não fosse braseiro ou frase; aqui precisa atirar **no pano**. O fogo queima o pano de baixo para cima (~2 s) e
mostra a pedra. O pano volta quando o jogador sai da sala.

**Forma:** capela alta e estreita (8×14 m, teto 7), seis pilares em duas fileiras de três (todos com tocha), três tochas de parede,
panos pendurados **alto** (só se alcançam **arremessando**), rachaduras frias no centro do chão e frisos de pedra no teto.

**Braseiros:** quatro, com número no pedestal (UM a QUATRO). Regra `order` com `hints: false`, penalidade 8 s.

**Frases:**
| Onde | Pedra (talhado) | Pano por cima (tecido, com BOATO) | Debaixo do pano |
|---|---|---|---|
| porta | «ACENDER ▢ BRASEIRO CONFIRMADO» | **TODOS** sobre a casa do meio | **DOIS** |
| parede esquerda, alto | «▢ ANTES QUATRO CONFIRMADO» | **UM** sobre a 1ª palavra | **TRÊS** |
| parede direita, alto | (nada) | «DOIS ANTES UM» inteiro | pedra **lisa** |

**Solução (passo a passo):**
1. Lendo os panos: acender TODOS, com o UM antes do QUATRO e o DOIS antes do UM. O jogador tenta; a Casa apaga tudo e os braseiros ficam frios.
2. Repara que as palavras de pano têm a marca **BOATO** bordada e que **o pano é outro material**. Atira o dado de Fogo no pano da porta:
   ele queima e mostra **DOIS** talhado. A ordem da porta é «ACENDER DOIS BRASEIRO».
3. Atira no pano alto da parede esquerda: debaixo do UM tecido está **TRÊS** talhado: «TRÊS ANTES QUATRO».
4. **Acende TRÊS e depois QUATRO.** A porta abre.
- O pano da parede direita é **boato puro**: queimado, mostra pedra lisa. Quem acreditar nele junto com a pedra cai em contradição
  (pede o DOIS e o UM, mas só dois braseiros, que já são o TRÊS e o QUATRO).

**Por que é única** (`node tools/verify_pano.mjs`, as 64 respostas possíveis: qualquer sequência de 1 a 4 braseiros):
- lendo a pedra: **uma** resposta, 3 → 4;
- acreditando nos panos: 4 ordens possíveis, nenhuma aceita;
- queimar **só** o pano da porta leva a 1 → 4 (errada); queimar **só** o da parede deixa 12 ordens de quatro, nenhuma aceita: **os dois panos são necessários**;
- pedra + pano direito: 0 respostas (contradição).

**Constelação C2 (camada escondida, só Fogo):** os frisos de pedra do teto ligam só três pilares num **triângulo** (a ponta no meio da
fileira do fundo). É o glifo **ACENDER**, a 1ª palavra do jogo; a lousa 3 da sala 4 ensinou que linha = fogo correndo. Acender as tochas
do **pilar do meio do fundo** e dos **dois pilares dos cantos da frente**, nenhuma outra: o fogo corre pelos frisos e desenha o
triângulo no teto; um braseiro sobe das rachaduras; acendê-lo abre a câmara (gema + diário). Verificado: 9 tochas, 1 conjunto de 512, e
os frisos só batem com ACENDER entre as 11 palavras que essas tochas conseguem escrever.

**O que ensina:** atirar o fogo em coisas que não são braseiro; **material diz a marca** (pedra = confirmado, pano = boato); ler a
frase inteira, não só a parte à vista. Prepara a sala 16 (queimar um boato muda a conta).

**Motor:** pano queimável (M3) com a pedra embaixo, que volta ao sair; acertar pano alto com o dado arremessado; constelação (tochas de
pilar com tempo, frisos com fogo correndo, rachaduras frias + braseiro `hidden`, câmara secreta).

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

## 6. Decisões
**Já decididas pelo Pedro:** a Casa (o jogo todo) é **um dado** (S9); constelações do capítulo 1 só com Fogo, e com as ferramentas novas
a partir do capítulo 2; sempre tochas a mais; gemas (100%), diários com vocabulário e um **4º final que se acumula** (§3d).

**Ainda em aberto:**
1. **Lousa de fogo e canaletas** viram o eixo do capítulo 1 (escrever com fogo)? (O Pedro gostou; falta o "sim" formal.)
2. **Pedra = CONFIRMADO, pano = BOATO, o fogo queima o boato** como regra do mundo?
3. **Errar de propósito** (o escuro da punição esconde escrita desde a sala 2)? Exige mudar a punição das salas 2 a 7 (apagar também a luz ambiente por ~2,5 s).
4. O 4º final «LANÇAR CASA»: o que o dado mostra ao pousar?
5. Formas das salas (seção 2): quais o motor faz já e quais pedem trabalho (fosso em espiral, claustro aberto, sala em L)? Pergunta para a sessão principal.
6. As salas atuais 3 (Os Quatro) e 4 (A Ordem) saem; as ideias delas entram nas novas 3 e 5. A 5 e a 6 atuais viram 6 e 7.
