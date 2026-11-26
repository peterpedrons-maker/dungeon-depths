// O FOGO DOS GLIFOS (DESIGN.md §54–§55): o mesmo fogo para tudo o que acende escrito na pedra.
//  · o traço em BRASA VIVA (desenhado aos poucos, na ordem da escrita, e com o brilho ondulando ao longo dele);
//  · LÍNGUAS DE FOGO dançando em cima dos traços (um `THREE.Points` por palavra/frase; cada chama é uma gota desenhada no shader);
//  · BRASAS que sobem.
// Usado pelas frases acendíveis (burnline.ts) e por QUALQUER palavra talhada cujo `fire` suba (inscription.ts → makeWordFire): a frase da porta
// que acende com os braseiros, a Casa lendo a porta quando ela abre, as lousas, os rótulos que acendem quando o puzzle é resolvido...
import * as THREE from 'three';
import { drawGlyphPart, glyphSamples } from '../book/font';
import { glyphsOf, type GlyphDef } from '../story/lexicon';
import { CELL, GLYPH_SIZE, PAD } from './glyphcell';

export const PER_GLYPH = 0.24; // segundos para o fogo escrever um símbolo

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let capsuleTex: THREE.CanvasTexture | null = null;
// mancha macia em cápsula (halo e fuligem): branca, a cor vem do material
export function softCapsule() {
  if (capsuleTex) return capsuleTex;
  const W = 128;
  const H = 32;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dx = Math.max(0, Math.abs(x + 0.5 - W / 2) - (W / 2 - H / 2));
      const d = Math.hypot(dx, y + 0.5 - H / 2) / (H / 2);
      const a = Math.max(0, 1 - d) ** 1.6;
      const o = (y * W + x) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = 255;
      img.data[o + 3] = Math.round(a * 255);
    }
  g.putImageData(img, 0, 0);
  capsuleTex = new THREE.CanvasTexture(c);
  return capsuleTex;
}

// o símbolo em BRASA, até a fração `f` da escrita: largo e claro (de longe, quem aparece são as camadas largas)
export function drawFireGlyph(g: CanvasRenderingContext2D, def: GlyphDef, cx: number, cy: number, f: number) {
  drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#b8300a', f, 11);
  drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#ff6a14', f, 8);
  drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#ffae36', f, 5);
  drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#ffe290', f, 2);
  drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#fffbe6', f, 0);
}

