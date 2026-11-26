// A LUZ DOS GLIFOS (DESIGN.md §56): o que acontece com a escrita na pedra quando o Fogo a acende.
// Nada de chamas por cima das letras (deformavam o glifo e confundiam): o glifo continua NÍTIDO, no desenho exato, e passa a BRILHAR numa luz
// dourada, meio mágica. A luz aparece traço por traço, na ordem da escrita, e depois fica: um brilho calmo que respira e um reflexo que corre
// devagar ao longo dos traços, com um halo quente na pedra em volta.
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

// o símbolo ACESO, até a fração `f` da escrita: o traço no desenho exato do glifo (só um pouco mais largo que o sulco), luz dourada com o miolo
// quase branco
// EM TESTE (`?glifo=suave` no endereço): sem a faixa de luz (halo) atrás da frase; o brilho fica SÓ no desenho do glifo, um brilho macio
// que acompanha o traço (camadas cada vez mais largas e mais fracas em volta dele)
export const GLOW_SOFT = typeof location !== 'undefined' && new URLSearchParams(location.search).get('glifo') === 'suave';
export const HALO_K = GLOW_SOFT ? 0 : 1; // quanto do halo retangular aparece
export function drawGlowGlyph(g: CanvasRenderingContext2D, def: GlyphDef, cx: number, cy: number, f: number) {
  if (GLOW_SOFT) {
    // o brilho em volta do traço: 4 camadas, da mais larga e fraca à mais estreita (cabe na margem PAD da célula)
    drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, 'rgba(255,200,110,0.06)', f, 22);
    drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, 'rgba(255,205,120,0.08)', f, 17);
    drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, 'rgba(255,210,130,0.11)', f, 13);
    drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, 'rgba(255,215,140,0.16)', f, 10);
    drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#ffd060', f, 6); // (no modo suave, o traço em si é dourado até a borda, sem o laranja)
    drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#ffeeb8', f, 3);
    drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#fffdf2', f, 0);
    return;
  }
  drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, 'rgba(255,170,60,0.55)', f, 8); // a borda da luz, macia
  drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#ffc24a', f, 5);
  drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#ffe9a8', f, 2);
  drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#fffdf2', f, 0);
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
        float breathe = 0.9 + 0.1 * sin(uT * 1.9 + uPh);
        diffuseColor.rgb *= breathe + 0.55 * sweep;`,
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
// a cor do traço: acesa = dourado luminoso (> 1: o bloom faz o brilho); esfriando = âmbar apagado
export function glowColor(c: THREE.Color, hot: number, k = 1) {
  return c.setRGB((0.5 + 1.05 * hot) * k, (0.3 + 0.95 * hot) * k, (0.12 + 0.6 * hot) * k);
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
  const pw = geo.parameters.width;
  const ph = geo.parameters.height;
  const size = ph * (CELL / H);
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
  // o halo dourado na pedra, atrás da palavra
  const haloMat = new THREE.MeshBasicMaterial({ map: softCapsule(), color: 0xffb648, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(pw + size * 0.8, ph * 1.7), haloMat);
  halo.position.copy(mesh.position).addScaledVector(n, -0.004);
  halo.rotation.copy(mesh.rotation);
  parent.add(halo);

  const total = parts;
  const fs = defs.map(() => 0);
  let on = false;
  let offT = 0;
  let run = 0;
  let show = 0;
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
        if (run < total) {
          run = Math.min(total, run + dt / PER_GLYPH);
          sync();
        }
        show = 1;
      } else if (show > 0) {
        show = Math.max(0, show - dt / 0.6);
        if (show === 0 && run > 0) {
          run = 0;
          sync();
        }
      }
      const vis = visible && show > 0;
      over.visible = halo.visible = vis;
      if (!vis) return;
      const k = on ? Math.max(0.15, inten) : 1; // acesa pela metade (ou pulsando): a luz acompanha
      mat.opacity = Math.min(1, show * 1.3) * Math.min(1, k * 1.25);
      glowColor(mat.color, on ? 1 : show * show);
      haloMat.opacity = HALO_K * 0.45 * show * k * Math.min(1, 0.25 + run / total);
    },
  };
}
