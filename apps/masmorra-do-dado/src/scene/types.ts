import type * as THREE from 'three';
import type { Line } from '../story/dialogue';
import type { Emitter } from './kit';
import type { Inscription } from './inscription';
import type { Flag } from '../story/progress';

// tipo de piso sob os pés (muda o som dos passos)
export type Surface = 'stone' | 'rug' | 'plate' | 'water';

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

// Ponto de encaixe do dado ao posicionar (braseiro, altar...): se a mira cair perto dele,
// o dado vai pro centro, em cima da superfície. (x, y, z) locais da sala; y = topo do suporte.
export interface Socket {
  x: number;
  y: number;
  z: number;
  r: number; // alcance horizontal da mira
}

// O que o motor oferece a cada sala.
export interface Ctx {
  caption(title: string, sub: string, color: string): void;
  // `key` identifica o braseiro em 'ignite': a cena do dado queimando só toca inteira na 1ª vez de cada um
  // 'spread' = o fogo que CORRE (canaleta, friso) acende algo sozinho: só o som, sem a cena do dado queimando
  sfx(name: 'ignite' | 'spread' | 'plate' | 'gem' | 'door' | 'doorClose' | 'piece' | 'error' | 'burnout', key?: string): void;
  player: { readonly pos: THREE.Vector3 }; // olhos do jogador
  feetY(): number;
  say(lines: Line[], opts?: { block?: boolean; onEnd?: () => void }): void; // janela de conversa
  seen(id: string): void; // o jogador viu este símbolo (vai pro diário como "avistado")
  milestone(f: Flag): boolean; // marco da história (true se for novo): o mundo muda com eles
  flag(f: Flag): boolean; // este marco já aconteceu?
  stage(): number; // quantos marcos já aconteceram
  have(): { die: boolean; chalk: boolean }; // o que o jogador já tem nas mãos
  giveDie(onDone?: () => void): void; // o dado caído voa até a mão do jogador
  giveChalk(): void; // o jogador pega o giz
  dieGlow(v: number): void; // o dado caído brilha (0..1) quando "fala"
  // o dado da mão FALA em glifos (balão sobre ele); `pic` = desenho que acompanha, `delay` em s, `joy` = comemora (pulo e balanço)
  // o dado cai do poço (1ª sala): o som, a câmera olha pro buraco, ele despenca e para no chão; `onLanded` é chamado ~0,8 s depois de parar
  dropDie(onLanded: () => void): void;
  dieCenter(on: boolean): void; // cena: o dado da mão vem pro centro da tela, maior, de frente, com faixas de cinema
  dieSay(glyphs: string[], o?: { pic?: string; delay?: number; joy?: boolean }): void;
  dieLook(p: THREE.Vector3, secs?: number): void; // o dado da mão se inclina para um ponto (local da sala) por alguns segundos: ele MOSTRA uma coisa
  dieReact(kind: 'joy' | 'shake' | 'sad' | 'perk'): void; // o corpo do dado reage (sem som)
  aim(): { o: THREE.Vector3; d: THREE.Vector3 }; // o raio da mira (origem e direção, locais da sala): para o jogador APONTAR uma coisa
  // uma conversa do dado em várias frases, uma depois da outra (cada uma só começa quando a anterior terminou de ser ESCRITA e foi lida); devolve a duração total (ms)
  dieTalk(lines: { glyphs: string[]; pic?: string; joy?: boolean }[], o?: { delay?: number; gap?: number }): number;
  paused(): boolean; // cena, conversa ou diário em andamento: cronômetros de puzzle devem esperar
  // a cena fica TRAVADA esperando o jogador agir: ele não anda nem olha em volta, mas pode interagir (E/AGIR) com o que está na frente
  pin(on: boolean): void;
  freeze(on: boolean): void; // segura o jogador parado durante uma cena (chame com false pra soltar)
  // O ESCURO (PUZZLES_PROPOSTAS §4, Ficha 1): a Casa apaga tudo por `secs` segundos (ambiente e luzes a ~8%; cai em 0,15 s, volta em 0,6 s).
  // Se há uma conversa ou o balão do dado na tela, ele espera. `onDark` é chamado quando já está escuro (a porta da R5 abre nele).
  blackout(secs: number, onDark?: () => void): void;
  dark(): number; // 0 = luz normal, 1 = escuro total (para a CAL: só aparece no escuro)
  lookAt(p: THREE.Vector3, dur?: number): void; // vira a câmera suavemente para um ponto (local da sala)
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

// Algo com que o jogador interage (E no PC, o botão AGIR ou um toque no celular): a porta trancada, o giz no chão...
export interface Interactable {
  pos: THREE.Vector3; // local da sala
  r: number; // de quão perto (m)
  label: string; // o que aparece na tela ("Tentar abrir")
  enabled(): boolean;
  use(): void;
}

// Uma sala: tudo que o motor precisa saber pra montar, colidir e jogar.
export interface Room {
  name: string;
  subtitle: string;
  hint?: string;
  group: THREE.Group;
  surfaces: THREE.Object3D[]; // onde dá pra riscar com o giz
  emitters: Emitter[]; // luzes da sala (o motor empresta luzes reais às mais relevantes)
  inscriptions?: Inscription[]; // escrita nas paredes: olhar manda os símbolos ao diário
  interactables?: Interactable[];
  dieLie?: THREE.Vector3; // onde o dado está caído, no chão, antes de o jogador pegá-lo (só a 1ª sala)
  shaft?: THREE.Vector3; // poço de luz no teto (local): a câmera olha pra ele na cena de acordar
  wellTop?: THREE.Vector3; // a boca do poço lá em cima, do lado de fora (local, no nível do chão do pátio): cena da abertura
  // a sala seguinte começa mais baixa (ou mais alta) que esta: a porta de saída fica em y = exitDy (padrão 0)
  exitDy?: number;
  // a LUZ PRINCIPAL da sala, que projeta sombra de verdade (DIRECAO_DE_ARTE.md §4.2): o motor só atualiza o mapa de sombra quando o jogador está nela
  shadowLight?: THREE.SpotLight;
  // a ENTRADA desta sala fica em y = entranceY (padrão 0): salas em que se entra por cima (o fosso) ou por um patamar alto
  entranceY?: number;
  // área livre: o jogador CHEGOU a um ponto calmo dela (o dado pode fazer uma pergunta aqui)
  calm?(x: number, z: number): boolean;
  doorZ: number; // z (local) da parede do fundo, onde fica a porta
  entranceZ: number; // z (local) da parede da frente, onde a sala se liga à anterior
  start: THREE.Vector3; // pés do jogador (ponto de reinício da sala)
  startYaw: number;
  fog: { color: string; near: number; far: number };
  ambient: { color: number; intensity: number };
  boxes: Box[]; // sólidos para o dado
  sockets?: Socket[]; // pontos de encaixe ao posicionar o dado
  rects(feetY: number): Rect[]; // obstáculos para o jogador
  clampPlayer?(pos: THREE.Vector3): void; // limites curvos (coordenadas da sala); retas são obstáculos em rects()
  clampDie(p: THREE.Vector3, v: THREE.Vector3, e: number, R: number): void;
  groundY(x: number, z: number, feetY?: number): number; // chão onde o jogador pisa (`feetY` = pés agora, local: salas com andares sobrepostos escolhem o piso)
  surfaceAt?(x: number, z: number): Surface; // piso nesse ponto (pedra por padrão)
  dieFloor(x: number, z: number): number; // chão "inclinado" (rampa) para o dado
  update(dt: number, t: number): void;
  holdsDie(): boolean; // true = não recolhe o dado sozinho (ex.: placa apertada)
  onDieRest?(): void;
  exitReached?(): boolean; // só a última sala: fim da demonstração
  reset(): void;
  // salvamento: deixar a sala como resolvida (ao carregar um jogo salvo, as salas de trás voltam abertas) e saber se ela está resolvida
  skip?(): void;
  isSolved?(): boolean;
  bonus?(): boolean; // achou o segredo da sala?
  dispose(): void;
}

export type RoomBuilder = (ctx: Ctx) => Room;
