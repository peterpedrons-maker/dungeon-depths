// Verifica a proposta «A Ponte de Madeira» (sala 10, nível 6; ver PUZZLES_PROPOSTAS.md §5).
// O fundo do fosso tem 9 braseiros em grade 3x3 (casas 0..8; 0 = canto do fundo à esquerda, olhando da rampa para a porta) com canaletas que
// descem num sentido só, como na sala 4. Novidade: onde duas canaletas diagonais se cruzam, uma passa POR BAIXO de uma PRANCHA DE MADEIRA
// que leva a outra POR CIMA. Quando o fogo passa por baixo, a prancha queima e cai: a canaleta de cima fica CORTADA (se ainda não levou fogo).
// A porta: «ACENDER DOIS» + o glifo MAIS (a cruz: 1, 3, 4, 5, 7) talhado. Enquanto há fogo correndo, a Casa recusa o fogo (uma ignição de cada vez).
// Prova: 1) UMA sequência de duas ignições escreve a cruz; 2) a mesma dupla na ordem contrária NÃO escreve: a ordem importa;
// 3) com uma ignição é impossível; 4) quem acha que a madeira não muda nada (ignora as pranchas) não acha resposta nenhuma;
// 5) começar pelo meio (a lição da sala 4) não resolve.
// Uso: node tools/verify_ponte.mjs
const CANALETAS = [[6, 7], [0, 3], [3, 1], [2, 1], [8, 5], [4, 5], [4, 3], [7, 4], [2, 4], [2, 5], [4, 0]]; // [de, para]
const PRANCHAS = { '1-3': '0-4' }; // a canaleta 3→1 passa por baixo da prancha que leva a 4→0 por cima
const ALVO = [1, 3, 4, 5, 7]; // MAIS
const SOLUCAO = [3, 7];

const key = (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`;
const vizinhos = (a, b) => Math.max(Math.abs((a % 3) - (b % 3)), Math.abs(((a / 3) | 0) - ((b / 3) | 0))) === 1;
function fogo(seq, pranchas = PRANCHAS) {
  const lit = new Set(), usadas = new Set(), cortadas = new Set();
  for (const s of seq) {
    lit.add(s);
    for (let ch = true; ch; ) {
      ch = false;
      for (const [a, b] of CANALETAS) {
        const k = key(a, b);
        if (lit.has(a) && !usadas.has(k) && !cortadas.has(k)) {
          usadas.add(k);
          lit.add(b);
          ch = true;
          const cima = pranchas[k];
          if (cima && !usadas.has(cima)) cortadas.add(cima);
        }
      }
    }
  }
  return lit;
}
const escreve = (s) => s.size === ALVO.length && ALVO.every((x) => s.has(x));
let ok = true;
const check = (c, m) => {
  console.log(`${c ? '✓' : '✗'} ${m}`);
  ok = ok && c;
};
check(CANALETAS.every(([a, b]) => vizinhos(a, b)), 'toda canaleta liga braseiros vizinhos');
for (const [baixo, cima] of Object.entries(PRANCHAS)) {
  const [a, b] = baixo.split('-').map(Number), [c, d] = cima.split('-').map(Number);
  check(new Set([a, b, c, d]).size === 4 && [a, b, c, d].every((x, i, A) => A.every((y) => x === y || vizinhos(x, y))), `a prancha ${cima} cruza a canaleta ${baixo} no mesmo bloco 2x2 (diagonais que se cruzam)`);
}
const duplas = [];
for (let a = 0; a < 9; a++) for (let b = 0; b < 9; b++) if (a !== b && escreve(fogo([a, b]))) duplas.push([a, b]);
check(duplas.length === 1 && duplas[0].join() === SOLUCAO.join(), `sequências de duas ignições que escrevem a cruz: ${duplas.map((d) => d.join('→')).join(' | ')}`);
check(!escreve(fogo([...SOLUCAO].reverse())), `a ordem contrária (${[...SOLUCAO].reverse().join('→')}) não escreve: acende também ${[...fogo([...SOLUCAO].reverse())].filter((x) => !ALVO.includes(x)).join(', ')}`);
check([...Array(9).keys()].every((x) => !escreve(fogo([x]))), 'com uma ignição é impossível');
const semMadeira = [];
for (let a = 0; a < 9; a++) for (let b = 0; b < 9; b++) if (a !== b && escreve(fogo([a, b], {}))) semMadeira.push([a, b]);
check(semMadeira.length === 0, `ignorando as pranchas (se a madeira não queimasse): ${semMadeira.length} respostas: a ponte é indispensável`);
check([...Array(9).keys()].every((x) => !escreve(fogo([4, x])) && !escreve(fogo([x, 4]))), 'nenhuma sequência com o meio resolve (a lição da sala 4 não serve)');
console.log(`   (fogo no 3: acende ${[...fogo([3])].join(', ')} e queima a prancha; depois fogo no 7: acende ${[...fogo(SOLUCAO)].join(', ')})`);
// CONSTELAÇÃO C3 (perspectiva, só Fogo): na BORDA do fosso, lá em cima, há 8 tochas; olhando bem do alto da rampa, cada uma cai, vista de
// cima, sobre uma casa da grade do fundo (os 4 cantos e os 4 meios das bordas); há mais 3 tochas nas paredes do fundo (iscas).
// Depois de resolvida a sala, a cruz fica acesa lá embaixo e os QUATRO CANTOS ficam escuros. A grade inteira acesa (vista do alto) é TODOS.
// Pista: "falta alguma coisa" no desenho visto de cima. Acender as tochas da borda que caem sobre os cantos, e nenhuma outra.
const BORDA = [0, 1, 2, 3, 5, 6, 7, 8]; // casa sobre a qual cada tocha da borda cai, vista do alto
const ISCAS = 3;
const TODOS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
let aceitos = 0;
const nT = BORDA.length + ISCAS;
for (let m = 0; m < 1 << nT; m++) {
  const acesas = [...Array(nT).keys()].filter((i) => (m >> i) & 1);
  if (acesas.some((i) => i >= BORDA.length)) continue; // isca acesa: não vale
  const vistas = new Set([...ALVO, ...acesas.map((i) => BORDA[i])]);
  const sobrepoe = acesas.some((i) => ALVO.includes(BORDA[i])); // tocha em cima de braseiro já aceso: o desenho "engrossa", a Casa não aceita
  if (!sobrepoe && vistas.size === 9 && TODOS.every((x) => vistas.has(x))) aceitos++;
}
check(aceitos === 1, `C3: um só conjunto de tochas completa a grade vista do alto (${aceitos} de ${1 << nT}): as da borda sobre os cantos 0, 2, 6, 8`);
check(ALVO.length + 4 === 9, 'a cruz (MAIS) e os quatro cantos (QUATRO) juntos são TODOS: o segredo é o que falta no desenho resolvido');
console.log(ok ? '\nOK.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
