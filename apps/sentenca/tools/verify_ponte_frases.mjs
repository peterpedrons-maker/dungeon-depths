// Verifica «A Ponte de Frases» (sala 14, nível 6; DESIGN.md §93; FIRE_PONTE_FRASES em src/scene/rooms/chapter1c.ts). Uso: node tools/verify_ponte_frases.mjs
// (A versão anterior, a da laje que racha sozinha sob o pé, ficou no rascunho do enigmista: verify_ponte_frases_antigo.mjs.)
//
// A REGRA NOVA (proposta do enigmista, pedido do Pedro: "tem um atalho que é ficar pisando em qualquer um"):
//  · O meio da sala é um FOSSO. Cada frase das paredes tem a SUA laje no fosso, logo embaixo dela; acender a frase faz a laje subir até o chão.
//  · As lajes erguidas se TRAVAM umas nas outras: a ponte é UMA PEÇA SÓ. Pode-se andar nela à vontade, inclusive em laje de mentira.
//  · A Casa PESA A PONTE quando o jogador pisa na ÚLTIMA FILEIRA (a que encosta na borda da porta). Se houver QUALQUER frase falsa acesa, a ponte
//    inteira cede (a laje sob o pé, não a da mentira): a Casa apaga TUDO o que o jogador acendeu, as lajes caem juntas, ele cai, escuro, volta à
//    entrada. A Casa não diz qual frase mentiu: ela CITA as confirmadas que a mentira nega (elas brilham no tremor, no escuro e um pouco depois).
//  · A porta «ACENDER VERDADE CONFIRMADO» julga quando se acende a frase dela: o conjunto aceso tem de ser exatamente o das verdadeiras.
//  · Abertura (uma vez por visita): a ponte já está inteira e acesa ("a ponte de quem veio antes"). Ela aguenta até a última fileira e cai lá,
//    citando as três confirmadas: a regra inteira mostrada sem palavras, sem custo.
// A grade: duas colunas (E = junto da parede esquerda, D = junto da direita) e CINCO fileiras de 3 m (0 = junto da entrada, 4 = junto da porta).
const R = 5;
// [coluna, fileira, frase [a, rel, b], marca, demonstração]: a ordem é a de FPF_SLABS em chapter1c.ts
const SLABS = [
  ['E', 0, [1, 'antes', 2], 'conf', true], // demonstração, já acesa
  ['D', 0, [2, 'depois', 1], 'boato', true], // demonstração, já acesa: um boato que diz o mesmo que a confirmada
  ['E', 1, [4, 'antes', 1], 'boato', false],
  ['D', 1, [1, 'depois', 3], 'conf', false],
  ['E', 2, [3, 'antes', 2], 'boato', false],
  ['D', 2, [3, 'antes', 1], 'boato', false],
  ['E', 3, [4, 'depois', 2], 'conf', false],
  ['D', 3, [3, 'depois', 1], 'boato', false],
  ['E', 4, [4, 'depois', 3], 'boato', false],
  ['D', 4, [2, 'antes', 3], 'boato', false],
];
// a ponte de antes (a que está no jogo até a troca), para comparar o custo do atalho
const OLD = { R: 4, SLABS: [['E', 0, [1, 'antes', 2], 'conf', true], ['D', 0, [2, 'depois', 1], 'boato', true], ['E', 1, [1, 'depois', 3], 'conf', false], ['D', 1, [4, 'antes', 1], 'boato', false], ['E', 2, [3, 'antes', 4], 'boato', false], ['D', 2, [2, 'depois', 3], 'boato', false], ['E', 3, [3, 'depois', 1], 'boato', false], ['D', 3, [4, 'depois', 2], 'conf', false]] };
// custo de uma tentativa (s): cada frase acesa é um arremesso (mirar, voar, o dado descansa 1,8 s e volta) ~3 s; andar da entrada à última
// fileira (~16 m a 4,2 m/s) ~4 s; o tremor, a queda e o escuro ~3,6 s
const T_THROW = 3;
const T_WALK = 16 / 4.2;
const T_FALL = 0.6 + 0.5 + 2.5;
const NUM = ['', 'UM', 'DOIS', 'TRÊS', 'QUATRO'];

