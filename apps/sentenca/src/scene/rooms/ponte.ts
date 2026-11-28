// SALA · A PONTE DE MADEIRA (nível 6; PUZZLES_PROPOSTAS.md §5, verificador tools/verify_ponte.mjs) + constelação C3.
// O FOSSO: entra-se pela BORDA, lá em cima (uma galeria em volta da boca do fosso, 8 m acima do fundo). Uma RAMPA EM ESPIRAL desce colada às
// paredes (uma volta inteira; passa por cima da porta numa ponte de pedra) até o fundo, onde há 9 braseiros em grade ligados por canaletas.
// Onde duas canaletas diagonais se cruzam, uma passa POR BAIXO de uma PONTE DE MADEIRA que leva a outra por cima. Quando o fogo passa por
// baixo, a madeira queima e cai: a canaleta de cima fica cortada. A ORDEM das ignições muda o desenho.
//  · Porta (no fundo, sob a rampa): «ACENDER DOIS» + o glifo MAIS (a cruz) → fogo no 3 (meio da borda esquerda), depois no 7 (meio da frente).
//  · Enquanto há fogo correndo, a Casa recusa o fogo. Errado: tudo se apaga, a Casa repõe a ponte e os braseiros ficam frios por 6 s.
//  · C3 (camada escondida): com a cruz acesa lá embaixo, os quatro cantos ficam escuros. As 8 tochas da boca do fosso caem, vistas do alto,
//    sobre as casas da grade (4 cantos, 4 meios). Acender só as 4 dos cantos (nenhuma outra, nem as 3 iscas do fundo): um braseiro sobe num
//    patamar da rampa; acendê-lo abre a câmara da gema.
// Coordenadas: o FUNDO do fosso é y = 0 (a porta de saída fica nele); a entrada fica em y = 8 (`entranceY`).

import * as THREE from 'three';
import { buildDoor, buildEntrance, Kit, lambert, LAMP_OFF, T } from '../kit';
import { floorTexture } from '../textures';
import { makeBrazier, type Brazier } from '../brazier';
import { burntTexture, edgeKey, FireGrid, grooveTexture, makeFloorChannel, makeGemNiche, makeRiser, makeTorch, type GridEdge, type GridEdgeVis, type Torch } from '../firegrid';
import { mkBox, shotGate, wedge } from './shell';
import { windNear } from '../ambience';
import type { Box, Ctx, Rect, Room } from '../types';
import { T as Tr } from '../../i18n';

const TOP = 8; // a galeria (boca do fosso), acima do fundo
const CEIL = 12.4;
const OX = 8; // meia-largura da sala (galeria incluída)
const Z1 = 2; // parede da entrada
const OZ0 = -14; // parede do fundo, no nível da galeria
const PX = 6; // meia-largura do fosso
const PZ1 = 0; // o fosso vai de z = 0 a z = -12
const PZ0 = -12;
const ZC = -6;
const IN = 4.3; // meia-largura do chão do fundo (a rampa ocupa o resto)
const ZN = ZC + IN; // -1.7
const ZS = ZC - IN; // -10.3
const PAR = 0.2; // espessura dos parapeitos
const PH = 0.9; // altura dos parapeitos
const LAND = { x0: -1.2, x1: 1.2 }; // o patamar de cima (de onde a rampa parte), no lado norte do fosso
const BAY = 2; // meia-largura do vão da porta, sob a rampa
const S = TOP / 28; // inclinação da rampa (28 m de rampa para 8 m de altura)
const H = {
  NE: TOP - (IN - LAND.x1) * S,
  SE: TOP - (IN - LAND.x1 + 2 * IN) * S,
  BR: TOP - (IN - LAND.x1 + 2 * IN + (IN - BAY)) * S, // a ponte de pedra sobre a porta
  SW: TOP - (IN - LAND.x1 + 2 * IN + 2 * (IN - BAY)) * S,
  NW: (IN + LAND.x0) * S,
};
const LINTEL = 3.3; // altura livre do vão da porta

// As canaletas [de, para] (casa 0 = canto do fundo à esquerda, vendo a porta em cima; linha 0 = lado da porta)
const CANALETAS: [number, number][] = [[6, 7], [0, 3], [3, 1], [2, 1], [8, 5], [4, 5], [4, 3], [7, 4], [2, 4], [2, 5], [4, 0]];
const UNDER: [number, number] = [3, 1]; // passa por baixo da madeira
const OVER: [number, number] = [4, 0]; // passa por cima, na madeira
const CROSS = [1, 3, 4, 5, 7]; // MAIS
const cellX = (i: number) => ((i % 3) - 1) * 2.6;
const cellZ = (i: number) => ZC + (Math.floor(i / 3) - 1) * 2.6;

