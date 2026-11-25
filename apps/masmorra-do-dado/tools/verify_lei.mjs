// Verifica os puzzles com LEI DA CONTAGEM antes do Tribunal (ver PUZZLES_PROPOSTAS.md §5):
//  · R3 (Galeria dos Condenados, opcional, nível 3): 3 braseiros, 3 boatos riscados a giz, lei «UM BOATO IGUAL VERDADE»;
//  · Sala 14 (A Lei Pequena, nível 8): 4 braseiros, 2 confirmadas, 3 boatos, lei «UM BOATO IGUAL VERDADE»;
//  · Sala 17 (A Memória da Casa, nível 9): 4 braseiros (GRANDE = 3, PEQUENO = 4), 2 confirmadas (uma só aparece no ESCURO), 4 boatos,
//    lei «DOIS BOATO IGUAL VERDADE».
// Para cada um: solução única; cada pista necessária; tratar todos os boatos como falsos (ou todos como verdadeiros) não dá a solução;
// o par de boatos EQUIVALENTES (dizem a mesma coisa) tem o mesmo valor; a ordem não é a crescente.
// Uso: node tools/verify_lei.mjs
const PUZZLES = [
  {
    nome: 'R3 · A Galeria dos Condenados (opcional)',
    n: 3, k: 1, nomes: {},
    conf: [],
    boatos: [{ a: 3, r: 'antes', b: 1 }, { a: 3, r: 'antes', b: 2 }, { a: 2, r: 'depois', b: 3 }],
    solucao: [2, 3, 1], minSoConf: 4,
  },
  {
    nome: 'Sala 14 · A Lei Pequena',
    n: 4, k: 1, nomes: {},
    conf: [{ a: 4, r: 'depois', b: 1 }, { a: 2, r: 'antes', b: 3 }],
    boatos: [{ a: 2, r: 'antes', b: 1 }, { a: 1, r: 'depois', b: 2 }, { a: 2, r: 'depois', b: 4 }],
    solucao: [1, 4, 2, 3], minSoConf: 4,
  },
  {
    nome: 'Sala 17 · A Memória da Casa',
    n: 4, k: 2, nomes: { grande: 3, pequeno: 4 },
    conf: [{ a: 'pequeno', r: 'antes', b: 2 }, { a: 1, r: 'depois', b: 4, escuro: true }],
    boatos: [{ a: 1, r: 'antes', b: 'grande' }, { a: 4, r: 'depois', b: 3 }, { a: 'grande', r: 'antes', b: 'pequeno' }, { a: 3, r: 'antes', b: 2 }],
    solucao: [4, 1, 3, 2], minSoConf: 4,
  },
];
const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
let ok = true;
const check = (c, m) => {
  console.log(`  ${c ? '✓' : '✗'} ${m}`);
  ok = ok && c;
};
for (const p of PUZZLES) {
  console.log(p.nome);
  const ent = (e) => (typeof e === 'number' ? e : p.nomes[e]);
  const vale = (s, o) => { const a = o.indexOf(ent(s.a)), b = o.indexOf(ent(s.b)); return s.r === 'antes' ? a < b : a > b; };
  const P = perms([...Array(p.n)].map((_, i) => i + 1));
  const sat = (C, B, k) => P.filter((o) => C.every((s) => vale(s, o)) && (k == null || B.filter((s) => vale(s, o)).length === k));
  const txt = (s) => `${String(s.a).toUpperCase()} ${s.r.toUpperCase()} ${String(s.b).toUpperCase()}`;
  const f = sat(p.conf, p.boatos, p.k);
  check(f.length === 1 && f[0].join() === p.solucao.join(), `solução única: ${f.map((o) => o.join('-')).join(' ')}`);
  const tv = p.boatos.map((s) => vale(s, p.solucao));
  check(tv.filter(Boolean).length === p.k, `boatos verdadeiros na solução: ${p.boatos.filter((_, i) => tv[i]).map(txt).join(' · ')} (a lei pede ${p.k})`);
  p.conf.forEach((c, i) => check(sat(p.conf.filter((_, j) => j !== i), p.boatos, p.k).length > 1, `sem a confirmada «${txt(c)}»${c.escuro ? ' (a do escuro)' : ''}: várias ordens (necessária)`));
  p.boatos.forEach((b, i) => check(sat(p.conf, p.boatos.filter((_, j) => j !== i), tv[i] ? p.k - 1 : p.k).length > 1, `sem o boato «${txt(b)}»: várias ordens (necessário)`));
  check(sat(p.conf, [], null).length >= p.minSoConf, `só com as confirmadas: ${sat(p.conf, [], null).length} ordens`);
  for (const [nm, k] of [['todos os boatos falsos', 0], ['todos verdadeiros', p.boatos.length]]) {
    const r = sat(p.conf, p.boatos, k);
    check(!(r.length === 1 && r[0].join() === p.solucao.join()), `ler "${nm}" não dá a solução (${r.length} ordens)`);
  }
  // par equivalente
  const eqv = (x, y) => (ent(x.a) === ent(y.a) && ent(x.b) === ent(y.b) && x.r === y.r) || (ent(x.a) === ent(y.b) && ent(x.b) === ent(y.a) && x.r !== y.r);
  const pares = [];
  p.boatos.forEach((x, i) => p.boatos.forEach((y, j) => { if (i < j && eqv(x, y)) pares.push([i, j]); }));
  check(pares.length === 1 && tv[pares[0][0]] === tv[pares[0][1]], `há um par de boatos que dizem o mesmo: «${pares.map(([i, j]) => `${txt(p.boatos[i])}» = «${txt(p.boatos[j])}`).join('')}» (ambos ${pares.length ? (tv[pares[0][0]] ? 'verdadeiros' : 'falsos') : '?'})`);
  check(p.solucao.join() !== [...p.solucao].sort((a, b) => a - b).join(), 'a ordem não é a crescente');
}
console.log(ok ? '\nOK.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
