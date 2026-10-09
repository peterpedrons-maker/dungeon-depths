import { useEffect, useRef } from "react";
import { hexCorners, hexKey, hexToPixel, mulberry32, pixelToHex, type Axial } from "@/lib/hex";
import { canClaimForBuild } from "@/lib/gameReducer";
import { BUILDINGS, TERRAINS, buildProgress, type BuildingId, type Terrain, type Tile } from "@/lib/types";

const HEX_SIZE = 34;

// altura visual (prisma) de cada terreno, em unidades de hex-size — dá o relevo 3D.
const TERRAIN_HEIGHT: Record<Terrain, number> = {
  planicie: 0.16,
  floresta: 0.26,
  colina: 0.38,
  montanha: 0.58,
  agua: 0,
};

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

type DecorKind = "tree" | "rock" | "peak" | "grass" | "wave";
interface Decor {
  kind: DecorKind;
  x: number; // fração do raio do hex, -1..1
  y: number;
  s: number; // escala relativa
  seed: number;
  snow?: boolean;
  hue?: number;
}

function hashSeed(q: number, r: number): number {
  return ((q * 374761393) ^ (r * 668265263) ^ 0x9e3779b9) >>> 0;
}

function shade(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * factor)));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * factor)));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * factor)));
  return `rgb(${r},${g},${b})`;
}

