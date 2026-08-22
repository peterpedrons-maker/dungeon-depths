import { defineConfig } from 'vite';

// Not a game — just a short/memorable redirect to apps/reino-e-masmorras'
// real (longer) published path, so there's a nicer link to share than
// ".../dungeon-depths/reino-e-masmorras/". Still a normal Vite project (per
// the monorepo convention in the root CLAUDE.md) so the existing deploy
// workflow picks it up and publishes it under its own subpath with zero
// workflow changes.
export default defineConfig({
  base: '/dungeon-depths/reino/',
});
