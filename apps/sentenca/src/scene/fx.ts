// EFEITOS DE VIDA (DESIGN.md §100): o feixe de luz que se vê no ar, a poeira fina dentro dele, a fumaça das tochas, a mariposa na chama. Tudo
// aqui é animado NO SHADER (a placa de vídeo move cada grão a partir de um relógio só, `fxClock`): não há conta por grão no processador nem
// envio de posições a cada quadro, e cada efeito é um desenho só.
//
// Regras (DIRECAO_DE_ARTE.md §4.8): poeira só dentro da luz, nunca no ar todo; nada disto ilumina, tapa ou aponta coisa de puzzle.
import * as THREE from 'three';

// o relógio comum (segundos): o `Kit.tick` o acerta a cada quadro
export const fxClock = { value: 0 };
// a altura da imagem do jogo em pixels (o motor a acerta): para um tufo de fumaça ter o tamanho certo em metros
export const fxView = { value: 270 };
// quanta luz o mundo tem agora (1 = normal; ~0,08 = o ESCURO da Casa): os feixes, a poeira e as mariposas apagam junto (o `Kit.tick` acerta)
export const fxDim = { value: 1 };
// os olhos do jogador, no mundo (o motor os acerta): os bichos sabem a que distância ele está
export const fxEye = new THREE.Vector3();

// a névoa da sala apaga os efeitos de longe (são somados: sem isto um feixe a 30 m brilharia através da névoa)
const FOG_PARS = 'uniform float fogNear; uniform float fogFar;';
const fogFade = (depth: string) => `(1.0 - smoothstep(fogNear, fogFar, ${depth}))`;
const withFog = (u: Record<string, THREE.IUniform>) => THREE.UniformsUtils.merge([THREE.UniformsLib.fog, u]);
const share = (m: THREE.ShaderMaterial) => {
  m.uniforms.uT = fxClock; // (o `merge` copia os valores: o relógio tem de ser o MESMO objeto em todos)
  if (m.uniforms.uH) m.uniforms.uH = fxView;
  if (m.uniforms.uDim) m.uniforms.uDim = fxDim;
  return m;
};

