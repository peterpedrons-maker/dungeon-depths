// Cena 3D em primeira pessoa. O truque do visual "pixelado 3D": a cena é
// renderizada num alvo de baixíssima resolução (~180-250 linhas), passa por um
// shader que reduz as cores e aplica dithering ordenado (Bayer 4x4), e o canvas
// é ampliado sem suavização pelo CSS.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { FACES } from '../faces';
import {
  brickTexture,
  crackTexture,
  flameFrames,
  floorTexture,
  gemTexture,
  dieFaceTexture,
  dieGlowTexture,
  plateTexture,
  runeTexture,
  sparkTexture,
  woodTexture,
} from './textures';

const ROOM = { x0: -4, x1: 4, z0: -10, z1: 2, h: 3.2 };
const PILLARS: [number, number][] = [
  [-2.3, -3],
  [2.3, -3],
  [-2.3, -7],
  [2.3, -7],
];
const FOG = '#0b0912';
const LAMP_OFF = 0x2a2230;

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

export interface SceneOptions {
  onStick?: (s: StickState) => void;
  onCaption?: (title: string, sub: string, color: string) => void;
  onComplete?: (info: { gem: boolean }) => void;
  onDie?: (state: 'hand' | 'flying' | 'rest') => void;
}

export interface SceneApi {
  action(): void; // arremessa ou recolhe
  rotate(): void; // próxima face
  reset(): void;
  dispose(): void;
}

function lambert(map: THREE.Texture | null, color = 0xffffff) {
  return new THREE.MeshLambertMaterial({ map, color });
}

