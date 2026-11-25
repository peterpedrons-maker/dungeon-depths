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

## 16. Construtor de salas de fogo (implementado: `rooms/fire.ts`, `rooms/fireRooms.ts`)
Uma sala de braseiros é uma **descrição** (`FireSpec`): tamanho, tema, braseiros (posição, símbolo no pedestal, se já começa aceso), colunas, a
**regra** e a frase na parede. O construtor monta o resto. Regras prontas: `exact` (exatamente N acesos; com mais, a Casa apaga tudo), `order`
(acender na ordem certa; fora de ordem apaga tudo) e `together` (todos acesos ao mesmo tempo; os braseiros têm `burn` = segundos de duração e `scale` = tamanho; ao acontecer, a porta abre para sempre). Outras (corda a queimar, várias portas) entram como novas regras, uma de cada vez. Cronômetros de puzzle usam `ctx.paused()` para esperar durante cenas, conversas e o diário.
- **Uma sala por vez, bem pensada** (regra do projeto): cada sala ensina UMA ideia e está descrita em `PUZZLES.md` com o que ensina.
- Salas especiais (poço, lacuna, selo, cenas do Escrivão) continuam como módulos à mão.
- **Numeração e mapa automáticos:** as salas são numeradas pela posição na lista (`Sala N ·`), e o mapa do diário é gerado dessas salas
  (`layoutWorld`: 6 por fileira, 3 fileiras por andar = 18 por andar, escadas entre andares). Para inserir uma sala basta pôr na lista.
- **Plano de ritmo** (aprovado): ~50 a 60 salas, ~6 h; só Fogo nas primeiras ~16 salas, Peso na ~17, giz pouco depois (~28), a 3ª face (Eco) no capítulo 3.
  O Escrivão aparece de longe 3 a 4 vezes (cedo, no meio, no fim do cap. 1) e só no começo do cap. 2 de perto, deixando o giz.

## 17. Régua de dificuldade (corrigida) e curva do capítulo 1
Aprendido com o feedback: o que eu chamava de "4 de 10" era **nível 1 ou 2**. Em um jogo de puzzle, qualquer pessoa resolve um nível 1.
Se for fácil demais por muito tempo o jogador perde a vontade; se for difícil cedo ele não entende o jogo. A régua:
| Nível | O que é |
|---|---|
| **1** | uma regra, resposta à vista (ensina) |
| **2** | uma regra mais um detalhe não óbvio; dá para vencer por tentativa |
| **3** | **duas regras juntas** e é preciso **deduzir** (pistas, contagens, eliminar possibilidades); ~3 a 5 min |
| **4 a 5** | três camadas, informação espalhada por salas, planejar antes de agir |
| **6 a 7** | lembrar de salas antigas, várias portas, a primeira impressão engana |
| **8 a 10** | fim de jogo: combinações de tudo, segredos |

**Curva planejada para o capítulo 1 (só Fogo, ~16 salas):** salas 1 a 5 = nível 1 a 2 (ensinam); 6 a 9 = **nível 3**; 10 a 13 = **nível 4**; 14 a 16 = **nível 5** (as últimas antes do Peso).
Cada sala nova **soma** uma camada ao que o jogador já domina (ordem, contagem, tempo, tamanho, confirmação), nunca só repete.
**Paleta de mecânicas de Fogo** para misturar: contagem exata, ordem explícita, **ordem secreta com confirmação** (implementada), tempo e duração por tamanho (implementada),
fogo que **corre por canaletas** de um braseiro a outro, braseiros **ligados** (acender um acende um gêmeo longe, depois de um tempo), luz que **revela** inscrições escondidas,
número vindo de outra sala, cordas e madeira para queimar, várias portas decididas pela sequência (hubs), e frases com palavras que mudam a regra (NÃO, TODOS, MENOS, DEPOIS).
**Regra de ouro:** se a sala puder ser vencida sem pensar, ela ainda é nível 1.

## 18. O que é "dedução" neste jogo (lição do nível 10)
Feedback do autor: **tentativa e erro com um contador (tipo Mastermind) não é dedução**. Dedução é chegar à resposta **só raciocinando**, a partir de **pistas visíveis** que se leem.
Como o jogo é sobre a **escrita**, as pistas são **frases da língua** (e o que se vê: tamanhos, números, molduras). Princípios para os puzzles daqui para frente:
- Toda sala de nível 3 ou mais tem **frases para ler e interpretar**, não só uma ordem de fogo para achar.
- **Solução única, provada por busca** (`tools/verify_*.mjs`), e **nenhuma pista descartável**.
- **Sem feedback que permita chutar** (nada de gema por passo): errar tem **custo** (os braseiros esfriam).
- Misturar **canais**: o que se lê (frases e marcas CONFIRMADO/BOATO) com o que se vê (tamanho, número no pedestal).
- O **diário** é parte do puzzle: o jogador copia e risca hipóteses. Os puzzles mais difíceis esperam isso.
- **A Sala 6 (A Confirmação) é um Mastermind**: fica como um puzzle de nível 2 a 3 (ensina a ideia de eliminar), não como "dedução". O **Tribunal dos Rumores** (nível 10) é o modelo do que queremos.

## 19. Salas de várias ferramentas e o "puzzle de escrever" (proposta + a sala de teste)
- **Sala de teste `?lab=1` — A Placa que Julga** (implementada; `rooms/lab.ts`, regra `commit` e tablete `rub` em `rooms/fire.ts`): mostra as 3 ferramentas juntas. O Fogo
  monta o conjunto de chamas; o **Peso é o "enviar"** (a placa avalia e, se errado, abafa o fogo); o **giz LÊ**: esfregar num tablete liso faz a frase
  aparecer (o giz não só escreve). Lógica: condições SE/ENTÃO/E + marcas CONFIRMADO/BOATO + lei da contagem (nível ~6 a 7 só na lógica; o que a
  sala mostra é o cruzamento das ferramentas e a restrição do dado único).
- **Fileiras (regra → torção → reprise)**, uma sala de tutorial por palavra nova, como em The Witness. Aprovado pelo jogador.
- **Frases em parágrafo**: 3 a 4 linhas de frases, uma sob a outra, começando e terminando do mesmo jeito (o jogador aprende por repetição onde a frase começa/termina). Ver o
  "livro de pedra" (ordem de leitura fixa) pendente.
- **Puzzle de escrever SEM giz** (ideia do jogador): os braseiros acendem e apagam sozinhos indicando uma ordem; o jogador monta a frase na parede **trocando blocos de
  glifos de lugar** (estilo quebra-cabeça de deslizar: selecionar um bloco e outro com E/AGIR), sem giz. Serve de tutorial de "escrever uma frase" antes do giz. Para não ser só
  memória, a sequência se repete em laço e a frase correta usa uma regra que o jogador já viu (ex.: números fora de ordem nos pedestais).
- **Opcionais em níveis** (fácil/médio → gema colecionável, diário ou atalho; difícil → história). Segredos ficam para depois.

### Regra de escrita nas paredes (decidida pelo jogador, implementada)
- **Texto em parágrafo**: frases completas, 3 a 4 linhas, uma embaixo da outra, alinhadas à esquerda, lidas **de cima para baixo**, dentro de uma moldura só
  (`FireTablet.lines` em `rooms/fire.ts`). Cada linha termina na sua marca (CONFIRMADO, BOATO...). Parágrafos podem ficar em paredes diferentes. O Tribunal e a sala de teste já usam isso.
