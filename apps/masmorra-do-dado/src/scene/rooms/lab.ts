// A Placa que Julga — sala de TESTE (?lab=1) com as três ferramentas ao mesmo tempo: Fogo, Peso e giz.
// Os dados vêm de lab.json (verificado por `tools/verify_lab.mjs`: solução única, nenhuma pista descartável).
//
// Cinco braseiros (UM a CINCO). A porta diz «ACENDER TRÊS BRASEIRO PLACA»: acenda TRÊS e depois pese a placa. Mas QUAIS três? As frases
// das paredes são condições lógicas (SE a ENTÃO b · SE a ENTÃO NÃO b · a E b), cada uma com a marca CONFIRMADO ou BOATO, e a lei da casa
// diz que exatamente DOIS dos boatos são verdadeiros. A placa é o juiz: ela avalia o conjunto de chamas acesas; se estiver errado, ABAFA o
// fogo (apaga tudo e deixa os braseiros frios um tempo). Uma das frases confirmadas está num tablete LISO: só aparece esfregando o giz nele.
import data from './lab.json';
import { buildFireRoom, type FireSpec, type FireTablet } from './fire';
import type { Ctx, Room } from '../types';

interface Clue {
  t: string;
  a: number;
  b: number;
  giz?: boolean;
}
const words = (c: Clue, mark: 'conf' | 'boato'): string[] => {
  const a = `n${c.a}`;
  const b = `n${c.b}`;
  if (c.t === 'se') return ['se', a, 'seguir', b, mark];
  if (c.t === 'nao_juntos') return ['se', a, 'seguir', 'atravessar', b, mark];
  return [a, 'e', b, mark];
};

// todas as palavras usadas na sala (a sala de teste já as deixa no diário como "avistadas")
export const LAB_WORDS = [
  'acender',
  'brasa',
  'placa',
  'se',
  'seguir',
  'atravessar',
  'e',
  'conf',
  'boato',
  'igual',
  'verdade',
  'n1',
  'n2',
  'n3',
  'n4',
  'n5',
];

export function buildLab(ctx: Ctx): Room {
  const C = data.confirmadas as Clue[];
  const B = data.boatos as Clue[];
  const mk = (c: Clue, mark: 'conf' | 'boato', wall: FireTablet['wall'], dz: number): FireTablet =>
    mark === 'conf'
      ? { words: words(c, mark), wall, dz, seal: true, rub: !!c.giz, size: 0.34 }
      : { words: words(c, mark), wall, dz, worn: true, age: 0.5, size: 0.34 };
  const tablets: FireTablet[] = [
    mk(B[0], 'boato', 'left', 15.5),
    mk(C[0], 'conf', 'left', 11.3),
    mk(B[1], 'boato', 'left', 7.1),
    mk(C[2], 'conf', 'left', 2.9),
    mk(B[2], 'boato', 'right', 15.5),
    mk(C[1], 'conf', 'right', 11.3), // o liso: só aparece esfregando o giz
    mk(B[3], 'boato', 'right', 7.1),
    // a lei da casa: «DOIS BOATO = VERDADE» (exatamente dois boatos são verdadeiros)
    {
      words: ['n2', 'boato', 'igual', 'verdade'],
      wall: 'backR',
      seal: true,
      size: 0.4,
    },
  ];
  const spec: FireSpec = {
    name: data.nome,
    subtitle: 'Cinco braseiros, uma placa e muitas frases.',
    hx: 6.2,
    z0: -16,
    h: 4,
    theme: 'crypt',
    braziers: [
      { x: -3.4, dz: 12.5, mark: 'n1' },
      { x: 3.4, dz: 12.5, mark: 'n2' },
      { x: -3.4, dz: 8, mark: 'n3' },
      { x: 3.4, dz: 8, mark: 'n4' },
      { x: 0, dz: 10.2, mark: 'n5' },
    ],
    plate: { x: 0, dz: 4.2 },
    rule: { kind: 'commit', lit: data.solucao.map((n) => n - 1), penalty: 6 },
    words: ['acender', 'n3', 'brasa', 'placa'],
    tablets,
    fog: { color: '#0a0a11', near: 5, far: 30 },
    ambient: { color: 0x7a78b8, intensity: 1.9 },
  };
  return buildFireRoom(ctx, spec);
}
