import { EnemyInstance, EnemyTier } from '../types/game';

// Base tiers, picked by depth bracket. Stats then scale continuously with
// depth on top of the tier's base, so a deep run stays a real challenge even
// well past the last named tier.
const TIERS: EnemyTier[] = [
  { shape: 'goblin',   name: 'Goblin',              color: '#5a8a3c', minDepth: 1,  hp: 12, atk: 4,  def: 1,  xp: 6,  gold: 4 },
  { shape: 'wolf',     name: 'Lobo Selvagem',        color: '#6b6b78', minDepth: 3,  hp: 17, atk: 6,  def: 1,  xp: 9,  gold: 6 },
  { shape: 'skeleton', name: 'Esqueleto',            color: '#d8d2b8', minDepth: 5,  hp: 23, atk: 7,  def: 3,  xp: 13, gold: 9 },
  { shape: 'orc',      name: 'Orc Guerreiro',        color: '#4f7a3a', minDepth: 8,  hp: 36, atk: 10, def: 5,  xp: 19, gold: 14 },
  { shape: 'troll',    name: 'Troll das Cavernas',   color: '#7a5230', minDepth: 12, hp: 58, atk: 14, def: 7,  xp: 28, gold: 22 },
  { shape: 'horror',   name: 'Aberração das Sombras', color: '#3a2a52', minDepth: 16, hp: 74, atk: 17, def: 6,  xp: 38, gold: 30 },
  { shape: 'dragon',   name: 'Dragão Jovem',         color: '#a5271f', minDepth: 20, hp: 105, atk: 21, def: 10, xp: 55, gold: 45 },
];

export function tierForDepth(depth: number): EnemyTier {
  let chosen = TIERS[0];
  for (const t of TIERS) {
    if (depth >= t.minDepth) chosen = t;
  }
  return chosen;
}

export function spawnEnemy(depth: number): EnemyInstance {
  const tier = tierForDepth(depth);
  const growth = 1 + depth * 0.055;
  const hp = Math.round(tier.hp * growth);
  return {
    name: tier.name,
    shape: tier.shape,
    color: tier.color,
    hp, maxHp: hp,
    atk: Math.round(tier.atk * growth),
    def: Math.round(tier.def * (1 + depth * 0.03)),
    xpReward: Math.round(tier.xp * (1 + depth * 0.08)),
    goldReward: Math.round(tier.gold * (1 + depth * 0.08)),
  };
}
