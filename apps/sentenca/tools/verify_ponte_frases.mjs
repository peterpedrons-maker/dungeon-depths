// Verifica «A Ponte de Frases» (sala 14, nível 6; DESIGN.md §93; FIRE_PONTE_FRASES em src/scene/rooms/chapter1c.ts). Uso: node tools/verify_ponte_frases.mjs
// O meio da sala é um FOSSO. Cada frase da parede tem uma LAJE no fosso, logo ao lado dela; acender a frase faz a laje subir até o chão e
// virar um degrau. As frases verdadeiras (inclusive os boatos verdadeiros) aguentam o peso; uma laje de frase FALSA sobe igual, mas racha e
// cai quando alguém pisa nela (o jogador cai no fosso e volta à entrada; a Casa apaga as frases). A porta diz «ACENDER VERDADE»: a Casa só
// julga quando o jogador acende a frase da porta, e o conjunto aceso tem de ser exatamente o das verdadeiras.
// A grade do fosso: duas colunas (E = junto da parede esquerda, D = junto da direita) e quatro fileiras (0 = junto da entrada, 3 = junto da porta).
// [coluna, fileira, frase, marca, demonstração]: a ordem é a do jogo (FPF_SLABS)
const SLABS = [
  ['E', 0, [1, 'antes', 2], 'conf', true], // demonstração, já acesa
  ['D', 0, [2, 'depois', 1], 'boato', true], // demonstração, já acesa (um boato aceso: diz o mesmo que a confirmada)
  ['E', 1, [1, 'depois', 3], 'conf', false],
  ['D', 1, [4, 'antes', 1], 'boato', false],
  ['E', 2, [3, 'antes', 4], 'boato', false],
  ['D', 2, [2, 'depois', 3], 'boato', false],
  ['E', 3, [3, 'depois', 1], 'boato', false],
  ['D', 3, [4, 'depois', 2], 'conf', false],
];
// a ordem que as confirmadas fixam (busca: todas as ordens de 1..4)
const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
const holds = (o, [a, rel, b]) => (rel === 'antes' ? o.indexOf(a) < o.indexOf(b) : o.indexOf(a) > o.indexOf(b));
const confOrders = perms([1, 2, 3, 4]).filter((o) => SLABS.every((s) => s[3] !== 'conf' || holds(o, s[2])));
let fail = false;
const check = (cond, msg) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) fail = true;
};
check(confOrders.length === 1, `as confirmadas fixam uma ordem só: ${confOrders.map((o) => o.join('-')).join(' | ')}`);
const ORDER = confOrders[0];
const truth = SLABS.map((s) => holds(ORDER, s[2]));
console.log('   verdade de cada frase:', SLABS.map((s, i) => `${s[2].join(' ')} ${s[3]} = ${truth[i] ? 'V' : 'F'}`).join(' · '));
// caminho: da entrada (fileira 0) até a porta (fileira 3) só por lajes levantadas, andando para os lados ou para a frente (sem diagonal)
const cell = (c, r) => SLABS.findIndex((s) => s[0] === c && s[1] === r);
const path = (up, solidOnly) => {
  const ok = (i) => i >= 0 && up[i] && (!solidOnly || truth[i]);
  const seen = new Set();
  const q = [];
  for (const c of ['E', 'D']) if (ok(cell(c, 0))) q.push([c, 0]);
  while (q.length) {
    const [c, r] = q.shift();
    const k = `${c}${r}`;
    if (seen.has(k)) continue;
    seen.add(k);
    if (r === 3) return true;
    for (const [nc, nr] of [[c === 'E' ? 'D' : 'E', r], [c, r + 1], [c, r - 1]]) if (nr >= 0 && nr <= 3 && ok(cell(nc, nr))) q.push([nc, nr]);
  }
  return false;
};
const demo = SLABS.map((s) => s[4]);
const N = SLABS.length;
// 1) a Casa só aceita um conjunto: exatamente as verdadeiras
let accepted = 0;
let crossOnlyTrue = 0;
for (let m = 0; m < 1 << N; m++) {
  const up = SLABS.map((s, i) => s[4] || !!(m & (1 << i)));
  if (SLABS.some((s, i) => s[4] && !(m & (1 << i)))) continue; // (as demonstrações estão sempre acesas)
  const exact = up.every((u, i) => u === truth[i]);
  if (exact) accepted++;
  if (exact && path(up, true)) crossOnlyTrue++;
}
check(accepted === 1 && crossOnlyTrue === 1, 'um conjunto só é aceito (as seis verdadeiras, contando a demonstração) e com ele há caminho firme até a porta');
// 2) só as confirmadas não atravessam: falta um boato verdadeiro
const upConf = SLABS.map((s) => s[4] || s[3] === 'conf');
check(!path(upConf, true), 'acendendo só as confirmadas (o hábito da sala 8) o fosso não se atravessa');
// 3) cada boato verdadeiro é necessário para o caminho
const tb = SLABS.map((s, i) => i).filter((i) => !demo[i] && SLABS[i][3] === 'boato' && truth[i]);
for (const i of tb) {
  const up = truth.map((v, j) => v && j !== i);
  check(!path(up, true), `sem o boato verdadeiro «${SLABS[i][2].join(' ')}» não há caminho`);
}
// 4) nenhuma coluna reta é segura: as duas passam por uma laje falsa (o caminho firme vai em zigue-zague)
const all = SLABS.map(() => true);
for (const col of ['E', 'D']) {
  const straight = [0, 1, 2, 3].map((r) => cell(col, r));
  check(straight.some((i) => !truth[i]), `a coluna ${col === 'E' ? 'da esquerda' : 'da direita'}, reta, passa por uma laje falsa`);
}
check(path(all, true), '...e mesmo com tudo aceso há um caminho firme; mas a porta recusa (uma frase falsa acesa)');
console.log(fail ? '\nFALHOU' : '\nOK: A Ponte de Frases tem uma resposta só e o fosso exige os boatos verdadeiros.');
process.exit(fail ? 1 : 0);
