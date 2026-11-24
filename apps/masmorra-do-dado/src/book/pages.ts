import { FACES } from '../faces';
import type { DiaryState, Stroke } from '../story/diary';
import { TEXTS } from '../story/texts';
import { ADV, drawCentered, drawGlyph, drawText, drawWord, LINE, plot, textWidth, wrap } from './font';
import { CELL_H, CELL_W, getWorld, shortRoom, type MapRoom } from '../story/worldmap';
import { LEX } from '../story/lexicon';

// Páginas do diário, desenhadas em pixels no próprio papel (nada de interface por cima do livro).
export const PW = 132;
export const PH = 176;
const INK = '#3a2214';
const INK2 = '#7a5030';
const RED = '#a8321a';
const GOLD = '#a87a28';
const HILITE = '#f6d9a0';
const PER_PAGE = 12;
// descrições curtas para caber no livro (as faces ainda vão mudar)
const SHORT: Record<number, string> = { 1: 'Quica nas paredes.', 2: 'Aperta placas.', 3: 'Acende o fogo.', 4: 'Troca de lugar.', 5: 'Desliza reto.', 6: 'Atravessa.' };
export const NOTE_MAX = 58;
// canetas do mapa (escrita livre); a última é a borracha
export const PENS = [
  { name: 'Tinta', color: '#2a1a12' },
  { name: 'Vermelho', color: RED },
  { name: 'Azul', color: '#2c4a7a' },
  { name: 'Borracha', color: INK2 },
];
export const ERASER_PEN = 3;
export const FREE_MAX = 440;

export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
  id: string;
}

export interface View {
  spread: number;
  sel: string | null; // símbolo escolhido
  pen: number; // caneta escolhida no mapa
  floor: number | null; // andar do mapa (null = o andar onde o jogador está)
  live: Stroke | null; // traço que está sendo desenhado agora
  editing: 'note' | 'free' | null;
  hover: string | null;
  caret: boolean;
}

export interface Layout {
  total: number;
  dictN: number;
  facesAt: number;
  textsAt: number;
  textsN: number;
  mapAt: number;
  notesAt: number;
}

export function layout(d: DiaryState): Layout {
  const dictN = Math.max(1, Math.ceil(d.order.length / PER_PAGE));
  const facesAt = 1 + dictN;
  const textsAt = facesAt + 1;
  const textsN = Math.max(1, d.texts.length);
  const mapAt = textsAt + textsN;
  const notesAt = mapAt + 1;
  return { total: notesAt + 1, dictN, facesAt, textsAt, textsN, mapAt, notesAt };
}

