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
  | 'uinew'
  | 'write'
  | 'shaftRumble'
  | 'shaftFall'
  | 'rise' // pilar subindo do chão
  | 'dark' // a Casa apaga tudo (o escuro): a chama sugada e um grave abafado
  // a cena da gema (DESIGN.md §69): ela vem e brilha; estala e vira pó; encaixa no furo do caderno; uma face do dado se completa
  | 'gemShine'
  | 'gemBreak'
  | 'gemSet'
  | 'gemFace'
  // o altar do Tribunal (DESIGN.md §77): a pedra racha; a pedra é empurrada e desce; o dado desliza para dentro; a pedra fecha; a luz lá dentro;
  // a pedra abre de novo
  | 'altarCrack'
  | 'altarPush'
  | 'altarSlide'
  | 'altarShut'
  | 'altarGlow'
  | 'altarOpen';

// 0 = tudo ligado, 1 = só efeitos, 2 = mudo
export type AudioMode = 0 | 1 | 2;

// o que soa sob os pés: o piso (Room.surfaceAt) ou, se o passo subiu/desceu, o degrau
export type StepKind = 'stone' | 'rug' | 'plate' | 'water' | 'rubble' | 'stair';

// como está o lugar onde o jogador está (o motor calcula a partir de Room.ambience; DESIGN.md §60)
export interface AmbientState {
  wind: number; // 0..1 vento aqui (cresce perto das aberturas)
  size: number; // 0 = cubículo abafado .. 1 = salão enorme (reverberação e o "ar" da sala)
  drip: number; // 0..1 gotas por perto (0 = nenhuma)
  dripPan: number; // -1..1 de que lado pinga
  calm: boolean; // sem conversa, sem cena, sem escuro: a Casa pode "respirar"
  paused: boolean; // menu de pausa: o ambiente baixa
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

// Muda quando qualquer arquivo de áudio é trocado: força o navegador/PWA a baixar de novo
const AUDIO_VERSION = 5;

const SFX_FILES = [
  'step_stone_l', 'step_stone_r', 'step_stair_l', 'step_stair_r', 'step_rubble_l', 'step_rubble_r', 'step_rug', 'step_plate', 'step_water',
  'land', 'throw1', 'throw2', 'recall', 'catch', 'put1', 'put2',
  'bounce1', 'bounce2', 'bounce3', 'bounce4', 'roll', 'locked', 'swap1', 'swap2', 'sweep', 'chalk1', 'chalk2',
  'erase', 'ignite', 'ignite_small', 'ignite_cloth', 'plate1', 'plate2', 'gem1', 'gem2', 'bell', 'gong', 'door_open', 'door_shut', 'rise',
  'doorclose1', 'error', 'burnout', 'fire', 'crackle', 'wind', 'gust', 'drip', 'boom', 'creak',
];
// as gotas do arquivo drip.mp3 (início em s; cada uma dura ~0,55 s)
const DRIPS = [0, 0.6, 1.2];
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
  // O contexto de áudio nasce LOGO AO ABRIR A PÁGINA (`prepare`), ainda suspenso: assim as gravações baixam e decodificam enquanto a tela da
  // editora, a tela inicial e a tela de carregamento estão à vista (DESIGN.md §78). Som só sai depois do 1º toque/tecla (`unlock`): até lá,
  // `ac` responde null e nada é agendado (senão tudo tocaria junto quando o som fosse liberado).
  private ctx: AudioContext | null = null;
  private live = false;
  private get ac(): AudioContext | null {
    return this.live ? this.ctx : null;
  }
  private master!: GainNode;
  private bus!: GainNode;
  private musicBus!: GainNode;
  private verbSend!: GainNode;
  private echoSend!: GainNode;
  // reverberação dos sons do MUNDO (passos, portas, fogo, gotas): mistura uma sala curta e a longa conforme o tamanho da sala
  private space!: GainNode;
  private shortRet!: GainNode;
  private longSend!: GainNode;
  private mode: AudioMode = 0;
  private buf = new Map<string, AudioBuffer>();
  private inst: Record<string, Inst> = {};
  // laços contínuos
  private rollSrc: AudioBufferSourceNode | null = null;
  private rollG: GainNode | null = null;
  private fireG: GainNode | null = null;
  private fireLP: BiquadFilterNode | null = null;
  private firePanN: StereoPannerNode | null = null;
  private fireTarget = 0;
  private fireLevel = 0;
  private firePan = 0;
  private nextCrackle = 0;
  // ambiente: o vento (perto das aberturas), o "ar" da sala (o mesmo vento, bem grave e baixo), gotas, rajadas e a Casa respirando
  private windG: GainNode | null = null;
  private windLP: BiquadFilterNode | null = null;
  private toneG: GainNode | null = null;
  private amb: AmbientState = { wind: 0, size: 0.4, drip: 0, dripPan: 0, calm: false, paused: false };
  private windLevel = 0;
  private sizeLevel = 0.4;
  private nextGust = 0;
  private nextDrip = 0;
  private nextBreath = 0;
  private breathKind = 0;
  private paramAt = 0;
  private foot = 0; // pé esquerdo / direito (alternam sempre na mesma ordem)
  private duckUntil = 0; // até quando o ambiente fica mais baixo (uma porta, um erro)
  private lastStep = 0;
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
  log: string[] = []; // (testes, só em desenvolvimento) as últimas gravações que tocaram
  logN = 0; // quantas já tocaram (testes)
  private dbg(n: string) {
    if (!import.meta.env.DEV) return;
    this.logN++;
    this.log.push(n);
    if (this.log.length > 60) this.log.shift();
  }
  // (testes) o ambiente como o motor de som o vê agora
  debug() {
    return { wind: +this.windLevel.toFixed(2), size: +this.sizeLevel.toFixed(2), fire: +this.fireLevel.toFixed(2), firePan: +this.firePan.toFixed(2), drip: +this.amb.drip.toFixed(2), calm: this.amb.calm, nextBreath: this.ac ? +(this.nextBreath - this.ac.currentTime).toFixed(1) : null, nextGust: this.ac ? +(this.nextGust - this.ac.currentTime).toFixed(1) : null };
  }
  private loaded = 0;
  // quantos ARQUIVOS já estão prontos (para a barra da tela de carregamento); os instrumentos só se sabem depois de ler o índice
  private filesDone = 0;
  private filesTotal = SFX_FILES.length + 81;
  get state() {
    return this.ac ? this.ac.state : 'sem-contexto';
  }
  get ready() {
    return this.loaded;
  }
  // 0..1: quanto das gravações já está pronto (1 também quando não há áudio no aparelho, para ninguém esperar à toa)
  get progress() {
    if (!this.ctx) return this.noAudio ? 1 : 0;
    return Math.min(1, this.filesDone / this.filesTotal);
  }
  private noAudio = false;

