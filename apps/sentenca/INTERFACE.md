# Interface de lançamento — Sentença

> Para a sessão principal. Decisão do Pedro: a interface tem de ser **de jogo lançado** (PC/Steam, celular, controle), não de protótipo.
> Os botões do canto de hoje (♫ ♪ ∅, ⓘ com "Recomeçar o jogo do zero", ⤓ instalar, tela cheia) e os emojis **saem**. Complementa o
> `DIRECAO_DE_ARTE.md` (que diz *como* desenhar); aqui está *o quê* existe e *onde*.

---

## 1. Princípios
1. **Durante o jogo, quase nada na tela.** Sem botões fixos no PC. Só o que o momento pede: o aviso de ação, a mira, as falas.
2. **Tudo o que é configuração mora num menu** (pausa e tela inicial), nunca num botão solto.
3. **Pedra é o mundo; papel é o humano** (mesma regra da história): caixas e menus do mundo em pedra; o que é do jogador (diário, pensamentos) em papel.
4. **Ícones na gramática dos glifos** (traços de ouro e pontinhos numa plaquinha de pedra), **mas nunca palavras do léxico**: ícone com legenda em
   português ao lado de um glifo real seria traduzir a língua, e o jogo nunca explica. (Única exceção: o fogo, ACENDER, ensinado no 1º minuto.)
5. **Cada plataforma mostra os seus botões:** teclado (teclas de pedra com a letra), controle (os botões do controle que está ligado), toque.

---

## 2. Salvamento (sem "recomeçar" no menu)
- **Três espaços de jogo** (slots), cada um com: miniatura do último lugar, capítulo, tempo de jogo, gemas.
- **Salvamento automático** ao entrar em cada sala, ao resolver um puzzle e ao fechar o diário. Um **dadinho girando** no canto por ~1 s indica
  que salvou (o único elemento que aparece sozinho). Não há "salvar" manual.
- **Continuar** volta ao último ponto salvo do último espaço usado.
- **Novo jogo** pede um espaço; se estiver ocupado, confirmação ("Apagar este jogo e começar outro?").
- **Apagar um jogo** só na tela de espaços (com confirmação dupla). Não existe "recomeçar" dentro do jogo.
- O que vai no save: progresso e marcos, a sala e a posição, o diário (anotações, carimbos, mapa à mão), o estado dos segredos, gemas e páginas,
  as perguntas do dado pendentes. **Fora do save** (vale para o aparelho): configurações.
- **Steam Cloud** e, no celular, o armazenamento do app. Na web, o `localStorage` como hoje, mas por espaço (chaves `mdd-slot1-*`).
- O botão de instalar (⤓) some da interface: na web, o navegador oferece; nas lojas, já está instalado.

---

## 3. As telas

### 3.1 Tela inicial: o dado caído (ideia do Pedro)
**A cena:** a **sala 1, o Poço**, no instante em que o dado caiu (antes de o jogador pegá-lo). O dado está **caído de lado no entulho**, bem perto
da câmera, um pouco à direita do centro; o rosto virado para a câmera. Atrás, a sala **desfocada** (profundidade de campo), com a **luz do poço**
descendo em feixe e poeira **só dentro do feixe**. Movimento lento e constante: a luz respira, partículas sobem, a câmera "respira" 1 a 2 cm.
**À esquerda:** o título **«SENTENÇA»** grande, em cima (a versão em pixel do logo, §7), e embaixo as opções em plaquinhas de pedra:
**Continuar** (só se houver jogo salvo) · **Novo jogo** · **Carregar** · **Configurações** · **Créditos** · **Sair** (não aparece na web).
**O dado está vivo** (tudo já existe em `dielife.ts`, só muda o alvo do olhar):
- **no PC, o olho segue o mouse**;
- **com teclado ou controle, olha para a opção marcada**;
- **no celular, olha para onde o dedo tocou** e, parado, vagueia o olhar;
- pisca; **cochila** se ninguém mexer por ~30 s e **acorda assustado** quando o mouse ou o dedo se mexe;
- **fica abatido** com o cursor em "Sair"; dá um **pulinho** com o cursor em "Novo jogo".
**As transições (sem tela de carregamento):**
- **Novo jogo:** o dado pisca devagar, a câmera **sobe pelo feixe de luz** até o branco, e o branco vira o preto da cena de acordar.
- **Continuar / Carregar:** o dado dá um pulinho para fora do quadro e a imagem se desfaz em pontilhado para o lugar salvo.
**Depois do capítulo 1:** o fundo passa a ser **o último lugar onde o jogador parou** (a sala do último save), com o dado caído ali: um retrato
do progresso. O dado só fica no Poço até o jogador terminar o 1º capítulo.
**Créditos:** a câmera gira devagar em volta do dado enquanto os nomes sobem.

