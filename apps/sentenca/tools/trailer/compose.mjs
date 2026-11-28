// A TRILHA do trailer, composta com as gravações do jogo (os instrumentos do FluidR3 e os efeitos CC0), alinhada aos cortes de edl.json.
// Roda no próprio jogo (renderAudio, um OfflineAudioContext) e grava trilha.wav.
import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { chromium } = require('playwright');
import { T, URL0 } from './common.mjs';
const edl = JSON.parse(readFileSync(T + 'edl.json', 'utf8'));
const at = (name, off = 0) => edl.find((e) => e.name === name).start + off;
const END = edl[edl.length - 1].start + edl[edl.length - 1].dur + 0.6;
const ops = [];
const N = (t, inst, midi, vol, o = {}) => ops.push([+t.toFixed(3), 'note', inst, midi, vol, { fadeIn: 0.02, fadeOut: 0.8, verb: 0.6, ...o }]);
const S = (t, name, vol = 1, rate = 1, verb = 0.35, pan = 0) => ops.push([+t.toFixed(3), 'sample', name, vol, rate, verb, pan]);
const P = (t, name, vol = 1, key) => ops.push([+t.toFixed(3), 'play', name, vol, key]);
// uma nota longa feita de notas gravadas que se emendam (as gravações duram poucos segundos)
const pad = (t0, t1, inst, midi, vol, o = {}) => {
  for (let t = t0; t < t1; t += 2.2) N(t, inst, midi, vol, { fadeIn: t === t0 ? (o.fadeIn ?? 1.6) : 1.0, fadeOut: 1.4, verb: 0.75, ...o, fadeIn: t === t0 ? (o.fadeIn ?? 1.6) : 1.0 });
};
const harpFall = (t, notes, gap = 0.16, vol = 0.32) => notes.forEach((m, k) => N(t + k * gap, 'orchestral_harp', m, vol * (1 - k * 0.06), { verb: 0.8, echo: 0.25 }));
const celesta = (t, notes, gap = 0.22, vol = 0.26) => notes.forEach((m, k) => N(t + k * gap, 'celesta', m, vol, { verb: 0.85, echo: 0.3 }));
const Dm = [50, 53, 57];
// ── 1. o escuro e o Poço: um grave que respira, uma gota ──
pad(0.0, at('escrivao'), 'contrabass', 38, 0.34, { fadeIn: 3 });
pad(at('poco', 0.8), at('escrivao'), 'voice_oohs', 57, 0.13);
pad(at('poco', 1.6), at('escrivao'), 'voice_oohs', 50, 0.12);
S(1.0, 'drip', 0.55, 1, 0.8, -0.3);
S(4.6, 'drip', 0.45, 0.94, 0.8, 0.4);
N(at('poco', 1.2), 'blown_bottle', 69, 0.12, { fadeIn: 1.5, fadeOut: 2, verb: 0.9 });
harpFall(at('poco', 3.6), [81, 77, 74, 69, 65, 62], 0.19, 0.24);
S(at('acorda', 0.05), 'boom', 0.35, 0.7, 0.5);
celesta(at('luz', 0.3), [86, 81], 0.5, 0.18);
S(at('porta', 0.2), 'locked', 0.85, 1, 0.4);
S(at('alguem', 0.2), 'drip', 0.5, 0.9, 0.85, 0.2);
N(at('alguem', 0.6), 'blown_bottle', 72, 0.11, { fadeIn: 1.2, fadeOut: 1.5, verb: 0.95 });
// ── 2. lá fora: o vento, o sino grave; o Escrivão fala em glifos ──
S(at('escrivao', 0.0), 'wind', 0.5, 1, 0.3);
// os passos dele na pedra do pátio, até a boca do poço
for (let k = 0; k < 7; k++) S(at('escrivao', 0.35 + k * 0.56), k % 2 ? 'step_stone_r' : 'step_stone_l', 0.32, 0.92, 0.35, 0.15);
S(at('escrivao', 1.4), 'gust', 0.45, 1, 0.3, -0.4);
N(at('escrivao', 0.3), 'tubular_bells', 62, 0.32, { verb: 0.9, echo: 0.3 });
pad(at('escrivao'), at('mao'), 'contrabass', 34, 0.32);
pad(at('escrivao', 0.4), at('mao'), 'choir_aahs', 58, 0.08);
pad(at('escrivao', 0.4), at('mao'), 'choir_aahs', 53, 0.08);
for (const [k, n] of [['viver', [86, 89, 93]], ['dar', [81, 84, 86]], ['ler', [89, 86]]]) celesta(at(k, 0.25), n, 0.42, 0.22);
S(at('viver', 0.0), 'wind', 0.3, 0.95, 0.3, 0.3);
harpFall(at('dar', 1.4), [74, 69, 65, 62], 0.2, 0.2);
// ── 3. a mão, a queda: as cordas sobem, o tímpano rufa, o baque ──
const fall0 = at('mao');
const hit = at('preto1') - 0.06;
pad(fall0, hit, 'string_ensemble_1', 50, 0.12, { fadeIn: 2.5 });
pad(fall0 + 1.2, hit, 'string_ensemble_1', 57, 0.1, { fadeIn: 2 });
pad(at('cai'), hit, 'string_ensemble_1', 62, 0.12, { fadeIn: 1.5 });
pad(at('cai'), hit, 'choir_aahs', 62, 0.12, { fadeIn: 1.8 });
for (let t = at('cai', 0.6), k = 0; t < hit - 0.05; k++) {
  N(t, 'timpani', 38, 0.12 + 0.5 * ((t - at('cai')) / (hit - at('cai'))), { verb: 0.5, fadeOut: 0.3 });
  t += Math.max(0.07, 0.32 - k * 0.018);
}
S(at('cai', 0.05), 'sweep', 0.45, 0.8, 0.4);
S(hit, 'land', 1.0, 0.9, 0.4);
S(hit, 'boom', 0.95, 0.75, 0.6);
S(hit + 0.02, 'gong', 0.55, 0.8, 0.8);
N(hit, 'timpani', 36, 0.9, { verb: 0.7, fadeOut: 1.5 });
N(hit, 'contrabass', 26, 0.6, { verb: 0.7, fadeOut: 2 });
for (const m of [50, 57, 62, 65]) N(hit, 'choir_aahs', m, 0.13, { fadeIn: 0.01, fadeOut: 2.2, verb: 0.9 });
// ── 4. o dado acorda: o calor; a voz dele é a celesta ──
pad(at('chao'), at('fogo1'), 'voice_oohs', 53, 0.11, { fadeIn: 1.5 });
pad(at('chao'), at('fogo1'), 'voice_oohs', 57, 0.1, { fadeIn: 1.5 });
pad(at('chao'), at('fogo1'), 'contrabass', 41, 0.26, { fadeIn: 1.5 });
celesta(at('chao', 0.7), [77, 81, 84, 89], 0.3, 0.22);
harpFall(at('rosto', 0.2), [65, 69, 72, 77, 81, 84].reverse(), 0.14, 0.24);
celesta(at('rosto', 1.6), [89, 86, 84, 81], 0.35, 0.18);
// ── 5. o 1º fogo e a montagem: o pulso das cordas, um golpe a cada corte ──
const ign = at('fogo1', 0.05); // o dado cai na brasa
S(at('fogo1', 1.35), 'ignite_small', 0.6, 0.85, 0.5); // o dado volta e a chama fica
N(at('fogo1', 1.35), 'timpani', 38, 0.4, { verb: 0.6, fadeOut: 1 });
S(ign, 'ignite', 0.95, 1, 0.4);
S(ign + 0.05, 'fire', 0.6, 1, 0.3);
N(ign, 'timpani', 38, 0.7, { verb: 0.6, fadeOut: 1 });
for (const m of [50, 57, 62]) N(ign, 'choir_aahs', m, 0.12, { fadeIn: 0.6, fadeOut: 2.5, verb: 0.8 });
const m0 = at('m_fogo');
const m1 = at('preto2') - 0.05; // o corte para o preto corta a música
const BEAT = 0.3125; // 96 por minuto, em colcheias
const bass = [38, 38, 34, 34, 41, 41, 36, 36];
for (let t = ign + 0.8, k = 0; t < m1; t += BEAT, k++) {
  const bar = Math.floor((t - m0 + 10) / (BEAT * 8)) % bass.length;
  N(t, 'string_ensemble_1', [50, 57, 53, 57][k % 4] + (t > m0 + 6 ? 12 : 0), 0.09 + Math.min(0.08, (t - ign) * 0.006), { fadeIn: 0.01, hold: 0.12, fadeOut: 0.15, verb: 0.4 });
  if (k % 2 === 0) N(t, 'contrabass', bass[bar % bass.length], 0.3, { fadeIn: 0.01, hold: 0.2, fadeOut: 0.2, verb: 0.3 });
}
pad(m0, m1, 'choir_aahs', 62, 0.08, { fadeIn: 2 });
pad(m0 + 2.8, m1, 'choir_aahs', 65, 0.08, { fadeIn: 2 });
pad(m0 + 6, m1, 'choir_aahs', 69, 0.09, { fadeIn: 2 });
for (const k of ['m_fogo', 'm_balanca', 'm_vento', 'm_sobe', 'm_cai']) {
  N(at(k), 'timpani', 36, 0.75, { verb: 0.6, fadeOut: 1 });
  S(at(k), 'boom', 0.35, 1.1, 0.5);
  N(at(k), 'tubular_bells', 74, 0.12, { verb: 0.8 });
}
// os sons de cada sala, no tempo da imagem
S(at('m_fogo', 0.05), 'fire', 0.5, 1, 0.3);
S(at('m_fogo', 0.7), 'ignite', 0.6, 1, 0.3);
S(at('m_fogo', 1.3), 'crackle', 0.6, 1, 0.3);
S(at('m_balanca', 0.0), 'ignite_small', 0.7, 1, 0.3);
S(at('m_balanca', 1.35), 'plate1', 0.9, 0.85, 0.4);
S(at('m_balanca', 1.45), 'settle', 0.5, 0.9, 0.4);
S(at('m_vento', 0.0), 'gust', 0.6, 1, 0.3, -0.3);
S(at('m_vento', 0.1), 'ignite', 0.6, 1, 0.3);
S(at('m_vento', 0.15), 'ignite_cloth', 0.75, 1, 0.4);
S(at('m_vento', 0.9), 'crackle', 0.5, 1, 0.4, 0.2);
S(at('m_sobe', 0.0), 'ignite_small', 0.6, 1, 0.3);
celesta(at('m_sobe', 1.15), [74, 77, 81, 86], 0.18, 0.16);
S(at('m_sobe', 1.3), 'rise', 0.8, 1, 0.4);
// a ponte: a Casa pesa (a pedra estala e treme), a ponte cede e desaba no fosso; o corte para o preto leva um golpe grave
P(at('m_cai', 0.2), 'altarCrack', 0.9);
S(at('m_cai', 0.9), 'boom', 0.85, 0.7, 0.6);
S(at('m_cai', 0.95), 'rise', 0.7, 0.55, 0.5);
S(at('m_cai', 1.3), 'land', 0.6, 0.6, 0.6);
S(at('m_cai', 1.4), 'burnout', 0.45, 0.9, 0.4);
S(at('preto2', 0.0), 'boom', 0.9, 0.55, 0.8);
N(at('preto2', 0.0), 'timpani', 33, 0.8, { verb: 0.9, fadeOut: 1.4 });
// ── 6. o título: o golpe, o gongo, o coro; a harpa sobe com a luz nas letras; a brasa do ACENDER ──
const tt = at('titulo');
S(tt + 0.05, 'boom', 0.85, 0.65, 0.7);
S(tt + 0.08, 'gong', 0.5, 0.7, 0.9);
N(tt + 0.05, 'timpani', 36, 0.6, { verb: 0.8, fadeOut: 2 });
for (const [m, v] of [[38, 0.32], [50, 0.1], [57, 0.1], [62, 0.1], [65, 0.09]]) pad(tt + 0.1, tt + 8.6, m < 48 ? 'contrabass' : 'choir_aahs', m, v, { fadeIn: 1.2 });
harpFall(tt + 1.2, [62, 65, 69, 74, 77, 81, 86, 89], 0.27, 0.22);
S(tt + 3.25, 'ignite_small', 0.55, 1, 0.5);
celesta(tt + 4.3, [86, 81, 77, 74], 0.4, 0.2);
N(tt + 4.3, 'tubular_bells', 62, 0.22, { verb: 0.9, echo: 0.3 });
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await (await browser.newContext({ viewport: { width: 640, height: 360 } })).newPage();
page.on('pageerror', (e) => console.log('ERR', e.message));
await page.goto(URL0 + '?intro=0&titulo=0&splash=0', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__mdd, null, { timeout: 120000 });
await page.waitForTimeout(3000);
const b64 = await page.evaluate(([secs, ops]) => window.__mdd.renderAudio(secs, ops, true), [END, ops]);
writeFileSync(T + 'trilha.wav', Buffer.from(b64, 'base64'));
console.log('trilha', END.toFixed(1), 's,', ops.length, 'operações');
await browser.close();
