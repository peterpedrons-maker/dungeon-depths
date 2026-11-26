// RESPIRO R1 · O CORREDOR DOS NICHOS e O PÁTIO DA CISTERNA (PUZZLES_PROPOSTAS.md §2b): a primeira área LIVRE do jogo, entre O Fio de Fogo e
// A Casa Escreve. Sem trava na porta: nada é obrigatório. Anda-se, olha-se, lê-se, acha-se coisas.
//  · O corredor vira várias vezes; nichos nas paredes com objetos velhos e velas; acima de cada nicho «ACENDER BRASEIRO» (num deles a pedra caiu e
//    só sobrou ACENDER). Dados talhados mostram as faces 1, 2, 3, (nicho vazio), 5; ao lado do vazio, uma lousa: escrever QUATRO abre o nicho
//    com uma FOLHA ARRANCADA do caderno dela (p1). Um mural com figura ensina ANTES · AGORA · DEPOIS. Por uma janela de grade, o Escrivão passa
//    numa galeria distante, devagar, e some. Num nicho, uma tapeçaria pequena com um glifo tecido (semente: só faz sentido depois da sala 8).
//  · O pátio: alto, aberto, com uma galeria em cada lado (sobe-se por rampas), uma câmara lateral no alto (folha p2), uma cisterna redonda no meio
//    e, lá no alto, um buraco redondo de luz. Um relevo: «CONTÁVEIS ACENDER BRASEIRO». Puzzle opcional (o reflexo): uma pedra com DOIS na beira
//    da cisterna; quatro braseiros nos cantos do pátio se refletem na água; quem acende a diagonal "certa" vê a OUTRA na água (o reflexo inverte
//    de cima para baixo). Solução: o canto do FUNDO À DIREITA e o da FRENTE À ESQUERDA; na água aparece o DOIS e sobe uma gema.

import * as THREE from 'three';
import { buildDoor, buildEntrance, Kit, lambert, T } from '../kit';
import { floorTexture } from '../textures';
import { makeBrazier, type Brazier } from '../brazier';
import { makeGemNiche, makeWallBoard } from '../firegrid';
import { makeScribe } from '../scribe';
import { diary, diaryStore } from '../../story/diary';
import { drawGlyph } from '../../book/font';
import { glyphsOf } from '../../story/lexicon';
import { mkBox, shotGate, slopedWall, stairs } from './shell';
import type { Box, Ctx, Interactable, Rect, Room } from '../types';
import { makePointAsk } from '../pointask';
import { windNear } from '../ambience';
import type { Inscription } from '../inscription';

const Z1 = 2;
const Z0 = -26; // a porta (parede do fundo do pátio)
const CH = 2.8; // teto do corredor
const PH = 10; // altura do pátio
const GAL = 3.2; // altura das galerias
// as galerias vão de GZ até a parede norte do pátio (−12); as escadas sobem de SZ (chão) até GZ. O pé da escada fica a 2,5 m da parede do fundo
// (antes começava a 0,5 m, e com o braseiro do canto na frente sobrava uma fresta junto da parede para chegar ao 1º degrau).
const GZ = -18;
const SZ = -23.5;
// ── o corredor em células de 2 m: célula (ix, iz) cobre x ∈ [2ix-1, 2ix+1], z ∈ [2-2(iz+1), 2-2iz] ──
const CELLS: [number, number][] = [
  [0, 0], [0, 1], [0, 2], // entra e desce
  [-1, 2], [-2, 2], [-3, 2], // vira à esquerda
  [-3, 3], [-3, 4], [-3, 5], // desce
  [-2, 5], [-1, 5], [0, 5], [1, 5], // vira à direita
  [1, 6], // desce e se abre no pátio
];
const isCell = (ix: number, iz: number) => CELLS.some(([a, b]) => a === ix && b === iz);
const cx = (ix: number) => 2 * ix;
const cz = (iz: number) => 1 - 2 * iz;
const CIST = { x: 0, z: -19, r: 1.8 };
const stairY = (z: number) => (GAL * (z - SZ)) / (GZ - SZ);
const COURT = { x0: -7, x1: 7, z0: Z0, z1: -12 };
const CHAMBER = { x0: 7, x1: 9.6, z0: -17.5, z1: -14 };

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// relevo talhado (sulco escuro + cal) de um desenho em traços
function carve(g: CanvasRenderingContext2D, paths: [number, number][][], w = 2) {
  for (const [color, lw, dx] of [['#15110f', w + 2, 1], ['#e9e1cc', w, 0]] as [string, number, number][]) {
    g.strokeStyle = color;
    g.lineWidth = lw;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const p of paths) {
      g.beginPath();
      p.forEach(([x, y], i) => (i ? g.lineTo(x + dx, y + dx) : g.moveTo(x + dx, y + dx)));
      g.stroke();
    }
  }
}
// um braseiro desenhado (para os murais); `lit` = com chamas
const brazierPaths = (x: number, y: number, s: number, lit: boolean): [number, number][][] => {
  const P = (pts: [number, number][]) => pts.map(([a, b]) => [x + a * s, y + b * s] as [number, number]);
  const out = [P([[-6, 14], [-5, 4], [5, 4], [6, 14]]), P([[-10, -2], [-6, 4], [6, 4], [10, -2], [-10, -2]])];
  if (lit) out.push(P([[-5, -2], [-4, -9], [-1, -5], [0, -14], [2, -6], [4, -10], [5, -2]]));
  return out;
};

