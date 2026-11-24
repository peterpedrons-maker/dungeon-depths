// Rabiscos de outros condenados: desenhos riscados na pedra ao lado dos glifos, só nas primeiras vezes em que uma palavra aparece (ver DESIGN.md §22).
// Ficam claramente "feitos à mão": traço tremido, falhas, sulco escuro com um fio claro por cima, sem cor viva.

import * as THREE from 'three';

export type SketchKind = 'braseiro';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 160; // pixels do rabisco

type Pt = [number, number];

function draw(kind: SketchKind, seed: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = N;
  c.height = N;
  const g = c.getContext('2d')!;
  const r = rng(seed);
  // um traço à mão: pontos interpolados com tremor, e pequenas falhas (a lasca de pedra que estragou o risco)
  const stroke = (pts: Pt[], color: string, w: number, jit = 1.6, gaps = true) => {
    g.strokeStyle = color;
    g.lineWidth = w;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const steps = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 6));
      g.beginPath();
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const x = x0 + (x1 - x0) * t + (r() - 0.5) * jit * 2;
        const y = y0 + (y1 - y0) * t + (r() - 0.5) * jit * 2;
        if (s === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
      if (gaps && r() < 0.18) {
        // falha: apaga um pedacinho do risco
        g.save();
        g.globalCompositeOperation = 'destination-out';
        const t = r();
        g.beginPath();
        g.arc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 2.6 + r() * 2, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    }
  };
  // cada traço é riscado duas vezes: sulco escuro (largo) e fio claro (estreito) por cima, deslocado um pouco
  const scratch = (pts: Pt[], light = '#cfc3a6', jit = 1.6) => {
    const seedState = r();
    void seedState;
    stroke(pts, '#17120f', 7, jit);
    stroke(pts.map(([x, y]) => [x - 0.6, y - 0.6] as Pt), light, 3, jit * 0.6);
  };
  if (kind === 'braseiro') {
    // pedestal
    scratch([[56, 150], [56, 96], [104, 96], [104, 150]]);
    scratch([[56, 150], [104, 150]]);
    // hachuras no pedestal (como quem fez com a ponta de um prego)
    for (let i = 0; i < 4; i++) scratch([[62 + i * 11, 104], [60 + i * 11, 142]], '#a89c80', 1);
    // tigela
    scratch([[36, 70], [52, 96], [108, 96], [124, 70], [36, 70]]);
    // brasas
    for (const [x, y] of [[66, 80], [82, 84], [98, 80]] as Pt[]) scratch([[x - 4, y], [x, y - 4], [x + 4, y], [x, y + 4], [x - 4, y]], '#cfc3a6', 0.8);
    // chamas: três línguas, a do meio maior (em ocre, a única cor do desenho)
    const flame = (cx: number, base: number, h: number, wd: number) => {
      const pts: Pt[] = [
        [cx - wd, base],
        [cx - wd * 0.9, base - h * 0.45],
        [cx - wd * 0.2, base - h * 0.72],
        [cx, base - h],
        [cx + wd * 0.3, base - h * 0.62],
        [cx + wd * 0.95, base - h * 0.4],
        [cx + wd, base],
      ];
      stroke(pts, '#17120f', 7, 1.4);
      stroke(pts.map(([x, y]) => [x - 0.6, y - 0.6] as Pt), '#e0a860', 3, 1);
    };
    flame(62, 68, 34, 11);
    flame(80, 68, 52, 14);
    flame(99, 68, 30, 11);
    // faíscas
    for (const [x, y] of [[48, 22], [112, 28], [92, 8]] as Pt[]) scratch([[x - 2, y], [x + 2, y]], '#e0a860', 0.4);
  }
  return c;
}

export interface SketchOpts {
  x: number;
  y: number;
  z: number;
  nx: number; // para onde a parede "olha"
  nz: number;
  size: number; // lado do desenho (m)
  seed?: number;
}

export function makeSketch(group: THREE.Group, kind: SketchKind, o: SketchOpts) {
  const cv = draw(kind, o.seed ?? 5);
  const t = new THREE.CanvasTexture(cv);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshLambertMaterial({
    map: t,
    transparent: true,
    alphaTest: 0.02,
    depthWrite: false,
    emissive: 0xffffff,
    emissiveMap: t,
    emissiveIntensity: 0.3,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -4,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(o.size, o.size), mat);
  m.position.set(o.x, o.y, o.z);
  m.rotation.y = Math.atan2(o.nx, o.nz);
  m.renderOrder = 1;
  group.add(m);
  return { mesh: m, mat };
}