// dois eixos perpendiculares a uma direção (para espalhar em volta dela)
function axes(dir: THREE.Vector3) {
  const d = dir.clone().normalize();
  const ref = Math.abs(d.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const side = ref.clone().cross(d).normalize();
  const up = d.clone().cross(side).normalize();
  return { side, up };
}

// ── O FEIXE ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// A luz que se vê no ar, de `from` (a abertura, raio r0) a `to` (onde ela bate, raio r1). É um tubo SOMADO por cima da cena, sem gravar
// profundidade: forte no meio e sumindo nas bordas (pelo ângulo com o olhar), mais forte em cima que embaixo, com listras que andam devagar
// (a luz passando por poeira desigual). É fraco de propósito: o pontilhado e a paleta do pós-processo o desfazem em degraus de pixel. (O
// cone de antes, de cor chapada, virava uma coluna cinza sólida.)
export function lightShaft(parent: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3, r0: number, r1: number, color = 0xc8d8ff, strength = 0.085) {
  const dir = to.clone().sub(from);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(r0, r1, len, 28, 1, true);
  const mat = share(
    new THREE.ShaderMaterial({
      uniforms: withFog({ uT: { value: 0 }, uDim: { value: 1 }, uColor: { value: new THREE.Color(color) }, uK: { value: strength }, uLen: { value: len } }),
      vertexShader: `
        ${FOG_PARS}
        uniform float uLen;
        varying vec3 vN; varying vec3 vV; varying float vH; varying float vA; varying float vFog;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalMatrix * normal;
          vV = -mv.xyz;
          vH = 0.5 - position.y / uLen; // 0 na abertura, 1 onde bate
          vA = uv.x;
          vFog = ${fogFade('-mv.z')};
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform float uT; uniform vec3 uColor; uniform float uK; uniform float uDim;
        varying vec3 vN; varying vec3 vV; varying float vH; varying float vA; varying float vFog;
        void main(){
          float e = abs(dot(normalize(vN), normalize(vV)));
          e = e * e * (0.35 + 0.65 * e); // a borda some: só o miolo do feixe pesa
          float a = vA * 6.2832;
          float streak = 0.74 + 0.26 * sin(a * 5.0 + sin(uT * 0.13) * 1.6) * sin(a * 3.0 - uT * 0.045 + 1.3);
          float h = mix(1.0, 0.42, vH) * smoothstep(1.0, 0.8, vH) * smoothstep(0.0, 0.05, vH);
          gl_FragColor = vec4(uColor, uK * e * h * streak * vFog * uDim);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: true,
    }),
  );
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(from).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.clone().normalize());
  m.userData.noPlan = true; // (não entra na planta da sala nem no mapa)
  m.renderOrder = 4;
  parent.add(m);
  return m;
}

// ── A POEIRA FINA ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Os grãos dentro do feixe (de `from`, raio r0, a `to`, raio r1). Cada grão é UM pixel da imagem do jogo (as "bolinhas" de antes tinham 2 × 2
// e eram poucas e todas iguais); são muitos, cada um com o seu brilho, e cada um CINTILA no seu tempo, como poeira que gira na luz: quase
// some e de repente acende. Descem muito devagar, rodando em volta do eixo, e os da beirada do feixe são mais fracos.
export function fineDust(parent: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3, r0: number, r1: number, n = 160, color = 0xe8eeff, opacity = 0.95) {
  const dir = to.clone().sub(from);
  const { side, up } = axes(dir);
  const seed = new Float32Array(n * 4);
  let s = (Math.round(from.x * 31 + from.z * 17 + to.y * 7) >>> 0) || 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) & 0xffffff) / 0x1000000;
  for (let i = 0; i < n; i++) {
    seed[i * 4] = rnd(); // ao longo do feixe
    seed[i * 4 + 1] = rnd() * Math.PI * 2; // em volta do eixo
    seed[i * 4 + 2] = Math.sqrt(rnd()); // do eixo para a borda
    seed[i * 4 + 3] = rnd() * 10; // a "pessoa" do grão
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  geo.boundingSphere = new THREE.Sphere(from.clone().addScaledVector(dir, 0.5), dir.length() / 2 + Math.max(r0, r1) + 0.2);
  const mat = share(
    new THREE.ShaderMaterial({
      uniforms: withFog({
        uT: { value: 0 },
        uDim: { value: 1 },
        uColor: { value: new THREE.Color(color) },
        uOp: { value: opacity },
        uFrom: { value: from.clone() },
        uDir: { value: dir },
        uSide: { value: side },
        uUp: { value: up },
        uR: { value: new THREE.Vector2(r0, r1) },
      }),
      vertexShader: `
        ${FOG_PARS}
        uniform float uT; uniform vec3 uFrom; uniform vec3 uDir; uniform vec3 uSide; uniform vec3 uUp; uniform vec2 uR;
        attribute vec4 aSeed;
        varying float vA;
        void main(){
          float k = aSeed.w;
          float along = fract(aSeed.x + uT * (0.003 + 0.006 * fract(k * 3.7)));
          float a = aSeed.y + uT * 0.1 * (fract(k * 1.3) - 0.5) + sin(uT * 0.31 + k * 5.0) * 0.35;
          float rad = mix(uR.x, uR.y, along) * aSeed.z * (0.94 + 0.06 * sin(uT * 0.23 + k * 9.0));
          vec3 p = uFrom + uDir * along + uSide * (cos(a) * rad) + uUp * (sin(a) * rad);
          p.y += sin(uT * 0.6 + k * 7.0) * 0.04;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = 1.0;
          float tw = 0.5 + 0.5 * sin(uT * (0.5 + fract(k * 2.1) * 1.3) + k * 20.0);
          tw = tw * tw * tw; // quase sempre apagado, de vez em quando aceso
          float ends = smoothstep(0.0, 0.07, along) * smoothstep(1.0, 0.86, along);
          float rim = 1.0 - 0.65 * smoothstep(0.6, 1.0, aSeed.z);
          float nearK = smoothstep(0.35, 1.1, -mv.z); // não acende colado no olho
          vA = (0.1 + 0.9 * tw) * ends * rim * nearK * ${fogFade('-mv.z')};
        }`,
      fragmentShader: `
        uniform vec3 uColor; uniform float uOp; uniform float uDim;
        varying float vA;
        void main(){ gl_FragColor = vec4(uColor, vA * uOp * uDim); }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: true,
    }),
  );
  const pts = new THREE.Points(geo, mat);
  pts.renderOrder = 5;
  parent.add(pts);
  return pts;
}

// o facho inteiro de uma abertura: o feixe no ar e a poeira fina dentro dele
export function sunBeam(
  parent: THREE.Object3D,
  from: THREE.Vector3,
  to: THREE.Vector3,
  r0: number,
  r1: number,
  o: { color?: number; strength?: number; dust?: number; dustColor?: number } = {},
) {
  const shaft = lightShaft(parent, from, to, r0, r1, o.color ?? 0xc8d8ff, o.strength ?? 0.085);
  const dust = fineDust(parent, from, to, r0 * 0.92, r1 * 0.92, o.dust ?? 160, o.dustColor ?? 0xe8eeff);
  return { shaft, dust };
}

// ── A FUMAÇA DAS TOCHAS ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Tufos escuros pontilhados que nascem na chama, sobem afastando-se um pouco da parede, alargam e somem (a fuligem da parede vem daí). Antes
// só duas tochas do Vestíbulo e as da Galeria tinham, com cinco desenhos por tocha; aqui TODAS as tochas de uma sala saem num desenho só.
// `at` = a chama; (nx, nz) = para onde a parede olha.
const BAYER4 = 'float bayer2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); } float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }';
export function smokePoints(parent: THREE.Object3D, torches: { x: number; y: number; z: number; nx: number; nz: number }[], per = 5) {
  const n = torches.length * per;
  const base = new Float32Array(n * 3);
  const seed = new Float32Array(n * 4);
  const box = new THREE.Box3();
  torches.forEach((t, i) => {
    box.expandByPoint(new THREE.Vector3(t.x, t.y, t.z));
    for (let k = 0; k < per; k++) {
      const o = i * per + k;
      base.set([t.x, t.y, t.z], o * 3);
      seed.set([t.nx, t.nz, k / per + i * 0.137, 0.16 + (k % 3) * 0.03], o * 4);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('aBase', new THREE.BufferAttribute(base, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  geo.boundingSphere = box.getBoundingSphere(new THREE.Sphere());
  geo.boundingSphere.radius += 2.2;
  const mat = share(
    new THREE.ShaderMaterial({
      uniforms: withFog({ uT: { value: 0 }, uH: { value: 270 }, uK: { value: 1 } }),
      vertexShader: `
        ${FOG_PARS}
        uniform float uT; uniform float uH; uniform float uK;
        attribute vec3 aBase; attribute vec4 aSeed;
        varying float vA;
        void main(){
          float k = fract(uT * aSeed.w + aSeed.z); // 0 = nasce na chama, 1 = some
          float away = 0.12 + k * 0.25;
          vec3 p = aBase;
          p.x += aSeed.x * away + sin(uT * 1.3 + aSeed.z * 9.0) * 0.06 * k;
          p.z += aSeed.y * away + cos(uT * 1.1 + aSeed.z * 7.0) * 0.06 * k;
          p.y += k * 1.5;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp((0.16 + k * 0.62) * projectionMatrix[1][1] * uH * 0.5 / max(0.2, -mv.z), 1.0, 56.0);
          vA = sin(k * 3.14159) * (1.0 - k * 0.4) * uK * ${fogFade('-mv.z')};
        }`,
      fragmentShader: `
        varying float vA;
        ${BAYER4}
        void main(){
          float d = max(0.0, 1.0 - length(gl_PointCoord - 0.5) / 0.48);
          // o tufo é PONTILHADO (some por menos pontos, não por transparência) e escuro de verdade: a parede atrás da chama recebe luz muito
          // acima de 1, e um véu fraco não aparecia nela
          if (min(0.8, d * 1.6) * vA <= bayer4(gl_FragCoord.xy) * 0.95 + 0.04) discard;
          gl_FragColor = vec4(0.021, 0.018, 0.021, 0.68);
        }`,
      transparent: true,
      depthWrite: false,
      fog: true,
    }),
  );
  const pts = new THREE.Points(geo, mat);
  pts.renderOrder = 3;
  parent.add(pts);
  return pts;
}

// ── AS MARIPOSAS ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Um ou dois pontinhos claros voando em volta de uma chama, tortos e rápidos, piscando com o bater das asas. Só perto do fogo (é a luz que
// as mostra). `at` = o meio do voo (um palmo à frente da chama).
export function moths(parent: THREE.Object3D, at: THREE.Vector3[], each = 2) {
  const n = at.length * each;
  const c = new Float32Array(n * 3);
  const seed = new Float32Array(n * 2);
  const box = new THREE.Box3();
  at.forEach((p, i) => {
    box.expandByPoint(p);
    for (let k = 0; k < each; k++) {
      c.set([p.x, p.y, p.z], (i * each + k) * 3);
      seed.set([(i * 0.37 + k * 0.61) % 1, ((i * 7 + k * 3) % 5) / 5], (i * each + k) * 2);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('aC', new THREE.BufferAttribute(c, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 2));
  geo.boundingSphere = box.getBoundingSphere(new THREE.Sphere());
  geo.boundingSphere.radius += 0.8;
  const mat = share(
    new THREE.ShaderMaterial({
      uniforms: withFog({ uT: { value: 0 }, uDim: { value: 1 } }),
      vertexShader: `
        ${FOG_PARS}
        uniform float uT;
        attribute vec3 aC; attribute vec2 aSeed;
        varying float vA;
        void main(){
          float k = aSeed.x * 10.0;
          float t = uT * (1.5 + aSeed.y);
          // de vez em quando pousa (fica quase parada) e torna a voar
          float rest = smoothstep(0.75, 0.9, sin(uT * 0.21 + k * 3.0));
          vec3 o = vec3(sin(t * 1.3 + k) * 0.3 + sin(t * 3.1 + k * 2.0) * 0.09, sin(t * 1.9 + k * 3.0) * 0.17 + sin(t * 4.3 + k) * 0.05, cos(t * 1.1 + k * 1.7) * 0.3 + cos(t * 2.7 + k) * 0.09);
          vec4 mv = modelViewMatrix * vec4(aC + o * (1.0 - 0.85 * rest), 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = -mv.z < 2.2 ? 2.0 : 1.0;
          vA = (0.3 + 0.7 * step(0.5, fract(uT * 8.0 + k))) * (1.0 - 0.5 * rest) * ${fogFade('-mv.z')};
        }`,
      fragmentShader: 'uniform float uDim; varying float vA; void main(){ gl_FragColor = vec4(0.95, 0.82, 0.6, vA * 0.8 * uDim); }',
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: true,
    }),
  );
  const pts = new THREE.Points(geo, mat);
  pts.renderOrder = 5;
  parent.add(pts);
  return pts;
}

// ── A NÉVOA ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Véus de névoa em blocos de pixel, com a transparência em pontilhado (a mesma do pátio da abertura), boiando devagar dentro de uma caixa.
// Para os lugares ABERTOS da Casa (o claustro, o pátio da cisterna, o alto da escadaria): lá fora é sempre névoa, e ela desce um pouco para
// dentro. Poucos véus (cada um é um desenho); fica sempre ACIMA da cabeça ou encostada nos cantos, nunca na frente do que se lê.
let mistTex: THREE.CanvasTexture | null = null;
function mistTexture() {
  if (mistTex) return mistTex;
  const N = 48;
  const cv = document.createElement('canvas');
  cv.width = N;
  cv.height = N;
  const g = cv.getContext('2d')!;
  const img = g.createImageData(N, N);
  const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const blobs = [[0.5, 0.55, 0.36], [0.3, 0.6, 0.22], [0.7, 0.58, 0.24], [0.45, 0.42, 0.2], [0.62, 0.45, 0.18]];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let d = 0;
      for (const [bx, by, br] of blobs) d = Math.max(d, 1 - Math.hypot(x / N - bx, (y / N - by) * 1.6) / br);
      d = Math.max(0, Math.min(1, d * 1.3));
      const level = Math.floor(d * 3.999);
      const on = d > (B[(y % 4) * 4 + (x % 4)] / 16) * 0.9 + 0.05;
      const o = (y * N + x) * 4;
      img.data[o] = 176;
      img.data[o + 1] = 174;
      img.data[o + 2] = 196;
      img.data[o + 3] = on ? [0, 40, 66, 92][level] : 0;
    }
  g.putImageData(img, 0, 0);
  mistTex = new THREE.CanvasTexture(cv);
  mistTex.magFilter = THREE.NearestFilter;
  mistTex.minFilter = THREE.NearestFilter;
  mistTex.generateMipmaps = false;
  mistTex.colorSpace = THREE.SRGBColorSpace;
  return mistTex;
}
export function mistBank(parent: THREE.Object3D, o: { x0: number; x1: number; z0: number; z1: number; y0: number; y1: number; n: number; size?: [number, number]; opacity?: number }) {
  const [s0, s1] = o.size ?? [2.6, 5];
  const list: { s: THREE.Sprite; x: number; y: number; z: number; ph: number; sp: number; op: number }[] = [];
  for (let i = 0; i < o.n; i++) {
    const r = (k: number) => ((Math.sin(i * 12.9898 + k * 78.233 + o.x0 * 3.1) * 43758.5453) % 1 + 1) % 1;
    const m = new THREE.SpriteMaterial({ map: mistTexture(), transparent: true, depthWrite: false, fog: true, opacity: 0 });
    const s = new THREE.Sprite(m);
    const sz = s0 + r(1) * (s1 - s0);
    s.scale.set(sz * 1.7, sz, 1);
    s.renderOrder = 2;
    s.userData.noPlan = true;
    parent.add(s);
    list.push({ s, x: o.x0 + r(2) * (o.x1 - o.x0), y: o.y0 + r(3) * (o.y1 - o.y0), z: o.z0 + r(4) * (o.z1 - o.z0), ph: r(5) * 6.28, sp: 0.04 + r(6) * 0.06, op: (o.opacity ?? 0.7) * (0.6 + r(7) * 0.4) });
  }
  return (_dt: number, t: number) => {
    for (const m of list) {
      m.s.position.set(m.x + Math.sin(t * m.sp + m.ph) * 1.4, m.y + Math.sin(t * m.sp * 1.7 + m.ph * 2) * 0.25, m.z + Math.cos(t * m.sp * 0.8 + m.ph) * 1.4);
      (m.s.material as THREE.SpriteMaterial).opacity = m.op * (0.8 + 0.2 * Math.sin(t * 0.13 + m.ph)) * fxDim.value;
    }
  };
}
