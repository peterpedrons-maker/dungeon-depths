# Propostas de puzzles (sessão de design de puzzles) — v2

> Arquivo da sessão de **projeto de puzzles**. Nada aqui está no jogo ainda: são propostas para o Pedro aprovar e para a
> sessão principal implementar. Quando uma sala for aprovada e implementada, a solução passa para `PUZZLES.md`.
> Toda sala com lógica combinatória ganha um verificador em `tools/verify_<nome>.mjs` que prova por força bruta que a solução é única.
> **As respostas, curtas, ficam também em `RESPOSTAS.md`** (o gabarito do Pedro), atualizado a cada sala.
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
| 1 | O Poço | 1 | o dado acende (e, sem ninguém notar, o anel POÇO e um soquete frio embaixo do poço: o segredo S8 do fim) | (fica) | ACENDER |
| 2 | O Vestíbulo | 1 | o número é exato; **o caderno achado vira o diário do jogador** (tutorial obrigatório) | (fica) + cena nova | DOIS |
| 3 | **A Lousa** ✔ | 2 | acender em grade é **escrever**; os números são **as faces do dado** | M1 | TRÊS, QUATRO, BRASEIRO |
| 4 | **O Fio de Fogo** ✔ | 3 | o fogo **corre**; «ACENDER UM» pode acender vários | M1+M2 | UM, CINCO |
| 5 | **A Casa Escreve** ✔ | 3 | a Casa fala em fogo; **a lousa é um mapa** do salão | M9 + ordem | ORDEM |
| 6 | **A Chama Curta** ✔ | 4 | tempo e tamanho; **uma canaleta longa é um pavio** (o fogo espera) | M7+M2 | TEMPO |
| 7 | **O Que a Casa Confirma** ✔ | 5 | marcas (numa lousa) e depois uma cadeia curta de ANTES/DEPOIS (refeita: menos glifos de uma vez) | M8 | CONFIRMADO, BOATO, ANTES, DEPOIS |
| 8 | **O Pano** ✔ | 5 | **o fogo queima o boato**: o pano tecido mente, a pedra embaixo diz a verdade | M3 | (nenhuma) |
| 9 | **Os Apelidos** ✔ | 6 | o mesmo braseiro tem dois nomes; o glifo engana | M8 | GRANDE, PEQUENO |
| 10 | **A Ponte de Madeira** ✔ | 6 | o fogo **destrói o próprio caminho**: a ordem das ignições importa | M2+M3 | (MAIS, só o desenho) |
| 11 | **O Boato Verdadeiro** ✔ | 6 | boato não é mentira; acender o que é VERDADE | M8 | VERDADE |
| 12 | **A Sombra** ✔ | 7 | **a luz escreve pela sombra**, e a frase tem de ser verdadeira: um braseiro que não muda o desenho muda a verdade | M5 | (nenhuma) |
| 13 | **O Escuro** ✔ | 7 | **errar de propósito**: o escuro da Casa tem escrita | M6 | ESCURO |
| 14 | **A Lei Pequena** ✔ | 8 | 1ª lei da contagem; dois boatos que dizem o mesmo valem juntos | M8 | IGUAL |
| 15 | **O Fogo que Corre** ✔ | 8 | o desenho existe **num instante**: chamas que se apagam também escrevem | M2+M7 | (nenhuma) |
| 16 | **Os Que Dizem o Mesmo** ✔ | 9 | **queimar um boato muda a conta** da lei ("dizer é fazer") | M8+M3 | (nenhuma) |
| 17 | **A Memória da Casa** ✔ | 9 | ensaio do Tribunal; uma confirmada só existe **no escuro** | tudo | TODOS |
| 18 | O Tribunal dos Rumores ✔ | 10 | (já existe) | M8 | — |

✔ = detalhada e com verificador. **O capítulo 1 está completo**: todas as salas têm solução, verificador e resposta no `RESPOSTAS.md`.

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

### Sala 7 — O Que a Casa Confirma (nível 5) · refeita em duas partes ✔ `tools/verify_confirma.mjs`
(Detalhada na seção 5.) A versão do jogo tinha glifos demais de uma vez. Agora: parte 1, as marcas numa lousa; parte 2, cinco frases curtas e
quatro pilares. **Solução: escrever QUATRO na lousa; acender as frases CONFIRMADAS; pilares DOIS, QUATRO, UM, TRÊS.**

### Sala 8 — O Pano (nível 5) · "o fogo queima o boato" ✔ `tools/verify_pano.mjs`
(Detalhada na seção 5, com a constelação C2.) Panos tecidos (marca BOATO bordada) cobrem partes de frases talhadas. Queimados com o dado,
mostram a pedra. **Solução: queimar o pano da porta (TODOS → DOIS) e o pano da parede esquerda (UM → TRÊS); acender TRÊS e depois QUATRO.**

### Sala 9 — Os Apelidos (nível 6) ✔ `tools/verify_apelidos.mjs`
(Detalhada na seção 5.) Cinco braseiros, um GRANDE sem número e o QUATRO pequeno; o glifo PEQUENO parece UM numa moldura e
o GRANDE parece QUATRO: quem lê pelo desenho cai em contradição. **Solução: TRÊS, GRANDE, QUATRO, DOIS, UM.**

### Sala 10 — A Ponte de Madeira (nível 6) · "o fogo destrói o próprio caminho" ✔ `tools/verify_ponte.mjs`
(Detalhada na seção 5.) O fosso: desce-se em espiral até 9 braseiros com canaletas; uma canaleta passa por baixo de uma **ponte de madeira** que
leva outra por cima. **Solução: fogo no 3 (meio da borda esquerda) e DEPOIS no 7 (meio da frente): a cruz (MAIS).** Segredo C3: completar a
grade, vista do alto, com as tochas da borda sobre os quatro cantos.

### Sala 11 — O Boato Verdadeiro (nível 6) ✔ `tools/verify_verdade.mjs`
(Detalhada na seção 5.) A porta diz «ACENDER VERDADE»: acender as frases verdadeiras, inclusive **boatos verdadeiros**, e a Casa só
julga quando o jogador acende a frase da porta. **Solução: as frases «1 DEPOIS 3», «4 DEPOIS 2», «3 ANTES 4» e «2 DEPOIS 3»; depois os
pilares TRÊS, UM, DOIS, QUATRO.**

### Sala 12 — A Sombra (nível 7) · "a luz escreve, e a frase tem de ser verdade" ✔ `tools/verify_sombra.mjs`
(Detalhada na seção 5.) Uma pedra com dois furos projeta manchas de luz numa moldura que é a casa vazia da frase «ACENDER ▢ BRASEIRO».
Dois braseiros já escrevem TRÊS, mas a frase mentiria. **Solução: acender o da frente, o baixo à direita e o alto à esquerda: a luz escreve
TRÊS com três acesos.**

### Sala 13 — O Escuro (nível 7) · "errar de propósito" ✔ `tools/verify_escuro.mjs`
(Detalhada na seção 5.) Três lousas na porta e nada na sala diz o que escrever. As frases estão no teto, em cal que só aparece no escuro da
punição. **Solução: errar de propósito, ler o teto no escuro, escrever DOIS, CINCO, UM.**

### Sala 14 — A Lei Pequena (nível 8) · 1ª lei da contagem ✔ `tools/verify_lei.mjs`
(Detalhada na seção 5.) Frases embaixo, rampa com boatos, braseiros no mezanino. «UM BOATO IGUAL VERDADE». **Solução: 1, 4, 2, 3.**

### Sala 15 — O Fogo que Corre (nível 8) · "o desenho existe num instante" ✔ `tools/verify_fogo_corre.mjs`
(Detalhada na seção 5.) Canaletas com tempo, chamas de 4 s que só queimam uma vez. A porta quer os quatro cantos acesos **ao mesmo tempo, e
nada mais**. **Solução: fogo no centro; 2 a 5 s depois, no canto da frente à esquerda.** Constelação C5 (no escuro).

### Sala 16 — Os Que Dizem o Mesmo (nível 9) · "dizer é fazer" ✔ `tools/verify_dizem_mesmo.mjs`
(Detalhada na seção 5.) Claustro aberto; boatos em estandartes; a lei não fecha com todos. **Solução: queimar o estandarte «DOIS ANTES
QUATRO»; acender 1, 5, 2, 3, 4.** Constelação C6 (os frisos em Z: DE NOVO).

### Sala 17 — A Memória da Casa (nível 9) · ensaio do Tribunal ✔ `tools/verify_lei.mjs`
(Detalhada na seção 5.) Um hub com três anexos; uma confirmada só aparece no escuro, sob um soquete frio. **Solução: 4, 1, 3, 2.**

### Sala 18 — O Tribunal dos Rumores (nível 10) ✔ `tools/verify_tribunal.mjs`
Como está (`PUZZLES.md`). Agora todas as palavras dele foram ensinadas antes (a ferramenta de vocabulário confere).

---

## 2c. Como o jogador aprende a língua (canais, diluídos pelo jogo)
Decisão do Pedro: todos os canais, **diluídos**, nunca todos de uma vez. Ferramenta de garantia: `tools/verify_vocabulario.mjs`.

| Canal | O que é | Onde aparece |
|---|---|---|
| **o glifo reage** (efeito) | a palavra brilha quando o que ela diz acontece | todas as salas (já existe, §24) |
| **demonstração** | a Casa mostra, sem punir (o trapo que queima, as frases já acesas da sala 11) | 1ª vez de cada mecânica |
| **murais com figura** | cena talhada + a frase em glifos embaixo | 1 ou 2 por respiro; a Biblioteca |
| **objetos com o nome** | o glifo do nome talhado no próprio objeto | o Museu da Biblioteca; alguns respiros |
| **o dado traduz** | o rabisco na face do dado | palavras concretas, uma nova de vez em quando (já existe, §22) |
| **sala de aula do Escrivão** | lousas de exercício: completar a frase acendendo os pontos; acertou, a lousa brilha | a Biblioteca |
| **murais de encaixe** | 3 ou 4 desenhos com uma casa vazia cada; trocar blocos de glifo de lugar até **todos** baterem; só então o mural acende | um por capítulo (na Biblioteca no cap. 1) |
| **contexto no diário** | o diário guarda, junto de cada glifo avistado, **a frase inteira** onde ele apareceu e a sala (sem tradução, sem imagem) | o jogo todo (é do motor) |
| **diários dos condenados** | anotações em português, às vezes erradas | respiros e câmaras secretas |
| **perguntas do dado** (§2e) | o dado pula no centro, mostra o glifo e pergunta o significado (4 opções + "não sei"); ou pede para apontar/fazer | ~10 no capítulo 1, em momentos calmos |

**A ferramenta** confere, para cada palavra que um puzzle **exige**, se a sala a ensina por um canal forte (efeito, demonstração, rótulo, figura,
dado, dedução guiada) ou se ela já apareceu **2 vezes antes, uma delas por canal forte**. Na 1ª rodada ela achou dois buracos, já corrigidos:
**ANTES/DEPOIS** chegavam à sala 7 vistos uma vez só (agora há também o mural da ordem na sala 5) e **PEQUENO** chegava à sala 16 visto uma vez só
(agora há o desenho a giz do respiro R3). Resultado: 16 palavras exigidas no capítulo 1, nenhuma sem ensino. (Com as salas 12 a 17 fechadas, a ferramenta achou mais um buraco, ORDEM antes da sala 16, corrigido pondo ORDEM nas portas da sala 13 e da câmara do R3.)

## 2d. A Biblioteca (O Arquivo das Sentenças) — a grande área aberta
**O que é na história:** onde os Contáveis guardavam **tudo o que foi dito e julgado**. As **tábuas de pedra** são o que a Casa confirmou; os
**livros e rolos de papel** são cópias, comentários, boatos. O **Escrivão trabalha aqui**: é onde as sentenças são escritas. Em algum lugar,
lá em cima, está **a sentença do jogador**.

**Como entra no jogo:** logo depois da sala 8 (o jogador já sabe que pano e papel queimam e já conhece CONFIRMADO/BOATO). O **caminho principal
por dentro dela é curto** (atravessar o átrio até a porta da sala 9, sempre aberta); todo o resto é opcional. Ela **volta ao longo do jogo
inteiro** (estilo Metroidvania), e isso dilui tudo:
- **Capítulo 1: só o térreo.** As escadas para cima estão desabadas; vê-se o 2º e o 3º andar pelo vão do átrio.
- **Capítulo 2: o 2º andar**, por um **elevador de contrapeso** que só o **Peso** move. É aqui que o Escrivão aparece **de perto** e deixa o
  **giz** (proposta; o plano antigo punha a cena numa sala própria).
