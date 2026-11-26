// SALA · O FIO DE FOGO (nível 3; PUZZLES_PROPOSTAS.md §5, verificador tools/verify_fio.mjs).
// O fogo CORRE por canaletas de óleo (chevrons mostram para onde) e acende o que está do outro lado. «ACENDER N» passa a querer dizer N IGNIÇÕES.
// A sala: entra-se embaixo, SOBE-SE uma escada até um balcão alto (de onde se lê a grade inteira de cima) e desce-se pelo outro lado até o chão,
// onde há 9 braseiros em grade ligados por canaletas. Planeja-se de cima, faz-se embaixo.
//  · Balcão, lousa 1: demonstração (fogo no de cima desce para o de baixo).
//  · Balcão, lousa 2: «ACENDER UM» + TRÊS: uma ignição só → fogo no CENTRO.
//  · Balcão, lousa 3: ACENDER (o triângulo): fogo em qualquer ponta desenha as LINHAS do glifo (linha = fogo que correu).
//  · Porta: «ACENDER DOIS» + CINCO: duas ignições → canto do fundo à direita (2) e canto da frente à esquerda (6).
// Segredo S10 (para depois, com o lema «DIZER IGUAL FAZER» de um diário): acender o soquete frio da plaquinha do balcão e escrever FAZER com
// UMA ignição (canto do fundo à direita) abre um nicho sob o balcão.

import * as THREE from 'three';
import { Kit, lambert, LAMP_OFF } from '../kit';
import { floorTexture } from '../textures';
import { makeBrazier, type Brazier } from '../brazier';
import { FireGrid, makeFloorChannel, makeGemNiche, makeWallBoard, type GridEdge, type WallBoard } from '../firegrid';
import { mkBox, roomShell, shotGate, slopedWall, stairs, stairsX } from './shell';
import type { Ctx, Rect, Room } from '../types';

const BAL = 3; // altura do balcão
const BZ0 = -2.6; // borda do balcão do lado da entrada
const BZ1 = -7.6; // borda do lado do chão (parapeito)
// a escada que sobe corre ENCOSTADA NA FRENTE DO BALCÃO, do meio da sala (x1, chão) para a esquerda (x0, alto), e termina num patamar no canto
// (LX0..x0), de onde se passa ao balcão pelo vão do parapeito. O pé fica virado para o meio da sala, longe das paredes (antes ela subia colada à
// parede esquerda e começava a 0,8 m da parede da entrada: o jogador tinha de se espremer entre a pilastra e a parede para chegar ao 1º degrau).
const UP = { x0: -5, x1: -0.5, z0: BZ0, z1: -0.7 }; // 1,9 m de largura
const LX0 = -6.5; // o patamar vai até a parede esquerda
const DN = { x0: 5, x1: 6.5, z0: BZ1, z1: -11.6 }; // escada que desce (parede direita)
const FLOOR_EDGES: [number, number][] = [[2, 4], [4, 0], [4, 8], [1, 2], [5, 8], [3, 7], [7, 6]];

function stairY(x: number, z: number) {
  if (z > UP.z0 && z < UP.z1 && x >= LX0 && x < UP.x1) return x <= UP.x0 ? BAL : (BAL * (UP.x1 - x)) / (UP.x1 - UP.x0);
  if (x > DN.x0 && z < DN.z0 && z > DN.z1) return (BAL * (z - DN.z1)) / (DN.z0 - DN.z1);
  return -1;
}
const upY = (x: number) => (BAL * Math.min(1, Math.max(0, (UP.x1 - x) / (UP.x1 - UP.x0))));
function levelY(x: number, z: number) {
  if (z <= BZ0 && z >= BZ1) return BAL;
  const s = stairY(x, z);
  return s >= 0 ? s : 0;
}

