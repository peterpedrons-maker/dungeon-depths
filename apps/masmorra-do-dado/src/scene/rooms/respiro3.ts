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
import { buildDoor, buildEntrance, Kit, lambert } from '../kit';
import { makeBrazier } from '../brazier';
import { makeGemNiche } from '../firegrid';
import { makeScribe } from '../scribe';
import { chalkTexture, decalRes } from '../chalkdraw';
import { mkBox, Z1 } from './shell';
import { diary, diaryStore } from '../../story/diary';
import type { Box, Ctx, Interactable, Rect, Room } from '../types';
import { bakeProps, placeProp, T_HEIGHT } from '../props';
import { beamMotes, flagstones, floorPlane, groinVault, masonry, reliefMat, reliefPlaneMat, ST, stoneBox, transverseArch } from '../arch';

const X0 = -3.5;
const X1 = 3.5;
const Z0 = -26;
// A SALA-MODELO (DESIGN.md §65): a galeria ganha abóbadas de aresta em cinco tramos, nascendo a 5,2 m (acima das marcas de giz e das tochas)
// de arcos apoiados em mísulas; paredes de cantaria com espessura; duas frestas altas nas lunetas
const SPRING = 5.2;
const RISE = 2.4;
const HT = SPRING + RISE; // altura das paredes (o alto das lunetas)
const RIBS = [-3.6, -9.2, -14.8, -20.4]; // os arcos (onde as abóbadas se encontram)
const WIN_R = { z: -17.6, y: 6.2, w: 0.62, h: 1.0 }; // a fresta da direita (a luz fria cai no banco do Escrivão)
const sq = (u: number) => Math.sqrt(Math.max(0, 1 - u * u));
const vaultAt = (x: number) => SPRING + RISE * sq(x / X1); // a altura da abóbada (sobre o arco)
// o teto em (x, z): a abóbada de aresta é a união dos dois berços do tramo; embaixo dos arcos, as aduelas descem 0,34 m
const ceilAt = (x: number, z: number) => {
  const bay = Math.min(4, Math.max(0, Math.floor((Z1 - z) / 5.6)));
  const zc = Z1 - 2.8 - bay * 5.6;
  const nearRib = RIBS.some((r) => Math.abs(z - r) < 0.35);
  return SPRING + RISE * Math.max(sq(x / X1), sq((z - zc) / 2.8)) - (nearRib ? 0.4 : 0);
};
// a câmara lateral (à esquerda), com a passagem em z ∈ [CZ - 0.9, CZ + 0.9]
const CH = { x0: -10, z0: -16, z1: -8, h: 4 };
const CZ = -12;