- **Nível mínimo a partir da sala 6**: o jogo todo deve ser do nível do Tribunal / da Placa que Julga **para cima**; só as 5 primeiras salas são mais simples.
- **Parágrafos pequenos, em várias paredes** (decidido pelo jogador): 2 a 3 linhas por bloco; não juntar tudo num bloco só nem dar a volta na sala. As frases da sala não dependem da ordem entre blocos (cada linha é uma condição), então não é preciso numerar os blocos; frases que SÃO sequência ficam na mesma linha.
- **Toda frase termina numa marca**: as ordens das portas (salas 1 a 5, Tribunal, sala de teste) fecham com CONFIRMADO; as perguntas, com PERGUNTA. Falta o **ornamento de abertura** (decidir o símbolo).

## 20. Estrutura atual da lista de salas e o que fazer com ela
- **Lista de `BUILDERS` (scene.ts), hoje 12 salas**: 1 O Poço · 2 O Vestíbulo · 3 Os Quatro · 4 A Ordem · 5 A Chama Curta · 6 A Confirmação · 7 A Entrada (Escrivão; dá o giz) · 8 A Lacuna (giz) · 9 O Selo (giz) ·
  10 O Salão das Brasas (Fogo+Peso) · 11 O Mirante (Fogo+Peso) · 12 O Tribunal dos Rumores (nível 10; foi movido para o fim, posição provisória).
- **Fora da lista (reserva)**: `A Placa que Julga` (`?lab=1`, `rooms/lab.ts`): Fogo+Peso+giz juntos; guardada para o meio/fim do jogo, quando o jogador tiver as 3 ferramentas e o vocabulário (SE, ENTÃO, NÃO, E).
- **Descompasso com o plano de ferramentas**: as salas 7 a 11 são antigas e já usam giz e Peso logo depois da 6. O plano é Fogo até ~16, Peso ~17, giz ~28; elas devem sair do começo e voltar nos capítulos 2 e 3.
- **Tochas**: nas salas de fogo nunca há duas tochas na mesma parede a menos de 3,2 m (`wallTorch` em `fire.ts`); parágrafos ganham uma tocha em cada ponta e uma só entre dois vizinhos.
- **Salões com várias portas (ideia do jogador)**: o motor liga as salas em fila (eixo z), então um "hall de castelo" ramificado pede ou (a) **anexos dentro do mesmo módulo** (câmaras laterais atrás de portas, algumas abertas, outras trancadas) ou (b) um mundo em grafo (x, z por sala), que é refatoração grande. Começar por (a).

## 21. Curva do capítulo 1 refeita (decisão do jogador) e o "dado que acende escrita"
**Regra:** salas 1 a 4 ficam como estão (nível 1 a 2). **Da 5 em diante só sobe**: 4, 5, 6, 7... até o Tribunal (10). O jogo deve ser difícil. As salas antigas com Peso/giz (A Entrada, A Lacuna, O Selo, O Salão das Brasas, O Mirante) e o Mastermind (A Confirmação) saíram da lista (RESERVA em `PUZZLES.md`).
| # | Sala | Nível | Ideia |
|---|---|---|---|
| 5 | A Chama Curta | 4 | tempo com 4 braseiros em salão de 27 m: planejar duração e caminho |
| 6 | O Que a Casa Confirma | 5 | **acender frases CONFIRMADAS** (as de BOATO punem) → **pilares sobem do chão** → ordem por cadeia de ANTES/DEPOIS |
| 7 (a fazer) | | 6 | acender frases **na ordem** (`lock.ordered`) dada por números; os pilares têm tamanhos (tempo) |
| 8 (a fazer) | | 7 | ANTES/DEPOIS com GRANDE/PEQUENO e 5 pilares; boatos que contradizem só em parte |
| 9 (a fazer) | | 8 a 9 | duas paredes que se contradizem + a lei «N BOATO = VERDADE» em versão curta; frases que acendem e **apagam sozinhas** |
| ~16 | O Tribunal | 10 | (já existe; depois uma versão com 6 pilares) |
Entre elas: **salões com várias portas** (§20) e salas abertas para explorar, com símbolos nas paredes.
**Mecânica nova (implementada em `fire.ts`)**: `FireTablet.lit` faz as linhas de um parágrafo **acenderem quando o dado de Fogo as toca** (laranja, com chama ao lado); `FireLine.good` (modo conjunto) ou `FireLine.ord` + `lock.ordered` (modo ordem) dizem quais valem; errar apaga todas e a Casa recusa o fogo por `lock.penalty` s. `FireBrazier.hidden` esconde o pilar sob o chão até a trava ser resolvida (sobe em 2,2 s, com estrondo e legenda). Serve de **ensino** (o jogador aprende a ler a marca antes de precisar dela) e de **puzzle em dois passos** (liberar e depois resolver). Quando o dado só passa perto da frase, ela acende: arremessar ou posicionar junto da parede.
**Risco conhecido**: o passo 1 (escolher quais frases acender) pode ser vencido por tentativa e erro, porque errar só custa 4 s. Se ficar fácil, aumentar a pena (ex.: pilares que descem de novo) ou usar o modo ordenado.

## 22. Primeira aparição: o jogo se explica sozinho (decisão do jogador) — protótipo do rabisco
- **Regra**: toda coisa nova (mecânica, palavra, marca, ferramenta), na 1ª vez, aparece **sozinha**, **sem punição**, e **se explica pelo efeito** (o glifo brilha quando o significado acontece; a frase cresce uma palavra por sala; a casa "lê" a frase quando a porta abre). Palavras concretas ganham ajuda extra; as abstratas (ANTES, SE, NÃO, CONFIRMADO/BOATO) se explicam por contraste e por demonstração.
- **O dado traduz o glifo** (implementado; `sketch.ts`, `showSketch` em `scene.ts`): quando o jogador **olha uma palavra que tem desenho** por ~0,5 s (a menos de 4,6 m), a **face de CIMA do dado da mão** troca por um rabisco em pixel (traço à mão, claro, chamas em ocre) por ~5 s; o dado para de girar com o desenho de pé e as gemas brilham mais; ao acabar (ou ao trocar de face) volta ao normal. Com o **giz** na mão principal, o dado fica na mão esquerda e continua mostrando (testado). **A ajuda diminui**: no máximo 3 vezes por palavra (guardado no aparelho, chave `mdd-sketch-v1`) e uma vez por palavra da parede por visita. Hoje só existe o desenho de **BRASEIRO** (`SKETCH_WORDS`); novas palavras concretas entram aí. Dev: `__mdd.sketch('brasa')` força.
- **Transição e fala (implementado)**: linha do tempo de ~6 s: 0 a 0,4 s as gemas escurecem e o dado dá um impulso; 0,4 a 1,3 s o desenho **entra por dissolução pontilhada** (padrão de Bayer, no clima do dithering do jogo; `dieSketchBlend` em `textures.ts`); em ~1,3 s **o dado fala**: um balão com o **desenho e o glifo da palavra juntos** (o desenho primeiro, depois o glifo; o glifo vai ao diário); nos últimos 0,9 s o desenho se **desfaz do mesmo jeito**. Sem tradução em português e sem som (decisão do jogador). A fala de ensino é **sincera** (gemas firmes e quentes): mais adiante o **tremor das gemas** será o sinal de quando o dado mente. Dev: `__mdd.sketchAge(t)` congela a linha do tempo.
- A versão grande do rabisco (sulco escuro, hachuras, lascas; `draw` em `sketch.ts`) ficou guardada para uso futuro (parede ou diário), mas não aparece em lugar nenhum.
- Outras ideias guardadas: fio de luz do glifo até o objeto; retrato da cena salvo no diário; silhueta que faz a ação; som por palavra.

