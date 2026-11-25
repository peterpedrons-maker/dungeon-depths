// O Vestíbulo dos Números: salas pequenas e ruinosas que ensinam ACENDER, UM, DOIS e TRÊS sem uma
// palavra de explicação (ver DESIGN.md §9 e PUZZLES.md). O jogador começa SEM NADA nas mãos.
//   1 · O Poço       porta trancada; o dado caído "fala" e vai para a mão; ACENDER · UM · BRASEIRO
//   2 · O Vestíbulo  ACENDER · DOIS · BRASEIRO   três braseiros; só abre com EXATAMENTE dois acesos
//   3 · Os Quatro    ACENDER · TRÊS · BRASEIRO   quatro braseiros; só abre com EXATAMENTE três acesos
//   5 · A Lacuna     ACENDER · ▢ · BRASEIRO      (depois do Escrivão, com o giz) escreva o número que falta
// Cada sala tem um tamanho diferente.

import * as THREE from 'three';
import { floorTexture, brickTexture } from '../textures';
import { ARCH_TOP, buildDoor, buildEntrance, Kit, lambert, LAMP_OFF, T } from '../kit';
import { makeBrazier, type Brazier } from '../brazier';
import { glyphsOf } from '../../story/lexicon';
import { diary } from '../../story/diary';
import { ui } from '../../story/ui';
import type { Box, Ctx, Room } from '../types';

export type VestVariant = 1 | 2 | 3 | 4;

interface Dim {
  hx: number; // meia-largura
  z0: number; // parede do fundo (a da frente é sempre z = 2)
  h: number;
  theme: string;
  name: string;
  subtitle: string;
  fog: { color: string; near: number; far: number };
  ambient: { color: number; intensity: number };
}

// tamanhos bem diferentes: pequena e abafada, um salão comprido, média, baixa e apertada
const DIMS: Record<VestVariant, Dim> = {
  1: { hx: 3.4, z0: -9, h: 3.2, theme: 'ruin', name: 'Sala 1 · O Poço', subtitle: 'A porta não cede. Um braseiro espera.', fog: { color: '#090a11', near: 3, far: 15 }, ambient: { color: 0x6a72a4, intensity: 1.45 } },
  2: { hx: 4.7, z0: -15, h: 3.9, theme: 'ruin', name: 'Sala 2 · O Vestíbulo', subtitle: 'Mais braseiros. A escrita mudou um pouco.', fog: { color: '#0a0a11', near: 3.5, far: 19 }, ambient: { color: 0x706ea8, intensity: 1.6 } },
  3: { hx: 3.7, z0: -11.5, h: 3.4, theme: 'ruin', name: 'Sala 3 · Os Quatro', subtitle: 'Quatro braseiros. Outro número.', fog: { color: '#0a0a11', near: 3.5, far: 17 }, ambient: { color: 0x706ea8, intensity: 1.6 } },
  4: { hx: 3.3, z0: -8, h: 3.0, theme: 'crypt', name: 'Sala 5 · A Lacuna', subtitle: 'Falta uma palavra na frase.', fog: { color: '#0b0912', near: 3.5, far: 15 }, ambient: { color: 0x7a78b8, intensity: 1.7 } },
};

const Z1 = 2;
const mkBox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box => ({
  min: new THREE.Vector3(x0, y0, z0),
  max: new THREE.Vector3(x1, y1, z1),
});

