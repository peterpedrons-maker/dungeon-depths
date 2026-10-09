// =============================================================================
// Motor de grade hexagonal — coordenadas axiais (q, r), hexágonos "flat-top".
// Referência: redblobgames.com/grids/hexagons (orientação flat-top).
// =============================================================================

export interface Axial {
  q: number;
  r: number;
}

export function hexKey(h: Axial): string {
  return `${h.q},${h.r}`;
}

export function keyToHex(key: string): Axial {
  const [q, r] = key.split(",").map(Number);
  return { q, r };
}

export function hexEquals(a: Axial, b: Axial): boolean {
  return a.q === b.q && a.r === b.r;
}

// As 6 direções vizinhas em coordenadas axiais (independem da orientação do desenho).
const DIRECTIONS: Axial[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function hexNeighbor(h: Axial, dir: number): Axial {
  const d = DIRECTIONS[((dir % 6) + 6) % 6];
  return { q: h.q + d.q, r: h.r + d.r };
}

export function hexNeighbors(h: Axial): Axial[] {
  return DIRECTIONS.map((d) => ({ q: h.q + d.q, r: h.r + d.r }));
}

export function hexDistance(a: Axial, b: Axial): number {
  const aq = a.q,
    ar = a.r,
    as = -aq - ar;
  const bq = b.q,
    br = b.r,
    bs = -bq - br;
  return Math.max(Math.abs(aq - bq), Math.abs(ar - br), Math.abs(as - bs));
}

// Todos os hexágonos dentro de um raio N de um centro (preenche uma região hexagonal).
export function hexRegion(center: Axial, radius: number): Axial[] {
  const out: Axial[] = [];
  for (let dq = -radius; dq <= radius; dq++) {
    const rMin = Math.max(-radius, -dq - radius);
    const rMax = Math.min(radius, -dq + radius);
    for (let dr = rMin; dr <= rMax; dr++) {
      out.push({ q: center.q + dq, r: center.r + dr });
    }
  }
  return out;
}

// Anel (não preenchido) de hexágonos a exatamente `radius` de distância.
export function hexRing(center: Axial, radius: number): Axial[] {
  if (radius === 0) return [center];
  const out: Axial[] = [];
  let h: Axial = { q: center.q + DIRECTIONS[4].q * radius, r: center.r + DIRECTIONS[4].r * radius };
  for (let side = 0; side < 6; side++) {
    for (let step = 0; step < radius; step++) {
      out.push(h);
      h = hexNeighbor(h, side);
    }
  }
  return out;
}

const SQRT3 = Math.sqrt(3);

// Centro em pixels de um hex flat-top, dado o tamanho (raio do centro ao vértice).
export function hexToPixel(h: Axial, size: number): { x: number; y: number } {
  const x = size * (1.5 * h.q);
  const y = size * ((SQRT3 / 2) * h.q + SQRT3 * h.r);
  return { x, y };
}

export function pixelToHex(x: number, y: number, size: number): Axial {
  const q = ((2 / 3) * x) / size;
  const r = ((-1 / 3) * x + (SQRT3 / 3) * y) / size;
  return hexRound(q, r);
}

function hexRound(q: number, r: number): Axial {
  let s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);
  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);
  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }
  return { q: rq, r: rr };
}

// Os 6 vértices de um hex flat-top, relativos ao centro (ângulo 0° = vértice à direita).
export function hexCorners(size: number): { x: number; y: number }[] {
  const corners: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    corners.push({ x: size * Math.cos(angle), y: size * Math.sin(angle) });
  }
  return corners;
}

// PRNG determinístico simples (mulberry32) — pra gerar o mapa sempre igual a partir de uma seed.
export function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