## 23. O dado vivo (protótipo implementado: `src/scene/dielife.ts`, integração em `scene.ts`)
O dado da mão **olha, reage, pisca e cochila** (tudo sutil: inclinação, pulinho, brilho das gemas; sem som).
- **Olhar**: ele se inclina para o que é interessante, nesta ordem: a **inscrição que o jogador encara** (1,6 s depois de desviar o olhar ele ainda olha) > o **braseiro à frente** (a menos de 7 m; pilares escondidos não contam) > a **porta** > nada (então **vagueia o olhar** a cada 2 a 6 s, e em ~30% das vezes **olha para o jogador**). Com o **Fogo selecionado**, ao ver um braseiro ele fica **ansioso**: inclina-se na direção dele e as gemas pulsam (dica visual de "isso eu acendo").
- **Reações a eventos** (`ctx.sfx` em `makeCtx`): acendeu = **recua** (susto quente); porta abriu = **empina e olha para o jogador**; erro = **treme** (gemas escurecem); placa = **baque**; chama apagou = **abatido** (cai um pouco, gemas fracas); peça/gema = **alegria** (pulo e balanço).
- **Vida própria**: respira, **pisca** (as gemas apagam por um instante) a cada 3 a 8 s, e com o jogador parado por ~40 s **cochila** (cabeça baixa, gemas fracas); acorda assustado ao se mexer.
- **Balão de fala centrado no dado**: o motor publica a posição do dado na tela (`--die-x`, `--die-y`) e o balão se centra nela, nas duas mãos.
- **Ainda não**: olhar para **personagens** (NPCs como o Escrivão: falta `Room.interest()` para a sala apontar o ponto), "pupila" (uma gema só brilhar mais, exige textura por gema), sons (chilreios), tremor das gemas como sinal de mentira. Dev: `__mdd.life('flinch'|'perk'|'joy'|'shake'|'thump'|'sad'|'sleep')`.

## 24. Uma palavra nova por sala; o glifo reage (decisão do jogador, implementado nas salas 1 a 6)
| Sala | Frase da porta | Palavra nova | Como o glifo reage |
|---|---|---|---|
| 1 O Poço | ACENDER | ACENDER | brilha em brasa quando o braseiro é aceso |
| 2 O Vestíbulo | ACENDER · DOIS | DOIS | o número **enche** conforme os braseiros acesos (dois = cheio) e fica forte com a porta aberta |
| 3 Os Quatro | ACENDER · TRÊS · BRASEIRO | TRÊS, BRASEIRO | idem; BRASEIRO **pisca** a cada braseiro aceso; olhar o glifo faz o dado mostrar o desenho |
| 4 A Ordem | ACENDER · DOIS · TRÊS · UM · BRASEIRO | UM + a ideia de ORDEM | cada número brilha **com o braseiro dele** (o rótulo do pedestal é o mesmo símbolo) |
| 5 A Chama Curta | ACENDER · QUATRO · BRASEIRO · TEMPO | QUATRO, TEMPO | TEMPO **pulsa** enquanto uma chama está acabando |
| 6 O Que a Casa Confirma | ACENDER · CONFIRMADO | CONFIRMADO (e BOATO, ANTES, DEPOIS nas frases) | CONFIRMADO brilha quando uma frase confirmada acende |
- Os glifos usam `Inscription.panels[i].fire` (0 a 1), que o `setGlow` já converte em laranja forte; salas do construtor (`fire.ts`) e do vestíbulo (`vestibulo.ts`) fazem isso por palavra (`glow(id, alvo)`).
- A **marca final** (CONFIRMADO) só fecha as frases a partir do Tribunal e da sala de teste; antes disso o jogador ainda não a conhece.
- Pendente: o **fio de luz** do glifo até o objeto, rabiscos para outras palavras concretas (chama, porta), e o mesmo tratamento para as palavras de salas futuras (cada sala nova = uma palavra nova + o glifo reagindo).

### O rosto de cada número, feito de TRAÇOS (implementado; `tracos()` / `dieRostoBlend` em `textures.ts`, `updateRostos` em `scene.ts`)
- O dado da mão gira devagar; **a face virada para o jogador (a de baixo, que ele vê de frente) vira um ROSTO** (dissolução pontilhada, ~0,2 s; brilho +70%) e volta a ser gemas ao girar para longe. A face de cima (a escolhida) continua mostrando o número em gemas.
- **Estilo (decisão do jogador: parecido com os glifos da língua)**: nada de desenho animado. O rosto é um glifo sério e abstrato: **olhos = pontos-losango que brilham na cor da face**, **testa = sobrancelhas**, **nariz** e **boca**, tudo em **linhas finas de ouro**, sem preenchimento nem contorno. O número da face aparece como **n pontinhos na testa**.
- **Afeição NEUTRA e igual em todos os rostos (decisão do jogador)**: olhos na mesma altura, sobrancelhas retas, nariz reto, boca reta. O que muda de um número para outro é só a **cor dos olhos** (a cor da face) e os **pontinhos na testa**. Nada de expressão (nem sério demais, nem riso).
- As faces laterais podem aparecer deitadas (depende da face escolhida): `faceTurn` gira o conteúdo em múltiplos de 90° para o rosto ficar de pé; os rostos são refeitos quando a face escolhida muda. **Os olhos e as sobrancelhas olham em volta** (`DieLife.out.look` -> `tracos(..., look)` -> `dieRostoBlend.setLook`): os olhos se deslocam até 4 px na direção do alvo do dado (inscrição encarada, braseiro, porta ou o jogador), as sobrancelhas sobem com interesse e alegria e descem com cansaço, e os olhos **fecham no piscar e no cochilo** (um traço). A textura só é refeita quando o olhar muda um pixel.
- Ainda não: boca que se mexe junto com o balão. Dev: `__mdd.rostoSheet()` devolve uma prévia dos 6 rostos em PNG; `__mdd.freezeSpin(rad)` congela o giro.

## 25. Dicas visuais da mecânica "o dado acende frases" (implementado em `fire.ts`)
- **Soquete com brasa**: no começo de cada frase acendível há um soquete de pedra com uma **brasa fraca pulsando**. É o símbolo fixo do jogo para "isto pode ser aceso". A brasa some quando a frase acende (ou quando os pilares sobem).
- **Rachaduras no chão** onde cada pilar vai subir: anel de pedra quebrada com **brasas nas frestas** pulsando. Ao liberar a trava elas se acendem forte enquanto o pilar sobe e depois ficam só as frestas. O jogador vê, antes de resolver, que há algo escondido.
- **A Casa lê a frase da porta**: quando a porta abre, as palavras da frase acendem uma a uma, da esquerda para a direita (salas do construtor e do vestíbulo). Ensina "escrita que acende = aprovação" e reforça a ordem de leitura.
- Verificado (números, `__mdd.glyphFire`): na Sala 4 acender o braseiro do DOIS acende ACENDER e o glifo DOIS; na Sala 5 acender um braseiro acende ACENDER, o número enche e TEMPO pulsa. A Sala 6 foi vista em imagem (soquetes, rachaduras e pilares subindo).

