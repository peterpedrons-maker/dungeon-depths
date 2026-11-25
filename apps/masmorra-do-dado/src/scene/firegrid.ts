// ESCREVER COM FOGO (PUZZLES_PROPOSTAS.md §1, M1/M2/M9): os glifos da língua são pontos numa grade 3x3, e os números são as faces do dado.
// Então fogo em grade é ESCRITA. Este módulo tem as peças que as salas usam:
//  · FireGrid: a lógica de uma grade de 9 casas (acesas) com CANALETAS dirigidas (o fogo corre de uma casa a outra e a canaleta fica queimada);
//  · makeWallBoard: a LOUSA de fogo na parede (9 lampiões de bronze num quadro de pedra; o dado de Fogo acende o lampião mirado);
//  · makeFloorChannel: a canaleta talhada no chão entre dois braseiros (chevrons mostram para onde o óleo escorre);
//  · makeLivePanel: a CASA LISA de uma frase, que copia ao vivo o desenho de uma lousa;
//  · makeTorch: tocha que o dado acende e que se apaga sozinha (constelações, §3);
//  · makeRiser: braseiro escondido sob rachaduras FRIAS que sobe do chão;
//  · makeGemNiche: o nicho secreto com uma gema (o colecionável).
// Casas: i = linha*3 + coluna, linha 0 em cima (ou, no chão, do lado da porta), coluna 0 à esquerda de quem olha.

import * as THREE from 'three';
import { lambert, type Kit } from './kit';
import { makeBrazier, type Brazier } from './brazier';
import { drawGlyph } from '../book/font';
import { LEX, type GlyphDef } from '../story/lexicon';
import type { Box, Ctx, Interactable } from './types';
import type { Inscription } from './inscription';

export const edgeKey = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;

// o desenho de uma palavra em pontos e linhas (os pontos incluem as pontas das linhas)
export function glyphPattern(id: string): { p: number[]; l: string[] } {
  const g = LEX[id]?.g;
  if (!g) return { p: [], l: [] };
  const p = [...new Set([...(g.p ?? []), ...(g.l ?? []).flat()])].sort((a, b) => a - b);
  return { p, l: (g.l ?? []).map(([a, b]) => edgeKey(a, b)).sort() };
}
// a grade escreve esta palavra? Número (sem linhas) = só os pontos; verbo (com linhas) = pontos E linhas
export function writes(points: number[], lines: Iterable<string>, id: string) {
  const g = glyphPattern(id);
  const pts = [...points].sort((a, b) => a - b);
  if (pts.join() !== g.p.join()) return false;
  if (!g.l.length) return true;
  return [...lines].sort().join() === g.l.join();
}

const tex = (c: HTMLCanvasElement, repeat = false) => {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
};

// ── a lógica da grade ──────────────────────────────────────────────────────
export interface GridNodeVis {
  set(on: boolean, quiet: boolean): void;
  update?(dt: number, t: number): void;
}
export interface GridEdgeVis {
  set(k: number, burnt: boolean): void; // k = 0..1, quanto o fogo já correu
}
export interface GridEdge {
  a: number;
  b: number;
  vis?: GridEdgeVis;
}
export class FireGrid {
  lit: boolean[] = Array(9).fill(false);
  burnt = new Set<string>();
  private runs: { e: GridEdge; u: number }[] = [];
  constructor(
    public nodes: (GridNodeVis | null)[],
    public edges: GridEdge[] = [],
    public runTime = 0.6,
    private onSpread?: (i: number) => void,
  ) {}
  // fogo na casa i; `quiet` = sem som (o motor já tocou o do dado)
  ignite(i: number, quiet = true) {
    if (this.lit[i] || !this.nodes[i]) return;
    this.lit[i] = true;
    this.nodes[i]!.set(true, quiet);
    for (const e of this.edges) {
      if (e.a !== i || this.burnt.has(edgeKey(e.a, e.b)) || this.runs.some((r) => r.e === e)) continue;
      this.runs.push({ e, u: 0 });
    }
  }
  tick(dt: number) {
    for (const r of [...this.runs]) {
      r.u += dt / this.runTime;
      r.e.vis?.set(Math.min(1, r.u), false);
      if (r.u >= 1) {
        this.runs.splice(this.runs.indexOf(r), 1);
        this.burnt.add(edgeKey(r.e.a, r.e.b));
        r.e.vis?.set(1, true);
        if (!this.lit[r.e.b]) {
          this.ignite(r.e.b, true);
          this.onSpread?.(r.e.b);
        }
      }
    }
  }
  running() {
    return this.runs.length > 0;
  }
  points() {
    return this.lit.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
  }
  writes(id: string) {
    return writes(this.points(), this.burnt, id);
  }
  clear(quiet = true) {
    this.runs = [];
    this.burnt.clear();
    for (const e of this.edges) e.vis?.set(0, false);
    this.lit.forEach((v, i) => {
      if (v) this.nodes[i]?.set(false, quiet);
      this.lit[i] = false;
    });
  }
  update(dt: number, t: number) {
    this.tick(dt);
    for (const n of this.nodes) n?.update?.(dt, t);
  }
}

