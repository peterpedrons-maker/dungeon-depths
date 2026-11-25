// Verifica as CONSTELAÇÕES (puzzles secretos com tochas nos pilares; ver PUZZLES_PROPOSTAS.md §3).
// Ideia (do Pedro): algumas salas têm pilares com tochas. Vistas de cima, as posições das tochas caem numa grade 3x3 (casas 0..8, como os
// glifos). Acender EXATAMENTE as tochas que formam um glifo (e nenhuma outra) faz subir um braseiro no centro; acendê-lo abre a porta secreta.
// Algumas tochas estão FORA da grade (iscas, nas paredes). As linhas dos verbos aparecem como FRISOS no teto entre as tochas (canaletas altas):
// quando as tochas das pontas acendem, o fogo corre pelo friso e desenha a linha.
// Regras de projeto que o verificador confere, para cada constelação:
//  1) o glifo-alvo é formável com as tochas da sala e é o ÚNICO conjunto aceito;
//  2) a PISTA da sala aponta para uma palavra só (ex.: os frisos do teto só batem com as linhas de UM verbo);
//  3) chutar não compensa: quantos conjuntos existem (e as tochas se apagam sozinhas, então cada chute custa caminhar e esperar);
//  4) acender TODAS as tochas não resolve (o jogador que acende tudo por curiosidade não acha por acaso).
// Uso: node tools/verify_constelacoes.mjs
import { readFileSync } from 'node:fs';
const LEX = JSON.parse(readFileSync(new URL('../src/story/lexicon.json', import.meta.url)));
const words = Array.isArray(LEX) ? LEX : Object.values(LEX);
// palavras que dá para escrever só com fogo: sem moldura, sem anel, sem símbolo pequeno (números, verbos, quantidades)
const escreviveis = words.filter((w) => w.g && !w.g.F && !w.g.s && !(w.g.ring || []).length && (w.g.p || []).length);
const pts = (w) => [...new Set([...(w.g.p || []), ...(w.g.l || []).flat()])].sort((a, b) => a - b);
const linhas = (w) => (w.g.l || []).map(([a, b]) => [Math.min(a, b), Math.max(a, b)].join('-')).sort();

const CONSTELACOES = [
  {
    sala: 'Sala 5 · A Casa Escreve (salão de 9 colunas em grade)',
    nota: 'a 1ª constelação: só 3 colunas têm suporte de tocha (de pedra clara, igual à das lousas). Ensina que constelações existem.',
    tochas: [
      { id: 'c0', casa: 0 }, { id: 'c4', casa: 4 }, { id: 'c8', casa: 8 },
      { id: 'parede-esq', casa: null }, { id: 'parede-dir', casa: null }, // iscas: tochas comuns nas paredes
    ],
    frisos: [], // sem linhas: é um número
    alvo: 'n3',
    pista: { tipo: 'suportes', descricao: 'só a diagonal tem suportes de tocha nas colunas' },
  },
  {
    sala: 'Sala 8 · O Pano (capela alta, 6 pilares em duas fileiras)',
    nota: 'todos os 6 pilares têm tocha; o que diz QUAIS é o teto: frisos de pedra ligam só três posições, desenhando um triângulo.',
    tochas: [
      { id: 'p0', casa: 0 }, { id: 'p1', casa: 1 }, { id: 'p2', casa: 2 },
      { id: 'p6', casa: 6 }, { id: 'p7', casa: 7 }, { id: 'p8', casa: 8 },
      { id: 'altar', casa: null }, { id: 'entrada-1', casa: null }, { id: 'entrada-2', casa: null },
    ],
    frisos: [[1, 6], [6, 8], [1, 8]], // no teto
    alvo: 'acender',
    pista: { tipo: 'frisos', descricao: 'os frisos do teto têm a forma das linhas de um verbo' },
  },
];

let ok = true;
const check = (c, m) => {
  console.log(`  ${c ? '✓' : '✗'} ${m}`);
  ok = ok && c;
};
for (const k of CONSTELACOES) {
  console.log(`${k.sala}\n  (${k.nota})`);
  const alvo = words.find((w) => w.id === k.alvo);
  const casas = k.tochas.filter((t) => t.casa != null).map((t) => t.casa);
  const T = pts(alvo);
  check(T.every((c) => casas.includes(c)), `o glifo ${alvo.pt.toUpperCase()} (casas ${T.join(', ')}) cabe nas tochas da sala`);
  // conjunto aceito: exatamente as tochas das casas do alvo
  const n = k.tochas.length;
  let aceitos = 0;
  for (let m = 0; m < 1 << n; m++) {
    const acesas = k.tochas.filter((_, i) => (m >> i) & 1);
    const ok1 = acesas.every((t) => t.casa != null) && acesas.length === T.length && T.every((c) => acesas.some((t) => t.casa === c));
    if (ok1) aceitos++;
  }
  check(aceitos === 1, `um só conjunto de tochas é aceito (${aceitos} de ${1 << n})`);
  const formaveis = escreviveis.filter((w) => pts(w).every((c) => casas.includes(c)));
  console.log(`  · palavras que as tochas desta sala conseguem escrever: ${formaveis.map((w) => w.pt.toUpperCase()).join(', ')}`);
  if (k.pista.tipo === 'frisos') {
    const fr = k.frisos.map(([a, b]) => [Math.min(a, b), Math.max(a, b)].join('-')).sort().join();
    const batem = formaveis.filter((w) => linhas(w).join() === fr);
    check(batem.length === 1 && batem[0].id === k.alvo, `a pista (${k.pista.descricao}) aponta para uma palavra só: ${batem.map((w) => w.pt.toUpperCase()).join(', ')}`);
  } else {
    check(casas.length === T.length, `a pista (${k.pista.descricao}): as tochas da grade são exatamente as do glifo`);
  }
  check(!(k.tochas.every((t) => t.casa != null) && k.tochas.length === T.length), 'acender TODAS as tochas da sala não resolve (há iscas)');
}
console.log(ok ? '\nOK: cada constelação tem um conjunto só e uma pista que aponta para ele.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
