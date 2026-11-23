import { LEX } from './lexicon';
import { createStore } from './store';

// O diário do jogador: guarda o que ele viu e o que ele mesmo anotou. NUNCA diz se uma anotação está certa.
const KEY = 'mdd-diary-v1';

export interface Seen {
  room: string;
  at: number;
}

export interface DiaryState {
  seen: Record<string, Seen>; // símbolos avistados
  order: string[]; // na ordem em que foram avistados
  notes: Record<string, string>; // "o que eu acho que significa"
  free: string; // anotações livres
  texts: string[]; // textos de lore achados
  rooms: string[]; // salas visitadas (para o mapa)
  here: string; // sala atual
  unread: number; // símbolos novos desde a última vez que abriu
  last: { id: string; n: number } | null; // o último símbolo avistado (para o aviso na tela)
}

const empty: DiaryState = { seen: {}, order: [], notes: {}, free: '', texts: [], rooms: [], here: '', unread: 0, last: null };

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
  setFree(text: string) {
    diaryStore.set((s) => ({ ...s, free: text }));
  },
  addText(id: string) {
    if (diaryStore.get().texts.includes(id)) return;
    diaryStore.set((s) => ({ ...s, texts: [...s.texts, id], unread: s.unread + 1 }));
  },
  visitRoom(name: string) {
    diaryStore.set((s) => ({ ...s, here: name, rooms: s.rooms.includes(name) ? s.rooms : [...s.rooms, name] }));
  },
  clearUnread() {
    if (diaryStore.get().unread) diaryStore.set((s) => ({ ...s, unread: 0 }));
  },
  // Pré-visualização (?demo=1): enche o diário com exemplos, sem gravar no aparelho.
  demo() {
    persist = false;
    const ids = ['acender', 'brasa', 'n1', 'n2', 'n3', 'porta', 'voce', 'conf', 'boato', 'eu', 'ter', 'medo', 'escrivao', 'boatodado', 'igual', 'placa'];
    diaryStore.set((s) => ({
      ...s,
      seen: Object.fromEntries(ids.map((id, k) => [id, { room: s.here || 'Sala 1 · A Entrada', at: k }])),
      order: ids,
      notes: { acender: 'acender? fogo?', n3: 'três', porta: 'porta (acho)', eu: 'ele sempre começa com isso… "eu"?' },
      texts: ['demo-pagina'],
      unread: 0,
    }));
  },
};
