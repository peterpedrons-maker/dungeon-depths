import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { encoder, shot, T, VT } from './common.mjs';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { chromium } = require('playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
await ctx.addInitScript({ content: readFileSync(VT, 'utf8') });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('ERR', e.message));
await page.goto(new URL('./title/index.html', import.meta.url).href);
await page.waitForTimeout(800);
await page.evaluate(() => window.__vtStart());
const enc = encoder(T + 'clips/titulo.mp4');
for (let f = 0; f < 24 * 9.6; f++) {
  await page.evaluate(() => window.__vtStep(1000 / 24));
  await enc.put(await shot(page));
}
await enc.close();
await browser.close();
console.log('ok titulo');
