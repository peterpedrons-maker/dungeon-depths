// Mapa do mundo, no estilo "Symphony of the Night": salas em grade, ligadas por passagens com portas,
// em vários andares. Só as salas visitadas aparecem. Coordenadas em células (6 x 5 px no livro); norte para cima.
export const CELL_W = 6;
export const CELL_H = 5;

export interface MapRoom {
  key: string; // início do nome da sala (ex.: "Sala 1")
  floor: number; // índice do andar
  x: number;
  y: number;
  w: number;
  h: number;
  kind?: 'round' | 'stage' | 'save' | 'boss';
  stairs?: ('up' | 'down')[]; // escadas para outro andar
}

export interface MapLink {
  a: string;
  b: string;
  path: [number, number][]; // células da passagem (a primeira e a última são as portas)
  locked?: boolean; // porta trancada
}

export interface World {
  floors: string[]; // "1F", "2F"...
  cols: number;
  rows: number;
  rooms: MapRoom[];
  links: MapLink[];
}

// "Sala 1 · A Entrada" -> "Sala 1" (por enquanto as salas não têm nome definitivo)
export const shortRoom = (name: string) => name.split(' · ')[0] || name;

// passagem em "L": de `from` até `to`, andando primeiro na horizontal ou na vertical
function hv(from: [number, number], to: [number, number], horizFirst: boolean): [number, number][] {
  const out: [number, number][] = [[from[0], from[1]]];
  let x = from[0];
  let y = from[1];
  const sx = () => {
    while (x !== to[0]) out.push([(x += Math.sign(to[0] - x)), y]);
  };
  const sy = () => {
    while (y !== to[1]) out.push([x, (y += Math.sign(to[1] - y))]);
  };
  if (horizFirst) (sx(), sy());
  else (sy(), sx());
  return out;
}
const join = (...parts: [number, number][][]) => {
  const out: [number, number][] = [];
  for (const p of parts) for (const c of p) if (!out.length || out[out.length - 1][0] !== c[0] || out[out.length - 1][1] !== c[1]) out.push(c);
  return out;
};
// ligação entre duas salas: a à esquerda de b (horizontal) ou a acima de b (vertical)
function connect(a: MapRoom, b: MapRoom, vertical: boolean): [number, number][] {
  if (!vertical) {
    const ya = a.y + Math.floor(a.h / 2);
    const yb = b.y + Math.floor(b.h / 2);
    const from: [number, number] = [a.x + a.w, ya];
    const to: [number, number] = [b.x - 1, yb];
    const mx = Math.floor((from[0] + to[0]) / 2);
    return join(hv(from, [mx, ya], true), hv([mx, ya], [mx, yb], false), hv([mx, yb], to, true));
  }
  const xa = a.x + Math.floor(a.w / 2);
  const xb = b.x + Math.floor(b.w / 2);
  const from: [number, number] = [xa, a.y + a.h];
  const to: [number, number] = [xb, b.y - 1];
  const my = Math.floor((from[1] + to[1]) / 2);
  return join(hv(from, [xa, my], false), hv([xa, my], [xb, my], true), hv([xb, my], to, false));
}

// O mundo de verdade (hoje: 4 salas em fila, da esquerda para a direita).
const R1: MapRoom = { key: 'Sala 1', floor: 0, x: 2, y: 9, w: 7, h: 6 };
const R2: MapRoom = { key: 'Sala 2', floor: 0, x: 13, y: 9, w: 7, h: 6 };
const R3: MapRoom = { key: 'Sala 3', floor: 0, x: 24, y: 8, w: 8, h: 8, kind: 'round' };
const R4: MapRoom = { key: 'Sala 4', floor: 0, x: 36, y: 9, w: 3, h: 6, kind: 'stage' };
export const REAL_WORLD: World = {
  floors: ['1F'],
  cols: 40,
  rows: 25,
  rooms: [R1, R2, R3, R4],
  links: [
    { a: R1.key, b: R2.key, path: connect(R1, R2, false) },
    { a: R2.key, b: R3.key, path: connect(R2, R3, false) },
    { a: R3.key, b: R4.key, path: connect(R3, R4, false) },
  ],
};

let world: World = REAL_WORLD;
export const getWorld = () => world;
export const setWorld = (w: World) => {
  world = w;
};

