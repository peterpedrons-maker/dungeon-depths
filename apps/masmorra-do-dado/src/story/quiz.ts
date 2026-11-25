import { diary, diaryStore } from './diary';
import { slotKey } from './save';
import { createStore } from './store';

// AS PERGUNTAS DO DADO (DESIGN.md §42): de tempos em tempos, num momento calmo, o dado treme, vem ao centro da tela, mostra um glifo e
// pergunta «VOCÊ SABER ?». O jogador escolhe entre 4 significados e "não sei". É o único lugar do jogo onde alguém diz se ele acertou
// (o diário continua sem corrigir: a escolha entra na página do glifo, certa ou errada, do mesmo jeito).
const KEY = slotKey('quiz');

// Onde a pergunta acontece: no CORREDOR depois da sala (`after`) ou na CHEGADA a uma área livre (`arrive`: a sala diz o ponto com `Room.calm`).
export interface QuizDef {
  id: string;
  word: string; // o glifo perguntado
  right: string;
  wrong: [string, string, string];
  // nome da sala (sem o número) e o momento; `null` = a sala dessa pergunta ainda não existe no jogo
  when: { room: string; at: 'after' | 'arrive' } | null;
}

// As 10 perguntas do capítulo 1 (PUZZLES_PROPOSTAS.md §2e). As opções erradas são palavras da mesma época ou da mesma família de glifo.
export const QUIZ: QuizDef[] = [
  { id: 'q1', word: 'acender', right: 'acender', wrong: ['braseiro', 'fogo', 'dois'], when: { room: 'A Lousa', at: 'after' } },
  { id: 'q2', word: 'n4', right: 'quatro', wrong: ['três', 'cinco', 'cantos'], when: { room: 'Os Nichos e a Cisterna', at: 'arrive' } },
  { id: 'q3', word: 'antes', right: 'antes', wrong: ['depois', 'agora', 'ordem'], when: { room: 'A Casa Escreve', at: 'after' } },
  { id: 'q4', word: 'conf', right: 'confirmado (é verdade)', wrong: ['boato (dizem que)', 'pergunta', 'fim'], when: { room: 'Os Banhos Secos', at: 'arrive' } },
  // a 5ª é na chegada à Biblioteca, que ainda não existe: por enquanto, no corredor depois do Pano
  { id: 'q5', word: 'boato', right: 'boato (dizem que)', wrong: ['mentira', 'confirmado (é verdade)', 'pano'], when: { room: 'O Pano', at: 'after' } },
  { id: 'q6', word: 'depois', right: 'depois', wrong: ['antes', 'longe', 'agora'], when: { room: 'Os Apelidos', at: 'after' } },
  { id: 'q7', word: 'pequeno', right: 'pequeno', wrong: ['um', 'grande', 'meio'], when: { room: 'A Ponte de Madeira', at: 'after' } },
  // a 8ª é na chegada à Galeria dos Condenados (R3), que ainda não existe: por enquanto, no corredor depois do Boato Verdadeiro
  { id: 'q8', word: 'verdade', right: 'verdade', wrong: ['mentira', 'dúvida', 'boato'], when: { room: 'O Boato Verdadeiro', at: 'after' } },
  // a 9ª (Escadaria, R4) e a 10ª (sala 17) esperam salas que ainda não existem
  { id: 'q9', word: 'igual', right: 'igual', wrong: ['dois', 'lei', 'mais'], when: null },
  { id: 'q10', word: 'todos', right: 'todos', wrong: ['nove', 'muitos', 'nenhum'], when: null },
];

export const IDK = 'não sei';
const MAX_TRIES = 3; // depois disso o dado desiste da pergunta

