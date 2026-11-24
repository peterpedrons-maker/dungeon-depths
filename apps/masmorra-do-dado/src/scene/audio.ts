// Som do jogo com GRAVAÇÕES REAIS (nada sintetizado): efeitos de pacotes livres (CC0) e
// instrumentos reais (violoncelo, cordas, coro, harpa, celesta, flauta, tímpano, sinos...)
// do soundfont FluidR3_GM. A música é composta em tempo real, tocando essas notas
// gravadas; uma só pra o jogo todo. Créditos em public/audio/CREDITS.txt.
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
  | 'fanfare'
  | 'uiblip'
  | 'uiflip'
  | 'uiopen'
  | 'uiclose'
  | 'uinew';

// 0 = tudo ligado, 1 = só efeitos, 2 = mudo
export type AudioMode = 0 | 1 | 2;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

// Muda quando qualquer arquivo de áudio é trocado: força o navegador/PWA a baixar de novo
const AUDIO_VERSION = 4;

const SFX_FILES = [
  'step_stone', 'step_rug', 'step_plate', 'step_water', 'land', 'throw1', 'throw2', 'recall', 'catch', 'put1', 'put2',
  'bounce1', 'bounce2', 'bounce3', 'bounce4', 'roll', 'locked', 'swap1', 'swap2', 'sweep', 'chalk1', 'chalk2',
  'erase', 'ignite', 'plate1', 'plate2', 'gem1', 'gem2', 'bell', 'gong', 'door1', 'door2', 'doorclose1',
  'doorclose2', 'error', 'burnout', 'fire',
];
const INSTRUMENTS = ['cello', 'string_ensemble_1', 'choir_aahs', 'orchestral_harp', 'celesta', 'glockenspiel', 'flute', 'timpani', 'tubular_bells'];

// notas (MIDI) das faces 1–6 no glockenspiel: pentatônica de lá menor
const FACE_MIDI = [76, 79, 81, 84, 86, 88];

// Lá menor → Fá → Ré menor → Mi: cada acorde dura 16 s
interface Chord {
  root: number; // baixo (violoncelo)
  pad: number[]; // acorde das cordas/coro
  scale: number[]; // notas da harpa / celesta / flauta
}
const PROG: Chord[] = [
  { root: 45, pad: [57, 60, 64], scale: [57, 60, 62, 64, 67, 69, 72, 74, 76] },
  { root: 41, pad: [53, 57, 60], scale: [57, 60, 62, 65, 67, 69, 72, 74, 77] },
  { root: 38, pad: [50, 53, 57], scale: [57, 59, 62, 65, 67, 69, 71, 74, 77] },
  { root: 40, pad: [52, 56, 59], scale: [56, 59, 62, 64, 68, 71, 74, 76, 80] },
];
const CHORD_LEN = 16;

interface Inst {
  notes: number[];
  bufs: Map<number, AudioBuffer>;
}

export class Sfx {
  private ac: AudioContext | null = null;
  private master!: GainNode;
  private bus!: GainNode;
  private musicBus!: GainNode;
  private verbSend!: GainNode;
  private echoSend!: GainNode;
  private mode: AudioMode = 0;
  private buf = new Map<string, AudioBuffer>();
  private inst: Record<string, Inst> = {};
  // laços contínuos
  private rollSrc: AudioBufferSourceNode | null = null;
  private rollG: GainNode | null = null;
  private fireG: GainNode | null = null;
  private fireTarget = 0;
  private fireLevel = 0;
  // giz
  private scratchNext = 0;
  private scratchNode: GainNode | null = null;
  private lastBounce = 0;
  // música
  private chordAt = 0;
  private chordIdx = 0;
  private nextHarp = 0;
  private nextCelesta = 0;
  private nextFlute = 0;
  private nextTimpani = 0;
  played = 0; // só pra testes
  steps = 0;
  private loaded = 0;
  get state() {
    return this.ac ? this.ac.state : 'sem-contexto';
  }
  get ready() {
    return this.loaded;
  }

  setMode(m: AudioMode) {
    this.mode = m;
    this.applyMode();
  }

