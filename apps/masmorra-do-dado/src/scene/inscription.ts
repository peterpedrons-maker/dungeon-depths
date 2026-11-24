// Inscrições dos Contáveis nas paredes: sulco talhado na pedra, preenchido de cal branca e gasto
// pelo tempo (ver DESIGN.md §8). Cada palavra é um painel próprio, o que permite escrevê-las uma a uma
// (cena do Escrivão) e acendê-las aos poucos conforme o jogador aprende a ler.
// Quando o jogador olha pra uma inscrição por um instante, os símbolos vão pro diário como "avistados".

import * as THREE from 'three';
import { drawGlyph } from '../book/font';
import { glyphsOf } from '../story/lexicon';

const CELL = 96; // pixels por símbolo
const PAD = 14;
const CAL = '#f1ebd9';
const SULCO = '#15110f';

export interface InscribeOpts {
  words: (string | null)[]; // ids do léxico; null = lacuna lisa onde o jogador escreve com o giz
  x: number;
  y: number;
  z: number;
  nx: number; // para onde a parede "olha" (de onde se lê)
  nz: number;
  size?: number; // altura de um símbolo, em metros
  age?: number; // 0 = nítida, 1 = muito gasta
  seed?: number;
  hidden?: boolean; // começa invisível (será escrita por uma cena)
  frame?: boolean; // moldura talhada em volta de cada símbolo (rótulo de pedestal)
  plaque?: boolean; // moldura talhada em volta da FRASE inteira (tablete confirmado)
  lead?: boolean; // ornamento de ABERTURA: um losango talhado antes da 1ª palavra (marca onde a frase começa; não é palavra)
}

export interface InscriptionPanel {
  id: string | null; // null = lacuna
  mesh: THREE.Mesh;
  mat: THREE.MeshLambertMaterial;
  fire?: number; // 0..1: a palavra foi acesa pelo Fogo (brilha laranja)
}

