import { createStore, useStore } from '../story/store';

// Escala da interface: no celular (tela baixa, na horizontal) fica 1; em telas maiores (PC) os glifos, balões e caixas crescem junto,
// para não ficarem minúsculos. Também vira a variável CSS --ui (multiplicador de tamanhos em px).
const calc = () => Math.max(1, Math.min(2.1, Math.min(window.innerHeight / 470, window.innerWidth / 900)));
export const uiScaleStore = createStore(1);
const apply = () => {
  const f = Math.round(calc() * 100) / 100;
  uiScaleStore.set(f);
  document.documentElement.style.setProperty('--ui', String(f));
};
if (typeof window !== 'undefined') {
  apply();
  window.addEventListener('resize', apply);
}
export const useUiScale = () => useStore(uiScaleStore);
