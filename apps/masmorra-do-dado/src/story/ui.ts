import { dialogue } from './dialogue';
import { createStore } from './store';

// Estado das telas por cima do jogo. O motor 3D consulta `blocked()` para parar o jogador.
// `diaryOpen` é o pedido do jogador (o livro sobe, abre e vira páginas no HUD 3D);
// `bookOut` diz que o livro está fora da bolsa (subindo, aberto ou descendo).
export const uiStore = createStore<{ diaryOpen: boolean; bookOut: boolean }>({ diaryOpen: false, bookOut: false });

export const ui = {
  blocked: () => uiStore.get().diaryOpen || dialogue.blocking,
  diaryOpen: () => uiStore.get().diaryOpen,
  setDiary: (open: boolean) => uiStore.set((s) => (s.diaryOpen === open ? s : { ...s, diaryOpen: open })),
  setBookOut: (out: boolean) => uiStore.set((s) => (s.bookOut === out ? s : { ...s, bookOut: out })),
};