// ── papel envelhecido (desenhado uma vez por lado) ──────────────────────
function rngf(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const papers: Partial<Record<'L' | 'R', HTMLCanvasElement>> = {};
function paper(side: 'L' | 'R'): HTMLCanvasElement {
  const cached = papers[side];
  if (cached) return cached;
  const c = document.createElement('canvas');
  c.width = PW;
  c.height = PH;
  const ctx = c.getContext('2d')!;
  const r = rngf(side === 'L' ? 41 : 42);
  const img = ctx.createImageData(PW, PH);
  for (let y = 0; y < PH; y++) {
    for (let x = 0; x < PW; x++) {
      const dSpine = side === 'L' ? PW - 1 - x : x;
      const dEdge = side === 'L' ? x : PW - 1 - x;
      let k = 0.95 + r() * 0.09;
      if (dSpine < 16) k *= 0.66 + dSpine * 0.021; // sombra do lombo
      if (dEdge < 5) k *= 0.88 + dEdge * 0.02; // borda mais escura
      if (y < 4 || y > PH - 5) k *= 0.93;
      // manchas lentas de umidade
      k *= 1 - 0.1 * Math.max(0, Math.sin(x * 0.11 + y * 0.07 + (side === 'L' ? 1 : 3)) * Math.sin(y * 0.05 - x * 0.04));
      const o = (y * PW + x) * 4;
      img.data[o] = Math.min(255, 236 * k);
      img.data[o + 1] = Math.min(255, 192 * k);
      img.data[o + 2] = Math.min(255, 132 * k);
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // fibras e pontinhos de uso
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = r() < 0.5 ? 'rgba(122,80,48,0.35)' : 'rgba(255,230,170,0.3)';
    ctx.fillRect(Math.floor(r() * PW), Math.floor(r() * PH), 1, 1);
  }
  papers[side] = c;
  return c;
}

// moldura dupla, com os cantos enfeitados
function frame(ctx: CanvasRenderingContext2D, side: 'L' | 'R') {
  const xo = side === 'L' ? 6 : 10; // do lado do lombo a moldura fica mais afastada
  const xi = side === 'L' ? PW - 10 : PW - 6;
  ctx.fillStyle = INK2;
  const x0 = side === 'L' ? 6 : 10;
  const x1 = side === 'L' ? PW - 10 : PW - 6;
  ctx.fillRect(x0, 6, x1 - x0, 1);
  ctx.fillRect(x0, PH - 7, x1 - x0, 1);
  ctx.fillRect(x0, 6, 1, PH - 12);
  ctx.fillRect(x1 - 1, 6, 1, PH - 12);
  ctx.fillRect(x0 + 2, 8, x1 - x0 - 4, 1);
  ctx.fillRect(x0 + 2, PH - 9, x1 - x0 - 4, 1);
  ctx.fillRect(x0 + 2, 8, 1, PH - 16);
  ctx.fillRect(x1 - 3, 8, 1, PH - 16);
  ctx.fillStyle = INK;
  for (const [cx, cy] of [[x0 - 1, 5], [x1 - 2, 5], [x0 - 1, PH - 8], [x1 - 2, PH - 8]]) ctx.fillRect(cx, cy, 3, 3);
  void xo;
  void xi;
}

const X0 = (side: 'L' | 'R') => (side === 'L' ? 13 : 19);
const CW = 100; // largura útil (≈ 16 caracteres)
const CH = Math.floor(CW / ADV);

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, dir: 1 | -1, color: string) {
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const w = i < 3 ? i + 1 : 5 - i;
    const cx = dir === 1 ? x : x + 3 - w;
    ctx.fillRect(cx, y + i, w, 1);
  }
}

function heading(ctx: CanvasRenderingContext2D, text: string, side: 'L' | 'R', y = 14) {
  const cx = X0(side) + CW / 2;
  drawCentered(ctx, text, cx, y, INK);
  ctx.fillStyle = INK2;
  ctx.fillRect(X0(side) + 10, y + 13, CW - 20, 1);
  ctx.fillRect(Math.round(cx) - 1, y + 12, 3, 3);
}

function chrome(ctx: CanvasRenderingContext2D, side: 'L' | 'R', spread: number, lay: Layout, out: Region[]) {
  frame(ctx, side);
  const num = String(2 * spread + (side === 'L' ? 1 : 2));
  drawCentered(ctx, num, PW / 2 + (side === 'L' ? -3 : 3), PH - 20, INK2);
  if (side === 'L' && spread > 0) {
    arrow(ctx, 14, PH - 19, -1, INK);
    out.push({ x: 8, y: PH - 24, w: 16, h: 14, id: 'prev' });
    // índice (três linhas)
    ctx.fillStyle = INK;
    for (let i = 0; i < 3; i++) ctx.fillRect(30, PH - 19 + i * 2, 7, 1);
    out.push({ x: 26, y: PH - 24, w: 16, h: 14, id: 'goto:0' });
  }
  if (side === 'R' && spread < lay.total - 1) {
    arrow(ctx, PW - 20, PH - 19, 1, INK);
    out.push({ x: PW - 26, y: PH - 24, w: 16, h: 14, id: 'next' });
  }
}

const lines = (ctx: CanvasRenderingContext2D, ls: string[], x: number, y: number, color: string, max: number) => {
  ls.slice(0, max).forEach((l, i) => drawText(ctx, l, x, y + i * LINE, color));
};

