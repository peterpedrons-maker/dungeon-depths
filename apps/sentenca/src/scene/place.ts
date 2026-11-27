// ONDE CADA SALA FICA NO MUNDO (DESIGN.md §73, passo 2): cada sala é construída nas próprias coordenadas (x à direita de quem entra, z para
// trás: a entrada fica em +z e a porta do fundo em -z) e o motor a põe no mundo com uma posição e um giro em quartos de volta (0 a 3).
// Com quartos de volta as caixas continuam alinhadas aos eixos (colisão, mapa), e a conta é exata (sem senos tortos).
// Giro `q` = rotation.y de q × 90°: q 0 = a sala "anda" para o norte (-z), 1 = oeste (-x), 2 = sul (+z), 3 = leste (+x).
// Toda conversão entre o mundo e a sala passa por aqui (posição, direção, ângulo de olhar e retângulos de colisão).
import * as THREE from 'three';
import type { Rect } from './types';

// N/E/S/W da planta (tools/planta) -> quartos de volta
export const QUARTER: Record<string, number> = { N: 0, W: 1, S: 2, E: 3 };

export class Place {
  readonly pos = new THREE.Vector3();
  q = 0;
  private c = 1;
  private s = 0;

  set(q: number, x: number, y: number, z: number) {
    this.q = ((q % 4) + 4) % 4;
    this.c = [1, 0, -1, 0][this.q];
    this.s = [0, 1, 0, -1][this.q];
    this.pos.set(x, y, z);
    return this;
  }

  // o ângulo de olhar: yaw do mundo = yaw da sala + este
  get yaw() {
    return (this.q * Math.PI) / 2;
  }

  // ponto da sala -> mundo (`out` pode ser o próprio `v`)
  toWorld(v: THREE.Vector3, out: THREE.Vector3 = v) {
    const x = v.x * this.c + v.z * this.s;
    const z = -v.x * this.s + v.z * this.c;
    return out.set(x + this.pos.x, v.y + this.pos.y, z + this.pos.z);
  }

  // ponto do mundo -> sala
  toLocal(v: THREE.Vector3, out: THREE.Vector3 = v) {
    const dx = v.x - this.pos.x;
    const dz = v.z - this.pos.z;
    return out.set(dx * this.c - dz * this.s, v.y - this.pos.y, dx * this.s + dz * this.c);
  }

  // direções (sem a posição)
  dirToWorld(v: THREE.Vector3, out: THREE.Vector3 = v) {
    const x = v.x * this.c + v.z * this.s;
    const z = -v.x * this.s + v.z * this.c;
    return out.set(x, v.y, z);
  }
  dirToLocal(v: THREE.Vector3, out: THREE.Vector3 = v) {
    const x = v.x * this.c - v.z * this.s;
    const z = v.x * this.s + v.z * this.c;
    return out.set(x, v.y, z);
  }

  // (x, z) da sala -> [x, z] do mundo
  xz(x: number, z: number): [number, number] {
    return [x * this.c + z * this.s + this.pos.x, -x * this.s + z * this.c + this.pos.z];
  }

  // retângulo de colisão da sala -> mundo (o topo sobe junto com a sala)
  rectToWorld(r: Rect): Rect {
    const [ax, az] = this.xz(r[0], r[1]);
    const [bx, bz] = this.xz(r[2], r[3]);
    return [Math.min(ax, bx), Math.min(az, bz), Math.max(ax, bx), Math.max(az, bz), r[4] === undefined ? undefined : r[4] + this.pos.y, r[5] === undefined ? undefined : r[5] + this.pos.y];
  }

  // põe o grupo da sala no lugar
  apply(g: THREE.Object3D) {
    g.position.copy(this.pos);
    g.rotation.set(0, this.yaw, 0);
  }
}
