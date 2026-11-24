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
  celular). Hoje há 7 salas num mundo contínuo (`src/scene/rooms/`, cada uma um módulo `Room` com
  tema visual, formato e física próprios; `scene.ts` é o motor; as salas ficam lado a lado e o
  corredor da porta de uma desemboca direto na entrada da próxima, sem tela de carregamento;
  só o dado volta pra mão ao mudar de sala): 1–3 O Vestíbulo (O Poço, O Vestíbulo, A Lacuna: ACENDER · UM/DOIS/TRÊS · BRASEIRO; só o Fogo; a
  3ª pede escrever TRÊS com o giz numa lacuna da frase), 4 A Entrada (cena do Escrivão escrevendo na parede; libera Peso e Ricochete; fogo + peso + gema
  escondida), 5 O Selo (puzzle do giz: reproduzir 3 peças numa lousa; uma só aparece à luz do
  fogo), 6 O Salão das Brasas (sala redonda; acender 3 chamas que se apagam + pesar a placa),
  7 O Mirante (dois níveis com rampa e queda; subir/descer pra combinar braseiro e placa).
  Mobile só na horizontal, além de PC. Som com GRAVAÇÕES REAIS (nada sintetizado como fonte;
  `src/scene/audio.ts` + `public/audio/`): efeitos de pacotes CC0 (OpenGameArt) e instrumentos reais do
  soundfont FluidR3_GM (CC BY 3.0 — por isso há um botão ⓘ de créditos); a música é composta em tempo
  real tocando essas notas gravadas e é uma só pro jogo todo (não muda por sala). Os arquivos são gerados
  por `tools/fetch_audio.sh` / `tools/build_audio.py`; créditos em `public/audio/CREDITS.txt`. Os passos têm UM som fixo por tipo
  de piso (pedra, tapete, placa de pressão, poça; `Room.surfaceAt`/`Kit.zone`), sem variação aleatória. Botão
  ♫/♪/∅ no canto (tudo / só efeitos / mudo, lembrado no aparelho); o áudio só liga após o 1º toque/tecla.
  **Abertura e progressão** (`DESIGN.md` §12): o jogo começa com uma cena de acordar (deitado, poço de luz no teto; só na 1ª vez,
  `?intro=0` pula); **inscrições** talhadas nas paredes (`src/scene/inscription.ts`, `kit.inscribe`) mandam os símbolos ao diário quando o
  jogador olha para elas; acender com o Fogo toca uma cena de ≤1,5 s do dado queimando; **marcos** (`src/story/progress.ts`) sobem o
  "estágio" da Casa (luz mais quente, cal brilhando) e liberam as faces do dado (começa só o Fogo). Cenas usam `ctx.freeze/lookAt/say`.
  **História e língua** (ver `apps/masmorra-do-dado/DESIGN.md`, `LINGUA.md`): o jogador está condenado por uma "sentença"
  escrita numa língua inventada (os Contáveis; 174 palavras em `tools/lexicon.mjs` → `src/story/lexicon.json`).
  O mundo fala em glifos; pensamentos do jogador e diários de outros condenados vêm em português. Já existem:
  **janela de conversa** estilo RPG no rodapé (`src/ui/DialogueBox.tsx`, `src/story/dialogue.ts`; salas usam `ctx.say(...)`)
  e **diário** (tecla J ou botão do canto): um **livro 3D** que o personagem tira da bolsa, abre e fecha; as folhas **viram de verdade**
  (`src/book/book3d.ts`) e todo o conteúdo é desenhado em pixels **no próprio papel amarelado** (`src/book/pages.ts` + fonte
  bitmap com acentos em `src/book/font.ts`), nada de interface por cima. Na contracapa há o **índice** (Símbolos, Faces, Textos,
  Mapa, Notas): escolher vira as folhas até lá. Toque/clique nas regiões das páginas (raycast), setas/roda viram a página, J/Esc ou
  tocar fora guardam. O **mapa** é 2D estilo Symphony of the Night, na **horizontal, ocupando as duas páginas** (`src/story/worldmap.ts`: salas em grade, passagens com portas, **vários andares** com abas 1F/2F/3F e escadas; só as salas visitadas aparecem) e o jogador **escreve à mão livre no mapa** (3 canetas e borracha, no rodapé; traços por andar, salvos no aparelho) e **põe carimbos**: a ferramenta de carimbo abre, no rodapé da página direita, uma bandeja só com os símbolos que já avistou (4 por vez, ◄ ►); um toque no mapa carimba o escolhido (funciona no celular; a borracha também tira carimbos) — para anotar, por exemplo, os símbolos de uma porta que ainda não entendeu. `?demo=mapa` mostra um mundo de teste grande (3 andares, dezenas de salas) que ainda não existe no jogo. Os símbolos "avistados" entram sozinhos (`ctx.seen(id)`); o jogador anota o que acha que significam (o diário
  nunca corrige); salvo no aparelho. Conversa e diário param o jogador. `?demo=1` abre uma pré-visualização com dados de exemplo.
  Publicado em `/masmorra-do-dado/`. É um PWA instalável (manifest + service worker em
  `public/`, funciona offline depois da primeira visita; botão ⤓ no jogo quando o navegador permite).

## Convenção para puzzles (masmorra-do-dado)

Sempre que criar ou alterar um puzzle: **explique ao usuário como resolvê-lo** na resposta e
registre a solução em `apps/masmorra-do-dado/PUZZLES.md`.

Os jogos antigos (dungeon-depths, reino-e-masmorras, ricochete) foram removidos de `apps/` e
continuam no histórico do git.
