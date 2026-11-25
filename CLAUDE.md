# Monorepo de jogos

Este repositório hospeda **múltiplos jogos independentes**, cada um em sua própria pasta
sob `apps/`. Cada jogo é um projeto Vite completo e isolado: seu próprio `package.json`,
`node_modules`, config de build, etc. Eles não compartilham código entre si.

## Convenção para adicionar um novo jogo

1. Crie `apps/<slug-do-jogo>/` com um projeto Vite + React + TypeScript próprio
   (`package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/`).
2. No `vite.config.ts` do novo jogo, defina o `base` de produção como
   `/dungeon-depths/<slug-do-jogo>/` (o nome do repositório continua `dungeon-depths`
   por motivos históricos — o site publicado mora sob esse caminho).
3. **Não edite o workflow de deploy.** `.github/workflows/deploy.yml` já faz build de
   toda pasta dentro de `apps/*` automaticamente e publica cada uma em seu próprio
   subcaminho. O jogo `dungeon-depths` é o `ROOT_APP` e continua servido na raiz do site
   (para não quebrar o link já compartilhado); qualquer outro jogo fica em
   `/dungeon-depths/<slug-do-jogo>/`.
4. Rode `npm install` dentro da pasta do novo jogo antes de testar localmente.

## Jogos atuais

