// O "casco" de uma sala retangular escrita à mão (as que não cabem no construtor fire.ts): chão, teto, paredes, entrada, porta,
// colunas, decoração, colisão do dado com as paredes. A sala põe o puzzle por cima.

import * as THREE from 'three';
import { floorTexture } from '../textures';
import { ARCH_TOP, buildDoor, buildEntrance, Kit, lambert, T } from '../kit';
import type { Box, Rect } from '../types';

export const Z1 = 2;
export const mkBox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box => ({
  min: new THREE.Vector3(x0, y0, z0),
  max: new THREE.Vector3(x1, y1, z1),
});

export function roomShell(kit: Kit, o: { hx: number; z0: number; h: number; lamps: number; theme?: string; floor?: boolean }) {
  const X0 = -o.hx;
  const X1 = o.hx;
  const Z0 = o.z0;
  const H = o.h;
  const W = X1 - X0;
  const L = Z1 - Z0;
  const zm = (Z0 + Z1) / 2;
  const theme = o.theme ?? kit.theme;
  if (o.floor !== false) kit.plane(W, L, lambert(floorTexture([W / T, L / T], theme)), 0, 0, zm, -Math.PI / 2);
  kit.plane(W, L, kit.brick([W / T, L / T], 0.65, 19), 0, H, zm, Math.PI / 2);
  const entrance = buildEntrance(kit, { x0: X0, x1: X1, z: Z1, h: H });
  const wallL = kit.plane(L, H, kit.brick([L / T, H / T], 0.95, 33), X0, H / 2, zm, 0, Math.PI / 2);
  const wallR = kit.plane(L, H, kit.brick([L / T, H / T], 0.95, 39), X1, H / 2, zm, 0, -Math.PI / 2);
  const door = buildDoor(kit, { x0: X0, x1: X1, z0: Z0, h: H, lamps: o.lamps, connected: true, theme });
  const boxes: Box[] = [mkBox(-1.25, 0, Z0, -0.95, ARCH_TOP, Z0 + 0.3), mkBox(0.95, 0, Z0, 1.25, ARCH_TOP, Z0 + 0.3), mkBox(-1.25, ARCH_TOP - 0.3, Z0, 1.25, H, Z0 + 0.3)];
  const pillarRects: Rect[] = [];
  const shell = {
    X0,
    X1,
    Z0,
    Z1,
    H,
    L,
    zm,
    wallL,
    wallR,
    door,
    boxes,
    // coluna do chão ao teto
    // COLUNA com base e capitel (DIRECAO_DE_ARTE.md §4.5): plinto de pedra lavrada, um toro mais estreito, o fuste de tijolo, e em cima o
    // colarinho e o ábaco (a laje larga que recebe a abóbada). `top` = onde ela encosta no teto (padrão: H).
    pillar(px: number, pz: number, w = 0.9, top = H) {
      const fust = top - 0.62;
      kit.box(w, fust, w, kit.brick([1, 1], 0.95, 50 + Math.abs(px * pz)), px, 0.32 + fust / 2, pz);
      kit.box(w + 0.34, 0.16, w + 0.34, kit.slab, px, 0.08, pz); // plinto
      kit.box(w + 0.18, 0.16, w + 0.18, kit.slab, px, 0.24, pz); // toro
      kit.box(w + 0.14, 0.12, w + 0.14, kit.slab, px, top - 0.24, pz); // colarinho
      kit.box(w + 0.36, 0.18, w + 0.36, kit.slab, px, top - 0.09, pz); // ábaco
      kit.contact(px, pz, w + 1.3);
      const hw = w / 2;
      boxes.push(mkBox(px - hw, 0, pz - hw, px + hw, top, pz + hw), mkBox(px - hw - 0.17, 0, pz - hw - 0.17, px + hw + 0.17, 0.32, pz + hw + 0.17));
      pillarRects.push([px - hw - 0.17, pz - hw - 0.17, px + hw + 0.17, pz + hw + 0.17]);
    },
    // ABÓBADA de berço baixa (DIRECAO_DE_ARTE.md §4.5): nasce em `spring` nas paredes laterais e sobe até `crown` no meio; arcos de reforço
    // (pedra lavrada) a cada `ribEvery` m e uma imposta ao longo das paredes. Devolve a altura da abóbada em x.
    vault(spring: number, crown: number, ribEvery = 2.6) {
      const hx = (X1 - X0) / 2;
      const rise = crown - spring;
      const r = (hx * hx + rise * rise) / (2 * rise);
      const cy = crown - r;
      const a = Math.asin(hx / r);
      const N = 16;
      const pos: number[] = [];
      const uv: number[] = [];
      const idx: number[] = [];
      for (let i = 0; i <= N; i++) {
        const phi = -a + (2 * a * i) / N;
        const x = r * Math.sin(phi);
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
      const vm = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: kit.brick([1, 1], 0.62, 23).map, side: THREE.DoubleSide }));
      kit.add(vm);
      // arcos de reforço: um setor de anel extrudado, rente à abóbada
      const n = Math.max(1, Math.round((Z1 - Z0) / ribEvery));
      for (let k = 1; k < n; k++) {
        const z = Z0 + ((Z1 - Z0) * k) / n;
        const sh = new THREE.Shape();
        sh.absarc(0, cy, r + 0.02, Math.PI / 2 - a, Math.PI / 2 + a, false);
        sh.absarc(0, cy, r - 0.14, Math.PI / 2 + a, Math.PI / 2 - a, true);
        const rib = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.26, bevelEnabled: false, curveSegments: 16 }), kit.slab);
        rib.position.z = z - 0.13;
        kit.add(rib);
      }
      // a imposta: a faixa de pedra onde a abóbada nasce, nas duas paredes
      for (const [x, sgn] of [[X0, 1], [X1, -1]] as [number, number][]) kit.box(0.14, 0.16, Z1 - Z0, kit.slab, x + sgn * 0.07, spring - 0.04, (Z0 + Z1) / 2, false);
      return (x: number) => cy + Math.sqrt(Math.max(0, r * r - x * x));
    },
    decorate() {
      kit.damp(X0, 1.0, Z0 + L * 0.4, 1, 0, 1.9);
      kit.damp(X1, 2.2, Z0 + L * 0.3, -1, 0, 1.5);
      kit.skirting(X0, X1, Z0, Z1, 1.3);
      kit.aoSides(X0, X1, Z0, Z1, H);
      kit.cornice(X0, X1, Z0, Z1, H);
    },
    // obstáculos de sempre: colunas, paredes, entrada e porta
    rects(doorOpen: number): Rect[] {
      const r: Rect[] = [...pillarRects, ...kit.rects, ...entrance.rects()];
      r.push([X0 - 2, Z0, X0, Z1 + 0.5], [X1, Z0, X1 + 2, Z1 + 0.5]);
      r.push(...door.rects(doorOpen > 0.85));
      return r;
    },
    clampDie(p: THREE.Vector3, vel: THREE.Vector3, e: number, R: number) {
      if (p.y > H - R) {
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
  };
  return shell;
}

