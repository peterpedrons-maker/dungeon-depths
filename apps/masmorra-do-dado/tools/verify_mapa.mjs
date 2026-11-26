// Verifica o PLANO DE LEVEL DESIGN do capítulo 1 (LEVEL_DESIGN.md): o mapa do mundo deixa de ser uma fila de quadrados.
// Cada sala é uma união de retângulos numa grade (1 célula ≈ 4 m), num andar. As portas ficam em qualquer lado; as passagens são
// corredores em L por células livres. O verificador confere:
//  1) nenhuma sala se sobrepõe a outra no mesmo andar, e nenhum corredor atravessa uma sala ou outro corredor;
//  2) toda porta fica na borda da sua sala, virada para fora;
//  3) no caminho principal, a saída da maioria das salas NÃO fica na parede oposta à entrada (o jogador procura a saída);
//  4) o mapa não é uma linha: o térreo ocupa área nas duas direções, e o caminho principal muda de direção muitas vezes;
//  5) há voltas (atalhos que fecham ciclos), e um terço ou mais das salas não é retangular;
//  6) desenha o mapa de cada andar em texto, para conferir de olho.
// Uso: node tools/verify_mapa.mjs

const ANDARES = { '-1': 'Fundo (as Profundezas)', 0: 'Térreo', 1: 'Alto', 2: 'Topo' };

