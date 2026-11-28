// Verifica a regra dos TRÊS IDIOMAS (DESIGN.md §98, src/i18n.ts): nenhum texto que o jogador lê fica só em português.
// Procura, nos arquivos do jogo, textos entre aspas (e texto solto no JSX) com cara de português fora de um T(...) / Tr(...) de três idiomas.
// É uma peneira (heurística): o que não é texto para o jogador (um id, o nome de uma sala usado como chave, uma nota de autor) fica de fora
// por campo conhecido (`name:`, `room:`, `where:`...) ou com o comentário `// i18n-ok` na linha.
// Uso: node tools/verify_i18n.mjs  (termina em OK ou FALHOU)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('../src/', import.meta.url).pathname;
// salas e telas FORA do jogo (reserva, vitrine, laboratório, demonstrações): entram quando voltarem ao jogo
const SKIP = [
  'scene/rooms/room1.ts', 'scene/rooms/room2.ts', 'scene/rooms/room3.ts', 'scene/rooms/room4.ts', 'scene/rooms/apelidos.ts', 'scene/rooms/lab.ts',
  'scene/rooms/vitrine.ts', 'scene/rooms/fireRooms.ts', 'book/mapdemo.ts', 'story/lexicon.ts', 'story/lexicon.json', 'i18n.ts', 'lang.ts',
  // o teste de desempenho (?bench=1, DESIGN.md §102) é ferramenta de desenvolvimento: o relatório é para colar na conversa conosco
  'ui/Bench.tsx',
];
const files = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(f) && !SKIP.includes(relative(ROOT, p))) files.push(p);
  }
};
walk(ROOT);

const ACC = /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/;
const PT = /\b(você|voce|não|nao|uma|um|para|com|sala|porta|dado|gema|caderno|folha|pegar|abrir|acender|apagar|jogo|tela|voltar|configurações|som|imagem|ela|ele|aqui|onde|nada|isso|tudo|muito|sem|mais|está|é|os|as|do|da|dos|das|no|na|que|de|o|a|e)\b/i;
// campos que são CHAVE, não texto para o jogador
const KEY_FIELD = /\b(name|room|where|when|id|key|word|words|right|wrong|kind|theme|by_id|className|clip|ico|icon|type|sfx|event|cmd|mode|face)\s*:\s*$/;
const problems = [];
// os nomes das salas em português são CHAVES (planta, perguntas, gemas): src/story/roomnames.ts
const ROOM_KEYS = new Set([...readFileSync(join(ROOT, 'story/roomnames.ts'), 'utf8').matchAll(/^  '([^']+)': T\(/gm)].map((m) => m[1]));
// lê o arquivo inteiro: strings, comentários e parênteses (uma chamada T(...) pode ocupar várias linhas)
function scan(src) {
  const out = []; // { s, at, inT, keyed }
  const stack = []; // para cada '(' aberto: o nome antes dele
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const e = src.indexOf('*/', i + 2);
      i = e < 0 ? n : e + 2;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1;
      let depth = 0;
      while (j < n) {
        if (src[j] === '\\') j += 2;
        else if (c === '`' && src[j] === '$' && src[j + 1] === '{') {
          depth++;
          j += 2;
        } else if (c === '`' && depth > 0 && src[j] === '}') {
          depth--;
          j++;
        } else if (src[j] === c && depth === 0) break;
        else if (src[j] === '\n' && c !== '`') break;
        else j++;
      }
      const body = src.slice(i + 1, j);
      const lineStart = src.lastIndexOf('\n', i) + 1;
      out.push({ s: c === '`' ? body.replace(/\$\{[^}]*\}/g, ' ') : body, at: i, inT: stack.some((x) => x === 'T' || x === 'Tr'), before: src.slice(lineStart, i), line: src.slice(lineStart, src.indexOf('\n', i) < 0 ? n : src.indexOf('\n', i)) });
      i = j + 1;
      continue;
    }
    if (c === '(') {
      const m = /([A-Za-z_$][\w$]*)\s*$/.exec(src.slice(Math.max(0, i - 40), i));
      stack.push(m ? m[1] : '');
    } else if (c === ')') stack.pop();
    i++;
  }
  return out;
}
const lineOf = (src, at) => src.slice(0, at).split('\n').length;
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const t of scan(src)) {
    const s = t.s;
    if (t.inT || /i18n-ok/.test(t.line)) continue;
    if (s.length < 3 || !/[a-zA-ZÀ-ú]{2}/.test(s)) continue;
    if (!(ACC.test(s) || (/\s/.test(s) && PT.test(s)))) continue;
    const before = t.before;
    if (KEY_FIELD.test(before)) continue;
    if (ROOM_KEYS.has(s) || /^Sala \d+ · /.test(s)) continue; // o nome de uma sala como chave
    if (/\b(Error|console\.\w+|warn|assert)\(\s*$/.test(before) || /console\.|new Error|throw /.test(t.line)) continue; // mensagem de programador
    if (/\bright:/.test(t.line) && /\bwrong:/.test(t.line)) continue; // as perguntas do dado: as opções são chaves de MEAN (quiz.ts)
    if (/(gl_|uniform |vec[234]|sampler2D|#include|float )/.test(s)) continue; // código de shader
    if (/^\s*$/.test(before) && /^\s*['"][^'"]+['"]\s*:/.test(t.line)) continue; // 'Chave': ... (dicionário)
    if (/(===|!==|==|includes\(|startsWith\(|test\(|\.get\(|\.has\(|\.set\(|split\(|replace\(|className=\{?)\s*$/.test(before)) continue; // comparação/classe: é chave
    if (/\b(LEX|lexicon|glyphs|goto|ROOM_NAMES|MEAN|localStorage|sessionStorage|setItem|getItem)\b/.test(before)) continue;
    problems.push(`${relative(ROOT, f)}:${lineOf(src, t.at)}: ${s.slice(0, 80)}`);
  }
  // texto solto no JSX: >Texto com palavras<
  if (f.endsWith('.tsx')) {
    src.split('\n').forEach((line, i) => {
      if (/i18n-ok/.test(line) || line.trim().startsWith('//') || line.trim().startsWith('{/*')) return;
      const jre = />\s*([^<>{}]*[a-zA-ZÀ-ú]{3,}[^<>{}]*)\s*</g;
      let j;
      while ((j = jre.exec(line))) {
        const tt = j[1].trim();
        if (!tt || /=>|&&|\|\||\?\s|:\s|\(|\)|;/.test(tt)) continue; // código, não texto
        if (ACC.test(tt) || PT.test(tt)) problems.push(`${relative(ROOT, f)}:${i + 1}: (JSX) ${tt.slice(0, 80)}`);
      }
    });
  }
}
// os dicionários de tradução: todo T(pt, en, es) com os três preenchidos e diferentes de vazio
let tcount = 0;
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/\bTr?\(\s*(['"])((?:\\.|(?!\1).)*)\1\s*,\s*(['"])((?:\\.|(?!\3).)*)\3\s*,\s*(['"])((?:\\.|(?!\5).)*)\5\s*\)/g)) {
    tcount++;
    if (!m[4].trim() || !m[6].trim()) problems.push(`${relative(ROOT, f)}: tradução vazia em T(${m[2].slice(0, 40)})`);
  }
}
if (problems.length) {
  console.log(problems.join('\n'));
  console.log(`\nFALHOU: ${problems.length} texto(s) só em português (use T(pt, en, es); se não for texto para o jogador, // i18n-ok)`);
  process.exit(1);
}
console.log(`OK: ${tcount} textos nos três idiomas; nenhum texto só em português nos ${files.length} arquivos do jogo.`);
