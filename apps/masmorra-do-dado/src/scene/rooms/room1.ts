// Sala 1 — A Entrada. Ensina o dado: fogo acende o braseiro, peso aperta a placa.
// A porta só abre com as duas coisas feitas. Há uma gema escondida num nicho alto
// que só o ricochete alcança.

import * as THREE from 'three';
import { crackTexture, floorTexture, gemTexture, plateTexture, sparkTexture } from '../textures';
import { ARCH_TOP, buildDoor, Kit, lambert, LAMP_OFF, T } from '../kit';
import type { Box, Ctx, Room } from '../types';

const X0 = -4;
const X1 = 4;
const Z0 = -10;
const Z1 = 2;
const H = 3.2;
const PILLARS: [number, number][] = [
  [-2.3, -3],
  [2.3, -3],
  [-2.3, -7],
  [2.3, -7],
];
const mkBox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box => ({
  min: new THREE.Vector3(x0, y0, z0),
  max: new THREE.Vector3(x1, y1, z1),
});

export function buildRoom1(ctx: Ctx): Room {
  const kit = new Kit('crypt');
  const W = X1 - X0;
  const L = Z1 - Z0;
  const zm = (Z0 + Z1) / 2;

  kit.plane(W, L, lambert(floorTexture([W / T, L / T], 'crypt')), 0, 0, zm, -Math.PI / 2);
  kit.plane(W, L, kit.brick([W / T, L / T], 0.8, 17), 0, H, zm, Math.PI / 2);
  kit.plane(W, H, kit.brick([W / T, H / T], 1, 23), 0, H / 2, Z1, 0, Math.PI);
  kit.plane(L, H, kit.brick([L / T, H / T], 1, 31), X0, H / 2, zm, 0, Math.PI / 2);
  kit.plane(L, H, kit.brick([L / T, H / T], 1, 37), X1, H / 2, zm, 0, -Math.PI / 2);

  for (const [x, z] of PILLARS) {
    const pillarMat = kit.brick([0.75, 2.7], 0.95, 50 + Math.abs(x * z));
    kit.box(0.9, H, 0.9, pillarMat, x, H / 2, z);
    kit.box(1.1, 0.25, 1.1, kit.stone, x, 0.125, z);
    kit.box(1.1, 0.25, 1.1, kit.stone, x, H - 0.125, z);
  }

  const door = buildDoor(kit, { x0: X0, x1: X1, z0: Z0, h: H, lamps: 2, connected: true });
  const [lampPlate, lampFire] = door.lampMats;

  // placa de pressão e piso rachado
  const PLATE = { x: -1.4, z: -5, half: 0.65, top: 0.07 };
  kit.zone('plate', (x, z) => Math.abs(x - PLATE.x) < PLATE.half && Math.abs(z - PLATE.z) < PLATE.half);
  const plateSide = lambert(null, 0x3a3638);
  kit.box(1.3, 0.07, 1.3, [plateSide, plateSide, lambert(plateTexture()), plateSide, plateSide, plateSide], PLATE.x, 0.035, PLATE.z);
  kit.plane(1.7, 1.7, new THREE.MeshLambertMaterial({ map: crackTexture(), transparent: true, alphaTest: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }), 1.5, 0.015, -4.8, -Math.PI / 2);

  // braseiro apagado
  kit.box(0.6, 0.8, 0.6, kit.stone, 2.9, 0.4, -9.2);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.32, 0.3, 8), lambert(null, 0x3a3a46));
  bowl.position.set(2.9, 0.95, -9.2);
  kit.add(bowl);
  const BOWL = new THREE.Vector3(2.9, 1.15, -9.2);
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: null, fog: false, alphaTest: 0.5, depthWrite: false }));
  flame.scale.set(0.75, 0.6, 1);
  flame.position.set(BOWL.x, 1.45, BOWL.z);
  flame.visible = false;
  kit.group.add(flame);
  const flameLight = kit.light(BOWL.x - 0.3, 1.9, BOWL.z + 0.4, 0xff8a2a, 0);
  const coalMat = new THREE.MeshLambertMaterial({ color: 0x1c1516, emissive: 0x2a0b08 });
  for (let i = 0; i < 5; i++) {
    const coal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11), coalMat);
    coal.position.set(2.9 + Math.cos(i * 1.3) * 0.22, 1.12 + (i % 2) * 0.05, -9.2 + Math.sin(i * 1.3) * 0.22);
    kit.group.add(coal);
  }

  // nicho na parede direita com o item "escondido"
  const nz = -8.3;
  const nicheX = X1 - 0.12;
  kit.box(0.24, 1.4, 0.2, kit.stone, nicheX, 2.1, nz - 0.5);
  kit.box(0.24, 1.4, 0.2, kit.stone, nicheX, 2.1, nz + 0.5);
  kit.box(0.24, 0.2, 1.2, kit.stone, nicheX, 2.9, nz);
  kit.box(0.24, 0.2, 1.2, kit.stone, nicheX, 1.3, nz);
  kit.plane(0.8, 1.0, new THREE.MeshBasicMaterial({ color: 0x06050a }), X1 - 0.01, 2.1, nz, 0, -Math.PI / 2);
  const gem = new THREE.Sprite(new THREE.SpriteMaterial({ map: gemTexture(), fog: false }));
  gem.scale.set(0.42, 0.42, 1);
  gem.position.set(X1 - 0.3, 2.1, nz);
  kit.group.add(gem);
  const gemLight = kit.light(X1 - 0.6, 2.1, nz, 0x4fe8ff, 9);
  const sparkMat = new THREE.SpriteMaterial({ map: sparkTexture(), fog: false, depthWrite: false });
  const sparks = [0, 1, 2].map(() => {
    const s = new THREE.Sprite(sparkMat);
    s.scale.set(0.1, 0.1, 1);
    kit.group.add(s);
    return s;
  });
  const GEM = new THREE.Vector3(X1 - 0.3, 2.1, nz);

  // decoração
  kit.skirting(X0, X1, Z0, Z1, 1.3);
  kit.aoSides(X0, X1, Z0, Z1, H);
  kit.cornice(X0, X1, Z0, Z1, H);
  for (const z of [-3, -7]) {
    kit.pilaster(X0, z, 1, 0, H);
    kit.pilaster(X1, z, -1, 0, H);
  }
  for (const [x, z] of PILLARS) kit.contact(x, z, 2.1);
  kit.contact(2.9, -9.2, 1.6);
  for (const z of [-2, -5.5, -8.8]) kit.beam(0, H - 0.15, z, W, 0.3, 0.3);
  kit.rug(0, -3.6, 1.4, 8.2, '#6a2a3a', '#d4ac4e');
  kit.banner(X0 + 0.02, 1.9, -5.0, 1, 0, '#5a2a6a', '#d4ac4e');
  kit.banner(X1 - 0.02, 1.9, -5.0, -1, 0, '#5a2a6a', '#d4ac4e');
  kit.crate(3.35, 1.25, 0.75, 0.3);
  kit.crate(3.45, 0.45, 0.55, -0.2);
  kit.crate(-3.4, 1.2, 0.8, 0.1);
  kit.barrel(-2.75, 1.45);
  kit.barrel(-3.5, -9.3);
  kit.barrel(-2.85, -9.45);
  kit.web(X0, H - 0.45, Z1 - 0.45, 1, 0);
  kit.web(X1, H - 0.45, Z1 - 0.45, -1, 0, true);
  kit.web(X0, H - 0.45, Z0 + 0.45, 1, 0, true);
  kit.damp(X0, 1.0, -6.4, 1, 0, 1.9);
  kit.damp(X1, 2.3, -3.4, -1, 0, 1.5);
  kit.torch(X0 + 0.1, 1.8, -1.5, 1, 0, 0);
  kit.torch(X1 - 0.1, 1.8, -1.5, -1, 0, 1.7);
  kit.torch(X0 + 0.1, 1.8, -7.6, 1, 0, 3.1);
  kit.torch(-1.95, 1.8, Z0 + 0.1, 0, 1, 4.4);
  kit.torch(1.95, 1.8, Z0 + 0.1, 0, 1, 5.2);
  kit.dust(X0, X1, Z0, Z1, 0, H);

  // sólidos pro dado
  const boxes: Box[] = [];
  for (const [x, z] of PILLARS) {
    boxes.push(mkBox(x - 0.45, 0, z - 0.45, x + 0.45, H, z + 0.45));
    boxes.push(mkBox(x - 0.55, 0, z - 0.55, x + 0.55, 0.25, z + 0.55));
    boxes.push(mkBox(x - 0.55, H - 0.25, z - 0.55, x + 0.55, H, z + 0.55));
  }
  boxes.push(mkBox(PLATE.x - PLATE.half, 0, PLATE.z - PLATE.half, PLATE.x + PLATE.half, PLATE.top, PLATE.z + PLATE.half));
  boxes.push(mkBox(2.6, 0, -9.5, 3.2, 0.8, -8.9));
  boxes.push(mkBox(2.9 - 0.42, 0.8, -9.2 - 0.42, 2.9 + 0.42, 1.1, -9.2 + 0.42)); // a tigela: o dado repousa em cima dela
  boxes.push(mkBox(-1.25, 0, -10, -0.95, ARCH_TOP, -9.7));
  boxes.push(mkBox(0.95, 0, -10, 1.25, ARCH_TOP, -9.7));
  boxes.push(mkBox(-1.25, ARCH_TOP - 0.3, -10, 1.25, H, -9.7));

  let lit = false;
  let gemTaken = false;
  let plateDown = false;
  let doorOpen = 0;
  let announced = false;
  let prevWant = 0;

  const onPlate = () => {
    const p = ctx.die.pos;
    return Math.abs(p.x - PLATE.x) < PLATE.half + 0.05 && Math.abs(p.z - PLATE.z) < PLATE.half + 0.05 && p.y < PLATE.top + ctx.die.R + 0.1;
  };

  kit.bake();

  return {
    name: 'Sala 1 · A Entrada',
    subtitle: 'Fogo no braseiro, peso na placa — e a porta cede.',
    group: kit.group,
    surfaces: kit.surfaces,
    emitters: kit.emitters,
    doorZ: Z0,
    entranceZ: Z1,
    start: new THREE.Vector3(0, 0, 1.2),
    startYaw: 0,
    fog: { color: '#0b0912', near: 4, far: 19 },
    ambient: { color: 0x7a78b8, intensity: 1.9 },
    boxes: [...boxes, ...kit.boxes],
    sockets: [{ x: 2.9, y: 1.1, z: -9.2, r: 0.6 }],
    rects() {
      const r: ReturnType<Room['rects']> = PILLARS.map(([x, z]) => [x - 0.55, z - 0.55, x + 0.55, z + 0.55] as [number, number, number, number]);
      r.push([2.4, -9.7, 3.4, -8.7], ...kit.rects);
      // paredes: esquerda, direita e a da frente (a primeira sala não tem entrada)
      r.push([X0 - 2, Z0, X0, Z1 + 0.5], [X1, Z0, X1 + 2, Z1 + 0.5], [X0 - 2, Z1, X1 + 2, Z1 + 0.5]);
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
    surfaceAt: (x, z) => kit.surfaceAt(x, z),
    dieFloor: () => 0,
    holdsDie: () => plateDown,
    onDieRest() {
      if (onPlate() && ctx.die.face !== 2) ctx.caption('Leve demais', 'Só o dado pesado afunda a placa.', '#d9a066');
    },
    update(dt, t) {
      kit.tick(dt, t);
      const d = ctx.die;
      if (d.state === 'flying') {
        if (!gemTaken && d.thrown && d.pos.distanceTo(GEM) < 0.55) {
          gemTaken = true;
          gem.visible = false;
          gemLight.intensity = 0;
          sparks.forEach((s) => (s.visible = false));
          ctx.caption('Gema encontrada!', 'Só o ricochete chega num lugar desses.', '#6ff0ff');
          ctx.sfx('gem');
        }
      }
      if (!lit && (d.state === 'flying' || d.state === 'rest') && d.face === 3 && d.pos.distanceTo(BOWL) < 0.6) {
        lit = true;
        flame.visible = true;
        ctx.caption('O braseiro acendeu!', 'A lâmpada da direita brilha sobre a porta.', '#ff9a3c');
        ctx.sfx('ignite');
      }
      const pressed = d.state === 'rest' && d.face === 2 && onPlate();
      if (pressed && !plateDown) ctx.sfx('plate');
      if (pressed && !plateDown) ctx.caption('Placa acionada', 'O dado pesado segura a placa. Não o recolha.', '#ffd36b');
      plateDown = pressed;

      const wantOpen = plateDown && lit ? 1 : 0;
      if (wantOpen && !prevWant) ctx.sfx('door');
      else if (!wantOpen && prevWant && doorOpen > 0.15) ctx.sfx('doorClose');
      prevWant = wantOpen;
      doorOpen += (wantOpen - doorOpen) * Math.min(1, dt * 2.4);
      door.setOpen(doorOpen);
      lampPlate.color.setHex(plateDown ? 0xffd36b : LAMP_OFF);
      lampFire.color.setHex(lit ? 0xff7a2e : LAMP_OFF);
      if (wantOpen && doorOpen > 0.9 && !announced) {
        announced = true;
        ctx.caption('A porta se abriu', 'Atravesse enquanto o dado segura a placa.', '#ffd36b');
      }
      if (!wantOpen) announced = false;
      if (lit) {
        flame.material.map = kit.frames[Math.floor(t * 8) % kit.frames.length];
        flameLight.intensity = 40 * (0.97 + 0.02 * Math.sin(t * 5) + 0.012 * Math.sin(t * 11));
      }
      if (!gemTaken) {
        gem.position.y = 2.1 + Math.sin(t * 2) * 0.04;
        gemLight.intensity = 9 + Math.sin(t * 3) * 2;
        sparks.forEach((s, i) => {
          const a = t * 1.5 + i * 2.1;
          s.position.set(X1 - 0.3 + Math.sin(a * 0.7) * 0.06, 2.1 + Math.sin(a) * 0.32, nz + Math.cos(a) * 0.32);
          s.material.rotation = a;
        });
      }
    },
    reset() {
      lit = false;
      flame.visible = false;
      flameLight.intensity = 0;
      gemTaken = false;
      gem.visible = true;
      sparks.forEach((s) => (s.visible = true));
      plateDown = false;
      doorOpen = 0;
      announced = false;
      prevWant = 0;
      door.setOpen(0);
    },
    bonus: () => gemTaken,
    dispose() {},
  };
}
