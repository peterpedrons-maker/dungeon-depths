import { LOAD_BAR } from '../story/loading';
import { glyphsOf, type GlyphDef } from '../story/lexicon';
import { drawGlyphPart, glyphSamples } from '../book/font';
import { pulseK } from '../scene/firefx';
import { drawChalk, type DrawKind } from '../scene/chalkdraw';
import { dieFaceCanvas, dieRostoCanvas, type RostoLook } from '../scene/textures';
import type { RostoMove } from '../scene/dielife';
import { FACES } from '../faces';
import { bayer, rnd, wallBase } from './chalkart';

// O FUNDO DA TELA DE CARREGAMENTO (pedidos do Pedro, DESIGN.md §79 e §81): uma parede das salas no escuro e uma bancada de pedra embaixo.
// - A BARRA é uma FRASE TALHADA numa laje da parede, como as frases que o dado de Fogo acende nos puzzles (scene/burnline.ts): apagada, o sulco
//   preenchido de marfim, fosco; conforme carrega, a LUZ DOURADA corre pelos sulcos traço a traço, na ordem da escrita, símbolo por símbolo, com o
//   clarão que anda junto (o pulso de §59) e a nota de celesta e harpa de cada símbolo (a mesma do jogo). A frase é a do Escrivão na cena do poço,
//   «EU DAR DADO · VOCÊ LER». A luz dos símbolos acesos clareia a parede em volta. (Antes era uma canaleta de fogo com cinco braseiros em cima;
//   o Pedro achou os braseiros estranhos.)
// - Na parede, OS DESENHOS A GIZ dos condenados (os mesmos das paredes do jogo, scene/chalkdraw.ts): no escuro quase somem; aparecem com a luz
//   da frase (a porta, a contagem dos dias, o dado, a luz do poço); quem passa de capuz fica dentro da fresta de luz fria, que desce do alto à
//   esquerda com poeira boiando, e se vê desde o começo.
// - No canto, O DADO EM 2D, em pixel, com o rosto vivo (o mesmo de dielife.ts: olha a ponta da luz e o desenho que acabou de aparecer, pisca,
//   mexe as sobrancelhas, suspira), na bancada, aquecido pela luz; no clique de começar, sai pulando pela direita.
// Pintado num canvas no tamanho de pixel do jogo; a cena o usa no pós-processo (a paleta e o pontilhado do jogo).

export interface DieLook {
  dx: number;
  dy: number;
  look: RostoMove;
}
interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}
type RGB = [number, number, number];
// a frase: as palavras (ids do léxico); a luz leva WORD_GAP "símbolos" para pular de uma palavra para a outra (como nas frases do jogo)
const PHRASE = ['eu', 'dar', 'dado', 'voce', 'ler'];
const WORD_GAP = 0.35;
// os desenhos na parede: posição e altura em "alturas de tela" (pensado para 16:9; em telas mais estreitas, tudo encolhe junto)
const WALL_ART: { kind: DrawKind; x: number; y: number; h: number; w?: number; seed: number; days?: number }[] = [
  { kind: 'figura', x: 0.4, y: 0.06, h: 0.34, seed: 3 },
  { kind: 'poco', x: 1.0, y: 0.13, h: 0.32, seed: 4 },
  { kind: 'porta', x: 0.03, y: 0.33, h: 0.32, seed: 5 },
  { kind: 'contagem', x: 0.5, y: 0.52, h: 0.13, w: 0.32, seed: 6, days: 17 },
  { kind: 'dado', x: 0.86, y: 0.38, h: 0.27, seed: 7 },
];

// o rosto da vida do dado → o desenho (igual a scene.ts/updateRostos)
const rostoOf = (lk: RostoMove): RostoLook => ({
  ex: Math.round(lk.x * 5),
  ey: Math.round(-lk.y * 4),
  by: Math.round(-lk.brow * 3),
  closed: lk.closed,
  mo: Math.round(lk.mouth * 4),
  mx: Math.round(lk.mx * 2),
  mw: Math.round(lk.mw * 3),
  sq: Math.round(lk.squint * 3),
  nose: lk.nose,
  bl: Math.round(lk.bl * 1.45),
  br: Math.round(lk.br * 1.45),
  sd: Math.round(lk.side * 4),
  ir: lk.iris < -0.5 ? -1 : 0,
});
const pixels = (c: HTMLCanvasElement) => c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;

