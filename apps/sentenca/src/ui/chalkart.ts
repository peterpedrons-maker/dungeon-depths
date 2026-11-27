import { brickTexture } from '../scene/textures';

// O GIZ EM 2D (DESIGN.md §80): o mesmo giz do jogo (quadradinhos claros, cor #f0ecdc, colados um atrás do outro, falhando no grão da pedra)
// riscado na mesma parede de alvenaria das salas. Usado pela abertura da editora e pela tela de carregamento.

// o pincel (o mesmo das paredes do jogo) mora em scene/chalkdraw.ts
import { CHALK_RGB, DUST_RGB, bayer, BAYER, chaikin, chalkAlong, chalkDot, hash, lenOf, rnd, type Plot } from '../scene/chalkdraw';
export { CHALK_RGB, DUST_RGB, bayer, BAYER, chaikin, chalkAlong, chalkDot, hash, lenOf, rnd, type Plot };

// ── as letras a giz: traços numa grade de 6 × 10 (y para baixo); `c` = curva ──
export type Stroke = { p: number[][]; c?: boolean };
const BOWL = { p: [[0, 0], [3.6, 0], [5.4, 1.2], [5.6, 2.6], [5.3, 3.9], [3.6, 5], [0, 5]], c: true };
const RING = { p: [[3, 0], [0.9, 0.9], [0, 3.4], [0, 6.6], [0.9, 9.1], [3, 10], [5.1, 9.1], [6, 6.6], [6, 3.4], [5.1, 0.9], [3.05, 0.05]], c: true };
const CEE = [[5.8, 1.6], [4.4, 0.1], [2.4, 0], [0.8, 1], [0, 3.4], [0, 6.6], [0.8, 9], [2.4, 10], [4.4, 9.9], [5.8, 8.4]];
export const LETTERS: Record<string, { w: number; s: Stroke[] }> = {
  A: { w: 6, s: [{ p: [[0, 10], [3, 0], [6, 10]] }, { p: [[1.3, 6.3], [4.7, 6.3]] }] },
  B: { w: 6, s: [{ p: [[0, 0], [0, 10]] }, { p: [[0, 0], [3.8, 0], [5.2, 1.1], [5.2, 3.7], [3.8, 4.8], [0, 4.8]], c: true }, { p: [[0, 4.8], [4.2, 4.8], [5.9, 6.2], [5.9, 8.6], [4.3, 10], [0, 10]], c: true }] },
  C: { w: 6, s: [{ p: CEE, c: true }] },
  D: { w: 6, s: [{ p: [[0, 0], [0, 10]] }, { p: [[0, 0], [2.6, 0], [5, 1.8], [5.9, 5], [5, 8.2], [2.6, 10], [0, 10]], c: true }] },
  E: { w: 5, s: [{ p: [[5, 0], [0, 0], [0, 10], [5, 10]] }, { p: [[0, 5], [4, 5]] }] },
  G: { w: 6, s: [{ p: [...CEE.slice(0, -1), [6, 8.6], [6, 6], [3.4, 6]], c: true }] },
  H: { w: 6, s: [{ p: [[0, 0], [0, 10]] }, { p: [[6, 0], [6, 10]] }, { p: [[0, 5.2], [6, 5.2]] }] },
  I: { w: 2, s: [{ p: [[1, 0], [1, 10]] }] },
  L: { w: 5, s: [{ p: [[0, 0], [0, 10], [5, 10]] }] },
  N: { w: 6, s: [{ p: [[0, 10], [0, 0], [6, 10], [6, 0]] }] },
  O: { w: 6, s: [RING] },
  P: { w: 6, s: [{ p: [[0, 0], [0, 10]] }, BOWL] },
  Q: { w: 6, s: [RING, { p: [[3.6, 7.2], [6.4, 10.8]] }] },
  R: { w: 6, s: [{ p: [[0, 0], [0, 10]] }, BOWL, { p: [[2.4, 5], [6, 10]] }] },
  S: { w: 6, s: [{ p: [[5.6, 1.4], [4.2, 0], [1.6, 0], [0.2, 1.4], [0.4, 3.6], [2.4, 4.8], [4.4, 5.4], [5.9, 6.8], [5.8, 8.8], [4.3, 10], [1.4, 10], [0, 8.6]], c: true }] },
  U: { w: 6, s: [{ p: [[0, 0], [0, 7], [0.9, 9.2], [3, 10], [5.1, 9.2], [6, 7], [6, 0]], c: true }] },
  Z: { w: 6, s: [{ p: [[0, 0], [6, 0], [0, 10], [6, 10]] }] },
  ' ': { w: 2.5, s: [] },
};
export const GAP = 2.4; // entre letras (unidades)
export const textWidth = (t: string) => t.split('').reduce((a, ch) => a + (LETTERS[ch]?.w ?? 6) + GAP, -GAP);

