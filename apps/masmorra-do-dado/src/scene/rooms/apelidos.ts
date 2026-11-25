// SALA · OS APELIDOS (nível 6; PUZZLES_PROPOSTAS.md §5, verificador tools/verify_apelidos.mjs), em forma de ROTUNDA.
// O mesmo braseiro pode ser chamado pelo NÚMERO ou pelo TAMANHO. O GRANDE fica no centro (sem número) e os outros quatro em volta, em cruz:
// não há começo óbvio de leitura. Vistos da entrada: UM à esquerda, DOIS ao fundo, TRÊS à direita, QUATRO (o PEQUENO) à frente, junto da entrada.
// As três frases ficam em placas, em três pontos da parede curva; a frase da porta, sobre a porta.
// Armadilha: o glifo GRANDE é a moldura de qualidade com os quatro cantos (parece QUATRO) e o PEQUENO, com o ponto do meio (parece UM).
// Quem lê pelo desenho cai em contradição. A moldura muda o sentido.
// Solução: TRÊS, GRANDE, QUATRO, DOIS, UM (errar: tudo se apaga e os braseiros ficam frios por 10 s).

import * as THREE from 'three';
import { buildDoor, buildEntrance, Kit, lambert, LAMP_OFF, T } from '../kit';
import { floorTexture } from '../textures';
import { makeBrazier } from '../brazier';
import { mkBox } from './shell';
import type { Box, Ctx, Rect, Room } from '../types';

const R = 6.2;
const HALF = 1.75; // meia-largura das paredes retas (entrada e porta)
const ZH = Math.sqrt(R * R - HALF * HALF); // a entrada fica em z = +ZH e a porta em z = -ZH (o centro da rotunda é a origem)
const H = 5;
const D = 3.4; // distância dos quatro de fora ao centro
// [x, z, marca, escala]: a ordem dos índices é a do verificador (UM, DOIS, TRÊS, QUATRO, GRANDE)
const BRAZ: [number, number, string, number][] = [
  [-D, 0, 'n1', 1],
  [0, -D, 'n2', 1],
  [D, 0, 'n3', 1],
  [0, D, 'n4', 0.6], // o PEQUENO (o maior número é o menor braseiro)
  [0, 0, 'grande', 1.5], // o GRANDE, sem número
];
const SEQ = [2, 4, 3, 1, 0]; // TRÊS, GRANDE, QUATRO, DOIS, UM
const PENALTY = 10;
const SMALL = 3;
const BIG = 4;

