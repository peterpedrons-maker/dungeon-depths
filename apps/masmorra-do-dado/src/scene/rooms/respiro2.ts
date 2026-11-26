// RESPIRO R2 · OS BANHOS SECOS (PUZZLES_PROPOSTAS.md §2b; entre O Que a Casa Confirma e O Pano). Área livre: a porta está sempre aberta.
// Um salão grande e MAIS BAIXO que a porta de entrada: desce-se uma escadaria larga até um chão com piscinas vazias de pedra, em profundidades
// diferentes (dá para descer numa e subir noutra pela rampa), colunas grossas e uma fonte seca no meio. Duas câmaras de banho laterais, com bancos.
//  · Inscrições do mundo, cada uma com um relevo: «CONTÁVEIS DIZER CONFIRMADO» (alguém falando e um dado pousado) e, gasta, «CONTÁVEIS MENTIR BOATO».
//  · Puzzle opcional (nível 2), na piscina mais funda: quatro braseiros e duas frases, «ACENDER DOIS CONFIRMADO» e «ACENDER UM BOATO».
//    Acender exatamente DOIS: sobe uma gema do ralo. (Um só não faz nada; três, a Casa apaga.)
//  · A folha arrancada nº 3 dela (id p4), num banco da câmara de banho do oeste.
//  · Semente: um estandarte tecido, com BOATO bordado, alto na parede da fonte. Pano queima (a sala seguinte ensina): atrás dele há um nicho com uma gema.
//  · O dado pede para APONTAR: lê «CONTÁVEIS DIZER CONFIRMADO» e pergunta «DADO ONDE ?» (o dado de pedra pousado na estela).
// Coordenadas: o fundo da piscina mais funda é y = 0; o salão fica em y = 1,2 (a porta de saída: `exitDy`) e a entrada em y = 2,7 (`entranceY`).

import * as THREE from 'three';
import { buildDoor, buildEntrance, Kit, lambert, T } from '../kit';
import { floorTexture } from '../textures';
import { makeBrazier, type Brazier } from '../brazier';
import { makeCloth, makeGemNiche } from '../firegrid';
import { makePointAsk } from '../pointask';
import { diary, diaryStore } from '../../story/diary';
import { mkBox, slopedWall, stairs, wedge } from './shell';
import type { Box, Ctx, Interactable, Rect, Room } from '../types';

const HALL = 1.2; // o chão do salão
const EY = 2.7; // o patamar da entrada
const CEIL = 6.8;
const X0 = -9;
const X1 = 9;
const Z1 = 2;
const Z0 = -24;
const LZ = -1; // a borda do patamar
const SX = 3.5; // meia-largura da escadaria
const SZ = -5.5; // o pé da escadaria

interface Pool {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  y: number; // o fundo
  ramp: 'n' | 'e'; // de que lado fica a rampa de saída
  len: number; // comprimento da rampa
}
const POOLS: Pool[] = [
  { x0: -7.6, x1: -2.8, z0: -11.6, z1: -7.2, y: 0.6, ramp: 'n', len: 1.3 }, // A: rasa
  { x0: 2.8, x1: 7.6, z0: -18, z1: -8.2, y: 0, ramp: 'n', len: 2.4 }, // B: a mais funda (o puzzle)
  { x0: -7.6, x1: -2.8, z0: -21, z1: -15.4, y: 0.3, ramp: 'e', len: 1.8 }, // C: média
];
const inPool = (p: Pool, x: number, z: number) => x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1;
function poolY(p: Pool, x: number, z: number) {
  const t = p.ramp === 'n' ? (z - (p.z1 - p.len)) / p.len : (x - (p.x1 - p.len)) / p.len;
  return p.y + (HALL - p.y) * Math.min(1, Math.max(0, t));
}
const stairY = (z: number) => EY - ((EY - HALL) * (LZ - z)) / (LZ - SZ);
function groundY(x: number, z: number) {
  if (z > LZ) return EY;
  if (Math.abs(x) < SX && z > SZ) return stairY(z);
  for (const p of POOLS) if (inPool(p, x, z)) return poolY(p, x, z);
  return HALL;
}
const WEST = { x0: -12.5, x1: X0, z0: -15.5, z1: -11.5, d0: -14.6, d1: -12.4 }; // câmara de banho do oeste (d0..d1 = o vão)
const EAST = { x0: X1, x1: 12.5, z0: -23, z1: -19.2, d0: -22.2, d1: -20 };
const CH = 3.1; // pé-direito das câmaras

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// relevo talhado (sulco escuro + cal) de um desenho em traços
function carve(g: CanvasRenderingContext2D, paths: [number, number][][], w = 2) {
  for (const [color, lw, dx] of [['#15110f', w + 2, 1], ['#e9e1cc', w, 0]] as [string, number, number][]) {
    g.strokeStyle = color;
    g.lineWidth = lw;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const p of paths) {
      g.beginPath();
      p.forEach(([x, y], i) => (i ? g.lineTo(x + dx, y + dx) : g.moveTo(x + dx, y + dx)));
      g.stroke();
    }
  }
}
// uma pessoa em traços: cabeça, corpo, pernas e um braço para o lado `sgn`
const person = (x: number, sgn: number, lean = 0): [number, number][][] => [
  [[x - 3, 12], [x + 3, 12], [x + 3, 18], [x - 3, 18], [x - 3, 12]],
  [[x + lean, 18], [x, 38]],
  [[x, 38], [x - 5, 50]],
  [[x, 38], [x + 5, 50]],
  [[x + lean * 0.5, 24], [x + sgn * 10, 21]],
];

