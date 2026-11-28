// O Tribunal dos Rumores — o puzzle de NÍVEL 10 do capítulo do Fogo (só o dado de Fogo). Os dados vêm de tribunal.json
// (a mesma fonte do verificador `tools/verify_tribunal.mjs`, que prova que a solução é ÚNICA e que nenhuma pista é descartável).
//
// Cinco braseiros com números nos pedestais (UM a CINCO) e tamanhos diferentes. Nas paredes há sete frases do tipo
// «X ANTES Y» / «X DEPOIS Y», cada uma com uma marca: CONFIRMADO (verdade) ou BOATO (talvez falso). Na porta: «ACENDER TODOS BRASEIRO ORDEM»
// e a lei «DOIS BOATO = VERDADE» (exatamente dois dos boatos são verdadeiros). As frases chamam os braseiros pelo número OU pelo
// tamanho (GRANDE, PEQUENO), então é preciso olhar para eles. A ordem certa sai só do raciocínio. Errar apaga tudo e deixa os
// braseiros FRIOS por 12 s, então chutar não compensa.
//
// O ALTAR DO PESO (DESIGN.md §77): a ordem certa NÃO abre a porta. A pedra do altar embaixo da lei (a do IGUAL, a palavra do Peso) racha; o
// jogador a empurra e abre um nicho; põe o dado lá dentro (E/AGIR) e vê a cena: o dado entra devagar, a pedra fecha, a luz acende lá dentro e o
// IGUAL da lei se acende, a pedra abre e o dado volta com a face do Peso. Na frente da porta há uma PLACA: só o Peso a afunda, e só então a
// porta abre (uma demonstração de um passo, não um puzzle novo).
import * as THREE from 'three';
import data from './tribunal.json';
import { buildFireRoom, type FireExtra, type FireExtraApi, type FireLine, type FireSpec, type FireTablet } from './fire';
import { LINGER_MS } from '../../story/writing';
import type { Box, Ctx, Interactable, Rect, Room } from '../types';
import { T as Tr } from '../../i18n';

const SCALE: Record<string, number> = { pequeno: 0.7, medio: 1, grande: 1.35 };
interface Stmt {
  rel: string;
  a: string;
  b: string;
}
const words = (s: Stmt, mark: 'conf' | 'boato') => [s.a, s.rel, s.b, mark];

// a placa de pressão na frente da porta (local: x, distância da parede do fundo)
const PLATE = { x: 0, dz: 1.9 };

