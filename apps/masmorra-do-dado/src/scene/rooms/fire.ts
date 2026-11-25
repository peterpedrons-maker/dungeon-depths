// Construtor de salas de FOGO guiado por dados. Uma sala de braseiros vira uma descrição curta (FireSpec):
// tamanho, tema, onde ficam os braseiros, a regra do puzzle e a frase talhada na parede. O construtor monta
// o resto (paredes, porta, luz, colisão, inscrição, rótulos nos pedestais).
// Salas especiais (com lógica própria) continuam sendo módulos escritos à mão.

import * as THREE from 'three';
import { floorTexture, plateTexture } from '../textures';
import { ARCH_TOP, buildDoor, buildEntrance, Kit, lambert, LAMP_OFF, T } from '../kit';
import { makeBrazier, type Brazier } from '../brazier';
import { glyphsOf } from '../../story/lexicon';
import { drawGlyph } from '../../book/font';
import { shotGate } from './shell';
import type { Inscription } from '../inscription';
import type { Box, Ctx, Interactable, Rect, Room } from '../types';

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
  | { kind: 'commit'; lit: number[]; penalty?: number };

export interface FireBrazier {
  x: number; // a partir do centro da sala
  dz: number; // distância da parede do fundo (para a frente)
  mark?: string; // símbolo talhado no pedestal (id do léxico)
  lit?: boolean; // já começa aceso
  scale?: number; // tamanho do braseiro (maior = chama que dura mais, quando a sala usa `burn`)
  burn?: number; // segundos que a chama dura (sem isso, fica acesa)
  hidden?: boolean; // pilar escondido sob o chão: só sobe quando a trava (`FireSpec.lock`) é resolvida
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
}
export interface FireExtra {
  update?(dt: number, t: number): void;
  reset?(): void;
  bonus?(): boolean;
  rects?(): Rect[];
  interactables?: Interactable[];
}

export interface FireSpec {
  name: string; // sem o "Sala N ·": a numeração é automática
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
  tablets?: FireTablet[]; // frases na parede (rumores, leis...)
  plate?: { x: number; dz: number }; // placa de pressão (regra `commit`): só o Peso a afunda
  // TRAVA DE ESCRITA: antes do puzzle de braseiros, o jogador passa o dado de Fogo pelas FRASES da parede (tablete `lit`). Acender as certas faz os pilares
  // `hidden` subirem do chão (puzzle liberado). Acender uma errada apaga todas as frases acesas e a Casa recusa o fogo por `penalty` segundos.
  // `ordered`: as frases com `ord` têm de ser acesas nessa ordem; senão (padrão) basta acender todas as `good`, em qualquer ordem.
  // `judge: 'door'`: acender ou apagar frases não pune; a Casa só JULGA quando o jogador acende a frase da porta (o conjunto aceso tem de ser
  // exatamente as `good`). Tocar de novo numa frase acesa a apaga (para desfazer um engano).
  lock?: { ordered?: boolean; penalty?: number; judge?: 'door' };
  cloths?: FireCloth[];
  torches?: 'all' | 'few'; // 'few' = só as tochas da entrada e a da porta (salas de constelação: as tochas que contam são as que o jogador acende)
  extra?: (api: FireExtraApi) => FireExtra;
  fog?: { color: string; near: number; far: number };
  ambient?: { color: number; intensity: number };
}

