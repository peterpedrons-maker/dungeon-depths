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
  pixel art "crocante" (Three.js renderizando em baixa resolução + dithering, texturas
  procedurais, sem arquivos de imagem). O jogador segura um dado e escolhe a face (1–6) antes
  de arremessar/posicionar; cada face é uma mecânica de puzzle (ricochete, peso, fogo...).
  Sem combate. Por enquanto só existe a tela de visual (`src/scene/`); o protótipo jogável
  vem depois. Publicado em `/masmorra-do-dado/`.

Os jogos antigos (dungeon-depths, reino-e-masmorras, ricochete) foram removidos de `apps/` e
continuam no histórico do git.
