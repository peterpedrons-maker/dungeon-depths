// R4 · A ESCADARIA (PUZZLES_PROPOSTAS.md §2b "R4" e Ficha 7). Respiro entre A Lei Pequena e O Fogo que Corre: sem trava.
// Um poço alto (12 m) com três lances de escada colados às paredes e três patamares: lance A (parede direita, sobe do chão ao patamar do fundo),
// lance B (parede esquerda, do fundo ao patamar da frente, por cima da entrada), lance C (parede direita de novo, por cima do A, até o patamar
// alto do fundo, onde está a porta). Janelas de grade dão para salas já feitas, vistas de cima (pinturas: A Casa Escreve com as 9 colunas, o
// fosso da Ponte, a capela do Pano). No patamar do meio, uma folha arrancada dela (p7). No alto, ao lado da porta, uma porta pequena com SEIS
// pontinhos de bronze, fechada (a face que a língua não tem; só abre num capítulo posterior).
import * as THREE from 'three';
import { floorTexture } from '../textures';
import { buildDoor, buildEntrance, doorFrame, Kit, lambert, T } from '../kit';
import { planDoors } from '../plan';
import { mkBox, slopedWall, stairs, wedge, Z1 } from './shell';
import { windNear } from '../ambience';
import { diary, diaryStore } from '../../story/diary';
import type { Box, Ctx, Interactable, Rect, Room } from '../types';

const X0 = -4;
const X1 = 4;
const Z0 = -8;
const H = 12;
const SX = 2.2; // largura dos lances: de |x| = 2,2 até a parede
const ZB = -6.5; // começo dos patamares do fundo
const ZF = -1.5; // fim do patamar da frente
const L1 = 3; // patamar do fundo (meio)
const L2 = 6; // patamar da frente
const L3 = 9; // patamar do alto (a porta)
const hA = (z: number) => L1 * Math.min(1, Math.max(0, -z / -ZB)); // z de 0 a ZB
const hB = (z: number) => L1 + (L2 - L1) * Math.min(1, Math.max(0, (z - ZB) / (ZF - ZB))); // de ZB a ZF
const hC = (z: number) => L2 + (L3 - L2) * Math.min(1, Math.max(0, (ZF - z) / (ZF - ZB))); // de ZF a ZB

// A PLANTA NOVA (DESIGN.md §73, passo 3): a porta sai pela parede ESQUERDA, no alto: uma GALERIA estreita no nível do patamar alto corre ao
// longo da parede esquerda (por cima do lance B e do patamar da frente) até a frente da sala, e a porta fica nela. Do outro lado da porta está a
// passarela da Biblioteca.
const PD = planDoors('A Escadaria');
const GAL = PD.exit.side === 'L'; // com a galeria e a porta de lado
const GZ1 = Z1; // a galeria vai até a parede da frente (assim não precisa de parapeito no fim, que barraria quem passa embaixo)
// os chãos possíveis em (x, z); o jogador fica no mais alto que estiver até 0,6 m acima dos pés
function floors(x: number, z: number): number[] {
  const out = [0];
  if (GAL && x < -SX && z >= ZB && z <= GZ1) out.push(L3);
  if (x > SX && z <= 0 && z >= ZB) out.push(hA(z));
  if (x < -SX && z >= ZB && z <= ZF) out.push(hB(z));
  if (x > SX && z >= ZB && z <= ZF) out.push(hC(z));
  if (z < ZB) out.push(L1, L3);
  if (z >= ZF && z <= Z1) out.push(L2);
  return out;
}
function groundY(x: number, z: number, feet = 0) {
  let best = 0;
  for (const h of floors(x, z)) if (h <= feet + 0.6 && h > best) best = h;
  return best;
}
// o dado: só os lances maciços (A e B) e o chão
function dieFloor(x: number, z: number) {
  if (x > SX && z <= 0 && z >= ZB) return hA(z);
  if (x < -SX && z >= ZB && z <= ZF) return hB(z);
  return 0;
}