## 26. Mais palavras com desenho, fio de luz e ornamento de abertura (implementado)
- **Desenhos do dado para mais palavras** (`SKETCH_WORDS` em `scene.ts`, `sketch.ts`): ACENDER = **tocha com chama**, PORTA = **porta em arco com argola**, PLACA = **laje com seta de peso**, BRASEIRO = braseiro (já existia). Valem para qualquer sala onde a palavra apareça, no máx. 3 vezes por palavra.
- **Fio de luz: REMOVIDO** (o jogador não gostou; o brilho do glifo e o desenho do dado já bastam).
- **Ornamento de abertura** (`InscribeOpts.lead`): um **losango talhado com um ponto no meio** antes da 1ª palavra de cada frase de porta marca **onde a frase começa** (não é palavra do léxico). Junto com a marca final (a partir do Tribunal) fecha a convenção de leitura: ornamento -> palavras -> marca.
- Pendentes: o "livro de pedra" (ordem de leitura fixa no Tribunal), o Escrivão aparecendo de longe, o salão com várias portas e as salas de ensino.

## 27. O glifo do efeito nas faces do dado e a conversa do começo (implementado)
- **Marca da face = glifo do efeito** (decisão do jogador; `drawFaceMark` / `faceMarks` em `textures.ts`, `marksSig` em `scene.ts`): no lugar das gemas, cada face mostra o **glifo da palavra do seu efeito**, entalhado em ouro com sulco escuro: **3 Fogo = ACENDER**, **2 Peso = IGUAL/PESAR**, **1 Ricochete = ECO**. As faces 4 (Troca), 5 (Deslizar) e 6 (Atravessar) ainda **não têm palavra definida**: ficam com uma **marca apagada** (losango de contorno). O glifo **só aparece quando a face está liberada E o jogador já viu a palavra** (diário); antes, a marca apagada. As texturas se refazem quando o diário muda. O **número** continua como `n` pontinhos na borda de baixo da face; o **rosto** (que usa as gemas como olhos) não muda.
- **O dado conversa ao ser pego (sala 1)**: depois da fala do jogador ("…E aquele braseiro, apagado…"), o dado diz em glifos, com o desenho do braseiro, **ACENDER BRASEIRO** (`ctx.dieSay`). Se o jogador demorar 50 s sem acender, ele repete.
- **Comemoração (1ª vez que o jogador acende)**: sem o medo de antes (a 1ª queimadura de todas não dispara a fala de medo); ~1,9 s depois (fim da cena do fogo) o dado pula e diz **VOCÊ ACENDER CONFIRMADO**, e uns 4 s depois **EU SENTIR ALEGRIA** (tudo em glifos; vai ao diário como avistado). Vale só na 1ª vez (estado `nudge` da sala 1).
- Pendente: palavras para Troca/Deslizar/Atravessar no léxico (hoje a língua as lista como capítulos, não como palavras de efeito); o glifo da face selecionada pode piscar quando o efeito é usado.

## 28. Recomeçar o jogo do zero (implementado em `App.tsx`)
Botão **ⓘ** (canto) > **Recomeçar o jogo do zero** > confirmação ("Sim, apagar tudo e recomeçar"). Apaga **todas** as chaves `mdd-*` do aparelho (progresso, diário com símbolos, notas, mapa e carimbos, ajudas do dado já vistas), **menos a preferência de som** (`mdd-audio`), e recarrega a página sem parâmetros: o jogo recomeça com a **cena de acordar**, sem dado nem giz. Antes de apagar, desliga a gravação (`progress.noSave`, `diary.noSave`) para nada ser regravado. O botão "Jogar de novo" do fim da demonstração continua só reiniciando a sala 1.

## 29. A abertura revista: o dado cai do poço (implementado; os passos 1 a 3 foram substituídos pela §32: agora é o Escrivão quem joga o dado)
O dado **não está mais no chão ao acordar**. Sequência (tudo em glifos e bem curto):
1. **Porta trancada** ("E · Tentar abrir"): o jogador pensa "Trancada…" e, na hora, **um barulho lá em cima** (duas batidas no poço); a **câmera vira para o buraco** (jogador parado, `freeze`).
2. **O dado despenca** pelo poço (`ctx.dropDie`, física do dado), bate no chão e para; **a câmera o acompanha na queda** (do buraco até o chão). Marco `caiu` guardado: se o jogador recarregar, o dado já está no chão.
3. Depois de parar: pensamento "Caiu alguma coisa. Um dado… e ele brilha." e o dado fala (`EU CAIR`, `VOCÊ AJUDAR EU ?`). **O jogador toma o controle** enquanto o dado **pulsa e murmura** (`AJUDAR EU`, `VOCÊ VIR`, `EU ESPERAR`, a cada ~9 s).
4. **"Pegar o dado" (E/AGIR)**: o dado voa para a mão e vem para o **centro da tela, maior, de frente** (faixas de cinema, `ctx.dieCenter`, olhos do jogador sobem do chão; o rosto aparece) e **explica**, uma frase por vez: `VOCÊ CONDENADO` · `EU BOATO` · `EU AJUDAR VOCÊ` · `ACENDER BRASEIRO` (+ desenho do braseiro). Depois volta para a mão e o jogador retoma o controle; a comemoração do 1º braseiro (§27) continua igual.
- Novos: `Ctx.dropDie`, `Ctx.dieCenter`, `ui.setBars` (faixas, `.bars` em `story.css`), flag `caiu`, `--die-up` (altura do balão do dado). **Som da queda** (`shaftRumble` e `shaftFall` em `audio.ts`, só gravações já existentes, mais graves e com muito eco): um estrondo surdo de tímpano, a porta de pedra pitchada para baixo, duas batidas e um arrastar quando o barulho começa; um assobio de ar e a pancada grave no chão quando o dado despenca. Pendente: um tremor do dado de lá de cima antes de cair.

### O rosto olha sem mexer o dado (implementado em `dielife.ts`/`textures.ts`)
Quando um **rosto está virado para o jogador** (`face` = max de `rostoP`, e sempre na cena do dado no centro), o **dado quase não se inclina nem anda** (movimento reduzido a ~10%): quem olha em volta são os **olhos e o rosto**. Os olhos passeiam mais depressa e mais longe (a cada ~1 a 3 s), as sobrancelhas sobem e descem, e **o nariz e a boca acompanham o olhar um pouco menos que os olhos** (o rosto "vira"). Sem rosto à vista, o dado continua a se inclinar como antes.

### Cena do dado no centro: de frente e olhando direto (implementado)
Na cena inicial (`ctx.dieCenter`), o dado **perde a inclinação** (`tiltNow` vai a zero), fica **exatamente no centro da tela** (x e y = 0, sem balanço) e gira até uma face lateral ficar **perfeitamente de frente** (o rosto aparece de pé, simétrico); o dado não se inclina nem ondula. O **olhar é fixo no jogador** durante toda a cena (alvo `player`, olhos centrados; ele só pisca). Fora da cena a inclinação e o olhar em volta voltam ao normal.