let fail = false;
const check = (cond, msg) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) fail = true;
};
const warn = (msg) => console.log(`⚠ ${msg}`);
const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
const ORDERS = perms([1, 2, 3, 4]);
const holdsIn = (o, [a, rel, b]) => (rel === 'antes' ? o.indexOf(a) < o.indexOf(b) : o.indexOf(a) > o.indexOf(b));
const relOf = ([a, rel, b]) => (rel === 'antes' ? [a, b] : [b, a]); // "x vem antes de y"
const txt = (s) => `«${NUM[s[2][0]]} ${s[2][1].toUpperCase()} ${NUM[s[2][2]]} ${s[3] === 'conf' ? 'CONFIRMADO' : 'BOATO'}»`;
const nm = (s) => `${s[0]}${s[1]}`;
const fmt = (x) => (Math.round(x * 10) / 10).toString().replace('.', ',');

function analyse(D) {
  const S = D.SLABS;
  const N = S.length;
  const conf = S.map((s, i) => i).filter((i) => S[i][3] === 'conf');
  const demo = S.map((s) => s[4]);
  const orders = ORDERS.filter((o) => conf.every((i) => holdsIn(o, S[i][2])));
  const ORDER = orders[0];
  const truth = S.map((s) => (ORDER ? holdsIn(ORDER, s[2]) : false));
  const cellIdx = (c, r) => S.findIndex((s) => s[0] === c && s[1] === r);
  // há caminho da borda da entrada (fileira 0) até a fileira de pesar (a última) só por lajes erguidas, sem diagonal?
  const crosses = (up) => {
    const seen = new Set();
    const q = ['E', 'D'].map((c) => cellIdx(c, 0)).filter((i) => i >= 0 && up[i]);
    while (q.length) {
      const i = q.pop();
      if (seen.has(i)) continue;
      seen.add(i);
      const [c, r] = S[i];
      if (r === D.R - 1) return true;
      for (const [nc, nr] of [[c === 'E' ? 'D' : 'E', r], [c, r + 1], [c, r - 1]]) {
        const j = cellIdx(nc, nr);
        if (j >= 0 && up[j]) q.push(j);
      }
    }
    return false;
  };
  const free = S.map((s, i) => i).filter((i) => !demo[i]); // as que o jogador acende
  const upOf = (m) => S.map((s, i) => demo[i] || !!(m & (1 << free.indexOf(i))));
  const maskOf = (idx) => idx.reduce((m, i) => m | (1 << free.indexOf(i)), 0);
  const lies = free.filter((i) => !truth[i]);
  // rotas mínimas: conjuntos de lajes (das acendíveis) que atravessam e dos quais não dá para tirar nenhuma
  const minimal = [];
  for (let m = 0; m < 1 << free.length; m++) {
    if (!crosses(upOf(m))) continue;
    if (free.every((i, k) => !(m & (1 << k)) || !crosses(upOf(m & ~(1 << k))))) minimal.push(m);
  }
  const lieIn = (m) => lies.some((i) => m & (1 << free.indexOf(i)));
  return { S, N, conf, demo, orders, ORDER, truth, crosses, free, upOf, maskOf, lies, minimal, lieIn, cellIdx };
}

