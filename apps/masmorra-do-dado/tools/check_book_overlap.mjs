// Uso: node tools/check_book_overlap.mjs  (as medidas copiam as de src/book/book3d.ts: se mudar lá, mude aqui)
// Verifica (numericamente) se alguma peça do livro passa por dentro de outra enquanto a capa gira (a = π fechado → 0 aberto).
const BW = 0.5, BH = 0.68, GAP = 0.015, PWD = BW - 0.03, PHD = BH - 0.05;
const curve = (u) => -0.03 * (1 - u) ** 2;
// sólidos do lado direito (fixo), em x >= 0
const inside = (x, z, eps = 0.0015) => {
  const hits = [];
  // capa direita
  if (x > eps && x < BW - eps && z > -0.07 + eps && z < -0.04 - eps) hits.push('capaD');
  // miolo direito: x em [GAP, GAP+PWD], z de -0.04 até a curva do papel
  if (x > GAP + eps && x < GAP + PWD - eps) {
    const u = (x - GAP) / PWD;
    if (z > -0.04 + eps && z < curve(u) - eps) hits.push('mioloD');
  }
  return hits;
};
// pontos do lado esquerdo (no referencial dele, x <= 0), girados por a
const leftPts = [];
for (let i = 0; i <= 60; i++) {
  const x = -(i / 60) * BW;
  for (let j = 0; j <= 6; j++) leftPts.push(['capaE', x, -0.07 + (j / 6) * 0.03]);
  if (-x >= GAP && -x <= GAP + PWD) {
    const u = (-x - GAP) / PWD;
    for (let j = 0; j <= 6; j++) leftPts.push(['mioloE', x, -0.04 + (j / 6) * (curve(u) + 0.04)]);
  }
}
let bad = 0;
for (let s = 0; s <= 200; s++) {
  const a = Math.PI * (1 - s / 200);
  const c = Math.cos(a), sn = Math.sin(a);
  for (const [nm, x, z] of leftPts) {
    const X = c * x + sn * z;
    const Z = -sn * x + c * z;
    const h = inside(X, Z);
    if (h.length) { if (bad++ < 8) console.log('cruza', nm, h.join(), 'a=', a.toFixed(2), X.toFixed(3), Z.toFixed(3)); }
  }
  // lombada
  const ZO = -0.07;
  const p2x = sn * ZO, p2z = c * ZO;
  const cx = p2x / 2, cz = (ZO + p2z) / 2;
  let chx = p2x, chz = p2z - ZO;
  const len = Math.hypot(chx, chz);
  const r = Math.max(0.004, len / 2);
  if (len > 1e-6) { chx /= len; chz /= len; } else { chx = 1; chz = 0; }
  let ox = -chz, oz = chx;
  if (ox * (0.12 - cx) + oz * ((ZO + p2z) / 2 + 0.0001 - cz) > 0) { ox = -ox; oz = -oz; }
  for (let k = 1; k < 12; k++) {
    const t = (k / 12) * Math.PI;
    const X = cx - Math.cos(t) * r * chx + Math.sin(t) * r * ox;
    const Z = cz - Math.cos(t) * r * chz + Math.sin(t) * r * oz;
    // dentro do lado direito?
    if (inside(X, Z).length) { if (bad++ < 12) console.log('lombada cruza direito', a.toFixed(2)); }
    // dentro do lado esquerdo (voltando para o referencial dele)?
    const lx = c * X - sn * Z, lz = sn * X + c * Z;
    if (lx < -0.0015 && lx > -BW && lz > -0.07 + 0.0015 && lz < -0.04 - 0.0015) { if (bad++ < 12) console.log('lombada cruza capa esquerda', a.toFixed(2)); }
  }
}
console.log(bad ? `PROBLEMA: ${bad} cruzamentos` : 'OK: nada passa por dentro de nada');
// a folha que vira: nunca abaixo do papel da direita (θ pequeno) nem do da esquerda (θ perto de π)
let leafBad = 0;
for (let p = 0; p <= 1.0001; p += 0.01) {
  const e = p * p * (3 - 2 * p);
  for (const dir of [1, -1]) {
    const theta = dir > 0 ? Math.PI * e : Math.PI * (1 - e);
    const lag = 0.55 * Math.sin(Math.PI * p);
    for (let i = 0; i <= 18; i++) {
      const u = i / 18;
      const phi = Math.min(Math.PI, Math.max(0, theta - lag * u));
      const X = GAP + u * PWD * Math.cos(phi);
      const Z = 0.003 + u * PWD * Math.sin(phi) + curve(u) * Math.abs(Math.cos(theta)) ** 3;
      const ax = Math.abs(X);
      if (ax > GAP && ax < GAP + PWD) {
        const uu = (ax - GAP) / PWD;
        if (Z < curve(uu) - 0.0005) { if (leafBad++ < 5) console.log('folha abaixo do papel', p.toFixed(2), dir, u.toFixed(2), Z.toFixed(4), curve(uu).toFixed(4)); }
      }
    }
  }
}
console.log(leafBad ? `PROBLEMA na folha: ${leafBad}` : 'OK: a folha nunca entra no papel');
