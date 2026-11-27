import { createStore } from './store';

// Quem fala. O mundo (dado, escrivão, ecos) fala em GLIFOS; os pensamentos do jogador vêm em português.
export type Speaker = 'thought' | 'boato' | 'escrivao' | 'eco';

export interface Line {
  who: Speaker;
  glyphs?: string[]; // ids de palavras (lexicon)
  text?: string; // português (só pensamentos)
}

export interface Conversation {
  id: number;
  lines: Line[];
  i: number;
  block: boolean; // true = o jogador fica parado até terminar
  onEnd?: () => void;
}

// A palavra que escreve o nome de cada falante.
export const SPEAKER_WORD: Record<Exclude<Speaker, 'thought'>, string> = {
  boato: 'boatodado',
  escrivao: 'escrivao',
  eco: 'eco',
};

export const dialogueStore = createStore<Conversation | null>(null);
let seq = 0;

export const dialogue = {
  say(lines: Line[], o: { block?: boolean; onEnd?: () => void } = {}) {
    if (!lines.length) return;
    dialogueStore.set({ id: ++seq, lines, i: 0, block: o.block ?? true, onEnd: o.onEnd });
  },
  next() {
    const c = dialogueStore.get();
    if (!c) return;
    if (c.i + 1 >= c.lines.length) {
      dialogueStore.set(null);
      c.onEnd?.();
    } else dialogueStore.set({ ...c, i: c.i + 1 });
  },
  // apaga a conversa sem chamar o `onEnd` (pular a abertura)
  clear() {
    dialogueStore.set(null);
  },
  get blocking() {
    const c = dialogueStore.get();
    return !!c && c.block;
  },
};
