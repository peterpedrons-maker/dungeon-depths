// SALA 14 · A PONTE DE FRASES (nível 6; DESIGN.md §93; verificador tools/verify_ponte_frases.mjs). No lugar de O Boato Verdadeiro (FIRE_VERDADE,
// que foi para a reserva), com as mesmas oito frases e a mesma porta, «ACENDER VERDADE CONFIRMADO». Ensina VERDADE com o lema «dizer é fazer».
// O meio da sala é um FOSSO. Cada frase da parede tem uma LAJE no fosso, logo embaixo dela; acender a frase faz a laje subir até o chão e virar
// um degrau. As frases verdadeiras (inclusive os boatos verdadeiros) aguentam o peso; a laje de uma frase FALSA sobe igual, mas racha e cai
// quando alguém pisa nela: o jogador cai no fosso, a Casa apaga a luz, apaga as frases e ele volta à entrada. A Casa só JULGA quando o jogador
// acende a frase da porta: o conjunto aceso tem de ser exatamente o das verdadeiras. A primeira fileira é a demonstração (já acesa): um boato
// aceso porque diz o mesmo que uma confirmada.
// Confirmadas: 1 antes 2, 1 depois 3, 4 depois 2 → 3, 1, 2, 4. Boatos: «2 DEPOIS 1» verdade (demonstração), «4 ANTES 1» falso, «3 ANTES 4»
// verdade, «2 DEPOIS 3» verdade, «3 DEPOIS 1» falso.
// Solução: acender as duas confirmadas (1 DEPOIS 3, 4 DEPOIS 2) e os dois boatos verdadeiros (3 ANTES 4, 2 DEPOIS 3); NÃO acender «4 ANTES 1» nem
// «3 DEPOIS 1»; depois acender a frase da porta. O caminho firme vai em zigue-zague: esquerda, esquerda, esquerda, direita, direita.
import * as THREE from 'three';
import type { FireExtra, FireExtraApi, FireSpec, FireTablet } from './fire';
import { lambert, worldBoxUV } from '../kit';
import type { Box, Rect } from '../types';

const mkBox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box => ({
  min: new THREE.Vector3(x0, y0, z0),
  max: new THREE.Vector3(x1, y1, z1),
});

// o fosso: da borda da entrada (17,5 m do fundo) à borda da porta (2,5 m do fundo), a sala inteira de largura; quatro fileiras de duas lajes
const PF = { hx: 5.6, z0: -19, h: 3.8, front: 17.5, back: 2.5, depth: 2.6, rows: 4 };
const ROW_L = (PF.front - PF.back) / PF.rows;
const rowDz = (r: number) => PF.front - ROW_L * (r + 0.5);
// [coluna (E = esquerda, D = direita), fileira (0 = junto da entrada), frase, demonstração, verdadeira]: a ordem do verificador (SLABS)
const FPF_SLABS: ['E' | 'D', number, string[], boolean, boolean][] = [
  ['E', 0, ['n1', 'antes', 'n2', 'conf'], true, true],
  ['D', 0, ['n2', 'depois', 'n1', 'boato'], true, true],
  ['E', 1, ['n1', 'depois', 'n3', 'conf'], false, true],
  ['D', 1, ['n4', 'antes', 'n1', 'boato'], false, false],
  ['E', 2, ['n3', 'antes', 'n4', 'boato'], false, true],
  ['D', 2, ['n2', 'depois', 'n3', 'boato'], false, true],
  ['E', 3, ['n3', 'depois', 'n1', 'boato'], false, false],
  ['D', 3, ['n4', 'depois', 'n2', 'conf'], false, true],
];
// uma frase por tablete (cada uma em cima da sua laje)
const FPF_TABLETS: FireTablet[] = FPF_SLABS.map(([col, row, words, demo, good]) => ({
  lines: [{ words, preLit: demo || undefined, good: (!demo && good) || undefined, worn: words[3] === 'boato' || undefined }],
  wall: col === 'E' ? 'left' : 'right',
  dz: rowDz(row),
  size: 0.4,
  lit: true,
}));