// ── mundo de teste (só para ver como ficaria um mapa grande; não existe no jogo ainda) ──
function rngf(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mockWorld(seed = 21): World {
  const r = rngf(seed);
  const LX = 5;
  const LY = 3;
  const SX = 8;
  const SY = 8;
  const floors = ['1F', '2F', '3F'];
  const rooms: MapRoom[] = [];
  const links: MapLink[] = [];
  let n = 1;
  const grids: (MapRoom | null)[][][] = [];
  floors.forEach((_, f) => {
    const g: (MapRoom | null)[][] = [];
    for (let j = 0; j < LY; j++) {
      g[j] = [];
      for (let i = 0; i < LX; i++) {
        if (r() < 0.06) {
          g[j][i] = null;
          continue;
        }
        const w = 3 + Math.floor(r() * 4);
        const h = 3 + Math.floor(r() * 3);
        const room: MapRoom = { key: `Sala ${n++}`, floor: f, x: i * SX + 1 + Math.floor(r() * (SX - w)), y: j * SY + 1 + Math.floor(r() * (SY - h)), w, h };
        const k = r();
        if (w === 3 && h === 3 && k < 0.5) room.kind = 'save';
        else if (w >= 5 && h >= 4 && k < 0.25) room.kind = 'round';
        else if (k > 0.88) room.kind = 'stage';
        g[j][i] = room;
        rooms.push(room);
      }
    }
    grids.push(g);
    // árvore geradora (sala por sala) + alguns atalhos
    const seen = new Set<MapRoom>();
    const stack: [number, number][] = [];
    const first = g.flat().find((x) => x);
    if (!first) return;
    const pos = (room: MapRoom): [number, number] => [Math.floor((room.x - 1) / SX), Math.floor((room.y - 1) / SY)];
    const add = (a: MapRoom, b: MapRoom, vertical: boolean) => {
      links.push({ a: a.key, b: b.key, path: connect(a, b, vertical), locked: r() < 0.12 });
    };
    const start = pos(first);
    stack.push(start);
    seen.add(first);
    while (stack.length) {
      const [ci, cj] = stack[stack.length - 1];
      const cur = g[cj][ci]!;
      const opts: [number, number][] = [[ci + 1, cj], [ci - 1, cj], [ci, cj + 1], [ci, cj - 1]].filter(([i, j]) => i >= 0 && i < LX && j >= 0 && j < LY && g[j][i] && !seen.has(g[j][i]!)) as [number, number][];
      if (!opts.length) {
        stack.pop();
        continue;
      }
      const [ni, nj] = opts[Math.floor(r() * opts.length)];
      const nxt = g[nj][ni]!;
      seen.add(nxt);
      if (ni !== ci) add(ni > ci ? cur : nxt, ni > ci ? nxt : cur, false);
      else add(nj > cj ? cur : nxt, nj > cj ? nxt : cur, true);
      stack.push([ni, nj]);
    }
    // atalhos
    for (let j = 0; j < LY; j++) {
      for (let i = 0; i < LX; i++) {
        const a = g[j][i];
        if (!a) continue;
        const right = i + 1 < LX ? g[j][i + 1] : null;
        const down = j + 1 < LY ? g[j + 1][i] : null;
        const has = (x: MapRoom, y: MapRoom) => links.some((l) => (l.a === x.key && l.b === y.key) || (l.a === y.key && l.b === x.key));
        if (right && !has(a, right) && r() < 0.28) add(a, right, false);
        if (down && !has(a, down) && r() < 0.28) add(a, down, true);
      }
    }
  });
  // escadas entre os andares
  for (let f = 0; f < floors.length - 1; f++) {
    const cand: [number, number][] = [];
    for (let j = 0; j < LY; j++) for (let i = 0; i < LX; i++) if (grids[f][j][i] && grids[f + 1][j][i]) cand.push([i, j]);
    const [i, j] = cand[Math.floor(r() * cand.length)];
    (grids[f][j][i]!.stairs ??= []).push('up');
    (grids[f + 1][j][i]!.stairs ??= []).push('down');
  }
  // chefe: a maior sala do último andar
  const top = rooms.filter((x) => x.floor === floors.length - 1).sort((a, b) => b.w * b.h - a.w * a.h)[0];
  if (top) top.kind = 'boss';
  return { floors, cols: LX * SX, rows: LY * SY + 1, rooms, links };
}