// leva a lista de regiões a sério: dá para clicar em quase tudo que está escrito
export function renderPage(ctx: CanvasRenderingContext2D, side: 'L' | 'R', view: View, d: DiaryState, lay: Layout): Region[] {
  if (view.spread === lay.mapAt) return renderMapHalf(ctx, side, view, d, lay);
  ctx.clearRect(0, 0, PW, PH);
  ctx.drawImage(paper(side), 0, 0);
  const regions: Region[] = [];
  chrome(ctx, side, view.spread, lay, regions);
  const x0 = X0(side);
  const s = view.spread;

  if (s === 0) {
    if (side === 'L') {
      drawCentered(ctx, 'DIÁRIO', PW / 2 - 2, 26, INK, 2);
      ctx.fillStyle = INK2;
      ctx.fillRect(x0 + 12, 50, CW - 24, 1);
      drawGlyph(ctx, LEX.dado.g!, PW / 2 - 2, 92, 62, INK);
      drawCentered(ctx, 'O que eu vi.', PW / 2 - 2, 134, INK2);
      drawCentered(ctx, 'O que eu acho.', PW / 2 - 2, 146, INK2);
    } else {
      drawCentered(ctx, 'ÍNDICE', PW / 2 + 4, 22, INK, 2);
      ctx.fillStyle = INK2;
      ctx.fillRect(x0 + 8, 44, CW - 16, 1);
      const rows: [string, string, number][] = [
        ['Símbolos', `${d.order.length}`, 1],
        ['Faces', `${FACES.filter((f) => f.unlocked).length}/6`, lay.facesAt],
        ['Textos', `${d.texts.length}`, lay.textsAt],
        ['Mapa', `${d.rooms.length}`, lay.mapAt],
        ['Notas', '', lay.notesAt],
      ];
      rows.forEach(([label, n, to], i) => {
        const y = 54 + i * 17;
        drawText(ctx, label, x0 + 2, y, INK);
        if (n) drawText(ctx, n, x0 + CW - textWidth(n) - 2, y, INK2);
        // pontilhado
        ctx.fillStyle = INK2;
        const a = x0 + 2 + textWidth(label) + 4;
        const b = x0 + CW - textWidth(n) - 6;
        for (let px = a; px < b; px += 3) ctx.fillRect(px, y + 9, 1, 1);
        regions.push({ x: x0 - 2, y: y - 3, w: CW + 4, h: 16, id: `goto:${to}` });
      });
      ctx.fillStyle = INK2;
      ctx.fillRect(x0 + 8, 134, CW - 16, 1);
      drawCentered(ctx, 'Guardar o livro', x0 + CW / 2, 139, INK2);
      regions.push({ x: x0, y: 136, w: CW, h: 14, id: 'close' });
    }
  } else if (s >= 1 && s < lay.facesAt) {
    const page = s - 1;
    const items = d.order.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
    const cur = view.sel && d.seen[view.sel] ? view.sel : (d.order[0] ?? null);
    if (side === 'L') {
      heading(ctx, 'SÍMBOLOS', side);
      if (!items.length) {
        lines(ctx, wrap('Nada ainda. Quando você vir um símbolo, ele entra aqui sozinho.', CH), x0, 44, INK2, 10);
      } else {
        items.forEach((id, i) => {
          const cx = x0 + (i % 3) * 35;
          const cy = 34 + Math.floor(i / 3) * 28;
          if (cur === id) {
            ctx.fillStyle = HILITE;
            ctx.fillRect(cx, cy, 32, 26);
          }
          ctx.fillStyle = cur === id ? INK : INK2;
          ctx.fillRect(cx, cy, 32, 1);
          ctx.fillRect(cx, cy + 25, 32, 1);
          ctx.fillRect(cx, cy, 1, 26);
          ctx.fillRect(cx + 31, cy, 1, 26);
          drawWord(ctx, id, cx + 2, cy + 2, 28, 22, INK);
          if (d.notes[id]?.trim()) {
            ctx.fillStyle = GOLD;
            ctx.fillRect(cx + 26, cy + 3, 3, 3);
          }
          regions.push({ x: cx, y: cy, w: 32, h: 26, id: `sel:${id}` });
        });
      }
    } else if (cur) {
      const cx = x0 + CW / 2;
      drawWord(ctx, cur, x0 + 8, 14, CW - 16, 36, INK); // o símbolo direto no papel, sem caixa
      heading(ctx, 'AVISTADO EM', side, 54);
      drawCentered(ctx, shortRoom(d.seen[cur].room || 'um lugar'), cx, 71, INK);
      drawCentered(ctx, 'O QUE EU ACHO QUE', cx, 85, INK);
      drawCentered(ctx, 'SIGNIFICA', cx, 95, INK);
      ctx.fillStyle = INK2;
      ctx.fillRect(x0 + 10, 106, CW - 20, 1);
      ctx.fillRect(Math.round(cx) - 1, 105, 3, 3);
      // área de anotação pautada (4 linhas)
      const by = 110;
      const editing = view.editing === 'note';
      ctx.fillStyle = editing ? RED : 'rgba(122,80,48,0.45)';
      for (let i = 0; i < 4; i++) ctx.fillRect(x0, by + i * LINE + 9, CW, 1);
      const note = d.notes[cur] ?? '';
      const txt = note + (editing && view.caret ? '_' : '');
      if (!note && !editing) drawText(ctx, 'toque e escreva…', x0 + 1, by, INK2);
      lines(ctx, wrap(txt, CH), x0 + 1, by, INK, 4);
      regions.push({ x: x0 - 2, y: by - 2, w: CW + 4, h: 44, id: 'edit:note' });
    } else {
      lines(ctx, wrap('Os símbolos que você vir pelo caminho ficam guardados aqui, com um espaço para anotar o que acha que significam.', CH), x0, 30, INK2, 12);
    }
  } else if (s === lay.facesAt) {
    heading(ctx, side === 'L' ? 'FACES DO DADO' : 'FACES SELADAS', side);
    const list = side === 'L' ? FACES.slice(0, 3) : FACES.slice(3, 6);
    list.forEach((f, i) => {
      const y = 32 + i * 40;
      ctx.fillStyle = f.unlocked ? INK : INK2;
      ctx.fillRect(x0, y, 16, 1);
      ctx.fillRect(x0, y + 15, 16, 1);
      ctx.fillRect(x0, y, 1, 16);
      ctx.fillRect(x0 + 15, y, 1, 16);
      drawCentered(ctx, String(f.n), x0 + 8, y + 3, f.unlocked ? INK : INK2);
      drawText(ctx, f.unlocked ? f.name : '???', x0 + 22, y + 1, f.unlocked ? INK : INK2);
      lines(ctx, wrap(f.unlocked ? (SHORT[f.n] ?? f.desc) : 'Selada.', 13), x0 + 22, y + 12, INK2, 2);
    });
  } else if (s >= lay.textsAt && s < lay.mapAt) {
    const entry = d.texts.length ? TEXTS[d.texts[s - lay.textsAt]] : null;
    if (!entry) {
      if (side === 'L') {
        heading(ctx, 'TEXTOS', side);
        lines(ctx, wrap('Nada ainda. Diários, bilhetes e páginas soltas que você achar ficam guardados aqui.', CH), x0, 44, INK2, 10);
      }
    } else {
      const all = [entry.title, `de ${entry.by}`, '', ...entry.body.flatMap((p) => ['', ...wrap(p, CH)])];
      const wrapped = all.flatMap((l, i) => (i < 2 ? wrap(l, CH) : [l]));
      const cap = Math.floor((PH - 46) / LINE);
      const part = wrapped.slice(side === 'L' ? 0 : cap, side === 'L' ? cap : cap * 2);
      part.forEach((l, i) => drawText(ctx, l, x0, 16 + i * LINE, side === 'L' && i === 0 ? INK : side === 'L' && i === 1 ? INK2 : INK));
    }
  } else {
    // notas livres: o texto continua da página da esquerda para a da direita
    const editing = view.editing === 'free';
    const all = wrap(d.free + (editing && view.caret ? '_' : ''), CH);
    if (side === 'L') {
      heading(ctx, 'ANOTAÇÕES', side);
      lines(ctx, all.length || editing ? all : wrap('Espaço livre. Toque e escreva o que quiser lembrar.', CH), x0, 34, all.length || editing ? INK : INK2, 12);
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = 'rgba(122,80,48,0.28)';
        ctx.fillRect(x0, 34 + i * LINE + 9, CW, 1);
      }
      regions.push({ x: x0 - 2, y: 30, w: CW + 4, h: 124, id: 'edit:free' });
    } else {
      lines(ctx, all.slice(12), x0, 16, INK, 13);
      for (let i = 0; i < 13; i++) {
        ctx.fillStyle = 'rgba(122,80,48,0.28)';
        ctx.fillRect(x0, 16 + i * LINE + 9, CW, 1);
      }
      regions.push({ x: x0 - 2, y: 12, w: CW + 4, h: 140, id: 'edit:free' });
    }
  }

  // realce da região sob o dedo/mouse
  const hv = regions.find((r) => r.id === view.hover);
  if (hv && !hv.id.startsWith('edit:')) {
    ctx.fillStyle = RED;
    ctx.fillRect(hv.x, hv.y + hv.h - 1, hv.w, 1);
  }
  return regions;
}

