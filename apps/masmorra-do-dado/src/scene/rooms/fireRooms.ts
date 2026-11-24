// As salas de fogo guiadas por dados (ver fire.ts). Cada uma ensina UMA ideia nova; a ordem aqui é a ordem no jogo.
import type { FireSpec } from './fire';

// ── ORDEM ──────────────────────────────────────────────────────────────────────────
// Ensina que uma sequência de números na frase é a ORDEM de acender, e que os símbolos nos pedestais dizem qual braseiro é qual.
// DOIS → TRÊS → UM. Quem assume "1, 2, 3" erra e vê a Casa apagar tudo (feedback sem texto).
export const FIRE_ORDEM: FireSpec = {
  name: 'A Ordem',
  subtitle: 'Três braseiros, três números, uma frase.',
  hx: 5.2,
  z0: -11.5,
  h: 3.6,
  braziers: [
    { x: -3.6, dz: 8.4, mark: 'n3' }, // à esquerda, perto da entrada
    { x: 3.6, dz: 5.6, mark: 'n1' }, // à direita, no meio
    { x: 3.2, dz: 2.2, mark: 'n2' }, // à direita, perto da porta
  ],
  rule: { kind: 'order', seq: [2, 0, 1] }, // DOIS (direita, porta) → TRÊS (esquerda, entrada) → UM (direita, meio)
  words: ['acender', 'n2', 'n3', 'n1', 'brasa'],
  pillars: [
    [-1.6, 5.0],
    [1.6, 7.6],
  ],
};

export const FIRE_ROOMS: FireSpec[] = [FIRE_ORDEM];