  private vol = { master: 0.8, music: 0.6, sfx: 0.8 };
  setMode(m: AudioMode) {
    this.mode = m;
    this.applyMode();
  }
  // volumes da aba Áudio (0 a 1): geral, música, efeitos
  setVolumes(master: number, music: number, sfx: number) {
    this.vol = { master, music, sfx };
    this.mode = master <= 0 ? 2 : music <= 0 ? 1 : 0;
    this.applyMode();
  }

  private applyMode() {
    if (!this.ac) return;
    const t = this.ac.currentTime;
    this.master.gain.setTargetAtTime(this.mode === 2 ? 0 : this.vol.master / 0.8, t, 0.05);
    this.musicBus.gain.setTargetAtTime(this.mode === 0 ? 0.2 * (this.vol.music / 0.6) : 0, t, 0.4);
    this.bus.gain.setTargetAtTime(0.85 * (this.vol.sfx / 0.8), t, 0.05);
  }

  // cria o contexto de áudio (suspenso) e começa a baixar e decodificar as gravações: não precisa de gesto
  prepare() {
    if (!this.ctx && !this.noAudio) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      let ac: AudioContext | null = null;
      try {
        ac = AC ? new AC() : null;
      } catch {
        ac = null;
      }
      if (!ac) {
        this.noAudio = true;
        return;
      }
      this.ctx = ac;
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
      // a sala curta (~0,9 s, só processamento como a longa): corredores e câmaras pequenas abafam; salões altos vão para a longa
      const sl = Math.floor(ac.sampleRate * 0.9);
      const irS = ac.createBuffer(2, sl, ac.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = irS.getChannelData(c);
        for (let i = 0; i < sl; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / sl, 3.2);
      }
      const convS = ac.createConvolver();
      convS.buffer = irS;
      this.space = ac.createGain();
      this.shortRet = ac.createGain();
      this.longSend = ac.createGain();
      this.space.connect(convS).connect(this.shortRet).connect(this.master);
      this.space.connect(this.longSend).connect(this.verbSend);
      void this.loadAll();
    }
  }

  // o 1º toque/tecla do jogador: o som pode sair (o navegador só deixa depois de um gesto)
  unlock() {
    this.prepare();
    const ac = this.ctx;
    if (!ac) return;
    if (!this.live) {
      this.live = true;
      this.setSpace(this.sizeLevel);
      // a música e o ambiente contam a partir de agora
      this.chordAt = ac.currentTime + 0.5;
      const t0 = ac.currentTime;
      this.nextHarp = t0 + 4;
      this.nextCelesta = t0 + 9;
      this.nextFlute = t0 + 20;
      this.nextTimpani = t0 + 45;
      this.nextBreath = t0 + rand(70, 120);
      this.nextGust = t0 + rand(6, 14);
      this.applyMode();
    }
    if (ac.state !== 'running') void ac.resume();
  }
  get unlocked() {
    return this.live;
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
      return await this.ctx!.decodeAudioData(await r.arrayBuffer());
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
        this.filesDone++;
      }),
    );
    this.startLoops();
    try {
      const man = (await (await fetch(`${base}inst/manifest.json`)).json()) as Record<string, number[]>;
      this.filesTotal = SFX_FILES.length + INSTRUMENTS.reduce((a, n) => a + (man[n]?.length ?? 0), 0);
      for (const name of INSTRUMENTS) {
        const notes = man[name] ?? [];
        const inst: Inst = { notes, bufs: new Map() };
        this.inst[name] = inst;
        await Promise.all(
          notes.map(async (m) => {
            const b = await this.decode(`${base}inst/${name}/${m}.mp3?v=${AUDIO_VERSION}`);
            if (b) inst.bufs.set(m, b);
            this.filesDone++;
          }),
        );
        this.loaded++;
      }
    } catch {
      /* sem instrumentos: só os efeitos tocam */
    }
    this.filesDone = this.filesTotal; // (o que falhou não vai chegar: a barra não fica esperando)
  }

  // tamanho da sala (0..1): quanto vai para a sala curta e quanto para a longa
  private setSpace(size: number) {
    if (!this.ac || !this.space) return;
    const t = this.ac.currentTime;
    this.shortRet.gain.setTargetAtTime(0.42 * (1 - size) + 0.08, t, 0.5);
    this.longSend.gain.setTargetAtTime(0.15 + 0.95 * size, t, 0.5);
  }

  private startLoops() {
    const ac = this.ctx!;
    // um laço que toca sempre (o volume muda, a fonte não se recria); `pre` = filtros/pan entre a fonte e o volume
    const loop = (name: string, rate = 1, pre: AudioNode[] = []) => {
      const b = this.buf.get(name);
      if (!b) return null;
      const s = ac.createBufferSource();
      s.buffer = b;
      s.loop = true;
      s.playbackRate.value = rate;
      const g = ac.createGain();
      g.gain.value = 0;
      let n: AudioNode = s;
      for (const p of pre) n = n.connect(p);
      n.connect(g).connect(this.bus);
      s.start(0, Math.random() * b.duration);
      return { s, g };
    };
    const r = loop('roll');
    if (r) {
      this.rollSrc = r.s;
      this.rollG = r.g;
    }
    // o fogo por perto: abafa quando está longe e vem do lado em que está
    this.fireLP = ac.createBiquadFilter();
    this.fireLP.type = 'lowpass';
    this.fireLP.frequency.value = 2000;
    const pre: AudioNode[] = [this.fireLP];
    if (ac.createStereoPanner) {
      this.firePanN = ac.createStereoPanner();
      pre.push(this.firePanN);
    }
    const f = loop('fire', 1, pre);
    if (f) this.fireG = f.g;
    // o vento (perto das aberturas fica mais claro e mais forte)
    this.windLP = ac.createBiquadFilter();
    this.windLP.type = 'lowpass';
    this.windLP.frequency.value = 600;
    const w = loop('wind', 1, [this.windLP]);
    if (w) this.windG = w.g;
    // o ar da sala: o mesmo vento, mais lento e só o grave, quase no limite do audível (lá fora, do outro lado da pedra)
    const toneLP = ac.createBiquadFilter();
    toneLP.type = 'lowpass';
    toneLP.frequency.value = 170;
    toneLP.Q.value = 0.4;
    const tn = loop('wind', 0.62, [toneLP]);
    if (tn) this.toneG = tn.g;
  }

  // ── tocar gravações ─────────────────────────────────────────────────────
  // `verb` vai para a reverberação do MUNDO (curta ou longa conforme a sala; `far` = sempre a longa, para o que soa lá longe, como o poço
  // da abertura); `lp` = abafar (Hz); `off`/`dur` = tocar só um trecho
  private sample(name: string, vol = 1, rate = 1, delay = 0, verb = 0, pan = 0, lp = 0, off = 0, dur = 0, far = false) {
    const ac = this.ac;
    const b = this.buf.get(name);
    if (!ac || !b) return;
    this.dbg(name);
    const s = ac.createBufferSource();
    s.buffer = b;
    s.playbackRate.value = rate;
    const g = ac.createGain();
    const t = ac.currentTime + delay;
    let node: AudioNode = s;
    if (lp > 0) {
      const f = ac.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = lp;
      f.Q.value = 0.5;
      node = node.connect(f);
    }
    node.connect(g);
    node = g;
    if (dur > 0) {
      // trecho: entra e sai suave (sem estalo)
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + Math.min(0.012, dur * 0.2));
      g.gain.setValueAtTime(vol, t + dur * 0.6);
      g.gain.linearRampToValueAtTime(0, t + dur);
    } else g.gain.value = vol;
    if (pan !== 0 && ac.createStereoPanner) {
      const p = ac.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      g.connect(p);
      node = p;
    }
    node.connect(this.bus);
    if (verb > 0) {
      const v = ac.createGain();
      v.gain.value = verb;
      node.connect(v).connect(far ? this.verbSend : this.space);
    }
    if (dur > 0) s.start(t, off, dur * rate + 0.02);
    else s.start(t);
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
  // `key` (opcional) diz O QUE acendeu: tocha ('tocha'), pano/estandarte ('pano', 'dm0'...): muda a gravação do 'ignite'
  play(name: SfxName, v = 1, key?: string) {
    if (!this.ac || this.mode === 2) return;
    this.played++;
    if (name === 'door' || name === 'doorClose' || name === 'rise' || name === 'error' || name === 'dark' || name === 'gem' || name === 'gemBreak' || name === 'piece') this.duckUntil = this.ac.currentTime + 1.6;
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
        // a chama pegando ("fff") com o corpo grave; a tocha é menor; o pano pega com uma lufada e estala
        if (key && /^(pano|dm\d)/.test(key)) this.sample('ignite_cloth', 0.95 * v, 1, 0, 0.3);
        else if (key && /tocha|torch/.test(key)) this.sample('ignite_small', 0.85 * v, 1.04, 0, 0.25);
        else {
          this.sample('ignite', 0.95 * v, 1, 0, 0.3);
          if (v > 0.6) this.fxNote('timpani', 36, 0.3, 0.03, 0.6);
        }
        this.sample('crackle', 0.35 * v, 1, 0.25, 0.2, 0, 0, rand(0, 4.5), 0.5); // as primeiras faíscas
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
      // a cena da gema, só com gravações e instrumentos reais: o sino de vidro e a celesta sobem quando ela vem; o vidro estala (em tom alto)
      // e o ar leva o pó; ao encaixar, um toque de latão e a harpa; a face completa ganha os sinos
      case 'gemShine':
        [84, 88, 91, 96].forEach((m, i) => this.fxNote('celesta', m, 0.2, i * 0.1, 0.7, 0.3));
        this.sample('gem1', 0.35, 1.2, 0.25, 0.6);
        break;
      case 'gemBreak':
        this.sample('gem2', 0.75, 1.35, 0, 0.5);
        this.sample('gem1', 0.4, 1.6, 0.02, 0.6);
        this.fxNote('glockenspiel', 100, 0.22, 0.01, 0.6, 0.2);
        this.fxNote('glockenspiel', 103, 0.16, 0.06, 0.6, 0.2);
        this.sample('sweep', 0.28, 1.7, 0.08, 0.5);
        break;
      case 'gemSet':
        this.sample('put1', 0.55, 1.35, 0, 0.3);
        [64, 69, 76].forEach((m, i) => this.fxNote('orchestral_harp', m, 0.4, 0.02 + i * 0.07, 0.6, 0.2));
        this.fxNote('celesta', 88, 0.3, 0.2, 0.7, 0.3);
        break;
      case 'gemFace':
        [72, 76, 79].forEach((m, i) => this.fxNote('tubular_bells', m, 0.3, 0.35 + i * 0.22, 0.9));
        break;
      // O ALTAR (§77), só com as gravações que o jogo já tem: pedra (o pilar, a laje da porta, o baque), o dado (pousar, rolar) e os
      // instrumentos reais. Racha: um estalo grave e pedrinhas. Empurrar: a pedra arrasta para dentro e desce. O dado desliza devagar.
      // Fecha: a laje bate. A luz: o coro baixinho, o violoncelo e os sinos. Abre: a laje sobe arrastando.
      case 'altarCrack':
        this.sample('boom', 0.5, 1.25, 0, 0.5);
        this.sample('rise', 0.55, 1.5, 0.05, 0.4, 0, 0, 1.6, 0.7);
        this.fxNote('cello', 31, 0.3, 0.05, 0.8);
        break;
      case 'altarPush':
        this.sample('rise', 0.75, 1.2, 0, 0.4, 0, 0, 0, 1.3);
        this.sample('door_shut', 0.35, 1.3, 1.05, 0.3);
        break;
      case 'altarSlide':
        this.sample('roll', 0.3, 0.55, 0, 0.3, 0, 1800, 0, 2.4);
        this.sample('put2', 0.45, 0.8, 0, 0.3);
        break;
      case 'altarShut':
        this.sample('door_shut', 0.9, 1.05, 0, 0.4);
        this.sample('boom', 0.35, 0.9, 0.02, 0.6, 0, 500);
        break;
      case 'altarGlow':
        this.fxNote('choir_aahs', 57, 0.22, 0, 0.9);
        this.fxNote('choir_aahs', 64, 0.16, 0.25, 0.9);
        this.fxNote('cello', 33, 0.4, 0, 0.9);
        [69, 76, 81].forEach((m, i) => this.fxNote('tubular_bells', m, 0.26, 0.5 + i * 0.3, 0.9));
        [84, 88, 91, 96].forEach((m, i) => this.fxNote('celesta', m, 0.18, 1.2 + i * 0.1, 0.8, 0.3));
        break;
      case 'altarOpen':
        this.sample('door_open', 0.85, 1.15, 0, 0.35);
        break;
      // porta de pedra: a laje sobe arrastando e trava lá em cima (com pó caindo); a Casa aceita (violoncelo grave)
      case 'door':
        this.sample('door_open', 1, 0.95, 0, 0.35);
        this.fxNote('cello', 36, 0.42, 0.1, 0.8);
        break;
      // a laje desce raspando e bate no chão
      case 'doorClose':
        this.sample('door_shut', 0.9, 0.95, 0, 0.35);
        break;
      // pilar subindo do chão (2,2 s): arrasto grave, pedrinhas soltando e o baque no fim
      case 'rise':
        this.sample('rise', 1, 1, 0, 0.4);
        this.fxNote('cello', 33, 0.35, 0.2, 0.8);
        break;
      // o escuro: a chama sugada e, por baixo, um grave abafado e distante
      case 'dark':
        this.sample('burnout', 0.75, 0.9, 0, 0.3);
        this.sample('boom', 0.55, 0.85, 0.05, 0.6, 0, 400, 0, 0, true);
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
        this.sample('burnout', 0.6 * v, 1, 0, 0.2);
        break;
      // a escrita (letras e símbolos aparecendo): um pedaço curto e suave de uma gravação de giz, a cada vez em outro ponto, volume e altura
      case 'write':
        this.scribble(0.12 * v * (0.6 + 0.7 * Math.random()));
        break;
      // o barulho de algo se mexendo lá em cima, no poço (só gravações, mais graves e com muito eco): um estrondo surdo, duas batidas e o arrastar
      case 'shaftRumble':
        this.fxNote('timpani', 38, 0.5, 0, 0.95);
        this.sample('doorclose1', 0.5, 0.5, 0.05, 1, 0, 0, 0, 0, true);
        this.sample('bounce3', 0.5, 0.5, 0.5, 1, 0, 0, 0, 0, true);
        this.sample('bounce1', 0.4, 0.58, 0.85, 1, 0, 0, 0, 0, true);
        this.sample('sweep', 0.35, 0.55, 0.1, 0.9, 0, 0, 0, 0, true);
        break;
      // o dado despenca pelo poço: um assobio de ar que cai e a pancada grave no chão
      case 'shaftFall':
        this.sample('sweep', 0.5, 0.8, 0, 0.6, 0, 0, 0, 0, true);
        this.sample('land', 1, 0.6, 0.5, 0.8, 0, 0, 0, 0, true);
        this.fxNote('timpani', 43, 0.35, 0.5, 0.9);
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

  // passo: SEMPRE a mesma gravação para cada tipo de piso (decisão do Pedro: nada de sorteio). Pedra, degrau e entulho têm duas tomadas,
  // pé esquerdo e pé direito, que se alternam sempre na mesma ordem. Pedra = sapato de couro em pedra (sem o "toque-toque" de bota);
  // degrau = o mesmo sapato com o peso do corpo; entulho = pedrinhas soltas sob o sapato. A reverberação segue o tamanho da sala.
  step(surface: StepKind) {
    const ac = this.ac;
    if (!ac || this.mode === 2) return;
    this.steps++;
    const now = ac.currentTime;
    if (now - this.lastStep > 1.2) this.foot = 0; // parou e voltou a andar: começa sempre com o mesmo pé
    this.lastStep = now;
    const side = this.foot === 0 ? 'l' : 'r';
    this.foot ^= 1;
    const b = this.buf.get(`step_${surface}_${side}`) ?? this.buf.get(`step_${surface}`) ?? this.buf.get(`step_stone_${side}`);
    if (!b) return;
    this.dbg(`step_${surface}_${side}`);
    const vol = { stone: 0.36, stair: 0.42, rubble: 0.4, rug: 0.4, plate: 0.5, water: 0.42 }[surface];
    const rate = { stone: 0.94, stair: 0.9, rubble: 0.95, rug: 0.86, plate: 0.84, water: 0.9 }[surface];
    const cut = { stone: 2600, stair: 2300, rubble: 3600, rug: 700, plate: 950, water: 2400 }[surface];
    const verb = { stone: 0.16, stair: 0.18, rubble: 0.14, rug: 0.03, plate: 0.14, water: 0.12 }[surface];
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
    // um pé um pouco à esquerda, o outro um pouco à direita (bem pouco: só dá corpo)
    let out: AudioNode = g;
    if (ac.createStereoPanner) {
      const p = ac.createStereoPanner();
      p.pan.value = side === 'l' ? -0.12 : 0.12;
      g.connect(p);
      out = p;
    }
    out.connect(this.bus);
    const v = ac.createGain();
    v.gain.value = verb * (0.6 + 0.8 * this.sizeLevel);
    out.connect(v).connect(this.space);
    s.start(now);
  }

  // um "risquinho": pedaço curto de uma gravação de giz (início e fim suaves), em ponto aleatório
  scribble(vol: number) {
    const ac = this.ac;
    if (!ac || this.mode === 2) return;
    const b = this.buf.get(pick(['chalk1', 'chalk2']));
    if (!b) return;
    const dur = rand(0.06, 0.13);
    const off = rand(0.02, Math.max(0.03, b.duration - dur - 0.05));
    const t = ac.currentTime;
    const s = ac.createBufferSource();
    s.buffer = b;
    s.playbackRate.value = rand(0.92, 1.15);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.018);
    g.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(g).connect(this.bus);
    s.start(t, off, dur + 0.03);
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

  // fogo por perto (0..1) e de que lado ele está (-1 esquerda .. 1 direita): o laço da chama + estalos soltos, nunca iguais
  fire(level: number, pan = 0) {
    this.fireTarget = Math.min(1, level);
    this.firePan = Math.max(-1, Math.min(1, pan));
  }

  // o lugar onde o jogador está (chamar todo quadro; ver AmbientState)
  ambient(a: AmbientState) {
    this.amb = a;
  }

  // a luz que ESCREVE uma frase acesa passa pelo símbolo i de n (da esquerda para a direita): uma nota de celesta que sobe, com a harpa
  // por baixo, do lado em que está a frase; no último símbolo, a harpa assenta num acorde (a Casa leu)
  glyph(i: number, n: number, pan = 0) {
    if (!this.ac || this.mode === 2) return;
    this.dbg(`glyph${i + 1}/${n}`);
    const SCALE = [69, 72, 74, 76, 79, 81, 84, 86, 88]; // lá menor pentatônica, como as faces do dado
    const k = n <= 1 ? 0 : i / (n - 1);
    const m = SCALE[Math.min(SCALE.length - 1, Math.round(k * Math.min(SCALE.length - 1, n + 1)))];
    const p = Math.max(-0.8, Math.min(0.8, pan));
    this.note('celesta', m, this.ac.currentTime, 0.13, { fadeIn: 0.005, fadeOut: 0.7, verb: 0.55, echo: 0.18, pan: p, toMusic: false });
    this.note('orchestral_harp', m - 12, this.ac.currentTime + 0.01, 0.12, { fadeIn: 0.004, fadeOut: 0.8, verb: 0.5, pan: p, toMusic: false });
    if (i === n - 1) [57, 64, 69].forEach((mm, j) => this.note('orchestral_harp', mm, this.ac!.currentTime + 0.16 + j * 0.07, 0.16, { fadeIn: 0.004, fadeOut: 1.2, verb: 0.7, echo: 0.2, pan: p * 0.5, toMusic: false }));
  }

  // ── ambiente: vento, o ar da sala, rajadas, gotas, estalos do fogo e a Casa respirando ──
  private ambientTick(dt: number, now: number) {
    const a = this.amb;
    const on = this.mode !== 2 && this.loaded > 0;
    // o ambiente abre espaço para o que importa: pausa, porta, erro, o escuro (baixa por ~1,6 s)
    const duck = (a.paused ? 0.45 : 1) * (now < this.duckUntil ? 0.5 : 1);
    // vento: segue o lugar devagar (não "pula" ao virar uma esquina); perto da abertura, mais forte e mais claro
    this.windLevel += (a.wind - this.windLevel) * Math.min(1, dt * 0.9);
    const w = this.windLevel;
    this.sizeLevel += (a.size - this.sizeLevel) * Math.min(1, dt * 0.8);
    // (os volumes e filtros mudam só ~10 vezes por segundo: menos trabalho para o celular; as rampas suaves cobrem o resto)
    if (now >= this.paramAt) {
      this.paramAt = now + 0.1;
      if (this.windG) this.windG.gain.setTargetAtTime(on ? 0.38 * Math.pow(w, 1.3) * duck : 0, now, 0.25);
      if (this.windLP) this.windLP.frequency.setTargetAtTime(350 + 4200 * w * w, now, 0.3);
      // o ar da sala: sempre um fio, um pouco mais presente nas salas grandes e onde venta
      if (this.toneG) this.toneG.gain.setTargetAtTime(on ? (0.06 + 0.05 * this.sizeLevel + 0.08 * w) * duck : 0, now, 0.4);
      this.setSpace(this.sizeLevel);
      const fl = this.fireLevel;
      if (this.fireG) this.fireG.gain.setTargetAtTime(this.mode === 2 ? 0 : fl * 0.95 * duck, now, 0.1);
      if (this.fireLP) this.fireLP.frequency.setTargetAtTime(900 + 6000 * fl * fl, now, 0.15);
      if (this.firePanN) this.firePanN.pan.setTargetAtTime(this.firePan * (1 - 0.5 * fl), now, 0.2); // bem perto, o fogo "abraça" (menos lateral)
    }
    if (!on || a.paused) return;
    // rajadas: só onde venta de verdade, de tempos em tempos, de um lado ou do outro
    if (now >= this.nextGust) {
      if (w > 0.22) {
        this.sample('gust', 0.32 * Math.pow(w, 1.2), rand(0.85, 1.1), 0, 0, rand(-0.6, 0.6), 600 + 4500 * w * w);
        this.nextGust = now + rand(9, 22) / (w + 0.3);
      } else this.nextGust = now + rand(3, 6); // aqui não venta: olha de novo daqui a pouco (ao chegar num lugar aberto, a rajada não demora)
    }
    // gotas: espaçadas, com eco de pedra, do lado em que pingam
    if (now >= this.nextDrip) {
      if (a.drip > 0.02) {
        const d = pick(DRIPS);
        this.sample('drip', 0.3 * a.drip, rand(0.88, 1.12), 0, 0.7, a.dripPan, 0, d, 0.55);
      }
      this.nextDrip = now + rand(2.2, 6.5);
    }
    // estalos do fogo (pedacinhos de gravações de fogo, ao acaso): mais e mais altos perto; longe, abafados
    const fl = this.fireLevel;
    if (now >= this.nextCrackle) {
      if (fl > 0.06) {
        const crk = this.buf.get('crackle');
        const dur = rand(0.06, 0.22);
        if (crk) this.sample('crackle', 0.32 * fl * rand(0.5, 1), rand(0.85, 1.2), 0, 0.12, this.firePan + rand(-0.15, 0.15), 1500 + 8000 * fl, rand(0, crk.duration - dur - 0.02), dur);
      }
      this.nextCrackle = now + rand(0.12, 0.7) / Math.max(0.25, fl);
    }
    // a Casa respira: um grave distante ou pedra rangendo longe. Raro (1 a 2,5 min), só num momento calmo, e nunca duas vezes iguais seguidas
    if (now >= this.nextBreath) {
      if (a.calm) {
        this.breathKind = (this.breathKind + 1 + Math.floor(Math.random() * 2)) % 3;
        const pan = rand(-0.7, 0.7);
        if (this.breathKind === 0) {
          // um grave que vem de longe: o tambor de tronco abafado e, por baixo, o violoncelo que cresce e some (um suspiro)
          this.sample('boom', 0.3, rand(0.85, 1.0), 0, 0.9, pan, 380, 0, 0, true);
          this.note('cello', pick([33, 36]), now + 0.1, 0.1, { fadeIn: 1.4, hold: 0.6, fadeOut: 1.6, verb: 0.9, pan: pan * 0.5, toMusic: false });
        } else if (this.breathKind === 1) this.sample('creak', 0.13, rand(0.8, 1.0), 0, 0.8, pan, 900, 0, 0, true);
        else {
          this.sample('boom', 0.2, 0.8, 0, 0.9, pan, 300, 0, 0, true);
          this.sample('creak', 0.09, 0.75, 1.1, 0.9, -pan, 700, 0, 0, true);
        }
        this.nextBreath = now + rand(70, 150);
      } else this.nextBreath = now + rand(8, 20); // não era calmo: tenta de novo daqui a pouco
    }
  }

  // chamar todo quadro
  tick(dt: number) {
    const ac = this.ac;
    if (!ac) return;
    const now = ac.currentTime;
    this.fireLevel += (this.fireTarget - this.fireLevel) * Math.min(1, dt * 3);
    this.ambientTick(dt, now);
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