## 30. Regra de tela: nada se sobrepõe; o dado só fala por balão (implementado)
- **Nada se sobrepõe.** Enquanto alguém fala (caixa de conversa **ou** balão do dado) ou há cena (faixas de cinema), os outros elementos esperam ou somem (`speaking` em `App.tsx`): os avisos **AVISTADO** entram numa **fila** (os 3 mais recentes) e **aparecem só depois do fim da conversa**, um de cada vez; legendas ("3 · Fogo"), o "E · Pegar...", a dica de controles, o "Clique para jogar" e os botões de toque (nas cenas) ficam escondidos. A dica de controles só conta seus 9 s enquanto está à vista. Legenda e aviso também não aparecem juntos.
- **O dado fala SÓ por balão** (nunca pela caixa de conversa, que é do jogador/pensamentos e do Escrivão). `ctx.dieSay` funciona com o dado da mão e, antes de o jogador pegá-lo, com o **dado caído no chão** (o balão sai de cima dele, projetado na tela). Combina com o Boato: fala escondida, curta, em glifos.
- **O dado da mão gira mais devagar** (metade da velocidade de antes).
- **Dado arremessado ou posicionado NÃO fica na mão**: enquanto `dieState !== 'hand'` o dado do HUD fica invisível (só existe o dado no mundo); ao voltar (E/recolher) ele reaparece com o "pulinho". O balão de fala se ancora no dado do mundo nessa situação.
- **O balão fica mais tempo** (3,6 s depois do último símbolo, antes eram 2,6 s) e as falas em sequência são espaçadas pelo **tempo real de escrita** (`ctx.dieTalk` soma `lineMs` de cada frase + ~1,7 s de respiro; antes eram atrasos fixos). A explicação do dado ao ser pego e a fala da queda agora duram o quanto a escrita pedir (~30 s no total). Decisão do jogador: o dado está sempre na mão e o balão é fixo na tela (nunca depende de a câmera estar olhando para ele), então não há risco de o jogador "perder" a fala; **todas as falas do dado ficam no balão**, inclusive as essenciais.

## 31. A escrita aparece sendo escrita (implementado)
- **Texto sem tremer**: a parte ainda não escrita ocupa o lugar (`.ghost`, invisível), então a frase **não muda de lugar** na caixa; os parênteses são texto de verdade (o "(" surge com a primeira letra e o ")" só no fim). (Bug anterior: o parágrafo ganhava a classe `done`, que colidia com a classe da tela de fim de jogo e jogava o texto para o centro da tela.)
- **Glifos são ESCRITOS, com ordem de traçado** (`Glyph`/`WordGlyph` com `draw`, `gdraw`/`gdot` em `story.css`; tempos em `src/story/writing.ts`): os traços vêm **um depois do outro, nunca juntos**, cada um do começo ao fim, com a "mão" acelerando e desacelerando e uma pequena pausa (mão levantada) entre eles. Ordem: **moldura** (a caixa/colchete, de um canto ao outro) → **ligações** (na ordem dos dados do léxico, de a para b) → **pontos** (carimbados) → **anéis**. O tempo de cada traço é proporcional ao comprimento. Um símbolo leva `PART_MS = 950 ms`; palavras compostas escrevem uma parte depois da outra (`wordMs` = partes x 950 ms + 150). Na caixa de conversa e no balão do dado, **o próximo símbolo só começa quando o anterior terminou de ser escrito**; tocar para avançar pula a animação.
- **Som de escrita**: no lugar do "blip" artificial (um tom por letra), `scribble` em `audio.ts` toca **pedaços curtos e suaves de uma gravação de giz** (em ponto, altura e volume diferentes a cada vez): um risquinho a cada ~3 letras (sem espaços) e 3 risquinhos por símbolo que se forma.

## 32. Abertura: o Escrivão joga o dado do alto do poço (implementado)
Substitui os passos 1 a 3 da §29. É a **primeira aparição do Escrivão, de longe** (o plano previa 3 a 4 aparições de longe no capítulo 1). Ele entrega o Boato ao condenado: aliado ou não, fica ambíguo. Cena toda conduzida pelo motor (`startScribeDrop`/`updateScribeDrop` em `scene.ts`), com faixas de cinema do barulho até a volta da câmera:
1. **Porta trancada** ("E · Tentar abrir"): "Trancada. Empurro, puxo… nada se mexe." e um **barulho lá em cima** (`shaftRumble`).
2. **Desconfiado**: a cabeça dá um **tranco curto** na direção do barulho, **para** um instante e então **vira devagar** para o poço. Pensamento: "…Tem alguém aí?"
3. **Anda até um ponto FIXO** (não um número de passos): quase embaixo do furo, na beira da luz, do lado da porta (`autoWalk`, 1,6 m/s, freia no fim, com balanço e passos). Quem estava colado na porta anda mais, quem estava mais longe anda menos. Só desse ponto se enxerga o alto do poço.
4. **Olha para cima** devagar, com **zoom** (campo de visão 18°): lá no alto, num **parapeito de pedra** saindo da parede do poço, o **Escrivão** se debruça sobre o vazio, em **silhueta contra a luz do céu** (sem a névoa da sala; capuz, vazio do rosto e braço legíveis), segurando o dado.
5. **Ele fala** (caixa de conversa, placa ESCRIVÃO, em glifos): `VOCÊ · VIVER · ?` (você está vivo?), `EU · DAR · DADO`, `VOCÊ · LER` (a premissa do jogo, sem explicação).
6. **Ele solta o dado**, que **cai desde lá de cima** (velocidade-limite no poço, ~2 s de queda) e **a câmera o acompanha** até o chão (o zoom se desfaz conforme ele desce); ao sair pelo furo do teto o dado ganha um empurrão leve, **quica e rola** até ~2 m à frente do jogador. Enquanto isso o Escrivão **recua da borda e se desfaz**.
7. Com o dado parado, **o olhar volta lá para cima**: o Escrivão **não está mais lá**. Pensamento: "Sumiu."
8. **A câmera volta para a frente**, com o olhar um pouco baixo e o dado caído à vista; as faixas saem. O dado fala (`EU CAIR`, `VOCÊ AJUDAR EU ?`, balão) e **a cena fica TRAVADA** (`ctx.pin`): o jogador não anda nem olha em volta, só pode **pegar o dado** (E/AGIR, alcance 2,6 m). Daí em diante segue a §29, passo 4 (o dado vem ao centro da tela e explica).
- Novos: `Ctx.pin` (trava de cena que ainda permite interagir), `autoWalk` e `fovCine` no motor, `Scribe.hand`, parapeito no poço (`vestibulo.ts`), e o dado pode ficar acima do teto quando está dentro da coluna do poço (`clampDie`). Marco `caiu` guardado quando o dado para no chão: recarregando, o dado já está no chão e o jogador fica livre. Dev: `__mdd.opening()` mostra a fase da cena.

## 33. Abertura cinematográfica e o Escrivão vivo (implementado; refaz os passos 4 a 7 da §32)
**O Escrivão tem esqueleto** (`scribe.ts`, `animate(dt, t, pose)`): pés que pisam sob a barra, quadril que sobe/desce e balança, coluna corcunda que respira e se inclina, cabeça que segue um alvo e dá olhadas curtas, **dois brilhos fracos no fundo do capuz que piscam**, braços com cotovelo, punho e dedos que fecham/abrem. Poses: `walk` (m/s), `lean` (debruçar), `headYaw/headPitch`, `reach` (braço estendido), `back` (mão às costas, dentro do manto), `open` (soltar), `rest` (mão esquerda apoiada). Cada valor chega ao alvo com atraso (peso). A cena antiga (A Entrada) usa `update(t, arm)`, compatível.
**Lá fora** (`vestibulo.ts`, sala 1, `Room.wellTop`): no alto do poço há um **pátio em ruínas**: boca do poço de pedra com dois postes, trave, sarilho e corda; muretas quebradas, um pilar, pedras; torres escuras da Casa ao longe; **céu pálido de madrugada** (meia esfera, só a parte de cima, para nunca aparecer dentro das salas; cabe nos 40 m da câmera). De dentro, olhando pelo poço, vê-se esse céu com a trave e a corda em silhueta (vale também para a cena de acordar).
**Câmera de cinema** (`cineCam` no motor): solta do jogador; nos planos de fora o ar muda na hora (névoa pálida, mais luz ambiente e uma luz direcional fraca, `outsideAtmo`/`outdoor`), e volta ao ar da sala no corte de volta.
Sequência (depois de o jogador chegar embaixo do poço e olhar para cima, com zoom):
1. Ele vê só a luz, a trave e a corda. **CORTE para fora**: plano de lado, câmera baixa empurrando devagar; o Escrivão **vem andando** de trás da mureta, na direção da câmera (os brilhos do capuz à vista), para na borda, **apoia a mão esquerda** e **se debruça**, olhando para dentro do poço.
2. **CORTE para baixo** (olhar do jogador, zoom forte mirando o capuz): o capuz aparece na boca do poço contra o céu. Ele fala: `VOCÊ VIVER ?` · `EU DAR DADO` · `VOCÊ LER`.
3. **CORTE de lado**: ele se endireita um pouco, **leva a mão direita às costas, para dentro do manto, e volta com o dado** (antes ele não tinha nada na mão).
4. **Close na mão** (de cima e de lado): o braço estendido sobre o poço escuro, o dado na mão; um instante… e os **dedos se abrem**.
5. **A câmera desce POR BAIXO do dado** que cai: o dado em cima, girando, contra o círculo de céu, e as paredes do poço passando (dentro da coluna do poço).
6. Perto do teto da sala, **corte para o olhar do jogador**, que vê o dado bater no chão, quicar e rolar. Daí em diante como na §32 (olha para cima: ele sumiu; "Sumiu."; câmera para a frente; cena travada até pegar o dado).
- O Escrivão tem 1,3× o tamanho de antes (alto e curvado; o dado, de ~40 cm, cabe na mão dele). Dev: `__mdd.opening()` mostra a fase, se a câmera de cinema está ativa e onde está a mão dele.

