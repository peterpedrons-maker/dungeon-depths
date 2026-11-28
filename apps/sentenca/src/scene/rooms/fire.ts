// Construtor de salas de FOGO guiado por dados. Uma sala de braseiros vira uma descrição curta (FireSpec):
// tamanho, tema, onde ficam os braseiros, a regra do puzzle e a frase talhada na parede. O construtor monta
// o resto (paredes, porta, luz, colisão, inscrição, rótulos nos pedestais).
// Salas especiais (com lógica própria) continuam sendo módulos escritos à mão.

import * as THREE from 'three';
import { floorTexture, plateTexture } from '../textures';
import { ARCH_TOP, buildDoor, buildEntrance, doorFrame, Kit, lambert, LAMP_OFF, T } from '../kit';
import { planDoors } from '../plan';
import { makeBrazier, type Brazier } from '../brazier';
import { glyphsOf } from '../../story/lexicon';
import { drawGlyph } from '../../book/font';
import { shotGate } from './shell';
import { makeBurnLine, type BurnLine } from '../burnline';
import type { Inscription } from '../inscription';
import type { Ambience, Box, Ctx, Interactable, Rect, Room, Socket } from '../types';

// ── a regra que abre a porta ──
export type FireRule =
  // exatamente n braseiros acesos ao mesmo tempo; com mais do que isso a Casa apaga todos
  | { kind: 'exact'; n: number }
  // acender na ordem certa (índices dos braseiros em `braziers`); um fora de ordem apaga todos
  // `hints: false` = nenhuma gema por passo certo (só abre no fim); `penalty` = segundos em que os braseiros ficam FRIOS depois de um erro
  | { kind: 'order'; seq: number[]; hints?: boolean; penalty?: number }
  // todos acesos AO MESMO TEMPO, num instante qualquer (então a porta abre para sempre). Só faz sentido com `burn`:
  // as chamas se apagam sozinhas, e quem dura menos tem que ser aceso por último
  | { kind: 'together' }
  // ordem SECRETA: o jogador acende todos, em qualquer ordem, e a Casa "confirma" quantos estavam na posição certa
  // (as gemas do arco mostram só a CONTAGEM, não quais). Depois apaga tudo para uma nova tentativa. `seq` = índices na ordem certa.
  | { kind: 'secret'; seq: number[] }
  // CONFIRMAR NA PLACA: o jogador acende os braseiros que quiser (ficam acesos) e então pesa a placa com o Peso. A placa avalia o conjunto
  // aceso: se for exatamente `lit` (índices em `braziers`), a porta abre; senão ela ABAFA o fogo (apaga todos) e os braseiros ficam frios um tempo.
  | { kind: 'commit'; lit: number[]; penalty?: number }
  // a SALA decide (peças `extra`): o construtor não acende nem julga nada; o `extra` usa `api.markSolved()` e `api.punish()`
  | { kind: 'custom'; lamps?: number };

export interface FireBrazier {
  x: number; // a partir do centro da sala
  dz: number; // distância da parede do fundo (para a frente)
  mark?: string; // símbolo talhado no pedestal (id do léxico)
  lit?: boolean; // já começa aceso
  scale?: number; // tamanho do braseiro (maior = chama que dura mais, quando a sala usa `burn`)
  burn?: number; // segundos que a chama dura (sem isso, fica acesa)
  hidden?: boolean; // pilar escondido sob o chão: só sobe quando a trava (`FireSpec.lock`) é resolvida
  y?: number; // altura do chão sob o braseiro (mezanino, pedestal, plataforma)
}

// uma linha de um parágrafo (uma frase completa, que termina numa marca: CONFIRMADO, BOATO...)
export interface FireLine {
  words: string[];
  worn?: boolean; // gasta (boato)
  rub?: boolean; // lisa: só aparece esfregando o giz
  good?: boolean; // (tablete `lit`, modo conjunto) esta frase DEVE ser acesa; as outras punem
  ord?: number; // (tablete `lit`, modo `ordered`) posição na ordem certa de acender (0, 1, 2...); sem `ord` = engano
  preLit?: boolean; // já começa acesa e não se apaga (demonstração)
}

// uma frase talhada na parede, num ponto escolhido. Com `lines`, vira um PARÁGRAFO: frases completas, uma embaixo da outra, alinhadas à
// esquerda, lidas de cima para baixo, dentro de uma moldura só.
export interface FireTablet {
  words?: string[];
  lines?: FireLine[]; // parágrafo (só nas paredes 'left' e 'right')
  lit?: boolean; // as linhas do parágrafo acendem quando o dado de Fogo as toca (ver `FireSpec.lock`)
  wall: 'left' | 'right' | 'backL' | 'backR'; // esquerda, direita, fundo à esquerda ou à direita da porta
  dz?: number; // posição ao longo da parede (distância do fundo); ignorado no fundo
  seal?: boolean; // moldura talhada (frase confirmada)
  worn?: boolean; // muito gasta (boato)
  age?: number; // desgaste (0 nítida .. 1 muito gasta); padrão: 0.18, ou 0.75 se `worn`
  rub?: boolean; // lisa: só aparece ESFREGANDO o giz em cima (o jogador revela a pista)
  size?: number;
  y?: number; // altura do centro (padrão 1,85)
}

// PANO (M3): tecido pendurado sobre a pedra, com a marca BOATO bordada embaixo. O dado de Fogo o queima (de baixo para cima, ~2 s) e mostra a
// pedra talhada que estava embaixo. O pano volta quando o jogador sai da sala.
export interface FireCloth {
  words: string[]; // o que está TECIDO no pano
  over?: { tablet: number | 'sign'; word: number }; // cobre esta palavra talhada (de um tablete de palavras soltas, ou da frase da porta)
  wall?: 'left' | 'right'; // pano solto (sobre pedra lisa)
  dz?: number;
  y?: number;
  size?: number;
}

// peças extras de uma sala (lousa animada, tochas de constelação, nicho secreto...) que se apoiam no construtor
export interface FireExtraApi {
  kit: Kit;
  ctx: Ctx;
  X0: number;
  X1: number;
  Z0: number;
  H: number;
  boxes: Box[];
  sign: Inscription; // a frase da porta
  braziers: Brazier[];
  solved(): boolean; // a porta já abriu?
  glow(id: string, target: number, dt: number): void; // brilho de uma palavra da frase da porta
  markSolved(): void; // (regra `custom`) a porta abre
  punish(cold?: number): void; // (regra `custom`) a Casa pune: apaga os braseiros, ESCURO, e eles ficam frios `cold` segundos
  cold(): number; // segundos de frio que ainda faltam
  lamps: THREE.MeshBasicMaterial[]; // os lampiões da porta
  cloths: { burned(): boolean[]; burning(): boolean[]; restore(): void }; // os panos do construtor (`spec.cloths`)
  // (trava de escrita) as frases acendíveis, na ordem dos tabletes (a da porta por último): acesa? certa? demonstração? da porta?
  lines(): { lit: boolean; good: boolean; preLit: boolean; door: boolean }[];
  lockRisen(): boolean; // a Casa já aceitou o conjunto (ou a trava já abriu)?
  failLines(cold?: number): void; // a Casa apaga as frases acesas (as de demonstração ficam) e recusa o fogo `cold` segundos (sem escuro)
  // a Casa APONTA estas frases (índices de lines()) por `secs` segundos (parados numa cena): a luz corre por elas de novo e de novo (só a aparência;
  // não acende nem conta no julgamento). Chamar de novo recomeça a contagem e a corrida.
  cite(idx: number[], secs: number): void;
  setLines(on: boolean[]): void; // acende/apaga as frases sem animação (as de demonstração e a da porta ficam como estão)
}
export interface FireExtra {
  update?(dt: number, t: number): void;
  reset?(): void;
  bonus?(): boolean;
  rects?(): Rect[];
  interactables?: Interactable[];
  accept?(): boolean; // (regra `order`) no último braseiro certo, a sala ainda aceita? (senão é erro, como um braseiro fora de ordem)
  floorY?(x: number, z: number, feet: number): number; // chão com alturas (plataformas, rampa)
  dieFloor?(x: number, z: number): number;
  clampDie?(p: THREE.Vector3, vel: THREE.Vector3, e: number, R: number): void;
  judgeFail?(lit: boolean[]): void; // (trava julgada na porta) a Casa recusou o conjunto; `lit` = as frases acesas ANTES de ela apagar tudo
  skip?(): void; // salvamento: a sala volta resolvida (grades em cima etc.)
}

export interface FireSpec {
  name: string; // sem o "Sala N ·": a numeração é automática
  last?: boolean; // a ÚLTIMA sala do capítulo: o corredor da porta termina na luz de saída e chegar nele encerra o capítulo
  blackout?: number; // segundos do ESCURO da punição (PUZZLES_PROPOSTAS Ficha 1: 2,5 s; a sala 13 "O Escuro" usará 4 s)
  subtitle: string;
  hx: number; // meia-largura
  z0: number; // parede do fundo (a da frente é sempre z = 2)
  h: number;
  theme?: string;
  braziers: FireBrazier[];
  rule: FireRule;
  words: string[]; // a frase (ids do léxico)
  sign?: 'back' | 'left' | 'right'; // em que parede está a frase (padrão: fundo, à esquerda da porta)
  pillars?: [number, number][]; // [x, dz] colunas no meio da sala
  pillarH?: number; // altura das colunas (padrão: até o teto; no claustro, até o telhado das galerias)
  tablets?: FireTablet[]; // frases na parede (rumores, leis...)
  // placa de pressão: só o Peso a afunda. Na regra `commit` ela julga as chamas; nas outras ela é a TRAVA DA PORTA (o Tribunal, DESIGN.md
  // §77): com a sala resolvida, a porta só abre quando o Peso afunda a placa, e então fica aberta
  plate?: { x: number; dz: number };
  // TRAVA DE ESCRITA: antes do puzzle de braseiros, o jogador passa o dado de Fogo pelas FRASES da parede (tablete `lit`). Acender as certas faz os pilares
  // `hidden` subirem do chão (puzzle liberado). Acender uma errada apaga todas as frases acesas e a Casa recusa o fogo por `penalty` segundos.
  // `ordered`: as frases com `ord` têm de ser acesas nessa ordem; senão (padrão) basta acender todas as `good`, em qualquer ordem.
  // `judge: 'door'`: acender ou apagar frases não pune; a Casa só JULGA quando o jogador acende a frase da porta (o conjunto aceso tem de ser
  // exatamente as `good`). Tocar de novo numa frase acesa a apaga (para desfazer um engano).
  // `judged`: a legenda quando a Casa aceita o conjunto (padrão: os pilares de fogo subiram)
  lock?: { ordered?: boolean; penalty?: number; judge?: 'door'; judged?: [string, string] };
  // um FOSSO no chão (A Ponte de Frases): o chão some entre `dz0` e `dz1` (distância do fundo), de `x0` a `x1`, com `depth` metros de fundo.
  // O construtor faz o chão em volta, as paredes e o fundo do buraco; a sala (`extra`) cuida do que pisa (floorY, rects, dieFloor, clampDie).
  floorGap?: { x0: number; x1: number; dz0: number; dz1: number; depth: number };
  cloths?: FireCloth[];
  torches?: 'all' | 'few'; // 'few' = só as tochas da entrada e a da porta (salas de constelação: as tochas que contam são as que o jogador acende)
  extra?: (api: FireExtraApi) => FireExtra;
  fog?: { color: string; near: number; far: number };
  ambient?: { color: number; intensity: number };
  doorY?: number; // a porta de saída fica num andar alto (mezanino): a sala seguinte começa nessa altura
  sky?: boolean; // sem teto: um pátio a céu aberto (céu pálido, como o do pátio da abertura)
  ambience?: Ambience; // o som do lugar: vento, gotas, tamanho (DESIGN.md §60)
}