// id, rótulo de 2 letras no desenho, nome, andar, retângulos [x, y, w, h], forma
const SALAS = [
  { id: 's1', r: '01', nome: 'O Poço', andar: 0, rects: [[2, 16, 2, 2]], forma: 'redonda' },
  { id: 's2', r: '02', nome: 'O Vestíbulo', andar: 0, rects: [[1, 12, 3, 3]], forma: 'retangular com nicho' },
  { id: 's3', r: '03', nome: 'A Lousa', andar: 0, rects: [[6, 13, 4, 2], [8, 10, 2, 3]], forma: 'L' },
  { id: 's4', r: '04', nome: 'O Fio de Fogo', andar: 0, rects: [[7, 6, 4, 3]], forma: 'balcão + fosso raso' },
  { id: 'r1a', r: 'Nc', nome: 'R1 O Corredor dos Nichos', andar: 0, rects: [[11, 7, 2, 1], [12, 4, 1, 3], [13, 4, 3, 1]], forma: 'corredor que vira 3 vezes' },
  { id: 'cav', r: 'Cv', nome: 'O Túnel do Cavador (desvio)', andar: 0, rects: [[12, 1, 2, 2]], forma: 'caverna (rocha)' },
  { id: 'r1b', r: 'Pt', nome: 'R1 O Pátio da Cisterna', andar: 0, rects: [[16, 1, 5, 5]], forma: 'pátio a céu aberto, 2 andares de galeria' },
  { id: 's5', r: '05', nome: 'A Casa Escreve', andar: 0, rects: [[16, 8, 4, 4]], forma: 'salão quadrado (de propósito: a grade é o puzzle)' },
  { id: 's6', r: '06', nome: 'A Chama Curta', andar: 0, rects: [[17, 13, 1, 8]], forma: 'galeria comprida em declive' },
  { id: 's7', r: '07', nome: 'O Que a Casa Confirma', andar: 0, rects: [[18, 19, 2, 2], [20, 17, 3, 4]], forma: 'duas câmaras (antessala + salão)' },
  { id: 'r2', r: 'Bh', nome: 'R2 Os Banhos Secos', andar: 0, rects: [[15, 22, 8, 3]], forma: 'salão rebaixado com piscinas' },
  { id: 's8', r: '08', nome: 'O Pano', andar: 0, rects: [[25, 16, 2, 5], [24, 18, 4, 1]], forma: 'capela em cruz' },
  { id: 'bib', r: 'Bb', nome: 'A Biblioteca (térreo)', andar: 0, rects: [[22, 7, 5, 5], [27, 7, 3, 5], [22, 3, 6, 3], [22, 12, 2, 2]], forma: 'átrio de 3 andares + alas' },
  { id: 's9', r: '09', nome: 'Os Apelidos', andar: 0, rects: [[33, 3, 3, 3]], forma: 'rotunda' },
  { id: 's10', r: '10', nome: 'A Ponte de Madeira', andar: 0, rects: [[38, 6, 3, 4]], forma: 'fosso com rampa em espiral' },
  { id: 's11', r: '11', nome: 'O Boato Verdadeiro', andar: 0, rects: [[37, 13, 2, 4], [33, 15, 4, 2]], forma: 'L' },
  { id: 'r3a', r: 'Jd', nome: 'R3 O Jardim do Grande Ponto', andar: 0, rects: [[32, 7, 5, 5]], forma: 'jardim sob um poço de luz enorme (árvore)' },
  { id: 'r3b', r: 'Gl', nome: 'R3 A Galeria dos Condenados', andar: 0, rects: [[30, 13, 2, 6]], forma: 'galeria longa e alta' },
  { id: 's12', r: '12', nome: 'A Sombra', andar: -1, rects: [[28, 15, 4, 4]], forma: 'salão escuro com a tela no meio' },
  { id: 'fen', r: 'Fn', nome: 'A Fenda (desvio)', andar: -1, rects: [[25, 13, 2, 3], [24, 12, 2, 1]], forma: 'caverna natural com riacho' },
  { id: 's13', r: '13', nome: 'O Escuro', andar: -1, rects: [[33, 16, 2, 3]], forma: 'pequena e baixa' },
  { id: 's14', r: '14', nome: 'A Lei Pequena', andar: -1, rects: [[36, 15, 4, 4]], forma: 'térreo + rampa + mezanino' },
  { id: 'r4', r: 'Es', nome: 'R4 A Escadaria', andar: -1, rects: [[41, 15, 3, 3]], forma: 'poço vertical com escada em espiral (sobe até o Alto)' },
  { id: 'r4t', r: 'Es', nome: 'R4 A Escadaria (topo)', andar: 1, rects: [[41, 15, 3, 3]], forma: '(o mesmo poço, no Alto)' },
  { id: 's15', r: '15', nome: 'O Fogo que Corre', andar: 1, rects: [[39, 8, 5, 5]], forma: 'plataformas em degraus' },
  { id: 's16', r: '16', nome: 'Os Que Dizem o Mesmo', andar: 1, rects: [[30, 1, 6, 6]], forma: 'claustro a céu aberto' },
  { id: 'r5', r: 'Af', nome: 'R5 A Antecâmara Fria', andar: 1, rects: [[27, 3, 2, 1]], forma: 'câmara pequena e baixa' },
  { id: 's17', r: '17', nome: 'A Memória da Casa', andar: 1, rects: [[22, 2, 3, 3], [20, 3, 2, 1], [23, 0, 1, 2], [23, 5, 1, 2]], forma: 'hub redondo + 3 anexos' },
  { id: 's18', r: '18', nome: 'O Tribunal', andar: 2, rects: [[32, 7, 5, 5]], forma: 'sobre o Jardim, com balcão para baixo' },
];