// ── texturas ──────────────────────────────────────────────────────────────
let grooveTex: THREE.CanvasTexture | null = null;
function grooveTexture() {
  // sulco escuro com chevrons claros apontando para +x (para onde o óleo escorre)
  if (grooveTex) return grooveTex;
  const [c, g] = canvas(32, 16);
  g.fillStyle = '#17121a';
  g.fillRect(0, 0, 32, 16);
  g.fillStyle = '#2a2230';
  g.fillRect(0, 2, 32, 1);
  g.fillRect(0, 13, 32, 1);
  g.fillStyle = '#7a6a58';
  for (let k = 0; k < 5; k++) {
    g.fillRect(8 + k, 3 + k, 2, 1);
    g.fillRect(8 + k, 12 - k, 2, 1);
  }
  grooveTex = tex(c, true);
  return grooveTex;
}
let oilTex: THREE.CanvasTexture | null = null;
function burntTexture() {
  if (oilTex) return oilTex;
  const [c, g] = canvas(32, 16);
  g.fillStyle = '#ff6a22';
  g.fillRect(0, 3, 32, 10);
  g.fillStyle = '#ffb048';
  for (let x = 0; x < 32; x += 3) g.fillRect(x, 5 + ((x * 7) % 6), 2, 2);
  g.fillStyle = '#ffe08a';
  g.fillRect(0, 7, 32, 2);
  oilTex = tex(c, true);
  return oilTex;
}
// quadro de pedra clara da lousa (moldura talhada e nove cavidades)
function boardTexture(cells: number[], bronze: boolean, cold: boolean) {
  const N = 96;
  const [c, g] = canvas(N, N);
  g.fillStyle = bronze ? '#3a2a1e' : '#6f6a66';
  g.fillRect(0, 0, N, N);
  // textura da pedra
  let s = 7;
  for (let i = 0; i < 260; i++) {
    s = (s * 16807) % 2147483647;
    const x = s % N;
    const y = Math.floor(s / N) % N;
    g.fillStyle = bronze ? (i % 2 ? '#4a3726' : '#2c2018') : i % 2 ? '#7f7a74' : '#5a5450';
    g.fillRect(x, y, 2, 1);
  }
  g.fillStyle = '#15110f';
  g.fillRect(0, 0, N, 4);
  g.fillRect(0, N - 4, N, 4);
  g.fillRect(0, 0, 4, N);
  g.fillRect(N - 4, 0, 4, N);
  g.fillStyle = bronze ? '#b0814a' : '#f1ebd9';
  g.fillRect(6, 6, N - 12, 2);
  g.fillRect(6, N - 8, N - 12, 2);
  g.fillRect(6, 6, 2, N - 12);
  g.fillRect(N - 8, 6, 2, N - 12);
  for (const i of cells) {
    const cx = 16 + (i % 3) * 32;
    const cy = 16 + Math.floor(i / 3) * 32;
    g.fillStyle = '#0c0a10';
    g.fillRect(cx - 7, cy - 7, 14, 14);
    g.fillStyle = cold ? '#2a2733' : '#3a2a20';
    g.fillRect(cx - 5, cy - 5, 10, 10);
  }
  return tex(c);
}