// a quina das lajes (um aro claro com a sombra do chanfro por dentro; o meio é vazado), em pixels grossos: 5,5 × 3,7 m em 88 × 60
let rimTex: THREE.CanvasTexture | null = null;
function slabRimTexture() {
  if (rimTex) return rimTex;
  const W = 88;
  const H = 60;
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
  for (const [x, y] of [[9, 0], [30, 1], [61, 0], [0, 17], [87, 40], [44, 59], [72, 58], [1, 46]] as [number, number][]) {
    g.fillStyle = '#6e645a';
    g.fillRect(x, y, 2, 1);
  }
  rimTex = new THREE.CanvasTexture(c);
  rimTex.magFilter = rimTex.minFilter = THREE.NearestFilter;
  rimTex.colorSpace = THREE.SRGBColorSpace;
  return rimTex;
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
    return { i, col, row, x0, x1, z0, z1, demo, good, y: demo ? 0 : SUNK, mesh, box, crack: -1, fallen: false, upSnd: false, side, topMat, rimMat };
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
  // luz: três lampiões de ferro pendurados no meio da sala, sobre a costura das duas colunas (longe das frases das paredes)
  const iron = lambert(null, 0x26242a);
  const lamps: THREE.Sprite[] = [];
  for (let k = 1; k < PF.rows; k++) {
    const z = gz1 - ROW_L * k;
    // (cenógrafo: com a abóbada, DESIGN.md §96, a corrente sobe até a casca, que no meio fica `VR` acima do teto de antes)
    const VR = Math.max(0.9, Math.min(1.9, PF.hx * 0.28));
    kit.box(0.03, 0.7 + VR, 0.03, iron, 0, PF.h - 0.35 + VR / 2, z, false);
    kit.box(0.3, 0.06, 0.3, iron, 0, PF.h - 0.72, z, false);
    kit.box(0.24, 0.05, 0.24, iron, 0, PF.h - 1.08, z, false);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) kit.box(0.025, 0.36, 0.025, iron, sx * 0.12, PF.h - 0.9, z + sz * 0.12, false);
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
    f.scale.set(0.26, 0.3, 1);
    f.position.set(0, PF.h - 0.92, z);
    kit.group.add(f);
    lamps.push(f);
    kit.light(0, PF.h - 0.95, z, 0xffa860, 30).shadow = true;
  }
  // (no fundo do fosso, as brasas velhas nas frestas são o chão do buraco, no construtor: fire.ts, `floorGap`; sem luz própria, o fundo fica
  // escuro e a profundidade se lê pela luz que some)

  let falling = false; // caiu no fosso: o escuro vem e ele volta à entrada
  let lied = false; // ...porque uma laje falsa cedeu
  if (import.meta.env.DEV) {
    (globalThis as Record<string, unknown>).__ponteFrases = () => ({
      cells: cells.map((c) => ({ c: `${c.col}${c.row}`, y: +c.y.toFixed(2), good: c.good, fallen: c.fallen })),
      lines: api.lines().map((l) => l.lit),
      risen: api.lockRisen(),
      solved: api.solved(),
      falling,
    });
  }
  return {
    update(dt, t) {
      for (const [k, f] of lamps.entries()) f.material.map = kit.frame(t * 8 + k * 3);
      if (api.lockRisen() && !api.solved()) api.markSolved();
      const L = api.lines();
      // as lajes: sobem quando a frase acende, descem quando ela apaga; a falsa que cedeu cai rápido
      for (const c of cells) {
        const want = c.demo || (L[c.i]?.lit && !c.fallen) ? 0 : SUNK;
        if (want > c.y) {
          if (!c.upSnd) {
            ctx.sfx('rise');
            c.upSnd = true;
          }
          c.y = Math.min(want, c.y + dt * 1.7);
        } else if (want < c.y) {
          c.upSnd = false;
          c.y = Math.max(want, c.y - dt * (c.fallen ? 6 : 2.4));
        }
        let jx = 0;
        let jz = 0;
        if (c.crack >= 0) {
          // rachando: treme meio segundo e cede
          c.crack += dt;
          jx = Math.sin(t * 61) * 0.025;
          jz = Math.cos(t * 53) * 0.025;
          if (c.crack > 0.5) {
            c.crack = -1;
            c.fallen = true;
            lied = true;
          }
        }
        c.mesh.position.set((c.x0 + c.x1) / 2 + jx, c.y - D / 2, (c.z0 + c.z1) / 2 + jz);
        c.box.max.y = c.y;
        shade(c);
      }
      // quem pisa numa laje de frase falsa: ela racha (pisou mais de um instante)
      const p = ctx.player.pos;
      const feet = ctx.feetY();
      const under = cellAt(p.x, p.z);
      if (under && !under.good && !under.fallen && under.crack < 0 && under.y > -0.05 && Math.abs(feet - under.y) < 0.2) {
        under.crack = 0;
        ctx.sfx('altarCrack');
      }
      // caiu no fosso: a Casa apaga a luz; no escuro, apaga as frases (se foi a mentira que cedeu) e devolve o jogador à entrada
      if (!falling && feet < -1) {
        falling = true;
        ctx.blackout(2.5, () => {
          if (lied) api.failLines(4);
          for (const c of cells) {
            c.fallen = false;
            c.crack = -1;
          }
          lied = false;
          ctx.toEntrance();
          falling = false;
        });
      }
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
      return r;
    },
    reset() {
      falling = false;
      lied = false;
      for (const c of cells) {
        c.fallen = false;
        c.crack = -1;
        c.y = c.demo ? 0 : SUNK;
        c.box.max.y = c.y;
        shade(c);
      }
    },
    // salvamento: a sala volta resolvida (o construtor reacende as frases certas e a da porta; as lajes delas sobem já em cima)
    skip() {
      for (const c of cells) {
        c.y = c.demo || c.good ? 0 : SUNK;
        c.box.max.y = c.y;
        c.mesh.position.y = c.y - D / 2;
        shade(c);
      }
    },
  };
}

export const FIRE_PONTE_FRASES: FireSpec = {
  name: 'A Ponte de Frases',
  subtitle: 'O que é verdade aguenta.',
  hx: PF.hx,
  z0: PF.z0,
  h: PF.h,
  vault: true, // (cenógrafo, DESIGN.md §96)
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
