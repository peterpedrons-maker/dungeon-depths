// A BIBLIOTECA · O ARQUIVO DAS SENTENÇAS, térreo (PUZZLES_PROPOSTAS.md §2d, §5 "A Biblioteca" e Ficha 2). Entre O Pano e Os Apelidos.
// Onde os Contáveis guardavam tudo o que foi dito e julgado: tábuas de PEDRA são o que a Casa confirmou; LIVROS e rolos de papel são cópias, boatos.
// O caminho principal é CURTO (atravessar o Átrio até a porta, sempre aberta); todo o resto é opcional. Módulos em volta do Átrio:
//  · O ÁTRIO: três andares de altura, uma luz redonda no alto, passarelas vazias em cima, NOVE MESAS DE LEITURA em grade 3×3 com lamparinas e mais quatro
//    lamparinas de parede. Constelação C-Bib (tools/verify_constelacoes.mjs): a pista é a página na mesa do Escrivão, vista pela grade do escritório DE
//    CABEÇA PARA BAIXO (copiada assim, dá ACENDER: a armadilha); do lado certo é PEGAR: as mesas 0, 2 e 7.
//  · A ALA DAS PEDRAS (oeste, perto da entrada): tábuas talhadas com CONFIRMADO, murais com figura (ESCREVER, LER, ESCRIVÃO, SENTENÇA) e a tábua do
//    índice «CONDENADO CRIME ?» (nem a Casa sabe qual foi o crime).
//  · A ALA DO PAPEL (oeste, perto da porta): os LIVROS QUE MENTEM: três com BOATO na lombada, dois cadernos de condenados (sem marca), um encadernado em
//    pedra com CONFIRMADO (não queima). Queimar os três de boato: atrás do terceiro, uma gema. Queimar um caderno: "uma página se perdeu" (volta ao sair).
//  · O MUSEU DOS NOMES (leste, perto da entrada): objetos em pedestais com o nome talhado (PORTA, CHAVE, LIVRO, MESA, SINO, GIZ, DADO) e um pedestal vazio.
//  · A SALA DE AULA (leste, perto da porta): três lousas de exercício com murais: QUATRO; DOIS; e a trancada «PEQUENO IGUAL ▢» (só depois de o jogador
//    conhecer IGUAL, na Lei Pequena): QUATRO. O MURAL DE ENCAIXE: trocar blocos (E num e depois noutro) até cada desenho ter o seu nome.
//  · O ESCRITÓRIO do Escrivão (trancado; visto por uma grade, ao fundo à direita): a mesa, a página, o toco de giz, a lamparina. Ele está lá, escrevendo,
//    de costas; quando o jogador chega perto da grade, a lamparina apaga e ele não está mais (3ª aparição).
import * as THREE from 'three';
import { floorTexture } from '../textures';
import { buildDoor, buildEntrance, Kit, lambert, T } from '../kit';
import { makeCloth, makeGemNiche, makeTorch, makeWallBoard, type Torch } from '../firegrid';
import { makeScribe } from '../scribe';
import { sketchCanvas } from '../sketch';
import { glyphsOf } from '../../story/lexicon';
import { drawGlyph } from '../../book/font';
import { diaryStore } from '../../story/diary';
import { constellation } from './chapter1';
import type { FireExtraApi } from './fire';
import { mkBox, shotGate, Z1 } from './shell';
import type { Box, Ctx, Interactable, Rect, Room } from '../types';
import { windNear } from '../ambience';
import { bakeProps, loadPack, placeProp } from '../props';

const AX = 6; // o Átrio: x ∈ [-6, 6]
const Z0 = -26;
const H = 13; // três andares
const WX = 11.5; // as alas vão até |x| = 11,5
const WH = 4.2; // pé-direito das alas
// as alas: [z0, z1] (a passagem do Átrio fica no meio, com 2 m de largura)
const WINGS = { pedras: [-11, -3], papel: [-21, -13], museu: [-11, -3], aula: [-21, -13] } as const;
const TABLES_X = [-3.2, 0, 3.2];
const TABLES_Z = [-19, -13.5, -8]; // linha 0 = a do fundo (perto da porta e do escritório)
const tableAt = (i: number): [number, number] => [TABLES_X[i % 3], TABLES_Z[Math.floor(i / 3)]];

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// uma linha de glifos desenhada num canvas (para páginas e lombadas)
function glyphLine(g: CanvasRenderingContext2D, words: string[], x: number, y: number, size: number, color: string) {
  let cx = x;
  for (const w of words) {
    for (const gl of glyphsOf(w)) {
      drawGlyph(g, gl, cx, y, size, color);
      cx += size * 1.15;
    }
    cx += size * 0.5;
  }
}
// relevo talhado de uma figura (traço escuro + cal)
function relief(kind: 'escrivao' | 'sentenca' | 'ler') {
  return canvasTex(96, 96, (g) => {
    g.clearRect(0, 0, 96, 96);
    const line = (pts: number[][], w = 2) => {
      for (const [col, lw, d] of [['#15110f', w + 2, 1], ['#e9e1cc', w, 0]] as [string, number, number][]) {
        g.strokeStyle = col;
        g.lineWidth = lw;
        g.beginPath();
        pts.forEach(([x, y], i) => (i ? g.lineTo(x + d, y + d) : g.moveTo(x + d, y + d)));
        g.stroke();
      }
    };
    if (kind === 'escrivao') {
      line([[48, 10], [34, 40], [30, 86], [66, 86], [62, 40], [48, 10]]); // o capuz pontudo e o manto
      line([[42, 34], [44, 34]], 3);
      line([[52, 34], [54, 34]], 3);
      line([[62, 56], [80, 66]]); // o braço com a pena
      line([[80, 66], [86, 58]]);
    } else if (kind === 'sentenca') {
      line([[22, 14], [74, 14], [74, 82], [22, 82], [22, 14]]); // o pergaminho
      for (const y of [28, 40, 52]) line([[30, y], [66, y]], 1);
      line([[56, 64], [68, 64], [68, 76], [56, 76], [56, 64]]); // o lugar da marca
    } else {
      line([[18, 70], [48, 60], [78, 70], [78, 30], [48, 20], [18, 30], [18, 70]]); // um livro aberto
      line([[48, 20], [48, 60]]);
      line([[36, 82], [48, 72], [60, 82]]); // dois olhos lendo (o nariz)
    }
  });
}

