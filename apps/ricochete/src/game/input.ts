// ─── Input: drag-to-aim ─────────────────────────────────────────────────────
// The player drags from anywhere on the canvas; the angle is the vector from
// the arena center to the current pointer position. Releasing the pointer
// requests a launch, which engine.ts only honors while phase === 'aiming'.
// No power/charge control in this slice — speed is fixed, only angle is free.

export interface InputState {
  dragging: boolean;
  angle: number; // radians, pointing from center toward the drag point
  launchRequested: boolean;
}

export function createInput(): InputState {
  return { dragging: false, angle: -Math.PI / 2, launchRequested: false };
}

function angleFromCenter(cx: number, cy: number, px: number, py: number): number {
  return Math.atan2(py - cy, px - cx);
}

export function attachInput(
  canvas: HTMLCanvasElement,
  input: InputState,
  viewW: number,
  viewH: number,
): () => void {
  const cx = viewW / 2;
  const cy = viewH / 2;

  // Maps a pointer event's CSS-pixel position back into the fixed logical
  // game resolution, since the canvas is displayed scaled (letterboxed) to
  // fit the viewport while the game itself always thinks in viewW x viewH.
  const pointFromEvent = (e: PointerEvent): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * viewW;
    const y = ((e.clientY - rect.top) / rect.height) * viewH;
    return { x, y };
  };

  const onDown = (e: PointerEvent) => {
    const p = pointFromEvent(e);
    input.dragging = true;
    input.launchRequested = false;
    input.angle = angleFromCenter(cx, cy, p.x, p.y);
  };

  const onMove = (e: PointerEvent) => {
    if (!input.dragging) return;
    const p = pointFromEvent(e);
    input.angle = angleFromCenter(cx, cy, p.x, p.y);
  };

  const onUp = () => {
    if (!input.dragging) return;
    input.dragging = false;
    input.launchRequested = true;
  };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  return () => {
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', onUp);
  };
}
