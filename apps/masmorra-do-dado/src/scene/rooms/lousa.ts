// SALA · A LOUSA (nível 2; PUZZLES_PROPOSTAS.md §5, verificador tools/verify_lousa.mjs).
// Acender em grade é ESCREVER, e os números são as faces do dado. Três passos:
//  1) lousa 1 (parede direita): copiar o DOIS talhado ao lado → a grade de ferro sobe e libera o resto da sala;
//  2) lousa 2: copiar o TRÊS → a porta-lousa acorda;
//  3) a PORTA é a lousa: «ACENDER ▢ BRASEIRO» tem de ficar VERDADEIRA. Há QUATRO braseiros acesos (um num nicho em cima da entrada,
//     atrás de quem entra). A resposta é QUATRO, que ninguém ensinou: a face quatro do dado (o dado de pedra no canto mostra UM, DOIS, TRÊS).
// Segredo S1: atrás da coluna esquerda, uma lousa de soquete frio sob um dado de CINCO pontos. Escrever CINCO abre um nicho com uma gema.

import * as THREE from 'three';
import { Kit, lambert, LAMP_OFF } from '../kit';
import { tallyTexture } from '../textures';
import { makeBrazier } from '../brazier';
import { makeGemNiche, makeLivePanel, makeWallBoard, type WallBoard } from '../firegrid';
import { mkBox, roomShell, shotGate } from './shell';
import type { Ctx, Room } from '../types';

