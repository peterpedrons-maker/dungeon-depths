import assert from 'node:assert/strict';
import test from 'node:test';
import { CLASSES, MAGICAL_CLASSES } from './classes.ts';
import { ATTRIBUTE_KEYS } from './attributes.ts';
import { DUNGEONS } from './dungeons.ts';
import { AFFIX_COUNT_RANGE, AFFIX_SCALE, affixCountForRarity, generateItem } from './equipment.ts';
import { applyAffixGrowth } from './enhancement.ts';
import { MAX_EQUIPPED_ABILITIES } from './skills.ts';
import { canUseRuneOn } from './runes.ts';
import { capThornsForAction, thornsDamageForAction } from './thorns.ts';
import { visualTierForItem } from './itemVisuals.ts';
import { MAX_TIER, TIER_MATERIAL, tierForDungeonOrdinal } from './itemTiers.ts';
import { migrateItem } from './storage.ts';
import { computeCombatStats } from './combatStats.ts';
import { directHealAmount, healingBaseHp } from './healing.ts';
import type { Character, EquipmentItem } from '../types/game.ts';
import type { SecondaryStatType } from '../types/game.ts';

test('a escada de tiers cobre três masmorras por tier até Aço Estelar', () => {
  assert.equal(MAX_TIER, 11);
  assert.equal(TIER_MATERIAL[10], 'de Aço Estelar');
  for (let ordinal = 1; ordinal <= 33; ordinal++) assert.equal(tierForDungeonOrdinal(ordinal), Math.floor((ordinal - 1) / 3) + 1);
  assert.deepEqual(DUNGEONS.slice(0, 3).map((d) => d.itemTier), [1, 1, 1]);
  assert.deepEqual(DUNGEONS.slice(-3).map((d) => d.itemTier), [11, 11, 11]);
  assert.equal(Math.ceil(DUNGEONS.length / 3), MAX_TIER);
  assert.equal(visualTierForItem(11), 10);
});

test('qualidade enviesia a quantidade sem escapar da faixa da raridade', () => {
  for (const rarity of Object.keys(AFFIX_COUNT_RANGE) as Array<keyof typeof AFFIX_COUNT_RANGE>) {
    const [min, max] = AFFIX_COUNT_RANGE[rarity];
    assert.equal(affixCountForRarity(rarity, 0, () => 0.999999), min);
    assert.equal(affixCountForRarity(rarity, 0.4, () => 0), max);
  }
});

test('rolls respeitam classes, slots, prioridade de atributo e canais vivos', () => {
  const classIds = Object.keys(CLASSES) as Array<keyof typeof CLASSES>;
  for (const classId of classIds) {
    for (const slot of ['weapon', 'body', 'legs', 'hands', 'accessory'] as const) {
      for (let i = 0; i < 12; i++) {
        const item = generateItem(slot, classId, 11, 0.4, 'legendario');
        const attrs = item.secondaryStats.filter((s) => ATTRIBUTE_KEYS.includes(s.type as typeof ATTRIBUTE_KEYS[number]));
        assert.ok(attrs.length <= 1, `${classId}/${slot} rolled more than one attribute`);
        assert.ok(item.secondaryStats.every((s) => MAGICAL_CLASSES.includes(classId) ? s.type !== 'atk' : s.type !== 'matk'));
        assert.ok(item.secondaryStats.length >= 3 && item.secondaryStats.length <= 5);
        assert.ok(item.itemSchemaVersion === 2);
      }
    }
  }
  const scaleChecks: Array<[SecondaryStatType, number]> = [
    ['crit', 0.12], ['critDmg', 0.22], ['thorns', 0.16], ['healingPower', 0.12], ['barrierPower', 0.10], ['str', 0.30], ['agi', 0.055],
  ];
  for (const [type, scale] of scaleChecks) assert.equal(AFFIX_SCALE[type], scale);
});

test('a Forja deixa atributos intactos', () => {
  const item = {
    id: 'attr', name: 'Teste', classId: 'bardo' as const, slot: 'weapon' as const, rarity: 'comum' as const, tier: 1,
    dmgBonus: 10, defBonus: 0, hpBonus: 0, matkBonus: 0, mdefBonus: 0, critChanceBonus: 0, critDmgBonus: 0, cdrBonus: 0,
    secondaryStats: [{ type: 'wis' as const, value: 8 }], enhanceLevel: 0,
  };
  assert.deepEqual(applyAffixGrowth(item, 0), item);
});