export function buildFio(ctx: Ctx): Room {
  const kit = new Kit('ruin');
  const S = roomShell(kit, { hx: 6.5, z0: -21.5, h: 7, lamps: 2 });
  const { X0, X1, Z0, Z1 } = S;

  // ── o balcão e as escadas ──
  // o bloco do balcão: alvenaria nas faces, o piso de lajes por cima (um material por face; tudo em metros, nada esticado)
  const balFloor = lambert(floorTexture([1, 1], 'ruin'));
  kit.box(X1 - X0, BAL, BZ0 - BZ1, [kit.stone, kit.stone, balFloor, kit.stone, kit.stone, kit.stone], 0, BAL / 2, (BZ0 + BZ1) / 2);
  // uma cornija de pedra lavrada na borda do balcão (a quina de cima fica marcada) e um rodapé embaixo
  for (const z of [BZ0, BZ1]) {
    const s = z === BZ0 ? 1 : -1;
    const xa = z === BZ0 ? UP.x1 : X0; // (do lado da entrada, a escada encosta no balcão: cornija e rodapé só depois dela)
    kit.box(X1 - xa, 0.16, 0.12, kit.slab, (xa + X1) / 2, BAL - 0.24, z + s * 0.06, false);
    kit.box(X1 - xa, 0.22, 0.1, kit.slab, (xa + X1) / 2, 0.11, z + s * 0.05, false);
  }
  S.boxes.push(mkBox(X0, 0, BZ1, X1, BAL, BZ0));
  // parapeitos do balcão: alvenaria com capa de pedra lavrada
  const par = (x0: number, x1: number, z: number) => {
    kit.box(x1 - x0, 0.92, 0.22, kit.stone, (x0 + x1) / 2, BAL + 0.46, z);
    kit.box(x1 - x0 + 0.08, 0.1, 0.32, kit.slab, (x0 + x1) / 2, BAL + 0.97, z, false);
    S.boxes.push(mkBox(x0, BAL, z - 0.11, x1, BAL + 1.05, z + 0.11));
  };
  par(UP.x0, X1, BZ0 - 0.11);
  par(X0, DN.x0, BZ1 + 0.11);
  // as duas escadas: degraus de alvenaria com piso de pedra lavrada
  stairsX(kit, { z0: UP.z0, z1: UP.z1, xLow: UP.x1, xHigh: UP.x0, yHigh: BAL, n: 12 }); // (o dado rola pela rampa de dieFloor, como antes)
  stairs(kit, { x0: DN.x0, x1: DN.x1, zLow: DN.z1, zHigh: DN.z0, yHigh: BAL, n: 12 });
  // o patamar do canto (alvenaria com o piso do balcão) e o parapeito dele, virado para a entrada
  kit.box(UP.x0 - LX0, BAL, UP.z1 - UP.z0, [kit.stone, kit.stone, balFloor, kit.stone, kit.stone, kit.stone], (LX0 + UP.x0) / 2, BAL / 2, (UP.z0 + UP.z1) / 2);
  S.boxes.push(mkBox(LX0, 0, UP.z0, UP.x0, BAL, UP.z1));
  kit.box(UP.x0 - LX0, BAL + 0.92, 0.2, kit.stone, (LX0 + UP.x0) / 2, (BAL + 0.92) / 2, UP.z1 + 0.1);
  kit.box(UP.x0 - LX0 + 0.08, 0.1, 0.3, kit.slab, (LX0 + UP.x0) / 2, BAL + 0.97, UP.z1 + 0.1, false);
  S.boxes.push(mkBox(LX0, 0, UP.z1, UP.x0, BAL + 1.05, UP.z1 + 0.2));
  // a mureta do lado de fora de cada escada: acompanha a subida (um corrimão de pedra a ~0,95 m dos degraus)
  S.boxes.push(...slopedWall(kit, { x0: UP.x0, z0: UP.z1, x1: UP.x1, z1: UP.z1 + 0.18, top: (x) => upY(x) + 0.95, segs: 6 }));
  S.boxes.push(...slopedWall(kit, { x0: DN.x0 - 0.18, z0: DN.z1, x1: DN.x0, z1: DN.z0, top: (_x, z) => (BAL * (z - DN.z1)) / (DN.z0 - DN.z1) + 0.95, segs: 6 }));
  // pilastras onde a mureta encontra o balcão e o chão (arremates)
  for (const [px, pz, h] of [[UP.x1, UP.z1 + 0.09, 1.15], [UP.x0, UP.z1 + 0.09, BAL + 1.15], [DN.x0 - 0.09, DN.z1, 1.15], [DN.x0 - 0.09, DN.z0, BAL + 1.15]] as [number, number, number][]) {
    kit.box(0.3, h, 0.3, kit.stone, px, h / 2, pz, false);
    if (h < 2) kit.contact(px, pz, 0.8);
    kit.box(0.38, 0.1, 0.38, kit.slab, px, h + 0.05, pz, false);
    kit.rects.push([px - 0.17, pz - 0.17, px + 0.17, pz + 0.17, h + 0.1]);
    S.boxes.push(mkBox(px - 0.15, 0, pz - 0.15, px + 0.15, h + 0.1, pz + 0.15));
  }

  // ── o chão: 9 braseiros em grade, ligados por canaletas ──
  const GX = (c: number) => -0.6 + (c - 1) * 2.4;
  const GZ = (r: number) => -15.5 + (r - 1) * 2.4;
  const braz: Brazier[] = [];
  for (let i = 0; i < 9; i++) {
    const b = makeBrazier(kit, ctx, GX(i % 3), GZ(Math.floor(i / 3)), false);
    braz.push(b);
    S.boxes.push(...b.boxes);
  }
  const fEdges: GridEdge[] = FLOOR_EDGES.map(([a, b]) => ({ a, b, vis: makeFloorChannel(kit, GX(a % 3), GZ(Math.floor(a / 3)), GX(b % 3), GZ(Math.floor(b / 3)), 0.55) }));
  const floor = new FireGrid(
    braz.map((b) => ({ set: (on: boolean, q: boolean) => b.light(on, q), update: (_dt: number, t: number) => b.update(t) })),
    fEdges,
    0.6,
    () => ctx.sfx('spread'),
  );

  // ── a porta: «ACENDER DOIS» e o CINCO talhado grande em cima; dois soquetes contam as ignições ──
  const sign = kit.inscribe({ words: ['acender', 'n2'], x: -3.6, y: 1.7, z: Z0 + 0.025, nx: 0, nz: 1, size: 0.5, age: 0.25, seed: 9, lead: true });
  const five = kit.inscribe({ words: ['n5'], x: 0, y: 4.1, z: Z0 + 0.025, nx: 0, nz: 1, size: 0.95, age: 0.2, frame: true, seed: 13 });
  const sockMats: THREE.MeshBasicMaterial[] = [];
  for (const sx of [2.0, 2.6]) {
    kit.box(0.34, 0.34, 0.16, kit.stone, sx, 1.7, Z0 + 0.08, false);
    const m = new THREE.MeshBasicMaterial({ color: 0x2a1a14, fog: false });
    sockMats.push(m);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.09, 6), m);
    dot.position.set(sx, 1.7, Z0 + 0.165);
    kit.group.add(dot);
  }

  // ── as lousas do balcão ──
  const BY = BAL + 1.55;
  const L1 = makeWallBoard(kit, ctx, { x: X0 + 0.02, y: BY, z: -3.7, nx: 1, nz: 0, cells: [1, 4], edges: [[1, 4]], step: 0.42, key: 'fio1' });
  const L2 = makeWallBoard(kit, ctx, { x: X0 + 0.02, y: BY, z: -5.9, nx: 1, nz: 0, step: 0.42, edges: [[4, 0], [4, 8], [6, 4], [6, 7], [7, 8], [3, 0], [3, 1], [5, 2]], key: 'fio2' });
  const L3 = makeWallBoard(kit, ctx, { x: X1 - 0.02, y: BY, z: -5.3, nx: -1, nz: 0, step: 0.42, cells: [1, 6, 8], edges: [[1, 6], [6, 8], [8, 1]], key: 'fio3' });
  kit.inscribe({ words: ['acender', 'n1'], x: X0 + 0.025, y: BY + 1.0, z: -5.9, nx: 1, nz: 0, size: 0.34, age: 0.2, seed: 31 });
  const g2 = kit.inscribe({ words: ['n3'], x: X0 + 0.025, y: BY, z: -6.95, nx: 1, nz: 0, size: 0.36, age: 0.15, frame: true, seed: 33 });
  const g3 = kit.inscribe({ words: ['acender'], x: X1 - 0.025, y: BY, z: -4.25, nx: -1, nz: 0, size: 0.36, age: 0.15, frame: true, seed: 35 });
  const boards: { b: WallBoard; target: string | null; key: string; ins: ReturnType<typeof kit.inscribe> | null; used: boolean; done: boolean; stop: number }[] = [
    { b: L1, target: null, key: 'fio1', ins: null, used: false, done: false, stop: 0 },
    { b: L2, target: 'n3', key: 'fio2', ins: g2, used: false, done: false, stop: 0 },
    { b: L3, target: 'acender', key: 'fio3', ins: g3, used: false, done: false, stop: 0 },
  ];

  // ── a plaquinha do segredo (S10): «DIZER IGUAL ▢» · «ACENDER UM», com um soquete frio, no parapeito ──
  const PX = -5.0;
  const PZ = BZ1 + 0.36;
  kit.box(1.5, 0.95, 0.12, kit.stone, PX, BAL + 1.6, BZ1 + 0.28, false);
  kit.inscribe({ words: ['dizer', 'igual', null], x: PX, y: BAL + 1.82, z: BZ1 + 0.345, nx: 0, nz: 1, size: 0.26, age: 0.35, seed: 41 });
  kit.inscribe({ words: ['acender', 'n1'], x: PX, y: BAL + 1.38, z: BZ1 + 0.345, nx: 0, nz: 1, size: 0.22, age: 0.35, seed: 43 });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.11, 0.12, 6), lambert(null, 0x3a3a46));
  cup.position.set(PX + 1.0, BAL + 1.14, PZ - 0.2);
  kit.add(cup);
  // a plaquinha e o soquete ficavam soltos no ar, 10 cm e 6 cm acima da capa do parapeito: ganham um pé de pedra (eles não mudam de lugar; §67)
  kit.box(1.56, 0.11, 0.2, kit.slab, PX, BAL + 1.07, BZ1 + 0.3, false);
  kit.box(0.18, 0.07, 0.18, kit.slab, PX + 1.0, BAL + 1.055, PZ - 0.2, false);
  const sockFlame = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
  sockFlame.scale.set(0.3, 0.26, 1);
  sockFlame.position.set(PX + 1.0, BAL + 1.36, PZ - 0.2);
  sockFlame.visible = false;
  kit.group.add(sockFlame);
  const sockPos = new THREE.Vector3(PX + 1.0, BAL + 1.25, PZ - 0.2);
  let secretOn = false;
  let bonus = false;
  const niche = makeGemNiche(kit, ctx, -3.2, 1.25, BZ1, 0, -1, () => (bonus = true));

  // luz: tochas no balcão e embaixo
  kit.torch(X0 + 0.1, BAL + 1.6, -4.8, 1, 0, 0.4);
  kit.torch(X1 - 0.1, BAL + 1.6, -6.9, -1, 0, 1.2);
  kit.torch(X1 - 0.1, 1.8, 0.4, -1, 0, 2.2);
  kit.torch(X0 + 0.1, 1.8, -12.5, 1, 0, 3.1);
  kit.torch(X0 + 0.1, 1.8, -19.0, 1, 0, 3.7);
  kit.torch(X1 - 0.1, 1.8, -15.5, -1, 0, 4.4);
  kit.torch(-4.8, 1.8, Z0 + 0.1, 0, 1, 5.1);
  S.decorate();

  // ── a regra ──
  let used = 0; // ignições gastas
  let stopT = 0; // há quanto tempo o fogo parou de correr
  let failT = -1;
  let coldT = 0;
  let solved = false;
  let doorOpen = 0;
  let prevWant = 0;
  let readT = 0;
  const gate = shotGate(ctx.die);
  const allowed = () => (secretOn ? 1 : 2);

  const reset = () => {
    floor.clear();
    for (const b of boards) {
      b.b.grid.clear();
      b.used = b.done = false;
      b.stop = 0;
      if (b.ins) for (const p of b.ins.panels) p.fire = 0;
    }
    used = 0;
    stopT = 0;
    failT = -1;
    coldT = 0;
    solved = false;
    secretOn = false;
    sockFlame.visible = false;
    doorOpen = 0;
    prevWant = 0;
    readT = 0;
    niche.reset();
    S.door.setOpen(0);
    S.door.lampMats.forEach((m) => m.color.setHex(LAMP_OFF));
    for (const p of [...sign.panels, ...five.panels]) p.fire = 0;
  };

  if (import.meta.env.DEV) {
    ((globalThis as Record<string, unknown>).__fio = () => ({ lit: floor.points(), burnt: [...floor.burnt], used, solved, cold: +coldT.toFixed(1), secret: secretOn, boards: boards.map((b) => [b.b.grid.points(), [...b.b.grid.burnt], b.done]), bowls: braz.map((b) => b.bowl.toArray()), cells: (k: number) => [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => boards[k].b.cellPos(i).toArray().map((v) => +v.toFixed(2))), sock: sockPos.toArray() }));
  }
  kit.bake();

  return {
    name: 'O Fio de Fogo',
    subtitle: 'O fogo não fica onde eu o ponho.',
    group: kit.group,
    surfaces: kit.surfaces,
    emitters: kit.emitters,
    inscriptions: kit.inscriptions,
    interactables: [niche.interactable],
    doorZ: Z0,
    entranceZ: Z1,
    start: new THREE.Vector3(0, 0, 1.2),
    startYaw: 0,
    fog: { color: '#0a0a11', near: 5, far: 30 },
    ambient: { color: 0x7a78b8, intensity: 1.8 },
    boxes: [...S.boxes, ...kit.boxes],
    sockets: braz.map((b) => b.socket),
    rects() {
      const r: Rect[] = S.rects(doorOpen);
      r.push(...braz.map((b) => b.rect));
      // murinho da escada que sobe, em pedaços que acompanham a subida (embaixo não se entra pelo lado; em cima não se cai), e o parapeito do patamar
      for (let k = 0; k < 8; k++) {
        const xa = UP.x0 + ((UP.x1 - UP.x0) * k) / 8;
        const xb = UP.x0 + ((UP.x1 - UP.x0) * (k + 1)) / 8;
        r.push([xa, UP.z1, xb, UP.z1 + 0.18, upY(xa) + 0.95]);
      }
      r.push([LX0 - 1, UP.z1, UP.x0, UP.z1 + 0.2, BAL + 1.2]);
      r.push([UP.x0, BZ0 - 0.22, X1 + 1, BZ0, BAL + 1.2]); // frente do balcão (embaixo: a parede; em cima: o parapeito)
      r.push([X0 - 1, BZ1, DN.x0, BZ1 + 0.22, BAL + 1.2]); // fundo do balcão (o parapeito sobre o chão)
      r.push([DN.x0 - 0.16, DN.z1, DN.x0, DN.z0, BAL + 1.2]); // murinho da escada que desce
      return r;
    },
    clampDie: S.clampDie,
    groundY: levelY,
    surfaceAt: (x, z) => kit.surfaceAt(x, z),
    dieFloor: (x, z) => (stairY(x, z) >= 0 ? stairY(x, z) : 0),
    holdsDie: () => false,
    update(dt, t) {
      kit.tick(dt, t);
      gate.tick();
      niche.update(dt, t);
      // lousas do balcão: uma ignição cada; quando o fogo para, ou escreveu o glifo (fica acesa) ou se apaga em 3 s
      for (const b of boards) {
        b.b.update(dt, t);
        if (b.done) continue;
        const i = b.b.hit();
        if (i >= 0 && gate.take()) {
          if (!b.used && !b.b.grid.lit[i]) {
            b.used = true;
            b.b.grid.ignite(i);
            ctx.sfx('ignite', b.key);
          } else ctx.sfx('error');
        }
        if (b.used && !b.b.grid.running()) {
          b.stop += dt;
          if (b.target && b.b.grid.writes(b.target)) {
            b.done = true;
            ctx.sfx('piece');
          } else if (b.stop > (b.target ? 3 : 4)) {
            b.b.grid.clear();
            b.used = false;
            b.stop = 0;
          }
        } else b.stop = 0;
        if (b.ins) for (const p of b.ins.panels) p.fire = (p.fire ?? 0) + ((b.done ? 1 : 0) - (p.fire ?? 0)) * Math.min(1, dt * 4);
      }
      // o soquete frio da plaquinha: o dado de Fogo o acende (modo do segredo: UMA ignição, a Casa espera FAZER)
      if (!secretOn && !solved && ctx.die.face === 3 && (ctx.die.state === 'flying' || ctx.die.state === 'rest') && ctx.die.pos.distanceTo(sockPos) < 0.5) {
        secretOn = true;
        sockFlame.visible = true;
        ctx.sfx('ignite', 'fioS');
        if (used) {
          floor.clear();
          used = 0;
        }
      }
      if (sockFlame.visible) sockFlame.material.map = kit.frame(t * 8);

      // ── o chão ──
      floor.update(dt, t);
      if (failT >= 0) {
        failT -= dt;
        if (failT < 0) {
          floor.clear(false);
          used = 0;
          coldT = 4;
          if (secretOn) {
            secretOn = false;
            sockFlame.visible = false;
          }
        }
      } else if (coldT > 0) {
        coldT -= ctx.paused() ? 0 : dt;
        if (braz.some((b) => b.touched()) && gate.take()) ctx.sfx('error');
      } else if (!solved) {
        braz.forEach((b, i) => {
          if (!b.touched() || !gate.take()) return;
          if (used >= allowed()) {
            ctx.sfx('error'); // as ignições acabaram: espere a Casa ler
            return;
          }
          used++;
          floor.ignite(i);
          ctx.sfx('ignite', 'fio');
        });
        if (used > 0 && !floor.running()) {
          stopT += ctx.paused() ? 0 : dt;
          const target = secretOn ? 'fazer' : 'n5';
          if (stopT > 2 && floor.writes(target)) {
            if (secretOn) {
              secretOn = false;
              sockFlame.visible = false;
              niche.open();
              ctx.sfx('piece');
              ctx.caption('Algo se abriu sob o balcão', 'Dizer é fazer.', '#7ad8ff');
              used = 0;
              stopT = 0;
              floor.clear();
            } else {
              solved = true;
              ctx.sfx('piece');
              S.door.lampMats.forEach((m) => m.color.setHex(0xff7a2e));
            }
          } else if (stopT > 2 && used >= allowed()) {
            // não escreveu o glifo: em 3 s a Casa apaga tudo, e os braseiros ficam frios
            failT = 3;
            stopT = 0;
            ctx.sfx('error');
          }
        } else stopT = 0;
      }
      sockMats.forEach((m, k) => m.color.setHex(k < used || solved ? 0xffb048 : 0x2a1a14));
      if (!solved) S.door.lampMats.forEach((m, k) => m.color.setHex(k < used ? 0x7a4a2a : LAMP_OFF));
      // a frase: ACENDER brilha com fogo no chão, o DOIS enche com as ignições; ao abrir, a Casa lê e o CINCO acende
      readT = solved ? readT + dt : 0;
      const anyLit = floor.points().length > 0;
      sign.panels.forEach((p, k) => {
        const on = solved ? (readT > 0.2 + k * 0.45 ? 1 : 0) : p.id === 'acender' ? (anyLit ? 0.7 : 0) : p.id === 'n2' ? used / 2 : 0;
        p.fire = (p.fire ?? 0) + (on - (p.fire ?? 0)) * Math.min(1, dt * 6);
      });
      for (const p of five.panels) p.fire = (p.fire ?? 0) + ((solved && readT > 1.1 ? 1 : 0) - (p.fire ?? 0)) * Math.min(1, dt * 3);
      const want = solved && readT > 1.4 ? 1 : 0;
      if (want && !prevWant) ctx.sfx('door');
      prevWant = want;
      doorOpen += (want - doorOpen) * Math.min(1, dt * 2.4);
      S.door.setOpen(doorOpen);
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
