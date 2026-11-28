// Todas as texturas são desenhadas pixel a pixel em canvas pequenos (16-32px) e
// usadas com filtro "nearest" — nenhum arquivo de imagem, o visual granulado
// vem do próprio código.

import { sketchCanvas, type SketchKind } from './sketch';
import * as THREE from 'three';
import { chalkTexture } from './chalkdraw';
import { drawGlyph } from '../book/font';
import type { GlyphDef } from '../story/lexicon';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type RGB = [number, number, number];

function hex(c: string): RGB {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function shade(c: RGB, k: number): string {
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(c[0])},${f(c[1])},${f(c[2])})`;
}

function canvas(w: number, h = w) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

// smooth = decalques com detalhes finos (linhas, runas): mipmap trilinear, pra não "cintilar"
// quando ficam menores que um pixel da tela.
function toTexture(c: HTMLCanvasElement, repeat?: [number, number], wrap = true, smooth = false): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  if (wrap) {
    // texturas que repetem usam mipmap "nearest": de longe os pixels se fundem em
    // vez de cintilar, e de perto continuam quadradões.
    t.minFilter = THREE.NearestMipmapNearestFilter;
    t.generateMipmaps = true;
    t.anisotropy = 4;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (repeat) t.repeat.set(repeat[0], repeat[1]);
  } else if (smooth) {
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 4;
  } else {
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
  }
  return t;
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, w = 1, h = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

const STONE: RGB[] = [hex('#4a485e'), hex('#55536b'), hex('#403e52'), hex('#4f4a64')];
const MORTAR = '#1c1b26';

// Cada sala tem seu "clima": tons da pedra, da argamassa e do piso.
export interface Theme {
  stone: RGB[];
  mortar: string;
  floor: RGB[];
  floorGap: string;
}
export const THEMES: Record<string, Theme> = {
  // vestíbulo: ruína velha, pedra cinza e sem cor, poeira por tudo (o começo, antes da Casa "acordar")
  ruin: {
    stone: [hex('#56565c'), hex('#5e5d64'), hex('#4b4a52'), hex('#59575f')],
    mortar: '#17161c',
    floor: [hex('#4f4b49'), hex('#58534f'), hex('#444040')],
    floorGap: '#171413',
  },
  // sala 1: roxo-acinzentado, tijolo comum
  crypt: { stone: STONE, mortar: MORTAR, floor: [hex('#5a4d47'), hex('#645650'), hex('#4c413d')], floorGap: '#1d1816' },
  // sala 2: pedra esverdeada, úmida
  moss: {
    stone: [hex('#3f5a58'), hex('#486660'), hex('#355150'), hex('#41605a')],
    mortar: '#12201f',
    floor: [hex('#44564f'), hex('#4d6058'), hex('#3a4a45')],
    floorGap: '#101a18',
  },
  // sala 3: arenito avermelhado, cor de brasa
  ember: {
    stone: [hex('#6a4640'), hex('#74504a'), hex('#5c3c38'), hex('#6e4a42')],
    mortar: '#241210',
    floor: [hex('#5e4038'), hex('#6a4a40'), hex('#50362f')],
    floorGap: '#1c0f0d',
  },
  // sala 4: pedra azul-fria, bem alta
  frost: {
    stone: [hex('#4a5878'), hex('#55648a'), hex('#404e6c'), hex('#4f5e82')],
    mortar: '#141a2a',
    floor: [hex('#4a566e'), hex('#546080'), hex('#404a60')],
    floorGap: '#121622',
  },
};

// ── as texturas de alvenaria (paredes, pisos, pedra lavrada) ─────────────────────────────────────────────────────────────────
// 64 px por ladrilho de 1,2 m (antes 32): de longe o mipmap as reduz e o visual fica o mesmo; de perto (pilar, mureta, degrau) cada tijolo
// tem quina iluminada, sombra embaixo, grão, poros, lascas e rachaduras, em vez de um bloco de cor. Desenhadas num buffer de pixels.
const TS = 64;
class Pix {
  d: Uint8ClampedArray;
  constructor(public w: number, public h: number) {
    this.d = new Uint8ClampedArray(w * h * 4);
  }
  set(x: number, y: number, c: RGB, k = 1) {
    x = ((x % this.w) + this.w) % this.w;
    y = ((y % this.h) + this.h) % this.h;
    const o = (y * this.w + x) * 4;
    this.d[o] = c[0] * k;
    this.d[o + 1] = c[1] * k;
    this.d[o + 2] = c[2] * k;
    this.d[o + 3] = 255;
  }
  mul(x: number, y: number, k: number) {
    x = ((x % this.w) + this.w) % this.w;
    y = ((y % this.h) + this.h) % this.h;
    const o = (y * this.w + x) * 4;
    this.d[o] *= k;
    this.d[o + 1] *= k;
    this.d[o + 2] *= k;
  }
  fill(c: RGB) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) this.set(x, y, c);
  }
  put(ctx: CanvasRenderingContext2D) {
    ctx.putImageData(new ImageData(this.d as unknown as Uint8ClampedArray<ArrayBuffer>, this.w, this.h), 0, 0);
  }
}
// ruído suave (valor interpolado) para manchas de umidade e desgaste, periódico no ladrilho
function blotch(r: () => number, n = 8) {
  const g = Array.from({ length: n * n }, () => r());
  const at = (i: number, j: number) => g[(((j % n) + n) % n) * n + (((i % n) + n) % n)];
  return (x: number, y: number) => {
    const fx = (x / TS) * n;
    const fy = (y / TS) * n;
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const u = fx - i;
    const v = fy - j;
    const su = u * u * (3 - 2 * u);
    const sv = v * v * (3 - 2 * v);
    return (at(i, j) * (1 - su) + at(i + 1, j) * su) * (1 - sv) + (at(i, j + 1) * (1 - su) + at(i + 1, j + 1) * su) * sv;
  };
}
// uma rachadura fina que anda de cima para baixo dentro de um retângulo
function crack(p: Pix, r: () => number, x0: number, y0: number, len: number, k = 0.45) {
  let x = x0;
  let y = y0;
  for (let i = 0; i < len; i++) {
    p.mul(x, y, k);
    if (r() < 0.35) p.mul(x + 1, y, 0.8); // a borda da rachadura pega um pouco de luz
    y += 1;
    x += r() < 0.3 ? (r() < 0.5 ? -1 : 1) : 0;
  }
}

function drawBricks(ctx: CanvasRenderingContext2D, tint: number, seed: number, th: Theme) {
  const r = rng(seed);
  const p = new Pix(TS, TS);
  const mortar = hex(th.mortar);
  p.fill(mortar);
  // a argamassa também tem grão (areia) e fica mais escura funda no meio da junta
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) p.set(x, y, mortar, 0.85 + r() * 0.4);
  const damp = blotch(r, 4);
  const BW = 32; // tijolo de 0,6 m
  const BH = 16; // por 0,3 m
  for (let row = 0; row < TS / BH; row++) {
    const off = row % 2 ? BW / 2 : 0;
    for (let col = -1; col < TS / BW + 1; col++) {
      const x0 = col * BW + off;
      const y0 = row * BH;
      const base = th.stone[Math.floor(r() * th.stone.length)];
      const roll = r();
      const brickK = tint * (roll < 0.14 ? 0.74 : roll > 0.88 ? 1.2 : 0.88 + r() * 0.24);
      const chip = [r() < 0.35, r() < 0.35, r() < 0.35, r() < 0.35]; // cantos lascados
      const sag = r() < 0.3 ? 1 : 0; // alguns tijolos afundados: a quina de cima some na sombra
      const W = BW - 2;
      const H = BH - 2;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const cx = x0 + 1 + x;
          const cy = y0 + 1 + y;
          // cantos lascados: arredonda (a argamassa aparece)
          const c0 = (x < 2 && y < 2 && chip[0] && x + y < 2) || (x > W - 3 && y < 2 && chip[1] && W - 1 - x + y < 2) || (x < 2 && y > H - 3 && chip[2]) || (x > W - 3 && y > H - 3 && chip[3]);
          if (c0) continue;
          let k = brickK * (0.93 + r() * 0.12);
          // relevo: quina de cima e da esquerda iluminadas, de baixo e da direita na sombra
          if (y === 0) k *= sag ? 1.02 : 1.3;
          else if (y === 1) k *= sag ? 1 : 1.12;
          if (y === H - 1) k *= 0.62;
          else if (y === H - 2) k *= 0.82;
          if (x === 0) k *= 1.12;
          if (x === W - 1) k *= 0.74;
          // a face do tijolo é levemente abaulada: mais clara no terço de cima
          k *= 1.04 - (y / H) * 0.1;
          // umidade/fuligem que escorre (manchas grandes, contínuas entre tijolos)
          k *= 0.9 + damp(cx, cy) * 0.18;
          // poros e grãos claros
          const g = r();
          if (g < 0.03) k *= 0.72;
          else if (g > 0.985) k *= 1.2;
          p.set(cx, cy, base, k);
        }
      }
      if (r() < 0.25) crack(p, r, x0 + 4 + Math.floor(r() * (W - 8)), y0 + 1, 6 + Math.floor(r() * 7));
      // musgo no topo dos tijolos (só no tema úmido)
      if (th === THEMES.moss && r() < 0.45) {
        for (let x = 2; x < W - 2; x++) if (r() < 0.55) p.set(x0 + 1 + x, y0 + 1 + (r() < 0.6 ? 0 : 1), hex('#4a8a4e'), 0.75 + r() * 0.45);
      }
    }
  }
  p.put(ctx);
}

export function brickTexture(repeat: [number, number], tint = 1, seed = 11, theme = 'crypt') {
  const { c, ctx } = canvas(TS);
  drawBricks(ctx, tint, seed, THEMES[theme]);
  return toTexture(c, repeat);
}

// o piso: lajes de 0,6 m (2×2 por ladrilho), cada uma com o seu tom, quinas gastas, desgaste no meio, rachaduras e terra nas juntas
export function floorTexture(repeat: [number, number], theme = 'crypt') {
  const { c, ctx } = canvas(TS);
  const r = rng(5);
  const th = THEMES[theme];
  const p = new Pix(TS, TS);
  const gap = hex(th.floorGap);
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) p.set(x, y, gap, 0.85 + r() * 0.35);
  const wear = blotch(r, 4);
  const S = TS / 2;
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      const base = th.floor[Math.floor(r() * th.floor.length)];
      const slabK = 0.82 + r() * 0.3;
      const worn = r() < 0.5;
      const L = S - 2;
      for (let y = 0; y < L; y++) {
        for (let x = 0; x < L; x++) {
          const corner = (x === 0 || x === L - 1) && (y === 0 || y === L - 1);
          if (corner && r() < 0.7) continue;
          const cx = tx * S + 1 + x;
          const cy = ty * S + 1 + y;
          let k = slabK * (0.94 + r() * 0.1);
          if (y === 0) k *= 1.2;
          if (x === 0) k *= 1.12;
          if (y === L - 1) k *= 0.72;
          if (x === L - 1) k *= 0.8;
          // pisoteado: o meio da laje fica mais liso e claro
          if (worn) {
            const dx = (x - L / 2) / (L / 2);
            const dy = (y - L / 2) / (L / 2);
            k *= 1 + Math.max(0, 1 - dx * dx - dy * dy) * 0.1;
          }
          k *= 0.92 + wear(cx, cy) * 0.14;
          const g = r();
          if (g < 0.025) k *= 0.74;
          else if (g > 0.988) k *= 1.18;
          p.set(cx, cy, base, k);
        }
      }
      if (r() < 0.4) crack(p, r, tx * S + 5 + Math.floor(r() * (L - 10)), ty * S + 3, 10 + Math.floor(r() * 12), 0.5);
    }
  }
  p.put(ctx);
  return toTexture(c, repeat);
}

// PEDRA LAVRADA (pisos de degrau, capas de mureta, peitoris): lajes grandes e lisas, mais claras que o tijolo, com veios e poros.
// Repete em metros (1 ladrilho = 1,2 m): duas fiadas de lajes por ladrilho, juntas finas.
export function slabTexture(repeat: [number, number], theme = 'crypt') {
  const { c, ctx } = canvas(TS);
  const r = rng(29);
  const th = THEMES[theme];
  const p = new Pix(TS, TS);
  p.fill(hex(th.mortar));
  const cloud = blotch(r, 4);
  const S = TS / 2;
  for (let sy = 0; sy < 2; sy++) {
    const base = th.stone[Math.floor(r() * th.stone.length)];
    const k0 = 1.2 + r() * 0.12;
    const off = sy ? 19 : 0;
    for (let y = 0; y < S - 1; y++) {
      for (let x = 0; x < TS; x++) {
        if ((x + off) % TS === TS - 1) continue; // a junta entre lajes
        let k = k0 * (0.95 + r() * 0.07);
        if (y === 0) k *= 1.12;
        if (y === S - 2) k *= 0.8;
        k *= 0.92 + cloud(x, sy * S + y) * 0.16;
        if (r() < 0.02) k *= 0.8;
        p.set(x, sy * S + y, base, k);
      }
    }
    // um veio fino e claro atravessando a laje
    let vx = Math.floor(r() * TS);
    for (let y = 3; y < S - 4; y++) {
      if (r() < 0.7) p.mul(vx, sy * S + y, 1.14);
      vx += r() < 0.5 ? 1 : 0;
    }
  }
  p.put(ctx);
  return toTexture(c, repeat);
}

export function woodTexture(repeat: [number, number]) {
  const { c, ctx } = canvas(32);
  const r = rng(21);
  const woods: RGB[] = [hex('#6b4527'), hex('#7a5030'), hex('#5a3a20'), hex('#704a2b')];
  for (let p = 0; p < 4; p++) {
    const base = woods[p % woods.length];
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 8; x++) {
        let k = 0.95 + r() * 0.08 + (y % 7 === 0 ? -0.1 : 0);
        if (x === 0) k *= 0.6;
        if (x === 1) k *= 1.12;
        px(ctx, p * 8 + x, y, shade(base, k));
      }
    }
  }
  for (const y0 of [5, 23]) {
    for (let y = 0; y < 4; y++) for (let x = 0; x < 32; x++) px(ctx, x, y0 + y, y === 0 ? '#4a4a58' : y === 3 ? '#1c1c24' : '#2f2f3a');
    for (let x = 3; x < 32; x += 8) px(ctx, x, y0 + 1, '#9a9aaa', 2, 2);
  }
  return toTexture(c, repeat);
}

export function plateTexture() {
  const { c, ctx } = canvas(32);
  const r = rng(7);
  const base = hex('#6a625e');
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      let k = 0.92 + r() * 0.14;
      const edge = Math.min(x, y, 31 - x, 31 - y);
      if (edge < 2) k *= x + y < 32 ? 1.25 : 0.6;
      px(ctx, x, y, shade(base, k));
    }
  }
  // anel + ponto entalhados
  ctx.strokeStyle = '#2a2523';
  ctx.lineWidth = 2;
  for (let a = 0; a < 360; a += 6) {
    const rad = (a * Math.PI) / 180;
    px(ctx, Math.round(16 + Math.cos(rad) * 9), Math.round(16 + Math.sin(rad) * 9), '#2a2523', 2, 2);
  }
  px(ctx, 14, 14, '#2a2523', 4, 4);
  return toTexture(c, undefined, false, true);
}

export function crackTexture() {
  const { c, ctx } = canvas(32);
  const r = rng(3);
  let x = 4;
  let y = 16;
  for (let i = 0; i < 40; i++) {
    px(ctx, x, y, '#120f0e', 2, 2);
    x += 1;
    y += Math.floor(r() * 3) - 1;
    if (r() < 0.12) {
      let bx = x;
      let by = y;
      for (let j = 0; j < 6; j++) {
        bx += 1;
        by += r() < 0.5 ? -1 : 1;
        px(ctx, bx, by, '#120f0e', 1, 1);
      }
    }
  }
  return toTexture(c, undefined, false, true);
}

export function runeTexture() {
  const { c, ctx } = canvas(24);
  const col = '#ff4d6d';
  for (let a = 0; a < 360; a += 8) {
    const rad = (a * Math.PI) / 180;
    px(ctx, Math.round(12 + Math.cos(rad) * 10), Math.round(12 + Math.sin(rad) * 10), col);
  }
  for (let a = 0; a < 360; a += 10) {
    const rad = (a * Math.PI) / 180;
    px(ctx, Math.round(12 + Math.cos(rad) * 6), Math.round(12 + Math.sin(rad) * 6), '#ff9aa8');
  }
  for (let i = 4; i < 20; i++) {
    px(ctx, i, 12, col);
    px(ctx, 12, i, col);
  }
  px(ctx, 11, 11, '#ffd0d8', 3, 3);
  return toTexture(c, undefined, false, true);
}

export function gemTexture() {
  const { c, ctx } = canvas(16);
  const rows = [2, 4, 6, 8, 10, 10, 8, 6, 4, 2];
  rows.forEach((w, i) => {
    const x0 = 8 - w / 2;
    for (let x = 0; x < w; x++) {
      const light = x < w / 3 ? '#b9fbff' : x > (w * 2) / 3 ? '#2ab8d6' : '#6ff0ff';
      px(ctx, x0 + x, 3 + i, light);
    }
  });
  px(ctx, 6, 5, '#ffffff', 2, 1);
  return toTexture(c, undefined, false);
}

export function sparkTexture() {
  const { c, ctx } = canvas(8);
  px(ctx, 3, 0, '#d8ffff', 2, 8);
  px(ctx, 0, 3, '#d8ffff', 8, 2);
  px(ctx, 2, 2, '#ffffff', 4, 4);
  return toTexture(c, undefined, false);
}

// A CHAMA (DESIGN.md §97): 8 quadros em laço. O pé da chama é o mais quente (um miolo branco-amarelo), o corpo laranja e as pontas vermelhas;
// o corpo balança e afina, as línguas sobem tortas, e de vez em quando uma ponta se solta e some no alto. (Antes eram 3 quadros de 10 × 8,
// com o amarelo em cima e o vermelho embaixo: ao contrário de um fogo de verdade.) Dois tamanhos: a ALTA (12 × 18, tochas e braseiros) e a
// BAIXA (12 × 10, o mesmo jeito da de antes: chaminhas de lampião, soquetes e o fogo que corre nas canaletas, que já têm o tamanho medido).
export const FLAME_W = 12;
export const FLAME_H = 18;
export function flameFrames(W = 12, H = 10): THREE.CanvasTexture[] {
  const N = 8;
  const out: THREE.CanvasTexture[] = [];
  for (let k = 0; k < N; k++) {
    const tau = (k / N) * Math.PI * 2;
    const { c, ctx } = canvas(W, H);
    const tipLift = 0.5 + 0.5 * Math.sin(tau * 2 + 0.7); // a ponta estica e encolhe
    for (let y = 0; y < H; y++) {
      const h = (H - 1 - y) / (H - 1); // 0 no pé, 1 no alto
      // a largura: pé arredondado, o corpo mais largo um pouco acima do pé, e a ponta fina (mais alta ou mais baixa em cada quadro)
      const top = 0.78 + 0.16 * tipLift;
      if (h > top) continue;
      const u = h / top;
      let hw = 4.9 * Math.pow(1 - u, 0.75) * (u < 0.18 ? 0.72 + u * 1.55 : 1);
      hw *= 1 + 0.13 * Math.sin(tau * 3 + h * 7.5) + 0.06 * Math.sin(tau * 5 + h * 13);
      // o corpo balança, mais em cima que embaixo
      const cx = (W - 1) / 2 + Math.sin(tau + h * 3.4) * h * 1.7 + Math.sin(tau * 2 + h * 6) * h * 0.55;
      for (let x = 0; x < W; x++) {
        const d = Math.abs(x - cx) / Math.max(0.6, hw);
        if (d > 1) continue;
        // o calor: maior no pé e no meio
        const heat = (1 - d * 0.85) * (1 - u * 0.95) + (u < 0.25 ? 0.15 : 0);
        px(ctx, x, y, heat > 0.72 ? '#fff6d0' : heat > 0.5 ? '#ffd45a' : heat > 0.27 ? '#ff9a2c' : u > 0.55 ? '#d9441a' : '#f26a1e');
      }
    }
    // a língua que se solta: em metade dos quadros, um fiapo acima da ponta, subindo e sumindo
    const free = Math.sin(tau * 2 - 0.4);
    if (free > 0.15) {
      const fy = Math.round(H * (0.1 - free * 0.08));
      const fx = Math.round((W - 1) / 2 + Math.sin(tau + 2.4) * 2.2);
      px(ctx, fx, Math.max(0, fy), free > 0.7 ? '#ff9a2c' : '#d9441a');
      if (free > 0.45) px(ctx, fx, Math.max(0, fy + 1), '#d9441a');
    }
    out.push(toTexture(c, undefined, false));
  }
  return out;
}

// o BRILHO no ar em volta de uma chama (não na parede): um disco quente e macio, em degraus pontilhados, somado por cima (DESIGN.md §97)
export function flameGlowTexture() {
  const { c, ctx } = canvas(24);
  for (let y = 0; y < 24; y++)
    for (let x = 0; x < 24; x++) {
      const d = Math.hypot(x - 11.5, (y - 12.5) * 0.9) / 11.5;
      if (d >= 1) continue;
      const k = (1 - d) ** 2.2;
      const lvl = Math.floor(k * 4 + dith(x, y)) / 4;
      if (lvl <= 0) continue;
      ctx.fillStyle = `rgba(255,${Math.round(140 + 70 * lvl)},${Math.round(60 + 50 * lvl)},${lvl})`;
      ctx.fillRect(x, y, 1, 1);
    }
  return toTexture(c, undefined, false, false);
}

const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

const GEM_POS = [17, 32, 47];

// A MARCA de cada face no lugar das gemas (decisão do jogador): o GLIFO do efeito (3 Fogo = ACENDER...), só quando o jogador já viu a palavra; antes disso, uma marca
// apagada. O número continua como `n` pontinhos na borda de baixo. `faceMarks` é preenchido pelo motor (scene.ts) a partir do diário.
export const faceMarks: Record<number, GlyphDef | 'blank'> = {};
function drawFaceMark(ctx: CanvasRenderingContext2D, n: number, accent: string, locked: boolean, glow: boolean) {
  const mark = faceMarks[n] ?? 'blank';
  const col = locked ? '#5a5270' : accent;
  if (mark === 'blank') {
    // marca apagada: losango de contorno, quase sumido (a palavra ainda não foi vista)
    const dim = glow ? '#2c2640' : '#4a4066';
    for (let k = 0; k < 2; k++) {
      const r = 15 - k * 3;
      for (let t = -r; t <= r; t++) {
        const a = r - Math.abs(t);
        px(ctx, 32 + t, 32 - a, dim);
        px(ctx, 32 + t, 32 + a, dim);
      }
    }
  } else {
    const size = 44;
    if (!glow) {
      // sulco escuro em volta e o glifo em ouro por cima (como na parede)
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) drawGlyph(ctx, mark, 32 + dx, 32 + dy, size, '#0a0710');
      drawGlyph(ctx, mark, 32, 32, size, '#f0d078');
    } else drawGlyph(ctx, mark, 32, 32, size, col);
  }
  // o número, em pontinhos pequenos na borda de baixo
  const x0 = 32 - ((n - 1) * 4) / 2;
  for (let i = 0; i < n; i++) px(ctx, Math.round(x0 + i * 4), 52, glow ? shade(hex(col), 1.3) : '#d4ac4e', 2, 2);
}

export function dieFaceCanvas(n: number, accent: string, locked = false, gems = true): HTMLCanvasElement {
  const { c, ctx } = canvas(64);
  const r = rng(40 + n);
  const body = hex('#2a2140');
  const gold = hex('#d4ac4e');
  // obsidiana com veios claros e algumas rachaduras finas
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const vein = Math.sin((x + y * 0.7 + n * 5) * 0.32) * Math.sin((x * 0.6 - y) * 0.2 + n) > 0.6 ? 1.35 : 1;
      px(ctx, x, y, shade(body, (0.9 + r() * 0.14) * vein));
    }
  }
  for (let k = 0; k < 3; k++) {
    let x = Math.floor(r() * 56) + 4;
    let y = Math.floor(r() * 56) + 4;
    for (let i = 0; i < 12; i++) {
      px(ctx, x, y, shade(body, 0.45));
      x += r() < 0.5 ? 1 : 0;
      y += r() < 0.5 ? 1 : 0;
    }
  }
  // faixa externa escura: cai sobre a quina arredondada
  for (let i = 0; i < 5; i++) {
    const k = 0.4 + i * 0.1;
    rect(ctx, i, i, 64 - i * 2, 1, shade(body, k));
    rect(ctx, i, 63 - i, 64 - i * 2, 1, shade(body, k));
    rect(ctx, i, i, 1, 64 - i * 2, shade(body, k));
    rect(ctx, 63 - i, i, 1, 64 - i * 2, shade(body, k));
  }
  // filete dourado duplo (com brilho em cima/esquerda e sombra embaixo/direita)
  const lo = 8;
  const hi = 55;
  for (const [o, k] of [[0, 1], [3, 0.6]] as [number, number][]) {
    const a = lo + o;
    const b = hi - o;
    rect(ctx, a, a, b - a + 1, 1, shade(gold, 1.3 * k + (k < 1 ? 0.1 : 0)));
    rect(ctx, a, a, 1, b - a + 1, shade(gold, 1.15 * k));
    rect(ctx, a, b, b - a + 1, 1, shade(gold, 0.6 * k));
    rect(ctx, b, a, 1, b - a + 1, shade(gold, 0.7 * k));
  }
  // cantos: rebites dourados em losango
  for (const [cx, cy] of [[lo, lo], [hi, lo], [lo, hi], [hi, hi]]) {
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const d = Math.abs(dx) + Math.abs(dy);
      if (d <= 3) px(ctx, cx + dx, cy + dy, shade(gold, d <= 1 ? 1.45 : d === 2 ? 1.1 : 0.7));
    }
  }
  // entalhes no meio de cada lado
  for (const t of [28, 35]) {
    px(ctx, t, lo - 3, shade(gold, 0.8), 1, 3);
    px(ctx, t, hi + 1, shade(gold, 0.8), 1, 3);
    px(ctx, lo - 3, t, shade(gold, 0.8), 3, 1);
    px(ctx, hi + 1, t, shade(gold, 0.8), 3, 1);
  }
  // moldura interna ENTALHADA (pontilhada) e cantoneiras: mais detalhe na pedra, sem disputar com o rosto
  for (let i = 15; i <= 48; i += 2) {
    px(ctx, i, 14, shade(body, 1.55));
    px(ctx, i, 49, shade(body, 0.6));
    px(ctx, 14, i, shade(body, 1.4));
    px(ctx, 49, i, shade(body, 0.65));
  }
  for (const [cx, cy, sx, sy] of [[14, 14, 1, 1], [49, 14, -1, 1], [14, 49, 1, -1], [49, 49, -1, -1]] as [number, number, number, number][]) {
    for (let k = 0; k < 4; k++) {
      px(ctx, cx + sx * k, cy, shade(gold, 0.75));
      px(ctx, cx, cy + sy * k, shade(gold, 0.75));
    }
  }
  // runas fininhas entre o filete e as gemas
  for (let i = 0; i < 10; i++) {
    const x = 14 + Math.floor(r() * 36);
    const y = 14 + Math.floor(r() * 36);
    const near = PIPS[n].some(([gx, gy]) => Math.abs(GEM_POS[gx] - x) < 11 && Math.abs(GEM_POS[gy] - y) < 11);
    if (!near) px(ctx, x, y, shade(body, 1.7), 1, 3);
  }
  if (gems) drawFaceMark(ctx, n, accent, locked, false);
  return c;
}

export function dieGlowCanvas(n: number, accent: string, locked = false, gems = true): HTMLCanvasElement {
  const { c, ctx } = canvas(64);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 64, 64);
  if (gems) drawFaceMark(ctx, n, accent, locked, true);
  return c;
}

// ── mistura pontilhada (padrão de Bayer, no clima do dithering do jogo) entre duas versões de uma face do dado ──
const BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
function ditherBlend(baseFace: HTMLCanvasElement, otherFace: HTMLCanvasElement, baseGlow: HTMLCanvasElement, otherGlow: HTMLCanvasElement) {
  const pix = (c: HTMLCanvasElement) => c.getContext('2d')!.getImageData(0, 0, 64, 64).data;
  const bF = pix(baseFace);
  let oF = pix(otherFace);
  const bG = pix(baseGlow);
  let oG = pix(otherGlow);
  let curP = 0;
  const mk = () => {
    const { c, ctx } = canvas(64);
    return { c, ctx, img: ctx.createImageData(64, 64), tex: toTexture(c, undefined, false) };
  };
  const face = mk();
  const glow = mk();
  const compose = (o: ReturnType<typeof mk>, a: Uint8ClampedArray, b: Uint8ClampedArray, p: number) => {
    const d = o.img.data;
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const i = (y * 64 + x) * 4;
        const src = p * 64 > BAYER[(y & 7) * 8 + (x & 7)] ? b : a;
        d[i] = src[i];
        d[i + 1] = src[i + 1];
        d[i + 2] = src[i + 2];
        d[i + 3] = 255;
      }
    }
    o.ctx.putImageData(o.img, 0, 0);
    o.tex.needsUpdate = true;
  };
  // `set(p)`: p de 0 (face normal) a 1 (a outra versão)
  const set = (p: number) => {
    curP = p;
    compose(face, bF, oF, p);
    compose(glow, bG, oG, p);
  };
  // troca a "outra" versão (o rosto olhando para outro lado) e recompõe com o mesmo p
  const setOther = (of: HTMLCanvasElement, og: HTMLCanvasElement) => {
    oF = pix(of);
    oG = pix(og);
    set(curP);
  };
  set(0);
  return { map: face.tex, glow: glow.tex, set, setOther, dispose: () => { face.tex.dispose(); glow.tex.dispose(); } };
}

// A face do dado mostrando o rabisco de uma palavra: o dado "traduz" o glifo que o jogador olha.
function sketchInset(base: HTMLCanvasElement, kind: SketchKind, glow: boolean) {
  const g = base.getContext('2d')!;
  g.fillStyle = glow ? '#000' : '#17111f';
  g.fillRect(12, 12, 40, 40); // dentro do segundo filete de ouro
  g.imageSmoothingEnabled = false;
  g.drawImage(sketchCanvas(kind, 8, 40), 12, 12);
  return base;
}
export function dieSketchBlend(n: number, accent: string, locked: boolean, kind: SketchKind) {
  return ditherBlend(dieFaceCanvas(n, accent, locked), sketchInset(dieFaceCanvas(n, accent, locked), kind, false), dieGlowCanvas(n, accent, locked), sketchInset(dieGlowCanvas(n, accent, locked), kind, true));
}

// ── O ROSTO de cada número, feito de TRAÇOS (decisão do jogador: parecido com os glifos da língua) ─────────────────────────────────────
// O dado é vivo: a face virada para o JOGADOR (a de baixo, que ele vê de frente) vira um rosto sério e abstrato, desenhado como um glifo: olhos (pontos
// que brilham na cor da face), uma testa (sobrancelhas), um nariz e uma boca, tudo em linhas finas de ouro. O número aparece como `n` pontinhos na testa.
// A afeição é NEUTRA e igual em todos os números (só mudam a cor dos olhos e os pontinhos).
export interface RostoLook {
  ex: number; // deslocamento dos olhos (px da face): -4..4
  ey: number; // -3..3 (+ = para baixo)
  by: number; // sobrancelhas: -3..3 (+ = para baixo)
  closed: boolean; // olhos fechados (piscar, cochilo)
  // o rosto vivo (sempre NEUTRO: a boca é sempre reta, nunca sorri nem entristece)
  mo?: number; // abertura da boca em px: 0..4 (fenda reta)
  mx?: number; // a boca desliza para o lado: -2..2 px
  mw?: number; // largura: -3 (apertada) .. 1 (relaxada) px de cada lado
  sq?: number; // pálpebra de cima descendo: 0..3 px
  nose?: boolean; // narinas abertas
  bl?: number; // cada sobrancelha sobe (+) ou desce por conta própria: -2..2 px (sempre RETA: só sobe e desce, nunca inclina)
  br?: number;
  sd?: number; // olhar de canto: as íris vão ao canto (-4..4 px) sem o rosto acompanhar
  ir?: number; // a íris se fecha (luz forte): -1..0 px no raio
}
const NO_LOOK: RostoLook = { ex: 0, ey: 0, by: 0, closed: false };
function tracos(ctx: CanvasRenderingContext2D, n: number, glow: boolean, accent: string, look: RostoLook = NO_LOOK) {
  const gold = glow ? '#d09a34' : '#f0c868';
  const dark = glow ? '#000' : '#0a0710';
  const base = hex(accent);
  const eyeC = glow ? shade(base, 1.7) : shade(base, 1.25);
  const px1 = (x: number, y: number, color = gold) => px(ctx, Math.round(x), Math.round(y), color);
  const seg = (x0: number, y0: number, x1: number, y1: number, th = 1, color = gold) => {
    const st = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= st; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / st);
      const y = Math.round(y0 + ((y1 - y0) * i) / st);
      px(ctx, x, y, color, 1, th);
    }
  };
  const poly = (pts: number[][], ox: number, oy: number, th = 1, color = gold) => {
    for (let i = 1; i < pts.length; i++) seg(ox + pts[i - 1][0], oy + pts[i - 1][1], ox + pts[i][0], oy + pts[i][1], th, color);
  };
  const fx = Math.round(look.ex * 0.55); // o nariz, a boca e as pálpebras acompanham o olhar menos que as íris (o rosto "vira")
  const fy = Math.round(look.ey * 0.55);
  // OLHO: pálpebras em amêndoa (traços de ouro, presas ao rosto) e, dentro, a íris-losango da cor da face, com pupila; a íris se move dentro das pálpebras
  const EYE_UP = [[-8, 0], [-6, -3], [-3, -5], [3, -5], [6, -3], [8, 0]];
  const EYE_DN = [[-8, 0], [-6, 2], [-3, 4], [3, 4], [6, 2], [8, 0]];
  const EYE_SHUT = [[-8, 0], [-5, 1], [5, 1], [8, 0]];
  const eye = (cx: number, cy: number) => {
    const lx = cx + fx;
    const ly = cy + fy;
    if (look.closed) {
      poly(EYE_SHUT, lx, ly, 1);
      poly([[-6, 3], [6, 3]], lx, ly, 1, shade(hex('#f0c868'), glow ? 0.35 : 0.55)); // cílios de baixo, apagados
      return;
    }
    const sq = Math.max(0, Math.min(3, Math.round(look.sq ?? 0)));
    // a pálpebra de cima desce sq px (só no meio; as pontas ficam presas no canto do olho)
    const up = EYE_UP.map(([x, y]) => [x, y < 0 ? Math.min(-1, y + Math.round(sq * 1.5 * (1 - Math.abs(x) / 10))) : y]);
    poly(up, lx, ly);
    poly(EYE_DN, lx, ly);
    const lidAt = (x: number) => {
      // altura da pálpebra de cima nesta coluna (interpolada)
      for (let k = 1; k < up.length; k++) {
        const [x0, y0] = up[k - 1];
        const [x1, y1] = up[k];
        if (x >= x0 && x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1);
      }
      return 0;
    };
    const ix = lx + Math.max(-4, Math.min(4, look.ex - fx * 0.5 + Math.sign(look.ex) * 1 + Math.round(look.sd ?? 0)));
    const iy = ly + Math.max(-1, Math.min(1, look.ey - fy));
    const r = 3 + Math.max(-1, Math.min(0, Math.round(look.ir ?? 0)));
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++) {
        const d = Math.abs(x) + Math.abs(y);
        if (d <= r && iy + y - ly > lidAt(ix + x - lx)) px1(ix + x, iy + y, d === r ? eyeC : glow ? '#ffffff' : shade(base, 1.7));
      }
    if (!glow && iy - ly > lidAt(ix - lx)) px1(ix, iy, dark); // pupila
    if (iy - 1 - ly > lidAt(ix - 1 - lx)) px1(ix - 1, iy - 1, glow ? '#ffffff' : '#fff4d8'); // brilho
  };
  // o número: n pontinhos na testa
  const x0t = 32 - ((n - 1) * 5) / 2;
  for (let i = 0; i < n; i++) {
    px1(x0t + i * 5, 9);
    px1(x0t + i * 5 + 1, 9);
    px1(x0t + i * 5, 10);
    px1(x0t + i * 5 + 1, 10);
  }
  // TODOS os rostos têm a MESMA afeição neutra (decisão do jogador): o que muda de um número para outro é só a cor das íris e os pontinhos na testa.
  eye(20, 29);
  eye(44, 29);
  // sobrancelhas: um arco leve, com um risquinho na ponta de dentro (como a serifa de um glifo)
  const byL = look.by - Math.max(-2, Math.min(2, Math.round(look.bl ?? 0)));
  const byR = look.by - Math.max(-2, Math.min(2, Math.round(look.br ?? 0)));
  poly([[0, 3], [3, 1], [6, 0], [15, 0]], 11 + fx, 16 + byL);
  px1(26 + fx, 17 + byL);
  poly([[0, 0], [9, 0], [12, 1], [15, 3]], 38 + fx, 16 + byR);
  px1(38 + fx, 17 + byR);
  // nariz: a ponte desce do meio das sobrancelhas; a base com as narinas
  seg(32 + fx, 21 + fy, 32 + fx, 40 + fy);
  seg(30 + fx, 41 + fy, 34 + fx, 41 + fy);
  if (look.nose) {
    // fungada: as narinas abrem um pixel para fora e sobem
    px1(28 + fx, 41 + fy);
    px1(36 + fx, 41 + fy);
    px1(28 + fx, 42 + fy);
    px1(36 + fx, 42 + fy);
  } else {
    px1(29 + fx, 42 + fy);
    px1(35 + fx, 42 + fy);
  }
  // marcas nas maçãs do rosto (dois pontos, como uma inscrição)
  const faint = shade(hex('#f0c868'), glow ? 0.45 : 0.75);
  for (const x of [12, 52]) {
    px1(x + fx, 37 + fy, faint);
    px1(x + fx, 40 + fy, faint);
  }
  // boca RETA com as pontas marcadas, e o queixo. Ela mexe (abre como fenda, aperta, desliza para o lado), mas as linhas ficam sempre retas:
  // a expressão nunca sai do neutro
  const mo = Math.max(0, Math.min(4, Math.round(look.mo ?? 0)));
  const mx = fx + Math.max(-2, Math.min(2, Math.round(look.mx ?? 0)));
  const mw = Math.max(-3, Math.min(1, Math.round(look.mw ?? 0))) - (mo >= 3 ? 1 : 0); // aberta demais, ela estreita um pouco
  const a = 24 - mw + mx;
  const b = 40 + mw + mx;
  const top = 50 + fy - (mo >= 2 ? 1 : 0); // o lábio de cima sobe um pouco quando a boca abre bem
  const bot = top + mo + (mo > 0 ? 1 : 0); // sempre uma fresta escura entre os lábios
  seg(a, top, b, top);
  if (mo > 0) {
    // o vão da boca (escuro) e o lábio de baixo
    for (let y = top + 1; y < bot; y++) seg(a + 1, y, b - 1, y, 1, glow ? '#000' : '#05030a');
    seg(a + 1, bot, b - 1, bot);
    seg(a, top, a, bot);
    seg(b, top, b, bot);
  } else {
    px1(a - 1, top + 1);
    px1(b + 1, top + 1);
  }
  seg(30 + mx, 54 + fy + Math.max(0, mo - 2), 34 + mx, 54 + fy + Math.max(0, mo - 2), 1, faint); // o queixo desce com a boca bem aberta
}

// gira o conteúdo de uma face em múltiplos de 90° (sentido horário): as faces laterais do dado podem aparecer deitadas na tela, e o rosto precisa ficar de pé
function turned(c: HTMLCanvasElement, turn: number): HTMLCanvasElement {
  const t = ((turn % 4) + 4) % 4;
  if (t === 0) return c;
  const { c: o, ctx } = canvas(64);
  ctx.translate(32, 32);
  ctx.rotate((t * Math.PI) / 2);
  ctx.drawImage(c, -32, -32);
  return o;
}
export function dieRostoCanvas(n: number, accent: string, locked: boolean, turn = 0, look: RostoLook = NO_LOOK) {
  // a face SEM as gemas (o rosto as substitui): obsidiana, filete dourado e rebites; o número fica nos pontinhos da testa
  const face = dieFaceCanvas(n, accent, locked, false);
  const glow = dieGlowCanvas(n, accent, locked, false);
  const col = locked ? '#5a5270' : accent;
  tracos(face.getContext('2d')!, n, false, col, look);
  tracos(glow.getContext('2d')!, n, true, col, look);
  return { face: turned(face, turn), glow: turned(glow, turn) };
}
// mistura da face normal (gemas) com o rosto: `set(p)` de 0 a 1. `turn`: giros de 90° para o rosto ficar de pé na tela (a face base gira junto)
export function dieRostoBlend(n: number, accent: string, locked: boolean, turn = 0) {
  const r = dieRostoCanvas(n, accent, locked, turn);
  const b = ditherBlend(turned(dieFaceCanvas(n, accent, locked), turn), r.face, turned(dieGlowCanvas(n, accent, locked), turn), r.glow);
  // o rosto olhando para outro lado (olhos e sobrancelhas mexem)
  const setLook = (look: RostoLook) => {
    const o = dieRostoCanvas(n, accent, locked, turn, look);
    b.setOther(o.face, o.glow);
  };
  return { ...b, setLook };
}

export function dieFaceTexture(n: number, accent: string, locked: boolean) {
  return toTexture(dieFaceCanvas(n, accent, locked), undefined, false);
}

export function dieGlowTexture(n: number, accent: string, locked: boolean) {
  return toTexture(dieGlowCanvas(n, accent, locked), undefined, false);
}

// ── porta: tábuas de madeira com cintas de ferro e um medalhão no centro ─────
// Desenhada em 48x64 e esticada na laje em forma de arco (1,9 x 2,65 m).
export function doorTexture() {
  const { c, ctx } = canvas(48, 64);
  const r = rng(77);
  const woods: RGB[] = [hex('#7a5030'), hex('#6b4527'), hex('#85583a'), hex('#5f3d22')];
  for (let p = 0; p < 6; p++) {
    const base = woods[p % woods.length];
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 8; x++) {
        let k = 0.97 + r() * 0.05;
        if (x === 0) k *= 0.55;
        else if (x === 1) k *= 1.14;
        else if (x === 7) k *= 0.85;
        if ((y + p * 11) % 17 === 0 && x > 1 && x < 6) k *= 0.82; // veio
        px(ctx, p * 8 + x, y, shade(base, k));
      }
    }
  }
  // cintas de ferro com rebites
  for (const y0 of [12, 44]) {
    rect(ctx, 0, y0, 48, 1, '#6a6a7e');
    rect(ctx, 0, y0 + 1, 48, 4, '#3a3a48');
    rect(ctx, 0, y0 + 5, 48, 1, '#1a1a22');
    for (let x = 3; x < 48; x += 8) rect(ctx, x, y0 + 2, 2, 2, '#9a9ab0');
    // ponta da cinta (dobradiça) à esquerda
    rect(ctx, 0, y0 - 2, 5, 9, '#3a3a48');
    rect(ctx, 0, y0 - 2, 5, 1, '#6a6a7e');
    rect(ctx, 1, y0 + 2, 2, 2, '#9a9ab0');
  }
  // medalhão de ferro no centro (onde brilha a runa)
  const cx = 24;
  const cy = 30;
  for (let y = -11; y <= 11; y++) {
    for (let x = -11; x <= 11; x++) {
      const d = Math.hypot(x, y);
      if (d > 11) continue;
      const rim = d > 9.2;
      const k = rim ? (x + y < 0 ? 1.5 : 0.5) : 0.7 + (x + y < 0 ? 0.08 : 0);
      px(ctx, cx + x, cy + y, shade(hex('#4a4a5c'), k));
    }
  }
  return toTexture(c, undefined, false, true);
}

// ── pedra-sabão ──────────────────────────────────────────────────────────────
// Um bastão verde-acinzentado e macio, com a ponta de escrever coberta de pó
// branco. `long` = sentido do comprimento (para esticar certo nas faces do bloco).
export function soapSideTexture(horizontal: boolean) {
  const L = 48;
  const S = 16;
  const { c, ctx } = canvas(horizontal ? L : S, horizontal ? S : L);
  const r = rng(horizontal ? 91 : 92);
  const base = hex('#7f958c');
  for (let a = 0; a < L; a++) {
    for (let b = 0; b < S; b++) {
      const x = horizontal ? a : b;
      const y = horizontal ? b : a;
      // a = posição ao longo do bastão (0 = ponta de trás, L-1 = ponta de escrever)
      let k = 0.93 + r() * 0.08;
      const edge = Math.min(b, S - 1 - b);
      if (edge === 0) k *= 0.72;
      else if (b < S / 2 && edge <= 2) k *= 1.14; // brilho de um lado
      else if (b >= S / 2 && edge <= 1) k *= 0.88;
      // veios e manchinhas
      if (Math.sin(a * 0.5 + b * 0.9) * Math.sin(a * 0.22 - b * 0.45) > 0.65) k *= 0.8;
      if (r() < 0.04) k *= 1.25;
      let col = shade(base, k);
      // pó branco perto da ponta de escrever
      const dust = a > L - 12 ? (a - (L - 12)) / 12 : 0;
      if (dust > 0 && r() < dust * 0.9) col = shade(hex('#e9f0e6'), 0.9 + r() * 0.1);
      px(ctx, x, y, col);
    }
  }
  // riscos e marcas de uso
  for (let i = 0; i < 3; i++) {
    const a0 = 6 + Math.floor(r() * 30);
    const b0 = 3 + Math.floor(r() * 10);
    for (let j = 0; j < 5; j++) px(ctx, horizontal ? a0 + j : b0, horizontal ? b0 : a0 + j, shade(base, 0.62));
  }
  return toTexture(c, undefined, false);
}

export function soapTipTexture(writing: boolean) {
  const { c, ctx } = canvas(16);
  const r = rng(writing ? 93 : 94);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      let col: string;
      if (writing) {
        col = shade(hex('#eef3ea'), 0.9 + r() * 0.12);
        if (d > 6.2) col = shade(hex('#b9c8bf'), 0.95 + r() * 0.08);
        else if (d > 3 && (x + y) % 5 === 0) col = shade(hex('#cdd9d0'), 1);
      } else {
        col = shade(hex('#7f958c'), 0.85 + r() * 0.12);
        if (d > 6.2) col = shade(hex('#5e7068'), 0.95);
      }
      px(ctx, x, y, col);
    }
  }
  return toTexture(c, undefined, false);
}

// faixa de pano enrolada no meio do giz (pra segurar sem sujar a mão)
export function soapWrapTexture() {
  const { c, ctx } = canvas(16);
  const r = rng(95);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const stripe = (x + y) % 6 < 3;
      px(ctx, x, y, shade(hex(stripe ? '#9a3a3a' : '#7a2a30'), 0.9 + r() * 0.15));
    }
  }
  rect(ctx, 0, 0, 16, 1, '#4a1a20');
  rect(ctx, 0, 15, 16, 1, '#4a1a20');
  return toTexture(c, undefined, false);
}

// Símbolos de giz que o jogador deixa nas paredes e no chão (16x16).
export const MARK_COUNT = 5;
export function markTexture(kind: number) {
  const { c, ctx } = canvas(16);
  const r = rng(200 + kind);
  const chalk = (x: number, y: number) => {
    if (r() < 0.08) return; // falhas do giz
    px(ctx, x, y, r() < 0.5 ? '#f4f1e6' : '#e6e3d4');
  };
  const line = (x0: number, y0: number, x1: number, y1: number) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      const t = n === 0 ? 0 : i / n;
      const x = Math.round(x0 + (x1 - x0) * t);
      const y = Math.round(y0 + (y1 - y0) * t);
      chalk(x, y);
      chalk(x + 1, y);
    }
  };
  if (kind === 0) {
    // X
    line(3, 3, 12, 12);
    line(12, 3, 3, 12);
  } else if (kind === 1) {
    // círculo
    for (let a = 0; a < 360; a += 7) {
      const rad = (a * Math.PI) / 180;
      const x = Math.round(7.5 + Math.cos(rad) * 5.5);
      const y = Math.round(7.5 + Math.sin(rad) * 5.5);
      chalk(x, y);
      chalk(x + 1, y);
    }
  } else if (kind === 2) {
    // seta pra cima
    line(7, 13, 7, 3);
    line(8, 13, 8, 3);
    line(3, 7, 7, 3);
    line(12, 7, 8, 3);
  } else if (kind === 3) {
    // triângulo
    line(7, 3, 2, 12);
    line(8, 3, 13, 12);
    line(2, 12, 13, 12);
  } else {
    // marca de "feito"
    line(2, 8, 6, 12);
    line(6, 12, 13, 3);
  }
  return toTexture(c, undefined, false);
}

// ── o Selo (sala 2) ─────────────────────────────────────────────────────────
// Três peças do selo (triângulo, círculo, cruz); cada uma fica numa casa de uma grade 3x3.
// A MESMA definição serve pra desenhar os fragmentos nas paredes e pra conferir o que o
// jogador riscou na lousa.
export const SEAL_CELL = 0.8; // metros por casa, na lousa
export const SEAL_SCALE = 0.27; // raio da forma dentro da casa, em metros
export interface SealPiece {
  id: string;
  col: number; // -1, 0, 1
  row: number; // -1 (embaixo), 0, 1 (em cima)
  color: string;
  unit: [number, number][]; // pontos da forma, em unidades (-1..1)
}
function ring(n: number): [number, number][] {
  return Array.from({ length: n }, (_, i) => [Math.cos((i / n) * Math.PI * 2), Math.sin((i / n) * Math.PI * 2)]);
}
function poly(pts: [number, number][], closed: boolean, step = 0.09): [number, number][] {
  const out: [number, number][] = [];
  const n = pts.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const k = Math.max(1, Math.round(len / step));
    for (let j = 0; j < k; j++) out.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k]);
  }
  return out;
}
export const SEAL_PIECES: SealPiece[] = [
  { id: 'tri', col: 0, row: 1, color: '#ffd36b', unit: poly([[0, 1], [-0.95, -0.7], [0.95, -0.7]], true) },
  { id: 'circle', col: 0, row: 0, color: '#6ff0ff', unit: ring(36) },
  {
    id: 'cross',
    col: 1,
    row: -1,
    color: '#ff7a9a',
    unit: [...poly([[-0.8, -0.8], [0.8, 0.8]], false, 0.09), ...poly([[-0.8, 0.8], [0.8, -0.8]], false, 0.09)],
  },
];
// pontos da peça na lousa (metros, a partir do centro da lousa)
export function sealPoints(p: SealPiece): [number, number][] {
  return p.unit.map(([x, y]) => [p.col * SEAL_CELL + x * SEAL_SCALE, p.row * SEAL_CELL + y * SEAL_SCALE]);
}

// lousa: pedra escura com a grade 3x3 apagadinha
export function slateTexture() {
  const { c, ctx } = canvas(48);
  const r = rng(300);
  // cor lisa (sem granulado): granulado + dithering na tela "fervia" quando a câmera se mexia
  rect(ctx, 0, 0, 48, 48, '#262932');
  for (const k of [15, 31]) {
    rect(ctx, k, 1, 2, 46, '#454a5a');
    rect(ctx, 1, k, 46, 2, '#454a5a');
  }
  void r;
  return toTexture(c, undefined, false, true);
}

// fragmento gravado na parede: a grade 3x3 e a peça acesa na casa certa
export function fragmentTexture(piece: SealPiece) {
  const { c, ctx } = canvas(48);
  const col = hex(piece.color);
  rect(ctx, 0, 0, 48, 48, '#14131c');
  rect(ctx, 0, 0, 48, 1, '#4a4660');
  rect(ctx, 0, 47, 48, 1, '#4a4660');
  rect(ctx, 0, 0, 1, 48, '#4a4660');
  rect(ctx, 47, 0, 1, 48, '#4a4660');
  for (const k of [15, 31]) {
    rect(ctx, k, 2, 2, 44, '#34324a');
    rect(ctx, 2, k, 44, 2, '#34324a');
  }
  const cx = 24 + piece.col * 16;
  const cy = 24 - piece.row * 16;
  // casa realçada
  rect(ctx, cx - 7, cy - 7, 15, 1, shade(col, 0.45));
  rect(ctx, cx - 7, cy + 7, 15, 1, shade(col, 0.45));
  rect(ctx, cx - 7, cy - 7, 1, 15, shade(col, 0.45));
  rect(ctx, cx + 7, cy - 7, 1, 15, shade(col, 0.45));
  for (const [ux, uy] of piece.unit) {
    const x = Math.round(cx + ux * 5.2);
    const y = Math.round(cy - uy * 5.2);
    px(ctx, x, y, shade(col, 1.15), 2, 2);
  }
  return toTexture(c, undefined, false, true);
}

// ── decoração das salas ─────────────────────────────────────────────────────
// Tudo procedural, 16–48 px, filtro "nearest" (ou suave nos decalques finos).

export function crateTexture() {
  const { c, ctx } = canvas(32);
  const r = rng(401);
  const wood = hex('#7a5030');
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) px(ctx, x, y, shade(wood, 0.9 + r() * 0.14 + (y % 8 === 0 ? -0.18 : 0)));
  // moldura e travessas em X
  const dark = hex('#4a2c1a');
  rect(ctx, 0, 0, 32, 3, shade(dark, 1.1));
  rect(ctx, 0, 29, 32, 3, shade(dark, 0.8));
  rect(ctx, 0, 0, 3, 32, shade(dark, 1.0));
  rect(ctx, 29, 0, 3, 32, shade(dark, 0.85));
  for (let i = 3; i < 29; i++) {
    px(ctx, i, i, shade(dark, 0.95), 2, 2);
    px(ctx, 31 - i, i, shade(dark, 0.95), 2, 2);
  }
  for (const [x, y] of [[1, 1], [30, 1], [1, 30], [30, 30]]) px(ctx, x, y, '#9a9ab0');
  return toTexture(c, undefined, false, true);
}

export function barrelTexture() {
  const { c, ctx } = canvas(32);
  const r = rng(402);
  const wood = hex('#6b4527');
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      let k = 0.92 + r() * 0.1;
      if (x % 6 === 0) k *= 0.6; // frestas entre as tábuas
      px(ctx, x, y, shade(wood, k));
    }
  }
  for (const y0 of [4, 14, 24]) {
    rect(ctx, 0, y0, 32, 1, '#7a7a90');
    rect(ctx, 0, y0 + 1, 32, 2, '#3a3a48');
    rect(ctx, 0, y0 + 3, 32, 1, '#1c1c24');
  }
  return toTexture(c, [1, 1], true, true);
}

export function rugTexture(main: string, accent: string) {
  const { c, ctx } = canvas(32, 48);
  const a = hex(main);
  const b = hex(accent);
  const r = rng(403);
  for (let y = 0; y < 48; y++) for (let x = 0; x < 32; x++) px(ctx, x, y, shade(a, 0.9 + r() * 0.1));
  // bordas
  for (const [i, col] of [[0, shade(b, 1.0)], [2, shade(a, 0.6)], [4, shade(b, 0.8)]] as [number, string][]) {
    rect(ctx, i, i, 32 - i * 2, 1, col);
    rect(ctx, i, 47 - i, 32 - i * 2, 1, col);
    rect(ctx, i, i, 1, 48 - i * 2, col);
    rect(ctx, 31 - i, i, 1, 48 - i * 2, col);
  }
  // losangos no meio
  for (const cy of [12, 24, 36]) {
    for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
      const d = Math.abs(dx) + Math.abs(dy);
      if (d <= 5) px(ctx, 16 + dx, cy + dy, d === 5 ? shade(b, 0.85) : d <= 2 ? shade(b, 1.1) : shade(a, 0.7));
    }
  }
  // franjas
  for (let x = 0; x < 32; x += 2) {
    px(ctx, x, 0, shade(b, 1.2));
    px(ctx, x, 47, shade(b, 1.2));
  }
  return toTexture(c, undefined, false, true);
}

export function bannerTexture(main: string, emblem: string) {
  const { c, ctx } = canvas(16, 32);
  const a = hex(main);
  const b = hex(emblem);
  const r = rng(404);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 16; x++) {
      px(ctx, x, y, shade(a, 0.9 + r() * 0.1 + (x % 5 === 0 ? -0.08 : 0)));
    }
  }
  // corta o "V" da ponta
  for (let y = 26; y < 32; y++) {
    const cut = (y - 25) * 1.4;
    for (let x = 0; x < 16; x++) if (Math.abs(x - 7.5) > 8 - cut) ctx.clearRect(x, y, 1, 1);
  }
  // emblema: olho
  for (let dy = -3; dy <= 3; dy++) for (let dx = -5; dx <= 5; dx++) {
    const d = Math.abs(dx) / 5 + Math.abs(dy) / 3;
    if (d <= 1) px(ctx, 8 + dx, 12 + dy, shade(b, d > 0.8 ? 0.8 : 1.1));
  }
  px(ctx, 7, 11, shade(a, 0.5), 2, 2);
  rect(ctx, 0, 0, 16, 2, shade(b, 0.7));
  return toTexture(c, undefined, false, true);
}

// manchas de umidade/musgo (decalque com transparência)
export function stainTexture(kind: 'moss' | 'damp') {
  const { c, ctx } = canvas(32);
  const r = rng(kind === 'moss' ? 405 : 406);
  const base = kind === 'moss' ? hex('#3a7a42') : hex('#14131c');
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const d = Math.hypot(x - 16, (y - 14) * 1.2) / 16;
      const n = r() * 0.5;
      const v = Math.sin(x * 0.7 + y * 0.3) * 0.15 + n;
      if (d + v < 0.85 && !(kind === 'moss' && y < 6 && r() < 0.3)) {
        ctx.fillStyle = shade(base, 0.75 + r() * 0.5);
        ctx.globalAlpha = kind === 'moss' ? 0.95 : 0.55;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  ctx.globalAlpha = 1;
  return toTexture(c, undefined, false, true);
}

// trepadeira pendurada (decalque)
export function vineTexture() {
  const { c, ctx } = canvas(16, 32);
  const r = rng(407);
  for (const x0 of [3, 8, 12]) {
    let x = x0;
    const len = 12 + Math.floor(r() * 18);
    for (let y = 0; y < len; y++) {
      if (r() < 0.25) x += r() < 0.5 ? -1 : 1;
      x = Math.max(1, Math.min(14, x));
      px(ctx, x, y, y % 5 === 4 ? '#7fd18a' : '#2f6a3a');
      if (y % 6 === 3) px(ctx, x + 1, y, '#4fa05a');
    }
  }
  return toTexture(c, undefined, false, true);
}

// poça d'água no chão (decalque)
export function puddleTexture() {
  const { c, ctx } = canvas(32);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const d = Math.hypot((x - 16) / 14, (y - 16) / 9);
      if (d < 1) {
        ctx.globalAlpha = d > 0.85 ? 0.45 : 0.75;
        ctx.fillStyle = d < 0.35 ? '#2a5a7a' : '#1c3a52';
        if ((x + y * 2) % 11 === 0 && d < 0.7) ctx.fillStyle = '#6fd0f0';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  ctx.globalAlpha = 1;
  return toTexture(c, undefined, false, true);
}

// teia de aranha no canto (decalque)
export function cobwebTexture() {
  const { c, ctx } = canvas(24);
  const col = '#cfd2e0';
  for (let i = 0; i < 24; i++) px(ctx, i, 0, col);
  for (let i = 0; i < 24; i++) px(ctx, 0, i, col);
  for (let i = 0; i < 24; i++) px(ctx, i, i, col);
  for (let i = 0; i < 24; i += 2) px(ctx, i, Math.floor(i / 2), col);
  for (let i = 0; i < 24; i += 2) px(ctx, Math.floor(i / 2), i, col);
  for (const rad of [7, 13, 19]) {
    for (let a = 0; a <= 90; a += 6) {
      const rr = (a * Math.PI) / 180;
      px(ctx, Math.round(Math.cos(rr) * rad), Math.round(Math.sin(rr) * rad), col);
    }
  }
  return toTexture(c, undefined, false, true);
}

// piso de mosaico circular (sala redonda)
export function mosaicTexture() {
  const { c, ctx } = canvas(64);
  const r = rng(408);
  const cols = ['#8a5a44', '#a06a4c', '#704636', '#c0905c'];
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const d = Math.hypot(x - 31.5, y - 31.5);
      if (d > 31.5) continue;
      const ang = Math.atan2(y - 31.5, x - 31.5);
      let col: string;
      if (d > 28) col = '#3a2018';
      else if (d > 25) col = '#c0905c';
      else if (d > 22) col = '#3a2018';
      else if (d < 5) col = '#e8b878';
      else {
        const seg = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 16);
        col = (seg + Math.floor(d / 4)) % 2 === 0 ? cols[0] : cols[2];
        if (d > 10 && d < 12) col = cols[3];
      }
      px(ctx, x, y, shade(hex(col), 0.9 + r() * 0.15));
    }
  }
  return toTexture(c, undefined, false, true);
}


// ── sombras falsas (oclusão ambiente) ───────────────────────────────────────
// Faixa de sombra que escurece o encontro de parede com chão/teto (gradiente em degraus).
export function aoStripTexture() {
  const { c, ctx } = canvas(4, 32);
  for (let y = 0; y < 32; y++) {
    const a = Math.max(0, 1 - y / 31);
    ctx.fillStyle = `rgba(4,3,10,${(Math.round(a * a * 6) / 6) * 0.62})`;
    ctx.fillRect(0, y, 4, 1);
  }
  return toTexture(c, undefined, false, true);
}

// Mancha redonda de sombra sob objetos (pilares, caixas, barris, braseiros).
// SOMBRA DE CONTATO (DIRECAO_DE_ARTE.md §4.2): disco escuro PONTILHADO embaixo de tudo que toca o chão. O miolo é cheio; para fora, os pixels
// rareiam num pontilhado ordenado (Bayer 4×4), sem degradê suave: combina com o pixel do jogo e "pousa" as coisas no chão.
export function blobShadowTexture() {
  const { c, ctx } = canvas(32);
  const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const d = Math.hypot(x - 15.5, y - 15.5) / 15.5;
      if (d >= 1) continue;
      const cover = Math.min(1, (1 - d) * 1.9); // quanto do disco está coberto aqui (1 no miolo)
      if ((B[(y % 4) * 4 + (x % 4)] + 0.5) / 16 >= cover) continue;
      ctx.fillStyle = d < 0.45 ? 'rgba(3,2,8,0.82)' : 'rgba(3,2,8,0.62)';
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return toTexture(c, undefined, false, false);
}

// Anel de sombra junto à parede curva (sala redonda): escuro na borda, some pra dentro.
export function aoRingTexture() {
  const { c, ctx } = canvas(64);
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const d = Math.hypot(x - 31.5, y - 31.5) / 31.5;
      const a = Math.max(0, (d - 0.78) / 0.22);
      ctx.fillStyle = `rgba(4,3,10,${(Math.round(a * 6) / 6) * 0.62})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return toTexture(c, undefined, false, true);
}

