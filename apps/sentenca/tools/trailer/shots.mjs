// as tomadas com a câmera do trailer: cada uma monta o estado da sala, move a câmera (de p0/t0 a p1/t1, suave) e dispara ações em quadros marcados
import { open, encoder, shot, FPS, T, ease, lerp } from './common.mjs';
const only = process.argv.slice(2);
const { browser, page, ev } = await open({});
await ev(() => {
  window.__vtStart();
  window.__mdd.noHud(true);
});
await page.addStyleTag({ content: '.boato{display:none!important}' }); // (o balão do dado sem o dado na tela)
const step = async (n = 1) => {
  for (let k = 0; k < n; k++) await ev(() => window.__vtStep(1000 / 24));
};
const idx = async (name) => (await ev(() => window.__mdd.rooms())).findIndex((r) => r.n.includes(name));
const W = (i, x, y, z) => ev(([i, x, y, z]) => window.__mdd.w(i, x, y, z), [i, x, y, z]);
async function take(name, { room, setup, frames, cam, actions = {}, settle = 36 }) {
  if (only.length && !only.includes(name)) return;
  const i = await idx(room);
  await ev((i) => window.__mdd.goto(i), i);
  await step(6);
  if (setup) await setup(i);
  await step(settle);
  const enc = encoder(T + `clips/${name}.mp4`);
  for (let f = 0; f < frames; f++) {
    const u = ease(f / (frames - 1));
    const c = cam(u, f);
    const p = await W(i, ...c.p);
    const t = await W(i, ...c.t);
    await ev(([p, t, fov, roll]) => (window.__trailerCam = { p, t, fov, roll }), [p, t, c.fov ?? 55, c.roll ?? 0]);
    if (actions[f]) await actions[f](i);
    await step(1);
    await enc.put(await shot(page));
  }
  await enc.close();
  await ev(() => (window.__trailerCam = undefined));
  console.log('ok', name);
}
const dolly = (p0, p1, t0, t1, fov = 55, roll0 = 0, roll1 = 0) => (u) => ({ p: lerp(p0, p1, u), t: lerp(t0, t1, u), fov, roll: roll0 + (roll1 - roll0) * u });

// 1) O POÇO: do chão, a câmera sobe o olhar até a luz que cai pelo buraco
await take('poco', {
  room: 'O Poço',
  setup: (i) => ev((i) => window.__mdd.placeIn(i, 1.6, 0.5, 0, 0), i),
  frames: 24 * 7,
  cam: (u) => ({ p: lerp([1.4, 0.35, -1.2], [0.9, 0.55, -2.4], u), t: lerp([0.2, 0.2, -5.5], [0, 7.5, -3.6], u), fov: 58, roll: 0.06 * (1 - u) }),
});
// 2) O FOGO QUE CORRE: do alto, o fogo desce pelas canaletas do centro aos cantos
await take('fogo', {
  room: 'O Fogo que Corre',
  setup: (i) => ev((i) => window.__mdd.placeIn(i, 0, 1.0, 0, 0), i),
  frames: 24 * 5,
  cam: dolly([3.5, 7.5, 1.0], [-1.5, 6.2, -1.5], [0, 0.6, -8.8], [0, 0.8, -9.6], 62),
  actions: {
    6: async (i) => {
      const s = (await ev(() => window.__fires['O Fogo que Corre']().sock))[4];
      await ev((s) => {
        window.__mdd.face(3);
        window.__mdd.drop(s[0], s[1] + 0.3, s[2]);
      }, s);
    },
  },
});
// 3) A BALANÇA: a corda queima e o grande cai no prato; o travessão pende
await take('balanca', {
  room: 'A Balança',
  setup: (i) => ev((i) => window.__mdd.placeIn(i, 0, 5.0, 0, 0), i),
  frames: 24 * 5,
  cam: dolly([-0.2, 1.35, 3.6], [-0.5, 1.45, 3.0], [-1.4, 2.15, 0], [-1.5, 2.05, 0], 52),
  actions: { 8: () => ev(() => window.__balanca.burn(0)) },
});
// 4) O CLAUSTRO DO VENTO: o fogaréu da esquerda, o vento para o fundo, as fagulhas queimam o estandarte do boato
await take('vento', {
  room: 'O Claustro do Vento',
  setup: (i) => ev((i) => window.__mdd.placeIn(i, 0, -1.0, 0, 0), i),
  frames: 24 * 5,
  cam: dolly([-3.0, 1.0, -7.0], [-3.1, 1.3, -8.0], [-2.3, 2.3, -12.4], [-2.3, 2.9, -13.0], 54),
  actions: {
    2: () => ev(() => window.__vento.setWind(0.4)),
    4: () => ev(() => window.__vento.light(0)),
  },
});
// 5) A PONTE DE FRASES: a ponte de quem veio antes, inteira e acesa; a Casa a pesa na última fileira, ela treme e desaba no fosso
// (o jogador pisa na última fileira e volta à borda da entrada: a ponte cai com a luz acesa, sem a queda dele e sem o escuro)
await take('ponte_cai', {
  room: 'A Ponte de Frases',
  setup: (i) => ev((i) => window.__mdd.placeIn(i, 0, -0.3, 0, 0), i),
  frames: 24 * 5,
  cam: dolly([-4.6, 3.3, -1.6], [-4.3, 2.9, -3.0], [0.8, -0.4, -11.5], [0.8, -0.8, -11.5], 54),
  actions: {
    12: (i) => ev((i) => window.__mdd.placeIn(i, 2.8, -15, 0, 0), i),
    15: (i) => ev((i) => window.__mdd.placeIn(i, 0, -0.3, 0, 0), i),
  },
});
// 6) A PONTE DE FRASES: uma frase acende em ouro e a laje dela sobe do fosso (depois da queda, a sala volta sem a ponte)
await take('ponte_sobe', {
  room: 'A Ponte de Frases',
  setup: async (i) => {
    await ev((i) => window.__mdd.placeIn(i, 2.8, -15, 0, 0), i);
    await step(24 * 6);
    await ev((i) => window.__mdd.placeIn(i, 0, -0.3, 0, 0), i);
  },
  frames: 24 * 5,
  cam: dolly([2.6, 1.7, -2.0], [2.1, 1.45, -2.7], [-3.6, 0.5, -6.5], [-3.7, 0.7, -6.5], 55),
  actions: {
    6: async () => {
      const s = (await ev(() => window.__fires['A Ponte de Frases']().spots))[2];
      await ev((s) => {
        window.__mdd.face(3);
        window.__mdd.drop(s[0] + 0.3, s[1], s[2]);
      }, s);
    },
  },
});
// 7) O 1º FOGO, de perto: o dado cai no braseiro do Poço e a chama sobe
await take('brasa', {
  room: 'O Poço',
  setup: (i) => ev((i) => window.__mdd.placeIn(i, 0, -2.0, 0, 0), i),
  frames: 24 * 4,
  cam: dolly([1.3, 1.3, -6.2], [1.65, 1.22, -6.75], [2.6, 1.2, -8.0], [2.6, 1.3, -8.0], 46),
  actions: {
    10: async (i) => {
      const s = (await ev((i) => window.__mdd.sockets(i), i))[0];
      await ev((s) => {
        window.__mdd.face(3);
        window.__mdd.drop(s[0], s[1] + 0.4, s[2]);
      }, s);
    },
  },
});
await browser.close();
