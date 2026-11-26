// Salas do capítulo 1 vindas da sessão de projeto de puzzles (PUZZLES_PROPOSTAS.md §5) que usam o construtor fire.ts com peças extras.
// Cada uma tem verificador em tools/ e solução em PUZZLES.md.

import * as THREE from 'three';
import type { FireExtra, FireExtraApi, FireLine, FireSpec } from './fire';
import { makeCloth, makeGemNiche, makeRiser, makeTorch, makeWallBoard, type Torch } from '../firegrid';
import { makeBrazier } from '../brazier';
import { lambert } from '../kit';
import type { Rect } from '../types';
import { shotGate } from './shell';
import { diary, diaryStore } from '../../story/diary';

// ── constelação: tochas que escrevem (§3) ─────────────────────────────────
// `cells[i]` = casa da grade da tocha i (null = isca, fora da grade). Acender EXATAMENTE as tochas do alvo, nenhuma outra, faz o braseiro
// subir das rachaduras frias; acendê-lo abre o nicho da gema. As tochas se apagam sozinhas em ~40 s.
export function constellation(api: FireExtraApi, torches: Torch[], cells: (number | null)[], target: number[], riserAt: [number, number], niche: [number, number, number, number, number], riserY = 0) {
  const { kit, ctx } = api;
  const riser = makeRiser(kit, ctx, riserAt[0], riserAt[1], 1, riserY);
  api.boxes.push(...riser.boxes);
  let bonus = false;
  const nic = makeGemNiche(kit, ctx, niche[0], niche[1], niche[2], niche[3], niche[4], () => (bonus = true));
  const want = new Set(target);
  return {
    riser,
    niche: nic,
    bonus: () => bonus,
    update(dt: number, t: number) {
      for (const tc of torches) {
        if (tc.touched()) {
          tc.light(true, true);
          ctx.sfx('ignite', 'tocha');
        }
        tc.update(dt, t, ctx.paused());
      }
      if (!riser.up) {
        const lit = torches.map((tc, i) => (tc.lit ? cells[i] : -1));
        const ok = lit.filter((c) => c !== -1).length === want.size && lit.every((c, i) => !torches[i].lit || (c !== null && want.has(c as number)));
        if (ok) {
          riser.raise();
          ctx.caption('O chão se abriu', 'As tochas escreveram alguma coisa.', '#7ad8ff');
        }
      }
      riser.update(dt, t);
      if (riser.k >= 1 && !riser.brazier.lit && riser.brazier.touched()) {
        riser.brazier.light(true, true);
        ctx.sfx('ignite', 'risen');
        nic.open();
      }
      nic.update(dt, t);
    },
    reset() {
      torches.forEach((tc) => tc.light(false, true));
      riser.reset();
      nic.reset();
    },
    rect: (): Rect[] => {
      const r = riser.rect();
      return r ? [r] : [];
    },
  };
}

// ── SALA · A CASA ESCREVE (nível 3; tools/verify_casa_escreve.mjs, C1 em tools/verify_constelacoes.mjs) ──────────
// Salão de 9 colunas em grade. A lousa da Casa, sobre a porta, acende UM lampião de cada vez, em laço, e depois fica no escuro (o glifo ORDEM
// pulsa nesse escuro: é o fim da frase). A lousa é o MAPA do salão (o glifo PORTA talhado em cima diz que o lado de cima é o da porta).
// Quatro colunas têm braseiro ao pé. Ordem: meio-direita, fundo-esquerda, frente-meio, fundo-direita.
// C1: com a porta aberta, a cada três voltas a lousa mostra um 5º quadro, CINCO (os quatro cantos e o centro). Acender as tochas dessas cinco
// colunas, e nenhuma outra, faz subir o braseiro das rachaduras frias; acendê-lo abre a câmara da gema.
const COLS_X = [-3.6, 0.6, 4.8]; // um pouco fora do centro: da entrada se vê a lousa sobre a porta entre as colunas
const COLS_DZ = [3.5, 7.5, 11.5]; // linha 0 = lado da porta
const colAt = (i: number): [number, number] => [COLS_X[i % 3], COLS_DZ[Math.floor(i / 3)]];
const footOf = (i: number) => ({ x: colAt(i)[0], dz: colAt(i)[1] + 1.15 }); // braseiro ao pé da coluna (do lado da entrada)
const LOOP = [5, 0, 7, 2]; // os quadros da lousa (do primeiro, logo depois do escuro, ao último)