// ── o diário (livro que o personagem carrega) ───────────────────────────
// Couro escuro com costura; na capa, o símbolo "DADO" (moldura com 5 pontos) em dourado.
export function diaryLeatherTexture() {
  const { c, ctx } = canvas(16);
  const r = rng(201);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let k = 0.9 + r() * 0.16;
      if ((x * 3 + y * 5) % 11 === 0) k *= 0.82; // grão do couro
      px(ctx, x, y, shade(hex('#8c3a22'), k));
    }
  }
  return toTexture(c, undefined, false);
}

export function diaryCoverTexture() {
  const W = 32;
  const H = 44;
  const { c, ctx } = canvas(W, H);
  const r = rng(202);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let k = 0.92 + r() * 0.15;
      if ((x * 3 + y * 5) % 11 === 0) k *= 0.82;
      px(ctx, x, y, shade(hex('#9a4026'), k));
    }
  }
  // costura (pontilhado) rente à borda
  for (let i = 3; i < W - 3; i += 2) {
    px(ctx, i, 2, '#c2a48e');
    px(ctx, i, H - 3, '#c2a48e');
  }
  for (let j = 3; j < H - 3; j += 2) {
    px(ctx, 2, j, '#c2a48e');
    px(ctx, W - 3, j, '#c2a48e');
  }
  // cantos metálicos
  for (const [cx, cy] of [[0, 0], [W - 4, 0], [0, H - 4], [W - 4, H - 4]]) rect(ctx, cx, cy, 4, 4, '#a87a28');
  for (const [cx, cy] of [[1, 1], [W - 3, 1], [1, H - 3], [W - 3, H - 3]]) rect(ctx, cx, cy, 2, 2, '#f0d880');
  // símbolo DADO: moldura + 5 pontos
  const gx = 7;
  const gy = 11;
  const s = 18;
  const gold = '#d4ac4e';
  rect(ctx, gx, gy, s, 2, gold);
  rect(ctx, gx, gy + s - 2, s, 2, gold);
  rect(ctx, gx, gy, 2, s, gold);
  rect(ctx, gx + s - 2, gy, 2, s, gold);
  for (const [dx, dy] of [[4, 4], [12, 4], [8, 8], [4, 12], [12, 12]]) rect(ctx, gx + dx, gy + dy, 2, 2, '#f0d880');
  // barras do lombo
  rect(ctx, 0, 0, 1, H, '#4a1a10');
  return toTexture(c, undefined, false);
}