// brasa fraca (um pontinho laranja) para o soquete das frases acendíveis
let emberTex: THREE.CanvasTexture | null = null;
function emberTexture() {
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

  kit.plane(W, L, lambert(floorTexture([W / T, L / T], theme)), 0, 0, zm, -Math.PI / 2);
  kit.plane(W, L, kit.brick([W / T, L / T], 0.65, 19), 0, H, zm, Math.PI / 2);
  const entrance = buildEntrance(kit, { x0: X0, x1: X1, z: Z1, h: H });
  const wallL = kit.plane(L, H, kit.brick([L / T, H / T], 0.95, 33), X0, H / 2, zm, 0, Math.PI / 2);
  const wallR = kit.plane(L, H, kit.brick([L / T, H / T], 0.95, 39), X1, H / 2, zm, 0, -Math.PI / 2);

  const steps = spec.rule.kind === 'commit' ? 1 : spec.rule.kind === 'order' ? spec.rule.seq.length : spec.rule.kind === 'together' || spec.rule.kind === 'secret' ? spec.braziers.length : 1;
  const door = buildDoor(kit, { x0: X0, x1: X1, z0: Z0, h: H, lamps: Math.min(5, steps), connected: true, theme });

  // colunas (também seguram o dado)
  const boxes: Box[] = [];
  const rects: ReturnType<Room['rects']> = [];
  for (const [px, pdz] of spec.pillars ?? []) {
    const pz = Z0 + pdz;
    kit.box(0.9, H, 0.9, kit.brick([0.75, 3], 0.95, 50 + Math.abs(px * pz)), px, H / 2, pz);
    kit.box(1.1, 0.25, 1.1, kit.stone, px, 0.125, pz);
    kit.box(1.1, 0.25, 1.1, kit.stone, px, H - 0.125, pz);
    kit.contact(px, pz, 2.1);
    boxes.push(mkBox(px - 0.45, 0, pz - 0.45, px + 0.45, H, pz + 0.45), mkBox(px - 0.55, 0, pz - 0.55, px + 0.55, 0.25, pz + 0.55), mkBox(px - 0.55, H - 0.25, pz - 0.55, px + 0.55, H, pz + 0.55));
    rects.push([px - 0.55, pz - 0.55, px + 0.55, pz + 0.55]);
  }

  // a frase talhada na parede
  const sign = spec.sign ?? 'back';
  const units = phraseUnits(spec.words) + LEAD_UNITS;
  const avail = sign === 'back' ? spec.hx - 1.5 : L - 3;
  const size = Math.min(0.5, avail / units);
  const ins =
    sign === 'back'
      ? kit.inscribe({ words: spec.words, x: -(spec.hx + 1.25) / 2, y: 1.6, z: Z0 + 0.025, nx: 0, nz: 1, size, age: 0.3, seed: 9, lead: true })
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
    const br = makeBrazier(kit, ctx, b.x, Z0 + b.dz, !!b.lit, b.scale ?? 1);
    let label: ReturnType<typeof kit.inscribe> | undefined;
    if (b.mark) {
      const sc = b.scale ?? 1;
      label = kit.inscribe({ words: [b.mark], x: b.x, y: 0.45 * sc, z: Z0 + b.dz + 0.305 * sc, nx: 0, nz: 1, size: 0.5 * Math.min(1, sc), age: 0.12, frame: true, seed: 21 + Math.round(b.x * 7) });
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
  }
  const litLines: LitLine[] = []
  // largura exata de uma frase (m): cada símbolo ocupa (n + 0,29) alturas, e o espaço entre palavras é 0,55
  const lineW = (words: string[], sz: number) => words.reduce((a, w) => a + (Math.max(1, glyphsOf(w).length) + 0.2917) * sz, 0) + 0.55 * sz * (words.length - 1);
  (spec.tablets ?? []).forEach((t, i) => {
    if (t.lines && (t.wall === 'left' || t.wall === 'right')) {
      // ── parágrafo: linhas alinhadas à esquerda, de cima para baixo ──
      const sz = t.size ?? 0.4;
      const lh = sz * 1.55; // altura de uma linha
      const n = t.lines.length;
      const Wb = Math.max(...t.lines.map((l) => lineW(l.words, sz)));
      const yc = t.y ?? 1.85;
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
          const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
          flame.scale.set(0.5, 0.42, 1);
          const fy = yc + ((n - 1) / 2 - k) * lh;
          flame.position.set(left ? X0 + 0.14 : X1 - 0.14, fy + 0.04, zc + dir * (-Wb / 2 - sz * 0.9));
          flame.visible = false;
          kit.group.add(flame);
          // DICA VISUAL (DESIGN.md §25): um soquete de pedra com uma brasa fraca pulsando no começo da frase diz "isto pode ser aceso"
          const fz = zc + dir * (-Wb / 2 - sz * 0.9);
          kit.box(0.16, 0.3, 0.26, kit.stone, left ? X0 + 0.08 : X1 - 0.08, fy, fz, false);
          const emb = new THREE.Sprite(new THREE.SpriteMaterial({ map: emberTexture(), fog: false, depthWrite: false, transparent: true }));
          emb.scale.set(0.2, 0.2, 1);
          emb.position.set(left ? X0 + 0.19 : X1 - 0.19, fy, fz);
          kit.group.add(emb);
          litLines.push({ ins: li, x: wx, y: fy, z: zc + dir * u, hw: w / 2, good: !!ln.good, ord: ln.ord ?? -1, lit: !!ln.preLit, fire: ln.preLit ? 1 : 0, flame, emb, key: `L${litLines.length}`, preLit: !!ln.preLit, door: false, axis: 'z' });
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
      rect(10, 10, cw - 20, ch - 20, 12, '#15110f');
      rect(10, 10, cw - 20, ch - 20, 5, '#f1ebd9');
      rect(26, 26, cw - 52, ch - 52, 4, '#f1ebd9');
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
      first[0].extras.push(fm); // acompanha o brilho da escrita
      blocks[left ? 'left' : 'right'].push([zc - FW / 2, zc + FW / 2]);
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

  // tochas para dar para ler os parágrafos: uma em cada ponta, e UMA SÓ entre dois parágrafos vizinhos (nunca duas coladas)
  for (const side of fewTorches ? [] : (['left', 'right'] as const)) {
    const ty = blockY[side].length ? Math.max(...blockY[side]) + 0.05 : 1.9;
    const bl = blocks[side].sort((m, n) => m[0] - n[0]);
    bl.forEach(([z0b, z1b], i) => {
      if (i === 0) wallTorch(side, z0b - 0.6, ty, 0.9 + i, 0);
      const next = bl[i + 1];
      if (next) {
        if (next[0] - z1b > 0.9) wallTorch(side, (z1b + next[0]) / 2, ty, 1.7 + i, 0);
      } else wallTorch(side, z1b + 0.6, ty, 2.3 + i, 0);
    });
    // frases soltas (sem parágrafo): uma tocha entre cada duas
    const solo = (spec.tablets ?? []).filter((t) => t.wall === side && !t.lines).sort((m, n) => (m.dz ?? 8) - (n.dz ?? 8));
    for (let i = 1; i < solo.length; i++) wallTorch(side, Z0 + ((solo[i - 1].dz ?? 8) + (solo[i].dz ?? 8)) / 2, (solo[i].y ?? 1.85) + 0.05, 0.9 + i);
  }

  // ── a frase da porta também se acende (trava `judge: 'door'`): é ela que pede o julgamento ──
  if (spec.lock?.judge === 'door' && sign === 'back') {
    const cx = -(spec.hx + 1.25) / 2;
    const hw = (units * size) / 2;
    const fx = cx - hw - size * 0.5;
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
    flame.position.set(fx, 1.64, Z0 + 0.14);
    flame.visible = false;
    kit.group.add(flame);
    kit.box(0.26, 0.3, 0.16, kit.stone, fx, 1.6, Z0 + 0.08, false);
    const emb = new THREE.Sprite(new THREE.SpriteMaterial({ map: emberTexture(), fog: false, depthWrite: false, transparent: true }));
    emb.scale.set(0.2, 0.2, 1);
    emb.position.set(fx, 1.6, Z0 + 0.19);
    kit.group.add(emb);
    litLines.push({ ins, x: cx, y: 1.6, z: Z0 + 0.025, hw, good: false, ord: -1, lit: false, fire: 0, flame, emb, key: 'porta', preLit: false, door: true, axis: 'x' });
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
  kit.damp(X0, 1.0, Z0 + L * 0.4, 1, 0, 1.9);
  kit.damp(X1, 2.2, Z0 + L * 0.3, -1, 0, 1.5);
  kit.skirting(X0, X1, Z0, Z1, 1.3);
  kit.aoSides(X0, X1, Z0, Z1, H);
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
  kit.dust(X0, X1, Z0, Z1, 0, H);

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

  boxes.push(mkBox(-1.25, 0, Z0, -0.95, ARCH_TOP, Z0 + 0.3), mkBox(0.95, 0, Z0, 1.25, ARCH_TOP, Z0 + 0.3), mkBox(-1.25, ARCH_TOP - 0.3, Z0, 1.25, H, Z0 + 0.3));
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

  // peças extras da sala
  const extra: FireExtra = spec.extra
    ? spec.extra({ kit, ctx, X0, X1, Z0, H, boxes, sign: ins, braziers, solved: () => solved, glow })
    : {};

  const reset = () => {
    plateDown = false;
    litLines.forEach((l) => {
      l.lit = l.preLit;
      l.fire = l.preLit ? 1 : 0;
      l.flame.visible = l.preLit;
      l.ins.panels.forEach((p) => (p.fire = l.fire));
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
    const fn = () => ({ lit: braziers.map((b) => b.lit), left: left.map((v) => (Number.isFinite(v) ? +v.toFixed(1) : null)), solved, tries, count: lastCount, progress, cold: +coldT.toFixed(1), plate: plateDown, rise: +riseK.toFixed(2), lockCold: +lockCold.toFixed(1), lines: litLines.map((l) => l.lit), spots: litLines.map((l) => [l.x, l.y, l.z, l.hw]), rub: rubs.map((r) => r.v.map((x) => +x.toFixed(2))) });
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
    start: new THREE.Vector3(0, 0, 1.2),
    startYaw: 0,
    fog: spec.fog ?? { color: '#0a0a11', near: 3.5, far: 18 },
    ambient: spec.ambient ?? { color: 0x706ea8, intensity: 1.6 },
    boxes: [...boxes, ...kit.boxes],
    sockets: braziers.map((b) => b.socket),
    rects() {
      const r: ReturnType<Room['rects']> = [...rects, ...braziers.filter((_, i) => !risers[i] || riseK >= 1).map((b) => b.rect), ...kit.rects, ...entrance.rects()];
      r.push([X0 - 2, Z0, X0, Z1 + 0.5], [X1, Z0, X1 + 2, Z1 + 0.5]);
      r.push(...door.rects(doorOpen > 0.85));
      if (extra.rects) r.push(...extra.rects());
      return r;
    },
    interactables: extra.interactables,
    bonus: extra.bonus,
    clampDie(p, vel, e, R) {
      if (p.y > H - R) {
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
    groundY: () => 0,
    surfaceAt: (x, z) => kit.surfaceAt(x, z),
    dieFloor: () => 0,
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
              const along = Math.abs(l.axis === 'z' ? d.pos.z - l.z : d.pos.x - l.x);
              const across = Math.abs(l.axis === 'z' ? d.pos.x - l.x : d.pos.z - l.z);
              const dy = Math.abs(d.pos.y - l.y);
              if (along < l.hw + 0.45 && dy < 0.4 && across < (l.axis === 'z' ? 1.1 : 0.6) && dy + along * 0.2 < bd) {
                bd = dy + along * 0.2;
                best = l;
              }
            }
            if (best && judgeDoor && !gate.take()) best = null; // um toque por arremesso
            if (best && judgeDoor) {
              if (best.door) {
                // a Casa julga o conjunto aceso
                const chosen = litLines.filter((l) => !l.preLit && !l.door && l.lit);
                const ok = chosen.length === needed && chosen.every((l) => l.good);
                if (ok) {
                  best.lit = true;
                  risen = true;
                  ctx.sfx('ignite', best.key);
                  ctx.sfx('door');
                  ctx.caption('A Casa leu', 'Os pilares de fogo subiram.', '#ffd36b');
                } else {
                  litLines.forEach((l) => (l.lit = l.preLit));
                  lockCold = lk.penalty ?? 10;
                  ctx.sfx('error');
                  ctx.caption('A Casa apagou as frases', 'Nem toda frase acesa era verdade.', '#cfc6e8');
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
                  ctx.sfx('door');
                  ctx.caption('Algo se move sob o chão', 'Os pilares de fogo subiram. O puzzle está liberado.', '#ffd36b');
                } else ctx.caption('A frase acendeu', 'A Casa aceitou esta.', '#ff9a3c');
              } else {
                litLines.forEach((l) => (l.lit = false));
                lockProg = 0;
                lockCold = lk.penalty ?? 4;
                ctx.sfx('error');
                ctx.caption('A Casa apagou as frases', 'Aquela não era a certa. Leia as marcas.', '#cfc6e8');
              }
            }
          }
        }
        if (risen && riseK < 1) riseK = Math.min(1, riseK + dt / 2.2);
        applyRise();
        // rachaduras no chão: brasas fracas pulsando; ao liberar, acendem forte enquanto o pilar sobe e depois só ficam as frestas
        const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
        for (const c of cracks) (c.material as THREE.MeshLambertMaterial).emissiveIntensity = risen ? (riseK < 1 ? 1.8 : 0.25) : 0.35 + 0.45 * pulse;
        for (const l of litLines) {
          // a brasa fraca do soquete pulsa enquanto a frase espera
          l.emb.visible = !risen && l.fire < 0.15 && (!judgeDoor || lockCold <= 0);
          const es = 0.17 + 0.07 * (0.5 + 0.5 * Math.sin(t * 3 + l.z));
          l.emb.scale.set(es, es, 1);
          l.fire += ((l.lit ? 1 : 0) - l.fire) * Math.min(1, dt * 6);
          l.ins.panels.forEach((p) => (p.fire = l.fire));
          l.flame.visible = l.fire > 0.05;
          if (l.flame.visible) {
            l.flame.material.map = kit.frames[Math.floor(t * 8 + l.z) % kit.frames.length];
            l.flame.scale.set(0.5 * l.fire, 0.42 * l.fire, 1);
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
              f.material.map = kit.frames[Math.floor(t * 10 + k * 2) % kit.frames.length];
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
        want = nLit === rule.n ? 1 : 0;
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
              if (progress >= rule.seq.length) {
                solved = true;
                door.lampMats.forEach((m) => m.color.setHex(0xff7a2e));
                ctx.sfx('piece');
              }
            } else failT = 1.3;
          });
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
    reset,
    dispose() {},
  };
}
