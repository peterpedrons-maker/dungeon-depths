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
(VOCÊ · CONDENADO · BOATO, sem tradução); último pensamento; olhos descem e o jogo começa. O poço
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
- **Soquete com brasa** (hoje uma **prateleirinha**, §53): no começo de cada frase acendível há um soquete de pedra com uma **brasa fraca pulsando**. É o símbolo fixo do jogo para "isto pode ser aceso". A brasa some quando a frase acende (ou quando os pilares sobem).
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

## 28. Recomeçar o jogo do zero (substituído pelos espaços de jogo, §45)
*(Histórico: saiu com a interface de lançamento; hoje um jogo novo se começa em Novo jogo, num dos três espaços, e apagar um jogo é na tela de espaços.)* Botão **ⓘ** (canto) > **Recomeçar o jogo do zero** > confirmação ("Sim, apagar tudo e recomeçar"). Apaga **todas** as chaves `mdd-*` do aparelho (progresso, diário com símbolos, notas, mapa e carimbos, ajudas do dado já vistas), **menos a preferência de som** (`mdd-audio`), e recarrega a página sem parâmetros: o jogo recomeça com a **cena de acordar**, sem dado nem giz. Antes de apagar, desliga a gravação (`progress.noSave`, `diary.noSave`) para nada ser regravado. O botão "Jogar de novo" do fim da demonstração continua só reiniciando a sala 1.

## 29. A abertura revista: o dado cai do poço (implementado; os passos 1 a 3 foram substituídos pela §32: agora é o Escrivão quem joga o dado)
O dado **não está mais no chão ao acordar**. Sequência (tudo em glifos e bem curto):
1. **Porta trancada** ("E · Tentar abrir"): o jogador pensa "Trancada…" e, na hora, **um barulho lá em cima** (duas batidas no poço); a **câmera vira para o buraco** (jogador parado, `freeze`).
2. **O dado despenca** pelo poço (`ctx.dropDie`, física do dado), bate no chão e para; **a câmera o acompanha na queda** (do buraco até o chão). Marco `caiu` guardado: se o jogador recarregar, o dado já está no chão.
3. Depois de parar: pensamento "Caiu alguma coisa. Um dado… e ele brilha." e o dado fala (`EU CAIR`, `VOCÊ AJUDAR EU ?`). **O jogador toma o controle** enquanto o dado **pulsa e murmura** (`AJUDAR EU`, `VOCÊ VIR`, `EU ESPERAR`, a cada ~9 s).
4. **"Pegar o dado" (E/AGIR)**: o dado voa para a mão e vem para o **centro da tela, maior, de frente** (faixas de cinema, `ctx.dieCenter`, olhos do jogador sobem do chão; o rosto aparece) e **explica**, uma frase por vez: `VOCÊ CONDENADO BOATO` · `EU AJUDAR VOCÊ` · `ACENDER BRASEIRO` (+ desenho do braseiro). Depois volta para a mão e o jogador retoma o controle; a comemoração do 1º braseiro (§27) continua igual.
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
- **Avesso da capa**: papel **vinho escuro e liso** com um padrão miúdo e apagado de losangos e pontinhos dourados (o marmorizado colorido ficou estranho e saiu), a dobra do couro por cima e a **etiqueta do dono** colada (DIÁRIO, o dado, "O que eu vi. O que eu acho.").
- **Lombada sem vão**: em vez de um cilindro solto, é uma faixa curva refeita a cada quadro, presa nas beiradas das duas capas (aberto, some atrás do dobra; fechado, é a lateral redonda). E a capa agora **gira pela frente** ao abrir, como num livro de verdade (antes passava por trás). O avesso da lombada (que aparece no vão quando a capa está em pé) é couro escuro e liso.
- **Nada passa por dentro de nada**: `tools/check_book_overlap.mjs` gira a capa de fechado a aberto (200 passos) e confere que nenhum ponto da capa, do miolo ou da lombada entra em outra peça, e que a folha que vira nunca desce para dentro das páginas de baixo. (Ela descia: no começo da virada a ponta da folha afundava no papel; o ângulo de cada faixa da folha agora fica entre 0 e 180°.)
- **Índice** com ícones desenhados à pena (triângulo, dado, pergaminho, mapa com X, pena); **símbolos** em cartõezinhos colados (com sombra); **faces** viram **dadinhos com os pontos** (selada = tracejado com "?").

## 41. Segunda leva da sessão de projeto de puzzles: o caderno achado, a Chama Curta com pavio, a Confirma em duas partes e o 1º respiro (implementado)
Trazido da branch `claude/puzzles-design` (`PUZZLES_PROPOSTAS.md` atualizado; verificadores novos `tools/verify_chama_curta.mjs`, `verify_confirma.mjs`, `verify_vocabulario.mjs`, `verify_ponte.mjs`). Ordem do capítulo hoje: 1 O Poço · 2 O Vestíbulo (+ o caderno) · 3 A Lousa · 4 O Fio de Fogo · **5 Os Nichos e a Cisterna (respiro R1)** · 6 A Casa Escreve · **7 A Chama Curta (nova)** · **8 O Que a Casa Confirma (nova)** · 9 O Pano · 10 Os Apelidos · 11 O Boato Verdadeiro · 12 O Tribunal.
- **O caderno achado (sala 2).** O jogador começa **sem diário**: o botão some e os avisos "avistado" não aparecem, mas os símbolos vistos ficam guardados em silêncio. No Vestíbulo, junto da base da coluna esquerda, um caderno caído no escuro é revelado quando o 1º braseiro acende; o dado fala («VOCÊ VER LIVRO», «VOCÊ PEGAR LIVRO», com rabiscos novos de livro e de mão pegando em `sketch.ts`); "E · Pegar o caderno"; o dado diz «VOCÊ ESCREVER LIVRO», «VOCÊ ABRIR LIVRO»; **o botão do diário aparece pela 1ª vez pulsando em dourado e a tela escurece** (`ui.bookCall`, `.book-call`); se o jogador demora 8 s, o dado repete. Ao abrir, **modo guiado** (`ui.guided`): o livro vira sozinho até BRASEIRO, o campo de anotação pisca e o livro **não fecha antes de o jogador escrever alguma coisa** (o diário não corrige); fechando, o dado diz «EU SENTIR ALEGRIA». A porta da sala 2 só abre depois de pegar o caderno. Marco novo `caderno` (quem já tinha passado da sala 2 em jogos salvos antigos ganha o caderno sozinho). `?demo` e `?lab` continuam com o diário.
- **O caderno é DELA** ("a que veio antes", `story/herpages.ts`): as **anotações dela** em tinta **sépia**, que o jogador não apaga (ACENDER: "acho que é acender"; BRASEIRO: um "?" e um braseiro torto desenhado); **desgaste** em cada folha (só visual e nunca parecido com glifo: borda chamuscada, canto dobrado, fuligem, dedo sujo, rabiscos a lápis de espiral, onda, pedra, mão, uma "palavra" riscada); a seção **"Páginas dela"** (no índice): a última página que ela escreveu (para no meio da frase) e, depois, as **folhas arrancadas**: enquanto não são achadas, são buracos (só o toco rasgado junto do lombo); achadas, voltam presas com fita. Três estão no jogo: p1 (nicho dos dados, R1), p2 (câmara lateral do pátio, R1), p3 (junto da grade da Confirma).
- **A Chama Curta nova** (`rooms/chamaCurta.ts`): antecâmara com portão de grade que só fica aberto enquanto a chama pequena arde; a galeria com grande/médio/dois mínimos; **dois labirintos talhados** no chão (`makeFuse` em `firegrid.ts`: uma canaleta longa e enrolada com chevrons, por onde a brasa anda visível). O do médio é o **pavio** (6,5 s até o mínimo do fundo); o do grande corre ao contrário. Substitui `FIRE_TEMPO` (fica em `fireRooms.ts`, fora da lista).
- **O Que a Casa Confirma em duas partes** (`FIRE_CONFIRMA` em `rooms/chapter1.ts`): uma lousa sob «ACENDER QUATRO CONFIRMADO» e «ACENDER TRÊS BOATO» (QUATRO abre a grade e acende CONFIRMADO; TRÊS apaga a lousa e faz BOATO piscar), uma folha dela junto da grade, e depois 5 frases (3 confirmadas) e 4 pilares: 2, 4, 1, 3. Substitui `FIRE_FRASES`.
- **O 1º respiro (R1)** (`rooms/respiro1.ts`): o corredor é feito de **células de 2 m** (paredes, chão, teto e colisão saem sozinhos da lista de células), com nichos e velas, «ACENDER BRASEIRO» sobre os nichos (uma com a pedra caída), os dados talhados 1-2-3-(vazio)-5 e a lousa do QUATRO, o mural ANTES · AGORA · DEPOIS, a janela de grade com o **Escrivão passando ao longe** (o mesmo modelo da abertura), a tapeçaria-semente; o **pátio** com teto a 10 m e o buraco de luz, as galerias nos dois lados (rampas no sul), a câmara lateral no alto, o relevo «CONTÁVEIS ACENDER BRASEIRO» e a **cisterna** com o puzzle do reflexo (cada braseiro aceso aparece espelhado na água). Sem trava na porta.
- **Ficou de fora:** queimar a tapeçaria-semente (depois da sala do Pano), o **atalho** de volta para o balcão da sala 4 (o mundo ainda é uma fila; a volta é pelo próprio corredor), as folhas p4 a p7 (buracos no caderno, ainda sem lugar no jogo) e o "contexto no diário" (§2c: guardar a frase inteira onde cada glifo apareceu).

## 42. Terceira leva da sessão de projeto de puzzles: as perguntas do dado, a Ponte de Madeira, os Banhos Secos e duas revisões (implementado)

Fonte: `PUZZLES_PROPOSTAS.md` (branch `claude/puzzles-design`) §2e, §2b (R2) e §5 (salas 8, 9 e 10). Soluções em `PUZZLES.md`.