const A = analyse({ R, SLABS });
const { S, conf, demo, ORDER, truth, crosses, free, upOf, maskOf, lies, minimal, lieIn } = A;
console.log('── 1. A lógica: uma resposta só ──');
check(A.orders.length === 1, `as três confirmadas fixam uma ordem só: ${A.orders.map((o) => o.join('-')).join(' | ')}`);
console.log('   ' + S.map((s, i) => `${nm(s)} ${txt(s)} = ${truth[i] ? 'V' : 'F'}`).join('\n   '));
check(demo.every((d, i) => !d || truth[i]) && JSON.stringify(relOf(S[0][2])) === JSON.stringify(relOf(S[1][2])), 'a demonstração (fileira 0) são duas frases verdadeiras que DIZEM O MESMO: uma confirmada e um boato');
for (const c of conf) {
  const left = conf.filter((j) => j !== c);
  const os = ORDERS.filter((o) => left.every((i) => holdsIn(o, S[i][2])));
  const sets = new Set(os.map((o) => free.filter((i) => holdsIn(o, S[i][2])).join()));
  check(sets.size > 1, `sem a pista ${txt(S[c])} a resposta não é única (${os.length} ordens, ${sets.size} conjuntos de frases verdadeiras)`);
}
let accepted = 0;
for (let m = 0; m < 1 << free.length; m++) if (free.every((i) => !!(m & (1 << free.indexOf(i))) === truth[i])) accepted++;
check(accepted === 1, `a porta aceita um conjunto só entre ${1 << free.length}: as verdadeiras (${free.filter((i) => truth[i]).map((i) => nm(S[i])).join(', ')})`);
// atravessar sem cair = um conjunto que atravessa e não tem mentira: só o das verdadeiras (então quem atravessa já pode abrir a porta)
const safe = [];
for (let m = 0; m < 1 << free.length; m++) if (crosses(upOf(m)) && !lieIn(m)) safe.push(m);
const truthMask = maskOf(free.filter((i) => truth[i]));
check(safe.length === 1 && safe[0] === truthMask, 'só um conjunto aceso atravessa sem a ponte cair, e é exatamente o das verdadeiras (cada verdade é um degrau necessário)');
const route = free.filter((i) => truth[i]).map((i) => S[i]);
check(new Set(route.map((s) => s[0])).size === 2, `o caminho troca de parede: ${['E', 'D'].map((c) => cellsOf(c)).join(' · ')}`);
function cellsOf(c) {
  return `${c === 'E' ? 'esquerda' : 'direita'} ${route.filter((s) => s[0] === c).map((s) => s[1]).join(', ') || '—'}`;
}

console.log('\n── 2. As armadilhas: cada hábito errado não atravessa ou derruba a ponte ──');
const restates = (i) => conf.some((c) => JSON.stringify(relOf(S[c][2])) === JSON.stringify(relOf(S[i][2])));
const contraDirect = (i) => conf.some((c) => JSON.stringify(relOf(S[c][2]).slice().reverse()) === JSON.stringify(relOf(S[i][2])));
const strat = (label, idx, want) => {
  const m = maskOf(idx.filter((i) => !demo[i]));
  const cr = crosses(upOf(m));
  const res = !cr ? 'não atravessa' : lieIn(m) ? 'atravessa e CAI na última fileira' : 'atravessa';
  check(want(cr, lieIn(m)), `${label}: ${res}`);
};
strat('só as confirmadas (o hábito da sala 8; "boato é mentira")', free.filter((i) => S[i][3] === 'conf'), (cr) => !cr);
strat('as confirmadas e só o boato que DIZ O MESMO que uma delas (a demonstração ao pé da letra)', free.filter((i) => S[i][3] === 'conf' || restates(i)), (cr) => !cr);
strat('tudo menos o boato que contradiz uma confirmada DE FRENTE (sem fazer cadeia)', free.filter((i) => !contraDirect(i)), (cr, l) => cr && l);
strat('"todo boato é verdade" (acender tudo)', free, (cr, l) => cr && l);
const naive = [1, 2, 3, 4];
strat('pela ordem "natural" 1, 2, 3, 4', free.filter((i) => S[i][3] === 'conf' || holdsIn(naive, S[i][2])), (cr, l) => !cr || l);
for (const c of ['E', 'D']) strat(`a parede ${c === 'E' ? 'esquerda' : 'direita'} inteira (a coluna reta)`, free.filter((i) => S[i][0] === c), (cr, l) => !cr || l);
check(free.filter((i) => truth[i] && S[i][3] === 'boato').some((i) => !restates(i)), 'há boato verdadeiro que só se prova por CADEIA (não repete nenhuma confirmada)');
check(lies.some((i) => !contraDirect(i)), 'há mentira que só se desmente por CADEIA (não é o contrário de nenhuma confirmada)');

