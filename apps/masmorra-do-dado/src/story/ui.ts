import { dialogue } from './dialogue';
import { createStore } from './store';

// Estado das telas por cima do jogo. O motor 3D consulta `blocked()` para parar o jogador.
// O diário é um livro de verdade: `diaryOpen` é o pedido do jogador; `diaryReady` diz que o livro já
// terminou de abrir (só então a interface das páginas aparece) e `rect` onde as páginas estão na tela.
export interface PageRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const uiStore = createStore<{ diaryOpen: boolean; diaryReady: boolean; bookOut: boolean; rect: PageRect | null }>({
  diaryOpen: false,
  diaryReady: false,
  bookOut: false, // o livro está fora da bolsa (subindo, aberto ou descendo)
  rect: null,
});

export const ui = {
  blocked: () => uiStore.get().diaryOpen || dialogue.blocking,
  diaryOpen: () => uiStore.get().diaryOpen,
  setDiary: (open: boolean) => uiStore.set((s) => (s.diaryOpen === open ? s : { ...s, diaryOpen: open })),
  setReady: (ready: boolean) => uiStore.set((s) => (s.diaryReady === ready ? s : { ...s, diaryReady: ready })),
  setBookOut: (out: boolean) => uiStore.set((s) => (s.bookOut === out ? s : { ...s, bookOut: out })),
  setRect: (r: PageRect | null) =>
    uiStore.set((s) => {
      const a = s.rect;
      if (a === r || (a && r && Math.abs(a.x - r.x) < 0.5 && Math.abs(a.y - r.y) < 0.5 && Math.abs(a.w - r.w) < 0.5 && Math.abs(a.h - r.h) < 0.5)) return s;
      return { ...s, rect: r };
    }),
};
