// R3 · A GALERIA DOS CONDENADOS (PUZZLES_PROPOSTAS.md §2b "R3", §5 e Ficha 3). Respiro entre O Boato Verdadeiro e A Sombra: sem trava.
// Uma galeria longa e alta, com bancos de pedra e, nas paredes, centenas de MARCAS DE CONTAGEM a giz (dias? tentativas?) e desenhos de outros
// condenados (um braseiro, uma porta, um rosto apagado). Sobre a porta de saída, talhada: «CONDENADO LER SENTENÇA».
// - O Escrivão (4ª aparição) está sentado no fim da galeria, escrevendo; quando o jogador chega perto, ele se levanta e some.
// - Desenho a giz: um braseiro ENORME e um MINÚSCULO, com GRANDE e PEQUENO embaixo. A três passos, a folha nº 6 dela, que diz o contrário (ela erra).
// - No banco do fundo, a folha nº 5 dela (a pista da sala do Escuro).
// - PUZZLE OPCIONAL (nível 3; tools/verify_lei.mjs): numa CÂMARA LATERAL, três braseiros (UM, DOIS, TRÊS), o mural da balança («DOIS IGUAL DOIS»),
//   três frases RISCADAS A GIZ por condenados (boatos: giz não é pedra): «TRÊS ANTES UM», «TRÊS ANTES DOIS», «DOIS DEPOIS TRÊS», e a lei TALHADA
//   «UM BOATO IGUAL VERDADE». Ordem: DOIS, TRÊS, UM → abre o nicho da gema.
import * as THREE from 'three';
import { floorTexture } from '../textures';
import { buildDoor, buildEntrance, Kit, lambert, T } from '../kit';
import { makeBrazier } from '../brazier';
import { makeGemNiche } from '../firegrid';
import { makeScribe } from '../scribe';
import { mkBox, Z1 } from './shell';
import { diary, diaryStore } from '../../story/diary';
import type { Box, Ctx, Interactable, Rect, Room } from '../types';
import { placeProp, T_HEIGHT } from '../props';

// PRÉVIA (?objetos=1, DESIGN.md §60): a galeria com os objetos dos condenados (modelos 3D dos packs) e as tochas com sombra de verdade
const PROPS_ON = typeof location !== 'undefined' && new URLSearchParams(location.search).has('objetos');

const X0 = -3.5;
const X1 = 3.5;
const Z0 = -26;
const H = 7;
// a câmara lateral (à esquerda), com a passagem em z ∈ [CZ - 0.9, CZ + 0.9]
const CH = { x0: -10, z0: -16, z1: -8, h: 4 };
const CZ = -12;

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
// marcas de contagem a giz: grupos de quatro riscos e um corte, em fileiras tortas
function tallyTexture(seed: number) {
  let s = seed;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  return canvasTex(128, 96, (g) => {
    g.clearRect(0, 0, 128, 96);
    g.fillStyle = 'rgba(232,228,214,0.85)';
    for (let row = 0; row < 7; row++) {
      let x = 2 + r() * 6;
      const y = 6 + row * 13 + r() * 3;
      while (x < 118) {
        for (let k = 0; k < 4; k++) g.fillRect(Math.round(x + k * 3), Math.round(y + r() * 1.5), 1, 8);
        for (let k = 0; k < 12; k++) g.fillRect(Math.round(x - 1 + k), Math.round(y + 7 - k * 0.6), 1, 1);
        x += 16 + r() * 4;
        if (r() < 0.12) x += 14;
      }
    }
  });
}
// os desenhos a giz: o braseiro grande e o pequeno (com os glifos GRANDE e PEQUENO embaixo) e um rosto apagado
function chalkDrawing(kind: 'tamanhos' | 'rosto' | 'porta') {
  return canvasTex(128, 96, (g) => {
    g.clearRect(0, 0, 128, 96);
    g.strokeStyle = 'rgba(236,232,220,0.9)';
    g.fillStyle = 'rgba(236,232,220,0.9)';
    g.lineWidth = 2;
    const line = (pts: number[][]) => {
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
    };
    if (kind === 'tamanhos') {
      // braseiro enorme
      line([[10, 64], [50, 64], [44, 74], [16, 74], [10, 64]]);
      line([[24, 74], [24, 84]]);
      line([[36, 74], [36, 84]]);
      line([[16, 62], [22, 36], [30, 50], [34, 24], [40, 48], [46, 62]]);
      // braseiro minúsculo
      line([[90, 76], [104, 76], [102, 80], [92, 80], [90, 76]]);
      line([[94, 75], [97, 66], [100, 75]]);
      // GRANDE (moldura em V com os quatro cantos) e PEQUENO (moldura em V com o centro)
      const glyph = (cx: number, pts: number[]) => {
        line([[cx - 9, 86], [cx - 9, 95], [cx + 9, 95], [cx + 9, 86]]);
        for (const p of pts) g.fillRect(cx - 6 + (p % 3) * 6 - 1, 86 + Math.floor(p / 3) * 3, 2, 2);
      };
      glyph(30, [0, 2, 6, 8]);
      glyph(97, [4]);
    } else if (kind === 'rosto') {
      g.globalAlpha = 0.35;
      g.strokeRect(34, 20, 60, 60);
      line([[46, 42], [58, 42]]);
      line([[70, 42], [82, 42]]);
      line([[64, 46], [64, 62]]);
      line([[52, 68], [76, 68]]);
    } else {
      line([[44, 90], [44, 30], [64, 14], [84, 30], [84, 90]]);
      line([[58, 60], [62, 60]]);
    }
  });
}

