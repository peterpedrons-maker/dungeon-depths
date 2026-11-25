// Verifica a proposta revisada de «O Que a Casa Confirma» (sala 7, nível 5; ver PUZZLES_PROPOSTAS.md §5).
// Passo 1 (ensino): acender com o Fogo as frases CONFIRMADAS da parede; tocar uma de BOATO apaga as acesas (a marca se explica pelo efeito).
// Passo 2 (o puzzle): com as quatro confirmadas acesas, CINCO pilares sobem do chão (UM a CINCO). Acender os pilares na ordem que as
// confirmadas dão (ANTES/DEPOIS). Errar apaga tudo e deixa os pilares frios por 8 s.
// Prova: 1) as confirmadas dão UMA ordem entre 120; 2) cada confirmada é necessária (a versão antiga tinha uma frase sobrando);
// 3) os boatos são todos falsos (nesta sala a Casa só aceita o confirmado; a sala 11 vai quebrar esse hábito);
// 4) quem acredita nos boatos junto com as confirmadas cai em contradição; 5) a ordem não é 1-2-3-4-5 nem a ordem em que as frases
//    confirmadas aparecem lidas de cima para baixo, da esquerda para a direita.
// Uso: node tools/verify_confirma.mjs
const PARAGRAFOS = [
  { parede: 'esquerda, perto da entrada', linhas: [{ a: 2, rel: 'depois', b: 5, m: 'conf' }, { a: 5, rel: 'antes', b: 1, m: 'boato' }] },
  { parede: 'esquerda, perto da porta', linhas: [{ a: 3, rel: 'depois', b: 2, m: 'conf' }, { a: 3, rel: 'antes', b: 4, m: 'boato' }] },
  { parede: 'direita', linhas: [{ a: 1, rel: 'depois', b: 4, m: 'conf' }, { a: 2, rel: 'depois', b: 3, m: 'boato' }, { a: 1, rel: 'antes', b: 5, m: 'conf' }] },
];
const SOLUCAO = [4, 1, 5, 2, 3];
const linhas = PARAGRAFOS.flatMap((p) => p.linhas);
const CONF = linhas.filter((l) => l.m === 'conf');
const BOATOS = linhas.filter((l) => l.m === 'boato');
const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
const P = perms([1, 2, 3, 4, 5]);
const vale = (s, o) => (s.rel === 'antes' ? o.indexOf(s.a) < o.indexOf(s.b) : o.indexOf(s.a) > o.indexOf(s.b));
const sat = (S) => P.filter((o) => S.every((s) => vale(s, o)));
const txt = (s) => `${s.a} ${s.rel.toUpperCase()} ${s.b}`;
let ok = true;
const check = (c, m) => {
  console.log(`${c ? '✓' : '✗'} ${m}`);
  ok = ok && c;
};
const s = sat(CONF);
check(s.length === 1 && s[0].join() === SOLUCAO.join(), `as 4 confirmadas dão uma ordem só: ${s.map((o) => o.join('-')).join(' ')}`);
CONF.forEach((c, i) => {
  const n = sat(CONF.filter((_, j) => j !== i)).length;
  check(n > 1, `sem «${txt(c)}»: ${n} ordens (era necessária)`);
});
check(BOATOS.every((b) => !vale(b, SOLUCAO)), `os ${BOATOS.length} boatos são falsos: ${BOATOS.map(txt).join(' · ')}`);
check(sat([...CONF, ...BOATOS]).length === 0, 'acreditar nos boatos junto com as confirmadas: contradição (0 ordens)');
check(SOLUCAO.join() !== '1,2,3,4,5', 'a ordem não é 1-2-3-4-5');
// ordem "de leitura": os números na ordem em que aparecem nas frases confirmadas, de cima para baixo
const leitura = [...new Set(CONF.flatMap((c) => [c.a, c.b]))];
check(leitura.join() !== SOLUCAO.join(), `a ordem não é a de leitura das frases (${leitura.join('-')})`);
check(P.length === 120, `chutar: ${P.length} ordens, cada erro deixa os pilares frios por 8 s`);
console.log(ok ? '\nOK.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
