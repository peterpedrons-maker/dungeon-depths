export interface Face {
  n: number;
  name: string;
  desc: string;
  color: string;
  unlocked: boolean;
}

// A liberação das faces vem dos marcos da história (src/story/progress.ts).
// Nomes e descrições provisórios — só pra mostrar como a barra de faces ficaria.
export const FACES: Face[] = [
  { n: 1, name: 'Ricochete', desc: 'Quica nas paredes e acerta o que está longe.', color: '#5be7ff', unlocked: false },
  { n: 2, name: 'Peso', desc: 'Cai pesado: aperta placas e quebra piso rachado.', color: '#d9a066', unlocked: true },
  { n: 3, name: 'Fogo', desc: 'Acende tochas e queima cordas.', color: '#ff8a3d', unlocked: true },
  { n: 4, name: 'Troca', desc: 'Troque de lugar com o dado.', color: '#b18cff', unlocked: false },
  { n: 5, name: 'Deslizar', desc: 'Desliza reto até bater em algo.', color: '#7fffb0', unlocked: false },
  { n: 6, name: 'Atravessar', desc: 'Passa por grades e aciona o que está do outro lado.', color: '#ff7fb0', unlocked: false },
];
