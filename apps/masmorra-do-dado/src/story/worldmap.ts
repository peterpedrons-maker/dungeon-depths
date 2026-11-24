// Mapa 2D estilo "Symphony of the Night": salas em grade, ligadas por passagens e portas.
// Só as salas já visitadas aparecem. Coordenadas em células (largura 16 px, altura 9 px no livro); norte para cima.
export interface MapRoom {
  key: string; // início do nome da sala (ex.: "Sala 1")
  x: number;
  y: number;
  w: number;
  h: number;
  kind?: 'round' | 'stage'; // só para dar uma dica do formato no desenho
}

export const MAP_CELL_W = 28;
export const MAP_CELL_H = 9;

// Hoje o mundo é uma fila de 4 salas (a primeira embaixo, a última em cima); as passagens ligam as vizinhas.
export const WORLD: MapRoom[] = [
  { key: 'Sala 4', x: 0, y: 0, w: 3, h: 3, kind: 'stage' },
  { key: 'Sala 3', x: 0, y: 4, w: 3, h: 3, kind: 'round' },
  { key: 'Sala 2', x: 0, y: 8, w: 3, h: 2 },
  { key: 'Sala 1', x: 0, y: 11, w: 3, h: 2 },
];
export const MAP_COLS = 3;
export const MAP_ROWS = 13;

// "Sala 1 · A Entrada" -> "Sala 1" (por enquanto as salas não têm nome definitivo)
export const shortRoom = (name: string) => name.split(' · ')[0] || name;
