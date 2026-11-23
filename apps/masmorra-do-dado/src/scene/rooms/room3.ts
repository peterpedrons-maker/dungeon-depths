// Sala 3 — O Salão das Brasas. Sala redonda: três braseiros em volta e uma placa no
// centro. As chamas se apagam sozinhas depois de um tempo: é preciso acendê-las todas
// com o Fogo e só então pesar a placa com o Peso — antes que a primeira morra.

import * as THREE from 'three';
import { floorTexture, mosaicTexture, plateTexture } from '../textures';
import { buildDoor, buildEntrance, Kit, lambert, LAMP_OFF, T } from '../kit';
import type { Box, Ctx, Room } from '../types';

const R = 6.5; // raio do salão
const H = 4.2;
const HALF = 2.2; // meia-largura do trecho reto onde fica a porta
const Z0 = -Math.sqrt(R * R - HALF * HALF); // parede reta da porta
const PR = 0.3;
const BURN = 40; // segundos que cada braseiro fica aceso
const mkBox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box => ({
  min: new THREE.Vector3(x0, y0, z0),
  max: new THREE.Vector3(x1, y1, z1),
});

const PILLARS: [number, number][] = Array.from({ length: 6 }, (_, k) => [3.5 * Math.cos((k * Math.PI) / 3), 3.5 * Math.sin((k * Math.PI) / 3)]);
const BRAZIERS: [number, number][] = [
  [5.0, -1.0],
  [-5.0, -1.0],
  [-3.2, 4.4],
];