export function buildApelidos(ctx: Ctx): Room {
  const kit = new Kit('ember');
  const boxes: Box[] = [];

  // paredes curvas (com um vão na frente e outro no fundo, onde entram as paredes retas)
  const gap = 2 * Math.asin(HALF / R);
  const arc = Math.PI - gap;
  const wallMat = new THREE.MeshLambertMaterial({ map: kit.brick([(R * arc) / T, H / T], 1, 77).map, side: THREE.BackSide });
  for (const start of [gap / 2, Math.PI + gap / 2]) {
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 32, 1, true, start, arc), wallMat);
    wall.position.y = H / 2;
    kit.add(wall);
  }
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R, 56), lambert(floorTexture([(2 * R) / T, (2 * R) / T], 'ember')));
  floor.rotation.x = -Math.PI / 2;
  kit.add(floor);
  const ceil = new THREE.Mesh(new THREE.CircleGeometry(R, 56), kit.brick([(2 * R) / T, (2 * R) / T], 0.7, 78));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = H;
  kit.add(ceil);
  const door = buildDoor(kit, { x0: -HALF, x1: HALF, z0: -ZH, h: H, lamps: 5, connected: true });
  const entrance = buildEntrance(kit, { x0: -HALF, x1: HALF, z: ZH, h: H });
  // um anel de pedra clara no chão, em volta do GRANDE, e quatro raios até os outros (só enfeite: a cruz não diz a ordem)
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.7, 40), new THREE.MeshLambertMaterial({ color: 0x8a7a6a, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -3 }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.006;
  kit.group.add(ring);

  // ── os cinco braseiros, cada um com a marca no pedestal (virada para quem entra) ──
  const braz = BRAZ.map(([x, z, , sc]) => makeBrazier(kit, ctx, x, z, false, sc));
  for (const b of braz) boxes.push(...b.boxes);
  const labels = BRAZ.map(([x, z, mark, sc], i) => kit.inscribe({ words: [mark], x, y: 0.45 * sc, z: z + 0.305 * sc, nx: 0, nz: 1, size: 0.5 * Math.min(1, sc), age: 0.12, frame: true, seed: 21 + i * 7 }));

  // ── a frase da porta, sobre o arco: «ACENDER GRANDE ANTES PEQUENO CONFIRMADO» ──
  const sign = kit.inscribe({ words: ['acender', 'grande', 'antes', 'pequeno', 'conf'], x: 0, y: 3.55, z: -ZH + 0.025, nx: 0, nz: 1, size: 0.4, age: 0.3, seed: 9, lead: true });

  // ── as três frases, em placas de pedra em três pontos da parede curva ──
  const plaque = (dx: number, dz: number, words: string[], seed: number) => {
    const l = Math.hypot(dx, dz);
    const ux = dx / l;
    const uz = dz / l;
    const cx = ux * (R - 0.32);
    const cz = uz * (R - 0.32);
    const yaw = Math.atan2(-ux, -uz); // a face da placa olha para o centro
    const slab = new THREE.Mesh(new THREE.BoxGeometry(2.85, 1.05, 0.22), kit.stone);
    slab.position.set(cx, 1.9, cz);
    slab.rotation.y = yaw;
    kit.add(slab);
    kit.inscribe({ words, x: cx - ux * 0.115, y: 1.9, z: cz - uz * 0.115, nx: -ux, nz: -uz, size: 0.42, age: 0.25, seed, lead: true, plaque: true });
    kit.torch(ux * (R - 0.14), 3.3, uz * (R - 0.14), -ux, -uz, seed * 0.31, 0xffb070, 36); // uma tocha em cima de cada placa
  };
  plaque(-0.94, -0.34, ['n1', 'depois', 'n2', 'conf'], 31); // «UM DEPOIS DOIS»
  plaque(0.94, -0.34, ['pequeno', 'antes', 'n2', 'conf'], 33); // «PEQUENO ANTES DOIS»
  plaque(-0.55, 0.835, ['grande', 'depois', 'n3', 'conf'], 35); // «GRANDE DEPOIS TRÊS»
  kit.torch(0.55 * (R - 0.14), 2.2, 0.835 * (R - 0.14), -0.55, -0.835, 2.9, 0xffb070, 34);
  kit.aoRing(R, H);

  // ── a regra: ordem exata, sem pistas ──
  let progress = 0;
  let failT = -1;
  let coldT = 0;
  let coldBeep = 0;
  let solved = false;
  let readT = 0;
  let doorOpen = 0;
  let prevWant = 0;
  const reset = () => {
    braz.forEach((b) => b.light(false, true));
    progress = 0;
    failT = -1;
    coldT = 0;
    solved = false;
    readT = 0;
    doorOpen = 0;
    prevWant = 0;
    door.setOpen(0);
    door.lampMats.forEach((m) => m.color.setHex(LAMP_OFF));
    for (const p of sign.panels) p.fire = 0;
  };
  if (import.meta.env.DEV) {
    ((globalThis as Record<string, unknown>).__apelidos = () => ({ lit: braz.map((b) => b.lit), progress, solved, cold: +coldT.toFixed(1), bowls: braz.map((b) => b.bowl.toArray()) }));
  }
  kit.bake();

  const PR = 0.75; // quem anda fica um pouco longe da parede curva (as placas saem dela)
  return {
    name: 'Os Apelidos',
    subtitle: 'Cinco braseiros. Um deles não tem número.',
    group: kit.group,
    surfaces: kit.surfaces,
    emitters: kit.emitters,
    inscriptions: kit.inscriptions,
    doorZ: -ZH,
    entranceZ: ZH,
    start: new THREE.Vector3(0, 0, ZH - 0.8),
    startYaw: 0,
    fog: { color: '#0b0a10', near: 5, far: 26 },
    ambient: { color: 0x8a78a8, intensity: 1.95 },
    boxes: [...boxes, mkBox(-1.25, 0, -ZH, -0.95, 2.65, -ZH + 0.3), mkBox(0.95, 0, -ZH, 1.25, 2.65, -ZH + 0.3)],
    sockets: braz.map((b) => b.socket),
    rects() {
      const r: Rect[] = [...entrance.rects(), ...door.rects(doorOpen > 0.85), ...braz.map((b) => b.rect)];
      return r;
    },
    clampPlayer(pos) {
      if (pos.z > -ZH - 0.01 && pos.z < ZH + 0.01) {
        const d = Math.hypot(pos.x, pos.z);
        // perto das paredes retas (entrada e porta) vale a parede reta; no resto, o círculo
        const max = Math.abs(pos.x) < HALF - 0.4 && Math.abs(pos.z) > ZH - 1.2 ? R : R - PR;
        if (d > max) {
          pos.x *= max / d;
          pos.z *= max / d;
        }
      }
    },
    clampDie(p, v, e, Rd) {
      if (p.y > H - Rd) {
        p.y = H - Rd;
        if (v.y > 0) v.y = -v.y * e;
      }
      const d = Math.hypot(p.x, p.z);
      const max = R - Rd;
      if (d > max) {
        const nx = p.x / d;
        const nz = p.z / d;
        p.x = nx * max;
        p.z = nz * max;
        const vn = v.x * nx + v.z * nz;
        if (vn > 0) {
          v.x -= (1 + e) * vn * nx;
          v.z -= (1 + e) * vn * nz;
        }
      }
      if (p.z < -ZH + Rd + 0.03) {
        p.z = -ZH + Rd + 0.03;
        if (v.z < 0) v.z = -v.z * e;
      } else if (p.z > ZH - Rd) {
        p.z = ZH - Rd;
        if (v.z > 0) v.z = -v.z * e;
      }
    },
    groundY: () => 0,
    surfaceAt: (x, z) => kit.surfaceAt(x, z),
    dieFloor: () => 0,
    holdsDie: () => false,
    update(dt, t) {
      kit.tick(dt, t);
      for (const b of braz) b.update(t);
      if (failT >= 0) {
        // um braseiro fora de ordem: ele queima um instante e a Casa apaga todos
        failT -= dt;
        if (failT < 0) {
          braz.forEach((b) => b.light(false));
          progress = 0;
          coldT = PENALTY;
        }
      } else if (coldT > 0) {
        coldT -= ctx.paused() ? 0 : dt;
        coldBeep -= dt;
        if (coldBeep <= 0 && braz.some((b) => b.touched())) {
          ctx.sfx('error');
          coldBeep = 0.9;
        }
      } else if (!solved) {
        braz.forEach((b, i) => {
          if (!b.touched()) return;
          b.light(true);
          if (i === SEQ[progress]) {
            progress++;
            if (progress >= SEQ.length) {
              solved = true;
              door.lampMats.forEach((m) => m.color.setHex(0xff7a2e));
              ctx.sfx('piece');
            }
          } else failT = 1.3;
        });
      }
      // os glifos reagem: ACENDER com fogo na sala; GRANDE e PEQUENO, com o braseiro de cada um; ao abrir, a Casa lê a frase inteira
      readT = solved ? readT + dt : 0;
      const any = braz.some((b) => b.lit);
      sign.panels.forEach((p, k) => {
        const on = solved ? (readT > 0.2 + k * 0.4 ? 1 : 0) : p.id === 'acender' ? (any ? 0.7 : 0) : p.id === 'grande' ? (braz[BIG].lit ? 1 : 0) : p.id === 'pequeno' ? (braz[SMALL].lit ? 1 : 0) : 0;
        p.fire = (p.fire ?? 0) + (on - (p.fire ?? 0)) * Math.min(1, dt * 6);
      });
      labels.forEach((l, i) => {
        for (const p of l.panels) p.fire = (p.fire ?? 0) + ((braz[i].lit ? 1 : 0) - (p.fire ?? 0)) * Math.min(1, dt * 6);
      });
      const want = solved && readT > 2.3 ? 1 : 0;
      if (want && !prevWant) ctx.sfx('door');
      prevWant = want;
      doorOpen += (want - doorOpen) * Math.min(1, dt * 2.4);
      door.setOpen(doorOpen);
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
    dispose() {},
  };
}
