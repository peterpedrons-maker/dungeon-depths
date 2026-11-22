// Cena 3D em primeira pessoa. O truque do visual "pixelado 3D": a cena é
// renderizada num alvo de baixíssima resolução (~180-250 linhas), passa por um
// shader que reduz as cores e aplica dithering ordenado (Bayer 4x4), e o canvas
// é ampliado sem suavização pelo CSS.

import * as THREE from 'three';
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
}

export interface SceneApi {
  setFace(n: number): void;
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
  addPlane(2.35, 2.7, lambert(woodTexture([2.35 / T, 2.7 / T])), 0, 1.35, doorZ + 0.03);
  const runeMat = new THREE.MeshBasicMaterial({ map: runeTexture(), transparent: true, alphaTest: 0.5, fog: false });
  addPlane(1.5, 1.5, runeMat, 0, 1.45, doorZ + 0.06);

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

  // ── o dado (cena separada, desenhada por cima da sala) ──────────────────
  // Obsidiana com gemas no lugar dos pontos (cada face com a cor da sua
  // habilidade; as bloqueadas ficam apagadas) e uma armação de latão.
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

  const dieMats = DIE_FACES.map((n) => {
    const f = FACES[n - 1];
    return new THREE.MeshLambertMaterial({
      map: dieFaceTexture(n, f.color, !f.unlocked),
      emissive: 0xffffff,
      emissiveMap: dieGlowTexture(n, f.color, !f.unlocked),
      emissiveIntensity: 0.55,
    });
  });
  dieHolder.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), dieMats));

  const brass = new THREE.MeshLambertMaterial({ color: 0xb8943f, emissive: 0x1c1405, flatShading: true });
  const brassLight = new THREE.MeshLambertMaterial({ color: 0xd8b458, emissive: 0x241a06, flatShading: true });
  const BAR = 0.11;
  for (let a = 0; a < 3; a++) {
    const b = (a + 1) % 3;
    const c = (a + 2) % 3;
    for (const sb of [-0.5, 0.5]) {
      for (const sc of [-0.5, 0.5]) {
        const size: [number, number, number] = [BAR, BAR, BAR];
        size[a] = 1 + BAR;
        const bar = new THREE.Mesh(new THREE.BoxGeometry(...size), brass);
        const p: [number, number, number] = [0, 0, 0];
        p[b] = sb;
        p[c] = sc;
        bar.position.set(...p);
        dieHolder.add(bar);
      }
    }
  }
  for (const sx of [-0.5, 0.5]) {
    for (const sy of [-0.5, 0.5]) {
      for (const sz of [-0.5, 0.5]) {
        const corner = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.19, 0.19), brassLight);
        corner.position.set(sx, sy, sz);
        dieHolder.add(corner);
      }
    }
  }

  const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.55, -0.78, 0.04));
  const targetQ = new THREE.Quaternion();
  const curQ = new THREE.Quaternion();
  const wobble = new THREE.Quaternion();
  const wobbleEuler = new THREE.Euler();
  const applyFace = (n: number) => {
    const [x, y, z] = FACE_EULER[n] ?? FACE_EULER[1];
    targetQ.copy(tilt).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)));
    dieMats.forEach((m, i) => {
      m.emissiveIntensity = DIE_FACES[i] === n ? 1.5 : 0.55;
    });
    accentLight.color.set(FACES[n - 1]?.color ?? '#ffffff');
  };
  applyFace(1);
  curQ.copy(targetQ);

  // ── tamanho / proporção ─────────────────────────────────────────────────
  let dieBaseY = -0.2;
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
    dieGroup.scale.setScalar(Math.min(0.17, halfW * 0.5));
    dieBaseY = aspect < 1 ? -0.13 : -0.2;
    dieGroup.position.set(Math.min(halfW * 0.6, 0.62), dieBaseY, -1);
  };
  resize();
  window.addEventListener('resize', resize);

  // ── entrada ─────────────────────────────────────────────────────────────
  // PC: WASD anda, arrastar o mouse olha.
  // Celular (horizontal): dedo na metade esquerda = analógico pra andar,
  // dedo na direita = olhar.
  let yaw = 0;
  let pitch = -0.04;
  const pos = new THREE.Vector3(0, 1.6, 1.2);
  const keys = new Set<string>();
  const onKeyDown = (e: KeyboardEvent) => keys.add(e.key.toLowerCase());
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  let lookId = -1;
  let stickId = -1;
  let lastX = 0;
  let lastY = 0;
  let stickOx = 0;
  let stickOy = 0;
  let stickX = 0;
  let stickY = 0;
  const STICK_R = 52;
  const emitStick = (active: boolean) => opts.onStick?.({ active, ox: stickOx, oy: stickOy, x: stickX, y: stickY });

  const onDown = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const leftZone = e.clientX < rect.left + rect.width * 0.42;
    if (e.pointerType !== 'mouse' && leftZone && stickId === -1) {
      stickId = e.pointerId;
      stickOx = e.clientX;
      stickOy = e.clientY;
      stickX = 0;
      stickY = 0;
      emitStick(true);
    } else if (lookId === -1) {
      lookId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
    } else {
      return;
    }
    canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerId === lookId) {
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
    if (e.pointerId === lookId) lookId = -1;
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
      pos.x = Math.max(ROOM.x0 + 0.6, Math.min(ROOM.x1 - 0.6, pos.x));
      pos.z = Math.max(ROOM.z0 + 0.8, Math.min(ROOM.z1 - 0.5, pos.z));
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

  // ── loop ────────────────────────────────────────────────────────────────
  let raf = 0;
  let last = performance.now();
  let t = 0;
  let bob = 0;
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;

    const moving = move(dt);
    if (moving) bob += dt * 9;
    const bobY = moving ? Math.sin(bob) * 0.04 : Math.sin(t * 1.3) * 0.012;
    camera.position.set(pos.x, pos.y + bobY, pos.z);
    camera.rotation.set(pitch, yaw, 0);

    torches.forEach((tc, i) => {
      tc.light.intensity = 42 * (0.86 + 0.12 * Math.sin(t * 13 + tc.phase) + 0.07 * Math.sin(t * 5.1 + tc.phase * 3));
      tc.sprite.material.map = frames[Math.floor(t * 8 + i) % frames.length];
    });
    gem.position.y = 2.1 + Math.sin(t * 2) * 0.04;
    gemLight.intensity = 9 + Math.sin(t * 3) * 2;
    sparks.forEach((s, i) => {
      const a = t * 1.5 + i * 2.1;
      s.position.set(ROOM.x1 - 0.3 + Math.sin(a * 0.7) * 0.06, 2.1 + Math.sin(a) * 0.32, nz + Math.cos(a) * 0.32);
      s.material.rotation = a;
    });
    const k = 0.75 + Math.sin(t * 2.5) * 0.25;
    runeMat.color.setRGB(k, k * 0.8, k * 0.85);

    const arr = dustGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < DUST; i++) {
      arr[i * 3 + 1] += dt * (0.03 + (i % 5) * 0.012);
      arr[i * 3] += Math.sin(t * 0.4 + i) * dt * 0.03;
      if (arr[i * 3 + 1] > ROOM.h) arr[i * 3 + 1] = 0;
    }
    dustGeo.attributes.position.needsUpdate = true;

    // dado flutuando: gira até a face escolhida, com um balanço suave
    curQ.slerp(targetQ, 1 - Math.exp(-dt * 10));
    wobble.setFromEuler(wobbleEuler.set(Math.sin(t * 1.1) * 0.05, Math.sin(t * 0.8) * 0.08, 0));
    dieHolder.quaternion.copy(curQ).multiply(wobble);
    dieGroup.position.y = dieBaseY + Math.sin(t * 1.6) * 0.012 + (moving ? Math.sin(bob + 1) * 0.012 : 0);
    dieCam.position.set(0, 0, 0);

    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.clearDepth();
    renderer.render(dieScene, dieCam);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return {
    setFace(n) {
      applyFace(n);
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      renderer.dispose();
      rt.dispose();
    },
  };
}
