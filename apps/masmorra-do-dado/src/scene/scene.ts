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
  doorTexture,
  markTexture,
  MARK_COUNT,
  soapSideTexture,
  soapTipTexture,
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
  onSymbol?: (glyph: string) => void;
}

export interface SceneApi {
  action(): void; // arremessa ou recolhe
  place(): void; // posiciona o dado com cuidado onde a mira aponta
  rotate(): void; // próxima face
  reset(): void;
  mark(): void; // risca o símbolo atual onde a mira aponta
  nextSymbol(): void;
  eraseAimed(): void; // apaga a marca mais próxima da mira
  eraseAll(): void; // pede confirmação (aperte de novo)
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

  // sala (com textura de profundidade, usada pro contorno) e dado/pedra do HUD
  const rt = new THREE.WebGLRenderTarget(64, 64, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.HalfFloatType,
    depthTexture: new THREE.DepthTexture(64, 64),
  });
  const rtHud = new THREE.WebGLRenderTarget(64, 64, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.HalfFloatType,
  });
  const CAM_NEAR = 0.1;
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

  // ── sala ────────────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(FOG, 4, 19);
  scene.add(new THREE.AmbientLight(0x7a78b8, 1.9));

  const W = ROOM.x1 - ROOM.x0;
  const L = ROOM.z1 - ROOM.z0;
  const T = 1.2;

  const markSurfaces: THREE.Object3D[] = []; // onde dá pra riscar com a pedra-sabão
  const addPlane = (w: number, h: number, mat: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    scene.add(m);
    markSurfaces.push(m);
    return m;
  };

  addPlane(W, L, lambert(floorTexture([W / T, L / T])), 0, 0, (ROOM.z0 + ROOM.z1) / 2, -Math.PI / 2);
  addPlane(W, L, lambert(brickTexture([W / T, L / T], 0.8, 17)), 0, ROOM.h, (ROOM.z0 + ROOM.z1) / 2, Math.PI / 2);
  addPlane(W, ROOM.h, lambert(brickTexture([W / T, ROOM.h / T], 1, 23)), 0, ROOM.h / 2, ROOM.z1, 0, Math.PI);
  addPlane(L, ROOM.h, lambert(brickTexture([L / T, ROOM.h / T], 1, 31)), ROOM.x0, ROOM.h / 2, (ROOM.z0 + ROOM.z1) / 2, 0, Math.PI / 2);
  addPlane(L, ROOM.h, lambert(brickTexture([L / T, ROOM.h / T], 1, 37)), ROOM.x1, ROOM.h / 2, (ROOM.z0 + ROOM.z1) / 2, 0, -Math.PI / 2);

  const stoneMat = lambert(brickTexture([1, 1], 0.9, 41));
  const addBox = (w: number, h: number, d: number, mat: THREE.Material | THREE.Material[], x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    scene.add(m);
    markSurfaces.push(m);
    return m;
  };

  for (const [x, z] of PILLARS) {
    const pillarMat = lambert(brickTexture([0.75, 2.7], 0.95, 50 + Math.abs(x * z)));
    addBox(0.9, ROOM.h, 0.9, pillarMat, x, ROOM.h / 2, z);
    addBox(1.1, 0.25, 1.1, stoneMat, x, 0.125, z);
    addBox(1.1, 0.25, 1.1, stoneMat, x, ROOM.h - 0.125, z);
  }

  // porta selada ao fundo: arco de pedra, laje de madeira que sobe pra dentro
  // da parede e um corredor atrás
  const DW = 0.95; // meia-largura da abertura
  const DH = 1.7; // altura da parte reta (o arco começa aqui)
  const doorZ = ROOM.z0;
  const archTop = DH + DW;
  {
    // parede do fundo: um único contorno com o "entalhe" do arco
    const wall = new THREE.Shape();
    wall.moveTo(ROOM.x0, 0);
    wall.lineTo(-DW, 0);
    wall.lineTo(-DW, DH);
    wall.absarc(0, DH, DW, Math.PI, 0, true);
    wall.lineTo(DW, 0);
    wall.lineTo(ROOM.x1, 0);
    wall.lineTo(ROOM.x1, ROOM.h);
    wall.lineTo(ROOM.x0, ROOM.h);
    wall.closePath();
    const wm = new THREE.Mesh(new THREE.ShapeGeometry(wall, 12), lambert(brickTexture([1 / T, 1 / T])));
    wm.position.z = doorZ;
    scene.add(wm);
    markSurfaces.push(wm);

    // aro de pedra em volta da abertura, saindo 0,3 m da parede
    const R2 = DW + 0.3;
    const ring = new THREE.Shape();
    ring.moveTo(-R2, 0);
    ring.lineTo(-R2, DH);
    ring.absarc(0, DH, R2, Math.PI, 0, true);
    ring.lineTo(R2, 0);
    ring.lineTo(DW, 0);
    ring.lineTo(DW, DH);
    ring.absarc(0, DH, DW, 0, Math.PI, false);
    ring.lineTo(-DW, 0);
    ring.closePath();
    const rm = new THREE.Mesh(
      new THREE.ExtrudeGeometry(ring, { depth: 0.3, bevelEnabled: false, curveSegments: 12 }),
      lambert(brickTexture([1 / 0.9, 1 / 0.9], 1.05, 61)),
    );
    rm.position.z = doorZ;
    scene.add(rm);
    markSurfaces.push(rm);
    // pedra-chave com um soquete
    addBox(0.4, 0.38, 0.36, stoneMat, 0, DH + DW + 0.15, doorZ + 0.18);
  }
  // laje da porta (atrás da parede, só aparece pela abertura)
  const doorGroup = new THREE.Group();
  doorGroup.position.z = doorZ - 0.13;
  {
    const slab = new THREE.Shape();
    slab.moveTo(-DW - 0.08, 0);
    slab.lineTo(-DW - 0.08, DH);
    slab.absarc(0, DH, DW + 0.08, Math.PI, 0, true);
    slab.lineTo(DW + 0.08, 0);
    slab.closePath();
    const tex = doorTexture();
    // a textura cobre 1,9 x 2,7 m: ajusta o UV (que é a posição em metros)
    tex.repeat.set(1 / (2 * DW + 0.16), 1 / 2.7);
    tex.offset.set(0.5, 0);
    const slabMesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(slab, { depth: 0.09, bevelEnabled: false, curveSegments: 12 }),
      [lambert(tex, 0xb4a496), lambert(null, 0x4a3320)],
    );
    doorGroup.add(slabMesh);
  }
  const runeMat = new THREE.MeshBasicMaterial({ map: runeTexture(), transparent: true, alphaTest: 0.5, fog: false });
  const runeMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), runeMat);
  runeMesh.position.set(0, 1.43, 0.1);
  doorGroup.add(runeMesh);
  scene.add(doorGroup);
  // corredor atrás da porta
  {
    const cLen = 3.2;
    const cm = lambert(brickTexture([cLen / T, archTop / T], 0.85, 71));
    const ceilM = lambert(brickTexture([2 * DW / T, cLen / T], 0.7, 72));
    const floorM = lambert(floorTexture([2 * DW / T, cLen / T]));
    addPlane(cLen, archTop, cm, -DW, archTop / 2, doorZ - cLen / 2, 0, Math.PI / 2);
    addPlane(cLen, archTop, cm, DW, archTop / 2, doorZ - cLen / 2, 0, -Math.PI / 2);
    addPlane(2 * DW, cLen, ceilM, 0, archTop, doorZ - cLen / 2, Math.PI / 2);
    addPlane(2 * DW, cLen, floorM, 0, 0, doorZ - cLen / 2, -Math.PI / 2);
  }
  const exitGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(2 * DW, archTop),
    new THREE.MeshBasicMaterial({ color: 0xfff0c8, fog: false }),
  );
  exitGlow.position.set(0, archTop / 2, doorZ - 3.2);
  scene.add(exitGlow);
  const corridorLight = new THREE.PointLight(0xffe2b0, 0, 0, 2);
  corridorLight.position.set(0, 1.9, doorZ - 1.4);
  scene.add(corridorLight);
  // duas gemas no aro: placa (esq.) e braseiro (dir.) — acendem quando cada parte do puzzle está feita
  const lampPlate = new THREE.MeshBasicMaterial({ color: LAMP_OFF, fog: false });
  const lampFire = new THREE.MeshBasicMaterial({ color: LAMP_OFF, fog: false });
  const lampBack = new THREE.MeshBasicMaterial({ color: 0x120f18 });
  for (const [x, mat] of [[-0.62, lampPlate], [0.62, lampFire]] as [number, THREE.Material][]) {
    const y = DH + Math.sqrt((DW + 0.15) ** 2 - x * x);
    const back = new THREE.Mesh(new THREE.CircleGeometry(0.17, 4), lampBack);
    back.position.set(x, y, doorZ + 0.305);
    scene.add(back);
    const g = new THREE.Mesh(new THREE.CircleGeometry(0.12, 4), mat);
    g.position.set(x, y, doorZ + 0.31);
    scene.add(g);
  }

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
  markSurfaces.push(bowl);
  const BOWL = new THREE.Vector3(2.9, 1.15, -9.2);
  const brazierFlame = new THREE.Sprite(new THREE.SpriteMaterial({ map: null, fog: false, alphaTest: 0.5, depthWrite: false }));
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
  const sparkMat = new THREE.SpriteMaterial({ map: sparkTexture(), fog: false, depthWrite: false });
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
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
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
    new THREE.PointsMaterial({ color: 0xe0cfa8, size: 2, sizeAttenuation: false, transparent: true, opacity: 0.6, fog: false, depthWrite: false }),
  );
  scene.add(dust);

  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  let yaw = 0;
  const camera = new THREE.PerspectiveCamera(66, 1, CAM_NEAR, CAM_FAR);
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

  // ── pedra-sabão (mão esquerda) ──────────────────────────────────────────
  // Um bastão verde-acinzentado com a ponta de escrever coberta de pó branco.
  // Infinita por enquanto: cada toque risca um símbolo onde a mira aponta.
  const soapMats = [
    soapSideTexture(true),
    soapSideTexture(true),
    soapSideTexture(false),
    soapSideTexture(false),
    soapTipTexture(true),
    soapTipTexture(false),
  ].map(
    (map) =>
      new THREE.MeshLambertMaterial({ map, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.22 }),
  );
  const soapGroup = new THREE.Group();
  const soapHolder = new THREE.Group();
  soapHolder.add(new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.5, 1.45, 3, 0.13), soapMats));
  soapGroup.add(soapHolder);
  dieScene.add(soapGroup);
  const SOAP_ROT = new THREE.Euler(-0.95, 0.55, 0.5);
  soapHolder.rotation.copy(SOAP_ROT);
  let soapKick = 0;

  // símbolos de giz: ✕ ○ ↑ △ ✓
  const GLYPHS = ['✕', '○', '↑', '△', '✓'];
  const markMats = Array.from({ length: MARK_COUNT }, (_, i) => {
    const m = new THREE.MeshLambertMaterial({
      map: markTexture(i),
      transparent: true,
      alphaTest: 0.5,
      depthWrite: false,
      emissive: 0x55555c,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    return m;
  });
  const markGeo = new THREE.PlaneGeometry(0.62, 0.62);
  const marks: THREE.Mesh[] = [];
  const MAX_MARKS = 60;
  let symbol = 0;
  let eraseArmed = 0; // segundos restantes pra confirmar "apagar tudo"
  const ray = new THREE.Raycaster();
  const ndc0 = new THREE.Vector2(0, 0);

  const nextSymbol = () => {
    symbol = (symbol + 1) % MARK_COUNT;
    opts.onSymbol?.(GLYPHS[symbol]);
  };
  opts.onSymbol?.(GLYPHS[symbol]);

  const mark = () => {
    soapKick = 1;
    camera.updateMatrixWorld();
    ray.setFromCamera(ndc0, camera);
    ray.far = 4.5;
    const hit = ray.intersectObjects(markSurfaces, false)[0];
    if (!hit || !hit.face) {
      caption('Longe demais', 'Chegue perto de uma parede ou do chão.', '#cfc6e8');
      return;
    }
    const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    const m = new THREE.Mesh(markGeo, markMats[symbol]);
    m.position.copy(hit.point).addScaledVector(n, 0.012);
    if (Math.abs(n.y) > 0.6) m.up.set(-Math.sin(yaw), 0, -Math.cos(yaw)); // no chão: "pra cima" = pra frente
    m.lookAt(m.position.clone().add(n));
    scene.add(m);
    marks.push(m);
    if (marks.length > MAX_MARKS) scene.remove(marks.shift()!);
  };

  const eraseAimed = () => {
    soapKick = 1;
    camera.updateMatrixWorld();
    const fwd = camera.getWorldDirection(new THREE.Vector3());
    let best: THREE.Mesh | null = null;
    let bestA = 0.16; // ~9°
    for (const m of marks) {
      const to = m.position.clone().sub(camera.position);
      const dist = to.length();
      if (dist > 7) continue;
      const a = Math.acos(clamp(to.divideScalar(dist).dot(fwd), -1, 1));
      if (a < bestA) {
        bestA = a;
        best = m;
      }
    }
    if (!best) {
      caption('Nenhuma marca na mira', 'Aponte pra uma marca para apagá-la.', '#cfc6e8');
      return;
    }
    scene.remove(best);
    marks.splice(marks.indexOf(best), 1);
  };

  const eraseAll = () => {
    if (marks.length === 0) {
      caption('Sem marcas', 'Não há nada pra apagar.', '#cfc6e8');
      return;
    }
    if (eraseArmed <= 0) {
      eraseArmed = 2;
      caption('Apagar todas as marcas?', 'Aperte de novo para confirmar.', '#ff9aa8');
      return;
    }
    eraseArmed = 0;
    const n = marks.length;
    marks.forEach((m) => scene.remove(m));
    marks.length = 0;
    soapKick = 1;
    caption('Marcas apagadas', `${n} ${n === 1 ? 'marca removida' : 'marcas removidas'}.`, '#cfc6e8');
  };

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
  BOXES.push(mkBox(-1.25, 0, -10, -0.95, archTop, -9.7)); // aro da porta
  BOXES.push(mkBox(0.95, 0, -10, 1.25, archTop, -9.7));
  BOXES.push(mkBox(-1.25, archTop - 0.3, -10, 1.25, ROOM.h, -9.7));

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
    dieThrown = true;
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

  // Posicionar: em vez de arremessar, o jogador coloca o dado com cuidado no ponto
  // que a mira aponta (alcance curto). Serve pra apertar placa e acender o braseiro
  // com precisão — mas o dado "posicionado" não pega a gema escondida: pra ela
  // ainda é preciso arremessar (ricochete).
  const PLACE_RANGE = 3.2;
  const aimPoint = (): { p: THREE.Vector3; n: THREE.Vector3 } | null => {
    camera.updateMatrixWorld();
    ray.setFromCamera(ndc0, camera);
    ray.far = PLACE_RANGE;
    const hit = ray.intersectObjects(markSurfaces, false)[0];
    if (!hit || !hit.face) return null;
    return { p: hit.point, n: hit.face.normal.clone().transformDirection(hit.object.matrixWorld) };
  };
  const placeDie = () => {
    if (dieState !== 'hand' || complete) return;
    const a = aimPoint();
    if (!a) {
      caption('Longe demais', 'Aponte para o chão ou uma superfície mais perto.', '#cfc6e8');
      return;
    }
    thrownFace = face;
    dieThrown = false;
    updateMats();
    dieP.copy(a.p).addScaledVector(a.n, R + 0.02);
    dieP.x = clamp(dieP.x, ROOM.x0 + R, ROOM.x1 - R);
    dieP.z = clamp(dieP.z, ROOM.z0 + R + 0.04, ROOM.z1 - R);
    dieV.set(0, 0, 0);
    dieW.set(0, 0, 0);
    worldDie.position.copy(dieP);
    worldDie.quaternion.setFromAxisAngle(tmpAxis.set(0, 1, 0), Math.random() * Math.PI * 2);
    worldDie.visible = true;
    dieState = 'flying';
    restTimer = 0;
  };

  const place = () => {
    if (dieState === 'hand') placeDie();
    else recall();
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
  const soapBase = new THREE.Vector3(-0.4, -0.15, -1);
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
    soapGroup.scale.setScalar(dieScaleBase * 0.95);
    dieBaseY = aspect < 1 ? -0.12 : -0.16;
    dieGroup.position.set(Math.min(halfW * 0.4, 0.44), dieBaseY, -1);
    soapBase.set(-Math.min(halfW * 0.4, 0.44), dieBaseY + 0.02, -1);
    soapGroup.position.copy(soapBase);
  };
  resize();
  window.addEventListener('resize', resize);

  // ── entrada ─────────────────────────────────────────────────────────────
  // PC: WASD anda, arrastar o mouse olha, clique arremessa/recolhe, 1–6 ou a
  // roda do mouse trocam a face, R reinicia a sala.
  // Celular (horizontal): metade esquerda = analógico, direita = olhar; dois
  // botões na tela (arremessar/recolher e girar o dado) fazem o resto.
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
    else if (k === 'g') place();
    else if (k === 'q') mark();
    else if (k === 'c') nextSymbol();
    else if (k === 'z') eraseAimed();
    else if (k === 'x') eraseAll();
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
    if (e.pointerType === 'mouse' && e.button === 2) {
      place(); // botão direito do mouse
      return;
    }
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
  const onContext = (e: Event) => e.preventDefault();
  canvas.addEventListener('contextmenu', onContext);
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
      const through = doorOpen > 0.85 && Math.abs(pos.x) < 0.75;
      pos.x = clamp(pos.x, ROOM.x0 + 0.6, ROOM.x1 - 0.6);
      if (pos.z < ROOM.z0 + 0.8) pos.x = clamp(pos.x, -0.7, 0.7); // dentro da porta
      pos.z = clamp(pos.z, through ? ROOM.z0 - 2.2 : ROOM.z0 + 0.8, ROOM.z1 - 0.5);
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
      if (!gemTaken && dieThrown && dieP.distanceTo(GEM) < 0.55) {
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
    doorGroup.position.y = doorOpen * (archTop + 0.2);
    runeMesh.visible = doorOpen < 0.5;
    corridorLight.intensity = doorOpen * 28;
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

    // fantasma de onde o dado seria posicionado
    const aim = dieState === 'hand' && !complete ? aimPoint() : null;
    ghost.visible = !!aim;
    if (aim) {
      ghost.position.copy(aim.p).addScaledVector(aim.n, R + 0.02);
      ghost.rotation.y = t * 0.8;
      ghostMat.color.copy(accentLight.color);
    }

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

    // pedra-sabão: balança de leve e dá um "risco" no ar quando usada
    soapKick = Math.max(0, soapKick - dt * 3.5);
    eraseArmed = Math.max(0, eraseArmed - dt);
    const kk = Math.sin(soapKick * Math.PI);
    soapGroup.position.set(
      soapBase.x + kk * 0.2,
      soapBase.y + Math.sin(t * 1.4 + 1.3) * 0.012 + kk * 0.09 + (moving ? Math.sin(bob) * 0.012 : 0),
      soapBase.z,
    );
    soapHolder.rotation.set(SOAP_ROT.x + kk * 0.5, SOAP_ROT.y + Math.sin(t * 0.9) * 0.05 + kk * 0.3, SOAP_ROT.z + Math.sin(t * 1.1) * 0.03);

    renderer.setRenderTarget(rt);
    renderer.setClearColor(FOG, 1);
    renderer.clear();
    renderer.render(scene, camera);
    // dado e pedra-sabão do HUD: alvo à parte (fundo transparente), colado por cima no pós-processo
    renderer.setRenderTarget(rtHud);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(dieScene, dieCam);
    renderer.setClearColor(FOG, 1);
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
      mark: () => mark(),
      put: () => place(),
      marks: () => marks.length,
      act: () => action(),
      reset: () => reset(),
    };
  }

  return {
    action,
    rotate: () => cycleFace(1),
    place,
    reset,
    mark,
    nextSymbol,
    eraseAimed,
    eraseAll,
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
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