### 3.2 Pausa (Esc / Start / botão de pausa no celular)
O jogo escurece e fica parado; uma tábua de pedra no centro: **Continuar** · **Diário** · **Configurações** · **Voltar à tela inicial** (salva
antes, com confirmação) · **Sair do jogo** (PC). Nada de recomeçar.

### 3.3 Configurações (abas)
| Aba | Opções |
|---|---|
| **Áudio** | volume geral, música, efeitos (substitui o botão ♫/♪/∅) |
| **Imagem** | modo de tela (janela / tela cheia; substitui o botão de tela cheia), qualidade (baixa/média/alta), tamanho do pixel, brilho, campo de visão, limitar quadros |
| **Controles** | sensibilidade da mira (mouse, controle e toque separados), inverter eixo Y, vibração, **remapear teclas e botões**, tamanho e posição dos botões de toque |
| **Acessibilidade** | tamanho do texto e da interface (hoje `--ui`), velocidade do texto, reduzir tremores e clarões, reduzir movimento da câmera, alto contraste nos glifos, mira sempre visível |
| **Idioma** | português, inglês (só diário, pensamentos e interface; os glifos não mudam) |
- **Créditos** (os sons CC0 e o soundfont CC BY exigem crédito; hoje estão no ⓘ): na tela inicial e no fim do jogo.

### 3.4 Espaços de jogo
Três tábuas lado a lado, cada uma com miniatura, capítulo, tempo, gemas, data. Ações: **Carregar** · **Apagar** (com confirmação dupla).

---

## 4. Durante o jogo (HUD)

**No PC e no controle, na tela só aparece:**
- a **mira** (um ponto discreto, que vira um pequeno anel quando há algo a fazer);
- o **aviso de ação** quando há algo à frente: a **tecla** (ou o botão do controle) + o **ícone da ação** + o texto curto ("Pegar o caderno").
  Fica embaixo, perto do centro;
- o **dado na mão** (já é o indicador da face escolhida; não precisa de outro);
- as **falas** (caixa de pedra, balão do dado, pensamentos em papel) e os **avisos** (glifo avistado, gema achada, salvando).

**No celular (horizontal), além disso:** o joystick à esquerda; à direita os botões de ação que **só aparecem quando servem** (já é assim:
agir, arremessar, posicionar, girar a face); e **um único botão fixo**: pausa (o diário se abre pela pausa ou por um botão que só aparece depois
de pegar o caderno).

---

## 5. Caixas de texto
| Quem fala | Caixa | Detalhe |
|---|---|---|
| o mundo (Escrivão, inscrições lidas, NPCs) | **tábua de pedra** com borda talhada e cantos lascados (moldura em 9 pedaços, estica sem deformar) | placa do nome em pedra; a do Escrivão com a borda dourada do manto dele |
| o **dado** | **balão com a cara do dado**: fundo escuro, filete de ouro, as cantoneiras | já sai do dado; mantém |
| o **jogador** (pensamentos) | **tira de papel** com a letra do diário | tinta do jogador |
| **pergunta do dado** (§2e das propostas) | o dado grande no centro e **5 plaquinhas de pedra**; "não sei" numa plaquinha lisa, sem talho | uma linha cada |
| avisos (avistado, gema, salvando) | plaquinha pequena de pedra no canto de cima | some sozinha; um de cada vez (regra da §30) |
Texto do mundo sempre em glifos; texto da interface sempre na **fonte em pixel do diário** (nada de fonte do navegador).