// tremor de mão: cada letra um pouco torta, cada ponto um pouco fora
export function textStrokes(t: string, x: number, y: number, unit: number, seed: number) {
  const out: number[][][] = [];
  const rr = rnd(seed);
  let cx = x;
  for (const ch of t) {
    const L = LETTERS[ch] ?? LETTERS[' '];
    const rot = (rr() - 0.5) * 0.08;
    const by = (rr() - 0.5) * 0.6;
    for (const st of L.s) {
      let pts = st.p.map(([px, py]) => {
        const xx = px - L.w / 2;
        const yy = py - 5;
        return [cx + (L.w / 2 + xx * Math.cos(rot) - yy * Math.sin(rot) + (rr() - 0.5) * 0.26) * unit, y + (5 + xx * Math.sin(rot) + yy * Math.cos(rot) + by + (rr() - 0.5) * 0.26) * unit];
      });
      if (st.c) pts = chaikin(pts);
      out.push(pts);
    }
    cx += (L.w + GAP) * unit;
  }
  return out;
}

// tremor para traços de símbolo (em unidades da caixa 0..20)
export function shapeStrokes(strokes: Stroke[], x: number, y: number, unit: number, seed: number) {
  const rr = rnd(seed);
  return strokes.map((st) => {
    let pts = st.p.map(([px, py]) => [x + (px + (rr() - 0.5) * 0.3) * unit, y + (py + (rr() - 0.5) * 0.3) * unit]);
    if (st.c) pts = chaikin(pts);
    return pts;
  });
}

// o toco de giz na ponta do traço: inclinado, a mão fica embaixo à direita (cores RGB 0..1)
export function chalkStub(px: (x: number, y: number, c: number[]) => void, x: number, y: number) {
  const ux = 0.58;
  const uy = 0.81;
  for (let i = 0; i < 9; i++)
    for (let j = -1; j <= 1; j++)
      px(Math.round(x + 1 + i * ux - j * uy), Math.round(y + 1 + i * uy + j * ux), i === 0 ? [1, 1, 1] : j < 0 ? [0.96, 0.95, 0.91] : j > 0 ? [0.66, 0.68, 0.64] : [0.86, 0.855, 0.81]);
}

// ── a parede das salas (a mesma textura de alvenaria), em RGB 0..1, para ser iluminada pixel a pixel ──
export function wallBase(W: number, H: number, scale = 1) {
  const tex = brickTexture([1, 1], 1, 11, 'crypt');
  const src = tex.image as HTMLCanvasElement;
  const sg = src.getContext('2d')!;
  const sd = sg.getImageData(0, 0, src.width, src.height).data;
  tex.dispose();
  const out = new Float32Array(W * H * 3);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const sx = Math.floor(x / scale) % src.width;
      const sy = Math.floor(y / scale) % src.height;
      const o = (sy * src.width + sx) * 4;
      const i = (y * W + x) * 3;
      out[i] = sd[o] / 255;
      out[i + 1] = sd[o + 1] / 255;
      out[i + 2] = sd[o + 2] / 255;
    }
  return out;
}
