// R5 · A ANTECÂMARA FRIA (PUZZLES_PROPOSTAS.md §2b "R5" e §4 "Ficha 9b"; ideia do Pedro). Entre as salas 16 e 17 do plano; enquanto elas não
// existem, fica logo antes do Tribunal. NÃO é puzzle: ensina, numa cena só, o que a sala 17 vai pedir.
// Câmara pequena e baixa, porta fechada SEM frase. Na parede do fundo, ao lado da porta, uma MOLDURA DE FRASE VAZIA (lisa, com o lugar da marca;
// a mesma peça do anexo C da sala 17) e, embaixo, um SOQUETE FRIO (tigela de bronze rachada, sem brasa): a única coisa acendível da sala.
// Acender o soquete com o Fogo: a Casa apaga tudo por 4 s (ctx.blackout(4)); no escuro, aparece na moldura, em CAL (verde-limão pálido,
// fosforescente), «ABRIR PORTA CONFIRMADO», e a porta se abre ainda no escuro (ouve-se). A luz volta, a moldura está lisa de novo, a porta
// continua aberta. Repetível (o soquete esfria de novo). Ensina: (1) o soquete frio acende; (2) acendê-lo traz o escuro; (3) no escuro a moldura
// vazia mostra uma frase CONFIRMADA e a Casa obedece a ela.
import * as THREE from 'three';
import { Kit, lambert } from '../kit';
import { makeInscription } from '../inscription';
import { roomShell, shotGate } from './shell';
import type { Ctx, Room } from '../types';

const CAL = new THREE.Color('#c8f0a0'); // a cal fosforescente (Ficha 1)

