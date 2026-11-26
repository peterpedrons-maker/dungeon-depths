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
  slabTexture,
  sootTexture,
  lightPoolTexture,
  wearTexture,
  stainTexture,
  vineTexture,
} from './textures';
import { makeInscription, type InscribeOpts, type Inscription } from './inscription';
import { wallTorch } from './models';
import type { Box, Rect, Surface } from './types';

export const T = 1.2; // metros por "tile" de textura
// chaves de depuração (só usadas pelos testes em desenvolvimento)
export const dbg = { flicker: true, bob: true };
export const LAMP_OFF = 0x2a2230;
// o motor escreve aqui quanto de luz o mundo tem agora (1 = normal, ~0,08 = o ESCURO da Casa): os brilhos falsos apagam junto
export const lightEnv = { scale: 1 };

export function lambert(map: THREE.Texture | null, color = 0xffffff) {
  return new THREE.MeshLambertMaterial({ map, color });
}

// Fonte de luz "virtual": o motor mantém só algumas PointLights de verdade e as empresta
// aos emissores mais relevantes (perto e fortes). Menos luzes = shader bem mais leve.
// A textura de um material repete sem escala própria (repeat 1×1)? Então a caixa recebe UV em metros e o tijolo tem sempre o mesmo tamanho,
// num degrau, num pilar de 7 m ou num balcão (antes cada face mostrava a textura INTEIRA, esticada). Materiais com repeat próprio ou sem
// repetição (placas, decalques) ficam como estão.
function tiles(mat: THREE.Material | THREE.Material[]) {
  const list = Array.isArray(mat) ? mat : [mat];
  let any = false;
  for (const m of list) {
    const map = (m as THREE.MeshLambertMaterial).map;
    if (!map) continue;
    if (map.wrapS !== THREE.RepeatWrapping || map.repeat.x !== 1 || map.repeat.y !== 1) return false;
    any = true;
  }
  return any;
}
// UV em metros (1 ladrilho = T) nas seis faces de uma caixa, a partir da posição na sala: caixas vizinhas continuam o mesmo aparelho de tijolos.
export function worldBoxUV(geo: THREE.BufferGeometry, cx: number, cy: number, cz: number) {
  const p = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const n = geo.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + cx;
    const y = p.getY(i) + cy;
    const z = p.getZ(i) + cz;
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    if (ax > 0.5) uv.setXY(i, (n.getX(i) > 0 ? -z : z) / T, y / T);
    else if (ay > 0.5) uv.setXY(i, x / T, -z / T);
    else uv.setXY(i, (n.getZ(i) > 0 ? x : -x) / T, y / T);
  }
  uv.needsUpdate = true;
}

export class Emitter {
  // shadow: a luz pode ganhar SOMBRA de verdade (o motor tem poucas luzes com sombra e as empresta às chamas marcadas mais perto do
  // jogador). jit: o tremor da chama (alguns cm), somado à posição: a luz e a sombra "dançam" com o fogo.
  shadow = false;
  jit = new THREE.Vector3();
  range = 11; // alcance da luz (m): ela some suave até aqui
  lit = 0; // (o motor escreve) quanto de luz de verdade esta chama tem agora: 0 = nenhuma (só o brilho falso)
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
  // o quadro da chama para um "tempo" qualquer (o resto da divisão nunca fica negativo: um índice negativo deixava a chama sem desenho)
  frame(n: number) {
    const k = this.frames.length;
    return this.frames[((Math.floor(n) % k) + k) % k];
  }
  stone: THREE.MeshLambertMaterial;
  slab: THREE.MeshLambertMaterial; // pedra lavrada, clara (pisos de degrau, capas de mureta)
  private torches: { sprite: THREE.Sprite; light: Emitter; phase: number; base: number; halo?: THREE.MeshBasicMaterial }[] = [];
  private poolTex: THREE.Texture | null = null;
  private beams: { geo: THREE.BufferGeometry; cx: number; cz: number; r: number; y0: number; y1: number; seed: number[] }[] = [];
  private flicker = true;
  // lively: chamas mais vivas (a luz oscila de verdade e o ponto de luz treme alguns cm: com as luzes de sombra, a sombra dança)
  lively = false;

  constructor(public theme = 'crypt') {
    this.stone = lambert(brickTexture([1, 1], 0.9, 41, theme));
    this.slab = lambert(slabTexture([1, 1], theme));
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
    const geo = new THREE.BoxGeometry(w, h, d);
    if (tiles(mat)) worldBoxUV(geo, x, y, z); // textura que repete: em metros, sem esticar
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (!mark && !Array.isArray(mat)) m.userData.merge = true;
    return this.add(m, mark);
  }

