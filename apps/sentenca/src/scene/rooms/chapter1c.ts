// SALA 14 · A PONTE DE FRASES (nível 6; DESIGN.md §93 e §94; verificador tools/verify_ponte_frases.mjs, projetado pelo enigmista). No lugar de
// O Boato Verdadeiro (FIRE_VERDADE, na reserva), com a mesma porta, «ACENDER VERDADE CONFIRMADO». Ensina VERDADE: «dizer é fazer».
// O meio da sala é um FOSSO. Cada frase da parede tem uma LAJE no fosso, logo embaixo dela (duas por fileira, cinco fileiras); acender a frase faz a
// laje subir até o chão. As lajes erguidas se travam: a ponte é UMA PEÇA SÓ, e dá para andar nela à vontade (até em cima de uma mentira, para
// chegar perto das frases e ler). A Casa PESA a ponte quando o jogador pisa na ÚLTIMA fileira: se houver qualquer frase falsa acesa, a ponte inteira
// treme e cede (e SEGURA quem está nela: ninguém sai para a borda da porta antes de cair), a Casa apaga tudo o que ele acendeu, ele cai, fica
// escuro e volta à entrada. Ela não diz qual frase mentiu: CITA as confirmadas que a mentira nega (a luz corre por elas de novo e de novo, no tremor,
// no escuro e outra vez quando a luz volta). Pisar numa laje não responde nada (o atalho de testar laje por laje acabou, pedido do Pedro, §94).
// A ABERTURA ensina a regra sem custo: a sala começa com a ponte inteira acesa ("a ponte de quem veio antes"); ela aguenta até a última fileira,
// cai ali e a Casa cita as três confirmadas. A porta julga quando se acende a frase dela: o conjunto aceso tem de ser exatamente o das verdadeiras.
// Confirmadas: 1 antes 2, 1 depois 3, 4 depois 2 → 3, 1, 2, 4. Verdadeiras: 3 antes 2, 4 depois 1, 3 antes 4 (e a demonstração, 2 depois 1).
// Falsas: 4 antes 1, 3 depois 1, 2 antes 3.
// Solução: acender «TRÊS ANTES DOIS», «QUATRO DEPOIS UM», «UM DEPOIS TRÊS», «QUATRO DEPOIS DOIS» e «TRÊS ANTES QUATRO», nenhuma falsa; atravessar
// esquerda, esquerda, passa para a direita na 2ª fileira, direita, direita; acender a frase da porta.
import * as THREE from 'three';
import type { FireExtra, FireExtraApi, FireSpec, FireTablet } from './fire';
import { lambert, worldBoxUV } from '../kit';
import type { Box, Rect } from '../types';

const mkBox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box => ({
  min: new THREE.Vector3(x0, y0, z0),
  max: new THREE.Vector3(x1, y1, z1),
});

// o fosso: da borda da entrada (17,5 m do fundo) à borda da porta (2,5 m do fundo), a sala inteira de largura; cinco fileiras de duas lajes (3 m)
const PF = { hx: 5.6, z0: -19, h: 3.8, front: 17.5, back: 2.5, depth: 2.6, rows: 5 };
const ROW_L = (PF.front - PF.back) / PF.rows;
const rowDz = (r: number) => PF.front - ROW_L * (r + 0.5);
// [coluna (E = esquerda, D = direita), fileira (0 = junto da entrada), frase, demonstração, verdadeira]: a ordem do verificador (SLABS)
const FPF_SLABS: ['E' | 'D', number, string[], boolean, boolean][] = [
  ['E', 0, ['n1', 'antes', 'n2', 'conf'], true, true],
  ['D', 0, ['n2', 'depois', 'n1', 'boato'], true, true],
  ['E', 1, ['n3', 'antes', 'n2', 'boato'], false, true],
  ['D', 1, ['n4', 'antes', 'n1', 'boato'], false, false],
  ['E', 2, ['n4', 'depois', 'n1', 'boato'], false, true],
  ['D', 2, ['n1', 'depois', 'n3', 'conf'], false, true],
  ['E', 3, ['n3', 'depois', 'n1', 'boato'], false, false],
  ['D', 3, ['n4', 'depois', 'n2', 'conf'], false, true],
  ['E', 4, ['n2', 'antes', 'n3', 'boato'], false, false],
  ['D', 4, ['n3', 'antes', 'n4', 'boato'], false, true],
];
// quando a ponte cai por uma mentira acesa, a Casa CITA as confirmadas que ela nega (índices de FPF_SLABS; o verificador confere)
const FPF_CITA: Record<number, number[]> = { 3: [0, 7], 6: [5], 8: [5, 0] };
const WEIGH_S = 0.7; // o tremor antes de ceder (a ponte SEGURA quem está nela: a borda da porta fecha até ele cair)
const CITE_S = 6; // quando a luz volta, a Casa ainda aponta as confirmadas negadas por estes segundos (a luz corre por elas de novo e de novo)
// uma frase por tablete (cada uma em cima da sua laje)
const FPF_TABLETS: FireTablet[] = FPF_SLABS.map(([col, row, words, demo, good]) => ({
  lines: [{ words, preLit: demo || undefined, good: (!demo && good) || undefined, worn: words[3] === 'boato' || undefined }],
  wall: col === 'E' ? 'left' : 'right',
  dz: rowDz(row),
  size: 0.35, // (uma linha de 4 glifos a 0,4 m não cabe com a moldura numa fileira de 3 m)
  lit: true,
}));