export function buildRespiro2(ctx: Ctx): Room {
  const kit = new Kit('ruin');
  const boxes: Box[] = [];
  const rects: Rect[] = [];
  const interactables: Interactable[] = [];
  const brick = (w: number, h: number, seed: number, tint = 0.95) => kit.brick([w / T, h / T], tint, seed);
  const wallAt = (x: number, z: number, nx: number, nz: number, w: number, h: number, y0: number, seed: number, tint = 0.95) => kit.plane(w, h, brick(w, h, seed, tint), x, y0 + h / 2, z, 0, Math.atan2(nx, nz));
  const solidBox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat: THREE.Material = kit.stone, block = true) => {
    kit.box(x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    boxes.push(mkBox(x0, y0, z0, x1, y1, z1));
    if (block) rects.push([x0, z0, x1, z1]);
  };

  // ── o patamar da entrada, a escadaria larga e os parapeitos ──
  kit.plane(X1 - X0, Z1 - LZ, lambert(floorTexture([(X1 - X0) / T, (Z1 - LZ) / T], 'ruin')), 0, EY, (Z1 + LZ) / 2, -Math.PI / 2);
  const entrance = buildEntrance(kit, { x0: X0, x1: X1, z: Z1, h: CEIL - EY, y0: EY });
  stairs(kit, { x0: -SX, x1: SX, zLow: SZ, zHigh: LZ, yLow: HALL, yHigh: EY, n: 9 });
  const stoneSide = kit.brick([1, 1], 0.9, 57);
  for (const s of [-1, 1]) {
    // mureta da escadaria (acompanha a descida)
    const xa = s < 0 ? -SX - 0.3 : SX;
    slopedWall(kit, { x0: xa, z0: SZ, x1: xa + 0.3, z1: LZ, top: (_x, z) => stairY(z) + 0.9, y0: HALL });
    boxes.push(mkBox(xa, HALL, SZ, xa + 0.3, EY + 0.9, LZ));
    rects.push([xa, SZ, xa + 0.3, LZ]);
    // a frente do patamar (parede baixa) e o parapeito em cima
    const wx0 = s < 0 ? X0 : SX + 0.3;
    const wx1 = s < 0 ? -SX - 0.3 : X1;
    wallAt((wx0 + wx1) / 2, LZ, 0, -1, wx1 - wx0, EY - HALL, HALL, 21 + s, 0.85);
    kit.box(wx1 - wx0, 0.82, 0.25, kit.stone, (wx0 + wx1) / 2, EY + 0.41, LZ + 0.125);
    kit.box(wx1 - wx0, 0.09, 0.34, kit.slab, (wx0 + wx1) / 2, EY + 0.865, LZ + 0.125, false);
    boxes.push(mkBox(wx0, HALL, LZ, wx1, EY + 0.9, LZ + 0.25));
    rects.push([wx0, LZ, wx1, LZ + 0.25]);
  }

  // ── o salão: chão com os buracos das piscinas, teto, paredes ──
  {
    const sh = new THREE.Shape();
    // (x, -z): depois de deitado (rotation.x = -π/2) o chão fica em (x, y, z)
    const pts: [number, number][] = [[X0, -LZ], [-SX - 0.3, -LZ], [-SX - 0.3, -SZ], [SX + 0.3, -SZ], [SX + 0.3, -LZ], [X1, -LZ], [X1, -Z0], [X0, -Z0]];
    pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
    for (const p of POOLS) {
      const h = new THREE.Path();
      h.moveTo(p.x0, -p.z1);
      h.lineTo(p.x1, -p.z1);
      h.lineTo(p.x1, -p.z0);
      h.lineTo(p.x0, -p.z0);
      h.closePath();
      sh.holes.push(h);
    }
    const geo = new THREE.ShapeGeometry(sh);
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / T, uv.getY(i) / T);
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: floorTexture([1, 1], 'ruin'), side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = HALL;
    kit.add(m);
    // o chão sob a escadaria (entre as muretas) é tapado pelos degraus
  }
  kit.plane(X1 - X0, Z1 - Z0, brick(X1 - X0, Z1 - Z0, 19, 0.6), 0, CEIL, (Z1 + Z0) / 2, Math.PI / 2);
  const HH = CEIL - HALL;
  // paredes laterais, com o vão de cada câmara de banho
  const sideWall = (x: number, nx: number, c: typeof WEST, seed: number) => {
    wallAt(x, (Z1 + c.d1) / 2, nx, 0, Z1 - c.d1, HH, HALL, seed);
    wallAt(x, (c.d0 + Z0) / 2, nx, 0, c.d0 - Z0, HH, HALL, seed + 1);
    wallAt(x, (c.d0 + c.d1) / 2, nx, 0, c.d1 - c.d0, HH - 2.4, HALL + 2.4, seed + 2);
  };
  sideWall(X0, 1, WEST, 33);
  sideWall(X1, -1, EAST, 39);
  // o vão de cada câmara ganha batentes e verga de pedra lavrada (antes era só o recorte de duas folhas de parede, sem espessura; §67)
  for (const [x, c] of [[X0, WEST], [X1, EAST]] as const) {
    for (const z of [c.d0 + 0.11, c.d1 - 0.11]) solidBox(x - 0.25, HALL, z - 0.11, x + 0.25, HALL + 2.3, z + 0.11, kit.slab);
    kit.box(0.5, 0.18, c.d1 - c.d0, kit.slab, x, HALL + 2.39, (c.d0 + c.d1) / 2, false);
  }
  rects.push([X0 - 0.3, WEST.d1, X0, Z1 + 1], [X0 - 0.3, Z0 - 1, X0, WEST.d0], [X1, EAST.d1, X1 + 0.3, Z1 + 1], [X1, Z0 - 1, X1 + 0.3, EAST.d0]);
  const door = buildDoor(kit, { x0: X0, x1: X1, z0: Z0, y0: HALL, h: HH, lamps: 1, connected: true });
  door.setOpen(1);
  door.lampMats.forEach((mm) => mm.color.setHex(0xff7a2e));

  // ── as câmaras de banho laterais: pequenas, com bancos de pedra ──
  const chamber = (c: typeof WEST, s: number, seed: number) => {
    const w = c.x1 - c.x0;
    const d = c.z1 - c.z0;
    const cx = (c.x0 + c.x1) / 2;
    const cz = (c.z0 + c.z1) / 2;
    kit.plane(w, d, lambert(floorTexture([w / T, d / T], 'frost')), cx, HALL, cz, -Math.PI / 2);
    kit.plane(w, d, brick(w, d, seed, 0.6), cx, HALL + CH, cz, Math.PI / 2);
    const far = s < 0 ? c.x0 : c.x1; // a parede do fundo
    wallAt(far, cz, -s, 0, d, CH, HALL, seed + 1, 0.85);
    wallAt(cx, c.z1, 0, -1, w, CH, HALL, seed + 2, 0.85);
    wallAt(cx, c.z0, 0, 1, w, CH, HALL, seed + 3, 0.85);
    // os dois trechos de parede ao lado do vão (vistos de dentro da câmara)
    const near = s < 0 ? c.x1 : c.x0;
    wallAt(near, (c.z1 + c.d1) / 2, s, 0, c.z1 - c.d1, CH, HALL, seed + 4, 0.85);
    wallAt(near, (c.d0 + c.z0) / 2, s, 0, c.d0 - c.z0, CH, HALL, seed + 5, 0.85);
    wallAt(near, (c.d0 + c.d1) / 2, s, 0, c.d1 - c.d0, CH - 2.4, HALL + 2.4, seed + 6, 0.85);
    rects.push(s < 0 ? [far - 1, c.z0 - 1, far, c.z1 + 1] : [far, c.z0 - 1, far + 1, c.z1 + 1], [c.x0, c.z1, c.x1, c.z1 + 1], [c.x0, c.z0 - 1, c.x1, c.z0]);
    // bancos ao longo das paredes do fundo e dos lados
    solidBox(Math.min(far, far - s * 0.6), HALL, c.z0 + 0.1, Math.max(far, far - s * 0.6), HALL + 0.5, c.z1 - 0.1);
    solidBox(cx - 0.9, HALL, c.z1 - 0.6, cx + 0.9, HALL + 0.5, c.z1 - 0.05);
    kit.torch(cx, HALL + 1.9, c.z0 + 0.1, 0, 1, seed * 0.37, 0xff9a3c, 30);
  };
  chamber(WEST, -1, 61);
  chamber(EAST, 1, 71);
  // a grade do fundo da câmara do leste (dá para ver um corredor escuro: o atalho, ainda fechado)
  {
    const gx = EAST.x1 - 0.03;
    const gz = (EAST.z0 + EAST.z1) / 2;
    const dark = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.9), new THREE.MeshBasicMaterial({ color: 0x050408 }));
    dark.position.set(gx, HALL + 1.5, gz);
    dark.rotation.y = -Math.PI / 2;
    kit.group.add(dark);
    const iron = lambert(null, 0x2a2a32);
    for (let k = 0; k < 6; k++) kit.box(0.05, 1.9, 0.05, iron, gx - 0.04, HALL + 1.5, gz - 0.62 + k * 0.25, false);
    for (const y of [0.75, 1.5, 2.25]) kit.box(0.05, 0.05, 1.5, iron, gx - 0.04, HALL + y, gz, false);
  }

  // ── as piscinas vazias ──
  const tile = (w: number, d: number) => lambert(floorTexture([w / T, d / T], 'frost'));
  for (const [k, p] of POOLS.entries()) {
    const w = p.x1 - p.x0;
    const d = p.z1 - p.z0;
    const dep = HALL - p.y;
    kit.plane(w, d, tile(w, d), (p.x0 + p.x1) / 2, p.y, (p.z0 + p.z1) / 2, -Math.PI / 2);
    wallAt(p.x0, (p.z0 + p.z1) / 2, 1, 0, d, dep, p.y, 81 + k, 0.8);
    wallAt(p.x1, (p.z0 + p.z1) / 2, -1, 0, d, dep, p.y, 84 + k, 0.8);
    wallAt((p.x0 + p.x1) / 2, p.z0, 0, 1, w, dep, p.y, 87 + k, 0.8);
    wallAt((p.x0 + p.x1) / 2, p.z1, 0, -1, w, dep, p.y, 90 + k, 0.8);
    // a rampa de saída (degraus gastos)
    const rampTop = tile(1, 1);
    if (p.ramp === 'n') kit.add(wedge(p.x0, p.z1 - p.len, p.x1, p.z1, (x, z) => poolY(p, x, z - 0.0001) + 0.01, stoneSide, rampTop, p.y));
    else kit.add(wedge(p.x1 - p.len, p.z0, p.x1, p.z1, (x, z) => poolY(p, x - 0.0001, z) + 0.01, stoneSide, rampTop, p.y));
    // a borda (pedra clara) e as paredes para quem está dentro: só se sai pela rampa
    const E = 0.25;
    const edge = (x0: number, z0: number, x1: number, z1: number) => {
      kit.box(x1 - x0, 0.06, z1 - z0, kit.stone, (x0 + x1) / 2, HALL + 0.03, (z0 + z1) / 2, false);
      boxes.push(mkBox(x0, p.y, z0, x1, HALL, z1));
      rects.push([x0, z0, x1, z1, HALL]);
    };
    edge(p.x0 - E, p.z0 - E, p.x0, p.z1 + E);
    edge(p.x0, p.z0 - E, p.x1 + E, p.z0);
    if (p.ramp === 'n') edge(p.x1, p.z0, p.x1 + E, p.z1 + E);
    else edge(p.x0, p.z1, p.x1 + E, p.z1 + E);
  }

  // ── colunas grossas ──
  for (const [cx, cz] of [[-5.9, -3.6], [5.9, -3.6], [-5.2, -22.6], [5.2, -21]] as [number, number][]) {
    kit.box(1.1, HH, 1.1, kit.brick([1, 1], 0.95, 50 + Math.abs(cx * cz)), cx, HALL + HH / 2, cz);
    kit.box(1.35, 0.3, 1.35, kit.stone, cx, HALL + 0.15, cz);
    kit.contact(cx, cz, 2.3, 2.3, HALL);
    kit.box(1.35, 0.3, 1.35, kit.stone, cx, CEIL - 0.15, cz);
    boxes.push(mkBox(cx - 0.55, HALL, cz - 0.55, cx + 0.55, CEIL, cz + 0.55));
    rects.push([cx - 0.68, cz - 0.68, cx + 0.68, cz + 0.68]);
  }

  // ── a fonte seca, no meio: uma parede de pedra com uma bica e a bacia vazia; no alto dela, o estandarte ──
  const FZ = -13;
  solidBox(-1.7, HALL, FZ - 0.35, 1.7, HALL + 4.7, FZ + 0.35, kit.brick([1, 1], 1.0, 97));
  kit.contact(0, FZ + 0.9, 4.2, 2.6, HALL);
  kit.box(3.7, 0.25, 0.95, kit.stone, 0, HALL + 4.82, FZ, false);
  // a bacia (do lado de quem chega)
  solidBox(-1.5, HALL, FZ + 1.35, 1.5, HALL + 0.55, FZ + 1.6);
  solidBox(-1.5, HALL, FZ + 0.35, -1.25, HALL + 0.55, FZ + 1.35);
  solidBox(1.25, HALL, FZ + 0.35, 1.5, HALL + 0.55, FZ + 1.35);
  kit.plane(2.5, 1.0, lambert(null, 0x2a2622), 0, HALL + 0.12, FZ + 0.85, -Math.PI / 2, 0, false);
  rects.push([-1.25, FZ + 0.35, 1.25, FZ + 1.35]);
  kit.box(0.34, 0.3, 0.3, kit.stone, 0, HALL + 1.25, FZ + 0.5, false); // a bica (uma cabeça de pedra gasta)
  kit.box(0.1, 0.08, 0.2, lambert(null, 0x1a1614), 0, HALL + 1.16, FZ + 0.66, false);
  for (const bx of [-0.62, 0.62]) kit.box(0.06, 0.06, 0.5, lambert(null, 0x4a3020), bx, HALL + 4.16, FZ + 0.6, false); // os braços que seguram a vara
  const banner = makeCloth(kit, ctx, { x: 0, y: HALL + 3.35, z: FZ + 0.8, nx: 0, nz: 1, words: ['boato'], size: 0.62, color: '#a03a48', mark: false, tall: 0.5, key: 'estandarte' });
  let bonusBanner = false;
  const niche = makeGemNiche(kit, ctx, 0, HALL + 3.3, FZ + 0.35, 0, 1, () => (bonusBanner = true));

  // ── as inscrições do mundo, cada uma numa estela com relevo ──
  // 1) na beira da piscina rasa: «CONTÁVEIS DIZER CONFIRMADO»: alguém falando, e um DADO pousado (de pedra, de verdade, numa prateleira)
  const stele = (cx: number, z: number, seed: number, draw: (g: CanvasRenderingContext2D) => void) => {
    solidBox(cx - 1.45, HALL, z - 0.2, cx + 1.45, HALL + 2.25, z + 0.2, kit.brick([1, 1], 1.0, seed));
    kit.contact(cx, z + 0.25, 3.4, 1.0, HALL);
    kit.box(3.1, 0.14, 0.52, kit.stone, cx, HALL + 2.32, z, false);
    const t = canvasTex(128, 56, (g) => {
      g.fillStyle = '#7a7470';
      g.fillRect(0, 0, 128, 56);
      g.fillStyle = '#6a6460';
      for (let i = 0; i < 60; i++) g.fillRect((i * 37) % 128, (i * 23) % 56, 2, 1);
      g.strokeStyle = '#15110f';
      g.lineWidth = 2;
      g.strokeRect(2, 2, 124, 52);
      draw(g);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.1), new THREE.MeshLambertMaterial({ map: t, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
    m.position.set(cx, HALL + 1.6, z + 0.21);
    kit.group.add(m);
  };
  const S1 = { x: -5.2, z: -12.05 };
  stele(S1.x, S1.z, 101, (g) => {
    carve(g, [...person(34, 1), [[50, 18], [58, 15]], [[50, 22], [60, 22]], [[50, 26], [58, 29]]]); // a figura fala (traços saindo da boca)
    carve(g, [[[78, 44], [116, 44]]]); // a prateleira (o dado de verdade fica na frente dela)
  });
  const confIns = kit.inscribe({ words: ['contaveis', 'dizer', 'conf'], x: S1.x, y: HALL + 0.62, z: S1.z + 0.225, nx: 0, nz: 1, size: 0.32, age: 0.3, seed: 103, lead: true });
  // o dado de pedra pousado
  const diePos = new THREE.Vector3(S1.x + 0.78, HALL + 1.42, S1.z + 0.42);
  kit.box(0.62, 0.08, 0.36, kit.stone, diePos.x, diePos.y - 0.2, diePos.z, false);
  {
    const face = (n: number) =>
      new THREE.MeshLambertMaterial({
        map: canvasTex(16, 16, (g) => {
          g.fillStyle = '#8a857e';
          g.fillRect(0, 0, 16, 16);
          g.strokeStyle = '#3a3632';
          g.strokeRect(0.5, 0.5, 15, 15);
          g.fillStyle = '#1a1614';
          const P: Record<number, [number, number][]> = { 1: [[8, 8]], 2: [[4, 4], [12, 12]], 3: [[4, 4], [8, 8], [12, 12]], 4: [[4, 4], [12, 4], [4, 12], [12, 12]], 5: [[4, 4], [12, 4], [8, 8], [4, 12], [12, 12]], 6: [[4, 4], [12, 4], [4, 8], [12, 8], [4, 12], [12, 12]] };
          for (const [x, y] of P[n]) g.fillRect(x - 1, y - 1, 3, 3);
        }),
      });
    const dm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), [face(3), face(4), face(5), face(2), face(1), face(6)]);
    dm.position.copy(diePos);
    dm.rotation.y = 0.35;
    kit.group.add(dm);
  }
  // 2) na beira da piscina média, gasta: «CONTÁVEIS MENTIR BOATO»: alguém cochichando no ouvido de outro
  const S2 = { x: -5.2, z: -14.95 };
  stele(S2.x, S2.z, 111, (g) => {
    carve(g, [...person(52, 1, 5), ...person(74, -1)]);
    carve(g, [[[60, 16], [66, 15]]], 1);
  });
  kit.inscribe({ words: ['contaveis', 'mentir', 'boato'], x: S2.x, y: HALL + 0.62, z: S2.z + 0.225, nx: 0, nz: 1, size: 0.3, age: 0.72, seed: 113, lead: true });

  // ── o puzzle opcional, na piscina mais funda: quatro braseiros e duas frases ──
  const PB = POOLS[1];
  const bx = [(PB.x0 + PB.x1) / 2 - 1.25, (PB.x0 + PB.x1) / 2 + 1.25];
  const bz = [-12.6, -15.8];
  const braz: Brazier[] = [];
  for (const z of bz) for (const x of bx) braz.push(makeBrazier(kit, ctx, x, z, false));
  for (const b of braz) boxes.push(...b.boxes);
  const two = kit.inscribe({ words: ['acender', 'n2', 'conf'], x: (PB.x0 + PB.x1) / 2, y: 0.86, z: PB.z0 + 0.025, nx: 0, nz: 1, size: 0.3, age: 0.25, seed: 121, lead: true });
  kit.inscribe({ words: ['acender', 'n1', 'boato'], x: (PB.x0 + PB.x1) / 2, y: 0.38, z: PB.z0 + 0.025, nx: 0, nz: 1, size: 0.3, age: 0.4, seed: 123, lead: true });
  const DR = new THREE.Vector3((PB.x0 + PB.x1) / 2, 0, -14.2); // o ralo
  {
    const t = canvasTex(24, 24, (g) => {
      g.fillStyle = '#0a0808';
      g.fillRect(2, 2, 20, 20);
      g.fillStyle = '#3a3a44';
      for (let i = 0; i < 5; i++) g.fillRect(2, 3 + i * 4, 20, 1);
      g.strokeStyle = '#5a5a66';
      g.strokeRect(1.5, 1.5, 21, 21);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshLambertMaterial({ map: t, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -3 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(DR.x, 0.01, DR.z);
    kit.group.add(m);
  }
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshLambertMaterial({ color: 0x7af0ff, emissive: 0x2ab8e0, emissiveIntensity: 0.8, flatShading: true }));
  gem.position.set(DR.x, -0.3, DR.z);
  gem.visible = false;
  kit.group.add(gem);
  const gemLight = kit.light(DR.x, 1.0, DR.z, 0x7ad8ff, 0);
  let solved = false;
  let gemK = 0;
  let gemTaken = false;
  let stable = 0;
  let over = 0;
  let cold = 0;
  interactables.push({
    pos: new THREE.Vector3(DR.x, 0.9, DR.z),
    r: 1.7,
    label: 'Pegar a gema',
    enabled: () => solved && gemK > 0.95 && !gemTaken,
    use: () => {
      gemTaken = true;
      gem.visible = false;
      gemLight.intensity = 0;
      ctx.sfx('gem');
      ctx.caption('Uma gema', 'Fria na mão.', '#7ad8ff');
    },
  });

  // ── a folha arrancada nº 3 (dela), num banco da câmara do oeste ──
  let p4Taken = (diaryStore.get().pages ?? []).includes('p4');
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.004, 0.3), lambert(null, 0xd8b880));
  leaf.position.set(WEST.x0 + 0.32, HALL + 0.51, -13.2);
  leaf.rotation.y = 0.5;
  leaf.visible = !p4Taken;
  kit.group.add(leaf);
  interactables.push({
    pos: leaf.position.clone(),
    r: 1.7,
    label: 'Pegar a folha',
    enabled: () => !p4Taken,
    use: () => {
      p4Taken = true;
      leaf.visible = false;
      diary.addPage('p4');
      ctx.sfx('gem');
      ctx.caption('Uma folha arrancada', 'É do caderno. A letra dela.', '#d8b880');
    },
  });

  // ── o dado pede para APONTAR: lê «CONTÁVEIS DIZER CONFIRMADO» e pergunta «DADO ONDE ?» ──
  const point = makePointAsk(ctx, { id: 'r2-dado', ins: confIns, read: ['contaveis', 'dizer', 'conf'], ask: ['dado', 'onde'], targets: () => [diePos], radius: 0.4, near: 6.5 });
  interactables.push(point.interactable, niche.interactable);

  // luz: poucas tochas (fundo, abafado)
  kit.torch(X0 + 0.1, EY + 1.9, 0.4, 1, 0, 0.3);
  kit.torch(X1 - 0.1, EY + 1.9, 0.4, -1, 0, 1.1);
  kit.torch(X0 + 0.1, HALL + 2.1, -7.2, 1, 0, 1.9);
  kit.torch(X1 - 0.1, HALL + 2.1, -6.2, -1, 0, 2.6);
  kit.torch(X1 - 0.1, HALL + 2.1, -14.5, -1, 0, 3.3);
  kit.torch(X0 + 0.1, HALL + 2.1, -19.5, 1, 0, 4.0);
  kit.torch(-3.2, HALL + 2.1, Z0 + 0.1, 0, 1, 4.7);
  kit.torch(3.2, HALL + 2.1, Z0 + 0.1, 0, 1, 5.4);
  kit.torch(-1.2, HALL + 1.9, FZ - 0.36, 0, -1, 6.1);
  kit.aoSides(X0, X1, Z0, LZ, HH, HALL);

  if (import.meta.env.DEV) {
    ((globalThis as Record<string, unknown>).__banhos = () => ({ lit: braz.map((b) => b.lit), bowls: braz.map((b) => b.bowl.toArray()), solved, gem: gemTaken, cold: +cold.toFixed(1), banner: +banner.k.toFixed(2), bannerAt: banner.center.toArray(), bonusBanner, p4: p4Taken, point: point.state(), die: diePos.toArray() }));
  }
  kit.bake();

  return {
    name: 'Os Banhos Secos',
    subtitle: 'A água se foi. As palavras ficaram.',
    group: kit.group,
    surfaces: kit.surfaces,
    emitters: kit.emitters,
    inscriptions: kit.inscriptions,
    interactables,
    doorZ: Z0,
    entranceZ: Z1,
    entranceY: EY,
    exitDy: HALL,
    calm: (x, z) => z < SZ - 0.6 && z > SZ - 4 && Math.abs(x) < 2.6, // o pé da escadaria: o dado pode fazer uma pergunta
    start: new THREE.Vector3(0, EY, 1.2),
    startYaw: 0,
    fog: { color: '#0d0b0c', near: 6, far: 34 },
    ambient: { color: 0xa08a78, intensity: 1.9 },
    boxes: [...boxes, ...kit.boxes],
    sockets: braz.map((b) => b.socket),
    rects() {
      return [...rects, ...kit.rects, ...entrance.rects(), ...door.rects(true), ...braz.map((b) => b.rect)];
    },
    clampDie(p, vel, e, R) {
      if (p.y > CEIL - R) {
        p.y = CEIL - R;
        if (vel.y > 0) vel.y = -vel.y * e;
      }
      if (p.x < X0 + R) {
        p.x = X0 + R;
        if (vel.x < 0) vel.x = -vel.x * e;
      } else if (p.x > X1 - R) {
        p.x = X1 - R;
        if (vel.x > 0) vel.x = -vel.x * e;
      }
      if (p.z < Z0 + R + 0.03) {
        p.z = Z0 + R + 0.03;
        if (vel.z < 0) vel.z = -vel.z * e;
      } else if (p.z > Z1 - R) {
        p.z = Z1 - R;
        if (vel.z > 0) vel.z = -vel.z * e;
      }
    },
    groundY,
    surfaceAt: (x, z) => kit.surfaceAt(x, z),
    dieFloor: groundY,
    holdsDie: () => false,
    update(dt, t) {
      kit.tick(dt, t);
      point.update(dt);
      // o estandarte: queimado, mostra o nicho
      banner.update(dt, t);
      if (banner.k >= 1) niche.open();
      niche.update(dt, t);
      // a piscina funda: exatamente DOIS
      for (const b of braz) b.update(t);
      if (cold > 0) {
        cold -= ctx.paused() ? 0 : dt;
        if (braz.some((b) => b.touched())) ctx.sfx('error');
      } else if (!solved) {
        for (const b of braz) if (b.touched()) b.light(true);
        const n = braz.filter((b) => b.lit).length;
        if (n === 2) {
          stable += ctx.paused() ? 0 : dt;
          if (stable > 2.5) {
            solved = true;
            ctx.sfx('piece');
            gem.visible = !gemTaken;
          }
        } else stable = 0;
        if (n >= 3) {
          over += ctx.paused() ? 0 : dt;
          if (over > 1.2) {
            // três: a Casa apaga
            braz.forEach((b) => b.light(false, true));
            ctx.sfx('error');
            over = 0;
            cold = 4;
          }
        } else over = 0;
      }
      for (const p of two.panels) p.fire = (p.fire ?? 0) + ((solved ? 1 : 0) - (p.fire ?? 0)) * Math.min(1, dt * 3);
      if (solved && gemK < 1) gemK = Math.min(1, gemK + dt / 2.5);
      gem.position.y = -0.3 + 1.4 * gemK + Math.sin(t * 2) * 0.04 * gemK;
      gem.rotation.y = t * 1.4;
      if (solved && !gemTaken) gemLight.intensity = 10 * gemK;
    },
    reset() {
      if (!solved) braz.forEach((b) => b.light(false, true));
      stable = 0;
      over = 0;
      cold = 0;
      if (!bonusBanner) {
        banner.restore();
        niche.reset();
      }
    },
    bonus: () => gemTaken || bonusBanner,
    dispose() {},
  };
}
