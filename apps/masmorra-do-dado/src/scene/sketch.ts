// Rabiscos de outros condenados: desenhos riscados na pedra ao lado dos glifos, só nas primeiras vezes em que uma palavra aparece (ver DESIGN.md §22).
// Ficam claramente "feitos à mão": traço tremido, falhas, sulco escuro com um fio claro por cima, sem cor viva.


export type SketchKind = 'braseiro';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = [number, number];

function draw(kind: SketchKind, seed: number, N: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = N;
  c.height = N;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  const r = rng(seed);
  const K = N / 160; // as coordenadas abaixo foram pensadas numa grade de 160
  // um traço riscado à mão com um prego: o caminho entorta devagar (mão cansada), treme rápido (pedra áspera), a pressão varia
  // (largura irregular), o risco passa um pouco do ponto final e às vezes pula (lascas)
  const stroke = (pts: Pt[], color: string, w: number, bend = 2.4, shake = 0.9) => {
    g.strokeStyle = color;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const ph = r() * 6.28;
    for (let i = 0; i < pts.length - 1; i++) {
      let [x0, y0] = pts[i];
      let [x1, y1] = pts[i + 1];
      // o risco passa um pouco do fim (e começa um pouco depois), como quem não mede
      const dx = x1 - x0;
      const dy = y1 - y0;
      const len = Math.hypot(dx, dy) || 1;
      x1 += (dx / len) * (r() * 3.5);
      y1 += (dy / len) * (r() * 3.5);
      x0 -= (dx / len) * (r() * 2);
      y0 -= (dy / len) * (r() * 2);
      const steps = Math.max(3, Math.round(len / 3));
      let px = x0 * K;
      let py = y0 * K;
      for (let k = 1; k <= steps; k++) {
        const t = k / steps;
        const wob = Math.sin(t * 5.1 + ph + i) * bend;
        const x = (x0 + dx * t + (-dy / len) * wob + (r() - 0.5) * shake * 2) * K;
        const y = (y0 + dy * t + (dx / len) * wob + (r() - 0.5) * shake * 2) * K;
        if (r() > 0.1) {
          // (10% dos trechinhos pulam: a ponta do prego saiu da pedra)
          g.lineWidth = Math.max(1, w * K * (0.65 + r() * 0.8));
          g.beginPath();
          g.moveTo(px, py);
          g.lineTo(x, y);
          g.stroke();
        }
        px = x;
        py = y;
      }
    }
  };
  // cada traço é riscado duas vezes, desencontradas: o sulco escuro e o fio claro (poeira de pedra raspada)
  const scratch = (pts: Pt[], light = '#b9ab8c', bend = 2.4, w = 5) => {
    stroke(pts, '#120e0c', w + 2.5, bend, 1.1);
    stroke(pts.map(([x, y]) => [x - 1, y - 1] as Pt), light, w * 0.55, bend, 0.9);
    if (r() < 0.5) stroke(pts.map(([x, y]) => [x + 0.8, y + 0.5] as Pt), '#8a7e66', 1.5, bend, 1.2); // o risco refeito por cima
  };
  if (kind === 'braseiro') {
    // pedestal torto (as paredes não são paralelas)
    scratch([[54, 152], [58, 98], [104, 94], [101, 150]]);
    scratch([[52, 151], [106, 153]]);
    // hachuras irregulares no pedestal
    for (let i = 0; i < 4; i++) scratch([[62 + i * 11 + r() * 3, 106 + r() * 4], [59 + i * 11 + r() * 4, 142 - r() * 5]], '#8e8268', 2, 1.5);
    // tigela (assimétrica)
    scratch([[34, 68], [53, 97], [109, 95], [127, 72], [38, 70]]);
    // brasas: rabiscos, não losangos limpos
    for (const [x, y] of [[66, 80], [83, 85], [99, 80]] as Pt[]) scratch([[x - 4, y + 1], [x + 1, y - 4], [x + 5, y], [x, y + 4]], '#b9ab8c', 0.8, 2.5);
    // chamas: três línguas tortas, a do meio maior; ocre desbotado
    const flame = (cx: number, base: number, h: number, wd: number) => {
      const pts: Pt[] = [
        [cx - wd, base],
        [cx - wd * 1.05, base - h * 0.4],
        [cx - wd * 0.1, base - h * 0.7],
        [cx + wd * 0.2, base - h],
        [cx + wd * 0.5, base - h * 0.55],
        [cx + wd * 1.1, base - h * 0.35],
        [cx + wd * 0.9, base],
      ];
      stroke(pts, '#120e0c', 8, 2, 1.1);
      stroke(pts.map(([x, y]) => [x - 1, y - 1] as Pt), '#d29a58', 3.2, 2, 0.9);
    };
    flame(61, 68, 33, 11);
    flame(80, 68, 54, 14);
    flame(100, 68, 29, 10);
    // riscos soltos de quem testou o prego, e três faíscas
    scratch([[22, 130], [30, 120]], '#8e8268', 0.6, 2);
    scratch([[128, 116], [136, 128]], '#8e8268', 0.6, 2);
    for (const [x, y] of [[48, 24], [113, 30], [92, 10]] as Pt[]) scratch([[x - 2, y + 1], [x + 3, y - 1]], '#d29a58', 0.4, 2);
  }
  // desgaste: a pedra lascou e a poeira foi limpando o risco em manchas (como nas inscrições, só que mais)
  const wear = N >= 80 ? 1 : 0.35; // em tamanho pequeno (face do dado) o desgaste é menor, senão o desenho some
  const img = g.getImageData(0, 0, N, N);
  const d = img.data;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const o = (y * N + x) * 4;
      if (d[o + 3] === 0) continue;
      const blot = Math.sin(x * 0.31 + seed) * Math.sin(y * 0.27 - seed * 0.6) > 0.42;
      const rr = r();
      if ((blot && rr < 0.7 * wear) || rr < 0.07 * wear) d[o + 3] = 0; // lascou
      else if (rr < 0.3) {
        d[o] = d[o] * 0.7;
        d[o + 1] = d[o + 1] * 0.7;
        d[o + 2] = d[o + 2] * 0.7; // escureceu de sujeira
      }
      if (d[o + 3] > 0) d[o + 3] = 255; // sem meios-tons: pixel de verdade
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

// Versão SIMPLES para a face do dado (pequena, vista de longe): poucos traços grossos e claros, nada de hachura nem riscos soltos.
function drawSimple(kind: SketchKind, seed: number, N: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = N;
  c.height = N;
  const g = c.getContext('2d')!;
  const r = rng(seed);
  const K = N / 100;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  // traço à mão: um trecho por segmento, com tremorzinho e largura variando
  const line = (pts: Pt[], color: string, w: number) => {
    g.strokeStyle = color;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const steps = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 7));
      let px = x0 * K;
      let py = y0 * K;
      for (let k = 1; k <= steps; k++) {
        const t = k / steps;
        const x = (x0 + (x1 - x0) * t + (r() - 0.5) * 2.2) * K;
        const y = (y0 + (y1 - y0) * t + (r() - 0.5) * 2.2) * K;
        g.lineWidth = Math.max(1.5, w * K * (0.8 + r() * 0.5));
        g.beginPath();
        g.moveTo(px, py);
        g.lineTo(x, y);
        g.stroke();
        px = x;
        py = y;
      }
    }
  };
  if (kind === 'braseiro') {
    const PALE = '#e4d8b8';
    const OCRE = '#f0a850';
    // pedestal, tigela e três chamas
    line([[36, 96], [38, 64], [66, 63], [64, 96], [36, 96]], PALE, 5);
    line([[18, 42], [34, 64], [68, 63], [84, 44], [20, 43]], PALE, 5);
    for (const [cx, h, wd] of [[34, 22, 7], [51, 38, 9], [68, 20, 7]] as [number, number, number][]) {
      line([[cx - wd, 42], [cx - wd * 0.8, 42 - h * 0.5], [cx, 42 - h], [cx + wd * 0.7, 42 - h * 0.5], [cx + wd, 42]], OCRE, 5);
    }
  }
  return c;
}

// O desenho de uma palavra, riscado à mão (N pixels de lado). Na face do dado (ver `dieSketchFaceTexture` em textures.ts) usa a versão simples.
export function sketchCanvas(kind: SketchKind, seed = 8, N = 40): HTMLCanvasElement {
  return N < 80 ? drawSimple(kind, seed, N) : draw(kind, seed, N);
}
