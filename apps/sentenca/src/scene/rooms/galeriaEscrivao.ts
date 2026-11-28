// A GALERIA DO ESCRIVÃO (DESIGN.md §97): o que se vê pela janela de grade do Corredor dos Nichos (sala 5, trecho C). Do outro lado de um vão
// fundo, uma galeria em arcada: cinco tramos de abóbada de aresta sobre colunas redondas, com a arcada de frente para a janela (o tramo do
// meio fica bem na frente dela), uma parede de fundo com duas tochas e, no chão de lajes, o risco gasto por onde o Escrivão sempre passa. No
// tramo onde ele some, o atril com o livro aberto e as velas dele. Nas pontas, a galeria entra por portas escuras; embaixo, o vão desce até
// uma água parada que devolve as chamas.
// Só se vê pela janela: as peças paradas são juntadas numa malha por material (poucos desenhos), não têm colisão (o jogador e o dado não
// chegam lá), não passam de x = -15 (a pegada da sala no mapa do caderno é a de antes) e as luzes de lá só valem com o jogador no corredor
// (no pátio, não tiram luz de ninguém).
// O caminho do Escrivão (x = -13, chão a 0,2 m, de z = cz(4) + 3,2 a cz(4) - 4,8), a janela e as barras são da sala (`respiro1.ts`).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Emitter, Kit } from '../kit';
import { column, flagstones, floorPlane, groinVault, masonry, reliefMat, ST, stoneBox, transverseArch } from '../arch';
import { bakeProps, placeProp } from '../props';

const Y0 = 0.2; // o chão da galeria
const XB = -14.6; // a face da parede do fundo
const XA = -11.2; // o eixo da arcada
const AT = 0.44; // a espessura da arcada
const XO = XA + AT / 2; // a face da arcada que dá para o vão (e para a janela)
const XS = XO - 0.25; // a parede de arrimo embaixo da galeria, recuada: a beirada fica em balanço sobre mísulas
const XW = -7.3; // a face de fora da parede do corredor (a janela tem 30 cm de fundo)
const BAY = 3.4; // tramos quadrados: a galeria tem 3,4 m de fundo
const NB = 5;
const SPRING = Y0 + 2.2; // onde os arcos nascem (o alto dos ábacos)
const RISE = BAY / 2;
const TOP = 4.3; // o alto dos tímpanos da arcada (a cornija)
const CEIL = 6.0; // o teto do vão
// a água lá embaixo: 2 m abaixo da galeria. O peitoril da janela tapa quase tudo dela; quem se debruça na grade e olha para baixo vê a água
// preta e, nela, as duas chamas tremendo (mais funda, o peitoril a escondia inteira)
const WATER = -1.8;
const DEEP = WATER - 0.4;
const DOOR = { x0: -13.6, x1: -12.4, h: 2.4 }; // as portas das pontas (o caminho dele continua no escuro)

