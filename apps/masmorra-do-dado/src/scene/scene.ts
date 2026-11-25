// Motor do jogo: renderização pixel art (alvo de baixa resolução + paleta fixa +
// contorno + dithering), mãos no HUD (dado e pedra-sabão), física do dado, movimento
// do jogador, giz livre e a passagem de uma sala para a outra.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { FACES } from '../faces';
import {
  blobShadowTexture,
  dieFaceTexture,
  dieSketchBlend,
  dieRostoBlend,
  faceMarks,
  dieRostoCanvas,
  dieGlowTexture,
  flameFrames,
  soapSideTexture,
  soapTipTexture,
  soapWrapTexture,
} from './textures';
import { Chalk } from './chalk';
import { Sfx, type AudioMode } from './audio';
import { CORRIDOR, dbg } from './kit';
import { createDiaryBook } from '../book/book3d';
import { diary, diaryStore } from '../story/diary';
import { LEX } from '../story/lexicon';
import { dialogue, dialogueStore } from '../story/dialogue';
import { ui } from '../story/ui';
import { MAX_STAGE, progress, progressStore, type Flag } from '../story/progress';
import { chatter, chatterStore } from '../story/chatter';
import { quiz, quizStore, type QuizDef } from '../story/quiz';
import { saves, slotKey, type SlotMeta } from '../story/save';
import { layoutWorld, setWorld } from '../story/worldmap';
import { buildVestibulo } from './rooms/vestibulo';
import { buildFireRoom } from './rooms/fire';
import { buildRespiro5 } from './rooms/respiro5';
import { buildTribunal } from './rooms/tribunal';
import { buildLab } from './rooms/lab';
import type { SketchKind } from './sketch';
import { DieLife, type LifeTarget } from './dielife';
import { layout as bookLayout } from '../book/pages';
import { config, configStore } from '../story/config';
import { FIRE_CASA_ESCREVE, FIRE_CONFIRMA, FIRE_PANO, FIRE_VERDADE } from './rooms/chapter1';
import { buildLousa } from './rooms/lousa';
import { buildFio } from './rooms/fio';
import { buildChamaCurta } from './rooms/chamaCurta';
import { buildRespiro1 } from './rooms/respiro1';
import { buildPonte } from './rooms/ponte';
import { buildRespiro2 } from './rooms/respiro2';
import { buildApelidos } from './rooms/apelidos';
import type { Ctx, DieState, Interactable, Rect, Room, RoomBuilder } from './types';
import type { Emitter } from './kit';
import { LINGER_MS, lineMs } from '../story/writing';
import { makeScribe, type ScribePose } from './scribe';

const FOG = '#0b0912';
// O Vestíbulo (3 salas) abre o jogo; depois vêm a Entrada, a Lacuna e as salas antigas.
// ?lab=1: sala de teste isolada (só a sala nova, com todas as ferramentas e nada salvo no aparelho)
const LAB = new URLSearchParams(location.search).has('lab');
const BUILDERS: RoomBuilder[] = LAB ? [buildLab] : MAIN_BUILDERS();
function MAIN_BUILDERS(): RoomBuilder[] {
  // Capítulo 1 (só Fogo), curva da sessão de projeto de puzzles (PUZZLES_PROPOSTAS.md §2): da sala 3 em diante só sobe. Níveis: 1, 1, 2, 3, 3, 4, 5, 5, 6, 6 ... 10.
  // Faltam (propostas ainda sem detalhe): A Sombra, O Escuro, A Lei Pequena, O Fogo que Corre, Os Que Dizem o Mesmo, A Memória da Casa.
  return [
    (c) => buildVestibulo(c, 1), // O Poço
    (c) => buildVestibulo(c, 2), // O Vestíbulo: o número é exato
    buildLousa, // NÍVEL 2. A LOUSA: acender em grade é escrever; os números são as faces do dado (porta = QUATRO)
    buildFio, // NÍVEL 3. O FIO DE FOGO: o fogo corre por canaletas; «ACENDER DOIS» = duas ignições
    buildRespiro1, // RESPIRO R1 (sem trava): o Corredor dos Nichos e o Pátio da Cisterna; segredos opcionais (folhas dela, o reflexo)
    (c) => buildFireRoom(c, FIRE_CASA_ESCREVE), // NÍVEL 3. A CASA ESCREVE: a lousa da Casa é o mapa do salão (+ constelação C1)
    buildChamaCurta, // NÍVEL 4. TEMPO + PAVIO: as chamas se apagam; um labirinto no chão é um pavio que acende o mínimo do fundo sozinho
    (c) => buildFireRoom(c, FIRE_CONFIRMA), // NÍVEL 5. Duas partes: as marcas numa lousa (QUATRO CONFIRMADO × TRÊS BOATO); depois 3 frases confirmadas -> pilares -> 2, 4, 1, 3
    buildRespiro2, // RESPIRO R2 (sem trava): Os Banhos Secos; piscinas vazias, a fonte seca, o estandarte; puzzle opcional (exatamente DOIS)
    (c) => buildFireRoom(c, FIRE_PANO), // NÍVEL 5. O PANO: o fogo queima o boato tecido e mostra a pedra (+ constelação C2)
    buildApelidos, // NÍVEL 6. OS APELIDOS (rotunda): GRANDE no centro, os outros em cruz; o mesmo braseiro tem dois nomes
    buildPonte, // NÍVEL 6. A PONTE DE MADEIRA: o fosso com rampa em espiral; o fogo queima a ponte e corta o próprio caminho (+ constelação C3)
    (c) => buildFireRoom(c, FIRE_VERDADE), // NÍVEL 6. ACENDER VERDADE: boatos verdadeiros também; a Casa julga na frase da porta
    buildRespiro5, // RESPIRO R5 A ANTECÂMARA FRIA (sem puzzle): o soquete frio traz o escuro e a cal na moldura; a porta abre (no plano: entre as salas 16 e 17)
    buildTribunal, // NÍVEL 10 (provisório aqui; a posição final é a sala 18)
    // Reserva (fora do jogo por ora): vestibulo.ts v3 (Os Quatro) e FIRE_ORDEM (A Ordem), que as novas 3 e 5 substituem; room1.ts (A Entrada, cena do
    // Escrivão que dá o giz), vestibulo.ts v4 (A Lacuna), room2.ts (O Selo), room3.ts (O Salão das Brasas), room4.ts (O Mirante); FIRE_SEGREDO
    // (A Confirmação, Mastermind) em fireRooms.ts; lab.ts (A Placa que Julga). Usam Peso e giz, que só chegam nos capítulos 2 e 3.
  ];
}

// Ordem dos materiais do BoxGeometry: +x, -x, +y, -y, +z, -z (opostas somam 7).
const DIE_FACES = [3, 4, 1, 6, 2, 5];
// Rotação que leva a normal de cada face para +z (de frente pra câmera).
const FACE_EULER: Record<number, [number, number, number]> = {
  1: [Math.PI / 2, 0, 0],
  2: [0, 0, 0],
  3: [0, -Math.PI / 2, 0],
  4: [0, Math.PI / 2, 0],
  5: [0, Math.PI, 0],
  6: [-Math.PI / 2, 0, 0],
};

export interface StickState {
  active: boolean;
  ox: number; // onde o dedo encostou (coordenadas da tela)
  oy: number;
  x: number; // -1..1
  y: number;
}

export type Tool = 'die' | 'chalk';
export type ChalkMode = 'draw' | 'erase';

export interface SceneOptions {
  onStick?: (s: StickState) => void;
  onCaption?: (title: string, sub: string, color: string) => void;
  onComplete?: (info: { gem: boolean }) => void;
  onDie?: (state: 'hand' | 'flying' | 'rest') => void;
  onTool?: (tool: Tool) => void;
  onLook?: (s: 'locked' | 'free' | 'denied') => void; // mouse capturado, solto ou negado (PC)
  onPrompt?: (label: string | null) => void; // algo ao alcance para interagir ("Tentar abrir")
  onInventory?: (inv: { die: boolean; chalk: boolean }) => void; // o que o jogador já tem nas mãos
  title?: boolean; // começa na TELA INICIAL (a câmera olha o poço de baixo; o jogo só começa com begin())
  onPause?: () => void;
  onCine?: (on: boolean) => void; // cena em curso: a interface esconde a mira // o mouse foi solto no meio do jogo (Esc no PC): abrir a pausa
}

export interface SceneApi {
  playUi(name: 'uiblip' | 'uiopen' | 'uiclose' | 'uinew' | 'write', v?: number): void; // sons da interface (conversa e diário)
  action(): void; // arremessa ou recolhe
  place(): void; // posiciona o dado com cuidado onde a mira aponta
  rotate(): void; // próxima face
  swapTool(): void; // troca entre dado e giz na mão principal
  setAudio(m: AudioMode): void; // 0 tudo · 1 só efeitos · 2 mudo
  setChalkMode(m: ChalkMode): void; // (celular) desenhar ou apagar com o dedo
  clearChalk(): void; // apaga tudo (pede confirmação: aperte de novo)
  reset(): void; // reinicia a sala atual
  restart(): void; // volta pra primeira sala
  titleLook(x: number, y: number): void;
  titleMood(m: 'new' | 'quit' | null): void;
  titleCredits(on: boolean): void;
  titleNew(done: () => void): void;
  titleGo(done?: () => void, reload?: boolean): void;
  fadeInFromBlack(): void;
  begin(): void; // sai da tela inicial: continua do último ponto salvo do espaço ativo (ou acorda, num jogo novo)
  toTitle(): void; // salva e volta à tela inicial
  saveNow(): void; // salva agora (pausa, sair)
  lock(): void; // (PC) captura o mouse de novo (precisa de um clique ou tecla)
  dispose(): void;
}

