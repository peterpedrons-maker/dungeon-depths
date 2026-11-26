# Level design do capítulo 1: de uma fila de caixas para um lugar

> Documento da sessão de puzzles (branch `claude/puzzles-design`). **Nenhum puzzle muda.** Muda o espaço em volta deles: a forma das salas, onde
> ficam as portas, como as salas se ligam e o que o jogador vê. O mapa abaixo é conferido por `node tools/verify_mapa.mjs`.

## 1. O diagnóstico

- **No motor, as salas ficam numa linha reta.** `scene.ts` (`buildWorld`) põe cada sala logo à frente da anterior no eixo z: a porta da sala N está
  sempre na parede do fundo e desemboca na entrada da sala N+1. O mapa do diário é montado a partir dessa lista, por isso vira uma **fila de
  quadrados**.
- **Da entrada se vê a sala inteira**, e a saída está sempre em frente. O jogador não procura nada: atravessa.
- **Quase toda sala é uma caixa**: chão plano, teto plano, quatro paredes do mesmo tijolo. Muda o tamanho, não o lugar.

O que falta não é enfeite: é **level design**. A regra do King's Field que queremos copiar não é o gráfico: é que cada lugar é diferente do
anterior **pela forma**, e que a dungeon às vezes se abre em algo inesperado (o bosque iluminado no meio da caverna).

## 2. As regras (valem para toda sala nova e para a reforma das que existem)

1. **Nunca mostrar a sala inteira da entrada.** Uma coluna, um muro pela metade, um desnível ou uma curva esconde uma parte. O jogador anda para ver.
2. **A saída nem sempre fica em frente.** No máximo 4 em cada 10 salas têm a saída na parede oposta à entrada. As outras: na lateral, no alto de
   uma escada, embaixo, atrás de uma coluna, numa curva.
3. **Quebrar a caixa.** Plantas em L, em cruz, em T, redondas, irregulares (caverna). Teto que varia (abóbada, desabado, baixo, altíssimo). Chão
   com degraus, rampa, buraco, água rasa.
4. **Apertar e soltar.** Antes de todo espaço grande, um corredor estreito e baixo. É o que dá o "uau" (é só geometria, não custa arte).
5. **Algo para ver ao longe.** Em toda sala, uma vista: uma janela de grade para outro lugar, uma luz lá no alto, uma escada que sobe. Às vezes um
   lugar aonde ainda não dá para ir (uma promessa).
6. **Um desvio por sala.** Um nicho, uma varanda, uma câmara lateral, uma parede caída. Sempre com alguma coisa: uma página, uma gema, uma vista,
   um objeto para examinar. Explorar tem de compensar sempre, para o jogador criar o hábito.
7. **O mapa tem voltas.** Atalhos que se abrem pelo outro lado e levam de volta a lugares conhecidos (estilo Metroidvania).
8. **O puzzle continua limpo.** O meio da sala e a linha dos olhos ficam para o puzzle; o detalhe vai para as bordas, o chão e o alto. **Bronze e
   fogo são só do puzzle**: o cenário é de pedra, rocha, madeira, pano, ferro e cerâmica. Nenhum objeto de cenário tem forma de glifo.

## 3. As zonas: a Casa evolui (sem choque de uma sala para a outra)

Cada zona divide um material com a vizinha, para a mudança ser gradual. As cores seguem o roteiro de `DIRECAO_DE_ARTE.md` §4.1.

