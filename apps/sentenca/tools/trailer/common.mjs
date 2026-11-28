// gravação quadro a quadro com o relógio virtual (vt.js): cada quadro = um passo de 1/24 s + uma foto; as fotos vão por um cano para o ffmpeg
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { spawn } from 'child_process';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { chromium } = require('playwright');
// onde tudo é gravado (clips/, seg/, trilha.wav, trailer.mp4); o servidor de desenvolvimento do jogo (npx vite --port 5310 --host 127.0.0.1)
export const T = process.env.TRAILER_OUT ?? fileURLToPath(new URL('./out/', import.meta.url));
export const URL0 = process.env.TRAILER_URL ?? 'http://127.0.0.1:5310/';
// o trailer é em português (o idioma do jogo segue o navegador sem config; ?lang= fixa; TRAILER_LANG=en|es grava em outro, DESIGN.md §98)
export const LANG = process.env.TRAILER_LANG ?? 'pt';
export const withLang = (u) => (u.includes('lang=') ? u : `${u}${u.includes('?') ? '&' : '?'}lang=${LANG}`);
export const VT = fileURLToPath(new URL('./vt.js', import.meta.url));
mkdirSync(T + 'clips', { recursive: true });
mkdirSync(T + 'frames', { recursive: true });
export const FPS = 24;
export const HIDE = '.clicktoplay,.crosshair,.prompt,.skipintro,.toast,.hint-pc,.touchbtns,.diary-btn,.book-call,.btn-throw,.overlay,.start,.help,.hint,.save-spin,.saving,.caption{display:none!important}';
export async function open({ w = 1920, h = 1080, url = '?intro=0&titulo=0&splash=0', progress = { flags: { intro: true, caiu: true, dado: true, caderno: true, fogo: true, dois: true }, burned: {} } } = {}) {
  const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--mute-audio'] });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.addInitScript({ content: readFileSync(VT, 'utf8') });
  await ctx.addInitScript((p) => {
    localStorage.clear();
    if (p) localStorage.setItem('mdd-progress-v1', JSON.stringify(p));
  }, progress);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('ERR', e.message));
  page.on('console', (m) => m.type() === 'error' && !/GL Driver|AudioContext|favicon/.test(m.text()) && console.log('CONSOLE', m.text().slice(0, 160)));
  await page.goto(URL0 + withLang(url), { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__mdd, null, { timeout: 120000 });
  await page.waitForTimeout(2500);
  await page.mouse.click(w / 2, h / 2);
  await page.waitForTimeout(800);
  await page.addStyleTag({ content: HIDE });
  const ev = (f, a) => page.evaluate(f, a);
  return { browser, page, ev };
}
// um codificador: recebe JPEGs e grava um vídeo quase sem perda
export function encoder(file, fps = FPS) {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '12', '-pix_fmt', 'yuv420p', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  return {
    async put(buf) {
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    },
    close: () => new Promise((r) => {
      ff.on('close', r);
      ff.stdin.end();
    }),
  };
}
export const shot = (page) => page.screenshot({ type: 'jpeg', quality: 95 });
export const ease = (u) => (u < 0 ? 0 : u > 1 ? 1 : u * u * (3 - 2 * u));
export const lerp = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