function dieFaceTex(points: number[]) {
  // face do dado de PEDRA: pedra clara com a moldura gasta e os PONTOS talhados: cavidades REDONDAS, fundas (escuras), com a borda de baixo
  // clara (a luz pega no lábio de baixo) — precisam ler de longe: é a pista do puzzle (UM em cima, DOIS e TRÊS dos lados).
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
  const disc = (cx: number, cy: number, r: number, col: string) => {
    g.fillStyle = col;
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) g.fillRect(cx + x, cy + y, 1, 1);
  };
  for (const i of points) {
    const cx = 11 + (i % 3) * 13;
    const cy = 11 + Math.floor(i / 3) * 13;
    disc(cx, cy, 7, '#4a4440'); // o talho em volta (escuro: separa o ponto da pedra)
    disc(cx, cy + 1, 6, '#e2dcd0'); // o lábio de baixo, claro
    disc(cx, cy, 5, '#0c0a08'); // a cavidade funda, quase preta (a luz quente não a acende)
    disc(cx - 1, cy - 2, 1, '#2a2420');
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

  // QUADRO DE ESTILO (DIRECAO_DE_ARTE.md §6: "um corredor baixo onde alguém ensinava a contar"): abóbada baixa com arcos de reforço,
  // colunas com base e capitel, batentes grossos, um nicho, três pedras (tijolo, laje do chão, pedra lavrada), a luz do nicho alto com
  // sombra de verdade, poças de luz, fuligem, o caminho gasto, os riscos de um condenado contando os dias.
  const vaultY = S.vault(3.0, H - 0.03, 2.9);
  // colunas: a da esquerda esconde a lousa secreta de quem vem da grade
  S.pillar(-2.2, -3.0, 0.8, vaultY(-2.2));
  S.pillar(1.8, -5.6, 0.8, vaultY(1.8));
  kit.batente(0, Z1, -1);
  kit.batente(0, Z0, 1);

  // ── os quatro braseiros acesos pela Casa ──
  const bz = [
    makeBrazier(kit, ctx, -2.5, Z0 + 0.95, true), // à esquerda da porta
    makeBrazier(kit, ctx, 2.5, Z0 + 0.95, true, 1, 0, 1.3), // à direita da porta (poça menor: o dado de pedra está perto)
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
  const nLight = kit.light(0, NY + 0.4, NZ - 0.5, 0xff8a2a, 14);
  kit.soot(0, NY + 0.35, Z1, 0, -1, 0.8, 0.42);
  // a LUZ PRINCIPAL da sala: a chama do nicho alto projeta sombra (é ela que joga a sombra do jogador para a frente, quando ele entra:
  // a pista de que há um braseiro atrás dele). Mapa pequeno, filtro duro.
  const keyLight = new THREE.SpotLight(0xffa050, 46, 12.5, 1.2, 0, 1.15);
  keyLight.position.set(0, NY + 0.43, NZ - 0.36);
  keyLight.target.position.set(0, 0, -5.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(512, 512);
  keyLight.shadow.camera.near = 0.3;
  keyLight.shadow.camera.far = 15;
  keyLight.shadow.bias = -0.003;
  kit.group.add(keyLight, keyLight.target);
  kit.lightPool(0, 0.2, 2.6, 0, 0xffa050).opacity = 0.18;
  kit.beamDust(0, 0.4, 1.0, 0.3, 3.2, 30, 0xffe0b0); // poeira só no feixe da chama alta

  // ── o dado de pedra, meio enterrado (UM em cima, DOIS e TRÊS dos lados) ──
  // (mais longe do braseiro da direita: a poça e a luz dele não passam mais por cima do dado)
  const DX = 2.75;
  const DZ = -6.6;
  {
    // (as faces à vista: UM em cima, DOIS virado para o meio da sala (-x), TRÊS virado para quem vem da entrada (+z); a de cima é mais escura
    // na textura porque a chama alta e o braseiro batem direto nela, e antes ela estourava em laranja)
    const blank = lambert(dieFaceTex([]));
    const top = lambert(dieFaceTex([]), 0x8a8682);
    blank.color.setHex(0xb8b2ac); // (a pedra um pouco mais escura: o braseiro ao lado não a estoura)
    const mats = [blank, blank, top, blank, blank, blank]; // (os pontos são discos à parte, logo abaixo)
    const d = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), mats);
    d.position.set(DX, 0.36, DZ);
    d.rotation.set(-0.07, 0.12, 0.1);
    // os PONTOS de verdade: discos que não recebem luz (a chama alta e o braseiro do lado deixavam as cavidades da textura marrons), com um
    // aro claro de pedra lavrada em volta; legíveis de longe e no celular
    const pipMat = new THREE.MeshBasicMaterial({ color: 0x0a0808, fog: true });
    const lipMat = new THREE.MeshBasicMaterial({ color: 0x8a8478, fog: true });
    const pip = (n: THREE.Vector3, u: THREE.Vector3, v: THREE.Vector3, cells: number[]) => {
      for (const c of cells) {
        const a = ((c % 3) - 1) * 0.3;
        const b = (1 - Math.floor(c / 3)) * 0.3;
        const at = n.clone().multiplyScalar(0.553).addScaledVector(u, a).addScaledVector(v, b);
        for (const [r, m, k] of [[0.115, lipMat, 0], [0.085, pipMat, 0.008]] as [number, THREE.Material, number][]) {
          const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 14), m);
          disc.position.copy(at).addScaledVector(n, k);
          disc.lookAt(at.clone().add(n));
          d.add(disc);
        }
      }
    };
    pip(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, -1), [4]); // UM em cima
    pip(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0), [0, 8]); // DOIS para o meio da sala
    pip(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), [0, 4, 8]); // TRÊS para quem vem da entrada
    kit.add(d);
    kit.contact(DX, DZ, 2.0);
    // o chão em volta se partiu quando ele afundou: lascas de laje e pedrinhas
    const chip = lambert(null, 0x5e5752);
    for (const [cx0, cz0, sz, ry] of [[1.85, -6.6, 0.2, 0.3], [2.0, -7.75, 0.15, 1.1], [3.25, -6.75, 0.17, 2.0], [2.4, -6.35, 0.11, 0.7], [3.1, -7.75, 0.12, 1.6]] as [number, number, number, number][]) {
      const cx = Math.min(3.45, cx0 + DX - 2.55);
      const cz = cz0 + DZ + 7.1;
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(sz, 0), chip);
      m.position.set(cx, sz * 0.35, cz);
      m.rotation.set(ry, ry * 1.7, ry * 0.4);
      m.scale.y = 0.55;
      kit.add(m, false);
      kit.contact(cx, cz, sz * 3.4);
    }
    S.boxes.push(mkBox(DX - 0.55, 0, DZ - 0.55, DX + 0.55, 0.9, DZ + 0.55));
    kit.rects.push([DX - 0.55, DZ - 0.55, DX + 0.55, DZ + 0.55]);
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
  kit.soot(X0, 2.4, 0.2, 1, 0, 0.6, 1.1);
  kit.soot(X1, 2.4, -2.6, -1, 0, 0.6, 1.1);
  kit.lightPool(X0 + 0.7, 0.2, 1.4, 0, 0xff9a3c).opacity = 0.2;
  kit.lightPool(X1 - 0.7, -2.6, 1.4, 0, 0xff9a3c).opacity = 0.2;
  // fuligem acima dos três braseiros do chão (os da porta enegrecem a parede do fundo; o do meio, a parede esquerda)
  kit.soot(-2.5, 1.55, Z0, 0, 1, 1.0, 1.9);
  kit.soot(2.5, 1.55, Z0, 0, 1, 1.0, 1.9);
  kit.soot(X0, 1.55, -6.3, 1, 0, 1.0, 1.4);
  // a pedra lavrada em volta das duas lousas (a moldura talhada)
  for (const z of [0.1, -4.3]) kit.box(0.016, 1.95, 1.95, kit.slab, X1 - 0.008, 1.45, z, false); // (fina e atrás da lousa: a lousa fica 3 cm à frente dela)
  // RISCOS DE GIZ: um condenado contou os dias aqui, ao lado da 1ª lousa (baixo, como quem está sentado no chão)
  {
    const t = tallyTexture(23);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.36), new THREE.MeshBasicMaterial({ map: t, color: 0x9a948a, transparent: true, alphaTest: 0.3, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -3 }));
    m.position.set(X1 - 0.022, 0.72, -0.95);
    m.rotation.y = -Math.PI / 2;
    kit.group.add(m);
  }
  // o NICHO da parede esquerda: uma tigela e um toco de vela apagado (alguém morou aqui)
  {
    const g = kit.niche(X0, 1.0, -0.9, 1, 0);
    const clay = lambert(null, 0x7a4e34);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.09, 0.1, 8, 1, true), clay);
    bowl.position.set(-0.12, 0.05, 0.15);
    g.add(bowl);
    const bowlIn = new THREE.Mesh(new THREE.CircleGeometry(0.14, 8), lambert(null, 0x2a1a12));
    bowlIn.rotation.x = -Math.PI / 2;
    bowlIn.position.set(-0.12, 0.08, 0.15);
    g.add(bowlIn);
    const wax = lambert(null, 0xd8ccb0);
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.14, 6), wax);
    candle.position.set(0.16, 0.07, 0.13);
    g.add(candle);
    const drip = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.015, 7), wax);
    drip.position.set(0.17, 0.008, 0.14);
    g.add(drip);
    const wick = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.025, 0.008), lambert(null, 0x111111));
    wick.position.set(0.16, 0.15, 0.13);
    g.add(wick);
  }
  // o caminho GASTO de quem passou: da entrada até a porta, desviando das colunas
  kit.wear([[0, 1.7], [0.25, -1.2], [-0.15, -4.3], [0.1, -7.2], [0, -9.1]], 1.25);

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
  // sombras: a luz do nicho alto bate em tudo; projetam as coisas sólidas (não os decalques, as chamas nem o próprio nicho alto)
  kit.group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.Material;
    if (mat.transparent || (mat as THREE.MeshBasicMaterial).isMeshBasicMaterial) return;
    m.receiveShadow = true;
    const p = new THREE.Vector3();
    m.getWorldPosition(p);
    if (p.y > NY - 0.2 && Math.abs(p.z - NZ) < 0.6) m.castShadow = false; // o nicho alto não faz sombra na própria luz
    else if (m.geometry.type !== 'PlaneGeometry' && m.geometry.type !== 'ShapeGeometry') m.castShadow = true;
  });

  return {
    name: 'A Lousa',
    subtitle: 'Nove lampiões. Alguém ensinava alguém a contar, aqui?',
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
    ambient: { color: 0x6a68a0, intensity: 1.15 }, // escuro de verdade entre as poças de luz
    shadowLight: keyLight,
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
      nLight.intensity = 14 * (0.97 + 0.03 * Math.sin(t * 5));
      keyLight.intensity = 46 * (0.96 + 0.03 * Math.sin(t * 5) + 0.015 * Math.sin(t * 11.3));
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
