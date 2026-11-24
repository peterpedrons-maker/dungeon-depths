// O Vestíbulo dos Números: salas pequenas e ruinosas que ensinam ACENDER, UM, DOIS e TRÊS sem uma
// palavra de explicação (ver DESIGN.md §9 e PUZZLES.md). O jogador começa SEM NADA nas mãos.
//   1 · O Poço       porta trancada; o dado caído "fala" e vai para a mão; ACENDER · UM · BRASEIRO
//   2 · O Vestíbulo  ACENDER · DOIS · BRASEIRO   três braseiros; só abre com EXATAMENTE dois acesos
//   3 · Os Quatro    ACENDER · TRÊS · BRASEIRO   quatro braseiros; só abre com EXATAMENTE três acesos
//   5 · A Lacuna     ACENDER · ▢ · BRASEIRO      (depois do Escrivão, com o giz) escreva o número que falta
// Cada sala tem um tamanho diferente.

import * as THREE from 'three';
import { floorTexture, brickTexture } from '../textures';
import { ARCH_TOP, buildDoor, buildEntrance, Kit, lambert, LAMP_OFF, T } from '../kit';
import { makeBrazier, type Brazier } from '../brazier';
import { glyphsOf } from '../../story/lexicon';
import type { Box, Ctx, Room } from '../types';

export type VestVariant = 1 | 2 | 3 | 4;

interface Dim {
  hx: number; // meia-largura
  z0: number; // parede do fundo (a da frente é sempre z = 2)
  h: number;
  theme: string;
  name: string;
  subtitle: string;
  fog: { color: string; near: number; far: number };
  ambient: { color: number; intensity: number };
}

// tamanhos bem diferentes: pequena e abafada, um salão comprido, média, baixa e apertada
const DIMS: Record<VestVariant, Dim> = {
  1: { hx: 3.4, z0: -9, h: 3.2, theme: 'ruin', name: 'Sala 1 · O Poço', subtitle: 'A porta não cede. Um braseiro espera.', fog: { color: '#090a11', near: 3, far: 15 }, ambient: { color: 0x6a72a4, intensity: 1.45 } },
  2: { hx: 4.7, z0: -15, h: 3.9, theme: 'ruin', name: 'Sala 2 · O Vestíbulo', subtitle: 'Mais braseiros. A escrita mudou um pouco.', fog: { color: '#0a0a11', near: 3.5, far: 19 }, ambient: { color: 0x706ea8, intensity: 1.6 } },
  3: { hx: 3.7, z0: -11.5, h: 3.4, theme: 'ruin', name: 'Sala 3 · Os Quatro', subtitle: 'Quatro braseiros. Outro número.', fog: { color: '#0a0a11', near: 3.5, far: 17 }, ambient: { color: 0x706ea8, intensity: 1.6 } },
  4: { hx: 3.3, z0: -8, h: 3.0, theme: 'crypt', name: 'Sala 5 · A Lacuna', subtitle: 'Falta uma palavra na frase.', fog: { color: '#0b0912', near: 3.5, far: 15 }, ambient: { color: 0x7a78b8, intensity: 1.7 } },
};

const Z1 = 2;
const mkBox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box => ({
  min: new THREE.Vector3(x0, y0, z0),
  max: new THREE.Vector3(x1, y1, z1),
});

