import { useEffect, useRef } from 'react';
import { DUST_RGB, CHALK_RGB, bayer, chalkAlong, chalkStub, lenOf, rnd, shapeStrokes, textStrokes, textWidth, wallBase, type Stroke } from './chalkart';

// A ABERTURA DA EDITORA «CINCO RISCOS» (nome escolhido pelo Pedro, DESIGN.md §79). Ao abrir o jogo, antes da tela inicial: o escuro, uma luz
// quente se acende numa PAREDE DAS SALAS (a mesma alvenaria do jogo) e o GIZ DO JOGO (os quadradinhos claros) risca, traço a traço, o símbolo, a
// contagem de cinco dos condenados (quatro riscos e o quinto atravessado, passando da conta), e depois o nome, com um toco de giz na ponta
// soltando pó. No fim a luz baixa até o preto. Tudo em pixel, no tamanho de pixel do jogo, desenhado aqui. (Foram propostas também «Quina» e
// «Olho de Giz»; o Pedro ficou com Cinco Riscos por ser um nome que serve a outros jogos.)
// Dura ~4 s; um toque, clique ou tecla pula. O jogo carrega por trás; a abertura só sai quando a tela inicial está pronta.

const MARK: { name: string; s: Stroke[] } = {
  name: 'CINCO RISCOS',
  s: [
    { p: [[2.6, 0.8], [3.2, 19.2]] },
    { p: [[7.0, 0.4], [7.4, 19.5]] },
    { p: [[11.3, 0.9], [11.9, 19.0]] },
    { p: [[15.6, 0.5], [16.0, 19.4]] },
    { p: [[-1.5, 15.5], [20.5, 3.5]] },
  ],
};

interface Seg {
  pts: number[][];
  len: number;
  t0: number;
  t1: number;
  size: number;
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
    let wall = new Float32Array(0);
    let ink = new Int8Array(0); // tom do giz em cada pixel (-1 = nada, 4 = pó)
    let img: ImageData | null = null;
    let segs: Seg[] = [];
    let painted: number[] = [];
    let writeEnd = 3;
    let lightX = 0;
    let lightY = 0;
    let t = 0;
    let last = performance.now();
    let skip = false;
    let outT = -1;
    let tip: { x: number; y: number } | null = null;
    const dust: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    const rD = rnd(99);
    const plot = (px: number, py: number, k: number) => {
      if (px < 0 || py < 0 || px >= W || py >= H) return;
      const i = py * W + px;
      if (k < 0) {
        if (ink[i] < 0) ink[i] = 4;
      } else ink[i] = k;
    };