  // tocha de parede: (nx, nz) = para onde a parede "olha" (de onde vem a luz)
  torch(x: number, y: number, z: number, nx: number, nz: number, phase: number, color = 0xff9a3c, intensity = 42) {
    // a tocha de parede em modelo 3D (DESIGN.md §66); se o arquivo falhar, o suporte e o cabo de caixas de antes. Nenhum dos dois faz sombra
    // (a própria chama ficaria com uma barra preta embaixo, na parede)
    wallTorch(this.group, x, y, z, nx, nz, (h) => {
      for (const [w, hh, d, mat, px, py, pz] of [
        [Math.abs(nz) > 0 ? 0.2 : 0.08, 0.2, Math.abs(nx) > 0 ? 0.2 : 0.08, this.mat('torchBracket', () => this.stone.clone()), x, y - 0.05, z],
        [0.1, 0.6, 0.1, this.mat('torchStick', () => lambert(null, 0x5a3a24)), x + nx * 0.16, y + 0.12, z + nz * 0.16],
      ] as [number, number, number, THREE.Material, number, number, number][]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), mat);
        b.position.set(px, py, pz);
        b.userData.noShadow = true;
        h.add(b);
      }
    });
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }),
    );
    sprite.scale.set(0.38, 0.3, 1);
    sprite.position.set(x + nx * 0.16, y + 0.57, z + nz * 0.16);
    this.group.add(sprite);
    const light = this.light(x + nx * 0.45, y + 0.6, z + nz * 0.45, color, intensity);
    light.shadow = true; // toda tocha pode ganhar sombra de verdade (o motor dá às mais perto)
    // o BRILHO DE LONGE: uma mancha de luz na parede (em volta da chama), que só aparece enquanto a tocha está sem luz de verdade (longe do jogador)
    const haloMat = this.mat(`halo:${color}`, () => new THREE.MeshBasicMaterial({ map: this.poolTex ?? (this.poolTex = lightPoolTexture()), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: true, opacity: 0.3, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 })) as THREE.MeshBasicMaterial;
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), haloMat.clone());
    halo.position.set(x + nx * 0.03, y + 0.55, z + nz * 0.03);
    halo.rotation.y = Math.atan2(nx, nz);
    halo.renderOrder = 2;
    this.group.add(halo);
    this.torches.push({ sprite, light, phase, base: intensity, halo: halo.material as THREE.MeshBasicMaterial });
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
    p.userData.merge = true; // (o kit.bake junta todas as sombras de contato da sala num desenho só)
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
    const m = this.mat('pilaster', () => lambert(brickTexture([1, 1], 1.05, 77, this.theme)));
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

  // ── peças do quadro de estilo (DIRECAO_DE_ARTE.md §4.2, §4.4, §4.5) ──
  // FULIGEM acima de uma chama encostada numa parede: (x, y, z) = a base da mancha (a altura da chama), (nx, nz) = para onde a parede olha
  soot(x: number, y: number, z: number, nx: number, nz: number, w = 0.9, h = 1.5) {
    const m = this.mat('soot', () => new THREE.MeshBasicMaterial({ map: sootTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    p.position.set(x + nx * 0.012, y + h / 2, z + nz * 0.012);
    p.rotation.y = Math.atan2(nx, nz);
    p.renderOrder = 2;
    this.group.add(p);
    return p;
  }
  // POÇA DE LUZ no chão (aditiva), embaixo de uma chama; devolve o material para a chama controlar o brilho
  lightPool(x: number, z: number, r = 1.6, y = 0, color = 0xffb060) {
    // (decalque: o plano fica 3 cm ACIMA do chão e o polygonOffset é mínimo; offset alto fazia a poça vazar por cima da base dos objetos e das
    // paredes vistas de longe ou em ângulo baixo. Com névoa, como o resto.)
    const mat = new THREE.MeshBasicMaterial({ map: this.poolTex ?? (this.poolTex = lightPoolTexture()), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: true, opacity: 0.32, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2 * r, 2 * r), mat);
    p.rotation.x = -Math.PI / 2;
    p.position.set(x, y + 0.03, z);
    p.renderOrder = 4;
    this.group.add(p);
    return mat;
  }
  // DESGASTE do chão no caminho de quem passa (uma faixa, ponto a ponto)
  wear(points: [number, number][], width = 1.3, y = 0) {
    const m = this.mat('wear', () => new THREE.MeshBasicMaterial({ map: wearTexture(), color: 0x3a3228, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    for (let i = 0; i + 1 < points.length; i++) {
      const [ax, az] = points[i];
      const [bx, bz] = points[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(width, len + 0.3), m);
      p.rotation.set(-Math.PI / 2, 0, Math.atan2(bx - ax, -(bz - az)));
      p.position.set((ax + bx) / 2, y + 0.015, (az + bz) / 2); // (1,5 cm acima do chão, em vez de depender do offset)
      p.renderOrder = 1;
      this.group.add(p);
    }
  }
  // BATENTE GROSSO numa passagem em arco (a parede tem espessura): duas ombreiras de pedra lavrada com impostas e a SOLEIRA no chão.
  // (cx, z) = o meio da passagem na parede; `dir` = para que lado (z) fica a sala (+1 ou -1)
  batente(cx: number, z: number, dir: number, y0 = 0) {
    for (const s of [-1, 1]) {
      const x = cx + s * (DW + 0.48);
      this.box(0.34, DH + 0.1, 0.34, this.slab, x, y0 + (DH + 0.1) / 2, z + dir * 0.17, false);
      this.box(0.44, 0.14, 0.42, this.slab, x, y0 + DH + 0.17, z + dir * 0.19, false); // a imposta
      this.box(0.44, 0.1, 0.42, this.slab, x, y0 + 0.05, z + dir * 0.19, false); // o pé
      this.rects.push([x - 0.22, Math.min(z, z + dir * 0.42), x + 0.22, Math.max(z, z + dir * 0.42), y0 + 2]);
    }
    this.box(2 * DW + 0.5, 0.04, 0.5, this.slab, cx, y0 + 0.02, z + dir * 0.2, false); // a soleira, gasta no meio
  }
  // NICHO na parede: moldura de pedra lavrada com arco reto, fundo escuro e uma prateleira; (x, y, z) = o meio da base, (nx, nz) = para onde olha.
  // Devolve um grupo alinhado ao nicho (x para a direita de quem olha, y para cima, z para fora) para pôr objetos dentro.
  niche(x: number, y: number, z: number, nx: number, nz: number, w = 0.62, h = 0.72) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = Math.atan2(nx, nz);
    this.group.add(g);
    const add = (bw: number, bh: number, bd: number, m: THREE.Material, px: number, py: number, pz: number) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), m);
      b.position.set(px, py, pz);
      g.add(b);
      this.surfaces.push(b);
    };
    const D = 0.3;
    add(w + 0.3, 0.12, D, this.slab, 0, -0.06, D / 2); // peitoril (a prateleira)
    add(0.15, h, D, this.slab, -w / 2 - 0.075, h / 2, D / 2);
    add(0.15, h, D, this.slab, w / 2 + 0.075, h / 2, D / 2);
    add(w + 0.3, 0.16, D, this.slab, 0, h + 0.08, D / 2); // verga
    const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0x0c0910 })); // o fundo do nicho, na sombra funda
    back.position.set(0, h / 2, 0.012);
    g.add(back);
    // o "teto" e os lados de dentro, na sombra
    add(w, 0.02, D, this.mat('nicheIn', () => lambert(null, 0x221c24)), 0, h - 0.01, D / 2);
    const cx = x + nx * D * 0.5;
    const cz = z + nz * D * 0.5;
    const hw = (w + 0.3) / 2;
    this.rects.push(Math.abs(nx) > 0.5 ? [cx - D / 2, cz - hw, cx + D / 2, cz + hw, y + h + 0.3] : [cx - hw, cz - D / 2, cx + hw, cz + D / 2, y + h + 0.3]);
    return g;
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

  // POEIRA SÓ DENTRO DE UM FEIXE DE LUZ (DIRECAO_DE_ARTE.md §4.8): grãos que flutuam num cilindro de luz (o poço, o buraco do pátio, a luz do
  // nicho alto). Antes havia poeira na sala inteira, igual em toda parte: saiu. Pode haver vários feixes por sala.
  beamDust(cx: number, cz: number, r: number, y0: number, y1: number, n = 36, color = 0xf0e4c8) {
    const pos = new Float32Array(n * 3);
    const seed: number[] = [];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(Math.random()) * r * 0.9;
      pos[i * 3] = cx + Math.cos(a) * rr;
      pos[i * 3 + 1] = y0 + Math.random() * (y1 - y0);
      pos[i * 3 + 2] = cz + Math.sin(a) * rr;
      seed.push(Math.random() * 10);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.beams.push({ geo, cx, cz, r, y0, y1, seed });
    this.group.add(new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 2, sizeAttenuation: false, transparent: true, opacity: 0.75, fog: false, depthWrite: false })));
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
      out.castShadow = meshes.some((m) => m.castShadow); // (as peças que fazem sombra continuam fazendo, juntas)
      out.receiveShadow = meshes.some((m) => m.receiveShadow);
      if (meshes.every((m) => m.userData.noShadow)) out.userData.noShadow = true;
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
      if (this.lively && dbg.flicker) {
        const p = tc.phase;
        const n = 0.25 * Math.sin(t * 7.3 + p) + 0.15 * Math.sin(t * 13.1 + p * 2) + 0.1 * Math.sin(t * 23.7 + p * 3) + 0.06 * Math.sin(t * 2.1 + p);
        tc.light.intensity = tc.base * (1 + 0.22 * n);
        tc.light.jit.set(Math.sin(t * 6.1 + p) * 0.035, Math.sin(t * 8.7 + p * 1.3) * 0.03 + n * 0.02, Math.cos(t * 5.3 + p) * 0.035);
      } else
      tc.light.intensity = dbg.flicker ? tc.base * (1 + 0.025 * Math.sin(t * 4 + tc.phase) + 0.015 * Math.sin(t * 9.3 + tc.phase * 2)) : tc.base;
      // (o primeiro quadro do jogo chegava a ter o relógio negativo, e um índice negativo deixava a chama sem desenho: um retângulo branco)
      tc.sprite.material.map = this.frame(t * 8 + i);
      // o brilho falso some na medida em que a luz de verdade chega (e oscila com a chama)
      const fake = (1 - tc.light.lit) * (tc.light.intensity / Math.max(1, tc.base)) * lightEnv.scale;
      if (tc.halo) {
        tc.halo.opacity = 0.3 * fake;
        tc.halo.visible = fake > 0.02;
      }
    });
    for (const b of this.beams) {
      // descem devagar, rodopiando (a luz de cima as faz brilhar); quem sai do feixe volta para o alto dele
      const arr = b.geo.attributes.position.array as Float32Array;
      for (let i = 0; i < b.seed.length; i++) {
        const k = b.seed[i];
        arr[i * 3] += Math.sin(t * 0.5 + k) * dt * 0.05;
        arr[i * 3 + 2] += Math.cos(t * 0.43 + k * 1.7) * dt * 0.05;
        arr[i * 3 + 1] -= dt * (0.03 + (k % 1) * 0.04);
        const dx = arr[i * 3] - b.cx;
        const dz = arr[i * 3 + 2] - b.cz;
        if (arr[i * 3 + 1] < b.y0 || dx * dx + dz * dz > b.r * b.r) {
          const a = k * 2.3 + t;
          const rr = Math.sqrt((k * 0.37) % 1) * b.r * 0.85;
          arr[i * 3] = b.cx + Math.cos(a) * rr;
          arr[i * 3 + 1] = b.y1 - Math.random() * 0.3;
          arr[i * 3 + 2] = b.cz + Math.sin(a) * rr;
        }
      }
      b.geo.attributes.position.needsUpdate = true;
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
  wallMat?: THREE.Material; // material da parede (UV em metros ÷ uvScale)
  uvScale?: number;
  thick?: number; // espessura da parede (para trás); a laje da porta sobe para DENTRO dela e some
}

