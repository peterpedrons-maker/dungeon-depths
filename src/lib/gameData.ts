import { DungeonRoom, PathChoice, EncounterType, Enemy, Item, PathDirection, EnemyAbility } from '@/types/game';

// Items database
export const ITEMS: Record<string, Item> = {
  minorPotion: {
    id: 'minor-potion',
    name: 'Minor Potion',
    type: 'potion',
    value: 25,
    effect: 30,
    description: 'Restores 30 HP',
  },
  majorPotion: {
    id: 'major-potion',
    name: 'Major Potion',
    type: 'potion',
    value: 60,
    effect: 70,
    description: 'Restores 70 HP',
  },
  rustySword: {
    id: 'rusty-sword',
    name: 'Rusty Sword',
    type: 'weapon',
    value: 40,
    effect: 5,
    description: '+5 Attack',
  },
  ironSword: {
    id: 'iron-sword',
    name: 'Iron Sword',
    type: 'weapon',
    value: 100,
    effect: 10,
    description: '+10 Attack',
  },
  steelBlade: {
    id: 'steel-blade',
    name: 'Steel Blade',
    type: 'weapon',
    value: 200,
    effect: 18,
    description: '+18 Attack',
  },
  leatherArmor: {
    id: 'leather-armor',
    name: 'Leather Armor',
    type: 'armor',
    value: 50,
    effect: 4,
    description: '+4 Defense',
  },
  chainmail: {
    id: 'chainmail',
    name: 'Chainmail',
    type: 'armor',
    value: 120,
    effect: 8,
    description: '+8 Defense',
  },
  plateArmor: {
    id: 'plate-armor',
    name: 'Plate Armor',
    type: 'armor',
    value: 250,
    effect: 15,
    description: '+15 Defense',
  },
};

// Enemy abilities definitions - increased chances for more dynamic combat
const ENEMY_ABILITIES: Record<string, EnemyAbility[]> = {
  goblin: [
    { type: 'multi_hit', chance: 35, value: 2, description: 'Flurry of Stabs' },
  ],
  skeleton: [
    { type: 'weaken', chance: 40, value: 20, duration: 5, description: 'Bone Chill' },
  ],
  giantRat: [
    { type: 'poison', chance: 50, value: 4, duration: 6, description: 'Infected Bite' },
  ],
  darkSlime: [
    { type: 'poison', chance: 50, value: 5, duration: 5, description: 'Corrosive Touch' },
    { type: 'weaken', chance: 35, value: 15, duration: 4, description: 'Acid Spray' },
  ],
  orcWarrior: [
    { type: 'stun', chance: 40, value: 1, duration: 2, description: 'Crushing Blow' },
    { type: 'enrage', chance: 35, value: 40, duration: 5, description: 'Battle Rage' },
  ],
  wraith: [
    { type: 'lifesteal', chance: 55, value: 60, description: 'Soul Drain' },
    { type: 'weaken', chance: 45, value: 25, duration: 4, description: 'Terrify' },
  ],
};

// BALANCED: Stronger enemy stats for challenging combat
const ENEMIES: Record<string, Omit<Enemy, 'health' | 'maxHealth'>> = {
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    attack: 16,
    defense: 6,
    goldReward: 15,
    expReward: 20,
    description: 'A sneaky green creature',
    abilities: ENEMY_ABILITIES.goblin,
  },
  skeleton: {
    id: 'skeleton',
    name: 'Skeleton',
    attack: 20,
    defense: 10,
    goldReward: 25,
    expReward: 30,
    description: 'Bones rattling in the dark',
    abilities: ENEMY_ABILITIES.skeleton,
  },
  giantRat: {
    id: 'giant-rat',
    name: 'Giant Rat',
    attack: 14,
    defense: 5,
    goldReward: 10,
    expReward: 15,
    description: 'Oversized and aggressive',
    abilities: ENEMY_ABILITIES.giantRat,
  },
  darkSlime: {
    id: 'dark-slime',
    name: 'Dark Slime',
    attack: 15,
    defense: 12,
    goldReward: 20,
    expReward: 25,
    description: 'Corrosive and resilient',
    abilities: ENEMY_ABILITIES.darkSlime,
  },
  orcWarrior: {
    id: 'orc-warrior',
    name: 'Orc Warrior',
    attack: 26,
    defense: 16,
    goldReward: 40,
    expReward: 50,
    description: 'A brutal green brute',
    abilities: ENEMY_ABILITIES.orcWarrior,
  },
  wraith: {
    id: 'wraith',
    name: 'Wraith',
    attack: 28,
    defense: 8,
    goldReward: 50,
    expReward: 60,
    description: 'A ghostly terror',
    abilities: ENEMY_ABILITIES.wraith,
  },
};

const DIRECTION_NAMES: Record<PathDirection, string> = {
  forward: 'Continue Forward',
  left: 'Turn Left',
  right: 'Turn Right',
};

