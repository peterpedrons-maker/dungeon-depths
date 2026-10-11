// ─── Manual aim input — horizontal only ────────────────────────────────────
// The camera is fixed and the player never moves. On a phone the touch point
// sits right on top of whatever it's aiming at — this used to put the
// reticle under the player's own thumb. Instead, aim is reduced to a single
// axis: `aimLane` (-1 left .. 0 center .. 1 right), read only from the
// pointer's horizontal position. The player can hold their thumb low on the
// screen (out of the way of the action) and just sweep it left/right; the
// vertical position of the touch is ignored entirely — shots always fly the
// full length of the field toward the horizon, never "aimed short."

export class Input {
  x = 0;
  y = 0;
  aimLane = 0; // -1..1
  firing = false;
  private pid = -1;
  private el: HTMLElement | null = null;

  attach(el: HTMLElement): void {
    this.el = el;
    this.x = el.clientWidth / 2;
    this.y = el.clientHeight * 0.85;
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
    const half = r.width / 2;
    this.aimLane = Math.max(-1, Math.min(1, (this.x - half) / half));
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