export function createScene(canvas: HTMLCanvasElement, opts: SceneOptions = {}): SceneApi {
  // som: só liga depois do primeiro toque/tecla (regra dos navegadores)
  const sfx = new Sfx();
  const unlockAudio = () => sfx.unlock();
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio);
  const onVis = () => sfx.suspend(document.hidden);
  document.addEventListener('visibilitychange', onVis);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.autoClear = false;
  renderer.info.autoReset = false; // contamos as chamadas do quadro inteiro (cena + HUD + pós)
  renderer.setPixelRatio(1);
  renderer.setClearColor(FOG, 1);
  // sombras: só a luz principal de algumas salas projeta (mapa pequeno e filtro duro, que combina com o pixel); o motor liga a atualização
  // do mapa só na sala dela (Room.shadowLight)
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  renderer.shadowMap.autoUpdate = false;

  // sala (com textura de profundidade, usada pro contorno) e dado/pedra do HUD
  const rt = new THREE.WebGLRenderTarget(64, 64, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.HalfFloatType,
    depthTexture: Object.assign(new THREE.DepthTexture(64, 64), { type: THREE.UnsignedIntType }),
  });
  const rtHud = new THREE.WebGLRenderTarget(64, 64, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.HalfFloatType,
  });
  // a última imagem pronta, guardada para as transições em pontilhado (tela inicial → jogo)
  const rtSnap = new THREE.WebGLRenderTarget(64, 64, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const CAM_NEAR = 0.15;
  const CAM_FAR = 40;

  // Paleta fixa (estilo pixel art de verdade): cada pixel vira a cor mais
  // próxima desta lista, com um dithering ordenado bem leve só pra suavizar.
  const PALETTE = [
    '#000000', '#0b0912', '#1c1b26', '#2c2a3e', '#403e56', '#55536e', '#6e6c8a', '#8e8ca8', '#b8b4cc', '#e4e0f0',
    '#1d1816', '#3a2a28', '#5a4540', '#7a5e54', '#9c7d6c', '#c2a48e',
    '#2a180e', '#3a2214', '#4a2c1c', '#7a3420', '#8c4228', '#a05030', '#5a3a20', '#6a4028', '#7a5030', '#8c5a38', '#a06a3c', '#b07a4c', '#c88a4c', '#d8a070', '#e8b878', '#f0c890', '#ffe0b0',
    '#5a1a10', '#a8321a', '#ff5a1f', '#ffb02e', '#fff3a8',
    '#123a4a', '#1f7a90', '#2ab8d6', '#6ff0ff', '#d8ffff',
    '#6a4a1a', '#a87a28', '#d4ac4e', '#f0d880',
    '#4a1020', '#a02840', '#ff4d6d',
    '#1a3a30', '#3a7a62', '#7fffb0',
    '#4a3a7a', '#7a5ab0', '#b18cff',
    '#1c2438', '#2c3a58', '#3e4e76', '#5a6e98', '#8098c0', '#aabcdc',
    '#5e7068', '#7f958c', '#a9bdb2', '#e9f0e6',
    '#ffffff',
  ];
  const palVec = PALETTE.map((h) => {
    const n = parseInt(h.slice(1), 16);
    return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  });

  // Tabela 3D (cor → cor mais próxima da paleta): troca o laço de ~60 comparações por pixel
  // por uma única leitura de textura.
  const LUT = 48;
  const lutData = new Uint8Array(LUT * LUT * LUT * 4);
  for (let bz = 0; bz < LUT; bz++) {
    for (let gy = 0; gy < LUT; gy++) {
      for (let rx = 0; rx < LUT; rx++) {
        const cr = (rx + 0.5) / LUT;
        const cg = (gy + 0.5) / LUT;
        const cb = (bz + 0.5) / LUT;
        let best = 0;
        let bd = 1e9;
        for (let i = 0; i < palVec.length; i++) {
          const p = palVec[i];
          const d = (cr - p.x) ** 2 * 0.6 + (cg - p.y) ** 2 + (cb - p.z) ** 2 * 0.45;
          if (d < bd) {
            bd = d;
            best = i;
          }
        }
        const o = ((bz * LUT + gy) * LUT + rx) * 4;
        lutData[o] = Math.round(palVec[best].x * 255);
        lutData[o + 1] = Math.round(palVec[best].y * 255);
        lutData[o + 2] = Math.round(palVec[best].z * 255);
        lutData[o + 3] = 255;
      }
    }
  }
  const lutTex = new THREE.Data3DTexture(lutData, LUT, LUT, LUT);
  lutTex.format = THREE.RGBAFormat;
  lutTex.type = THREE.UnsignedByteType;
  lutTex.minFilter = THREE.NearestFilter;
  lutTex.magFilter = THREE.NearestFilter;
  lutTex.unpackAlignment = 1;
  lutTex.needsUpdate = true;

  // ── pós-processo: contorno + paleta + dithering ─────────────────────────
  const postScene = new THREE.Scene();
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postMat = new THREE.ShaderMaterial({
    uniforms: {
      tRoom: { value: rt.texture },
      tDepth: { value: rt.depthTexture },
      tHud: { value: rtHud.texture },
      uRes: { value: new THREE.Vector2(64, 64) },
      uNear: { value: CAM_NEAR },
      uFar: { value: CAM_FAR },
      tLut: { value: lutTex },
      uBloom: { value: 1 },
      uBright: { value: 1 },
      uGlowK: { value: 0.16 },
      uBlur: { value: 0 },
      uFocus: { value: 1 },
      tSnap: { value: rtSnap.texture },
      uDis: { value: -1 },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform sampler2D tRoom; uniform sampler2D tDepth; uniform sampler2D tHud;
      uniform vec2 uRes; uniform float uNear; uniform float uFar;
      uniform highp sampler3D tLut;
      uniform float uBloom;
      uniform float uBright;
      uniform float uGlowK;
      uniform float uBlur; // profundidade de campo da tela inicial: o chão em volta do dado nítido, o resto da sala desfocado
      uniform float uFocus; // a distância (m) em que está o dado (o plano em foco)
      uniform sampler2D tSnap;
      uniform float uDis; // transição em pontilhado: < 0 desligada; 0..1 = quanto da imagem nova já apareceu
      varying vec2 vUv;
      float bayer2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
      float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
      // inverso da distância: varia de forma LINEAR na tela dentro de uma superfície
      // plana, então a derivada segunda só "acende" nas bordas de objetos.
      float invZ(vec2 uv){
        if (texture2D(tHud, uv).a > 0.5) return 2.5;
        float d = texture2D(tDepth, uv).r;
        float z = uNear * uFar / (uFar - d * (uFar - uNear));
        return 1.0 / z;
      }
      void main(){
        vec2 o = 1.0 / uRes;
        vec4 hud = texture2D(tHud, vUv);
        vec3 room = texture2D(tRoom, vUv).rgb;
        float coc = 0.0; // círculo de confusão: 0 no plano do dado, 1 longe dele
        if (uBlur > 0.01) {
          float dz = texture2D(tDepth, vUv).r;
          float zl = uNear * uFar / (uFar - dz * (uFar - uNear));
          coc = clamp(abs(zl - uFocus) / max(zl, 0.05) * 1.5 - 0.22, 0.0, 1.0);
        }
        if (uBlur > 0.01 && hud.a < 0.5 && coc > 0.02) {
          vec3 acc = room;
          for (int k = 0; k < 14; k++) {
            float a = float(k) * 2.39996;
            float r = (0.6 + float(k) * 0.16) * uBlur * coc;
            acc += texture2D(tRoom, vUv + vec2(cos(a), sin(a)) * o * r).rgb;
          }
          room = acc / 15.0;
        }
        vec3 c = hud.a > 0.5 ? hud.rgb : room;
        float ic = invZ(vUv);
        float lx = invZ(vUv - vec2(o.x, 0.0)) + invZ(vUv + vec2(o.x, 0.0)) - 2.0 * ic;
        float ly = invZ(vUv - vec2(0.0, o.y)) + invZ(vUv + vec2(0.0, o.y)) - 2.0 * ic;
        float edge = step(0.1 * ic + 0.025, max(lx, ly)) * (hud.a > 0.5 ? 1.0 : 1.0 - min(1.0, uBlur * 0.5 * coc));
        // brilho (bloom barato): luz forte "vaza" pros pixels vizinhos
        if (hud.a < 0.5 && uBloom > 0.5) {
          vec3 glow = vec3(0.0);
          for (int k = 0; k < 8; k++) {
            float a = float(k) * 0.7853982;
            vec3 sm = texture2D(tRoom, vUv + vec2(cos(a), sin(a)) * o * 2.5).rgb;
            glow += max(sm - 0.7, 0.0);
          }
          c += glow * uGlowK;
        }
        c = clamp(c * uBright, 0.0, 1.0);
        c = pow(c, vec3(1.0 / 2.2));
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(vec3(l), c, 1.0);
        c *= mix(1.0, 0.32, edge);
        c += (bayer4(floor(vUv * uRes)) - 0.47) * 0.035;
        gl_FragColor = vec4(texture(tLut, clamp(c, 0.0, 1.0)).rgb, 1.0);
        if (uDis >= 0.0 && bayer4(floor(vUv * uRes)) >= uDis * 1.0) gl_FragColor = texture2D(tSnap, vUv);
      }`,
    depthTest: false,
    depthWrite: false,
  });
  const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat);
  postQuad.frustumCulled = false;
  postScene.add(postQuad);
  // ── sala e cena ─────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  // `ambient` é a luz ambiente "lógica" de cada sala (cor e força vêm da sala e da história). Na cena ela é repartida em três luzes que DEFINEM
  // as formas: uma ambiente menor, uma luz de cima (o que olha para cima fica mais claro, o que olha para baixo, mais escuro: pisos de degrau
  // claros, espelhos e o avesso das coisas mais escuros) e uma luz fraca de lado (paredes que se encontram num canto não ficam do mesmo tom).
  const ambient = new THREE.AmbientLight(0x7a78b8, 1.9);
  const ambReal = new THREE.AmbientLight(0x7a78b8, 1.9);
  const hemi = new THREE.HemisphereLight(0x7a78b8, 0x1e1c2a, 1);
  const sideKey = new THREE.DirectionalLight(0xffffff, 0);
  sideKey.position.set(0.55, 0.35, 0.75); // de cima, à direita, de quem entra (o mesmo em todas as salas)
  scene.add(ambReal, hemi, sideKey);
  const AMB_K = 0.56;
  const HEMI_K = 0.62;
  const SIDE_K = 0.16;
  // ── O ESCURO da Casa (ctx.blackout): a luz cai a ~8% ──
  let darkK = 0; // 0 = luz normal, 1 = escuro
  let darkHold = 0; // segundos de escuro que faltam
  let darkQ: { secs: number; onDark?: () => void } | null = null; // pedido esperando a conversa acabar
  let darkCb: (() => void) | null = null;
  const lightScale = () => 1 - 0.92 * darkK;
  const shapeLight = () => {
    ambReal.color.copy(ambient.color);
    ambReal.intensity = ambient.intensity * AMB_K * lightScale();
    hemi.color.copy(ambient.color);
    hemi.groundColor.copy(ambient.color).multiplyScalar(0.22);
    hemi.intensity = ambient.intensity * HEMI_K * lightScale();
    sideKey.color.copy(ambient.color);
    sideKey.intensity = ambient.intensity * SIDE_K * lightScale();
  };
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  let yaw = 0;
  let pitch = -0.04;
  const camera = new THREE.PerspectiveCamera(66, 1, CAM_NEAR, CAM_FAR);
  camera.rotation.order = 'YXZ';
  scene.add(camera);
  // preto que cobre a tela (cena de acordar): é um plano colado na câmera, então passa pelo mesmo filtro pixelado
  const fadeMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false });
  const fadeQuad = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), fadeMat);
  fadeQuad.position.z = -0.3;
  fadeQuad.renderOrder = 999;
  fadeQuad.frustumCulled = false;
  fadeQuad.visible = false;
  camera.add(fadeQuad);
  // Luz presa à câmera, na cor da face escolhida: tinge de leve o que está perto.
  const accentLight = new THREE.PointLight(0x5be7ff, 5, 0, 2);
  accentLight.position.set(0.35, -0.3, -0.6);
  camera.add(accentLight);
  let fogColor = FOG;

  // ── o dado ──────────────────────────────────────────────────────────────
  // Cubo arredondado de obsidiana com filete dourado e gemas no lugar dos
  // pontos (cada face com a cor da sua habilidade; as bloqueadas ficam
  // apagadas). A face ESCOLHIDA é sempre a que está virada pra CIMA.
  const makeMats = () =>
    DIE_FACES.map((n) => {
      const f = FACES[n - 1];
      return new THREE.MeshLambertMaterial({
        map: dieFaceTexture(n, f.color, !f.unlocked),
        emissive: 0xffffff,
        emissiveMap: dieGlowTexture(n, f.color, !f.unlocked),
        emissiveIntensity: 0.5,
      });
    });
  const dieMats = makeMats(); // dado arremessado (dentro da sala)
  const handMats = makeMats(); // dado do HUD: escurece enquanto o outro está fora
  const dieGeo = new RoundedBoxGeometry(1, 1, 1, 4, 0.15);
  // rebites dourados nos 8 cantos
  const studGeo = new THREE.IcosahedronGeometry(0.075, 1);
  const studMat = new THREE.MeshLambertMaterial({ color: 0xd4ac4e, emissive: 0x6a4a10, emissiveIntensity: 0.6 });
  const buildDie = (mats: THREE.Material[]) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(dieGeo, mats));
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      const st = new THREE.Mesh(studGeo, studMat);
      st.position.set(sx * 0.41, sy * 0.41, sz * 0.41);
      g.add(st);
    }
    return g;
  };

  // dado do HUD: cena separada, desenhada por cima da sala, sempre visível
  const dieScene = new THREE.Scene();
  dieScene.add(new THREE.AmbientLight(0x9a8aa8, 1.6));
  const key = new THREE.DirectionalLight(0xffe2b8, 2.2);
  key.position.set(-1, 1.6, 1.4);
  dieScene.add(key);
  const fill = new THREE.DirectionalLight(0x6a88ff, 0.7);
  fill.position.set(1.2, -0.6, 1);
  dieScene.add(fill);
  const dieCam = new THREE.PerspectiveCamera(45, 1, 0.05, 10);
  const dieGroup = new THREE.Group();
  dieScene.add(dieGroup);
  const dieHolder = new THREE.Group();
  dieGroup.add(dieHolder);
  dieHolder.add(buildDie(handMats));
  // tela inicial: quanto a sala desfoca
  const TB = { blur: 0.9 };
  // Na tela inicial o dado da mão é desenhado com a CÂMERA DO MUNDO, no ponto do chão da sala em que ele caiu (perspectiva e profundidade da
  // sala), mas continua na camada dele (luz própria, nítido, sem o bloom da sala). No jogo, com a câmera do HUD.
  let dieInWorld = false;
  // onde o dado da mão está na tela (NDC)
  const dieOnScreen = (out: THREE.Vector3) => out.copy(dieGroup.position).project(dieInWorld ? camera : dieCam);
  // TELA INICIAL: uma luz fria de trás no dado do HUD (o feixe do poço). O chão e o entulho em volta dele são os DA SALA (ver titlePose)
  const titleRim = new THREE.DirectionalLight(0xc8d6ff, 0);
  titleRim.position.set(-0.4, 1.2, -1.6);
  dieScene.add(titleRim);

  // dado arremessado: vive dentro da sala, com física própria
  const worldDie = new THREE.Group();
  const worldModel = buildDie(dieMats);
  worldModel.scale.setScalar(0.42);
  worldDie.add(worldModel);
  worldDie.visible = false;
  scene.add(worldDie);
  // sombra de contato do dado no mundo (pontilhada): embaixo dele no chão; maior e mais fraca quanto mais alto ele está
  const dieShadowMat = new THREE.MeshBasicMaterial({ map: blobShadowTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -3 });
  const dieShadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), dieShadowMat);
  dieShadow.rotation.x = -Math.PI / 2;
  dieShadow.renderOrder = 3;
  dieShadow.visible = false;
  scene.add(dieShadow);
  // o CORPO do jogador para as sombras: invisível (não pinta nada), mas projeta a sombra dele quando há uma luz que projeta sombra
  const bodyMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const body = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 1.3, 8), bodyMat);
  torso.position.y = 0.75;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), bodyMat);
  head.position.y = 1.55;
  for (const m of [torso, head]) {
    m.castShadow = true;
    body.add(m);
  }
  scene.add(body);
  // "fantasma" do dado: mostra onde ele ficaria se for posicionado
  const ghostMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false, fog: false });
  const ghost = new THREE.Mesh(dieGeo, ghostMat);
  ghost.scale.setScalar(0.42);
  ghost.visible = false;
  scene.add(ghost);

  // visto de cima e de frente, girando devagar em torno do eixo vertical
  const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.42, 0, 0)); // pouca inclinação: o rosto da frente fica reto para o jogador, e ainda se vê um pouco da face de cima
  const targetQ = new THREE.Quaternion();
  const curQ = new THREE.Quaternion();
  const wobble = new THREE.Quaternion();
  const wobbleEuler = new THREE.Euler();
  const spinQ = new THREE.Quaternion();
  const Y_AXIS = new THREE.Vector3(0, 1, 0);
  const faceQ = (n: number) => {
    const [x, y, z] = FACE_EULER[n] ?? FACE_EULER[1];
    return new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
  };
  // leva a face n para CIMA (+y)
  const upQ = (n: number) => new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)).multiply(faceQ(n));
  const tiltNow = new THREE.Quaternion(); // a inclinação do dado: some na cena (o dado fica de frente, sem inclinar)
  const idQ = new THREE.Quaternion();
  const lifeQ = new THREE.Quaternion();
  const computeTarget = (n: number, spin: number) =>
    targetQ.copy(tiltNow).multiply(spinQ.setFromAxisAngle(Y_AXIS, spin)).multiply(upQ(n));

  let face = 1; // face escolhida (virada pra cima no HUD)
  let rostosDirty = false; // a face escolhida mudou: refazer os rostos
  let thrownFace = 3; // face do dado que está lá fora
  let dieThrown = true; // false = foi posicionado (não pega a gema)
  let handDim = 0; // 0 = dado na mão, 1 = dado lá fora
  let burnHeat = 0; // 0..1: o dado esquentando na cena de queimar
  let talkGlow = 0; // o dado caído brilha quando fala
  let handTalk = 0; // o dado da mão pulsa quando fala
  // ── o dado vivo: olha, pisca, se assusta, cochila (ver dielife.ts) ──
  const rostoP = [0, 0, 0, 0, 0, 0]; // 0..1: quanto cada face é rosto agora
  let eyesShut = false; // (tela inicial: o piscar lento antes do jogo novo)
  const life = new DieLife();
  let lifeGlow = 1; // multiplicador do brilho das gemas vindo da "vida"
  const dieNdc = new THREE.Vector3();
  const tgtNdc = new THREE.Vector3();
  const lookedPos = new THREE.Vector3(); // última inscrição que o jogador encarou
  let lookedT = 99; // há quanto tempo
  // para onde o dado olha agora: inscrição encarada > braseiro à frente > porta > nada (ele vagueia)
  let titleTarget: LifeTarget | null = null; // tela inicial: para onde o olho do dado vai (o mouse, a opção marcada, o dedo)
  const lifeTarget = (): LifeTarget | null => {
    if (mode === 'title') return titleTarget;
    if (dieCineTarget > 0.5) return { dx: 0, dy: 0, player: true }; // na cena, o dado olha DIRETO para o jogador
    if (forcedLook && performance.now() < forcedLook.until) {
      // o dado MOSTRA uma coisa (apontar): inclina-se para ela, com vontade
      dieOnScreen(dieNdc);
      tgtNdc.copy(forcedLook.p).project(camera);
      const fx = tgtNdc.x - dieNdc.x;
      const fy = tgtNdc.y - dieNdc.y;
      if (Number.isFinite(fx + fy)) return { dx: fx, dy: fy, eager: true, player: false };
    }
    camera.getWorldDirection(lookDir);
    const pick = (p: THREE.Vector3, minCos: number, maxD: number): number => {
      toIns.copy(p).sub(camera.position);
      const d = toIns.length();
      if (d > maxD || d < 0.3) return -1;
      toIns.divideScalar(d);
      const c = lookDir.dot(toIns);
      return c > minCos ? c : -1;
    };
    const ndcOf = (p: THREE.Vector3, eager = false, player = false): LifeTarget | null => {
      dieOnScreen(dieNdc);
      tgtNdc.copy(p).project(camera);
      const dx = tgtNdc.x - dieNdc.x;
      const dy = tgtNdc.y - dieNdc.y;
      return Number.isFinite(dx + dy) ? { dx, dy, eager, player } : null;
    };
    if (lookedT < 1.6) return ndcOf(lookedPos);
    if (dieState === 'hand') {
      const eagerFire = hasDie && tool === 'die' && face === 3;
      let best: THREE.Vector3 | null = null;
      let bc = 0;
      const sp = new THREE.Vector3();
      for (const i of activeRooms) {
        for (const s of rooms[i].sockets ?? []) {
          if (s.r <= 0) continue; // pilar ainda escondido: o dado não o "vê"
          sp.set(s.x, s.y, s.z).add(offs[i]);
          const c = pick(sp, 0.35, 7);
          if (c > bc) {
            bc = c;
            best = sp.clone();
          }
        }
      }
      if (best) return ndcOf(best, eagerFire);
      const r = rooms[curRoom];
      if (r) {
        sp.set(0, 1.4, r.doorZ).add(offs[curRoom]);
        if (pick(sp, 0.6, 10) > 0) return ndcOf(sp);
      }
    }
    return null;
  };
  // fala do dado (balão): da mão ou, antes de pegá-lo, do dado caído no chão.
  // As falas da HISTÓRIA têm prioridade: enquanto uma está sendo escrita ou lida (`talkUntil`), a tradução por desenho e os comentários soltos esperam
  // (antes os dois disputavam o mesmo balão e um apagava o outro no meio da escrita).
  let talkUntil = 0;
  // a boca mexe enquanto a fala está sendo ESCRITA no balão (o tempo real de escrita de cada fala)
  let mouthUntil = 0;
  let mouthId = -1;
  const talkingNow = () => {
    const ch = chatterStore.get();
    if (ch && ch.id !== mouthId) {
      mouthId = ch.id;
      mouthUntil = performance.now() + lineMs(ch.glyphs, !!ch.pic);
    }
    return !!ch && performance.now() < mouthUntil;
  };
  let forcedLook: { p: THREE.Vector3; until: number } | null = null;
  const saySay = (glyphs: string[], o?: { pic?: string; delay?: number; joy?: boolean }) => {
    talkUntil = Math.max(talkUntil, performance.now() + (o?.delay ?? 0) * 1000 + 150 + lineMs(glyphs, !!o?.pic) + LINGER_MS);
    window.setTimeout(() => {
      if (!hasDie && !worldDie.visible) return;
      chatter.say(glyphs, o?.pic);
      handTalk = 1;
      handPop = Math.max(handPop, 0.5);
      chatCool = Math.max(chatCool, 30); // depois de falar de propósito, fica calado um tempo
      sfx.play('uiblip', 0.6);
      if (o?.joy) life.react('joy');
    }, (o?.delay ?? 0) * 1000);
  };
  // posição do dado na tela, em % da janela (o balão de fala se centra nela)
  let dieUp = 19;
  let dieCssX = -1;
  let dieCssY = -1;
  const publishDieScreen = () => {
    // de onde o balão de fala sai: do dado da mão, ou (antes de o jogador pegá-lo) do dado caído no chão
    let x: number;
    let y: number;
    let up: number;
    if (dieGroup.visible || !worldDie.visible) {
      dieOnScreen(dieNdc);
      x = ((dieNdc.x + 1) / 2) * 100;
      y = ((1 - dieNdc.y) / 2) * 100;
      up = 19 + 15 * dieCine; // o balão sobe junto quando o dado cresce na cena
    } else {
      // a ponta do balão no TOPO do dado (com o zoom da abertura ele fica grande: o balão não cobre o rosto)
      dieNdc.copy(worldDie.position).setY(worldDie.position.y + 0.42 * worldModel.scale.x + 0.05).project(camera);
      x = Math.max(14, Math.min(86, ((dieNdc.x + 1) / 2) * 100));
      y = Math.max(26, Math.min(92, ((1 - dieNdc.y) / 2) * 100));
      up = 2;
    }
    if (Math.abs(x - dieCssX) > 0.15 || Math.abs(y - dieCssY) > 0.15) {
      dieCssX = x;
      dieCssY = y;
      const st = document.documentElement.style;
      st.setProperty('--die-x', `${x.toFixed(2)}%`);
      st.setProperty('--die-y', `${y.toFixed(2)}%`);
    }
    if (Math.abs(up - dieUp) > 0.2) {
      dieUp = up;
      document.documentElement.style.setProperty('--die-up', `${up.toFixed(1)}vh`);
    }
  };
  // ── o dado "traduz" o glifo: ao olhar uma palavra que tem desenho, a face de CIMA mostra o rabisco por alguns segundos ──
  const SKETCH_WORDS: Record<string, SketchKind> = { brasa: 'braseiro', acender: 'chama', porta: 'porta', placa: 'placa' }; // palavra (id do léxico) -> desenho
  const SKETCH_MAX = 3; // só nas primeiras vezes que a palavra aparece: a ajuda diminui
  const SKETCH_KEY = slotKey('sketch');
  const SKETCH_SPIN = 0; // giro (rad) em que o desenho fica de pé para quem olha; o dado para de girar enquanto ele aparece
  const sketchCount: Record<string, number> = (() => {
    try {
      return JSON.parse(localStorage.getItem(SKETCH_KEY) || '{}');
    } catch {
      return {};
    }
  })();
  // linha do tempo (s): 0 a 0,4 as gemas escurecem e o dado dá um impulso; 0,4 a 1,3 o desenho entra pontilhado; ~1,3 o dado FALA (glifo + desenho);
  // segura; nos últimos 0,9 s o desenho se desfaz do mesmo jeito e as gemas voltam.
  const SK_IN0 = 0.4;
  const SK_IN1 = 1.3;
  const SK_LIFE = 6;
  const SK_OUT = 0.9;
  let sketchOn: {
    i: number;
    age: number;
    word: string;
    kind: SketchKind;
    spoke: boolean;
    map: THREE.Texture | null;
    em: THREE.Texture | null;
    blend: ReturnType<typeof dieSketchBlend>;
  } | null = null;
  const endSketch = () => {
    if (!sketchOn) return;
    const m = handMats[sketchOn.i];
    m.map = sketchOn.map;
    m.emissiveMap = sketchOn.em;
    m.needsUpdate = true;
    sketchOn.blend.dispose();
    sketchOn = null;
  };
  // 0 = face normal, 1 = desenho inteiro
  const sketchP = () => {
    if (!sketchOn) return 0;
    const a = sketchOn.age;
    const k = a < SK_IN1 ? Math.max(0, (a - SK_IN0) / (SK_IN1 - SK_IN0)) : a > SK_LIFE - SK_OUT ? Math.max(0, (SK_LIFE - a) / SK_OUT) : 1;
    return k * k * (3 - 2 * k);
  };
  const showSketch = (word: string, force = false) => {
    const kind = SKETCH_WORDS[word];
    if (!kind || sketchOn) return;
    if (!force && performance.now() < talkUntil) return; // o dado está no meio de uma fala da história
    if (!force) {
      if ((sketchCount[word] ?? 0) >= SKETCH_MAX) return;
      sketchCount[word] = (sketchCount[word] ?? 0) + 1;
      try {
        localStorage.setItem(SKETCH_KEY, JSON.stringify(sketchCount));
      } catch {
        /* sem armazenamento: tudo bem */
      }
    }
    const i = DIE_FACES.indexOf(face);
    const f = FACES[face - 1];
    const m = handMats[i];
    const blend = dieSketchBlend(face, f.color, !f.unlocked, kind);
    sketchOn = { i, age: 0, word, kind, spoke: false, map: m.map, em: m.emissiveMap, blend };
    m.map = blend.map; // com p = 0 a mistura é idêntica à face normal: nenhum salto
    m.emissiveMap = blend.glow;
    m.needsUpdate = true;
    handPop = Math.max(handPop, 0.5); // o impulso do dado
    chatCool = Math.max(chatCool, 20); // não fala outra coisa por cima
  };
  const updateMats = () => {
    DIE_FACES.forEach((n, i) => {
      handMats[i].emissiveIntensity = (n === face ? 1.6 : 0.5) * (1 - 0.65 * handDim) * (1 + 1.6 * handTalk) * (sketchOn && sketchOn.i === i ? 1 + 0.5 * sketchP() : 1) * (sketchOn && sketchOn.age < SK_IN0 ? 1 - 0.6 * (sketchOn.age / SK_IN0) : 1) * lifeGlow * (1 + 0.7 * rostoP[i])
      handMats[i].color.setScalar(1 - 0.5 * handDim);
      dieMats[i].emissiveIntensity = (n === thrownFace ? 1.4 : 0.5) * (1 + 2.2 * burnHeat + 2.4 * talkGlow);
    });
  };
  const applyFace = (n: number) => {
    endSketch();
    face = n;
    rostosDirty = true;
    updateMats();
    accentLight.color.set(FACES[n - 1]?.color ?? '#ffffff');
  };
  applyFace(3); // o jogo começa na face Fogo
  computeTarget(face, 0);
  // ── o ROSTO de cada número: a face virada para o jogador (a de baixo, que ele vê de frente) vira um rosto; as gemas viram os olhos (ver `dieRostoBlend`) ──
  let rostos: ReturnType<typeof dieRostoBlend>[] = [];
  const rostoLast = [0, 0, 0, 0, 0, 0];
  const rostoKey: string[] = ['', '', '', '', '', ''];
  // quantos giros de 90° cada face lateral precisa para o rosto ficar de pé quando ela vem para a frente (depende da face escolhida, que fica em cima)
  const FACE_UP = [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 1, 0)];
  const faceTurn = (i: number) => {
    const q = upQ(face);
    const nw = new THREE.Vector3().copy(FACE_N_LOCAL[i]).applyQuaternion(q);
    if (Math.abs(nw.y) > 0.9) return 0; // a de cima (escolhida) e a de baixo
    const up = new THREE.Vector3().copy(FACE_UP[i]).applyQuaternion(q);
    up.applyAxisAngle(Y_AXIS, -Math.atan2(nw.x, nw.z)); // traz a face para a frente do jogador
    const k = Math.round(Math.atan2(up.x, up.y) / (Math.PI / 2));
    return (4 - (((k % 4) + 4) % 4)) % 4; // giros horários para desfazer a rotação
  };
  const buildRostos = () => {
    rostos.forEach((r) => r.dispose());
    rostos = DIE_FACES.map((n, i) => {
      const f = FACES[n - 1];
      const b = dieRostoBlend(n, f.color, !f.unlocked, faceTurn(i));
      handMats[i].map = b.map;
      handMats[i].emissiveMap = b.glow;
      handMats[i].needsUpdate = true;
      b.set(rostoP[i]);
      rostoKey[i] = '';
      return b;
    });
  };
  const FRONT = new THREE.Vector3(0, -0.72, 0.7).normalize(); // para o jogador e para baixo
  const FACE_N_LOCAL = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)];
  const FACE_N = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)];
  const nW = new THREE.Vector3();
  const updateRostos = (dt: number) => {
    if (rostosDirty) {
      rostosDirty = false;
      buildRostos(); // a face escolhida mudou: as faces laterais giram de outro jeito
    }
    FRONT.set(0, -0.72 * (1 - dieCine), 0.7 + 0.3 * dieCine).normalize(); // na cena, o rosto fica de frente (sem inclinar)
    DIE_FACES.forEach((_, i) => {
      nW.copy(FACE_N[i]).applyQuaternion(dieHolder.quaternion);
      const d = nW.dot(FRONT);
      const k = Math.max(0, Math.min(1, (d - 0.55) / 0.33));
      const target = k * k * (3 - 2 * k);
      rostoP[i] += (target - rostoP[i]) * Math.min(1, dt * 5);
      // o rosto que está à vista olha em volta: os olhos e as sobrancelhas acompanham o olhar do dado (só refaz a textura quando o olhar muda um pixel)
      if (rostoP[i] > 0.05 && rostos[i]) {
        const lk = life.out.look;
        const q = {
          ex: Math.round(lk.x * 5),
          ey: Math.round(-lk.y * 4),
          by: Math.round(-lk.brow * 3),
          closed: lk.closed || eyesShut,
          mo: eyesShut ? 0 : Math.round(lk.mouth * 4),
          mx: Math.round(lk.mx * 2),
          mw: Math.round(lk.mw * 3),
          sq: Math.round(lk.squint * 3),
          nose: lk.nose,
        };
        const key = `${q.ex},${q.ey},${q.by},${q.closed},${q.mo},${q.mx},${q.mw},${q.sq},${q.nose}`;
        if (rostoKey[i] !== key) {
          rostoKey[i] = key;
          rostos[i].setLook(q);
        }
      }
      if (Math.abs(rostoP[i] - rostoLast[i]) > 0.03 || (rostoP[i] < 0.005 && rostoLast[i] > 0) || (rostoP[i] > 0.995 && rostoLast[i] < 1)) {
        if (!(sketchOn && sketchOn.i === i)) rostos[i]?.set(rostoP[i]);
        rostoLast[i] = rostoP[i];
      }
    });
  };
  // a MARCA de cada face: o glifo do efeito (3 Fogo = ACENDER, 2 Peso = IGUAL/PESAR, 1 Ricochete = ECO), só depois de o jogador ter visto a palavra e com a face liberada;
  // as outras ficam com a marca apagada (a palavra delas ainda não está definida na língua). Ver DESIGN.md §27.
  const FACE_WORD: Record<number, string> = { 3: 'acender', 2: 'igual', 1: 'eco' };
  const marksSig = () => {
    let sig = '';
    for (let n = 1; n <= 6; n++) {
      const w = FACE_WORD[n];
      const g = w && FACES[n - 1].unlocked && diaryStore.get().seen[w] ? LEX[w]?.g : undefined;
      if (g) faceMarks[n] = g;
      else faceMarks[n] = 'blank';
      sig += g ? '1' : '0';
    }
    return sig;
  };
  // faces liberadas pela história: refaz as texturas do dado quando um marco libera uma nova
  let facesSig = FACES.map((f) => +f.unlocked).join('') + marksSig();
  const refreshFaces = () => {
    const sig = FACES.map((f) => +f.unlocked).join('') + marksSig();
    if (sig === facesSig) return; // só refaz se uma face mudou (o progresso também guarda outras coisas)
    facesSig = sig;
    endSketch();
    for (const mats of [dieMats, handMats]) {
      DIE_FACES.forEach((n, i) => {
        const f = FACES[n - 1];
        mats[i].map = dieFaceTexture(n, f.color, !f.unlocked);
        mats[i].emissiveMap = dieGlowTexture(n, f.color, !f.unlocked);
        mats[i].needsUpdate = true;
      });
    }
    buildRostos(); // o dado da mão volta a ter os rostos
  };
  const unsubProgress = progressStore.subscribe(refreshFaces);
  const unsubDiaryFaces = diaryStore.subscribe(refreshFaces);
  buildRostos();
  curQ.copy(targetQ);
  let spin = Math.PI; // começa com uma face lateral bem de frente
  let spinTo: number | null = null; // o próximo quarto de volta (o dado vira em PASSOS, não sem parar)
  let spinHold = 9;
  const spinSnap = (x: number) => Math.PI + Math.round((x - Math.PI) / (Math.PI / 2)) * (Math.PI / 2);


  // ── pedra-sabão (giz) ───────────────────────────────────────────────────
  // Bastão verde-acinzentado com a ponta de escrever coberta de pó branco. Infinita.
  // Fica numa das mãos: a principal (direita, em uso) ou a auxiliar (esquerda, guardada).
  const soapMats = [
    soapSideTexture(true),
    soapSideTexture(true),
    soapSideTexture(false),
    soapSideTexture(false),
    soapTipTexture(true),
    soapTipTexture(false),
  ].map((map) => new THREE.MeshLambertMaterial({ map, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.22 }));
  const soapGroup = new THREE.Group();
  const soapHolder = new THREE.Group();
  soapHolder.add(new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.5, 1.45, 3, 0.13), soapMats));
  const wrapMat = new THREE.MeshLambertMaterial({ map: soapWrapTexture() });
  const wrap = new THREE.Mesh(new RoundedBoxGeometry(0.57, 0.57, 0.36, 2, 0.1), wrapMat);
  wrap.position.z = -0.18;
  soapHolder.add(wrap);
  const capMat = new THREE.MeshLambertMaterial({ color: 0x3a3a48 });
  const cap = new THREE.Mesh(new RoundedBoxGeometry(0.54, 0.54, 0.1, 2, 0.05), capMat);
  cap.position.z = -0.73;
  soapHolder.add(cap);
  // pó de giz: grãozinhos que caem da ponta
  const dustN = 10;
  const dustPos = new Float32Array(dustN * 3);
  const chalkDust = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(dustPos, 3)),
    new THREE.PointsMaterial({ color: 0xeef3ea, size: 2, sizeAttenuation: false, transparent: true, opacity: 0.9 }),
  );
  chalkDust.frustumCulled = false;
  soapHolder.add(chalkDust);
  soapGroup.add(soapHolder);
  dieScene.add(soapGroup);
  const SOAP_ROT = new THREE.Euler(-0.95, 0.55, 0.5);
  soapHolder.rotation.copy(SOAP_ROT);
  let soapKick = 0;

  // ── o diário: livro de verdade (src/book/) ──
  let hudHalfW = 0.7;
  // o DIÁRIO tem o seu próprio canvas, em resolução cheia, por cima do jogo: as páginas continuam em pixel art, mas cada pixel do papel vira
  // vários pixels de tela, nítidos (no canvas do jogo, de ~200 linhas, as letras se desmanchavam). Cliques seguem pelo canvas do jogo (mesmo lugar).
  const bookCanvas = document.createElement('canvas');
  bookCanvas.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;display:none;image-rendering:pixelated';
  canvas.insertAdjacentElement('afterend', bookCanvas);
  const bookRenderer = new THREE.WebGLRenderer({ canvas: bookCanvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  bookRenderer.setClearColor(0x000000, 0);
  const bookScene = new THREE.Scene();
  bookScene.add(new THREE.AmbientLight(0x9a8aa8, 1.6), key.clone(), fill.clone());
  const sizeBook = () => {
    bookRenderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    bookRenderer.setSize(window.innerWidth, window.innerHeight, false);
  };
  sizeBook();
  window.addEventListener('resize', sizeBook);
  let bookShown = false;
  const book = createDiaryBook({ scene: bookScene, cam: dieCam, dom: canvas, sound: (n) => sfx.play(n), halfW: () => hudHalfW });

  let tool: Tool = 'die';
  let dieU = 0; // 0 = dado na mão principal, 1 = na auxiliar
  let soapU = 1;
  let chalkMode: ChalkMode = 'draw';
  const setTool = (t: Tool) => {
    if (tool === t || (t === 'chalk' && !hasChalk)) return;
    tool = t;
    sfx.play('swap');
    brush.active = false;
    chalk.beginStroke();
    opts.onTool?.(tool);
  };
  const swapTool = () => {
    if (!hasDie || !hasChalk) return; // sem giz (ou sem dado) não há o que trocar
    setTool(tool === 'die' ? 'chalk' : 'die');
  };

  const chalk = new Chalk();
  scene.add(chalk.mesh);
  const ray = new THREE.Raycaster();
  const ndc0 = new THREE.Vector2(0, 0);
  const brush = { active: false, erase: false, id: -1, ndc: new THREE.Vector2(0, 0), mouse: false };
  const nrm = new THREE.Vector3();
  let eraseArmed = 0;

  // risca (ou apaga) onde o NDC aponta
  const paintAt = (ndc: THREE.Vector2, erase: boolean) => {
    camera.updateMatrixWorld();
    ray.setFromCamera(ndc, camera);
    ray.far = 4.5;
    const hit = ray.intersectObjects(nearSurfaces(), false)[0];
    if (!hit || !hit.face) {
      chalk.beginStroke();
      return;
    }
    nrm.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
    if (nrm.dot(ray.ray.direction) > 0) nrm.negate(); // sempre de frente pra quem olha
    if (erase) chalk.erase(hit.point, 0.1);
    else chalk.add(hit.point, nrm, hit.object.id);
  };

  const clearChalk = () => {
    if (chalk.count === 0) {
      caption('Nada pra apagar', 'Não há marcas de giz nesta sala.', '#cfc6e8');
      return;
    }
    if (eraseArmed <= 0) {
      eraseArmed = 2;
      caption('Apagar tudo?', 'Aperte de novo para confirmar.', '#ff9aa8');
      return;
    }
    eraseArmed = 0;
    sfx.play('sweep');
    chalk.clear();
    soapKick = 1;
    caption('Giz apagado', 'A sala está limpa.', '#cfc6e8');
  };

  // ── regras físicas ──────────────────────────────────────────────────────
  // Cada face muda como o dado se comporta ao ser arremessado.
  const PHYS: Record<number, { speed: number; up: number; g: number; e: number; fr: number }> = {
    1: { speed: 11, up: 0.14, g: 14, e: 0.9, fr: 0.5 }, // Ricochete: leve e saltitante
    2: { speed: 6.5, up: 0.1, g: 30, e: 0.12, fr: 7 }, // Peso: cai e fica
    3: { speed: 8.5, up: 0.12, g: 16, e: 0.5, fr: 2.5 }, // Fogo: meio-termo
  };
  const R = 0.22;
  let dieRoll = 0;
  let dieState: DieState = 'hand';
  const dieP = new THREE.Vector3();
  const dieV = new THREE.Vector3();
  const dieW = new THREE.Vector3();
  let restTimer = 0;
  let restReturn = 0;
  let handPop = 0;
  const restQ = new THREE.Quaternion();
  let landQ: THREE.Quaternion | null = null; // abertura: a posição em que o dado que o Escrivão soltou vai PARAR (já com a face certa para cima)
  const tmpC = new THREE.Vector3();
  const tmpN = new THREE.Vector3();
  const tmpQ = new THREE.Quaternion();
  const tmpAxis = new THREE.Vector3();
  const fwdV = new THREE.Vector3();
  const rightV = new THREE.Vector3();
  const gN = new THREE.Vector3();

  const caption = (title: string, sub: string, color: string) => opts.onCaption?.(title, sub, color);

  // ── jogador ─────────────────────────────────────────────────────────────
  const EYE = 1.6;
  const pos = new THREE.Vector3(0, EYE, 0); // olhos
  let feetY = 0;
  let vy = 0;
  let landKick = 0;
  const moveVel = new THREE.Vector3(); // velocidade horizontal (m/s)

  // ── mundo: as salas ficam lado a lado, ligadas por corredores abertos ───
  // Cada sala é construída em coordenadas próprias e colocada num deslocamento (offs) pra
  // que o corredor da porta de uma desemboque direto na entrada da próxima: nada de carregar.
  const rooms: Room[] = [];
  const offs: THREE.Vector3[] = [];
  let curRoom = 0;
  // cenas: quem "segura" o jogador (freeze), o giro suave da câmera (lookAt), a cena de acordar e o dado queimando
  let holds = 0;
  // o jogador começa SEM NADA nas mãos: o dado e o giz são achados (progresso salvo)
  let hasDie = progress.has('dado');
  // o GIZ só existe a partir do capítulo 2 (DIRECAO_DE_ARTE.md §4.9): no capítulo 1 ele não aparece nem em saves antigos; só na sala de teste
  const CHALK_OK = LAB;
  let hasChalk = CHALK_OK && progress.has('giz');

  let camTween: null | { y0: number; p0: number; y1: number; p1: number; t: number; dur: number } = null;
  let intro: null | { ph: number; t: number } = null;
  let burn: null | { t: number; dur: number } = null;
  let dropWatch: { t: number; cb: () => void } | null = null; // esperando o dado que caiu do poço parar no chão
  // ── abertura (DESIGN.md §32–33): o barulho no poço, o jogador desconfia, ANDA até o poço e olha para cima; CORTE para fora: o Escrivão chega
  // andando à boca do poço e se debruça; de baixo, ele fala; de lado, tira o dado de dentro do manto; close na mão; ele solta; a câmera desce
  // POR BAIXO do dado que cai; o dado bate no chão; olhando de novo, ele sumiu; a câmera volta para a frente e a cena fica travada até pegar o dado ──
  let pinned = false; // cena travada esperando uma ação: não anda nem olha, mas interage
  let autoWalk: null | { x: number; z: number; speed: number } = null; // o personagem anda sozinho (cena) até um ponto fixo
  let fovCine = 0; // > 0: campo de visão da cena (zoom)
  let cineCam: null | { pos: THREE.Vector3; look: THREE.Vector3 } = null; // câmera de cinema, solta do jogador
  let scribeDrop: null | { ph: number; t: number; done: () => void; thrown: boolean; pose: ScribePose; yaw: number; arrived: boolean } = null;
  let topScribe: ReturnType<typeof makeScribe> | null = null;
  let scribeDie: THREE.Object3D | null = null;
  const outdoor = new THREE.DirectionalLight(0xd8dcf4, 0); // luz da madrugada lá fora (só acesa nos planos de fora)
  scene.add(outdoor, outdoor.target);
  const shaftWorld = () => rooms[0].shaft!.clone().add(offs[0]).setY(rooms[0].shaft!.y - 2.5 + offs[0].y); // centro do furo no TETO
  const wellWorld = () => rooms[0].wellTop!.clone().add(offs[0]); // a boca do poço, lá fora (nível do chão do pátio)
  const scribeHand = new THREE.Vector3();
  const sPos = new THREE.Vector3();
  const scribeLook = new THREE.Vector3();
  const tmpV = new THREE.Vector3();
  const DIE_IN_HAND = 0.22;
  const SCRIBE_FROM = new THREE.Vector3(-2.7, 0, 2.9); // de onde ele vem (atrás da mureta), relativo à boca do poço
  const RIM_OUT = 1.63; // raio de fora da mureta do poço (vestibulo.ts: SHAFT.r + 0,43)
  const SCRIBE_AT = new THREE.Vector3(0, 0, RIM_OUT + 0.12); // encostado na mureta: abaixo da borda o pano se achata contra ela (`press`)
  // uma conversa do dado em várias frases, uma depois da outra; devolve a duração total (ms, até o balão sumir)
  const talkSeq = (lines: { glyphs: string[]; pic?: string; joy?: boolean }[], o?: { delay?: number; gap?: number }) => {
    let at = (o?.delay ?? 0) * 1000;
    const gap = (o?.gap ?? 1.7) * 1000; // respiro entre uma frase e a seguinte (a anterior fica à vista, completa)
    lines.forEach((l, i) => {
      saySay(l.glyphs, { pic: l.pic, joy: l.joy, delay: at / 1000 });
      at += 150 + lineMs(l.glyphs, !!l.pic) + (i < lines.length - 1 ? gap : LINGER_MS);
    });
    return at - (o?.delay ?? 0) * 1000;
  };
  // ── o ROSTO do dado caído (abertura): cai com o rosto para o jogador, de olhos fechados; acorda antes de falar ──
  let worldRosto: { i: number; b: ReturnType<typeof dieRostoBlend>; map: THREE.Texture | null; em: THREE.Texture | null } | null = null;
  const wakeFace = (i: number, q: THREE.Quaternion) => {
    endWorldRosto();
    const n = DIE_FACES[i];
    const f = FACES[n - 1];
    // quantos quartos de volta para o rosto ficar de pé (mesma conta do dado da mão, com a orientação em que ele vai parar)
    const nw = FACE_N_LOCAL[i].clone().applyQuaternion(q);
    const up = FACE_UP[i].clone().applyQuaternion(q);
    up.applyAxisAngle(Y_AXIS, -Math.atan2(nw.x, nw.z));
    const k = Math.round(Math.atan2(up.x, up.y) / (Math.PI / 2));
    const turn = (4 - (((k % 4) + 4) % 4)) % 4;
    const b = dieRostoBlend(n, f.color, !f.unlocked, turn);
    const m = dieMats[i];
    worldRosto = { i, b, map: m.map, em: m.emissiveMap };
    m.map = b.map;
    m.emissiveMap = b.glow;
    m.needsUpdate = true;
    b.set(1);
    b.setLook({ ex: 0, ey: 1, by: 1, closed: true });
  };
  const endWorldRosto = () => {
    if (!worldRosto) return;
    const m = dieMats[worldRosto.i];
    m.map = worldRosto.map;
    m.emissiveMap = worldRosto.em;
    m.needsUpdate = true;
    worldRosto.b.dispose();
    worldRosto = null;
  };
  let wakeHop = 0;
  let wakeHopV = 0;
  const startScribeDrop = (done: () => void) => {
    const sh = shaftWorld();
    if (!topScribe) {
      topScribe = makeScribe();
      // sem a névoa da sala e com o manto um pouco aceso: de baixo, a silhueta (capuz, vazio do rosto, braço) se lê contra o céu
      topScribe.group.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshLambertMaterial | undefined;
        if (!m) return;
        m.fog = false; // lá em cima ele se lê nítido contra a névoa (as cores dele já vêm do modelo)
        m.needsUpdate = true;
      });
      topScribe.group.scale.setScalar(1.0); // ~2,2 m com o capuz pontudo
      scene.add(topScribe.group);
      scribeDie = worldModel.clone();
      topScribe.hand.add(scribeDie);
      scribeDie.position.set(0, 0, 0);
      scribeDie.scale.setScalar(DIE_IN_HAND); // na mão dele, do tamanho de um dado grande de verdade (no mundo ele tem 42 cm)
    }
    topScribe.setAlpha(0); // ainda não chegou
    scribeDie!.visible = false; // o dado está guardado dentro do manto
    sfx.play('shaftRumble');
    ui.setBars(true);
    // um tranco curto da cabeça na direção do barulho (desconfiado), e fica parado um instante
    const wx = sh.x - pos.x;
    const wz = sh.z - pos.z;
    const y1 = Math.atan2(-wx, -wz);
    const dy = Math.atan2(Math.sin(y1 - yaw), Math.cos(y1 - yaw));
    camTween = { y0: yaw, p0: pitch, y1: yaw + Math.sign(dy || 1) * 0.32, p1: pitch + 0.12, t: 0, dur: 0.25 };
    scribeDrop = { ph: 0, t: 0, done, thrown: false, pose: {}, yaw: Math.PI, arrived: false };
  };
  const lookPitch = (wx: number, wy: number, wz: number) => Math.atan2(wy - pos.y, Math.hypot(wx - pos.x, wz - pos.z));
  const lookYaw = (wx: number, wz: number) => {
    const y1 = Math.atan2(-(wx - pos.x), -(wz - pos.z));
    return yaw + Math.atan2(Math.sin(y1 - yaw), Math.cos(y1 - yaw));
  };
  const setCine = (p: THREE.Vector3, l: THREE.Vector3) => {
    if (!cineCam) cineCam = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
    cineCam.pos.copy(p);
    cineCam.look.copy(l);
  };
  const releaseDie = () => {
    const S = scribeDrop!;
    S.thrown = true;
    scribeDie!.visible = false;
    scribeDie!.getWorldPosition(scribeHand);
    dieRoom = 0;
    dieP.copy(scribeHand).sub(offs[0]);
    {
      // garante que ele cai por DENTRO da coluna do poço (senão bateria na borda)
      const sl = rooms[0].shaft!;
      const ox = dieP.x - sl.x;
      const oz = dieP.z - sl.z;
      const od = Math.hypot(ox, oz);
      if (od > 0.9) {
        // (só por segurança) nunca fora da boca do poço; normalmente ele já sai da mão por cima do furo e cai guiado para o meio
        dieP.x = sl.x + (ox / od) * 0.9;
        dieP.z = sl.z + (oz / od) * 0.9;
      }
    }
    dieV.set(0, -0.3, 0);
    dieW.set(4, 2.5, -3.5);
    worldDie.position.copy(dieP).add(offs[0]);
    worldModel.scale.setScalar(DIE_IN_HAND); // sai da mão no tamanho da mão; cresce enquanto cai (parece só a perspectiva: ele vem na direção da câmera)
    worldDie.visible = true;
    thrownFace = 3;
    // onde ele vai parar: a face do Fogo para cima, de frente para o jogador (o giro da queda vai se acomodando nessa posição)
    landQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)).multiply(faceQ(thrownFace));
    // ...e com uma face LATERAL virada exatamente para o jogador: nela, o ROSTO, de olhos fechados (ele cai "desmaiado" e só acorda depois)
    {
      const sl0 = rooms[0].shaft!;
      const landX = sl0.x + 0.05 + offs[0].x;
      const landZ = sl0.z + 0.3 + offs[0].z;
      const aP = Math.atan2(pos.x - landX, pos.z - landZ);
      let best = -1;
      let bestA = 0;
      FACE_N_LOCAL.forEach((n, i) => {
        const nw = n.clone().applyQuaternion(landQ!);
        if (Math.abs(nw.y) > 0.5) return;
        const a = Math.atan2(nw.x, nw.z);
        const d = Math.abs(Math.atan2(Math.sin(aP - a), Math.cos(aP - a)));
        if (best < 0 || d < bestA) {
          best = i;
          bestA = d;
        }
      });
      if (best >= 0) {
        const nw = FACE_N_LOCAL[best].clone().applyQuaternion(landQ);
        landQ.premultiply(new THREE.Quaternion().setFromAxisAngle(Y_AXIS, aP - Math.atan2(nw.x, nw.z)));
        wakeFace(best, landQ);
      }
    }
    dieThrown = true;
    dieState = 'flying';
    restTimer = 0;
    sfx.play('shaftFall');
    dropWatch = { t: 0, cb: () => scribeDrop && ((scribeDrop.ph = 9), (scribeDrop.t = 0)) };
  };
  const updateScribeDrop = (dt: number, t: number) => {
    const S = scribeDrop;
    if (!S) return;
    const W = wellWorld();
    const sh = shaftWorld();
    const go = (ph: number) => {
      S.ph = ph;
      S.t = 0;
    };
    // ── o que acontece a cada quadro, mesmo durante conversas e movimentos de câmera ──
    if (topScribe && S.ph >= 4) {
      const P = S.pose;
      if (S.ph === 4 && !S.arrived) {
        // ele chega andando à boca do poço
        const to = tmpV.copy(SCRIBE_AT).add(W);
        const d = Math.hypot(to.x - sPos.x, to.z - sPos.z);
        const sp = Math.min(0.85, d * 2.5 + 0.15);
        if (d < 0.03) {
          S.arrived = true;
          P.walk = 0;
        } else {
          sPos.x += ((to.x - sPos.x) / d) * Math.min(d, sp * dt);
          sPos.z += ((to.z - sPos.z) / d) * Math.min(d, sp * dt);
          S.yaw = Math.atan2(to.x - sPos.x, to.z - sPos.z);
          P.walk = sp;
        }
      }
      if (S.arrived) S.yaw += Math.atan2(Math.sin(Math.PI - S.yaw), Math.cos(Math.PI - S.yaw)) * Math.min(1, dt * 3); // vira de frente para o furo
      topScribe.group.position.copy(sPos);
      topScribe.group.rotation.set(0, S.yaw, 0);
      topScribe.animate(dt, t, S.arrived ? { ...P, press: SCRIBE_AT.z - RIM_OUT - 0.01 } : P);
    }
    const outside = S.ph === 4 || S.ph === 6 || S.ph === 7;
    if (outside !== outsideAtmo) {
      outsideAtmo = outside;
      blendAtmosphere(0, true); // corte: o ar muda na hora
    }
    outdoor.intensity = outside ? 1.9 : 0;
    if (S.ph === 4 || S.ph === 6 || S.ph === 7) {
      outdoor.position.set(W.x - 4, W.y + 9, W.z - 3);
      outdoor.target.position.copy(W);
    }
    if (S.ph === 4) {
      // plano geral, de fora: câmera baixa, empurrando devagar
      const k = Math.min(1, S.t / 7);
      setCine(tmpV.set(3.5 - 0.6 * k, 1.0 + 0.15 * k, 0.3 + 0.3 * k).add(W), new THREE.Vector3(-0.7 + 0.6 * k, 1.0, 1.7 - 0.3 * k).add(W)); // de lado: ele vem na direção da câmera
    } else if (S.ph === 6) {
      // de lado, mais perto: ele se endireita, leva a mão às costas e tira o dado de dentro do manto
      const up = clamp((S.t - 1.2) / 1.2, 0, 1); // a câmera sobe junto com o braço erguido
      setCine(tmpV.set(2.6, 1.2 + 0.4 * up, 3.2).add(W), new THREE.Vector3(0, 0.95 + 1.1 * up, 1.6).add(W));
    } else if (S.ph === 7 && topScribe) {
      // close na mão com o dado, sobre o poço
      topScribe.hand.getWorldPosition(scribeHand);
      // por cima do ombro direito dele, olhando para baixo: a manga, a luva com o dado na palma e a boca escura do poço embaixo
      scribeLook.copy(scribeHand).setY(scribeHand.y - 0.12);
      setCine(tmpV.set(0.8, 1.15, 0.85).add(scribeHand), scribeLook);
    } else if (S.ph === 8) {
      // a câmera desce POR BAIXO do dado: o dado em cima, contra a luz, e lá no alto a silhueta do Escrivão debruçado
      const dw = worldDie.position;
      const cx = clamp(dw.x + 0.28, sh.x - 0.6, sh.x + 0.6);
      const cz = clamp(dw.z - 0.22, sh.z - 0.6, sh.z + 0.6);
      setCine(tmpV.set(cx, dw.y - 1.6, cz), dw);
    }

    if (ui.blocked() || camTween) return; // as fases esperam a conversa e o movimento de câmera em curso
    S.t += dt;
    switch (S.ph) {
      case 0: // parado, escutando
        if (S.t > 0.7) {
          camTween = { y0: yaw, p0: pitch, y1: lookYaw(sh.x, sh.z), p1: 0.02, t: 0, dur: 1.7 }; // vira devagar, desconfiado, para o poço
          go(1);
        }
        break;
      case 1:
        dialogue.say([{ who: 'thought', text: '…Tem alguém aí?' }], { block: true, onEnd: () => go(2) });
        S.ph = 1.5;
        break;
      case 2:
        // anda até um ponto FIXO quase embaixo do furo: quem está mais perto da porta anda mais, quem está mais longe anda menos
        autoWalk = { x: sh.x + 0.1, z: sh.z - 0.45, speed: 1.6 };
        go(3);
        break;
      case 3:
        if (!autoWalk) {
          // chegou: ergue os olhos devagar até a boca do poço (a luz, a trave, a corda)
          camTween = { y0: yaw, p0: pitch, y1: lookYaw(W.x, W.z), p1: lookPitch(W.x, W.y + 1.6, W.z + 0.05), t: 0, dur: 2.2 };
          fovCine = 32;
          go(3.5);
        }
        break;
      case 3.5:
        if (S.t > 1.3) {
          // CORTE: lá fora. O Escrivão vem andando por trás da mureta
          sPos.copy(SCRIBE_FROM).add(W);
          S.yaw = Math.atan2(SCRIBE_AT.x - SCRIBE_FROM.x, SCRIBE_AT.z - SCRIBE_FROM.z);
          S.arrived = false;
          S.pose = { walk: 0.8, lean: 0, headPitch: 0.1 };
          topScribe!.setAlpha(1);
          fovCine = 46;
          go(4);
        }
        break;
      case 4:
        if (S.arrived) {
          // na borda: apoia a mão esquerda, se debruça e olha para baixo, para dentro do poço
          S.pose = { walk: 0, lean: 1.3, rest: 1, headPitch: -0.1 }; // debruçado por cima da mureta: a cabeça fica sobre a boca do poço, o rosto aponta para BAIXO // o rosto aponta para BAIXO, para dentro do poço // debruçado por cima da mureta (o corpo fica do lado de fora dela)
          if (S.t > 6.2) {
            // CORTE: de baixo, o olhar do jogador: o capuz aparece na boca do poço, contra o céu
            cineCam = null;
            fovCine = 10;
            topScribe!.head.getWorldPosition(tmpV);
            yaw = lookYaw(tmpV.x, tmpV.z);
            pitch = lookPitch(tmpV.x, tmpV.y, tmpV.z);
            go(5);
          }
        }
        break;
      case 5:
        if (S.t > 0.9) {
          dialogue.say(
            [
              { who: 'escrivao', glyphs: ['voce', 'viver', 'perg'] },
              { who: 'escrivao', glyphs: ['eu', 'dar', 'dado'] },
              { who: 'escrivao', glyphs: ['voce', 'ler'] },
            ],
            { block: true, onEnd: () => go(6) },
          );
          S.ph = 5.5;
        }
        break;
      case 6:
        // de lado: endireita-se um pouco, a mão direita vai às costas, para dentro do manto… e volta com o dado
        fovCine = 40;
        // depois ERGUE o dado bem alto, na palma virada para cima, acima da cabeça e sobre a boca do poço (nada atravessa a mureta)
        S.pose = { lean: S.t < 1.25 ? 0.45 : 0.8, rest: 0.6, back: S.t < 1.25 ? 1 : 0, raise: S.t < 1.25 ? 0 : 1, headPitch: S.t < 1.25 ? 0.1 : -0.2, headYaw: S.t < 1.25 ? -0.35 : 0 };
        if (S.t > 1.05) scribeDie!.visible = true;
        if (S.t > 2.7) go(7);
        break;
      case 7:
        // close na mão: ele estende o braço sobre o poço, segura um instante… e abre os dedos
        fovCine = 38;
        S.pose = { lean: 0.9, rest: 1, raise: 1, open: S.t > 1.9 ? 1 : 0, headPitch: -0.2 };
        if (!S.thrown && S.t > 1.98) {
          releaseDie();
          go(8);
        }
        break;
      case 8:
        // caindo: quando ele chega perto do teto da sala, corta para o olhar do jogador, que o vê bater no chão
        fovCine = 56;
        S.pose = { lean: 0.9, rest: 1, raise: 0.4, open: 1, headPitch: 0.6 };
        if (worldDie.position.y < sh.y + 1.4) {
          cineCam = null;
          const dw = worldDie.position;
          yaw = lookYaw(dw.x, dw.z);
          pitch = lookPitch(dw.x, dw.y, dw.z);
          fovCine = 0;
          topScribe?.setAlpha(0); // enquanto ninguém olha para cima, ele vai embora
          go(8.5);
        }
        break;
      case 9:
        // o dado parou no chão: o olhar volta lá para cima… e ele não está mais lá
        camTween = { y0: yaw, p0: pitch, y1: lookYaw(W.x, W.z), p1: lookPitch(W.x, W.y + 1.6, W.z + 0.05), t: 0, dur: 1.6 };
        fovCine = 32;
        go(9.5);
        break;
      case 9.5:
        if (S.t > 1.3) {
          dialogue.say([{ who: 'thought', text: 'Sumiu.' }], { block: true, onEnd: () => go(10) });
          S.ph = 9.8;
        }
        break;
      case 10: {
        // de volta para a frente, com o olhar um pouco baixo: o dado caído aparece no meio da tela, de perto (zoom: dá para ver o rosto
        // dormindo e o acordar)
        fovCine = 20;
        const dw = worldDie.position;
        camTween = { y0: yaw, p0: pitch, y1: lookYaw(dw.x, dw.z), p1: lookPitch(dw.x, dw.y + 0.05, dw.z), t: 0, dur: 1.6 };
        go(11);
        break;
      }
      case 11:
        // ainda na cena (faixas): o dado caído ACORDA (abre os olhos, se assusta, olha em volta, olha para o jogador) e só então fala;
        // quando ele termina, a cena acaba e aparece o "Pegar o dado"
        if (worldRosto) {
          const r = worldRosto.b;
          if (S.t > 0.5 && S.t - dt <= 0.5) r.setLook({ ex: 0, ey: 1, by: 0, closed: false }); // abre os olhos, devagar
          if (S.t > 0.8 && S.t - dt <= 0.8) r.setLook({ ex: 0, ey: 1, by: 1, closed: true }); // pisca
          if (S.t > 0.95 && S.t - dt <= 0.95) {
            r.setLook({ ex: 0, ey: -1, by: -3, closed: false }); // ACORDA: sobrancelhas lá em cima
            wakeHopV = 2.6;
            talkGlow = 0.6;
            sfx.play('put', 0.5);
          }
          if (S.t > 1.5 && S.t - dt <= 1.5) r.setLook({ ex: -4, ey: 0, by: -1, closed: false }); // olha para um lado
          if (S.t > 1.95 && S.t - dt <= 1.95) r.setLook({ ex: 4, ey: 0, by: -1, closed: false }); // e para o outro
          if (S.t > 2.4 && S.t - dt <= 2.4) r.setLook({ ex: 0, ey: 0, by: -2, closed: false }); // e para o jogador
        }
        if (S.t > (worldRosto ? 2.8 : 0.3)) {
          const ms = talkSeq([{ glyphs: ['eu', 'cair'] }, { glyphs: ['voce', 'ajudar', 'eu', 'perg'] }], { delay: 0 });
          go(11.5);
          S.t = -ms / 1000;
        }
        break;
      case 11.5:
        if (S.t > 0.1) {
          fovCine = 0;
          ui.setBars(false);
          scribeDrop = null;
          progress.set('caiu');
          S.done();
        }
        break;
    }
  };
  let dieCine = 0; // 0 = dado na mão de sempre, 1 = dado no centro da tela (cena)
  let dieCineTarget = 0;
  // a pergunta do dado (quizTick): fase, tremor na mão, freio do jogador e o corpo do dado na cena (pulo, balanço, cabeça baixa)
  let quizPh: 'idle' | 'shake' | 'rise' | 'glyph' | 'say' | 'ask' | 'react' = 'idle';
  let quizShake = 0;
  let walkK = 1;
  let cineHop = 0;
  let cineHopV = 0;
  let cineWig = 0;
  let cineDroop = 0;
  let pickup: (() => void) | null = null; // chamado quando o dado caído chega na mão
  let dieRoom = 0; // sala onde o dado está (a posição dieP é local a ela)
  let gems = 0;
  let complete = false;
  const announced = new Set<number>();
  const FAR = new THREE.Vector3(0, -99, 0);

  const makeCtx = (off: THREE.Vector3, idx: number): Ctx => {
    const lp = new THREE.Vector3();
    const aimO = new THREE.Vector3();
    const aimD = new THREE.Vector3();
    return {
      caption: (a, b, c) => caption(a, b, c),
      sfx: (n, key) => {
        if (n === 'spread') {
          sfx.play('ignite', 0.45);
          return;
        }
        sfx.play(n);
        // acender com o dado: ele queima. 1,5 s na 1ª vez de cada braseiro; depois só um instante (0,3 s)
        if (n === 'ignite') {
          const first = key ? progress.firstBurn(`${idx}:${key}`) : true;
          startBurn(first);
          life.react('flinch');
          if (first && progress.has('fogo')) chatFn('burn'); // a 1ª de todas não tem medo: o dado comemora (sala 1)
        } else if (n === 'plate') {
          life.react('thump');
          chatFn('plate');
        } else if (n === 'door') {
          life.react('perk');
          chatFn('door');
          saveIn = Math.min(saveIn, 1.4); // puzzle resolvido: salva quando a porta terminar de abrir
        } else if (n === 'error') {
          life.react('shake');
          if (configStore.get().vibration && window.matchMedia('(pointer: coarse)').matches) navigator.vibrate?.(70); // (celular: vibra no erro)
        }
        else if (n === 'piece' || n === 'gem') {
          life.react('joy');
          saveIn = Math.min(saveIn, 1.2);
        }
        else if (n === 'burnout') life.react('sad');
      },
      player: {
        get pos() {
          return lp.copy(pos).sub(off);
        },
      },
      feetY: () => feetY - off.y,
      say: (lines, o) => dialogue.say(lines, o),
      seen: (id) => diary.markSeen(id, rooms[idx]?.name),
      milestone: (f) => {
        const fresh = progress.set(f);
        if (fresh) onMilestone(f);
        return fresh;
      },
      flag: (f) => progress.has(f),
      stage: () => progress.stage(),
      paused: () => busy(),
      have: () => ({ die: hasDie, chalk: hasChalk }),
      giveDie: (onDone) => {
        if (hasDie || dieState !== 'rest') {
          onDone?.();
          return;
        }
        pickup = onDone ?? (() => {});
        endWorldRosto(); // (o rosto do dado caído volta a ser a face de sempre: na mão, quem faz o rosto é o dado do HUD)
        recall(); // o dado caído voa até a mão
      },
      giveChalk: () => {
        if (hasChalk) return;
        hasChalk = true;
        progress.set('giz');
        soapKick = 1;
        sfx.play('catch');
        opts.onInventory?.({ die: hasDie, chalk: hasChalk });
      },
      dieGlow: (v) => {
        talkGlow = v;
      },
      dropDie: (onLanded) => {
        const sh = rooms[0].shaft;
        if (!sh) {
          onLanded();
          return;
        }
        startScribeDrop(onLanded);
      },
      pin: (on) => {
        pinned = on;
      },
      dieCenter: (on) => {
        dieCineTarget = on ? 1 : 0;
        ui.setBars(on);
        if (on) {
          life.react('perk');
          camTween = { y0: yaw, p0: pitch, y1: yaw, p1: -0.04, t: 0, dur: 1.4 }; // os olhos sobem do chão: o dado fala de frente
        }
      },
      dieSay: (glyphs, o) => saySay(glyphs, o),
      dieLook: (p, secs = 3) => {
        forcedLook = { p: p.clone().add(off), until: performance.now() + secs * 1000 };
      },
      dieReact: (k) => life.react(k),
      aim: () => {
        camera.getWorldDirection(aimD);
        return { o: aimO.copy(camera.position).sub(off), d: aimD };
      },
      dieTalk: (lines, o) => talkSeq(lines, o),
      freeze: (on) => {
        holds = Math.max(0, holds + (on ? 1 : -1));
      },
      blackout: (secs, onDark) => {
        darkQ = { secs, onDark };
      },
      dark: () => darkK,
      lookAt: (p, dur = 0.9) => {
        camera.updateMatrixWorld();
        const wx = p.x + off.x - pos.x;
        const wy = p.y + off.y - pos.y;
        const wz = p.z + off.z - pos.z;
        const y1 = Math.atan2(-wx, -wz);
        const dy = Math.atan2(Math.sin(y1 - yaw), Math.cos(y1 - yaw)); // caminho mais curto
        camTween = { y0: yaw, p0: pitch, y1: yaw + dy, p1: clamp(Math.atan2(wy, Math.hypot(wx, wz)), -1.0, 1.0), t: 0, dur };
      },
      die: {
        get state() {
          return dieRoom === idx ? dieState : 'hand';
        },
        get face() {
          return thrownFace;
        },
        get thrown() {
          return dieThrown;
        },
        get pos() {
          return dieRoom === idx ? dieP : FAR;
        },
        get R() {
          return R;
        },
      },
      chalk: {
        dotsOn: (o) =>
          chalk.dotsOn(o.id).map((d) => ({ ...d, x: d.x - off.x, y: d.y - off.y, z: d.z - off.z })),
        get revision() {
          return chalk.revision;
        },
      },
    };
  };

  const buildWorld = () => {
    rooms.forEach((r) => {
      scene.remove(r.group);
      r.dispose();
    });
    rooms.length = 0;
    offs.length = 0;
    BUILDERS.forEach((build, i) => {
      const off = new THREE.Vector3();
      const room = build(makeCtx(off, i));
      room.name = `Sala ${i + 1} · ${room.name.replace(/^Sala \d+ · /, '')}`; // numeração automática
      if (i > 0) off.z = offs[i - 1].z + rooms[i - 1].doorZ - CORRIDOR - room.entranceZ;
      if (i > 0) off.y = offs[i - 1].y + (rooms[i - 1].exitDy ?? 0) - (room.entranceY ?? 0); // salas que descem (fosso, banhos): a seguinte começa no nível da porta de saída
      room.group.position.copy(off);
      scene.add(room.group);
      rooms.push(room);
      offs.push(off);
    });
  };

  // em qual sala está o ponto z (o corredor pertence à sala da porta)
  const roomOfZ = (z: number) => {
    for (let i = 0; i < rooms.length; i++) {
      if (z <= offs[i].z + rooms[i].entranceZ && z > offs[i].z + rooms[i].doorZ - CORRIDOR) return i;
    }
    return z > offs[0].z + rooms[0].entranceZ ? 0 : rooms.length - 1;
  };
  // Só as salas vizinhas são desenhadas/atualizadas. As LUZES continuam acesas (se o número de
  // luzes mudasse, o three recompilaria o shader e daria um tranco); só as malhas vão pra
  // uma camada que a câmera não enxerga.
  let surfCache: THREE.Object3D[] = [];
  const activeRooms = new Set<number>();
  const applyActive = () => {
    activeRooms.clear();
    surfCache = [];
    for (let i = Math.max(0, curRoom - 1); i <= Math.min(rooms.length - 1, curRoom + 1); i++) {
      activeRooms.add(i);
      surfCache.push(...rooms[i].surfaces);
    }
    rooms.forEach((r, i) => {
      const layer = activeRooms.has(i) ? 0 : 1;
      r.group.traverse((o) => {
        if ((o as THREE.Mesh).isMesh || (o as THREE.Sprite).isSprite || (o as THREE.Points).isPoints) o.layers.set(layer);
      });
    });
  };
  const nearSurfaces = () => surfCache;

  // ── pool de luzes: poucas luzes reais, emprestadas aos emissores mais relevantes ──
  const POOL = 6;
  interface Slot {
    light: THREE.PointLight;
    em: Emitter | null;
    room: number;
    w: number;
    leaving: boolean;
  }
  const slots: Slot[] = Array.from({ length: POOL }, () => {
    const light = new THREE.PointLight(0xffffff, 0, 0, 2);
    scene.add(light);
    return { light, em: null, room: 0, w: 0, leaving: false };
  });
  let lightTick = 0;
  const wp = new THREE.Vector3();
  const updateLights = (dt: number) => {
    lightTick -= dt;
    if (lightTick <= 0) {
      lightTick = 0.1;
      const cand: { e: Emitter; room: number; score: number }[] = [];
      activeRooms.forEach((i) => {
        for (const e of rooms[i].emitters) {
          if (e.intensity < 0.5) continue;
          wp.copy(e.pos).add(offs[i]);
          cand.push({ e, room: i, score: e.intensity / (1 + wp.distanceToSquared(camera.position)) });
        }
      });
      cand.sort((p, q) => q.score - p.score);
      const top = cand.slice(0, POOL);
      slots.forEach((sl) => {
        if (sl.em && !top.some((c) => c.e === sl.em)) sl.leaving = true; // saiu do top: apaga aos poucos
      });
      for (const c of top) {
        if (slots.some((sl) => sl.em === c.e)) continue;
        const free = slots.find((sl) => !sl.em);
        if (free) {
          free.em = c.e;
          free.room = c.room;
          free.w = 0;
          free.leaving = false;
        }
      }
    }
    let fireNear = 0;
    for (const sl of slots) {
      if (!sl.em) {
        sl.light.intensity = 0;
        continue;
      }
      sl.w += (sl.leaving ? -1 : 1) * dt * 7;
      if (sl.leaving && sl.w <= 0) {
        sl.em = null;
        sl.w = 0;
        sl.light.intensity = 0;
        continue;
      }
      sl.w = Math.min(1, sl.w);
      sl.light.position.copy(sl.em.pos).add(offs[sl.room]);
      sl.light.color.setHex(sl.em.color);
      sl.light.intensity = sl.em.intensity * sl.w * lightScale();
      fireNear = Math.max(fireNear, sl.w * Math.min(1, sl.em.intensity / (40 * (1 + 0.12 * sl.light.position.distanceToSquared(camera.position)))));
    }
    sfx.fire(fireNear);
  };

  // o dado caído no chão da 1ª sala (antes de o jogador pegá-lo)
  const layDie = () => {
    const lie = rooms[0]?.dieLie;
    if (!lie) {
      hasDie = true; // sala sem dado caído: não deixa o jogo sem dado
      return false;
    }
    dieRoom = 0;
    dieP.set(lie.x, lie.y + R, lie.z);
    dieV.set(0, 0, 0);
    dieW.set(0, 0, 0);
    restQ.setFromEuler(new THREE.Euler(-Math.PI / 2 + 0.35, 0.9, 0.2));
    worldDie.position.copy(dieP).add(offs[0]);
    worldDie.quaternion.copy(restQ);
    worldModel.scale.setScalar(0.42);
    // o dado SÓ está no chão depois de ter caído do poço (cena da porta trancada, `ctx.dropDie`); antes disso a sala não tem dado
    worldDie.visible = progress.has('caiu');
    thrownFace = 3;
    dieState = 'rest';
    restReturn = 0;
    return true;
  };
  const resetDie = () => {
    if (!hasDie && layDie()) return;
    dieState = 'hand';
    worldDie.visible = false;
    worldModel.scale.setScalar(0.42);
    dieV.set(0, 0, 0);
    handPop = 1;
  };

  // põe o jogador no ponto de início de uma sala
  const spawnIn = (i: number) => {
    const r = rooms[i];
    feetY = offs[i].y + r.start.y;
    pos.set(offs[i].x + r.start.x, feetY + EYE, offs[i].z + r.start.z);
    yaw = r.startYaw;
    pitch = -0.04;
    vy = 0;
    moveVel.set(0, 0, 0);
    brush.active = false;
    curRoom = i;
    dieRoom = i;
    resetDie();
    applyActive();
  };

  // luz, névoa e clima acompanham a sala onde o jogador está (suave, sem corte)
  const fogC = new THREE.Color();
  const ambC = new THREE.Color();
  // A Casa "acorda" conforme a história avança (marcos em src/story/progress.ts): a luz esquenta e
  // clareia aos poucos, a névoa recua e a cal das inscrições passa a brilhar.
  const WARM_FOG = new THREE.Color('#1c100c');
  const WARM_AMB = new THREE.Color(0xffc890);
  let stageK = progress.stage(); // suavizado: a mudança acontece ao longo de alguns segundos
  let inscGlow = 0;
  let outsideAtmo = false; // abertura: os planos de FORA do poço têm o próprio ar (névoa pálida da madrugada, mais luz)
  const blendAtmosphere = (dt: number, snap = false) => {
    if (outsideAtmo) {
      const f = scene.fog as THREE.Fog;
      f.color.set('#5d5b74');
      f.near = 3;
      f.far = 21; // ar grosso de madrugada: ao longe tudo vira silhueta na névoa
      ambient.color.setHex(0xa29fc6);
      ambient.intensity = 1.55;
      fogColor = '#' + f.color.getHexString();
      return;
    }
    const r = rooms[curRoom];
    const k = snap ? 1 : 1 - Math.exp(-dt * 2.2);
    stageK += (progress.stage() - stageK) * (snap ? 1 : Math.min(1, dt * 0.35));
    const sf = stageK / MAX_STAGE;
    fogC.set(r.fog.color).lerp(WARM_FOG, sf * 0.3);
    const f = scene.fog as THREE.Fog;
    f.color.lerp(fogC, k);
    f.near += (r.fog.near - f.near) * k;
    f.far += (r.fog.far + 3.5 * sf - f.far) * k;
    ambC.setHex(r.ambient.color).lerp(WARM_AMB, sf * 0.3);
    ambient.color.lerp(ambC, k);
    ambient.intensity += (r.ambient.intensity * (1 + 0.22 * sf) - ambient.intensity) * k;
    fogColor = '#' + f.color.getHexString();
  };

  // Olhar para uma inscrição por um instante manda os símbolos dela para o diário (como "avistados").
  const lookDir = new THREE.Vector3();
  const toIns = new THREE.Vector3();
  const readInscriptions = (dt: number) => {
    inscGlow += (0.24 + Math.min(0.5, stageK * 0.085) + (configStore.get().highContrast ? 0.35 : 0) - inscGlow) * Math.min(1, dt * 0.8); // (alto contraste: a cal brilha mais)
    camera.getWorldDirection(lookDir);
    const canRead = !ui.blocked() && !book.isOut() && !intro;
    // a inscrição que o jogador encara: o dado olha para lá também
    if (canRead && hasDie) {
      for (const i of activeRooms) {
        for (const ins of rooms[i].inscriptions ?? []) {
          if (ins.hidden) continue;
          toIns.copy(ins.center).add(offs[i]).sub(camera.position);
          const d = toIns.length();
          if (d > 6) continue;
          toIns.divideScalar(d);
          if (lookDir.dot(toIns) > 0.955 && toIns.dot(ins.normal) < -0.2) {
            lookedPos.copy(ins.center).add(offs[i]);
            lookedT = 0;
          }
        }
      }
    }
    // olhar uma palavra que tem desenho: o dado da mão mostra o rabisco na face de cima
    if (canRead && hasDie && !sketchOn) {
      for (const i of activeRooms) {
        for (const ins of rooms[i].inscriptions ?? []) {
          if (ins.hidden) continue;
          for (const p of ins.panels) {
            if (!p.id || !SKETCH_WORDS[p.id] || (sketchCount[p.id] ?? 0) >= SKETCH_MAX) continue;
            p.mesh.getWorldPosition(toIns).sub(camera.position);
            const d = toIns.length();
            toIns.divideScalar(d);
            const pg = p as unknown as { gaze?: number; shown?: boolean };
            if (pg.shown) continue; // cada palavra da parede só mostra o desenho uma vez por visita
            const looking = d < 4.6 && lookDir.dot(toIns) > 0.965 && toIns.dot(ins.normal) < -0.2;
            pg.gaze = Math.max(0, (pg.gaze ?? 0) + (looking ? dt : -dt));
            if (pg.gaze > 0.5) {
              pg.gaze = 0;
              pg.shown = true;
              showSketch(p.id);
            }
          }
        }
      }
    }
    activeRooms.forEach((i) => {
      for (const ins of rooms[i].inscriptions ?? []) {
        ins.setGlow(inscGlow);
        if (ins.read || ins.hidden || !canRead) continue;
        toIns.copy(ins.center).add(offs[i]).sub(camera.position);
        const d = toIns.length();
        if (d > 5.2) continue;
        toIns.divideScalar(d);
        // olhando de frente (ângulo estreito) e do lado de onde se lê
        if (lookDir.dot(toIns) < 0.88 || toIns.dot(ins.normal) > -0.2) {
          ins.seeT = Math.max(0, ins.seeT - dt);
          continue;
        }
        ins.seeT += dt;
        if (ins.seeT > 0.6) {
          ins.read = true;
          ins.words.forEach((id) => {
            diary.markSeen(id, rooms[i].name);
            quiz.wordRead(id); // uma pergunta do dado que ficou sem resposta pode voltar
          });
        }
      }
    });
  };

  // ── movimento e colisão do dado ─────────────────────────────────────────
  interface BoxT {
    min: THREE.Vector3;
    max: THREE.Vector3;
  }
  const collideBox = (b: BoxT, e: number): THREE.Vector3 | null => {
    tmpC.set(clamp(dieP.x, b.min.x, b.max.x), clamp(dieP.y, b.min.y, b.max.y), clamp(dieP.z, b.min.z, b.max.z));
    tmpN.subVectors(dieP, tmpC);
    const d2 = tmpN.lengthSq();
    if (d2 >= R * R) return null;
    let pen: number;
    if (d2 > 1e-10) {
      const d = Math.sqrt(d2);
      tmpN.divideScalar(d);
      pen = R - d;
    } else {
      // centro dentro da caixa: empurra pelo eixo de menor penetração
      const opts6: [number, number, number, number][] = [
        [dieP.x - b.min.x, -1, 0, 0],
        [b.max.x - dieP.x, 1, 0, 0],
        [dieP.y - b.min.y, 0, -1, 0],
        [b.max.y - dieP.y, 0, 1, 0],
        [dieP.z - b.min.z, 0, 0, -1],
        [b.max.z - dieP.z, 0, 0, 1],
      ];
      opts6.sort((p, q) => p[0] - q[0]);
      tmpN.set(opts6[0][1], opts6[0][2], opts6[0][3]);
      pen = opts6[0][0] + R;
    }
    dieP.addScaledVector(tmpN, pen);
    const vn = dieV.dot(tmpN);
    if (vn < 0) dieV.addScaledVector(tmpN, -(1 + e) * vn);
    return tmpN;
  };

  const stepDie = (dt: number) => {
    const ph = PHYS[thrownFace] ?? PHYS[1];
    dieV.y -= ph.g * dt;
    dieP.addScaledVector(dieV, dt);
    const vx0 = dieV.x;
    const vy0 = dieV.y;
    const vz0 = dieV.z;
    let ground = false;
    let flat = true;
    // chão (plano ou rampa)
    const room = rooms[dieRoom];
    const fy = room.dieFloor(dieP.x, dieP.z) + R;
    if (dieP.y < fy) {
      const eps = 0.05;
      const gx = (room.dieFloor(dieP.x + eps, dieP.z) - room.dieFloor(dieP.x - eps, dieP.z)) / (2 * eps);
      const gz = (room.dieFloor(dieP.x, dieP.z + eps) - room.dieFloor(dieP.x, dieP.z - eps)) / (2 * eps);
      gN.set(-gx, 1, -gz).normalize();
      dieP.y = fy;
      const vn = dieV.dot(gN);
      if (vn < 0) dieV.addScaledVector(gN, -(1 + ph.e) * vn);
      ground = true;
      flat = gN.y > 0.98;
    }
    room.clampDie(dieP, dieV, ph.e, R);
    for (const b of room.boxes) {
      const n = collideBox(b, ph.e);
      if (n && n.y > 0.7) ground = true;
    }
    sfx.bounce(Math.hypot(dieV.x - vx0, dieV.y - vy0, dieV.z - vz0));
    if (ground) {
      const k = Math.exp(-ph.fr * dt);
      dieV.x *= k;
      dieV.z *= k;
      if (flat && Math.abs(dieV.y) < 0.6) dieV.y = 0;
      dieW.set(dieV.z, 0, -dieV.x).divideScalar(R * 1.6); // rola no chão
    }
    dieRoll = ground && flat ? Math.min(1, Math.hypot(dieV.x, dieV.z) / 6) : 0;
    if (ground && dieV.length() < 0.45) restTimer += dt;
    else restTimer = 0;
    if (restTimer > 0.2) {
      dieState = 'rest';
      dieV.set(0, 0, 0);
      restReturn = 0;
      if (landQ) {
        restQ.copy(landQ); // o dado da abertura já chegou assim: nada de se debater no chão
        landQ = null;
      } else {
        const yawQ = tmpQ.setFromAxisAngle(tmpAxis.set(0, 1, 0), Math.random() * Math.PI * 2);
        restQ.copy(yawQ).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))).multiply(faceQ(thrownFace));
      }
      room.onDieRest?.();
      sfx.play('rest');
      dieRoll = 0;
    }
  };

  // onde fica o dado na mão (em coordenadas do mundo): por aqui ele sai e volta
  const handWorld = (out: THREE.Vector3) => {
    camera.updateMatrixWorld();
    camera.getWorldDirection(fwdV);
    rightV.set(Math.cos(yaw), 0, -Math.sin(yaw));
    return out.copy(camera.position).addScaledVector(fwdV, 0.6).addScaledVector(rightV, 0.3).setY(camera.position.y - 0.26);
  };
  const animFrom = new THREE.Vector3();
  const animTo = new THREE.Vector3();
  let animT = 0;

  // recolher: o dado voa de volta até a mão (em vez de sumir)
  const recall = () => {
    if (dieState === 'hand' || dieState === 'returning' || dieState === 'placing') return;
    animFrom.copy(worldDie.position);
    animT = 0;
    dieState = 'returning';
    sfx.play('recall');
  };

  // nas CENAS o jogador não olha em volta (a câmera é da cena) e a mira some: abertura, o dado falando no centro, cenas travadas, o caderno achado
  const lookLocked = () => pinned || holds > 0 || intro !== null || camTween !== null || dieCine > 0.5 || ui.bookCall();
  let cineWas = false;
  const busy = () => complete || ui.blocked() || book.isOut() || holds > 0 || intro !== null || burn !== null; // fim de jogo, conversa ou diário (inclusive o livro subindo/descendo): o jogador fica parado

  // ── marcos da história ──
  const onMilestone = (f: Flag) => {
    void f; // (por enquanto os marcos só mudam a luz e a cal; faces novas chegam bem depois)
  };

  // ── dado queimando (acender com o Fogo): ~1,5 s, câmera parada, qualquer toque pula o resto ──
  const BURN_FIRST = 1.5;
  const BURN_AGAIN = 0.3;
  const burnFrames = flameFrames();
  const burnSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: burnFrames[0], fog: false, alphaTest: 0.4, depthWrite: false }));
  burnSprite.visible = false;
  scene.add(burnSprite);
  let skipScene = false;
  const startBurn = (first: boolean) => {
    if (burn || (dieState !== 'flying' && dieState !== 'rest')) return;
    if (dieState === 'flying') {
      restQ.copy(worldDie.quaternion);
      dieState = 'rest';
    }
    dieV.set(0, 0, 0);
    dieW.set(0, 0, 0);
    restReturn = 0;
    burn = { t: 0, dur: first ? BURN_FIRST : BURN_AGAIN };
    skipScene = false;
  };
  const endBurn = () => {
    burn = null;
    burnHeat = 0;
    burnSprite.visible = false;
    for (const m of dieMats) {
      m.emissive.setHex(0xffffff);
      m.color.setScalar(1);
    }
    resetDie(); // o dado renasce na mão
    handPop = 1.6;
    sfx.play('catch');
  };
  const updateBurn = (dt: number, time: number) => {
    if (!burn) return;
    burn.t += dt * (skipScene ? 5 : 1);
    const u = Math.min(1, burn.t / burn.dur);
    // 0–0.25: a chama sobe; 0.25–0.7: o dado esquenta e escurece; 0.7–1: vira brasa e some
    const grow = u < 0.25 ? u / 0.25 : u < 0.7 ? 1 : Math.max(0, 1 - (u - 0.7) / 0.3);
    burnHeat = u < 0.6 ? u / 0.6 : Math.max(0, 1 - (u - 0.6) / 0.4) * 1;
    const char = clamp((u - 0.35) / 0.4, 0, 1);
    for (const m of dieMats) {
      m.emissive.setRGB(1, 1 - 0.5 * burnHeat, 1 - 0.85 * burnHeat);
      m.color.setScalar(1 - 0.7 * char);
    }
    worldDie.visible = true;
    const shrink = u > 0.7 ? 1 - ((u - 0.7) / 0.3) * 0.92 : 1;
    worldModel.scale.setScalar(0.42 * shrink);
    worldDie.position.x += Math.sin(time * 60) * 0.004 * burnHeat;
    burnSprite.visible = grow > 0.02;
    burnSprite.position.copy(worldDie.position);
    burnSprite.position.y += 0.2 + 0.12 * grow;
    burnSprite.scale.set(0.2 + 0.85 * grow, 0.16 + 0.72 * grow, 1);
    burnSprite.material.map = burnFrames[Math.floor(time * 14) % burnFrames.length];
    if (u >= 1) endBurn();
  };

  // ── cena de acordar (só na primeira vez): escuro, o corpo no chão, o poço de luz no teto ──
  const introEase = (u: number) => u * u * (3 - 2 * u);
  let introDrop = 0; // quanto a câmera está abaixo dos olhos (deitado)
  let introRoll = 0;
  const INTRO_LINES = {
    lying: [
      { who: 'thought' as const, text: 'Dói tudo.' },
      { who: 'thought' as const, text: 'Caí? Ou me jogaram?' },
    ],
    shaft: [
      { who: 'thought' as const, text: 'Luz, lá em cima. Alto demais.' },
      { who: 'thought' as const, text: 'Preciso de uma porta.' },
    ],
  };
  const startIntro = () => {
    intro = { ph: 0, t: 0 };
    introDrop = 1.25;
    introRoll = 0.34;
    fadeQuad.visible = true;
    fadeMat.opacity = 1;
    yaw = rooms[0].startYaw + 0.55;
    pitch = -0.42;
  };
  // o ponto de onde cada fase do giro parte (e o ponto onde ele pára)
  let introY0 = 0;
  let introP0 = 0;
  let introY1 = 0;
  let introP1 = 0;
  const updateIntro = (dt: number) => {
    if (!intro) return;
    intro.t += dt;
    const I = intro;
    const sy = rooms[0].startYaw;
    if (I.ph === 0 || I.ph === 1) {
      yaw = sy + 0.55;
      pitch = -0.42;
      introDrop = 1.25 + Math.sin(I.t * 1.5) * 0.012;
      introRoll = 0.34 + Math.sin(I.t * 0.9) * 0.02;
    }
    if (I.ph === 0) {
      // preto, um baque, e a vista volta devagar
      if (I.t > 0.5 && I.t - dt <= 0.5) sfx.play('rest');
      fadeMat.opacity = 1 - introEase(clamp((I.t - 0.8) / 2.4, 0, 1));
      if (I.t > 3.6) {
        fadeQuad.visible = false;
        I.ph = 1;
        I.t = 0;
        dialogue.say(INTRO_LINES.lying, {
          block: true,
          onEnd: () => {
            if (!intro) return;
            intro.ph = 2;
            intro.t = 0;
            introY0 = yaw;
            introP0 = pitch;
          },
        });
      }
    } else if (I.ph === 2) {
      // levanta
      const u = introEase(clamp(I.t / 2.6, 0, 1));
      introDrop = 1.25 * (1 - u);
      introRoll = 0.34 * (1 - u);
      pitch = introP0 + (-0.04 - introP0) * u;
      yaw = introY0 + (sy - introY0) * u;
      if (I.t >= 2.6) {
        I.ph = 3;
        I.t = 0;
        introY0 = yaw;
        introP0 = pitch;
        // para onde olhar: o poço
        const sh = rooms[0].shaft;
        const w = sh ? sh.clone().add(offs[0]) : new THREE.Vector3(0, 8, -4);
        const y1 = Math.atan2(-(w.x - pos.x), -(w.z - pos.z));
        introY1 = introY0 + Math.atan2(Math.sin(y1 - introY0), Math.cos(y1 - introY0));
        introP1 = clamp(Math.atan2(w.y - (pos.y - 0.05), Math.hypot(w.x - pos.x, w.z - pos.z)), -0.2, 1.45);
      }
    } else if (I.ph === 3) {
      // olha o poço no teto
      const u = introEase(clamp(I.t / 1.8, 0, 1));
      yaw = introY0 + (introY1 - introY0) * u;
      pitch = introP0 + (introP1 - introP0) * u;
      if (I.t >= 1.8) {
        I.ph = 4;
        I.t = 0;
        dialogue.say(INTRO_LINES.shaft, {
          block: true,
          onEnd: () => {
            if (!intro) return;
            intro.ph = 5;
            intro.t = 0;
          },
        });
      }
    } else if (I.ph === 4) {
      yaw = introY1;
      pitch = introP1;
    } else if (I.ph === 5) {
      // baixa os olhos de volta: o jogo começa
      const u = introEase(clamp(I.t / 1.6, 0, 1));
      yaw = introY1 + (sy - introY1) * u;
      pitch = introP1 + (-0.04 - introP1) * u;
      if (I.t >= 1.6) {
        pitch = -0.04;
        yaw = sy;
        intro = null;
        introDrop = 0;
        introRoll = 0;
        progress.set('intro');
      }
    }
  };

  const throwDie = () => {
    if (dieState !== 'hand' || busy()) return;
    thrownFace = face;
    dieThrown = true;
    updateMats();
    const ph = PHYS[face] ?? PHYS[1];
    camera.getWorldDirection(fwdV);
    dieRoom = curRoom;
    handWorld(dieP);
    dieP.sub(offs[dieRoom]); // a posição do dado é local à sala dele
    dieV.copy(fwdV).multiplyScalar(ph.speed);
    dieV.y += ph.up * ph.speed;
    dieV.addScaledVector(moveVel, 0.6); // herda um pouco do movimento de quem arremessa
    dieW.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14);
    worldDie.position.copy(dieP).add(offs[dieRoom]);
    worldModel.scale.setScalar(0.42);
    worldDie.visible = true;
    dieState = 'flying';
    restTimer = 0;
    sfx.play('throw');
  };

  // Posicionar: em vez de arremessar, o jogador coloca o dado com cuidado no ponto
  // que a mira aponta (alcance curto). Serve pra apertar placa e acender o braseiro
  // com precisão — mas o dado "posicionado" não pega segredos: pra eles
  // ainda é preciso arremessar (ricochete).
  const PLACE_RANGE = 3.2;
  const aimPoint = (): { p: THREE.Vector3; n: THREE.Vector3; room: number } | null => {
    camera.updateMatrixWorld();
    ray.setFromCamera(ndc0, camera);
    ray.far = PLACE_RANGE;
    const hit = ray.intersectObjects(nearSurfaces(), false)[0];
    if (!hit || !hit.face) return null;
    // só dá pra posicionar dentro do salão (não no corredor, que é só passagem)
    const ri = roomOfZ(hit.point.z);
    const lz = hit.point.z - offs[ri].z;
    if (lz < rooms[ri].doorZ - 0.1 || lz > rooms[ri].entranceZ - 0.15) return null; // (a própria porta conta: há portas que são lousas)
    const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    if (n.dot(ray.ray.direction) > 0) n.negate();
    return { p: hit.point, n, room: ri };
  };
  const placeDie = () => {
    if (dieState !== 'hand' || busy()) return;
    const a = aimPoint();
    if (!a) {
      caption('Longe demais', '', '#cfc6e8');
      return;
    }
    thrownFace = face;
    dieThrown = false;
    updateMats();
    dieRoom = a.room;
    animTo.copy(a.p).addScaledVector(a.n, R + 0.02);
    // encaixe: perto de um braseiro/altar, o dado vai exatamente pro centro, em cima dele
    const off = offs[a.room];
    let best = 0.6; // tolerância vertical (m)
    for (const s of rooms[a.room].sockets ?? []) {
      const dh = Math.hypot(a.p.x - off.x - s.x, a.p.z - off.z - s.z);
      const dy = Math.abs(a.p.y - off.y - s.y);
      if (dh <= s.r && dy < best) {
        best = dy;
        animTo.set(off.x + s.x, off.y + s.y + R + 0.02, off.z + s.z);
      }
    }
    handWorld(animFrom);
    animT = 0;
    dieV.set(0, 0, 0);
    dieW.set(0, 0, 0);
    worldDie.position.copy(animFrom);
    worldModel.scale.setScalar(0.3);
    worldDie.quaternion.setFromAxisAngle(tmpAxis.set(0, 1, 0), Math.random() * Math.PI * 2);
    worldDie.visible = true;
    dieState = 'placing';
    sfx.play('throw', 0.4);
  };

  const place = () => {
    if (!hasDie || tool !== 'die') return;
    if (dieState === 'hand') placeDie();
    else recall();
  };

  const action = () => {
    if (interact()) return; // algo ao alcance (a porta, o giz no chão)? usa isso em vez de arremessar
    if (!hasDie || tool !== 'die') return;
    if (dieState === 'hand') throwDie();
    else recall();
  };

  const selectFace = (n: number) => {
    const f = FACES[n - 1];
    if (!f) return;
    if (!f.unlocked) {
      caption(`${n} · ?`, 'Selada.', '#8f86a8');
      sfx.play('locked');
      return;
    }
    if (tool !== 'die') setTool('die');
    applyFace(n);
    sfx.play('face', n);
    caption(`${n} · ${f.name}`, f.desc, f.color);
  };
  const cycleFace = (dir: number) => {
    if (tool !== 'die') {
      setTool('die');
      return;
    }
    let n = face;
    for (let i = 0; i < 6; i++) {
      n = ((n - 1 + dir + 6) % 6) + 1;
      if (FACES[n - 1].unlocked) break;
    }
    selectFace(n);
  };

  // ── tamanho / proporção ─────────────────────────────────────────────────
  const soapBase = new THREE.Vector3(-0.4, -0.15, -1);
  let fovBase = 66;
  let handX = 0.44;
  let dieBaseY = -0.2;
  let dieScaleBase = 0.17;
  // vindos das CONFIGURAÇÕES (story/config.ts)
  let pixelSize: 'fino' | 'medio' | 'grosso' = 'medio';
  let fovH = 95;
  let sensMouse = 1;
  let sensTouch = 1;
  let invY = 1;
  let fpsCap = 0;
  let calmFx = false; // reduzir tremores e clarões
  let lastDraw = 0;
  let devNoHud = false; // (testes: capturas sem o dado da mão)
  let shadowsOn = true;
  let diaryWas = false;
  const resize = () => {
    // Linhas na vertical: no celular ~200 (pixel bem visível); no PC e telas grandes, um meio-termo (~240 a 290): com 200 linhas num monitor
    // grande cada pixel virava um bloco de 5 a 7 e ficava difícil de entender; com 360 o pixel art sumia demais (pedidos do Pedro).
    const big = window.innerHeight >= 600;
    const pixelLines = big ? (pixelSize === 'fino' ? 360 : pixelSize === 'grosso' ? 200 : 280) : pixelSize === 'fino' ? 270 : pixelSize === 'grosso' ? 150 : 200;
    const scale = Math.max(2, Math.round(window.innerHeight / pixelLines));
    const w = Math.max(64, Math.ceil(window.innerWidth / scale));
    const h = Math.max(64, Math.ceil(window.innerHeight / scale));
    renderer.setSize(w, h, false);
    rt.setSize(w, h);
    rtHud.setSize(w, h);
    rtSnap.setSize(w, h);
    if (rt.depthTexture) {
      rt.depthTexture.image.width = w;
      rt.depthTexture.image.height = h;
      rt.depthTexture.dispose();
    }
    postMat.uniforms.uRes.value.set(w, h);
    const aspect = w / h;
    const vFromH = (hDeg: number) => (2 * Math.atan(Math.tan((hDeg * Math.PI) / 360) / aspect) * 180) / Math.PI;
    fovBase = aspect >= 1 ? Math.min(66 * (fovH / 95), vFromH(fovH)) : Math.min(100, Math.max(66, vFromH(82 * (fovH / 95))));
    camera.fov = fovBase;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    dieCam.aspect = aspect;
    dieCam.updateProjectionMatrix();
    const halfW = Math.tan((45 * Math.PI) / 360) * aspect;
    dieScaleBase = Math.min(0.235, halfW * 0.56);
    dieBaseY = aspect < 1 ? -0.1 : -0.14;
    handX = Math.min(halfW * 0.4, 0.47);
    hudHalfW = halfW;
    soapBase.set(-handX, dieBaseY + 0.02, -1);
  };
  resize();
  window.addEventListener('resize', resize);
  const applyConfig = () => {
    const c = configStore.get();
    sfx.setVolumes(c.volMaster / 10, c.volMusic / 10, c.volSfx / 10);
    postMat.uniforms.uBright.value = 1 + c.brightness * 0.07;
    postMat.uniforms.uBloom.value = c.quality === 'baixa' ? 0 : 1;
    postMat.uniforms.uGlowK.value = c.reduceFlash ? 0.08 : 0.16;
    shadowsOn = c.quality === 'alta';
    rooms.forEach((r) => {
      if (r.shadowLight && r.shadowLight.castShadow !== shadowsOn) r.shadowLight.castShadow = shadowsOn;
    });
    pixelSize = c.pixel;
    fovH = c.fov;
    sensMouse = c.mouseSens / 5;
    sensTouch = c.touchSens / 5;
    invY = c.invertY ? -1 : 1;
    fpsCap = c.fpsCap;
    calmFx = c.reduceFlash;
    dbg.bob = !c.reduceMotion;
    resize();
  };
  const unsubConfig = configStore.subscribe(applyConfig);

  // ── entrada ─────────────────────────────────────────────────────────────
  // PC: WASD anda, o primeiro clique captura o mouse (olhar livre; Esc solta).
  //   Dado: botão esquerdo arremessa/recolhe, direito (ou G) posiciona, 1–6 / roda trocam a face.
  //   Giz (Tab/Q troca): segurar o esquerdo desenha, segurar o direito apaga, X apaga tudo.
  //   R reinicia a sala.
  // Celular (horizontal): lado esquerdo = analógico; lado direito = olhar (ou desenhar/apagar,
  // conforme o modo do giz). Os botões na tela fazem o resto.
  const START_KEYS = new Set<string>();
  const keys = START_KEYS;
  const onKeyDown = (e: KeyboardEvent) => {
    if (ui.blocked() || book.isOut() || quizPh !== 'idle') return;
    const k = config.translate(e.key.toLowerCase()); // teclas remapeadas nas configurações → a tecla padrão da ação
    if (!k) return;
    keys.add(k);
    if (e.repeat) return;
    if (/^[1-6]$/.test(k)) hasDie && selectFace(Number(k));
    else if (k === ' ' || k === 'f') {
      e.preventDefault();
      action();
    } else if (k === 'e') {
      if (!interact() && hasDie) recall();
    }
    else if (k === 'r') reset();
    else if (k === 'g') place();
    else if (k === 'tab' || k === 'q') {
      e.preventDefault();
      swapTool();
    } else if (k === 'x') clearChalk();
  };
  const onKeyUp = (e: KeyboardEvent) => {
    const k = config.translate(e.key.toLowerCase());
    if (k) keys.delete(k);
    keys.delete(e.key.toLowerCase());
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (busy()) return;
    if (hasDie) cycleFace(e.deltaY > 0 ? 1 : -1);
  };
  canvas.addEventListener('wheel', onWheel, { passive: false });

  let lookId = -1;
  let stickId = -1;
  let lastX = 0;
  let lastY = 0;
  let downT = 0;
  let downX = 0;
  let downY = 0;
  let moved = false;
  let stickOx = 0;
  let stickOy = 0;
  let stickX = 0;
  let stickY = 0;
  const STICK_R = 46;
  const LOOK_EDGE = 0.78; // com o giz no celular: x ≥ 78% da tela = olhar
  const emitStick = (active: boolean) => opts.onStick?.({ active, ox: stickOx, oy: stickOy, x: stickX, y: stickY });

  let lockFailed = !canvas.requestPointerLock;
  let lockClick = false;
  const locked = () => document.pointerLockElement === canvas;
  let everLocked = false;
  const onLockError = () => {
    // depois de soltar com Esc, o navegador recusa capturar de novo por ~1 s: não é "negado", é só cedo demais
    if (everLocked) {
      opts.onLook?.('free');
      return;
    }
    lockFailed = true;
    opts.onLook?.('denied');
  };
  const onLockChange = () => {
    if (locked()) everLocked = true;
    opts.onLook?.(locked() ? 'locked' : 'free');
    // o mouse foi solto no meio do jogo (Esc, trocar de janela): PAUSA. Mas não quando foi o PRÓPRIO jogo que soltou o mouse: a pergunta do dado
    // solta o mouse para as opções (ainda na subida do dado, antes de a pergunta estar "ativa") e as cenas do dado ao centro também não pausam
    const ownRelease = quizPh !== 'idle' || dieCineTarget > 0.5 || intro !== null || burn !== null;
    if (!locked() && mode === 'play' && !ui.diaryOpen() && !book.isOut() && !ui.blocked() && !complete && !ownRelease) opts.onPause?.();
  };
  const requestLock = () => {
    if (locked() || lockFailed || window.matchMedia('(pointer: coarse)').matches) return;
    try {
      Promise.resolve(canvas.requestPointerLock()).catch(onLockError);
    } catch {
      onLockError();
    }
  };
  document.addEventListener('pointerlockerror', onLockError);
  document.addEventListener('pointerlockchange', onLockChange);

  const setBrushNdc = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && locked()) {
      brush.ndc.set(0, 0);
      return;
    }
    const r = canvas.getBoundingClientRect();
    brush.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
  };

  const capture = (id: number) => {
    try {
      canvas.setPointerCapture(id);
    } catch {
      /* ponteiro já não está ativo: segue sem captura */
    }
  };
  const onDown = (e: PointerEvent) => {
    if (busy()) return;
    const mouse = e.pointerType === 'mouse';
    // PC: o primeiro clique captura o mouse
    if (mouse && e.button === 0 && !locked() && !lockFailed) {
      lockClick = true;
      try {
        Promise.resolve(canvas.requestPointerLock()).catch(onLockError);
      } catch {
        onLockError();
      }
    }
    if (mouse && e.button === 2) {
      if (tool === 'chalk') {
        brush.active = true;
        brush.erase = true;
        brush.id = e.pointerId;
        brush.mouse = true;
        setBrushNdc(e);
        capture(e.pointerId);
      } else place(); // botão direito: posicionar
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    if (!mouse && rx < 0.42 && stickId === -1) {
      stickId = e.pointerId;
      stickOx = e.clientX;
      stickOy = e.clientY;
      stickX = 0;
      stickY = 0;
      emitStick(true);
    } else if (tool === 'chalk' && !mouse && rx >= LOOK_EDGE && lookId === -1) {
      // celular com o giz: a faixa da direita gira a câmera (o meio da tela desenha)
      lookId = e.pointerId;
      lastX = downX = e.clientX;
      lastY = downY = e.clientY;
      downT = performance.now();
      moved = false;
    } else if (tool === 'chalk' && !brush.active) {
      // giz: arrastar desenha (ou apaga) onde o dedo/mouse está
      brush.active = true;
      brush.erase = !mouse && chalkMode === 'erase';
      brush.id = e.pointerId;
      brush.mouse = mouse;
      setBrushNdc(e);
      chalk.beginStroke();
    } else if (lookId === -1) {
      lookId = e.pointerId;
      lastX = downX = e.clientX;
      lastY = downY = e.clientY;
      downT = performance.now();
      moved = false;
    } else {
      return;
    }
    capture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (lookLocked() && e.pointerId !== brush.id) {
      // cena (abertura, o dado falando, o caderno achado): o olhar não se mexe
    } else if (e.pointerType === 'mouse' && locked()) {
      yaw -= e.movementX * 0.0022 * sensMouse;
      pitch = clamp(pitch - e.movementY * 0.0022 * sensMouse * invY, -1.2, 1.5);
    } else if (e.pointerId === lookId) {
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      if (Math.hypot(dx, dy) > 8) moved = true;
      yaw -= (e.clientX - lastX) * 0.0075 * sensTouch;
      pitch = clamp(pitch - (e.clientY - lastY) * 0.0075 * sensTouch * invY, -0.8, 1.3);
      lastX = e.clientX;
      lastY = e.clientY;
    }
    if (e.pointerId === brush.id && brush.active) setBrushNdc(e);
    if (e.pointerId === stickId) {
      let dx = (e.clientX - stickOx) / STICK_R;
      let dy = (e.clientY - stickOy) / STICK_R;
      const len = Math.hypot(dx, dy);
      if (len > 1) {
        dx /= len;
        dy /= len;
      }
      stickX = dx;
      stickY = dy;
      emitStick(true);
    }
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerId === brush.id && brush.active) {
      const mouseBtn = e.pointerType === 'mouse' && e.type === 'pointerup';
      if (!mouseBtn || (brush.erase ? e.button === 2 : e.button === 0)) {
        brush.active = false;
        chalk.beginStroke();
      }
    }
    if (e.pointerId === lookId) {
      lookId = -1;
      if (lockClick) lockClick = false; // esse clique só capturou o mouse
      else if (e.pointerType === 'mouse' && e.type === 'pointerup' && !moved && performance.now() - downT < 350) action();
    }
    if (lockClick && e.pointerType === 'mouse' && e.button === 0) lockClick = false;
    if (e.pointerId === stickId) {
      stickId = -1;
      stickX = 0;
      stickY = 0;
      emitStick(false);
    }
  };
  const onContext = (e: Event) => e.preventDefault();
  canvas.addEventListener('contextmenu', onContext);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  // Colisão do jogador: círculo (raio PR) contra retângulos no plano XZ.
  const PR = 0.3;
  const pushOut = (r: [number, number, number, number, (number | undefined)?]) => {
    if (r[4] !== undefined && feetY >= r[4] - 0.3) return; // por cima do obstáculo: não bloqueia
    const cx = clamp(pos.x, r[0], r[2]);
    const cz = clamp(pos.z, r[1], r[3]);
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= PR * PR) return;
    let nx: number;
    let nz: number;
    if (d2 > 1e-8) {
      const d = Math.sqrt(d2);
      nx = dx / d;
      nz = dz / d;
      pos.x = cx + nx * PR;
      pos.z = cz + nz * PR;
    } else {
      // centro dentro do retângulo: sai pelo lado mais próximo
      const l = pos.x - r[0];
      const rr = r[2] - pos.x;
      const f = pos.z - r[1];
      const b = r[3] - pos.z;
      const m = Math.min(l, rr, f, b);
      nx = m === l ? -1 : m === rr ? 1 : 0;
      nz = m === f ? -1 : m === b ? 1 : 0;
      if (nx !== 0) pos.x = nx < 0 ? r[0] - PR : r[2] + PR;
      else pos.z = nz < 0 ? r[1] - PR : r[3] + PR;
    }
    const vn = moveVel.x * nx + moveVel.z * nz;
    if (vn < 0) {
      moveVel.x -= nx * vn;
      moveVel.z -= nz * vn;
    }
  };

  const lcl = new THREE.Vector3();
  // obstáculos das salas vizinhas, em coordenadas do mundo
  const worldRects = (): Rect[] => {
    const out: Rect[] = [];
    for (let i = Math.max(0, curRoom - 1); i <= Math.min(rooms.length - 1, curRoom + 1); i++) {
      const o = offs[i];
      for (const r of rooms[i].rects(feetY - o.y)) out.push([r[0] + o.x, r[1] + o.z, r[2] + o.x, r[3] + o.z, r[4] === undefined ? undefined : r[4] + o.y]);
    }
    return out;
  };

  const MAX_SPEED = 4.2; // m/s (antes 2,7)
  const STRIDE = 1.7; // metros por passo
  const SPRINT = 1.35; // Shift (PC)
  const move = (dt: number) => {
    if (autoWalk) {
      // cena: o personagem anda sozinho até um ponto fixo, a passo constante, virando o rosto para onde vai
      const dx = autoWalk.x - pos.x;
      const dz = autoWalk.z - pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.04) {
        autoWalk = null;
        moveVel.set(0, 0, 0);
        return false;
      }
      const sp = Math.min(autoWalk.speed, d * 3 + 0.25); // freia no fim
      moveVel.set((dx / d) * sp, 0, (dz / d) * sp);
      const step = Math.min(d, sp * dt);
      pos.x += (dx / d) * step;
      pos.z += (dz / d) * step;
      if (d > 0.35) {
        const ty = Math.atan2(-dx, -dz);
        yaw += Math.atan2(Math.sin(ty - yaw), Math.cos(ty - yaw)) * Math.min(1, dt * 4);
        pitch += (-0.06 - pitch) * Math.min(1, dt * 3);
      }
      return true;
    }
    if (busy() || pinned) {
      moveVel.set(0, 0, 0);
      return false;
    }
    const kf = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0);
    const ks = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
    // analógico: zona morta pequena e resposta suave (empurrar pouco = andar devagar)
    const sl = Math.hypot(stickX, stickY);
    const sk = sl < 0.12 ? 0 : Math.min(1, (sl - 0.12) / 0.78) ** 1.2 / sl;
    let fwd = kf - stickY * sk;
    let str = ks + stickX * sk;
    const len = Math.hypot(fwd, str);
    if (len > 1) {
      fwd /= len;
      str /= len;
    }
    const run = (keys.has('shift') ? SPRINT : 1) * walkK;
    // A inércia é calculada NO REFERENCIAL DA CÂMERA (f = pra frente, s = pra direita). Antes era no
    // mundo: ao girar andando, a velocidade demorava a acompanhar e o personagem "escorregava".
    const cyw = Math.cos(yaw);
    const syw = Math.sin(yaw);
    let vf = -syw * moveVel.x - cyw * moveVel.z;
    let vs = cyw * moveVel.x - syw * moveVel.z;
    const k = 1 - Math.exp(-dt * (len > 0.02 ? 15 : 20)); // arranca e freia rápido
    vf += (fwd * MAX_SPEED * run - vf) * k;
    vs += (str * MAX_SPEED * run - vs) * k;
    moveVel.x = -syw * vf + cyw * vs;
    moveVel.z = -cyw * vf - syw * vs;
    const sp = Math.hypot(moveVel.x, moveVel.z);
    if (sp < 0.02) {
      moveVel.set(0, 0, 0);
      return false;
    }
    // passos curtos pra nunca atravessar parede
    const steps = Math.max(1, Math.ceil((sp * dt) / 0.1));
    for (let i = 0; i < steps; i++) {
      pos.x += (moveVel.x * dt) / steps;
      pos.z += (moveVel.z * dt) / steps;
      for (let pass = 0; pass < 2; pass++) {
        for (const r of worldRects()) pushOut(r);
        if (dieState === 'rest') {
          const dx = pos.x - dieP.x;
          const dz = pos.z - dieP.z;
          const d = Math.hypot(dx, dz);
          if (d < PR + R && Math.abs(dieP.y - feetY) < 1.2) {
            const nx = d > 1e-6 ? dx / d : 1;
            const nz = d > 1e-6 ? dz / d : 0;
            pos.x = dieP.x + nx * (PR + R);
            pos.z = dieP.z + nz * (PR + R);
          }
        }
      }
      const cr = rooms[curRoom];
      if (cr.clampPlayer) {
        lcl.copy(pos).sub(offs[curRoom]);
        cr.clampPlayer(lcl);
        pos.copy(lcl).add(offs[curRoom]);
      }
    }
    return sp > 0.35;
  };

  // gravidade: subir rampa gruda no chão; ladeira abaixo acompanha; beirada = queda
  const vertical = (dt: number) => {
    const ri = roomOfZ(pos.z);
    const gy = rooms[ri].groundY(pos.x - offs[ri].x, pos.z - offs[ri].z, feetY - offs[ri].y) + offs[ri].y;
    const diff = gy - feetY;
    if (diff >= 0 || (diff > -0.3 && vy === 0)) {
      feetY = gy;
      vy = 0;
    } else {
      vy -= 22 * dt;
      feetY += vy * dt;
      if (feetY <= gy) {
        landKick = Math.min(1, -vy / 9);
        sfx.play('land', landKick);
        feetY = gy;
        vy = 0;
      }
    }
  };

  // reinicia só a sala atual (o giz fica)
  const reset = () => {
    if (busy()) return;
    rooms[curRoom].reset();
    spawnIn(curRoom);
  };

  const restart = () => {
    gems = 0;
    complete = false;
    chalk.clear();
    announced.clear();
    rooms.forEach((r) => r.reset());
    spawnIn(0);
    blendAtmosphere(0, true);
    announced.add(0);
    diary.visitRoom(rooms[0].name);
    caption(rooms[0].name, rooms[0].subtitle, '#ffd36b');
  };

  let chatFn: (key: string) => void = () => {};
  buildWorld();
  if (new URLSearchParams(location.search).get('demo') !== 'mapa') setWorld(layoutWorld(rooms.map((r) => r.name)));
  scene.fog = new THREE.Fog(rooms[0].fog.color, rooms[0].fog.near, rooms[0].fog.far);
  ambient.color.setHex(rooms[0].ambient.color);
  ambient.intensity = rooms[0].ambient.intensity;
  {
    // pré-visualizações (?demo) não mexem no progresso salvo; ?intro=0 pula a cena de acordar (testes)
    const q = new URLSearchParams(location.search);
    if (q.has('demo') || q.has('lab') || q.get('intro') === '0') saves.noSave(); // (testes e pré-visualizações não gravam no espaço)
    if (q.has('demo')) {
      progress.noSave();
      for (const f of ['fogo', 'dois', 'tres', 'escrivao', 'intro', 'dado', 'giz'] as const) progress.set(f);
    } else if (q.has('lab')) {
      progress.noSave();
      for (const f of ['intro', 'dado', 'giz'] as const) progress.set(f);
    } else if (q.get('intro') === '0') {
      progress.noSave();
      for (const f of ['intro', 'dado', 'giz'] as const) progress.set(f);
    }
    hasDie = progress.has('dado');
    hasChalk = CHALK_OK && progress.has('giz');
  }
  // ── ESPAÇOS DE JOGO E SALVAMENTO (INTERFACE.md §2, story/save.ts) ──
  // Salva sozinho ao entrar numa sala, ao resolver um puzzle (a porta abre, a gema) e ao fechar o diário; também ao pausar e ao sair da página.
  // O resumo (meta) guarda a sala, a posição, o tempo, as gemas e uma miniatura; o resto (marcos, diário, perguntas) cada loja grava sozinha.
  const bonusSet = new Set<number>(saves.meta()?.bonus ?? []);
  let playTime = saves.meta()?.time ?? 0;
  let saveIn = Infinity; // segundos até salvar (agendado)
  let thumbWant = false;
  let afterSave: (() => void) | null = null;
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = 192;
  thumbCanvas.height = 108;
  const canSave = () => mode === 'play' && saves.saving() && progress.has('intro') && intro === null && !LAB;
  const writeSave = (thumb?: string) => {
    if (!canSave()) return;
    rooms.forEach((r, i) => r.bonus?.() && bonusSet.add(i));
    const r = rooms[curRoom];
    const m: SlotMeta = {
      room: curRoom,
      roomName: r.name,
      x: +(pos.x - offs[curRoom].x).toFixed(2),
      z: +(pos.z - offs[curRoom].z).toFixed(2),
      feet: +(feetY - offs[curRoom].y).toFixed(2),
      yaw: +yaw.toFixed(3),
      solvedHere: r.isSolved?.() ?? true,
      bonus: [...bonusSet].sort((a, b) => a - b),
      time: Math.round(playTime),
      chapter: 1,
      at: Date.now(),
      thumb: thumb ?? saves.meta()?.thumb,
    };
    saves.writeMeta(m);
  };
  // pede um salvamento com miniatura (a imagem é copiada logo depois do próximo quadro)
  const saveGame = (then?: () => void) => {
    saveIn = Infinity;
    if (!canSave()) {
      then?.();
      return;
    }
    thumbWant = true;
    if (then) afterSave = then;
  };
  const captureThumb = () => {
    thumbWant = false;
    let url: string | undefined;
    try {
      const g = thumbCanvas.getContext('2d')!;
      g.imageSmoothingEnabled = false;
      // corta o meio da imagem em 16:9
      const cw = canvas.width;
      const ch = canvas.height;
      const sh = Math.min(ch, (cw * 9) / 16);
      const sw = (sh * 16) / 9;
      g.drawImage(canvas, (cw - sw) / 2, (ch - sh) / 2, sw, sh, 0, 0, 192, 108);
      url = thumbCanvas.toDataURL('image/jpeg', 0.7);
    } catch {
      url = undefined;
    }
    writeSave(url);
    const f = afterSave;
    afterSave = null;
    f?.();
  };
  const onHide = () => {
    if (document.visibilityState === 'hidden') writeSave();
  };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', onHide);

  // ── TELA INICIAL (INTERFACE.md §3.1): o dado caído no entulho do Poço, no instante em que caiu ──
  // O dado é o do HUD (tem o rosto e a vida de dielife.ts), deitado de lado um pouco à direita do centro, com o entulho em volta; atrás, a sala 1
  // desfocada (uBlur), o feixe do poço com a poeira. A câmera respira. O olho segue o mouse, a opção marcada ou o dedo; cochila em 30 s.
  // Depois do capítulo 1, o fundo é o último lugar salvo.
  let mode: 'title' | 'play' = 'play';
  let titleT = 0;
  let titleIdle = 0;
  let titleGone = false; // o dado saiu do quadro (transição)
  let titleOrbit = 0; // créditos: a câmera gira em volta do dado
  let titleCreditsOn = false;
  let titleMood: 'new' | 'quit' | null = null;
  let titleTr: { k: 'new' | 'go' | 'out'; t: number; done?: () => void; snapped?: boolean } | null = null;
  let disT = -1; // transição em pontilhado em curso (0..1)
  let disDir = 1; // 1 = a imagem nova aparece; -1 = some para o preto
  let disDone: (() => void) | null = null;
  let snapWant: 'frame' | 'black' | null = null;
  const titlePlace = (): { room: number; x: number; z: number; yaw: number } | null => {
    const m = saves.meta();
    if (!progress.has('cap1') || !m || m.room < 0 || m.room >= rooms.length) return null;
    return { room: m.room, x: m.x, z: m.z, yaw: m.yaw };
  };
  const titleBase = new THREE.Vector3();
  // onde o dado está caído NO CHÃO DA SALA (o dado é o do HUD, desenhado por cima exatamente nesse ponto, no tamanho certo para a distância)
  const titleFocus = new THREE.Vector3();
  let titleY = EYE;
  // enquadramento do jogo novo, relativo ao ponto do dado (dieLie da sala 1): a câmera baixa, de quem acordou no chão, olhando o feixe do poço
  // nx/ny: onde o dado fica na tela (fração da meia-tela; a câmera é apontada para ele cair ali, à direita do menu e abaixo do logo)
  // (a câmera fica quase no chão, à esquerda do dado: atrás dele, o cone de luz do poço; no celular, um pouco mais longe para o dado não ficar enorme)
  const TT = { cx: -1.0, cy: 0.18, cz: 0.9, nx: 0.3, nxNarrow: 0.38, ny: -0.5, far: 1.25, turn: -0.5 };
  // a sombra do dado no chão da sala (só na tela inicial)
  const titleShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.5), new THREE.MeshBasicMaterial({ map: blobShadowTexture(), transparent: true, depthWrite: false, opacity: 0.85, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -3 }));
  titleShadow.rotation.x = -Math.PI / 2;
  titleShadow.visible = false;
  scene.add(titleShadow);
  const titleCam = () => {
    const place = titlePlace();
    const breath = Math.sin(titleT * 0.9) * 0.015; // a câmera "respira" 1 a 2 cm
    if (place) {
      // depois do capítulo 1: baixo, no lugar salvo, olhando para onde o jogador olhava; o dado no chão, um pouco à frente e à direita
      curRoom = place.room;
      feetY = offs[place.room].y + rooms[place.room].groundY(place.x, place.z, 0);
      titleBase.set(offs[place.room].x + place.x, feetY + 0.62, offs[place.room].z + place.z);
      const fx = place.x - Math.sin(place.yaw) * 1.25 + Math.cos(place.yaw) * 0.35;
      const fz = place.z - Math.cos(place.yaw) * 1.25 - Math.sin(place.yaw) * 0.35;
      titleFocus.set(offs[place.room].x + fx, offs[place.room].y + rooms[place.room].groundY(fx, fz, 0), offs[place.room].z + fz);
    } else {
      const lie = rooms[0].dieLie;
      if (!lie) return;
      curRoom = 0;
      feetY = offs[0].y;
      // o ponto em que o dado cai na abertura, no meio do entulho de verdade embaixo do poço
      titleFocus.copy(lie).add(offs[0]);
      const k = camera.aspect < 1.5 || window.innerHeight < 500 ? TT.far : 1;
      titleBase.set(titleFocus.x + TT.cx * k, titleFocus.y + TT.cy, titleFocus.z + TT.cz * k);
    }
    titleDieYaw = Math.atan2(titleBase.x - titleFocus.x, titleBase.z - titleFocus.z); // o rosto do dado para a câmera
    // créditos: a câmera gira devagar em volta do dado
    if (titleOrbit !== 0) {
      const px = titleFocus.x;
      const pz = titleFocus.z;
      const dx = titleBase.x - px;
      const dz = titleBase.z - pz;
      const ca = Math.cos(titleOrbit);
      const sa = Math.sin(titleOrbit);
      titleBase.x = px + dx * ca - dz * sa;
      titleBase.z = pz + dx * sa + dz * ca;      titleBase.y += 0.3 * Math.min(1, Math.abs(Math.sin(titleOrbit / 2)) * 4); // sobe um pouco para não roçar o entulho
    }
    pos.copy(titleBase);
    pos.y += breath;
    // aponta a câmera para o dado e desvia o olhar o bastante para ele cair no lugar dele na composição
    const tf = Math.tan((camera.fov * Math.PI) / 360);
    const nx = camera.aspect < 1.5 ? TT.nxNarrow : TT.nx;
    const fx = titleFocus.x - pos.x;
    const fy = titleFocus.y + 0.26 - pos.y;
    const fz = titleFocus.z - pos.z;
    yaw = Math.atan2(-fx, -fz) + Math.atan(nx * tf * camera.aspect) + Math.sin(titleT * 0.11) * 0.015;
    pitch = Math.atan2(fy, Math.hypot(fx, fz)) - Math.atan(TT.ny * tf) + Math.sin(titleT * 0.08) * 0.01;
    // jogo novo: a câmera sobe pelo feixe de luz até o branco
    if (titleTr?.k === 'new' && titleTr.t > 0.9) {
      const u = clamp((titleTr.t - 0.9) / 2.2, 0, 1);
      const e = u * u * (3 - 2 * u);
      const sh = rooms[0].shaft;
      if (sh) {
        const c = sh.clone().add(offs[0]);
        const a = clamp(e * 1.8, 0, 1);
        pos.x += (c.x - pos.x) * a;
        pos.z += (c.z - pos.z) * a;
        pos.y += e * e * (rooms[0].wellTop ? rooms[0].wellTop.y - 4 : 12);
        pitch += (1.5 - pitch) * clamp(e * 1.6, 0, 1);
      }
      fadeMat.color.setHex(0xffffff);
      fadeQuad.visible = true;
      fadeMat.opacity = clamp((u - 0.45) / 0.5, 0, 1);
    }
    titleY = pos.y;
  };
  // o dado da tela inicial: deitado de lado NO CHÃO DA SALA, no meio do entulho de verdade. É o dado da mão (com o rosto e a vida de dielife.ts),
  // desenhado com a câmera do mundo no ponto do chão em que ele caiu; as luzes dele (chave, preenchimento, contraluz do poço) andam junto com a
  // câmera, para ele ser iluminado como antes. A orientação é presa ao giro da câmera SEM os créditos: nos créditos a câmera gira em volta dele.
  const titleV = new THREE.Vector3();
  const titleQ = new THREE.Quaternion();
  const titleUp = new THREE.Vector3(0, 1, 0);
  let titleDieYaw = 0;
  const DIE_W = 0.42; // o lado do dado de verdade (worldModel)
  const lightHome = new Map<THREE.DirectionalLight, THREE.Vector3>();
  const titlePose = (dt: number, lo: { dx: number; dy: number; scale: number }) => {
    dieInWorld = true;
    const x0 = titleFocus.x;
    const z0 = titleFocus.z;
    let y = titleFocus.y + DIE_W * 0.5 + Math.max(0, lo.dy) * DIE_W * 3.4; // reto no chão, apoiado numa face (só sai do chão nos pulinhos)
    let side = 0;
    // pulinho para fora do quadro (continuar): rola para a direita da câmera
    if (titleTr?.k === 'go' || titleTr?.k === 'out' || titleGone) {
      const u = clamp((titleTr?.t ?? 1) / 0.5, 0, 1);
      side = u * u * 2.2;
      y += Math.sin(Math.PI * Math.min(1, u * 1.3)) * 0.35;
    }
    dieGroup.position.set(x0 + Math.cos(titleDieYaw) * side, y, z0 - Math.sin(titleDieYaw) * side);
    dieGroup.scale.setScalar(DIE_W * lo.scale);
    dieGroup.quaternion.copy(titleQ.setFromAxisAngle(titleUp, titleDieYaw + TT.turn)); // um pouco virado no chão: aparece a lateral e ele lê como cubo
    // RETO no chão (pedido do Pedro): sem a inclinação da mão nem a "respiração" de girar; só o rosto e os olhos vivem
    dieHolder.quaternion.copy(curQ);
    // as luzes do dado: a mesma direção de antes, só que relativa à câmera do mundo
    camera.updateMatrixWorld();
    for (const L of [key, fill, titleRim]) {
      if (!lightHome.has(L)) lightHome.set(L, L.position.clone());
      L.position.copy(lightHome.get(L)!).applyQuaternion(camera.quaternion).add(dieGroup.position);
      L.target.position.copy(dieGroup.position);
      L.target.updateMatrixWorld();
    }
    // foco: no dado (o que está longe dele fica desfocado)
    titleV.copy(dieGroup.position).applyMatrix4(camera.matrixWorldInverse);
    postMat.uniforms.uFocus.value = Math.max(0.05, -titleV.z);
    titleShadow.visible = mode === 'title' && !titleGone;
    titleShadow.position.set(titleFocus.x + 0.02, titleFocus.y + 0.012, titleFocus.z + 0.03);
    void dt;
  };
  // de volta ao HUD (o jogo começou)
  const titleDieHome = () => {
    dieInWorld = false;
    dieGroup.quaternion.identity();
    for (const [L, p] of lightHome) {
      L.position.copy(p);
      L.target.position.set(0, 0, 0);
      L.target.updateMatrixWorld();
    }
  };
  const enterTitle = () => {
    mode = 'title';
    ui.setMenu('title');
    const place = titlePlace();
    if (place) {
      for (let i = 0; i < place.room; i++) rooms[i].skip?.();
      spawnIn(place.room);
    } else spawnIn(0);
    dieCineTarget = 1; // o rosto de frente, sem a inclinação da mão
    blendAtmosphere(0, true);
    titleCam();
  };
  // a vida do olho: mouse, toque e teclado acordam e dizem para onde olhar
  const titleInput = (cx: number, cy: number) => {
    titleIdle = 0;
    dieOnScreen(dieNdc);
    const nx = (cx / window.innerWidth) * 2 - 1;
    const ny = -((cy / window.innerHeight) * 2 - 1);
    // (antes do 1º quadro o dado ainda não tem lugar na tela: usa o lugar dele de sempre)
    const ok = Number.isFinite(dieNdc.x + dieNdc.y) && Math.abs(dieNdc.x) < 1.5 && Math.abs(dieNdc.y) < 1.5;
    const ox = ok ? dieNdc.x : 0.3;
    const oy = ok ? dieNdc.y : -0.4;
    titleTarget = { dx: (nx - ox) * 1.4, dy: (ny - oy) * 1.4 };
  };
  let touchLookT = 0;
  const onTitleMove = (e: PointerEvent) => {
    if (mode !== 'title' || e.pointerType === 'touch') return;
    titleInput(e.clientX, e.clientY);
  };
  const onTitleDown = (e: PointerEvent) => {
    if (mode !== 'title') return;
    titleInput(e.clientX, e.clientY);
    if (e.pointerType === 'touch') touchLookT = 2.5; // no celular, olha para onde o dedo tocou e depois volta a vaguear
  };
  const onTitleKey = () => {
    if (mode === 'title') titleIdle = 0;
  };
  window.addEventListener('pointermove', onTitleMove);
  window.addEventListener('pointerdown', onTitleDown);
  window.addEventListener('keydown', onTitleKey);
  const titleTick = (dt: number) => {
    titleT += dt;
    titleIdle += dt;
    if (touchLookT > 0) {
      touchLookT -= dt;
      if (touchLookT <= 0) titleTarget = null;
    }
    if (titleCreditsOn) titleOrbit += dt * 0.12;
    else if (titleOrbit !== 0) {
      // volta para o lugar pelo caminho mais curto
      const a = ((titleOrbit % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
      titleOrbit = Math.abs(a) < 0.002 ? 0 : a * (1 - Math.min(1, dt * 1.5));
    }
    // a luz do poço "respira"
    postMat.uniforms.uBright.value = (1 + configStore.get().brightness * 0.07) * (1 + Math.sin(titleT * 0.7) * 0.03);
    postMat.uniforms.uBlur.value = titleTr?.k === 'new' ? Math.max(0, TB.blur - titleTr.t * 1.6) : TB.blur;
    titleRim.intensity = 1.6;
    if (titleTr) {
      titleTr.t += dt;
      if (titleTr.k === 'new') {
        eyesShut = titleTr.t > 0.15 && titleTr.t < 0.95; // pisca devagar
        if (titleTr.t > 3.2 && titleTr.done) {
          const d = titleTr.done;
          titleTr.done = undefined;
          d();
        }
      } else if (titleTr.t > 0.5 && !titleTr.snapped) {
        titleTr.snapped = true;
        titleGone = true;
        if (titleTr.k === 'go') {
          // continuar no mesmo espaço: guarda a imagem, entra no jogo e desfaz o quadro em pontilhado para o lugar salvo
          snapWant = 'frame';
          const done = titleTr.done;
          window.setTimeout(() => {
            titleTr = null;
            titleGone = false;
            begin();
            disT = 0;
            disDir = 1;
            done?.();
          }, 0);
        } else {
          // outro espaço: some em pontilhado para o preto e recarrega
          snapWant = 'black';
          disT = 0;
          disDir = -1;
          disDone = titleTr.done ?? null;
        }
      }
    }
  };
  const disTick = (dt: number) => {
    if (disT < 0) return;
    disT = Math.min(1, disT + dt / 0.9);
    postMat.uniforms.uDis.value = disDir > 0 ? disT : 1 - disT;
    if (disT >= 1) {
      postMat.uniforms.uDis.value = -1;
      disT = -1;
      if (disDir < 0) postMat.uniforms.uDis.value = 0; // fica no preto até recarregar
      const d = disDone;
      disDone = null;
      d?.();
    }
  };
  // sai da tela inicial: continua de onde o espaço ativo parou (ou acorda, num jogo novo)
  let begun = false;
  const begin = () => {
    if (begun) return;
    begun = true;
    mode = 'play';
    ui.setMenu(null);
    dieCineTarget = 0;
    dieCine = 0;
    titleShadow.visible = false;
    titleDieHome();
    titleRim.intensity = 0;
    postMat.uniforms.uBlur.value = 0;
    postMat.uniforms.uBright.value = 1 + configStore.get().brightness * 0.07;
    fadeMat.color.setHex(0x000000);
    eyesShut = false;
    hasDie = progress.has('dado');
    hasChalk = CHALK_OK && progress.has('giz');
    const m = saves.meta();
    if (m) {
      // a lista de salas pode ter mudado (uma sala nova no meio): procura a sala salva pelo NOME
      const bare = (n: string) => n.replace(/^Sala \d+ · /, '');
      if (rooms[m.room] && bare(rooms[m.room].name) !== bare(m.roomName)) {
        const k = rooms.findIndex((r) => bare(r.name) === bare(m.roomName));
        if (k >= 0) m.room = k;
      }
    }
    if (m && progress.has('intro') && m.room >= 0 && m.room < rooms.length && saves.saving()) {
      for (let i = 0; i < m.room; i++) rooms[i].skip?.();
      if (m.solvedHere) rooms[m.room].skip?.();
      spawnIn(m.room);
      const r = rooms[m.room];
      const gy = r.groundY(m.x, m.z, m.feet);
      // a posição salva só vale se ainda há chão ali (senão, o começo da sala)
      if (Number.isFinite(gy) && Math.abs(gy - m.feet) < 1.2) {
        feetY = offs[m.room].y + gy;
        pos.set(offs[m.room].x + m.x, feetY + EYE, offs[m.room].z + m.z);
        yaw = m.yaw;
      }
      for (let i = 0; i <= m.room; i++) announced.add(i);
      diary.visitRoom(r.name);
      caption(r.name, r.subtitle, '#ffd36b');
    } else {
      spawnIn(0);
      announced.add(0);
      diary.visitRoom(rooms[0].name);
      if (!progress.has('intro')) startIntro();
    }
    blendAtmosphere(0, true);
    opts.onInventory?.({ die: hasDie, chalk: hasChalk });
    requestLock();
  };
  applyConfig();
  if (opts.title) enterTitle();
  else begin();
  // ── interação (E no PC, AGIR / toque no celular): a porta trancada, o giz no chão... ──
  let promptLabel: string | null = null;
  let nearest: Interactable | null = null;
  const scanInteract = () => {
    let best: Interactable | null = null;
    let bd = Infinity;
    if (!busy()) {
      camera.getWorldDirection(lookDir);
      activeRooms.forEach((i) => {
        for (const it of rooms[i].interactables ?? []) {
          if (!it.enabled()) continue;
          toIns.copy(it.pos).add(offs[i]).sub(camera.position);
          const d = Math.hypot(toIns.x, toIns.z);
          if (d > it.r || lookDir.dot(toIns.normalize()) < 0.3) continue;
          if (d < bd) {
            bd = d;
            best = it;
          }
        }
      });
    }
    nearest = best;
    const label: string | null = best ? (best as Interactable).label : null;
    if (label !== promptLabel) {
      promptLabel = label;
      opts.onPrompt?.(label);
    }
  };
  const interact = (): boolean => {
    if (!nearest || busy()) return false;
    const it = nearest;
    sfx.play('uiblip', 1);
    it.use();
    return true;
  };

  // ── o dado fala (raro, curto, nunca atrapalha): balão pequeno com 2–4 símbolos ──
  const CHAT: Record<string, string[][]> = {
    burn: [['eu', 'ter', 'medo'], ['eu', 'sentir', 'fogo']],
    idle: [['eu', 'esperar'], ['voce', 'esperar', 'perg'], ['eu', 'querer', 'pousar'], ['voce', 'ajudar', 'eu', 'perg']],
    plate: [['eu', 'pousar', 'conf']],
    door: [['voce', 'poder', 'conf'], ['eu', 'ver', 'voce']],
    cold: [['eu', 'sentir', 'frio']],
    room: [['eu', 'ver', 'voce'], ['eu', 'ficar', 'voce']],
  };
  let chatCool = 0; // segundos até ele poder falar de novo
  let idleT = 0;
  let chatN = 0;
  chatFn = (key: string) => {
    if (!hasDie || chatCool > 0 || busy() || dieState === 'returning' || performance.now() < talkUntil) return;
    const lines = CHAT[key];
    if (!lines) return;
    chatter.say(lines[chatN++ % lines.length]);
    chatCool = 45 + Math.random() * 45;
    handTalk = 1;
    handPop = Math.max(handPop, 0.5);
    sfx.play('uiblip', 0.6);
  };
  const chatTick = (dt: number, moving: boolean) => {
    chatCool = Math.max(0, chatCool - dt);
    handTalk = Math.max(0, handTalk - dt * 0.9);
    if (moving || busy() || dieState !== 'hand') idleT = 0;
    else if ((idleT += dt) > 75) {
      idleT = 0;
      chatFn('idle');
    }
  };

  // ── AS PERGUNTAS DO DADO (DESIGN.md §42): num momento calmo (corredor entre salas, chegada a uma área livre) o dado treme na mão,
  // vem grande ao centro da tela, mostra um glifo e pergunta «VOCÊ SABER ?». O painel (ui/QuizPanel) mostra as 5 opções; o dado reage. ──
  let quizT = 0;
  let quizDef: QuizDef | null = null;
  let quizCool = 5; // segundos até poder perguntar de novo
  let quizDur = 0;
  let quizBeat = false;
  const quizWhere = (): { room: string; at: 'after' | 'arrive' } | null => {
    const r = rooms[curRoom];
    const lx = pos.x - offs[curRoom].x;
    const lz = pos.z - offs[curRoom].z;
    const room = r.name.replace(/^Sala \d+ · /, '');
    if (lz < r.doorZ - 0.6 && lz > r.doorZ - CORRIDOR + 0.4 && Math.abs(feetY - offs[curRoom].y - (r.exitDy ?? 0)) < 0.5) return { room, at: 'after' }; // (no chão do corredor: há salas com galeria por cima dele)
    if (r.calm?.(lx, lz)) return { room, at: 'arrive' };
    return null;
  };
  const quizCalm = () => hasDie && progress.has('caderno') && dieState === 'hand' && tool === 'die' && !busy() && !pinned && !autoWalk && !sketchOn && vy === 0 && chatterStore.get() === null && performance.now() > talkUntil + 400;
  const quizTick = (dt: number) => {
    // o corpo do dado na cena: pulo de alegria, cabeça baixa
    cineHopV -= 30 * dt;
    cineHop += cineHopV * dt;
    if (cineHop < 0) {
      cineHop = 0;
      cineHopV = cineHopV < -2.5 ? -cineHopV * 0.42 : 0;
    }
    cineWig = Math.max(0, cineWig - dt * 0.8);
    quizShake = Math.max(0, quizShake - dt * 3);
    quizT += dt;
    switch (quizPh) {
      case 'idle': {
        cineDroop = Math.max(0, cineDroop - dt * 2);
        walkK = 1;
        quizCool -= dt;
        if (quizCool > 0) return;
        quizCool = 0.3;
        if (!quizCalm()) return;
        const w = quizWhere();
        const d = w && quiz.due(w.room, w.at);
        if (!d) return;
        quizDef = d;
        quizPh = 'shake';
        quizT = 0;
        quizBeat = false;
        life.react('shake');
        sfx.play('rest', 0.5);
        return;
      }
      case 'shake': // ~1 s: o dado treme na mão, as gemas piscam; quem anda é parado devagar
        quizShake = 1;
        walkK = Math.max(0, 1 - quizT / 0.7);
        if (ui.blocked() || book.isOut() || dieState !== 'hand') {
          quizPh = 'idle'; // outra coisa tomou a tela: fica para depois
          quizCool = 4;
          return;
        }
        if (!quizBeat && quizT > 0.5) {
          quizBeat = true;
          life.react('shake');
          sfx.play('put', 0.45);
        }
        if (quizT < 1) return;
        holds++;
        dieCineTarget = 1;
        ui.setBars(true);
        life.react('perk');
        handPop = 1;
        sfx.play('catch');
        camTween = { y0: yaw, p0: pitch, y1: yaw, p1: -0.04, t: 0, dur: 1.0 };
        if (locked()) document.exitPointerLock(); // as opções precisam do mouse livre (as teclas 1 a 5 também servem)
        quizPh = 'rise';
        quizT = 0;
        return;
      case 'rise':
        if (quizT < 1.05) return;
        quiz.start(quizDef!); // o painel escreve o glifo, grande, traço a traço
        sfx.play('write', 1);
        quizPh = 'glyph';
        quizT = 0;
        return;
      case 'glyph': {
        if (quizT < 1.45) return;
        const line = ['voce', 'saber', 'perg'];
        chatter.say(line, undefined, true); // «VOCÊ SABER ?» fica à vista enquanto as opções estão na tela
        handTalk = 1;
        sfx.play('uiblip', 0.6);
        quizDur = lineMs(line) / 1000 + 0.3;
        talkUntil = performance.now() + quizDur * 1000 + 600;
        quizPh = 'say';
        quizT = 0;
        return;
      }
      case 'say':
        if (quizT < quizDur) return;
        quiz.ask();
        quizPh = 'ask';
        quizT = 0;
        return;
      case 'ask': {
        const q = quizStore.get();
        if (!q) {
          quizDur = 0; // (alguém encerrou a pergunta por fora)
        } else if (q.phase !== 'done') return;
        else if (q.result === 'ok') {
          // certo: um pulo de alegria e só a marca CONFIRMADO
          chatter.say(['conf']);
          cineHopV = 3.6;
          cineWig = 1;
          life.react('joy');
          sfx.play('piece');
          handTalk = 1;
          quizDur = 2.6;
        } else if (q.result === 'bad') {
          // errado: abatido, sem glifo, sem punição
          chatter.clear();
          cineDroop = 1;
          life.react('sad');
          sfx.play('burnout', 0.5);
          quizDur = 2.2;
        } else {
          // "não sei": «EU ESPERAR», e não insiste
          const line = ['eu', 'esperar'];
          chatter.say(line);
          handTalk = 1;
          sfx.play('uiblip', 0.6);
          quizDur = lineMs(line) / 1000 + 1.5;
        }
        talkUntil = performance.now() + quizDur * 1000 + 800;
        quizPh = 'react';
        quizT = 0;
        return;
      }
      case 'react':
        if (quizT < quizDur) return;
        quiz.end();
        dieCineTarget = 0;
        ui.setBars(false);
        holds = Math.max(0, holds - 1);
        quizPh = 'idle';
        quizCool = 20;
        handPop = 0.6;
        return;
    }
  };
  const onSkip = () => {
    if (burn) skipScene = true;
  };
  window.addEventListener('pointerdown', onSkip, { passive: true });
  window.addEventListener('keydown', onSkip);

  // ── loop ────────────────────────────────────────────────────────────────
  let raf = 0;
  let last = performance.now();
  let t = 0;
  let bob = 0;
  let bobAmp = 0;
  let lastStepIdx = 0;
  let lastRev = 0;
  let emittedDie: DieState | null = null;
  let aimTick = 0;
  let aimCache: ReturnType<typeof aimPoint> = null;
  const loop = (now: number) => {
    if (fpsCap > 0 && now - lastDraw < 1000 / fpsCap - 2) {
      raf = requestAnimationFrame(loop); // limitar quadros (configurações)
      return;
    }
    lastDraw = now;
    const paused = ui.menu() === 'pause'; // pausa: o mundo pára (fogo, tempo, dado), só a imagem continua
    const dt = paused ? 0 : Math.min(0.05, (now - last) / 1000) * (import.meta.env.DEV ? (((globalThis as Record<string, unknown>).__timeScale as number | undefined) ?? 1) : 1); // (testes: câmera lenta)
    last = now;
    t += dt;
    disTick(Math.min(0.05, (now - last + 16) / 1000));
    if (mode === 'title') {
      titleTick(dt);
      titleCam();
    } else if (!paused) {
      playTime += dt;
      saveIn -= dt;
      if (saveIn <= 0) saveGame();
      const dOpen = ui.diaryOpen();
      if (diaryWas && !dOpen) saveIn = Math.min(saveIn, 0.6); // fechou o diário: salva
      diaryWas = dOpen;
    }

    if (ui.diaryOpen() && locked()) document.exitPointerLock(); // o diário precisa do mouse livre
    const moving = move(dt);
    vertical(dt);
    const ri = roomOfZ(pos.z);
    if (ri !== curRoom && mode === 'play') {
      curRoom = ri;
      saveIn = Math.min(saveIn, 0.25); // entrou numa sala: salva
      diary.visitRoom(rooms[ri].name);
      applyActive();
      // saiu da sala do dado: o dado volta pra mão (a porta atrás fecha)
      if (dieState !== 'hand' && dieRoom !== curRoom) resetDie();
      if (/Mirante/.test(rooms[ri].name)) chatFn('cold');
      else if (!announced.has(ri) && Math.random() < 0.3) chatFn('room');
      if (!announced.has(ri)) {
        announced.add(ri);
        sfx.play('room');
        caption(rooms[ri].name, rooms[ri].subtitle, '#ffd36b');
      }
    }
    blendAtmosphere(dt);
    // o escuro: espera a conversa e o balão do dado; cai em 0,15 s, fica, volta em 0,6 s
    if (darkQ && !dialogueStore.get() && !chatterStore.get()) {
      darkHold = Math.max(darkHold, darkQ.secs);
      darkCb = darkQ.onDark ?? null;
      darkQ = null;
      sfx.play('burnout', 0.7);
    }
    if (darkHold > 0) {
      darkK = Math.min(1, darkK + dt / 0.15);
      if (darkK >= 1) {
        if (darkCb) {
          const f = darkCb;
          darkCb = null;
          f();
        }
        darkHold -= dt;
      }
    } else darkK = Math.max(0, darkK - dt / 0.6);
    shapeLight();
    landKick = Math.max(0, landKick - dt * 4);
    const speedFrac = Math.min(1, Math.hypot(moveVel.x, moveVel.z) / MAX_SPEED);
    // sensação de velocidade: o campo de visão abre um pouquinho correndo
    const fovTarget = fovCine > 0 ? fovCine : fovBase + (dbg.bob ? 2.5 : 0) * Math.min(1.3, speedFrac); // (reduzir movimento: sem o campo de visão abrindo)
    if (Math.abs(camera.fov - fovTarget) > 0.01) {
      camera.fov += (fovTarget - camera.fov) * Math.min(1, dt * (fovCine > 0 ? 2.2 : 8));
      camera.updateProjectionMatrix();
    }
    bobAmp += (speedFrac - bobAmp) * Math.min(1, dt * 8);
    // 1 passo (meio ciclo do balanço) a cada STRIDE metros: sincroniza balanço e som
    const walkSpeed = Math.hypot(moveVel.x, moveVel.z);
    bob += dt * Math.PI * (walkSpeed / STRIDE);
    const stepIdx = Math.floor(bob / Math.PI);
    if (stepIdx !== lastStepIdx) {
      lastStepIdx = stepIdx;
      if (speedFrac > 0.12 && vy === 0) {
        const sr = roomOfZ(pos.z);
        sfx.step(rooms[sr].surfaceAt?.(pos.x - offs[sr].x, pos.z - offs[sr].z) ?? 'stone');
      }
    }
    const bobY = dbg.bob ? Math.sin(bob) * 0.026 * bobAmp - landKick * 0.18 : 0;
    pos.y = mode === 'title' ? titleY : feetY + EYE; // tela inicial: a câmera fica na altura que titleCam escolheu (baixa, no chão)
    updateIntro(dt);
    updateScribeDrop(dt, t);
    if (camTween) {
      const c = camTween;
      c.t += dt;
      const u = introEase(clamp(c.t / c.dur, 0, 1));
      yaw = c.y0 + (c.y1 - c.y0) * u;
      pitch = c.p0 + (c.p1 - c.p0) * u;
      if (c.t >= c.dur) camTween = null;
    }
    camera.position.set(pos.x, pos.y + bobY - introDrop, pos.z);
    camera.rotation.set(pitch, yaw, introRoll);
    if (cineCam) {
      // câmera de cinema (cena da abertura): solta do jogador
      camera.position.copy(cineCam.pos);
      camera.lookAt(cineCam.look);
    }

    // ── dado no mundo ──
    wakeHopV -= 22 * dt;
    wakeHop = Math.max(0, wakeHop + wakeHopV * dt);
    if (wakeHop === 0 && wakeHopV < 0) wakeHopV = 0;
    worldModel.position.y = wakeHop * 0.4;
    if (dieState === 'flying') {
      const n = Math.max(1, Math.ceil(dt / (1 / 120)));
      if (dropWatch && scribeDrop) {
        // caindo pelo poço: velocidade-limite (o "ar" do poço) e uma leve guia para cair na frente do jogador, dentro da luz
        dieV.y = Math.max(dieV.y, -6.5);
        const sh0 = rooms[0].shaft!;
        if (dieP.y > sh0.y - 2.5) {
          // no poço: desce pelo meio, um pouco para longe do jogador; ao sair pelo furo do teto ganha um empurrão para a frente (quica e rola à vista)
          dieV.x += ((sh0.x + 0.05 - dieP.x) * 1.4 - dieV.x) * Math.min(1, dt * 4);
          dieV.z += ((sh0.z + 0.3 - dieP.z) * 1.4 - dieV.z) * Math.min(1, dt * 4);
          if (dieP.y < sh0.y - 2.5 + 1.2) dieV.z = 0.8;
        }
        // do tamanho da mão (lá em cima) ao tamanho do mundo (ao passar pelo teto da sala)
        const topY = rooms[0].wellTop ? rooms[0].wellTop.y + 1.5 : sh0.y + 14;
        const kk = clamp((dieP.y - (sh0.y - 2.5)) / (topY - (sh0.y - 2.5)), 0, 1);
        worldModel.scale.setScalar(0.42 + (DIE_IN_HAND - 0.42) * kk * kk);
      }
      for (let i = 0; i < n && dieState === 'flying'; i++) stepDie(dt / n);
      worldDie.position.copy(dieP).add(offs[dieRoom]);
      const w = dieW.length();
      if (w > 1e-4) {
        tmpQ.setFromAxisAngle(tmpAxis.copy(dieW).normalize(), w * dt);
        worldDie.quaternion.premultiply(tmpQ);
      }
      if (landQ && dropWatch) {
        // nos últimos metros da queda o giro se acomoda: o dado chega ao chão já com a face certa para cima
        const ceil = rooms[0].shaft!.y - 2.5;
        if (dieP.y < ceil + 3.5) {
          const k = 1 - clamp(dieP.y / (ceil + 3.5), 0, 1);
          worldDie.quaternion.slerp(landQ, 1 - Math.exp(-dt * (3 + 10 * k)));
          dieW.multiplyScalar(Math.exp(-dt * 6));
        }
      }
    } else if (dieState === 'placing') {
      animT += dt / 0.36;
      const u = Math.min(1, animT);
      const e = u * u * (3 - 2 * u);
      handWorld(animFrom);
      worldDie.position.lerpVectors(animFrom, animTo, e);
      worldDie.position.y += Math.sin(Math.PI * u) * 0.28;
      worldModel.scale.setScalar(0.3 + 0.12 * e);
      if (u >= 1) {
        dieP.copy(animTo).sub(offs[dieRoom]);
        dieV.set(0, 0, 0);
        dieW.set(0, 0, 0);
        worldModel.scale.setScalar(0.42);
        restTimer = 0;
        dieState = 'flying';
        sfx.play('put');
      }
    } else if (dieState === 'returning') {
      animT += dt / 0.4;
      const u = Math.min(1, animT);
      const e = u * u; // acelera em direção à mão
      handWorld(animTo);
      worldDie.position.lerpVectors(animFrom, animTo, e);
      worldDie.position.y += Math.sin(Math.PI * u) * 0.25;
      worldModel.scale.setScalar(0.42 - 0.17 * e);
      tmpQ.setFromAxisAngle(tmpAxis.set(0.6, 1, 0.3).normalize(), dt * 14);
      worldDie.quaternion.premultiply(tmpQ);
      if (u >= 1) {
        dieState = 'hand';
        worldDie.visible = false;
        worldModel.scale.setScalar(0.42);
        handPop = 1;
        sfx.play('catch');
        if (!hasDie) {
          hasDie = true;
          talkGlow = 0;
          chatCool = 70; // acabou de ganhar o dado: um tempo calado
          progress.set('dado');
          opts.onInventory?.({ die: hasDie, chalk: hasChalk });
          const f = pickup;
          pickup = null;
          f?.();
        }
      }
    } else if (dieState === 'rest') {
      worldDie.quaternion.slerp(restQ, 1 - Math.exp(-dt * 12));
      worldDie.position.copy(dieP).add(offs[dieRoom]);
      if (hasDie && !rooms[dieRoom].holdsDie()) {
        restReturn += dt;
        if (restReturn > 1.8) recall();
      }
    }

    if (dropWatch && !camTween && (dieState === 'flying' || dieState === 'rest')) {
      // a câmera ACOMPANHA o dado despencando (cinema): do buraco até o chão
      const wx = dieP.x + offs[0].x - pos.x;
      const wy = dieP.y + offs[0].y - pos.y;
      const wz = dieP.z + offs[0].z - pos.z;
      const ty = Math.atan2(-wx, -wz);
      const tp = clamp(Math.atan2(wy, Math.hypot(wx, wz)), -1.0, 1.5);
      yaw += Math.atan2(Math.sin(ty - yaw), Math.cos(ty - yaw)) * Math.min(1, dt * 5);
      pitch += (tp - pitch) * Math.min(1, dt * 5);
    }
    if (dropWatch && dieState === 'rest') {
      dropWatch.t += dt;
      if (dropWatch.t > 0.8) {
        const f = dropWatch.cb;
        dropWatch = null;
        progress.set('caiu');
        f();
      }
    }
    if (worldDie.visible && rooms[dieRoom]) {
      const fy = rooms[dieRoom].dieFloor(dieP.x, dieP.z);
      const hgt = Math.max(0, dieP.y - R - fy);
      dieShadow.visible = hgt < 3;
      dieShadow.position.set(dieP.x, fy + 0.015, dieP.z).add(offs[dieRoom]);
      dieShadow.scale.setScalar(0.62 + hgt * 0.25);
      dieShadowMat.opacity = Math.max(0, 1 - hgt / 3);
    } else dieShadow.visible = false;
    updateBurn(dt, t);
    if (mode === 'play') {
      chatTick(dt, moving);
      quizTick(dt);
    }
    if (dieState !== emittedDie) {
      emittedDie = dieState;
      opts.onDie?.(dieState === 'returning' || dieState === 'placing' ? 'flying' : dieState);
    }

    // ── salas ──
    activeRooms.forEach((i) => rooms[i].update(dt, t));
    readInscriptions(dt);
    scanInteract();
    updateLights(dt);
    const lastRoom = rooms[rooms.length - 1];
    if (!complete && curRoom === rooms.length - 1 && lastRoom.exitReached?.()) {
      complete = true;
      sfx.play('fanfare');
      gems = rooms.filter((r) => r.bonus?.()).length;
      progress.set('cap1'); // fim do capítulo 1: a tela inicial passa a mostrar o último lugar salvo
      saveIn = 0.5;
      opts.onComplete?.({ gem: gems > 0 });
    }

    // ── giz ──
    eraseArmed = Math.max(0, eraseArmed - dt);
    if (brush.active && tool === 'chalk') paintAt(brush.ndc, brush.erase);
    const rv = chalk.revision;
    sfx.scratch(brush.active && tool === 'chalk' && rv !== lastRev ? 1 : 0, brush.erase);
    lastRev = rv;
    sfx.roll(dieState === 'flying' ? dieRoll : 0);
    sfx.tick(dt);

    // fantasma de onde o dado seria posicionado
    aimTick -= dt;
    if (aimTick <= 0) {
      aimTick = 0.05;
      aimCache = dieState === 'hand' && tool === 'die' && !busy() ? aimPoint() : null;
    }
    const aim = dieState === 'hand' && tool === 'die' ? aimCache : null;
    // some quando o ponto está colado na câmera (o fantasma tamparia a tela toda)
    ghost.visible = !!aim && aim.p.distanceTo(camera.position) > 1.1 && !devNoHud;
    if (aim) {
      ghost.position.copy(aim.p).addScaledVector(aim.n, R + 0.02);
      ghost.rotation.y = t * 0.8;
      ghostMat.color.copy(accentLight.color);
    }

    // ── mãos (dado e giz trocam de lugar com um deslize suave) ──
    const swapK = Math.min(1, dt * 9);
    dieU += ((tool === 'die' ? 0 : 1) - dieU) * swapK;
    soapU += ((tool === 'chalk' ? 0 : 1) - soapU) * swapK;
    const ease = (u: number) => u * u * (3 - 2 * u);
    handPop = Math.max(0, handPop - dt * 4);
    if (sketchOn) {
      // o dado para de girar com a face do desenho de pé para quem olha, e volta a girar quando o desenho some
      sketchOn.age += dt;
      if (import.meta.env.DEV && typeof (globalThis as Record<string, unknown>).__skAge === 'number') sketchOn.age = (globalThis as Record<string, unknown>).__skAge as number; // teste: congela a linha do tempo
      sketchOn.blend.set(sketchP());
      if (!sketchOn.spoke && sketchOn.age >= SK_IN1) {
        // o dado FALA: o glifo da palavra e o desenho dela, juntos (fala sincera: as gemas ficam firmes e quentes)
        sketchOn.spoke = true;
        if (performance.now() >= talkUntil) {
          // (se o dado está no meio de uma fala da história, o desenho aparece na face mas ele não fala por cima)
          chatter.say([sketchOn.word], sketchOn.kind);
          sfx.play('uiblip', 0.6);
        }
      }
      let dsp = (SKETCH_SPIN - spin) % (Math.PI * 2);
      if (dsp > Math.PI) dsp -= Math.PI * 2;
      if (dsp < -Math.PI) dsp += Math.PI * 2;
      spin += dsp * Math.min(1, dt * 5);
      spinTo = null;
      if (sketchOn.age >= SK_LIFE) endSketch();
    } else if (dieCine > 0.3) {
      // na cena, o dado para de girar com uma face de frente para o jogador (o rosto aparece)
      let dsp = (Math.PI - spin) % (Math.PI * 2);
      if (dsp > Math.PI) dsp -= Math.PI * 2;
      if (dsp < -Math.PI) dsp += Math.PI * 2;
      spin += dsp * Math.min(1, dt * 3);
      spinTo = null;
    } else if (!(import.meta.env.DEV && (globalThis as Record<string, unknown>).__spinFreeze !== undefined)) {
      // na mão: fica um bom tempo com UMA face (o rosto) reta para o jogador e, de vez em quando, vira devagar um quarto de volta
      if (spinTo === null) spinTo = spinSnap(spin);
      spinHold -= dt;
      if (spinHold <= 0) {
        spinHold = 11 + Math.random() * 6;
        spinTo = spinSnap(spinTo) + Math.PI / 2;
      }
      spin += (spinTo - spin) * (1 - Math.exp(-dt * 1.6));
    }
    else spin = (globalThis as Record<string, unknown>).__spinFreeze as number;
    handDim += ((dieState === 'hand' ? 0 : 1) - handDim) * Math.min(1, dt * 8);
    lookedT += dt;
    dieCine += (dieCineTarget - dieCine) * Math.min(1, dt * 2.6);
    const cn = dieCine * dieCine * (3 - 2 * dieCine);
    tiltNow.copy(idQ).slerp(tilt, 1 - cn);
    const lo =
      mode === 'title'
        ? life.update({ dt, t, idle: titleIdle > 1, target: lifeTarget(), busy: false, sleepAfter: 30, face: Math.max(...rostoP) })
        : life.update({ dt, t, idle: !moving && !busy() && dieState === 'hand', target: lifeTarget(), busy: busy(), face: Math.max(...rostoP), talking: talkingNow() });
    lifeGlow = lo.glow * (quizShake > 0.05 && !calmFx ? (Math.sin(t * 26) > 0 ? 1.9 : 0.55) : 1); // tremendo: as gemas piscam
    updateMats();
    computeTarget(face, spin);
    curQ.slerp(targetQ, 1 - Math.exp(-dt * 9));
    wobble.setFromEuler(wobbleEuler.set(Math.sin(t * 1.1) * 0.012 * (1 - cn), 0, Math.sin(t * 0.8) * 0.012 * (1 - cn)));
    lifeQ.copy(lo.quat).slerp(idQ, cn);
    dieHolder.quaternion.copy(lifeQ).multiply(curQ).multiply(wobble);
    if (cn > 0.01 && (cineDroop > 0.01 || cineWig > 0.01)) dieHolder.quaternion.premultiply(tmpQ.setFromEuler(wobbleEuler.set(0.42 * cineDroop * cn, 0, Math.sin(t * 15) * 0.2 * cineWig * cn)));
    const du = ease(dieU);
    dieGroup.scale.setScalar(dieScaleBase * (1 + handPop * 0.3) * (1 - 0.38 * du) * lo.scale * (1 + 0.75 * cn));
    dieGroup.position.set(
      ((handX + (-handX - handX) * du) + lo.dx + Math.sin(t * 71) * 0.011 * quizShake * (calmFx ? 0.25 : 1)) * (1 - cn), // na cena: exatamente no centro da tela
      (dieBaseY + Math.sin(t * 1.6) * 0.012 + (moving ? Math.sin(bob + 1) * 0.012 : 0) + Math.sin(Math.PI * du) * 0.05 + lo.dy + Math.sin(t * 93) * 0.008 * quizShake * (calmFx ? 0.25 : 1)) * (1 - cn) + (cineHop * 0.11 - cineDroop * 0.05) * cn,
      -1,
    );
    if (mode === 'title' || titleTr) titlePose(dt, lo);
    updateRostos(dt);
    publishDieScreen();
    dieCam.position.set(0, 0, 0);

    soapKick = Math.max(0, soapKick - dt * 3.5);
    const su = ease(soapU);
    const drawing = brush.active && tool === 'chalk' && !brush.erase;
    const erasing = brush.active && tool === 'chalk' && brush.erase;
    const kk = Math.max(Math.sin(soapKick * Math.PI), drawing ? 0.55 + 0.25 * Math.sin(t * 17) : erasing ? 0.5 + 0.3 * Math.sin(t * 22) : 0);
    soapGroup.scale.setScalar(dieScaleBase * 1.18 * (1 - 0.34 * su));
    // x: de +handX (principal) para -handX (auxiliar); o golpe puxa um pouco pro centro
    const toCenter = -1 + 2 * su;
    soapGroup.position.set(
      handX + (-handX - handX) * su + toCenter * kk * 0.15,
      soapBase.y + Math.sin(t * 1.4 + 1.3) * 0.012 + kk * 0.07 + (moving ? Math.sin(bob) * 0.012 : 0) + Math.sin(Math.PI * su) * 0.05,
      soapBase.z,
    );
    const sgn = 2 * su - 1; // espelha a inclinação conforme a mão
    {
      const arr = chalkDust.geometry.attributes.position.array as Float32Array;
      const active = drawing ? 1 : 0.25;
      for (let i = 0; i < dustN; i++) {
        const ph = (t * (0.7 + active) + i * 0.1) % 1;
        arr[i * 3] = Math.sin(i * 12.9 + t) * 0.12 * ph;
        arr[i * 3 + 1] = -ph * 0.55 * active;
        arr[i * 3 + 2] = 0.78 + Math.cos(i * 7.7) * 0.08;
      }
      chalkDust.geometry.attributes.position.needsUpdate = true;
      chalkDust.visible = drawing || su < 0.5;
    }
    soapHolder.rotation.set(
      SOAP_ROT.x + kk * 0.5,
      sgn * SOAP_ROT.y + Math.sin(t * 0.9) * 0.05 + sgn * kk * 0.3,
      sgn * SOAP_ROT.z + Math.sin(t * 1.1) * 0.03,
    );

    // ── o diário: sobe da bolsa, abre a capa e vira as páginas ──
    {
      dieGroup.visible = ((hasDie && dieState === 'hand' && mode === 'play') || (mode === 'title' && !titleGone) || titleTr?.k === 'new') && !devNoHud; // sem dado/giz nas mãos até achá-los; arremessado ou posicionado, o dado NÃO fica na mão
      soapGroup.visible = hasChalk && mode === 'play';
      const hide = book.update(dt, t);
      if (hide > 0) {
        dieGroup.position.y -= hide * 0.95; // dado e giz saem da frente enquanto o livro está na mão
        soapGroup.position.y -= hide * 0.95;
      }
    }

    body.position.set(pos.x, feetY, pos.z);
    body.rotation.y = yaw;
    renderer.shadowMap.needsUpdate = !!rooms[curRoom]?.shadowLight && shadowsOn;
    renderer.info.reset();
    renderer.setRenderTarget(rt);
    renderer.setClearColor(fogColor, 1);
    renderer.clear();
    renderer.render(scene, camera);
    // dado e giz do HUD: alvo à parte (fundo transparente), colados por cima no pós-processo
    renderer.setRenderTarget(rtHud);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(dieScene, dieInWorld ? camera : dieCam);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);
    const bookOut = book.isOut();
    if (bookOut !== bookShown) {
      bookShown = bookOut;
      bookCanvas.style.display = bookOut ? 'block' : 'none';
    }
    if (bookOut) bookRenderer.render(bookScene, dieCam);
    {
      const c = mode === 'play' && lookLocked();
      if (c !== cineWas) {
        cineWas = c;
        opts.onCine?.(c);
      }
    }
    if (thumbWant) captureThumb(); // (logo depois de desenhar: a imagem ainda está no canvas)
    if (snapWant) {
      // guarda a imagem (ou o preto) para a transição em pontilhado
      const u = postMat.uniforms.uDis.value;
      postMat.uniforms.uDis.value = -1;
      renderer.setRenderTarget(rtSnap);
      if (snapWant === 'black') {
        renderer.setClearColor(0x0b0912, 1);
        renderer.clear();
      } else renderer.render(postScene, postCam);
      renderer.setRenderTarget(null);
      postMat.uniforms.uDis.value = u;
      snapWant = null;
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  // Só em desenvolvimento: gancho pra testes automatizados (não vai pro build).
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__mdd = {
      yaw: () => yaw,
      quiz: () => ({ ph: quizPh, ...quiz.debug() }),
      dieShadow: () => ({ vis: dieShadow.visible, p: dieShadow.position.toArray().map((v) => +v.toFixed(2)), s: dieShadow.scale.x, o: dieShadowMat.opacity, die: worldDie.position.toArray().map((v) => +v.toFixed(2)) }),
      pick: () => {
        const rc = new THREE.Raycaster();
        rc.setFromCamera(new THREE.Vector2(0, 0), camera);
        return rc.intersectObjects(rooms[curRoom].group.children, true).slice(0, 4).map((h) => {
          const m = h.object as THREE.Mesh;
          const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshLambertMaterial;
          const lp = h.point.clone().sub(offs[curRoom]);
          return { type: m.type, geo: m.geometry?.type, color: mat?.color?.getHexString?.(), op: mat?.opacity, tr: mat?.transparent, p: lp.toArray().map((v) => +v.toFixed(2)), d: +h.distance.toFixed(2) };
        });
      },
      quizAnswer: (i: number) => quiz.answer(i),
      feet: () => +(feetY - offs[curRoom].y).toFixed(2),
      surface: () => {
        const sr = roomOfZ(pos.z);
        return rooms[sr].surfaceAt?.(pos.x - offs[sr].x, pos.z - offs[sr].z) ?? 'stone';
      },
      sfx: (n: string, v = 1) => sfx.play(n as never, v),
      say: (lines: Parameters<typeof dialogue.say>[0], block = true) => dialogue.say(lines, { block }),
      seen: (id: string) => diary.markSeen(id, rooms[curRoom]?.name),
      visit: (name: string) => diary.visitRoom(name),
      bookClick: (id: string) => book.click(id),
      bookLayout: () => bookLayout(diaryStore.get()),
      strokes: () => diaryStore.get().strokes.length,
      stamps: () => diaryStore.get().stamps.length,
      inv: () => ({ die: hasDie, chalk: hasChalk, prompt: promptLabel }),
      interact: () => interact(),
      interactables: () => rooms[curRoom].interactables?.map((it) => ({ l: it.label, on: it.enabled(), p: it.pos.toArray().map((v) => +v.toFixed(2)), cam: [+(camera.position.x - offs[curRoom].x).toFixed(2), +(camera.position.z - offs[curRoom].z).toFixed(2)] })),
      chat: (k: string) => { chatCool = 0; chatFn(k); },
      rooms: () => rooms.map((r, i) => ({ n: r.name, z: +offs[i].z.toFixed(1) })),
      flags: () => ({ ...progressStore.get().flags, stage: progress.stage() }),
      cine: () => ({ intro: intro ? intro.ph : null, burn: burn ? +burn.t.toFixed(2) : null, holds }),
      inscriptions: () => rooms.map((r) => (r.inscriptions ?? []).map((i) => ({ w: i.words.join('+'), read: i.read }))),
      progressReset: () => progress.reset(),
      sketch: (w = 'brasa') => showSketch(w, true),
      dieSay: (g: string[], pic?: string) => saySay(g, { pic }),
      opening: () => ({ ph: scribeDrop ? scribeDrop.ph : null, cine: !!cineCam, headW: topScribe && rooms[0].wellTop ? (topScribe.head.getWorldPosition(tmpV), [+(tmpV.x - wellWorld().x).toFixed(2), +(tmpV.y - wellWorld().y).toFixed(2), +(tmpV.z - wellWorld().z).toFixed(2)]) : null, hand: topScribe && rooms[0].wellTop ? (topScribe.hand.getWorldPosition(scribeHand), [+(scribeHand.x - wellWorld().x).toFixed(2), +(scribeHand.y - wellWorld().y).toFixed(2), +(scribeHand.z - wellWorld().z).toFixed(2)]) : null, pinned, walk: !!autoWalk, fov: +camera.fov.toFixed(1), pos: [+pos.x.toFixed(2), +pos.z.toFixed(2)], pitch: +pitch.toFixed(2), die: dieState, dieY: +dieP.y.toFixed(2), dieXZ: [+dieP.x.toFixed(2), +dieP.z.toFixed(2)], sh: rooms[0].shaft ? [rooms[0].shaft.x, rooms[0].shaft.z] : null, off0: [offs[0].x, offs[0].z] }),
      lifeDbg: () => ({ talking: talkingNow(), look: { ...life.out.look }, rostoP: rostoP.map((v) => +v.toFixed(2)), dots: FACE_N.map((n) => +nW.copy(n).applyQuaternion(dieHolder.quaternion).dot(FRONT).toFixed(2)), out: [life.out.dx, life.out.dy, life.out.scale, life.out.glow, life.out.quat.toArray()], tgt: lifeTarget(), glow: lifeGlow, pos: dieGroup.position.toArray(), scale: dieGroup.scale.x, q: dieHolder.quaternion.toArray(), vis: dieGroup.visible, css: [dieCssX, dieCssY] }),
      rostoSheet: () => {
        // prévia dos 6 rostos (face e brilho) em grande, só para avaliar o desenho
        const S = 6;
        const cv = document.createElement('canvas');
        cv.width = 64 * S * 6;
        cv.height = 64 * S * 2;
        const g = cv.getContext('2d')!;
        g.imageSmoothingEnabled = false;
        for (let n = 1; n <= 6; n++) {
          const r = dieRostoCanvas(n, FACES[n - 1].color, false, 0);
          g.drawImage(r.face, (n - 1) * 64 * S, 0, 64 * S, 64 * S);
          g.drawImage(r.glow, (n - 1) * 64 * S, 64 * S, 64 * S, 64 * S);
        }
        return cv.toDataURL('image/png');
      },
      freezeSpin: (v: number | null) => { (globalThis as Record<string, unknown>).__spinFreeze = v === null ? undefined : v; },
      life: (k: string) => { if (k === 'sleep') life.sleepNow(); else life.react(k as never); },
      glyphFire: (ri: number) => (rooms[ri]?.inscriptions ?? []).map((ins) => ins.panels.filter((p) => p.id).map((p) => `${p.id}:${(p.fire ?? 0).toFixed(2)}`).join(' ')),
      sketchAge: (v: number | null) => { (globalThis as Record<string, unknown>).__skAge = v === null ? undefined : v; },
      sfxStep: (s: 'stone' | 'rug' | 'plate' | 'water') => sfx.step(s),
      sfxBounce: (i: number) => sfx.bounce(i),
      sfxMode: (m: 0 | 1 | 2) => sfx.setMode(m),
      audio: () => ({ state: sfx.state, played: sfx.played, steps: sfx.steps, loaded: sfx.ready }),
      state: () => ({
        room: curRoom,
        dieState,
        face,
        tool,
        complete,
        x: pos.x,
        y: feetY,
        z: pos.z,
        die: [dieP.x, dieP.y, dieP.z].map((v) => +v.toFixed(2)),
        marks: chalk.count,
        vx: moveVel.x,
        vz: moveVel.z,
        gems,
      }),
      place: (x: number, z: number, y: number, p: number) => {
        pos.set(x, feetY + EYE, z);
        yaw = y;
        pitch = p;
      },
      face: (n: number) => selectFace(n),
      act: () => action(),
      put: () => place(),
      reset: () => reset(),
      goto: (i: number) => spawnIn(i),
      save: () => saveGame(),
      darkLevel: () => darkK,
      titleTune: (o: Partial<typeof TT> & { blur?: number }) => { if (o.blur !== undefined) TB.blur = o.blur; Object.assign(TT, o); },
      titleDbg: () => ({ focus: titleFocus.toArray(), cam: camera.position.toArray(), fov: camera.fov, die: dieGroup.position.toArray(), s: dieGroup.scale.x, vis: dieGroup.visible, focusZ: postMat.uniforms.uFocus.value, mode }),
      noHud: (v = true) => {
        devNoHud = v;
      },
      prompt: (l: string | null) => opts.onPrompt?.(l), // (testes: mostra um aviso de ação)
      meta: () => saves.meta(),
      solved: () => rooms.map((r) => r.isSolved?.() ?? null),
      tool: (tl: Tool) => setTool(tl),
      swap: () => swapTool(),
      // coordenadas de tela (NDC) de um ponto do mundo
      ndc: (x: number, y: number, z: number) => {
        camera.updateMatrixWorld();
        const v = new THREE.Vector3(x, y, z).project(camera);
        return [v.x, v.y];
      },
      stroke: (pts: [number, number][], erase = false) => {
        chalk.beginStroke();
        for (const [x, y] of pts) paintAt(new THREE.Vector2(x, y), erase);
        chalk.beginStroke();
      },
      dbg,
      exp: (k: string) => {
        if (k === 'pal1') {
        }
        if (k === 'noao') scene.traverse((o) => { if (o.renderOrder === 2 || o.renderOrder === 3) o.visible = false; });
        if (k === 'nobloom') postMat.uniforms.uBloom.value = 0;
        if (k === 'noadd') scene.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material | undefined; if (m && !Array.isArray(m) && m.blending === THREE.AdditiveBlending) o.visible = false; });
        if (k === 'noshadow') renderer.shadowMap.enabled = false;
        if (k === 'notrans') scene.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material | undefined; if (m && !Array.isArray(m) && m.transparent) o.visible = false; });
        if (k === 'nokey') rooms.forEach((r) => { if (r.shadowLight) r.shadowLight.intensity = 0; });
        if (k === 'nolights') scene.traverse((o) => { if ((o as THREE.Light).isLight && !(o as THREE.AmbientLight).isAmbientLight) o.visible = false; });
        if (k === 'half') { renderer.setSize(200, 90, false); rt.setSize(200, 90); rtHud.setSize(200, 90); postMat.uniforms.uRes.value.set(200, 90); }
      },
      perf: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, lights: scene.children.length }),
      chalkCount: () => chalk.count,
      // coloca o dado direto num ponto (para testes de puzzle)
      drop: (x: number, y: number, z: number) => {
        dieRoom = curRoom;
        thrownFace = face;
        dieThrown = true;
        dieP.set(x, y, z);
        dieV.set(0, 0, 0);
        dieW.set(0, 0, 0);
        worldDie.position.copy(dieP);
        worldModel.scale.setScalar(0.42);
        worldDie.visible = true;
        dieState = 'flying';
        restTimer = 0;
      },
    };
  }

  return {
    playUi: (name, v = 1) => sfx.play(name, v),
    action,
    place,
    rotate: () => cycleFace(1),
    swapTool,
    setAudio: (m) => sfx.setMode(m),
    setChalkMode: (m) => {
      chalkMode = m;
      brush.active = false;
    },
    clearChalk,
    reset,
    restart,
    begin,
    // tela inicial: para onde o olho do dado vai (coordenadas da janela), e o humor (pulinho em "Novo jogo", abatido em "Sair")
    titleLook: (x: number, y: number) => titleInput(x, y),
    titleMood: (m: 'new' | 'quit' | null) => {
      if (m === titleMood) return;
      titleMood = m;
      if (m === 'new') life.react('perk');
      else if (m === 'quit') life.react('sad');
    },
    titleCredits: (on: boolean) => {
      titleCreditsOn = on;
    },
    // as transições: jogo novo (sobe pelo feixe até o branco), continuar (pulinho e pontilhado para o lugar salvo), outro espaço (pontilhado para o preto)
    titleNew: (done: () => void) => {
      if (titleTr) return;
      titleTr = { k: 'new', t: 0, done };
      sfx.play('room', 0.6);
    },
    titleGo: (done?: () => void, reload = false) => {
      if (titleTr) return;
      requestLock(); // (ainda dentro do clique)
      life.react('joy');
      titleTr = { k: reload ? 'out' : 'go', t: 0, done };
      sfx.play('throw', 0.4);
    },
    // ao abrir a página logo depois de escolher outro espaço: aparece em pontilhado a partir do preto
    fadeInFromBlack: () => {
      snapWant = 'black';
      disT = 0;
      disDir = 1;
    },
    toTitle: () => saveGame(() => location.replace(location.pathname + location.search)),
    saveNow: () => saveGame(),
    lock: requestLock,
    dispose() {
      cancelAnimationFrame(raf);
      unsubProgress();
      unsubDiaryFaces();
      window.removeEventListener('pointerdown', onSkip);
      window.removeEventListener('keydown', onSkip);
      book.dispose();
      unsubConfig();
      window.removeEventListener('pointermove', onTitleMove);
      window.removeEventListener('pointerdown', onTitleDown);
      window.removeEventListener('keydown', onTitleKey);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('pointerlockerror', onLockError);
      document.removeEventListener('pointerlockchange', onLockChange);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('visibilitychange', onVis);
      if (locked()) document.exitPointerLock();
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('contextmenu', onContext);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      renderer.dispose();
      rt.dispose();
      window.removeEventListener('resize', sizeBook);
      bookRenderer.dispose();
      bookCanvas.remove();
      rtHud.dispose();
    },
  };
}
