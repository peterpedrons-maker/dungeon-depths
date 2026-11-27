import { useEffect, useRef } from 'react';

// A ABERTURA DA EDITORA «PEDRA-SABÃO» (pedido do Pedro, DESIGN.md §77): ao abrir o jogo, antes da tela inicial. Uma laje de pedra-sabão
// (cinza-esverdeada, macia, com veios e pintinhas de talco) e o nome riscado À MÃO, a giz, traço a traço; um toco de giz vai na ponta do
// traço e solta pó. Tudo em pixel, no mesmo tamanho de pixel do jogo, desenhado aqui mesmo (sem arquivo de imagem).
// Dura ~3,5 s; um toque, clique ou tecla pula. Enquanto isso o jogo carrega por trás; a abertura só some quando a tela inicial está pronta.

// as letras: traços numa grade de 6 × 10 (y para baixo); `c` = curva (é suavizada)
type Stroke = { p: number[][]; c?: boolean };
const BOWL_P = { p: [[0, 0], [3.6, 0], [5.4, 1.2], [5.6, 2.6], [5.3, 3.9], [3.6, 5], [0, 5]], c: true };
const LETTERS: Record<string, { w: number; s: Stroke[] }> = {
  P: { w: 6, s: [{ p: [[0, 0], [0, 10]] }, BOWL_P] },
  E: { w: 5, s: [{ p: [[5, 0], [0, 0], [0, 10], [5, 10]] }, { p: [[0, 5], [4, 5]] }] },
  D: { w: 6, s: [{ p: [[0, 0], [0, 10]] }, { p: [[0, 0], [2.6, 0], [5, 1.8], [5.9, 5], [5, 8.2], [2.6, 10], [0, 10]], c: true }] },
  R: { w: 6, s: [{ p: [[0, 0], [0, 10]] }, BOWL_P, { p: [[2.4, 5], [6, 10]] }] },
  A: { w: 6, s: [{ p: [[0, 10], [3, 0], [6, 10]] }, { p: [[1.3, 6.3], [4.7, 6.3]] }] },
  '-': { w: 4, s: [{ p: [[0.2, 5.6], [3.8, 5.4]] }] },
  S: { w: 6, s: [{ p: [[5.6, 1.4], [4.2, 0], [1.6, 0], [0.2, 1.4], [0.4, 3.6], [2.4, 4.8], [4.4, 5.4], [5.9, 6.8], [5.8, 8.8], [4.3, 10], [1.4, 10], [0, 8.6]], c: true }] },
  B: { w: 6, s: [{ p: [[0, 0], [0, 10]] }, { p: [[0, 0], [3.8, 0], [5.2, 1.1], [5.2, 3.7], [3.8, 4.8], [0, 4.8]], c: true }, { p: [[0, 4.8], [4.2, 4.8], [5.9, 6.2], [5.9, 8.6], [4.3, 10], [0, 10]], c: true }] },
  Ã: { w: 6, s: [{ p: [[0, 10], [3, 0], [6, 10]] }, { p: [[1.3, 6.3], [4.7, 6.3]] }, { p: [[0.8, -1.6], [1.9, -2.6], [3.1, -1.9], [4.3, -2.7], [5.4, -2.0]], c: true }] },
  O: { w: 6, s: [{ p: [[3, 0], [0.9, 0.9], [0, 3.4], [0, 6.6], [0.9, 9.1], [3, 10], [5.1, 9.1], [6, 6.6], [6, 3.4], [5.1, 0.9], [3.05, 0.05]], c: true }] },
};
const NAME = 'PEDRA-SABÃO';

// números pseudoaleatórios fixos (a mesma letra, o mesmo tremor, toda vez)
const hash = (x: number, y: number) => {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
const rnd = (seed: number) => {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967295;
  };
};
// suaviza uma curva (Chaikin, duas vezes)
const chaikin = (pts: number[][]) => {
  let p = pts;
  for (let k = 0; k < 2; k++) {
    const o: number[][] = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const [x0, y0] = p[i];
      const [x1, y1] = p[i + 1];
      o.push([x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25], [x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]);
    }
    o.push(p[p.length - 1]);
    p = o;
  }
  return p;
};