console.log('\n── 3. O que a queda mostra: a Casa cita as confirmadas que a mentira nega ──');
// a refutação mínima de uma mentira "x antes de y": a cadeia de confirmadas de y até x (a ordem é total, então a cadeia é única)
const confRel = conf.map((c) => relOf(S[c][2]));
const refutes = (i) => {
  const [x, y] = relOf(S[i][2]);
  const out = [];
  for (let k = ORDER.indexOf(y); k < ORDER.indexOf(x); k++) out.push(conf[confRel.findIndex(([u, v]) => u === ORDER[k] && v === ORDER[k + 1])]);
  return out;
};
const uniqueMin = (i) => {
  // nenhum outro subconjunto mínimo das confirmadas também a desmente (a citação é sem ambiguidade)
  const subsets = [];
  for (let m = 1; m < 1 << conf.length; m++) {
    const sub = conf.filter((_, k) => m & (1 << k));
    const os = ORDERS.filter((o) => sub.every((c) => holdsIn(o, S[c][2])));
    if (os.every((o) => !holdsIn(o, S[i][2]))) subsets.push(m);
  }
  const mins = subsets.filter((m) => !subsets.some((m2) => m2 !== m && (m2 & m) === m2));
  return mins.length === 1;
};
const cites = {};
for (const i of lies) {
  cites[i] = refutes(i);
  check(uniqueMin(i), `mentira ${nm(S[i])} ${txt(S[i])}: a Casa cita ${cites[i].map((c) => `${nm(S[c])} ${txt(S[c])}`).join(' + ')}${cites[i].length > 1 ? ' (é preciso juntar as duas)' : ''}`);
}
check(new Set(lies.map((i) => cites[i].join())).size === lies.length, 'cada mentira cita um conjunto diferente de confirmadas (a citação diz QUAL verdade foi negada, mas não diz a frase: é preciso pensar)');
check(new Set(lies.flatMap((i) => cites[i])).size === conf.length, 'com tudo aceso (e na abertura, a ponte de quem veio antes) a Casa cita as TRÊS confirmadas: não entrega nenhuma mentira');
console.log('   ' + JSON.stringify(Object.fromEntries(lies.map((i) => [i, cites[i]]))) + '  ← tabela FPF_CITA para o código (índices de FPF_SLABS)');

console.log('\n── 4. O atalho de antes acabou: pisar não diz nada ──');
// regra nova: pisar numa laje das fileiras 0..R-2 não pesa nada; a última fileira só se alcança com um caminho inteiro
check(minimal.every((m) => free.filter((i) => m & (1 << free.indexOf(i))).some((i) => S[i][1] === R - 1)), 'toda tentativa que dá resposta é uma travessia inteira até a última fileira (não há como testar uma frase sozinha)');
// a sala antiga: a laje falsa rachava sob o pé, na hora. "Acender uma por uma e pisar": anda fileira por fileira, testa a laje da coluna em que
// está; se racha, cai, volta, reacende as que já sabe boas e tenta a outra
function oldOracle() {
  const B = analyse(OLD);
  let falls = 0;
  let throws = 0;
  const known = new Set(B.demo.map((d, i) => (d ? i : -1)).filter((i) => i >= 0));
  let col = 'E';
  for (let r = 1; r < OLD.R; r++) {
    for (const c of [col, col === 'E' ? 'D' : 'E']) {
      const i = B.cellIdx(c, r);
      throws += 1;
      if (B.truth[i]) {
        known.add(i);
        if (c !== col) {
          // passou para o outro lado: precisa da laje do lado de cá na fileira de baixo ou nesta
          const j = B.cellIdx(c, r - 1);
          if (!known.has(j)) {
            throws += 1;
            if (!B.truth[j]) throw new Error('caminho');
            known.add(j);
          }
        }
        col = c;
        break;
      }
      falls += 1;
      throws += [...known].filter((k) => !B.demo[k]).length; // reacender o que já se sabe bom
    }
  }
  return { falls, throws, t: throws * T_THROW + falls * T_FALL + T_WALK * (falls + 1) };
}
const old = oldOracle();
console.log(`   antes: "acender uma por uma e pisar" resolvia com ${old.falls} queda(s) e ${old.throws} arremessos (~${Math.round(old.t)} s), sem ler nada`);
const oldG = analyse(OLD);
console.log(`   (e a grade antiga, 2×4, mesmo com a regra nova, só tem ${oldG.minimal.length} rotas: chutar acertaria de primeira 1 vez em ${oldG.minimal.length}; por isso 5 fileiras)`);

