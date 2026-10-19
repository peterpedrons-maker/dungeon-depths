// ─── Procedural music engine ────────────────────────────────────────────────
// No audio files at all — everything here is synthesized with the Web Audio
// API. A background loop (bass, then chords, then arpeggio/percussion as
// "heat" rises) plays continuously once started, routed through a shared
// music bus whose lowpass filter brightens with heat, plus a feedback-delay
// send that gives chords/arps/stingers a bit of arcade-cave shimmer without
// needing an impulse-response sample. A 4-bar chord progression keeps the
// loop from feeling static over a 30s round. Block breaks trigger an
// immediate stinger (timbre varies by block level) plus, every 3rd combo
// step, a short ascending "achievement" chime. The final 3 seconds of a
// round get a rising riser, and the round itself closes with a resolving
// chord. Uses the classic look-ahead scheduler pattern (schedule the next
// note a little ahead of audioContext.currentTime) instead of setTimeout per
// note, so timing stays sample-accurate even if the main thread stutters.
// The AudioContext is only created/resumed from start(), which must be
// called from a user gesture (the "Jogar" button) per browser autoplay policy.

const ROOT = 110; // A2, in Hz
const BEATS_PER_BAR = 4;
// 4-bar progression (semitone offsets from the root): i - bVII - bIII - bVI,
// a classic minor-key loop that keeps the background moving over long rounds.
const CHORD_ROOTS = [0, -2, 3, -5];
const ARP_INTERVALS = [0, 3, 7, 10];

function noteFreq(semitoneIndex: number): number {
  return ROOT * Math.pow(2, semitoneIndex / 12);
}

interface OscOpts {
  filterFreq?: number;
  bus?: 'music' | 'fx';
  delaySend?: number;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private bodyFilter: BiquadFilterNode | null = null;
  private delay: DelayNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private muted = false;
  private heat = 0; // 0..1
  private running = false;
  private schedulerId: number | null = null;
  private nextNoteTime = 0;
  private beatIndex = 0;
  private bar = -1;
  private lastTickAt = 0;

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

    // Music bus: everything in the background loop passes through a filter
    // whose brightness tracks heat, so the mix itself feels like it's
    // "opening up" as the player wrecks more blocks.
    this.musicBus = ctx.createGain();
    this.bodyFilter = ctx.createBiquadFilter();
    this.bodyFilter.type = 'lowpass';
    this.bodyFilter.frequency.value = 600;
    this.musicBus.connect(this.bodyFilter);
    this.bodyFilter.connect(this.master);

    // Feedback delay send — a cheap stand-in for reverb that gives chords,
    // arps and stingers a bit of arcade-cave shimmer.
    this.delay = ctx.createDelay(1.0);
    this.delay.delayTime.value = 0.28;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.32;
    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 2600;
    const delayWet = ctx.createGain();
    delayWet.gain.value = 0.5;
    this.delay.connect(feedback);
    feedback.connect(delayFilter);
    delayFilter.connect(this.delay);
    delayFilter.connect(delayWet);
    delayWet.connect(this.master);

