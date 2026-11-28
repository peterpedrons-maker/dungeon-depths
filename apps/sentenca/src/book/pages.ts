import { FACES } from '../faces';
import type { DiaryState, Stroke } from '../story/diary';
import { TEXTS } from '../story/texts';
import { ADV, drawCentered, drawGlyph, drawText, drawWord, LINE, plot, textWidth, wrap } from './font';
import { CELL_H, CELL_W, getWorld, onFloor, shortRoom, type MapRoom } from '../story/worldmap';
import { T, tx } from '../i18n';
import { roomTitle } from '../story/roomnames';

// o que o caderno escreve por conta própria (títulos, índice) e a letra DELA nas páginas vazias, nos três idiomas (src/i18n.ts). As páginas são
// estreitas (16 letras por linha): as traduções foram medidas para caber
// os andares do mapa: térreo (T) e subsolo (S); em inglês G(round) e B(asement), em espanhol B(aja) e S(ótano)
const FLOORS: Record<string, ReturnType<typeof T>> = { T: T('T', 'G', 'B'), S: T('S', 'B', 'S') };
const floorLabel = (k: string) => (FLOORS[k] ? tx(FLOORS[k]) : k);

const P = {
  notebook: T('CADERNO', 'NOTEBOOK', 'CUADERNO'),
  saw: T('O que eu vi.', 'What I saw.', 'Lo que vi.'),
  think: T('O que eu acho.', 'What I think.', 'Lo que creo.'),
  index: T('ÍNDICE', 'INDEX', 'ÍNDICE'),
  hers: T('Dela', 'Hers', 'De ella'),
  leaves: T('Folhas', 'Pages', 'Hojas'),
  symbols: T('Símbolos', 'Symbols', 'Símbolos'),
  faces: T('Faces', 'Faces', 'Caras'),
  texts: T('Textos', 'Texts', 'Textos'),
  map: T('Mapa', 'Map', 'Mapa'),
  notes: T('Notas', 'Notes', 'Notas'),
  gems: T('Gemas', 'Gems', 'Gemas'),
  // a CÓPIA a lápis da frase que ele estava lendo (DESIGN.md §101)
  copy: T('Cópia', 'Copy', 'Copia'),
  COPY: T('CÓPIA', 'COPY', 'COPIA'),
  wall: T('parede', 'wall', 'pared'),
  chalk: T('a giz', 'in chalk', 'a tiza'),
  fromTalk: T('da conversa', 'from a talk', 'de una charla'),
  tapSym: T('toque num símbolo', 'tap a symbol', 'toca un símbolo'),
  toNote: T('para anotar', 'to take notes', 'para anotar'),
  putAway: T('Guardar', 'Put away', 'Guardar'),
  SYMBOLS: T('SÍMBOLOS', 'SYMBOLS', 'SÍMBOLOS'),
  sawLow: T('o que eu vi', 'what I saw', 'lo que vi'),
  seenIn: T('VI EM', 'SEEN IN', 'LO VI EN'),
  aPlace: T('um lugar', 'a place', 'un lugar'),
  whatI: T('O QUE EU ACHO QUE', 'WHAT I THINK', 'LO QUE CREO QUE'),
  means: T('SIGNIFICA', 'IT MEANS', 'SIGNIFICA'),
  thinkDots: T('o que eu acho…', 'what I think…', 'lo que creo…'),
  sawDot: T('o que eu vi.', 'what I saw.', 'lo que vi.'),
  thinkDot: T('o que eu acho.', 'what I think.', 'lo que creo.'),
  FACES: T('FACES', 'FACES', 'CARAS'),
  TEXTS: T('TEXTOS', 'TEXTS', 'TEXTOS'),
  whole: T('frases inteiras, quando eu achar', 'whole sentences, when I find them', 'frases enteras, cuando las encuentre'),
  by: T('de', 'by', 'de'),
  NOTES: T('ANOTAÇÕES', 'NOTES', 'APUNTES'),
};
import { glyphsOf, LEX } from '../story/lexicon';
import { HER_NOTES, HER_PAGES as HER_ALL, HER_RELATO } from '../story/herpages';
// (só as folhas que já existem no jogo: as que ainda não foram escritas não aparecem como buracos nem contam no índice)
const HER_PAGES = HER_ALL.filter((p) => p.body.length > 0);

// Páginas do diário, desenhadas em pixels no próprio papel (nada de interface por cima do livro).
export const PW = 132;
export const PH = 176;
const INK = '#3a2214';
const INK2 = '#7a5030';
const RED = '#a8321a';
const GOLD = '#a87a28';
const STAMP_BLUE = '#2c4a7a';
const HILITE = '#f6d9a0';
const SKY = '#eef1ea'; // o céu visto por um furo do teto (no mapa)
const SEPIA = '#8a5a34'; // a tinta DELA (a que veio antes): sépia desbotada
const PENCIL = 'rgba(70,58,48,0.2)';
const PER_PAGE = 12;
export const NOTE_MAX = 58;
// canetas do mapa (escrita livre); a última é a borracha
export const PENS = [
  { name: 'Tinta', color: '#2a1a12' },
  { name: 'Vermelho', color: RED },
  { name: 'Azul', color: '#2c4a7a' },
  { name: 'Borracha', color: INK2 },
  { name: 'Carimbo', color: STAMP_BLUE },
];
export const ERASER_PEN = 3;
export const STAMP_PEN = 4; // ferramenta "carimbo": põe no mapa um símbolo já avistado
export const FREE_MAX = 440;
export const TRAY_N = 4; // quantos símbolos cabem na bandeja de uma vez

// tamanho (em px do papel) de um carimbo: símbolos compostos ficam mais largos para continuar legíveis
export function stampBox(id: string): { w: number; h: number } {
  const n = Math.max(1, Math.min(3, glyphsOf(id).length));
  return { w: 11 * n, h: 11 };
}
// símbolo escolhido pra carimbar (por padrão, o último avistado) e a primeira posição da bandeja
export function stampChoice(view: View, d: DiaryState): number {
  const n = d.order.length;
  return view.stamp >= 0 && view.stamp < n ? view.stamp : n - 1;
}
export function trayStart(view: View, d: DiaryState): number {
  return Math.max(0, Math.min(view.trayAt, d.order.length - TRAY_N));
}

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
  stamp: number; // índice (na ordem de avistados) do símbolo escolhido pro carimbo; -1 = o último
  trayAt: number; // primeiro símbolo mostrado na bandeja de carimbos
  live: Stroke | null; // traço que está sendo desenhado agora
  editing: 'note' | 'free' | null;
  hover: string | null;
  caret: boolean;
  pulse?: boolean; // modo guiado: o campo de anotação pisca, pedindo uma palavra
  guide?: string | null; // o tutorial do caderno: a região (id) que pisca em ouro, mostrando onde tocar (DESIGN.md §75)
  blink?: boolean;
  hereOff?: boolean; // o "aqui" do mapa pisca devagar: na fase apagada ele não é pintado
  copySel?: number | null; // na CÓPIA: o símbolo tocado (índice na frase copiada); a página da direita vira o lugar de anotar ele
}
// a moldura dourada que pisca em volta de onde o tutorial pede para tocar
function guideFrame(ctx: CanvasRenderingContext2D, regs: Region[], view: View) {
  if (!view.guide || !view.blink) return;
  const r = regs.find((g) => g.id === view.guide);
  if (!r) return;
  const x = Math.round(r.x) - 2;
  const y = Math.round(r.y) - 2;
  const w = Math.round(r.w) + 4;
  const h = Math.round(r.h) + 4;
  ctx.fillStyle = '#c8962e';
  for (const k of [0, 1]) {
    ctx.fillRect(x + k, y + k, w - 2 * k, 1);
    ctx.fillRect(x + k, y + h - 1 - k, w - 2 * k, 1);
    ctx.fillRect(x + k, y + k, 1, h - 2 * k);
    ctx.fillRect(x + w - 1 - k, y + k, 1, h - 2 * k);
  }
}

export interface Layout {
  total: number;
  dictN: number;
  facesAt: number;
  textsAt: number;
  textsN: number;
  herAt: number; // as páginas dela: o RELATO (logo depois do índice, é o que se lê primeiro) e as folhas arrancadas
  herN: number;
  dictAt: number; // os símbolos
  mapAt: number;
  notesAt: number;
  gemsAt: number; // o FIM do caderno: a guarda solta à esquerda e, à direita, a parte dura da capa de trás com o dado aberto (as gemas)
  copyAt: number; // a CÓPIA (a última frase copiada, DESIGN.md §101), logo depois do índice; -1 = ainda nenhuma
}