export function buildRespiro1(ctx: Ctx): Room {
  const kit = new Kit('ruin');
  const boxes: Box[] = [];
  const rects: Rect[] = [];
  const interactables: Interactable[] = [];
  let reliefIns: Inscription | null = null; // «CONTÁVEIS ACENDER BRASEIRO», no pátio: o dado a lê e pergunta «BRASEIRO ONDE ?»
  const brick = (w: number, h: number, seed: number) => kit.brick([w / T, h / T], 0.95, seed);
  const floorM = lambert(floorTexture([1 / T, 1 / T], 'ruin'));

  // ══ O CORREDOR ══
  const wallAt = (x: number, z: number, nx: number, nz: number, w: number, h: number, y0 = 0, seed = 33) => {
    const m = kit.plane(w, h, brick(w, h, seed), x, y0 + h / 2, z, 0, Math.atan2(nx, nz));
    return m;
  };
  for (const [ix, iz] of CELLS) {
    const x = cx(ix);
    const z = cz(iz);
    const f = kit.plane(2, 2, floorM, x, 0, z, -Math.PI / 2);
    void f;
    kit.plane(2, 2, brick(2, 2, 19), x, CH, z, Math.PI / 2);
    // paredes onde a célula vizinha não é corredor (a entrada e a saída para o pátio ficam abertas)
    const sides: [number, number, number, number][] = [
      [1, 0, x + 1, z],
      [-1, 0, x - 1, z],
      [0, 1, x, z - 1],
      [0, -1, x, z + 1],
    ];
    for (const [dx, dz, wx, wz] of sides) {
      const nix = ix + dx;
      const niz = iz + dz;
      if (isCell(nix, niz)) continue;
      if (ix === 0 && iz === 0 && dz === -1) continue; // a entrada
      if (ix === 1 && iz === 6 && dz === 1) continue; // a saída para o pátio
      if (ix === -3 && iz === 4 && dx === -1) continue; // a janela de grade (feita à parte)
      wallAt(wx, wz, -dx, dz, 2, CH, 0, 30 + ix * 3 + iz);
    }
  }
  // células que não são corredor: sólidas para o jogador e para o dado
  for (let ix = -4; ix <= 4; ix++)
    for (let iz = 0; iz <= 6; iz++) {
      if (isCell(ix, iz)) continue;
      const x = cx(ix);
      const z = cz(iz);
      rects.push([x - 1, z - 1, x + 1, z + 1]);
      boxes.push(mkBox(x - 1, 0, z - 1, x + 1, CH, z + 1));
    }
  const entrance = buildEntrance(kit, { x0: -1, x1: 1, z: Z1, h: CH });

  // nichos: moldura de pedra saliente, fundo escuro, prateleira, um objeto e uma vela
  const candleLights: { e: ReturnType<typeof kit.light>; s: THREE.Sprite; ph: number }[] = [];
  const niche = (x: number, z: number, nx: number, nz: number, obj: 'tigela' | 'giz' | 'corrente' | 'nada' | 'pano') => {
    const g = new THREE.Group();
    g.position.set(x, 1.15, z);
    g.rotation.y = Math.atan2(nx, nz);
    kit.group.add(g);
    for (const [fx, fy, w, h] of [[-0.36, 0, 0.12, 0.8], [0.36, 0, 0.12, 0.8], [0, 0.43, 0.84, 0.12], [0, -0.43, 0.84, 0.12]]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.18), kit.stone);
      m.position.set(fx, fy, 0.09);
      g.add(m);
    }
    const back = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.76), lambert(null, 0x1c1a24));
    back.position.z = 0.01;
    g.add(back);
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.22), kit.stone);
    shelf.position.set(0, -0.33, 0.11);
    g.add(shelf);
    if (obj === 'tigela') {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.07, 0.09, 8), lambert(null, 0x6a5a48));
      b.position.set(-0.05, -0.26, 0.1);
      g.add(b);
    } else if (obj === 'giz') {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.05), lambert(null, 0xd8d0c0));
      b.position.set(0.02, -0.285, 0.1);
      b.rotation.y = 0.5;
      g.add(b);
    } else if (obj === 'corrente') {
      for (let k = 0; k < 6; k++) {
        const l = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 4, 8), lambert(null, 0x5a5a60));
        l.position.set(-0.12 + k * 0.05, -0.28, 0.1);
        l.rotation.set(k % 2 ? Math.PI / 2 : 0, 0.3, 0);
        g.add(l);
      }
    } else if (obj === 'pano') {
      // a tapeçaria pequena com um glifo tecido (semente: só se entende depois da sala 8, que ensina que pano queima)
      const t = canvasTex(32, 40, (c) => {
        c.fillStyle = '#5a1f2e';
        c.fillRect(0, 0, 32, 36);
        c.fillStyle = 'rgba(0,0,0,0.25)';
        for (let y = 0; y < 36; y += 2) c.fillRect(0, y, 32, 1);
        c.fillStyle = '#c9a24a';
        c.fillRect(0, 2, 32, 1);
        c.fillRect(0, 33, 32, 1);
        for (let x = 1; x < 32; x += 3) c.fillRect(x, 36, 1, 3 + (x % 2));
        drawGlyph(c, glyphsOf('porta')[0], 16, 18, 22, '#f0d488');
      });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.55), new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide }));
      p.position.set(0, 0.02, 0.03);
      g.add(p);
    }
    if (obj !== 'pano') {
      const cnd = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 6), lambert(null, 0xe8dcc0));
      cnd.position.set(0.2, -0.255, 0.1);
      g.add(cnd);
      const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
      fl.scale.set(0.08, 0.1, 1);
      fl.position.set(0.2, -0.17, 0.1);
      g.add(fl);
      const wx = x + nx * 0.3 + Math.cos(g.rotation.y) * 0.2;
      const wz = z + nz * 0.3 - Math.sin(g.rotation.y) * 0.2;
      candleLights.push({ e: kit.light(wx, 1.1, wz, 0xffb060, 9), s: fl, ph: x * 3 + z });
    }
    return g;
  };
  // as inscrições acima dos nichos: «ACENDER BRASEIRO»; numa delas a pedra caiu
  const over = (x: number, z: number, nx: number, nz: number, broken: boolean, seed: number) =>
    kit.inscribe({ words: broken ? ['acender'] : ['acender', 'brasa'], x: x + nx * 0.02, y: 2.15, z: z + nz * 0.02, nx, nz, size: 0.24, age: broken ? 0.6 : 0.35, seed });
  // os dados talhados (as faces 1, 2, 3, ..., 5) ao lado dos nichos
  const dieFace = (x: number, z: number, nx: number, nz: number, n: string, seed: number) => kit.inscribe({ words: [n], x: x + nx * 0.02, y: 1.15, z: z + nz * 0.02, nx, nz, size: 0.34, age: 0.25, frame: true, seed });
  const rx = (nx: number, nz: number) => [nz, -nx]; // a direita de quem lê (eixo ao longo da parede)
  const pair = (wx: number, wz: number, nx: number, nz: number, n: string | null, obj: 'tigela' | 'giz' | 'corrente' | 'nada' | 'pano', broken = false, seed = 1) => {
    const [ax, az] = rx(nx, nz);
    // o nicho à esquerda, o dado talhado à direita (de quem lê)
    niche(wx - ax * 0.35, wz - az * 0.35, nx, nz, obj);
    over(wx - ax * 0.35, wz - az * 0.35, nx, nz, broken, seed);
    if (n) dieFace(wx + ax * 0.5, wz + az * 0.5, nx, nz, n, seed + 1);
  };
  // trecho A (descida da entrada), parede leste: a tapeçaria
  niche(1, cz(1), -1, 0, 'pano');
  over(1, cz(1), -1, 0, false, 71);
  // trecho B (vira à esquerda), parede norte (z = -2, olhando para -z… dentro do corredor): faces 1 e 2
  pair(cx(-1), -2 + 0.0, 0, -1, 'n1', 'tigela', false, 11);
  pair(cx(-2) - 0.2, -2, 0, -1, 'n2', 'giz', true, 13); // (a pedra caiu: só ACENDER)
  // trecho C (desce), parede leste (x = -5): face 3 e o nicho VAZIO (fechado), com a lousa ao lado
  pair(-5, cz(3), -1, 0, 'n3', 'corrente', false, 15);
  // o nicho vazio é um nicho de verdade com laje: escrever QUATRO na lousa o abre (folha p1)
  let p1Taken = (diaryStore.get().pages ?? []).includes('p1');
  const emptyN = makeGemNiche(kit, ctx, -5, 1.15, cz(4) + 0.35, -1, 0, () => {
    p1Taken = true;
  }, 'p1');
  interactables.push(emptyN.interactable);
  over(-5, cz(4) + 0.35, -1, 0, false, 17);
  kit.inscribe({ words: ['n5'], x: -5.02, y: 1.15, z: -7.6, nx: -1, nz: 0, size: 0.34, age: 0.25, frame: true, seed: 19 }); // a face 5 depois do vazio
  // a lousa pequena, na parede sul do canto (z = -10, olhando para +z)
  const board = makeWallBoard(kit, ctx, { x: cx(-3), y: 1.3, z: -10 + 0.02, nx: 0, nz: 1, step: 0.4, key: 'nichos' });
  const gate = shotGate(ctx.die);
  let boardDone = p1Taken;
  let boardIdle = 0;
  if (p1Taken) emptyN.open();

  // trecho D (vira à direita), parede norte (z = -8): o MURAL de ANTES · AGORA · DEPOIS
  {
    const t = canvasTex(192, 64, (g) => {
      g.fillStyle = '#7a7470';
      g.fillRect(0, 0, 192, 64);
      g.fillStyle = '#15110f';
      g.fillRect(0, 0, 192, 3);
      g.fillRect(0, 61, 192, 3);
      g.fillRect(63, 0, 2, 64);
      g.fillRect(127, 0, 2, 64);
      carve(g, brazierPaths(32, 34, 1.6, false));
      // a mão acendendo: dedos, e uma chaminha saindo do braseiro
      carve(g, brazierPaths(96, 38, 1.4, false));
      carve(g, [[[110, 12], [104, 20], [100, 24]], [[118, 16], [108, 24]], [[100, 24], [98, 30]], [[92, 30], [96, 26], [100, 30], [98, 34]]]);
      carve(g, brazierPaths(160, 38, 1.4, true));
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.2), new THREE.MeshLambertMaterial({ map: t, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
    m.position.set(cx(-0.5), 1.85, -8 - 0.02);
    m.rotation.y = Math.PI; // olha para -z (para dentro do corredor D)
    kit.group.add(m);
    (['antes', 'agora', 'depois'] as const).forEach((w, k) => {
      kit.inscribe({ words: [w], x: cx(-0.5) + (1 - k) * 1.2, y: 0.95, z: -8 - 0.025, nx: 0, nz: -1, size: 0.32, age: 0.2, seed: 81 + k });
    });
  }

  // a JANELA de grade (trecho C, parede oeste, x = -7) e, do outro lado, a galeria distante onde o Escrivão passa
  {
    const wz = cz(4);
    wallAt(-7, wz, 1, 0, 2, 1.0, 0, 41);
    wallAt(-7, wz, 1, 0, 2, CH - 2.1, 2.1, 42);
    for (const dz of [-0.85, 0.85]) wallAt(-7, wz + dz, 1, 0, 0.3, 1.1, 1.0, 43);
    const iron = lambert(null, 0x2a2a30);
    for (let k = -0.55; k <= 0.56; k += 0.22) kit.box(0.04, 1.1, 0.04, iron, -7, 1.55, wz + k, false);
    kit.box(0.06, 0.06, 1.4, iron, -7, 1.55, wz, false);
    boxes.push(mkBox(-7.1, 0, wz - 1, -6.95, CH, wz + 1));
    // a galeria lá longe: um corredor iluminado, mais baixo, do outro lado de um vão escuro
    kit.plane(8, 14, lambert(null, 0x0a0910), -11, -1.2, wz, -Math.PI / 2, 0, false);
    kit.plane(3, 14, lambert(floorTexture([3 / T, 14 / T], 'ruin')), -13, 0.2, wz, -Math.PI / 2, 0, false);
    kit.plane(14, 4, brick(14, 4, 47), -14.5, 2.2, wz, 0, Math.PI / 2, false);
    for (const dz of [-4, 0, 4]) kit.torch(-14.4, 1.8, wz + dz, 1, 0, dz);
  }
  const scribe = makeScribe();
  scribe.group.position.set(-13, 0.2, cz(4) + 4);
  scribe.group.rotation.y = Math.PI; // anda para -z
  scribe.group.visible = false;
  kit.group.add(scribe.group);
  let scribeT = -1; // -1 = esperando; 0..1 = passando
  let scribeCool = 6;

  // ══ O PÁTIO ══
  const { x0: X0, x1: X1 } = COURT;
  const W = X1 - X0;
  const L = COURT.z1 - COURT.z0;
  const zm = (COURT.z0 + COURT.z1) / 2;
  kit.plane(W, L, lambert(floorTexture([W / T, L / T], 'ruin')), 0, 0, zm, -Math.PI / 2);
  // parede norte do pátio (com a passagem do corredor em x ∈ [1, 3])
  wallAt(-3, COURT.z1, 0, -1, 8, PH, 0, 51);
  wallAt(5, COURT.z1, 0, -1, 4, PH, 0, 52);
  wallAt(2, COURT.z1, 0, -1, 2, PH - CH, CH, 53);
  // paredes leste e oeste (a leste, a abertura da câmara lateral, no nível da galeria)
  wallAt(X0, zm, 1, 0, L, PH, 0, 54);
  wallAt(X1, -13, -1, 0, 2, PH, 0, 55);
  wallAt(X1, (CHAMBER.z0 + COURT.z0) / 2, -1, 0, CHAMBER.z0 - COURT.z0, PH, 0, 56);
  wallAt(X1, (CHAMBER.z0 + CHAMBER.z1) / 2, -1, 0, CHAMBER.z1 - CHAMBER.z0, PH - 5.6, 5.6, 57);
  const door = buildDoor(kit, { x0: X0, x1: X1, z0: Z0, h: PH, lamps: 1, connected: true });
  door.setOpen(1);
  door.lampMats[0].color.setHex(0xff7a2e);
  boxes.push(mkBox(-1.25, 0, Z0, -0.95, 2.65, Z0 + 0.3), mkBox(0.95, 0, Z0, 1.25, 2.65, Z0 + 0.3));
  // o teto, muito alto, com o BURACO redondo de luz (um "ponto" do dado)
  {
    const sh = new THREE.Shape();
    // (a forma é desenhada em (x, -z) e deitada com -90° em x, que leva y para -z)
    sh.moveTo(X0, -COURT.z0);
    sh.lineTo(X1, -COURT.z0);
    sh.lineTo(X1, -COURT.z1);
    sh.lineTo(X0, -COURT.z1);
    sh.closePath();
    const hole = new THREE.Path();
    hole.absarc(CIST.x, -CIST.z, 1.5, 0, Math.PI * 2, true);
    sh.holes.push(hole);
    const cm = brick(W, L, 19);
    cm.side = THREE.DoubleSide;
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh, 24), cm);
    m.rotation.x = -Math.PI / 2;
    m.position.y = PH;
    kit.group.add(m);
    const sky = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), new THREE.MeshBasicMaterial({ color: 0xdfe6f0, fog: false }));
    sky.rotation.x = Math.PI / 2;
    sky.position.set(CIST.x, PH + 1.5, CIST.z);
    kit.group.add(sky);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1.5, 24, 1, true), new THREE.MeshLambertMaterial({ map: brick(10, 1.5, 58).map, side: THREE.BackSide }));
    tube.position.set(CIST.x, PH + 0.75, CIST.z);
    kit.group.add(tube);
    kit.light(CIST.x, PH - 1, CIST.z, 0xc8d8ff, 34);
    kit.beamDust(CIST.x, CIST.z, 1.4, 0.7, PH - 0.3, 46, 0xe8eeff); // poeira só no feixe que desce do buraco
  }
  // as galerias: blocos sólidos ao longo das paredes leste e oeste; em cima, o andar de cima; rampas no sul
  for (const s of [-1, 1]) {
    const gx = s * 6;
    const galSide = kit.brick([1, 1], 0.95, 60 + s);
    const gl = -12 - GZ;
    kit.box(2, GAL, gl, [galSide, galSide, lambert(floorTexture([1, 1], 'ruin')), galSide, galSide, galSide], gx, GAL / 2, (GZ - 12) / 2);
    kit.box(0.12, 0.14, gl, kit.slab, gx - s * 1.03, GAL - 0.2, (GZ - 12) / 2, false); // a quina da galeria, em pedra lavrada
    boxes.push(mkBox(gx - 1, 0, GZ, gx + 1, GAL, -12));
    // a rampa (degraus), do chão (perto da porta) até a galeria
    stairs(kit, { x0: gx - 1, x1: gx + 1, zLow: SZ, zHigh: GZ, yHigh: GAL, n: 10 });
    // parapeito da galeria (com um vão na ponta da rampa) e mureta da rampa, que acompanha a subida
    const px = gx - s * 1;
    kit.box(0.14, 0.92, gl, kit.stone, px, GAL + 0.46, (GZ - 12) / 2, false);
    kit.box(0.24, 0.09, gl + 0.04, kit.slab, px, GAL + 0.965, (GZ - 12) / 2, false);
    slopedWall(kit, { x0: px - 0.07, z0: SZ, x1: px + 0.07, z1: GZ, top: (_x, z) => stairY(z) + 0.95 });
    rects.push(s < 0 ? [-5.15, SZ + 0.7, -4.85, -12, GAL + 1.2] : [4.85, SZ + 0.7, 5.15, -12, GAL + 1.2]);
  }
  // a câmara lateral (no alto, a leste): a folha arrancada nº 2
  {
    const { x0, x1, z0, z1 } = CHAMBER;
    kit.plane(x1 - x0, z1 - z0, lambert(floorTexture([1, 2], 'ruin')), (x0 + x1) / 2, GAL, (z0 + z1) / 2, -Math.PI / 2);
    kit.plane(x1 - x0, z1 - z0, brick(x1 - x0, z1 - z0, 61), (x0 + x1) / 2, 5.6, (z0 + z1) / 2, Math.PI / 2);
    wallAt(x1, (z0 + z1) / 2, -1, 0, z1 - z0, 5.6 - GAL, GAL, 62);
    wallAt((x0 + x1) / 2, z1, 0, -1, x1 - x0, 5.6 - GAL, GAL, 63);
    wallAt((x0 + x1) / 2, z0, 0, 1, x1 - x0, 5.6 - GAL, GAL, 64);
    rects.push([x1, z0 - 1, x1 + 1, z1 + 1], [x0, z1, x1 + 1, z1 + 0.5], [x0, z0 - 0.5, x1 + 1, z0]);
    kit.torch(x1 - 0.1, GAL + 1.5, (z0 + z1) / 2, -1, 0, 3.3);
  }
  let p2Taken = (diaryStore.get().pages ?? []).includes('p2');
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.004, 0.3), lambert(null, 0xd8b880));
  leaf.position.set(8.6, GAL + 0.01, -16);
  leaf.rotation.y = -0.4;
  leaf.visible = !p2Taken;
  kit.group.add(leaf);
  interactables.push({
    pos: leaf.position.clone(),
    r: 1.6,
    label: 'Pegar a folha',
    enabled: () => !p2Taken && ctx.feetY() > GAL - 0.3,
    use: () => {
      p2Taken = true;
      leaf.visible = false;
      diary.addPage('p2');
      ctx.sfx('gem');
      ctx.caption('Uma folha arrancada', 'É do caderno. A letra dela.', '#d8b880');
    },
  });

  // o relevo (parede do bloco oeste, olhando para o pátio): gente em volta de um braseiro, e «CONTÁVEIS ACENDER BRASEIRO»
  {
    const t = canvasTex(160, 56, (g) => {
      g.fillStyle = '#7a7470';
      g.fillRect(0, 0, 160, 56);
      carve(g, brazierPaths(80, 30, 1.5, true));
      for (const [x, sgn] of [[22, 1], [44, 1], [116, -1], [138, -1]] as [number, number][]) {
        // uma figura: cabeça, corpo e o braço estendido para o fogo
        carve(g, [[[x - 3, 14], [x + 3, 14], [x + 3, 20], [x - 3, 20], [x - 3, 14]], [[x, 20], [x, 40]], [[x, 40], [x - 5, 52]], [[x, 40], [x + 5, 52]], [[x, 26], [x + sgn * 12, 22]]]);
      }
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.2), new THREE.MeshLambertMaterial({ map: t, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
    m.position.set(-5 + 0.02, 1.9, -16);
    m.rotation.y = Math.PI / 2;
    kit.group.add(m);
    reliefIns = kit.inscribe({ words: ['contaveis', 'acender', 'brasa'], x: -5 + 0.025, y: 0.95, z: -16, nx: 1, nz: 0, size: 0.34, age: 0.3, seed: 91, lead: true });
    kit.torch(-5 + 0.1, 2.2, -13.6, 1, 0, 1.1);
  }

  // a CISTERNA: anel de pedra, água parada e, na beira, a pedra com DOIS
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(CIST.r + 0.3, CIST.r + 0.35, 0.6, 28, 1, true), kit.stone);
  rim.position.set(CIST.x, 0.3, CIST.z);
  kit.add(rim);
  const rimTop = new THREE.Mesh(new THREE.RingGeometry(CIST.r, CIST.r + 0.3, 28), kit.stone);
  rimTop.rotation.x = -Math.PI / 2;
  rimTop.position.set(CIST.x, 0.6, CIST.z);
  kit.add(rimTop);
  const water = new THREE.Mesh(new THREE.CircleGeometry(CIST.r, 28), new THREE.MeshLambertMaterial({ color: 0x1a2a3a, emissive: 0x0a1420 }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(CIST.x, 0.38, CIST.z);
  kit.group.add(water);
  boxes.push(mkBox(CIST.x - CIST.r - 0.35, 0, CIST.z - CIST.r - 0.35, CIST.x + CIST.r + 0.35, 0.6, CIST.z + CIST.r + 0.35));
  rects.push([CIST.x - CIST.r - 0.35, CIST.z - CIST.r - 0.35, CIST.x + CIST.r + 0.35, CIST.z + CIST.r + 0.35]);
  const stoneZ = CIST.z + CIST.r + 0.7;
  kit.box(0.9, 0.8, 0.3, kit.stone, 0, 0.4, stoneZ);
  kit.contact(0, stoneZ, 1.4, 0.8);
  kit.contact(CIST.x, CIST.z, (CIST.r + 0.9) * 2);
  boxes.push(mkBox(-0.45, 0, stoneZ - 0.15, 0.45, 0.8, stoneZ + 0.15));
  rects.push([-0.45, stoneZ - 0.15, 0.45, stoneZ + 0.15]);
  const twoIns = kit.inscribe({ words: ['n2'], x: 0, y: 0.48, z: stoneZ + 0.155, nx: 0, nz: 1, size: 0.4, age: 0.2, frame: true, seed: 95 });
  // os quatro braseiros dos cantos do pátio: 0 frente-esq, 1 frente-dir, 2 fundo-esq, 3 fundo-dir ("fundo" = lado da porta)
  const corners: [number, number][] = [[-4.1, -13.2], [4.1, -13.2], [-2.8, -24.6], [2.8, -24.6]]; // (os do fundo, mais perto da porta: deixam livre o caminho até o pé das escadas)
  const braz: Brazier[] = corners.map(([x, z]) => makeBrazier(kit, ctx, x, z, false));
  for (const b of braz) boxes.push(...b.boxes);
  // os reflexos na água: cada braseiro aceso aparece espelhado de cima para baixo (quem olha da pedra, para a porta)
  const refl = corners.map(([x, z]) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false, color: 0xffd8a0 }));
    s.scale.set(0.34, 0.3, 1);
    s.position.set(CIST.x + (x - CIST.x) * 0.3, 0.46, CIST.z - (z - CIST.z) * 0.3);
    s.visible = false;
    kit.group.add(s);
    return s;
  });
  const SOL = [0, 3]; // frente-esq + fundo-dir: na água aparece o DOIS
  let reflSolved = false;
  let reflIdle = 0;
  let gemTaken = diary.hasGem('cisterna'); // (uma das 21 gemas: DESIGN.md §69)
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshLambertMaterial({ color: 0x7af0ff, emissive: 0x2ab8e0, emissiveIntensity: 0.8, flatShading: true }));
  gem.position.set(CIST.x, -0.2, CIST.z);
  gem.visible = false;
  kit.group.add(gem);
  let gemK = 0;
  interactables.push({
    pos: new THREE.Vector3(CIST.x, 0.8, CIST.z + CIST.r),
    r: 2.6,
    label: 'Pegar a gema',
    enabled: () => reflSolved && gemK > 0.95 && !gemTaken,
    use: () => {
      gemTaken = true;
      gem.visible = false;
      ctx.gem('cisterna', gem.position.clone(), ['Uma gema', 'Na água, a Casa escreve ao contrário.', '#7ad8ff']);
    },
  });

  // O DADO PEDE PARA APONTAR: lê o relevo e pergunta «BRASEIRO ONDE ?»; depois, «VOCÊ ACENDER BRASEIRO ?» (qualquer um do pátio)
  const point = makePointAsk(ctx, {
    id: 'r1-brasa',
    ins: reliefIns!,
    read: ['contaveis', 'acender', 'brasa'],
    ask: ['brasa', 'onde'], // (ONDE já é LUGAR + PERGUNTA)
    targets: () => braz.map((b) => b.bowl),
    radius: 0.7,
    then: { ask: ['voce', 'acender', 'brasa', 'perg'], done: () => braz.some((b) => b.lit) },
  });
  interactables.push(point.interactable);

  // luz: velas no corredor (nos nichos), a luz do buraco e algumas tochas no pátio
  kit.torch(X1 - 0.1, 1.8, -24.9, -1, 0, 2.6);
  kit.torch(X0 + 0.1, 1.8, -24.9, 1, 0, 3.6);
  kit.torch(0.95 + 0.2, 1.8, cz(2) + 0.4, -1, 0, 0.4);
  kit.aoSides(X0, X1, COURT.z0, COURT.z1, PH);

  if (import.meta.env.DEV) {
    ((globalThis as Record<string, unknown>).__respiro = () => ({ point: point.state(), board: board.grid.points(), boardDone, p1: p1Taken, p2: p2Taken, refl: reflSolved, lit: braz.map((b) => b.lit), bowls: braz.map((b) => b.bowl.toArray()), gem: gemTaken, scribe: +scribeT.toFixed(2), cell: (i: number) => board.cellPos(i).toArray().map((v) => +v.toFixed(2)) }));
  }
  kit.bake();

  const levelY = (x: number, z: number) => {
    if (z < -12 && z > GZ && Math.abs(x) > 5 && Math.abs(x) < 7) return GAL;
    if (z <= GZ && z > SZ && Math.abs(x) > 5 && Math.abs(x) < 7) return stairY(z);
    if (x >= CHAMBER.x0 && x <= CHAMBER.x1 && z <= CHAMBER.z1 && z >= CHAMBER.z0) return GAL;
    return 0;
  };

  return {
    name: 'Os Nichos e a Cisterna',
    subtitle: 'Nada trancado.',
    group: kit.group,
    surfaces: kit.surfaces,
    emitters: kit.emitters,
    inscriptions: kit.inscriptions,
    interactables,
    calm: (x, z) => z < COURT.z1 - 1.2 && z > COURT.z1 - 5 && Math.abs(x) < 4.5, // a chegada ao pátio: o dado pode fazer uma pergunta
    doorZ: Z0,
    entranceZ: Z1,
    start: new THREE.Vector3(0, 0, 1.2),
    startYaw: 0,
    fog: { color: '#0b0c14', near: 4, far: 30 },
    ambient: { color: 0x7a80b8, intensity: 1.9 },
    boxes: [...boxes, ...kit.boxes],
    sockets: braz.map((b) => b.socket),
    rects() {
      const r: Rect[] = [...rects, ...braz.map((b) => b.rect), ...kit.rects, ...entrance.rects()];
      // limites do pátio (a leste, a câmara lateral só se alcança pelo alto)
      r.push([X0 - 2, COURT.z0, X0, COURT.z1], [X1, COURT.z1 - 2, X1 + 3, COURT.z1], [X1, COURT.z0, X1 + 3, CHAMBER.z0]);
      r.push([X1, CHAMBER.z0, X1 + 0.2, CHAMBER.z1, GAL - 0.4]); // (abaixo da galeria, a parede)
      r.push(...door.rects(true));
      return r;
    },
    clampDie(p, vel, e, R) {
      const inCourt = p.z < -12;
      const top = inCourt ? PH : CH;
      if (p.y > top - R) {
        p.y = top - R;
        if (vel.y > 0) vel.y = -vel.y * e;
      }
      const x0 = inCourt ? X0 : -9;
      const x1 = inCourt ? (p.y > GAL && p.z < CHAMBER.z1 && p.z > CHAMBER.z0 ? CHAMBER.x1 : X1) : 9;
      if (p.x < x0 + R) {
        p.x = x0 + R;
        if (vel.x < 0) vel.x = -vel.x * e;
      } else if (p.x > x1 - R) {
        p.x = x1 - R;
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
    groundY: levelY,
    surfaceAt: (x, z) => kit.surfaceAt(x, z),
    // o som do lugar (§60): o corredor é estreito e abafado; o pátio é alto e ecoa, venta (mais forte embaixo do buraco de luz) e pinga na
    // cisterna
    ambience: {
      size: (_x, z) => (z < COURT.z1 + 0.5 ? 0.9 : 0.25),
      wind: windNear([
        { x: 0, z: (COURT.z0 + COURT.z1) / 2, hx: COURT.x1, hz: (COURT.z1 - COURT.z0) / 2, r: 3.5, k: 0.3 },
        { x: CIST.x, z: CIST.z, r: 8, k: 0.6 },
      ]),
      drips: [
        { x: CIST.x + 0.7, y: 0.3, z: CIST.z - 0.5 },
        { x: COURT.x0 + 0.4, y: 0.2, z: COURT.z0 + 1.5 },
      ],
    },
    dieFloor: (x, z) => (z <= GZ && z > SZ && Math.abs(x) > 5 && Math.abs(x) < 7 ? levelY(x, z) : 0),
    holdsDie: () => false,
    update(dt, t) {
      kit.tick(dt, t);
      gate.tick();
      point.update(dt);
      for (const c of candleLights) {
        c.s.material.map = kit.frame(t * 8 + c.ph);
        c.e.intensity = 9 * (0.9 + 0.1 * Math.sin(t * 7 + c.ph));
      }
      // a lousa do nicho vazio: QUATRO abre a laje (a folha p1)
      board.update(dt, t);
      if (!boardDone) {
        const i = board.hit();
        if (i >= 0 && gate.take() && !board.grid.lit[i]) {
          board.grid.ignite(i);
          ctx.sfx('ignite', 'nichos');
          boardIdle = 0;
        }
        const pts = board.grid.points();
        if (pts.length && board.grid.writes('n4')) {
          boardDone = true;
          ctx.sfx('piece');
          emptyN.open();
        } else if (pts.length) {
          boardIdle += ctx.paused() ? 0 : dt;
          if (boardIdle > 5) {
            board.grid.clear();
            ctx.sfx('burnout');
            boardIdle = 0;
          }
        }
      }
      emptyN.update(dt, t);
      // o Escrivão passa lá longe (quando o jogador está perto da janela), devagar, e some
      const lp = ctx.player.pos;
      if (scribeT < 0) {
        scribeCool -= dt;
        if (scribeCool <= 0 && lp.x < -4 && Math.abs(lp.z - cz(4)) < 4) {
          scribeT = 0;
          scribe.group.visible = true;
          scribe.setAlpha(1);
        }
      } else {
        scribeT += dt / 9;
        scribe.group.position.z = cz(4) + 4 - 8 * scribeT;
        scribe.animate(dt, t, { walk: 1.1, headYaw: Math.sin(scribeT * 6) * 0.2 });
        scribe.setAlpha(Math.min(1, Math.min(scribeT, 1 - scribeT) * 8));
        if (scribeT >= 1) {
          scribeT = -1;
          scribe.group.visible = false;
          scribeCool = 70;
        }
      }
      // o reflexo
      for (const [k, b] of braz.entries()) {
        if (b.touched()) b.light(true);
        b.update(t);
        refl[k].visible = b.lit;
        if (b.lit) refl[k].material.map = kit.frame(t * 8 + k);
      }
      if (!reflSolved) {
        const lit = braz.map((b, i) => (b.lit ? i : -1)).filter((i) => i >= 0);
        if (lit.length === 2 && SOL.every((i) => lit.includes(i))) {
          reflSolved = true;
          ctx.sfx('piece');
          gem.visible = !gemTaken;
        } else if (lit.length >= 2) {
          reflIdle += ctx.paused() ? 0 : dt;
          if (reflIdle > 3) {
            braz.forEach((b) => b.light(false));
            reflIdle = 0;
          }
        } else reflIdle = 0;
      }
      for (const p of twoIns.panels) p.fire = (p.fire ?? 0) + ((reflSolved ? 1 : 0) - (p.fire ?? 0)) * Math.min(1, dt * 3);
      if (reflSolved && gemK < 1) gemK = Math.min(1, gemK + dt / 2.5);
      gem.position.y = -0.2 + 1.3 * gemK + Math.sin(t * 2) * 0.04 * gemK;
      gem.rotation.y = t * 1.4;
    },
    reset() {
      braz.forEach((b) => b.light(false, true));
      if (!boardDone) board.grid.clear();
    },
    bonus: () => gemTaken,
    dispose() {},
  };
}