const ROOM_NAMES = [
  'The Forgotten Hall',
  'Chamber of Echoes',
  'Moss-Covered Cavern',
  'The Sunken Crypt',
  'Hall of Bones',
  'The Gloom Depths',
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEncounterType(): EncounterType {
  const roll = Math.random();
  if (roll < 0.65) return 'battle';
  if (roll < 0.85) return 'merchant';
  return 'treasure';
}

function getRiskLevel(encounter: EncounterType): 1 | 2 | 3 {
  switch (encounter) {
    case 'merchant':
      return 1;
    case 'treasure':
      return 2;
    case 'battle':
      return 3;
  }
}

export function generateRoom(floor: number): DungeonRoom {
  const themes: Array<'mossy' | 'crypt' | 'lava' | 'ice'> = ['mossy', 'crypt', 'lava', 'ice'];
  const theme = themes[Math.min(floor - 1, themes.length - 1) % themes.length];
  
  const directions: PathDirection[] = ['left', 'forward', 'right'];
  
  // Generate truly unique room ID
  const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  const paths: PathChoice[] = directions.map((direction) => {
    const encounterType = generateEncounterType();
    // Generate truly unique path ID
    const pathId = `path-${direction}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    return {
      id: pathId,
      name: DIRECTION_NAMES[direction],
      direction,
      description: getPathDescription(encounterType),
      riskLevel: getRiskLevel(encounterType),
      encounterType,
    };
  });

  return {
    id: roomId,
    name: getRandomElement(ROOM_NAMES),
    description: `Floor ${floor} - ${theme.charAt(0).toUpperCase() + theme.slice(1)} Depths`,
    theme,
    floor,
    paths,
  };
}

function getPathDescription(encounter: EncounterType): string {
  switch (encounter) {
    case 'battle':
      return 'You hear growling ahead...';
    case 'merchant':
      return 'A faint light flickers ahead.';
    case 'treasure':
      return 'Something glimmers in the distance...';
  }
}

// BALANCED: Increased base health and stronger floor scaling
export function generateEnemy(floor: number): Enemy {
  const enemyKeys = Object.keys(ENEMIES);
  const scaledEnemies = floor <= 2 
    ? ['goblin', 'giantRat', 'darkSlime']
    : floor <= 4
    ? ['skeleton', 'darkSlime', 'orcWarrior']
    : enemyKeys;
  
  const enemyKey = getRandomElement(scaledEnemies);
  const baseEnemy = ENEMIES[enemyKey];
  // Increased floor scaling from 15% to 20%
  const floorBonus = (floor - 1) * 0.20;
  
  // Stronger base health values
  const baseHealth = enemyKey === 'goblin' ? 60 :
                     enemyKey === 'giantRat' ? 50 :
                     enemyKey === 'darkSlime' ? 75 :
                     enemyKey === 'skeleton' ? 70 :
                     enemyKey === 'orcWarrior' ? 100 :
                     85;

  return {
    ...baseEnemy,
    id: `${enemyKey}-${Date.now()}`,
    maxHealth: Math.floor(baseHealth * (1 + floorBonus)),
    health: Math.floor(baseHealth * (1 + floorBonus)),
    attack: Math.floor(baseEnemy.attack * (1 + floorBonus)),
    defense: Math.floor(baseEnemy.defense * (1 + floorBonus)),
    goldReward: Math.floor(baseEnemy.goldReward * (1 + floorBonus)),
    expReward: Math.floor(baseEnemy.expReward * (1 + floorBonus)),
  };
}

export function getMerchantItems(floor: number, isRevisited: boolean = false): Item[] {
  // Revisited merchants have limited stock
  if (isRevisited) {
    return [ITEMS.minorPotion];
  }
  
  const items: Item[] = [ITEMS.minorPotion, ITEMS.majorPotion];
  if (floor >= 1) items.push(ITEMS.rustySword, ITEMS.leatherArmor);
  if (floor >= 2) items.push(ITEMS.ironSword, ITEMS.chainmail);
  if (floor >= 3) items.push(ITEMS.steelBlade, ITEMS.plateArmor);
  return items;
}

export function getTreasureLoot(floor: number): { gold: number; item?: Item } {
  const baseGold = 30 + floor * 15;
  const goldVariance = Math.floor(Math.random() * 20) - 10;
  const gold = baseGold + goldVariance;
  
  // 40% chance to also get an item
  if (Math.random() < 0.4) {
    const possibleItems = [ITEMS.minorPotion, ITEMS.majorPotion];
    if (floor >= 2) possibleItems.push(ITEMS.rustySword, ITEMS.leatherArmor);
    if (floor >= 3) possibleItems.push(ITEMS.ironSword, ITEMS.chainmail);
    const item = possibleItems[Math.floor(Math.random() * possibleItems.length)];
    return { gold, item: { ...item, id: `${item.id}-${Date.now()}` } };
  }
  
  return { gold };
}