export function buildRespiro5(ctx: Ctx): Room {
  const kit = new Kit('crypt');
  // 6 × 6 m (a Ficha pede 4 × 6, teto 2,4: a porta-padrão do jogo tem 2,65 m de altura e o batente ocupa ±1,6 m; para a moldura caber AO LADO
  // da porta, a câmara ficou com 6 m de largura e o teto foi a 3 m, o mínimo que cabe a porta; continua a menor sala do jogo)
  const S = roomShell(kit, { hx: 3.0, z0: -4, h: 3.0, lamps: 1 });
  const { X0, Z0, Z1 } = S;
  kit.batente(0, Z1, -1);
  kit.batente(0, Z0, 1);
  S.decorate();
  kit.wear([[0, 1.7], [0.2, -1], [0, -3.6]], 1.0);

  // ── a moldura de frase vazia (à direita da porta, na parede do fundo) ──
  const FX = 2.29; // (era 2,25: a imposta do batente da porta encostava na laje da moldura; 4 cm de folga; §67)
  const FY = 1.78;
  const FW = 1.06;
  const FH = 0.5;
  const FZ = Z0 + 0.02;
  {
    // a laje lavrada, um pouco saliente
    kit.box(FW + 0.12, FH + 0.12, 0.05, kit.slab, FX, FY, Z0 + 0.025, false);
    // o sulco da moldura e, à direita, o lugar da marca (um quadradinho talhado, vazio)
    const c = document.createElement('canvas');
    c.width = 212;
    c.height = 100;
    const g = c.getContext('2d')!;
    g.clearRect(0, 0, c.width, c.height);
    const groove = (x: number, y: number, w: number, h: number, t: number, col: string) => {
      g.fillStyle = col;
      g.fillRect(x, y, w, t);
      g.fillRect(x, y + h - t, w, t);
      g.fillRect(x, y, t, h);
      g.fillRect(x + w - t, y, t, h);
    };
    groove(4, 4, 204, 92, 6, '#2a2430'); // o sulco
    groove(6, 6, 200, 88, 2, '#8a8478'); // a quina clara
    groove(160, 30, 36, 40, 4, '#2a2430'); // o lugar da marca
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(FW, FH), new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.05, depthWrite: false }));
    frame.position.set(FX, FY, FZ + 0.035);
    kit.group.add(frame);
  }
  // a frase em CAL: escondida; só aparece no escuro (não vai para o caderno sozinha: ctx.seen quando aparece)
  const cal = makeInscription(kit.group, { words: ['abrir', 'porta', 'conf'], x: FX, y: FY, z: FZ + 0.045, nx: 0, nz: 1, size: 0.24, age: 0.05, seed: 41, hidden: true }, []);
  for (const p of cal.panels) {
    p.mat.color.copy(CAL);
    p.mat.emissive.copy(CAL);
    p.mat.emissiveIntensity = 1.2;
    p.mat.fog = false;
  }

  // ── o soquete frio, embaixo da moldura: tigela de bronze rachada num suporte de pedra, sem brasa ──
  const SY = 0.98;
  const sockPos = new THREE.Vector3(FX, SY + 0.12, Z0 + 0.32);
  kit.box(0.34, 0.12, 0.34, kit.stone, FX, SY - 0.06, Z0 + 0.2, false);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.12, 0.13, 10, 1, true), lambert(null, 0x6a5234));
  bowl.position.set(FX, SY + 0.065, Z0 + 0.32);
  kit.add(bowl, false);
  const bowlIn = new THREE.Mesh(new THREE.CircleGeometry(0.17, 10), new THREE.MeshBasicMaterial({ color: 0x1a1412 }));
  bowlIn.rotation.x = -Math.PI / 2;
  bowlIn.position.set(FX, SY + 0.11, Z0 + 0.32);
  kit.add(bowlIn, false);
  // a rachadura e a borda que pega luz
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 4, 16, Math.PI * 1.7), new THREE.MeshBasicMaterial({ color: 0x9a7a4a }));
  rim.rotation.x = -Math.PI / 2;
  rim.position.set(FX, SY + 0.13, Z0 + 0.32);
  kit.add(rim, false);
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
  flame.scale.set(0.32, 0.28, 1);
  flame.position.set(FX, SY + 0.3, Z0 + 0.32);
  flame.visible = false;
  kit.group.add(flame);
  const sockLight = kit.light(FX, SY + 0.5, Z0 + 0.7, 0xff8a2a, 0);
  kit.contact(FX, Z0 + 0.3, 0.8);

  // a luz da sala: fria e pouca (uma tocha baixa perto da entrada)
  kit.torch(X0 + 0.1, 1.7, 0.6, 1, 0, 0.4, 0x9ab0e0, 22);
  kit.soot(X0, 2.2, 0.6, 1, 0, 0.5, 0.8);

  let doorOpen = 0;
  let open = false;
  let lit = 0; // segundos de chama no soquete (a chama dura o escuro e mais um pouco)
  let busy = false; // o escuro em curso
  let revealed = false;
  const gate = shotGate(ctx.die);

  return {
    name: 'A Antecâmara Fria',
    subtitle: 'Uma moldura vazia.',
    group: kit.group,
    surfaces: kit.surfaces,
    emitters: kit.emitters,
    inscriptions: kit.inscriptions,
    interactables: [],
    doorZ: Z0,
    entranceZ: Z1,
    start: new THREE.Vector3(0, 0, 1.2),
    startYaw: 0,
    fog: { color: '#080a10', near: 3, far: 12 },
    ambient: { color: 0x6878a8, intensity: 1.05 },
    boxes: [...S.boxes, ...kit.boxes],
    // o soquete é a única coisa "interessante": o dado da mão olha para ele ao entrar
    sockets: [{ x: sockPos.x, y: sockPos.y, z: sockPos.z, r: 0.35 }],
    rects() {
      return S.rects(doorOpen);
    },
    clampDie: S.clampDie,
    groundY: () => 0,
    surfaceAt: (x, z) => kit.surfaceAt(x, z),
    // o som do lugar (§60): a menor sala do jogo, fria e abafada; pinga num canto
    ambience: { size: 0.1, drips: [{ x: X0 + 0.4, y: 0.1, z: Z0 + 0.6 }] },
    dieFloor: () => 0,
    holdsDie: () => false,
    update(dt, t) {
      kit.tick(dt, t);
      gate.tick();
      // acender o soquete (só com o Fogo; repetível depois que ele esfria)
      if (!busy && ctx.die.face === 3 && (ctx.die.state === 'flying' || ctx.die.state === 'rest') && ctx.die.pos.distanceTo(sockPos) < 0.45 && gate.take()) {
        busy = true;
        lit = 0.001;
        flame.visible = true;
        ctx.sfx('ignite', 'r5');
        // a Casa apaga tudo; no escuro, a porta abre (ouve-se)
        ctx.blackout(4, () => {
          if (!open) {
            open = true;
            ctx.sfx('door');
          }
        });
      }
      // a cal: só aparece no escuro (opacidade = 1 - luz, abaixo de 25% de luz)
      const light = 1 - 0.92 * ctx.dark();
      const v = light < 0.25 ? Math.min(1, (0.25 - light) / 0.12) : 0;
      cal.panels.forEach((_, i) => cal.setReveal(i, v));
      if (v > 0.6 && !revealed) {
        revealed = true;
        for (const w of cal.words) ctx.seen(w);
      }
      if (lit > 0) {
        lit += dt;
        flame.material.map = kit.frame(t * 8);
        sockLight.intensity = 12;
        // depois que a luz volta, a chama se apaga e o soquete esfria
        if (lit > 1.5 && ctx.dark() < 0.02) {
          lit = 0;
          flame.visible = false;
          sockLight.intensity = 0;
          busy = false;
        }
      }
      doorOpen += ((open ? 1 : 0) - doorOpen) * Math.min(1, dt * 2.4);
      S.door.setOpen(doorOpen);
      S.door.lampMats[0].color.setHex(open ? 0xff7a2e : 0x2a2230);
    },
    skip() {
      open = true;
      doorOpen = 1;
    },
    isSolved: () => open,
    reset() {
      // a porta não fecha de novo: uma vez aberta, é corredor
      lit = 0;
      flame.visible = false;
      sockLight.intensity = 0;
      busy = false;
    },
    dispose() {},
  };
}
