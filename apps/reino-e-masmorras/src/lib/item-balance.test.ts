import assert from 'node:assert/strict';
import test from 'node:test';
import { AFFIX_COUNT_RANGE } from './equipment.ts';
import { ITEM_HARNESS_QUALITIES, ITEM_HARNESS_RARITIES, ITEM_HARNESS_TIERS, runItemHarness } from './itemBalance.ts';

test('harness de itens cobre tiers, raridades, qualidades e afixos vivos', () => {
  const scenarios = runItemHarness(4);
  assert.equal(scenarios.length, ITEM_HARNESS_TIERS.length * ITEM_HARNESS_RARITIES.length * ITEM_HARNESS_QUALITIES.length);
  for (const scenario of scenarios) {
    const range = AFFIX_COUNT_RANGE[scenario.rarity];
    const { summary } = scenario;
    assert.equal(summary.deadAffixCount, 0, `${scenario.tier}/${scenario.rarity}/${scenario.quality}`);
    assert.ok(summary.affixCount.min >= range[0]);
    assert.ok(summary.affixCount.max <= range[1]);
    for (const values of Object.values(summary.statValues)) {
      assert.ok(values && values.min >= 0);
      assert.ok(values && values.max >= values.min);
    }
  }
  for (const rarity of ITEM_HARNESS_RARITIES) {
    const low = scenarios.find((s) => s.tier === 6 && s.rarity === rarity && s.quality === 0)!.summary.affixCount.mean;
    const high = scenarios.find((s) => s.tier === 6 && s.rarity === rarity && s.quality === 0.4)!.summary.affixCount.mean;
    assert.ok(high >= low, `Quality não favoreceu ${rarity}: ${low} → ${high}`);
  }
});
