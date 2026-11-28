# Direção de arte — Masmorra do Dado

> Para a sessão principal (motor e arte). Objetivo: um visual com **identidade e intenção**, que não pareça gerado.
> A "cara de IA" quase nunca vem da técnica. Vem da **falta de decisões**: tudo feito do mesmo jeito, com a mesma intensidade, em todo lugar.
> Este documento troca isso por regras. Capturas de como o jogo está hoje: `docs/arte/antes-sala1.png`, `antes-sala6.png`, `antes-sala8.png`.

---

## 1. O diagnóstico (capturas de 10 salas, versão do site)

**O que já funciona e deve ficar:**
- A paleta fixa com o pontilhado e o contorno: o "pixel crocante" tem personalidade.
- **O dado** é a melhor peça do jogo: corpo escuro, filetes de ouro, cantoneiras, o rosto. Parece desenhado por alguém. **Ele é a régua de qualidade.**
- A luz quente das tochas contra a pedra fria.

**O que denuncia "gerado":**
1. **Uma textura para tudo.** Parede, teto e piso com o mesmo tijolo procedural, repetido sem variação.
2. **Salas-caixa.** Paredes retas, sem rodapé, cornija, arco, nicho, batente grosso, degrau. Nada diz que alguém construiu aquilo.
3. **Objetos da mão enormes e flutuando.** O dado e o giz ocupam quase metade da tela, sem mão nem braço, e com **muito mais detalhe** que a parede ao lado.
4. **Luz plana.** Quase nada projeta sombra; colunas e braseiros não "pousam" no chão; pouco contraste entre claro e escuro.
5. **Poeira uniforme.** Pontinhos brancos iguais flutuando na tela inteira, em todas as salas.
6. **Nada conta história.** Sem objetos de quem passou por ali, sem marcas de uso, sem fuligem, sem desgaste.
7. **Interface com fonte padrão** do navegador (o texto de controles), diferente da fonte do diário.

---

## 2. Os pilares (as decisões que guiam todo o resto)

1. **A Casa é velha, foi construída e foi usada.** Toda superfície mostra **quem fez** (pedra cortada, encaixe, arco) e **quem passou** (desgaste, fuligem, riscos).
2. **A luz conta para onde ir.** O olho vai primeiro para o que importa: a escrita, o braseiro, a porta. O resto pode ficar no escuro.
3. **Pouca coisa, bem escolhida.** Melhor três objetos com motivo do que trinta espalhados. Nada aparece "porque sim".
4. **O dado é a régua.** Nenhum objeto do mundo tem mais ou menos detalhe que o dado. Mesmo cuidado, mesma escala de pixel.
5. **Escrita é sagrada.** Os glifos são a coisa mais legível da tela, sempre: contraste, nitidez e luz neles em primeiro lugar.

---

## 3. Referências (para clima e regras, nunca para copiar)

| Jogo | O que olhar |
|---|---|
| **Lunacid** | 3D em pixel com paleta curta; salas com marco próprio; escuro de verdade |
| **Dusk** | texturas de baixa resolução com densidade constante; arquitetura simples mas "construída" |
| **Signalis** | luz e cor com intenção (uma cor forte por ambiente); interface integrada ao mundo |
| **The Witness** | composição: cada lugar tem um ponto de interesse claro e linhas que levam o olho |
| **Return of the Obra Dinn** | o quanto uma paleta mínima aguenta quando a forma e a luz são bem decididas |

**Tarefa 1:** montar um painel com 10 a 15 capturas desses jogos (só para uso interno) e escrever embaixo de cada uma **uma frase** do que se quer tirar dela.

---

## 4. Regras por elemento