**As perguntas do dado** (`src/story/quiz.ts`, `src/ui/QuizPanel.tsx`, `quizTick` em `scene.ts`):
- Para que serve: confirmar, de tempos em tempos, se o jogador entendeu uma palavra. É o único lugar do jogo onde alguém diz se ele acertou (o diário continua sem corrigir).
- A cena: o dado **treme** na mão (~1 s; as gemas piscam; quem anda é freado devagar), **vem grande ao centro** (a cena de cinema do dado, com faixas), o **glifo** aparece ao lado dele, escrito traço a traço, e o balão pergunta «VOCÊ SABER ?» (fica à vista até a resposta: `chatter.say(..., hold)`). Embaixo, **5 opções** em português: 4 significados embaralhados e "não sei" (toque/clique ou teclas 1 a 5; o mouse é solto como no diário).
- Certo: o dado pula e balança, e a marca **CONFIRMADO** aparece no lugar do glifo, brilhando. Errado: abaixa a cabeça, sem glifo e sem punição. "Não sei": «EU ESPERAR».
- A escolha é **acrescentada** à anotação do glifo no diário (numa linha nova, nunca apagando); "não sei" não escreve nada.
- Uma pergunta que não foi acertada **só volta depois de o jogador LER a palavra de novo** numa inscrição (gancho em `readInscriptions`), em qualquer momento calmo, no máximo 3 vezes. Guardado em `mdd-quiz-v1`.
- Quando: só com o caderno, o dado na mão, nada na tela, pés no chão; no **corredor depois de uma sala** (`when.at = 'after'`) ou na **chegada a uma área livre** (`Room.calm(x, z)`). E só se o glifo já foi avistado.
- As 10 do capítulo 1 estão em `QUIZ`. Oito têm lugar no jogo de hoje (a 5ª e a 8ª, que a proposta põe na Biblioteca e na Galeria dos Condenados, ficam por enquanto no corredor depois do Pano e do Boato Verdadeiro); a 9ª e a 10ª esperam a Escadaria e a sala 17.
- **Apontar e fazer** (`src/scene/pointask.ts`), mais leve, sem tela cheia: numa área livre, o dado se inclina para uma frase, a lê (o balão repete) e pergunta «X ONDE ?». O jogador mira na coisa e aperta E/AGIR (`ctx.aim()`). Errou: o dado treme; na 2ª vez ele **se inclina para a coisa certa** (`ctx.dieLook`). Depois pode pedir para FAZER («VOCÊ ACENDER BRASEIRO ?») e comemora quando o jogador faz. Hoje: «BRASEIRO ONDE ?» no pátio da cisterna e «DADO ONDE ?» nos Banhos Secos. Ensina ONDE e a marca PERGUNTA.

**Salas em alturas diferentes** (motor): `Room.entranceY` (a entrada fica acima do chão da sala) e `Room.exitDy` (a porta de saída fica noutro nível); a sala seguinte começa no nível da porta. `groundY(x, z, pés)` recebe os pés do jogador, para salas com pisos um por cima do outro. `makeBrazier` e `makeRiser` aceitam uma altura de base; `makeTorch` pode ficar de pé; `FireGrid.cut` corta uma canaleta; `makeCloth` (pano solto que queima); `wedge` (prismas inclinados: rampas, corrimãos).

**A Ponte de Madeira** (`rooms/ponte.ts`, nível 6, com a constelação C3): o **fosso**. Entra-se pela boca, lá em cima; uma rampa em espiral (uma volta, 8 m) desce até 9 braseiros em grade. Uma canaleta passa por baixo de uma calha de madeira que leva outra por cima: o fogo de baixo queima a madeira e corta o caminho de cima, então **a ordem das ignições muda o desenho**. Os gradis são vazados de propósito: o jogador vê a grade de vários ângulos enquanto desce. C3 é a constelação de perspectiva: a pista é o que FALTA no desenho resolvido (os quatro cantos).

**Os Banhos Secos** (`rooms/respiro2.ts`, o 2º respiro): salão mais baixo que a entrada, escadaria larga, três piscinas vazias em profundidades diferentes, fonte seca, câmaras de banho. Sem trava. Estelas com relevo, um puzzle opcional de reprise das marcas (exatamente DOIS), a folha nº 3 dela e a semente do estandarte (pano queima).

**Revisões:** a sala do Pano ganhou a **demonstração na entrada** (o trapo que pega fogo sozinho e mostra BRASEIRO talhado: epifania guiada, sem punição); Os Apelidos virou **rotunda** (`rooms/apelidos.ts`; o GRANDE no centro, os outros em cruz, as frases em placas na parede curva), com a mesma regra e a mesma solução. A versão retangular (`FIRE_APELIDOS`) fica em reserva.

**O que NÃO entrou e por quê:** os atalhos dos respiros (o mundo ainda é uma fila de salas); a câmara secreta atrás do estandarte é um nicho, não uma sala; o "fazer" da Sala de Aula e os "apontar" do Museu dos Nomes dependem da Biblioteca, que não existe.

## 43. Acabamento dos gráficos: alvenaria sem esticar, escadas de verdade, luz que define as formas (implementado; o desenho das salas não mudou)

Pedido do Pedro: melhorar texturas, gráficos e a definição dos elementos 3D **sem alterar o design** (o exemplo era a escada da sala 4, com
a "parede estranha"). Nada de posição, tamanho, regra ou caminho mudou; só como as coisas são desenhadas.
- **O defeito principal:** toda caixa (`kit.box`) mostrava a textura INTEIRA em cada face, então um pilar de 7 m tinha tijolos de 2 m, um
  degrau tinha tijolos de 3 cm e o balcão da sala 4 era uma mancha esticada. Agora `kit.box` dá UV **em metros** (1 ladrilho = 1,2 m, a
  partir da posição na sala) sempre que o material repete sem escala própria (`worldBoxUV`); os pilares de todas as salas passaram a usar
  esse material. Caixas vizinhas continuam o mesmo aparelho de tijolos.
- **Texturas de alvenaria com o dobro de detalhe** (64 px por ladrilho em vez de 32; `textures.ts`): cada tijolo tem quina iluminada em cima
  e sombra embaixo, face levemente abaulada, grão, poros, cantos lascados, rachaduras e manchas de umidade contínuas entre tijolos; a
  argamassa tem areia. O piso tem lajes com quinas gastas, meio pisoteado e rachaduras. De longe o mipmap as reduz e o visual é o mesmo.
- **Pedra lavrada** (`slabTexture`, `kit.slab`): lajes lisas e mais claras para pisos de degrau, capas de mureta, cornijas e peitoris; é ela
  que faz uma escada "se ler" de longe.
- **Escadas** (`shell.ts`: `stairs` e `slopedWall`): cada degrau é um bloco de alvenaria com um piso de pedra lavrada saliente na frente; a
  mureta acompanha a inclinação e tem capa (antes era uma caixa reta do chão até acima do balcão, a tal parede estranha). Usadas na sala 4
  (com pilastras de arremate e cornija na borda do balcão, que agora tem piso por cima e alvenaria nos lados), no pátio da cisterna e na
  escadaria dos Banhos Secos.
- **Regra do pé da escada:** o 1º degrau fica a **2 m ou mais** de qualquer parede, virado para um espaço livre, e nada (pilastra, braseiro,
  tocha) estreita o caminho até ele. Duas escadas quebravam a regra e foram refeitas: a da **sala 4** começava a 0,8 m da parede da entrada,
  com a pilastra deixando uns 5 cm de folga, e agora sobe **encostada na frente do balcão** (`stairsX`, 1,9 m de largura), do meio da sala para
  a esquerda, até um patamar no canto; as das **galerias do pátio da cisterna** começavam a 0,5 m da parede do fundo, com o braseiro do canto
  na frente, e agora começam a 2,5 m (galerias de 6 m em vez de 8; os braseiros do fundo foram para perto da porta, em x = ±2,8).
- **Luz** (`scene.ts`, `shapeLight`): a luz ambiente de cada sala (a mesma cor e força de sempre) é repartida em ambiente menor + luz de cima
  (hemisférica: o que olha para cima é mais claro, o avesso das coisas mais escuro) + uma luz fraca de lado. Pisos, espelhos de degrau e as
  duas paredes de um canto deixam de ter o mesmo tom: as formas se separam sem precisar de mais contorno.
- Corrigido de passagem: na Ponte de Madeira, a tocha da C3 do lado da entrada ficava bem na frente dos olhos de quem chega ao patamar (uma
  faixa marrom tapava a vista do fosso); foi para a ponta direita do gradil do patamar (a solução da C3 não muda).

## 44. Direção de arte, primeira leva (implementado; `DIRECAO_DE_ARTE.md`, da branch `claude/puzzles-design`)

Seguindo a ordem da §7 do documento de direção de arte. Capturas de antes em `docs/arte/`.

**Mão e dado (§4.9):** experimentei uma mão em pixel segurando um dado ~40% menor; o Pedro achou que ficou ruim e ela **saiu**: o dado da mão voltou ao tamanho e à posição de antes. Ficou só o giz fora do capítulo 1 (nem em saves antigos; só na sala de teste).

**Interface (§4.11):** uma fonte só, **a do diário**, em todo texto: `tools/build_font.mjs` gera `public/fonts/mdd-pixel.otf` a partir da
tabela de `src/book/font.ts` (cada pixel vira um quadrado; os acentos são os mesmos). Os tamanhos são múltiplos de 10 px (`--fs/--fm/--fl`,
escolhidos em `ui/scale.ts`) para a letra cair em pixels inteiros. **Ícones desenhados à mão** (`src/ui/PixelIcon.tsx`, grades de 12×12 em
texto) no lugar dos símbolos do navegador, com moldura de pedra nos botões do canto. A dica de controles ficou em duas linhas.

**Poeira e sombra (§4.2, §4.8):** saiu a poeira uniforme de todas as salas; `kit.beamDust` põe grãos **só dentro de feixes de luz** (o poço da
sala 1, o buraco do pátio da cisterna, a chama do nicho alto da sala 3). Os braseiros acesos soltam **brasas** que sobem e acendem uma **poça
de luz** no chão. A sombra de contato (`kit.contact`) virou um disco **pontilhado** (Bayer), e está em colunas, pedras, estelas e no **dado
pousado** (que tem a sua, maior e mais fraca quanto mais alto ele está).

**Quadro de estilo: a sala 3 (§6).** "Um corredor baixo onde alguém ensinava a contar." Nada do puzzle mudou.
- **Arquitetura:** abóbada de berço baixa com arcos de reforço e imposta (`shell.vault`), colunas com plinto, toro, colarinho e ábaco
  (`shell.pillar`, vale para todas as salas que usam o casco), batentes grossos com impostas e soleira na entrada e na porta (`kit.batente`),
  um nicho na parede esquerda (`kit.niche`).
- **Materiais:** tijolo nas paredes e na abóbada, lajes no chão, **pedra lavrada** nos arcos, colunas, batentes e na moldura das lousas.
- **Luz:** a chama do nicho alto é a **luz principal com sombra de verdade** (um `SpotLight`, mapa de 512, filtro duro; `Room.shadowLight`;
  o motor só atualiza o mapa de sombra nessa sala). O jogador tem um **corpo invisível que projeta sombra**: quem entra vê a própria sombra
  jogada para a frente, a pista de que há um braseiro atrás dele. Poças de luz, ambiente mais escuro ("escuro de verdade" entre as luzes).
- **Decalques (cada um com um porquê):** fuligem acima dos quatro braseiros e das tochas (`kit.soot`), o caminho gasto da entrada à porta
  (`kit.wear`), os **riscos de giz** de um condenado contando 23 dias, baixos, ao lado da 1ª lousa (contagem, não escrita).
- **Objetos:** uma tigela e um toco de vela apagado no nicho; o dado de pedra meio enterrado com lascas de laje em volta.
- **Partículas:** brasas nos braseiros; poeira só no feixe da chama alta.

