import { configStore } from '../story/config';
import * as THREE from 'three';
import { diary, diaryStore } from '../story/diary';
import { ui } from '../story/ui';
import { HER_PAGES, HER_RELATO } from '../story/herpages';
import { dialogue, dialogueStore } from '../story/dialogue';
import { BOARD_H, BOARD_W, diaryCoverArt, diaryEdgeArt, diaryLeatherArt, diarySpineArt, drawGemBoard, gemSocketPx } from './bookart';
import { readingStore, TALK_COPY_MS } from '../story/reading';
import { blankPaper, copyCells, currentFloor, ERASER_PEN, FREE_MAX, layout, MAP_AREA, NOTE_MAX, PH, PW, renderPage, stampBox, stampChoice, STAMP_PEN, symbolSpread, TRAY_N, trayStart, type Region, type View } from './pages';
import { T as Tr, tx, type Text } from '../i18n';

// O diário: um livro de verdade, no HUD. Duas metades presas ao lombo, folhas que viram, e as páginas
// (desenhadas em pixels no próprio papel) que se escolhem pelo índice da contracapa.
const BW = 0.5; // largura de cada metade
const BH = 0.68;
const GAP = 0.015; // folga entre o lombo e o papel
const PWD = BW - 0.03; // largura do papel
const PHD = BH - 0.05;
const SEG = 12;
const curve = (u: number) => -0.03 * (1 - u) ** 2; // o papel desce em direção ao lombo

export interface BookEnv {
  scene: THREE.Scene;
  cam: THREE.PerspectiveCamera;
  dom: HTMLElement;
  sound(name: 'uiflip' | 'bookOpen' | 'bookClose' | 'bookTap' | 'bookLatch'): void; // (DESIGN.md §86: papel, couro e o fecho de metal)
  halfW(): number;
}

const POSE = {
  start: { x: 0.62, y: -1.0, rx: -1.0, ry: -0.55, rz: 0.45, s: 0.62 },
  mid: { x: 0.3, y: -0.3, rx: -0.8, ry: -0.35, rz: 0.22, s: 0.8 },
  end: { x: 0, y: 0.0, rx: -0.15, ry: 0, rz: 0, s: 1.2 }, // aberto: ocupa quase a tela toda (mais espaço para ler)
};

const clamp01 = (u: number) => Math.min(1, Math.max(0, u));
const ease = (u: number) => u * u * (3 - 2 * u);

