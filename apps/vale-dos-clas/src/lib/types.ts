import type { Axial } from "./hex";

// =============================================================================
// VALE DOS CLÃS — tipos e tabelas de dados (terrenos, construções, tropas).
// =============================================================================

export type Terrain = "planicie" | "floresta" | "colina" | "montanha" | "agua";

// Depósito especial sorteado em alguns tiles — dá bônus a quem construir ali.
export type Deposit = "ouro" | "caca" | null;

export type ResourceKind = "madeira" | "pedra" | "comida" | "ouro";

export type BuildingId =
  | "paco"
  | "serraria"
  | "pedreira"
  | "fazenda"
  | "mercado"
  | "quartel"
  | "muralha"
  | "torre";

export type TroopId = "milicia" | "arqueiros" | "cavalaria";

export interface TerrainDef {
  id: Terrain;
  name: string;
  // cor base (sem sombreamento) usada no canvas
  color: string;
  colorHi: string;
  colorLo: string;
  buildable: boolean;
  // construções permitidas nesse terreno (além de quartel/mercado/muralha/torre, que valem em planície)
  favors?: BuildingId;
}

export const TERRAINS: Record<Terrain, TerrainDef> = {
  planicie: { id: "planicie", name: "Planície", color: "#5f8a3f", colorHi: "#82b85a", colorLo: "#3f5e28", buildable: true, favors: "fazenda" },
  floresta: { id: "floresta", name: "Floresta", color: "#2f5d3a", colorHi: "#4c8a5c", colorLo: "#1d3c25", buildable: true, favors: "serraria" },
  colina: { id: "colina", name: "Colina", color: "#8a7a4f", colorHi: "#b5a06c", colorLo: "#5e5233", buildable: true, favors: "pedreira" },
  montanha: { id: "montanha", name: "Montanha", color: "#7a7a82", colorHi: "#a3a3ac", colorLo: "#4e4e56", buildable: false },
  agua: { id: "agua", name: "Rio", color: "#2d5f7a", colorHi: "#4a8bad", colorLo: "#1a3a4a", buildable: false },
};

export interface BuildingDef {
  id: BuildingId;
  name: string;
  desc: string;
  // terrenos onde pode ser construído (vazio = qualquer terreno "buildable")
  terrains?: Terrain[];
  cost: Partial<Record<ResourceKind, number>>;
  buildSeconds: number;
  maxLevel: number;
  // produção por segundo NO NÍVEL 1 (escala com o nível)
  produces?: Partial<Record<ResourceKind, number>>;
  // defesa que soma ao vale quando construído
  defense?: number;
  // capacidade de população (só o Paço usa isso diretamente)
  popCap?: number;
}

export const BUILDINGS: Record<BuildingId, BuildingDef> = {
  paco: {
    id: "paco",
    name: "Paço do Vale",
    desc: "Coração do seu domínio. Abriga o conselho e teto populacional.",
    cost: {},
    buildSeconds: 0,
    maxLevel: 5,
    produces: { madeira: 0.2, pedra: 0.2, comida: 0.3, ouro: 0.1 },
    defense: 10,
    popCap: 20,
  },
  serraria: {
    id: "serraria",
    name: "Serraria",
    desc: "Corta e empilha madeira da floresta ao redor.",
    terrains: ["floresta"],
    cost: { madeira: 40, pedra: 10 },
    buildSeconds: 25,
    maxLevel: 4,
    produces: { madeira: 1.4 },
  },
  pedreira: {
    id: "pedreira",
    name: "Pedreira",
    desc: "Extrai pedra bruta das colinas.",
    terrains: ["colina"],
    cost: { madeira: 50, pedra: 10 },
    buildSeconds: 30,
    maxLevel: 4,
    produces: { pedra: 1.2 },
  },
  fazenda: {
    id: "fazenda",
    name: "Fazenda",
    desc: "Planta e colhe nas terras férteis da planície.",
    terrains: ["planicie"],
    cost: { madeira: 35, pedra: 5 },
    buildSeconds: 20,
    maxLevel: 4,
    produces: { comida: 1.6 },
  },
  mercado: {
    id: "mercado",
    name: "Mercado",
    desc: "Caravanas trocam excedentes por ouro.",
    terrains: ["planicie", "colina"],
    cost: { madeira: 60, pedra: 30 },
    buildSeconds: 40,
    maxLevel: 3,
    produces: { ouro: 0.6 },
  },
  quartel: {
    id: "quartel",
    name: "Quartel",
    desc: "Recruta e treina as tropas do clã.",
    terrains: ["planicie", "colina"],
    cost: { madeira: 70, pedra: 40 },
    buildSeconds: 45,
    maxLevel: 3,
  },
  muralha: {
    id: "muralha",
    name: "Muralha",
    desc: "Pedra empilhada nas bordas do vale — difículta ataques.",
    cost: { pedra: 60 },
    buildSeconds: 35,
    maxLevel: 3,
    defense: 14,
  },
  torre: {
    id: "torre",
    name: "Torre de Vigia",
    desc: "Avista acampamentos inimigos e reforça a defesa.",
    terrains: ["colina", "planicie"],
    cost: { madeira: 45, pedra: 35 },
    buildSeconds: 30,
    maxLevel: 3,
    defense: 8,
  },
};