---

## 6. Ícones: a lista de lançamento

### Ficam / entram (definitivos)
| Grupo | Ícones |
|---|---|
| **Ações (aviso de ação e botões de toque)** | agir (genérico) · pegar · abrir · ler/olhar uma inscrição · arremessar · posicionar · girar a face · desenhar · apagar · olhar (modo do celular) · trocar dado ↔ giz (só depois do capítulo 2) |
| **Menus** | pausa · diário · mapa (aba do diário) · configurações (engrenagem feita de pontos) · voltar · fechar · confirmar · cancelar |
| **Configurações** | áudio · imagem · controles · acessibilidade · idioma |
| **Estado** | salvando (dadinho girando) · gema · página arrancada · glifo avistado |
| **Teclas e botões** | tecla de pedra em branco (a letra vem por cima, na fonte do jogo) · os botões do controle conectado (A/B/X/Y e os de PlayStation, no estilo do jogo, não as imagens oficiais) · toque (dedo) |
| **Marca** | logo «SENTENÇA» (§7) · ícone do app (§7) |

### Saem (temporários de hoje)
♫ ♪ ∅ (som) → aba Áudio · ⓘ (créditos e recomeçar) → Créditos na tela inicial; recomeçar deixa de existir · ⤓ (instalar) → some ·
tela cheia → aba Imagem · todos os emojis.

### Para depois (quando a mecânica existir)
faces do dado novas (Peso, Eco, Troca, Deslizar, Atravessar: o glifo do efeito, que o jogo já desenha nas faces) · carimbo do mapa · conquistas (Steam).

### Formas proibidas em ícones (vêm do léxico)
**Regra:** os glifos são **retos e geométricos** (pontos e retas numa grade 3×3). Os ícones são **figurativos e curvos** (mão, olho, porta,
giz, engrenagem). Nenhum ícone pode ser feito só de retas ligando pontos de uma grade 3×3, porque aí ele **vira uma palavra** e ensina errado.
Formas que já são palavras (conferido em `src/story/lexicon.json`):
| Forma | Palavra |
|---|---|
| **X** (duas diagonais) | EM VEZ DE |
| **+** (cruz reta) | JULGAR |
| **seta reta →** | ENTÃO / SEGUIR |
| **seta reta ←** | VOLTAR |
| **seta reta ↑** | IR |
| **seta reta ↓** | VIR |
| **=** (duas horizontais) | IGUAL |
| **duas barras verticais** (nas pontas) | ABRIR (na do meio e na da direita: FECHAR; esquerda e meio: CONTAR) |
| **losango** (com ou sem ponto no meio) | VER |
| **uma diagonal solta** | ESCREVER |
| **V simétrico** (dos cantos de cima ao meio de baixo) | PEGAR |
| **triângulo** com ponto nos cantos | ACENDER (**permitido**: é o ícone do fogo e o logo) |
| **Z** | DE NOVO |
| **T** (horizontal no meio e vertical descendo) | COLOCAR |
| **linha horizontal com um ponto** no meio / em cima / embaixo; **com dois pontos em cima** | as marcas CONFIRMADO / BOATO / MEMÓRIA / PERGUNTA |
| **pontos soltos em grade** (1 no meio, a diagonal, os 4 cantos, 5, 9, a cruz de pontos, a fileira do meio) | os números e TODOS, MAIS, MENOS |
**Setas** só **curvas** (arco com ponta). **Fechar** não é X: é uma tampa de pedra descendo ou um arco que se fecha. **Voltar** é um arco curvo para a esquerda.

