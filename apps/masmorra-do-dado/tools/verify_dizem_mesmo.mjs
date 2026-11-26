// Verifica «Os Que Dizem o Mesmo» (sala 16, nível 9; ver PUZZLES_PROPOSTAS.md §5).
// Claustro a céu aberto. Cinco braseiros (UM a CINCO; o TRÊS é o GRANDE, o CINCO é o PEQUENO). Três frases CONFIRMADAS talhadas nas galerias;
// cinco BOATOS em estandartes de PANO pendurados entre as colunas; na fonte, a lei «DOIS BOATO IGUAL VERDADE» (vale para os boatos que EXISTEM).
// A porta: «ACENDER UM BOATO» (pôr fogo num estandarte: o boato sai da conta) e «ACENDER TODOS BRASEIRO ORDEM». Queimar um 2º estandarte faz a
// Casa pendurar todos de volta (recomeça).
// Prova: 1) com todos os estandartes, a lei não tem solução (contradição); 2) queimando o estandarte certo, há UMA ordem; 3) queimando qualquer
// outro, 0 ou várias; 4) há um par de boatos que dizem o mesmo (um com número, outro com apelido); 5) cada confirmada é necessária no fim.
// Uso: node tools/verify_dizem_mesmo.mjs
const NOMES = { grande: 3, pequeno: 5 };
const CONF = [{ a: 'pequeno', r: 'antes', b: 3 }, { a: 1, r: 'antes', b: 5 }, { a: 5, r: 'antes', b: 2 }];
const BOATOS = [
  { a: 2, r: 'antes', b: 4 },
  { a: 'grande', r: 'depois', b: 2 },
  { a: 2, r: 'antes', b: 3 },
  { a: 3, r: 'antes', b: 1 },
  { a: 3, r: 'depois', b: 4 },
];
const K = 2, QUEIMAR = 0, SOLUCAO = [1, 5, 2, 3, 4];
const ent = (e) => (typeof e === 'number' ? e : NOMES[e]);
const vale = (s, o) => { const a = o.indexOf(ent(s.a)), b = o.indexOf(ent(s.b)); return s.r === 'antes' ? a < b : a > b; };
const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
const P = perms([1, 2, 3, 4, 5]);
const sat = (C, B) => P.filter((o) => C.every((s) => vale(s, o)) && B.filter((s) => vale(s, o)).length === K);
const txt = (s) => `${String(s.a).toUpperCase()} ${s.r.toUpperCase()} ${String(s.b).toUpperCase()}`;
let ok = true;
const check = (c, m) => {
  console.log(`${c ? '✓' : '✗'} ${m}`);
  ok = ok && c;
};
check(sat(CONF, BOATOS).length === 0, 'com os cinco estandartes, a lei não tem solução: é preciso queimar um');
BOATOS.forEach((b, i) => console.log(`   queimando «${txt(b)}»: ${sat(CONF, BOATOS.filter((_, j) => j !== i)).length} ordem(ns)`));
const certos = BOATOS.map((_, i) => i).filter((i) => sat(CONF, BOATOS.filter((_, j) => j !== i)).length === 1);
check(certos.length === 1 && certos[0] === QUEIMAR, `só um estandarte deixa a lei com uma resposta: «${txt(BOATOS[QUEIMAR])}»`);
const fim = BOATOS.filter((_, j) => j !== QUEIMAR);
const s = sat(CONF, fim);
check(s.length === 1 && s[0].join() === SOLUCAO.join(), `a ordem: ${s.map((o) => o.join('-')).join('')}`);
CONF.forEach((c, i) => check(sat(CONF.filter((_, j) => j !== i), fim).length > 1, `sem «${txt(c)}»: várias ordens (necessária)`));
const eqv = (x, y) => (ent(x.a) === ent(y.a) && ent(x.b) === ent(y.b) && x.r === y.r) || (ent(x.a) === ent(y.b) && ent(x.b) === ent(y.a) && x.r !== y.r);
const nick = (s) => typeof s.a === 'string' || typeof s.b === 'string';
const pares = [];
BOATOS.forEach((x, i) => BOATOS.forEach((y, j) => { if (i < j && eqv(x, y)) pares.push([i, j]); }));
check(pares.length === 1 && nick(BOATOS[pares[0][0]]) !== nick(BOATOS[pares[0][1]]), `par equivalente: «${txt(BOATOS[pares[0][0]])}» = «${txt(BOATOS[pares[0][1]])}» (um com apelido, outro com número)`);
check(P.every((o) => !vale(BOATOS[3], o) || !CONF.every((c) => vale(c, o))), `«${txt(BOATOS[3])}» é sempre falso (as confirmadas põem o UM primeiro): uma pista para começar`);
check(SOLUCAO.join() !== '1,2,3,4,5', 'a ordem não é 1-2-3-4-5');
console.log(ok ? '\nOK.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
