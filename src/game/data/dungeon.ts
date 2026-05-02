/**
 * Tile-based dungeon data.
 * Grid: 2D array of cell types. Each cell is 2 units wide.
 * # = wall, . = floor, D = door, > = stairs down, < = stairs up,
 * F = fountain (save), C = chest, T = torch, P = pillar, S = statue,
 * B = barrel, K = bookshelf, A = altar, X = player spawn
 */
export type TileChar =
  | "#"
  | "."
  | "D"
  | ">"
  | "<"
  | "F"
  | "C"
  | "T"
  | "P"
  | "S"
  | "B"
  | "K"
  | "A"
  | "X"
  | "M" // mossy wall
  | "W" // water/puddle
  | "E"; // enemy spawn (skeleton)

export const TILE_SIZE = 2;
export const WALL_HEIGHT = 3.2;

export interface DungeonLevel {
  id: string;
  name: string;
  theme: "hub" | "catacombs" | "library" | "forge";
  grid: string[];
  fogColor: number;
  fogNear: number;
  fogFar: number;
  ambient: number;
}

/** Hub - Vila do Limiar. Open courtyard with fountain, NPCs, chests, sealed gates. */
export const HUB: DungeonLevel = {
  id: "hub",
  name: "Vila do Limiar",
  theme: "hub",
  fogColor: 0x1a1820,
  fogNear: 6,
  fogFar: 32,
  ambient: 0.55,
  grid: [
    "###############",
    "#P...T...T...P#",
    "#.............#",
    "#..K.......C..#",
    "#.....S.S.....#",
    "#......F......#",
    "#X....FFF.....#",
    "#......F......#",
    "#.....S.S.....#",
    "#..C.......B..#",
    "#.............#",
    "#P...T...T...P#",
    "###############",
  ],
};

/** Catacombs first room - dense pillars, torches, bones (barrels stand-in), water. */
export const CATACOMBS: DungeonLevel = {
  id: "catacombs_1",
  name: "Catacumbas Inundadas",
  theme: "catacombs",
  fogColor: 0x0a0e14,
  fogNear: 3,
  fogFar: 18,
  ambient: 0.35,
  grid: [
    "#####################",
    "#X..T....P....T...E##",
    "#....P.......P......#",
    "#.S......E.....S....#",
    "#....C....F....C....#",
    "#.P................P#",
    "#....T....A....T....#",
    "#.P................P#",
    "#....C....F....C....#",
    "#.S......E.....S....#",
    "#....P.......P......#",
    "#....T....P....T....#",
    "#####################",
  ],
};

export const LEVELS: Record<string, DungeonLevel> = {
  hub: HUB,
  catacombs_1: CATACOMBS,
};
