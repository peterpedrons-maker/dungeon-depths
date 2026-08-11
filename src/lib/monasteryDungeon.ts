import { DungeonRoom, PathChoice, EncounterType } from '@/types/game';

// Mystery Monastery of Frost Heart - Hand-crafted dungeon layout
// Based on imported dungeon generator data

export interface MonasteryRoomData {
  id: string;
  name: string;
  description: string;
  theme: 'mossy' | 'crypt' | 'lava' | 'ice';
  floor: number;
  connections: {
    direction: 'forward' | 'left' | 'right';
    toRoomId: string;
    encounterType: EncounterType;
    riskLevel: 1 | 2 | 3;
    pathDescription: string;
  }[];
  note?: string;
}

// The monastery dungeon rooms based on the JSON structure
const MONASTERY_ROOMS: MonasteryRoomData[] = [
  // Entry - Main Hall (the entrance at 0,0)
  {
    id: 'monastery-entry',
    name: 'Monastery Entrance',
    description: 'The ancient entrance to the Mystery Monastery of Frost Heart. For a millennium it was considered lost, now occupied by bandits.',
    theme: 'ice',
    floor: 1,
    connections: [
      { direction: 'forward', toRoomId: 'main-hall', encounterType: 'battle', riskLevel: 2, pathDescription: 'Heavy footsteps echo from the main hall...' },
      { direction: 'left', toRoomId: 'south-chapel', encounterType: 'treasure', riskLevel: 1, pathDescription: 'A dim glow emanates from the southern passage.' },
      { direction: 'right', toRoomId: 'north-passage', encounterType: 'battle', riskLevel: 2, pathDescription: 'Gruff voices argue ahead.' },
    ],
  },
  
  // Main Hall
  {
    id: 'main-hall',
    name: 'The Grand Hall',
    description: 'A vast hall with crumbling pillars. Frost covers the ancient stone walls.',
    theme: 'ice',
    floor: 1,
    connections: [
      { direction: 'forward', toRoomId: 'crystal-chamber', encounterType: 'treasure', riskLevel: 2, pathDescription: 'A strange light pulses from ahead...' },
      { direction: 'left', toRoomId: 'west-rotunda', encounterType: 'merchant', riskLevel: 1, pathDescription: 'Warmth and firelight flicker to the left.' },
      { direction: 'right', toRoomId: 'east-rotunda', encounterType: 'battle', riskLevel: 3, pathDescription: 'Rattling bones echo from the eastern passage.' },
    ],
    note: 'An enormous crystal answers one question if struck hard.',
  },
  
  // Crystal Chamber (note 1 - the crystal)
  {
    id: 'crystal-chamber',
    name: 'Crystal Chamber',
    description: 'An enormous crystal dominates this room, pulsing with ancient magic. It is said to answer one question if struck hard.',
    theme: 'ice',
    floor: 2,
    connections: [
      { direction: 'forward', toRoomId: 'frozen-pool', encounterType: 'battle', riskLevel: 2, pathDescription: 'Ice crackles ahead...' },
      { direction: 'left', toRoomId: 'meditation-hall', encounterType: 'treasure', riskLevel: 2, pathDescription: 'Ancient prayer beads glitter in the darkness.' },
    ],
  },
  
  // South Chapel (note 7 - treasure room)
  {
    id: 'south-chapel',
    name: 'Southern Chapel',
    description: 'A small chapel with a hidden alcove. A rusty spear, scale mail, and some gold lie hidden in a crevice.',
    theme: 'ice',
    floor: 1,
    connections: [
      { direction: 'forward', toRoomId: 'crypt-entrance', encounterType: 'battle', riskLevel: 2, pathDescription: 'The smell of death wafts from below...' },
    ],
  },
  
  // North Passage
  {
    id: 'north-passage',
    name: 'Northern Corridor',
    description: 'A long corridor leading deeper into the monastery. Bandits have made camp here.',
    theme: 'ice',
    floor: 1,
    connections: [
      { direction: 'forward', toRoomId: 'bandit-camp', encounterType: 'battle', riskLevel: 3, pathDescription: 'The bandit leader awaits...' },
      { direction: 'right', toRoomId: 'hidden-treasury', encounterType: 'treasure', riskLevel: 1, pathDescription: 'A loose stone reveals a hidden path.' },
    ],
  },
  
  // West Rotunda (note 8 - key chest)
  {
    id: 'west-rotunda',
    name: 'Western Rotunda',
    description: 'A circular chamber with a domed ceiling. A chest sits in the center, containing a mysterious key.',
    theme: 'ice',
    floor: 1,
    connections: [
      { direction: 'forward', toRoomId: 'locked-vault', encounterType: 'treasure', riskLevel: 1, pathDescription: 'A heavy stone door bears a keyhole.' },
      { direction: 'left', toRoomId: 'artifact-room', encounterType: 'treasure', riskLevel: 3, pathDescription: 'Strange runes glow on the floor ahead.' },
    ],
  },
  
  // East Rotunda (note 5 - human remains)
  {
    id: 'east-rotunda', 
    name: 'Eastern Rotunda',
    description: 'A circular room. The remains of a human lie here, candles still clutched in skeletal hands.',
    theme: 'crypt',
    floor: 1,
    connections: [
      { direction: 'forward', toRoomId: 'catacombs', encounterType: 'battle', riskLevel: 3, pathDescription: 'Unholy whispers call from the darkness.' },
      { direction: 'right', toRoomId: 'rear-entrance', encounterType: 'merchant', riskLevel: 1, pathDescription: 'Daylight streams through a crack.' },
    ],
  },
  
  // Frozen Pool (water area from JSON)
  {
    id: 'frozen-pool',
    name: 'The Frozen Pool',
    description: 'A chamber with a frozen underground pool. The ice is unnaturally thick and clear.',
    theme: 'ice',
    floor: 2,
    connections: [
      { direction: 'forward', toRoomId: 'inner-sanctum', encounterType: 'battle', riskLevel: 3, pathDescription: 'The final passage awaits...' },
      { direction: 'left', toRoomId: 'monks-quarters', encounterType: 'merchant', riskLevel: 1, pathDescription: 'A survivor hides in the old quarters.' },
    ],
  },
  
  // Meditation Hall
  {
    id: 'meditation-hall',
    name: 'Meditation Hall',
    description: 'Rows of prayer cushions covered in frost. Ancient texts line the walls.',
    theme: 'ice',
    floor: 2,
    connections: [
      { direction: 'forward', toRoomId: 'library', encounterType: 'treasure', riskLevel: 2, pathDescription: 'Dusty tomes await discovery.' },
    ],
  },
  
  // Crypt Entrance
  {
    id: 'crypt-entrance',
    name: 'Crypt Entrance',
    description: 'Stone stairs lead down into the monastery crypt. Cold emanates from below.',
    theme: 'crypt',
    floor: 2,
    connections: [
      { direction: 'forward', toRoomId: 'crypt-depths', encounterType: 'battle', riskLevel: 3, pathDescription: 'The dead do not rest peacefully here.' },
    ],
  },
  
  // Bandit Camp
  {
    id: 'bandit-camp',
    name: 'Bandit Stronghold',
    description: 'The bandits have fortified this area. Stolen goods are piled high.',
    theme: 'ice',
    floor: 2,
    connections: [
      { direction: 'forward', toRoomId: 'bandit-leader', encounterType: 'battle', riskLevel: 3, pathDescription: 'The bandit chief awaits in his throne room.' },
      { direction: 'left', toRoomId: 'armory', encounterType: 'treasure', riskLevel: 2, pathDescription: 'Weapons gleam in the armory.' },
    ],
  },
  
  // Hidden Treasury
  {
    id: 'hidden-treasury',
    name: 'Hidden Treasury',
    description: 'A secret room filled with the monastery\'s hidden wealth.',
    theme: 'ice',
    floor: 2,
    connections: [
      { direction: 'forward', toRoomId: 'monastery-entry', encounterType: 'merchant', riskLevel: 1, pathDescription: 'A passage loops back to the entrance.' },
    ],
  },
  
  // Locked Vault (note 3 - stone door with keyhole)
  {
    id: 'locked-vault',
    name: 'The Sealed Vault',
    description: 'A round stone double door with a keyhole on the western wall. What secrets lie within?',
    theme: 'ice',
    floor: 2,
    connections: [
      { direction: 'forward', toRoomId: 'treasure-vault', encounterType: 'treasure', riskLevel: 1, pathDescription: 'Untold riches await those with the key.' },
    ],
  },
  
  // Artifact Room (note 4 - strange object)
  {
    id: 'artifact-room',
    name: 'Chamber of the Unknown',
    description: 'A strange object made of unknown material sits in the middle of a circle of runes on the ground.',
    theme: 'ice',
    floor: 2,
    connections: [
      { direction: 'forward', toRoomId: 'inner-sanctum', encounterType: 'battle', riskLevel: 3, pathDescription: 'The artifact pulses with dark energy.' },
    ],
  },
  
  // Catacombs (note 2 - gems in crate)
  {
    id: 'catacombs',
    name: 'The Catacombs',
    description: 'Endless rows of burial niches. A broken crate spills gems across the floor.',
    theme: 'crypt',
    floor: 2,
    connections: [
      { direction: 'forward', toRoomId: 'ossuary', encounterType: 'battle', riskLevel: 3, pathDescription: 'The bones begin to stir...' },
      { direction: 'right', toRoomId: 'hidden-tomb', encounterType: 'treasure', riskLevel: 2, pathDescription: 'A forgotten tomb lies undisturbed.' },
    ],
  },
  
  // Rear Entrance (note 6)
  {
    id: 'rear-entrance',
    name: 'Rear Entrance',
    description: 'A secondary entrance to the monastery. Bandits use this for quick escapes.',
    theme: 'ice',
    floor: 1,
    connections: [
      { direction: 'forward', toRoomId: 'outside-path', encounterType: 'merchant', riskLevel: 1, pathDescription: 'A merchant camps outside, away from the bandits.' },
    ],
  },
  
  // Inner Sanctum (ending room)
  {
    id: 'inner-sanctum',
    name: 'The Frost Heart Sanctum',
    description: 'The heart of the monastery. An ancient ice elemental guards the sacred relic - the Frost Heart.',
    theme: 'ice',
    floor: 3,
    connections: [], // Final room - boss fight leads to victory
  },
  
  // Additional supporting rooms
  {
    id: 'monks-quarters',
    name: 'Monks\' Quarters',
    description: 'Simple cells where the monks once lived. A survivor sells supplies.',
    theme: 'ice',
    floor: 2,
    connections: [
      { direction: 'forward', toRoomId: 'inner-sanctum', encounterType: 'battle', riskLevel: 3, pathDescription: 'The final guardian awaits.' },
    ],
  },
  
  {
    id: 'library',
    name: 'The Frozen Library',
    description: 'Ancient texts preserved in ice. Knowledge frozen in time.',
    theme: 'ice',
    floor: 2,
    connections: [
      { direction: 'forward', toRoomId: 'inner-sanctum', encounterType: 'battle', riskLevel: 3, pathDescription: 'A secret passage leads to the sanctum.' },
    ],
  },
  
  {
    id: 'crypt-depths',
    name: 'Crypt Depths',
    description: 'The deepest part of the crypt. Frost and death intertwine.',
    theme: 'crypt',
    floor: 3,
    connections: [
      { direction: 'forward', toRoomId: 'inner-sanctum', encounterType: 'battle', riskLevel: 3, pathDescription: 'An ancient passage connects to the sanctum.' },
    ],
  },
  
  {
    id: 'bandit-leader',
    name: 'Bandit Throne Room',
    description: 'The bandit chief has claimed this chamber as his throne room.',
    theme: 'ice',
    floor: 2,
    connections: [
      { direction: 'forward', toRoomId: 'secret-passage', encounterType: 'treasure', riskLevel: 2, pathDescription: 'Behind the throne lies a secret...' },
    ],
  },
  
  {
    id: 'armory',
    name: 'The Armory',
    description: 'Weapons and armor from a forgotten age.',
    theme: 'ice',
    floor: 2,
    connections: [
      { direction: 'forward', toRoomId: 'bandit-camp', encounterType: 'battle', riskLevel: 2, pathDescription: 'Back to the bandit camp.' },
    ],
  },
  
  {
    id: 'treasure-vault',
    name: 'The Monastery Vault',
    description: 'Gold, gems, and artifacts accumulated over centuries.',
    theme: 'ice',
    floor: 2,
    connections: [
      { direction: 'forward', toRoomId: 'inner-sanctum', encounterType: 'battle', riskLevel: 3, pathDescription: 'A hidden stair leads to the sanctum.' },
    ],
  },
  
  {
    id: 'ossuary',
    name: 'The Ossuary',
    description: 'Bones of ancient monks arranged in macabre patterns.',
    theme: 'crypt',
    floor: 3,
    connections: [
      { direction: 'forward', toRoomId: 'inner-sanctum', encounterType: 'battle', riskLevel: 3, pathDescription: 'The dead point the way forward.' },
    ],
  },
  
  {
    id: 'hidden-tomb',
    name: 'Hidden Tomb',
    description: 'The tomb of an ancient monastery founder. Riches guard his rest.',
    theme: 'crypt',
    floor: 2,
    connections: [
      { direction: 'forward', toRoomId: 'catacombs', encounterType: 'battle', riskLevel: 2, pathDescription: 'Return to the catacombs.' },
    ],
  },
  
  {
    id: 'outside-path',
    name: 'Mountain Path',
    description: 'A treacherous path along the mountainside. Fresh air at last.',
    theme: 'ice',
    floor: 1,
    connections: [
      { direction: 'forward', toRoomId: 'rear-entrance', encounterType: 'battle', riskLevel: 2, pathDescription: 'Back into the monastery.' },
    ],
  },
  
  {
    id: 'secret-passage',
    name: 'Secret Passage',
    description: 'A hidden passage behind the bandit throne.',
    theme: 'ice',
    floor: 3,
    connections: [
      { direction: 'forward', toRoomId: 'inner-sanctum', encounterType: 'battle', riskLevel: 3, pathDescription: 'The sanctum lies ahead.' },
    ],
  },
];

