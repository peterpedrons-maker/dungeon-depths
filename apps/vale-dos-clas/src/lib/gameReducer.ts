import { hexKey, hexNeighbors, keyToHex } from "./hex";
import { generateValley, CENTER } from "./mapgen";
import {
  BUILDINGS,
  TROOPS,
  type BuildingId,
  type CombatLogEntry,
  type GameState,
  type ResourceKind,
  type Tile,
  type TroopId,
} from "./types";

export const SAVE_KEY = "vale_dos_clas_save_v1";

export function freshGame(): GameState {
  const now = Date.now();
  return {
    tiles: generateValley(),
    resources: { madeira: 120, pedra: 90, comida: 140, ouro: 40 },
    troops: { milicia: 4, arqueiros: 0, cavalaria: 0 },
    trainQueue: [],
    selected: hexKey(CENTER),
    lastTick: now,
    combatLog: [],
    foundedAt: now,
  };
}

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return freshGame();
    const saved = JSON.parse(raw) as GameState;
    if (!saved.tiles || !saved.resources) return freshGame();
    return saved;
  } catch {
    return freshGame();
  }
}

export function persistGame(state: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // armazenamento indisponível (modo privado etc.) — segue o jogo sem salvar
  }
}

function canAfford(resources: Record<ResourceKind, number>, cost: Partial<Record<ResourceKind, number>>): boolean {
  return (Object.entries(cost) as [ResourceKind, number][]).every(([k, v]) => resources[k] >= v);
}

function pay(resources: Record<ResourceKind, number>, cost: Partial<Record<ResourceKind, number>>) {
  for (const [k, v] of Object.entries(cost) as [ResourceKind, number][]) resources[k] -= v;
}

function isAdjacentToOwned(tiles: Record<string, Tile>, key: string): boolean {
  const hex = keyToHex(key);
  return hexNeighbors(hex).some((n) => tiles[hexKey(n)]?.owner === "jogador");
}

export type Action =
  | { type: "TICK"; now: number }
  | { type: "SELECT"; key: string | null }
  | { type: "BUILD"; key: string; building: BuildingId }
  | { type: "UPGRADE"; key: string }
  | { type: "TRAIN"; troop: TroopId; count: number }
  | { type: "ATTACK"; key: string; sent: Partial<Record<TroopId, number>> }
  | { type: "DISMISS_LOG"; id: string }
  | { type: "RESET" };