### 4.1 Cor (roteiro por capítulo)
- **Uma cor forte por ambiente, o resto neutro.** No capítulo 1 (Fogo), a cor forte é o **laranja da chama e da escrita acesa**; a pedra fica entre cinza frio e marrom dessaturado.
- **Quente = vida e escrita; frio = vazio e passado.** Salas resolvidas ficam um pouco mais quentes (já existe o "estágio" da Casa).
- **Roteiro de cor do capítulo 1:** o Poço e o Vestíbulo frios e cinzentos; as salas das lousas em pedra mais quente; os respiros com uma segunda cor de apoio (o verde da água no pátio da cisterna, o azul-escuro do céu no claustro); a Biblioteca com o ocre do papel.
- **A LUT pode mudar por capítulo**, mas não por sala. Dentro do capítulo, varia a luz, não a paleta.

### 4.2 Luz e sombra
- **Toda chama acende o seu pedaço da sala e faz sombra** (`DESIGN.md` §64 e §66): as chamas mais perto do jogador ganham luz com sombra de verdade; a luz principal da sala (a fresta da lua, a chama do nicho) também. A oclusão de ambiente escurece cantos, o pé dos objetos e o vão embaixo de mesas e camas.
- **Sombra de contato em tudo que toca o chão**: braseiros, colunas, pedras, o dado pousado. Pode ser um disco escuro pontilhado embaixo do objeto. Sem isso, as coisas flutuam.
- **Escuro de verdade.** Entre as poças de luz, o fundo cai quase no preto da paleta. A névoa serve para **profundidade**, não para clarear tudo.
- **Poça de luz no chão** embaixo de cada tocha e braseiro (decalque aditivo suave), mais forte perto e sumindo rápido.
- **A escrita recebe luz.** Toda frase de puzzle tem uma fonte de luz que a ilumina de leve, mesmo quando a sala é escura.

### 4.3 Texturas e escala de pixel
- **Densidade constante:** um mesmo número de pixels de textura por metro em tudo (sugestão: **32 px por metro**). Parede, braseiro, porta, dado e mão, todos na mesma régua. Medir e corrigir o que destoa.
- **Pelo menos 3 materiais de pedra por sala**: o bloco da parede, a pedra lisa do chão e a pedra trabalhada (batentes, colunas, molduras da escrita). Nunca o mesmo tijolo em parede, teto e chão.
- **Teto próprio:** abóbada, vigas ou pedra grossa irregular, mais escuro que a parede.
- **Variação por bloco:** cada bloco com leve variação de tom e de borda (gasta, lascada). A repetição a cada metro é o que mais denuncia o procedural.

### 4.4 Decalques à mão (a camada que tira a cara de gerado)
Por cima do procedural, **colocados à mão, sala por sala**, com motivo:
- **fuligem** acima de cada tocha e braseiro (mancha escura para cima);
- **umidade e limo** nos cantos de baixo e onde haveria água;
- **rachaduras** perto de portas e de pontos de peso;
- **desgaste** no chão, no caminho entre a entrada e a porta (pedra mais lisa e clara);
- **riscos de giz** dos condenados: contagens, desenhos tortos, um nome riscado (nunca parecido com glifo);
- **entulho pequeno** nos cantos, não no caminho.
Regra: **cada decalque tem um porquê.** Se não dá para dizer por que está ali, sai.

### 4.5 Arquitetura (um kit de peças)
Montar as salas com um kit modular, para todas parecerem **construídas**:
- rodapé e cornija em toda parede;
- **batentes grossos** nas portas (a parede tem espessura) e um degrau de soleira;
- **colunas com base e capitel**, nunca um paralelepípedo;
- **arcos** nas passagens e nos nichos;
- **nichos** nas paredes (vazios ou com um objeto);
- **abóbada ou vigas** no teto;
- **desníveis**: degraus, plataformas, rampas.
E quebrar a caixa: alcovas, salas em L, rotunda, fosso, claustro (as formas já combinadas em `PUZZLES_PROPOSTAS.md` §2).

