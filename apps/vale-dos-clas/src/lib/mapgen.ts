import { hexDistance, hexKey, hexRegion, hexRing, mulberry32, type Axial } from "./hex";
import type { CampKind, Deposit, Tile } from "./types";

export const REGION_RADIUS = 6;
export const CENTER: Axial = { q: 0, r: 0 };
export const MAP_SEED = 20260919;

function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)];
}

// Gera o Vale: um recorte de terra de raio REGION_RADIUS ao redor do Paço inicial,
// com um rio serpenteando, bolsões de floresta/colina/montanha e alguns
// acampamentos neutros guardando as bordas. Determinístico (mesma seed = mesmo vale).
export function generateValley(): Record<string, Tile> {
  const rnd = mulberry32(MAP_SEED);
  const hexes = hexRegion(CENTER, REGION_RADIUS);
  const tiles: Record<string, Tile> = {};
  for (const hex of hexes) {
    tiles[hexKey(hex)] = { hex, terrain: "planicie", deposit: null, owner: null, building: null, camp: null };
  }

  // --- RIO: caminhada aleatória enviesada atravessando o vale de um lado a outro ---
  const startAngleDeg = rnd() * 360;
  const dirRad = (startAngleDeg * Math.PI) / 180;
  let rq = Math.round(Math.cos(dirRad) * -REGION_RADIUS);
  let rr = Math.round(Math.sin(dirRad) * -REGION_RADIUS * 0.7 - rq * 0.5);
  const targetQ = -rq,
    targetR = -rr;
  let cursor: Axial = { q: rq, r: rr };
  const riverPath: Axial[] = [];
  for (let step = 0; step < REGION_RADIUS * 3 && hexDistance(cursor, { q: targetQ, r: targetR }) > 1; step++) {
    riverPath.push(cursor);
    const toward = {
      q: Math.sign(targetQ - cursor.q),
      r: Math.sign(targetR - cursor.r),
    };
    const choices: Axial[] = [
      { q: cursor.q + toward.q, r: cursor.r },
      { q: cursor.q, r: cursor.r + toward.r },
      { q: cursor.q + toward.q, r: cursor.r + toward.r },
    ];
    cursor = rnd() < 0.55 ? choices[Math.floor(rnd() * choices.length)] : pick(choices, rnd);
  }
  for (const h of riverPath) {
    const t = tiles[hexKey(h)];
    if (t && hexDistance(h, CENTER) > 1) t.terrain = "agua";
    // margem do rio ocasionalmente mais larga
    if (t && rnd() < 0.25) {
      const sideKey = hexKey({ q: h.q, r: h.r + 1 });
      const side = tiles[sideKey];
      if (side && hexDistance(side.hex, CENTER) > 1) side.terrain = "agua";
    }
  }

  // --- MONTANHAS: 2-3 núcleos perto da borda, com colinas ao redor (contraforte) ---
  const mountainSeeds: Axial[] = [];
  for (let i = 0; i < 3; i++) {
    const ring = hexRing(CENTER, REGION_RADIUS - 1 - Math.floor(rnd() * 2));
    const seed = pick(ring, rnd);
    if (tiles[hexKey(seed)]?.terrain === "agua") continue;
    mountainSeeds.push(seed);
  }
  for (const seed of mountainSeeds) {
    for (const h of hexRegion(seed, 1)) {
      const t = tiles[hexKey(h)];
      if (!t || t.terrain === "agua" || hexDistance(h, CENTER) <= 1) continue;
      t.terrain = hexDistance(h, seed) === 0 || rnd() < 0.5 ? "montanha" : "colina";
    }
  }

  // --- COLINAS extras espalhadas ---
  for (let i = 0; i < 5; i++) {
    const seed = pick(hexes, rnd);
    if (hexDistance(seed, CENTER) <= 1) continue;
    for (const h of hexRegion(seed, 1)) {
      const t = tiles[hexKey(h)];
      if (!t || t.terrain !== "planicie") continue;
      if (rnd() < 0.7) t.terrain = "colina";
    }
  }

  // --- FLORESTAS: poucos bolsões pequenos — o vale é pra ser lido rápido, não virar uma
  // mata fechada escondendo os hexágonos e as construções ---
  for (let i = 0; i < 4; i++) {
    const seed = pick(hexes, rnd);
    if (hexDistance(seed, CENTER) <= 1) continue;
    for (const h of hexRegion(seed, 1 + (rnd() < 0.15 ? 1 : 0))) {
      const t = tiles[hexKey(h)];
      if (!t || t.terrain !== "planicie") continue;
      if (rnd() < 0.55) t.terrain = "floresta";
    }
  }

  // --- DEPÓSITOS especiais (ouro raro, caça incomum) ---
  for (const t of Object.values(tiles)) {
    if (hexDistance(t.hex, CENTER) <= 1) continue;
    if (t.terrain === "agua" || t.terrain === "montanha") continue;
    const roll = rnd();
    let dep: Deposit = null;
    if (roll < 0.05) dep = "ouro";
    else if (roll < 0.14) dep = "caca";
    t.deposit = dep;
  }

  // --- TERRITÓRIO INICIAL: o Paço e seu entorno imediato já pertencem ao clã ---
  for (const h of hexRegion(CENTER, 1)) {
    const t = tiles[hexKey(h)];
    if (!t) continue;
    t.terrain = "planicie";
    t.owner = "jogador";
    t.deposit = null;
  }
  tiles[hexKey(CENTER)].building = { id: "paco", level: 1 };

  // --- ACAMPAMENTOS NEUTROS: guardam pontos de expansão nas bordas do vale ---
  const campCandidates = Object.values(tiles).filter(
    (t) => t.owner === null && t.terrain !== "agua" && t.terrain !== "montanha" && hexDistance(t.hex, CENTER) >= 3,
  );
  const campCount = 6;
  const chosen = new Set<string>();
  let guard = 0;
  while (chosen.size < campCount && guard < 400) {
    guard++;
    const cand = pick(campCandidates, rnd);
    const key = hexKey(cand.hex);
    if (chosen.has(key)) continue;
    // espaça os acampamentos pra não empilhar todos juntos
    const tooClose = [...chosen].some((k) => hexDistance(keyHex(k), cand.hex) < 3);
    if (tooClose) continue;
    chosen.add(key);
    const dist = hexDistance(cand.hex, CENTER);
    const kind = pickCampKind(dist, rnd);
    let defense = 8 + dist * 3.2 + rnd() * 6;
    if (kind === "guarda") defense *= 1.15;
    const loot = {
      madeira: Math.round(20 + dist * 6 + rnd() * 20),
      pedra: Math.round(15 + dist * 5 + rnd() * 15),
      comida: Math.round(18 + dist * 5 + rnd() * 18),
      ouro: Math.round(5 + dist * 3 + rnd() * 10),
    };
    // lobos são bichos, não guardam tesouro; guarda fronteiriça é mais rica (paga pra enfrentar)
    if (kind === "lobos") {
      loot.comida = Math.round(loot.comida * 1.4);
      loot.ouro = 0;
    }
    if (kind === "guarda") loot.ouro = Math.round(loot.ouro * 1.3);
    cand.camp = { kind, defense: Math.round(defense), loot };
  }

  return tiles;
}

// variedade/flavor dos acampamentos: mais perto do vale, bandidos comuns; mais longe,
// alcateias e guardas mais perigosos (não muda o mecanismo de combate, só o tom/loot).
function pickCampKind(dist: number, rnd: () => number): CampKind {
  if (dist <= 3) return "bandidos";
  if (dist <= 4) return rnd() < 0.5 ? "lobos" : "saqueadores";
  return rnd() < 0.55 ? "guarda" : "saqueadores";
}

function keyHex(key: string): Axial {
  const [q, r] = key.split(",").map(Number);
  return { q, r };
}