export function buildRespiro3(ctx: Ctx): Room {
  const kit = new Kit('crypt');
  // materiais: cantaria com relevo (paredes), pedra mais miúda e escura (abóbadas), aduelas claras (arcos), lajes (chão)
  const wallT = masonry({ rows: [16, 24], blocks: [26, 60], seed: 351, theme: 'crypt' });
  const wallM = reliefMat(wallT, 4.5);
  const vaultM = reliefMat(masonry({ rows: [12, 16], blocks: [22, 42], seed: 352, theme: 'crypt', tint: 0.78, cracks: 0.3 }), 2.2);
  const ringM = reliefMat(masonry({ w: 128, h: 32, rows: [32, 32], blocks: [32, 32], seed: 353, theme: 'crypt', tint: 1.1, cracks: 0.25 }), 2.2);
  ringM.side = THREE.DoubleSide;
  const fillM = wallM.clone();
  fillM.side = THREE.DoubleSide;
  const floorT = flagstones(354, 'crypt');
  // peça estática (arcos, mísulas, ferragens): entra solta no grupo e o kit.bake junta as do mesmo material numa malha só (menos desenhos por quadro)
  const piece = (o: THREE.Object3D) => {
    for (const m of o instanceof THREE.Group ? [...o.children] : [o]) {
      const mesh = m as THREE.Mesh;
      if (mesh.geometry?.index) mesh.geometry = mesh.geometry.toNonIndexed();
      m.userData.merge = true;
      m.castShadow = true;
      kit.group.add(m);
    }
  };
  kit.add(floorPlane(X0, X1, Z0, Z1, 0, reliefMat(floorT, 4.5), 2 * ST));
  for (let i = 0; i <= RIBS.length; i++) {
    const za = i < RIBS.length ? RIBS[i] : Z0;
    const zb = i === 0 ? Z1 : RIBS[i - 1];
    kit.add(groinVault(X0, X1, za, zb, SPRING, RISE, vaultM));
  }
  for (const zr of RIBS) {
    // o arco nasce de duas mísulas (pedras em balanço) no alto das paredes, acima das marcas de giz
    const arch = transverseArch({ zc: zr, depth: 0.42, xs: X1 - 0.32, spring: SPRING, rise: RISE, thick: 0.34, wallX: X1, top: vaultAt, ring: ringM, fill: fillM });
    piece(arch);
    for (const sx of [-1, 1]) {
      piece(stoneBox(0.34, 0.28, 0.5, ringM, sx * (X1 - 0.17), SPRING - 0.14, zr));
      piece(stoneBox(0.2, 0.3, 0.36, ringM, sx * (X1 - 0.1), SPRING - 0.43, zr));
    }
  }
  const entrance = buildEntrance(kit, { x0: X0, x1: X1, z: Z1, h: HT, wallMat: wallM, uvScale: ST, thick: 0.45 });
  // paredes com espessura (por fora); a esquerda com a passagem para a câmara (z ∈ [CZ - 0.9, CZ + 0.9], 2,6 m de altura); a direita com a fresta
  const TW = 0.35;
  const wallL = (z0: number, z1: number, y0 = 0, h = HT) => kit.add(stoneBox(TW, h, z1 - z0, wallM, X0 - TW / 2, y0 + h / 2, (z0 + z1) / 2));
  wallL(Z0 - 0.45, CZ - 0.9);
  wallL(CZ + 0.9, Z1 + 0.45);
  wallL(CZ - 0.9, CZ + 0.9, 2.6, HT - 2.6);
  {
    const wz0 = WIN_R.z - WIN_R.w / 2;
    const wz1 = WIN_R.z + WIN_R.w / 2;
    const wy0 = WIN_R.y - WIN_R.h / 2;
    const wy1 = WIN_R.y + WIN_R.h / 2;
    const zA = Z0 - 0.45;
    const zB = Z1 + 0.45;
    const R = (h: number, d: number, y: number, z: number) => kit.add(stoneBox(TW, h, d, wallM, X1 + TW / 2, y, z));
    R(wy0, zB - zA, wy0 / 2, (zA + zB) / 2);
    R(HT - wy1, zB - zA, (wy1 + HT) / 2, (zA + zB) / 2);
    R(wy1 - wy0, wz0 - zA, WIN_R.y, (zA + wz0) / 2);
    R(wy1 - wy0, zB - wz1, WIN_R.y, (wz1 + zB) / 2);
  }
  const door = buildDoor(kit, { x0: X0, x1: X1, z0: Z0, h: HT, lamps: 1, connected: true, wallMat: wallM, uvScale: ST, thick: 0.45 });
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
    // (centenas: a contagem miúda, de giz fino, igual à de antes no tamanho; o giz agora é o do jogo, feito à mão, DESIGN.md §79)
    const seed = 31 + dk * 17;
    kit.decal(2.4, 1.8, `tally${dk}`, () => chalkTexture('contagem', 128, 96, seed, { days: 150 + (seed % 60), step: 3 }), x + nx * 0.02, 2.2 + (dk % 3) * 0.5, z, 0, nx > 0 ? Math.PI / 2 : -Math.PI / 2);
    dk++;
  }
  kit.decal(1.4, 1.05, 'rosto', () => chalkTexture('rosto', ...decalRes(1.4, 1.05), 5), X1 - 0.02, 1.6, -15.6, 0, -Math.PI / 2);
  kit.decal(1.1, 0.85, 'porta', () => chalkTexture('porta', ...decalRes(1.1, 0.85), 6), X0 + 0.02, 1.5, -19, 0, Math.PI / 2);
  // o desenho dos tamanhos (GRANDE e PEQUENO), e a três passos a folha nº 6 dela, que diz o contrário
  kit.decal(1.7, 1.28, 'tamanhos', () => chalkTexture('tamanhos', ...decalRes(1.7, 1.28), 7), X1 - 0.02, 1.5, -5.4, 0, -Math.PI / 2);
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
  let moonTick = 0;
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
    // (a câmara do puzzle: a mesma pedra da galeria, com relevo; a forma, as frases, os braseiros e o nicho não mudam)
    kit.plane(cw, cl, reliefPlaneMat(floorT, cw, cl, 4.5, 2 * ST), cx, 0, cz, -Math.PI / 2);
    kit.plane(cw, cl, reliefPlaneMat(masonry({ rows: [12, 16], blocks: [22, 42], seed: 355, theme: 'crypt', tint: 0.78 }), cw, cl, 2.2), cx, CH.h, cz, Math.PI / 2);
    kit.plane(cl, CH.h, reliefPlaneMat(wallT, cl, CH.h, 4.5), CH.x0, CH.h / 2, cz, 0, Math.PI / 2);
    kit.plane(cw, CH.h, reliefPlaneMat(wallT, cw, CH.h, 4.5), cx, CH.h / 2, CH.z0, 0, 0);
    kit.plane(cw, CH.h, reliefPlaneMat(wallT, cw, CH.h, 4.5), cx, CH.h / 2, CH.z1, 0, Math.PI);
    // o batente da passagem, com a frase «ACENDER BRASEIRO ORDEM» por cima (do lado da galeria)
    for (const z of [CZ - 1.05, CZ + 1.05]) kit.box(0.34, 2.7, 0.3, kit.slab, X0 + 0.12, 1.35, z, false); // os batentes da passagem
    // a verga: mais fina e mais rasa que os batentes (a de 30 cm × 34 cm entrava na frase «ACENDER BRASA ORDEM» logo acima, e de baixo a
    // escondia; esta deixa a frase inteira à vista de 2 m da parede para lá; §67)
    kit.box(0.22, 0.17, 2.4, kit.slab, X0 + 0.08, 2.635, CZ, false);
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
  // (na parede do lado da entrada da câmara: no fundo ela ficava a 1,5 m das frases a giz e da lei talhada, e a luz apagava os glifos)
  kit.torch(-8.6, 2.6, CH.z1 - 0.1, 0, -1, 1.3, 0xffa860, 24);
  let bonus = false;
  const niche = makeGemNiche(kit, ctx, -9.0, 1.25, CH.z0 + 0.02, 0, 1, () => (bonus = true), 'p17'); // (era uma gema; agora uma folha dela: DESIGN.md §69)
  interactables.push(niche.interactable);
  const SEQ = [1, 2, 0]; // DOIS, TRÊS, UM
  let prog = 0;
  let failT = -1;
  let solved = false;

  // luz: tochas baixas ao longo da galeria (cada uma com a sua luz e a sua sombra; DESIGN.md §64)
  kit.lively = true;
  const e0 = kit.emitters.length;
  for (const [x, nx, z] of [[X1, -1, -1], [X0, 1, -10], [X1, -1, -15.5], [X0, 1, -24.5], [X1, -1, -21]] as [number, number, number][]) kit.torch(x + nx * 0.1, 2.3, z, nx, 0, z, 0xffa860, 30);
  kit.emitters.slice(e0).forEach((e) => (e.shadow = true));
  const lifeFx: ((t: number) => void)[] = [];
  // ── A FRESTA: a única luz que não é fogo. Entra alta pela luneta da direita e cai em diagonal no banco do Escrivão ──
  let moon: THREE.SpotLight;
  {
    const iron = new THREE.MeshLambertMaterial({ color: 0x2a2724 });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(WIN_R.w, WIN_R.h), new THREE.MeshBasicMaterial({ color: 0xa9bce6, fog: false }));
    glow.position.set(X1 + TW - 0.02, WIN_R.y, WIN_R.z);
    glow.rotation.y = -Math.PI / 2;
    kit.group.add(glow);
    for (const dz of [-0.16, 0, 0.16]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.045, WIN_R.h, 0.045), iron);
      bar.position.set(X1 + 0.12, WIN_R.y, WIN_R.z + dz);
      piece(bar);
    }
    piece(stoneBox(0.5, 0.12, WIN_R.w + 0.3, ringM, X1 + 0.05, WIN_R.y - WIN_R.h / 2 - 0.06, WIN_R.z));
    moon = new THREE.SpotLight(0xa8bce8, 75, 15, 0.26, 0.55, 1.4);
    moon.position.set(X1 + 0.3, WIN_R.y, WIN_R.z);
    moon.target.position.set(X0 + 0.7, 0.45, -20.2);
    moon.castShadow = true;
    moon.shadow.mapSize.set(512, 512);
    moon.shadow.camera.near = 0.2;
    moon.shadow.camera.far = 15;
    moon.shadow.bias = -0.002;
    moon.shadow.autoUpdate = false; // a sombra da fresta só se refaz quando algo se mexe embaixo dela (ver update)
    moon.shadow.needsUpdate = true;
    kit.group.add(moon, moon.target);
    // (poeira mais rala e mais apagada: com 52 grãos a meia opacidade o feixe parecia chuviscar; §67)
    lifeFx.push(beamMotes(kit.group, moon.position.clone(), moon.target.position.clone(), 34, 0xc8d4f0, 0.32));
  }
  // ── OS OBJETOS DE QUEM VIVEU AQUI ESPERANDO (DESIGN.md §65): pequenas cenas encostadas nas paredes, nunca no caminho, longe da passagem da
  // câmara, das folhas, dos desenhos e do banco do Escrivão. Só coisas do dia a dia (nada de RPG, DIRECAO_DE_ARTE.md §4.7) ──
  const candles: THREE.Sprite[] = [];
  const TH = (n: string) => T_HEIGHT[n];
  const block = (x0: number, z0: number, x1: number, z1: number, h = 0.9) => {
    rects.push([x0, z0, x1, z1, h + 0.1]);
    boxes.push(mkBox(x0, 0, z0, x1, h, z1));
    kit.contact((x0 + x1) / 2, (z0 + z1) / 2, (x1 - x0) * 1.35, (z1 - z0) * 1.35); // a sombra de contato: o objeto assenta no chão
  };
  const placed: THREE.Object3D[] = [];
  const put = (pk: string, n: string, x: number, y: number, z: number, ry = 0, h?: number) => {
    const o = placeProp(kit.group, pk, n, x, y, z, ry, h);
    placed.push(o);
    return o;
  };
  const candle = (x: number, y: number, z: number, hgt = 0.2, power = 5) => {
    // a chama da vela (o mesmo desenho das tochas, pequenininha) e uma luz fraca, sem sombra
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], color: 0xffc27a, fog: false, alphaTest: 0.5, depthWrite: false }));
    f.scale.set(0.055, 0.085, 1);
    f.position.set(x, y + hgt, z);
    kit.group.add(f);
    candles.push(f);
    if (power > 0) kit.light(x + 0.15, y + hgt + 0.3, z, 0xffb060, power);
  };
  // 1 · ONDE ALGUÉM DORMIA (esquerda, logo depois da entrada): a cama encostada na parede, a banqueta de cabeceira com a vela, o saco no pé
  {
    const bed = put('q', 'Bed_Twin2', X0 + 0.6, 0, -1.35, Math.PI); // a cabeceira do lado da banqueta
    bed.scale.set(0.6, 0.82, 0.84); // cama de solteiro: 1,1 × 2,0 m
    block(X0, -2.37, X0 + 1.17, -0.33, 0.6);
    put('q', 'Stool', X0 + 0.42, 0, 0.12, 0.4);
    block(X0, -0.12, X0 + 0.68, 0.37, 0.6);
    put('q', 'Candle_1', X0 + 0.44, 0.59, 0.1, 0);
    candle(X0 + 0.44, 0.59, 0.1, 0.16, 4);
    put('t', 'tankard_wood', X0 + 0.85, 0, 0.3, 2.2, TH('tankard_wood'));
    put('t', 'sack_2', X0 + 0.42, 0, -2.85, 1.3, TH('sack_2'));
    block(X0, -3.15, X0 + 0.75, -2.55, 0.5);
  }
  // 2 · A MESA (esquerda, entre o banco e a passagem da câmara): o saco em cima da mesa, a caneca, o prato, o castiçal aceso; uma banqueta
  // puxada e outra caída
  {
    put('t', 'table_wood', X0 + 0.65, 0, -8.45, Math.PI / 2, TH('table_wood'));
    block(X0, -9.95, X0 + 1.25, -6.95, 0.85);
    put('t', 'sack_2', X0 + 0.5, 0.8, -7.55, 0.6, 0.42);
    put('q', 'Mug', X0 + 0.95, 0.8, -8.25, 0.9);
    put('q', 'Table_Plate', X0 + 0.75, 0.8, -8.8, 0);
    put('q', 'CandleStick_Triple', X0 + 0.35, 0.8, -9.45, Math.PI / 2);
    for (const dz of [-0.15, 0, 0.15]) candle(X0 + 0.35, 0.8, -9.45 + dz, 0.47, dz === 0 ? 6 : 0);
    put('q', 'Stool', X0 + 1.55, 0, -7.85, 0.5);
    block(X0 + 1.3, -8.1, X0 + 1.8, -7.6, 0.6);
    const fallen = put('q', 'Stool', X0 + 1.75, 0.235, -9.55, 0.9);
    fallen.rotation.x = Math.PI / 2;
    block(X0 + 1.45, -9.85, X0 + 2.05, -9.25, 0.5);
    put('q', 'Bucket_Wooden_1', X0 + 0.45, 0, -7.1, 0.3);
  }
  // 3 · A DESPENSA (direita, junto da entrada): o barril, o caixote com um saco em cima, o balde; a caneca esquecida no barril
  {
    put('t', 'barrel', X1 - 0.5, 0, 1.25, 0.3, TH('barrel'));
    block(X1 - 0.92, 0.83, X1, 1.67);
    put('q', 'Crate_Wooden', X1 - 0.5, 0, 0.1, 0.12);
    block(X1 - 0.95, -0.37, X1, 0.57, 0.93);
    put('t', 'sack_2', X1 - 0.5, 0.93, 0.15, 2.1, 0.4);
    put('q', 'Bucket_Wooden_1', X1 - 1.25, 0, 0.95, 0.6);
    block(X1 - 1.47, 0.75, X1 - 1.03, 1.15, 0.3);
    put('q', 'Mug', X1 - 0.45, 0.9, 1.25, 2.4);
  }
  // 4 · A PRATELEIRA (direita, perto do meio): o que sobrou de quem comia aqui; um cesto embaixo e um pote quebrado no chão
  {
    put('q', 'Shelf_Simple', X1 - 0.15, 1.35, -13.1, -Math.PI / 2);
    put('t', 'tankard_wood', X1 - 0.2, 1.66, -12.7, 0.6, TH('tankard_wood'));
    put('t', 'plate_wood', X1 - 0.2, 1.66, -13.25, 0, TH('plate_wood'));
    put('q', 'Pot_1', X1 - 0.2, 1.66, -13.45, 0.4, 0.16);
    put('q', 'Candle_1', X1 - 0.2, 1.66, -13.85, 0);
    candle(X1 - 0.2, 1.66, -13.85, 0.16, 3.5);
    put('t', 'basket', X1 - 0.45, 0, -12.55, 0.8, TH('basket'));
    block(X1 - 0.8, -12.9, X1, -12.2, 0.62);
    put('q', 'Vase_Rubble_Medium', X1 - 0.6, 0, -13.85, 0.9);
  }
  // 5 · AS CORRENTES (direita, entre os bancos do fundo): uma argola na parede, a corrente caída e enrolada no chão, uma corda
  {
    const iron = new THREE.MeshLambertMaterial({ color: 0x34302b });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 6, 12), iron);
    ring.position.set(X1 - 0.04, 1.25, -19.6);
    ring.rotation.y = Math.PI / 2;
    piece(ring);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.2), iron);
    plate.position.set(X1 - 0.025, 1.42, -19.6);
    piece(plate);
    for (let k = 0; k < 6; k++) {
      // os elos que descem da argola até o chão
      const l = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 4, 8), iron);
      l.position.set(X1 - 0.08 - k * 0.015, 1.05 - k * 0.15, -19.6 + (k % 2) * 0.01);
      l.rotation.set(0, k % 2 ? 0 : Math.PI / 2, 0);
      piece(l);
    }
    put('q', 'Chain_Coil', X1 - 0.6, 0, -19.75, 0.6, 0.07);
    put('q', 'Rope_1', X1 - 0.45, 0, -21.15, 1.7);
  }
  // 6 · O LUGAR DO ESCRIVÃO (banco da esquerda, no fundo): a vela dele, que continua acesa depois que ele some, e o rolo
  {
    put('q', 'Candle_1', X0 + 0.42, 0.45, -20.8, 0);
    candle(X0 + 0.42, 0.45, -20.8, 0.16, 5);
    put('q', 'Scroll_1', X0 + 0.4, 0.45, -19.3, 1.1);
  }
  // 7 · JUNTO DA PORTA: um suporte com dois barris (direita); um barril, um pote e a sacola encostada (esquerda)
  {
    put('q', 'Barrel_Holder', X1 - 0.9, 0, -25.5, 0);
    block(X1 - 1.6, -25.9, X1 - 0.2, -25.1, 1.26);
    put('t', 'barrel', X0 + 0.55, 0, -25.4, 1.1, TH('barrel'));
    block(X0, -25.85, X0 + 0.97, -24.95);
    put('q', 'Vase_4', X0 + 1.25, 0, -25.55, 0.2);
    block(X0 + 1.05, -25.75, X0 + 1.45, -25.35, 0.5);
    put('q', 'Bag', X0 + 0.45, 0, -24.55, 2.6, 0.62);
    block(X0, -24.85, X0 + 0.8, -24.25, 0.62);
  }
  // o candelabro velho, apagado, pendurado do fecho da abóbada do meio por uma corrente
  {
    const CHY = 4.3;
    put('q', 'Chandelier', 0, CHY, -12, 0.3);
    const chain = new THREE.Mesh(new THREE.BoxGeometry(0.035, HT - (CHY + 1.46), 0.035), new THREE.MeshLambertMaterial({ color: 0x2a2622 }));
    chain.position.set(0, (HT + CHY + 1.46) / 2, -12);
    kit.group.add(chain);
  }
  bakeProps(kit.group, placed, ['q', 't']); // (todos os objetos parados numa malha por material, quando os packs chegarem)
  kit.aoSides(X0, X1, Z0, Z1, SPRING);
  kit.cornice(X0, X1, Z0, Z1, SPRING - 0.6);
  kit.wear([[0, 1.5], [0.3, -8], [-0.2, -18], [0, -25]], 1.2);
  kit.group.userData.ownShadows = false;
  kit.bake();
  // os bancos de pedra também fazem sombra
  kit.group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && m.material === kit.slab) m.castShadow = true;
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
    fog: { color: '#0a0a11', near: 6, far: 26 },
    ambient: { color: 0x5c5c8a, intensity: 0.68 }, // (menos luz de enchimento: as sombras das chamas ficam fundas, DESIGN.md §66)
    boxes: [...boxes, ...kit.boxes],
    shadowLight: moon,
    sockets: braz.map((b) => b.socket),
    bonus: () => bonus,
    rects() {
      return [...rects, ...kit.rects, ...entrance.rects(), ...door.rects(true), ...braz.map((b) => b.rect), [X1, Z0, X1 + 2, Z1 + 0.5]];
    },
    clampDie(p, vel, e, R) {
      const inCh = p.x < X0 && p.z > CH.z0 && p.z < CH.z1;
      const top = inCh ? CH.h : ceilAt(p.x, p.z);
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
      for (const f of lifeFx) f(t);
      // a sombra da fresta: refeita a cada quadro quando o jogador ou o dado passam pelo fundo da galeria, e a cada 3 enquanto o Escrivão escreve
      {
        moonTick++;
        const inBeam = (v: THREE.Vector3) => v.z < -14.5 && v.z > -24 && v.x < 1.5;
        if (inBeam(ctx.player.pos) || (ctx.die.state !== 'hand' && inBeam(ctx.die.pos)) || (!scribeGone && moonTick % 3 === 0)) moon.shadow.needsUpdate = true;
      }
      candles.forEach((f, i) => (f.material.map = kit.frame(t * 9 + i * 3)));
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
            moon.shadow.needsUpdate = true;
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