- **Capítulo final: o 3º andar**, com a **sentença do jogador**: o pergaminho **sem a marca de confirmação** (a virada do meio do jogo, `HISTORIA.md`).

**No motor:** não é uma sala gigante. São **5 ou 6 módulos ligados** (o jogo só desenha as salas vizinhas): átrio, duas alas, museu, sala de
aula, escritório do Escrivão. Para o jogador, é um lugar enorme.

**O térreo (capítulo 1):**
1. **O Átrio.** Três andares de altura, uma **luz redonda lá no alto** (outro "ponto" do dado), passarelas vazias em cima, **nove mesas de
   leitura em grade 3×3**, cada uma com uma lamparina apagada, e lamparinas nas paredes. (As mesas são uma constelação: §3, C-Bib, resolvida na seção 5.)
2. **A Ala das Pedras.** Corredores de estantes de **tábuas talhadas**: frases da lei dos Contáveis, sempre com CONFIRMADO. **Murais com figura**
   ensinam palavras de história (ESCREVER, LER, ESCRIVÃO, SENTENÇA). Uma tábua do índice diz «CONDENADO · CRIME · ?»: **o crime termina em
   PERGUNTA**. Nem a Casa sabe qual foi. (Gancho de história.)
3. **A Ala do Papel.** Estantes de livros e rolos. Alguns têm a marca **BOATO** na lombada: queimados, mostram atrás deles **tábuas de pedra**
   escondidas. Mas **nem todo papel é boato**: os cadernos dos condenados (em português, sem marca) **não** devem ser queimados. Quem queima um
   perde aquela página até sair da ala (ela volta). Ensina **cuidado com o fogo**: a primeira vez que queimar pode custar alguma coisa.
4. **O Museu dos Nomes.** Objetos em pedestais, cada um com o **nome talhado**: PORTA, CHAVE, LIVRO, MESA, SINO, GIZ, um dado (DADO). Um pedestal
   está **vazio, só com o nome**: o objeto está em outra parte da Biblioteca (achá-lo e trazê-lo? fica para o capítulo 2, com o Peso).
5. **A Sala de Aula do Escrivão.** Bancos, e três **lousas de exercício** de fogo, cada uma ao lado de um **mural com figura**, com uma frase e uma
   casa vazia: (a) o mural mostra **quatro** braseiros → «ACENDER ▢ BRASEIRO» → QUATRO; (b) o mural mostra uma mão acendendo o 2 depois o 1 →
   «▢ ANTES UM» → DOIS; (c) o mural mostra um braseiro grande ao lado de um pequeno (prepara a sala 9 sem estragar a armadilha: o mural mostra
   **tamanho**, não número) → completar com GRANDE? Não: no cap. 1 a lousa só escreve números e verbos; esta fica **trancada** até o jogador
   ter visto GRANDE na sala 9 e voltar (camada 2). Cada lousa certa dá uma **página da cartilha** no diário (figura + frase).
   **Mural de encaixe nº 1:** quatro desenhos (porta, livro, chave, sino) e, numa prateleira, blocos de pedra com glifos; o jogador **troca
   blocos de lugar** (E/AGIR num bloco e depois noutro) até cada desenho ter o seu nome; só quando os quatro estão certos o mural acende
   (gema). Os nomes estão no Museu, na sala ao lado.
6. **O Escritório do Escrivão** (trancado no cap. 1). Visto por uma **grade**: a mesa, uma página pela metade, o toco de giz, a lamparina acesa.
   **3ª aparição de longe:** ele está lá, escrevendo, de costas; quando o jogador chega perto da grade, a lamparina apaga e ele não está mais.

**Puzzles da Biblioteca (cap. 1), todos opcionais:** a constelação das mesas (C-Bib), as três lousas da sala de aula, o mural de encaixe,
os livros que mentem (Ala do Papel). Detalho um por um, com verificador, depois da sala 11 (para não quebrar a ordem das salas).

## 2e. As perguntas do dado (ideia do Pedro): "você sabe o que é isso?"

**Para que serve:** confirmar, de tempos em tempos, se o jogador **entendeu** uma palavra que um puzzle ensinou. Não é prova escolar: é o
companheiro que, de repente, quer saber. E é o único lugar do jogo onde alguém diz se o jogador acertou (o diário continua sem corrigir).

### A cena
1. **O dado treme** na mão por ~1 s (gemas piscando, um tremor leve; som baixo de pedrinhas). Quem estiver andando é parado devagar.
2. **Ele pula e aparece grande no centro da tela**, de frente, olhando para o jogador (a mesma cena da abertura: `ctx.dieCenter`, faixas de cinema).
3. **Mostra o glifo**, grande, escrito traço a traço (§31), e pergunta em balão: «VOCÊ · SABER · ?» (SABER = VER + CONFIRMADO).
4. **Embaixo aparecem 5 opções**, em português (a interface é traduzida, como o diário): **4 significados** e **"não sei"**. A ordem das 4 é
   embaralhada a cada vez. No celular, 5 botões grandes; no PC, clique ou teclas 1 a 5.
5. **O jogador escolhe uma.**
   - **Certo:** o dado dá um pulo de alegria e mostra só a marca **CONFIRMADO** (que brilha).
   - **Errado:** o dado fica abatido (a reação "triste" que já existe), sem glifo, sem punição.
   - **"Não sei":** o dado diz «EU · ESPERAR» e não insiste.
6. **A escolha vai direto para o diário**, na página daquele glifo, como anotação do jogador (na letra dele, **abaixo** do que ele já tinha
   escrito, nunca apagando). Certa ou errada, entra do mesmo jeito: o diário não julga. "Não sei" não escreve nada.
7. O dado **volta para a mão** e o jogo segue.

**Regras:**
- **Uma resposta por vez.** Errou ou disse "não sei": a mesma pergunta **volta mais tarde**, só depois de o jogador ver aquela palavra de novo em
  outro lugar (no máximo 3 vezes no jogo; depois disso, o dado desiste dela).
- **Opções erradas plausíveis:** sempre tiradas de palavras que o jogador viu **na mesma época** ou da mesma família de glifo, para não dar para
  acertar por eliminação.
- **Nunca** no meio de um puzzle, durante uma sala com tempo correndo, numa conversa, com o diário aberto ou numa cena. Sempre num momento calmo:
  no corredor entre salas ou na chegada a um respiro.
- **A 1ª pergunta é também o tutorial da cena** (o jogador não sabe o que está acontecendo; o tremor e o pulo explicam sozinhos).
- **Gancho para mais tarde (a decidir):** o dado é o Boato. Numa pergunta tardia, ele pode **comemorar uma resposta errada** (mentir). Quem
  já desconfia dele percebe pelo contexto.

### As perguntas do capítulo 1 (10)
| # | Quando (logo depois de…) | Glifo | Opções (a certa em **negrito**) |
|---|---|---|---|
| 1 | sala 3 (A Lousa), no corredor para a sala 4 — **tutorial da cena** | ACENDER | **acender** · braseiro · fogo · dois |
| 2 | chegada ao pátio da cisterna (R1) | QUATRO | **quatro** · três · cinco · cantos |
| 3 | sala 5 (A Casa Escreve), no corredor para a sala 6 | ANTES | **antes** · depois · agora · ordem |
| 4 | chegada aos Banhos Secos (R2, depois da sala 7) | CONFIRMADO | **confirmado (é verdade)** · boato (dizem que) · pergunta · fim |
| 5 | chegada à Biblioteca (depois da sala 8) | BOATO | **boato (dizem que)** · mentira · confirmado (é verdade) · pano |
| 6 | sala 9 (Os Apelidos), no corredor para a sala 10 | DEPOIS | **depois** · antes · longe · agora |
| 7 | sala 10 (A Ponte de Madeira), no corredor para a sala 11 | PEQUENO | **pequeno** · um · grande · meio |
| 8 | chegada à Galeria dos Condenados (R3, depois da sala 11) | VERDADE | **verdade** · mentira · dúvida · boato |
| 9 | chegada à Escadaria (R4, depois da sala 14) | IGUAL | **igual** · dois · lei · mais |
| 10 | sala 17, antes do Tribunal | TODOS | **todos** · nove · muitos · nenhum |
Notas: a 7ª usa de propósito a armadilha da sala 9 ("um", porque o glifo PEQUENO tem o ponto do meio). Na 4ª e na 5ª, "confirmado" e "boato" vêm
com o sentido entre parênteses, para a pergunta ser sobre a ideia, não sobre o nome da marca.

### O dado nas áreas livres: apontar e fazer (mais leve, sem tela cheia)
Nas áreas livres e na Biblioteca, o dado **comenta as escritas**: ele se inclina para uma frase na parede, "lê" (o balão repete a frase) e
pede alguma coisa. O jogador responde **com o mundo**, sem menu:
- **Apontar:** «X · ONDE · ?». O jogador mira na coisa e aperta E/AGIR. Errou: o dado balança a cabeça; na 2ª vez erra de novo, ele se inclina
  para a coisa certa (mostra). Ensina a palavra ONDE e a marca PERGUNTA.
- **Fazer:** «VOCÊ · ACENDER · DOIS · ?». O jogador faz.

| Onde | O que o dado lê | O que ele pede | Resposta |
|---|---|---|---|
| Pátio da cisterna (R1) | «CONTÁVEIS ACENDER BRASEIRO» | «BRASEIRO ONDE ?» | mirar num braseiro e apertar E |
| Banhos Secos (R2) | «CONTÁVEIS DIZER CONFIRMADO» (o relevo tem um dado pousado) | «DADO ONDE ?» | mirar no dado do relevo (ensina DADO) |
| Biblioteca, Museu dos Nomes | as etiquetas dos pedestais | «CHAVE ONDE ?» e, mais tarde, «LIVRO ONDE ?» | mirar na chave; no livro |
| Biblioteca, Sala de Aula | a lousa de exercício (a) | «VOCÊ ACENDER QUATRO ?» | fazer o exercício (escrever QUATRO) |

**Motor:** gatilhos por lugar (com as condições de calma acima); tremor do dado; `ctx.dieCenter` com um painel de 5 opções embaralhadas;
gravar a escolha na anotação do glifo (acrescentando, nunca apagando); fila de perguntas pendentes que reaparecem depois de nova aparição
da palavra; para apontar: o mesmo raio da mira que já existe, com a coisa-alvo marcada na sala.

## 2b. Respiros: lugares livres entre os puzzles (pedido do Pedro)

O jogo não pode ser só "sala, puzzle, porta, sala, puzzle". De tempos em tempos o jogador entra num lugar **sem porta trancada**, onde ele
anda à vontade, olha, lê e acha coisas. É o descanso depois de uma sequência difícil e é onde o **mundo** se mostra: quem foram os
Contáveis, quem passou por ali antes, o que é a Casa. Também é onde ficam os segredos fáceis e os **atalhos** de volta.

**Regras dos respiros:**
- **Nada obrigatório.** A passagem para a frente está sempre aberta. Dá para atravessar em 1 minuto ou ficar 10.
- **Nenhuma mecânica nova obrigatória**, nenhuma punição, nenhum tempo correndo.
- Cada respiro tem **pelo menos um diário achado ou uma página arrancada** do caderno de "a que veio antes" (em português), **uma inscrição do mundo** em glifos (só palavras
  conhecidas, no máximo uma nova, demonstrada) e **um pequeno puzzle opcional** (nível 1 a 3) com gema ou página de diário.
- Cada respiro tem **uma coisa que só faz sentido depois** (semente da camada 2), para dar vontade de voltar.
- Cada respiro abre um **atalho** para trás (uma grade que só abre deste lado), para a volta às salas antigas ser rápida.
- **Forma livre:** corredores que viram, pátios, escadarias, varandas com vista para salas já resolvidas. Nunca um retângulo com uma porta.
- No motor, um respiro é uma sala da lista como outra qualquer (a numeração e o mapa continuam automáticos), só que **sem trava na porta**,
  e pode ter **câmaras laterais** (§20, opção a).