## 34. Diário nítido e interface maior no PC (implementado)
- **O diário tem o próprio canvas**, em resolução cheia (até 2× a densidade da tela), por cima do jogo (`bookRenderer`/`bookScene` em `scene.ts`). As páginas continuam em pixel art (132×176 pixels, fonte 5×8), mas cada pixel do papel vira vários pixels de tela, nítidos: no canvas do jogo (~200 linhas, com pontilhado e paleta) as letras se desmanchavam. Cliques seguem pelo canvas do jogo (mesmo lugar e tamanho). Aberto, o livro ocupa quase a tela toda (escala 1,2). Enquanto o livro está fora, avisos, legendas e a dica de controles esperam.
- **Escala da interface** (`ui/scale.ts`, variável CSS `--ui`): 1 no celular (tela baixa, na horizontal) e até 2,1 em telas grandes. Multiplica os glifos da caixa de conversa (50 px × escala), a placa do falante, o balão do dado, os avisos "avistado", legendas, dica de controles e o texto dos pensamentos.

## 35. Ajustes da abertura, do Escrivão e do dado (implementado)
- **Fim da cena**: o dado caído fala (`EU CAIR` · `VOCÊ AJUDAR EU ?`) AINDA na cena (com as faixas); só quando ele termina a cena acaba e aparece "Pegar o dado". Enquanto o jogador não pega, ele murmura raramente (a cada 25 s), para o aviso não ficar sumindo.
- **Nada atravessa a mureta**: o Escrivão para a 1,95 m do centro do poço (a mureta tem 1,38 m de raio) e se debruça POR CIMA dela. Tira o dado das costas e o **ergue bem alto, na palma virada para cima, acima da cabeça e sobre a boca do poço**; para soltar, **inclina a mão para a frente e abre os dedos**: o dado cai lá de cima, guiado para o meio do poço (o teto da sala só existe na altura do teto). Nova pose `raise`.
- **A mão do Escrivão** (a parte mais bem feita dele, `buildHand` em `scribe.ts`): palma afinando para o punho, cristas dos metacarpos no dorso, quatro dedos de três falanges com um nó em cada junta, unhas escuras e pontudas, polegar opositor de três ossos, punho enfaixado com tiras de pano; mão grande (1,4×). Cada junta dobra (a ponta dobra mais) e, parada, os dedos tremem de leve, um de cada vez. Também ganhou: manto curto sobre os ombros, dobra do capuz sobre a testa, punhos esfiapados, bolsa de couro e corda com borla no cinto (que balança ao andar).
- **Névoa mística pixelada lá fora**: 18 manchas de névoa (sprites) com a transparência em pontilhado e pixels grandes, que giram devagar em volta do poço, sobem, descem e engrossam/afinam; nunca sobre a boca do poço (de baixo ele ainda aparece). O ar de fora é mais grosso (névoa de 3 a 21 m): ao longe tudo vira silhueta.
- **O dado na mão gira em passos**: fica 11 a 17 s com uma face lateral reta para o jogador e então vira devagar um quarto de volta; inclinação caiu de 0,8 para 0,42 rad (o rosto fica reto, ainda se vê um pouco da face de cima).
- **Rosto do dado mais detalhado** (mesma afeição neutra): pálpebras em amêndoa presas ao rosto e, dentro delas, a íris-losango da cor da face, com pupila e brilho, que se MOVE dentro das pálpebras; sobrancelhas em arco com serifa; ponte do nariz desde as sobrancelhas, base e narinas; marcas nas maçãs; boca com as pontas marcadas e queixo. A placa ganhou uma moldura interna entalhada (pontilhada) e cantoneiras douradas.
- **Glifos no iPhone**: a animação de escrita não usa mais `pathLength` (o Safari ignora em retângulos e círculos e os traços sumiam); cada traço anima pelo seu comprimento real.
- **Balão do dado: glifos sumindo e mudando de tamanho (corrigido)**: ao criar a escala do PC (`--ui`), o índice do laço que desenha os glifos ganhou o mesmo nome da escala (`k`), então cada glifo saía com tamanho 26 × posição: o 1º com tamanho ZERO (sumia), o 2º normal, o 3º dobrado... O mesmo erro existia na caixa de conversa (no celular uma regra de CSS fixava a altura e escondia o problema; no PC o 1º glifo de cada fala sumia). Além disso, duas fontes de fala disputavam o mesmo balão (a fala da história e a tradução por desenho, ao olhar uma inscrição): agora as falas da história (`dieSay`/`dieTalk`) têm prioridade (`talkUntil`) e o desenho aparece na face do dado sem falar por cima; comentários soltos também esperam.

## 36. O Escrivão vira um FANTASMA (implementado; substitui o corpo de esqueleto da §33/§35)
Decisão do jogador: o mundo não tem outro humano, e um corpo montado com membros ficava estranho e desconexo. Agora ele é **abstrato e fantasmagórico** (`scene/scribe.ts`, mesma interface `animate(dt, t, pose)`):
- **Um manto só**, do chão ao capuz, que se alarga e **se espalha pelo chão** em ondas e se **desfaz em névoa embaixo** (sem pernas, sem pés); transparência em **pontilhado** (`alphaHash`, com um degradê: a barra é quase névoa, o peito quase sólido). Os vértices ondulam a cada quadro (ondas descendo pelo pano) e o corpo **dobra como pano** ao se debruçar (`lean`).
- **Capa curta** em farrapos sobre os ombros; **capuz** com o vazio preto e os dois brilhos que piscam; olha em volta e para baixo.
- **Sem mãos**: duas **mangas longas e vazias**, de pano simulado (corda verlet de 7 pedaços presa no ombro), que pendem, balançam e **se esticam** (de 0,95 a 1,65 m) quando ele as ergue; a boca da manga é um sino com escuro dentro. **O dado flutua** um pouco além da boca da manga direita (sobe e desce de leve), como se o pano o sustentasse sem tocar.
- **Névoa na barra** (sprites pontilhados girando em volta) e **pó de giz** caindo do manto.
- **Na cena**: ele chega **deslizando** pela névoa, para a 2,35 m do centro (a barra espalhada nunca cruza a mureta), se debruça por cima dela (de baixo, o capuz aparece claramente na boca do poço), leva a manga ao peito e de lá sai o dado, **ergue a manga alto sobre o poço** (o dado fica bem acima do centro, ~2,7 m), a manga se abre e o dado cai. Close: a boca da manga com o dado flutuando, contra o céu.

