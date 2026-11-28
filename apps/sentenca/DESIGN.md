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
- **O capítulo 1 é só o Fogo** (`progress.ts`; mudado a pedido do Pedro, §77). Antes o dado começava com Fogo e Peso. Agora o Peso fica
  selado até o fim do capítulo: o dado entra no altar do Tribunal e volta com ele. A 3ª face (Eco, no lugar de Ricochete) só chega bem depois.
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
  (Substituído pelo §84: o Peso chega no fim do capítulo 1 e o giz, com o Escrivão de perto, no MEIO do capítulo 2.)

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
- **O zoom só depois de olhar para cima** (pedido do Pedro): o olhar subia até a boca do poço e o zoom começava junto, então a câmera "dava
  zoom" ainda olhando para o chão. Agora o olhar sobe sem zoom e, já lá em cima, um zoom leve (44°, era 32°) empurra devagar para a luz, antes
  do corte para fora; o mesmo quando ele olha de novo e o Escrivão sumiu. **O dado caído** aparece com um zoom leve (42°; era 20°, mais de três
  vezes): ainda se vê o rosto dormindo, o acordar e o balão. Testado no PC e no celular (`__mdd.opening().fov`: o campo de visão fica no normal
  enquanto o olhar sobe).

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
- **O caderno achado (sala 2).** O jogador começa **sem diário**: o botão some e os avisos "avistado" não aparecem, mas os símbolos vistos ficam guardados em silêncio. No Vestíbulo, um caderno caído (desde o pedido do Pedro: exposto, no meio do chão do primeiro tramo, logo depois da entrada, e já dá para pegá-lo; antes ficava no escuro ao pé da coluna esquerda e só aparecia com o 1º braseiro aceso). Se o jogador passa direto para dentro do salão ou acende um braseiro sem pegá-lo, o dado olha para ele e fala («VOCÊ VER LIVRO», «VOCÊ PEGAR LIVRO», com rabiscos novos de livro e de mão pegando em `sketch.ts`); "E · Pegar o caderno"; o dado diz «VOCÊ ESCREVER LIVRO», «VOCÊ ABRIR LIVRO»; **o botão do diário aparece pela 1ª vez pulsando em dourado e a tela escurece** (`ui.bookCall`, `.book-call`); se o jogador demora 8 s, o dado repete. Ao abrir, **modo guiado** (`ui.guided`): o livro vira sozinho até BRASEIRO, o campo de anotação pisca e o livro **não fecha antes de o jogador escrever alguma coisa** (o diário não corrige); fechando, o dado diz «EU SENTIR ALEGRIA». A porta da sala 2 só abre depois de pegar o caderno. Marco novo `caderno` (quem já tinha passado da sala 2 em jogos salvos antigos ganha o caderno sozinho). `?demo` e `?lab` continuam com o diário.
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
conferir antes se «Sentença» está livre na Steam e nas lojas. (Depois: o nome mudou para «Sentença» no §89, e o ícone virou o dado 2D da
tela de carregamento no §90.)
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

### 67.1 A varredura das demais salas

Três ajudantes andaram pelas 24 salas procurando defeitos de cenário. Nenhum conserto muda solução, posição de braseiro, frase, lousa ou
soquete; os verificadores (`tools/verify_*.mjs`) continuam passando.

- **O fim do capítulo** (O Tribunal dos Rumores): a porta da última sala abria para um corredor que dava no vazio. Agora ela tem a luz de saída
  (`FireSpec.last`) e chegar ao fundo do corredor encerra o capítulo (`exitReached`).
- **Tochas de enfeite por cima das escritas.** Uma regra geral, no fim da montagem de cada sala (`kit.clearTorches`): toda tocha de parede que
  fica a menos de 2,2 m de uma tocha de constelação, a menos de 1,4 m de uma lousa ou a menos de 1,3 m de um braseiro é afastada pela parede;
  se não houver lugar, sai. Foram 29 tochas movidas e 3 tiradas, nas salas 3, 4, 7, 9, 16, 17, 19, 20, 22 e 23. As tochas que fazem parte de
  puzzle (constelações) não se mexem nunca.
- **A porta-lousa de A Lousa**: os lampiões de bronze ficam à frente da parede e subiam com a laje, passando por cima da frase
  «ACENDER ▢ BRASEIRO» e ficando à mostra lá em cima. Agora a porta-lousa some (a luz dela também) quando a laje começa a entrar na parede.
- **Salas já resolvidas ao carregar um jogo** (`skip()`): a grade do meio de A Lousa e a grade de O Que a Casa Confirma ficavam fechadas, e os
  pilares que sobem do chão ficavam embaixo. Quem carregava um jogo mais adiante e voltava dava com o caminho fechado. Agora tudo fica como
  depois de resolvido (`FireExtra.skip`).
- **A Galeria**: a verga da passagem da câmara era funda e alta demais e cobria, de baixo, a frase «ACENDER BRASA ORDEM» logo acima. Ficou mais
  fina e mais rasa. A poeira no feixe de lua ficou mais rala.
- **Os Banhos Secos**: as passagens das câmaras de banho eram só o recorte de duas folhas de parede. Ganharam batentes e verga de pedra lavrada.
- **Os Nichos e a Cisterna**: o teto do pátio tinha tijolos minúsculos (a escala da textura estava errada); a janela de grade mostrava a galeria
  de lá sem teto, e de perto via-se o vazio. Ganhou teto.
- **O Fio de Fogo**: a plaquinha do segredo e o soquete frio boiavam acima do parapeito. Ganharam um pé de pedra, sem sair do lugar.
- **Os Que Dizem o Mesmo**: as colunas do claustro atravessavam o telhado das galerias e subiam soltas no céu aberto. Agora param no telhado
  (`FireSpec.pillarH`).
- **A Antecâmara Fria**: a moldura vazia encostava na imposta do batente da porta; foi 4 cm para o lado, com o soquete.
- **Portas de parede grossa** (Vestíbulo e Galeria): o corredor atrás da porta começava dentro da espessura da parede, e as duas faces
  piscavam. A pedra-chave do arco também encostava na parede. Os dois ganharam folga.
- **Ficam para o Pedro decidir** (mexem perto de puzzle ou de circulação): os furos da tela de A Sombra aparecem também atrás; a moldura de
  A Sombra quase toca a pedra-chave; a frase da porta de Os Apelidos é mais larga que o trecho reto da parede; a frase da porta de A Memória da
  Casa fica escondida atrás do anexo C para quem entra; canaletas soltas no ar em O Fogo que Corre; o patamar sem parapeito em A Escadaria; um
  pilar no caminho em O Pano; a pedra-chave encostando no teto nas salas de 3 m; e o Vestíbulo ficou mais escuro que o mockup aprovado desde as
  sombras do §64.

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

## 69. As 21 gemas, o fundo do caderno e a cena da gema (decidido com o Pedro)

- **Quantas.** São **21 gemas no jogo todo**, a soma das faces de um dado (1+2+3+4+5+6): os furos, os pontos do dado. Por capítulo: **3, 3, 3, 4,
  4, 4** (o capítulo 1 é o que tem menos). Registro em `src/story/gems.ts`; o caderno guarda as gemas por id, na ordem em que foram achadas
  (`diary.gems`, `diary.addGem`).
- **O capítulo 1** fica com três: a da **Cisterna** (sala 5, o reflexo na água), a da **Ala do Papel** (sala 11, os três livros de boato) e a da
  **constelação C6** (sala 21). Uma por terço do capítulo, cada uma de um tipo de segredo. Os outros **11 segredos** (que davam gema) continuam iguais,
  mas guardam **folhas arrancadas dela**, p8 a p18, escritas pelo `narrador` (`src/story/herpages.ts`; o caderno tem 18 folhas dela). O nicho
  (`makeGemNiche`, `firegrid.ts`) recebe o id do que guarda: `'pN'` é folha, o resto é gema; se o jogador já pegou, ele abre vazio.
- **O fundo do caderno.** No fim do caderno (depois das Notas, e no índice, "Gemas n/21") as folhas acabam: à esquerda a guarda solta (o papel vinho
  da contracapa, sem etiqueta, com a seta e o índice em ouro para voltar) e, à direita, a **parte dura da capa de trás**: uma placa de couro reta (o
  bloco de folhas da direita some) com o **dado aberto em cruz** talhado e **21 furos** com aro de latão (`drawGemBoard`, `book/bookart.ts`). A cruz
  é a planificação certa (1, 2, 6, 5 no meio; 3 e 4 nos braços; as faces opostas somam 7). As gemas enchem os furos **em ordem, não por sala**: a 1ª
  fecha a face 1; a 2ª e a 3ª, a face 2; da 4ª à 6ª, a face 3; e assim até a 21ª. Face completa ganha um fio de ouro e os sinos tocam.
- **A cena da gema** (`src/scene/gemscene.ts`), pedida pelo Pedro: ao pegar, a gema sai de onde estava e vem até perto dos olhos, girando, maior;
  brilha; encolhe um pouco e clareia; **estala e se desfaz num pó de luz pontilhado**; o caderno sai sozinho da bolsa, **aberto direto no fundo**; o pó
  corre em fio, por uma curva, até o próximo furo; a gema se refaz ali com um anel de luz; o caderno volta para a bolsa (e, da próxima vez que o
  jogador o abrir, abre na página onde ele tinha deixado). Tudo na cena do livro (o canvas em resolução cheia), com uma gema lapidada (coroa e ponta)
  no lugar do octaedro do nicho. **A 1ª vez é a cena inteira (~4,5 s); as outras, a mesma mais rápida (~2,5 s)**; qualquer toque ou tecla pula para o
  encaixe. Durante a cena o jogador fica parado, a mira some e os botões de toque do dado também (eles somem também com o caderno na mão).
- **Som** (só gravações e instrumentos reais): celesta subindo e o sino de vidro quando ela vem (`gemShine`); o vidro estalando em tom alto, um
  glockenspiel agudo e o ar levando o pó (`gemBreak`); um toque de latão e a harpa no encaixe (`gemSet`); os sinos tubulares quando uma face se
  completa (`gemFace`). O `sonoplasta` pode refinar.
- **Salvamento.** O resumo do espaço guarda `gems` (a tela de espaços mostra o número). Saves de antes não são convertidos (só o Pedro testa por
  enquanto).
- **O epílogo** das 21 (depois de qualquer um dos três finais; volta ao poço com a boca VAZIA lá em cima, decidido pelo Pedro; um New Game Plus fica
  para bem depois) e os **21 furos redondos** nos tetos estão no `HISTORIA.md`. A regra dos furos para a
  arte está no `DIRECAO_DE_ARTE.md` §9: só contam os furos REDONDOS de luz no teto; precisam ser exatamente 21 no jogo todo. Espalhados pelo
  `cenografo` no §72 (seis salas, uma face cada; as faces 5 e 6 ficam para o capítulo 2).
- **Conserto (visto pelo Pedro jogando): a cena era pulada no mesmo aperto que pegava a gema.** O E (ou o toque no AGIR do celular) começava a
  cena e, no mesmo instante, chegava também ao "pular cena" do jogo, que pulava direto para o encaixe (o caderno mal abria). Agora a cena só aceita
  pular depois de começar (0,35 s) e segurar a tecla não conta como aperto novo. Testado com a tecla E de verdade: antes, a cena durava um instante
  e o caderno não chegava a abrir; agora toca inteira.
- **Teste**: `window.__mdd.gem(id, primeira)` toca a cena com uma gema à frente dos olhos; `window.__mdd.gemState()`.

## 70. O Escrivão animado (cenógrafo, animações do Pedro no Mixamo)

- **O que é.** O mesmo Escrivão de `scribe.ts`, assado numa malha só (`tools/escrivao_mixamo.ts`), com o esqueleto e as animações que o Pedro fez no
  Mixamo: *Start Walking* (andar) e *Standing Torch Inspect Downward* (olhar para baixo). Arquivo: `public/models/escrivao.glb` (424 KB), refeito por
  `tools/escrivao_glb.py`. Código: `src/scene/scribeRig.ts`, com a mesma interface do de código (`Scribe`): as cenas não mudaram.
- **Onde aparece.** Na cena do poço (ele chega andando, se debruça na mureta, tira o dado do manto, estende o braço sobre o furo e solta) e na
  galeria vista pela janela de grade dos Nichos. Sentado na Galeria dos Condenados e no escritório da Biblioteca continua o de código (não há
  animação de sentar). `?escrivao=antigo` volta ao de código em tudo; enquanto o arquivo não chega, aparece o de código.
- **Como as animações viram a pose do jogo:**
  - **andar**: o *Start Walking* é a partida (parado → dois passos). O jogo recorta o ciclo estável (1,15 s a 2,48 s; hoje 1,067 s + 1,484 s, §78), costura o fim no começo
    (0,3 s) e tira o avanço da raiz (quem move o Escrivão é o jogo); o passo acompanha a velocidade pedida (a túnica no quadril e os braços junto do corpo: §81);
  - **debruçar**: a inclinação escolhe o quadro do *olhar para baixo* (0 = de pé, 1 = debruçado aos 1,78 s); parado debruçado, um vaivém lento
    até 2,35 s. A animação original segura uma tocha na mão esquerda: aqui essa mão fica sempre por código (junto do corpo, ou pousada na borda);
  - **mão direita** (às costas, para dentro do manto; estendida sobre o meio do poço, a 1 m do corpo e 1,5 m do chão, de onde o dado cai) e
    **cabeça** (giro somado) por código, com dois ossos (braço e antebraço);
  - **olhos**: os dois quadrados acesos e o halo, presos ao osso da cabeça, nas mesmas medidas do de código;
  - **pano**: Lambert com o brilho próprio de ~25% da cor, como o de código.
- **Consertos no caminho.** A tampa de trás do capuz saía cinza: no Escrivão de código ela não tem mapeamento de textura e o assado a pintava de
  branco. A textura foi repintada e a ferramenta não repete o erro. O mixer do three só reescreve um osso quando a animação muda: numa pose parada,
  o giro somado por código se acumulava (a cabeça virava para trás); agora os ossos mexidos voltam à pose da animação a cada quadro.
- **Prévia**: `?vitrine=escrivao` mostra os dois lado a lado (parado, andando, debruçado, erguendo o dado, e os dois girando). Para testar a cena do
  poço: `?titulo=0&intro=poco` (pula o acordar, sem o dado) e tentar abrir a porta.
- **Créditos**: tela de Créditos e `public/audio/CREDITS.txt` (Mixamo, Adobe).

## 71. Os móveis da Biblioteca (cenógrafo; o Pedro pediu que o cenógrafo escolhesse)

- **Escolhidos na vitrine** (`?vitrine=bib`): as estantes com livros velhos (Paul Wortmann, CC0; as 4 versões), o atril, os livros, a pilha e o
  pergaminho da Quaternius (CC0), as velas da AnyRPG (CC0) e o candelabro de chão de Marco Antonio Meireles Carvalho (domínio público, com o crédito
  pedido). Ficaram de fora a estante e a prateleira em arco da Quaternius (outro estilo) e os lustres. Arquivo: `public/models/props_bib.glb`
  (590 KB), montado por `tools/biblioteca_glb.mjs` (sem os mapas de relevo, texturas WebP de até 256 px).
- **Onde ficaram:**
  - **Ala do Papel**: duas estantes em cada parede dos lados, no lugar das lombadas pintadas. A parede do fundo continua só com os seis livros que
    mentem e o nicho;
  - **Átrio**: em cada parede, dois pares de estantes entre as passagens, com um atril no meio (embaixo da tocha alta), longe das lamparinas de
    parede da constelação;
  - **mesas de leitura**: um objeto pequeno em CADA uma (pilha, livro fechado ou pergaminho), na ponta longe da lamparina. Nenhuma mesa se destaca,
    porque as mesas são as casas da constelação C-Bib;
  - **escritório do Escrivão** (atrás da grade): uma estante, o candelabro num canto, uma pilha de livros e velas na mesa e na estante onde ele
    escreve.
- **O que não entrou, de propósito:** chama nova fora do escritório. No Átrio, na Aula e na Ala do Papel, acender é o puzzle (as lamparinas da
  constelação, as lousas, os livros que queimam); uma vela acesa ali seria uma pista falsa. As velas e o candelabro do escritório estão apagados.
- Estantes: 1,9 m de altura, o fundo achatado para 45 cm (o modelo tem 70), com colisão para o jogador e o dado. A madeira, muito escura, ganhou
  um pouco de cor e um brilho próprio fraco, para se ler no canto escuro do Átrio. Todos os objetos viram poucas malhas (`bakeProps`).

## 72. Os 21 furos espalhados (cenógrafo; tarefa do §69)

- **A regra** (decidida pelo Pedro, `HISTORIA.md` e `DIRECAO_DE_ARTE.md` §9): exatamente 21 furos REDONDOS de luz nos tetos do jogo, os pontos do
  dado; o Poço é o do UM; quase todos nos capítulos 1 e 2, nenhum do 3 em diante. Frestas, janelas, pátios e o claustro não contam.