    this.noiseBuffer = this.makeNoiseBuffer(ctx);
    this.nextNoteTime = ctx.currentTime + 0.1;
    this.lastTickAt = ctx.currentTime;
    this.beatIndex = 0;
    this.bar = -1;
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
    const t = this.ctx.currentTime;
    const pitchSteps = Math.min(12, combo - 1);
    this.playStinger(t, pitchSteps, level);
    if (combo > 1 && combo % 3 === 0) this.playAchievementChime(t, combo);
  }

  onUrgency() {
    if (!this.ctx) return;
    this.playUrgencyRiser(this.ctx.currentTime);
  }

  onRoundEnd() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [0, 7, 12, 16].forEach((iv, i) => {
      this.osc(t + i * 0.015, noteFreq(iv), 1.1, 'triangle', 0.14, { filterFreq: 3200, bus: 'fx', delaySend: 0.5 });
    });
  }

  private makeNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
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
    this.bodyFilter?.frequency.setTargetAtTime(600 + this.heat * 2600, now, 0.15);

    while (this.nextNoteTime < now + this.scheduleAheadSec) {
      this.playBeat(this.beatIndex, this.nextNoteTime);
      const bpm = 92 + this.heat * 58;
      this.nextNoteTime += 60 / bpm;
      this.beatIndex = (this.beatIndex + 1) % (BEATS_PER_BAR * 2);
    }
  }

  private playBeat(beatIndex: number, time: number) {
    const posInBar = beatIndex % BEATS_PER_BAR;
    if (posInBar === 0) this.bar = (this.bar + 1) % CHORD_ROOTS.length;
    const chordRoot = CHORD_ROOTS[this.bar];

    if (posInBar === 0 || posInBar === 2) {
      this.playBass(time, noteFreq(chordRoot + (posInBar === 0 ? 0 : 7)));
    }

    if (this.heat > 0.3 && posInBar === 0) {
      this.playChordStab(time, chordRoot);
    }

    if (this.heat > 0.6) {
      this.playHat(time, posInBar % 2 === 1 ? 0.5 : 0.28);
      if (posInBar === 0 || posInBar === 2) this.playKick(time);
    }

    if (this.heat > 0.75) {
      this.playArpNote(time, chordRoot, beatIndex);
    }
  }

  private osc(time: number, freq: number, duration: number, type: OscillatorType, peakGain: number, opts: OscOpts = {}) {
    const ctx = this.ctx;
    if (!ctx) return;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peakGain, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    let node: AudioNode = osc;
    if (opts.filterFreq) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = opts.filterFreq;
      osc.connect(filter);
      node = filter;
    }
    node.connect(gain);

    const dest = opts.bus === 'fx' ? this.master : this.musicBus;
    if (dest) gain.connect(dest);
    if (opts.delaySend && this.delay) {
      const send = ctx.createGain();
      send.gain.value = opts.delaySend;
      gain.connect(send);
      send.connect(this.delay);
    }

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  private playBass(time: number, freq: number) {
    this.osc(time, freq / 2, 0.35, 'sawtooth', 0.5, { filterFreq: 800 });
  }

  private playChordStab(time: number, chordRoot: number) {
    [0, 3, 7].forEach((interval) => {
      this.osc(time, noteFreq(chordRoot + interval + 12), 0.5, 'triangle', 0.14, { filterFreq: 2200, delaySend: 0.22 });
    });
  }

  private playArpNote(time: number, chordRoot: number, beatIndex: number) {
    const interval = ARP_INTERVALS[beatIndex % ARP_INTERVALS.length];
    const freq = noteFreq(chordRoot + interval + 12);
    this.osc(time, freq, 0.18, 'triangle', 0.1, { filterFreq: 3200, delaySend: 0.3 });
  }

  private playHat(time: number, peakGain: number) {
    const ctx = this.ctx;
    const musicBus = this.musicBus;
    if (!ctx || !musicBus || !this.noiseBuffer) return;

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
    gain.connect(musicBus);
    src.start(time);
    src.stop(time + 0.06);
  }

  private playKick(time: number) {
    const ctx = this.ctx;
    const musicBus = this.musicBus;
    if (!ctx || !musicBus) return;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);
    gain.gain.setValueAtTime(0.55, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
    osc.connect(gain);
    gain.connect(musicBus);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  private playStinger(time: number, pitchSteps: number, level: number) {
    const freq = noteFreq(12 + pitchSteps);
    if (level >= 3) {
      this.osc(time, freq, 0.28, 'square', 0.2, { filterFreq: 5000, bus: 'fx', delaySend: 0.35 });
      this.osc(time, freq * 1.003, 0.3, 'triangle', 0.14, { bus: 'fx', delaySend: 0.35 });
      this.osc(time + 0.03, freq * 2, 0.16, 'sine', 0.08, { bus: 'fx' });
    } else if (level === 2) {
      this.osc(time, freq, 0.2, 'square', 0.2, { filterFreq: 4500, bus: 'fx', delaySend: 0.2 });
      this.osc(time + 0.02, freq * 1.5, 0.12, 'sine', 0.1, { bus: 'fx' });
    } else {
      this.osc(time, freq, 0.15, 'square', 0.18, { filterFreq: 4000, bus: 'fx' });
      this.osc(time + 0.02, freq * 1.5, 0.1, 'sine', 0.1, { bus: 'fx' });
    }
  }

  private playAchievementChime(time: number, combo: number) {
    const tier = Math.min(3, Math.floor(combo / 3));
    const base = 12 + tier * 3;
    [0, 4, 7].forEach((interval, i) => {
      this.osc(time + i * 0.07, noteFreq(base + interval), 0.22, 'triangle', 0.16, { bus: 'fx', delaySend: 0.4 });
    });
  }

  private playUrgencyRiser(time: number) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || !this.noiseBuffer) return;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(300, time);
    filter.frequency.exponentialRampToValueAtTime(5000, time + 2.6);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.18, time + 2.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 2.8);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(time);
    src.stop(time + 2.85);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, time);
    osc.frequency.exponentialRampToValueAtTime(440, time + 2.6);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.0001, time);
    oscGain.gain.exponentialRampToValueAtTime(0.1, time + 2.4);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 2.8);
    osc.connect(oscGain);
    oscGain.connect(master);
    osc.start(time);
    osc.stop(time + 2.85);
  }
}