function buildDecor(tile: Tile): Decor[] {
  const rnd = mulberry32(hashSeed(tile.hex.q, tile.hex.r));
  const out: Decor[] = [];
  if (tile.terrain === "floresta") {
    const n = 3 + Math.floor(rnd() * 2);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2;
      const d = 0.15 + rnd() * 0.46;
      out.push({ kind: "tree", x: Math.cos(a) * d, y: Math.sin(a) * d * 0.72, s: 0.5 + rnd() * 0.42, seed: rnd() * 1000, hue: rnd() });
    }
  } else if (tile.terrain === "montanha") {
    const n = 2 + Math.floor(rnd() * 2);
    for (let i = 0; i < n; i++) {
      out.push({
        kind: "peak",
        x: -0.4 + (i / Math.max(1, n - 1)) * 0.8 + (rnd() - 0.5) * 0.18,
        y: 0.1 + rnd() * 0.12,
        s: 0.55 + rnd() * 0.4,
        seed: rnd() * 1000,
        snow: rnd() > 0.25,
      });
    }
  } else if (tile.terrain === "colina") {
    const n = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      out.push({ kind: "rock", x: (rnd() - 0.5) * 0.9, y: (rnd() - 0.5) * 0.5 + 0.08, s: 0.18 + rnd() * 0.22, seed: rnd() * 1000 });
    }
  } else if (tile.terrain === "planicie") {
    const n = 4 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      out.push({ kind: "grass", x: (rnd() - 0.5) * 0.92, y: (rnd() - 0.5) * 0.56, s: 0.5 + rnd() * 0.5, seed: rnd() * 1000 });
    }
  } else if (tile.terrain === "agua") {
    for (let i = 0; i < 3; i++) {
      out.push({ kind: "wave", x: 0, y: -0.45 + i * 0.42, s: 0.7 + rnd() * 0.3, seed: rnd() * 1000 });
    }
  }
  return out;
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
  const decorRef = useRef<Map<string, Decor[]>>(new Map());
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

    // decoração procedural: calculada uma única vez (o terreno nunca muda depois do mapa gerado)
    for (const tile of Object.values(latest.current.tiles)) decorRef.current.set(hexKey(tile.hex), buildDecor(tile));
    for (let i = 0; i < 70; i++) starsRef.current.push({ x: Math.random(), y: Math.random(), r: 0.4 + Math.random() * 1.1, phase: Math.random() * Math.PI * 2 });

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

    function drawTree(cx: number, cy: number, size: number, hue: number, sway: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(sway * 0.06);
      ctx.fillStyle = `hsl(${118 + hue * 20}, 38%, ${14 + hue * 6}%)`;
      ctx.fillRect(-size * 0.07, -size * 0.1, size * 0.14, size * 0.55);
      const green = `hsl(${112 + hue * 26}, ${42 + hue * 10}%, ${30 + hue * 10}%)`;
      const greenLight = `hsl(${112 + hue * 26}, ${48 + hue * 10}%, ${42 + hue * 10}%)`;
      for (let i = 0; i < 3; i++) {
        const yy = -size * (0.35 + i * 0.42);
        const rr = size * (0.62 - i * 0.1);
        ctx.beginPath();
        ctx.ellipse(0, yy, rr, rr * 0.82, 0, 0, Math.PI * 2);
        ctx.fillStyle = i === 2 ? greenLight : green;
        ctx.fill();
      }
      ctx.restore();
    }

    function drawPeak(cx: number, cy: number, w: number, h: number, snow: boolean, baseColor: string) {
      ctx.beginPath();
      ctx.moveTo(cx - w, cy);
      ctx.lineTo(cx, cy - h);
      ctx.lineTo(cx + w, cy);
      ctx.closePath();
      const g = ctx.createLinearGradient(cx, cy - h, cx, cy);
      g.addColorStop(0, shade(baseColor, 1.55));
      g.addColorStop(1, shade(baseColor, 0.72));
      ctx.fillStyle = g;
      ctx.fill();
      if (snow) {
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.32, cy - h * 0.62);
        ctx.lineTo(cx, cy - h);
        ctx.lineTo(cx + w * 0.32, cy - h * 0.62);
        ctx.lineTo(cx + w * 0.12, cy - h * 0.48);
        ctx.lineTo(cx, cy - h * 0.66);
        ctx.lineTo(cx - w * 0.12, cy - h * 0.48);
        ctx.closePath();
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.fill();
      }
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
      const corners = hexCorners(HEX_SIZE * scale);
      const pulse = (Math.sin(now / 420) + 1) / 2;

      type Placed = { tile: Tile; cx: number; cy: number; topCy: number; height: number; onscreen: boolean };
      const placed: Placed[] = Object.values(ts).map((tile) => {
        const { x, y } = hexToPixel(tile.hex, HEX_SIZE);
        const { cx, cy } = worldToScreen(x, y);
        const height = TERRAIN_HEIGHT[tile.terrain] * HEX_SIZE * scale;
        const onscreen = !(cx < -70 || cy < -90 || cx > rect.width + 70 || cy > rect.height + 70);
        return { tile, cx, cy, topCy: cy - height, height, onscreen };
      });
      placed.sort((a, b) => a.cy - b.cy);

      for (const p of placed) {
        if (!p.onscreen) continue;
        const { tile, cx, cy, topCy, height } = p;
        const def = TERRAINS[tile.terrain];
        const frontier = tile.owner !== "jogador" && !tile.camp;
        const reachable = tile.owner === "jogador" || canClaimForBuild(ts, hexKey(tile.hex));
        const dim = frontier && !reachable;

        // --- faces laterais do prisma (só as 3 voltadas "pra baixo", suficiente pra ler o relevo) ---
        if (height > 1) {
          const faceShade = [0.78, 0.6, 0.72]; // sudeste, sul, sudoeste — sul é a mais escura (sombra)
          for (let e = 0; e < 3; e++) {
            const a = corners[e],
              b = corners[(e + 1) % 6];
            ctx.beginPath();
            ctx.moveTo(cx + a.x, topCy + a.y);
            ctx.lineTo(cx + b.x, topCy + b.y);
            ctx.lineTo(cx + b.x, cy + b.y);
            ctx.lineTo(cx + a.x, cy + a.y);
            ctx.closePath();
            ctx.fillStyle = shade(def.colorLo, faceShade[e] * (dim ? 0.55 : 1));
            ctx.fill();
          }
        }

        // --- topo do hex, com bisel claro→escuro pra dar volume ---
        ctx.beginPath();
        corners.forEach((c, i) => {
          const px = cx + c.x,
            py = topCy + c.y;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        const grad = ctx.createLinearGradient(cx, topCy - HEX_SIZE * scale, cx, topCy + HEX_SIZE * scale);
        grad.addColorStop(0, def.colorHi);
        grad.addColorStop(0.55, def.color);
        grad.addColorStop(1, def.colorLo);
        ctx.fillStyle = grad;
        ctx.fill();

        // --- decoração procedural do terreno ---
        const decor = decorRef.current.get(hexKey(tile.hex)) || [];
        const r = HEX_SIZE * scale;
        for (const d of decor) {
          const dx = cx + d.x * r,
            dy = topCy + d.y * r;
          if (d.kind === "tree") {
            const sway = Math.sin(now / 1400 + d.seed);
            drawTree(dx, dy, r * 0.62 * d.s, d.hue ?? 0.5, sway);
          } else if (d.kind === "peak") {
            drawPeak(dx, dy, r * 0.5 * d.s, r * 0.95 * d.s, !!d.snow, def.color);
          } else if (d.kind === "rock") {
            ctx.beginPath();
            ctx.ellipse(dx, dy, r * d.s, r * d.s * 0.72, 0.3, 0, Math.PI * 2);
            ctx.fillStyle = shade(def.colorLo, 1.15);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(dx - r * d.s * 0.25, dy - r * d.s * 0.2, r * d.s * 0.4, r * d.s * 0.26, 0.3, 0, Math.PI * 2);
            ctx.fillStyle = shade(def.colorHi, 1.08);
            ctx.fill();
          } else if (d.kind === "grass") {
            const sway = Math.sin(now / 650 + d.seed) * 2.6;
            ctx.strokeStyle = shade(def.colorHi, 1.1);
            ctx.lineWidth = Math.max(1, r * 0.05);
            ctx.lineCap = "round";
            for (let g = -1; g <= 1; g++) {
              ctx.beginPath();
              ctx.moveTo(dx + g * r * 0.055, dy);
              ctx.quadraticCurveTo(dx + g * r * 0.055 + sway * 0.5, dy - r * 0.13 * d.s, dx + g * r * 0.08 + sway, dy - r * 0.26 * d.s);
              ctx.stroke();
            }
          } else if (d.kind === "wave") {
            const off = ((now / 1600 + d.seed) % 1) * r * 2;
            ctx.strokeStyle = "rgba(200,235,255,0.22)";
            ctx.lineWidth = Math.max(1, r * 0.045);
            ctx.beginPath();
            ctx.moveTo(dx - r * 0.85 + off - r * 2, dy);
            ctx.quadraticCurveTo(dx - r * 0.2 + off - r * 2, dy - r * 0.12, dx + r * 0.85 + off - r * 2, dy);
            ctx.stroke();
          }
        }
        if (tile.terrain === "agua") {
          const glint = (Math.sin(now / 500 + tile.hex.q * 1.7 + tile.hex.r * 2.3) + 1) / 2;
          if (glint > 0.82) {
            ctx.fillStyle = `rgba(255,255,255,${(glint - 0.82) * 2.2})`;
            ctx.beginPath();
            ctx.arc(cx + (tile.hex.q % 3) * r * 0.2, topCy, r * 0.05, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        if (dim) {
          ctx.fillStyle = "rgba(5,9,7,0.5)";
          ctx.fill();
        } else if (frontier) {
          ctx.fillStyle = "rgba(5,9,7,0.16)";
          ctx.fill();
        }

        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(8,12,9,0.55)";
        ctx.stroke();
        // aresta superior clara — reforça a leitura de "topo biselado"
        ctx.beginPath();
        ctx.moveTo(cx + corners[3].x, topCy + corners[3].y);
        ctx.lineTo(cx + corners[4].x, topCy + corners[4].y);
        ctx.lineTo(cx + corners[5].x, topCy + corners[5].y);
        ctx.lineTo(cx + corners[0].x, topCy + corners[0].y);
        ctx.strokeStyle = "rgba(255,255,255,0.14)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // --- realce de modo-construção ---
        if (bm) {
          const bdef = BUILDINGS[bm];
          const terrainOk = bdef.terrains ? bdef.terrains.includes(tile.terrain) : tile.terrain !== "agua" && tile.terrain !== "montanha";
          const valid = terrainOk && !tile.building && !tile.camp && (tile.owner === "jogador" || canClaimForBuild(ts, hexKey(tile.hex)));
          if (valid) {
            ctx.save();
            ctx.lineWidth = 2.5 + pulse * 1.5;
            ctx.strokeStyle = `rgba(120,230,140,${0.55 + pulse * 0.35})`;
            ctx.shadowColor = "rgba(120,230,140,0.8)";
            ctx.shadowBlur = 10 + pulse * 6;
            ctx.stroke();
            ctx.restore();
          }
        }

        if (tile.deposit && !tile.building) {
          const bob = Math.sin(now / 500 + hashSeed(tile.hex.q, tile.hex.r)) * 2 * scale;
          ctx.font = `${13 * scale}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(tile.deposit === "ouro" ? "✨" : "🐾", cx, topCy - 10 * scale + bob);
        }

        if (tile.camp) {
          const ember = (Math.sin(now / 340 + hashSeed(tile.hex.q, tile.hex.r)) + 1) / 2;
          const glow = ctx.createRadialGradient(cx, topCy, 0, cx, topCy, r * 0.9);
          glow.addColorStop(0, `rgba(255,110,70,${0.3 + ember * 0.22})`);
          glow.addColorStop(1, "rgba(255,110,70,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(cx, topCy, r * 0.9, 0, Math.PI * 2);
          ctx.fill();
          if (Math.random() < 0.03) particles.current.push({ x: cx + (Math.random() * 10 - 5), y: topCy, vx: (Math.random() - 0.5) * 6, vy: -16 - Math.random() * 10, life: 1, max: 1, size: 2, color: "#ff8a5a" });

          ctx.font = `${16 * scale}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🏕️", cx, topCy - 2 * scale);
          ctx.font = `bold ${9 * scale}px system-ui`;
          ctx.fillStyle = "#2a0d0d";
          ctx.fillRect(cx - 12 * scale, topCy + 8 * scale, 24 * scale, 11 * scale);
          ctx.fillStyle = "#ff8a7a";
          ctx.fillText(String(tile.camp.defense), cx, topCy + 13.5 * scale);
        }

        if (tile.building) {
          const bdef = BUILDINGS[tile.building.id];
          const bseed = hashSeed(tile.hex.q, tile.hex.r);
          const bob = tile.building.level > 0 ? Math.sin(now / 900 + bseed) * 1.6 * scale : 0;

          // sombra no chão — ancora o ícone no topo do hex
          ctx.beginPath();
          ctx.ellipse(cx, topCy + 11 * scale, 11 * scale, 4 * scale, 0, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0,0,0,0.32)";
          ctx.fill();

          if (tile.building.level > 0 && !tile.building.upgrading) {
            const glow = ctx.createRadialGradient(cx, topCy, 0, cx, topCy, r * 0.8);
            glow.addColorStop(0, "rgba(255,224,150,0.16)");
            glow.addColorStop(1, "rgba(255,224,150,0)");
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, topCy, r * 0.8, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.font = `${17 * scale}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.globalAlpha = tile.building.level === 0 ? 0.45 : 1;
          ctx.fillText(bdef.icon, cx, topCy - 2 * scale + bob);
          ctx.globalAlpha = 1;

          if (tile.building.level > 0) {
            ctx.font = `bold ${8.5 * scale}px system-ui`;
            ctx.fillStyle = "rgba(255,255,255,0.88)";
            ctx.fillText("Lv" + tile.building.level, cx, topCy + 12 * scale);
          }

          const prog = buildProgress(tile, now);
          if (prog !== null) {
            const rr = r * 0.78;
            ctx.beginPath();
            ctx.arc(cx, topCy, rr, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
            ctx.strokeStyle = "#ffd45e";
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            ctx.shadowColor = "rgba(255,212,94,0.8)";
            ctx.shadowBlur = 6;
            ctx.stroke();
            ctx.shadowBlur = 0;
            if (Math.random() < 0.25) particles.current.push({ x: cx + (Math.random() * 14 - 7), y: topCy + 8 * scale, vx: (Math.random() - 0.5) * 8, vy: -6 - Math.random() * 6, life: 0.8, max: 0.8, size: 1.8, color: "#c9a06a" });
          }

          if (tile.owner === "jogador" && tile.building.level > 0 && !tile.building.upgrading && bdef.produces && Math.random() < 0.045) {
            particles.current.push({ x: cx + (Math.random() * 16 - 8), y: topCy, vx: (Math.random() - 0.5) * 4, vy: -16 - Math.random() * 8, life: 1, max: 1, size: 2.2, color: tile.deposit === "ouro" ? "#ffe18a" : "#bdf2a0" });
          }
        }

        if (hexKey(tile.hex) === sel) {
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
