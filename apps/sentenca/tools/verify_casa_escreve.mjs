// Verifica a proposta «A Casa Escreve» (sala 5, nível 3; ver PUZZLES_PROPOSTAS.md §5).
// Salão quadrado com 9 COLUNAS em grade 3x3. Quatro colunas têm um braseiro ao pé (sem número). Na parede da porta, uma lousa da Casa
// acende-se sozinha em laço: em cada quadro acende UM lampião (uma posição), depois apaga; após o 4º quadro vem um tempo ESCURO (o fim da
// frase) e o laço recomeça. A lousa é um MAPA do salão visto de cima, com a porta em cima (um glifo PORTA talhado na borda de cima da
// moldura confirma). A frase da porta: «ACENDER BRASEIRO ORDEM»; o glifo ORDEM pulsa junto com o tempo escuro.
// Casas: r*3+c, r = 0 do lado da porta (longe da entrada), c = 0 à esquerda de quem olha para a porta.
// Prova: 1) lendo como mapa (porta em cima) cada quadro cai numa coluna COM braseiro e a ordem é única;
// 2) as leituras erradas (de cabeça para baixo, espelhada, girada) mandam pelo menos um quadro para uma coluna SEM braseiro:
//    a armadilha se denuncia; 3) os quadros não são glifos de número (nenhum é o ponto do meio), então não dá para ler "UM";
// 4) começar o laço no meio dá uma ordem errada: é preciso achar o começo (depois do escuro);
// 5) a constelação C1 (o 5º quadro, CINCO, que só aparece depois de a porta abrir) é coerente com a mesma leitura de mapa.
// Uso: node tools/verify_casa_escreve.mjs
const SALA = {
  braseiros: [0, 2, 5, 7], // colunas com braseiro ao pé
  laco: [5, 0, 7, 2], // os quadros, do primeiro (logo depois do escuro) ao último
  c1: [0, 2, 4, 6, 8], // o quadro extra depois de resolvida: CINCO
};
const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
const rc = (k) => [Math.floor(k / 3), k % 3];
const LEITURAS = {
  'mapa com a porta em cima (certa)': (k) => k,
  'de cabeça para baixo (entrada em cima)': (k) => { const [r, c] = rc(k); return (2 - r) * 3 + c; },
  'espelhada (esquerda e direita trocadas)': (k) => { const [r, c] = rc(k); return r * 3 + (2 - c); },
  'girada 180°': (k) => 8 - k,
};
const nome = (k) => ['fundo-esq', 'fundo-meio', 'fundo-dir', 'meio-esq', 'centro', 'meio-dir', 'frente-esq', 'frente-meio', 'frente-dir'][k];
let ok = true;
const check = (c, m) => {
  console.log(`${c ? '✓' : '✗'} ${m}`);
  ok = ok && c;
};

const certa = SALA.laco.map(LEITURAS['mapa com a porta em cima (certa)']);
check(certa.every((k) => SALA.braseiros.includes(k)), `leitura certa: todo quadro cai num braseiro → ordem ${certa.map(nome).join(', ')}`);
check(new Set(certa).size === SALA.braseiros.length, 'cada braseiro aparece uma vez no laço');
const ordens = perms(SALA.braseiros);
check(ordens.filter((o) => o.join() === certa.join()).length === 1, `uma ordem certa entre ${ordens.length}`);
for (const [n, f] of Object.entries(LEITURAS)) {
  if (n.includes('certa')) continue;
  const lida = SALA.laco.map(f);
  const vazios = lida.filter((k) => !SALA.braseiros.includes(k));
  check(vazios.length >= 1, `leitura ${n}: ${vazios.length} quadro(s) caem em coluna sem braseiro (${vazios.map(nome).join(', ')}): o erro se mostra`);
}
check(!SALA.laco.includes(4), 'nenhum quadro é o ponto do meio (o glifo UM): os quadros são posições, não números');
for (let s = 1; s < SALA.laco.length; s++) {
  const rot = [...SALA.laco.slice(s), ...SALA.laco.slice(0, s)];
  check(rot.join() !== SALA.laco.join(), `começar o laço no ${s + 1}º quadro dá outra ordem (${rot.map(nome).join(', ')}): errada`);
}
check(certa.join() !== [...SALA.braseiros].sort((a, b) => a - b).join(), 'a ordem não é a de leitura (da esquerda para a direita, de cima para baixo)');
// C1: o quadro CINCO, lido como mapa, são as 4 colunas dos cantos e a do centro
check(SALA.c1.join() === [0, 2, 4, 6, 8].join(), `C1: o quadro extra CINCO, lido como mapa = colunas ${SALA.c1.map(nome).join(', ')}`);
console.log(ok ? '\nOK.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
