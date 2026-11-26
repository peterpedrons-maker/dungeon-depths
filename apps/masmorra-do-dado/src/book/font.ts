import { glyphsOf, type GlyphDef } from '../story/lexicon';

// Fonte de pixels 5x8 (ASCII) + acentos do português, desenhada direto no canvas das páginas.
// Cada caractere ocupa 5 colunas; bit r de cada byte = linha r (r = 0 em cima; o bit 7 é a "perna" de g, j, p, q, y).
const ASCII: number[][] = [
  [0x00, 0x00, 0x00, 0x00, 0x00], [0x00, 0x00, 0x5f, 0x00, 0x00], [0x00, 0x07, 0x00, 0x07, 0x00], [0x14, 0x7f, 0x14, 0x7f, 0x14],
  [0x24, 0x2a, 0x7f, 0x2a, 0x12], [0x23, 0x13, 0x08, 0x64, 0x62], [0x36, 0x49, 0x56, 0x20, 0x50], [0x00, 0x08, 0x07, 0x03, 0x00],
  [0x00, 0x1c, 0x22, 0x41, 0x00], [0x00, 0x41, 0x22, 0x1c, 0x00], [0x2a, 0x1c, 0x7f, 0x1c, 0x2a], [0x08, 0x08, 0x3e, 0x08, 0x08],
  [0x00, 0x80, 0x70, 0x30, 0x00], [0x08, 0x08, 0x08, 0x08, 0x08], [0x00, 0x00, 0x60, 0x60, 0x00], [0x20, 0x10, 0x08, 0x04, 0x02],
  [0x3e, 0x51, 0x49, 0x45, 0x3e], [0x00, 0x42, 0x7f, 0x40, 0x00], [0x72, 0x49, 0x49, 0x49, 0x46], [0x21, 0x41, 0x49, 0x4d, 0x33],
  [0x18, 0x14, 0x12, 0x7f, 0x10], [0x27, 0x45, 0x45, 0x45, 0x39], [0x3c, 0x4a, 0x49, 0x49, 0x31], [0x41, 0x21, 0x11, 0x09, 0x07],
  [0x36, 0x49, 0x49, 0x49, 0x36], [0x46, 0x49, 0x49, 0x29, 0x1e], [0x00, 0x00, 0x14, 0x00, 0x00], [0x00, 0x40, 0x34, 0x00, 0x00],
  [0x00, 0x08, 0x14, 0x22, 0x41], [0x14, 0x14, 0x14, 0x14, 0x14], [0x00, 0x41, 0x22, 0x14, 0x08], [0x02, 0x01, 0x59, 0x09, 0x06],
  [0x3e, 0x41, 0x5d, 0x59, 0x4e], [0x7c, 0x12, 0x11, 0x12, 0x7c], [0x7f, 0x49, 0x49, 0x49, 0x36], [0x3e, 0x41, 0x41, 0x41, 0x22],
  [0x7f, 0x41, 0x41, 0x41, 0x3e], [0x7f, 0x49, 0x49, 0x49, 0x41], [0x7f, 0x09, 0x09, 0x09, 0x01], [0x3e, 0x41, 0x41, 0x51, 0x73],
  [0x7f, 0x08, 0x08, 0x08, 0x7f], [0x00, 0x41, 0x7f, 0x41, 0x00], [0x20, 0x40, 0x41, 0x3f, 0x01], [0x7f, 0x08, 0x14, 0x22, 0x41],
  [0x7f, 0x40, 0x40, 0x40, 0x40], [0x7f, 0x02, 0x1c, 0x02, 0x7f], [0x7f, 0x04, 0x08, 0x10, 0x7f], [0x3e, 0x41, 0x41, 0x41, 0x3e],
  [0x7f, 0x09, 0x09, 0x09, 0x06], [0x3e, 0x41, 0x51, 0x21, 0x5e], [0x7f, 0x09, 0x19, 0x29, 0x46], [0x26, 0x49, 0x49, 0x49, 0x32],
  [0x03, 0x01, 0x7f, 0x01, 0x03], [0x3f, 0x40, 0x40, 0x40, 0x3f], [0x1f, 0x20, 0x40, 0x20, 0x1f], [0x3f, 0x40, 0x38, 0x40, 0x3f],
  [0x63, 0x14, 0x08, 0x14, 0x63], [0x03, 0x04, 0x78, 0x04, 0x03], [0x61, 0x59, 0x49, 0x4d, 0x43], [0x00, 0x7f, 0x41, 0x41, 0x41],
  [0x02, 0x04, 0x08, 0x10, 0x20], [0x00, 0x41, 0x41, 0x41, 0x7f], [0x04, 0x02, 0x01, 0x02, 0x04], [0x40, 0x40, 0x40, 0x40, 0x40],
  [0x00, 0x03, 0x07, 0x08, 0x00], [0x20, 0x54, 0x54, 0x78, 0x40], [0x7f, 0x28, 0x44, 0x44, 0x38], [0x38, 0x44, 0x44, 0x44, 0x28],
  [0x38, 0x44, 0x44, 0x28, 0x7f], [0x38, 0x54, 0x54, 0x54, 0x18], [0x00, 0x08, 0x7e, 0x09, 0x02], [0x18, 0xa4, 0xa4, 0x9c, 0x78],
  [0x7f, 0x08, 0x04, 0x04, 0x78], [0x00, 0x44, 0x7d, 0x40, 0x00], [0x20, 0x40, 0x40, 0x3d, 0x00], [0x7f, 0x10, 0x28, 0x44, 0x00],
  [0x00, 0x41, 0x7f, 0x40, 0x00], [0x7c, 0x04, 0x78, 0x04, 0x78], [0x7c, 0x08, 0x04, 0x04, 0x78], [0x38, 0x44, 0x44, 0x44, 0x38],
  [0xfc, 0x18, 0x24, 0x24, 0x18], [0x18, 0x24, 0x24, 0x18, 0xfc], [0x7c, 0x08, 0x04, 0x04, 0x08], [0x48, 0x54, 0x54, 0x54, 0x24],
  [0x04, 0x04, 0x3f, 0x44, 0x24], [0x3c, 0x40, 0x40, 0x20, 0x7c], [0x1c, 0x20, 0x40, 0x20, 0x1c], [0x3c, 0x40, 0x30, 0x40, 0x3c],
  [0x44, 0x28, 0x10, 0x28, 0x44], [0x4c, 0x90, 0x90, 0x90, 0x7c], [0x44, 0x64, 0x54, 0x4c, 0x44], [0x00, 0x08, 0x36, 0x41, 0x00],
  [0x00, 0x00, 0x7f, 0x00, 0x00], [0x00, 0x41, 0x36, 0x08, 0x00], [0x02, 0x01, 0x02, 0x04, 0x02],
];