// a quina das lajes (um aro claro com a sombra do chanfro por dentro; o meio é vazado), em pixels grossos: 5,5 × 3 m em 88 × 48
let rimTex: THREE.CanvasTexture | null = null;
function slabRimTexture() {
  if (rimTex) return rimTex;
  const W = 88;
  const H = 48;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const frame = (o: number, t: number, color: string) => {
    g.fillStyle = color;
    g.fillRect(o, o, W - 2 * o, t);
    g.fillRect(o, H - o - t, W - 2 * o, t);
    g.fillRect(o, o, t, H - 2 * o);
    g.fillRect(W - o - t, o, t, H - 2 * o);
  };
  frame(0, 2, '#a29c92');
  frame(2, 1, '#7c766e');
  frame(3, 1, '#3a3430');
  // lascas na quina (gasta onde se pisa)
  for (const [x, y] of [[9, 0], [30, 1], [61, 0], [0, 14], [87, 32], [44, 47], [72, 46], [1, 37]] as [number, number][]) {
    g.fillStyle = '#6e645a';
    g.fillRect(x, y, 2, 1);
  }
  rimTex = new THREE.CanvasTexture(c);
  rimTex.magFilter = rimTex.minFilter = THREE.NearestFilter;
  rimTex.colorSpace = THREE.SRGBColorSpace;
  return rimTex;
}

// (cenógrafo) A TRAVA: um grampo de bronze em cauda de andorinha, a peça que os pedreiros embutem atravessando a junta de dois blocos. Deitado
// no tampo, com o eixo comprido em x; o tampo dele fica 6 mm acima da laje (lê-se por cima da quina clara), claro onde se pisa e escuro dos lados
function keyGeometry() {
  const L = 0.46; // comprimento (atravessa a junta)
  const E = 0.11; // meia largura nas pontas
  const W = 0.05; // meia largura na cintura (sobre a junta)
  const s = new THREE.Shape();
  s.moveTo(-L / 2, -E);
  s.lineTo(0, -W);
  s.lineTo(L / 2, -E);
  s.lineTo(L / 2, E);
  s.lineTo(0, W);
  s.lineTo(-L / 2, E);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false });
  g.rotateX(Math.PI / 2); // a extrusão desce: o tampo fica em y = 0
  g.translate(0, 0.006, 0);
  const nrm = g.attributes.normal;
  const col = new Float32Array(nrm.count * 3);
  for (let q = 0; q < nrm.count; q++) col.fill(nrm.getY(q) > 0.5 ? 1 : 0.5, q * 3, q * 3 + 3);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

