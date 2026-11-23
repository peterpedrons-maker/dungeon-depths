# Masmorra do Dado — Documento de design (v0.2)

> Direção aprovada pelo autor em conversa: **"A Sentença"** (história + língua própria).
> Itens marcados **[DECIDIR]** ainda esperam escolha. O vocabulário e a gramática ficam em `LINGUA.md`.
> Imagens de referência de estilo em `docs/lingua/`.

## 1. Pitch

Um puzzle de exploração em primeira pessoa, sem combate. O jogador está **condenado**: a masmorra é a sua
**sentença**, escrita numa língua que ele não lê. Cada sala é uma palavra dessa frase, e cumprir a pena é
**aprender a ler**. O dado que ele segura (cada face é uma lei do mundo) é a sua voz, e o giz é a sua mão.

Em português, *sentença* é uma frase e também um veredito. É o título e o motor da história.

Tom: melancólico, curioso, sem humor forçado. Referências: *Chants of Sennaar*, *The Witness*,
*Return of the Obra Dinn*, *The Talos Principle*.

## 2. História (mínima, mas com motivo)

- **Os Contáveis** foram um povo que só falava com pontos de dado. Para eles **dizer era fazer**: uma frase
  só era verdadeira se o dado a confirmasse.
- **Por que o jogador está ali:** foi condenado por eles. A masmorra é a sentença.
- **A virada:** a sentença está **incompleta**. Falta a última palavra, e só o jogador pode escrevê-la.
  O veredito dele **não tem a marca de confirmação do dado**: foi condenado por uma frase que nunca foi lançada.
- **Os três finais** nascem da gramática, não de um menu:
  1. **Cumprir:** confirmar a sentença lançando o dado sobre ela.
  2. **Absolver:** negar a frase (ATRAVESSAR/NÃO).
  3. **Repetir:** lançar o julgamento inteiro de novo (DE NOVO).
- **O crime** nunca é entregue: o jogador o reconstrói por frases, e em partes ele é ambíguo.
- Quem fala: **poucos NPCs** (ecos dos Contáveis) e, sobretudo, **diários achados** de outros condenados. Ver §7b.
- **[DECIDIR]** nome do jogador (ou sem nome), tom exato dos textos de lore, nome do jogo.

## 3. A língua (resumo; detalhe em `LINGUA.md`)

- Alfabeto: grade **3×3** de pontos, como o rosto de um dado. Três famílias de forma:
  **números** (pontos soltos), **verbos** (pontos ligados por linhas, as 6 faces),
  **coisas** (dentro de uma moldura quadrada). Mais **ligações** (SE, TODOS) e **marcas do dado**
  (onde o dado está diz se a frase é verdade: pousado, no ar, caído, dois no ar).
- Números em **base 6** (o seis se escreve "10").
- Ordem: verbo, número, coisa, marca.
- ~28 palavras na primeira amostra, ~30 no jogo todo, com poucas palavras e muitos usos.

## 4. Como o jogador aprende (regras de design dos puzzles)

**O jogo nunca explica.** Nenhum texto traduzido, nenhum balão dizendo o significado.

**Não há regra fixa.** Cada palavra é ensinada com a ferramenta que fizer mais sentido, e elas se misturam:
- **Demonstração:** o símbolo aparece junto do efeito (em cima de uma tocha apagada; o jogador a acende).
- **Repetição com variação:** o símbolo aparece em outra coisa (mudando só um elemento por vez, para separar a coisa da ação).
- **Uso sozinho:** o símbolo aparece sem ajuda e o jogador precisa aplicá-lo.
- **Altar:** destravar uma face do dado ensina a palavra dela.
- **NPC/eco:** usa a palavra numa fala ou reage a ela.
- **Diário achado:** o registro de outro condenado mostra um símbolo e o que ele achava que significava.

Triangulação continua valendo: toda palavra precisa aparecer em contextos suficientes para ser deduzida.
O que importa é que o jogo nunca diga o significado.

## 5. O Diário (guarda "tudo" do jogador)

Abre a qualquer momento (PC e celular), **inclusive na sala final**. O desafio é entender a língua, não decorar desenhos.

