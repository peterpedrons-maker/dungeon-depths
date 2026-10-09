import { useEffect, useRef } from "react";
import { hexCorners, hexKey, hexToPixel, pixelToHex, type Axial } from "@/lib/hex";
import { canClaimForBuild } from "@/lib/gameReducer";
import { iconImage } from "@/lib/icons";
import {
  ART_ANCHOR_X,
  ART_ANCHOR_Y,
  ART_HEX_RADIUS,
  ART_SIZE,
  ART_VERTICAL_SQUASH,
  ART_VISUAL_SCALE,
  BUILDING_ART,
  DECOR_TREE,
  TERRAIN_ART,
  WATER_VARIANTS,
  artImage,
} from "@/lib/hexArt";
import { BUILDINGS, buildProgress, type BuildingId, type Tile } from "@/lib/types";

const HEX_SIZE = 34;

const CAMP_ICON_COLOR = "#ffb49c";
const DEPOSIT_OURO_COLOR = "#ffe9b0";
const DEPOSIT_CACA_COLOR = "#d8b27a";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

function hashSeed(q: number, r: number): number {
  return ((q * 374761393) ^ (r * 668265263) ^ 0x9e3779b9) >>> 0;
}

interface Props {
  tiles: Record<string, Tile>;
  selected: string | null;
  buildMode: BuildingId | null;
  onSelect: (key: string) => void;
  onPlace: (key: string) => void;
}

