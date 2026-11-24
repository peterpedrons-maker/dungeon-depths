// Verifica A Placa que Julga (src/scene/rooms/lab.json): conjunto de braseiros acesos que a placa aceita.
//  1) a solução é ÚNICA;  2) nenhuma pista (confirmada ou boato) nem a lei da contagem é descartável;
//  3) só com as confirmadas sobram vários conjuntos (os boatos e a lei são necessários).
// Uso: node tools/verify_lab.mjs
import { readFileSync } from 'node:fs';
const d = JSON.parse(readFileSync(new URL('../src/scene/rooms/lab.json', import.meta.url)));
const N = d.braseiros;
const SETS = [];
for (let m = 0; m < 1 << N; m++) {
  const s = Array.from({ length: N }, (_, i) => (m >> i) & 1);
  if (s.reduce((a, b) => a + b, 0) === d.acesos) SETS.push(s); // 's[i]' = braseiro i+1 aceso
}
const holds = (c, s) => {
  const a = s[c.a - 1], b = s[c.b - 1];
  if (c.t === 'se') return !a || !!b; // SE a ENTÃO b
  if (c.t === 'nao_juntos') return !(a && b); // SE a ENTÃO NÃO b
  if (c.t === 'e') return !!(a && b); // a E b
  throw new Error('tipo ' + c.t);
};
const sat = (C, B, k) => SETS.filter((s) => C.every((c) => holds(c, s)) && (k == null || B.filter((c) => holds(c, s)).length === k));
const full = sat(d.confirmadas, d.boatos, d.lei.verdadeiros);
const show = (s) => s.map((v, i) => (v ? i + 1 : '')).join('');
console.log('soluções com todas as pistas:', full.length, full.map(show).join(' '));
const sol = SETS.find((s) => show(s) === d.solucao.join(''));
let ok = full.length === 1 && !!sol && full[0] === sol;
const tv = d.boatos.map((c) => holds(c, sol));
console.log('verdade dos boatos na solução:', tv.join(' '));
ok = ok && tv.filter(Boolean).length === d.lei.verdadeiros && d.confirmadas.every((c) => holds(c, sol));
d.confirmadas.forEach((_, i) => {
  const n = sat(d.confirmadas.filter((_, j) => j !== i), d.boatos, d.lei.verdadeiros).length;
  console.log(`  sem a confirmada ${i + 1}: ${n} soluções ${n > 1 ? '✓ (era necessária)' : '✗'}`);
  ok = ok && n > 1;
});
d.boatos.forEach((_, i) => {
  const n = sat(d.confirmadas, d.boatos.filter((_, j) => j !== i), tv[i] ? d.lei.verdadeiros - 1 : d.lei.verdadeiros).length;
  console.log(`  sem o boato ${i + 1}: ${n} soluções ${n > 1 ? '✓ (era necessário)' : '✗'}`);
  ok = ok && n > 1;
});
const onlyConf = sat(d.confirmadas, [], null).length;
console.log('só com as confirmadas:', onlyConf, 'conjuntos possíveis', onlyConf >= 4 ? '✓' : '✗');
ok = ok && onlyConf >= 4;
console.log(ok ? 'OK' : 'FALHOU');
process.exit(ok ? 0 : 1);