**Ritmo do capítulo 1** (puzzle = P, respiro = R): P1 P2 P3 P4 · **R1** · P5 P6 P7 · **R2** · P8 · **A BIBLIOTECA** (§2d) · P9 P10 P11 · **R3** · P12 P13 P14 · **R4** · P15 P16 · **R5** (pequeno) · P17 · P18 (Tribunal).
- **Tamanho (pedido do Pedro): os respiros podem e devem ser GRANDES**, com espaço de verdade para andar e explorar: câmaras laterais, andares, cantos escondidos. As descrições abaixo são o mínimo de cada um.
Os respiros não entram na numeração dos puzzles deste documento (para não renumerar tudo); no jogo a numeração das salas é automática.

### R1 · O Corredor dos Nichos e o Pátio da Cisterna (entre as salas 4 e 5) — a primeira área livre, GRANDE
Revisão: o corredor sozinho era pequeno demais para ser o primeiro respiro (o primeiro lugar aberto só chegava depois da sala 7). Agora o
corredor **desemboca no pátio**: a primeira área livre do jogo é grande e chega logo depois da sala 4.

**O Corredor dos Nichos (a entrada):**
- **Forma:** corredor estreito que vira três vezes, com **nichos** nas paredes, cada um com um objeto velho (uma tigela, um giz gasto,
  uma corrente). Luz baixa de velas. Numa curva, uma **janela de grade** para uma galeria distante.
- **O Escrivão de longe (2ª aparição):** pela janela, ele passa na galeria do outro lado, devagar, e some. Não dá para chegar lá (ainda).
- **Inscrição do mundo:** «ACENDER BRASEIRO» repetida acima de cada nicho, mas num nicho só aparece «ACENDER» e o resto está **quebrado**
  (a pedra caiu): a Casa é velha, as frases se gastam.
- **Mural com figura (vocabulário):** três cenas talhadas lado a lado: um braseiro **apagado**, uma mão **acendendo**, o braseiro **aceso**. Embaixo de
  cada cena, um glifo: **ANTES · AGORA · DEPOIS**. Os três são da mesma família (moldura aberta à esquerda) com o ponto à esquerda, no meio e à
  direita: a forma confirma o sentido. É o primeiro ensino forte de ANTES/DEPOIS, que a sala 7 vai exigir.
- **Puzzle opcional (nível 1):** pela parede, **dados talhados** mostram as faces 1, 2, 3, (nicho vazio), 5. No fim do corredor, uma lousa
  pequena ao lado do nicho vazio. **Solução:** escrever a face que falta, **QUATRO** (os quatro cantos). Abre o nicho: uma **página arrancada**
  do caderno de "a que veio antes", que se encaixa num buraco do diário do jogador.
- **Semente (camada 2):** um nicho tem uma **tapeçaria pequena** com um glifo tecido. Na 1ª passagem não dá para fazer nada (o jogador nem
  sabe que pano queima). Depois da sala 8, queimada, mostra embaixo uma palavra talhada que vai para o diário.

**O Pátio da Cisterna (o corredor se abre nele):**
- **Forma:** o **primeiro espaço aberto**. Um pátio quadrado alto, com galerias em volta em **dois andares** (escadas nos cantos), câmaras
  laterais pequenas e, no meio, uma **cisterna** redonda com água parada. Lá no alto, muito acima, um **buraco redondo** deixa entrar luz
  pálida (é um "ponto" do dado: semente do S9, não comentada).
- **Inscrições do mundo:** só com palavras que o jogador já sabe a esta altura (ACENDER, números, BRASEIRO) e **no máximo uma nova** por
  frase, de história, com figura: por exemplo, sob um relevo de muitas pessoas em volta de um braseiro, «CONTÁVEIS ACENDER BRASEIRO».
- **Puzzle opcional (nível 2):** na beira da cisterna há uma pedra com o glifo **DOIS** talhado (a diagonal do canto de cima à esquerda
  ao de baixo à direita) e quatro braseiros apagados nos cantos do pátio, que se refletem na água como os cantos de uma grade. A pedra
  pede que **o reflexo** escreva DOIS. Quem acende a diagonal "certa" vê, na água, a **outra** diagonal (o reflexo inverte de cima para
  baixo). **Solução:** acender os dois braseiros da diagonal contrária (o canto do fundo à direita e o da frente à esquerda); na água
  aparece o DOIS e sobe uma gema do fundo da cisterna. Prepara o "ver de outro ponto de vista" das constelações C3 e C4.
- **Página arrancada nº 2 (dela):** *"Os pontos são números. Os números são dados. Eu já sabia disso antes de cair aqui, só não sabia que
  sabia. Contei os nichos três vezes. Um está vazio. Tudo aqui está faltando um pedaço."*
- **Atalho:** uma grade do corredor abre para o balcão da sala 4.

### R2 · Os Banhos Secos (entre as salas 7 e 8)
- **Forma:** um salão grande e **mais baixo que a porta de entrada**: o jogador desce degraus largos até um chão com **piscinas vazias** de
  pedra, em **profundidades diferentes** (dá para descer numa, subir noutra), colunas grossas e uma **fonte seca** no meio. Câmaras de banho
  laterais, pequenas, com bancos. É o oposto do pátio: fundo, abafado, com eco.
- **Inscrições do mundo** (agora que o jogador conhece as marcas): na borda das piscinas, frases curtas sobre os Contáveis com
  CONFIRMADO e BOATO, uma palavra nova de cada vez, cada uma junto de um relevo: «CONTÁVEIS DIZER CONFIRMADO» (relevo: alguém falando e um
  dado pousado) e, gasta, «CONTÁVEIS MENTIR BOATO» (relevo: alguém cochichando).
- **Puzzle opcional (nível 2, reprise das marcas):** na piscina mais funda, quatro braseiros e duas frases na parede: «ACENDER DOIS
  CONFIRMADO» e «ACENDER UM BOATO». **Solução:** acender exatamente **dois** braseiros; sobe uma gema do ralo. (Acender um só não faz nada;
  três, a Casa apaga.)
- **Página arrancada nº 3 (dela):** *"Aqui o que está talhado não mente. O que alguém só disse, mente às vezes. Eu acendi uma frase de boato
  e a Casa me apagou como quem apaga uma vela. Acho que eles não gostavam de quem repete o que ouviu."*
- **Semente (camada 2):** um **estandarte tecido** pendurado alto na parede da fonte, com a marca BOATO bordada. Na sala 8 o jogador
  aprende que pano queima. Voltando, queima o estandarte: atrás dele, uma **porta secreta** para uma câmara com diário e gema.
- **Atalho:** uma das câmaras de banho tem uma grade que dá para o fundo da sala 6 (a galeria comprida).

### R3 · A Galeria dos Condenados (entre as salas 11 e 12)
- **Forma:** galeria longa e alta, com **bancos de pedra** e, nas paredes, centenas de **marcas de contagem** riscadas a giz por outros
  condenados (dias? tentativas?). Algumas paredes têm desenhos de giz de outras pessoas: um braseiro, uma porta, um rosto apagado.
- **O Escrivão de longe (4ª aparição):** sentado no fim da galeria, escrevendo. Quando o jogador se aproxima, ele se levanta e some
  numa porta que não estava lá. Deixa no banco uma marca de giz fresca.
- **Inscrição do mundo:** a frase «CONDENADO LER SENTENÇA» talhada sobre a porta de saída (CONDENADO e SENTENÇA já foram vistas: o dado diz
  VOCÊ CONDENADO na sala 1). Primeira vez que o jogador vê a palavra SENTENÇA na pedra.
- **Puzzle opcional (nível 3):** quatro frases riscadas a giz por condenados (boatos, porque giz não é pedra) sobre "qual braseiro
  acender primeiro" numa câmara lateral com três braseiros; uma frase talhada (confirmada) diz quantos dos boatos são verdade. É a 1ª
  vez que o jogador vê uma **lei da contagem**, sem obrigação (prepara a sala 14). Solução e verificador: seção 5 (R3), `tools/verify_lei.mjs`.
- **Desenho a giz de um condenado (vocabulário):** um braseiro **enorme** e um **minúsculo**, com os glifos GRANDE e PEQUENO embaixo de cada um.
  Fica a três passos do diário 3, que diz o contrário: quem compara percebe que a autora errou.
- **Diário 3 (que erra):** *"O símbolo com o ponto no meio e as duas barras do lado quer dizer UM, tenho certeza."* (é PEQUENO; quem fez a
  sala 9 sabe que ela errou: os diários nem sempre acertam.)
- **Semente:** uma das marcas de giz é um **rosto** igual ao do dado, quase apagado (eco bem fraco do S11).
- **Atalho:** escada lateral que desce até os Banhos Secos (R2).

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

### R5 · A Antecâmara Fria (entre as salas 16 e 17) — pequena, no caminho obrigatório (ideia do Pedro)
**Para quê:** na sala 17, uma confirmada só aparece acendendo um **soquete frio**, e até aqui o soquete frio só existiu em segredos opcionais.
Esta câmara ensina isso **sem ser puzzle**, para a 17 continuar igual e difícil só pela lógica.
- **Forma:** câmara pequena e baixa (4×6 m, teto 2,4), quase um corredor, depois do claustro aberto da 16 (o contraste: do céu para o aperto).
  A porta de saída está **fechada** e não tem frase.
- **O que há:** na parede do fundo, ao lado da porta, uma **moldura de frase vazia** (lisa, com o lugar da marca), **idêntica** à do anexo C da
  sala 17. Embaixo dela, um **soquete frio** (a tigela de bronze rachada, sem brasa), bem na linha de visão de quem entra. É a **única coisa
  acendível** da sala. O dado da mão olha para o soquete ao entrar (ele já olha para braseiros e portas).
- **Como passa:** acender o soquete com o Fogo. A Casa apaga tudo (o escuro de 4 s) e, na moldura, aparece em cal **«ABRIR PORTA CONFIRMADO»**.
  Ainda no escuro, a porta se abre (o som dela no escuro). A luz volta, a moldura está lisa de novo, a porta continua aberta.
- **Por que não é puzzle:** só há uma coisa a fazer, como o braseiro da sala 1. Ninguém trava.
- **O que ensina, numa cena só:** (1) o soquete frio acende, mesmo sem a Casa anunciar; (2) acendê-lo traz o escuro; (3) no escuro, a moldura
  vazia mostra uma frase **confirmada**, e a Casa obedece a ela. Na 17, a mesma moldura com o mesmo soquete: o jogador já sabe o que fazer.
- **Palavras:** ABRIR (o dado, sala 2) e PORTA (rótulo, sala 5), já conhecidas; o efeito (a porta abre) confirma o sentido de ABRIR.
- **Depois de resolvida:** voltar e acender de novo repete a cena (a porta já está aberta). Sem gema, sem diário: é um corredor que ensina.

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
| C1 | Sala 5, salão de 9 colunas (todas com tocha + 3 de parede) | depois de a porta abrir, a lousa da Casa mostra às vezes um 5º glifo, **CINCO**, que não é de braseiro nenhum | CINCO (0, 2, 4, 6, 8) | ensina que constelações existem; nasce do "será que resolvi?" ✔ |
| C2 | Sala 8, capela de 6 pilares (+3 iscas) | os **frisos do teto** só ligam três posições num **triângulo** | ACENDER (1, 6, 8) | 1º verbo; olhar para cima ✔ |
| C-Bib | Biblioteca, 9 mesas de leitura (+4 iscas) | a **página na mesa do Escrivão**, vista **de cabeça para baixo** pela grade | PEGAR (0, 2, 7); a armadilha é ACENDER | ler do lado certo ✔ |
| C3 | Sala 10, o fosso | depois de resolvida, a cruz acesa lá embaixo deixa os **quatro cantos escuros**; as 8 tochas da **borda** caem, vistas do alto, sobre as casas da grade | completar TODOS (as 4 da borda sobre os cantos) | perspectiva + "o que falta no desenho" ✔ |
| C5 | Sala 15, as plataformas (9 postes com tocha + 3 iscas) | o glifo aparece no **teto, no escuro** de uma tentativa que falhou | MENOS (3, 4, 5) | a constelação que só se vê errando ✔ |
| C6 | Sala 16, o claustro (8 colunas + a fonte, +3 iscas) | **frisos** das galerias e uma **viga** que cruza o pátio na diagonal: um Z | DE NOVO (0, 2, 6, 8 com as linhas 0-2, 2-6, 6-8) | o verbo do tamanho de um pátio ✔ |
- **C4 cancelada:** a sala 12 (A Sombra) já é inteira de projeção; uma constelação de sombra ali repetiria a sala. **C7 passa para o capítulo 2**
  (as colunas do Vestíbulo, com o Peso).
