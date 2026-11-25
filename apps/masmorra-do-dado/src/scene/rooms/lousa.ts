// SALA · A LOUSA (nível 2; PUZZLES_PROPOSTAS.md §5, verificador tools/verify_lousa.mjs).
// Acender em grade é ESCREVER, e os números são as faces do dado. Três passos:
//  1) lousa 1 (parede direita): copiar o DOIS talhado ao lado → a grade de ferro sobe e libera o resto da sala;
//  2) lousa 2: copiar o TRÊS → a porta-lousa acorda;
//  3) a PORTA é a lousa: «ACENDER ▢ BRASEIRO» tem de ficar VERDADEIRA. Há QUATRO braseiros acesos (um num nicho em cima da entrada,
//     atrás de quem entra). A resposta é QUATRO, que ninguém ensinou: a face quatro do dado (o dado de pedra no canto mostra UM, DOIS, TRÊS).
// Segredo S1: atrás da coluna esquerda, uma lousa de soquete frio sob um dado de CINCO pontos. Escrever CINCO abre um nicho com uma gema.

import * as THREE from 'three';
import { Kit, lambert, LAMP_OFF } from '../kit';
import { makeBrazier } from '../brazier';
import { makeGemNiche, makeLivePanel, makeWallBoard, type WallBoard } from '../firegrid';
import { mkBox, roomShell, shotGate } from './shell';
import type { Ctx, Room } from '../types';

