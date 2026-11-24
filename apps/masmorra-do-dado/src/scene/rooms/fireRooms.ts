// As salas de fogo guiadas por dados (ver fire.ts). Cada uma ensina UMA ideia nova; a ordem aqui é a ordem no jogo.
import type { FireLine, FireSpec } from './fire';

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
// NÍVEL 4. A frase é a das salas anteriores (ACENDER · QUATRO · BRASEIRO), com UMA palavra nova no fim: TEMPO. As chamas se apagam sozinhas e o
// tamanho do braseiro diz quanto dura (maior = mais). A porta só abre se os QUATRO estiverem acesos AO MESMO TEMPO. A sala é comprida: andar de um
// braseiro ao outro leva tempo, e o pequeno está bem na entrada (o primeiro que o jogador acenderia). O certo: o que dura mais PRIMEIRO, o que dura
// menos POR ÚLTIMO, planejando o caminho. Quem acende do mais perto para o mais longe vê o primeiro apagar antes de chegar ao último.
export const FIRE_TEMPO: FireSpec = {
  name: 'A Chama Curta',
  subtitle: 'Quatro braseiros. O tempo manda.',
  hx: 5,
  z0: -27,
  h: 3.8,
  braziers: [
    { x: -3.4, dz: 25, scale: 0.7, burn: 6 }, // pequeno, na entrada: dura pouco
    { x: 3.4, dz: 17, scale: 0.9, burn: 10 },
    { x: -3.2, dz: 9, scale: 1.15, burn: 15 },
    { x: 3.0, dz: 2.5, scale: 1.4, burn: 22 }, // grande, junto da porta: dura mais
  ],
  rule: { kind: 'together' },
  fog: { color: '#0a0a11', near: 5, far: 30 },
  ambient: { color: 0x7a78b8, intensity: 1.9 },
  words: ['acender', 'n4', 'brasa', 'tempo'],
  pillars: [
    [2.2, 21],
    [-2.2, 13],
    [2.2, 6],
  ],
};

// ── O QUE A CASA CONFIRMA ──────────────────────────────────────────────────────────
// NÍVEL 5. Ensina as marcas CONFIRMADO×BOATO e ANTES/DEPOIS (o Tribunal vai exigir tudo isso). Dois passos:
//  1) LER E ACENDER: sete frases na parede, cada uma com a sua marca. A porta diz «ACENDER CONFIRMADO PALAVRA»: o jogador passa o dado de Fogo pelas frases
//     CONFIRMADAS (as de BOATO apagam tudo e a Casa recusa o fogo por um tempo). Acertando as quatro, os quatro PILARES sobem do chão.
//  2) ACENDER NA ORDEM: as quatro frases confirmadas formam uma cadeia (3 antes de 1, 1 antes de 4, 4 antes de 2 · 2 depois de 1), que dá a ORDEM dos pilares: 3, 1, 4, 2.
//     Os boatos dizem coisas que contradizem a cadeia: seguir um boato dá a ordem errada.
const frase = (a: string, rel: 'antes' | 'depois', b: string, mark: 'conf' | 'boato', good: boolean): FireLine => ({ words: [a, rel, b, mark], good });
export const FIRE_FRASES: FireSpec = {
  name: 'O Que a Casa Confirma',
  subtitle: 'Sete frases na parede. Quatro pilares escondidos.',
  hx: 5.6,
  z0: -18,
  h: 3.8,
  braziers: [
    { x: -3.2, dz: 12, mark: 'n1', hidden: true },
    { x: 3.4, dz: 11, mark: 'n2', hidden: true },
    { x: -3.0, dz: 6, mark: 'n3', hidden: true },
    { x: 3.2, dz: 4.5, mark: 'n4', hidden: true },
  ],
  rule: { kind: 'order', seq: [2, 0, 3, 1], hints: false, penalty: 8 }, // TRÊS, UM, QUATRO, DOIS
  lock: { penalty: 4 },
  words: ['acender', 'conf'],
  tablets: [
    { lines: [frase('n2', 'antes', 'n4', 'boato', false), frase('n3', 'antes', 'n1', 'conf', true)], wall: 'left', dz: 13, size: 0.45, lit: true },
    { lines: [frase('n1', 'antes', 'n4', 'conf', true), frase('n1', 'antes', 'n3', 'boato', false)], wall: 'left', dz: 6, size: 0.45, lit: true },
    { lines: [frase('n4', 'antes', 'n2', 'conf', true), frase('n4', 'antes', 'n3', 'boato', false), frase('n2', 'depois', 'n1', 'conf', true)], wall: 'right', dz: 9, size: 0.45, lit: true },
  ],
  fog: { color: '#0a0a11', near: 5, far: 28 },
  ambient: { color: 0x7a78b8, intensity: 1.9 },
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
