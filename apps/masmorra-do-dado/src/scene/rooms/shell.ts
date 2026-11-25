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
    pillar(px: number, pz: number, w = 0.9) {
      kit.box(w, H, w, kit.brick([0.75, 3], 0.95, 50 + Math.abs(px * pz)), px, H / 2, pz);
      kit.box(w + 0.2, 0.25, w + 0.2, kit.stone, px, 0.125, pz);
      kit.box(w + 0.2, 0.25, w + 0.2, kit.stone, px, H - 0.125, pz);
      kit.contact(px, pz, w + 1.2);
      const hw = w / 2;
      boxes.push(mkBox(px - hw, 0, pz - hw, px + hw, H, pz + hw), mkBox(px - hw - 0.1, 0, pz - hw - 0.1, px + hw + 0.1, 0.25, pz + hw + 0.1));
      pillarRects.push([px - hw - 0.1, pz - hw - 0.1, px + hw + 0.1, pz + hw + 0.1]);
    },
    decorate() {
      kit.damp(X0, 1.0, Z0 + L * 0.4, 1, 0, 1.9);
      kit.damp(X1, 2.2, Z0 + L * 0.3, -1, 0, 1.5);
      kit.skirting(X0, X1, Z0, Z1, 1.3);
      kit.aoSides(X0, X1, Z0, Z1, H);
      kit.cornice(X0, X1, Z0, Z1, H);
      kit.dust(X0, X1, Z0, Z1, 0, H);
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

