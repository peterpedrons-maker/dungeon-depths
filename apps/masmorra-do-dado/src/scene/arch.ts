// ARQUITETURA DE VERDADE (DESIGN.md §56): as peças do salão de colunas da direção de arte nova (referência do Pedro: cripta de colunas
// redondas e abóbadas de aresta, luz de tocha, escuro de verdade), sempre em pixel art.
//  · CANTARIA com RELEVO: blocos grandes de pedra desenhados pixel a pixel, com um mapa de altura junto (bumpMap): a quina de cada bloco
//    pega a luz da tocha de verdade, de qualquer lado, e a junta fica funda. Nada de luz "pintada" na textura.
//  · LAJES irregulares no chão (4,8 m por ladrilho, para a repetição não aparecer), cada laje levemente inclinada.
//  · ABÓBADA DE ARESTA (duas abóbadas de berço que se cruzam; as arestas ficam vivas), ARCO de aduelas entre colunas, COLUNA redonda com
//    plinto, toro, fuste com êntase, colarinho, equino e ábaco.
//  · Fumaça de tocha e gota que pinga (vida, pouca e com motivo).
// Tudo em metros; as texturas repetem a cada `ST` metros (a mesma densidade de pixel do resto do jogo: ~53 px por metro).
import * as THREE from 'three';
import { THEMES, type Theme } from './textures';