test('migração de equipamento é idempotente e preserva Forja', () => {
  const old = {
    id: 'legacy', name: 'Anel antigo', classId: 'bardo', slot: 'accessory', accessoryType: 'anel', rarity: 'raro', tier: 10,
    critChanceBonus: 10, critDmgBonus: 20, secondaryStats: [{ type: 'crit', value: 0.30 }],
    enhanceLevel: 4, affixBoosts: [0.12], originalAffixCount: 1, gridX: 2, gridY: 1,
  };
  const migrated = migrateItem(old);
  assert.equal(migrated.itemSchemaVersion, 2);
  assert.equal(migrated.critChanceBonus, 4.4);
  assert.equal(migrated.critDmgBonus, 9);
  assert.equal(migrated.secondaryStats[0].value, 0.12);
  assert.deepEqual(migrated.affixBoosts, old.affixBoosts);
  assert.deepEqual(migrateItem(migrated), migrated);
});


test('runas respeitam o Tier 11 e o loadout comporta cinco ativas', () => {
  const item = generateItem('weapon', 'bardo', 11, 0, 'comum');
  assert.equal(canUseRuneOn({ rarity: 'comum', tier: 10, count: 1 }, item), false);
  assert.equal(canUseRuneOn({ rarity: 'comum', tier: 11, count: 1 }, item), true);
  assert.equal(MAX_EQUIPPED_ABILITIES, 5);
});

test('Espinhos calcula antes de bloqueio/barreira e limita 4% do HP inimigo por ação', () => {
  assert.equal(thornsDamageForAction([1000], 0.16, 1000), 40);
  assert.equal(capThornsForAction(999, 1000), 40);
  assert.equal(thornsDamageForAction([100, 100], 0.50, 10000), 100);
  assert.equal(thornsDamageForAction([0, -5], 0.50, 10000), 0);
});

function foundationCharacter(equipment: Partial<Character['equipment']> = {}): Character {
  return {
    name: 'Fundação', classId: 'druida', level: 20, xp: 0, xpToNext: 100, hp: 100, maxHp: 100,
    atk: 10, def: 10, matk: 10, mdef: 10, gold: 0, potions: 0, potionThreshold: 0.3,
    bestDepth: 0, skillPoints: 0, attributePoints: 15,
    allocatedAttrs: { str: 0, dex: 0, agi: 0, vit: 0, int: 0, wis: 15, luk: 0 },
    unlockedSkills: [], equippedAbilities: [], abilityThresholds: {}, inventory: [], runes: [], merchantStock: [],
    equipment: { weapon: null, body: null, legs: null, hands: null, offhand: null, accessory: null, ...equipment },
  };
}

function statItem(secondaryStats: EquipmentItem['secondaryStats']): EquipmentItem {
  return {
    id: 'stat-item', name: 'Stat item', classId: 'druida', slot: 'accessory', rarity: 'raro', tier: 6,
    accessoryType: 'anel', dmgBonus: 0, defBonus: 0, hpBonus: 0, matkBonus: 0, mdefBonus: 0,
    critChanceBonus: 0, critDmgBonus: 0, cdrBonus: 0, secondaryStats, enhanceLevel: 0,
  };
}

test('Poder de Cura/Barreira usam SAB total, afinidade, equipamento e caps separados', () => {
  const bare = computeCombatStats(foundationCharacter());
  assert.equal(bare.healingPowerPct, 0.4);
  assert.equal(bare.barrierPowerPct, 0.3);
  const geared = computeCombatStats(foundationCharacter({ accessory: statItem([
    { type: 'healingPower', value: 0.1 }, { type: 'barrierPower', value: 0.1 },
  ]) }));
  assert.equal(geared.healingPowerPct, 0.5);
  assert.equal(geared.barrierPowerPct, 0.4);
  assert.equal(healingBaseHp(30, 20), 220);
  assert.equal(directHealAmount(30, 20, 0.1, 0.5), 33);
});
