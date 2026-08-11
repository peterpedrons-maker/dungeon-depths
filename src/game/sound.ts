// ─── Synth sound engine (Web Audio, no external assets) ───────────────────
class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  muted = false;
  private musicTimer: number | null = null;
  private step = 0;
  private lastHit = 0;

  unlock(): void {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.5;
    this.musicGain.connect(this.master);
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.9;
  }

  private blip(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number): void {
    const ctx = this.ctx, master = this.master;
    if (!ctx || !master || this.muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol: number): void {
    const ctx = this.ctx, master = this.master;
    if (!ctx || !master || this.muted) return;
    const t = ctx.currentTime;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = vol;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 800;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t);
  }

  shoot(): void { this.blip(680, 0.09, 'square', 0.10, 320); }
  hit(): void {
    const now = this.ctx ? this.ctx.currentTime : 0;
    if (now - this.lastHit < 0.04) return; // throttle rapid hits
    this.lastHit = now;
    this.noise(0.05, 0.12);
  }
  enemyDie(): void { this.blip(200, 0.16, 'sawtooth', 0.14, 70); this.noise(0.08, 0.10); }
  hurt(): void { this.blip(160, 0.25, 'square', 0.22, 60); }
  levelUp(): void {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.blip(f, 0.16, 'triangle', 0.22), i * 80));
  }
  gameOver(): void {
    [392, 330, 262, 196].forEach((f, i) => setTimeout(() => this.blip(f, 0.35, 'sawtooth', 0.2), i * 160));
  }
  win(): void {
    [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => this.blip(f, 0.22, 'triangle', 0.24), i * 110));
  }
  ui(): void { this.blip(440, 0.06, 'square', 0.12); }
  dash(): void { this.blip(300, 0.16, 'sine', 0.16, 760); this.noise(0.06, 0.05); }

  // ── Simple looping dungeon bassline ──
  startMusic(): void {
    if (!this.ctx || this.musicTimer !== null) return;
    const bass = [55, 55, 65.4, 55, 49, 49, 58.3, 65.4]; // A dorian-ish walk
    const arp = [220, 261.6, 329.6, 261.6];
    const tick = () => {
      if (!this.ctx || !this.musicGain || this.muted) { this.musicTimer = window.setTimeout(tick, 260); return; }
      const t = this.ctx.currentTime;
      const b = bass[this.step % bass.length];
      this.tone(b, 0.24, 'triangle', 0.5, t);
      this.tone(b / 2, 0.24, 'sine', 0.35, t);
      if (this.step % 2 === 0) this.tone(arp[(this.step / 2) % arp.length], 0.18, 'square', 0.06, t);
      this.step++;
      this.musicTimer = window.setTimeout(tick, 260);
    };
    tick();
  }
  stopMusic(): void {
    if (this.musicTimer !== null) { clearTimeout(this.musicTimer); this.musicTimer = null; }
  }
  private tone(freq: number, dur: number, type: OscillatorType, vol: number, t: number): void {
    if (!this.ctx || !this.musicGain) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.musicGain);
    o.start(t); o.stop(t + dur + 0.02);
  }
}

export const sound = new SoundEngine();