// o material do traço aceso: o brilho ondula ao longo do traço, como carvão em brasa (`uT` = tempo, compartilhado)
export function emberStrokeMaterial(tex: THREE.Texture, uT: { value: number }) {
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uT = uT;
    sh.fragmentShader =
      'uniform float uT;\n' +
      sh.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        float fl = 0.5 + 0.5 * sin(vMapUv.x * 70.0 + uT * 8.0 + sin(vMapUv.y * 37.0 - uT * 5.0) * 2.0);
        fl *= 0.55 + 0.45 * sin(vMapUv.x * 17.0 - uT * 5.5 + vMapUv.y * 9.0);
        diffuseColor.rgb *= 0.62 + 0.8 * fl;`,
      );
  };
  return mat;
}
export function canvasTexture(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ── as LÍNGUAS DE FOGO: um ponto por chama, desenhado no shader (uma silhueta de gota que tremula e balança; base branca-amarela, ponta
// vermelha). A chama nasce quando o fogo que corre chega ao ponto (aUnit). ──
export const FLAME_VS = /* glsl */ `
attribute float aUnit;
attribute float aPhase;
attribute float aSize;
uniform float uT;
uniform float uRun;
uniform float uShow;
uniform float uViewH;
varying float vA;
varying float vPh;
void main() {
  float on = clamp((uRun - aUnit) * 4.0, 0.0, 1.0) * uShow;
  float fl = 0.82 + 0.22 * sin(uT * 11.0 + aPhase * 6.2831) + 0.12 * sin(uT * 23.0 + aPhase * 17.0);
  float s = aSize * fl * on;
  vec4 mv = modelViewMatrix * vec4(position + vec3(0.0, s * 0.42, 0.0), 1.0); // a base da chama fica no traço
  vA = on;
  vPh = aPhase;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = s * projectionMatrix[1][1] * uViewH * 0.5 / max(0.05, -mv.z);
}`;
export const FLAME_FS = /* glsl */ `
uniform float uT;
varying float vA;
varying float vPh;
void main() {
  if (vA <= 0.01) discard;
  float y = 1.0 - gl_PointCoord.y; // 0 = base, 1 = ponta
  float x = gl_PointCoord.x * 2.0 - 1.0;
  float sway = 0.28 * sin(uT * 7.0 + vPh * 9.0 + y * 3.2) * y;
  float w = pow(max(0.0, 1.0 - y), 0.75) * (0.6 + 0.12 * sin(uT * 13.0 + vPh * 5.0));
  w *= mix(0.7, 1.0, smoothstep(0.0, 0.2, y)); // a base é redonda
  float d = abs(x - sway) / max(w, 0.001);
  if (d > 1.0 || y > 0.97) discard;
  float k = y + d * 0.3;
  vec3 c = mix(vec3(1.0, 0.98, 0.78), vec3(1.0, 0.66, 0.18), smoothstep(0.08, 0.45, k));
  c = mix(c, vec3(0.9, 0.26, 0.06), smoothstep(0.5, 0.95, k));
  gl_FragColor = vec4(c * 1.6, 1.0);
}`;
// ── as BRASAS que sobem: cada uma nasce num ponto de um traço aceso, sobe uns 40 cm balançando e se apaga ──
export const SPARK_VS = /* glsl */ `
attribute float aUnit;
attribute float aPhase;
attribute float aSpeed;
uniform float uT;
uniform float uRun;
uniform float uShow;
uniform float uViewH;
uniform vec3 uAlong;
uniform vec3 uN;
varying float vA;
void main() {
  float life = fract(uT * aSpeed + aPhase);
  float on = step(aUnit, uRun) * uShow;
  vec3 p = position + vec3(0.0, life * 0.42, 0.0) + uAlong * sin(life * 6.0 + aPhase * 20.0) * 0.05 + uN * (0.03 + life * 0.08);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vA = on * (1.0 - life) * smoothstep(0.0, 0.12, life);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.5, 0.028 * projectionMatrix[1][1] * uViewH * 0.5 / max(0.05, -mv.z)) * step(0.01, vA);
}`;
export const SPARK_FS = /* glsl */ `
varying float vA;
void main() {
  if (vA <= 0.01) discard;
  gl_FragColor = vec4(vec3(1.0, 0.68, 0.22) * 1.8 * vA, 1.0);
}`;

// os pontos que desenham as chamas e as brasas (o tamanho em pixels sai da altura do alvo em que o motor desenha a cena)
export function flamePoints(o: { pts: number[]; unit: number[]; phase: number[]; size: number[]; uT: { value: number }; uRun: { value: number }; uShow: { value: number } }) {
  const viewH = { value: 400 };
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(o.pts, 3));
  g.setAttribute('aUnit', new THREE.Float32BufferAttribute(o.unit, 1));
  g.setAttribute('aPhase', new THREE.Float32BufferAttribute(o.phase, 1));
  g.setAttribute('aSize', new THREE.Float32BufferAttribute(o.size, 1));
  const p = new THREE.Points(g, new THREE.ShaderMaterial({ vertexShader: FLAME_VS, fragmentShader: FLAME_FS, uniforms: { uT: o.uT, uRun: o.uRun, uShow: o.uShow, uViewH: viewH }, transparent: true, depthWrite: false }));
  p.frustumCulled = false;
  p.renderOrder = 5;
  p.onBeforeRender = (renderer) => {
    const rt = renderer.getRenderTarget();
    viewH.value = rt ? rt.height : renderer.domElement.height;
  };
  return p;
}
export function sparkPoints(o: { pts: number[]; unit: number[]; phase: number[]; speed: number[]; along: THREE.Vector3; n: THREE.Vector3; uT: { value: number }; uRun: { value: number }; uShow: { value: number } }) {
  const viewH = { value: 400 };
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(o.pts, 3));
  g.setAttribute('aUnit', new THREE.Float32BufferAttribute(o.unit, 1));
  g.setAttribute('aPhase', new THREE.Float32BufferAttribute(o.phase, 1));
  g.setAttribute('aSpeed', new THREE.Float32BufferAttribute(o.speed, 1));
  const p = new THREE.Points(
    g,
    new THREE.ShaderMaterial({
      vertexShader: SPARK_VS,
      fragmentShader: SPARK_FS,
      uniforms: { uT: o.uT, uRun: o.uRun, uShow: o.uShow, uViewH: viewH, uAlong: { value: o.along.clone() }, uN: { value: o.n.clone() } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  p.frustumCulled = false;
  p.renderOrder = 6;
  p.onBeforeRender = (renderer) => {
    const rt = renderer.getRenderTarget();
    viewH.value = rt ? rt.height : renderer.domElement.height;
  };
  return p;
}

// ── O FOGO DE UMA PALAVRA TALHADA (cal): quando o `fire` dela sobe, o fogo corre pelos sulcos, traço por traço, e chamas dançam nela.
// `fire` parcial = brilho parcial (palavras que pulsam ou acendem aos poucos continuam pulsando); ela só "apaga" depois de 0,4 s abaixo de 0,05
// (um piscar rápido não recomeça o fogo). Ao apagar, o traço esfria de laranja a vermelho-escuro e some. ──
export interface WordFire {
  update(fire: number, visible: boolean, dt: number, t: number): void;
}
export function makeWordFire(mesh: THREE.Mesh, id: string, normal: THREE.Vector3, seed: number): WordFire {
  const parent = mesh.parent!;
  const defs = glyphsOf(id);
  const parts = Math.max(1, defs.length);
  const W = parts * CELL + PAD * 2;
  const H = CELL + PAD * 2;
  const geo = mesh.geometry as THREE.PlaneGeometry;
  const pw = geo.parameters.width;
  const ph = geo.parameters.height;
  const pxm = pw / W;
  const size = ph * (CELL / H);
  const sizeK = size / 0.45;
  const n = normal.clone().normalize();
  const along = new THREE.Vector3(Math.cos(mesh.rotation.y), 0, -Math.sin(mesh.rotation.y));
  const r = rng(seed);
  const uT = { value: 0 };
  const uRun = { value: 0 };
  const uShow = { value: 0 };
  const uSpark = { value: 0 };
  // o traço em brasa
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g2 = canvas.getContext('2d')!;
  const tex = canvasTexture(canvas);
  const mat = emberStrokeMaterial(tex, uT);
  const over = new THREE.Mesh(geo.clone(), mat);
  over.position.copy(mesh.position).addScaledVector(n, 0.004);
  over.rotation.copy(mesh.rotation);
  over.renderOrder = 3;
  parent.add(over);
  // um halo quente atrás da palavra
  const haloMat = new THREE.MeshBasicMaterial({ map: softCapsule(), color: 0xff7a28, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(pw + size * 0.9, ph * 1.9), haloMat);
  halo.position.copy(mesh.position).addScaledVector(n, -0.004);
  halo.position.y += ph * 0.12;
  halo.rotation.copy(mesh.rotation);
  parent.add(halo);
  // as chamas e as brasas
  const pts: number[] = [];
  const unit: number[] = [];
  const phase: number[] = [];
  const sz: number[] = [];
  const all: { x: number; y: number; z: number; u: number }[] = [];
  defs.forEach((def, j) => {
    for (const s of glyphSamples(def, PAD + CELL * (j + 0.5), PAD + CELL / 2, GLYPH_SIZE, 19)) {
      const q = mesh.position.clone().addScaledVector(along, (s.x - W / 2) * pxm).add(new THREE.Vector3(0, (H / 2 - s.y) * pxm, 0)).addScaledVector(n, 0.02);
      pts.push(q.x, q.y, q.z);
      unit.push(j + s.u);
      phase.push(r());
      sz.push((0.09 + r() * 0.07) * sizeK);
      all.push({ x: q.x, y: q.y, z: q.z, u: j + s.u });
    }
  });
  const flames = flamePoints({ pts, unit, phase, size: sz, uT, uRun, uShow });
  parent.add(flames);
  const sp: number[] = [];
  const su: number[] = [];
  const sph: number[] = [];
  const sv: number[] = [];
  for (let k = 0; k < Math.max(4, parts * 4) && all.length; k++) {
    const a = all[Math.floor(r() * all.length)];
    sp.push(a.x, a.y, a.z);
    su.push(a.u);
    sph.push(r());
    sv.push(0.6 + r() * 0.5);
  }
  const sparks = sparkPoints({ pts: sp, unit: su, phase: sph, speed: sv, along, n, uT, uRun, uShow: uSpark });
  parent.add(sparks);

  const total = parts;
  const fs = defs.map(() => 0);
  let on = false;
  let offT = 0;
  let run = 0;
  let show = 0;
  let flameK = 0;
  let inten = 0;
  const sync = () => {
    let dirty = false;
    defs.forEach((_, j) => {
      const f = Math.min(1, Math.max(0, run - j));
      if (Math.abs(f - fs[j]) > 0.015 || (f === 1 && fs[j] !== 1) || (f === 0 && fs[j] !== 0)) {
        fs[j] = f;
        dirty = true;
      }
    });
    if (!dirty) return;
    g2.clearRect(0, 0, W, H);
    defs.forEach((def, j) => fs[j] > 0 && drawFireGlyph(g2, def, PAD + CELL * (j + 0.5), PAD + CELL / 2, fs[j]));
    tex.needsUpdate = true;
  };
  return {
    update(fire, visible, dt, t) {
      uT.value = t;
      if (fire >= 0.2) {
        offT = 0;
        on = true;
      } else if (fire < 0.05 && on) {
        offT += dt;
        if (offT > 0.4) on = false;
      }
      inten += (Math.min(1, fire) - inten) * Math.min(1, dt * 20);
      if (on) {
        if (run < total) {
          run = Math.min(total, run + dt / PER_GLYPH);
          sync();
        }
        show = 1;
        flameK = Math.min(1, flameK + dt / 0.25);
      } else {
        flameK = Math.max(0, flameK - dt / 0.3);
        if (show > 0) {
          show = Math.max(0, show - dt / 0.9);
          if (show === 0 && run > 0) {
            run = 0;
            sync();
          }
        }
      }
      const vis = visible && (show > 0 || flameK > 0);
      over.visible = halo.visible = flames.visible = sparks.visible = vis;
      if (!vis) return;
      const flick = 0.9 + 0.07 * Math.sin(t * 13 + seed) + 0.03 * Math.sin(t * 31 + seed * 0.7);
      const hot = on ? 1 : show * show;
      const k = on ? Math.max(0.15, inten) : 1; // aceso pela metade (ou pulsando): o fogo acompanha
      mat.opacity = Math.min(1, show * 1.4) * Math.min(1, k * 1.25);
      mat.color.setRGB((0.55 + 1.25 * hot) * flick, (0.08 + 1.27 * hot) * flick, (0.03 + 1.07 * hot) * flick);
      uRun.value = run;
      uShow.value = flameK * Math.sqrt(k);
      uSpark.value = flameK * (k > 0.6 ? 1 : 0);
      haloMat.opacity = 0.55 * flameK * k * flick * Math.min(1, 0.25 + run / total);
    },
  };
}