- Total do capítulo 1: **6 constelações** (C1, C2, C-Bib, C3, C5, C6), cada uma com gema e, as maiores, diário.

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
- **Decidido (25/11):** o dado pousa mostrando **SEIS**, a face que a língua não tem (ver §6, item 3). O 4º final não destrava nada além de uma última página do diário.

## 3b. Mapa dos segredos (três camadas, como em *Animal Well* / *Fez*)

| Camada | Como se acha | Segredos | Recompensa |
|---|---|---|---|
| **1 · Notar** | na mesma visita, olhando de novo | S1 (sala 3, o CINCO antes da hora), as 6 constelações (§3), os puzzles opcionais dos respiros e da Biblioteca | gemas, páginas de diário |
| **2 · Voltar** | entendeu algo depois e volta | S3 (sala 6, pano-parede), S10 (sala 4, FAZER), S5 (as palavras do escuro), as tapeçarias e o estandarte dos respiros, a lousa (c) da Biblioteca | diários, páginas dela, a frase escondida |
| **3 · Meta** | junta tudo | S6 e S8 (o poço), com a frase S5 | o porquê da história |

- **S5 · As palavras do escuro (camada 2, depois da sala 13):** três salas têm uma palavra em **cal fosforescente no teto**, que só aparece no escuro
  da punição. Na 1ª passagem o jogador vê o escuro por um instante, olhando para o braseiro, e não percebe nada. Depois que a sala 13 ensina a
  errar de propósito, voltando e errando ele as lê:
  | Sala | Onde | Palavra | Como errar ali |
  |---|---|---|---|
  | 2 · O Vestíbulo | teto, entre as colunas | **ACENDER** | acender o 3º braseiro |
  | 7 · O Que a Casa Confirma | teto da 2ª câmara | **POÇO** | acender uma frase de boato |
  | 11 · O Boato Verdadeiro | teto da ala do fundo | **ESCURO** | julgar errado na frase da porta |
  Juntas, na ordem das salas: **«ACENDER POÇO ESCURO»**. Manda voltar ao poço e acender alguma coisa no escuro.
  (POÇO se ensina na própria sala 1: está **talhado no chão**, num anel de pedra embaixo do poço: rótulo. ESCURO se ensina na sala 13.)
- **S6 · O soquete frio do poço (sala 1):** no meio do anel de pedra com a palavra POÇO, embaixo da luz, há um **soquete frio** (sem brasa). Na 1ª
  visita o jogador nem tem o dado quando passa por ele; depois, acender ali parece não fazer nada… no claro.
- **S8 · O poço no escuro (camada 3):** com a frase do escuro na mão (e a lição da sala 17: soquete frio = escrita escondida), o jogador volta à
  sala 1 e acende o soquete frio. A Casa pune (não foi pedido): apaga tudo, **inclusive a luz do poço** (uma sombra fecha a boca lá em cima). No
  escuro, as paredes do tubo do poço mostram, em cal fosforescente, a **sentença do jogador**: «VOCÊ · CONDENADO», e depois dela, no lugar onde
  toda frase termina com a sua marca, **um quadro vazio**. Nenhuma marca. Ninguém confirmou. (A virada do meio do jogo, `HISTORIA.md`, escondida
  no primeiro cenário.) Ao voltar a luz, no chão, a **última página arrancada** dela: *"Eu também vi. Não tem marca. Então ninguém lançou o dado
  por mim. Então quem é que me prendeu aqui?"* É a última página do caderno dela: o buraco que faltava no fim.
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
  uma face. As gemas reforçam: quando o jogador junta **todas as gemas de um capítulo**, o mapa do diário acende **os pontos daquela face**
  sobre as salas certas. No capítulo 1, a face UM tem um ponto só, no centro do mapa: **a Biblioteca** (por isso ela fica no meio do capítulo).
  No fim, o mapa dobra num cubo.
- **Ideias guardadas para depois:**
  - (c) **a sala é a moldura**: nos capítulos seguintes, a **forma da sala** dá a família do glifo: sala fechada = coisa,
    sala em U aberta em cima = ser… (as constelações passam a escrever palavras com moldura). (a) o **mapa do diário** como lousa: as salas onde o jogador achou segredos formam um glifo no mapa
  (exige pôr as salas nas posições certas); (b) **SEIS não existe**: o dado tem seis faces, a língua é em base 6 («10» = UM ZERO); num
  capítulo posterior, duas lousas lado a lado sob um dado de seis pontos pedem UM e ZERO (o ZERO é um lampião dentro de um anel de pedra).

---

## 4. O que a sessão principal precisa construir (fichas de montagem)

**Já no jogo** (conferido na branch do site em 25/11): salas 1 a 11, R1 e R2, e o Tribunal (fora do lugar). Isso inclui a lousa de fogo, as
canaletas, a lousa animada, o pano queimável, `lock.judge`/`preLit`, as tochas e rachaduras frias (C1, C2, C3), o caderno-diário, o pavio, a ponte
de madeira, a rotunda, as perguntas do dado (`quiz.ts`, `pointask.ts`) e os lampiões de bronze.

**Falta, nesta ordem** (a ordem do capítulo, exceto onde uma peça depende de outra):

| # | O que | Base no motor | Peça nova |
|---|---|---|---|
| 1 | **O escuro da punição** (todas as salas) | `cold`/`penalty` do `fire.ts` | `ctx.blackout(s)`: luz ambiente e emissores a ~8% por `s` segundos; **cal**: malha que só aparece (fade) durante o escuro |
| 2 | **Biblioteca, térreo** (entre 8 e 9) | `makeTorch`, `makeWallBoard`, `makeCloth`, `makeGemNiche`, nicho do `kit` | módulos ligados sem porta trancada; mural de encaixe (trocar 2 blocos) |
| 3 | **R3 Galeria dos Condenados** (entre 11 e 12) | `respiro2.ts` como molde; regra `order` na câmara | nenhuma |
| 4 | **Sala 12 A Sombra** | `buildFireRoom` + `extra` | projeção calculada (manchas numa moldura 3×3) e o julgamento "número na moldura = acesos" |
| 5 | **Sala 13 O Escuro** | `makeWallBoard` ×3 + o escuro (1) | as três lousas julgadas juntas |
| 6 | **Sala 14 A Lei Pequena** | `room4.ts` (O Mirante: dois níveis com rampa) + regra `order` | nenhuma |
| 7 | **R4 A Escadaria** (entre 14 e 15) | escada em espiral (rampa do `ponte.ts`) | janelas que mostram salas já feitas (pode ser pintura, não render real) |
| 8 | **Sala 15 O Fogo que Corre** | `makeFloorChannel`, `burn`, `makeTorch` | atraso por canaleta; braseiro que queima **uma vez** por tentativa; plataformas em degraus |
| 9 | **Sala 16 Os Que Dizem o Mesmo** | `makeCloth` (estandartes) + regra `order`; C6 como C2 | o estandarte queimado **sai da conta**; queimar um 2º devolve todos |
| 9b | **R5 A Antecâmara Fria** (entre 16 e 17) | soquete frio do `firegrid` + o escuro (1) | nenhuma: soquete → escuro 4 s → cal na moldura → a porta abre |
| 10 | **Sala 17 A Memória da Casa** | hub redondo (`apelidos.ts`) + 3 anexos curtos; soquete frio do `firegrid` | soquete que dispara o escuro (1) e um quadro vazio com cal |
| 11 | **Mover o Tribunal** para depois da 17 | lista `MAIN_BUILDERS` | nenhuma |

### Ficha 1 · O escuro da punição (M6)
- **Quando:** toda punição de toda sala de fogo (o `cold` atual) chama `ctx.blackout(2.5)`. Ambiente e emissores caem a ~8% em 0,15 s, ficam 2,5 s e
  voltam em 0,6 s. As salas 1 e 2 não punem: não mudam.
  **Exceção (Pedro, 25/11): na sala 13 e na R5 o escuro dura 4 s** (`ctx.blackout(4)`), para dar tempo de ler com calma.
- **Cal:** um material verde-limão pálido (`#c8f0a0`), sem luz própria fora do escuro: opacidade = 1 − nível de luz da sala, só abaixo de 25%.
  Não precisa calcular luz real; basta seguir o próprio `blackout`.
- **Onde há cal no capítulo 1:** teto da sala 13 (3 frases + ESCURO sobre a porta), teto da sala 15 (glifo MENOS, C5), quadro da sala 17,
  palavras S5 nas salas 2, 7 e 11, e o fundo do poço da sala 1 (S8).
- **Cuidado:** o escuro não pode cortar falas, legendas nem o balão do dado (DESIGN §30); se uma conversa está aberta, ele espera.
- **Teste:** errar na sala 7 e ver a palavra S5 aparecer e sumir; o cronômetro de punição não conta durante o diário (`ctx.paused`).

### Ficha 2 · A Biblioteca (térreo)
- **Módulos** (cada um uma `Room` pequena, todos com portas sempre abertas): Átrio (passagem principal, curta, até a porta da sala 9) · Ala das Pedras ·
  Ala do Papel · Museu dos Nomes · Sala de Aula · grade do Escritório (vista de fora; trancado). Detalhes em §2d; puzzles em §5 (A Biblioteca).
- **Puzzles:** C-Bib (lamparinas 0, 2, 7; regra igual à de C1/C2), lousas da sala de aula (`makeWallBoard` com casa vazia, como na sala 3: QUATRO,
  DOIS e a trancada PEQUENO = QUATRO), livros que mentem (`makeCloth` com forma de lombada; o de pedra não queima), mural de encaixe.
- **Cena:** o Escrivão escrevendo no escritório, de costas; ao chegar perto da grade, a lamparina apaga e ele some (3ª aparição).
- **Teste:** atravessar só o Átrio em menos de 40 s (o caminho principal é curto); nenhuma porta trancada no caminho.

### Ficha 3 · R3 A Galeria dos Condenados
- Galeria longa e alta, bancos, marcas de contagem a giz (decalque), desenho a giz GRANDE/PEQUENO perto do diário 3 (§2b).
- Câmara lateral: 3 braseiros, regra `order` com `seq` = [DOIS, TRÊS, UM], 3 frases riscadas a giz (boatos) e a lei talhada (§5, R3). Gema ao abrir.
- Página arrancada nº 4 no banco do fundo (a pista da sala 13). Atalho para R2. Escrivão sentado no fim (4ª aparição).

### Ficha 4 · Sala 12 A Sombra
- `buildFireRoom` com 5 braseiros (F, BD, AE, BC, BE; AE num pedestal alto) e `extra` para a tela de pedra e a moldura 3×3 na frase da porta.
- **Manchas** (tabela em §5): cada braseiro aceso acende casas fixas da moldura; desenhar a moldura como uma `makeWallBoard` sem lampiões (só as
  manchas). Não usar sombra real.
- **Julgamento:** a cada mudança, se as casas acesas formam um número (UM a CINCO) → se o número = quantidade de braseiros acesos, abre; se não,
  após 3 s, pune (escuro + frios 6 s). Outro desenho: nada.
- **Teste:** F+AE pune; BD+AE pune; F+BD+AE abre.

### Ficha 5 · Sala 13 O Escuro
- Sala baixa (6×9, teto 2,6), 4 braseiros dos cantos `lit` e fora do puzzle; três `makeWallBoard` lado a lado na porta, cada uma escreve um número.
- **Julgamento:** quando as três mostram um número completo: certo (DOIS, CINCO, UM) abre; senão escuro de **4 s** e limpa as três.
- **Cal no teto:** as três frases e as marcas (§5), espalhadas ao longo da sala (de um lugar só não se vê todas): em 4 s lê-se uma ou duas com calma, e dois erros bastam para ler tudo; ESCURO sobre a porta.
- **Teste:** quem não erra nunca vê o teto; três erros bastam para ler tudo.

### Ficha 6 · Sala 14 A Lei Pequena
- Molde do Mirante: térreo (2 confirmadas + mural da balança), rampa larga contornando a sala (3 boatos), mezanino (4 braseiros, a lei, a porta).
- Do mezanino as frases de baixo **não** devem ser legíveis (distância ou parapeito).
- Regra `order`, `seq` = [UM, QUATRO, DOIS, TRÊS], `hints: false`, `penalty: 10` (com o escuro).