export function buildRespiro3(ctx: Ctx): Room {
  const kit = new Kit('crypt');
  const W = X1 - X0;
  const L = Z1 - Z0;
  const zm = (Z0 + Z1) / 2;
  kit.plane(W, L, lambert(floorTexture([W / T, L / T], 'crypt')), 0, 0, zm, -Math.PI / 2);
  kit.plane(W, L, kit.brick([W / T, L / T], 0.6, 19), 0, H, zm, Math.PI / 2);
  const entrance = buildEntrance(kit, { x0: X0, x1: X1, z: Z1, h: H });
  // parede esquerda com a passagem para a câmara (z ∈ [CZ - 0.9, CZ + 0.9], 2,6 m de altura)
  const wallL = (z0: number, z1: number, y0 = 0, h = H) => kit.plane(z1 - z0, h, kit.brick([(z1 - z0) / T, h / T], 0.95, 33 + Math.round(z0)), X0, y0 + h / 2, (z0 + z1) / 2, 0, Math.PI / 2);
  wallL(Z0, CZ - 0.9);
  wallL(CZ + 0.9, Z1);
  wallL(CZ - 0.9, CZ + 0.9, 2.6, H - 2.6);
  kit.plane(L, H, kit.brick([L / T, H / T], 0.95, 39), X1, H / 2, zm, 0, -Math.PI / 2);
  const door = buildDoor(kit, { x0: X0, x1: X1, z0: Z0, h: H, lamps: 1, connected: true });
  door.setOpen(1);
  door.lampMats[0].color.setHex(0xff7a2e);
  const boxes: Box[] = [mkBox(-1.25, 0, Z0, -0.95, 2.65, Z0 + 0.3), mkBox(0.95, 0, Z0, 1.25, 2.65, Z0 + 0.3)];
  const rects: Rect[] = [];
  // sobre a porta: «CONDENADO LER SENTENÇA»
  kit.inscribe({ words: ['condenado', 'ler', 'sentenca'], x: 0, y: 3.55, z: Z0 + 0.025, nx: 0, nz: 1, size: 0.42, age: 0.2, seed: 211, lead: true });
  // bancos de pedra ao longo das paredes
  for (const [x, z] of [[X1 - 0.45, -4], [X1 - 0.45, -10], [X1 - 0.45, -17], [X0 + 0.45, -5], [X0 + 0.45, -20], [X1 - 0.45, -23]] as [number, number][]) {
    kit.box(0.8, 0.45, 2.2, kit.slab, x, 0.225, z);
    boxes.push(mkBox(x - 0.4, 0, z - 1.1, x + 0.4, 0.45, z + 1.1));
    rects.push([x - 0.4, z - 1.1, x + 0.4, z + 1.1, 0.45]);
    kit.contact(x, z, 1.2, 2.6);
  }
  // marcas de contagem e desenhos a giz nas paredes (decalques)
  let dk = 0;
  for (const [x, nx, z] of [[X1, -1, -2.5], [X1, -1, -7], [X1, -1, -13.5], [X1, -1, -20], [X0, 1, -3], [X0, 1, -7.5], [X0, 1, -17], [X0, 1, -22.5]] as [number, number, number][]) {
    kit.decal(2.4, 1.8, `tally${dk}`, () => tallyTexture(31 + dk * 17), x + nx * 0.02, 2.2 + (dk % 3) * 0.5, z, 0, nx > 0 ? Math.PI / 2 : -Math.PI / 2);
    dk++;
  }
  kit.decal(1.4, 1.05, 'rosto', () => chalkDrawing('rosto'), X1 - 0.02, 1.6, -15.6, 0, -Math.PI / 2);
  kit.decal(1.1, 0.85, 'porta', () => chalkDrawing('porta'), X0 + 0.02, 1.5, -19, 0, Math.PI / 2);
  // o desenho dos tamanhos (GRANDE e PEQUENO), e a três passos a folha nº 6 dela, que diz o contrário
  kit.decal(1.7, 1.28, 'tamanhos', () => chalkDrawing('tamanhos'), X1 - 0.02, 1.5, -5.4, 0, -Math.PI / 2);
  // ── as folhas dela ──
  const leaf = (id: string, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.004, 0.3), lambert(null, 0xd8b880));
    m.position.set(x, y, z);
    m.rotation.y = 0.5;
    kit.group.add(m);
    let taken = (diaryStore.get().pages ?? []).includes(id);
    m.visible = !taken;
    const it: Interactable = {
      pos: m.position.clone(),
      r: 1.6,
      label: 'Pegar a folha',
      enabled: () => !taken,
      use: () => {
        taken = true;
        m.visible = false;
        diary.addPage(id);
        ctx.sfx('gem');
        ctx.caption('Uma folha arrancada', 'É do caderno. A letra dela.', '#d8b880');
      },
    };
    return it;
  };
  const interactables: Interactable[] = [leaf('p6', X1 - 0.45, 0.46, -4.4), leaf('p5', X1 - 0.45, 0.46, -23.4)];
  // ── o Escrivão, sentado no fim da galeria, escrevendo ──
  const scribe = makeScribe();
  scribe.group.position.set(X0 + 0.6, 0.2, -20);
  scribe.group.rotation.y = Math.PI / 2; // de lado, virado para a parede da frente
  scribe.group.scale.setScalar(0.92);
  kit.group.add(scribe.group);
  let scribeK = 0; // 0 = sentado; sobe; some
  let scribeGone = false;
  const chalkMark = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.06), new THREE.MeshBasicMaterial({ color: 0xece8dc, fog: true }));
  chalkMark.rotation.x = -Math.PI / 2;
  chalkMark.position.set(X0 + 0.45, 0.455, -20);
  chalkMark.visible = false;
  kit.group.add(chalkMark);

  // ══ A CÂMARA LATERAL (o puzzle opcional) ══
  {
    const cw = X0 - CH.x0;
    const cl = CH.z1 - CH.z0;
    const cx = (X0 + CH.x0) / 2;
    const cz = (CH.z0 + CH.z1) / 2;
    kit.plane(cw, cl, lambert(floorTexture([cw / T, cl / T], 'crypt')), cx, 0, cz, -Math.PI / 2);
    kit.plane(cw, cl, kit.brick([cw / T, cl / T], 0.6, 29), cx, CH.h, cz, Math.PI / 2);
    kit.plane(cl, CH.h, kit.brick([cl / T, CH.h / T], 0.95, 63), CH.x0, CH.h / 2, cz, 0, Math.PI / 2);
    kit.plane(cw, CH.h, kit.brick([cw / T, CH.h / T], 0.95, 64), cx, CH.h / 2, CH.z0, 0, 0);
    kit.plane(cw, CH.h, kit.brick([cw / T, CH.h / T], 0.95, 65), cx, CH.h / 2, CH.z1, 0, Math.PI);
    // o batente da passagem, com a frase «ACENDER BRASEIRO ORDEM» por cima (do lado da galeria)
    for (const z of [CZ - 1.05, CZ + 1.05]) kit.box(0.34, 2.7, 0.3, kit.slab, X0 + 0.12, 1.35, z, false); // os batentes da passagem
    kit.box(0.34, 0.3, 2.4, kit.slab, X0 + 0.12, 2.75, CZ, false); // a verga
    kit.inscribe({ words: ['acender', 'brasa', 'ordem'], x: X0 + 0.025, y: 3.0, z: CZ, nx: 1, nz: 0, size: 0.32, age: 0.2, seed: 221 });
    rects.push([CH.x0 - 2, CH.z0 - 2, CH.x0, CH.z1 + 2], [CH.x0, CH.z0 - 2, X0, CH.z0], [CH.x0, CH.z1, X0, CH.z1 + 2], [X0 - 0.3, Z0, X0, CZ - 0.9], [X0 - 0.3, CZ + 0.9, X0, Z1]);
  }
  // as frases a giz (boatos), a lei talhada e o mural da balança, na parede do fundo da câmara
  const chalk = (words: string[], y: number, z: number, seed: number) => {
    const ins = kit.inscribe({ words, x: CH.x0 + 0.025, y, z, nx: 1, nz: 0, size: 0.26, age: 0.45, seed });
    for (const p of ins.panels) p.mat.color.setHex(0xdfe8f2); // giz: mais frio e mais claro que a cal talhada
    return ins;
  };
  chalk(['n3', 'antes', 'n1'], 2.5, -10.0, 231);
  chalk(['n3', 'antes', 'n2'], 1.9, -10.0, 233);
  chalk(['n2', 'depois', 'n3'], 1.3, -10.0, 235);
  kit.inscribe({ words: ['n1', 'boato', 'igual', 'verdade', 'conf'], x: CH.x0 + 0.025, y: 2.4, z: -14.0, nx: 1, nz: 0, size: 0.24, age: 0.12, seed: 237, plaque: true });
  kit.inscribe({ words: ['n2', 'igual', 'n2', 'conf'], x: CH.x0 + 0.025, y: 1.5, z: -14.0, nx: 1, nz: 0, size: 0.24, age: 0.12, seed: 239, plaque: true });
  // os três braseiros, com os números nos pedestais
  const bz = [[-6.0, -9.3], [-8.4, -12.0], [-6.0, -14.7]] as [number, number][];
  const braz = bz.map(([x, z]) => makeBrazier(kit, ctx, x, z, false, 0.8));
  braz.forEach((b, k) => {
    boxes.push(...b.boxes);
    kit.inscribe({ words: [`n${k + 1}`], x: bz[k][0], y: 0.36, z: bz[k][1] + 0.245, nx: 0, nz: 1, size: 0.4, age: 0.12, frame: true, seed: 241 + k });
  });
  kit.torch(CH.x0 + 0.1, 2.6, -12, 1, 0, 1.3, 0xffa860, 24);
  let bonus = false;
  const niche = makeGemNiche(kit, ctx, -9.0, 1.25, CH.z0 + 0.02, 0, 1, () => (bonus = true));
  interactables.push(niche.interactable);
  const SEQ = [1, 2, 0]; // DOIS, TRÊS, UM
  let prog = 0;
  let failT = -1;
  let solved = false;

  // luz: tochas baixas ao longo da galeria
  const e0 = kit.emitters.length;
  for (const [x, nx, z] of [[X1, -1, -1], [X0, 1, -10], [X1, -1, -15.5], [X0, 1, -24.5], [X1, -1, -21]] as [number, number, number][]) kit.torch(x + nx * 0.1, 2.3, z, nx, 0, z, 0xffa860, 30);
  // ── PRÉVIA: os objetos de quem viveu aqui esperando (encostados nas paredes, longe do caminho, da passagem da câmara, das folhas e dos desenhos) ──
  const candles: THREE.Sprite[] = [];
  if (PROPS_ON) {
    kit.lively = true;
    kit.emitters.slice(e0).forEach((e) => (e.shadow = true));
    const T = (n: string) => T_HEIGHT[n];
    // [pack, nome, x, y, z, giro, altura (pack t), raio de colisão no chão (0 = em cima do banco / pequeno)]
    const list: [string, string, number, number, number, number, number | undefined, number][] = [
      ['t', 'barrel', 2.85, 0, -0.9, 0.3, T('barrel'), 0.4], // na entrada: um barril e um saco de palha
      ['t', 'sack_2', 2.15, 0, -1.4, 1.2, T('sack_2'), 0.3],
      ['t', 'tankard_wood', 3.05, 0.45, -3.2, 2.0, T('tankard_wood'), 0], // a caneca no banco (a folha nº 6 fica em -4,4)
      ['t', 'bucket_wood', 2.5, 0, -2.6, 0.4, T('bucket_wood'), 0.25],
      ['q', 'Book_Stack_1', -3.05, 0.45, -5.7, 0.4, undefined, 0], // alguém anotava (banco da esquerda)
      ['t', 'candle_plate', -3.1, 0.45, -4.3, 0, T('candle_plate'), 0],
      ['t', 'basket', 2.6, 0, -11.7, 0.8, T('basket'), 0.32],
      ['t', 'plate_wood', 3.05, 0.45, -9.4, 0.3, T('plate_wood'), 0],
      ['q', 'Vase_Rubble_Medium', -2.7, 0, -16.1, 0.9, undefined, 0], // um pote quebrado e um inteiro
      ['q', 'Vase_4', -3.0, 0, -16.9, 0.2, undefined, 0.22],
      ['q', 'Bucket_Metal', 2.75, 0, -15.0, 2.4, undefined, 0.25],
      ['q', 'Chain_Coil', 2.65, 0, -18.7, 0.6, undefined, 0], // correntes no chão, junto da parede
      ['t', 'candle_plate', -3.05, 0.45, -21.4, 0, T('candle_plate'), 0], // a vela do Escrivão, que escrevia aqui
      ['q', 'Scroll_1', -3.0, 0.45, -18.9, 1.1, undefined, 0],
      ['t', 'barrel', -2.85, 0, -25.2, 1.1, T('barrel'), 0.4],
      ['q', 'Crate_Wooden', -2.85, 0, -0.95, 0.15, undefined, 0.6], // um caixote na entrada, do outro lado
      // A MESA DOS CONDENADOS: encostada na parede esquerda, entre o banco e a passagem da câmara; banqueta, caneca, pratos, livros e velas
      ['t', 'table_wood', -2.85, 0, -8.45, Math.PI / 2, T('table_wood'), 0],
      ['q', 'Stool', -1.9, 0, -7.9, 0.5, undefined, 0.25],
      ['q', 'CandleStick_Triple', -3.1, 0.8, -9.3, 1.4, undefined, 0],
      ['q', 'Book_Stack_2', -2.95, 0.8, -7.6, 0.3, undefined, 0],
      ['q', 'Mug', -2.6, 0.8, -8.3, 0.9, undefined, 0],
      ['q', 'Table_Plate', -2.75, 0.8, -8.85, 0, undefined, 0],
      // uma prateleira na parede direita (embaixo das marcas de giz), com garrafas e um vaso
      ['q', 'Shelf_Simple', 3.36, 1.35, -13.1, -Math.PI / 2, undefined, 0],
      ['q', 'Bottle_1', 3.3, 1.66, -12.7, 0, undefined, 0],
      ['q', 'SmallBottles_1', 3.3, 1.66, -13.3, -Math.PI / 2, undefined, 0],
      ['q', 'Vase_4', 3.3, 1.66, -13.75, 0.4, undefined, 0],
      // um suporte com dois barris junto da porta, à direita
      ['q', 'Barrel_Holder', 2.6, 0, -25.2, 0, undefined, 0],
    ];
    rects.push([-3.45, -9.95, -2.25, -6.95, 0.85]); // a mesa
    boxes.push(mkBox(-3.45, 0, -9.95, -2.25, 0.8, -6.95));
    rects.push([1.9, -25.7, 3.3, -24.7, 1.3]); // o suporte dos barris
    // o candelabro velho, apagado, pendurado no meio da galeria por uma corrente
    placeProp(kit.group, 'q', 'Chandelier', 0, 4.2, -12, 0.3);
    const chainM = new THREE.MeshLambertMaterial({ color: 0x2a2622 });
    const chain = new THREE.Mesh(new THREE.BoxGeometry(0.04, H - 5.6, 0.04), chainM);
    chain.position.set(0, (H + 5.6) / 2, -12);
    kit.group.add(chain);
    for (const [pk, n, x, y, z, ry, h, r] of list) {
      placeProp(kit.group, pk, n, x, y, z, ry, h);
      if (r > 0) {
        rects.push([x - r, z - r, x + r, z + r, 1.0]);
        boxes.push(mkBox(x - r, 0, z - r, x + r, 0.9, z + r));
      }
      if (n === 'candle_plate') {
        // a chama da vela (o mesmo desenho das tochas, pequenininha) e uma luz fraca
        const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
        f.scale.set(0.07, 0.1, 1);
        f.position.set(x, y + 0.2, z);
        kit.group.add(f);
        candles.push(f);
        kit.light(x + 0.2, y + 0.45, z, 0xffb060, 5);
      }
    }
  }
  kit.light(0, H - 1, -12, 0x8a94c8, 10);
  kit.skirting(X0, X1, Z0, Z1, 1.3);
  kit.aoSides(X0, X1, Z0, Z1, H);
  kit.cornice(X0, X1, Z0, Z1, H);
  kit.wear([[0, 1.5], [0.3, -8], [-0.2, -18], [0, -25]], 1.2);
  kit.bake();
  if (PROPS_ON)
    kit.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.receiveShadow = true;
      if (m.material === kit.slab) m.castShadow = true; // os bancos de pedra também fazem sombra
    });

  return {
    name: 'A Galeria dos Condenados',
    subtitle: 'Marcas de giz. Centenas.',
    group: kit.group,
    surfaces: kit.surfaces,
    emitters: kit.emitters,
    inscriptions: kit.inscriptions,
    interactables,
    doorZ: Z0,
    entranceZ: Z1,
    start: new THREE.Vector3(0, 0, 1.2),
    startYaw: 0,
    fog: { color: '#0a0a11', near: 5, far: 24 },
    ambient: { color: 0x7078a8, intensity: 1.75 },
    boxes: [...boxes, ...kit.boxes],
    sockets: braz.map((b) => b.socket),
    bonus: () => bonus,
    rects() {
      return [...rects, ...kit.rects, ...entrance.rects(), ...door.rects(true), ...braz.map((b) => b.rect), [X1, Z0, X1 + 2, Z1 + 0.5]];
    },
    clampDie(p, vel, e, R) {
      const inCh = p.x < X0 && p.z > CH.z0 && p.z < CH.z1;
      const top = inCh ? CH.h : H;
      if (p.y > top - R) {
        p.y = top - R;
        if (vel.y > 0) vel.y = -vel.y * e;
      }
      if (inCh) {
        if (p.x < CH.x0 + R) {
          p.x = CH.x0 + R;
          if (vel.x < 0) vel.x = -vel.x * e;
        }
        if (p.z < CH.z0 + R) {
          p.z = CH.z0 + R;
          if (vel.z < 0) vel.z = -vel.z * e;
        } else if (p.z > CH.z1 - R) {
          p.z = CH.z1 - R;
          if (vel.z > 0) vel.z = -vel.z * e;
        }
      } else if (p.x < X0 + R && !(Math.abs(p.z - CZ) < 0.9 - R && p.y < 2.6)) {
        p.x = X0 + R;
        if (vel.x < 0) vel.x = -vel.x * e;
      }
      if (p.x > X1 - R) {
        p.x = X1 - R;
        if (vel.x > 0) vel.x = -vel.x * e;
      }
      if (!inCh && p.z < Z0 + R + 0.03) {
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
      candles.forEach((f, i) => (f.material.map = kit.frames[Math.floor(t * 9 + i * 3) % kit.frames.length]));
      // o Escrivão: escreve, sentado; quando o jogador chega perto, levanta e some, e fica uma marca de giz fresca no banco
      if (!scribeGone) {
        const pz = ctx.player.pos.z;
        const near = pz < -14;
        scribe.animate(dt, t, { walk: 0, lean: 0.35 + 0.05 * Math.sin(t * 2), headPitch: 0.4, reach: 0.25 + 0.05 * Math.sin(t * 5) });
        if (near) scribeK += dt;
        if (scribeK > 0) {
          scribe.group.position.y = 0.2 + Math.min(0.3, scribeK * 0.6);
          scribe.setAlpha(Math.max(0, 1 - (scribeK - 0.8) / 0.7));
          if (scribeK > 1.5) {
            scribeGone = true;
            scribe.group.visible = false;
            chalkMark.visible = true;
            ctx.sfx('burnout');
          }
        }
      }
      // o puzzle da câmara: DOIS, TRÊS, UM (errar: a Casa apaga, sem punição)
      braz.forEach((b) => b.update(t));
      if (!solved && failT < 0) {
        braz.forEach((b, i) => {
          if (!b.touched()) return;
          b.light(true);
          if (i === SEQ[prog]) {
            prog++;
            if (prog >= SEQ.length) {
              solved = true;
              ctx.sfx('piece');
              niche.open();
            }
          } else failT = 1.3;
        });
      }
      if (failT >= 0) {
        failT -= dt;
        if (failT < 0) {
          braz.forEach((b) => b.light(false));
          prog = 0;
          ctx.sfx('error');
        }
      }
      niche.update(dt, t);
    },
    skip() {},
    isSolved: () => true,
    reset() {
      braz.forEach((b) => b.light(false, true));
      prog = 0;
      failT = -1;
    },
    dispose() {},
  };
}