export function createDiaryBook(env: BookEnv) {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  root.add(inner);
  root.visible = false;
  env.scene.add(root);

  // ── texturas das páginas (quatro: esquerda, direita e as duas faces da folha que vira) ──
  const mkPage = () => {
    const c = document.createElement('canvas');
    c.width = PW;
    c.height = PH;
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter; // de perto, pixels quadrados
    t.minFilter = THREE.LinearFilter; // de longe, o texto se funde em vez de perder traços
    t.generateMipmaps = false;
    t.colorSpace = THREE.SRGBColorSpace;
    return { c, ctx: c.getContext('2d', { willReadFrequently: false })!, t };
  };
  const pgL = mkPage();
  const pgR = mkPage();
  const lfF = mkPage();
  const lfB = mkPage();
  lfB.t.wrapS = THREE.RepeatWrapping; // o verso da folha é lido de trás para a frente
  lfB.t.repeat.x = -1;
  lfB.t.offset.x = 1;

  const paperMat = (t: THREE.Texture, side: THREE.Side = THREE.FrontSide) => new THREE.MeshBasicMaterial({ map: t, side, fog: false });
  const matL = paperMat(pgL.t);
  const matR = paperMat(pgR.t);
  const matLeafF = paperMat(lfF.t, THREE.FrontSide);
  const matLeafB = paperMat(lfB.t, THREE.BackSide);

  const edgeMap = diaryEdgeArt();
  edgeMap.repeat.set(1, 1);
  const edge = new THREE.MeshLambertMaterial({ map: edgeMap, emissive: 0xffffff, emissiveMap: edgeMap, emissiveIntensity: 0.18 });
  const leatherMap = diaryLeatherArt();
  leatherMap.repeat.set(2, 2.6);
  const leather = new THREE.MeshLambertMaterial({ map: leatherMap, emissive: 0xffffff, emissiveMap: leatherMap, emissiveIntensity: 0.22 });
  const frontMap = diaryCoverArt();
  const front = new THREE.MeshLambertMaterial({ map: frontMap, emissive: 0xffffff, emissiveMap: frontMap, emissiveIntensity: 0.3 });
  const brass = new THREE.MeshLambertMaterial({ color: 0xc89a48, emissive: 0x5a3a10, emissiveIntensity: 0.6 });

  // metade do livro: bloco de folhas + capa
  const makeHalf = (left: boolean) => {
    const g = new THREE.Group();
    const s = left ? -1 : 1;
    // bloco de folhas: o topo acompanha a curva do papel (mais fino junto ao lombo)
    const bg = new THREE.BoxGeometry(PWD, PHD, 0.06, SEG, 1, 1);
    bg.translate(s * (GAP + PWD / 2), 0, 0);
    const bp = bg.attributes.position;
    for (let i = 0; i < bp.count; i++) {
      const u = (Math.abs(bp.getX(i)) - GAP) / PWD;
      bp.setZ(i, bp.getZ(i) > 0 ? curve(u) - 0.0012 : -0.04);
    }
    bg.computeVertexNormals();
    const block = new THREE.Mesh(bg, edge);
    const cover = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, 0.03), [leather, leather, leather, leather, leather, left ? front : leather]);
    cover.position.set((s * BW) / 2, 0, -0.055);
    g.add(block, cover);
    // cantoneiras de latão nas duas pontas de fora: dobram por cima da beirada da capa
    for (const sy of [1, -1]) {
      const cx = s * (BW - 0.022);
      const cy = sy * (BH / 2 - 0.022);
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.036), brass);
      a.position.set(cx, sy * (BH / 2 - 0.004), -0.055);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.05, 0.036), brass);
      b.position.set(s * (BW - 0.004), cy, -0.055);
      const rivet = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.006), brass);
      rivet.position.set(cx, cy, -0.037);
      g.add(a, b, rivet);
    }
    return g;
  };
  const rightHalf = makeHalf(false);
  const rightBlock = rightHalf.children[0];
  const leftPivot = new THREE.Group();
  leftPivot.add(makeHalf(true));
  inner.add(rightHalf, leftPivot);

  // o papel que se lê, ligeiramente curvo em direção ao lombo
  const pageGeo = (left: boolean) => {
    const geo = new THREE.PlaneGeometry(PWD, PHD, SEG, 1);
    geo.translate((left ? -1 : 1) * (GAP + PWD / 2), 0, 0);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = (Math.abs(p.getX(i)) - GAP) / PWD;
      p.setZ(i, curve(u));
    }
    return geo;
  };
  const meshL = new THREE.Mesh(pageGeo(true), matL);
  const meshR = new THREE.Mesh(pageGeo(false), matR);
  leftPivot.add(meshL);
  inner.add(meshR);

  // O FUNDO DO CADERNO (DESIGN.md §69): no fim, as folhas foram todas para a esquerda e a direita mostra a parte dura da capa de trás, de
  // couro, com o dado aberto e os 21 furos das gemas (book/bookart.ts). É uma placa RETA na face de dentro da capa (o bloco de folhas da
  // direita some), não uma página.
  const BZ = -0.0395; // (a face de dentro da capa de trás fica em z = -0,04)
  const boardC = document.createElement('canvas');
  boardC.width = BOARD_W;
  boardC.height = BOARD_H;
  const boardCtx = boardC.getContext('2d')!;
  const boardTex = new THREE.CanvasTexture(boardC);
  boardTex.magFilter = THREE.NearestFilter;
  boardTex.minFilter = THREE.LinearFilter;
  boardTex.generateMipmaps = false;
  boardTex.colorSpace = THREE.SRGBColorSpace;
  const BRW = BW - 0.004;
  const BRH = BH - 0.004;
  const boardGeo = new THREE.PlaneGeometry(BRW, BRH);
  boardGeo.translate(BW / 2, 0, BZ);
  const board = new THREE.Mesh(boardGeo, new THREE.MeshLambertMaterial({ map: boardTex, emissive: 0xffffff, emissiveMap: boardTex, emissiveIntensity: 0.34 }));
  board.visible = false;
  inner.add(board);
  let boardKey = '';
  // `n` gemas à mostra (na cena da gema, a nova só entra quando encaixa); `flash` = o furo que brilha, `fk` de 0 a 1
  const drawBoard = (n: number, flash = -1, fk = 1) => {
    const key = `${n}|${flash}|${fk < 1 ? Math.round(fk * 20) : 'x'}`;
    if (key === boardKey) return;
    boardKey = key;
    drawGemBoard(boardCtx, n, flash, fk);
    boardTex.needsUpdate = true;
  };
  let boardOverride: null | { n: number; flash: number; fk: number } = null;

  // folhas que viram (articuladas no lombo). Virar UMA página usa uma folha; pular para outra parte do caderno (pelo índice) vira um MAÇO de
  // uma vez, em leque: a 1ª folha leva a página de onde se sai, a última traz a página aonde se chega, e as do meio são papel em branco
  // (antes o caderno virava as folhas uma por uma até lá, e do fim ao índice eram mais de quinze viradas)
  const blankTex = (side: 'L' | 'R') => {
    const t = new THREE.CanvasTexture(blankPaper(side));
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const blankBackTex = blankTex('L');
  blankBackTex.wrapS = THREE.RepeatWrapping; // (o verso é lido de trás para a frente, como o da folha de verdade)
  blankBackTex.repeat.x = -1;
  blankBackTex.offset.x = 1;
  const MAXL = 5;
  const leaves = Array.from({ length: MAXL }, (_, k) => {
    const geo = new THREE.PlaneGeometry(PWD, PHD, 18, 1);
    geo.translate(PWD / 2, 0, 0);
    const base = Float32Array.from(geo.attributes.position.array as Float32Array);
    const blankF = paperMat(blankTex('R'), THREE.FrontSide);
    const blankB = paperMat(blankBackTex, THREE.BackSide);
    const front = new THREE.Mesh(geo, k === 0 ? matLeafF : blankF);
    const back = new THREE.Mesh(geo, matLeafB);
    const group = new THREE.Group();
    group.add(front, back);
    group.visible = false;
    inner.add(group);
    return { geo, base, front, back, group, blankF, blankB };
  });
  type Leaf = (typeof leaves)[number];
  // `dz`: quantas folhas há por cima desta no maço (para não brigarem entre si)
  const bend = (lf: Leaf, theta: number, lag: number, dz = 0) => {
    const p = lf.geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = lf.base[i * 3] / PWD;
      const phi = Math.min(Math.PI, Math.max(0, theta - lag * u)); // a folha encurva, mas nunca desce para dentro das páginas de baixo
      p.setXYZ(i, GAP + u * PWD * Math.cos(phi), lf.base[i * 3 + 1], 0.003 + dz * 0.0012 + u * PWD * Math.sin(phi) + curve(u) * Math.abs(Math.cos(theta)) ** 3);
    }
    p.needsUpdate = true;
    lf.geo.computeBoundingSphere();
  };

  // a lombada: meia-cana de couro atrás do dobra, com as nervuras e o ouro
  // a lombada: uma faixa de couro curva que liga as beiradas das duas capas. É refeita a cada quadro: aberto, quase some atrás do dobra;
  // fechando, vira a lateral redonda do livro (meia-cana entre as duas capas), sempre presa nelas
  const SPN = 12;
  const spineGeo = new THREE.BufferGeometry();
  const spinePos = new Float32Array((SPN + 1) * 2 * 3);
  const spineUv = new Float32Array((SPN + 1) * 2 * 2);
  const spineIdx: number[] = [];
  for (let k = 0; k <= SPN; k++) {
    spineUv.set([k / SPN, 1, k / SPN, 0], k * 4);
    if (k < SPN) {
      const a0 = k * 2;
      spineIdx.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2);
    }
  }
  spineGeo.setAttribute('position', new THREE.BufferAttribute(spinePos, 3));
  spineGeo.setAttribute('uv', new THREE.BufferAttribute(spineUv, 2));
  spineGeo.setIndex(spineIdx);
  const spineMap = diarySpineArt();
  // por fora: o couro com as nervuras e o ouro; por dentro (o avesso, que aparece por um instante quando a capa está em pé): couro escuro e liso
  const spine = new THREE.Mesh(spineGeo, new THREE.MeshLambertMaterial({ map: spineMap, side: THREE.FrontSide, emissive: 0xffffff, emissiveMap: spineMap, emissiveIntensity: 0.22 }));
  spine.frustumCulled = false;
  inner.add(spine);
  const spineIn = new THREE.Mesh(spineGeo, new THREE.MeshLambertMaterial({ color: 0x2a0e08, side: THREE.BackSide }));
  spineIn.frustumCulled = false;
  inner.add(spineIn);
  const ZO = -0.07; // face de fora da capa
  const setSpine = (ang: number) => {
    // P1: beirada da capa de trás (fixa); P2: beirada da capa da frente, girada com ela; I: um ponto "dentro" do livro (para saber para que lado a lombada estufa)
    const c = Math.cos(ang);
    const sn = Math.sin(ang);
    const p1x = 0;
    const p1z = ZO;
    const p2x = sn * ZO;
    const p2z = c * ZO;
    const ix = 0.12; // (perto das folhas)
    const iz = (p1z + p2z) / 2 + 0.0001;
    const cx = (p1x + p2x) / 2;
    const cz = (p1z + p2z) / 2;
    let chx = p2x - p1x;
    let chz = p2z - p1z;
    const len = Math.hypot(chx, chz);
    const r = Math.max(0.004, len / 2);
    if (len > 1e-6) {
      chx /= len;
      chz /= len;
    } else {
      chx = 1;
      chz = 0;
    }
    let ox = -chz;
    let oz = chx;
    if (ox * (ix - cx) + oz * (iz - cz) > 0) {
      ox = -ox;
      oz = -oz;
    }
    for (let k = 0; k <= SPN; k++) {
      const t = (k / SPN) * Math.PI;
      const x = cx - Math.cos(t) * r * chx + Math.sin(t) * r * ox;
      const z = cz - Math.cos(t) * r * chz + Math.sin(t) * r * oz;
      spinePos.set([x, BH / 2, z, x, -BH / 2, z], k * 6);
    }
    spineGeo.attributes.position.needsUpdate = true;
    spineGeo.computeVertexNormals();
  };
  setSpine(0);
  // cabeceado: o cordão listrado no alto e embaixo do miolo, junto do lombo
  const hbTex = (() => {
    const c = document.createElement('canvas');
    c.width = 8;
    c.height = 2;
    const g = c.getContext('2d')!;
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#c89a48' : '#8a2418';
      g.fillRect(i, 0, 1, 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  for (const sy of [1, -1]) {
    const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 6), new THREE.MeshLambertMaterial({ map: hbTex, emissive: 0x401008 }));
    hb.rotation.z = Math.PI / 2;
    hb.position.set(0, sy * (PHD / 2 + 0.002), -0.012);
    inner.add(hb);
  }
  // duas fitas marcadoras que pendem do lombo (vermelha e verde-escura), com a ponta em V
  const ribbonGeo = (() => {
    const sh = new THREE.Shape();
    const w = 0.009;
    sh.moveTo(-w, 0);
    sh.lineTo(w, 0);
    sh.lineTo(w, -0.18);
    sh.lineTo(0, -0.165);
    sh.lineTo(-w, -0.18);
    sh.closePath();
    return new THREE.ShapeGeometry(sh);
  })();
  const ribbon = new THREE.Group();
  const rib1 = new THREE.Mesh(ribbonGeo, new THREE.MeshLambertMaterial({ color: 0xa8321a, emissive: 0x5a1a10, side: THREE.DoubleSide }));
  rib1.position.set(0.05, -BH / 2 + 0.03, 0.004);
  rib1.rotation.z = 0.12;
  const rib2 = new THREE.Mesh(ribbonGeo, new THREE.MeshLambertMaterial({ color: 0x2a5a3a, emissive: 0x0e2a18, side: THREE.DoubleSide }));
  rib2.position.set(0.085, -BH / 2 + 0.03, 0.003);
  rib2.rotation.z = 0.32;
  rib2.scale.y = 0.8;
  ribbon.add(rib1, rib2);
  inner.add(ribbon);
  // A PRESILHA: uma tira de couro presa na capa de trás que dá a volta na borda do livro (o lado das folhas) e, por cima da capa da frente,
  // prende a fivela de latão num pino. Abrir o diário: a fivela solta do pino e a aba se afasta (um clique); só então a capa abre.
  // Fechar: a capa fecha primeiro e a aba volta e prende de novo.
  const SW = 0.06; // largura da tira
  const ST = 0.006; // espessura
  const ZB = 0.074; // de fora das capas (o livro fechado tem as capas em z = ±0.07)
  const FL = 0.15; // comprimento da aba por cima da capa da frente
  const strap = new THREE.Group();
  inner.add(strap);
  // o pedaço fixo: por fora da capa de trás e pela borda das folhas
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.13, SW, ST), leather);
  back.position.set(BW - 0.065 + 0.004, 0, -ZB);
  const edgeBand = new THREE.Mesh(new THREE.BoxGeometry(ST, SW, 2 * ZB + ST), leather);
  edgeBand.position.set(BW + 0.004, 0, 0);
  strap.add(back, edgeBand);
  // os pontos de costura: duas fileiras de pontinhos claros
  const stitch = new THREE.MeshLambertMaterial({ color: 0xd8c098, emissive: 0x5a4020, emissiveIntensity: 0.5 });
  for (let k = 0; k < 5; k++)
    for (const sy of [1, -1]) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.004, 0.002), stitch);
      st.position.set(BW - 0.11 + k * 0.022, sy * (SW / 2 - 0.007), -ZB - ST / 2 - 0.001);
      strap.add(st);
    }
  // a aba: articula na quina de cima da borda; fechada, deita sobre a capa da frente apontando para o lombo
  const flap = new THREE.Group();
  flap.position.set(BW + 0.004, 0, ZB);
  strap.add(flap);
  const flapBand = new THREE.Mesh(new THREE.BoxGeometry(FL, SW, ST), leather);
  flapBand.position.set(-FL / 2, 0, 0);
  flap.add(flapBand);
  // a fivela na ponta da aba: moldura de latão com a lingueta
  const fb = (w: number, h: number, x: number, y: number, d = 0.01) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), brass);
    m.position.set(x, y, 0.003);
    flap.add(m);
    return m;
  };
  fb(0.008, SW + 0.016, -FL + 0.012, 0);
  fb(0.008, SW + 0.016, -FL + 0.046, 0);
  fb(0.042, 0.008, -FL + 0.029, SW / 2 + 0.004);
  fb(0.042, 0.008, -FL + 0.029, -SW / 2 - 0.004);
  const tongue = fb(0.03, 0.005, -FL + 0.03, 0, 0.006);
  // o pino de latão na capa da frente (gira com ela): a fivela prende nele
  const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.008, 8), brass);
  stud.rotation.x = Math.PI / 2;
  stud.position.set(-(BW - FL + 0.03), 0, -0.071 - 0.004);
  leftPivot.add(stud);
  const CLASP_OPEN = Math.PI + 0.32; // aberta: a aba pende para fora, ao lado do livro
  let claspK = 0;
  let claspPrev = 0;

  // ── O TUTORIAL DO CADERNO (1ª abertura; DESIGN.md §75, pedido do Pedro) ──
  // Começa no ÍNDICE. A parte da vez pisca em ouro; o jogador toca nela e o caderno vai até lá; o PERSONAGEM diz, com as palavras dele, o que é
  // aquilo e o que dá para fazer ali; quando há uma tarefa (anotar o que acha que é BRASEIRO, riscar o mapa), a região pisca até ele fazer; aí o
  // caderno volta sozinho ao índice e a próxima parte pisca. No fim, "Guardar" pisca. Enquanto dura, o jogador não folheia por conta própria.
  // (Aqui o personagem fala um pouco mais que no resto do jogo, DESIGN.md §48: é ele quem ensina o caderno.)
  const GUIDED_ID = 'brasa';
  type Part = 'dela' | 'simbolos' | 'faces' | 'textos' | 'mapa' | 'notas' | 'gemas';
  const TOUR: Part[] = ['dela', 'simbolos', 'faces', 'textos', 'mapa', 'notas', 'gemas'];
  type Lay = ReturnType<typeof layout>;
  // aonde o índice leva cada parte (a linha que pisca é a região `goto:` dessa folha)
  const ROW: Record<Part, (l: Lay) => number> = {
    dela: (l) => l.herAt,
    simbolos: (l) => l.dictAt,
    faces: (l) => l.facesAt,
    textos: (l) => l.textsAt,
    mapa: (l) => l.mapAt,
    notas: (l) => l.notesAt,
    gemas: (l) => l.gemsAt,
  };
  interface Stop {
    at: (l: Lay) => number; // a folha onde o personagem para e pensa
    say: Text[];
    task?: 'note' | 'stroke';
    done?: Text[]; // o que ele pensa depois de fazer a tarefa
    after?: () => void; // depois dos pensamentos desta parada
  }
  // (antes de ler, nada de "ela": ele só vê letra à mão e as partes; sem memória, nem sabe ainda se a letra é dele)
  const INTRO = [Tr('Escrito à mão. Dividido em partes.', 'Handwritten. Divided into parts.', 'Escrito a mano. Dividido en partes.'), Tr('Vou ver uma por uma.', "I'll look at them one by one.", 'Voy a verlas una por una.')];
  const STOPS: Record<Part, Stop[]> = {
    dela: [
      // (é LENDO o relato que ele descobre de quem é o caderno: daí em diante o índice diz "Dela")
      { at: (l) => l.herAt, say: [Tr('A letra não é minha.', "The handwriting isn't mine.", 'La letra no es mía.'), Tr('É de uma mulher. Condenada.', "A woman's. Condemned.", 'Es de una mujer. Condenada.'), Tr('Ela também acordou embaixo da luz.', 'She also woke up under the light.', 'Ella también despertó bajo la luz.'), Tr('E parou no meio.', 'And she stopped halfway.', 'Y se detuvo a la mitad.')], after: () => diary.knowHer() },
      { at: (l) => l.herAt + 1, say: [Tr('Faltam folhas. Arrancadas.', 'Pages are missing. Torn out.', 'Faltan hojas. Arrancadas.'), Tr('Se eu achar alguma, ponho de volta no lugar.', "If I find any, I'll put it back in its place.", 'Si encuentro alguna, la pongo de vuelta en su lugar.')] },
    ],
    simbolos: [
      {
        at: () => symbolSpread(GUIDED_ID, dState()),
        say: [Tr('Os símbolos das paredes. Os que eu já vi estão aqui.', "The symbols on the walls. The ones I've seen are here.", 'Los símbolos de las paredes. Los que ya vi están aquí.'), Tr('Ela anotava o que achava que eram. Se anotava, era importante.', 'She wrote down what she thought they were. If she wrote it, it mattered.', 'Ella anotaba lo que creía que eran. Si lo anotaba, era importante.'), Tr('Este ela não sabia. E eu, o que acho que é?', "This one she didn't know. And me, what do I think it is?", 'Este no lo sabía. ¿Y yo, qué creo que es?')],
        task: 'note',
        done: [Tr('Anotado. Se eu entender melhor, mudo depois.', "Noted. If I understand it better, I'll change it later.", 'Anotado. Si lo entiendo mejor, lo cambio después.')],
      },
    ],
    faces: [{ at: (l) => l.facesAt, say: [Tr('As faces do dado. Só uma tem nome, por enquanto.', "The die's faces. Only one has a name, for now.", 'Las caras del dado. Solo una tiene nombre, por ahora.')] }],
    textos: [{ at: (l) => l.textsAt, say: [Tr('Aqui ficam as frases inteiras, quando eu achar alguma.', 'Whole sentences go here, when I find any.', 'Aquí van las frases enteras, cuando encuentre alguna.')] }],
    mapa: [
      {
        at: (l) => l.mapAt,
        say: [Tr('Um mapa de onde eu passei. Ele se desenha sozinho.', "A map of where I've been. It draws itself.", 'Un mapa de por donde pasé. Se dibuja solo.'), Tr('Dá para riscar nele. Vou marcar alguma coisa.', "I can draw on it. I'll mark something.", 'Se puede rayar. Voy a marcar algo.')],
        task: 'stroke',
        done: [Tr('Assim eu lembro. Dá para carimbar os símbolos também.', 'That way I remember. I can stamp the symbols too.', 'Así me acuerdo. También se pueden sellar los símbolos.')],
      },
    ],
    notas: [{ at: (l) => l.notesAt, say: [Tr('Folhas em branco. Posso anotar o que eu achar importante.', 'Blank pages. I can write down what I think matters.', 'Hojas en blanco. Puedo anotar lo que me parezca importante.')] }],
    gemas: [{ at: (l) => l.gemsAt, say: [Tr('No fundo, uma cruz cheia de furos. Vazios.', 'At the back, a cross full of holes. Empty.', 'Al fondo, una cruz llena de agujeros. Vacíos.')] }],
  };
  const END = [Tr('Vou anotar tudo, como ela.', "I'll write everything down, like she did.", 'Voy a anotarlo todo, como ella.')];
  // fase: idle (sem tutorial) · intro · pick (no índice, esperando o toque na parte) · go (indo até a folha) · say (pensando) · task · back (voltando
  // ao índice) · end (terminou: "Guardar" pisca, e o caderno já pode ser folheado e guardado)
  const tut = { phase: 'idle' as 'idle' | 'intro' | 'pick' | 'go' | 'say' | 'task' | 'back' | 'end', i: 0, stop: 0, strokes0: 0, wait: 0 };
  const tutorialOn = () => ui.guided() && tut.phase !== 'idle' && tut.phase !== 'end';
  const thinking = () => dialogueStore.get() !== null; // um pensamento ainda na tela
  const noteDone = () => !!(dState().notes[GUIDED_ID] ?? '').trim();
  const thinkInBook = (lines: Text[], onEnd?: () => void) => dialogue.say(lines.map((text) => ({ who: 'thought' as const, text })), { block: false, onEnd });
  // só pode guardar o caderno depois de passar por tudo
  const guidedOk = () => tut.phase === 'end';
  const curStop = () => STOPS[TOUR[tut.i]][tut.stop];
  // a parada seguinte desta parte, ou a volta ao índice
  const nextStop = () => {
    tut.stop++;
    if (tut.stop < STOPS[TOUR[tut.i]].length) {
      tut.phase = 'go';
      goTo(curStop().at(layout(dState())));
    } else {
      tut.phase = 'back';
      tut.wait = 0.6; // (um respiro antes de voltar ao índice)
    }
  };

  // ── a cena da gema (scene.ts): o livro sai sozinho, aberto direto no fundo, sem o jogador mexer; depois volta para a página onde estava ──
  let presenting = false;
  let presentFast = false;
  let presentFrom = -1;

  // ── estado ──
  let T = 0; // 0 = guardado, 1 = aberto
  let open = 0;
  const view: View = { spread: 0, sel: null, pen: 0, floor: null, stamp: -1, trayAt: 9999, live: null, editing: null, hover: null, caret: true };
  let drawing: null | { erase: boolean } = null;
  let regL: Region[] = [];
  let regR: Region[] = [];
  let target = 0;
  // a virada em curso: entre os spreads `lo` e `hi` (vizinhos numa página só; distantes num maço de `n` folhas que saem uma atrás da outra)
  let flip: { lo: number; hi: number; dir: 1 | -1; t: number; dur: number; n: number; lag: number } | null = null;
  let caretT = 0;
  let lastWant = 0;
  let seenNews = false;
  const dState = () => diaryStore.get();

  const draw = (pg: ReturnType<typeof mkPage>, side: 'L' | 'R', spread: number) => {
    const v: View = { ...view, spread, hover: null };
    const regs = renderPage(pg.ctx, side, v, dState(), layout(dState()));
    pg.t.needsUpdate = true;
    return regs;
  };
  const refresh = () => {
    if (flip) return;
    const d = dState();
    const lay = layout(d);
    view.spread = Math.min(view.spread, lay.total - 1);
    const vv = { ...view };
    regL = renderPage(pgL.ctx, 'L', vv, d, lay);
    regR = renderPage(pgR.ctx, 'R', vv, d, lay);
    pgL.t.needsUpdate = true;
    pgR.t.needsUpdate = true;
  };
  const unsub = diaryStore.subscribe(() => {
    if (T > 0.01) refresh();
  });
  // o idioma mudou (src/i18n.ts): as páginas se escrevem de novo
  let langWas = configStore.get().lang;
  const unsubLang = configStore.subscribe(() => {
    const l = configStore.get().lang;
    if (l === langWas) return;
    langWas = l;
    refresh();
  });
  refresh();

  // ── edição de texto (teclado do aparelho) ──
  const ta = document.createElement('textarea');
  ta.setAttribute('autocomplete', 'off');
  ta.setAttribute('autocapitalize', 'sentences');
  ta.setAttribute('spellcheck', 'false');
  ta.setAttribute('aria-label', tx(Tr('Anotação do caderno', 'Notebook note', 'Nota del cuaderno')));
  ta.style.cssText = 'position:fixed;left:0;bottom:0;width:2px;height:2px;opacity:0;border:0;padding:0;resize:none;z-index:-1;';
  document.body.appendChild(ta);
  const stopEdit = () => {
    if (!view.editing) return;
    view.editing = null;
    if (document.activeElement === ta) ta.blur();
    refresh();
  };
  const startEdit = (kind: 'note' | 'free') => {
    const d = dState();
    const cur = view.sel && d.seen[view.sel] ? view.sel : (d.order[0] ?? null);
    if (kind === 'note' && !cur) return;
    view.sel = cur;
    view.editing = kind;
    ta.maxLength = kind === 'note' ? NOTE_MAX : FREE_MAX;
    ta.value = kind === 'note' ? (d.notes[cur!] ?? '') : d.free;
    ta.focus({ preventScroll: true });
    ta.setSelectionRange(ta.value.length, ta.value.length);
    caretT = 0;
    view.caret = true;
    refresh();
  };
  ta.addEventListener('input', () => {
    // (as quebras de linha FICAM: a resposta à pergunta do dado entra numa linha nova, e a última linha é o que ele acha agora, a que aparece
    // junto dos símbolos; antes, qualquer tecla juntava tudo numa linha só e a anotação curta mostrava a hipótese mais velha. DESIGN.md §101)
    if (view.editing === 'note' && view.sel) diary.setNote(view.sel, ta.value.replace(/\r/g, '').replace(/\n{2,}/g, '\n'));
    else if (view.editing === 'free') diary.setFree(ta.value);
    if (ui.guided()) ui.setGuidedNote(guidedOk());
  });
  ta.addEventListener('blur', () => {
    if (view.editing) {
      view.editing = null;
      refresh();
    }
  });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || (e.key === 'Enter' && view.editing === 'note')) {
      e.preventDefault();
      e.stopPropagation();
      stopEdit();
    }
    e.stopPropagation(); // J, W, A, S, D... são letras do texto, não comandos do jogo
  });

  // ── virar páginas ──
  const startFlip = (lo: number, hi: number, dir: 1 | -1) => {
    // embaixo, à esquerda a página de `lo` e à direita a de `hi`; a folha (ou o maço) leva a direita de `lo` e traz a esquerda de `hi`
    draw(pgL, 'L', lo);
    draw(pgR, 'R', hi);
    draw(lfF, 'R', lo);
    draw(lfB, 'L', hi);
    const n = Math.min(MAXL, hi - lo);
    leaves.forEach((lf, k) => {
      lf.group.visible = k < n;
      lf.front.material = k === 0 ? matLeafF : lf.blankF;
      lf.back.material = k === n - 1 ? matLeafB : lf.blankB;
    });
    flip = { lo, hi, dir, t: 0, dur: n > 1 ? 0.5 : 0.46, n, lag: n > 1 ? 0.055 : 0 };
    env.sound('uiflip');
  };
  const goTo = (n: number) => {
    stopEdit();
    const lay = layout(dState());
    target = Math.max(0, Math.min(lay.total - 1, n));
  };

  // ── ponteiro ──
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const toNdc = (e: { clientX: number; clientY: number }) => {
    const r = env.dom.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
  };
  const pick = (e: { clientX: number; clientY: number }): { side: 'L' | 'R'; region: Region | null; px: number; py: number } | null => {
    if (flip) return null;
    toNdc(e);
    ray.setFromCamera(ndc, env.cam);
    const hit = ray.intersectObjects([meshL, meshR], false)[0];
    if (!hit || !hit.uv) return null;
    const side = hit.object === meshL ? 'L' : 'R';
    const px = hit.uv.x * PW;
    const py = (1 - hit.uv.y) * PH;
    const list = side === 'L' ? regL : regR;
    let found: Region | null = null;
    for (const r of list) if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) found = r;
    return { side, region: found, px, py };
  };
  const overBook = (e: { clientX: number; clientY: number }) => {
    toNdc(e);
    ray.setFromCamera(ndc, env.cam);
    return ray.intersectObject(root, true).length > 0;
  };
  const act = (id: string) => {
    const d = dState();
    const lay = layout(d);
    if (tutorialOn()) {
      // no índice, só a parte da vez; na tarefa, o campo de anotação e as canetas do mapa; o resto espera
      const want = tut.phase === 'pick' ? `goto:${ROW[TOUR[tut.i]](lay)}` : null;
      const ok = id === want || id === 'close' || (tut.phase === 'task' && (id === 'edit:note' || id.startsWith('pen:') || id.startsWith('floor:')));
      if (!ok) {
        env.sound('bookTap');
        return;
      }
      if (id === want) tut.phase = 'go';
    }
    if (id === 'prev') goTo(view.spread - 1);
    else if (id === 'next') goTo(view.spread + 1);
    else if (id === 'close') close();
    else if (id.startsWith('goto:')) goTo(Number(id.slice(5)));
    else if (id.startsWith('sel:')) {
      stopEdit();
      view.sel = id.slice(4);
      refresh();
    } else if (id.startsWith('csel:')) {
      // a CÓPIA (DESIGN.md §101): tocar num símbolo abre o lugar de anotar ele na página da direita; tocar de novo volta para a cópia
      const i = Number(id.slice(5));
      const cell = copyCells(d)[i];
      stopEdit();
      if (!cell || view.copySel === i) view.copySel = null;
      else {
        view.copySel = i;
        view.sel = cell.id;
      }
      refresh();
    } else if (id === 'edit:note') startEdit('note');
    else if (id === 'edit:free') startEdit('free');
    else if (id.startsWith('floor:')) {
      view.floor = Number(id.slice(6));
      refresh();
    } else if (id.startsWith('pen:')) {
      view.pen = Number(id.slice(4));
      refresh();
    } else if (id.startsWith('stamp:')) {
      view.stamp = Number(id.slice(6));
      refresh();
    } else if (id.startsWith('stampnav:')) {
      // a bandeja anda de TRAY_N em TRAY_N símbolos
      const n = dState().order.length;
      const cur = trayStart(view, dState());
      view.trayAt = Math.max(0, Math.min(n - TRAY_N, cur + Number(id.slice(9)) * TRAY_N));
      refresh();
    } else if (id === 'map') {
      // (a escrita livre e os carimbos são tratados no ponteiro: ver beginDraw)
    }
    void lay;
  };
  const close = () => {
    // modo guiado (1ª abertura do caderno): só fecha depois de o jogador escrever alguma coisa sobre BRASEIRO
    // modo guiado: só fecha depois de ler tudo e de escrever sobre BRASEIRO; senão o personagem diz o que falta (com as palavras dele)
    if (ui.guided() && !guidedOk()) {
      env.sound('bookTap');
      if (!thinking()) thinkInBook([Tr('Ainda não. Falta ver o resto.', 'Not yet. I still need to see the rest.', 'Todavía no. Falta ver el resto.')]);
      return;
    }
    stopEdit();
    ui.setDiary(false);
  };
  const ready = () => T >= 0.99 && ui.diaryOpen();
  const inHud = (e: Event) => !!(e.target as HTMLElement | null)?.closest?.('.corner');

  // ── escrita livre no mapa ──
  const mapXY = (p: { side: 'L' | 'R'; px: number; py: number }) => ({ x: p.px + (p.side === 'R' ? PW : 0), y: p.py });
  const inMap = (x: number, y: number) => x >= MAP_AREA.x && x <= MAP_AREA.x + MAP_AREA.w && y >= MAP_AREA.y && y <= MAP_AREA.y + MAP_AREA.h;
  const eraseAt = (x: number, y: number) => {
    const fl = currentFloor(view, dState());
    const hit: number[] = [];
    dState().strokes.forEach((st, i) => {
      if (st.f !== fl) return;
      for (let k = 0; k < st.p.length; k += 2) {
        if ((st.p[k] / 2 - x) ** 2 + (st.p[k + 1] / 2 - y) ** 2 < 25) {
          hit.push(i);
          break;
        }
      }
    });
    diary.removeStrokes(hit);
    // a borracha também tira carimbos (o ponto tocado cai dentro da caixa do símbolo, com folga)
    const gone: number[] = [];
    dState().stamps.forEach((st, i) => {
      if (st.f !== fl) return;
      const b = stampBox(st.id);
      if (Math.abs(st.x - x) <= b.w / 2 + 2 && Math.abs(st.y - y) <= b.h / 2 + 2) gone.push(i);
    });
    diary.removeStamps(gone);
  };
  const beginDraw = (side: 'L' | 'R', px: number, py: number) => {
    stopEdit();
    const { x, y } = mapXY({ side, px, py });
    if (view.pen === ERASER_PEN) {
      drawing = { erase: true };
      eraseAt(x, y);
      return;
    }
    if (view.pen === STAMP_PEN) {
      // carimbo: um toque = um símbolo (nada de arrastar); só os avistados chegam aqui
      const d = dState();
      const i = stampChoice(view, d);
      if (i >= 0 && d.order[i]) {
        diary.addStamp({ f: currentFloor(view, d), id: d.order[i], x: Math.round(x), y: Math.round(y) });
        env.sound('bookTap');
      }
      return;
    }
    drawing = { erase: false };
    view.live ={ f: currentFloor(view, dState()), c: view.pen, p: [Math.round(x * 2), Math.round(y * 2)] };
    refresh();
  };
  const endDraw = () => {
    if (!drawing) return;
    if (!drawing.erase && view.live) diary.addStroke(view.live);
    drawing = null;
    view.live = null;
    refresh();
  };
  const onMove = (e: PointerEvent) => {
    if (drawing) {
      const p = pick(e);
      if (!p) return;
      const { x, y } = mapXY(p);
      if (!inMap(x, y)) return;
      if (drawing.erase) eraseAt(x, y);
      else if (view.live) {
        const n = view.live.p.length;
        const nx = Math.round(x * 2);
        const ny = Math.round(y * 2);
        if (nx !== view.live.p[n - 2] || ny !== view.live.p[n - 1]) {
          view.live = { ...view.live, p: [...view.live.p, nx, ny] };
          refresh();
        }
      }
      return;
    }
    if (!ready() || inHud(e)) return;
    const p = pick(e);
    const id = p?.region?.id ?? null;
    if (id !== view.hover) {
      view.hover = id;
      refresh();
    }
    env.dom.style.cursor = id ? 'pointer' : '';
  };
  const onDown = (e: PointerEvent) => {
    if (!ui.diaryOpen() || inHud(e)) return;
    e.stopPropagation();
    e.preventDefault();
    if (!ready()) return;
    // no tutorial, enquanto o personagem pensa, um toque passa para o próximo pensamento (sem esperar)
    if (tutorialOn() && tut.phase === 'say' && thinking()) {
      dialogue.next();
      return;
    }
    const p = pick(e);
    if (p?.region) {
      if (p.region.id === 'map') {
        if (!tutorialOn() || (tut.phase === 'task' && curStop().task === 'stroke')) beginDraw(p.side, p.px, p.py);
      }
      else act(p.region.id);
      return;
    }
    if (p) {
      stopEdit(); // tocou numa parte vazia do papel
      return;
    }
    if (!overBook(e)) close(); // tocou fora do livro: guarda
  };
  const onKey = (e: KeyboardEvent) => {
    if (!ui.diaryOpen() || e.repeat) return;
    if (document.activeElement === ta) return;
    const k = e.key.toLowerCase();
    if (tutorialOn() && tut.phase === 'say' && thinking() && (k === ' ' || k === 'enter')) {
      e.preventDefault();
      e.stopPropagation();
      dialogue.next();
      return;
    }
    if (k === configStore.get().keys.diario || k === 'escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (ready() && !tutorialOn()) {
      if (k === 'arrowright' || k === 'pagedown' || k === 'd') goTo(view.spread + 1);
      else if (k === 'arrowleft' || k === 'pageup' || k === 'a') goTo(view.spread - 1);
      else if (k === 'home') goTo(0);
      else return;
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const onWheel = (e: WheelEvent) => {
    if (!ready()) return;
    e.preventDefault();
    e.stopPropagation();
    if (!flip && !tutorialOn() && Math.abs(e.deltaY) > 4) goTo(view.spread + (e.deltaY > 0 ? 1 : -1));
  };
  window.addEventListener('pointermove', onMove, true);
  window.addEventListener('pointerup', endDraw, true);
  window.addEventListener('pointercancel', endDraw, true);
  window.addEventListener('pointerdown', onDown, true);
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('wheel', onWheel, { capture: true, passive: false });

  // ── a cada quadro ──
  const sock = new THREE.Vector3();
  return {
    isOut: () => T > 0.01,
    // a cena da gema: o livro sai sozinho, aberto no fundo (rápido nas gemas seguintes) e guarda quando `on` volta a false
    present(on: boolean, fast = false) {
      if (on && !presenting) {
        if (presentFrom < 0) presentFrom = view.spread;
        stopEdit();
        flip = null;
        leaves.forEach((lf) => (lf.group.visible = false));
        view.spread = target = layout(dState()).gemsAt;
        presentFast = fast;
        refresh();
      }
      presenting = on;
    },
    // o que a placa mostra durante a cena (null = as gemas do caderno)
    board(o: null | { n: number; flash: number; fk: number }) {
      boardOverride = o;
    },
    opened: () => T,
    // onde fica, na cena do livro, o furo de número k
    socketWorld(k: number, out: THREE.Vector3) {
      const p = gemSocketPx(k);
      sock.set(BW / 2 - BRW / 2 + (p.x / BOARD_W) * BRW, BRH / 2 - (p.y / BOARD_H) * BRH, BZ + 0.002);
      root.updateMatrixWorld(true);
      return out.copy(inner.localToWorld(sock));
    },
    click: (id: string) => act(id), // (também usado nos testes)
    // (testes) em que ponto está o tutorial e qual linha do índice ele espera
    tut: () => ({ phase: tut.phase, part: TOUR[tut.i] ?? null, stop: tut.stop, want: tut.phase === 'pick' ? `goto:${ROW[TOUR[tut.i]](layout(dState()))}` : null, spread: view.spread, guide: view.guide ?? null, editing: view.editing }),
    update(dt: number, t: number) {
      const want = ui.diaryOpen() || presenting ? 1 : 0;
      if (want !== lastWant) {
        lastWant = want;
        env.sound(want ? 'bookOpen' : 'bookClose');
        // uma folha dela acabou de ser achada: o caderno abre direto nela (DESIGN.md §78)
        const np = dState().newPage;
        if (want && np && !ui.guided() && !presenting) {
          const k = HER_PAGES.filter((p) => p.body.length > 0).findIndex((p) => p.id === np);
          if (k >= 0) {
            stopEdit();
            flip = null;
            leaves.forEach((lf) => (lf.group.visible = false));
            view.spread = target = layout(dState()).herAt + Math.floor((HER_RELATO.length + k) / 2);
            refresh();
          }
          diary.readPage();
        }
        // A CÓPIA (DESIGN.md §101): abriu o caderno LENDO (olhando uma escrita da parede, ou logo depois de uma conversa): ele abre na página
        // com a frase copiada e as anotações embaixo de cada símbolo
        const rd = readingStore.get();
        const age = rd ? performance.now() - rd.t : Infinity;
        if (want && rd && !np && !ui.guided() && !presenting && (rd.from === 'parede' ? age < 800 : age < TALK_COPY_MS)) {
          diary.setCopy({ lines: rd.lines.map((l) => [...l]), from: rd.from, room: rd.room, chalk: rd.chalk });
          if (rd.from === 'conversa') readingStore.set(null); // (a conversa vira cópia uma vez só)
          stopEdit();
          flip = null;
          leaves.forEach((lf) => (lf.group.visible = false));
          view.copySel = null;
          view.spread = target = layout(dState()).copyAt;
          refresh();
        }
        if (want && ui.guided() && !presenting) {
          // o caderno abre no ÍNDICE e o personagem começa a olhar parte por parte
          diary.markSeen(GUIDED_ID);
          view.spread = target = 0;
          tut.phase = 'intro';
          tut.i = 0;
          tut.stop = 0;
        }
      }
      if (!want && ui.guided() && ui.uiGuidedOk()) ui.setGuided(false); // guardou depois do tutorial: acabou
      if (tut.phase !== 'idle' && !ui.guided()) {
        tut.phase = 'idle';
        view.pulse = false;
        view.guide = null;
      }
      if (tut.phase !== 'idle' && T >= 0.99) {
        const lay = layout(dState());
        const settled = !flip && view.spread === target;
        let guide: string | null = null;
        if (tut.phase === 'intro' && settled) {
          tut.phase = 'say';
          thinkInBook(INTRO, () => (tut.phase = 'pick'));
        } else if (tut.phase === 'pick') {
          guide = `goto:${ROW[TOUR[tut.i]](lay)}`;
        } else if (tut.phase === 'go' && settled) {
          const at = curStop().at(lay);
          if (view.spread !== at) goTo(at);
          else {
            const st = curStop();
            tut.phase = 'say';
            if (st.task === 'note') view.sel = GUIDED_ID;
            if (st.task === 'stroke') view.pen = 0;
            thinkInBook(st.say, () => {
              st.after?.();
              if (!st.task) return nextStop();
              tut.phase = 'task';
              tut.strokes0 = dState().strokes.length;
            });
          }
        } else if (tut.phase === 'task') {
          const st = curStop();
          let did = false;
          if (st.task === 'note') {
            // o campo abre sozinho, embaixo do "?" dela, e pisca até ele escrever e sair do campo
            if (!noteDone() && !view.editing) startEdit('note');
            did = noteDone() && !view.editing;
            if (!did) guide = 'edit:note';
          } else if (st.task === 'stroke') {
            did = dState().strokes.length > tut.strokes0 && !drawing;
            if (!did) guide = 'map';
          }
          if (did) {
            tut.phase = 'say';
            thinkInBook(st.done ?? [], nextStop);
          }
        } else if (tut.phase === 'back') {
          tut.wait -= dt;
          if (tut.wait <= 0 && !thinking()) {
            if (view.spread !== 0) {
              if (!flip && target !== 0) goTo(0);
            }
            if (settled && view.spread === 0) {
              tut.i++;
              tut.stop = 0;
              if (tut.i < TOUR.length) tut.phase = 'pick';
              else {
                tut.phase = 'end';
                ui.setGuidedNote(true);
                thinkInBook(END);
              }
            }
          }
        }
        if (tut.phase === 'end' && view.spread === 0 && !flip) guide = 'close';
        // pisca (~2,4 vezes por segundo)
        const blink = !!guide && Math.floor(t * 2.4) % 2 === 0;
        const pulse = tut.phase === 'task' && curStop()?.task === 'note' && !noteDone() && blink;
        if (guide !== view.guide || blink !== !!view.blink || pulse !== !!view.pulse) {
          view.guide = guide;
          view.blink = blink;
          view.pulse = pulse;
          refresh();
        }
      }
      // o "aqui" do mapa pisca devagar (aceso 1,2 s, apagado 0,5 s), só com o caderno aberto no mapa
      if (T >= 0.99 && !flip && view.spread === layout(dState()).mapAt) {
        const off = t % 1.7 > 1.2;
        if (off !== !!view.hereOff) {
          view.hereOff = off;
          refresh();
        }
      }
      if (!want && view.editing) stopEdit();
      const dir = want - T;
      if (Math.abs(dir) > 1e-4) {
        const was = T;
        T = Math.min(1, Math.max(0, T + Math.sign(dir) * dt * (want ? 1 / 1.15 : 1 / 0.85) * (presentFast ? 1.9 : 1)));
        if (want && was < 0.001) refresh();
        if (!want && T < 0.0005) T = 0;
      }
      if (T === 0 && !presenting && presentFrom >= 0) {
        // guardado depois da cena da gema: na próxima vez o caderno abre onde o jogador tinha deixado
        view.spread = target = presentFrom;
        presentFrom = -1;
        presentFast = false;
      }
      ui.setBookOut(T > 0.002);
      if (want && T >= 0.99 && !seenNews) {
        seenNews = true;
        diary.clearUnread(); // abriu o livro: as novidades foram lidas
      }
      if (!want) seenNews = false;
      root.visible = T > 0.002;
      if (!root.visible) {
        if (view.hover) view.hover = null;
        return 0;
      }
      const rise = ease(clamp01(T / 0.45));
      const frame = ease(clamp01((T - 0.25) / 0.5));
      open = ease(clamp01((T - 0.6) / 0.4));
      leftPivot.rotation.y = Math.PI * (1 - open); // a capa gira pela frente (como num livro de verdade), não por trás
      // a lombada acompanha: aberto, é a meia-cana atrás do dobra; fechado, vira a lateral redonda que une as duas capas
      setSpine(leftPivot.rotation.y);
      inner.position.x = (-BW / 2) * (1 - open);
      const mx = (a: number, b: number, k: number) => a + (b - a) * k;
      const f = (key: 'x' | 'y' | 'rx' | 'ry' | 'rz' | 's') => mx(mx(POSE.start[key], POSE.mid[key], rise), POSE.end[key], frame);
      const sway = Math.sin(t * 1.7) * 0.012 * (1 - frame);
      const endS = Math.min(POSE.end.s, env.halfW() * 1.9);
      root.position.set(f('x'), f('y') + sway, -1);
      root.rotation.set(f('rx') + sway, f('ry'), f('rz'));
      root.scale.setScalar(mx(mx(POSE.start.s, POSE.mid.s, rise), endS, frame));
      ribbon.visible = open > 0.8;
      // a presilha solta ANTES de a capa abrir e prende DEPOIS de ela fechar (T entre 0,42 e 0,58: o livro já está diante dos olhos, fechado)
      claspK = ease(clamp01((T - 0.42) / 0.16));
      flap.rotation.y = CLASP_OPEN * claspK;
      tongue.visible = claspK < 0.05; // presa: a lingueta passa pelo pino
      if (claspPrev < 0.04 && claspK >= 0.04) env.sound('bookLatch'); // soltou
      if (claspPrev > 0.04 && claspK <= 0.04) env.sound('bookLatch'); // prendeu
      claspPrev = claspK;

      // o fundo do caderno: a placa de couro no lugar do papel e do bloco de folhas da direita (também durante a virada que chega nele)
      {
        const gAt = layout(dState()).gemsAt;
        const showBoard = flip ? flip.hi === gAt : view.spread === gAt;
        board.visible = showBoard;
        meshR.visible = !showBoard;
        rightBlock.visible = !showBoard;
        if (showBoard) {
          const o = boardOverride;
          drawBoard(o ? o.n : (dState().gems ?? []).length, o ? o.flash : -1, o ? o.fk : 1);
        }
      }
      // virada de página
      // (uma página de cada vez com as setas, a roda e o canto da folha; um pulo maior, pelo índice, vira tudo de uma vez num maço)
      if (ready() && !flip && view.spread !== target) {
        const dir = Math.sign(target - view.spread) as 1 | -1;
        startFlip(Math.min(view.spread, target), Math.max(view.spread, target), dir);
      }
      if (flip) {
        const f = flip;
        f.t += dt;
        let done = true;
        for (let k = 0; k < f.n; k++) {
          const lf = leaves[k];
          // indo para a frente, a folha de cima da direita (a 0) sai primeiro; voltando, a de cima da esquerda (a última)
          const order = f.dir > 0 ? k : f.n - 1 - k;
          const p = clamp01((f.t - order * f.lag) / f.dur);
          if (p < 1) done = false;
          const e = ease(p);
          const theta = f.dir > 0 ? Math.PI * e : Math.PI * (1 - e);
          // por cima: na direita, a folha 0; na esquerda, a última (cada uma vai trocando de lugar no maço enquanto vira)
          const onLeft = theta / Math.PI;
          bend(lf, theta, 0.55 * Math.sin(Math.PI * p), (f.n - 1 - k) * (1 - onLeft) + k * onLeft);
          const shade = 0.72 + 0.28 * Math.abs(Math.cos(theta));
          (lf.front.material as THREE.MeshBasicMaterial).color.setScalar(shade);
          (lf.back.material as THREE.MeshBasicMaterial).color.setScalar(shade);
        }
        if (done) {
          view.spread = f.dir > 0 ? f.hi : f.lo;
          flip = null;
          leaves.forEach((lf) => (lf.group.visible = false));
          refresh();
        }
      }
      // cursor piscando ao escrever
      if (view.editing) {
        caretT += dt;
        if (caretT > 0.45) {
          caretT = 0;
          view.caret = !view.caret;
          refresh();
        }
      }
      return ease(clamp01(T * 3)); // quanto o dado e o giz saem da frente
    },
    dispose() {
      unsub();
      unsubLang();
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', endDraw, true);
      window.removeEventListener('pointercancel', endDraw, true);
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('wheel', onWheel, true);
      ta.remove();
      env.scene.remove(root);
    },
  };
}
