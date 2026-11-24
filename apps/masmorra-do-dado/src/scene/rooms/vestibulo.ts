// O Vestíbulo dos Números: três salas pequenas e ruinosas que ensinam ACENDER, UM, DOIS e TRÊS
// sem uma palavra de explicação (ver DESIGN.md §9 e PUZZLES.md). Só o Fogo está liberado.
//   1 · O Poço       ACENDER · UM · BRASEIRO     um braseiro → a porta abre
//   2 · O Vestíbulo  ACENDER · DOIS · BRASEIRO   três braseiros; só abre com EXATAMENTE dois acesos
//   3 · A Lacuna     ACENDER · ▢ · BRASEIRO      três já acesos; escreva o número no giz

import * as THREE from 'three';
import { floorTexture, brickTexture } from '../textures';
import { ARCH_TOP, buildDoor, buildEntrance, Kit, lambert, LAMP_OFF, T } from '../kit';
import { makeBrazier, type Brazier } from '../brazier';
import type { Box, Ctx, Room } from '../types';

const X0 = -4;
const X1 = 4;
const Z0 = -10;
const Z1 = 2;
const H = 3.4;
const SHAFT = { x: 0, z: -4.4, r: 0.95 };
const mkBox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box => ({
  min: new THREE.Vector3(x0, y0, z0),
  max: new THREE.Vector3(x1, y1, z1),
});

// onde ficam os braseiros em cada sala
const BRAZIERS: Record<1 | 2 | 3, [number, number][]> = {
  1: [[2.9, -8.9]],
  2: [[-3.1, -7.4], [3.1, -7.4], [3.1, -3.2]],
  3: [[-3.1, -4.6], [3.1, -4.6], [2.9, -8.9]],
};

const NAMES = {
  1: { name: 'Sala 1 · O Poço', subtitle: 'Alguém escreveu na parede. Um braseiro espera.' },
  2: { name: 'Sala 2 · O Vestíbulo', subtitle: 'Mais braseiros. A escrita mudou um pouco.' },
  3: { name: 'Sala 3 · A Lacuna', subtitle: 'Falta uma palavra na frase.' },
} as const;