// a parede com o vão em arco: plana (como sempre) ou, com `thick`, um bloco com espessura (as faces do vão são a ombreira e o intradorso)
function archWall(shape: THREE.Shape, mat: THREE.Material, thick: number | undefined, uvScale: number) {
  if (!thick) return new THREE.Mesh(new THREE.ShapeGeometry(shape, 12), mat);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: 12 });
  geo.translate(0, 0, -thick);
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / uvScale, uv.getY(i) / uvScale);
  return new THREE.Mesh(geo, mat);
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
  const wm = archWall(wall, o.wallMat ?? lambert(brickTexture([1 / T, 1 / T], 1, 23, theme)), o.thick, o.uvScale ?? 1);
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
export function buildEntrance(kit: Kit, o: { x0: number; x1: number; z: number; h: number; theme?: string; y0?: number; wallMat?: THREE.Material; uvScale?: number; thick?: number }) {
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
  const wm = archWall(wall, o.wallMat ?? lambert(brickTexture([1 / T, 1 / T], 1, 25, theme)), o.thick, o.uvScale ?? 1);
  wm.rotation.y = Math.PI; // de frente pra dentro da sala
  wm.position.z = o.z;
  wm.position.y = o.y0 ?? 0;
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
  rm.position.y = o.y0 ?? 0;
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