### Ficha 7 · R4 A Escadaria
- Poço vertical largo, escada em espiral. Janelas para salas já feitas: uma imagem fixa (vista de cima) basta.
- A janela da sala 5 mostra as 9 colunas em grade (e a câmara de C1 acesa se já foi feita). Diário 4 no meio. Porta de **seis** pontos no topo
  (fechada). Atalho para R3.

### Ficha 8 · Sala 15 O Fogo que Corre
- 9 plataformas em grade 3×3 em alturas diferentes, um braseiro em cada (`burn: 4`), canaletas com atraso (lista e segundos em §5); o sentido é
  sempre da plataforma mais alta para a mais baixa.
- **Uma vez por tentativa:** um braseiro que se apagou não reacende (o óleo acabou: mostrar o pote vazio). Quando tudo se apaga sem acertar: escuro
  + reabastece.
- **Porta:** abre se, num instante, os acesos forem exatamente 0, 2, 6, 8.
- C5: tochas nos 9 postes + 3 na parede; o glifo MENOS em cal no teto; alvo = postes 3, 4, 5.
- **Teste:** centro e, 3 s depois, canto 6 → abre. Acender os dois juntos falha. O cronômetro para durante o diário.

### Ficha 9 · Sala 16 Os Que Dizem o Mesmo
- Claustro: pátio quadrado sem teto (céu pálido como o do pátio da abertura), 8 colunas da galeria, fonte no meio. 5 braseiros no pátio.
- Confirmadas talhadas nas galerias; 5 estandartes (`makeCloth`) com os boatos; a lei na fonte.
- **Regra:** `order` com `seq` = [UM, CINCO, DOIS, TRÊS, QUATRO], mas a porta só aceita se **exatamente um** estandarte estiver queimado e for
  «DOIS ANTES QUATRO». Queimar um 2º: todos voltam pendurados (cena curta: os panos sobem do chão).
- C6: tochas nas 9, frisos do fundo e da frente e a viga diagonal; alvo = colunas 0, 2, 6, 8.

### Ficha 9b · R5 A Antecâmara Fria
- Câmara 4×6 m, teto 2,4, porta fechada sem frase. Moldura vazia (a mesma peça do anexo C da sala 17) e soquete frio embaixo, de frente para a entrada.
- Acender o soquete: `ctx.blackout(4)`; cal «ABRIR PORTA CONFIRMADO» na moldura; a porta abre durante o escuro. Repetível.
- **Teste:** entrar e, sem ler nada, a única coisa que reage ao Fogo é o soquete; o dado olha para ele.

### Ficha 10 · Sala 17 A Memória da Casa
- Hub redondo (como a rotunda da sala 9) com 4 braseiros e a porta; 3 anexos curtos (A pedra, B paredes gastas, C a lei + quadro vazio).
- O glifo TODOS da porta enche ponto a ponto conforme os braseiros acendem.
- **Soquete frio** sob o quadro vazio: acendê-lo dispara o escuro (2,5 s) e mostra «UM DEPOIS QUATRO» CONFIRMADO em cal. Pode ser repetido.
- Regra `order`, `seq` = [QUATRO, UM, TRÊS, DOIS], `penalty: 12`.

---

## 5. As salas detalhadas

### Sala 2 — O Vestíbulo: o caderno achado, que vira o diário do jogador (tutorial; decisão do Pedro)

**A ideia (do Pedro):** o jogador **não começa com diário**. Ele o **acha na sala 2**, e é **o caderno de outra condenada** ("a que veio
antes"), usado, gasto, com algumas anotações dela. A partir daí, é nele que o jogador escreve. Isso alivia a sala 1 (que volta a ser só
acordar, o Escrivão, o dado e o primeiro braseiro) e dá um peso de história: ele continua o livro de alguém que não saiu dali.

**Antes do caderno:** na sala 1 o jogador já vê símbolos (ACENDER, BRASEIRO e o que o dado e o Escrivão dizem). O jogo **guarda isso em
silêncio**; o botão do diário ainda não existe. Quando o caderno é aberto pela primeira vez, esses símbolos aparecem como "avistados".

**A cena, passo a passo (curta; o jogador no controle, sem câmera de cinema):**
1. **O fogo revela.** O caderno está no chão, junto da base de uma coluna do Vestíbulo, **no escuro**. Quando o jogador acende o **primeiro
   braseiro** da sala, a luz chega até ele: capa de couro, caído aberto.
2. **O dado vê e fala** (balão; **uma palavra nova por frase**, regra do `LINGUA.md`, cada uma com o seu rabisco na face do dado):
   - «VOCÊ · VER · LIVRO» (rabisco: um livro) — nova: LIVRO
   - «VOCÊ · PEGAR · LIVRO» (rabisco: uma mão pegando) — nova: PEGAR
3. **Pegar.** "E · Pegar o caderno" (AGIR no celular). A sala fica **travada** (`ctx.pin`: olhar em volta pode, sair não) até pegar.
4. **O dado continua**, ainda em balão:
   - «VOCÊ · ESCREVER · LIVRO» (rabisco: uma mão escrevendo, ao lado do **ícone do diário** do jogo) — nova: ESCREVER
   - «VOCÊ · ABRIR · LIVRO» (rabisco: o livro abrindo) — nova: ABRIR
5. **O ícone do diário aparece pela primeira vez** no canto da tela e **pulsa em dourado**, com a tela escurecida em volta. O jogador não pode
   fazer mais nada até abrir (J no PC, o botão no celular). Se demorar 8 s, o dado repete «VOCÊ ABRIR LIVRO», inclinado para o ícone.
6. **O caderno abre.** Ele **já é usado**:
   - **Desgaste (só visual, sem significado):** palavras riscadas e reescritas, rasuras, borrões de tinta, manchas de fuligem e de dedo,
     cantos dobrados, uma borda chamuscada, traços de lápis meio apagados, desenhos soltos nas margens (espirais, linhas, uma pedra, uma mão).
     Varia de página para página. **Regra:** nenhum rabisco pode parecer glifo (nada de pontos em grade nem molduras retas; tudo curvo e de mão),
     senão o jogador tenta ler o que não é língua.
   - **As anotações dela**, numa **tinta diferente** (sépia, desbotada) da do jogador, e que **não podem ser apagadas**:
     - ao lado de **ACENDER**: *"acho que é acender"*;
     - em **BRASEIRO**: só um desenho torto de braseiro e um *"?"*.
   - **Folhas arrancadas:** o caderno tem buracos; as **páginas arrancadas** dela estão espalhadas pelo jogo (respiros, câmaras secretas) e se
     encaixam ao serem achadas. São **colecionáveis** (junto das gemas) e contam a história dela.
   - As anotações dela **param de repente** no meio do caderno: foi onde ela parou. (Gancho de história.)
7. **A primeira anotação do jogador (obrigatória).** O livro vira sozinho para a página de **BRASEIRO** (a do *"?"* dela). O campo "o que eu
   acho que significa" **pulsa** com o cursor nele. O jogador **tem de escrever alguma coisa** (pelo menos uma letra; no celular abre o
   teclado). O diário **não corrige** (§5): vale qualquer texto. A letra dele aparece em outra cor, embaixo do rabisco dela.
8. **Fechar.** Com a anotação feita, o ícone de fechar (J/Esc, ou tocar fora) pulsa. Ao fechar, o dado dá um pulinho e diz «EU · SENTIR ·
   ALEGRIA». O jogo segue: o puzzle da sala 2 (acender **exatamente dois** braseiros) continua igual.

**O que ensina:** que o diário existe, como abrir e como anotar; que outros condenados passaram por ali e anotaram (e às vezes erraram); que o
jogador escreve **o que acha**, e ninguém confirma. As palavras LIVRO, PEGAR, ESCREVER e ABRIR são de história (nenhum puzzle as exige).
**Notas dela mais adiante:** poucas, só das primeiras palavras, e **uma ou duas erradas** (por exemplo, numa página arrancada, PEQUENO = *"um?"*).

**Motor:** botão do diário escondido até pegar o caderno; símbolos "avistados" guardados antes disso; caderno no chão revelado pela luz do
braseiro; `ctx.pin` até pegar; rabiscos novos no dado (LIVRO, mão pegando, mão escrevendo com o ícone do diário, livro abrindo); destaque
pulsante no ícone com a tela escurecida; modo guiado do diário (abre, vira para BRASEIRO, foco no campo, não fecha antes de escrever); camada
de **desgaste** nas páginas (desenhada no próprio papel em pixel, `book/pages.ts`); anotações "dela" em tinta própria, não apagáveis;
**páginas arrancadas** como buracos que se preenchem.

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

**Mural da ordem (vocabulário, achado pela ferramenta `verify_vocabulario.mjs`):** ao lado da lousa, um mural com dois braseiros numerados e uma
mão que acende primeiro o UM e depois o DOIS, em duas cenas; embaixo, «UM ANTES DOIS» e «DOIS DEPOIS UM». É o 2º ensino forte de
ANTES/DEPOIS antes da sala 7 (sem ele, a sala 7 exigiria palavras vistas uma vez só). Combina com o tema da sala (ordem).

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

**Dois labirintos (pedido do Pedro: usar o que já foi aprendido):** há **outro** labirinto igual no chão, entre o **grande** e o mínimo do fundo, que
parece o pavio mais óbvio (o grande é o primeiro que todo mundo acende). Mas as **setinhas talhadas** dentro dele (os chevrons da sala 4)
apontam **do mínimo para o grande**: o óleo corre ao contrário, e acender o grande não leva fogo a lugar nenhum. Só o labirinto do **médio** tem
as setinhas apontando para o mínimo. O jogador tem de **ler o sentido das canaletas**, como na sala 4, para escolher o pavio certo.

**Solução (passo a passo):**
1. Acender o **grande** (no meio) e o **médio** (no fundo). Ao acender o médio, o fogo começa a andar pelo labirinto.
2. **Voltar até o mínimo da entrada** (uns 19 m, ~5 s andando) e **esperar com o dado na mão, olhando para o fundo**.
3. Quando o mínimo do fundo **pega fogo sozinho** (a chama aparece lá longe), acender o mínimo da entrada. Os quatro ficam acesos juntos
   por um instante e a porta abre.
- Também funcionam: médio → grande → mínimo da entrada, e médio → mínimo da entrada → grande (apertado). O que não muda: **o mínimo do
  fundo tem de ser aceso pelo pavio**.

**Por que a mão não chega** (`node tools/verify_chama_curta.mjs`, simulação de caminho com a velocidade real do motor e espera livre):
- andando (4,2 m/s), chegando a 2 m de cada braseiro: **3 planos funcionam, e todos usam o pavio do médio**; o labirinto do grande corre ao contrário;
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

### Sala 7 — O Que a Casa Confirma (NÍVEL 5) · refeita em duas partes

**Por que refazer (o Pedro jogou):** a versão do jogo (`FIRE_FRASES`) despeja quatro palavras abstratas ao mesmo tempo (CONFIRMADO, BOATO, ANTES,
DEPOIS) em sete frases, e o jogador ainda não sabe ler nenhuma delas. Agora cada coisa vem no seu passo, e nenhuma chega sem ensino:
- **ANTES/DEPOIS** já foram vistos com desenho no mural do respiro R1 (ANTES · AGORA · DEPOIS) e no mural da ordem da sala 5 («UM ANTES DOIS»);
- **CONFIRMADO/BOATO** são ensinados aqui, na parte 1, numa lousa (o que o jogador já domina), por efeito;
- o **caderno de "a que veio antes"** (o diário do jogador, achado na sala 2) ganha aqui uma **página arrancada** dela com palpites sobre as marcas.

**Forma:** duas câmaras ligadas por uma grade. A 1ª é pequena (a lousa); a 2ª é a sala média das frases (11×17 m), sem braseiros à vista:
quatro rachaduras com brasa no chão.