// ── lousa de parede ───────────────────────────────────────────────────────
export interface WallBoardOpts {
  x: number;
  y: number;
  z: number;
  nx: number;
  nz: number; // para onde a parede olha (de onde se lê)
  step?: number; // distância entre lampiões (m)
  cells?: number[]; // quais casas têm lampião (padrão: as 9)
  edges?: [number, number][]; // canaletas [de, para]
  bronze?: boolean; // pontinhos de bronze (a porta-lousa)
  cold?: boolean; // soquete frio (lousa secreta)
  key: string; // a cena do dado queimando: só a 1ª vez de cada lousa é longa
  parent?: THREE.Object3D; // onde pendurar (padrão: a sala); a porta-lousa sobe com a laje
}
export interface WallBoard {
  grid: FireGrid;
  center: THREE.Vector3;
  normal: THREE.Vector3;
  group: THREE.Group;
  lift: number; // deslocamento vertical (a porta-lousa sobe com a laje)
  hit(): number; // casa que o dado de Fogo está tocando agora (ou -1)
  cellPos(i: number): THREE.Vector3; // posição (local da sala) do lampião i
  update(dt: number, t: number): void;
  setDim(v: number): void; // 0 = adormecida (lampiões escuros), 1 = viva
}

export function makeWallBoard(kit: Kit, ctx: Ctx, o: WallBoardOpts): WallBoard {
  const step = o.step ?? 0.48;
  const cells = o.cells ?? [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const n = new THREE.Vector3(o.nx, 0, o.nz).normalize();
  const right = new THREE.Vector3(n.z, 0, -n.x); // a direita de quem lê
  const ry = Math.atan2(o.nx, o.nz);
  const g = new THREE.Group();
  g.position.set(o.x, o.y, o.z);
  g.rotation.y = ry;
  (o.parent ?? kit.group).add(g);
  const size = step * 3 + 0.2;
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshLambertMaterial({ map: boardTexture(cells, !!o.bronze, !!o.cold), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }),
  );
  plate.position.z = 0.012;
  g.add(plate);
  kit.surfaces.push(plate); // dá para posicionar o dado mirando a lousa
  const local = (i: number) => new THREE.Vector3(((i % 3) - 1) * step, (1 - Math.floor(i / 3)) * step, 0);
  const cupMat = lambert(null, o.bronze ? 0x8a6034 : 0x5a4a3a);
  const glowMats: THREE.MeshBasicMaterial[] = [];
  let dim = 1;
  const nodes: (GridNodeVis | null)[] = Array(9).fill(null);
  const flames: (THREE.Sprite | null)[] = Array(9).fill(null);
  for (const i of cells) {
    const p = local(i);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.055, 0.07, 6), cupMat);
    cup.rotation.x = Math.PI / 2;
    cup.position.set(p.x, p.y - 0.02, 0.05);
    g.add(cup);
    const gm = new THREE.MeshBasicMaterial({ color: 0x2a1a14, fog: false });
    glowMats.push(gm);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.045, 6), gm);
    dot.position.set(p.x, p.y - 0.02, 0.087);
    g.add(dot);
    const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
    fl.scale.set(0.24, 0.2, 1);
    fl.position.set(p.x, p.y + 0.07, 0.1);
    fl.visible = false;
    g.add(fl);
    flames[i] = fl;
    nodes[i] = {
      set(on) {
        fl.visible = on;
        gm.color.setHex(on ? 0xffb048 : 0x2a1a14);
      },
      update(_dt, t) {
        if (fl.visible) fl.material.map = kit.frames[Math.floor(t * 9 + i * 1.7) % kit.frames.length];
      },
    };
  }
  // canaletas: sulco com chevrons, e por cima a faixa de fogo que cresce de uma ponta à outra
  const edges: GridEdge[] = (o.edges ?? []).map(([a, b]) => {
    const pa = local(a);
    const pb = local(b);
    const d = pb.clone().sub(pa);
    const len = d.length() - 0.2;
    const ang = Math.atan2(d.y, d.x);
    const start = pa.clone().addScaledVector(d.normalize(), 0.1);
    const gt = grooveTexture().clone();
    gt.needsUpdate = true;
    gt.repeat.set(len / 0.09, 1);
    const grooveGeo = new THREE.PlaneGeometry(len, 0.07);
    grooveGeo.translate(len / 2, 0, 0);
    const groove = new THREE.Mesh(grooveGeo, new THREE.MeshLambertMaterial({ map: gt, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -3 }));
    groove.position.set(start.x, start.y, 0.016);
    groove.rotation.z = ang;
    g.add(groove);
    const bt = burntTexture().clone();
    bt.needsUpdate = true;
    bt.repeat.set(len / 0.09, 1);
    const bgeo = new THREE.PlaneGeometry(len, 0.05);
    bgeo.translate(len / 2, 0, 0);
    const bm = new THREE.MeshBasicMaterial({ map: bt, fog: false, transparent: true, depthWrite: false });
    const burn = new THREE.Mesh(bgeo, bm);
    burn.position.set(start.x, start.y, 0.02);
    burn.rotation.z = ang;
    burn.scale.x = 0.0001;
    burn.visible = false;
    g.add(burn);
    const front = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
    front.scale.set(0.14, 0.12, 1);
    front.visible = false;
    g.add(front);
    return {
      a,
      b,
      vis: {
        set(k, burnt) {
          burn.visible = k > 0.001;
          burn.scale.x = Math.max(0.0001, k);
          bm.color.setScalar(burnt ? 0.75 : 1);
          front.visible = k > 0.001 && k < 1;
          front.position.set(start.x + Math.cos(ang) * len * k, start.y + Math.sin(ang) * len * k + 0.04, 0.05);
          front.material.map = kit.frames[Math.floor(performance.now() / 110) % kit.frames.length];
        },
      },
    };
  });
  const light = kit.light(o.x + n.x * 1.1, o.y, o.z + n.z * 1.1, 0xff8a2a, 0);
  const grid = new FireGrid(nodes, edges, 0.6, () => ctx.sfx('spread'));
  const center = new THREE.Vector3(o.x, o.y, o.z);
  const tmp = new THREE.Vector3();
  const board: WallBoard = {
    grid,
    center,
    normal: n,
    group: g,
    lift: 0,
    cellPos(i) {
      const p = local(i);
      return center.clone().addScaledVector(right, p.x).add(new THREE.Vector3(0, p.y + board.lift, 0)).addScaledVector(n, 0.08);
    },
    hit() {
      const d = ctx.die;
      if (dim < 0.5 || d.face !== 3 || (d.state !== 'flying' && d.state !== 'rest')) return -1;
      tmp.copy(d.pos).sub(center);
      tmp.y -= board.lift;
      const dn = tmp.dot(n);
      if (dn < -0.05 || dn > 0.45) return -1;
      const u = tmp.dot(right);
      const v = tmp.y;
      let best = -1;
      let bd = step * 0.64;
      for (const i of cells) {
        const p = local(i);
        const dd = Math.hypot(u - p.x, v - p.y);
        if (dd < bd) {
          bd = dd;
          best = i;
        }
      }
      return best;
    },
    update(dt, t) {
      grid.update(dt, t);
      g.position.y = o.y + board.lift;
      light.pos.y = o.y + board.lift;
      const nLit = grid.points().length;
      light.intensity = nLit ? 3 + 1.6 * nLit : 0;
      void flames;
    },
    setDim(v) {
      dim = v;
      cupMat.color.setHex(v > 0.5 ? (o.bronze ? 0x8a6034 : 0x5a4a3a) : 0x2c2630);
    },
  };
  return board;
}

