// O ÍCONE DO APP (DESIGN.md §90, pedido do Pedro): o dado 2D da tela de carregamento (src/ui/loadart.ts, DESIGN.md §83), só a face da
// frente, chapada, com o rosto de afeição neutra olhando para quem vê. O desenho é o MESMO do jogo: a face sai de `dieRostoCanvas` (a face
// 3, a do Fogo, com o ouro e os olhos acesos), desenhada pelo próprio código do jogo num navegador, e é ampliada em pixels inteiros.
// Gera public/icons/icon-512.png, icon-192.png, apple-touch-icon.png e icon-maskable-512.png.
//
// Rodar (em apps/sentenca/):  node tools/build_app_icon.mjs
// Precisa do Playwright com um Chromium. Se o Chromium dele não estiver no lugar padrão: CHROME=/caminho/do/chrome node tools/build_app_icon.mjs
import { createServer } from 'vite';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// (o Playwright pode estar instalado fora do projeto, para a máquina toda: o require do Node o acha, o import não)
const { chromium } = createRequire(import.meta.url)('playwright');
const server = await createServer({ root, logLevel: 'error', server: { port: 0, host: '127.0.0.1' } });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
try {
  const page = await browser.newPage();
  await page.goto(url + 'icons/icon-192.png'); // (qualquer arquivo do servidor: só para estar na mesma origem e importar os módulos do jogo)
  // [arquivo, tamanho, pixels da tela por pixel do desenho]
  const out = await page.evaluate(async (jobs) => {
    const { dieRostoCanvas } = await import('/src/scene/textures.ts');
    const { FACES } = await import('/src/faces.ts');
    const look = { ex: 0, ey: 0, by: 0, closed: false };
    const rc = dieRostoCanvas(3, FACES[2].color, false, 0, look);
    const px = (c) => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const face = px(rc.face);
    const glow = px(rc.glow);
    const S = 64; // a face do dado
    const D = S + 2; // com o contorno
    const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const BG = hex('#0b0912');
    const HALO = [hex('#0b0912'), hex('#120d14'), hex('#1a1317'), hex('#22171a')]; // a luz quente atrás do dado, em degraus pontilhados
    const res = {};
    for (const [name, size, s] of jobs) {
      // o desenho em pixels do jogo: G x G, com o dado no meio
      const G = Math.ceil(size / s) + 2;
      const g = document.createElement('canvas');
      g.width = G;
      g.height = G;
      const ctx = g.getContext('2d');
      const img = ctx.createImageData(G, G);
      const c0 = Math.floor((G - D) / 2); // o canto do contorno
      const mid = c0 + D / 2;
      const put = (x, y, c) => {
        const i = (y * G + x) * 4;
        img.data[i] = Math.max(0, Math.min(255, Math.round(c[0])));
        img.data[i + 1] = Math.max(0, Math.min(255, Math.round(c[1])));
        img.data[i + 2] = Math.max(0, Math.min(255, Math.round(c[2])));
        img.data[i + 3] = 255;
      };
      // o fundo: o escuro das salas, com uma luz quente atrás do dado (anéis pontilhados, como a luz das tochas no jogo)
      for (let y = 0; y < G; y++)
        for (let x = 0; x < G; x++) {
          const d = Math.hypot(x + 0.5 - mid, y + 0.5 - mid) / (D / 2);
          const f = Math.max(0, Math.min(3, (1.75 - d) / 0.25)); // 3 dentro, 0 longe
          const lo = Math.floor(f);
          const step = f - lo > 0.5 && (x + y) % 2 === 0 ? 1 : 0; // a meia-tinta pontilhada entre um anel e outro
          put(x, y, HALO[Math.min(3, lo + step)] ?? BG);
        }
      // o contorno escuro em volta da face
      for (let i = 0; i < D; i++) {
        put(c0 + i, c0, [5, 4, 7]);
        put(c0 + i, c0 + D - 1, [5, 4, 7]);
        put(c0, c0 + i, [5, 4, 7]);
        put(c0 + D - 1, c0 + i, [5, 4, 7]);
      }
      // a face, chapada, como na tela de carregamento: a luz quente vem da esquerda (lá era a frase acesa), o brilho do ouro e dos olhos soma
      const L = 0.7;
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) {
          const i = (y * S + x) * 4;
          const side = 1 - x / S;
          const k = 0.72 + L * (0.2 + 0.25 * side);
          const warm = L * (0.3 + 0.5 * side);
          const rim = 0; // (sem a borda acesa da tela de carregamento: lá ela é o reflexo da frase; aqui pareceria um risco)
          put(c0 + 1 + x, c0 + 1 + y, [
            face[i] * k * (1 + warm * 0.35) + glow[i] * 0.55 + rim * 255,
            face[i + 1] * k * (1 + warm * 0.1) + glow[i + 1] * 0.55 + rim * 204,
            face[i + 2] * k * (1 - warm * 0.2) + glow[i + 2] * 0.55 + rim * 102,
          ]);
        }
      ctx.putImageData(img, 0, 0);
      // ampliado em pixels inteiros, com o dado no centro exato do ícone
      const o = document.createElement('canvas');
      o.width = size;
      o.height = size;
      const oc = o.getContext('2d');
      oc.imageSmoothingEnabled = false;
      const off = Math.round(size / 2 - mid * s);
      oc.drawImage(g, off, off, G * s, G * s);
      res[name] = o.toDataURL('image/png');
    }
    return res;
  }, [
    ['icon-512.png', 512, 7], // o dado ocupa 462 de 512
    ['icon-192.png', 192, 2],
    ['apple-touch-icon.png', 180, 2],
    ['icon-maskable-512.png', 512, 4], // 264 de 512: cabe na área segura (o círculo de 80%) que os celulares recortam
  ]);
  for (const [name, data] of Object.entries(out)) {
    writeFileSync(join(root, 'public', 'icons', name), Buffer.from(data.split(',')[1], 'base64'));
    console.log('public/icons/' + name);
  }
} finally {
  await browser.close();
  await server.close();
}
