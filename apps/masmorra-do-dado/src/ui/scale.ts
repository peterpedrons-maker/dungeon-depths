import { createStore, useStore } from '../story/store';

// Escala da interface: no celular (tela baixa, na horizontal) fica 1; em telas maiores (PC) os glifos, balões e caixas crescem junto,
// para não ficarem minúsculos. Também vira a variável CSS --ui (multiplicador de tamanhos em px).
const calc = () => Math.max(1, Math.min(2.1, Math.min(window.innerHeight / 470, window.innerWidth / 900)));
export const uiScaleStore = createStore(1);
const apply = () => {
  const f = Math.round(calc() * 100) / 100;
  uiScaleStore.set(f);
  document.documentElement.style.setProperty('--ui', String(f));
  // tamanhos da fonte de pixels (múltiplos de 10px: cada pixel da letra vira 1, 2, 3 ou 4 pixels da tela, sem borrar)
  const st = document.documentElement.style;
  st.setProperty('--fs', `${10 * Math.max(1, Math.round(f))}px`);
  st.setProperty('--fm', `${10 * Math.max(2, Math.round(1.4 * f))}px`);
  st.setProperty('--fl', `${10 * Math.max(2, Math.round(1.8 * f))}px`);
};
if (typeof window !== 'undefined') {
  apply();
  window.addEventListener('resize', apply);
}
export const useUiScale = () => useStore(uiScaleStore);