type Accent = 'acute' | 'grave' | 'circ' | 'tilde' | 'cedil' | 'uml';
const COMPOSED: Record<string, [string, Accent]> = {};
const add = (base: string, list: string, acc: Accent) => [...list].forEach((c, i) => (COMPOSED[c] = [base[i] ?? base[0], acc]));
add('aeiou', 'áéíóú', 'acute');
add('AEIOU', 'ÁÉÍÓÚ', 'acute');
add('aeiou', 'àèìòù', 'grave');
add('AEIOU', 'ÀÈÌÒÙ', 'grave');
add('aeo', 'âêô', 'circ');
add('AEO', 'ÂÊÔ', 'circ');
add('aon', 'ãõñ', 'tilde');
add('AON', 'ÃÕÑ', 'tilde');
add('c', 'ç', 'cedil');
add('C', 'Ç', 'cedil');
add('u', 'ü', 'uml');
const ALIAS: Record<string, string> = { '–': '-', '—': '-', '…': '...', '“': '"', '”': '"', '‘': "'", '’': "'", '·': '-', '«': '<', '»': '>', 'º': 'o', 'ª': 'a', '•': '*' };

export const LINE = 10; // altura de uma linha de texto (escala 1)
export const ADV = 6; // avanço horizontal por caractere (escala 1)

function pixels(ch: string): number[] {
  const code = ch.charCodeAt(0);
  return code >= 32 && code <= 126 ? ASCII[code - 32] : ASCII['?'.charCodeAt(0) - 32];
}

