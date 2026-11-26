// FRASE ACENDÍVEL (tabletes `lit` do construtor fire.ts): o que o jogador vê de uma frase que o dado de Fogo acende.
//  · APAGADA: pedra. Sulcos escuros e a cal fraca e fosca (lê-se de perto, mas está claramente apagada; não pega o brilho geral da cal).
//  · ACESA: o fogo CORRE pelos sulcos, do soquete até o fim da frase, traço por traço (a mesma ordem da escrita: moldura, ligações, pontos);
//    os glifos ficam laranja-dourado, com brilho forte (o bloom pega), e um halo quente se abre na parede, com uma luz de verdade.
//  · AO APAGAR (erro, punição): fuligem escura por ~2 s, e a frase volta a ser pedra.
//  · REALCE DE MIRA: um contorno dourado em volta da frase inteira, enquanto a mira (com a face de Fogo) está sobre ela.
// De longe dá para contar quantas frases estão acesas: o fogo e o halo ignoram a névoa.
import * as THREE from 'three';
import { drawGlyphPart } from '../book/font';
import { glyphsOf } from '../story/lexicon';
import { CELL, GLYPH_SIZE, PAD, type Inscription } from './inscription';
import type { Kit } from './kit';

const STONE = new THREE.Color(0.66, 0.62, 0.56); // cal apagada (multiplica a textura branca: fica cinza, fosca)
const SOOT = new THREE.Color(0.05, 0.045, 0.045);
const PER_GLYPH = 0.24; // segundos para o fogo escrever um símbolo
const WORD_GAP = 0.35; // (em símbolos) o fogo leva esse tempo para pular de uma palavra para a outra
const SOOT_S = 2.0; // quanto dura a fuligem

let haloTex: THREE.CanvasTexture | null = null;
// mancha macia em cápsula (halo e fuligem): branca, a cor vem do material
function softCapsule() {
  if (haloTex) return haloTex;
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
  haloTex = new THREE.CanvasTexture(c);
  return haloTex;
}

export interface BurnLine {
  readonly start: THREE.Vector3; // começo da frase (lado do soquete), local da sala, na face da parede
  readonly end: THREE.Vector3;
  set(lit: boolean, instant?: boolean): void;
  highlight(on: boolean): void; // chamar a cada quadro (o realce some sozinho se ninguém chamar)
  update(dt: number, t: number): void;
  level(): number; // 0..1: quanto ela aparenta acesa agora
  running(): boolean; // o fogo ainda está correndo pelos sulcos
}