export const ST = 2.4; // metros por ladrilho das texturas de cantaria (128 px)
const PX = 128;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type RGB = [number, number, number];
const hex = (c: string): RGB => {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// ruído suave periódico (manchas de umidade, desgaste)
function blotch(r: () => number, n: number, size: number) {
  const g = Array.from({ length: n * n }, () => r());
  const at = (i: number, j: number) => g[(((j % n) + n) % n) * n + (((i % n) + n) % n)];
  return (x: number, y: number) => {
    const fx = (x / size) * n;
    const fy = (y / size) * n;
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const u = fx - i;
    const v = fy - j;
    const su = u * u * (3 - 2 * u);
    const sv = v * v * (3 - 2 * v);
    return (at(i, j) * (1 - su) + at(i + 1, j) * su) * (1 - sv) + (at(i, j + 1) * (1 - su) + at(i + 1, j + 1) * su) * sv;
  };
}

// cor + altura num buffer só (a altura vira o bumpMap)
class Buf {
  c: Uint8ClampedArray;
  h: Float32Array;
  constructor(public w: number, public hh: number) {
    this.c = new Uint8ClampedArray(w * hh * 4);
    this.h = new Float32Array(w * hh);
  }
  i(x: number, y: number) {
    x = ((x % this.w) + this.w) % this.w;
    y = ((y % this.hh) + this.hh) % this.hh;
    return y * this.w + x;
  }
  set(x: number, y: number, col: RGB, k: number, height: number) {
    const i = this.i(x, y);
    this.c[i * 4] = col[0] * k;
    this.c[i * 4 + 1] = col[1] * k;
    this.c[i * 4 + 2] = col[2] * k;
    this.c[i * 4 + 3] = 255;
    this.h[i] = height;
  }
  dent(x: number, y: number, k: number, dh: number) {
    const i = this.i(x, y);
    this.c[i * 4] *= k;
    this.c[i * 4 + 1] *= k;
    this.c[i * 4 + 2] *= k;
    this.h[i] = Math.max(0, this.h[i] - dh);
  }
  textures(repeat = true): Tex2 {
    const mk = (data: Uint8ClampedArray, srgb: boolean) => {
      const cv = document.createElement('canvas');
      cv.width = this.w;
      cv.height = this.hh;
      cv.getContext('2d')!.putImageData(new ImageData(data as unknown as Uint8ClampedArray<ArrayBuffer>, this.w, this.hh), 0, 0);
      const t = new THREE.CanvasTexture(cv);
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.NearestMipmapNearestFilter;
      t.generateMipmaps = true;
      t.anisotropy = 4;
      if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      return t;
    };
    const hb = new Uint8ClampedArray(this.w * this.hh * 4);
    for (let i = 0; i < this.h.length; i++) {
      const v = Math.round(this.h[i] * 255);
      hb[i * 4] = hb[i * 4 + 1] = hb[i * 4 + 2] = v;
      hb[i * 4 + 3] = 255;
    }
    return { map: mk(this.c, true), bump: mk(hb, false) };
  }
}
export interface Tex2 {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
}

// rachadura fina que anda numa direção (escurece e afunda)
function crackWalk(b: Buf, r: () => number, x: number, y: number, len: number, vertical: boolean) {
  for (let i = 0; i < len; i++) {
    b.dent(Math.round(x), Math.round(y), 0.5, 0.35);
    if (vertical) {
      y += 1;
      x += r() < 0.32 ? (r() < 0.5 ? -1 : 1) : 0;
    } else {
      x += 1;
      y += r() < 0.32 ? (r() < 0.5 ? -1 : 1) : 0;
    }
  }
}

interface MasonryOpts {
  w?: number;
  h?: number;
  rows: [number, number]; // altura das fiadas (px)
  blocks: [number, number]; // comprimento dos blocos (px)
  vjoint?: boolean; // juntas verticais (false: tambores de coluna)
  tint?: number;
  seed: number;
  theme: string;
  cracks?: number; // 0..1
}
// CANTARIA: fiadas de alturas diferentes, blocos de comprimentos diferentes, juntas finas e fundas, quinas gastas e lascadas
export function masonry(o: MasonryOpts): Tex2 {
  const W = o.w ?? PX;
  const H = o.h ?? PX;
  const r = rng(o.seed);
  const th: Theme = THEMES[o.theme] ?? THEMES.crypt;
  const b = new Buf(W, H);
  const mortar = hex(th.mortar);
  const damp = blotch(r, 5, W);
  const tint = o.tint ?? 1;
  const rint = (a: number, z: number) => a + Math.floor(r() * (z - a + 1));
  // argamassa com areia
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) b.set(x, y, mortar, 0.8 + r() * 0.5, 0.06 + r() * 0.06);
  const rowsH: number[] = [];
  for (let y = 0; y < H; ) {
    let h = rint(o.rows[0], o.rows[1]);
    if (H - (y + h) < o.rows[0]) h = H - y;
    rowsH.push(h);
    y += h;
  }
  let y0 = 0;
  for (const rh of rowsH) {
    const widths: number[] = [];
    if (o.vjoint === false) widths.push(W);
    else {
      let sum = 0;
      while (sum < W) {
        let w = rint(o.blocks[0], o.blocks[1]);
        if (W - (sum + w) < o.blocks[0]) w = W - sum;
        widths.push(w);
        sum += w;
      }
    }
    let x0 = Math.floor(r() * W);
    for (const bw of widths) {
      const base = th.stone[Math.floor(r() * th.stone.length)];
      const roll = r();
      const k0 = tint * (roll < 0.12 ? 0.78 : roll > 0.9 ? 1.14 : 0.9 + r() * 0.16);
      const tiltX = (r() - 0.5) * 0.12; // a face do bloco não é perfeitamente plana
      const tiltY = (r() - 0.5) * 0.12;
      const chip = [r() < 0.4, r() < 0.4, r() < 0.4, r() < 0.4];
      const jw = o.vjoint === false ? 0 : 1;
      const iw = bw - jw; // largura útil (a última coluna é junta)
      const ih = rh - 1; // a última linha é junta
      for (let y = 0; y < ih; y++) {
        for (let x = 0; x < iw; x++) {
          const px = x0 + x;
          const py = y0 + y;
          const ex = Math.min(x, iw - 1 - x);
          const ey = Math.min(y, ih - 1 - y);
          const e = o.vjoint === false ? ey : Math.min(ex, ey);
          // lascas nos cantos (a argamassa aparece)
          const cs = 2 + (chip[0] ? 1 : 0);
          if (o.vjoint !== false) {
            if (chip[0] && x + y < cs) continue;
            if (chip[1] && iw - 1 - x + y < cs) continue;
            if (chip[2] && x + (ih - 1 - y) < cs) continue;
            if (chip[3] && iw - 1 - x + (ih - 1 - y) < cs) continue;
          }
          let k = k0 * (0.93 + r() * 0.11) * (0.88 + damp(px, py) * 0.2);
          let hgt = 0.72 + tiltX * (x / iw - 0.5) + tiltY * (y / ih - 0.5) + (r() - 0.5) * 0.06;
          if (e === 0) {
            hgt -= 0.2; // a quina gasta, arredondada
            k *= y === 0 ? 1.05 : 0.9;
          } else if (e === 1) hgt -= 0.07;
          const g = r();
          if (g < 0.035) {
            k *= 0.76; // poro
            hgt -= 0.12;
          } else if (g > 0.985) k *= 1.16;
          b.set(px, py, base, k, hgt);
        }
      }
      if (r() < (o.cracks ?? 0.22)) crackWalk(b, r, x0 + 3 + Math.floor(r() * Math.max(1, iw - 6)), y0 + 1, 4 + Math.floor(r() * (ih + 4)), true);
      x0 += bw;
    }
    y0 += rh;
  }
  return b.textures();
}