function paint(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// as vistas das janelas (de cima, ao longe, na penumbra)
const VIEWS: Record<string, (g: CanvasRenderingContext2D, w: number, h: number) => void> = {
  // A Casa Escreve: o salão de nove colunas em grade, visto do alto
  casa: (g, w, h) => {
    g.fillStyle = '#1a1622';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a2432';
    for (let y = 0; y < h; y += 6) for (let x = (y / 6) % 2 ? 0 : 6; x < w; x += 12) g.fillRect(x, y, 6, 6);
    for (let i = 0; i < 9; i++) {
      const cx = w * (0.25 + 0.25 * (i % 3));
      const cy = h * (0.25 + 0.25 * Math.floor(i / 3));
      g.fillStyle = '#0c0a10';
      g.fillRect(cx - 5, cy - 3, 12, 12);
      g.fillStyle = '#6a6478';
      g.fillRect(cx - 6, cy - 6, 12, 12);
      g.fillStyle = '#8a8496';
      g.fillRect(cx - 4, cy - 4, 8, 8);
    }
    g.fillStyle = '#ff9a40';
    g.fillRect(w * 0.75 - 2, h * 0.5 + 8, 3, 3); // um braseiro aceso ao pé de uma coluna
  },
  // A Ponte: o fosso redondo, a rampa em espiral e a cruz acesa lá embaixo
  ponte: (g, w, h) => {
    g.fillStyle = '#0c0a10';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#4a4456';
    g.lineWidth = 6;
    for (let r = w * 0.42; r > w * 0.12; r -= w * 0.1) {
      g.beginPath();
      g.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = '#ff9a40';
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) g.fillRect(w / 2 + dx * 9 - 2, h / 2 + dy * 9 - 2, 4, 4);
  },
  // O Pano: a capela comprida, os pilares e um pano queimado
  pano: (g, w, h) => {
    g.fillStyle = '#16121c';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a2432';
    g.fillRect(w * 0.15, 0, w * 0.7, h);
    for (const [x, y] of [[0.3, 0.2], [0.5, 0.2], [0.7, 0.2], [0.3, 0.8], [0.5, 0.8], [0.7, 0.8]]) {
      g.fillStyle = '#7a7486';
      g.fillRect(w * x - 4, h * y - 4, 8, 8);
    }
    g.fillStyle = '#8a3040';
    g.fillRect(w * 0.82, h * 0.4, 6, 14);
    g.fillStyle = '#ffb048';
    g.fillRect(w * 0.82, h * 0.4 + 12, 6, 2);
  },
};
function windowAt(kit: Kit, view: string, x: number, y: number, z: number, nx: number, nz: number) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = Math.atan2(nx, nz);
  kit.group.add(g);
  // o vão (recuado) com a vista
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.9), new THREE.MeshBasicMaterial({ map: paint(64, 52, VIEWS[view]), fog: true }));
  pic.position.z = -0.06;
  g.add(pic);
  // o batente de pedra
  for (const [fx, fy, w, h] of [[-0.62, 0, 0.16, 1.18], [0.62, 0, 0.16, 1.18], [0, 0.53, 1.4, 0.14], [0, -0.53, 1.4, 0.16]] as [number, number, number, number][]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.14), kit.slab);
    m.position.set(fx, fy, 0.05);
    g.add(m);
  }
  // a grade
  const iron = lambert(null, 0x24222a);
  for (let k = -2; k <= 2; k++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.92, 0.04), iron);
    b.position.set(k * 0.2, 0, 0.0);
    g.add(b);
  }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.04, 0.04), iron);
  g.add(bar);
}