const inPit = (x: number, z: number) => Math.abs(x) < PX && z < PZ1 && z > PZ0;
const inInner = (x: number, z: number) => Math.abs(x) < IN && z < ZN && z > ZS;
// altura da rampa (para pontos do anel entre a parede do fosso e o chão do fundo)
function rampY(x: number, z: number) {
  if (z >= ZN) {
    if (x > IN) return H.NE;
    if (x >= LAND.x1) return TOP - (x - LAND.x1) * S;
    if (x < -IN) return H.NW;
    if (x <= LAND.x0) return (LAND.x0 - x) * S;
    return TOP; // o patamar
  }
  if (z <= ZS) {
    if (x > IN) return H.SE;
    if (x < -IN) return H.SW;
    if (x > BAY) return H.BR + (x - BAY) * S;
    if (x < -BAY) return H.BR - (-BAY - x) * S;
    return H.BR;
  }
  if (x > 0) return H.NE - (ZN - z) * S;
  return H.SW - (z - ZS) * S;
}
const onLanding = (x: number, z: number) => z >= ZN && x > LAND.x0 && x < LAND.x1;
const onBridge = (x: number, z: number) => z <= ZS && Math.abs(x) < BAY;

function groundY(x: number, z: number, f = 0) {
  if (!inPit(x, z)) {
    if (z < PZ0 && Math.abs(x) < 1.3 && f < 5) return 0; // o corredor da porta, por baixo da galeria
    if (z < OZ0) return 0;
    return TOP;
  }
  if (inInner(x, z)) return 0;
  if (onLanding(x, z)) return f > 5 ? TOP : 0; // em cima, o patamar; embaixo, o vão por onde a rampa chega ao fundo
  if (onBridge(x, z)) return f > 2.5 ? H.BR : 0; // em cima, a rampa; embaixo, o vão da porta
  return rampY(x, z);
}

