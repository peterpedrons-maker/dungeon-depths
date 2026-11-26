// A LUZ DOS GLIFOS (DESIGN.md §56): o que acontece com a escrita na pedra quando o Fogo a acende.
// Nada de chamas por cima das letras (deformavam o glifo e confundiam): o glifo continua NÍTIDO, no desenho exato, e passa a BRILHAR numa luz
// dourada, meio mágica. A luz aparece traço por traço, na ordem da escrita, e depois fica: um brilho calmo que respira e um reflexo que corre
// devagar ao longo dos traços. O brilho fica SÓ no desenho (sem faixa de luz atrás) e é contido, para os traços pequenos e os pontinhos não
// se misturarem (DESIGN.md §58).
// Usado pelas frases acendíveis (burnline.ts) e por QUALQUER palavra talhada cujo `fire` suba (inscription.ts → makeWordGlow): a frase da porta
// que acende com os braseiros, a Casa lendo a porta quando ela abre, as lousas, os rótulos que acendem quando o puzzle é resolvido...
import * as THREE from 'three';
import { drawGlyphPart } from '../book/font';
import { glyphsOf, type GlyphDef } from '../story/lexicon';
import { CELL, GLYPH_SIZE, PAD } from './glyphcell';

export const PER_GLYPH = 0.2; // segundos para a luz escrever um símbolo

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

// o símbolo ACESO, até a fração `f` da escrita: o traço dourado no desenho exato do glifo (da largura do sulco) e, em volta dele, um brilho
// macio e estreito (camadas cada vez mais largas e mais fracas) que segue o traço. Estreito de propósito: os glifos têm traços curtos e
// pontinhos próximos, e um brilho largo os junta.
export function drawGlowGlyph(g: CanvasRenderingContext2D, def: GlyphDef, cx: number, cy: number, f: number) {
  drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, 'rgba(255,205,120,0.05)', f, 13);
  drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, 'rgba(255,210,130,0.08)', f, 10);
  drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, 'rgba(255,215,140,0.12)', f, 7);
  drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#e8b84e', f, 4);
  drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#f6dc96', f, 2);
  drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#fff6dc', f, 0);
}

// o material do traço aceso: a luz RESPIRA devagar e um reflexo corre ao longo dos traços (`uT` = tempo, compartilhado)
export function glowStrokeMaterial(tex: THREE.Texture, uT: { value: number }, phase = 0) {
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 });
  const uPh = { value: phase };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uT = uT;
    sh.uniforms.uPh = uPh;
    sh.fragmentShader =
      'uniform float uT;\nuniform float uPh;\n' +
      sh.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        float sweep = pow(0.5 + 0.5 * sin(vMapUv.x * 5.0 - uT * 1.6 + uPh), 8.0);
        float breathe = 0.95 + 0.05 * sin(uT * 1.9 + uPh);
        diffuseColor.rgb *= breathe + 0.2 * sweep;`,
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
// O PULSO (DESIGN.md §59): o clarão ANDA com a escrita, da esquerda para a direita: cada símbolo clareia no instante em que a luz chega nele e
// assenta no brilho contido em ~0,75 s (uma onda que acompanha a luz). Não deforma o glifo e não deixa nada atrás da escrita.
export const PULSE_S = 0.75; // quanto o clarão de cada ponto dura (s)
// 0..1: a força do clarão `t` segundos depois de a luz passar (sobe em 0,06 s e cai suave)
export function pulseK(t: number) {
  if (t < 0 || t > PULSE_S) return 0;
  const up = Math.min(1, t / 0.06);
  const down = 1 - (t - 0.06) / (PULSE_S - 0.06);
  return t < 0.06 ? up : Math.max(0, down) ** 2;
}
const f1 = (v: number) => (Number.isInteger(v) ? v.toFixed(1) : String(v));

// o CLARÃO: uma camada de luz no formato exato dos traços (só um pouco mais larga e macia que eles), somada por cima. Desenhada uma vez por
// palavra; o shader acende cada ponto quando a luz passa por ele: `uRunV` = quantos símbolos a luz já percorreu desde que começou a escrever
// (continua contando depois do fim, para o clarão do último símbolo assentar), `base` = em que símbolo esta palavra começa.
export function makeFlashMesh(geo: THREE.PlaneGeometry, defs: GlyphDef[], W: number, H: number, uRunV: { value: number }, base: number) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  defs.forEach((def, j) => {
    const cx = PAD + CELL * (j + 0.5);
    const cy = PAD + CELL / 2;
    drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, 'rgba(255,214,140,0.22)', 1, 20);
    drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, 'rgba(255,222,160,0.32)', 1, 13);
    drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, 'rgba(255,236,190,0.55)', 1, 7);
    drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, 'rgba(255,250,232,0.9)', 1, 3);
  });
  const mat = new THREE.MeshBasicMaterial({ map: canvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 });
  const parts = Math.max(1, defs.length);
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uRunV = uRunV;
    sh.fragmentShader =
      `uniform float uRunV;
      float pulseAt(float s) {
        if (s < 0.0 || s > ${f1(PULSE_S)}) return 0.0;
        if (s < 0.06) return s / 0.06;
        float d = 1.0 - (s - 0.06) / ${f1(PULSE_S - 0.06)};
        return d * d;
      }