export interface TroopDef {
  id: TroopId;
  name: string;
  cost: Partial<Record<ResourceKind, number>>;
  trainSeconds: number;
  attack: number;
  defense: number;
  upkeepComida: number;
}

export const TROOPS: Record<TroopId, TroopDef> = {
  milicia: {
    id: "milicia",
    name: "Milícia",
    cost: { comida: 12, madeira: 6 },
    trainSeconds: 12,
    attack: 3,
    defense: 3,
    upkeepComida: 0.04,
  },
  arqueiros: {
    id: "arqueiros",
    name: "Arqueiros",
    cost: { comida: 16, madeira: 14 },
    trainSeconds: 18,
    attack: 5,
    defense: 2,
    upkeepComida: 0.05,
  },
  cavalaria: {
    id: "cavalaria",
    name: "Cavalaria",
    cost: { comida: 30, ouro: 15 },
    trainSeconds: 30,
    attack: 8,
    defense: 4,
    upkeepComida: 0.09,
  },
};

export type Owner = "jogador" | "neutro" | null;

export interface Building {
  id: BuildingId;
  level: number;
  // só presente enquanto em construção/melhoria
  upgrading?: { untilLevel: number; finishesAt: number };
}

export interface Camp {
  defense: number;
  loot: Partial<Record<ResourceKind, number>>;
}

export interface Tile {
  hex: Axial;
  terrain: Terrain;
  deposit: Deposit;
  owner: Owner;
  building: Building | null;
  camp: Camp | null; // acampamento neutro guardando o tile
}

export interface TrainOrder {
  id: string;
  troop: TroopId;
  count: number;
  finishesAt: number;
  secondsEach: number;
}

export interface CombatLogEntry {
  id: string;
  at: number;
  tileKey: string;
  victory: boolean;
  message: string;
}

export interface GameState {
  tiles: Record<string, Tile>;
  resources: Record<ResourceKind, number>;
  troops: Record<TroopId, number>;
  trainQueue: TrainOrder[];
  selected: string | null;
  lastTick: number;
  combatLog: CombatLogEntry[];
  foundedAt: number;
}

// Fração 0..1 de progresso de uma construção/melhoria em andamento (pro anel no canvas).
export function buildProgress(tile: Tile, now: number): number | null {
  const up = tile.building?.upgrading;
  if (!up) return null;
  const def = BUILDINGS[tile.building!.id];
  const total = tile.building!.level === 0 ? def.buildSeconds * 1000 : def.buildSeconds * 600 * up.untilLevel;
  const remaining = up.finishesAt - now;
  return Math.min(1, Math.max(0, 1 - remaining / total));
}

export const RESOURCE_META: Record<ResourceKind, { name: string }> = {
  madeira: { name: "Madeira" },
  pedra: { name: "Pedra" },
  comida: { name: "Comida" },
  ouro: { name: "Ouro" },
};
