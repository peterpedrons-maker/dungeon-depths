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

## 3. A língua (resumo; detalhe em `LINGUA.md`, vocabulário em `tools/lexicon.mjs`)

- **Escrita por palavra** (um símbolo por palavra), com composição de palavras. Não é cifra de português nem de inglês:
  o jogo é igual em qualquer idioma, e só diário, pensamentos e interface são traduzidos (PT/EN).
- **174 palavras** no vocabulário completo (a primeira versão, com 115, não bastava: faltavam pronomes, perguntas,
  qualidades e verbos básicos; testado com 12 frases típicas de NPC). Definidas desde já para não inventar símbolos
  no meio da produção. Mais palavras só entram se uma frase de lore pedir.
- A **moldura** do símbolo diz a família (coisa, ser, conceito, ligação, posição/tempo); verbos e números não têm moldura.
- Números em **base 6**. Ordem da frase: verbo, número, coisa, marca do dado.

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

**NPCs: 4 no jogo todo** (decidido; 3D é o trabalho mais caro). Falas curtas. **Um deles é um companheiro que acompanha o jogador** e se liga à história. **[DECIDIR]** quem é ele (ver proposta na conversa: O Boato, O Escrivão ou O Pó).

**Diários achados.** Outros condenados deixaram cadernos pelo caminho, **no mesmo formato do diário do jogador**:
símbolos desenhados com a anotação que a pessoa fez ("acho que é acender"), mais fragmentos da vida dela.
- Servem de **dica sem a voz do jogo**, para desempacar um puzzle.
- Cada autor tem personalidade e um destino (o diário é achado onde ele parou).
- Nem todo diário acerta: um pode errar, dois podem se contradizer, e o jogador resolve testando.
- Alguns falam de **segredos** (áreas opcionais que o autor descobriu).
- Entram na aba **Textos** do diário do jogador.
- Colocados perto de pontos difíceis, também servem de rede de segurança para quem travar.

> Resumo da história (premissa, NPCs, abertura pelo poço, finais): ver `HISTORIA.md`.

## 7c. O dado e o giz: progressão e funções (rascunho cerebral)

- O jogador **não começa com tudo**. **Decidido:** começa com o **giz** e o **dado só com Fogo**; o Peso vem no primeiro altar.
- As outras faces são destravadas em **altares** (cada altar é um puzzle e ensina a palavra da face).
- Princípio: o dado é **um verbo que se coloca numa coisa**. Menos arremesso e mais posicionar, espelhando a
  gramática da língua (verbo + coisa): colocar o dado de Fogo num braseiro é "ACENDER BRASEIRO".
- **Decidido: sem arremesso.** Só posicionar, com **encaixe** (socket) no braseiro/altar para dar precisão. Colisão do topo dos objetos precisa ser fiel ao modelo 3D.

| Face | Palavra | Proposta (aprovada; detalhes ainda a desenhar) |
|---|---|---|
| Fogo | ACENDER | acende e **revela** (escrita invisível só aparece à luz) |
| Peso | IGUAL | o dado vale o **número da face** em balanças e placas (somas, base 6) |
| Ricochete | DE NOVO | deixa de ser arremesso: vira **Eco**, o dado repete a última ação feita ali (re-aciona um mecanismo, repete uma sequência, espelha um traço de giz) |
| Troca | EM VEZ DE | troca de lugar o estado de duas coisas, ou duas palavras numa frase talhada (mudando o que ela manda) |
| Deslizar | ENTÃO | define a **ordem** (A dispara B): puzzles de sequência |
| Atravessar | NÃO | nega: apaga o efeito de outra face ou torna algo intangível ("não acender" = apagar) |

## 7d. Quem fala o quê (decidido)

- **O dado é o Boato:** o companheiro do jogador. Fala em glifos, reage ao que o jogador faz (emoção, nunca dica).
- **O Escrivão** é um NPC que o jogador **vai encontrando** pelo caminho (não acompanha o tempo todo). Fala em glifos.
  O jogo terá 4 NPCs além do dado **[DECIDIR]** quem são os outros três.
- **Regra do mundo:** tudo o que é *do mundo* (cenário, NPCs, o dado, ecos, inscrições) fala **em glifos**.
  Tudo o que é **humano** (os **pensamentos do jogador** e os **diários dos outros condenados**) vem **em português**.
  Isso dá um canal natural para dicas raras: os diários e os pensamentos, nunca as vozes do mundo.
- Consequência: a língua **cresce** com o jogo. As 28 palavras da amostra são só o primeiro capítulo; para contar a
  lore inteira em glifos serão necessárias ~80–120 palavras, introduzidas aos poucos. A história só pode dizer o que o
  jogador já consegue ler naquele ponto, o que dita o ritmo. (A planilha em `LINGUA.md` precisa crescer junto.)
