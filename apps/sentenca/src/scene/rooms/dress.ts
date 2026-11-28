// A CENOGRAFIA DAS SALAS DE PUZZLE (DESIGN.md §96). As salas do construtor `fire.ts` eram caixas: quatro paredes de tijolo e um teto chato e
// escuro, todas iguais. Aqui ficam as peças que dão ARQUITETURA a elas sem tocar em nada que o puzzle usa:
//   · a ABÓBADA de berço baixa, de tijolo, com arcos de pedra lavrada sobre mísulas (a mesma gramática da Lousa, que é o quadro de estilo);
//   · a JANELA alta: uma fresta em arco numa parede do lado, com o vão na espessura da parede, grade, o céu lá fora, o feixe de luz que
//     entra e a poeira fina dentro dele.
// REGRAS: a abóbada fica toda ACIMA da altura `H` da sala (o teto de antes): o dado continua batendo num teto invisível em H, e nada do que
// se arremessa, alcança ou lê muda. As mísulas ficam no alto das paredes (acima de H − 0,6). A janela fica acima das escritas e o feixe cai
// num pedaço de chão vazio, perto da própria parede (nunca em cima de braseiro, laje, placa ou frase: uma luz em cima de UMA coisa viraria
// pista falsa). Só em sala que está na superfície e numa parede que dá para fora (a planta diz).
import * as THREE from 'three';
import { Kit, lightEnv, T } from '../kit';
import { sunBeam } from '../fx';
import { tallyTexture } from '../textures';