// ── canaleta no chão entre dois braseiros ───────────────────────────────────
export function makeFloorChannel(kit: Kit, ax: number, az: number, bx: number, bz: number, inset = 0.5): GridEdgeVis {
  const dx = bx - ax;
  const dz = bz - az;
  const L = Math.hypot(dx, dz);
  const len = L - 2 * inset;
  const ux = dx / L;
  const uz = dz / L;
  const sx = ax + ux * inset;
  const sz = az + uz * inset;
  const yaw = Math.atan2(-dz, dx);
  const mk = (w: number, mat: THREE.Material, y: number) => {
    const geo = new THREE.PlaneGeometry(len, w);
    geo.rotateX(-Math.PI / 2);
    geo.translate(len / 2, 0, 0);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(sx, y, sz);
    m.rotation.y = yaw;
    kit.group.add(m);
    return m;
  };
  const gt = grooveTexture().clone();
  gt.needsUpdate = true;
  gt.repeat.set(len / 0.32, 1);
  mk(0.3, new THREE.MeshLambertMaterial({ map: gt, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -3 }), 0.008);
  const bt = burntTexture().clone();
  bt.needsUpdate = true;
  bt.repeat.set(len / 0.32, 1);
  const bm = new THREE.MeshBasicMaterial({ map: bt, fog: false, transparent: true, depthWrite: false });
  const burn = mk(0.18, bm, 0.014);
  burn.scale.x = 0.0001;
  burn.visible = false;
  const front = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
  front.scale.set(0.42, 0.36, 1);
  front.visible = false;
  kit.group.add(front);
  const lamp = kit.light(sx, 0.5, sz, 0xff7a2e, 0);
  return {
    set(k, burnt) {
      burn.visible = k > 0.001;
      burn.scale.x = Math.max(0.0001, k);
      bm.color.setScalar(burnt ? 0.7 : 1);
      front.visible = k > 0.001 && k < 1;
      front.position.set(sx + ux * len * k, 0.18, sz + uz * len * k);
      front.material.map = kit.frames[Math.floor(performance.now() / 110) % kit.frames.length];
      lamp.pos.set(sx + ux * len * k, 0.5, sz + uz * len * k);
      lamp.intensity = front.visible ? 16 : 0;
    },
  };
}

