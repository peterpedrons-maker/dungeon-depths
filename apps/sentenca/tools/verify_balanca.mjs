// Verifica «A Balança» (sala 12, nível 6; DESIGN.md §93; src/scene/rooms/balanca.ts). Uso: node tools/verify_balanca.mjs
// Uma balança de pedra no meio da rotunda; sobre cada prato, pesos de pedra pendurados por cordas numa viga do teto. ALGUNS PESOS PENDEM EMBAIXO
// DE OUTRO (uma corda curta liga os dois): queimar a corda de cima derruba os dois; queimar a curta derruba só o de baixo; o de cima nunca cai
// sozinho. O dado de Fogo queima uma corda e o que ela segura cai no prato de baixo (não volta). O tamanho é o peso: PEQUENO = 1, MÉDIO = 1,5,
// GRANDE = 2. Cada peso tem um NÚMERO talhado (o nome dele, não o peso). A frase da porta: «DOIS PEQUENO IGUAL GRANDE CONFIRMADO». A Casa só
// julga quando o jogador acende o braseirinho do poste: um prato com exatamente dois pequenos, o outro com exatamente um grande, a balança
// parada no meio. Errado: escuro e os pesos sobem de volta.
// Armadilha: o glifo PEQUENO é o ponto do meio com as duas barras do lado (parece UM) e o GRANDE é a moldura com os quatro cantos (parece
// QUATRO); e os pesos têm números: os GRANDES dizem UM e os pequenos dizem QUATRO. Quem lê pelo desenho procura «dois UM igual a um QUATRO».
// E a vista engana: a esquerda MOSTRA dois pequenos e a direita um grande, mas um dos pequenos da esquerda segura o médio embaixo dele.
const MASS = { P: 1, M: 1.5, G: 2 };
// [lado, tamanho, número talhado, pendurado em (-1 = na viga; i = embaixo do peso i)]: a ordem é a do jogo (balanca.ts, WEIGHTS)
const W = [
  ['L', 'G', 'n1', -1],
  ['L', 'P', 'n4', -1],
  ['L', 'P', 'n4', -1],
  ['L', 'M', 'n2', 2], // embaixo do pequeno 2
  ['R', 'G', 'n1', -1],
  ['R', 'P', 'n4', 4], // embaixo do grande 4
  ['R', 'P', 'n4', -1],
];
// queimar a corda i (a de cima do peso i) derruba i e tudo o que pende dele
const drops = (i) => [i, ...W.flatMap((w, j) => (w[3] === i ? drops(j) : []))];
const fall = (ropes) => {
  const s = new Set();
  W.forEach((_, i) => ropes & (1 << i) && drops(i).forEach((j) => s.add(j)));
  return s;
};
const pans = (set) => {
  const L = [];
  const R = [];
  for (const i of set) (W[i][0] === 'L' ? L : R).push(W[i][1]);
  return { L, R };
};
const sum = (a) => a.reduce((s, x) => s + MASS[x], 0);
const level = ({ L, R }) => Math.abs(sum(L) - sum(R)) < 1e-9;
const is = (a, want) => a.length === want.length && [...a].sort().join() === [...want].sort().join();
// a frase verdadeira: um prato = dois pequenos, o outro = um grande, e parada no meio
const verdade = (p) => level(p) && ((is(p.L, ['P', 'P']) && is(p.R, ['G'])) || (is(p.R, ['P', 'P']) && is(p.L, ['G'])));
const key = (set) => [...set].sort((a, b) => a - b).join(',');
const okSets = new Map(); // o que cai (conjunto de pesos) -> as cordas que o fazem
const reach = new Set();
let levelFalse = 0;
for (let r = 0; r < 1 << W.length; r++) {
  const s = fall(r);
  reach.add(key(s));
  const p = pans(s);
  if (verdade(p)) {
    const k = key(s);
    const prev = okSets.get(k);
    if (prev === undefined || popcount(r) < popcount(prev)) okSets.set(k, r);
  } else if (level(p) && s.size) levelFalse++;
}
function popcount(x) {
  let n = 0;
  for (; x; x &= x - 1) n++;
  return n;
}
const names = (r) => W.map((w, i) => (r & (1 << i) ? `corda ${i} (${w[0]}${w[1]}${w[3] >= 0 ? ', curta' : ''})` : null)).filter(Boolean).join(' + ');
let fail = false;
const check = (cond, msg) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) fail = true;
};
const [[okKey, okRopes] = []] = [...okSets];
check(okSets.size === 1, `um jeito só de os pratos dizerem a frase: caem os pesos {${okKey}}, queimando ${okRopes !== undefined ? names(okRopes) : '?'}`);
check(okKey === '0,5,6', 'a resposta: o GRANDE da esquerda; à direita, o pequeno sozinho e o pequeno que pende embaixo do grande');
check(okRopes === (1 << 0) | (1 << 5) | (1 << 6), '...queimando a corda do GRANDE da esquerda, a do pequeno sozinho da direita e a CURTA entre o grande e o pequeno da direita');
check(levelFalse > 0, `${levelFalse} jeitos de queimar deixam a balança parada no meio com a frase falsa (ex.: um pequeno de cada lado): nivelar não basta`);
// a vista engana: os dois pequenos da esquerda não caem sem o médio
check(![...reach].some((k) => is(pans(new Set(k ? k.split(',').map(Number) : [])).L, ['P', 'P'])), 'os dois PEQUENOS da esquerda (o que se vê da entrada) nunca ficam sozinhos no prato: um deles segura o médio');
check(![...reach].some((k) => is(pans(new Set(k ? k.split(',').map(Number) : [])).R, ['G'])), 'o GRANDE da direita nunca fica sozinho no prato: o pequeno pende dele');
// lendo pelo desenho (PEQUENO = UM, GRANDE = QUATRO): «dois pesos UM» num prato e «um peso QUATRO» no outro
let byDrawing = 0;
for (const k of reach) {
  const s = new Set(k ? k.split(',').map(Number) : []);
  const L = [];
  const R = [];
  for (const i of s) (W[i][0] === 'L' ? L : R).push(W[i][2]);
  const good = (a, b) => is(a, ['n1', 'n1']) && is(b, ['n4']);
  if ((good(L, R) || good(R, L)) && level(pans(s))) byDrawing++;
}
check(byDrawing === 0, 'quem lê o glifo pelo desenho («dois UM igual QUATRO») não acha resposta: os dois pesos UM ficam em lados diferentes');
console.log(fail ? '\nFALHOU' : '\nOK: A Balança tem solução única e as armadilhas fecham.');
process.exit(fail ? 1 : 0);
