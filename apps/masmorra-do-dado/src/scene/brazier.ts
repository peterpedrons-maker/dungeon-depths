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

export function makeBrazier(kit: Kit, ctx: Ctx, x: number, z: number, startLit = false, scale = 1): Brazier {
  const s = scale; // braseiros menores/maiores (o tamanho pode dizer quanto a chama dura)
  kit.box(0.6 * s, 0.8 * s, 0.6 * s, kit.stone, x, 0.4 * s, z);
  const bowlMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * s, 0.32 * s, 0.3 * s, 8), lambert(null, 0x3a3a46));
  bowlMesh.position.set(x, 0.95 * s, z);
  kit.add(bowlMesh);
  const bowl = new THREE.Vector3(x, 1.15 * s, z);
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: null, fog: false, alphaTest: 0.5, depthWrite: false }));
  flame.scale.set(0.75 * s, 0.6 * s, 1);
  flame.position.set(x, 1.45 * s, z);
  flame.visible = false;
  kit.group.add(flame);
  const lamp = kit.light(x - 0.3 * s, 1.9 * s, z + 0.4 * s, 0xff8a2a, 0);
  const coalMat = new THREE.MeshLambertMaterial({ color: 0x1c1516, emissive: 0x2a0b08 });
  for (let i = 0; i < 5; i++) {
    const coal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11 * s), coalMat);
    coal.position.set(x + Math.cos(i * 1.3) * 0.22 * s, (1.12 + (i % 2) * 0.05) * s, z + Math.sin(i * 1.3) * 0.22 * s);
    kit.group.add(coal);
  }
  kit.contact(x, z, 1.6 * s);

  const b: Brazier = {
    x,
    z,
    bowl,
    lit: false,
    flameK: 1,
    boxes: [
      { min: new THREE.Vector3(x - 0.3 * s, 0, z - 0.3 * s), max: new THREE.Vector3(x + 0.3 * s, 0.8 * s, z + 0.3 * s) },
      { min: new THREE.Vector3(x - 0.42 * s, 0.8 * s, z - 0.42 * s), max: new THREE.Vector3(x + 0.42 * s, 1.1 * s, z + 0.42 * s) }, // a tigela: o dado repousa em cima
    ],
    socket: { x, y: 1.1 * s, z, r: 0.6 * s },
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
      if (!on) lamp.intensity = 0;
      if (!quiet) ctx.sfx(on ? 'ignite' : 'burnout', `${Math.round(x * 10)},${Math.round(z * 10)}`);
    },
    update(t) {
      if (!b.lit) return;
      const k = Math.max(0.15, b.flameK);
      flame.scale.set(0.75 * s * k, 0.6 * s * k, 1); // a chama encolhe quando está acabando
      flame.material.map = kit.frames[Math.floor(t * 8) % kit.frames.length];
      lamp.intensity = 40 * k * (0.97 + 0.02 * Math.sin(t * 5 + x) + 0.012 * Math.sin(t * 11));
    },
  };
  if (startLit) b.light(true, true);
  return b;
}