// y = topo da célula (a célula tem 2 linhas de folga em cima para os acentos de maiúsculas)
export function drawChar(ctx: CanvasRenderingContext2D, ch: string, x: number, y: number, color: string, sc = 1) {
  const a = ALIAS[ch];
  if (a && a.length === 1) ch = a;
  let acc: Accent | null = null;
  const comp = COMPOSED[ch];
  if (comp) {
    ch = comp[0];
    acc = comp[1];
  }
  ctx.fillStyle = color;
  const cols = pixels(ch);
  const px = (cx: number, cy: number) => ctx.fillRect(x + cx * sc, y + (cy + 2) * sc, sc, sc);
  for (let c = 0; c < 5; c++) {
    for (let r = 0; r < 8; r++) {
      if (!(cols[c] & (1 << r))) continue;
      if (acc && ch === 'i' && c === 2 && r === 0) continue; // o acento substitui o pingo
      px(c, r);
    }
  }
  if (!acc) return;
  const lower = ch >= 'a' && ch <= 'z';
  const t = lower ? 2 : 0; // linha do topo da letra
  const a1 = t - 2;
  const a2 = t - 1;
  const put = (cx: number, cy: number) => px(cx, cy);
  if (acc === 'acute') (put(3, a1), put(2, a2));
  else if (acc === 'grave') (put(1, a1), put(2, a2));
  else if (acc === 'circ') (put(2, a1), put(1, a2), put(3, a2));
  else if (acc === 'tilde') (put(1, a1), put(2, a2), put(3, a1), put(4, a2));
  else if (acc === 'uml') (put(1, a2), put(3, a2));
  else if (acc === 'cedil') put(2, 8);
}

export function textWidth(s: string, sc = 1) {
  return [...s].length * ADV * sc;
}

export function drawText(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, sc = 1) {
  let cx = x;
  for (const ch of s) {
    drawChar(ctx, ch, cx, y, color, sc);
    cx += ADV * sc;
  }
}

export function drawCentered(ctx: CanvasRenderingContext2D, s: string, cx: number, y: number, color: string, sc = 1) {
  drawText(ctx, s, Math.round(cx - textWidth(s, sc) / 2), y, color, sc);
}

// quebra de linha por palavras (largura em caracteres); \n força quebra
export function wrap(s: string, maxChars: number): string[] {
  const out: string[] = [];
  for (const para of s.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      let w = word;
      while ([...w].length > maxChars) {
        if (line) {
          out.push(line);
          line = '';
        }
        out.push([...w].slice(0, maxChars).join(''));
        w = [...w].slice(maxChars).join('');
      }
      const next = line ? `${line} ${w}` : w;
      if ([...next].length <= maxChars) line = next;
      else {
        out.push(line);
        line = w;
      }
    }
    out.push(line);
  }
  return out;
}