function casaEscreveExtra(api: FireExtraApi): FireExtra {
  const { kit, ctx, X0, X1, Z0 } = api;
  // a lousa da Casa: sobre a porta, com o glifo PORTA talhado na borda de cima
  const board = makeWallBoard(kit, ctx, { x: 0, y: 3.95, z: Z0 + 0.02, nx: 0, nz: 1, step: 0.42, key: 'casa' });
  kit.inscribe({ words: ['porta'], x: 0, y: 5.0, z: Z0 + 0.025, nx: 0, nz: 1, size: 0.3, age: 0.2, frame: true, seed: 17 });
  const show = (cells: number[]) => {
    for (let i = 0; i < 9; i++) {
      const on = cells.includes(i);
      if (board.grid.lit[i] !== on) {
        board.grid.lit[i] = on;
        board.grid.nodes[i]?.set(on, true);
      }
    }
  };
  // tochas: uma em cada coluna (de frente para a entrada) e três iscas nas paredes
  const torches: Torch[] = [];
  const cells: (number | null)[] = [];
  for (let i = 0; i < 9; i++) {
    const [x, dz] = colAt(i);
    torches.push(makeTorch(kit, ctx, x, 2.1, Z0 + dz + 0.47, 0, 1));
    cells.push(i);
  }
  torches.push(makeTorch(kit, ctx, X0 + 0.1, 2.1, Z0 + 7.5, 1, 0), makeTorch(kit, ctx, X1 - 0.1, 2.1, Z0 + 7.5, -1, 0), makeTorch(kit, ctx, 3.4, 2.1, Z0 + 0.1, 0, 1));
  cells.push(null, null, null);
  const C = constellation(api, torches, cells, [0, 2, 4, 6, 8], [0.6, Z0 + 9.5], [X0 + 0.02, 1.25, Z0 + 12.5, 1, 0]);
  let lt = 0;
  let loops = 0;
  return {
    update(dt, t) {
      // o laço: 1,5 s por quadro (com um respiro apagado), 2,5 s de escuro; resolvida, a cada 3 voltas aparece o CINCO antes do escuro
      lt += ctx.paused() ? 0 : dt;
      const extra = api.solved() && loops % 3 === 2;
      const frames = extra ? [...LOOP.map((c) => [c]), [0, 2, 4, 6, 8]] : LOOP.map((c) => [c]);
      const F = 1.5;
      const total = frames.length * F + 2.5;
      if (lt >= total) {
        lt -= total;
        loops++;
      }
      const k = Math.floor(lt / F);
      const inFrame = k < frames.length && lt - k * F < F - 0.25;
      show(inFrame ? frames[k] : []);
      const dark = lt >= frames.length * F;
      api.glow('ordem', dark ? 0.55 + 0.45 * Math.sin(t * 6) : 0, dt);
      board.update(dt, t);
      C.update(dt, t);
    },
    reset() {
      lt = 0;
      loops = 0;
      C.reset();
    },
    bonus: C.bonus,
    rects: C.rect,
    interactables: [C.niche.interactable],
  };
}

export const FIRE_CASA_ESCREVE: FireSpec = {
  name: 'A Casa Escreve',
  subtitle: 'Uma luz de cada vez.',
  hx: 7,
  z0: -14,
  h: 5.6,
  braziers: [footOf(5), footOf(0), footOf(7), footOf(2)],
  rule: { kind: 'order', seq: [0, 1, 2, 3], hints: false, penalty: 6 }, // meio-direita, fundo-esquerda, frente-meio, fundo-direita
  words: ['acender', 'brasa', 'ordem'],
  pillars: [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => colAt(i)),
  torches: 'few',
  fog: { color: '#0a0a11', near: 5, far: 24 },
  ambient: { color: 0x7a78b8, intensity: 2.15 },
  extra: casaEscreveExtra,
};

