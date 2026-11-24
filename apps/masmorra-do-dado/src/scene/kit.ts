// Peças em comum entre as salas: criação de malhas, tochas, poeira e a porta em arco.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  aoRingTexture,
  aoStripTexture,
  blobShadowTexture,
  bannerTexture,
  barrelTexture,
  brickTexture,
  cobwebTexture,
  crateTexture,
  doorTexture,
  flameFrames,
  floorTexture,
  puddleTexture,
  rugTexture,
  runeTexture,
  stainTexture,
  vineTexture,
} from './textures';
import { makeInscription, type InscribeOpts, type Inscription } from './inscription';
import type { Box, Rect, Surface } from './types';

export const T = 1.2; // metros por "tile" de textura
// chaves de depuração (só usadas pelos testes em desenvolvimento)
export const dbg = { flicker: true, bob: true };
export const LAMP_OFF = 0x2a2230;

export function lambert(map: THREE.Texture | null, color = 0xffffff) {
  return new THREE.MeshLambertMaterial({ map, color });
}

// Fonte de luz "virtual": o motor mantém só algumas PointLights de verdade e as empresta
// aos emissores mais relevantes (perto e fortes). Menos luzes = shader bem mais leve.
export class Emitter {
  constructor(
    public pos: THREE.Vector3,
    public color: number,
    public intensity: number,
  ) {}
}

