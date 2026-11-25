// Verifica a proposta «O Fio de Fogo» (sala 4, nível 3; ver PUZZLES_PROPOSTAS.md §5).
// Mecânica nova: CANALETAS. Lampiões/braseiros numa grade 3x3 (casas 0..8, linha a linha, como os glifos do léxico) ligados por canaletas
// de óleo que descem num sentido só (a inclinação se vê). Pôr fogo num deles faz o fogo correr por todas as canaletas que saem dele, acender
// os do outro lado e continuar. Cada canaleta por onde o fogo passa fica QUEIMADA (uma linha escura com brasa). A plaquinha «ACENDER N»
// diz quantas IGNIÇÕES o jogador pode fazer.
// Como a Casa lê a grade: os PONTOS são os acesos; as LINHAS são as canaletas queimadas. Um glifo SEM linhas (número) é lido só pelos pontos;
// um glifo COM linhas (verbo) tem de bater nos pontos E nas linhas.
// Uso: node tools/verify_fio.mjs
import { readFileSync } from 'node:fs';
const LEX = JSON.parse(readFileSync(new URL('../src/story/lexicon.json', import.meta.url)));
const words = Array.isArray(LEX) ? LEX : Object.values(LEX);
const W = Object.fromEntries(words.map((w) => [w.id, w]));
const ln = (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`;
const glifo = (w) => ({ p: [...new Set([...(w.g.p || []), ...(w.g.l || []).flat()])].sort((a, b) => a - b), l: (w.g.l || []).map(([a, b]) => ln(a, b)).sort() });
// palavras que dá para escrever com fogo: sem moldura, sem anel, sem símbolo pequeno
const ESCREVIVEIS = words.filter((w) => w.g && !w.g.F && !w.g.s && !(w.g.ring || []).length && (w.g.p || []).length);

const PAINEIS = [
  {
    nome: 'Lousa 2 (balcão): «ACENDER UM» + glifo TRÊS',
    alvo: 'n3', ignicoes: 1,
    canaletas: [[4, 0], [4, 8], [6, 4], [6, 7], [7, 8], [3, 0], [3, 1], [5, 2]], // [de, para]
    solucao: [[4]],
  },
  {
    nome: 'Lousa 3 (balcão): glifo ACENDER talhado, canaletas só no triângulo, em roda (demonstração)',
    alvo: 'acender', ignicoes: 1,
    canaletas: [[1, 6], [6, 8], [8, 1]],
    solucao: [[1], [6], [8]], // qualquer ponta serve: é demonstração, sem armadilha
  },
  {
    nome: 'Porta (chão, 9 braseiros): «ACENDER DOIS» + glifo CINCO',
    alvo: 'n5', ignicoes: 2,
    canaletas: [[2, 4], [4, 0], [4, 8], [1, 2], [5, 8], [3, 7], [7, 6]],
    solucao: [[2, 6]],
  },
];
const CHAO = PAINEIS[2].canaletas;

const queima = (E, S) => {
  const lit = new Set(S);
  const usadas = new Set();
  for (let ch = true; ch; ) {
    ch = false;
    for (const [a, b] of E) if (lit.has(a) && !usadas.has(ln(a, b))) (usadas.add(ln(a, b)), lit.add(b), (ch = true));
  }
  return { p: [...lit].sort((a, b) => a - b), l: [...usadas].sort() };
};
const le = (r, w) => {
  const g = glifo(w);
  return r.p.join() === g.p.join() && (g.l.length === 0 || r.l.join() === g.l.join());
};
const combos = (n, k, st = 0) => (k === 0 ? [[]] : Array.from({ length: n - st }, (_, i) => i + st).flatMap((i) => combos(n, k - 1, i + 1).map((c) => [i, ...c])));
const vizinhos = (a, b) => Math.max(Math.abs((a % 3) - (b % 3)), Math.abs(((a / 3) | 0) - ((b / 3) | 0))) === 1;

let ok = true;
const check = (c, m) => {
  console.log(`  ${c ? '✓' : '✗'} ${m}`);
  ok = ok && c;
};
for (const p of PAINEIS) {
  console.log(p.nome);
  const w = W[p.alvo];
  const T = glifo(w).p;
  if (p.nome.startsWith('Porta')) check(p.canaletas.every(([a, b]) => vizinhos(a, b)), 'no chão, toda canaleta liga braseiros vizinhos (dá para construir)');
  const sols = combos(9, p.ignicoes).filter((S) => le(queima(p.canaletas, S), w));
  check(sols.map((s) => s.join('+')).join() === p.solucao.map((s) => s.join('+')).join(), `escolhas que escrevem ${w.pt.toUpperCase()}: ${sols.map((s) => s.join('+')).join(' | ')}`);
  for (let k = 1; k < p.ignicoes; k++) check(combos(9, k).every((S) => !le(queima(p.canaletas, S), w)), `com ${k} ignição é impossível`);
  if (p.alvo === 'acender') continue;
  const armadilhas = [...Array(9).keys()].filter((x) => !T.includes(x) && queima(p.canaletas, [x]).p.some((y) => T.includes(y)));
  check(armadilhas.length >= 2, `armadilhas (fora do glifo, mas o fogo entra nele): ${armadilhas.join(', ')}`);
  check(!p.solucao[0].includes(T[0]), `o começo natural (casa ${T[0]}) não faz parte da solução`);
  if (p.alvo === 'n5') check(combos(9, 2).filter((S) => S.includes(4)).every((S) => !le(queima(p.canaletas, S), w)), 'começar pelo MEIO (a lição da lousa 2) não resolve: a primeira impressão engana');
}

// SEGREDO S10 (voltar depois): a plaquinha fria do balcão «DIZER IGUAL ▢» + «ACENDER UM». Com UMA ignição no chão, a única palavra do léxico
// que a grade consegue escrever é FAZER (pontos 0,2,4,8 e linhas 0-4, 2-4, 4-8): "dizer é fazer", o lema dos Contáveis.
console.log('Segredo do balcão: com UMA ignição no chão, que palavras a grade escreve?');
const umaIgnicao = [...Array(9).keys()].flatMap((x) => ESCREVIVEIS.filter((w) => le(queima(CHAO, [x]), w)).map((w) => ({ x, w: w.pt })));
console.log(`  · ${umaIgnicao.map((r) => `casa ${r.x} → ${r.w.toUpperCase()}`).join('; ') || 'nenhuma'}`);
const verbos = umaIgnicao.filter((r) => words.find((w) => w.pt === r.w).fam === 'verbo');
check(verbos.length === 1 && verbos[0].w === 'fazer' && verbos[0].x === 2, 'a frase «DIZER IGUAL ▢» liga um verbo a outro: o único VERBO possível é FAZER (casa 2); a casa 4 escreve TRÊS, que não completa a frase');
const r2 = queima(CHAO, [2]);
check(!le(r2, W.n5), 'FAZER não abre a porta (a porta pede CINCO): o segredo não sai por acaso resolvendo a sala');
check(le(queima(CHAO, [2, 6]), W.n5), 'a solução da porta passa por FAZER no caminho (quem acende a 2 primeiro já escreveu FAZER sem saber)');
console.log(ok ? '\nOK: cada painel tem a solução esperada, e o segredo tem uma só resposta.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