// ══ o mapa: ocupa as DUAS páginas, na horizontal ══════════════════════════
const named = (key: string, list: string[]) => list.some((n) => n === key || n.startsWith(`${key} `));

export function currentFloor(view: View, d: DiaryState): number {
  if (view.floor !== null) return view.floor;
  const w = getWorld();
  return w.rooms.find((r) => d.here && named(r.key, [d.here]))?.floor ?? 0;
}

export const MAP_AREA = { x: 10, y: 22, w: 2 * PW - 20, h: 128 };
export const mapOrigin = () => ({ ox: Math.round((2 * PW - getWorld().cols * CELL_W) / 2), oy: 24 });

let memo: { d: DiaryState; sig: string; cvs: HTMLCanvasElement; regs: Region[] } | null = null;

function drawStroke(ctx: CanvasRenderingContext2D, st: Stroke) {
  ctx.fillStyle = (PENS[st.c] ?? PENS[0]).color;
  if (st.p.length === 2) ctx.fillRect(Math.round(st.p[0] / 2), Math.round(st.p[1] / 2), 1, 1);
  for (let i = 2; i < st.p.length; i += 2) plot(ctx, st.p[i - 2] / 2, st.p[i - 1] / 2, st.p[i] / 2, st.p[i + 1 - 0] / 2, 1);
}

