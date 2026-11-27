import { FACES } from '../faces';
import { slotKey } from './save';
import { createStore } from './store';

// Marcos da história. O mundo muda conforme eles acontecem (luz, escrita mais viva, faces do dado).
// Guardado no aparelho; sem isso o jogador começaria de novo a cada visita.
const KEY = slotKey('progress'); // (no espaço de jogo ativo: story/save.ts)

// Em ordem: cada marco alcançado sobe um "estágio" da Casa.
export const STAGE_FLAGS = ['fogo', 'dois', 'tres', 'escrivao', 'selo', 'brasas'] as const;
export type Flag = (typeof STAGE_FLAGS)[number] | 'intro' | 'eco' | 'dado' | 'giz' | 'caiu' | 'caderno' | 'cap1' | 'gema' | 'peso'; // gema: já viu a cena inteira da gema (as outras são curtas) // cap1: terminou o capítulo 1 (a tela inicial passa a mostrar o último lugar salvo) // peso: o dado voltou do altar do Tribunal com a face do Peso (DESIGN.md §77)
export const MAX_STAGE = STAGE_FLAGS.length;

interface State {
  flags: Partial<Record<Flag, true>>;
  burned: Record<string, true>; // braseiros que o jogador já acendeu (a cena completa só toca na 1ª vez de cada um)
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const j = JSON.parse(raw);
      const flags = j.flags ?? {};
      // quem já tinha passado da sala 2 antes de o caderno existir continua com o diário
      if (STAGE_FLAGS.slice(1).some((f) => flags[f])) flags.caderno = true;
      return { flags, burned: j.burned ?? {} };
    }
  } catch {
    /* sem armazenamento: começa do zero */
  }
  return { flags: {}, burned: {} };
}

export const progressStore = createStore<State>(load());
let persist = true;
progressStore.subscribe(() => {
  if (!persist) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(progressStore.get()));
  } catch {
    /* ok */
  }
});

// as faces do dado liberadas dependem dos marcos: o capítulo 1 inteiro é só o Fogo
function applyFaces() {
  const f = progressStore.get().flags;
  // O capítulo 1 é só o Fogo. O Peso chega no fim dele: o dado entra no altar do Tribunal e volta com a face nova (DESIGN.md §13 e §77).
  FACES[2].unlocked = true; // Fogo
  FACES[1].unlocked = !!f.peso; // Peso
  FACES[0].unlocked = !!f.eco; // (reservado: a 3ª face chega com o marco "eco")
}
applyFaces();

export const progress = {
  has: (f: Flag) => !!progressStore.get().flags[f],
  stage: () => STAGE_FLAGS.reduce((n, f) => n + (progressStore.get().flags[f] ? 1 : 0), 0),
  // devolve true se o marco é novo
  set(f: Flag): boolean {
    if (progressStore.get().flags[f]) return false;
    progressStore.set((s) => ({ ...s, flags: { ...s.flags, [f]: true } }));
    applyFaces();
    return true;
  },
  // true se é a primeira vez que este braseiro é aceso
  firstBurn(key: string): boolean {
    if (progressStore.get().burned[key]) return false;
    progressStore.set((s) => ({ ...s, burned: { ...s.burned, [key]: true } }));
    return true;
  },
  // só pré-visualizações (?demo) e testes
  noSave() {
    persist = false;
  },
  reset() {
    progressStore.set({ flags: {}, burned: {} });
    applyFaces();
  },
};