// A ABÓBADA sobre [X0, X1] × [Z0, Z1]: nasce em H nas paredes do lado e sobe `rise` no meio. Fecha as duas pontas (as lunetas, em cima das
// paredes da frente e do fundo). Devolve a altura dela em x.
// `oculus`: um ÓCULO (janela redonda) na luneta do fundo ('B') ou da frente ('F'), com grade, o céu, o feixe e a poeira; `reach` = a que
// distância da parede o feixe cai no chão.
export function barrelCeiling(kit: Kit, X0: number, X1: number, Z0: number, Z1: number, H: number, o: { rise?: number; ribEvery?: number; oculus?: 'B' | 'F'; reach?: number } = {}) {
  const hx = (X1 - X0) / 2;
  const cx = (X0 + X1) / 2;
  const rise = o.rise ?? Math.max(0.9, Math.min(1.9, hx * 0.28));
  const r = (hx * hx + rise * rise) / (2 * rise);
  const cy = H + rise - r;
  const a = Math.asin(hx / r);
  const N = 18;
  // a casca de tijolo
  {
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= N; i++) {
      const phi = -a + (2 * a * i) / N;
      const x = cx + r * Math.sin(phi);
      const y = cy + r * Math.cos(phi);
      const arc = r * (phi + a);
      for (const z of [Z0, Z1]) {
        pos.push(x, y, z);
        uv.push(arc / T, z / T);
      }
    }
    for (let i = 0; i < N; i++) {
      const k = i * 2;
      idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    kit.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: kit.brick([1, 1], 0.62, 23).map, side: THREE.DoubleSide })));
  }
  // as lunetas: o pedaço de parede entre H e a abóbada, na frente e no fundo
  {
    const sh = new THREE.Shape();
    sh.moveTo(-hx, 0);
    for (let i = 0; i <= N; i++) {
      const phi = -a + (2 * a * i) / N;
      sh.lineTo(r * Math.sin(phi), cy - H + r * Math.cos(phi));
    }
    sh.closePath();
    const mat = kit.brick([1 / T, 1 / T], 0.9, 35);
    const OR = 0.44; // raio do óculo
    const oy = rise * 0.5; // a altura dele acima de H
    for (const [z, ry, end] of [[Z0, 0, 'B'], [Z1, Math.PI, 'F']] as const) {
      const shape = o.oculus === end ? sh.clone() : sh;
      if (o.oculus === end) {
        const p = new THREE.Path();
        p.absarc(0, oy, OR, 0, Math.PI * 2, true);
        shape.holes.push(p);
      }
      const m = new THREE.Mesh(new THREE.ShapeGeometry(shape, o.oculus === end ? 14 : 1), mat);
      m.position.set(cx, H, z);
      m.rotation.y = ry;
      kit.add(m);
      if (o.oculus !== end) continue;
      const dir = end === 'B' ? 1 : -1; // para dentro da sala
      const g = new THREE.Group();
      g.position.set(cx, H + oy, z);
      kit.group.add(g);
      const stone = kit.slab.clone();
      stone.side = THREE.BackSide;
      stone.color.multiplyScalar(0.8);
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(OR, OR, 0.55, 18, 1, true).rotateX(Math.PI / 2), stone);
      tube.position.z = -dir * 0.275;
      tube.userData.noShadow = true;
      const sky = new THREE.MeshBasicMaterial({ color: 0xdfe6f0, fog: false, side: THREE.DoubleSide });
      const SKY = new THREE.Color(0xdfe6f0);
      kit.fxUpd.push(() => sky.color.copy(SKY).multiplyScalar(Math.max(0.12, lightEnv.scale)));
      const disc = new THREE.Mesh(new THREE.CircleGeometry(OR + 0.1, 18), sky);
      disc.position.z = -dir * 0.55;
      const iron = new THREE.MeshLambertMaterial({ color: 0x1c1a20 });
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(OR * 2, 0.04, 0.04), iron);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, OR * 2, 0.04), iron);
      for (const q of [tube, disc, b1, b2]) {
        q.userData.noPlan = true;
        if (q === b1 || q === b2) {
          q.position.z = -dir * 0.22;
          q.userData.noShadow = true;
        }
        g.add(q);
      }
      const from = new THREE.Vector3(cx, H + oy, z - dir * 0.2);
      const to = new THREE.Vector3(cx, 0.04, z + dir * (o.reach ?? 3.4));
      sunBeam(kit.group, from, to, OR * 0.9, 0.9, { color: 0xc8d8ff, strength: 0.075, dust: 150 });
      const pool = kit.lightPool(to.x, to.z, 1.3, 0, 0xbfd0ff);
      pool.opacity = 0.16;
      kit.light(to.x, 1.2, to.z - dir * 0.3, 0xa8bce8, 8);
    }
  }
  // os arcos de pedra lavrada (uma faixa curva embaixo da casca) e as mísulas em que eles nascem
  const L = Z1 - Z0;
  const n = Math.max(2, Math.round(L / (o.ribEvery ?? 3.3)));
  const slab = kit.slab.clone();
  slab.side = THREE.DoubleSide;
  const RW = 0.36; // largura do arco (em z)
  const RT = 0.17; // quanto ele desce da casca
  const ri = r - RT;
  for (let k = 1; k < n; k++) {
    const zr = Z0 + (L * k) / n;
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    // três tiras: a de baixo (intradorso) e as duas faces
    const strip = (pt: (phi: number) => [number, number, number][]) => {
      const base = pos.length / 3;
      for (let i = 0; i <= N; i++) {
        const phi = -a + (2 * a * i) / N;
        const [p0, p1] = pt(phi);
        pos.push(...p0, ...p1);
        const arc = (r * (phi + a)) / 0.6;
        uv.push(arc, 0, arc, 0.5);
      }
      for (let i = 0; i < N; i++) {
        const q = base + i * 2;
        idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3);
      }
    };
    strip((phi) => [
      [cx + ri * Math.sin(phi), cy + ri * Math.cos(phi), zr - RW / 2],
      [cx + ri * Math.sin(phi), cy + ri * Math.cos(phi), zr + RW / 2],
    ]);
    for (const zz of [zr - RW / 2, zr + RW / 2])
      strip((phi) => [
        [cx + ri * Math.sin(phi), cy + ri * Math.cos(phi), zz],
        [cx + (r + 0.02) * Math.sin(phi), cy + (r + 0.02) * Math.cos(phi), zz],
      ]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const rib = new THREE.Mesh(geo, slab);
    rib.userData.noShadow = true;
    rib.userData.merge = true; // (todos os arcos numa malha só, na hora de assar)
    kit.group.add(rib);
    for (const sx of [-1, 1]) {
      kit.box(0.34, 0.26, 0.5, kit.slab, cx + sx * (hx - 0.17), H - 0.11, zr, false);
      kit.box(0.2, 0.28, 0.34, kit.slab, cx + sx * (hx - 0.1), H - 0.38, zr, false);
    }
  }
  return (x: number) => cy + Math.sqrt(Math.max(0, r * r - (x - cx) * (x - cx)));
}

export interface WallWindow {
  z: number; // onde, ao longo da parede (z da sala)
  y?: number; // a altura do peitoril (padrão: H − 1,75)
  reach?: number; // a que distância da parede o feixe cai no chão (padrão: pelo ângulo de ~48°)
  slide?: number; // quanto o feixe anda em z até o chão (padrão 0,5)
}