export function buildVestibulo(ctx: Ctx, v: 1 | 2 | 3): Room {
  const kit = new Kit('ruin');
  const W = X1 - X0;
  const L = Z1 - Z0;
  const zm = (Z0 + Z1) / 2;

  kit.plane(W, L, lambert(floorTexture([W / T, L / T], 'ruin')), 0, 0, zm, -Math.PI / 2);
  // teto (o primeiro tem o poço)
  if (v === 1) {
    const shape = new THREE.Shape();
    shape.moveTo(X0, Z0 - zm);
    shape.lineTo(X1, Z0 - zm);
    shape.lineTo(X1, Z1 - zm);
    shape.lineTo(X0, Z1 - zm);
    shape.closePath();
    const hole = new THREE.Path();
    hole.absarc(SHAFT.x, SHAFT.z - zm, SHAFT.r, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const ceil = new THREE.Mesh(new THREE.ShapeGeometry(shape, 24), lambert(brickTexture([1 / T, 1 / T], 0.6, 17, 'ruin')));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, H, zm);
    kit.add(ceil);
    // o poço sobe até uma luz distante
    const shaftH = 16;
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(SHAFT.r, SHAFT.r, shaftH, 20, 1, true),
      lambert(brickTexture([6, shaftH / T], 0.75, 41, 'ruin')),
    );
    (tube.material as THREE.MeshLambertMaterial).side = THREE.BackSide;
    tube.position.set(SHAFT.x, H + shaftH / 2, SHAFT.z);
    kit.group.add(tube);
    const sky = new THREE.Mesh(new THREE.CircleGeometry(SHAFT.r * 1.2, 20), new THREE.MeshBasicMaterial({ color: 0xfff3d2, fog: false }));
    sky.rotation.x = Math.PI / 2;
    sky.position.set(SHAFT.x, H + shaftH, SHAFT.z);
    kit.group.add(sky);
    // coluna de luz (translúcida) e mancha de luz no chão
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(SHAFT.r * 0.95, SHAFT.r * 1.3, H, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xdfe8ff, transparent: true, opacity: 0.055, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }),
    );
    beam.position.set(SHAFT.x, H / 2, SHAFT.z);
    kit.group.add(beam);
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(1.6, 24),
      new THREE.MeshBasicMaterial({ color: 0xcfd8f0, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(SHAFT.x, 0.02, SHAFT.z);
    kit.group.add(pool);
    kit.light(SHAFT.x, H - 0.3, SHAFT.z, 0xcfdcff, 70);
  } else {
    kit.plane(W, L, kit.brick([W / T, L / T], 0.65, 17 + v), 0, H, zm, Math.PI / 2);
  }
  if (v === 1) kit.plane(W, H, kit.brick([W / T, H / T], 1, 23), 0, H / 2, Z1, 0, Math.PI);
  const entrance = v > 1 ? buildEntrance(kit, { x0: X0, x1: X1, z: Z1, h: H }) : null;
  kit.plane(L, H, kit.brick([L / T, H / T], 0.95, 31 + v), X0, H / 2, zm, 0, Math.PI / 2);
  kit.plane(L, H, kit.brick([L / T, H / T], 0.95, 37 + v), X1, H / 2, zm, 0, -Math.PI / 2);

  const door = buildDoor(kit, { x0: X0, x1: X1, z0: Z0, h: H, lamps: 1, connected: true });

  // a frase, talhada na parede à esquerda da porta (envelhecida)
  const words: (string | null)[] = v === 1 ? ['acender', 'n1', 'brasa'] : v === 2 ? ['acender', 'n2', 'brasa'] : ['acender', null, 'brasa'];
  const ins = kit.inscribe({ words, x: -2.62, y: 1.6, z: Z0 + 0.025, nx: 0, nz: 1, size: 0.5, age: 0.4 - v * 0.05, seed: 3 + v * 11 });

  // braseiros
  const braziers: Brazier[] = BRAZIERS[v].map(([x, z]) => makeBrazier(kit, ctx, x, z, v === 3));

  // ── sala 1: entulho embaixo do poço e a laje onde o personagem caiu ──
  if (v === 1) {
    const rubble = kit.stone;
    const rocks: [number, number, number, number][] = [
      [-0.9, -3.4, 0.34, 0.3],
      [0.7, -5.2, 0.28, 1.1],
      [1.2, -3.8, 0.2, 2.0],
      [-0.4, -5.0, 0.16, 0.4],
      [-1.5, -4.9, 0.22, 2.4],
    ];
    for (const [x, z, s, rot] of rocks) {
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rubble);
      m.position.set(x, s * 0.7, z);
      m.rotation.set(rot, rot * 1.7, 0);
      kit.group.add(m);
    }
    kit.crate(-3.3, -2.0, 0.7, 0.5); // restos de caixa
    kit.web(X0, H - 0.45, Z1 - 0.45, 1, 0);
    kit.web(X1, H - 0.45, Z1 - 0.45, -1, 0, true);
  }
  // rachaduras e umidade: a Casa está velha
  kit.damp(X0, 1.0, -3.6 - v, 1, 0, 1.9);
  kit.damp(X1, 2.2, -6.2, -1, 0, 1.5);
  kit.skirting(X0, X1, Z0, Z1, 1.3);
  kit.aoSides(X0, X1, Z0, Z1, H);
  kit.cornice(X0, X1, Z0, Z1, H);
  kit.pilaster(X0, -4.5, 1, 0, H);
  kit.pilaster(X1, -4.5, -1, 0, H);
  if (v >= 2) {
    kit.torch(X0 + 0.1, 1.8, -1.2, 1, 0, 0.7);
    kit.torch(X1 - 0.1, 1.8, -1.2, -1, 0, 2.4);
  }
  if (v === 3) kit.torch(-1.95, 1.8, Z0 + 0.1, 0, 1, 4.1);
  kit.dust(X0, X1, Z0, Z1, 0, H);

  // lacuna: pontos do giz
  const gapMesh = ins.gap;
  const gapCenter = new THREE.Vector3();
  let gapHalf = 0.23;
  if (gapMesh) {
    gapCenter.copy(gapMesh.position);
    // o miolo liso da placa (sem a moldura): CELL / (CELL + 2·PAD) da largura
    gapHalf = (gapMesh.geometry as THREE.PlaneGeometry).parameters.width * (96 / 124) * 0.5;
  }
  // ao dividir a lacuna em 3×3, o 3 (três pontos na diagonal) ocupa as casas 0, 4 e 8
  const gapReads = () => {
    if (!gapMesh) return false;
    const cnt = new Array(9).fill(0);
    for (const d of ctx.chalk.dotsOn(gapMesh)) {
      const u = (d.x - gapCenter.x) / gapHalf; // a parede olha +z: a direita do leitor é +x
      const w = (d.y - gapCenter.y) / gapHalf;
      if (Math.abs(u) > 1.05 || Math.abs(w) > 1.05) continue;
      const col = u < -1 / 3 ? 0 : u > 1 / 3 ? 2 : 1;
      const row = w > 1 / 3 ? 0 : w < -1 / 3 ? 2 : 1;
      cnt[row * 3 + col]++;
    }
    const on = (i: number) => cnt[i] >= 2;
    return on(0) && on(4) && on(8) && !on(2) && !on(6) && cnt[1] < 7 && cnt[3] < 7 && cnt[5] < 7 && cnt[7] < 7;
  };

  // sólidos pro dado
  const boxes: Box[] = [];
  braziers.forEach((b) => boxes.push(...b.boxes));
  boxes.push(mkBox(-1.25, 0, -10, -0.95, ARCH_TOP, -9.7));
  boxes.push(mkBox(0.95, 0, -10, 1.25, ARCH_TOP, -9.7));
  boxes.push(mkBox(-1.25, ARCH_TOP - 0.3, -10, 1.25, H, -9.7));

  let doorOpen = 0;
  let prevWant = 0;
  let solved = false;
  let evalT = 0;
  let lastRev = -1;
  let overlit = 0; // v2: tempo com três acesas
  let marked = false;

  kit.bake();

  return {
    name: NAMES[v].name,
    subtitle: NAMES[v].subtitle,
    group: kit.group,
    surfaces: kit.surfaces,
    emitters: kit.emitters,
    inscriptions: kit.inscriptions,
    shaft: v === 1 ? new THREE.Vector3(SHAFT.x, H + 8, SHAFT.z) : undefined,
    doorZ: Z0,
    entranceZ: Z1,
    start: v === 1 ? new THREE.Vector3(0.7, 0, -1.9) : new THREE.Vector3(0, 0, 1.2),
    startYaw: 0,
    fog: v === 1 ? { color: '#090a11', near: 3, far: 15 } : { color: '#0a0a11', near: 3.5, far: 17 },
    ambient: v === 1 ? { color: 0x6a72a4, intensity: 1.45 } : { color: 0x706ea8, intensity: 1.6 },
    boxes: [...boxes, ...kit.boxes],
    sockets: braziers.map((b) => b.socket),
    rects() {
      const r: ReturnType<Room['rects']> = braziers.map((b) => b.rect);
      r.push(...kit.rects);
      r.push([X0 - 2, Z0, X0, Z1 + 0.5], [X1, Z0, X1 + 2, Z1 + 0.5]);
      if (v === 1) r.push([X0 - 2, Z1, X1 + 2, Z1 + 0.5]);
      else r.push(...(entrance?.rects() ?? []));
      r.push(...door.rects(doorOpen > 0.85));
      return r;
    },
    clampDie(p, vel, e, R) {
      if (p.y > H - R) {
        p.y = H - R;
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
    groundY: () => 0,
    surfaceAt: (x, z) => kit.surfaceAt(x, z),
    dieFloor: () => 0,
    holdsDie: () => false,
    update(dt, t) {
      kit.tick(dt, t);
      // acender
      for (const b of braziers) {
        if (v !== 3 && b.touched()) {
          b.light(true);
          if (v === 1) ctx.milestone('fogo');
        }
        b.update(t);
      }
      const nLit = braziers.filter((b) => b.lit).length;
      let want = 0;
      if (v === 1) want = nLit >= 1 ? 1 : 0;
      else if (v === 2) {
        want = nLit === 2 ? 1 : 0;
        // três é demais: a Casa apaga tudo (o número tem que ser exato)
        if (nLit >= 3) {
          overlit += dt;
          if (overlit > 1.6) {
            braziers.forEach((b) => b.light(false));
            overlit = 0;
          }
        } else overlit = 0;
      } else {
        evalT -= dt;
        if (!solved && evalT <= 0 && ctx.chalk.revision !== lastRev) {
          evalT = 0.25;
          lastRev = ctx.chalk.revision;
          if (gapReads()) {
            solved = true;
            ctx.sfx('piece');
          }
        }
        want = solved ? 1 : 0;
      }
      if (want && !prevWant) {
        ctx.sfx('door');
        if (!marked) {
          marked = true;
          ctx.milestone(v === 1 ? 'fogo' : v === 2 ? 'dois' : 'tres');
        }
      } else if (!want && prevWant && doorOpen > 0.15) ctx.sfx('doorClose');
      prevWant = want;
      doorOpen += (want - doorOpen) * Math.min(1, dt * 2.4);
      door.setOpen(doorOpen);
      door.lampMats[0].color.setHex(want ? 0xff7a2e : LAMP_OFF);
    },
    reset() {
      braziers.forEach((b) => b.light(v === 3, true));
      doorOpen = 0;
      prevWant = 0;
      solved = false;
      overlit = 0;
      door.setOpen(0);
    },
    dispose() {},
  };
}
