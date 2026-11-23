// Som 100% sintetizado (Web Audio): nada de arquivos. Efeitos reagem ao que acontece e a
// música ambiente é uma só pro jogo inteiro (acordes lentos + notas esparsas com eco).
// O navegador só libera áudio depois de um toque/tecla: unlock() cria tudo nesse momento.

export type SfxName =
  | 'throw'
  | 'catch'
  | 'recall'
  | 'put'
  | 'rest'
  | 'face'
  | 'locked'
  | 'swap'
  | 'sweep'
  | 'ignite'
  | 'plate'
  | 'gem'
  | 'door'
  | 'doorClose'
  | 'piece'
  | 'error'
  | 'burnout'
  | 'land'
  | 'room'
  | 'fanfare';

// 0 = tudo ligado, 1 = só efeitos, 2 = mudo
export type AudioMode = 0 | 1 | 2;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const FACE_NOTES = [329.63, 392, 440, 523.25, 587.33, 659.25]; // pentatônica
// Lá menor → Fá → Ré menor → Mi (com 4ª suspensa): cada acorde dura ~10 s
const CHORDS: number[][] = [
  [110, 164.81, 220, 261.63, 329.63],
  [87.31, 130.81, 174.61, 220, 261.63],
  [73.42, 110, 146.83, 174.61, 220],
  [82.41, 123.47, 164.81, 220, 246.94],
];
const ARP_NOTES = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880];

export class Sfx {
  private ac: AudioContext | null = null;
  private master!: GainNode;
  private bus!: GainNode;
  private musicBus!: GainNode;
  private arpBus!: GainNode;
  private verbSend!: GainNode;
  private noise!: AudioBuffer;
  private mode: AudioMode = 0;
  private rollG!: GainNode;
  private scratchG!: GainNode;
  private scratchF!: BiquadFilterNode;
  private fireLevel = 0;
  private fireTarget = 0;
  private nextPop = 0;
  private lastBounce = 0;
  private stepSide = 0;
  private chordAt = 0;
  private chordIdx = 0;
  private nextNote = 0;
  played = 0; // só pra testes
  get state() {
    return this.ac ? this.ac.state : 'sem-contexto';
  }

  setMode(m: AudioMode) {
    this.mode = m;
    this.applyMode();
  }

  private applyMode() {
    if (!this.ac) return;
    const t = this.ac.currentTime;
    this.master.gain.setTargetAtTime(this.mode === 2 ? 0 : 1, t, 0.05);
    this.musicBus.gain.setTargetAtTime(this.mode === 0 ? 0.32 : 0, t, 0.3);
  }

