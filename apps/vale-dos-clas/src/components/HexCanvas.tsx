import { useEffect, useRef } from "react";
import { hexCorners, hexKey, hexToPixel, keyToHex, pixelToHex, type Axial } from "@/lib/hex";
import { CENTER } from "@/lib/mapgen";
import { canClaimForBuild } from "@/lib/gameReducer";
import { BUILDINGS, TERRAINS, buildProgress, type BuildingId, type Tile } from "@/lib/types";

const HEX_SIZE = 34;

interface Sparkle {
  x: number;
  y: number;
  vy: number;
  life: number;
  max: number;
  color: string;
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
  // câmera: offset de pan (em px de mundo) + escala; guardo em ref pra não re-renderizar React a cada frame
  const camera = useRef({ x: 0, y: 0, scale: 1 });
  const drag = useRef<{ startX: number; startY: number; camX: number; camY: number; moved: boolean; pointerId: number } | null>(null);
  const sparkles = useRef<Sparkle[]>([]);
  const lastSparkleAt = useRef(0);

  // props mais recentes acessíveis de dentro do loop de animação sem recriar o loop
  const latest = useRef({ tiles, selected, buildMode });
  latest.current = { tiles, selected, buildMode };
  // idem para os callbacks, que mudam de identidade a cada render do App
  const cbRef = useRef({ onSelect, onPlace });
  cbRef.current = { onSelect, onPlace };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let dpr = Math.min(2, window.devicePixelRatio || 1);

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
      const cx = rect.width / 2 + (x + camera.current.x) * camera.current.scale;
      const cy = rect.height / 2 + (y + camera.current.y) * camera.current.scale;
      return { cx, cy };
    }

    function screenToWorld(sx: number, sy: number) {
      const rect = wrap.getBoundingClientRect();
      const x = (sx - rect.width / 2) / camera.current.scale - camera.current.x;
      const y = (sy - rect.height / 2) / camera.current.scale - camera.current.y;
      return { x, y };
    }

    function draw(now: number) {
      const { tiles: ts, selected: sel, buildMode: bm } = latest.current;
      const rect = wrap.getBoundingClientRect();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = "#0a1016";
      ctx.fillRect(0, 0, rect.width, rect.height);

      const corners = hexCorners(HEX_SIZE * camera.current.scale);
      const pulse = (Math.sin(now / 420) + 1) / 2; // 0..1 suave, usado nos brilhos

      const order = Object.values(ts).sort((a, b) => a.hex.r - b.hex.r || a.hex.q - b.hex.q);

      for (const tile of order) {
        const { x, y } = hexToPixel(tile.hex, HEX_SIZE);
        const { cx, cy } = worldToScreen(x, y);
        if (cx < -60 || cy < -60 || cx > rect.width + 60 || cy > rect.height + 60) continue;

        const def = TERRAINS[tile.terrain];
        const frontier = tile.owner !== "jogador" && !tile.camp;
        const reachable = tile.owner === "jogador" || canClaimForBuild(ts, hexKey(tile.hex));

        // --- preenchimento com sombreado (bisel simples: claro em cima, escuro embaixo) ---
        ctx.beginPath();
        corners.forEach((c, i) => {
          const px = cx + c.x,
            py = cy + c.y;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        const grad = ctx.createLinearGradient(cx, cy - HEX_SIZE * camera.current.scale, cx, cy + HEX_SIZE * camera.current.scale);
        grad.addColorStop(0, def.colorHi);
        grad.addColorStop(0.55, def.color);
        grad.addColorStop(1, def.colorLo);
        ctx.fillStyle = grad;
        ctx.fill();

        if (tile.terrain === "agua") {
          // leve cintilância na água
          ctx.fillStyle = `rgba(180,225,255,${0.05 + 0.05 * Math.sin(now / 500 + tile.hex.q)})`;
          ctx.fill();
        }

        if (frontier) {
          ctx.fillStyle = reachable ? "rgba(6,10,8,0.18)" : "rgba(6,10,8,0.52)";
          ctx.fill();
        }

        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(10,14,10,0.55)";
        ctx.stroke();

        // --- modo de construção: realce verde em tiles válidos, vermelho nos inválidos próximos ---
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

        // --- depósito especial ---
        if (tile.deposit && !tile.building) {
          ctx.font = `${13 * camera.current.scale}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(tile.deposit === "ouro" ? "✨" : "🐾", cx, cy - 8 * camera.current.scale);
        }

        // --- acampamento neutro ---
        if (tile.camp) {
          ctx.font = `${16 * camera.current.scale}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🏕️", cx, cy - 2 * camera.current.scale);
          ctx.font = `bold ${9 * camera.current.scale}px system-ui`;
          ctx.fillStyle = "#2a0d0d";
          ctx.fillRect(cx - 12 * camera.current.scale, cy + 8 * camera.current.scale, 24 * camera.current.scale, 11 * camera.current.scale);
          ctx.fillStyle = "#ff8a7a";
          ctx.fillText(String(tile.camp.defense), cx, cy + 13.5 * camera.current.scale);
        }

        // --- construção + progresso ---
        if (tile.building) {
          const bdef = BUILDINGS[tile.building.id];
          ctx.font = `${17 * camera.current.scale}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.globalAlpha = tile.building.level === 0 ? 0.45 : 1;
          ctx.fillText(bdef.icon, cx, cy - 2 * camera.current.scale);
          ctx.globalAlpha = 1;

          if (tile.building.level > 0) {
            ctx.font = `bold ${8.5 * camera.current.scale}px system-ui`;
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.fillText("Lv" + tile.building.level, cx, cy + 12 * camera.current.scale);
          }

          const prog = buildProgress(tile, now);
          if (prog !== null) {
            const r = HEX_SIZE * camera.current.scale * 0.78;
            ctx.beginPath();
            ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
            ctx.strokeStyle = "#ffd45e";
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            ctx.shadowColor = "rgba(255,212,94,0.8)";
            ctx.shadowBlur = 6;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          // faíscas de produção saindo de tiles ativos
          if (tile.owner === "jogador" && tile.building.level > 0 && !tile.building.upgrading && bdef.produces && now - lastSparkleAt.current > 260) {
            sparkles.current.push({
              x: cx + (Math.random() * 16 - 8),
              y: cy,
              vy: -14 - Math.random() * 10,
              life: 1,
              max: 1,
              color: tile.deposit === "ouro" ? "#ffe18a" : "#bdf2a0",
            });
          }
        }

        // --- anel de seleção pulsante ---
        if (hexKey(tile.hex) === sel) {
          ctx.save();
          ctx.lineWidth = 3;
          ctx.strokeStyle = `rgba(255,224,140,${0.65 + pulse * 0.35})`;
          ctx.shadowColor = "rgba(255,224,140,0.9)";
          ctx.shadowBlur = 14 + pulse * 10;
          ctx.stroke();
          ctx.restore();
        }
      }
      if (Object.values(ts).some((t) => t.owner === "jogador" && t.building && t.building.level > 0 && !t.building.upgrading)) {
        lastSparkleAt.current = now;
      }

      // --- partículas (faíscas de recurso) ---
      ctx.textAlign = "center";
      for (let i = sparkles.current.length - 1; i >= 0; i--) {
        const s = sparkles.current[i];
        s.y += s.vy * 0.016;
        s.life -= 0.016;
        if (s.life <= 0) {
          sparkles.current.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, s.life / s.max);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (sparkles.current.length > 400) sparkles.current.splice(0, sparkles.current.length - 400);

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    // centraliza a câmera no Paço na primeira montagem
    camera.current.x = -hexToPixel(CENTER, HEX_SIZE).x;
    camera.current.y = -hexToPixel(CENTER, HEX_SIZE).y;

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

// ajuda a converter uma key salva de volta em hex, usado por outros componentes
export function keyToAxial(key: string): Axial {
  return keyToHex(key);
}
