import { FACES } from '../faces';
import { createStore } from './store';

// Marcos da história. O mundo muda conforme eles acontecem (luz, escrita mais viva, faces do dado).
// Guardado no aparelho; sem isso o jogador começaria de novo a cada visita.
const KEY = 'mdd-progress-v1';

// Em ordem: cada marco alcançado sobe um "estágio" da Casa.
export const STAGE_FLAGS = ['fogo', 'dois', 'tres', 'escrivao', 'selo', 'brasas'] as const;
export type Flag = (typeof STAGE_FLAGS)[number] | 'intro';
export const MAX_STAGE = STAGE_FLAGS.length;

interface State {
  flags: Partial<Record<Flag, true>>;
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { flags: JSON.parse(raw).flags ?? {} };
  } catch {
    /* sem armazenamento: começa do zero */
  }
  return { flags: {} };
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

// as faces do dado liberadas dependem dos marcos: começa só o Fogo
function applyFaces() {
  const f = progressStore.get().flags;
  FACES[2].unlocked = true; // Fogo: desde o começo
  FACES[1].unlocked = !!f.escrivao; // Peso
  FACES[0].unlocked = !!f.escrivao; // Ricochete
}
applyFaces();

export const progress = {
  has: (f: Flag) => !!progressStore.get().flags[f],
  stage: () => STAGE_FLAGS.reduce((n, f) => n + (progressStore.get().flags[f] ? 1 : 0), 0),
  // devolve true se o marco é novo
  set(f: Flag): boolean {
    if (progressStore.get().flags[f]) return false;
    progressStore.set((s) => ({ flags: { ...s.flags, [f]: true } }));
    applyFaces();
    return true;
  },
  // só pré-visualizações (?demo) e testes
  noSave() {
    persist = false;
  },
  reset() {
    progressStore.set({ flags: {} });
    applyFaces();
  },
};
