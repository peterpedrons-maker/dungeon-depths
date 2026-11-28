import { T, type Tx } from './i18n';
export interface Face {
  n: number;
  name: Tx; // (os três idiomas)
  desc: Tx;
  color: string;
  unlocked: boolean;
}

// A liberação das faces vem dos marcos da história (src/story/progress.ts).
// Nomes e descrições provisórios — só pra mostrar como a barra de faces ficaria.
export const FACES: Face[] = [
  { n: 1, name: T('Ricochete', 'Ricochet', 'Rebote'), desc: T('Quica nas paredes e acerta o que está longe.', 'Bounces off walls and hits what is far away.', 'Rebota en las paredes y alcanza lo que está lejos.'), color: '#5be7ff', unlocked: false },
  { n: 2, name: T('Peso', 'Weight', 'Peso'), desc: T('Pesa.', 'Weighs.', 'Pesa.'), color: '#d9a066', unlocked: false },
  { n: 3, name: T('Fogo', 'Fire', 'Fuego'), desc: T('Queima.', 'Burns.', 'Quema.'), color: '#ff8a3d', unlocked: true },
  { n: 4, name: T('Troca', 'Swap', 'Cambio'), desc: T('Troque de lugar com o dado.', 'Swap places with the die.', 'Cambia de lugar con el dado.'), color: '#b18cff', unlocked: false },
  { n: 5, name: T('Deslizar', 'Slide', 'Deslizar'), desc: T('Desliza reto até bater em algo.', 'Slides straight until it hits something.', 'Se desliza recto hasta chocar con algo.'), color: '#7fffb0', unlocked: false },
  { n: 6, name: T('Atravessar', 'Pass through', 'Atravesar'), desc: T('Passa por grades e aciona o que está do outro lado.', 'Passes through grates and triggers what is on the other side.', 'Atraviesa rejas y activa lo que está al otro lado.'), color: '#ff7fb0', unlocked: false },
];