// ── casa lisa que copia a lousa ─────────────────────────────────────────────
// Usa a lacuna (palavra `null`) de uma inscrição e desenha nela, ao vivo, os pontos (e linhas) acesos.
export function makeLivePanel(ins: Inscription) {
  const panel = ins.panels.find((p) => !p.id);
  if (!panel) throw new Error('a inscrição precisa de uma lacuna (palavra null)');
  const CELL = 96;
  const PAD = 14;
  const [c, g] = canvas(CELL + PAD * 2, CELL + PAD * 2);
  const t = tex(c);
  panel.mat.map = t;
  panel.mat.emissive.setHex(0xffffff);
  panel.mat.emissiveMap = t;
  panel.mat.emissiveIntensity = 0.25;
  panel.mat.needsUpdate = true;
  let last = '';
  return {
    draw(points: number[], lines: [number, number][] = [], color = '#ffb048', glow = 0.25) {
      const k = points.join() + '|' + lines.join() + color;
      panel.mat.emissiveIntensity = glow;
      if (k === last) return;
      last = k;
      g.fillStyle = '#15110f';
      g.fillRect(PAD - 6, PAD - 6, CELL + 12, CELL + 12);
      g.fillStyle = '#6b6870';
      g.fillRect(PAD - 2, PAD - 2, CELL + 4, CELL + 4);
      g.fillStyle = '#4a4752';
      g.fillRect(PAD, PAD, CELL, CELL);
      if (points.length || lines.length) {
        const def: GlyphDef = { p: points, ring: [], big: [], l: lines };
        const size = (CELL / 0.86) * 0.94;
        for (let a = 0; a < 8; a++) drawGlyph(g, def, Math.round(PAD + CELL / 2 + Math.cos((a / 8) * Math.PI * 2) * 3), Math.round(PAD + CELL / 2 + Math.sin((a / 8) * Math.PI * 2) * 3), size, '#2a1208');
        drawGlyph(g, def, PAD + CELL / 2, PAD + CELL / 2, size, color);
      }
      t.needsUpdate = true;
    },
  };
}