Regras que saem da sala 3 para as outras (atualizar `DIRECAO_DE_ARTE.md` quando passarem pela lista da §5): uma luz com sombra por sala, no
ponto que o puzzle quer mostrar; pedra lavrada em tudo que é "feito" (arcos, colunas, batentes, molduras de escrita); fuligem acima de toda
chama; poeira só em feixes; nada flutua sem sombra de contato.

**A presilha do diário** (`book3d.ts`): era uma tira solta que só aparecia com o livro aberto. Agora é uma presilha de verdade: costurada na
capa de trás, dá a volta na borda das folhas e, por cima da capa da frente, a fivela de latão prende num pino. Ao abrir o diário, o livro
sobe fechado, a fivela solta do pino com um clique e a aba se afasta; só então a capa abre. Ao guardar, a capa fecha, a aba volta e prende
(outro clique) e o livro desce. A abertura ficou um pouco mais longa (1,15 s; fechar, 0,85 s) para caber esse tempo.


## 45. Interface de lançamento, passos 1 a 3 (implementado; `INTERFACE.md`, da branch `claude/puzzles-design`)

**1. Espaços de jogo e salvamento automático** (`src/story/save.ts`). Três espaços; cada um guarda, com o prefixo `mdd-slotN-`, o progresso
(marcos), o diário (anotações, carimbos, mapa à mão, folhas), as perguntas do dado, os desenhos do dado já mostrados e um **resumo** (`meta`):
a sala, a posição e o rumo, se a sala já estava resolvida, as salas com a gema achada, o tempo de jogo, o capítulo, a data e uma **miniatura**
(192 × 108, copiada do próprio canvas logo depois de um quadro). O espaço ativo fica em `mdd-slot`; trocar de espaço recarrega a página (as
lojas leem o espaço ao carregar). Os saves antigos (`mdd-progress-v1` etc.) vão para o espaço 1. **Salva sozinho** ao entrar numa sala, quando
uma porta abre ou uma gema aparece (puzzle resolvido), ao fechar o diário, ao pausar e ao esconder/fechar a página (sem miniatura). Um
**dadinho girando** no canto de cima, por ~1 s, diz que salvou. Ao continuar, as salas antes da salva ficam **resolvidas** (`Room.skip()`, novo
em `types.ts`; os respiros não têm trava), a sala da salva também se já estava resolvida, e o jogador volta ao ponto salvo (se ali ainda há
chão; senão, ao começo da sala). Não salva durante a cena de acordar, nas pré-visualizações (`?demo`, `?lab`) nem com `?intro=0` (testes).
*Limite conhecido:* os segredos de cada sala (a gema acesa, as folhas achadas) não voltam acesos ao recarregar; as gemas contam pelo resumo.

**2. Tela inicial, pausa e configurações** (`src/ui/Menus.tsx`, `menus.css`). A **tela inicial** é o poço visto de baixo, com a luz lá em cima
(a câmera fica na sala 1, olhando para cima; o dado some da mão), o logo **provisório** «SENTENÇ» + o triângulo ACENDER no lugar do último A
(o logo definitivo é o passo 6) e as plaquinhas: Continuar (o último espaço usado), Novo jogo (escolhe o espaço; se ocupado, confirma), Carregar
(as três tábuas com miniatura, sala, capítulo, tempo, gemas e data; **Apagar** com confirmação dupla), Configurações e Créditos. "Sair" não
aparece na web. A **pausa** abre com Esc, quando o mouse é solto no meio do jogo ou no botão do celular; o mundo **pára** (o fogo, o tempo, o
dado) e o jogo salva: Continuar · Diário · Configurações · **Reiniciar a sala** (era o botão ↺ do canto; reinicia só a sala, não o jogo) ·
Voltar à tela inicial (salva antes, com confirmação). As **configurações** valem para o aparelho (`src/story/config.ts`, `mdd-config-v1`):
- Áudio: volume geral, música e efeitos (o antigo ♫/♪/∅ vira os volumes na 1ª vez).
- Imagem: janela/tela cheia, qualidade (baixa = sem brilho nem sombra; média = sem sombra; alta = tudo), tamanho do pixel (fino ~270 linhas,
  médio ~200, grosso ~150), brilho, campo de visão, limitar quadros (30/60).
- Controles: sensibilidade do mouse e do toque, inverter o eixo Y, vibração (celular, no erro) e **remapear as teclas** (andar, correr, agir,
  posicionar, diário, reiniciar; a tecla que já era de outra ação troca de lugar; o motor continua lendo as teclas padrão e `config.translate`
  converte).
- Acessibilidade: tamanho da interface (80 a 160%, multiplica o `--ui`), velocidade da escrita dos glifos, reduzir tremores e clarões (o dado
  da pergunta treme menos, as gemas não piscam, o brilho cai), reduzir o movimento da câmera (sem balanço da cabeça nem o campo de visão abrindo
  ao correr), alto contraste nos glifos (a cal brilha mais) e mira sempre visível (desligada, ela só aparece, como um anel, quando há algo a fazer).
- Idioma: português (inglês marcado "em breve").
O visual segue o `DIRECAO_DE_ARTE.md`: tábuas de ardósia com borda talhada e cantos lascados, plaquinhas com a quina de cima clara e a de baixo
escura, ouro só no item escolhido (com os dois pontinhos dos glifos dos lados), a fonte do diário em tudo; navega com setas, Enter e Esc.

**3. Fora os botões do canto e os emojis.** Saíram o som (♫/♪/∅), o ↺ (agora na pausa), o ⓘ com "Recomeçar o jogo do zero" (os créditos estão
na tela inicial e no fim; recomeçar deixou de existir), o ⤓ de instalar e a tela cheia (aba Imagem). No PC não há nada fixo na tela; o botão do
diário só aparece no momento em que o caderno é achado (a tela escurece e ele pulsa) e depois o diário abre com J ou pela pausa. No celular fica
só o botão de pausa (e o do diário, depois do caderno). O ▼ da caixa de conversa virou um triângulo de ouro desenhado; o ✦ do fim saiu.
*Ainda não feito (passos 4 a 6 do `INTERFACE.md` e partes do 2):* controle (gamepad) e seus botões, tamanho/posição dos botões de toque, as caixas
de texto novas, os ícones definitivos em 16×16/24×24 com a tecla no aviso de ação, o logo e o ícone do app.


## 46. Interface de lançamento, passos 4 a 6 e a tela inicial do dado caído (implementado; `INTERFACE.md` revisado, da branch `claude/puzzles-design`)

**A tela inicial (§3.1).** É a sala 1, o Poço, no instante em que o dado caiu. O dado (o do HUD, que tem o rosto e a vida de `dielife.ts`) fica
**deitado de lado no chão de verdade da sala 1**, no ponto em que ele cai na abertura (`dieLie`), no meio do entulho da própria sala: o dado da mão
é posto nesse ponto, no tamanho de um dado de verdade, e desenhado **com a câmera do mundo** (`dieInWorld`, `titlePose`), então tem a perspectiva
e a profundidade da sala; continua na camada dele (luz própria, que gira junto com a câmera, nítido, sem o bloom da sala) e tem sombra no chão da sala. Nada é refeito à parte (o entulho falso do HUD saiu a pedido do Pedro). A câmera fica quase no chão
(18 cm, de quem acordou deitado), à esquerda do dado, e é apontada para o dado cair um pouco à direita do centro (no celular, um pouco mais longe).
O dado fica **reto no chão**, apoiado numa face e um pouco girado (aparece a lateral; o rosto vira para o lado do menu), sem a inclinação de antes. O desfoque é uma **profundidade de campo de verdade e leve** (`uBlur` 0,9 + `uFocus`): o chão e o entulho em volta do dado ficam nítidos, o que
está mais longe ou bem perto da câmera fica um pouco borrado, sem achatar a sala (o Pedro achou que o fundo muito borrado parecia 2D). Atrás do dado, o cone de luz do poço com a poeira. No jogo novo, a câmera sobe de fato pelo poço até o
branco. A câmera fica baixa e "respira" 1,5 cm; a luz respira (o brilho sobe e desce 3%). O **olho** segue o mouse no PC; com o
teclado, olha para a opção marcada; no celular, para onde o dedo tocou e depois volta a vaguear; pisca; **cochila** depois de 30 s sem ninguém
mexer (`LifeInput.sleepAfter`) e acorda num pulo; dá um **pulinho** quando a opção marcada é "Novo jogo" (e fica **abatido** em "Sair", que só
existe fora da web). **Transições sem tela de carregamento:** *Novo jogo*: o dado pisca devagar, a câmera **sobe pelo feixe** (o entulho e o dado
ficam para baixo) até o **branco**; a página recarrega já no jogo novo e o branco vira o preto da cena de acordar. *Continuar* (no mesmo espaço):
o dado dá um **pulinho para fora do quadro** e a imagem se desfaz **em pontilhado** (a ordem de Bayer do próprio dithering; `uDis` + uma cópia do
último quadro, `rtSnap`) para o lugar salvo. *Outro espaço*: o mesmo pulinho, o pontilhado vai para o preto, recarrega e volta do preto em
pontilhado. *Créditos*: os nomes sobem devagar à esquerda enquanto a câmera **gira em volta do dado**. *Depois do capítulo 1* (marco `cap1`, posto
no fim da demonstração): o fundo passa a ser o último lugar salvo.

**Passo 4, caixas de texto (§5).** As molduras de pedra são uma imagem de 24 × 24 em **9 pedaços** (`border-image`, borda de 8 pixels, cantos
lascados, quina de cima clara e de baixo escura), geradas pixel a pixel por `tools/build_frames.py` (`src/ui/frames.css`); o tamanho do pixel na
tela é `--px` (`ui/scale.ts`). O **mundo** fala numa tábua de pedra com a placa do nome embutida; a do **Escrivão** tem a moldura de **ouro** do
manto. O **pensamento** do jogador é uma **tira de papel** rasgada nas pontas, com a tinta do diário (os parênteses de antes saíram: o papel já diz
que é pensamento). A **pergunta do dado**: o glifo numa tábua de pedra e **5 plaquinhas de pedra**; "não sei" numa plaquinha lisa, sem talho. Os
**avisos** (avistado, gema) e o dadinho de salvar ficam numa plaquinha pequena de pedra no canto de cima. O balão do dado continua como era.