// borda cremosa das folhas
export function diaryEdgeTexture() {
  const { c, ctx } = canvas(8, 16);
  const r = rng(203);
  for (let y = 0; y < 16; y++) {
    const line = y % 2 === 0;
    for (let x = 0; x < 8; x++) px(ctx, x, y, shade(hex(line ? '#f0c890' : '#c88a4c'), 0.92 + r() * 0.12));
  }
  return toTexture(c, undefined, false);
}

// páginas: papel escuro com pautas bem apagadas (o texto vem da interface, por cima)
export function diaryPageTexture(left: boolean) {
  const W = 40;
  const H = 52;
  const { c, ctx } = canvas(W, H);
  const r = rng(left ? 204 : 205);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let k = 0.94 + r() * 0.1;
      // sombra perto do lombo (lado interno de cada página)
      const d = left ? W - 1 - x : x;
      if (d < 7) k *= 0.62 + d * 0.055;
      if (y % 6 === 4 && d > 3 && x > 2 && x < W - 3) k *= 1.22; // pautas
      px(ctx, x, y, shade(hex('#2c2a3e'), k));
    }
  }
  // moldura fina
  const bx = left ? 2 : 5;
  rect(ctx, bx, 2, W - 7, 1, '#403e56');
  rect(ctx, bx, H - 3, W - 7, 1, '#403e56');
  return toTexture(c, undefined, false);
}