export class Kit {
  emitters: Emitter[] = [];
  private zones: { kind: Surface; test: (x: number, z: number) => boolean }[] = [];
  // obstáculos criados por objetos de cena (caixas, barris): a sala os soma aos seus
  rects: Rect[] = [];
  boxes: Box[] = [];
  inscriptions: Inscription[] = [];
  private cache = new Map<string, THREE.Material>();
  private emberPts: THREE.Points | null = null;
  group = new THREE.Group();
  surfaces: THREE.Object3D[] = [];
  frames = flameFrames();
  stone: THREE.MeshLambertMaterial;
  private torches: { sprite: THREE.Sprite; light: Emitter; phase: number; base: number }[] = [];
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
    if (!mark && !Array.isArray(mat)) m.userData.merge = true;
    return this.add(m, mark);
  }

  // tocha de parede: (nx, nz) = para onde a parede "olha" (de onde vem a luz)
  torch(x: number, y: number, z: number, nx: number, nz: number, phase: number, color = 0xff9a3c, intensity = 42) {
    this.box(Math.abs(nz) > 0 ? 0.2 : 0.08, 0.2, Math.abs(nx) > 0 ? 0.2 : 0.08, this.stone, x, y - 0.05, z, false);
    this.box(0.1, 0.6, 0.1, this.mat('torchStick', () => lambert(null, 0x5a3a24)), x + nx * 0.16, y + 0.12, z + nz * 0.16, false);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }),
    );
    sprite.scale.set(0.38, 0.3, 1);
    sprite.position.set(x + nx * 0.16, y + 0.57, z + nz * 0.16);
    this.group.add(sprite);
    const light = this.light(x + nx * 0.45, y + 0.6, z + nz * 0.45, color, intensity);
    this.torches.push({ sprite, light, phase, base: intensity });
  }

  // inscrição dos Contáveis (talhada, cal branca); olhar para ela manda os símbolos ao diário
  inscribe(o: InscribeOpts): Inscription {
    const ins = makeInscription(this.group, o, this.surfaces);
    this.inscriptions.push(ins);
    return ins;
  }

  private mat(key: string, make: () => THREE.Material) {
    let m = this.cache.get(key);
    if (!m) {
      m = make();
      this.cache.set(key, m);
    }
    return m;
  }

  // decalque: plano fino com transparência "recortada" (estilo pixel), sem brigar com a parede
  decal(w: number, h: number, key: string, tex: () => THREE.Texture, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, flipX = false) {
    const m = this.mat(
      'decal:' + key,
      () => new THREE.MeshLambertMaterial({ map: tex(), transparent: true, alphaTest: 0.45, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
    );
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    p.position.set(x, y, z);
    p.rotation.set(rx, ry, rz);
    if (flipX) p.scale.x = -1;
    this.group.add(p);
    return p;
  }

  // caixa de madeira (sólida)
  crate(x: number, z: number, size = 0.7, yaw = 0, baseY = 0) {
    const m = this.mat('crate', () => lambert(crateTexture()));
    const b = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), m);
    b.position.set(x, baseY + size / 2, z);
    b.rotation.y = yaw;
    this.add(b);
    if (baseY === 0) this.contact(x, z, size * 1.9);
    const half = (size / 2) * (Math.abs(Math.cos(yaw)) + Math.abs(Math.sin(yaw)));
    this.rects.push([x - half, z - half, x + half, z + half, baseY + size]);
    this.boxes.push({ min: new THREE.Vector3(x - half, baseY, z - half), max: new THREE.Vector3(x + half, baseY + size, z + half) });
    return b;
  }

  // barril (sólido)
  barrel(x: number, z: number, baseY = 0) {
    const side = this.mat('barrel', () => lambert(barrelTexture()));
    const top = this.mat('barrelTop', () => lambert(null, 0x4a2e1a));
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.85, 10), [side, top, top]);
    b.position.set(x, baseY + 0.425, z);
    this.add(b);
    if (baseY === 0) this.contact(x, z, 1.25);
    this.rects.push([x - 0.32, z - 0.32, x + 0.32, z + 0.32, baseY + 0.85]);
    this.boxes.push({ min: new THREE.Vector3(x - 0.3, baseY, z - 0.3), max: new THREE.Vector3(x + 0.3, baseY + 0.85, z + 0.3) });
    return b;
  }

  // piso especial (tapete, placa, poça...): o som dos passos muda
  zone(kind: Surface, test: (x: number, z: number) => boolean) {
    this.zones.push({ kind, test });
  }
  surfaceAt(x: number, z: number): Surface {
    for (let i = this.zones.length - 1; i >= 0; i--) if (this.zones[i].test(x, z)) return this.zones[i].kind;
    return 'stone';
  }

  // sombra suave (oclusão ambiente) no encontro das paredes laterais com chão e teto
  aoSides(x0: number, x1: number, z0: number, z1: number, h: number, y0 = 0) {
    const m = this.mat('aoStrip', () => new THREE.MeshBasicMaterial({ map: aoStripTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
    const len = z1 - z0;
    const cz = (z0 + z1) / 2;
    const strip = (x: number, y: number, ry: number, flip: boolean, hh: number) => {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(len, hh), m);
      p.position.set(x, y, cz);
      p.rotation.set(0, ry, flip ? Math.PI : 0);
      p.renderOrder = 2;
      this.group.add(p);
    };
    // plano girado em torno de Y: o "comprimento" da faixa corre ao longo de z
    strip(x0 + 0.008, y0 + 0.3, Math.PI / 2, false, 0.6);
    strip(x1 - 0.008, y0 + 0.3, -Math.PI / 2, false, 0.6);
    strip(x0 + 0.008, h - 0.3, Math.PI / 2, true, 0.6);
    strip(x1 - 0.008, h - 0.3, -Math.PI / 2, true, 0.6);
  }

  // anel de sombra no chão e no teto, junto à parede curva
  aoRing(R: number, h: number) {
    const m = this.mat('aoRing', () => new THREE.MeshBasicMaterial({ map: aoRingTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
    const f = new THREE.Mesh(new THREE.CircleGeometry(R, 40), m);
    f.rotation.x = -Math.PI / 2;
    f.position.y = 0.013;
    f.renderOrder = 2;
    this.group.add(f);
    const c = new THREE.Mesh(new THREE.CircleGeometry(R, 40), m);
    c.rotation.x = Math.PI / 2;
    c.position.y = h - 0.013;
    c.renderOrder = 2;
    this.group.add(c);
  }

  // mancha de sombra no chão sob um objeto
  contact(x: number, z: number, w: number, d = w, y = 0) {
    const m = this.mat('blob', () => new THREE.MeshBasicMaterial({ map: blobShadowTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -3 }));
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
    p.rotation.x = -Math.PI / 2;
    p.position.set(x, y + 0.016, z);
    p.renderOrder = 3;
    this.group.add(p);
  }

  // cornija: faixa de pedra no alto das paredes laterais
  cornice(x0: number, x1: number, z0: number, z1: number, h: number) {
    const len = z1 - z0;
    const cz = (z0 + z1) / 2;
    for (const [x, s] of [[x0, 1], [x1, -1]] as [number, number][]) {
      this.box(0.2, 0.2, len, this.stone, x + s * 0.1, h - 0.1, cz, false);
      this.box(0.12, 0.12, len, this.stone, x + s * 0.06, h - 0.26, cz, false);
    }
  }

  // pilastra encostada na parede (base, fuste e capitel)
  pilaster(x: number, z: number, nx: number, nz: number, h: number, w = 0.5) {
    const dx = nx !== 0 ? 0.12 : w;
    const dz = nz !== 0 ? 0.12 : w;
    const ox = nx * 0.06;
    const oz = nz * 0.06;
    const m = this.mat('pilaster', () => lambert(brickTexture([0.4, 2], 1.05, 77, this.theme)));
    this.box(dx, h - 0.5, dz, m, x + ox, h / 2, z + oz, false);
    this.box(nx !== 0 ? 0.16 : w + 0.1, 0.25, nz !== 0 ? 0.16 : w + 0.1, this.stone, x + nx * 0.08, 0.125, z + nz * 0.08, false);
    this.box(nx !== 0 ? 0.16 : w + 0.1, 0.25, nz !== 0 ? 0.16 : w + 0.1, this.stone, x + nx * 0.08, h - 0.25, z + nz * 0.08, false);
  }

  // tapete no chão (sem rotação)
  rug(x: number, z: number, w: number, l: number, main: string, accent: string, yaw = 0, y = 0) {
    const m = this.mat(`rug:${main}${accent}`, () => new THREE.MeshLambertMaterial({ map: rugTexture(main, accent), polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 }));
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, l), m);
    p.rotation.set(-Math.PI / 2, 0, yaw);
    p.position.set(x, y + 0.012, z);
    this.add(p);
    this.zone('rug', (px, pz) => Math.abs(px - x) < w / 2 && Math.abs(pz - z) < l / 2);
    return p;
  }

  // estandarte na parede (nx,nz = pra onde a parede "olha")
  banner(x: number, y: number, z: number, nx: number, nz: number, main: string, emblem: string, h = 1.7) {
    const m = this.mat(`banner:${main}${emblem}`, () => new THREE.MeshLambertMaterial({ map: bannerTexture(main, emblem), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
    const ry = Math.atan2(nx, nz);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(h * 0.5, h), m);
    p.position.set(x + nx * 0.05, y, z + nz * 0.05);
    p.rotation.y = ry;
    this.group.add(p);
    const rod = new THREE.Mesh(new THREE.BoxGeometry(h * 0.62, 0.05, 0.05), this.mat('rod', () => lambert(null, 0x2a2018)));
    rod.position.set(x + nx * 0.06, y + h / 2, z + nz * 0.06);
    rod.rotation.y = ry;
    this.group.add(rod);
    return p;
  }

  // viga de madeira (caixa escura); mark=false: não dá pra riscar
  beam(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number) {
    const m = this.mat('beam', () => lambert(null, 0x3a2616));
    const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m);
    b.position.set(cx, cy, cz);
    b.userData.merge = true;
    this.group.add(b);
    return b;
  }

  // rodapé baixo em volta da sala
  skirting(x0: number, x1: number, z0: number, z1: number, gap = 0) {
    const m = this.mat('skirt', () => lambert(null, 0x2a2838));
    const mk = (w: number, d: number, x: number, z: number) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), m);
      b.position.set(x, 0.1, z);
      b.userData.merge = true;
      this.group.add(b);
    };
    mk(0.1, z1 - z0, x0 + 0.05, (z0 + z1) / 2);
    mk(0.1, z1 - z0, x1 - 0.05, (z0 + z1) / 2);
    // paredes da frente e do fundo (com vão pra porta/entrada)
    const half = gap > 0 ? gap : 0;
    for (const z of [z0 + 0.05, z1 - 0.05]) {
      if (half === 0) mk(x1 - x0, 0.1, (x0 + x1) / 2, z);
      else {
        const wl = -half - x0;
        const wr = x1 - half;
        mk(wl, 0.1, x0 + wl / 2, z);
        mk(wr, 0.1, half + wr / 2, z);
      }
    }
  }

  moss(x: number, y: number, z: number, nx: number, nz: number, size = 1.4) {
    return this.decal(size, size, 'moss', () => stainTexture('moss'), x + nx * 0.015, y, z + nz * 0.015, 0, Math.atan2(nx, nz));
  }
  damp(x: number, y: number, z: number, nx: number, nz: number, size = 1.6) {
    return this.decal(size, size, 'damp', () => stainTexture('damp'), x + nx * 0.015, y, z + nz * 0.015, 0, Math.atan2(nx, nz));
  }
  vine(x: number, y: number, z: number, nx: number, nz: number, w = 0.8, h = 1.6) {
    return this.decal(w, h, 'vine', () => vineTexture(), x + nx * 0.02, y, z + nz * 0.02, 0, Math.atan2(nx, nz));
  }
  puddle(x: number, z: number, size = 1.4, rot = 0) {
    this.zone('water', (px, pz) => (px - x) ** 2 + (pz - z) ** 2 < (size * 0.3) ** 2);
    return this.decal(size, size, 'puddle', () => puddleTexture(), x, 0.014, z, -Math.PI / 2, 0, rot);
  }
  web(x: number, y: number, z: number, nx: number, nz: number, flip = false, size = 0.9) {
    return this.decal(size, size, 'web', () => cobwebTexture(), x + nx * 0.02, y, z + nz * 0.02, 0, Math.atan2(nx, nz), 0, flip);
  }

  light(x: number, y: number, z: number, color: number, intensity = 0) {
    const e = new Emitter(new THREE.Vector3(x, y, z), color, intensity);
    this.emitters.push(e);
    return e;
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

  // Junta as caixas decorativas que usam o mesmo material numa única malha (menos chamadas de
  // desenho). Chamar uma vez, no fim da montagem da sala.
  bake() {
    const byMat = new Map<THREE.Material, THREE.Mesh[]>();
    for (const o of [...this.group.children]) {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.userData.merge && !Array.isArray(m.material)) {
        const arr = byMat.get(m.material) ?? [];
        arr.push(m);
        byMat.set(m.material, arr);
      }
    }
    byMat.forEach((meshes, material) => {
      if (meshes.length < 2) return;
      const geos = meshes.map((m) => {
        m.updateMatrix();
        const g = m.geometry.clone();
        g.applyMatrix4(m.matrix);
        return g;
      });
      const merged = mergeGeometries(geos);
      if (!merged) return;
      const out = new THREE.Mesh(merged, material);
      this.group.add(out);
      meshes.forEach((m) => {
        this.group.remove(m);
        m.geometry.dispose();
      });
      geos.forEach((g) => g.dispose());
    });
  }

  private buildEmbers() {
    const n = this.torches.length * 5;
    const pos = new Float32Array(n * 3);
    this.emberPts = new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)),
      new THREE.PointsMaterial({ color: 0xffb02e, size: 2, sizeAttenuation: false, transparent: true, opacity: 0.9, fog: false, depthWrite: false }),
    );
    this.emberPts.frustumCulled = false;
    this.group.add(this.emberPts);
  }

  tick(dt: number, t: number) {
    if (!this.emberPts && this.torches.length) this.buildEmbers();
    if (this.emberPts) {
      const arr = this.emberPts.geometry.attributes.position.array as Float32Array;
      this.torches.forEach((tc, i) => {
        for (let k = 0; k < 5; k++) {
          const ph = (t * 0.55 + k * 0.2 + i * 0.13) % 1; // sobe e some
          const o = (i * 5 + k) * 3;
          arr[o] = tc.sprite.position.x + Math.sin(t * 2 + k * 2.1 + i) * 0.06 * ph;
          arr[o + 1] = tc.sprite.position.y + 0.1 + ph * 0.7;
          arr[o + 2] = tc.sprite.position.z + Math.cos(t * 1.7 + k * 1.3 + i) * 0.06 * ph;
        }
      });
      this.emberPts.geometry.attributes.position.needsUpdate = true;
    }
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
  lamps: number; // 1 a 5 gemas
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
  const corridorLight = kit.light(0, y0 + 1.9, o.z0 - 1.4, 0xffe2b0, 0);

  // gemas-lâmpada no aro
  const lampBack = new THREE.MeshBasicMaterial({ color: 0x120f18 });
  const lampMats: THREE.MeshBasicMaterial[] = [];
  const xs = o.lamps === 1 ? [0] : o.lamps === 2 ? [-0.62, 0.62] : o.lamps === 3 ? [-0.8, 0, 0.8] : o.lamps === 4 ? [-0.88, -0.3, 0.3, 0.88] : [-0.95, -0.5, 0, 0.5, 0.95];
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