// LAJES do chão: retângulos grandes e irregulares (divisão em guilhotina), juntas com terra, laje inclinada, meio pisoteado, lascas
export function flagstones(seed: number, theme: string, size = 256): Tex2 {
  const r = rng(seed);
  const th: Theme = THEMES[theme] ?? THEMES.crypt;
  const b = new Buf(size, size);
  const gap = hex(th.floorGap);
  const wear = blotch(r, 6, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) b.set(x, y, gap, 0.75 + r() * 0.5, 0.02 + r() * 0.05);
  const rects: [number, number, number, number][] = [];
  const split = (x: number, y: number, w: number, h: number, depth: number) => {
    const big = w > 76 || h > 76;
    if ((big || (depth < 3 && r() < 0.55)) && (w > 36 || h > 36)) {
      const vert = w > h ? true : w < h ? false : r() < 0.5;
      const f = 0.32 + r() * 0.36;
      if (vert && w > 36) {
        const a = Math.round(w * f);
        split(x, y, a, h, depth + 1);
        split(x + a, y, w - a, h, depth + 1);
        return;
      }
      if (!vert && h > 36) {
        const a = Math.round(h * f);
        split(x, y, w, a, depth + 1);
        split(x, y + a, w, h - a, depth + 1);
        return;
      }
    }
    rects.push([x, y, w, h]);
  };
  // a divisão começa num ponto sorteado (a costura do ladrilho cai dentro de uma laje, e não numa junta reta)
  const ox = Math.floor(r() * size);
  const oy = Math.floor(r() * size);
  split(0, 0, size, size, 0);
  for (const [rx, ry, rw, rh] of rects) {
    const base = th.floor[Math.floor(r() * th.floor.length)];
    const k0 = 0.8 + r() * 0.32;
    const tx = (r() - 0.5) * 0.16;
    const ty = (r() - 0.5) * 0.16;
    const worn = r() < 0.6;
    const chips = [r() < 0.5, r() < 0.5, r() < 0.5, r() < 0.5];
    const iw = rw - 2;
    const ih = rh - 2;
    for (let y = 0; y < ih; y++) {
      for (let x = 0; x < iw; x++) {
        const ex = Math.min(x, iw - 1 - x);
        const ey = Math.min(y, ih - 1 - y);
        if (chips[0] && x + y < 3) continue;
        if (chips[1] && iw - 1 - x + y < 3) continue;
        if (chips[2] && x + ih - 1 - y < 3) continue;
        if (chips[3] && iw - 1 - x + ih - 1 - y < 3) continue;
        const px = ox + rx + 1 + x;
        const py = oy + ry + 1 + y;
        let k = k0 * (0.93 + r() * 0.1) * (0.9 + wear(px, py) * 0.16);
        let hgt = 0.7 + tx * (x / iw - 0.5) + ty * (y / ih - 0.5) + (r() - 0.5) * 0.05;
        const e = Math.min(ex, ey);
        if (e === 0) {
          hgt -= 0.22;
          k *= 0.86;
        } else if (e === 1) hgt -= 0.08;
        if (worn) {
          const dx = (x - iw / 2) / (iw / 2);
          const dy = (y - ih / 2) / (ih / 2);
          const m = Math.max(0, 1 - dx * dx - dy * dy);
          k *= 1 + m * 0.08;
          hgt += m * 0.02;
        }
        const g = r();
        if (g < 0.03) {
          k *= 0.75;
          hgt -= 0.1;
        } else if (g > 0.988) k *= 1.15;
        b.set(px, py, base, k, hgt);
      }
    }
    if (r() < 0.35) crackWalk(b, r, ox + rx + 4 + Math.floor(r() * Math.max(1, iw - 8)), oy + ry + 2, 8 + Math.floor(r() * ih * 0.7), r() < 0.5);
  }
  return b.textures();
}

