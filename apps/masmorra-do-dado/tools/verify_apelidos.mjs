// Verifica a proposta «Os Apelidos» (sala 7, nível 6; ver PUZZLES_PROPOSTAS.md).
// Cinco braseiros: UM, DOIS, TRÊS e QUATRO têm número no pedestal; o quinto, GRANDE, não tem número (o pedestal mostra o glifo GRANDE).
// O QUATRO é o único PEQUENO. Todas as frases são CONFIRMADAS (a porta também conta como pista).
// Prova:
//  1) com a leitura certa (GRANDE = o braseiro sem número, PEQUENO = o QUATRO) há UMA ordem só;
//  2) nenhuma frase é descartável (sem qualquer uma sobram várias ordens);
//  3) a "primeira impressão" (o glifo PEQUENO parece UM numa moldura, o GRANDE parece QUATRO) leva a CONTRADIÇÃO (0 ordens),
//     e não a uma outra resposta: quem cai na armadilha percebe que errou sem precisar chutar;
//  4) a ordem não é a "natural" (1-2-3-4 com o grande em algum lugar) nem "do maior para o menor";
//  5) chutar não compensa (120 ordens).
// Uso: node tools/verify_apelidos.mjs
const SALA = {
  braseiros: [
    { id: 1, rotulo: 'n1', tamanho: 'medio' },
    { id: 2, rotulo: 'n2', tamanho: 'medio' },
    { id: 3, rotulo: 'n3', tamanho: 'medio' },
    { id: 4, rotulo: 'n4', tamanho: 'pequeno' },
    { id: 5, rotulo: 'grande', tamanho: 'grande' }, // sem número
  ],
  porta: { a: 'grande', rel: 'antes', b: 'pequeno' }, // «ACENDER GRANDE ANTES PEQUENO CONFIRMADO»
  frases: [
    { a: 'n1', rel: 'depois', b: 'n2' }, // «UM DEPOIS DOIS CONFIRMADO»
    { a: 'grande', rel: 'depois', b: 'n3' }, // «GRANDE DEPOIS TRÊS CONFIRMADO»
    { a: 'pequeno', rel: 'antes', b: 'n2' }, // «PEQUENO ANTES DOIS CONFIRMADO»
  ],
  solucao: [3, 5, 4, 2, 1], // TRÊS, GRANDE, QUATRO (o pequeno), DOIS, UM
};

const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
const IDS = SALA.braseiros.map((b) => b.id);
const PERMS = perms(IDS);
const nome = (id) => (id === 5 ? 'GRANDE' : String(id));
const mostra = (o) => o.map(nome).join('-');

// leitura de uma palavra: número -> braseiro com aquele número; GRANDE/PEQUENO -> segundo um "mapa" de leitura
const LEITURA_CERTA = { grande: SALA.braseiros.find((b) => b.tamanho === 'grande').id, pequeno: SALA.braseiros.find((b) => b.tamanho === 'pequeno').id };
const ent = (w, m) => (w[0] === 'n' ? Number(w.slice(1)) : m[w]);
const holds = (s, o, m) => {
  const a = o.indexOf(ent(s.a, m)), b = o.indexOf(ent(s.b, m));
  if (a < 0 || b < 0 || a === b) return false;
  return s.rel === 'antes' ? a < b : a > b;
};
const sat = (S, m) => PERMS.filter((o) => S.every((s) => holds(s, o, m)));
for (const t of ['grande', 'pequeno']) if (SALA.braseiros.filter((b) => b.tamanho === t).length !== 1) throw new Error(`${t} precisa ser único`);

const TODAS = [SALA.porta, ...SALA.frases];
let ok = true;
const check = (cond, msg) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
  ok = ok && cond;
};

const full = sat(TODAS, LEITURA_CERTA);
console.log('ordens com todas as pistas (leitura certa):', full.map(mostra).join(' '));
check(full.length === 1 && full[0].join() === SALA.solucao.join(), `solução única = ${mostra(SALA.solucao)}`);

TODAS.forEach((_, i) => {
  const n = sat(TODAS.filter((_, j) => j !== i), LEITURA_CERTA).length;
  check(n > 1, `sem a pista ${i === 0 ? 'da porta' : i}: ${n} ordens (era necessária)`);
});

// armadilhas de leitura (o glifo PEQUENO = moldura de qualidade com UM ponto; GRANDE = moldura com os QUATRO pontos dos cantos)
const ARMADILHAS = [
  ['PEQUENO = UM e GRANDE = QUATRO (pelo desenho do glifo)', { pequeno: 1, grande: 4 }],
  ['PEQUENO = UM (e GRANDE certo)', { pequeno: 1, grande: 5 }],
  ['GRANDE = QUATRO (e PEQUENO certo; aí as duas palavras seriam o mesmo braseiro)', { pequeno: 4, grande: 4 }],
];
for (const [nomeA, m] of ARMADILHAS) {
  const n = sat(TODAS, m).length;
  check(n === 0, `armadilha «${nomeA}»: ${n} ordens (contradição: o jogador percebe que leu errado)`);
}
// ignorar as frases com apelido (ler só as de número)
const soNumeros = TODAS.filter((s) => s.a[0] === 'n' && s.b[0] === 'n');
check(sat(soNumeros, LEITURA_CERTA).length >= 20, `só com as frases de número: ${sat(soNumeros, LEITURA_CERTA).length} ordens (os apelidos são indispensáveis)`);

const sol = SALA.solucao;
check(sol[0] !== 5, 'o GRANDE não é o primeiro (não é "do maior para o menor")');
const semG = sol.filter((x) => x !== 5).join('');
check(!['1234', '4321'].includes(semG), `os números não estão em ordem simples (${semG})`);
check(PERMS.length === 120, `chutar: ${PERMS.length} ordens possíveis`);

console.log(ok ? '\nOK: solução única, todas as pistas necessárias, armadilha leva a contradição.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
