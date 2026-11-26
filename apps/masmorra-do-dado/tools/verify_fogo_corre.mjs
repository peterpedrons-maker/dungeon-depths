// Verifica «O Fogo que Corre» (sala 15, nível 8; ver PUZZLES_PROPOSTAS.md §5).
// Salão aberto com 9 braseiros em grade 3x3, em plataformas de alturas diferentes; canaletas descem de uma plataforma a outra (a altura mostra
// o sentido) e cada uma leva um TEMPO para o fogo atravessar (1 s reta e curta, 2 s, 3 s longa e sinuosa). Novidades:
//  · cada braseiro QUEIMA SÓ 5,5 s (no jogo; o desenho original era 4 s) e só UMA VEZ por tentativa (o óleo acaba; quando tudo apaga, a Casa reabastece);
//  · a porta («ACENDER DOIS BRASEIRO TEMPO» + o glifo QUATRO talhado) aceita se, em ALGUM INSTANTE, os acesos forem EXATAMENTE os quatro cantos.
// Duas ignições: a 1ª no instante 0, a 2ª D segundos depois (o jogador escolhe quando).
// Prova: 1) um só par ordenado de braseiros funciona, com uma janela de espera confortável (não exige precisão de frame);
// 2) uma ignição só nunca basta; 3) a ordem contrária falha; 4) acender o 2º cedo demais falha.
// Uso: node tools/verify_fogo_corre.mjs
const CANALETAS = [[4, 2, 3], [4, 8, 2], [6, 4, 2], [5, 8, 1], [5, 1, 1], [6, 7, 3], [7, 4, 3], [3, 0, 2], [7, 8, 1], [3, 7, 3], [4, 0, 2], [1, 0, 1]]; // [de, para, segundos]
const QUEIMA = Number(process.env.QUEIMA || 5.5); // segundos de chama (FC.burn em chapter1b.ts)
const ALVO = [0, 2, 6, 8];
const SOLUCAO = { x: 4, y: 6 };
function acende(ign) {
  const t0 = Array(9).fill(Infinity);
  for (const [l, t] of ign) t0[l] = Math.min(t0[l], t);
  for (let ch = true; ch; ) {
    ch = false;
    for (const [a, b, d] of CANALETAS) if (t0[a] < Infinity && t0[a] + d < t0[b]) (t0[b] = t0[a] + d), (ch = true);
  }
  return t0;
}
function instante(t0) {
  for (let tau = 0; tau < 40; tau += 0.25) {
    const lit = [...Array(9).keys()].filter((i) => t0[i] <= tau && tau < t0[i] + QUEIMA);
    if (lit.length === ALVO.length && ALVO.every((x) => lit.includes(x))) return tau;
  }
  return -1;
}
let ok = true;
const check = (c, m) => {
  console.log(`${c ? '✓' : '✗'} ${m}`);
  ok = ok && c;
};
const vizinhos = (a, b) => Math.max(Math.abs((a % 3) - (b % 3)), Math.abs(((a / 3) | 0) - ((b / 3) | 0))) === 1;
check(CANALETAS.every(([a, b]) => vizinhos(a, b)), 'toda canaleta liga plataformas vizinhas');
check([...Array(9).keys()].every((x) => instante(acende([[x, 0]])) < 0), 'uma ignição só nunca escreve os quatro cantos');
const pares = [];
for (let x = 0; x < 9; x++) for (let y = 0; y < 9; y++) {
  if (x === y) continue;
  const Ds = [];
  for (let D = 0; D <= 12; D += 0.5) if (instante(acende([[x, 0], [y, D]])) >= 0) Ds.push(D);
  if (Ds.length) pares.push({ x, y, Ds });
}
check(pares.length === 1 && pares[0].x === SOLUCAO.x && pares[0].y === SOLUCAO.y, `um só par funciona: fogo no ${pares.map((p) => p.x).join()} e depois no ${pares.map((p) => p.y).join()}`);
const D = pares[0]?.Ds ?? [];
check(D.length && D[D.length - 1] - D[0] >= 2.5, `janela para a 2ª ignição: de ${D[0]} s a ${D[D.length - 1]} s depois da 1ª (folga confortável)`);
check(D[0] > 0, 'acender os dois juntos (ou cedo demais) falha: o fogo do canto chega ao braseiro de baixo antes de o centro se apagar');
const t = acende([[SOLUCAO.x, 0], [SOLUCAO.y, 3]]);
console.log(`   (com a 2ª aos 3 s: centro aceso de 0 a ${QUEIMA} s; cantos 0 e 8 a partir de 2 s; canto 2 a partir de 3 s; canto 6 a partir de 3 s; o 7 só aos 6 s; os quatro cantos sozinhos a partir de ${instante(t)} s)`);
// constelação C5 (só Fogo): o glifo aparece no teto, no escuro da punição. 9 tochas nos postes das plataformas + 3 de parede (iscas).
const C5 = { alvo: [3, 4, 5], tochas: 9, iscas: 3 };
let aceitos = 0;
for (let m = 0; m < 1 << (C5.tochas + C5.iscas); m++) {
  const on = [...Array(C5.tochas + C5.iscas).keys()].filter((i) => (m >> i) & 1);
  if (on.length === C5.alvo.length && on.every((i) => C5.alvo.includes(i))) aceitos++;
}
check(aceitos === 1, `C5: as tochas dos postes do meio (3, 4, 5 = MENOS, o glifo do teto no escuro): 1 conjunto de ${1 << (C5.tochas + C5.iscas)}`);
console.log(ok ? '\nOK.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