**Passo 5, ícones (§6).** Todos redesenhados pixel a pixel em `tools/build_icons.py` (gera `src/ui/icons.ts`): **16 × 16** no HUD e **24 × 24**
nos menus, traço de ouro de 1 pixel, pintado só no que se coleta (gema, página), só ouro e brasa além da pedra. Seguindo a revisão da folha:
pegar = a mão com ponto; abrir = porta em ARCO entreaberta (não as duas barras); ler/olhar = olho em AMÊNDOA (não o losango); arremessar = arco com
seta curva; posicionar = o dadinho descendo numa curva até um chão ondulado; girar = setas curvas em volta de um ponto; desenhar = toco de giz
deixando uma linha ondulada (não a diagonal solta); apagar = mancha pontilhada com o giz deitado (não o X); diário = livro só em traço; fechar = uma
tampa de pedra descendo; confirmar = ✓ assimétrico de braço esquerdo curto e curvo; voltar = arco curvo para a esquerda; configurações = engrenagem
de pontos e um anel; abas: sino (áudio), janela em arco com sol e morro (imagem), controle de mão (controles), pessoa de braços abertos
(acessibilidade), balão de fala com escrita ondulada (idioma). **Pausa = uma ampulheta** de bulbos redondos: as duas barras do símbolo de pausa
comum são a palavra ABRIR. O **dado** é desenhado em perspectiva, sem pontos (pontos numa face são os números da língua), e os dadinhos dos ícones
de ação são pintados, sem o ponto no meio (um quadrado com ponto no meio é UM). O **aviso de ação** agora é uma plaquinha de pedra embaixo, perto do
centro: a **tecla** (de pedra, a letra na fonte do jogo, a que estiver configurada) + o **ícone da ação** (pelo verbo: pegar, abrir, ler, agir) +
o texto; no celular, sem a tecla. A mira vira um pequeno anel de ouro quando há algo a fazer.

**Passo 6, logo e ícone do app (§7).** `tools/build_logo.py` desenha o logo «SENTENÇA» numa grade de 11 linhas, hastes de 2 pixels, o **Ç com a
cedilha desenhada à mão**, e o último A é o **glifo ACENDER de verdade**: três linhas da grossura das hastes ligando um ponto em cada vértice, a
**brasa** no de cima, nada dentro nem solto. A tela inicial o pinta em pedra talhada (luz em cima, sombra embaixo, contorno e sombra projetada).
O **ícone do app** (`public/icons/*.png`, 192, 512, 512 mascarável e 180 para o iPhone) é a face do dado: pedra escura, moldura e cantoneiras de
ouro, o triângulo ACENDER no meio com a brasa em cima. *Não mudei o nome do app no manifesto* ("Masmorra do Dado"): o `INTERFACE.md` pede para
conferir antes se «Sentença» está livre na Steam e nas lojas.
*Ainda não feito:* os botões do controle (gamepad), o vetor limpo do logo (para loja e cartaz) e a aba do mapa no diário com o ícone novo (o diário
desenha as próprias abas no papel).


## 47. Correções vistas pelo Pedro no celular e ajustes de cena (implementado)

**Decalques.** A poça de luz (`kit.lightPool`) e o desgaste (`kit.wear`) vazavam por cima da base dos objetos e das paredes vistas em ângulo
baixo: o `polygonOffset` era alto (-3/-4). Agora o offset é no máximo -1/-1 e o plano fica 3 cm (poça) e 1,5 cm (desgaste) acima do chão; a poça
tem névoa como o resto. O braseiro aceita o raio da poça (`makeBrazier(..., poolR)`): na sala 3, o da direita da porta tem poça menor.
**Lousa de parede** (`firegrid.ts`). Era um plano a 1 cm da parede, e a moldura de pedra lavrada da sala 3 (6 cm de espessura) ficava NA FRENTE
dele: de longe e no celular a lousa sumia e ficavam só os buracos. Agora a lousa é uma laje com espessura, afastada 2,5 cm da parede, e a moldura
da sala 3 é fina e fica atrás. **Lampiões apagados** viraram tigelinhas de bronze (bojo, pezinho, um aro claro na borda e um brilho de óleo no
fundo): lê-se "isto se acende", não "buraco de bala". **O dado de pedra da sala 3** saiu de perto do braseiro (a face de cima não estoura mais em
laranja; a pedra ficou um pouco mais escura) e os pontos viraram discos que não recebem luz, redondos, com um aro de pedra clara: UM em cima,
DOIS virado para o meio da sala, TRÊS virado para quem vem da entrada, legíveis de longe e no celular.

**Tela inicial.** O título «SENTENÇA» ficou grande (cerca de 60% da largura) e centralizado no alto; as opções ficam embaixo, à esquerda.

**Cenas.** Na abertura, nas cenas travadas, com o dado no centro da tela e quando o caderno é achado (inclusive enquanto o dado fala do caderno)
o jogador **não olha em volta** (`lookLocked` em `scene.ts`) e a **mira some** (`onCine`). **O dado caído** (abertura) para com uma face lateral
virada exatamente para o jogador e, nela, o **rosto de olhos fechados**; a câmera volta para ele com zoom; ele abre os olhos devagar, pisca,
**acorda** num pulinho com as sobrancelhas lá em cima, olha para um lado e para o outro, olha para o jogador, e só então fala. Ao pegá-lo, a face
volta a ser a de sempre (o rosto da mão é o do dado do HUD).

**O tutorial do caderno** (`book3d.ts`). Depois de escrever a 1ª anotação (BRASEIRO), o caderno vira até o índice e o jogador tem de passar por
**todas as partes** (símbolos, faces, textos, páginas dela, mapa, notas); ao chegar a cada uma pela 1ª vez, o personagem **pensa alto** sobre o que
é aquilo ("Parece um mapa. As salas por onde eu passei...", "Esta letra não é minha...", "Faltam folhas. Alguém arrancou."). Tentar guardar o
caderno antes diz o que falta ("Ainda não olhei as faces, o mapa e as notas.") e volta ao índice. No fim: "Pronto: vi tudo... Posso guardar o
caderno." Com o caderno aberto, os pensamentos aparecem no alto da tela, numa tira mais baixa (o rodapé das páginas tem as ferramentas do mapa).


## 48. A leitura do caderno e o tom de "ler sem entender" (implementado; tom decidido com o Pedro, ver HISTORIA.md)

