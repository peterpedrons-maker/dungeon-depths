# Jogos

Monorepo com jogos independentes, cada um em `apps/<nome>/`. Veja [CLAUDE.md](./CLAUDE.md)
para a convenção usada ao adicionar um novo jogo.

## Jogos publicados

Nenhum no momento — `apps/` está vazio, aguardando um projeto novo.

## Rodando localmente

Cada jogo é um projeto Vite isolado:

```sh
cd apps/<nome-do-jogo>
npm install
npm run dev
```

## Deploy

Um único workflow (`.github/workflows/deploy.yml`) builda todas as pastas em `apps/*` e
publica no GitHub Pages a cada push na `main`. Não precisa editar o workflow ao adicionar
um jogo novo.
