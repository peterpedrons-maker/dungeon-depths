// Ícones vetoriais (game-icons.net, CC BY 3.0 — ver src/assets/icons/CREDITS.md).
// Cada SVG tem um único path com fill="currentColor": pra uso em HTML injetamos o
// markup bruto (currentColor herda a cor do CSS); pra uso no <canvas>, que não
// enxerga CSS, geramos uma data-URL com a cor já gravada no lugar de currentColor.
import paco from "@/assets/icons/paco.svg?raw";
import serraria from "@/assets/icons/serraria.svg?raw";
import pedreira from "@/assets/icons/pedreira.svg?raw";
import fazenda from "@/assets/icons/fazenda.svg?raw";
import mercado from "@/assets/icons/mercado.svg?raw";
import quartel from "@/assets/icons/quartel.svg?raw";
import muralha from "@/assets/icons/muralha.svg?raw";
import torre from "@/assets/icons/torre.svg?raw";
import milicia from "@/assets/icons/milicia.svg?raw";
import arqueiros from "@/assets/icons/arqueiros.svg?raw";
import cavalaria from "@/assets/icons/cavalaria.svg?raw";
import madeira from "@/assets/icons/madeira.svg?raw";
import pedra from "@/assets/icons/pedra.svg?raw";
import comida from "@/assets/icons/comida.svg?raw";
import ouro from "@/assets/icons/ouro.svg?raw";
import acampamento from "@/assets/icons/acampamento.svg?raw";
import depositoOuro from "@/assets/icons/deposito-ouro.svg?raw";
import depositoCaca from "@/assets/icons/deposito-caca.svg?raw";

export const ICONS = {
  paco,
  serraria,
  pedreira,
  fazenda,
  mercado,
  quartel,
  muralha,
  torre,
  milicia,
  arqueiros,
  cavalaria,
  madeira,
  pedra,
  comida,
  ouro,
  acampamento,
  "deposito-ouro": depositoOuro,
  "deposito-caca": depositoCaca,
} as const;

export type IconId = keyof typeof ICONS;

const dataUrlCache = new Map<string, string>();

// SVG com a cor já gravada (substitui currentColor), pronto pra virar Image() no canvas.
export function iconDataUrl(id: IconId, color: string): string {
  const key = id + "|" + color;
  const cached = dataUrlCache.get(key);
  if (cached) return cached;
  const svg = ICONS[id].replace(/currentColor/g, color);
  const url = "data:image/svg+xml," + encodeURIComponent(svg);
  dataUrlCache.set(key, url);
  return url;
}

const imageCache = new Map<string, HTMLImageElement>();

// Image() pronta (ou em carregamento) pra uso com ctx.drawImage — cacheada por id+cor.
export function iconImage(id: IconId, color: string): HTMLImageElement {
  const key = id + "|" + color;
  let img = imageCache.get(key);
  if (!img) {
    img = new Image();
    img.src = iconDataUrl(id, color);
    imageCache.set(key, img);
  }
  return img;
}
