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

### 3.1 Tela inicial
Fundo: o poço, de baixo, com a luz lá em cima (a cena já existe), e o logo «SENTENÇA» com o triângulo (§7).
Opções, em plaquinhas de pedra, uma embaixo da outra: **Continuar** (só se houver jogo salvo) · **Novo jogo** · **Carregar** (os três espaços) ·
**Configurações** · **Créditos** · **Sair** (não aparece na web).

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
