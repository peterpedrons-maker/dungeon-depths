// Peças em comum entre as salas: criação de malhas, tochas, poeira e a porta em arco.

import * as THREE from 'three';
import { brickTexture, doorTexture, flameFrames, floorTexture, runeTexture } from './textures';
import type { Rect } from './types';

export const T = 1.2; // metros por "tile" de textura
// chaves de depuração (só usadas pelos testes em desenvolvimento)
export const dbg = { flicker: true, bob: true };
export const LAMP_OFF = 0x2a2230;

export function lambert(map: THREE.Texture | null, color = 0xffffff) {
  return new THREE.MeshLambertMaterial({ map, color });
}

export class Kit {
  group = new THREE.Group();
  surfaces: THREE.Object3D[] = [];
  frames = flameFrames();
  stone: THREE.MeshLambertMaterial;
  private torches: { sprite: THREE.Sprite; light: THREE.PointLight; phase: number; base: number }[] = [];
  private dustGeo: THREE.BufferGeometry | null = null;
  private dustH = 3;
  private dustN = 0;
  private flicker = true;

  constructor(public theme = 'crypt') {
    this.stone = lambert(brickTexture([1, 1], 0.9, 41, theme));
  }

  brick(repeat: [number, number], tint = 1, seed = 11) {
    return lambert(brickTexture(repeat, tint, seed, this.theme));
  }
  floorMat(repeat: [number, number]) {
    return lambert(floorTexture(repeat, this.theme));
  }

  add<M extends THREE.Object3D>(m: M, mark = true): M {
    this.group.add(m);
    if (mark) this.surfaces.push(m);
    return m;
  }

  plane(w: number, h: number, mat: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0, mark = true) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    return this.add(m, mark);
  }

  box(w: number, h: number, d: number, mat: THREE.Material | THREE.Material[], x: number, y: number, z: number, mark = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    return this.add(m, mark);
  }

  // tocha de parede: (nx, nz) = para onde a parede "olha" (de onde vem a luz)
  torch(x: number, y: number, z: number, nx: number, nz: number, phase: number, color = 0xff9a3c, intensity = 42) {
    this.box(Math.abs(nz) > 0 ? 0.2 : 0.08, 0.2, Math.abs(nx) > 0 ? 0.2 : 0.08, this.stone, x, y - 0.05, z);
    this.box(0.1, 0.6, 0.1, lambert(null, 0x5a3a24), x + nx * 0.16, y + 0.12, z + nz * 0.16);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }),
    );
    sprite.scale.set(0.38, 0.3, 1);
    sprite.position.set(x + nx * 0.16, y + 0.57, z + nz * 0.16);
    this.group.add(sprite);
    const light = new THREE.PointLight(color, intensity, 0, 2);
    light.position.set(x + nx * 0.45, y + 0.6, z + nz * 0.45);
    this.group.add(light);
    this.torches.push({ sprite, light, phase, base: intensity });
  }

  dust(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, n = 70) {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = x0 + 0.3 + Math.random() * (x1 - x0 - 0.6);
      pos[i * 3 + 1] = y0 + Math.random() * (y1 - y0);
      pos[i * 3 + 2] = z0 + 0.3 + Math.random() * (z1 - z0 - 0.6);
    }
    this.dustGeo = new THREE.BufferGeometry();
    this.dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.dustH = y1;
    this.dustN = n;
    this.group.add(
      new THREE.Points(
        this.dustGeo,
        new THREE.PointsMaterial({ color: 0xe0cfa8, size: 2, sizeAttenuation: false, transparent: true, opacity: 0.6, fog: false, depthWrite: false }),
      ),
    );
  }

  tick(dt: number, t: number) {
    this.torches.forEach((tc, i) => {
      tc.light.intensity = dbg.flicker ? tc.base * (1 + 0.025 * Math.sin(t * 4 + tc.phase) + 0.015 * Math.sin(t * 9.3 + tc.phase * 2)) : tc.base;
      tc.sprite.material.map = this.frames[Math.floor(t * 8 + i) % this.frames.length];
    });
    if (this.dustGeo) {
      const arr = this.dustGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < this.dustN; i++) {
        arr[i * 3 + 1] += dt * (0.03 + (i % 5) * 0.012);
        arr[i * 3] += Math.sin(t * 0.4 + i) * dt * 0.03;
        if (arr[i * 3 + 1] > this.dustH) arr[i * 3 + 1] = 0;
      }
      this.dustGeo.attributes.position.needsUpdate = true;
    }
    void this.flicker;
  }
}

// ── porta em arco ──────────────────────────────────────────────────────────
// Parede com abertura em arco (x0..x1 em z = z0), aro de pedra, pedra-chave, laje que
// sobe pra dentro da parede, corredor atrás com luz de saída e gemas-lâmpada no aro.
export const DW = 0.95; // meia-largura da abertura
export const DH = 1.7; // altura da parte reta (o arco começa aqui)
export const ARCH_TOP = DH + DW;
export const CORRIDOR = 3.2;