// material com relevo: o bump é a altura desenhada junto com a cor
export function reliefMat(t: Tex2, bumpScale = 2.2, color = 0xffffff) {
  return new THREE.MeshLambertMaterial({ map: t.map, bumpMap: t.bump, bumpScale, color });
}

// ── geometria ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────

// caixa com UV em metros (1 ladrilho = ST): blocos sempre do mesmo tamanho, e caixas vizinhas continuam a mesma cantaria
export function stoneBox(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const p = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const n = geo.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const px = p.getX(i) + x;
    const py = p.getY(i) + y;
    const pz = p.getZ(i) + z;
    if (Math.abs(n.getX(i)) > 0.5) uv.setXY(i, (n.getX(i) > 0 ? -pz : pz) / ST, py / ST);
    else if (Math.abs(n.getY(i)) > 0.5) uv.setXY(i, px / ST, -pz / ST);
    else uv.setXY(i, (n.getZ(i) > 0 ? px : -px) / ST, py / ST);
  }
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

// tabela de comprimento de arco de uma meia-elipse (semi-eixos a na horizontal, b na vertical), de u = -1 a u = 1
function arcTable(a: number, b: number) {
  const N = 256;
  const tab = new Float32Array(N + 1);
  let prevX = -a;
  let prevY = 0;
  for (let i = 1; i <= N; i++) {
    const th = Math.PI - (i / N) * Math.PI; // de π (u = -1) a 0 (u = 1)
    const x = a * Math.cos(th);
    const y = b * Math.sin(th);
    tab[i] = tab[i - 1] + Math.hypot(x - prevX, y - prevY);
    prevX = x;
    prevY = y;
  }
  // u → comprimento (procura pelo ângulo)
  return (u: number) => {
    const th = Math.acos(Math.max(-1, Math.min(1, u))); // u = cos(th)... de 0 (u=1) a π (u=-1)
    const f = (Math.PI - th) / Math.PI; // 0 em u = -1, 1 em u = 1
    const fi = f * N;
    const i = Math.min(N - 1, Math.floor(fi));
    return tab[i] + (tab[i + 1] - tab[i]) * (fi - i);
  };
}

