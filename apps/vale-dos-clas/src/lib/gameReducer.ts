import { hexKey, hexNeighbors, keyToHex } from "./hex";
import { generateValley, CENTER } from "./mapgen";
import {
  BUILDINGS,
  TROOPS,
  getPacoLevel,
  popCapFor,
  queuedTroopCount,
  storageCap,
  totalDefense,
  totalTroopCount,
  type BuildingId,
  type CombatLogEntry,
  type GameState,
  type ResourceKind,
  type Tile,
  type TroopId,
} from "./types";

export const SAVE_KEY = "vale_dos_clas_save_v1";

// primeira invasão só depois que o jogador teve um tempo pra se estabelecer
const FIRST_RAID_DELAY_MS = [90_000, 150_000] as const;
// intervalo entre invasões seguintes
const RAID_INTERVAL_MS = [100_000, 170_000] as const;
// aviso "invasores avistados" chega com essa antecedência da invasão de verdade
const RAID_WARNING_LEAD_MS = 15_000;

function randBetween(rnd: readonly [number, number]): number {
  return rnd[0] + Math.random() * (rnd[1] - rnd[0]);
}

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
    nextRaidAt: now + randBetween(FIRST_RAID_DELAY_MS),
    raidWarned: false,
  };
}

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return freshGame();
    const saved = JSON.parse(raw) as GameState;
    if (!saved.tiles || !saved.resources) return freshGame();
    // compatibilidade com saves antigos de antes do sistema de invasões
    if (typeof saved.nextRaidAt !== "number") saved.nextRaidAt = Date.now() + randBetween(FIRST_RAID_DELAY_MS);
    if (typeof saved.raidWarned !== "boolean") saved.raidWarned = false;
    for (const t of Object.values(saved.tiles)) {
      if (t.camp && !t.camp.kind) t.camp.kind = "bandidos";
    }
    for (const entry of saved.combatLog) if (!entry.kind) entry.kind = "camp";
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

// soma delta a current respeitando o teto de armazenamento — nunca DESTRÓI um estoque que já
// esteja acima do teto (ex.: save antigo, ou teto que acabou de cair), só para de crescer.
function addCapped(current: number, delta: number, cap: number): number {
  if (delta <= 0) return Math.max(0, current + delta);
  const proposed = current + delta;
  return proposed > cap ? Math.max(current, cap) : proposed;
}

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

      let tilesChanged = false;
      const tiles = { ...state.tiles };
      const deltas: Record<ResourceKind, number> = { madeira: 0, pedra: 0, comida: 0, ouro: 0 };

      for (const key of Object.keys(tiles)) {
        const tile = tiles[key];
        if (tile.owner !== "jogador" || !tile.building) continue;

        if (tile.building.upgrading && action.now >= tile.building.upgrading.finishesAt) {
          tiles[key] = { ...tile, building: { id: tile.building.id, level: tile.building.upgrading.untilLevel } };
          tilesChanged = true;
          continue;
        }

        const out = buildingOutput(tile);
        if (out) for (const [res, amount] of Object.entries(out) as [ResourceKind, number][]) deltas[res] += amount * dt;
      }

      const pacoLevel = getPacoLevel(tiles);
      const cap = storageCap(pacoLevel);
      const resources = { ...state.resources };
      for (const k of Object.keys(resources) as ResourceKind[]) resources[k] = addCapped(resources[k], deltas[k], cap);

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

      // --- INVASÕES: de tempos em tempos, o vale é testado. A defesa total (Paço, Muralha,
      // Torre...) decide o resultado — ver totalDefense() em types.ts. ---
      let nextRaidAt = state.nextRaidAt;
      let raidWarned = state.raidWarned;
      let combatLog = state.combatLog;
      if (!raidWarned && action.now >= nextRaidAt - RAID_WARNING_LEAD_MS) {
        raidWarned = true;
      }
      if (action.now >= nextRaidAt) {
        const elapsedMin = (action.now - state.foundedAt) / 60000;
        const tilesOwned = Object.values(tiles).filter((t) => t.owner === "jogador").length;
        const raidPower = Math.max(5, (4 + elapsedMin * 1.4 + tilesOwned * 0.7) * (0.75 + Math.random() * 0.55));
        const defense = totalDefense(tiles);
        const victory = defense >= raidPower;
        let message: string;
        if (victory) {
          const reward = Math.round(raidPower * 0.5);
          resources.ouro = addCapped(resources.ouro, reward, cap);
          message = `As muralhas seguraram! Invasores foram repelidos e deixaram ${reward} de ouro saqueado deles.`;
        } else {
          const shortfall = Math.max(0, raidPower - defense);
          const lossFrac = Math.min(0.32, 0.08 + (shortfall / Math.max(1, raidPower)) * 0.28);
          for (const k of Object.keys(resources) as ResourceKind[]) resources[k] = Math.max(0, resources[k] - Math.floor(resources[k] * lossFrac));
          if (troops === state.troops) troops = { ...state.troops };
          for (const id of Object.keys(troops) as TroopId[]) troops[id] = Math.max(0, troops[id] - Math.round(troops[id] * lossFrac * 0.5));
          message = "Invasores saquearam o vale! Reforce suas defesas (Muralha, Torre, Paço) pra evitar novos prejuízos.";
        }
        const log: CombatLogEntry = {
          id: `raid-${action.now}`,
          at: action.now,
          tileKey: "",
          victory,
          kind: victory ? "raid-success" : "raid-fail",
          message,
        };
        combatLog = [log, ...state.combatLog].slice(0, 12);
        nextRaidAt = action.now + randBetween(RAID_INTERVAL_MS);
        raidWarned = false;
      }

      return {
        ...state,
        resources,
        tiles: tilesChanged ? tiles : state.tiles,
        troops,
        trainQueue,
        combatLog,
        nextRaidAt,
        raidWarned,
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
      if (def.requiresPacoLevel && getPacoLevel(state.tiles) < def.requiresPacoLevel) return state;
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

      const pacoLevel = getPacoLevel(state.tiles);
      const room = popCapFor(pacoLevel) - totalTroopCount(state.troops) - queuedTroopCount(state.trainQueue);
      if (room <= 0) return state;
      const count = Math.min(action.count, room);

      const def = TROOPS[action.troop];
      const totalCost: Partial<Record<ResourceKind, number>> = {};
      for (const [k, v] of Object.entries(def.cost) as [ResourceKind, number][]) totalCost[k] = v * count;
      if (!canAfford(state.resources, totalCost)) return state;

      const resources = { ...state.resources };
      pay(resources, totalCost);
      const now = Date.now();
      const order = {
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        troop: action.troop,
        count,
        secondsEach: def.trainSeconds,
        finishesAt: now + def.trainSeconds * count * 1000,
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
        const cap = storageCap(getPacoLevel(state.tiles));
        for (const [res, amount] of Object.entries(tile.camp.loot) as [ResourceKind, number][]) resources[res] = addCapped(resources[res], amount, cap);
        tiles[action.key] = { ...tile, owner: "jogador", camp: null };
        message = `Vitória! O acampamento caiu e as terras se juntam ao vale.`;
      } else {
        tiles[action.key] = { ...tile, camp: { ...tile.camp, defense: Math.max(4, tile.camp.defense - Math.round(power * 0.4)) } };
        message = `Derrota. As tropas recuaram feridas — o acampamento está enfraquecido.`;
      }

      const log: CombatLogEntry = { id: `${Date.now()}`, at: Date.now(), tileKey: action.key, victory, kind: "camp", message };
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