// ── SALA · O PANO (nível 5; tools/verify_pano.mjs, C2 em tools/verify_constelacoes.mjs) ──────────────────────
// O que é TALHADO é da Casa; o que é TECIDO é boato (cada pano tem BOATO bordado). O fogo queima o pano e mostra a pedra.
// Porta «ACENDER [DOIS] BRASEIRO CONFIRMADO» (pano TODOS); parede esquerda, alto: «[TRÊS] ANTES QUATRO CONFIRMADO» (pano UM); parede direita,
// alto: um pano «DOIS ANTES UM» sobre pedra lisa (boato puro). Solução: queimar os dois primeiros panos; acender TRÊS e depois QUATRO.
// C2: seis pilares com tocha; os FRISOS do teto ligam três deles num triângulo (o glifo ACENDER). Acender as tochas do pilar do meio do fundo
// e dos dois pilares dos cantos da frente: o fogo corre pelos frisos, o braseiro sobe no centro; acendê-lo abre o nicho.
const PANO_X = [-2.2, 0, 2.2];
const PANO_DZ = [3.5, 10.5]; // linha 0 (lado da porta) e linha 2 (lado da entrada): as casas 0,1,2 e 6,7,8
const PANO_FRIEZES: [number, number][] = [[1, 6], [6, 8], [8, 1]];
function panoCell(c: number): [number, number] {
  return [PANO_X[c % 3], PANO_DZ[c < 3 ? 0 : 1]];
}
function panoExtra(api: FireExtraApi): FireExtra {
  const { kit, ctx, X0, X1, Z0, H } = api;
  const torches: Torch[] = [];
  const cells: (number | null)[] = [];
  for (const c of [0, 1, 2, 6, 7, 8]) {
    const [x, dz] = panoCell(c);
    torches.push(makeTorch(kit, ctx, x, 2.2, Z0 + dz + 0.47, 0, 1));
    cells.push(c);
  }
  // iscas: perto do altar (a porta) e duas na parede da entrada
  torches.push(makeTorch(kit, ctx, 2.8, 2.0, Z0 + 0.1, 0, 1), makeTorch(kit, ctx, -2.6, 2.0, 1.9, 0, -1), makeTorch(kit, ctx, 2.6, 2.0, 1.9, 0, -1));
  cells.push(null, null, null);
  // luz para ler as frases do alto
  for (const dz of [4.6, 9.4]) {
    kit.torch(X0 + 0.1, 4.45, Z0 + dz, 1, 0, 0.3 + dz);
    kit.torch(X1 - 0.1, 4.45, Z0 + dz, -1, 0, 1.7 + dz);
  }
  // os frisos de pedra do teto; o fogo corre por eles quando as tochas das duas pontas estão acesas
  const frieze = PANO_FRIEZES.map(([a, b]) => {
    const [ax, adz] = panoCell(a);
    const [bx, bdz] = panoCell(b);
    const az = Z0 + adz;
    const bz = Z0 + bdz;
    const len = Math.hypot(bx - ax, bz - az);
    const yaw = Math.atan2(-(bz - az), bx - ax);
    const stone = new THREE.Mesh(new THREE.BoxGeometry(len, 0.14, 0.3), kit.stone);
    stone.position.set((ax + bx) / 2, H - 0.07, (az + bz) / 2);
    stone.rotation.y = yaw;
    kit.group.add(stone);
    const geo = new THREE.PlaneGeometry(len, 0.12);
    geo.rotateX(Math.PI / 2);
    geo.translate(len / 2, 0, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffa040, fog: false });
    const fire = new THREE.Mesh(geo, mat);
    fire.position.set(ax, H - 0.145, az);
    fire.rotation.y = yaw;
    fire.scale.x = 0.0001;
    fire.visible = false;
    kit.group.add(fire);
    // a coluna embaixo de cada ponta tem um sulco subindo até o friso (para ligar a tocha ao teto)
    return { a, b, fire, k: 0 };
  });
  for (const c of [0, 1, 2, 6, 7, 8]) {
    const [x, dz] = panoCell(c);
    kit.box(0.08, H - 2.9, 0.05, lambert(null, 0x1a1418), x, (H + 2.9) / 2, Z0 + dz + 0.47, false);
  }
  const C = constellation(api, torches, cells, [1, 6, 8], [0, Z0 + 7], [X1 - 0.02, 1.25, Z0 + 9.3, -1, 0]);
  const litCell = (c: number) => torches[cells.indexOf(c)]?.lit ?? false;
  // DEMONSTRAÇÃO NA ENTRADA (sem punição): um braseiro pequeno ACESO e, pendurado acima dele, um trapo com um glifo tecido. Enquanto o jogador olha,
  // uma fagulha sobe, o trapo pega fogo SOZINHO e queima de baixo para cima; atrás dele, talhada na pedra, a palavra BRASEIRO.
  // Ninguém explica nada: o jogador VÊ que pano queima e que embaixo há pedra escrita.
  const DZ = 0.35; // perto da entrada, na parede esquerda
  const demoB = makeBrazier(kit, ctx, X0 + 0.55, DZ, true, 0.55);
  api.boxes.push(...demoB.boxes);
  const carved = kit.inscribe({ words: ['brasa'], x: X0 + 0.025, y: 2.05, z: DZ, nx: 1, nz: 0, size: 0.46, age: 0.2, seed: 141, hidden: true });
  const rag = makeCloth(kit, ctx, { x: X0 + 0.03, y: 2.05, z: DZ, nx: 1, nz: 0, words: ['fogo'], size: 0.46, color: '#8a5a2a', key: 'trapo', secs: 2.4 });
  const spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false, color: 0xffd080 }));
  spark.scale.set(0.16, 0.16, 1);
  spark.visible = false;
  kit.group.add(spark);
  let ragGaze = 0;
  let sparkT = -1;
  let ragShown = false;
  const ragAt = new THREE.Vector3(X0 + 0.1, 2.05, DZ);
  const tmpV = new THREE.Vector3();
  return {
    update(dt, t) {
      C.update(dt, t);
      demoB.update(t);
      if (rag.k === 0 && !rag.burning && sparkT < 0) {
        // o jogador olha para o trapo (ou já passou por ele): a fagulha sobe
        const a = ctx.aim();
        tmpV.copy(ragAt).sub(a.o);
        const d = tmpV.length();
        const looking = d < 7 && a.d.dot(tmpV.divideScalar(d)) > 0.86;
        ragGaze = looking && !ctx.paused() ? ragGaze + dt : 0;
        if (ragGaze > 0.7 || (ctx.player.pos.z < DZ - 2.4 && ctx.player.pos.z > Z0 && !ctx.paused())) sparkT = 0;
      }
      if (sparkT >= 0) {
        sparkT += dt;
        const k = Math.min(1, sparkT / 0.9);
        spark.visible = k < 1;
        spark.position.set(X0 + 0.5 - 0.35 * k, 0.9 + 0.75 * k + Math.sin(k * 9) * 0.03, DZ + Math.sin(k * 7) * 0.05);
        spark.material.map = kit.frame(t * 12);
        if (k >= 1) {
          sparkT = -1;
          rag.ignite(true);
          ctx.sfx('spread');
        }
      }
      rag.update(dt, t);
      if (!ragShown && rag.k > 0.45) {
        ragShown = true;
        carved.reveal(); // a pedra talhada aparece por trás do pano que queima
      }
      for (const f of frieze) {
        const on = litCell(f.a) && litCell(f.b);
        f.k = on ? Math.min(1, f.k + dt / 1.2) : Math.max(0, f.k - dt / 0.6);
        f.fire.visible = f.k > 0.001;
        f.fire.scale.x = Math.max(0.0001, f.k);
      }
    },
    reset() {
      C.reset();
      for (const f of frieze) f.k = 0;
    },
    bonus: C.bonus,
    rects: () => [...C.rect(), demoB.rect],
    interactables: [C.niche.interactable],
  };
}

