// Verifica «O Fogo que Corre» (sala 15, nível 8; ver PUZZLES_PROPOSTAS.md §5).
// Salão aberto com 9 braseiros em grade 3x3, em plataformas de alturas diferentes; canaletas descem de uma plataforma a outra (a altura mostra
// o sentido) e cada uma leva um TEMPO para o fogo atravessar (1 s reta e curta, 2 s, 3 s longa e sinuosa). Novidades:
//  · cada braseiro QUEIMA SÓ 6,5 s (o do centro, menor, 5,75 s) e só UMA VEZ por tentativa (o óleo acaba; quando tudo apaga, a Casa reabastece);
//  · a porta («ACENDER DOIS BRASEIRO TEMPO» + o glifo QUATRO talhado) aceita se, em ALGUM INSTANTE, os acesos forem EXATAMENTE os quatro cantos.
// Duas ignições: a 1ª no instante 0, a 2ª D segundos depois (o jogador escolhe quando).
// Prova: 1) um só par ordenado de braseiros funciona, com uma janela de espera confortável (não exige precisão de frame);
// 2) uma ignição só nunca basta; 3) a ordem contrária falha; 4) acender o 2º cedo demais falha.
// Uso: node tools/verify_fogo_corre.mjs
const CANALETAS = [[4, 2, 3], [4, 8, 2], [6, 4, 2], [5, 8, 1], [5, 1, 1], [6, 7, 3], [7, 4, 3], [3, 0, 2], [7, 8, 1], [3, 7, 3], [4, 0, 2], [1, 0, 1]]; // [de, para, segundos]
const QUEIMA = 6.5; // (era 4, depois 5,5; ver as âncoras abaixo)
// quanto queima cada braseiro (FC_BURN em chapter1b.ts): o do CENTRO é menor e queima menos (DESIGN.md §94, a referência de tempo: a regra da
// Chama Curta, o tamanho diz quanto dura). Conferência do enigmista: com o centro a 4,5 s a janela começava em 1,55 s, e o dado volta à mão
// 0,2 s depois de acender (não 2,45 s): quem acendia o 6 com pressa acertava ou errava conforme a mão (sorte). Com 6,5 s e o centro a 5,75 s, a
// pressa erra SEMPRE (a armadilha de ideia: o 6 também corre para o 7) e quem espera qualquer sinal da sala acerta.
const BURN = Array(9).fill(QUEIMA);
BURN[4] = 5.75;
const MORRER = 1.5; // os últimos segundos em que a chama encolhe e o glifo TEMPO pulsa (flameK em chapter1b.ts)
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
function instante(t0, burn = BURN) {
  // os instantes em que algo muda (acende ou apaga): basta olhar logo depois de cada um
  const ev = [...new Set(t0.flatMap((t, i) => (Number.isFinite(t) ? [t, t + burn[i]] : [])))].sort((a, b) => a - b);
  for (const e of ev) {
    const tau = e + 1e-6;
    const lit = [...Array(9).keys()].filter((i) => t0[i] <= tau && tau < t0[i] + burn[i]);
    if (lit.length === ALVO.length && ALVO.every((x) => lit.includes(x))) return e;
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
  for (let D = 0; D <= 12.001; D += 0.05) if (instante(acende([[x, 0], [y, D]])) >= 0) Ds.push(+D.toFixed(2));
  if (Ds.length) pares.push({ x, y, Ds });
}
check(pares.length === 1 && pares[0].x === SOLUCAO.x && pares[0].y === SOLUCAO.y, `um só par funciona: fogo no ${pares.map((p) => p.x).join()} e depois no ${pares.map((p) => p.y).join()}`);
const D = pares[0]?.Ds ?? [];
check(D.length && D[D.length - 1] - D[0] >= 5, `janela para a 2ª ignição: de ${D[0]} s a ${D[D.length - 1]} s depois da 1ª (larga; as âncoras abaixo provam que dá para acertá-la reagindo ao que se vê)`);
check(D[0] > 0, 'acender os dois juntos (ou cedo demais) falha: o fogo do canto chega ao braseiro de baixo antes de o centro se apagar');
const t = acende([[SOLUCAO.x, 0], [SOLUCAO.y, 4.5]]);
const fx = (x) => String(+x.toFixed(2)).replace('.', ',');
console.log(`   (com a 2ª aos 4,5 s: centro aceso de 0 a ${fx(BURN[4])} s; cantos 0 e 8 de 2 a ${fx(2 + BURN[0])} s; canto 2 de 3 a ${fx(3 + BURN[2])} s; canto 6 a partir de 4,5 s; o 7 só aos ${fx(t[7])} s; os quatro cantos sozinhos a partir de ${fx(instante(t))} s)`);
// ── O TEMPO NA MÃO DO JOGADOR (DESIGN.md §91, ponto 3: um erro de execução não pode parecer erro de ideia) ──
// O jogador não vê um relógio: ele reage a um ACONTECIMENTO da sala (a âncora) e o dado leva um tempo para chegar. Modelo: o toque no canto 6
// acontece em D = âncora + reação (0,25 a 1,0 s) + mirar e voar (0,3 a 0,9 s). A âncora serve se TODO esse intervalo cabe na janela com folga.
const REACAO = [0.25, 1.0];
const VOO = [0.3, 0.9];
// o dado que ACENDE um braseiro não descansa nele: a cena do dado queimando (0,3 s; 1,5 s na 1ª vez) PARA o relógio da sala e, no fim dela, o dado
// renasce na mão (scene.ts, endBurn). Medido no navegador: o dado está na mão ~0,2 s de sala depois de o centro acender. (Antes este modelo
// dizia 2,45 s, "assenta, descansa 1,8 s e volta": vale para o dado que cai no chão, não para o que acende.)
const VOLTA = 0.2;
const t1 = acende([[SOLUCAO.x, 0]]);
const lo = D[0];
const hi = D[D.length - 1];
// A PRESSA é a armadilha de ideia («o 6 também corre para o 7»): quem acende o 6 assim que o dado volta tem de errar SEMPRE, não às vezes. Se a
// janela começasse no meio do tempo da pressa, a mesma ideia daria certo ou errado conforme a mão (sorte; §91, ponto 3)
{
  const d1 = VOLTA + REACAO[1] + VOO[1];
  check(lo - d1 >= 0.5, `a pressa (o 6 assim que o dado volta à mão, ${VOLTA} s): o dado toca o 6 até ${d1.toFixed(2)} s, ${(lo - d1).toFixed(2)} s antes da janela (${lo} s): erra sempre, e o 7 aceso junto com os cantos mostra por quê`);
  const d1m = VOLTA + 1.8 + VOO[1]; // (no celular, mirar arrastando o dedo pode levar quase 2 s)
  if (d1m >= lo) console.log(`⚠ no celular, quem leva 1,8 s para mirar com pressa toca o 6 aos ${d1m.toFixed(2)} s: já na janela (acerta sem esperar de propósito)`);
}
const ancoras = [
  { nome: `o fogo chega ao último canto (o ${2}, pela canaleta em zigue-zague)`, t: Math.max(...[0, 2, 8].map((i) => t1[i])), ensinada: true },
  { nome: 'a chama do centro começa a morrer (encolhe, o glifo TEMPO pulsa)', t: BURN[SOLUCAO.x] - MORRER, ensinada: true },
  { nome: 'a chama do centro apaga', t: BURN[SOLUCAO.x], ensinada: false },
];
for (const a of ancoras) {
  const d0 = a.t + REACAO[0] + VOO[0];
  const d1 = a.t + REACAO[1] + VOO[1];
  const folga = Math.min(d0 - lo, hi - d1);
  const msg = `âncora «${a.nome}» (${a.t.toFixed(2)} s): o dado toca o 6 entre ${d0.toFixed(2)} e ${d1.toFixed(2)} s; folga ${folga.toFixed(2)} s na janela ${lo}–${hi} s`;
  if (a.ensinada) check(folga >= 0.5, msg);
  else if (folga >= 0.5) console.log(`✓ ${msg}`);
  else console.log(`⚠ ${msg} (apertado: é aqui que um erro de execução parece erro de ideia)`);
}
const avisoTarde = Math.min(t1[0], t1[8]) + BURN[0] - MORRER; // os cantos 0 e 8 (os primeiros a acabar) começam a morrer
check(hi - avisoTarde >= 1.0, `o aviso de "tarde demais" se vê: os cantos 0 e 8 começam a morrer aos ${avisoTarde.toFixed(1)} s, ${(hi - avisoTarde).toFixed(1)} s antes do fim da janela`);
// o jogo usa os mesmos tempos (FC_BURN em chapter1b.ts)
try {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../src/scene/rooms/chapter1b.ts', import.meta.url), 'utf8');
  const m = src.match(/const FC_BURN = \[([^\]]*)\]/);
  const game = m ? m[1].split(',').map((x) => +x.trim()) : [];
  check(JSON.stringify(game) === JSON.stringify(BURN), `chapter1b.ts queima com os mesmos tempos (FC_BURN = ${JSON.stringify(game)})`);
} catch (e) {
  check(false, `não consegui ler chapter1b.ts (${e.message})`);
}
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