- A janela de conversa mostra glifos em linha (mesmo desenho dos entalhes); os pensamentos do jogador aparecem em
  português, em estilo visual diferente.

## 7e. Animações de uso do dado (decidido o conceito)

Cada uso do dado tem uma **animação própria**, e o dado reage como personagem.
- **Fogo (ACENDER):** minicena curta. O jogador fica parado, o dado vai devagar até o braseiro, **começa a se desfazer**
  e vira combustível; a chama acende; depois o dado **renasce** (da cinza, na mão do jogador).
- Cuidados: a 1ª vez é a versão completa; nas seguintes, uma versão curta; dá para **pular** (toque/tecla).
  O jogo não tira o controle de forma brusca (a câmera acompanha de leve). As reações do dado são emocionais e
  **iguais** para acerto e erro (não viram dica).
- **Duração decidida: ~1,5 s no máximo, câmera fixa**, sem cutscene grande. O jogador aperta posicionar, o dado cai devagar,
  queima e volta à mão. Serve só para ele não perder o foco.
- Esboço para as demais faces (ajustáveis depois de ver no jogo) **[DECIDIR]**: Peso (o dado afunda com um estrondo e a placa brilha), Eco (surge uma cópia
  fantasma que repete), Troca (as duas coisas borram e trocam, o dado gira), Deslizar (o dado corre por um trilho
  deixando um rastro), Atravessar (o dado fica translúcido e atravessa).
- Técnica: dissolução por limiar de ruído com borda emissiva, partículas de brasa, sem modelos animados.

## 7f. Aprender conversando (proposta; detalhes **[DECIDIR]**)

Com ~170 palavras, os puzzles sozinhos não ensinam tudo. Canais de aprendizado:
- **Puzzles:** as palavras de puzzle (obrigatórias).
- **Diários achados** (em português, de outros condenados): palavras de história e dicas.
- **NPCs:** conversas em que o NPC fala em glifos e o jogador tenta **decifrar** e **responder**.
- **Inscrições no cenário.**

Regras para a conversa não virar tentativa e erro:
- O NPC **mostra o que diz** (fala e faz: diz "acender o braseiro" e o braseiro acende), então a conversa também é demonstração.
- **Tentativas limitadas por assunto** (ex.: 2). Errou, o NPC perde a paciência e encerra aquele assunto.
- O assunto só **reabre quando o jogador aprendeu algo novo** (ex.: +3 palavras), então não adianta insistir.
- As respostas são montadas com **palavras que o jogador já viu** (escolher peças do diário, sem desenhar).
- Os NPCs seguem as regras de fala (§ `LINGUA.md`): começam com EU, uma palavra nova por frase.

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

1. ~~Diário (livro 3D com folhas que viram, escrita no próprio papel) e janela de conversa~~ **(feitos)**: `src/story/`, `src/ui/`.
2. ~~Sistema de inscrições~~ **(feito)**: `src/scene/inscription.ts` (cada palavra é um painel talhado, com sulco e cal desgastada; olhar manda os símbolos ao diário; lacuna lisa onde o jogador escreve com o giz). Falta o relevo por mapa de altura.
3. ~~Primeira sala~~ **(feita)**: Vestíbulo em 3 salas (`rooms/vestibulo.ts`), poço no teto e cena de acordar (§12).
4. Balões dos ecos (em glifos), se a decisão do §7.4 for aprovada.
5. Menu inicial + salvar + qualidade gráfica.

### Mapa: carimbos e segredos
- O mapa aceita **carimbos**: só de símbolos que o jogador já avistou (vêm de `diary.order`). Uma ferramenta no rodapé, toque simples, funciona no celular.
- Futuro: segredos opcionais como nos Metroidvanias; o jogo pode ser terminado sem eles.

## 12. Abertura, cenas e progressão visual (implementado)

**Abertura (só na 1ª vez, `scene.ts`):** preto, um baque; a vista volta devagar com o personagem **deitado** (câmera baixa e
torta); dois pensamentos; ele **levanta**; a câmera sobe até o **poço de luz** no teto; o Boato fala em glifos
(VOCÊ · CONDENADO · BOATO, sem tradução); último pensamento (giz e dado); olhos descem e o jogo começa. O poço
(buraco redondo, tubo de tijolo até uma luz distante, coluna de luz e mancha no chão) é o mesmo lugar por onde o jogador chega ao veredito no final.

**Cenas curtas** usam `ctx.freeze`, `ctx.lookAt` e `ctx.say`: a câmera vira sozinha, o jogador fica parado. **Dado queimando** (acender com o Fogo): ≤ 1,5 s, câmera parada,
o dado esquenta, escurece e vira brasa, e renasce na mão; qualquer toque/tecla pula o resto.