export default function HexCanvas({ tiles, selected, buildMode, onSelect, onPlace }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const camera = useRef({ x: 0, y: 0, scale: 1 });
  const drag = useRef<{ startX: number; startY: number; camX: number; camY: number; moved: boolean; pointerId: number } | null>(null);
  const particles = useRef<Particle[]>([]);
  const starsRef = useRef<{ x: number; y: number; r: number; phase: number }[]>([]);

  const latest = useRef({ tiles, selected, buildMode });
  latest.current = { tiles, selected, buildMode };
  const cbRef = useRef({ onSelect, onPlace });
  cbRef.current = { onSelect, onPlace };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let dpr = Math.min(2, window.devicePixelRatio || 1);

    for (let i = 0; i < 70; i++) starsRef.current.push({ x: Math.random(), y: Math.random(), r: 0.4 + Math.random() * 1.1, phase: Math.random() * Math.PI * 2 });
    // pré-carrega a arte do hexágono (Kenney, PNG) e os ícones SVG (game-icons.net) usados no mapa
    Object.values(TERRAIN_ART).forEach((p) => artImage(p.src));
    Object.values(BUILDING_ART).forEach((p) => artImage(p.src));
    WATER_VARIANTS.forEach((p) => artImage(p.src));
    artImage(DECOR_TREE.src);
    iconImage("acampamento", CAMP_ICON_COLOR);
    iconImage("deposito-ouro", DEPOSIT_OURO_COLOR);
    iconImage("deposito-caca", DEPOSIT_CACA_COLOR);

    function resize() {
      const rect = wrap.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    function worldToScreen(x: number, y: number) {
      const rect = wrap.getBoundingClientRect();
      return { cx: rect.width / 2 + (x + camera.current.x) * camera.current.scale, cy: rect.height / 2 + (y + camera.current.y) * camera.current.scale };
    }
    function screenToWorld(sx: number, sy: number) {
      const rect = wrap.getBoundingClientRect();
      return { x: (sx - rect.width / 2) / camera.current.scale - camera.current.x, y: (sy - rect.height / 2) / camera.current.scale - camera.current.y };
    }

    function drawIcon(id: Parameters<typeof iconImage>[0], color: string, cx: number, cy: number, size: number, alpha = 1) {
      const img = iconImage(id, color);
      if (!img.complete || img.naturalWidth === 0) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = size * 0.1;
      ctx.shadowOffsetY = size * 0.04;
      ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
      ctx.restore();
    }

    // desenha uma peça de arte (terreno OU construção — ambas ancoradas no mesmo ponto do grid,
    // já que o PNG de cada construção inclui seu próprio topo de hexágono) e devolve o Y da
    // "visual" do topo, pra ancorar selos/partículas/anéis nessa mesma altura.
    function drawGroundArt(piece: { src: string; topPx: number }, cx: number, baseCy: number, hexR: number, alpha = 1) {
      const img = artImage(piece.src);
      if (!img.complete || img.naturalWidth === 0) return baseCy - hexR * 0.6;
      const imgScale = hexR / ART_HEX_RADIUS;
      const dispW = ART_SIZE * imgScale;
      // achata só a altura (a partir da base, que não se mexe) — a largura/espaçamento do
      // grid fica igual, então o encaixe entre hexágonos não muda, só a "altura" da peça.
      const dispH = dispW * ART_VERTICAL_SQUASH;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, cx - ART_ANCHOR_X * dispW, baseCy - ART_ANCHOR_Y * dispH, dispW, dispH);
      ctx.restore();
      return baseCy - ((427 - piece.topPx) / ART_SIZE) * dispH;
    }

    function draw(now: number) {
      const { tiles: ts, selected: sel, buildMode: bm } = latest.current;
      const rect = wrap.getBoundingClientRect();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // --- fundo: vinheta suave + estrelas discretas (evita o vazio "morto" fora do vale) ---
      const bgGrad = ctx.createRadialGradient(rect.width / 2, rect.height * 0.42, 40, rect.width / 2, rect.height * 0.5, Math.max(rect.width, rect.height) * 0.75);
      bgGrad.addColorStop(0, "#132018");
      bgGrad.addColorStop(1, "#060b08");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, rect.width, rect.height);
      for (const st of starsRef.current) {
        const tw = 0.35 + 0.35 * (Math.sin(now / 900 + st.phase) + 1) * 0.5;
        ctx.fillStyle = `rgba(210,235,220,${tw * 0.5})`;
        ctx.beginPath();
        ctx.arc(st.x * rect.width, st.y * rect.height, st.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const scale = camera.current.scale;
      const r = HEX_SIZE * scale;
      // os anéis/realces acompanham o tamanho VISUAL do hexágono (maior que o espaçamento do
      // grid — ver ART_VISUAL_SCALE) e também o achatamento vertical da arte (ART_VERTICAL_SQUASH),
      // senão ficam desencontrados — redondos/altos demais perto da peça achatada embaixo.
      const corners = hexCorners(r * ART_VISUAL_SCALE).map((c) => ({ x: c.x, y: c.y * ART_VERTICAL_SQUASH }));
      const pulse = (Math.sin(now / 420) + 1) / 2;

      type Placed = { tile: Tile; cx: number; cy: number; onscreen: boolean };
      const placed: Placed[] = Object.values(ts).map((tile) => {
        const { x, y } = hexToPixel(tile.hex, HEX_SIZE);
        const { cx, cy } = worldToScreen(x, y);
        const onscreen = !(cx < -70 || cy < -90 || cx > rect.width + 70 || cy > rect.height + 70);
        return { tile, cx, cy, onscreen };
      });
      placed.sort((a, b) => a.cy - b.cy);

      function hexPath(cx: number, cy: number) {
        ctx.beginPath();
        corners.forEach((c, i) => {
          const px = cx + c.x,
            py = cy + c.y;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
      }

      // --- PASSE 1: todo o TERRENO primeiro (tiles sem construção) ---
      // Isso garante que nenhum chão de vizinho (desenhado "por cima" por causa do overlap
      // que fecha os vãos entre hexágonos — ver ART_HEX_RADIUS) acabe tampando a base de uma
      // construção do passe 2: construção sempre fica por cima de QUALQUER terreno.
      for (const p of placed) {
        if (!p.onscreen || p.tile.building) continue;
        const { tile, cx, cy } = p;
        const frontier = tile.owner !== "jogador" && !tile.camp;
        const reachable = tile.owner === "jogador" || canClaimForBuild(ts, hexKey(tile.hex));
        const dim = frontier && !reachable;

        const seed = hashSeed(tile.hex.q, tile.hex.r);
        const piece = tile.terrain === "agua" ? WATER_VARIANTS[seed % WATER_VARIANTS.length] : TERRAIN_ART[tile.terrain];
        const topY = drawGroundArt(piece, cx, cy, r, 1);

        // acento decorativo: uma arvorezinha extra em ~1 a cada 3 planícies, pra dar mais
        // densidade sem virar floresta de verdade (não mexe no território nem na jogabilidade)
        if (tile.terrain === "planicie" && !tile.deposit && seed % 3 === 0) {
          const ox = (((seed >> 3) % 100) / 100 - 0.5) * r * 0.7;
          const oy = (((seed >> 9) % 100) / 100 - 0.5) * r * 0.3;
          drawGroundArt(DECOR_TREE, cx + ox, cy + oy, r, 1);
        }

        if (dim || frontier) {
          hexPath(cx, cy);
          ctx.fillStyle = dim ? "rgba(5,9,7,0.5)" : "rgba(5,9,7,0.16)";
          ctx.fill();
        }

        if (tile.deposit) {
          const bob = Math.sin(now / 500 + hashSeed(tile.hex.q, tile.hex.r)) * 2 * scale;
          const depIcon = tile.deposit === "ouro" ? "deposito-ouro" : "deposito-caca";
          const depColor = tile.deposit === "ouro" ? DEPOSIT_OURO_COLOR : DEPOSIT_CACA_COLOR;
          drawIcon(depIcon, depColor, cx, topY + 6 * scale + bob, 20 * scale);
        }

        if (tile.camp) {
          const ember = (Math.sin(now / 340 + hashSeed(tile.hex.q, tile.hex.r)) + 1) / 2;
          const glow = ctx.createRadialGradient(cx, topY, 0, cx, topY, r * 0.9);
          glow.addColorStop(0, `rgba(255,110,70,${0.3 + ember * 0.22})`);
          glow.addColorStop(1, "rgba(255,110,70,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(cx, topY, r * 0.9, 0, Math.PI * 2);
          ctx.fill();
          if (Math.random() < 0.03) particles.current.push({ x: cx + (Math.random() * 10 - 5), y: topY, vx: (Math.random() - 0.5) * 6, vy: -16 - Math.random() * 10, life: 1, max: 1, size: 2, color: "#ff8a5a" });

          drawIcon("acampamento", CAMP_ICON_COLOR, cx, topY + 10 * scale, 26 * scale);
          ctx.font = `bold ${12 * scale}px system-ui`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#2a0d0d";
          ctx.fillRect(cx - 17 * scale, topY + 24 * scale, 34 * scale, 16 * scale);
          ctx.fillStyle = "#ff8a7a";
          ctx.fillText(String(tile.camp.defense), cx, topY + 32.5 * scale);
        }
      }

      // --- PASSE 2: construções, sempre por cima de todo o terreno do passe 1 ---
      for (const p of placed) {
        if (!p.onscreen || !p.tile.building) continue;
        const { tile, cx, cy } = p;
        const building = tile.building!;
        const bdef = BUILDINGS[building.id];
        const alpha = building.level === 0 ? 0.6 : 1;
        const topY = drawGroundArt(BUILDING_ART[building.id], cx, cy, r, alpha);

        if (building.level > 0) {
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `bold ${11 * scale}px system-ui`;
          ctx.fillStyle = "rgba(255,255,255,0.92)";
          ctx.strokeStyle = "rgba(0,0,0,0.6)";
          ctx.lineWidth = 2.5;
          ctx.strokeText("Lv" + building.level, cx, cy + 10 * scale);
          ctx.fillText("Lv" + building.level, cx, cy + 10 * scale);
        }

        const prog = buildProgress(tile, now);
        if (prog !== null) {
          const rr = r * 0.85;
          const midY = (topY + cy) / 2;
          ctx.beginPath();
          ctx.arc(cx, midY, rr, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
          ctx.strokeStyle = "#ffd45e";
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.shadowColor = "rgba(255,212,94,0.8)";
          ctx.shadowBlur = 6;
          ctx.stroke();
          ctx.shadowBlur = 0;
          if (Math.random() < 0.25) particles.current.push({ x: cx + (Math.random() * 14 - 7), y: topY + 8 * scale, vx: (Math.random() - 0.5) * 8, vy: -6 - Math.random() * 6, life: 0.8, max: 0.8, size: 1.8, color: "#c9a06a" });
        }

        if (tile.owner === "jogador" && building.level > 0 && !building.upgrading && bdef.produces && Math.random() < 0.045) {
          particles.current.push({ x: cx + (Math.random() * 16 - 8), y: topY, vx: (Math.random() - 0.5) * 4, vy: -16 - Math.random() * 8, life: 1, max: 1, size: 2.2, color: tile.deposit === "ouro" ? "#ffe18a" : "#bdf2a0" });
        }
      }

      // --- realces (modo-construção + seleção): num passe à parte, por cima de tudo — senão
      // ficam escondidos atrás da arte (bem maior que o espaçamento do grid) dos vizinhos ---
      for (const p of placed) {
        if (!p.onscreen) continue;
        const { tile, cx, cy } = p;

        if (bm) {
          const bdef = BUILDINGS[bm];
          const terrainOk = bdef.terrains ? bdef.terrains.includes(tile.terrain) : tile.terrain !== "agua" && tile.terrain !== "montanha";
          const valid = terrainOk && !tile.building && !tile.camp && (tile.owner === "jogador" || canClaimForBuild(ts, hexKey(tile.hex)));
          if (valid) {
            hexPath(cx, cy);
            ctx.save();
            ctx.lineWidth = 2.5 + pulse * 1.5;
            ctx.strokeStyle = `rgba(120,230,140,${0.55 + pulse * 0.35})`;
            ctx.shadowColor = "rgba(120,230,140,0.8)";
            ctx.shadowBlur = 10 + pulse * 6;
            ctx.stroke();
            ctx.restore();
          }
        }

        if (hexKey(tile.hex) === sel) {
          hexPath(cx, cy);
          ctx.save();
          ctx.lineWidth = 2;
          ctx.strokeStyle = `rgba(255,224,140,${0.8 + pulse * 0.2})`;
          ctx.shadowColor = "rgba(255,224,140,0.95)";
          ctx.shadowBlur = 16 + pulse * 12;
          ctx.stroke();
          ctx.lineWidth = 3.5;
          ctx.globalAlpha = 0.35 + pulse * 0.25;
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.restore();
        }
      }

      // --- partículas ---
      ctx.textAlign = "center";
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const s = particles.current[i];
        s.x += s.vx * 0.016;
        s.y += s.vy * 0.016;
        s.life -= 0.016;
        if (s.life <= 0) {
          particles.current.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, s.life / s.max);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (particles.current.length > 420) particles.current.splice(0, particles.current.length - 420);

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    function pointerDown(e: PointerEvent) {
      drag.current = { startX: e.clientX, startY: e.clientY, camX: camera.current.x, camY: camera.current.y, moved: false, pointerId: e.pointerId };
      canvas.setPointerCapture(e.pointerId);
    }
    function pointerMove(e: PointerEvent) {
      const d = drag.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const dx = e.clientX - d.startX,
        dy = e.clientY - d.startY;
      if (Math.hypot(dx, dy) > 4) d.moved = true;
      if (d.moved) {
        camera.current.x = d.camX + dx / camera.current.scale;
        camera.current.y = d.camY + dy / camera.current.scale;
      }
    }
    function pointerUp(e: PointerEvent) {
      const d = drag.current;
      drag.current = null;
      if (!d || d.pointerId !== e.pointerId) return;
      if (d.moved) return;
      const rect = wrap.getBoundingClientRect();
      const { x, y } = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      const hex: Axial = pixelToHex(x, y, HEX_SIZE);
      const key = hexKey(hex);
      if (!latest.current.tiles[key]) return;
      if (latest.current.buildMode) cbRef.current.onPlace(key);
      else cbRef.current.onSelect(key);
    }
    function wheel(e: WheelEvent) {
      e.preventDefault();
      const next = camera.current.scale * (e.deltaY > 0 ? 0.92 : 1.08);
      camera.current.scale = Math.min(2.2, Math.max(0.55, next));
    }

    canvas.addEventListener("pointerdown", pointerDown);
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("wheel", wheel, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", pointerDown);
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("wheel", wheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={wrapRef} className="hex-canvas-wrap">
      <canvas ref={canvasRef} />
    </div>
  );
}
