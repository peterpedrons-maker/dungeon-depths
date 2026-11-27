// OS CORREDORES DE LIGAÇÃO (DESIGN.md §73, passo 2): com as salas espalhadas pela planta (e giradas), o corredor da porta de uma sala (3,2 m,
// feito pela própria sala) já não desemboca direto na entrada da próxima. O motor completa o caminho com um corredor de pedra do MESMO corte
// (1,9 m de largura, 2,65 m de altura), reto, em L ou em Z, sempre em ângulos retos: sai reto da porta, vira no meio e chega reto na entrada.
// Coordenadas do MUNDO (o grupo fica na origem). O corredor pertence à sala da porta (é a saída dela).
import * as THREE from 'three';
import { ARCH_TOP, CORRIDOR, DW, Kit } from './kit';
import type { Rect } from './types';

export type XZ = [number, number];
const RB = 2.0; // quanto o corredor anda reto antes de chegar à entrada
const WALL = 0.3; // espessura das paredes

// o caminho: da ponta do corredor da porta (`a`, saindo na direção `da`) até a entrada (`b`, entrando na direção `db`), em ângulos retos.
// Mesma regra da ferramenta da planta (tools/planta/plan.py, `route`), para o desenho e o jogo baterem.
export function route(a: XZ, da: XZ, b: XZ, db: XZ): XZ[] {
  const q1: XZ = [b[0] - db[0] * RB, b[1] - db[1] * RB];
  const pts: XZ[] = [a];
  const eq = (u: number, v: number) => Math.abs(u - v) < 0.05;
  if (!eq(a[0], q1[0]) && !eq(a[1], q1[1])) {
    const alongX = da[0] !== 0;
    if (alongX === (db[0] !== 0)) {
      // saída e chegada na mesma linha: em Z (o meio na perpendicular); em sentidos opostos, em U (o meio no ponto mais longe)
      if (alongX) {
        const mx = da[0] === db[0] ? (a[0] + q1[0]) / 2 : da[0] > 0 ? Math.max(a[0], q1[0]) : Math.min(a[0], q1[0]);
        pts.push([mx, a[1]], [mx, q1[1]]);
      } else {
        const mz = da[1] === db[1] ? (a[1] + q1[1]) / 2 : da[1] > 0 ? Math.max(a[1], q1[1]) : Math.min(a[1], q1[1]);
        pts.push([a[0], mz], [q1[0], mz]);
      }
    } else pts.push(alongX ? [q1[0], a[1]] : [a[0], q1[1]]);
  }
  pts.push(q1, b);
  // tira pontos repetidos e os que ficam no meio de uma reta
  const out: XZ[] = [];
  for (const p of pts) {
    const l = out[out.length - 1];
    if (l && eq(l[0], p[0]) && eq(l[1], p[1])) continue;
    if (out.length >= 2) {
      const k = out[out.length - 2];
      if ((eq(k[0], l[0]) && eq(l[0], p[0])) || (eq(k[1], l[1]) && eq(l[1], p[1]))) out.pop();
    }
    out.push(p);
  }
  return out;
}

export interface Connector {
  from: number; // a sala da porta (dona do corredor)
  to: number;
  pts: XZ[];
  y: number; // o nível do chão
  group: THREE.Group;
  floors: Rect[]; // o chão, retângulo por trecho (para saber se um ponto está no corredor)
  rects: Rect[]; // as paredes (colisão)
  dispose(): void;
}

const MATS = new Map<string, { wallM: THREE.Material; ceilM: THREE.Material; floorM: THREE.Material }>(); // (um jogo de texturas por tema)