**A ordem do caderno** agora é a dela: o índice, o **relato** (duas páginas) e as folhas arrancadas, os símbolos, as faces, os textos, o mapa e as
notas (`layout` em `src/book/pages.ts` ganhou `dictAt`; o índice lista "Páginas dela" primeiro). O relato estava numa página só e passava do
limite (16 letras × 13 linhas): justamente a frase final, "não acredite em tudo o que eu", era cortada. Agora são duas páginas (`HER_RELATO` em
`src/story/herpages.ts`), e duas folhas arrancadas que passavam do limite foram reescritas para caber.
**A leitura guiada** (`book3d.ts`): o caderno abre e vira sozinho até o relato; o jogador lê e pensa em perguntas ("De novo? Quantas vezes ela
acordou aqui?", "Embaixo da luz. Eu também acordei embaixo da luz.", "'Não acredite em tudo o que eu...' O quê? Por que ela parou?", "Onde ela está
agora?"); o caderno volta ao índice ("Ela arrumou o caderno como quem pretende voltar."). Ele passa por todas as partes, e em cada uma, na 1ª vez,
pergunta a si mesmo o que é aquilo (os símbolos: "eu vi na parede. Como já estão aqui?"; o mapa: "Eu não desenhei isso. O caderno sabe por onde
eu andei?"; as folhas pautadas: "As últimas dela? Ou as primeiras minhas?"; as folhas arrancadas: "Por ela? Ou por alguém que não queria que
fossem lidas?"). Nos símbolos, o caderno vira até BRASEIRO: "Embaixo de um deles, a letra dela: um desenho e um ponto de interrogação. Ela
também não sabia. E eu? O que eu acho que é?" e o campo abre. Tentar guardar antes de ver tudo: "Ainda não olhei os quadrados e o desenho. Ela não
deixaria nada sem olhar." No fim: "Ela contava tudo. Talvez fosse o jeito de não esquecer. Vou contar também."
**Sem voz de sistema no caderno:** os textos de instrução das páginas vazias viraram a letra dela ("o que eu vi", "o que eu acho",
"frases inteiras, quando eu achar"). **O mesmo tom no resto:** pensamentos da abertura e da porta ("Caí? Ou me jogaram?", "Continua trancada. Por
fora ou por dentro?", "Pesa na mão como se me conhecesse. Conhece?") e as legendas das salas (uma observação e uma pergunta, sem entregar puzzle).

*Ajuste (pedido do Pedro): menos indagações.* O personagem constata mais e pergunta pouco: no relato ficou uma pergunta só ("Onde ela está agora?"), cada parte do caderno tem um pensamento curto sem pergunta, e as legendas e pensamentos da abertura voltaram quase todos a afirmações; ficaram poucas perguntas pontuais ("E eu, o que acho que é?", "Caí? Ou me jogaram?", "Conhece?", "E eu, tenho quanto tempo?", "Qual delas é verdade?").

*Ajuste 2 (pedido do Pedro): falar pouco.* O problema não era perguntar, era falar demais. O personagem agora fala só nos momentos críticos, em frases curtas e assertivas, sem repetir o que a tela já mostra: o relato tem 3 pensamentos ("A letra não é minha.", "Ela também acordou embaixo da luz.", "E parou no meio."), cada parte do caderno uma frase de 2 a 5 palavras ("Os da parede. Já estão aqui.", "A sala onde acordei.", "Arrancadas."), a anotação "Ela não sabia o que era. E eu?"; a abertura tem 4 linhas ("Dói tudo.", "Caí? Ou me jogaram?", "Luz, lá em cima. Alto demais.", "Preciso de uma porta.") e as legendas das salas têm 2 a 5 palavras. A regra está no topo do subagente `narrador`.


## 49. O escuro da Casa e a R5 A Antecâmara Fria (implementado; PUZZLES_PROPOSTAS.md Ficha 1 e Ficha 9b)
**O escuro** (`ctx.blackout(segundos, aoEscurecer?)` e `ctx.dark()`): a luz ambiente e as luzes emprestadas caem a 8% em 0,15 s, ficam o tempo
pedido e voltam em 0,6 s; se há conversa ou o balão do dado na tela, o escuro espera. As **punições das salas de fogo** (`fire.ts`: frases
apagadas, placa que abafa, ordem errada com penalidade) agora trazem o escuro de **2,5 s** (`FireSpec.blackout` muda; a futura sala 13 "O Escuro"
usará 4 s). A **cal**: glifos verde-limão pálidos que só aparecem com a luz abaixo de 25% (opacidade = 1 − luz).
**R5 A Antecâmara Fria** (`src/scene/rooms/respiro5.ts`): 6 × 6 m, teto 3 m (a Ficha pede 4 × 6 e 2,4 m, mas a porta do jogo tem 2,65 m e o
batente ocupa ±1,6 m: para a moldura caber ao lado da porta a câmara ficou mais larga). Moldura vazia com o lugar da marca e um soquete frio
embaixo; o dado da mão olha para ele. Acender: escuro de 4 s, a cal «ABRIR PORTA CONFIRMADO» na moldura (as palavras vão para o caderno), a porta
abre no escuro; a luz volta, a moldura está lisa, a porta segue aberta. Repetível. Fica antes do Tribunal até as salas 15 a 17 existirem.
**Salvamento:** com uma sala nova no meio da lista, o jogo procura a sala salva pelo **nome** (os índices mudam).


## 50. Revisão de coerência dos textos (feita pelo subagente `narrador`, aplicada com as decisões do Pedro)
- **Caderno:** a página das faces sem descrições de manual (o nome das que o dado tem; "?" em sépia nas outras; título só "FACES"); "VI EM" no
  lugar de "AVISTADO EM"; mapa e bandeja vazios com "..." em sépia; "Guardar" no índice; a etiqueta da capa diz "CADERNO"; o índice conta só as
  folhas dela que já existem no jogo (4, não 7). Pensamentos corrigidos para baterem com a tela: "Os que eu vi. Já estão aqui." (os símbolos vêm
  também das falas), "Ela não achou nenhuma." (textos), "Onde acordei. E aqui." (o mapa já tem duas salas).
- **Glifos:** «BRASEIRO ONDE» e «DADO ONDE» sem a pergunta dobrada (ONDE já pergunta); o dado começa por EU quando fala de si («EU SENTIR FOGO»,
  «VOCÊ AJUDAR EU ?»); ao achar o caderno o dado diz «LIVRO» (com o desenho do livro) e «VOCÊ PEGAR LIVRO» (uma palavra nova por frase) e, depois, «VOCÊ ABRIR LIVRO»; a 1ª frase dele é «VOCÊ CONDENADO BOATO».
  A porta da Ponte termina em CONFIRMADO (a 1ª depois da sala 8).
- **Legendas:** O Pano "Panos sobre a pedra."; A Ponte "Madeira sobre o fosso." (não entregam o puzzle). A sala 8 diz "Uma lousa. Uma grade." (a folha 3 dela já
  fala das duas frases). As legendas de acerto e erro não dão regra nem dica: "Igual ao da parede.", "Não era isso.", "Apagou tudo.", "Pilares.";
  a gema da R2 diz "Fria na mão." (não confirma o erro plantado da folha 4); as faces dizem só "Pesa." / "Queima."; "Longe demais" sem tutorial.
  No léxico, PEGAR, ABRIR e LIVRO passam ao capítulo 1 (o dado já as mostra no Vestíbulo); a R5 entrou no `verify_vocabulario.mjs`.
- **Interface:** "Caderno" no botão, na pausa, nas configurações e nas telas; o aviso de símbolo novo diz só "Anotado no caderno."; a face selada
  mostra "Selada." (sem tutorial). O quiz sem traduções; "cantos" virou "seis".

## 51. O rosto vivo e o pixel no PC (pedidos do Pedro)
- **O rosto do dado mexe tudo, mas a expressão é sempre NEUTRA** (`dielife.ts` → `RostoMove`; desenho em `tracos()` de `textures.ts`). A boca é sempre
  uma linha **reta**: abre como fenda enquanto a fala está sendo escrita no balão (sílabas de 1 a 3 px, no ritmo da escrita: `talkingNow()` em
  `scene.ts`), entreabre para respirar, aperta os lábios, desliza para um lado, abre grande só no **bocejo** (quando o sono chega). As pálpebras
  de cima descem (foco quando ele quer muito ir a algum lugar, meio piscar, sono); o nariz dá fungadas; as sobrancelhas dão um lampejo de atenção
  quando algo se abre. Nada de sorriso, tristeza ou raiva: nenhuma linha curva na boca, nada de sobrancelha torta. A boca usa aproximação
  exponencial (estável com qualquer taxa de quadros).
- **Menos pixelado no PC (meio-termo):** o jogo desenha ~240 a 290 linhas na vertical em telas com 600 px de altura ou mais (alvo 280; 270 numa
  tela 1080p). Antes eram ~200 em toda tela (num monitor grande cada pixel virava um bloco de 5 a 7 e ficava difícil de entender); 360 tirou o
  pixel art demais. No celular continua ~200. A opção "Tamanho do pixel" vale nos dois (PC: fino 360, médio 280, grosso 200; celular: 270, 200, 150).
- **A pergunta do dado não abre mais a pausa:** o jogo solta o mouse para as opções já na subida do dado (antes de a pergunta estar "ativa"), e
  soltar o mouse no meio do jogo abre a pausa. Agora a pausa por mouse solto não vale quando foi o próprio jogo que soltou (pergunta do dado,
  cena do dado ao centro, abertura, cena de queimar).

## 52. O capítulo 1 completo (as salas da branch de puzzles montadas)
Com as fichas de `PUZZLES_PROPOSTAS.md` §4, o capítulo 1 ficou com **24 salas**: os puzzles 12 a 17 do plano (A Sombra, O Escuro, A Lei Pequena, O Fogo que
Corre, Os Que Dizem o Mesmo, A Memória da Casa), os respiros R3 (A Galeria dos Condenados) e R4 (A Escadaria), a Biblioteca (térreo, entre O Pano e Os
Apelidos), a R5 entre a 16 e a 17 do plano e o Tribunal no fim. Soluções em `PUZZLES.md`; provas em `tools/verify_*.mjs` (todos passam).
- **Construtor `fire.ts`:** regra `custom` (a sala julga com `api.markSolved()` / `api.punish(frio)`), `accept()` na regra `order` (a ordem só vale se a sala
  aceitar: o estandarte certo queimado), braseiros com altura (`y`), porta num andar alto (`doorY` → `exitDy`), chão e dado com alturas vindos do `extra`
  (`floorY`, `dieFloor`), frase da porta opcional (`words: []`), sala a céu aberto (`sky`), estado dos panos para o `extra`.
- **A cal** (`src/scene/cal.ts`): escrita verde-pálida que só aparece abaixo de 25% de luz e manda as palavras ao diário na 1ª vez; na parede ou no teto.
  Usada em O Escuro (teto), O Fogo que Corre (MENOS no teto, C5), A Memória da Casa (o quadro vazio) e na R5.
- **O escuro** também apaga a luz que o dado da mão carrega e a marca de mira (numa sala baixa elas acendiam o teto e cobriam a cal).
- **As folhas dela** 5, 6 e 7 ganharam texto (Galeria: a pista do Escuro e o erro sobre PEQUENO; Escadaria: "a forma de alguma coisa que eu conheço").
- **Ainda fora:** os segredos que dependem de voltar (S5, as palavras do escuro nas salas 2, 7 e 11; S8, o soquete do poço), os atalhos dos respiros e a
  cena da página do Escrivão que some ao voltar; o pedestal vazio do Museu fica para o capítulo 2.

## 53. Frases acendíveis: apagada × acesa e fácil de acertar (pedido do Pedro, jogando)
Dois problemas: a frase apagada era cal branca e brilhava com a luz da sala (acender só punha uma chaminha no soquete: apagada e acesa pareciam
iguais) e era difícil acertar (mirava-se o soquete, de 15 cm, e o toque só valia com |dy| < 0,4 m e a menos de 1,1 m da parede, sem nada dizendo isso).
- **O fogo da frase** (`src/scene/burnline.ts`, usado pelos tabletes `lit` e pela frase da porta em `judge: 'door'`):
  - **apagada** = pedra: sulcos escuros e a cal fraca e fosca (a inscrição fica `burnable` e não pega o brilho geral da cal); lê-se de perto;
  - **acesa** = o fogo CORRE pelos sulcos do soquete até o fim da frase, **traço por traço**, na ordem da escrita (`drawGlyphPart` em
    `book/font.ts`; ~0,24 s por símbolo, uma chaminha corre na frente); glifos laranja-dourado com cor > 1 (o bloom pega), **halo quente** na
    parede (sem névoa) e uma luz de verdade (emissor), e a **chama na prateleira** marca cada frase acesa de longe;
  - **ao apagar** (erro, punição): **fuligem** escura por ~2 s **depois que a luz volta** (no escuro da punição ela não começa a sumir), e volta a
    ser pedra.
- **Acertar:**
  - **realce de mira**: com a face de Fogo na mão e a mira sobre uma frase acendível (até 12 m), contorno dourado na frase e a mira vira o
    ícone de acender (`Room.fireAim`; `onFireAim` no App);
  - o arremesso feito assim **vai até o ponto da mira** (o arco é calculado: antes o dado chegava ~0,5 m abaixo, na frase de baixo);
  - **ajuda de mira**: um arremesso de Fogo que passa a 0,5 m (0,75 m no celular) de uma frase acendível se curva até ela (`Room.fireNear`);
  - **mais folga**: na vertical, metade do espaço até a frase vizinha; até 1,5 m da parede; ao longo, a frase inteira e a prateleira. O dado em
    voo conta pelo ponto onde **vai bater** na parede (sem isso, num arco, ele entrava na faixa ainda subindo e acendia a frase de baixo);
  - **um toque por arremesso** em todas as salas (o dado que quica numa frase e cai pela de baixo não a acende);
  - o **soquete é uma prateleirinha**: posicionar o dado nela (botão direito / G / POSICIONAR) acende a frase (é um ponto de encaixe);
  - **altura**: toda frase acendível fica entre **1,3 m e 2,0 m**. Duas linhas por tablete no tamanho normal; com mais, as linhas se apertam e as
    letras encolhem. Por isso o tablete de três linhas da direita do Confirma virou dois (duas linhas em dz 5,5 e a terceira em dz 12).
- Testado (Playwright, PC 1280×720 e celular emulado com toque, 844×390): no Confirma, as três confirmadas acendem na 1ª tentativa de 2, 2,5 e
  3 m (uma delas mirando 0,6 m fora do centro); o boato pune e deixa a fuligem; posicionar na prateleira acende; em O Boato Verdadeiro as quatro
  certas e a da porta acendem e a Casa aceita. Não testado num celular de verdade.

## 54. Fogo de verdade, fissuras na pedra, tochas longe da escrita (pedido do Pedro)
- **Acesa = fogo de verdade** (`burnline.ts`): além do sulco em brasa viva (o brilho ondula ao longo do traço, shader), **línguas de fogo**
  dançam em cima dos traços (um `THREE.Points` por frase: cada chama é uma gota desenhada no shader, que tremula e balança; nasce quando o fogo
  que corre chega àquele ponto, `glyphSamples` em `book/font.ts`) e **brasas sobem** (outro `Points`). Ao apagar, as chamas encolhem e o sulco
  esfria de laranja a vermelho-escuro antes da fuligem. A chama do soquete ficou pequena (o fogo de verdade está na frase).
- **Apagada = fissuras na pedra**, não cal: sulco escuro, a borda de cima lascada pegando a luz, rachaduras finas saindo dos traços; legível de
  perto, quase some de longe. A moldura dos tabletes acendíveis também é só talho (sem cal, sem brilho).
- **A pista sem dica** (sutil, nunca escrachada): uma mancha velha de **fuligem acima** de cada frase acendível (ali já queimou; a fumaça sobe) e,
  de tempos em tempos (4 a 10 s), uma **brasa adormecida** que reluz no fundo de uma fissura e se apaga (só enquanto a frase espera o fogo e a
  Casa aceita fogo). Junto com a brasa pulsando na prateleira, o jogador sente que aquilo pode queimar.
- **Tochas longe das escritas** (`fire.ts`): as tochas de leitura dos parágrafos ficam a **1,6 m** da moldura (e da prateleira) e **acima** da
  escrita (~0,75 m mais altas); entre dois parágrafos só há tocha se couber a essa distância dos dois.
- **Subagente `cenografo`** (`.claude/agents/cenografo.md`): level design e arte, com as regras deste documento e da `DIRECAO_DE_ARTE.md`, a
  gramática visual do jogo (o que cada brilho significa) e a regra de ouro de não quebrar puzzles.

## 55. O fogo novo em todo glifo que acende
- O fogo das frases acendíveis (o traço em brasa correndo na ordem da escrita, as línguas de fogo, as brasas que sobem, o halo) agora vale para
  **qualquer palavra talhada que acende com fogo**: a frase da porta que acende junto com os braseiros, a Casa lendo a frase da porta quando
  ela abre (palavra por palavra), as lousas, os rótulos que acendem quando o puzzle é resolvido, o CONFIRMADO/BOATO da Confirma, a Ponte, os
  Apelidos, o Vestíbulo...
- Como: `inscription.ts` cria, na 1ª vez que o `fire` de uma palavra passa de 0,2, o fogo dela (`makeWordFire` em `src/scene/firefx.ts`) e o
  atualiza a cada quadro (`setGlow`, chamado pelo motor nas salas ativas). Nenhuma sala precisou mudar: todas já acendiam escrevendo `p.fire`.
- Valores parciais continuam valendo: palavras que **pulsam** ou acendem **pela metade** (o TEMPO que pulsa, a contagem n/4, o BOATO que pisca)
  pulsam com o fogo junto; a palavra só "apaga" depois de 0,4 s abaixo de 0,05 (um piscar rápido não recomeça o fogo). Ao apagar, o traço esfria
  de laranja a vermelho-escuro e some.
- Apagadas, essas palavras **continuam de cal** (são textos para ler); só as frases ACENDÍVEIS (tabletes `lit`) são fissuras na pedra (§54).
- As peças do fogo (shaders das chamas e brasas, o traço em brasa, a mancha macia) moram em `firefx.ts` e são as mesmas das frases acendíveis
  (`burnline.ts`); as medidas da célula de um glifo, em `glyphcell.ts`.

## 56. Luz no lugar do fogo nos glifos (pedido do Pedro)
O fogo de verdade nas letras (§54–§55) deformava o glifo: as chamas por cima mudavam o desenho e confundiam a leitura. Trocado por **luz**:
- **Acesa:** o glifo continua **nítido**, no desenho exato (o traço aceso é só um pouco mais largo que o sulco), e **brilha num dourado meio
  mágico**: miolo quase branco, borda dourada, cor > 1 (o bloom faz o brilho). A luz aparece **traço por traço**, na ordem da escrita (0,2 s por
  símbolo), e depois fica: **respira** devagar e um **reflexo corre** ao longo dos traços. Halo dourado macio na pedra e uma luz de verdade.
- **Apagada (frases dos puzzles):** fissura na pedra **sem brilho nenhum**. Saiu a "brasa adormecida" que reluzia de vez em quando; fica só a
  mancha velha de fuligem acima (não brilha) e a brasa do soquete/prateleira (o sinal de "isto pode ser aceso", §25).
- **Ao apagar:** a luz esmaece em âmbar e some; na punição, a fuligem de ~2 s continua.
- Vale para as frases acendíveis (`burnline.ts`) e para **toda palavra talhada que acende** (`makeWordGlow` em `firefx.ts`, via `p.fire`;
  palavras de cal continuam de cal quando apagadas). Saíram as chamas e as brasas (os `Points` com shader).

## 57. Frase acendível apagada em marfim (pedido do Pedro)
A fissura preta da frase apagada (§54) confundia com a parede (o rejunte dos tijolos também é escuro). Agora a frase que ainda não foi acesa é
o sulco talhado preenchido de **marfim**: um branco meio amarelado, pálido (cor de osso), **fosco** e sem brilho nenhum, diferente do branco
da cal das escritas comuns (que brilha um pouco). São três tons que não se confundem: **branco** (texto para ler), **marfim** (frase que pode
ser acesa), **dourado luminoso** (acesa). Para a luz quente não "acender" o marfim, ele é um pouco menos claro que a cal e a luz de verdade que
a frase acesa projeta ficou fraca (o brilho fica na frase, não nas vizinhas). A moldura do tablete acendível é do mesmo marfim, sem brilho.

## 58. Brilho só no desenho, mais contido (pedido do Pedro)
- Saiu a **faixa de luz** (halo retangular) atrás das frases e das palavras acesas: o brilho fica **só no desenho do glifo**, um brilho macio e
  estreito que segue cada traço (testado primeiro atrás de `?glifo=suave` e aprovado; agora é o padrão e o parâmetro saiu).
- **Mais contido** para não deformar os glifos (eles têm traços curtos e pontinhos próximos, que um brilho largo junta): o traço aceso tem a
  largura do sulco, o brilho em volta é estreito e fraco, a cor fica só um pouco acima de 1 (o bloom dá um brilho leve, sem borrar) e o reflexo
  que corre pelos traços e a respiração ficaram discretos. A luz de verdade que a frase projeta continua fraca.
- De longe, as frases acesas aparecem como traços dourados (sem o bloco de luz); ainda dá para contar quantas estão acesas.

## 59. A luz espera a cena do dado; o pulso (em teste)
- **A frase acendível só começa a ser escrita depois da cena do dado queimando** (`ctx.paused()`): antes a luz escrevia por trás do dado em
  chamas e o jogador perdia a escrita traço a traço. Agora ela acontece à vista. (Vale para o jogo, já.)
- **Pulso** (aprovado pelo Pedro; vale para as frases acendíveis e para toda palavra que acende): o clarão **anda com a escrita, da esquerda
  para a direita**: cada símbolo clareia no instante em que a luz chega nele e assenta no brilho contido (§58) em ~0,75 s, numa onda que segue
  o ritmo da luz acendendo. É uma camada de luz no formato exato dos traços (`makeFlashMesh` em `firefx.ts`; o shader acende cada ponto quando
  a luz passa, por `uRunV`, os símbolos já percorridos). A luz de verdade da frase também anda com a onda (esquenta a parede por onde ela passa,
  de leve, para não dourar a frase apagada vizinha) e depois volta devagar para o meio. Não deixa nada atrás da escrita nem deforma o glifo.
  (Na 1ª versão o clarão vinha todo de uma vez no fim e a luz ficava no meio da frase: parecia pulsar só no centro.)

## 60. Som: passos, fogo, pedra e o AMBIENTE (pedido do Pedro; feito pelo subagente `sonoplasta`)
Continua tudo com **gravações reais** (CC0 do OpenGameArt e os instrumentos do FluidR3_GM); só se recorta, filtra, sobrepõe, inverte e emenda
(`tools/build_audio.py`, downloads em `tools/fetch_audio.sh`, créditos em `public/audio/CREDITS.txt`). Efeitos: 0,39 → 0,58 MB; áudio
total (com os instrumentos): ~2,2 → ~2,4 MB.
- **Passos** (um som FIXO por piso, decisão do Pedro; pé esquerdo e direito alternam sempre na mesma ordem e recomeçam no esquerdo depois de
  parar): **pedra** = sapato de couro em pedra (Fantozzi), no lugar da bota abafada; **degrau** = o mesmo sapato com o peso do corpo (o baque da
  bota em concreto por baixo), que o motor escolhe sozinho quando o passo sobe ou desce mais de 12 cm (escadas e rampas; nenhuma sala precisa
  marcar); **entulho** = o passo com pedrinhas soltas (`Kit.zone('rubble')`, hoje no entulho embaixo da boca do Poço). Tapete, placa e poça
  ficam como estavam. Não há piso de madeira no capítulo 1 (a madeira da Ponte é a calha do fogo, não se pisa nela).
- **Fogo**: acender = a chama pegando ("fff") de um bastão de fogo de verdade (LEGIT Audio), com o tímpano por baixo; **tocha** (`key` com
  "tocha") e **pano/estandarte** (`key` "pano"/"dm…") têm gravações próprias (menor; lufada que estala). **Chama apagando** = a lufada ao
  contrário (o fogo é "sugado") e um chiado curto de brasa. **Fogo por perto**: o laço da chama (só das luzes LARANJA: braseiros, tochas,
  panos, canaletas; céu, porta e a luz mágica das frases não crepitam) vem **do lado em que está** (a média dos fogos próximos) e abafa com a
  distância; por cima, **estalos soltos** tirados ao acaso de gravações de faíscas, mais frequentes perto: o fogo nunca se repete igual.
- **Pedra**: porta que **sobe** = arrasto grave, raspar, o baque ao travar e pó/pedrinhas caindo; porta que **desce** = raspar acelerando e o
  baque pesado; **pilar subindo** (`ctx.sfx('rise')`, antes era o som da porta) = arrasto mais lento e grave, pedrinhas e o baque no fim.
- **A frase que acende** (`Ctx.glyphLight`, `makeBurnLine({ onGlyph })`): a cada símbolo que a luz escreve, da esquerda para a direita, uma
  nota de celesta que sobe (harpa por baixo), do lado em que está a frase; no último, a harpa assenta num acorde (a Casa leu).
- **O escuro da Casa** (`'dark'`): a chama sugada e um grave abafado e distante (o tambor de tronco). Porta, pilar, erro, peça e o escuro
  **abaixam o ambiente** por ~1,6 s (nada cobre o que o jogador precisa ouvir); a pausa também abaixa.
- **AMBIENTE** (`Room.ambience`, opcional; ajudas em `src/scene/ambience.ts`):
  - **vento** (`wind(x, z, pésY)`, montado com `windNear` a partir das aberturas): um trecho calmo da tempestade Arwen em laço de 16 s, mais
    forte e mais claro perto da abertura, abafado longe, com **rajadas** de vez em quando onde venta de verdade. Onde: o **Poço** (desce pela
    boca), o **pátio da Cisterna** (o pátio todo, mais forte sob o buraco de luz), a **boca do fosso** da Ponte (mais fraco lá embaixo), a
    **Escadaria** (pelas janelas de grade e mais quanto mais alto), o **claustro** de «Os Que Dizem o Mesmo» (forte no pátio, entra pouco nas
    galerias) e um ar leve sob o óculo da Biblioteca;
  - **gotas** (`drips`): espaçadas (2 a 6,5 s), com eco de pedra, do lado em que pingam, até ~9 m: no Poço, na cisterna, no fundo do fosso,
    ao pé da Escadaria e num canto da Antecâmara Fria;
  - o **ar da sala**: o mesmo vento, mais lento e só o grave, bem baixo, sempre; e a **reverberação muda com o tamanho** (`size`, ou
    estimada pelo volume da sala): corredor e câmara pequena abafam (sala curta), salão alto e o fosso ecoam (sala longa). O corredor da
    Cisterna é curto e o pátio, longo;
  - **a Casa respira**: de 1 a 2,5 min, só num momento calmo (sem conversa, cena, escuro ou pausa), um grave distante com um suspiro de
    violoncelo, ou pedra rangendo longe, ou os dois; nunca o mesmo duas vezes seguidas.
- Desempenho: poucos laços compartilhados (fogo, vento, ar, dado rolando), o volume muda e a fonte não se recria; volumes e filtros mudam ~10
  vezes por segundo; tudo é decodificado no `unlock()`. Tudo vai pelo canal de **efeitos** (Configurações → Áudio).
- Testes (dev): `__mdd.audio()` traz `log` (o que tocou) e `amb` (vento, tamanho, fogo e lado, gotas, calma); `__mdd.sfxPlay(nome, v, key)`.

## 61. Mockup da direção de arte nova: o Vestíbulo como salão de colunas (cenógrafo, pedido do Pedro)
O Pedro pediu um nível "AAA" de ambientação, **sempre em pixel art**, com uma foto de referência (cripta de colunas redondas e abóbadas de
aresta, tochas, escuro de verdade) e quis ver primeiro uma sala pronta. A sala 2 (O Vestíbulo) virou o mockup. **Nada do puzzle mudou**: os três
braseiros, a frase «ACENDER DOIS», a porta e o caderno estão nos mesmos lugares; a sala ainda se resolve com exatamente dois acesos.
- **Sombras de verdade nas chamas** (`scene.ts`, "luzes COM SOMBRA"): duas PointLights com sombra (mapa de 256, filtro duro) emprestadas às chamas
  marcadas (`Emitter.shadow`) mais perto do jogador; ficam sempre na cena (sem recompilar shaders ao trocar de sala); o mapa de cada uma é refeito em
  rodízio. Colunas, arcos, banco, entulho, o corpo do jogador e o dado fazem sombra; paredes e abóbada só recebem. Vale com qualidade "alta".
- **Chamas vivas** (`kit.lively`, também nos braseiros): a luz oscila e o ponto de luz treme alguns cm, e a sombra dança junto.
- **Arquitetura** (`src/scene/arch.ts`): cantaria de blocos grandes com **relevo de verdade** (cor e altura desenhadas juntas; a altura vira
  `bumpMap`: a quina de cada bloco pega a luz da tocha), lajes grandes e irregulares no chão (4,8 m por ladrilho), **abóbadas de aresta** em três
  tramos, dois **arcos de aduelas** nascendo de **colunas redondas** (plinto, toro, fuste com êntase, colarinho, equino, ábaco), paredes com
  espessura até o alto das lunetas. Peças estáticas juntadas por material (`kit.bake`, agora mantendo quem faz sombra).
- **Luz**: ambiente bem mais baixo e escuro (o salão vive das chamas); tochas mais fortes; uma **fresta alta** com grade na luneta do último tramo da
  parede direita traz a única luz fria (lua): cai em diagonal sobre a frase da porta (a escrita recebe luz) e as grades fazem sombra (`Room.shadowLight`).
  O feixe se lê pela poeira que flutua nele (um cone desenhado virava um bloco chapado na paleta).
- **História no lugar**: banco de pedra entre as colunas da direita com argolas de ferro na parede (os condenados esperavam ali); uma aduela caída do
  arco, com lascas, e uma gota que pinga da abóbada numa poça (o passo muda de som); caminho gasto da entrada à porta; fuligem e fumaça nas tochas;
  teias nos cantos altos do fundo.
- **Bugs de passagem corrigidos nesta sala**: a parede da porta e a da entrada têm espessura (`buildDoor`/`buildEntrance` ganharam `thick`,
  `wallMat`, `uvScale`): vistas de trás não somem mais e a laje da porta sobe para dentro da parede.
- Desempenho: ~500 chamadas de desenho com os braseiros acesos (antes ~350). Testado com Playwright (PC e celular emulado); não testado num celular real.

## 62. O braseiro em modelo 3D (prévia, pedido do Pedro)
O Pedro achou o braseiro feio e mandou um modelo do Sketchfab: **"Stone Column Brazier", de Amarveer, CC BY 4.0** (pode entrar no jogo, inclusive
vendido, com crédito: já está na tela de Créditos e em `public/audio/CREDITS.txt`). É o primeiro arquivo de modelo do jogo (até aqui tudo era código).
- **Tratamento** (`tools/braseiro_glb.py` → `public/models/braseiro.glb`, 240 KB; o original tinha 28 MB): sai a chama "de foto" (o jogo usa a
  própria chama em pixel, as brasas e a luz), as texturas de 2048 px viram 128 px (a densidade de pixel das paredes; 256 px não mudava nada na
  tela), musgo menos saturado, filtro "nearest", materiais Lambert com o relevo do mapa de normais. ~1.500 triângulos.
- **Medidas do puzzle intocadas** (`brazier.ts`): o topo da cesta fica em 1,1 m × escala (onde a tigela sempre esteve), as caixas de colisão, o
  soquete, o ponto de acender e a escala por tamanho (GRANDE/PEQUENO) são os mesmos; a base da coluna tem os mesmos 0,6 m do pé antigo. A chama
  e o carvão foram ajustados à cesta, que é menor que a tigela antiga.
- **Virou o padrão** (aprovado pelo Pedro): todos os braseiros do jogo usam o modelo; o antigo, de caixas, só com `?braseiro=antigo`. O modelo
  carrega à parte e entra em cada braseiro quando chega (`onBrazierModel`); nada do puzzle depende dele (colisão, soquete, altura da tigela e
  rótulos são os mesmos). Conferido: A Lousa, O Fio de Fogo, Os Apelidos, O Pano (o rótulo talhado no pedestal continua legível), O Fogo que
  Corre (puzzle resolvido), O Que a Casa Confirma (resolvido), os 18 verificadores e a passagem por todas as 24 salas.

## 63. Objetos de cena em modelo 3D: dois packs CC0, a vitrine e a Galeria com objetos (prévias, pedido do Pedro)
O Pedro pediu objetos de verdade para as salas. Achei e baixei dois packs gratuitos **CC0** (podem entrar no jogo, até vendido, sem crédito
obrigatório; o crédito está em `public/audio/CREDITS.txt`): **Fantasy Props MegaKit (Standard)**, de Quaternius (94 objetos em glTF, quatro texturas
"trim sheet" compartilhadas), e **Medieval Tavern Props Pack**, de System G6 (19 objetos num arquivo do Blender, exportados para .glb pelo Blender
instalado na sessão; os PNG tinham um bloco de cor com CRC errado, consertado). Descartados: KayKit e RgsDev (cartoon de cores chapadas).
- **Tratamento**: texturas reduzidas (256 px nas "trim sheets" da Quaternius, 128 px nas do System G6), filtro "nearest", materiais Lambert com o
  relevo do mapa de normais; nas da Quaternius, **menos saturação** e o **metal bem mais escuro** (eram feitas para material metálico e saíam
  brancas como giz). Malhas quantizadas. `src/scene/props.ts` carrega os packs, troca os materiais, normaliza cada objeto (pé em y = 0; o pack do
  System G6 não tem escala real, então cada objeto tem a sua altura em `T_HEIGHT`) e os põe nas salas sem esperar (`placeProp`).
- **A vitrine** (`?vitrine=1`, `rooms/vitrine.ts`): sala isolada, sem salvar, com os 113 objetos em 38 baias, cada uma diante de um muro com duas
  tochas com sombra. Usa o pack inteiro da Quaternius (`public/models/_vitrine/`, 5,7 MB, fora do repositório: só para escolher).
- **A Galeria dos Condenados com objetos** (`?objetos=1`, `rooms/respiro3.ts`): a vida de quem esperou ali. Barril, saco de palha, caixote e balde na
  entrada; a mesa dos condenados com banqueta, castiçal, livros, caneca e prato; velas acesas nos bancos (uma é a do Escrivão); uma prateleira com
  garrafas embaixo das marcas de giz; pote quebrado e inteiro; correntes no chão; um candelabro velho pendurado no meio; barris num suporte junto da
  porta. Tudo encostado nas paredes, fora do caminho, da passagem da câmara lateral, das folhas dela e dos desenhos; as tochas ganham sombra de
  verdade. Na branch ficam só os objetos usados (`public/models/props_q.glb`, 1,1 MB, e `props_t.glb`, 0,5 MB).
- Era prévia (`?objetos=1`); **virou padrão na Galeria em §65**, com os objetos refeitos em pequenas cenas e a arquitetura nova.
- **O que entra (decisão do Pedro: o jogo não é RPG)**: só objetos do dia a dia de quem viveu e esperou na Casa: móveis (bancos, banquetas,
  cadeiras, mesas, armários, estantes, camas), barris, caixotes, cestos, sacos, baldes, potes e vasos (inteiros e quebrados), canecas, pratos e
  talheres, velas e castiçais, candelabro, livros e pergaminhos, cordas, correntes e gaiola. **Fora**: armas, escudos, poções e garrafinhas,
  equipamento, boneco de treino, moedas, bolsas de dinheiro e baús de tesouro, chaves, ferramentas de ofício (bigorna, bancada, pedra de afiar),
  caldeirão, comida e barraca de feira; e o que imita a gramática dos puzzles: tochas e lanternas, estandartes e panos pendurados, lenha em brasa.
  Na Galeria, a prateleira trocou as garrafas por caneca, prato e pote.

## 64. O motor de luz: toda chama acende o seu pedaço da sala (pedido do Pedro: "a iluminação é o cerne")
- **Mais luzes de verdade**, pela qualidade (Configurações → Imagem): alta 12 luzes + 4 com sombra; média 10 + 2; baixa 6 + 0 (`BUDGET` em
  `scene.ts`; o número de luzes só muda quando a qualidade muda, então os shaders não recompilam ao trocar de sala). Cada luz tem alcance
  (`Emitter.range`, 11 m) e some suave até ele.
- **Sombra em toda tocha e todo braseiro** (`Emitter.shadow` agora vem ligado em `kit.torch`, `makeBrazier` e nas tochas das constelações): as
  mais perto do jogador ganham sombra de verdade. **Toda sala** passa a ter sombras: tudo que é sólido recebe; projeta o que tem volume (caixas,
  colunas, pedestais, objetos), não os planos (paredes antigas, chão, decalques, escritas), o transparente, o "aceso" (MeshBasic) e o que pede
  `userData.noShadow` (a tigela e o carvão do braseiro, o cabo e o suporte da tocha: senão a chama ganhava uma barra preta embaixo). Salas que
  decidem sozinhas marcam `group.userData.ownShadows` (A Lousa, o Vestíbulo).
- **Custo**: o mapa de sombra só é refeito quando a luz é nova ou quando o jogador ou o dado se mexem a menos de 10 m dela (parado, custo zero);
  rodízio de 2 mapas por quadro (alta) ou 1 (média). Medido na Galeria: parado, as mesmas ~290 chamadas de antes; andando, ~370 (alta), ~330
  (média), ~290 (baixa). As luzes com sombra não tremem de lugar (só de força), para não refazer o mapa a cada quadro.
- **O brilho de longe**: cada tocha tem uma mancha de luz na parede que só aparece enquanto ela está sem luz de verdade (`Emitter.lit`, escrito pelo
  motor) e apaga no escuro da Casa (`lightEnv.scale`): nenhuma tocha parece morta de longe, e a cal continua visível no escuro.

## 65. A Galeria dos Condenados como sala-modelo completa (cenógrafo, pedido do Pedro)
A sala 15 (`rooms/respiro3.ts`) é a primeira sala inteira na direção de arte nova (§61), com o motor de luz (§64) e os objetos (§63). Nada do
que o jogador precisa ver, alcançar ou acertar mudou: a câmara lateral (formato, frases a giz, lei talhada, braseiros, nicho), a passagem e a
inscrição sobre ela, as folhas 5 e 6 nos bancos, o Escrivão e a marca de giz, os desenhos (tamanhos, rosto, porta), as marcas de contagem, os
bancos, as tochas e a frase da porta ficam onde estavam. Testado: DOIS, TRÊS, UM abre o nicho da gema; o Escrivão some quando o jogador passa
do meio da galeria e deixa a marca de giz.
- **Arquitetura**: abóbadas de aresta em **cinco tramos** (nascem a 5,2 m, acima das marcas de giz e das tochas; o fecho a 7,6 m), separadas por
  **arcos de aduelas** que nascem de **mísulas** (pedras em balanço) no alto das paredes, em vez de colunas, para não tapar as paredes de giz.
  Paredes de **cantaria com relevo e espessura** (35 cm, por fora; a entrada e a porta também ganharam espessura); chão de lajes; a câmara do
  puzzle com a mesma pedra (planos com relevo, `reliefPlaneMat` em `arch.ts`). O dado bate no teto de verdade (a união dos dois berços de cada tramo).
- **Luz**: o teto chapado e a luz azul que vinha "de cima" saíram. A luz é das cinco tochas (cada uma com a sua sombra), das velas (fracas, sem
  sombra) e de uma **fresta alta** na luneta da direita: a lua entra em diagonal e cai no banco do Escrivão (a única luz fria; é a `shadowLight`
  da sala, com grades que fazem sombra, e a poeira flutua dentro do feixe, `beamMotes`). A sombra da fresta só se refaz quando algo se mexe
  embaixo dela (o jogador ou o dado no fundo da galeria; a cada 3 quadros enquanto o Escrivão escreve). Ambiente mais baixo (0x5c5c8a, 0,8).
- **Objetos em pequenas cenas** (só coisas do dia a dia; encostados nas paredes, nunca no caminho):
  1. *Onde alguém dormia* (esquerda, logo depois da entrada): a cama de solteiro, a banqueta de cabeceira com a vela acesa, a caneca no chão, o
     saco no pé da cama.
  2. *A mesa* (esquerda, antes da passagem da câmara): o saco **em cima da mesa**, a caneca, o prato, o castiçal de três velas aceso, uma banqueta
     puxada e outra caída, o balde embaixo.
  3. *A despensa* (direita, junto da entrada): barril com a caneca esquecida em cima, caixote com um saco em cima, balde.
  4. *A prateleira* (direita, no meio): caneca, prato, pote e uma vela; um cesto embaixo e um pote quebrado no chão.
  5. *As correntes* (direita, entre os bancos do fundo): argola na parede com os elos descendo, a corrente enrolada no chão e uma corda.
  6. *O lugar do Escrivão*: a vela dele (continua acesa depois que ele some) e o rolo, no banco.
  7. *Junto da porta*: o suporte com dois barris (direita); barril, pote e a sacola encostada (esquerda).
  E o candelabro velho, apagado, pendurado do fecho da abóbada do meio.
- **Custo**: os objetos parados são juntados numa malha por material quando os packs chegam (`bakeProps` em `props.ts`), e os arcos, mísulas e
  ferragens no `kit.bake`. Medido (PC e celular, qualidade alta, média de 20 quadros): entrada ~350, meio ~280, porta ~415 chamadas (a galeria
  antiga: ~290 / ~235 / ~340; o Vestíbulo novo passa de 700). `props_q.glb` ganhou cama, sacola, corda, pote, vela e balde de madeira (1,4 MB).
- Não testado em celular de verdade (só no navegador do computador em tamanho de celular).

## 66. Sombras mais realistas, a opção "Sombras" e a tocha em modelo 3D (cenógrafo, pedido do Pedro)
O Pedro pediu "caprichar mais nas sombras, dar ainda mais realismo", com uma opção no menu para diminuí-las se pesar no celular; e mandou um
modelo 3D para as tochas.
- **Configurações → Imagem → Sombras** (`Config.shadows`, separada da Qualidade, que continua cuidando de quantas luzes e do brilho):
  | nível | chamas com sombra | mapa | borda | luz principal da sala (fresta, nicho) | oclusão de ambiente |
  |---|---|---|---|---|---|
  | Altas (padrão no PC) | 4 | 512 | suave (PCF, raio 2,5) | sim, 1024 | 100% |
  | Médias (padrão no celular) | 2 | 256 | suave (raio 1,6) | sim, 512 | 85% |
  | Baixas | 1 | 256 | dura (filtro básico) | não | 70% |
  | Desligadas | 0 | — | — | não | não |
  A borda suave do three r187 gira as amostras por pixel; o pontilhado do pós-processo transforma esse ruído numa penumbra de pixel. Com o mapa
  maior, o desvio da sombra diminui e ela encosta no pé do objeto em vez de "descolar".
- **Oclusão de ambiente** (no pós-processo, `ambientOcc` em `scene.ts`): a luz que vem "de todo lado" chega menos nos cantos, embaixo da mesa e da
  cama, no pé dos objetos e entre as pedras. Oito amostras num disco de ~0,6 m, lidas da profundidade da cena (no centro do pixel), giradas pelo
  pontilhado. Quase não age no que a chama ilumina forte (a oclusão é da luz ambiente). Barata porque a imagem do jogo é pequena (~480 × 270).
  Para testes: `__mdd.exp('ao=-1')` mostra só a oclusão em cinza; `ao=1` volta.
- **Sombra de contato** embaixo de cada objeto de chão da Galeria (`kit.contact`, agora juntadas pelo `kit.bake` num desenho só em todas as salas).
- A Galeria ficou com menos luz de enchimento (ambiente 0,68 em vez de 0,8): as sombras das chamas ficam mais fundas.
- **A tocha** ("Medieval Wall Torch", de Kigha, Sketchfab, CC BY 4.0; crédito na tela de Créditos e em `public/audio/CREDITS.txt`): suporte de
  ferro com placa na parede, cabo de madeira inclinado e uma gaiola de ferro onde a chama do jogo entra. `tools/tocha_glb.py` junta os nós, multiplica
  a oclusão do próprio modelo na cor, reduz as texturas a 128 px e grava `public/models/tocha.glb` (81 KB). `models.ts` normaliza (placa na
  parede, alto da gaiola em y = 0, a gaiola a 0,26 m da parede) e `wallTorch` a põe em **toda tocha de parede** (`kit.torch` e as tochas dos
  puzzles, `makeTorch`), com a gaiola exatamente embaixo da chama de sempre: o ponto onde o dado acende as tochas dos puzzles não mudou. As tochas
  em pé (`stand`) continuam as de antes. A tocha não faz sombra (a chama ficaria com uma barra preta embaixo). Se o arquivo não carregar, volta a
  tocha de caixas.
- **Conserto: o "quadrado branco" no lugar da chama.** O primeiro quadro do jogo às vezes tinha o relógio NEGATIVO (o horário do quadro chegava
  antes do horário guardado), e o quadro da chama, calculado com o resto de uma divisão, virava um índice negativo: a chama ficava sem desenho e
  aparecia como um retângulo branco. Agora o passo do relógio nunca é negativo e toda chama usa `kit.frame(n)`, que nunca dá índice negativo.
- **Conserto: objetos que chegam depois** (modelos carregados à parte) entram na mesma camada de desenho da sala (`adoptLayers`); antes, eles
  continuavam sendo desenhados com a sala longe.

## 67. Varredura do cenógrafo na Biblioteca e nas portas

- **As paredes do Átrio** eram folhas de uma face só: vistas de dentro das alas, a parede sumia e o batente da passagem ficava boiando. Agora são
  pedra com 30 cm de espessura.
- **O nicho da gema da Sala de Aula** estava no mesmo lugar da lousa (c). Foi para a parede do lado do Átrio, de frente para ela. O segredo e a
  solução são os mesmos.
- **Tochas longe das escritas**: nas alas do Papel e da Aula, as tochas ficam na parede do lado do Átrio. Na Ala das Pedras, os murais abrem
  espaço para a tocha e as estantes ficam dos lados da passagem, sem tapar as placas do fundo.
- **A laje da porta some quando a porta abre de todo** (`buildDoor`, `kit.ts`). Lá em cima ela fica atrás da parede, mas aparecia por cima de
  paredes finas ou mais baixas que 5,5 m.
- **O roteiro visual dos capítulos**, da borda ao centro do dado, está em `DIRECAO_DE_ARTE.md` §9.
- **Ferramentas fora do jogo**: a prévia `?vitrine=bib` (estantes, velas, candelabro e candidatos a Escrivão animados; os modelos CC0 ficam em
  `public/models/_vitrine/`, fora do repositório) e a exportação do Escrivão para o Mixamo (`tools/escrivao_mixamo.ts` e `.py`).

## 68. O mouse no PC e o monitor ultrawide (pedido do Pedro, 3440×1440)

- **O mouse não ficava preso.** No PC, o olhar segue o mouse sem clicar porque o jogo pede ao navegador para prender o cursor (pointer lock).
  O navegador só aceita esse pedido logo depois de um clique ou tecla. O fim da transição de "Novo jogo" pedia sem clique, o navegador recusava,
  e o jogo tratava essa 1ª recusa como "este navegador não deixa": ficava no modo segurar e arrastar, com o cursor à vista, até recarregar a
  página.
- **Agora:**
  - uma recusa só mostra o aviso "Clique para jogar", e o próximo clique pede de novo;
  - "Novo jogo" já pede dentro do próprio clique;
  - o jogo só desiste depois de 3 recusas seguidas a cliques do jogador, se o mouse nunca chegou a ficar preso; se já ficou preso alguma vez,
    nunca desiste;
  - a mesma recusa chega duas vezes (pela promessa e pelo evento `pointerlockerror`) e conta uma vez só (`askLock` em `scene.ts`).
- **A tela larga dava zoom.** O campo de visão era fixo na horizontal (95°), então numa tela 21:9 a imagem ficava mais "perto": 49° na vertical,
  contra 63° numa tela 16:9.
  - Agora a vertical é a mesma de uma tela 16:9, e a tela larga mostra MAIS dos lados (Hor+): 63° na vertical e 111° na horizontal em 21:9.
  - Para não distorcer as bordas, a horizontal tem limite de 125° (32:9 fica com 57° na vertical).
  - No 16:9 e no celular nada muda.
- **A resolução** continua sendo a do pixel (cerca de 280 linhas no PC, `pixelLines`): a 1440 px de altura são 288 linhas, a mesma densidade de
  uma tela 1080p. Quem quiser mais definição usa Configurações → Imagem → Tamanho do pixel → Fino (360 linhas).
