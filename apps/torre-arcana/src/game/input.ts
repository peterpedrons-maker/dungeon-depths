// ─── Manual aim input ───────────────────────────────────────────────────────
// The camera is fixed and the player never moves — the only control is where
// the shots go. A single reticle tracks the pointer's absolute position on
// the canvas (not a joystick offset): it follows touch/mouse 1:1, and the
// equipped runes fire continuously toward it for as long as the pointer is
// held down (`firing`). Releasing stops the barrage but leaves the reticle
// where it was, same as a real crosshair.

export class Input {
  x = 0;
  y = 0;
  firing = false;
  private pid = -1;
  private el: HTMLElement | null = null;

  attach(el: HTMLElement): void {
    this.el = el;
    this.x = el.clientWidth / 2;
    this.y = el.clientHeight * 0.55;
    el.addEventListener('pointerdown', this.onDown, { passive: false });
    el.addEventListener('pointermove', this.onMove, { passive: false });
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
  }

  detach(): void {
    const el = this.el;
    if (el) {
      el.removeEventListener('pointerdown', this.onDown);
      el.removeEventListener('pointermove', this.onMove);
    }
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
  }

  private setFromEvent(e: PointerEvent): void {
    const r = this.el!.getBoundingClientRect();
    this.x = e.clientX - r.left;
    this.y = e.clientY - r.top;
  }

  private onDown = (e: PointerEvent) => {
    this.pid = e.pointerId;
    this.firing = true;
    this.setFromEvent(e);
    e.preventDefault();
  };

  private onMove = (e: PointerEvent) => {
    if (this.pid !== -1 && e.pointerId !== this.pid) return;
    this.setFromEvent(e);
    if (this.pid !== -1) e.preventDefault();
  };

  private onUp = (e: PointerEvent) => {
    if (e.pointerId !== this.pid) return;
    this.pid = -1;
    this.firing = false;
  };

  // Reset on pause/restart (e.g. a finger still down when the phase changes).
  clear(): void {
    this.pid = -1;
    this.firing = false;
  }
}