### 4.6 Marco e composição
- **Cada sala tem um marco**: uma coisa única que a identifica de longe e na lembrança (a tela de pedra furada da sala 12, a cisterna, a viga do claustro, as nove colunas da sala 5).
- **Ao entrar, o olho vai primeiro para o puzzle.** Linhas da arquitetura e a luz levam à escrita ou ao elemento principal.
- **Fugir da simetria perfeita.** Uma coluna rachada, um nicho vazio de um lado só, uma tocha apagada. Simetria total é outro sinal de gerado.

### 4.7 Objetos que contam história
Poucos, com motivo, ligados à história dos condenados:
- uma tigela e um toco de vela num canto;
- um cobertor dobrado num nicho;
- correntes presas na parede;
- um caderno fechado (dos que não se pegam);
- um par de sapatos gastos;
- uma pilha de dados de pedra quebrados.
Nada de esqueletos nem sangue (o tom é melancólico, não de terror).
**Nada de RPG**: o jogo não tem inventário nem combate. Sem armas, escudos, poções, equipamento, moedas, tesouro, chaves soltas, boneco de treino
ou ferramentas de ofício. Só objetos do dia a dia de quem esperou na Casa (ver `DESIGN.md` §63).

### 4.8 Partículas
- **Só com motivo:**
  - **brasas** subindo das chamas;
  - **poeira só dentro de feixes de luz** (o poço, frestas);
  - **pó de giz** onde há escrita de condenados;
  - **gotas** onde há umidade.
- **Tirar a poeira uniforme** da tela inteira.
- **Como ficou** (`DESIGN.md` §98): a poeira é **fina** (um pixel da imagem do jogo por grão, muitos, cada um cintilando no seu tempo; não
  bolinhas de 2 × 2) e o feixe de luz **se vê no ar**, fraco, desfeito em degraus pelo pontilhado. Entraram também, sempre com motivo: a
  **fumaça** de toda tocha, a **poeira da pancada** do dado, as **brasas** do arremesso de Fogo e as **fagulhas** de quando o fogo pega, o
  **pó que cai do teto** quando uma sala se resolve, e a **névoa** só nos lugares abertos, sempre acima da cabeça.
- **Regra dos feixes e da vida**: nenhuma luz cai em cima de UMA coisa de puzzle (viraria pista falsa); nenhum feixe passa na frente do que se
  lê; os bichos (rato, morcego) ficam sempre longe, sem som, e aparecem de vez em quando, nunca em laço.

### 4.9 Objetos da mão (viewmodel)
- **Diminuir ~40%** e **descer** na tela: o dado no canto de baixo à direita, ocupando no máximo ~15% da altura.
- **Uma mão em pixel** segurando, com manga de tecido, no mesmo estilo e densidade do resto. Um leve balanço ao andar e um "peso" ao parar.
- O **giz não aparece no capítulo 1** (o jogador ainda não o tem). Quando aparecer, na mão esquerda, menor ainda.
- O dado continua sendo o protagonista: a mão é simples, escura, para ele brilhar.

### 4.10 Personagens e cenas
- O **Escrivão** segue a folha de referência já aprovada. Regra geral: **silhueta legível primeiro**, detalhe depois.
- Nas cenas, **enquadrar como um pintor**: um ponto de luz, o resto em penumbra.

### 4.11 Interface e tipografia
- **Uma fonte só**, a fonte em pixel do diário, em **todo** texto: controles, legendas, avisos, créditos. Nenhuma fonte padrão do navegador.
- **Ícones desenhados à mão** no mesmo estilo (nota musical, reiniciar, informação, tela cheia), com moldura de pedra ou couro, nunca o quadradinho padrão.
- **Dica de controles** só no começo, curta e em duas linhas no máximo, sumindo sozinha (já existe; trocar a fonte e diminuir).

### 4.12 Movimento e câmera
- Balanço da cabeça discreto; um **pequeno pó** no pé ao pousar de um degrau.
- **Portas com peso**: pedra que arrasta, um tranco no fim, poeira caindo.
- O **dado vivo** (já existe) é a referência de animação: tudo que se mexe deve ter essa intenção.

