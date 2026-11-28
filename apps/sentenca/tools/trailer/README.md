# O trailer de «Sentença» (DESIGN.md §95)

Grava o trailer do começo do jogo quadro a quadro, com o jogo de verdade: um relógio virtual (`vt.js`) faz cada quadro andar exatamente
1/24 s, então nada trava nem pula, mesmo num computador lento. Tudo sai em `out/` (ou em `$TRAILER_OUT`).

1. Suba o jogo em modo de desenvolvimento: `npx vite --port 5310 --host 127.0.0.1` dentro de `apps/sentenca` (ou aponte `TRAILER_URL`).
2. `node tools/trailer/intro.mjs` grava a abertura inteira (`clips/intro.mp4`); `node tools/trailer/intro.mjs nt` grava só o começo, sem a
   tira de pensamento (as falas viram legenda); `node tools/trailer/shots.mjs [nomes]` grava as tomadas com a câmera do trailer
   (`__trailerCam` em `scene.ts`, só em desenvolvimento): poco, fogo, balanca, vento, ponte_cai, ponte_sobe, brasa; `node tools/trailer/title.mjs`
   grava o título (`title/index.html`).
3. `python3 tools/trailer/edl.py` monta a lista de cortes (`edl.json`, em quadros inteiros).
4. `node tools/trailer/compose.mjs` compõe a trilha com os próprios sons do jogo (os instrumentos do FluidR3 e os efeitos CC0) no
   `renderAudio` (operações `note` e `sample`), alinhada aos cortes: `trilha.wav`.
5. `python3 tools/trailer/assemble.py` junta tudo: barras de cinema de 120 px (as da abertura já vêm do jogo), legendas na fonte do jogo,
   fades e a trilha: `trailer.mp4`.

Precisa de Playwright com Chromium (`CHROME` aponta o executável) e ffmpeg com drawtext.