// halo redondo e suave (o brilho em volta de uma palavra que acende)
function haloTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(16, 16, 1, 16, 16, 16);
  r.addColorStop(0, 'rgba(255,255,255,0.62)');
  r.addColorStop(0.5, 'rgba(255,255,255,0.4)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

// rachaduras na pedra (canvas pequeno, pixel): linhas escuras quebradas que saem de um ponto
function crackTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d')!;
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const walk = (x: number, y: number, dx: number, dy: number, n: number, w: number) => {
    for (let i = 0; i < n; i++) {
      g.fillStyle = i % 3 === 0 ? '#0b0807' : '#15100d';
      g.fillRect(Math.round(x), Math.round(y), w, w);
      // um fio de luz dourada no fundo da rachadura, perto do centro (a luz que está atrás da pedra)
      if (w > 1 && i < n * 0.6 && i % 2 === 0) {
        g.fillStyle = i < 4 ? '#ffd27a' : '#c88a38';
        g.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
      x += dx + (rnd() - 0.5) * 1.4;
      y += dy + (rnd() - 0.5) * 1.4;
      if (i === Math.floor(n / 2) && w > 1) walk(x, y, dy * 0.8, -dx * 0.8, Math.floor(n / 2), 1);
    }
  };
  walk(15, 15, 0.9, -0.7, 16, 2);
  walk(15, 15, -0.8, 0.6, 14, 2);
  walk(15, 15, 0.2, 1, 12, 1);
  walk(15, 15, -0.5, -1, 9, 1);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  return t;
}

function altarExtra(api: FireExtraApi): FireExtra {
  const { kit, ctx, Z0, boxes } = api;
  // o bloco do altar, encostado na parede do fundo embaixo da lei (a lei fica em x = (hx + 1,25) / 2, y = 1,6)
  const AX = (6.2 + 1.25) / 2;
  const W = 1.3; // largura do bloco
  const D = 0.75; // quanto ele sai da parede (o nicho tem de caber o dado e, na frente dele, a pedra fechada)
  const ZF = Z0 + D; // a frente do bloco
  const OW = 0.54; // a boca do nicho (largura = altura)
  const OY0 = 0.46; // o chão do nicho
  const OY1 = OY0 + OW;
  const TOP = 1.18;
  const stone = kit.stone;
  const side = (W - OW) / 2;
  const parts: [number, number, number, number, number, number][] = [
    // [x, y, z, w, h, d] (centro e tamanho)
    [AX, OY0 / 2, Z0 + D / 2, W, OY0, D], // embaixo da boca
    [AX, (OY1 + TOP) / 2, Z0 + D / 2, W, TOP - OY1, D], // em cima
    [AX - OW / 2 - side / 2, (OY0 + OY1) / 2, Z0 + D / 2, side, OW, D], // dos lados
    [AX + OW / 2 + side / 2, (OY0 + OY1) / 2, Z0 + D / 2, side, OW, D],
  ];
  for (const [x, y, z, w, h, d] of parts) {
    kit.box(w, h, d, stone, x, y, z);
    const b: Box = { min: new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2), max: new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2) };
    boxes.push(b);
  }
  // a capa de pedra lavrada em cima e um degrau de base (o altar não é uma caixa)
  kit.box(W + 0.12, 0.07, D + 0.08, stone, AX, TOP + 0.035, Z0 + (D + 0.08) / 2);
  kit.box(W + 0.16, 0.06, D + 0.1, stone, AX, 0.03, Z0 + (D + 0.1) / 2);
  kit.contact(AX, Z0 + D / 2 + 0.05, W + 0.4, D + 0.4);
  // o fundo do nicho, escuro (sem luz: a boca se lê sempre como um buraco; o dado lá dentro tem brilho próprio)
  const backMat = new THREE.MeshBasicMaterial({ color: 0x07060a });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(OW, OW), backMat);
  back.position.set(AX, (OY0 + OY1) / 2, Z0 + 0.1);
  kit.group.add(back);
  // o forro de dentro (mais escuro que a pedra de fora: a boca se lê como um buraco)
  const inner = new THREE.MeshBasicMaterial({ color: 0x0f0d13 });
  for (const [x, y, w, h, ry, rx] of [
    [AX - OW / 2 + 0.002, (OY0 + OY1) / 2, D - 0.1, OW, Math.PI / 2, 0],
    [AX + OW / 2 - 0.002, (OY0 + OY1) / 2, D - 0.1, OW, -Math.PI / 2, 0],
    [AX, OY1 - 0.002, OW, D - 0.1, 0, Math.PI / 2],
    [AX, OY0 + 0.002, OW, D - 0.1, 0, -Math.PI / 2],
  ] as [number, number, number, number, number, number][]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), inner);
    m.position.set(x, y, Z0 + 0.1 + (D - 0.1) / 2);
    m.rotation.set(rx, ry, 0);
    kit.group.add(m);
  }

  // A PEDRA que tampa a boca: rachada quando a ordem certa é acesa; empurrada, ela recua e desce para dentro do bloco
  const slab = new THREE.Group();
  const slabMesh = new THREE.Mesh(new THREE.BoxGeometry(OW - 0.02, OW - 0.02, 0.08), stone);
  slab.add(slabMesh);
  const crack = new THREE.Mesh(new THREE.PlaneGeometry(OW - 0.04, OW - 0.04), new THREE.MeshBasicMaterial({ map: crackTexture(), transparent: true, alphaTest: 0.4, depthWrite: false }));
  crack.position.z = 0.041;
  crack.visible = false;
  slab.add(crack);
  kit.group.add(slab);
  const SLAB_Z = ZF - 0.04; // rente à frente do bloco
  const SLAB_IN = ZF - 0.1; // empurrada (e fechada de novo, um pouco funda: sobra a fresta por onde a luz vaza)
  const SLAB_DOWN = OY0 - OW / 2 - 0.02; // escondida dentro do bloco
  const setSlab = (z: number, y: number) => slab.position.set(AX, y, z);

  // as FRESTAS de luz em volta da pedra (só brilham na cena) e a luz que vaza do nicho
  const seamMat = new THREE.MeshBasicMaterial({ color: 0xffc860, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const seams = new THREE.Group();
  const T = 0.028;
  for (const [x, y, w, h] of [
    [0, OW / 2, OW + T, T],
    [0, -OW / 2, OW + T, T],
    [-OW / 2, 0, T, OW],
    [OW / 2, 0, T, OW],
  ]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), seamMat);
    m.position.set(x, y, 0);
    seams.add(m);
  }
  seams.position.set(AX, (OY0 + OY1) / 2, ZF + 0.003);
  seams.renderOrder = 4;
  kit.group.add(seams);
  // (lá no fundo do nicho, baixa: acende o chão na frente e as frestas, mas quase não pega na lei de cima, para o IGUAL dela se destacar sozinho)
  const glowLight = kit.light(AX, OY0 + 0.14, Z0 + 0.2, 0xffc070, 0);

  // a lei em cima do altar: o IGUAL dela acende na cena (a mesma luz de toda palavra talhada que acende)
  const law = kit.inscriptions.find((i) => i.words.includes('igual') && i.words.includes('boato'));
  const lawIgual = law?.panels.find((p) => p.id === 'igual');
  // de perto a cal da lei já brilha (branca): em volta do IGUAL, um halo de ouro na pedra que pulsa na cena e fica aceso depois, para ele se
  // destacar das outras palavras
  const igualMat = new THREE.MeshBasicMaterial({ map: haloTexture(), color: 0xffa838, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  if (lawIgual) {
    const m = lawIgual.mesh;
    const ov = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.56), igualMat);
    ov.position.copy(m.position).add(new THREE.Vector3(0, 0, 0.003));
    ov.rotation.copy(m.rotation);
    ov.renderOrder = 0;
    m.parent?.add(ov);
  }

  // pó que cai da pedra (quando racha, quando é empurrada, quando fecha)
  const N = 40;
  const dustPos = new Float32Array(N * 3);
  const dustV = new Float32Array(N * 3);
  const dustLife = new Float32Array(N);
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0xb8ab98, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  kit.group.add(dust);
  let dustT = 0;
  const puff = (n = N) => {
    for (let i = 0; i < Math.min(N, n); i++) {
      dustPos[i * 3] = AX + (Math.random() - 0.5) * OW;
      dustPos[i * 3 + 1] = OY0 + Math.random() * OW;
      dustPos[i * 3 + 2] = ZF + 0.02;
      dustV[i * 3] = (Math.random() - 0.5) * 0.5;
      dustV[i * 3 + 1] = Math.random() * 0.3;
      dustV[i * 3 + 2] = 0.15 + Math.random() * 0.45;
      dustLife[i] = 0.8 + Math.random() * 0.8;
    }
    dustT = 1.6;
  };

  // ── o estado ──
  // sealed: pedra inteira · cracked: rachada (dá para empurrar) · pushing: recuando e descendo · open: o nicho aberto, esperando o dado
  // · ritual: a cena (o motor manda as fases) · done: o dado já voltou com o Peso (o nicho fica aberto e vazio)
  type St = 'sealed' | 'cracked' | 'pushing' | 'open' | 'ritual' | 'done';
  let st: St = 'sealed';
  let crackIn = -1; // contagem da ordem certa até a pedra rachar
  let k = 0; // tempo dentro da etapa atual
  let shake = 0;
  let slabK = 0; // na cena: 0 = aberta (embaixo), 1 = fechada
  let slabTo = 0;
  let glow = 0;
  let glowTo = 0;
  let nudge = -1; // o dado olha para a placa de novo, se o jogador demorar
  let talked = false;
  let glowed = false; // na cena, a luz lá dentro já acendeu (o IGUAL da lei acende junto)
  let readyAt = 0; // o nicho abriu e o dado está falando: só quando ele termina de escrever (relógio de verdade, como o balão) dá para pô-lo lá
  let lookLawIn = -1; // na cena: daqui a pouco a câmera sobe até o IGUAL da lei
  const LAW_AT = lawIgual ? lawIgual.mesh.position.clone() : new THREE.Vector3(AX, 1.6, Z0);
  const NICHE_AT = new THREE.Vector3(AX, OY0 + 0.22 + 0.01, Z0 + 0.1 + 0.24);
  const PLATE_AT = new THREE.Vector3(PLATE.x, 0.1, Z0 + PLATE.dz);
  const STONE_AT = new THREE.Vector3(AX, (OY0 + OY1) / 2, ZF);

  const toDone = () => {
    st = 'done';
    slabK = 0;
    slabTo = 0;
    glow = glowTo = 0.18; // fica uma brasa de luz lá dentro
    crack.visible = false;
    if (lawIgual) lawIgual.fire = 1;
  };
  const toSealed = () => {
    st = 'sealed';
    crackIn = -1;
    k = 0;
    shake = 0;
    slabK = slabTo = 0;
    glow = glowTo = 0;
    crack.visible = false;
    talked = false;
    glowed = false;
    readyAt = 0;
    lookLawIn = -1;
    if (lawIgual) lawIgual.fire = 0;
  };
  const begin = () => (ctx.flag('peso') ? toDone() : toSealed());
  begin();
  if (import.meta.env.DEV) {
    // (testes) o estado do altar; `crack()` racha a pedra sem precisar resolver a ordem
    (globalThis as Record<string, unknown>).__altar = {
      state: () => ({ st, slabK: +slabK.toFixed(2), glow: +glow.toFixed(2), slab: slab.position.toArray().map((v) => +v.toFixed(3)), vis: slab.visible }),
      crack: () => {
        st = 'cracked';
        crack.visible = true;
        glowTo = 0.4;
      },
    };
  }

  const push: Interactable = {
    pos: new THREE.Vector3(AX, (OY0 + OY1) / 2, ZF + 0.3),
    r: 1.7,
    label: Tr('Empurrar a pedra', 'Push the stone', 'Empujar la piedra'),
    enabled: () => st === 'cracked',
    use() {
      st = 'pushing';
      k = 0;
      glowTo = 0;
      ctx.sfx('altarPush');
      ctx.dieReact('perk');
      puff(24);
    },
  };
  const put: Interactable = {
    pos: new THREE.Vector3(AX, (OY0 + OY1) / 2, ZF + 0.3),
    r: 1.7,
    label: Tr('Pôr o dado', 'Place the die', 'Poner el dado'),
    enabled: () => st === 'open' && performance.now() >= readyAt,
    use() {
      const ok = ctx.altar({
        at: NICHE_AT,
        n: new THREE.Vector3(0, 0, 1),
        flag: 'peso',
        face: 2,
        onPhase(p) {
          if (p === 'in') st = 'ritual';
          else if (p === 'shut') {
            slabTo = 1; // a pedra sobe de volta e fecha o nicho
          } else if (p === 'glow') {
            glowTo = 1;
            glowed = true;
            shake = 1.4;
            puff(16);
            ctx.seen('igual');
            lookLawIn = 0.45; // a câmera sobe até a lei: o IGUAL dela acende
          } else if (p === 'open') {
            slabTo = 0;
            glowTo = 0.5;
            ctx.lookAt(STONE_AT, 0.8); // e desce de volta para a pedra que abre
          } else if (p === 'done') {
            toDone();
            // o dado comemora a face nova e mostra a placa da porta
            ctx.dieTalk([{ glyphs: ['igual'], joy: true }, { glyphs: ['placa'] }], { delay: 0.4 });
            ctx.dieLook(PLATE_AT, 4);
            nudge = 22;
          }
        },
      });
      if (!ok) ctx.caption(Tr('O dado', 'The die', 'El dado'), Tr('Primeiro, o dado na mão.', 'First, the die in hand.', 'Primero, el dado en la mano.'), '#cfc6e8');
    },
  };

  return {
    interactables: [push, put],
    rects: (): Rect[] => [[AX - W / 2 - 0.08, Z0, AX + W / 2 + 0.08, ZF + 0.05]],
    update(dt) {
      // a ordem certa: um instante depois, a pedra do altar racha (e a câmera vira para ela)
      if (st === 'sealed' && api.solved()) {
        if (crackIn < 0) crackIn = 1.3;
        crackIn -= dt;
        if (crackIn <= 0) {
          st = 'cracked';
          crack.visible = true;
          glowTo = 0.4; // as frestas soltam um fio de luz: a pedra se vê do outro lado da sala
          shake = 0.7;
          puff();
          ctx.sfx('altarCrack');
          ctx.dieReact('perk');
          ctx.lookAt(STONE_AT, 1.1);
          ctx.dieLook(STONE_AT, 4);
        }
      }
      if (st === 'pushing') {
        k += dt;
        // recua 6 cm (0,45 s) e desce para dentro do bloco (0,8 s)
        const a = Math.min(1, k / 0.45);
        const b = Math.max(0, Math.min(1, (k - 0.45) / 0.8));
        setSlab(SLAB_Z + (SLAB_IN - SLAB_Z) * a, (OY0 + OY1) / 2 + (SLAB_DOWN - (OY0 + OY1) / 2) * b * b);
        if (k > 1.3) {
          st = 'open';
          crack.visible = false;
          if (!talked) {
            talked = true;
            // o dado olha para dentro e fala: «EU DENTRO» · «VOCÊ ESPERAR» (só depois dá para pô-lo lá)
            readyAt = performance.now() + 300 + ctx.dieTalk([{ glyphs: ['eu', 'dentro'] }, { glyphs: ['voce', 'esperar'] }], { delay: 0.3 }) - LINGER_MS + 600;
            ctx.dieLook(NICHE_AT, 4);
          }
        }
      } else if (st === 'sealed' || st === 'cracked') {
        setSlab(SLAB_Z, (OY0 + OY1) / 2);
      } else {
        // aberta (embaixo) ou, na cena, fechando e abrindo
        slabK += (slabTo - slabK) * Math.min(1, dt * (slabTo > slabK ? 5 : 4));
        const e = slabK * slabK * (3 - 2 * slabK);
        setSlab(SLAB_IN, SLAB_DOWN + ((OY0 + OY1) / 2 - SLAB_DOWN) * e);
        if (slabTo === 1 && slabK > 0.96 && dustT <= 0) puff(18);
      }
      slab.visible = !(st === 'open' || st === 'done') || slabK > 0.02;
      if (lookLawIn > 0) {
        lookLawIn -= dt;
        if (lookLawIn <= 0) ctx.lookAt(LAW_AT, 1.1);
      }
      // o tremor da pedra
      if (shake > 0) {
        shake = Math.max(0, shake - dt);
        slab.position.x += (Math.random() - 0.5) * 0.008 * Math.min(1, shake * 2);
        slab.position.y += (Math.random() - 0.5) * 0.006 * Math.min(1, shake * 2);
      }
      // a luz: as frestas, a luz que vaza e o IGUAL da lei
      glow += (glowTo - glow) * Math.min(1, dt * (glowTo > glow ? 2.2 : 1.2));
      const closed = slabK > 0.9 && st === 'ritual';
      const seamK = st === 'cracked' ? 0.8 : closed ? 1 : 0.25;
      seamMat.opacity = seamK * glow * (0.85 + 0.15 * Math.sin(performance.now() / 90));
      glowLight.intensity = glow * 9;
      if (lawIgual && st === 'ritual' && glowed) lawIgual.fire = Math.max(lawIgual.fire ?? 0, Math.min(1, glow * 1.3));
      const pulse = 0.75 + 0.25 * Math.sin(performance.now() / 160);
      igualMat.opacity = st === 'ritual' && glowed ? Math.min(1, glow * 1.4) * pulse : st === 'done' ? 0.35 * pulse : 0;
      // o pó
      if (dustT > 0) {
        dustT -= dt;
        for (let i = 0; i < N; i++) {
          if (dustLife[i] <= 0) {
            dustPos[i * 3 + 1] = -9;
            continue;
          }
          dustLife[i] -= dt;
          dustV[i * 3 + 1] -= 0.9 * dt;
          dustPos[i * 3] += dustV[i * 3] * dt;
          dustPos[i * 3 + 1] = Math.max(0.02, dustPos[i * 3 + 1] + dustV[i * 3 + 1] * dt);
          dustPos[i * 3 + 2] += dustV[i * 3 + 2] * dt;
        }
        dustGeo.attributes.position.needsUpdate = true;
        dustMat.opacity = Math.min(0.8, dustT);
      } else dustMat.opacity = 0;
      // o jogador demorou para usar a placa: o dado olha para ela de novo
      if (st === 'done' && nudge > 0 && !ctx.paused()) {
        nudge -= dt;
        if (nudge <= 0) {
          ctx.dieLook(PLATE_AT, 3);
          nudge = 25;
        }
      }
    },
    reset: begin,
    skip() {
      ctx.milestone('peso'); // (quem passou daqui já tem o Peso)
      toDone();
    },
  };
}