---

## 5. Lista do que evitar (a "cara de IA")
- [ ] a mesma textura em parede, teto e chão
- [ ] repetição visível da textura a cada metro
- [ ] sala-caixa sem rodapé, arco, batente ou desnível
- [ ] simetria perfeita
- [ ] objeto flutuando (sem sombra de contato)
- [ ] tudo igualmente iluminado; nenhum preto de verdade
- [ ] tudo brilhando (bloom em excesso)
- [ ] partículas uniformes sem motivo
- [ ] objetos com detalhe diferente do resto (mais nítidos ou mais borrados)
- [ ] decoração espalhada sem razão
- [ ] fonte ou ícone padrão do navegador

Toda sala nova passa por esta lista antes de entrar no jogo.

---

## 6. O quadro de estilo: uma sala acabada primeiro

Em vez de melhorar tudo um pouco, **levar UMA sala ao acabamento final** e tirar dela as regras para as outras.

**Sala escolhida: a 3 (A Lousa).** É pequena, tem escrita, lousas, braseiros e o dado de pedra: cobre quase todo o vocabulário visual do capítulo.

**Passos:**
1. **Referência:** o painel da Tarefa 1 e uma frase do clima da sala ("um corredor baixo onde alguém ensinava a contar").
2. **Arquitetura:** abóbada baixa, rodapé, batentes grossos, as duas colunas com base e capitel, um nicho.
3. **Materiais:** três pedras diferentes (parede, chão, pedra trabalhada das lousas), na régua de 32 px por metro.
4. **Luz:** o braseiro do nicho alto como luz com sombra (é ele que joga a sombra do jogador para a frente: a pista do puzzle); os outros três sem sombra; poças de luz no chão; o resto no escuro.
5. **Decalques:** fuligem acima dos quatro braseiros, desgaste do caminho até a porta, riscos de giz de um condenado contando dias perto da lousa 1.
6. **Objetos:** uma tigela e um toco de vela no nicho; o dado de pedra meio enterrado, com sombra de contato.
7. **Partículas:** brasas nos braseiros e poeira só no feixe do braseiro alto.
8. **Mão e dado** no tamanho novo; interface na fonte do diário.

**Como saber que ficou bom (critérios de aceitação):**
- capturas lado a lado com as referências, sem que a sala destoe delas;
- a lista da §5 inteira sem nenhum item marcado;
- alguém que não conhece o jogo consegue dizer, em 5 segundos, **para onde ir** e **o que é importante** na sala;
- mostrar a duas ou três pessoas de fora e perguntar só: "isto parece feito por uma pessoa?".

Depois que a sala 3 passar, as regras que saírem dela entram aqui (atualizando este documento) e valem para as outras salas.

---

## 7. Ordem de trabalho sugerida
1. Painel de referências (Tarefa 1).
2. **Viewmodel** (mão, tamanho) e **interface** (fonte, ícones): é o que aparece em toda tela e muda a impressão na hora.
3. **Tirar a poeira uniforme** e pôr **sombra de contato** em tudo: barato e com efeito imediato.
4. **Quadro de estilo da sala 3** (§6).
5. Kit de arquitetura e de materiais a partir dela.
6. Passar as salas 1 a 11 pelo kit, uma por uma, com a lista da §5.
7. Salas novas já nascem no padrão.

---