// ── tocha acendível (constelações) ──────────────────────────────────────────
export interface Torch {
  pos: THREE.Vector3; // a chama (local da sala)
  lit: boolean;
  touched(): boolean;
  light(on: boolean, quiet?: boolean): void;
  update(dt: number, t: number, paused: boolean): void;
}
export function makeTorch(kit: Kit, ctx: Ctx, x: number, y: number, z: number, nx: number, nz: number, life = 40): Torch {
  kit.box(Math.abs(nz) > 0 ? 0.2 : 0.08, 0.2, Math.abs(nx) > 0 ? 0.2 : 0.08, kit.stone, x, y - 0.05, z, false);
  kit.box(0.1, 0.6, 0.1, lambert(null, 0x5a3a24), x + nx * 0.16, y + 0.12, z + nz * 0.16, false);
  // a cabeça da tocha: pano enrolado (escuro quando apagada)
  kit.box(0.16, 0.14, 0.16, lambert(null, 0x2a2026), x + nx * 0.16, y + 0.45, z + nz * 0.16, false);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
  sprite.scale.set(0.38, 0.3, 1);
  const pos = new THREE.Vector3(x + nx * 0.16, y + 0.57, z + nz * 0.16);
  sprite.position.copy(pos);
  sprite.visible = false;
  kit.group.add(sprite);
  const light = kit.light(x + nx * 0.45, y + 0.6, z + nz * 0.45, 0xff9a3c, 0);
  let left = 0;
  const tc: Torch = {
    pos,
    lit: false,
    touched() {
      const d = ctx.die;
      return !tc.lit && (d.state === 'flying' || d.state === 'rest') && d.face === 3 && d.pos.distanceTo(pos) < 0.55;
    },
    light(on, quiet = false) {
      if (tc.lit === on) return;
      tc.lit = on;
      left = life;
      sprite.visible = on;
      if (!on) light.intensity = 0;
      if (!on && !quiet) ctx.sfx('burnout');
    },
    update(dt, t, paused) {
      if (!tc.lit) return;
      if (!paused) left -= dt;
      const k = left < 6 ? Math.max(0.2, left / 6) : 1; // a chama encolhe nos últimos segundos
      sprite.scale.set(0.38 * k, 0.3 * k, 1);
      sprite.material.map = kit.frames[Math.floor(t * 8 + x * 3 + z) % kit.frames.length];
      light.intensity = 34 * k * (0.97 + 0.03 * Math.sin(t * 5 + x));
      if (left <= 0) tc.light(false);
    },
  };
  return tc;
}

// ── rachaduras frias e o braseiro que sobe ─────────────────────────────────
function coldCracks(seed: number) {
  const N = 96;
  const [a, ga] = canvas(N, N);
  let s = seed >>> 0;
  const r = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - N / 2 + 0.5, y - N / 2 + 0.5);
      if (d > 38 && d < 42) {
        ga.fillStyle = r() < 0.2 ? '#6a6478' : '#2a2536';
        ga.fillRect(x, y, 1, 1);
      }
    }
  for (let k = 0; k < 9; k++) {
    let ang = (k / 9) * Math.PI * 2 + r() * 0.4;
    let px = N / 2;
    let py = N / 2;
    for (let st = 0; st < 40; st++) {
      ang += (r() - 0.5) * 0.6;
      px += Math.cos(ang);
      py += Math.sin(ang);
      ga.fillStyle = '#0c0a12';
      ga.fillRect(Math.round(px), Math.round(py), 2, 2);
      // frestas FRIAS: cinza-azulado, sem brasa (o sinal das constelações)
      if (st > 6 && r() < 0.22) {
        ga.fillStyle = '#5a6478';
        ga.fillRect(Math.round(px), Math.round(py), 1, 1);
      }
    }
  }
  return tex(a);
}
export interface Riser {
  brazier: Brazier;
  boxes: Box[];
  up: boolean;
  k: number;
  raise(): void;
  update(dt: number, t: number): void;
  reset(): void;
  rect(): [number, number, number, number] | null;
}
export function makeRiser(kit: Kit, ctx: Ctx, x: number, z: number, scale = 1): Riser {
  const RISE = 2.7;
  const start = kit.group.children.length;
  const br = makeBrazier(kit, ctx, x, z, false, scale);
  const grp = new THREE.Group();
  for (const k of kit.group.children.slice(start)) grp.add(k);
  kit.group.add(grp);
  const base = br.boxes.flatMap((b) => [b.min.y, b.max.y]);
  const sockR = br.socket.r;
  const touched = br.touched;
  const cm = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7 * scale + 0.4, 1.7 * scale + 0.4),
    new THREE.MeshLambertMaterial({ map: coldCracks(77 + Math.round(x * 13 + z * 5)), emissive: 0xff7a2e, emissiveIntensity: 0, transparent: true, alphaTest: 0.05, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
  );
  cm.rotation.x = -Math.PI / 2;
  cm.position.set(x, 0.014, z);
  kit.group.add(cm);
  const r: Riser = {
    brazier: br,
    boxes: br.boxes,
    up: false,
    k: 0,
    raise() {
      if (r.up) return;
      r.up = true;
      ctx.sfx('door');
    },
    update(dt, t) {
      if (r.up && r.k < 1) r.k = Math.min(1, r.k + dt / 2.2);
      const e = r.k * r.k * (3 - 2 * r.k);
      const dy = -RISE * (1 - e);
      grp.position.y = dy;
      br.boxes.forEach((b, i) => {
        b.min.y = base[i * 2] + dy;
        b.max.y = base[i * 2 + 1] + dy;
      });
      br.socket.r = r.k >= 1 ? sockR : 0;
      (cm.material as THREE.MeshLambertMaterial).emissiveIntensity = r.up && r.k < 1 ? 1.2 : 0;
      br.update(t);
    },
    reset() {
      r.up = false;
      r.k = 0;
      br.light(false, true);
      r.update(0, 0);
    },
    rect: () => (r.k >= 1 ? br.rect : null),
  };
  br.touched = () => r.k >= 1 && touched();
  r.update(0, 0);
  return r;
}