| Zona | Lugares | Forma e material | Luz | Som de fundo | Vida (sem modelos 3D difíceis) |
|---|---|---|---|---|---|
| **As Fundações** | 1–4, R1 | pedra bruta, blocos grandes, água parada; a rocha aparece onde a parede caiu | fria e cinza; o poço de luz | gotas, eco | pó na luz do poço, musgo onde tem água |
| **As Oficinas** | 5–8, R2, Biblioteca | lugares de trabalho: refeitório, depósito de óleo, banhos, tecelagem, o Arquivo; madeira e pano aparecem | mais quente | madeira estalando, um sino muito longe | mariposas nas chamas (sprites), pano que balança |
| **O Jardim de Dentro** | 9–11, R3 | um **poço de luz enorme** (um "ponto" do dado) e, embaixo dele, um **jardim** com uma árvore; raízes invadem as salas em volta | luz pálida de cima, verde da folhagem | vento nas folhas, pássaros | pássaros e folhas caindo (sprites) |
| **As Profundezas** | 12–14, A Fenda | talhado na rocha, baixo, escuro; um riacho subterrâneo | quase nenhuma; a cal | água correndo longe, nada mais | morcegos que saem ao primeiro fogo (sprites) |
| **A Subida** | R4, 15–17, R5 | escadas, plataformas, o claustro aberto; cada sala mais alta que a anterior | cada vez mais clara | vento | pássaros no claustro |
| **O Tribunal** | 18 | o alto da Casa, em volta da boca do Grande Ponto; do balcão se vê o Jardim lá embaixo | luz do alto | silêncio | — |

**O Jardim (o "bosque do King's Field" do nosso jogo):** um buraco redondo enorme no teto, um dos pontos do dado, deixa entrar luz há séculos.
Uma semente caiu por ele e virou árvore. Na história, é mais uma coisa que **foi lançada** na Casa e ficou: como o jogador. O jogador vê o
Jardim **antes** de chegar (pelas janelas das salas 9, 10 e 11, cada uma de um ângulo) e só entra nele depois da sala 11: o corredor fechado da
sala 11 se abre de repente na luz. No fim do capítulo, do balcão do Tribunal, ele o vê de cima. É o centro do capítulo: o caminho dá a volta nele.

**Árvore e plantas sem modelagem difícil:** tronco e galhos em cilindros tortos; copa e mato em "cartões" de pixel art (planos com textura
recortada, que viram para a câmera). Bichos pequenos como **sprites 2D**. Com o pixel grande do jogo, isso não destoa (é como os jogos dos anos 90
faziam). Nenhum humano nem animal 3D é necessário; no lugar de esqueletos, **rastros**: colchão de palha, tigela, pano dobrado, marcas de giz.

## 4. O mapa do capítulo 1

O caminho começa no Poço (sudoeste), anda pelas Fundações e pelas Oficinas, **dá a volta no Jardim**, desce às Profundezas, sobe pela Escadaria e
termina no Tribunal, **em cima do Jardim**. Desenho gerado por `tools/verify_mapa.mjs` (cada célula ≈ 4 m; `··` = corredor). As coordenadas são
uma planta de referência: a sessão principal pode ajustá-las, desde que o verificador continue passando.

Legenda: `01`–`18` salas · `Nc` Corredor dos Nichos · `Cv` Túnel do Cavador · `Pt` Pátio da Cisterna · `Bh` Banhos Secos · `Bb` Biblioteca ·
`Jd` Jardim · `Gl` Galeria dos Condenados · `Fn` A Fenda · `Es` Escadaria · `Af` Antecâmara Fria.

```
Topo (andar 2); cada célula ≈ 4 m; norte para cima
  1818181818
  1818181818
  1818181818
  1818181818
  1818181818

Alto (andar 1); cada célula ≈ 4 m; norte para cima
        17
        17            161616161616
      171717          161616161616
  1717171717····AfAf··161616161616
      171717          161616161616
        17            161616161616··
        17            161616161616··
                                  ··
                                  ··    1515151515
                                  ······1515151515
                                        1515151515
                                        1515151515
                                        1515151515
                                              ··
                                              ··
                                            EsEsEs
                                            EsEsEs
                                            EsEsEs

Térreo (andar 0); cada célula ≈ 4 m; norte para cima
                        CvCv    PtPtPtPtPt
                        CvCv    PtPtPtPtPt
                        ··      PtPtPtPtPt  BbBbBbBbBbBb          090909
                        NcNcNcNcPtPtPtPtPt  BbBbBbBbBbBb    ······090909········
                        Nc      PtPtPtPtPt  BbBbBbBbBbBb    ··    090909      ··
              04040404  Nc          ··                      ··              101010
              04040404NcNc          ··      BbBbBbBbBbBbBbBb··  JdJdJdJdJd  101010
              04040404          05050505    BbBbBbBbBbBbBbBb··  JdJdJdJdJd  101010
                ··              05050505    BbBbBbBbBbBbBbBb    JdJdJdJdJd  101010
                0303            05050505    BbBbBbBbBbBbBbBb····JdJdJdJdJd  ····
                0303            05050505    BbBbBbBbBbBbBbBb··  JdJdJdJdJd  ··
  020202        0303              ··        BbBb            ··      ··      ··
  020202····03030303              06        BbBb            GlGl    ··    1111
  020202    03030303              06          ··            GlGl    ··    1111
    ··                            06          ······        GlGl  111111111111
    0101                          06              0808      GlGl  111111111111
    0101                          06    070707    0808      GlGl
                                  06    070707··08080808    GlGl
                                  060707070707··  0808
                                  060707070707··  0808
                                          ··  ··
                              BhBhBhBhBhBhBhBh··
                              BhBhBhBhBhBhBhBh··
                              BhBhBhBhBhBhBhBh

Fundo (as Profundezas) (andar -1); cada célula ≈ 4 m; norte para cima
  FnFn
    FnFn
    FnFn
    FnFn··12121212        14141414  EsEsEs
        ··12121212  1313  14141414··EsEsEs
          12121212··1313··14141414  EsEsEs
          12121212  1313  14141414

```