// a pedra: cores da pedra-sabão (perto da paleta do jogo)
const STONE = ['#252c29', '#313a36', '#3d4843', '#4a5550', '#55625b', '#616e66', '#6d7a72', '#7b897f', '#8b998f'];
const BG = '#0b0912';
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const CHALK = ['#c9ccc0', '#dcded3', '#ecebe1', '#f7f5ec'];

interface Seg {
  pts: number[][]; // em pixels da tela de desenho
  len: number;
  t0: number; // quando começa (s)
  t1: number;
}

export function Splash({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const readyRef = useRef(ready);
  readyRef.current = ready;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    const cv = ref.current!;
    const g = cv.getContext('2d')!;
    let raf = 0;
    let W = 0;
    let H = 0;
    let stone: HTMLCanvasElement | null = null; // a laje pronta (sem o giz)
    let ink: HTMLCanvasElement | null = null; // o giz já escrito (vai sendo pintado)
    let ig: CanvasRenderingContext2D | null = null;
    let segs: Seg[] = [];
    let painted: number[] = []; // até onde (px) cada traço já foi pintado
    let slab = { x: 0, y: 0, w: 0, h: 0 };
    let unit = 2.6;
    const WRITE0 = 0.45;
    let writeEnd = 2.6;
    let t = 0;
    let last = performance.now();
    let skip = false;
    let outT = -1; // saindo (s)
    let tip: { x: number; y: number; a: number } | null = null;
    const dust: { x: number; y: number; vx: number; vy: number; life: number; c: string }[] = [];
    const rD = rnd(99);

    const build = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // o mesmo "tamanho de pixel" do jogo: ~200 linhas no celular, ~270 no PC
      H = vh < 520 ? 200 : 240;
      W = Math.max(200, Math.round((H * vw) / vh));
      cv.width = W;
      cv.height = H;
      // a laje: comprida, com espessura (a face de baixo aparece) e uma sombra no chão
      const sw = Math.min(Math.round(W * 0.78), Math.round(H * 1.5));
      const sh = Math.round(sw * 0.3);
      const TH = 5; // espessura (a face de baixo)
      slab = { x: Math.round((W - sw) / 2), y: Math.round((H - sh - TH) / 2) - 3, w: sw, h: sh };
      stone = document.createElement('canvas');
      stone.width = W;
      stone.height = H;
      const sg = stone.getContext('2d')!;
      const img = sg.createImageData(W, H);
      const D = img.data;
      const put = (x: number, y: number, hex: string) => {
        if (x < 0 || y < 0 || x >= W || y >= H) return;
        const o = (y * W + x) * 4;
        D[o] = parseInt(hex.slice(1, 3), 16);
        D[o + 1] = parseInt(hex.slice(3, 5), 16);
        D[o + 2] = parseInt(hex.slice(5, 7), 16);
        D[o + 3] = 255;
      };
      // o fundo: preto com uma claridade fria bem fraca atrás da laje (pontilhada, como o resto do jogo)
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const dx = (x - W / 2) / (W * 0.5);
          const dy = (y - H / 2) / (H * 0.55);
          const l = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
          put(x, y, l * 1.2 > BAYER[(y & 3) * 4 + (x & 3)] / 16 + 0.55 ? '#110e1a' : BG);
        }
      // contorno: bordas RETAS de pedra cortada, com poucas lascas (umas fundas, a maioria rasa) e cantos gastos
      const r = rnd(7);
      const chips = (n: number) => {
        const a = new Array(n).fill(0);
        let i = 2 + Math.floor(r() * 10);
        while (i < n - 2) {
          const w = 2 + Math.floor(r() * (r() < 0.25 ? 9 : 4));
          const d = r() < 0.3 ? 2 + Math.floor(r() * 2) : 1;
          for (let k = 0; k < w && i + k < n; k++) a[i + k] = Math.max(a[i + k], Math.round(d * Math.sin((Math.PI * (k + 0.5)) / w)) || (d > 1 ? 1 : 0));
          i += w + 6 + Math.floor(r() * 26);
        }
        return a;
      };
      const top = chips(sw);
      const bot = chips(sw);
      const lef = chips(sh);
      const rig = chips(sh);
      const CR = 4;
      const inside = (x: number, y: number) => {
        if (x < 0 || y < 0 || x >= sw || y >= sh) return false;
        const dx = Math.max(0, CR - x, x - (sw - 1 - CR));
        const dy = Math.max(0, CR - y, y - (sh - 1 - CR));
        if (dx * dx + dy * dy > CR * CR + 1) return false;
        return y >= top[x] && y <= sh - 1 - bot[x] && x >= lef[y] && x <= sw - 1 - rig[y];
      };
      // ruído suave (manchas largas da pedra-sabão)
      const vn = (x: number, y: number, s2: number, seed: number) => {
        const fx = x / s2;
        const fy = y / s2;
        const ix = Math.floor(fx);
        const iy = Math.floor(fy);
        const ux = fx - ix;
        const uy = fy - iy;
        const sx = ux * ux * (3 - 2 * ux);
        const sy = uy * uy * (3 - 2 * uy);
        const h00 = hash(ix + seed, iy);
        const h10 = hash(ix + 1 + seed, iy);
        const h01 = hash(ix + seed, iy + 1);
        const h11 = hash(ix + 1 + seed, iy + 1);
        return h00 * (1 - sx) * (1 - sy) + h10 * sx * (1 - sy) + h01 * (1 - sx) * sy + h11 * sx * sy;
      };
      // a sombra no chão (para baixo e à direita: a luz vem do alto à esquerda)
      for (let y = 0; y < sh + TH + 7; y++)
        for (let x = 0; x < sw + 8; x++)
          if (inside(x - 5, y - 6 - TH) && !inside(x, y) && !inside(x, y - TH)) put(slab.x + x, slab.y + y, (x + y) % 2 ? '#040307' : '#06050a');
      // a face de baixo (a espessura): pedra mais escura, com a aresta de cima marcada
      for (let y = 0; y < sh + TH; y++)
        for (let x = 0; x < sw; x++)
          if (!inside(x, y) && inside(x, y - TH)) {
            const k = y - (sh - 1);
            put(slab.x + x, slab.y + y, k <= 1 ? STONE[2] : hash(x, y) < 0.08 ? STONE[0] : STONE[1]);
          }
      // o tampo: manchas, veios de talco, grão, luz de cima à esquerda e o bisel das bordas
      for (let y = 0; y < sh; y++)
        for (let x = 0; x < sw; x++) {
          if (!inside(x, y)) continue;
          const nb = (dx: number, dy: number) => inside(x + dx, y + dy);
          let k = 4.0;
          k += (vn(x, y, 26, 11) - 0.5) * 1.6 + (vn(x, y, 9, 37) - 0.5) * 0.8;
          // veios: linhas finas e sinuosas, mais claras (talco), deformadas pelo ruído
          const w = vn(x, y, 30, 5) * 7;
          const v1 = Math.abs(Math.sin(x * 0.035 - y * 0.09 + w));
          const v2 = Math.abs(Math.sin(x * 0.05 + y * 0.06 + w * 0.7 + 2));
          if (v1 < 0.045) k += 1.4;
          else if (v1 < 0.1) k += 0.5;
          if (v2 < 0.03 && vn(x, y, 14, 71) > 0.55) k += 1.1;
          // luz
          k += (0.5 - y / sh) * 1.0 + (0.5 - x / sw) * 0.7;
          // bisel: a borda de cima e a da esquerda pegam luz; a de baixo e a da direita ficam na sombra
          if (!nb(0, -1)) k += 2.2;
          else if (!nb(0, -2)) k += 1.0;
          if (!nb(-1, 0)) k += 1.2;
          if (!nb(0, 1)) k -= 1.6;
          if (!nb(1, 0) || !nb(2, 0)) k -= 1.3;
          // grão: pontinhos claros e escuros soltos
          const h = hash(x * 3 + 1, y * 5 + 2);
          if (h < 0.04) k -= 1.1;
          else if (h > 0.975) k += 0.9;
          // pontilhado entre um tom e outro (como as texturas do jogo)
          k += (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.47) * 0.6;
          let c = STONE[Math.max(0, Math.min(STONE.length - 1, Math.round(k)))];
          if (hash(x + 999, y) < 0.004) c = '#b3beb4'; // brilho de talco
          put(slab.x + x, slab.y + y, c);
        }
      sg.putImageData(img, 0, 0);
      // o nome: traços em pixels, com tremor de mão
      unit = Math.max(1.6, Math.min((sw * 0.86) / NAME.split('').reduce((a, ch) => a + LETTERS[ch].w + 2.4, -2.4), sh * 0.052));
      const total = NAME.split('').reduce((a, ch) => a + LETTERS[ch].w + 2.4, -2.4) * unit;
      let cx = slab.x + (sw - total) / 2;
      const cy = slab.y + sh * 0.45 - 5 * unit;
      segs = [];
      const rr = rnd(31);
      let tt = WRITE0;
      const raw: { pts: number[][]; len: number }[] = [];
      for (const ch of NAME) {
        const L = LETTERS[ch];
        const rot = (rr() - 0.5) * 0.07;
        const by = (rr() - 0.5) * 0.7;
        for (const st of L.s) {
          let pts = st.p.map(([x, y]) => {
            const jx = (rr() - 0.5) * 0.28;
            const jy = (rr() - 0.5) * 0.28;
            const xx = x - L.w / 2;
            const yy = y - 5;
            return [cx + (L.w / 2 + xx * Math.cos(rot) - yy * Math.sin(rot) + jx) * unit, cy + (5 + xx * Math.sin(rot) + yy * Math.cos(rot) + by + jy) * unit];
          });
          if (st.c) pts = chaikin(pts);
          let len = 0;
          for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
          raw.push({ pts, len });
        }
        cx += (L.w + 2.4) * unit;
      }
      // o traço de baixo (um sublinhado rápido, levemente curvo)
      {
        const x0 = slab.x + (sw - total) / 2 + unit * 0.5;
        const x1 = x0 + total - unit;
        const y0 = cy + 12.6 * unit;
        const pts = chaikin([[x0, y0 + 1], [x0 + (x1 - x0) * 0.3, y0 - 0.5], [x0 + (x1 - x0) * 0.7, y0 + 0.4], [x1, y0 - 1.2]]);
        let len = 0;
        for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        raw.push({ pts, len });
      }
      // tempos: o nome em ~1,9 s (com pausas curtas de levantar o giz), o sublinhado mais depressa
      const nameLen = raw.slice(0, -1).reduce((a, s2) => a + s2.len, 0);
      const pxPerS = nameLen / 1.55;
      for (let i = 0; i < raw.length; i++) {
        const under = i === raw.length - 1;
        const d = raw[i].len / (under ? pxPerS * 2.6 : pxPerS);
        segs.push({ pts: raw[i].pts, len: raw[i].len, t0: tt, t1: tt + d });
        tt += d + (under ? 0 : 0.035);
        if (i === raw.length - 2) tt += 0.12;
      }
      writeEnd = tt;
      painted = segs.map(() => 0);
      ink = document.createElement('canvas');
      ink.width = W;
      ink.height = H;
      ig = ink.getContext('2d')!;
    };

    // o giz: um toco de ~3 px; o miolo quase sempre pega, a borda falha (o giz só marca o alto do grão da pedra)
    const chalkDot = (x: number, y: number, under: boolean) => {
      const rr2 = under ? 0.8 : 1.3;
      const x0 = Math.round(x);
      const y0 = Math.round(y);
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const d = Math.hypot(x0 + dx - x, y0 + dy - y);
          if (d > rr2 + 0.35) continue;
          const px = x0 + dx;
          const py = y0 + dy;
          const h = hash(px * 7 + 3, py * 13 + 1);
          const edge = d > rr2 - 0.55;
          if (h < (edge ? 0.5 : 0.1)) continue; // falha do giz
          ig!.fillStyle = edge ? CHALK[h < 0.75 ? 0 : 1] : CHALK[h < 0.35 ? 1 : h < 0.8 ? 2 : 3];
          ig!.fillRect(px, py, 1, 1);
        }
      // pó em volta, de leve
      const h2 = hash(x0 * 31, y0 * 17);
      if (h2 < 0.06) {
        ig!.fillStyle = '#8f988f';
        ig!.fillRect(x0 + (h2 < 0.03 ? -3 : 3), y0 + (h2 < 0.015 ? 2 : -2), 1, 1);
      }
    };
    const paintTo = (i: number, upto: number) => {
      const s = segs[i];
      let d = painted[i];
      const under = i === segs.length - 1;
      let acc = 0;
      let k = 1;
      // percorre o traço do ponto já pintado até `upto`
      while (d < upto && k < s.pts.length) {
        const [x0, y0] = s.pts[k - 1];
        const [x1, y1] = s.pts[k];
        const L = Math.hypot(x1 - x0, y1 - y0);
        if (acc + L < d) {
          acc += L;
          k++;
          continue;
        }
        const u = (d - acc) / (L || 1);
        const x = x0 + (x1 - x0) * u;
        const y = y0 + (y1 - y0) * u;
        chalkDot(x, y, under);
        tip = { x, y, a: Math.atan2(y1 - y0, x1 - x0) };
        d += 0.5;
      }
      painted[i] = Math.min(upto, s.len);
    };

    const draw = () => {
      if (!stone || !ink) return;
      g.drawImage(stone, 0, 0);
      g.drawImage(ink, 0, 0);
      // o toco de giz na ponta do traço (enquanto escreve): inclinado, a mão fica embaixo à direita; lado de cima claro, de baixo escuro
      if (tip && t < writeEnd + 0.15 && outT < 0) {
        const ux = 0.58;
        const uy = 0.81;
        for (let i = 0; i < 9; i++)
          for (let j = -1; j <= 1; j++) {
            const px = Math.round(tip.x + 1 + i * ux - j * uy);
            const py = Math.round(tip.y + 1 + i * uy + j * ux);
            g.fillStyle = i === 0 ? '#ffffff' : j < 0 ? '#f4f2e8' : j > 0 ? '#a9ada2' : '#dcdacf';
            g.fillRect(px, py, 1, 1);
          }
      }
      // pó caindo
      for (const p of dust) {
        g.fillStyle = p.c;
        g.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
        g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
      g.globalAlpha = 1;
      // entrada e saída: pontilhado sobre o preto (como as transições do jogo)
      const fadeIn = Math.min(1, t / 0.35);
      const fadeOut = outT < 0 ? 0 : Math.min(1, outT / 0.45);
      const cover = Math.max(1 - fadeIn, fadeOut);
      if (cover > 0) {
        const img = g.getImageData(0, 0, W, H);
        const d = img.data;
        for (let y = 0; y < H; y++)
          for (let x = 0; x < W; x++)
            if (BAYER[(y & 3) * 4 + (x & 3)] / 16 < cover) {
              const o = (y * W + x) * 4;
              d[o] = 11;
              d[o + 1] = 9;
              d[o + 2] = 18;
            }
        g.putImageData(img, 0, 0);
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      if (skip && t < writeEnd) t = writeEnd; // pulou: o nome aparece inteiro de uma vez
      // escreve até o tempo de agora
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        if (t <= s.t0 || painted[i] >= s.len) continue;
        const u = Math.min(1, (t - s.t0) / (s.t1 - s.t0));
        paintTo(i, u * s.len);
        if (tip && !skip && rD() < 0.5) dust.push({ x: tip.x + (rD() - 0.5) * 2, y: tip.y + 1, vx: (rD() - 0.5) * 6, vy: 4 + rD() * 8, life: 0.5 + rD() * 0.6, c: rD() < 0.5 ? '#d8d9cf' : '#9ea79e' });
      }
      for (let i = dust.length - 1; i >= 0; i--) {
        const p = dust[i];
        p.vy += 40 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) dust.splice(i, 1);
      }
      // sai quando já escreveu, ficou um instante à vista e o jogo está pronto
      if (outT < 0 && t > writeEnd + (skip ? 0.15 : 0.9) && readyRef.current) outT = 0;
      if (outT >= 0) {
        outT += dt;
        if (outT >= 0.5) {
          draw();
          doneRef.current();
          return;
        }
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    build();
    raf = requestAnimationFrame(tick);
    const onSkip = () => {
      skip = true;
    };
    const onResize = () => {
      // (girou o celular: refaz a laje e o nome já escrito até onde estava)
      const tt = t;
      build();
      t = tt;
    };
    window.addEventListener('pointerdown', onSkip);
    window.addEventListener('keydown', onSkip);
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointerdown', onSkip);
      window.removeEventListener('keydown', onSkip);
      window.removeEventListener('resize', onResize);
    };
  }, []);
  return <canvas ref={ref} className="splash" aria-label="Pedra-Sabão" role="img" />;
}
