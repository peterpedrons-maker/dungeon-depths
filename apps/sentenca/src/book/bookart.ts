// A "encadernação" do diário: couro gasto, gravação a seco, ouro, latão. Tudo pixel a pixel em canvas (sem imagens).
// A capa é desenhada maior que as outras texturas do jogo (o livro aparece grande na tela).

import * as THREE from 'three';
import { drawGlyph } from './font';
import { glyphsOf } from '../story/lexicon';

type RGB = [number, number, number];
const hex = (c: string): RGB => {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const css = (c: RGB, k = 1) => `rgb(${c.map((v) => Math.max(0, Math.min(255, Math.round(v * k)))).join(',')})`;
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// ruído suave (grade pequena interpolada): manchas grandes do couro
function smoothNoise(w: number, h: number, cell: number, seed: number) {
  const r = rng(seed);
  const gw = Math.ceil(w / cell) + 2;
  const gh = Math.ceil(h / cell) + 2;
  const g = Array.from({ length: gw * gh }, () => r());
  return (x: number, y: number) => {
    const fx = x / cell;
    const fy = y / cell;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fx - x0;
    const ty = fy - y0;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const a = g[y0 * gw + x0];
    const b = g[y0 * gw + x0 + 1];
    const c = g[(y0 + 1) * gw + x0];
    const d = g[(y0 + 1) * gw + x0 + 1];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}
const tex = (c: HTMLCanvasElement, repeat = false) => {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

const LEATHER = hex('#6a2618');
const GOLD = hex('#d8ac52');
const BRASS = hex('#b88a3a');

// couro: base com manchas, grão de poros e riscos de uso; devolve o "valor" de cada pixel para gravar por cima
function leather(ctx: CanvasRenderingContext2D, W: number, H: number, seed: number, wear: number) {
  const r = rng(seed);
  const n1 = smoothNoise(W, H, 14, seed + 1);
  const n2 = smoothNoise(W, H, 5, seed + 2);
  const img = ctx.createImageData(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let k = 0.78 + 0.32 * n1(x, y) + 0.12 * n2(x, y) + (r() - 0.5) * 0.08;
      if (r() < 0.06) k *= 0.8; // poros
      // gasto nas bordas: o couro clareia onde as mãos pegam
      const de = Math.min(x, y, W - 1 - x, H - 1 - y);
      if (wear && de < 5) k *= 1 + (0.32 * (5 - de)) / 5 * (0.6 + 0.4 * r());
      const o = (y * W + x) * 4;
      img.data[o] = Math.min(255, LEATHER[0] * k * (de < 5 && wear ? 1.08 : 1));
      img.data[o + 1] = Math.min(255, LEATHER[1] * k);
      img.data[o + 2] = Math.min(255, LEATHER[2] * k);
      img.data[o + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  // riscos claros (arranhões) e manchas escuras
  for (let i = 0; i < W * H * 0.0012; i++) {
    let x = r() * W;
    let y = r() * H;
    const a = r() * Math.PI;
    const len = 3 + r() * 9;
    ctx.fillStyle = css(LEATHER, 1.45);
    for (let k = 0; k < len; k++) {
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      x += Math.cos(a);
      y += Math.sin(a) * 0.6;
    }
  }
  for (let i = 0; i < W * H * 0.0006; i++) {
    const x = Math.floor(r() * W);
    const y = Math.floor(r() * H);
    ctx.fillStyle = 'rgba(30,8,4,0.35)';
    ctx.fillRect(x, y, 2 + Math.floor(r() * 3), 1 + Math.floor(r() * 2));
  }
}

// gravação a seco: um sulco escuro com o brilho do couro logo abaixo (parece afundado)
function blindRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = 'rgba(20,4,2,0.55)';
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x + w - 1, y, 1, h);
  ctx.fillStyle = 'rgba(255,190,150,0.22)';
  ctx.fillRect(x + 1, y + 1, w - 2, 1);
  ctx.fillRect(x + 1, y + 1, 1, h - 2);
  ctx.fillRect(x, y + h, w + 1, 1);
  ctx.fillRect(x + w, y, 1, h + 1);
}
// ouro em relevo: uma sombra escura deslocada, o ouro e um brilho
function goldPx(ctx: CanvasRenderingContext2D, x: number, y: number, w = 1, h = 1, k = 1) {
  ctx.fillStyle = 'rgba(30,8,2,0.6)';
  ctx.fillRect(x + 1, y + 1, w, h);
  ctx.fillStyle = css(GOLD, k);
  ctx.fillRect(x, y, w, h);
}

// ── a capa da frente ──
export function diaryCoverArt(): THREE.CanvasTexture {
  const W = 104;
  const H = 140;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  leather(ctx, W, H, 311, 1);
  // a dobra do lombo (lado esquerdo da textura): vinco escuro e uma nervura clara
  ctx.fillStyle = 'rgba(20,4,2,0.55)';
  ctx.fillRect(0, 0, 3, H);
  ctx.fillRect(8, 0, 1, H);
  ctx.fillStyle = 'rgba(255,190,150,0.18)';
  ctx.fillRect(9, 0, 1, H);
  // duas molduras gravadas a seco e um fio de ouro entre elas
  blindRect(ctx, 14, 7, W - 22, H - 14);
  blindRect(ctx, 19, 12, W - 32, H - 24);
  for (let x = 17; x < W - 10; x += 2) {
    goldPx(ctx, x, 9, 1, 1, 0.85);
    goldPx(ctx, x, H - 10, 1, 1, 0.85);
  }
  for (let y = 11; y < H - 10; y += 2) {
    goldPx(ctx, 16, y, 1, 1, 0.85);
    goldPx(ctx, W - 11, y, 1, 1, 0.85);
  }
  // florões nos cantos da moldura de dentro: losango com pontos
  const fleuron = (cx: number, cy: number) => {
    goldPx(ctx, cx - 1, cy - 3, 3, 1);
    goldPx(ctx, cx - 2, cy - 2, 5, 1);
    goldPx(ctx, cx - 3, cy - 1, 7, 3);
    goldPx(ctx, cx - 2, cy + 2, 5, 1);
    goldPx(ctx, cx - 1, cy + 3, 3, 1);
    ctx.fillStyle = css(LEATHER, 0.6);
    ctx.fillRect(cx, cy, 1, 1);
    goldPx(ctx, cx - 6, cy, 2, 1, 0.8);
    goldPx(ctx, cx + 5, cy, 2, 1, 0.8);
    goldPx(ctx, cx, cy - 6, 1, 2, 0.8);
    goldPx(ctx, cx, cy + 5, 1, 2, 0.8);
  };
  for (const [fx, fy] of [[25, 18], [W - 19, 18], [25, H - 19], [W - 19, H - 19]]) fleuron(fx, fy);
  // o título: uma placa afundada com os glifos de LEMBRAR em ouro
  const tx = 30;
  const ty = 26;
  const tw = W - 50;
  const th = 18;
  ctx.fillStyle = 'rgba(20,4,2,0.45)';
  ctx.fillRect(tx, ty, tw, th);
  blindRect(ctx, tx, ty, tw, th);
  const gl = glyphsOf('lembrar');
  gl.forEach((g, i) => {
    const gx = tx + tw / 2 + (i - (gl.length - 1) / 2) * 17;
    drawGlyph(ctx, g, Math.round(gx) + 1, ty + th / 2 + 1, 17, 'rgba(20,4,2,0.8)');
    drawGlyph(ctx, g, Math.round(gx), ty + th / 2, 17, css(GOLD));
  });
  // o emblema: um sol de raios curtos, um anel e, dentro, a face CINCO do dado
  const ex = Math.round(W / 2 + 3);
  const ey = 78;
  for (let a = 0; a < 16; a++) {
    const ang = (a / 16) * Math.PI * 2;
    const r0 = 22;
    const r1 = a % 2 ? 26 : 29;
    for (let rr = r0; rr <= r1; rr++) goldPx(ctx, Math.round(ex + Math.cos(ang) * rr), Math.round(ey + Math.sin(ang) * rr), 1, 1, a % 2 ? 0.8 : 1);
  }
  for (let a = 0; a < 120; a++) {
    const ang = (a / 120) * Math.PI * 2;
    goldPx(ctx, Math.round(ex + Math.cos(ang) * 19), Math.round(ey + Math.sin(ang) * 19));
  }
  // a face do dado: quadrado de cantos cortados, pontos em ouro com brilho
  const s = 26;
  const x0 = ex - s / 2;
  const y0 = ey - s / 2;
  ctx.fillStyle = 'rgba(20,4,2,0.35)';
  ctx.fillRect(x0 + 1, y0 + 1, s, s);
  for (let i = 2; i < s - 2; i++) {
    goldPx(ctx, x0 + i, y0);
    goldPx(ctx, x0 + i, y0 + s - 1);
    goldPx(ctx, x0, y0 + i);
    goldPx(ctx, x0 + s - 1, y0 + i);
  }
  goldPx(ctx, x0 + 1, y0 + 1);
  goldPx(ctx, x0 + s - 2, y0 + 1);
  goldPx(ctx, x0 + 1, y0 + s - 2);
  goldPx(ctx, x0 + s - 2, y0 + s - 2);
  for (const [dx, dy] of [[6, 6], [s - 9, 6], [s / 2 - 1.5, s / 2 - 1.5], [6, s - 9], [s - 9, s - 9]]) {
    goldPx(ctx, Math.round(x0 + dx), Math.round(y0 + dy), 3, 3);
    ctx.fillStyle = '#fff0b8';
    ctx.fillRect(Math.round(x0 + dx), Math.round(y0 + dy), 1, 1);
  }
  // fio de ouro com um ponto embaixo do emblema
  for (let x = ex - 18; x <= ex + 18; x++) if (Math.abs(x - ex) > 2) goldPx(ctx, x, ey + 38, 1, 1, 0.9);
  goldPx(ctx, ex - 1, ey + 37, 3, 3);
  // cantoneiras de latão nas duas pontas de fora (a do lombo não tem)
  const corner = (top: boolean) => {
    const S = 15;
    for (let j = 0; j < S; j++)
      for (let i = 0; i < S - j; i++) {
        const x = W - 1 - i;
        const y = top ? j : H - 1 - j;
        const edge = i + j >= S - 2;
        const k = edge ? 0.6 : 0.85 + 0.35 * ((i + j) % 5 === 0 ? 1 : 0) + (i < 2 || j < 2 ? 0.25 : 0);
        ctx.fillStyle = css(BRASS, k);
        ctx.fillRect(x, y, 1, 1);
      }
    // rebites
    for (const [i, j] of [[4, 2], [2, 4]]) {
      const x = W - 1 - i;
      const y = top ? j : H - 1 - j;
      ctx.fillStyle = '#3a2410';
      ctx.fillRect(x - 1, y, 2, 2);
      ctx.fillStyle = '#ffe8a0';
      ctx.fillRect(x - 1, y, 1, 1);
    }
  };
  corner(true);
  corner(false);
  return tex(c);
}

// couro liso (verso, beiradas): repete
export function diaryLeatherArt(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 48;
  const ctx = c.getContext('2d')!;
  leather(ctx, 48, 48, 313, 0);
  return tex(c, true);
}

// a lombada: couro com quatro nervuras (relevos) e filetes de ouro
export function diarySpineArt(): THREE.CanvasTexture {
  const W = 24;
  const H = 140;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  leather(ctx, W, H, 317, 1);
  for (const y of [22, 50, 90, 118]) {
    ctx.fillStyle = 'rgba(255,190,150,0.28)';
    ctx.fillRect(0, y - 2, W, 2);
    ctx.fillStyle = 'rgba(20,4,2,0.55)';
    ctx.fillRect(0, y + 2, W, 2);
    for (let x = 1; x < W - 1; x += 2) {
      goldPx(ctx, x, y - 5, 1, 1, 0.85);
      goldPx(ctx, x, y + 6, 1, 1, 0.85);
    }
  }
  // um losango dourado entre as nervuras do meio
  const cy = 70;
  for (let k = 0; k < 6; k++) goldPx(ctx, W / 2 - k, cy - 6 + k, 2 * k + 1, 1);
  for (let k = 0; k < 6; k++) goldPx(ctx, W / 2 - 5 + k, cy + k, 11 - 2 * k, 1);
  return tex(c);
}

// as beiradas das folhas: creme com as folhas finíssimas e um pouco de sujeira de dedo
export function diaryEdgeArt(): THREE.CanvasTexture {
  const W = 64;
  const H = 32;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const r = rng(319);
  const n = smoothNoise(W, H, 9, 320);
  for (let y = 0; y < H; y++) {
    const line = 0.86 + 0.14 * ((y * 7) % 3 === 0 ? 0 : 1) + (r() - 0.5) * 0.06;
    for (let x = 0; x < W; x++) {
      const k = line * (0.88 + 0.16 * n(x, y));
      ctx.fillStyle = css(hex('#ecd0a0'), k);
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return tex(c, true);
}

// ── O FUNDO DO CADERNO (DESIGN.md §69): por dentro da capa de trás, a parte dura, de couro, com o DADO ABERTO em cruz talhado e um furo para
// cada ponto (21). As gemas enchem os furos em ordem: a face 1, depois a 2, ... (story/gems.ts). Do tamanho de uma página (o livro mostra
// esta textura numa placa reta no lugar do papel da direita, quando se chega ao fim do caderno).
export const BOARD_W = 132;
export const BOARD_H = 176;
const NET_S = 34; // o lado de uma face, em pixels
const NET_X = 19;
const NET_Y = 18;
// onde fica cada face na cruz [coluna, linha]: a coluna do meio é 1, 2, 6, 5 (faces opostas somam 7) e os braços, 3 e 4
const NET: Record<number, [number, number]> = { 1: [1, 0], 3: [0, 1], 2: [1, 1], 4: [2, 1], 6: [1, 2], 5: [1, 3] };
// os pontos de cada face (grade 3 x 3), na ordem em que as gemas entram
const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
};
const faceXY = (f: number) => ({ x: NET_X + NET[f][0] * NET_S, y: NET_Y + NET[f][1] * NET_S });
// o centro do furo de número k (0..20), em pixels da placa
export function gemSocketPx(k: number): { x: number; y: number } {
  let face = 1;
  let first = 0;
  while (k >= first + face) {
    first += face;
    face++;
  }
  const [a, b] = PIPS[face][k - first];
  const o = faceXY(face);
  return { x: o.x + 8 + a * 9, y: o.y + 8 + b * 9 };
}
const disc = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: (dx: number, dy: number, d2: number) => string | null) => {
  for (let dy = -r - 1; dy <= r + 1; dy++)
    for (let dx = -r - 1; dx <= r + 1; dx++) {
      const c = color(dx, dy, dx * dx + dy * dy);
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(cx + dx, cy + dy, 1, 1);
    }
};
// `n` gemas já no lugar; `flash` = o furo que acabou de receber a sua (o brilho dura `fk` de 0 a 1)
export function drawGemBoard(ctx: CanvasRenderingContext2D, n: number, flash = -1, fk = 1) {
  const W = BOARD_W;
  const H = BOARD_H;
  leather(ctx, W, H, 331, 0);
  // a dobra do lombo (à esquerda) afunda na sombra; a beirada do couro dobrado por dentro, gravada a seco
  for (let x = 0; x < 16; x++) {
    ctx.fillStyle = `rgba(16,4,2,${0.55 * (1 - x / 16) ** 1.4})`;
    ctx.fillRect(x, 0, 1, H);
  }
  ctx.fillStyle = 'rgba(16,4,2,0.45)';
  ctx.fillRect(10, 7, W - 17, 1);
  ctx.fillRect(10, H - 8, W - 17, 1);
  ctx.fillRect(W - 8, 7, 1, H - 14);
  ctx.fillStyle = 'rgba(255,190,150,0.16)';
  ctx.fillRect(10, 8, W - 17, 1);
  ctx.fillRect(10, H - 7, W - 17, 1);
  ctx.fillRect(W - 7, 7, 1, H - 14);
  for (let x = 13; x < W - 10; x += 3) {
    goldPx(ctx, x, 10, 1, 1, 0.55);
    goldPx(ctx, x, H - 11, 1, 1, 0.55);
  }
  // as faces: rebaixadas no couro, com o fio gravado a seco; a face completa ganha o fio de ouro
  let done = 0;
  let need = 0;
  for (let f = 1; f <= 6; f++) {
    need += f;
    const full = n >= need;
    if (full) done = f;
    const o = faceXY(f);
    ctx.fillStyle = 'rgba(20,4,2,0.32)';
    ctx.fillRect(o.x + 1, o.y + 1, NET_S - 1, NET_S - 1);
    ctx.fillStyle = 'rgba(16,4,2,0.7)';
    ctx.fillRect(o.x, o.y, NET_S + 1, 1);
    ctx.fillRect(o.x, o.y, 1, NET_S + 1);
    ctx.fillStyle = 'rgba(255,190,150,0.2)';
    ctx.fillRect(o.x + 1, o.y + NET_S, NET_S, 1);
    ctx.fillRect(o.x + NET_S, o.y + 1, 1, NET_S);
    if (full) {
      for (let k = 2; k < NET_S - 1; k++) {
        goldPx(ctx, o.x + k, o.y + 2, 1, 1, 0.95);
        goldPx(ctx, o.x + k, o.y + NET_S - 2, 1, 1, 0.95);
        goldPx(ctx, o.x + 2, o.y + k, 1, 1, 0.95);
        goldPx(ctx, o.x + NET_S - 2, o.y + k, 1, 1, 0.95);
      }
    }
  }
  void done;
  // os furos: aro de latão; vazio, um buraco escuro; cheio, a gema lapidada (luz em cima à esquerda)
  for (let k = 0; k < 21; k++) {
    const { x, y } = gemSocketPx(k);
    const has = k < n;
    disc(ctx, x, y, 4, (dx, dy, d2) => {
      if (d2 > 14) return null;
      if (d2 > 7) return css(BRASS, dx + dy < 0 ? 1.05 : 0.62);
      if (!has) return dx + dy >= 2 ? 'rgb(40,18,10)' : 'rgb(14,5,3)';
      if (dx === -1 && dy === -2) return 'rgb(236,255,255)';
      const s = -(dx + dy) / 6; // -1 (embaixo à direita) .. 1 (em cima à esquerda)
      return s > 0.3 ? 'rgb(150,240,255)' : s > -0.3 ? 'rgb(56,196,232)' : 'rgb(24,112,150)';
    });
    if (has) {
      ctx.fillStyle = 'rgba(120,230,255,0.22)';
      for (const [dx, dy] of [[-4, -1], [4, 1], [-1, -4], [1, 4]]) ctx.fillRect(x + dx, y + dy, 1, 1);
    }
  }
  // o furo que acabou de receber a gema: um anel de luz que abre e some
  if (flash >= 0 && fk < 1) {
    const { x, y } = gemSocketPx(flash);
    const r = 4 + fk * 9;
    const a = (1 - fk) * 0.9;
    disc(ctx, x, y, Math.ceil(r) + 1, (_dx, _dy, d2) => (Math.abs(Math.sqrt(d2) - r) < 0.8 ? `rgba(200,250,255,${a})` : null));
  }
}