## 37. O Escrivão pela folha de referência do Pedro (implementado; substitui o fantasma da §36)
Referência: folha de personagem (frente, lado e costas) que o Pedro mandou. Avaliada a ferramenta **img2threejs** (github.com/img2threejs/img2threejs): não é um conversor de imagem em 3D; é um método/skill para agentes reconstruírem a imagem **por código** com primitivas do Three.js, num ciclo "constrói → renderiza no mesmo ângulo da referência → compara lado a lado → corrige". Usamos esse ciclo (sem o pipeline completo de portões e scripts, pesado demais para um personagem): `preview-escrivao.html` (ferramenta de desenvolvimento, fora do build) mostra o Escrivão sozinho de frente, de lado e de costas, para comparar com a folha.
Como ele é (`scene/scribe.ts`, mesma interface `animate(dt, t, pose)`; texturas de pixel geradas por código):
- **Capuz** alto e pontudo, caindo para trás, **aberto na frente** (como pano: a volta do torno tem um vão de ~84°); a abertura em **arco ogival debruada de ouro**, só escuridão dentro e **dois olhos quadrados** que brilham e piscam; a abertura acompanha a inclinação do capuz.
- **Gola** grossa; **capa curta** terminando em **V** na frente, com barra dourada.
- **Túnica roxa** até o chão, com pregas, **abertura da frente debruada de ouro** mostrando a camada de baixo mais escura, **barra dourada em dentes rasgados** e a camada de baixo aparecendo.
- **Estola vermelha** na frente (da capa até abaixo do joelho) e nas costas (mais longa), ponta em V, com o **glifo dourado** (haste, travessas e losango vazado).
- **Cinto de corda** com nó e uma **chave dourada** pendurada (argola em losango).
- **Mangas em sino** com **duas faixas douradas**; **luvas escuras** grandes (a palma virada para a coxa, dedos curvados); **sapatos** escuros sob a barra.
- Esqueleto simples para animar: quadril (passos), tronco que inclina e respira, pescoço que se estica por cima do poço quando ele se debruça muito, braços com ombro/cotovelo/punho e dedos.
Na cena: ele chega andando (os brilhos do capuz à vista), para a 1,76 m do centro do poço, apoia a mão esquerda, se debruça e estica o pescoço: **de baixo, o capuz debruado de ouro e os dois olhos aparecem olhando para dentro do poço**; leva a mão ao manto e de lá tira o dado; **ergue o dado na palma, alto e à frente, sobre a boca do poço** (~2 m de altura, 0,9 m do centro); close: o dado em primeiro plano e o capuz dele embaixo, olhos acesos, olhando para cima; a mão se abre e o dado cai.

### §37, segunda passada: mais detalhe e mais perto da folha (implementado)
- **Sombreado facetado** (`facet` em `scribe.ts`): as faces são separadas e cada uma recebe um tom conforme a sua inclinação, gravado na cor dos vértices (uma luz fixa de cima, da frente-esquerda). É o que dá o aspecto de "planos" do desenho, com qualquer luz do jogo.
- **Capuz feito à mão, facetado** (não é mais um torno): o contorno da abertura é um **losango** (mais largo no meio), com a ponta de cima mais à frente que o queixo (a **aba**); os anéis seguintes abrem para fora e para trás (volume da cabeça, **pico atrás da aba**, nuca arredondada). Debrum dourado com espessura (uma faixa de frente e outra para dentro), um funil preto por dentro e os **dois olhos quadrados** com um halo suave em pixels.
- **Túnica em duas camadas**: o **casaco de fora**, aberto na frente em **V invertido** (a abertura cresce para baixo; `ringGeo` com `gap` por altura), com as duas bordas e a barra douradas e a barra recortada em dentes; e a **túnica de baixo**, pregueada em zigue-zague, até o chão, com a sua barra dourada.
- **Estola** em duas peças (a de cima presa ao tronco, a de baixo ao quadril, para não se projetar quando ele se debruça), **por baixo do cinto**; o glifo fica na peça de baixo, na frente e nas costas.
- **Cinto de corda em duas voltas**, nó e **chave dourada maior** do lado direito dele (como na folha), que balança.
- **Capa** em V na frente **e nas costas**, caindo um pouco sobre os braços; **gola em duas dobras**; **sobremangas** com debrum dourado sobre as mangas em sino de duas faixas.
- **Luvas com dedos separados**: punho, palma que afina, nós, quatro dedos de duas falanges com comprimentos diferentes (abrem em leque e dobram junta por junta) e polegar de duas falanges.
- `preview-escrivao.html` aceita `?cam=x,y,z,tx,ty,tz` (câmera de perto, para ver a mão ou o capuz) e `?pose={...}`.
- Na cena: como os braços novos são mais curtos, ele se inclina mais para erguer o dado sobre a boca do poço (0,83 m do centro, 1,45 m de altura); o close é por cima do capuz dele: a manga, a luva com o dado e o poço escuro embaixo.
- **Escala do dado na mão dele**: no mundo o dado tem 42 cm (o raio entra na física de todas as salas, então não muda). Na mão do Escrivão ele aparece com **22 cm** (`DIE_IN_HAND`), proporcional ao corpo; ao ser solto, sai da mão nesse tamanho e **cresce enquanto cai** até o tamanho do mundo ao passar pelo teto da sala (lido como perspectiva: ele vem na direção da câmera). Depois de parar no chão, tamanho normal.
- **Visto de baixo, ele aparece** (sem pescoço esticado: o Pedro achou estranho): a **boca do poço ficou mais larga** (raio 1,2 m; mureta de fora 1,63 m; postes e trave acompanham). Ele para **encostado na mureta** (`press`): abaixo de 0,85 m o pano da túnica, a estola e os sapatos se **achatam contra ela**, nunca a atravessam; ao se debruçar, o **quadril avança por cima dela** (a mureta é mais baixa que o quadril), como alguém que se debruça numa mureta de verdade. De baixo (zoom 10°): o capuz debruado de ouro com os olhos acesos, o ombro e a luva apoiada na borda, contra o círculo de céu.
- **O dado chega certo ao chão**: ao ser solto, a posição em que ele vai parar já é escolhida (a face do Fogo para cima, de frente para o jogador, `landQ`); nos últimos metros da queda o giro se acomoda nela, então ele não "se debate" no chão para virar.

