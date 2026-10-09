// Arte 3D isométrica pré-renderizada (Kenney "Hexagon Kit", CC0 — ver
// src/assets/hex/CREDITS.md). Cada PNG é um quadro 512×512 com a base do
// hexágono SEMPRE no mesmo lugar (centro x=256, borda inferior y=427) — isso
// permite desenhar qualquer peça (terreno OU construção, que já inclui seu
// próprio topo de grama) ancorada no mesmo ponto do grid, sem overlap manual.
import terrainPlanicie from "@/assets/hex/terrain-planicie.png";
import terrainFloresta from "@/assets/hex/terrain-floresta.png";
import terrainColina from "@/assets/hex/terrain-colina.png";
import terrainMontanha from "@/assets/hex/terrain-montanha.png";
import terrainAgua from "@/assets/hex/terrain-agua.png";
import buildingPaco from "@/assets/hex/building-paco.png";
import buildingSerraria from "@/assets/hex/building-serraria.png";
import buildingPedreira from "@/assets/hex/building-pedreira.png";
import buildingFazenda from "@/assets/hex/building-fazenda.png";
import buildingMercado from "@/assets/hex/building-mercado.png";
import buildingQuartel from "@/assets/hex/building-quartel.png";
import buildingMuralha from "@/assets/hex/building-muralha.png";
import buildingTorre from "@/assets/hex/building-torre.png";
import waterRocks from "@/assets/hex/water-rocks.png";
import waterIsland from "@/assets/hex/water-island.png";
import decorTree from "@/assets/hex/decor-tree.png";
import type { BuildingId, Terrain } from "./types";

// tamanho do quadro-fonte e onde a base do hexágono cai nele (medido 1x, vale pra todas as peças)
export const ART_SIZE = 512;
export const ART_ANCHOR_X = 256 / 512;
export const ART_ANCHOR_Y = 427 / 512;
// "raio" do hexágono (vértice a vértice / 2) dentro do quadro-fonte, em px — pra escalar pro nosso HEX_SIZE.
// Um pouco menor que o bbox real (91.5) de propósito: a câmera isométrica do Kenney não bate
// 1:1 com a matemática de hex 2D "flat-top" que usamos pro grid, então isso faz as peças
// desenharem levemente maiores que o espaçamento do grid — sobra em vez de falta, fechando
// os vãos pretos entre hexágonos (ver HexCanvas.tsx).
export const ART_HEX_RADIUS = 60;
// quanto maior que o espaçamento do grid cada peça é desenhada (ver ART_HEX_RADIUS acima) —
// usado pra dimensionar anéis/realces que precisam acompanhar o tamanho VISUAL do hexágono.
export const ART_VISUAL_SCALE = 91.5 / ART_HEX_RADIUS;

interface ArtPiece {
  src: string;
  topPx: number; // topo do desenho (512-space) — dá pra achar o "centro visual" de cada peça
}

export const TERRAIN_ART: Record<Terrain, ArtPiece> = {
  planicie: { src: terrainPlanicie, topPx: 290 },
  floresta: { src: terrainFloresta, topPx: 263 },
  colina: { src: terrainColina, topPx: 247 },
  montanha: { src: terrainMontanha, topPx: 191 },
  agua: { src: terrainAgua, topPx: 306 },
};

// variantes de água (sorteadas por tile, determinístico — ver pickWaterArt) pra quebrar a
// monotonia de ter o mesmo hex repetido no rio inteiro.
export const WATER_VARIANTS: ArtPiece[] = [
  { src: terrainAgua, topPx: 306 },
  { src: terrainAgua, topPx: 306 },
  { src: waterRocks, topPx: 304 },
  { src: waterIsland, topPx: 306 },
];

// acento decorativo pequeno (não é um hexágono completo, não tem base própria) — espalhado
// ocasionalmente sobre planícies pra dar mais densidade/vida sem virar floresta.
export const DECOR_TREE: ArtPiece = { src: decorTree, topPx: 312 };

export const BUILDING_ART: Record<BuildingId, ArtPiece> = {
  paco: { src: buildingPaco, topPx: 232 },
  serraria: { src: buildingSerraria, topPx: 232 },
  pedreira: { src: buildingPedreira, topPx: 262 },
  fazenda: { src: buildingFazenda, topPx: 290 },
  mercado: { src: buildingMercado, topPx: 260 },
  quartel: { src: buildingQuartel, topPx: 260 },
  muralha: { src: buildingMuralha, topPx: 242 },
  torre: { src: buildingTorre, topPx: 210 },
};

const imageCache = new Map<string, HTMLImageElement>();
export function artImage(src: string): HTMLImageElement {
  let img = imageCache.get(src);
  if (!img) {
    img = new Image();
    img.src = src;
    imageCache.set(src, img);
  }
  return img;
}
