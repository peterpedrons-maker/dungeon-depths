// Verifica «A Sombra» (sala 12, nível 7; ver PUZZLES_PROPOSTAS.md §5).
// No meio da sala, uma TELA DE PEDRA com 9 "olhos" em grade 3x3; só 2 são furos de verdade (o de cima à esquerda e o do centro), os outros 7 são
// cegos. Na parede do fundo, uma MOLDURA 3x3. Cada braseiro aceso projeta os furos como manchas de luz na moldura, deslocadas conforme a posição
// dele (o que cai fora da moldura não conta). A porta: «ACENDER ▢ BRASEIRO», e a casa ▢ É a moldura de luz. A frase tem de ficar VERDADEIRA
// (como na porta da sala 3): o número que a luz escreve tem de ser o número de braseiros acesos.
// Prova: 1) um só conjunto de braseiros torna a frase verdadeira; 2) há conjuntos que escrevem o desenho certo com o número ERRADO de braseiros
// (a armadilha: a luz diz TRÊS, mas só há dois acesos); 3) nenhum braseiro sozinho escreve UM.
// Uso: node tools/verify_sombra.mjs
const NUM = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8] };
const NOME = { 1: 'UM', 2: 'DOIS', 3: 'TRÊS', 4: 'QUATRO', 5: 'CINCO' };
const FUROS = [0, 4];
const BRASEIROS = [
  { id: 'F', onde: 'na frente da tela, meia altura', d: [0, 0] },
  { id: 'BD', onde: 'baixo, à direita', d: [-1, -1] },
  { id: 'AE', onde: 'alto, à esquerda (num pedestal)', d: [1, 1] },
  { id: 'BC', onde: 'baixo, no centro (no chão)', d: [0, -1] },
  { id: 'BE', onde: 'baixo, à esquerda', d: [1, -1] },
];
const SOLUCAO = ['F', 'BD', 'AE'];
const proj = ([dx, dy]) => FUROS.map((h) => [(h % 3) + dx, ((h / 3) | 0) + dy]).filter(([x, y]) => x >= 0 && x < 3 && y >= 0 && y < 3).map(([x, y]) => y * 3 + x);
const desenho = (S) => [...new Set(S.flatMap((b) => proj(b.d)))].sort((a, b) => a - b);
const qualNumero = (cells) => Object.keys(NUM).find((k) => NUM[k].join() === cells.join());
let ok = true;
const check = (c, m) => {
  console.log(`${c ? '✓' : '✗'} ${m}`);
  ok = ok && c;
};
BRASEIROS.forEach((b) => console.log(`   ${b.id} (${b.onde}) projeta as casas ${proj(b.d).join(', ') || '(nada)'}`));
const verdadeiros = [], mentirosos = [];
for (let m = 1; m < 1 << BRASEIROS.length; m++) {
  const S = BRASEIROS.filter((_, i) => (m >> i) & 1);
  const n = qualNumero(desenho(S));
  if (!n) continue;
  (Number(n) === S.length ? verdadeiros : mentirosos).push(`${S.map((b) => b.id).join('+')} escreve ${NOME[n]} com ${S.length} aceso(s)`);
}
console.log('   conjuntos que escrevem um número:', [...verdadeiros, ...mentirosos].join(' | '));
check(verdadeiros.length === 1 && verdadeiros[0].startsWith(SOLUCAO.join('+')), `uma só frase verdadeira: ${verdadeiros.join('')}`);
check(mentirosos.length >= 2, `armadilhas (o desenho certo, mas a frase mente): ${mentirosos.join('; ')}`);
check(BRASEIROS.every((b) => qualNumero(proj(b.d).sort()) !== '1'), 'nenhum braseiro sozinho escreve UM (senão "um braseiro, UM" seria resposta)');
check(desenho(BRASEIROS.filter((b) => b.id === 'BD')).every((c) => desenho(BRASEIROS.filter((b) => ['F', 'AE'].includes(b.id))).includes(c)), 'o 3º braseiro da solução não muda o desenho: só muda a verdade da frase');
console.log(ok ? '\nOK.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
