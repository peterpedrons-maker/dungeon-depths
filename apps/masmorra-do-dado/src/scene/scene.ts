// Motor do jogo: renderização pixel art (alvo de baixa resolução + paleta fixa +
// contorno + dithering), mãos no HUD (dado e pedra-sabão), física do dado, movimento
// do jogador, giz livre e a passagem de uma sala para a outra.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { FACES } from '../faces';
import { dieFaceTexture, dieGlowTexture, soapSideTexture, soapTipTexture } from './textures';
import { Chalk } from './chalk';
import { CORRIDOR, dbg } from './kit';
import { buildRoom1 } from './rooms/room1';
import { buildRoom2 } from './rooms/room2';
import { buildRoom3 } from './rooms/room3';
import { buildRoom4 } from './rooms/room4';
import type { Ctx, DieState, Rect, Room, RoomBuilder } from './types';

const FOG = '#0b0912';
const BUILDERS: RoomBuilder[] = [buildRoom1, buildRoom2, buildRoom3, buildRoom4];

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
export type ChalkMode = 'draw' | 'erase' | 'look';

export interface SceneOptions {
  onStick?: (s: StickState) => void;
  onCaption?: (title: string, sub: string, color: string) => void;
  onComplete?: (info: { gem: boolean }) => void;
  onDie?: (state: 'hand' | 'flying' | 'rest') => void;
  onTool?: (tool: Tool) => void;
}

export interface SceneApi {
  action(): void; // arremessa ou recolhe
  place(): void; // posiciona o dado com cuidado onde a mira aponta
  rotate(): void; // próxima face
  swapTool(): void; // troca entre dado e giz na mão principal
  setChalkMode(m: ChalkMode): void; // (celular) o que o dedo faz na tela com o giz
  clearChalk(): void; // apaga tudo (pede confirmação: aperte de novo)
  reset(): void; // reinicia a sala atual
  restart(): void; // volta pra primeira sala
  dispose(): void;
}