**Voltas (atalhos que se abrem pelo outro lado):** (1) um **cano antigo** dos Banhos Secos sobe até o Vestíbulo: perto do meio do capítulo, o jogador
reaparece no começo do jogo, e o mundo "fecha"; (2) uma **escada lateral** da Galeria dos Condenados desce até os Banhos; (3) uma **escada de serviço**
do pé da Escadaria volta à Galeria. Mais uma **grade** do Corredor dos Nichos para o balcão da sala 4 e a grade dos Banhos para o fundo da sala 6 (só
vista). Cada atalho abre **do lado de lá** (uma alavanca, uma tranca), como em todo Metroidvania.

## 5. A planta de cada lugar

"Entra / sai" usa os lados do mapa (N, S, L, O). **Não mexer** = o que o puzzle precisa e não pode mudar.

| Lugar | Forma | Entra → sai | O que a entrada esconde | Desvio | Vista | Não mexer |
|---|---|---|---|---|---|---|
| 1 O Poço | redonda, teto alto com o poço de luz | (acorda) → N | a porta, atrás de um bloco caído | — (o soquete frio do S8 no fundo do poço) | a luz lá em cima | a cena de acordar |
| 2 O Vestíbulo | retangular, com o nicho do caderno | S → **L (lateral)** | a porta lateral, atrás de uma coluna | o nicho do caderno | a boca do cano antigo (atalho que só abre depois) | o caderno |
| 3 A Lousa | **L**: o braço das lousas e, virando a esquina, o braço da saída | O → N | o braço da saída (e a lousa secreta do S1 no fim dele) | o fim do braço da saída (S1) | — (sala íntima) | lousas e o dado de pedra juntos, à vista |
| 4 O Fio de Fogo | balcão alto + chão 2 m abaixo com 9 braseiros | S (balcão) → **L, no chão** | a saída, embaixo do balcão | o S10 (FAZER) | do balcão, a grade inteira | a vista de cima |
| R1 Nichos | corredor estreito que vira 3 vezes | O → L | cada curva esconde a próxima | **a parede caída: o Túnel do Cavador** (§6) | a janela de grade (o Escrivão passa) | — |
| R1 Pátio | pátio a céu aberto, galerias em 2 andares, cisterna | O → **S, pela escada que desce** | as câmaras laterais e o 2º andar | câmaras laterais (página nº 2) | da galeria de cima, a luz redonda do átrio da Biblioteca, longe | o reflexo na cisterna |
| 5 A Casa Escreve | salão quadrado, 9 colunas (a única caixa de propósito) | N (num canto, descendo do pátio) → S | a porta, entre as colunas do fundo | — | **janela de grade para o átrio da Biblioteca** (vê-se antes de poder ir) | a grade das 9 colunas |
| 6 A Chama Curta | galeria comprida em declive (o depósito de óleo: ânforas, manchas) | N → **L, na lateral do fim** | — (reta: o puzzle precisa da vista longa) | a grade para os Banhos | a chama do fundo, longe | o comprimento e o pavio |
| 7 O Que a Casa Confirma | **duas câmaras**: a antessala da lousa e o salão dos pilares, em ângulo | O → S | o salão dos pilares, até a parte 1 ser resolvida | — | — | as duas partes |
| R2 Os Banhos Secos | salão **rebaixado**, piscinas em alturas diferentes | N (degraus largos descendo) → L | as câmaras de banho | câmaras; **o cano antigo** até o Vestíbulo | do fundo, a grade para a sala 6 | o puzzle do DOIS |
| 8 O Pano | **capela em cruz**, alta (a tecelagem: teares, carretéis) | O (pelo braço lateral) → N | a nave principal, até virar no cruzeiro | — | os panos lá no alto | panos, pilares e frisos (C2) |
| Biblioteca | átrio de 3 andares + alas, museu, sala de aula, escritório | S → L | as alas (§2d) | as alas, o museu, a sala de aula | o 2º e o 3º andar pelo vão do átrio | C-Bib (9 mesas) |
| 9 Os Apelidos | rotunda | O → L | a saída, atrás do GRANDE no centro | — | **a 1ª janela para o Jardim** (de cima) | o GRANDE no centro |
| 10 A Ponte de Madeira | fosso com rampa em espiral | N (no alto) → S (no fundo) | o fundo do fosso | — | **2ª janela para o Jardim**, a meia altura da rampa | as pontes e C3 |
| 11 O Boato Verdadeiro | **L** fechado, baixo (apertar) | N → **N, no fim do outro braço** | o outro braço | — | **3ª janela para o Jardim**, estreita | as frases em braços diferentes |
| R3 O Jardim | poço de luz enorme, árvore, mato, um canal de água | S (sai do aperto da 11: soltar) → O | o fundo do jardim, atrás da árvore | as raízes que entram nas salas vizinhas | o céu pálido lá em cima | — |
| R3 A Galeria | galeria longa e alta | N → **S, escada que desce** | a câmara lateral do puzzle opcional | a câmara (gema); a escada lateral para os Banhos | — | a câmara de R3 |
| 12 A Sombra | salão escuro, a tela de pedra no meio | (escada) → L | o fundo, atrás da tela | **a parede rachada: A Fenda** (§6) | — | a tela, a moldura, os 5 braseiros |
| 13 O Escuro | pequena e baixa | O → L | — | — | — (o teto é a vista, no escuro) | o teto de cal |
| 14 A Lei Pequena | térreo + rampa + mezanino | O (embaixo) → **L, no mezanino** | o mezanino | — | do mezanino, a sala de cima | não ler as frases de baixo do alto |
| R4 A Escadaria | poço vertical, escada em espiral | O (no pé) → N (no topo) | — | as janelas | janelas para 5, 10, 8 de cima, e **o Jardim de cima** | a janela da sala 5 (C1) |
| 15 O Fogo que Corre | plataformas em degraus | S (na mais baixa) → **O, na mais alta** | as plataformas de trás | — | — | as canaletas e alturas |
| 16 Os Que Dizem o Mesmo | claustro a céu aberto | L → O | as galerias de trás das colunas | — | o céu | as 9 posições (C6) |
| R5 A Antecâmara Fria | pequena e baixa (aperto depois do céu) | L → O | — | — | — | a moldura e o soquete |
| 17 A Memória da Casa | hub redondo + 3 anexos | L → **escada que sobe** | os anexos | — | — | os anexos A, B, C |
| 18 O Tribunal | galeria em volta da boca do Grande Ponto | (escada) → — | — | — | **o Jardim, lá embaixo** | o puzzle |

