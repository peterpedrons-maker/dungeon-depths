// Construtor de salas de FOGO guiado por dados. Uma sala de braseiros vira uma descrição curta (FireSpec):
// tamanho, tema, onde ficam os braseiros, a regra do puzzle e a frase talhada na parede. O construtor monta
// o resto (paredes, porta, luz, colisão, inscrição, rótulos nos pedestais).
// Salas especiais (com lógica própria) continuam sendo módulos escritos à mão.

import * as THREE from 'three';
import { floorTexture, plateTexture } from '../textures';
import { ARCH_TOP, buildDoor, buildEntrance, Kit, lambert, LAMP_OFF, T } from '../kit';
import { makeBrazier, type Brazier } from '../brazier';
import { glyphsOf } from '../../story/lexicon';
import type { Box, Ctx, Room } from '../types';

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
}

// uma linha de um parágrafo (uma frase completa, que termina numa marca: CONFIRMADO, BOATO...)
export interface FireLine {
  words: string[];
  worn?: boolean; // gasta (boato)
  rub?: boolean; // lisa: só aparece esfregando o giz
}

// uma frase talhada na parede, num ponto escolhido. Com `lines`, vira um PARÁGRAFO: frases completas, uma embaixo da outra, alinhadas à
// esquerda, lidas de cima para baixo, dentro de uma moldura só.
export interface FireTablet {
  words?: string[];
  lines?: FireLine[]; // parágrafo (só nas paredes 'left' e 'right')
  wall: 'left' | 'right' | 'backL' | 'backR'; // esquerda, direita, fundo à esquerda ou à direita da porta
  dz?: number; // posição ao longo da parede (distância do fundo); ignorado no fundo
  seal?: boolean; // moldura talhada (frase confirmada)
  worn?: boolean; // muito gasta (boato)
  age?: number; // desgaste (0 nítida .. 1 muito gasta); padrão: 0.18, ou 0.75 se `worn`
  rub?: boolean; // lisa: só aparece ESFREGANDO o giz em cima (o jogador revela a pista)
  size?: number;
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
  fog?: { color: string; near: number; far: number };
  ambient?: { color: number; intensity: number };
}

const Z1 = 2;
const mkBox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box => ({
  min: new THREE.Vector3(x0, y0, z0),
  max: new THREE.Vector3(x1, y1, z1),
});

