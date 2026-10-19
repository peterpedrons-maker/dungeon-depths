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

- `apps/dungeon-depths/` — twin-stick survivor-like, tema masmorra. Publicado na raiz do site.
- `apps/reino-e-masmorras/` — RPG single-player de masmorras em fantasia medieval, com
  menus/texto e um painel visual simples de combate estilo plataforma 2D. Publicado em
  `/reino-e-masmorras/`.
- `apps/ricochete/` — roguelike arcade top-down 2D: o jogador arremessa uma bola do
  centro da arena, que quica nos blocos quebráveis até achar a saída (avança de fase,
  mais difícil) ou cair num buraco escondido na borda (fim de run). Pontos viram ouro
  persistente (localStorage) pra comprar upgrades permanentes numa loja. Trilha sonora
  com instrumentos reais via amostras (`smplr`/Web Audio, sem arquivos de áudio no
  repo — as amostras vêm de um CDN público em tempo de execução), que ganha camadas
  conforme o jogador quebra blocos. Publicado em `/ricochete/`.

## reino-e-masmorras: KIT-DE-ARTE.md

`apps/reino-e-masmorras/KIT-DE-ARTE.md` é o arquivo com todos os prompts de arte
(sprites de inimigos/chefes/classes, cenas, mapas, ícones, etc.) do jogo, mais um
índice no topo do arquivo listando cada item com status (✅ pronto/integrado,
🕓 prompt escrito aguardando arte, 🎨 arte existe mas não foi integrada, ⛔ prompt
ainda não escrito).

**Toda vez que uma tarefa que tocar esse arquivo (ou adicionar conteúdo que precisa
de arte nova) for concluída, mande o arquivo pro usuário via SendUserFile** — ele
usa isso pra saber o que ainda falta gerar. Ao adicionar prompts novos, sempre
atualize o índice no mesmo commit (nova linha com status, e `<a id="...">` acima
do heading correspondente se for uma seção nova) — o índice não pode ficar
desatualizado.
