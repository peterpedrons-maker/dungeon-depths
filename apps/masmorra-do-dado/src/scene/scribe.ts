// O Escrivão (referência: folha de personagem do Pedro, frente/lado/costas). Feito por código, com primitivas e texturas de pixel:
// capuz alto e pontudo com a abertura em ponta debruada de ouro, só escuridão dentro e DOIS OLHOS QUADRADOS que brilham; gola grossa;
// capa curta terminando em V na frente, com barra dourada; túnica roxa até o chão, com pregas, barra dourada e uma camada de baixo mais escura;
// estola vermelha na frente e nas costas com o glifo dourado (haste, losango e travessas); cinto de corda com uma chave dourada; mangas largas
// em sino com duas faixas douradas; mãos de luva escura; sapatos escuros aparecendo sob a barra.
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
const PURPLE = '#4e2e6e';
const PURPLE_D = '#3e2558';
const PURPLE_L = '#5e3b80';
const PURPLE_IN = '#2a1a3c'; // camada de baixo / dentro
const GOLD = '#d2a96c';
const GOLD_D = '#9c7a4a';
const RED = '#a23c48';
const RED_D = '#6e2633';
const GLOVE = '#2b2433';
const SHOE = '#1c1822';
const ROPE = '#b08a5a';

function cv(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, g: c.getContext('2d')! };
}
function tex(c: HTMLCanvasElement, repeatX = 1) {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.x = repeatX;
  return t;
}
const rnd = (k: number) => {
  const x = Math.sin(k * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// pano roxo com pregas verticais (claro/escuro alternando) — `bands`: faixas douradas [v0, v1] (v = 0 embaixo); `front`: bordas douradas da abertura da frente
function clothTex(o: { w?: number; h?: number; base?: string; dark?: string; light?: string; folds?: number; bands?: [number, number][]; front?: number; tatter?: boolean }) {
  const W = o.w ?? 64;
  const Hh = o.h ?? 64;
  const { c, g } = cv(W, Hh);
  const folds = o.folds ?? 8;
  for (let x = 0; x < W; x++) {
    const ph = ((x / W) * folds) % 1;
    const col = ph < 0.18 ? o.dark ?? PURPLE_D : ph > 0.78 ? o.light ?? PURPLE_L : o.base ?? PURPLE;
    g.fillStyle = col;
    g.fillRect(x, 0, 1, Hh);
  }
  // ruído de tecido
  for (let i = 0; i < W * Hh * 0.06; i++) {
    g.fillStyle = rnd(i) > 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.06)';
    g.fillRect(Math.floor(rnd(i + 1) * W), Math.floor(rnd(i + 2) * Hh), 1, 1);
  }
  for (const [v0, v1] of o.bands ?? []) {
    const y0 = Math.round((1 - v1) * Hh);
    const y1 = Math.round((1 - v0) * Hh);
    g.fillStyle = GOLD;
    g.fillRect(0, y0, W, Math.max(1, y1 - y0));
    g.fillStyle = GOLD_D;
    g.fillRect(0, y1 - 1, W, 1);
  }
  if (o.front !== undefined) {
    // abertura da frente: u = 0,5 é a frente do torno; duas bordas douradas e o miolo mais escuro entre elas
    const cx = Math.round(0.5 * W);
    const half = o.front;
    g.fillStyle = PURPLE_IN;
    g.fillRect(cx - half + 2, 0, (half - 2) * 2, Hh);
    g.fillStyle = GOLD;
    g.fillRect(cx - half, 0, 2, Hh);
    g.fillRect(cx + half - 2, 0, 2, Hh);
  }
  return c;
}

// estola vermelha com o glifo (haste vertical, travessas e um losango), ponta rasgada embaixo
function stoleTex(longGlyph: boolean) {
  const { c, g } = cv(32, 96);
  g.fillStyle = RED;
  g.fillRect(0, 0, 32, 96);
  g.fillStyle = RED_D;
  g.fillRect(0, 0, 2, 96);
  g.fillRect(30, 0, 2, 96);
  for (let x = 4; x < 28; x += 6) {
    g.fillStyle = 'rgba(0,0,0,0.12)';
    g.fillRect(x, 0, 1, 96);
  }
  g.fillStyle = GOLD;
  const cx = 15;
  const top = longGlyph ? 22 : 28;
  const bot = longGlyph ? 74 : 70;
  g.fillRect(cx, top, 2, bot - top);
  g.fillRect(cx - 4, top + 8, 10, 2); // travessa de cima
  g.fillRect(cx - 4, bot - 4, 10, 2); // travessa de baixo
  // losango vazado no meio da haste
  const ly = Math.round((top + bot) / 2) + 2;
  g.fillStyle = RED;
  g.fillRect(cx - 6, ly - 7, 14, 14); // abre espaço na haste
  g.fillStyle = GOLD;
  for (let i = 0; i <= 6; i++) {
    g.fillRect(cx + 1 - i, ly - 6 + i, 1, 1);
    g.fillRect(cx + i, ly - 6 + i, 1, 1);
    g.fillRect(cx + 1 - i, ly + 6 - i, 1, 1);
    g.fillRect(cx + i, ly + 6 - i, 1, 1);
    g.fillRect(cx - i, ly - 6 + i, 1, 1);
    g.fillRect(cx + 1 + i, ly - 6 + i, 1, 1);
    g.fillRect(cx - i, ly + 6 - i, 1, 1);
    g.fillRect(cx + 1 + i, ly + 6 - i, 1, 1);
  }
  return c;
}

export function makeScribe(): Scribe {
  const group = new THREE.Group();
  const mats: THREE.MeshLambertMaterial[] = [];
  const lam = (o: THREE.MeshLambertMaterialParameters) => {
    const m = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, ...o });
    mats.push(m);
    return m;
  };
  const flat = (color: string) => lam({ color, emissive: new THREE.Color(color).multiplyScalar(0.25) });

  // ── materiais ──
  const skirtMat = lam({ map: tex(clothTex({ w: 96, h: 64, folds: 12, bands: [[0.02, 0.08]], front: 9 })), emissive: 0x2a1640 });
  const underMat = lam({ map: tex(clothTex({ w: 64, h: 32, folds: 10, base: PURPLE_IN, dark: '#1d1229', light: '#3a2652', bands: [[0.0, 0.07]] })), emissive: 0x120a1a });
  const torsoMat = lam({ map: tex(clothTex({ w: 96, h: 32, folds: 10, front: 9 })), emissive: 0x2a1640 });
  const capeMat = lam({ map: tex(clothTex({ w: 96, h: 32, folds: 14, bands: [[0.0, 0.12]] })), emissive: 0x2a1640 });
  const cowlMat = lam({ map: tex(clothTex({ w: 64, h: 16, folds: 9, base: PURPLE, dark: PURPLE_D, light: PURPLE_L })), emissive: 0x2a1640 });
  const hoodMat = lam({ map: tex(clothTex({ w: 64, h: 64, folds: 5, base: PURPLE, dark: PURPLE_D, light: PURPLE_L })), emissive: 0x2a1640 });
  const sleeveMat = lam({ map: tex(clothTex({ w: 64, h: 48, folds: 8, bands: [[0.04, 0.12], [0.2, 0.26]] })), emissive: 0x2a1640 });
  const upperSleeveMat = lam({ map: tex(clothTex({ w: 64, h: 32, folds: 7 })), emissive: 0x2a1640 });
  const goldMat = flat(GOLD);
  const gloveMat = flat(GLOVE);
  const shoeMat = flat(SHOE);
  const ropeMat = flat(ROPE);
  const voidMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfff0c8, fog: false });
  const eyeGlowMat = new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 0.35, depthWrite: false, fog: false });
  const stoleFrontMat = lam({ map: tex(stoleTex(false)), emissive: 0x2a0c12 });
  const stoleBackMat = lam({ map: tex(stoleTex(true)), emissive: 0x2a0c12 });

  // ── pés (sapatos escuros sob a barra) ──
  const mkShoe = (x: number) => {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.22), shoeMat);
    s.position.set(x, 0.035, 0.12);
    group.add(s);
    return s;
  };
  const shoeL = mkShoe(0.1);
  const shoeR = mkShoe(-0.1);

  // ── saia da túnica (da cintura ao chão), com a camada de baixo aparecendo sob a barra rasgada ──
  const hips = new THREE.Group();
  group.add(hips);
  const lathe = (pts: [number, number][], seg = 24) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  // o torno começa em -z (u=0) e dá a volta; a frente (+z) fica em u = 0,5 — onde a textura desenha a abertura da frente
  const skirtGeo = lathe([[0.41, 0.06], [0.39, 0.2], [0.34, 0.45], [0.29, 0.72], [0.26, 0.95]], 28);
  {
    const p = skirtGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      if (p.getY(i) < 0.08) {
        const a = Math.atan2(p.getX(i), p.getZ(i));
        p.setY(i, p.getY(i) + (Math.abs(Math.sin(a * 9)) > 0.75 ? 0.05 : 0) + rnd(i) * 0.02); // barra em dentes rasgados
      }
    }
    skirtGeo.computeVertexNormals();
  }
  const skirt = new THREE.Mesh(skirtGeo, skirtMat);
  skirt.rotation.y = Math.PI; // a abertura (u = 0,5 da textura) vai para a FRENTE
  hips.add(skirt);
  const sp = skirtGeo.attributes.position as THREE.BufferAttribute;
  const skirtRest = Float32Array.from(sp.array as Float32Array);
  const under = new THREE.Mesh(lathe([[0.385, 0.0], [0.36, 0.2], [0.33, 0.35]], 24), underMat);
  hips.add(under);

  // cinto de corda, com uma chave dourada pendurada do lado esquerdo da frente
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.265, 0.022, 5, 20), ropeMat);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.94;
  hips.add(belt);
  const knot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.04), ropeMat);
  knot.position.set(0.14, 0.92, 0.23);
  hips.add(knot);
  const keyG = new THREE.Group();
  keyG.position.set(0.15, 0.88, 0.25);
  hips.add(keyG);
  const cordK = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 4), ropeMat);
  cordK.position.y = -0.05;
  keyG.add(cordK);
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.009, 4, 4), goldMat); // a argola em losango
  bow.position.y = -0.13;
  bow.rotation.z = Math.PI / 4;
  keyG.add(bow);
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.12, 0.014), goldMat);
  shaft.position.y = -0.22;
  keyG.add(shaft);
  for (const [dy, w] of [[-0.25, 0.04], [-0.27, 0.03]]) {
    const bit = new THREE.Mesh(new THREE.BoxGeometry(w, 0.014, 0.014), goldMat);
    bit.position.set(w / 2, dy, 0);
    keyG.add(bit);
  }

  // ── tronco (inclina a partir da cintura) ──
  const torso = new THREE.Group();
  torso.position.y = 0.93;
  hips.add(torso);
  const chest = new THREE.Mesh(lathe([[0.26, 0.0], [0.27, 0.15], [0.26, 0.3], [0.21, 0.42], [0.09, 0.48]], 24), torsoMat);
  chest.rotation.y = Math.PI;
  torso.add(chest);
  // estola vermelha: frente (da capa até o joelho) e costas (mais longa); a ponta é rasgada em V
  const stoleGeo = (len: number) => {
    const s = new THREE.Shape();
    const w = 0.09;
    s.moveTo(-w, 0);
    s.lineTo(w, 0);
    s.lineTo(w, -len + 0.06);
    s.lineTo(0, -len);
    s.lineTo(-w, -len + 0.06);
    s.closePath();
    const g = new THREE.ShapeGeometry(s);
    // UV: a textura cobre a estola de cima (v=1) a baixo (v=0)
    const p = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w) / (2 * w), 1 + p.getY(i) / len);
    return g;
  };
  const stoleF = new THREE.Mesh(stoleGeo(0.98), stoleFrontMat);
  stoleF.position.set(0, 0.28, 0.272);
  stoleF.rotation.x = -0.12; // acompanha a saia que se abre: a ponta vai um pouco para a frente
  torso.add(stoleF);
  const stoleB = new THREE.Mesh(stoleGeo(1.05), stoleBackMat);
  stoleB.position.set(0, 0.34, -0.272);
  stoleB.rotation.set(0.1, Math.PI, 0);
  torso.add(stoleB);

  // capa curta: dos ombros até o peito, terminando em V na frente, com barra dourada
  const capeGeo = lathe([[0.4, 0.0], [0.37, 0.08], [0.31, 0.17], [0.2, 0.25]], 32);
  {
    const p = capeGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      if (p.getY(i) < 0.01) {
        const a = Math.atan2(p.getX(i), p.getZ(i)); // 0 = frente
        const front = Math.max(0, 1 - Math.abs(a) / 0.9);
        p.setY(i, p.getY(i) - front * 0.1); // a ponta em V
      }
    }
    capeGeo.computeVertexNormals();
  }
  const cape = new THREE.Mesh(capeGeo, capeMat);
  cape.position.y = 0.27;
  torso.add(cape);
  const cp = capeGeo.attributes.position as THREE.BufferAttribute;
  const capeRest = Float32Array.from(cp.array as Float32Array);
  // gola grossa (o capuz caindo sobre os ombros)
  const cowl = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.072, 8, 18), cowlMat);
  cowl.rotation.x = Math.PI / 2;
  cowl.scale.set(1.08, 1, 0.9);
  cowl.position.set(0, 0.5, 0.0);
  torso.add(cowl);

  // ── capuz: alto, pontudo, a ponta um pouco para trás; a abertura em ponta (arco ogival) debruada de ouro, escura por dentro ──
  const neck = new THREE.Group();
  neck.position.set(0, 0.55, 0.02);
  torso.add(neck);
  const hood = new THREE.Group();
  hood.scale.setScalar(1.14); // capuz grande, como na referência
  neck.add(hood);
  // o capuz é ABERTO na frente (como pano de verdade): uma volta de 360° menos ~84° centrados na frente (+z)
  const GAP = 1.46;
  const hoodGeo = new THREE.LatheGeometry(
    ([[0.0, -0.05], [0.2, -0.02], [0.25, 0.1], [0.24, 0.24], [0.18, 0.38], [0.09, 0.5], [0.0, 0.62]] as [number, number][]).map(([r, y]) => new THREE.Vector2(r, y)),
    22,
    GAP / 2,
    Math.PI * 2 - GAP,
  );
  {
    const p = hoodGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const z = p.getZ(i);
      p.setX(i, p.getX(i) * 0.9);
      p.setZ(i, (z > 0 ? z * 1.0 : z * 1.05) - Math.max(0, y - 0.22) * 0.62); // a ponta cai para trás
    }
    hoodGeo.computeVertexNormals();
  }
  const hoodShell = new THREE.Mesh(hoodGeo, hoodMat);
  hood.add(hoodShell);
  const arch = (w: number, h: number) => {
    // arco ogival: pontudo em cima e no queixo
    const s = new THREE.Shape();
    s.moveTo(0, -h * 0.42);
    s.quadraticCurveTo(w * 0.95, -h * 0.2, w, h * 0.1);
    s.quadraticCurveTo(w * 0.75, h * 0.45, 0, h * 0.58);
    s.quadraticCurveTo(-w * 0.75, h * 0.45, -w, h * 0.1);
    s.quadraticCurveTo(-w * 0.95, -h * 0.2, 0, -h * 0.42);
    return s;
  };
  // a abertura (debrum, escuro e olhos) acompanha o capuz, que cai para trás
  const facePlate = new THREE.Group();
  facePlate.position.set(0, 0.16, 0.15);
  facePlate.rotation.x = -0.42;
  hood.add(facePlate);
  const rimShape = arch(0.185, 0.42);
  rimShape.holes.push(new THREE.Path(arch(0.15, 0.35).getPoints(24)));
  const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(rimShape, { depth: 0.025, bevelEnabled: false }), goldMat);
  facePlate.add(rim);
  const face = new THREE.Mesh(new THREE.ShapeGeometry(arch(0.152, 0.352)), voidMat);
  face.position.set(0, 0, -0.004); // o escuro fica DENTRO da abertura
  facePlate.add(face);
  const hollow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), voidMat); // a escuridão tem fundo
  hollow.scale.set(1, 1.2, 0.8);
  hollow.position.set(0, 0.16, 0.02);
  hood.add(hollow);
  const eyes: THREE.Mesh[] = [];
  for (const x of [-0.055, 0.055]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.01), eyeMat);
    e.position.set(x, 0.01, 0.008);
    facePlate.add(e);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.08), eyeGlowMat);
    glow.position.set(x, 0.01, 0.004);
    facePlate.add(glow);
    eyes.push(e, glow);
  }

  // ── braços: ombro → manga de cima → cotovelo → manga em sino (com as faixas douradas) → luva ──
  const mkArm = (side: 1 | -1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.27, 0.38, 0.0);
    torso.add(shoulder);
    const up = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.34, 10, 1, true), upperSleeveMat);
    up.position.y = -0.16;
    shoulder.add(up);
    const elbow = new THREE.Group();
    elbow.position.y = -0.32;
    shoulder.add(elbow);
    const bellGeo = new THREE.CylinderGeometry(0.1, 0.2, 0.42, 14, 1, true);
    bellGeo.translate(0, -0.2, 0);
    // UV v: 1 em cima, 0 na boca — as faixas douradas ficam perto da boca
    const bell = new THREE.Mesh(bellGeo, sleeveMat);
    elbow.add(bell);
    const inside = new THREE.Mesh(new THREE.CircleGeometry(0.19, 14), voidMat);
    inside.rotation.x = Math.PI / 2;
    inside.position.y = -0.38;
    elbow.add(inside);
    // luva escura: palma, quatro dedos juntos (levemente separados) e polegar
    const wrist = new THREE.Group();
    wrist.position.y = -0.4;
    wrist.scale.setScalar(1.35); // luvas grandes, aparecendo abaixo da boca da manga
    elbow.add(wrist);
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.04), gloveMat);
    palm.position.y = -0.06;
    wrist.add(palm);
    const fingers = new THREE.Group();
    fingers.position.y = -0.11;
    wrist.add(fingers);
    for (let i = 0; i < 4; i++) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.026), gloveMat);
      f.geometry.translate(0, -0.04, 0);
      f.position.set((i - 1.5) * 0.022, 0, 0);
      f.rotation.z = (i - 1.5) * -0.05;
      fingers.add(f);
    }
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.06, 0.024), gloveMat);
    thumb.geometry.translate(0, -0.03, 0);
    thumb.position.set(-side * 0.05, -0.04, 0.012);
    thumb.rotation.z = side * 0.5;
    wrist.add(thumb);
    wrist.rotation.y = side * 1.3; // a palma vira para a coxa (de frente se vê a mão de lado, com os dedos curvados)
    return { shoulder, elbow, wrist, fingers, side };
  };
  const armL = mkArm(1);
  const armR = mkArm(-1);
  // o dado fica APOIADO na palma direita
  const hand = new THREE.Group();
  hand.position.set(0, -0.16, 0.2);
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
  let glance = 0;
  let glanceTo = 0;

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
    shoeL.position.z = 0.06 + s * 0.16 * w;
    shoeL.position.y = 0.035 + Math.max(0, c) * 0.05 * w;
    shoeR.position.z = 0.06 - s * 0.16 * w;
    shoeR.position.y = 0.035 + Math.max(0, -c) * 0.05 * w;
    hips.position.y = Math.abs(s) * 0.025 * w + breathe * 0.004;
    hips.rotation.z = s * 0.035 * w;
    hips.rotation.y = s * 0.05 * w;
    // a saia ondula (pregas que balançam) e, andando, a barra fica um pouco para trás
    const sa = sp.array as Float32Array;
    for (let i = 0; i < sp.count; i++) {
      const x0 = skirtRest[i * 3];
      const y0 = skirtRest[i * 3 + 1];
      const z0 = skirtRest[i * 3 + 2];
      const low = 1 - Math.min(1, y0 / 0.9);
      const a = Math.atan2(x0, z0);
      const k = 1 + Math.sin(a * 6 + t * 1.4 + y0 * 3) * 0.025 * low + Math.sin(phase * 2 + a) * 0.04 * low * w;
      sa[i * 3] = x0 * k;
      sa[i * 3 + 1] = y0;
      sa[i * 3 + 2] = z0 * k - low * low * 0.08 * w;
    }
    sp.needsUpdate = true;
    skirtGeo.computeVertexNormals();
    // a capa balança de leve
    const ca = cp.array as Float32Array;
    for (let i = 0; i < cp.count; i++) {
      const x0 = capeRest[i * 3];
      const y0 = capeRest[i * 3 + 1];
      const z0 = capeRest[i * 3 + 2];
      const a = Math.atan2(x0, z0);
      const low = Math.max(0, 0.15 - y0) / 0.31;
      const k = 1 + Math.sin(a * 5 + t * 1.8) * 0.03 * low + 0.05 * low * w;
      ca[i * 3] = x0 * k;
      ca[i * 3 + 1] = y0 + Math.sin(a * 4 + t * 2.1) * 0.01 * low;
      ca[i * 3 + 2] = z0 * k;
    }
    cp.needsUpdate = true;
    capeGeo.computeVertexNormals();

    // tronco: curvado de leve, respira, inclina ao se debruçar; gira um pouco quando a mão vai ao manto
    torso.rotation.x = 0.06 + cur.lean * 0.85 + w * 0.06 + breathe * 0.012;
    torso.rotation.y = -cur.back * 0.3;
    torso.rotation.z = -hips.rotation.z * 0.6;
    // capuz: segue o alvo, dá olhadas curtas; os olhos piscam
    glanceT -= dt;
    if (glanceT < 0) {
      glanceT = 2 + Math.random() * 3.5;
      glanceTo = (Math.random() - 0.5) * 0.7 * (1 - cur.lean * 0.7);
    }
    glance += (glanceTo - glance) * (1 - Math.exp(-dt * 5));
    neck.position.set(0, 0.55, 0.02 + Math.max(0, cur.lean - 0.8) * 0.8); // bem debruçado, ele estica o pescoço por cima do poço
    neck.rotation.set(cur.headPitch + cur.lean * 0.4 + Math.sin(t * 0.9) * 0.02, cur.headYaw + glance + Math.sin(t * 0.6) * 0.03, Math.sin(t * 0.5) * 0.03, 'YXZ');
    blinkT -= dt;
    if (blinkT < 0) {
      blinkT = 2.4 + Math.random() * 3;
      blink = 1;
    }
    blink = Math.max(0, blink - dt * 7);
    const eyeH = Math.max(0.08, 1 - Math.sin(Math.min(1, blink) * Math.PI));
    eyes.forEach((e) => (e.scale.y = eyeH));

    // braço esquerdo: balança ao andar; com `rest` pousa a mão à frente
    armL.shoulder.rotation.x = mix(-s * 0.25 * w + 0.04, -1.05, cur.rest);
    armL.shoulder.rotation.z = mix(0.1, 0.12, cur.rest);
    armL.elbow.rotation.x = mix(-0.3, -0.45, cur.rest);
    armL.fingers.rotation.x = mix(-0.55, -0.2, cur.rest);
    armL.wrist.rotation.y = mix(1.3, 0, cur.rest);
    // braço direito: balança; vai ao manto; estende-se; ergue-se alto (a palma para cima, com o dado); abre a mão
    let sx = s * 0.25 * w + 0.04;
    let sz = -0.1;
    let ex = -0.3;
    sx = mix(sx, -0.35, cur.back);
    sz = mix(sz, 0.35, cur.back);
    ex = mix(ex, -1.7, cur.back);
    sx = mix(sx, -1.35, cur.reach);
    ex = mix(ex, -0.15, cur.reach);
    sx = mix(sx, -2.55 - cur.lean * 0.2, cur.raise); // erguido alto e à FRENTE (sobre a boca do poço, não sobre a mureta)
    sz = mix(sz, 0.05, cur.raise);
    ex = mix(ex, -0.25, cur.raise);
    armR.shoulder.rotation.set(sx + breathe * 0.01, 0, sz);
    armR.elbow.rotation.x = ex;
    armR.wrist.rotation.x = mix(mix(0, 0.4, cur.reach), 0.95, cur.raise) - cur.open * 1.6;
    armR.fingers.rotation.x = mix(-0.6, 0.3, cur.open);
    armR.wrist.rotation.y = -1.3 * (1 - Math.max(cur.reach, cur.raise, cur.back)); // ao segurar o dado, a palma vira para a frente/para cima
  };

  let lastT = -1;
  const all: THREE.Material[] = [...mats, voidMat, eyeMat, eyeGlowMat];
  const baseOpacity = new Map(all.map((m) => [m, m.opacity]));
  return {
    group,
    hand,
    head: hood,
    animate,
    setAlpha(v) {
      const a = Math.max(0, Math.min(1, v));
      group.visible = a > 0.01;
      for (const m of all) {
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