- **Como ficaram: seis salas, cada uma com os furos no desenho de uma face** (1+2+3+4+5+6 = 21). Casa com a folha p7 dela ("buracos redondos no
  teto, sempre um, dois...") sem mudar texto nenhum, e o jogador atento pode notar o padrão:

  | Face | Furos | Sala | Onde |
  |---|---|---|---|
  | 1 | 1 | O Poço (sala 1) | o próprio poço |
  | 2 | 2 | A Biblioteca (sala 11) | em diagonal, cada um em cima de um cruzamento dos corredores entre as mesas (antes era um óculo só, no meio) |
  | 3 | 3 | Os Nichos e a Cisterna (sala 5) | em diagonal, o do meio em cima da cisterna (antes era só esse) |
  | 4 | 4 | Os Banhos Secos (sala 9) | em quadrado, na metade oeste, em cima do corredor entre a piscina rasa e a média (antes não havia) |
  | 5 e 6 | 11 | capítulo 2 | ainda não existe ("furos mais estreitos e raros") |

- **Puzzles**: nenhum furo ilumina o que é de puzzle.
  - Na Biblioteca, a luz cai igual entre quatro mesas, porque as mesas são as casas da constelação C-Bib.
  - Nos Banhos, os furos ficam longe da piscina funda: os quatro braseiros de lá, em quadrado, são o puzzle de "exatamente DOIS", e quatro luzes ao
    lado deles seriam uma pista falsa.
  - Na Cisterna, os dos lados ficam a mais de 2 m dos braseiros dos cantos.
- **A mesma cara** (`src/scene/skyhole.ts`): o furo redondo (raio 1,2 m, o do Poço) com um aro de pedra lavrada, um tubo curto de alvenaria, o céu
  claro lá em cima, uma luz fria e a poeira caindo no facho. O Poço ganhou o mesmo aro (`holeRim`). O cone de luz aditivo do Poço não foi copiado:
  com o teto alto e visto de lado, ele virava uma coluna cinza sólida no pixel.
- **Quem mexer** numa sala com furo, ou fizer as do capítulo 2, atualiza esta tabela e o comentário do topo de `skyhole.ts`.
- **Substituído pelo §73** (decidido com o Pedro): os desenhos de face no teto de uma sala só entregam fácil demais que a Casa fica dentro de um
  dado. No §73 cada furo fica solto, num teto de uma sala, e as faces só aparecem no mapa. Desde o passo 4 do §73 (feito), o código segue o §73.

## 73. O level design novo: a planta do capítulo 1 (proposta, Etapa 1; pedido do Pedro)

- **O problema** (Pedro): o mundo era uma fila. Toda sala tinha a entrada na frente e a porta no meio do fundo, a próxima ficava logo atrás e o
  jogador "sempre ia para a frente": sem virar, sem porta de lado, sem bifurcação, sem atalho de volta. O mapa do caderno era uma "cobra"
  automática, com as salas do mesmo tamanho.
- **O que fica:** o caminho continua sendo uma progressão só, na ordem da história (nada de escolher a ordem das salas). O que muda é a FORMA:
  - o caminho vira, sobe e desce;
  - as salas são giradas e algumas portas e entradas vão para as paredes dos lados;
  - os corredores têm cotovelo;
  - há desvios opcionais e atalhos secretos de volta (fechados agora, para abrir depois);
  - o mapa segue o 3D exatamente (ele vai sair das posições reais das salas).
- **A planta proposta** (`tools/planta/planta_cap1.py`; dados de cada sala em `tools/planta/salas.json`):
  - **térreo:** uma espiral em volta da Biblioteca, que vira o centro. Começa no Poço (sudoeste), sobe pelo oeste (Vestíbulo, Lousa, Fio),
    passa pela Cisterna (noroeste), corre pelo norte (Casa Escreve, Chama Curta), desce pelo leste (Confirma, Banhos) e entra no centro (Pano,
    Biblioteca). Os Apelidos e a Ponte ficam no miolo do leste; a Ponte desce o fosso até o subsolo;
  - **subsolo** (8 m abaixo): outra volta, por baixo (Boato Verdadeiro, Galeria, Sombra, Escuro, Lei Pequena), até a Escadaria;
  - **o reencontro:** a Escadaria sai na passarela alta do Átrio da Biblioteca, aquela "sem acesso: as escadas desabaram". O jogador vê de cima
    onde já esteve, e uma ponte alta leva às últimas salas;
  - **as últimas salas** (2,5 m acima do térreo), em cata-vento em volta do claustro (21): Fogo que Corre, Antecâmara, Memória, Tribunal;
  - **atalho:** do Tribunal ao Poço (secreto, fechado);
  - **desvios opcionais:** dois lugares para salas pequenas de segredo, um ao norte da Chama Curta e outro no subsolo, ao lado da Galeria.
    Continuam os desvios que já existem dentro das salas (alas e escritório da Biblioteca, câmaras dos Banhos, galeria da Cisterna, anexos da
    Memória, câmara da Galeria).
- **Os furos** (substitui o desenho por sala do §72): 21 no total, um por sala, soltos no teto. No mapa, os de cada grupo formam uma face. A
  divisão pelos capítulos foi decidida com o Pedro: o código atravessa o jogo inteiro (5 ou mais capítulos, 6 a 8 horas), um desenho novo por
  capítulo depois do primeiro:

  | Capítulo | Faces | Furos | Onde (no capítulo 1) |
  |---|---|---|---|
  | 1 | 1, 2 e 3 | 6 | 1: o Poço; 2: o Fio e a Lousa (diagonal curta); 3: a Cisterna, a Biblioteca e os Banhos (diagonal longa, a Biblioteca no meio) |
  | 2 | 4 | 4 | |
  | 3 | 5 | 5 | |
  | 4 | 6 | 6 | |
  | 5 em diante (o centro) | — | 0 | |

  - O capítulo 1 ensina: quem olha o mapa vê "1, 2, 3". Cada capítulo seguinte traz um desenho a mais, maior e mais difícil de enxergar.
  - Nos capítulos fundos, o furo continua redondo, com o mesmo aro, mas vira um poço comprido e estreito, com um céu pequeno lá em cima (menos
    luz de fora, como pede a descida para o centro do dado).
  - No capítulo 1, o subsolo e as salas do claustro não têm furo. Assim, nenhuma sala com cal (que só aparece no escuro de punição) tem céu claro.
- **As etapas:**
  1. esta planta;
  2. o motor (salas com posição e giro, portas que dizem para onde levam, sala achada pela posição no plano, mapa gerado do 3D, salvamento
     pelo nome da sala);
  3. as portas de lado e os corredores com cotovelo e escada, mexendo em puzzle só onde for preciso, com verificador e `PUZZLES.md`;
  4. os furos;
  5. o teste completo.
- **Passo 2, feito (o motor):**
  - **onde cada sala fica:** `src/scene/place.ts`. Cada sala continua construída nas coordenadas dela; o motor a põe no mundo com uma
    posição e um giro em quartos de volta (`Place`). Toda conversão entre o mundo e a sala passa por ele: posição, direção, ângulo de olhar,
    retângulos de colisão, a mira, o dado (posição e velocidade), as escritas (a normal também gira), o giz, as luzes e as cenas. O Poço fica
    sempre na origem e sem giro (a abertura e a tela inicial contam com isso);
  - **em que sala está um ponto:** `roomAt`, pela caixa da sala nas coordenadas dela (entre a entrada e o fim do corredor da porta, dentro da
    largura e da altura dela). Duas salas no mesmo ponto, uma por cima da outra: fica a do jogador;
  - **os corredores de ligação:** `src/scene/connector.ts`. Quando a entrada da próxima sala não fica na ponta do corredor da porta, o motor
    completa o caminho com um corredor de pedra do mesmo corte (1,9 m × 2,65 m): reto, em L, em Z ou em U, sempre em ângulo reto. Ele
    sai reto da porta, vira e chega reto (2 m) na entrada. Ele tem chão, teto, paredes e colisão, e pertence à sala da porta. A regra do
    caminho é a mesma da ferramenta da planta;
  - **a planta é a fonte:** `tools/planta/planta_cap1.py` grava `src/scene/planta.json` (a origem e o giro de cada sala, pelo nome) e o
    desenho. Ela também alinha sozinha as salas quase alinhadas (um degrau de lado de menos de 1,5 m num corredor fica feio) e avisa salas
    sobrepostas e corredores que atravessam salas. A altura de cada sala continua saindo da anterior (porta de saída = entrada da seguinte);
  - **`?planta=1`** (até o passo 3; hoje a planta é o padrão e `?planta=0` volta à fila): monta o mundo pela planta (prévia). Sem isso, o mundo continua em fila, idêntico ao de antes (conferido sala por sala:
    posições e imagens iguais). A prévia só fica certa no passo 3: hoje as salas ainda só têm a porta do fundo e a entrada da frente, então
    onde a planta pede porta de lado o corredor dá voltas ou atravessa a sala;
  - **o mapa do caderno sai do 3D** (com `?planta=1`): cada sala é a caixa dela, no lugar dela; cada corredor, o caminho dele, da porta à
    entrada. O mapa fica deitado nas duas páginas, com o norte do mundo para a direita. Tem dois andares, o térreo (com o claustro) e o
    subsolo (abas T e S), e o fosso e a Escadaria aparecem nos dois. Sem a planta, o mapa em cobra de antes;
  - **o salvamento** grava a posição E o ângulo locais à sala (e acha a sala pelo nome): o jogo salvo continua valendo quando a sala muda de
    lugar ou de giro;
  - **testes:** `__mdd.placeIn(sala, x, z, ângulo, inclinação)` (ponto local da sala), `__mdd.connectors()` e `__mdd.mapImage(andar)` (o mapa
    com tudo visitado). A sala 20 foi 4,6 m para o oeste na planta (o corredor dos Banhos ao Pano passava por baixo dela).
- **Passo 3, feito (as portas de lado):**
  - **portas e entradas em qualquer parede** (`kit.ts`: `doorFrame`/`entryFrame`). A porta e a entrada de sempre são montadas num QUADRO: a
    origem no meio do vão, girado para a parede escolhida (fundo, esquerda ou direita; a entrada: frente, esquerda ou direita) e em qualquer ponto
    dela. Elas devolvem onde ficaram (`door.exit`, `entrance.entry`), e a sala passa isso ao motor (`Room.exit`/`entry`). O casco comum
    (`roomShell`) e o construtor das salas de fogo (`fire.ts`) fazem isso sozinhos: a parede do lado ganha a peça da porta e o fundo fica liso.
    O rodapé e a faixa de sombra das paredes deixam o vão; há batente para parede do lado (`batenteX`);
  - **a sala pergunta à planta** de que parede sai (`plan.ts`, `planDoors`), e a ferramenta da planta usa o lugar de verdade de cada porta
    (o jogo o exporta para `tools/planta/salas.json`);
  - **o que mudou em cada sala** (nenhuma solução mudou; os verificadores passam):
    - **A Lousa:** a porta-lousa (os nove pontinhos de bronze) foi para a **parede esquerda, perto do fundo**. A frase «ACENDER ▢ BRASEIRO» fica no
      meio do fundo (na parede do lado a abóbada começa a 3 m e a cobriria). O braseiro do meio da parede esquerda (que ficaria na frente da
      porta) foi para o meio do fundo: os três da frente ficam em fila embaixo da frase. A conta continua QUATRO, com o do nicho atrás de quem entra;
    - **O Vestíbulo:** a saída fica na **parede direita, no 1º tramo** (logo à direita de quem entra). No fundo, ela cairia em cima de um braseiro
      do «ACENDER DOIS» e embaixo da fresta. A tocha da direita foi para perto da entrada. O fundo ficou inteiro, com a frase;
    - **Os Nichos e a Cisterna:** entra-se pela **parede direita da 1ª célula** do corredor (a frente dela virou parede);
    - **Os Banhos:** a saída fica na **parede direita**, no chão do salão, entre a coluna e a piscina funda (a piscina funda é o puzzle; a porta
      não podia dar na beirada estreita dela). Uma tocha deslizou;
    - **A Antecâmara:** a saída fica na parede direita, perto da frente, com a moldura no canto do fundo ao lado dela;
    - **A Memória:** a saída fica na parede direita, no **canto do fundo, fora da câmara B** (onde estão as frases e a tocha da câmara);
    - **A Escadaria:** uma **galeria estreita no alto**, no nível do patamar alto, corre ao longo da parede esquerda (por cima do lance B e do
      patamar da frente) até a frente, e a porta fica nela, de lado. A mureta da galeria só barra quem está nela (motor: obstáculo com
      **altura de pé**, o 6º número do retângulo), e quem sobe pelo lance B passa livre por baixo. A porta dos seis pontos continua no patamar alto;
    - **A Biblioteca e a ponte:** a porta da Escadaria dá direto num **vão em arco no fundo da passarela baixa da esquerda** do Átrio. As
      passarelas baixas desceram de 4,6 para 4,0 m (a altura da saída da Escadaria), e o lance quebrado pendurado ficou embaixo delas. O
      jogador anda a passarela inteira, vendo de cima as mesas por onde passou, e sai por um **vão igual na frente**. De lá, uma **ponte**
      (corredor alto, 2,5 m acima do térreo) segue 15 m e vira até a entrada do Fogo que Corre. No motor, é um corredor de ligação com um
      **trecho aberto** (`planta.json`: `pontes`): no trecho aberto não há paredes (são as da Biblioteca), só o chão e um parapeito que barra
      quem está na passarela. A Biblioteca fica desenhada enquanto o jogador está no caminho;
    - **A Chama Curta e o Fogo que Corre** ficaram com a porta de sempre: na Chama Curta, a porta do lado cairia na frente do braseiro MÉDIO
      (do puzzle); a planta mudou em volta deles;
  - **a planta reorganizada** (a mesma espiral; as salas andaram alguns metros): com o corredor de verdade da porta (3,2 m) e a chegada reta (2 m),
    algumas salas estavam perto demais (os Apelidos e a Ponte, as salas do claustro) e alguns corredores voltavam para trás. O claustro foi
    alinhado embaixo do Fogo que Corre; a Escadaria foi para o norte da Biblioteca, alinhada com a passarela; a Cisterna, a Casa Escreve, a
    Lousa e o Fio andaram um pouco;
  - **o motor:** paredes de uma sala que fica embaixo (ou em cima) de outra não contam acima do teto dela (o subsolo fica embaixo da passarela);
    a regra do caminho põe a volta na ponta do corredor da porta quando o espaço é curto e nunca faz trecho torto;
  - **a ferramenta da planta** avisa: salas sobrepostas, corredor (com as paredes) encostando em sala, corredor que volta para trás, porta
    encostada demais na entrada seguinte; e alinha sozinha o que ficou quase alinhado (até 2 m);
  - **testes:** `__mdd.paths()` (cada ligação no mundo), `__mdd.look(ângulo, inclinação)`, `__mdd.rectsNear(x, z)` e a travessia (andar de cada
    porta, pelo corredor, até dentro da sala seguinte);
  - **a planta nova é o padrão.** `?planta=0` volta à fila antiga (para comparar; o jogo salvo vale nas duas, porque a posição é gravada
    dentro da sala). O que ainda é do passo 2 e vale aqui: o mapa sai do 3D; as salas que não são um retângulo (a Cisterna, a Biblioteca, os
    Banhos) aparecem no mapa com a forma de verdade (`Room.mapRects`: os retângulos do chão, nas coordenadas da sala).
- **Passo 4, feito (os furos do capítulo 1):** um furo por sala, solto no teto, em seis salas; o desenho das faces só aparece no MAPA do caderno,
  que marca cada furo (um círculo pequeno de tinta com o céu claro dentro, do tamanho do furo com o aro; `Room.skyHoles`, `drawHoles` em
  `pages.ts`). Os da Biblioteca (eram 2), da Cisterna (3) e dos Banhos (4) do §72 viraram um só em cada; o Fio e a Lousa ganharam o seu.

  | Face | Sala | Onde (na sala) | Por quê |
  |---|---|---|---|
  | 1 | O Poço | o próprio poço | sozinho no canto do mapa |
  | 2 | A Lousa | no meio da abóbada, entre as duas colunas, no lugar do arco de reforço do meio | a luz cai no chão do meio, longe das lousas, da porta-lousa e dos braseiros |
  | 2 | O Fio de Fogo | na frente, à esquerda de quem entra, em cima do pé da escada que sobe | longe dos nove braseiros do chão (luz em cima de um deles seria pista falsa) e das lousas do balcão |
  | 3 | Os Nichos e a Cisterna | em cima da boca da cisterna (15 cm a leste e 70 cm ao norte do centro) | |
  | 3 | A Biblioteca | na frente, à direita de quem entra, a mais de 6 m das mesas | as mesas são as casas da constelação C-Bib; a luz desce rente ao parapeito das passarelas, sem tocá-las |
  | 3 | Os Banhos Secos | no fundo, à direita de quem desce, ao lado da coluna e da câmara do leste | a ~5 m dos braseiros da piscina funda (o puzzle de "exatamente DOIS") |

  - **A face 3 é uma diagonal exata:** 45° no mapa, 29,4 m entre um furo e o outro, a Biblioteca no meio. Ela atravessa o mapa inteiro, do
    noroeste ao sudeste, passando pelo centro da espiral.
  - **A face 2 ficou um par lado a lado, não em diagonal.** Com a planta de hoje, o Fio fica quase em cima da Lousa no mapa. Em diagonal no
    sentido da face 3 o par não cabe (a inclinação máxima seria 12°). No outro sentido cabe (até ~40°), mas aí o Poço, a Lousa e o Fio ficam em fila
    e com o mesmo espaço entre si, e os três leriam como um "3". Lado a lado, o par fica mais perto um do outro (15 m) do que do Poço (24 m).
    Para uma diagonal de verdade, o Fio teria de andar uns 15 m para o oeste na planta (corredores e travessia de novo): fica como opção.
  - **A Lousa** tem abóbada baixa: o furo vaza a abóbada (o shader descarta o que cai dentro do círculo, visto de cima), o arco de reforço do meio
    não é feito, e o aro, o lábio e a boca do tubo acompanham a curva (`skyHole(..., { ceil })`). O teto plano do casco ganhou o furo também
    (`roomShell({ skyHoles })`).
  - **"Aqui" por fora da sala** (pedido do Pedro): o quadradinho vermelho de dentro da sala saiu. Agora a sala atual fica com o amarelo mais
    forte e, do lado de fora, num pedaço vazio do papel, vem escrito em vermelho «aqui» (uma palavra só: o «você está / aqui» em duas linhas
    tomava mais papel do que muitas salas), com uma seta CURVA curta até a sala (a seta reta é palavra da língua da Casa, `INTERFACE.md` §6). O
    lugar é o mais perto da sala onde a palavra fica só em papel (sem cobrir sala, corredor nem a dobra do livro); nas salas do miolo a seta cruza
    um corredor. O «aqui» **pisca devagar** (aceso 1,2 s, apagado 0,5 s) com o caderno aberto no mapa: o vermelho é também uma caneta do jogador,
    e o que pisca é do caderno, não dele (`placeHereNote`/`paintHereNote` em `pages.ts`; o piscar em `book3d.ts`, `view.hereOff`). Conferido nas 24
    salas, nos dois andares, e no caderno aberto de verdade.
  - **Teste:** `__mdd.skyHoles()` (os furos no mundo).
- **Passo 5, feito (o teste completo do capítulo 1, com a planta nova):**
  - **corredores e portas:** as 23 ligações, andando de dentro de cada sala, pela porta e pelo corredor, até dentro da seguinte, com uma foto em
    cada ponto (a porta, o fim do corredor da porta, cada curva, a chegada e a entrada vista de dentro). Nenhum buraco, luz vazando ou peça
    boiando; todas passam (a da Escadaria pela passarela e pela ponte);
  - **jogada contínua:** uma sessão só, do Poço ao Tribunal, pelas portas, no PC (1280×720) e no celular (844×390): as 24 salas, nenhum erro,
    a memória igual do começo ao fim (sem vazamento), e o **salvamento automático** gravando cada sala ao entrar;
  - **salvar e carregar de verdade:** numa sala girada (volta no lugar, a 5 cm, do empurrão de parede) e na ponte alta depois da passarela
    (volta lá em cima, na altura certa, sem cair);
  - **puzzles:** A Lousa (a única sala em que peças do puzzle mudaram de lugar) resolvida dentro do jogo; nas outras só a porta mudou de
    parede, e ela abre pelo mesmo caminho do código quando o puzzle é resolvido; os verificadores passam;
  - **atenção para testes:** `?intro=0` DESLIGA o salvamento (de propósito: testes não gravam no espaço). Para testar salvar e carregar, semeie o
    espaço (`mdd-slot1-meta`/`-progress` com a bandeira `intro`) e abra só com `?titulo=0`. (O teste de salvar do passo 3 usava `?intro=0` e,
    por isso, não provava nada; refeito aqui.)
  - **o mais pesado** (chamadas de desenho, com as salas vizinhas e as sombras): Os Apelidos (~700 no PC, ~790 no celular), A Biblioteca e O Fogo
    que Corre (~690 no PC), A Lousa (~620). Os quadros por segundo do teste não valem para aparelho de verdade (o navegador do teste desenha sem
    placa de vídeo), mas mostram quais salas pesam mais, se algum celular engasgar.

## 74. O dado no braseiro 3D e o caderno que pula de parte em parte (pedidos do Pedro)

- **Posicionar o dado no braseiro.** Com o braseiro em modelo 3D (§62) o "posicionar" deixou de funcionar: o dado só assenta num braseiro quando a
  mira bate numa SUPERFÍCIE dele, e o braseiro de caixas era superfície; o modelo não. A mira atravessava a coluna: mirando na cesta ou no meio da
  coluna o dado nem saía da mão ("longe demais"); mirando embaixo ele ia para o chão, atrás. Agora cada braseiro em modelo tem um cilindro
  INVISÍVEL do tamanho dele que recebe a mira (`aimOnly`, o giz não risca nele), e mirar em qualquer altura dele assenta o dado no centro, em cima da
  cesta (`placeDie`, `userData.socket`). Testado mirando na cesta, no meio, na base, de lado e de perto.
- **A colisão segue o desenho** (`brazier.ts`). Medido do arquivo: a coluna tem uns 22 cm de raio no fuste, um pouco mais na base e no capitel, e a
  cesta 18 cm. Antes eram os dois blocos do braseiro de caixas (o de cima com 42 cm de meia largura): o jogador e o dado batiam no ar em volta da
  cesta. Agora são quatro: base (30 cm, até 0,18 m), fuste (20 cm, até 0,8 m), capitel (26 cm, até 0,9 m) e cesta (18 cm, até 1,1 m, onde o dado
  repousa). O ponto onde o dado acende (a tigela, 1,15 m) não mudou. O braseiro antigo (`?braseiro=antigo`) continua com as caixas dele.
- **O caderno pula de parte em parte de uma vez.** Antes, escolher uma parte no índice (ou voltar ao índice pela setinha) virava as folhas uma por
  uma até lá: do fundo (Gemas) ao índice eram mais de quinze viradas. Agora:
  - as setas, a roda e o canto da folha viram **uma página** (como antes);
  - um pulo maior vira **um maço de folhas de uma vez**, em leque (até 5 folhas saindo uma atrás da outra, ~0,7 s no total): a primeira folha leva a
    página de onde se sai, a última traz a página aonde se chega, as do meio são papel em branco. Vale para qualquer pulo (índice, voltar ao índice,
    o modo guiado indo até BRASEIRO).
  - No modo guiado, uma parte só conta como vista quando o caderno PARA nela (antes, passar por ela virando conta).

## 75. O tutorial do caderno, parte por parte (pedido do Pedro)

O tutorial de antes abria no relato dela e depois soltava o jogador no índice para "ver tudo", com um pensamento curto por parte: não dizia o que
fazer, e o jogador tinha de adivinhar que precisava passar por todas as partes. Agora (`book3d.ts`, `tut`):
- **Começa no índice.** O personagem: "Escrito à mão. Dividido em partes." · "Vou ver uma por uma." (ele ainda NÃO sabe de quem é o caderno:
  nada diz "ela" antes da leitura, e a 1ª linha do índice se chama "Folhas")
- **A parte da vez pisca em ouro** no índice (`View.guide`/`blink`, `guideFrame` em `pages.ts`). Só ela responde; tocar em outra linha dá só o
  "plim". O jogador não folheia por conta própria enquanto o tutorial dura (setas, roda e teclas esperam).
- **Em cada parte o personagem diz o que é e o que dá para fazer**, com as palavras dele (aqui ele fala um pouco mais que no resto do jogo, §48;
  é ele quem ensina o caderno):
  - **Folhas → Dela:** o relato, que agora diz "Dizem que estou condenada." no alto da 2ª página; é LENDO que ele descobre ("A letra não é
    minha." · "É de uma mulher. Condenada." · "Ela também acordou embaixo da luz." · "E parou no meio."), e a linha do índice vira "Dela"
    (`diary.knowHer`, `HER_ROW_BEFORE`; correção pedida pelo Pedro: antes ele dizia "o caderno dela" antes de ler qualquer coisa); vira para as folhas arrancadas
    ("Faltam folhas. Arrancadas." · "Se eu achar alguma, ponho de volta no lugar.").
  - **Símbolos:** vai até BRASEIRO ("Os símbolos das paredes. Os que eu já vi estão aqui." · "Ela anotava o que achava que eram. Se anotava, era
    importante." · "Este ela não sabia. E eu, o que acho que é?"). **Tarefa:** o campo embaixo do "?" dela abre e pisca até ele escrever e sair do
    campo ("Anotado. Se eu entender melhor, mudo depois.").
  - **Faces:** "As faces do dado. Só duas têm nome, por enquanto."
  - **Textos:** "Aqui ficam as frases inteiras, quando eu achar alguma."
  - **Mapa:** "Um mapa de onde eu passei. Ele se desenha sozinho." · "Dá para riscar nele. Vou marcar alguma coisa." **Tarefa:** o mapa pisca até
    ele riscar ("Assim eu lembro. Dá para carimbar os símbolos também.").
  - **Notas:** "Folhas em branco. Posso anotar o que eu achar importante."
  - **Gemas** (o fundo): "No fundo, uma cruz cheia de furos. Vazios."
- **Depois de cada parte o caderno volta sozinho ao índice** (num maço, §74) e a próxima pisca.
- **No fim:** "Vou anotar tudo, como ela.", e "Guardar" pisca (e o botão do caderno, no celular). Só então o caderno guarda; tentar antes: "Ainda
  não. Falta ver o resto."
- **Um toque (ou Espaço/Enter) passa o pensamento** na hora, sem esperar ele sumir sozinho.
- Testado no PC e no celular emulado, do começo ao fim (as sete partes, o toque errado ignorado, a anotação salva, o caderno guardado).
- Teste: `window.__mdd.bookTutorial()` abre o caderno como na 1ª vez; `bookTut()` diz em que ponto o tutorial está.

## 76. O caderno à vista, a vida dos corredores e a Lousa (cenógrafo, pedidos do Pedro)

- **O caderno da sala 2 fica exposto** (`rooms/vestibulo.ts`). Antes ele ficava no escuro, ao pé da coluna esquerda, e só aparecia (e só podia ser
  pego) com o 1º braseiro aceso; aí o dado já falava dele e o jogador, lá no fundo, nem tinha chance de pegá-lo antes. Agora ele está **caído no
  meio do chão do primeiro tramo**, logo depois da entrada, um pouco à esquerda do caminho (à direita, o dado da mão o tapava), entre as duas
  tochas: quem entra o vê embaixo, no meio da tela, e **já pode pegá-lo**, antes de acender qualquer coisa. O dado só fala dele («VOCÊ VER LIVRO»,
  «VOCÊ PEGAR LIVRO», olhando para ele) se o jogador **passar direto** para dentro do salão (além do 1º par de colunas) ou **acender um braseiro**
  sem pegá-lo. A porta continua só abrindo com o caderno pego. Testado no PC e no celular: visível ao entrar, "Pegar o caderno" e a bandeira
  `caderno`; o dado chama quem passa direto.
- **A vida dos corredores de ligação** (`connector.ts`, `decorate`). Os corredores compridos ficavam escuros, lisos e iguais. Agora, só com pedra e
  marca (sem luz nova: chama é coisa de puzzle, e o corredor não entra no rodízio de luzes) e nada no caminho:
  - **arcos de reforço** de pedra lavrada a cada 3 m (pilastra nas duas paredes e cinta no teto), como na Lousa: dão ritmo e profundidade;
  - o **chão gasto** no meio, por onde se passa;
  - **manchas de umidade** nas paredes, entre os arcos, e **musgo** no pé delas (mais no subsolo);
  - **entulho** no canto de fora de cada curva (fora do caminho) e, às vezes, **teia** no canto de cima;
  - **pedras soltas** pequenas junto da parede;
  - em uns 4 de cada 10 corredores, os **riscos de giz** de alguém contando os dias (a mesma marca da Lousa).
  Tudo sai de um sorteio fixo por corredor (igual toda vez).
- **A Lousa: o print do Pedro era de uma versão antiga** (com os cinco botões no canto e o aviso "AVISTADO – anotado no diário"). Na versão atual,
  aquele canto (a lousa secreta do CINCO, a pedra do soquete frio, o nicho da folha e a porta-lousa, na parede esquerda) está separado, sem nada
  por cima de nada (conferido de vários ângulos, no celular). Os riscos cor-de-rosa que aparecem na porta-lousa olhando de lado são a **mira de
  fogo** (o desenho da mira muda quando ela aponta para algo que se acende), não uma sobreposição.

## 77. O Peso chega no fim do capítulo 1: o altar do Tribunal (pedido do Pedro)
O dado começava com Fogo e Peso. O Pedro pediu que o jogador **não** começasse com o Peso e o ganhasse resolvendo um puzzle **do caminho
principal** (não um opcional), num buraco na parede ao lado de uma porta, com uma cena dramática: o dado entra devagar, a parede fecha, um
brilho, e ele volta com a marca do Peso. Depois, para mostrar o que o Peso faz, a porta só abre com o dado de Peso numa placa.
- **Selado** (`story/progress.ts`): `FACES[1].unlocked = !!flags.peso` (o marco `peso`). A face 2 aparece apagada, a tecla 2 diz "Selada", o
  caderno mostra 1/6 faces e a fala do tutorial passou a "Só uma tem nome, por enquanto". A sala de teste (`?lab=1`), a vitrine e o `?demo`
  ligam o Peso.
- **Onde:** no **Tribunal dos Rumores** (sala 24), o último puzzle do capítulo. É linear (a porta depende dele) e combina com o
  `HISTORIA.md` ("cada face é um capítulo e um altar"). O altar fica **embaixo da lei «DOIS BOATO IGUAL VERDADE»**: IGUAL é a palavra do Peso.
  Uma sala antes seria pior: o jogador atravessaria o Tribunal com uma face inútil ali, achando que ela fazia parte da solução.
- **A sala** (`rooms/tribunal.ts`, `altarExtra`): um bloco de pedra (1,3 × 0,75 × 1,18 m) com capa e degrau, encostado no fundo à direita da
  porta, e um nicho de 54 cm tampado por uma pedra.
  - A ordem certa acende os lampiões da porta, mas **não abre**. 1,3 s depois a pedra **racha**: decalque de rachadura com fio de ouro, pó,
    tremor, `altarCrack`, frestas com um fio de luz para se ver do outro lado da sala, e a câmera e o dado se viram para ela.
  - **"Empurrar a pedra"** (E/AGIR): ela recua 6 cm e desce para dentro do bloco (`altarPush`).
  - O dado olha para dentro e fala «EU DENTRO» · «VOCÊ ESPERAR». **"Pôr o dado"** só aparece quando ele termina de escrever (relógio de
    verdade, como o balão).
- **A cena** (motor: `ctx.altar`, `startAltar`/`altarTick` em `scene.ts`; fases `AltarPhase` em `types.ts`; tempos em `AL`; cerca de 11 s; uma
  vez só, sem pular; trava o jogador, esconde a mira, faixas de cinema):
  - 0 a 0,9 s: o dado sai da mão até a boca do nicho, num arco.
  - Até 1,8 s: ele para ali, respirando, com a face 2 ainda selada virada para o jogador.
  - Até 4,4 s: entra devagar (`altarSlide`).
  - 4,6 s: a pedra sobe e fecha (`altarShut`).
  - 6,1 s: o marco `peso` (a face muda lá dentro). As frestas acendem em ouro, a luz no fundo do nicho acende o chão na frente, a pedra treme e
    solta pó (`altarGlow`: coro, violoncelo, sinos e celesta). A câmera sobe até a lei e o IGUAL ganha um halo de ouro que pulsa; a palavra
    também acende (`fire`).
  - 8,6 s: a câmera desce, a pedra abre (`altarOpen`) e o dado sai com a face do Peso (o glifo IGUAL) virada para o jogador, brilhando.
  - 11,2 s: ele volta para a mão já na face 2 («2 · Peso»), comemora («IGUAL») e olha para a placa («PLACA»). Se o jogador demora, ele olha
    de novo a cada 25 s.
- **A placa** (`fire.ts`): `plate` fora da regra `commit` virou a **trava da porta**. Com a sala resolvida, a porta só abre quando o Peso
  afunda a placa, e **fica aberta** (dá para recolher o dado e passar).
- **Sons:** só gravações que o jogo já tem (pedra do pilar e da porta, o rolar e o pousar do dado, o baque) e os instrumentos do FluidR3.
- **Salvar e voltar:** com o Peso já ganho, o altar abre vazio, com uma brasa de luz dentro e o IGUAL da lei aceso; falta só a ordem e a placa.
  `skip()` (sala de trás num jogo carregado) dá o marco `peso`.
- **Testado no navegador** (PC 1280×720 e celular 915×412): a ordem 5-3-2-4-1 racha a pedra; empurrar abre; "Pôr o dado" libera depois da
  fala; a cena inteira; o dado volta na face 2 com o `peso`; a placa abre a porta, que continua aberta depois de recolher o dado; e chegar à
  luz encerra o capítulo. Ganchos de teste: `__altar.state()`/`crack()`, `__mdd.altarState()`.

## 78. Folhas dela mais discretas, o aviso da folha nova, a Lousa, a janela do Escrivão e o andar dele (pedidos do Pedro)
- **As folhas não entregam o fim.** A p8 (a 1ª folha secreta, na Lousa) dizia "Vou anotar os furos de luz do teto. Só os redondos. O primeiro fica
  onde eu acordei": mandava contar os furos e apontava para o plot. Agora a luz do teto aparece só de leve, sem instrução (`herpages.ts`):
  - p8: "Tem luz entrando pelo teto aqui também." · "Fiquei parada embaixo dela um tempo. Não sei esperando o quê.";
  - p7: "Contei tudo aqui. Os cantos, os degraus, as luzes lá em cima." (era "buracos redondos no teto, sempre um, dois...");
  - p18: "Parei de contar. Cada vez dava outro número." (era "Parei de contar os furos").
  O fio continua (ela fica embaixo da luz, conta tudo por mania, para de contar), mas ninguém diz "furos" nem manda contar (`HISTORIA.md`).
- **A folha nova chama o jogador para ler** (`diary.newPage`, `App.tsx`, `book3d.ts`). Ao pegar uma folha dela:
  - o personagem pensa uma frase curta: "Uma folha arrancada. A letra dela." na 1ª, depois "Outra folha dela." / "Mais uma folha dela." /
    "A letra dela de novo."; antes de ler o relato, "Uma folha arrancada. A mesma letra do caderno.";
  - o botão do caderno pulsa em dourado até ele abrir o caderno. No PC, que não tem botão fixo, ele aparece pulsando, com a tecla do
    caderno (J) embaixo;
  - o caderno abre **direto na folha nova** (e então para de pulsar).
  A legenda antiga ("Uma folha arrancada · É do caderno. A letra dela.") saiu das sete salas: o aviso agora é um só, no caderno.
- **A Lousa (sala 3):** os glifos que se copiam (DOIS e TRÊS) ficavam a 1,0 m do centro das lousas. A lousa tem 1,64 m e a moldura de pedra
  1,95 m, então a borda dela tapava o começo do símbolo (print do Pedro). Agora ficam a 1,3 m. A tocha da direita foi para z = −2,0, para
  continuar a 1,6 m ou mais do TRÊS.
- **A janela do Escrivão (Corredor dos Nichos):**
  - **A janela:** era baixa (1,0 a 2,1 m), com seis barras grossas e uma travessa no meio, bem na altura dos olhos. Agora vai de 0,7 a 2,4 m,
    tem 1,6 m de largura, quatro barras finas e uma travessa só, lá em cima. Ganhou um peitoril de pedra lavrada e uma mancha de luz quente
    no chão do corredor, que chama o olhar.
  - **A mini cena (só na 1ª vez):** quando o jogador chega à janela, ele para, e a câmera e o dado se viram e acompanham o capuz do
    Escrivão pela janela. Bem na frente dela, ele vira o capuz para o jogador por um instante. O jogador é solto quando ele passa do meio
    (cerca de 6 s). Das outras vezes ele só passa.
- **O andar do Escrivão travava** (`scribeRig.ts`, `walkLoop`). O ciclo é recortado do "Start Walking", e a emenda do fim com o começo misturava
  o quadril com o do começo do ciclo **sem somar o passo andado**.
  - Na costura o corpo escorregava cerca de 1,1 m para trás e, a cada volta (1,2 s), pulava de novo para a frente num quadro só: a cabeça dava
    um tranco de cerca de 3900 m/s².
  - Agora o passo é somado antes de misturar, e o recorte é o que melhor fecha o ciclo (1,067 s + 1,484 s, achado por busca; o antigo,
    1,15 + 1,333 s, era curto demais). Medido no esqueleto a 60 quadros por segundo: o maior tranco da cabeça caiu para 11 m/s², e os pés
    ficam no normal do passo.
  - Vale para as duas cenas do Escrivão andando (o poço e a janela).
- **Testado no navegador**, no PC (1280×720) e no celular (915×412):
  - o pensamento, o botão pulsando (com o J no PC) e o caderno abrindo na p8;
  - as duas lousas com o símbolo livre;
  - a mini cena da janela, com o jogador parado, a câmera acompanhando e o capuz virando, e o jogador solto no fim.
  - Ganchos de teste: `__mdd.addPage`, `setFlag`, `knowHer`, `newPage`.

## 79. O "resolvido", a música do menu e as pausas na música (pedido do Pedro; feito pelo subagente `sonoplasta`)
Tudo continua com **gravações reais**: os instrumentos do FluidR3_GM (três novos, do mesmo soundfont e com o mesmo crédito: **contrabaixo**,
**coro "oohs"** e **garrafa soprada**) e os efeitos CC0 que o jogo já tinha. Nenhuma fonte nova de efeito: as gotas novas e a "pedra assentando"
saíram dos pacotes já creditados (qubodup, rubberduck). Áudio total: **2,39 → 2,95 MB** (instrumentos 1,81 → 2,35 MB; efeitos 0,58 → 0,60 MB).
- **O resolvido** (`'solved'`, novo em `SfxName`; `audio.ts`, `solved()`). O momento de "consegui", de 2 a 3 s, que resolve. É uma cadência
  plagal com a terça de picardia, comum nos jogos de mistério:
  - a **pergunta**, em Ré menor: a harpa sobe ré, fá, lá, ré, e o coro respira;
  - a **resposta**, em Lá MAIOR (a Casa aceitando), 0,5 s depois: o grave da Casa (o mesmo tambor distante do escuro, agora com o acorde
    maior), o tímpano e o violoncelo em lá; o coro abre o acorde, a harpa o arpeja, um sino tubular toca e a celesta sobe.
  - **Toca uma vez por sala**, no instante em que o puzzle principal fica resolvido. O motor (`scene.ts`, `solvedTick`) vê `Room.isSolved()`
    passar de falso a verdadeiro até 1,2 s depois de um som da própria sala (a peça final, a porta). Carregar um jogo salvo ou `skip()` não
    toca nada, e reiniciar a sala e resolver de novo também não. No Tribunal ele toca quando a ordem fica certa: a pedra do altar racha
    1,3 s depois, por baixo dele. Na Antecâmara Fria (R5), toca no escuro, quando a porta abre: o escuro ali não é castigo.
  - O `'piece'` do mesmo quadro **espera um quadro** e, se foi ele que resolveu, quem toca é o resolvido. O violoncelo da porta (a "Casa
    aceita") dá lugar ao do resolvido: ele é cortado se ainda não começou e some se já começou (no Vestíbulo, a sala só conta como resolvida
    ~0,3 s depois do som da porta). Uma porta que abre até 5 s depois do resolvido fica só com a pedra (na Lousa, ela abre 1,6 s depois).
  - A **música abre espaço** (cai a ~18% em ~0,1 s e fica assim 2,6 s) e, em vez de voltar, **vai embora** por baixo: a frase termina ali e
    vem um silêncio de 35 a 60 s, para o resolvido respirar.
- **O passo certo** (`'piece'`) ficou pequeno e claro, para não se confundir com o resolvido: o clique de pedra de um mecanismo e duas notas
  que sobem uma quarta (mi, lá) na harpa, com a celesta por cima. Tem ~1 s, sem grave, sem coro e sem sino. **O erro**: o "toc" de madeira de
  antes e, por baixo, um baque de pedra abafado. Continua curto, porque se repete quando o braseiro está frio.
- **A música do menu, "O Poço"** (`TPROG`, `titleMusic`). É composta na hora como a do jogo, mas é outra peça: contemplativa, esparsa,
  grave e com muito espaço.
  - **Harmonia:** Ré; a volta tem oito acordes de 12 s (96 s): Ré aberto, Si bemol, Dó, **Lá maior (a luz)**, Ré menor com a nona, Sol menor,
    Si bemol e Lá suspenso, que vira Lá maior.
  - **O que toca:**
    - o contrabaixo segura o chão, com o violoncelo uma oitava acima;
    - o coro "oohs", mais macio que o "aahs" do jogo, respira o acorde;
    - a harpa cai devagar, de cima para baixo, como gotas de luz no poço;
    - a celesta brilha lá no alto;
    - um sino toca longe, de vez em quando;
    - a cada 30 a 50 s, uma garrafa soprada: o ar passando pela boca do poço;
    - nos acordes de luz, um fio de cordas por cima.
  - **O tema:** no começo de cada metade, lá, ré, mi, FÁ... mi, RÉ. Nas voltas ímpares vem a resposta, que sobe até o lá: olhar para cima.
  - **O eco e o volume:** o eco é mais longo que o das salas (0,78 s). A faixa tem ganho 1,55 (era 1,35; ver a revisão, abaixo): medido na
    gravação, a peça fica em −26,7 LUFS e a música do jogo em −22,7, ~4 dB abaixo (o compressor da mesa achata a diferença).
  - **Onde toca:** na tela inicial e nos submenus dela (Configurações, Carregar, Créditos) e no fim do capítulo, 6 s depois da fanfarra (os
    créditos de lá).
  - **As transições** (`leaveTitle`):
    - **Novo jogo:** um arpejo de Lá maior sobe com a câmera pelo feixe (harpa até a celesta, o coro crescendo, o sino na entrada do branco).
      Tudo some até ~3,1 s, antes de a página recarregar, sem corte seco. No jogo novo, a música só entra 22 s depois de o som ligar: o
      jogador acorda com o poço, o vento e as gotas;
    - **Continuar:** a peça some em ~1,5 s, junto do pulinho e do pontilhado. A do jogo entra ~3 s depois e cresce em ~10 s;
    - **outro espaço:** some e a página recarrega.
  - **Voltar à tela inicial** (pausa): o som some em 0,25 s antes de recarregar.
- **As pausas na música do jogo** (`gameMusic`). A música do jogo é a mesma de antes (o caráter não mudou), mas agora toca em **frases**:
  - **a frase:** uma ou duas voltas da progressão (64 ou 128 s; a 1ª do jogo tem duas) e a **coda**, o Lá menor que resolve e afina: o baixo
    e as cordas diminuindo, e uma última frase da harpa que desce. A música some no meio da coda (~12 s). Uma frase dura de 1min20 a 2min30;
  - **o silêncio:** de 45 s a 2 min. A música volta devagar (~10 s até o volume cheio);
  - **no silêncio, o ambiente sobe ~2,5 dB**, em ~4 s: o vento, o ar da sala, as gotas, o fogo, os passos (com um pouco mais de sala). A Casa
    respira mais (de 40 s a 1min30, em vez de 70 s a 2min30). O que precisa ser ouvido continua abaixando o ambiente: porta, erro, escuro;
  - **regras de contexto:**
    - um puzzle resolvido encerra a frase na hora (ver acima);
    - nas **áreas livres e respiros** (`Ambience.quiet`: R1 a R5 e a Biblioteca), a frase tem uma volta só e o silêncio é 1,5 vez mais longo;
    - no **escuro da Casa** a música recua junto com a luz (até 40%).
- **O ambiente, mais exposto no silêncio:**
  - **gotas:** seis gotas em vez de três (as novas saem do mesmo porão, com o "corpo" das antigas). Às vezes caem duas seguidas, às vezes uma
    lá longe, abafada e na sala longa;
  - **vento:** o laço de 16 s passeia devagar entre 70% e 115% de volume e de brilho, para não se perceber a volta;
  - **a Casa respira** de cinco jeitos, nunca o mesmo duas vezes seguidas. Aos três de antes somam-se pedrinhas e pó caindo em outra sala
    (`settle.mp3`, três quedas de pedra do rubberduck) e um bloco arrastado lá longe, quase só o grave (o `rise`, uma oitava abaixo).
- **Mesa de som** (só processamento):
  - cada música tem a sua **faixa** (seco, reverberação e eco) com volume próprio, por isso uma some enquanto a outra entra;
  - a **reverberação da música agora segue o volume de música**. Antes ela ia inteira para a sala mesmo com a música baixa ou desligada; as
    proporções do volume padrão continuam iguais;
  - o **eco dos efeitos** (celesta e harpa das falas, da escrita) tem linha própria. Antes passava pelo canal da música e sumia com ela no
    modo "só efeitos".
  - Ao religar a música no meio de uma frase, ela segue dali, sem tocar de uma vez os acordes que ficaram para trás (defeito antigo).
- **Testes:**
  - `__mdd.music()` mostra a cena, a fase, quanto falta e o volume das faixas. `__mdd.musicTest({ chords, rest, end, restNow })` encurta
    frases e silêncios. `__mdd.solvedRang()` diz quais salas já tocaram o resolvido;
  - `__mdd.renderAudio(s, ops)` grava o motor de verdade num `OfflineAudioContext` (`src/scene/audioRender.ts`, só em desenvolvimento; não
    vai para o build) e é com ele que se fazem as faixas de demonstração.
- **Revisão (o 2º sonoplasta, que terminou o trabalho):**
  - **Conferido no navegador** (Chromium, 1280×720):
    - o resolvido toca **uma vez** e no lugar do `'piece'` final: no Poço (acender, a porta, o resolvido); na Lousa (as duas lousas de cópia
      tocam o `'piece'`; a porta-lousa, o resolvido, e a porta abre 1,6 s depois só com a pedra); no Tribunal (o 5º braseiro; a pedra racha
      1,3 s depois); na Antecâmara Fria (no escuro, junto com a porta);
    - a música do menu entra no 1º toque, e abrir e fechar Configurações não a recomeça. No **Continuar**, ela some em ~2 s e a do jogo entra
      ~3 s depois, chegando ao volume cheio em ~12 s. No **Novo jogo**, o arpejo sobe e tudo some antes de recarregar; o jogo novo espera
      22 s pela música;
    - as pausas, com os tempos encurtados (`musicTest`): frase, coda e silêncio, com o ambiente subindo até ×1,32, e a volta. Numa área livre,
      o silêncio é 1,5 vez mais longo;
    - no escuro da Casa, o canal da música cai a 40% e volta. No modo "só efeitos", a frase fica parada e, ao religar, segue sem empilhar
      acordes. No mudo, o resolvido não toca.
  - **Corrigido:**
    - **Notas cortadas.** As gravações de notas longas (coro, cordas, baixo) acabam ainda soando. O coro do menu pedia entrada e saída de 1,6 s
      numa nota de ~3 s. Nas notas puxadas para cima (meio tom acima da gravação mais próxima), a gravação acabava antes do envelope, e a
      nota era cortada ainda soando: um "tique" abafado no fim de cada uma. Medido num `OfflineAudioContext` (o mi do coro, da gravação do
      mi bemol): antes, os últimos 40 ms estavam ~21 dB abaixo do pico e caíam a zero de uma vez; agora chegam a −81 dB. `note()` agora
      encolhe o envelope para ele acabar antes do fim da gravação (vale para tudo, também o suspiro do violoncelo da Casa respirando).
    - **O menu raspava meio tom nas trocas de acorde.** O coro do acorde que saía ficava no auge ~2 s dentro do seguinte: o dó natural do Dó
      por cima do dó sustenido da luz; fá e mi; lá e si bemol; e, no baixo, si bemol e lá.
      - Agora cada acorde se cala até 0,7 s depois do fim dele, e a reverberação cobre a passagem.
      - A harpa, a celesta, o sino e a garrafa escolhem notas do acorde que soa naquele instante, e também do seguinte, se ainda estiverem
        soando quando ele chegar. No Lá suspenso, depois da metade, a harpa também troca o ré pelo dó sustenido.
      - Medido na gravação: o dó natural sai em ~1 s, antes de o dó sustenido entrar (antes, ainda soava ~3 s dentro do Lá maior e cruzava
        com o dó sustenido). A peça ficou ~1 dB mais baixa, por isso o ganho subiu.
    - **Gotas.** As três novas eram estalos secos, com o brilho em 4 a 5 kHz, e não gotas. Foram trocadas por três do mesmo porão, com o
      "plim" das antigas (1,5 a 2 kHz): `drip.mp3` refeito (`build_audio.py`), `AUDIO_VERSION` 7, cache `v113`.
    - O lá grave do resolvido passou ao **contrabaixo**, gravado nessa altura, e não mais o violoncelo puxado abaixo da corda mais grave.
    - Pedir a música do menu com ela já tocando não a recomeça mais.
    - **Créditos** (`CREDITS.txt`): os três instrumentos novos e o autor certo das gotas (Independent.nu, enviado por qubodup; CC0 conferido
      na página).
  - **Testes:** `__mdd.music()` mostra também o canal da música (`bus`, `verbBus`) e o escuro aplicado (`dark`).
  - **Faixas de demonstração:** gravadas com `renderAudio` e convertidas com o `ffmpeg`, fora do projeto: o resolvido (antes e depois), a
    peça do menu e a pausa da música do jogo.
- **O resolvido refeito com gravações (pedido do Pedro: "ficou bem destoante dos restantes, ficou mais sintético").** A versão com coro de
  ataque lento, tímpano, violoncelo e contrabaixo empilhados numa cadência inteira soava como um jingle de MIDI. Os outros sons do jogo são
  gravações de pedra, porta e dado, com no máximo um toque de harpa ou celesta. Agora o resolvido é da mesma matéria:
  - a trava de pedra que solta (`plate1`, mais grave), a pedra assentando (`settle`) e um baque surdo (`boom`);
  - o **gongo gravado** a 0,668 da velocidade. Medido: as parciais fortes dele caem em mi (+40 cents), dó sustenido e lá, um Lá maior com a
    desafinação natural de gongo, por isso ele fica por baixo;
  - por cima, o mesmo par do passo certo, agora inteiro e resolvendo: a harpa em lá, dó sustenido, mi e lá, a celesta em lá e mi, e o **sino
    gravado** afinado no lá (a parcial forte dele está em 1827 Hz; toca a 0,963).
  Sem coro, tímpano, violoncelo nem contrabaixo. O volume fica parecido com o de antes (−18,2 LUFS sozinho, −15,6 com a porta, medidos na
  faixa de demonstração). O duck da música, o silêncio depois e o "uma vez por sala" continuam iguais.
- **Um som para cada tipo de solução (pedido do Pedro: "tipos de efeito sonoro para variados tipos de solução").** O jogo tem agora:
  - o **passo certo** (`piece`), um acerto no meio do puzzle;
  - o **resolvido** (`solved`), o puzzle principal da sala;
  - o **segredo** (`secret`, novo), o nicho escondido que se abre com uma folha dela ou uma gema. Os nichos de segredo (`makeGemNiche`)
    tocavam o som da porta. Agora tocam o próprio: a laje pequena correndo (a pedra da porta, mais aguda e curta), um brilho de vidro, a harpa
    no lá e três notas de celesta subindo com eco. É menor e mais misterioso que o resolvido;
  - a **porta** (`door`), o **erro** (`error`) e o **fim do capítulo** (`fanfare`).
  - Para o Pedro ouvir cada um **sozinho**, o gravador de demonstração (`audioRender.ts`, só em desenvolvimento) ganhou a opção `dry`:
    sem música, sem vento e sem o "ar" da sala; o silêncio entre os sons é absoluto.
- **Só pedra, nada de mágico (pedido do Pedro).** Dos seis efeitos que ouviu sozinhos, só a **porta** e o **erro** ficaram bons: "todos os
  demais parecem mágicos demais; o som sintético e mágico não encaixa no nosso jogo; sons que lembrem rochas". Então o **resolvido**, o
  **passo certo**, o **segredo** e o **fim do capítulo** perderam todo instrumento (harpa, celesta, sino, gongo, coro) e viraram só gravações
  de pedra, mecanismo e peso:
  - **passo certo:** uma lingueta de pedra caindo no lugar (o estalo da placa, o chocalho da trava, uma pedrinha);
  - **resolvido:** o mecanismo da Casa destravando (três linguetas em sequência, cada vez mais graves; o ferrolho; um baque pesado com o
    grave surdo; a pedra arrastando e assentando; pedrisco caindo), ~2,2 s;
  - **segredo:** uma laje pequena correndo de lado, poeira e pedrisco, a pedra assentando e um toque oco quando ela para;
  - **fim do capítulo:** a Casa inteira se mexendo (estrondo grave e longo, arrasto enorme, uma laje correndo ao longe, a pedra assentando,
    pedrisco e uma laje que bate longe), ~5 s.
  - Níveis medidos, cada um sozinho: resolvido −19,4 LUFS, fim do capítulo −18,2, passo certo −24,0, segredo −24,5. Para comparar: a porta
    está em −17,5 e o erro em −26,3.
  - A porta volta a tocar sempre o violoncelo grave dela, que o Pedro aprovou (antes, logo depois do resolvido, ela ficava só com a pedra).
  - **Ainda com instrumento** (o Pedro não avaliou): a escrita que acende, a cena da gema, o altar do Peso, o "Novo jogo" da tela inicial
    e a música (as notas das faces saíram no §86).
- **Um fio de "descoberta", bem baixo (pedido do Pedro: "ficou bom, só adicionar um pouco, mas bem pouco mesmo, de efeito de descoberta").**
  Por baixo da pedra, só instrumentos de som orgânico, nunca celesta, sino, gongo ou coro:
  - **passo certo:** uma nota de harpa grave (lá);
  - **segredo:** as cordas entrando devagar num Lá maior aberto e uma nota de harpa;
  - **resolvido:** depois do baque, o violoncelo grave (o mesmo da porta) e as cordas abrindo num Lá maior, e uma nota de harpa no fim;
  - **fim do capítulo:** o violoncelo grave e as cordas, por baixo do arrasto.
  - Medido pela diferença entre a gravação com e sem a camada nova (a pedra é idêntica nas duas), a camada fica 15 a 17 dB abaixo da
    pedra no resolvido, no segredo e no passo certo. No fim do capítulo a medida dá −12,5 dB, inflada pelo compressor geral, que reage ao
    estrondo longo. O volume total quase não muda (menos de 0,4 dB).

## 80. A abertura da editora, a tela inicial que espera o cenário, o dado mais vivo, a tela de carregamento e a mira (cenógrafo, pedidos do Pedro)

- **A editora: «CINCO RISCOS»** (`src/ui/Splash.tsx`, `src/ui/chalkart.ts`). A 1ª versão, «Pedra-Sabão» (uma laje clara com o nome a giz),
  não agradou: o Pedro pediu outro nome e um símbolo mais original, desenhado pelo giz do jogo. Foram propostas «Quina» (a face do cinco feita de
  riscos), «Cinco Riscos» e «Olho de Giz»; **o Pedro escolheu Cinco Riscos**, por ser um nome que serve também a outros jogos. Agora: o escuro,
  uma **luz quente se acende numa parede das salas** (a mesma alvenaria do jogo) e o **giz do jogo** (os quadradinhos claros `#f0ecdc`, que
  falham no grão da pedra) risca, traço a traço, o símbolo, a **contagem de cinco dos condenados** (quatro riscos e o quinto atravessado,
  passando da conta), e depois o nome, com um toco de giz na ponta soltando pó; no fim a luz baixa até o preto e a tela inicial se abre. Tudo em
  pixel, no tamanho de pixel do jogo; ~4 s; um toque, clique ou tecla pula; uma vez por sessão do navegador (voltar à tela inicial no meio do
  jogo não repete); `?splash=0` pula, `?splash=1` força. Ela só sai quando a tela inicial está pronta.
- **A tela inicial não "sobe do preto" mais.** O defeito: o menu aparecia (subindo de baixo) com a tela ainda preta, e o cenário surgia segundos
  depois, porque o 1º desenho de cada material compila o programa de sombreamento, e os modelos 3D chegam depois. Agora a cena avisa quando está
  pronta (`onReady`: 4 quadros desenhados, os modelos chegaram, a fonte carregou; no máximo 10 s; `src/story/loading.ts`) e só então, depois da
  abertura, a imagem **se abre do preto** (1,1 s, o dado junto), o **logo** aparece no lugar e o **menu** em seguida, sem subir de baixo. O dado já
  está no lugar dele no 1º quadro (antes ele vinha girando até a posição).
- **O dado mais vivo na tela inicial** (`scene.ts`, `titleActTick`): de tempos em tempos (5 a 10 s), se ninguém mexe no mouse, ele faz alguma coisa e
  volta reto ao chão, de rosto para a câmera:
  - **tenta rolar**: faz força (aperta a boca, semicerra os olhos), levanta de lado sobre a quina de baixo e cai de volta com um baque (som baixo),
    duas ou três vezes, cada vez um pouco mais alto, e **desiste com um leve suspiro**;
  - **olha em volta**: vira o corpo um pouco para um lado, olha, volta;
  - **olha o feixe** de luz lá em cima: inclina para trás e a íris se fecha com a claridade;
  - dá um **pulinho**.
- **O rosto mais vivo, sempre NEUTRO** (`dielife.ts`, desenho em `textures.ts`), na mão, na tela inicial e na de carregamento:
  - **olhar de canto**: só as íris vão ao canto do olho e ficam lá um instante (o rosto não vira), com a pálpebra de cima 1 px mais baixa; às vezes
    pisca ao voltar;
  - **sobrancelhas que mexem sozinhas**: uma (ou as duas) sobe 1 px e volta; a do lado para onde ele olha de canto às vezes sobe junto. Elas só
    sobem e descem **retas**, nunca inclinam (inclinar é o que faria cara de bravo ou de triste);
  - **o olho descansa**: a pálpebra de cima desce um pouquinho por alguns segundos e volta (o olho muda de forma sem mudar a expressão);
  - **a íris se fecha** olhando para a luz forte (o feixe do poço, na tela inicial);
  - **o leve suspiro**: puxa o ar (sobe e "enche" um tiquinho, sobrancelhas sobem, narinas abrem) e solta devagar (desce, as pálpebras caem um
    pouco, a boca entreabre 1 px). De vez em quando (mais vezes na tela inicial). Não é tristeza nem cansaço: é só ele respirando.
  A boca continua sempre reta (§51); nada disso é emoção.
- **A tela de carregamento** (`src/ui/LoadingScreen.tsx` + o fundo em `src/ui/loadart.ts`; o motor entra no modo `load`): depois de **Novo
  jogo** (a subida pelo feixe até o branco, que vira preto), de **Continuar** (o dado pula para fora e a imagem vira pontilhado até o preto) e de
  **Carregar** outro espaço. Três rodadas com o Pedro: o preto liso com a barra ficou "muito purista"; a parede com o fogo e os riscos de giz
  ganhou vida, mas ele pediu **o dado em 2D, mexendo o rosto**, e **uma barra com mais coisas do jogo**. Agora:
  - uma **parede das salas no escuro** e uma **bancada de pedra** embaixo; do alto à esquerda desce a **fresta de luz fria com poeira boiando**;
  - na bancada, a **canaleta** por onde o **fogo corre** conforme carrega e **cinco braseiros** de ferro (pé, haste, bacia) que **se acendem um a
    um quando o fogo chega**, com clarão e faíscas, e cada um **ilumina a parede** (a mecânica do jogo: o fogo corre e acende);
  - na parede, **os desenhos a giz dos condenados** (os mesmos das paredes do jogo, ver abaixo; nada de glifo, pedido do Pedro, que trocou a
    frase «ACENDER BRASEIRO» que estava ali): **quem passa de capuz**, dentro da fresta de luz fria, se vê desde o começo; **a porta, a
    contagem dos dias, o dado e a luz do poço** ficam no escuro e **aparecem quando um braseiro acende perto** (o giz devolve bem a luz). A tela
    fica pronta com os cinco acesos;
  - no canto, **o dado em 2D, em pixel**, quase de frente, com **o rosto vivo de verdade** (o mesmo de `dielife.ts`/`textures.ts`: os olhos seguem
    a ponta do fogo e espiam o desenho que acabou de aparecer, pisca, mexe as sobrancelhas, olha de canto, suspira); **recua a cada braseiro que
    acende** (como no jogo), se anima quando os cinco estão acesos, a luz da chama esquenta a lateral dele e, no clique de começar, **sai pulando pela direita** enquanto a
    parede escurece (0,5 s);
  - o aviso «Clique/Toque para começar» fica embaixo da canaleta (nada por cima de nada).
  O fundo é pintado a cada quadro num canvas no tamanho de pixel do jogo e entra no **pós-processo** (`tBack`/`uBack`): a mesma paleta e o mesmo
  pontilhado do jogo. O lugar salvo é preparado por baixo (o mundo fica parado), e a tela espera **os modelos, os primeiros quadros e as
  gravações de som** (no máximo 15 s; a barra leva no mínimo ~1,4 s).
  - **Os sons que chegavam tarde**: antes, as gravações só começavam a baixar depois do 1º toque/tecla (e, depois de Novo jogo, a página recarrega:
    era preciso um gesto novo). Agora o motor de som (`audio.ts`, `prepare`) cria o contexto de áudio **suspenso logo ao abrir a página** e já
    baixa e decodifica tudo durante a abertura, a tela inicial e a de carregamento; nada é agendado antes do gesto (`unlock`), para não tocar tudo
    junto depois.
  - **No fim**: se o som já está liberado (Continuar no mesmo espaço: houve o clique), o jogo segue sozinho; se a página acabou de recarregar (Novo
    jogo, Carregar), aparece **«Clique para começar»** (no celular, **«Toque para começar»**) piscando sobre a barra: é o gesto que o navegador exige
    para o som sair e, no PC, para prender o mouse (antes aparecia "Clique para jogar" por cima da cena de acordar, e ela começava muda).
  - Depois do clique: num jogo novo, a cena de acordar começa no preto como sempre; num jogo salvo, o véu se abre (1,1 s) e aparece o nome da sala.
- **Os desenhos a giz das paredes, melhorados** (`src/scene/chalkdraw.ts`; pedido do Pedro). Os desenhos que os condenados deixaram nas paredes
  eram linhas retas finas, de vetor, sem cara de giz. Agora saem do **mesmo giz do jogo** (os quadradinhos claros que falham no grão), **feitos à
  mão**: tremor, traço mais grosso no meio e fino nas pontas, alguns traços repassados, pó em volta, partes apagadas (esfregadas). Os desenhos:
  **o braseiro** (três línguas de fogo), **a porta** em arco com tábuas, cinta e argola, **o dado** com o rosto (boca reta), **a luz do poço** com
  alguém embaixo de braços erguidos, **quem passa de capuz** (o Escrivão, visto pelos condenados), **uma mão** contornada, **o rosto apagado** e
  **a contagem dos dias**. Nas salas, um pouco mais foscos que o giz puro (ao lado das tochas, o branco saturava em laranja e parecia brasa), e
  na resolução certa para a distância (~85 px/m na Galeria, ~105 nos corredores estreitos).
  - **A Galeria dos Condenados**: as centenas de riscos, o rosto apagado, a porta e o desenho dos tamanhos, nos mesmos lugares. **No desenho dos
    tamanhos, GRANDE e PEQUENO estavam errados** (com uma base embaixo, como um U); agora são como no léxico, só as duas laterais (V) com os
    pontos (0, 2, 6, 8 e 4). O braseiro grande e o pequeno continuam lá, e a folha nº 6 continua a três passos.
  - **Os corredores**: além dos riscos (uns 4 em cada 10 corredores compridos), alguns ganham **um desenho** (hoje quatro: o braseiro, a mão, o
    dado e quem passa de capuz), no trecho mais comprido, na altura dos olhos.
  - **A Lousa**: os riscos de quem contou os dias ao lado da 1ª lousa, com o giz novo.
  - **Não mexi no mural da Biblioteca** (porta, livro, chave, sino): a porta e o livro de lá são de propósito o mesmo rabisco que o dado mostra
    quando traduz uma palavra, e o puzzle é casar os dois.
- **A mira só aparece com o jogo de fato começado**: a interface começa com ela escondida, a tela inicial e a de carregamento contam como cena, e o
  motor avisa já no 1º quadro (antes ela piscava no meio da tela no começo do jogo e só depois sumia). Nas cenas (acordar, o poço, o dado ao centro,
  a gema...) ela some e volta quando a cena acaba, como antes.

## 81. O andar do Escrivão: a túnica não é calça (cenógrafo, pedido do Pedro)

O Pedro achou o andar do Escrivão animado "meio estranho" e pediu para arrumar ou voltar ao de antes. Filmando o passo quadro a quadro (de lado, de
3/4 e de frente), o problema não era o recorte do ciclo (o de §78 e o antigo de §70 dão quase o mesmo movimento, e o de agora é o mais liso na
emenda), e sim o **pano**:

- **A túnica andava como calça.** Na hora de pôr o esqueleto, o Mixamo prendeu a túnica de baixo, a barra do casaco e a estola aos ossos das
  PERNAS (coxa, canela, pé e ponta do pé). A cada passo o pano ia junto com a perna: a barra se esticava em cunha para trás, a túnica se abria entre
  as pernas e a estola vermelha rasgava em tiras. Agora (`robeNotTrousers` em `scribeRig.ts`, uma vez quando o arquivo carrega) o pano que estava
  nas pernas passa para o **quadril**, e só um pouco dele (`ROBE_SWAY` = 22%) fica na coxa do mesmo lado: a túnica cai como um sino e a barra
  balança de leve com o passo, como no Escrivão de código. Só os **sapatos** (achados pela cor quase preta da textura) continuam nos pés: eles
  aparecem e somem sob a barra a cada passo, sem o pé escorregar no chão.
- **Os braços de pinguim.** O "Start Walking" abria os braços para os lados e dobrava a mão esquerda de lado na frente da barriga. Andando, as mãos
  agora caem junto do corpo, um pouco à frente (`ARM_HOLD` = 70%, os dois ossos do braço, como já se fazia ao debruçar), cada uma balançando pouco ao
  contrário do pé do mesmo lado, e os pulsos voltam à pose de pé. Quando a mão direita tem o que fazer (ir ao manto, erguer o dado), ela manda.
- O recorte do ciclo ficou o de §78 (1,067 s + 1,484 s, emenda de 0,35 s); os números estão em `WALK_CUT`, num objeto, para os testes compararem
  recortes. Nada mudou no debruçar, no erguer do dado nem nos tempos das cenas (o poço e a janela dos Nichos). `?escrivao=antigo` continua
  mostrando o Escrivão de código, se o Pedro quiser comparar.

## 82. A barra de carregamento vira uma frase que a luz enche (cenógrafo, pedido do Pedro)

O Pedro achou estranhos os cinco braseiros em cima da barra e pediu que a barra tivesse o efeito dos puzzles de glifos, "aonde a luz vai enchendo".
Saíram a canaleta de fogo e os braseiros (`ui/loadart.ts`). No lugar:

- **A frase talhada.** Uma laje de pedra lavrada presa à parede (borda de cima clara, de baixo escura, uma sombra embaixo, como as lousas das
  salas) com a frase do Escrivão na cena do poço, «EU DAR DADO · VOCÊ LER» (6 símbolos), no desenho exato dos glifos do jogo (`drawGlyphPart`).
  Apagada, ela é como as frases acendíveis (§53): o sulco escuro preenchido de marfim fosco, com uns pontinhos onde o marfim descascou.
- **A luz que enche.** Conforme carrega, a luz dourada corre pelos sulcos **traço a traço, na ordem da escrita**, símbolo por símbolo, e pula de
  uma palavra para a outra como nas frases do jogo (0,35 de símbolo). Cada símbolo clareia quando a luz chega nele e assenta (o pulso de §59),
  toca a nota dele (celesta e harpa, `sfx.glyph`, a mesma das frases acendíveis) e depois respira de leve, com o reflexo correndo pelos traços.
  O brilho fica no desenho: o ouro do tamanho do sulco, um fio claro no meio e um halo estreito pontilhado. Na ponta da luz, um ponto
  branco-dourado tremula e solta um pó de luz que sobe; com tudo aceso, o pó sai de vez em quando de um símbolo.
- **A luz na parede.** Cada símbolo aceso clareia a parede em volta (mais para cima que para baixo), e os desenhos a giz aparecem com essa luz,
  como antes apareciam com os braseiros (subiram um pouco para dar lugar à laje). O dado olha a ponta da luz e o desenho que acabou de aparecer;
  com a frase inteira acesa, ele se anima. A tela só sai quando a frase está toda acesa (o mesmo "pronto" de antes).
- O aviso «Clique/Toque para começar» fica na frente da bancada, embaixo da laje (`LOAD_BAR.prompt`).
- A frase é só uma escolha de cenário (uma fala que já existe no jogo); se o narrador quiser outra, é trocar `PHRASE` em `loadart.ts` (a laje e
  o tamanho dos símbolos se ajustam sozinhos à largura).

## 83. O dado da tela de carregamento em 2D de verdade (cenógrafo, pedido do Pedro)

O Pedro aprovou a frase da barra (§82) e pediu o dado "de fato em 2D, com a face totalmente virada para o jogador". Saíram as faces de cima e
de lado que imitavam uma caixa em perspectiva (`drawDie` em `ui/loadart.ts`): fica só a face da frente, o mesmo rosto vivo (olhar, piscar,
sobrancelhas, suspiro), chapada, no tamanho do pixel do jogo, com 1 px de contorno escuro para se separar da parede, a borda virada para a frase
pegando a luz dourada e o lado esquerdo do rosto mais quente. Como agora é um desenho, ele pula como desenho animado: estica um pouco no ar e
achata ao pousar, apoiado na bancada pelo meio de baixo; a sombra de contato pontilhada encolhe no pulo. No clique de começar, sai pulando pela
direita, como antes.

## 84. O ritmo das novidades: o giz chega no meio do capítulo 2 (decidido pelo Pedro)

O Pedro não quer duas mecânicas novas em seguida: o Peso chega no fim do capítulo 1 (o altar do Tribunal, §77), então o giz **não** vem logo
no começo do capítulo 2 (o plano antigo, §16 e §19). Fica valendo um ritmo fixo: **uma novidade a cada meio capítulo**, alternando face do dado
e ferramenta, para o jogador aprender cada uma sozinha antes da próxima.

| Momento | O que chega | O que se usa |
|---|---|---|
| Fim do capítulo 1 (o Tribunal) | **Peso** (IGUAL) | |
| 1ª metade do capítulo 2 | nada novo | **Fogo + Peso**: primeiro 2 ou 3 salas só de Peso, depois os dois juntos |
| **Meio do capítulo 2** | **o giz**, com o Escrivão de perto pela primeira vez | |
| 2ª metade do capítulo 2 | nada novo | **Fogo + Peso + giz** |
| Fim do capítulo 2 | **Eco** (a 3ª face, num altar, como o Peso) | |

- **Onde o giz chega:** na volta à **Biblioteca**, o centro do mundo (no capítulo 1 ela era o grande respiro do meio do capítulo; no 2 repete o
  papel). Um **elevador de contrapeso**, que só o Peso move, leva ao **2º andar** (no capítulo 1 as escadas para cima estão desabadas e os andares
  de cima só se veem pelo vão do Átrio). Lá em cima o Escrivão espera, de perto pela primeira vez: escreve a frase da sentença («EU ESCREVER
  SENTENÇA», depois «VOCÊ LER SENTENÇA ?») e deixa o giz. A cena guardada de A Entrada (`rooms/room1.ts`) serve de base. É o momento em que o
  jogador entende a premissa (`HISTORIA.md`, "Como a premissa é revelada cedo").
- **Paga uma pista do capítulo 1:** pela grade do escritório do Escrivão, na Biblioteca, já se vê um **toco de giz** em cima da mesa.
- **O que isso pede das salas:** nenhum puzzle da 1ª metade do capítulo 2 pode depender do giz. Das salas guardadas, O Salão das Brasas e O
  Mirante (Fogo + Peso) servem para a 1ª metade; A Lacuna, O Selo e A Placa que Julga (com giz) só depois do meio.
- Os textos e a cena são do `narrador`; os puzzles, da sessão de puzzles. Aqui fica só onde cada coisa chega.

## 85. Os desenhos do dado: livro, pegar e escrever refeitos (cenógrafo, pedido do Pedro)

Os desenhos que o dado mostra (`src/scene/sketch.ts`, na face de cima, no balão e nos murais da Biblioteca) continuam no mesmo estilo, de traço
grosso e limpo com o laranja do fogo, porque têm de ser lidos de relance em 40 px (os desenhos a giz das paredes, §80, são outra coisa: o
giz fino dos condenados). Três se liam mal e foram refeitos:
- **livro**: era um retângulo em pé, que parecia uma porta. Agora é o livro **fechado e deitado**, visto um pouco de cima: a capa, a espessura
  das folhas na frente, a lombada e a fita laranja. É o desenho da fala «LIVRO» do dado no Vestíbulo e do bloco LIVRO do mural de encaixe.
- **pegar**: era uma mancha. Agora é uma **mão descendo e fechando os dedos** em volta do mesmo livro, com uma **seta laranja para cima** (o
  contrário da placa, em que a seta aperta para baixo). É o desenho de «VOCÊ PEGAR LIVRO» no Vestíbulo. Numa segunda passada (o Pedro pediu
  para melhorar), a mão deixou de ser contorno, que em 40 px parecia um ancinho, e virou **mão cheia**, em marfim: pulso, costas da mão,
  os quatro dedos juntos com a separação escura e o polegar do lado, pousados na capa.
- **escrever**: tinha riscos demais (mão, página, pena e um livrinho). Agora é uma **folha** com duas linhas já escritas e a **pena** escrevendo
  a terceira, que sai laranja da ponta. É o mural ESCREVER da Biblioteca.
- O mural de encaixe usa o mesmo desenho do dado, então os dois mudaram juntos e o puzzle de casar o desenho com o nome continua igual.

## 86. O som da interface: coisa de verdade, não mágica (pedido do Pedro)

"Uma coisa que acho que podemos melhorar é o som de UI, de clicar nas coisas." Os sons de interface eram notas de instrumento: uma celesta
em todo clique, harpa ao abrir a pausa, glockenspiel ao anotar e uma nota de glockenspiel diferente para cada face do dado. Pela mesma regra
do §79 (efeito é coisa física; nada de celesta, sino ou glockenspiel), todos viraram gravações de **pedra, papel, couro e metal**, cada um
ligado ao objeto que aparece na tela:

- **Menus (pedra talhada, `src/ui/Menus.tsx`):**
  - **apertar um botão** (`uiblip` com força 0,75 ou mais; também o E/AGIR e as opções da pergunta do dado): um toque curto de pedra, a
    pedrinha batendo grave e o corpo do toque;
  - **passar pelas opções, mudar de aba ou de ajuste, o dado falando** (força abaixo de 0,75): só o tique da pedrinha, bem baixo;
  - **abrir a pausa** (`uiopen`): um arrasto curto de pedra e a tábua assentando; **fechar** (`uiclose`): a pedra assentando, grave.
- **O caderno (`src/book/book3d.ts`), com as gravações de livro do RPG Sound Pack do Kenney (CC0):**
  - **tirar da bolsa e abrir** (`bookOpen`): o couro da bolsa e o livro abrindo; **fechar e guardar** (`bookClose`): o livro fechando e o
    couro;
  - **virar a página** (`uiflip`): papel de verdade, três tomadas em rodízio (antes era o "swap" do dado);
  - **tocar numa parte do papel** (`bookTap`: escolher uma linha do índice, um símbolo, uma ferramenta do mapa): o comecinho de uma virada de
    página, curto e baixo;
  - **o fecho de metal** (`bookLatch`): o trinco de metal.
- **Anotado no caderno** (`uinew`, um símbolo novo avistado): um risco de lápis no papel.
- **Trocar a face do dado** (`face`): o dado batendo de leve na mão, um pouco mais agudo a cada número (antes era uma escala de
  glockenspiel).
- Arquivos novos em `public/audio/sfx/`: `book_open`, `book_close`, `book_flip1` a `book_flip3` e `latch` (mapa em `tools/build_audio.py`;
  `AUDIO_VERSION` 8). Os outros sons já estavam no jogo (`bounce4`, `put1`, `put2`, `rise`, `catch`, `erase`, `bounce1`).
- **Níveis medidos**, cada um sozinho (pico): apertar −18 dB, passar por cima −29, mudar de aba −28, abrir a pausa −18, fechar −16, abrir o
  caderno −9, virar a página −10, tocar no papel −21, o fecho −10, fechar o caderno −9, anotado −25, trocar a face −11. Os do caderno são
  mais altos de propósito: é o objeto grande que o personagem tem na mão; os de passar por cima são os mais baixos porque tocam a toda hora.

## 87. As configurações cabem em qualquer janela (pedido do Pedro)

"Menu tá bem estranho, e dependendo da janela fica o botão de voltar cortado lá embaixo." Três defeitos na tela de Configurações:

- **O Voltar sumia.** A tábua inteira rolava junto com a lista de opções, e a lista tinha uma altura máxima calculada à parte. Em janela
  baixa ou estreita (no PC, 820 × 620, com as abas em duas linhas; no celular, a aba Imagem) a tábua passava da tela: duas barras de
  rolagem e o Voltar cortado embaixo. Agora as tábuas grandes (configurações, espaços de jogo, créditos) são uma coluna: o título, as abas e o
  Voltar ficam **sempre à vista** e **só o meio rola**, numa barra de pedra fina. A altura máxima usa `100dvh`, a altura de verdade da tela
  do celular (com a barra do navegador).
- **Letras de dois tamanhos.** No celular o nome da opção saía com o dobro do tamanho das escolhas (`--fm` × `--fs`): o nome parecia título
  e os botões ficavam pequenos demais para o dedo. Agora o nome e as escolhas usam a mesma letra em qualquer tela. O número dos ajustes (o
  "0" do Brilho) fica colado na barra, não solto na ponta da linha. No celular baixo, o ícone do título cai para 24 px.
- **Nada dizia que havia mais embaixo.** No celular a barra de rolagem só aparece enquanto se rola. Com opções escondidas embaixo, a borda
  de baixo da lista esmaece e **três pontinhos de ouro** piscam entre a lista e o Voltar; com a lista já rolada, a borda de cima também
  esmaece (`useScrollCue` em `src/ui/Menus.tsx`).
- Testado em 6 tamanhos (celular 915 × 412 e 740 × 360; PC 1280 × 720, 1400 × 560, 1920 × 1080 e 820 × 620): o Voltar fica inteiro dentro da
  tábua e da tela em todos, a tábua não rola mais (só a lista), e o Voltar funciona.

## 88. O visual das configurações (pedido do Pedro: "quero que melhore o visual desse menu")

A tela parecia um formulário: abas soltas, cada escolha numa caixinha separada, tudo na mesma pedra lisa. Agora ela segue a mesma regra do
resto da interface (pedra é o mundo, ouro só no que está escolhido; `src/ui/menus.css`):

- **A tábua** ganhou a moldura de 9 pedaços das caixas de fala e dos avisos (`--frame-stone`, `frames.css`): quina de cima clara, sulco e
  cantos lascados pixel a pixel. Vale para todas as tábuas de menu (pausa, espaços, confirmação, créditos), que antes usavam uma borda de
  CSS com os cantos cortados.
- **As abas** são entalhes no alto de uma **laje** (o painel das opções): a aba escolhida é da mesma pedra da laje e se emenda nela, com
  a quina clara em cima e o texto em ouro; as outras ficam atrás, mais escuras, com o ícone apagado.
- **Cada opção é uma linha da laje**: o nome à esquerda e as escolhas num **sulco talhado** à direita, onde a escolhida é a pedrinha que sobe,
  em ouro, com o ponto dos glifos. Os ajustes (volume, brilho, campo de visão) têm a fileira de entalhes no mesmo sulco, entre as duas
  pontas de pedra, e o número colado.
- **A linha em que se está** ganha um ponto de ouro antes do nome e um fundo um pouco mais claro: pelo teclado (`:focus-visible`) ou com o
  mouse por cima. No toque nada fica marcado (o toque não é "estar" numa linha).
- **Tudo cresce junto na tela grande**: bordas, pontos, setas, entalhes e os ícones das abas crescem em pixels inteiros com a escala da
  tela (`--px`), no mesmo passo das letras. Antes, em 1920 × 1080, as letras eram de 30 px e as barrinhas continuavam de 8 px.
- Testado no celular (915 × 412) e no PC (1280 × 720 e 1920 × 1080), nas abas Áudio, Imagem, Controles e Acessibilidade, e a moldura nova na
  pausa, na confirmação e nos espaços de jogo.

## 89. A pasta e o endereço passam a se chamar «sentenca» (pedido do Pedro)

A pasta do jogo virou `apps/sentenca/` (era `apps/masmorra-do-dado/`) e o endereço publicado virou
**https://peterpedrons-maker.github.io/dungeon-depths/sentenca/**. Sem o «ç»: num endereço ele vira `%C3%A7`, e o link fica feio e fácil de
errar quando alguém digita.

- `vite.config.ts` (`base`), o cache do service worker (`sentenca-vNN`), o nome do pacote e todos os caminhos em `CLAUDE.md`, nos três
  subagentes (`.claude/agents/`), no `.gitignore` e no `PUZZLES.md` foram trocados. O workflow de publicação não mudou: ele publica sozinho
  cada pasta de `apps/`.
- O nome que o jogador vê também virou **Sentença**: o título da aba do navegador e o nome do app instalado (`manifest.webmanifest`), que
  ainda diziam «Masmorra do Dado».
- **Os jogos salvos continuam**: o salvamento fica no navegador por site (`peterpedrons-maker.github.io`), não por pasta, e as chaves
  (`mdd-...`) não mudaram.
- O endereço antigo (`/masmorra-do-dado/`) deixa de existir. Quem instalou o jogo pelo endereço antigo precisa instalar de novo pelo novo.
- A branch do cenógrafo (`claude/cenografo`) ainda usa a pasta antiga: ao juntar, o git acompanha a troca de nome dos arquivos que já
  existiam; arquivos NOVOS criados lá na pasta antiga precisam ser movidos para `apps/sentenca/`.

## 90. O ícone do app é o dado 2D da tela de carregamento (pedido do Pedro)

"Faz com que o ícone do aplicativo seja o ícone 2D do dado que aparece na tela de loading, ou alguma daquelas figuras das paredes; acho que o
dado ficaria melhor." Ficou o dado. O ícone era a face do dado com o triângulo ACENDER (§45, passo 6).

- **É o mesmo desenho do jogo**, não uma cópia: `tools/build_app_icon.mjs` abre o código do jogo num navegador (Vite + Playwright), pega a
  face de `dieRostoCanvas` (a face 3, a do Fogo, com o ouro, os rebites e os olhos acesos; o rosto de afeição neutra olhando para quem vê),
  pinta com a mesma luz chapada da tela de carregamento (§83, `src/ui/loadart.ts`) e amplia em pixels inteiros. Se o rosto do dado mudar,
  basta rodar o script de novo.
- Em volta: o contorno escuro de 1 pixel e, atrás, o escuro das salas com uma luz quente em anéis pontilhados. Sem a borda acesa da tela
  de carregamento (lá ela é o reflexo da frase; aqui parecia um risco).
- Tamanhos: 512 (o dado ocupa 462 px, 7 por pixel), 192 e 180 do iPhone (2 por pixel) e o 512 **mascarável** (4 por pixel, 264 px: cabe
  inteiro no círculo que o Android recorta, com as cantoneiras de ouro à vista).
- `tools/build_logo.py` agora só gera o logo; a parte do ícone antigo saiu, para não sobrescrever o novo.
- Quem já instalou o app pode continuar vendo o ícone antigo até reinstalar (o celular guarda o ícone da instalação).

## 91. Avaliação do capítulo 1 e as decisões do Pedro sobre ela

Pedi para fazer uma avaliação crítica do capítulo 1 inteiro (ritmo, puzzles, dificuldade), feita a partir das soluções do `PUZZLES.md`, da régua
(§17) e da meta de duração (§13), sem um teste às cegas. O Pedro respondeu a quatro pontos, que **não são problema** e não devem voltar como
crítica:
- **A Memória da Casa ser o ensaio do Tribunal** (mesma lei «DOIS BOATO IGUAL VERDADE», mesmos apelidos): é de propósito. O jogador repete
  puzzles de qualquer forma.
- **O capítulo 1 chegar ao nível 9 e 10 da régua:** ele esgota a escala **só com o Fogo**. Nos capítulos seguintes a dificuldade volta a subir
  com as ferramentas novas e com a combinação delas (Fogo com Peso etc.), não com lógica mais funda. A curva antiga do §17 («o capítulo 1 termina
  no nível 5») está superada: a régua vale **por conjunto de ferramentas**.
- **Duração:** os 4 a 6 h do §13 são uma média, não um teto. O capítulo 1 pode passar disso.
- **Respostas repetidas** (QUATRO, os quatro cantos, em várias salas e constelações): não é problema que o jogador chute por hábito.

Pontos da avaliação que **continuam em aberto** (o Pedro não decidiu ainda):
1. Da sala 12 em diante, 7 dos 9 puzzles são «ler frases ANTES/DEPOIS com marcas, deduzir a ordem, acender em fila»; os puzzles de espaço,
   tempo e física (Fio, Ponte, Sombra, Chama Curta) quase somem no fim.
2. A dúvida dupla: quem anotou errado uma palavra de relação (ANTES/DEPOIS, GRANDE/PEQUENO, IGUAL) erra todas as salas de ordem sem saber
   se errou a palavra ou o raciocínio (as perguntas do dado cobrem ANTES, DEPOIS, PEQUENO e VERDADE).
3. O Fogo que Corre: a janela de 3 a 7 s faz um erro de execução parecer erro de ideia; falta uma âncora visual de tempo, como a chama
   longe da Chama Curta.
4. A abertura: o Pedro acha que ninguém leva 8 a 12 minutos até a Lousa (os puzzles do começo são simples e a leitura é a história, que
   importa). Decisão: um botão de **pular a introdução** (§92).
5. ~~Partes do `PUZZLES.md` desatualizadas~~ (corrigido no §92: o topo, a Sala 1 e a tabela das perguntas do dado).
6. O teste às cegas com pessoas que nunca jogaram: o Pedro está fazendo.

## 92. Pular a introdução (pedido do Pedro)

"O que a gente pode fazer é adicionar um botão de pular toda a introdução." Do acordar até o fim da explicação do dado (o dado no centro da
tela, logo depois de ser pego), aparece no alto, à direita, uma plaquinha de pedra «Segure para pular a introdução» (`src/ui/SkipIntro.tsx`).
- **Segurar, não tocar**, para ninguém pular sem querer: no PC, a tecla **Espaço** (o mouse está preso no jogo, não há cursor), com a tecla de
  pedra desenhada na plaquinha; no celular, **o dedo na plaquinha** (embaixo do botão de pausa). Uma faixa de ouro enche em 1 s; cheia, pula.
  Um toque curto não pula. (Segurar o Espaço com uma conversa na tela também passa uma fala: não faz mal, a abertura vai ser pulada.)
- **O que o pulo faz** (`skipIntro` em `scene.ts`): desmonta o que estiver rodando (a cena de acordar, o «Trancada.», o Escrivão lá fora e a
  câmera de cinema, o dado caindo ou caído, a explicação), cancela as falas do dado que ainda iam aparecer (`talkGen`) e o que o Poço tinha
  agendado (`ctx.introGen`), e deixa o jogador de pé no Poço com o **dado de Fogo na mão**, com as marcas da abertura (`intro`, `caiu`,
  `dado`) e os símbolos que ela mostra marcados como vistos (vão para o caderno quando ele for achado). Salva na hora.
- Quem pulou sem nunca ter visto ainda precisa saber o que fazer: logo depois do pulo, o dado pede uma vez **«ACENDER BRASEIRO»**, com o
  desenho (a última frase da explicação).
- A caixa de conversa, que passa a fala com qualquer toque na tela, ignora o toque na plaquinha.
- Testado no PC (pulando no acordar, no meio da cena do Escrivão lá fora e durante a explicação do dado) e no celular (toque curto não pula;
  segurar pula): em todos, o dado fica na mão, nenhuma cena fica presa (o jogador anda), nada aparece depois e não há erros.
- `PUZZLES.md` corrigido junto: o topo (o capítulo 1 é só o Fogo; o Peso chega no altar do Tribunal), a Sala 1 (a cena do Escrivão e o pulo) e
  a tabela das perguntas do dado (numeração atual das salas; as perguntas de IGUAL e TODOS estão prontas, mas sem gatilho).


## 93. Três salas novas no lugar das salas de ordem: A Balança, A Ponte de Frases, O Claustro do Vento (pedido do Pedro)

Da avaliação do §91 (item 1: da sala 12 em diante, quase tudo era «ler ANTES/DEPOIS e acender em fila»), o Pedro aprovou trocar três salas,
mantendo as palavras que cada uma ensina (as salas seguintes dependem delas), com um elemento que o capítulo ainda não tinha. Condição dele:
**passar por todos os verificadores e pelo cenógrafo, sem perder nenhum furo de luz, segredo, gema ou folha**. As antigas vão para a reserva,
com os verificadores (`apelidos.ts`, `FIRE_VERDADE`, `FIRE_DIZEM`). Da 12 em diante o capítulo alterna espaço e lógica: Balança, Ponte de
Madeira, Ponte de Frases, Sombra, Escuro, Lei Pequena, Fogo que Corre, Claustro do Vento, Memória, Tribunal.
- **Sala 12 · A Balança** (`rooms/balanca.ts`, `tools/verify_balanca.mjs`): a mesma rotunda de Os Apelidos. Uma balança de pedra e bronze; sete
  pesos de pedra pendurados por cordas numa viga do teto; **dois pendem embaixo de outro** por uma corda curta (queimar a de cima derruba os
  dois; a curta, só o de baixo). O dado de Fogo queima a corda (a mira de Fogo clareia a corda, `fireAim`/`fireNear`) e o peso cai no prato; o
  travessão é uma mola amortecida até o ângulo da diferença de massa (pequeno 1, médio 1,5, grande 2). Os números talhados nos pesos (GRANDE
  = UM, pequeno = QUATRO, médio = DOIS) são a armadilha de Os Apelidos em outra forma. A Casa julga no **braseirinho ao pé do poste**; o erro
  é o único jeito de desfazer (escuro, os pesos sobem, cordas frias 8 s). IGUAL é o glifo do Peso: a sala planta a ideia de peso no capítulo do
  Fogo, e paga no altar do Tribunal (§77). Ensina GRANDE, PEQUENO e IGUAL pelo efeito (os glifos da porta e o IGUAL do poste reagem).
- **Sala 14 · A Ponte de Frases** (`rooms/chapter1c.ts`, `tools/verify_ponte_frases.mjs`): as mesmas oito frases e a porta «ACENDER VERDADE» de
  O Boato Verdadeiro, mas o meio da sala é um **fosso** e cada frase acesa **ergue a sua laje**: dizer é fazer. A laje da frase falsa sobe e
  **racha quando pisada** (o jogador cai, o escuro vem, a Casa apaga as frases e ele volta à entrada; `ctx.toEntrance()`). A demonstração é a
  primeira fileira, já em cima. O caminho firme vai em zigue-zague e exige os dois boatos verdadeiros; só as confirmadas (o hábito da sala 8)
  não atravessam. **No motor** (`fire.ts`): `FireSpec.floorGap` (o chão com o buraco, as paredes e o fundo), `lock.judged` (a legenda do
  julgamento), e na `FireExtraApi` `lines()`, `lockRisen()` e `failLines()`. O `skip()` das salas julgadas na porta deixa acesas as frases
  certas e a da porta (a ponte fica em pé para quem volta). As lajes têm `userData.noPlan`: a afundada passa do fundo e não conta na planta.
  A proposta dizia «volta pela escada»; a escada não coube (a fileira da demonstração fica sempre em cima, encostada na borda), e a volta é o
  escuro da Casa, como nas outras punições.
- **Sala 21 · O Claustro do Vento** (`FIRE_VENTO`, `claustroExtra`, `buildWind` em `rooms/chapter1b.ts`; `tools/verify_vento.mjs`): o mesmo claustro,
  a mesma lei e a mesma ordem (1, 5, 2, 3, 4), a mesma constelação C6 e a **gema c6**. Os estandartes ficam em **gaiolas de ferro** penduradas sob o
  telhado das galerias (o dado não chega; elas param abaixo dos frisos da C6) e o fogo chega pelo **vento**, que gira em ciclo (fundo,
  esquerda, frente, direita; 6 s cada; o cata-vento na estela da fonte aponta). Três **fogaréus** no pátio soltam fagulhas por 4 s, que voam a
  ~3,2 m/s numa faixa (larga no grande) e põem fogo nos estandartes que alcançam; queimar dois faz a Casa abafar os fogaréus e pendurar tudo
  de volta. Só o fogaréu da esquerda da fonte, no vento para o fundo, queima o boato certo sozinho (~6 s por volta). Mudanças de lugar: o 5º
  estandarte passou para entre as colunas 6 e 7 (antes ficava dentro da coluna do meio da frente) e os braseiros UM e DOIS foram um pouco
  para o fundo (os fogaréus ficam a quase 2 m deles).
- **O que foi conferido** (a condição do Pedro): os 21 verificadores passam (os três novos e os das salas antigas, que ficam na reserva); a
  foto do mundo antes e depois (`__mdd.rooms()`, `skyHoles()`, `footprints()`): as 24 salas nos mesmos lugares, giros e portas, os **6 furos de
  luz** nas mesmas salas e pontos (nenhum estava nas salas trocadas), as plantas iguais (a da Ponte de Frases ficou dentro da antiga); as
  gemas do capítulo continuam três (Cisterna, Ala do Papel, C6) e as folhas p2 a p18 continuam nas mesmas salas (nenhuma estava nas trocadas).
  Os nomes novos foram para `tools/planta/salas.json` (a planta regenerada só trocou os nomes), `gems.ts` (c6), `quiz.ts` (as perguntas 6 e 8
  passam a vir depois da Balança e da Ponte de Frases) e os verificadores de vocabulário e de constelações.
- **A revisão do cenógrafo** (leitura e acabamento, sem mexer em regra, número, posição de puzzle nem planta; os três verificadores e os testes
  de solução e de erro passam como antes). **Balança**: os números dos pesos agora são talhados como as inscrições (sulco escuro e cal
  branca, dentro da face: antes o desenho era maior que a face e os pontos pareciam rebites nas quinas); a viga em madeira clara com cintas de
  ferro e um olhal em cada corda (no teto escuro as cordas pareciam sair do nada; o olhal do peso de baixo fica preso no de cima, e cai com
  ele); o braseirinho ganhou pé e capa de pedra lavrada, borda de bronze, carvão e **a mesma brasa pulsando dos soquetes das frases** (era um
  ponto parado de 6 cm), e uma luz quente enquanto a Casa julga; soco e cornija nos arcos da rotunda, fuligem acima das quatro tochas, chão gasto
  da entrada à balança e da balança à porta, sombra de contato no pé. **Ponte de Frases**: o fosso agora se lê da entrada: as paredes do
  buraco e os lados das lajes escurecem para baixo (cor por vértice), o tampo de cada laje escurece lá embaixo e clareia conforme sobe, cada
  laje tem uma quina lavrada (lê-se qual é qual), as duas bordas ganharam uma capa de pedra lavrada que desce para dentro do fosso, o fundo é
  carvão com brasas nas frestas (sem luz) e saíram as duas luzes vermelhas do fundo (viravam dois círculos acesos e clareavam o buraco); o
  rodapé e a sombra do pé das paredes não passam mais por cima do fosso (desenhavam a linha do chão continuando). **Claustro do Vento**: o
  bordado dos estandartes ficou grosso (`makeCloth` ganhou `thick`; só nesta sala) e as gaiolas têm metade das barras (o texto aparece entre
  elas; o dado continua sem passar), e as peças das gaiolas vão juntas numa malha (de ~500 para ~300 desenhos olhando o pátio); o cata-vento é
  de bronze, maior, com quatro hastes fixas de referência; folhas secas (pontos pardos, nunca laranja) correm pelo pátio a favor do vento o
  tempo todo; os fogaréus viraram cestos com aro e garras, com carvão em monte e **a brasa pulsando** enquanto apagados, e o poste barra o
  jogador (antes só o dado). A brasa dos soquetes (`emberTexture`, `fire.ts`) agora é exportada e é a mesma nos três lugares.

## 94. O enigmista; a Ponte de Frases sem o atalho de pisar; o tempo do Fogo que Corre; as perguntas de IGUAL e TODOS (pedidos do Pedro)

- **O agente de puzzle** (`.claude/agents/enigmista.md`): o Pedro pediu que todo puzzle feito ou corrigido passe por um agente de puzzle, que não
  existia (o cenógrafo é de arte e level design). O **enigmista** projeta e confere: solução única num verificador (`tools/verify_*.mjs`), dedução e
  não sorte (mede o custo de testar à força, acender tudo, chutar), o que o erro ensina, a língua, a régua (§17) e janelas de tempo com âncora que
  se vê. Ele projetou as duas mudanças abaixo e conferiu a implementação.
- **A Ponte de Frases sem o oráculo** (sala 14, `rooms/chapter1c.ts`): na 1ª versão (§93), pisar numa laje dizia se a frase dela era verdadeira, e
  dava para resolver acendendo uma por uma e pisando, sem entender VERDADE (o Pedro: "a ideia continua a mesma, mais orgânica, que não dependa só
  de sorte; o jogador nem aprende o que está querendo dizer"; e "aumentar o tempo de punição não é solução"). Agora **a ponte é uma peça só**: as
  lajes erguidas se travam e dá para andar nela à vontade; **a Casa pesa a ponte quando o jogador pisa na última fileira**, e qualquer mentira acesa
  (em qualquer lugar) derruba a ponte inteira. Ela **não diz qual frase mentiu: cita as confirmadas que a mentira nega** (a luz corre por elas no
  tremor e, quando a luz volta, por mais 6 s, a luz correndo por elas de novo e de novo; `FPF_CITA`, `CITE_S`). O erro ensina: comparar as citadas com o que se acendeu leva à mentira por uma cadeia de 1 ou 2
  passos. A grade passou a **2 × 5** (fileiras de 3 m; a sala e o fosso não mudaram) com seis boatos (três verdadeiros, três falsos) e as mesmas
  três confirmadas (ordem 3, 1, 2, 4). A **abertura** ensina a regra sem custo: a sala começa com a ponte inteira acesa (a ponte de quem veio antes),
  que aguenta até a última fileira, cai e cita as três confirmadas. O custo de chutar (`verify_ponte_frases.mjs`): pisar não responde; chutar rota
  custa 2,5 quedas em média; acender tudo e ir apagando, ~31; deduzir, nenhuma. Motor: `api.cite(idx, secs)` (a luz da frase sem acendê-la),
  `api.setLines(on)`, `extra.judgeFail(lit)` (o erro da porta também cita) e `BurnLine.pulse(silent)` (a frase já acesa repete a luz; só a corrida
  que a Casa dispara soa, as repetições são mudas). O frio da queda é de 1 s (`failLines(1)`): só barra um dado em voo enquanto a ponte cede (um frio
  maior fazia a 1ª frase da volta ser recusada). Na conferência, o enigmista achou e fechou três buracos: andando ou correndo dava para sair da
  última fileira antes de a ponte ceder (0,7 s de tremor), e da borda da porta pôr um pé na fileira 4 virava o oráculo de novo, sem queda; agora,
  enquanto a Casa pesa, a borda não recebe ninguém. A Casa espera a cena do dado queimando acabar para pesar (a mentira chega a brilhar). E a
  citação se repete quando a luz volta. A estratégia "testar de cima da ponte, um boato de cada vez" custa 3 quedas, sempre: é trabalho, não sorte.
- **O tempo do Fogo que Corre** (sala 20, `fogoCorreExtra`): a janela de 3 a 7 s não tinha referência que se visse (§91, item 3). Agora **o braseiro do
  centro é menor e queima menos** (a regra da Chama Curta: o tamanho diz quanto dura; `FC_BURN`: 6,5 s cada, o centro 5,75 s), a chama de cada
  braseiro encolhe devagar enquanto queima (até ~62%) e **morre** no último 1,5 s (treme, encolhe de vez, solta fumaça e o glifo TEMPO pulsa só aí).
  A janela é de ~2,8 a 8,4 s e o centro é o primeiro a morrer, aos 4,25 s. Na conferência, o enigmista mediu no navegador que o dado que ACENDE volta
  à mão ~0,2 s depois (a cena de 0,3 s para o relógio da sala), e não 2,45 s: com o centro a 4,5 s a janela começava no meio do tempo de quem acende
  o 6 com pressa, e a mesma ideia dava certo ou errado conforme a mão. Com os tempos novos **a pressa erra sempre** (0,7 s de sobra; o 7 aceso junto
  com os cantos mostra por quê) e quem espera um sinal da sala acerta: o último canto acender (0,75 s de folga), o centro começar a morrer (2 s) ou o
  centro apagar (0,8 s). Os cantos 0 e 8 começam a morrer aos 7 s, o aviso de "tarde demais". No celular, quem leva ~1,8 s para mirar com pressa já
  cai na beira da janela (o verificador avisa). Ele confere que o jogo usa os mesmos tempos.
- **As perguntas de IGUAL e TODOS** (`quiz.ts`): estavam prontas e nenhuma sala as chamava (o verificador de vocabulário já contava com elas). IGUAL
  vem na chegada ao pé da Escadaria (`Room.calm` em `respiro4.ts`; a saída dela dá direto na passarela da Biblioteca, sem corredor) e TODOS no
  corredor depois da Memória, antes do Tribunal.

## 95. O trailer do começo do jogo (pedido do Pedro)

O Pedro pediu um trailer "épico, cinematográfico", só com o começo por enquanto, para melhorar depois. Ele dura 1min18, em 1080p e 24 quadros por
segundo, e é todo gravado do jogo de verdade (`tools/trailer/`, ver o README de lá). Um relógio virtual faz cada quadro andar exatamente 1/24 s, então a
gravação não trava nem pula. A **câmera do trailer** (`__trailerCam`, só em desenvolvimento, em `scene.ts`) assume a imagem nas tomadas fora da
abertura. Os ganchos de teste ganharam `sockets(i)` e `w(i, x, y, z)`. O roteiro:
- o preto, e o olhar que sobe do chão do Poço até a luz;
- o acordar, com as falas em legenda na fonte do jogo: «Caí? Ou me jogaram?», «Luz, lá em cima. Alto demais.», «Trancada.», «...Tem alguém aí?»;
- o Escrivão chega e se debruça; VOCÊ VIVER ? · EU DAR DADO · VOCÊ LER em glifos; a mão, a queda com a câmera embaixo do dado, o baque e o preto;
- o dado no chão falando em balões, o rosto dele grande, e o 1º fogo de perto (o dado queimando na brasa);
- uma montagem: o fogo correndo nas canaletas, a corda da Balança queimando e o peso caindo no prato, as fagulhas no vento queimando o estandarte
  do boato, uma frase acendendo e a laje subindo do fosso, e a ponte de quem veio antes desabando;
- o preto, e o título «SENTENÇA» com o triângulo ACENDER, EM BREVE e Cinco Riscos.

A **trilha** é composta com as gravações do próprio jogo: contrabaixo, coro, harpa, celesta, sino, tímpano e cordas do FluidR3, mais os efeitos CC0.
`renderAudio` ganhou as operações `note` e `sample`, e o passo caiu para ~11 ms, para os golpes caírem no corte. O desenho da trilha:
- um grave que respira e gotas no Poço;
- vento, passos e um sino quando o Escrivão aparece;
- a celesta nas falas em glifos;
- na queda, cordas subindo e um rufo de tímpano até o baque, depois silêncio;
- na montagem, um pulso de cordas, com um golpe em cada corte e o som de cada sala;
- no título, o gongo e o coro.

Os efeitos continuam sendo coisas físicas: fogo, pedra, corda, vento.


## 96. Leitura e acabamento na Ponte de Frases, na Balança e no Claustro do Vento (cenógrafo, pedido do Pedro)

As sugestões que ficaram da conferência do enigmista (§94) e da revisão do cenógrafo (§93). Nenhuma regra, número, posição de puzzle, furo, segredo,
gema ou folha mudou; os 21 verificadores passam e as três salas se resolvem no navegador como antes.
- **A Ponte de Frases** (`rooms/chapter1c.ts`):
  - **As travas.** A ponte é uma peça só, e agora isso se vê: em cada junta entre duas lajes erguidas que a Casa pesa (a demonstração não entra) assenta
    um grampo de bronze escuro em cauda de andorinha, a peça que se embute atravessando a junta de dois blocos (dois em cada junta entre fileiras e
    dois na junta do meio; 20 numa malha só, `InstancedMesh`). Ele desce na junta 0,22 s depois de a 2ª laje chegar em cima, sai quando uma delas desce
    (a frase apagada), chacoalha e dá um lampejo pálido de metal forçado no tremor (nunca a cor das brasas) e, quando a ponte cede, salta e cai no fosso.
    O bronze tem recuo de profundidade para ganhar da quina clara das lajes (um plano por cima do tampo, que antes cobria metade dele).
  - **A ponte prende o pé.** O motor ganhou `ctx.shake(k, secs, hold)` (`types.ts`, `scene.ts`): uns milímetros de câmera e um quase nada de giro, que
    somem no fim; com "reduzir movimento", não treme. `hold` prende o passo enquanto treme. Nos 0,7 s em que a Casa pesa, o tremor cresce (0,35 → 1) e o
    passo anda a 20%; quando ela cede, um tranco (1,6). O dado da mão treme junto (`dieReact('shake')`) e um pó cor de pedra sobe das juntas travadas e
    escorre da beirada da borda da porta para o fosso (uma nuvem quando cede; `Points`, 160 grãos, que apagam no escuro da Casa). A borda continua
    fechada por `rects()`, como no §94: o que mudou é que o jogador sente a ponte segurar em vez de bater numa parede que não se vê.
  - **A citação se lê de longe.** Cada frase que a Casa pode citar (as de `FPF_CITA`: UM ANTES DOIS, UM DEPOIS TRÊS e QUATRO DEPOIS DOIS) tem uma luz de
    verdade 1,4 m fora da parede e acima dela, que acende quando a Casa aponta (`citeNow`, junto com `api.cite`) e apaga devagar: da entrada, a citada do
    fundo vira uma mancha quente na parede, e não um pontinho dourado. É luz na pedra, não faixa atrás da escrita (§58): o glifo continua sendo o que
    brilha, e o mais claro cai acima dele. A força é firme (46) e o alcance curto (2,6 m; a vizinha recebe uns 5%): medido com `__mdd.lights()`, com a
    força das frases (4 a 11) a citada do fundo nunca ganhava uma das luzes emprestadas vista da entrada (a 12ª vaga tem nota ~0,1); a 46, ganha sempre.
  - **No erro da porta, as citadas ficam atrás do jogador.** Quando a luz volta, o dado da mão MOSTRA a citada mais perto (`ctx.dieLook` por 5 s). O
    motor ganhou o caso de um ponto atrás da câmera: o dado se inclina todo para o lado dele, "por cima do ombro" (antes a projeção invertia o lado).
    O som das citadas vindo de trás fica com o sonoplasta.
  - **O custo dos lampiões com sombra** (medido andando na ponte, 3 idas e voltas, Chromium sem placa de vídeo; vale a proporção, não os ms): Altas no
    PC, 4 lampiões com sombra ~215–230 ms por quadro, ~870–890 desenhos; 2 lampiões (o 2º e o 4º) ~210 ms, ~860–910 desenhos; nenhum ~180 ms, ~610
    desenhos. Médias no celular (o padrão de lá), 4: ~133–136 ms, ~650–670 desenhos; 2: ~131–134; nenhum: ~126 ms, ~650. O motor tem um número fixo de
    luzes com sombra por opção e refaz até 2 (Altas) ou 1 (Médias) mapas por quadro quando o jogador se mexe: dois lampiões em vez de quatro não
    economizam nada, e sem nenhum a ponte perde a sombra do jogador e a das lajes no fosso (~15% nas Altas; nas Médias, nada que se meça). **Ficam os
    quatro.** O gancho `__pfLamps([1, 0, 1, 0])` liga e desliga cada um para medir de novo.
  - **Os sons** (do sonoplasta, `audio.ts`; `AUDIO_VERSION` 9). São só pedra, ferro e mecanismo, montados das gravações CC0 que o jogo já tinha (`tools/build_audio.py`, 4ª leva):
    - `'bridgeRise'`: o arrasto da laje subindo, sem o baque e sem o violoncelo do pilar. Antes era o `'rise'`, que fazia a "Casa aceita" até para a laje de uma mentira.
    - `'bridgeLock'`: a trava assenta 0,22 s depois de a 2ª laje chegar em cima; várias no mesmo quadro tocam um som só.
    - `'bridgeHold'`: no lugar do `altarCrack`, as travas mordem e a pedra range nas juntas, trepidando no ritmo do tremor, de t = 0 até t = 0,7 s.
    - `'bridgeBreak'`: quando ela cede, as travas estalam, as lajes raspam e batem no fundo (aos 0,44 s, o tempo da queda), e o entulho e as travas assentam.
- **A Balança** (`rooms/balanca.ts`): o número talhado agora está nas **quatro faces de pé** de cada peso (em cima e embaixo, a pedra lisa): de lado, na
  rotunda, o peso não dizia o nome. O **fiel** foi refeito: a agulha de ferro escuro ficou mais grossa (7 cm) e mais comprida (a ponta anda mais), contra
  um **mostrador** de pedra lavrada clara numa haste, com a marca de ouro do meio logo acima da ponta; uma agulha em cada face, para ler da entrada e do
  lado da porta (antes, de trás, a haste a escondia). Pendendo, a agulha sai de baixo da marca; IGUAL, a ponta fica embaixo dela. Tamanhos, massas,
  posições e cordas não mudaram.
- **O Claustro do Vento** (`claustroExtra`, `rooms/chapter1b.ts`; vale também para Os Que Dizem o Mesmo, na reserva): a passagem de 63 cm junto aos
  fogaréus era a **colisão quadrada da bacia redonda** da fonte (2,9 m de lado): nas diagonais ela sobrava 1 m além da pedra, justo onde ficam os dois
  fogaréus do lado, e o jogador esbarrava no ar. Agora a bacia é redonda também na colisão (cinco retângulos cruzados com as quinas no círculo, para o
  jogador e para o dado): a passagem é a que se vê, ~1 m na parte mais justa (junto ao pé do poste) e mais larga logo adiante. Os fogaréus, as gaiolas,
  os estandartes e a estela não se mexeram; o dado que cai na quina antiga agora vai ao chão, e não fica flutuando nela.

## 97. A galeria do Escrivão, atrás da janela de grade dos Nichos (cenógrafo, pedido do Pedro)

O Pedro mandou uma foto do celular: pela janela de grade do Corredor dos Nichos (sala 5, trecho C), onde o Escrivão passa andando, via-se um vazio
preto, um chão chapado e uma parede de tijolo com três tochas, com cara de cenário inacabado. Agora é uma galeria de verdade
(`src/scene/rooms/galeriaEscrivao.ts`, chamada por `respiro1.ts` no lugar dos quatro planos de antes). Não mudaram: o caminho e a velocidade dele
(x = −13, chão a 0,2 m, 8 m em 9 s), a janela e as barras (§78), a mini cena e quando ela dispara, os segredos da sala (as folhas, o nicho vazio, o
reflexo da Cisterna, a gema), a planta e o furo de luz.
- **A arcada de frente para a janela.** Cinco tramos de 3,4 m com abóbadas de aresta (as peças de `arch.ts`, como na Galeria dos Condenados, §65):
  quatro colunas redondas com arcos de aduelas entre elas, o tramo do meio bem na frente da janela, e arcos entre os tramos que nascem das colunas
  e de mísulas na parede do fundo. A face de fora da arcada é mais escura (nenhuma chama a alcança e a luz ambiente desta sala é forte): ela vira a
  moldura escura, e o olho vai para o claro de dentro dos arcos. Embaixo, uma mureta baixa entre as colunas (26 cm: da janela, não tapa os pés dele).
- **Ele aparece, vira o capuz e some entre colunas.** Visto da janela, ele surge saindo de trás da coluna da esquerda (o aparecer pontilhado fica
  meio escondido por ela), atravessa o arco do meio, vira o capuz para o jogador ali e passa para trás da coluna da direita perto do fim da mini
  cena (os últimos ~0,4 s dela); some no tramo seguinte, na frente do atril.
- **A luz desenha ele.** Duas tochas na parede do fundo (antes três): uma no tramo em que ele aparece e outra no tramo do meio, 0,9 m adiante de onde
  ele vira o capuz. A parede atrás dele fica clara e ele, escuro na frente dela, com os olhos acesos. Poças de luz no chão, fuligem acima de cada
  tocha. As tochas de lá só valem com o jogador no corredor (no pátio, com intensidade zero, não disputam as luzes emprestadas) e alcançam 7 m
  (não clareiam o corredor através da parede).
- **O caminho é dele.** No chão de lajes, uma faixa gasta, mais clara no meio, exatamente onde ele anda. No tramo onde ele some, o **atril** (o
  mesmo modelo da Biblioteca, onde fica o escritório dele) com um livro aberto, e numa mísula ao lado três velas, uma acesa (uma luz fraca, de 3 m).
- **As pontas e o vão.** A galeria termina, dos dois lados, numa parede com uma porta escura (o caminho dele continua no escuro, e não num corte).
  A beirada da galeria é uma fiada de pedra lavrada em balanço sobre mísulas; a parede de arrimo, recuada, some no preto até uma água parada 2 m
  abaixo. O peitoril esconde quase toda a água: quem se debruça na grade e olha para baixo vê, nela, as duas chamas de cabeça para baixo, tremendo.
  Lá em cima, o teto do vão quase preto. A janela ganhou espessura por fora (ombreiras, peitoril e verga de 30 cm, atrás da grade, sem mudar a
  abertura de 1,6 × 1,7 m).
- **Custo.** As peças paradas viram 14 malhas, uma por material (os objetos do atril juntados pelo `bakeProps`). Medido na janela:
  ~72 desenhos e ~19 mil triângulos (antes ~48 e ~9 mil); no pátio, o mesmo de antes (~355). A pegada da sala no mapa é a mesma (até x = −15);
  ela só desce mais (o fundo do vão, y = −2,2, antes −1,2), num lugar onde não há sala nenhuma embaixo.
- Testado no navegador (PC 1920×1080 e celular 844×390): a mini cena inteira com ele passando, a galeria de vários pontos do corredor, os reflexos.
  Não testado num celular de verdade.
- **Quando a câmera vira para ele** (pedido do Pedro: "apenas quando o jogador estiver totalmente em frente a grade"). A 1ª passagem, a da mini
  cena, só começa com o jogador NA janela (a menos de 0,6 m do eixo dela, entre as barras de fora, e na metade do corredor junto da janela) e
  OLHANDO para a grade (até ~40° de lado; `ctx.aim()`). Antes bastava passar perto, de lado ou de costas, e a câmera virava sozinha. Testado:
  de lado, de costas, 60° de lado, 1,1 m para o lado e longe demais, nada; de frente, a câmera acompanha o capuz. Depois da 1ª vez, ele só passa,
  sem cena, em qualquer ponto daquele trecho.

## 98. Três idiomas: português, inglês e espanhol (pedido do Pedro)

Pedido: "fazer com que o jogo esteja disponível no idioma do inglês… inglês e espanhol… a partir de agora… tudo que a gente colocar no jogo tem
que ter todos os idiomas, os 3… O jogador pode escolher ele assim que começar o jogo… Ou nas configurações."

- **A regra.** Todo texto que o jogador lê existe nos três: interface (menus, configurações, pausa, créditos, carregamento, avisos de ação, botões
  do celular, dicas), legendas e subtítulos de sala, pensamentos, o caderno inteiro (capa, índice, cabeçalhos, tutorial), as folhas dela, os
  textos, as perguntas do dado e os significados das respostas. O que **não** se traduz: os **glifos** dos Contáveis (a língua do mundo; o dado e
  o Escrivão só falam neles), o nome do jogo «SENTENÇA» e o da editora «Cinco Riscos» (marcas; o Pedro pode mudar isso).
- **Como.** `src/lang.ts` (sem dependências) tem `Lang`, `LANGS`, `guessLang()`, o tipo `Tx = { pt, en, es }`, `Text = string | Tx` e
  `T(pt, en, es)`; `src/i18n.ts` reexporta e soma `tx(texto)` (o idioma de agora, na hora de mostrar) e `useLang()` (React redesenha quando
  muda). O TypeScript cobra: um `Tx` sem um dos três não compila. O texto vira string **na hora de mostrar**, não na hora de criar: `ctx.caption`,
  `ctx.say` (a caixa de conversa resolve), os rótulos de ação (a cada quadro), as páginas do caderno (`pages.ts`; o livro se redesenha quando
  o idioma muda). Por isso trocar o idioma no meio do jogo muda tudo na hora, inclusive o caderno aberto.
  - `lang.ts` existe separado porque `story/config.ts` (onde o idioma é guardado) precisa de `T`, e o `i18n.ts` importa `config.ts`: com os
    dois se importando, a ordem de carga deixava `T` sem valor e a página ficava em branco.
- **Nomes de sala.** O `name` de cada sala continua em português: é a CHAVE da planta, dos saves, das gemas, das perguntas e do mapa. A tradução
  fica em `src/story/roomnames.ts` (`ROOM_NAMES`, `roomTitle("Sala N · X")`) e só vale na tela. Sala nova = linha nova lá.
- **Perguntas do dado.** As opções continuam guardadas pela chave em português (o save não muda); `optLabel(chave)` mostra no idioma
  (`MEAN` em `quiz.ts`), e a anotação que a resposta acrescenta ao glifo é escrita no idioma de quando se respondeu.
- **O caderno.** Os rótulos das abas do mapa traduzem só na tela (térreo/subsolo: T e S, G e B, B e S). A capa «CUADERNO» e «NOTEBOOK» têm 8
  letras: a etiqueta alarga 6 pixels e o passo das letras aperta 1. As folhas dela foram traduzidas pelo `narrador` cabendo nas mesmas 13
  linhas de 16 letras. A fonte do caderno (`src/book/font.ts`) e a da interface (`public/fonts/mdd-pixel.otf`, `tools/build_font.mjs`)
  ganharam ¿ e ¡ (o ? e o ! girados meia volta) e os acentos do espanhol.
- **A escolha.** Na 1ª vez que o jogo abre (`langChosen` falso), antes da abertura da editora, uma tábua de pedra pergunta nos três
  («Escolha o idioma / Choose your language / Elige el idioma») com o idioma do aparelho já em cima e em ouro (`LanguagePick` em `Menus.tsx`).
  Depois, em Configurações → Idioma. `?lang=pt|en|es` fixa o idioma (testes, trailer: `tools/trailer/` grava em português, `TRAILER_LANG` muda).
- **O verificador.** `tools/verify_i18n.mjs` lê os arquivos do jogo e acha texto solto em português (strings com cara de frase fora de um
  `T(...)`, e texto no JSX). Não conta: chaves (nomes de sala, ids, palavras do léxico), mensagens de erro e de console, código de shader e as
  linhas marcadas `// i18n-ok` (o que não é texto para o jogador). Ficam de fora as salas da reserva que não estão no jogo. Também fica de fora o
  teste de desempenho (`?bench=1`, §102): é ferramenta nossa, e o relatório dele é para colar na conversa. Roda junto com os
  outros `verify_*.mjs` antes de cada commit.
- **Daqui em diante:** nada entra no jogo só em português (CLAUDE.md, "Convenção para textos"; as regras dos subagentes também dizem isso).

## 99. Polimento: a neblina lá fora, o fogo e a luz forte (cenógrafo, pedido do Pedro)

"Melhorar o visual do jogo, mantendo todas as coisas, só deixar mais polido: sombras, efeito do fogo... Na cutscene inicial, o lado de fora como
uma neblina, estilo Silent Hill, para que o jogador não veja nada lá fora, se existe ou não existe, e deixar mais místico."

**A neblina** (abertura, os planos de fora do poço; `rooms/vestibulo.ts` e `blendAtmosphere`/`updateScribeDrop` em `scene.ts`):
- Lá fora a névoa é clara e fechada (`#8e8c9e`, de 0,8 m a 8,5 m): a 8 m já não se vê nada. O céu deixou de ser céu: é a mesma névoa, mais
  clara no alto e da cor exata da névoa embaixo, então não há horizonte. As torres escuras da Casa saíram (não se sabe o que existe lá fora).
- 38 véus de névoa em pixel (24 no ar, 14 em bancos rasos no chão) andam devagar em volta da boca do poço, e uma cinza clara cai sem parar
  (170 pontos, como em Silent Hill).
- O Escrivão vem de mais longe (`SCRIBE_FROM` de (-2,7; 2,9) para (-3,9; 4,2)): ele SAI da névoa, primeiro como uma sombra com os dois olhos
  acesos, e o pano dele só ganha cor perto da mureta (nos planos de fora o material dele entra na névoa; os olhos e o halo não). O corte para
  baixo espera ele se debruçar (1,3 s depois de chegar), como antes.
- O contorno do pós-processo some junto com a névoa (`uEdgeFog`): sem isso, quem estava longe virava um "fantasma desenhado a lápis".
- A luz lá fora é difusa (o sol não atravessa a névoa): `outdoor` de 1,9 para 1,25 e a ambiente lilás.
- Visto de baixo, pela boca do poço, nada mudou (é a mesma luz fria).

**O fogo** (`flameFrames` em `textures.ts`, `kit.torch`, `brazier.ts`, `makeTorch` em `firegrid.ts`):
- A chama era 3 quadros de 10 × 8 com o amarelo em cima e o vermelho embaixo (de cabeça para baixo, uma gota). Agora são **8 quadros**: o pé
  é o mais quente (miolo branco-amarelo), o corpo laranja, as pontas vermelhas; o corpo balança e afina, as línguas sobem tortas e de vez em
  quando uma ponta se solta. Dois tamanhos: a **alta** (12 × 18) nas tochas e nos braseiros, e a **baixa** (12 × 10) nas chaminhas de
  lampião, nos soquetes e no fogo que corre nas canaletas, que já têm o tamanho medido (nenhum desses mudou de tamanho).
- A chama do braseiro fica presa nas brasas (cresce para cima e, quando está acabando, encolhe para dentro da cesta em vez de boiar). A da
  tocha fica no alto do cabo; o **ponto de referência** das tochas não mudou (as distâncias das escritas, do teto e do toque do dado são as
  mesmas). Cada braseiro e cada tocha anda no seu passo, e a chama estica um pouco junto com a oscilação da luz.
- Um **brilho no ar** em volta de cada chama acesa (`kit.flameGlow`: um disco quente pontilhado, somado, sem névoa e sem gravar profundidade)
  acompanha a força da luz; apagada, some. Tocha tirada pelo `clearTorches` não brilha.
- Aceso e apagado continuam se lendo igual (a chama só aparece acesa; nada mudou na regra).

**A luz forte** (pós-processo e tochas):
- Perto de uma chama a parede "estourava" num creme chapado do tamanho de uma pedra, com um anel vermelho duro em volta, e a chama sumia no
  meio. Duas causas, dois consertos:
  1. O ponto de luz da tocha ficava a 45 cm da parede; com a luz caindo com o quadrado da distância, a pedra logo atrás recebia umas 20 vezes
     a luz do chão. Agora fica a 80 cm (`TORCH_LIGHT_OUT` em `kit.ts`): a parede clareia por igual e o resto da sala quase não muda.
  2. O pós-processo cortava cada canal seco no 1. Agora há um **ombro** (`shoulder` no shader, só no mundo, nunca na interface): cada canal
     entra numa curva macia a partir de 0,7 (1 → 0,88; 1,5 → 0,94; 3 → 0,98). O vermelho enche primeiro, depois o verde: a cor passa de
     laranja a amarelo e a branco aos poucos, como numa foto de fogo, e a pedra continua desenhada onde a luz é forte. Abaixo de 0,7 (quase
     tudo na tela) nada muda. Foram testadas outras duas curvas que guardam o matiz (escalando os três canais juntos): o tijolo vermelho
     perto da chama ficava laranja "radioativo" e o miolo puxava para rosa; ficou a de cada canal. (`uShoulder = 0` volta ao corte, para testes.)
- Custo: 5 a 10 desenhos a mais por sala (os brilhos), sem diferença medida de quadros por segundo.

Testado: a abertura inteira gravada quadro a quadro (a névoa, o Escrivão saindo dela, o corte, a vista de baixo), as salas com fogo de perto
e de longe (Lousa, Galeria, Apelidos, Tribunal, Biblioteca, Vestíbulo, Boato Verdadeiro, Lei Pequena, Confirma, Fio) antes e depois, no PC
(1280 × 720) e no celular (844 × 390), sem erros no console.

## 100. Vida, luz e arquitetura: o mundo deixa de ser caixa (cenógrafo, pedido do Pedro)

"Pode sim mudar as arquiteturas na sala dos puzzles, sem mudar puzzle nem nada. O escuro de verdade é legal. O mundo reagir na imagem, o dado
levantando poeira, pó do teto, achei muito bom. Vida pequena no ar: gotas caindo, o ar tremendo em cima das brasas, algum pequeno animal que
apareça no fundo. Rastros de quem já passou. A neblina de fora voltar em alguns lugares. Onde tem os poços no topo, o buraco com a luz, ver a
poeira flutuando: não aquelas bolinhas grandes, uma poeira mesmo. Sombras e o fogo ainda têm como melhorar. E janelas em algum lugar, como
na sala 2: no capítulo 1 e no 2 ainda se está na superfície do dado. A cor: por capítulo, mudando aos poucos conforme o jogador avança."

**Regra geral** (vale para tudo abaixo): nada disto muda solução, alcance, tempo, nem o que o jogador precisa ver, acertar ou ler. Onde havia
dúvida, a peça saiu (ver "o que ficou de fora"). Os 21 verificadores de puzzle continuam passando.

**1. O feixe de luz e a poeira fina** (`src/scene/fx.ts`: `lightShaft`, `fineDust`, `sunBeam`)
- A luz que entra por um furo do teto ou por uma fresta agora SE VÊ no ar: um tubo somado por cima da cena, forte no miolo e sumindo nas
  bordas, mais forte em cima, com listras lentas. É fraco de propósito (o pontilhado e a paleta o desfazem em degraus de pixel). O cone de
  antes, de cor chapada, virava uma coluna cinza sólida e tinha sido tirado.
- A poeira: cada grão é UM pixel da imagem do jogo (as "bolinhas" tinham 2 × 2, eram ~40 e todas iguais). São 150 a 200 por feixe, cada um
  com o seu brilho, e cada um CINTILA no seu tempo, como poeira que gira na luz. Tudo animado no shader (um relógio só, `fxClock`): nenhuma
  conta por grão no processador, um desenho por feixe.
- Onde: os 6 furos redondos (Poço, Lousa, Fio, Cisterna, Banhos, Biblioteca), a Escadaria, as frestas do Vestíbulo e da Galeria, e as
  janelas novas. O `kit.beamDust` e o `beamMotes` de antes agora chamam isto. No escuro da Casa, feixe e poeira apagam junto (`fxDim`).
- A luz dos furos faz SOMBRA de verdade, de cima para baixo (o motor empresta um mapa de sombra quando o jogador está perto).

**2. O mundo reage na imagem** (`src/scene/puffs.ts`; antes só o som dizia estas coisas)
- A pancada do dado levanta POEIRA no ponto do toque, espalhando rente à superfície (chão, parede, coluna); mais forte, mais poeira.
- O dado de Fogo deixa BRASAS para trás no voo; quando o fogo pega (braseiro, tocha, frase), um sopro de FAGULHAS.
- A sala RESOLVIDA estremece: fios de pó caem do teto em volta do jogador (o motor procura o teto com raios; a céu aberto, nada cai). A
  porta que abre solta o pó da verga.
- Um desenho só, até 260 grãos reusados. A poeira pega a luz da sala e some no escuro; a fagulha é luz somada.

**3. Vida pequena**
- FUMAÇA em todas as tochas de enfeite (`smokePoints`, um desenho por sala; antes só duas tochas do Vestíbulo tinham, com cinco desenhos
  cada). O tufo é pontilhado e escuro de verdade: a parede atrás da chama recebe luz muito acima de 1 e um véu fraco não aparecia.
- MARIPOSAS: um ou dois pontinhos claros em volta de uma tocha em cada três, tortos e rápidos, pousando de vez em quando.
- O AR QUENTE: em cima de cada braseiro aceso (até 4, os mais perto), as linhas da imagem escorregam um pixel para os lados, em ondas que
  sobem (no pós-processo; só treme o que está ATRÁS da coluna de ar). `Emitter.hot`.
- GOTAS: onde a sala já dizia que pinga (`ambience.drips`, que era só som), o motor acha o teto e põe a gota que cresce, cai e abre um
  anel numa pocinha.
- A luz de toda chama oscila uns 10%, em três ritmos (eram 3%: parecia lâmpada). "Reduzir movimento" desliga.

**4. Os bichos** (`src/scene/critters.ts`; figuras 2D em pixel, sempre longe, sem som)
- O RATO: corre rente a uma parede, de uma toca a outra (dois arquinhos escuros no rodapé), às vezes para e fareja. Só sai com o jogador a
  mais de 4,5 m da corrida, foge mais depressa se ele chega perto, e demora de 30 s a mais de 1 min para voltar. Nas salas de fogo o
  construtor escolhe sozinho o trecho de parede mais comprido sem nada encostado (confere as caixas de colisão e SONDA a sala com raios:
  parede na frente, chão embaixo). Hoje em 10 salas.
- O MORCEGO: cruza o alto de três salas altas (a Escadaria, o fosso da Ponte de Madeira, o Átrio da Biblioteca), com um mergulho no meio.
- A graça é o jogador achar que viu alguma coisa: aparecem de vez em quando, nunca em laço.

**5. A arquitetura das salas de puzzle** (`src/scene/rooms/dress.ts`, `FireSpec.vault` e `FireSpec.windows`)
- As salas do construtor `fire.ts` eram caixas iguais: quatro paredes e um teto chato e escuro. Cinco ganharam ABÓBADA de berço de tijolo
  com arcos de pedra lavrada sobre mísulas (a gramática da Lousa, o quadro de estilo): A Casa Escreve (as nove colunas agora sobem até a
  casca), O Que a Casa Confirma, A Ponte de Frases (as correntes das lanternas sobem até a casca), A Lei Pequena e o Tribunal.
- A abóbada fica toda ACIMA da altura `h` da sala: o dado continua batendo num teto invisível em `h` (testado: no Tribunal, arremessado
  para cima, ele chega a 3,78 m, como antes). As mísulas ficam acima de `h` − 0,6.
- JANELAS: duas frestas altas em arco no Confirma, na parede que dá para fora (com o vão na espessura da parede, grade, o céu, o feixe e a
  poeira), nos dois únicos trechos vazios da parede; e um ÓCULO redondo em cima da porta do Tribunal: na última sala do capítulo, a luz de
  fora entra por onde se sai. O feixe cai no meio do salão, longe da placa da porta e dos braseiros.
- Como se escolhe o lugar: a planta diz que paredes dão para fora e que salas estão na superfície (as do subsolo não ganham janela); o
  construtor AVISA no modo de desenvolvimento se um feixe cai a menos de 1,5 m de um braseiro ou da placa, e lista o que há pendurado em
  cada parede (`__paredes`). Dois lugares que eu tinha escolhido foram recusados por esse aviso e um terceiro porque o feixe passava na
  frente de uma lousa.
- O céu das salas abertas (o claustro) deixou de ser azul com nuvens: é NÉVOA, como no pátio da abertura, com véus boiando no alto das
  paredes (`mistBank`). A névoa também desce um pouco pelo alto do poço da Escadaria.

**6. O escuro, e a cor que anda com o capítulo**
- Dentro da Casa a luz ambiente caiu um quinto (`DARK_K`): os cantos e o alto das paredes afundam e as poças de luz das chamas se destacam.
  As lousas continuam legíveis de uma ponta à outra da sala (conferido no Tribunal e no Confirma).
- A cor: um banho leve (uns 7%) na imagem do mundo, que muda com a sala em que o jogador está (`uGrade`). O capítulo 1 é o do FOGO: começa
  FRIO (o Poço) e esquenta sala a sala até o âmbar do Tribunal. Cada capítulo terá o seu par de cores (`GRADE_A`, `GRADE_B`). Soma-se ao
  "estágio" da Casa, que já esquentava a luz com os marcos da história.

**7. Os rastros de quem passou** (`traces` em `dress.ts`; sem texto)
- Num canto perto da ENTRADA das salas de puzzle: as cinzas de uma fogueira velha entre três pedras, um ou dois tocos de vela derretidos, os
  riscos de contagem de quem esperou. O tipo sai do nome da sala e uma em cada cinco não tem nada (se todas tivessem, virava enfeite).
- Não entram se houver braseiro, coluna, caixa de colisão, chama ou escrita a menos de ~2 m (no Pano, o canto tem o braseirinho que ensina a
  sala: ficou sem). Em sala de frases que se acendem, nada de riscos na parede: perto de uma tocha eles ficam alaranjados e lembram frase acesa.

**O que ficou de fora, e por quê**
- Abóbada no Pano, no Escuro e no Fogo que Corre (o teto tem frisos ou cal, que são do puzzle), na Sombra (a luz e a sombra são o puzzle)
  e na Memória (o construtor da sala mexe nas paredes).
- Janelas nas paredes do Tribunal (cheias: frases, a lei, o altar), na Casa Escreve (as tochas da parede são uma constelação) e no Fogo que
  Corre (um feixe comprido atravessaria a sala na altura da cal do teto).
- Névoa no fundo do fosso da Ponte de Madeira (taparia as canaletas) e no pátio da Cisterna (tem teto: o que há ali é o furo).
- Fumaça nas tochas de puzzle (as que o jogador acende e se apagam).

**Custo**: de 5 a 35 desenhos a mais por sala (o Confirma, com janelas e abóbada, é o que mais subiu: 361 → ~390); triângulos quase iguais.

**Testado**: tsc, build, os 21 verificadores; no navegador de teste, PC (1280 × 720) e celular (844 × 390): os seis furos e as frestas, a
pancada e o arremesso de Fogo quadro a quadro, o pó do teto, o rato correndo, a fumaça, o ar quente, a gota, todas as salas com abóbada, os
cantos com rastros; no Tribunal, acender o braseiro certo (conta o passo), um errado (a Casa pune como antes) e o arremesso para cima; a
tela inicial e a abertura. Sem erros no console. **Não testado**: o capítulo jogado do começo ao fim, um celular de verdade, e o morcego
visto em jogo (ele voa; nas fotos de teste a câmera ficou embaixo de um patamar).

## 101. As anotações do jogador junto dos símbolos (cenógrafo, pedido do Pedro)

"Depois que o jogador escreve o que acha que um glifo significa, quando esse glifo aparecer (parede, conversa, textos), deveria aparecer?
Não tem outra forma? De qualquer forma o ideal é ter a opção de ativar ou não." A resposta foi uma combinação de três formas, aprovada pelo
Pedro. O que o jogador escreve sobre um glifo (`diary.notes`) só aparecia dentro do caderno; agora aparece em três lugares, e **sempre nas
palavras dele**: o jogo continua sem traduzir e sem corrigir, e sem anotação nada aparece (`src/story/reading.ts`).

**A anotação curta**: a ÚLTIMA linha que ele escreveu sobre o glifo (as respostas às perguntas do dado entram numa linha nova embaixo, e a
última é o que ele acha agora), cortada no que cabe (`shortNote`).

**1. A CÓPIA (sempre ligada).** Abrir o caderno (J ou o botão) olhando uma escrita da parede, ou até 20 s depois de uma conversa ou de um
balão do dado, abre numa página nova do caderno, **Cópia**, logo depois da contracapa: a frase copiada a lápis, símbolo por símbolo, com a
anotação dele embaixo de cada um (ou uma linha pontilhada, se não anotou). Tocar num símbolo da cópia abre na página da direita o mesmo
quadro de anotar da parte Símbolos: dá para anotar ali mesmo, com a frase toda na frente. É o gesto natural de quem decifra: copiar a frase
e trabalhar nela. A cópia fica no caderno até a próxima (uma só, a última), aparece no índice como «Cópia» e não abre durante o tutorial do
caderno, nem quando o caderno abre sozinho numa folha nova dela (`diary.copy`, `book/pages.ts: renderCopy`, `book/book3d.ts`).

**2. APONTAR (sempre ligada).** A mira parada (0,3 s) sobre uma palavra talhada na parede, a até 5 m, mostra embaixo da mira uma etiqueta
de papel só com a anotação DAQUELA palavra (`aimNoteStore`, `ui/NoteTags.tsx: AimNote`). Numa conversa, no celular, tocar num símbolo mostra
a anotação dele por 2,6 s (o segundo toque segue a conversa, como antes); no PC, com o mouse preso no jogo, mexer o mouse anda por cima dos
símbolos (um sublinhado de ouro marca qual) e mostra a dele (`ui/DialogueBox.tsx`). Uma palavra por vez: ajuda a lembrar, não lê a frase
pelo jogador.

**3. EMBAIXO DOS SÍMBOLOS (opção, DESLIGADA por padrão).** Configurações → Acessibilidade → «Minhas anotações embaixo dos símbolos». Ligada,
toda conversa e todo balão do dado mostram a anotação dele embaixo de cada símbolo, e olhar parado (0,8 s) uma escrita da parede sobe uma tira
de papel no pé da tela com a frase e as anotações (`lookingStore`, `ReadingStrip`). É para quem quer jogar mais leve, ou tem dificuldade de
memória: a dedução continua dele, porque as palavras são as que ele escreveu.

**O que nunca mostra anotação**: as perguntas do dado («VOCÊ SABER ?» e os pedidos «BRASEIRO ONDE ?»: testam o que ele acha, mostrar a
anotação as anularia; um balão com o glifo da pergunta não mostra anotação nem vai para a cópia), as anotações DELA (a sépia fica só no
caderno) e as palavras que ele nunca anotou. A letra é sempre a dele, grafite em papel: nunca o dourado (a verdade da Casa) nem a sépia (a letra
dela).

**Conferido pelo enigmista** (todo puzzle passa por ele). Nenhuma sala muda de nível na régua (§17): as três formas tiram custo de leitura e de
memória visual, não camadas de regra nem de dedução, e só ajudam quem anotou certo. Ele achou, e foi corrigido antes de ir para o jogo:
- **O Pano entregava a solução**: a cópia e a tira liam a escrita da pedra com a palavra que o pano cobre (a tira mostrava TRÊS onde o pano
  diz UM). Agora a escrita só vale com todas as palavras à vista; com o pano no lugar, ele lê o pano (a escrita bordada). O mesmo valia para o
  "avistado": a palavra coberta só entra no diário quando o pano queima (`scene.ts`: `seenWords` e a leitura das inscrições).
- **A etiqueta atravessava paredes**: na Lousa, mirar a coluna mostrava «cinco» e denunciava o segredo S1 escondido atrás dela. Agora a mira
  e o olhar testam o que TAPA a vista (paredes, colunas, panos; não chamas, poeira, feixes nem decalques): só vale a palavra que é o primeiro
  acerto, e a escrita lida tem de estar à vista.
- **A lacuna sumia**: «ACENDER ▢ BRASEIRO» virava «ACENDER BRASEIRO». Agora a lacuna aparece como um quadrado VAZIO na cópia e na tira, nunca
  preenchido com o que estiver aceso (a Lousa, o «DIZER IGUAL ▢» do Fio, as lousas da Sala de Aula).
- **O mural de encaixe** (Biblioteca) mostrava o glifo antigo depois de uma troca: a escrita do bloco passa a ser a nova a cada troca.
- **O giz é a pista**: a cópia de uma frase a giz da Galeria diz «a giz, Sala 15», e a tira diz «a giz» (as frases a giz são boatos).
- **Editar a anotação juntava as linhas**: a resposta à pergunta do dado entra numa linha nova, e qualquer tecla depois disso juntava tudo,
  fazendo a anotação curta mostrar a hipótese mais VELHA. Agora as linhas ficam.
- (O retângulo laranja que aparecia sobre a coluna da Lousa no teste dele é o fantasma do POSICIONAR, onde o dado vai parar; não é vazamento.)

**Fora de propósito, para sempre** (o enigmista conferiu): a **cal** (só aparece no escuro; O Escuro ensina a anotar o que some rápido, e uma
cópia faria a anotação pelo jogador; a cal não é inscrição e não entra em nenhuma das formas), os **desenhos de fogo e luz** (lousas de
lampiões, a casa lisa, a lousa da Casa Escreve, a moldura da Sombra, as lousas do Escuro, as grades do Fio e do Fogo que Corre, as
constelações: não são escrita, e uma etiqueta viraria o oráculo "isto é um número"), a **página do C-Bib** (é um desenho; se virasse
inscrição, a cópia daria o lado certo da página) e **uma cópia só**, a última (um histórico de cópias apagaria a "informação espalhada" da
Lei Pequena, da Memória e do Tribunal).

**A resposta da pergunta do dado aparece igual, certa ou errada** (decisão do Pedro): quando ele erra a pergunta do dado, a escolha também
entra no caderno (numa linha nova) e é ela a anotação curta mostrada junto do símbolo, como qualquer outra. "O jogador percebe na hora que o
dado reagiu; o jogador consciente vai entrar no caderno, anotar as outras palavras que tinham lá e ver como encaixa." O jogo não filtra o que
ele escreveu (nem o que escolheu) por certo ou errado: a anotação é dele, e corrigir é trabalho dele.

**Em aberto (opcional)**: na Sombra e no Escuro cada palavra é uma inscrição separada, então a cópia pega uma palavra só (não engana, só fica
incompleta).

**Detalhe de acabamento**: a fonte do caderno não tinha as reticências e trocava «…» por «?» (o «o que eu acho…» da parte Símbolos saía
«o que eu acho?»); agora são três pingos numa célula só (`book/font.ts`).

## 102. O teste de desempenho (cenógrafo, pedido do Pedro)

Antes de decidir se o jogo vira app de celular e de Steam como está (embalado com Capacitor e Electron) ou se é convertido para outra engine,
o Pedro quis saber como ele roda em celulares antigos e PCs fracos. Daqui não dá para medir aparelhos de verdade (não há aparelho ligado, e o
navegador da nuvem desenha o 3D sem placa de vídeo), então o próprio jogo ganhou um **teste de desempenho**, aberto por um link:

**O endereço do jogo com `?bench=1`** (por exemplo `…/dungeon-depths/sentenca/?bench=1`). Qualquer pessoa abre no aparelho que quer medir, sem
instalar nada (`src/ui/Bench.tsx`).

- **O passeio**: uma tela explica e pede Começar (no celular, com o aparelho deitado; tenta tela cheia). O jogo passa sozinho por cinco salas
  pesadas (Vestíbulo, Galeria, Biblioteca, Claustro do Vento, Tribunal) em quatro níveis, como alguém escolheria em Configurações → Imagem:
  **Alta** (qualidade alta, sombras altas), **Média** (média, médias), **Baixa** (baixa, baixas) e **Mínima** (baixa, sem sombras, pixel
  grosso). Em cada sala a câmera fica uns passos para dentro da entrada e gira uma volta inteira devagar (`scene.benchView`); o primeiro 1,2 s
  não conta (trocar de sala e de qualidade monta sombras e materiais e engasga uma vez), e depois mede 5 s. Uns 2 minutos e meio no total. O
  som fica ligado (ele também pesa).
- **O que mede**: o intervalo entre um quadro e o seguinte (`requestAnimationFrame`, o mesmo ritmo do desenho do jogo). Por sala: quadros por
  segundo, o quadro mais lento dos 95% mais rápidos, a fração de **engasgos** (quadros acima de 34 ms, abaixo de 30 por segundo) e o pior
  quadro. Se a página some no meio (trocou de aplicativo, a tela apagou), aquela sala é medida de novo.
- **A nota**: por sala, **Fluido** (50 ou mais por segundo e até 3% de engasgos), **Bom** (40 ou mais, até 8%), **Jogável** (28 ou mais) ou
  **Pesado**; a nota do nível é a da PIOR sala, porque é lá que o jogador sente. **Recomendado**: o nível mais alto que fica Bom ou Fluido;
  se nenhum, o mais alto Jogável.
- **O relatório**: o aparelho (modelo e sistema quando o navegador conta, navegador, placa de vídeo, núcleos, memória, tela), quanto o jogo
  levou para abrir, a tabela dos quatro níveis e a recomendação. Botões: **Copiar o resultado** (um texto com tudo, sala por sala, para colar
  na conversa), **Usar a recomendada aqui** (grava só a qualidade, as sombras e o pixel daquele aparelho), Repetir e Ir para o jogo.
- **Nada é gravado**: nem o espaço de jogo, nem o caderno, nem as perguntas do dado, nem os desenhos do dado, nem as configurações (o teste
  troca a qualidade só na memória); o jogo começa do zero na memória, igual em todo aparelho. O dado não fala nem pergunta, nenhuma cena toma
  a câmera, e uma camada invisível segura os toques. Conferido: o armazenamento do navegador fica idêntico antes e depois.
- **O que o número não diz**: o aparelho esquenta ao longo do teste (a Alta é medida primeiro, com ele frio); celulares com tela de 90 ou 120 Hz
  passam de 60; no modo de economia de bateria muitos celulares travam em 30. O navegador do celular é praticamente o mesmo motor que o app
  embalado usaria, então o resultado vale para o app; o Steam Deck e o iPhone se testam neles mesmos.
- `?bench=rapido`: o mesmo passeio em tempos curtos, só para conferir que o teste funciona (os números não valem).

## 103. Mandar o jogo para alguém: o cartão do link e o QR code (pedido do Pedro)

Pedido: "mandar o link do jogo pra pessoa… ela só clicar e já abrir de uma vez".

- O jogo já é um site comum (GitHub Pages): https://peterpedrons-maker.github.io/dungeon-depths/sentenca/ abre direto no navegador, sem conta no
  GitHub, sem instalar nada, no PC ou no celular. O site se atualiza sozinho a cada envio da branch de trabalho (`deploy.yml`).
- **O cartão do link** (`index.html`, Open Graph): colado no WhatsApp, Telegram, Discord ou numa rede, o link vira um cartão com a imagem da
  tela inicial (o dado caído no poço embaixo do nome; `public/og.jpg`, 1200 × 630, 81 KB, tirada do próprio jogo), o título «Sentença» e uma
  frase; a pessoa toca no cartão e o jogo abre. O cartão só tem um texto: fica em português (o jogo pergunta o idioma ao abrir). Os aplicativos
  guardam o cartão de um link por um tempo: o primeiro envio depois da mudança pode ainda vir sem imagem.
- **O QR code** (feito aqui, sem site de terceiros; conferido lendo de volta): apontar a câmera e tocar abre o jogo, sem ver endereço nenhum.
- Esconder o endereço de vez pede o Pedro decidir: um encurtador (bit.ly e parecidos, conta dele) ou um domínio próprio (pago; com ele, o
  endereço do site inteiro muda e os caminhos `/dungeon-depths/...` do build precisam mudar junto). Depois da 1ª visita, "Adicionar à tela
  inicial" instala o jogo como app (PWA): abre em tela cheia, sem a barra de endereço.
