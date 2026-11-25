// Verifica a proposta «O Fio de Fogo» (sala 4, nível 3; ver PUZZLES_PROPOSTAS.md).
// Mecânica nova: CANALETAS. Lampiões numa grade 3x3 (casas 0..8, linha a linha, como os glifos do léxico) ligados por canaletas de óleo
// que descem num sentido só (a inclinação se vê). Acender um lampião faz o fogo correr por todas as canaletas que saem dele e acender os
// lampiões do outro lado, que continuam espalhando. A plaquinha «ACENDER N» diz quantas vezes o jogador pode pôr fogo (N ignições).
// O painel aceita quando os lampiões acesos formam EXATAMENTE o glifo pedido. Aceso a mais = a Casa apaga tudo.
// Prova, para cada painel: 1) há UMA escolha de ignições que escreve o glifo; 2) com menos ignições é impossível;
// 3) há armadilhas (lampiões de fora do glifo cujo fogo entra nele) e 4) o "começo natural" (a 1ª casa do glifo na leitura) não resolve.
// Uso: node tools/verify_fio.mjs
const GLIFO = { n3: [0, 4, 8], n5: [0, 2, 4, 6, 8] }; // TRÊS (diagonal) e CINCO (a face 5 do dado), iguais a tools/lexicon.mjs
const PAINEIS = [
  {
    nome: 'Painel 2 (parede): «ACENDER UM» + glifo TRÊS',
    alvo: 'n3',
    ignicoes: 1,
    canaletas: [[4, 0], [4, 8], [6, 4], [6, 7], [7, 8], [3, 0], [3, 1], [5, 2]], // [de, para]
    solucao: [4],
  },
  {
    nome: 'Porta (chão, 9 braseiros): «ACENDER DOIS» + glifo CINCO',
    alvo: 'n5',
    ignicoes: 2,
    canaletas: [[2, 4], [4, 0], [4, 8], [1, 2], [5, 8], [3, 7], [7, 6]],
    solucao: [2, 6],
  },
];

const reach = (E, S) => {
  const lit = new Set(S);
  for (let ch = true; ch; ) {
    ch = false;
    for (const [a, b] of E) if (lit.has(a) && !lit.has(b)) (lit.add(b), (ch = true));
  }
  return lit;
};
const iguais = (s, T) => s.size === T.length && T.every((x) => s.has(x));
const combos = (n, k, st = 0) => (k === 0 ? [[]] : Array.from({ length: n - st }, (_, i) => i + st).flatMap((i) => combos(n, k - 1, i + 1).map((c) => [i, ...c])));
const vizinhos = (a, b) => Math.max(Math.abs((a % 3) - (b % 3)), Math.abs(((a / 3) | 0) - ((b / 3) | 0))) === 1;

let ok = true;
const check = (c, m) => {
  console.log(`  ${c ? '✓' : '✗'} ${m}`);
  ok = ok && c;
};
for (const p of PAINEIS) {
  console.log(p.nome);
  const T = GLIFO[p.alvo];
  check(p.canaletas.every(([a, b]) => vizinhos(a, b)), 'toda canaleta liga lampiões vizinhos (dá para construir)');
  const sols = combos(9, p.ignicoes).filter((S) => iguais(reach(p.canaletas, S), T));
  check(sols.length === 1 && sols[0].join() === p.solucao.join(), `uma escolha só: acender ${sols.map((s) => s.join('+')).join(' | ')}`);
  for (let k = 1; k < p.ignicoes; k++) {
    const n = combos(9, k).filter((S) => iguais(reach(p.canaletas, S), T)).length;
    check(n === 0, `com ${k} ignição(ões) é impossível (${n})`);
  }
  const armadilhas = [...Array(9).keys()].filter((x) => !T.includes(x) && [...reach(p.canaletas, [x])].some((y) => T.includes(y)));
  check(armadilhas.length >= 2, `armadilhas (fora do glifo, mas o fogo entra nele): ${armadilhas.join(', ')}`);
  check(!p.solucao.includes(T[0]), `o começo natural (casa ${T[0]}, canto de cima à esquerda) não faz parte da solução`);
  // a lição do painel anterior ("comece pelo meio") não serve aqui?
  if (p.alvo === 'n5') check(combos(9, p.ignicoes).filter((S) => S.includes(4)).every((S) => !iguais(reach(p.canaletas, S), T)), 'começar pelo MEIO (a lição do painel 2) não resolve: a primeira impressão engana');
}
console.log(ok ? '\nOK: cada painel tem uma solução só.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
