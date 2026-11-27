// Verifica as CONSTELAÇÕES (puzzles secretos com tochas nos pilares; ver PUZZLES_PROPOSTAS.md §3).
// Ideia (do Pedro): algumas salas têm pilares com tochas. Vistas de cima, as posições das tochas caem numa grade 3x3 (casas 0..8, como os
// glifos). Acender EXATAMENTE as tochas que formam um glifo (e nenhuma outra) faz subir um braseiro no centro; acendê-lo abre a porta secreta.
// Algumas tochas estão FORA da grade (iscas, nas paredes). As linhas dos verbos aparecem como FRISOS no teto entre as tochas (canaletas altas):
// quando as tochas das pontas acendem, o fogo corre pelo friso e desenha a linha.
// Regras de projeto que o verificador confere, para cada constelação:
//  1) o glifo-alvo é formável com as tochas da sala e é o ÚNICO conjunto aceito;
//  2) a PISTA da sala aponta para uma palavra só (ex.: os frisos do teto só batem com as linhas de UM verbo);
//  3) chutar não compensa: quantos conjuntos existem (e as tochas se apagam sozinhas, então cada chute custa caminhar e esperar);
//  4) acender TODAS as tochas não resolve (o jogador que acende tudo por curiosidade não acha por acaso).
// Uso: node tools/verify_constelacoes.mjs
import { readFileSync } from 'node:fs';
const LEX = JSON.parse(readFileSync(new URL('../src/story/lexicon.json', import.meta.url)));
const words = Array.isArray(LEX) ? LEX : Object.values(LEX);
// palavras que dá para escrever só com fogo: sem moldura, sem anel, sem símbolo pequeno (números, verbos, quantidades)
const escreviveis = words.filter((w) => w.g && !w.g.F && !w.g.s && !(w.g.ring || []).length && (w.g.p || []).length);
const pts = (w) => [...new Set([...(w.g.p || []), ...(w.g.l || []).flat()])].sort((a, b) => a - b);
const linhas = (w) => (w.g.l || []).map(([a, b]) => [Math.min(a, b), Math.max(a, b)].join('-')).sort();

const CONSTELACOES = [
  {
    sala: 'Sala 5 · A Casa Escreve (salão de 9 colunas em grade)',
    nota: 'a 1ª constelação: TODAS as 9 colunas têm tocha, mais 3 tochas de parede. A pista é o glifo a mais que a lousa da Casa mostra depois que a porta abre.',
    tochas: [
      ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => ({ id: `coluna${c}`, casa: c })),
      { id: 'parede-esq', casa: null }, { id: 'parede-dir', casa: null }, { id: 'porta', casa: null }, // iscas
    ],
    frisos: [], // sem linhas: é um número
    alvo: 'n5',
    pista: { tipo: 'glifo', palavra: 'n5', descricao: 'depois de a porta abrir, a lousa da Casa às vezes mostra um 5º glifo (CINCO) que não corresponde a braseiro nenhum' },
  },
  {
    sala: 'Sala 8 · O Pano (capela alta, 6 pilares em duas fileiras)',
    nota: 'todos os 6 pilares têm tocha; o que diz QUAIS é o teto: frisos de pedra ligam só três posições, desenhando um triângulo.',
    tochas: [
      { id: 'p0', casa: 0 }, { id: 'p1', casa: 1 }, { id: 'p2', casa: 2 },
      { id: 'p6', casa: 6 }, { id: 'p7', casa: 7 }, { id: 'p8', casa: 8 },
      { id: 'altar', casa: null }, { id: 'entrada-1', casa: null }, { id: 'entrada-2', casa: null },
    ],
    frisos: [[1, 6], [6, 8], [1, 8]], // no teto
    alvo: 'acender',
    pista: { tipo: 'frisos', descricao: 'os frisos do teto têm a forma das linhas de um verbo' },
  },
  {
    sala: 'Biblioteca · O Átrio (9 mesas de leitura em grade, cada uma com lamparina)',
    nota: 'a pista é a página na mesa do Escrivão, vista pela grade do escritório: o jogador a vê DE CABEÇA PARA BAIXO (a mesa está virada para a cadeira dele). Copiada como se vê, dá o triângulo de ACENDER, que o jogador conhece: a armadilha. Lida do lado certo, é PEGAR.',
    tochas: [
      ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => ({ id: `mesa${c}`, casa: c })),
      { id: 'parede-1', casa: null }, { id: 'parede-2', casa: null }, { id: 'parede-3', casa: null }, { id: 'parede-4', casa: null },
    ],
    frisos: [],
    alvo: 'pegar',
    pista: { tipo: 'invertida', armadilha: 'acender', descricao: 'a página do Escrivão, vista de cabeça para baixo' },
  },
  {
    sala: 'Sala 16 · Os Que Dizem o Mesmo (claustro: 8 colunas da galeria + a fonte no meio = grade 3x3)',
    nota: 'todas as 9 têm tocha, mais 3 nas paredes. Frisos: o da galeria do fundo (de canto a canto), uma VIGA de pedra que cruza o pátio na diagonal, e o da galeria da frente. Formam um Z.',
    tochas: [
      ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => ({ id: `coluna${c}`, casa: c })),
      { id: 'parede-1', casa: null }, { id: 'parede-2', casa: null }, { id: 'parede-3', casa: null },
    ],
    frisos: [[0, 2], [2, 6], [6, 8]],
    alvo: 'denovo',
    pista: { tipo: 'frisos', descricao: 'os frisos e a viga desenham as linhas de um verbo' },
  },
];
const gira = (c) => 8 - c; // vista de cabeça para baixo (180°)