**Parte 1 — as marcas (ensino, quase sem punição).** Na parede da 1ª câmara, uma **lousa de fogo** e, acima dela, duas frases curtas, uma
embaixo da outra:
- «ACENDER QUATRO **CONFIRMADO**» (talhada, com moldura)
- «ACENDER TRÊS **BOATO**» (gasta)
Quem escreve **TRÊS** (acreditou na de baixo) vê a Casa **apagar a lousa** e o glifo BOATO **piscar**. Quem escreve **QUATRO** vê o glifo
CONFIRMADO **acender** e a grade se abrir. As duas frases têm quatro glifos, três deles conhecidos: a única novidade é a marca do fim.
(O verificador confere que escrever um nunca passa pelo outro no caminho: o efeito de cada marca é limpo.)
Junto da grade, uma **página arrancada** do caderno dela: *"Duas frases quase iguais. A Casa fez a de cima e apagou a de baixo. Acho
que o risquinho com o ponto em cima quer dizer 'é verdade'. O outro, 'dizem que'."*

**Parte 2 — ANTES/DEPOIS (o puzzle).** Cinco frases curtas em dois parágrafos, cada uma com o soquete de brasa no começo:
| Parede | Frase | Marca |
|---|---|---|
| esquerda | «UM ANTES TRÊS» | CONFIRMADO |
| | «TRÊS ANTES DOIS» | boato |
| direita | «QUATRO DEPOIS DOIS» | CONFIRMADO |
| | «UM ANTES QUATRO» | boato |
| | «UM DEPOIS QUATRO» | CONFIRMADO |
A porta: «ACENDER CONFIRMADO».

**Solução (passo a passo):**
1. Escrever **QUATRO** na lousa da 1ª câmara (os quatro cantos). A grade abre.
2. Acender com o Fogo as **três frases CONFIRMADAS** (o dado junto da frase). Um boato apaga as acesas e a Casa recusa o fogo por 4 s.
3. Os **quatro pilares** sobem (UM a QUATRO).
4. Montar a cadeia: «QUATRO DEPOIS DOIS» → 2 antes de 4; «UM DEPOIS QUATRO» → 4 antes de 1; «UM ANTES TRÊS» → 1 antes de 3. Cadeia **2 → 4 → 1 → 3**.
5. **Acender DOIS, QUATRO, UM, TRÊS.** Errar apaga tudo e deixa os pilares frios por 8 s.

**Por que é única** (`node tools/verify_confirma.mjs`): uma ordem só entre 24; sem qualquer uma das três confirmadas sobram 4 a 6 ordens; os dois
boatos são falsos e acreditar neles dá contradição; a ordem não é 1-2-3-4 nem a de leitura das frases (1-3-4-2).

**Por que continua sendo nível 5:** o difícil agora é **pensar** (DEPOIS vira ao contrário duas vezes, a ordem não é a de leitura, o boato
«UM ANTES QUATRO» parece natural e engana), não decifrar um muro de glifos. As cadeias longas (5 braseiros, nomes trocados) ficam para as salas 9 e 11.

**Os boatos são todos falsos de propósito** (a sala 11 quebra esse hábito). **Sem segredo próprio** (os Banhos Secos, R2, vêm logo depois).

**Motor:** lousa de fogo com duas frases (aceita uma, recusa a outra e faz o glifo da marca piscar); `FIRE_FRASES` com o conteúdo novo
(4 pilares, 5 frases, `seq` = 2, 4, 1, 3).

### Sala 8 — O Pano (NÍVEL 5) · "o fogo queima o boato" + constelação C2

**A ideia:** o que é **talhado** é da Casa; o que é **tecido** é boato (cada pano tem a marca BOATO bordada embaixo). O jogador nunca
atirou o dado em nada que não fosse braseiro ou frase; aqui precisa atirar **no pano**. O fogo queima o pano de baixo para cima (~2 s) e
mostra a pedra. O pano volta quando o jogador sai da sala.

**Forma:** capela alta e estreita (8×14 m, teto 7), seis pilares em duas fileiras de três (todos com tocha), três tochas de parede,
panos pendurados **alto** (só se alcançam **arremessando**), rachaduras frias no centro do chão e frisos de pedra no teto.

**Braseiros:** quatro, com número no pedestal (UM a QUATRO). Regra `order` com `hints: false`, penalidade 8 s.

**Revisão (casar com os Banhos Secos, R2, e ensinar sem punir):**
- O jogador chega dos **Banhos Secos (R2)**, onde viu um estandarte de pano com BOATO bordado, alto demais e sem nada a fazer, e leu na página arrancada nº 3
  *"o que está talhado não mente"*. A sala 8 é onde isso vira ferramenta.
- **Demonstração na entrada (§22, sem punição):** logo depois da porta de entrada, a Casa deixou um **braseiro pequeno aceso** e, pendurado
  acima dele, um **trapo** com um glifo tecido. Enquanto o jogador olha, uma fagulha sobe, o trapo **pega fogo sozinho** e queima de baixo
  para cima, e atrás dele aparece, talhada na pedra, a palavra **BRASEIRO**. Ninguém explicou nada: o jogador **viu** que pano queima e que
  embaixo há pedra escrita. Daí em diante é ele quem atira o fogo nos panos.
- Isso troca a "epifania no escuro" por uma **epifania guiada**: o puzzle continua sendo **ler** (qual pano esconde o quê, qual marca vale),
  não adivinhar que pano queima.

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

**Revisão na curva nova:**
- **A armadilha ficou mais forte.** Desde a sala 3 o jogador sabe que **número = face do dado**. O glifo GRANDE é a moldura de qualidade com
  os **quatro cantos** (a face 4) e PEQUENO, com **o ponto do meio** (a face 1). Quem aprendeu bem a sala 3 lê "QUATRO" e "UM" e cai direto na
  contradição. A lição da sala: **a moldura muda o sentido** (sem moldura = número; com as duas barras = qualidade). Isso prepara a ideia de
  família de glifos pela moldura.
- **Forma redonda (rotunda, ~12 m):** o GRANDE fica **no centro** e os outros quatro em volta, em cruz, de modo que **não há começo óbvio**
  de leitura (nem esquerda-direita, nem frente-fundo). Posições (vistas da entrada): UM à esquerda, DOIS ao fundo, TRÊS à direita, QUATRO (o
  pequeno) à frente, junto da entrada. As três frases ficam em parágrafos curtos em três pontos da parede curva; a frase da porta, na porta.
  (O `FireSpec` acima foi escrito para uma sala retangular: a rotunda precisa de um módulo à mão ou de `shape: 'round'` no construtor.)
- **Sem segredo próprio**: logo antes vem a sala 8 (C2) e logo depois a 10.

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

### Sala 10 — A Ponte de Madeira (NÍVEL 6) · "o fogo destrói o próprio caminho" + constelação C3

**A ideia:** na sala 4 o fogo corria pelas canaletas; aqui ele **também queima a madeira** por onde passa. Onde duas canaletas diagonais se cruzam,
uma passa **por baixo de uma ponte de madeira** que leva a outra **por cima**. Quando o fogo passa por baixo, a ponte queima e cai, e a canaleta
de cima fica **cortada**. Então **a ordem das ignições muda o desenho**: o primeiro fogo pode destruir o caminho do segundo.

**Forma:** o **fosso**. Entra-se pela **borda, lá em cima**; uma **rampa em espiral** desce colada às paredes até o fundo (uns 8 m). Enquanto desce,
o jogador vê a grade lá embaixo **de ângulos diferentes** (a espiral gira): tem de manter na cabeça qual lado é a porta. No fundo, **9 braseiros em
grade** com canaletas (chevrons mostram o sentido), a **ponte de madeira** no bloco do canto do fundo à esquerda, e a porta com «ACENDER DOIS» e o
glifo **MAIS** (uma cruz) talhado. Na borda, lá em cima, **8 tochas**; nas paredes do fundo, mais **3**.

**Regras:** como na sala 4 (duas ignições, contador na porta), mais uma: **enquanto há fogo correndo, a Casa recusa o fogo** (uma ignição de cada
vez). Errado: quando o fogo para, tudo se apaga, **a Casa repõe a ponte** (uma prancha nova desliza da parede) e os braseiros ficam frios por 6 s.

**Canaletas** (casa 0 = canto do fundo à esquerda, vendo a porta em cima): 6→7, 0→3, 3→1, 2→1, 8→5, 4→5, 4→3, 7→4, 2→4, 2→5, 4→0.
A **ponte**: a canaleta **3→1** passa **por baixo**; a canaleta **4→0** passa **por cima**, na madeira.

**Solução (passo a passo):**
1. Olhar de cima: a cruz pede 1, 3, 4, 5 e 7 (as quatro pontas e o centro), e **nenhum canto**.
2. Perceber o problema: o centro (4) espalha fogo para 5, 3 e **0 (um canto!)**, pela canaleta que passa **em cima da ponte**.
3. Perceber a saída: a canaleta 3→1 passa **por baixo** da ponte. Se o fogo passar por ela **antes**, a ponte queima e cai, e o caminho 4→0 deixa de existir.
4. **Fogo no 3** (meio da borda esquerda): acende o 3 e o 1, e **queima a ponte**.
5. **Depois, fogo no 7** (meio da frente): o fogo sobe ao centro e vai ao 5 e ao 3; o caminho para o canto 0 já caiu. Acesos: 1, 3, 4, 5, 7: **a cruz**.

**Por que é única** (`node tools/verify_ponte.mjs`): das 72 sequências de duas ignições, **só 3→7** escreve a cruz; a **ordem contrária** (7→3) acende
também o canto 0; com uma ignição é impossível; **sem a ponte** (se madeira não queimasse) **não há resposta nenhuma**: a ponte é a chave; e nenhuma
sequência com o centro resolve (a lição "comece pelo meio" da sala 4 engana de novo).

**"Resolvi… mas será que resolvi?" → constelação C3 (só Fogo):** de volta lá em cima (a rampa leva de volta à borda, ou o jogador sobe para ver), a
cruz acesa no fundo deixa **os quatro cantos escuros**. Olhando bem do alto, as **8 tochas da borda** caem, vistas de cima, sobre as casas da grade:
4 sobre os cantos, 4 sobre os meios das bordas. **Acender só as 4 da borda que caem sobre os cantos** (as dos meios cairiam em cima de braseiros
já acesos; as 3 do fundo são iscas): visto do alto, a grade fica **inteira** acesa (TODOS); um braseiro sobe numa plataforma no meio da rampa e
abre a câmara. Verificado: 1 conjunto aceito de 2048. É a constelação de **perspectiva**: a grade só existe de um ponto de vista, e a pista é
**o que falta** no desenho que o jogador acabou de fazer.

**O que ensina:** madeira queima e **corta** caminhos; a **ordem** das ignições importa; planejar vendo de cima e girando; ler a falta (o
complemento de um desenho). **Palavra vista:** MAIS (só o desenho é exigido).

**Motor:** fosso com rampa em espiral; canaletas da sala 4 + **ponte de madeira** que queima quando o fogo passa por baixo e corta a canaleta de
cima (e volta no erro); "uma ignição de cada vez"; tochas na borda com posição projetada na grade; braseiro que sobe na rampa.

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

### Sala 11 — revisão na curva nova
- **Forma em L** (tabela da seção 2): a demonstração (as duas frases já acesas) fica na quina, à vista de quem entra; um parágrafo em cada ala;
  a porta no fim da ala do fundo. Do meio de uma ala não se vê a outra: o jogador tem de **andar e lembrar** (ou anotar).
- **Segredo S5 (camada 2):** no escuro da punição, o teto da ala do fundo mostra a palavra fosforescente **ESCURO** (ver S5).
- O resto fica como está (a solução não muda).

### Sala 12 — A Sombra (NÍVEL 7) · "a luz escreve, e a frase tem de ser verdade"

**A ideia:** até aqui quem escrevia era o fogo, ponto por ponto. Agora quem escreve é **a luz**, passando por furos. E volta uma regra da sala 3
que o jogador talvez tenha esquecido: **a frase da porta tem de ficar verdadeira**. A virada: dá para escrever o número certo com o número
**errado** de braseiros, e a Casa não aceita a mentira. É preciso acender um braseiro que **não muda o desenho**, só a verdade.

**Forma:** salão escuro e amplo (14×16 m, teto 6). No meio, uma **tela de pedra** em pé com **nove "olhos"** em grade 3×3; só **dois** são furos de
verdade (o de cima à esquerda e o do centro; os outros sete são cegos, só uma cavidade). Na parede do fundo, a frase «ACENDER ▢ BRASEIRO»
talhada **grande**, e a casa ▢ é uma **moldura 3×3** de pedra clara: a luz cai dentro dela. Cinco braseiros em volta da tela:
| Braseiro | Onde | Manchas de luz na moldura (casas) |
|---|---|---|
| **F** | na frente da tela, meia altura | 0 e 4 |
| **BD** | baixo, à direita | 0 |
| **AE** | alto, à esquerda (num pedestal alto) | 4 e 8 |
| **BC** | baixo, no centro (no chão) | 1 |
| **BE** | baixo, à esquerda | 2 |
(Casa 0 = canto de cima à esquerda da moldura. O motor não precisa de sombra real: calcula as manchas e as desenha.)