## 6. Rupturas para a rocha (ideia do Pedro): a Casa por trás da parede

Duas vezes no capítulo, a parede de tijolo **caiu** e mostra a **rocha** atrás. Lá dentro há rastros de alguém que tentou **fugir cavando**: **o
Cavador** (nome provisório), outro condenado, que escreve em português como "a que veio antes", mas com outra letra e outro jeito. As páginas dele
contam uma história curta que **reforça o cerne**: não se sai da Casa à força; ela continua do outro lado da rocha. **Só se sai lendo.**

**1. O Túnel do Cavador** (desvio do Corredor dos Nichos, R1). Num trecho do corredor, a parede de tijolo desabou: um monte de blocos no chão e,
atrás, rocha bruta e um túnel estreito e baixo, cavado à mão (marcas de ferramenta, escoras de madeira podre, uma colher de ferro gasta até ficar
chata, um pano dobrado como travesseiro). O túnel vira duas vezes e **termina em tijolo de novo**: a mesma parede talhada da Casa, com o mesmo
desenho. No chão, a página:
> *"Cavei catorze dias para o lado da luz. A pedra é mole, achei que ia sair no pátio de fora. A rocha acabou e começou tijolo de novo, talhado
> igual ao de dentro. A Casa também está do lado de fora."*