// portas: [sala, x, y, lado]; o corredor sai pela célula vizinha do lado indicado. tipo: 'porta' (caminho principal), 'atalho', 'desvio', 'escada'
const LIGACOES = [
  { a: ['s1', 2, 16, 'N'], b: ['s2', 2, 14, 'S'], tipo: 'porta' },
  { a: ['s2', 3, 13, 'E'], b: ['s3', 6, 13, 'W'], tipo: 'porta' },
  { a: ['s3', 8, 10, 'N'], b: ['s4', 8, 8, 'S'], tipo: 'porta' },
  { a: ['s4', 10, 7, 'E'], b: ['r1a', 11, 7, 'W'], tipo: 'porta' },
  { a: ['r1a', 15, 4, 'E'], b: ['r1b', 16, 4, 'W'], tipo: 'porta' },
  { a: ['r1b', 18, 5, 'S'], b: ['s5', 18, 8, 'N'], tipo: 'porta' },
  { a: ['s5', 17, 11, 'S'], b: ['s6', 17, 13, 'N'], tipo: 'porta' },
  { a: ['s6', 17, 20, 'E'], b: ['s7', 18, 20, 'W'], tipo: 'porta' },
  { a: ['s7', 21, 20, 'S'], b: ['r2', 21, 22, 'N'], tipo: 'porta' },
  { a: ['r2', 22, 23, 'E'], b: ['s8', 24, 18, 'W'], tipo: 'porta' },
  { a: ['s8', 25, 16, 'N'], b: ['bib', 23, 13, 'S'], tipo: 'porta' },
  { a: ['bib', 29, 8, 'E'], b: ['s9', 33, 4, 'W'], tipo: 'porta' },
  { a: ['s9', 35, 4, 'E'], b: ['s10', 39, 6, 'N'], tipo: 'porta' },
  { a: ['s10', 39, 9, 'S'], b: ['s11', 38, 13, 'N'], tipo: 'porta' },
  { a: ['s11', 34, 15, 'N'], b: ['r3a', 34, 11, 'S'], tipo: 'porta' },
  { a: ['r3a', 32, 10, 'W'], b: ['r3b', 30, 13, 'N'], tipo: 'porta' },
  { a: ['r3b', 30, 18, 'S'], b: ['s12', 30, 18, 'S'], tipo: 'escada' }, // a Galeria desce às Profundezas
  { a: ['s12', 31, 17, 'E'], b: ['s13', 33, 17, 'W'], tipo: 'porta' },
  { a: ['s13', 34, 17, 'E'], b: ['s14', 36, 17, 'W'], tipo: 'porta' },
  { a: ['s14', 39, 16, 'E'], b: ['r4', 41, 16, 'W'], tipo: 'porta' },
  { a: ['r4', 42, 16, 'N'], b: ['r4t', 42, 16, 'N'], tipo: 'escada' }, // sobe a espiral
  { a: ['r4t', 42, 15, 'N'], b: ['s15', 42, 12, 'S'], tipo: 'porta' },
  { a: ['s15', 39, 9, 'W'], b: ['s16', 35, 5, 'E'], tipo: 'porta' },
  { a: ['s16', 30, 3, 'W'], b: ['r5', 28, 3, 'E'], tipo: 'porta' },
  { a: ['r5', 27, 3, 'W'], b: ['s17', 24, 3, 'E'], tipo: 'porta' },
  { a: ['s17', 22, 4, 'S'], b: ['s18', 32, 9, 'W'], tipo: 'escada' }, // a subida final, por cima de tudo, até o Tribunal
  // desvios e atalhos (fecham voltas; o caminho principal não depende deles)
  { a: ['r1a', 12, 4, 'N'], b: ['cav', 12, 2, 'S'], tipo: 'desvio' }, // a parede caída do corredor
  { a: ['r2', 15, 23, 'W'], b: ['s2', 2, 12, 'N'], tipo: 'atalho', livre: true }, // (ver nota) cano antigo dos banhos até o Vestíbulo: volta ao início
  { a: ['r3b', 31, 16, 'E'], b: ['r2', 22, 22, 'N'], tipo: 'atalho', livre: true }, // escada lateral da Galeria até os Banhos
  { a: ['s12', 28, 16, 'W'], b: ['fen', 26, 15, 'E'], tipo: 'desvio' }, // a parede rachada da Sombra
  { a: ['r4', 43, 17, 'S'], b: ['r3b', 31, 18, 'E'], tipo: 'atalho', livre: true }, // escada de serviço do pé da Escadaria até a Galeria
];
// `livre`: atalho que passa por baixo/por cima de outras salas (cano, escada de serviço): não é desenhado nem conferido como corredor.