**Regras:** os braseiros ficam acesos (sem tempo). Quando a moldura mostra um **número** e o número de acesos **bate**, a Casa lê a frase e a porta
abre. Se mostra um número e **não bate** (a frase mentiria), depois de 3 s a Casa pune: apaga tudo (com o escuro, ver §6) e os braseiros ficam
frios por 6 s. Qualquer outro desenho: nada acontece (pode-se testar um braseiro de cada vez, olhando a moldura).

**Solução (passo a passo):**
1. Acender um braseiro e **olhar a parede**: aparecem manchas na moldura (a epifania: "a luz escreve na frase").
2. Testar os outros e anotar o que cada um projeta (tabela acima).
3. Achar o TRÊS (a diagonal 0, 4, 8): **F + AE** já fazem a diagonal, mas são **dois** acesos: a frase diria "acender TRÊS braseiro" com dois.
   A Casa pune. (**BD + AE** também fazem a diagonal com dois: a mesma mentira.)
4. A saída: acender **F, AE e BD**. O BD projeta só a casa 0, que **já estava acesa**: o desenho não muda, mas agora são **três** braseiros.
   A frase fica verdadeira e a porta abre.

**Por que é única** (`node tools/verify_sombra.mjs`): dos 31 conjuntos possíveis, só **F+BD+AE** escreve um número com o mesmo número de
braseiros; dois pares escrevem TRÊS mentindo (a armadilha); nenhum braseiro sozinho escreve UM.

**O que ensina:** a luz escreve (sombra/projeção); **dizer é fazer**: a frase só vale se for verdade (retoma a sala 3); um gesto que "não muda
nada" pode mudar a verdade. **Sem constelação** (a sala inteira já é de projeção). **Motor:** tela com furos e moldura calculada (M5); julgamento
"número na moldura = número de acesos".

### Sala 13 — O Escuro (NÍVEL 7) · "errar de propósito"

**A ideia:** desde a sala 2, toda vez que o jogador erra, a Casa apaga tudo. Aqui **não há pista nenhuma à vista**: o que é preciso saber está
escrito no teto, em **cal fosforescente**, que só aparece **no escuro total**. E o único jeito de ter escuro é **errar**. Errar vira ferramenta.
(Decidido no §6: a punição apaga também a luz ambiente por 2,5 s, em todas as salas; ficha 1 no §4.)

**Forma:** pequena, baixa e opressiva (6×9 m, teto 2,6). Quatro braseiros **já acesos pela Casa** nos cantos (só luz; não fazem parte do puzzle).
Na porta, **três lousas lado a lado** e a frase «ACENDER ▢ ▢ ▢ ORDEM» (uma lista de números é uma ordem, como na sala 4).

**A pista antes:** no respiro R3, logo antes, uma página arrancada dela: *"Quando eu erro, a Casa apaga tudo. Por um instante, no escuro, eu juro
que vi alguma coisa brilhando no teto."*

**Regras:** a Casa julga quando **as três lousas** mostram um número completo. Errado: apaga tudo, inclusive a luz ambiente, por **4 s** (só nesta sala; nas outras são 2,5 s), e
limpa as lousas. Nesse escuro aparecem, no teto, três frases fosforescentes (e, sobre a porta, a palavra **ESCURO**, que só existe no escuro:
é como a palavra se ensina):
| Posição no teto | Frase | Marca |
|---|---|---|
| perto da porta | «CINCO ANTES UM» | CONFIRMADO |
| no meio | «UM ANTES DOIS» | boato (gasta) |
| no fundo | «DOIS ANTES CINCO» | CONFIRMADO |

**Solução (passo a passo):**
1. Perceber que não há nada para ler. Lembrar da página dela (ou do próprio escuro das salas anteriores).
2. **Errar de propósito:** escrever quaisquer três números nas lousas. Escuro. **Olhar para cima.**
3. As frases estão espalhadas pelo teto: em 4 s dá para ler uma ou duas. Errar mais uma vez, olhando a outra parte do teto, e **anotar no diário**.
4. Confirmadas: 5 antes de 1, 2 antes de 5 → **2, 5, 1**. O boato «UM ANTES DOIS» é falso (e contradiz as confirmadas).
5. Escrever **DOIS, CINCO, UM** nas três lousas. A porta abre.

**Por que é única** (`node tools/verify_escuro.mjs`): o teto cita exatamente três números; as duas confirmadas dão uma ordem só e são ambas
necessárias; acreditar no boato dá contradição; a ordem não é a crescente nem a de leitura do teto.

**O que ensina:** **errar é uma ferramenta**; o escuro tem escrita (abre o segredo S5 em todas as salas anteriores); anotar no diário o que
some rápido. **Palavra nova:** ESCURO. **Motor:** M6 (cal fosforescente visível só abaixo de um limite de luz; a punição apaga a luz
ambiente); três lousas julgadas juntas.

### Sala 14 — A Lei Pequena (NÍVEL 8) · a primeira lei da contagem

**A ideia:** até aqui, boato verdadeiro ou falso se decidia pela cadeia das confirmadas. Agora as confirmadas **não bastam**, e uma **lei** diz
**quantos** boatos são verdade: «UM BOATO IGUAL VERDADE» (exatamente um). E aparece o truque que o Tribunal vai exigir: **dois boatos que dizem
a mesma coisa** com palavras diferentes são verdadeiros juntos ou falsos juntos.

**Forma:** a sala **sobe**. Térreo: as frases confirmadas e um **mural com figura** (uma balança com DOIS de cada lado, «DOIS IGUAL DOIS
CONFIRMADO»: IGUAL é o sinal "=" de duas barras, e a balança o confirma). Uma **rampa** larga contorna a sala subindo; nas paredes da rampa, os
três boatos (gastos). No **mezanino**, os quatro braseiros (UM a QUATRO), a lei e a porta. Do mezanino não se leem as frases de baixo:
**lembrar ou anotar**.

**Frases:**
| Onde | Frase | Marca |
|---|---|---|
| térreo | «QUATRO DEPOIS UM» | CONFIRMADO |
| térreo | «DOIS ANTES TRÊS» | CONFIRMADO |
| rampa | «DOIS ANTES UM» | boato |
| rampa | «UM DEPOIS DOIS» | boato |
| rampa | «DOIS DEPOIS QUATRO» | boato |
| mezanino | «UM BOATO IGUAL VERDADE» (a lei) | CONFIRMADO |
Porta: «ACENDER QUATRO BRASEIRO ORDEM CONFIRMADO». Errar: escuro e braseiros frios por 10 s, sem gema por passo.

**Solução (passo a passo):**
1. Perceber que «DOIS ANTES UM» e «UM DEPOIS DOIS» **dizem a mesma coisa**: os dois são verdade ou os dois são mentira.
2. A lei diz que **só um** boato é verdade. Então esses dois **não podem** ser verdade (seriam dois). São mentira: o **1 vem antes do 2**.
3. O verdadeiro é o terceiro: «DOIS DEPOIS QUATRO» → 4 antes de 2.
4. Juntar com as confirmadas (1 antes de 4; 2 antes de 3): **1, 4, 2, 3**.
5. Subir e acender **UM, QUATRO, DOIS, TRÊS**.

**Por que é única** (`node tools/verify_lei.mjs`): uma ordem só entre 24; cada uma das duas confirmadas e cada um dos três boatos é necessário;
só com as confirmadas sobram 6 ordens; ler "todos os boatos falsos" dá 2 ordens e "todos verdadeiros", nenhuma.

**O que ensina:** a lei da contagem; IGUAL; equivalência entre frases; carregar informação de um andar para o outro. **Prepara:** as salas 16
e 17 e o Tribunal. **Motor:** sala de dois níveis com rampa (precedente: O Mirante); regra `order` com 4 pilares.

### Sala 15 — O Fogo que Corre (NÍVEL 8) · "o desenho existe num instante"

**A ideia:** o fogo corre (sala 4), as chamas se apagam (sala 6), e agora as duas coisas juntas: cada braseiro queima **só 4 s** e **só uma vez**
por tentativa (o óleo acaba). A porta quer um desenho que exista **num instante**: um braseiro que já se apagou **também ajuda a escrever**,
porque some do desenho.

**Forma:** salão aberto (20×20 m) com **nove plataformas** em alturas diferentes, em grade 3×3, cada uma com um braseiro; **canaletas descem**
de uma plataforma para outra (a altura mostra o sentido). Canaleta reta e curta: o fogo leva 1 s; média, 2 s; longa e sinuosa, 3 s. Ao lado de
cada braseiro, um **poste com tocha** apagada (constelação C5) e três tochas nas paredes.
**Canaletas** (de → para, segundos; casa 0 = canto do fundo à esquerda, vendo a porta em cima): 4→2 (3), 4→8 (2), 4→0 (2), 6→4 (2), 6→7 (3),
7→4 (3), 7→8 (1), 5→8 (1), 5→1 (1), 1→0 (1), 3→0 (2), 3→7 (3).
**Porta:** «ACENDER DOIS BRASEIRO TEMPO» e o glifo **QUATRO** talhado. Aceita se, em algum instante, os acesos forem **exatamente** os quatro
cantos. Quando tudo se apaga sem acertar, a Casa pune (escuro) e reabastece o óleo.

**Solução (passo a passo):**
1. Ver que o centro alimenta três cantos (0 e 8 em 2 s, o 2 em 3 s) e **se apaga aos 4 s** e não reacende (o óleo acabou).
2. Falta o canto da frente à esquerda (6), que nenhuma canaleta alimenta a partir do centro: **2ª ignição, à mão**.
3. Mas o 6 tem uma canaleta para o 7 (3 s), e o 7 não pode estar aceso no instante certo. Se o 6 for aceso cedo demais, o 7 acende antes de o
   centro se apagar.
4. **Fogo no centro; esperar ~3 s; fogo no canto da frente à esquerda.** Por volta dos 4 s o centro se apaga e, por um instante, só os quatro
   cantos estão acesos: a porta abre. (Janela confortável: de 1,5 s a 5,5 s entre as duas ignições.)

**Por que é única** (`node tools/verify_fogo_corre.mjs`): uma ignição só nunca basta; de todos os pares ordenados, **só centro → canto 6**
funciona, com a janela de 1,5 a 5,5 s; acender os dois juntos falha.

**Constelação C5 (camada 2, só Fogo):** quando uma tentativa falha, o escuro mostra, no teto, o glifo **MENOS** (a fileira do meio, três pontos).
Acender as tochas dos **postes das três plataformas do meio** (casas 3, 4, 5), nenhuma outra: o braseiro secreto sobe na plataforma central
(gema + diário). 1 conjunto aceito entre 4096.

**O que ensina:** escrever com o **tempo**: apagar também é escrever; planejar a espera. **Motor:** M2 com atraso por canaleta; braseiro que
queima uma vez por tentativa e reabastece; plataformas; tochas nos postes.

### Sala 16 — Os Que Dizem o Mesmo (NÍVEL 9) · "dizer é fazer"

**A ideia:** o jogador sabe que o fogo queima o boato (sala 8) e que a lei conta os boatos (sala 14). Aqui as duas coisas se encontram: os boatos
estão em **estandartes de pano**, a lei conta **os boatos que existem**, e com todos eles **a lei não tem solução**. A porta manda: «ACENDER UM
BOATO». **Queimar um estandarte tira aquele boato da conta.** O jogador **edita as provas**: escolhe o que deixa de ter sido dito.