// "um tiro, uma ação": depois que o dado toca uma lousa, ele não toca outra coisa até voltar à mão
export function shotGate(die: { readonly state: string }) {
  let armed = true;
  return {
    tick() {
      if (die.state === 'hand') armed = true;
    },
    take() {
      if (!armed) return false;
      armed = false;
      return true;
    },
    ready: () => armed, // este arremesso ainda não tocou nada
  };
}

// Prisma de base retangular e topo inclinado (rampas, cunhas, corrimãos): o y de cada canto do topo é yAt(x, z); o fundo é y0 (número ou função).
// UV em metros (use texturas com repeat [1, 1]).
export function wedge(x0: number, z0: number, x1: number, z1: number, yAt: (x: number, z: number) => number, side: THREE.Material, top: THREE.Material, y0: number | ((x: number, z: number) => number) = 0) {
  const geo = new THREE.BoxGeometry(x1 - x0, 1, z1 - z0);
  geo.translate((x0 + x1) / 2, 0.5, (z0 + z1) / 2);
  const p = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const y = p.getY(i) > 0.5 ? yAt(x, z) : typeof y0 === 'number' ? y0 : y0(x, z);
    p.setY(i, y);
    const face = Math.floor(i / 4); // BoxGeometry: +x, -x, +y, -y, +z, -z (4 vértices cada)
    if (face < 2) uv.setXY(i, z / T, y / T);
    else if (face < 4) uv.setXY(i, x / T, z / T);
    else uv.setXY(i, x / T, y / T);
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, [side, side, top, side, side, side]);
}