// ── símbolos da língua, desenhados em pixels ────────────────────────────
export function plot(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, w: number) {
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  const o = Math.floor((w - 1) / 2);
  for (let n = 0; n < 400; n++) {
    ctx.fillRect(x0 - o, y0 - o, w, w);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

// (cx, cy) = centro da moldura do símbolo; size = altura da área do símbolo
export function drawGlyph(ctx: CanvasRenderingContext2D, g: GlyphDef, cx: number, cy: number, size: number, color: string) {
  const k = size / 130;
  const S = 34 * k;
  const cell = (i: number): [number, number] => [cx + ((i % 3) - 1) * S, cy + (Math.floor(i / 3) - 1) * S];
  const lw = Math.max(1, Math.round(5 * k * 0.62));
  const fw = Math.max(1, Math.round(4 * k * 0.62));
  const h = 56 * k;
  ctx.fillStyle = color;
  const edge = (x0: number, y0: number, x1: number, y1: number) => plot(ctx, x0, y0, x1, y1, fw);
  const L = cx - h;
  const R = cx + h;
  const T = cy - h;
  const B = cy + h;
  if (g.F === 'full') {
    edge(L, T, R, T);
    edge(R, T, R, B);
    edge(R, B, L, B);
    edge(L, B, L, T);
  } else if (g.F === 'U') (edge(L, T, L, B), edge(L, B, R, B), edge(R, B, R, T));
  else if (g.F === 'N') (edge(L, B, L, T), edge(L, T, R, T), edge(R, T, R, B));
  else if (g.F === 'R') (edge(R, T, L, T), edge(L, T, L, B), edge(L, B, R, B));
  else if (g.F === 'L') (edge(L, T, R, T), edge(R, T, R, B), edge(R, B, L, B));
  else if (g.F === 'V') (edge(L, T, L, B), edge(R, T, R, B));
  for (const [a, b] of g.l) {
    const [xa, ya] = cell(a);
    const [xb, yb] = cell(b);
    plot(ctx, xa, ya, xb, yb, lw);
  }
  const rp = (g.s ? 4.2 : 7) * k;
  for (const i of g.p) {
    const [x, y] = cell(i);
    const r = g.big.includes(i) ? 10 * k : rp;
    const d = Math.max(2, Math.round(r * 2));
    ctx.fillRect(Math.round(x - d / 2), Math.round(y - d / 2), d, d);
  }
  for (const i of g.ring) {
    const [x, y] = cell(i);
    const d = Math.max(4, Math.round(20 * k));
    const x0 = Math.round(x - d / 2);
    const y0 = Math.round(y - d / 2);
    ctx.fillRect(x0, y0, d, 1);
    ctx.fillRect(x0, y0 + d - 1, d, 1);
    ctx.fillRect(x0, y0, 1, d);
    ctx.fillRect(x0 + d - 1, y0, 1, d);
  }
}

// O MESMO símbolo, só até a fração `f` (0..1) da escrita: os traços na ordem em que se escrevem (moldura, ligações, pontos, anéis), cada um do
// começo ao fim; o tempo de cada traço é proporcional ao comprimento (um ponto vale um traço curto). `thick` engorda tudo (px).
// Usado pelo FOGO que corre pelos sulcos de uma frase acesa (scene/burnline.ts).
export function drawGlyphPart(ctx: CanvasRenderingContext2D, g: GlyphDef, cx: number, cy: number, size: number, color: string, f: number, thick = 0) {
  if (f <= 0) return;
  const k = size / 130;
  const S = 34 * k;
  const cell = (i: number): [number, number] => [cx + ((i % 3) - 1) * S, cy + (Math.floor(i / 3) - 1) * S];
  const lw = Math.max(1, Math.round(5 * k * 0.62)) + thick;
  const fw = Math.max(1, Math.round(4 * k * 0.62)) + thick;
  const h = 56 * k;
  const L = cx - h;
  const R = cx + h;
  const T = cy - h;
  const B = cy + h;
  type St = { a: [number, number]; b: [number, number]; w: number } | { dot: [number, number]; d: number } | { ring: [number, number]; d: number };
  const st: St[] = [];
  const seg = (x0: number, y0: number, x1: number, y1: number, w: number) => st.push({ a: [x0, y0], b: [x1, y1], w });
  if (g.F === 'full') (seg(L, T, R, T, fw), seg(R, T, R, B, fw), seg(R, B, L, B, fw), seg(L, B, L, T, fw));
  else if (g.F === 'U') (seg(L, T, L, B, fw), seg(L, B, R, B, fw), seg(R, B, R, T, fw));
  else if (g.F === 'N') (seg(L, B, L, T, fw), seg(L, T, R, T, fw), seg(R, T, R, B, fw));
  else if (g.F === 'R') (seg(R, T, L, T, fw), seg(L, T, L, B, fw), seg(L, B, R, B, fw));
  else if (g.F === 'L') (seg(L, T, R, T, fw), seg(R, T, R, B, fw), seg(R, B, L, B, fw));
  else if (g.F === 'V') (seg(L, T, L, B, fw), seg(R, T, R, B, fw));
  for (const [a, b] of g.l) {
    const [xa, ya] = cell(a);
    const [xb, yb] = cell(b);
    seg(xa, ya, xb, yb, lw);
  }
  const rp = (g.s ? 4.2 : 7) * k;
  for (const i of g.p) st.push({ dot: cell(i), d: Math.max(2, Math.round((g.big.includes(i) ? 10 * k : rp) * 2)) + thick });
  for (const i of g.ring) st.push({ ring: cell(i), d: Math.max(4, Math.round(20 * k)) + thick });
  const len = (s: St) => ('a' in s ? Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]) : 'dot' in s ? S * 0.6 : S * 1.2);
  const total = st.reduce((a, s) => a + len(s), 0);
  let left = f * total;
  ctx.fillStyle = color;
  for (const s of st) {
    if (left <= 0) break;
    const l = len(s);
    const u = Math.min(1, left / l);
    left -= l;
    if ('a' in s) plot(ctx, s.a[0], s.a[1], s.a[0] + (s.b[0] - s.a[0]) * u, s.a[1] + (s.b[1] - s.a[1]) * u, s.w);
    else if ('dot' in s) {
      const d = Math.max(1, Math.round(s.d * Math.min(1, u * 1.6)));
      ctx.fillRect(Math.round(s.dot[0] - d / 2), Math.round(s.dot[1] - d / 2), d, d);
    } else {
      const d = s.d;
      const x0 = Math.round(s.ring[0] - d / 2);
      const y0 = Math.round(s.ring[1] - d / 2);
      const t = Math.max(1, 1 + Math.round(thick / 2));
      // o anel se fecha no sentido horário
      const p4 = u * 4;
      if (p4 > 0) ctx.fillRect(x0, y0, Math.round(d * Math.min(1, p4)), t);
      if (p4 > 1) ctx.fillRect(x0 + d - t, y0, t, Math.round(d * Math.min(1, p4 - 1)));
      if (p4 > 2) ctx.fillRect(x0 + d - Math.round(d * Math.min(1, p4 - 2)), y0 + d - t, Math.round(d * Math.min(1, p4 - 2)), t);
      if (p4 > 3) ctx.fillRect(x0, y0 + d - Math.round(d * Math.min(1, p4 - 3)), t, Math.round(d * Math.min(1, p4 - 3)));
    }
  }
}

