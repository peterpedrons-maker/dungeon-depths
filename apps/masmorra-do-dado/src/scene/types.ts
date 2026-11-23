import type * as THREE from 'three';

export type DieState = 'hand' | 'flying' | 'rest' | 'returning' | 'placing';

// retângulo no plano XZ: x0, z0, x1, z1 (+ altura do topo: só bloqueia quem está abaixo dela)
export type Rect = [number, number, number, number, number?];

export interface Box {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export interface ChalkDot {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  s: number; // id da superfície riscada
}

// O que o motor oferece a cada sala.
export interface Ctx {
  caption(title: string, sub: string, color: string): void;
  player: { readonly pos: THREE.Vector3 }; // olhos do jogador
  feetY(): number;
  die: {
    readonly state: DieState;
    readonly face: number; // face do dado que está lá fora
    readonly thrown: boolean; // false = foi posicionado
    readonly pos: THREE.Vector3;
    readonly R: number;
  };
  chalk: {
    dotsOn(surface: THREE.Object3D): ChalkDot[];
    readonly revision: number; // muda sempre que o desenho muda
  };
}

// Uma sala: tudo que o motor precisa saber pra montar, colidir e jogar.
export interface Room {
  name: string;
  subtitle: string;
  hint?: string;
  group: THREE.Group;
  surfaces: THREE.Object3D[]; // onde dá pra riscar com o giz
  doorZ: number; // z (local) da parede do fundo, onde fica a porta
  entranceZ: number; // z (local) da parede da frente, onde a sala se liga à anterior
  start: THREE.Vector3; // pés do jogador (ponto de reinício da sala)
  startYaw: number;
  fog: { color: string; near: number; far: number };
  ambient: { color: number; intensity: number };
  boxes: Box[]; // sólidos para o dado
  rects(feetY: number): Rect[]; // obstáculos para o jogador
  clampPlayer?(pos: THREE.Vector3): void; // limites curvos (coordenadas da sala); retas são obstáculos em rects()
  clampDie(p: THREE.Vector3, v: THREE.Vector3, e: number, R: number): void;
  groundY(x: number, z: number): number; // chão onde o jogador pisa
  dieFloor(x: number, z: number): number; // chão "inclinado" (rampa) para o dado
  update(dt: number, t: number): void;
  holdsDie(): boolean; // true = não recolhe o dado sozinho (ex.: placa apertada)
  onDieRest?(): void;
  exitReached?(): boolean; // só a última sala: fim da demonstração
  reset(): void;
  bonus?(): boolean; // achou o segredo da sala?
  dispose(): void;
}

export type RoomBuilder = (ctx: Ctx) => Room;