  private applyMode() {
    if (!this.ac) return;
    const t = this.ac.currentTime;
    this.master.gain.setTargetAtTime(this.mode === 2 ? 0 : 1, t, 0.05);
    this.musicBus.gain.setTargetAtTime(this.mode === 0 ? 0.2 : 0, t, 0.4);
  }

  // cria o contexto de áudio (precisa de um gesto do usuário) e começa a baixar as gravações
  unlock() {
    if (!this.ac) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ac = new AC();
      this.ac = ac;
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 3;
      this.master = ac.createGain();
      this.master.connect(comp).connect(ac.destination);
      this.bus = ac.createGain();
      this.bus.gain.value = 0.85;
      this.bus.connect(this.master);
      this.musicBus = ac.createGain();
      this.musicBus.gain.value = 0;
      this.musicBus.connect(this.master);

      // reverb de sala (só processamento: o som continua sendo o das gravações)
      const len = Math.floor(ac.sampleRate * 3.2);
      const ir = ac.createBuffer(2, len, ac.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = ir.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
      }
      const conv = ac.createConvolver();
      conv.buffer = ir;
      this.verbSend = ac.createGain();
      this.verbSend.gain.value = 1;
      const verbRet = ac.createGain();
      verbRet.gain.value = 0.55;
      this.verbSend.connect(conv).connect(verbRet).connect(this.master);
      // eco (celesta e harpa)
      const delay = ac.createDelay(1.5);
      delay.delayTime.value = 0.52;
      const fb = ac.createGain();
      fb.gain.value = 0.34;
      this.echoSend = ac.createGain();
      this.echoSend.gain.value = 1;
      this.echoSend.connect(delay);
      delay.connect(fb).connect(delay);
      delay.connect(this.musicBus);
      delay.connect(this.verbSend);

      this.chordAt = ac.currentTime + 0.5;
      const t0 = ac.currentTime;
      this.nextHarp = t0 + 4;
      this.nextCelesta = t0 + 9;
      this.nextFlute = t0 + 20;
      this.nextTimpani = t0 + 45;
      this.applyMode();
      void this.loadAll();
    }
    if (this.ac.state !== 'running') void this.ac.resume();
  }

  suspend(on: boolean) {
    if (!this.ac) return;
    if (on) void this.ac.suspend();
    else void this.ac.resume();
  }

  // ── carregamento das gravações ──────────────────────────────────────────
  private async decode(url: string): Promise<AudioBuffer | null> {
    try {
      const r = await fetch(url);
      if (!r.ok) return null;
      return await this.ac!.decodeAudioData(await r.arrayBuffer());
    } catch {
      return null;
    }
  }

  private async loadAll() {
    const base = `${import.meta.env.BASE_URL}audio/`;
    // efeitos primeiro (são pequenos), depois os instrumentos da música
    await Promise.all(
      SFX_FILES.map(async (n) => {
        const b = await this.decode(`${base}sfx/${n}.mp3?v=${AUDIO_VERSION}`);
        if (b) this.buf.set(n, b);
        this.loaded++;
      }),
    );
    this.startLoops();
    try {
      const man = (await (await fetch(`${base}inst/manifest.json`)).json()) as Record<string, number[]>;
      for (const name of INSTRUMENTS) {
        const notes = man[name] ?? [];
        const inst: Inst = { notes, bufs: new Map() };
        this.inst[name] = inst;
        await Promise.all(
          notes.map(async (m) => {
            const b = await this.decode(`${base}inst/${name}/${m}.mp3?v=${AUDIO_VERSION}`);
            if (b) inst.bufs.set(m, b);
          }),
        );
        this.loaded++;
      }
    } catch {
      /* sem instrumentos: só os efeitos tocam */
    }
  }

  private startLoops() {
    const ac = this.ac!;
    const loop = (name: string, bus: AudioNode) => {
      const b = this.buf.get(name);
      if (!b) return null;
      const s = ac.createBufferSource();
      s.buffer = b;
      s.loop = true;
      const g = ac.createGain();
      g.gain.value = 0;
      s.connect(g).connect(bus);
      s.start(0, Math.random() * b.duration);
      return { s, g };
    };
    const r = loop('roll', this.bus);
    if (r) {
      this.rollSrc = r.s;
      this.rollG = r.g;
    }
    const f = loop('fire', this.bus);
    if (f) {
      this.fireG = f.g;
    }
  }

  // ── tocar gravações ─────────────────────────────────────────────────────
  private sample(name: string, vol = 1, rate = 1, delay = 0, verb = 0, pan = 0) {
    const ac = this.ac;
    const b = this.buf.get(name);
    if (!ac || !b) return;
    const s = ac.createBufferSource();
    s.buffer = b;
    s.playbackRate.value = rate;
    const g = ac.createGain();
    g.gain.value = vol;
    let node: AudioNode = g;
    s.connect(g);
    if (pan !== 0 && ac.createStereoPanner) {
      const p = ac.createStereoPanner();
      p.pan.value = pan;
      g.connect(p);
      node = p;
    }
    node.connect(this.bus);
    if (verb > 0) {
      const v = ac.createGain();
      v.gain.value = verb;
      node.connect(v).connect(this.verbSend);
    }
    s.start(ac.currentTime + delay);
  }

  // uma nota de instrumento real: usa a gravação mais próxima e ajusta a altura (rate)
  private note(instName: string, midi: number, t: number, vol: number, opts: { fadeIn?: number; hold?: number; fadeOut?: number; verb?: number; echo?: number; pan?: number; toMusic?: boolean } = {}) {
    const ac = this.ac;
    const inst = this.inst[instName];
    if (!ac || !inst || inst.bufs.size === 0) return;
    let best = inst.notes[0];
    for (const n of inst.notes) if (inst.bufs.has(n) && Math.abs(n - midi) < Math.abs(best - midi)) best = n;
    const b = inst.bufs.get(best);
    if (!b) return;
    const s = ac.createBufferSource();
    s.buffer = b;
    s.playbackRate.value = Math.pow(2, (midi - best) / 12);
    const g = ac.createGain();
    const fi = opts.fadeIn ?? 0.01;
    const hold = opts.hold ?? b.duration / s.playbackRate.value - fi - (opts.fadeOut ?? 0.3);
    const fo = opts.fadeOut ?? 0.3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + fi);
    g.gain.setValueAtTime(vol, t + fi + Math.max(0, hold));
    g.gain.linearRampToValueAtTime(0.0001, t + fi + Math.max(0, hold) + fo);
    let node: AudioNode = g;
    s.connect(g);
    if (opts.pan && ac.createStereoPanner) {
      const p = ac.createStereoPanner();
      p.pan.value = opts.pan;
      g.connect(p);
      node = p;
    }
    node.connect(opts.toMusic === false ? this.bus : this.musicBus);
    if (opts.verb) {
      const v = ac.createGain();
      v.gain.value = opts.verb;
      node.connect(v).connect(this.verbSend);
    }
    if (opts.echo) {
      const e = ac.createGain();
      e.gain.value = opts.echo;
      node.connect(e).connect(this.echoSend);
    }
    s.start(t);
    s.stop(t + fi + Math.max(0, hold) + fo + 0.05);
  }

  // nota de instrumento como EFEITO (sai pelo canal dos efeitos, mesmo com a música desligada)
  private fxNote(inst: string, midi: number, vol: number, delay = 0, verb = 0.5, echo = 0) {
    if (!this.ac) return;
    this.note(inst, midi, this.ac.currentTime + delay, vol, { fadeIn: 0.005, fadeOut: 0.5, verb, echo, toMusic: false });
  }

  // ── efeitos ─────────────────────────────────────────────────────────────
  play(name: SfxName, v = 1) {
    if (!this.ac || this.mode === 2) return;
    this.played++;
    switch (name) {
      case 'throw':
        this.sample(pick(['throw1', 'throw2']), 0.9 * Math.min(1, 0.4 + v), rand(0.93, 1.07));
        break;
      case 'recall':
        this.sample('recall', 0.85, rand(0.95, 1.05));
        break;
      case 'catch':
        this.sample('catch', 0.9, rand(0.95, 1.05));
        this.fxNote('celesta', 88, 0.22, 0.04, 0.6, 0.2);
        break;
      case 'put':
        this.sample(pick(['put1', 'put2']), 0.9, rand(0.92, 1.05));
        break;
      case 'rest':
        this.sample(pick(['bounce1', 'bounce2', 'bounce3']), 0.7 * Math.min(1, v), rand(0.75, 0.9));
        break;
      case 'face':
        {
          const m = FACE_MIDI[Math.max(0, Math.min(5, Math.round(v) - 1))];
          this.fxNote('glockenspiel', m, 0.45, 0, 0.5, 0.15);
        }
        break;
      case 'locked':
        this.sample('locked', 0.7, rand(0.75, 0.85));
        break;
      // interface (conversa e diário): sons suaves, sempre com os instrumentos reais
      case 'uiblip':
        this.fxNote('celesta', 79 + (Math.round(v) % 5) * 2, 0.07, 0, 0.15, 0);
        break;
      case 'uiopen':
        this.sample('swap1', 0.45, rand(0.85, 0.95));
        this.fxNote('orchestral_harp', 67, 0.25, 0.05, 0.5, 0.2);
        break;
      case 'uiflip':
        this.sample('swap2', 0.32, rand(1.15, 1.35));
        break;
      case 'uiclose':
        this.sample('swap2', 0.4, rand(0.8, 0.9));
        break;
      case 'uinew':
        this.fxNote('glockenspiel', 88, 0.3, 0, 0.6, 0.25);
        this.fxNote('glockenspiel', 95, 0.26, 0.11, 0.6, 0.25);
        break;
      case 'swap':
        this.sample(pick(['swap1', 'swap2']), 0.7, rand(0.95, 1.05));
        break;
      case 'sweep':
        this.sample('sweep', 0.8, 1);
        break;
      case 'ignite':
        this.sample('ignite', 1, rand(0.9, 1), 0, 0.3);
        this.fxNote('timpani', 36, 0.35, 0.02, 0.6);
        break;
      case 'plate':
        this.sample('plate1', 1, 0.85);
        this.sample('plate2', 0.7, 0.9, 0.03);
        this.fxNote('timpani', 36, 0.3, 0, 0.5);
        break;
      case 'gem':
        this.sample('gem1', 0.7, 1.1, 0, 0.5);
        this.sample('gem2', 0.5, 1, 0.05, 0.5);
        [84, 88, 91, 96].forEach((m, i) => this.fxNote('celesta', m, 0.4, 0.08 + i * 0.12, 0.7, 0.3));
        break;
      case 'door':
        this.sample('door1', 1, 0.92, 0, 0.3);
        this.sample('door2', 0.7, 0.9, 0.55, 0.2);
        this.fxNote('cello', 36, 0.45, 0.1, 0.8);
        break;
      case 'doorClose':
        this.sample('doorclose2', 0.6, 0.9);
        this.sample('doorclose1', 0.9, 0.85, 0.55, 0.2);
        break;
      case 'piece':
        this.fxNote('celesta', 79, 0.45, 0, 0.7, 0.3);
        this.fxNote('celesta', 91, 0.4, 0.12, 0.7, 0.3);
        this.sample('bell', 0.25, 1.2, 0.05, 0.7);
        break;
      case 'error':
        this.sample('error', 0.8, 0.8);
        break;
      case 'burnout':
        this.sample('burnout', 0.7, 1);
        break;
      case 'land':
        this.sample('land', 0.8 * Math.min(1, v + 0.25), rand(0.85, 1));
        break;
      case 'room':
        this.sample('gong', 0.6, 0.85, 0, 0.7);
        this.fxNote('cello', 45, 0.45, 0.15, 0.8);
        break;
      case 'fanfare':
        [60, 64, 67, 72, 76, 79].forEach((m, i) => this.fxNote('orchestral_harp', m, 0.5, i * 0.14, 0.6));
        [72, 76, 79, 84].forEach((m, i) => this.fxNote('tubular_bells', m, 0.35, 0.3 + i * 0.3, 0.9));
        break;
    }
  }

  // passo: SEMPRE a mesma gravação pra cada tipo de piso (pedra, tapete, placa, poça), só que abafada:
  // o corte nos agudos tira o "toque-toque" de bota, mais grave e mais baixo, como sapato em pedra
  step(surface: 'stone' | 'rug' | 'plate' | 'water') {
    const ac = this.ac;
    if (!ac || this.mode === 2) return;
    this.steps++;
    const b = this.buf.get(`step_${surface}`);
    if (!b) return;
    const vol = { stone: 0.42, rug: 0.4, plate: 0.5, water: 0.42 }[surface];
    const rate = { stone: 0.8, rug: 0.86, plate: 0.84, water: 0.9 }[surface];
    const cut = { stone: 1100, rug: 700, plate: 950, water: 1250 }[surface];
    const verb = { stone: 0.1, rug: 0.02, plate: 0.1, water: 0.08 }[surface];
    const s = ac.createBufferSource();
    s.buffer = b;
    s.playbackRate.value = rate;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = cut;
    lp.Q.value = 0.5;
    const g = ac.createGain();
    g.gain.value = vol;
    s.connect(lp).connect(g);
    g.connect(this.bus);
    if (verb > 0) {
      const v = ac.createGain();
      v.gain.value = verb;
      g.connect(v).connect(this.verbSend);
    }
    s.start(ac.currentTime);
  }

  // batida do dado (impact em m/s)
  bounce(impact: number) {
    const ac = this.ac;
    if (!ac || this.mode === 2 || impact < 1.4) return;
    const now = ac.currentTime;
    if (now - this.lastBounce < 0.07) return;
    this.lastBounce = now;
    const k = Math.min(1, impact / 9);
    this.sample(pick(['bounce1', 'bounce2', 'bounce3', 'bounce4']), 0.2 + 0.8 * k, rand(0.85, 1.15) * (1.1 - 0.25 * k), 0, 0.15);
  }

  // dado rolando (0..1): gravação de uma bola rolando, mais rápida quando o dado corre
  roll(level: number) {
    if (!this.ac || !this.rollG || !this.rollSrc) return;
    const t = this.ac.currentTime;
    this.rollG.gain.setTargetAtTime(this.mode === 2 ? 0 : level * 0.55, t, 0.06);
    this.rollSrc.playbackRate.setTargetAtTime(0.7 + level * 0.7, t, 0.1);
  }

  // giz riscando / borracha (0..1): gravações de giz na pedra e de borracha, repetidas enquanto você arrasta
  scratch(level: number, erase: boolean) {
    const ac = this.ac;
    if (!ac || this.mode === 2) return;
    const now = ac.currentTime;
    if (level > 0.5) {
      if (now >= this.scratchNext) {
        const name = erase ? 'erase' : pick(['chalk1', 'chalk2']);
        const b = this.buf.get(name);
        if (!b) return;
        const s = ac.createBufferSource();
        s.buffer = b;
        s.playbackRate.value = rand(0.92, 1.1);
        const g = ac.createGain();
        g.gain.value = erase ? 0.7 : 0.85;
        s.connect(g).connect(this.bus);
        s.start();
        this.scratchNode?.gain.setTargetAtTime(0.0001, now, 0.04);
        this.scratchNode = g;
        this.scratchNext = now + (erase ? 0.5 : 0.3);
      }
    } else if (this.scratchNode) {
      this.scratchNode.gain.setTargetAtTime(0.0001, now, 0.05); // parou de arrastar: a gravação some rápido
      this.scratchNode = null;
      this.scratchNext = 0;
    }
  }

  // intensidade do fogo por perto (0..1): volume da gravação de uma lareira estalando
  fire(level: number) {
    this.fireTarget = Math.min(1, level);
  }

  // chamar todo quadro
  tick(dt: number) {
    const ac = this.ac;
    if (!ac) return;
    const now = ac.currentTime;
    this.fireLevel += (this.fireTarget - this.fireLevel) * Math.min(1, dt * 3);
    if (this.fireG) this.fireG.gain.setTargetAtTime(this.mode === 2 ? 0 : this.fireLevel * 0.7, now, 0.1);
    if (this.mode !== 0 || !this.inst.cello || this.inst.cello.bufs.size === 0) return;

    // ── música: acordes de baixo + cordas + coro, harpa, celesta, flauta e tímpano ──
    while (this.chordAt < now + 2) {
      this.scheduleChord(PROG[this.chordIdx % PROG.length], this.chordAt, this.chordIdx);
      this.chordAt += CHORD_LEN;
      this.chordIdx++;
    }
    const ch = PROG[(this.chordIdx - 1 + PROG.length) % PROG.length];
    while (this.nextHarp < now + 0.5) {
      this.harpPhrase(ch, Math.max(now, this.nextHarp));
      this.nextHarp += rand(5, 9);
    }
    while (this.nextCelesta < now + 0.5) {
      const m = pick(ch.scale) + 24;
      this.note('celesta', m, Math.max(now, this.nextCelesta), 0.3, { fadeIn: 0.005, fadeOut: 0.6, verb: 0.8, echo: 0.55, pan: rand(-0.5, 0.5) });
      this.nextCelesta += rand(7, 14);
    }
    while (this.nextFlute < now + 0.5) {
      this.flutePhrase(ch, Math.max(now, this.nextFlute));
      this.nextFlute += rand(24, 40);
    }
    while (this.nextTimpani < now + 0.5) {
      this.note('timpani', pick([33, 36, 38]), Math.max(now, this.nextTimpani), 0.28, { fadeIn: 0.005, fadeOut: 0.8, verb: 0.9 });
      this.nextTimpani += rand(40, 70);
    }
  }

  private scheduleChord(c: Chord, t: number, idx: number) {
    // baixo: violoncelo, nota longa renovada a cada ~2,7 s (a gravação dura ~3 s)
    for (let k = 0; t + k * 2.7 < t + CHORD_LEN; k++) {
      this.note('cello', c.root, t + k * 2.7, 0.85, { fadeIn: 0.5, fadeOut: 0.7, verb: 0.5 });
      if (k % 2 === 0) this.note('cello', c.root + 7, t + k * 2.7 + 0.2, 0.4, { fadeIn: 0.7, fadeOut: 0.8, verb: 0.5 });
    }
    // colchão: cordas num acorde, coro no seguinte (entradas escalonadas, bem suaves)
    const pad = idx % 2 === 0 ? 'string_ensemble_1' : 'choir_aahs';
    c.pad.forEach((m, i) => {
      for (let k = 0; t + i * 0.7 + k * 2.6 < t + CHORD_LEN + 1.5; k++) {
        this.note(pad, m, t + i * 0.7 + k * 2.6, 0.5, { fadeIn: 1.1, fadeOut: 1.3, verb: 0.8, pan: (i - 1) * 0.35 });
      }
    });
  }

  private harpPhrase(c: Chord, t: number) {
    const n = 4 + Math.floor(Math.random() * 3);
    let idx = Math.floor(Math.random() * 4);
    const up = Math.random() < 0.6;
    const pan = rand(-0.5, 0.5);
    for (let i = 0; i < n; i++) {
      idx = Math.max(0, Math.min(c.scale.length - 1, idx + (up ? 1 : -1) * (Math.random() < 0.7 ? 1 : 2)));
      this.note('orchestral_harp', c.scale[idx], t + i * rand(0.7, 1.2), 0.5, { fadeIn: 0.004, fadeOut: 0.8, verb: 0.7, echo: 0.3, pan });
    }
  }

  private flutePhrase(c: Chord, t: number) {
    const n = 3 + Math.floor(Math.random() * 2);
    let at = t;
    let idx = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      idx = Math.max(0, Math.min(c.scale.length - 1, idx + pick([-2, -1, 1, 2])));
      this.note('flute', c.scale[idx] + 12, at, 0.38, { fadeIn: 0.25, fadeOut: 0.9, verb: 0.9, echo: 0.3 });
      at += rand(1.6, 2.6);
    }
  }
}
