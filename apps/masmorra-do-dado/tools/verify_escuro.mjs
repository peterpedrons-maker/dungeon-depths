// Verifica «O Escuro» (sala 13, nível 7; ver PUZZLES_PROPOSTAS.md §5).
// A porta tem TRÊS lousas lado a lado e a frase «ACENDER ▢ ▢ ▢» (uma lista de números = ordem, como na sala 4). Nada na sala diz quais números.
// No teto, em cal fosforescente que só aparece no ESCURO total, há três frases. O escuro só vem quando a Casa pune um erro (escrever números
// errados nas três lousas): o jogador tem de ERRAR DE PROPÓSITO para ler o teto (e anotar no diário, porque o escuro dura só 4 s).
// Prova: 1) as frases do teto citam exatamente três números (um para cada lousa); 2) as confirmadas dão UMA ordem; 3) o boato é falso e,
// se alguém acreditar nele, cai em contradição; 4) a ordem não é a crescente nem a ordem em que os números aparecem no teto.
// Uso: node tools/verify_escuro.mjs
const TETO = [ // na ordem em que ficam no teto, da porta para o fundo
  { a: 5, rel: 'antes', b: 1, m: 'conf' }, // perto da porta
  { a: 1, rel: 'antes', b: 2, m: 'boato' }, // no meio (gasta)
  { a: 2, rel: 'antes', b: 5, m: 'conf' }, // no fundo
];
const SOLUCAO = [2, 5, 1];
const nums = [...new Set(TETO.flatMap((s) => [s.a, s.b]))];
const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
const vale = (s, o) => (s.rel === 'antes' ? o.indexOf(s.a) < o.indexOf(s.b) : o.indexOf(s.a) > o.indexOf(s.b));
const CONF = TETO.filter((s) => s.m === 'conf'), BOATO = TETO.filter((s) => s.m === 'boato');
let ok = true;
const check = (c, m) => {
  console.log(`${c ? '✓' : '✗'} ${m}`);
  ok = ok && c;
};
check(nums.length === 3, `o teto cita três números (${nums.join(', ')}): um para cada lousa`);
const P = perms(nums).filter((o) => CONF.every((s) => vale(s, o)));
check(P.length === 1 && P[0].join() === SOLUCAO.join(), `as confirmadas dão uma ordem só: ${P.map((o) => o.join('-')).join(' ')}`);
CONF.forEach((c, i) => check(perms(nums).filter((o) => CONF.filter((_, j) => j !== i).every((s) => vale(s, o))).length > 1, `sem «${c.a} ${c.rel.toUpperCase()} ${c.b}» sobram várias ordens (era necessária)`));
check(BOATO.every((b) => !vale(b, SOLUCAO)) && perms(nums).filter((o) => TETO.every((s) => vale(s, o))).length === 0, 'o boato é falso; acreditar nele dá contradição');
check(SOLUCAO.join() !== [...nums].sort((a, b) => a - b).join() && SOLUCAO.join() !== nums.join(), 'a ordem não é a crescente nem a de aparição no teto');
console.log(ok ? '\nOK.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