export function buildRoom3(ctx: Ctx): Room {
  const kit = new Kit('ember');

  // paredes curvas (com um vão onde entra a parede reta da porta)
  const gap = 2 * Math.asin(HALF / R);
  const arc = Math.PI - gap; // cada metade da parede curva (um vão na frente e outro no fundo)
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

  for (const [x, z] of PILLARS) {
    kit.box(0.9, H, 0.9, kit.brick([0.75, 3.5], 0.95, 60 + Math.abs(Math.round(x * 10))), x, H / 2, z);
    kit.box(1.1, 0.25, 1.1, kit.stone, x, 0.125, z);
    kit.box(1.1, 0.25, 1.1, kit.stone, x, H - 0.125, z);
  }

  const door = buildDoor(kit, { x0: -HALF, x1: HALF, z0: Z0, h: H, lamps: 3, connected: true });
  const entrance = buildEntrance(kit, { x0: -HALF, x1: HALF, z: -Z0, h: H });

  // placa central
  const PLATE = { x: 0, z: 0, half: 0.7, top: 0.07 };
  kit.zone('plate', (x, z) => Math.abs(x - PLATE.x) < PLATE.half && Math.abs(z - PLATE.z) < PLATE.half);
  const plateSide = lambert(null, 0x3a3638);
  kit.box(1.4, 0.07, 1.4, [plateSide, plateSide, lambert(plateTexture()), plateSide, plateSide, plateSide], 0, 0.035, 0);

  // braseiros
  const coalMat = new THREE.MeshLambertMaterial({ color: 0x1c1516, emissive: 0x2a0b08 });
  const braziers = BRAZIERS.map(([x, z]) => {
    kit.box(0.6, 0.8, 0.6, kit.stone, x, 0.4, z);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.32, 0.3, 8), lambert(null, 0x3a3a46));
    bowl.position.set(x, 0.95, z);
    kit.add(bowl);
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: null, fog: false, alphaTest: 0.5, depthWrite: false }));
    flame.position.set(x, 1.45, z);
    flame.visible = false;
    kit.group.add(flame);
    const light = kit.light(x * 0.9, 1.9, z * 0.9, 0xff8a2a, 0);
    for (let i = 0; i < 5; i++) {
      const coal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11), coalMat);
      coal.position.set(x + Math.cos(i * 1.3) * 0.22, 1.12 + (i % 2) * 0.05, z + Math.sin(i * 1.3) * 0.22);
      kit.group.add(coal);
    }
    return { pos: new THREE.Vector3(x, 1.15, z), flame, light, left: 0 };
  });

  // tochas na parede curva
  // decoração: mosaico no chão, vigas em cruz, estandartes, barris
  kit.decal(8.6, 8.6, 'mosaic', () => mosaicTexture(), 0, 0.011, 0, -Math.PI / 2, 0, 0);
  kit.beam(0, H - 0.15, 0, 12.2, 0.3, 0.3);
  kit.beam(0, H - 0.15, 0, 0.3, 0.3, 12.2);
  for (const deg of [0, 180, 235, 305]) {
    const a = (deg * Math.PI) / 180;
    const r = R - 0.04;
    kit.banner(r * Math.cos(a), 2.1, r * Math.sin(a), -Math.cos(a), -Math.sin(a), '#7a2a1a', '#e8b878', 2.0);
  }
  kit.barrel(4.6, 3.5);
  kit.barrel(4.0, 4.2);
  const tc = 0xffb070;
  [45, 135, 200, 340].forEach((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const r = R - 0.15;
    kit.torch(r * Math.cos(a), 2.0, r * Math.sin(a), -Math.cos(a), -Math.sin(a), i * 1.7, tc, 38);
  });
  kit.dust(-R * 0.8, R * 0.8, -R * 0.8, R * 0.8, 0, H);

  const boxes: Box[] = [];
  for (const [x, z] of PILLARS) {
    boxes.push(mkBox(x - 0.45, 0, z - 0.45, x + 0.45, H, z + 0.45));
    boxes.push(mkBox(x - 0.55, 0, z - 0.55, x + 0.55, 0.25, z + 0.55));
  }
  for (const [x, z] of BRAZIERS) boxes.push(mkBox(x - 0.3, 0, z - 0.3, x + 0.3, 0.8, z + 0.3));
  boxes.push(mkBox(-0.7, 0, -0.7, 0.7, PLATE.top, 0.7));

  let plateDown = false;
  let doorOpen = 0;
  let latched = false;
  let announced = false;
  let prevWant = 0;
  let warned = false;

  const onPlate = () => {
    const p = ctx.die.pos;
    return Math.abs(p.x - PLATE.x) < PLATE.half + 0.05 && Math.abs(p.z - PLATE.z) < PLATE.half + 0.05 && p.y < PLATE.top + ctx.die.R + 0.1;
  };
  const allLit = () => braziers.every((b) => b.left > 0);

  return {
    name: 'Sala 3 · O Salão das Brasas',
    subtitle: 'Acenda as três chamas antes que se apaguem — e pese a placa central.',
    group: kit.group,
    surfaces: kit.surfaces,
    emitters: kit.emitters,
    doorZ: Z0,
    entranceZ: -Z0,
    start: new THREE.Vector3(0, 0, 4.6),
    startYaw: 0,
    fog: { color: '#120706', near: 4, far: 20 },
    ambient: { color: 0xb08878, intensity: 1.7 },
    boxes: [...boxes, ...kit.boxes],
    rects() {
      const r: ReturnType<Room['rects']> = PILLARS.map(([x, z]) => [x - 0.55, z - 0.55, x + 0.55, z + 0.55] as [number, number, number, number]);
      for (const [x, z] of BRAZIERS) r.push([x - 0.5, z - 0.5, x + 0.5, z + 0.5]);
      r.push(...kit.rects);
      r.push(...entrance.rects());
      r.push(...door.rects(doorOpen > 0.85));
      return r;
    },
    // só dentro do salão (nos corredores quem limita são as paredes retas)
    clampPlayer(pos) {
      if (pos.z > Z0 - 0.01 && pos.z < -Z0 + 0.01) {
        const d = Math.hypot(pos.x, pos.z);
        const max = R - PR;
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
      if (Math.abs(p.x) < HALF + 0.2 && p.z < Z0 + Rd + 0.03) {
        p.z = Z0 + Rd + 0.03;
        if (v.z < 0) v.z = -v.z * e;
      }
      if (Math.abs(p.x) < HALF + 0.2 && p.z > -Z0 - Rd - 0.03) {
        p.z = -Z0 - Rd - 0.03;
        if (v.z > 0) v.z = -v.z * e;
      }
    },
    groundY: () => 0,
    surfaceAt: (x, z) => kit.surfaceAt(x, z),
    dieFloor: () => 0,
    holdsDie: () => plateDown,
    onDieRest() {
      if (onPlate() && ctx.die.face !== 2) ctx.caption('Leve demais', 'Só o dado pesado afunda a placa.', '#d9a066');
    },
    update(dt, t) {
      kit.tick(dt, t);
      const d = ctx.die;
      braziers.forEach((b, i) => {
        if (b.left <= 0 && !latched && d.state === 'flying' && d.face === 3 && d.pos.distanceTo(b.pos) < 0.6) {
          b.left = BURN;
          b.flame.visible = true;
          ctx.caption(`Braseiro ${braziers.filter((x) => x.left > 0).length} de 3`, 'Ele não vai durar muito.', '#ff9a3c');
          ctx.sfx('ignite');
        }
        if (b.left > 0 && !latched) {
          b.left -= dt;
          if (b.left <= 0) {
            b.flame.visible = false;
            b.light.intensity = 0;
            ctx.caption('Uma chama se apagou', 'Acenda de novo — e seja mais rápido.', '#cfc6e8');
            ctx.sfx('burnout');
          }
        }
        if (b.left > 0) {
          const k = Math.min(1, b.left / 8); // nos últimos 8 s a chama encolhe
          b.flame.scale.set(0.75 * (0.4 + 0.6 * k), 0.6 * (0.4 + 0.6 * k), 1);
          b.flame.material.map = kit.frames[Math.floor(t * 8 + i) % kit.frames.length];
          b.light.intensity = 40 * k * (0.97 + 0.02 * Math.sin(t * 5 + i) + 0.012 * Math.sin(t * 11));
        }
        door.lampMats[i].color.setHex(b.left > 0 ? 0xff7a2e : LAMP_OFF);
      });
      if (!warned && braziers.some((b) => b.left > 0 && b.left < 8) && !allLit()) warned = true;

      const pressed = d.state === 'rest' && d.face === 2 && onPlate();
      if (pressed && !plateDown) ctx.sfx('plate');
      if (pressed && !plateDown) ctx.caption('Placa acionada', allLit() ? 'As chamas respondem.' : 'Faltam chamas acesas.', '#ffd36b');
      plateDown = pressed;

      if (allLit() && plateDown) latched = true;
      if (!plateDown && doorOpen < 0.05) latched = false;
      if (latched && !plateDown) latched = false;
      const wantOpen = latched ? 1 : 0;
      if (wantOpen && !prevWant) ctx.sfx('door');
      else if (!wantOpen && prevWant && doorOpen > 0.15) ctx.sfx('doorClose');
      prevWant = wantOpen;
      doorOpen += (wantOpen - doorOpen) * Math.min(1, dt * 2.4);
      door.setOpen(doorOpen);
      if (wantOpen && doorOpen > 0.9 && !announced) {
        announced = true;
        ctx.caption('A porta se abriu', 'Atravesse enquanto o dado segura a placa.', '#ffd36b');
      }
      if (!wantOpen) announced = false;
    },
    reset() {
      braziers.forEach((b) => {
        b.left = 0;
        b.flame.visible = false;
        b.light.intensity = 0;
      });
      plateDown = false;
      doorOpen = 0;
      latched = false;
      announced = false;
      prevWant = 0;
      warned = false;
      door.setOpen(0);
    },
    dispose() {},
  };
}