export function buildVestibulo(ctx: Ctx, v: VestVariant): Room {
  const D = DIMS[v];
  const X0 = -D.hx;
  const X1 = D.hx;
  const Z0 = D.z0;
  const H = D.h;
  const kit = new Kit(D.theme);
  const W = X1 - X0;
  const L = Z1 - Z0;
  const zm = (Z0 + Z1) / 2;
  const SHAFT = { x: 0, z: Z0 + 5.4, r: 1.2 }; // boca larga o bastante para, de baixo, se ver o Escrivão debruçado sobre ela
  // névoa mística do pátio lá fora (sala 1): manchas de névoa PIXELADAS que passeiam devagar em volta do poço
  const mist: { s: THREE.Sprite; a: number; r: number; y: number; sp: number; ph: number; base: number }[] = [];

  kit.plane(W, L, lambert(floorTexture([W / T, L / T], D.theme)), 0, 0, zm, -Math.PI / 2);
  // teto (o primeiro tem o poço)
  if (v === 1) {
    const shape = new THREE.Shape();
    shape.moveTo(X0, Z0 - zm);
    shape.lineTo(X1, Z0 - zm);
    shape.lineTo(X1, Z1 - zm);
    shape.lineTo(X0, Z1 - zm);
    shape.closePath();
    const hole = new THREE.Path();
    hole.absarc(SHAFT.x, SHAFT.z - zm, SHAFT.r, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const ceil = new THREE.Mesh(new THREE.ShapeGeometry(shape, 24), lambert(brickTexture([1 / T, 1 / T], 0.6, 17, D.theme)));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, H, zm);
    kit.add(ceil);
    // o poço sobe até uma luz distante
    const shaftH = 16;
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(SHAFT.r, SHAFT.r, shaftH, 20, 1, true),
      lambert(brickTexture([6, shaftH / T], 0.75, 41, D.theme)),
    );
    (tube.material as THREE.MeshLambertMaterial).side = THREE.BackSide;
    tube.position.set(SHAFT.x, H + shaftH / 2, SHAFT.z);
    kit.group.add(tube);
    // ── LÁ EM CIMA, do lado de fora (abertura, DESIGN.md §33): a boca do poço num pátio em ruínas, sob um céu pálido de madrugada ──
    // Tudo acima do teto da sala: de dentro só se vê pelo poço (o céu, a trave e a corda em silhueta).
    const TOP = H + shaftH;
    const out = new THREE.Group();
    out.position.set(SHAFT.x, TOP, SHAFT.z);
    kit.group.add(out);
    // céu: meia esfera (só a parte de cima, para nunca aparecer dentro das salas), degradê de escuro no horizonte a quase branco no alto
    const skyCv = document.createElement('canvas');
    skyCv.width = 4;
    skyCv.height = 64;
    {
      const g = skyCv.getContext('2d')!;
      const grd = g.createLinearGradient(0, 0, 0, 64);
      grd.addColorStop(0, '#e8e4d6');
      grd.addColorStop(0.45, '#b9b8c4');
      grd.addColorStop(0.8, '#5c5a72');
      grd.addColorStop(1, '#25243a');
      g.fillStyle = grd;
      g.fillRect(0, 0, 4, 64);
    }
    const skyTex = new THREE.CanvasTexture(skyCv);
    skyTex.colorSpace = THREE.SRGBColorSpace;
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(19, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), // cabe no alcance da câmera (40 m) visto lá de baixo
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false }),
    );
    dome.position.y = -0.6;
    dome.renderOrder = -1;
    out.add(dome);
    // chão do pátio (anel em volta do furo) e a mureta do poço
    const ground = new THREE.Mesh(new THREE.RingGeometry(SHAFT.r, 30, 28, 1), lambert(floorTexture([18, 18], D.theme)));
    ground.rotation.x = -Math.PI / 2;
    out.add(ground);
    const RIM = SHAFT.r + 0.43; // raio de fora da mureta (scene.ts: RIM_OUT)
    const rimProf: [number, number][] = [[SHAFT.r, -0.05], [SHAFT.r, 0.72], [SHAFT.r + 0.05, 0.8], [RIM - 0.05, 0.8], [RIM, 0.72], [RIM, 0]];
    const rimGeo = new THREE.LatheGeometry(rimProf.map(([rr, y]) => new THREE.Vector2(rr, y)), 22);
    const rimMesh = new THREE.Mesh(rimGeo, lambert(brickTexture([5, 0.7], 0.8, 47, D.theme)));
    (rimMesh.material as THREE.MeshLambertMaterial).side = THREE.DoubleSide;
    out.add(rimMesh);
    // dois postes, a trave com o sarilho e a corda que desce pelo poço
    const wood = new THREE.MeshLambertMaterial({ color: 0x5a4636, emissive: 0x1a120c });
    for (const x of [-(RIM + 0.05), RIM + 0.05]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.15, 0.15), wood);
      post.position.set(x, 1.07, 0);
      post.rotation.z = x * -0.02;
      out.add(post);
    }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2 * RIM + 0.5, 0.13, 0.13), wood);
    bar.position.set(0, 2.08, 0);
    out.add(bar);
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.9, 10), wood);
    roll.rotation.z = Math.PI / 2;
    roll.position.set(0, 1.86, 0);
    out.add(roll);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 4.6, 5), new THREE.MeshLambertMaterial({ color: 0x8a7656, emissive: 0x1e170e }));
    rope.position.set(0.16, 1.86 - 2.3, 0.02);
    out.add(rope);
    // ruínas em volta: muretas quebradas, um pilar tombado, pedras; ao longe, torres escuras da Casa contra o céu
    const ruin = (w: number, h: number, d: number, x: number, z: number, ry: number, seed: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lambert(brickTexture([w / T, h / T], 0.85, seed, D.theme)));
      m.position.set(x, h / 2, z);
      m.rotation.y = ry;
      out.add(m);
    };
    ruin(3.2, 1.1, 0.5, -3.6, 2.4, 0.5, 51);
    ruin(2.4, 1.7, 0.5, 3.9, -1.2, -0.9, 52);
    ruin(0.6, 2.8, 0.6, -2.8, -2.6, 0.2, 53);
    ruin(1.8, 0.7, 0.45, 2.6, 3.2, 0.25, 54);
    for (const [x, z, sz] of [[1.9, 1.0, 0.22], [-1.7, -1.1, 0.3], [-2.2, 1.4, 0.18], [2.3, -2.4, 0.26]]) {
      const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(sz, 0), kit.stone);
      rk.position.set(x, sz * 0.6, z);
      rk.rotation.set(x, z, 0);
      out.add(rk);
    }
    // névoa: textura de nuvem em blocos de pixel, com a transparência em PONTILHADO (o mesmo pontilhado do resto do jogo)
    const mistTex = (() => {
      const N = 48;
      const cv = document.createElement('canvas');
      cv.width = N;
      cv.height = N;
      const g = cv.getContext('2d')!;
      const img = g.createImageData(N, N);
      const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      const blobs = [[0.5, 0.55, 0.36], [0.3, 0.6, 0.22], [0.7, 0.58, 0.24], [0.45, 0.42, 0.2], [0.62, 0.45, 0.18]];
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
          let d = 0;
          for (const [bx, by, br] of blobs) d = Math.max(d, 1 - Math.hypot(x / N - bx, (y / N - by) * 1.6) / br);
          d = Math.max(0, Math.min(1, d * 1.3));
          const level = Math.floor(d * 3.999); // 0..3 degraus
          const th = BAYER[(y % 4) * 4 + (x % 4)] / 16;
          const on = d > th * 0.9 + 0.05;
          const o = (y * N + x) * 4;
          img.data[o] = 176;
          img.data[o + 1] = 174;
          img.data[o + 2] = 196;
          img.data[o + 3] = on ? [0, 40, 66, 92][level] : 0;
        }
      g.putImageData(img, 0, 0);
      const t = new THREE.CanvasTexture(cv);
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.NearestFilter;
      t.generateMipmaps = false;
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })();
    const rnd = (k: number) => {
      const x = Math.sin(k * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 18; i++) {
      const m = new THREE.SpriteMaterial({ map: mistTex, transparent: true, depthWrite: false, fog: true, opacity: 0.8 });
      const sp = new THREE.Sprite(m);
      const sz = 2.4 + rnd(i) * 3.6;
      sp.scale.set(sz * 1.6, sz, 1);
      mist.push({ s: sp, a: rnd(i + 9) * Math.PI * 2, r: 1.9 + rnd(i + 3) * 7.5, y: 0.25 + rnd(i + 5) * 2.4, sp: (rnd(i + 7) - 0.5) * 0.06, ph: rnd(i + 11) * 6, base: 0.4 + rnd(i + 13) * 0.35 });
      out.add(sp);
    }
    const towerMat = new THREE.MeshBasicMaterial({ color: 0x1b1a2a, fog: false });
    for (const [a, dist, h, w] of [[0.3, 13, 9, 2.6], [1.4, 15, 12, 3.4], [2.6, 12.5, 7, 4], [3.5, 14.5, 10, 2.6], [4.6, 13.5, 8, 5], [5.6, 15.5, 13, 3]]) {
      const tw = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), towerMat);
      tw.position.set(Math.sin(a) * dist, h / 2 - 0.5, Math.cos(a) * dist);
      tw.rotation.y = a;
      out.add(tw);
    }
    // coluna de luz (translúcida) e mancha de luz no chão
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(SHAFT.r * 0.95, SHAFT.r * 1.3, H, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xdfe8ff, transparent: true, opacity: 0.055, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }),
    );
    beam.position.set(SHAFT.x, H / 2, SHAFT.z);
    kit.group.add(beam);
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(1.6, 24),
      new THREE.MeshBasicMaterial({ color: 0xcfd8f0, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(SHAFT.x, 0.02, SHAFT.z);
    kit.group.add(pool);
    kit.light(SHAFT.x, H - 0.3, SHAFT.z, 0xcfdcff, 70);
  } else {
    kit.plane(W, L, kit.brick([W / T, L / T], 0.65, 17 + v), 0, H, zm, Math.PI / 2);
  }
  if (v === 1) kit.plane(W, H, kit.brick([W / T, H / T], 1, 23), 0, H / 2, Z1, 0, Math.PI);
  const entrance = v > 1 ? buildEntrance(kit, { x0: X0, x1: X1, z: Z1, h: H }) : null;
  kit.plane(L, H, kit.brick([L / T, H / T], 0.95, 31 + v), X0, H / 2, zm, 0, Math.PI / 2);
  kit.plane(L, H, kit.brick([L / T, H / T], 0.95, 37 + v), X1, H / 2, zm, 0, -Math.PI / 2);

  const door = buildDoor(kit, { x0: X0, x1: X1, z0: Z0, h: H, lamps: 1, connected: true, theme: D.theme });

  // a frase talhada: v1–v3 na parede do fundo, à esquerda da porta; a lacuna (v4) na parede esquerda, bem maior
  // UMA palavra nova por sala (DESIGN.md §24): 1 = só ACENDER; 2 = ACENDER + DOIS; 3 = ACENDER + TRÊS + BRASEIRO (o desenho do braseiro aparece no dado)
  const words: (string | null)[] = v === 1 ? ['acender'] : v === 2 ? ['acender', 'n2'] : v === 3 ? ['acender', 'n3', 'brasa'] : ['acender', null, 'brasa', 'conf'];
  const onBack = v !== 4;
  const units = words.reduce((a, w) => a + (w ? Math.max(1, glyphsOf(w).length) : 1) + 0.2917, 0) + 0.55 * (words.length - 1) + 1.4;
  const size = onBack ? Math.min(0.5, (D.hx - 1.5) / units) : 0.55;
  const ins = onBack
    ? kit.inscribe({ words, x: -(D.hx + 1.25) / 2, y: 1.6, z: Z0 + 0.025, nx: 0, nz: 1, size, age: 0.4 - v * 0.05, seed: 3 + v * 11, lead: true })
    : kit.inscribe({ words, x: X0 + 0.025, y: 1.55, z: Z0 + 4.4, nx: 1, nz: 0, size, age: 0.2, seed: 3 + v * 11, lead: true });

  // braseiros (posições relativas ao tamanho da sala)
  const spots: [number, number][] =
    v === 1
      ? [[X1 - 0.8, Z0 + 1.0]]
      : v === 2
        ? [[X0 + 1.0, Z0 + 3.8], [X1 - 1.0, Z0 + 3.8], [X1 - 1.0, Z0 + 10]]
        : v === 3
          ? [[X0 + 1.0, Z0 + 2.4], [X1 - 1.0, Z0 + 2.4], [X0 + 1.0, Z0 + 6.8], [X1 - 1.0, Z0 + 6.8]]
          : [[X1 - 0.9, Z0 + 1.0], [X1 - 0.9, Z0 + 4.4], [X1 - 0.9, Z0 + 7.2]];
  const braziers: Brazier[] = spots.map(([x, z]) => makeBrazier(kit, ctx, x, z, v === 4));

  // ── sala 1: entulho embaixo do poço; é ali que o dado caiu junto com você ──
  let dieLie: THREE.Vector3 | undefined;
  if (v === 1) {
    const rocks: [number, number, number, number][] = [
      [-0.9, 0.6, 0.34, 0.3],
      [0.8, -0.8, 0.28, 1.1],
      [1.3, 0.5, 0.2, 2.0],
      [-0.5, -0.7, 0.16, 0.4],
      [-1.5, -0.5, 0.22, 2.4],
    ];
    for (const [dx, dz, sz, rot] of rocks) {
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(sz, 0), kit.stone);
      m.position.set(SHAFT.x + dx, sz * 0.7, SHAFT.z + dz);
      m.rotation.set(rot, rot * 1.7, 0);
      kit.group.add(m);
    }
    dieLie = new THREE.Vector3(SHAFT.x - 0.15, 0.0, SHAFT.z + 1.05); // no chão, à beira da mancha de luz
    kit.crate(X0 + 0.7, Z1 - 1.8, 0.7, 0.5); // restos de caixa
    kit.web(X0, H - 0.45, Z1 - 0.45, 1, 0);
    kit.web(X1, H - 0.45, Z1 - 0.45, -1, 0, true);
  }
  // rachaduras e umidade: a Casa está velha
  kit.damp(X0, 1.0, Z0 + 4.4, 1, 0, 1.9);
  kit.damp(X1, 2.2, Z0 + 3.8, -1, 0, 1.5);
  kit.skirting(X0, X1, Z0, Z1, 1.3);
  kit.aoSides(X0, X1, Z0, Z1, H);
  kit.cornice(X0, X1, Z0, Z1, H);
  kit.pilaster(X0, Z0 + 5.5, 1, 0, H);
  kit.pilaster(X1, Z0 + 5.5, -1, 0, H);
  if (v >= 2) {
    kit.torch(X0 + 0.1, 1.8, -1.2, 1, 0, 0.7);
    kit.torch(X1 - 0.1, 1.8, -1.2, -1, 0, 2.4);
  }
  if (v === 3) kit.torch(-D.hx + 0.9, 1.8, Z0 + 0.1, 0, 1, 4.1);
  if (v === 2) {
    // o salão comprido: colunas dos dois lados
    for (const z of [-5, -9.5]) {
      kit.box(0.8, H, 0.8, kit.brick([0.7, 3], 0.95, 50 + Math.abs(z)), X0 + 0.4, H / 2, z);
      kit.box(0.8, H, 0.8, kit.brick([0.7, 3], 0.95, 52 + Math.abs(z)), X1 - 0.4, H / 2, z);
    }
  }
  kit.dust(X0, X1, Z0, Z1, 0, H);

  // lacuna (v4): como dividir a placa em 3×3 para ler o que o jogador riscou
  const gapMesh = ins.gap;
  const gapCenter = new THREE.Vector3();
  let gapHalf = 0.23;
  const ry = onBack ? 0 : Math.PI / 2; // a parede olha +z (fundo) ou +x (esquerda)
  if (gapMesh) {
    gapCenter.copy(gapMesh.position);
    // o miolo liso da placa (sem a moldura): CELL / (CELL + 2·PAD) da largura
    gapHalf = (gapMesh.geometry as THREE.PlaneGeometry).parameters.width * (96 / 124) * 0.5;
  }
  // o 3 (três pontos na diagonal) ocupa as casas 0, 4 e 8 da placa
  const gapReads = () => {
    if (!gapMesh) return false;
    const cnt = new Array(9).fill(0);
    for (const d of ctx.chalk.dotsOn(gapMesh)) {
      // eixo "à direita de quem lê": (cos ry, 0, -sin ry)
      const u = ((d.x - gapCenter.x) * Math.cos(ry) - (d.z - gapCenter.z) * Math.sin(ry)) / gapHalf;
      const w = (d.y - gapCenter.y) / gapHalf;
      if (Math.abs(u) > 1.05 || Math.abs(w) > 1.05) continue;
      const col = u < -1 / 3 ? 0 : u > 1 / 3 ? 2 : 1;
      const row = w > 1 / 3 ? 0 : w < -1 / 3 ? 2 : 1;
      cnt[row * 3 + col]++;
    }
    const on = (i: number) => cnt[i] >= 2;
    return on(0) && on(4) && on(8) && !on(2) && !on(6) && cnt[1] < 7 && cnt[3] < 7 && cnt[5] < 7 && cnt[7] < 7;
  };

  // sólidos pro dado
  const boxes: Box[] = [];
  braziers.forEach((b) => boxes.push(...b.boxes));
  boxes.push(mkBox(-1.25, 0, Z0, -0.95, ARCH_TOP, Z0 + 0.3));
  boxes.push(mkBox(0.95, 0, Z0, 1.25, ARCH_TOP, Z0 + 0.3));
  boxes.push(mkBox(-1.25, ARCH_TOP - 0.3, Z0, 1.25, H, Z0 + 0.3));

  let doorOpen = 0;
  let prevWant = 0;
  let solved = false;
  let evalT = 0;
  let lastRev = -1;
  let overlit = 0; // v2/v3: tempo com braseiros demais
  // os glifos da frase REAGEM ao que o jogador faz (DESIGN.md §24): ACENDER brilha enquanto há fogo; o número enche conforme os braseiros acesos; BRASEIRO
  // pisca ao acender; a marca final brilha quando a porta abre
  let flash = 0;
  let readT = 0; // há quanto tempo a porta está aberta (a Casa lê a frase)
  let prevLit = 0;
  const glow = (id: string, target: number, dt: number) => {
    for (const p of ins.panels) if (p.id === id) p.fire = (p.fire ?? 0) + (target - (p.fire ?? 0)) * Math.min(1, dt * 6);
  };
  let marked = false;
  let tried = false; // v1: já tentou abrir a porta
  let nudge = -1; // v1: segundos desde que o dado pediu para acender (-1 = ainda não pediu); se demorar, ele repete
  const doorPos = new THREE.Vector3(0, 1.0, Z0 + 0.5);

  // ── sala 1: a porta trancada, o dado que CAI do poço e a cena de pegá-lo (DESIGN.md §29) ──
  const interactables: Room['interactables'] = [];
  const diePos = new THREE.Vector3(); // onde o dado está no chão (acompanha onde ele parou)
  let pickingUp = false;
  let murmurT = 0;
  let murmurN = 0;
  // o que o dado murmura enquanto espera ajuda: bem curto, em glifos
  const MURMURS: string[][] = [['ajudar', 'eu'], ['voce', 'vir'], ['eu', 'esperar']];
  if (v === 1 && dieLie) {
    interactables.push({
      pos: doorPos,
      r: 2.6,
      label: 'Tentar abrir a porta',
      enabled: () => !ctx.have().die && doorOpen < 0.05 && !pickingUp,
      use: () => {
        if (tried || ctx.flag('caiu')) {
          ctx.say([{ who: 'thought', text: 'Continua trancada.' }], { block: true });
          return;
        }
        tried = true;
        ctx.sfx('error');
        ctx.say([{ who: 'thought', text: 'Trancada. Empurro, puxo… nada se mexe.' }], {
          block: true,
          onEnd: () => {
            // um barulho lá em cima: algo cai pelo poço (a câmera vira para o buraco)
            // o jogador desconfia, anda até o poço e vê o Escrivão lá no alto, que fala e JOGA o dado (o motor conduz a cena: scene.ts, startScribeDrop)
            ctx.freeze(true);
            ctx.dropDie(() => {
              // a cena acabou com o dado caído à vista (ele já falou, ainda na cena): fica TRAVADA até o jogador pegá-lo
              ctx.pin(true);
              ctx.freeze(false);
            });
          },
        });
      },
    });
    // pegar o dado do chão (depois de ele ter caído): ele vai para a mão, vem para o CENTRO da tela e explica, em glifos
    interactables.push({
      pos: diePos,
      r: 2.6,
      label: 'Pegar o dado',
      enabled: () => ctx.flag('caiu') && !ctx.have().die && ctx.die.state === 'rest' && !pickingUp,
      use: () => {
        pickingUp = true;
        ctx.freeze(true);
        ctx.pin(false); // sai da trava da abertura (o resto da cena segue com freeze)
        ctx.dieGlow(1);
        ctx.lookAt(diePos, 0.6);
        ctx.giveDie(() => {
          // o dado está na mão: cinema (faixas, dado grande no centro) e a explicação, uma frase curta por vez
          ctx.dieCenter(true);
          const ms = ctx.dieTalk([{ glyphs: ['voce', 'condenado'] }, { glyphs: ['eu', 'boato'] }, { glyphs: ['eu', 'ajudar', 'voce'] }, { glyphs: ['acender', 'brasa'], pic: 'braseiro' }], { delay: 1.3 });
          window.setTimeout(() => {
            ctx.dieCenter(false);
            ctx.freeze(false);
            pickingUp = false;
            nudge = 0; // a partir daqui, se o jogador demorar a acender, o dado repete o pedido
            ctx.say([{ who: 'thought', text: 'Pesa na mão como se me conhecesse.' }], { block: true });
          }, 1300 + ms);
        });
      },
    });
  }

  // ── sala 2: o CADERNO ACHADO (PUZZLES_PROPOSTAS.md §5, sala 2). No chão, junto da base da coluna esquerda, no escuro; a luz do 1º braseiro
  // o revela. É o caderno de "a que veio antes", que vira o diário do jogador. Até pegá-lo, a porta não abre (a sala fica "travada").
  type NbState = 'dark' | 'shown' | 'talked' | 'taken' | 'call' | 'done';
  let nb: NbState = ctx.flag('caderno') ? 'done' : 'dark';
  let nbT = 0;
  const nbPos = new THREE.Vector3(X0 + 1.15, 0.05, -4.1);
  const nbGroup = new THREE.Group();
  const nbMats: THREE.MeshLambertMaterial[] = [];
  if (v === 2) {
    const cover = new THREE.MeshLambertMaterial({ color: 0x5a2216 });
    const paperM = new THREE.MeshLambertMaterial({ color: 0xd8b880 });
    nbMats.push(cover, paperM);
    // caído aberto, de bruços torto: duas metades de capa, as folhas e uma folha solta levantada
    for (const sgn of [-1, 1]) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.28), cover);
      c.position.set(sgn * 0.1, 0.006, 0);
      c.rotation.z = sgn * 0.08;
      nbGroup.add(c);
      const pg = new THREE.Mesh(new THREE.BoxGeometry(0.185, 0.022, 0.26), paperM);
      pg.position.set(sgn * 0.097, 0.022, 0);
      pg.rotation.z = sgn * 0.08;
      nbGroup.add(pg);
    }
    const loose = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.003, 0.24), paperM);
    loose.position.set(0.07, 0.06, 0.01);
    loose.rotation.z = -0.5;
    nbGroup.add(loose);
    nbGroup.position.copy(nbPos);
    nbGroup.rotation.y = 0.6;
    nbGroup.scale.setScalar(1.45);
    nbGroup.visible = nb !== 'done';
    kit.group.add(nbGroup);
    kit.contact(nbPos.x, nbPos.z, 0.7);
    const setDark = (k: number) => nbMats.forEach((m, i) => m.color.setHex(i === 0 ? 0x5a2216 : 0xd8b880).multiplyScalar(0.12 + 0.88 * k));
    setDark(0);
    (nbGroup.userData as { setDark: (k: number) => void }).setDark = setDark;
    interactables.push({
      pos: nbPos,
      r: 2.3,
      label: 'Pegar o caderno',
      enabled: () => nb === 'shown' || nb === 'talked',
      use: () => {
        nb = 'taken';
        nbGroup.visible = false;
        ctx.sfx('gem');
        ctx.milestone('caderno');
        // o que o jogador já viu (sala 1 e esta) entra no caderno como "avistado"
        diary.markSeen('acender');
        diary.markSeen('brasa');
        ctx.freeze(true);
        const ms = ctx.dieTalk([{ glyphs: ['voce', 'escrever', 'livro'], pic: 'escrever' }, { glyphs: ['voce', 'abrir', 'livro'], pic: 'abrir' }], { delay: 0.6 });
        window.setTimeout(() => {
          nb = 'call';
          nbT = 0;
          ui.setBookCall(true); // o botão do diário aparece pela 1ª vez, pulsando; a tela escurece em volta
        }, ms + 600);
      },
    });
  }
  const updateNotebook = (dt: number, nLit: number) => {
    if (v !== 2 || nb === 'done') return;
    if (nb === 'dark' && nLit > 0) {
      nb = 'shown';
      nbT = 0;
    }
    if (nb === 'shown' || nb === 'talked') {
      nbT += dt;
      (nbGroup.userData as { setDark: (k: number) => void }).setDark(Math.min(1, nbT / 1.2));
      if (nb === 'shown' && nbT > 1.4 && !ctx.paused()) {
        nb = 'talked';
        ctx.lookAt(nbPos, 0.9);
        ctx.dieTalk([{ glyphs: ['voce', 'ver', 'livro'], pic: 'livro' }, { glyphs: ['voce', 'pegar', 'livro'], pic: 'pegar' }], { delay: 0.5 });
      }
    }
    if (nb === 'call') {
      if (ui.bookCall() && !ui.diaryOpen()) {
        nbT += dt;
        if (nbT > 8) {
          nbT = 0;
          ctx.dieSay(['voce', 'abrir', 'livro'], { pic: 'abrir' }); // demorou: o dado repete, olhando para o canto
        }
      } else if (!ui.bookCall() && !ui.guided() && !ui.diaryOpen()) {
        nb = 'done';
        ctx.freeze(false);
        ctx.dieTalk([{ glyphs: ['eu', 'sentir', 'alegria'], joy: true }], { delay: 0.6 });
      }
    }
  };

  kit.bake();

  return {
    name: D.name,
    subtitle: D.subtitle,
    group: kit.group,
    surfaces: kit.surfaces,
    emitters: kit.emitters,
    inscriptions: kit.inscriptions,
    interactables,
    dieLie,
    shaft: v === 1 ? new THREE.Vector3(SHAFT.x, H + 2.5, SHAFT.z) : undefined,
    wellTop: v === 1 ? new THREE.Vector3(SHAFT.x, H + 16, SHAFT.z) : undefined,
    doorZ: Z0,
    entranceZ: Z1,
    // 1ª sala: o jogador acorda perto da luz do poço, olhando pra ela
    start: v === 1 ? new THREE.Vector3(0.35, 0, SHAFT.z + 1.2) : new THREE.Vector3(0, 0, 1.2),
    startYaw: 0,
    fog: D.fog,
    ambient: D.ambient,
    boxes: [...boxes, ...kit.boxes],
    sockets: braziers.map((b) => b.socket),
    rects() {
      const r: ReturnType<Room['rects']> = braziers.map((b) => b.rect);
      r.push(...kit.rects);
      r.push([X0 - 2, Z0, X0, Z1 + 0.5], [X1, Z0, X1 + 2, Z1 + 0.5]);
      if (v === 1) r.push([X0 - 2, Z1, X1 + 2, Z1 + 0.5]);
      else r.push(...(entrance?.rects() ?? []));
      if (v === 2)
        for (const z of [-5, -9.5]) r.push([X0, z - 0.4, X0 + 0.8, z + 0.4], [X1 - 0.8, z - 0.4, X1, z + 0.4]);
      r.push(...door.rects(doorOpen > 0.85));
      return r;
    },
    clampDie(p, vel, e, R) {
      const inShaft = v === 1 && Math.hypot(p.x - SHAFT.x, p.z - SHAFT.z) < SHAFT.r - R; // dentro do poço o "teto" é lá em cima
      if (p.y > H - R && p.y < H + 0.6 && !inShaft) { // o teto só existe na altura do teto (lá em cima, no pátio, o dado cai livre)
        p.y = H - R;
        if (vel.y > 0) vel.y = -vel.y * e;
      }
      if (p.x < X0 + R) {
        p.x = X0 + R;
        if (vel.x < 0) vel.x = -vel.x * e;
      } else if (p.x > X1 - R) {
        p.x = X1 - R;
        if (vel.x > 0) vel.x = -vel.x * e;
      }
      if (p.z < Z0 + R + 0.03) {
        p.z = Z0 + R + 0.03;
        if (vel.z < 0) vel.z = -vel.z * e;
      } else if (p.z > Z1 - R) {
        p.z = Z1 - R;
        if (vel.z > 0) vel.z = -vel.z * e;
      }
    },
    groundY: () => 0,
    surfaceAt: (x, z) => kit.surfaceAt(x, z),
    dieFloor: () => 0,
    holdsDie: () => false,
    update(dt, t) {
      // a névoa do pátio gira devagar em volta do poço, sobe e desce, engrossa e afina
      for (const m of mist) {
        m.a += m.sp * dt;
        m.s.position.set(Math.sin(m.a) * m.r, m.y + Math.sin(t * 0.3 + m.ph) * 0.25, Math.cos(m.a) * m.r);
        (m.s.material as THREE.SpriteMaterial).opacity = m.base * (0.75 + 0.25 * Math.sin(t * 0.21 + m.ph));
      }
      kit.tick(dt, t);
      if (v === 1 && ctx.flag('caiu') && !ctx.have().die) {
        // o dado no chão pede ajuda: pulsa e murmura, enquanto o jogador não o pega
        diePos.copy(ctx.die.pos);
        ctx.dieGlow(0.5 + 0.35 * Math.sin(t * 2.4));
        if (!pickingUp && !ctx.paused()) {
          murmurT += dt;
          if (murmurT > 25) { // raro: enquanto ele fala o "Pegar o dado" some (nada se sobrepõe), então ele quase não interrompe
            murmurT = 0;
            ctx.dieSay(MURMURS[murmurN++ % MURMURS.length]); // o dado fala por balão, nunca pela caixa de conversa
          }
        }
      }
      // acender
      for (const b of braziers) {
        if (v !== 4 && b.touched()) {
          b.light(true);
          if (v === 1) ctx.milestone('fogo');
        }
        b.update(t);
      }
      const nLit = braziers.filter((b) => b.lit).length;
      updateNotebook(dt, nLit);
      if (v === 1) {
        if (nudge >= 0 && nLit === 0 && !ctx.paused()) {
          nudge += dt;
          if (nudge > 50) {
            nudge = 0;
            ctx.dieSay(['acender', 'brasa']); // repete o pedido se o jogador demorar
          }
        }
        if (nLit > 0 && nudge >= 0) {
          nudge = -1;
          // comemoração: ele reage quando o braseiro pega (depois da cena do fogo): "VOCÊ ACENDER CONFIRMADO", e logo em seguida a alegria dele
          ctx.dieTalk([{ glyphs: ['voce', 'acender', 'conf'], joy: true }, { glyphs: ['eu', 'sentir', 'alegria'] }], { delay: 1.9 });
        }
      }
      if (nLit > prevLit) flash = 1;
      prevLit = nLit;
      flash = Math.max(0, flash - dt / 1.3);
      let want = 0;
      if (v === 1) want = nLit >= 1 ? 1 : 0;
      else if (v === 2 || v === 3) {
        // o número tem que ser EXATO: com mais braseiros do que o pedido, a Casa apaga tudo
        const need = v === 2 ? 2 : 3;
        want = nLit === need && (v !== 2 || nb === 'done' || ctx.flag('caderno')) ? 1 : 0; // sala 2: sem o caderno, a porta não abre
        if (nLit > need) {
          overlit += dt;
          if (overlit > 1.6) {
            braziers.forEach((b) => b.light(false));
            overlit = 0;
          }
        } else overlit = 0;
      } else {
        evalT -= dt;
        if (!solved && evalT <= 0 && ctx.chalk.revision !== lastRev) {
          evalT = 0.25;
          lastRev = ctx.chalk.revision;
          if (gapReads()) {
            solved = true;
            ctx.sfx('piece');
          }
        }
        want = solved ? 1 : 0;
      }
      if (want && !prevWant) {
        ctx.sfx('door');
        if (!marked) {
          marked = true;
          if (v <= 3) ctx.milestone(v === 1 ? 'fogo' : v === 2 ? 'dois' : 'tres');
        }
      } else if (!want && prevWant && doorOpen > 0.15) ctx.sfx('doorClose');
      prevWant = want;
      doorOpen += (want - doorOpen) * Math.min(1, dt * 2.4);
      door.setOpen(doorOpen);
      door.lampMats[0].color.setHex(want ? 0xff7a2e : LAMP_OFF);
      // reações dos glifos
      const open = doorOpen > 0.5;
      glow('acender', v === 4 ? (open ? 1 : 0) : nLit > 0 ? 1 : 0, dt);
      glow('brasa', Math.max(flash, open ? 0.6 : 0), dt);
      glow('conf', open ? 1 : 0, dt);
      // a Casa "lê" a frase quando a porta abre: as palavras acendem uma a uma, da esquerda para a direita
      readT = open ? readT + dt : 0;
      ins.panels.forEach((p, k) => {
        if (open && readT > 0.15 + k * 0.4 && p.id) p.fire = Math.max(p.fire ?? 0, Math.min(1, (readT - (0.15 + k * 0.4)) * 4));
      });
      if (v === 2 || v === 3) glow(v === 2 ? 'n2' : 'n3', open ? 1 : Math.min(1, nLit / (v === 2 ? 2 : 3)) * (nLit > (v === 2 ? 2 : 3) ? 0.3 : 1), dt);
    },
    reset() {
      braziers.forEach((b) => b.light(v === 4, true));
      doorOpen = 0;
      prevWant = 0;
      solved = false;
      overlit = 0;
      door.setOpen(0);
    },
    dispose() {},
  };
}