console.log('\n── 5. O custo das estratégias bobas, medido ──');
const nThrow = (m) => free.filter((i) => m & (1 << free.indexOf(i))).length;
const tFail = (m) => nThrow(m) * T_THROW + T_WALK + T_FALL;
const tWin = nThrow(truthMask) * T_THROW + T_WALK + T_THROW; // a travessia certa + a frase da porta
// (c) chutar rotas
const n = minimal.length;
check(minimal.filter((m) => !lieIn(m)).length === 1 && n >= 6, `chutar rotas: ${n} rotas mínimas, uma só sem mentira`);
const failRoutes = minimal.filter(lieIn);
const avgFail = failRoutes.reduce((a, m) => a + tFail(m), 0) / failRoutes.length;
const eRandom = (n - 1) / 2; // quedas esperadas, em ordem aleatória sem repetir
console.log(`   ao acaso, sem repetir: acerta de primeira 1 vez em ${n}; em média ${fmt(eRandom)} quedas antes (pior caso ${n - 1}); ~${Math.round(eRandom * avgFail + tWin)} s em média, ~${Math.round((n - 1) * avgFail + tWin)} s no pior caso`);
const straights = minimal.filter((m) => new Set(free.filter((i) => m & (1 << free.indexOf(i))).map((i) => S[i][0])).size === 1);
const eObvious = straights.length + (n - straights.length - 1) / 2;
console.log(`   "pelo óbvio" (as colunas retas primeiro): ${fmt(eObvious)} quedas em média antes de acertar`);
check(eRandom >= 2.5 && eObvious >= 3.5, 'nenhum chute de rota resolve em poucas tentativas: mais de duas quedas e meia em média, cada uma reacendendo a rota inteira');
// (b) acender tudo e ir tirando (de uma em uma, de duas em duas...), confiando nas confirmadas
const rumors = free.filter((i) => S[i][3] === 'boato');
const C = (a, b) => (b < 0 || b > a ? 0 : b === 0 ? 1 : (C(a - 1, b - 1) * a) / b);
let eSub = 0;
for (let k = 0; k < lies.length; k++) eSub += C(rumors.length, k);
eSub += (C(rumors.length, lies.length) - 1) / 2;
check(eSub >= 10, `"acender tudo e ir apagando": ~${fmt(eSub)} quedas em média (tirando 1, depois 2, depois 3 boatos de ${rumors.length}), cada uma reacendendo ~${free.length - 1} frases (~${Math.round(eSub * (free.length * T_THROW + T_WALK + T_FALL) / 60)} min)`);
// (a) uma por uma: ver §4 (pisar não responde); a única resposta é a travessia inteira, que é o chute de rota
check(true, '"acender uma por uma e pisar": pisar não responde mais; vira o chute de rota (acima)');
// (d) o testador ideal que não lê as frases: confia nas marcas, usa cada queda e cada recusa da porta da melhor forma possível, mas ignora as
// citações (não pensa). Busca exaustiva (minimax) do pior caso, sobre todas as verdades possíveis dos boatos que ainda deixam a sala resolvível
const hyps = [];
for (let h = 0; h < 1 << rumors.length; h++) {
  const T = new Set([...free.filter((i) => S[i][3] === 'conf'), ...rumors.filter((_, k) => h & (1 << k))]);
  const m = maskOf([...T]);
  if (crosses(upOf(m))) hyps.push(m);
}
const confMask = maskOf(free.filter((i) => S[i][3] === 'conf'));
const tests = [];
for (let s = 0; s < 1 << rumors.length; s++) {
  const m = confMask | maskOf(rumors.filter((_, k) => s & (1 << k)));
  tests.push({ m, bridge: crosses(upOf(m)) });
}
const memo = new Map();
function worst(H) {
  // H: índices em hyps. Devolve o número de tentativas (pontes e portas) até abrir a porta, no pior caso, jogando da melhor forma
  if (H.length === 1) return 1;
  const key = H.join(',');
  if (memo.has(key)) return memo.get(key);
  let best = Infinity;
  const lb = Math.ceil(Math.log2(H.length)) + 1;
  for (const t of tests) {
    // a porta: abre se o aceso é exatamente a verdade
    const doorFail = H.filter((h) => hyps[h] !== t.m);
    if (doorFail.length < H.length) {
      const v = 1 + (doorFail.length ? worst(doorFail) : 0);
      if (v < best) best = v;
    }
    if (t.bridge) {
      const hold = H.filter((h) => (t.m & ~hyps[h]) === 0);
      const fall = H.filter((h) => (t.m & ~hyps[h]) !== 0);
      if (hold.length && fall.length) {
        const v = 1 + Math.max(worst(hold), worst(fall));
        if (v < best) best = v;
      }
    }
    if (best <= lb) break;
  }
  memo.set(key, best);
  return best;
}
const wIdeal = worst(hyps.map((_, k) => k));
check(wIdeal >= 4, `o testador IDEAL que não lê (confia nas marcas, aproveita cada queda da melhor forma, ignora as citações): ${hyps.length} verdades possíveis, pior caso ${wIdeal} tentativas (~${wIdeal - 1} quedas)`);
// (e) quem lê e deduz
console.log(`   quem deduz: 0 quedas, 1 travessia (${nThrow(truthMask)} frases + a da porta, ~${Math.round(tWin)} s de mão), mais o tempo de ler e pensar`);
// (f) quem pensa um pouco e erra um boato: uma queda, e a citação aponta a verdade negada
for (const i of lies) {
  const m = truthMask | maskOf([i]);
  if (crosses(upOf(m))) console.log(`   errou só ${nm(S[i])}: cai uma vez e a Casa cita ${cites[i].map((c) => nm(S[c])).join(' + ')}; dali, uma cadeia de ${cites[i].length} passo(s) acha a mentira`);
}