// ABÓBADA DE ARESTA sobre o retângulo [x0,x1]×[z0,z1]: nasce em `spring` nas quatro bordas (arcos em todas) e sobe `rise` no meio.
// y = spring + rise·max(s(u), s(w)), s(u) = √(1−u²): duas abóbadas de berço cruzadas; as arestas (diagonais) ficam vivas.
export function groinVault(x0: number, x1: number, z0: number, z1: number, spring: number, rise: number, mat: THREE.Material, N = 16) {
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const hx = (x1 - x0) / 2;
  const hz = (z1 - z0) / 2;
  const s = (u: number) => Math.sqrt(Math.max(0, 1 - u * u));
  const arcX = arcTable(hx, rise);
  const arcZ = arcTable(hz, rise);
  // pontos mais densos perto das bordas (onde a curva fica vertical); o mesmo conjunto nos dois eixos põe as arestas sobre os vértices
  const us = Array.from({ length: N + 1 }, (_, i) => -Math.cos((Math.PI * i) / N));
  const pos: number[] = [];
  const nor: number[] = [];
  const uvs: number[] = [];
  const vert = (u: number, w: number, webX: boolean) => {
    const y = spring + rise * (webX ? s(u) : s(w));
    pos.push(cx + u * hx, y, cz + w * hz);
    // normal para baixo (para dentro da sala), calculada na abóbada a que o triângulo pertence
    if (webX) {
      const n = new THREE.Vector3((-rise * u) / hx, -s(u), 0).normalize();
      nor.push(n.x, n.y, n.z);
      uvs.push((cz + w * hz) / ST, arcX(u) / ST);
    } else {
      const n = new THREE.Vector3(0, -s(w), (-rise * w) / hz).normalize();
      nor.push(n.x, n.y, n.z);
      uvs.push((cx + u * hx) / ST, arcZ(w) / ST);
    }
  };
  const tri = (a: [number, number], b: [number, number], c: [number, number]) => {
    const mu = (us[a[0]] + us[b[0]] + us[c[0]]) / 3;
    const mw = (us[a[1]] + us[b[1]] + us[c[1]]) / 3;
    const webX = Math.abs(mu) <= Math.abs(mw); // s(u) maior: a altura depende de x (berço que corre em z)
    // ordem dos vértices: a face tem de olhar para baixo
    const P = (q: [number, number]) => new THREE.Vector3(us[q[0]] * hx, rise * (webX ? s(us[q[0]]) : s(us[q[1]])), us[q[1]] * hz);
    const pa = P(a);
    const nrm = new THREE.Vector3().subVectors(P(b), pa).cross(new THREE.Vector3().subVectors(P(c), pa));
    const order = nrm.y < 0 ? [a, b, c] : [a, c, b];
    for (const q of order) vert(us[q[0]], us[q[1]], webX);
  };
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const A: [number, number] = [i, j];
      const B: [number, number] = [i + 1, j];
      const C: [number, number] = [i, j + 1];
      const D: [number, number] = [i + 1, j + 1];
      if (i + j + 1 === N && i !== j) {
        tri(A, B, C);
        tri(B, D, C);
      } else {
        tri(A, B, D);
        tri(A, D, C);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  const m = new THREE.Mesh(geo, mat);
  return m;
}

// ARCO de aduelas entre duas colunas (atravessa a sala em x, no plano z = zc): intradorso, as duas faces com as aduelas radiais e,
// acima do arco, o tímpano (o enchimento até a abóbada, `top(x)`), que vai até a parede (|x| = wallX).
export function transverseArch(o: {
  zc: number;
  depth: number; // espessura do arco (em z)
  xs: number; // meia-luz no nascimento (a face de dentro do ábaco)
  spring: number;
  rise: number; // altura do extradorso no meio (= a da abóbada)
  thick: number; // altura das aduelas
  wallX: number;
  top: (x: number) => number; // a altura da abóbada na linha do arco
  ring: THREE.Material; // aduelas
  fill: THREE.Material; // tímpano (cantaria em fiadas)
}) {
  const g = new THREE.Group();
  const M = 28;
  const rb = o.rise - o.thick;
  const outer = o.xs + o.thick;
  const zs = [o.zc + o.depth / 2, o.zc - o.depth / 2];
  // pontos do intradorso e do extradorso (mesmo ângulo)
  const ib: THREE.Vector2[] = [];
  const ex: THREE.Vector2[] = [];
  const arcLen: number[] = [0];
  for (let i = 0; i <= M; i++) {
    const ph = Math.PI - (i / M) * Math.PI;
    ib.push(new THREE.Vector2(o.xs * Math.cos(ph), o.spring + rb * Math.sin(ph)));
    ex.push(new THREE.Vector2(outer * Math.cos(ph), o.spring + o.rise * Math.sin(ph)));
    if (i > 0) arcLen.push(arcLen[i - 1] + ib[i].distanceTo(ib[i - 1]));
  }
  const total = arcLen[M];
  const nV = Math.max(5, Math.round(total / 0.55) | 1); // número ímpar de aduelas (tem uma pedra-chave no meio)
  const vLen = total / nV;
  // 1) intradorso (a face de baixo), olhando para o centro do arco
  {
    const pos: number[] = [];
    const uv: number[] = [];
    const nor: number[] = [];
    for (let i = 0; i < M; i++) {
      const a = ib[i];
      const b = ib[i + 1];
      const na = new THREE.Vector3(-(a.x / (o.xs * o.xs)), -((a.y - o.spring) / (rb * rb)), 0).normalize();
      const nb = new THREE.Vector3(-(b.x / (o.xs * o.xs)), -((b.y - o.spring) / (rb * rb)), 0).normalize();
      const quad: [THREE.Vector2, number, THREE.Vector3, number][] = [
        [a, zs[0], na, arcLen[i]],
        [b, zs[0], nb, arcLen[i + 1]],
        [b, zs[1], nb, arcLen[i + 1]],
        [a, zs[1], na, arcLen[i]],
      ];
      for (const k of [0, 2, 1, 0, 3, 2]) {
        const [p, z, n, l] = quad[k];
        pos.push(p.x, p.y, z);
        nor.push(n.x, n.y, n.z);
        uv.push(l / vLen / 4, (z - zs[1]) / o.depth / 4);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.add(new THREE.Mesh(geo, o.ring));
  }
  // 2) as faces das aduelas (frente e trás): u = aduela (4 por ladrilho de textura), v = a altura da aduela
  for (const [si, z] of zs.entries()) {
    const pos: number[] = [];
    const uv: number[] = [];
    const nz = si === 0 ? 1 : -1;
    for (let i = 0; i < M; i++) {
      const q = [
        [ib[i], 0, arcLen[i]],
        [ib[i + 1], 0, arcLen[i + 1]],
        [ex[i + 1], 1, arcLen[i + 1]],
        [ex[i], 1, arcLen[i]],
      ] as [THREE.Vector2, number, number][];
      const order = nz > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
      for (const k of order) {
        const [p, v, l] = q[k];
        pos.push(p.x, p.y, z);
        uv.push(l / vLen / 4, v / 4 + 0.001);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, o.ring));
  }
  // 3) o tímpano: do extradorso até a abóbada, e do pé do arco até a parede (fiadas horizontais, UV no mundo)
  for (const [si, z] of zs.entries()) {
    const pos: number[] = [];
    const uv: number[] = [];
    const nz = si === 0 ? 1 : -1;
    const strip = (pts: [number, number, number][]) => {
      // pts: [x, yBaixo, yAlto], da esquerda para a direita
      for (let i = 0; i + 1 < pts.length; i++) {
        const [xa, ya0, ya1] = pts[i];
        const [xb, yb0, yb1] = pts[i + 1];
        const q: [number, number][] = [
          [xa, ya0],
          [xb, yb0],
          [xb, yb1],
          [xa, ya1],
        ];
        const order = nz > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
        for (const k of order) {
          const [x, y] = q[k];
          pos.push(x, y, z);
          uv.push((nz > 0 ? x : -x) / ST, y / ST);
        }
      }
    };
    strip(ex.map((p) => [p.x, p.y, Math.max(p.y, o.top(p.x))] as [number, number, number]));
    for (const sgn of [-1, 1]) {
      const pts: [number, number, number][] = [];
      for (let i = 0; i <= 6; i++) {
        const x = sgn * (outer + ((o.wallX - outer) * i) / 6);
        pts.push([x, o.spring, Math.max(o.spring, o.top(x))]);
      }
      if (sgn < 0) pts.reverse();
      strip(pts);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, o.fill));
  }
  return g;
}

// COLUNA redonda: plinto quadrado, toro e escócia, fuste com êntase, colarinho, equino e ábaco. (x, z) = centro; h = altura até o
// topo do ábaco. Devolve o grupo e as medidas (para a colisão e para o arco que nasce dela).
export function column(x: number, z: number, h: number, shaft: THREE.Material, slab: THREE.Material, r = 0.25) {
  const g = new THREE.Group();
  const plinthH = 0.22;
  const plinthW = r * 2.6;
  const abacusH = 0.2;
  const abacusW = r * 2.8;
  const plinth = stoneBox(plinthW, plinthH, plinthW, slab, x, plinthH / 2, z);
  g.add(plinth);
  const a = abacusH;
  const prof: [number, number][] = [
    [r * 1.2, plinthH],
    [r * 1.27, plinthH + 0.03],
    [r * 1.28, plinthH + 0.06], // toro
    [r * 1.22, plinthH + 0.09],
    [r * 1.06, plinthH + 0.11],
    [r * 1.02, plinthH + 0.15], // escócia
    [r * 1.1, plinthH + 0.17],
    [r * 1.08, plinthH + 0.2],
    [r, plinthH + 0.22], // fuste
    [r * 0.985, plinthH + (h - plinthH) * 0.35],
    [r * 0.93, h - a - 0.36],
    [r * 1.06, h - a - 0.34], // colarinho
    [r * 1.06, h - a - 0.29],
    [r * 0.95, h - a - 0.27],
    [r * 0.95, h - a - 0.2],
    [r * 1.08, h - a - 0.14], // equino
    [r * 1.26, h - a - 0.06],
    [r * 1.36, h - a],
    [0, h - a],
  ];
  const lathe = new THREE.LatheGeometry(
    prof.map(([pr, py]) => new THREE.Vector2(pr, py)),
    14,
  );
  // UV em metros: em volta (a circunferência do fuste) e na altura
  const uv = lathe.attributes.uv as THREE.BufferAttribute;
  const p = lathe.attributes.position as THREE.BufferAttribute;
  const circ = 2 * Math.PI * r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * circ) / ST, p.getY(i) / ST);
  const shaftMesh = new THREE.Mesh(lathe, shaft);
  shaftMesh.position.set(x, 0, z);
  g.add(shaftMesh);
  g.add(stoneBox(abacusW, abacusH, abacusW, slab, x, h - abacusH / 2, z));
  return { group: g, plinthW, abacusW, top: h };
}

