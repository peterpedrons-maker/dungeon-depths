import { dialogue } from './dialogue';
import { createStore } from './store';

// Estado das telas por cima do jogo. O motor 3D consulta `blocked()` para parar o jogador.
export const uiStore = createStore({ diaryOpen: false });

export const ui = {
  blocked: () => uiStore.get().diaryOpen || dialogue.blocking,
  diaryOpen: () => uiStore.get().diaryOpen,
  setDiary: (open: boolean) => uiStore.set((s) => (s.diaryOpen === open ? s : { ...s, diaryOpen: open })),
};