### Revisão da 1ª folha de ícones (enviada pelo Pedro)
O estilo está certo (pedra escura, moldura de ouro, traço fino). Por ícone:
| Ícone da folha | Veredito | O que fazer |
|---|---|---|
| mão com ponto (pegar) | ✓ | manter |
| duas barras (abrir) | ✗ é ABRIR | porta em arco entreaberta |
| losango com olho (olhar/ler) | ✗ é VER | olho em amêndoa, pálpebra curva, sem cantos retos |
| arco com seta (arremessar) | ✓ | manter (seta curva) |
| ponto sobre linha com traço (posicionar) | ✗ parece "!" e a marca BOATO/COLOCAR | dado pequeno descendo numa curva até um chão ondulado |
| setas em volta de um ponto (girar a face) | ✓ | manter |
| quadrados trocando (trocar dado/giz) | ✓ | manter (só depois do capítulo 2) |
| diagonal com ponto (desenhar) | ✗ é ESCREVER | toco de giz inclinado deixando uma linha ondulada |
| X (apagar) | ✗ é EM VEZ DE | mancha borrada com o toco de giz deitado |
| livro (diário) | ~ | redesenhar só em traço (sem preenchimento) |
| mapa (mapa) | ~ | só em traço |
| alto-falantes, mudo, recomeçar, informação, tela cheia, instalar | sai | não existem mais (Configurações / sem recomeçar / sem instalar) |
| X (fechar) | ✗ é EM VEZ DE | tampa de pedra descendo |
| ✓ (confirmar) | ~ parece PEGAR | bem assimétrico, braço esquerdo curto e curvo |
| gema | ✓ | manter pintada (objeto coletável) |
| página rasgada | ✓ | manter pintada (objeto coletável) |
| tecla de pedra | ~ | só em traço; a letra por cima, na fonte do jogo |
| triângulo do fogo | ✓ | **certo** (pontos nos vértices) |
**Faltam:** pausa · configurações (engrenagem de pontos e arcos) · voltar (arco curvo) · salvando (dadinho girando) · as abas de
configuração (áudio, imagem, controles, acessibilidade, idioma) · os botões do controle no estilo do jogo.
**Regras de estilo que a folha mostrou:** **traço para ações e menus; pintado só para o que se coleta** (gema, página). Fundos **sem os
pontinhos laranja aleatórios** (ruído). A mesma grossura de traço em todos.

**Tamanho:** desenhar em **16×16** (HUD) e **24×24** (menus), pixel a pixel, mesma grossura de traço em todos; o ouro e o laranja da brasa
são as únicas cores além da pedra.

---

## 7. O logo e o ícone do app
- **Nome:** «Sentença» (decidido pelo Pedro), sem artigo. Em inglês, *Sentence* (mesmo duplo sentido: frase e pena). Antes de fechar: conferir na
  Steam e nas lojas de celular se o nome está livre.
- **O triângulo no lugar do último A tem de ser o glifo ACENDER de verdade:** um ponto no meio de cima e um em cada canto de baixo, **nos
  vértices**, ligados por três linhas; o ponto de cima pode ser a brasa. Nada de pontos dentro do triângulo, nada de ponto solto, linha simples.
- **O traço do triângulo** com a grossura das hastes das letras (ele faz o papel de um A).
- **O Ç desenhado à mão** (os geradores erram a cedilha).
- **Versões:** vetor limpo (loja, cartaz, redes: base = a versão clara enviada pelo Pedro) e pixel em pedra talhada com a brasa (tela de título).
- **Ícone do app:** a face do dado (pedra escura, moldura de ouro) com o triângulo ACENDER no meio, a brasa no ponto de cima.

---

## 8. Ordem de trabalho
1. Sistema de **espaços de jogo e salvamento automático** (tira a dependência do "recomeçar").
2. **Tela inicial, pausa e configurações** (com Áudio e Imagem já substituindo os botões do canto).
3. Tirar os botões do canto e os emojis.
4. **Caixas de texto** em pedra/papel/dado.
5. **Ícones** definitivos (16×16 e 24×24) e os avisos de ação com tecla/botão.
6. Logo e ícone do app.
