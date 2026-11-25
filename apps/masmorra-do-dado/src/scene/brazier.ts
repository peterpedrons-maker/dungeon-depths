// Braseiro de pedra que o jogador acende com a face Fogo do dado. Reaproveitado pelas salas novas.

import * as THREE from 'three';
import { lambert, type Kit } from './kit';
import type { Box, Ctx, Socket } from './types';

export interface Brazier {
  x: number;
  z: number;
  bowl: THREE.Vector3; // onde o dado precisa chegar
  lit: boolean;
  flameK: number; // 1 = chama inteira; menor = acabando
  boxes: Box[];
  socket: Socket;
  rect: [number, number, number, number];
  // true se o dado (com Fogo) acabou de tocar nele agora
  touched(): boolean;
  light(on: boolean, quiet?: boolean): void;
  update(t: number): void;
}

export function makeBrazier(kit: Kit, ctx: Ctx, x: number, z: number, startLit = false, scale = 1, y0 = 0): Brazier {
  const s = scale; // braseiros menores/maiores (o tamanho pode dizer quanto a chama dura)
  kit.box(0.6 * s, 0.8 * s, 0.6 * s, kit.stone, x, y0 + 0.4 * s, z);
  const bowlMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * s, 0.32 * s, 0.3 * s, 8), lambert(null, 0x3a3a46));
  bowlMesh.position.set(x, y0 + 0.95 * s, z);
  kit.add(bowlMesh);
  const bowl = new THREE.Vector3(x, y0 + 1.15 * s, z);
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
  flame.scale.set(0.75 * s, 0.6 * s, 1);
  flame.position.set(x, y0 + 1.45 * s, z);
  flame.visible = false;
  kit.group.add(flame);
  const lamp = kit.light(x - 0.3 * s, y0 + 1.9 * s, z + 0.4 * s, 0xff8a2a, 0);
  const coalMat = new THREE.MeshLambertMaterial({ color: 0x1c1516, emissive: 0x2a0b08 });
  for (let i = 0; i < 5; i++) {
    const coal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11 * s), coalMat);
    coal.position.set(x + Math.cos(i * 1.3) * 0.22 * s, y0 + (1.12 + (i % 2) * 0.05) * s, z + Math.sin(i * 1.3) * 0.22 * s);
    kit.group.add(coal);
  }
  kit.contact(x, z, 1.6 * s, 1.6 * s, y0);
  // a POÇA DE LUZ no chão (só acesa) e as BRASAS subindo da chama (DIRECAO_DE_ARTE.md §4.2 e §4.8)
  const pool = kit.lightPool(x, z, 1.9 * s, y0);
  pool.visible = false;
  const EN = 7;
  const emberPos = new Float32Array(EN * 3);
  const embers = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(emberPos, 3)),
    new THREE.PointsMaterial({ color: 0xffb02e, size: 2, sizeAttenuation: false, transparent: true, opacity: 0.95, fog: false, depthWrite: false }),
  );
  embers.frustumCulled = false;
  embers.visible = false;
  kit.group.add(embers);

  const b: Brazier = {
    x,
    z,
    bowl,
    lit: false,
    flameK: 1,
    boxes: [
      { min: new THREE.Vector3(x - 0.3 * s, y0, z - 0.3 * s), max: new THREE.Vector3(x + 0.3 * s, y0 + 0.8 * s, z + 0.3 * s) },
      { min: new THREE.Vector3(x - 0.42 * s, y0 + 0.8 * s, z - 0.42 * s), max: new THREE.Vector3(x + 0.42 * s, y0 + 1.1 * s, z + 0.42 * s) }, // a tigela: o dado repousa em cima
    ],
    socket: { x, y: y0 + 1.1 * s, z, r: 0.6 * s },
    rect: [x - 0.5 * s, z - 0.5 * s, x + 0.5 * s, z + 0.5 * s],
    touched() {
      const d = ctx.die;
      return !b.lit && (d.state === 'flying' || d.state === 'rest') && d.face === 3 && d.pos.distanceTo(bowl) < 0.6;
    },
    light(on, quiet = false) {
      if (b.lit === on) return;
      b.lit = on;
      b.flameK = 1;
      flame.visible = on;
      pool.visible = on;
      embers.visible = on;
      if (!on) lamp.intensity = 0;
      if (!quiet) ctx.sfx(on ? 'ignite' : 'burnout', `${Math.round(x * 10)},${Math.round(z * 10)}`);
    },
    update(t) {
      if (!b.lit) return;
      const k = Math.max(0.15, b.flameK);
      flame.scale.set(0.75 * s * k, 0.6 * s * k, 1); // a chama encolhe quando está acabando
      flame.material.map = kit.frames[Math.floor(t * 8) % kit.frames.length];
      lamp.intensity = 40 * k * (0.97 + 0.02 * Math.sin(t * 5 + x) + 0.012 * Math.sin(t * 11));
      pool.opacity = 0.3 * k * (0.92 + 0.08 * Math.sin(t * 6 + z));
      // as brasas: sobem da chama, balançando, e somem no alto (cada uma no seu tempo)
      for (let i = 0; i < EN; i++) {
        const ph = (t * (0.45 + (i % 3) * 0.12) + i * 0.143) % 1;
        emberPos[i * 3] = x + Math.sin(t * 1.7 + i * 2.1) * 0.12 * s + Math.sin(i * 5.3) * 0.15 * s;
        emberPos[i * 3 + 1] = y0 + (1.35 + ph * 1.5 * k) * s;
        emberPos[i * 3 + 2] = z + Math.cos(t * 1.3 + i * 1.7) * 0.12 * s + Math.cos(i * 3.7) * 0.15 * s;
      }
      embers.geometry.attributes.position.needsUpdate = true;
    },
  };
  if (startLit) b.light(true, true);
  return b;
}