let ok = true;
const check = (c, m) => {
  console.log(`  ${c ? '✓' : '✗'} ${m}`);
  ok = ok && c;
};
for (const k of CONSTELACOES) {
  console.log(`${k.sala}\n  (${k.nota})`);
  const alvo = words.find((w) => w.id === k.alvo);
  const casas = k.tochas.filter((t) => t.casa != null).map((t) => t.casa);
  const T = pts(alvo);
  check(T.every((c) => casas.includes(c)), `o glifo ${alvo.pt.toUpperCase()} (casas ${T.join(', ')}) cabe nas tochas da sala`);
  // conjunto aceito: exatamente as tochas das casas do alvo
  const n = k.tochas.length;
  let aceitos = 0;
  for (let m = 0; m < 1 << n; m++) {
    const acesas = k.tochas.filter((_, i) => (m >> i) & 1);
    const ok1 = acesas.every((t) => t.casa != null) && acesas.length === T.length && T.every((c) => acesas.some((t) => t.casa === c));
    if (ok1) aceitos++;
  }
  check(aceitos === 1, `um só conjunto de tochas é aceito (${aceitos} de ${1 << n})`);
  const formaveis = escreviveis.filter((w) => pts(w).every((c) => casas.includes(c)));
  console.log(`  · palavras que as tochas desta sala conseguem escrever: ${formaveis.map((w) => w.pt.toUpperCase()).join(', ')}`);
  if (k.pista.tipo === 'frisos') {
    const fr = k.frisos.map(([a, b]) => [Math.min(a, b), Math.max(a, b)].join('-')).sort().join();
    const batem = formaveis.filter((w) => linhas(w).join() === fr);
    check(batem.length === 1 && batem[0].id === k.alvo, `a pista (${k.pista.descricao}) aponta para uma palavra só: ${batem.map((w) => w.pt.toUpperCase()).join(', ')}`);
  } else if (k.pista.tipo === 'invertida') {
    const arm = words.find((w) => w.id === k.pista.armadilha);
    const visto = T.map(gira).sort((a, b) => a - b);
    check(visto.join() === pts(arm).join(), `vista de cabeça para baixo, a página mostra os pontos de ${arm.pt.toUpperCase()} (${visto.join(', ')}): a armadilha`);
    check(visto.join() !== T.join(), `lida do lado certo, é ${alvo.pt.toUpperCase()} (${T.join(', ')}), um conjunto diferente`);
  } else if (k.pista.tipo === 'glifo') {
    check(k.pista.palavra === k.alvo, `a pista (${k.pista.descricao}) mostra o próprio glifo`);
  }
  const iscas = k.tochas.length - T.length;
  check(iscas >= T.length, `há tochas a mais para não dar na cara: ${k.tochas.length} tochas para um glifo de ${T.length} (${iscas} sobram)`);
  check(!(k.tochas.every((t) => t.casa != null) && k.tochas.length === T.length), 'acender TODAS as tochas da sala não resolve (há iscas)');
}
console.log(ok ? '\nOK: cada constelação tem um conjunto só e uma pista que aponta para ele.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