function dieFaceTex(points: number[]) {
  const N = 48;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d')!;
  g.fillStyle = '#8a8480';
  g.fillRect(0, 0, N, N);
  let s = 3 + points.length * 11;
  for (let i = 0; i < 140; i++) {
    s = (s * 16807) % 2147483647;
    g.fillStyle = i % 2 ? '#9a948e' : '#6e6864';
    g.fillRect(s % N, Math.floor(s / N) % N, 2, 1);
  }
  g.fillStyle = '#4a4440';
  g.fillRect(0, 0, N, 2);
  g.fillRect(0, N - 2, N, 2);
  g.fillRect(0, 0, 2, N);
  g.fillRect(N - 2, 0, 2, N);
  for (const i of points) {
    const cx = 10 + (i % 3) * 14;
    const cy = 10 + Math.floor(i / 3) * 14;
    g.fillStyle = '#15110f';
    g.fillRect(cx - 4, cy - 4, 8, 8);
    g.fillStyle = '#2a2420';
    g.fillRect(cx - 2, cy - 2, 4, 4);
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildLousa(ctx: Ctx): Room {
  const kit = new Kit('ruin');
  const S = roomShell(kit, { hx: 3.6, z0: -9.5, h: 3.8, lamps: 1 });
  const { X0, X1, Z0, Z1, H } = S;
  const GRATE_Z = -1.5;

  // colunas: a da esquerda esconde a lousa secreta de quem vem da grade
  S.pillar(-2.2, -3.0, 0.8);
  S.pillar(1.8, -5.6, 0.8);

  // ── os quatro braseiros acesos pela Casa ──
  const bz = [
    makeBrazier(kit, ctx, -2.5, Z0 + 0.95, true), // à esquerda da porta
    makeBrazier(kit, ctx, 2.5, Z0 + 0.95, true), // à direita da porta
    makeBrazier(kit, ctx, -3.0, -6.3, true), // meio da parede esquerda
  ];
  for (const b of bz) S.boxes.push(...b.boxes);
  // o 4º: num nicho alto, em cima do arco da entrada (atrás de quem entra)
  const NY = 3.02;
  const NZ = Z1 - 0.28;
  kit.box(1.0, 0.14, 0.5, kit.stone, 0, NY, NZ);
  kit.box(1.2, 0.08, 0.56, kit.stone, 0, NY - 0.11, NZ);
  const nb = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.2, 0.2, 8), lambert(null, 0x3a3a46));
  nb.position.set(0, NY + 0.17, NZ);
  kit.add(nb);
  const nFlame = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
  nFlame.scale.set(0.5, 0.42, 1);
  nFlame.position.set(0, NY + 0.48, NZ);
  kit.group.add(nFlame);
  const nLight = kit.light(0, NY + 0.4, NZ - 0.5, 0xff8a2a, 36);

  // ── o dado de pedra, meio enterrado (UM em cima, DOIS e TRÊS dos lados) ──
  {
    const blank = lambert(dieFaceTex([]));
    const mats = [blank, lambert(dieFaceTex([0, 8])), lambert(dieFaceTex([4])), blank, lambert(dieFaceTex([0, 4, 8])), blank];
    const d = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), mats);
    d.position.set(2.55, 0.36, -7.1);
    d.rotation.set(-0.07, 0.12, 0.1);
    kit.add(d);
    kit.contact(2.55, -7.1, 1.8);
    S.boxes.push(mkBox(2.0, 0, -7.65, 3.1, 0.9, -6.55));
    kit.rects.push([2.0, -7.65, 3.1, -6.55]);
  }

  // ── a grade de ferro (sobe quando a lousa 1 é escrita) ──
  const grate = new THREE.Group();
  kit.group.add(grate);
  const iron = lambert(null, 0x2a2a30);
  for (let x = X0 + 0.15; x < X1; x += 0.28) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, H, 0.05), iron);
    b.position.set(x, H / 2, GRATE_Z);
    grate.add(b);
  }
  for (const y of [0.35, 1.4, 2.5, 3.5]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0, 0.07, 0.08), iron);
    b.position.set(0, y, GRATE_Z);
    grate.add(b);
  }
  const grateBox = mkBox(X0, 0, GRATE_Z - 0.1, X1, H, GRATE_Z + 0.1);
  S.boxes.push(grateBox);
  let grateK = 0;
  let grateUp = false;

  // ── as lousas ──
  const boards: WallBoard[] = [];
  const mkCopy = (z: number, target: string, key: string) => {
    const b = makeWallBoard(kit, ctx, { x: X1 - 0.02, y: 1.45, z, nx: -1, nz: 0, key });
    boards.push(b);
    // o glifo talhado ao lado (à direita de quem lê = rumo à entrada)
    const ins = kit.inscribe({ words: [target], x: X1 - 0.025, y: 1.45, z: z + 1.0, nx: -1, nz: 0, size: 0.42, age: 0.15, frame: true, seed: 5 + z * 3 });
    return { b, ins, target, key, solved: false, idle: 0 };
  };
  const L1 = mkCopy(0.1, 'n2', 'lousa1');
  const L2 = mkCopy(-4.3, 'n3', 'lousa2');
  kit.torch(X0 + 0.1, 1.9, 0.2, 1, 0, 0.7);
  kit.torch(X1 - 0.1, 1.9, -2.6, -1, 0, 1.9);

  // a lousa secreta (S1): parede esquerda, atrás da coluna; soquete frio, um dado de cinco pontos talhado acima
  const SZ = -3.95;
  const SB = makeWallBoard(kit, ctx, { x: X0 + 0.02, y: 1.35, z: SZ, nx: 1, nz: 0, cold: true, key: 'lousaS' });
  boards.push(SB);
  kit.inscribe({ words: ['n5'], x: X0 + 0.025, y: 2.35, z: SZ, nx: 1, nz: 0, size: 0.34, age: 0.4, frame: true, seed: 71 });
  kit.box(0.14, 0.26, 0.22, kit.stone, X0 + 0.07, 1.35, SZ + 1.0, false); // o soquete frio: pedra sem brasa
  let bonus = false;
  const niche = makeGemNiche(kit, ctx, X0 + 0.02, 1.25, SZ - 1.35, 1, 0, () => (bonus = true));
  const secret = { b: SB, target: 'n5', key: 'lousaS', solved: false, idle: 0 };

  // ── a porta-lousa: nove pontinhos de bronze na própria laje (sobem com ela) ──
  const DB = makeWallBoard(kit, ctx, { x: 0, y: 1.2, z: Z0 - 0.035, nx: 0, nz: 1, step: 0.42, bronze: true, key: 'porta' });
  DB.setDim(0);
  boards.push(DB);
  const sign = kit.inscribe({ words: ['acender', null, 'brasa'], x: 0, y: 3.3, z: Z0 + 0.025, nx: 0, nz: 1, size: 0.42, age: 0.25, seed: 9, lead: true });
  const live = makeLivePanel(sign);
  live.draw([]);
  let doorIdle = 0;
  let solved = false;
  let doorOpen = 0;
  let prevWant = 0;
  let readT = 0;
  let rejectT = 0;
  const gate = shotGate(ctx.die);

  const updateCopy = (c: { b: WallBoard; target: string; key: string; solved: boolean; idle: number }, dt: number, onSolve: () => void) => {
    if (c.solved) return;
    const i = c.b.hit();
    if (i >= 0 && gate.take() && !c.b.grid.lit[i]) {
      c.b.grid.ignite(i);
      ctx.sfx('ignite', c.key);
      c.idle = 0;
    }
    const pts = c.b.grid.points();
    if (pts.length && c.b.grid.writes(c.target)) {
      c.solved = true;
      ctx.sfx('piece');
      onSolve();
    } else if (pts.length) {
      c.idle += ctx.paused() ? 0 : dt;
      // 5 s sem lampião novo e o desenho não bate: apaga, sem pena (sala de ensino)
      if (c.idle > 5) {
        c.b.grid.clear();
        ctx.sfx('burnout');
        c.idle = 0;
      }
    }
  };

  const reset = () => {
    for (const b of boards) b.grid.clear();
    L1.solved = L2.solved = false;
    L1.idle = L2.idle = 0;
    secret.solved = false;
    secret.idle = 0;
    niche.reset();
    DB.setDim(0);
    grateUp = false;
    grateK = 0;
    solved = false;
    doorOpen = 0;
    prevWant = 0;
    readT = 0;
    doorIdle = 0;
    rejectT = 0;
    S.door.setOpen(0);
    S.door.lampMats.forEach((m) => m.color.setHex(LAMP_OFF));
    for (const p of [...sign.panels, ...L1.ins.panels, ...L2.ins.panels]) p.fire = 0;
    live.draw([]);
  };

  S.decorate();
  if (import.meta.env.DEV) {
    ((globalThis as Record<string, unknown>).__lousa = () => ({ l1: L1.solved, l2: L2.solved, s1: secret.solved, door: DB.grid.points(), solved, grate: +grateK.toFixed(2), cells: (k: number) => [L1.b, L2.b, DB, SB][k] && [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => [L1.b, L2.b, DB, SB][k].cellPos(i).toArray().map((v) => +v.toFixed(2))) }));
  }
  kit.bake();

  return {
    name: 'A Lousa',
    subtitle: 'Nove lampiões. Um desenho.',
    group: kit.group,
    surfaces: kit.surfaces,
    emitters: kit.emitters,
    inscriptions: kit.inscriptions,
    interactables: [niche.interactable],
    doorZ: Z0,
    entranceZ: Z1,
    start: new THREE.Vector3(0, 0, 1.2),
    startYaw: 0,
    fog: { color: '#0a0a11', near: 3.5, far: 16 },
    ambient: { color: 0x706ea8, intensity: 1.6 },
    boxes: [...S.boxes, ...kit.boxes],
    sockets: bz.map((b) => b.socket),
    rects() {
      const r = S.rects(doorOpen);
      r.push(...bz.map((b) => b.rect));
      if (grateK < 0.75) r.push([X0 - 1, GRATE_Z - 0.12, X1 + 1, GRATE_Z + 0.12]);
      return r;
    },
    clampDie: S.clampDie,
    groundY: () => 0,
    surfaceAt: (x, z) => kit.surfaceAt(x, z),
    dieFloor: () => 0,
    holdsDie: () => false,
    update(dt, t) {
      kit.tick(dt, t);
      gate.tick();
      for (const b of bz) b.update(t);
      nFlame.material.map = kit.frames[Math.floor(t * 8 + 3) % kit.frames.length];
      nLight.intensity = 36 * (0.97 + 0.03 * Math.sin(t * 5));
      for (const b of boards) b.update(dt, t);
      updateCopy(L1, dt, () => {
        grateUp = true;
        ctx.sfx('door');
        ctx.caption('A grade subiu', 'O desenho era o que estava talhado ao lado.', '#ffd36b');
      });
      updateCopy(L2, dt, () => {
        DB.setDim(1);
        ctx.caption('A porta acordou', 'Os pontinhos da porta também acendem.', '#ffd36b');
      });
      updateCopy(secret, dt, () => {
        niche.open();
        ctx.caption('Algo se abriu na parede', 'Cinco pontos. Como no dado talhado.', '#7ad8ff');
      });
      // copiar → brilhar o glifo talhado
      for (const c of [L1, L2]) for (const p of c.ins.panels) p.fire = (p.fire ?? 0) + ((c.solved ? 1 : 0) - (p.fire ?? 0)) * Math.min(1, dt * 4);
      if (grateUp && grateK < 1) grateK = Math.min(1, grateK + dt / 2.4);
      grate.position.y = grateK * (H - 0.3);
      grateBox.min.y = grateK * (H - 0.3);
      niche.update(dt, t);

      // ── a porta-lousa ──
      DB.lift = doorOpen * (2.65 + 0.2);
      if (!solved) {
        const i = DB.hit();
        if (i >= 0 && gate.take()) {
          if (!DB.grid.lit[i]) {
            DB.grid.ignite(i);
            ctx.sfx('ignite', 'porta');
            doorIdle = 0;
          }
        } else if (!L2.solved && ctx.die.face === 3 && ctx.die.state !== 'hand') {
          // adormecida: o dado só bate seco nos pontinhos
          const d = ctx.die.pos;
          if (Math.abs(d.z - (Z0 + 0.25)) < 0.12 && Math.abs(d.x) < 0.8 && d.y > 0.4 && d.y < 2 && gate.take()) ctx.sfx('error');
        }
        const pts = DB.grid.points();
        if (pts.length && DB.grid.writes('n4')) {
          // a frase ficou verdadeira: ACENDER QUATRO BRASEIRO
          solved = true;
          ctx.sfx('piece');
          S.door.lampMats[0].color.setHex(0xff7a2e);
        } else if (pts.length) {
          doorIdle += ctx.paused() ? 0 : dt;
          if (doorIdle > 6) {
            // a Casa lê e não aceita: a frase é falsa
            DB.grid.clear();
            ctx.sfx('error');
            ctx.caption('A Casa não aceitou', 'A frase tem de ser verdade.', '#cfc6e8');
            rejectT = 1.2;
            doorIdle = 0;
          }
        }
      }
      rejectT = Math.max(0, rejectT - dt);
      // a casa lisa copia a porta; ao abrir, a Casa lê a frase (palavra por palavra)
      readT = solved ? readT + dt : 0;
      live.draw(rejectT > 0 && Math.floor(rejectT * 8) % 2 ? [] : DB.grid.points(), [], solved ? '#ffd36b' : '#ffb048', solved ? 1.2 : 0.3);
      sign.panels.forEach((p, k) => {
        if (!p.id) return;
        const on = solved && readT > 0.2 + k * 0.45 ? 1 : p.id === 'acender' && DB.grid.points().length ? 0.6 : 0;
        p.fire = (p.fire ?? 0) + (on - (p.fire ?? 0)) * Math.min(1, dt * 6);
      });
      const want = solved && readT > 1.6 ? 1 : 0;
      if (want && !prevWant) ctx.sfx('door');
      prevWant = want;
      doorOpen += (want - doorOpen) * Math.min(1, dt * 2.4);
      S.door.setOpen(doorOpen);
    },
    reset,
    bonus: () => bonus,
    dispose() {},
  };
}
