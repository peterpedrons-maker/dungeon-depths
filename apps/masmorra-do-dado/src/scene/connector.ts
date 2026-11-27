// OS CORREDORES DE LIGAÇÃO (DESIGN.md §73, passo 2): com as salas espalhadas pela planta (e giradas), o corredor da porta de uma sala (3,2 m,
// feito pela própria sala) já não desemboca direto na entrada da próxima. O motor completa o caminho com um corredor de pedra do MESMO corte
// (1,9 m de largura, 2,65 m de altura), reto, em L ou em Z, sempre em ângulos retos: sai reto da porta, vira no meio e chega reto na entrada.
// Coordenadas do MUNDO (o grupo fica na origem). O corredor pertence à sala da porta (é a saída dela).
import * as THREE from 'three';
import { ARCH_TOP, CORRIDOR, DW, Kit } from './kit';
import { tallyTexture } from './textures';
import { chalkTexture, decalRes } from './chalkdraw';
import type { Rect } from './types';

export type XZ = [number, number];
const RB = 2.0; // quanto o corredor anda reto antes de chegar à entrada
export const LEAD = DW; // quanto o corredor anda reto depois do corredor da porta, antes de virar (a curva não pode encostar no corredor da porta,
// cujas paredes vão até a ponta: virando ali, metade da passagem ficava tapada)
const WALL = 0.3; // espessura das paredes

// o caminho: da ponta do corredor da porta (`a`, saindo na direção `da`) até a entrada (`b`, entrando na direção `db`), em ângulos retos.
// Mesma regra da ferramenta da planta (tools/planta/plan.py, `route`), para o desenho e o jogo baterem.
export function route(a0: XZ, da: XZ, b: XZ, db: XZ, lead = LEAD): XZ[] {
  const eq = (u: number, v: number) => Math.abs(u - v) < 0.05;
  const q1: XZ = [b[0] - db[0] * RB, b[1] - db[1] * RB];
  // (reto até a entrada, sem desvio de lado: direto; senão, primeiro um trecho reto de `lead`)
  const straight = da[0] === db[0] && da[1] === db[1] && (da[0] === 0 ? eq(a0[0], b[0]) : eq(a0[1], b[1]));
  const a: XZ = straight ? a0 : [a0[0] + da[0] * lead, a0[1] + da[1] * lead];
  const pts: XZ[] = straight ? [a] : [a0, a];
  if (!eq(a[0], q1[0]) && !eq(a[1], q1[1])) {
    const alongX = da[0] !== 0;
    if (alongX === (db[0] !== 0)) {
      // saída e chegada na mesma linha: em Z (o meio na perpendicular); em sentidos opostos, em U (o meio no ponto mais longe)
      // (no mesmo sentido, com pouco espaço: a volta fica entre a ponta do corredor da porta e 1 m antes da entrada)
      const mid = (a0: number, q0: number, n0: number, d: number, same: boolean) => {
        const e = alongX ? da[0] : da[1]; // (o sentido da saída)
        if (!same) return e > 0 ? Math.max(a0, q0) : Math.min(a0, q0);
        let m = (a0 + q0) / 2;
        if ((m - a0) * d < 0) m = a0;
        if ((n0 - m) * d < 1) m = n0 - d;
        return m;
      };
      if (alongX) {
        const mx = mid(a[0], q1[0], b[0], db[0], da[0] === db[0]);
        pts.push([mx, a[1]], [mx, q1[1]]);
      } else {
        const mz = mid(a[1], q1[1], b[1], db[1], da[1] === db[1]);
        pts.push([a[0], mz], [q1[0], mz]);
      }
    } else pts.push(alongX ? [q1[0], a[1]] : [a[0], q1[1]]);
  }
  // (o ponto de chegada reta só entra se não ficar para trás da volta; sem ele, a volta vai para a linha da entrada: nada de trecho torto)
  const last = pts[pts.length - 1];
  if ((q1[0] - last[0]) * db[0] + (q1[1] - last[1]) * db[1] >= -0.01) pts.push(q1);
  else if (!eq(last[0], b[0]) && !eq(last[1], b[1])) pts.push(db[0] === 0 ? [b[0], last[1]] : [last[0], b[1]]);
  pts.push(b);
  // os pontos quase alinhados ficam alinhados de verdade (de trás para a frente: a entrada não sai do lugar)
  for (let k = pts.length - 2; k >= 0; k--) {
    if (eq(pts[k][0], pts[k + 1][0])) pts[k] = [pts[k + 1][0], pts[k][1]];
    if (eq(pts[k][1], pts[k + 1][1])) pts[k] = [pts[k][0], pts[k + 1][1]];
  }
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
  see: number[]; // outras salas que ficam desenhadas enquanto o jogador está aqui (a Biblioteca, vista da passarela)
  dispose(): void;
}
export interface ConnectorOpts {
  open?: boolean[]; // por trecho: true = de outra sala (a passarela da Biblioteca): sem malha; só o chão e um parapeito dos dois lados
  openW?: number; // a largura dos trechos abertos
  see?: number[];
}

