// FRASE ACENDÍVEL (tabletes `lit` do construtor fire.ts): o que o jogador vê de uma frase que o dado de Fogo acende. DESIGN.md §53, §54 e §56.
//  · APAGADA: SEM BRILHO nenhum, mas legível: o sulco talhado preenchido de um branco MEIO AMARELADO (marfim), fosco, diferente do branco da
//    cal das escritas comuns (que brilha um pouco). Antes era fissura preta: confundia com o rejunte dos tijolos. A pedra só lembra, sem
//    brilhar, que ali já houve fogo: uma mancha velha de FULIGEM acima da frase.
//  · ACESA: o glifo continua NÍTIDO, no desenho exato, e BRILHA numa luz dourada meio mágica: a luz corre pelos sulcos do soquete até o fim da
//    frase, traço por traço (a ordem da escrita), e depois respira devagar, com um reflexo correndo ao longo dos traços; halo dourado na parede e
//    luz de verdade. (Antes havia chamas por cima das letras: deformavam o glifo e confundiam.)
//  · AO APAGAR (erro, punição): a luz esmaece em âmbar, e fica FULIGEM por ~2 s depois que a luz da sala volta.
//  · REALCE DE MIRA: um contorno dourado em volta da frase, enquanto a mira (com a face de Fogo) está sobre ela.
// De longe dá para contar quantas frases estão acesas: a luz e o halo ignoram a névoa.
import * as THREE from 'three';
import { drawGlyphPart, glyphSamples } from '../book/font';
import { glyphsOf } from '../story/lexicon';
import { CELL, GLYPH_SIZE, PAD } from './glyphcell';
import type { Inscription } from './inscription';
import type { Kit } from './kit';
import { canvasTexture, drawGlowGlyph, glowColor, glowStrokeMaterial, PER_GLYPH, rng, softCapsule } from './firefx';

const SOOT = new THREE.Color(0.25, 0.22, 0.21); // a escrita apagada pela Casa, enegrecida
const IVORY = '#ddd3b8'; // o branco meio amarelado (osso, pálido) da escrita que ainda não foi acesa
const MATTE = new THREE.Color(0.78, 0.77, 0.75); // fosco: sob luz quente ela não pode parecer acesa
const WORD_GAP = 0.35; // (em símbolos) a luz leva esse tempo para pular de uma palavra para a outra
const SOOT_S = 2.0; // quanto dura a fuligem

export interface BurnLine {
  readonly start: THREE.Vector3; // começo da frase (lado do soquete), local da sala, na face da parede
  readonly end: THREE.Vector3;
  set(lit: boolean, instant?: boolean): void;
  highlight(on: boolean): void; // chamar a cada quadro (o realce some sozinho se ninguém chamar)
  update(dt: number, t: number): void;
  level(): number; // 0..1: quanto ela aparenta acesa agora
  running(): boolean; // a luz ainda está correndo pelos sulcos
}