export function createScene(canvas: HTMLCanvasElement, opts: SceneOptions = {}): SceneApi {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.autoClear = false;
  renderer.setPixelRatio(1);
  renderer.setClearColor(FOG, 1);

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
  const CAM_NEAR = 0.15;
  const CAM_FAR = 40;

  // Paleta fixa (estilo pixel art de verdade): cada pixel vira a cor mais
  // próxima desta lista, com um dithering ordenado bem leve só pra suavizar.
  const PALETTE = [
    '#000000', '#0b0912', '#1c1b26', '#2c2a3e', '#403e56', '#55536e', '#6e6c8a', '#8e8ca8', '#b8b4cc', '#e4e0f0',
    '#1d1816', '#3a2a28', '#5a4540', '#7a5e54', '#9c7d6c', '#c2a48e',
    '#2a180e', '#3a2214', '#4a2c1c', '#5a3a20', '#6a4028', '#7a5030', '#8c5a38', '#a06a3c', '#b07a4c', '#c88a4c', '#d8a070', '#e8b878', '#f0c890', '#ffe0b0',
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

  // ── pós-processo: contorno + paleta + dithering ─────────────────────────
  const postScene = new THREE.Scene();
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postMat = new THREE.ShaderMaterial({
    defines: { PAL_N: PALETTE.length },
    uniforms: {
      tRoom: { value: rt.texture },
      tDepth: { value: rt.depthTexture },
      tHud: { value: rtHud.texture },
      uRes: { value: new THREE.Vector2(64, 64) },
      uNear: { value: CAM_NEAR },
      uFar: { value: CAM_FAR },
      uPal: { value: palVec },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform sampler2D tRoom; uniform sampler2D tDepth; uniform sampler2D tHud;
      uniform vec2 uRes; uniform float uNear; uniform float uFar;
      uniform vec3 uPal[PAL_N];
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
        vec3 c = hud.a > 0.5 ? hud.rgb : texture2D(tRoom, vUv).rgb;
        float ic = invZ(vUv);
        float lx = invZ(vUv - vec2(o.x, 0.0)) + invZ(vUv + vec2(o.x, 0.0)) - 2.0 * ic;
        float ly = invZ(vUv - vec2(0.0, o.y)) + invZ(vUv + vec2(0.0, o.y)) - 2.0 * ic;
        float edge = step(0.1 * ic + 0.025, max(lx, ly));
        c = clamp(c, 0.0, 1.0);
        c = pow(c, vec3(1.0 / 2.2));
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(vec3(l), c, 1.0);
        c *= mix(1.0, 0.32, edge);
        c += (bayer4(floor(vUv * uRes)) - 0.47) * 0.035;
        vec3 best = uPal[0];
        float bd = 1e9;
        for (int i = 0; i < PAL_N; i++) {
          vec3 d = c - uPal[i];
          float dist = dot(d * d, vec3(0.6, 1.0, 0.45));
          if (dist < bd) { bd = dist; best = uPal[i]; }
        }
        gl_FragColor = vec4(best, 1.0);
      }`,
    depthTest: false,
    depthWrite: false,
  });
  const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat);
  postQuad.frustumCulled = false;
  postScene.add(postQuad);
  // ── sala e cena ─────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  const ambient = new THREE.AmbientLight(0x7a78b8, 1.9);
  scene.add(ambient);
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  let yaw = 0;
  let pitch = -0.04;
  const camera = new THREE.PerspectiveCamera(66, 1, CAM_NEAR, CAM_FAR);
  camera.rotation.order = 'YXZ';
  scene.add(camera);
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
  const dieGeo = new RoundedBoxGeometry(1, 1, 1, 3, 0.16);
  const buildDie = (mats: THREE.Material[]) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(dieGeo, mats));
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

  // dado arremessado: vive dentro da sala, com física própria
  const worldDie = new THREE.Group();
  const worldModel = buildDie(dieMats);
  worldModel.scale.setScalar(0.42);
  worldDie.add(worldModel);
  worldDie.visible = false;
  scene.add(worldDie);
  // "fantasma" do dado: mostra onde ele ficaria se for posicionado
  const ghostMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false, fog: false });
  const ghost = new THREE.Mesh(dieGeo, ghostMat);
  ghost.scale.setScalar(0.42);
  ghost.visible = false;
  scene.add(ghost);

  // visto de cima e de frente, girando devagar em torno do eixo vertical
  const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.8, 0, 0));
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
  const computeTarget = (n: number, spin: number) =>
    targetQ.copy(tilt).multiply(spinQ.setFromAxisAngle(Y_AXIS, spin)).multiply(upQ(n));

  let face = 1; // face escolhida (virada pra cima no HUD)
  let thrownFace = 1; // face do dado que está lá fora
  let dieThrown = true; // false = foi posicionado (não pega a gema)
  let handDim = 0; // 0 = dado na mão, 1 = dado lá fora
  const updateMats = () => {
    DIE_FACES.forEach((n, i) => {
      handMats[i].emissiveIntensity = (n === face ? 1.6 : 0.5) * (1 - 0.65 * handDim);
      handMats[i].color.setScalar(1 - 0.5 * handDim);
      dieMats[i].emissiveIntensity = n === thrownFace ? 1.4 : 0.5;
    });
  };
  const applyFace = (n: number) => {
    face = n;
    updateMats();
    accentLight.color.set(FACES[n - 1]?.color ?? '#ffffff');
  };
  applyFace(1);
  computeTarget(1, 0);
  curQ.copy(targetQ);
  let spin = 0;


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
  soapGroup.add(soapHolder);
  dieScene.add(soapGroup);
  const SOAP_ROT = new THREE.Euler(-0.95, 0.55, 0.5);
  soapHolder.rotation.copy(SOAP_ROT);
  let soapKick = 0;

  let tool: Tool = 'die';
  let dieU = 0; // 0 = dado na mão principal, 1 = na auxiliar
  let soapU = 1;
  let chalkMode: ChalkMode = 'draw';
  const setTool = (t: Tool) => {
    if (tool === t) return;
    tool = t;
    brush.active = false;
    chalk.beginStroke();
    opts.onTool?.(tool);
  };
  const swapTool = () => setTool(tool === 'die' ? 'chalk' : 'die');

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
  let dieState: DieState = 'hand';
  const dieP = new THREE.Vector3();
  const dieV = new THREE.Vector3();
  const dieW = new THREE.Vector3();
  let restTimer = 0;
  let restReturn = 0;
  let handPop = 0;
  const restQ = new THREE.Quaternion();
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
  let dieRoom = 0; // sala onde o dado está (a posição dieP é local a ela)
  let gems = 0;
  let complete = false;
  const announced = new Set<number>();
  const FAR = new THREE.Vector3(0, -99, 0);

  const makeCtx = (off: THREE.Vector3, idx: number): Ctx => {
    const lp = new THREE.Vector3();
    return {
      caption: (a, b, c) => caption(a, b, c),
      player: {
        get pos() {
          return lp.copy(pos).sub(off);
        },
      },
      feetY: () => feetY - off.y,
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
      if (i > 0) off.z = offs[i - 1].z + rooms[i - 1].doorZ - CORRIDOR - room.entranceZ;
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
  const nearSurfaces = () => {
    const out: THREE.Object3D[] = [];
    for (let i = Math.max(0, curRoom - 1); i <= Math.min(rooms.length - 1, curRoom + 1); i++) out.push(...rooms[i].surfaces);
    return out;
  };

  const resetDie = () => {
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
  };

  // luz, névoa e clima acompanham a sala onde o jogador está (suave, sem corte)
  const fogC = new THREE.Color();
  const ambC = new THREE.Color();
  const blendAtmosphere = (dt: number, snap = false) => {
    const r = rooms[curRoom];
    const k = snap ? 1 : 1 - Math.exp(-dt * 2.2);
    fogC.set(r.fog.color);
    const f = scene.fog as THREE.Fog;
    f.color.lerp(fogC, k);
    f.near += (r.fog.near - f.near) * k;
    f.far += (r.fog.far - f.far) * k;
    ambC.setHex(r.ambient.color);
    ambient.color.lerp(ambC, k);
    ambient.intensity += (r.ambient.intensity - ambient.intensity) * k;
    fogColor = '#' + f.color.getHexString();
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
    if (ground) {
      const k = Math.exp(-ph.fr * dt);
      dieV.x *= k;
      dieV.z *= k;
      if (flat && Math.abs(dieV.y) < 0.6) dieV.y = 0;
      dieW.set(dieV.z, 0, -dieV.x).divideScalar(R * 1.6); // rola no chão
    }
    if (ground && dieV.length() < 0.45) restTimer += dt;
    else restTimer = 0;
    if (restTimer > 0.2) {
      dieState = 'rest';
      dieV.set(0, 0, 0);
      restReturn = 0;
      const yawQ = tmpQ.setFromAxisAngle(tmpAxis.set(0, 1, 0), Math.random() * Math.PI * 2);
      restQ.copy(yawQ).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))).multiply(faceQ(thrownFace));
      room.onDieRest?.();
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
  };

  const busy = () => complete;

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
    if (lz < rooms[ri].doorZ + 0.15 || lz > rooms[ri].entranceZ - 0.15) return null;
    const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    if (n.dot(ray.ray.direction) > 0) n.negate();
    return { p: hit.point, n, room: ri };
  };
  const placeDie = () => {
    if (dieState !== 'hand' || busy()) return;
    const a = aimPoint();
    if (!a) {
      caption('Longe demais', 'Aponte para o chão ou uma superfície mais perto.', '#cfc6e8');
      return;
    }
    thrownFace = face;
    dieThrown = false;
    updateMats();
    dieRoom = a.room;
    animTo.copy(a.p).addScaledVector(a.n, R + 0.02);
    handWorld(animFrom);
    animT = 0;
    dieV.set(0, 0, 0);
    dieW.set(0, 0, 0);
    worldDie.position.copy(animFrom);
    worldModel.scale.setScalar(0.3);
    worldDie.quaternion.setFromAxisAngle(tmpAxis.set(0, 1, 0), Math.random() * Math.PI * 2);
    worldDie.visible = true;
    dieState = 'placing';
  };

  const place = () => {
    if (tool !== 'die') return;
    if (dieState === 'hand') placeDie();
    else recall();
  };

  const action = () => {
    if (tool !== 'die') return;
    if (dieState === 'hand') throwDie();
    else recall();
  };

  const selectFace = (n: number) => {
    const f = FACES[n - 1];
    if (!f) return;
    if (!f.unlocked) {
      caption(`${n} · ???`, 'Face selada — descubra como libertá-la.', '#8f86a8');
      return;
    }
    if (tool !== 'die') setTool('die');
    applyFace(n);
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
  let handX = 0.44;
  let dieBaseY = -0.2;
  let dieScaleBase = 0.17;
  const resize = () => {
    // ~200 linhas na vertical: pixels bem visíveis, mas ainda legível (celular e PC).
    const scale = Math.max(2, Math.round(window.innerHeight / 200));
    const w = Math.max(64, Math.ceil(window.innerWidth / scale));
    const h = Math.max(64, Math.ceil(window.innerHeight / scale));
    renderer.setSize(w, h, false);
    rt.setSize(w, h);
    rtHud.setSize(w, h);
    if (rt.depthTexture) {
      rt.depthTexture.image.width = w;
      rt.depthTexture.image.height = h;
      rt.depthTexture.dispose();
    }
    postMat.uniforms.uRes.value.set(w, h);
    const aspect = w / h;
    const vFromH = (hDeg: number) => (2 * Math.atan(Math.tan((hDeg * Math.PI) / 360) / aspect) * 180) / Math.PI;
    camera.fov = aspect >= 1 ? Math.min(66, vFromH(95)) : Math.min(100, Math.max(66, vFromH(82)));
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    dieCam.aspect = aspect;
    dieCam.updateProjectionMatrix();
    const halfW = Math.tan((45 * Math.PI) / 360) * aspect;
    dieScaleBase = Math.min(0.17, halfW * 0.5);
    dieBaseY = aspect < 1 ? -0.12 : -0.16;
    handX = Math.min(halfW * 0.4, 0.44);
    soapBase.set(-handX, dieBaseY + 0.02, -1);
  };
  resize();
  window.addEventListener('resize', resize);

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
    const k = e.key.toLowerCase();
    keys.add(k);
    if (e.repeat) return;
    if (/^[1-6]$/.test(k)) selectFace(Number(k));
    else if (k === ' ' || k === 'f') {
      e.preventDefault();
      action();
    } else if (k === 'e') recall();
    else if (k === 'r') reset();
    else if (k === 'g') place();
    else if (k === 'tab' || k === 'q') {
      e.preventDefault();
      swapTool();
    } else if (k === 'x') clearChalk();
  };
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    cycleFace(e.deltaY > 0 ? 1 : -1);
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
  const STICK_R = 52;
  const emitStick = (active: boolean) => opts.onStick?.({ active, ox: stickOx, oy: stickOy, x: stickX, y: stickY });

  let lockFailed = !canvas.requestPointerLock;
  let lockClick = false;
  const locked = () => document.pointerLockElement === canvas;
  const onLockError = () => {
    lockFailed = true;
  };
  document.addEventListener('pointerlockerror', onLockError);

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
    } else if (tool === 'chalk' && (mouse || chalkMode !== 'look') && !brush.active) {
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
    if (e.pointerType === 'mouse' && locked()) {
      yaw -= e.movementX * 0.0022;
      pitch = clamp(pitch - e.movementY * 0.0022, -1.2, 1.2);
    } else if (e.pointerId === lookId) {
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      if (Math.hypot(dx, dy) > 8) moved = true;
      yaw -= (e.clientX - lastX) * 0.006;
      pitch = clamp(pitch - (e.clientY - lastY) * 0.006, -0.7, 0.7);
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

  const MAX_SPEED = 2.7;
  const move = (dt: number) => {
    if (busy()) {
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
    const tx = (-Math.sin(yaw) * fwd + Math.cos(yaw) * str) * MAX_SPEED;
    const tz = (-Math.cos(yaw) * fwd - Math.sin(yaw) * str) * MAX_SPEED;
    // aceleração e frenagem suaves (em vez de ligar/desligar de uma vez)
    const k = 1 - Math.exp(-dt * (len > 0.02 ? 11 : 14));
    moveVel.x += (tx - moveVel.x) * k;
    moveVel.z += (tz - moveVel.z) * k;
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
    const gy = rooms[ri].groundY(pos.x - offs[ri].x, pos.z - offs[ri].z) + offs[ri].y;
    const diff = gy - feetY;
    if (diff >= 0 || (diff > -0.3 && vy === 0)) {
      feetY = gy;
      vy = 0;
    } else {
      vy -= 22 * dt;
      feetY += vy * dt;
      if (feetY <= gy) {
        landKick = Math.min(1, -vy / 9);
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
    caption(rooms[0].name, rooms[0].subtitle, '#ffd36b');
  };

  buildWorld();
  scene.fog = new THREE.Fog(rooms[0].fog.color, rooms[0].fog.near, rooms[0].fog.far);
  ambient.color.setHex(rooms[0].ambient.color);
  ambient.intensity = rooms[0].ambient.intensity;
  spawnIn(0);
  blendAtmosphere(0, true);
  announced.add(0);

  // ── loop ────────────────────────────────────────────────────────────────
  let raf = 0;
  let last = performance.now();
  let t = 0;
  let bob = 0;
  let bobAmp = 0;
  let emittedDie: DieState | null = null;
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;

    const moving = move(dt);
    vertical(dt);
    const ri = roomOfZ(pos.z);
    if (ri !== curRoom) {
      curRoom = ri;
      // saiu da sala do dado: o dado volta pra mão (a porta atrás fecha)
      if (dieState !== 'hand' && dieRoom !== curRoom) resetDie();
      if (!announced.has(ri)) {
        announced.add(ri);
        caption(rooms[ri].name, rooms[ri].subtitle, '#ffd36b');
      }
    }
    blendAtmosphere(dt);
    landKick = Math.max(0, landKick - dt * 4);
    const speedFrac = Math.min(1, Math.hypot(moveVel.x, moveVel.z) / MAX_SPEED);
    bobAmp += (speedFrac - bobAmp) * Math.min(1, dt * 8);
    bob += dt * (6 + 4 * speedFrac) * (speedFrac > 0.05 ? 1 : 0);
    const bobY = dbg.bob ? Math.sin(bob) * 0.026 * bobAmp - landKick * 0.18 : 0;
    pos.y = feetY + EYE;
    camera.position.set(pos.x, pos.y + bobY, pos.z);
    camera.rotation.set(pitch, yaw, 0);

    // ── dado no mundo ──
    if (dieState === 'flying') {
      const n = Math.max(1, Math.ceil(dt / (1 / 120)));
      for (let i = 0; i < n && dieState === 'flying'; i++) stepDie(dt / n);
      worldDie.position.copy(dieP).add(offs[dieRoom]);
      const w = dieW.length();
      if (w > 1e-4) {
        tmpQ.setFromAxisAngle(tmpAxis.copy(dieW).normalize(), w * dt);
        worldDie.quaternion.premultiply(tmpQ);
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
      }
    } else if (dieState === 'rest') {
      worldDie.quaternion.slerp(restQ, 1 - Math.exp(-dt * 12));
      worldDie.position.copy(dieP).add(offs[dieRoom]);
      if (!rooms[dieRoom].holdsDie()) {
        restReturn += dt;
        if (restReturn > 1.8) recall();
      }
    }

    if (dieState !== emittedDie) {
      emittedDie = dieState;
      opts.onDie?.(dieState === 'returning' || dieState === 'placing' ? 'flying' : dieState);
    }

    // ── salas ──
    rooms.forEach((r) => r.update(dt, t));
    const lastRoom = rooms[rooms.length - 1];
    if (!complete && curRoom === rooms.length - 1 && lastRoom.exitReached?.()) {
      complete = true;
      gems = rooms.filter((r) => r.bonus?.()).length;
      opts.onComplete?.({ gem: gems > 0 });
    }

    // ── giz ──
    eraseArmed = Math.max(0, eraseArmed - dt);
    if (brush.active && tool === 'chalk') paintAt(brush.ndc, brush.erase);

    // fantasma de onde o dado seria posicionado
    const aim = dieState === 'hand' && tool === 'die' && !busy() ? aimPoint() : null;
    ghost.visible = !!aim;
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
    spin += dt * 0.8;
    handDim += ((dieState === 'hand' ? 0 : 1) - handDim) * Math.min(1, dt * 8);
    updateMats();
    computeTarget(face, spin);
    curQ.slerp(targetQ, 1 - Math.exp(-dt * 9));
    wobble.setFromEuler(wobbleEuler.set(Math.sin(t * 1.1) * 0.012, 0, Math.sin(t * 0.8) * 0.012));
    dieHolder.quaternion.copy(curQ).multiply(wobble);
    const du = ease(dieU);
    dieGroup.scale.setScalar(dieScaleBase * (1 + handPop * 0.3) * (1 - 0.38 * du));
    dieGroup.position.set(
      handX + (-handX - handX) * du,
      dieBaseY + Math.sin(t * 1.6) * 0.012 + (moving ? Math.sin(bob + 1) * 0.012 : 0) + Math.sin(Math.PI * du) * 0.05,
      -1,
    );
    dieCam.position.set(0, 0, 0);

    soapKick = Math.max(0, soapKick - dt * 3.5);
    const su = ease(soapU);
    const drawing = brush.active && tool === 'chalk' && !brush.erase;
    const erasing = brush.active && tool === 'chalk' && brush.erase;
    const kk = Math.max(Math.sin(soapKick * Math.PI), drawing ? 0.55 + 0.25 * Math.sin(t * 17) : erasing ? 0.5 + 0.3 * Math.sin(t * 22) : 0);
    soapGroup.scale.setScalar(dieScaleBase * 0.95 * (1 - 0.34 * su));
    // x: de +handX (principal) para -handX (auxiliar); o golpe puxa um pouco pro centro
    const toCenter = -1 + 2 * su;
    soapGroup.position.set(
      handX + (-handX - handX) * su + toCenter * kk * 0.15,
      soapBase.y + Math.sin(t * 1.4 + 1.3) * 0.012 + kk * 0.07 + (moving ? Math.sin(bob) * 0.012 : 0) + Math.sin(Math.PI * su) * 0.05,
      soapBase.z,
    );
    const sgn = 2 * su - 1; // espelha a inclinação conforme a mão
    soapHolder.rotation.set(
      SOAP_ROT.x + kk * 0.5,
      sgn * SOAP_ROT.y + Math.sin(t * 0.9) * 0.05 + sgn * kk * 0.3,
      sgn * SOAP_ROT.z + Math.sin(t * 1.1) * 0.03,
    );

    renderer.setRenderTarget(rt);
    renderer.setClearColor(fogColor, 1);
    renderer.clear();
    renderer.render(scene, camera);
    // dado e giz do HUD: alvo à parte (fundo transparente), colados por cima no pós-processo
    renderer.setRenderTarget(rtHud);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(dieScene, dieCam);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  // Só em desenvolvimento: gancho pra testes automatizados (não vai pro build).
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__mdd = {
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
    action,
    place,
    rotate: () => cycleFace(1),
    swapTool,
    setChalkMode: (m) => {
      chalkMode = m;
      brush.active = false;
    },
    clearChalk,
    reset,
    restart,
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('pointerlockerror', onLockError);
      if (locked()) document.exitPointerLock();
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('contextmenu', onContext);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      renderer.dispose();
      rt.dispose();
      rtHud.dispose();
    },
  };
}