export const FIRE_PANO: FireSpec = {
  name: 'O Pano',
  subtitle: 'Panos sobre a pedra.',
  hx: 4,
  z0: -12,
  h: 7,
  braziers: [
    { x: -3.2, dz: 8.5, mark: 'n1' },
    { x: 3.2, dz: 5.8, mark: 'n2' },
    { x: -3.2, dz: 1.9, mark: 'n3' },
    { x: 3.2, dz: 12.4, mark: 'n4' },
  ],
  rule: { kind: 'order', seq: [2, 3], hints: false, penalty: 8 }, // TRÊS, QUATRO
  words: ['acender', 'n2', 'brasa', 'conf'],
  tablets: [{ words: ['n3', 'antes', 'n4', 'conf'], wall: 'left', dz: 7, y: 4.3, size: 0.52 }],
  cloths: [
    { words: ['todos'], over: { tablet: 'sign', word: 1 } }, // a porta: TODOS tecido sobre o DOIS talhado
    { words: ['n1'], over: { tablet: 0, word: 0 }, size: 0.52 }, // parede esquerda: UM tecido sobre o TRÊS talhado
    { words: ['n2', 'antes', 'n1'], wall: 'right', dz: 7, y: 4.3, size: 0.52 }, // parede direita: boato puro (pedra lisa embaixo)
  ],
  pillars: [0, 1, 2, 6, 7, 8].map((c) => panoCell(c)),
  torches: 'few',
  fog: { color: '#0a0a11', near: 5, far: 24 },
  ambient: { color: 0x7a78b8, intensity: 2.0 },
  extra: panoExtra,
};