export function buildBiblioteca(ctx: Ctx): Room {
  const kit = new Kit('crypt');
  const boxes: Box[] = [];
  const rects: Rect[] = [];
  const interactables: Interactable[] = [];
  const L = Z1 - Z0;
  const zm = (Z0 + Z1) / 2;
  // ══ o ÁTRIO ══
  kit.plane(AX * 2, L, lambert(floorTexture([(AX * 2) / T, L / T], 'crypt')), 0, 0, zm, -Math.PI / 2);
  const entrance = buildEntrance(kit, { x0: -AX, x1: AX, z: Z1, h: H });
  const door = buildDoor(kit, { x0: -AX, x1: AX, z0: Z0, h: H, lamps: 1, connected: true });
  door.setOpen(1);
  door.lampMats[0].color.setHex(0xff7a2e);
  boxes.push(mkBox(-1.25, 0, Z0, -0.95, 2.65, Z0 + 0.3), mkBox(0.95, 0, Z0, 1.25, 2.65, Z0 + 0.3));
  // o teto, com a luz redonda no alto
  {
    const sh = new THREE.Shape();
    sh.moveTo(-AX, -Z0);
    sh.lineTo(AX, -Z0);
    sh.lineTo(AX, -Z1);
    sh.lineTo(-AX, -Z1);
    sh.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 12, 1.6, 0, Math.PI * 2, true);
    sh.holes.push(hole);
    const cm = kit.brick([1, 1], 0.6, 19);
    cm.side = THREE.DoubleSide;
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh, 24), cm);
    m.rotation.x = -Math.PI / 2;
    m.position.y = H;
    kit.group.add(m);
    const sky = new THREE.Mesh(new THREE.CircleGeometry(1.7, 24), new THREE.MeshBasicMaterial({ color: 0xdfe6f0, fog: false }));
    sky.rotation.x = Math.PI / 2;
    sky.position.set(0, H + 1.4, -12);
    kit.group.add(sky);
    kit.light(0, H - 1, -12, 0xc8d8ff, 40);
    kit.beamDust(0, -12, 1.5, 0.5, H - 0.3, 50, 0xe8eeff);
  }
  // as paredes do Átrio, com as passagens (2 m) para as alas. São de pedra COM ESPESSURA (30 cm, para o lado das alas): antes eram folhas de uma
  // face só, viradas para o Átrio, e de dentro de uma ala a parede sumia (via-se o Átrio através dela, com o batente da passagem boiando)
  const atrioWallM = kit.brick([1, 1], 0.95, 33);
  const WT = 0.3;
  const wall = (side: number, z0: number, z1: number, y0 = 0, h = H) => kit.box(WT, h, z1 - z0, atrioWallM, side * (AX + WT / 2), y0 + h / 2, (z0 + z1) / 2);
  for (const side of [-1, 1]) {
    const gaps = side < 0 ? [WINGS.pedras, WINGS.papel] : [WINGS.museu, WINGS.aula];
    const mids = gaps.map(([a, b]) => (a + b) / 2);
    const cuts = [Z0, ...mids.flatMap((m) => [m - 1, m + 1]).sort((a, b) => a - b), Z1];
    for (let k = 0; k < cuts.length - 1; k++) {
      if (k % 2 === 0) wall(side, cuts[k], cuts[k + 1]);
      else wall(side, cuts[k], cuts[k + 1], 2.8, H - 2.8);
    }
    for (const m of mids) {
      for (const z of [m - 1.1, m + 1.1]) kit.box(0.4, 2.9, 0.3, kit.slab, side * (AX - 0.15), 1.45, z, false);
      kit.box(0.4, 0.3, 2.5, kit.slab, side * (AX - 0.15), 2.95, m, false);
    }
    // o Átrio (para o jogador): as paredes, menos as passagens
    for (let k = 0; k < cuts.length - 1; k += 2) rects.push(side < 0 ? [-AX - 0.4, cuts[k], -AX, cuts[k + 1]] : [AX, cuts[k], AX + 0.4, cuts[k + 1]]);
    // as passarelas dos andares de cima (vazias, sem acesso: as escadas desabaram)
    for (const y of [4.6, 8.8]) {
      kit.box(1.4, 0.25, L, kit.slab, side * (AX - 0.7), y, zm, false);
      for (let z = Z0 + 1; z < Z1; z += 1.2) kit.box(0.06, 0.8, 0.06, lambert(null, 0x3a3430), side * (AX - 1.35), y + 0.5, z, false);
      kit.box(0.08, 0.06, L, lambert(null, 0x3a3430), side * (AX - 1.35), y + 0.9, zm, false);
    }
  }
  // a escada desabada (entulho num canto do fundo)
  for (const [x, z, s] of [[-4.8, -24.5, 0.5], [-4.2, -23.8, 0.35], [-5.2, -23.5, 0.3], [-3.8, -24.8, 0.25]] as [number, number, number][]) {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), kit.stone);
    m.position.set(x, s * 0.7, z);
    m.rotation.set(x, z, s * 4);
    kit.group.add(m);
  }
  kit.box(1.6, 0.25, 3, kit.slab, -5.2, 4.2, -23, false); // um lance quebrado pendurado
  // ── as nove mesas de leitura, cada uma com uma lamparina; e quatro lamparinas de parede ──
  const torches: Torch[] = [];
  const cells: (number | null)[] = [];
  for (let i = 0; i < 9; i++) {
    const [x, z] = tableAt(i);
    kit.box(1.8, 0.08, 1.0, lambert(null, 0x5a3a26), x, 0.78, z);
    for (const [dx, dz] of [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]]) kit.box(0.08, 0.76, 0.08, lambert(null, 0x3a2618), x + dx, 0.38, z + dz, false);
    kit.box(0.5, 0.06, 0.36, lambert(null, 0xd8c8a0), x - 0.3, 0.84, z + 0.1, false); // um livro aberto
    boxes.push(mkBox(x - 0.9, 0, z - 0.5, x + 0.9, 0.82, z + 0.5));
    rects.push([x - 0.9, z - 0.5, x + 0.9, z + 0.5]);
    kit.contact(x, z, 2.2, 1.4);
    torches.push(makeTorch(kit, ctx, x + 0.55, 0.62, z - 0.2, 0, 1, 40, true));
    cells.push(i);
  }
  torches.push(makeTorch(kit, ctx, -AX + 0.1, 2.0, -1.5, 1, 0), makeTorch(kit, ctx, AX - 0.1, 2.0, -1.5, -1, 0), makeTorch(kit, ctx, -AX + 0.1, 2.0, -23.5, 1, 0), makeTorch(kit, ctx, AX - 0.1, 2.0, -16.5, -1, 0));
  cells.push(null, null, null, null);
  const api = { kit, ctx, boxes } as unknown as FireExtraApi;
  const C = constellation(api, torches, cells, [0, 2, 7], [0, -16.2], [-1.8, 1.25, Z0 + 0.02, 0, 1], 'p14');
  interactables.push(C.niche.interactable);

  // ══ as ALAS (câmaras baixas ao lado do Átrio) ══
  // `torch`: onde fica a tocha da ala [x, z, nx] (sem: no meio da parede de fora). As alas do Papel e da Aula têm a tocha na parede do lado do
  // Átrio, longe dos livros e das lousas (antes ela ficava colada nas escritas; DESIGN.md §67)
  const wing = (side: number, z0: number, z1: number, seed: number, torch?: [number, number, number]) => {
    const x0 = side < 0 ? -WX : AX;
    const x1 = side < 0 ? -AX : WX;
    const w = x1 - x0;
    const l = z1 - z0;
    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    kit.plane(w, l, lambert(floorTexture([w / T, l / T], 'crypt')), cx, 0, cz, -Math.PI / 2);
    kit.plane(w, l, kit.brick([w / T, l / T], 0.6, seed), cx, WH, cz, Math.PI / 2);
    kit.plane(l, WH, kit.brick([l / T, WH / T], 0.95, seed + 1), side * WX, WH / 2, cz, 0, side < 0 ? Math.PI / 2 : -Math.PI / 2);
    kit.plane(w, WH, kit.brick([w / T, WH / T], 0.95, seed + 2), cx, WH / 2, z0, 0, 0);
    kit.plane(w, WH, kit.brick([w / T, WH / T], 0.95, seed + 3), cx, WH / 2, z1, 0, Math.PI);
    rects.push(side < 0 ? [-WX - 2, z0, -WX, z1] : [WX, z0, WX + 2, z1], [x0, z0 - 2, x1, z0], [x0, z1, x1, z1 + 2]);
    kit.aoSides(x0, x1, z0, z1, WH);
    if (torch) kit.torch(torch[0], 2.4, torch[1], torch[2], 0, seed, 0xffa860, 24);
    else kit.torch(side * (WX - 0.1), 2.4, cz, -side, 0, seed, 0xffa860, 24);
    return { x0, x1, z0, z1, cx, cz };
  };
  const inWing = (x: number, z: number) => {
    if (Math.abs(x) <= AX) return null;
    const sideW = x < 0 ? [WINGS.pedras, WINGS.papel] : [WINGS.museu, WINGS.aula];
    return sideW.find(([a, b]) => z >= a && z <= b) ?? null;
  };

  // ── A ALA DAS PEDRAS ──
  {
    const W = wing(-1, WINGS.pedras[0], WINGS.pedras[1], 71);
    // tábuas de pedra nas paredes: frases da lei, sempre com CONFIRMADO
    kit.inscribe({ words: ['condenado', 'ler', 'sentenca', 'conf'], x: W.cx, y: 2.3, z: W.z0 + 0.025, nx: 0, nz: 1, size: 0.3, age: 0.12, seed: 301, plaque: true });
    kit.inscribe({ words: ['escrivao', 'escrever', 'sentenca', 'conf'], x: W.cx, y: 1.5, z: W.z0 + 0.025, nx: 0, nz: 1, size: 0.3, age: 0.12, seed: 303, plaque: true });
    // a tábua do índice: «CONDENADO CRIME ?» (nem a Casa sabe qual foi o crime)
    kit.inscribe({ words: ['condenado', 'crime', 'perg'], x: W.cx, y: 2.0, z: W.z1 - 0.025, nx: 0, nz: -1, size: 0.34, age: 0.15, seed: 305, plaque: true });
    // murais com figura: ESCREVER, LER, ESCRIVÃO, SENTENÇA (a figura em cima, a palavra embaixo)
    const murals: [string, () => THREE.Texture, number][] = [
      // (dois de cada lado da tocha da ala, a 1,6 m ou mais dela: antes a tocha ficava em cima do mural do Escrivão)
      ['escrever', () => { const c = sketchCanvas('escrever', 8, 40); const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; return t; }, -10.0],
      ['ler', () => relief('ler'), -8.6],
      ['escrivao', () => relief('escrivao'), -5.4],
      ['sentenca', () => relief('sentenca'), -4.0],
    ];
    for (const [word, texFn, z] of murals) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshLambertMaterial({ map: texFn(), transparent: true, alphaTest: 0.05, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
      m.position.set(-WX + 0.02, 2.4, z);
      m.rotation.y = Math.PI / 2;
      kit.group.add(m);
      kit.inscribe({ words: [word], x: -WX + 0.025, y: 1.6, z, nx: 1, nz: 0, size: 0.32, age: 0.12, seed: 311 + Math.round(z * 3), frame: true });
    }
    // estantes de tábuas (blocos de pedra com riscos), uma de cada lado da passagem (no meio da ala, elas tapavam as placas das paredes do fundo)
    for (const z of [-9.6, -4.4]) {
      const ex = -7.5;
      kit.box(0.5, 2.2, 1.8, kit.stone, ex, 1.1, z);
      boxes.push(mkBox(ex - 0.25, 0, z - 0.9, ex + 0.25, 2.2, z + 0.9));
      rects.push([ex - 0.25, z - 0.9, ex + 0.25, z + 0.9]);
      for (let y = 0.5; y < 2.1; y += 0.45) kit.box(0.54, 0.05, 1.84, kit.slab, ex, y, z, false);
      kit.contact(ex, z, 0.9, 2.2);
    }
  }

  // ── A ALA DO PAPEL: os livros que mentem ──
  let paperGem = false;
  const paperNiche = makeGemNiche(kit, ctx, -WX + 0.02, 1.25, -15.0, 1, 0, () => (paperGem = true), 'papel'); // (uma das 21 gemas: DESIGN.md §69)
  interactables.push(paperNiche.interactable);
  interface Book {
    kind: 'boato' | 'caderno' | 'pedra';
    cloth?: ReturnType<typeof makeCloth>;
    z: number;
  }
  const books: Book[] = [];
  {
    const W = wing(-1, WINGS.papel[0], WINGS.papel[1], 81, [-AX - 0.4, -19.6, -1]);
    // (as paredes dos lados têm estantes de livros de verdade: ver "os móveis", mais abaixo)
    void W;
    // a estante dos SEIS livros (parede do fundo da ala): três de boato, dois cadernos, um de pedra
    const order: Book['kind'][] = ['boato', 'caderno', 'boato', 'pedra', 'caderno', 'boato'];
    order.forEach((kind, k) => {
      const z = -19.2 + k * 0.85;
      if (kind === 'pedra') {
        kit.box(0.2, 0.9, 0.55, kit.slab, -WX + 0.12, 1.5, z);
        kit.inscribe({ words: ['conf'], x: -WX + 0.225, y: 1.5, z, nx: 1, nz: 0, size: 0.22, age: 0.12, seed: 321 });
        books.push({ kind, z });
        return;
      }
      const cloth = makeCloth(kit, ctx, { x: -WX + 0.06, y: 1.5, z, nx: 1, nz: 0, words: kind === 'boato' ? ['livro'] : [], size: 0.22, color: kind === 'boato' ? '#6a2a2a' : '#c8b890', mark: kind === 'boato', key: `livro${k}`, secs: 1.6 });
      books.push({ kind, cloth, z });
    });
    kit.box(0.3, 0.06, 5.4, kit.slab, -WX + 0.15, 0.98, -17, false); // a prateleira
  }
  let lostPage = false;

  // ── O MUSEU DOS NOMES ──
  {
    const W = wing(1, WINGS.museu[0], WINGS.museu[1], 91);
    const wood = lambert(null, 0x6a4a2e);
    const metal = lambert(null, 0xb08a4a);
    const objs: [string, (x: number, y: number, z: number) => void][] = [
      ['porta', (x, y, z) => { kit.box(0.4, 0.6, 0.06, wood, x, y + 0.3, z, false); kit.box(0.04, 0.04, 0.04, metal, x + 0.12, y + 0.3, z + 0.04, false); }],
      ['chave', (x, y, z) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 6, 12), metal); r.position.set(x - 0.12, y + 0.1, z); r.rotation.x = Math.PI / 2; kit.group.add(r); kit.box(0.24, 0.03, 0.03, metal, x + 0.05, y + 0.1, z, false); }],
      ['livro', (x, y, z) => { kit.box(0.34, 0.08, 0.26, lambert(null, 0x6a2a2a), x, y + 0.04, z, false); kit.box(0.32, 0.05, 0.24, lambert(null, 0xe0d0b0), x, y + 0.1, z, false); }],
      ['mesa', (x, y, z) => { kit.box(0.44, 0.04, 0.3, wood, x, y + 0.26, z, false); for (const [dx, dz] of [[-0.18, -0.12], [0.18, -0.12], [-0.18, 0.12], [0.18, 0.12]]) kit.box(0.03, 0.24, 0.03, wood, x + dx, y + 0.12, z + dz, false); }],
      ['sino', (x, y, z) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 0.22, 10), metal); b.position.set(x, y + 0.13, z); kit.group.add(b); }],
      ['giz', (x, y, z) => kit.box(0.16, 0.06, 0.06, lambert(null, 0xe8e4d8), x, y + 0.03, z, false)],
      ['dado', (x, y, z) => kit.box(0.18, 0.18, 0.18, lambert(null, 0x1a1a2a), x, y + 0.09, z, false)],
      ['', () => {}], // o pedestal vazio (o objeto está em outra parte da Biblioteca)
    ];
    objs.forEach(([name, place], k) => {
      const row = k < 4 ? 0 : 1;
      const x = 7.4 + (k % 4) * 1.2;
      const z = row === 0 ? W.z0 + 1.2 : W.z1 - 1.2;
      kit.box(0.6, 0.9, 0.6, kit.slab, x, 0.45, z);
      boxes.push(mkBox(x - 0.3, 0, z - 0.3, x + 0.3, 0.9, z + 0.3));
      rects.push([x - 0.3, z - 0.3, x + 0.3, z + 0.3]);
      place(x, 0.9, z);
      const label = name || 'sino';
      if (name) kit.inscribe({ words: [label], x, y: 0.5, z: z + (row === 0 ? 0.305 : -0.305), nx: 0, nz: row === 0 ? 1 : -1, size: 0.26, age: 0.12, seed: 331 + k, frame: true });
      else kit.inscribe({ words: ['chave'], x, y: 0.5, z: z - 0.305, nx: 0, nz: -1, size: 0.26, age: 0.5, seed: 339, frame: true }); // só o nome, sem o objeto
    });
  }

  // ── A SALA DE AULA: três lousas e o mural de encaixe ──
  const aula: { board: ReturnType<typeof makeWallBoard>; want: string; done: boolean; locked: () => boolean; mural: THREE.MeshLambertMaterial }[] = [];
  let aulaGem = false;
  // o nicho da Aula: na parede do lado do Átrio, de frente para a lousa (c) que o abre (antes ele ficava no MESMO lugar da lousa, por cima dela)
  const aulaNiche = makeGemNiche(kit, ctx, AX + 0.32, 1.25, -14.4, 1, 0, () => (aulaGem = true), 'p15'); // (era uma gema; agora uma folha dela: DESIGN.md §69)
  interactables.push(aulaNiche.interactable);
  {
    const W = wing(1, WINGS.aula[0], WINGS.aula[1], 101, [AX + 0.4, -19.6, 1]);
    // bancos
    for (const z of [-18.5, -15.5]) {
      kit.box(3.2, 0.45, 0.5, kit.slab, 8.6, 0.225, z);
      boxes.push(mkBox(7, 0, z - 0.25, 10.2, 0.45, z + 0.25));
      rects.push([7, z - 0.25, 10.2, z + 0.25, 0.45]);
    }
    const muralTex = (kind: number) =>
      canvasTex(96, 64, (g) => {
        g.clearRect(0, 0, 96, 64);
        const br = (x: number, y: number, s = 1) => {
          g.fillStyle = '#e9e1cc';
          g.fillRect(x - 6 * s, y, 12 * s, 3 * s);
          g.fillRect(x - 2 * s, y + 3 * s, 4 * s, 6 * s);
          g.fillStyle = '#ff9a40';
          g.fillRect(x - 3 * s, y - 6 * s, 6 * s, 6 * s);
        };
        if (kind === 0) for (const x of [18, 38, 58, 78]) br(x, 30); // quatro braseiros
        if (kind === 1) {
          // uma mão acende o 2, depois o 1 (o 2 com dois pontos, o 1 com um)
          br(30, 30);
          br(66, 30);
          g.fillStyle = '#e9e1cc';
          g.fillRect(26, 50, 3, 3);
          g.fillRect(33, 50, 3, 3);
          g.fillRect(64, 50, 3, 3);
          g.fillRect(44, 34, 10, 2);
          g.fillRect(52, 31, 2, 8);
        }
        if (kind === 2) {
          // um braseiro pequeno com o número QUATRO
          br(48, 34, 0.7);
          g.fillStyle = '#e9e1cc';
          for (const [dx, dy] of [[-8, 0], [8, 0], [-8, 12], [8, 12]]) g.fillRect(48 + dx, 46 + dy, 3, 3);
        }
      });
    const exercises: [string[], string, () => boolean][] = [
      [['acender', null as unknown as string, 'brasa'], 'n4', () => false],
      [[null as unknown as string, 'antes', 'n1'], 'n2', () => false],
      [['pequeno', 'igual', null as unknown as string], 'n4', () => !diaryStore.get().seen.igual],
    ];
    exercises.forEach(([words, want, locked], k) => {
      const z = -19.6 + k * 2.6;
      const mat = new THREE.MeshLambertMaterial({ map: muralTex(k), transparent: true, alphaTest: 0.05, emissive: 0xffffff, emissiveIntensity: 0, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
      const mm = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), mat);
      mm.position.set(WX - 0.02, 2.9, z);
      mm.rotation.y = -Math.PI / 2;
      kit.group.add(mm);
      kit.inscribe({ words: words.map((w) => w ?? null) as string[], x: WX - 0.025, y: 2.25, z, nx: -1, nz: 0, size: 0.22, age: 0.15, seed: 351 + k });
      const board = makeWallBoard(kit, ctx, { x: WX - 0.02, y: 1.3, z, nx: -1, nz: 0, step: 0.24, key: `aula${k}`, cold: k === 2 });
      aula.push({ board, want, done: false, locked, mural: mat });
    });
    void W;
  }
  // o mural de encaixe: quatro desenhos (porta, livro, chave, sino) e quatro blocos com glifos para trocar de lugar (E num, E noutro)
  const SLOT_WORDS = ['porta', 'livro', 'chave', 'sino'];
  const blocks = ['sino', 'porta', 'livro', 'chave']; // embaralhados
  let pick = -1;
  let encaixeDone = false;
  const blockIns: ReturnType<typeof kit.inscribe>[] = [];
  const blockMeshes: THREE.Mesh[] = [];
  const BZ = WINGS.aula[1] - 0.02;
  {
    const sk: Record<string, 'porta' | 'livro' | 'escrever' | 'abrir'> = { porta: 'porta', livro: 'livro', chave: 'abrir', sino: 'escrever' };
    SLOT_WORDS.forEach((w, k) => {
      const x = 7.2 + k * 1.15;
      let tex: THREE.Texture;
      if (w === 'chave' || w === 'sino')
        tex = canvasTex(40, 40, (g) => {
          g.strokeStyle = '#e9e1cc';
          g.lineWidth = 2;
          if (w === 'chave') {
            g.beginPath();
            g.arc(12, 20, 6, 0, Math.PI * 2);
            g.moveTo(18, 20);
            g.lineTo(34, 20);
            g.moveTo(28, 20);
            g.lineTo(28, 26);
            g.moveTo(33, 20);
            g.lineTo(33, 25);
            g.stroke();
          } else {
            g.beginPath();
            g.moveTo(20, 6);
            g.lineTo(20, 10);
            g.moveTo(10, 30);
            g.quadraticCurveTo(12, 10, 20, 10);
            g.quadraticCurveTo(28, 10, 30, 30);
            g.lineTo(10, 30);
            g.moveTo(18, 34);
            g.lineTo(22, 34);
            g.stroke();
          }
        });
      else {
        const t = new THREE.CanvasTexture(sketchCanvas(sk[w], 8, 40));
        t.magFilter = THREE.NearestFilter;
        t.minFilter = THREE.NearestFilter;
        tex = t;
      }
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.05 }));
      m.position.set(x, 2.6, BZ);
      m.rotation.y = Math.PI;
      kit.group.add(m);
      // o bloco embaixo do desenho (pedra com o glifo; trocável)
      const bm = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.4, 0.14), kit.slab);
      bm.position.set(x, 1.65, BZ - 0.07);
      kit.group.add(bm);
      blockMeshes.push(bm);
      const ins = kit.inscribe({ words: [blocks[k]], x, y: 1.65, z: BZ - 0.145, nx: 0, nz: -1, size: 0.26, age: 0.1, seed: 361 + k });
      blockIns.push(ins);
      interactables.push({
        pos: new THREE.Vector3(x, 1.65, BZ - 0.3),
        r: 1.5,
        label: 'Mover o bloco',
        enabled: () => !encaixeDone,
        use: () => {
          if (pick < 0) {
            pick = k;
            bm.position.z = BZ - 0.22;
            ctx.sfx('plate');
            return;
          }
          if (pick !== k) {
            [blocks[pick], blocks[k]] = [blocks[k], blocks[pick]];
            ctx.sfx('plate');
          }
          blockMeshes[pick].position.z = BZ - 0.07;
          pick = -1;
          refreshBlocks(); // redesenha os glifos dos blocos
          if (blocks.every((b, j) => b === SLOT_WORDS[j])) {
            encaixeDone = true;
            ctx.sfx('piece');
            aulaNicheOpen();
          }
        },
      });
    });
  }
  // (os glifos dos blocos são refeitos a cada troca: cada inscrição fica num grupo próprio)
  const blockGroups: THREE.Group[] = [];
  const refreshBlocks = () => {
    for (const g of blockGroups) g.removeFromParent();
    blockGroups.length = 0;
    blockIns.forEach((bi) => bi.panels.forEach((p) => (p.mesh.visible = false)));
    blocks.forEach((w, k) => {
      const g = new THREE.Group();
      kit.group.add(g);
      blockGroups.push(g);
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 48;
      const cg = c.getContext('2d')!;
      glyphLine(cg, [w], 32 - (glyphsOf(w).length - 1) * 14, 24, 24, '#2a2420');
      const t = new THREE.CanvasTexture(c);
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.NearestFilter;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.375), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.2 }));
      m.position.set(7.2 + k * 1.15, 1.65, BZ - 0.146);
      m.rotation.y = Math.PI;
      g.add(m);
    });
  };
  let aulaOpens = 0;
  const aulaNicheOpen = () => {
    aulaOpens++;
    if (aulaOpens === 1) aulaNiche.open();
  };

  // ══ O ESCRITÓRIO DO ESCRIVÃO (fundo, à direita; visto pela grade) ══
  const OX0 = 2.2;
  const OX1 = AX;
  const OZ0 = Z0;
  const OZ1 = -22.4;
  {
    // as paredes do escritório (um cubículo no canto do Átrio) e a grade
    kit.box(0.3, 3.6, OZ1 - OZ0, kit.stone, OX0, 1.8, (OZ0 + OZ1) / 2);
    kit.box(OX1 - OX0, 1.0, 0.3, kit.stone, (OX0 + OX1) / 2, 3.1, OZ1);
    kit.box(OX1 - OX0 + 0.3, 0.2, OZ1 - OZ0, kit.slab, (OX0 + OX1) / 2, 3.7, (OZ0 + OZ1) / 2, false);
    const iron = lambert(null, 0x24222a);
    for (let x = OX0 + 0.25; x < OX1; x += 0.22) kit.box(0.04, 2.6, 0.04, iron, x, 1.3, OZ1, false);
    kit.box(OX1 - OX0, 0.06, 0.06, iron, (OX0 + OX1) / 2, 1.4, OZ1, false);
    boxes.push(mkBox(OX0 - 0.15, 0, OZ0, OX0 + 0.15, 3.6, OZ1), mkBox(OX0, 0, OZ1 - 0.15, OX1, 3.6, OZ1 + 0.15));
    rects.push([OX0 - 0.15, OZ0, OX0 + 0.15, OZ1], [OX0, OZ1 - 0.15, OX1, OZ1 + 0.15]);
  }
  // a mesa, virada para a cadeira do outro lado (o jogador vê a página de cabeça para baixo)
  const DX = 4.1;
  const DZ = -23.5;
  kit.box(1.4, 0.08, 0.8, lambert(null, 0x4a2e1e), DX, 0.8, DZ, false);
  for (const [dx, dz] of [[-0.62, -0.32], [0.62, -0.32], [-0.62, 0.32], [0.62, 0.32]]) kit.box(0.07, 0.78, 0.07, lambert(null, 0x3a2418), DX + dx, 0.39, DZ + dz, false);
  kit.box(0.5, 0.06, 0.5, lambert(null, 0x3a2418), DX, 0.5, DZ - 0.75, false); // a cadeira (do outro lado)
  kit.box(0.5, 0.7, 0.06, lambert(null, 0x3a2418), DX, 0.88, DZ - 1.0, false);
  // a página: escrita do lado dele (PEGAR em cima; BRASEIRO DOIS embaixo) e girada 180° para o jogador
  const pageTex = canvasTex(96, 72, (g) => {
    g.fillStyle = '#e0d4b4';
    g.fillRect(0, 0, 96, 72);
    g.save();
    g.translate(96, 72);
    g.rotate(Math.PI);
    glyphLine(g, ['pegar'], 48, 22, 26, '#2a2018');
    glyphLine(g, ['brasa', 'n2'], 26, 54, 16, '#4a3a2a');
    g.restore();
  });
  const page = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.45), new THREE.MeshLambertMaterial({ map: pageTex }));
  page.rotation.x = -Math.PI / 2;
  page.position.set(DX, 0.845, DZ + 0.05);
  kit.group.add(page);
  kit.box(0.08, 0.025, 0.025, lambert(null, 0xe8e4d8), DX + 0.4, 0.85, DZ + 0.1, false); // o toco de giz
  const lampLight = kit.light(DX - 0.5, 1.4, DZ, 0xffb060, 14);
  const lampFlame = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
  lampFlame.scale.set(0.16, 0.16, 1);
  lampFlame.position.set(DX - 0.55, 1.05, DZ);
  kit.group.add(lampFlame);
  kit.box(0.1, 0.18, 0.1, lambert(null, 0x8a6a3a), DX - 0.55, 0.92, DZ, false);
  const scribe = makeScribe();
  scribe.group.position.set(DX + 0.6, 0.15, Z0 + 0.9);
  scribe.group.rotation.y = Math.PI; // de costas para o jogador: escreve numa estante junto à parede do fundo
  kit.box(0.9, 1.2, 0.4, lambert(null, 0x3a2418), DX + 0.6, 0.6, Z0 + 0.3, false); // a estante onde ele escreve
  scribe.group.scale.setScalar(0.92);
  kit.group.add(scribe.group);
  let scribeGone = false;

  // ══ OS MÓVEIS (DESIGN.md §71): estantes com livros, atris, livros nas mesas; velas e candelabro só no escritório, atrás da grade e APAGADOS ══
  // Nada disso é de puzzle, e nada imita o que é: nenhuma chama nova no Átrio, na Aula ou na Ala do Papel (lá, acender é o puzzle: as lamparinas
  // da constelação, as lousas, os livros que queimam); toda mesa recebe um objeto (nenhuma se destaca: as mesas são as casas da constelação);
  // as estantes ficam longe das lamparinas de parede, dos livros que mentem, do nicho e das passagens.
  {
    const placed: THREE.Object3D[] = [];
    const put = (n: string, x: number, y: number, z: number, ry = 0, h?: number) => {
      const o = placeProp(kit.group, 'bib', n, x, y, z, ry, h);
      placed.push(o);
      return o;
    };
    const SH = 1.9; // as estantes: 1,9 m de altura (e quase isso de largura), com o fundo achatado para 45 cm (o modelo tem 70)
    const SD = 0.45;
    let sk = 0;
    // uma estante encostada numa parede: (x, z) = o meio da face encostada; (nx, nz) = para onde ela olha
    const shelf = (x: number, z: number, nx: number, nz: number) => {
      const o = put(`Estante_Livros_${(sk++ % 4) + 1}`, x + nx * (SD / 2), 0, z + nz * (SD / 2), Math.atan2(nx, nz), SH);
      o.scale.z = SD / 0.7;
      const hw = 0.95;
      const [x0, x1, z0, z1] = nz !== 0 ? [x - hw, x + hw, Math.min(z, z + nz * SD), Math.max(z, z + nz * SD)] : [Math.min(x, x + nx * SD), Math.max(x, x + nx * SD), z - hw, z + hw];
      boxes.push(mkBox(x0, 0, z0, x1, SH, z1));
      rects.push([x0, z0, x1, z1]);
      kit.contact((x0 + x1) / 2, (z0 + z1) / 2, (x1 - x0) * 1.2, (z1 - z0) * 1.6);
    };
    // a Ala do Papel: duas estantes em cada parede dos lados (a do fundo é a dos seis livros e do nicho)
    for (const x of [-10.15, -7.4]) {
      shelf(x, WINGS.papel[0], 0, 1);
      shelf(x, WINGS.papel[1], 0, -1);
    }
    // o Átrio: dois pares de estantes em cada parede, entre as passagens, com um atril no meio (embaixo da tocha alta da esquerda)
    for (const side of [-1, 1]) {
      for (const z of [-13.3, -9.7]) shelf(side * AX, z, -side, 0);
      put('BookStand', side * (AX - 0.75), 0, -11.5, Math.atan2(-side, 0));
      boxes.push(mkBox(side * (AX - 0.75) - 0.26, 0, -11.76, side * (AX - 0.75) + 0.26, 1.3, -11.24));
      rects.push([side * (AX - 0.75) - 0.26, -11.76, side * (AX - 0.75) + 0.26, -11.24]);
    }
    // as mesas de leitura: um objeto em cada uma, na ponta longe da lamparina (nenhuma se destaca)
    const onTable = ['Book_Stack_1', 'Scroll_2', 'Book_7'];
    for (let i = 0; i < 9; i++) {
      const [x, z] = tableAt(i);
      put(onTable[(i * 2 + Math.floor(i / 3)) % 3], x - 0.66, 0.82, z - 0.26, ((i * 37) % 11) * 0.25 - 1.2);
    }
    // o escritório do Escrivão (atrás da grade): uma estante na parede da direita, o candelabro num canto, livros e velas APAGADAS
    shelf(AX, -24.6, -1, 0);
    put('Candelabro', 2.8, 0, -25.5, 0.4, 1.75);
    put('Book_Stack_1', DX + 0.55, 0.84, DZ - 0.27, 0.5);
    put('Vela_Pires', DX + 0.62, 0.84, DZ + 0.22, 0, 0.2);
    put('Vela_Alta', DX + 0.25, 1.2, Z0 + 0.3, 0, 0.42);
    put('Vela_Curta', DX + 0.95, 1.2, Z0 + 0.25, 0, 0.24);
    bakeProps(kit.group, placed, ['bib']);
    // a madeira das estantes é muito escura: no canto do Átrio elas viravam manchas pretas. Um pouco mais de cor e um brilho próprio fraco
    // (como o pano do Escrivão), para a silhueta e as lombadas se lerem no escuro
    void loadPack('bib').then((pk) =>
      pk.get('Estante_Livros_1')?.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshLambertMaterial | undefined;
        if (!m || !m.isMeshLambertMaterial || m.userData.lit) return;
        m.userData.lit = true;
        m.color.setScalar(1.35);
        m.emissive.setHex(0xffffff);
        m.emissiveMap = m.map;
        m.emissiveIntensity = 0.16;
        m.needsUpdate = true;
      }),
    );
  }
  // luz geral do Átrio (velas nas mesas não acendem sozinhas)
  for (const [x, z] of [[-AX + 0.1, -11], [AX - 0.1, -6.5], [-AX + 0.1, -18.6], [AX - 0.1, -22]] as [number, number][]) kit.torch(x, 3.2, z, x < 0 ? 1 : -1, 0, x + z, 0xb8c4f0, 20);
  kit.skirting(-AX, AX, Z0, Z1, 1.3);
  kit.aoSides(-AX, AX, Z0, Z1, H);
  kit.wear([[0, 1.5], [0.4, -10], [0, -24]], 1.4);
  kit.bake();
  refreshBlocks();
  const gate = shotGate(ctx.die);
  const tmp = new THREE.Vector3();
  void tmp;

  const floorOf = () => 0;
  return {
    name: 'A Biblioteca',
    subtitle: 'O Arquivo das Sentenças.',
    group: kit.group,
    surfaces: kit.surfaces,
    emitters: kit.emitters,
    inscriptions: kit.inscriptions,
    interactables,
    doorZ: Z0,
    entranceZ: Z1,
    start: new THREE.Vector3(0, 0, 1.2),
    startYaw: 0,
    fog: { color: '#0a0a12', near: 7, far: 34 },
    ambient: { color: 0x7a7cb0, intensity: 1.85 },
    boxes: [...boxes, ...kit.boxes],
    bonus: () => C.bonus() || paperGem || aulaGem,
    rects() {
      return [...rects, ...C.rect(), ...kit.rects, ...entrance.rects(), ...door.rects(true)];
    },
    clampDie(p, vel, e, R) {
      const w = inWing(p.x, p.z);
      const top = w ? WH : H;
      if (p.y > top - R) {
        p.y = top - R;
        if (vel.y > 0) vel.y = -vel.y * e;
      }
      if (w) {
        const sx = Math.sign(p.x) * WX;
        if (Math.abs(p.x) > WX - R) {
          p.x = sx - Math.sign(p.x) * R;
          vel.x = -vel.x * e;
        }
        if (p.z < w[0] + R) {
          p.z = w[0] + R;
          if (vel.z < 0) vel.z = -vel.z * e;
        } else if (p.z > w[1] - R) {
          p.z = w[1] - R;
          if (vel.z > 0) vel.z = -vel.z * e;
        }
      } else if (Math.abs(p.x) > AX - R) {
        // a parede do Átrio (menos nas passagens, abaixo da verga)
        const mids = (p.x < 0 ? [WINGS.pedras, WINGS.papel] : [WINGS.museu, WINGS.aula]).map(([a, b]) => (a + b) / 2);
        const inGap = p.y < 2.8 && mids.some((m) => Math.abs(p.z - m) < 1 - R);
        if (!inGap) {
          p.x = Math.sign(p.x) * (AX - R);
          vel.x = -vel.x * e;
        }
      }
      if (!w && p.z < Z0 + R + 0.03) {
        p.z = Z0 + R + 0.03;
        if (vel.z < 0) vel.z = -vel.z * e;
      } else if (p.z > Z1 - R) {
        p.z = Z1 - R;
        if (vel.z > 0) vel.z = -vel.z * e;
      }
    },
    groundY: floorOf,
    surfaceAt: (x, z) => kit.surfaceAt(x, z),
    // o som do lugar (§60): um ar leve desce pelo óculo do Átrio
    ambience: { wind: windNear([{ x: 0, z: -12, r: 5, k: 0.22 }]) },
    dieFloor: floorOf,
    holdsDie: () => false,
    update(dt, t) {
      kit.tick(dt, t);
      gate.tick();
      C.update(dt, t);
      paperNiche.update(dt, t);
      aulaNiche.update(dt, t);
      // ── os livros que mentem ──
      for (const b of books) b.cloth?.update(dt, t);
      const caderno = books.find((b) => b.kind === 'caderno' && b.cloth && b.cloth.k > 0.5);
      if (caderno && !lostPage) {
        lostPage = true;
        ctx.caption('Um caderno de alguém', 'Uma página se perdeu.', '#d8b880');
      }
      if (!paperGem && books.filter((b) => b.kind === 'boato').every((b) => b.cloth && b.cloth.k >= 1)) paperNiche.open();
      const lp = ctx.player.pos;
      if (lostPage && !(lp.x < -AX && lp.z > WINGS.papel[0] && lp.z < WINGS.papel[1])) {
        // saiu da ala: os cadernos voltam (a página volta com eles)
        for (const b of books) if (b.kind === 'caderno') b.cloth?.restore();
        lostPage = false;
      }
      // ── as lousas da sala de aula ──
      aula.forEach((a, k) => {
        const lockedNow = a.locked();
        a.board.setDim(lockedNow ? 0 : 1);
        a.board.update(dt, t);
        a.mural.emissiveIntensity += ((a.done ? 0.35 : 0) - a.mural.emissiveIntensity) * Math.min(1, dt * 3);
        if (a.done || lockedNow) return;
        const i = a.board.hit();
        if (i >= 0 && !a.board.grid.lit[i] && gate.take()) {
          a.board.grid.ignite(i);
          ctx.sfx('ignite', `aula${k}`);
        }
        if (a.board.grid.points().length && a.board.grid.writes(a.want)) {
          a.done = true;
          ctx.sfx('piece');
          if (k === 2) aulaNicheOpen();
        } else if (a.board.grid.points().length >= 5) {
          a.board.grid.clear();
          ctx.sfx('burnout');
        }
      });
      // ── o Escrivão no escritório: escreve, de costas; o jogador chega perto da grade e ele some (a lamparina apaga) ──
      if (!scribeGone) {
        scribe.animate(dt, t, { walk: 0, lean: 0.45, headPitch: 0.5, reach: 0.3 + 0.06 * Math.sin(t * 6) });
        lampFlame.material.map = kit.frame(t * 8);
        if (lp.x > OX0 - 0.6 && lp.z < OZ1 + 1.3 && lp.z > OZ1) {
          scribeGone = true;
          scribe.group.visible = false;
          lampFlame.visible = false;
          lampLight.intensity = 0;
          ctx.sfx('burnout');
        }
      }
    },
    skip() {},
    isSolved: () => true,
    reset() {
      C.reset();
      for (const b of books) b.cloth?.restore();
      aula.forEach((a) => {
        a.done = false;
        a.board.grid.clear();
      });
    },
    dispose() {},
  };
}