function drawRoom(ctx: CanvasRenderingContext2D, r: MapRoom, ox: number, oy: number, here: boolean) {
  const rx = ox + r.x * CELL_W;
  const ry = oy + r.y * CELL_H;
  const rw = r.w * CELL_W;
  const rh = r.h * CELL_H;
  ctx.fillStyle = here ? '#f0cf86' : HILITE;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.fillStyle = r.kind === 'boss' ? RED : INK;
  ctx.fillRect(rx, ry, rw, 1);
  ctx.fillRect(rx, ry + rh - 1, rw, 1);
  ctx.fillRect(rx, ry, 1, rh);
  ctx.fillRect(rx + rw - 1, ry, 1, rh);
  if (r.kind === 'boss') {
    ctx.fillRect(rx + 2, ry + 2, rw - 4, 1);
    ctx.fillRect(rx + 2, ry + rh - 3, rw - 4, 1);
  }
  const cx = rx + Math.floor(rw / 2);
  const cy = ry + Math.floor(rh / 2);
  ctx.fillStyle = INK2;
  if (r.kind === 'stage') ctx.fillRect(rx + 3, cy, rw - 6, 1);
  if (r.kind === 'round') {
    ctx.fillRect(cx - 3, cy - 3, 7, 1);
    ctx.fillRect(cx - 3, cy + 3, 7, 1);
    ctx.fillRect(cx - 4, cy - 2, 1, 5);
    ctx.fillRect(cx + 4, cy - 2, 1, 5);
  }
  if (r.kind === 'save') {
    ctx.fillStyle = GOLD;
    ctx.fillRect(cx - 1, cy - 1, 3, 3);
  }
  // escadas: triângulos pequenos nos cantos
  ctx.fillStyle = INK;
  (r.stairs ?? []).forEach((st, i) => {
    const tx = rx + 3 + i * 8;
    const ty = ry + 3;
    for (let k = 0; k < 4; k++) {
      const w = st === 'up' ? 1 + 2 * k : 1 + 2 * (3 - k);
      const x = st === 'up' ? tx + 3 - k : tx + k;
      ctx.fillRect(x, ty + k, w, 1);
    }
  });
  if (here) {
    ctx.fillStyle = RED;
    ctx.fillRect(cx - 1, cy - 1, 4, 4);
  }
}