// brasa fraca (um pontinho laranja) para o soquete das frases acendíveis (e, pela mesma gramática, o que mais se acende: o braseirinho da
// Balança, os fogaréus do Claustro do Vento)
let emberTex: THREE.CanvasTexture | null = null;
export function emberTexture() {
  if (emberTex) return emberTex;
  const c = document.createElement('canvas');
  c.width = c.height = 8;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ff5a1e';
  g.fillRect(2, 2, 4, 4);
  g.fillStyle = '#ffb048';
  g.fillRect(3, 3, 2, 2);
  g.fillStyle = '#ff8a30';
  g.fillRect(3, 1, 2, 1);
  g.fillRect(3, 6, 2, 1);
  g.fillRect(1, 3, 1, 2);
  g.fillRect(6, 3, 1, 2);
  emberTex = new THREE.CanvasTexture(c);
  emberTex.magFilter = THREE.NearestFilter;
  emberTex.minFilter = THREE.NearestFilter;
  return emberTex;
}
// rachaduras no chão onde um pilar vai subir: anel de pedra, riscos e brasas nas frestas (o mapa de brilho só tem as brasas)
function crackTextures(seed: number) {
  const N = 96;
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = c.height = N;
    return c;
  };
  const a = mk();
  const b = mk();
  const ga = a.getContext('2d')!;
  const gb = b.getContext('2d')!;
  gb.fillStyle = '#000';
  gb.fillRect(0, 0, N, N);
  let s = seed >>> 0;
  const r = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // anel
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - N / 2 + 0.5, y - N / 2 + 0.5);
      if (d > 38 && d < 42) {
        ga.fillStyle = r() < 0.2 ? '#6a6478' : '#2a2536';
        ga.fillRect(x, y, 1, 1);
      }
    }
  // riscos que saem do centro, tortos, com brasas nas frestas
  for (let k = 0; k < 9; k++) {
    let ang = (k / 9) * Math.PI * 2 + r() * 0.4;
    let px0 = N / 2;
    let py0 = N / 2;
    for (let st = 0; st < 40; st++) {
      ang += (r() - 0.5) * 0.6;
      px0 += Math.cos(ang);
      py0 += Math.sin(ang);
      const x = Math.round(px0);
      const y = Math.round(py0);
      ga.fillStyle = '#0c0a12';
      ga.fillRect(x, y, 2, 2);
      if (st > 6 && r() < 0.28) {
        gb.fillStyle = r() < 0.4 ? '#ffb048' : '#ff6a22';
        gb.fillRect(x, y, 1, 1);
        ga.fillStyle = '#ff6a22';
        ga.fillRect(x, y, 1, 1);
      }
    }
  }
  const mkTex = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { map: mkTex(a), em: mkTex(b) };
}

const Z1 = 2;
const mkBox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box => ({
  min: new THREE.Vector3(x0, y0, z0),
  max: new THREE.Vector3(x1, y1, z1),
});

// largura de uma frase em unidades de "altura de símbolo" (cada símbolo ≈ 1,29; espaço entre palavras ≈ 0,55)
const phraseUnits = (words: string[]) => words.reduce((n, w) => n + 1.29 * Math.max(1, glyphsOf(w).length), 0) + 0.55 * (words.length - 1);
const LEAD_UNITS = 0.85 + 0.55; // o ornamento de abertura (losango) e o espaço depois dele

