// Giz livre: o jogador desenha de verdade nas paredes e no chão. Cada "risco" é uma
// fileira de quadradinhos (pixels de giz) colados na superfície; apagar remove os
// quadradinhos tocados pela borracha. Cada sala guarda os seus.

import * as THREE from 'three';
import type { ChalkDot } from './types';

const CAP = 24000; // máximo de pontinhos por sala
const HALF = 0.021; // meio lado do pontinho (m)
const STEP = 0.02; // espaçamento entre pontinhos ao arrastar (m)
const LIFT = 0.012; // quanto "descola" da parede (evita z-fighting)

export class Chalk {
  revision = 0;
  private dots: ChalkDot[] = [];
  private geo: THREE.BufferGeometry;
  private pos: Float32Array;
  readonly mesh: THREE.Mesh;
  private last: ChalkDot | null = null;

  constructor() {
    this.pos = new Float32Array(CAP * 4 * 3);
    const idx = new Uint32Array(CAP * 6);
    for (let i = 0; i < CAP; i++) {
      const v = i * 4;
      idx.set([v, v + 1, v + 2, v, v + 2, v + 3], i * 6);
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setIndex(new THREE.BufferAttribute(idx, 1));
    this.geo.setDrawRange(0, 0);
    this.mesh = new THREE.Mesh(
      this.geo,
      new THREE.MeshBasicMaterial({ color: 0xf0ecdc, side: THREE.DoubleSide, depthWrite: false }),
    );
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5; // por último, só testando profundidade
  }

  // troca o conjunto de pontinhos (um por sala)
  use(store: ChalkDot[]) {
    this.dots = store;
    this.last = null;
    this.rebuild();
  }

  get count() {
    return this.dots.length;
  }

  private writeDot(i: number, d: ChalkDot) {
    // base tangente à superfície
    let tx: number, ty: number, tz: number;
    if (Math.abs(d.ny) < 0.9) {
      // parede: t = normalize(cross(n, up))
      tx = d.nz;
      ty = 0;
      tz = -d.nx;
    } else {
      // chão/teto: t = eixo X
      tx = d.ny;
      ty = 0;
      tz = 0;
    }
    const tl = Math.hypot(tx, ty, tz) || 1;
    tx /= tl;
    ty /= tl;
    tz /= tl;
    // b = cross(n, t)
    const bx = d.ny * tz - d.nz * ty;
    const by = d.nz * tx - d.nx * tz;
    const bz = d.nx * ty - d.ny * tx;
    const cx = d.x + d.nx * LIFT;
    const cy = d.y + d.ny * LIFT;
    const cz = d.z + d.nz * LIFT;
    const o = i * 12;
    const p = this.pos;
    const h = HALF;
    p[o] = cx - tx * h - bx * h;
    p[o + 1] = cy - ty * h - by * h;
    p[o + 2] = cz - tz * h - bz * h;
    p[o + 3] = cx + tx * h - bx * h;
    p[o + 4] = cy + ty * h - by * h;
    p[o + 5] = cz + tz * h - bz * h;
    p[o + 6] = cx + tx * h + bx * h;
    p[o + 7] = cy + ty * h + by * h;
    p[o + 8] = cz + tz * h + bz * h;
    p[o + 9] = cx - tx * h + bx * h;
    p[o + 10] = cy - ty * h + by * h;
    p[o + 11] = cz - tz * h + bz * h;
  }

  private rebuild() {
    for (let i = 0; i < this.dots.length; i++) this.writeDot(i, this.dots[i]);
    this.geo.setDrawRange(0, this.dots.length * 6);
    this.geo.attributes.position.needsUpdate = true;
  }

  beginStroke() {
    this.last = null;
  }

  // adiciona um ponto (e preenche o caminho desde o ponto anterior, se na mesma superfície)
  add(p: THREE.Vector3, n: THREE.Vector3, surface: number) {
    const prev = this.last;
    const put = (x: number, y: number, z: number) => {
      if (this.dots.length >= CAP) return;
      const d: ChalkDot = { x, y, z, nx: n.x, ny: n.y, nz: n.z, s: surface };
      this.dots.push(d);
      this.writeDot(this.dots.length - 1, d);
    };
    if (prev && prev.s === surface && prev.nx * n.x + prev.ny * n.y + prev.nz * n.z > 0.9) {
      const dx = p.x - prev.x;
      const dy = p.y - prev.y;
      const dz = p.z - prev.z;
      const len = Math.hypot(dx, dy, dz);
      if (len < STEP) return; // ainda não andou o bastante
      if (len < 0.7) {
        const k = Math.floor(len / STEP);
        for (let i = 1; i <= k; i++) put(prev.x + (dx * i) / k, prev.y + (dy * i) / k, prev.z + (dz * i) / k);
      } else {
        put(p.x, p.y, p.z);
      }
    } else {
      put(p.x, p.y, p.z);
    }
    this.last = this.dots[this.dots.length - 1] ?? null;
    this.geo.setDrawRange(0, this.dots.length * 6);
    this.geo.attributes.position.needsUpdate = true;
    this.revision++;
  }

  // borracha: remove os pontinhos a até r metros de p
  erase(p: THREE.Vector3, r: number): number {
    const r2 = r * r;
    const keep: ChalkDot[] = [];
    for (const d of this.dots) {
      const dx = d.x - p.x;
      const dy = d.y - p.y;
      const dz = d.z - p.z;
      if (dx * dx + dy * dy + dz * dz > r2) keep.push(d);
    }
    const removed = this.dots.length - keep.length;
    if (removed > 0) {
      this.dots.length = 0;
      for (const d of keep) this.dots.push(d);
      this.rebuild();
      this.revision++;
    }
    this.last = null;
    return removed;
  }

  clear(): number {
    const n = this.dots.length;
    this.dots.length = 0;
    this.rebuild();
    this.revision++;
    this.last = null;
    return n;
  }

  dotsOn(surface: number): ChalkDot[] {
    return this.dots.filter((d) => d.s === surface);
  }
}