interface Rec {
  tries: number; // quantas vezes já foi perguntada
  ok: boolean; // acertou
  wait: boolean; // errou ou "não sei": espera o jogador LER a palavra de novo em outro lugar
}
type Saved = Record<string, Rec>;

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Saved;
  } catch {
    /* sem armazenamento: começa vazio */
  }
  return {};
}
let saved = load();
let persist = true;
const save = () => {
  if (!persist) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    /* ok */
  }
};
const rec = (id: string): Rec => saved[id] ?? { tries: 0, ok: false, wait: false };

// A pergunta em cena. `phase`: 'glyph' = o glifo sendo escrito; 'ask' = as 5 opções na tela; 'done' = respondida (o dado reage).
export interface QuizLive {
  def: QuizDef;
  options: string[]; // as 4 embaralhadas + "não sei" por último
  phase: 'glyph' | 'ask' | 'done';
  picked: number; // -1 = ainda não
  result: 'ok' | 'bad' | 'idk' | null;
}
export const quizStore = createStore<QuizLive | null>(null);

const shuffle = <T,>(a: T[]): T[] => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

export const quiz = {
  active: () => quizStore.get() !== null,
  // Qual pergunta cabe AGORA? `room` = nome da sala sem o número; `at` = onde o jogador está nela.
  // 1º a pergunta própria do lugar (se ainda não foi feita); senão, uma antiga que voltou (o jogador releu a palavra em outro lugar).
  due(room: string, at: 'after' | 'arrive'): QuizDef | null {
    const seen = diaryStore.get().seen;
    for (const q of QUIZ) {
      if (!q.when || q.when.room !== room || q.when.at !== at) continue;
      const r = rec(q.id);
      if (r.tries === 0 && seen[q.word]) return q;
    }
    for (const q of QUIZ) {
      const r = rec(q.id);
      if (r.tries > 0 && !r.ok && !r.wait && r.tries < MAX_TRIES && seen[q.word]) return q;
    }
    return null;
  },
  // o jogador LEU uma inscrição com esta palavra: as perguntas pendentes dela podem voltar
  wordRead(word: string) {
    let changed = false;
    for (const q of QUIZ) {
      const r = saved[q.id];
      if (q.word === word && r && r.wait && !r.ok && r.tries < MAX_TRIES) {
        r.wait = false;
        changed = true;
      }
    }
    if (changed) save();
  },
  start(def: QuizDef) {
    quizStore.set({ def, options: [...shuffle([def.right, ...def.wrong]), IDK], phase: 'glyph', picked: -1, result: null });
  },
  ask() {
    quizStore.set((s) => (s && s.phase === 'glyph' ? { ...s, phase: 'ask' } : s));
  },
  // a escolha do jogador: vai para o diário (na página do glifo, ABAIXO do que ele já escreveu; "não sei" não escreve nada)
  answer(i: number) {
    const s = quizStore.get();
    if (!s || s.phase !== 'ask' || i < 0 || i >= s.options.length) return;
    const label = s.options[i];
    const result = label === IDK ? 'idk' : label === s.def.right ? 'ok' : 'bad';
    const r = rec(s.def.id);
    saved = { ...saved, [s.def.id]: { tries: r.tries + 1, ok: result === 'ok', wait: result !== 'ok' } };
    save();
    if (result !== 'idk') {
      const old = diaryStore.get().notes[s.def.word] ?? '';
      const has = old.split('\n').some((l) => l.trim() === label);
      if (!has) diary.setNote(s.def.word, old.trim() ? `${old.replace(/\s+$/, '')}\n${label}` : label);
    }
    quizStore.set({ ...s, phase: 'done', picked: i, result });
  },
  end() {
    quizStore.set(null);
  },
  // o dado pediu para APONTAR uma coisa numa área livre (scene/pointask.ts): já foi respondido?
  flag: (id: string) => !!saved[`pt:${id}`]?.ok,
  setFlag(id: string) {
    saved = { ...saved, [`pt:${id}`]: { tries: 1, ok: true, wait: false } };
    save();
  },
  noSave() {
    persist = false;
  },
  // testes
  debug: () => ({ saved, live: quizStore.get() }),
};
