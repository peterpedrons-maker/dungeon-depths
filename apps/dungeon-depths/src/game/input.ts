// ─── Twin-stick touch/mouse input ─────────────────────────────────────────
// Left half of the screen = movement stick, right half = aim stick.
// Each stick floats where the finger/mouse presses. Also supports WASD.

export interface Stick {
  active: boolean;
  ox: number; oy: number;   // origin (screen px, where press began)
  kx: number; ky: number;   // knob offset from origin (clamped)
  vx: number; vy: number;   // normalized direction (-1..1)
  mag: number;              // 0..1
}

function blank(): Stick {
  return { active: false, ox: 0, oy: 0, kx: 0, ky: 0, vx: 0, vy: 0, mag: 0 };
}

export class Input {
  move: Stick = blank();
  aim: Stick = blank();
  readonly maxR = 52;
  private movePid = -1;
  private aimPid = -1;
  private keys = new Set<string>();
  private el: HTMLElement | null = null;
  private dashRequested = false;

  // Queue a dash (from the on-screen button or a key). Consumed by the engine.
  requestDash(): void { this.dashRequested = true; }
  consumeDash(): boolean { const d = this.dashRequested; this.dashRequested = false; return d; }

  attach(el: HTMLElement): void {
    this.el = el;
    el.addEventListener('pointerdown', this.onDown, { passive: false });
    el.addEventListener('pointermove', this.onMove, { passive: false });
    el.addEventListener('pointerup', this.onUp);
    el.addEventListener('pointercancel', this.onUp);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKey);
  }

  detach(): void {
    const el = this.el;
    if (el) {
      el.removeEventListener('pointerdown', this.onDown);
      el.removeEventListener('pointermove', this.onMove);
      el.removeEventListener('pointerup', this.onUp);
      el.removeEventListener('pointercancel', this.onUp);
    }
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKey);
  }

  private onDown = (e: PointerEvent) => {
    const leftSide = e.clientX < window.innerWidth / 2;
    const stick = leftSide ? this.move : this.aim;
    if (leftSide && this.movePid === -1) this.movePid = e.pointerId;
    else if (!leftSide && this.aimPid === -1) this.aimPid = e.pointerId;
    else return;
    stick.active = true;
    stick.ox = e.clientX; stick.oy = e.clientY;
    stick.kx = 0; stick.ky = 0; stick.vx = 0; stick.vy = 0; stick.mag = 0;
    e.preventDefault();
  };

  private onMove = (e: PointerEvent) => {
    let stick: Stick | null = null;
    if (e.pointerId === this.movePid) stick = this.move;
    else if (e.pointerId === this.aimPid) stick = this.aim;
    if (!stick) return;
    let dx = e.clientX - stick.ox;
    let dy = e.clientY - stick.oy;
    const d = Math.hypot(dx, dy);
    const clamped = Math.min(d, this.maxR);
    const nx = d > 0 ? dx / d : 0;
    const ny = d > 0 ? dy / d : 0;
    stick.kx = nx * clamped; stick.ky = ny * clamped;
    stick.vx = nx; stick.vy = ny;
    stick.mag = Math.min(1, d / this.maxR);
    e.preventDefault();
  };

  private onUp = (e: PointerEvent) => {
    if (e.pointerId === this.movePid) { this.movePid = -1; this.move = blank(); }
    else if (e.pointerId === this.aimPid) { this.aimPid = -1; this.aim = blank(); }
  };

  private onKey = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if ((k === ' ' || k === 'shift') && e.type === 'keydown') { this.requestDash(); return; }
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
      if (e.type === 'keydown') this.keys.add(k); else this.keys.delete(k);
      this.applyKeys();
    }
  };

  private applyKeys(): void {
    let x = 0, y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (x === 0 && y === 0) {
      if (this.movePid === -1) this.move = blank();
      return;
    }
    const m = Math.hypot(x, y);
    this.move = { active: true, ox: 0, oy: 0, kx: 0, ky: 0, vx: x / m, vy: y / m, mag: 1 };
  }

  // Reset sticks (e.g., on pause) but keep listeners.
  clear(): void {
    this.movePid = -1; this.aimPid = -1;
    this.move = blank(); this.aim = blank();
    this.keys.clear();
  }
}