Abas:
- **Dicionário:** cada símbolo visto entra sozinho, marcado **"avistado"**. A página mostra o desenho copiado
  da parede (e a sala onde foi visto) e um espaço para o jogador escrever **o que ele acha que significa**,
  com as próprias palavras. Pode apagar e reescrever à vontade. **O diário nunca diz se está certo.**
- **Mapa:** o minimapa com as marcações persistentes do jogador (já planejado).
- **Textos:** lore achada (inscrições, bilhetes, falas dos ecos).
- **Faces:** as seis faces do dado, com o que o jogador já descobriu de cada uma.
- **Anotações livres.**

Sem miniatura da cena na página (seria dica demais).

## 6. Como o jogador escreve

- A superfície de escrita é **lisa**: sem grade, sem rastro, sem guia.
- O jogador consulta o **diário** (o que viu e o que ele mesmo anotou) e escreve **de memória** com o giz.
- Os puzzles de escrita são **frases talhadas com uma lacuna lisa**: o jogador completa a palavra que falta,
  deduzindo pelo que viu na sala.
- Errou: **nada acontece.** A parede não comenta nem lê em voz alta. Acertou: o puzzle reage (a porta abre).
- Técnico: a lacuna é uma área delimitada; o jogo normaliza o traço dentro dela para a grade 3×3 e compara
  com tolerância generosa (principalmente no celular).
- Na sala do veredito não há ajuda alguma: ninguém escreve o veredito por você.

## 7. Como o jogo confirma que o jogador entendeu (sem dizer)

Nunca por um selo no diário. A confirmação é **dentro do mundo**:
1. **Usar a palavra exata num puzzle:** a porta abre, a chama acende, algo reage.
2. **Ecos (NPCs):** os ecos falam em glifos. Usam palavras que o jogador já viu e reagem quando ele
   escreve algo na frente deles.
3. **Textos de lore:** frases onde a palavra aparece de um jeito que só faz sentido com o significado certo.
4. **[DECIDIR]** os balões dos ecos começam só em glifos; **quando uma palavra foi provada pelo uso**, ela passa
   a aparecer em português dentro do balão. Seria a grande recompensa visível, e funciona em qualquer idioma.

## 7b. Conversas e diários achados

**Janela de conversa** (estilo RPG clássico, não balão de HQ): caixa na parte de baixo da tela com o nome de quem fala
e o texto aparecendo letra a letra. Toque ou Espaço avança; segurar acelera. Serve para NPCs e para leituras.

**NPCs: poucos.** Ecos dos Contáveis, com falas curtas. **[DECIDIR]** quantidade (chute: 3 a 4 no jogo todo).

**Diários achados.** Outros condenados deixaram cadernos pelo caminho, **no mesmo formato do diário do jogador**:
símbolos desenhados com a anotação que a pessoa fez ("acho que é acender"), mais fragmentos da vida dela.
- Servem de **dica sem a voz do jogo**, para desempacar um puzzle.
- Cada autor tem personalidade e um destino (o diário é achado onde ele parou).
- Nem todo diário acerta: um pode errar, dois podem se contradizer, e o jogador resolve testando.
- Alguns falam de **segredos** (áreas opcionais que o autor descobriu).
- Entram na aba **Textos** do diário do jogador.
- Colocados perto de pontos difíceis, também servem de rede de segurança para quem travar.

## 7c. O dado e o giz: progressão e funções (rascunho cerebral)

- O jogador **não começa com tudo**. Começa com o giz, o dado, ou os dois, mas o dado com **1 ou 2 faces no máximo**.
- As outras faces são destravadas em **altares** (cada altar é um puzzle e ensina a palavra da face).
- Princípio: o dado é **um verbo que se coloca numa coisa**. Menos arremesso e mais posicionar, espelhando a
  gramática da língua (verbo + coisa): colocar o dado de Fogo num braseiro é "ACENDER BRASEIRO".
- Arremessar fica só como forma de alcançar lugares, não como puzzle.

