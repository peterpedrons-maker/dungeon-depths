// Gera a FONTE DA INTERFACE a partir da fonte de pixels do diário (src/book/font.ts): cada pixel vira um quadrado.
// Assim TODO texto do jogo (controles, legendas, avisos, créditos, botões) usa a mesma letra do diário (DIRECAO_DE_ARTE.md §4.11).
// Saída: public/fonts/mdd-pixel.otf. Uso: node tools/build_font.mjs (precisa do opentype.js, dependência de desenvolvimento).
// Métrica: 1 pixel = 100 unidades (1000 por em = 10 pixels: a célula tem 2 linhas de folga para acentos + 8 linhas da letra).
// Em CSS, font-size múltiplo de 10px dá pixels inteiros na tela.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '../src/book/font.ts'), 'utf8');
// a tabela ASCII e as listas de acentos, lidas do próprio font.ts (uma só fonte da verdade)
const ascii = eval(src.match(/const ASCII: number\[\]\[\] = (\[[\s\S]*?\n\]);/)[1]);
const COMPOSED = {};
for (const m of src.matchAll(/add\('([^']+)', '([^']+)', '(\w+)'\);/g)) [...m[2]].forEach((c, i) => (COMPOSED[c] = [m[1][i] ?? m[1][0], m[3]]));
const ALIAS = eval('(' + src.match(/const ALIAS: Record<string, string> = (\{[^\n]*\});/)[1] + ')');

const U = 100;
const ADV = 6;
// pixels de um caractere: [coluna, linha] (linha 0 = topo da letra; -2 e -1 = acentos; 7 = perna de g, j, p, q, y)
function pixelsOf(ch) {
  const a = ALIAS[ch];
  if (a && a.length === 1) ch = a;
  let acc = null;
  if (COMPOSED[ch]) [ch, acc] = COMPOSED[ch];
  const code = ch.charCodeAt(0);
  const cols = code >= 32 && code <= 126 ? ascii[code - 32] : ascii['?'.charCodeAt(0) - 32];
  const out = [];
  for (let c = 0; c < 5; c++)
    for (let r = 0; r < 8; r++) {
      if (!(cols[c] & (1 << r))) continue;
      if (acc && ch === 'i' && c === 2 && r === 0) continue;
      out.push([c, r]);
    }
  if (acc) {
    const lower = ch >= 'a' && ch <= 'z';
    const t = lower ? 2 : 0;
    const a1 = t - 2;
    const a2 = t - 1;
    const P = { acute: [[3, a1], [2, a2]], grave: [[1, a1], [2, a2]], circ: [[2, a1], [1, a2], [3, a2]], tilde: [[1, a1], [2, a2], [3, a1], [4, a2]], uml: [[1, a2], [3, a2]], cedil: [[2, 8]] };
    out.push(...P[acc]);
  }
  return out;
}
// linha de base: embaixo da linha 6 (a linha 7 é a perna das minúsculas)
const BASE = 7;
function glyphFor(ch, name) {
  const p = new opentype.Path();
  for (const [c, r] of pixelsOf(ch)) {
    const x0 = c * U;
    const y1 = (BASE - r) * U; // y para cima
    const y0 = y1 - U;
    p.moveTo(x0, y0);
    p.lineTo(x0 + U, y0);
    p.lineTo(x0 + U, y1);
    p.lineTo(x0, y1);
    p.close();
  }
  return new opentype.Glyph({ name, unicode: ch.codePointAt(0), advanceWidth: ADV * U, path: p });
}

const chars = new Set();
for (let c = 32; c <= 126; c++) chars.add(String.fromCharCode(c));
Object.keys(COMPOSED).forEach((c) => chars.add(c));
Object.keys(ALIAS).filter((c) => ALIAS[c].length === 1).forEach((c) => chars.add(c));
const glyphs = [new opentype.Glyph({ name: '.notdef', unicode: 0, advanceWidth: ADV * U, path: new opentype.Path() })];
for (const ch of chars) glyphs.push(glyphFor(ch, 'u' + ch.codePointAt(0).toString(16)));
// as reticências viram três pontos numa célula só (no diário elas são '...')
const font = new opentype.Font({ familyName: 'MDD Pixel', styleName: 'Regular', unitsPerEm: 1000, ascender: 900, descender: -100, glyphs });
const out = path.join(here, '../public/fonts/mdd-pixel.otf');
fs.writeFileSync(out, Buffer.from(font.toArrayBuffer()));
console.log(`fonte: ${glyphs.length} glifos → ${path.relative(process.cwd(), out)} (${fs.statSync(out).size} bytes)`);