## 8. Notas técnicas (para o motor atual: Three.js, LUT, contorno, pontilhado)
- **Sombra:** (atualizado, `DESIGN.md` §64 e §66) toda tocha e braseiro pode ter sombra; as mais perto ganham luz com sombra de verdade, quantas e com que nitidez a opção **Sombras** decide (Altas: 4 chamas, mapa 512, borda suave; Médias: 2; Baixas: 1, borda dura; Desligadas). A luz principal de algumas salas (a fresta da lua, a chama do nicho) também faz sombra. Mais a **oclusão de ambiente** no pós-processo.
- **Sombra de contato:** um plano com textura de disco pontilhado embaixo de cada objeto (barato, sem custo de luz).
- **Decalques:** planos finos encostados na superfície com `polygonOffset`, ou uma segunda camada de textura por parede (`decals` por sala, posições à mão no módulo da sala).
- **Densidade de texel:** calcular o `repeat` das texturas pelo tamanho real da superfície (`metros × 32 px`), em vez de um repeat fixo.
- **Variação por bloco:** no gerador procedural, sortear tom e desgaste **por bloco** com uma semente por sala; nunca a mesma semente em todas.
- **Kit de arquitetura:** funções no `Kit` (`kit.rodape`, `kit.arco`, `kit.batente`, `kit.coluna({base, capitel})`, `kit.nicho`, `kit.abobada`), usadas por todas as salas e pelo construtor `fire.ts`.
- **LUT por capítulo**, a luz e a névoa por sala.
- **Desempenho:** tudo isso cabe no celular se a sombra for de uma luz só, os decalques forem poucos e as partículas, locais.

---

## 9. Da borda ao centro do dado: o caminho visual dos capítulos
**Decidido pelo Pedro:** a Casa fica DENTRO do dado. No capítulo 1 o jogador está na **borda**, perto da superfície: por isso há
catacumbas construídas e **buracos que dão para fora** (os furos das faces, os pontos do dado: o Poço do começo é um deles). A cada
capítulo ele desce **rumo ao centro**, e o lugar fica **mais cru, com cara de caverna**, menos catacumba. (A história e os nomes ficam com o
`narrador`; aqui é só o que se VÊ.)

A regra que atravessa todos: **quanto mais fundo, menos mão humana e menos luz de fora.** A borda foi construída e usada; o centro nunca foi.

| Capítulo (face) | Onde, no dado | Arquitetura | Materiais e cor | Luz | Objetos e sinais de gente |
|---|---|---|---|---|---|
| **1 · Fogo** (hoje) | a borda, logo abaixo da face | catacumba construída: cantaria, abóbadas de aresta, arcos, colunas, nichos, portas com batente | pedra cinza fria e marrom dessaturado; o laranja da chama e da escrita | tochas e braseiros; **luz de fora** caindo pelos furos (o Poço, frestas, o pátio da cisterna, o claustro) | muitos: bancos, mesas, camas, marcas de giz, os que esperaram |
| **2 · Peso** | ainda perto da borda | construída, mais pesada e mais baixa: pilares grossos, vigas de pedra, rampas e plataformas (o peso desce) | pedra mais escura e úmida; segunda cor: o cinza-azulado do ferro e das correntes | ainda há furos, mais estreitos e raros; mais tochas | menos móveis; ferragens, contrapesos, correntes |
| **3 · Eco** | meio caminho | a construção começa a ceder: paredes **meio talhadas na rocha**, galerias longas e altas (para o eco), escadas escavadas | metade cantaria, metade rocha bruta; o azul-escuro do vazio | quase nenhuma luz de fora: os furos viram poços compridos e estreitos, com um céu pequeno lá em cima | poucos; o que ficou está quebrado ou caído |
| **4 · Troca** | abaixo do meio | **cavernas** com trechos construídos isolados (um arco, um piso de lajes no meio da rocha) | rocha bruta, veios minerais; uma cor estranha de apoio (o verde-cobre das trocas) | só fogo que o jogador acende e brilhos minerais | quase nada: só o que alguém trouxe de muito longe |
| **5 · Deslizar** | perto do centro | caverna lisa, gasta por algo que escorrega: rampas naturais, poços, lâminas de pedra polida | pedra polida e escura, quase espelho; reflexos frios | muito escura; a luz desliza junto (poças, reflexos) | nenhum móvel; só marcas de giz e as folhas dela |
| **6 · Atravessar** | a casca do centro | fendas, paredes finas que se atravessam, formas que não foram feitas por mão nenhuma | rocha quase sem textura, poucas cores; o branco da escrita volta a mandar | quase nenhuma; a escrita é a luz | nenhum |
| **7 · O veredito** | o centro | a sala do Juiz: **parede lisa, sem ajuda**, nada construído e nada escavado; de lá o jogador sobe pela **mesma luz do poço** do começo | liso, sem paleta de pedra | uma luz só, a do poço | nenhum |

