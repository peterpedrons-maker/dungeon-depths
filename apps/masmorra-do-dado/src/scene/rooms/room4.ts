// Sala 4 — O Mirante. Sala alta de dois níveis: embaixo a entrada e uma placa, no alto
// (um palco) a porta e um braseiro. A rampa na parede direita é a única subida; o
// jogador pode se jogar da beirada, mas aí tem que subir de novo. A sequência é:
// subir, acender o braseiro com o Fogo, descer, segurar a placa com o Peso e subir
// outra vez até a porta — com o dado preso na placa lá embaixo.

import * as THREE from 'three';
import { floorTexture, plateTexture } from '../textures';
import { buildDoor, buildEntrance, Kit, lambert, LAMP_OFF, T } from '../kit';
import type { Box, Ctx, Room } from '../types';

const X0 = -5;
const X1 = 5;
const Z0 = -12;
const Z1 = 3;
const H = 5.8;
const LEVEL = 2.4; // altura do palco
const STAGE_Z = -5.5; // o palco vai daqui até o fundo
const RAMP = { x0: 2.6, x1: 4.6, zLow: -1, zHigh: STAGE_Z };
const mkBox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box => ({
  min: new THREE.Vector3(x0, y0, z0),
  max: new THREE.Vector3(x1, y1, z1),
});
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rampY = (x: number, z: number) =>
  x >= RAMP.x0 && x <= RAMP.x1 && z <= RAMP.zLow && z >= RAMP.zHigh ? LEVEL * clamp((RAMP.zLow - z) / (RAMP.zLow - RAMP.zHigh), 0, 1) : 0;

