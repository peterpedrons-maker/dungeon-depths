// Verifica a proposta «O Pano» (sala 8, nível 5; ver PUZZLES_PROPOSTAS.md §5).
// Regra do mundo: o que é TALHADO na pedra é da Casa (vale); o que é TECIDO num pano é boato (tem a marca BOATO bordada).
// O fogo queima o pano e mostra a pedra embaixo. Quatro braseiros (UM a QUATRO). Uma resposta = a sequência de braseiros acesos, na ordem.
// Frases (cada pano cobre uma parte de uma frase talhada; o pano C cobre pedra lisa):
//   porta:  «ACENDER [A] BRASEIRO CONFIRMADO»   pano A tecido: TODOS (BOATO)   pedra embaixo: DOIS
//   parede esquerda (alto): «[B] ANTES QUATRO CONFIRMADO»   pano B tecido: UM (BOATO)   pedra embaixo: TRÊS
//   parede direita (alto):  pano C tecido: «DOIS ANTES UM» (BOATO)   pedra embaixo: lisa (o boato não escondia nada)
// Prova: 1) lendo a PEDRA (os dois panos certos queimados) há UMA resposta; 2) acreditando nos panos não há resposta aceita (nem única);
// 3) queimar só um dos panos certos leva a resposta errada: os dois são necessários; 4) acreditar no pano C junto com a pedra dá contradição.
// Uso: node tools/verify_pano.mjs
const B = [1, 2, 3, 4];
const seqs = [];
const ext = (s) => {
  if (s.length) seqs.push(s);
  for (const b of B) if (!s.includes(b)) ext([...s, b]);
};
ext([]);
// condições
const quantos = (n) => (s) => s.length === n;
const todos = (s) => s.length === B.length;
const antes = (x, y) => (s) => s.includes(x) && s.includes(y) && s.indexOf(x) < s.indexOf(y); // a frase fala dos dois: os dois acesos, x primeiro
const sat = (C) => seqs.filter((s) => C.every((c) => c(s)));
const mostra = (L) => L.map((s) => s.join('→')).join('  ') || '(nenhuma)';

const PEDRA = [quantos(2), antes(3, 4)];
const SOLUCAO = [3, 4];
let ok = true;
const check = (c, m) => {
  console.log(`${c ? '✓' : '✗'} ${m}`);
  ok = ok && c;
};

const certa = sat(PEDRA);
check(certa.length === 1 && certa[0].join() === SOLUCAO.join(), `lendo a pedra: ${mostra(certa)} (uma só)`);
const panos = sat([todos, antes(1, 4), antes(2, 1)]);
check(!panos.some((s) => s.join() === SOLUCAO.join()), `acreditando nos três panos: ${panos.length} ordens (${mostra(panos)}), nenhuma é a aceita`);
const soA = sat([quantos(2), antes(1, 4)]);
check(soA.length === 1 && soA[0].join() !== SOLUCAO.join(), `queimando só o pano da porta: ${mostra(soA)} (errada: o pano B também mente)`);
const soB = sat([todos, antes(3, 4)]);
check(soB.length > 1 && !soB.some((s) => s.join() === SOLUCAO.join()), `queimando só o pano B: ${soB.length} ordens de quatro, nenhuma aceita`);
const comC = sat([...PEDRA, antes(2, 1)]);
check(comC.length === 0, `pedra + acreditar no pano C: ${comC.length} respostas (contradição: o C era só boato)`);
check(seqs.length === 64, `respostas possíveis para chutar: ${seqs.length} (cada erro deixa os braseiros frios)`);
console.log(ok ? '\nOK: só a leitura da pedra resolve, e os dois panos certos são necessários.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