// FUMAÇA de tocha: tufos pontilhados escuros que sobem, alargam e somem (a fuligem na parede vem daí)
export function smokeTexture() {
  const N = 32;
  const cv = document.createElement('canvas');
  cv.width = N;
  cv.height = N;
  const g = cv.getContext('2d')!;
  const img = g.createImageData(N, N);
  const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const d = Math.max(0, 1 - Math.hypot(x / N - 0.5, y / N - 0.5) / 0.48);
      const on = d * d > (B[(y % 4) * 4 + (x % 4)] / 16) * 0.9 + 0.06;
      const o = (y * N + x) * 4;
      img.data[o] = 40;
      img.data[o + 1] = 36;
      img.data[o + 2] = 40;
      img.data[o + 3] = on ? 160 : 0;
    }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function torchSmoke(parent: THREE.Object3D, x: number, y: number, z: number, nx: number, nz: number, n = 5) {
  const tex = smokeTexture();
  const puffs: { s: THREE.Sprite; ph: number; sp: number }[] = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, fog: true }));
    parent.add(s);
    puffs.push({ s, ph: i / n, sp: 0.16 + (i % 3) * 0.03 });
  }
  return (t: number) => {
    for (const p of puffs) {
      const k = (t * p.sp + p.ph) % 1; // 0 = nasce na chama, 1 = some
      const sz = 0.18 + k * 0.7;
      p.s.scale.set(sz, sz, 1);
      // sobe e se afasta um pouco da parede, balançando
      p.s.position.set(x + nx * (0.12 + k * 0.25) + Math.sin(t * 1.3 + p.ph * 9) * 0.06 * k, y + k * 1.5, z + nz * (0.12 + k * 0.25) + Math.cos(t * 1.1 + p.ph * 7) * 0.06 * k);
      (p.s.material as THREE.SpriteMaterial).opacity = Math.sin(k * Math.PI) * 0.42 * (1 - k * 0.4);
    }
  };
}

