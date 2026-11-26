// OS FUROS (DESIGN.md §72; HISTORIA.md "O epílogo"; DIRECAO_DE_ARTE.md §9): em todo o jogo há exatamente 21 furos REDONDOS de luz nos tetos, os
// pontos do dado. Ficam em SEIS salas, cada uma com os furos no desenho de uma face (1+2+3+4+5+6 = 21):
//   · face 1 — O Poço (sala 1): o próprio poço, o furo do UM (vestibulo.ts; o desenho dele é o modelo dos outros);
//   · face 2 — A Biblioteca (sala 11): dois óculos em diagonal, nos corredores do Átrio (nenhum em cima de mesa: as mesas são a constelação);
//   · face 3 — Os Nichos e a Cisterna (sala 5): três em diagonal, o do meio em cima da cisterna;
//   · face 4 — Os Banhos Secos (sala 9): quatro em quadrado, na metade oeste do salão, longe da piscina funda (os quatro braseiros de lá são um
//     puzzle de "exatamente DOIS": quatro luzes ao lado deles seriam uma pista falsa);
//   · faces 5 e 6 — no capítulo 2 (furos mais estreitos e raros; DIRECAO_DE_ARTE.md §9). Do capítulo 3 em diante, nenhum.
// Todos com a MESMA cara (para o jogador saber o que contar): o furo redondo com um aro de pedra lavrada, um tubo curto de alvenaria, o céu claro
// lá em cima, a luz e a poeira caindo no facho. Frestas, janelas, pátios e o claustro não são furos (não são redondos nem têm este aro).
// A sala corta o buraco no próprio teto (`ceilingWithHoles`) e chama `skyHole` em cada um.
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

// o aro de pedra lavrada, rente ao teto: é ele que diz "isto é um furo" (o Poço também tem)
export function holeRim(kit: Kit, x: number, z: number, y: number, r = HOLE_R) {
  const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.28, 28, 1), kit.slab);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, y - 0.02, z);
  kit.group.add(ring);
  const lip = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.28, r + 0.28, 0.12, 28, 1, true), kit.slab);
  lip.position.set(x, y - 0.08, z);
  kit.group.add(lip);
}

// o furo em (x, z), no teto de altura `y`; `floorY` = o chão embaixo (o facho desce até ele)
export function skyHole(kit: Kit, x: number, z: number, y: number, o: { floorY?: number; light?: number; r?: number } = {}) {
  const r = o.r ?? HOLE_R;
  const floorY = o.floorY ?? 0;
  holeRim(kit, x, z, y, r);
  // o tubo de alvenaria (visto de baixo, por dentro)
  const tubeM = kit.brick([(2 * Math.PI * r) / T, TUBE / T], 0.75, 41);
  tubeM.side = THREE.BackSide;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(r, r, TUBE, 24, 1, true), tubeM);
  tube.position.set(x, y + TUBE / 2, z);
  kit.group.add(tube);
  // o céu lá em cima
  const sky = new THREE.Mesh(new THREE.CircleGeometry(r + 0.05, 24), new THREE.MeshBasicMaterial({ color: 0xdfe6f0, fog: false }));
  sky.rotation.x = Math.PI / 2;
  sky.position.set(x, y + TUBE, z);
  kit.group.add(sky);
  // a luz e a poeira no facho (sem o cone de luz do Poço: aqui, com o teto alto e visto de lado, ele virava uma coluna cinza sólida no pixel)
  kit.light(x, y - 0.8, z, 0xc8d8ff, o.light ?? 30);
  kit.beamDust(x, z, r * 0.95, floorY + 0.3, y - 0.3, 40, 0xe8eeff);
}