// `pts` = o caminho (mundo), `y` = o chão, `theme` = a pedra da sala da porta
export function buildConnector(from: number, to: number, pts: XZ[], y: number, theme: string): Connector {
  const kit = new Kit(theme);
  const w = 2 * DW;
  const h = ARCH_TOP;
  let m = MATS.get(theme);
  if (!m) MATS.set(theme, (m = { wallM: kit.brick([1, 1], 0.85, 71), ceilM: kit.brick([1, 1], 0.7, 72), floorM: kit.floorMat([1, 1]) }));
  const { wallM, ceilM, floorM } = m;
  const floors: Rect[] = [];
  const rects: Rect[] = [];
  const top = y + 3.5;
  const n = pts.length - 1;
  const dirOf = (k: number): XZ => {
    const [ax, az] = pts[k];
    const [bx, bz] = pts[k + 1];
    return [Math.sign(bx - ax), Math.sign(bz - az)];
  };
  // chão e teto: um retângulo por trecho; o quadrado da curva fica com o trecho que chega nela
  for (let k = 0; k < n; k++) {
    const [dx, dz] = dirOf(k);
    const s = k > 0 ? w / 2 : 0;
    const e = k < n - 1 ? w / 2 : 0;
    const ax = pts[k][0] + dx * s;
    const az = pts[k][1] + dz * s;
    const bx = pts[k + 1][0] + dx * e;
    const bz = pts[k + 1][1] + dz * e;
    const x0 = Math.min(ax, bx) - (dx === 0 ? w / 2 : 0);
    const x1 = Math.max(ax, bx) + (dx === 0 ? w / 2 : 0);
    const z0 = Math.min(az, bz) - (dz === 0 ? w / 2 : 0);
    const z1 = Math.max(az, bz) + (dz === 0 ? w / 2 : 0);
    if (x1 - x0 < 0.01 || z1 - z0 < 0.01) continue;
    floors.push([x0, z0, x1, z1]);
    kit.box(x1 - x0, 0.2, z1 - z0, floorM, (x0 + x1) / 2, y - 0.1, (z0 + z1) / 2, false);
    kit.box(x1 - x0, 0.2, z1 - z0, ceilM, (x0 + x1) / 2, y + h + 0.1, (z0 + z1) / 2, false);
  }
  // as paredes: as duas bordas do caminho, afastadas meia largura (nas curvas, as bordas se encontram no canto)
  for (const side of [-1, 1]) {
    const off: XZ[] = [];
    for (let k = 0; k <= n; k++) {
      const din = k > 0 ? dirOf(k - 1) : null;
      const dout = k < n ? dirOf(k) : null;
      const nl = (d: XZ): XZ => nl0(d, side);
      let ox = 0;
      let oz = 0;
      if (din) {
        const v = nl(din);
        ox += v[0];
        oz += v[1];
      }
      if (dout) {
        const v = nl(dout);
        if (!din || v[0] !== nl(din)[0] || v[1] !== nl(din)[1]) {
          ox += v[0];
          oz += v[1];
        }
      }
      off.push([pts[k][0] + (ox * w) / 2, pts[k][1] + (oz * w) / 2]);
    }
    for (let k = 0; k < n; k++) {
      const [ax, az] = off[k];
      const [bx, bz] = off[k + 1];
      const d = dirOf(k);
      const v = nl0(d, side); // para fora
      const len = Math.hypot(bx - ax, bz - az);
      if (len < 0.01) continue;
      const cx = (ax + bx) / 2 + (v[0] * WALL) / 2;
      const cz = (az + bz) / 2 + (v[1] * WALL) / 2;
      const sx = d[0] !== 0 ? len : WALL;
      const sz = d[0] !== 0 ? WALL : len;
      kit.box(sx, h, sz, wallM, cx, y + h / 2, cz, false);
      rects.push([cx - sx / 2, cz - sz / 2, cx + sx / 2, cz + sz / 2, top]);
      // o canto de fora da curva (atrás das duas paredes): fechado na colisão
      if (k < n - 1) {
        const v2 = nl0(dirOf(k + 1), side);
        const ex = bx + (v[0] + v2[0]) * WALL;
        const ez = bz + (v[1] + v2[1]) * WALL;
        rects.push([Math.min(bx, ex), Math.min(bz, ez), Math.max(bx, ex), Math.max(bz, ez), top]);
      }
    }
  }
  kit.bake();
  const group = kit.group;
  group.userData.connector = true;
  return {
    from,
    to,
    pts,
    y,
    group,
    floors,
    rects,
    dispose() {
      group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) m.geometry.dispose();
      });
    },
  };
}

// a normal "para fora" de um dos dois lados (`side` = -1 ou +1) de quem anda na direção `d`
function nl0(d: XZ, side: number): XZ {
  return [-d[1] * -side, d[0] * -side];
}

// a ponta do corredor da porta: `CORRIDOR` metros além da porta, na direção de saída
export const corridorEnd = (door: XZ, dir: XZ): XZ => [door[0] + dir[0] * CORRIDOR, door[1] + dir[1] * CORRIDOR];