export interface DoorOpts {
  x0: number;
  x1: number;
  z0: number;
  y0?: number; // altura do chão da porta
  h: number; // altura da parede acima de y0
  lamps: number; // 1, 2 ou 3 gemas
  theme?: string;
  connected?: boolean; // true: o corredor desemboca na próxima sala (sem parede nem luz no fim)
}

export function buildDoor(kit: Kit, o: DoorOpts) {
  const y0 = o.y0 ?? 0;
  const g = new THREE.Group();
  g.position.y = y0;
  kit.group.add(g);
  const mark = (m: THREE.Object3D) => kit.surfaces.push(m);
  const theme = o.theme ?? kit.theme;

  // parede com o "entalhe" do arco
  const wall = new THREE.Shape();
  wall.moveTo(o.x0, 0);
  wall.lineTo(-DW, 0);
  wall.lineTo(-DW, DH);
  wall.absarc(0, DH, DW, Math.PI, 0, true);
  wall.lineTo(DW, 0);
  wall.lineTo(o.x1, 0);
  wall.lineTo(o.x1, o.h);
  wall.lineTo(o.x0, o.h);
  wall.closePath();
  const wm = new THREE.Mesh(new THREE.ShapeGeometry(wall, 12), lambert(brickTexture([1 / T, 1 / T], 1, 23, theme)));
  wm.position.z = o.z0;
  g.add(wm);
  mark(wm);

  // aro de pedra
  const R2 = DW + 0.3;
  const ring = new THREE.Shape();
  ring.moveTo(-R2, 0);
  ring.lineTo(-R2, DH);
  ring.absarc(0, DH, R2, Math.PI, 0, true);
  ring.lineTo(R2, 0);
  ring.lineTo(DW, 0);
  ring.lineTo(DW, DH);
  ring.absarc(0, DH, DW, 0, Math.PI, false);
  ring.lineTo(-DW, 0);
  ring.closePath();
  const rm = new THREE.Mesh(
    new THREE.ExtrudeGeometry(ring, { depth: 0.3, bevelEnabled: false, curveSegments: 12 }),
    lambert(brickTexture([1 / 0.9, 1 / 0.9], 1.05, 61, theme)),
  );
  rm.position.z = o.z0;
  g.add(rm);
  mark(rm);
  const key = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.38, 0.36), kit.stone);
  key.position.set(0, ARCH_TOP + 0.15, o.z0 + 0.18);
  g.add(key);
  mark(key);

  // laje (atrás da parede: só aparece pela abertura)
  const slabG = new THREE.Group();
  slabG.position.z = o.z0 - 0.13;
  const slab = new THREE.Shape();
  slab.moveTo(-DW - 0.08, 0);
  slab.lineTo(-DW - 0.08, DH);
  slab.absarc(0, DH, DW + 0.08, Math.PI, 0, true);
  slab.lineTo(DW + 0.08, 0);
  slab.closePath();
  const tex = doorTexture();
  tex.repeat.set(1 / (2 * DW + 0.16), 1 / 2.7);
  tex.offset.set(0.5, 0);
  slabG.add(
    new THREE.Mesh(new THREE.ExtrudeGeometry(slab, { depth: 0.09, bevelEnabled: false, curveSegments: 12 }), [
      lambert(tex, 0xb4a496),
      lambert(null, 0x4a3320),
    ]),
  );
  const runeMat = new THREE.MeshBasicMaterial({ map: runeTexture(), transparent: true, alphaTest: 0.5, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  const rune = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), runeMat);
  rune.position.set(0, 1.43, 0.1);
  slabG.add(rune);
  g.add(slabG);

  // corredor atrás da porta
  const cm = lambert(brickTexture([CORRIDOR / T, ARCH_TOP / T], 0.85, 71, theme));
  const ceilM = lambert(brickTexture([(2 * DW) / T, CORRIDOR / T], 0.7, 72, theme));
  const floorM = lambert(floorTexture([(2 * DW) / T, CORRIDOR / T], theme));
  const zc = o.z0 - CORRIDOR / 2;
  const mk = (w: number, h: number, mat: THREE.Material, x: number, y: number, z: number, rx: number, ry: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    g.add(m);
  };
  mk(CORRIDOR, ARCH_TOP, cm, -DW, ARCH_TOP / 2, zc, 0, Math.PI / 2);
  mk(CORRIDOR, ARCH_TOP, cm, DW, ARCH_TOP / 2, zc, 0, -Math.PI / 2);
  mk(2 * DW, CORRIDOR, ceilM, 0, ARCH_TOP, zc, Math.PI / 2, 0);
  mk(2 * DW, CORRIDOR, floorM, 0, 0.003, zc, -Math.PI / 2, 0);
  if (!o.connected) {
    const exitGlow = new THREE.Mesh(new THREE.PlaneGeometry(2 * DW, ARCH_TOP), new THREE.MeshBasicMaterial({ color: 0xfff0c8, fog: false }));
    exitGlow.position.set(0, ARCH_TOP / 2, o.z0 - CORRIDOR);
    g.add(exitGlow);
  }
  const corridorLight = new THREE.PointLight(0xffe2b0, 0, 0, 2);
  corridorLight.position.set(0, y0 + 1.9, o.z0 - 1.4);
  kit.group.add(corridorLight);

  // gemas-lâmpada no aro
  const lampBack = new THREE.MeshBasicMaterial({ color: 0x120f18 });
  const lampMats: THREE.MeshBasicMaterial[] = [];
  const xs = o.lamps === 1 ? [0] : o.lamps === 2 ? [-0.62, 0.62] : [-0.8, 0, 0.8];
  for (const x of xs) {
    const mat = new THREE.MeshBasicMaterial({ color: LAMP_OFF, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    lampMats.push(mat);
    const y = x === 0 ? ARCH_TOP + 0.15 : DH + Math.sqrt((DW + 0.15) ** 2 - x * x);
    const zf = x === 0 ? o.z0 + 0.375 : o.z0 + 0.305;
    const back = new THREE.Mesh(new THREE.CircleGeometry(0.17, 4), lampBack);
    back.position.set(x, y, zf);
    g.add(back);
    const gem = new THREE.Mesh(new THREE.CircleGeometry(0.12, 4), mat);
    gem.position.set(x, y, zf + 0.005);
    g.add(gem);
  }

  const zEnd = o.z0 - CORRIDOR;
  return {
    lampMats,
    zExit: o.z0 - 1.2,
    zEnd,
    setOpen(v: number) {
      slabG.position.y = v * (ARCH_TOP + 0.2);
      rune.visible = v < 0.5;
      corridorLight.intensity = v * 28;
    },
    // paredes ao lado da abertura, aro e (fechada) a própria porta
    rects(open: boolean): Rect[] {
      const top = y0 + 3.5;
      const zb = o.connected ? zEnd - 0.05 : zEnd - 0.4;
      const r: Rect[] = [
        [o.x0 - 1, zb, -DW, o.z0, top],
        [DW, zb, o.x1 + 1, o.z0, top],
        [-R2, o.z0, -DW, o.z0 + 0.3, top],
        [DW, o.z0, R2, o.z0 + 0.3, top],
      ];
      // porta fechada: só a laje (fina) barra a passagem; o corredor em si fica livre
      if (!open) r.push([-DW, o.z0 - 0.3, DW, o.z0, top]);
      // sem saída (última sala): fecha o fundo do corredor
      if (!o.connected) r.push([-DW, zEnd - 0.4, DW, zEnd, top]);
      return r;
    },
  };
}

// ── entrada de uma sala (liga com o corredor da sala anterior) ──────────────
// Parede de frente (z = o.z, olhando pra dentro da sala, ou seja, -z) com a abertura em arco
// no centro e um aro de pedra saindo pra dentro da sala.
export function buildEntrance(kit: Kit, o: { x0: number; x1: number; z: number; h: number; theme?: string }) {
  const theme = o.theme ?? kit.theme;
  const wall = new THREE.Shape();
  wall.moveTo(o.x0, 0);
  wall.lineTo(-DW, 0);
  wall.lineTo(-DW, DH);
  wall.absarc(0, DH, DW, Math.PI, 0, true);
  wall.lineTo(DW, 0);
  wall.lineTo(o.x1, 0);
  wall.lineTo(o.x1, o.h);
  wall.lineTo(o.x0, o.h);
  wall.closePath();
  const wm = new THREE.Mesh(new THREE.ShapeGeometry(wall, 12), lambert(brickTexture([1 / T, 1 / T], 1, 25, theme)));
  wm.rotation.y = Math.PI; // de frente pra dentro da sala
  wm.position.z = o.z;
  kit.add(wm);

  const R2 = DW + 0.3;
  const ring = new THREE.Shape();
  ring.moveTo(-R2, 0);
  ring.lineTo(-R2, DH);
  ring.absarc(0, DH, R2, Math.PI, 0, true);
  ring.lineTo(R2, 0);
  ring.lineTo(DW, 0);
  ring.lineTo(DW, DH);
  ring.absarc(0, DH, DW, 0, Math.PI, false);
  ring.lineTo(-DW, 0);
  ring.closePath();
  const rm = new THREE.Mesh(
    new THREE.ExtrudeGeometry(ring, { depth: 0.3, bevelEnabled: false, curveSegments: 12 }),
    lambert(brickTexture([1 / 0.9, 1 / 0.9], 1.05, 63, theme)),
  );
  rm.rotation.y = Math.PI;
  rm.position.z = o.z;
  kit.add(rm);

  return {
    rects(): Rect[] {
      return [
        [o.x0 - 1, o.z, -DW, o.z + 0.5],
        [DW, o.z, o.x1 + 1, o.z + 0.5],
        [-R2, o.z - 0.3, -DW, o.z],
        [DW, o.z - 0.3, R2, o.z],
      ];
    },
  };
}
