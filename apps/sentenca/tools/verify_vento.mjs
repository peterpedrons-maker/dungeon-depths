// Verifica O VENTO de «O Claustro do Vento» (sala 21, nível 9; DESIGN.md §93; FIRE_VENTO em src/scene/rooms/chapter1b.ts). A lógica dos
// estandartes (qual boato tem de sair da conta) continua provada por tools/verify_dizem_mesmo.mjs: é «DOIS ANTES QUATRO». Aqui: COMO queimá-lo.
// Os estandartes ficam atrás de grades nas galerias: o dado não chega neles. O fogo chega pelo VENTO: o claustro é aberto e o vento gira num
// ciclo (para o fundo, para a esquerda, para a frente, para a direita; 6 s cada; a fumaça e o cata-vento da fonte mostram para onde). Acender
// um FOGARÉU (cesto de ferro num poste) solta fagulhas por 4 s; elas voam a favor do vento numa faixa e põem fogo em todo estandarte dentro dela.
// Queimar dois estandartes: a Casa pendura tudo de volta. Uso: node tools/verify_vento.mjs
const PHASE = 6;
const DIRS = [[0, -1], [-1, 0], [0, 1], [1, 0]]; // (x, dz) para onde o vento sopra: fundo, esquerda, frente, direita (dz cresce para a entrada)
const DIR_NAME = ['para o fundo', 'para a esquerda', 'para a frente', 'para a direita'];
const BURN = 4;
const SPEED = 3.2; // as fagulhas voam a ~3,2 m/s: o estandarte a `along` metros só pega fogo depois de along/SPEED segundos (com o vento daquele instante)
// os estandartes: [x, dz] (a mesma ordem de DM_BANNERS: o 0 é «DOIS ANTES QUATRO», o que tem de queimar sozinho)
const BANNERS = [[-2.25, 4.5], [2.25, 4.5], [-4.5, 6.75], [4.5, 6.75], [-2.25, 13.5]];
const BW = 0.7; // meia-largura de um estandarte
// os fogaréus: [x, dz, meia-largura da faixa de fagulhas, comprimento] (a mesma ordem de VT_FIRES)
const FIRES = [
  [-2.25, 7.6, 0.6, 6], // à esquerda da fonte
  [2.25, 7.6, 0.6, 6], // à direita da fonte
  [0, 6.0, 1.8, 8], // o GRANDE, na frente da fonte (lado do fundo): a faixa larga
];
const hits = (f, d) => {
  const [fx, fz, hw, len] = FIRES[f];
  const [ux, uz] = DIRS[d];
  const out = [];
  BANNERS.forEach(([bx, bz], i) => {
    const ax = bx - fx;
    const az = bz - fz;
    const along = ax * ux + az * uz;
    const lat = Math.abs(ax * uz - az * ux);
    if (along > 0 && along < len && lat < hw + BW) out.push([i, along]);
  });
  return out;
};
const dirAt = (t) => Math.floor((((t % (4 * PHASE)) + 4 * PHASE) % (4 * PHASE)) / PHASE);
let fail = false;
const check = (cond, msg) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) fail = true;
};
console.log('o que cada fogaréu queima, em cada vento:');
FIRES.forEach((_, f) => console.log(`  fogaréu ${f}: ` + DIRS.map((_, d) => `${DIR_NAME[d]} → {${hits(f, d).map((h) => h[0]).join(',')}}`).join(' · ')));
// acender o fogaréu f no instante t: as fagulhas valem de t a t+BURN; somam todos os ventos que passarem nesse tempo
const burnSet = (f, t) => {
  const s = new Set();
  for (let u = t; u < t + BURN; u += 0.02) for (const [b, along] of hits(f, dirAt(u))) if (u - t >= along / SPEED) s.add(b);
  return [...s].sort();
};
const onlyZero = [];
for (let f = 0; f < FIRES.length; f++) {
  let run = null;
  for (let t = 0; t < 4 * PHASE; t += 0.05) {
    const s = burnSet(f, t);
    const good = s.length === 1 && s[0] === 0;
    if (good && !run) run = [t, t];
    if (good && run) run[1] = t;
    if (!good && run) {
      onlyZero.push([f, ...run]);
      run = null;
    }
  }
  if (run) onlyZero.push([f, ...run]);
}
const fires = new Set(onlyZero.map((w) => w[0]));
check(fires.size === 1 && fires.has(0), `só um fogaréu queima «DOIS ANTES QUATRO» sozinho: o da esquerda da fonte (${[...fires].join(',')})`);
const win = onlyZero.filter((w) => w[0] === 0).reduce((s, w) => s + (w[2] - w[1]), 0);
check(win > 3 && win < 8, `...e só se as fagulhas pegarem o vento PARA O FUNDO e não chegarem ao vento para a esquerda: uma janela de ~${win.toFixed(1)} s em cada volta de ${4 * PHASE} s`);
check(hits(2, 0).length === 2 && hits(2, 0).some((h) => h[0] === 0), 'o fogaréu GRANDE do meio, com o vento para o fundo, queima os DOIS estandartes do fundo: a Casa pendura tudo de volta (a armadilha óbvia)');
const late = burnSet(0, PHASE - 1);
check(late.includes(0) && late.length > 1, 'aceso tarde (o vento vira para a esquerda no meio): queima também o estandarte da galeria da esquerda');
console.log(fail ? '\nFALHOU' : '\nOK: o vento tem um jeito só de queimar o boato certo sozinho.');
process.exit(fail ? 1 : 0);