export interface Inscription {
  words: string[]; // só as palavras de verdade (sem lacunas)
  center: THREE.Vector3; // coordenadas locais da sala
  normal: THREE.Vector3;
  panels: InscriptionPanel[];
  read: boolean; // já foi lida (foi pro diário)
  seeT: number; // tempo seguido olhando pra ela
  hidden: boolean; // ainda não foi escrita
  gap?: THREE.Mesh; // a lacuna (superfície de giz), se houver
  setReveal(i: number, v: number): void; // v 0..1 do painel i
  extras: THREE.MeshLambertMaterial[]; // molduras (acompanham o brilho)
  setGlow(v: number): void; // brilho da cal (cresce conforme o jogador aprende)
  reveal(): void; // mostra tudo
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

function tex(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter; // de longe o traço fino se perderia no filtro pixelado
  t.generateMipmaps = true;
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// uma palavra talhada: sulco escuro com a cal por dentro, falhas conforme a idade
function wordCanvas(id: string, age: number, seed: number, frame = false): { c: HTMLCanvasElement; parts: number } {
  const glyphs = glyphsOf(id);
  const parts = Math.max(1, glyphs.length);
  const c = document.createElement('canvas');
  c.width = parts * CELL + PAD * 2;
  c.height = CELL + PAD * 2;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  const size = (CELL / 0.86) * 0.94;
  const draw = (dx: number, dy: number, color: string) =>
    glyphs.forEach((g, i) => drawGlyph(ctx, g, Math.round(PAD + CELL * (i + 0.5) + dx), Math.round(PAD + CELL / 2 + dy), size, color));
  // sulco: o traço engordado em volta (bem grosso: a escrita precisa aparecer a 5 m, na tela de ~200 linhas)
  const ring = (rad: number, color: string) => {
    for (let a = 0; a < 16; a++) draw(Math.round(Math.cos((a / 16) * Math.PI * 2) * rad), Math.round(Math.sin((a / 16) * Math.PI * 2) * rad), color);
  };
  ring(5, SULCO);
  ring(4, SULCO);
  // cal por dentro
  ring(2.5, CAL);
  draw(0, 0, CAL);
  if (frame) {
    // moldura quadrada (rótulo): sulco largo com um fio de cal no meio
    const x0 = PAD + 2;
    const y0 = PAD + 2;
    const s = CELL * parts - 4;
    const h = CELL - 4;
    const edge = (color: string, t: number) => {
      ctx.fillStyle = color;
      ctx.fillRect(x0 - t / 2, y0 - t / 2, s + t, t);
      ctx.fillRect(x0 - t / 2, y0 + h - t / 2, s + t, t);
      ctx.fillRect(x0 - t / 2, y0 - t / 2, t, h + t);
      ctx.fillRect(x0 + s - t / 2, y0 - t / 2, t, h + t);
    };
    edge(SULCO, 9);
    edge(CAL, 3);
  }
  // desgaste: a cal descascou em pontos, e ficou manchada
  const r = rng(seed);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const o = (y * c.width + x) * 4;
      if (d[o + 3] === 0 || d[o] < 180) continue; // só a cal
      const rr = r();
      // manchas em blocos (a tinta some em lascas, não em pontos soltos)
      const blot = Math.sin(x * 0.19 + seed) * Math.sin(y * 0.23 - seed * 0.7) > 0.55 - age * 0.5;
      if (rr < age * 0.28 || (blot && rr < 0.55)) {
        d[o] = 22;
        d[o + 1] = 17;
        d[o + 2] = 15;
      } else if (rr < age * 0.5) {
        d[o] = 186;
        d[o + 1] = 176;
        d[o + 2] = 154;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return { c, parts };
}

// ornamento de abertura: losango talhado com um ponto no meio (sulco escuro + cal), como um "início" da frase
function leadCanvas(): HTMLCanvasElement {
  const n = 64;
  const c = document.createElement('canvas');
  c.width = n;
  c.height = n;
  const g = c.getContext('2d')!;
  const diamond = (r: number, color: string) => {
    g.fillStyle = color;
    for (let y = -r; y <= r; y++) g.fillRect(n / 2 - (r - Math.abs(y)), n / 2 + y, 2 * (r - Math.abs(y)) + 1, 1);
  };
  diamond(24, SULCO);
  diamond(19, CAL);
  diamond(14, SULCO);
  diamond(5, CAL);
  return c;
}

// lacuna lisa: pedra polida emoldurada por um filete, esperando o giz
function gapCanvas(): HTMLCanvasElement {
  const n = CELL + PAD * 2;
  const c = document.createElement('canvas');
  c.width = n;
  c.height = n;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = SULCO;
  ctx.fillRect(PAD - 6, PAD - 6, CELL + 12, CELL + 12);
  ctx.fillStyle = '#6b6870';
  ctx.fillRect(PAD - 2, PAD - 2, CELL + 4, CELL + 4);
  ctx.fillStyle = '#585560';
  ctx.fillRect(PAD, PAD, CELL, CELL);
  return c;
}

export function makeInscription(group: THREE.Group, o: InscribeOpts, surfaces: THREE.Object3D[]): Inscription {
  const size = o.size ?? 0.5;
  const age = o.age ?? 0.3;
  const seed = o.seed ?? 7;
  const ry = Math.atan2(o.nx, o.nz);
  const pxm = size / CELL; // metros por pixel
  const GAP = size * 0.55; // espaço entre palavras

  interface Item {
    id: string | null;
    c: HTMLCanvasElement;
  }
  const leadW = o.lead ? size * 0.85 : 0;
  const items: Item[] = o.words.map((w, i) => (w ? { id: w, c: wordCanvas(w, age, seed + i * 31, !!o.frame).c } : { id: null, c: gapCanvas() }));
  const widths = items.map((it) => it.c.width * pxm);
  const total = widths.reduce((a, b) => a + b, 0) + GAP * (items.length - 1) + (o.lead ? leadW + GAP : 0);
  const h = (CELL + PAD * 2) * pxm;

  const normal = new THREE.Vector3(o.nx, 0, o.nz).normalize();
  const center = new THREE.Vector3(o.x, o.y, o.z);
  const panels: InscriptionPanel[] = [];
  let cursor = -total / 2;
  let gap: THREE.Mesh | undefined;
  let leadMat: THREE.MeshLambertMaterial | null = null;
  if (o.lead) {
    const t = tex(leadCanvas());
    leadMat = new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.02, depthWrite: false, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    const lm = new THREE.Mesh(new THREE.PlaneGeometry(leadW, leadW), leadMat);
    const lx = cursor + leadW / 2;
    lm.position.set(o.x + Math.cos(ry) * lx, o.y, o.z - Math.sin(ry) * lx);
    lm.rotation.y = ry;
    lm.renderOrder = 1;
    lm.visible = !o.hidden;
    group.add(lm);
    cursor += leadW + GAP;
  }
  items.forEach((it, i) => {
    const w = widths[i];
    const t = tex(it.c);
    const mat = new THREE.MeshLambertMaterial({
      map: t,
      transparent: true,
      alphaTest: 0.02,
      depthWrite: false,
      emissive: 0xffffff,
      emissiveMap: it.id ? t : null,
      emissiveIntensity: 0,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -4,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    // posição ao longo da parede (eixo local x do painel)
    const lx = cursor + w / 2;
    mesh.position.set(o.x + Math.cos(ry) * lx, o.y, o.z - Math.sin(ry) * lx);
    mesh.rotation.y = ry;
    mesh.renderOrder = 1;
    mesh.visible = !o.hidden;
    group.add(mesh);
    if (!it.id) {
      gap = mesh;
      surfaces.push(mesh); // dá pra riscar com o giz
      mat.depthWrite = true;
      mat.transparent = false;
    }
    panels.push({ id: it.id, mesh, mat });
    cursor += w + GAP;
  });

  // moldura da frase inteira: sulco largo com um fio de cal, e um segundo fio por dentro
  let plaqueMat: THREE.MeshLambertMaterial | null = null;
  if (o.plaque) {
    const W = total + size * 0.5;
    const Hh = h + size * 0.25;
    const cw = 512;
    const ch = Math.max(64, Math.round((cw * Hh) / W));
    const c = document.createElement('canvas');
    c.width = cw;
    c.height = ch;
    const g = c.getContext('2d')!;
    const rect = (x: number, y: number, w: number, hh: number, t: number, color: string) => {
      g.fillStyle = color;
      g.fillRect(x - t / 2, y - t / 2, w + t, t);
      g.fillRect(x - t / 2, y + hh - t / 2, w + t, t);
      g.fillRect(x - t / 2, y - t / 2, t, hh + t);
      g.fillRect(x + w - t / 2, y - t / 2, t, hh + t);
    };
    rect(10, 10, cw - 20, ch - 20, 12, SULCO);
    rect(10, 10, cw - 20, ch - 20, 5, CAL);
    rect(24, 24, cw - 48, ch - 48, 4, CAL);
    const t = tex(c);
    plaqueMat = new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.02, depthWrite: false, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh), plaqueMat);
    pm.position.set(o.x + Math.sin(ry) * 0.004, o.y, o.z + Math.cos(ry) * 0.004);
    pm.rotation.y = ry;
    pm.renderOrder = 0;
    pm.visible = !o.hidden;
    group.add(pm);
  }

  const ins: Inscription = {
    words: o.words.filter((w): w is string => !!w),
    center,
    normal,
    panels,
    read: false,
    seeT: 0,
    hidden: !!o.hidden,
    gap,
    setReveal(i, v) {
      const p = panels[i];
      if (!p || !p.id) return;
      p.mesh.visible = v > 0.01;
      p.mat.opacity = Math.min(1, v);
      p.mat.transparent = true;
    },
    extras: [...(plaqueMat ? [plaqueMat] : []), ...(leadMat ? [leadMat] : [])],
    setGlow(v) {
      for (const p of panels) {
        if (!p.id) continue;
        const f = p.fire ?? 0;
        p.mat.emissive.setRGB(1, 1 - 0.5 * f, 1 - 0.85 * f); // acesa: a cal vira brasa
        p.mat.emissiveIntensity = v + 1.15 * f;
      }
      for (const m of ins.extras) m.emissiveIntensity = v;
    },
    reveal() {
      ins.hidden = false;
      panels.forEach((p) => {
        p.mesh.visible = true;
        p.mat.opacity = 1;
      });
    },
  };
  return ins;
}
