// FRASE ACENDÍVEL (tabletes `lit` do construtor fire.ts): o que o jogador vê de uma frase que o dado de Fogo acende. DESIGN.md §53–§54.
//  · APAGADA: não é cal: são FISSURAS na pedra (sulco escuro, a borda lascada pegando a luz, rachaduras finas saindo dos traços). Lê-se de perto.
//    Sem dizer nada, a pedra conta que ali já queimou: uma mancha velha de FULIGEM acima da frase e, de vez em quando, uma BRASA ADORMECIDA que
//    reluz no fundo de uma fissura e se apaga.
//  · ACESA: FOGO de verdade. O fogo corre pelos sulcos do soquete até o fim da frase, traço por traço (a ordem da escrita); onde ele passa, o
//    sulco vira brasa viva (pulsando) e LÍNGUAS DE FOGO dançam em cima dos traços, com BRASAS que sobem; halo quente na parede e luz de verdade.
//  · AO APAGAR (erro, punição): as chamas encolhem, o sulco esfria de laranja a vermelho-escuro, e fica FULIGEM por ~2 s depois que a luz volta.
//  · REALCE DE MIRA: um contorno dourado em volta da frase, enquanto a mira (com a face de Fogo) está sobre ela.
// De longe dá para contar quantas frases estão acesas: o fogo e o halo ignoram a névoa.
import * as THREE from 'three';
import { drawGlyphPart, glyphSamples, plot } from '../book/font';
import { glyphsOf } from '../story/lexicon';
import { CELL, GLYPH_SIZE, PAD, type Inscription } from './inscription';
import type { Kit } from './kit';

const SOOT = new THREE.Color(0.25, 0.22, 0.21); // a pedra da fissura, enegrecida
const PER_GLYPH = 0.24; // segundos para o fogo escrever um símbolo
const WORD_GAP = 0.35; // (em símbolos) o fogo leva esse tempo para pular de uma palavra para a outra
const SOOT_S = 2.0; // quanto dura a fuligem