**2. A Galeria dos Condenados** (R3), entre as marcas de contagem, a 2ª página, com a mesma letra:
> *"As marcas na parede não são dias. São tentativas. Os outros também cavaram. Lá embaixo a pedra é viva e tem água. Água sempre acha saída."*

**3. A Fenda** (desvio da sala 12, nas Profundezas). Uma rachadura na parede da Sombra leva a uma caverna **natural**, a única do capítulo: rocha
irregular, um riacho que corre e some num buraco **perfeitamente redondo** no chão (mais um "ponto" do dado: o S9, sem comentário). Uma escora, uma
picareta quebrada, e a última página:
> *"Segui a água até onde ela cai. O buraco é redondo demais para ser da rocha. Alguém fez os buracos. Cavar é só mais uma sala. Vou voltar e ler."*

**Por que não sai da temática:** as rupturas não abrem caminho nenhum (o caminho principal não passa por elas); elas mostram que **a rocha também é
a Casa** e que o único jeito de sair é ler a sentença. E plantam o S9 (os buracos redondos). Variam o cenário (rocha, escoras, água) sem mudar
de mundo.

**Outras quebras pequenas pelo capítulo** (sem história própria, só para a Casa parecer velha): raízes do Jardim atravessando o teto das salas 9 a 11;
um canto desabado na Chama Curta com a rocha aparecendo e o óleo escorrendo por ela; o teto parcialmente caído no claustro (por isso há céu).

## 7. O que o motor precisa (para a sessão principal)

1. **Posição de cada sala no mundo**, não em fila: uma tabela de planta (posição em x/z, altura y, rotação de 0/90/180/270°) por sala, e portas em
   **qualquer parede** (lateral, alto de escada, embaixo). Os corredores entre portas podem virar (peças: reto, curva, escada, rampa).
2. **O mapa do diário a partir da planta real**: a forma (união de retângulos, redonda), o andar e as passagens de verdade, não a ordem da lista.
   Os andares do mapa: Fundo, Térreo, Alto, Topo (as abas já existem).
3. **Desenhar as vizinhas pelo grafo** de ligações, não pela posição na lista (os atalhos ligam salas distantes na lista).
4. **Formas novas no kit:** casca de sala em L/cruz/T (união de retângulos), sala redonda (já existe), **caverna** (paredes de rocha irregular:
   deslocar os vértices com ruído e textura de rocha), teto variável, degraus e desníveis, água rasa.
5. **Vegetação em cartões** (copa, mato, raízes) e **sprites** de bichos pequenos (mariposas, pássaros, morcegos), que reagem ao jogador.
6. **Atalhos que abrem pelo outro lado** (tranca/alavanca) e ficam salvos.
7. Rodar `node tools/verify_mapa.mjs` depois de mudar a planta.

## 8. Ordem de trabalho

1. **Planta + portas em qualquer parede + mapa real** (§7.1 a 7.3). Sozinho já acaba com a fila de quadrados.
2. **Reformar as salas que existem** pela tabela do §5 (o que esconde, onde fica a saída), sem mexer no "não mexer".
3. **O Túnel do Cavador** (R1): a primeira ruptura, perto do começo, para o jogador aprender cedo que vale explorar.
4. **O Jardim** e as três janelas para ele (9, 10, 11).
5. As zonas (material, luz e som de fundo por zona) e os desvios de cada sala.
6. A Fenda, os atalhos e o balcão do Tribunal sobre o Jardim.
