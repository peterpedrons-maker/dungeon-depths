// Verifica o puzzle do Tribunal dos Rumores (src/scene/rooms/tribunal.json):
//  1) a solução é ÚNICA com todas as pistas;  2) nenhuma pista (confirmada, boato) nem a lei da contagem é descartável;
//  3) só com os confirmados sobram várias ordens;  4) a "ordem natural" (1,2,3,4,5) e as variantes simples não resolvem.
// Uso: node tools/verify_tribunal.mjs
import { readFileSync } from 'node:fs';
const d = JSON.parse(readFileSync(new URL('../src/scene/rooms/tribunal.json', import.meta.url)));
const L = [1, 2, 3, 4, 5];
const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
const PERMS = perms(L);
const size = (r) => d.braseiros.find((b) => b.rotulo === r).tamanho;
const ent = (e) => (e[0] === 'n' ? Number(e.slice(1)) : d.braseiros.find((b) => b.tamanho === e).rotulo); // 'grande'/'pequeno' (únicos)
for (const t of ['grande', 'pequeno']) if (d.braseiros.filter((b) => b.tamanho === t).length !== 1) throw new Error(`${t} precisa ser único`);
const holds = (s, p) => {
  const pa = p.indexOf(ent(s.a)), pb = p.indexOf(ent(s.b));
  return s.rel === 'antes' ? pa < pb : pa > pb;
};
const K = d.lei.verdadeiros;
const sat = (C, B, k) => PERMS.filter((p) => C.every((s) => holds(s, p)) && (k == null || B.filter((s) => holds(s, p)).length === k));
const full = sat(d.confirmadas, d.boatos, K);
console.log('soluções com todas as pistas:', full.length, full.map((p) => p.join('-')).join(' '));
let ok = full.length === 1 && full[0].join() === d.solucao.join();
const sol = d.solucao;
const tv = d.boatos.map((s) => holds(s, sol));
console.log('verdade dos boatos na solução:', tv.join(' '), `(precisa ter exatamente ${K} verdadeiros:`, tv.filter(Boolean).length === K, ')');
ok = ok && tv.filter(Boolean).length === K && d.confirmadas.every((s) => holds(s, sol));
d.confirmadas.forEach((_, i) => {
  const n = sat(d.confirmadas.filter((_, j) => j !== i), d.boatos, K).length;
  console.log(`  sem a confirmada ${i + 1}: ${n} soluções ${n > 1 ? '✓ (era necessária)' : '✗'}`);
  ok = ok && n > 1;
});
d.boatos.forEach((_, i) => {
  const n = sat(d.confirmadas, d.boatos.filter((_, j) => j !== i), tv[i] ? K - 1 : K).length;
  console.log(`  sem o boato ${i + 1}: ${n} soluções ${n > 1 ? '✓ (era necessário)' : '✗'}`);
  ok = ok && n > 1;
});
const onlyConf = sat(d.confirmadas, [], null).length;
console.log('só com as confirmadas:', onlyConf, 'ordens possíveis', onlyConf >= 8 ? '✓' : '✗');
ok = ok && onlyConf >= 8;
// variantes erradas de ler a lei: tratar todos os boatos como falsos / como verdadeiros / ignorar a lei
for (const [nome, k] of [['todos os boatos falsos', 0], ['todos os boatos verdadeiros', d.boatos.length]]) {
  const n = sat(d.confirmadas, d.boatos, k).length;
  console.log(`  ${nome}: ${n} soluções`);
  ok = ok && !(n === 1 && sat(d.confirmadas, d.boatos, k)[0].join() === sol.join());
}
const natural = [1, 2, 3, 4, 5];
console.log('ordem natural 1-2-3-4-5 é a solução?', natural.join() === sol.join() ? 'SIM ✗' : 'não ✓');
ok = ok && natural.join() !== sol.join();
console.log(ok ? '\nOK: solução única e todas as pistas são necessárias.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