export function buildScribeGallery(kit: Kit, wz: number) {
  const ZN = wz + (NB * BAY) / 2; // a ponta de onde ele vem
  const ZS = wz - (NB * BAY) / 2; // a ponta para onde ele vai
  const ZM = (ZN + ZS) / 2;
  const LEN = ZN - ZS;
  const cols = Array.from({ length: NB - 1 }, (_, k) => ZN - BAY * (k + 1)); // as colunas (o tramo do meio fica de frente para a janela)
  const bayZ = (i: number) => ZN - BAY * (i + 0.5);
  const gal = new THREE.Group();
  gal.name = 'galeriaEscrivao';
  kit.group.add(gal);

  // ── os materiais (a mesma família da Galeria dos Condenados e do Vestíbulo, na pedra cinza desta sala) ──
  const wallT = masonry({ rows: [16, 24], blocks: [26, 60], seed: 541, theme: 'ruin' });
  const wallM = reliefMat(wallT, 4.5);
  // a pedra do lado do vão, que só a luz de fora (nenhuma) alcança: o tom vem da cor de vértice (some no escuro para baixo e para cima)
  const shadeM = reliefMat(wallT, 4.5);
  shadeM.vertexColors = true;
  const vaultM = reliefMat(masonry({ rows: [12, 16], blocks: [22, 42], seed: 542, theme: 'ruin', tint: 0.8, cracks: 0.3 }), 2.2);
  const ringM = reliefMat(masonry({ w: 128, h: 32, rows: [32, 32], blocks: [32, 32], seed: 543, theme: 'ruin', tint: 1.1, cracks: 0.25 }), 2.2);
  ringM.side = THREE.DoubleSide;
  const fillM = reliefMat(wallT, 4.5);
  fillM.side = THREE.DoubleSide;
  // a face da arcada que dá para a janela: nenhuma chama a alcança (as tochas estão atrás dela), e a luz ambiente forte desta sala a deixava
  // quase tão clara quanto o lado de dentro. Mais escura, ela vira a moldura e o olho vai para o claro de dentro dos arcos
  const fillOutM = fillM.clone();
  fillOutM.color.setScalar(0.5);
  const ringOutM = ringM.clone();
  ringOutM.color.setScalar(0.62);
  const shaftM = reliefMat(masonry({ rows: [28, 36], blocks: [128, 128], vjoint: false, seed: 544, theme: 'ruin', tint: 1.04, cracks: 0.15 }), 2.0, 0x9a9aa6);
  const dressedM = reliefMat(masonry({ rows: [22, 30], blocks: [44, 72], seed: 545, theme: 'ruin', tint: 1.14, cracks: 0.1 }), 2.0);
  // (a mesma pedra lavrada nas faixas do lado do vão, a beirada, as mísulas, a mureta e a cornija: um pouco mais escura, para a beirada
  // desenhar a linha sem virar a coisa mais clara do quadro)
  const dressedOutM = dressedM.clone();
  dressedOutM.color.setScalar(0.7);
  const floorM = reliefMat(flagstones(546, 'ruin'), 4.5);
  const flat = new Map<number, THREE.Material>();
  const lambert = (c: number) => flat.get(c) ?? (flat.set(c, new THREE.MeshLambertMaterial({ color: c })).get(c) as THREE.Material);

  // ── as peças paradas: juntadas no fim, uma malha por material ──
  const parts = new Map<THREE.Material, { geos: THREE.BufferGeometry[]; cast: boolean }>();
  const KEEP = ['position', 'normal', 'uv', 'color'];
  const piece = (o: THREE.Object3D, cast = true) => {
    o.updateMatrixWorld(true);
    o.traverse((m) => {
      const mesh = m as THREE.Mesh;
      if (!mesh.isMesh) return;
      const src = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      const g = new THREE.BufferGeometry();
      for (const name of KEEP) {
        const a = src.getAttribute(name);
        if (a) g.setAttribute(name, (a as THREE.BufferAttribute).clone());
      }
      if (!g.getAttribute('normal')) g.computeVertexNormals();
      src.dispose();
      g.applyMatrix4(mesh.matrixWorld);
      const mat = mesh.material as THREE.Material;
      const e = parts.get(mat) ?? { geos: [], cast: false };
      e.geos.push(g);
      e.cast ||= cast;
      parts.set(mat, e);
    });
  };
  // um pano de parede (vertical, x ou z constante) ou de teto/chão (y constante), com UV em metros e o tom na cor de vértice (`k(y)`)
  const quad = (o: { axis: 'x' | 'z' | 'y'; at: number; a0: number; a1: number; b0: number; b1: number; facing: 1 | -1; k: (y: number) => number; rows?: number }) => {
    const rows = o.rows ?? 10;
    const pos: number[] = [];
    const nor: number[] = [];
    const uv: number[] = [];
    const col: number[] = [];
    const P = (a: number, b: number): [number, number, number] => (o.axis === 'x' ? [o.at, b, a] : o.axis === 'z' ? [a, b, o.at] : [a, o.at, b]);
    const n: [number, number, number] = o.axis === 'x' ? [o.facing, 0, 0] : o.axis === 'z' ? [0, 0, o.facing] : [0, o.facing, 0];
    // (a ordem dos vértices deixa a face de frente para `facing`: confere a normal do 1º triângulo)
    const t0 = [P(o.a0, o.b0), P(o.a1, o.b0), P(o.a1, o.b1)].map((v) => new THREE.Vector3(...v));
    const nrm = new THREE.Vector3().subVectors(t0[1], t0[0]).cross(new THREE.Vector3().subVectors(t0[2], t0[0]));
    const order = nrm.dot(new THREE.Vector3(...n)) > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
    for (let r = 0; r < rows; r++) {
      const b0 = o.b0 + ((o.b1 - o.b0) * r) / rows;
      const b1 = o.b0 + ((o.b1 - o.b0) * (r + 1)) / rows;
      const q = [P(o.a0, b0), P(o.a1, b0), P(o.a1, b1), P(o.a0, b1)];
      for (const i of order) {
        const [x, y, z] = q[i];
        pos.push(x, y, z);
        nor.push(...n);
        uv.push((o.axis === 'y' ? x : o.axis === 'x' ? -z * o.facing : x * o.facing) / ST, (o.axis === 'y' ? z : y) / ST);
        const k = o.k(o.axis === 'y' ? o.at : y);
        col.push(k, k, k);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, shadeM);
    piece(m, false);
  };
  // o tom da pedra do lado do vão (nenhuma chama chega lá): na altura da galeria um pouco de luz, sumindo no preto até a água e escurecendo
  // para o teto. A parede de arrimo, embaixo da beirada, já nasce na sombra dela
  const sm = (a: number, b: number, x: number) => {
    const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return u * u * (3 - 2 * u);
  };
  const shade = (y: number) => 0.03 + 0.4 * sm(WATER, Y0 + 0.6, y) * (1 - 0.65 * sm(TOP - 0.6, CEIL, y));
  const under = (y: number) => 0.02 + 0.15 * sm(WATER - 0.1, Y0 - 0.2, y);
  const upper = (y: number) => 0.1 + 0.32 * (1 - sm(TOP, CEIL, y));

  // ══ A ARCADA (de frente para a janela) ══
  for (const z of cols) {
    const c = column(XA, z, SPRING - Y0, shaftM, dressedM, 0.22);
    c.group.position.y = Y0;
    piece(c.group);
    kit.contact(XA, z, 0.95, 0.95, Y0);
  }
  for (let i = 0; i < NB; i++) {
    const g = new THREE.Group();
    const arch = transverseArch({ zc: 0, depth: AT, xs: RISE - 0.31, spring: SPRING, rise: RISE - 0.01, thick: 0.3, wallX: RISE, top: () => TOP, ring: ringM, fill: fillM });
    // (cada tímpano com o seu pedaço da cantaria: senão os cinco ficariam iguais lado a lado)
    arch.traverse((m) => {
      const mesh = m as THREE.Mesh;
      if (!mesh.isMesh || mesh.material !== fillM) return;
      const uv = mesh.geometry.getAttribute('uv') as THREE.BufferAttribute;
      for (let k = 0; k < uv.count; k++) uv.setX(k, uv.getX(k) + i * 1.37);
    });
    // as faces de fora (z+ do arco = x+ depois do giro: o lado do vão) com a pedra mais escura. Ordem dos filhos em `transverseArch`: intradorso,
    // aduelas da frente e de trás, tímpano da frente e de trás
    const [, ringOut, , fillOut] = arch.children as THREE.Mesh[];
    ringOut.material = ringOutM;
    fillOut.material = fillOutM;
    g.add(arch);
    g.rotation.y = Math.PI / 2;
    g.position.set(XA, 0, bayZ(i));
    piece(g);
  }
  // as pontas da arcada nascem de meias-pilastras encostadas nas paredes das pontas
  for (const [ze, s] of [[ZN, -1], [ZS, 1]] as [number, number][]) {
    piece(stoneBox(AT, SPRING - Y0 - 0.2, 0.3, dressedM, XA, Y0 + (SPRING - Y0 - 0.2) / 2, ze + s * 0.15));
    piece(stoneBox(AT + 0.18, 0.2, 0.36, dressedM, XA, SPRING - 0.1, ze + s * 0.18));
  }
  // o estilóbato (a fiada de pedra lavrada em que a arcada assenta: a beirada do vão) e a mureta baixa entre as colunas (não tapa os pés dele)
  piece(stoneBox(0.6, 0.22, LEN, dressedOutM, XA + 0.02, Y0 - 0.09, ZM));
  // embaixo dela, a fileira de mísulas: a beirada fica em balanço sobre o vão, e a parede de arrimo some recuada na sombra
  for (let z = ZS + 0.45; z < ZN - 0.3; z += 0.85) piece(stoneBox(XO + 0.06 - XS, 0.3, 0.22, dressedOutM, (XS + XO + 0.06) / 2, Y0 - 0.37, z));
  for (let i = 0; i < NB; i++) {
    const za = i === 0 ? ZN : cols[i - 1];
    const zb = i === NB - 1 ? ZS : cols[i];
    const z0 = zb + (i === NB - 1 ? 0.3 : 0.29);
    const z1 = za - (i === 0 ? 0.3 : 0.29);
    piece(stoneBox(0.32, 0.26, z1 - z0, dressedOutM, XA, Y0 + 0.13, (z0 + z1) / 2));
  }
  // acima dos arcos: a cornija, e a parede da arcada até o teto do vão
  piece(stoneBox(0.64, 0.14, LEN, dressedOutM, XA + 0.08, TOP + 0.03, ZM));
  quad({ axis: 'x', at: XO, a0: ZS, a1: ZN, b0: TOP + 0.1, b1: CEIL, facing: 1, k: upper, rows: 4 });

  // ══ O CAMINHO DELE: o chão de lajes, a parede do fundo, as abóbadas ══
  // (o chão vai até a borda do estilóbato, sem ficar por cima dele)
  piece(floorPlane(XB, XA - 0.28, ZS, ZN, Y0, floorM, 2 * ST), false);
  // a parede do fundo (com espessura: vai até x = -15, onde a galeria antiga também ia; a pegada da sala no mapa não muda)
  piece(stoneBox(XB + 15, TOP - Y0 + 0.2, LEN, wallM, (XB - 15) / 2, (Y0 + TOP) / 2, ZM));
  for (let i = 0; i < NB; i++) piece(groinVault(XB, XA, bayZ(i) - RISE, bayZ(i) + RISE, SPRING, RISE, vaultM), false);
  // os arcos entre os tramos: nascem do ábaco de cada coluna e, na parede do fundo, de uma mísula (pedra em balanço)
  const ribC = (XB + XA) / 2;
  for (const z of cols) {
    const rib = transverseArch({ zc: z, depth: 0.34, xs: RISE - 0.31, spring: SPRING, rise: RISE - 0.01, thick: 0.3, wallX: RISE, top: (x) => SPRING + RISE * Math.sqrt(Math.max(0, 1 - (x / RISE) ** 2)), ring: ringM, fill: fillM });
    rib.position.x = ribC;
    piece(rib);
    piece(stoneBox(0.32, 0.24, 0.46, dressedM, XB + 0.16, SPRING - 0.12, z));
    piece(stoneBox(0.2, 0.26, 0.32, dressedM, XB + 0.1, SPRING - 0.37, z));
  }
  // as paredes das pontas, com a porta escura por onde ele chega e por onde ele vai
  const doorM = new THREE.MeshBasicMaterial({ color: 0x040306 });
  for (const [ze, out] of [[ZN, 1], [ZS, -1]] as [number, number][]) {
    const zc = ze + out * 0.2;
    const H = TOP + 0.2 - Y0;
    piece(stoneBox(DOOR.x0 + 15, H, 0.4, wallM, (DOOR.x0 - 15) / 2, Y0 + H / 2, zc));
    piece(stoneBox(XO - DOOR.x1, H, 0.4, wallM, (XO + DOOR.x1) / 2, Y0 + H / 2, zc));
    piece(stoneBox(DOOR.x1 - DOOR.x0 + 0.2, TOP + 0.2 - (Y0 + DOOR.h), 0.44, dressedM, (DOOR.x0 + DOOR.x1) / 2, (Y0 + DOOR.h + TOP + 0.2) / 2, zc));
    const dark = new THREE.Mesh(new THREE.PlaneGeometry(DOOR.x1 - DOOR.x0, DOOR.h), doorM);
    dark.position.set((DOOR.x0 + DOOR.x1) / 2, Y0 + DOOR.h / 2, ze + out * 0.4);
    dark.rotation.y = out > 0 ? Math.PI : 0;
    piece(dark, false);
    // a ponta do vão, do fundo até o teto
    quad({ axis: 'z', at: ze, a0: XS, a1: XW, b0: DEEP, b1: CEIL, facing: out > 0 ? -1 : 1, k: shade, rows: 12 });
  }

  // ══ O VÃO: a parede de arrimo embaixo da galeria, que some no escuro até a água; o teto, lá no alto, quase preto ══
  quad({ axis: 'x', at: XS, a0: ZS, a1: ZN, b0: DEEP, b1: Y0 - 0.2, facing: 1, k: under, rows: 8 });
  quad({ axis: 'y', at: CEIL, a0: XA, a1: XW, b0: ZS, b1: ZN, facing: -1, k: () => 0.1, rows: 1 });
  // a água parada lá embaixo (verde-escura, a cor da cisterna) e o reflexo das duas chamas, de cabeça para baixo e tremendo
  const water = new THREE.Mesh(new THREE.PlaneGeometry(XW - XS, LEN), new THREE.MeshBasicMaterial({ color: 0x061210, transparent: true, opacity: 0.94, depthWrite: false, fog: true }));
  water.rotation.x = -Math.PI / 2;
  water.position.set((XS + XW) / 2, WATER, ZM);
  water.renderOrder = 1;
  gal.add(water);

  // ── a janela vista de fora: a parede do corredor tem 30 cm; ombreiras, peitoril de fora e verga em pedra lavrada ──
  // (1 cm atrás da face de dentro da parede, que é um plano em x = -7)
  for (const s of [-1, 1]) kit.box(0.3, 1.9, 0.2, kit.slab, -7.16, 1.55, wz + s * 0.9, false);
  kit.box(0.3, 0.2, 2.0, kit.slab, -7.16, 2.5, wz, false);
  kit.box(0.23, 0.1, 1.6, kit.slab, -7.185, 0.65, wz, false);

  // ══ A LUZ: duas tochas na parede do fundo (uma no tramo onde ele aparece, outra no do meio, um pouco adiante de onde ele vira o capuz:
  // a parede clara atrás dele, e ele escuro na frente dela, com os olhos acesos). O tramo onde ele some fica com as velas do atril ══
  const e0 = kit.emitters.length;
  const TORCHES = [wz + 3.7, wz - 0.9];
  TORCHES.forEach((z, i) => {
    kit.torch(XB + 0.1, Y0 + 1.65, z, 1, 0, 2.1 + i * 1.7);
    kit.soot(XB, Y0 + 2.1, z, 1, 0, 1.0, 1.6);
    kit.lightPool(XB + 1.1, z, 1.5, Y0).opacity = 0.26; // (até x = -15: a pegada da sala no mapa não muda)
  });
  const lights: Emitter[] = kit.emitters.slice(e0);
  for (const e of lights) e.range = 7; // (não atravessam a parede para o corredor)
  const refl = TORCHES.map((z) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], color: 0x9aa878, transparent: true, opacity: 0.6, depthWrite: false, fog: true }));
    const yf = Y0 + 1.65 + 0.57;
    s.position.set(XB + 0.26, 2 * WATER - yf, z);
    s.scale.set(0.3, -0.8, 1);
    s.renderOrder = 2;
    gal.add(s);
    return s;
  });

  // ══ O LUGAR DELE: o atril com o livro aberto, virado para a arcada, e as velas na mísula ao lado (uma acesa, as outras gastas) ══
  const LZ = wz - 4.3;
  const placed: THREE.Object3D[] = [];
  placed.push(placeProp(gal, 'bib', 'BookStand', XB + 0.62, Y0, LZ, Math.PI / 2));
  kit.contact(XB + 0.62, LZ, 0.8, 0.8, Y0);
  // o livro aberto no atril (o modelo vem com a prancha vazia): capa de couro e as duas folhas claras em V, inclinados com a prancha, virados
  // para a arcada; de longe, um retângulo pálido no escuro
  {
    const book = new THREE.Group();
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.014, 0.42), lambert(0x3b2418));
    book.add(cover);
    for (const s of [-1, 1]) {
      const pg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 0.19), lambert(0xc4b28c));
      pg.position.set(0, 0.015, s * 0.098);
      pg.rotation.x = s * 0.1;
      book.add(pg);
    }
    book.position.set(XB + 0.64, Y0 + 1.29, LZ);
    book.rotation.z = -0.45;
    piece(book);
  }
  const shelfY = Y0 + 1.15;
  piece(stoneBox(0.34, 0.1, 0.56, dressedM, XB + 0.17, shelfY - 0.05, LZ - 0.62));
  piece(stoneBox(0.2, 0.2, 0.36, dressedM, XB + 0.1, shelfY - 0.2, LZ - 0.62));
  placed.push(placeProp(gal, 'bib', 'Vela_Alta', XB + 0.17, shelfY, LZ - 0.52, 0, 0.36));
  placed.push(placeProp(gal, 'bib', 'Vela_Curta', XB + 0.2, shelfY, LZ - 0.76, 0, 0.16));
  placed.push(placeProp(gal, 'bib', 'Vela_Pires', XB + 0.24, shelfY, LZ - 0.36, 0, 0.12));
  bakeProps(gal, placed, ['bib']);
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], color: 0xffc27a, fog: false, alphaTest: 0.5, depthWrite: false }));
  flame.scale.set(0.06, 0.09, 1);
  flame.position.set(XB + 0.17, shelfY + 0.4, LZ - 0.52);
  gal.add(flame);
  const candle = kit.light(XB + 0.45, shelfY + 0.55, LZ - 0.4, 0xffb060, 6);
  candle.range = 3;
  lights.push(candle);
  // o caminho gasto: só ele anda aqui, sempre na mesma linha (a pedra mais lisa e mais clara no meio da galeria)
  kit.wear([[-13, ZN - 0.4], [-13, ZS + 0.4]], 0.8, Y0);
  kit.wear([[-13, ZN - 0.6], [-13, ZS + 0.6]], 0.4, Y0);

  // ── junta tudo ──
  for (const [mat, e] of parts) {
    const merged = e.geos.length > 1 ? mergeGeometries(e.geos) : e.geos[0];
    e.geos.forEach((g) => g !== merged && g.dispose());
    if (!merged) continue;
    const m = new THREE.Mesh(merged, mat);
    m.castShadow = e.cast;
    m.receiveShadow = true;
    if (!e.cast) m.userData.noShadow = true;
    gal.add(m);
  }

  const base = lights.map((e) => e.intensity);
  let on = 0;
  return {
    // `near`: o jogador está no corredor (de onde a janela se vê). Chamado DEPOIS de kit.tick (que dá a força de cada chama neste quadro)
    update(dt: number, t: number, near: boolean) {
      on += ((near ? 1 : 0) - on) * Math.min(1, dt * 4);
      lights.forEach((e, i) => {
        if (i >= TORCHES.length) e.intensity = base[i] * (0.9 + 0.1 * Math.sin(t * 7.3 + 1.1));
        e.intensity *= on;
      });
      flame.material.map = kit.frame(t * 9 + 5);
      refl.forEach((s, i) => {
        s.material.map = kit.frame(t * 8 + 3 + i);
        // a água mexe: o reflexo estica, encolhe e treme um pouco
        s.scale.x = 0.3 * (1 + 0.25 * Math.sin(t * 2.3 + i * 2));
        s.position.x = XB + 0.26 + Math.sin(t * 1.7 + i) * 0.03;
        s.material.opacity = 0.42 + 0.12 * Math.sin(t * 3.1 + i * 4);
      });
    },
  };
}