// `hold`: enquanto devolver true (o ESCURO da punição), a fuligem não começa a sumir: ela tem de ser vista quando a luz volta
export function makeBurnLine(kit: Kit, ins: Inscription, o: { size: number; hold?: () => boolean }): BurnLine {
  ins.burnable = true;
  const n = ins.normal.clone().normalize();
  const ry = Math.atan2(n.x, n.z);
  const along = new THREE.Vector3(Math.cos(ry), 0, -Math.sin(ry)); // sentido da leitura
  const panels = ins.panels.filter((p) => p.id);
  // cada símbolo: onde fica (local da sala) e quando o fogo chega nele
  interface G {
    panel: number;
    idx: number;
    pos: THREE.Vector3;
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
  let unit = 0;
  panels.forEach((p, pi) => {
    const defs = glyphsOf(p.id!);
    const parts = Math.max(1, defs.length);
    const W = parts * CELL + PAD * 2;
    const H = CELL + PAD * 2;
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
    const geo = (p.mesh.geometry as THREE.PlaneGeometry).clone();
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(p.mesh.position).addScaledVector(n, 0.004);
    m.rotation.copy(p.mesh.rotation);
    m.renderOrder = 3;
    kit.group.add(m);
    const pw = (p.mesh.geometry as THREE.PlaneGeometry).parameters.width;
    const pxm = pw / W;
    defs.forEach((_, j) => {
      const lx = (PAD + CELL * (j + 0.5) - W / 2) * pxm;
      glyphs.push({ panel: pi, idx: j, pos: p.mesh.position.clone().addScaledVector(along, lx), t0: unit, f: 0 });
      unit += 1;
    });
    unit += WORD_GAP;
    p.mat.color.copy(STONE);
    p.mat.emissiveIntensity = 0;
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

  // o halo quente (somado à parede), a fuligem (escurece) e o contorno de mira
  const plane = (w: number, h: number, mat: THREE.Material, off: number, order: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.copy(mid).addScaledVector(n, off);
    m.rotation.y = ry;
    m.renderOrder = order;
    kit.group.add(m);
    return m;
  };
  const haloMat = new THREE.MeshBasicMaterial({ map: softCapsule(), color: 0xff7a28, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  plane(len + o.size * 2.2, hPanel * 2.1, haloMat, -0.006, 0);
  const sootMat = new THREE.MeshBasicMaterial({ map: softCapsule(), color: 0x000000, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  plane(len + o.size * 1.4, hPanel * 1.6, sootMat, -0.004, 0);
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
  // a cabeça do fogo: uma chaminha que corre de símbolo em símbolo
  const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.frames[0], fog: false, alphaTest: 0.5, depthWrite: false }));
  head.scale.set(o.size * 0.55, o.size * 0.5, 1);
  head.visible = false;
  kit.group.add(head);
  // uma luz de verdade (o motor empresta uma PointLight às mais fortes): o halo ilumina a parede e o chão em volta
  const em = kit.light(mid.x + n.x * 0.7, mid.y, mid.z + n.z * 0.7, 0xff8a30, 0);

  let lit = false;
  let run = 0; // símbolos já percorridos pelo fogo
  let show = 0; // 0..1 o fogo visível (some depressa ao apagar)
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
      // traço GROSSO e claro (de longe, o miolo fino some: quem aparece a 10 m são as camadas largas)
      drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#c8380c', gl.f, 13); // a borda da brasa
      drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#ff7a1a', gl.f, 10);
      drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#ffb43c', gl.f, 6);
      drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#ffe48a', gl.f, 3);
      drawGlyphPart(g, def, cx, cy, GLYPH_SIZE, '#fffbe6', gl.f, 0); // o miolo, quase branco
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
        show = on ? 1 : 0;
        sootT = 0;
        sync();
      }
    },
    highlight(on) {
      hlWant = on;
    },
    update(dt, t) {
      if (lit) {
        if (run < total) {
          run = Math.min(total, run + dt / PER_GLYPH);
          sync();
        }
        show = 1;
      } else if (show > 0) {
        show = Math.max(0, show - dt / 0.3);
        if (show === 0 && run > 0) {
          run = 0;
          sync();
        }
      }
      if (sootT > 0 && !o.hold?.()) sootT = Math.max(0, sootT - dt);
      const soot = Math.min(1, sootT / 0.7); // segura escura e clareia no fim
      const flick = 0.88 + 0.08 * Math.sin(t * 13 + mid.z * 3) + 0.04 * Math.sin(t * 31 + mid.x);
      const k = show * flick;
      for (const P of ps) {
        P.mat.opacity = show;
        P.mat.color.setRGB(1.6 * flick + 0.2, 1.35 * flick, 1.1 * flick); // >1: o bloom pega
        P.base.color.copy(STONE).lerp(SOOT, soot);
        P.base.emissiveIntensity = 0;
      }
      const grow = Math.min(1, 0.2 + run / total);
      haloMat.opacity = 0.8 * k * grow;
      sootMat.opacity = 0.7 * soot;
      em.intensity = 14 * k * grow;
      // a chaminha que corre
      head.visible = lit && run < total;
      if (head.visible) {
        const i = Math.min(glyphs.length - 1, glyphs.findIndex((gl) => run < gl.t0 + 1) < 0 ? glyphs.length - 1 : glyphs.findIndex((gl) => run < gl.t0 + 1));
        const gl = glyphs[i];
        const nx = glyphs[i + 1];
        const u = Math.min(1, Math.max(0, run - gl.t0));
        head.position.copy(gl.pos).lerp(nx ? nx.pos : gl.pos, nx ? Math.max(0, u - 0.6) / 0.4 : 0).addScaledVector(n, 0.08);
        head.position.y += o.size * 0.18;
        head.material.map = kit.frames[Math.floor(t * 12) % kit.frames.length];
      }
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
