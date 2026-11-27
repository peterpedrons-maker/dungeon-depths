import * as THREE from 'three';

// OS DESENHOS A GIZ DAS PAREDES (pedido do Pedro, DESIGN.md §80). O mesmo giz do jogo (quadradinhos claros, #f0ecdc, colados um atrás do
// outro, que falham no grão da pedra) em desenhos feitos à mão pelos condenados: tremor de mão, traço que engrossa no meio e afina nas pontas,
// alguns traços repassados, um pouco de pó em volta, e partes apagadas (esfregadas). Nada de glifo nos desenhos (o desenho dos tamanhos, da
// Galeria, é a exceção: ele traz GRANDE e PEQUENO embaixo, exatamente como no léxico).
// Usado nas salas (decalques: a Galeria, os corredores, a Lousa) e no fundo da tela de carregamento.

// ── o pincel ──
export const hash = (x: number, y: number) => {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
export const rnd = (seed: number) => {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967295;
  };
};
export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)] / 16;
// suaviza uma curva (Chaikin, duas vezes)
export const chaikin = (pts: number[][]) => {
  let p = pts;
  for (let k = 0; k < 2; k++) {
    const o: number[][] = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const [x0, y0] = p[i];
      const [x1, y1] = p[i + 1];
      o.push([x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25], [x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]);
    }
    o.push(p[p.length - 1]);
    p = o;
  }
  return p;
};
export const lenOf = (pts: number[][]) => {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
};
// os tons do giz (o claro é o do jogo, #f0ecdc) e o do pó solto, em RGB 0..1
export const CHALK_RGB = [
  [0.79, 0.78, 0.72],
  [0.87, 0.85, 0.8],
  [0.94, 0.925, 0.86],
  [0.985, 0.97, 0.925],
];
export const DUST_RGB = [0.6, 0.6, 0.57];
// `plot(px, py, k)`: pinta o pixel com o tom k do giz (0 = mais escuro … 3 = mais claro; -1 = pó solto)
export type Plot = (px: number, py: number, k: number) => void;
export function chalkDot(plot: Plot, x: number, y: number, size = 2) {
  const x0 = Math.round(x - size / 2);
  const y0 = Math.round(y - size / 2);
  for (let dy = 0; dy < size; dy++)
    for (let dx = 0; dx < size; dx++) {
      const px = x0 + dx;
      const py = y0 + dy;
      const h = hash(px * 7 + 3, py * 13 + 1);
      if (h < 0.14) continue; // falha do giz
      plot(px, py, h < 0.3 ? 0 : h < 0.55 ? 1 : h < 0.88 ? 2 : 3);
    }
  const h2 = hash(x0 * 31, y0 * 17);
  if (h2 < 0.05) plot(x0 + (h2 < 0.025 ? -2 : size + 1), y0 + (h2 < 0.012 ? size : -1), -1);
}
// risca um traço do comprimento `from` até `to` (px ao longo dele); devolve a ponta (para o toco de giz)
export function chalkAlong(plot: Plot, pts: number[][], from: number, to: number, size = 2): { x: number; y: number } | null {
  let acc = 0;
  let tip: { x: number; y: number } | null = null;
  for (let k = 1; k < pts.length; k++) {
    const [x0, y0] = pts[k - 1];
    const [x1, y1] = pts[k];
    const L = Math.hypot(x1 - x0, y1 - y0);
    if (acc + L < from) {
      acc += L;
      continue;
    }
    for (let d = Math.max(from, acc); d <= Math.min(to, acc + L); d += 0.5) {
      const u = (d - acc) / (L || 1);
      chalkDot(plot, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, size);
      tip = { x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u };
    }
    acc += L;
    if (acc >= to) break;
  }
  return tip;
}