console.log('\n── 6. O jogo está igual a este verificador? ──');
try {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../src/scene/rooms/chapter1c.ts', import.meta.url), 'utf8');
  const blk = src.match(/const FPF_SLABS[^=]*=\s*\[([\s\S]*?)\n\];/);
  const rows = src.match(/const PF = \{[^}]*rows:\s*(\d+)/);
  const ID = { n1: 1, n2: 2, n3: 3, n4: 4 };
  const got = blk ? [...blk[1].matchAll(/\['([ED])',\s*(\d+),\s*\['(\w+)',\s*'(\w+)',\s*'(\w+)',\s*'(\w+)'\],\s*(true|false)/g)].map((m) => [m[1], +m[2], [ID[m[3]], m[4], ID[m[5]]], m[6], m[7] === 'true']) : [];
  const same = rows && +rows[1] === R && JSON.stringify(got) === JSON.stringify(SLABS);
  if (same) console.log('✓ chapter1c.ts tem as mesmas 10 lajes e 5 fileiras');
  else warn(`chapter1c.ts ainda não tem esta ponte (${got.length} lajes, ${rows ? rows[1] : '?'} fileiras): implementar a proposta e rodar de novo`);
} catch (e) {
  warn(`não consegui ler chapter1c.ts (${e.message})`);
}

console.log(fail ? '\nFALHOU' : '\nOK: A Ponte de Frases tem uma resposta só, pisar não é mais um oráculo, e todo atalho custa várias quedas; deduzir atravessa de primeira.');
process.exit(fail ? 1 : 0);
