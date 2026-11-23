import { FACES } from '../faces';
import type { DiaryState } from '../story/diary';
import { TEXTS } from '../story/texts';
import { ADV, drawCentered, drawText, drawWord, LINE, textWidth, wrap } from './font';
import { drawGlyph } from './font';
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
export const NOTE_MAX = 64;
export const FREE_MAX = 380;

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
      ctx.fillStyle = HILITE;
      ctx.fillRect(x0, 14, CW, 44);
      ctx.fillStyle = INK2;
      ctx.fillRect(x0, 14, CW, 1);
      ctx.fillRect(x0, 57, CW, 1);
      ctx.fillRect(x0, 14, 1, 44);
      ctx.fillRect(x0 + CW - 1, 14, 1, 44);
      drawWord(ctx, cur, x0 + 4, 17, CW - 8, 38, INK);
      drawText(ctx, 'avistado em', x0, 64, INK2);
      lines(ctx, wrap(d.seen[cur].room || 'um lugar que esqueci', CH), x0, 75, INK, 2);
      drawText(ctx, 'O QUE EU ACHO QUE', x0, 98, INK2);
      drawText(ctx, 'SIGNIFICA:', x0, 109, INK2);
      // caixa de anotação (pautada)
      const by = 122;
      const editing = view.editing === 'note';
      ctx.fillStyle = editing ? RED : INK2;
      ctx.fillRect(x0 - 2, by - 2, CW + 4, 1);
      ctx.fillRect(x0 - 2, by + 33, CW + 4, 1);
      ctx.fillRect(x0 - 2, by - 2, 1, 36);
      ctx.fillRect(x0 + CW + 1, by - 2, 1, 36);
      const note = d.notes[cur] ?? '';
      const txt = note + (editing && view.caret ? '_' : '');
      if (!note && !editing) drawText(ctx, 'toque e escreva…', x0 + 1, by + 1, INK2);
      lines(ctx, wrap(txt, CH), x0 + 1, by, INK, 3);
      regions.push({ x: x0 - 2, y: by - 2, w: CW + 4, h: 36, id: 'edit:note' });
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
  } else if (s === lay.mapAt) {
    if (side === 'L') {
      heading(ctx, 'MAPA', side);
      d.rooms.forEach((r, i) => {
        const y = 34 + i * 31;
        const here = d.here === r;
        ctx.fillStyle = here ? HILITE : 'rgba(0,0,0,0)';
        if (here) ctx.fillRect(x0, y, CW, 27);
        ctx.fillStyle = here ? INK : INK2;
        ctx.fillRect(x0, y, CW, 1);
        ctx.fillRect(x0, y + 26, CW, 1);
        ctx.fillRect(x0, y, 1, 27);
        ctx.fillRect(x0 + CW - 1, y, 1, 27);
        lines(ctx, wrap(r, CH - 2), x0 + 4, y + 3, INK, 2);
        if (here) {
          ctx.fillStyle = RED;
          ctx.fillRect(x0 + CW - 9, y + 4, 5, 5);
        }
        if (i > 0) {
          ctx.fillStyle = INK2;
          ctx.fillRect(x0 + CW / 2, y - 4, 1, 4);
        }
      });
    } else {
      lines(ctx, wrap('As salas que você já viu ficam em fila, como o mundo é: uma depois da outra.', CH), x0, 16, INK2, 6);
      if (d.here) {
        drawText(ctx, 'Você está em:', x0, 84, INK2);
        lines(ctx, wrap(d.here, CH), x0, 96, INK, 3);
      }
      lines(ctx, wrap('O desenho do mapa, com as suas marcas de giz, vem depois.', CH), x0, 112, INK2, 4);
    }
  } else {
    // notas livres: o texto continua da página da esquerda para a da direita
    const editing = view.editing === 'free';
    const all = wrap(d.free + (editing && view.caret ? '_' : ''), CH);
    if (side === 'L') {
      heading(ctx, 'ANOTAÇÕES', side);
      lines(ctx, all.length || editing ? all : wrap('Espaço livre. Toque e escreva o que quiser lembrar.', CH), x0, 34, all.length || editing ? INK : INK2, 11);
      for (let i = 0; i < 11; i++) {
        ctx.fillStyle = 'rgba(122,80,48,0.28)';
        ctx.fillRect(x0, 34 + i * LINE + 10, CW, 1);
      }
      regions.push({ x: x0 - 2, y: 30, w: CW + 4, h: 124, id: 'edit:free' });
    } else {
      lines(ctx, all.slice(11), x0, 16, INK, 12);
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = 'rgba(122,80,48,0.28)';
        ctx.fillRect(x0, 16 + i * LINE + 10, CW, 1);
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
