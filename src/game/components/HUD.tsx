import { useEffect, useState } from "react";

export function HUD({
  hp,
  maxHp,
  mp,
  maxMp,
  stamina,
  locationName,
  showHint,
  message,
}: {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  stamina: number;
  locationName: string;
  showHint: boolean;
  message?: string | null;
}) {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 select-none font-mono text-[11px] uppercase tracking-widest text-amber-100">
      {/* Location title */}
      <div className="absolute left-1/2 top-4 -translate-x-1/2 text-center text-amber-200/80 [text-shadow:0_2px_0_#000]">
        {locationName}
      </div>

      {/* Bottom-left bars */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1">
        <Bar label="HP" value={hp} max={maxHp} color="#c83030" />
        <Bar label="MP" value={mp} max={maxMp} color="#3060c8" />
        <Bar label="ST" value={stamina} max={100} color="#3ca050" />
      </div>

      {/* Crosshair */}
      <div className="absolute left-1/2 top-1/2 h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 border border-amber-100/70" />

      {showHint && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded border border-amber-200/40 bg-black/70 px-3 py-2 text-amber-100">
          Toque para começar — WASD/Joystick anda · Mouse/arrastar olha · Atacar / Bloquear / Correr
        </div>
      )}
      {message && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 rounded border border-amber-200/50 bg-black/80 px-4 py-2 text-amber-100">
          {message}
        </div>
      )}
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className="flex items-center gap-2">
      <span className="w-7 text-amber-300/90 [text-shadow:0_1px_0_#000]">{label}</span>
      <div
        className="relative h-3 w-44 border border-black/80 bg-black/60"
        style={{ imageRendering: "pixelated" }}
      >
        <div
          className="h-full"
          style={{
            width: `${pct * 100}%`,
            backgroundColor: color,
            boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        />
      </div>
    </div>
  );
}

/** Hook for an animated stamina value to avoid re-renders every frame. */
export function useThrottledNumber(value: number, intervalMs = 100) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setInterval(() => setV(value), intervalMs);
    return () => clearInterval(id);
  }, [value, intervalMs]);
  return v;
}
