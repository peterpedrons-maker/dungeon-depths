import { createStore } from './store';

// O dado (o Boato) fala de vez em quando: poucos símbolos num balão pequeno que não para o jogo.
export interface Chatter {
  id: number;
  glyphs: string[];
  pic?: string; // desenho que acompanha a fala (SketchKind): aparece antes dos glifos
  hold?: boolean; // fica à vista até alguém mandar apagar (a pergunta do dado, enquanto as opções estão na tela)
}

export const chatterStore = createStore<Chatter | null>(null);
let seq = 0;

export const chatter = {
  say(glyphs: string[], pic?: string, hold?: boolean) {
    chatterStore.set({ id: ++seq, glyphs, pic, hold });
  },
  clear() {
    chatterStore.set(null);
  },
};
