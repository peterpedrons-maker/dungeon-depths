// SALA · A CHAMA CURTA (nível 4; PUZZLES_PROPOSTAS.md §5 sala 6, verificador tools/verify_chama_curta.mjs).
// "O fogo que espera". As chamas se apagam sozinhas e o tamanho do braseiro diz quanto duram. A porta abre (para sempre) quando os QUATRO
// estão acesos AO MESMO TEMPO. A virada: uma canaleta longa e enrolada no chão (um "labirinto" talhado) é um PAVIO: o fogo leva segundos
// para atravessá-la e acende, sozinho e longe, o mínimo do fundo. Há DOIS labirintos; só o do MÉDIO corre para o mínimo (as setinhas
// talhadas dizem para onde o óleo corre, como na sala 4); o outro, perto do grande, corre ao contrário (do mínimo para o grande).
//  · Antecâmara: um braseiro pequeno ao lado de um portão de grade. O portão SOBE enquanto a chama está viva (~4 s) e desce quando ela apaga.
//  · Solução: acender o GRANDE e o MÉDIO; voltar até o MÍNIMO DA ENTRADA e esperar; quando o mínimo do fundo pegar fogo sozinho (pelo pavio),
//    acender o mínimo da entrada. (Também: médio → grande → mínimo da entrada, e médio → mínimo da entrada → grande, apertado.)

import * as THREE from 'three';
import { Kit, lambert, LAMP_OFF } from '../kit';
import { makeBrazier, type Brazier } from '../brazier';
import { makeFuse, serpentine } from '../firegrid';
import { mkBox, roomShell } from './shell';
import type { Ctx, Room } from '../types';

// s = distância da entrada da sala (como no verificador); z = 2 - s
const zs = (s: number) => 2 - s;
const B = {
  G: { x: -3, s: 13, dura: 25, scale: 1.4 },
  M: { x: 3, s: 26, dura: 12, scale: 1.0 },
  P1: { x: 3, s: 8, dura: 2.5, scale: 0.5 },
  P2: { x: -2, s: 27, dura: 2.5, scale: 0.5 },
};
const PAVIO_S = 6.5; // médio → mínimo do fundo
const FALSO_S = 7; // mínimo do fundo → grande (o labirinto de setinhas ao contrário)
const GATE_Z = zs(7);
const GATE_BURN = 4;