export function buildPonte(ctx: Ctx): Room {
  const kit = new Kit('ruin');
  const boxes: Box[] = [];
  const side = kit.brick([1, 1], 0.9, 57);
  const sideDark = kit.brick([1, 1], 0.72, 61);
  const topMat = lambert(floorTexture([1, 1], 'ruin'));
  const flat = (y: number) => () => y;
  const solid = (x0: number, z0: number, x1: number, z1: number, yAt: (x: number, z: number) => number, y0 = 0, mat = side) => kit.add(wedge(x0, z0, x1, z1, yAt, mat, topMat, y0));

  // ── a galeria (a boca do fosso), o teto e as paredes de cima ──
  const gal = (x0: number, z0: number, x1: number, z1: number) => kit.plane(x1 - x0, z1 - z0, lambert(floorTexture([(x1 - x0) / T, (z1 - z0) / T], 'ruin')), (x0 + x1) / 2, TOP, (z0 + z1) / 2, -Math.PI / 2);
  gal(-OX, PZ1, OX, Z1);
  gal(-OX, OZ0, OX, PZ0);
  gal(-OX, PZ0, -PX, PZ1);
  gal(PX, PZ0, OX, PZ1);
  const W = 2 * OX;
  const L = Z1 - OZ0;
  const HG = CEIL - TOP;
  kit.plane(W, L, kit.brick([W / T, L / T], 0.6, 19), 0, CEIL, (Z1 + OZ0) / 2, Math.PI / 2);
  kit.plane(L, HG, kit.brick([L / T, HG / T], 0.95, 33), -OX, TOP + HG / 2, (Z1 + OZ0) / 2, 0, Math.PI / 2);
  kit.plane(L, HG, kit.brick([L / T, HG / T], 0.95, 39), OX, TOP + HG / 2, (Z1 + OZ0) / 2, 0, -Math.PI / 2);
  kit.plane(W, HG, kit.brick([W / T, HG / T], 0.95, 43), 0, TOP + HG / 2, OZ0, 0, 0);
  const entrance = buildEntrance(kit, { x0: -OX, x1: OX, z: Z1, h: HG, y0: TOP });
  // as paredes do fosso (do fundo até a galeria)
  const pitW = 2 * PX;
  kit.plane(pitW, TOP, kit.brick([pitW / T, TOP / T], 0.8, 71), 0, TOP / 2, PZ1, 0, Math.PI);
  kit.plane(pitW, TOP, kit.brick([pitW / T, TOP / T], 0.8, 73), -PX, TOP / 2, ZC, 0, Math.PI / 2);
  kit.plane(pitW, TOP, kit.brick([pitW / T, TOP / T], 0.8, 75), PX, TOP / 2, ZC, 0, -Math.PI / 2);
  kit.plane(PX - BAY, TOP, kit.brick([(PX - BAY) / T, TOP / T], 0.8, 77), -(PX + BAY) / 2, TOP / 2, PZ0, 0, 0);
  kit.plane(PX - BAY, TOP, kit.brick([(PX - BAY) / T, TOP / T], 0.8, 79), (PX + BAY) / 2, TOP / 2, PZ0, 0, 0);
  kit.plane(2 * BAY, TOP - LINTEL, kit.brick([(2 * BAY) / T, (TOP - LINTEL) / T], 0.8, 81), 0, (TOP + LINTEL) / 2, PZ0, 0, 0);
  // o chão do fundo
  kit.plane(pitW, pitW, lambert(floorTexture([pitW / T, pitW / T], 'ruin')), 0, 0, ZC, -Math.PI / 2);
  // a porta, no fundo, sob a rampa
  const door = buildDoor(kit, { x0: -BAY, x1: BAY, z0: PZ0, h: LINTEL, lamps: 2, connected: true });

  // ── gradis (vazados: dá para ver o fundo através deles): um corrimão de pedra sobre balaústres ──
  const rail = (x0: number, z0: number, x1: number, z1: number, yAt: (x: number, z: number) => number) => {
    const alongX = x1 - x0 > z1 - z0;
    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    const m = alongX ? wedge(x0, cz - 0.07, x1, cz + 0.07, (x, z) => yAt(x, z) + PH, kit.stone, kit.stone, (x, z) => yAt(x, z) + PH - 0.1) : wedge(cx - 0.07, z0, cx + 0.07, z1, (x, z) => yAt(x, z) + PH, kit.stone, kit.stone, (x, z) => yAt(x, z) + PH - 0.1);
    kit.group.add(m);
    const len = alongX ? x1 - x0 : z1 - z0;
    const n = Math.max(1, Math.round(len / 0.7));
    for (let k = 0; k <= n; k++) {
      const bx = alongX ? x0 + (len * k) / n : cx;
      const bz = alongX ? cz : z0 + (len * k) / n;
      const by = yAt(Math.min(x1 - 0.001, Math.max(x0 + 0.001, bx)), Math.min(z1 - 0.001, Math.max(z0 + 0.001, bz)));
      kit.box(0.07, PH - 0.08, 0.07, kit.stone, bx, by + (PH - 0.08) / 2, bz, false);
    }
  };
  const flatTop = flat(TOP);
  // a boca do fosso (com o vão do patamar)
  rail(-PX - PAR, PZ1, LAND.x0 + 0.2, PZ1 + PAR, flatTop);
  rail(LAND.x1 - 0.2, PZ1, PX + PAR, PZ1 + PAR, flatTop);
  rail(-PX - PAR, PZ0 - PAR, PX + PAR, PZ0, flatTop);
  rail(-PX - PAR, PZ0, -PX, PZ1, flatTop);
  rail(PX, PZ0, PX + PAR, PZ1, flatTop);

  // ── a rampa em espiral (o patamar fica em frente à entrada): do patamar vai para o leste, desce pelo lado leste, cruza por cima da porta, desce pelo oeste e chega ao fundo pelo norte ──
  // lado norte, começo (logo depois do patamar) e o canto NE
  solid(LAND.x1, ZN, IN, PZ1, rampY);
  rail(LAND.x1, ZN, IN + PAR, ZN + PAR, rampY);
  solid(IN, ZN, PX, PZ1, flat(H.NE));
  // lado leste
  solid(IN, ZS, PX, ZN, rampY);
  rail(IN, ZS - PAR, IN + PAR, ZN, rampY);
  solid(IN, PZ0, PX, ZS, flat(H.SE));
  // lado sul: desce, a ponte de pedra sobre a porta (plana, com um parapeito maciço onde a frase está talhada), desce de novo
  solid(BAY, PZ0, IN, ZS, rampY);
  rail(BAY, ZS - PAR, IN, ZS, rampY);
  solid(-BAY, PZ0, BAY, ZS, flat(H.BR), LINTEL, sideDark);
  solid(-BAY, ZS - PAR, BAY, ZS, flat(H.BR + PH), H.BR, sideDark);
  solid(-IN, PZ0, -BAY, ZS, rampY);
  rail(-IN, ZS - PAR, -BAY, ZS, rampY);
  solid(-PX, PZ0, -IN, ZS, flat(H.SW));
  // lado oeste
  solid(-PX, ZS, -IN, ZN, rampY);
  rail(-IN - PAR, ZS, -IN, ZN + PAR, rampY);
  solid(-PX, ZN, -IN, PZ1, flat(H.NW));
  // lado norte, o fim (chega ao fundo sob o patamar)
  solid(-IN, ZN, LAND.x0, PZ1, rampY);
  rail(-IN, ZN, LAND.x0, ZN + PAR, rampY);
  // o patamar de cima: laje e gradis do lado do vazio
  solid(LAND.x0, ZN, LAND.x1, PZ1, flat(TOP), TOP - 0.3, sideDark);
  rail(LAND.x0, ZN, LAND.x1, ZN + PAR, flatTop);
  rail(LAND.x0, ZN + PAR, LAND.x0 + PAR, PZ1, flatTop);
  boxes.push(mkBox(LAND.x0, TOP - 0.3, ZN, LAND.x1, TOP, PZ1));
  // sólidos para o dado: a massa da galeria, as paredes internas da rampa (em pedaços), o vão da porta, o vão sob o patamar
  boxes.push(mkBox(-OX, 0, OZ0, -PX, TOP, Z1), mkBox(PX, 0, OZ0, OX, TOP, Z1), mkBox(-PX, 0, PZ1, PX, TOP, Z1), mkBox(-PX, 0, OZ0, PX, TOP, PZ0));
  // paredes internas da rampa, em pedaços (cada um vai do chão até o parapeito daquele trecho)
  const wallZ = (x0: number, xs: number, zA: number, zB: number, n: number) => {
    for (let k = 0; k < n; k++) {
      const az = zA + ((zB - zA) * k) / n;
      const bz = zA + ((zB - zA) * (k + 1)) / n;
      boxes.push(mkBox(x0, 0, az, x0 + PAR, Math.max(rampY(xs, az + 0.01), rampY(xs, bz - 0.01)), bz));
    }
  };
  const wallX = (z0: number, zs: number, xA: number, xB: number, n: number) => {
    for (let k = 0; k < n; k++) {
      const ax = xA + ((xB - xA) * k) / n;
      const bx = xA + ((xB - xA) * (k + 1)) / n;
      boxes.push(mkBox(ax, 0, z0, bx, Math.max(rampY(ax + 0.01, zs), rampY(bx - 0.01, zs)), z0 + PAR));
    }
  };
  wallZ(IN, IN + 1, ZS, ZN, 8); // leste
  wallZ(-IN - PAR, -IN - 1, ZS, ZN, 8); // oeste
  wallX(ZS - PAR, ZS - 1, BAY, IN, 3); // sul
  wallX(ZS - PAR, ZS - 1, -IN, -BAY, 3);
  wallX(ZN, ZN + 1, -IN, LAND.x0, 6); // norte (o fim da rampa)
  wallX(ZN, ZN + 1, LAND.x1, IN, 1); // norte (o começo)
  boxes.push(mkBox(-BAY, LINTEL, PZ0, BAY, H.BR, ZS), mkBox(-BAY, H.BR, ZS - PAR, BAY, H.BR + PH, ZS)); // a ponte de pedra e o parapeito dela
  boxes.push(mkBox(-BAY - 0.2, 0, PZ0, -BAY, LINTEL, ZS), mkBox(BAY, 0, PZ0, BAY + 0.2, LINTEL, ZS)); // os lados do vão da porta
  boxes.push(mkBox(LAND.x1, 0, ZN, LAND.x1 + 0.2, TOP - 0.3, PZ1)); // o fundo do vão sob o patamar

  // ── o fundo: 9 braseiros em grade, canaletas e a PONTE DE MADEIRA ──
  const braz: Brazier[] = [];
  for (let i = 0; i < 9; i++) {
    const b = makeBrazier(kit, ctx, cellX(i), cellZ(i), false);
    braz.push(b);
    boxes.push(...b.boxes);
  }
  // a canaleta que passa por cima, numa calha de madeira sobre cavaletes (queima e cai quando o fogo passa por baixo)
  const plank = (() => {
    const ax = cellX(OVER[0]);
    const az = cellZ(OVER[0]);
    const dx = cellX(OVER[1]) - ax;
    const dz = cellZ(OVER[1]) - az;
    const D = Math.hypot(dx, dz);
    const ux = dx / D;
    const uz = dz / D;
    const inset = 0.6;
    const len = D - 2 * inset;
    const home = new THREE.Vector3(ax + ux * inset, 0, az + uz * inset);
    const yaw = Math.atan2(-dz, dx);
    const g = new THREE.Group();
    g.position.copy(home);
    g.rotation.y = yaw;
    kit.group.add(g);
    const PY = 0.34;
    const wood = new THREE.MeshLambertMaterial({ color: 0x8a5a30 });
    const woodDark = new THREE.MeshLambertMaterial({ color: 0x5e3c20 });
    const part = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material = wood) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.position.set(x, y, z);
      g.add(mesh);
      return mesh;
    };
    part(len, 0.07, 0.46, len / 2, PY - 0.035, 0);
    part(len, 0.07, 0.05, len / 2, PY + 0.03, 0.22, woodDark);
    part(len, 0.07, 0.05, len / 2, PY + 0.03, -0.22, woodDark);
    for (const x of [0.12, len / 2 - 0.5, len / 2 + 0.5, len - 0.12]) {
      part(0.08, PY - 0.07, 0.08, x, (PY - 0.07) / 2, 0.19, woodDark);
      part(0.08, PY - 0.07, 0.08, x, (PY - 0.07) / 2, -0.19, woodDark);
      part(0.06, 0.06, 0.46, x, PY - 0.12, 0, woodDark);
    }
    const strip = (w: number, mat: THREE.Material, y: number) => {
      const geo = new THREE.PlaneGeometry(len, w);
      geo.rotateX(-Math.PI / 2);
      geo.translate(len / 2, 0, 0);
      const m = new THREE.Mesh(geo, mat);
      m.position.y = y;
      g.add(m);
      return m;
    };
    const gt = grooveTexture().clone();
    gt.needsUpdate = true;
    gt.repeat.set(len / 0.32, 1);
    const groove = strip(0.3, new THREE.MeshLambertMaterial({ map: gt }), PY + 0.004);
    const bt = burntTexture().clone();
    bt.needsUpdate = true;
    bt.repeat.set(len / 0.32, 1);
    const bm = new THREE.MeshBasicMaterial({ map: bt, fog: false, transparent: true, depthWrite: false });
    const burn = strip(0.18, bm, PY + 0.01);
    burn.scale.x = 0.0001;
    burn.visible = false;
    const flameMat = () => new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false });
    const front = new THREE.Sprite(flameMat());
    front.scale.set(0.42, 0.36, 1);
    front.visible = false;
    g.add(front);
    // as chamas da madeira queimando
    const fires = [0.2, 0.5, 0.8].map((k) => {
      const s = new THREE.Sprite(flameMat());
      s.scale.set(0.6, 0.55, 1);
      s.position.set(len * k, PY + 0.3, 0);
      s.visible = false;
      g.add(s);
      return s;
    });
    const lamp = kit.light(home.x + ux * len * 0.5, 0.9, home.z + uz * len * 0.5, 0xff7a2e, 0);
    // a fenda na parede de onde a Casa tira uma ponte nova
    const slot = new THREE.Vector3(-IN + 0.3, 1.5, home.z + uz * len * 0.5);
    const slotM = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.22), new THREE.MeshBasicMaterial({ color: 0x06050a }));
    slotM.position.set(-IN + 0.012, 1.5, slot.z);
    slotM.rotation.y = Math.PI / 2;
    kit.group.add(slotM);
    let st: 'ok' | 'burning' | 'fallen' | 'sliding' = 'ok';
    let tt = 0;
    let runK = 0;
    const vis: GridEdgeVis = {
      set(k, burnt) {
        runK = k;
        burn.visible = k > 0.001 && st !== 'fallen';
        burn.scale.x = Math.max(0.0001, k);
        bm.color.setScalar(burnt ? 0.7 : 1);
        front.visible = k > 0.001 && k < 1;
        front.position.set(len * k, PY + 0.18, 0);
      },
    };
    return {
      vis,
      mid: new THREE.Vector3(home.x + ux * len * 0.5, PY, home.z + uz * len * 0.5),
      get state() {
        return st;
      },
      burnDown() {
        if (st !== 'ok') return;
        st = 'burning';
        tt = 0;
      },
      restore(instant = false) {
        if (st === 'ok') return;
        wood.color.setHex(0x8a5a30);
        woodDark.color.setHex(0x5e3c20);
        groove.visible = true;
        fires.forEach((f) => (f.visible = false));
        g.rotation.set(0, yaw, 0);
        if (instant) {
          st = 'ok';
          g.position.copy(home);
        } else {
          st = 'sliding';
          tt = 0;
          ctx.sfx('doorClose');
        }
      },
      update(dt: number, t: number) {
        const frame = kit.frame(t * 9);
        front.material.map = frame;
        tt += dt;
        if (st === 'burning') {
          const k = Math.min(1, tt / 1.3);
          wood.color.setHex(0x8a5a30).lerp(new THREE.Color(0x1a1412), k);
          woodDark.color.setHex(0x5e3c20).lerp(new THREE.Color(0x120e0c), k);
          fires.forEach((f, i) => {
            f.visible = true;
            f.material.map = kit.frame(t * 9 + i * 2);
            f.scale.set(0.6 * (0.6 + 0.4 * k), 0.55 * (0.6 + 0.6 * k), 1);
          });
          lamp.intensity = 26;
          if (k >= 1) {
            st = 'fallen';
            tt = 0;
            ctx.sfx('burnout');
          }
        } else if (st === 'fallen') {
          // cai: a calha tomba de lado no chão, carvão
          const k = Math.min(1, tt / 0.45);
          g.rotation.x = 1.25 * k;
          g.position.y = -0.1 * k;
          groove.visible = false;
          burn.visible = false;
          fires.forEach((f) => {
            f.visible = k < 1;
            f.scale.multiplyScalar(0.9);
          });
          lamp.intensity = 26 * (1 - k);
        } else if (st === 'sliding') {
          // uma ponte nova desliza da parede e se assenta no lugar
          const k = Math.min(1, tt / 1.6);
          const e = k * k * (3 - 2 * k);
          g.position.set(slot.x + (home.x - slot.x) * e, slot.y * (1 - e) * (1 - e), slot.z + (home.z - slot.z) * e);
          g.rotation.y = yaw * e;
          lamp.intensity = 0;
          if (k >= 1) st = 'ok';
        } else lamp.intensity = front.visible ? 16 : 0;
        if (st === 'ok' || st === 'burning') lamp.pos.set(home.x + ux * len * Math.max(0.3, runK), 0.9, home.z + uz * len * Math.max(0.3, runK));
      },
    };
  })();
  const edges: GridEdge[] = CANALETAS.map(([a, b]) => ({ a, b, vis: a === OVER[0] && b === OVER[1] ? plank.vis : makeFloorChannel(kit, cellX(a), cellZ(a), cellX(b), cellZ(b), 0.55) }));
  const floor = new FireGrid(
    braz.map((b) => ({ set: (on: boolean, q: boolean) => b.light(on, q), update: (_dt: number, t: number) => b.update(t) })),
    edges,
    0.75,
    () => ctx.sfx('spread'),
  );

  // ── a frase da porta, na frente da ponte de pedra (vê-se do fundo e da galeria): «ACENDER DOIS» e a cruz MAIS; dois soquetes contam as ignições ──
  const FZ = ZS + 0.025;
  // (CONFIRMADO: a sala 8 já ensinou a marca; as portas depois dela terminam nela)
  const sign = kit.inscribe({ words: ['acender', 'n2', 'conf'], x: -1.55, y: 4.3, z: FZ, nx: 0, nz: 1, size: 0.4, age: 0.25, seed: 9, lead: true });
  const cross = kit.inscribe({ words: ['mais'], x: 0.75, y: 4.1, z: FZ, nx: 0, nz: 1, size: 0.86, age: 0.2, frame: true, seed: 13 });
  const sockMats: THREE.MeshBasicMaterial[] = [];
  for (const sx of [-1.55, -0.95]) {
    kit.box(0.26, 0.26, 0.1, kit.stone, sx, 3.72, ZS + 0.05, false);
    const m = new THREE.MeshBasicMaterial({ color: 0x2a1a14, fog: false });
    sockMats.push(m);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.07, 6), m);
    dot.position.set(sx, 3.72, ZS + 0.105);
    kit.group.add(dot);
  }

  // ── C3: as 8 tochas da boca do fosso (cada uma "cai", vista do alto, sobre uma casa da grade) e 3 iscas no fundo ──
  const rim: [number, number, number, number, number][] = [
    // x, z, nx, nz, casa
    [-PX - PAR / 2, PZ0 - PAR / 2, 1, 0, 0],
    [0, PZ0 - PAR / 2, 0, 1, 1],
    [PX + PAR / 2, PZ0 - PAR / 2, -1, 0, 2],
    [-PX - PAR / 2, ZC, 1, 0, 3],
    [PX + PAR / 2, ZC, -1, 0, 5],
    [-PX - PAR / 2, PZ1 + PAR / 2, 1, 0, 6],
    [LAND.x1 - 0.25, ZN + PAR / 2, 0, -1, 7], // (esta fica no gradil do patamar, na ponta direita: no meio, ela tapava a vista de quem entra)
    [PX + PAR / 2, PZ1 + PAR / 2, -1, 0, 8],
  ];
  const torches: Torch[] = [];
  const cells: (number | null)[] = [];
  const postRects: Rect[] = [];
  for (const [x, z, nx, nz, c] of rim) {
    // a tocha fica de pé em cima do corrimão (fina: não tapa a vista do fosso)
    postRects.push([x - 0.12, z - 0.12, x + 0.12, z + 0.12]);
    torches.push(makeTorch(kit, ctx, x - nx * 0.16, TOP + PH + 0.18, z - nz * 0.16, nx, nz, 70, true));
    cells.push(c);
  }
  for (const [x, z, nx, nz] of [[-IN, -9, 1, 0], [IN, -7.5, -1, 0], [3.2, ZS, 0, 1]] as [number, number, number, number][]) {
    torches.push(makeTorch(kit, ctx, x, 1.7, z, nx, nz, 70));
    cells.push(null);
  }
  const CORNERS = new Set([0, 2, 6, 8]);
  const RX = -5.55;
  const RZ = -11.55;
  const riser = makeRiser(kit, ctx, RX, RZ, 0.8, H.SW);
  boxes.push(...riser.boxes);
  let bonus = false;
  const niche = makeGemNiche(kit, ctx, -4.75, H.SW + 1.3, PZ0, 0, 1, () => (bonus = true), 'p16'); // (era uma gema; agora uma folha dela: DESIGN.md §69)

  // luz: tochas fixas na galeria e no fundo
  kit.torch(-OX + 0.1, TOP + 1.9, -3.2, 1, 0, 0.4);
  kit.torch(OX - 0.1, TOP + 1.9, -8.8, -1, 0, 1.2);
  kit.torch(-3.6, TOP + 1.9, OZ0 + 0.1, 0, 1, 2.2);
  kit.torch(2.8, TOP + 1.9, Z1 - 0.1, 0, -1, 2.9);
  kit.torch(0, 1.9, PZ1 - 0.1, 0, -1, 4.1); // no vão sob o patamar
  kit.torch(-BAY + 0.02, 1.9, -11.15, 1, 0, 3.4); // no vão da porta
  kit.torch(BAY - 0.02, 1.9, -11.15, -1, 0, 5.1);
  kit.aoSides(-OX, OX, OZ0, Z1, HG, TOP);

  // ── a regra ──
  let used = 0;
  let stopT = 0;
  let failT = -1;
  let coldT = 0;
  let solved = false;
  let doorOpen = 0;
  let prevWant = 0;
  let readT = 0;
  const gate = shotGate(ctx.die);
  const reset = () => {
    floor.clear();
    plank.restore(true);
    used = 0;
    stopT = 0;
    failT = -1;
    coldT = 0;
    solved = false;
    doorOpen = 0;
    prevWant = 0;
    readT = 0;
    torches.forEach((tc) => tc.light(false, true));
    riser.reset();
    niche.reset();
    door.setOpen(0);
    door.lampMats.forEach((m) => m.color.setHex(LAMP_OFF));
    for (const p of [...sign.panels, ...cross.panels]) p.fire = 0;
  };

  if (import.meta.env.DEV) {
    ((globalThis as Record<string, unknown>).__ponte = () => ({ lit: floor.points(), burnt: [...floor.burnt], cut: [...floor.cut], used, solved, cold: +coldT.toFixed(1), plank: plank.state, bowls: braz.map((b) => b.bowl.toArray()), torches: torches.map((tc) => tc.pos.toArray().map((v) => +v.toFixed(2))), torchLit: torches.map((tc) => tc.lit), riser: +riser.k.toFixed(2), riserBowl: riser.brazier.bowl.toArray(), bonus, H }));
  }
  kit.bake();

  return {
    name: 'A Ponte de Madeira',
    subtitle: Tr('Madeira sobre o fosso.', 'Wood over the pit.', 'Madera sobre el foso.'),
    group: kit.group,
    surfaces: kit.surfaces,
    emitters: kit.emitters,
    inscriptions: kit.inscriptions,
    interactables: [niche.interactable],
    doorZ: PZ0,
    entranceZ: Z1,
    entranceY: TOP,
    start: new THREE.Vector3(0, TOP, 1.2),
    startYaw: 0,
    fog: { color: '#0b0a10', near: 7, far: 40 },
    ambient: { color: 0x8a80b0, intensity: 2.0 },
    boxes: [...boxes, ...kit.boxes],
    sockets: [...braz.map((b) => b.socket), riser.brazier.socket],
    rects(f) {
      const r: Rect[] = [...kit.rects, ...entrance.rects(), ...door.rects(doorOpen > 0.85), ...braz.map((b) => b.rect)];
      // a borda interna da rampa: parede (para quem está no fundo) e parapeito (para quem está nela)
      r.push([IN, ZS - PAR, IN + PAR, ZN + PAR], [-IN - PAR, ZS - PAR, -IN, ZN + PAR]);
      r.push([BAY, ZS - PAR, IN + PAR, ZS], [-IN - PAR, ZS - PAR, -BAY, ZS]);
      r.push([-IN - PAR, ZN, LAND.x0, ZN + PAR], [LAND.x1, ZN, IN + PAR, ZN + PAR]);
      if (f > 2.5) r.push([-BAY, ZS - PAR, BAY, ZS]); // o parapeito da ponte de pedra (por baixo passa-se para a porta)
      if (f > 5) r.push([LAND.x0, ZN, LAND.x1, ZN + PAR], [LAND.x0, ZN, LAND.x0 + PAR, PZ1]); // os parapeitos do patamar
      // os lados do vão da porta e o fundo do vão sob o patamar (só barram quem está embaixo)
      r.push([-IN - PAR, PZ0, -BAY, ZS, H.SW + 0.2], [BAY, PZ0, IN + PAR, ZS, H.BR + 0.2], [LAND.x1, ZN, IN + PAR, PZ1, H.NE - 0.3]);
      if (f < 7) {
        // dentro do fosso: as paredes dele
        r.push([-OX - 2, OZ0 - 2, -PX, Z1 + 2], [PX, OZ0 - 2, OX + 2, Z1 + 2], [-OX, PZ1, OX, Z1 + 2], [-OX, OZ0, -BAY, PZ0], [BAY, OZ0, OX, PZ0]);
      } else {
        // na galeria: os parapeitos (com o vão do patamar), os postes das tochas e as paredes de fora
        r.push([-PX - PAR, PZ1, LAND.x0 + 0.2, PZ1 + PAR], [LAND.x1 - 0.2, PZ1, PX + PAR, PZ1 + PAR], [-PX - PAR, PZ0 - PAR, PX + PAR, PZ0], [-PX - PAR, PZ0, -PX, PZ1], [PX, PZ0, PX + PAR, PZ1]);
        r.push(...postRects);
        r.push([-OX - 2, OZ0 - 2, -OX, Z1 + 2], [OX, OZ0 - 2, OX + 2, Z1 + 2], [-OX - 2, OZ0 - 2, OX + 2, OZ0]);
      }
      const rr = riser.rect();
      if (rr && f > 2.5) r.push(rr);
      return r;
    },
    clampDie(p, vel, e, R) {
      if (p.y > CEIL - R) {
        p.y = CEIL - R;
        if (vel.y > 0) vel.y = -vel.y * e;
      }
      if (p.x < -OX + R) {
        p.x = -OX + R;
        if (vel.x < 0) vel.x = -vel.x * e;
      } else if (p.x > OX - R) {
        p.x = OX - R;
        if (vel.x > 0) vel.x = -vel.x * e;
      }
      if (p.z < OZ0 + R) {
        p.z = OZ0 + R;
        if (vel.z < 0) vel.z = -vel.z * e;
      } else if (p.z > Z1 - R) {
        p.z = Z1 - R;
        if (vel.z > 0) vel.z = -vel.z * e;
      }
    },
    groundY,
    surfaceAt: (x, z) => kit.surfaceAt(x, z),
    // o som do lugar (§60): o fosso é fundo e ecoa muito; na boca dele, lá em cima, corre um ar que sobe do fundo (mais forte na beira, mais
    // fraco e abafado lá embaixo); no fundo, pinga
    ambience: {
      size: 0.9,
      wind: windNear([{ x: 0, z: ZC, hx: PX, hz: (PZ1 - PZ0) / 2, y: TOP, r: 7, k: 0.5 }], 0.04),
      drips: [
        { x: -3.4, y: 0.1, z: -9.4 },
        { x: 4.6, y: 0.1, z: -2.2 },
      ],
    },
    dieFloor: (x, z) => (!inPit(x, z) ? TOP : inInner(x, z) || onLanding(x, z) || onBridge(x, z) ? 0 : rampY(x, z)),
    holdsDie: () => false,
    update(dt, t) {
      kit.tick(dt, t);
      gate.tick();
      floor.update(dt, t);
      plank.update(dt, t);
      // o fogo passa por baixo da madeira: ela queima e cai; a canaleta de cima, se ainda não levou fogo, fica cortada
      if (plank.state === 'ok' && floor.progress(UNDER[0], UNDER[1]) >= 0.5) {
        plank.burnDown();
        if (floor.progress(OVER[0], OVER[1]) === 0) floor.cut.add(edgeKey(OVER[0], OVER[1]));
      }
      if (failT >= 0) {
        failT -= dt;
        if (failT < 0) {
          floor.clear(false);
          plank.restore(); // a Casa repõe a ponte
          used = 0;
          coldT = 6;
        }
      } else if (coldT > 0) {
        coldT -= ctx.paused() ? 0 : dt;
        if (braz.some((b) => b.touched()) && gate.take()) ctx.sfx('error');
      } else if (!solved) {
        braz.forEach((b, i) => {
          if (!b.touched() || !gate.take()) return;
          if (used >= 2 || floor.running() || plank.state === 'sliding') {
            ctx.sfx('error'); // enquanto há fogo correndo (ou as ignições acabaram), a Casa recusa o fogo
            return;
          }
          used++;
          floor.ignite(i);
          ctx.sfx('ignite', 'ponte');
        });
        if (used > 0 && !floor.running()) {
          stopT += ctx.paused() ? 0 : dt;
          const pts = floor.points();
          if (stopT > 2 && pts.length === CROSS.length && CROSS.every((c) => pts.includes(c))) {
            solved = true;
            ctx.sfx('piece');
            door.lampMats.forEach((m) => m.color.setHex(0xff7a2e));
          } else if (stopT > 2 && (used >= 2 || pts.some((c) => !CROSS.includes(c)))) {
            failT = 3; // não escreveu a cruz (ou já acendeu um canto, que não tem volta): em 3 s a Casa apaga tudo
            stopT = 0;
            ctx.sfx('error');
          }
        } else stopT = 0;
      }
      sockMats.forEach((m, k) => m.color.setHex(k < used || solved ? 0xffb048 : 0x2a1a14));
      if (!solved) door.lampMats.forEach((m, k) => m.color.setHex(k < used ? 0x7a4a2a : LAMP_OFF));
      readT = solved ? readT + dt : 0;
      const anyLit = floor.points().length > 0;
      sign.panels.forEach((p, k) => {
        const on = solved ? (readT > 0.2 + k * 0.45 ? 1 : 0) : p.id === 'acender' ? (anyLit ? 0.7 : 0) : p.id === 'n2' ? used / 2 : 0;
        p.fire = (p.fire ?? 0) + (on - (p.fire ?? 0)) * Math.min(1, dt * 6);
      });
      for (const p of cross.panels) p.fire = (p.fire ?? 0) + ((solved && readT > 1.1 ? 1 : 0) - (p.fire ?? 0)) * Math.min(1, dt * 3);
      const want = solved && readT > 1.4 ? 1 : 0;
      if (want && !prevWant) ctx.sfx('door');
      prevWant = want;
      doorOpen += (want - doorOpen) * Math.min(1, dt * 2.4);
      door.setOpen(doorOpen);

      // ── C3: com a cruz acesa no fundo, só as 4 tochas da boca que caem sobre os cantos ──
      for (const tc of torches) {
        if (tc.touched()) {
          tc.light(true, true);
          ctx.sfx('ignite', 'tocha');
        }
        tc.update(dt, t, ctx.paused());
      }
      if (solved && !riser.up) {
        const lit = torches.map((tc, i) => (tc.lit ? cells[i] : -1));
        const n = lit.filter((c) => c !== -1).length;
        if (n === 4 && lit.every((c, i) => !torches[i].lit || (c !== null && CORNERS.has(c as number)))) {
          riser.raise();
          ctx.caption(Tr('Algo subiu na rampa', 'Something rose on the ramp', 'Algo subió en la rampa'), Tr('Do alto, a grade ficou inteira.', 'From above, the grid is whole.', 'Desde arriba, la cuadrícula quedó entera.'), '#7ad8ff');
        }
      }
      riser.update(dt, t);
      if (riser.k >= 1 && !riser.brazier.lit && riser.brazier.touched()) {
        riser.brazier.light(true, true);
        ctx.sfx('ignite', 'risen');
        niche.open();
      }
      niche.update(dt, t);
    },
    // salvamento: a sala já resolvida (ao carregar um jogo, as salas de trás voltam abertas; a porta abre sem som)
    skip() {
      solved = true;
      readT = 99;
      prevWant = 1;
      doorOpen = 1;
    },
    isSolved: () => solved,
    reset,
    bonus: () => bonus,
    dispose() {},
  };
}