const MATS = new Map<string, { wallM: THREE.Material; ceilM: THREE.Material; floorM: THREE.Material }>(); // (um jogo de texturas por tema)

// `pts` = o caminho (mundo), `y` = o chão, `theme` = a pedra da sala da porta
export function buildConnector(from: number, to: number, pts: XZ[], y: number, theme: string, o: ConnectorOpts = {}): Connector {
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
  const sg = (v: number) => (Math.abs(v) < 1e-3 ? 0 : Math.sign(v));
  const dirOf = (k: number): XZ => {
    const [ax, az] = pts[k];
    const [bx, bz] = pts[k + 1];
    return [sg(bx - ax), sg(bz - az)];
  };
  const isOpen = (k: number) => !!o.open?.[k];
  const turnAt = (k: number) => k > 0 && k < n && (dirOf(k - 1)[0] !== dirOf(k)[0] || dirOf(k - 1)[1] !== dirOf(k)[1]);
  const ow = o.openW ?? w;
  // os trechos abertos: o chão (para o motor), o parapeito dos dois lados e, nas pontas que dão num trecho fechado, os "ombros" (o corredor é
  // mais largo que o vão da passarela). O parapeito só barra quem está na passarela (`bottom`): quem anda lá embaixo passa livre.
  for (let k = 0; k < n; k++) {
    if (!isOpen(k)) continue;
    const [dx, dz] = dirOf(k);
    const [ax, az] = pts[k];
    const [bx, bz] = pts[k + 1];
    const hw = ow / 2;
    floors.push([Math.min(ax, bx) - (dx === 0 ? hw : 0), Math.min(az, bz) - (dz === 0 ? hw : 0), Math.max(ax, bx) + (dx === 0 ? hw : 0), Math.max(az, bz) + (dz === 0 ? hw : 0)]);
    for (const sd of [-1, 1]) {
      const [nx, nz] = nl0([dx, dz], sd);
      const ra = [ax + nx * (hw + 0.1), az + nz * (hw + 0.1)];
      const rb = [bx + nx * (hw + 0.1), bz + nz * (hw + 0.1)];
      const t = 0.1;
      rects.push([Math.min(ra[0], rb[0]) - (dx === 0 ? t : 0), Math.min(ra[1], rb[1]) - (dz === 0 ? t : 0), Math.max(ra[0], rb[0]) + (dx === 0 ? t : 0), Math.max(ra[1], rb[1]) + (dz === 0 ? t : 0), undefined, y]);
      for (const [px, pz] of [[ax, az], [bx, bz]] as [number, number][]) {
        const c0 = hw;
        const c1 = w / 2 + WALL;
        const qx0 = px + nx * c0 - dx * 0.35;
        const qz0 = pz + nz * c0 - dz * 0.35;
        const qx1 = px + nx * c1 + dx * 0.35;
        const qz1 = pz + nz * c1 + dz * 0.35;
        rects.push([Math.min(qx0, qx1), Math.min(qz0, qz1), Math.max(qx0, qx1), Math.max(qz0, qz1), undefined, y]);
      }
    }
  }
  // chão e teto: um retângulo por trecho; o quadrado da curva fica com o trecho que chega nela
  for (let k = 0; k < n; k++) {
    if (isOpen(k)) continue;
    const [dx, dz] = dirOf(k);
    const s = turnAt(k) ? w / 2 : 0;
    const e = turnAt(k + 1) ? w / 2 : 0;
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
      if (isOpen(k)) continue;
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
      if (k < n - 1 && turnAt(k + 1)) {
        const v2 = nl0(dirOf(k + 1), side);
        const ex = bx + (v[0] + v2[0]) * WALL;
        const ez = bz + (v[1] + v2[1]) * WALL;
        rects.push([Math.min(bx, ex), Math.min(bz, ez), Math.max(bx, ex), Math.max(bz, ez), top]);
      }
    }
  }
  decorate(kit, pts, y, w, h, top, from, rects, dirOf, turnAt, isOpen);
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
    see: o.see ?? [],
    dispose() {
      group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) m.geometry.dispose();
      });
    },
  };
}

