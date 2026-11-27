import { LOAD_BAR } from '../story/loading';
import { drawChalk, type DrawKind } from '../scene/chalkdraw';
import { dieFaceCanvas, dieRostoCanvas, type RostoLook } from '../scene/textures';
import type { RostoMove } from '../scene/dielife';
import { FACES } from '../faces';
import { bayer, rnd, wallBase } from './chalkart';

// O FUNDO DA TELA DE CARREGAMENTO (pedidos do Pedro, DESIGN.md §79): uma parede das salas no escuro e uma bancada de pedra embaixo.
// - Na bancada corre uma CANALETA por onde o fogo anda conforme carrega, e cinco BRASEIROS que se ACENDEM um a um quando o fogo chega
//   (a mecânica do jogo: o fogo corre e acende); cada um ilumina a parede e solta faíscas.
// - Na parede, OS DESENHOS A GIZ dos condenados (os mesmos das paredes do jogo, scene/chalkdraw.ts; nada de glifo): no escuro, eles só
//   aparecem quando um braseiro acende perto (a porta, a contagem dos dias, o dado, a luz do poço); quem passa de capuz fica dentro da fresta
//   de luz fria, que desce do alto à esquerda com poeira boiando, e se vê desde o começo.
// - No canto, O DADO EM 2D, em pixel, com o rosto vivo (o mesmo de dielife.ts: olha a ponta do fogo e o desenho que acabou de aparecer, pisca,
//   mexe as sobrancelhas, suspira), recuando a cada braseiro que acende, aquecido pela luz; no clique de começar, sai pulando pela direita.
// Pintado num canvas no tamanho de pixel do jogo; a cena o usa no pós-processo (a paleta e o pontilhado do jogo).