export function createScene(canvas: HTMLCanvasElement, opts: SceneOptions = {}): SceneApi {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.autoClear = false;
  renderer.setPixelRatio(1);
  renderer.setClearColor(FOG, 1);

  const rt = new THREE.WebGLRenderTarget(64, 64, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.HalfFloatType,
  });

  // ── pós-processo: reduz cores + dithering ───────────────────────────────
  const postScene = new THREE.Scene();
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postMat = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: rt.texture }, uRes: { value: new THREE.Vector2(64, 64) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform vec2 uRes; varying vec2 vUv;
      float bayer2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
      float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
      void main(){
        vec3 c = clamp(texture2D(tDiffuse, vUv).rgb, 0.0, 1.0);
        c = pow(c, vec3(1.0 / 2.2));
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(vec3(l), c, 1.15);
        float levels = 11.0;
        float t = 0.5 + (bayer4(floor(vUv * uRes)) - 0.47) * 0.3;
        vec3 q = floor(c * (levels - 1.0) + t) / (levels - 1.0);
        gl_FragColor = vec4(q, 1.0);
      }`,
    depthTest: false,
    depthWrite: false,
  });
  const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat);
  postQuad.frustumCulled = false;
  postScene.add(postQuad);

  // ── sala ────────────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(FOG, 4, 19);
  scene.add(new THREE.AmbientLight(0x7a78b8, 1.9));

  const W = ROOM.x1 - ROOM.x0;
  const L = ROOM.z1 - ROOM.z0;
  const T = 1.2;

  const addPlane = (w: number, h: number, mat: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    scene.add(m);
    return m;
  };

  addPlane(W, L, lambert(floorTexture([W / T, L / T])), 0, 0, (ROOM.z0 + ROOM.z1) / 2, -Math.PI / 2);
  addPlane(W, L, lambert(brickTexture([W / T, L / T], 0.8, 17)), 0, ROOM.h, (ROOM.z0 + ROOM.z1) / 2, Math.PI / 2);
  addPlane(W, ROOM.h, lambert(brickTexture([W / T, ROOM.h / T])), 0, ROOM.h / 2, ROOM.z0);
  addPlane(W, ROOM.h, lambert(brickTexture([W / T, ROOM.h / T], 1, 23)), 0, ROOM.h / 2, ROOM.z1, 0, Math.PI);
  addPlane(L, ROOM.h, lambert(brickTexture([L / T, ROOM.h / T], 1, 31)), ROOM.x0, ROOM.h / 2, (ROOM.z0 + ROOM.z1) / 2, 0, Math.PI / 2);
  addPlane(L, ROOM.h, lambert(brickTexture([L / T, ROOM.h / T], 1, 37)), ROOM.x1, ROOM.h / 2, (ROOM.z0 + ROOM.z1) / 2, 0, -Math.PI / 2);

  const stoneMat = lambert(brickTexture([1, 1], 0.9, 41));
  const addBox = (w: number, h: number, d: number, mat: THREE.Material | THREE.Material[], x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    scene.add(m);
    return m;
  };

  for (const [x, z] of PILLARS) {
    const pillarMat = lambert(brickTexture([0.75, 2.7], 0.95, 50 + Math.abs(x * z)));
    addBox(0.9, ROOM.h, 0.9, pillarMat, x, ROOM.h / 2, z);
    addBox(1.1, 0.25, 1.1, stoneMat, x, 0.125, z);
    addBox(1.1, 0.25, 1.1, stoneMat, x, ROOM.h - 0.125, z);
  }

  // porta selada ao fundo
  const doorZ = ROOM.z0;
  addBox(0.45, 2.9, 0.5, stoneMat, -1.4, 1.45, doorZ + 0.25);
  addBox(0.45, 2.9, 0.5, stoneMat, 1.4, 1.45, doorZ + 0.25);
  addBox(3.25, 0.45, 0.5, stoneMat, 0, 2.95, doorZ + 0.25);
  const doorMesh = addPlane(2.35, 2.7, lambert(woodTexture([2.35 / T, 2.7 / T])), 0, 1.35, doorZ + 0.03);
  const runeMat = new THREE.MeshBasicMaterial({ map: runeTexture(), transparent: true, alphaTest: 0.5, fog: false });
  const runeMesh = addPlane(1.5, 1.5, runeMat, 0, 1.45, doorZ + 0.06);
  // duas lâmpadas na verga: placa (esq.) e braseiro (dir.) — acendem quando cada parte do puzzle está feita
  const lampPlate = new THREE.MeshBasicMaterial({ color: LAMP_OFF, fog: false });
  const lampFire = new THREE.MeshBasicMaterial({ color: LAMP_OFF, fog: false });
  addPlane(0.2, 0.2, lampPlate, -0.5, 2.95, doorZ + 0.51);
  addPlane(0.2, 0.2, lampFire, 0.5, 2.95, doorZ + 0.51);

  // placa de pressão e piso rachado
  const plateTop = lambert(plateTexture());
  const plateSide = lambert(null, 0x3a3638);
  addBox(1.3, 0.07, 1.3, [plateSide, plateSide, plateTop, plateSide, plateSide, plateSide], -1.4, 0.035, -5);
  const crackMat = new THREE.MeshLambertMaterial({ map: crackTexture(), transparent: true, alphaTest: 0.5 });
  addPlane(1.7, 1.7, crackMat, 1.5, 0.015, -4.8, -Math.PI / 2);

  // braseiro apagado
  addBox(0.6, 0.8, 0.6, stoneMat, 2.9, 0.4, -9.2);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.32, 0.3, 8), lambert(null, 0x3a3a46));
  bowl.position.set(2.9, 0.95, -9.2);
  scene.add(bowl);
  const BOWL = new THREE.Vector3(2.9, 1.15, -9.2);
  const brazierFlame = new THREE.Sprite(new THREE.SpriteMaterial({ map: null, fog: false, alphaTest: 0.5 }));
  brazierFlame.scale.set(0.75, 0.6, 1);
  brazierFlame.position.set(BOWL.x, 1.45, BOWL.z);
  brazierFlame.visible = false;
  scene.add(brazierFlame);
  const brazierLight = new THREE.PointLight(0xff8a2a, 0, 0, 2);
  brazierLight.position.set(BOWL.x - 0.3, 1.9, BOWL.z + 0.4);
  scene.add(brazierLight);
  const coalMat = new THREE.MeshLambertMaterial({ color: 0x1c1516, emissive: 0x2a0b08 });
  for (let i = 0; i < 5; i++) {
    const coal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11), coalMat);
    coal.position.set(2.9 + Math.cos(i * 1.3) * 0.22, 1.12 + (i % 2) * 0.05, -9.2 + Math.sin(i * 1.3) * 0.22);
    scene.add(coal);
  }

  // nicho na parede direita com o item "escondido"
  const nz = -8.3;
  const nicheX = ROOM.x1 - 0.12;
  addBox(0.24, 1.4, 0.2, stoneMat, nicheX, 2.1, nz - 0.5);
  addBox(0.24, 1.4, 0.2, stoneMat, nicheX, 2.1, nz + 0.5);
  addBox(0.24, 0.2, 1.2, stoneMat, nicheX, 2.9, nz);
  addBox(0.24, 0.2, 1.2, stoneMat, nicheX, 1.3, nz);
  addPlane(0.8, 1.0, new THREE.MeshBasicMaterial({ color: 0x06050a }), ROOM.x1 - 0.01, 2.1, nz, 0, -Math.PI / 2);
  const gem = new THREE.Sprite(new THREE.SpriteMaterial({ map: gemTexture(), fog: false }));
  gem.scale.set(0.42, 0.42, 1);
  gem.position.set(ROOM.x1 - 0.3, 2.1, nz);
  scene.add(gem);
  const gemLight = new THREE.PointLight(0x4fe8ff, 9, 0, 2);
  gemLight.position.set(ROOM.x1 - 0.6, 2.1, nz);
  scene.add(gemLight);
  const sparkMat = new THREE.SpriteMaterial({ map: sparkTexture(), fog: false });
  const sparks = [0, 1, 2].map(() => {
    const s = new THREE.Sprite(sparkMat);
    s.scale.set(0.1, 0.1, 1);
    scene.add(s);
    return s;
  });

  // tochas
  const frames = flameFrames();
  const woodStick = lambert(null, 0x5a3a24);
  const torches: { sprite: THREE.Sprite; light: THREE.PointLight; phase: number }[] = [];
  const addTorch = (x: number, z: number, nx: number, nzDir: number, phase: number) => {
    const y = 1.8;
    addBox(Math.abs(nzDir) > 0 ? 0.2 : 0.08, 0.2, Math.abs(nx) > 0 ? 0.2 : 0.08, stoneMat, x, y - 0.05, z);
    addBox(0.1, 0.6, 0.1, woodStick, x + nx * 0.16, y + 0.12, z + nzDir * 0.16);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: frames[0], fog: false, alphaTest: 0.5 }));
    sprite.scale.set(0.38, 0.3, 1);
    sprite.position.set(x + nx * 0.16, y + 0.57, z + nzDir * 0.16);
    scene.add(sprite);
    const light = new THREE.PointLight(0xff9a3c, 42, 0, 2);
    light.position.set(x + nx * 0.45, y + 0.6, z + nzDir * 0.45);
    scene.add(light);
    torches.push({ sprite, light, phase });
  };
  addTorch(ROOM.x0 + 0.1, -1.5, 1, 0, 0);
  addTorch(ROOM.x1 - 0.1, -1.5, -1, 0, 1.7);
  addTorch(ROOM.x0 + 0.1, -7.6, 1, 0, 3.1);
  addTorch(-1.95, ROOM.z0 + 0.1, 0, 1, 4.4);
  addTorch(1.95, ROOM.z0 + 0.1, 0, 1, 5.2);

  // poeira flutuando
  const DUST = 70;
  const dustPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    dustPos[i * 3] = ROOM.x0 + 0.3 + Math.random() * (W - 0.6);
    dustPos[i * 3 + 1] = Math.random() * ROOM.h;
    dustPos[i * 3 + 2] = ROOM.z0 + 0.3 + Math.random() * (L - 0.6);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ color: 0xe0cfa8, size: 2, sizeAttenuation: false, transparent: true, opacity: 0.6, fog: false }),
  );
  scene.add(dust);

  const camera = new THREE.PerspectiveCamera(66, 1, 0.05, 40);
  camera.rotation.order = 'YXZ';
  scene.add(camera);
  // Luz presa à câmera, na cor da face escolhida: tinge de leve o que está perto.
  const accentLight = new THREE.PointLight(0x5be7ff, 5, 0, 2);
  accentLight.position.set(0.35, -0.3, -0.6);
  camera.add(accentLight);

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

  // ── regras físicas ──────────────────────────────────────────────────────
  // Cada face muda como o dado se comporta ao ser arremessado.
  const PHYS: Record<number, { speed: number; up: number; g: number; e: number; fr: number }> = {
    1: { speed: 11, up: 0.14, g: 14, e: 0.9, fr: 0.5 }, // Ricochete: leve e saltitante
    2: { speed: 6.5, up: 0.1, g: 30, e: 0.12, fr: 7 }, // Peso: cai e fica
    3: { speed: 8.5, up: 0.12, g: 16, e: 0.5, fr: 2.5 }, // Fogo: meio-termo
  };
  const R = 0.22;
  interface Box {
    min: THREE.Vector3;
    max: THREE.Vector3;
  }
  const mkBox = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box => ({
    min: new THREE.Vector3(x0, y0, z0),
    max: new THREE.Vector3(x1, y1, z1),
  });
  const PLATE = { x: -1.4, z: -5, half: 0.65, top: 0.07 };
  const BOXES: Box[] = [];
  for (const [x, z] of PILLARS) {
    BOXES.push(mkBox(x - 0.45, 0, z - 0.45, x + 0.45, ROOM.h, z + 0.45));
    BOXES.push(mkBox(x - 0.55, 0, z - 0.55, x + 0.55, 0.25, z + 0.55));
    BOXES.push(mkBox(x - 0.55, ROOM.h - 0.25, z - 0.55, x + 0.55, ROOM.h, z + 0.55));
  }
  BOXES.push(mkBox(PLATE.x - PLATE.half, 0, PLATE.z - PLATE.half, PLATE.x + PLATE.half, PLATE.top, PLATE.z + PLATE.half));
  BOXES.push(mkBox(2.6, 0, -9.5, 3.2, 0.8, -8.9)); // pedestal do braseiro
  BOXES.push(mkBox(-1.625, 0, -10, -1.175, 2.9, -9.5)); // batentes da porta
  BOXES.push(mkBox(1.175, 0, -10, 1.625, 2.9, -9.5));
  BOXES.push(mkBox(-1.625, 2.725, -10, 1.625, 3.175, -9.5));

  type DieState = 'hand' | 'flying' | 'rest';
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
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  // estado do puzzle
  let lit = false;
  let gemTaken = false;
  let plateDown = false;
  let doorOpen = 0;
  let doorAnnounced = false;
  let complete = false;
  const GEM = new THREE.Vector3(ROOM.x1 - 0.3, 2.1, nz);

  const caption = (title: string, sub: string, color: string) => opts.onCaption?.(title, sub, color);

  const collideBox = (b: Box, e: number): THREE.Vector3 | null => {
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

  const onPlate = () =>
    Math.abs(dieP.x - PLATE.x) < PLATE.half + 0.05 &&
    Math.abs(dieP.z - PLATE.z) < PLATE.half + 0.05 &&
    dieP.y < PLATE.top + R + 0.1;

  const stepDie = (dt: number) => {
    const ph = PHYS[thrownFace] ?? PHYS[1];
    dieV.y -= ph.g * dt;
    dieP.addScaledVector(dieV, dt);
    let ground = false;
    if (dieP.y < R) {
      dieP.y = R;
      if (dieV.y < 0) dieV.y = -dieV.y * ph.e;
      ground = true;
    }
    if (dieP.y > ROOM.h - R) {
      dieP.y = ROOM.h - R;
      if (dieV.y > 0) dieV.y = -dieV.y * ph.e;
    }
    if (dieP.x < ROOM.x0 + R) {
      dieP.x = ROOM.x0 + R;
      if (dieV.x < 0) dieV.x = -dieV.x * ph.e;
    } else if (dieP.x > ROOM.x1 - R) {
      dieP.x = ROOM.x1 - R;
      if (dieV.x > 0) dieV.x = -dieV.x * ph.e;
    }
    if (dieP.z < ROOM.z0 + R + 0.03) {
      dieP.z = ROOM.z0 + R + 0.03;
      if (dieV.z < 0) dieV.z = -dieV.z * ph.e;
    } else if (dieP.z > ROOM.z1 - R) {
      dieP.z = ROOM.z1 - R;
      if (dieV.z > 0) dieV.z = -dieV.z * ph.e;
    }
    for (const b of BOXES) {
      const n = collideBox(b, ph.e);
      if (n && n.y > 0.7) ground = true;
    }
    if (ground) {
      const k = Math.exp(-ph.fr * dt);
      dieV.x *= k;
      dieV.z *= k;
      if (Math.abs(dieV.y) < 0.6) dieV.y = 0;
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
      if (onPlate() && thrownFace !== 2) caption('Leve demais', 'Só o dado pesado afunda a placa.', '#d9a066');
    }
  };

  const recall = () => {
    if (dieState === 'hand') return;
    dieState = 'hand';
    worldDie.visible = false;
    handPop = 1;
  };

  const throwDie = () => {
    if (dieState !== 'hand' || complete) return;
    thrownFace = face;
    updateMats();
    const ph = PHYS[face] ?? PHYS[1];
    camera.getWorldDirection(fwdV);
    rightV.set(Math.cos(yaw), 0, -Math.sin(yaw));
    dieP.copy(camera.position).addScaledVector(fwdV, 0.55).addScaledVector(rightV, 0.2);
    dieP.y -= 0.18;
    dieV.copy(fwdV).multiplyScalar(ph.speed);
    dieV.y += ph.up * ph.speed;
    dieW.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14);
    worldDie.position.copy(dieP);
    worldDie.visible = true;
    dieState = 'flying';
    restTimer = 0;
  };

  const action = () => {
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
    applyFace(n);
    caption(`${n} · ${f.name}`, f.desc, f.color);
  };
  const cycleFace = (dir: number) => {
    let n = face;
    for (let i = 0; i < 6; i++) {
      n = ((n - 1 + dir + 6) % 6) + 1;
      if (FACES[n - 1].unlocked) break;
    }
    selectFace(n);
  };

  // ── tamanho / proporção ─────────────────────────────────────────────────
  let dieBaseY = -0.2;
  let dieScaleBase = 0.17;
  const resize = () => {
    // ~240 linhas na vertical: granulado, mas legível (celular e PC).
    const scale = Math.max(2, Math.round(window.innerHeight / 240));
    const w = Math.max(64, Math.ceil(window.innerWidth / scale));
    const h = Math.max(64, Math.ceil(window.innerHeight / scale));
    renderer.setSize(w, h, false);
    rt.setSize(w, h);
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
    dieGroup.position.set(Math.min(halfW * 0.4, 0.44), dieBaseY, -1);
  };
  resize();
  window.addEventListener('resize', resize);

  // ── entrada ─────────────────────────────────────────────────────────────
  // PC: WASD anda, arrastar o mouse olha, clique arremessa/recolhe, 1–6 ou a
  // roda do mouse trocam a face, R reinicia a sala.
  // Celular (horizontal): metade esquerda = analógico, direita = olhar; dois
  // botões na tela (arremessar/recolher e girar o dado) fazem o resto.
  let yaw = 0;
  let pitch = -0.04;
  const START = new THREE.Vector3(0, 1.6, 1.2);
  const pos = START.clone();
  const keys = new Set<string>();
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

  const onDown = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    if (e.pointerType !== 'mouse' && rx < 0.42 && stickId === -1) {
      stickId = e.pointerId;
      stickOx = e.clientX;
      stickOy = e.clientY;
      stickX = 0;
      stickY = 0;
      emitStick(true);
    } else if (lookId === -1) {
      lookId = e.pointerId;
      lastX = downX = e.clientX;
      lastY = downY = e.clientY;
      downT = performance.now();
      moved = false;
    } else {
      return;
    }
    canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerId === lookId) {
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      if (Math.hypot(dx, dy) > 8) moved = true;
      yaw -= (e.clientX - lastX) * 0.006;
      pitch = Math.max(-0.7, Math.min(0.7, pitch - (e.clientY - lastY) * 0.006));
      lastX = e.clientX;
      lastY = e.clientY;
    } else if (e.pointerId === stickId) {
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
    if (e.pointerId === lookId) {
      lookId = -1;
      // mouse: clique curto arremessa/recolhe (no celular são os botões)
      if (e.pointerType === 'mouse' && e.type === 'pointerup' && !moved && performance.now() - downT < 350) action();
    }
    if (e.pointerId === stickId) {
      stickId = -1;
      stickX = 0;
      stickY = 0;
      emitStick(false);
    }
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  const move = (dt: number) => {
    if (complete) return false;
    const kf = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0);
    const ks = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
    let fwd = kf - stickY;
    let str = ks + stickX;
    const len = Math.hypot(fwd, str);
    if (len > 1) {
      fwd /= len;
      str /= len;
    }
    const moving = len > 0.08;
    if (moving) {
      const sp = 2.6 * dt;
      pos.x += (-Math.sin(yaw) * fwd + Math.cos(yaw) * str) * sp;
      pos.z += (-Math.cos(yaw) * fwd - Math.sin(yaw) * str) * sp;
      const doorway = doorOpen > 0.85;
      pos.x = clamp(pos.x, ROOM.x0 + 0.6, ROOM.x1 - 0.6);
      if (pos.z < ROOM.z0 + 1.0) pos.x = clamp(pos.x, -1.0, 1.0);
      pos.z = clamp(pos.z, doorway ? ROOM.z0 - 0.8 : ROOM.z0 + 0.8, ROOM.z1 - 0.5);
      for (const [px, pz] of PILLARS) {
        const half = 0.75;
        const dx = pos.x - px;
        const dz = pos.z - pz;
        if (Math.abs(dx) < half && Math.abs(dz) < half) {
          if (half - Math.abs(dx) < half - Math.abs(dz)) pos.x = px + Math.sign(dx || 1) * half;
          else pos.z = pz + Math.sign(dz || 1) * half;
        }
      }
    }
    return moving;
  };

  const reset = () => {
    dieState = 'hand';
    worldDie.visible = false;
    dieGroup.visible = true;
    lit = false;
    brazierFlame.visible = false;
    brazierLight.intensity = 0;
    gemTaken = false;
    gem.visible = true;
    sparks.forEach((s) => (s.visible = true));
    plateDown = false;
    doorOpen = 0;
    doorAnnounced = false;
    complete = false;
    pos.copy(START);
    yaw = 0;
    pitch = -0.04;
    handPop = 1;
  };

  // ── loop ────────────────────────────────────────────────────────────────
  let raf = 0;
  let last = performance.now();
  let t = 0;
  let bob = 0;
  let emittedDie: DieState | null = null;
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;

    const moving = move(dt);
    if (moving) bob += dt * 9;
    const bobY = moving ? Math.sin(bob) * 0.04 : Math.sin(t * 1.3) * 0.012;
    camera.position.set(pos.x, pos.y + bobY, pos.z);
    camera.rotation.set(pitch, yaw, 0);

    // ── dado no mundo ──
    if (dieState === 'flying') {
      const n = Math.max(1, Math.ceil(dt / (1 / 120)));
      for (let i = 0; i < n && dieState === 'flying'; i++) stepDie(dt / n);
      worldDie.position.copy(dieP);
      const w = dieW.length();
      if (w > 1e-4) {
        tmpQ.setFromAxisAngle(tmpAxis.copy(dieW).normalize(), w * dt);
        worldDie.quaternion.premultiply(tmpQ);
      }
      if (!gemTaken && dieP.distanceTo(GEM) < 0.55) {
        gemTaken = true;
        gem.visible = false;
        gemLight.intensity = 0;
        sparks.forEach((s) => (s.visible = false));
        caption('Gema encontrada!', 'Só o ricochete chega num lugar desses.', '#6ff0ff');
      }
      if (!lit && thrownFace === 3 && dieP.distanceTo(BOWL) < 0.6) {
        lit = true;
        brazierFlame.visible = true;
        caption('O braseiro acendeu!', 'A lâmpada da direita brilha sobre a porta.', '#ff9a3c');
      }
    } else if (dieState === 'rest') {
      worldDie.quaternion.slerp(restQ, 1 - Math.exp(-dt * 12));
      worldDie.position.copy(dieP);
      const pressed = thrownFace === 2 && onPlate();
      if (pressed && !plateDown) caption('Placa acionada', 'O dado pesado segura a placa. Não o recolha.', '#ffd36b');
      plateDown = pressed;
      if (!pressed) {
        restReturn += dt;
        if (restReturn > 1.8) recall();
      }
    }
    if (dieState !== 'rest') plateDown = false;

    if (dieState !== emittedDie) {
      emittedDie = dieState;
      opts.onDie?.(dieState);
    }

    // ── porta, lâmpadas, braseiro ──
    const wantOpen = plateDown && lit ? 1 : 0;
    doorOpen += (wantOpen - doorOpen) * Math.min(1, dt * 2.4);
    doorMesh.position.y = 1.35 + doorOpen * 2.75;
    runeMesh.visible = doorOpen < 0.4;
    lampPlate.color.setHex(plateDown ? 0xffd36b : LAMP_OFF);
    lampFire.color.setHex(lit ? 0xff7a2e : LAMP_OFF);
    if (wantOpen && doorOpen > 0.9 && !doorAnnounced) {
      doorAnnounced = true;
      caption('A porta se abriu', 'Atravesse enquanto o dado segura a placa.', '#ffd36b');
    }
    if (!wantOpen) doorAnnounced = false;
    if (lit) {
      brazierFlame.material.map = frames[Math.floor(t * 8) % frames.length];
      brazierLight.intensity = 40 * (0.85 + 0.12 * Math.sin(t * 12) + 0.06 * Math.sin(t * 4.3));
    }
    if (!complete && doorOpen > 0.85 && pos.z < ROOM.z0 - 0.2) {
      complete = true;
      opts.onComplete?.({ gem: gemTaken });
    }

    torches.forEach((tc, i) => {
      tc.light.intensity = 42 * (0.86 + 0.12 * Math.sin(t * 13 + tc.phase) + 0.07 * Math.sin(t * 5.1 + tc.phase * 3));
      tc.sprite.material.map = frames[Math.floor(t * 8 + i) % frames.length];
    });
    if (!gemTaken) {
      gem.position.y = 2.1 + Math.sin(t * 2) * 0.04;
      gemLight.intensity = 9 + Math.sin(t * 3) * 2;
      sparks.forEach((s, i) => {
        const a = t * 1.5 + i * 2.1;
        s.position.set(ROOM.x1 - 0.3 + Math.sin(a * 0.7) * 0.06, 2.1 + Math.sin(a) * 0.32, nz + Math.cos(a) * 0.32);
        s.material.rotation = a;
      });
    }
    const k = 0.75 + Math.sin(t * 2.5) * 0.25;
    runeMat.color.setRGB(k, k * 0.8, k * 0.85);

    const arr = dustGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < DUST; i++) {
      arr[i * 3 + 1] += dt * (0.03 + (i % 5) * 0.012);
      arr[i * 3] += Math.sin(t * 0.4 + i) * dt * 0.03;
      if (arr[i * 3 + 1] > ROOM.h) arr[i * 3 + 1] = 0;
    }
    dustGeo.attributes.position.needsUpdate = true;

    // dado na mão: gira até a face escolhida, balança e "pulsa" ao voltar
    handPop = Math.max(0, handPop - dt * 4);
    dieGroup.scale.setScalar(dieScaleBase * (1 + handPop * 0.3));
    spin += dt * 0.8;
    handDim += ((dieState === 'hand' ? 0 : 1) - handDim) * Math.min(1, dt * 8);
    updateMats();
    computeTarget(face, spin);
    curQ.slerp(targetQ, 1 - Math.exp(-dt * 9));
    wobble.setFromEuler(wobbleEuler.set(Math.sin(t * 1.1) * 0.012, 0, Math.sin(t * 0.8) * 0.012));
    dieHolder.quaternion.copy(curQ).multiply(wobble);
    dieGroup.position.y = dieBaseY + Math.sin(t * 1.6) * 0.012 + (moving ? Math.sin(bob + 1) * 0.012 : 0);
    dieCam.position.set(0, 0, 0);

    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(scene, camera);
    if (dieGroup.visible) {
      renderer.clearDepth();
      renderer.render(dieScene, dieCam);
    }
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  // Só em desenvolvimento: gancho pra testes automatizados (não vai pro build).
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__mdd = {
      state: () => ({ dieState, face, lit, plateDown, doorOpen, gemTaken, complete, x: pos.x, z: pos.z }),
      place: (x: number, z: number, y: number, p: number) => {
        pos.set(x, 1.6, z);
        yaw = y;
        pitch = p;
      },
      face: (n: number) => selectFace(n),
      act: () => action(),
      reset: () => reset(),
    };
  }

  return {
    action,
    rotate: () => cycleFace(1),
    reset,
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      renderer.dispose();
      rt.dispose();
    },
  };
}