// Pontos AO LONGO dos traços de um símbolo (px do canvas), a cada `step` px, na ordem da escrita, com `u` = fração da escrita (0..1) em que
// o traço passa ali. As chamas e as brasas de uma frase acesa nascem nesses pontos (scene/burnline.ts).
export function glyphSamples(g: GlyphDef, cx: number, cy: number, size: number, step: number): { x: number; y: number; u: number }[] {
  const k = size / 130;
  const S = 34 * k;
  const cell = (i: number): [number, number] => [cx + ((i % 3) - 1) * S, cy + (Math.floor(i / 3) - 1) * S];
  const h = 56 * k;
  const L = cx - h;
  const R = cx + h;
  const T = cy - h;
  const B = cy + h;
  const segs: [number, number, number, number][] = [];
  if (g.F === 'full') segs.push([L, T, R, T], [R, T, R, B], [R, B, L, B], [L, B, L, T]);
  else if (g.F === 'U') segs.push([L, T, L, B], [L, B, R, B], [R, B, R, T]);
  else if (g.F === 'N') segs.push([L, B, L, T], [L, T, R, T], [R, T, R, B]);
  else if (g.F === 'R') segs.push([R, T, L, T], [L, T, L, B], [L, B, R, B]);
  else if (g.F === 'L') segs.push([L, T, R, T], [R, T, R, B], [R, B, L, B]);
  else if (g.F === 'V') segs.push([L, T, L, B], [R, T, R, B]);
  for (const [a, b] of g.l) segs.push([...cell(a), ...cell(b)]);
  const items: ({ s: [number, number, number, number] } | { p: [number, number] })[] = [...segs.map((s) => ({ s })), ...g.p.map((i) => ({ p: cell(i) })), ...g.ring.map((i) => ({ p: cell(i) }))];
  const len = (it: (typeof items)[number]) => ('s' in it ? Math.hypot(it.s[2] - it.s[0], it.s[3] - it.s[1]) : S * 0.6);
  const total = items.reduce((a, it) => a + len(it), 0) || 1;
  const out: { x: number; y: number; u: number }[] = [];
  let acc = 0;
  for (const it of items) {
    const l = len(it);
    if ('s' in it) {
      const n = Math.max(1, Math.round(l / step));
      for (let j = 0; j < n; j++) {
        const f = (j + 0.5) / n;
        out.push({ x: it.s[0] + (it.s[2] - it.s[0]) * f, y: it.s[1] + (it.s[3] - it.s[1]) * f, u: (acc + l * f) / total });
      }
    } else out.push({ x: it.p[0], y: it.p[1], u: (acc + l * 0.5) / total });
    acc += l;
  }
  return out;
}

// uma palavra inteira (as compostas viram uma sequência de símbolos) dentro de uma caixa w x h
export function drawWord(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, w: number, h: number, color: string) {
  const parts = glyphsOf(id);
  if (!parts.length) return;
  const n = parts.length;
  const size = Math.min(h / 0.86, w / n / 0.86);
  const slot = w / n;
  parts.forEach((g, i) => drawGlyph(ctx, g, Math.round(x + slot * (i + 0.5)), Math.round(y + h / 2), size, color));
}
