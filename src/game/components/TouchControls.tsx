import { useEffect, useRef, useState } from "react";
import { useInput } from "../systems/input";

/**
 * Mobile touch controls: virtual joystick (left half), look drag (right half),
 * and action buttons (attack, run, interact, block).
 */
export function TouchControls() {
  const isTouch = useInput((s) => s.isTouch);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const t = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
    setActive(t);
    useInput.getState().setTouch(t);
  }, []);

  if (!isTouch && !active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none">
      <Joystick />
      <LookPad />
      <ActionButtons />
    </div>
  );
}

function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const touchId = useRef<number | null>(null);
  const center = useRef({ x: 0, y: 0 });
  const RADIUS = 56;

  useEffect(() => {
    const reset = () => {
      touchId.current = null;
      useInput.getState().setMove(0, 0);
      if (knobRef.current) knobRef.current.style.transform = `translate(0px, 0px)`;
    };
    const start = (e: TouchEvent) => {
      if (touchId.current !== null) return;
      const t = e.changedTouches[0];
      // only bottom-left quadrant
      if (t.clientX > window.innerWidth / 2) return;
      if (t.clientY < window.innerHeight * 0.45) return;
      e.preventDefault();
      touchId.current = t.identifier;
      center.current = { x: t.clientX, y: t.clientY };
      if (baseRef.current) {
        baseRef.current.style.left = `${t.clientX - 70}px`;
        baseRef.current.style.top = `${t.clientY - 70}px`;
        baseRef.current.style.opacity = "1";
      }
    };
    const move = (e: TouchEvent) => {
      if (touchId.current === null) return;
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier !== touchId.current) continue;
        e.preventDefault();
        let dx = t.clientX - center.current.x;
        let dy = t.clientY - center.current.y;
        const d = Math.hypot(dx, dy);
        if (d > RADIUS) {
          dx = (dx / d) * RADIUS;
          dy = (dy / d) * RADIUS;
        }
        if (knobRef.current) knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
        const nx = dx / RADIUS;
        const ny = dy / RADIUS;
        useInput.getState().setMove(nx, ny);
        // auto-run when pushed near edge
        useInput.getState().setRun(Math.hypot(nx, ny) > 0.85);
      }
    };
    const end = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === touchId.current) {
          if (baseRef.current) baseRef.current.style.opacity = "0.4";
          useInput.getState().setRun(false);
          reset();
        }
      }
    };
    document.addEventListener("touchstart", start, { passive: false });
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", end);
    document.addEventListener("touchcancel", end);
    return () => {
      document.removeEventListener("touchstart", start);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", end);
      document.removeEventListener("touchcancel", end);
    };
  }, []);

  return (
    <div
      ref={baseRef}
      className="absolute h-[140px] w-[140px] rounded-full border-2 border-amber-200/40 bg-black/40 transition-opacity"
      style={{ left: 30, top: "calc(100% - 170px)", opacity: 0.4 }}
    >
      <div
        ref={knobRef}
        className="absolute left-1/2 top-1/2 h-[56px] w-[56px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-200/70 bg-amber-100/20"
      />
    </div>
  );
}

function LookPad() {
  const touchId = useRef<number | null>(null);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const start = (e: TouchEvent) => {
      if (touchId.current !== null) return;
      const t = e.changedTouches[0];
      // only right half, avoid action buttons (right edge bottom)
      if (t.clientX < window.innerWidth / 2) return;
      // skip if inside action buttons area
      if (
        t.clientX > window.innerWidth - 200 &&
        t.clientY > window.innerHeight - 240
      )
        return;
      touchId.current = t.identifier;
      last.current = { x: t.clientX, y: t.clientY };
    };
    const move = (e: TouchEvent) => {
      if (touchId.current === null) return;
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier !== touchId.current) continue;
        const dx = t.clientX - last.current.x;
        const dy = t.clientY - last.current.y;
        last.current = { x: t.clientX, y: t.clientY };
        useInput.getState().addLook(dx * 2.0, dy * 2.0);
      }
    };
    const end = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === touchId.current) touchId.current = null;
      }
    };
    document.addEventListener("touchstart", start, { passive: true });
    document.addEventListener("touchmove", move, { passive: true });
    document.addEventListener("touchend", end);
    document.addEventListener("touchcancel", end);
    return () => {
      document.removeEventListener("touchstart", start);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", end);
      document.removeEventListener("touchcancel", end);
    };
  }, []);
  return null;
}

function ActionButtons() {
  return (
    <div className="absolute bottom-6 right-4 flex flex-col items-end gap-3">
      <div className="flex gap-3">
        <ActionBtn
          label="✋"
          sub="BLOCK"
          onDown={() => useInput.getState().setBlock(true)}
          onUp={() => useInput.getState().setBlock(false)}
          color="border-blue-300/60 text-blue-100"
        />
        <ActionBtn
          label="⚔"
          sub="ATK"
          onDown={() => useInput.getState().pressAttack()}
          onUp={() => useInput.getState().setAttackHeld(false)}
          color="border-red-300/60 text-red-100"
          big
        />
      </div>
      <div className="flex gap-3">
        <ActionBtn
          label="✦"
          sub="USE"
          onDown={() => useInput.getState().pressInteract()}
          onUp={() => useInput.getState().setInteract(false)}
          color="border-amber-300/60 text-amber-100"
        />
        <ActionBtn
          label="»"
          sub="RUN"
          onDown={() => useInput.getState().setRun(true)}
          onUp={() => useInput.getState().setRun(false)}
          color="border-green-300/60 text-green-100"
        />
      </div>
    </div>
  );
}

function ActionBtn({
  label,
  sub,
  onDown,
  onUp,
  color,
  big,
}: {
  label: string;
  sub: string;
  onDown: () => void;
  onUp: () => void;
  color: string;
  big?: boolean;
}) {
  const size = big ? "h-20 w-20 text-3xl" : "h-16 w-16 text-2xl";
  return (
    <button
      type="button"
      className={`pointer-events-auto ${size} flex flex-col items-center justify-center rounded-full border-2 bg-black/50 font-mono active:bg-black/80 ${color}`}
      onTouchStart={(e) => {
        e.preventDefault();
        onDown();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onUp();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="leading-none">{label}</span>
      <span className="text-[8px] tracking-widest opacity-70">{sub}</span>
    </button>
  );
}