// UMA PAREDE DO LADO COM JANELAS: a parede de tijolo de x = `x` (de z0 a z1, até a altura H), recortada nas frestas, e cada fresta com o vão,
// a grade, o céu, o feixe e a luz no chão. `nx` = para onde a parede olha (+1 a da esquerda, −1 a da direita).
export function wallWithWindows(kit: Kit, x: number, nx: 1 | -1, z0: number, z1: number, H: number, seed: number, wins: WallWindow[]) {
  const L = z1 - z0;
  const zm = (z0 + z1) / 2;
  const W = 0.62; // largura da fresta
  const WH = 0.95; // altura até o nascimento do arco
  const R = W / 2;
  const D = 0.6; // a espessura da parede (o vão)
  // (o plano da parede: u ao longo da parede, v = altura; a parede da esquerda vira +90° em y, e aí u aponta para −z)
  const uOf = (z: number) => (nx > 0 ? -(z - zm) : z - zm);
  const sh = new THREE.Shape();
  sh.moveTo(-L / 2, 0);
  sh.lineTo(L / 2, 0);
  sh.lineTo(L / 2, H);
  sh.lineTo(-L / 2, H);
  sh.closePath();
  const sills = wins.map((w) => w.y ?? H - 1.75);
  wins.forEach((w, i) => {
    const u = uOf(w.z);
    const y0 = sills[i];
    const p = new THREE.Path();
    p.moveTo(u - R, y0);
    p.lineTo(u + R, y0);
    p.lineTo(u + R, y0 + WH);
    p.absarc(u, y0 + WH, R, 0, Math.PI, false);
    p.lineTo(u - R, y0);
    sh.holes.push(p);
  });
  const wall = new THREE.Mesh(new THREE.ShapeGeometry(sh, 10), kit.brick([1 / T, 1 / T], 0.95, seed));
  wall.position.set(x, 0, zm);
  wall.rotation.y = (nx * Math.PI) / 2;
  kit.add(wall);
  const g = new THREE.Group();
  g.position.copy(wall.position);
  g.rotation.copy(wall.rotation);
  kit.group.add(g);
  const stone = kit.slab.clone();
  stone.side = THREE.DoubleSide;
  stone.color.multiplyScalar(0.8);
  const iron = new THREE.MeshLambertMaterial({ color: 0x1c1a20 });
  const sky = new THREE.MeshBasicMaterial({ color: 0xdfe6f0, fog: false });
  const SKY = new THREE.Color(0xdfe6f0);
  kit.fxUpd.push(() => sky.color.copy(SKY).multiplyScalar(Math.max(0.12, lightEnv.scale))); // (no escuro da Casa a janela também apaga)
  wins.forEach((w, i) => {
    const u = uOf(w.z);
    const y0 = sills[i];
    const top = y0 + WH + R;
    const pl = (pw: number, ph: number, px: number, py: number, pz: number, rx: number, ry: number, m: THREE.Material) => {
      const q = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), m);
      q.position.set(px, py, pz);
      q.rotation.set(rx, ry, 0);
      q.userData.noPlan = true;
      g.add(q);
      return q;
    };
    // o vão: duas ombreiras, o peitoril (inclinado para dentro: a luz escorre por ele) e a verga
    pl(D, top - y0, u - R, (y0 + top) / 2, -D / 2, 0, Math.PI / 2, stone);
    pl(D, top - y0, u + R, (y0 + top) / 2, -D / 2, 0, -Math.PI / 2, stone);
    pl(W, D, u, y0, -D / 2, -Math.PI / 2, 0, stone);
    pl(W, D, u, top, -D / 2, Math.PI / 2, 0, stone);
    pl(W + 0.3, top - y0 + 0.3, u, (y0 + top) / 2, -D, 0, 0, sky); // o céu lá fora
    for (const bx of [-0.1, 0.1]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.035, top - y0, 0.035), iron);
      bar.position.set(u + bx, (y0 + top) / 2, -D * 0.45);
      bar.userData.noShadow = true;
      g.add(bar);
    }
    const cross = new THREE.Mesh(new THREE.BoxGeometry(W, 0.035, 0.035), iron);
    cross.position.set(u, y0 + WH * 0.55, -D * 0.45);
    cross.userData.noShadow = true;
    g.add(cross);
    // o feixe: da fresta para dentro e para baixo, até o chão perto da parede
    const yc = y0 + WH * 0.6;
    const reach = w.reach ?? yc / 1.1;
    const from = new THREE.Vector3(x - nx * 0.25, yc, w.z);
    const to = new THREE.Vector3(x + nx * reach, 0.04, w.z + (w.slide ?? 0.5));
    sunBeam(kit.group, from, to, 0.3, 0.72, { color: 0xc8d8ff, strength: 0.07, dust: 110 });
    const pool = kit.lightPool(to.x, to.z, 1.15, 0, 0xbfd0ff);
    pool.opacity = 0.16;
    kit.light(to.x - nx * 0.3, 1.1, to.z, 0xa8bce8, 7);
  });
  return wall;
}