| Face | Palavra | Proposta (todas **[DECIDIR]**) |
|---|---|---|
| Fogo | ACENDER | acende e **revela** (escrita invisível só aparece à luz) |
| Peso | IGUAL | o dado vale o **número da face** em balanças e placas (somas, base 6) |
| Ricochete | DE NOVO | deixa de ser arremesso: vira **Eco**, o dado repete a última ação feita ali (re-aciona um mecanismo, repete uma sequência, espelha um traço de giz) |
| Troca | EM VEZ DE | troca de lugar o estado de duas coisas, ou duas palavras numa frase talhada (mudando o que ela manda) |
| Deslizar | ENTÃO | define a **ordem** (A dispara B): puzzles de sequência |
| Atravessar | NÃO | nega: apaga o efeito de outra face ou torna algo intangível ("não acender" = apagar) |

## 8. Estilo visual da escrita

Decidido: **a escrita é branca**, como o giz do jogador.
- **Talhada e pintada de cal:** sulco escavado na pedra e preenchido de branco, com relevo que reage à luz
  das tochas. É o texto dos Contáveis.
- **Envelhecida:** a tinta descascou, ficou o sulco escuro, com sujeira, líquen e rachaduras. A idade da
  inscrição aparece no desgaste.
- **Giz do jogador:** pó branco por cima da pedra lisa, sem escavar. É como o jogador distingue o que é dele.
- Técnico: o relevo é gerado por mapa de altura (traço de cinzel de largura irregular, furos irregulares,
  bordas lascadas) e aplicado como decal com relevo, iluminado pelas luzes do jogo. Passa pelo filtro
  pixelado, então o resultado final é mais "crocante" que as imagens de referência.

## 9. Primeira sala: O Vestíbulo dos Números (rascunho)

Ensina **ACENDER**, **UM, DOIS, TRÊS** e o **giz como escrita**, sem uma palavra de explicação.

1. **Porta 1.** Um braseiro apagado com a frase talhada acima: ACENDER · UM · BRASEIRO. O jogador acende o braseiro
   (já sabe fazer) e a porta abre.
2. **Porta 2.** Três braseiros apagados, frase: ACENDER · DOIS · BRASEIRO. A porta só abre com **exatamente
   dois** acesos ao mesmo tempo. O símbolo de ACENDER repete (2ª vez), e DOIS aparece pela primeira vez.
3. **Porta 3.** Três braseiros já acesos. A frase tem uma **lacuna lisa**: ACENDER · ____ · BRASEIRO.
   O jogador conta os acesos, abre o diário, e escreve TRÊS na lacuna. Abre.
   ACENDER agora aparece sem ajuda (3ª vez).

Solução, ao implementar, vai para `PUZZLES.md` (convenção do projeto).

## 10. Rumo ao produto (Steam / app)

| Área | Plano |
|---|---|
| **Empacotar PC** | Electron (ou Tauri) com o build web atual; atualização via Steam. |
| **Steam** | `steamworks.js`: conquistas, nuvem de saves, overlay; página da loja, trailer, capsule art. |
| **Celular** | PWA hoje; Capacitor para Play Store / App Store depois. |
| **Salvar** | progresso, **diário**, giz e configurações (arquivo no PC, `localStorage` na web). |
| **Menu/Opções** | tela inicial, continuar, qualidade gráfica, volume, sensibilidade, teclas. |
| **Controle** | Gamepad API (Xbox/PlayStation/Steam Deck), dicas na tela por dispositivo. |
| **Acessibilidade** | tamanho do texto do diário, redução de brilho/flash, daltonismo (a língua é em forma, não em cor). |
| **Localização** | como a língua é própria, o jogo fica quase independente de idioma; só diário e interface traduzem. |
| **Qualidade** | metas: 60 fps em PC médio e 30–60 em celular; modos Baixo/Médio/Alto. |
| **Legal** | créditos dos sons (CC BY exige), licenças de terceiros, classificação etária. |

## 11. Próximos passos

1. **Diário** (abas, "avistado", anotações do jogador, persistência) e detecção de "símbolo visto pela 1ª vez".
2. **Sistema de inscrições** (decal talhado e pintado de cal, com relevo e luz) e avaliação da escrita do giz na lacuna.
3. **Primeira sala** (§9) e o início da língua (números 1–3 e ACENDER).
4. Balões dos ecos (em glifos), se a decisão do §7.4 for aprovada.
5. Menu inicial + salvar + qualidade gráfica.
