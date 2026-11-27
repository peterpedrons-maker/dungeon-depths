// Verifica «O Que a Casa Confirma» REFEITA (sala 7, nível 5; ver PUZZLES_PROPOSTAS.md §5). Pedido do Pedro: a versão do jogo tinha glifos demais
// de uma vez. Agora são duas partes curtas.
// PARTE 1 (as marcas, com a lousa que o jogador já domina): acima de uma lousa de fogo, duas frases: «ACENDER QUATRO CONFIRMADO» e
// «ACENDER TRÊS BOATO». Escrever QUATRO abre a grade; escrever TRÊS faz a Casa apagar a lousa (e o glifo BOATO pisca). A marca se explica pelo efeito.
// PARTE 2 (ANTES/DEPOIS): cinco frases curtas na parede (3 confirmadas, 2 boatos). Acender com o Fogo as confirmadas (um boato apaga as acesas);
// com as três acesas, QUATRO pilares sobem; acendê-los na ordem que as confirmadas dão.
// Prova: 1) na lousa, nenhum desenho no caminho de escrever TRÊS é aceito por engano (TRÊS não passa pelo QUATRO) e vice-versa;
// 2) as 3 confirmadas dão UMA ordem entre 24 e cada uma é necessária; 3) os boatos são falsos e acreditar neles dá contradição;
// 4) a ordem não é 1-2-3-4 nem a de leitura das frases.
// Uso: node tools/verify_confirma.mjs
const GLIFO = { n3: [0, 4, 8], n4: [0, 2, 6, 8] };
const LOUSA = { aceita: 'n4', recusa: 'n3' };
const PARAGRAFOS = [
  { parede: 'esquerda', linhas: [{ a: 1, rel: 'antes', b: 3, m: 'conf' }, { a: 3, rel: 'antes', b: 2, m: 'boato' }] },
  { parede: 'direita', linhas: [{ a: 4, rel: 'depois', b: 2, m: 'conf' }, { a: 1, rel: 'antes', b: 4, m: 'boato' }, { a: 1, rel: 'depois', b: 4, m: 'conf' }] },
];
const SOLUCAO = [2, 4, 1, 3];

let ok = true;
const check = (c, m) => {
  console.log(`${c ? '✓' : '✗'} ${m}`);
  ok = ok && c;
};
// parte 1: um glifo não pode ser subconjunto do outro (senão, escrevendo um, o outro dispararia no meio do caminho)
const sub = (A, B) => A.every((x) => B.includes(x));
check(!sub(GLIFO[LOUSA.aceita], GLIFO[LOUSA.recusa]) && !sub(GLIFO[LOUSA.recusa], GLIFO[LOUSA.aceita]), 'parte 1: escrevendo TRÊS nunca se passa pelo QUATRO (nem o contrário): o efeito de cada marca é limpo');

const linhas = PARAGRAFOS.flatMap((p) => p.linhas);
const CONF = linhas.filter((l) => l.m === 'conf');
const BOATOS = linhas.filter((l) => l.m === 'boato');
const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
const P = perms([1, 2, 3, 4]);
const vale = (s, o) => (s.rel === 'antes' ? o.indexOf(s.a) < o.indexOf(s.b) : o.indexOf(s.a) > o.indexOf(s.b));
const sat = (S) => P.filter((o) => S.every((s) => vale(s, o)));
const txt = (s) => `${s.a} ${s.rel.toUpperCase()} ${s.b}`;
const s = sat(CONF);
check(s.length === 1 && s[0].join() === SOLUCAO.join(), `parte 2: as 3 confirmadas dão uma ordem só entre 24: ${s.map((o) => o.join('-')).join(' ')}`);
CONF.forEach((c, i) => {
  const n = sat(CONF.filter((_, j) => j !== i)).length;
  check(n > 1, `sem «${txt(c)}»: ${n} ordens (era necessária)`);
});
check(BOATOS.every((b) => !vale(b, SOLUCAO)), `os boatos são falsos: ${BOATOS.map(txt).join(' · ')}`);
check(sat([...CONF, ...BOATOS]).length === 0, 'acreditar nos boatos junto com as confirmadas: contradição');
check(SOLUCAO.join() !== '1,2,3,4', 'a ordem não é 1-2-3-4');
const leitura = [...new Set(CONF.flatMap((c) => [c.a, c.b]))];
check(leitura.join() !== SOLUCAO.join(), `a ordem não é a de leitura das frases (${leitura.join('-')})`);
console.log(`   (parte 2: ${linhas.length} frases e 4 pilares, contra 7 frases da versão antiga; as marcas já foram ensinadas na parte 1)`);
console.log(ok ? '\nOK.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