// ── OS RASTROS DE QUEM PASSOU ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Coisas pequenas deixadas num canto perto da ENTRADA (nunca perto do puzzle), sem texto: as cinzas de uma fogueira velha entre três pedras,
// um toco de vela derretido, os riscos de contagem de quem esperou. Cada sala recebe uma combinação (`kind`), e algumas não recebem nada: se
// todas tivessem, virava enfeite repetido.
let ashTex: THREE.CanvasTexture | null = null;
function ashTexture() {
  if (ashTex) return ashTex;
  const N = 40;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d')!;
  let s = 4711;
  const rnd = () => ((s = (s * 16807) % 2147483647) & 0xffff) / 0x10000;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - N / 2 + 0.5, y - N / 2 + 0.5) / (N / 2);
      const k = 1 - d + (rnd() - 0.5) * 0.35;
      if (k < 0.12) continue;
      const v = rnd();
      g.fillStyle = k > 0.6 ? (v < 0.3 ? '#141012' : v < 0.7 ? '#1e181a' : '#2c2628') : v < 0.5 ? '#2a2426' : '#3a3436';
      if (k > 0.25 || v < 0.5) g.fillRect(x, y, 1, 1);
    }
  // pedacinhos de carvão e cinza clara
  for (let i = 0; i < 26; i++) {
    const a = rnd() * 6.28;
    const r = rnd() * N * 0.3;
    g.fillStyle = rnd() < 0.4 ? '#6a6466' : '#0a0809';
    g.fillRect(Math.round(N / 2 + Math.cos(a) * r), Math.round(N / 2 + Math.sin(a) * r), 1 + (i % 2), 1);
  }
  ashTex = new THREE.CanvasTexture(c);
  ashTex.magFilter = ashTex.minFilter = THREE.NearestFilter;
  ashTex.colorSpace = THREE.SRGBColorSpace;
  return ashTex;
}
let waxTex: THREE.CanvasTexture | null = null;
function waxTexture() {
  if (waxTex) return waxTex;
  const c = document.createElement('canvas');
  c.width = c.height = 12;
  const g = c.getContext('2d')!;
  const rows = ['....www.....', '..wwwwwww...', '.wwwwwwwww..', '.wwwwwwwwww.', 'wwwwwwwwwww.', '.wwwwwwwwwww', '.wwwwwwwww..', '..wwwwwwww..', '...wwwww.w..', '....ww......', '............', '............'];
  rows.forEach((r, y) => {
    for (let x = 0; x < 12; x++) if (r[x] === 'w') {
      g.fillStyle = (x + y) % 5 === 0 ? '#b8ac90' : '#a2977e';
      g.fillRect(x, y, 1, 1);
    }
  });
  waxTex = new THREE.CanvasTexture(c);
  waxTex.magFilter = waxTex.minFilter = THREE.NearestFilter;
  waxTex.colorSpace = THREE.SRGBColorSpace;
  return waxTex;
}
const waxMat = new THREE.MeshLambertMaterial({ color: 0xb4a888 });
// (x, z) = o ponto no chão; (wx, wz, nx, nz) = a parede ao lado dele (onde vão os riscos) e para onde ela olha
export function traces(kit: Kit, kind: number, x: number, z: number, wall: { x: number; z: number; nx: number; nz: number }, seed = 1) {
  const stoneM = kit.slab;
  const candle = (cx: number, cz: number) => {
    kit.decal(0.3, 0.3, 'wax', waxTexture, cx, 0.012, cz, -Math.PI / 2, 0, seed);
    const b = kit.box(0.06, 0.07 + (seed % 3) * 0.02, 0.06, waxMat, cx, 0.045, cz, false);
    b.userData.noShadow = true;
  };
  if (kind === 0) {
    // a fogueira velha: cinzas entre três pedras
    kit.decal(0.95, 0.95, 'ash', ashTexture, x, 0.013, z, -Math.PI / 2, 0, seed * 1.3);
    for (let i = 0; i < 3; i++) {
      const a = seed + i * 2.2;
      const sz = 0.13 + ((seed + i) % 3) * 0.03;
      const st = kit.box(sz, sz * 0.7, sz * 1.2, stoneM, x + Math.cos(a) * 0.42, sz * 0.35, z + Math.sin(a) * 0.42, false);
      st.rotation.y = a;
    }
  } else if (kind === 1) {
    candle(x, z);
    kit.decal(1.1, 0.55, `tally-rastro${seed}`, () => tallyTexture(5 + ((seed * 7) % 19)), wall.x + wall.nx * 0.02, 1.15, wall.z + wall.nz * 0.02, 0, Math.atan2(wall.nx, wall.nz));
  } else if (kind === 2) {
    // duas velas, uma caída
    candle(x, z);
    candle(x + 0.22, z - 0.12);
  } else if (kind === 3) {
    kit.decal(1.1, 0.55, `tally-rastro${seed}`, () => tallyTexture(9 + ((seed * 5) % 23)), wall.x + wall.nx * 0.02, 1.2, wall.z + wall.nz * 0.02, 0, Math.atan2(wall.nx, wall.nz));
  }
}
