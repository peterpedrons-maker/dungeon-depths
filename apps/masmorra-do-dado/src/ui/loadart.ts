import { LOAD_BAR } from '../story/loading';
import { CHALK_RGB, bayer, chalkAlong, lenOf, rnd, wallBase } from './chalkart';

// O FUNDO DA TELA DE CARREGAMENTO (pedido do Pedro: "muito purista, dá mais vida"; DESIGN.md §78). Uma parede das salas no escuro; embaixo, o
// SULCO talhado por onde o fogo corre (marfim apagado, ouro aceso, o clarão na ponta) e A LUZ DA CHAMA ILUMINA A PAREDE por onde passa, soltando
// FAÍSCAS que sobem; acima do sulco, RISCOS DE GIZ vão contando os dias conforme carrega (de cinco em cinco, o quinto atravessado). Pintado
// num canvas no tamanho de pixel do jogo; a cena o usa de fundo no pós-processo (paleta e pontilhado do jogo) e desenha o dado 3D por cima.

const GROUPS = 4; // 4 grupos de cinco riscos
interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}

export function makeLoadArt() {
  const canvas = document.createElement('canvas');
  const g = canvas.getContext('2d')!;
  let W = 0;
  let H = 0;
  let wall = new Float32Array(0);
  let ink = new Int8Array(0);
  let img: ImageData | null = null;
  let tallies: { pts: number[][]; len: number }[] = [];
  let tallyDrawn: number[] = [];
  let t = 0;
  const embers: Ember[] = [];
  // a fresta de luz fria que desce do alto à esquerda, com poeira boiando dentro (a assinatura de luz do jogo: poeira só em feixes)
  const motes: { u: number; v: number; s: number; ph: number }[] = [];
  for (let i = 0; i < 46; i++) motes.push({ u: Math.random(), v: Math.random(), s: 0.004 + Math.random() * 0.01, ph: Math.random() * 6.3 });
  const r = rnd(5);
  let bx0 = 0;
  let bx1 = 0;
  let by = 0;
  let head = 0; // a ponta do fogo (px)

  const resize = (w: number, h: number) => {
    if (w === W && h === H) return;
    W = w;
    H = h;
    canvas.width = W;
    canvas.height = H;
    wall = wallBase(W, H, H > 300 ? 2 : 1);
    ink = new Int8Array(W * H).fill(-1);
    img = g.createImageData(W, H);
    bx0 = Math.round(LOAD_BAR.x0 * W);
    bx1 = Math.round(LOAD_BAR.x1 * W);
    by = Math.round(LOAD_BAR.y * H);
    // os riscos: de cinco em cinco, acima do sulco, com tremor de mão
    tallies = [];
    const rr = rnd(23);
    const hh = Math.round(H * 0.085);
    const sp = Math.max(4, Math.round(H * 0.022));
    const top = by - Math.round(H * 0.3); // (mais alto que o aviso de começar, que fica logo acima do sulco)
    let x = bx0 + 2;
    for (let gI = 0; gI < GROUPS; gI++) {
      const gx = x;
      for (let k = 0; k < 4; k++) {
        const lean = (rr() - 0.5) * 1.6;
        tallies.push(mk([[x + (rr() - 0.5), top + (rr() - 0.5) * 2], [x + lean, top + hh + (rr() - 0.5) * 2]]));
        x += sp;
      }
      tallies.push(mk([[gx - sp * 0.6, top + hh * 0.78], [x - sp * 0.3, top + hh * 0.22]]));
      x += sp * 2.2;
    }
    tallyDrawn = tallies.map(() => 0);
    head = bx0;
  };
  const mk = (pts: number[][]) => ({ pts, len: lenOf(pts) });
  const plot = (px: number, py: number, k: number) => {
    if (px < 0 || py < 0 || px >= W || py >= H) return;
    const i = py * W + px;
    if (k < 0) {
      if (ink[i] < 0) ink[i] = 4;
    } else ink[i] = k;
  };

  // p: 0..1 (a barra como o jogador a vê); ready: tudo chegou; goK: 0..1 saindo para o jogo (escurece)
  const paint = (dt: number, p: number, ready: boolean, goK: number) => {
    if (!img) return;
    t += dt;
    const target = bx0 + (bx1 - bx0) * Math.min(1, p);
    head += (target - head) * Math.min(1, dt * 10);
    // os riscos de giz: um a cada (1/20) da barra; o da vez sendo riscado
    const nT = tallies.length;
    const f = Math.min(1, p) * nT;
    for (let i = 0; i < nT; i++) {
      const want = Math.min(1, Math.max(0, f - i)) * tallies[i].len;
      if (want > tallyDrawn[i]) {
        chalkAlong(plot, tallies[i].pts, tallyDrawn[i], want, 2);
        tallyDrawn[i] = want;
      }
    }
    // faíscas da ponta do fogo
    const rate = ready ? 10 : 34;
    for (let n = r() < (rate * dt) % 1 ? Math.ceil(rate * dt) : Math.floor(rate * dt); n > 0; n--)
      embers.push({ x: head + (r() - 0.5) * 3, y: by - 1, vx: (r() - 0.5) * 14, vy: -(18 + r() * 34), life: 0, max: 0.5 + r() * 0.9 });
    if (ready && r() < dt * 6) {
      const ex = bx0 + r() * (bx1 - bx0);
      embers.push({ x: ex, y: by - 1, vx: (r() - 0.5) * 8, vy: -(10 + r() * 20), life: 0, max: 0.6 + r() * 0.7 });
    }
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i];
      e.life += dt;
      e.vy += 6 * dt;
      e.vx += Math.sin(t * 5 + i) * 10 * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.life >= e.max) embers.splice(i, 1);
    }
    // a luz: a chama na ponta ilumina a parede em volta; o trecho aceso do sulco brilha baixinho; tremula
    const d = img.data;
    const flick = 1 + Math.sin(t * 11.3) * 0.06 + Math.sin(t * 27.1) * 0.04;
    const R = H * 0.72;
    const lit = Math.max(0, head - bx0);
    const amb = 0.06;
    // a fresta: uma faixa diagonal (de cima, à esquerda do centro, descendo para a esquerda), bordas pontilhadas, mais fraca embaixo
    const fx0 = W * 0.42;
    const fx1 = W * 0.16;
    const fw = W * 0.1;
    const fade = 1 - goK;
    for (let y = 0; y < H; y++) {
      const dyg = Math.abs(y - by);
      const grooveY = Math.max(0, 1 - dyg / (H * 0.16)); // o brilho do sulco aceso só perto dele
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const dx = (x - head) / R;
        const dy = (y - by) / (R * 0.75);
        let fl = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
        fl = fl * fl * 1.35 * flick;
        // ao longo do trecho aceso (mais forte com tudo pronto)
        if (x >= bx0 && x <= bx0 + lit) fl += grooveY * grooveY * (ready ? 0.55 : 0.32);
        const lv = Math.floor(Math.min(1.3, fl) * 7 + bayer(x, y)) / 7;
        // a fresta fria
        const cx = fx0 + (fx1 - fx0) * (y / H);
        const band = Math.max(0, 1 - Math.abs(x - cx) / fw) * (1 - 0.55 * (y / H));
        const cool = Math.floor(band * band * 0.55 * 5 + bayer(x + 1, y)) / 5;
        const k = ink[i];
        let rr: number;
        let gg: number;
        let bb: number;
        if (k >= 0) {
          const c = k === 4 ? [0.6, 0.6, 0.57] : CHALK_RGB[k];
          // o giz é claro mesmo no escuro (é ele que se lê); a chama só o esquenta um pouco
          const l = Math.min(1, 0.56 + lv * 0.5 + cool * 0.3);
          const warm = Math.min(1, lv);
          rr = c[0] * l;
          gg = c[1] * l * (1 - 0.05 * warm);
          bb = c[2] * l * (1 - 0.14 * warm);
        } else {
          const o = i * 3;
          rr = wall[o] * (amb + lv * 1.3 + cool * 0.55);
          gg = wall[o + 1] * (amb + lv * 0.88 + cool * 0.62);
          bb = wall[o + 2] * (amb * 1.4 + lv * 0.5 + cool * 0.85);
        }
        const o4 = i * 4;
        d[o4] = Math.min(255, rr * 255 * fade);
        d[o4 + 1] = Math.min(255, gg * 255 * fade);
        d[o4 + 2] = Math.min(255, bb * 255 * fade);
        d[o4 + 3] = 255;
      }
    }
    const put = (px: number, py: number, c: number[]) => {
      if (px < 0 || py < 0 || px >= W || py >= H) return;
      const o4 = (py * W + px) * 4;
      d[o4] = Math.min(255, c[0] * 255 * fade);
      d[o4 + 1] = Math.min(255, c[1] * 255 * fade);
      d[o4 + 2] = Math.min(255, c[2] * 255 * fade);
    };
    // o sulco talhado: borda de cima na sombra, de baixo pegando luz; dentro, 3 px de marfim apagado ou de ouro aceso
    const hx = Math.round(head);
    for (let x = bx0 - 1; x <= bx1 + 1; x++) {
      const near = Math.max(0, 1 - Math.abs(x - hx) / (H * 0.3));
      put(x, by - 3, [0.06, 0.05, 0.06]);
      put(x, by + 1, [0.22 + near * 0.35, 0.18 + near * 0.22, 0.16 + near * 0.08]);
      for (let yy = -2; yy <= 0; yy++) {
        if (x < bx0 || x > bx1) {
          put(x, by + yy, [0.05, 0.04, 0.05]);
          continue;
        }
        if (x > hx) {
          // apagado: marfim fosco (mais claro perto da chama), uma fuligem velha em cima
          const k2 = 0.35 + near * 0.55;
          put(x, by + yy, yy === -2 ? [0.42 * k2, 0.39 * k2, 0.33 * k2] : [0.82 * k2, 0.78 * k2, 0.66 * k2]);
          continue;
        }
        const dist = hx - x;
        const pulse = 0.5 + 0.5 * Math.sin(x * 0.35 - t * 6);
        const c = dist < 2 ? [1, 0.97, 0.82] : dist < 6 ? [1, 0.86, 0.45] : pulse > 0.8 ? [1, 0.82, 0.36] : [0.92, 0.66, 0.24];
        put(x, by + yy, yy === -1 ? [Math.min(1, c[0] + 0.05), Math.min(1, c[1] + 0.08), Math.min(1, c[2] + 0.1)] : c);
      }
    }
    // a chama na ponta: uma linguinha que tremula acima do sulco
    if (!ready || Math.sin(t * 3) > -0.6) {
      const hgt = 3 + Math.round(2 + Math.sin(t * 17) * 1.5 + Math.sin(t * 29) * 1);
      for (let yy = 0; yy < hgt; yy++) {
        const w = yy < hgt - 2 ? 1 : 0;
        const c = yy < 2 ? [1, 0.98, 0.85] : yy < hgt - 1 ? [1, 0.8, 0.35] : [0.95, 0.45, 0.15];
        for (let xx = -w; xx <= w; xx++) put(hx + xx + (yy > 2 ? Math.round(Math.sin(t * 13 + yy) * 0.6) : 0), by - 3 - yy, c);
      }
    }
    // a poeira da fresta: grãos claros boiando devagar, que piscam quando cruzam o miolo da luz
    for (const m of motes) {
      m.v += m.s * dt * 2.2;
      m.u += Math.sin(t * 0.7 + m.ph) * dt * 0.01;
      if (m.v > 1) {
        m.v -= 1;
        m.u = Math.random();
      }
      const y = Math.round(m.v * H * 0.92);
      const cx = fx0 + (fx1 - fx0) * (y / H);
      const x = Math.round(cx + (m.u - 0.5) * fw * 1.5);
      const tw = 0.5 + 0.5 * Math.sin(t * 2.3 + m.ph * 3);
      const inb = Math.max(0, 1 - Math.abs(x - cx) / fw);
      if (inb * tw > 0.25) put(x, y, [0.62 + 0.3 * tw, 0.66 + 0.28 * tw, 0.74 + 0.2 * tw]);
    }
    // as faíscas: claras no começo, laranja, depois vermelho escuro
    for (const e of embers) {
      const u = e.life / e.max;
      const c = u < 0.3 ? [1, 0.93, 0.6] : u < 0.65 ? [1, 0.62, 0.22] : [0.7, 0.22, 0.08];
      if (u > 0.85 && (Math.round(e.x) + Math.round(e.y)) % 2) continue;
      put(Math.round(e.x), Math.round(e.y), c);
    }
    g.putImageData(img, 0, 0);
  };
  // a ponta do fogo e a altura do sulco, em frações da tela (o dado olha para lá e recebe a luz)
  const headAt = () => ({ x: W ? head / W : LOAD_BAR.x0, y: LOAD_BAR.y });
  return { canvas, resize, paint, headAt, tallyN: () => tallies.length };
}
export type LoadArt = ReturnType<typeof makeLoadArt>;