// ── os desenhos: traços numa caixa de 100 × 75 (y para baixo); `c` = curva; `d` = tracejado; pontos à parte ──
type S = { p: number[][]; c?: boolean; d?: boolean };
type Dot = [number, number, number]; // x, y, raio (unidades)
export type DrawKind = 'braseiro' | 'porta' | 'dado' | 'poco' | 'figura' | 'mao' | 'rosto' | 'tamanhos' | 'contagem';
interface Drawing {
  s: S[];
  dots?: Dot[];
  fade?: number; // 0..1: quanto está apagado (esfregado)
}
// os símbolos GRANDE e PEQUENO (léxico: moldura V = as duas laterais; pontos 0,2,6,8 e 4), numa grade de passo `g` com centro (cx, cy)
const glyphV = (cx: number, cy: number, g: number, cells: number[]): { s: S[]; dots: Dot[] } => {
  const hf = g * 1.65;
  return {
    s: [{ p: [[cx - hf, cy - hf], [cx - hf, cy + hf]] }, { p: [[cx + hf, cy - hf], [cx + hf, cy + hf]] }],
    dots: cells.map((i) => [cx + ((i % 3) - 1) * g, cy + (Math.floor(i / 3) - 1) * g, 1.1] as Dot),
  };
};
// uma língua de fogo: gota pontuda, com a ponta um pouco torta
const tongue = (cx: number, base: number, h: number, w: number): S => ({
  p: [[cx - w / 2, base], [cx - w * 0.46, base - h * 0.4], [cx - w * 0.16, base - h * 0.75], [cx + w * 0.06, base - h], [cx + w * 0.14, base - h * 0.72], [cx + w * 0.46, base - h * 0.38], [cx + w / 2, base]],
  c: true,
});
const brazier = (cx: number, top: number, w: number, flame: number): S[] => {
  const h = w * 0.3;
  return [
    { p: [[cx - w / 2 - 1.5, top], [cx + w / 2 + 1.5, top]] }, // a borda
    { p: [[cx - w / 2, top], [cx - w * 0.42, top + h * 0.6], [cx - w * 0.28, top + h], [cx + w * 0.28, top + h], [cx + w * 0.42, top + h * 0.6], [cx + w / 2, top]], c: true }, // a bacia
    { p: [[cx - w * 0.08, top + h], [cx - w * 0.08, top + h * 1.9]] }, // a haste
    { p: [[cx + w * 0.08, top + h], [cx + w * 0.08, top + h * 1.9]] },
    { p: [[cx - w * 0.3, top + h * 2], [cx + w * 0.3, top + h * 2]] }, // o pé
    // a chama: três línguas pontudas (a do meio mais alta)
    ...(flame > 0 ? [tongue(cx - w * 0.2, top - 1, flame * 0.6, w * 0.26), tongue(cx + w * 0.02, top - 1, flame, w * 0.3), tongue(cx + w * 0.23, top - 1, flame * 0.7, w * 0.24)] : []),
  ];
};
const DRAW: Record<Exclude<DrawKind, 'contagem'>, Drawing> = {
  braseiro: {
    s: [
      ...brazier(50, 42, 40, 30),
      { p: [[62, 46], [66, 50]] }, // sombreado da bacia, riscado
      { p: [[58, 47], [62, 51]] },
    ],
    dots: [[30, 14, 0.9], [69, 10, 0.9], [60, 5, 0.7]],
  },
  porta: {
    s: [
      { p: [[34, 70], [34, 30]] },
      { p: [[34, 30], [36, 20], [42, 13], [50, 10], [58, 13], [64, 20], [66, 30]], c: true },
      { p: [[66, 30], [66, 70]] },
      { p: [[28, 71], [72, 71]] }, // a soleira
      { p: [[45, 70], [45, 12]] }, // as tábuas
      { p: [[55, 70], [55, 12]] },
      { p: [[34, 40], [66, 40]] }, // a cinta de ferro
      { p: [[58, 47], [60.5, 45], [63, 47], [60.5, 49.5], [58, 47.2]], c: true }, // a argola
      { p: [[36, 64], [42, 60]] }, // sombreado
      { p: [[36, 68], [43, 63]] },
      { p: [[37, 54], [43, 50]] },
    ],
  },
  dado: {
    s: [
      { p: [[30, 30], [62, 30], [62, 62], [30, 62], [30, 30.5]] }, // a frente
      { p: [[30, 30], [40, 20], [72, 20], [62, 30]] }, // em cima
      { p: [[62, 62], [72, 52], [72, 20]] }, // o lado
      { p: [[35, 42], [38.5, 39.5], [42, 42], [38.5, 44.5], [35, 42.2]], c: true }, // os olhos
      { p: [[50, 42], [53.5, 39.5], [57, 42], [53.5, 44.5], [50, 42.2]], c: true },
      { p: [[46, 39], [46, 50]] }, // o nariz
      { p: [[40, 55], [52, 55]] }, // a boca (reta: neutro)
      { p: [[64, 56], [70, 50]] }, // sombreado do lado
      { p: [[64, 47], [70, 41]] },
    ],
    dots: [[38.5, 42, 0.9], [53.5, 42, 0.9], [44, 26, 0.9], [51, 25, 0.9], [58, 24, 0.9], [67, 33, 0.9], [67, 43, 0.9]],
  },
  poco: {
    s: [
      { p: [[34, 14], [42, 9], [50, 8], [58, 9], [66, 14], [58, 19], [50, 20], [42, 19], [34, 14.2]], c: true }, // a boca do poço, lá em cima
      { p: [[34, 14], [29, 56]] }, // as paredes
      { p: [[66, 14], [71, 56]] },
      { p: [[44, 22], [40, 50]], d: true }, // a luz descendo
      { p: [[50, 22], [50, 52]], d: true },
      { p: [[56, 22], [60, 50]], d: true },
      // alguém embaixo, olhando para cima, de braços erguidos
      { p: [[50, 61], [50, 68]] },
      { p: [[50, 68], [47, 74]] },
      { p: [[50, 68], [53, 74]] },
      { p: [[50, 63], [45, 58]] },
      { p: [[50, 63], [55, 58]] },
      { p: [[48, 57], [47.6, 55.4], [50, 54.4], [52.4, 55.4], [52, 57.6], [50, 58.6], [48, 57.2]], c: true },
    ],
    dots: [[46, 30, 0.6], [54, 36, 0.6], [48, 44, 0.6], [52, 27, 0.6]],
  },
  figura: {
    s: [
      // o capuz pontudo, a túnica que alarga, as mangas em sino: quem passa de vez em quando
      { p: [[50, 6], [44, 16], [40, 28], [40, 36]], c: true },
      { p: [[50, 6], [56, 16], [60, 28], [60, 36]], c: true },
      { p: [[40, 36], [44, 38], [50, 38.5], [56, 38], [60, 36]], c: true },
      { p: [[41, 38], [33, 72]] },
      { p: [[59, 38], [67, 72]] },
      { p: [[33, 72], [50, 73], [67, 72]], c: true },
      { p: [[41, 42], [30, 56], [37, 59], [43, 50]], c: true },
      { p: [[59, 42], [70, 56], [63, 59], [57, 50]], c: true },
      { p: [[50, 39], [50, 71]] },
    ],
    dots: [[46.5, 27, 1.5], [53.5, 27, 1.5]],
  },
  mao: {
    s: [
      {
        p: [[40, 74], [40, 58], [31, 49], [28.5, 43], [32, 41], [40, 48], [39.5, 24], [42.5, 21], [46.5, 23], [47, 44], [47.5, 17], [51, 14.5], [54.5, 16.5], [54.5, 44], [56, 21], [59.5, 19.5], [62, 22], [61, 46], [64, 32], [67.5, 31.5], [69, 34.5], [64.5, 56], [62, 74]],
        c: true,
      },
    ],
  },
  rosto: {
    s: [
      { p: [[30, 12], [70, 12], [70, 62], [30, 62], [30, 12.5]] },
      { p: [[37, 31], [45, 31]] },
      { p: [[55, 31], [63, 31]] },
      { p: [[50, 31], [50, 45]] },
      { p: [[42, 53], [58, 53]] },
    ],
    dots: [[46, 20, 0.9], [50, 20, 0.9], [54, 20, 0.9]],
    fade: 0.25,
  },
  tamanhos: (() => {
    const gr = glyphV(26, 64, 4, [0, 2, 6, 8]);
    const pe = glyphV(79, 64, 4, [4]);
    return {
      // o braseiro enorme (chama alta) e o minúsculo; embaixo de cada um, a palavra
      s: [...brazier(26, 25, 32, 22), ...brazier(79, 41, 11, 8), ...gr.s, ...pe.s],
      dots: [...gr.dots, ...pe.dots],
    };
  })(),
};