// ── nicho secreto com a gema ────────────────────────────────────────────────
// Na parede (x, z), olhando para (nx, nz). Fechado é uma laje lisa; aberto, a laje desce e mostra uma gema que brilha.
export function makeGemNiche(kit: Kit, ctx: Ctx, x: number, y: number, z: number, nx: number, nz: number, onTake?: () => void) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = Math.atan2(nx, nz);
  kit.group.add(g);
  const frame = kit.stone;
  for (const [fx, fy, w, h] of [
    [-0.42, 0, 0.14, 0.9],
    [0.42, 0, 0.14, 0.9],
    [0, 0.48, 0.98, 0.14],
    [0, -0.48, 0.98, 0.14],
  ])
    {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.36), frame);
      m.position.set(fx, fy, 0.18);
      g.add(m);
    }
  const back = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.84), lambert(null, 0x24222e));
  back.position.z = 0.01;
  g.add(back);
  const gemMat = new THREE.MeshLambertMaterial({ color: 0x7af0ff, emissive: 0x2ab8e0, emissiveIntensity: 0.7, flatShading: true });
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.13), gemMat);
  gem.position.set(0, -0.05, 0.16);
  g.add(gem);
  const ped = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.2), frame);
  ped.position.set(0, -0.36, 0.16);
  g.add(ped);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.86, 0.12), kit.stone);
  slab.position.set(0, 0, 0.37);
  g.add(slab);
  const light = kit.light(x + nx * 0.5, y, z + nz * 0.5, 0x7ad8ff, 0);
  let open = 0;
  let opening = false;
  let taken = false;
  const it: Interactable = {
    pos: new THREE.Vector3(x + nx * 0.6, y, z + nz * 0.6),
    r: 1.8,
    label: 'Pegar a gema',
    enabled: () => open > 0.95 && !taken,
    use() {
      taken = true;
      gem.visible = false;
      light.intensity = 0;
      ctx.sfx('gem');
      ctx.caption('Uma gema', 'Escondida pela Casa. Nem toda porta é a da frente.', '#7ad8ff');
      onTake?.();
    },
  };
  return {
    interactable: it,
    open() {
      if (opening) return;
      opening = true;
      ctx.sfx('door');
    },
    get taken() {
      return taken;
    },
    update(dt: number, t: number) {
      if (opening && open < 1) open = Math.min(1, open + dt / 1.8);
      slab.position.y = -open * 0.95;
      slab.visible = open < 0.99;
      gem.rotation.y = t * 1.4;
      gem.position.y = -0.05 + Math.sin(t * 2) * 0.03;
      if (!taken) light.intensity = open * (8 + 2 * Math.sin(t * 3));
    },
    // a gema fica com o jogador; a laje só volta a fechar se ela não foi pega
    reset() {
      if (taken) return;
      opening = false;
      open = 0;
    },
  };
}