const DIR = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const OPOSTO = { N: 'S', S: 'N', E: 'W', W: 'E' };
const key = (x, y) => `${x},${y}`;
let ok = true;
const check = (c, m) => {
  console.log(`  ${c ? '✓' : '✗'} ${m}`);
  ok = ok && c;
};
const byId = Object.fromEntries(SALAS.map((s) => [s.id, s]));
const cells = (s) => s.rects.flatMap(([x, y, w, h]) => Array.from({ length: w * h }, (_, i) => [x + (i % w), y + Math.floor(i / w)]));

// 1) ocupação por andar
const occ = {}; // andar -> Map(key -> id)
let sobrepostas = [];
for (const s of SALAS) {
  const m = (occ[s.andar] ||= new Map());
  for (const [x, y] of cells(s)) {
    const k = key(x, y);
    if (m.has(k) && m.get(k) !== s.id) sobrepostas.push(`${m.get(k)}×${s.id} em ${k}`);
    m.set(k, s.id);
  }
}
console.log('Ocupação');
check(!sobrepostas.length, `nenhuma sala se sobrepõe a outra no mesmo andar${sobrepostas.length ? ': ' + [...new Set(sobrepostas)].join('; ') : ''}`);

// 2) portas e 3) corredores
const corr = {}; // andar -> Set
const portasRuins = [];
const corredoresRuins = [];
const fora = (d) => {
  const s = byId[d[0]];
  const [dx, dy] = DIR[d[3]];
  return [d[1] + dx, d[2] + dy, s];
};
const dentro = (s, x, y) => cells(s).some(([a, b]) => a === x && b === y);
for (const l of LIGACOES) {
  for (const d of [l.a, l.b]) {
    const s = byId[d[0]];
    const [ox, oy] = fora(d);
    if (!dentro(s, d[1], d[2]) || (l.tipo !== 'escada' && dentro(s, ox, oy))) portasRuins.push(`${s.id} (${d[1]},${d[2]},${d[3]})`);
  }
  if (l.tipo === 'escada' || l.livre) continue;
  const A = fora(l.a);
  const B = fora(l.b);
  const andar = A[2].andar;
  const m = occ[andar];
  const cs = (corr[andar] ||= new Set());
  // a porta pode dar direto na sala vizinha (paredes coladas)
  if (dentro(B[2], A[0], A[1]) && dentro(A[2], B[0], B[1])) continue;
  const tenta = (horiz) => {
    const out = [[A[0], A[1]]];
    let [x, y] = [A[0], A[1]];
    const sx = () => { while (x !== B[0]) out.push([(x += Math.sign(B[0] - x)), y]); };
    const sy = () => { while (y !== B[1]) out.push([x, (y += Math.sign(B[1] - y))]); };
    if (horiz) (sx(), sy()); else (sy(), sx());
    return out;
  };
  const livre = (p) => p.every(([x, y]) => !m.has(key(x, y)) && !cs.has(key(x, y)));
  const p = [tenta(true), tenta(false)].find(livre);
  if (!p) corredoresRuins.push(`${l.a[0]}→${l.b[0]}`);
  else p.forEach(([x, y]) => cs.add(key(x, y)));
  l.path = p;
}
console.log('Portas e passagens');
check(!portasRuins.length, `toda porta fica na borda da sua sala, virada para fora${portasRuins.length ? ': ' + portasRuins.join('; ') : ''}`);
check(!corredoresRuins.length, `todo corredor passa só por células livres${corredoresRuins.length ? ': ' + corredoresRuins.join('; ') : ''}`);

