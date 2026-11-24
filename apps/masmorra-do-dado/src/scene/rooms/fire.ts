// Construtor de salas de FOGO guiado por dados. Uma sala de braseiros vira uma descrição curta (FireSpec):
// tamanho, tema, onde ficam os braseiros, a regra do puzzle e a frase talhada na parede. O construtor monta
// o resto (paredes, porta, luz, colisão, inscrição, rótulos nos pedestais).
// Salas especiais (com lógica própria) continuam sendo módulos escritos à mão.

import * as THREE from 'three';
import { floorTexture } from '../textures';
import { ARCH_TOP, buildDoor, buildEntrance, Kit, lambert, LAMP_OFF, T } from '../kit';
import { makeBrazier, type Brazier } from '../brazier';
import { glyphsOf } from '../../story/lexicon';
import type { Box, Ctx, Room } from '../types';

// ── a regra que abre a porta ──
export type FireRule =
  // exatamente n braseiros acesos ao mesmo tempo; com mais do que isso a Casa apaga todos
  | { kind: 'exact'; n: number }
  // acender na ordem certa (índices dos braseiros em `braziers`); um fora de ordem apaga todos
  | { kind: 'order'; seq: number[] }
  // todos acesos AO MESMO TEMPO, num instante qualquer (então a porta abre para sempre). Só faz sentido com `burn`:
  // as chamas se apagam sozinhas, e quem dura menos tem que ser aceso por último
  | { kind: 'together' }
  // ordem SECRETA: o jogador acende todos, em qualquer ordem, e a Casa "confirma" quantos estavam na posição certa
  // (as gemas do arco mostram só a CONTAGEM, não quais). Depois apaga tudo para uma nova tentativa. `seq` = índices na ordem certa.
  | { kind: 'secret'; seq: number[] };

export interface FireBrazier {
  x: number; // a partir do centro da sala
  dz: number; // distância da parede do fundo (para a frente)
  mark?: string; // símbolo talhado no pedestal (id do léxico)
  lit?: boolean; // já começa aceso
  scale?: number; // tamanho do braseiro (maior = chama que dura mais, quando a sala usa `burn`)
  burn?: number; // segundos que a chama dura (sem isso, fica acesa)
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
  kit.plane(L, H, kit.brick([L / T, H / T], 0.95, 33), X0, H / 2, zm, 0, Math.PI / 2);
  kit.plane(L, H, kit.brick([L / T, H / T], 0.95, 39), X1, H / 2, zm, 0, -Math.PI / 2);

  const steps = spec.rule.kind === 'order' ? spec.rule.seq.length : spec.rule.kind === 'together' || spec.rule.kind === 'secret' ? spec.braziers.length : 1;
  const door = buildDoor(kit, { x0: X0, x1: X1, z0: Z0, h: H, lamps: Math.min(4, steps), connected: true, theme });

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
    if (b.mark) kit.inscribe({ words: [b.mark], x: b.x, y: 0.45, z: Z0 + b.dz + 0.305, nx: 0, nz: 1, size: 0.5, age: 0.12, frame: true, seed: 21 + Math.round(b.x * 7) });
  });

  // decoração
  kit.damp(X0, 1.0, Z0 + L * 0.4, 1, 0, 1.9);
  kit.damp(X1, 2.2, Z0 + L * 0.3, -1, 0, 1.5);
  kit.skirting(X0, X1, Z0, Z1, 1.3);
  kit.aoSides(X0, X1, Z0, Z1, H);
  kit.cornice(X0, X1, Z0, Z1, H);
  kit.torch(X0 + 0.1, 1.8, -1.2, 1, 0, 0.7);
  kit.torch(X1 - 0.1, 1.8, -1.2, -1, 0, 2.4);
  kit.torch(X1 - 0.9, 1.8, Z0 + 0.1, 0, 1, 4.1);
  // salas compridas: tochas espaçadas nas paredes, alternando os lados, para dar para ver o caminho
  for (let z = -7, k = 0; z > Z0 + 3; z -= 7, k++) {
    if (k % 2 === 0) kit.torch(X1 - 0.1, 1.8, z, -1, 0, 1.3 + k);
    else kit.torch(X0 + 0.1, 1.8, z, 1, 0, 3.1 + k);
  }
  kit.dust(X0, X1, Z0, Z1, 0, H);

  boxes.push(mkBox(-1.25, 0, Z0, -0.95, ARCH_TOP, Z0 + 0.3), mkBox(0.95, 0, Z0, 1.25, ARCH_TOP, Z0 + 0.3), mkBox(-1.25, ARCH_TOP - 0.3, Z0, 1.25, H, Z0 + 0.3));
  braziers.forEach((b) => boxes.push(...b.boxes));

  // ── a regra ──
  let doorOpen = 0;
  let prevWant = 0;
  let progress = 0; // (order) quantos já foram acesos na ordem certa
  let failT = -1; // (order) contagem para apagar tudo depois de um erro
  let tries: number[] = []; // (secret) braseiros na ordem em que o jogador os acendeu nesta tentativa
  let shown = -1; // (secret) quanto tempo a Casa ainda mostra a contagem de acertos
  let lastCount = 0;
  let overlit = 0; // (exact) tempo com braseiros demais
  const left = spec.braziers.map(() => Infinity); // quanto falta para cada chama se apagar
  let solved = false;

  const reset = () => {
    braziers.forEach((b, i) => b.light(!!spec.braziers[i].lit, true));
    progress = 0;
    failT = -1;
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

  if (import.meta.env.DEV) (globalThis as Record<string, unknown>).__fire = () => ({ lit: braziers.map((b) => b.lit), left: left.map((v) => (Number.isFinite(v) ? +v.toFixed(1) : null)), solved, tries, count: lastCount });
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
    holdsDie: () => false,
    update(dt, t) {
      kit.tick(dt, t);
      const rule = spec.rule;
      let want = 0;
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
            door.lampMats.forEach((m) => m.color.setHex(LAMP_OFF));
          }
        } else if (!solved) {
          braziers.forEach((b, i) => {
            if (!b.touched()) return;
            b.light(true);
            if (i === rule.seq[progress]) {
              door.lampMats[Math.min(progress, door.lampMats.length - 1)].color.setHex(0xff7a2e);
              progress++;
              if (progress >= rule.seq.length) solved = true;
            } else failT = 1.3;
          });
        }
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