export interface DieLook {
  dx: number;
  dy: number;
  look: RostoMove;
}
interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}
type RGB = [number, number, number];
const N_BRAZ = 5;
// os desenhos na parede: posição e altura em "alturas de tela" (pensado para 16:9; em telas mais estreitas, tudo encolhe junto)
const WALL_ART: { kind: DrawKind; x: number; y: number; h: number; w?: number; seed: number; days?: number }[] = [
  { kind: 'figura', x: 0.4, y: 0.06, h: 0.34, seed: 3 },
  { kind: 'poco', x: 1.0, y: 0.15, h: 0.34, seed: 4 },
  { kind: 'porta', x: 0.03, y: 0.4, h: 0.32, seed: 5 },
  { kind: 'contagem', x: 0.5, y: 0.575, h: 0.13, w: 0.32, seed: 6, days: 17 },
  { kind: 'dado', x: 0.84, y: 0.41, h: 0.29, seed: 7 },
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
  let lmaps: Float32Array[] = []; // a luz de cada braseiro (fixa; o tremor é um número por quadro)
  let art = new Uint8ClampedArray(0); // os desenhos a giz na parede (RGBA)
  let artAt: { x: number; y: number }[] = []; // o centro de cada desenho (px)
  let img: ImageData | null = null;
  let t = 0;
  const r = rnd(5);
  let bx0 = 0;
  let bx1 = 0;
  let by = 0; // o alto da bancada
  let head = 0;
  let braz: { x: number; lit: number; seed: number }[] = []; // lit: segundos desde que acendeu (-1 = frio)
  let doneT = -1; // os cinco acesos há quanto tempo (s); -1 = ainda não
  let focus = -1; // o desenho que o último braseiro aceso iluminou
  let dieX = 0;
  let dieY = 0;
  const embers: Ember[] = [];
  const motes: { u: number; v: number; s: number; ph: number }[] = [];
  for (let i = 0; i < 40; i++) motes.push({ u: Math.random(), v: Math.random(), s: 0.004 + Math.random() * 0.01, ph: Math.random() * 6.3 });
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

  const resize = (w: number, h: number) => {
    if (w === W && h === H) return;
    W = w;
    H = h;
    canvas.width = W;
    canvas.height = H;
    wall = wallBase(W, H, H > 300 ? 2 : 1);
    img = g.createImageData(W, H);
    bx0 = Math.round(LOAD_BAR.x0 * W);
    bx1 = Math.round(LOAD_BAR.x1 * W);
    by = Math.round(LOAD_BAR.y * H);
    head = bx0;
    // os braseiros: um a cada quinto da canaleta (o último na ponta)
    braz = [];
    for (let k = 0; k < N_BRAZ; k++) braz.push({ x: Math.round(bx0 + ((bx1 - bx0) * (k + 1)) / N_BRAZ) - 4, lit: -1, seed: k * 1.7 + 0.3 });
    // as luzes fixas (falloff de cada braseiro e da frase) e a fresta
    const R = H * 0.42;
    lmaps = braz.map((b) => {
      const m = new Float32Array(W * H);
      const cy = by - 20;
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const dx = (x - b.x) / R;
          const dy = (y - cy) / (R * 0.8);
          const f = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
          m[y * W + x] = f * f;
        }
      return m;
    });
    beam = new Float32Array(W * H);
    for (let y = 0; y < H; y++) {
      const cx = fx0() + (fx1() - fx0()) * (y / H);
      for (let x = 0; x < W; x++) {
        const band = Math.max(0, 1 - Math.abs(x - cx) / fw()) * (1 - 0.55 * (y / H));
        beam[y * W + x] = y < by ? band * band : 0;
      }
    }
    // os desenhos a giz
    art = new Uint8ClampedArray(W * H * 4);
    artAt = [];
    const k = Math.min(1, W / H / 1.78);
    for (const a of WALL_ART) {
      const dh = Math.max(8, Math.round(a.h * H * k));
      const dw = Math.round((a.w ? a.w * H * k : (dh * 4) / 3));
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
    // o dado: no canto de baixo à direita, apoiado na bancada
    dieX = Math.round(W * 0.84);
    dieY = by;
  };

  // p: 0..1 (a barra como o jogador a vê); goK: 0..1 saindo para o jogo (escurece); devolve quantos braseiros acenderam neste quadro e se
  // a frase começou a acender
  const paint = (dt: number, p: number, goK: number, die: DieLook) => {
    const ev = { ignited: 0, done: false };
    if (!img) return ev;
    t += dt;
    const target = bx0 + (bx1 - bx0) * Math.min(1, p);
    head += (target - head) * Math.min(1, dt * 8);
    if (p >= 0.999) head = Math.max(head, bx1);
    for (const b of braz) {
      if (b.lit < 0 && head >= Math.min(b.x + 4, bx1 - 1)) {
        b.lit = 0;
        ev.ignited++;
        // o desenho que este braseiro acabou de iluminar (o mais perto dele)
        let best = -1;
        let bd = Infinity;
        artAt.forEach((q, i) => {
          const dd = Math.hypot(q.x - (b.x + 4), (q.y - by) * 1.3);
          if (dd < bd) {
            bd = dd;
            best = i;
          }
        });
        focus = best;
        for (let n = 0; n < 16; n++) embers.push({ x: b.x + 4 + (r() - 0.5) * 10, y: by - 18, vx: (r() - 0.5) * 40, vy: -(30 + r() * 50), life: 0, max: 0.4 + r() * 0.7 });
      } else if (b.lit >= 0) b.lit += dt;
    }
    const allLit = braz.every((b) => b.lit >= 0);
    if (allLit && doneT < 0) {
      doneT = 0;
      ev.done = true;
    } else if (doneT >= 0) doneT += dt;
    // faíscas: da ponta do fogo e dos braseiros acesos
    if (head < bx1 - 1 && r() < dt * 30) embers.push({ x: head, y: by + 2, vx: (r() - 0.5) * 12, vy: -(14 + r() * 26), life: 0, max: 0.4 + r() * 0.6 });
    for (const b of braz) if (b.lit >= 0 && r() < dt * 3.5) embers.push({ x: b.x + 4 + (r() - 0.5) * 8, y: by - 24, vx: (r() - 0.5) * 10, vy: -(16 + r() * 26), life: 0, max: 0.6 + r() * 0.9 });
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i];
      e.life += dt;
      e.vy += 10 * dt;
      e.vx += Math.sin(t * 5 + i) * 10 * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.life >= e.max) embers.splice(i, 1);
    }
    // a força de cada luz agora (acende com um clarão e tremula)
    const ks = braz.map((b) => (b.lit < 0 ? 0 : (1 + Math.max(0, 0.9 - b.lit * 2.2)) * (1 + Math.sin(t * 10.3 + b.seed * 5) * 0.06 + Math.sin(t * 23.1 + b.seed) * 0.04)));
    const headK = head < bx1 - 0.5 ? 0.55 : 0;
    const RH = H * 0.22;
    const fade = 1 - goK;
    const d = img.data;
    const amb = 0.055;
    for (let y = 0; y < H; y++) {
      const ledge = y >= by;
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        let L = 0;
        for (let k = 0; k < ks.length; k++) if (ks[k]) L += ks[k] * lmaps[k][i];
        if (headK) {
          const dx = (x - head) / RH;
          const dy = (y - by) / (RH * 0.8);
          const f = 1 - Math.sqrt(dx * dx + dy * dy);
          if (f > 0) L += headK * f * f;
        }
        const lv = Math.floor(Math.min(1.4, L) * 7 + bayer(x, y)) / 7;
        const cool = Math.floor(beam[i] * 0.55 * 5 + bayer(x + 1, y)) / 5;
        const o = i * 3;
        const o4 = i * 4;
        if (art[o4 + 3]) {
          // o giz na parede: no escuro quase some; a chama e a fresta o acendem (o giz devolve bem a luz)
          const l = Math.min(1.05, 0.1 + lv * 1.05 + cool * 1.1);
          d[o4] = Math.min(255, art[o4] * l * (1 + lv * 0.12) * fade);
          d[o4 + 1] = Math.min(255, art[o4 + 1] * l * fade);
          d[o4 + 2] = Math.min(255, art[o4 + 2] * l * (1 - lv * 0.12 + cool * 0.1) * fade);
          d[o4 + 3] = 255;
          continue;
        }
        // a bancada: a mesma pedra, mais escura, com a aresta de cima pegando a luz
        const lk = ledge ? (y === by ? 1.5 : y === by + 1 ? 1.1 : 0.62) : 1;
        const rr = wall[o] * (amb + lv * 1.3 + cool * 0.55) * lk;
        const gg = wall[o + 1] * (amb + lv * 0.88 + cool * 0.62) * lk;
        const bb = wall[o + 2] * (amb * 1.4 + lv * 0.5 + cool * 0.85) * lk;
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
    for (const m of motes) {
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
    // a canaleta: o sulco na frente da bancada; apagado = marfim, aceso = ouro, a linguinha de fogo na ponta
    const hx = Math.round(head);
    const running = head < bx1 - 0.5;
    for (let x = bx0 - 1; x <= bx1 + 1; x++) {
      const lt = lightAt(x, by + 3);
      put(x, by + 2, [0.05, 0.04, 0.05]);
      put(x, by + 6, [0.2 + lt * 0.3, 0.16 + lt * 0.2, 0.14 + lt * 0.08]);
      for (let yy = 3; yy <= 5; yy++) {
        if (x < bx0 || x > bx1) {
          put(x, by + yy, [0.05, 0.04, 0.05]);
          continue;
        }
        if (x > hx) {
          const k2 = 0.35 + lt * 0.5;
          put(x, by + yy, yy === 3 ? [0.42 * k2, 0.39 * k2, 0.33 * k2] : [0.82 * k2, 0.78 * k2, 0.66 * k2]);
          continue;
        }
        const dist = hx - x;
        const pulse = 0.5 + 0.5 * Math.sin(x * 0.35 - t * 6);
        const c: RGB = dist < 2 && running ? [1, 0.97, 0.82] : dist < 6 && running ? [1, 0.86, 0.45] : pulse > 0.8 ? [1, 0.82, 0.36] : [0.92, 0.66, 0.24];
        put(x, by + yy, c);
      }
    }
    if (running) {
      const hgt = 3 + Math.round(1.5 + Math.sin(t * 17) * 1.2 + Math.sin(t * 29) * 0.8);
      for (let yy = 0; yy < hgt; yy++) put(hx + (yy > 1 ? Math.round(Math.sin(t * 13 + yy) * 0.6) : 0), by + 2 - yy, yy < 2 ? [1, 0.98, 0.85] : yy < hgt - 1 ? [1, 0.8, 0.35] : [0.95, 0.45, 0.15]);
    }
    // os braseiros: pé, haste e bacia de ferro na bancada; frios, brasas cinzentas; acesos, brasas e a chama
    for (const b of braz) {
      const bxx = b.x;
      const lt = Math.max(lightAt(bxx + 4, by - 10), 0.15);
      const iron = (k: number): RGB => [0.16 * k + 0.32 * lt * k, 0.13 * k + 0.2 * lt * k, 0.14 * k + 0.1 * lt * k];
      const cx = bxx + 4;
      for (let xx = -5; xx <= 5; xx++) {
        put(cx + xx, by - 1, iron(Math.abs(xx) === 5 ? 0.8 : 1.15)); // o pé
        if (Math.abs(xx) < 4) put(cx + xx, by - 2, iron(xx === -3 ? 1.4 : 0.9));
      }
      for (let yy = 3; yy <= 7; yy++) {
        put(cx - 1, by - yy, iron(1.35));
        put(cx, by - yy, iron(1));
        put(cx + 1, by - yy, iron(0.75));
      }
      // a bacia: de 8 px embaixo a 16 em cima, a borda de cima mais clara
      for (let row = 0; row < 7; row++) {
        const w = 4 + Math.round(row * 0.67);
        const yb = by - 8 - row;
        for (let xx = -w; xx <= w; xx++) put(cx + xx, yb, iron(xx === -w ? 1.6 : xx === w ? 0.7 : row === 6 ? 1.9 : row === 5 ? 0.8 : 1));
      }
      // a boca (brasas)
      const hot = b.lit >= 0;
      for (let xx = -7; xx <= 7; xx++) {
        const h = (((xx * 7 + Math.floor(t * (hot ? 6 : 0))) % 5) + 5) % 5;
        put(cx + xx, by - 15, hot ? (h === 0 ? [1, 0.88, 0.5] : h < 3 ? [1, 0.55, 0.18] : [0.75, 0.25, 0.08]) : h < 2 ? [0.26, 0.24, 0.24] : [0.16, 0.15, 0.16]);
      }
      if (!hot) continue;
      // a chama: colunas que tremulam, maior no clarão de quando acende
      const boost = 1 + Math.max(0, 0.8 - b.lit * 2.5);
      for (let xx = -6; xx <= 6; xx++) {
        const base = (12 - Math.abs(xx) * 1.45) * boost;
        const n = 0.72 + 0.28 * Math.sin(t * 9 + xx * 1.7 + b.seed * 3) * Math.sin(t * 5.3 + xx * 0.9 + b.seed);
        const hgt = Math.max(1, Math.round(base * n));
        for (let yy = 0; yy < hgt; yy++) {
          const u = yy / hgt;
          if (u > 0.85 && (xx + yy + Math.floor(t * 12)) % 2) continue;
          put(cx + xx + (u > 0.5 ? Math.round(Math.sin(t * 11 + yy * 0.7 + b.seed) * 0.9) : 0), by - 16 - yy, u < 0.3 ? [1, 0.96, 0.78] : u < 0.62 ? [1, 0.74, 0.3] : u < 0.85 ? [0.98, 0.45, 0.14] : [0.72, 0.2, 0.07]);
        }
      }
    }
    // as faíscas
    for (const e of embers) {
      const u = e.life / e.max;
      const c: RGB = u < 0.3 ? [1, 0.93, 0.6] : u < 0.65 ? [1, 0.62, 0.22] : [0.7, 0.22, 0.08];
      if (u > 0.85 && (Math.round(e.x) + Math.round(e.y)) % 2) continue;
      put(Math.round(e.x), Math.round(e.y), c);
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
    // a ponta do fogo e o dado, em frações da tela (o dado olha para lá)
    headAt: () => ({ x: W ? head / W : LOAD_BAR.x0, y: LOAD_BAR.y }),
    dieAt: () => ({ x: W ? dieX / W : 0.84, y: H ? (dieY - 32) / H : 0.75 }),
    // o último braseiro aceso (para onde o dado olha quando o fogo já passou)
    litAt: () => {
      const b = [...braz].reverse().find((q) => q.lit >= 0);
      return b ? { x: (b.x + 4) / W, y: (by - 18) / H } : null;
    },
    // os cinco acesos há um instante: pronto
    allDone: () => doneT >= 0.8,
    // o desenho que o último braseiro iluminou (para onde o dado olha); depois de tudo aceso, um desenho qualquer, trocando de vez em quando
    focusAt: () => {
      let i = focus;
      if (doneT >= 0.8 && artAt.length) i = Math.floor(t / 2.6) % artAt.length;
      const q = artAt[i];
      return q ? { x: q.x / W, y: q.y / H } : null;
    },
  };
}
export type LoadArt = ReturnType<typeof makeLoadArt>;