**Forma:** **claustro a céu aberto**, a sala mais aberta do capítulo: um pátio quadrado com galerias em volta (8 colunas: 4 nos cantos, 4 no meio
dos lados) e uma **fonte** no centro. Cinco braseiros no pátio: UM, DOIS, TRÊS (o **GRANDE**), QUATRO e CINCO (o **PEQUENO**).
**Frases:** confirmadas, talhadas nas paredes das galerias; boatos, em **estandartes** pendurados entre as colunas; a lei, na fonte.
| Onde | Frase | Marca |
|---|---|---|
| galerias (pedra) | «PEQUENO ANTES TRÊS» · «UM ANTES CINCO» · «CINCO ANTES DOIS» | CONFIRMADO |
| estandartes (pano) | «DOIS ANTES QUATRO» · «GRANDE DEPOIS DOIS» · «DOIS ANTES TRÊS» · «TRÊS ANTES UM» · «TRÊS DEPOIS QUATRO» | BOATO |
| fonte | «DOIS BOATO IGUAL VERDADE» | CONFIRMADO |
Porta: «ACENDER UM BOATO» e «ACENDER TODOS BRASEIRO ORDEM». Queimar um **2º** estandarte: a Casa pendura todos de volta (recomeça).

**Solução (passo a passo):**
1. Das confirmadas: **1** é o primeiro; depois **5**; o 5 vem antes do 2 e do 3.
2. «TRÊS ANTES UM» é **sempre falso** (o UM é o primeiro).
3. «GRANDE DEPOIS DOIS» e «DOIS ANTES TRÊS» dizem **a mesma coisa** (GRANDE é o 3): valem juntos. Com os cinco estandartes, a conta não fecha:
   - se o par for **verdade**, já são dois verdadeiros; então «DOIS ANTES QUATRO» e «TRÊS DEPOIS QUATRO» são mentira: 4 antes de 2 e 3 antes de 4,
     o que dá 2 antes de 3 antes de 4 antes de 2: **contradição**;
   - se o par for **mentira**, os dois verdadeiros teriam de ser «DOIS ANTES QUATRO» e «TRÊS DEPOIS QUATRO»: 2 antes de 4 antes de 3, mas o par
     falso diz 3 antes de 2: **contradição**.
   É por isso que a porta manda queimar um boato.
4. Testar cada estandarte ("e se este não existisse?"): só **sem «DOIS ANTES QUATRO»** sobra uma resposta. Sem ele, o par é verdade (2 antes de 3),
   «TRÊS ANTES UM» é falso, e a lei exige que «TRÊS DEPOIS QUATRO» seja falso: 3 antes de 4. (Sem «TRÊS DEPOIS QUATRO», por exemplo, o 4 poderia
   ficar em três lugares.) **Queimar «DOIS ANTES QUATRO».**
5. Ordem: **1, 5, 2, 3, 4**. Acender.

**Por que é única** (`node tools/verify_dizem_mesmo.mjs`): com os cinco estandartes, nenhuma ordem; queimando cada um: «DOIS ANTES QUATRO» → 1 ordem;
«GRANDE DEPOIS DOIS» → 4; «DOIS ANTES TRÊS» → 4; «TRÊS ANTES UM» → 0; «TRÊS DEPOIS QUATRO» → 3. As três confirmadas são necessárias.

**Constelação C6 (camada 1, só Fogo):** as 8 colunas da galeria e a fonte formam uma grade 3×3, todas com tocha, mais 3 tochas nas paredes. Os
**frisos** de pedra: o da galeria do fundo (de canto a canto), uma **viga de pedra que cruza o pátio na diagonal** (do canto do fundo à direita
ao da frente à esquerda) e o da galeria da frente. Formam um **Z**: as linhas de **DE NOVO**. Acender as tochas das **quatro colunas dos cantos**,
nenhuma outra: o fogo corre pelos frisos e pela viga, desenha o Z, e a fonte se abre (gema + diário). 1 conjunto de 4096; dos 11 verbos que essas
tochas conseguiriam escrever, só DE NOVO tem essas linhas.

**O que ensina:** a lei conta o que **existe**; queimar é **desdizer**; testar hipóteses ("e se este não existisse?"). **Motor:** estandartes
queimáveis que saem da conta (M3); "um só"; claustro aberto com céu.

### Sala 17 — A Memória da Casa (NÍVEL 9) · ensaio do Tribunal

**A ideia:** tudo junto, menor que o Tribunal: apelidos, lei de dois, um par equivalente (número × apelido), e **uma confirmada que só existe no
escuro**. Desta vez o escuro não vem de errar o puzzle: vem de um **soquete frio** (o sinal de "acendível que a Casa não anuncia").

**Forma:** um **hub** redondo com os quatro braseiros (UM, DOIS, TRÊS = **GRANDE**, QUATRO = **PEQUENO**) e a porta; **três anexos** em volta:
- **Anexo A (pedra):** «PEQUENO ANTES DOIS» CONFIRMADO.
- **Anexo B (paredes gastas):** os quatro boatos: «UM ANTES GRANDE» · «QUATRO DEPOIS TRÊS» · «GRANDE ANTES PEQUENO» · «TRÊS ANTES DOIS».
- **Anexo C:** a lei «DOIS BOATO IGUAL VERDADE» e, ao lado, um **quadro de frase vazio** (moldura talhada, liso, com o lugar da marca) com um
  **soquete frio** embaixo. Acender o soquete faz a Casa punir (não foi pedido): escuro de 2,5 s, e no quadro aparece, fosforescente,
  **«UM DEPOIS QUATRO» CONFIRMADO**.
Porta do hub: «ACENDER TODOS BRASEIRO ORDEM CONFIRMADO». O glifo **TODOS** (os nove pontos) enche conforme os braseiros acendem: é como a palavra
se explica. Errar: escuro e frios por 12 s.

**Solução (passo a passo):**
1. Achar a confirmada escondida: o quadro vazio + o soquete frio → acender → escuro → **UM DEPOIS QUATRO** (4 antes de 1). Anotar.
2. Confirmadas: 4 antes de 2 (PEQUENO = 4) e 4 antes de 1.
3. «QUATRO DEPOIS TRÊS» e «GRANDE ANTES PEQUENO» **dizem a mesma coisa** (3 antes de 4). Se fossem verdade, já seriam os dois verdadeiros da lei,
   e os outros dois boatos seriam mentira: «UM ANTES GRANDE» falso → 3 antes de 1; «TRÊS ANTES DOIS» falso → 2 antes de 3. Com 3 antes de 4 e 4
   antes de 2, isso dá 3 antes de 4 antes de 2 antes de 3: **contradição**. Então o par é mentira: **4 antes de 3**.
4. A lei pede dois verdadeiros: os outros dois, «UM ANTES GRANDE» (1 antes de 3) e «TRÊS ANTES DOIS» (3 antes de 2).
5. Ordem: **4, 1, 3, 2** (QUATRO, UM, TRÊS, DOIS). Acender.

**Por que é única** (`node tools/verify_lei.mjs`): uma ordem só; cada pista é necessária, **inclusive a do escuro**; só com as confirmadas sobram 8
ordens; "todos os boatos falsos" dá 1 ordem errada; "todos verdadeiros", nenhuma.

**O que ensina:** juntar tudo; o soquete frio esconde escrita (ensinado na R5, logo antes; prepara o segredo do poço, S8). **Palavra nova:** TODOS (por efeito).
**Motor:** hub + anexos (§20, opção a); quadro vazio com texto fosforescente e soquete frio que dispara o escuro.

### R3 · A Galeria dos Condenados — o puzzle opcional (nível 3) ✔ `tools/verify_lei.mjs`
Numa câmara lateral, três braseiros (UM, DOIS, TRÊS), um **mural com figura** (a mesma balança da sala 14: «DOIS IGUAL DOIS»), e na parede, riscadas
a **giz** por outros condenados (giz não é pedra: são boatos), três frases: «TRÊS ANTES UM», «TRÊS ANTES DOIS», «DOIS DEPOIS TRÊS». Talhada, a lei
«UM BOATO IGUAL VERDADE». Porta da câmara: «ACENDER BRASEIRO ORDEM».
**Solução:** «TRÊS ANTES DOIS» e «DOIS DEPOIS TRÊS» dizem o mesmo; não podem ser os dois verdade (a lei diz um só); então são falsos (2 antes de 3), e
o verdadeiro é «TRÊS ANTES UM». Ordem **2, 3, 1** → gema. É a prévia, leve e opcional, da sala 14.
**Página arrancada nº 4 (dela),** no banco do fundo: *"Quando eu erro, a Casa apaga tudo. Por um instante, no escuro, eu juro que vi alguma coisa
brilhando no teto."* (a pista da sala 13).

### A Biblioteca — os puzzles opcionais do térreo
- **Constelação das mesas (C-Bib, só Fogo)** ✔ `tools/verify_constelacoes.mjs`: nove mesas de leitura em grade, cada uma com lamparina, mais quatro
  lamparinas de parede. A pista é a **página na mesa do Escrivão**, vista pela grade do escritório. A mesa está virada para a cadeira dele, do outro
  lado: o jogador vê a página **de cabeça para baixo**. Copiada como se vê, dá os pontos do triângulo de ACENDER (o jogador conhece bem): a
  armadilha. A outra linha da página tem glifos que o jogador conhece (BRASEIRO, DOIS) **de cabeça para baixo**, e isso denuncia o lado. Lida do
  lado certo, é **PEGAR** (dois cantos de cima e o meio de baixo). **Solução:** acender as lamparinas das mesas **0, 2 e 7** (os dois cantos do
  fundo e a do meio da frente, vendo o escritório em cima). 1 conjunto aceito entre 8192.
- **Lousas da sala de aula:** (a) QUATRO; (b) DOIS; (c) **camada 2**: trancada até o jogador voltar depois da sala 14: o mural mostra um braseiro
  pequeno com o número QUATRO e a frase «PEQUENO IGUAL ▢» → escrever **QUATRO** (o pequeno é o 4).
- **Mural de encaixe nº 1:** trocar os blocos de lugar até cada desenho ter o seu nome (PORTA, LIVRO, CHAVE, SINO: os nomes estão no Museu).
- **Os livros que mentem:** uma estante com seis livros: três com **BOATO** na lombada, dois **cadernos de condenados** (sem marca, em português), um
  com **CONFIRMADO** (encadernado em pedra: não queima). Queimar os três de boato: atrás do terceiro, uma gema. Queimar um caderno: a página se
  perde até sair da ala.

## 6. Decisões
**Já decididas pelo Pedro:** a Casa (o jogo todo) é **um dado** (S9); constelações do capítulo 1 só com Fogo, e com as ferramentas novas
a partir do capítulo 2; sempre tochas a mais; gemas (100%), diários com vocabulário e um **4º final que se acumula** (§3d).

**Fechadas em 25/11** (o Pedro pediu "ajuste tudo que falta"; cada uma pode ser revertida, e o que muda se ele reverter está dito):
1. **Errar de propósito: SIM.** Toda punição apaga também a luz ambiente por 2,5 s (ficha 1, §4). É a forma mais barata: a cal só segue o próprio
   escuro, sem calcular luz. *Se reverter:* a sala 13 vira "teto que se lê com o dado de Fogo na mão, de perto" (perde a epifania), a 17 troca o
   escuro por uma frase sob pano, e C5, S5 e S8 saem.
2. **Pedra = CONFIRMADO, pano e papel = BOATO, o fogo queima o boato: SIM,** como regra do mundo inteiro. Já vale nas salas 8, 16 e na Biblioteca.
   Exceção única e de propósito: os cadernos dos condenados (papel sem marca) não são boato, e queimá-los custa uma página (§2d).
3. **O que o dado gigante mostra no 4º final: a face SEIS, sempre.** É o número que a língua dos Contáveis não tem (não há glifo de SEIS; a porta de
   seis pontos da R4 é a semente). O veredito cai fora da língua da sentença: ninguém pode lê-lo, então não há sentença. Fixo, não sorteado, para
   que o final seja um só e possa ser antecipado por quem reparar na porta. Não destrava nada além de uma última página no diário.
4. **Formas das salas:** a sessão principal já fez a rotunda (9) e o fosso em espiral (10). Para o resto, a base mais barata está nas fichas do §4:
   mezanino = molde do Mirante (`room4.ts`); claustro = pátio sem teto com o céu da abertura; hub = rotunda + 3 corredores curtos; plataformas =
   degraus largos. A sala em L da 11 ficou como está no jogo (não muda o puzzle).
5. **O Tribunal vai para depois da sala 17** (sala 18), como no §2. Até as salas 12 a 17 existirem no jogo, ele pode ficar onde está.

**Ainda do Pedro (não é design):** conferir se o nome **"Sentença"** (e "Sentence", em inglês) está livre nas lojas (Steam, App Store, Google Play)
antes de registrar o logo.