export function layout(d: DiaryState): Layout {
  // a ordem do caderno é a dela: o índice, o RELATO e as folhas que ela escreveu, os símbolos, as faces, os textos, o mapa e as notas. A CÓPIA
  // (a última frase que o jogador copiou) fica entre o índice e o relato: é o que ele acabou de fazer
  const copyAt = d.copy?.lines.length ? 1 : -1;
  const herAt = copyAt > 0 ? 2 : 1;
  const herN = Math.ceil((HER_RELATO.length + HER_PAGES.length) / 2);
  const dictAt = herAt + herN;
  const dictN = Math.max(1, Math.ceil(d.order.length / PER_PAGE));
  const facesAt = dictAt + dictN;
  const textsAt = facesAt + 1;
  const textsN = Math.max(1, d.texts.length);
  const mapAt = textsAt + textsN;
  const notesAt = mapAt + 1;
  const gemsAt = notesAt + 1;
  return { total: gemsAt + 1, dictN, dictAt, facesAt, textsAt, textsN, herAt, herN, mapAt, notesAt, gemsAt, copyAt };
}
// em que folha (spread) do dicionário fica um símbolo
export function symbolSpread(id: string, d: DiaryState): number {
  const i = d.order.indexOf(id);
  return layout(d).dictAt + Math.max(0, Math.floor(i / PER_PAGE));
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
const papers: Record<string, HTMLCanvasElement> = {};
// ruído suave (manchas largas do papel)
function smooth(seed: number, cell: number) {
  const r = rngf(seed);
  const gw = Math.ceil(PW / cell) + 2;
  const gh = Math.ceil(PH / cell) + 2;
  const g = Array.from({ length: gw * gh }, () => r());
  return (x: number, y: number) => {
    // fora da folha, dá a volta (nunca lê fora da grade)
    const fx = (((x % PW) + PW) % PW) / cell;
    const fy = (((y % PH) + PH) % PH) / cell;
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
// papel envelhecido: fibras, manchas de umidade, pintas de mofo (foxing), beirada gasta e a sombra do lombo.
// `v` = variação da folha (0 = limpa; 1..3 = uma marca de uso diferente: anel de caneca, borrão de tinta, rabisco na margem)
function paper(side: 'L' | 'R', v = 0): HTMLCanvasElement {
  const key = side + v;
  const cached = papers[key];
  if (cached) return cached;
  const c = document.createElement('canvas');
  c.width = PW;
  c.height = PH;
  const ctx = c.getContext('2d')!;
  const r = rngf(side === 'L' ? 41 : 42);
  const big = smooth(side === 'L' ? 7 : 8, 22);
  const mid = smooth(side === 'L' ? 9 : 10, 7);
  const img = ctx.createImageData(PW, PH);
  for (let y = 0; y < PH; y++) {
    for (let x = 0; x < PW; x++) {
      const dSpine = side === 'L' ? PW - 1 - x : x;
      const dEdge = side === 'L' ? x : PW - 1 - x;
      let k = 0.9 + 0.1 * big(x, y) + 0.05 * mid(x, y) + (r() - 0.5) * 0.06;
      if ((x * 7 + y * 3) % 23 === 0 && r() < 0.5) k *= 0.96; // fibras
      // sombra do lombo, suave (o papel afunda para dentro)
      if (dSpine < 22) k *= 0.6 + 0.4 * Math.pow(dSpine / 22, 0.7);
      else if (dSpine < 30) k *= 1.02; // a curva do papel pega um pouco de luz
      // beirada gasta e escurecida (irregular)
      const wob = 2.5 + 2 * mid(y * 0.7, x * 0.3);
      const de = Math.min(dEdge, y, PH - 1 - y);
      if (de < wob + 4) k *= 0.8 + 0.2 * Math.min(1, de / (wob + 4));
      // manchas de umidade
      k *= 1 - 0.09 * Math.max(0, big(y * 0.8 + 30, x * 0.9) - 0.55) * 3;
      const o = (y * PW + x) * 4;
      img.data[o] = Math.min(255, 238 * k);
      img.data[o + 1] = Math.min(255, 196 * k);
      img.data[o + 2] = Math.min(255, 138 * k);
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // pintas de mofo (foxing): grupinhos castanhos
  for (let i = 0; i < 7; i++) {
    const cx = r() * PW;
    const cy = r() * PH;
    const n = 2 + Math.floor(r() * 5);
    for (let k = 0; k < n; k++) {
      ctx.fillStyle = `rgba(140,82,40,${0.18 + r() * 0.22})`;
      ctx.fillRect(Math.round(cx + (r() - 0.5) * 6), Math.round(cy + (r() - 0.5) * 6), 1 + Math.floor(r() * 2), 1);
    }
  }
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = r() < 0.5 ? 'rgba(122,80,48,0.28)' : 'rgba(255,236,190,0.3)';
    ctx.fillRect(Math.floor(r() * PW), Math.floor(r() * PH), 1, 1);
  }
  // marcas de uso, cada uma num canto que o texto não usa
  const rv = rngf(91 + v * 7 + (side === 'L' ? 0 : 3));
  if (v === 1) {
    // anel de caneca (meio fora da folha, no canto de baixo de fora)
    const cx = side === 'L' ? 4 : PW - 5;
    const cy = PH - 18;
    for (let a = 0; a < 260; a++) {
      const ang = (a / 260) * Math.PI * 2;
      const rr = 15 + Math.sin(ang * 3) * 0.6;
      ctx.fillStyle = `rgba(120,64,28,${0.12 + 0.12 * Math.max(0, Math.sin(ang + 1))})`;
      ctx.fillRect(Math.round(cx + Math.cos(ang) * rr), Math.round(cy + Math.sin(ang) * rr), 1, 1);
    }
  } else if (v === 2) {
    // borrão de tinta com respingos (no canto de cima de fora)
    const cx = side === 'L' ? 9 : PW - 10;
    const cy = 7;
    for (let k = 0; k < 26; k++) {
      const a = rv() * Math.PI * 2;
      const d = rv() * rv() * 4;
      ctx.fillStyle = 'rgba(42,26,18,0.7)';
      ctx.fillRect(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), 1, 1);
    }
    for (let k = 0; k < 5; k++) {
      ctx.fillStyle = 'rgba(42,26,18,0.55)';
      ctx.fillRect(Math.round(cx + (rv() - 0.5) * 14), Math.round(cy + rv() * 8), 1, 1);
    }
  } else if (v === 3 && side === 'R') {
    // rabisco na margem de baixo: um dadinho desenhado à mão
    ctx.fillStyle = 'rgba(90,58,34,0.55)';
    const x = 24;
    const y = PH - 25;
    const L = (a: number, b: number, c2: number, d: number) => plot(ctx, x + a, y + b, x + c2, y + d, 1);
    L(0, 3, 6, 0); L(6, 0, 12, 3); L(0, 3, 6, 6); L(6, 6, 12, 3); L(0, 3, 0, 10); L(6, 6, 6, 13); L(12, 3, 12, 10); L(0, 10, 6, 13); L(6, 13, 12, 10);
    ctx.fillRect(x + 6, y + 2, 1, 1);
    ctx.fillRect(x + 2, y + 6, 1, 1);
    ctx.fillRect(x + 4, y + 9, 1, 1);
    ctx.fillRect(x + 9, y + 6, 1, 1);
  } else if (v === 3) {
    // uma chaminha rabiscada
    ctx.fillStyle = 'rgba(90,58,34,0.5)';
    const x = 92;
    const y = PH - 27;
    plot(ctx, x + 3, y, x + 1, y + 5, 1);
    plot(ctx, x + 1, y + 5, x + 3, y + 9, 1);
    plot(ctx, x + 3, y + 9, x + 6, y + 7, 1);
    plot(ctx, x + 6, y + 7, x + 5, y + 3, 1);
    plot(ctx, x + 5, y + 3, x + 3, y, 1);
    plot(ctx, x + 3, y + 5, x + 4, y + 8, 1);
  }
  papers[key] = c;
  return c;
}

// moldura: filete duplo, cantos com um nó de volutas e um losango no meio de cima e de baixo
function corner(ctx: CanvasRenderingContext2D, x: number, y: number, sx: 1 | -1, sy: 1 | -1) {
  ctx.fillStyle = INK;
  ctx.fillRect(x - 1, y - 1, 3, 3);
  ctx.fillStyle = PAPER_BG;
  ctx.fillRect(x, y, 1, 1);
  ctx.fillStyle = INK2;
  // duas volutas que saem do canto, uma para cada lado
  for (const [a, b] of [[3, 0], [4, 0], [5, 1], [5, 2], [4, 3], [0, 3], [0, 4], [1, 5], [2, 5], [3, 4]]) ctx.fillRect(x + a * sx, y + b * sy, 1, 1);
  ctx.fillRect(x + 2 * sx, y + 2 * sy, 1, 1);
}
const PAPER_BG = '#e3bb84';
function diamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, color = INK2) {
  ctx.fillStyle = color;
  ctx.fillRect(cx, cy - 2, 1, 1);
  ctx.fillRect(cx - 1, cy - 1, 3, 1);
  ctx.fillRect(cx - 2, cy, 5, 1);
  ctx.fillRect(cx - 1, cy + 1, 3, 1);
  ctx.fillRect(cx, cy + 2, 1, 1);
}
function frame(ctx: CanvasRenderingContext2D, side: 'L' | 'R') {
  const x0 = side === 'L' ? 6 : 10;
  const x1 = side === 'L' ? PW - 10 : PW - 6;
  ctx.fillStyle = INK2;
  ctx.fillRect(x0, 6, x1 - x0, 1);
  ctx.fillRect(x0, PH - 7, x1 - x0, 1);
  ctx.fillRect(x0, 6, 1, PH - 12);
  ctx.fillRect(x1 - 1, 6, 1, PH - 12);
  // o filete de dentro é pontilhado (mais leve)
  ctx.fillStyle = 'rgba(122,80,48,0.75)';
  for (let x = x0 + 3; x < x1 - 3; x += 2) {
    ctx.fillRect(x, 8, 1, 1);
    ctx.fillRect(x, PH - 9, 1, 1);
  }
  for (let y = 9; y < PH - 9; y += 2) {
    ctx.fillRect(x0 + 2, y, 1, 1);
    ctx.fillRect(x1 - 3, y, 1, 1);
  }
  corner(ctx, x0, 6, 1, 1);
  corner(ctx, x1 - 1, 6, -1, 1);
  corner(ctx, x0, PH - 7, 1, -1);
  corner(ctx, x1 - 1, PH - 7, -1, -1);
  const mx = Math.round((x0 + x1) / 2);
  ctx.fillStyle = PAPER_BG;
  ctx.fillRect(mx - 4, 5, 9, 3);
  ctx.fillRect(mx - 4, PH - 8, 9, 3);
  diamond(ctx, mx, 6, INK2);
  diamond(ctx, mx, PH - 7, INK2);
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
  rule(ctx, Math.round(cx), y + 13, CW / 2 - 8);
}
// fio com as pontas afinando (pontilhado) e um losango no meio
function rule(ctx: CanvasRenderingContext2D, cx: number, y: number, half: number) {
  ctx.fillStyle = INK2;
  ctx.fillRect(cx - half + 6, y, 2 * half - 12, 1);
  for (let k = 0; k < 3; k++) {
    ctx.fillRect(cx - half + k * 2, y, 1, 1);
    ctx.fillRect(cx + half - 1 - k * 2, y, 1, 1);
  }
  ctx.fillStyle = PAPER_BG;
  ctx.fillRect(cx - 4, y, 9, 1);
  diamond(ctx, cx, y, INK);
  ctx.fillStyle = INK2;
  ctx.fillRect(cx - 6, y, 1, 1);
  ctx.fillRect(cx + 6, y, 1, 1);
}

function chrome(ctx: CanvasRenderingContext2D, side: 'L' | 'R', spread: number, lay: Layout, out: Region[], torn = false) {
  if (!torn) {
    frame(ctx, side);
    const num = String(2 * spread + (side === 'L' ? 1 : 2));
    const ncx = PW / 2 + (side === 'L' ? -3 : 3);
    drawCentered(ctx, num, ncx, PH - 20, INK2);
    const nw = textWidth(num) / 2 + 4;
    ctx.fillStyle = INK2;
    ctx.fillRect(Math.round(ncx - nw - 3), PH - 15, 3, 1);
    ctx.fillRect(Math.round(ncx + nw), PH - 15, 3, 1);
  }
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

// o rabisco torto de braseiro que ela fez ao lado de BRASEIRO (sépia, mão tremida)
function herBrazier(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = SEPIA;
  plot(ctx, x + 6, y + 18, x + 7, y + 11, 1);
  plot(ctx, x + 7, y + 11, x + 13, y + 10, 1);
  plot(ctx, x + 13, y + 10, x + 14, y + 18, 1);
  plot(ctx, x + 2, y + 6, x + 6, y + 11, 1);
  plot(ctx, x + 6, y + 11, x + 15, y + 10, 1);
  plot(ctx, x + 15, y + 10, x + 19, y + 5, 1);
  plot(ctx, x + 19, y + 5, x + 3, y + 6, 1);
  plot(ctx, x + 8, y + 5, x + 9, y + 1, 1);
  plot(ctx, x + 9, y + 1, x + 11, y + 4, 1);
  plot(ctx, x + 11, y + 4, x + 13, y, 1);
  plot(ctx, x + 13, y, x + 14, y + 5, 1);
}
// fita adesiva velha prendendo uma folha que voltou para o lugar
function tape(ctx: CanvasRenderingContext2D, side: 'L' | 'R') {
  const x = side === 'L' ? PW - 22 : 6;
  for (const y of [10, PH - 20]) {
    ctx.fillStyle = 'rgba(232,210,140,0.55)';
    ctx.fillRect(x, y, 16, 7);
    ctx.fillStyle = 'rgba(150,110,50,0.35)';
    ctx.fillRect(x, y, 16, 1);
    ctx.fillRect(x, y + 6, 16, 1);
  }
}
// uma folha arrancada: só sobrou um toco rasgado junto do lombo; o resto é a folha de baixo, na sombra
function tornPage(ctx: CanvasRenderingContext2D, side: 'L' | 'R', k: number) {
  const r = rngf(500 + k);
  ctx.fillStyle = 'rgba(70,40,20,0.3)';
  ctx.fillRect(0, 0, PW, PH);
  // o toco: papel claro com a beirada rasgada
  let w = 8;
  for (let y = 0; y < PH; y++) {
    w = Math.max(4, Math.min(13, w + (r() < 0.5 ? -1 : 1) * (r() < 0.6 ? 1 : 0)));
    const x0 = side === 'L' ? PW - w : 0;
    ctx.drawImage(paper(side), x0, y, w, 1, x0, y, w, 1);
    ctx.fillStyle = 'rgba(255,240,200,0.5)'; // a fibra branca do rasgo
    ctx.fillRect(side === 'L' ? x0 : w - 1, y, 1, 1);
    ctx.fillStyle = 'rgba(40,20,8,0.35)'; // a sombra do toco na folha de baixo
    ctx.fillRect(side === 'L' ? x0 - 1 : w, y, 1, 1);
  }
}
// DESGASTE (só visual, sem significado): cada folha tem um pouco de uso. Nada parece glifo: tudo curvo e de mão, nada de pontos em grade ou
// molduras retas. Fica nas beiradas e nos cantos de fora, longe do texto.
function wear(ctx: CanvasRenderingContext2D, side: 'L' | 'R', spread: number) {
  const r = rngf(900 + spread * 13 + (side === 'L' ? 1 : 2));
  const outX = (dx: number) => (side === 'L' ? dx : PW - 1 - dx); // x a partir da beirada de fora
  // borda chamuscada (escura e irregular) na beirada de fora
  if (r() < 0.22) {
    for (let y = 0; y < PH; y++) {
      const d = 1 + Math.floor(2.5 * (0.5 + 0.5 * Math.sin(y * 0.21 + spread)) + r() * 2);
      for (let i = 0; i < d; i++) {
        ctx.fillStyle = `rgba(40,20,8,${0.55 - i * 0.12})`;
        ctx.fillRect(outX(i), y, 1, 1);
      }
    }
  }
  // canto dobrado (em cima ou embaixo, na beirada de fora)
  if (r() < 0.3) {
    const top = r() < 0.5;
    const S = 9;
    for (let j = 0; j < S; j++)
      for (let i = 0; i < S - j; i++) {
        const y = top ? j : PH - 1 - j;
        ctx.fillStyle = i + j === S - 1 ? 'rgba(90,55,25,0.6)' : 'rgba(110,70,35,0.22)';
        ctx.fillRect(outX(i), y, 1, 1);
      }
  }
  // fuligem: uma mancha larga e fraca
  if (r() < 0.35) {
    const cx = outX(4 + r() * 8); // junto da beirada de fora (longe do texto)
    const cy = 30 + r() * (PH - 60);
    const R = 8 + r() * 8;
    for (let k = 0; k < 140; k++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * R;
      ctx.fillStyle = 'rgba(40,30,25,0.06)';
      ctx.fillRect(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d * 0.7), 2, 2);
    }
  }
  // dedo sujo: arcos concêntricos fracos perto da beirada de baixo, do lado de fora
  if (r() < 0.25) {
    const cx = outX(14 + Math.floor(r() * 8));
    const cy = PH - 34 - Math.floor(r() * 30);
    for (let ring = 2; ring < 6; ring++)
      for (let a = 0.3; a < Math.PI * 1.7; a += 0.35) {
        ctx.fillStyle = 'rgba(80,55,35,0.1)';
        ctx.fillRect(Math.round(cx + Math.cos(a) * ring), Math.round(cy + Math.sin(a) * ring * 1.3), 1, 1);
      }
  }
  // um rabisco a lápis no canto de cima de fora: espiral, onda, uma pedra ou uma mão (ou uma palavra riscada)
  const pick = r();
  const ox = side === 'L' ? 11 : PW - 25;
  const oy = 11;
  ctx.fillStyle = PENCIL;
  const curve = (pts: [number, number][]) => {
    for (let i = 1; i < pts.length; i++) plot(ctx, ox + pts[i - 1][0], oy + pts[i - 1][1], ox + pts[i][0], oy + pts[i][1], 1);
  };
  if (pick < 0.18) {
    const pts: [number, number][] = [];
    for (let a = 0; a < Math.PI * 5; a += 0.5) pts.push([7 + Math.cos(a) * a * 0.45, 6 + Math.sin(a) * a * 0.45]);
    curve(pts);
  } else if (pick < 0.34) {
    const pts: [number, number][] = [];
    for (let x = 0; x <= 14; x += 1) pts.push([x, 5 + Math.sin(x * 0.9) * 2.5]);
    curve(pts);
  } else if (pick < 0.48) {
    curve([[2, 9], [1, 5], [4, 2], [9, 1], [13, 4], [13, 9], [9, 11], [4, 11], [2, 9]]); // uma pedra
  } else if (pick < 0.6) {
    curve([[3, 13], [2, 7], [3, 3], [4, 7], [5, 1], [6, 7], [7, 1], [8, 7], [9, 2], [10, 8], [12, 6], [11, 11], [8, 14], [3, 13]]); // uma mão
  } else if (pick < 0.78) {
    // uma "palavra" escrita à mão e riscada (só curvas, não é glifo)
    ctx.fillStyle = 'rgba(122,80,48,0.32)';
    const pts: [number, number][] = [];
    for (let x = 0; x <= 14; x++) pts.push([x, 6 + Math.sin(x * 1.7) * 1.6 + (x % 4 === 0 ? -1 : 0)]);
    curve(pts);
    curve([[-1, 7], [15, 5]]);
  }
}

// um dadinho desenhado (cantos arredondados, os pontos da face); selada = tracejado e um "?" no meio
const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};
function dieFace(ctx: CanvasRenderingContext2D, x: number, y: number, n: number, open: boolean) {
  const S = 16;
  if (open) {
    ctx.fillStyle = 'rgba(90,50,20,0.25)';
    ctx.fillRect(x + 1, y + S, S - 1, 1);
    ctx.fillRect(x + S, y + 1, 1, S - 1);
    ctx.fillStyle = HILITE;
    ctx.fillRect(x + 1, y + 1, S - 2, S - 2);
  }
  ctx.fillStyle = open ? INK : INK2;
  for (let i = 1; i < S - 1; i++) {
    if (open || i % 3 !== 0) {
      ctx.fillRect(x + i, y, 1, 1);
      ctx.fillRect(x + i, y + S - 1, 1, 1);
      ctx.fillRect(x, y + i, 1, 1);
      ctx.fillRect(x + S - 1, y + i, 1, 1);
    }
  }
  if (!open) {
    drawCentered(ctx, '?', x + S / 2, y + 3, INK2);
    return;
  }
  for (const [a, b] of PIPS[n] ?? []) ctx.fillRect(x + 3 + a * 4, y + 3 + b * 4, 2, 2);
}
// os ícones do índice (8x8, a pena de quem escreve à mão)
function indexIcon(ctx: CanvasRenderingContext2D, i: number, x: number, y: number) {
  ctx.fillStyle = INK2;
  const P = (pts: number[][]) => pts.forEach(([a, b]) => ctx.fillRect(x + a, y + b, 1, 1));
  if (i === 0) P([[3, 1], [2, 3], [4, 3], [1, 5], [5, 5], [0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [2, 2], [4, 2], [1, 6], [5, 6], [1, 4], [5, 4], [0, 6], [6, 6]]); // ACENDER (o triângulo)
  else if (i === 1) {
    for (let k = 0; k < 7; k++) P([[k, 1], [k, 7], [0, 1 + k], [6, 1 + k]]);
    P([[2, 3], [4, 5], [3, 4]]);
  } else if (i === 2) {
    // pergaminho enrolado
    for (let k = 1; k < 6; k++) P([[k, 1], [k, 7]]);
    P([[0, 2], [0, 3], [6, 5], [6, 6], [1, 2], [5, 6]]);
    for (let k = 2; k < 7; k++) P([[1, k], [5, k - 1]]);
    P([[2, 3], [3, 3], [2, 5], [4, 5]]);
  } else if (i === 3) {
    // folha arrancada: a beirada rasgada
    P([[1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [2, 7], [3, 7], [5, 2], [6, 3], [5, 4], [6, 5], [5, 6], [4, 7]]);
    ctx.fillStyle = SEPIA;
    P([[3, 3], [3, 5]]);
  } else if (i === 4) {
    // mapa dobrado com um X
    P([[0, 1], [0, 7], [2, 2], [2, 8], [4, 1], [4, 7], [6, 2], [6, 8], [1, 1], [3, 2], [5, 1], [1, 7], [3, 8], [5, 7]]);
    for (let k = 2; k < 7; k++) P([[0, k], [6, k + 1]]);
    ctx.fillStyle = RED;
    P([[2, 4], [4, 6], [3, 5], [4, 4], [2, 6]]);
  } else if (i === 6) {
    // gema lapidada (a coroa e a ponta; nada de losango)
    P([[1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [0, 2], [6, 2], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [1, 4], [5, 4], [2, 5], [4, 5], [3, 6]]);
    ctx.fillStyle = '#2a7a9a';
    P([[2, 2], [3, 4], [3, 5]]);
  } else {
    // pena
    for (let k = 0; k < 7; k++) P([[6 - k, 1 + k]]);
    P([[5, 1], [6, 2], [4, 2], [6, 3], [3, 3], [5, 4], [2, 4], [4, 5]]);
  }
}
// guarda (o avesso da capa): papel vinho escuro, liso, com um padrão miúdo e apagado de losangos e pontinhos dourados,
// e a etiqueta do dono colada: DIÁRIO, o dado e as duas linhas
function endpaper(ctx: CanvasRenderingContext2D, label = true) {
  const img = ctx.createImageData(PW, PH);
  const n = smooth(77, 18);
  const rr = rngf(79);
  for (let y = 0; y < PH; y++)
    for (let x = 0; x < PW; x++) {
      const dSpine = PW - 1 - x;
      let k = (0.88 + 0.12 * n(x, y) + (rr() - 0.5) * 0.05) * (dSpine < 18 ? 0.6 + (0.4 * dSpine) / 18 : 1);
      // o padrão: a cada 12 px um losango vazado, e um ponto no meio de cada vão
      const gx = ((x % 12) + 12) % 12;
      const gy = ((y % 12) + 12) % 12;
      const dd = Math.abs(gx - 6) + Math.abs(gy - 6);
      const gold = dd === 3 || (gx === 0 && gy === 0);
      const o = (y * PW + x) * 4;
      if (gold) k *= 1;
      img.data[o] = (gold ? 150 : 88) * k;
      img.data[o + 1] = (gold ? 108 : 34) * k;
      img.data[o + 2] = (gold ? 62 : 28) * k;
      img.data[o + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  // a dobra do couro por cima das beiradas da guarda
  ctx.fillStyle = '#5a2216';
  ctx.fillRect(0, 0, PW, 4);
  ctx.fillRect(0, PH - 4, PW, 4);
  ctx.fillRect(0, 0, 4, PH);
  ctx.fillStyle = 'rgba(255,190,150,0.25)';
  ctx.fillRect(4, 4, PW - 4, 1);
  ctx.fillRect(4, 4, 1, PH - 8);
  if (!label) return;
  // a etiqueta colada (papel claro, moldura dupla, levemente torta não: reta e limpa, para ler)
  // (CUADERNO e NOTEBOOK têm 8 letras: a etiqueta alarga 6 pixels e o passo das letras aperta 1)
  const nb = tx(P.notebook);
  const long = textWidth(nb, 2) > 86;
  const lx = long ? 14 : 17;
  const ly = 22;
  const lw = long ? 100 : 94;
  const lh = 132;
  ctx.drawImage(paper('L'), 20, 20, lw, lh, lx, ly, lw, lh);
  ctx.fillStyle = 'rgba(10,6,10,0.4)';
  ctx.fillRect(lx + 2, ly + lh, lw, 2);
  ctx.fillRect(lx + lw, ly + 2, 2, lh);
  ctx.fillStyle = INK2;
  ctx.fillRect(lx + 3, ly + 3, lw - 6, 1);
  ctx.fillRect(lx + 3, ly + lh - 4, lw - 6, 1);
  ctx.fillRect(lx + 3, ly + 3, 1, lh - 6);
  ctx.fillRect(lx + lw - 4, ly + 3, 1, lh - 6);
  for (let x = lx + 6; x < lx + lw - 6; x += 2) {
    ctx.fillRect(x, ly + 5, 1, 1);
    ctx.fillRect(x, ly + lh - 6, 1, 1);
  }
  const cx = lx + lw / 2;
  drawCentered(ctx, nb, cx, ly + 12, INK, 2, long ? ADV * 2 - 1 : ADV * 2);
  rule(ctx, Math.round(cx), ly + 36, 32);
  drawGlyph(ctx, LEX.dado.g!, Math.round(cx), ly + 70, 50, INK);
  drawCentered(ctx, tx(P.saw), cx, ly + 102, INK2);
  drawCentered(ctx, tx(P.think), cx, ly + 114, INK2);
}

// o papel de uma folha sem nada escrito (as folhas do meio de um maço virando de uma vez, book3d.ts)
export const blankPaper = (side: 'L' | 'R') => paper(side, 0);

// a linha das folhas dela no índice, ANTES de o personagem ler o relato (ele ainda não sabe de quem é o caderno); depois, "Dela"
export const HER_ROW_BEFORE = P.leaves;
// (saves de antes desta regra: quem já escreveu sobre BRASEIRO no tutorial já leu o relato)
const herKnown = (d: DiaryState) => d.herKnown ?? !!(d.notes?.brasa ?? '').trim();

// o lugar de ANOTAR um símbolo (a página da direita dos Símbolos e da Cópia): o símbolo grande, onde foi visto, a anotação dela (sépia, se
// houver) e as linhas do jogador
function noteEditor(ctx: CanvasRenderingContext2D, x0: number, cur: string, d: DiaryState, view: View, regions: Region[]) {
  const cx = x0 + CW / 2;
  drawWord(ctx, cur, x0 + 8, 14, CW - 16, 36, INK); // o símbolo direto no papel, sem caixa
  heading(ctx, tx(P.seenIn), 'R', 54);
  drawCentered(ctx, d.seen[cur]?.room ? shortRoom(roomTitle(d.seen[cur].room)) : tx(P.aPlace), cx, 71, INK);
  drawCentered(ctx, tx(P.whatI), cx, 85, INK);
  drawCentered(ctx, tx(P.means), cx, 95, INK);
  ctx.fillStyle = INK2;
  ctx.fillRect(x0 + 10, 106, CW - 20, 1);
  ctx.fillRect(Math.round(cx) - 1, 105, 3, 3);
  // a anotação DELA (tinta sépia, não se apaga): a 1ª linha, com o rabisco ao lado
  const her = HER_NOTES[cur];
  let by = 110;
  let nl = 4;
  if (her) {
    drawText(ctx, tx(her.text), x0 + 1, by, SEPIA);
    if (her.doodle === 'brasa') herBrazier(ctx, x0 + CW - 26, by - 4);
    by += LINE + 4;
    nl = 3;
  }
  // área de anotação pautada (a do jogador)
  const editing = view.editing === 'note';
  ctx.fillStyle = editing ? RED : 'rgba(122,80,48,0.45)';
  for (let i = 0; i < nl; i++) ctx.fillRect(x0, by + i * LINE + 9, CW, 1);
  if (view.pulse) {
    // modo guiado: o campo pisca em dourado pedindo uma palavra
    ctx.fillStyle = GOLD;
    ctx.fillRect(x0 - 2, by - 3, CW + 4, 1);
    ctx.fillRect(x0 - 2, by + nl * LINE + 2, CW + 4, 1);
    ctx.fillRect(x0 - 2, by - 3, 1, nl * LINE + 6);
    ctx.fillRect(x0 + CW + 1, by - 3, 1, nl * LINE + 6);
  }
  const note = d.notes[cur] ?? '';
  const txt = note + (editing && view.caret ? '_' : '');
  if (!note && !editing) drawText(ctx, tx(P.thinkDots), x0 + 1, by, INK2);
  lines(ctx, wrap(txt, CH), x0 + 1, by, INK, nl);
  regions.push({ x: x0 - 2, y: by - 2, w: CW + 4, h: nl * LINE + 4, id: 'edit:note' });
}

// A CÓPIA (DESIGN.md §101): a frase que o jogador estava lendo quando abriu o caderno (ou as falas da última conversa), copiada a lápis, com a
// anotação DELE embaixo de cada símbolo (a última linha; nada anotado = um pontilhado esperando). Cada frase começa numa fileira nova, dois
// símbolos por fileira: três fileiras na página da esquerda e quatro na da direita. Tocar num símbolo faz a página da direita virar o lugar
// de anotar ele (tocar de novo volta para a cópia).
const COPY_ROWS_L = [46, 80, 114];
const COPY_ROWS_R = [16, 52, 88, 124];
export function copyCells(d: DiaryState): { id: string; side: 'L' | 'R'; row: number; col: number }[] {
  const out: { id: string; side: 'L' | 'R'; row: number; col: number }[] = [];
  let r = 0;
  const cap = COPY_ROWS_L.length + COPY_ROWS_R.length;
  for (const line of d.copy?.lines ?? []) {
    for (let k = 0; k < line.length && r < cap; k += 2, r++) {
      for (let c = 0; c < 2 && k + c < line.length; c++) {
        const L = r < COPY_ROWS_L.length;
        out.push({ id: line[k + c], side: L ? 'L' : 'R', row: L ? COPY_ROWS_L[r] : COPY_ROWS_R[r - COPY_ROWS_L.length], col: c });
      }
    }
  }
  return out;
}
function renderCopy(ctx: CanvasRenderingContext2D, side: 'L' | 'R', x0: number, d: DiaryState, view: View, regions: Region[]) {
  const cells = copyCells(d);
  const sel = view.copySel != null && cells[view.copySel] ? view.copySel : null;
  if (side === 'L') {
    heading(ctx, tx(P.COPY), side);
    // de onde ele copiou ("parede, Sala 24" cabe nos 16 caracteres da linha)
    // (a giz: o giz é a pista de que a frase é boato, a cópia não pode perder isso)
    const from = d.copy!.from === 'parede' ? `${tx(d.copy!.chalk ? P.chalk : P.wall)}, ${shortRoom(roomTitle(d.copy!.room || ''))}` : tx(P.fromTalk);
    drawCentered(ctx, from.length > 16 ? `${from.slice(0, 15)}…` : from, x0 + CW / 2, 31, INK2);
  }
  if (side === 'R' && sel !== null) {
    noteEditor(ctx, x0, cells[sel].id, d, view, regions);
    return;
  }
  cells.forEach((c, i) => {
    if (c.side !== side) return;
    const cx = x0 + c.col * 52;
    const cy = c.row;
    if (!c.id) {
      // a LACUNA da escrita: um quadrado vazio, como na pedra (nunca preenchido com o que estiver aceso)
      ctx.fillStyle = INK;
      ctx.fillRect(cx + 16, cy + 1, 16, 1);
      ctx.fillRect(cx + 16, cy + 16, 16, 1);
      ctx.fillRect(cx + 16, cy + 1, 1, 16);
      ctx.fillRect(cx + 31, cy + 1, 1, 16);
      return;
    }
    if (sel === i) {
      ctx.fillStyle = HILITE;
      ctx.fillRect(cx - 1, cy - 1, 50, 34);
    }
    drawWord(ctx, c.id, cx + 3, cy, 42, 20, INK);
    // a anotação dele, a lápis, cortada no que cabe (8 letras)
    const raw = (d.notes[c.id] ?? '').split('\n').map((l) => l.trim()).filter(Boolean).pop() ?? '';
    if (raw) {
      const t = raw.length > 8 ? `${raw.slice(0, 7).trimEnd()}…` : raw;
      drawCentered(ctx, t, cx + 24, cy + 22, INK);
    } else {
      ctx.fillStyle = INK2;
      for (let px = cx + 10; px < cx + 39; px += 3) ctx.fillRect(px, cy + 29, 1, 1);
    }
    regions.push({ x: cx - 1, y: cy - 1, w: 50, h: 34, id: `csel:${i}` });
  });
  // (cópia curta: a página da direita fica livre, com um lembrete a lápis de que dá para anotar ali)
  if (side === 'R' && sel === null && !cells.some((c) => c.side === 'R')) {
    drawCentered(ctx, tx(P.tapSym), x0 + CW / 2, 70, INK2);
    drawCentered(ctx, tx(P.toNote), x0 + CW / 2, 80, INK2);
  }
}

// leva a lista de regiões a sério: dá para clicar em quase tudo que está escrito
export function renderPage(ctx: CanvasRenderingContext2D, side: 'L' | 'R', view: View, d: DiaryState, lay: Layout): Region[] {
  if (view.spread === lay.mapAt) return renderMapHalf(ctx, side, view, d, lay);
  ctx.clearRect(0, 0, PW, PH);
  const regions: Region[] = [];
  const x0 = X0(side);
  const s = view.spread;
  if (s === 0 && side === 'L') {
    // a contracapa por dentro: papel marmorizado (guarda) com a etiqueta do dono colada
    endpaper(ctx);
    return regions;
  }
  if (s === lay.gemsAt) {
    // o fim do caderno: à esquerda a guarda solta (o mesmo papel vinho, sem etiqueta), com a seta e o índice em ouro gasto para voltar;
    // à direita, a parte dura da capa de trás (desenhada à parte: book/bookart.ts, drawGemBoard)
    endpaper(ctx, false);
    if (side === 'L') {
      arrow(ctx, 14, PH - 19, -1, GOLD);
      regions.push({ x: 8, y: PH - 24, w: 16, h: 14, id: 'prev' });
      ctx.fillStyle = GOLD;
      for (let i = 0; i < 3; i++) ctx.fillRect(30, PH - 19 + i * 2, 7, 1);
      regions.push({ x: 26, y: PH - 24, w: 16, h: 14, id: 'goto:0' });
      const hv = regions.find((r) => r.id === view.hover);
      if (hv) {
        ctx.fillStyle = HILITE;
        ctx.fillRect(hv.x, hv.y + hv.h - 1, hv.w, 1);
      }
    }
    return regions;
  }
  ctx.drawImage(paper(side, s === 0 ? 0 : (s * 5 + (side === 'L' ? 0 : 2)) % 4), 0, 0); // cada folha com a sua marca de uso (ou nenhuma)
  const HR = HER_RELATO.length;
  const hk = s >= lay.herAt && s < lay.dictAt ? (s - lay.herAt) * 2 + (side === 'L' ? 0 : 1) : -1;
  const torn = hk >= HR && hk - HR < HER_PAGES.length && !(d.pages ?? []).includes(HER_PAGES[hk - HR].id);
  if (!torn && s > 0) wear(ctx, side, s); // o caderno é usado: rasuras, fuligem, cantos dobrados, lápis apagado
  chrome(ctx, side, view.spread, lay, regions, torn);

  if (s === 0) {
    {
      drawCentered(ctx, tx(P.index), PW / 2 + 4, 18, INK, 2);
      ctx.fillStyle = INK2;
      ctx.fillRect(x0 + 8, 40, CW - 16, 1);
      // [rótulo, contagem, folha, ícone]
      const rows: [string, string, number, number][] = [
        [tx(herKnown(d) ? P.hers : HER_ROW_BEFORE), `${(d.pages ?? []).length}/${HER_PAGES.length}`, lay.herAt, 3],
        [tx(P.symbols), `${d.order.length}`, lay.dictAt, 0],
        [tx(P.faces), `${FACES.filter((f) => f.unlocked).length}/6`, lay.facesAt, 1],
        [tx(P.texts), `${d.texts.length}`, lay.textsAt, 2],
        [tx(P.map), `${d.rooms.length}`, lay.mapAt, 4],
        [tx(P.notes), '', lay.notesAt, 5],
        [tx(P.gems), `${(d.gems ?? []).length}/21`, lay.gemsAt, 6],
      ];
      if (lay.copyAt > 0) rows.unshift([tx(P.copy), '', lay.copyAt, 2]);
      const step = rows.length > 7 ? 11 : 12;
      rows.forEach(([label, n, to, ico], i) => {
        const y = 46 + i * step;
        indexIcon(ctx, ico, x0 + 1, y);
        drawText(ctx, label, x0 + 12, y, INK);
        if (n) drawText(ctx, n, x0 + CW - textWidth(n) - 2, y, INK2);
        // pontilhado
        ctx.fillStyle = INK2;
        const a = x0 + 12 + textWidth(label) + 4;
        const b = x0 + CW - textWidth(n) - 6;
        for (let px = a; px < b; px += 3) ctx.fillRect(px, y + 9, 1, 1);
        regions.push({ x: x0 - 2, y: y - 2, w: CW + 4, h: 12, id: `goto:${to}` });
      });
      ctx.fillStyle = INK2;
      ctx.fillRect(x0 + 8, 137, CW - 16, 1);
      drawCentered(ctx, tx(P.putAway), x0 + CW / 2, 141, INK2);
      regions.push({ x: x0, y: 139, w: CW, h: 13, id: 'close' });
    }
  } else if (s >= lay.dictAt && s < lay.facesAt) {
    const page = s - lay.dictAt;
    const items = d.order.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
    const cur = view.sel && d.seen[view.sel] ? view.sel : (d.order[0] ?? null);
    if (side === 'L') {
      heading(ctx, tx(P.SYMBOLS), side);
      if (!items.length) {
        lines(ctx, wrap(tx(P.sawLow), CH), x0, 44, SEPIA, 10); // (a letra dela: o caderno não explica nada)
      } else {
        items.forEach((id, i) => {
          const cx = x0 + (i % 3) * 35;
          const cy = 34 + Math.floor(i / 3) * 28;
          ctx.fillStyle = 'rgba(90,50,20,0.22)'; // sombrinha: o cartão está colado no papel
          ctx.fillRect(cx + 1, cy + 26, 32, 1);
          ctx.fillRect(cx + 32, cy + 1, 1, 26);
          ctx.fillStyle = cur === id ? HILITE : 'rgba(250,226,180,0.45)';
          ctx.fillRect(cx, cy, 32, 26);
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
      noteEditor(ctx, x0, cur, d, view, regions);
    } else {
      lines(ctx, wrap(tx(P.sawDot), CH), x0, 30, SEPIA, 2);
      lines(ctx, wrap(tx(P.thinkDot), CH), x0, 44, SEPIA, 2);
    }
  } else if (s === lay.copyAt && d.copy) {
    renderCopy(ctx, side, x0, d, view, regions);
  } else if (s === lay.facesAt) {
    // as faces, sem explicação: o nome das que o dado já tem; nas outras, só o "?" dela
    if (side === 'L') heading(ctx, tx(P.FACES), side);
    const list = side === 'L' ? FACES.slice(0, 3) : FACES.slice(3, 6);
    list.forEach((f, i) => {
      const y = 32 + i * 40;
      dieFace(ctx, x0, y, f.n, f.unlocked);
      drawText(ctx, f.unlocked ? tx(f.name) : '?', x0 + 22, y + 1, f.unlocked ? INK : SEPIA);
    });
  } else if (s >= lay.herAt && s < lay.dictAt) {
    // as páginas DELA: o relato (as duas primeiras, para no meio da frase) e, depois, as folhas arrancadas (buracos até serem achadas)
    const k = (s - lay.herAt) * 2 + (side === 'L' ? 0 : 1);
    if (k < HER_RELATO.length) {
      lines(ctx, HER_RELATO[k].flatMap((p) => ['', ...wrap(tx(p), CH)]).slice(1), x0, 18, SEPIA, 13);
    } else if (k - HER_RELATO.length < HER_PAGES.length) {
      const pg = HER_PAGES[k - HER_RELATO.length];
      if ((d.pages ?? []).includes(pg.id)) {
        tape(ctx, side);
        lines(ctx, pg.body.flatMap((p) => ['', ...wrap(tx(p), CH)]).slice(1), x0, 18, SEPIA, 13);
      } else tornPage(ctx, side, k);
    }
  } else if (s >= lay.textsAt && s < lay.mapAt) {
    const entry = d.texts.length ? TEXTS[d.texts[s - lay.textsAt]] : null;
    if (!entry) {
      if (side === 'L') {
        heading(ctx, tx(P.TEXTS), side);
        lines(ctx, wrap(tx(P.whole), CH), x0, 44, SEPIA, 10);
      }
    } else {
      const all = [tx(entry.title), `${tx(P.by)} ${tx(entry.by)}`, '', ...entry.body.flatMap((p) => ['', ...wrap(tx(p), CH)])];
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
      heading(ctx, tx(P.NOTES), side);
      lines(ctx, all.length || editing ? all : wrap('...', CH), x0, 34, all.length || editing ? INK : INK2, 12);
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

  guideFrame(ctx, regions, view);
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
export const mapOrigin = () => {
  const w = getWorld();
  if (w.px) return { ox: MAP_AREA.x + Math.round((MAP_AREA.w - w.px.pw) / 2), oy: MAP_AREA.y + Math.round((MAP_AREA.h - w.px.ph) / 2) };
  return { ox: Math.round((2 * PW - w.cols * CELL_W) / 2), oy: 24 };
};

let memo: { d: DiaryState; sig: string; cvs: HTMLCanvasElement; regs: Region[]; note: HereNote | null } | null = null;

function drawStroke(ctx: CanvasRenderingContext2D, st: Stroke) {
  ctx.fillStyle = (PENS[st.c] ?? PENS[0]).color;
  if (st.p.length === 2) ctx.fillRect(Math.round(st.p[0] / 2), Math.round(st.p[1] / 2), 1, 1);
  for (let i = 2; i < st.p.length; i += 2) plot(ctx, st.p[i - 2] / 2, st.p[i - 1] / 2, st.p[i] / 2, st.p[i + 1 - 0] / 2, 1);
}

function drawRoom(ctx: CanvasRenderingContext2D, r: MapRoom, ox: number, oy: number, here: boolean, px = false) {
  // (mapa em pixels: a sala do tamanho dela; em células: a grade de sempre)
  if (px && r.parts?.length) {
    // a forma de verdade: a união dos retângulos, com o contorno só por fora
    const P = r.parts.map((q) => [Math.round(ox + q.x), Math.round(oy + q.y), Math.round(ox + q.x + q.w), Math.round(oy + q.y + q.h)]);
    const x0 = Math.min(...P.map((q) => q[0]));
    const y0 = Math.min(...P.map((q) => q[1]));
    const W = Math.max(...P.map((q) => q[2])) - x0 + 1;
    const H = Math.max(...P.map((q) => q[3])) - y0 + 1;
    const m = new Uint8Array(W * H);
    for (const [a, b, c, d] of P) for (let y = b; y < d; y++) for (let x = a; x < c; x++) m[(y - y0) * W + (x - x0)] = 1;
    const at = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && m[y * W + x] === 1;
    ctx.fillStyle = here ? '#f0cf86' : HILITE;
    for (const [a, b, c, d] of P) ctx.fillRect(a, b, c - a, d - b);
    ctx.fillStyle = INK;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) && (!at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1))) ctx.fillRect(x0 + x, y0 + y, 1, 1);
    drawHoles(ctx, r, ox, oy);
    return;
  }
  const rx = px ? Math.round(ox + r.x) : ox + r.x * CELL_W;
  const ry = px ? Math.round(oy + r.y) : oy + r.y * CELL_H;
  const rw = px ? Math.max(3, Math.round(ox + r.x + r.w) - rx) : r.w * CELL_W;
  const rh = px ? Math.max(3, Math.round(oy + r.y + r.h) - ry) : r.h * CELL_H;
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
  if (px) drawHoles(ctx, r, ox, oy);
}

// OS FUROS no mapa (DESIGN.md §73, passo 4): cada furo redondo de luz do teto vira um círculo pequeno (5 px, mais ou menos o tamanho dele com o
// aro), de tinta, com o céu claro dentro. Um por sala; os de um grupo de salas formam uma face do dado (no capítulo 1: 1, 2 e 3)
function drawHoles(ctx: CanvasRenderingContext2D, r: MapRoom, ox: number, oy: number) {
  for (const h of r.holes ?? []) {
    const x = Math.round(ox + h.x);
    const y = Math.round(oy + h.y);
    ctx.fillStyle = INK;
    ctx.fillRect(x - 1, y - 2, 3, 1);
    ctx.fillRect(x - 1, y + 2, 3, 1);
    ctx.fillRect(x - 2, y - 1, 1, 3);
    ctx.fillRect(x + 2, y - 1, 1, 3);
    ctx.fillStyle = SKY;
    ctx.fillRect(x - 1, y - 1, 3, 3);
  }
}

// "AQUI" (pedido do Pedro): escrito em vermelho FORA da sala, num pedaço vazio do papel, com uma seta CURVA até ela (a seta reta é palavra
// da língua da Casa: INTERFACE.md §6), e PISCANDO devagar (o vermelho é também uma caneta do jogador: o que pisca é do caderno, não dele).
// Nada por cima da sala, nem do furo de luz. O lugar: o mais perto da sala onde a palavra fica só em papel (não cobre sala, corredor nem a dobra
// do livro) e a seta passa por cima do mínimo possível. Sem lugar nenhum (não acontece no capítulo 1), um quadradinho no meio da sala.
// Aqui só se CALCULA (pixels da seta e onde vai a palavra); quem mostra a página pinta (`paintHereNote`), na fase acesa do piscar.
interface HereNote {
  pix: [number, number][]; // a seta (ou o quadradinho)
  text: { s: string; x: number; y: number } | null;
}
function placeHereNote(cx: CanvasRenderingContext2D, r: MapRoom, ox: number, oy: number, px: boolean): HereNote {
  // a caixa da sala no papel ([x0, y0, x1, y1), com o contorno)
  let bx0: number, by0: number, bx1: number, by1: number;
  if (px && r.parts?.length) {
    const P = r.parts.map((q) => [Math.round(ox + q.x), Math.round(oy + q.y), Math.round(ox + q.x + q.w) + 1, Math.round(oy + q.y + q.h) + 1]);
    [bx0, by0, bx1, by1] = [Math.min(...P.map((q) => q[0])), Math.min(...P.map((q) => q[1])), Math.max(...P.map((q) => q[2])), Math.max(...P.map((q) => q[3]))];
  } else if (px) {
    bx0 = Math.round(ox + r.x);
    by0 = Math.round(oy + r.y);
    bx1 = bx0 + Math.max(3, Math.round(ox + r.x + r.w) - bx0);
    by1 = by0 + Math.max(3, Math.round(oy + r.y + r.h) - by0);
  } else {
    bx0 = ox + r.x * CELL_W;
    by0 = oy + r.y * CELL_H;
    bx1 = bx0 + r.w * CELL_W;
    by1 = by0 + r.h * CELL_H;
  }
  const W = cx.canvas.width;
  const img = cx.getImageData(0, 0, W, cx.canvas.height).data;
  const DRAWN = new Set([INK, INK2, HILITE, '#f0cf86', SKY, RED, GOLD].map((h) => parseInt(h.slice(1), 16)));
  const A = MAP_AREA;
  // ocupado: fora da área do mapa, na dobra do livro, ou sala/corredor/tinta já desenhados
  const busy = (x: number, y: number) => {
    if (x < A.x || y < A.y || x >= A.x + A.w || y >= A.y + A.h || Math.abs(x - PW + 0.5) < 4) return true;
    const o = (y * W + x) * 4;
    return DRAWN.has((img[o] << 16) | (img[o + 1] << 8) | img[o + 2]);
  };
  const freeRect = (x0: number, y0: number, w: number, h: number) => {
    for (let y = y0 - 1; y <= y0 + h; y++) for (let x = x0 - 1; x <= x0 + w; x++) if (busy(x, y)) return false;
    return true;
  };
  // a seta: uma curva (Bézier) de S a E
  const curve = (S: [number, number], E: [number, number]) => {
    const dx = E[0] - S[0];
    const dy = E[1] - S[1];
    const len = Math.hypot(dx, dy) || 1;
    const C: [number, number] = [(S[0] + E[0]) / 2 - (dy / len) * len * 0.28, (S[1] + E[1]) / 2 + (dx / len) * len * 0.28];
    const pts: [number, number][] = [];
    const n = Math.ceil(len * 3);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = Math.round((1 - t) * (1 - t) * S[0] + 2 * (1 - t) * t * C[0] + t * t * E[0]);
      const y = Math.round((1 - t) * (1 - t) * S[1] + 2 * (1 - t) * t * C[1] + t * t * E[1]);
      const last = pts[pts.length - 1];
      if (!last || last[0] !== x || last[1] !== y) pts.push([x, y]);
    }
    return pts;
  };
  const WORD = 'aqui';
  const tw = textWidth(WORD) - 1;
  const th = 8;
  const mx = (bx0 + bx1) / 2;
  const my = (by0 + by1) / 2;
  let best: { lx: number; ly: number; pts: [number, number][]; cost: number } | null = null;
  for (const side of ['E', 'W', 'S', 'N'] as const) {
    const vert = side === 'N' || side === 'S';
    const span = vert ? tw + 6 : th + 10;
    for (let gap = 9; gap <= 46; gap += 2) {
      for (let sl = -span; sl <= span; sl += 2) {
        let lx: number, ly: number, S: [number, number], E: [number, number];
        if (vert) {
          lx = Math.round(mx - tw / 2 + sl);
          ly = side === 'N' ? by0 - gap - th : by1 + gap;
          S = [lx + Math.round(tw / 2), side === 'N' ? ly + th + 1 : ly - 2];
          E = [Math.max(bx0 + 3, Math.min(bx1 - 4, S[0])), side === 'N' ? by0 - 2 : by1 + 1];
        } else {
          lx = side === 'W' ? bx0 - gap - tw : bx1 + gap;
          ly = Math.round(my - th / 2 + sl);
          S = [side === 'W' ? lx + tw + 1 : lx - 2, ly + Math.round(th / 2)];
          E = [side === 'W' ? bx0 - 2 : bx1 + 1, Math.max(by0 + 3, Math.min(by1 - 4, S[1]))];
        }
        let cost = gap * 2 + Math.abs(sl) * 0.6 + (vert ? 3 : 0);
        if (best && cost >= best.cost) continue;
        if (!freeRect(lx, ly, tw, th)) continue;
        const pts = curve(S, E);
        if (pts.length < 5) continue;
        cost += 6 * pts.filter(([x, y]) => busy(x, y)).length; // (cada ponto da seta por cima de sala ou corredor)
        if (best && cost >= best.cost) continue;
        best = { lx, ly, pts, cost };
      }
    }
  }
  if (!best) {
    const x = Math.floor(mx);
    const y = Math.floor(my);
    const pix: [number, number][] = [];
    for (let j = -1; j < 3; j++) for (let i = -1; i < 3; i++) pix.push([x + i, y + j]);
    return { pix, text: null };
  }
  // a ponta: dois riscos curtos voltando da ponta, abertos para os lados
  const pix = [...best.pts];
  const [ex, ey] = pix[pix.length - 1];
  const [qx, qy] = pix[Math.max(0, pix.length - 4)];
  const dl = Math.hypot(ex - qx, ey - qy) || 1;
  const ux = (ex - qx) / dl;
  const uy = (ey - qy) / dl;
  for (const k of [1, 2]) for (const sg of [-1, 1]) pix.push([Math.round(ex - ux * k + sg * uy * k), Math.round(ey - uy * k - sg * ux * k)]);
  return { pix, text: { s: WORD, x: best.lx, y: best.ly - 2 } };
}
// pinta o "aqui" (dx: o deslocamento da página: a da direita começa em PW)
function paintHereNote(ctx: CanvasRenderingContext2D, n: HereNote, dx: number) {
  ctx.fillStyle = RED;
  for (const [x, y] of n.pix) ctx.fillRect(x + dx, y, 1, 1);
  if (n.text) drawText(ctx, n.text.s, n.text.x + dx, n.text.y, RED);
}

function buildMap(view: View, d: DiaryState, lay: Layout): { cvs: HTMLCanvasElement; regs: Region[]; note: HereNote | null } {
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
  cx.fillStyle = 'rgba(122,80,48,0.75)';
  for (let x = 9; x < W2 - 9; x += 2) {
    cx.fillRect(x, 8, 1, 1);
    cx.fillRect(x, PH - 9, 1, 1);
  }
  for (let y = 9; y < PH - 9; y += 2) {
    cx.fillRect(8, y, 1, 1);
    cx.fillRect(W2 - 9, y, 1, 1);
  }
  corner(cx, 6, 6, 1, 1);
  corner(cx, W2 - 7, 6, -1, 1);
  corner(cx, 6, PH - 7, 1, -1);
  corner(cx, W2 - 7, PH - 7, -1, -1);

  const w = getWorld();
  const fl = currentFloor(view, d);
  const { ox, oy } = mapOrigin();
  regs.push({ x: MAP_AREA.x, y: MAP_AREA.y, w: MAP_AREA.w, h: MAP_AREA.h, id: 'map' });

  // abas dos andares (a chave é 'T'/'S', térreo e subsolo; só o rótulo muda com o idioma)
  w.floors.forEach((key, i) => {
    const label = floorLabel(key);
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
  const roomsHere = w.rooms.filter((r) => onFloor(r, fl));
  const byKey = new Map(w.rooms.map((r) => [r.key, r]));
  // passagens (se uma ponta foi visitada, a passagem aparece)
  if (w.px) {
    // o mundo de verdade: os corredores pelo caminho deles, na largura deles (contorno e miolo)
    for (const l of w.links) {
      if ((l.floor ?? 0) !== fl || (!visited(l.a) && !visited(l.b)) || !l.pts) continue;
      const P = l.pts.map(([x, y]) => [Math.round(ox + x), Math.round(oy + y)] as [number, number]);
      for (const [col, g] of [[INK2, 2], [HILITE, 1]] as [string, number][]) {
        cx.fillStyle = col;
        for (let i = 1; i < P.length; i++) {
          const [x0, y0] = P[i - 1];
          const [x1, y1] = P[i];
          cx.fillRect(Math.min(x0, x1) - g, Math.min(y0, y1) - g, Math.abs(x1 - x0) + 2 * g + 1, Math.abs(y1 - y0) + 2 * g + 1);
        }
      }
    }
  }
  for (const l of w.px ? [] : w.links) {
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
  for (const r of roomsHere) if (visited(r.key)) drawRoom(cx, r, ox, oy, !!d.here && named(r.key, [d.here]), !!w.px);
  if (w.px) {
    // as bocas dos corredores: o miolo do corredor passa por cima do contorno da sala (a porta aberta)
    cx.fillStyle = HILITE;
    for (const l of w.links) {
      if ((l.floor ?? 0) !== fl || !l.pts || l.pts.length < 2) continue;
      for (const [end, key] of [[0, l.a], [l.pts.length - 1, l.b]] as [number, string][]) {
        if (!visited(key)) continue;
        const [x, y] = l.pts[end];
        cx.fillRect(Math.round(ox + x) - 1, Math.round(oy + y) - 1, 3, 3);
      }
    }
  }
  // o "aqui", por fora da sala: só o lugar (depois das salas e dos corredores: ele procura papel vazio); quem mostra a página o pinta, piscando
  const hereRoom = d.here ? roomsHere.find((r) => visited(r.key) && named(r.key, [d.here!])) : undefined;
  const note = hereRoom ? placeHereNote(cx, hereRoom, ox, oy, !!w.px) : null;
  if (!roomsHere.some((r) => visited(r.key))) drawCentered(cx, '...', PW, 78, SEPIA);

  // o que o jogador escreveu à mão
  d.strokes.forEach((st) => st.f === fl && drawStroke(cx, st));
  if (view.live && view.live.f === fl) drawStroke(cx, view.live);
  // carimbos (símbolos já avistados)
  d.stamps.forEach((st) => {
    if (st.f !== fl || !LEX[st.id]) return;
    const b = stampBox(st.id);
    drawWord(cx, st.id, Math.round(st.x - b.w / 2), Math.round(st.y - b.h / 2), b.w, b.h, STAMP_BLUE);
  });

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
    if (i === STAMP_PEN) {
      // ícone de carimbo: cabo e base
      cx.fillStyle = p.color;
      cx.fillRect(bx + 4, PH - 21, 3, 4);
      cx.fillRect(bx + 2, PH - 17, 7, 2);
      cx.fillRect(bx + 1, PH - 14, 9, 1);
    } else if (i < ERASER_PEN) {
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
  const here = d.here ? `${shortRoom(roomTitle(d.here))} - ${floorLabel(w.floors[w.rooms.find((r) => named(r.key, [d.here]))?.floor ?? 0] ?? '')}` : '';
  if (view.pen === STAMP_PEN) {
    // bandeja: só os símbolos que o jogador já avistou (◄ quatro de cada vez ►)
    const n = d.order.length;
    if (!n) {
      drawText(cx, '...', PW + 14, PH - 22, SEPIA);
    } else {
      const first = trayStart(view, d);
      const sel = stampChoice(view, d);
      const ty = PH - 24;
      arrow(cx, PW + 12, ty + 5, -1, first > 0 ? INK : INK2);
      regs.push({ x: PW + 8, y: ty, w: 10, h: 14, id: 'stampnav:-1' });
      for (let k = 0; k < TRAY_N && first + k < n; k++) {
        const i = first + k;
        const x = PW + 20 + k * 19;
        if (i === sel) {
          cx.fillStyle = HILITE;
          cx.fillRect(x, ty, 18, 14);
          cx.fillStyle = INK;
          cx.fillRect(x, ty, 18, 1);
          cx.fillRect(x, ty + 13, 18, 1);
          cx.fillRect(x, ty, 1, 14);
          cx.fillRect(x + 17, ty, 1, 14);
        }
        drawWord(cx, d.order[i], x + 2, ty + 2, 14, 10, STAMP_BLUE);
        regs.push({ x, y: ty, w: 18, h: 14, id: `stamp:${i}` });
      }
      arrow(cx, PW + 20 + TRAY_N * 19 + 5, ty + 5, 1, first + TRAY_N < n ? INK : INK2);
      regs.push({ x: PW + 20 + TRAY_N * 19, y: ty, w: 10, h: 14, id: 'stampnav:1' });
    }
  } else if (here) drawText(cx, here, PW + 20, PH - 22, INK2);
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
  return { cvs, regs, note };
}

// (testes) o mapa inteiro, as duas páginas, num canvas: `floor` = o andar; todas as salas `rooms` como visitadas
export function mapPreview(d: DiaryState, floor: number): HTMLCanvasElement {
  const view: View = { spread: 0, sel: null, pen: 0, floor, stamp: -1, trayAt: 0, live: null, editing: null, hover: null, caret: false };
  const m = buildMap(view, d, layout(d));
  if (m.note) paintHereNote(m.cvs.getContext('2d')!, m.note, 0);
  return m.cvs;
}

function renderMapHalf(ctx: CanvasRenderingContext2D, side: 'L' | 'R', view: View, d: DiaryState, lay: Layout): Region[] {
  const sig = [view.floor, view.pen, view.stamp, view.trayAt, view.hover, view.live ? view.live.p.length : -1, getWorld().rooms.length].join('|');
  if (!memo || memo.d !== d || memo.sig !== sig) memo = { d, sig, ...buildMap(view, d, lay) };
  const off = side === 'L' ? 0 : PW;
  ctx.clearRect(0, 0, PW, PH);
  ctx.drawImage(memo.cvs, off, 0, PW, PH, 0, 0, PW, PH);
  if (memo.note && !view.hereOff) paintHereNote(ctx, memo.note, -off);
  const out: Region[] = [];
  for (const r of memo.regs) {
    const x0 = Math.max(r.x, off);
    const x1 = Math.min(r.x + r.w, off + PW);
    if (x1 > x0) out.push({ ...r, x: x0 - off, w: x1 - x0 });
  }
  guideFrame(ctx, out, view);
  return out;
}