// largura de uma frase em unidades de "altura de símbolo" (cada símbolo ≈ 1,29; espaço entre palavras ≈ 0,55)
const phraseUnits = (words: string[]) => words.reduce((n, w) => n + 1.29 * Math.max(1, glyphsOf(w).length), 0) + 0.55 * (words.length - 1);

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
  const units = phraseUnits(spec.words);
  const avail = sign === 'back' ? spec.hx - 1.5 : L - 3;
  const size = Math.min(0.5, avail / units);
  const ins =
    sign === 'back'
      ? kit.inscribe({ words: spec.words, x: -(spec.hx + 1.25) / 2, y: 1.6, z: Z0 + 0.025, nx: 0, nz: 1, size, age: 0.3, seed: 9 })
      : sign === 'left'
        ? kit.inscribe({ words: spec.words, x: X0 + 0.025, y: 1.6, z: Z0 + L / 2 - 0.5, nx: 1, nz: 0, size, age: 0.3, seed: 9 })
        : kit.inscribe({ words: spec.words, x: X1 - 0.025, y: 1.6, z: Z0 + L / 2 - 0.5, nx: -1, nz: 0, size, age: 0.3, seed: 9 });

  void ins; // (a frase fica registrada em kit.inscriptions)

  // braseiros e os símbolos nos pedestais
  const braziers: Brazier[] = spec.braziers.map((b) => makeBrazier(kit, ctx, b.x, Z0 + b.dz, !!b.lit, b.scale ?? 1));
  spec.braziers.forEach((b) => {
    if (b.mark) {
      const sc = b.scale ?? 1;
      kit.inscribe({ words: [b.mark], x: b.x, y: 0.45 * sc, z: Z0 + b.dz + 0.305 * sc, nx: 0, nz: 1, size: 0.5 * Math.min(1, sc), age: 0.12, frame: true, seed: 21 + Math.round(b.x * 7) });
    }
  });

  // frases na parede (rumores, leis...)
  const rubs: { ins: ReturnType<typeof kit.inscribe>; wall: THREE.Mesh; v: number[] }[] = [];
  // tochas das paredes laterais: nunca duas muito perto uma da outra (a lista guarda onde já há uma)
  const wallTz: Record<'left' | 'right', number[]> = { left: [], right: [] };
  const wallTorch = (side: 'left' | 'right', z: number, y: number, phase: number, minGap = 3.2) => {
    if (wallTz[side].some((q) => Math.abs(q - z) < minGap)) return;
    wallTz[side].push(z);
    if (side === 'left') kit.torch(X0 + 0.1, y, z, 1, 0, phase);
    else kit.torch(X1 - 0.1, y, z, -1, 0, phase);
  };
  const blocks: Record<'left' | 'right', [number, number][]> = { left: [], right: [] }; // onde ficam os parágrafos (z de cada ponta)
  // largura exata de uma frase (m): cada símbolo ocupa (n + 0,29) alturas, e o espaço entre palavras é 0,55
  const lineW = (words: string[], sz: number) => words.reduce((a, w) => a + (Math.max(1, glyphsOf(w).length) + 0.2917) * sz, 0) + 0.55 * sz * (words.length - 1);
  (spec.tablets ?? []).forEach((t, i) => {
    if (t.lines && (t.wall === 'left' || t.wall === 'right')) {
      // ── parágrafo: linhas alinhadas à esquerda, de cima para baixo ──
      const sz = t.size ?? 0.4;
      const lh = sz * 1.55; // altura de uma linha
      const n = t.lines.length;
      const Wb = Math.max(...t.lines.map((l) => lineW(l.words, sz)));
      const yc = 1.85;
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
      return;
    }
    const words = t.words ?? [];
    const tu = phraseUnits(words);
    const sz = t.size ?? 0.36;
    const common = { words, size: sz, age: t.age ?? (t.worn ? 0.75 : 0.18), seed: 40 + i * 13, plaque: !!t.seal, y: 1.85 } as const;
    let tIns;
    if (t.wall === 'left') tIns = kit.inscribe({ ...common, x: X0 + 0.025, z: Z0 + (t.dz ?? 8), nx: 1, nz: 0 });
    else if (t.wall === 'right') tIns = kit.inscribe({ ...common, x: X1 - 0.025, z: Z0 + (t.dz ?? 8), nx: -1, nz: 0 });
    else tIns = kit.inscribe({ ...common, x: (t.wall === 'backL' ? -1 : 1) * (spec.hx + 1.25) / 2, y: 1.6, size: Math.min(sz, (spec.hx - 1.5) / tu), z: Z0 + 0.025, nx: 0, nz: 1 });
    if (t.rub && (t.wall === 'left' || t.wall === 'right')) {
      // tablete liso: as palavras só aparecem onde o jogador esfrega o giz (a moldura fica visível, o texto não)
      tIns.panels.forEach((_, k) => tIns.setReveal(k, 0));
      tIns.hidden = true; // enquanto estiver liso, olhar para ele não manda símbolos ao diário
      rubs.push({ ins: tIns, wall: t.wall === 'left' ? wallL : wallR, v: tIns.panels.map(() => 0) });
    }
  });

  // tochas para dar para ler os parágrafos: uma em cada ponta, e UMA SÓ entre dois parágrafos vizinhos (nunca duas coladas)
  for (const side of ['left', 'right'] as const) {
    const bl = blocks[side].sort((m, n) => m[0] - n[0]);
    bl.forEach(([z0b, z1b], i) => {
      if (i === 0) wallTorch(side, z0b - 0.6, 1.9, 0.9 + i, 0);
      const next = bl[i + 1];
      if (next) {
        if (next[0] - z1b > 0.9) wallTorch(side, (z1b + next[0]) / 2, 1.9, 1.7 + i, 0);
      } else wallTorch(side, z1b + 0.6, 1.9, 2.3 + i, 0);
    });
    // frases soltas (sem parágrafo): uma tocha entre cada duas
    const dzs = (spec.tablets ?? []).filter((t) => t.wall === side && !t.lines).map((t) => t.dz ?? 8).sort((m, n) => m - n);
    for (let i = 1; i < dzs.length; i++) wallTorch(side, Z0 + (dzs[i - 1] + dzs[i]) / 2, 1.9, 0.9 + i);
  }

  // decoração
  kit.damp(X0, 1.0, Z0 + L * 0.4, 1, 0, 1.9);
  kit.damp(X1, 2.2, Z0 + L * 0.3, -1, 0, 1.5);
  kit.skirting(X0, X1, Z0, Z1, 1.3);
  kit.aoSides(X0, X1, Z0, Z1, H);
  kit.cornice(X0, X1, Z0, Z1, H);
  wallTorch('left', -1.2, 1.8, 0.7);
  wallTorch('right', -1.2, 1.8, 2.4);
  kit.torch(X1 - 0.9, 1.8, Z0 + 0.1, 0, 1, 4.1);
  // salas compridas: tochas espaçadas nas paredes, alternando os lados, para dar para ver o caminho
  for (let z = -7, k = 0; z > Z0 + 3; z -= 7, k++) {
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

  const reset = () => {
    plateDown = false;
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

  if (import.meta.env.DEV) (globalThis as Record<string, unknown>).__fire = () => ({ lit: braziers.map((b) => b.lit), left: left.map((v) => (Number.isFinite(v) ? +v.toFixed(1) : null)), solved, tries, count: lastCount, progress, cold: +coldT.toFixed(1), plate: plateDown, rub: rubs.map((r) => r.v.map((x) => +x.toFixed(2))) });
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
      const r: ReturnType<Room['rects']> = [...rects, ...braziers.map((b) => b.rect), ...kit.rects, ...entrance.rects()];
      r.push([X0 - 2, Z0, X0, Z1 + 0.5], [X1, Z0, X1 + 2, Z1 + 0.5]);
      r.push(...door.rects(doorOpen > 0.85));
      return r;
    },
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