export function buildTribunal(ctx: Ctx): Room {
  const C = data.confirmadas as Stmt[];
  const B = data.boatos as Stmt[];
  // onde cada frase fica: misturadas (confirmadas e boatos nas duas paredes) para o jogador ter que LER as marcas
  const ln = (st: Stmt, mark: 'conf' | 'boato'): FireLine => ({ words: words(st, mark), worn: mark === 'boato' });
  const tablets: FireTablet[] = [
    // dois parágrafos (frases completas, uma embaixo da outra, de cima para baixo), com confirmadas e boatos misturados
    { lines: [ln(B[0], 'boato'), ln(C[0], 'conf')], wall: 'left', dz: 13, size: 0.45 },
    { lines: [ln(B[2], 'boato'), ln(C[2], 'conf')], wall: 'left', dz: 6, size: 0.45 },
    { lines: [ln(B[1], 'boato'), ln(C[1], 'conf'), ln(B[3], 'boato')], wall: 'right', dz: 9, size: 0.45 },
    // a lei da casa, ao lado da porta: «DOIS BOATO = VERDADE» (dois dos boatos são verdade); embaixo dela, o altar do Peso
    { words: ['n2', 'boato', 'igual', 'verdade'], wall: 'backR', seal: true, size: 0.4 },
  ];
  const spec: FireSpec = {
    name: data.nome,
    last: true, // o fim do capítulo 1
    subtitle: Tr('Todas as frases falam de alguém.', 'Every sentence speaks of someone.', 'Todas las frases hablan de alguien.'),
    hx: 6.2,
    z0: -16,
    h: 4,
    theme: 'crypt',
    braziers: data.braseiros.map((b) => ({ x: b.x, dz: b.dz, mark: `n${b.rotulo}`, scale: SCALE[b.tamanho] })),
    rule: { kind: 'order', seq: data.solucao.map((l) => l - 1), hints: false, penalty: 12 },
    words: ['acender', 'todos', 'brasa', 'ordem', 'conf'],
    tablets,
    plate: PLATE, // a trava da porta: só o Peso, que o altar dá
    extra: altarExtra,
    // (cenógrafo, DESIGN.md §100) a última sala do capítulo ganha abóbada e um óculo em cima da porta do fundo: a luz de fora entra por onde
    // se sai. (As paredes do lado estão cheias: frases, a lei, o altar. Uma fresta ali cairia na frente de alguma delas.)
    vault: { oculus: 'B', reach: 5.2 }, // (o feixe cai no meio do salão, longe da placa da porta e dos braseiros)
    fog: { color: '#0a0a11', near: 5, far: 30 },
    ambient: { color: 0x7a78b8, intensity: 1.9 },
  };
  return buildFireRoom(ctx, spec);
}
