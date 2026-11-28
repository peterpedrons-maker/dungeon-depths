import { LEX } from './lexicon';
import { slotKey } from './save';
import { createStore } from './store';

// O diário do jogador: guarda o que ele viu e o que ele mesmo anotou. NUNCA diz se uma anotação está certa.
const KEY = slotKey('diary');

export interface Seen {
  room: string;
  at: number;
}

// Um traço de escrita livre no mapa: pontos em meios-pixels da página (x0, y0, x1, y1...), por andar e cor.
export interface Stroke {
  f: number; // andar
  c: number; // caneta
  p: number[];
}

// Um carimbo: um símbolo já avistado, colocado no mapa (centro em pixels da página dupla).
export interface Stamp {
  f: number; // andar
  id: string; // símbolo (do dicionário)
  x: number;
  y: number;
}

export const MAX_STROKES = 220;
export const MAX_STROKE_POINTS = 5000;
export const MAX_STAMPS = 120;

export interface DiaryState {
  seen: Record<string, Seen>; // símbolos avistados
  order: string[]; // na ordem em que foram avistados
  notes: Record<string, string>; // "o que eu acho que significa"
  free: string; // anotações livres
  texts: string[]; // textos de lore achados
  pages: string[]; // páginas arrancadas do caderno dela que o jogador achou e encaixou de volta
  gems: string[]; // as gemas, na ordem em que foram achadas (cada uma num furo do dado do fundo do caderno; story/gems.ts)
  herKnown?: boolean; // já leu o relato e sabe que o caderno era DELA, outra condenada (antes disso o índice não diz "Dela")
  newPage?: string | null; // a folha dela que acabou de ser achada e ainda não foi lida: o botão do caderno pulsa e ele abre nela (DESIGN.md §78)
  rooms: string[]; // salas visitadas (para o mapa)
  strokes: Stroke[]; // o que o jogador escreveu à mão no mapa
  stamps: Stamp[]; // símbolos já avistados que o jogador carimbou no mapa
  here: string; // sala atual
  unread: number; // símbolos novos desde a última vez que abriu
  last: { id: string; n: number } | null; // o último símbolo avistado (para o aviso na tela)
  // a CÓPIA (DESIGN.md §101): a última frase que o jogador copiou para o caderno (abrindo-o enquanto lia), com o lugar de onde veio
  copy?: { lines: string[][]; from: 'parede' | 'conversa'; room: string; chalk?: boolean } | null; // (DESIGN.md §101; '' = lacuna)
}

const empty: DiaryState = { seen: {}, order: [], notes: {}, free: '', texts: [], pages: [], gems: [], rooms: [], strokes: [], stamps: [], here: '', unread: 0, last: null };

function load(): DiaryState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...empty, ...JSON.parse(raw), last: null };
  } catch {
    /* sem armazenamento ou dado corrompido: começa vazio */
  }
  return empty;
}

let persist = true;
let counter = 0;
export const diaryStore = createStore<DiaryState>(load());
diaryStore.subscribe(() => {
  if (!persist) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(diaryStore.get()));
  } catch {
    /* ok */
  }
});

