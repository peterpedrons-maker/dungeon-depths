// Todas as texturas são desenhadas pixel a pixel em canvas pequenos (16-32px) e
// usadas com filtro "nearest" — nenhum arquivo de imagem, o visual granulado
// vem do próprio código.

import * as THREE from 'three';

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

function toTexture(c: HTMLCanvasElement, repeat?: [number, number], wrap = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  if (wrap) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (repeat) t.repeat.set(repeat[0], repeat[1]);
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

function drawBricks(ctx: CanvasRenderingContext2D, tint: number, seed: number) {
  const r = rng(seed);
  rect(ctx, 0, 0, 32, 32, MORTAR);
  for (let row = 0; row < 4; row++) {
    const off = row % 2 ? 8 : 0;
    for (let col = -1; col < 3; col++) {
      const x0 = col * 16 + off;
      const y0 = row * 8;
      const base = STONE[Math.floor(r() * STONE.length)];
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 15; x++) {
          let k = tint * (0.96 + r() * 0.08);
          if (y === 0) k *= 1.22;
          if (y === 6) k *= 0.72;
          if (x === 0) k *= 1.1;
          if (x === 14) k *= 0.8;
          px(ctx, x0 + x, y0 + y, shade(base, k));
        }
      }
    }
  }
}

export function brickTexture(repeat: [number, number], tint = 1, seed = 11) {
  const { c, ctx } = canvas(32);
  drawBricks(ctx, tint, seed);
  return toTexture(c, repeat);
}

export function floorTexture(repeat: [number, number]) {
  const { c, ctx } = canvas(32);
  const r = rng(5);
  const tones: RGB[] = [hex('#5a4d47'), hex('#645650'), hex('#4c413d')];
  rect(ctx, 0, 0, 32, 32, '#1d1816');
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      const base = tones[Math.floor(r() * tones.length)];
      for (let y = 0; y < 15; y++) {
        for (let x = 0; x < 15; x++) {
          let k = 0.95 + r() * 0.1;
          if (y === 0 || x === 0) k *= 1.18;
          if (y === 14 || x === 14) k *= 0.78;
          px(ctx, tx * 16 + x, ty * 16 + y, shade(base, k));
        }
      }
    }
  }
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
  return toTexture(c, undefined, false);
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
  return toTexture(c, undefined, false);
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
  return toTexture(c, undefined, false);
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

export function flameFrames(): THREE.CanvasTexture[] {
  const shapes = [
    ['....##....', '...####...', '..######..', '..######..', '.########.', '.########.', '..######..', '...####...'],
    ['...##.....', '...###....', '..#####...', '..######..', '.#######..', '.########.', '..######..', '...####...'],
    ['.....##...', '....###...', '...#####..', '..######..', '..#######.', '.########.', '..######..', '...####...'],
  ];
  return shapes.map((rows) => {
    const { c, ctx } = canvas(10, 8);
    rows.forEach((line, y) => {
      for (let x = 0; x < line.length; x++) {
        if (line[x] !== '#') continue;
        const t = y / (rows.length - 1);
        px(ctx, x, y, t < 0.35 ? '#fff3a8' : t < 0.7 ? '#ffb02e' : '#ff5a1f');
      }
    });
    return toTexture(c, undefined, false);
  });
}

const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

// "Pip" em forma de gema (losango) — o dado do jogo é de obsidiana com
// gemas brilhantes no lugar dos pontos, cada face com a cor da sua habilidade.
function drawGem(ctx: CanvasRenderingContext2D, cx: number, cy: number, col: RGB, glow: boolean) {
  const c = (k: number) => shade(col, k);
  const cells: [number, number, number][] = [];
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const d = Math.abs(dx) + Math.abs(dy);
      if (d <= 3) cells.push([dx, dy, d]);
    }
  }
  for (const [dx, dy, d] of cells) {
    const k = glow ? (d <= 1 ? 1.35 : d === 2 ? 1 : 0.7) : d <= 1 ? 1.2 : d === 2 ? 0.95 : 0.55;
    px(ctx, cx + dx, cy + dy, c(k));
  }
}

const GEM_POS = [9, 16, 23];

export function dieFaceCanvas(n: number, accent: string, locked = false): HTMLCanvasElement {
  const { c, ctx } = canvas(32);
  const r = rng(40 + n);
  const body = hex('#2a2140');
  const gold = hex('#d4ac4e');
  // obsidiana com veios mais claros
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const vein = Math.sin((x + y * 0.7 + n * 5) * 0.55) * Math.sin((x * 0.6 - y) * 0.35 + n) > 0.62 ? 1.35 : 1;
      px(ctx, x, y, shade(body, (0.92 + r() * 0.1) * vein));
    }
  }
  // faixa externa escura: cai sobre a quina arredondada do dado
  for (let i = 0; i < 3; i++) {
    const k = 0.45 + i * 0.12;
    rect(ctx, i, i, 32 - i * 2, 1, shade(body, k));
    rect(ctx, i, 31 - i, 32 - i * 2, 1, shade(body, k));
    rect(ctx, i, i, 1, 32 - i * 2, shade(body, k));
    rect(ctx, 31 - i, i, 1, 32 - i * 2, shade(body, k));
  }
  // filete dourado embutido, com brilho em cima/esquerda e sombra embaixo/direita
  const lo = 4;
  const hi = 27;
  rect(ctx, lo, lo, hi - lo + 1, 1, shade(gold, 1.25));
  rect(ctx, lo, lo, 1, hi - lo + 1, shade(gold, 1.15));
  rect(ctx, lo, hi, hi - lo + 1, 1, shade(gold, 0.6));
  rect(ctx, hi, lo, 1, hi - lo + 1, shade(gold, 0.7));
  for (const [cx, cy] of [[lo, lo], [hi, lo], [lo, hi], [hi, hi]]) rect(ctx, cx - 1, cy - 1, 3, 3, shade(gold, 1.35));
  const col = locked ? hex('#5a5270') : hex(accent);
  for (const [gx, gy] of PIPS[n]) drawGem(ctx, Math.round(GEM_POS[gx]), Math.round(GEM_POS[gy]), col, false);
  return c;
}

export function dieGlowCanvas(n: number, accent: string, locked = false): HTMLCanvasElement {
  const { c, ctx } = canvas(32);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 32, 32);
  const col = locked ? hex('#3a3450') : hex(accent);
  for (const [gx, gy] of PIPS[n]) drawGem(ctx, Math.round(GEM_POS[gx]), Math.round(GEM_POS[gy]), col, true);
  return c;
}

export function dieFaceTexture(n: number, accent: string, locked: boolean) {
  return toTexture(dieFaceCanvas(n, accent, locked), undefined, false);
}

export function dieGlowTexture(n: number, accent: string, locked: boolean) {
  return toTexture(dieGlowCanvas(n, accent, locked), undefined, false);
}