export interface ChalkOpt {
  fade?: number; // apagado extra (0..1)
  days?: number; // a contagem: quantos dias
  step?: number; // a contagem: px entre um risco e outro (menos de 5 = giz fino)
  pad?: number; // margem (fração)
}
// a resolução de um decalque de `w` metros de largura: `ppm` pixels por metro (~85 na Galeria, larga, vista a 2–3 m; ~105 nos corredores,
// estreitos, vistos a 1 m). Pouco demais e o desenho vira mancha de perto; demais e o traço fino falha de longe
export const decalRes = (w: number, h: number, ppm = 85): [number, number] => [Math.max(32, Math.round(w * ppm)), Math.max(24, Math.round(h * ppm))];
// desenha numa grade de pixels W×H (RGBA, fundo transparente). `fade`: apagado extra (0..1); `days`: para a contagem
export function drawChalk(kind: DrawKind, W: number, H: number, seed = 1, opt: ChalkOpt = {}) {
  const data = new Uint8ClampedArray(W * H * 4);
  const r = rnd(seed * 97 + 13);
  const fade = Math.min(0.95, (opt.fade ?? 0) + (kind === 'contagem' ? 0 : DRAW[kind].fade ?? 0));
  const plot: Plot = (px, py, k) => {
    if (px < 0 || py < 0 || px >= W || py >= H) return;
    const o = (py * W + px) * 4;
    // apagado: esfregões horizontais tortos tiram parte do giz
    if (fade > 0) {
      const streak = 0.55 + 0.45 * Math.sin(px * 0.13 + py * 0.5 + seed) * Math.sin(py * 0.21 - px * 0.05);
      if (hash(px + seed * 31, py * 3 + 7) < fade * (0.55 + 0.6 * streak)) return;
    }
    if (k < 0) {
      if (data[o + 3]) return;
      data[o] = 150;
      data[o + 1] = 149;
      data[o + 2] = 142;
      data[o + 3] = 255;
      return;
    }
    const c = CHALK_RGB[k];
    data[o] = c[0] * 255;
    data[o + 1] = c[1] * 255;
    data[o + 2] = c[2] * 255;
    data[o + 3] = 255;
  };
  if (kind === 'contagem') {
    // a contagem dos dias: grupos de quatro riscos e o quinto atravessado, em fileiras tortas
    const days = opt.days ?? 23;
    const sp = opt.step ?? Math.max(3, Math.round(H / 11));
    const hh = Math.round(sp * 2.4);
    const bs = sp < 5 ? 1 : 2; // (miúda: giz fino)
    let n = 0;
    let row = 0;
    while (n < days) {
      let x = sp + 2 + Math.round(r() * 4);
      const y = 2 + row * Math.round(hh * 1.5) + Math.round(r() * 2);
      if (y + hh >= H - 1) break;
      while (n < days && x + sp * 5 < W - 2) {
        const gx = x;
        for (let k = 0; k < 4 && n < days; k++, n++) {
          const lean = (r() - 0.5) * 1.8;
          stroke(plot, [[x + (r() - 0.5), y + (r() - 0.5) * 1.5], [x + lean, y + hh + (r() - 0.5) * 1.5]], bs, r);
          x += sp;
        }
        if (n < days) {
          stroke(plot, [[gx - sp * 0.7, y + hh * 0.8], [x - sp * 0.2, y + hh * 0.2]], bs, r);
          n++;
        }
        x += Math.round(sp * 1.9 + r() * 2);
        if (r() < 0.12) x += sp * 2;
      }
      row++;
    }
  } else {
    const D = DRAW[kind];
    const pad = opt.pad ?? 0.06;
    const sc = Math.min((W * (1 - 2 * pad)) / 100, (H * (1 - 2 * pad)) / 75);
    const ox = (W - 100 * sc) / 2;
    const oy = (H - 75 * sc) / 2;
    const J = 0.6; // tremor de mão (unidades)
    const size = sc > 0.42 ? 2 : 1;
    for (const st of D.s) {
      let pts = st.p.map(([x, y]) => [ox + (x + (r() - 0.5) * J) * sc, oy + (y + (r() - 0.5) * J) * sc]);
      if (st.c) pts = chaikin(pts);
      if (st.d) {
        // tracejado: pedaços de ~3 unidades com vãos
        const L = lenOf(pts);
        for (let a = 0; a < L; a += 5 * sc) stroke(plot, slice(pts, a, Math.min(L, a + 2.6 * sc)), 1, r);
      } else stroke(plot, pts, size, r);
    }
    for (const [x, y, rad] of D.dots ?? []) {
      const cx = ox + (x + (r() - 0.5) * J * 0.5) * sc;
      const cy = oy + (y + (r() - 0.5) * J * 0.5) * sc;
      const R = Math.max(0.8, rad * sc);
      for (let yy = Math.floor(cy - R); yy <= Math.ceil(cy + R); yy++)
        for (let xx = Math.floor(cx - R); xx <= Math.ceil(cx + R); xx++)
          if ((xx - cx) ** 2 + (yy - cy) ** 2 <= R * R + 0.3) {
            const h = hash(xx * 5 + 1, yy * 9 + 2);
            if (h > 0.08) plot(xx, yy, h < 0.4 ? 1 : 2);
          }
    }
  }
  return data;
}
// um pedaço de um traço (de `a` a `b`, em px ao longo dele)
function slice(pts: number[][], a: number, b: number) {
  const out: number[][] = [];
  let acc = 0;
  for (let k = 1; k < pts.length; k++) {
    const [x0, y0] = pts[k - 1];
    const [x1, y1] = pts[k];
    const L = Math.hypot(x1 - x0, y1 - y0);
    for (let d = Math.max(a, acc); d <= Math.min(b, acc + L); d += 0.5) {
      const u = (d - acc) / (L || 1);
      out.push([x0 + (x1 - x0) * u, y0 + (y1 - y0) * u]);
    }
    acc += L;
  }
  return out.length > 1 ? out : [[0, 0], [0, 0]];
}
// um traço de giz feito à mão: mais grosso no meio, fino nas pontas; às vezes repassado (um segundo traço meio pixel ao lado, mais falhado)
function stroke(plot: Plot, pts: number[][], size: number, r: () => number) {
  const L = lenOf(pts);
  if (L < 0.5) return;
  let acc = 0;
  const again = r() < 0.35;
  const ox = (r() - 0.5) * 1.4;
  const oy = (r() - 0.5) * 1.4;
  for (let k = 1; k < pts.length; k++) {
    const [x0, y0] = pts[k - 1];
    const [x1, y1] = pts[k];
    const l = Math.hypot(x1 - x0, y1 - y0);
    for (let d = 0; d <= l; d += 0.5) {
      const u = (d / (l || 1));
      const x = x0 + (x1 - x0) * u;
      const y = y0 + (y1 - y0) * u;
      const f = (acc + d) / L;
      const s = size > 1 && (f < 0.07 || f > 0.93) ? size - 1 : size; // as pontas afinam
      chalkDot(plot, x, y, s);
      if (again && hash(Math.round(x * 3), Math.round(y * 3)) < 0.5) chalkDot(plot, x + ox, y + oy, 1);
    }
    acc += l;
  }
}

// a textura de um desenho (para decalque nas salas): pixel nítido, cor do giz; o resto transparente
export function chalkCanvas(kind: DrawKind, W: number, H: number, seed = 1, opt: ChalkOpt = {}) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  img.data.set(drawChalk(kind, W, H, seed, opt));
  g.putImageData(img, 0, 0);
  return c;
}
// (nas paredes iluminadas pelas tochas, o giz branco puro saturava em laranja e o brilho do pós-processo o fazia parecer em brasa: o giz das
// paredes é um pouco mais fosco, `tone` 0,7, como o dos riscos da Lousa)
export function chalkTexture(kind: DrawKind, W: number, H: number, seed = 1, opt: ChalkOpt & { tone?: number } = {}) {
  const c = chalkCanvas(kind, W, H, seed, opt);
  const k = opt.tone ?? 0.7;
  if (k !== 1) {
    const g = c.getContext('2d')!;
    const img = g.getImageData(0, 0, W, H);
    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i] *= k;
      img.data[i + 1] *= k;
      img.data[i + 2] *= k * 0.98;
    }
    g.putImageData(img, 0, 0);
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