export function buildVestibulo(ctx: Ctx, v: VestVariant): Room {
  const D = DIMS[v];
  const X0 = -D.hx;
  const X1 = D.hx;
  const Z0 = D.z0;
  const H = D.h;
  const kit = new Kit(D.theme);
  const W = X1 - X0;
  const L = Z1 - Z0;
  const zm = (Z0 + Z1) / 2;
  const SHAFT = { x: 0, z: Z0 + 5.4, r: 0.95 };

  kit.plane(W, L, lambert(floorTexture([W / T, L / T], D.theme)), 0, 0, zm, -Math.PI / 2);
  // teto (o primeiro tem o poço)
  if (v === 1) {
    const shape = new THREE.Shape();
    shape.moveTo(X0, Z0 - zm);
    shape.lineTo(X1, Z0 - zm);
    shape.lineTo(X1, Z1 - zm);
    shape.lineTo(X0, Z1 - zm);
    shape.closePath();
    const hole = new THREE.Path();
    hole.absarc(SHAFT.x, SHAFT.z - zm, SHAFT.r, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const ceil = new THREE.Mesh(new THREE.ShapeGeometry(shape, 24), lambert(brickTexture([1 / T, 1 / T], 0.6, 17, D.theme)));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, H, zm);
    kit.add(ceil);
    // o poço sobe até uma luz distante
    const shaftH = 16;
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(SHAFT.r, SHAFT.r, shaftH, 20, 1, true),
      lambert(brickTexture([6, shaftH / T], 0.75, 41, D.theme)),
    );
    (tube.material as THREE.MeshLambertMaterial).side = THREE.BackSide;
    tube.position.set(SHAFT.x, H + shaftH / 2, SHAFT.z);
    kit.group.add(tube);
    const sky = new THREE.Mesh(new THREE.CircleGeometry(SHAFT.r * 1.2, 20), new THREE.MeshBasicMaterial({ color: 0xfff3d2, fog: false }));
    sky.rotation.x = Math.PI / 2;
    sky.position.set(SHAFT.x, H + shaftH, SHAFT.z);
    kit.group.add(sky);
    // coluna de luz (translúcida) e mancha de luz no chão
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(SHAFT.r * 0.95, SHAFT.r * 1.3, H, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xdfe8ff, transparent: true, opacity: 0.055, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }),
    );
    beam.position.set(SHAFT.x, H / 2, SHAFT.z);
    kit.group.add(beam);
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(1.6, 24),
      new THREE.MeshBasicMaterial({ color: 0xcfd8f0, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(SHAFT.x, 0.02, SHAFT.z);
    kit.group.add(pool);
    kit.light(SHAFT.x, H - 0.3, SHAFT.z, 0xcfdcff, 70);
  } else {
    kit.plane(W, L, kit.brick([W / T, L / T], 0.65, 17 + v), 0, H, zm, Math.PI / 2);
  }
  if (v === 1) kit.plane(W, H, kit.brick([W / T, H / T], 1, 23), 0, H / 2, Z1, 0, Math.PI);
  const entrance = v > 1 ? buildEntrance(kit, { x0: X0, x1: X1, z: Z1, h: H }) : null;
  kit.plane(L, H, kit.brick([L / T, H / T], 0.95, 31 + v), X0, H / 2, zm, 0, Math.PI / 2);
  kit.plane(L, H, kit.brick([L / T, H / T], 0.95, 37 + v), X1, H / 2, zm, 0, -Math.PI / 2);

  const door = buildDoor(kit, { x0: X0, x1: X1, z0: Z0, h: H, lamps: 1, connected: true, theme: D.theme });

  // a frase talhada: v1–v3 na parede do fundo, à esquerda da porta; a lacuna (v4) na parede esquerda, bem maior
  // UMA palavra nova por sala (DESIGN.md §24): 1 = só ACENDER; 2 = ACENDER + DOIS; 3 = ACENDER + TRÊS + BRASEIRO (o desenho do braseiro aparece no dado)
  const words: (string | null)[] = v === 1 ? ['acender'] : v === 2 ? ['acender', 'n2'] : v === 3 ? ['acender', 'n3', 'brasa'] : ['acender', null, 'brasa', 'conf'];
  const onBack = v !== 4;
  const units = words.reduce((a, w) => a + (w ? Math.max(1, glyphsOf(w).length) : 1) + 0.2917, 0) + 0.55 * (words.length - 1) + 1.4;
  const size = onBack ? Math.min(0.5, (D.hx - 1.5) / units) : 0.55;
  const ins = onBack
    ? kit.inscribe({ words, x: -(D.hx + 1.25) / 2, y: 1.6, z: Z0 + 0.025, nx: 0, nz: 1, size, age: 0.4 - v * 0.05, seed: 3 + v * 11, lead: true })
    : kit.inscribe({ words, x: X0 + 0.025, y: 1.55, z: Z0 + 4.4, nx: 1, nz: 0, size, age: 0.2, seed: 3 + v * 11, lead: true });

  // braseiros (posições relativas ao tamanho da sala)
  const spots: [number, number][] =
    v === 1
      ? [[X1 - 0.8, Z0 + 1.0]]
      : v === 2
        ? [[X0 + 1.0, Z0 + 3.8], [X1 - 1.0, Z0 + 3.8], [X1 - 1.0, Z0 + 10]]
        : v === 3
          ? [[X0 + 1.0, Z0 + 2.4], [X1 - 1.0, Z0 + 2.4], [X0 + 1.0, Z0 + 6.8], [X1 - 1.0, Z0 + 6.8]]
          : [[X1 - 0.9, Z0 + 1.0], [X1 - 0.9, Z0 + 4.4], [X1 - 0.9, Z0 + 7.2]];
  const braziers: Brazier[] = spots.map(([x, z]) => makeBrazier(kit, ctx, x, z, v === 4));

  // ── sala 1: entulho embaixo do poço; é ali que o dado caiu junto com você ──
  let dieLie: THREE.Vector3 | undefined;
  if (v === 1) {
    const rocks: [number, number, number, number][] = [
      [-0.9, 0.6, 0.34, 0.3],
      [0.8, -0.8, 0.28, 1.1],
      [1.3, 0.5, 0.2, 2.0],
      [-0.5, -0.7, 0.16, 0.4],
      [-1.5, -0.5, 0.22, 2.4],
    ];
    for (const [dx, dz, sz, rot] of rocks) {
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(sz, 0), kit.stone);
      m.position.set(SHAFT.x + dx, sz * 0.7, SHAFT.z + dz);
      m.rotation.set(rot, rot * 1.7, 0);
      kit.group.add(m);
    }
    dieLie = new THREE.Vector3(SHAFT.x - 0.15, 0.0, SHAFT.z + 1.05); // no chão, à beira da mancha de luz
    kit.crate(X0 + 0.7, Z1 - 1.8, 0.7, 0.5); // restos de caixa
    kit.web(X0, H - 0.45, Z1 - 0.45, 1, 0);
    kit.web(X1, H - 0.45, Z1 - 0.45, -1, 0, true);
  }
  // rachaduras e umidade: a Casa está velha
  kit.damp(X0, 1.0, Z0 + 4.4, 1, 0, 1.9);
  kit.damp(X1, 2.2, Z0 + 3.8, -1, 0, 1.5);
  kit.skirting(X0, X1, Z0, Z1, 1.3);
  kit.aoSides(X0, X1, Z0, Z1, H);
  kit.cornice(X0, X1, Z0, Z1, H);
  kit.pilaster(X0, Z0 + 5.5, 1, 0, H);
  kit.pilaster(X1, Z0 + 5.5, -1, 0, H);
  if (v >= 2) {
    kit.torch(X0 + 0.1, 1.8, -1.2, 1, 0, 0.7);
    kit.torch(X1 - 0.1, 1.8, -1.2, -1, 0, 2.4);
  }
  if (v === 3) kit.torch(-D.hx + 0.9, 1.8, Z0 + 0.1, 0, 1, 4.1);
  if (v === 2) {
    // o salão comprido: colunas dos dois lados
    for (const z of [-5, -9.5]) {
      kit.box(0.8, H, 0.8, kit.brick([0.7, 3], 0.95, 50 + Math.abs(z)), X0 + 0.4, H / 2, z);
      kit.box(0.8, H, 0.8, kit.brick([0.7, 3], 0.95, 52 + Math.abs(z)), X1 - 0.4, H / 2, z);
    }
  }
  kit.dust(X0, X1, Z0, Z1, 0, H);

  // lacuna (v4): como dividir a placa em 3×3 para ler o que o jogador riscou
  const gapMesh = ins.gap;
  const gapCenter = new THREE.Vector3();
  let gapHalf = 0.23;
  const ry = onBack ? 0 : Math.PI / 2; // a parede olha +z (fundo) ou +x (esquerda)
  if (gapMesh) {
    gapCenter.copy(gapMesh.position);
    // o miolo liso da placa (sem a moldura): CELL / (CELL + 2·PAD) da largura
    gapHalf = (gapMesh.geometry as THREE.PlaneGeometry).parameters.width * (96 / 124) * 0.5;
  }
  // o 3 (três pontos na diagonal) ocupa as casas 0, 4 e 8 da placa
  const gapReads = () => {
    if (!gapMesh) return false;
    const cnt = new Array(9).fill(0);
    for (const d of ctx.chalk.dotsOn(gapMesh)) {
      // eixo "à direita de quem lê": (cos ry, 0, -sin ry)
      const u = ((d.x - gapCenter.x) * Math.cos(ry) - (d.z - gapCenter.z) * Math.sin(ry)) / gapHalf;
      const w = (d.y - gapCenter.y) / gapHalf;
      if (Math.abs(u) > 1.05 || Math.abs(w) > 1.05) continue;
      const col = u < -1 / 3 ? 0 : u > 1 / 3 ? 2 : 1;
      const row = w > 1 / 3 ? 0 : w < -1 / 3 ? 2 : 1;
      cnt[row * 3 + col]++;
    }
    const on = (i: number) => cnt[i] >= 2;
    return on(0) && on(4) && on(8) && !on(2) && !on(6) && cnt[1] < 7 && cnt[3] < 7 && cnt[5] < 7 && cnt[7] < 7;
  };

  // sólidos pro dado
  const boxes: Box[] = [];
  braziers.forEach((b) => boxes.push(...b.boxes));
  boxes.push(mkBox(-1.25, 0, Z0, -0.95, ARCH_TOP, Z0 + 0.3));
  boxes.push(mkBox(0.95, 0, Z0, 1.25, ARCH_TOP, Z0 + 0.3));
  boxes.push(mkBox(-1.25, ARCH_TOP - 0.3, Z0, 1.25, H, Z0 + 0.3));

  let doorOpen = 0;
  let prevWant = 0;
  let solved = false;
  let evalT = 0;
  let lastRev = -1;
  let overlit = 0; // v2/v3: tempo com braseiros demais
  // os glifos da frase REAGEM ao que o jogador faz (DESIGN.md §24): ACENDER brilha enquanto há fogo; o número enche conforme os braseiros acesos; BRASEIRO
  // pisca ao acender; a marca final brilha quando a porta abre
  let flash = 0;
  let readT = 0; // há quanto tempo a porta está aberta (a Casa lê a frase)
  let prevLit = 0;
  const glow = (id: string, target: number, dt: number) => {
    for (const p of ins.panels) if (p.id === id) p.fire = (p.fire ?? 0) + (target - (p.fire ?? 0)) * Math.min(1, dt * 6);
  };
  let marked = false;
  let tried = false; // v1: já tentou abrir a porta
  let nudge = -1; // v1: segundos desde que o dado pediu para acender (-1 = ainda não pediu); se demorar, ele repete
  const doorPos = new THREE.Vector3(0, 1.0, Z0 + 0.5);

  // ── sala 1: a porta trancada, o dado que CAI do poço e a cena de pegá-lo (DESIGN.md §29) ──
  const interactables: Room['interactables'] = [];
  const diePos = new THREE.Vector3(); // onde o dado está no chão (acompanha onde ele parou)
  let pickingUp = false;
  let murmurT = 0;
  let murmurN = 0;
  // o que o dado murmura enquanto espera ajuda: bem curto, em glifos
  const MURMURS: string[][] = [['ajudar', 'eu'], ['voce', 'vir'], ['eu', 'esperar']];
  if (v === 1 && dieLie) {
    interactables.push({
      pos: doorPos,
      r: 2.6,
      label: 'Tentar abrir a porta',
      enabled: () => !ctx.have().die && doorOpen < 0.05 && !pickingUp,
      use: () => {
        if (tried || ctx.flag('caiu')) {
          ctx.say([{ who: 'thought', text: 'Continua trancada.' }], { block: true });
          return;
        }
        tried = true;
        ctx.sfx('error');
        ctx.say([{ who: 'thought', text: 'Trancada. Empurro, puxo… nada se mexe.' }], {
          block: true,
          onEnd: () => {
            // um barulho lá em cima: algo cai pelo poço (a câmera vira para o buraco)
            ctx.freeze(true);
            ctx.dropDie(() => {
              // o jogador pensa (caixa de conversa); o DADO fala só por balão, em glifos curtos
              ctx.say([{ who: 'thought', text: 'Caiu alguma coisa. Um dado… e ele brilha.' }], {
                block: true,
                onEnd: () => {
                  ctx.dieSay(['eu', 'cair'], { delay: 0.4 });
                  ctx.dieSay(['voce', 'ajudar', 'eu', 'perg'], { delay: 5.2 });
                  window.setTimeout(() => ctx.freeze(false), 10800);
                },
              });
            });
          },
        });
      },
    });
    // pegar o dado do chão (depois de ele ter caído): ele vai para a mão, vem para o CENTRO da tela e explica, em glifos
    interactables.push({
      pos: diePos,
      r: 1.9,
      label: 'Pegar o dado',
      enabled: () => ctx.flag('caiu') && !ctx.have().die && ctx.die.state === 'rest' && !pickingUp,
      use: () => {
        pickingUp = true;
        ctx.freeze(true);
        ctx.dieGlow(1);
        ctx.lookAt(diePos, 0.6);
        ctx.giveDie(() => {
          // o dado está na mão: cinema (faixas, dado grande no centro) e a explicação, uma frase curta por vez
          ctx.dieCenter(true);
          ctx.dieSay(['voce', 'condenado'], { delay: 1.3 });
          ctx.dieSay(['eu', 'boato'], { delay: 6.0 });
          ctx.dieSay(['eu', 'ajudar', 'voce'], { delay: 10.7 });
          ctx.dieSay(['acender', 'brasa'], { pic: 'braseiro', delay: 15.6 });
          window.setTimeout(() => {
            ctx.dieCenter(false);
            ctx.freeze(false);
            pickingUp = false;
            nudge = 0; // a partir daqui, se o jogador demorar a acender, o dado repete o pedido
            ctx.say([{ who: 'thought', text: 'Pesa na mão como se me conhecesse.' }], { block: true });
          }, 21000);
        });
      },
    });
  }

  kit.bake();

  return {
    name: D.name,
    subtitle: D.subtitle,
    group: kit.group,
    surfaces: kit.surfaces,
    emitters: kit.emitters,
    inscriptions: kit.inscriptions,
    interactables,
    dieLie,
    shaft: v === 1 ? new THREE.Vector3(SHAFT.x, H + 2.5, SHAFT.z) : undefined,
    doorZ: Z0,
    entranceZ: Z1,
    // 1ª sala: o jogador acorda perto da luz do poço, olhando pra ela
    start: v === 1 ? new THREE.Vector3(0.35, 0, SHAFT.z + 1.2) : new THREE.Vector3(0, 0, 1.2),
    startYaw: 0,
    fog: D.fog,
    ambient: D.ambient,
    boxes: [...boxes, ...kit.boxes],
    sockets: braziers.map((b) => b.socket),
    rects() {
      const r: ReturnType<Room['rects']> = braziers.map((b) => b.rect);
      r.push(...kit.rects);
      r.push([X0 - 2, Z0, X0, Z1 + 0.5], [X1, Z0, X1 + 2, Z1 + 0.5]);
      if (v === 1) r.push([X0 - 2, Z1, X1 + 2, Z1 + 0.5]);
      else r.push(...(entrance?.rects() ?? []));
      if (v === 2)
        for (const z of [-5, -9.5]) r.push([X0, z - 0.4, X0 + 0.8, z + 0.4], [X1 - 0.8, z - 0.4, X1, z + 0.4]);
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
      if (v === 1 && ctx.flag('caiu') && !ctx.have().die) {
        // o dado no chão pede ajuda: pulsa e murmura, enquanto o jogador não o pega
        diePos.copy(ctx.die.pos);
        ctx.dieGlow(0.5 + 0.35 * Math.sin(t * 2.4));
        if (!pickingUp && !ctx.paused()) {
          murmurT += dt;
          if (murmurT > 9) {
            murmurT = 0;
            ctx.dieSay(MURMURS[murmurN++ % MURMURS.length]); // o dado fala por balão, nunca pela caixa de conversa
          }
        }
      }
      // acender
      for (const b of braziers) {
        if (v !== 4 && b.touched()) {
          b.light(true);
          if (v === 1) ctx.milestone('fogo');
        }
        b.update(t);
      }
      const nLit = braziers.filter((b) => b.lit).length;
      if (v === 1) {
        if (nudge >= 0 && nLit === 0 && !ctx.paused()) {
          nudge += dt;
          if (nudge > 50) {
            nudge = 0;
            ctx.dieSay(['acender', 'brasa']); // repete o pedido se o jogador demorar
          }
        }
        if (nLit > 0 && nudge >= 0) {
          nudge = -1;
          // comemoração: ele reage quando o braseiro pega (depois da cena do fogo): "VOCÊ ACENDER CONFIRMADO", e logo em seguida a alegria dele
          ctx.dieSay(['voce', 'acender', 'conf'], { delay: 1.9, joy: true });
          ctx.dieSay(['eu', 'sentir', 'alegria'], { delay: 7.2 });
        }
      }
      if (nLit > prevLit) flash = 1;
      prevLit = nLit;
      flash = Math.max(0, flash - dt / 1.3);
      let want = 0;
      if (v === 1) want = nLit >= 1 ? 1 : 0;
      else if (v === 2 || v === 3) {
        // o número tem que ser EXATO: com mais braseiros do que o pedido, a Casa apaga tudo
        const need = v === 2 ? 2 : 3;
        want = nLit === need ? 1 : 0;
        if (nLit > need) {
          overlit += dt;
          if (overlit > 1.6) {
            braziers.forEach((b) => b.light(false));
            overlit = 0;
          }
        } else overlit = 0;
      } else {
        evalT -= dt;
        if (!solved && evalT <= 0 && ctx.chalk.revision !== lastRev) {
          evalT = 0.25;
          lastRev = ctx.chalk.revision;
          if (gapReads()) {
            solved = true;
            ctx.sfx('piece');
          }
        }
        want = solved ? 1 : 0;
      }
      if (want && !prevWant) {
        ctx.sfx('door');
        if (!marked) {
          marked = true;
          if (v <= 3) ctx.milestone(v === 1 ? 'fogo' : v === 2 ? 'dois' : 'tres');
        }
      } else if (!want && prevWant && doorOpen > 0.15) ctx.sfx('doorClose');
      prevWant = want;
      doorOpen += (want - doorOpen) * Math.min(1, dt * 2.4);
      door.setOpen(doorOpen);
      door.lampMats[0].color.setHex(want ? 0xff7a2e : LAMP_OFF);
      // reações dos glifos
      const open = doorOpen > 0.5;
      glow('acender', v === 4 ? (open ? 1 : 0) : nLit > 0 ? 1 : 0, dt);
      glow('brasa', Math.max(flash, open ? 0.6 : 0), dt);
      glow('conf', open ? 1 : 0, dt);
      // a Casa "lê" a frase quando a porta abre: as palavras acendem uma a uma, da esquerda para a direita
      readT = open ? readT + dt : 0;
      ins.panels.forEach((p, k) => {
        if (open && readT > 0.15 + k * 0.4 && p.id) p.fire = Math.max(p.fire ?? 0, Math.min(1, (readT - (0.15 + k * 0.4)) * 4));
      });
      if (v === 2 || v === 3) glow(v === 2 ? 'n2' : 'n3', open ? 1 : Math.min(1, nLit / (v === 2 ? 2 : 3)) * (nLit > (v === 2 ? 2 : 3) ? 0.3 : 1), dt);
    },
    reset() {
      braziers.forEach((b) => b.light(v === 4, true));
      doorOpen = 0;
      prevWant = 0;
      solved = false;
      overlit = 0;
      door.setOpen(0);
    },
    dispose() {},
  };
}
