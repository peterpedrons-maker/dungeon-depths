// grava a ABERTURA de verdade: acordar, a porta, o Escrivão lá fora, o dado caindo, o dado acordando, a explicação e o 1º fogo
import { open, encoder, shot, FPS, T } from './common.mjs';
import { writeFileSync } from 'fs';
const low = process.argv[2] === 'low';
const nt = process.argv[2] === 'nt'; // sem a tira de pensamento (as falas viram legenda no trailer), só o começo
const { browser, page, ev } = await open({ w: low ? 960 : 1920, h: low ? 540 : 1080, url: '?titulo=0&splash=0', progress: null });
const enc = low ? null : encoder(T + (nt ? 'clips/intro_nt.mp4' : 'clips/intro.mp4'));
if (nt) await page.addStyleTag({ content: '.dlg.thought{display:none!important}' });
await ev(() => window.__vtStart());
const log = [];
let dlgSince = -1;
let promptSince = -1;
let door = false;
let thrown = false;
let doneAt = -1;
const MAX = nt ? 24 * 31 : 4800;
for (let f = 0; f < MAX; f++) {
  await ev(() => window.__vtStep(1000 / 24));
  const st = await ev(() => {
    const m = window.__mdd;
    const op = m.opening();
    return { cine: m.cine(), ph: op.ph, walk: op.walk, cc: op.cine, pinned: op.pinned, die: op.die, inv: m.inv(), next: !!document.querySelector('.dlg-next'), dlg: !!document.querySelector('.dlg'), prompt: document.querySelector('.prompt span')?.textContent ?? null, bars: !!document.querySelector('.bars.on, .bars.show'), x: +m.state().x.toFixed(2), z: +m.state().z.toFixed(2), room: m.state().room };
  });
  log.push({ f, ...st });
  // as falas que esperam o jogador: 1,6 s depois de escritas, Enter
  if (st.next) {
    if (dlgSince < 0) dlgSince = f;
    if (f - dlgSince > 38) {
      await page.keyboard.press('Enter');
      dlgSince = -1;
    }
  } else dlgSince = -1;
  // um aviso de ação (Tentar abrir, Pegar): 1 s depois, E
  if (st.prompt) {
    if (promptSince < 0) promptSince = f;
    if (f - promptSince > 24) {
      await ev(() => window.__mdd.interact());
      promptSince = -1;
    }
  } else promptSince = -1;
  // o acordar acabou e o jogador está livre: vai até a porta (corte) para tentar abrir
  if (!door && f > 48 && !st.cine.intro && !st.walk && !st.cc && !st.inv.die && st.ph === null && !st.dlg) {
    door = true;
    await ev(() => window.__mdd.placeIn(0, 0, -7.6, 0, 0));
    log.push({ f, ev: 'porta' });
  }
  // com o dado na mão e nada mais na tela: arremessa no braseiro do Poço (o 1º fogo, a cena do dado queimando)
  if (!thrown && st.inv.die && !st.dlg && !st.bars && st.die === 'hand' && f > 200) {
    if (doneAt < 0) doneAt = f;
    if (f - doneAt > 30) {
      thrown = true;
      const s = (await ev(() => window.__mdd.sockets(0)))[0];
      await ev((s) => {
        window.__mdd.face(3);
        window.__mdd.drop(s[0], s[1] + 0.4, s[2]);
      }, s);
      log.push({ f, ev: 'fogo', s });
    }
  }
  if (enc && (!thrown || f < doneAt + 30 + 24 * 5)) await enc.put(await shot(page));
  else if (low && f % 24 === 0) writeFileSync(T + `frames/low_${String(f).padStart(5, '0')}.jpg`, await shot(page));
  if (thrown && f > doneAt + 30 + 24 * 5) break;
}
writeFileSync(T + (low ? 'intro_low.json' : nt ? 'intro_nt.json' : 'intro.json'), JSON.stringify(log));
if (enc) await enc.close();
await browser.close();
console.log('quadros', log.length);