// GOTA que pinga de uma rachadura do teto numa poça: a gota cai, a poça faz um anel que abre e some
export function drip(parent: THREE.Object3D, x: number, yTop: number, z: number, period = 2.6) {
  const dropMat = new THREE.PointsMaterial({ color: 0xa8b8cc, size: 2, sizeAttenuation: false, transparent: true, opacity: 0.85, fog: true, depthWrite: false });
  const dg = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([x, yTop, z], 3));
  const drop = new THREE.Points(dg, dropMat);
  drop.frustumCulled = false;
  parent.add(drop);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x8a9ab0, transparent: true, opacity: 0, depthWrite: false, fog: true });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 16), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.02, z);
  parent.add(ring);
  const fallT = Math.sqrt((2 * yTop) / 9.8);
  return (t: number) => {
    const k = t % period;
    const arr = dg.attributes.position.array as Float32Array;
    if (k < 0.6) {
      // a gota cresce presa na pedra
      arr[1] = yTop - 0.02;
      dropMat.opacity = 0.3 + k;
    } else if (k < 0.6 + fallT) {
      const tt = k - 0.6;
      arr[1] = yTop - 4.9 * tt * tt;
      dropMat.opacity = 0.9;
    } else {
      arr[1] = -1; // (debaixo do chão: some)
      dropMat.opacity = 0;
    }
    dg.attributes.position.needsUpdate = true;
    const rk = k - 0.6 - fallT;
    if (rk >= 0 && rk < 0.9) {
      const s = 0.04 + rk * 0.3;
      ring.scale.setScalar(s);
      ringMat.opacity = (1 - rk / 0.9) * 0.5;
    } else ringMat.opacity = 0;
  };
}

// chão horizontal com UV em metros (1 ladrilho = `tile` m), olhando para cima
export function floorPlane(x0: number, x1: number, z0: number, z1: number, y: number, mat: THREE.Material, tile: number) {
  const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
  geo.rotateX(-Math.PI / 2);
  geo.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  const p = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / tile, -p.getZ(i) / tile);
  return new THREE.Mesh(geo, mat);
}
