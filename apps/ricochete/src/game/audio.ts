// ─── Procedural music engine ────────────────────────────────────────────────
// No audio files at all — everything here is synthesized with the Web Audio
// API. A background loop (bass, then chords, then percussion as "heat" rises)
// plays continuously once started, plus an immediate short "stinger" note on
// every block break whose pitch climbs with the current combo. Heat rises on
// each break and decays on its own, driving both tempo and how many layers
// are active — the more the player is wrecking the arena, the harder the
// track pushes. Uses the classic look-ahead scheduler pattern (schedule the
// next note a little ahead of audioContext.currentTime) instead of setTimeout
// per-note, so timing stays sample-accurate even if the main thread stutters.
// The AudioContext is only created/resumed from start(), which must be called
// from a user gesture (the "Lançar" button) per browser autoplay policy.

const ROOT = 110; // A2, in Hz
const BEATS_PER_BAR = 4;

function noteFreq(semitoneIndex: number): number {
  return ROOT * Math.pow(2, semitoneIndex / 12);
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private muted = false;
  private heat = 0; // 0..1
  private running = false;
  private schedulerId: number | null = null;
  private nextNoteTime = 0;
  private beatIndex = 0;
  private lastTickAt = 0;
  private comboPitch = 0;

  private readonly lookaheadMs = 25;
  private readonly scheduleAheadSec = 0.15;

  start() {
    if (this.ctx) {
      this.ctx.resume();
      return;
    }
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.32;
    this.master.connect(ctx.destination);
    this.noiseBuffer = this.makeNoiseBuffer(ctx);
    this.nextNoteTime = ctx.currentTime + 0.1;
    this.lastTickAt = ctx.currentTime;
    this.beatIndex = 0;
    this.running = true;
    this.schedulerId = window.setInterval(() => this.tick(), this.lookaheadMs);
  }

  stop() {
    this.running = false;
    if (this.schedulerId !== null) {
      window.clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.32;
  }

  onBreak(level: number, combo: number) {
    this.heat = Math.min(1, this.heat + 0.1 + level * 0.03);
    if (!this.ctx) return;
    this.comboPitch = Math.min(12, combo - 1);
    this.playStinger(this.ctx.currentTime, this.comboPitch);
  }

  private makeNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private tick() {
    const ctx = this.ctx;
    if (!ctx || !this.running) return;

    const now = ctx.currentTime;
    const dt = Math.max(0, now - this.lastTickAt);
    this.lastTickAt = now;
    this.heat = Math.max(0, this.heat - dt * 0.07);

    while (this.nextNoteTime < now + this.scheduleAheadSec) {
      this.playBeat(this.beatIndex, this.nextNoteTime);
      const bpm = 92 + this.heat * 58;
      this.nextNoteTime += 60 / bpm;
      this.beatIndex = (this.beatIndex + 1) % (BEATS_PER_BAR * 2);
    }
  }

  private playBeat(beatIndex: number, time: number) {
    const posInBar = beatIndex % BEATS_PER_BAR;

    if (posInBar === 0 || posInBar === 2) {
      this.playBass(time, noteFreq(posInBar === 0 ? 0 : 7));
    }

    if (this.heat > 0.3 && posInBar === 0) {
      this.playChordStab(time);
    }

    if (this.heat > 0.6) {
      this.playHat(time, posInBar % 2 === 1 ? 0.5 : 0.28);
      if (posInBar === 0 || posInBar === 2) this.playKick(time);
    }
  }

  private osc(
    time: number,
    freq: number,
    duration: number,
    type: OscillatorType,
    peakGain: number,
    filterFreq?: number,
  ) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peakGain, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    let node: AudioNode = osc;
    if (filterFreq) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq;
      osc.connect(filter);
      node = filter;
    }
    node.connect(gain);
    gain.connect(master);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  private playBass(time: number, freq: number) {
    this.osc(time, freq / 2, 0.35, 'sawtooth', 0.5, 800);
  }

  private playChordStab(time: number) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    [0, 3, 7].forEach((interval) => {
      this.osc(time, noteFreq(interval + 12), 0.5, 'triangle', 0.14, 2200);
    });
  }

  private playHat(time: number, peakGain: number) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || !this.noiseBuffer) return;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(peakGain, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(time);
    src.stop(time + 0.06);
  }

  private playKick(time: number) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);
    gain.gain.setValueAtTime(0.55, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
    osc.connect(gain);
    gain.connect(master);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  private playStinger(time: number, pitchSteps: number) {
    const freq = noteFreq(12 + pitchSteps);
    this.osc(time, freq, 0.18, 'square', 0.22, 4000);
    this.osc(time + 0.02, freq * 1.5, 0.12, 'sine', 0.12);
  }
}