// ESCADA DE PEDRA, da borda baixa (zLow, yLow) à alta (zHigh, yHigh), entre x0 e x1, em n degraus. Cada degrau é um bloco de alvenaria
// (o espelho, tijolo em metros) com um PISO de pedra lavrada clara por cima, saliente na frente (o focinho): a escada se lê de longe.
// Devolve as caixas (para o dado). A sala continua dona do chão (groundY) e das colisões do jogador.
export function stairs(kit: Kit, o: { x0: number; x1: number; zLow: number; zHigh: number; yLow?: number; yHigh: number; n: number }): Box[] {
  const y0 = o.yLow ?? 0;
  const dir = Math.sign(o.zHigh - o.zLow);
  const TH = 0.07; // espessura do piso
  const NOSE = 0.05; // quanto o piso avança sobre o degrau de baixo
  const out: Box[] = [];
  for (let k = 0; k < o.n; k++) {
    const zA = o.zLow + ((o.zHigh - o.zLow) * k) / o.n;
    const zB = o.zLow + ((o.zHigh - o.zLow) * (k + 1)) / o.n;
    const top = y0 + ((o.yHigh - y0) * (k + 1)) / o.n;
    const za = Math.min(zA, zB);
    const zb = Math.max(zA, zB);
    const bodyH = top - TH - y0;
    kit.box(o.x1 - o.x0, bodyH, zb - za, kit.stone, (o.x0 + o.x1) / 2, y0 + bodyH / 2, (za + zb) / 2);
    const ta = dir < 0 ? za : za - NOSE;
    const tb = dir < 0 ? zb + NOSE : zb;
    kit.box(o.x1 - o.x0, TH, tb - ta, kit.slab, (o.x0 + o.x1) / 2, top - TH / 2, (ta + tb) / 2);
    out.push(mkBox(o.x0, y0, za, o.x1, top, zb));
  }
  return out;
}

// A mesma escada, correndo em X (da borda baixa xLow à alta xHigh, entre z0 e z1). Para quando o pé da escada precisa ficar virado para o
// meio da sala (e não encostado numa parede).
export function stairsX(kit: Kit, o: { z0: number; z1: number; xLow: number; xHigh: number; yLow?: number; yHigh: number; n: number }): Box[] {
  const y0 = o.yLow ?? 0;
  const dir = Math.sign(o.xHigh - o.xLow);
  const TH = 0.07;
  const NOSE = 0.05;
  const out: Box[] = [];
  const d = o.z1 - o.z0;
  const zc = (o.z0 + o.z1) / 2;
  for (let k = 0; k < o.n; k++) {
    const xA = o.xLow + ((o.xHigh - o.xLow) * k) / o.n;
    const xB = o.xLow + ((o.xHigh - o.xLow) * (k + 1)) / o.n;
    const top = y0 + ((o.yHigh - y0) * (k + 1)) / o.n;
    const xa = Math.min(xA, xB);
    const xb = Math.max(xA, xB);
    const bodyH = top - TH - y0;
    kit.box(xb - xa, bodyH, d, kit.stone, (xa + xb) / 2, y0 + bodyH / 2, zc);
    const ta = dir < 0 ? xa : xa - NOSE;
    const tb = dir < 0 ? xb + NOSE : xb;
    kit.box(tb - ta, TH, d, kit.slab, (ta + tb) / 2, top - TH / 2, zc);
    out.push(mkBox(xa, y0, o.z0, xb, top, o.z1));
  }
  return out;
}

// MURETA que acompanha uma rampa/escada: parede de tijolo de y0 até yAt(z) (ou yAt(x), se correr em x) e uma CAPA de pedra lavrada por cima,
// um pouco mais larga. `thick` = espessura. Devolve as caixas do dado (em pedaços, seguindo a inclinação).
export function slopedWall(kit: Kit, o: { x0: number; z0: number; x1: number; z1: number; top: (x: number, z: number) => number; y0?: number; segs?: number }): Box[] {
  const y0 = o.y0 ?? 0;
  const side = kit.stone;
  kit.add(wedge(o.x0, o.z0, o.x1, o.z1, (x, z) => o.top(x, z) - 0.08, side, kit.slab, y0));
  const alongX = o.x1 - o.x0 > o.z1 - o.z0;
  const ex = alongX ? 0 : 0.04;
  const ez = alongX ? 0.04 : 0;
  kit.add(wedge(o.x0 - ex, o.z0 - ez, o.x1 + ex, o.z1 + ez, (x, z) => o.top(Math.min(o.x1, Math.max(o.x0, x)), Math.min(o.z1, Math.max(o.z0, z))), kit.slab, kit.slab, (x, z) => o.top(Math.min(o.x1, Math.max(o.x0, x)), Math.min(o.z1, Math.max(o.z0, z))) - 0.09));
  const n = o.segs ?? 4;
  const out: Box[] = [];
  for (let k = 0; k < n; k++) {
    const a = k / n;
    const b = (k + 1) / n;
    const xa = alongX ? o.x0 + (o.x1 - o.x0) * a : o.x0;
    const xb = alongX ? o.x0 + (o.x1 - o.x0) * b : o.x1;
    const za = alongX ? o.z0 : o.z0 + (o.z1 - o.z0) * a;
    const zb = alongX ? o.z1 : o.z0 + (o.z1 - o.z0) * b;
    out.push(mkBox(xa, y0, za, xb, Math.max(o.top(xa, za), o.top(xb, zb), o.top(xa, zb), o.top(xb, za)), zb));
  }
  return out;
}