// ── SALA · OS APELIDOS (nível 6; tools/verify_apelidos.mjs) ─────────────────────────────────────────────────
// (EM RESERVA: esta é a versão RETANGULAR. No jogo entra a rotunda de `apelidos.ts`, com a mesma regra e a mesma solução.)
// O mesmo braseiro pode ser chamado pelo NÚMERO ou pelo TAMANHO. GRANDE (o do meio, sem número) e PEQUENO (o QUATRO, o menor).
// Armadilha: o glifo PEQUENO parece UM numa moldura e o GRANDE parece QUATRO: quem lê pelo desenho cai em contradição.
// Solução: TRÊS, GRANDE, QUATRO, DOIS, UM.
export const FIRE_APELIDOS: FireSpec = {
  name: 'Os Apelidos',
  subtitle: 'Um braseiro sem número.',
  hx: 5.6,
  z0: -17,
  h: 3.8,
  braziers: [
    { x: -3.4, dz: 13.5, mark: 'n1' },
    { x: 3.4, dz: 12, mark: 'n2' },
    { x: -3.6, dz: 4.5, mark: 'n3' },
    { x: 2.6, dz: 7.5, mark: 'n4', scale: 0.6 }, // PEQUENO
    { x: 0, dz: 9.5, mark: 'grande', scale: 1.5 }, // GRANDE, sem número
  ],
  rule: { kind: 'order', seq: [2, 4, 3, 1, 0], hints: false, penalty: 10 },
  words: ['acender', 'grande', 'antes', 'pequeno', 'conf'],
  tablets: [
    { lines: [{ words: ['n1', 'depois', 'n2', 'conf'] }, { words: ['grande', 'depois', 'n3', 'conf'] }], wall: 'left', dz: 9, size: 0.45 },
    { lines: [{ words: ['pequeno', 'antes', 'n2', 'conf'] }], wall: 'right', dz: 10, size: 0.45 },
  ],
  pillars: [
    [-1.8, 6.5],
    [1.8, 12.5],
  ],
  fog: { color: '#0a0a11', near: 5, far: 26 },
  ambient: { color: 0x7a78b8, intensity: 1.9 },
};

// ── SALA · O BOATO VERDADEIRO (nível 6; tools/verify_verdade.mjs) ────────────────────────────────────────────
// A porta diz «ACENDER VERDADE»: acender TODA frase verdadeira, inclusive os boatos verdadeiros, e nenhuma falsa. A Casa só julga quando o
// jogador acende a frase da porta. A demonstração (já acesa) mostra um boato aceso porque diz o mesmo que uma confirmada.
// Confirmadas: 1 antes 2, 1 depois 3, 4 depois 2 → 3, 1, 2, 4. Boatos: «4 ANTES 1» falso, «3 ANTES 4» verdade, «2 DEPOIS 3» verdade, «3 DEPOIS 1» falso.
const f = (a: string, rel: string, b: string, mark: string, extra: Partial<FireLine> = {}): FireLine => ({ words: [a, rel, b, mark], ...extra });
export const FIRE_VERDADE: FireSpec = {
  name: 'O Boato Verdadeiro',
  subtitle: 'Algumas frases já acesas.',
  hx: 5.6,
  z0: -19,
  h: 3.8,
  braziers: [
    { x: -3.2, dz: 12.5, mark: 'n1', hidden: true },
    { x: 3.4, dz: 6, mark: 'n2', hidden: true },
    { x: 3.0, dz: 13, mark: 'n3', hidden: true },
    { x: -3.0, dz: 4.5, mark: 'n4', hidden: true },
  ],
  rule: { kind: 'order', seq: [2, 0, 1, 3], hints: false, penalty: 8 }, // TRÊS, UM, DOIS, QUATRO
  lock: { judge: 'door', penalty: 10 },
  words: ['acender', 'verdade', 'conf'],
  tablets: [
    { lines: [f('n1', 'antes', 'n2', 'conf', { preLit: true }), f('n2', 'depois', 'n1', 'boato', { preLit: true })], wall: 'left', dz: 17, size: 0.45, lit: true },
    { lines: [f('n1', 'depois', 'n3', 'conf', { good: true }), f('n4', 'antes', 'n1', 'boato')], wall: 'left', dz: 9, size: 0.45, lit: true },
    { lines: [f('n3', 'antes', 'n4', 'boato', { good: true }), f('n4', 'depois', 'n2', 'conf', { good: true })], wall: 'right', dz: 14, size: 0.45, lit: true },
    { lines: [f('n2', 'depois', 'n3', 'boato', { good: true }), f('n3', 'depois', 'n1', 'boato')], wall: 'right', dz: 6, size: 0.45, lit: true },
  ],
  fog: { color: '#0a0a11', near: 5, far: 28 },
  ambient: { color: 0x7a78b8, intensity: 1.9 },
};

