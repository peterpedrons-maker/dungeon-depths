// Verifica a proposta «A Lousa» (sala 3, nível 2; ver PUZZLES_PROPOSTAS.md §5).
// Lousa de fogo = 9 lampiões em grade 3x3 (casas 0..8, linha a linha, como os glifos). O jogador acende lampiões com o dado; a lousa
// aceita quando o conjunto aceso é EXATAMENTE o glifo pedido. Se ficar 5 s sem lampião novo e o desenho não bater, todos se apagam (sem pena).
// Lousa 1: copiar DOIS (talhado ao lado). Lousa 2: copiar TRÊS (talhado ao lado). Porta: a própria porta tem 9 pontinhos de bronze e a
// frase «ACENDER ▢ BRASEIRO»; a frase tem de ficar VERDADEIRA: o número de braseiros acesos na sala. A Casa deixou QUATRO acesos, mas um
// deles fica num nicho ALTO, em cima da entrada, atrás do jogador quando ele entra (a armadilha: contar só os da frente dá TRÊS).
// Segredo S1: atrás de uma coluna, uma lousa com soquete frio e um dado de cinco pontos talhado acima: CINCO.
// Prova: 1) os números do léxico são as faces de um dado comum (a dedução "número = face do dado" vale de verdade);
// 2) cada lousa aceita UM só desenho entre os 512; 3) contar só os braseiros da frente (TRÊS) é recusado;
// 4) escrever QUATRO "contando pontos" sem saber a forma é caro: 126 desenhos de quatro pontos.
// Uso: node tools/verify_lousa.mjs
import { readFileSync } from 'node:fs';
const LEX = JSON.parse(readFileSync(new URL('../src/story/lexicon.json', import.meta.url)));
const W = Object.fromEntries((Array.isArray(LEX) ? LEX : Object.values(LEX)).map((w) => [w.id, w]));
const pts = (id) => [...W[id].g.p].sort((a, b) => a - b);

// faces de um dado comum, na grade 3x3 (com a diagonal do 2 e do 3 indo do canto de cima à esquerda ao de baixo à direita)
const DADO = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const SALA = {
  braseirosAcesos: [
    { onde: 'à esquerda da porta', vistoAoEntrar: true },
    { onde: 'à direita da porta', vistoAoEntrar: true },
    { onde: 'meio da parede esquerda', vistoAoEntrar: true },
    { onde: 'nicho alto em cima da entrada (atrás do jogador)', vistoAoEntrar: false },
  ],
  lousas: [
    { nome: 'Lousa 1 (copiar o DOIS talhado)', alvo: 'n2' },
    { nome: 'Lousa 2 (copiar o TRÊS talhado)', alvo: 'n3' },
    { nome: 'Porta (a frase tem de ser verdade: quantos braseiros acesos?)', alvo: 'n4' },
    { nome: 'S1 · lousa secreta atrás da coluna (dado de cinco pontos talhado)', alvo: 'n5' },
  ],
};
const NUM = { 1: 'n1', 2: 'n2', 3: 'n3', 4: 'n4', 5: 'n5' };

let ok = true;
const check = (c, m) => {
  console.log(`${c ? '✓' : '✗'} ${m}`);
  ok = ok && c;
};
for (let n = 1; n <= 5; n++) check(pts(NUM[n]).join() === DADO[n].join(), `${W[NUM[n]].pt.toUpperCase()} no léxico = face ${n} do dado (${DADO[n].join(', ')})`);

const conj = (m) => [...Array(9).keys()].filter((i) => (m >> i) & 1);
for (const l of SALA.lousas) {
  const alvo = pts(l.alvo).join();
  const aceitos = [...Array(512).keys()].filter((m) => conj(m).join() === alvo);
  check(aceitos.length === 1, `${l.nome}: ${aceitos.length} desenho aceito de 512 (${W[l.alvo].pt.toUpperCase()})`);
}
const total = SALA.braseirosAcesos.length;
const vistos = SALA.braseirosAcesos.filter((b) => b.vistoAoEntrar).length;
check(NUM[total] === 'n4', `a frase da porta só fica verdadeira com ${W[NUM[total]].pt.toUpperCase()} (há ${total} braseiros acesos)`);
check(vistos === 3 && NUM[vistos] !== 'n4', `armadilha: contar só os da frente dá ${W[NUM[vistos]].pt.toUpperCase()}, que a porta recusa`);
const quatroPontos = [...Array(512).keys()].filter((m) => conj(m).length === 4).length;
check(quatroPontos === 126, `chutar "quatro pontos quaisquer": ${quatroPontos} desenhos (só a face do dado serve)`);
// enquanto escreve QUATRO canto por canto, nenhum desenho no meio do caminho abre a porta
const alvo4 = pts('n4');
let parcialAbre = false;
for (let m = 1; m < 16; m++) {
  const sub = alvo4.filter((_, i) => (m >> i) & 1);
  if (sub.length < 4 && sub.join() === alvo4.join()) parcialAbre = true;
}
check(!parcialAbre, 'acender os cantos um por um não abre nada antes do quarto');
console.log(ok ? '\nOK.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