function ponteFrasesExtra(api: FireExtraApi): FireExtra {
  const { kit, ctx, X0, X1, Z0, boxes } = api;
  const D = PF.depth;
  const gz1 = Z0 + PF.front; // a borda da entrada
  const gz0 = Z0 + PF.back; // a borda da porta
  const SUNK = -D + 0.06; // a laje afundada: um palmo acima do fundo (vê-se o contorno de cada uma)
  // (cenógrafo) cada laje tem os seus materiais: a face de cima escurece quando ela está lá embaixo (no escuro do fosso) e clareia conforme
  // sobe para a luz, e os lados escurecem para baixo, como as paredes do fosso. Antes, a laje afundada tinha a mesma cor do chão das bordas e,
  // da entrada, o fosso parecia só um piso mais escuro.
  const cells = FPF_SLABS.map(([col, row, , demo, good], i) => {
    const x0 = col === 'E' ? X0 : 0;
    const x1 = col === 'E' ? 0 : X1;
    const z1 = gz1 - ROW_L * row;
    const z0 = z1 - ROW_L;
    const w = x1 - x0 - 0.06;
    const d = z1 - z0 - 0.06;
    const geo = new THREE.BoxGeometry(w, D, d);
    worldBoxUV(geo, (x0 + x1) / 2, -D / 2, (z0 + z1) / 2); // (a pedra em metros, como nas caixas do kit; a textura sobe junto com a laje)
    const pos = geo.attributes.position;
    const col3 = new Float32Array(pos.count * 3);
    for (let q = 0; q < pos.count; q++) {
      const k = (pos.getY(q) + D / 2) / D; // 1 no tampo, 0 no pé
      const v = 0.16 + 0.84 * k * k;
      col3[q * 3] = col3[q * 3 + 1] = col3[q * 3 + 2] = v;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col3, 3));
    const side = kit.stone.clone();
    side.vertexColors = true;
    const topMat = kit.slab.clone();
    topMat.vertexColors = true;
    const mesh = new THREE.Mesh(geo, [side, side, topMat, side, side, side]);
    mesh.position.set((x0 + x1) / 2, (demo ? 0 : SUNK) - D / 2, (z0 + z1) / 2);
    mesh.userData.noPlan = true; // (a laje afundada passa do fundo do fosso: não conta na planta da sala)
    kit.add(mesh);
    // a quina lavrada em volta do tampo: cada laje é UM bloco (lê-se qual é qual, lá embaixo ou em cima) e a beirada dela, de longe, é uma
    // linha clara que diz onde o chão acaba
    const rimMat = new THREE.MeshLambertMaterial({ map: slabRimTexture(), transparent: true, alphaTest: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    const rim = new THREE.Mesh(new THREE.PlaneGeometry(w, d), rimMat);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = D / 2 + 0.004;
    mesh.add(rim);
    const box = mkBox(x0, -D, z0, x1, demo ? 0 : SUNK, z1);
    boxes.push(box);
    return { i, col, row, x0, x1, z0, z1, demo, good, y: demo ? 0 : SUNK, mesh, box, upSnd: false, side, topMat, rimMat };
  });
  // o quanto de luz chega no tampo: no fundo, pouco; na altura do chão, toda (a laje "sobe para a luz")
  const shade = (c: (typeof cells)[number]) => {
    const k = Math.max(0, Math.min(1, (c.y - SUNK) / -SUNK));
    const v = 0.3 + 0.7 * k * k;
    c.topMat.color.setScalar(v);
    c.rimMat.color.setScalar(v);
    c.side.color.setScalar(0.55 + 0.45 * k);
  };
  cells.forEach(shade);
  // a BORDA dos dois patamares: uma capa de pedra lavrada clara, com a face descendo uns palmos para dentro do fosso (a linha clara da beirada,
  // com o escuro embaixo, é o que o olho lê como "aqui o chão acaba")
  for (const [z, s] of [[gz1, 1], [gz0, -1]] as [number, number][]) kit.box(X1 - X0, 0.26, 0.38, kit.slab, 0, -0.124, z + s * 0.17, false);
  const cellAt = (x: number, z: number) => {
    if (z > gz1 || z < gz0) return null;
    const row = Math.max(0, Math.min(PF.rows - 1, Math.floor((gz1 - z) / ROW_L)));
    return cells.find((c) => c.row === row && (x < 0 ? c.col === 'E' : c.col === 'D')) ?? null;
  };
  // luz: lampiões de ferro pendurados no meio da sala, sobre as costuras das fileiras, entre as duas colunas (longe das frases das paredes)
  const iron = lambert(null, 0x26242a);
  const lamps: THREE.Sprite[] = [];
  const lampEms: ReturnType<typeof kit.light>[] = [];
  for (let k = 1; k < PF.rows; k++) {
    const z = gz1 - ROW_L * k;
    kit.box(0.03, 0.7, 0.03, iron, 0, PF.h - 0.35, z, false);
    kit.box(0.3, 0.06, 0.3, iron, 0, PF.h - 0.72, z, false);
    kit.box(0.24, 0.05, 0.24, iron, 0, PF.h - 1.08, z, false);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) kit.box(0.025, 0.36, 0.025, iron, sx * 0.12, PF.h - 0.9, z + sz * 0.12, false);
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
    f.scale.set(0.26, 0.3, 1);
    f.position.set(0, PF.h - 0.92, z);
    kit.group.add(f);
    lamps.push(f);
    const em = kit.light(0, PF.h - 0.95, z, 0xffa860, 30);
    // (cenógrafo, medido; DESIGN.md §96) os quatro podem ganhar sombra. O motor tem um número fixo de luzes com sombra por opção (Altas 4,
    // Médias 2) e as dá às chamas marcadas mais perto: o custo é o da opção. Nas Médias (o padrão do celular) não se mede diferença; nas
    // Altas, andando na ponte, os mapas dos lampiões se refazem a cada passo (~+15% no quadro contra nenhum lampião com sombra), e dois em
    // vez de quatro não economizam nada (os dois mapas por quadro se refazem do mesmo jeito). Sem sombra nenhuma, a ponte perderia a sombra
    // do jogador e a das lajes no fosso
    em.shadow = true;
    lampEms.push(em);
  }
  // (no fundo do fosso, as brasas velhas nas frestas são o chão do buraco, no construtor: fire.ts, `floorGap`; sem luz própria, o fundo fica
  // escuro e a profundidade se lê pela luz que some)

  // ── (cenógrafo) AS TRAVAS: a ponte é UMA PEÇA SÓ, e isso se vê. Em cada junta entre duas lajes erguidas que a Casa pesa (a demonstração não
  // faz parte da peça) assenta um grampo de bronze em cauda de andorinha: dois em cada junta entre fileiras, dois na junta do meio. Ele desce
  // na junta quando as duas lajes chegam em cima; sai quando uma desce (a frase apagada); no tremor, chacoalha e range; quando a ponte
  // cede, todos saltam e caem no fosso. Uma malha só para todos (InstancedMesh) ──
  type Cell = (typeof cells)[number];
  type KeySt = 'off' | 'in' | 'on' | 'out' | 'fly';
  const keyList: { a: Cell; b: Cell; x: number; z: number; ry: number; st: KeySt; t: number; p: THREE.Vector3; v: THREE.Vector3; rx: number; rz: number; spin: number }[] = [];
  for (const a of cells)
    for (const b of cells) {
      if (a.demo || b.demo || a.i >= b.i) continue;
      const mk = (x: number, z: number, ry: number) => keyList.push({ a, b, x, z, ry, st: 'off', t: 0, p: new THREE.Vector3(x, 0, z), v: new THREE.Vector3(), rx: 0, rz: 0, spin: 0 });
      if (a.col === b.col && Math.abs(a.row - b.row) === 1) {
        const z = gz1 - ROW_L * Math.max(a.row, b.row); // a junta entre as duas fileiras
        const xe = a.col === 'E' ? X0 : X1;
        for (const u of [1 / 3, 2 / 3]) mk(xe * u, z, Math.PI / 2);
      } else if (a.row === b.row && a.col !== b.col) {
        const zc = (a.z0 + a.z1) / 2; // a junta do meio, em x = 0
        for (const u of [-0.75, 0.75]) mk(0, zc + u, 0);
      }
    }
  // (bronze escuro: contra a quina clara das lajes ele se lê como metal embutido, e não como um remendo de madeira; o recuo de profundidade
  // ganha da quina, que é um plano por cima do tampo)
  const keyMat = new THREE.MeshLambertMaterial({ color: 0x5a4228, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 });
  const keyMesh = new THREE.InstancedMesh(keyGeometry(), keyMat, keyList.length);
  keyMesh.frustumCulled = false;
  keyMesh.userData.noShadow = true; // (rentes ao chão: sombra nenhuma valeria o custo)
  keyMesh.userData.noPlan = true;
  kit.group.add(keyMesh);
  const keyCol = new THREE.Color();
  const keyM = new THREE.Matrix4();
  const keyQ = new THREE.Quaternion();
  const keyE = new THREE.Euler();
  const keyS = new THREE.Vector3();
  let keySnap = true; // (a abertura, recomeçar, o salvamento: as travas já no lugar, sem animação)
  // ── o PÓ das juntas: no tremor ele sobe das juntas travadas e escorre da beirada da borda da porta para o fosso; quando a ponte cede, uma
  // nuvem. Pontos pequenos cor de pedra (nunca a cor das brasas), um desenho só ──
  const DN = 160;
  const dp = new Float32Array(DN * 3);
  const dv = new Float32Array(DN * 3);
  const dl = new Float32Array(DN);
  for (let q = 0; q < DN; q++) dp[q * 3 + 1] = -50;
  const dustGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0x9a8a72, size: 2, sizeAttenuation: false, transparent: true, opacity: 0.85, depthWrite: false });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  dust.userData.noPlan = true;
  kit.group.add(dust);
  let dustNext = 0;
  const puff = (x: number, y: number, z: number, spread: number, up: number) => {
    const q = dustNext++ % DN;
    dp[q * 3] = x + (Math.random() - 0.5) * spread;
    dp[q * 3 + 1] = y;
    dp[q * 3 + 2] = z + (Math.random() - 0.5) * spread;
    dv[q * 3] = (Math.random() - 0.5) * 0.35;
    dv[q * 3 + 1] = up * (0.5 + Math.random() * 0.6);
    dv[q * 3 + 2] = (Math.random() - 0.5) * 0.35;
    dl[q] = 0.6 + Math.random() * 0.6;
  };
  // ── a CITAÇÃO de longe: a frase citada esquenta a parede em volta dela, com uma luz de verdade perto (curta, para não dourar a vizinha;
  // nunca uma faixa atrás da escrita, §58). Da entrada, a frase do fundo citada vira uma mancha quente na parede rasante, e não só um ponto.
  // (Sem sombra: ela quase nunca ganharia uma das luzes com sombra, e cada troca refaz um mapa.) A força é FIRME e alta: o motor empresta as
  // luzes de verdade pela força dividida pela distância ao quadrado, e com a força das frases (4 a 11) a citada do fundo nunca ganhava uma
  // vaga vista da entrada (medido: a 12ª vaga fica com nota ~0,1). A 46, ela ganha. A luz fica 1,4 m fora da parede e acima da frase: o
  // mais claro cai em cima dela e na laje embaixo, e os glifos não perdem o contraste; o alcance curto (2,6 m) segura a luz na frase dela
  // (a vizinha recebe uns 5%) ──
  const glows = [...new Set(Object.values(FPF_CITA).flat())].map((i) => {
    const c = cells[i];
    const z = Z0 + rowDz(c.row);
    const em = kit.light(c.col === 'E' ? X0 + 1.4 : X1 - 1.4, 2.3, z, 0xffc070, 0);
    em.range = 2.6;
    return { i, em, t: 0, k: 0, at: new THREE.Vector3(c.col === 'E' ? X0 + 0.3 : X1 - 0.3, 1.65, z) };
  });
  // a Casa aponta estas frases por `secs` (a luz corre por elas; fire.ts) e a parede em volta delas esquenta junto
  const citeNow = (idx: number[], secs: number) => {
    api.cite(idx, secs);
    for (const g of glows) if (idx.includes(g.i)) g.t = secs;
  };

  let falling = false; // caiu no fosso: o escuro vem e ele volta à entrada
  let weigh = -1; // >= 0: a Casa está pesando a ponte (o tremor antes de ceder)
  let collapsing = false; // a ponte cedeu: as lajes descem depressa
  let cited: number[] = [];
  // a citação à vista: 1 = a Casa citou e o escuro vai vir; 2 = no escuro. Quando a luz volta (o jogador está na entrada, ou na borda da porta
  // depois do erro dela), a Casa aponta de novo, por CITE_S: a 1ª corrida da luz acaba no tremor e, sem esta, quase não se via a citação
  let citeBack = 0;
  // as mentiras acesas agora (índices de FPF_SLABS)
  const liesLit = (L: ReturnType<typeof api.lines>) => cells.filter((c) => !c.demo && !c.good && L[c.i]?.lit).map((c) => c.i);
  const citeFor = (lies: number[]) => [...new Set(lies.flatMap((i) => FPF_CITA[i] ?? []))].sort((a, b) => a - b);
  // A ABERTURA: a ponte de quem veio antes, inteira e acesa (todas as frases, as falsas também); aguenta até a última fileira e cai ali
  const opening = () => {
    api.setLines(cells.map(() => true));
    for (const c of cells) {
      c.y = 0;
      c.box.max.y = 0;
      c.mesh.position.y = -D / 2;
      shade(c);
    }
    keySnap = true;
  };
  opening();
  if (import.meta.env.DEV) {
    (globalThis as Record<string, unknown>).__ponteFrases = () => ({
      cells: cells.map((c) => ({ c: `${c.col}${c.row}`, y: +c.y.toFixed(2), good: c.good })),
      lines: api.lines().map((l) => l.lit),
      risen: api.lockRisen(),
      solved: api.solved(),
      falling,
      weigh: +weigh.toFixed(2),
      cited,
      keys: keyList.map((k) => k.st).join(''),
      glows: glows.map((g) => `${g.i}:${g.em.intensity.toFixed(1)}:${g.em.lit.toFixed(1)}`), // (índice : força : luz de verdade que o motor deu)
    });
    // (testes) quais lampiões podem ganhar sombra (para medir o custo): uma lista de 0/1, do 1º (junto da entrada) ao 4º
    (globalThis as Record<string, unknown>).__pfLamps = (on: number[]) => lampEms.forEach((e, k) => (e.shadow = !!on[k]));
  }
  return {
    update(dt, t) {
      for (const [k, f] of lamps.entries()) f.material.map = kit.frame(t * 8 + k * 3);
      if (api.lockRisen() && !api.solved()) api.markSolved();
      const L = api.lines();
      // as lajes: sobem quando a frase acende, descem quando ela apaga; quando a ponte cede, descem todas depressa
      for (const c of cells) {
        const want = c.demo || L[c.i]?.lit ? 0 : SUNK;
        if (want > c.y) {
          if (!c.upSnd) {
            ctx.sfx('bridgeRise'); // (o arrasto da laje subindo, sem o baque e sem o violoncelo do pilar: a laje de uma mentira também sobe)
            c.upSnd = true;
          }
          c.y = Math.min(want, c.y + dt * 1.7);
        } else if (want < c.y) {
          c.upSnd = false;
          c.y = Math.max(want, c.y - dt * (collapsing ? 6 : 2.4));
        }
        // o tremor: a Casa pesa a ponte inteira (todas as lajes erguidas tremem juntas; a demonstração não)
        const shake = weigh >= 0 && !c.demo && c.y > SUNK + 0.2;
        const jx = shake ? Math.sin(t * 61 + c.i) * 0.025 : 0;
        const jz = shake ? Math.cos(t * 53 + c.i) * 0.025 : 0;
        c.mesh.position.set((c.x0 + c.x1) / 2 + jx, c.y - D / 2, (c.z0 + c.z1) / 2 + jz);
        c.box.max.y = c.y;
        shade(c);
      }
      const p = ctx.player.pos;
      const feet = ctx.feetY();
      const under = cellAt(p.x, p.z);
      // (numa cena, como a do dado queimando a frase, a Casa espera: ela pesa à vista, depois de a frase acender. Antes, quem acendia uma
      // mentira de pé na última fileira tremia, caía e ia para o escuro com a câmera presa no dado, sem ver a mentira acender)
      const still = ctx.paused();
      // PESAR: de pé numa laje erguida da ÚLTIMA fileira, com uma mentira acesa (em qualquer lugar da ponte): a Casa pesa a ponte inteira
      if (weigh < 0 && !still && !falling && !api.solved() && under && under.row === PF.rows - 1 && under.y > -0.05 && Math.abs(feet - under.y) < 0.2) {
        const lies = liesLit(L);
        if (lies.length) {
          weigh = 0;
          cited = citeFor(lies);
          citeNow(cited, 20); // (a Casa aponta a verdade negada no tremor e no escuro; quando a luz volta, de novo, por CITE_S)
          citeBack = 1;
          ctx.sfx('bridgeHold'); // (as travas mordem e a pedra range nas juntas: a ponte prende o pé, até ceder em t = WEIGH_S)
          ctx.dieReact('shake'); // (o dado da mão treme junto)
        }
      }
      if (weigh >= 0 && !still) {
        weigh += dt;
        // (cenógrafo) A PONTE PRENDE O PÉ: o chão treme cada vez mais e o passo quase não sai (a borda da porta já não recebe ninguém, rects())
        ctx.shake(0.35 + 0.65 * Math.min(1, weigh / WEIGH_S), 0.12, 0.8);
        if (weigh > WEIGH_S) {
          weigh = -1;
          api.failLines(1); // a Casa apaga tudo o que ele acendeu (o frio só cobre a queda: o relógio dele para no escuro, e na volta já se acende)
          collapsing = true;
          ctx.shake(1.6, 0.3, 0.8); // (o tranco: ela cedeu)
          ctx.sfx('bridgeBreak'); // (as travas estalam e soltam, as lajes raspam e batem no fundo do fosso, o entulho e as travas assentam)
          // as travas saltam das juntas e caem no fosso; uma nuvem de pó sobe de todas as juntas
          for (const k of keyList) {
            if (k.st !== 'on' && k.st !== 'in') continue;
            k.st = 'fly';
            // (um pulo curto: as lajes já descem a 6 m/s, e a trava que fica no ar um instante é o que se vê soltar)
            k.v.set((Math.random() - 0.5) * 0.6, 0.6 + Math.random() * 0.6, (Math.random() - 0.5) * 0.6);
            k.spin = (Math.random() - 0.5) * 9;
            for (let q = 0; q < 4; q++) puff(k.p.x, 0.02, k.p.z, 0.7, 0.9);
          }
          for (let q = 0; q < 24; q++) puff(X0 + Math.random() * (X1 - X0), 0.0, gz0 + 0.06, 0.1, -0.6);
        }
      }
      // caiu no fosso (a ponte cedeu, ou ele andou para fora de uma laje): o escuro, e ele volta à entrada
      if (!falling && feet < -1) {
        falling = true;
        ctx.blackout(2.5, () => {
          collapsing = false;
          ctx.toEntrance();
          falling = false;
        });
      }
      // a luz voltou depois de uma citação: a Casa aponta de novo, à vista
      if (citeBack === 1 && ctx.dark() >= 1) citeBack = 2;
      else if (citeBack === 2 && ctx.dark() < 0.6) {
        citeBack = 0;
        citeNow(cited, CITE_S);
        // (cenógrafo) e o dado da mão MOSTRA a citada mais perto (no erro da porta, ela fica atrás do jogador: o dado se vira para o lado dela)
        const near = glows.filter((g) => cited.includes(g.i)).sort((a, b) => a.at.distanceToSquared(p) - b.at.distanceToSquared(p))[0];
        if (near) ctx.dieLook(near.at, CITE_S - 1);
      }
      const dk = 1 - 0.92 * ctx.dark(); // (no escuro da Casa o pó e o brilho das travas apagam como o resto)
      // as travas: descem na junta quando as duas lajes chegam em cima, saem quando uma desce, chacoalham no tremor, voam quando a ponte cede
      const wk = weigh >= 0 ? 0.4 + 0.6 * Math.min(1, weigh / WEIGH_S) : 0;
      let lockSnd = false; // (várias travas assentando no mesmo quadro: um som só)
      keyList.forEach((k, n) => {
        const up = k.a.y > -0.03 && k.b.y > -0.03 && !collapsing;
        const top = Math.max(k.a.y, k.b.y);
        if (keySnap) k.st = up ? 'on' : 'off';
        else if (k.st === 'off' && up) {
          k.st = 'in';
          k.t = 0;
        } else if ((k.st === 'on' || k.st === 'in') && !up) {
          k.st = 'out';
          k.t = 0;
        }
        let y = top;
        let s = 1;
        let glint = 0;
        if (k.st !== 'fly') k.rx = k.rz = 0;
        if (k.st === 'off') s = 0;
        else if (k.st === 'in') {
          // assenta na junta, de cima, depressa (um "clac"; a 1ª vez que duas lajes se travam)
          k.t += dt;
          const u = Math.min(1, k.t / 0.22);
          y = top + 0.14 * (1 - u) * (1 - u);
          if (u >= 1) {
            k.st = 'on';
            if (!lockSnd) ctx.sfx('bridgeLock'); // (a trava assenta: a pedra encaixa e o grampo fecha)
            lockSnd = true;
          }
        } else if (k.st === 'out') {
          k.t += dt;
          const u = Math.min(1, k.t / 0.25);
          y = top + 0.1 * u;
          s = 1 - u;
          if (u >= 1) k.st = 'off';
        } else if (k.st === 'on' && wk > 0) {
          // o tremor: chacoalha na junta e range (um lampejo pálido de metal forçado, nunca a cor das brasas)
          y = top + Math.abs(Math.sin(t * 83 + n * 1.7)) * 0.012 * wk;
          k.rz = Math.sin(t * 71 + n) * 0.06 * wk;
          glint = Math.max(0, Math.sin(t * 29 + n * 2.3)) ** 4 * wk;
        }
        if (k.st === 'fly') {
          k.v.y -= 9.8 * dt;
          k.p.addScaledVector(k.v, dt);
          k.rx += k.spin * dt;
          k.rz += k.spin * 0.6 * dt;
          if (k.p.y < -D + 0.35) {
            k.st = 'off'; // (o tinido das travas no fundo já está no fim de 'bridgeBreak')
            s = 0;
          }
          keyE.set(k.rx, k.ry, k.rz);
        } else {
          const sh = k.st === 'on' && wk > 0;
          k.p.set(k.x + (sh ? Math.sin(t * 61 + n) * 0.02 : 0), y, k.z + (sh ? Math.cos(t * 53 + n) * 0.02 : 0));
          keyE.set(0, k.ry, k.rz);
        }
        keyQ.setFromEuler(keyE);
        keyS.setScalar(Math.max(0.0001, s));
        keyM.compose(k.p, keyQ, keyS);
        keyMesh.setMatrixAt(n, keyM);
        keyCol.setScalar(1 + 0.45 * glint);
        keyMesh.setColorAt(n, keyCol);
      });
      keySnap = false;
      keyMesh.instanceMatrix.needsUpdate = true;
      if (keyMesh.instanceColor) keyMesh.instanceColor.needsUpdate = true;
      // o pó: no tremor, sobe das juntas travadas e escorre da beirada da borda da porta para o fosso
      if (wk > 0 && !still) {
        const on = keyList.filter((k) => k.st === 'on');
        for (let q = 0; q < 3; q++) {
          const k = on[Math.floor(Math.random() * on.length)];
          if (k) puff(k.p.x, 0.02, k.p.z, 0.8, 0.5);
        }
        if (Math.random() < 0.6) puff(X0 + Math.random() * (X1 - X0), 0, gz0 + 0.05, 0.1, -0.4);
      }
      for (let q = 0; q < DN; q++) {
        if (dl[q] <= 0) continue;
        dl[q] -= dt;
        if (dl[q] <= 0) {
          dp[q * 3 + 1] = -50;
          continue;
        }
        const drag = Math.max(0, 1 - dt * 1.6);
        dv[q * 3] *= drag;
        dv[q * 3 + 2] *= drag;
        dv[q * 3 + 1] -= 1.6 * dt;
        dp[q * 3] += dv[q * 3] * dt;
        dp[q * 3 + 1] += dv[q * 3 + 1] * dt;
        dp[q * 3 + 2] += dv[q * 3 + 2] * dt;
      }
      dustGeo.attributes.position.needsUpdate = true;
      dustMat.opacity = 0.85 * dk;
      // a parede em volta da frase citada: acende depressa quando a Casa aponta e apaga devagar (firme: uma luz que pulsasse entraria e
      // sairia da vaga do motor e piscaria; quem pulsa é a luz que corre pela frase)
      for (const g of glows) {
        if (g.t > 0 && !still) g.t = Math.max(0, g.t - dt);
        g.k += ((g.t > 0 ? 1 : 0) - g.k) * Math.min(1, dt * (g.t > 0 ? 5 : 1.4));
        g.em.intensity = g.k < 0.02 ? 0 : g.k * 46;
      }
    },
    // a porta recusou o conjunto: se havia mentira acesa, a Casa também cita a verdade negada (no escuro e, quando a luz volta, de novo)
    judgeFail(lit) {
      const lies = cells.filter((c) => !c.demo && !c.good && lit[c.i]).map((c) => c.i);
      if (!lies.length) return;
      cited = citeFor(lies);
      citeNow(cited, 20);
      citeBack = 1;
    },
    // o chão: as bordas no nível da sala; no fosso, o tampo da laje daquele ponto (afundada = o fundo)
    floorY(x, z) {
      const c = cellAt(x, z);
      return c ? c.y : 0;
    },
    dieFloor(_x, z) {
      return z <= gz1 && z >= gz0 ? -D : 0; // (as lajes são caixas: o dado bate nelas e pousa em cima)
    },
    clampDie(p, v, e, R) {
      if (p.y > -0.02) return;
      // dentro do fosso: as paredes da borda da entrada e da borda da porta
      if (p.z > gz1 - R) {
        p.z = gz1 - R;
        if (v.z > 0) v.z = -v.z * e;
      } else if (p.z < gz0 + R) {
        p.z = gz0 + R;
        if (v.z < 0) v.z = -v.z * e;
      }
    },
    // quem está no fundo não sobe para as bordas nem para uma laje alta (sobe-se só por cima)
    rects() {
      const r: Rect[] = [
        [X0, gz1, X1, Z0 + 21.5, 0],
        [X0, Z0 - 0.5, X1, gz0, 0],
      ];
      for (const c of cells) if (c.y > SUNK + 0.2) r.push([c.x0, c.z0, c.x1, c.z1, c.y]);
      // enquanto a Casa pesa (e até ele cair), a ponte SEGURA quem está nela: a borda da porta não o recebe. Sem isto, quem andava pela última
      // fileira chegava à borda antes de a ponte ceder (3 m em 0,7 s; a abertura não derrubava ninguém) e, da borda, pôr um pé na fileira e
      // voltar dizia de graça se havia mentira acesa: o oráculo de pisar, de novo
      if (weigh >= 0 || collapsing) r.push([X0, Z0 - 0.5, X1, gz0, 99]);
      return r;
    },
    reset() {
      falling = false;
      weigh = -1;
      collapsing = false;
      cited = [];
      citeBack = 0;
      for (const g of glows) g.t = g.k = g.em.intensity = 0;
      dl.fill(0);
      for (let q = 0; q < DN; q++) dp[q * 3 + 1] = -50;
      opening(); // (recomeçar a sala: de novo a ponte de quem veio antes)
    },
    // salvamento: a sala volta resolvida (o construtor reacende as frases certas e a da porta; as lajes delas sobem já em cima)
    skip() {
      for (const c of cells) {
        c.y = c.demo || c.good ? 0 : SUNK;
        c.box.max.y = c.y;
        c.mesh.position.y = c.y - D / 2;
        shade(c);
      }
      keySnap = true;
    },
  };
}

export const FIRE_PONTE_FRASES: FireSpec = {
  name: 'A Ponte de Frases',
  subtitle: 'O que é verdade aguenta.',
  hx: PF.hx,
  z0: PF.z0,
  h: PF.h,
  braziers: [],
  rule: { kind: 'custom', lamps: 1 },
  lock: { judge: 'door', penalty: 8, judged: ['A Casa leu', 'A porta acordou.'] },
  words: ['acender', 'verdade', 'conf'],
  tablets: FPF_TABLETS,
  floorGap: { x0: -PF.hx, x1: PF.hx, dz0: PF.back, dz1: PF.front, depth: PF.depth },
  torches: 'few',
  extra: ponteFrasesExtra,
  fog: { color: '#0a0a11', near: 5, far: 28 },
  ambient: { color: 0x7a78b8, intensity: 1.9 },
};