// Build a lookup map for quick access
const roomMap = new Map<string, MonasteryRoomData>();
MONASTERY_ROOMS.forEach(room => roomMap.set(room.id, room));

export function getMonasteryRoom(roomId: string): DungeonRoom | null {
  const roomData = roomMap.get(roomId);
  if (!roomData) return null;
  
  const paths: PathChoice[] = roomData.connections.map((conn, index) => ({
    id: `${roomData.id}-path-${conn.direction}-${index}`,
    name: conn.direction === 'forward' ? 'Continue Forward' : 
          conn.direction === 'left' ? 'Turn Left' : 'Turn Right',
    direction: conn.direction,
    description: conn.pathDescription,
    riskLevel: conn.riskLevel,
    encounterType: conn.encounterType,
  }));
  
  return {
    id: roomData.id,
    name: roomData.name,
    description: roomData.description,
    theme: roomData.theme,
    floor: roomData.floor,
    paths,
  };
}

export function getMonasteryStartRoom(): DungeonRoom {
  return getMonasteryRoom('monastery-entry')!;
}

export function getNextMonasteryRoom(currentRoomId: string, pathId: string): DungeonRoom | null {
  const currentRoom = roomMap.get(currentRoomId);
  if (!currentRoom) return null;
  
  // Find the connection by matching the path ID pattern
  const pathParts = pathId.split('-path-');
  if (pathParts.length < 2) return null;
  
  const directionPart = pathParts[1]; // e.g., "forward-0"
  const direction = directionPart.split('-')[0] as 'forward' | 'left' | 'right';
  
  const connection = currentRoom.connections.find(c => c.direction === direction);
  if (!connection) return null;
  
  return getMonasteryRoom(connection.toRoomId);
}

export function isMonasteryBossRoom(roomId: string): boolean {
  return roomId === 'inner-sanctum';
}

export function getMonasteryDungeonInfo() {
  return {
    title: 'Mystery Monastery of Frost Heart',
    story: 'For a millennium the monastery was considered lost. Lately it was squatted by a party of bandits.',
    totalRooms: MONASTERY_ROOMS.length,
    startRoomId: 'monastery-entry',
    bossRoomId: 'inner-sanctum',
  };
}