export function buildRoom4(ctx: Ctx): Room {
  const kit = new Kit('frost');
  const W = X1 - X0;
  const L = Z1 - Z0;
  const zm = (Z0 + Z1) / 2;
  const SZ = STAGE_Z - Z0; // profundidade do palco

  kit.plane(W, L, lambert(floorTexture([W / T, L / T], 'frost')), 0, 0, zm, -Math.PI / 2);
  kit.plane(W, L, kit.brick([W / T, L / T], 0.7, 21), 0, H, zm, Math.PI / 2);
  const entrance = buildEntrance(kit, { x0: X0, x1: X1, z: Z1, h: H });
  kit.plane(L, H, kit.brick([L / T, H / T], 1, 35), X0, H / 2, zm, 0, Math.PI / 2);
  kit.plane(L, H, kit.brick([L / T, H / T], 1, 41), X1, H / 2, zm, 0, -Math.PI / 2);

  // palco: topo de piso, frente e laterais de tijolo
  const stageTop = lambert(floorTexture([W / T, SZ / T], 'frost'));
  const stageFront = kit.brick([W / T, LEVEL / T], 1.1, 88);
  const stageSide = kit.brick([SZ / T, LEVEL / T], 1.1, 89);
  const stageBase = lambert(null, 0x222838);
  kit.box(W, LEVEL, SZ, [stageSide, stageSide, stageTop, stageBase, stageFront, stageBase], 0, LEVEL / 2, (Z0 + STAGE_Z) / 2);

  // rampa (cunha extrudada): sobe da frente (z = -1) até o palco (z = -5.5)
  const len = RAMP.zLow - RAMP.zHigh;
  const tri = new THREE.Shape();
  tri.moveTo(0, 0);
  tri.lineTo(len, 0);
  tri.lineTo(len, LEVEL);
  tri.closePath();
  const rampTex = floorTexture([1 / T, 1 / T], 'frost');
  const ramp = new THREE.Mesh(
    new THREE.ExtrudeGeometry(tri, { depth: RAMP.x1 - RAMP.x0, bevelEnabled: false }),
    [kit.brick([1 / T, 1 / T], 1.1, 90), lambert(rampTex)],
  );
  ramp.rotation.y = Math.PI / 2;
  ramp.position.set(RAMP.x0, 0, RAMP.zLow);
  kit.add(ramp);

  // duas colunas na parte baixa
  const PILLARS: [number, number][] = [
    [-3.2, 0.5],
    [-3.2, -3.5],
  ];
  for (const [x, z] of PILLARS) {
    kit.box(0.9, H, 0.9, kit.brick([0.75, 4], 0.95, 100 + Math.abs(Math.round(z * 3))), x, H / 2, z);
    kit.box(1.1, 0.25, 1.1, kit.stone, x, 0.125, z);
    kit.box(1.1, 0.25, 1.1, kit.stone, x, H - 0.125, z);
  }

  const door = buildDoor(kit, { x0: X0, x1: X1, z0: Z0, y0: LEVEL, h: H - LEVEL, lamps: 2 });
  const [lampPlate, lampFire] = door.lampMats;

  // placa embaixo
  const PLATE = { x: -1.4, z: -3.0, half: 0.65, top: 0.07 };
  const plateSide = lambert(null, 0x3a3638);
  kit.box(1.3, 0.07, 1.3, [plateSide, plateSide, lambert(plateTexture()), plateSide, plateSide, plateSide], PLATE.x, 0.035, PLATE.z);

  // braseiro em cima do palco
  const BX = -3.6;
  const BZ = -10.4;
  kit.box(0.6, 0.8, 0.6, kit.stone, BX, LEVEL + 0.4, BZ);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.32, 0.3, 8), lambert(null, 0x3a3a46));
  bowl.position.set(BX, LEVEL + 0.95, BZ);
  kit.add(bowl);
  const BOWL = new THREE.Vector3(BX, LEVEL + 1.15, BZ);
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: null, fog: false, alphaTest: 0.5, depthWrite: false }));
  flame.scale.set(0.75, 0.6, 1);
  flame.position.set(BX, LEVEL + 1.45, BZ);
  flame.visible = false;
  kit.group.add(flame);
  const flameLight = new THREE.PointLight(0xff8a2a, 0, 0, 2);
  flameLight.position.set(BX + 0.3, LEVEL + 1.9, BZ + 0.4);
  kit.group.add(flameLight);
  const coalMat = new THREE.MeshLambertMaterial({ color: 0x1c1516, emissive: 0x2a0b08 });
  for (let i = 0; i < 5; i++) {
    const coal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11), coalMat);
    coal.position.set(BX + Math.cos(i * 1.3) * 0.22, LEVEL + 1.12 + (i % 2) * 0.05, BZ + Math.sin(i * 1.3) * 0.22);
    kit.group.add(coal);
  }

  const tc = 0xd8e0ff;
  kit.torch(X0 + 0.1, 2.0, 1.0, 1, 0, 0, tc, 40);
  kit.torch(X1 - 0.1, 2.0, 1.8, -1, 0, 1.7, tc, 40);
  kit.torch(X0 + 0.1, 2.0, -3.0, 1, 0, 3.1, tc, 40);
  kit.torch(X0 + 0.1, LEVEL + 2.0, -8.0, 1, 0, 4.4, tc, 40);
  kit.torch(-1.95, LEVEL + 1.9, Z0 + 0.1, 0, 1, 5.2, tc, 40);
  kit.torch(1.95, LEVEL + 1.9, Z0 + 0.1, 0, 1, 6.0, tc, 40);
  kit.dust(X0, X1, Z0, Z1, 0, H);

  const boxes: Box[] = [mkBox(X0, 0, Z0, X1, LEVEL, STAGE_Z)];
  for (const [x, z] of PILLARS) {
    boxes.push(mkBox(x - 0.45, 0, z - 0.45, x + 0.45, H, z + 0.45));
    boxes.push(mkBox(x - 0.55, 0, z - 0.55, x + 0.55, 0.25, z + 0.55));
  }
  boxes.push(mkBox(PLATE.x - PLATE.half, 0, PLATE.z - PLATE.half, PLATE.x + PLATE.half, PLATE.top, PLATE.z + PLATE.half));
  boxes.push(mkBox(BX - 0.3, LEVEL, BZ - 0.3, BX + 0.3, LEVEL + 0.8, BZ + 0.3));
  boxes.push(mkBox(-1.25, LEVEL, Z0, -0.95, LEVEL + 2.65, Z0 + 0.3));
  boxes.push(mkBox(0.95, LEVEL, Z0, 1.25, LEVEL + 2.65, Z0 + 0.3));
  boxes.push(mkBox(-1.25, LEVEL + 2.35, Z0, 1.25, H, Z0 + 0.3));

  let lit = false;
  let plateDown = false;
  let doorOpen = 0;
  let announced = false;
  let latched = false;

  const onPlate = () => {
    const p = ctx.die.pos;
    return Math.abs(p.x - PLATE.x) < PLATE.half + 0.05 && Math.abs(p.z - PLATE.z) < PLATE.half + 0.05 && p.y < PLATE.top + ctx.die.R + 0.1;
  };

  return {
    name: 'Sala 4 · O Mirante',
    subtitle: 'A porta fica no alto. A rampa sobe — a beirada, não.',
    group: kit.group,
    surfaces: kit.surfaces,
    doorZ: Z0,
    entranceZ: Z1,
    start: new THREE.Vector3(0, 0, 2.2),
    startYaw: 0,
    fog: { color: '#070a14', near: 5, far: 26 },
    ambient: { color: 0x8aa0e0, intensity: 1.7 },
    boxes,
    rects() {
      const r: ReturnType<Room['rects']> = [[X0 - 1, Z0 - 1, X1 + 1, STAGE_Z, LEVEL]];
      for (const [x, z] of PILLARS) r.push([x - 0.55, z - 0.55, x + 0.55, z + 0.55, H]);
      r.push([BX - 0.5, BZ - 0.5, BX + 0.5, BZ + 0.5, LEVEL + 1]);
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
    groundY(x, z) {
      if (z <= STAGE_Z) return LEVEL;
      return rampY(x, z);
    },
    dieFloor: rampY,
    holdsDie: () => plateDown,
    onDieRest() {
      if (onPlate() && ctx.die.face !== 2) ctx.caption('Leve demais', 'Só o dado pesado afunda a placa.', '#d9a066');
    },
    update(dt, t) {
      kit.tick(dt, t);
      const d = ctx.die;
      if (!lit && d.state === 'flying' && d.face === 3 && d.pos.distanceTo(BOWL) < 0.6) {
        lit = true;
        flame.visible = true;
        ctx.caption('O braseiro acendeu!', 'Agora a placa, lá embaixo.', '#ff9a3c');
      }
      if (lit) {
        flame.material.map = kit.frames[Math.floor(t * 8) % kit.frames.length];
        flameLight.intensity = 40 * (0.97 + 0.02 * Math.sin(t * 5) + 0.012 * Math.sin(t * 11));
      }
      const pressed = d.state === 'rest' && d.face === 2 && onPlate();
      if (pressed && !plateDown) ctx.caption('Placa acionada', lit ? 'Suba até a porta, sem recolher o dado.' : 'Falta acender o braseiro lá em cima.', '#ffd36b');
      plateDown = pressed;

      latched = lit && plateDown;
      const wantOpen = latched ? 1 : 0;
      doorOpen += (wantOpen - doorOpen) * Math.min(1, dt * 2.4);
      door.setOpen(doorOpen);
      lampPlate.color.setHex(plateDown ? 0xffd36b : LAMP_OFF);
      lampFire.color.setHex(lit ? 0xff7a2e : LAMP_OFF);
      if (wantOpen && doorOpen > 0.9 && !announced) {
        announced = true;
        ctx.caption('A porta se abriu', 'Atravesse enquanto o dado segura a placa.', '#ffd36b');
      }
      if (!wantOpen) announced = false;
    },
    exitReached: () => doorOpen > 0.85 && ctx.player.pos.z < door.zExit && ctx.feetY() > LEVEL - 0.3,
    reset() {
      lit = false;
      flame.visible = false;
      flameLight.intensity = 0;
      plateDown = false;
      doorOpen = 0;
      announced = false;
      latched = false;
      door.setOpen(0);
    },
    dispose() {},
  };
}