export function buildChamaCurta(ctx: Ctx): Room {
  const kit = new Kit('ruin');
  const S = roomShell(kit, { hx: 5, z0: zs(29.5), h: 3.8, lamps: 4 });
  const { X0, X1, Z0, Z1, H } = S;

  // colunas em zigue-zague na galeria (fora dos labirintos)
  S.pillar(1.6, zs(12), 0.8);
  S.pillar(-0.6, zs(19.5), 0.8);
  S.pillar(2.6, zs(16.5), 0.8);

  // ── os quatro braseiros da galeria ──
  const keys = ['G', 'M', 'P1', 'P2'] as const;
  const braz: Brazier[] = keys.map((k) => makeBrazier(kit, ctx, B[k].x, zs(B[k].s), false, B[k].scale));
  for (const b of braz) S.boxes.push(...b.boxes);
  const left = [0, 0, 0, 0]; // segundos de chama que faltam
  const life = keys.map((k) => B[k].dura);

  // ── os dois labirintos ──
  // o de verdade: do médio ao mínimo do fundo (as setinhas apontam para o mínimo)
  const zM = zs(B.M.s);
  const zP2 = zs(B.P2.s);
  const real = makeFuse(kit, serpentine([B.M.x - 0.45, zM + 0.1], [B.P2.x + 0.35, zP2 + 0.05], -0.9, 2.2, [zM + 1.5, zM + 0.8, zM + 0.1, zM - 0.6, zM - 1.3, zM - 2.0]));
  // o falso: do mínimo do fundo ao grande (as setinhas apontam para o GRANDE: acender o grande não leva fogo a lugar nenhum)
  const zG = zs(B.G.s);
  const fake = makeFuse(kit, [
    [B.P2.x - 0.35, zP2 + 0.15],
    [-4.2, zP2 + 0.8],
    [-4.2, zG - 5.5],
    ...serpentine([-4.2, zG - 4.9], [B.G.x + 0.2, zG - 0.75], -4.3, -1.9, [zG - 4.9, zG - 4.2, zG - 3.5, zG - 2.8, zG - 2.1, zG - 1.4]).slice(1),
  ]);
  let realK = -1; // -1 = parado; 0..1 = correndo; o fogo, uma vez no óleo, vai até o fim
  let fakeK = -1;

  // ── a antecâmara: o braseiro pequeno e o portão de grade (um de cada lado do portão, para dar para voltar) ──
  const gb = [makeBrazier(kit, ctx, -3.6, GATE_Z + 1.2, false, 0.5), makeBrazier(kit, ctx, -3.6, GATE_Z - 1.2, false, 0.5)];
  for (const b of gb) S.boxes.push(...b.boxes);
  let gateLeft = 0;
  let gateK = 0;
  const grate = new THREE.Group();
  kit.group.add(grate);
  const iron = lambert(null, 0x2a2a30);
  for (let x = X0 + 0.15; x < X1; x += 0.28) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, H, 0.05), iron);
    b.position.set(x, H / 2, GATE_Z);
    grate.add(b);
  }
  for (const y of [0.35, 1.4, 2.5, 3.5]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0, 0.07, 0.08), iron);
    b.position.set(0, y, GATE_Z);
    grate.add(b);
  }
  const gateBox = mkBox(X0, 0, GATE_Z - 0.1, X1, H, GATE_Z + 0.1);
  S.boxes.push(gateBox);

  // ── a frase da porta: «ACENDER QUATRO BRASEIRO TEMPO» ──
  const sign = kit.inscribe({ words: ['acender', 'n4', 'brasa', 'tempo'], x: -(5 + 1.25) / 2, y: 1.6, z: Z0 + 0.025, nx: 0, nz: 1, size: 0.34, age: 0.25, seed: 9, lead: true });
  const glow = (id: string, target: number, dt: number) => {
    for (const p of sign.panels) if (p.id === id) p.fire = (p.fire ?? 0) + (target - (p.fire ?? 0)) * Math.min(1, dt * 6);
  };

  // luz: a galeria é escura (tochas espaçadas); a antecâmara tem uma
  kit.torch(X1 - 0.1, 1.8, 0.2, -1, 0, 0.6);
  kit.torch(X0 + 0.1, 1.8, zs(10), 1, 0, 1.4);
  kit.torch(X1 - 0.1, 1.8, zs(20), -1, 0, 2.2);
  kit.torch(X0 + 0.1, 1.8, zs(23), 1, 0, 3.1);
  S.decorate();

  let solved = false;
  let doorOpen = 0;
  let prevWant = 0;
  let readT = 0;
  const light = (i: number, quiet: boolean) => {
    braz[i].light(true, quiet);
    left[i] = life[i];
    if (keys[i] === 'M') realK = 0; // o fogo entra no labirinto do médio
    if (keys[i] === 'P2') fakeK = 0; // e o do mínimo do fundo corre (ao contrário) para o grande
  };

  const reset = () => {
    braz.forEach((b) => b.light(false, true));
    gb.forEach((b) => b.light(false, true));
    left.fill(0);
    realK = fakeK = -1;
    real.set(0);
    fake.set(0);
    gateLeft = 0;
    gateK = 0;
    solved = false;
    doorOpen = 0;
    prevWant = 0;
    readT = 0;
    S.door.setOpen(0);
    S.door.lampMats.forEach((m) => m.color.setHex(LAMP_OFF));
    for (const p of sign.panels) p.fire = 0;
  };

  if (import.meta.env.DEV) {
    ((globalThis as Record<string, unknown>).__chama = () => ({ lit: braz.map((b) => b.lit), left: left.map((v) => +v.toFixed(1)), real: +realK.toFixed(2), fake: +fakeK.toFixed(2), gate: +gateK.toFixed(2), solved, bowls: braz.map((b) => b.bowl.toArray()), gb: gb.map((b) => b.bowl.toArray()) }));
  }
  kit.bake();

  return {
    name: 'A Chama Curta',
    subtitle: 'Quatro braseiros. O tempo manda.',
    group: kit.group,
    surfaces: kit.surfaces,
    emitters: kit.emitters,
    inscriptions: kit.inscriptions,
    doorZ: Z0,
    entranceZ: Z1,
    start: new THREE.Vector3(0, 0, 1.2),
    startYaw: 0,
    fog: { color: '#0a0a11', near: 5, far: 30 },
    ambient: { color: 0x6e6ca8, intensity: 1.55 },
    boxes: [...S.boxes, ...kit.boxes],
    sockets: [...braz, ...gb].map((b) => b.socket),
    rects() {
      const r = S.rects(doorOpen);
      r.push(...braz.map((b) => b.rect), ...gb.map((b) => b.rect));
      if (gateK < 0.75) r.push([X0 - 1, GATE_Z - 0.12, X1 + 1, GATE_Z + 0.12]);
      return r;
    },
    clampDie: S.clampDie,
    groundY: () => 0,
    surfaceAt: (x, z) => kit.surfaceAt(x, z),
    dieFloor: () => 0,
    holdsDie: () => false,
    update(dt, t) {
      kit.tick(dt, t);
      const run = ctx.paused() ? 0 : dt; // o tempo espera durante cenas, conversa e diário
      // a antecâmara: o portão fica aberto enquanto um dos braseiros pequenos arde
      for (const b of gb) {
        if (b.touched()) {
          b.light(true);
          gateLeft = GATE_BURN;
        }
        b.update(t);
      }
      if (gateLeft > 0) {
        gateLeft -= run;
        gb.forEach((b) => (b.flameK = b.lit ? Math.max(0.2, Math.min(1, gateLeft / 1.6)) : 1));
        if (gateLeft <= 0) gb.forEach((b) => b.light(false));
      }
      gateK += ((gateLeft > 0 ? 1 : 0) - gateK) * Math.min(1, dt * 3);
      grate.position.y = gateK * (H - 0.3);
      gateBox.min.y = gateK * (H - 0.3);

      // a galeria
      braz.forEach((b, i) => {
        if (!solved && b.touched()) light(i, false);
        if (b.lit && !solved) {
          left[i] -= run;
          b.flameK = left[i] < 0.4 * life[i] ? Math.max(0.15, left[i] / (0.4 * life[i])) : 1;
          if (left[i] <= 0) b.light(false);
        }
        b.update(t);
      });
      // os pavios
      if (realK >= 0 && realK < 1) {
        realK = Math.min(1, realK + run / PAVIO_S);
        real.set(realK);
        if (realK >= 1 && !solved) {
          light(3, true);
          ctx.sfx('spread');
        }
      }
      if (fakeK >= 0 && fakeK < 1) {
        fakeK = Math.min(1, fakeK + run / FALSO_S);
        fake.set(fakeK);
        if (fakeK >= 1 && !solved && !braz[0].lit) {
          light(0, true);
          ctx.sfx('spread');
        }
      }
      if (!solved && braz.every((b) => b.lit)) {
        solved = true;
        ctx.sfx('piece');
      }
      S.door.lampMats.forEach((m, i) => m.color.setHex(solved || braz[i]?.lit ? 0xff7a2e : LAMP_OFF));
      // a frase reage: ACENDER com fogo, QUATRO enche com a contagem, TEMPO pulsa quando uma chama está acabando
      const nLit = braz.filter((b) => b.lit).length;
      const dying = braz.some((b) => b.lit && b.flameK < 1) || (gateLeft > 0 && gateLeft < 1.6);
      readT = doorOpen > 0.5 ? readT + dt : 0;
      glow('acender', nLit > 0 || gateLeft > 0 ? 1 : 0, dt);
      glow('n4', solved ? 1 : nLit / 4, dt);
      glow('brasa', solved ? 0.8 : 0, dt);
      glow('tempo', solved ? 1 : dying ? 0.55 + 0.45 * Math.sin(t * 7) : 0, dt);
      const want = solved ? 1 : 0;
      if (want && !prevWant) ctx.sfx('door');
      prevWant = want;
      doorOpen += (want - doorOpen) * Math.min(1, dt * 2.4);
      S.door.setOpen(doorOpen);
      void readT;
    },
    reset,
    dispose() {},
  };
}
