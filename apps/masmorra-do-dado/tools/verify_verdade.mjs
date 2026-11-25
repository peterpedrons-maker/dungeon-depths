// Verifica a proposta «O Boato Verdadeiro» (sala 8, nível 6; ver PUZZLES_PROPOSTAS.md).
// Quatro pilares escondidos (UM a QUATRO). A porta diz «ACENDER VERDADE CONFIRMADO»: o jogador acende TODAS as frases VERDADEIRAS
// (confirmadas e também os boatos que são verdade) e nenhuma falsa, e então acende a frase da porta para a Casa julgar.
// Perto da entrada há um parágrafo que a Casa já deixa ACESO (demonstração): «UM ANTES DOIS CONFIRMADO» e «DOIS DEPOIS UM BOATO».
// Prova:
//  1) as frases CONFIRMADAS (com a da demonstração) dão UMA ordem só, e cada uma é necessária;
//  2) com essa ordem, cada boato é decidido (verdadeiro ou falso); o conjunto a acender é único;
//  3) os hábitos da sala 6 falham: "acender só as confirmadas", "boato é sempre mentira" (dá contradição),
//     "só é verdade o boato que repete uma confirmada";
//  4) os boatos verdadeiros só se provam por CADEIA (nenhum fala do mesmo par que uma confirmada);
//  5) chutar o conjunto: 2^6 = 64 escolhas, cada erro custa a pena.
// Uso: node tools/verify_verdade.mjs
const SALA = {
  braseiros: [1, 2, 3, 4],
  demo: [
    { a: 1, rel: 'antes', b: 2, marca: 'conf' }, // já acesa
    { a: 2, rel: 'depois', b: 1, marca: 'boato' }, // já acesa: um boato que diz o mesmo que a confirmada também é verdade
  ],
  frases: [
    // parágrafo esquerdo
    { a: 1, rel: 'depois', b: 3, marca: 'conf' },
    { a: 4, rel: 'antes', b: 1, marca: 'boato' },
    // parágrafo direito (perto da entrada)
    { a: 3, rel: 'antes', b: 4, marca: 'boato' },
    { a: 4, rel: 'depois', b: 2, marca: 'conf' },
    // parágrafo direito (perto da porta)
    { a: 2, rel: 'depois', b: 3, marca: 'boato' },
    { a: 3, rel: 'depois', b: 1, marca: 'boato' },
  ],
  acender: [0, 2, 3, 4], // índices em `frases` que são verdade (as confirmadas + 2 boatos)
  solucao: [3, 1, 2, 4], // ordem dos pilares no passo 2
};

const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
const PERMS = perms(SALA.braseiros);
const holds = (s, o) => {
  const a = o.indexOf(s.a), b = o.indexOf(s.b);
  return s.rel === 'antes' ? a < b : a > b;
};
const sat = (S) => PERMS.filter((o) => S.every((s) => holds(s, o)));
const txt = (s) => `${s.a} ${s.rel.toUpperCase()} ${s.b} ${s.marca === 'conf' ? 'CONFIRMADO' : 'BOATO'}`;
let ok = true;
const check = (cond, msg) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
  ok = ok && cond;
};

const CONF = [...SALA.demo, ...SALA.frases].filter((s) => s.marca === 'conf');
const ords = sat(CONF);
console.log('ordens pelas confirmadas:', ords.map((o) => o.join('-')).join(' '));
check(ords.length === 1 && ords[0].join() === SALA.solucao.join(), `as confirmadas dão uma ordem só: ${SALA.solucao.join('-')}`);
CONF.forEach((c, i) => {
  const n = sat(CONF.filter((_, j) => j !== i)).length;
  check(n > 1, `sem «${txt(c)}»: ${n} ordens (era necessária)`);
});
const sol = SALA.solucao;
check(SALA.demo.every((s) => holds(s, sol)), 'as duas frases da demonstração (já acesas) são verdade');

// verdade de cada frase acendível
const verdade = SALA.frases.map((s) => holds(s, sol));
SALA.frases.forEach((s, i) => console.log(`   ${verdade[i] ? 'VERDADE' : 'falsa  '}  ${txt(s)}`));
const certo = verdade.flatMap((v, i) => (v ? [i] : []));
check(certo.join() === SALA.acender.join(), `conjunto a acender = frases ${certo.map((i) => i + 1).join(', ')}`);
const confs = SALA.frases.filter((s) => s.marca === 'conf');
check(confs.every((s) => holds(s, sol)), 'toda frase CONFIRMADA é verdade (a Casa não mente)');
const bv = SALA.frases.filter((s, i) => s.marca === 'boato' && verdade[i]).length;
const bf = SALA.frases.filter((s, i) => s.marca === 'boato' && !verdade[i]).length;
check(bv === 2 && bf === 2, `boatos: ${bv} verdadeiros e ${bf} falsos`);

// unicidade do conjunto: entre as 64 escolhas de frases acesas, quantas são "consistentes" (existe ordem em que as acesas
// são verdade e as apagadas são falsas, com as confirmadas e a demonstração verdadeiras)?
const N = SALA.frases.length;
let consist = 0;
for (let m = 0; m < 1 << N; m++) {
  const lit = SALA.frases.map((_, i) => !!((m >> i) & 1));
  const n = PERMS.filter((o) => CONF.every((s) => holds(s, o)) && SALA.demo.every((s) => holds(s, o)) && SALA.frases.every((s, i) => holds(s, o) === lit[i])).length;
  if (n > 0) consist++;
}
check(consist === 1, `escolhas de frases acesas que fazem sentido: ${consist} de ${1 << N}`);

// hábitos errados
const soConf = SALA.frases.flatMap((s, i) => (s.marca === 'conf' ? [i] : []));
check(soConf.join() !== SALA.acender.join(), 'hábito da sala 6 («acender só as confirmadas») é recusado');
const negados = SALA.frases.filter((s) => s.marca === 'boato').map((s) => ({ ...s, rel: s.rel === 'antes' ? 'depois' : 'antes' }));
check(sat([...CONF, ...negados]).length === 0, '«boato é sempre mentira» leva a contradição (0 ordens)');
const par = (s) => [s.a, s.b].sort().join();
const paresConf = new Set(CONF.map(par));
const boatosV = SALA.frases.filter((s, i) => s.marca === 'boato' && verdade[i]);
check(boatosV.every((s) => !paresConf.has(par(s))), 'os boatos verdadeiros não repetem uma confirmada: só se provam pela cadeia');
check(sol.join() !== '1234', 'a ordem não é 1-2-3-4');

console.log(ok ? '\nOK: ordem única, conjunto de frases único, hábitos antigos falham.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
