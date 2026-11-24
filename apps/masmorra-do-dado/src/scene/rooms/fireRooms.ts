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

// ── TEMPO ──────────────────────────────────────────────────────────────────────────
// A frase é a das salas anteriores (ACENDER · TRÊS · BRASEIRO), com UMA palavra nova no fim: TEMPO. Aqui as chamas se apagam sozinhas e o
// tamanho do braseiro diz quanto dura (maior = mais). A porta só abre se os três estiverem acesos AO MESMO TEMPO.
// Quem acende do mais perto para o mais longe (o jeito natural) vê o pequeno apagar antes de chegar ao último. O certo: o que dura mais PRIMEIRO.
export const FIRE_TEMPO: FireSpec = {
  name: 'A Chama Curta',
  subtitle: 'Quatro palavras, três braseiros. Alguma coisa mudou.',
  hx: 5,
  z0: -22,
  h: 3.8,
  braziers: [
    { x: -3.4, dz: 21, scale: 0.7, burn: 4 }, // pequeno, perto da entrada: dura pouco
    { x: 3.4, dz: 11, scale: 1, burn: 9 }, // médio, no meio
    { x: -3.0, dz: 2.2, scale: 1.35, burn: 16 }, // grande, perto da porta: dura mais
  ],
  rule: { kind: 'together' },
  fog: { color: '#0a0a11', near: 5, far: 30 },
  ambient: { color: 0x7a78b8, intensity: 1.9 },
  words: ['acender', 'n3', 'brasa', 'tempo'],
  pillars: [
    [2.2, 17],
    [-2.2, 7],
    [2.2, 5],
  ],
};

// ── ORDEM SECRETA ──────────────────────────────────────────────────────────────────
// A frase pergunta a ordem (ACENDER · BRASEIRO · ORDEM · ?) e NÃO a dá. O jogador acende os quatro como quiser; a Casa "confirma" por gemas
// QUANTOS estavam na posição certa (só a contagem) e apaga tudo. Descobrir a ordem é dedução (como um Mastermind), não adivinhação:
// a contagem de cada tentativa elimina possibilidades. Já viu: a ordem importa (Sala 4) e as gemas confirmam passos certos.
export const FIRE_SEGREDO: FireSpec = {
  name: 'A Confirmação',
  subtitle: 'Quatro braseiros. A Casa guarda a ordem.',
  hx: 4.2,
  z0: -11,
  h: 3.5,
  braziers: [
    { x: -2.6, dz: 8.2 },
    { x: 2.6, dz: 8.2 },
    { x: -2.6, dz: 5.4 },
    { x: 2.6, dz: 5.4 },
  ],
  rule: { kind: 'secret', seq: [3, 0, 2, 1] }, // 1º: direita, lado da porta · 2º: esquerda, lado da entrada · 3º: esquerda, lado da porta · 4º: direita, lado da entrada
  words: ['acender', 'brasa', 'ordem', 'perg'],
};

export const FIRE_ROOMS: FireSpec[] = [FIRE_ORDEM, FIRE_TEMPO, FIRE_SEGREDO];
