// Capítulo 1, segunda metade (PUZZLES_PROPOSTAS.md §2, §4 fichas 4 a 10, §5): as salas 12 a 17 do plano, montadas sobre o construtor fire.ts.
// Cada uma tem verificador em tools/ e a solução em PUZZLES.md. (A numeração das salas no jogo é automática e conta os respiros.)

import * as THREE from 'three';
import type { FireExtra, FireExtraApi, FireSpec } from './fire';
import { glyphPattern, makeTorch, makeWallBoard, type Torch, type WallBoard } from '../firegrid';
import { constellation } from './chapter1';
import { lambert } from '../kit';
import { makeCal, type CalText } from '../cal';
import { shotGate, slopedWall, wedge } from './shell';
import type { Box, Rect } from '../types';

const mkBox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box => ({
  min: new THREE.Vector3(x0, y0, z0),
  max: new THREE.Vector3(x1, y1, z1),
});
const NUMS = ['n1', 'n2', 'n3', 'n4', 'n5'];
// o número que estas casas escrevem (1 a 5), ou 0
const numberOf = (cells: number[]) => {
  const k = [...cells].sort((a, b) => a - b).join();
  const i = NUMS.findIndex((n) => glyphPattern(n).p.join() === k);
  return i + 1;
};
const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// SALA 12 · A SOMBRA (nível 7; tools/verify_sombra.mjs; Ficha 4)
// No meio do salão, uma TELA DE PEDRA com nove "olhos" (só o de cima à esquerda e o do centro são furos). Na parede do fundo, sobre a porta,
// «ACENDER ▢ BRASEIRO», e a casa ▢ é uma MOLDURA 3×3 de pedra clara: a luz de cada braseiro passa pelos furos e cai em casas fixas da moldura.
// Quando a moldura mostra um NÚMERO e o número de braseiros acesos BATE, a frase é verdade e a porta abre; se mostra um número e não bate, a
// frase mentiria: depois de 3 s a Casa pune (escuro) e os braseiros ficam frios 6 s. Outro desenho: nada.
// Solução: F + AE + BD (F e AE já fazem a diagonal TRÊS com dois braseiros; o BD só reacende a casa 0, mas faz serem três).
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const SOMBRA_SPOTS = [
  [0, 4], // F: na frente da tela, meia altura
  [0], // BD: baixo, à direita
  [4, 8], // AE: alto, à esquerda (pedestal alto)
  [1], // BC: baixo, no centro
  [2], // BE: baixo, à esquerda
];
const SCREEN_DZ = 6.5; // a tela de pedra (distância do fundo)
function sombraExtra(api: FireExtraApi): FireExtra {
  const { kit, ctx, X0, X1, Z0, H, boxes, braziers } = api;
  // ── a frase do fundo, alta, sobre a porta: ACENDER [moldura] BRASEIRO ──
  const FY = 4.1;
  const acender = kit.inscribe({ words: ['acender'], x: -3.45, y: FY, z: Z0 + 0.025, nx: 0, nz: 1, size: 0.95, age: 0.25, seed: 121, lead: true });
  const brasa = kit.inscribe({ words: ['brasa'], x: 3.25, y: FY, z: Z0 + 0.025, nx: 0, nz: 1, size: 0.95, age: 0.25, seed: 123 });
  // a moldura 3×3: laje de pedra clara com nove casas rebaixadas
  const MS = 2.3;
  const CS = MS * 0.302; // distância entre casas
  const cellW = CS * 0.9;
  const cellAt = (i: number) => new THREE.Vector3(((i % 3) - 1) * CS, FY + (1 - Math.floor(i / 3)) * CS, Z0 + 0.075);
  kit.box(MS + 0.16, MS + 0.16, 0.08, kit.slab, 0, FY, Z0 + 0.04, false);
  const frameTex = canvasTex(96, 96, (g) => {
    g.fillStyle = '#cfc6b4';
    g.fillRect(0, 0, 96, 96);
    g.fillStyle = '#3a3430';
    g.fillRect(0, 0, 96, 4);
    g.fillRect(0, 92, 96, 4);
    g.fillRect(0, 0, 4, 96);
    g.fillRect(92, 0, 4, 96);
    for (let i = 0; i < 9; i++) {
      const cx = 8 + (i % 3) * 29;
      const cy = 8 + Math.floor(i / 3) * 29;
      g.fillStyle = '#8a8274';
      g.fillRect(cx, cy, 22, 22);
      g.fillStyle = '#b8b0a0';
      g.fillRect(cx + 2, cy + 2, 18, 18);
    }
  });
  const frameMesh = new THREE.Mesh(new THREE.PlaneGeometry(MS, MS), new THREE.MeshLambertMaterial({ map: frameTex }));
  frameMesh.position.set(0, FY, Z0 + 0.082);
  kit.group.add(frameMesh);
  // as manchas de luz (uma por casa): mancha quente, borda suave em pixels
  const spotTex = canvasTex(16, 16, (g) => {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const d = Math.hypot(x - 7.5, y - 7.5) / 8;
        if (d > 1) continue;
        g.fillStyle = d < 0.55 ? '#fff0c0' : d < 0.8 ? '#ffc870' : (x + y) % 2 ? '#ff9a40' : 'rgba(0,0,0,0)';
        g.fillRect(x, y, 1, 1);
      }
  });
  const spots = Array.from({ length: 9 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(cellW, cellW), new THREE.MeshBasicMaterial({ map: spotTex, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    m.position.copy(cellAt(i)).setZ(Z0 + 0.09);
    kit.group.add(m);
    return { m, k: 0 };
  });
  const spotLight = kit.light(0, FY, Z0 + 1.2, 0xffc070, 0);

  // ── a tela de pedra com nove olhos (dois furos de verdade: 0 e 4) ──
  const SZ = Z0 + SCREEN_DZ;
  const SW = 3.0;
  const SH = 2.2;
  const SB = 0.15; // base
  kit.box(SW + 0.4, SB, 0.7, kit.slab, 0, SB / 2, SZ);
  kit.box(SW, SH, 0.32, kit.stone, 0, SB + SH / 2, SZ);
  kit.box(SW + 0.2, 0.12, 0.42, kit.slab, 0, SB + SH + 0.06, SZ);
  const eyesTex = (front: boolean) =>
    canvasTex(96, 72, (g) => {
      g.clearRect(0, 0, 96, 72);
      for (let i = 0; i < 9; i++) {
        const cx = 20 + (i % 3) * 28;
        const cy = 12 + Math.floor(i / 3) * 24;
        const real = i === 0 || i === 4;
        // a moldura do olho (anel talhado) e o fundo: furo = preto fundo; cego = cavidade rasa, cinza
        g.fillStyle = '#2a2430';
        g.beginPath();
        g.ellipse(cx, cy, 10, 8, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = real ? '#000000' : '#4a4450';
        g.beginPath();
        g.ellipse(cx, cy, 7, 5, 0, 0, Math.PI * 2);
        g.fill();
        if (!real) {
          g.fillStyle = '#5c5662';
          g.fillRect(cx - 4, cy - 3, 3, 2);
        }
        void front;
      }
    });
  const eyesMat = new THREE.MeshLambertMaterial({ map: eyesTex(true), transparent: true, alphaTest: 0.05, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -3 });
  for (const side of [1, -1]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(SW - 0.4, (SW - 0.4) * 0.75), eyesMat);
    m.position.set(0, SB + SH / 2 + 0.1, SZ + side * 0.165);
    m.rotation.y = side > 0 ? 0 : Math.PI;
    kit.group.add(m);
  }
  // o brilho dos dois furos quando há luz atravessando
  const holeGlow = [0, 4].map((i) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.11, 10), new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    const u = ((i % 3) - 1) * 0.73;
    const v = SB + SH / 2 + 0.1 + (1 - Math.floor(i / 3)) * 0.58;
    m.position.set(-u, v, SZ - 0.17); // visto de trás (do lado da moldura), a casa 0 fica à direita
    m.rotation.y = Math.PI;
    kit.group.add(m);
    return m;
  });
  kit.contact(0, SZ, 3.6, 1.1);
  boxes.push(mkBox(-SW / 2 - 0.2, 0, SZ - 0.35, SW / 2 + 0.2, SB + SH + 0.12, SZ + 0.35));
  const rects: Rect[] = [[-SW / 2 - 0.2, SZ - 0.35, SW / 2 + 0.2, SZ + 0.35]];
  // o pedestal alto do AE (o braseiro fica em cima dele)
  const ae = braziers[2];
  kit.box(0.8, 1.8, 0.8, kit.stone, ae.x, 0.9, ae.z);
  kit.box(0.95, 0.12, 0.95, kit.slab, ae.x, 1.76, ae.z);
  boxes.push(mkBox(ae.x - 0.4, 0, ae.z - 0.4, ae.x + 0.4, 1.8, ae.z + 0.4));
  rects.push([ae.x - 0.45, ae.z - 0.45, ae.x + 0.45, ae.z + 0.45]);
  const f = braziers[0];
  kit.box(0.8, 0.7, 0.8, kit.stone, f.x, 0.35, f.z);
  boxes.push(mkBox(f.x - 0.4, 0, f.z - 0.4, f.x + 0.4, 0.7, f.z + 0.4));
  // luz baixa e fria para o salão; as frases ficam na sombra até a luz escrever
  kit.torch(X0 + 0.1, 2.0, Z0 + 11, 1, 0, 0.4, 0x9ab0e0, 20);
  kit.torch(X1 - 0.1, 2.0, Z0 + 11, -1, 0, 1.4, 0x9ab0e0, 20);
  // a frase do fundo pega um pouco de luz fria de baixo (para dar para ler a moldura apagada)
  kit.light(0, 2.4, Z0 + 2.2, 0x8a9ac8, 6);
  void H;

  let mismatch = 0;
  let readK = 0;
  const gate = shotGate(ctx.die);
  return {
    update(dt, t) {
      gate.tick();
      if (!api.solved() && api.cold() <= 0) for (const b of braziers) if (b.touched()) b.light(true);
      // as casas que a luz acende
      const on = new Set<number>();
      braziers.forEach((b, i) => {
        if (b.lit) for (const c of SOMBRA_SPOTS[i]) on.add(c);
      });
      spots.forEach((s, i) => {
        s.k += ((on.has(i) ? 1 : 0) - s.k) * Math.min(1, dt * 5);
        s.m.material.opacity = s.k * (0.88 + 0.12 * Math.sin(t * 9 + i));
      });
      spotLight.intensity = on.size ? 4 + on.size * 1.5 : 0;
      const anyLit = braziers.some((b) => b.lit);
      holeGlow.forEach((m) => (m.material.opacity += ((anyLit ? 0.85 : 0) - m.material.opacity) * Math.min(1, dt * 5)));
      // o julgamento: a moldura mostra um número?
      if (!api.solved() && api.cold() <= 0) {
        const n = numberOf([...on]);
        const nLit = braziers.filter((b) => b.lit).length;
        if (n > 0 && n === nLit) {
          api.markSolved();
          ctx.sfx('door');
          mismatch = 0;
        } else if (n > 0) {
          mismatch += ctx.paused() ? 0 : dt;
          if (mismatch > 3) {
            mismatch = 0;
            api.punish(6);
            ctx.caption('A frase mentia', '', '#cfc6e8');
          }
        } else mismatch = 0;
      }
      // a Casa lê: as palavras acendem quando a frase é verdade
      readK += ((api.solved() ? 1 : 0) - readK) * Math.min(1, dt * 3);
      for (const p of [...acender.panels, ...brasa.panels]) p.fire = readK;
    },
    reset() {
      mismatch = 0;
      readK = 0;
      spots.forEach((s) => {
        s.k = 0;
        s.m.material.opacity = 0;
      });
    },
    rects: () => rects,
  };
}
export const FIRE_SOMBRA: FireSpec = {
  name: 'A Sombra',
  subtitle: 'Uma tela de pedra.',
  hx: 7,
  z0: -14,
  h: 6,
  braziers: [
    { x: 0, dz: SCREEN_DZ + 1.7, y: 0.7 }, // F
    { x: 2.9, dz: 9.6 }, // BD
    { x: -2.7, dz: 10.6, y: 1.8 }, // AE
    { x: 1.4, dz: 11.6 }, // BC
    { x: -4.9, dz: 8.9 }, // BE
  ],
  rule: { kind: 'custom' },
  words: [], // a frase é da sala (com a moldura no lugar do número)
  torches: 'few',
  fog: { color: '#07070d', near: 6, far: 26 },
  ambient: { color: 0x5a5a8a, intensity: 1.05 },
  extra: sombraExtra,
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// SALA 13 · O ESCURO (nível 7; tools/verify_escuro.mjs; Ficha 5)
// Sala baixa e opressiva. Quatro braseiros já acesos nos cantos (só luz). Na parede esquerda, junto da porta: «ACENDER ▢ ▢ ▢ ORDEM», três lousas.
// Não há pista à vista. A Casa julga quando as três lousas mostram um número completo: certo abre; errado é o ESCURO de 4 s, e no escuro aparecem,
// no TETO, em cal, três frases (e ESCURO ao lado da porta). Errar de propósito é a ferramenta. Resposta: DOIS, CINCO, UM.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
function escuroExtra(api: FireExtraApi): FireExtra {
  const { kit, ctx, X0, Z0, H, braziers } = api;
  const W = X0 + 0.02;
  const BY = 1.45;
  kit.inscribe({ words: ['acender'], x: X0 + 0.025, y: BY, z: Z0 + 8.35, nx: 1, nz: 0, size: 0.42, age: 0.22, seed: 131, lead: true });
  const boards: WallBoard[] = [6.95, 5.6, 4.25].map((dz, k) => makeWallBoard(kit, ctx, { x: W, y: BY, z: Z0 + dz, nx: 1, nz: 0, step: 0.3, key: `escuro${k}` }));
  const ordem = kit.inscribe({ words: ['ordem'], x: X0 + 0.025, y: BY, z: Z0 + 3.0, nx: 1, nz: 0, size: 0.42, age: 0.22, seed: 133 });
  kit.torch(X0 + 0.1, 2.35, Z0 + 5.6, 1, 0, 0.6, 0xffa050, 26);
  // o teto: as três frases em cal, espalhadas (de um lugar só não se lê tudo) e ESCURO ao lado da porta
  const cals: CalText[] = [
    makeCal(kit, ctx, { words: ['n5', 'antes', 'n1', 'conf'], x: 0.4, y: H - 0.02, z: Z0 + 1.7, ceil: true, size: 0.3, seed: 141 }),
    makeCal(kit, ctx, { words: ['n1', 'antes', 'n2', 'boato'], x: -0.6, y: H - 0.02, z: Z0 + 4.7, ceil: true, size: 0.3, seed: 143 }),
    makeCal(kit, ctx, { words: ['n2', 'antes', 'n5', 'conf'], x: 0.7, y: H - 0.02, z: Z0 + 7.8, ceil: true, size: 0.3, seed: 145 }),
    makeCal(kit, ctx, { words: ['escuro'], x: 2.2, y: 1.9, z: Z0 + 0.03, nx: 0, nz: 1, size: 0.4, seed: 147 }),
  ];
  const WANT = [2, 5, 1];
  let settle = 0;
  let lastSig = '';
  const idle = [0, 0, 0];
  let dark = 0; // segundos do escuro em curso (as lousas não aceitam fogo)
  let darkWas = false;
  const gate = shotGate(ctx.die);
  return {
    update(dt, t) {
      gate.tick();
      for (const b of boards) b.update(dt, t);
      for (const c of cals) c.update();
      // os braseiros dos cantos se apagam no escuro (só a cal brilha) e voltam com a luz
      const isDark = ctx.dark() > 0.3;
      if (isDark !== darkWas) {
        darkWas = isDark;
        braziers.forEach((b) => b.light(!isDark, true));
      }
      if (api.solved()) return;
      dark = Math.max(0, dark - (ctx.paused() ? 0 : dt));
      if (dark <= 0) {
        boards.forEach((b, k) => {
          const i = b.hit();
          if (i >= 0 && !b.grid.lit[i] && gate.take()) {
            b.grid.ignite(i);
            ctx.sfx('ignite', `escuro${k}`);
            idle[k] = 0;
          }
        });
      }
      const nums = boards.map((b) => numberOf(b.grid.points()));
      const sig = boards.map((b) => b.grid.points().join('.')).join('|');
      if (sig !== lastSig) {
        lastSig = sig;
        settle = 0;
      } else settle += ctx.paused() ? 0 : dt;
      // uma lousa com pontos que não formam número, parada por muito tempo, se apaga sozinha
      boards.forEach((b, k) => {
        if (b.grid.points().length && !nums[k]) {
          idle[k] += ctx.paused() ? 0 : dt;
          if (idle[k] > 7) {
            b.grid.clear();
            ctx.sfx('burnout');
            idle[k] = 0;
          }
        } else idle[k] = 0;
      });
      // as três mostram um número completo (e ficaram assim um instante): a Casa julga
      if (nums.every((n) => n > 0) && settle > 3) {
        if (nums.every((n, k) => n === WANT[k])) {
          api.markSolved();
          ctx.sfx('door');
        } else {
          boards.forEach((b) => b.grid.clear());
          ctx.sfx('error');
          ctx.blackout(4);
          dark = 4.6;
          settle = 0;
        }
      }
      // a Casa vai ler: ORDEM pulsa enquanto as três lousas mostram números
      for (const p of ordem.panels) p.fire = nums.every((n) => n > 0) ? 0.45 + 0.45 * Math.sin(t * 8) : 0;
    },
    reset() {
      boards.forEach((b) => b.grid.clear());
      settle = 0;
      dark = 0;
      lastSig = '';
    },
  };
}
export const FIRE_ESCURO: FireSpec = {
  name: 'O Escuro',
  subtitle: 'Nada para ler.',
  hx: 3.4,
  z0: -9,
  h: 3.0,
  blackout: 4,
  braziers: [
    { x: -2.6, dz: 0.9, lit: true, scale: 0.7 },
    { x: 2.6, dz: 0.9, lit: true, scale: 0.7 },
    { x: -2.6, dz: 10.1, lit: true, scale: 0.7 },
    { x: 2.6, dz: 10.1, lit: true, scale: 0.7 },
  ],
  rule: { kind: 'custom' },
  words: [],
  torches: 'few',
  fog: { color: '#08070c', near: 3, far: 14 },
  ambient: { color: 0x6a6496, intensity: 1.2 },
  extra: escuroExtra,
};
void lambert;

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// SALA 14 · A LEI PEQUENA (nível 8; tools/verify_lei.mjs; Ficha 6)
// A sala SOBE. Térreo: as duas confirmadas (na frente do mezanino: de cima não se veem) e o mural da balança («DOIS IGUAL DOIS»). Uma rampa
// larga junto à parede direita, com os três boatos gastos na parede. No mezanino: os quatro braseiros, a lei «UM BOATO IGUAL VERDADE» e a porta.
// «DOIS ANTES UM» e «UM DEPOIS DOIS» dizem a mesma coisa: não podem ser os dois verdade (a lei diz um só) → são mentira; o verdadeiro é
// «DOIS DEPOIS QUATRO». Ordem: UM, QUATRO, DOIS, TRÊS.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const LEI = { hx: 6, z0: -15, h: 7.5, level: 3.0, mze: -9.5, rx0: 3.7, rLow: 0 };
const leiRampY = (z: number) => LEI.level * Math.min(1, Math.max(0, (LEI.rLow - z) / (LEI.rLow - LEI.mze)));
const leiFloor = (x: number, z: number) => (z < LEI.mze ? LEI.level : x > LEI.rx0 && z <= LEI.rLow ? leiRampY(z) : 0);
function balanceTexture() {
  return canvasTex(160, 112, (g) => {
    g.clearRect(0, 0, 160, 112);
    const line = (pts: [number, number][], w = 3) => {
      for (const [col, lw, d] of [['#15110f', w + 2, 1], ['#e9e1cc', w, 0]] as [string, number, number][]) {
        g.strokeStyle = col;
        g.lineWidth = lw;
        g.beginPath();
        pts.forEach(([x, y], i) => (i ? g.lineTo(x + d, y + d) : g.moveTo(x + d, y + d)));
        g.stroke();
      }
    };
    line([[80, 18], [80, 98]]); // o poste
    line([[56, 98], [104, 98]]); // a base
    line([[22, 30], [138, 30]]); // o travessão (reto: equilíbrio)
    line([[30, 30], [22, 62]], 2);
    line([[30, 30], [38, 62]], 2);
    line([[130, 30], [122, 62]], 2);
    line([[130, 30], [138, 62]], 2);
    line([[14, 62], [46, 62]]); // os pratos
    line([[114, 62], [146, 62]]);
    // DOIS em cada prato (dois braseirinhos)
    for (const cx of [22, 38, 122, 138]) {
      g.fillStyle = '#15110f';
      g.fillRect(cx - 5, 50, 11, 11);
      g.fillStyle = '#e9e1cc';
      g.fillRect(cx - 4, 51, 9, 9);
      g.fillStyle = '#ff9a40';
      g.fillRect(cx - 2, 45, 5, 6);
    }
  });
}
function leiExtra(api: FireExtraApi): FireExtra {
  const { kit, X0, X1, Z0, H, boxes } = api;
  const { level: LV, mze: MZE, rx0: RX } = LEI;
  // o mezanino (bloco de alvenaria) com piso de pedra por cima
  const MZ = MZE - Z0;
  kit.box(X1 - X0, LV, MZ, kit.stone, 0, LV / 2, (Z0 + MZE) / 2);
  kit.plane(X1 - X0, MZ, kit.floorMat([(X1 - X0) / 2, MZ / 2]), 0, LV + 0.002, (Z0 + MZE) / 2, -Math.PI / 2);
  kit.box(X1 - X0, 0.12, 0.3, kit.slab, 0, LV - 0.06, MZE + 0.1, false); // a capa da borda
  boxes.push(mkBox(X0, 0, Z0, X1, LV, MZE));
  // o parapeito (deixa o vão da rampa)
  kit.box(RX - X0, 0.95, 0.24, kit.stone, (X0 + RX) / 2, LV + 0.475, MZE + 0.12);
  kit.box(RX - X0 + 0.06, 0.08, 0.32, kit.slab, (X0 + RX) / 2, LV + 0.99, MZE + 0.12, false);
  boxes.push(mkBox(X0, LV, MZE, RX, LV + 1.0, MZE + 0.24));
  // a rampa, colada na parede direita, com mureta do lado de dentro
  kit.add(wedge(RX, MZE, X1, LEI.rLow, (_x, z) => leiRampY(z), kit.stone, kit.slab));
  slopedWall(kit, { x0: RX - 0.16, z0: MZE, x1: RX, z1: LEI.rLow, top: (_x, z) => leiRampY(z) + 0.9, segs: 8 }).forEach((b) => boxes.push(b));
  kit.contact(0, MZE + 0.3, X1 - X0, 1.2);
  // térreo: as confirmadas, na FRENTE do mezanino (quem está em cima não as vê) e o mural da balança na parede esquerda
  kit.inscribe({ words: ['n4', 'depois', 'n1', 'conf'], x: -3.2, y: 1.7, z: MZE + 0.025, nx: 0, nz: 1, size: 0.34, age: 0.15, seed: 151, plaque: true });
  kit.inscribe({ words: ['n2', 'antes', 'n3', 'conf'], x: 0.9, y: 1.7, z: MZE + 0.025, nx: 0, nz: 1, size: 0.34, age: 0.15, seed: 153, plaque: true });
  const mural = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.12), new THREE.MeshLambertMaterial({ map: balanceTexture(), transparent: true, alphaTest: 0.05, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
  mural.position.set(X0 + 0.02, 2.45, -4.2);
  mural.rotation.y = Math.PI / 2;
  kit.group.add(mural);
  kit.inscribe({ words: ['n2', 'igual', 'n2', 'conf'], x: X0 + 0.025, y: 1.55, z: -4.2, nx: 1, nz: 0, size: 0.32, age: 0.15, seed: 155, plaque: true });
  // a rampa: os três boatos, gastos, na parede direita
  for (const [k, [z, words]] of ([
    [-1.6, ['n2', 'antes', 'n1', 'boato']],
    [-4.7, ['n1', 'depois', 'n2', 'boato']],
    [-7.8, ['n2', 'depois', 'n4', 'boato']],
  ] as [number, string[]][]).entries())
    kit.inscribe({ words, x: X1 - 0.025, y: leiRampY(z) + 1.75, z, nx: -1, nz: 0, size: 0.3, age: 0.6, seed: 157 + k * 2 });
  // o mezanino: a lei, à direita da porta
  kit.inscribe({ words: ['n1', 'boato', 'igual', 'verdade', 'conf'], x: 3.55, y: LV + 1.75, z: Z0 + 0.025, nx: 0, nz: 1, size: 0.3, age: 0.15, seed: 163, plaque: true });
  // luz: térreo, rampa e mezanino
  kit.torch(X0 + 0.1, 2.2, -1.6, 1, 0, 0.4);
  kit.torch(X0 + 0.1, 2.2, -7.0, 1, 0, 1.1);
  kit.torch(X1 - 0.1, leiRampY(-3.2) + 2.2, -3.2, -1, 0, 1.7);
  kit.torch(X1 - 0.1, leiRampY(-6.3) + 2.2, -6.3, -1, 0, 2.3);
  kit.torch(-4.6, LV + 1.8, Z0 + 0.1, 0, 1, 3.1);
  kit.torch(4.9, LV + 1.8, Z0 + 0.1, 0, 1, 3.7);
  kit.light(-1, 2.6, MZE + 2.2, 0xffb070, 10); // as frases do térreo
  void H;
  // colisão do jogador: o mezanino (para quem está embaixo), o parapeito e a mureta da rampa (em pedaços, subindo)
  const rects: Rect[] = [[X0, Z0, X1, MZE, LV], [X0, MZE - 0.02, RX, MZE + 0.26, LV + 1.0]];
  const N = 12;
  for (let k = 0; k < N; k++) {
    const za = MZE + ((LEI.rLow - MZE) * k) / N;
    const zb = MZE + ((LEI.rLow - MZE) * (k + 1)) / N;
    rects.push([RX - 0.18, za, RX + 0.02, zb, leiRampY(za) + 0.9]);
  }
  return {
    rects: () => rects,
    floorY: (x, z) => leiFloor(x, z),
    dieFloor: (x, z) => leiFloor(x, z),
  };
}
export const FIRE_LEI: FireSpec = {
  name: 'A Lei Pequena',
  subtitle: 'A sala sobe.',
  hx: LEI.hx,
  z0: LEI.z0,
  h: LEI.h,
  doorY: LEI.level,
  braziers: [
    { x: -4.2, dz: 2.4, mark: 'n1', y: LEI.level },
    { x: -2.0, dz: 4.3, mark: 'n2', y: LEI.level },
    { x: 2.2, dz: 4.4, mark: 'n3', y: LEI.level },
    { x: 4.4, dz: 2.2, mark: 'n4', y: LEI.level },
  ],
  rule: { kind: 'order', seq: [0, 3, 1, 2], hints: false, penalty: 10 }, // UM, QUATRO, DOIS, TRÊS
  words: ['acender', 'n4', 'brasa', 'ordem', 'conf'],
  torches: 'few',
  fog: { color: '#0a0a11', near: 6, far: 26 },
  ambient: { color: 0x7a78b8, intensity: 1.8 },
  extra: leiExtra,
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// SALA 15 · O FOGO QUE CORRE (nível 8; tools/verify_fogo_corre.mjs; Ficha 8)
// Salão aberto com nove plataformas em grade 3×3, em alturas diferentes, um braseiro em cada. Canaletas descem de uma plataforma a outra (a altura
// mostra o sentido) e cada uma leva um TEMPO (reta e curta 1 s; com uma volta 2 s; em zigue-zague 3 s). Cada braseiro queima SÓ 4 s e SÓ UMA VEZ por
// tentativa (o óleo acaba: o pote fica vazio). A porta («ACENDER DOIS BRASEIRO TEMPO» + QUATRO talhado) abre se, num instante, os acesos forem
// EXATAMENTE os quatro cantos. Quando tudo se apaga sem acertar: escuro e a Casa reabastece. Solução: fogo no centro; ~3 s depois, no canto da
// frente à esquerda (janela de 1,5 a 5,5 s).
// C5: tochas nos nove postes + 3 de parede; no escuro de uma tentativa que falhou, MENOS em cal no teto; acender os postes do meio (3, 4, 5).
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const FC = { hx: 9, z0: -18, h: 9, burn: 4 };
const FC_X = [-5, 0, 5];
const FC_DZ = [4.2, 9.2, 14.2]; // linha 0 = a do fundo (perto da porta)
const FC_HY = [0.25, 0.55, 0.25, 1.85, 1.0, 1.0, 1.85, 1.4, 0.25]; // altura de cada plataforma (o fogo só desce)
const FC_EDGES: [number, number, number][] = [[4, 2, 3], [4, 8, 2], [6, 4, 2], [5, 8, 1], [5, 1, 1], [6, 7, 3], [7, 4, 3], [3, 0, 2], [7, 8, 1], [3, 7, 3], [4, 0, 2], [1, 0, 1]];
const FC_TARGET = [0, 2, 6, 8];
const FC_PH = 1.2; // meia largura da plataforma
const fcCell = (i: number) => ({ x: FC_X[i % 3], dz: FC_DZ[Math.floor(i / 3)], y: FC_HY[i] });
function fogoCorreExtra(api: FireExtraApi): FireExtra {
  const { kit, ctx, X0, X1, Z0, H, boxes, braziers } = api;
  // ── as plataformas (blocos de alvenaria com tampo de pedra) ──
  const rects: Rect[] = [];
  for (let i = 0; i < 9; i++) {
    const c = fcCell(i);
    const z = Z0 + c.dz;
    kit.box(FC_PH * 2, c.y, FC_PH * 2, kit.stone, c.x, c.y / 2, z);
    kit.box(FC_PH * 2 + 0.1, 0.08, FC_PH * 2 + 0.1, kit.slab, c.x, c.y - 0.04, z, false);
    kit.contact(c.x, z, FC_PH * 2 + 0.6);
    boxes.push(mkBox(c.x - FC_PH, 0, z - FC_PH, c.x + FC_PH, c.y, z + FC_PH));
    rects.push([c.x - FC_PH, z - FC_PH, c.x + FC_PH, z + FC_PH, c.y]);
  }
  const platAt = (x: number, z: number) => {
    for (let i = 0; i < 9; i++) {
      const c = fcCell(i);
      if (Math.abs(x - c.x) < FC_PH && Math.abs(z - (Z0 + c.dz)) < FC_PH) return c.y;
    }
    return 0;
  };
  // ── as canaletas: um sulco de pedra que desce do tampo de uma plataforma ao da outra; o caminho mostra o tempo (reta, uma volta, zigue-zague) ──
  const grooveMat = lambert(null, 0x2a2228);
  const offMat = new THREE.MeshBasicMaterial({ color: 0x3a2a24, fog: true });
  interface Chan {
    a: number;
    b: number;
    d: number;
    pts: THREE.Vector3[];
    pieces: { m: THREE.Mesh; k: number }[];
    t: number; // -1 = parada; >= 0 = segundos desde que o fogo entrou
    front: THREE.Sprite;
  }
  const chans: Chan[] = FC_EDGES.map(([a, b, d]) => {
    const A = fcCell(a);
    const B = fcCell(b);
    const ax = A.x;
    const az = Z0 + A.dz;
    const bx = B.x;
    const bz = Z0 + B.dz;
    const dx = bx - ax;
    const dzz = bz - az;
    const len = Math.hypot(dx, dzz);
    const ux = dx / len;
    const uz = dzz / len;
    const px = -uz;
    const pz = ux;
    // sai da borda de A e chega à borda de B
    const s0 = FC_PH * (Math.abs(ux) > 0.5 && Math.abs(uz) > 0.5 ? 1.35 : 1) - 0.25;
    const sA = new THREE.Vector3(ax + ux * s0, A.y + 0.02, az + uz * s0);
    const sB = new THREE.Vector3(bx - ux * s0, B.y + 0.02, bz - uz * s0);
    const raw: [number, number][] = [[0, 0]];
    if (d === 2) raw.push([0.5, 0.7]);
    if (d === 3) raw.push([0.2, 0.75], [0.4, -0.75], [0.6, 0.75], [0.8, -0.75]);
    raw.push([1, 0]);
    const pts = raw.map(([u, w]) => new THREE.Vector3().lerpVectors(sA, sB, u).add(new THREE.Vector3(px * w, 0, pz * w)));
    // a altura segue o comprimento percorrido (o sulco desce pela lateral da plataforma de cima)
    const segL = pts.slice(1).map((p, k) => p.distanceTo(pts[k]));
    const total = segL.reduce((x, y) => x + y, 0);
    let acc = 0;
    pts.forEach((p, k) => {
      if (k) acc += segL[k - 1];
      p.y = A.y + (B.y - A.y) * (acc / total) + 0.03;
    });
    // em pedaços: cada pedaço acende quando a frente do fogo passa
    const pieces: { m: THREE.Mesh; k: number }[] = [];
    let run = 0;
    for (let k = 1; k < pts.length; k++) {
      const p0 = pts[k - 1];
      const p1 = pts[k];
      const n = Math.max(2, Math.round(p0.distanceTo(p1) / 0.35));
      for (let j = 0; j < n; j++) {
        const q0 = new THREE.Vector3().lerpVectors(p0, p1, j / n);
        const q1 = new THREE.Vector3().lerpVectors(p0, p1, (j + 1) / n);
        const mid = q0.clone().add(q1).multiplyScalar(0.5);
        const l = q0.distanceTo(q1);
        const g = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, l + 0.02), grooveMat);
        g.position.copy(mid).setY(mid.y - 0.02);
        g.lookAt(q1.x, mid.y - 0.02 + (q1.y - q0.y) / 2, q1.z);
        kit.group.add(g);
        const f = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, l + 0.02), offMat);
        f.position.copy(mid).setY(mid.y + 0.015);
        f.lookAt(q1.x, mid.y + 0.015 + (q1.y - q0.y) / 2, q1.z);
        kit.group.add(f);
        run += l;
        pieces.push({ m: f, k: run / total });
      }
    }
    const front = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
    front.scale.set(0.3, 0.26, 1);
    front.visible = false;
    kit.group.add(front);
    return { a, b, d, pts, pieces, t: -1, front };
  });
  const litMat = new THREE.MeshBasicMaterial({ color: 0xffa040, fog: false });
  const burntMat = new THREE.MeshBasicMaterial({ color: 0x6a3018, fog: true });
  const along = (ch: Chan, u: number) => {
    const segL = ch.pts.slice(1).map((p, k) => p.distanceTo(ch.pts[k]));
    const total = segL.reduce((x, y) => x + y, 0);
    let target = u * total;
    for (let k = 0; k < segL.length; k++) {
      if (target <= segL[k]) return new THREE.Vector3().lerpVectors(ch.pts[k], ch.pts[k + 1], target / segL[k]);
      target -= segL[k];
    }
    return ch.pts[ch.pts.length - 1].clone();
  };
  // ── a porta: QUATRO talhado à direita da porta ──
  kit.inscribe({ words: ['n4'], x: (FC.hx + 1.25) / 2, y: 2.2, z: Z0 + 0.025, nx: 0, nz: 1, size: 0.7, age: 0.15, seed: 171, frame: true });
  // ── C5: postes com tocha ao lado de cada braseiro, 3 tochas de parede, MENOS em cal no teto ──
  const torches: Torch[] = [];
  const cells: (number | null)[] = [];
  for (let i = 0; i < 9; i++) {
    const c = fcCell(i);
    const tx = c.x + 0.85;
    const tz = Z0 + c.dz + 0.85;
    kit.box(0.14, 1.4, 0.14, lambert(null, 0x4a3426), tx, c.y + 0.7, tz, false);
    torches.push(makeTorch(kit, ctx, tx, c.y + 1.3, tz, 0, 1, 40, true));
    cells.push(i);
  }
  torches.push(makeTorch(kit, ctx, X0 + 0.1, 2.4, Z0 + 6.7, 1, 0), makeTorch(kit, ctx, X1 - 0.1, 2.4, Z0 + 11.7, -1, 0), makeTorch(kit, ctx, X0 + 0.1, 2.4, Z0 + 16.5, 1, 0));
  cells.push(null, null, null);
  const C = constellation(api, torches, cells, [3, 4, 5], [2.5, Z0 + 11.7], [X1 - 0.02, 1.25, Z0 + 3.0, -1, 0]);
  const cal = makeCal(kit, ctx, { words: ['menos'], x: 0, y: H - 0.02, z: Z0 + 9.2, ceil: true, size: 1.6, seed: 173 });
  // luz alta e fria para o salão; os braseiros fazem o resto
  for (const [x, z] of [[X0 + 0.1, Z0 + 2.5], [X1 - 0.1, Z0 + 7.5], [X0 + 0.1, Z0 + 12], [X1 - 0.1, Z0 + 17]] as [number, number][]) kit.torch(x, 4.6, z, x < 0 ? 1 : -1, 0, x + z, 0xb8c4f0, 24);

  // ── a regra: queima 4 s, uma vez; o fogo corre; os quatro cantos sozinhos num instante ──
  const used = Array(9).fill(false);
  const left = Array(9).fill(0);
  let refill = -1;
  const ignite = (i: number, quiet = false) => {
    if (used[i] || braziers[i].lit) return;
    used[i] = true;
    left[i] = FC.burn;
    braziers[i].light(true, quiet); // (com som: o próprio braseiro toca o fogo e a cena do dado queimando)
    for (const ch of chans) if (ch.a === i && ch.t < 0 && !used[ch.b]) ch.t = 0;
  };
  const refillAll = () => {
    used.fill(false);
    left.fill(0);
    braziers.forEach((b) => b.light(false, true));
    for (const ch of chans) {
      ch.t = -1;
      ch.front.visible = false;
      ch.pieces.forEach((p) => (p.m.material = offMat));
    }
  };
  const gate = shotGate(ctx.die);
  return {
    update(dt, t) {
      gate.tick();
      C.update(dt, t);
      cal.update();
      const p = ctx.paused();
      const step = p ? 0 : dt;
      if (!api.solved() && refill < 0) for (let i = 0; i < 9; i++) if (braziers[i].touched() && !used[i]) ignite(i);
      // o óleo: 4 s de chama; a chama encolhe no último segundo e meio
      for (let i = 0; i < 9; i++) {
        if (!braziers[i].lit) continue;
        left[i] -= step;
        braziers[i].flameK = left[i] < 1.5 ? Math.max(0.15, left[i] / 1.5) : 1;
        if (left[i] <= 0 && !api.solved()) braziers[i].light(false);
      }
      // as canaletas
      for (const ch of chans) {
        if (ch.t < 0) continue;
        ch.t += step;
        const u = Math.min(1, ch.t / ch.d);
        ch.pieces.forEach((pc) => (pc.m.material = pc.k <= u ? (u < 1 ? litMat : burntMat) : offMat));
        ch.front.visible = u < 1;
        if (u < 1) {
          ch.front.position.copy(along(ch, u)).setY(along(ch, u).y + 0.15);
          ch.front.material.map = kit.frames[Math.floor(t * 10 + ch.a) % kit.frames.length];
        } else {
          ch.t = -2; // terminou
          ch.front.visible = false;
          ch.pieces.forEach((pc) => (pc.m.material = burntMat));
          if (!used[ch.b]) {
            ignite(ch.b, true);
            ctx.sfx('spread');
          }
        }
      }
      // a porta: exatamente os quatro cantos acesos, num instante
      const litNow = braziers.map((b, i) => (b.lit ? i : -1)).filter((i) => i >= 0);
      if (!api.solved() && litNow.length === 4 && FC_TARGET.every((i) => litNow.includes(i))) {
        api.markSolved();
        ctx.sfx('door');
      }
      // tudo apagado sem acertar: escuro, e a Casa reabastece
      if (!api.solved() && refill < 0 && used.some(Boolean) && litNow.length === 0 && !chans.some((c) => c.t >= 0)) {
        refill = 1.2;
        ctx.sfx('error');
        ctx.blackout(2.5);
      }
      if (refill >= 0) {
        refill -= step;
        if (refill < 0) refillAll();
      }
      for (const [k, glow] of [['tempo', braziers.some((b) => b.lit && b.flameK < 1) ? 0.55 + 0.45 * Math.sin(t * 7) : litNow.length ? 0.35 : 0]] as [string, number][]) api.glow(k, glow, dt);
    },
    reset() {
      refillAll();
      refill = -1;
      C.reset();
    },
    bonus: C.bonus,
    rects: () => [...rects, ...C.rect()],
    interactables: [C.niche.interactable],
    floorY: (x, z) => platAt(x, z),
    dieFloor: (x, z) => platAt(x, z),
  };
}
export const FIRE_FOGO_CORRE: FireSpec = {
  name: 'O Fogo que Corre',
  subtitle: 'Nove plataformas.',
  hx: FC.hx,
  z0: FC.z0,
  h: FC.h,
  braziers: [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ x: fcCell(i).x, dz: fcCell(i).dz, y: fcCell(i).y })),
  rule: { kind: 'custom', lamps: 1 },
  words: ['acender', 'n2', 'brasa', 'tempo'],
  torches: 'few',
  fog: { color: '#0a0a11', near: 7, far: 30 },
  ambient: { color: 0x7a78b8, intensity: 1.7 },
  extra: fogoCorreExtra,
};