function buildMap(view: View, d: DiaryState, lay: Layout): { cvs: HTMLCanvasElement; regs: Region[] } {
  void lay;
  const cvs = document.createElement('canvas');
  cvs.width = 2 * PW;
  cvs.height = PH;
  const cx = cvs.getContext('2d')!;
  cx.drawImage(paper('L'), 0, 0);
  cx.drawImage(paper('R'), PW, 0);
  const regs: Region[] = [];
  const W2 = 2 * PW;
  // uma moldura só, para as duas páginas
  cx.fillStyle = INK2;
  cx.fillRect(6, 6, W2 - 12, 1);
  cx.fillRect(6, PH - 7, W2 - 12, 1);
  cx.fillRect(6, 6, 1, PH - 12);
  cx.fillRect(W2 - 7, 6, 1, PH - 12);
  cx.fillRect(8, 8, W2 - 16, 1);
  cx.fillRect(8, PH - 9, W2 - 16, 1);
  cx.fillRect(8, 8, 1, PH - 16);
  cx.fillRect(W2 - 9, 8, 1, PH - 16);
  cx.fillStyle = INK;
  for (const [x, y] of [[5, 5], [W2 - 8, 5], [5, PH - 8], [W2 - 8, PH - 8]]) cx.fillRect(x, y, 3, 3);

  const w = getWorld();
  const fl = currentFloor(view, d);
  const { ox, oy } = mapOrigin();
  regs.push({ x: MAP_AREA.x, y: MAP_AREA.y, w: MAP_AREA.w, h: MAP_AREA.h, id: 'map' });

  // abas dos andares
  w.floors.forEach((label, i) => {
    const bx = 14 + i * 22;
    const on = i === fl;
    if (on) {
      cx.fillStyle = HILITE;
      cx.fillRect(bx, 11, 19, 11);
    }
    cx.fillStyle = on ? INK : INK2;
    cx.fillRect(bx, 11, 19, 1);
    cx.fillRect(bx, 21, 19, 1);
    cx.fillRect(bx, 11, 1, 11);
    cx.fillRect(bx + 18, 11, 1, 11);
    drawText(cx, label, bx + 4, 10, on ? INK : INK2);
    regs.push({ x: bx, y: 11, w: 19, h: 11, id: `floor:${i}` });
  });
  const visited = (key: string) => named(key, d.rooms);
  const roomsHere = w.rooms.filter((r) => r.floor === fl);
  const byKey = new Map(w.rooms.map((r) => [r.key, r]));
  // passagens (se uma ponta foi visitada, a passagem aparece)
  for (const l of w.links) {
    const a = byKey.get(l.a)!;
    const b = byKey.get(l.b)!;
    if (a.floor !== fl || (!visited(a.key) && !visited(b.key))) continue;
    const pts = l.path.map(([x, y]) => [ox + x * CELL_W + CELL_W / 2, oy + y * CELL_H + CELL_H / 2] as [number, number]);
    cx.fillStyle = INK2;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      cx.fillRect(Math.floor(Math.min(x0, x1)) - 1, Math.floor(Math.min(y0, y1)) - 1, Math.abs(x1 - x0) + 3, Math.abs(y1 - y0) + 3);
    }
    cx.fillStyle = HILITE;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      cx.fillRect(Math.floor(Math.min(x0, x1)), Math.floor(Math.min(y0, y1)), Math.abs(x1 - x0) + 1, Math.abs(y1 - y0) + 1);
    }
    // portas nas pontas (vermelha = trancada)
    cx.fillStyle = l.locked ? RED : INK;
    for (const [c, room] of [[l.path[0], a], [l.path[l.path.length - 1], b]] as [[number, number], MapRoom][]) {
      const px = ox + c[0] * CELL_W;
      const py = oy + c[1] * CELL_H;
      const horiz = c[0] >= room.x + room.w || c[0] < room.x;
      if (horiz) cx.fillRect(c[0] >= room.x + room.w ? px - 1 : px + CELL_W - 1, py, 2, CELL_H);
      else cx.fillRect(px, c[1] >= room.y + room.h ? py - 1 : py + CELL_H - 1, CELL_W, 2);
    }
  }
  for (const r of roomsHere) if (visited(r.key)) drawRoom(cx, r, ox, oy, !!d.here && named(r.key, [d.here]));
  if (!roomsHere.some((r) => visited(r.key))) drawCentered(cx, 'Nada explorado neste andar.', PW, 78, INK2);

  // o que o jogador escreveu à mão
  d.strokes.forEach((st) => st.f === fl && drawStroke(cx, st));
  if (view.live && view.live.f === fl) drawStroke(cx, view.live);

  // rodapé pequeno: canetas e onde você está
  PENS.forEach((p, i) => {
    const bx = 50 + i * 15;
    const on = view.pen === i;
    if (on) {
      cx.fillStyle = HILITE;
      cx.fillRect(bx - 1, PH - 23, 13, 12);
    }
    cx.fillStyle = on ? INK : INK2;
    cx.fillRect(bx - 1, PH - 23, 13, 1);
    cx.fillRect(bx - 1, PH - 12, 13, 1);
    cx.fillRect(bx - 1, PH - 23, 1, 12);
    cx.fillRect(bx + 11, PH - 23, 1, 12);
    if (i < ERASER_PEN) {
      cx.fillStyle = p.color;
      cx.fillRect(bx + 2, PH - 20, 7, 6);
    } else {
      cx.fillStyle = INK2;
      for (let k = 0; k < 5; k++) {
        cx.fillRect(bx + 3 + k, PH - 20 + k, 1, 1);
        cx.fillRect(bx + 7 - k, PH - 20 + k, 1, 1);
      }
    }
    regs.push({ x: bx - 1, y: PH - 23, w: 13, h: 12, id: `pen:${i}` });
  });
  const here = d.here ? `${shortRoom(d.here)} - ${w.floors[w.rooms.find((r) => named(r.key, [d.here]))?.floor ?? 0] ?? ''}` : '';
  if (here) drawText(cx, here, PW + 20, PH - 22, INK2);
  // setas (pé da página)
  arrow(cx, 14, PH - 19, -1, INK);
  regs.push({ x: 8, y: PH - 24, w: 16, h: 14, id: 'prev' });
  cx.fillStyle = INK;
  for (let i = 0; i < 3; i++) cx.fillRect(30, PH - 19 + i * 2, 7, 1);
  regs.push({ x: 26, y: PH - 24, w: 16, h: 14, id: 'goto:0' });
  arrow(cx, W2 - 20, PH - 19, 1, INK);
  regs.push({ x: W2 - 26, y: PH - 24, w: 16, h: 14, id: 'next' });
  const hv = regs.find((r) => r.id === view.hover);
  if (hv && hv.id !== 'map') {
    cx.fillStyle = RED;
    cx.fillRect(hv.x, hv.y + hv.h - 1, hv.w, 1);
  }
  return { cvs, regs };
}

function renderMapHalf(ctx: CanvasRenderingContext2D, side: 'L' | 'R', view: View, d: DiaryState, lay: Layout): Region[] {
  const sig = [view.floor, view.pen, view.hover, view.live ? view.live.p.length : -1, getWorld().rooms.length].join('|');
  if (!memo || memo.d !== d || memo.sig !== sig) memo = { d, sig, ...buildMap(view, d, lay) };
  const off = side === 'L' ? 0 : PW;
  ctx.clearRect(0, 0, PW, PH);
  ctx.drawImage(memo.cvs, off, 0, PW, PH, 0, 0, PW, PH);
  const out: Region[] = [];
  for (const r of memo.regs) {
    const x0 = Math.max(r.x, off);
    const x1 = Math.min(r.x + r.w, off + PW);
    if (x1 > x0) out.push({ ...r, x: x0 - off, w: x1 - x0 });
  }
  return out;
}
