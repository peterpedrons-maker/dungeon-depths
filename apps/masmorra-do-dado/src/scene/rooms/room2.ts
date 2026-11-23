// Sala 2 — O Selo. Puzzle do giz: três fragmentos do selo estão gravados em paredes
// diferentes (um deles só aparece à luz do fogo). Cada fragmento mostra uma peça e a
// casa da grade 3x3 onde ela fica. O jogador reproduz as peças na lousa, desenhando
// com a pedra-sabão. Cada peça certa acende uma gema sobre a porta.

import * as THREE from 'three';
import {
  fragmentTexture,
  floorTexture,
  SEAL_CELL,
  SEAL_PIECES,
  sealPoints,
  slateTexture,
} from '../textures';
import { ARCH_TOP, buildDoor, buildEntrance, Kit, lambert, LAMP_OFF, T } from '../kit';
import type { Box, Ctx, Room } from '../types';

const X0 = -5;
const X1 = 5;
const Z0 = -14;
const Z1 = 2;
const H = 3.6;
const PILLARS: [number, number][] = [
  [-2.8, -3.5],
  [2.8, -3.5],
  [-2.8, -8.5],
  [2.8, -8.5],
];
const mkBox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box => ({
  min: new THREE.Vector3(x0, y0, z0),
  max: new THREE.Vector3(x1, y1, z1),
});