export const diary = {
  markSeen(id: string, room?: string) {
    if (!LEX[id] || diaryStore.get().seen[id]) return;
    diaryStore.set((s) => ({
      ...s,
      seen: { ...s.seen, [id]: { room: room || s.here, at: Date.now() } },
      order: [...s.order, id],
      unread: s.unread + 1,
      last: { id, n: ++counter },
    }));
  },
  setNote(id: string, text: string) {
    diaryStore.set((s) => ({ ...s, notes: { ...s.notes, [id]: text } }));
  },
  // copiar para o caderno: os símbolos da cópia contam como vistos (copiar é ler)
  setCopy(c: { lines: string[][]; from: 'parede' | 'conversa'; room: string; chalk?: boolean }) {
    for (const l of c.lines) for (const id of l) if (id) diary.markSeen(id, c.room);
    diaryStore.set((s) => ({ ...s, copy: c }));
  },
  setFree(text: string) {
    diaryStore.set((s) => ({ ...s, free: text }));
  },
  addText(id: string) {
    if (diaryStore.get().texts.includes(id)) return;
    diaryStore.set((s) => ({ ...s, texts: [...s.texts, id], unread: s.unread + 1 }));
  },
  addPage(id: string) {
    if (diaryStore.get().pages.includes(id)) return;
    diaryStore.set((s) => ({ ...s, pages: [...s.pages, id], unread: s.unread + 1, newPage: id }));
  },
  // o caderno abriu na folha nova: ela foi lida
  readPage() {
    if (diaryStore.get().newPage) diaryStore.set((s) => ({ ...s, newPage: null }));
  },
  // true se a gema é nova (vai para o próximo furo do fundo do caderno)
  addGem(id: string): boolean {
    if ((diaryStore.get().gems ?? []).includes(id)) return false;
    diaryStore.set((s) => ({ ...s, gems: [...(s.gems ?? []), id] }));
    return true;
  },
  hasGem: (id: string) => (diaryStore.get().gems ?? []).includes(id),
  // leu o relato: a partir daqui o caderno é "dela"
  knowHer() {
    if (!diaryStore.get().herKnown) diaryStore.set((s) => ({ ...s, herKnown: true }));
  },
  visitRoom(name: string) {
    diaryStore.set((s) => ({ ...s, here: name, rooms: s.rooms.includes(name) ? s.rooms : [...s.rooms, name] }));
  },
  addStroke(st: Stroke) {
    diaryStore.set((s) => {
      const pts = s.strokes.reduce((n, x) => n + x.p.length / 2, 0);
      if (s.strokes.length >= MAX_STROKES || pts + st.p.length / 2 > MAX_STROKE_POINTS) return s;
      return { ...s, strokes: [...s.strokes, st] };
    });
  },
  removeStrokes(indices: number[]) {
    if (!indices.length) return;
    const drop = new Set(indices);
    diaryStore.set((s) => ({ ...s, strokes: s.strokes.filter((_, i) => !drop.has(i)) }));
  },
  // só símbolos que o jogador já avistou podem virar carimbo
  addStamp(st: Stamp) {
    diaryStore.set((s) => {
      if (!s.seen[st.id] || s.stamps.length >= MAX_STAMPS) return s;
      return { ...s, stamps: [...s.stamps, st] };
    });
  },
  removeStamps(indices: number[]) {
    if (!indices.length) return;
    const drop = new Set(indices);
    diaryStore.set((s) => ({ ...s, stamps: s.stamps.filter((_, i) => !drop.has(i)) }));
  },
  // pré-visualização do mapa grande (?demo=mapa)
  demoMap(rooms: string[], here: string, strokes: Stroke[], stamps: Stamp[] = []) {
    diaryStore.set((s) => ({ ...s, rooms, here, strokes, stamps }));
  },
  clearUnread() {
    if (diaryStore.get().unread) diaryStore.set((s) => ({ ...s, unread: 0 }));
  },
  // para de gravar no aparelho (usado ao recomeçar o jogo do zero)
  noSave() {
    persist = false;
  },
  // Sala de teste (?lab=1): os símbolos da sala já estão no diário, sem gravar no aparelho.
  lab(ids: string[]) {
    persist = false;
    const ok = ids.filter((id) => LEX[id]);
    diaryStore.set((s) => ({
      ...s,
      seen: Object.fromEntries(ok.map((id, k) => [id, { room: s.here || 'Sala 1 · A Placa que Julga', at: k }])),
      order: ok,
      unread: 0,
    }));
  },
  // Pré-visualização (?demo=1): enche o diário com exemplos, sem gravar no aparelho.
  demo() {
    persist = false;
    const ids = ['acender', 'brasa', 'n1', 'n2', 'n3', 'porta', 'voce', 'conf', 'boato', 'eu', 'ter', 'medo', 'escrivao', 'boatodado', 'igual', 'placa'];
    diaryStore.set((s) => ({
      ...s,
      seen: Object.fromEntries(ids.map((id, k) => [id, { room: s.here || 'Sala 5 · A Entrada', at: k }])),
      order: ids,
      notes: { acender: 'acender? fogo?', n3: 'três', porta: 'porta (acho)', eu: 'ele sempre começa com isso… "eu"?' }, // i18n-ok (?demo=1: anotações de exemplo, como as que o jogador escreve)
      texts: ['demo-pagina'],
      pages: ['p2'],
      herKnown: true,
      gems: ['cisterna', 'papel', 'c6', 'demo4'],
      unread: 0,
    }));
  },
};
