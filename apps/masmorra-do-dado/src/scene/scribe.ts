// O Escrivão (referência: folha de personagem do Pedro, frente/lado/costas). Feito por código, peça por peça, com sombreado FACETADO
// (cada face com o seu tom, como no desenho) e texturas de pixel:
// · capuz facetado: aba pontuda projetada para a frente, abertura em losango debruada de ouro, só escuridão dentro e DOIS OLHOS QUADRADOS
//   que brilham; o pico fica atrás da aba e a nuca é arredondada;
// · gola em duas dobras; capa curta com barra dourada, em V na frente e nas costas;
// · túnica em DUAS camadas: casaco de fora aberto na frente em V invertido (bordas e barra douradas, barra recortada) e túnica de baixo
//   pregueada até o chão, com a sua barra dourada;
// · estola vermelha na frente e nas costas com o glifo dourado (haste, travessas e losango), por baixo do cinto;
// · cinto de corda duplo com nó e uma chave dourada; sobremangas com debrum, mangas em sino com duas faixas douradas;
// · mãos de luva escura com DEDOS SEPARADOS (duas falanges cada, comprimentos diferentes) e polegar; sapatos escuros sob a barra.
// Origem no chão; a frente é +z. `animate` recebe a pose; o corpo chega nela com atraso (peso de pano).

import * as THREE from 'three';

export interface ScribePose {
  walk?: number; // velocidade de caminhada (m/s); 0 = parado
  lean?: number; // 0 de pé … 1 debruçado
  headYaw?: number;
  headPitch?: number; // + = olha para baixo
  reach?: number; // 0..1 braço direito estendido à frente
  back?: number; // 0..1 mão direita vai para dentro do manto (de onde sai o dado)
  open?: number; // 0..1 a mão se abre e solta o que segura
  rest?: number; // 0..1 mão esquerda pousada à frente (na borda do poço)
  raise?: number; // 0..1 braço direito erguido ALTO, à frente e acima do capuz
}

export interface Scribe {
  group: THREE.Group;
  setAlpha(v: number): void;
  update(t: number, arm: number): void; // compatível com a cena antiga (A Entrada)
  animate(dt: number, t: number, pose: ScribePose): void;
  hand: THREE.Object3D; // a palma da mão direita (onde o dado fica)
  head: THREE.Object3D; // o capuz (para a câmera mirar)
}

// ── paleta da referência ──
const PURPLE = '#553276';
const PURPLE_IN = '#3c2456'; // túnica de baixo
const GOLD = '#d6ad70';
const GOLD_D = '#a07d4c';
const RED = '#a83e4a';
const RED_D = '#74283a';
const GLOVE = '#3a3246';
const SHOE = '#231e2b';
const ROPE = '#b89060';