` +
      sh.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        float gx = (vMapUv.x * ${f1(W)} - ${f1(PAD)}) / ${f1(CELL)};
        float u = ${f1(base)} + clamp(gx, 0.0, ${f1(parts)});
        diffuseColor.a *= pulseAt((uRunV - u) * ${f1(PER_GLYPH)});`,
      );
  };
  const m = new THREE.Mesh(geo.clone(), mat);
  m.renderOrder = 4;
  m.visible = false;
  // visível só enquanto a onda passa por esta palavra
  return { mesh: m, update(on: boolean) { m.visible = on && uRunV.value > base - 0.1 && uRunV.value < base + parts + PULSE_S / PER_GLYPH + 0.1; } };
}

// a cor do traço: acesa = dourado luminoso (só um pouco acima de 1: o bloom dá um brilho leve, sem borrar o desenho); esfriando = âmbar apagado
export function glowColor(c: THREE.Color, hot: number, k = 1) {
  return c.setRGB((0.45 + 0.7 * hot) * k, (0.28 + 0.66 * hot) * k, (0.1 + 0.42 * hot) * k);
}

// ── A LUZ DE UMA PALAVRA TALHADA (cal): quando o `fire` dela sobe, a luz corre pelos sulcos, traço por traço, e a palavra brilha.
// `fire` parcial = brilho parcial (palavras que pulsam ou acendem aos poucos continuam pulsando); ela só "apaga" depois de 0,4 s abaixo de 0,05
// (um piscar rápido não recomeça a escrita). Ao apagar, a luz esmaece e some. ──
export interface WordGlow {
  update(fire: number, visible: boolean, dt: number, t: number): void;
}
export function makeWordGlow(mesh: THREE.Mesh, id: string, normal: THREE.Vector3, seed: number): WordGlow {
  const parent = mesh.parent!;
  const defs = glyphsOf(id);
  const parts = Math.max(1, defs.length);
  const W = parts * CELL + PAD * 2;
  const H = CELL + PAD * 2;
  const geo = mesh.geometry as THREE.PlaneGeometry;
  const n = normal.clone().normalize();
  const uT = { value: 0 };
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g2 = canvas.getContext('2d')!;
  const tex = canvasTexture(canvas);
  const mat = glowStrokeMaterial(tex, uT, rng(seed)() * 6.28);
  const over = new THREE.Mesh(geo.clone(), mat);
  over.position.copy(mesh.position).addScaledVector(n, 0.004);
  over.rotation.copy(mesh.rotation);
  over.renderOrder = 3;
  parent.add(over);
  const uRunV = { value: 1e6 };
  const flash = makeFlashMesh(geo, defs, W, H, uRunV, 0);
  flash.mesh.position.copy(mesh.position).addScaledVector(n, 0.006);
  flash.mesh.rotation.copy(mesh.rotation);
  parent.add(flash.mesh);

  const total = parts;
  const fs = defs.map(() => 0);
  let on = false;
  let offT = 0;
  let run = 0;
  let show = 0;
  let inten = 0;
  let runV = 1e6; // símbolos percorridos pela luz desde que ela começou a escrever (o clarão; 1e6 = nenhum)
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
    defs.forEach((def, j) => fs[j] > 0 && drawGlowGlyph(g2, def, PAD + CELL * (j + 0.5), PAD + CELL / 2, fs[j]));
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
        if (run === 0 && show === 0) runV = 0; // começou a escrever: começa a onda
        if (run < total) {
          run = Math.min(total, run + dt / PER_GLYPH);
          sync();
        }
        runV += dt / PER_GLYPH;
        show = 1;
      } else if (show > 0) {
        show = Math.max(0, show - dt / 0.6);
        if (show === 0 && run > 0) {
          run = 0;
          sync();
        }
      }
      const vis = visible && show > 0;
      over.visible = vis;
      uRunV.value = runV;
      flash.update(on && vis);
      if (!vis) return;
      const k = on ? Math.max(0.15, inten) : 1; // acesa pela metade (ou pulsando): a luz acompanha
      mat.opacity = Math.min(1, show * 1.3) * Math.min(1, k * 1.25);
      glowColor(mat.color, on ? 1 : show * show);
    },
  };
}
