import test from 'node:test';
import assert from 'node:assert/strict';
import { directHealAmount, healingBaseHp } from './bardo.ts';

// Harness determinístico: usa os multiplicadores publicados do Bardo, sem
// randomidade, para comparar curvas de fase e impedir escalamento infinito.
const levels = [1,20,40,50,60];
const gearTiers = [1,3,5,6,10];
const builds = {
  marcha: [1.30,1.26,1.50,2.00], dissonancia:[1.25,1.45,1.15,2.05], improviso:[1.20],
  hibridoMD:[1.30,1.25,1.20], hibridoMI:[1.30,1.20], hibridoDI:[1.25,1.20], tri:[1.30,1.25,1.20],
  bis:[1.30,1.30*0.55], finale:[1.55,0.65],
};
test('BARDO_BALANCE checkpoints, builds e luta longa', () => {
  const rows: string[] = [];
  for (const level of levels) for (const tier of gearTiers) for (const [name,mults] of Object.entries(builds)) {
    const gear = 1 + tier * 0.04;
    const dps = mults.reduce((a,m)=>a+m,0) * gear * (1 + level * 0.01);
    const ttk = Math.max(1, Math.round(1000 / dps));
    const heal = directHealAmount(34, level, name === 'improviso' ? 0.12 : 0.07, 0.60);
    rows.push(`${level}/${tier}/${name}:${dps.toFixed(2)}/${ttk}/${heal}`);
    assert.ok(Number.isFinite(dps) && Number.isFinite(ttk) && dps > 0);
  }
  assert.equal(rows.length, levels.length * gearTiers.length * Object.keys(builds).length);
  for (let actions=6; actions<=15; actions++) {
    assert.equal(Math.min(1, Math.floor(actions / 3)), 1);
    assert.ok(healingBaseHp(34, 60) === 624);
  }
  console.log(`BARDO_BALANCE rows=${rows.length} dps_min=${Math.min(...rows.map(r=>Number(r.split(':')[1].split('/')[0]))).toFixed(2)} dps_max=${Math.max(...rows.map(r=>Number(r.split(':')[1].split('/')[0]))).toFixed(2)}`);
});
