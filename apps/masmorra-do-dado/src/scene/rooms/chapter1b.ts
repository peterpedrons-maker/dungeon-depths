// Capítulo 1, segunda metade (PUZZLES_PROPOSTAS.md §2, §4 fichas 4 a 10, §5): as salas 12 a 17 do plano, montadas sobre o construtor fire.ts.
// Cada uma tem verificador em tools/ e a solução em PUZZLES.md. (A numeração das salas no jogo é automática e conta os respiros.)

import * as THREE from 'three';
import type { FireExtra, FireExtraApi, FireSpec } from './fire';
import { glyphPattern, makeWallBoard, type WallBoard } from '../firegrid';
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
