import { dialogue } from './dialogue';
import { createStore } from './store';

// Estado das telas por cima do jogo. O motor 3D consulta `blocked()` para parar o jogador.
// `diaryOpen` é o pedido do jogador (o livro sobe, abre e vira páginas no HUD 3D);
// `bookOut` diz que o livro está fora da bolsa (subindo, aberto ou descendo).
// `bookCall`: o caderno acabou de ser achado; o botão do diário pulsa e o resto da tela escurece até o jogador abri-lo.
// `guided`: a 1ª abertura do caderno (vira sozinho até BRASEIRO e não fecha antes de o jogador escrever alguma coisa).
// `guidedNote`: no modo guiado, o jogador já escreveu (o ícone de fechar pulsa).
export const uiStore = createStore<{ diaryOpen: boolean; bookOut: boolean; bars: boolean; bookCall: boolean; guided: boolean; guidedNote: boolean }>({
  diaryOpen: false,
  bookOut: false,
  bars: false,
  bookCall: false,
  guided: false,
  guidedNote: false,
});

export const ui = {
  blocked: () => uiStore.get().diaryOpen || dialogue.blocking,
  diaryOpen: () => uiStore.get().diaryOpen,
  setDiary: (open: boolean) => uiStore.set((s) => (s.diaryOpen === open ? s : { ...s, diaryOpen: open })),
  setBars: (on: boolean) => uiStore.set((s) => (s.bars === on ? s : { ...s, bars: on })), // faixas de cinema (cenas)
  setBookOut: (out: boolean) => uiStore.set((s) => (s.bookOut === out ? s : { ...s, bookOut: out })),
  bookCall: () => uiStore.get().bookCall,
  setBookCall: (on: boolean) => uiStore.set((s) => (s.bookCall === on ? s : { ...s, bookCall: on })),
  guided: () => uiStore.get().guided,
  setGuided: (on: boolean) => uiStore.set((s) => (s.guided === on ? s : { ...s, guided: on, guidedNote: on ? false : s.guidedNote })),
  setGuidedNote: (on: boolean) => uiStore.set((s) => (s.guidedNote === on ? s : { ...s, guidedNote: on })),
  uiGuidedOk: () => uiStore.get().guidedNote,
};