export function buildFireRoom(ctx: Ctx, spec: FireSpec): Room {
  const X0 = -spec.hx;
  const X1 = spec.hx;
  const Z0 = spec.z0;
  const H = spec.h;
  const theme = spec.theme ?? 'ruin';
  const kit = new Kit(theme);
  const W = X1 - X0;
  const L = Z1 - Z0;
  const zm = (Z0 + Z1) / 2;

  const FG = spec.floorGap;
  if (!FG) kit.plane(W, L, lambert(floorTexture([W / T, L / T], theme)), 0, 0, zm, -Math.PI / 2);
  else {
    // o chão em volta do fosso (até quatro pedaços), as paredes do buraco e o fundo dele
    const gz0 = Z0 + FG.dz0;
    const gz1 = Z0 + FG.dz1;
    const piece = (x0: number, x1: number, z0: number, z1: number, y = 0) => {
      if (x1 - x0 < 0.01 || z1 - z0 < 0.01) return;
      kit.plane(x1 - x0, z1 - z0, lambert(floorTexture([(x1 - x0) / T, (z1 - z0) / T], theme)), (x0 + x1) / 2, y, (z0 + z1) / 2, -Math.PI / 2);
    };
    piece(X0, X1, Z0, gz0);
    piece(X0, X1, gz1, Z1);
    piece(X0, FG.x0, gz0, gz1);
    piece(FG.x1, X1, gz0, gz1);
    const D = FG.depth;
    const gw = FG.x1 - FG.x0;
    const gl = gz1 - gz0;
    // (cenógrafo) o FUNDO do buraco: carvão velho com brasas nas frestas. Só aparece nas frestas entre as lajes afundadas e junto das paredes:
    // um fio de brasa em volta de cada laje, que é a dica de "algo sobe daqui" (DESIGN.md §25), sem luz nenhuma (antes eram duas luzes vermelhas
    // no fundo, que viravam dois círculos acesos no chão e clareavam o fosso que devia ser escuro)
    {
      const N = 64;
      const c = document.createElement('canvas');
      c.width = c.height = N;
      const g = c.getContext('2d')!;
      g.fillStyle = '#120b0a';
      g.fillRect(0, 0, N, N);
      let s = 917;
      const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 260; i++) {
        const r = rnd();
        g.fillStyle = r < 0.12 ? '#ffb048' : r < 0.45 ? '#ff6a22' : r < 0.7 ? '#7a2414' : '#2a1610';
        g.fillRect(Math.floor(rnd() * N), Math.floor(rnd() * N), 1 + Math.floor(rnd() * 2), 1);
      }
      const t = new THREE.CanvasTexture(c);
      t.magFilter = t.minFilter = THREE.NearestFilter;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(gw / 2, gl / 2);
      t.colorSpace = THREE.SRGBColorSpace;
      kit.plane(gw, gl, new THREE.MeshBasicMaterial({ map: t }), (FG.x0 + FG.x1) / 2, -D, (gz0 + gz1) / 2, -Math.PI / 2);
    }
    // as paredes do fosso ESCURECEM para baixo (a luz das lanternas não chega no fundo): é o que diz, de longe, que o buraco é fundo
    const pitWall = (w: number, seed: number, x: number, z: number, ry: number) => {
      const geo = new THREE.PlaneGeometry(w, D, 1, 4);
      const pos = geo.attributes.position;
      const col = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const k = (pos.getY(i) + D / 2) / D; // 1 na borda, 0 no fundo
        const v = 0.16 + 0.84 * k * k;
        col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = v;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const mat = kit.brick([w / T, D / T], 0.8, seed);
      mat.vertexColors = true;
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, -D / 2, z);
      m.rotation.set(0, ry, 0);
      kit.add(m);
    };
    pitWall(gw, 71, (FG.x0 + FG.x1) / 2, gz1, Math.PI); // a parede de baixo da borda da entrada
    pitWall(gw, 72, (FG.x0 + FG.x1) / 2, gz0, 0); // a da borda da porta
    pitWall(gl, 73, FG.x0, (gz0 + gz1) / 2, Math.PI / 2);
    pitWall(gl, 74, FG.x1, (gz0 + gz1) / 2, -Math.PI / 2);
  }
  if (!spec.sky) kit.plane(W, L, kit.brick([W / T, L / T], 0.65, 19), 0, H, zm, Math.PI / 2);
  else {
    // o céu: uma placa clara bem acima das paredes, com nuvens em pixels (sem luz e sem névoa)
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const g = c.getContext('2d')!;
    g.fillStyle = '#b8c0d4';
    g.fillRect(0, 0, 64, 64);
    for (let k = 0; k < 90; k++) {
      const x = (k * 37) % 64;
      const y = (k * 23 + (k % 7) * 5) % 64;
      g.fillStyle = k % 3 ? '#c8cede' : '#a8b0c6';
      g.fillRect(x, y, 6 + (k % 5), 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 4);
    t.colorSpace = THREE.SRGBColorSpace;
    kit.plane(W * 3, L * 3, new THREE.MeshBasicMaterial({ map: t, fog: false }), 0, H + 10, zm, Math.PI / 2, 0, false);
  }
  const entrance = buildEntrance(kit, { x0: X0, x1: X1, z: Z1, h: H });
  // A PLANTA NOVA (DESIGN.md §73, passo 3): a porta pode sair por uma parede do lado (a planta diz qual e onde) ou fora do meio do fundo. A
  // parede do lado ganha a peça da porta (com o arco) e fica em dois pedaços; o fundo fica liso.
  const PD = spec.last ? null : planDoors(spec.name).exit;
  const SD = PD && (PD.side !== 'B' || PD.at !== 0) ? PD : null;
  if (planDoors(spec.name).entry.side !== 'F') throw new Error(`${spec.name}: entrada de lado ainda não existe nas salas de fogo`);
  const DSPAN = 1.6;
  const sideWall = (x: number, ry: number, seed: number, cut: boolean) => {
    if (!cut) return kit.plane(L, H, kit.brick([L / T, H / T], 0.95, seed), x, H / 2, zm, 0, ry);
    const za = SD!.at - DSPAN;
    const zb = SD!.at + DSPAN;
    kit.plane(Z1 - zb, H, kit.brick([(Z1 - zb) / T, H / T], 0.95, seed + 5), x, H / 2, (zb + Z1) / 2, 0, ry);
    return kit.plane(za - Z0, H, kit.brick([(za - Z0) / T, H / T], 0.95, seed), x, H / 2, (Z0 + za) / 2, 0, ry);
  };
  const wallL = sideWall(X0, Math.PI / 2, 33, SD?.side === 'L');
  const wallR = sideWall(X1, -Math.PI / 2, 39, SD?.side === 'R');
  if (SD && SD.side !== 'B') kit.plane(W, H, kit.brick([W / T, H / T], 0.95, 35), 0, H / 2, Z0, 0, 0);

  const steps = spec.rule.kind === 'custom' ? (spec.rule.lamps ?? 1) : spec.rule.kind === 'commit' ? 1 : spec.rule.kind === 'order' ? spec.rule.seq.length : spec.rule.kind === 'together' || spec.rule.kind === 'secret' ? spec.braziers.length : 1;
  const DY = spec.doorY ?? 0;
  // (a última sala: a porta não dá na próxima, dá na luz; antes o corredor do Tribunal acabava no vazio e o capítulo não terminava)
  const door = buildDoor(
    kit,
    SD
      ? { x0: 0, x1: 0, z0: 0, y0: DY, h: H - DY, lamps: Math.min(5, steps), connected: true, theme, frame: SD.side === 'B' ? doorFrame('B', SD.at, X0, X1, Z0, Z1) : doorFrame(SD.side, SD.at, X0, X1, SD.at - DSPAN, SD.at + DSPAN) }
      : { x0: X0, x1: X1, z0: Z0, y0: DY, h: H - DY, lamps: Math.min(5, steps), connected: !spec.last, theme },
  );

  // colunas (também seguram o dado)
  const boxes: Box[] = [];
  const rects: ReturnType<Room['rects']> = [];
  const PH = spec.pillarH ?? H;
  for (const [px, pdz] of spec.pillars ?? []) {
    const pz = Z0 + pdz;
    kit.box(0.9, PH, 0.9, kit.brick([1, 1], 0.95, 50 + Math.abs(px * pz)), px, PH / 2, pz);
    kit.box(1.1, 0.25, 1.1, kit.stone, px, 0.125, pz);
    kit.box(1.1, 0.25, 1.1, kit.stone, px, PH - 0.125, pz);
    kit.contact(px, pz, 2.1);
    boxes.push(mkBox(px - 0.45, 0, pz - 0.45, px + 0.45, PH, pz + 0.45), mkBox(px - 0.55, 0, pz - 0.55, px + 0.55, 0.25, pz + 0.55), mkBox(px - 0.55, PH - 0.25, pz - 0.55, px + 0.55, PH, pz + 0.55));
    rects.push([px - 0.55, pz - 0.55, px + 0.55, pz + 0.55]);
  }

  // a frase talhada na parede
  const sign = spec.sign ?? 'back';
  const units = phraseUnits(spec.words) + LEAD_UNITS;
  const avail = sign === 'back' ? spec.hx - 1.5 : L - 3;
  const size = Math.min(0.5, avail / units);
  const noSign = spec.words.length === 0; // a sala escreve a própria frase (peças `extra`)
  const ins: Inscription = noSign
    ? { words: [], center: new THREE.Vector3(0, 1.6, Z0), normal: new THREE.Vector3(0, 0, 1), panels: [], read: true, seeT: 0, hidden: true, setReveal() {}, extras: [], setGlow() {}, reveal() {} }
    : sign === 'back'
      ? kit.inscribe({ words: spec.words, x: -(spec.hx + 1.25) / 2, y: (spec.doorY ?? 0) + 1.6, z: Z0 + 0.025, nx: 0, nz: 1, size, age: 0.3, seed: 9, lead: true })
      : sign === 'left'
        ? kit.inscribe({ words: spec.words, x: X0 + 0.025, y: 1.6, z: Z0 + L / 2 - 0.5, nx: 1, nz: 0, size, age: 0.3, seed: 9, lead: true })
        : kit.inscribe({ words: spec.words, x: X1 - 0.025, y: 1.6, z: Z0 + L / 2 - 0.5, nx: -1, nz: 0, size, age: 0.3, seed: 9, lead: true });

  // os glifos da frase REAGEM ao que o jogador faz (DESIGN.md §24): ACENDER brilha enquanto há fogo; cada número brilha com o braseiro dele (ou enche com a contagem);
  // BRASEIRO pisca ao acender; TEMPO pulsa enquanto uma chama está acabando; CONFIRMADO brilha quando a porta abre (ou quando uma frase confirmada acende)
  let flash = 0;
  let readT = 0; // há quanto tempo a porta está aberta (a frase é lida)
  let prevLit = 0;
  const glow = (id: string, target: number, dt: number) => {
    for (const p of ins.panels) if (p.id === id) p.fire = (p.fire ?? 0) + (target - (p.fire ?? 0)) * Math.min(1, dt * 6);
  };

  // braseiros e os símbolos nos pedestais
  // pilares escondidos (`hidden`): tudo do braseiro (pedestal, tigela, brasas, sombra, chama e rótulo) vai para um grupo que fica SOB o chão até a trava ser resolvida
  const RISE = 2.7;
  interface Riser {
    grp: THREE.Group;
    base: number[]; // y original de cada caixa de colisão (min, max, min, max...)
    sockR: number;
    label?: ReturnType<typeof kit.inscribe>;
  }
  const risers: (Riser | null)[] = [];
  const cracks: THREE.Mesh[] = [];
  const braziers: Brazier[] = spec.braziers.map((b) => {
    const start = kit.group.children.length;
    const br = makeBrazier(kit, ctx, b.x, Z0 + b.dz, !!b.lit, b.scale ?? 1, b.y ?? 0);
    let label: ReturnType<typeof kit.inscribe> | undefined;
    if (b.mark) {
      const sc = b.scale ?? 1;
      label = kit.inscribe({ words: [b.mark], x: b.x, y: (b.y ?? 0) + 0.45 * sc, z: Z0 + b.dz + 0.305 * sc, nx: 0, nz: 1, size: 0.5 * Math.min(1, sc), age: 0.12, frame: true, seed: 21 + Math.round(b.x * 7) });
    }
    if (b.hidden && spec.lock) {
      const grp = new THREE.Group();
      for (const k of kit.group.children.slice(start)) grp.add(k);
      kit.group.add(grp);
      grp.position.y = -RISE;
      if (label) label.hidden = true; // enquanto está no chão, olhar para o rótulo não manda símbolos ao diário
      risers.push({ grp, base: br.boxes.flatMap((bx) => [bx.min.y, bx.max.y]), sockR: br.socket.r, label });
      const touched = br.touched;
      br.touched = () => riseK >= 1 && touched();
      // DICA VISUAL (DESIGN.md §25): rachaduras com brasas no chão, onde o pilar vai subir
      const ct = crackTextures(31 + Math.round(b.x * 11 + b.dz * 7));
      const cm = new THREE.Mesh(
        new THREE.PlaneGeometry(1.7 * (b.scale ?? 1) + 0.4, 1.7 * (b.scale ?? 1) + 0.4),
        new THREE.MeshLambertMaterial({ map: ct.map, emissive: 0xff7a2e, emissiveMap: ct.em, emissiveIntensity: 0.5, transparent: true, alphaTest: 0.05, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
      );
      cm.rotation.x = -Math.PI / 2;
      cm.rotation.z = (b.x * 3 + b.dz) % 6.28;
      cm.position.set(b.x, 0.014, Z0 + b.dz);
      kit.group.add(cm);
      cracks.push(cm);
    } else risers.push(null);
    return br;
  });
  let riseK = spec.lock ? 0 : 1;
  const applyRise = () => {
    const e = riseK * riseK * (3 - 2 * riseK);
    risers.forEach((r, i) => {
      if (!r) return;
      const dy = -RISE * (1 - e);
      r.grp.position.y = dy;
      braziers[i].boxes.forEach((bx, k) => {
        bx.min.y = r.base[k * 2] + dy;
        bx.max.y = r.base[k * 2 + 1] + dy;
      });
      braziers[i].socket.r = riseK >= 1 ? r.sockR : 0;
      if (r.label) r.label.hidden = riseK < 1;
    });
  };
  applyRise();

  // frases na parede (rumores, leis...)
  const rubs: { ins: ReturnType<typeof kit.inscribe>; wall: THREE.Mesh; v: number[] }[] = [];
  const tabIns: (Inscription | undefined)[] = [];
  // tochas das paredes laterais: nunca duas muito perto uma da outra (a lista guarda onde já há uma)
  const wallTz: Record<'left' | 'right', number[]> = { left: [], right: [] };
  if (SD && SD.side !== 'B') wallTz[SD.side === 'L' ? 'left' : 'right'].push(SD.at); // (nenhuma tocha em cima da porta do lado)
  const wallTorch = (side: 'left' | 'right', z: number, y: number, phase: number, minGap = 3.2) => {
    if (wallTz[side].some((q) => Math.abs(q - z) < minGap)) return;
    wallTz[side].push(z);
    if (side === 'left') kit.torch(X0 + 0.1, y, z, 1, 0, phase);
    else kit.torch(X1 - 0.1, y, z, -1, 0, phase);
  };
  const blocks: Record<'left' | 'right', [number, number][]> = { left: [], right: [] }; // onde ficam os parágrafos (z de cada ponta)
  const blockY: Record<'left' | 'right', number[]> = { left: [], right: [] };
  const fewTorches = spec.torches === 'few';
  // frases que o Fogo acende (trava de escrita)
  interface LitLine {
    ins: ReturnType<typeof kit.inscribe>;
    x: number;
    y: number;
    z: number;
    hw: number; // meia largura da frase
    good: boolean;
    ord: number;
    lit: boolean;
    fire: number;
    flame: THREE.Sprite;
    emb: THREE.Sprite; // a brasa fraca do soquete (some quando a frase acende)
    key: string;
    preLit: boolean;
    door: boolean; // a frase da porta (modo `judge: 'door'`)
    axis: 'x' | 'z'; // ao longo de que eixo a frase corre (parede lateral = z; fundo = x)
    burn: BurnLine; // o fogo que corre pelos sulcos (scene/burnline.ts)
    gap: number; // folga vertical do toque: metade do espaço até a frase de cima/de baixo
    nx: number; // para onde a parede olha
    nz: number;
    cite?: number; // segundos em que a Casa ainda APONTA esta frase (api.cite): a luz corre por ela sem que ela esteja acesa
    citeT?: number; // (apontando) quanto tempo a luz já ficou parada no fim da frase: passado um instante, ela corre de novo
  }
  // as PRATELEIRAS dos soquetes: posicionar o dado nelas acende a frase (são pontos de encaixe do "posicionar")
  const shelves: Socket[] = [];
  const SHELF_D = 0.46; // quanto a prateleira sai da parede
  // o tampo fica 0,24 m abaixo da frase: o dado (meia altura 0,22) pousado nele fica com o centro na altura da frase
  const shelf = (wx: number, nx: number, nz: number, y: number, at: number) => {
    const top = y - 0.24;
    if (nz === 0) {
      kit.box(SHELF_D, 0.07, 0.5, kit.slab, wx + (nx * SHELF_D) / 2, top - 0.035, at, false);
      kit.box(0.22, 0.22, 0.3, kit.stone, wx + nx * 0.11, top - 0.18, at, false); // a mísula
      boxes.push(mkBox(Math.min(wx, wx + nx * SHELF_D), top - 0.07, at - 0.25, Math.max(wx, wx + nx * SHELF_D), top, at + 0.25));
      shelves.push({ x: wx + (nx * SHELF_D) / 2, y: top, z: at, r: 0.6 });
      return new THREE.Vector3(wx + nx * 0.2, top, at);
    }
    kit.box(0.5, 0.07, SHELF_D, kit.slab, at, top - 0.035, wx + (nz * SHELF_D) / 2, false);
    kit.box(0.3, 0.22, 0.22, kit.stone, at, top - 0.18, wx + nz * 0.11, false);
    boxes.push(mkBox(at - 0.25, top - 0.07, Math.min(wx, wx + nz * SHELF_D), at + 0.25, top, Math.max(wx, wx + nz * SHELF_D)));
    shelves.push({ x: at, y: top, z: wx + (nz * SHELF_D) / 2, r: 0.6 });
    return new THREE.Vector3(at, top, wx + nz * 0.2);
  };
  const litLines: LitLine[] = []
  // largura exata de uma frase (m): cada símbolo ocupa (n + 0,29) alturas, e o espaço entre palavras é 0,55
  const lineW = (words: string[], sz: number) => words.reduce((a, w) => a + (Math.max(1, glyphsOf(w).length) + 0.2917) * sz, 0) + 0.55 * sz * (words.length - 1);
  (spec.tablets ?? []).forEach((t, i) => {
    if (t.lines && (t.wall === 'left' || t.wall === 'right')) {
      // ── parágrafo: linhas alinhadas à esquerda, de cima para baixo ──
      let sz = t.size ?? 0.4;
      let lh = sz * 1.55; // altura de uma linha
      const n = t.lines.length;
      // frases ACENDÍVEIS: todas entre 1,3 m e 2,0 m de altura (mira-se de pé, sem olhar para cima nem para baixo). Mais de duas linhas não
      // cabem nessa faixa no tamanho normal: as linhas se apertam e as letras encolhem (melhor dividir o parágrafo em dois tabletes)
      const LIT_LO = 1.3;
      const LIT_HI = 2.0;
      if (t.lit && n > 1 && (n - 1) * lh > LIT_HI - LIT_LO) {
        lh = (LIT_HI - LIT_LO) / (n - 1);
        sz = Math.min(sz, lh / 1.25);
      }
      const Wb = Math.max(...t.lines.map((l) => lineW(l.words, sz)));
      const yc = t.lit ? Math.min(LIT_HI - ((n - 1) * lh) / 2, Math.max(LIT_LO + ((n - 1) * lh) / 2, t.y ?? (LIT_LO + LIT_HI) / 2)) : t.y ?? 1.85;
      const left = t.wall === 'left';
      const zc = Z0 + (t.dz ?? 9);
      const wx = left ? X0 + 0.025 : X1 - 0.025;
      const dir = left ? -1 : 1; // para onde fica a "direita" de quem lê (esquerda: rumo à porta; direita: rumo à entrada)
      const first: ReturnType<typeof kit.inscribe>[] = [];
      t.lines.forEach((ln, k) => {
        const w = lineW(ln.words, sz);
        const u = -Wb / 2 + w / 2; // o começo de todas as linhas fica no mesmo ponto
        const li = kit.inscribe({
          words: ln.words,
          x: wx,
          y: yc + ((n - 1) / 2 - k) * lh,
          z: zc + dir * u,
          nx: left ? 1 : -1,
          nz: 0,
          size: sz,
          age: ln.worn ? 0.55 : 0.18,
          seed: 40 + i * 13 + k * 7,
        });
        first.push(li);
        if (t.lit) {
          const fy = yc + ((n - 1) / 2 - k) * lh;
          // DICA VISUAL (DESIGN.md §25): no começo da frase, um SOQUETE que é uma prateleirinha de pedra, com uma brasa fraca pulsando, diz
          // "isto pode ser aceso"; quando a frase acende, uma chama fica nele. Posicionar o dado na prateleira também acende a frase.
          const fz = zc + dir * (-Wb / 2 - sz * 0.9);
          const sp = shelf(left ? X0 : X1, left ? 1 : -1, 0, fy, fz);
          const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
          flame.position.set(sp.x, sp.y + 0.14, sp.z);
          flame.visible = false;
          kit.group.add(flame);
          const emb = new THREE.Sprite(new THREE.SpriteMaterial({ map: emberTexture(), fog: false, depthWrite: false, transparent: true }));
          emb.scale.set(0.2, 0.2, 1);
          emb.position.set(sp.x, sp.y + 0.06, sp.z);
          kit.group.add(emb);
          const burn = makeBurnLine(kit, li, { size: sz, hold: () => ctx.dark() > 0.3, onGlyph: (i, n, at) => ctx.glyphLight?.(i, n, at) });
          if (ln.preLit) burn.set(true, true);
          litLines.push({ ins: li, x: wx, y: fy, z: zc + dir * u, hw: w / 2, good: !!ln.good, ord: ln.ord ?? -1, lit: !!ln.preLit, fire: ln.preLit ? 1 : 0, flame, emb, key: `L${litLines.length}`, preLit: !!ln.preLit, door: false, axis: 'z', burn, gap: n > 1 ? lh / 2 : 0.45, nx: left ? 1 : -1, nz: 0 });
        }
        if (ln.rub) {
          li.panels.forEach((_, q) => li.setReveal(q, 0));
          li.hidden = true;
          rubs.push({ ins: li, wall: left ? wallL : wallR, v: li.panels.map(() => 0) });
        }
      });
      // moldura única em volta do parágrafo (sulco largo com um fio de cal, e um segundo fio por dentro)
      const FW = Wb + sz * 0.9;
      const FH = n * lh + sz * 0.3;
      const cw = 768;
      const ch = Math.max(96, Math.round((cw * FH) / FW));
      const cv = document.createElement('canvas');
      cv.width = cw;
      cv.height = ch;
      const g = cv.getContext('2d')!;
      const rect = (x: number, y: number, ww: number, hh: number, th: number, color: string) => {
        g.fillStyle = color;
        g.fillRect(x - th / 2, y - th / 2, ww + th, th);
        g.fillRect(x - th / 2, y + hh - th / 2, ww + th, th);
        g.fillRect(x - th / 2, y - th / 2, th, hh + th);
        g.fillRect(x + ww - th / 2, y - th / 2, th, hh + th);
      };
      if (t.lit) {
        // tablete ACENDÍVEL: a moldura é do mesmo marfim fosco das frases que ainda não foram acesas (burnline.ts), sem brilho
        rect(10, 10, cw - 20, ch - 20, 12, '#15110f');
        rect(10, 10, cw - 20, ch - 20, 5, '#c9bfa4');
        rect(26, 26, cw - 52, ch - 52, 4, '#c9bfa4');
      } else {
        rect(10, 10, cw - 20, ch - 20, 12, '#15110f');
        rect(10, 10, cw - 20, ch - 20, 5, '#f1ebd9');
        rect(26, 26, cw - 52, ch - 52, 4, '#f1ebd9');
      }
      const ft = new THREE.CanvasTexture(cv);
      ft.magFilter = THREE.NearestFilter;
      ft.minFilter = THREE.LinearMipmapLinearFilter;
      ft.generateMipmaps = true;
      ft.anisotropy = 4;
      ft.colorSpace = THREE.SRGBColorSpace;
      const fm = new THREE.MeshLambertMaterial({
        map: ft,
        transparent: true,
        alphaTest: 0.02,
        depthWrite: false,
        emissive: 0xffffff,
        emissiveMap: ft,
        emissiveIntensity: 0,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -2,
      });
      const fmesh = new THREE.Mesh(new THREE.PlaneGeometry(FW, FH), fm);
      fmesh.position.set(left ? X0 + 0.021 : X1 - 0.021, yc, zc);
      fmesh.rotation.y = left ? Math.PI / 2 : -Math.PI / 2;
      fmesh.renderOrder = 0;
      kit.group.add(fmesh);
      if (!t.lit) first[0].extras.push(fm); // acompanha o brilho da escrita (a do tablete acendível não brilha: é pedra)
      const shelfM = t.lit ? sz * 0.9 + 0.3 - sz * 0.45 : 0; // (a prateleira sai um pouco além da moldura, no começo da leitura)
      blocks[left ? 'left' : 'right'].push(dir < 0 ? [zc - FW / 2, zc + FW / 2 + shelfM] : [zc - FW / 2 - shelfM, zc + FW / 2]);
      blockY[left ? 'left' : 'right'].push(yc);
      return;
    }
    const words = t.words ?? [];
    const tu = phraseUnits(words);
    const sz = t.size ?? 0.36;
    const common = { words, size: sz, age: t.age ?? (t.worn ? 0.75 : 0.18), seed: 40 + i * 13, plaque: !!t.seal, y: t.y ?? 1.85 } as const;
    let tIns;
    if (t.wall === 'left') tIns = kit.inscribe({ ...common, x: X0 + 0.025, z: Z0 + (t.dz ?? 8), nx: 1, nz: 0 });
    else if (t.wall === 'right') tIns = kit.inscribe({ ...common, x: X1 - 0.025, z: Z0 + (t.dz ?? 8), nx: -1, nz: 0 });
    else tIns = kit.inscribe({ ...common, x: (t.wall === 'backL' ? -1 : 1) * (spec.hx + 1.25) / 2, y: 1.6, size: Math.min(sz, (spec.hx - 1.5) / tu), z: Z0 + 0.025, nx: 0, nz: 1 });
    tabIns[i] = tIns;
    if (t.rub && (t.wall === 'left' || t.wall === 'right')) {
      // tablete liso: as palavras só aparecem onde o jogador esfrega o giz (a moldura fica visível, o texto não)
      tIns.panels.forEach((_, k) => tIns.setReveal(k, 0));
      tIns.hidden = true; // enquanto estiver liso, olhar para ele não manda símbolos ao diário
      rubs.push({ ins: tIns, wall: t.wall === 'left' ? wallL : wallR, v: tIns.panels.map(() => 0) });
    }
  });

  // tochas para dar para ler os parágrafos: uma em cada ponta e UMA SÓ entre dois parágrafos vizinhos, LONGE da escrita (a 1,6 m da moldura e da
  // prateleira, e acima dela): a tocha colada ofuscava as frases e roubava o brilho das acesas. Sem espaço entre dois parágrafos, não há tocha ali.
  const TD = 1.6;
  const inRoom = (z: number) => z > Z0 + 0.6 && z < Z1 - 0.6;
  for (const side of fewTorches ? [] : (['left', 'right'] as const)) {
    const ty = Math.min(H - 1.05, blockY[side].length ? Math.max(...blockY[side]) + 0.75 : 2.3);
    const bl = blocks[side].sort((m, n) => m[0] - n[0]);
    bl.forEach(([z0b, z1b], i) => {
      if (i === 0 && inRoom(z0b - TD)) wallTorch(side, z0b - TD, ty, 0.9 + i, 0);
      const next = bl[i + 1];
      if (next) {
        if (next[0] - z1b >= 2 * TD) wallTorch(side, (z1b + next[0]) / 2, ty, 1.7 + i, 0);
      } else if (inRoom(z1b + TD)) wallTorch(side, z1b + TD, ty, 2.3 + i, 0);
    });
    // frases soltas (sem parágrafo): uma tocha entre cada duas
    const solo = (spec.tablets ?? []).filter((t) => t.wall === side && !t.lines).sort((m, n) => (m.dz ?? 8) - (n.dz ?? 8));
    for (let i = 1; i < solo.length; i++) wallTorch(side, Z0 + ((solo[i - 1].dz ?? 8) + (solo[i].dz ?? 8)) / 2, (solo[i].y ?? 1.85) + 0.05, 0.9 + i);
  }

  // ── a frase da porta também se acende (trava `judge: 'door'`): é ela que pede o julgamento ──
  if (spec.lock?.judge === 'door' && sign === 'back') {
    const cx = -(spec.hx + 1.25) / 2;
    const hw = (units * size) / 2;
    const fx = cx - hw - size * 0.5 - 0.1;
    const sp = shelf(Z0, 0, 1, 1.6, fx);
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
    flame.position.set(sp.x, sp.y + 0.17, sp.z);
    flame.visible = false;
    kit.group.add(flame);
    const emb = new THREE.Sprite(new THREE.SpriteMaterial({ map: emberTexture(), fog: false, depthWrite: false, transparent: true }));
    emb.scale.set(0.2, 0.2, 1);
    emb.position.set(sp.x, sp.y + 0.06, sp.z);
    kit.group.add(emb);
    const burn = makeBurnLine(kit, ins, { size, hold: () => ctx.dark() > 0.3, onGlyph: (i, n, at) => ctx.glyphLight?.(i, n, at) });
    litLines.push({ ins, x: cx, y: 1.6, z: Z0 + 0.025, hw, good: false, ord: -1, lit: false, fire: 0, flame, emb, key: 'porta', preLit: false, door: true, axis: 'x', burn, gap: 0.45, nx: 0, nz: 1 });
  }

  // ── panos (boatos tecidos sobre a pedra) ──
  interface Cloth {
    mesh: THREE.Mesh;
    tex: THREE.CanvasTexture;
    top: number;
    h: number;
    w: number;
    center: THREE.Vector3;
    n: THREE.Vector3;
    right: THREE.Vector3;
    covered?: THREE.Mesh; // a palavra talhada que ele esconde
    fake: Inscription;
    k: number; // 0 = inteiro, 1 = queimado
    burning: boolean;
    flames: THREE.Sprite[];
    lamp: ReturnType<typeof kit.light>;
  }
  const cloths: Cloth[] = (spec.cloths ?? []).map((c, ci) => {
    const sz = c.size ?? 0.42;
    let center: THREE.Vector3;
    let n: THREE.Vector3;
    let covered: THREE.Mesh | undefined;
    let baseW = 0;
    if (c.over) {
      const tIns = c.over.tablet === 'sign' ? ins : tabIns[c.over.tablet]!;
      const panel = tIns.panels.filter((p) => p.id)[c.over.word];
      covered = panel.mesh;
      center = panel.mesh.position.clone();
      n = tIns.normal.clone();
      baseW = (panel.mesh.geometry as THREE.PlaneGeometry).parameters.width;
    } else {
      const left = c.wall !== 'right';
      center = new THREE.Vector3(left ? X0 + 0.025 : X1 - 0.025, c.y ?? 1.85, Z0 + (c.dz ?? 8));
      n = new THREE.Vector3(left ? 1 : -1, 0, 0);
    }
    const right = new THREE.Vector3(n.z, 0, -n.x);
    const glyphs = c.words.flatMap((w) => glyphsOf(w));
    const w = Math.max(baseW + 0.3, glyphs.length * sz * 1.25 + (c.words.length - 1) * sz * 0.5 + 0.35);
    const h = sz * 1.25 + 0.55;
    const top = center.y + sz * 0.75 + 0.12;
    // o tecido: trama, as palavras bordadas em fio claro e, embaixo, a marca BOATO; franja na barra
    const PXM = 96 / sz;
    const cw = Math.round(w * PXM * 0.5);
    const chh = Math.round(h * PXM * 0.5);
    const cv = document.createElement('canvas');
    cv.width = cw;
    cv.height = chh;
    const g = cv.getContext('2d')!;
    const base = ['#8a3040', '#5a4280', '#8a5a2a'][ci % 3];
    g.fillStyle = base;
    g.fillRect(0, 0, cw, chh - 6);
    g.fillStyle = 'rgba(0,0,0,0.22)';
    for (let y = 0; y < chh - 6; y += 2) g.fillRect(0, y, cw, 1);
    g.fillStyle = 'rgba(255,255,255,0.06)';
    for (let x = 0; x < cw; x += 3) g.fillRect(x, 0, 1, chh - 6);
    g.fillStyle = '#c9a24a';
    g.fillRect(0, 3, cw, 2);
    g.fillRect(0, chh - 11, cw, 2);
    for (let x = 1; x < cw; x += 3) {
      g.fillStyle = base;
      g.fillRect(x, chh - 6, 1, 4 + (x % 2) * 2);
    }
    const gs = 48 * 0.94 / 0.86;
    let cx = cw / 2 - ((glyphs.length - 1) * gs * 1.12 + (c.words.length - 1) * gs * 0.45) / 2;
    const cy = (sz * 0.7 + 0.12) * PXM * 0.5;
    c.words.forEach((wd) => {
      for (const gl of glyphsOf(wd)) {
        drawGlyph(g, gl, Math.round(cx) + 1, Math.round(cy) + 1, gs, '#1a0c10');
        drawGlyph(g, gl, Math.round(cx), Math.round(cy), gs, '#f0d488');
        cx += gs * 1.12;
      }
      cx += gs * 0.45;
    });
    const bo = glyphsOf('boato')[0];
    drawGlyph(g, bo, Math.round(cw / 2) + 1, chh - 24, gs * 0.42, '#1a0c10');
    drawGlyph(g, bo, Math.round(cw / 2), chh - 25, gs * 0.42, '#f0d488');
    const tx = new THREE.CanvasTexture(cv);
    tx.magFilter = THREE.NearestFilter;
    tx.minFilter = THREE.NearestFilter;
    tx.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tx, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide }));
    mesh.rotation.y = Math.atan2(n.x, n.z);
    const cc = center.clone().addScaledVector(n, 0.06);
    mesh.position.set(cc.x, top - h / 2, cc.z);
    kit.group.add(mesh);
    // a vara de onde ele pende
    const rod = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, w + 0.2), lambert(null, 0x4a3020));
    rod.rotation.y = Math.atan2(n.x, n.z) + Math.PI / 2;
    rod.position.set(cc.x + n.x * 0.02, top + 0.02, cc.z + n.z * 0.02);
    kit.group.add(rod);
    if (covered) covered.visible = false;
    const fake: Inscription = {
      words: [...c.words, 'boato'],
      center: new THREE.Vector3(cc.x, top - h / 2, cc.z),
      normal: n.clone(),
      panels: [],
      read: false,
      seeT: 0,
      hidden: false,
      setReveal() {},
      extras: [],
      setGlow() {},
      reveal() {},
    };
    kit.inscriptions.push(fake);
    const flames = [0, 1, 2].map(() => {
      const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
      f.scale.set(0.42, 0.36, 1);
      f.visible = false;
      kit.group.add(f);
      return f;
    });
    return { mesh, tex: tx, top, h, w, center: new THREE.Vector3(cc.x, top - h / 2, cc.z), n, right, covered, fake, k: 0, burning: false, flames, lamp: kit.light(cc.x + n.x * 0.5, top - h / 2, cc.z + n.z * 0.5, 0xff7a2e, 0) };
  });
  const restoreCloths = () => {
    for (const c of cloths) {
      c.k = 0;
      c.burning = false;
      c.mesh.visible = true;
      c.mesh.scale.y = 1;
      c.mesh.position.y = c.top - c.h / 2;
      c.tex.repeat.y = 1;
      c.tex.offset.y = 0;
      c.fake.hidden = false;
      c.flames.forEach((f) => (f.visible = false));
      c.lamp.intensity = 0;
      if (c.covered) c.covered.visible = false;
    }
  };
  const clothTmp = new THREE.Vector3();

  // decoração
  const awayD = (z: number, s: 'L' | 'R') => (SD?.side === s && Math.abs(SD.at - z) < 2.6 ? (z - Z0 > L / 2 ? Z0 + L * 0.2 : Z0 + L * 0.75) : z);
  kit.damp(X0, 1.0, awayD(Z0 + L * 0.4, 'L'), 1, 0, 1.9);
  kit.damp(X1, 2.2, awayD(Z0 + L * 0.3, 'R'), -1, 0, 1.5);
  // (cenógrafo) o FOSSO que vai de parede a parede: nem rodapé nem a sombra do pé da parede por cima dele (os dois desenhavam, nas paredes do
  // lado, a linha do chão continuando por cima do buraco: o olho lia "aqui tem chão"). Os cortes cobrem o trecho do fosso, de 2,6 em 2,6 m.
  const pitCuts: number[] = [];
  if (FG) for (let c = Z0 + FG.dz0 + 1.3; ; c += 2.6) {
    const last = Z0 + FG.dz1 - 1.3;
    pitCuts.push(Math.min(c, last));
    if (c >= last) break;
  }
  const pitL = FG && FG.x0 <= X0 + 0.01 ? pitCuts : [];
  const pitR = FG && FG.x1 >= X1 - 0.01 ? pitCuts : [];
  if (SD || pitL.length || pitR.length) {
    const holes = { L: [...(SD?.side === 'L' ? [SD.at] : []), ...pitL], R: [...(SD?.side === 'R' ? [SD.at] : []), ...pitR], B: SD ? (SD.side === 'B' ? [SD.at] : []) : [0], F: [0] };
    kit.skirting(X0, X1, Z0, Z1, 1.3, holes);
    kit.aoSides(X0, X1, Z0, Z1, H, 0, holes);
  } else {
    kit.skirting(X0, X1, Z0, Z1, 1.3);
    kit.aoSides(X0, X1, Z0, Z1, H);
  }
  kit.cornice(X0, X1, Z0, Z1, H);
  wallTorch('left', -1.2, 1.8, 0.7);
  wallTorch('right', -1.2, 1.8, 2.4);
  if (!(spec.lock?.judge === 'door')) kit.torch(X1 - 0.9, 1.8, Z0 + 0.1, 0, 1, 4.1);
  else kit.torch(X1 - 0.6, 1.8, Z0 + 0.1, 0, 1, 4.1);
  // salas compridas: tochas espaçadas nas paredes, alternando os lados, para dar para ver o caminho
  for (let z = -7, k = 0; !fewTorches && z > Z0 + 3; z -= 7, k++) {
    if (k % 2 === 0) wallTorch('right', z, 1.8, 1.3 + k);
    else wallTorch('left', z, 1.8, 3.1 + k);
  }

  // placa de pressão (regra `commit`)
  const PL = spec.plate ? { x: spec.plate.x, z: Z0 + spec.plate.dz, half: 0.7, top: 0.07 } : null;
  if (PL) {
    kit.zone('plate', (x, z) => Math.abs(x - PL.x) < PL.half && Math.abs(z - PL.z) < PL.half);
    const side = lambert(null, 0x3a3638);
    kit.box(1.4, 0.07, 1.4, [side, side, lambert(plateTexture()), side, side, side], PL.x, 0.035, PL.z);
    kit.contact(PL.x, PL.z, 1.8);
    boxes.push(mkBox(PL.x - 0.7, 0, PL.z - 0.7, PL.x + 0.7, PL.top, PL.z + 0.7));
  }
  const onPlate = () => {
    if (!PL) return false;
    const p = ctx.die.pos;
    return Math.abs(p.x - PL.x) < PL.half + 0.05 && Math.abs(p.z - PL.z) < PL.half + 0.05 && p.y < PL.top + ctx.die.R + 0.1;
  };
  let plateDown = false;
  let plateOpen = false; // (placa fora da regra `commit`) o Peso já afundou a placa com a sala resolvida: a porta fica aberta

  boxes.push(mkBox(-1.25, DY, Z0, -0.95, DY + ARCH_TOP, Z0 + 0.3), mkBox(0.95, DY, Z0, 1.25, DY + ARCH_TOP, Z0 + 0.3), mkBox(-1.25, DY + ARCH_TOP - 0.3, Z0, 1.25, H, Z0 + 0.3));
  braziers.forEach((b) => boxes.push(...b.boxes));

  // ── a regra ──
  let doorOpen = 0;
  let prevWant = 0;
  let progress = 0; // (order) quantos já foram acesos na ordem certa
  let failT = -1; // (order) contagem para apagar tudo depois de um erro
  let coldT = 0; // (order) braseiros frios depois de um erro (penalidade)
  let coldBeep = 0;
  let tries: number[] = []; // (secret) braseiros na ordem em que o jogador os acendeu nesta tentativa
  let shown = -1; // (secret) quanto tempo a Casa ainda mostra a contagem de acertos
  let lastCount = 0;
  let overlit = 0; // (exact) tempo com braseiros demais
  const left = spec.braziers.map(() => Infinity); // quanto falta para cada chama se apagar
  let solved = false;
  let lastRubRev = -1;
  let lockProg = 0; // (trava ordenada) quantas frases já foram acesas na ordem certa
  let lockCold = 0; // a Casa recusa o fogo nas frases depois de um erro
  let lockBeep = 0;
  let risen = !spec.lock; // pilares já subiram?
  const judgeDoor = spec.lock?.judge === 'door';
  const needed = litLines.filter((l) => (spec.lock?.ordered ? l.ord >= 0 : l.good)).length;
  const gate = shotGate(ctx.die);
  // MIRA DE FOGO: a frase acendível sob a mira (o motor pergunta a cada quadro, com a face de Fogo na mão)
  let aimLine: LitLine | null = null;
  let aimMark = false;
  const canLight = (l: LitLine) => !risen && lockCold <= 0 && !l.preLit && (!l.lit || judgeDoor);
  // o ponto da frase, na altura dela, afastado 0,25 m da parede, `a` metros do centro ao longo dela
  const linePoint = (l: LitLine, a: number) => {
    const c = Math.max(-l.hw, Math.min(l.hw, a));
    return l.axis === 'z' ? new THREE.Vector3(l.x + l.nx * 0.25, l.y, l.z + c) : new THREE.Vector3(l.x + c, l.y, l.z + l.nz * 0.25);
  };

  // peças extras da sala
  const extra: FireExtra = spec.extra
    ? spec.extra({
        kit,
        ctx,
        X0,
        X1,
        Z0,
        H,
        boxes,
        sign: ins,
        braziers,
        solved: () => solved,
        glow,
        markSolved() {
          if (solved) return;
          solved = true;
          door.lampMats.forEach((m) => m.color.setHex(0xff7a2e));
          ctx.sfx('piece');
        },
        punish(cold = 6) {
          braziers.forEach((b) => b.light(false, true));
          coldT = cold;
          ctx.sfx('error');
          ctx.blackout(spec.blackout ?? 2.5);
          door.lampMats.forEach((m) => m.color.setHex(LAMP_OFF));
        },
        cold: () => coldT,
        lamps: door.lampMats,
        cloths: { burned: () => cloths.map((c) => c.k >= 1), burning: () => cloths.map((c) => c.burning || c.k > 0), restore: () => restoreCloths() },
        lines: () => litLines.map((l) => ({ lit: l.lit, good: l.good, preLit: l.preLit, door: l.door })),
        lockRisen: () => risen,
        failLines(cold = 4) {
          litLines.forEach((l) => (l.lit = l.preLit));
          lockProg = 0;
          lockCold = cold;
        },
        cite(idx, secs) {
          for (const k of idx) {
            const l = litLines[k];
            if (!l) continue;
            l.burn.pulse(); // (a que já brilha, acesa ou já apontada: a luz corre de novo por ela; a apagada começa a correr no próximo quadro)
            l.cite = secs;
            l.citeT = 0;
          }
        },
        setLines(on) {
          litLines.forEach((l, k) => {
            if (l.preLit || l.door || on[k] === undefined) return;
            l.lit = on[k];
            l.burn.set(l.lit, true);
            l.fire = l.lit ? 1 : 0;
          });
        },
      })
    : {};

  const reset = () => {
    plateDown = false;
    plateOpen = false;
    litLines.forEach((l) => {
      l.lit = l.preLit;
      l.cite = 0;
      l.citeT = 0;
      l.fire = l.preLit ? 1 : 0;
      l.flame.visible = l.preLit;
      l.burn.set(l.preLit, true);
    });
    restoreCloths();
    extra.reset?.();
    lockProg = 0;
    lockCold = 0;
    risen = !spec.lock;
    riseK = spec.lock ? 0 : 1;
    applyRise();
    braziers.forEach((b, i) => b.light(!!spec.braziers[i].lit, true));
    progress = 0;
    failT = -1;
    coldT = 0;
    tries = [];
    shown = -1;
    overlit = 0;
    left.fill(Infinity);
    solved = false;
    doorOpen = 0;
    prevWant = 0;
    door.setOpen(0);
    door.lampMats.forEach((m) => m.color.setHex(LAMP_OFF));
  };

  if (import.meta.env.DEV) {
    const g = globalThis as Record<string, unknown>;
    const fn = () => ({ lit: braziers.map((b) => b.lit), left: left.map((v) => (Number.isFinite(v) ? +v.toFixed(1) : null)), solved, tries, count: lastCount, progress, cold: +coldT.toFixed(1), plate: plateDown, rise: +riseK.toFixed(2), plateOpen, lockCold: +lockCold.toFixed(1), lines: litLines.map((l) => l.lit), spots: litLines.map((l) => [l.x, l.y, l.z, l.hw]), rub: rubs.map((r) => r.v.map((x) => +x.toFixed(2))), sock: braziers.map((b) => [b.socket.x, b.socket.y, b.socket.z]) });
    g.__fire = fn; // a última sala construída
    ((g.__fires ??= {}) as Record<string, unknown>)[spec.name] = fn; // por nome: __fires['O Que a Casa Confirma']()
  }
  kit.bake();

  return {
    name: spec.name,
    subtitle: spec.subtitle,
    group: kit.group,
    surfaces: kit.surfaces,
    emitters: kit.emitters,
    inscriptions: kit.inscriptions,
    doorZ: Z0,
    entranceZ: Z1,
    exit: door.exit,
    exitDy: spec.doorY,
    exitReached: spec.last ? () => doorOpen > 0.85 && ctx.player.pos.z < door.zExit : undefined,
    start: new THREE.Vector3(0, 0, 1.2),
    startYaw: 0,
    fog: spec.fog ?? { color: '#0a0a11', near: 3.5, far: 18 },
    ambient: spec.ambient ?? { color: 0x706ea8, intensity: 1.6 },
    boxes: [...boxes, ...kit.boxes],
    sockets: [...braziers.map((b) => b.socket), ...shelves],
    fireAim(o, d) {
      if (!spec.lock) return null;
      let best: LitLine | null = null;
      let bt = Infinity;
      let ba = 0;
      for (const l of litLines) {
        if (!canLight(l)) continue;
        const den = l.axis === 'z' ? d.x : d.z;
        if (Math.abs(den) < 1e-4) continue;
        const tt = l.axis === 'z' ? (l.x - o.x) / den : (l.z - o.z) / den;
        if (!(tt > 0.3 && tt < 12)) continue;
        const py = o.y + d.y * tt;
        const a = l.axis === 'z' ? o.z + d.z * tt - l.z : o.x + d.x * tt - l.x;
        if (Math.abs(a) > l.hw + 0.65 || Math.abs(py - l.y) > l.gap) continue;
        if (tt < bt) {
          bt = tt;
          best = l;
          ba = a;
        }
      }
      if (!best) return null;
      aimLine = best;
      aimMark = true;
      return linePoint(best, ba);
    },
    fireNear(p, r) {
      if (!spec.lock || !gate.ready()) return null; // (o dado que já acendeu uma frase não é puxado para outra)
      let best: THREE.Vector3 | null = null;
      let bd = r;
      for (const l of litLines) {
        if (!canLight(l)) continue;
        const q = linePoint(l, l.axis === 'z' ? p.z - l.z : p.x - l.x);
        const dd = q.distanceTo(p);
        if (dd < bd) {
          bd = dd;
          best = q;
        }
      }
      return best;
    },
    rects() {
      const r: ReturnType<Room['rects']> = [...rects, ...braziers.filter((_, i) => !risers[i] || riseK >= 1).map((b) => b.rect), ...kit.rects, ...entrance.rects()];
      if (SD?.side === 'L') r.push([X0 - 2, Z0, X0, SD.at - DSPAN], [X0 - 2, SD.at + DSPAN, X0, Z1 + 0.5]);
      else r.push([X0 - 2, Z0, X0, Z1 + 0.5]);
      if (SD?.side === 'R') r.push([X1, Z0, X1 + 2, SD.at - DSPAN], [X1, SD.at + DSPAN, X1 + 2, Z1 + 0.5]);
      else r.push([X1, Z0, X1 + 2, Z1 + 0.5]);
      if (SD && SD.side !== 'B') r.push([X0 - 1, Z0 - 2, X1 + 1, Z0]);
      r.push(...door.rects(doorOpen > 0.85));
      if (extra.rects) r.push(...extra.rects());
      return r;
    },
    interactables: extra.interactables,
    bonus: extra.bonus,
    clampDie(p, vel, e, R) {
      extra.clampDie?.(p, vel, e, R);
      if (p.y > (spec.sky ? H + 8 : H) - R) {
        p.y = H - R;
        if (vel.y > 0) vel.y = -vel.y * e;
      }
      if (p.x < X0 + R) {
        p.x = X0 + R;
        if (vel.x < 0) vel.x = -vel.x * e;
      } else if (p.x > X1 - R) {
        p.x = X1 - R;
        if (vel.x > 0) vel.x = -vel.x * e;
      }
      if (p.z < Z0 + R + 0.03) {
        p.z = Z0 + R + 0.03;
        if (vel.z < 0) vel.z = -vel.z * e;
      } else if (p.z > Z1 - R) {
        p.z = Z1 - R;
        if (vel.z > 0) vel.z = -vel.z * e;
      }
    },
    groundY: (x, z, feet) => extra.floorY?.(x, z, feet ?? 0) ?? 0,
    surfaceAt: (x, z) => kit.surfaceAt(x, z),
    ambience: spec.ambience,
    dieFloor: (x, z) => extra.dieFloor?.(x, z) ?? 0,
    holdsDie: () => plateDown,
    onDieRest() {
      if (PL && onPlate() && ctx.die.face !== 2) ctx.caption('Leve demais', 'Só o dado pesado afunda a placa.', '#d9a066');
    },
    update(dt, t) {
      kit.tick(dt, t);
      const rule = spec.rule;
      let want = 0;
      // ── trava de escrita: o dado de Fogo acende as frases; as certas fazem os pilares subirem do chão ──
      if (spec.lock && litLines.length) {
        const lk = spec.lock;
        const d = ctx.die;
        if (!risen && !ctx.paused()) {
          if (lockCold > 0) {
            lockCold -= dt;
            lockBeep -= dt;
          }
          if (lockCold <= 0 && (d.state === 'flying' || d.state === 'rest') && d.face === 3) {
            let best: LitLine | null = null;
            let bd = Infinity;
            for (const l of litLines) {
              if (l.preLit || (l.lit && !judgeDoor)) continue;
              // a folga do toque: ao longo, a frase inteira e a prateleira; na vertical, até a metade do caminho para a frase vizinha; afastado
              // da parede, até 1,5 m (o dado que passa perto conta)
              let along = Math.abs(l.axis === 'z' ? d.pos.z - l.z : d.pos.x - l.x);
              const across = Math.abs(l.axis === 'z' ? d.pos.x - l.x : d.pos.z - l.z);
              let dy = Math.abs(d.pos.y - l.y);
              // o dado em VOO rumo à parede conta pelo ponto onde VAI BATER (senão, num arco, ele entra na faixa de 1,5 m ainda subindo, na altura
              // da frase de baixo, e acende a errada)
              if (d.state === 'flying') {
                const vt = -(l.axis === 'z' ? d.vel.x * l.nx : d.vel.z * l.nz);
                if (vt > 0.5) {
                  const tw = Math.max(0, across - d.R) / vt;
                  if (tw < 0.5) {
                    dy = Math.abs(d.pos.y + d.vel.y * tw - 8 * tw * tw - l.y);
                    along = Math.abs(l.axis === 'z' ? d.pos.z + d.vel.z * tw - l.z : d.pos.x + d.vel.x * tw - l.x);
                  }
                }
              }
              if (along < l.hw + 0.65 && dy < l.gap && across < 1.5 && dy + along * 0.2 < bd) {
                bd = dy + along * 0.2;
                best = l;
              }
            }
            if (best && !gate.take()) best = null; // um toque por arremesso (o dado que quica numa frase e cai pela de baixo não a acende)
            if (best && judgeDoor) {
              if (best.door) {
                // a Casa julga o conjunto aceso
                const chosen = litLines.filter((l) => !l.preLit && !l.door && l.lit);
                const ok = chosen.length === needed && chosen.every((l) => l.good);
                if (ok) {
                  best.lit = true;
                  risen = true;
                  ctx.sfx('ignite', best.key);
                  ctx.sfx('rise');
                  ctx.caption(...(lk.judged ?? ['A Casa leu', 'Os pilares de fogo subiram.']), '#ffd36b');
                } else {
                  extra.judgeFail?.(litLines.map((l) => l.lit));
                  litLines.forEach((l) => (l.lit = l.preLit));
                  lockCold = lk.penalty ?? 10;
                  ctx.sfx('error');
                  ctx.blackout(spec.blackout ?? 2.5); // a punição: a Casa apaga tudo
                  ctx.caption('A Casa apagou as frases', 'Apagou tudo.', '#cfc6e8');
                }
              } else if (best.lit) {
                best.lit = false;
                ctx.sfx('burnout');
              } else {
                best.lit = true;
                ctx.sfx('ignite', best.key);
              }
              best = null;
            }
            if (best) {
              const ok = lk.ordered ? best.ord === lockProg : best.good;
              if (ok) {
                best.lit = true;
                if (lk.ordered) lockProg++;
                ctx.sfx('ignite', best.key);
                if (litLines.filter((l) => l.lit).length >= needed) {
                  risen = true;
                  ctx.sfx('rise');
                  ctx.caption('Algo se move sob o chão', 'Pilares.', '#ffd36b');
                } else ctx.caption('A frase acendeu', 'A Casa aceitou esta.', '#ff9a3c');
              } else {
                litLines.forEach((l) => (l.lit = false));
                lockProg = 0;
                lockCold = lk.penalty ?? 4;
                ctx.sfx('error');
                ctx.blackout(spec.blackout ?? 2.5);
                ctx.caption('A Casa apagou as frases', 'Apagou tudo.', '#cfc6e8');
              }
            }
          }
        }
        if (risen && riseK < 1) riseK = Math.min(1, riseK + dt / 2.2);
        applyRise();
        // rachaduras no chão: brasas fracas pulsando; ao liberar, acendem forte enquanto o pilar sobe e depois só ficam as frestas
        const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
        for (const c of cracks) (c.material as THREE.MeshLambertMaterial).emissiveIntensity = risen ? (riseK < 1 ? 1.8 : 0.25) : 0.35 + 0.45 * pulse;
        const aimed = aimMark ? aimLine : null; // a frase sob a mira (o motor perguntou com fireAim neste quadro ou no anterior)
        aimMark = false;
        for (const l of litLines) {
          // a brasa fraca do soquete pulsa enquanto a frase espera
          l.emb.visible = !risen && !l.lit && l.fire < 0.15 && lockCold <= 0;
          const es = 0.17 + 0.07 * (0.5 + 0.5 * Math.sin(t * 3 + l.z));
          l.emb.scale.set(es, es, 1);
          if (l.cite) {
            // APONTAR é a luz correndo pela frase de novo e de novo (a acesa fica parada): assim a apontada não se confunde com a acesa, nem a
            // demonstração apontada (sempre acesa) com a que não foi. Numa cena a Casa espera, como a luz.
            const st = ctx.paused() ? 0 : dt;
            l.cite = Math.max(0, l.cite - st);
            if (l.cite && !l.burn.running() && l.burn.level() > 0.99 && (l.citeT = (l.citeT ?? 0) + st) > 0.6) {
              l.burn.pulse(true); // (as repetições são mudas: a nota de cada símbolo soa só quando a Casa aponta, api.cite)
              l.citeT = 0;
            }
          }
          l.burn.set(l.lit || !!l.cite);
          l.burn.highlight(l === aimed);
          l.burn.update(ctx.paused() ? 0 : dt, t); // (durante uma cena, como a do dado queimando, a luz espera: ela escreve à vista)
          l.fire = l.burn.level();
          l.flame.visible = l.fire > 0.05;
          if (l.flame.visible) {
            l.flame.material.map = kit.frame(t * 8 + l.z);
            l.flame.scale.set(0.3 * l.fire, 0.27 * l.fire, 1); // (uma chaminha no soquete: o fogo de verdade está na frase)
          }
        }
      }
      // esfregar o giz num tablete liso faz as palavras aparecerem (só quando o desenho muda)
      if (rubs.length && ctx.chalk.revision !== lastRubRev) {
        lastRubRev = ctx.chalk.revision;
        for (const r of rubs) {
          const dots = ctx.chalk.dotsOn(r.wall);
          r.ins.panels.forEach((p, k) => {
            const g = p.mesh.geometry as THREE.PlaneGeometry;
            const w = g.parameters.width;
            const h = g.parameters.height;
            const n = dots.filter((d) => Math.abs(d.z - p.mesh.position.z) < w / 2 + 0.04 && Math.abs(d.y - p.mesh.position.y) < h / 2 + 0.04).length;
            r.v[k] = Math.max(r.v[k], Math.min(1, n / 7));
            r.ins.setReveal(k, r.v[k]);
          });
          if (r.v.every((x) => x > 0.99)) r.ins.hidden = false;
        }
      }
      gate.tick();
      // panos: o dado de Fogo os queima de baixo para cima; voltam quando o jogador sai da sala
      if (cloths.length) {
        const d = ctx.die;
        for (const c of cloths) {
          if (!c.burning && c.k === 0 && d.face === 3 && (d.state === 'flying' || d.state === 'rest')) {
            clothTmp.copy(d.pos).sub(c.center);
            if (Math.abs(clothTmp.dot(c.n)) < 0.5 && Math.abs(clothTmp.dot(c.right)) < c.w / 2 + 0.15 && Math.abs(clothTmp.y) < c.h / 2 + 0.2) {
              c.burning = true;
              ctx.sfx('ignite', 'pano');
            }
          }
          if (c.burning) {
            c.k = Math.min(1, c.k + dt / 2);
            const rest = 1 - c.k;
            c.mesh.scale.y = Math.max(0.001, rest);
            c.mesh.position.y = c.top - (c.h * rest) / 2;
            c.tex.repeat.y = Math.max(0.001, rest);
            c.tex.offset.y = c.k;
            const by = c.top - c.h * rest;
            c.flames.forEach((f, k) => {
              f.visible = rest > 0.02;
              f.position.copy(c.center).addScaledVector(c.right, (k - 1) * c.w * 0.33).addScaledVector(c.n, 0.08);
              f.position.y = by + 0.12;
              f.material.map = kit.frame(t * 10 + k * 2);
            });
            c.lamp.intensity = rest > 0.02 ? 30 : 0;
            if (c.covered && c.k > 0.5) c.covered.visible = true;
            if (c.k >= 1) {
              c.burning = false;
              c.mesh.visible = false;
              c.fake.hidden = true;
              c.flames.forEach((f) => (f.visible = false));
              c.lamp.intensity = 0;
            }
          }
        }
        const lp = ctx.player.pos;
        if (cloths.some((c) => c.k > 0) && (lp.z > Z1 + 0.6 || lp.z < Z0 - 1.2)) restoreCloths();
      }
      extra.update?.(dt, t);
      if (rule.kind === 'exact') {
        for (const b of braziers) if (b.touched()) b.light(true);
        const nLit = braziers.filter((b) => b.lit).length;
        want = nLit === rule.n || solved ? 1 : 0;
        // o número tem que ser EXATO: com braseiros demais, a Casa apaga tudo
        if (nLit > rule.n) {
          overlit += dt;
          if (overlit > 1.6) {
            braziers.forEach((b) => b.light(false));
            overlit = 0;
          }
        } else overlit = 0;
      } else if (rule.kind === 'order') {
        if (failT >= 0) {
          // um braseiro fora de ordem: ele queima um instante e a Casa apaga todos
          failT -= dt;
          if (failT < 0) {
            braziers.forEach((b) => b.light(false));
            progress = 0;
            coldT = rule.penalty ?? 0;
            if (coldT > 0) ctx.blackout(spec.blackout ?? 2.5);
            door.lampMats.forEach((m) => m.color.setHex(LAMP_OFF));
          }
        } else if (coldT > 0) {
          // os braseiros estão FRIOS: a Casa recusa o fogo por um tempo (o dado só faz um som seco)
          coldT -= dt;
          coldBeep -= dt;
          if (coldBeep <= 0 && braziers.some((b) => b.touched())) {
            ctx.sfx('error');
            coldBeep = 0.9;
          }
        } else if (!solved) {
          braziers.forEach((b, i) => {
            if (!b.touched()) return;
            b.light(true);
            if (i === rule.seq[progress]) {
              if (rule.hints !== false) door.lampMats[Math.min(progress, door.lampMats.length - 1)].color.setHex(0xff7a2e);
              progress++;
              if (progress >= rule.seq.length && extra.accept && !extra.accept()) {
                failT = 1.3; // a ordem estava certa, mas a sala não aceita (ex.: o pano errado queimado)
              } else if (progress >= rule.seq.length) {
                solved = true;
                door.lampMats.forEach((m) => m.color.setHex(0xff7a2e));
                ctx.sfx('piece');
              }
            } else failT = 1.3;
          });
        }
        want = solved ? 1 : 0;
      }
      if (rule.kind === 'custom') {
        if (coldT > 0) {
          coldT -= ctx.paused() ? 0 : dt;
          coldBeep -= dt;
          if (coldBeep <= 0 && braziers.some((b) => b.touched())) {
            ctx.sfx('error');
            coldBeep = 0.9;
          }
        }
        want = solved ? 1 : 0;
      }
      if (rule.kind === 'commit') {
        if (!solved && coldT > 0) {
          // depois de um erro a placa abafou o fogo: os braseiros ficam frios um tempo
          coldT -= dt;
          coldBeep -= dt;
          if (coldBeep <= 0 && braziers.some((b) => b.touched())) {
            ctx.sfx('error');
            coldBeep = 0.9;
          }
        } else if (!solved) {
          for (const b of braziers) if (b.touched()) b.light(true);
        }
        const pressed = !solved && ctx.die.state === 'rest' && ctx.die.face === 2 && onPlate();
        if (pressed && !plateDown) {
          plateDown = true;
          ctx.sfx('plate');
          const litNow = braziers.map((b, i) => (b.lit ? i : -1)).filter((i) => i >= 0);
          const ok = litNow.length === rule.lit.length && rule.lit.every((i) => litNow.includes(i));
          if (ok) {
            solved = true;
            door.lampMats.forEach((m) => m.color.setHex(0xff7a2e));
            ctx.sfx('piece');
            ctx.caption('A placa aceitou', 'As chamas respondem.', '#ffd36b');
          } else {
            braziers.forEach((b) => b.light(false, true));
            coldT = rule.penalty ?? 6;
            ctx.sfx('error');
            ctx.blackout(spec.blackout ?? 2.5);
            ctx.caption('A placa abafou o fogo', 'A Casa não aceitou estas chamas.', '#cfc6e8');
          }
        }
        if (!pressed && !(solved && onPlate())) plateDown = false;
        want = solved ? 1 : 0;
      }
      if (rule.kind === 'secret') {
        if (!solved && shown < 0) {
          // acendendo: cada braseiro entra na lista na ordem em que foi aceso
          braziers.forEach((b, i) => {
            if (b.touched() && !tries.includes(i)) {
              b.light(true);
              tries.push(i);
            }
          });
          if (tries.length === braziers.length) {
            // todos acesos: a Casa confirma quantos estavam na posição certa
            lastCount = tries.filter((bi, pos) => bi === rule.seq[pos]).length;
            door.lampMats.forEach((m, i) => m.color.setHex(i < lastCount ? 0xff7a2e : LAMP_OFF));
            if (lastCount === braziers.length) {
              solved = true;
              ctx.sfx('piece');
            } else {
              shown = 3;
              ctx.sfx(lastCount > 0 ? 'plate' : 'error');
            }
          }
        } else if (shown >= 0) {
          // mostra a contagem por uns segundos e apaga tudo para uma nova tentativa
          shown -= dt;
          if (shown < 0) {
            braziers.forEach((b) => b.light(false));
            tries = [];
            door.lampMats.forEach((m) => m.color.setHex(LAMP_OFF));
          }
        }
        want = solved ? 1 : 0;
      }
      if (rule.kind === 'together') {
        // as chamas acendem, encolhem e se apagam sozinhas; o tempo espera durante cenas, conversa e diário
        braziers.forEach((b, i) => {
          const life = spec.braziers[i].burn ?? Infinity;
          if (!solved && b.touched()) {
            b.light(true);
            left[i] = life;
          }
          if (b.lit && Number.isFinite(life) && !ctx.paused()) {
            left[i] -= dt;
            b.flameK = left[i] < 0.4 * life ? Math.max(0.15, left[i] / (0.4 * life)) : 1;
            if (left[i] <= 0) b.light(false);
          }
        });
        if (!solved && braziers.every((b) => b.lit)) {
          solved = true;
          ctx.sfx('piece');
        }
        want = solved ? 1 : 0;
        door.lampMats.forEach((m, i) => m.color.setHex(solved || braziers[i]?.lit ? 0xff7a2e : LAMP_OFF));
      }
      // a PLACA DA PORTA (fora da regra `commit`): a sala resolvida só abre a porta quando o Peso afunda a placa; depois ela fica aberta
      if (PL && rule.kind !== 'commit') {
        const pressed = ctx.die.state === 'rest' && ctx.die.face === 2 && onPlate();
        if (pressed && !plateDown) ctx.sfx('plate');
        plateDown = pressed;
        if (pressed && solved) plateOpen = true;
        if (!plateOpen) want = 0;
      }
      braziers.forEach((b) => b.update(t));
      {
        const nLit = braziers.filter((b) => b.lit).length;
        if (nLit > prevLit) flash = 1;
        prevLit = nLit;
        flash = Math.max(0, flash - dt / 1.3);
        const open = doorOpen > 0.5;
        // a Casa "lê" a frase quando a porta abre: as palavras acendem uma a uma, da esquerda para a direita
        readT = open ? readT + dt : 0;
        ins.panels.forEach((p, k) => {
          if (open && readT > 0.15 + k * 0.4 && p.id) p.fire = Math.max(p.fire ?? 0, Math.min(1, (readT - (0.15 + k * 0.4)) * 4));
        });
        const anyLine = litLines.some((l) => l.lit);
        glow('acender', nLit > 0 || anyLine ? 1 : 0, dt);
        glow('brasa', Math.max(flash, open ? 0.6 : 0), dt);
        glow('conf', spec.lock ? (anyLine ? 1 : 0) : open ? 1 : 0, dt);
        const dying = braziers.some((b) => b.lit && b.flameK < 1);
        glow('tempo', dying ? 0.55 + 0.45 * Math.sin(t * 7) : nLit > 0 ? 0.35 : 0, dt);
        glow('verdade', anyLine ? 1 : 0, dt);
        for (const p of ins.panels) {
          if (!p.id) continue;
          let bi = spec.braziers.findIndex((b) => b.mark === p.id);
          // PEQUENO é o apelido do braseiro de menor tamanho
          if (bi < 0 && p.id === 'pequeno') bi = spec.braziers.reduce((m, b, k) => ((b.scale ?? 1) < (spec.braziers[m].scale ?? 1) ? k : m), 0);
          if (bi >= 0 && !/^n\d$/.test(p.id)) {
            glow(p.id, open ? 1 : braziers[bi].lit ? 1 : 0, dt);
            continue;
          }
          if (!/^n\d$/.test(p.id)) continue;
          // com rótulos nos pedestais: o número brilha com o braseiro dele; senão, enche com a contagem de acesos
          glow(p.id, open ? 1 : bi >= 0 ? (braziers[bi].lit ? 1 : 0) : Math.min(1, nLit / Number(p.id.slice(1))), dt);
        }
      }
      if (rule.kind === 'exact') door.lampMats[0].color.setHex(want ? 0xff7a2e : LAMP_OFF);
      if (want && !prevWant) ctx.sfx('door');
      else if (!want && prevWant && doorOpen > 0.15) ctx.sfx('doorClose');
      prevWant = want;
      doorOpen += (want - doorOpen) * Math.min(1, dt * 2.4);
      door.setOpen(doorOpen);
    },
    // salvamento: a sala já resolvida (ao carregar um jogo, as salas de trás voltam abertas; a porta abre sem som)
    skip() {
      solved = true;
      plateOpen = true;
      readT = 99;
      prevWant = 1;
      doorOpen = 1;
      // os pilares que sobem do chão já estão em cima, e as peças da sala (grades) também (§67)
      risen = true;
      riseK = 1;
      applyRise();
      // (julgada na porta) as frases certas e a da porta ficam acesas, como ficaram quando a Casa aceitou
      if (judgeDoor)
        litLines.forEach((l) => {
          l.lit = l.preLit || l.good || l.door;
          l.burn.set(l.lit, true);
        });
      extra.skip?.();
    },
    isSolved: () => solved,
    reset,
    dispose() {},
  };
}