function buildingOutput(tile: Tile) {
  if (!tile.building) return null;
  const def = BUILDINGS[tile.building.id];
  if (!def.produces) return null;
  const out: Partial<Record<ResourceKind, number>> = {};
  for (const [res, amount] of Object.entries(def.produces) as [ResourceKind, number][]) {
    let v = amount * tile.building.level;
    // depósitos especiais dão um empurrão a quem explora o recurso certo
    if (tile.deposit === "ouro" && res === "ouro") v += 0.5;
    if (tile.deposit === "caca" && res === "comida") v += 0.6;
    out[res] = v;
  }
  return out;
}

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "RESET":
      return freshGame();

    case "SELECT":
      return { ...state, selected: action.key };

    case "TICK": {
      const dt = Math.max(0, Math.min(5, (action.now - state.lastTick) / 1000));
      if (dt <= 0) return { ...state, lastTick: action.now };

      const resources = { ...state.resources };
      let tilesChanged = false;
      const tiles = { ...state.tiles };

      for (const key of Object.keys(tiles)) {
        const tile = tiles[key];
        if (tile.owner !== "jogador" || !tile.building) continue;

        if (tile.building.upgrading && action.now >= tile.building.upgrading.finishesAt) {
          tiles[key] = { ...tile, building: { id: tile.building.id, level: tile.building.upgrading.untilLevel } };
          tilesChanged = true;
          continue;
        }

        const out = buildingOutput(tile);
        if (out) for (const [res, amount] of Object.entries(out) as [ResourceKind, number][]) resources[res] += amount * dt;
      }

      // upkeep de comida das tropas
      const totalUpkeep = (Object.entries(state.troops) as [TroopId, number][]).reduce(
        (sum, [id, count]) => sum + TROOPS[id].upkeepComida * count,
        0,
      );
      resources.comida = Math.max(0, resources.comida - totalUpkeep * dt);

      for (const k of Object.keys(resources) as ResourceKind[]) resources[k] = Math.max(0, resources[k]);

      // fila de recrutamento
      let trainQueue = state.trainQueue;
      let troops = state.troops;
      const finished = state.trainQueue.filter((o) => action.now >= o.finishesAt);
      if (finished.length) {
        troops = { ...state.troops };
        for (const o of finished) troops[o.troop] += o.count;
        trainQueue = state.trainQueue.filter((o) => action.now < o.finishesAt);
      }

      return {
        ...state,
        resources,
        tiles: tilesChanged ? tiles : state.tiles,
        troops,
        trainQueue,
        lastTick: action.now,
      };
    }

    case "BUILD": {
      const tile = state.tiles[action.key];
      const def = BUILDINGS[action.building];
      if (!tile || tile.building || tile.camp) return state;
      if (tile.owner !== "jogador" && !isAdjacentToOwned(state.tiles, action.key)) return state;
      if (def.terrains && !def.terrains.includes(tile.terrain)) return state;
      if (!def.terrains && (tile.terrain === "agua" || tile.terrain === "montanha")) return state;
      if (!canAfford(state.resources, def.cost)) return state;

      const resources = { ...state.resources };
      pay(resources, def.cost);
      const now = Date.now();
      const tiles = { ...state.tiles };
      tiles[action.key] = {
        ...tile,
        owner: "jogador",
        building: { id: action.building, level: 0, upgrading: { untilLevel: 1, finishesAt: now + def.buildSeconds * 1000 } },
      };
      return { ...state, resources, tiles };
    }

    case "UPGRADE": {
      const tile = state.tiles[action.key];
      if (!tile?.building || tile.building.upgrading) return state;
      const def = BUILDINGS[tile.building.id];
      if (tile.building.level >= def.maxLevel) return state;
      const scaledCost: Partial<Record<ResourceKind, number>> = {};
      for (const [k, v] of Object.entries(def.cost) as [ResourceKind, number][]) scaledCost[k] = Math.round(v * (tile.building.level + 1) * 0.85);
      if (!canAfford(state.resources, scaledCost)) return state;

      const resources = { ...state.resources };
      pay(resources, scaledCost);
      const now = Date.now();
      const nextLevel = tile.building.level + 1;
      const tiles = { ...state.tiles };
      tiles[action.key] = {
        ...tile,
        building: { id: tile.building.id, level: tile.building.level, upgrading: { untilLevel: nextLevel, finishesAt: now + def.buildSeconds * 600 * nextLevel } },
      };
      return { ...state, resources, tiles };
    }

    case "TRAIN": {
      if (action.count <= 0) return state;
      const hasQuartel = Object.values(state.tiles).some((t) => t.owner === "jogador" && t.building?.id === "quartel" && !t.building.upgrading);
      if (!hasQuartel) return state;
      const def = TROOPS[action.troop];
      const totalCost: Partial<Record<ResourceKind, number>> = {};
      for (const [k, v] of Object.entries(def.cost) as [ResourceKind, number][]) totalCost[k] = v * action.count;
      if (!canAfford(state.resources, totalCost)) return state;

      const resources = { ...state.resources };
      pay(resources, totalCost);
      const now = Date.now();
      const order = {
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        troop: action.troop,
        count: action.count,
        secondsEach: def.trainSeconds,
        finishesAt: now + def.trainSeconds * action.count * 1000,
      };
      return { ...state, resources, trainQueue: [...state.trainQueue, order] };
    }

    case "ATTACK": {
      const tile = state.tiles[action.key];
      if (!tile?.camp) return state;
      if (!isAdjacentToOwned(state.tiles, action.key) && tile.owner !== "jogador") return state;

      const sentEntries = Object.entries(action.sent) as [TroopId, number][];
      const totalSent = sentEntries.reduce((s, [, c]) => s + (c || 0), 0);
      if (totalSent <= 0) return state;
      for (const [id, c] of sentEntries) if ((c || 0) > state.troops[id]) return state;

      const power = sentEntries.reduce((s, [id, c]) => s + TROOPS[id].attack * (c || 0), 0) * (0.85 + Math.random() * 0.3);
      const victory = power >= tile.camp.defense;

      const troops = { ...state.troops };
      const lossRate = victory ? 0.08 + Math.random() * 0.15 : 0.35 + Math.random() * 0.3;
      for (const [id, c] of sentEntries) troops[id] = Math.max(0, troops[id] - Math.round((c || 0) * lossRate));

      const tiles = { ...state.tiles };
      const resources = { ...state.resources };
      let message: string;
      if (victory) {
        for (const [res, amount] of Object.entries(tile.camp.loot) as [ResourceKind, number][]) resources[res] += amount;
        tiles[action.key] = { ...tile, owner: "jogador", camp: null };
        message = `Vitória! O acampamento caiu e as terras se juntam ao vale.`;
      } else {
        tiles[action.key] = { ...tile, camp: { ...tile.camp, defense: Math.max(4, tile.camp.defense - Math.round(power * 0.4)) } };
        message = `Derrota. As tropas recuaram feridas — o acampamento está enfraquecido.`;
      }

      const log: CombatLogEntry = { id: `${Date.now()}`, at: Date.now(), tileKey: action.key, victory, message };
      return { ...state, troops, tiles, resources, combatLog: [log, ...state.combatLog].slice(0, 12) };
    }

    case "DISMISS_LOG":
      return { ...state, combatLog: state.combatLog.filter((l) => l.id !== action.id) };

    default:
      return state;
  }
}

export function canClaimForBuild(tiles: Record<string, Tile>, key: string): boolean {
  const tile = tiles[key];
  if (!tile || tile.camp) return false;
  return tile.owner === "jogador" || isAdjacentToOwned(tiles, key);
}