// ── SALA · O QUE A CASA CONFIRMA, refeita em duas partes (nível 5; PUZZLES_PROPOSTAS.md §5 sala 7, tools/verify_confirma.mjs) ─────────
// PARTE 1 (as marcas, numa lousa): «ACENDER QUATRO CONFIRMADO» (talhada, com moldura) e «ACENDER TRÊS BOATO» (gasta). Escrever QUATRO abre a
// grade e o glifo CONFIRMADO acende; escrever TRÊS faz a Casa apagar a lousa e o glifo BOATO piscar. Junto da grade, uma folha arrancada dela.
// PARTE 2 (ANTES/DEPOIS): cinco frases; acender as três CONFIRMADAS (um boato apaga as acesas e a Casa recusa o fogo por 4 s); os quatro pilares
// sobem; a cadeia «4 DEPOIS 2», «1 DEPOIS 4», «1 ANTES 3» dá 2 → 4 → 1 → 3.
const CONF_GRATE_DZ = 15.5; // a grade entre as duas câmaras (distância do fundo)
function confirmaExtra(api: FireExtraApi): FireExtra {
  const { kit, ctx, X0, X1, Z0, H, boxes } = api;
  const GZ = Z0 + CONF_GRATE_DZ;
  const bz = GZ + 2.4; // a lousa e as frases, na parede esquerda da 1ª câmara
  const board = makeWallBoard(kit, ctx, { x: X0 + 0.02, y: 1.25, z: bz, nx: 1, nz: 0, key: 'confirma' });
  const conf = kit.inscribe({ words: ['acender', 'n4', 'conf'], x: X0 + 0.025, y: 3.2, z: bz, nx: 1, nz: 0, size: 0.36, age: 0.15, seed: 61, plaque: true });
  const boato = kit.inscribe({ words: ['acender', 'n3', 'boato'], x: X0 + 0.025, y: 2.5, z: bz, nx: 1, nz: 0, size: 0.36, age: 0.75, seed: 63 });
  kit.torch(X0 + 0.1, 2.3, bz - 1.25, 1, 0, 0.5); // luz para ler as duas frases
  // a grade
  const grate = new THREE.Group();
  kit.group.add(grate);
  const iron = lambert(null, 0x2a2a30);
  for (let x = X0 + 0.15; x < X1; x += 0.28) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, H, 0.05), iron);
    b.position.set(x, H / 2, GZ);
    grate.add(b);
  }
  for (const y of [0.35, 1.4, 2.5, 3.5]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0, 0.07, 0.08), iron);
    b.position.set(0, y, GZ);
    grate.add(b);
  }
  const gBox = { min: new THREE.Vector3(X0, 0, GZ - 0.1), max: new THREE.Vector3(X1, H, GZ + 0.1) };
  boxes.push(gBox);
  // a folha arrancada dela, no chão junto da grade
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.004, 0.3), lambert(null, 0xd8b880));
  leaf.position.set(X1 - 1.1, 0.01, GZ + 0.6);
  leaf.rotation.y = 0.5;
  kit.group.add(leaf);
  const leafPos = leaf.position.clone();
  let leafTaken = (diaryStore.get().pages ?? []).includes('p3');
  leaf.visible = !leafTaken;
  const takeLeaf = {
    pos: leafPos,
    r: 1.8,
    label: 'Pegar a folha',
    enabled: () => !leafTaken,
    use: () => {
      leafTaken = true;
      leaf.visible = false;
      diary.addPage('p3');
      ctx.sfx('gem');
      ctx.caption('Uma folha arrancada', 'É do caderno. A letra dela.', '#d8b880');
    },
  };
  let solved = false;
  let gateK = 0;
  let idle = 0;
  let boatoT = 0; // o glifo BOATO pisca
  let rejectT = -1;
  const gate = shotGate(ctx.die);
  return {
    update(dt, t) {
      gate.tick();
      board.update(dt, t);
      if (!solved && rejectT < 0) {
        const i = board.hit();
        if (i >= 0 && gate.take() && !board.grid.lit[i]) {
          board.grid.ignite(i);
          ctx.sfx('ignite', 'confirma');
          idle = 0;
        }
        const pts = board.grid.points();
        if (pts.length && board.grid.writes('n4')) {
          solved = true;
          ctx.sfx('piece');
          ctx.sfx('door');
        } else if (pts.length && board.grid.writes('n3')) {
          rejectT = 0.9; // a Casa lê o TRÊS... e apaga (era boato)
        } else if (pts.length) {
          idle += ctx.paused() ? 0 : dt;
          if (idle > 5) {
            board.grid.clear();
            ctx.sfx('burnout');
            idle = 0;
          }
        }
      }
      if (rejectT >= 0) {
        rejectT -= dt;
        if (rejectT < 0) {
          board.grid.clear(false);
          ctx.sfx('error');
          boatoT = 1.8;
        }
      }
      boatoT = Math.max(0, boatoT - dt);
      for (const p of boato.panels) if (p.id === 'boato') p.fire = boatoT > 0 ? (Math.floor(boatoT * 6) % 2 ? 1 : 0.1) : 0;
      for (const p of conf.panels) p.fire = (p.fire ?? 0) + ((solved ? 1 : 0) - (p.fire ?? 0)) * Math.min(1, dt * 4);
      gateK += ((solved ? 1 : 0) - gateK) * Math.min(1, dt * 1.5);
      grate.position.y = gateK * (H - 0.3);
      gBox.min.y = gateK * (H - 0.3);
    },
    reset() {
      solved = false;
      gateK = 0;
      idle = 0;
      boatoT = 0;
      rejectT = -1;
      board.grid.clear();
    },
    rects: () => (gateK < 0.75 ? [[X0 - 1, GZ - 0.12, X1 + 1, GZ + 0.12]] : []),
    interactables: [takeLeaf],
  };
}
const fc = (a: string, rel: string, b: string, mark: string, good = false): FireLine => ({ words: [a, rel, b, mark], good });
export const FIRE_CONFIRMA: FireSpec = {
  name: 'O Que a Casa Confirma',
  subtitle: 'Uma lousa. Uma grade.',
  hx: 5.5,
  z0: -22,
  h: 3.8,
  braziers: [
    { x: -3.2, dz: 6, mark: 'n1', hidden: true },
    { x: 3.4, dz: 13.5, mark: 'n2', hidden: true },
    { x: -3.0, dz: 12.5, mark: 'n3', hidden: true },
    { x: 3.2, dz: 4.5, mark: 'n4', hidden: true },
  ],
  rule: { kind: 'order', seq: [1, 3, 0, 2], hints: false, penalty: 8 }, // DOIS, QUATRO, UM, TRÊS
  lock: { penalty: 4 },
  words: ['acender', 'conf'],
  tablets: [
    { lines: [fc('n1', 'antes', 'n3', 'conf', true), fc('n3', 'antes', 'n2', 'boato')], wall: 'left', dz: 9, size: 0.45, lit: true },
    // (frases acendíveis ficam entre 1,3 m e 2,0 m de altura: na direita, duas linhas num tablete e a terceira noutro, mais perto da grade)
    { lines: [fc('n4', 'depois', 'n2', 'conf', true), fc('n1', 'antes', 'n4', 'boato')], wall: 'right', dz: 5.5, size: 0.45, lit: true },
    { lines: [fc('n1', 'depois', 'n4', 'conf', true)], wall: 'right', dz: 12, size: 0.45, lit: true },
  ],
  fog: { color: '#0a0a11', near: 5, far: 26 },
  ambient: { color: 0x7a78b8, intensity: 1.9 },
  extra: confirmaExtra,
};
