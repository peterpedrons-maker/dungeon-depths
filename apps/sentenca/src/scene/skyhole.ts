// OS FUROS (DESIGN.md §73, passo 4; HISTORIA.md "O epílogo"; DIRECAO_DE_ARTE.md §9): em todo o jogo há exatamente 21 furos REDONDOS de luz nos
// tetos, os pontos do dado. UM POR SALA, solto no teto; o desenho das faces só aparece no MAPA do caderno (cada furo é marcado no mapa, e os de
// um grupo de salas formam uma face). Assim o teto de uma sala sozinha não entrega que a Casa fica dentro de um dado (o §72 punha a face inteira
// no teto de uma sala só). Capítulo 1 = faces 1, 2 e 3:
//   · face 1 — O Poço: o próprio poço, o furo do UM (vestibulo.ts; o desenho dele é o modelo dos outros), sozinho no canto do mapa;
//   · face 2 — A Lousa e O Fio de Fogo: um par, lado a lado no mapa (a Lousa no meio da abóbada, no lugar de um arco de reforço; o Fio na
//     frente, à esquerda, em cima do pé da escada). Não dá diagonal: com a planta de hoje, em diagonal o par ficaria em fila com o Poço e os
//     três leriam como um "3";
//   · face 3 — Os Nichos e a Cisterna, A Biblioteca e Os Banhos Secos: a diagonal longa, exata (45°, 29,4 m entre um e outro), a Biblioteca
//     no meio. Na Cisterna, em cima da cisterna; na Biblioteca, na frente à direita de quem entra (longe das nove mesas, que são a constelação,
//     e sem tocar as passarelas); nos Banhos, no fundo à direita, ao lado da coluna (a ~5 m dos braseiros da piscina funda, que são um puzzle);
//   · capítulo 2 = face 4, capítulo 3 = face 5, capítulo 4 = face 6 (os fundos: o furo vira um poço comprido e estreito); depois, nenhum.
// Regra: nenhum furo ilumina coisa de puzzle (uma luz em cima de UMA mesa, de UM braseiro, viraria pista falsa).
// Todos com a MESMA cara (para o jogador saber o que contar): o furo redondo com um aro de pedra lavrada, um tubo curto de alvenaria, o céu claro
// lá em cima, a luz e a poeira caindo no facho. Frestas, janelas, pátios e o claustro não são furos (não são redondos nem têm este aro).
// A sala corta o buraco no próprio teto (`ceilingWithHoles`; numa abóbada, `vault(..., furos)` do casco), chama `skyHole` em cada um e diz ao
// motor onde eles ficam (`Room.skyHoles`, para o mapa).
import * as THREE from 'three';
import { Kit, T } from './kit';

export const HOLE_R = 1.2; // o raio de todos os furos (o mesmo do Poço)
const TUBE = 1.6; // o tubo de alvenaria acima do teto

// um teto retangular (x0..x1, z0..z1, na altura y, virado para baixo) com os furos redondos recortados
export function ceilingWithHoles(x0: number, x1: number, z0: number, z1: number, y: number, holes: [number, number][], mat: THREE.Material, r = HOLE_R) {
  const sh = new THREE.Shape();
  // (desenhado em (x, -z) e deitado com -90° em x, que leva o y da forma para -z; a UV fica em metros)
  sh.moveTo(x0, -z1);
  sh.lineTo(x1, -z1);
  sh.lineTo(x1, -z0);
  sh.lineTo(x0, -z0);
  sh.closePath();
  for (const [hx, hz] of holes) {
    const p = new THREE.Path();
    p.absarc(hx, -hz, r, 0, Math.PI * 2, true);
    sh.holes.push(p);
  }
  const m = new THREE.Mesh(new THREE.ShapeGeometry(sh, 24), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  return m;
}

// um material de tijolo com a textura repetida por metro (para a UV em metros do `ceilingWithHoles`)
export function holeCeilingMat(kit: Kit, tint = 0.8, seed = 19) {
  const m = kit.brick([1 / T, 1 / T], tint, seed);
  m.side = THREE.DoubleSide;
  return m;
}

// a altura do teto em cada ponto (x da sala): plano (um número) ou curvo (a abóbada da Lousa: `vault` devolve a altura em x)
type CeilY = (x: number) => number;
// (entorta uma geometria já no lugar: cada vértice vai para a altura que `f` dá)
function warp(geo: THREE.BufferGeometry, f: (x: number, y: number, z: number) => number) {
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setY(i, f(p.getX(i), p.getY(i), p.getZ(i)));
  p.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

// o aro de pedra lavrada, rente ao teto: é ele que diz "isto é um furo" (o Poço também tem). Num teto curvo, o aro acompanha a curva
export function holeRim(kit: Kit, x: number, z: number, y: number, r = HOLE_R, ceil?: CeilY) {
  const ringG = new THREE.RingGeometry(r, r + 0.28, 28, 1).rotateX(Math.PI / 2).translate(x, y - 0.02, z);
  const lipG = new THREE.CylinderGeometry(r + 0.28, r + 0.28, 0.12, 28, 1, true).translate(x, y - 0.08, z);
  if (ceil) {
    warp(ringG, (vx) => ceil(vx) - 0.02);
    warp(lipG, (vx, vy) => ceil(vx) + (vy > y - 0.08 ? -0.02 : -0.14));
  }
  kit.group.add(new THREE.Mesh(ringG, kit.slab));
  kit.group.add(new THREE.Mesh(lipG, kit.slab));
}

// o furo em (x, z), no teto de altura `y` (o mais alto, se o teto for curvo: `ceil`); `floorY` = o chão embaixo (o facho desce até ele)
export function skyHole(kit: Kit, x: number, z: number, y: number, o: { floorY?: number; light?: number; r?: number; ceil?: CeilY } = {}) {
  const r = o.r ?? HOLE_R;
  const floorY = o.floorY ?? 0;
  holeRim(kit, x, z, y, r, o.ceil);
  // o tubo de alvenaria (visto de baixo, por dentro); num teto curvo, a boca de baixo acompanha a curva
  const tubeM = kit.brick([(2 * Math.PI * r) / T, TUBE / T], 0.75, 41);
  tubeM.side = THREE.BackSide;
  const tubeG = new THREE.CylinderGeometry(r, r, TUBE, 24, 1, true).translate(x, y + TUBE / 2, z);
  const ceil = o.ceil;
  if (ceil) warp(tubeG, (vx, vy) => (vy > y + TUBE / 2 ? vy : ceil(vx) - 0.02));
  kit.group.add(new THREE.Mesh(tubeG, tubeM));
  // o céu lá em cima
  const sky = new THREE.Mesh(new THREE.CircleGeometry(r + 0.05, 24), new THREE.MeshBasicMaterial({ color: 0xdfe6f0, fog: false }));
  sky.rotation.x = Math.PI / 2;
  sky.position.set(x, y + TUBE, z);
  kit.group.add(sky);
  // a luz e a poeira no facho (sem o cone de luz do Poço: aqui, com o teto alto e visto de lado, ele virava uma coluna cinza sólida no pixel)
  // (DESIGN.md §98) a luz do furo faz SOMBRA de verdade, de cima para baixo, quando o jogador está perto (o motor empresta um mapa de sombra)
  kit.light(x, y - 0.8, z, 0xc8d8ff, o.light ?? 30).shadow = true;
  kit.beamDust(x, z, r * 0.95, floorY + 0.3, y - 0.3, 40, 0xe8eeff);
}
