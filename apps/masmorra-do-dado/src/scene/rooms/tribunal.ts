// O Tribunal dos Rumores — o puzzle de NÍVEL 10 do capítulo do Fogo (só o dado de Fogo). Os dados vêm de tribunal.json
// (a mesma fonte do verificador `tools/verify_tribunal.mjs`, que prova que a solução é ÚNICA e que nenhuma pista é descartável).
//
// Cinco braseiros com números nos pedestais (UM a CINCO) e tamanhos diferentes. Nas paredes há sete frases do tipo
// «X ANTES Y» / «X DEPOIS Y», cada uma com uma marca: CONFIRMADO (verdade) ou BOATO (talvez falso). Na porta: «ACENDER TODOS BRASEIRO ORDEM»
// e a lei «DOIS BOATO = VERDADE» (exatamente dois dos boatos são verdadeiros). As frases chamam os braseiros pelo número OU pelo
// tamanho (GRANDE, PEQUENO), então é preciso olhar para eles. A ordem certa sai só do raciocínio. Errar apaga tudo e deixa os
// braseiros FRIOS por 12 s, então chutar não compensa.
import data from './tribunal.json';
import { buildFireRoom, type FireLine, type FireSpec, type FireTablet } from './fire';
import type { Ctx, Room } from '../types';

const SCALE: Record<string, number> = { pequeno: 0.7, medio: 1, grande: 1.35 };
interface Stmt {
  rel: string;
  a: string;
  b: string;
}
const words = (s: Stmt, mark: 'conf' | 'boato') => [s.a, s.rel, s.b, mark];

export function buildTribunal(ctx: Ctx): Room {
  const C = data.confirmadas as Stmt[];
  const B = data.boatos as Stmt[];
  // onde cada frase fica: misturadas (confirmadas e boatos nas duas paredes) para o jogador ter que LER as marcas
  const ln = (st: Stmt, mark: 'conf' | 'boato'): FireLine => ({ words: words(st, mark), worn: mark === 'boato' });
  const tablets: FireTablet[] = [
    // dois parágrafos (frases completas, uma embaixo da outra, de cima para baixo), com confirmadas e boatos misturados
    { lines: [ln(B[0], 'boato'), ln(C[0], 'conf'), ln(B[2], 'boato'), ln(C[2], 'conf')], wall: 'left', dz: 10, size: 0.45 },
    { lines: [ln(B[1], 'boato'), ln(C[1], 'conf'), ln(B[3], 'boato')], wall: 'right', dz: 8, size: 0.45 },
    // a lei da casa, ao lado da porta: «DOIS BOATO = VERDADE» (dois dos boatos são verdade)
    { words: ['n2', 'boato', 'igual', 'verdade'], wall: 'backR', seal: true, size: 0.4 },
  ];
  const spec: FireSpec = {
    name: data.nome,
    subtitle: 'Cinco braseiros e muitas frases.',
    hx: 6.2,
    z0: -16,
    h: 4,
    theme: 'crypt',
    braziers: data.braseiros.map((b) => ({ x: b.x, dz: b.dz, mark: `n${b.rotulo}`, scale: SCALE[b.tamanho] })),
    rule: { kind: 'order', seq: data.solucao.map((l) => l - 1), hints: false, penalty: 12 },
    words: ['acender', 'todos', 'brasa', 'ordem'],
    tablets,
    fog: { color: '#0a0a11', near: 5, far: 30 },
    ambient: { color: 0x7a78b8, intensity: 1.9 },
  };
  return buildFireRoom(ctx, spec);
}
