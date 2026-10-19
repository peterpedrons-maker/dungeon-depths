// ─── Music engine ────────────────────────────────────────────────────────────
// Real sampled instruments (acoustic bass, vibraphone, kalimba, a drum
// machine) via `smplr` — no oscillator synthesis anywhere. Samples stream
// from smplr's public CDN (gleitz.github.io/midi-js-soundfonts via
// smpldsnds.github.io) on first start(), cached by the browser afterward.
// A background loop plays continuously once started: bass always, chords
// joining as "heat" rises, a kalimba arpeggio and drum machine joining at
// higher heat still. Heat rises when the player breaks blocks (and decays on
// its own) and drives both tempo and how many layers are active — no
// separate "hit" sound effect is triggered on break, the music itself is the
// only feedback. A 4-bar chord progression keeps a ~30s+ run from feeling
// static. Uses the classic look-ahead scheduler pattern (schedule the next
// note a little ahead of audioContext.currentTime) instead of setTimeout per
// note, so timing stays sample-accurate even if the main thread stutters.
// The AudioContext is only created/resumed from start(), which must be
// called from a user gesture (the "Jogar" button) per browser autoplay policy.

import { DrumMachine, Reverb, Soundfont, type Smplr } from 'smplr';

const MIDI_A2 = 45; // root note, A2
const BEATS_PER_BAR = 4;
// 4-bar progression (semitone offsets from the root): i - bVII - bIII - bVI,
// a classic minor-key loop that keeps the background moving over long runs.
const CHORD_ROOTS = [0, -2, 3, -5];
const ARP_INTERVALS = [0, 3, 7, 10];

function midi(semitone: number): number {
  return MIDI_A2 + semitone;
}

function collectNotes(): { bass: number[]; melody: number[] } {
  const bass = new Set<number>();
  const melody = new Set<number>();
  for (const root of CHORD_ROOTS) {
    bass.add(midi(root - 12));
    bass.add(midi(root + 7 - 12));
    [0, 3, 7, 10].forEach((iv) => melody.add(midi(root + iv + 12)));
  }
  return { bass: [...bass], melody: [...melody] };
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private bodyFilter: BiquadFilterNode | null = null;

  private bass: Smplr | null = null;
  private chords: Smplr | null = null;
  private arp: Smplr | null = null;
  private drums: Smplr | null = null;

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
    this.master.gain.value = this.muted ? 0 : 0.45;
    this.master.connect(ctx.destination);

    // Everything in the loop passes through a bus whose brightness tracks
    // heat, so the mix itself "opens up" as the player wrecks more blocks.
    this.musicBus = ctx.createGain();
    this.bodyFilter = ctx.createBiquadFilter();
    this.bodyFilter.type = 'lowpass';
    this.bodyFilter.frequency.value = 900;
    this.musicBus.connect(this.bodyFilter);
    this.bodyFilter.connect(this.master);

    const reverb = Reverb(ctx);
    const { bass: bassNotes, melody: melodyNotes } = collectNotes();

    this.bass = Soundfont(ctx, {
      instrument: 'acoustic_bass',
      kit: 'FluidR3_GM',
      destination: this.musicBus,
      notesToLoad: { notes: bassNotes },
    });
    this.chords = Soundfont(ctx, {
      instrument: 'vibraphone',
      kit: 'FluidR3_GM',
      destination: this.musicBus,
      notesToLoad: { notes: melodyNotes },
    });
    this.arp = Soundfont(ctx, {
      instrument: 'kalimba',
      kit: 'FluidR3_GM',
      destination: this.musicBus,
      notesToLoad: { notes: melodyNotes },
    });
    this.drums = DrumMachine(ctx, { instrument: 'TR-808', destination: this.musicBus });

    // Sample loading can fail (offline, a blocked CDN, a flaky connection)
    // — that should mean silence, never an unhandled rejection crashing
    // anything else on the page.
    [this.bass, this.chords, this.arp, this.drums].forEach((inst) => inst.ready.catch(() => {}));

    this.bass.output.addEffect('reverb', reverb, 0.08);
    this.chords.output.addEffect('reverb', reverb, 0.3);
    this.arp.output.addEffect('reverb', reverb, 0.24);

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
    if (this.master) this.master.gain.value = muted ? 0 : 0.45;
  }

  // Block breaks only feed the music's intensity — no separate "hit" sound.
  onBreak(level: number) {
    this.heat = Math.min(1, this.heat + 0.1 + level * 0.03);
  }

  private tick() {
    const ctx = this.ctx;
    if (!ctx || !this.running) return;

    const now = ctx.currentTime;
    const dt = Math.max(0, now - this.lastTickAt);
    this.lastTickAt = now;
    this.heat = Math.max(0, this.heat - dt * 0.05);
    this.bodyFilter?.frequency.setTargetAtTime(900 + this.heat * 2800, now, 0.2);

    while (this.nextNoteTime < now + this.scheduleAheadSec) {
      this.playBeat(this.beatIndex, this.nextNoteTime);
      const bpm = 84 + this.heat * 46;
      this.nextNoteTime += 60 / bpm;
      this.beatIndex = (this.beatIndex + 1) % (BEATS_PER_BAR * 2);
    }
  }

  private playBeat(beatIndex: number, time: number) {
    const posInBar = beatIndex % BEATS_PER_BAR;
    if (posInBar === 0) this.bar = (this.bar + 1) % CHORD_ROOTS.length;
    const chordRoot = CHORD_ROOTS[this.bar];

    // A sample instrument can throw synchronously (e.g. mid-failed-load
    // edge cases) — never let that kill the scheduler's setInterval tick.
    try {
      if (posInBar === 0 || posInBar === 2) {
        const note = midi(chordRoot + (posInBar === 0 ? 0 : 7) - 12);
        this.bass?.start({ note, time, duration: 0.45, velocity: 88 });
      }

      if (this.heat > 0.25 && posInBar === 0) {
        [0, 3, 7].forEach((iv) => {
          this.chords?.start({ note: midi(chordRoot + iv + 12), time, duration: 1.3, velocity: 62 });
        });
      }

      if (this.heat > 0.55) {
        this.drums?.start({ note: 'hihat', time, velocity: posInBar % 2 === 1 ? 70 : 42 });
        if (posInBar === 0 || posInBar === 2) this.drums?.start({ note: 'kick', time, velocity: 95 });
      }

      if (this.heat > 0.72) {
        const interval = ARP_INTERVALS[beatIndex % ARP_INTERVALS.length];
        this.arp?.start({ note: midi(chordRoot + interval + 12), time, duration: 0.35, velocity: 68 });
      }
    } catch {
      // Swallow — a missed note is inaudible, a dead scheduler is not.
    }
  }
}
