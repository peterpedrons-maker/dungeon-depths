// SALA 12 · A BALANÇA (nível 6; DESIGN.md §93; verificador tools/verify_balanca.mjs). No lugar de Os Apelidos (que foi para a reserva), na
// mesma ROTUNDA (a mesma planta, as mesmas portas). Ensina GRANDE, PEQUENO e IGUAL com o corpo das coisas: o tamanho é o peso.
// No meio, uma BALANÇA de pedra e bronze: o poste, o travessão e dois pratos pendurados. Sobre os pratos, PESOS de pedra presos por cordas
// numa viga do teto; dois deles pendem EMBAIXO de outro peso, por uma corda curta. O dado de Fogo queima uma corda (o dado que passa perto
// dela) e o que ela segura cai no prato de baixo; não volta. Queimar a corda de cima de um par derruba os dois; a curta, só o de baixo.
// O travessão pende para o lado mais pesado. Cada peso tem um NÚMERO talhado (o nome dele, não o peso): os GRANDES dizem UM, os pequenos dizem
// QUATRO, o médio diz DOIS. Sobre a porta: «DOIS PEQUENO IGUAL GRANDE CONFIRMADO». Os glifos reagem: PEQUENO e GRANDE brilham com esses pesos
// nos pratos; IGUAL, com o travessão parado no meio. A Casa só JULGA quando o jogador acende o braseirinho ao pé do poste: certo, ela lê a
// frase e a porta abre; errado, escuro, os pesos sobem de volta e as cordas ficam frias por 8 s (é também o único jeito de desfazer).
// Armadilhas: o glifo PEQUENO parece UM e o GRANDE parece QUATRO; quem lê pelo desenho procura «dois UM igual QUATRO» (os pesos UM ficam em
// lados diferentes: não fecha). E a vista engana: a esquerda mostra dois pequenos e a direita um grande, mas o 2º pequeno da esquerda segura o
// médio, e o grande da direita segura um pequeno. Nivelar não basta (um pequeno de cada lado também para no meio).
// Solução: queimar a corda do GRANDE da esquerda, a do PEQUENO sozinho da direita e a CURTA entre o grande e o pequeno da direita (cai só o
// pequeno); depois, acender o braseirinho do poste.
import * as THREE from 'three';
import { buildDoor, buildEntrance, Kit, lambert, LAMP_OFF, T } from '../kit';
import { floorTexture, slabTexture } from '../textures';
import { emberTexture } from './fire';
import { drawGlyphPart } from '../../book/font';
import { glyphsOf } from '../../story/lexicon';
import { mkBox, shotGate } from './shell';
import type { Box, Ctx, Rect, Room } from '../types';

const R = 6.2;
const HALF = 1.75;
const ZH = Math.sqrt(R * R - HALF * HALF);
const H = 5;
const PIV = 2.15; // altura do eixo do travessão
const ARM = 1.6; // meio travessão (centro do prato)
const CHAIN = 1.15; // das pontas do travessão aos pratos
const PAN_R = 0.6;
const BEAM_Y = 4.78; // a viga de onde descem as cordas (o fundo dela)
const COLD = 8;
const HIT = 0.24; // o dado a menos disto de uma corda a queima
type Size = 'P' | 'M' | 'G';
const MASS: Record<Size, number> = { P: 1, M: 1.5, G: 2 };
const EDGE: Record<Size, number> = { P: 0.26, M: 0.36, G: 0.48 };
const LINK = 0.3; // a corda curta entre um peso e o que pende dele
// [lado (-1 esquerda, 1 direita), tamanho, número talhado, pendurado em (-1 = na viga; i = embaixo do peso i), centro (y) se pende da viga,
//  onde pende (x a partir do centro do prato, z), onde pousa no prato (x, z)]: a mesma ordem do verificador.
// Vistos da entrada: à esquerda P · G · P (com o M embaixo); à direita G (com um P embaixo) · P.
const WEIGHTS: [number, Size, string, number, number, number, number, number, number][] = [
  [-1, 'G', 'n1', -1, 3.5, 0, 0.03, 0, -0.2],
  [-1, 'P', 'n4', -1, 3.3, -0.48, -0.04, -0.32, 0.1],
  [-1, 'P', 'n4', -1, 3.62, 0.48, 0.04, 0.32, 0.18],
  [-1, 'M', 'n2', 2, 0, 0.48, 0.04, 0, 0.3],
  [1, 'G', 'n1', -1, 3.62, -0.26, -0.03, -0.12, -0.2],
  [1, 'P', 'n4', 4, 0, -0.26, -0.03, -0.1, 0.25],
  [1, 'P', 'n4', -1, 3.3, 0.36, 0.05, 0.3, 0.05],
];