## 38. Capítulo 1 refeito pela sessão de projeto de puzzles: escrever com fogo (implementado)
A sessão de projeto de puzzles (branch `claude/puzzles-design`) propôs o capítulo 1 inteiro em `PUZZLES_PROPOSTAS.md` (cópia trazida para cá, com os verificadores `tools/verify_lousa|fio|casa_escreve|pano|apelidos|verdade|constelacoes.mjs`). Entraram no jogo **as salas marcadas como feitas (✔)**: A Lousa, O Fio de Fogo, A Casa Escreve (+ C1), O Pano (+ C2), Os Apelidos e O Boato Verdadeiro. As salas atuais Os Quatro e A Ordem saíram para a reserva (as ideias delas estão nas novas 3 e 5); a Chama Curta e O Que a Casa Confirma viraram 6 e 7.
Ordem hoje: 1 O Poço · 2 O Vestíbulo · 3 **A Lousa** (2) · 4 **O Fio de Fogo** (3) · 5 **A Casa Escreve** (3) · 6 A Chama Curta (4) · 7 O Que a Casa Confirma (5) · 8 **O Pano** (5) · 9 **Os Apelidos** (6) · 10 **O Boato Verdadeiro** (6) · 11 O Tribunal (10, provisório). Faltam as salas sem detalhe da proposta (Ponte de Madeira, Sombra, Escuro, Lei Pequena, Fogo que Corre, Os Que Dizem o Mesmo, Memória da Casa).
**A ideia que amarra tudo:** os glifos são pontos numa grade 3×3 e **os números são as faces do dado**; então fogo em grade é **escrita**.
Peças novas do motor:
- `scene/firegrid.ts`: **FireGrid** (9 casas acesas + canaletas dirigidas; o fogo corre ~0,6 s por canaleta e a canaleta fica queimada; a Casa lê **pontos** = acesos e **linhas** = canaletas queimadas; número = só pontos, verbo = pontos e linhas); **lousa de parede** (`makeWallBoard`: 9 lampiões num quadro de pedra, ou pontinhos de bronze na porta, ou soquete frio; o dado de Fogo acende o lampião mirado; dá para posicionar o dado mirando a lousa); **canaleta no chão** com chevrons e o fogo correndo; **casa lisa** que copia ao vivo o desenho de uma lousa (`makeLivePanel`, usa a lacuna `null` de uma inscrição); **tocha acendível** que se apaga em ~40 s; **braseiro que sobe** de rachaduras **frias** (o sinal das constelações); **nicho da gema** (laje que desce; E/AGIR pega a gema; conta em `Room.bonus`).
- `rooms/shell.ts`: o casco de uma sala retangular escrita à mão (chão, paredes, porta, colunas, colisão) e o `shotGate` ("um arremesso, um toque": depois que o dado toca uma lousa, ele não acende outra coisa até voltar à mão).
- `rooms/fire.ts` ganhou: **panos** (`cloths`: tecido com as palavras bordadas e BOATO embaixo, sobre uma palavra talhada ou sobre pedra lisa; o Fogo queima de baixo para cima em ~2 s e mostra a pedra; voltam quando o jogador sai da sala), **frases já acesas** (`preLit`), **a Casa julga na frase da porta** (`lock.judge: 'door'`: acender/apagar frases não pune; tocar numa frase acesa a apaga), tábuas em qualquer altura (`y`), brilho de qualquer marca de pedestal (GRANDE) e de PEQUENO (o braseiro de menor `scale`), `torches: 'few'` (salas de constelação) e o gancho `extra` (peças a mais: lousa animada da Casa, tochas, frisos, nicho).
- O som do fogo que corre (`ctx.sfx('spread')`) não dispara a cena do dado queimando.
- As chamas dos braseiros nascem já com a textura (antes, uma chama acesa no mesmo quadro em que o braseiro era atualizado aparecia como um quadrado branco).
- `?intro=0` + `__mdd.goto(i)` levam direto a cada sala; ganchos de teste `__lousa()`, `__fio()`, `__fires['A Casa Escreve']()`.
Formas: A Lousa é pequena e baixa (grade de ferro na entrada, nicho alto com o 4º braseiro sobre o arco da entrada, dado de pedra meio enterrado); O Fio de Fogo tem **balcão a 3 m** (sobe-se pela escada da esquerda e desce-se pela da direita; as salas continuam com entrada e porta no chão, porque o motor liga as salas em fila no mesmo nível); A Casa Escreve é um salão de 9 colunas (um pouco fora do centro, para a lousa sobre a porta aparecer entre elas); O Pano é uma capela alta (7 m) com panos no alto e frisos no teto.
**Ficou de fora por ora:** o diário achado das câmaras secretas (a gema já vem; o texto fica para quando houver os diários de vocabulário), a fumaça e o pano-parede da Chama Curta (S3), o escuro fosforescente (S5) e o lema «DIZER IGUAL FAZER» (o segredo S10 do Fio de Fogo já funciona, mas só se entende com esse diário).

## 39. O rosto do dado mais vivo (implementado; completa a §23)
Pedido do Pedro: o rosto não precisa mostrar sentimentos, mas tem de **se mexer** e olhar em volta. Em `dielife.ts`, os olhos ganharam vida própria por cima do olhar do dado:
- **sacadas**: a cada 0,3–1,2 s o olho dá um saltinho em volta do ponto que olha (olho vivo nunca fica parado);
- **olhadelas**: a cada ~1,4–3,8 s ele olha de relance para outro lado (cima, lado, baixo) por 0,3–0,85 s e volta, **mesmo quando há algo interessante à frente**;
- o vaguear sem alvo ficou mais frequente e mais largo, às vezes com uma "segunda olhada" (um lado, logo o outro);
- os olhos andam numa **mola rápida** (andam depressa e param), o dado inteiro vira devagar; com o rosto à vista, ainda se inclina um pouco para onde olha (a cabeça acompanha os olhos);
- **piscar** a cada 2–6 s, às vezes duas vezes seguidas.
No desenho (`textures.ts`, `tracos`): a íris anda até 4 px para os lados dentro das pálpebras, e o rosto inteiro (pálpebras, nariz, boca, sobrancelhas) acompanha até 3 px para os lados e 2 px para cima e para baixo, então se vê o rosto "virar". Continua a mesma afeição neutra em todos os números.

## 40. O diário mais bonito (implementado; completa a §34)
- **Capa** (`src/book/bookart.ts`, maior que as outras texturas: 104×140): couro vinho com manchas, poros e arranhões, mais claro e gasto nas beiradas; vinco do lombo; **duas molduras gravadas a seco** (sulco escuro com o brilho do couro embaixo) e um fio de ouro pontilhado entre elas; **florões** dourados nos cantos; uma **placa afundada com os glifos de LEMBRAR** em ouro; o **emblema**: um sol de raios curtos, um anel e a **face CINCO do dado** em ouro com brilho; **cantoneiras de latão** com rebites nas pontas de fora.
- **No 3D** (`book3d.ts`): cantoneiras de latão de verdade (dobram sobre a beirada da capa), **lombada redonda** com nervuras e ouro (meia-cana atrás do dobra quando aberto; vira a lateral redonda que une as capas quando fechado), **cabeceado** listrado, **duas fitas marcadoras** (vermelha e verde) com a ponta em V, e uma **presilha** de couro com fivela de latão solta na beirada da capa de trás. As beiradas das folhas e o couro ganharam textura nova.
- **Páginas** (`pages.ts`): papel mais velho (fibras, manchas de umidade, pintas de mofo, beirada gasta e irregular, sombra do lombo suave); cada folha tem, ou não, uma **marca de uso** (anel de caneca, borrão de tinta com respingos, um dadinho ou uma chaminha rabiscados na margem), sempre fora do texto; **moldura** com filete pontilhado por dentro, **volutas nos cantos** e um losango no meio de cima e de baixo (também no mapa); títulos com **fio que afina nas pontas** e losango; número da página entre travessões.
- **Avesso da capa**: papel **marmorizado** (vinho, azul e veios de ouro velho) com a dobra do couro por cima e a **etiqueta do dono** colada (DIÁRIO, o dado, "O que eu vi. O que eu acho.").
- **Índice** com ícones desenhados à pena (triângulo, dado, pergaminho, mapa com X, pena); **símbolos** em cartõezinhos colados (com sombra); **faces** viram **dadinhos com os pontos** (selada = tracejado com "?").