    const build = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      H = vh < 520 ? 200 : 240; // o mesmo tamanho de pixel do jogo
      W = Math.max(200, Math.round((H * vw) / vh));
      cv.width = W;
      cv.height = H;
      wall = wallBase(W, H, 1);
      ink = new Int8Array(W * H).fill(-1);
      img = g.createImageData(W, H);
      const mark = MARK;
      // o símbolo no alto, o nome embaixo
      const S = Math.round(H * 0.4);
      const su = S / 20;
      const sx = Math.round((W - S) / 2);
      const sy = Math.round(H * 0.13);
      const nu = H * 0.0095;
      const nw = textWidth(mark.name) * nu;
      const nx = Math.round((W - nw) / 2);
      const ny = Math.round(sy + S + H * 0.09);
      lightX = W / 2;
      lightY = sy + S * 0.55;
      const sym = shapeStrokes(mark.s, sx, sy, su, 7);
      const txt = textStrokes(mark.name, nx, ny, nu, 31);
      // tempos: o símbolo em ~1,4 s, o nome em ~0,95 s, pausas curtas de levantar o giz
      segs = [];
      let tt = 0.65;
      const symLen = sym.reduce((a, p) => a + lenOf(p), 0);
      for (const p of sym) {
        const L = lenOf(p);
        const d = (L / symLen) * 1.4;
        segs.push({ pts: p, len: L, t0: tt, t1: tt + d, size: 3 });
        tt += d + 0.07;
      }
      tt += 0.15;
      const txtLen = txt.reduce((a, p) => a + lenOf(p), 0);
      for (const p of txt) {
        const L = lenOf(p);
        const d = (L / txtLen) * 0.95;
        segs.push({ pts: p, len: L, t0: tt, t1: tt + d, size: 2 });
        tt += d + 0.02;
      }
      writeEnd = tt;
      painted = segs.map(() => 0);
    };

    // a imagem: a parede iluminada pela luz quente (que acende no começo e apaga no fim), o giz por cima, pontilhado como no jogo
    const compose = (lightK: number) => {
      const d = img!.data;
      const R = Math.max(W, H) * 0.7;
      const flick = 1 + Math.sin(t * 9.1) * 0.025 + Math.sin(t * 23.7) * 0.015;
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          const dx = (x - lightX) / R;
          const dy = (y - lightY) / (R * 0.8);
          const f = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
          // luz em degraus, pontilhada (o jeito do jogo)
          const lv = Math.floor(Math.pow(f, 1.6) * 1.2 * flick * lightK * 7 + bayer(x, y)) / 7;
          const k = ink[i];
          let r: number;
          let gg: number;
          let b: number;
          if (k >= 0) {
            const c = k === 4 ? DUST_RGB : CHALK_RGB[k];
            const l = Math.min(1, (0.3 + lv * 0.9) * lightK);
            r = c[0] * l;
            gg = c[1] * l;
            b = c[2] * l * 0.96;
          } else {
            const o = i * 3;
            const l = lv * 1.15;
            // a luz da chama é quente (laranja), o escuro em volta é frio
            r = wall[o] * (0.04 * lightK + l * 1.3);
            gg = wall[o + 1] * (0.045 * lightK + l * 0.9);
            b = wall[o + 2] * (0.075 * lightK + l * 0.52);
          }
          const o4 = i * 4;
          d[o4] = Math.min(255, r * 255);
          d[o4 + 1] = Math.min(255, gg * 255);
          d[o4 + 2] = Math.min(255, b * 255);
          d[o4 + 3] = 255;
        }
      // o toco de giz e o pó caindo, por cima (já iluminados)
      const put = (px: number, py: number, c: number[]) => {
        if (px < 0 || py < 0 || px >= W || py >= H) return;
        const o4 = (py * W + px) * 4;
        const l = Math.min(1, 0.2 + lightK);
        d[o4] = c[0] * 255 * l;
        d[o4 + 1] = c[1] * 255 * l;
        d[o4 + 2] = c[2] * 255 * l;
      };
      if (tip && t < writeEnd + 0.15 && outT < 0) chalkStub(put, tip.x, tip.y);
      for (const p of dust) if (p.life > 0.15 || (Math.round(p.x) + Math.round(p.y)) % 2) put(Math.round(p.x), Math.round(p.y), [0.85, 0.85, 0.8]);
      g.putImageData(img!, 0, 0);
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      if (skip && t < writeEnd) t = writeEnd;
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        if (t <= s.t0 || painted[i] >= s.len) continue;
        const u = Math.min(1, (t - s.t0) / (s.t1 - s.t0));
        const to = u * s.len;
        const tp = chalkAlong(plot, s.pts, painted[i], to, s.size);
        if (tp) tip = tp;
        painted[i] = to;
        if (tip && !skip && rD() < 0.55) dust.push({ x: tip.x + (rD() - 0.5) * 2, y: tip.y + 1, vx: (rD() - 0.5) * 6, vy: 4 + rD() * 8, life: 0.5 + rD() * 0.6 });
      }
      for (let i = dust.length - 1; i >= 0; i--) {
        const p = dust[i];
        p.vy += 40 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) dust.splice(i, 1);
      }
      if (outT < 0 && t > writeEnd + (skip ? 0.2 : 0.9) && readyRef.current) outT = 0;
      // a luz: acende em 0,6 s; na saída, apaga em 0,55 s
      const up = Math.min(1, t / 0.6);
      const lightK = up * up * (3 - 2 * up) * (outT < 0 ? 1 : Math.max(0, 1 - outT / 0.55));
      if (outT >= 0) outT += dt;
      compose(lightK);
      if (outT >= 0.65) {
        doneRef.current();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    build();
    raf = requestAnimationFrame(tick);
    const onSkip = () => {
      skip = true;
    };
    const onResize = () => {
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
  return <canvas ref={ref} className="splash" aria-label="Cinco Riscos" role="img" />;
}
