// O MUNDO REAGE NA IMAGEM (DESIGN.md §98): a poeira que o dado levanta ao bater, as fagulhas de quando ele acende alguma coisa, o rastro de
// brasa do arremesso de Fogo, o pó que cai do teto quando a sala se resolve e a poeira que a porta solta ao abrir. Antes só o SOM dizia
// essas coisas.
//
// Um desenho só: um punhado de grãos (até N) em coordenadas do mundo, reusados. Cada grão tem um ou dois pixels da imagem do jogo. A poeira é
// opaca e pega a luz da sala (`light`); a fagulha é luz somada. O mesmo material faz as duas coisas (cor já multiplicada pela opacidade: a
// fagulha entra com cobertura zero).
import * as THREE from 'three';

type Kind = 'dust' | 'spark';
interface P {
  kind: Kind;
  life: number;
  max: number;
  vx: number;
  vy: number;
  vz: number;
  g: number; // gravidade
  drag: number;
  r: number;
  gr: number;
  b: number;
  a: number; // opacidade no começo
  size: number;
  floor: number; // a altura (mundo) em que o grão pousa e some
}

export function makePuffs(scene: THREE.Scene, N = 260) {
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 4);
  const size = new Float32Array(N);
  const ps: (P | null)[] = Array.from({ length: N }, () => null);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aCol', new THREE.BufferAttribute(col, 4));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const light = new THREE.Color(0.4, 0.36, 0.34);
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uLight: { value: light } }]),
    vertexShader: `
      uniform float fogNear; uniform float fogFar; uniform vec3 uLight;
      attribute vec4 aCol; attribute float aSize;
      varying vec4 vC;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize;
        float f = 1.0 - smoothstep(fogNear, fogFar, -mv.z);
        vC = vec4(aCol.rgb * (aCol.a > 0.001 ? uLight : vec3(1.0)), aCol.a) * f;
        if (aSize < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      }`,
    fragmentShader: 'varying vec4 vC; void main(){ gl_FragColor = vC; }',
    transparent: true,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    depthWrite: false,
    fog: true,
  });
  mat.uniforms.uLight.value = light;
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 6;
  scene.add(pts);

  let next = 0;
  const spawn = (x: number, y: number, z: number, p: P) => {
    // o primeiro lugar livre a partir do último; sem lugar, o grão mais velho dá a vez
    let i = -1;
    for (let k = 0; k < N; k++) {
      const j = (next + k) % N;
      if (!ps[j]) {
        i = j;
        break;
      }
    }
    if (i < 0) i = next;
    next = (i + 1) % N;
    ps[i] = p;
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;
  };
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();

  return {
    light, // a luz que a poeira pega (o motor a acerta pela sala)
    // a poeira de uma PANCADA em `at`, numa superfície de normal `n`: espalha rente à superfície e sobe um pouco. `k` = a força (0..1)
    hit(at: THREE.Vector3, n: THREE.Vector3, k: number) {
      const count = Math.round(7 + k * 15);
      const ref = Math.abs(n.y) > 0.9 ? tmpA.set(1, 0, 0) : tmpA.set(0, 1, 0);
      const t1 = tmpB.copy(ref).cross(n).normalize();
      const t2 = tmpA.copy(n).cross(t1).normalize();
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = rnd(0.5, 1.5) * (0.5 + k);
        const up = rnd(0.15, 0.7) * (0.5 + k);
        const tone = rnd(0.8, 1.15);
        spawn(at.x + n.x * 0.03, at.y + n.y * 0.03, at.z + n.z * 0.03, {
          kind: 'dust',
          life: 0,
          max: rnd(0.45, 1.05),
          vx: (t1.x * Math.cos(a) + t2.x * Math.sin(a)) * sp + n.x * up,
          vy: (t1.y * Math.cos(a) + t2.y * Math.sin(a)) * sp + n.y * up + 0.25,
          vz: (t1.z * Math.cos(a) + t2.z * Math.sin(a)) * sp + n.z * up,
          g: 0.5,
          drag: 3.2,
          r: 1.0 * tone,
          gr: 0.92 * tone,
          b: 0.82 * tone,
          a: rnd(0.55, 0.85),
          size: Math.random() < 0.3 ? 3 : Math.random() < 0.7 ? 2 : 1,
          floor: -1e9,
        });
      }
    },
    // FAGULHAS de quando o fogo pega em `at`: sobem num sopro e caem apagando
    sparks(at: THREE.Vector3, count = 14, power = 1) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = rnd(0.2, 1.1) * power;
        spawn(at.x, at.y, at.z, {
          kind: 'spark',
          life: 0,
          max: rnd(0.4, 1.1),
          vx: Math.cos(a) * sp,
          vy: rnd(0.9, 2.6) * power,
          vz: Math.sin(a) * sp,
          g: 3.2,
          drag: 0.9,
          r: 1.0,
          gr: rnd(0.45, 0.8),
          b: 0.16,
          a: rnd(0.7, 1),
          size: Math.random() < 0.3 ? 2 : 1,
          floor: -1e9,
        });
      }
    },
    // a BRASA que o dado de Fogo deixa para trás em voo (uma por chamada)
    ember(at: THREE.Vector3, vel: THREE.Vector3) {
      spawn(at.x + rnd(-0.06, 0.06), at.y + rnd(-0.06, 0.06), at.z + rnd(-0.06, 0.06), {
        kind: 'spark',
        life: 0,
        max: rnd(0.25, 0.6),
        vx: vel.x * 0.12 + rnd(-0.25, 0.25),
        vy: vel.y * 0.12 + rnd(0.0, 0.5),
        vz: vel.z * 0.12 + rnd(-0.25, 0.25),
        g: 1.2,
        drag: 1.5,
        r: 1.0,
        gr: rnd(0.4, 0.7),
        b: 0.12,
        a: rnd(0.5, 0.9),
        size: 1,
        floor: -1e9,
      });
    },
    // PÓ QUE CAI de `at` (o teto, a verga de uma porta), espalhado em `spread` metros, até a altura `floor`: um fio de pó, não uma nuvem
    fall(at: THREE.Vector3, count: number, spread: number, floor: number) {
      for (let i = 0; i < count; i++) {
        const tone = rnd(0.8, 1.2);
        spawn(at.x + rnd(-spread, spread), at.y - rnd(0, 0.15), at.z + rnd(-spread, spread), {
          kind: 'dust',
          life: -rnd(0, 0.5), // (caem aos poucos, não todos juntos)
          max: rnd(1.4, 2.6),
          vx: rnd(-0.08, 0.08),
          vy: -rnd(0.1, 0.5),
          vz: rnd(-0.08, 0.08),
          g: 2.2,
          drag: 1.4,
          r: 1.0 * tone,
          gr: 0.93 * tone,
          b: 0.84 * tone,
          a: rnd(0.3, 0.6),
          size: Math.random() < 0.3 ? 2 : 1,
          floor,
        });
      }
    },
    update(dt: number) {
      let any = false;
      for (let i = 0; i < N; i++) {
        const p = ps[i];
        if (!p) {
          if (size[i] !== 0) {
            size[i] = 0;
            any = true;
          }
          continue;
        }
        any = true;
        p.life += dt;
        if (p.life < 0) {
          size[i] = 0; // (ainda não soltou)
          continue;
        }
        const o = i * 3;
        if (p.life >= p.max || pos[o + 1] < p.floor) {
          ps[i] = null;
          size[i] = 0;
          continue;
        }
        const d = Math.exp(-p.drag * dt);
        p.vx *= d;
        p.vy = p.vy * d - p.g * dt;
        p.vz *= d;
        pos[o] += p.vx * dt;
        pos[o + 1] += p.vy * dt;
        pos[o + 2] += p.vz * dt;
        const k = p.life / p.max;
        const fade = p.kind === 'dust' ? Math.min(1, k * 8) * (1 - k) : 1 - k * k;
        const a = p.a * fade;
        const c = i * 4;
        if (p.kind === 'dust') {
          col[c] = p.r * a;
          col[c + 1] = p.gr * a;
          col[c + 2] = p.b * a;
          col[c + 3] = a;
        } else {
          // a fagulha esfria: de amarelo para vermelho, e some
          col[c] = p.r * a;
          col[c + 1] = p.gr * a * (1 - 0.6 * k);
          col[c + 2] = p.b * a * (1 - k);
          col[c + 3] = 0;
        }
        size[i] = p.kind === 'dust' ? Math.max(1, Math.round(p.size * (1 - k * 0.75))) : p.size; // a nuvem se desfaz: os grãos encolhem
      }
      if (any) {
        geo.attributes.position.needsUpdate = true;
        geo.attributes.aCol.needsUpdate = true;
        geo.attributes.aSize.needsUpdate = true;
      }
    },
    count: () => ps.reduce((n, p) => n + (p ? 1 : 0), 0),
  };
}
