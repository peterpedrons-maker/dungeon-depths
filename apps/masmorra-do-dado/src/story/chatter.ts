import { createStore } from './store';

// O dado (o Boato) fala de vez em quando: poucos símbolos num balão pequeno que não para o jogo.
export interface Chatter {
  id: number;
  glyphs: string[];
}

export const chatterStore = createStore<Chatter | null>(null);
let seq = 0;

export const chatter = {
  say(glyphs: string[]) {
    chatterStore.set({ id: ++seq, glyphs });
  },
  clear() {
    chatterStore.set(null);
  },
};