export function makeLoadArt() {
  const canvas = document.createElement('canvas');
  const g = canvas.getContext('2d')!;
  let W = 0;
  let H = 0;
  let wall = new Float32Array(0);
  let beam = new Float32Array(0); // a fresta fria (fixa)
  let lmaps: Float32Array[] = []; // a luz de cada símbolo da frase na parede (fixa; a força muda por quadro)
  let art = new Uint8ClampedArray(0); // os desenhos a giz na parede (RGBA)
  let artAt: { x: number; y: number }[] = []; // o centro de cada desenho (px)
  let img: ImageData | null = null;
  let t = 0;
  const r = rnd(5);
  let by = 0; // o alto da bancada
  // ── a frase ──
  const defs: { def: GlyphDef; t0: number }[] = []; // cada símbolo e quando a luz chega nele (em "símbolos" desde o começo)
  {
    let u = 0;
    PHRASE.forEach((w, wi) => {
      if (wi) u += WORD_GAP;
      for (const def of glyphsOf(w)) {
        defs.push({ def, t0: u });
        u += 1;
      }
    });
  }
  const total = defs.length ? defs[defs.length - 1].t0 + 1 : 1;
  let gs = 20; // o lado de um símbolo (px)
  let gSize = 23; // o `size` de drawGlyphPart para esse lado
  let gx: number[] = []; // o centro x de cada símbolo
  let gy = 0;
  let slab = { x0: 0, y0: 0, x1: 0, y1: 0 }; // a laje
  let ink = new Uint8ClampedArray(0); // o sulco e o marfim (RGBA, a tela toda)
  let gOf = new Int8Array(0); // de que símbolo é cada coluna da laje (-1 = nenhum)
  let samples: { x: number; y: number; u: number }[][] = []; // pontos ao longo dos traços (a ponta da luz)
  const litC = document.createElement('canvas');
  const litG = litC.getContext('2d', { willReadFrequently: true })!;
  let litPx = new Uint8ClampedArray(0);
  let litKey = '';
  let front = 0; // até onde a luz chegou (em símbolos)
  let reached = -1; // o último símbolo em que a luz já chegou
  const arrive: number[] = []; // quando (t) a luz chegou em cada símbolo
  let doneT = -1; // a frase inteira acesa há quanto tempo (s); -1 = ainda não
  let focus = -1; // o desenho que a luz do último símbolo iluminou
  let headX = 0;
  let headY = 0;
  let dieX = 0;
  let dieY = 0;
  const motes: Mote[] = []; // o pó de luz que sobe da ponta
  const dust: { u: number; v: number; s: number; ph: number }[] = [];
  for (let i = 0; i < 40; i++) dust.push({ u: Math.random(), v: Math.random(), s: 0.004 + Math.random() * 0.01, ph: Math.random() * 6.3 });
  // as faces do dado 2D: a da frente é o rosto (refeito quando o olhar muda), a de cima e a da esquerda são fixas
  const accent = FACES[2].color;
  const topPx = pixels(dieFaceCanvas(1, FACES[0].color, false));
  const sidePx = pixels(dieFaceCanvas(2, FACES[1].color, false));
  let faceKey = '';
  let facePx: Uint8ClampedArray = new Uint8ClampedArray(64 * 64 * 4);
  let glowPx: Uint8ClampedArray = new Uint8ClampedArray(64 * 64 * 4);

  const fx0 = () => W * 0.42;
  const fx1 = () => W * 0.16;
  const fw = () => W * 0.1;
  const fOf = (i: number) => Math.max(0, Math.min(1, front - defs[i].t0));

  const resize = (w: number, h: number) => {
    if (w === W && h === H) return;
    W = w;
    H = h;
    canvas.width = W;
    canvas.height = H;
    wall = wallBase(W, H, H > 300 ? 2 : 1);
    img = g.createImageData(W, H);
    by = Math.round(LOAD_BAR.ledge * H);
    // a frase: o maior símbolo que cabe na faixa (pela altura e pela largura)
    const span = (LOAD_BAR.x1 - LOAD_BAR.x0) * W;
    const units = defs.length + (defs.length - PHRASE.length) * 0.3 + (PHRASE.length - 1) * 0.9;
    gs = Math.max(11, Math.min(Math.round(H * 0.088), Math.floor(span / units)));
    gSize = gs / (112 / 130);
    let x = 0;
    gx = [];
    PHRASE.forEach((wd, wi) => {
      if (wi) x += gs * 0.9;
      glyphsOf(wd).forEach((_, j) => {
        if (j) x += gs * 0.3;
        gx.push(x + gs / 2);
        x += gs;
      });
    });
    const off = Math.round(((LOAD_BAR.x0 + LOAD_BAR.x1) / 2) * W - x / 2);
    gx = gx.map((v) => Math.round(v + off));
    gy = Math.round(LOAD_BAR.y * H);
    const pad = Math.max(4, Math.round(gs * 0.42));
    slab = { x0: off - pad, y0: gy - Math.round(gs / 2) - pad, x1: off + Math.round(x) + pad, y1: gy + Math.round(gs / 2) + pad };
    // o sulco (escuro, um pouco mais largo) e o marfim por cima, desenhados uma vez
    const ic = document.createElement('canvas');
    ic.width = W;
    ic.height = H;
    const icg = ic.getContext('2d')!;
    defs.forEach((d, i) => drawGlyphPart(icg, d.def, gx[i], gy, gSize, '#15110f', 1, 2));
    defs.forEach((d, i) => drawGlyphPart(icg, d.def, gx[i], gy, gSize, '#ddd3b8', 1, 1));
    ink = new Uint8ClampedArray(icg.getImageData(0, 0, W, H).data);
    // gasto: alguns pontinhos onde o marfim descascou
    for (let i = 0; i < W * H; i++) if (ink[i * 4 + 3] && ink[i * 4] > 150 && r() < 0.07) (ink[i * 4] = 156), (ink[i * 4 + 1] = 138), (ink[i * 4 + 2] = 98);
    gOf = new Int8Array(W).fill(-1);
    gx.forEach((c, i) => {
      for (let xx = Math.round(c - gs * 0.75); xx <= Math.round(c + gs * 0.75); xx++) if (xx >= 0 && xx < W) gOf[xx] = i;
    });
    samples = defs.map((d, i) => glyphSamples(d.def, gx[i], gy, gSize, 1.5));
    litC.width = slab.x1 - slab.x0;
    litC.height = slab.y1 - slab.y0;
    litKey = '';
    // a luz de cada símbolo na parede (um halo largo, mais alto que largo para cima)
    const R = H * 0.4;
    lmaps = gx.map((cx) => {
      const m = new Float32Array(W * H);
      for (let y = 0; y < H; y++)
        for (let x2 = 0; x2 < W; x2++) {
          const dx = (x2 - cx) / R;
          const dy = (y - gy) / (R * (y < gy ? 0.85 : 0.6));
          const f = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
          m[y * W + x2] = f * f;
        }
      return m;
    });
    beam = new Float32Array(W * H);
    for (let y = 0; y < H; y++) {
      const cx = fx0() + (fx1() - fx0()) * (y / H);
      for (let x2 = 0; x2 < W; x2++) {
        const band = Math.max(0, 1 - Math.abs(x2 - cx) / fw()) * (1 - 0.55 * (y / H));
        beam[y * W + x2] = y < by ? band * band : 0;
      }
    }
    // os desenhos a giz (fora da laje)
    art = new Uint8ClampedArray(W * H * 4);
    artAt = [];
    const k = Math.min(1, W / H / 1.78);
    for (const a of WALL_ART) {
      const dh = Math.max(8, Math.round(a.h * H * k));
      const dw = Math.round(a.w ? a.w * H * k : (dh * 4) / 3);
      const x0 = Math.round((a.x / 1.78) * W);
      const y0 = Math.round(a.y * H);
      const px = drawChalk(a.kind, dw, dh, a.seed, { days: a.days, step: 4 });
      for (let yy = 0; yy < dh; yy++)
        for (let xx = 0; xx < dw; xx++) {
          const si = (yy * dw + xx) * 4;
          if (!px[si + 3]) continue;
          const X = x0 + xx;
          const Y = y0 + yy;
          if (X < 0 || Y < 0 || X >= W || Y >= by - 2) continue;
          if (X >= slab.x0 - 2 && X <= slab.x1 + 2 && Y >= slab.y0 - 2 && Y <= slab.y1 + 3) continue;
          const di = (Y * W + X) * 4;
          art[di] = px[si];
          art[di + 1] = px[si + 1];
          art[di + 2] = px[si + 2];
          art[di + 3] = 255;
        }
      artAt.push({ x: x0 + dw / 2, y: y0 + dh / 2 });
    }
    doneT = -1;
    focus = -1;
    headX = slab.x0 + 2;
    headY = gy;
    // o dado: no canto de baixo à direita, apoiado na bancada
    dieX = Math.round(W * 0.84);
    dieY = by;
  };

  // a luz acesa nos sulcos: redesenhada só quando a ponta anda (o brilho e o pulso entram depois, pixel a pixel)
  const drawLit = () => {
    const key = defs.map((_, i) => fOf(i).toFixed(3)).join(',');
    if (key === litKey) return;
    litKey = key;
    litG.clearRect(0, 0, litC.width, litC.height);
    defs.forEach((d, i) => {
      const f = fOf(i);
      if (f <= 0) return;
      const cx = gx[i] - slab.x0;
      const cy = gy - slab.y0;
      // (o brilho fica no desenho: um halo estreito e fraco, o ouro do tamanho do sulco e o fio claro no meio)
      drawGlyphPart(litG, d.def, cx, cy, gSize, 'rgba(255,206,120,0.22)', f, 3);
      drawGlyphPart(litG, d.def, cx, cy, gSize, '#d9a640', f, 1);
      drawGlyphPart(litG, d.def, cx, cy, gSize, '#ffe9a8', f, 0);
    });
    litPx = litG.getImageData(0, 0, litC.width, litC.height).data;
  };

  // p: 0..1 (a barra como o jogador a vê); goK: 0..1 saindo para o jogo (escurece). Devolve o símbolo em que a luz acabou de chegar (para a
  // nota) e se a frase acabou de ficar inteira acesa
  const paint = (dt: number, p: number, goK: number, die: DieLook) => {
    const ev = { glyph: -1, n: defs.length, done: false };
    if (!img) return ev;
    t += dt;
    const target = total * Math.min(1, p);
    front += (target - front) * Math.min(1, dt * 7);
    if (p >= 0.999 && target - front < 0.02) front = total;
    while (reached + 1 < defs.length && front > defs[reached + 1].t0 + 0.02) {
      reached++;
      arrive[reached] = t;
      ev.glyph = reached;
      // o desenho que este símbolo acabou de iluminar (o mais perto dele)
      let best = -1;
      let bd = Infinity;
      artAt.forEach((q, i) => {
        const dd = Math.hypot(q.x - gx[reached], (q.y - gy) * 1.2);
        if (dd < bd) {
          bd = dd;
          best = i;
        }
      });
      focus = best;
    }
    if (front >= total - 1e-3 && doneT < 0) {
      doneT = 0;
      ev.done = true;
    } else if (doneT >= 0) doneT += dt;
    drawLit();
    // a ponta da luz: o ponto do traço em que ela está agora
    const running = front < total - 1e-3;
    {
      const i = Math.max(0, Math.min(defs.length - 1, reached));
      const f = fOf(i);
      const sm = samples[i];
      let q = sm[0];
      for (const s2 of sm) if (s2.u <= f) q = s2;
      if (q) {
        headX = q.x;
        headY = q.y;
      }
    }
    // o pó de luz: da ponta, enquanto corre; depois, de vez em quando, de um símbolo aceso
    if (running && front > 0.02 && r() < dt * 26) motes.push({ x: headX + (r() - 0.5) * 2, y: headY, vx: (r() - 0.5) * 8, vy: -(6 + r() * 12), life: 0, max: 0.6 + r() * 0.7 });
    if (!running && r() < dt * 4) {
      const i = Math.floor(r() * defs.length);
      const s2 = samples[i][Math.floor(r() * samples[i].length)];
      if (s2) motes.push({ x: s2.x, y: s2.y, vx: (r() - 0.5) * 5, vy: -(4 + r() * 8), life: 0, max: 0.8 + r() * 0.8 });
    }
    for (let i = motes.length - 1; i >= 0; i--) {
      const e = motes[i];
      e.life += dt;
      e.vx += Math.sin(t * 3 + i) * 6 * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.life >= e.max) motes.splice(i, 1);
    }
    // a força da luz de cada símbolo agora: cresce com o quanto dele está aceso, clareia quando a luz chega (o pulso) e respira de leve
    const pul = defs.map((_, i) => (i <= reached ? pulseK(t - arrive[i]) : 0));
    const ks = defs.map((_, i) => {
      const f = fOf(i);
      return f <= 0 ? 0 : f * (0.42 + 0.6 * pul[i]) * (1 + Math.sin(t * 1.9 + i) * 0.04);
    });
    const RH = H * 0.12;
    const headK = running && front > 0.02 ? 0.4 : 0;
    const fade = 1 - goK;
    const d = img.data;
    const amb = 0.055;
    const sw = (x: number) => Math.pow(0.5 + 0.5 * Math.sin(x * 0.06 - t * 1.6), 8); // o reflexo que corre ao longo dos traços acesos
    for (let y = 0; y < H; y++) {
      const ledge = y >= by;
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        let L = 0;
        for (let k = 0; k < ks.length; k++) if (ks[k]) L += ks[k] * lmaps[k][i];
        if (headK) {
          const dx = (x - headX) / RH;
          const dy = (y - headY) / RH;
          const f = 1 - Math.sqrt(dx * dx + dy * dy);
          if (f > 0) L += headK * f * f;
        }
        const lv = Math.floor(Math.min(1.4, L) * 7 + bayer(x, y)) / 7;
        const cool = Math.floor(beam[i] * 0.55 * 5 + bayer(x + 1, y)) / 5;
        const o = i * 3;
        const o4 = i * 4;
        if (art[o4 + 3]) {
          // o giz na parede: no escuro quase some; a luz da frase e a fresta o acendem (o giz devolve bem a luz)
          const l = Math.min(1.05, 0.1 + lv * 1.05 + cool * 1.1);
          d[o4] = Math.min(255, art[o4] * l * (1 + lv * 0.1) * fade);
          d[o4 + 1] = Math.min(255, art[o4 + 1] * l * fade);
          d[o4 + 2] = Math.min(255, art[o4 + 2] * l * (1 - lv * 0.12 + cool * 0.1) * fade);
          d[o4 + 3] = 255;
          continue;
        }
        let rr: number;
        let gg: number;
        let bb: number;
        const inSlab = x >= slab.x0 && x < slab.x1 && y >= slab.y0 && y < slab.y1;
        if (inSlab && ink[o4 + 3]) {
          if (ink[o4] < 60) {
            // o sulco
            rr = 0.06 + lv * 0.05;
            gg = 0.05 + lv * 0.04;
            bb = 0.05 + lv * 0.02;
          } else {
            // o marfim, fosco: a luz o deixa claro, mas nunca dourado (não pode parecer aceso)
            const l = Math.min(0.95, 0.22 + lv * 0.55 + cool * 0.5);
            rr = (ink[o4] / 255) * l;
            gg = (ink[o4 + 1] / 255) * l;
            bb = (ink[o4 + 2] / 255) * l * 0.97;
          }
        } else {
          // a laje: pedra lavrada (a textura da parede, mais lisa), afastada da parede: borda de cima clara, de baixo escura e uma sombra
          let tone = 1;
          let mixK = 0;
          if (inSlab) {
            mixK = 0.6;
            tone = y === slab.y0 || x === slab.x0 ? 1.45 : y === slab.y1 - 1 || x === slab.x1 - 1 ? 0.5 : 1.05;
          } else if ((y >= slab.y1 && y < slab.y1 + 2 && x > slab.x0 && x <= slab.x1) || (x >= slab.x1 && x < slab.x1 + 1 && y > slab.y0 && y < slab.y1 + 2)) tone = (x + y) % 2 ? 0.35 : 0.55;
          const wr = wall[o] * (1 - mixK) + 0.4 * mixK;
          const wg = wall[o + 1] * (1 - mixK) + 0.37 * mixK;
          const wb = wall[o + 2] * (1 - mixK) + 0.35 * mixK;
          // a bancada: a mesma pedra, mais escura, com a aresta de cima pegando a luz
          const lk = (ledge ? (y === by ? 1.5 : y === by + 1 ? 1.1 : 0.62) : 1) * tone;
          rr = wr * (amb + lv * 1.25 + cool * 0.55) * lk;
          gg = wg * (amb + lv * 0.98 + cool * 0.62) * lk;
          bb = wb * (amb * 1.4 + lv * 0.52 + cool * 0.85) * lk;
        }
        // a luz nos sulcos (por cima do marfim): o ouro nítido, o halo macio somado, o clarão quando a luz chega
        if (inSlab) {
          const li = ((y - slab.y0) * litC.width + (x - slab.x0)) * 4;
          const a = litPx[li + 3] / 255;
          if (a > 0) {
            const gi = gOf[x];
            const pk = gi >= 0 ? pul[gi] : 0;
            const glow = (0.95 + 0.05 * Math.sin(t * 1.9 + gi)) * (1 + 0.55 * pk) + (a > 0.9 ? 0.18 * sw(x) : 0);
            const cr = (litPx[li] / 255) * glow;
            const cg = (litPx[li + 1] / 255) * glow;
            const cb = (litPx[li + 2] / 255) * glow;
            if (a > 0.9) {
              rr = cr;
              gg = cg;
              bb = cb;
            } else {
              // o halo: somado e pontilhado (a luz que vaza do sulco)
              const h = a * (0.9 + 1.6 * pk);
              if (h * 2 + bayer(x, y) * 0.5 > 0.5) {
                rr += cr * h;
                gg += cg * h;
                bb += cb * h;
              }
            }
          }
        }
        d[o4] = Math.min(255, rr * 255 * fade);
        d[o4 + 1] = Math.min(255, gg * 255 * fade);
        d[o4 + 2] = Math.min(255, bb * 255 * fade);
        d[o4 + 3] = 255;
      }
    }
    const put = (px: number, py: number, c: RGB | number[]) => {
      if (px < 0 || py < 0 || px >= W || py >= H) return;
      const o4 = (py * W + px) * 4;
      d[o4] = Math.min(255, c[0] * 255 * fade);
      d[o4 + 1] = Math.min(255, c[1] * 255 * fade);
      d[o4 + 2] = Math.min(255, c[2] * 255 * fade);
    };
    const lightAt = (x: number, y: number) => {
      const xi = Math.max(0, Math.min(W - 1, Math.round(x)));
      const yi = Math.max(0, Math.min(H - 1, Math.round(y)));
      let L = 0;
      for (let k = 0; k < ks.length; k++) if (ks[k]) L += ks[k] * lmaps[k][yi * W + xi];
      return Math.min(1.3, L);
    };
    // a fresta: a poeira boiando
    for (const m of dust) {
      m.v += m.s * dt * 2.2;
      m.u += Math.sin(t * 0.7 + m.ph) * dt * 0.01;
      if (m.v > 1) {
        m.v -= 1;
        m.u = Math.random();
      }
      const y = Math.round(m.v * by * 0.98);
      const cx = fx0() + (fx1() - fx0()) * (y / H);
      const x = Math.round(cx + (m.u - 0.5) * fw() * 1.5);
      const tw = 0.5 + 0.5 * Math.sin(t * 2.3 + m.ph * 3);
      if (Math.max(0, 1 - Math.abs(x - cx) / fw()) * tw > 0.25) put(x, y, [0.62 + 0.3 * tw, 0.66 + 0.28 * tw, 0.74 + 0.2 * tw]);
    }
    // a ponta da luz: um ponto branco-dourado que tremula
    if (running && front > 0.02) {
      const hx = Math.round(headX);
      const hy = Math.round(headY);
      const fl = 0.85 + 0.15 * Math.sin(t * 31);
      put(hx, hy, [1, 1, 0.92]);
      for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(hx + ddx, hy + ddy, [1 * fl, 0.9 * fl, 0.62 * fl]);
    }
    // o pó de luz
    for (const e of motes) {
      const u = e.life / e.max;
      if (u > 0.6 && (Math.round(e.x) + Math.round(e.y)) % 2) continue;
      put(Math.round(e.x), Math.round(e.y), u < 0.35 ? [1, 0.95, 0.75] : [0.95, 0.75, 0.38]);
    }
    // O DADO 2D: a face da frente é o rosto vivo; em cima e à esquerda, as faces que se veem de quem está à esquerda; sombra no chão
    drawDie(put, lightAt, die, goK);
    g.putImageData(img, 0, 0);
    return ev;
  };

  const drawDie = (put: (x: number, y: number, c: RGB | number[]) => void, lightAt: (x: number, y: number) => number, die: DieLook, goK: number) => {
    const look = rostoOf(die.look);
    const key = JSON.stringify(look);
    if (key !== faceKey) {
      faceKey = key;
      const rc = dieRostoCanvas(3, accent, false, 0, look);
      facePx = pixels(rc.face);
      glowPx = pixels(rc.glow);
    }
    const S = 64;
    const D = 12; // profundidade das faces de lado
    const hop = Math.min(16, Math.round(Math.max(0, die.dy) * 320));
    const shake = Math.round(die.dx * 500);
    const out = goK * goK;
    const away = Math.round(out * W * 0.25);
    const ox = dieX - S / 2 + shake + away;
    const oy = dieY - S - hop - Math.round(Math.sin(Math.PI * Math.min(1, goK * 1.2)) * 18);
    const L = lightAt(dieX - S * 0.6, dieY - S * 0.5); // a luz que chega pela esquerda
    // sombra de contato pontilhada (encolhe com o pulo)
    const sw = Math.round((S / 2 + 4) * (1 - Math.min(0.5, hop / 30)));
    for (let xx = -sw; xx <= sw; xx++)
      for (let yy = 0; yy < 2; yy++) if ((xx + yy) % 2 === 0) put(dieX + away + xx - 4, dieY + yy, [0.02, 0.015, 0.02]);
    const shadeOf = (px: Uint8ClampedArray, i: number, k: number, warm: number): RGB => [
      (px[i] / 255) * k * (1 + warm * 0.35),
      (px[i + 1] / 255) * k * (1 + warm * 0.1),
      (px[i + 2] / 255) * k * (1 - warm * 0.2),
    ];
    // em cima: recua para a esquerda (quem olha está à esquerda e acima)
    for (let rI = 0; rI < D; rI++) {
      const ty = Math.floor((rI * S) / D);
      const x0 = ox - (D - rI);
      for (let x = 0; x < S; x++) put(x0 + x, oy - D + rI, shadeOf(topPx, (ty * S + x) * 4, 0.62 + L * 0.25, L * 0.5));
    }
    // à esquerda: a face que a chama ilumina
    for (let cI = 0; cI < D; cI++) {
      const tx = Math.floor((cI * S) / D);
      const y0 = oy - (D - cI);
      for (let y = 0; y < S; y++) put(ox - D + cI, y0 + y, shadeOf(sidePx, (y * S + tx) * 4, 0.42 + L * 0.75, Math.min(1, L * 1.2)));
    }
    // a frente: o rosto, com o ouro e os olhos acesos (o brilho soma)
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        const i = (y * S + x) * 4;
        const base = shadeOf(facePx, i, 0.7 + L * 0.35, L * 0.6);
        put(ox + x, oy + y, [base[0] + (glowPx[i] / 255) * 0.55, base[1] + (glowPx[i + 1] / 255) * 0.55, base[2] + (glowPx[i + 2] / 255) * 0.55]);
      }
  };

  return {
    canvas,
    resize,
    paint,
    // a ponta da luz e o dado, em frações da tela (o dado olha para lá)
    headAt: () => ({ x: W ? headX / W : LOAD_BAR.x0, y: H ? headY / H : LOAD_BAR.y }),
    dieAt: () => ({ x: W ? dieX / W : 0.84, y: H ? (dieY - 32) / H : 0.75 }),
    // a frase inteira acesa há um instante: pronto
    allDone: () => doneT >= 0.8,
    // o desenho que a luz do último símbolo iluminou (para onde o dado olha); depois de tudo aceso, um desenho qualquer, trocando de vez em quando
    focusAt: () => {
      let i = focus;
      if (doneT >= 0.8 && artAt.length) i = Math.floor(t / 2.6) % artAt.length;
      const q = artAt[i];
      return q ? { x: q.x / W, y: q.y / H } : null;
    },
  };
}
export type LoadArt = ReturnType<typeof makeLoadArt>;