  // cria o contexto de áudio (precisa de um gesto do usuário)
  unlock() {
    if (!this.ac) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ac = new AC();
      this.ac = ac;
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 4;
      this.master = ac.createGain();
      this.master.connect(comp).connect(ac.destination);
      this.bus = ac.createGain();
      this.bus.gain.value = 1.0;
      this.bus.connect(this.master);
      this.musicBus = ac.createGain();
      this.musicBus.gain.value = 0;
      this.musicBus.connect(this.master);

      // reverb sintético (ruído que decai)
      const len = Math.floor(ac.sampleRate * 2.6);
      const ir = ac.createBuffer(2, len, ac.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = ir.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
      }
      const conv = ac.createConvolver();
      conv.buffer = ir;
      this.verbSend = ac.createGain();
      this.verbSend.gain.value = 0.5;
      const verbRet = ac.createGain();
      verbRet.gain.value = 0.7;
      this.verbSend.connect(conv).connect(verbRet).connect(this.master);

      // eco das notas soltas
      this.arpBus = ac.createGain();
      this.arpBus.gain.value = 0.9;
      const delay = ac.createDelay(1);
      delay.delayTime.value = 0.46;
      const fb = ac.createGain();
      fb.gain.value = 0.36;
      this.arpBus.connect(this.musicBus);
      this.arpBus.connect(delay);
      delay.connect(fb).connect(delay);
      delay.connect(this.musicBus);
      this.arpBus.connect(this.verbSend);

      // ruído branco compartilhado
      this.noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const nd = this.noise.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

      // laços contínuos: rolar do dado e giz riscando
      const loop = () => {
        const s = ac.createBufferSource();
        s.buffer = this.noise;
        s.loop = true;
        s.start();
        return s;
      };
      const roll = ac.createBiquadFilter();
      roll.type = 'lowpass';
      roll.frequency.value = 340;
      this.rollG = ac.createGain();
      this.rollG.gain.value = 0;
      loop().connect(roll).connect(this.rollG).connect(this.bus);
      this.scratchF = ac.createBiquadFilter();
      this.scratchF.type = 'bandpass';
      this.scratchF.frequency.value = 4200;
      this.scratchF.Q.value = 0.9;
      this.scratchG = ac.createGain();
      this.scratchG.gain.value = 0;
      loop().connect(this.scratchF).connect(this.scratchG).connect(this.bus);

      this.chordAt = ac.currentTime + 0.4;
      this.nextNote = ac.currentTime + 3;
      this.applyMode();
    }
    if (this.ac.state !== 'running') void this.ac.resume();
  }

  suspend(on: boolean) {
    if (!this.ac) return;
    if (on) void this.ac.suspend();
    else void this.ac.resume();
  }

  // ── blocos de síntese ───────────────────────────────────────────────────
  private tone(f: number, dur: number, type: OscillatorType, vol: number, f2 = 0, delay = 0, verb = 0, attack = 0.006) {
    const ac = this.ac;
    if (!ac) return;
    const t = ac.currentTime + delay;
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.bus);
    if (verb > 0) {
      const s = ac.createGain();
      s.gain.value = verb;
      g.connect(s).connect(this.verbSend);
    }
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private burst(dur: number, type: BiquadFilterType, f: number, q: number, vol: number, f2 = 0, delay = 0, verb = 0, attack = 0.004) {
    const ac = this.ac;
    if (!ac) return;
    const t = ac.currentTime + delay;
    const src = ac.createBufferSource();
    src.buffer = this.noise;
    const flt = ac.createBiquadFilter();
    flt.type = type;
    flt.Q.value = q;
    flt.frequency.setValueAtTime(f, t);
    if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt).connect(g).connect(this.bus);
    if (verb > 0) {
      const s = ac.createGain();
      s.gain.value = verb;
      g.connect(s).connect(this.verbSend);
    }
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.05);
  }

  // ── efeitos ─────────────────────────────────────────────────────────────
  play(name: SfxName, v = 1) {
    if (!this.ac || this.mode === 2) return;
    this.played++;
    switch (name) {
      case 'throw':
        this.burst(0.28, 'bandpass', 500, 1.2, 0.5, 2000);
        this.tone(160, 0.12, 'triangle', 0.18, 90);
        break;
      case 'recall':
        this.burst(0.34, 'bandpass', 2200, 1.4, 0.4, 450);
        break;
      case 'catch':
        this.tone(660, 0.18, 'triangle', 0.22, 0, 0, 0.5);
        this.tone(990, 0.28, 'sine', 0.16, 0, 0.05, 0.6);
        this.burst(0.06, 'highpass', 2500, 0.7, 0.2);
        break;
      case 'put':
        this.tone(120, 0.14, 'sine', 0.4, 70);
        this.burst(0.06, 'lowpass', 900, 0.8, 0.35);
        break;
      case 'rest':
        this.tone(95, 0.16, 'sine', 0.34 * v, 60);
        this.burst(0.05, 'lowpass', 1200, 0.8, 0.22);
        break;
      case 'face':
        {
          const f = FACE_NOTES[Math.max(0, Math.min(5, Math.round(v) - 1))];
          this.tone(f, 0.22, 'triangle', 0.22, 0, 0, 0.4);
          this.tone(f * 2, 0.16, 'sine', 0.08, 0, 0.02, 0.4);
          this.burst(0.03, 'highpass', 3500, 0.7, 0.12);
        }
        break;
      case 'locked':
        this.tone(110, 0.18, 'square', 0.12, 80);
        this.tone(104, 0.18, 'square', 0.08, 76);
        break;
      case 'swap':
        this.burst(0.1, 'highpass', 2200, 0.6, 0.25);
        this.burst(0.09, 'highpass', 2800, 0.6, 0.2, 0, 0.09);
        this.tone(280, 0.06, 'triangle', 0.06, 0, 0.02);
        break;
      case 'sweep':
        this.burst(0.5, 'bandpass', 3500, 0.9, 0.3, 700);
        break;
      case 'ignite':
        this.burst(0.7, 'lowpass', 250, 0.8, 0.7, 2600, 0, 0.3, 0.04);
        this.tone(70, 0.6, 'sine', 0.45, 40, 0, 0.2);
        this.burst(0.3, 'highpass', 3000, 0.7, 0.18, 0, 0.1);
        break;
      case 'plate':
        this.tone(55, 0.5, 'sine', 0.55, 38);
        this.burst(0.14, 'lowpass', 700, 0.9, 0.5);
        this.tone(210, 0.05, 'square', 0.12, 150, 0.02);
        this.burst(0.12, 'bandpass', 1400, 2, 0.18, 0, 0.04);
        break;
      case 'gem':
        for (const [f, d] of [[1046.5, 0], [1568, 0.09], [2093, 0.18]] as [number, number][]) this.tone(f, 1.2, 'sine', 0.2, 0, d, 0.9);
        this.burst(0.25, 'highpass', 6000, 0.7, 0.06, 0, 0.05);
        break;
      case 'piece':
        this.tone(659.25, 0.5, 'triangle', 0.22, 0, 0, 0.7);
        this.tone(987.77, 0.8, 'sine', 0.18, 0, 0.1, 0.8);
        break;
      case 'door':
        // pedra pesada arrastando
        this.burst(2.4, 'lowpass', 140, 0.9, 0.8, 90, 0, 0.1, 0.15);
        this.burst(2.2, 'bandpass', 700, 2.5, 0.12, 420, 0.1);
        this.tone(48, 2.4, 'sawtooth', 0.12, 36, 0, 0, 0.3);
        this.tone(60, 0.5, 'sine', 0.5, 36, 2.3);
        break;
      case 'doorClose':
        this.burst(1.2, 'lowpass', 120, 0.9, 0.8, 70, 0, 0.1, 0.05);
        this.tone(50, 0.4, 'sine', 0.6, 32, 1.0);
        this.burst(0.15, 'lowpass', 600, 0.9, 0.4, 0, 1.0);
        break;
      case 'error':
        this.tone(150, 0.22, 'sawtooth', 0.1, 90);
        this.tone(142, 0.22, 'sawtooth', 0.08, 85);
        break;
      case 'burnout':
        this.burst(0.7, 'highpass', 3200, 0.7, 0.25, 1500);
        break;
      case 'land':
        this.tone(80, 0.18, 'sine', 0.5 * Math.min(1, v + 0.2), 45);
        this.burst(0.08, 'lowpass', 500, 0.8, 0.3 * Math.min(1, v + 0.2));
        break;
      case 'room':
        this.tone(196, 2.4, 'sine', 0.2, 0, 0, 1.0, 0.05);
        this.tone(293.66, 2.0, 'sine', 0.12, 0, 0.04, 1.0, 0.05);
        break;
      case 'fanfare':
        for (const [f, d] of [[392, 0], [523.25, 0.18], [659.25, 0.36], [783.99, 0.54]] as [number, number][]) this.tone(f, 1.8, 'triangle', 0.2, 0, d, 0.9);
        break;
    }
  }

  // passo (speed 0..1)
  step(speed: number) {
    if (!this.ac || this.mode === 2) return;
    this.stepSide ^= 1;
    const k = 0.55 + 0.45 * speed;
    this.tone(this.stepSide ? 92 : 78 + rand(-6, 6), 0.1, 'sine', 0.32 * k, 52);
    this.burst(0.07, 'lowpass', rand(500, 900), 0.8, 0.28 * k);
    this.burst(0.03, 'highpass', 2600, 0.6, 0.05 * k);
  }

  // batida do dado (impact em m/s)
  bounce(impact: number) {
    const ac = this.ac;
    if (!ac || this.mode === 2 || impact < 1.4) return;
    const now = ac.currentTime;
    if (now - this.lastBounce < 0.07) return;
    this.lastBounce = now;
    const k = Math.min(1, impact / 9);
    this.tone(rand(170, 220), 0.1, 'triangle', 0.1 + 0.3 * k, 90);
    this.burst(0.05, 'bandpass', rand(1400, 2200), 1.2, 0.08 + 0.3 * k);
  }

  // dado rolando (0..1)
  roll(level: number) {
    if (!this.ac) return;
    this.rollG.gain.setTargetAtTime(level * 0.35, this.ac.currentTime, 0.06);
  }

  // giz riscando / borracha (0..1)
  scratch(level: number, erase: boolean) {
    if (!this.ac) return;
    const t = this.ac.currentTime;
    this.scratchF.frequency.setTargetAtTime(erase ? 1800 : 4200 + Math.sin(t * 38) * 700, t, 0.02);
    this.scratchG.gain.setTargetAtTime(level * (erase ? 0.16 : 0.22) * (0.6 + 0.4 * Math.abs(Math.sin(t * 29))), t, 0.03);
  }

  // intensidade do fogo por perto (0..1)
  fire(level: number) {
    this.fireTarget = Math.min(1, level);
  }

  // chamar todo quadro
  tick(dt: number) {
    const ac = this.ac;
    if (!ac) return;
    const now = ac.currentTime;
    this.fireLevel += (this.fireTarget - this.fireLevel) * Math.min(1, dt * 3);
    // estalos do fogo
    if (this.mode !== 2 && this.fireLevel > 0.02) {
      while (this.nextPop < now + 0.05) {
        const pw = 0.04 + 0.2 * this.fireLevel * Math.random();
        const t = Math.max(now, this.nextPop);
        this.popAt(t, pw);
        this.nextPop = t + rand(0.03, 0.28) / (0.3 + this.fireLevel);
      }
    } else this.nextPop = now;
    if (this.mode !== 0) return;
    // música: acordes lentos
    while (this.chordAt < now + 2) {
      this.padChord(CHORDS[this.chordIdx % CHORDS.length], this.chordAt, 10.5);
      this.chordAt += 10;
      this.chordIdx++;
    }
    // notas soltas, com eco
    while (this.nextNote < now + 0.4) {
      const f = ARP_NOTES[Math.floor(Math.random() * ARP_NOTES.length)];
      this.pluck(f, Math.max(now, this.nextNote));
      this.nextNote += rand(1.6, 4.2);
    }
  }

  private popAt(t: number, vol: number) {
    const ac = this.ac!;
    const src = ac.createBufferSource();
    src.buffer = this.noise;
    const f = ac.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = rand(1500, 4500);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + rand(0.008, 0.03));
    src.connect(f).connect(g).connect(this.bus);
    src.start(t, Math.random() * 1.5);
    src.stop(t + 0.05);
  }

  private padChord(notes: number[], t: number, dur: number) {
    const ac = this.ac!;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 650;
    const lfo = ac.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoG = ac.createGain();
    lfoG.gain.value = 260;
    lfo.connect(lfoG).connect(lp.frequency);
    lfo.start(t);
    lfo.stop(t + dur + 4);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.3, t + 3.2);
    g.gain.setValueAtTime(0.3, t + dur - 1.5);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 3.5);
    lp.connect(g);
    g.connect(this.musicBus);
    const s = ac.createGain();
    s.gain.value = 0.7;
    g.connect(s).connect(this.verbSend);
    notes.forEach((f, i) => {
      for (const det of [-7, 7]) {
        const o = ac.createOscillator();
        o.type = i === 0 ? 'sine' : 'triangle';
        o.frequency.value = f;
        o.detune.value = det;
        const og = ac.createGain();
        og.gain.value = i === 0 ? 0.5 : 0.22;
        o.connect(og).connect(lp);
        o.start(t);
        o.stop(t + dur + 4);
      }
    });
  }

  private pluck(f: number, t: number) {
    const ac = this.ac!;
    const o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    o.connect(g).connect(this.arpBus);
    o.start(t);
    o.stop(t + 2.3);
  }
}