// caminho principal
const principal = ['s1'];
for (;;) {
  const cur = principal[principal.length - 1];
  const nx = LIGACOES.find((l) => (l.tipo === 'porta' || l.tipo === 'escada') && l.a[0] === cur && !principal.includes(l.b[0]));
  if (!nx) break;
  principal.push(nx.b[0]);
}
console.log('Caminho principal');
const obrig = SALAS.filter((s) => !['cav', 'fen'].includes(s.id)).map((s) => s.id);
check(obrig.every((id) => principal.includes(id)), `o caminho principal passa por todas as ${obrig.length} salas e respiros, do Poço ao Tribunal`);
console.log(`  · ${principal.map((id) => byId[id].r).join(' → ')}`);
// entrada × saída
let opostas = 0;
let contadas = 0;
const lados = [];
for (let i = 1; i < principal.length - 1; i++) {
  const id = principal[i];
  const ent = LIGACOES.find((l) => l.b[0] === id && l.a[0] === principal[i - 1]);
  const sai = LIGACOES.find((l) => l.a[0] === id && l.b[0] === principal[i + 1]);
  if (!ent || !sai || ent.tipo === 'escada' || sai.tipo === 'escada') continue;
  contadas++;
  const op = OPOSTO[ent.b[3]] === sai.a[3];
  if (op) opostas++;
  lados.push(`${byId[id].r}:${ent.b[3]}→${sai.a[3]}${op ? '(oposta)' : ''}`);
}
console.log(`  · entrada → saída: ${lados.join(' ')}`);
check(opostas <= contadas * 0.4, `a saída fica na parede oposta à entrada em só ${opostas} de ${contadas} salas (máx. 40%)`);
// mudanças de direção do caminho (a direção de cada porta de saída)
const rumos = [];
for (let i = 0; i < principal.length - 1; i++) {
  const l = LIGACOES.find((x) => x.a[0] === principal[i] && x.b[0] === principal[i + 1]);
  if (l && l.tipo !== 'escada') rumos.push(l.a[3]);
}
let viradas = 0;
for (let i = 1; i < rumos.length; i++) if (rumos[i] !== rumos[i - 1]) viradas++;
check(viradas >= rumos.length * 0.6, `o caminho vira de direção ${viradas} vezes em ${rumos.length} portas (não é uma fila)`);
const t = cells({ rects: SALAS.filter((s) => s.andar === 0).flatMap((s) => s.rects) });
const W = Math.max(...t.map((c) => c[0])) - Math.min(...t.map((c) => c[0])) + 1;
const H = Math.max(...t.map((c) => c[1])) - Math.min(...t.map((c) => c[1])) + 1;
check(W >= 10 && H >= 10, `o térreo ocupa área nas duas direções (${W} × ${H} células)`);
const naoRet = SALAS.filter((s) => s.rects.length > 1 || /redonda|rotunda|caverna|fosso|degraus|claustro|pátio|jardim|espiral|L\b/.test(s.forma));
check(naoRet.length >= SALAS.length / 3, `${naoRet.length} de ${SALAS.length} lugares não são uma caixa retangular simples`);
// ciclos: arestas − vértices + componentes (contando escadas e atalhos)
const V = new Set(SALAS.map((s) => s.id));
const E = new Set(LIGACOES.map((l) => [l.a[0], l.b[0]].sort().join('|')));
const ciclos = E.size - V.size + 1;
check(ciclos >= 3, `há ${ciclos} voltas no mapa (atalhos que fecham ciclos), mínimo 3`);

// 6) desenho
for (const andar of Object.keys(ANDARES).map(Number).sort((a, b) => b - a)) {
  const m = occ[andar];
  if (!m) continue;
  const cs = corr[andar] || new Set();
  const all = [...m.keys(), ...cs].map((k) => k.split(',').map(Number));
  const x0 = Math.min(...all.map((c) => c[0]));
  const x1 = Math.max(...all.map((c) => c[0]));
  const y0 = Math.min(...all.map((c) => c[1]));
  const y1 = Math.max(...all.map((c) => c[1]));
  console.log(`\n${ANDARES[andar]} (andar ${andar}); cada célula ≈ 4 m; norte para cima`);
  for (let y = y0; y <= y1; y++) {
    let row = '';
    for (let x = x0; x <= x1; x++) {
      const k = key(x, y);
      if (m.has(k)) row += byId[m.get(k)].r;
      else if (cs.has(k)) row += '··';
      else row += '  ';
    }
    console.log('  ' + row.replace(/\s+$/, ''));
  }
}
console.log(ok ? '\nOK: o mapa do capítulo 1 é um mapa, não uma fila.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
