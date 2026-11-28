// Braseiro de pedra que o jogador acende com a face Fogo do dado. Reaproveitado pelas salas novas.

import * as THREE from 'three';
import { lambert, lightEnv, type Kit } from './kit';
import type { Box, Ctx, Socket } from './types';
import { adoptLayers, brazierModelMode, onBrazierModel } from './models';
import { FLAME_H, FLAME_W } from './textures';

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

export function makeBrazier(kit: Kit, ctx: Ctx, x: number, z: number, startLit = false, scale = 1, y0 = 0, poolR = 1.9): Brazier {
  const s = scale; // braseiros menores/maiores (o tamanho pode dizer quanto a chama dura)
  kit.keepClear.push([new THREE.Vector3(x, y0 + 1.1 * scale, z), 1.3]); // (nenhuma chama de enfeite logo acima de um braseiro: parece aceso)
  const useModel = !!brazierModelMode;
  // o modelo da coluna com a cesta de ferro (models.ts) no lugar do pé e da tigela (`?braseiro=antigo` volta ao de caixas); as medidas do puzzle são as mesmas
  let flameW = 0.6 * s;
  let coalR = 0.22 * s;
  if (useModel) {
    const holder = new THREE.Group();
    holder.position.set(x, y0, z);
    holder.scale.setScalar(s);
    kit.group.add(holder);
    flameW = 0.46 * s;
    coalR = 0.09 * s;
    onBrazierModel((m) => {
      holder.add(m.group.clone());
      adoptLayers(kit.group, holder);
    });
  } else {
    kit.box(0.6 * s, 0.8 * s, 0.6 * s, kit.stone, x, y0 + 0.4 * s, z);
    const bowlMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * s, 0.32 * s, 0.3 * s, 8), lambert(null, 0x3a3a46));
    bowlMesh.userData.noShadow = true; // a tigela não tapa a própria luz (senão o chão em volta fica escuro)
    bowlMesh.position.set(x, y0 + 0.95 * s, z);
    kit.add(bowlMesh);
  }
  const bowl = new THREE.Vector3(x, y0 + 1.15 * s, z);
  // a chama (DESIGN.md §93): o pé dela fica preso nas brasas (o `center` embaixo) e ela cresce para cima; quando está acabando, encolhe para
  // dentro da cesta em vez de boiar no ar
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.tallFrames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
  const flameH = flameW * (FLAME_H / FLAME_W);
  flame.center.set(0.5, 0);
  flame.scale.set(flameW, flameH, 1);
  flame.position.set(x, y0 + (useModel ? 1.07 : 1.08) * s, z);
  flame.visible = false;
  kit.group.add(flame);
  const glow = kit.flameGlow(x, y0 + 1.45 * s, z, 1.7 * s);
  glow.visible = false;
  const lamp = kit.light(x - 0.3 * s, y0 + 1.9 * s, z + 0.4 * s, 0xff8a2a, 0);
  lamp.shadow = true; // braseiro aceso faz sombra de verdade (o motor dá às chamas mais perto)
  const coalMat = new THREE.MeshLambertMaterial({ color: 0x1c1516, emissive: 0x2a0b08 });
  for (let i = 0; i < 5; i++) {
    const coal = new THREE.Mesh(new THREE.DodecahedronGeometry((useModel ? 0.06 : 0.11) * s), coalMat);
    coal.userData.noShadow = true;
    coal.position.set(x + Math.cos(i * 1.3) * coalR, y0 + ((useModel ? 1.06 : 1.12) + (i % 2) * 0.04) * s, z + Math.sin(i * 1.3) * coalR);
    kit.group.add(coal);
  }
  kit.contact(x, z, 1.6 * s, 1.6 * s, y0);
  // a POÇA DE LUZ no chão (só acesa) e as BRASAS subindo da chama (DIRECAO_DE_ARTE.md §4.2 e §4.8)
  const pool = kit.lightPool(x, z, poolR * s, y0); // (poolR menor quando há algo perto: a poça não passa por baixo dos objetos)
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

  // a colisão segue o desenho: no modelo 3D (coluna com cesta), base, fuste, capitel e cesta, medidos do arquivo (o fuste tem uns 22 cm de raio e
  // a cesta 18); antes eram dois blocos do braseiro de caixas (o de cima com 42 cm), e o dado e o jogador batiam no ar em volta da cesta
  const bx = (r: number, a: number, h: number) => ({ min: new THREE.Vector3(x - r * s, y0 + a * s, z - r * s), max: new THREE.Vector3(x + r * s, y0 + h * s, z + r * s) });
  const boxes: Box[] = useModel
    ? [bx(0.3, 0, 0.18), bx(0.2, 0.18, 0.8), bx(0.26, 0.8, 0.9), bx(0.18, 0.9, 1.1)] // (a cesta: o dado repousa em cima, a 1,1 m)
    : [bx(0.3, 0, 0.8), bx(0.42, 0.8, 1.1)];
  const socket: Socket = { x, y: y0 + 1.1 * s, z, r: 0.6 * s };
  if (useModel) {
    // a MIRA do posicionar: o modelo não é superfície (a mira o atravessava e o dado ia para o chão atrás). Um cilindro invisível do tamanho do
    // braseiro recebe a mira; mirar em qualquer parte dele assenta o dado no centro, em cima da cesta (scene.ts, placeDie)
    const aim = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * s, 0.3 * s, 1.1 * s, 10), new THREE.MeshBasicMaterial());
    aim.position.set(x, y0 + 0.55 * s, z);
    aim.visible = false;
    aim.userData.socket = socket;
    aim.userData.aimOnly = true; // (o giz não risca nele)
    kit.group.add(aim);
    kit.surfaces.push(aim);
  }
  const b: Brazier = {
    x,
    z,
    bowl,
    lit: false,
    flameK: 1,
    boxes,
    socket,
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
      glow.visible = on;
      pool.visible = on;
      embers.visible = on;
      if (!on) lamp.intensity = 0;
      if (!quiet) ctx.sfx(on ? 'ignite' : 'burnout', `${Math.round(x * 10)},${Math.round(z * 10)}`);
    },
    update(t) {
      if (!b.lit) return;
      const k = Math.max(0.15, b.flameK);
      let n = 0;
      if (kit.lively) {
        // chama viva: a luz oscila e o ponto de luz treme (com sombra, as sombras dançam)
        n = 0.25 * Math.sin(t * 6.7 + x) + 0.15 * Math.sin(t * 12.3 + z) + 0.1 * Math.sin(t * 21.1 + x * 2);
        lamp.intensity = 40 * k * (1 + 0.2 * n);
        lamp.jit.set(Math.sin(t * 5.9 + z) * 0.05, n * 0.04, Math.cos(t * 4.7 + x) * 0.05);
      } else lamp.intensity = 40 * k * (0.97 + 0.02 * Math.sin(t * 5 + x) + 0.012 * Math.sin(t * 11));
      flame.scale.set(flameW * k, flameH * k * (1 + 0.08 * n), 1); // a chama encolhe quando está acabando (e estica com a luz)
      flame.material.map = kit.frame(t * 9 + x * 2.3 + z * 1.7, true); // (cada braseiro no seu passo)
      glow.material.opacity = 0.3 * k * (1 + 0.25 * n) * lightEnv.scale; // (no escuro da Casa o brilho do ar some junto com a luz)
      glow.scale.setScalar(1.7 * s * (0.55 + 0.45 * k));
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