**Marcos (`src/story/progress.ts`)**: `fogo` (1º braseiro), `dois`, `tres`, `escrivao`, `selo`, `brasas`. Cada marco sobe um **estágio** da Casa (0–6). O estágio muda:
- a **luz**: o ambiente esquenta e clareia (até ~22%), a névoa recua e perde a cor fria;
- a **escrita**: a cal das inscrições passa a brilhar (de um mínimo legível até forte), de modo que a Casa responde a quem aprende a ler;
- as **faces do dado**: só o Fogo no começo; Peso e Ricochete com `escrivao`.

**Progressão do cenário (um clima por capítulo, em ordem):**
| Capítulo | Salas | Clima |
|---|---|---|
| Fogo | 1–3 Vestíbulo | `ruin`: pedra cinza, sem cor, poeira, rachaduras, entulho; só a luz do poço e os braseiros |
| Escrita | 4 A Entrada | `crypt`: tijolo mais vivo, tapete e estandartes, tochas; o Escrivão |
| Umidade | 5 O Selo | `moss`: pedra esverdeada e úmida |
| Brasas | 6 O Salão | `ember`: arenito de brasa, sala redonda |
| Altura | 7 O Mirante | `frost`: azul frio, dois níveis |
| (a fazer) | veredito | mármore claro e limpo, a mesma luz do poço (por cima) |
Como o mundo é conectado, voltar a uma sala antiga a mostra mais viva (mais luz e cal brilhando) do que na primeira vez.

## 13. Ritmo e duração (proposta; **[DECIDIR]** os números)
Meta: **algumas horas de jogo (4 a 6 h)**, não 20 minutos. Um jogo de puzzle depende de o jogador **aprender**, então as
mecânicas chegam devagar e cada uma é explorada a fundo antes da próxima.
- **Só Fogo e Peso no começo, por muito tempo** (implementado: `progress.ts`). A 3ª face (Eco, no lugar de Ricochete) só chega bem depois.
  A face Ricochete está selada até lá (a gema escondida da Sala 4 espera por ela).
- **Meta de tamanho:** ~40 salas em 3 andares (o mapa de teste). Com só Fogo e Peso: o **1º andar inteiro** (~15 a 18 salas);
  Eco abre o 2º andar; Troca, Deslizar e Atravessar ficam para o 3º, um capítulo cada.
- **Como variar com só duas faces** (ideias): contar braseiros e pesos (números); chamas que se apagam (tempo) e várias
  placas ao mesmo tempo; fogo queimando cordas; peso quebrando piso rachado; dois níveis e rampas (altura); salas redondas
  com ordem; giz em lacunas (escrever o número, a palavra), selos e lousas; frases cujo verbo muda a regra da sala
  (ACENDER, PESAR, CONTAR, IGUAL...); portas que pedem a soma ou a diferença; voltar a salas antigas com a língua nova.
- **Língua em paralelo:** cada capítulo ensina umas poucas palavras de puzzle; as de história ficam opcionais.

## 14. O Escrivão (implementado, `src/scene/scribe.ts`)
Criatura **encapuzada e decrépita**, de rosto coberto (só o vazio preto sob o capuz), corcunda, mãos ossudas, barra do manto
esfarrapada. Feito à mão com formas simples (nada de modelo 3D importado: o jogo todo é procedural e isso mantém o estilo e o
tamanho). Aparece como névoa na Sala 4, anda junto da escrita, escreve com um toco de giz, vira o capuz para o jogador na pergunta e some.

## 15. Abertura revista: sem nada nas mãos (implementado)
O personagem acorda **sem dado e sem giz**. Ordem de descoberta:
1. **O dado** (Sala 1): a porta está trancada ("E · Tentar abrir"); o dado caído no entulho brilha, "fala" em glifos e voa até a mão. Só então há o que acender.
2. **O giz** (Sala 4): o Escrivão, ao ir embora, deixa cair o giz. Até lá o jogador só **lê**; o 1º puzzle com o giz é a Sala 5 (A Lacuna).
3. **Interação genérica** (`Room.interactables`, `ctx.have/giveDie/giveChalk`): prompt na tela, E / AGIR / toque. Os botões do celular só aparecem quando há o que usar.
4. **Dado falante** (`story/chatter.ts`, `ui/BoatoBubble.tsx`): balão pequeno com 2–4 símbolos, raro (a cada 45–90 s), nunca durante conversa/diário; reage a queimar, placa, porta e salas novas, e reclama se o jogador fica parado. Os símbolos que ele diz vão para o diário.
5. **Tamanhos de sala variam** no começo: O Poço 6,8×11 m (teto 3,2), O Vestíbulo 9,4×17 (3,9, colunas), Os Quatro 7,4×13,5, A Lacuna 6,6×10 (teto 3,0).
