import { FACES } from '../faces';
import type { DiaryState } from '../story/diary';
import { TEXTS } from '../story/texts';
import { ADV, drawCentered, drawChar, drawGlyph, drawText, drawWord, LINE, textWidth, wrap } from './font';
import { MAP_CELL_H, MAP_CELL_W, shortRoom, WORLD } from '../story/worldmap';
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
export interface MarkerKind {
  name: string;
  glyph: string | null; // null = borracha
  color: string;
}
export const MARKERS: MarkerKind[] = [
  { name: 'Marca', glyph: 'X', color: INK },
  { name: 'Perigo', glyph: '!', color: RED },
  { name: 'Dúvida', glyph: '?', color: INK },
  { name: 'Segredo', glyph: '*', color: GOLD },
  { name: 'Porta', glyph: 'D', color: INK },
  { name: 'Apagar', glyph: null, color: INK2 },
];
export const ERASER = 5;
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
  tool: number; // marcador escolhido no mapa (5 = borracha)
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
  } else if (s === lay.mapAt) {
    if (side === 'L') {
      heading(ctx, 'MAPA', side);
      lines(ctx, wrap('Escolha e toque no mapa.', CH), x0, 32, INK2, 2);
      MARKERS.forEach((m, i) => {
        const bx = x0 + (i % 2) * 51;
        const by = 60 + Math.floor(i / 2) * 19;
        const on = view.tool === i;
        if (on) {
          ctx.fillStyle = HILITE;
          ctx.fillRect(bx, by, 49, 16);
        }
        ctx.fillStyle = on ? INK : INK2;
        ctx.fillRect(bx, by, 49, 1);
        ctx.fillRect(bx, by + 15, 49, 1);
        ctx.fillRect(bx, by, 1, 16);
        ctx.fillRect(bx + 48, by, 1, 16);
        if (m.glyph) drawChar(ctx, m.glyph, bx + 4, by + 3, m.color);
        else drawText(ctx, 'x', bx + 4, by + 3, INK2);
        drawText(ctx, m.name, bx + 14, by + 3, INK);
        regions.push({ x: bx, y: by, w: 49, h: 16, id: `tool:${i}` });
      });
      drawText(ctx, 'Você está em:', x0, 126, INK2);
      drawText(ctx, d.here ? shortRoom(d.here) : '-', x0, 137, INK);
    } else {
      // o mapa em si: salas visitadas, ligadas por passagens com portas (norte para cima)
      const ox = x0 + Math.round((CW - 3 * MAP_CELL_W) / 2);
      const oy = 22;
      ctx.fillStyle = 'rgba(122,80,48,0.5)';
      ctx.fillRect(x0 - 2, 12, CW + 4, 1);
      ctx.fillRect(x0 - 2, 143, CW + 4, 1);
      ctx.fillRect(x0 - 2, 12, 1, 132);
      ctx.fillRect(x0 + CW + 1, 12, 1, 132);
      const seen = (key: string) => d.rooms.some((n) => n.startsWith(key));
      const here = (key: string) => !!d.here && d.here.startsWith(key);
      WORLD.forEach((r, i) => {
        if (!seen(r.key)) return;
        const rx = ox + r.x * MAP_CELL_W;
        const ry = oy + r.y * MAP_CELL_H;
        const rw = r.w * MAP_CELL_W;
        const rh = r.h * MAP_CELL_H;
        // passagem até a sala de baixo (a anterior no caminho), se ela também foi visitada
        const below = WORLD[i + 1];
        if (below && seen(below.key)) {
          const cx = rx + Math.round(rw / 2) - 3;
          ctx.fillStyle = INK2;
          ctx.fillRect(cx, ry + rh, 6, (below.y - r.y - r.h) * MAP_CELL_H);
          ctx.fillStyle = HILITE;
          ctx.fillRect(cx + 1, ry + rh, 4, (below.y - r.y - r.h) * MAP_CELL_H);
          ctx.fillStyle = INK; // portas nas pontas da passagem
          ctx.fillRect(cx, ry + rh - 1, 6, 2);
          ctx.fillRect(cx, ry + rh + (below.y - r.y - r.h) * MAP_CELL_H - 1, 6, 2);
        }
        ctx.fillStyle = here(r.key) ? '#f0cf86' : HILITE;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.fillStyle = INK;
        ctx.fillRect(rx, ry, rw, 1);
        ctx.fillRect(rx, ry + rh - 1, rw, 1);
        ctx.fillRect(rx, ry, 1, rh);
        ctx.fillRect(rx + rw - 1, ry, 1, rh);
        // dica do formato
        ctx.fillStyle = INK2;
        if (r.kind === 'stage') ctx.fillRect(rx + 4, ry + Math.round(rh / 2), rw - 8, 1);
        if (r.kind === 'round') {
          ctx.fillRect(rx + Math.round(rw / 2) - 3, ry + Math.round(rh / 2) - 3, 7, 1);
          ctx.fillRect(rx + Math.round(rw / 2) - 3, ry + Math.round(rh / 2) + 3, 7, 1);
          ctx.fillRect(rx + Math.round(rw / 2) - 4, ry + Math.round(rh / 2) - 2, 1, 5);
          ctx.fillRect(rx + Math.round(rw / 2) + 4, ry + Math.round(rh / 2) - 2, 1, 5);
        }
        if (here(r.key)) {
          ctx.fillStyle = RED; // você está aqui
          ctx.fillRect(rx + Math.round(rw / 2) - 1, ry + Math.round(rh / 2) - 1, 4, 4);
        }
      });
      // marcações do jogador
      d.marks.forEach((m) => {
        const mk = MARKERS[m.k] ?? MARKERS[0];
        if (!mk.glyph) return;
        ctx.fillStyle = '#fbe6b8'; // fundo claro: o marcador aparece mesmo em cima de uma sala
        ctx.fillRect(x0 + m.x - 4, 12 + m.y - 5, 9, 11);
        ctx.fillStyle = mk.color;
        ctx.fillRect(x0 + m.x - 4, 12 + m.y - 5, 9, 1);
        ctx.fillRect(x0 + m.x - 4, 12 + m.y + 5, 9, 1);
        ctx.fillRect(x0 + m.x - 4, 12 + m.y - 5, 1, 11);
        ctx.fillRect(x0 + m.x + 4, 12 + m.y - 5, 1, 11);
        drawChar(ctx, mk.glyph, x0 + m.x - 2, 12 + m.y - 7, mk.color);
      });
      if (!d.rooms.length) drawCentered(ctx, 'sem salas ainda', x0 + CW / 2, 70, INK2);
      regions.push({ x: x0 - 2, y: 12, w: CW + 4, h: 132, id: 'map' });
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
