import { BUILDING_ART } from "@/lib/hexArt";
import type { BuildingId } from "@/lib/types";

// janela de recorte dentro da arte 512×512 (mesma pra toda construção) — enquadra
// o hexágono + a construção com folga, mesmo nas mais altas (torre, paço).
const CROP = 280;
const CROP_CX = 256;
const CROP_CY = 300;

export default function BuildingThumb({ id, size = 48, className = "" }: { id: BuildingId; size?: number; className?: string }) {
  const zoom = size / CROP;
  const full = 512 * zoom;
  return (
    <div className={`building-thumb ${className}`} style={{ width: size, height: size }}>
      <img
        src={BUILDING_ART[id].src}
        alt=""
        draggable={false}
        style={{ width: full, height: full, left: size / 2 - CROP_CX * zoom, top: size / 2 - CROP_CY * zoom }}
      />
    </div>
  );
}