let capsuleTex: THREE.CanvasTexture | null = null;
// mancha macia em cápsula (halo e fuligem): branca, a cor vem do material
function softCapsule() {
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
let glintTex: THREE.CanvasTexture | null = null;
function glintTexture() {
  if (glintTex) return glintTex;
  const c = document.createElement('canvas');
  c.width = c.height = 6;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ff5a14';
  g.fillRect(1, 2, 4, 2);
  g.fillRect(2, 1, 2, 4);
  g.fillStyle = '#ffd070';
  g.fillRect(2, 2, 2, 2);
  glintTex = new THREE.CanvasTexture(c);
  glintTex.magFilter = THREE.NearestFilter;
  glintTex.minFilter = THREE.NearestFilter;
  return glintTex;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── as LÍNGUAS DE FOGO: um ponto por chama, desenhado no shader (uma silhueta de gota que tremula e balança; base branca-amarela, ponta
// vermelha). A chama nasce quando o fogo que corre chega ao ponto (aUnit). Um só desenho por frase. ──
const FLAME_VS = /* glsl */ `
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
const FLAME_FS = /* glsl */ `
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
const SPARK_VS = /* glsl */ `
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
const SPARK_FS = /* glsl */ `
varying float vA;
void main() {
  if (vA <= 0.01) discard;
  gl_FragColor = vec4(vec3(1.0, 0.68, 0.22) * 1.8 * vA, 1.0);
}`;

export interface BurnLine {
  readonly start: THREE.Vector3; // começo da frase (lado do soquete), local da sala, na face da parede
  readonly end: THREE.Vector3;
  set(lit: boolean, instant?: boolean): void;
  highlight(on: boolean): void; // chamar a cada quadro (o realce some sozinho se ninguém chamar)
  update(dt: number, t: number): void;
  level(): number; // 0..1: quanto ela aparenta acesa agora
  running(): boolean; // o fogo ainda está correndo pelos sulcos
}

// `hold`: enquanto devolver true (o ESCURO da punição), a fuligem não começa a sumir: ela tem de ser vista quando a luz volta.
// `idle`: a frase espera ser acesa (a trava está ativa e a Casa aceita fogo): só então a brasa adormecida reluz de vez em quando.
export function makeBurnLine(kit: Kit, ins: Inscription, o: { size: number; hold?: () => boolean; idle?: () => boolean; seed?: number }): BurnLine {
  ins.burnable = true;
  const n = ins.normal.clone().normalize();
  const ry = Math.atan2(n.x, n.z);
  const along = new THREE.Vector3(Math.cos(ry), 0, -Math.sin(ry)); // sentido da leitura
  const panels = ins.panels.filter((p) => p.id);
  const r = rng(o.seed ?? Math.round(Math.abs(ins.center.x * 131 + ins.center.y * 71 + ins.center.z * 37)));
  // cada símbolo: quando o fogo chega nele
  interface G {
    panel: number;
    idx: number;
    t0: number; // em "símbolos" desde o começo
    f: number; // quanto dele já foi escrito
  }
  const glyphs: G[] = [];
  interface P {
    canvas: HTMLCanvasElement;
    g2: CanvasRenderingContext2D;
    tex: THREE.CanvasTexture;
    mat: THREE.MeshBasicMaterial;
    base: THREE.MeshLambertMaterial;
    defs: ReturnType<typeof glyphsOf>;
    dirty: boolean;
  }
  const ps: P[] = [];
  // os pontos dos traços (local da sala), para as chamas e as brasas
  const flamePts: number[] = [];
  const flameUnit: number[] = [];
  const flamePh: number[] = [];
  const flameSz: number[] = [];
  const allPts: { p: THREE.Vector3; unit: number }[] = [];
  const uT = { value: 0 };
  const sizeK = o.size / 0.45;
  let unit = 0;
  panels.forEach((p, pi) => {
    const defs = glyphsOf(p.id!);
    const parts = Math.max(1, defs.length);
    const W = parts * CELL + PAD * 2;
    const H = CELL + PAD * 2;
    const pw = (p.mesh.geometry as THREE.PlaneGeometry).parameters.width;
    const pxm = pw / W;
    const toRoom = (x: number, y: number, off: number) =>
      p.mesh.position.clone().addScaledVector(along, (x - W / 2) * pxm).add(new THREE.Vector3(0, (H / 2 - y) * pxm, 0)).addScaledVector(n, off);
    // ── a pedra: FISSURAS no lugar da cal (a textura da palavra é trocada) ──
    const fc = document.createElement('canvas');
    fc.width = W;
    fc.height = H;
    const fg = fc.getContext('2d')!;
    defs.forEach((def, j) => {
      const cx = PAD + CELL * (j + 0.5);
      const cy = PAD + CELL / 2;
      drawGlyphPart(fg, def, cx - 2, cy - 2, GLYPH_SIZE, 'rgba(206,190,166,0.5)', 1, 6); // a borda de cima, lascada, pega a luz
      drawGlyphPart(fg, def, cx + 1, cy + 1, GLYPH_SIZE, '#0b0807', 1, 6); // o fundo da fissura
      drawGlyphPart(fg, def, cx, cy, GLYPH_SIZE, '#060404', 1, 3);
      // rachaduras finas que saem dos traços
      const sm = glyphSamples(def, cx, cy, GLYPH_SIZE, 26);
      fg.fillStyle = 'rgba(12,9,8,0.85)';
      for (let q = 0; q < 4 && sm.length; q++) {
        const s0 = sm[Math.floor(r() * sm.length)];
        let x = s0.x;
        let y = s0.y;
        let a = r() * Math.PI * 2;
        for (let k = 0; k < 3; k++) {
          const l = 4 + r() * 7;
          const nx = x + Math.cos(a) * l;
          const ny = y + Math.sin(a) * l;
          plot(fg, x, y, nx, ny, 1);
          x = nx;
          y = ny;
          a += (r() - 0.5) * 1.4;
        }
      }
    });
    const ftex = new THREE.CanvasTexture(fc);
    ftex.magFilter = THREE.NearestFilter;
    ftex.minFilter = THREE.LinearMipmapLinearFilter;
    ftex.generateMipmaps = true;
    ftex.anisotropy = 4;
    ftex.colorSpace = THREE.SRGBColorSpace;
    p.mat.map = ftex;
    p.mat.emissiveMap = null;
    p.mat.emissiveIntensity = 0;
    p.mat.color.setRGB(1, 1, 1);
    p.mat.needsUpdate = true;
    // ── o fogo que corre: o traço aceso (desenhado aos poucos) por cima da fissura ──
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g2 = canvas.getContext('2d')!;
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 });
    // brasa VIVA: o brilho do traço ondula ao longo dele, como carvão em brasa
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
    const m = new THREE.Mesh((p.mesh.geometry as THREE.PlaneGeometry).clone(), mat);
    m.position.copy(p.mesh.position).addScaledVector(n, 0.004);
    m.rotation.copy(p.mesh.rotation);
    m.renderOrder = 3;
    kit.group.add(m);
    defs.forEach((def, j) => {
      const cx = PAD + CELL * (j + 0.5);
      const cy = PAD + CELL / 2;
      glyphs.push({ panel: pi, idx: j, t0: unit, f: 0 });
      for (const s of glyphSamples(def, cx, cy, GLYPH_SIZE, 19)) {
        const q = toRoom(s.x, s.y, 0.02);
        flamePts.push(q.x, q.y, q.z);
        flameUnit.push(unit + s.u);
        flamePh.push(r());
        flameSz.push((0.09 + r() * 0.07) * sizeK);
        allPts.push({ p: q, unit: unit + s.u });
      }
      unit += 1;
    });
    unit += WORD_GAP;
    ps.push({ canvas, g2, tex, mat, base: p.mat, defs, dirty: false });
  });
  const total = Math.max(1, unit - WORD_GAP);
  const first = panels[0];
  const last = panels[panels.length - 1];
  const wOf = (p: typeof first) => (p.mesh.geometry as THREE.PlaneGeometry).parameters.width;
  const start = first.mesh.position.clone().addScaledVector(along, -wOf(first) / 2);
  const end = last.mesh.position.clone().addScaledVector(along, wOf(last) / 2);
  const len = start.distanceTo(end);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const hPanel = (first.mesh.geometry as THREE.PlaneGeometry).parameters.height;

  // ── as chamas e as brasas (um desenho cada, por frase) ──
  const viewH = { value: 400 };
  const setViewH = (renderer: THREE.WebGLRenderer) => {
    const rt = renderer.getRenderTarget();
    viewH.value = rt ? rt.height : renderer.domElement.height;
  };
  const uRun = { value: 0 };
  const uShow = { value: 0 };
  const fgeo = new THREE.BufferGeometry();
  fgeo.setAttribute('position', new THREE.Float32BufferAttribute(flamePts, 3));
  fgeo.setAttribute('aUnit', new THREE.Float32BufferAttribute(flameUnit, 1));
  fgeo.setAttribute('aPhase', new THREE.Float32BufferAttribute(flamePh, 1));
  fgeo.setAttribute('aSize', new THREE.Float32BufferAttribute(flameSz, 1));
  const flames = new THREE.Points(fgeo, new THREE.ShaderMaterial({ vertexShader: FLAME_VS, fragmentShader: FLAME_FS, uniforms: { uT, uRun, uShow, uViewH: viewH }, transparent: true, depthWrite: false }));
  flames.frustumCulled = false;
  flames.renderOrder = 5;
  flames.onBeforeRender = (renderer) => setViewH(renderer);
  kit.group.add(flames);
  const NS = Math.max(8, Math.round(len * 6));
  const sPts: number[] = [];
  const sUnit: number[] = [];
  const sPh: number[] = [];
  const sSp: number[] = [];
  for (let k = 0; k < NS && allPts.length; k++) {
    const a = allPts[Math.floor(r() * allPts.length)];
    sPts.push(a.p.x, a.p.y, a.p.z);
    sUnit.push(a.unit);
    sPh.push(r());
    sSp.push(0.6 + r() * 0.5);
  }
  const sgeo = new THREE.BufferGeometry();
  sgeo.setAttribute('position', new THREE.Float32BufferAttribute(sPts, 3));
  sgeo.setAttribute('aUnit', new THREE.Float32BufferAttribute(sUnit, 1));
  sgeo.setAttribute('aPhase', new THREE.Float32BufferAttribute(sPh, 1));
  sgeo.setAttribute('aSpeed', new THREE.Float32BufferAttribute(sSp, 1));
  const sparks = new THREE.Points(
    sgeo,
    new THREE.ShaderMaterial({
      vertexShader: SPARK_VS,
      fragmentShader: SPARK_FS,
      uniforms: { uT, uRun, uShow, uViewH: viewH, uAlong: { value: along.clone() }, uN: { value: n.clone() } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  sparks.frustumCulled = false;
  sparks.renderOrder = 6;
  sparks.onBeforeRender = (renderer) => setViewH(renderer);
  kit.group.add(sparks);

  // o halo quente (somado à parede), a fuligem (escurece), a fuligem VELHA (fixa, acima da frase) e o contorno de mira
  const plane = (w: number, h: number, mat: THREE.Material, off: number, order: number, up = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.copy(mid).addScaledVector(n, off);
    m.position.y += up;
    m.rotation.y = ry;
    m.renderOrder = order;
    kit.group.add(m);
    return m;
  };
  const haloMat = new THREE.MeshBasicMaterial({ map: softCapsule(), color: 0xff7a28, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  plane(len + o.size * 2.2, hPanel * 2.3, haloMat, -0.006, 0, hPanel * 0.15);
  const sootMat = new THREE.MeshBasicMaterial({ map: softCapsule(), color: 0x000000, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  plane(len + o.size * 1.4, hPanel * 1.6, sootMat, -0.004, 0, hPanel * 0.12);
  // a pedra lembra que ali já queimou: uma mancha velha e fraca de fuligem, mais alta que a frase (a fumaça sobe)
  const oldSoot = new THREE.MeshBasicMaterial({ map: softCapsule(), color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  plane(len * 0.95, hPanel * 1.3, oldSoot, -0.008, 0, hPanel * 0.55);
  // contorno: um retângulo de fio dourado, com as quinas reforçadas
  const OW = len + o.size * 1.1;
  const OH = hPanel * 1.05;
  const oc = document.createElement('canvas');
  oc.width = 512;
  oc.height = Math.max(48, Math.round((512 * OH) / OW));
  {
    const g = oc.getContext('2d')!;
    const th = 4;
    g.fillStyle = '#fff2c0';
    g.fillRect(0, 0, oc.width, th);
    g.fillRect(0, oc.height - th, oc.width, th);
    g.fillRect(0, 0, th, oc.height);
    g.fillRect(oc.width - th, 0, th, oc.height);
    const q = 22;
    for (const [x, y] of [[0, 0], [oc.width - q, 0], [0, oc.height - th * 2], [oc.width - q, oc.height - th * 2]]) g.fillRect(x, y, q, th * 2);
    for (const [x, y] of [[0, 0], [oc.width - th * 2, 0], [0, oc.height - q], [oc.width - th * 2, oc.height - q]]) g.fillRect(x, y, th * 2, q);
  }
  const ot = new THREE.CanvasTexture(oc);
  ot.magFilter = THREE.NearestFilter;
  ot.colorSpace = THREE.SRGBColorSpace;
  const outMat = new THREE.MeshBasicMaterial({ map: ot, color: 0xffd36b, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 });
  const outline = plane(OW, OH, outMat, 0.012, 4);
  outline.position.addScaledVector(along, -o.size * 0.15);
  // a BRASA ADORMECIDA: de vez em quando, um ponto no fundo de uma fissura reluz e se apaga
  const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: glintTexture(), transparent: true, opacity: 0, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
  glint.scale.setScalar(0.05 * sizeK);
  glint.visible = false;
  kit.group.add(glint);
  let glintT = -1 - r() * 4; // < 0: esperando; 0..GL: aceso
  const GL = 1.8;
  // uma luz de verdade (o motor empresta uma PointLight às mais fortes): o halo ilumina a parede e o chão em volta
  const em = kit.light(mid.x + n.x * 0.7, mid.y, mid.z + n.z * 0.7, 0xff8a30, 0);

  let lit = false;
  let run = 0; // símbolos já percorridos pelo fogo
  let show = 0; // 0..1 o traço aceso visível (esfria devagar ao apagar)
  let flameK = 0; // 0..1 as chamas (encolhem depressa ao apagar)
  let sootT = 0;
  let hlWant = false;
  let hl = 0;

  const redraw = (pi: number) => {
    const P = ps[pi];
    const g = P.g2;
    g.clearRect(0, 0, P.canvas.width, P.canvas.height);
    for (const gl of glyphs) {
      if (gl.panel !== pi || gl.f <= 0) continue;
      const cx = PAD + CELL * (gl.idx + 0.5);
      const cy = PAD + CELL / 2;
      const def = P.defs[gl.idx];
      // a brasa dentro da fissura: larga e clara (de longe, quem aparece são as camadas largas)
      drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#b8300a', gl.f, 11);
      drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#ff6a14', gl.f, 8);
      drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#ffae36', gl.f, 5);
      drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#ffe290', gl.f, 2);
      drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#fffbe6', gl.f, 0);
    }
    P.tex.needsUpdate = true;
    P.dirty = false;
  };
  const sync = () => {
    for (const gl of glyphs) {
      const f = Math.min(1, Math.max(0, run - gl.t0));
      if (Math.abs(f - gl.f) > 0.015 || (f === 1 && gl.f !== 1) || (f === 0 && gl.f !== 0)) {
        gl.f = f;
        ps[gl.panel].dirty = true;
      }
    }
    ps.forEach((P, i) => P.dirty && redraw(i));
  };

  const api: BurnLine = {
    start,
    end,
    set(on, instant = false) {
      if (on === lit && !instant) return;
      if (!on && lit && show > 0.3 && !instant) sootT = SOOT_S; // apagou: fica a fuligem
      lit = on;
      if (instant) {
        run = on ? total : 0;
        show = flameK = on ? 1 : 0;
        sootT = 0;
        sync();
      }
    },
    highlight(on) {
      hlWant = on;
    },
    update(dt, t) {
      uT.value = t;
      if (lit) {
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
      if (sootT > 0 && !o.hold?.()) sootT = Math.max(0, sootT - dt);
      const soot = Math.min(1, sootT / 0.7); // segura escura e clareia no fim
      const flick = 0.9 + 0.07 * Math.sin(t * 13 + mid.z * 3) + 0.03 * Math.sin(t * 31 + mid.x);
      // acesa: laranja vivo (> 1: o bloom pega); esfriando: vermelho-escuro
      const hot = lit ? 1 : show * show;
      for (const P of ps) {
        P.mat.opacity = Math.min(1, show * 1.4);
        P.mat.color.setRGB((0.55 + 1.25 * hot) * flick, (0.08 + 1.27 * hot) * flick, (0.03 + 1.07 * hot) * flick);
        P.base.color.setRGB(1, 1, 1).lerp(SOOT, soot);
        P.base.emissiveIntensity = 0;
      }
      uRun.value = run;
      uShow.value = flameK;
      const grow = Math.min(1, 0.2 + run / total);
      const k = flameK * flick;
      haloMat.opacity = 0.8 * k * grow;
      sootMat.opacity = 0.72 * soot;
      em.intensity = 14 * k * grow;
      // a brasa adormecida (só enquanto a frase espera, apagada e sem fuligem)
      const idle = !lit && show === 0 && soot === 0 && (o.idle?.() ?? true);
      if (glintT < 0) {
        glintT += dt;
        if (glintT >= 0) {
          if (idle && allPts.length) glint.position.copy(allPts[Math.floor(r() * allPts.length)].p).addScaledVector(n, -0.008);
          else glintT = -2 - r() * 3;
        }
      } else {
        glintT += dt;
        if (glintT > GL || !idle) glintT = -(4 + r() * 6);
      }
      const gk = glintT >= 0 ? Math.sin((Math.min(GL, glintT) / GL) * Math.PI) : 0;
      (glint.material as THREE.SpriteMaterial).opacity = 0.85 * gk * gk;
      glint.visible = gk > 0.01;
      // realce de mira
      hl += ((hlWant ? 1 : 0) - hl) * Math.min(1, dt * 14);
      hlWant = false;
      outMat.opacity = hl * (0.7 + 0.3 * Math.sin(t * 7));
      for (const p of panels) p.fire = show;
    },
    level: () => show,
    running: () => lit && run < total,
  };
  return api;
}