- `apps/masmorra-do-dado/` — (nome provisório) puzzle de masmorra 3D em primeira pessoa, visual
  pixel art "crocante" (Three.js renderizando em ~200 linhas, pós-processo com paleta fixa
  de ~60 cores via LUT 3D + contorno por profundidade + brilho/bloom + dithering leve, texturas
  procedurais, sem arquivos de imagem; luzes das salas são "emissores" emprestados a um pool
  pequeno de PointLights reais, e só as salas vizinhas são desenhadas). O jogador segura um dado e escolhe a face (1–6) antes
  de arremessar/posicionar; cada face é uma mecânica de puzzle (ricochete, peso, fogo...).
  Sem combate. Mundo conectado (estilo Metroidvania) com volta livre; faces novas destravam
  caminhos. Pedra-sabão (giz) infinita: o jogador a troca com o dado na mão principal
  (Tab/Q no PC, botão GIZ/DADO no celular) e desenha livremente nas paredes/chão em 3D
  (segurar o botão esquerdo desenha, o direito apaga; no celular, modos desenhar/apagar/olhar;
  apagar tudo pede confirmação). Planejado: minimapa com anotações persistentes e caderno
  de pistas. Segredos opcionais ao estilo Metroidvania ficam para depois (dá para terminar só correndo). História resumida em `apps/masmorra-do-dado/HISTORIA.md`. Ficam para depois: build da armação do dado, ranking por nº de arremessos. Sem editor de
  salas. O dado pode ser arremessado ou posicionado com cuidado onde a mira aponta (botão direito/G; botão POSICIONAR no
  celular). Hoje há 11 salas no capítulo 1 (só Fogo; numeração e mapa do diário são automáticos a partir da lista em `scene.ts`; plano: ~50 a 60 salas no jogo, 18 no capítulo 1 pela curva da sessão de projeto de puzzles, `apps/masmorra-do-dado/PUZZLES_PROPOSTAS.md` §2, branch `claude/puzzles-design`, verificadores em `tools/verify_*.mjs`; **dificuldade: régua em `DESIGN.md` §17; da sala 3 em diante só sobe**) (`src/scene/rooms/`, cada uma um módulo `Room` com
  tema visual, formato e física próprios; `scene.ts` é o motor; as salas ficam lado a lado e o
  corredor da porta de uma desemboca direto na entrada da próxima, sem tela de carregamento;
  só o dado volta pra mão ao mudar de sala): 1–2 O Vestíbulo (O Poço e O Vestíbulo; o jogador
  acorda SEM NADA: ao tentar abrir a porta ouve um barulho, desconfia, ANDA sozinho até um ponto fixo embaixo do poço e olha para cima: CORTE para fora do poço (pátio em ruínas, céu pálido): o **Escrivão** (feito pela folha de referência do Pedro: capuz pontudo roxo debruado de ouro, escuro por dentro com dois olhos quadrados acesos, capa em V, túnica roxa com barra dourada, estola vermelha com glifo, cinto com chave, mangas em sino e luvas escuras; prévia em `preview-escrivao.html`; névoa mística pixelada no pátio; nada atravessa a mureta: ele ergue o dado alto e solta de cima; `DESIGN.md` §37) chega andando e se debruça; de baixo ele diz VOCÊ VIVER ? · EU DAR DADO · VOCÊ LER; tira o dado de dentro do manto, close no dado com o capuz dele embaixo, solta; a câmera desce POR BAIXO do dado; o jogador o vê bater no chão, olha de novo e ele sumiu; a câmera volta para a frente e a cena fica travada (`ctx.pin`) até o jogador pegar o dado com E; o dado vem ao centro da tela, em cena de cinema, e explica; `DESIGN.md` §29, §32 e §33). **ESCREVER COM FOGO** (`DESIGN.md` §38; `src/scene/firegrid.ts`: lousas 3×3 de lampiões, canaletas onde o fogo CORRE, casa lisa que copia a lousa, tochas que se apagam, braseiro que sobe de rachaduras frias, nicho da gema; os glifos são pontos numa grade 3×3 e os números são as faces do dado): 3 **A Lousa** (`rooms/lousa.ts`, nível 2: copiar DOIS e TRÊS; a PORTA é uma lousa e a frase «ACENDER ▢ BRASEIRO» tem de ficar verdadeira: QUATRO, contando o braseiro do nicho atrás da entrada; segredo CINCO = gema), 4 **O Fio de Fogo** (`rooms/fio.ts`, nível 3: balcão alto com escadas, três lousas de canaletas, 9 braseiros no chão; «ACENDER DOIS» = duas ignições que escrevem CINCO; segredo FAZER), 5 **A Casa Escreve** (nível 3: a lousa da Casa acende posições em laço; é o MAPA do salão de 9 colunas; constelação C1 de tochas), 6 A Chama Curta (nível 4: TEMPO com 4 braseiros; as chamas se apagam, o maior dura mais; todos acesos ao mesmo tempo), 7 O Que a Casa Confirma (nível 5: o **dado de Fogo acende frases** da parede, só as CONFIRMADAS; acertando, **pilares sobem do chão**; depois a ordem sai das frases ANTES/DEPOIS), 8 **O Pano** (nível 5: o fogo queima o BOATO tecido e mostra a pedra talhada; constelação C2 com frisos no teto), 9 **Os Apelidos** (nível 6: GRANDE e PEQUENO), 10 **O Boato Verdadeiro** (nível 6: «ACENDER VERDADE», boatos verdadeiros também; a Casa julga quando se acende a frase da porta), 11 O Tribunal dos Rumores (**nível 10**, provisório aqui; a posição final é a sala 18: frases com marcas CONFIRMADO/BOATO, tamanhos, lei da contagem; solução única provada em `tools/verify_tribunal.mjs`; ver `DESIGN.md` §18). As salas 5, 8, 9 e 10 são `FireSpec` em `src/scene/rooms/chapter1.ts` (o construtor `fire.ts` ganhou panos, `preLit`, `lock.judge: 'door'`, `torches: 'few'` e o gancho `extra`). **Em reserva, fora da lista**: Os Quatro e A Ordem (substituídas pelas novas 3 e 5) e, porque usam Peso e giz, que só chegam nos capítulos 2 e 3: A Entrada (cena do Escrivão, que dá o giz), A Lacuna, O Selo, O Salão das Brasas, O Mirante, A Confirmação (Mastermind) e a sala de teste. Toda frase de porta termina numa marca (CONFIRMADO); textos de parede em parágrafos pequenos (`FireTablet.lines`).
  Mobile só na horizontal, além de PC. Som com GRAVAÇÕES REAIS (nada sintetizado como fonte;
  `src/scene/audio.ts` + `public/audio/`): efeitos de pacotes CC0 (OpenGameArt) e instrumentos reais do
  soundfont FluidR3_GM (CC BY 3.0 — por isso há um botão ⓘ de créditos); a música é composta em tempo
  real tocando essas notas gravadas e é uma só pro jogo todo (não muda por sala). Os arquivos são gerados
  por `tools/fetch_audio.sh` / `tools/build_audio.py`; créditos em `public/audio/CREDITS.txt`. Os passos têm UM som fixo por tipo
  de piso (pedra, tapete, placa de pressão, poça; `Room.surfaceAt`/`Kit.zone`), sem variação aleatória. Botão
  ♫/♪/∅ no canto (tudo / só efeitos / mudo, lembrado no aparelho); o áudio só liga após o 1º toque/tecla.
  **Abertura e progressão** (`DESIGN.md` §12): o jogo começa com uma cena de acordar (deitado, poço de luz no teto; só na 1ª vez,
  `?intro=0` pula); **inscrições** talhadas nas paredes (`src/scene/inscription.ts`, `kit.inscribe`) mandam os símbolos ao diário quando o
  jogador olha para elas; acender com o Fogo toca uma cena do dado queimando (1,5 s só na 1ª vez de cada braseiro; depois ~0,3 s); **marcos** (`src/story/progress.ts`) sobem o
  "estágio" da Casa (luz mais quente, cal brilhando) (o dado começa só com **Fogo e Peso** por muito tempo; o jogo deve durar algumas horas, ver `DESIGN.md` §13). Cenas usam `ctx.freeze/lookAt/say`; interação com E/AGIR via `Room.interactables`; o **dado fala** de vez em quando (balão em glifos, `story/chatter.ts`).
  **História e língua** (ver `apps/masmorra-do-dado/DESIGN.md`, `LINGUA.md`): o jogador está condenado por uma "sentença"
  escrita numa língua inventada (os Contáveis; 174 palavras em `tools/lexicon.mjs` → `src/story/lexicon.json`).
  O mundo fala em glifos; pensamentos do jogador e diários de outros condenados vêm em português. Já existem:
  **janela de conversa** estilo RPG no rodapé (`src/ui/DialogueBox.tsx`, `src/story/dialogue.ts`; salas usam `ctx.say(...)`)
  e **diário** (tecla J ou botão do canto): um **livro 3D** que o personagem tira da bolsa, abre e fecha; as folhas **viram de verdade**
  (`src/book/book3d.ts`; desenhado num canvas PRÓPRIO em resolução cheia por cima do jogo, para as letras ficarem nítidas, e ocupa quase a tela toda; `DESIGN.md` §34) e todo o conteúdo é desenhado em pixels **no próprio papel amarelado** (`src/book/pages.ts` + fonte
  bitmap com acentos em `src/book/font.ts`), nada de interface por cima. Na contracapa há o **índice** (Símbolos, Faces, Textos,
  Mapa, Notas): escolher vira as folhas até lá. Toque/clique nas regiões das páginas (raycast), setas/roda viram a página, J/Esc ou
  tocar fora guardam. O **mapa** é 2D estilo Symphony of the Night, na **horizontal, ocupando as duas páginas** (`src/story/worldmap.ts`: salas em grade, passagens com portas, **vários andares** com abas 1F/2F/3F e escadas; só as salas visitadas aparecem) e o jogador **escreve à mão livre no mapa** (3 canetas e borracha, no rodapé; traços por andar, salvos no aparelho) e **põe carimbos**: a ferramenta de carimbo abre, no rodapé da página direita, uma bandeja só com os símbolos que já avistou (4 por vez, ◄ ►); um toque no mapa carimba o escolhido (funciona no celular; a borracha também tira carimbos) — para anotar, por exemplo, os símbolos de uma porta que ainda não entendeu. `?demo=mapa` mostra um mundo de teste grande (3 andares, dezenas de salas) que ainda não existe no jogo. Os símbolos "avistados" entram sozinhos (`ctx.seen(id)`); o jogador anota o que acha que significam (o diário
  nunca corrige); salvo no aparelho. Conversa e diário param o jogador. `?demo=1` abre uma pré-visualização com dados de exemplo.
  **O dado traduz glifos**: olhar uma palavra concreta com desenho (hoje só BRASEIRO) faz a face de cima do dado da mão mostrar um rabisco (entra e sai por dissolução pontilhada) por uns segundos e o dado **fala** (balão com o desenho e o glifo juntos) (no máx. 3 vezes por palavra; vale também com o giz, o dado fica na mão esquerda); ver `DESIGN.md` §22 e `src/scene/sketch.ts`.
  **O dado vivo** (`src/scene/dielife.ts`, `DESIGN.md` §23): o dado da mão olha para o que o jogador encara, para braseiros e portas, vagueia o olhar, pisca, recua ao acender, empina quando a porta abre, treme no erro, cochila parado; o balão de fala se centra no dado; o dado da mão vira em quartos de volta, devagar, e inclina pouco (o rosto fica reto); **a face virada para o jogador vira um rosto de afeição neutra, igual em todos os números, feito de traços finos de ouro como os glifos** (olhos que brilham, testa, nariz, boca; o número vira pontinhos na testa; `DESIGN.md` §23).
  **Faces com o glifo do efeito**: a face mostra o glifo da palavra do seu efeito (Fogo = ACENDER, Peso = IGUAL, Ricochete = ECO) depois de o jogador ter visto a palavra; o número vira pontinhos. **O dado conversa em glifos** ao ser pego (ACENDER BRASEIRO) e comemora a 1ª vez que o jogador acende (`DESIGN.md` §27).
  **Regra de tela**: nada se sobrepõe (avisos "avistado" esperam o fim de toda conversa; legendas, prompts e dicas somem enquanto alguém fala) e **o dado só fala por balão** (`DESIGN.md` §30).
  **Escrita dos símbolos**: todo glifo em conversa/balão é ESCRITO traço a traço, um traço de cada vez (moldura, ligações, pontos; `src/story/writing.ts`, ~0,95 s por símbolo, `ctx.dieTalk` espaça as falas do dado pelo tempo real de escrita); dado arremessado ou posicionado NÃO fica na mão (`DESIGN.md` §30–31).
  **Interface no PC**: `ui/scale.ts` (variável CSS `--ui`) aumenta glifos, balões, avisos e textos em telas grandes (1 no celular, até 2,1).
  **Recomeçar do zero**: botão ⓘ > "Recomeçar o jogo do zero" (com confirmação) apaga progresso, diário e mapa do aparelho e recarrega com a cena de acordar (`DESIGN.md` §28).
  **Sala de teste isolada** `?lab=1` (A Placa que Julga: Fogo + Peso + giz ao mesmo tempo, nada salvo; regra `commit` e tablete `rub` do construtor `fire.ts`; verificador `tools/verify_lab.mjs`; solução em `PUZZLES.md`).
  Publicado em `/masmorra-do-dado/`. É um PWA instalável (manifest + service worker em
  `public/`, funciona offline depois da primeira visita; botão ⤓ no jogo quando o navegador permite).

## Convenção para puzzles (masmorra-do-dado)

Sempre que criar ou alterar um puzzle: **explique ao usuário como resolvê-lo** na resposta e
registre a solução em `apps/masmorra-do-dado/PUZZLES.md`.

Os jogos antigos (dungeon-depths, reino-e-masmorras, ricochete) foram removidos de `apps/` e
continuam no histórico do git.