// A VIDA DO CORREDOR (pedido do Pedro: os corredores de ligação compridos ficavam escuros, lisos e iguais). Só pedra e marca, sem luz nova (chama
// é coisa de puzzle, e o corredor não entra no rodízio de luzes) e nada no caminho: arcos de reforço a cada 3 m (o ritmo, como na Lousa), o chão
// gasto no meio, manchas de umidade nas paredes e musgo no pé delas (mais no subsolo), entulho e teia no canto de fora das curvas, pedras soltas
// junto da parede e, em alguns, os riscos de giz de alguém contando os dias. Tudo sai de um sorteio fixo por corredor (igual toda vez).
function decorate(
  kit: Kit,
  pts: XZ[],
  y: number,
  w: number,
  h: number,
  top: number,
  seed: number,
  rects: Rect[],
  dirOf: (k: number) => XZ,
  turnAt: (k: number) => boolean,
  isOpen: (k: number) => boolean,
) {
  let st = (seed * 7919 + 1013) >>> 0;
  const rnd = () => {
    st = (st + 0x6d2b79f5) >>> 0;
    let t = st;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const n = pts.length - 1;
  const deep = y < -3; // o subsolo: mais úmido
  const RIB = 3.0;
  // o chão gasto (só nos trechos fechados)
  let run: XZ[] = [];
  const flush = () => {
    if (run.length > 1) kit.wear(run, 0.95, y);
    run = [];
  };
  for (let k = 0; k < n; k++) {
    if (isOpen(k)) {
      flush();
      continue;
    }
    if (!run.length) run.push(pts[k]);
    run.push(pts[k + 1]);
  }
  flush();
  let longest = -1;
  let longL = 0;
  for (let k = 0; k < n; k++) {
    if (isOpen(k)) continue;
    const [ax, az] = pts[k];
    const [bx, bz] = pts[k + 1];
    const L = Math.hypot(bx - ax, bz - az);
    if (L > longL) {
      longL = L;
      longest = k;
    }
  }
  for (let k = 0; k < n; k++) {
    if (isOpen(k)) continue;
    const d = dirOf(k);
    const [ax, az] = pts[k];
    const [bx, bz] = pts[k + 1];
    const L = Math.hypot(bx - ax, bz - az);
    if (L < 1.5) continue;
    const s0 = turnAt(k) ? w / 2 + 0.4 : 0.6;
    const s1 = turnAt(k + 1) ? w / 2 + 0.4 : 0.6;
    const at = (t: number): XZ => [ax + d[0] * t, az + d[1] * t];
    // os arcos de reforço: pilastra de pedra lavrada nas duas paredes e a cinta no teto
    const nr = Math.floor((L - s0 - s1) / RIB);
    const t0 = s0 + (L - s0 - s1 - nr * RIB) / 2 + RIB / 2;
    const ribs: number[] = [];
    for (let i = 0; i < nr; i++) ribs.push(t0 + i * RIB);
    for (const t of ribs) {
      const [px, pz] = at(t);
      for (const side of [-1, 1]) {
        const [ox, oz] = nl0(d, side);
        const cx = px + ox * (w / 2 - 0.08);
        const cz = pz + oz * (w / 2 - 0.08);
        const sx = d[0] !== 0 ? 0.3 : 0.16;
        const sz = d[0] !== 0 ? 0.16 : 0.3;
        kit.box(sx, h, sz, kit.slab, cx, y + h / 2, cz, false);
        rects.push([cx - sx / 2, cz - sz / 2, cx + sx / 2, cz + sz / 2, top]);
      }
      kit.box(d[0] !== 0 ? 0.3 : w, 0.16, d[0] !== 0 ? w : 0.3, kit.slab, px, y + h - 0.08, pz, false);
    }
    // manchas de umidade no meio de cada vão entre os arcos (de um lado ou do outro); musgo no pé da parede
    const spots = ribs.length ? [ribs[0] - RIB / 2, ...ribs.map((t) => t + RIB / 2)] : [L / 2];
    for (const t of spots) {
      if (t < s0 || t > L - s1) continue;
      const side = rnd() < 0.5 ? -1 : 1;
      const [ox, oz] = nl0(d, side);
      const [px, pz] = at(t + (rnd() - 0.5) * 0.8);
      const wx = px + ox * (w / 2);
      const wz = pz + oz * (w / 2);
      if (rnd() < (deep ? 0.75 : 0.5)) kit.damp(wx, y + 0.75 + rnd() * 0.7, wz, -ox, -oz, 1.1 + rnd() * 0.6).userData.merge = true;
      if (rnd() < (deep ? 0.55 : 0.2)) kit.moss(wx, y + 0.3, wz, -ox, -oz, 0.7 + rnd() * 0.4).userData.merge = true;
      // pedras soltas junto da parede do outro lado (pequenas: não atrapalham o passo)
      if (rnd() < 0.6) {
        const [qx, qz] = at(t + (rnd() - 0.5) * 1.2);
        const [o2x, o2z] = nl0(d, -side);
        for (let i = 0, m = 1 + Math.floor(rnd() * 3); i < m; i++) {
          const sz = 0.09 + rnd() * 0.12;
          const g = new THREE.Mesh(new THREE.DodecahedronGeometry(sz, 0), kit.stone);
          g.position.set(qx + o2x * (w / 2 - 0.14 - rnd() * 0.1) + d[0] * (rnd() - 0.5) * 0.5, y + sz * 0.55, qz + o2z * (w / 2 - 0.14 - rnd() * 0.1) + d[1] * (rnd() - 0.5) * 0.5);
          g.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
          g.userData.merge = true; // (junta-se numa malha só, na hora de assar)
          kit.group.add(g);
        }
      }
    }
    // os riscos de giz (em uns 4 de cada 10 corredores, no trecho mais comprido, entre dois arcos) ou, em outros, UM DESENHO A GIZ de quem
    // passou por aqui (a porta, a mão, a luz do poço, quem passa de capuz, o dado, o braseiro; scene/chalkdraw.ts, DESIGN.md §80)
    if (k === longest && L >= 4.5) {
      const roll = L >= 6 ? rnd() : 0.45 + rnd() * 0.55; // (os riscos pedem um trecho de 6 m; um desenho cabe em 4,5)
      const t = spots.length > 1 ? spots[Math.floor(spots.length / 2)] : L / 2;
      const side = rnd() < 0.5 ? -1 : 1;
      const [ox, oz] = nl0(d, side);
      const [px, pz] = at(t);
      if (roll < 0.45) {
        const days = 7 + (seed * 13) % 31;
        kit.decal(1.3, 0.65, `tally-con${days}`, () => tallyTexture(days), px + ox * (w / 2 - 0.02), y + 1.45, pz + oz * (w / 2 - 0.02), 0, Math.atan2(-ox, -oz));
      } else if (roll < 0.8) {
        const KINDS = ['porta', 'mao', 'poco', 'figura', 'dado', 'braseiro'] as const;
        const kind = KINDS[seed % KINDS.length];
        kit.decal(0.96, 0.72, `draw-con${seed}`, () => chalkTexture(kind, ...decalRes(0.96, 0.72, 105), seed), px + ox * (w / 2 - 0.02), y + 1.5, pz + oz * (w / 2 - 0.02), 0, Math.atan2(-ox, -oz));
        CHALK_SPOTS.push({ kind, x: px + ox * (w / 2), y, z: pz + oz * (w / 2), nx: -ox, nz: -oz });
      }
    }
  }
  // as curvas: entulho no canto de fora (fora do caminho) e, às vezes, uma teia lá em cima
  for (let k = 1; k < n; k++) {
    if (!turnAt(k) || isOpen(k - 1) || isOpen(k)) continue;
    const din = dirOf(k - 1);
    const dout = dirOf(k);
    const [px, pz] = pts[k];
    const r = w / 2 - 0.38;
    const cx = px + din[0] * r - dout[0] * r;
    const cz = pz + din[1] * r - dout[1] * r;
    for (let i = 0, m = 3 + Math.floor(rnd() * 3); i < m; i++) {
      const sz = 0.1 + rnd() * 0.15;
      const g = new THREE.Mesh(new THREE.DodecahedronGeometry(sz, 0), kit.stone);
      g.position.set(cx + (rnd() - 0.5) * 0.45, y + sz * 0.55, cz + (rnd() - 0.5) * 0.45);
      g.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
      g.userData.merge = true;
      kit.group.add(g);
    }
    if (rnd() < 0.5) {
      // na parede de frente para quem chega, no canto de cima
      const wx = px + din[0] * (w / 2) - dout[0] * (w / 2 - 0.45);
      const wz = pz + din[1] * (w / 2) - dout[1] * (w / 2 - 0.45);
      kit.web(wx, y + h - 0.42, wz, -din[0], -din[1], rnd() < 0.5, 0.8); // (a teia espelhada não se junta: o espelho vira as faces do avesso)
    }
  }
}

// a normal "para fora" de um dos dois lados (`side` = -1 ou +1) de quem anda na direção `d`
function nl0(d: XZ, side: number): XZ {
  return [-d[1] * -side, d[0] * -side];
}

// a ponta do corredor da porta: `CORRIDOR` metros além da porta, na direção de saída
// (testes) onde ficou cada desenho a giz dos corredores: o ponto na parede, o chão e para onde a parede olha
export const CHALK_SPOTS: { kind: string; x: number; y: number; z: number; nx: number; nz: number }[] = [];
export const corridorEnd = (door: XZ, dir: XZ): XZ => [door[0] + dir[0] * CORRIDOR, door[1] + dir[1] * CORRIDOR];