Como aplicar (para todo capítulo novo):
- **A LUT muda por capítulo** (§4.1): a paleta fica mais curta e mais escura conforme se desce; o laranja do fogo continua o mesmo em todas (é a
  chama que o jogador carrega).
- **O kit de arquitetura vai trocando de peças**: cantaria e abóbada (cap. 1 e 2) → cantaria que se mistura com rocha (3) → rocha com trechos
  construídos (4) → rocha polida e fendas (5 e 6) → liso (7). Para isso, `arch.ts` ganha, quando o capítulo 3 chegar, um gerador de **rocha bruta**
  (paredes irregulares, teto de caverna, chão com desnível) no mesmo pixel e com o mesmo relevo das peças de hoje.
- **A luz de fora some aos poucos**: no capítulo 1 os furos são a luz principal de várias salas; do 2 ao 4 eles ficam mais raros, mais
  estreitos e mais compridos (um céu cada vez menor lá em cima); do 5 em diante (o centro), não há furo nenhum.
- **Os 21 furos (decidido pelo Pedro, `HISTORIA.md` e `DESIGN.md` §69):** em todo o jogo há **exatamente 21 furos REDONDOS de luz nos tetos**, os
  pontos do dado (1+2+3+4+5+6), e o **Poço** do começo é o do UM. Só os redondos contam: frestas, pátios, janelas e o claustro não. Todos com a mesma
  cara (um buraco redondo no teto, com luz lá em cima), para o jogador saber o que contar. Divisão (decidida com o Pedro, `DESIGN.md` §73):
  capítulo 1 = faces 1, 2 e 3 (6 furos); capítulo 2 = face 4; capítulo 3 = face 5; capítulo 4 = face 6; do 5 em diante, nenhum.
  Quem mexer numa sala com furo redondo atualiza a contagem.
  **Como ficam** (`DESIGN.md` §73): um furo por sala, solto no teto, e as faces só aparecem no MAPA, juntando as salas de cada grupo (no teto
  de uma sala só, o desenho entregava fácil demais o dado). Todos com o mesmo aro de pedra lavrada (`src/scene/skyhole.ts`); nenhum ilumina o
  que é de puzzle. O capítulo 1 está feito (`DESIGN.md` §73, passo 4): o Poço; a Lousa e o Fio; a Cisterna, a Biblioteca e os Banhos.
- **Os objetos rareiam** (§4.7 continua valendo: só o dia a dia, nada de RPG): a borda foi habitada; o centro, nunca.
- **Packs de modelos para os capítulos fundos: adiado** (decisão do Pedro: primeiro fechar o capítulo 1). Já foram vistos, todos CC0, no
  OpenGameArt, e nenhum agradou: Masmorra modular 2 (Fertile Soil, sem textura), Ruínas e Caverna Pro (3TD), Minas e caverna (loafbrr),
  estalactites sem textura (agdg), a mina do rubberduck (com baú e moedas), os kits da Kenney e a masmorra da Quaternius (cor chapada, estilo
  desenho animado) e um esgoto de concreto. Ficaram sem olhar, porque a rede da sessão não abria os sites: as rochas escaneadas do Poly Haven
  (CC0) e os packs estilo PS1 do itch.io (a maioria pede crédito).
- O que é **gramática de puzzle** (frases, braseiros, lousas, soquetes, tochas das constelações) mantém a mesma cara em todos os capítulos, para o
  jogador nunca ter de reaprender a ler.