export function buildRoom2(ctx: Ctx): Room {
  const kit = new Kit('moss');
  const W = X1 - X0;
  const L = Z1 - Z0;
  const zm = (Z0 + Z1) / 2;

  kit.plane(W, L, lambert(floorTexture([W / T, L / T], 'moss')), 0, 0, zm, -Math.PI / 2);
  kit.plane(W, L, kit.brick([W / T, L / T], 0.75, 19), 0, H, zm, Math.PI / 2);
  const entrance = buildEntrance(kit, { x0: X0, x1: X1, z: Z1, h: H });
  kit.plane(L, H, kit.brick([L / T, H / T], 1, 33), X0, H / 2, zm, 0, Math.PI / 2);
  kit.plane(L, H, kit.brick([L / T, H / T], 1, 39), X1, H / 2, zm, 0, -Math.PI / 2);

  for (const [x, z] of PILLARS) {
    kit.box(0.9, H, 0.9, kit.brick([0.75, 3], 0.95, 50 + Math.abs(x * z)), x, H / 2, z);
    kit.box(1.1, 0.25, 1.1, kit.stone, x, 0.125, z);
    kit.box(1.1, 0.25, 1.1, kit.stone, x, H - 0.125, z);
  }

  const door = buildDoor(kit, { x0: X0, x1: X1, z0: Z0, h: H, lamps: 3, connected: true });

  // lousa à direita da porta
  const SLATE = new THREE.Vector3(3.4, 1.7, Z0 + 0.03);
  const slateMat = lambert(slateTexture(), 0xd0d0d8);
  slateMat.polygonOffset = true;
  slateMat.polygonOffsetFactor = -2;
  slateMat.polygonOffsetUnits = -4;
  const slate = kit.plane(2.4, 2.4, slateMat, SLATE.x, SLATE.y, SLATE.z);
  const fr = 0.14;
  kit.box(2.4 + fr * 2, fr, 0.16, kit.stone, SLATE.x, SLATE.y + 1.2 + fr / 2, Z0 + 0.08);
  kit.box(2.4 + fr * 2, fr, 0.16, kit.stone, SLATE.x, SLATE.y - 1.2 - fr / 2, Z0 + 0.08);
  kit.box(fr, 2.4, 0.16, kit.stone, SLATE.x - 1.2 - fr / 2, SLATE.y, Z0 + 0.08);
  kit.box(fr, 2.4, 0.16, kit.stone, SLATE.x + 1.2 + fr / 2, SLATE.y, Z0 + 0.08);

  // fragmentos gravados nas paredes
  const fragSpots: { x: number; z: number; ry: number }[] = [
    { x: X0 + 0.03, z: -4.5, ry: Math.PI / 2 }, // triângulo (parede esquerda, perto da entrada)
    { x: X1 - 0.03, z: -6.5, ry: -Math.PI / 2 }, // círculo (parede direita)
    { x: X0 + 0.03, z: -11.0, ry: Math.PI / 2 }, // cruz (parede esquerda, perto do braseiro — escondida)
  ];
  const fragMats: THREE.MeshBasicMaterial[] = [];
  SEAL_PIECES.forEach((piece, i) => {
    const s = fragSpots[i];
    const side = Math.sign(-s.x) || 1;
    kit.box(0.06, 1.4, 1.4, kit.stone, s.x + side * 0.0, 1.9, s.z, false); // moldura: da parede até 0,03 m
    const mat = new THREE.MeshBasicMaterial({ map: fragmentTexture(piece), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    if (i === 2) mat.color.setScalar(0.06); // escondido: painel escuro até o fogo revelar
    fragMats.push(mat);
    kit.plane(1.15, 1.15, mat, s.x + side * 0.06, 1.9, s.z, 0, s.ry, false); // 3 cm à frente da moldura
  });
  const hiddenFrag = fragMats[2];

  // braseiro (acende com Fogo e revela o fragmento escondido)
  const BX = -3.6;
  const BZ = -12.8;
  kit.box(0.6, 0.8, 0.6, kit.stone, BX, 0.4, BZ);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.32, 0.3, 8), lambert(null, 0x3a3a46));
  bowl.position.set(BX, 0.95, BZ);
  kit.add(bowl);
  const BOWL = new THREE.Vector3(BX, 1.15, BZ);
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: null, fog: false, alphaTest: 0.5, depthWrite: false }));
  flame.scale.set(0.75, 0.6, 1);
  flame.position.set(BX, 1.45, BZ);
  flame.visible = false;
  kit.group.add(flame);
  const flameLight = new THREE.PointLight(0xff8a2a, 0, 0, 2);
  flameLight.position.set(BX + 0.3, 1.9, BZ + 0.4);
  kit.group.add(flameLight);
  const coalMat = new THREE.MeshLambertMaterial({ color: 0x1c1516, emissive: 0x2a0b08 });
  for (let i = 0; i < 5; i++) {
    const coal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11), coalMat);
    coal.position.set(BX + Math.cos(i * 1.3) * 0.22, 1.12 + (i % 2) * 0.05, BZ + Math.sin(i * 1.3) * 0.22);
    kit.group.add(coal);
  }

  const tc = 0x8fe8c8;
  kit.torch(X0 + 0.1, 1.9, -1.0, 1, 0, 0, tc, 40);
  kit.torch(X1 - 0.1, 1.9, -1.0, -1, 0, 1.7, tc, 40);
  kit.torch(X1 - 0.1, 1.9, -11.0, -1, 0, 3.1, tc, 40);
  kit.torch(-1.95, 1.9, Z0 + 0.1, 0, 1, 4.4, tc, 40);
  kit.torch(1.95, 1.9, Z0 + 0.1, 0, 1, 5.2, tc, 40);
  kit.dust(X0, X1, Z0, Z1, 0, H);

  const boxes: Box[] = [];
  for (const [x, z] of PILLARS) {
    boxes.push(mkBox(x - 0.45, 0, z - 0.45, x + 0.45, H, z + 0.45));
    boxes.push(mkBox(x - 0.55, 0, z - 0.55, x + 0.55, 0.25, z + 0.55));
    boxes.push(mkBox(x - 0.55, H - 0.25, z - 0.55, x + 0.55, H, z + 0.55));
  }
  boxes.push(mkBox(BX - 0.3, 0, BZ - 0.3, BX + 0.3, 0.8, BZ + 0.3));
  boxes.push(mkBox(-1.25, 0, -14, -0.95, ARCH_TOP, -13.7));
  boxes.push(mkBox(0.95, 0, -14, 1.25, ARCH_TOP, -13.7));
  boxes.push(mkBox(-1.25, ARCH_TOP - 0.3, -14, 1.25, H, -13.7));

  let lit = false;
  let reveal = 0;
  let doorOpen = 0;
  let solved = [false, false, false];
  let latched = false;
  let announced = false;
  let overInk = false;
  let lastRev = -1;
  let evalTimer = 0;

  // confere o que foi riscado na lousa
  const evaluate = () => {
    const dots = ctx.chalk.dotsOn(slate);
    const expected = SEAL_PIECES.reduce((n, p) => n + p.unit.length, 0) * 1.2;
    const tooMuch = dots.length > expected * 2.4 + 60;
    if (tooMuch && !overInk) ctx.caption('Rabisco demais', 'Apague um pouco e refaça com traços limpos.', '#ff9aa8');
    overInk = tooMuch;
    SEAL_PIECES.forEach((p, i) => {
      let ok = 0;
      const pts = sealPoints(p);
      for (const [px, py] of pts) {
        const tx = SLATE.x + px;
        const ty = SLATE.y + py;
        for (const d of dots) {
          const dx = d.x - tx;
          const dy = d.y - ty;
          if (dx * dx + dy * dy < 0.13 * 0.13) {
            ok++;
            break;
          }
        }
      }
      const done = !tooMuch && ok / pts.length >= 0.8;
      if (done && !solved[i]) {
        ctx.caption(`Peça ${solved.filter(Boolean).length + 1} de 3`, 'O selo reconhece o traço.', p.color);
      }
      solved[i] = done;
    });
  };

  return {
    name: 'Sala 2 · O Selo',
    subtitle: 'Três fragmentos, uma lousa e a pedra-sabão. Um deles só aparece à luz do fogo.',
    group: kit.group,
    surfaces: kit.surfaces,
    doorZ: Z0,
    entranceZ: Z1,
    start: new THREE.Vector3(0, 0, 0.8),
    startYaw: 0,
    fog: { color: '#050e0d', near: 4, far: 22 },
    ambient: { color: 0x6a9a90, intensity: 1.8 },
    boxes,
    rects() {
      const r: ReturnType<Room['rects']> = PILLARS.map(([x, z]) => [x - 0.55, z - 0.55, x + 0.55, z + 0.55] as [number, number, number, number]);
      r.push([BX - 0.5, BZ - 0.5, BX + 0.5, BZ + 0.5]);
      r.push([X0 - 2, Z0, X0, Z1], [X1, Z0, X1 + 2, Z1]);
      r.push(...entrance.rects());
      r.push(...door.rects(doorOpen > 0.85));
      return r;
    },
    clampDie(p, v, e, R) {
      if (p.y > H - R) {
        p.y = H - R;
        if (v.y > 0) v.y = -v.y * e;
      }
      if (p.x < X0 + R) {
        p.x = X0 + R;
        if (v.x < 0) v.x = -v.x * e;
      } else if (p.x > X1 - R) {
        p.x = X1 - R;
        if (v.x > 0) v.x = -v.x * e;
      }
      if (p.z < Z0 + R + 0.03) {
        p.z = Z0 + R + 0.03;
        if (v.z < 0) v.z = -v.z * e;
      } else if (p.z > Z1 - R) {
        p.z = Z1 - R;
        if (v.z > 0) v.z = -v.z * e;
      }
    },
    groundY: () => 0,
    dieFloor: () => 0,
    holdsDie: () => false,
    update(dt, t) {
      kit.tick(dt, t);
      const d = ctx.die;
      if (!lit && d.state === 'flying' && d.face === 3 && d.pos.distanceTo(BOWL) < 0.6) {
        lit = true;
        flame.visible = true;
        ctx.caption('O braseiro acendeu!', 'Algo surge na parede, ao lado.', '#ff9a3c');
      }
      if (lit) {
        flame.material.map = kit.frames[Math.floor(t * 8) % kit.frames.length];
        flameLight.intensity = 40 * (0.97 + 0.02 * Math.sin(t * 5) + 0.012 * Math.sin(t * 11));
        reveal = Math.min(1, reveal + dt * 0.7);
        hiddenFrag.color.setScalar(0.06 + 0.94 * reveal);
      } else {
        hiddenFrag.color.setScalar(0.06);
      }

      // confere a lousa de vez em quando (só se o desenho mudou)
      evalTimer -= dt;
      if (evalTimer <= 0 && ctx.chalk.revision !== lastRev) {
        evalTimer = 0.3;
        lastRev = ctx.chalk.revision;
        evaluate();
      }
      if (solved.every(Boolean)) latched = true;
      door.lampMats.forEach((m, i) => m.color.set(solved[i] ? SEAL_PIECES[i].color : LAMP_OFF));
      const wantOpen = latched ? 1 : 0;
      doorOpen += (wantOpen - doorOpen) * Math.min(1, dt * 2.4);
      door.setOpen(doorOpen);
      if (wantOpen && doorOpen > 0.9 && !announced) {
        announced = true;
        ctx.caption('O selo se completou', 'A porta se abre.', '#ffd36b');
      }
    },
    reset() {
      lit = false;
      reveal = 0;
      flame.visible = false;
      flameLight.intensity = 0;
      hiddenFrag.color.setScalar(0.06);
      doorOpen = 0;
      solved = [false, false, false];
      latched = false;
      announced = false;
      overInk = false;
      lastRev = -1;
      door.setOpen(0);
    },
    dispose() {},
  };
}
// SEAL_CELL é usado só pela lousa; mantido aqui para quem quiser ajustar a escala
void SEAL_CELL;