// a face de um peso: pedra, com o número talhado claro
function weightTexture(word: string, size: Size) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = size === 'G' ? '#6a635e' : size === 'M' ? '#736d67' : '#7c7670';
  g.fillRect(0, 0, 64, 64);
  let s = word.length * 977 + (size === 'G' ? 3 : size === 'M' ? 5 : 7);
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 140; i++) {
    g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.13)' : 'rgba(255,255,255,0.07)';
    g.fillRect(Math.floor(rnd() * 64), Math.floor(rnd() * 64), 2, 2);
  }
  g.fillStyle = 'rgba(0,0,0,0.3)';
  g.fillRect(0, 60, 64, 4);
  g.fillRect(60, 0, 4, 64);
  g.fillStyle = 'rgba(255,255,255,0.12)';
  g.fillRect(0, 0, 64, 3);
  g.fillRect(0, 0, 3, 64);
  const gl = glyphsOf(word)[0];
  if (gl) {
    // o número TALHADO como as inscrições das paredes: sulco escuro largo e a cal branca por dentro, no tamanho de um símbolo dentro da face
    // (antes o desenho era maior que a face: os pontos caíam nas quinas e pareciam rebites, e o UM virava um quadradinho solto). Cal branca,
    // nunca o marfim das frases acendíveis (o peso não se acende).
    drawGlyphPart(g, gl, 32, 33, 70, '#15110f', 1, 7);
    drawGlyphPart(g, gl, 32, 32, 70, '#f1ebd9', 1, 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const tmp = new THREE.Vector3();

export function buildBalanca(ctx: Ctx): Room {
  const kit = new Kit('ember');
  const boxes: Box[] = [];

  // ── a rotunda (a mesma de Os Apelidos: paredes curvas, as retas da entrada e da porta) ──
  const gap = 2 * Math.asin(HALF / R);
  const arc = Math.PI - gap;
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
  const door = buildDoor(kit, { x0: -HALF, x1: HALF, z0: -ZH, h: H, lamps: 5, connected: true });
  const entrance = buildEntrance(kit, { x0: -HALF, x1: HALF, z: ZH, h: H });
  // um anel de pedra clara no chão em volta da balança
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.75, 2.95, 48), new THREE.MeshLambertMaterial({ color: 0x8a7a6a, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -3 }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.006;
  kit.group.add(ring);
  // (cenógrafo) a rotunda CONSTRUÍDA: um soco de pedra lavrada no pé da parede curva e uma cornija em dois degraus no alto, só nos dois arcos
  // (a porta e a entrada têm os batentes delas). Rasos (6 cm o soco): o dado que encosta na parede não some dentro deles.
  const bandMat = (h: number) => lambert(slabTexture([(R * arc) / T, h / T], 'ember'));
  const capMat = new THREE.MeshLambertMaterial({ color: 0x8a7468, side: THREE.DoubleSide });
  const band = (y0: number, h: number, depth: number, capY: number | null) => {
    const m = bandMat(h);
    m.side = THREE.BackSide;
    for (const start of [gap / 2, Math.PI + gap / 2]) {
      const face = new THREE.Mesh(new THREE.CylinderGeometry(R - depth, R - depth, h, 32, 1, true, start, arc), m);
      face.position.y = y0 + h / 2;
      kit.group.add(face);
      if (capY === null) continue;
      // a capa (em cima do soco) ou o fundo (embaixo da cornija): o anel entre a face e a parede
      const cap = new THREE.Mesh(new THREE.RingGeometry(R - depth, R + 0.01, 32, 1, start - Math.PI / 2, arc), capMat);
      cap.rotation.x = -Math.PI / 2;
      cap.position.y = capY;
      kit.group.add(cap);
    }
  };
  band(0, 0.32, 0.06, 0.32);
  band(H - 0.3, 0.3, 0.18, H - 0.3);
  band(H - 0.42, 0.12, 0.09, H - 0.42);

  // ── a balança: o poste, o travessão (gira) e os dois pratos (penduram das pontas) ──
  const bronze = lambert(null, 0x8e6c3a);
  const darkBronze = lambert(null, 0x5e4426);
  const iron = lambert(null, 0x2e2c30);
  kit.box(0.6, 0.2, 0.6, kit.slab, 0, 0.1, 0);
  kit.box(0.34, PIV - 0.32, 0.34, kit.stone, 0, (PIV - 0.32) / 2 + 0.2, 0);
  kit.box(0.46, 0.16, 0.42, kit.slab, 0, PIV - 0.2, 0, false);
  for (const sx of [-1, 1]) kit.box(0.06, 0.34, 0.06, darkBronze, sx * 0.15, PIV + 0.02, 0, false); // a forquilha do eixo
  boxes.push(mkBox(-0.3, 0, -0.3, 0.3, 0.2, 0.3), mkBox(-0.17, 0, -0.17, 0.17, PIV + 0.1, 0.17));
  const beam = new THREE.Group();
  beam.position.set(0, PIV, 0);
  kit.group.add(beam);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(2 * ARM + 0.2, 0.13, 0.15), bronze);
  beam.add(bar);
  for (const sx of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.2), darkBronze);
    cap.position.set(sx * ARM, 0, 0);
    beam.add(cap);
  }
  // o FIEL: a agulha que sobe do eixo; a marca de ouro numa haste de pedra atrás dela mostra onde é o meio
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.55, 0.045), darkBronze);
  needle.position.set(0, 0.34, 0.1);
  beam.add(needle);
  kit.box(0.08, 0.7, 0.06, kit.stone, 0, PIV + 0.42, 0.02, false);
  kit.box(0.05, 0.14, 0.03, lambert(null, 0xe6c46a), 0, PIV + 0.66, 0.065, false);
  const pans = [-1, 1].map((side) => {
    const g = new THREE.Group();
    kit.group.add(g);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(PAN_R, PAN_R * 0.84, 0.1, 20), bronze);
    g.add(plate);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(PAN_R - 0.02, 0.025, 4, 20), darkBronze);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.05;
    g.add(rim);
    // três correntes do prato até a ponta do travessão (se juntam em cima)
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + Math.PI / 2;
      const bx = Math.cos(a) * (PAN_R - 0.06);
      const bz = Math.sin(a) * (PAN_R - 0.06);
      const len = Math.hypot(bx, CHAIN, bz);
      const ch = new THREE.Mesh(new THREE.BoxGeometry(0.022, len, 0.022), iron);
      ch.position.set(bx / 2, CHAIN / 2, bz / 2);
      ch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-bx, CHAIN, -bz).normalize());
      g.add(ch);
    }
    return { side, g, y: 0, x: side * ARM };
  });
  let theta = 0;
  let omega = 0;
  const placeBalance = () => {
    beam.rotation.z = theta;
    for (const p of pans) {
      p.x = p.side * ARM * Math.cos(theta);
      p.y = PIV + p.side * ARM * Math.sin(theta) - CHAIN;
      p.g.position.set(p.x, p.y, 0);
    }
  };
  placeBalance();

  // ── a viga do teto e os pesos pendurados ──
  // (cenógrafo) madeira mais clara que o teto: a viga é a linha de onde tudo pende, e no teto escuro ela sumia (as cordas pareciam sair do nada)
  const wood = lambert(null, 0x7a5638);
  for (const side of [-1, 1]) {
    kit.box(1.5, 0.16, 0.2, wood, side * ARM, BEAM_Y + 0.08, 0, false);
    for (const sx of [-0.62, 0.62]) kit.box(0.12, H - BEAM_Y - 0.16, 0.12, wood, side * ARM + sx, (H + BEAM_Y + 0.16) / 2, 0, false);
    // as cintas de ferro onde a viga encontra os esteios
    for (const sx of [-0.62, 0.62]) kit.box(0.16, 0.2, 0.24, iron, side * ARM + sx, BEAM_Y + 0.08, 0, false);
  }
  const tarMat = lambert(null, 0x1c1612);
  const hangY: number[] = [];
  const weights = WEIGHTS.map(([side, size, word, parent, y0, ox, oz, sx, sz], i) => {
    const e = EDGE[size];
    // quem pende de outro peso fica embaixo dele, por uma corda curta
    const hy = parent < 0 ? y0 : hangY[parent] - EDGE[WEIGHTS[parent][1]] / 2 - LINK - e / 2;
    hangY[i] = hy;
    const top = parent < 0 ? BEAM_Y : hangY[parent] - EDGE[WEIGHTS[parent][1]] / 2; // de onde desce a corda dele
    const face = new THREE.MeshLambertMaterial({ map: weightTexture(word, size) });
    const plain = lambert(null, size === 'G' ? 0x5c5550 : size === 'M' ? 0x655f59 : 0x6d6761);
    // o número na frente (virada para a entrada) e atrás
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(e, e, e), [plain, plain, plain, plain, face, face]);
    kit.group.add(mesh);
    const hx = side * ARM + ox;
    const hz = oz;
    const ropeLen = top - (hy + e / 2);
    const ropeMat = lambert(null, 0x8a7550);
    const rope = new THREE.Mesh(new THREE.BoxGeometry(0.045, 1, 0.045), ropeMat);
    kit.group.add(rope);
    // o olhal de ferro de onde a corda desce, na viga (o do peso que pende de outro vai preso no de cima, logo abaixo: cai junto com ele)
    if (parent < 0) kit.box(0.1, 0.05, 0.1, iron, hx, top - 0.025, hz, false);
    // o nó de piche no meio da corda: onde o fogo pega
    const tar = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), tarMat);
    kit.group.add(tar);
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
    flame.scale.set(0.28, 0.32, 1);
    flame.visible = false;
    kit.group.add(flame);
    return { i, side, size, word, parent, sx, sz, e, hx, hz, hy, top, ropeLen, mesh, rope, ropeMat, tar, flame, state: 'hang' as 'hang' | 'burn' | 'fall' | 'in', t: 0, y: hy, vy: 0, x: hx, z: hz };
  });
  for (const w of weights) {
    if (w.parent < 0) continue;
    const p = weights[w.parent];
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.08), iron);
    eye.position.set(w.hx - p.hx, -p.e / 2 - 0.025, w.hz - p.hz);
    p.mesh.add(eye);
  }
  type W = (typeof weights)[number];
  const kids = (w: W): W[] => weights.filter((o) => o.parent === w.i).flatMap((o) => [o, ...kids(o)]);
  const setRope = (w: W, len: number) => {
    w.rope.visible = len > 0.01;
    w.rope.scale.y = Math.max(0.01, len);
    w.rope.position.set(w.hx, w.top - len / 2, w.hz);
    w.tar.position.set(w.hx, w.top - w.ropeLen * 0.5, w.hz);
    w.tar.visible = len > w.ropeLen * 0.5 + 0.01;
    w.tar.scale.setScalar(w.parent < 0 ? 1 : 0.7);
  };
  const hangAll = () => {
    for (const w of weights) {
      w.state = 'hang';
      w.t = 0;
      w.y = w.hy;
      w.vy = 0;
      w.x = w.hx;
      w.z = w.hz;
      w.flame.visible = false;
      w.ropeMat.color.setHex(0x8a7550);
      w.mesh.position.set(w.hx, w.hy, w.hz);
      w.mesh.rotation.set(0, 0, 0);
      setRope(w, w.ropeLen);
    }
  };
  hangAll();
  const inPan = (side: number) => weights.filter((w) => w.state === 'in' && w.side === side);
  const panMass = (side: number) => inPan(side).reduce((s, w) => s + MASS[w.size], 0);

  // ── o braseirinho ao pé do poste: acendê-lo pede o julgamento ──
  const BOWL = new THREE.Vector3(0, 0.56, 0.44);
  kit.box(0.34, 0.5, 0.3, kit.stone, 0, 0.25, 0.44);
  // (cenógrafo) pé e capa de pedra lavrada: um pedestal pequeno, da família dos braseiros, e não um tijolo solto
  kit.box(0.42, 0.07, 0.38, kit.slab, 0, 0.035, 0.44, false);
  kit.box(0.4, 0.04, 0.36, kit.slab, 0, 0.48, 0.44, false);
  boxes.push(mkBox(-0.17, 0, 0.29, 0.17, 0.5, 0.59));
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.13, 0.12, 12, 1, true), darkBronze);
  bowl.position.copy(BOWL);
  kit.add(bowl, false);
  // a borda da tigela em bronze claro (pega a luz das tochas: de longe a tigela se lê como tigela)
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.022, 4, 16), bronze);
  lip.rotation.x = Math.PI / 2;
  lip.position.set(BOWL.x, BOWL.y + 0.06, BOWL.z);
  kit.group.add(lip);
  // dentro, carvão velho (e não um disco preto liso)
  const coal = document.createElement('canvas');
  coal.width = coal.height = 16;
  const cg = coal.getContext('2d')!;
  cg.fillStyle = '#16100e';
  cg.fillRect(0, 0, 16, 16);
  for (const [x, y, c] of [[3, 4, '#2c2420'], [8, 2, '#3a302a'], [11, 7, '#2c2420'], [5, 10, '#3a302a'], [10, 12, '#2c2420'], [2, 8, '#241c18'], [13, 3, '#241c18'], [7, 6, '#4a2a1c']] as [number, number, string][]) {
    cg.fillStyle = c;
    cg.fillRect(x, y, 3, 2);
  }
  const coalTex = new THREE.CanvasTexture(coal);
  coalTex.magFilter = coalTex.minFilter = THREE.NearestFilter;
  coalTex.colorSpace = THREE.SRGBColorSpace;
  const bowlIn = new THREE.Mesh(new THREE.CircleGeometry(0.17, 12), new THREE.MeshBasicMaterial({ map: coalTex }));
  bowlIn.rotation.x = -Math.PI / 2;
  bowlIn.position.set(BOWL.x, BOWL.y + 0.01, BOWL.z);
  kit.add(bowlIn, false);
  // a brasa fraca que PULSA (a mesma dos soquetes das frases: "isto pode ser aceso"; antes era um pontinho parado de 6 cm)
  const ember = new THREE.Sprite(new THREE.SpriteMaterial({ map: emberTexture(), fog: false, transparent: true, depthWrite: false }));
  ember.scale.set(0.15, 0.15, 1);
  ember.position.set(BOWL.x, BOWL.y + 0.05, BOWL.z);
  kit.group.add(ember);
  kit.contact(0, 0.2, 1.3, 1.5); // a sombra de contato da balança e do pedestal
  // a luz do julgamento: o braseirinho aceso ilumina a balança de baixo (só enquanto a Casa olha e depois de aceita)
  const judgeLight = kit.light(BOWL.x, BOWL.y + 0.45, BOWL.z + 0.25, 0xff9a48, 0);
  const judgeFlame = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
  judgeFlame.scale.set(0.34, 0.38, 1);
  judgeFlame.position.set(BOWL.x, BOWL.y + 0.2, BOWL.z);
  judgeFlame.visible = false;
  kit.group.add(judgeFlame);
  // o IGUAL talhado no poste, acima do braseirinho (a balança É a palavra)
  const postWord = kit.inscribe({ words: ['igual'], x: 0, y: 1.3, z: 0.175, nx: 0, nz: 1, size: 0.3, age: 0.15, seed: 41 });

  // ── a frase da porta, sobre o arco ──
  const sign = kit.inscribe({ words: ['n2', 'pequeno', 'igual', 'grande', 'conf'], x: 0, y: 3.55, z: -ZH + 0.025, nx: 0, nz: 1, size: 0.4, age: 0.3, seed: 9, lead: true });

  // luz: tochas na parede curva, dos lados (a balança fica entre luz e sombra)
  for (const [ux, uz, ph] of [
    [-0.94, -0.34, 1.1],
    [0.94, -0.34, 2.3],
    [-0.62, 0.78, 3.1],
    [0.62, 0.78, 4.4],
  ] as [number, number, number][])
  {
    kit.torch(ux * (R - 0.14), 2.9, uz * (R - 0.14), -ux, -uz, ph, 0xffb070, 34);
    kit.soot(ux * (R - 0.035), 3.3, uz * (R - 0.035), -ux, -uz, 0.85, 1.25); // (a fumaça sobe e suja a parede até a cornija)
  }
  kit.aoRing(R, H);
  // o chão gasto: da entrada até a frente da balança (onde se mira e se julga) e da balança até a porta, dos dois lados
  kit.wear([[0, ZH - 0.2], [0, 1.4]], 1.2);
  kit.wear([[-2.6, 0.6], [-1.9, -2.6], [0, -ZH + 0.3]], 1.0);
  kit.wear([[2.6, 0.6], [1.9, -2.6], [0, -ZH + 0.3]], 1.0);

  // ── a regra ──
  const gate = shotGate(ctx.die);
  let coldT = 0;
  let coldBeep = 0;
  let solved = false;
  let readT = 0;
  let doorOpen = 0;
  let prevWant = 0;
  let judgeT = -1; // o braseirinho aceso: a Casa olha a balança
  let aimIdx = -1; // a corda (ou 99 = o braseirinho) sob a mira: o motor perguntou com fireAim
  const level = () => Math.abs(panMass(-1) - panMass(1)) < 1e-6;
  const truth = () => {
    const cnt = (side: number, s: Size) => inPan(side).filter((w) => w.size === s).length;
    const two = (side: number) => inPan(side).length === 2 && cnt(side, 'P') === 2;
    const big = (side: number) => inPan(side).length === 1 && cnt(side, 'G') === 1;
    return level() && ((two(-1) && big(1)) || (two(1) && big(-1)));
  };
  const busy = () => solved || judgeT >= 0 || coldT > 0;
  const reset = () => {
    hangAll();
    theta = 0;
    omega = 0;
    placeBalance();
    coldT = 0;
    solved = false;
    readT = 0;
    doorOpen = 0;
    prevWant = 0;
    judgeT = -1;
    judgeFlame.visible = false;
    door.setOpen(0);
    door.lampMats.forEach((m) => m.color.setHex(LAMP_OFF));
    for (const p of [...sign.panels, ...postWord.panels]) p.fire = 0;
  };
  const burn = (w: W) => {
    if (w.state !== 'hang') return;
    w.state = 'burn';
    w.t = 0;
    ctx.sfx('ignite', `corda${w.i}`);
  };
  // a corda queimou: o peso cai, e o que pende dele cai junto (a corda curta vai junto, solta no prato)
  const release = (w: W) => {
    for (const o of [w, ...kids(w)]) {
      o.state = 'fall';
      o.vy = 0;
      o.flame.visible = false;
      if (o !== w) o.rope.visible = o.tar.visible = false;
    }
    setRope(w, w.ropeLen * 0.5); // o pedaço de cima fica preso, queimado
  };
  const askJudge = () => {
    if (judgeT >= 0 || solved) return;
    judgeT = 0;
    judgeFlame.visible = true;
    ctx.sfx('ignite', 'balanca');
  };
  // o ponto da corda na altura y (a corda é um segmento vertical)
  const ropePoint = (w: W, y: number) => new THREE.Vector3(w.hx, Math.max(w.top - w.ropeLen, Math.min(w.top - 0.03, y)), w.hz);
  if (import.meta.env.DEV) {
    (globalThis as Record<string, unknown>).__balanca = {
      state: () => ({ w: weights.map((w) => w.state), L: panMass(-1), R: panMass(1), theta: +theta.toFixed(3), level: level(), truth: truth(), solved, cold: +coldT.toFixed(1), judge: judgeT }),
      burn: (i: number) => burn(weights[i]),
      judge: askJudge,
      // onde ficam as coisas (para os testes mirarem de verdade)
      spots: () => ({ ropes: weights.map((w) => [w.hx, w.top - w.ropeLen * 0.5, w.hz]), bowl: BOWL.toArray() }),
    };
  }
  kit.bake();

  const PR = 0.75;
  return {
    name: 'A Balança',
    subtitle: 'O que pesa igual.',
    group: kit.group,
    surfaces: kit.surfaces,
    emitters: kit.emitters,
    inscriptions: kit.inscriptions,
    doorZ: -ZH,
    entranceZ: ZH,
    start: new THREE.Vector3(0, 0, ZH - 0.8),
    startYaw: 0,
    fog: { color: '#0b0a10', near: 5, far: 26 },
    ambient: { color: 0x8a78a8, intensity: 1.95 },
    boxes: [...boxes, mkBox(-1.25, 0, -ZH, -0.95, 2.65, -ZH + 0.3), mkBox(0.95, 0, -ZH, 1.25, 2.65, -ZH + 0.3)],
    sockets: [{ x: BOWL.x, y: BOWL.y, z: BOWL.z, r: 0.35 }],
    // a mira de Fogo: sobre uma corda (ainda presa) ou sobre o braseirinho
    fireAim(o, d) {
      if (busy()) return null;
      let best: THREE.Vector3 | null = null;
      let bt = Infinity;
      let bi = -1;
      const hh = d.x * d.x + d.z * d.z;
      if (hh > 1e-6)
        for (const w of weights) {
          if (w.state !== 'hang') continue;
          const tt = ((w.hx - o.x) * d.x + (w.hz - o.z) * d.z) / hh;
          if (!(tt > 0.3 && tt < 14)) continue;
          const lat = Math.hypot(o.x + d.x * tt - w.hx, o.z + d.z * tt - w.hz);
          const py = o.y + d.y * tt;
          if (lat > 0.2 || py < w.top - w.ropeLen - 0.05 || py > w.top + 0.05) continue;
          if (tt < bt) {
            bt = tt;
            bi = w.i;
            best = ropePoint(w, py);
          }
        }
      // o braseirinho: a distância do raio ao centro da tigela
      const tb = tmp.copy(BOWL).sub(o).dot(d);
      if (tb > 0.3 && tb < bt && tmp.copy(o).addScaledVector(d, tb).distanceTo(BOWL) < 0.3) {
        bi = 99;
        best = BOWL.clone().setY(BOWL.y + 0.08);
      }
      aimIdx = bi;
      return best;
    },
    fireNear(p, r) {
      if (busy() || !gate.ready()) return null;
      let best: THREE.Vector3 | null = null;
      let bd = r;
      for (const w of weights) {
        if (w.state !== 'hang') continue;
        const q = ropePoint(w, p.y);
        const dd = q.distanceTo(p);
        if (dd < bd) {
          bd = dd;
          best = q;
        }
      }
      if (BOWL.distanceTo(p) < bd) best = BOWL.clone();
      return best;
    },
    rects() {
      // a balança inteira (o poste, o travessão, os pratos e o braseirinho na frente)
      const r: Rect[] = [...entrance.rects(), ...door.rects(doorOpen > 0.85), [-ARM - PAN_R, -PAN_R, ARM + PAN_R, PAN_R + 0.1]];
      return r;
    },
    clampPlayer(pos) {
      if (pos.z > -ZH - 0.01 && pos.z < ZH + 0.01) {
        const d = Math.hypot(pos.x, pos.z);
        const max = Math.abs(pos.x) < HALF - 0.4 && Math.abs(pos.z) > ZH - 1.2 ? R : R - PR;
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
      if (p.z < -ZH + Rd + 0.03) {
        p.z = -ZH + Rd + 0.03;
        if (v.z < 0) v.z = -v.z * e;
      } else if (p.z > ZH - Rd) {
        p.z = ZH - Rd;
        if (v.z > 0) v.z = -v.z * e;
      }
    },
    groundY: () => 0,
    surfaceAt: (x, z) => kit.surfaceAt(x, z),
    dieFloor: () => 0,
    holdsDie: () => false,
    update(dt, t) {
      kit.tick(dt, t);
      gate.tick();
      const d = ctx.die;
      const fireDie = d.face === 3 && (d.state === 'flying' || d.state === 'rest');
      // o dado de Fogo perto de uma corda (em qualquer altura dela) a queima; dentro do braseirinho, pede o julgamento
      if (fireDie && !solved && judgeT < 0) {
        let hit: W | null = null;
        let hd = HIT;
        for (const w of weights) {
          if (w.state !== 'hang' || d.pos.y < w.top - w.ropeLen - 0.05 || d.pos.y > w.top + 0.03) continue;
          const dd = Math.hypot(d.pos.x - w.hx, d.pos.z - w.hz);
          if (dd < hd) {
            hd = dd;
            hit = w;
          }
        }
        const nearBowl = d.pos.distanceTo(BOWL) < 0.36;
        if ((hit || nearBowl) && gate.take()) {
          if (coldT > 0) {
            if (coldBeep <= 0) {
              ctx.sfx('error');
              coldBeep = 0.9;
            }
          } else if (hit) burn(hit);
          else askJudge();
        }
      }
      if (coldT > 0) coldT -= ctx.paused() ? 0 : dt;
      coldBeep -= dt;
      // as cordas queimando, os pesos caindo e pousando
      for (const w of weights) {
        if (w.state === 'burn') {
          w.t += dt;
          const k = Math.min(1, w.t / 0.8);
          w.flame.visible = true;
          w.flame.material.map = kit.frame(t * 9 + w.i);
          w.flame.position.set(w.hx, w.top - w.ropeLen * 0.5 + 0.1, w.hz + 0.03);
          w.ropeMat.color.setHex(k > 0.5 ? 0x2a2018 : 0x5a4630);
          if (k >= 1) release(w);
        } else if (w.state === 'fall') {
          const p = pans.find((q) => q.side === w.side)!;
          const { sx, sz } = w;
          const ty = p.y + 0.05 + w.e / 2;
          w.vy -= 14 * dt;
          w.y += w.vy * dt;
          w.x += (p.x + sx - w.x) * Math.min(1, dt * 5);
          w.z += (sz - w.z) * Math.min(1, dt * 5);
          w.mesh.position.set(w.x, Math.max(ty, w.y), w.z);
          w.mesh.rotation.z = -w.side * Math.min(0.1, (w.hy - w.y) * 0.05);
          if (w.y <= ty) {
            w.state = 'in';
            w.mesh.rotation.set(0, 0, 0);
            ctx.sfx('plate');
            omega += w.side * 0.5 * MASS[w.size]; // o tranco no travessão (o lado que recebeu desce)
          }
        } else if (w.state === 'in') {
          const p = pans.find((q) => q.side === w.side)!;
          w.mesh.position.set(p.x + w.sx, p.y + 0.05 + w.e / 2, w.sz);
        }
      }
      // a corda sob a mira clareia (como as frases sob a mira)
      const aimed = aimIdx;
      aimIdx = -1;
      for (const w of weights) if (w.state === 'hang') w.ropeMat.color.setHex(aimed === w.i ? 0xe0b878 : 0x8a7550);
      // a brasa pulsa devagar enquanto espera (como nos soquetes das frases); sob a mira, cresce
      const es = aimed === 99 ? 0.22 : 0.13 + 0.05 * (0.5 + 0.5 * Math.sin(t * 3));
      ember.scale.set(es, es, 1);
      judgeLight.intensity = judgeFlame.visible ? 16 : 0;
      // o travessão: mola amortecida até o ângulo do peso. theta > 0 levanta a ponta da direita: o lado mais pesado desce
      const target = Math.max(-0.3, Math.min(0.3, 0.16 * (panMass(-1) - panMass(1))));
      omega += ((target - theta) * 26 - omega * 5) * dt;
      theta += omega * dt;
      placeBalance();
      // o julgamento: a Casa espera a balança assentar e lê
      if (judgeT >= 0) {
        judgeT += dt;
        judgeFlame.material.map = kit.frame(t * 8);
        if (judgeT > 1.6 && Math.abs(omega) < 0.05) {
          judgeT = -1;
          if (truth()) {
            solved = true;
            door.lampMats.forEach((m) => m.color.setHex(0xff7a2e));
            ctx.sfx('piece');
          } else {
            ctx.sfx('error');
            ctx.caption('A Casa não aceitou', 'Os pesos subiram de volta.', '#cfc6e8');
            coldT = COLD;
            ctx.blackout(2.5, () => {
              hangAll();
              judgeFlame.visible = false;
              ctx.sfx('rise');
            });
          }
        }
      }
      // os glifos reagem: PEQUENO e GRANDE com esses pesos nos pratos; IGUAL com o travessão parado no meio
      readT = solved ? readT + dt : 0;
      const sizes = weights.filter((w) => w.state === 'in').map((w) => w.size);
      const still = sizes.length > 0 && Math.abs(theta) < 0.02 && Math.abs(omega) < 0.1;
      sign.panels.forEach((p, k) => {
        let on = 0;
        if (solved) on = readT > 0.2 + k * 0.4 ? 1 : 0;
        else if (p.id === 'pequeno') on = sizes.includes('P') ? 1 : 0;
        else if (p.id === 'grande') on = sizes.includes('G') ? 1 : 0;
        else if (p.id === 'igual') on = still ? 1 : 0;
        p.fire = (p.fire ?? 0) + (on - (p.fire ?? 0)) * Math.min(1, dt * 6);
      });
      for (const p of postWord.panels) p.fire = (p.fire ?? 0) + ((solved || still ? 1 : 0) - (p.fire ?? 0)) * Math.min(1, dt * 6);
      ember.visible = !solved && judgeT < 0 && coldT <= 0;
      if (solved) judgeFlame.material.map = kit.frame(t * 8);
      const want = solved && readT > 2.3 ? 1 : 0;
      if (want && !prevWant) ctx.sfx('door');
      prevWant = want;
      doorOpen += (want - doorOpen) * Math.min(1, dt * 2.4);
      door.setOpen(doorOpen);
    },
    // salvamento: a sala já resolvida (os três pesos certos nos pratos, a porta aberta, sem som)
    skip() {
      for (const i of [0, 5, 6]) {
        const w = weights[i];
        w.state = 'in';
        w.ropeMat.color.setHex(0x2a2018);
        setRope(w, w.ropeLen * 0.5);
      }
      solved = true;
      judgeFlame.visible = true;
      readT = 99;
      prevWant = 1;
      doorOpen = 1;
    },
    isSolved: () => solved,
    reset,
    dispose() {},
  };
}
