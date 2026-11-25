// ESPAÇOS DE JOGO E SALVAMENTO (INTERFACE.md §2). Três espaços; cada um guarda, com o prefixo `mdd-slotN-`:
//   progress (marcos), diary (anotações, carimbos, mapa à mão, folhas), quiz (perguntas do dado), sketch (desenhos do dado já mostrados)
//   e meta (onde o jogador está, tempo de jogo, gemas, miniatura, data).
// As CONFIGURAÇÕES não entram no espaço: valem para o aparelho (story/config.ts).
// O espaço ativo fica em `mdd-slot`. Trocar de espaço recarrega a página (as lojas leem o espaço ao carregar o módulo).
// Este módulo é importado antes das lojas (progress, diary, quiz), então a migração dos saves antigos acontece antes de elas lerem.
import { createStore } from './store';

export const SLOTS = 3;
const ACTIVE = 'mdd-slot';
const PLAY = 'mdd-play'; // (sessionStorage) "depois de recarregar, entre direto no jogo"
const PARTS = ['progress', 'diary', 'quiz', 'sketch', 'meta'] as const;
type Part = (typeof PARTS)[number];

const ls = {
  get(k: string) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* sem armazenamento: o jogo segue sem salvar */
    }
  },
  del(k: string) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ok */
    }
  },
};

export const keyOf = (slot: number, part: Part) => `mdd-slot${slot}-${part}`;

let active = Math.min(SLOTS, Math.max(1, Number(ls.get(ACTIVE)) || 1));

// saves antigos (antes dos espaços): vão para o espaço 1, se ele estiver vazio
(() => {
  const legacy: Record<string, Part> = { 'mdd-progress-v1': 'progress', 'mdd-diary-v1': 'diary', 'mdd-quiz-v1': 'quiz', 'mdd-sketch-v1': 'sketch' };
  const any = Object.keys(legacy).some((k) => ls.get(k) !== null);
  if (!any) return;
  const empty = PARTS.every((p) => ls.get(keyOf(1, p)) === null);
  for (const [k, p] of Object.entries(legacy)) {
    const v = ls.get(k);
    if (v !== null && empty) ls.set(keyOf(1, p), v);
    ls.del(k);
  }
})();

// a chave de uma parte no espaço ativo
export const slotKey = (part: Exclude<Part, 'meta'>) => keyOf(active, part);

// ── o resumo de um espaço (o que a tela de espaços mostra e de onde o jogo continua) ──
export interface SlotMeta {
  room: number; // índice da sala
  roomName: string;
  x: number;
  z: number;
  feet: number;
  yaw: number;
  solvedHere: boolean; // a sala já estava resolvida quando salvou
  bonus: number[]; // salas cujo segredo (gema) já foi achado
  time: number; // segundos de jogo
  chapter: number;
  at: number; // data (ms)
  thumb?: string; // miniatura (data URL)
}

export function readMeta(slot: number): SlotMeta | null {
  const raw = ls.get(keyOf(slot, 'meta'));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SlotMeta;
  } catch {
    return null;
  }
}
// um espaço está ocupado se tem resumo ou progresso
export const occupied = (slot: number) => readMeta(slot) !== null || ls.get(keyOf(slot, 'progress')) !== null;

// "salvando…": um contador que a interface observa (o dadinho girando no canto)
export const saveStore = createStore(0);
let persist = true;

export const saves = {
  active: () => active,
  meta: () => readMeta(active),
  occupied,
  // grava o resumo do espaço ativo
  writeMeta(m: SlotMeta) {
    if (!persist) return;
    ls.set(keyOf(active, 'meta'), JSON.stringify(m));
    saveStore.set((n) => n + 1);
  },
  // escolhe o espaço e recarrega já dentro do jogo
  play(slot: number) {
    ls.set(ACTIVE, String(slot));
    try {
      sessionStorage.setItem(PLAY, '1');
    } catch {
      /* ok */
    }
    location.replace(location.pathname + location.search);
  },
  // novo jogo num espaço (apaga o que havia nele)
  newGame(slot: number) {
    persist = false; // o que está na memória (outro jogo) não grava mais por cima de nada
    for (const p of PARTS) ls.del(keyOf(slot, p));
    saves.play(slot);
  },
  erase(slot: number) {
    for (const p of PARTS) ls.del(keyOf(slot, p));
    if (slot === active) persist = false;
  },
  // ao abrir a página: entrar direto no jogo (depois de escolher um espaço) em vez de mostrar a tela inicial?
  consumePlay() {
    try {
      const v = sessionStorage.getItem(PLAY);
      sessionStorage.removeItem(PLAY);
      return v === '1';
    } catch {
      return false;
    }
  },
  noSave() {
    persist = false;
  },
  saving: () => persist,
};