// ── decalques do quadro de estilo (DIRECAO_DE_ARTE.md §4.4): cada um tem um porquê ─────────────────────────────────────────────────
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dith = (x: number, y: number) => (BAYER4[(y % 4) * 4 + (x % 4)] + 0.5) / 16;

// FULIGEM: a fumaça de uma chama sobe e enegrece a parede acima dela (mais escura embaixo, rala e larga em cima), pontilhada
export function sootTexture() {
  const { c, ctx } = canvas(32, 48);
  const r = rng(43);
  for (let y = 0; y < 48; y++) {
    const v = y / 47; // 0 em cima, 1 embaixo
    const half = 15 * (1 - v * 0.55);
    for (let x = 0; x < 32; x++) {
      const dx = Math.abs(x - 15.5) / half;
      if (dx >= 1) continue;
      const k = (1 - dx * dx) * (0.25 + 0.75 * v) * (0.85 + r() * 0.3);
      if (dith(x, y) >= k) continue;
      ctx.fillStyle = k > 0.7 ? 'rgba(6,4,6,0.85)' : 'rgba(10,8,10,0.6)';
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return toTexture(c, undefined, false, false);
}

// POÇA DE LUZ: o chão clareado embaixo de uma chama (aditivo): forte no meio, some rápido, em degraus pontilhados
export function lightPoolTexture() {
  const { c, ctx } = canvas(32);
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      const d = Math.hypot(x - 15.5, y - 15.5) / 15.5;
      if (d >= 1) continue;
      const k = (1 - d) ** 1.6;
      const lvl = Math.floor(k * 4 + dith(x, y)) / 4; // 4 degraus, com pontilhado entre eles
      if (lvl <= 0) continue;
      ctx.fillStyle = `rgba(255,${Math.round(150 + 60 * lvl)},${Math.round(70 + 40 * lvl)},${lvl})`;
      ctx.fillRect(x, y, 1, 1);
    }
  return toTexture(c, undefined, false, false);
}

// DESGASTE: o caminho de quem anda da entrada até a porta, mais liso e claro; as bordas se desfazem em pontilhado
export function wearTexture() {
  // sem pontilhado próprio (o pós-processo já pontilha): um véu claro e suave, aditivo, mais forte no meio do caminho
  const { c, ctx } = canvas(16, 64);
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 16; x++) {
      const dx = Math.abs(x - 7.5) / 7.5;
      const k = Math.max(0, 1 - dx * dx) * (0.8 + 0.2 * Math.sin(y * 0.35 + 1));
      ctx.fillStyle = `rgba(255,236,205,${(k * 0.55).toFixed(3)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  const t = toTexture(c, undefined, false, true);
  t.magFilter = THREE.LinearFilter;
  return t;
}

// RISCOS DE GIZ de um condenado contando dias: grupos de quatro tracinhos cortados por um quinto, tortos, em fileiras; o último grupo incompleto.
// (Contagem, não escrita: nunca parecido com um glifo.)
export function tallyTexture(days = 23) {
  // o giz do jogo, à mão (scene/chalkdraw.ts, DESIGN.md §80): grupos de quatro riscos e o quinto atravessado
  return chalkTexture('contagem', 64, 32, days * 7, { days, step: 4 });
}