const rnd = (k: number) => {
  const x = Math.sin(k * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
function tex(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// pano liso com um grão leve; `hem`: faixas douradas [v0, v1] (v = 0 embaixo); `edge`: debrum dourado nas duas bordas laterais (px)
function clothTex(o: { w?: number; h?: number; base?: string; hem?: [number, number][]; edge?: number }) {
  const W = o.w ?? 64;
  const Hh = o.h ?? 64;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = Hh;
  const g = c.getContext('2d')!;
  g.fillStyle = o.base ?? PURPLE;
  g.fillRect(0, 0, W, Hh);
  for (let i = 0; i < W * Hh * 0.08; i++) {
    g.fillStyle = rnd(i) > 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.05)';
    g.fillRect(Math.floor(rnd(i + 1) * W), Math.floor(rnd(i + 2) * Hh), 1, 1);
  }
  const band = (x: number, y: number, w: number, h: number) => {
    g.fillStyle = GOLD;
    g.fillRect(x, y, w, h);
  };
  for (const [v0, v1] of o.hem ?? []) {
    const y0 = Math.round((1 - v1) * Hh);
    const y1 = Math.round((1 - v0) * Hh);
    band(0, y0, W, Math.max(1, y1 - y0));
    g.fillStyle = GOLD_D;
    g.fillRect(0, y1 - 1, W, 1);
  }
  if (o.edge) {
    band(0, 0, o.edge, Hh);
    band(W - o.edge, 0, o.edge, Hh);
    g.fillStyle = GOLD_D;
    g.fillRect(o.edge, 0, 1, Hh);
    g.fillRect(W - o.edge - 1, 0, 1, Hh);
  }
  return c;
}
// estola vermelha; com `glyph`, o glifo dourado (haste vertical, duas travessas e um losango vazado)
function stoleTex(glyph: boolean) {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 80;
  const g = c.getContext('2d')!;
  g.fillStyle = RED;
  g.fillRect(0, 0, 32, 80);
  g.fillStyle = RED_D;
  g.fillRect(0, 0, 2, 80);
  g.fillRect(30, 0, 2, 80);
  for (let x = 5; x < 28; x += 7) {
    g.fillStyle = 'rgba(0,0,0,0.10)';
    g.fillRect(x, 0, 1, 80);
  }
  if (glyph) {
    const cx = 15;
    const top = 10;
    const bot = 60;
    g.fillStyle = GOLD;
    g.fillRect(cx, top, 2, bot - top);
    g.fillRect(cx - 4, top + 7, 10, 2);
    g.fillRect(cx - 4, bot - 5, 10, 2);
    const ly = 34;
    g.fillStyle = RED;
    g.fillRect(cx - 6, ly - 7, 14, 14);
    g.fillStyle = GOLD;
    for (let i = 0; i <= 6; i++) {
      for (const [x, y] of [[cx + 1 - i, ly - 6 + i], [cx + i, ly - 6 + i], [cx + 1 - i, ly + 6 - i], [cx + i, ly + 6 - i], [cx - i, ly - 6 + i], [cx + 1 + i, ly - 6 + i], [cx - i, ly + 6 - i], [cx + 1 + i, ly + 6 - i]]) g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

// SOMBREADO FACETADO: separa as faces e grava em cada uma um tom conforme a sua inclinação (luz fixa de cima, da frente-esquerda).
// Fica gravado na cor dos vértices, então o desenho das facetas aparece com qualquer luz do jogo.
const LIGHT = new THREE.Vector3(-0.42, 0.78, 0.46).normalize();
function facet(geo: THREE.BufferGeometry, center = new THREE.Vector3(0, 0, 0), amb = 0.6): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.computeVertexNormals();
  const n = g.attributes.normal;
  const p = g.attributes.position;
  const col = new Float32Array(n.count * 3);
  for (let i = 0; i < n.count; i += 3) {
    // o lado de FORA da face (o torno e as malhas feitas à mão nem sempre enrolam para o mesmo lado)
    const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3 - center.x;
    const cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3 - center.z;
    const cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3 - center.y;
    let nx = n.getX(i);
    let ny = n.getY(i);
    let nz = n.getZ(i);
    if (nx * cx + nz * cz + ny * cy * 0.25 < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    const d = nx * LIGHT.x + ny * LIGHT.y + nz * LIGHT.z;
    const k = Math.min(1.12, amb + 0.52 * Math.max(0, d));
    for (let j = 0; j < 3; j++) col[(i + j) * 3] = col[(i + j) * 3 + 1] = col[(i + j) * 3 + 2] = k;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

// superfície em anéis (de baixo para cima) em volta do eixo y, com uma ABERTURA na frente que pode variar com a altura (`gap`, rad);
// `pleat`: pregas em zigue-zague (mais fundas embaixo); `jag`: barra recortada (dentes) no anel de baixo; `dip(a)`: quanto a barra desce no ângulo a
function ringGeo(rings: { r: number; y: number; gap?: number }[], seg: number, o: { pleat?: number; jag?: number; dip?: (a: number) => number } = {}) {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const n = rings.length;
  rings.forEach((R, j) => {
    const gap = R.gap ?? 0;
    const low = 1 - j / (n - 1);
    for (let i = 0; i <= seg; i++) {
      const a = gap / 2 + ((Math.PI * 2 - gap) * i) / seg; // 0 = frente (+z)
      const r = R.r * (1 + (o.pleat ?? 0) * (i % 2 ? 1 : -1) * low);
      let y = R.y;
      if (j === 0 && o.jag && i % 2) y += o.jag;
      if (o.dip) y -= o.dip(a) * (j === 0 ? 1 : j === 1 ? 0.45 : 0);
      pos.push(Math.sin(a) * r, y, Math.cos(a) * r);
      uv.push(i / seg, j / (n - 1));
    }
  });
  for (let j = 0; j < n - 1; j++)
    for (let i = 0; i < seg; i++) {
      const a = j * (seg + 1) + i;
      const b = a + seg + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
// caixa afinada (uma falange, um osso): de y = 0 para baixo
function taper(w0: number, w1: number, len: number, d0: number, d1 = d0) {
  const g = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const top = p.getY(i) > 0;
    p.setX(i, p.getX(i) * (top ? w0 : w1));
    p.setZ(i, p.getZ(i) * (top ? d0 : d1));
    p.setY(i, top ? 0 : -len);
  }
  return g;
}

export function makeScribe(): Scribe {
  const group = new THREE.Group();
  const mats: THREE.Material[] = [];
  const lam = (o: THREE.MeshLambertMaterialParameters) => {
    const m = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, vertexColors: true, ...o });
    mats.push(m);
    return m;
  };
  const E_PURPLE = 0x23123a;
  const flat = (color: string, k = 0.22) => lam({ color, emissive: new THREE.Color(color).multiplyScalar(k) });

  // ── materiais ──
  const purpleMat = lam({ map: tex(clothTex({})), emissive: E_PURPLE });
  const purpleDarkMat = lam({ map: tex(clothTex({ base: '#472a64' })), emissive: 0x1c0e30 });
  const innerMat = lam({ map: tex(clothTex({ w: 64, h: 64, base: PURPLE_IN, hem: [[0.0, 0.055]] })), emissive: 0x180c28 });
  const coatMat = lam({ map: tex(clothTex({ w: 128, h: 64, hem: [[0.0, 0.07]], edge: 3 })), emissive: E_PURPLE });
  const capeMat = lam({ map: tex(clothTex({ w: 64, h: 32, hem: [[0.0, 0.2]] })), emissive: E_PURPLE });
  const overSleeveMat = lam({ map: tex(clothTex({ w: 32, h: 32, hem: [[0.0, 0.2]] })), emissive: E_PURPLE });
  const sleeveMat = lam({ map: tex(clothTex({ w: 32, h: 48, hem: [[0.03, 0.12], [0.2, 0.27]] })), emissive: E_PURPLE });
  const goldMat = flat(GOLD, 0.3);
  const gloveMat = flat(GLOVE, 0.3);
  const shoeMat = flat(SHOE, 0.3);
  const ropeMat = flat(ROPE, 0.28);
  const voidMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfff2cc, fog: false });
  // halo dos olhos: um degradê redondo em pixels
  const haloCv = document.createElement('canvas');
  haloCv.width = haloCv.height = 16;
  {
    const g = haloCv.getContext('2d')!;
    const img = g.createImageData(16, 16);
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const d = Math.hypot(x - 7.5, y - 7.5) / 8;
        const o = (y * 16 + x) * 4;
        img.data[o] = 255;
        img.data[o + 1] = 200;
        img.data[o + 2] = 120;
        img.data[o + 3] = Math.round(255 * Math.max(0, 1 - d) ** 2 * 0.75);
      }
    g.putImageData(img, 0, 0);
  }
  const eyeGlowMat = new THREE.MeshBasicMaterial({ map: tex(haloCv), transparent: true, opacity: 0.9, depthWrite: false, fog: false, blending: THREE.AdditiveBlending });
  const stoleMat = lam({ map: tex(stoleTex(false)), emissive: 0x2c0d14 });
  const stoleGlyphMat = lam({ map: tex(stoleTex(true)), emissive: 0x2c0d14 });
  mats.push(voidMat, eyeMat, eyeGlowMat);
  const Y = new THREE.Vector3(0, 1, 0);
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, center?: THREE.Vector3) => new THREE.Mesh(facet(g, center), m);

  // ── pés (sapatos escuros sob a barra) ──
  const mkShoe = (x: number) => {
    const g = new THREE.BoxGeometry(0.13, 0.08, 0.26);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getZ(i) > 0) p.setX(i, p.getX(i) * 0.7); // bico mais estreito
    const s = mesh(g, shoeMat);
    s.position.set(x, 0.04, 0.16);
    group.add(s);
    return s;
  };
  const shoeL = mkShoe(0.11);
  const shoeR = mkShoe(-0.11);

  // ── quadril: a túnica de baixo (pregueada, até o chão) e o casaco de fora (aberto na frente em V invertido) ──
  const hips = new THREE.Group();
  group.add(hips);
  const innerGeo = facet(ringGeo([{ r: 0.44, y: 0.03 }, { r: 0.42, y: 0.2 }, { r: 0.37, y: 0.5 }, { r: 0.31, y: 0.8 }, { r: 0.26, y: 1.02 }], 20, { pleat: 0.075 }));
  const inner = new THREE.Mesh(innerGeo, innerMat);
  hips.add(inner);
  const coatGeo = facet(
    ringGeo([{ r: 0.47, y: 0.27, gap: 1.45 }, { r: 0.44, y: 0.42, gap: 1.22 }, { r: 0.385, y: 0.62, gap: 0.95 }, { r: 0.325, y: 0.84, gap: 0.68 }, { r: 0.285, y: 1.02, gap: 0.46 }], 18, { pleat: 0.045, jag: 0.06 }),
  );
  const coat = new THREE.Mesh(coatGeo, coatMat);
  hips.add(coat);
  const dyn: { geo: THREE.BufferGeometry; rest: Float32Array; top: number }[] = [innerGeo, coatGeo].map((geo) => ({ geo, rest: Float32Array.from(geo.attributes.position.array as Float32Array), top: 1.02 }));

  // estola (parte de baixo, presa ao quadril): frente com o glifo, da cintura até abaixo do joelho; costas mais longa, com o glifo
  const stolePiece = (w: number, len: number, point: boolean, m: THREE.Material) => {
    const s = new THREE.Shape();
    s.moveTo(-w, 0);
    s.lineTo(w, 0);
    if (point) {
      s.lineTo(w, -len + 0.07);
      s.lineTo(w * 0.35, -len + 0.03);
      s.lineTo(0, -len);
      s.lineTo(-w * 0.45, -len + 0.05);
      s.lineTo(-w, -len + 0.08);
    } else {
      s.lineTo(w, -len);
      s.lineTo(-w, -len);
    }
    s.closePath();
    const g = new THREE.ShapeGeometry(s);
    const p = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w) / (2 * w), 1 + p.getY(i) / len);
    return new THREE.Mesh(facet(g, new THREE.Vector3(0, 0, -1), 0.8), m);
  };
  const stoleFL = stolePiece(0.105, 0.62, true, stoleGlyphMat);
  stoleFL.position.set(0, 1.03, 0.3);
  stoleFL.rotation.x = -0.215; // acompanha a túnica que se abre
  hips.add(stoleFL);
  const stoleBL = stolePiece(0.115, 0.72, true, stoleGlyphMat);
  stoleBL.position.set(0, 1.03, -0.3);
  stoleBL.rotation.set(0.255, Math.PI, 0);
  hips.add(stoleBL);

  // cinto de corda (duas voltas) POR CIMA da estola, com o nó e a chave dourada do lado direito dele
  for (const [y, r] of [[1.03, 0.293], [1.0, 0.298]]) {
    const belt = mesh(new THREE.TorusGeometry(r, 0.017, 5, 22), ropeMat);
    belt.rotation.x = Math.PI / 2;
    belt.position.y = y;
    hips.add(belt);
  }
  const knot = mesh(new THREE.BoxGeometry(0.055, 0.07, 0.05), ropeMat);
  knot.position.set(-0.15, 1.0, 0.265);
  knot.rotation.z = 0.3;
  hips.add(knot);
  const keyG = new THREE.Group();
  keyG.position.set(-0.17, 0.97, 0.285);
  keyG.rotation.z = -0.08;
  hips.add(keyG);
  const loop = mesh(new THREE.TorusGeometry(0.03, 0.009, 4, 8, Math.PI), ropeMat, new THREE.Vector3(0, 0, -1)); // a alça de corda que segura a chave
  loop.rotation.z = Math.PI;
  loop.position.y = -0.02;
  keyG.add(loop);
  const bow = mesh(new THREE.TorusGeometry(0.05, 0.014, 4, 4), goldMat, new THREE.Vector3(0, 0, -1)); // a argola em losango
  bow.position.y = -0.115;
  keyG.add(bow);
  const shaft = mesh(new THREE.BoxGeometry(0.024, 0.19, 0.02), goldMat);
  shaft.position.y = -0.26;
  keyG.add(shaft);
  for (const [dy, w] of [[-0.31, 0.06], [-0.345, 0.045]]) {
    const bit = mesh(new THREE.BoxGeometry(w, 0.022, 0.02), goldMat);
    bit.position.set(-w / 2, dy, 0);
    keyG.add(bit);
  }

  // ── tronco (inclina a partir da cintura) ──
  const torso = new THREE.Group();
  torso.position.y = 1.0;
  hips.add(torso);
  torso.add(mesh(ringGeo([{ r: 0.275, y: -0.02 }, { r: 0.285, y: 0.14 }, { r: 0.27, y: 0.27 }, { r: 0.2, y: 0.37 }, { r: 0.12, y: 0.43 }], 14), purpleMat));
  // estola (parte de cima, presa ao tronco): sai de baixo da capa e entra sob o cinto
  const stoleFU = stolePiece(0.105, 0.34, false, stoleMat);
  stoleFU.position.set(0, 0.33, 0.275);
  stoleFU.rotation.x = -0.06;
  torso.add(stoleFU);
  const stoleBU = stolePiece(0.115, 0.34, false, stoleMat);
  stoleBU.position.set(0, 0.33, -0.275);
  stoleBU.rotation.set(0.06, Math.PI, 0);
  torso.add(stoleBU);

  // capa curta sobre os ombros: barra dourada, em V na frente e nas costas, caindo um pouco sobre os braços
  const angDist = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  const capeGeo = facet(
    ringGeo([{ r: 0.405, y: 0.295 }, { r: 0.39, y: 0.335 }, { r: 0.3, y: 0.395 }, { r: 0.2, y: 0.44 }], 16, {
      dip: (a) => 0.11 * Math.max(0, 1 - angDist(a, 0) / 0.8) + 0.1 * Math.max(0, 1 - angDist(a, Math.PI) / 0.8) + 0.035 * Math.max(0, 1 - Math.min(angDist(a, Math.PI / 2), angDist(a, -Math.PI / 2)) / 0.5),
    }),
  );
  const cape = new THREE.Mesh(capeGeo, capeMat);
  torso.add(cape);
  dyn.push({ geo: capeGeo, rest: Float32Array.from(capeGeo.attributes.position.array as Float32Array), top: 0.44 });
  // gola: duas dobras grossas do capuz descansando nos ombros, com um V leve na frente
  const fold = (r0: number, y0: number, h: number, bulge: number, m: THREE.Material) =>
    mesh(
      ringGeo([{ r: r0, y: y0 }, { r: r0 + bulge, y: y0 + h * 0.3 }, { r: r0 + bulge * 0.9, y: y0 + h * 0.7 }, { r: r0 - 0.03, y: y0 + h }], 12, { dip: (a) => 0.08 * Math.max(0, 1 - angDist(a, 0) / 0.9) }),
      m,
    );
  torso.add(fold(0.235, 0.375, 0.1, 0.075, purpleDarkMat));
  torso.add(fold(0.2, 0.435, 0.09, 0.07, purpleMat));

  // ── CAPUZ: malha feita à mão, facetada. O contorno da abertura (um losango alto, mais largo um pouco acima do meio) é o primeiro anel;
  // os anéis seguintes abrem para fora e para trás (a aba, o volume da cabeça, a nuca); o ponto de cima de cada anel sobe para formar o pico ──
  const neck = new THREE.Group();
  neck.position.set(0, 0.45, 0.0);
  torso.add(neck);
  // o pano que liga os ombros ao capuz quando ele projeta a cabeça para a frente (o capuz se estica como tecido)
  const drapeGeo = new THREE.CylinderGeometry(0.15, 0.2, 1, 10, 1, true);
  drapeGeo.translate(0, 0.5, 0);
  const drape = new THREE.Mesh(facet(drapeGeo), purpleMat);
  drape.visible = false;
  torso.add(drape);
  const hood = new THREE.Group();
  hood.scale.setScalar(1.16); // capuz grande, como na referência
  neck.add(hood);
  // meio contorno (x ≥ 0), de cima para baixo: [x, y, z]; o topo da abertura fica mais À FRENTE que o queixo (a aba)
  const HALF: [number, number, number][] = [
    [0, 0.43, 0.2],
    [0.075, 0.355, 0.195],
    [0.15, 0.27, 0.18],
    [0.2, 0.185, 0.16],
    [0.16, 0.1, 0.14],
    [0.08, 0.005, 0.115],
    [0, -0.07, 0.1],
  ];
  const A: THREE.Vector3[] = [...HALF.map(([x, y, z]) => new THREE.Vector3(x, y, z)), ...HALF.slice(1, -1).reverse().map(([x, y, z]) => new THREE.Vector3(-x, y, z))];
  const NA = A.length; // 12
  const C0 = new THREE.Vector3(0, 0.19, 0);
  const TOPW = [1, 0.5, 0.12, 0, 0, 0, 0, 0, 0, 0, 0.12, 0.5]; // quanto cada ponto do anel sobe para formar o pico
  const ring = (s: number, dz: number, lift: number, sy = s) => A.map((p, i) => new THREE.Vector3((p.x - C0.x) * s, C0.y + (p.y - C0.y) * sy + lift * TOPW[i], p.z + dz));
  const strip = (pos: number[], uv: number[], R0: THREE.Vector3[], R1: THREE.Vector3[], v0: number, v1: number) => {
    for (let i = 0; i < NA; i++) {
      const j = (i + 1) % NA;
      const q: [THREE.Vector3, number, number][] = [[R0[i], i / NA, v0], [R0[j], (i + 1) / NA, v0], [R1[i], i / NA, v1], [R0[j], (i + 1) / NA, v0], [R1[j], (i + 1) / NA, v1], [R1[i], i / NA, v1]];
      for (const [p, u, v] of q) {
        pos.push(p.x, p.y, p.z);
        uv.push(u, v);
      }
    }
  };
  const fan = (pos: number[], uv: number[], R: THREE.Vector3[], c: THREE.Vector3) => {
    for (let i = 0; i < NA; i++) {
      const j = (i + 1) % NA;
      for (const p of [R[i], R[j], c]) {
        pos.push(p.x, p.y, p.z);
        uv.push(0.5, 0.5);
      }
    }
  };
  const build = (f: (pos: number[], uv: number[]) => void) => {
    const pos: number[] = [];
    const uv: number[] = [];
    f(pos, uv);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return g;
  };
  const RT = ring(1.19, -0.012, 0.02); // borda de fora do debrum
  const RB = ring(1.38, -0.1, 0.1, 1.3); // a aba vira o volume da cabeça
  const RC = ring(1.42, -0.25, 0.2, 1.22); // o PICO fica aqui atrás, acima da aba
  const RD = ring(1.12, -0.36, 0.04, 1.0); // nuca arredondada
  const BACK = new THREE.Vector3(0, 0.17, -0.3);
  const HC = new THREE.Vector3(0, 0.2, -0.08);
  hood.add(
    new THREE.Mesh(
      facet(
        build((p, u) => {
          strip(p, u, RT, RB, 0.2, 0.45);
          strip(p, u, RB, RC, 0.45, 0.7);
          strip(p, u, RC, RD, 0.7, 0.9);
          fan(p, u, RD, BACK);
        }),
        HC,
      ),
      purpleMat,
    ),
  );
  // debrum dourado: uma faixa de frente (do contorno até a borda de fora) e a espessura para dentro
  const AIN = A.map((p) => new THREE.Vector3((p.x - C0.x) * 0.9, C0.y + (p.y - C0.y) * 0.92, p.z - 0.045));
  hood.add(new THREE.Mesh(facet(build((p, u) => strip(p, u, A, RT, 0, 1)), new THREE.Vector3(0, 0.19, -1), 0.82), goldMat));
  hood.add(new THREE.Mesh(facet(build((p, u) => strip(p, u, AIN, A, 0, 1)), HC, 0.55), goldMat));
  // a escuridão: um funil preto para dentro
  hood.add(new THREE.Mesh(build((p, u) => fan(p, u, AIN, new THREE.Vector3(0, 0.19, 0.0))), voidMat));
  // os olhos: dois quadrados acesos, com um halo
  const eyes: THREE.Mesh[] = [];
  for (const x of [-0.062, 0.062]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.036, 0.012), eyeMat);
    e.position.set(x, 0.225, 0.118);
    hood.add(e);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.13), eyeGlowMat);
    glow.position.set(x, 0.225, 0.127);
    hood.add(glow);
    eyes.push(e, glow);
  }

  // ── braços: ombro → sobremanga com debrum → cotovelo → manga em sino com duas faixas → luva com dedos ──
  interface Finger {
    j1: THREE.Group;
    j2: THREE.Group;
    k: number; // quanto este dedo acompanha o fechar da mão
  }
  const mkArm = (side: 1 | -1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.29, 0.315, 0.0);
    torso.add(shoulder);
    const over = mesh(new THREE.CylinderGeometry(0.095, 0.16, 0.2, 9, 1, true), overSleeveMat);
    over.position.y = -0.09;
    shoulder.add(over);
    const elbow = new THREE.Group();
    elbow.position.y = -0.17;
    shoulder.add(elbow);
    const bellGeo = new THREE.CylinderGeometry(0.1, 0.23, 0.36, 10, 1, true);
    bellGeo.translate(0, -0.17, 0);
    elbow.add(mesh(bellGeo, sleeveMat));
    const inside = new THREE.Mesh(new THREE.CircleGeometry(0.2, 10), voidMat);
    inside.rotation.x = Math.PI / 2;
    inside.position.y = -0.3;
    elbow.add(inside);
    // LUVA: punho, palma (afinando para o punho), nós dos dedos, quatro dedos separados de duas falanges e polegar de duas
    const wrist = new THREE.Group();
    wrist.position.y = -0.33;
    wrist.scale.setScalar(1.45);
    elbow.add(wrist);
    const cuff = mesh(new THREE.CylinderGeometry(0.034, 0.038, 0.05, 7), gloveMat);
    cuff.position.y = -0.005;
    wrist.add(cuff);
    const palm = mesh(taper(0.062, 0.088, 0.085, 0.034, 0.038), gloveMat);
    palm.position.y = -0.025;
    wrist.add(palm);
    const fingers: Finger[] = [];
    const LEN = [0.072, 0.084, 0.078, 0.06]; // indicador, médio, anelar, mínimo
    for (let i = 0; i < 4; i++) {
      const fx = -side * (1.5 - i) * 0.0225; // o indicador fica do lado do polegar
      const j1 = new THREE.Group();
      j1.position.set(fx, -0.112, 0);
      j1.rotation.z = -side * (1.5 - i) * -0.085; // abrem em leque
      wrist.add(j1);
      const knuckle = mesh(new THREE.BoxGeometry(0.02, 0.016, 0.03), gloveMat);
      j1.add(knuckle);
      j1.add(mesh(taper(0.0165, 0.015, LEN[i] * 0.55, 0.021, 0.019), gloveMat));
      const j2 = new THREE.Group();
      j2.position.y = -LEN[i] * 0.55;
      j1.add(j2);
      j2.add(mesh(taper(0.015, 0.011, LEN[i] * 0.45, 0.019, 0.014), gloveMat));
      fingers.push({ j1, j2, k: 0.85 + i * 0.1 });
    }
    const t1 = new THREE.Group();
    t1.position.set(-side * 0.04, -0.045, 0.014);
    t1.rotation.set(-0.35, 0, -side * 0.75);
    wrist.add(t1);
    t1.add(mesh(taper(0.021, 0.018, 0.045, 0.022, 0.02), gloveMat));
    const t2 = new THREE.Group();
    t2.position.y = -0.045;
    t2.rotation.z = side * 0.3;
    t1.add(t2);
    t2.add(mesh(taper(0.018, 0.012, 0.036, 0.02, 0.014), gloveMat));
    return { shoulder, elbow, wrist, fingers, side };
  };
  const armL = mkArm(1);
  const armR = mkArm(-1);
  // fechar (1) ou abrir (-0,15) a mão: cada junta dobra para a palma (+z), os de fora um pouco mais
  const curl = (arm: typeof armL, c: number) => {
    for (const f of arm.fingers) {
      f.j1.rotation.x = -c * 0.8 * f.k;
      f.j2.rotation.x = -c * 1.0 * f.k;
    }
  };
  // o dado fica APOIADO na palma direita
  const hand = new THREE.Group();
  hand.position.set(0, -0.1, 0.105); // o dado (≈22 cm) apoiado na palma
  armR.wrist.add(hand);

  // ── estado animado ──
  const cur = { walk: 0, lean: 0, headYaw: 0, headPitch: 0, reach: 0, back: 0, open: 0, rest: 0, raise: 0 };
  const follow = (k: keyof typeof cur, target: number, rate: number, dt: number) => {
    cur[k] += (target - cur[k]) * (1 - Math.exp(-dt * rate));
  };
  const mix = (a: number, b: number, k: number) => a + (b - a) * k;
  let phase = 0;
  let blinkT = 1.5;
  let blink = 0;
  let glanceT = 2;
  let glanceTo = 0;
  let glance = 0;

  const animate = (dt: number, t: number, P: ScribePose) => {
    dt = Math.min(dt, 0.05);
    follow('walk', P.walk ?? 0, 5, dt);
    follow('lean', P.lean ?? 0, 2.4, dt);
    follow('headYaw', P.headYaw ?? 0, 3.2, dt);
    follow('headPitch', P.headPitch ?? 0, 3.2, dt);
    follow('reach', P.reach ?? 0, 3.8, dt);
    follow('back', P.back ?? 0, 4, dt);
    follow('open', P.open ?? 0, 8, dt);
    follow('rest', P.rest ?? 0, 3, dt);
    follow('raise', P.raise ?? 0, 3, dt);
    const w = Math.min(1, cur.walk / 0.8);
    phase += dt * (cur.walk / 0.9) * Math.PI;
    const s = Math.sin(phase);
    const c = Math.cos(phase);
    const breathe = Math.sin(t * 1.2);

    // passos: os sapatos aparecem e somem sob a barra; o corpo sobe e desce e balança
    shoeL.position.z = 0.16 + s * 0.16 * w;
    shoeL.position.y = 0.04 + Math.max(0, c) * 0.05 * w;
    shoeR.position.z = 0.16 - s * 0.16 * w;
    shoeR.position.y = 0.04 + Math.max(0, -c) * 0.05 * w;
    hips.position.y = Math.abs(s) * 0.025 * w + breathe * 0.004;
    hips.rotation.z = s * 0.035 * w;
    hips.rotation.y = s * 0.05 * w;
    // os panos balançam (mais na barra) e, andando, a barra fica um pouco para trás
    for (const d of dyn) {
      const pa = d.geo.attributes.position as THREE.BufferAttribute;
      const arr = pa.array as Float32Array;
      for (let i = 0; i < pa.count; i++) {
        const x0 = d.rest[i * 3];
        const y0 = d.rest[i * 3 + 1];
        const z0 = d.rest[i * 3 + 2];
        const low = d.top > 0.5 ? 1 - Math.min(1, y0 / d.top) : Math.max(0, (0.34 - y0) / 0.3);
        const a = Math.atan2(x0, z0);
        const k = 1 + Math.sin(a * 5 + t * 1.3 + y0 * 3) * 0.018 * low + Math.sin(phase * 2 + a) * 0.035 * low * w;
        arr[i * 3] = x0 * k;
        arr[i * 3 + 2] = z0 * k - (d.top > 0.5 ? low * low * 0.07 * w : 0);
      }
      pa.needsUpdate = true;
    }
    stoleFL.rotation.x = -0.215 + Math.sin(t * 1.5) * 0.012 - s * 0.05 * w;
    keyG.rotation.x = Math.sin(t * 1.9) * 0.05 + s * 0.25 * w;

    // tronco: curvado de leve, respira, inclina ao se debruçar; gira um pouco quando a mão vai ao manto
    torso.rotation.x = 0.05 + cur.lean * 0.85 + w * 0.06 + breathe * 0.012;
    torso.rotation.y = -cur.back * 0.3;
    torso.rotation.z = -hips.rotation.z * 0.6;
    // capuz: segue o alvo, dá olhadas curtas; os olhos piscam
    glanceT -= dt;
    if (glanceT < 0) {
      glanceT = 2 + Math.random() * 3.5;
      glanceTo = (Math.random() - 0.5) * 0.7 * (1 - cur.lean * 0.7);
    }
    glance += (glanceTo - glance) * (1 - Math.exp(-dt * 5));
    // debruçado, ele projeta a cabeça para a FRENTE na horizontal (por cima do poço), sem baixá-la: no espaço do tronco inclinado (θ),
    // o deslocamento (0, d·sen θ, d·cos θ) vira, no mundo, d metros para a frente na mesma altura
    const th = torso.rotation.x;
    const d = Math.max(0, cur.lean - 0.6) * 1.3;
    neck.position.set(0, 0.45 + d * Math.sin(th), d * Math.cos(th));
    drape.visible = d > 0.03;
    if (drape.visible) {
      const from = new THREE.Vector3(0, 0.36, -0.02);
      const to = new THREE.Vector3(0, neck.position.y + 0.12, neck.position.z - 0.02);
      const dir = to.clone().sub(from);
      drape.position.copy(from);
      drape.quaternion.setFromUnitVectors(Y, dir.clone().normalize());
      drape.scale.set(1, dir.length(), 1);
    }
    neck.rotation.set(cur.headPitch + cur.lean * 0.4 + Math.sin(t * 0.9) * 0.02, cur.headYaw + glance + Math.sin(t * 0.6) * 0.03, Math.sin(t * 0.5) * 0.03, 'YXZ');
    blinkT -= dt;
    if (blinkT < 0) {
      blinkT = 2.4 + Math.random() * 3;
      blink = 1;
    }
    blink = Math.max(0, blink - dt * 7);
    const eyeH = Math.max(0.08, 1 - Math.sin(Math.min(1, blink) * Math.PI));
    eyes.forEach((e) => (e.scale.y = eyeH));

    // braço esquerdo: um pouco aberto, balança ao andar; com `rest` pousa a mão à frente
    armL.shoulder.rotation.x = mix(-s * 0.25 * w + 0.03, -1.05, cur.rest);
    armL.shoulder.rotation.z = mix(0.2, 0.14, cur.rest);
    armL.elbow.rotation.x = mix(-0.22, -0.45, cur.rest);
    armL.wrist.rotation.y = mix(1.25, 0, cur.rest);
    curl(armL, mix(0.45, 0.15, cur.rest) + Math.sin(t * 0.8) * 0.04);
    // braço direito: balança; vai ao manto; estende-se; ergue-se alto (a palma para cima, com o dado); abre a mão
    const busy = Math.max(cur.reach, cur.raise, cur.back);
    let sx = s * 0.25 * w + 0.03;
    let sz = -0.2;
    let ex = -0.22;
    sx = mix(sx, -0.35, cur.back);
    sz = mix(sz, 0.35, cur.back);
    ex = mix(ex, -1.7, cur.back);
    sx = mix(sx, -1.35, cur.reach);
    sz = mix(sz, -0.1, cur.reach);
    ex = mix(ex, -0.15, cur.reach);
    sx = mix(sx, -2.35 - cur.lean * 0.15, cur.raise); // erguido alto e à FRENTE (sobre a boca do poço, não sobre a mureta)
    sz = mix(sz, 0.05, cur.raise);
    ex = mix(ex, -0.25, cur.raise);
    armR.shoulder.rotation.set(sx + breathe * 0.01, 0, sz);
    armR.elbow.rotation.x = ex;
    armR.wrist.rotation.x = mix(mix(0, 0.4, cur.reach), 0.95, cur.raise) - cur.open * 1.6;
    armR.wrist.rotation.y = -1.25 * (1 - busy); // ao segurar o dado, a palma vira para a frente/para cima
    curl(armR, mix(mix(0.45, 0.3, busy), -0.15, cur.open) + Math.sin(t * 0.9 + 1) * 0.04 * (1 - busy));
  };

  let lastT = -1;
  const baseOpacity = new Map(mats.map((m) => [m, m.opacity]));
  void Y;
  return {
    group,
    hand,
    head: hood,
    animate,
    setAlpha(v) {
      const a = Math.max(0, Math.min(1, v));
      group.visible = a > 0.01;
      for (const m of mats) {
        m.opacity = (baseOpacity.get(m) ?? 1) * a;
        m.transparent = a < 0.99 || m === eyeGlowMat;
        m.depthWrite = a > 0.98 && m !== eyeGlowMat;
      }
    },
    update(t, arm) {
      const dt = lastT < 0 ? 0.016 : Math.min(0.1, Math.max(0, t - lastT));
      lastT = t;
      animate(dt, t, { reach: arm * 0.8 });
      armR.elbow.rotation.x += Math.sin(t * 9) * 0.08 * arm; // traços curtos (escrevendo)
    },
  };
}