// `hold`: enquanto devolver true (o ESCURO da punição), a fuligem não começa a sumir: ela tem de ser vista quando a luz volta.
export function makeBurnLine(kit: Kit, ins: Inscription, o: { size: number; hold?: () => boolean; seed?: number }): BurnLine {
  ins.burnable = true;
  const n = ins.normal.clone().normalize();
  const ry = Math.atan2(n.x, n.z);
  const along = new THREE.Vector3(Math.cos(ry), 0, -Math.sin(ry)); // sentido da leitura
  const panels = ins.panels.filter((p) => p.id);
  const r = rng(o.seed ?? Math.round(Math.abs(ins.center.x * 131 + ins.center.y * 71 + ins.center.z * 37)));
  // cada símbolo: quando a luz chega nele
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
  const uT = { value: 0 };
  const phase = r() * 6.28;
  let unit = 0;
  panels.forEach((p, pi) => {
    const defs = glyphsOf(p.id!);
    const parts = Math.max(1, defs.length);
    const W = parts * CELL + PAD * 2;
    const H = CELL + PAD * 2;
    // ── a pedra: o sulco com o preenchimento MARFIM, fosco, no lugar da cal (a textura da palavra é trocada) ──
    const fc = document.createElement('canvas');
    fc.width = W;
    fc.height = H;
    const fg = fc.getContext('2d')!;
    defs.forEach((def, j) => {
      const cx = PAD + CELL * (j + 0.5);
      const cy = PAD + CELL / 2;
      drawGlyphPart(fg, def, cx, cy, GLYPH_SIZE, '#15110f', 1, 10); // o sulco (o contorno escuro separa a escrita da parede)
      drawGlyphPart(fg, def, cx, cy, GLYPH_SIZE, IVORY, 1, 5); // o preenchimento marfim
      // gasto: alguns pontinhos onde o marfim descascou (só textura; não muda o desenho)
      const sm = glyphSamples(def, cx, cy, GLYPH_SIZE, 9);
      fg.fillStyle = '#9c8a62';
      for (const q of sm) if (r() < 0.25) fg.fillRect(Math.round(q.x + (r() - 0.5) * 3), Math.round(q.y + (r() - 0.5) * 3), 2, 2);
    });
    const ftex = canvasTexture(fc);
    ftex.anisotropy = 4;
    p.mat.map = ftex;
    p.mat.emissiveMap = null;
    p.mat.emissiveIntensity = 0;
    p.mat.color.copy(MATTE);
    p.mat.needsUpdate = true;
    // ── a luz que corre: o traço aceso (desenhado aos poucos) por cima da fissura ──
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g2 = canvas.getContext('2d')!;
    const tex = canvasTexture(canvas);
    const mat = glowStrokeMaterial(tex, uT, phase + pi * 0.9);
    const m = new THREE.Mesh((p.mesh.geometry as THREE.PlaneGeometry).clone(), mat);
    m.position.copy(p.mesh.position).addScaledVector(n, 0.004);
    m.rotation.copy(p.mesh.rotation);
    m.renderOrder = 3;
    kit.group.add(m);
    defs.forEach((_, j) => {
      glyphs.push({ panel: pi, idx: j, t0: unit, f: 0 });
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

  // o halo dourado (somado à parede), a fuligem (escurece), a fuligem VELHA (fixa, acima da frase) e o contorno de mira
  const plane = (w: number, h: number, mat: THREE.Material, off: number, order: number, up = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.copy(mid).addScaledVector(n, off);
    m.position.y += up;
    m.rotation.y = ry;
    m.renderOrder = order;
    kit.group.add(m);
    return m;
  };
  const haloMat = new THREE.MeshBasicMaterial({ map: softCapsule(), color: 0xffb648, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  plane(len + o.size * 2.0, hPanel * 2.0, haloMat, -0.006, 0);
  const sootMat = new THREE.MeshBasicMaterial({ map: softCapsule(), color: 0x000000, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  plane(len + o.size * 1.4, hPanel * 1.6, sootMat, -0.004, 0, hPanel * 0.12);
  // a pedra lembra que ali já houve fogo: uma mancha velha e fraca de fuligem, mais alta que a frase (a fumaça sobe). Não brilha.
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
  // uma luz de verdade (o motor empresta uma PointLight às mais fortes): o halo ilumina a parede e o chão em volta
  const em = kit.light(mid.x + n.x * 0.7, mid.y, mid.z + n.z * 0.7, 0xffb050, 0);

  let lit = false;
  let run = 0; // símbolos já percorridos pela luz
  let show = 0; // 0..1 o traço aceso visível (esmaece ao apagar)
  let sootT = 0;
  let hlWant = false;
  let hl = 0;

  const redraw = (pi: number) => {
    const P = ps[pi];
    const g = P.g2;
    g.clearRect(0, 0, P.canvas.width, P.canvas.height);
    for (const gl of glyphs) {
      if (gl.panel !== pi || gl.f <= 0) continue;
      drawGlowGlyph(g, P.defs[gl.idx], PAD + CELL * (gl.idx + 0.5), PAD + CELL / 2, gl.f);
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
      uT.value = t;
      if (lit) {
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
      if (sootT > 0 && !o.hold?.()) sootT = Math.max(0, sootT - dt);
      const soot = Math.min(1, sootT / 0.7); // segura escura e clareia no fim
      const breathe = 0.92 + 0.08 * Math.sin(t * 1.9 + phase);
      for (const P of ps) {
        P.mat.opacity = Math.min(1, show * 1.3);
        glowColor(P.mat.color, lit ? 1 : show * show);
        P.base.color.copy(MATTE).lerp(SOOT, soot);
        P.base.emissiveIntensity = 0;
      }
      const grow = Math.min(1, 0.2 + run / total);
      haloMat.opacity = 0.5 * show * breathe * grow;
      sootMat.opacity = 0.72 * soot;
      em.intensity = 4 * show * breathe * grow; // (fraca: a luz não pode dourar as frases apagadas vizinhas)
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