export function buildRespiro4(ctx: Ctx): Room {
  const kit = new Kit('crypt');
  const W = X1 - X0;
  const L = Z1 - Z0;
  const zm = (Z0 + Z1) / 2;
  kit.plane(W, L, lambert(floorTexture([W / T, L / T], 'crypt')), 0, 0, zm, -Math.PI / 2);
  kit.plane(W, L, kit.brick([W / T, L / T], 0.6, 19), 0, H, zm, Math.PI / 2);
  const entrance = buildEntrance(kit, { x0: X0, x1: X1, z: Z1, h: H });
  const DZ = PD.exit.at;
  const DSPAN = 1.6;
  if (GAL) {
    // a parede esquerda em volta da peça da porta (lá em cima) e o fundo inteiro
    kit.plane(DZ - DSPAN - Z0, H, kit.brick([(DZ - DSPAN - Z0) / T, H / T], 0.95, 33), X0, H / 2, (Z0 + DZ - DSPAN) / 2, 0, Math.PI / 2);
    kit.plane(Z1 - DZ - DSPAN, H, kit.brick([(Z1 - DZ - DSPAN) / T, H / T], 0.95, 34), X0, H / 2, (DZ + DSPAN + Z1) / 2, 0, Math.PI / 2);
    kit.plane(2 * DSPAN, L3, kit.brick([(2 * DSPAN) / T, L3 / T], 0.95, 36), X0, L3 / 2, DZ, 0, Math.PI / 2);
    kit.plane(W, H, kit.brick([W / T, H / T], 0.95, 41), 0, H / 2, Z0, 0, 0);
  } else {
    kit.plane(L, H, kit.brick([L / T, H / T], 0.95, 33), X0, H / 2, zm, 0, Math.PI / 2);
    kit.plane(W, L3, kit.brick([W / T, L3 / T], 0.95, 41), 0, L3 / 2, Z0, 0, 0); // a parede do fundo, abaixo da porta
  }
  kit.plane(L, H, kit.brick([L / T, H / T], 0.95, 39), X1, H / 2, zm, 0, -Math.PI / 2);
  const door = buildDoor(kit, GAL ? { x0: 0, x1: 0, z0: 0, y0: L3, h: H - L3, lamps: 1, connected: true, frame: doorFrame('L', DZ, X0, X1, DZ - DSPAN, DZ + DSPAN) } : { x0: X0, x1: X1, z0: Z0, y0: L3, h: H - L3, lamps: 1, connected: true });
  door.setOpen(1);
  door.lampMats[0].color.setHex(0xff7a2e);
  const boxes: Box[] = [];
  // os lances (degraus de verdade) e o que os sustenta
  boxes.push(...stairs(kit, { x0: SX, x1: X1, zLow: 0, zHigh: ZB, yHigh: L1, n: 14 }));
  kit.add(wedge(X0, ZB, -SX, ZF, (_x, z) => hB(z) - 0.02, kit.stone, kit.stone));
  boxes.push(...stairs(kit, { x0: X0, x1: -SX, zLow: ZB, zHigh: ZF, yLow: L1, yHigh: L2, n: 12 }));
  boxes.push(...stairs(kit, { x0: SX, x1: X1, zLow: ZF, zHigh: ZB, yLow: L2, yHigh: L3, n: 12 }));
  kit.add(wedge(SX, ZB, X1, ZF, (_x, z) => hC(z) - 0.32, kit.stone, kit.stone, (_x, z) => hC(z) - 0.62)); // a laje inclinada sob o lance C
  // os patamares (lajes de pedra apoiadas em mísulas)
  for (const [y, z0, z1] of [
    [L1, Z0, ZB],
    [L2, ZF, Z1],
    [L3, Z0, ZB],
  ] as [number, number, number][]) {
    kit.box(W, 0.3, z1 - z0, kit.slab, 0, y - 0.15, (z0 + z1) / 2);
    boxes.push(mkBox(X0, y - 0.3, z0, X1, y, z1));
    for (const x of [-2.6, 0, 2.6]) kit.box(0.4, 0.4, 0.3, kit.stone, x, y - 0.5, z0 < Z0 + 0.1 ? Z0 + 0.15 : z1 - 0.15, false);
  }
  // MURETAS na borda de dentro dos lances e dos patamares do fundo (sem elas, um passo em falso e o jogador cai no fundo do poço)
  boxes.push(...slopedWall(kit, { x0: SX - 0.16, z0: ZB, x1: SX, z1: 0, top: (_x, z) => hA(z) + 0.9, segs: 6 }));
  boxes.push(...slopedWall(kit, { x0: -SX, z0: ZB, x1: -SX + 0.16, z1: ZF, top: (_x, z) => hB(z) + 0.9, segs: 6 }));
  boxes.push(...slopedWall(kit, { x0: SX - 0.16, z0: ZB, x1: SX, z1: ZF, top: (_x, z) => hC(z) + 0.9, y0: L2 - 0.3, segs: 6 }));
  if (GAL) {
    // a GALERIA: laje de pedra lavrada sobre mísulas, encostada na parede esquerda, e a mureta do lado do poço
    const gl = GZ1 - ZB;
    const gx = (X0 - SX) / 2;
    kit.box(-SX - X0, 0.3, gl, kit.slab, gx, L3 - 0.15, (ZB + GZ1) / 2);
    boxes.push(mkBox(X0, L3 - 0.3, ZB, -SX, L3, GZ1));
    for (let z = ZB + 1.2; z < GZ1 - 0.4; z += 2.1) kit.box(0.5, 0.45, 0.3, kit.stone, X0 + 0.25, L3 - 0.52, z, false);
    kit.box(0.16, 0.9, gl, kit.stone, -SX - 0.08, L3 + 0.45, (ZB + GZ1) / 2);
    kit.box(0.22, 0.08, gl + 0.06, kit.slab, -SX - 0.08, L3 + 0.94, (ZB + GZ1) / 2, false);
    boxes.push(mkBox(-SX - 0.16, L3, ZB, -SX, L3 + 0.95, GZ1));
    kit.batenteX(X0, DZ, 1, L3);
  }
  for (const y of [L1, L3]) {
    kit.box(2 * SX, 0.9, 0.16, kit.stone, 0, y + 0.45, ZB - 0.08);
    kit.box(2 * SX + 0.06, 0.08, 0.22, kit.slab, 0, y + 0.94, ZB - 0.08, false);
    boxes.push(mkBox(-SX, y, ZB - 0.16, SX, y + 0.95, ZB));
  }
  // as janelas: cada uma num lance, à altura dos olhos de quem sobe
  windowAt(kit, 'casa', X0 + 0.02, hB(-4) + 1.75, -4, 1, 0);
  windowAt(kit, 'ponte', 1.2, L1 + 1.75, Z0 + 0.02, 0, 1);
  windowAt(kit, 'pano', X1 - 0.02, hC(-4) + 1.75, -4, -1, 0);
  // a porta dos SEIS pontos, ao lado da porta, no patamar alto (fechada)
  {
    const g = new THREE.Group();
    g.position.set(X0 + 0.02, L3, -7.25);
    g.rotation.y = Math.PI / 2;
    kit.group.add(g);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.12), lambert(null, 0x3a2a22));
    slab.position.set(0, 1.0, 0.02);
    g.add(slab);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.24, 2.2, 0.08), kit.slab);
    frame.position.set(0, 1.1, -0.02);
    g.add(frame);
    const bronze = new THREE.MeshLambertMaterial({ color: 0xb08040, emissive: 0x3a2008, emissiveIntensity: 0.4 });
    for (let k = 0; k < 6; k++) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 10), bronze);
      s.rotation.x = Math.PI / 2;
      s.position.set(k % 2 ? 0.2 : -0.2, 1.55 - Math.floor(k / 2) * 0.32, 0.1);
      g.add(s);
    }
  }
  // a folha dela, no patamar do meio
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.004, 0.3), lambert(null, 0xd8b880));
  leaf.position.set(-1.2, L1 + 0.01, -7.2);
  leaf.rotation.y = 0.4;
  kit.group.add(leaf);
  let taken = (diaryStore.get().pages ?? []).includes('p7');
  leaf.visible = !taken;
  const interactables: Interactable[] = [
    {
      pos: leaf.position.clone(),
      r: 1.6,
      label: 'Pegar a folha',
      enabled: () => !taken && Math.abs(ctx.feetY() - L1) < 0.4,
      use: () => {
        taken = true;
        leaf.visible = false;
        diary.addPage('p7');
        ctx.sfx('gem');
      },
    },
  ];
  // luz: tochas ao longo da subida e um feixe pálido que desce do alto
  kit.torch(X1 - 0.1, hA(-3.2) + 2.1, -3.2, -1, 0, 0.3);
  kit.torch(X0 + 0.1, hB(-2.6) + (GAL ? 1.6 : 2.1), -2.6, 1, 0, 1.1); // (com a galeria por cima, um pouco mais baixa)
  kit.torch(-2.6, L1 + 1.9, Z0 + 0.1, 0, 1, 1.9);
  kit.torch(X1 - 0.1, hC(-5.6) + 2.1, -5.6, -1, 0, 2.7);
  kit.torch(2.6, L3 + 1.9, Z0 + 0.1, 0, 1, 3.5);
  kit.light(0, H - 1, -3, 0xc8d6ff, 14);
  kit.beamDust(0, -3, 1.6, 0.2, H - 0.3, 40);
  kit.skirting(X0, X1, Z0, Z1, 1.3);
  kit.aoSides(X0, X1, Z0, Z1, H, 0);
  kit.cornice(X0, X1, Z0, Z1, H);
  kit.damp(X0, 2.0, -6, 1, 0, 1.8);
  kit.web(X1, H - 0.5, Z0 + 0.5, -1, 0);
  // colisão do jogador: os lances maciços (A e B, para quem está embaixo), em pedaços que sobem
  const rects: Rect[] = [[-SX, ZB - 0.18, SX, ZB + 0.02, L3 + 0.95]]; // as muretas dos patamares do fundo (quem está embaixo também não passa)
  // a mureta da galeria: só barra quem está nela (quem passa embaixo, no lance B e no patamar da frente, passa livre)
  if (GAL) rects.push([-SX - 0.18, ZB, -SX + 0.02, GZ1, L3 + 0.95, L3]);
  const N = 10;
  for (let k = 0; k < N; k++) {
    const a = (ZB * k) / N;
    const b = (ZB * (k + 1)) / N;
    // a altura de cada pedaço é a da sua ponta BAIXA (+10 cm): quem sobe pelo lance passa; quem está no chão ao lado, não entra
    rects.push([SX, b, X1, a, hA(a) + 0.1]);
    const c = ZB + ((ZF - ZB) * k) / N;
    const d = ZB + ((ZF - ZB) * (k + 1)) / N;
    rects.push([X0, c, -SX, d, hB(c) + 0.1]);
    // as muretas dos lances
    rects.push([SX - 0.18, b, SX + 0.02, a, Math.max(hA(b), hC(b)) + 0.9]);
    rects.push([-SX - 0.02, c, -SX + 0.18, d, hB(d) + 0.9]);
  }
  kit.bake();

  return {
    name: 'A Escadaria',
    subtitle: 'Muitos degraus.',
    group: kit.group,
    surfaces: kit.surfaces,
    emitters: kit.emitters,
    inscriptions: kit.inscriptions,
    interactables,
    doorZ: Z0,
    entranceZ: Z1,
    exit: door.exit,
    exitDy: L3,
    start: new THREE.Vector3(0, 0, 1.2),
    startYaw: 0,
    calm: (x, z) => Math.abs(x) < SX - 0.3 && z < Z1 - 1.2 && z > -3, // o pé do poço, entre os lances: o dado pode fazer a pergunta de IGUAL
    fog: { color: '#09090f', near: 5, far: 22 },
    ambient: { color: 0x7078a8, intensity: 1.7 },
    boxes: [...boxes, ...kit.boxes],
    rects() {
      const left: Rect[] = GAL ? [[X0 - 2, Z0, X0, DZ - DSPAN], [X0 - 2, DZ + DSPAN, X0, Z1 + 0.5], [X0 - 2, DZ - DSPAN, X0, DZ + DSPAN, L3 - 0.3]] : [[X0 - 2, Z0, X0, Z1 + 0.5]];
      return [...rects, ...kit.rects, ...entrance.rects(), ...door.rects(true), ...left, [X1, Z0, X1 + 2, Z1 + 0.5]];
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
    groundY,
    surfaceAt: (x, z) => kit.surfaceAt(x, z),
    // o som do lugar (§60): um poço alto de pedra, que ecoa muito; o ar corre pelas janelas de grade e venta mais quanto mais alto se sobe;
    // embaixo, junto da mancha de umidade, pinga
    ambience: {
      quiet: true, // (respiro: menos música, §79)
      size: 0.85,
      wind: (() => {
        const win = windNear([
          { x: X0, y: hB(-4) + 1.75, z: -4, r: 3.5, k: 0.32 },
          { x: 1.2, y: L1 + 1.75, z: Z0, r: 3.5, k: 0.32 },
          { x: X1, y: hC(-4) + 1.75, z: -4, r: 3.5, k: 0.32 },
        ]);
        return (x: number, z: number, f: number) => Math.max(win(x, z, f), 0.05 + 0.27 * Math.min(1, Math.max(0, f / L3)));
      })(),
      drips: [{ x: X0 + 0.3, y: 0.1, z: -6 }],
    },
    dieFloor,
    holdsDie: () => false,
    update(dt, t) {
      kit.tick(dt, t);
    },
    skip() {},
    isSolved: () => true,
    reset() {},
    dispose() {},
  };
}
