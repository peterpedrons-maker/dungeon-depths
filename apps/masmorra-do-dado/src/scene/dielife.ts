// O dado da mão tem vida: olha para as coisas, pisca, se assusta, vibra de alegria, cochila quando o jogador fica parado.
// Aqui fica só a "alma" (estado e molas); o motor (`scene.ts`) diz para onde há algo interessante e o que aconteceu, e aplica o resultado.
// Tudo é sutil de propósito: pequenas inclinações, um pulinho, o brilho das gemas. Ver DESIGN.md §23.

import * as THREE from 'three';

export type Reaction = 'flinch' | 'perk' | 'joy' | 'shake' | 'thump' | 'sad';

export interface LifeTarget {
  dx: number; // para onde olhar, em coordenadas de tela relativas ao dado (-2..2; +x = direita, +y = cima)
  dy: number;
  eager?: boolean; // quer MUITO ir até lá (um braseiro que ele sabe acender): inclina-se e brilha
  player?: boolean; // olhando para o jogador
}

export interface LifeInput {
  dt: number;
  t: number;
  idle: boolean; // jogador parado e sem fazer nada
  target: LifeTarget | null;
  busy: boolean; // cena, conversa ou diário: fica quieto e atento
  sleepAfter?: number; // segundos parado até cochilar (padrão 40; na tela inicial, 30)
  face?: number; // 0..1: quanto um ROSTO está virado para o jogador. Com o rosto à vista, o DADO fica quieto e quem se mexe são os olhos e o rosto
}

export interface LifeOut {
  quat: THREE.Quaternion; // inclinação do dado (olhar), a multiplicar pela orientação normal
  dx: number; // deslocamentos na tela (unidades do HUD)
  dy: number;
  scale: number;
  glow: number; // multiplicador do brilho das gemas (pisca, cochila, vibra)
  // o olhar do ROSTO: para onde os olhos apontam (-1 a 1; +x direita, +y cima), quanto as sobrancelhas sobem (-1 a 1) e se os olhos estão fechados (piscar, cochilo)
  look: { x: number; y: number; brow: number; closed: boolean };
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export class DieLife {
  // olhar (suavizado por molas)
  private gy = 0;
  private gp = 0;
  private vy = 0;
  private vp = 0;
  // alvo escolhido para vagar o olhar quando não há nada
  private wy = 0;
  private wp = 0;
  private wanderT = 1.5;
  private lookPlayer = false;
  private holdT = 0; // não troca de alvo antes disto (histerese)
  // pulinho
  private hopY = 0;
  private hopV = 0;
  // sustos e alegrias
  private shake = 0;
  private squash = 0; // 1 = encolhido pelo susto
  private boost = 0; // brilho extra (ou menos, se negativo)
  private droop = 0;
  private wiggle = 0;
  // piscar e cochilar
  private blinkT = 3;
  private blink = 0;
  private idleT = 0;
  private sleep = 0;
  private lean = 0;
  private time = 0;
  // OS OLHOS DO ROSTO têm vida própria (por cima do olhar do dado): pequenos saltos (sacadas), olhadelas para longe do alvo e de volta,
  // e uma mola rápida (olho anda depressa e para; o dado se vira devagar)
  private sacX = 0;
  private sacY = 0;
  private sacT = 0.6;
  private glX = 0;
  private glY = 0;
  private glT = 2.5; // até a próxima olhadela
  private glOn = 0; // > 0: olhando de relance para outro lado
  private eyeX = 0;
  private eyeY = 0;
  private eyeVX = 0;
  private eyeVY = 0;
  private dbl = -1; // segundo piscar logo depois do primeiro
  private q = new THREE.Quaternion();
  private e = new THREE.Euler();
  out: LifeOut = { quat: this.q, dx: 0, dy: 0, scale: 1, glow: 1, look: { x: 0, y: 0, brow: 0, closed: false } };

  react(kind: Reaction) {
    this.idleT = 0;
    const wasAsleep = this.sleep > 0.5;
    this.sleep = 0;
    if (wasAsleep) this.hopV = Math.max(this.hopV, 2.2); // acordou assustado
    switch (kind) {
      case 'flinch': // acendeu: o dado recua, quente
        this.squash = 1;
        this.hopV = Math.max(this.hopV, -1.5);
        this.boost = Math.max(this.boost, 0.7);
        this.shake = Math.max(this.shake, 0.35);
        break;
      case 'perk': // algo se abriu: levanta e olha para o jogador
        this.hopV = 3.4;
        this.boost = Math.max(this.boost, 0.8);
        this.lookPlayer = true;
        this.wanderT = 2.4;
        this.wy = 0;
        this.wp = 0.12;
        break;
      case 'joy':
        this.hopV = 4.2;
        this.boost = Math.max(this.boost, 1);
        this.wiggle = 1;
        this.lookPlayer = true;
        this.wanderT = 2.6;
        this.wy = 0;
        this.wp = 0.12;
        break;
      case 'shake': // errou: treme
        this.shake = 1;
        this.boost = Math.min(this.boost, -0.3);
        break;
      case 'thump':
        this.hopV = -1.8;
        this.squash = Math.max(this.squash, 0.4);
        break;
      case 'sad':
        this.droop = 1;
        this.boost = Math.min(this.boost, -0.45);
        break;
    }
  }

  // força o cochilo (testes)
  sleepNow() {
    this.idleT = 999;
  }

  update(i: LifeInput): LifeOut {
    const dt = Math.min(0.05, i.dt);
    if (!(dt >= 0)) return this.out;
    this.time += dt;
    // ── cochilo: parado por muito tempo, o dado vai dormindo ──
    if (i.idle && !i.busy) this.idleT += dt;
    else {
      if (this.sleep > 0.6 && !i.idle) this.hopV = Math.max(this.hopV, 2.2); // acordou com o movimento
      this.idleT = 0;
    }
    const sleepGoal = this.idleT > (i.sleepAfter ?? 40) ? 1 : 0;
    this.sleep += (sleepGoal - this.sleep) * Math.min(1, dt * (sleepGoal ? 0.6 : 5));

    // ── para onde olhar ──
    let ty = 0;
    let tp = 0;
    let eager = false;
    if (this.sleep > 0.5) {
      ty = 0;
      tp = -0.3; // de cabeça baixa
    } else if (i.target && Number.isFinite(i.target.dx + i.target.dy) && (!this.lookPlayer || this.holdT <= 0)) {
      ty = clamp(i.target.dx * 0.55, -0.55, 0.55);
      tp = -clamp(i.target.dy * 0.5, -0.4, 0.4);
      eager = !!i.target.eager;
      this.holdT = 0.3;
      if (i.target.player) {
        ty = 0;
        tp = 0.05;
      }
    } else {
      // sem nada de interessante: vagueia o olhar, e de vez em quando olha para o jogador
      this.wanderT -= dt;
      if (this.wanderT <= 0) {
        this.lookPlayer = Math.random() < 0.3;
        const f = i.face ?? 0;
        this.wanderT = (1.6 + Math.random() * 2.6) * (1 - 0.5 * f); // com o rosto à vista, os olhos passeiam mais depressa
        // às vezes uma "segunda olhada": vira para um lado e logo em seguida para o outro
        if (!this.lookPlayer && Math.random() < 0.22) this.wanderT = 0.35 + Math.random() * 0.3;
        const side = Math.sign(this.wy) || 1;
        this.wy = this.lookPlayer ? 0 : -side * (0.2 + Math.random() * 0.45) * (1 + 0.4 * f);
        this.wp = this.lookPlayer ? 0.1 : (Math.random() - 0.45) * (0.55 + 0.35 * f);
        if (Math.random() < 0.25) this.blinkT = 0; // um piscar junto com a mudança de olhar
      }
      ty = this.wy;
      tp = this.wp;
    }
    this.holdT = Math.max(0, this.holdT - dt);
    // mola amortecida do olhar
    const k = 38;
    const c = 9;
    this.vy += ((ty - this.gy) * k - this.vy * c) * dt;
    this.vp += ((tp - this.gp) * k - this.vp * c) * dt;
    this.gy += this.vy * dt;
    this.gp += this.vp * dt;

    // ── pulinho e susto ──
    this.hopV += (-this.hopY * 70 - this.hopV * 7) * dt;
    this.hopY += this.hopV * dt;
    this.squash = Math.max(0, this.squash - dt * 3);
    this.shake = Math.max(0, this.shake - dt * 1.5);
    this.droop = Math.max(0, this.droop - dt * 0.35);
    this.wiggle = Math.max(0, this.wiggle - dt * 1.4);
    this.boost += (0 - this.boost) * Math.min(1, dt * 1.6);
    this.lean += ((eager ? 1 : 0) - this.lean) * Math.min(1, dt * 5);

    // ── piscar ──
    this.blinkT -= dt;
    if (this.blinkT <= 0) {
      this.blink = 1;
      this.blinkT = 2.2 + Math.random() * 3.8;
      if (Math.random() < 0.2) this.dbl = 0.28; // às vezes pisca duas vezes
    }
    if (this.dbl >= 0) {
      this.dbl -= dt;
      if (this.dbl < 0) this.blink = 1;
    }
    this.blink = Math.max(0, this.blink - dt * 7);

    // ── os olhos: sacadas e olhadelas ──
    const awake = this.sleep < 0.5 && !this.shake;
    const f = i.face ?? 0;
    this.sacT -= dt;
    if (this.sacT <= 0) {
      // um saltinho do olho em volta do ponto que ele olha (olho vivo nunca fica parado)
      this.sacT = 0.3 + Math.random() * (i.busy ? 1.4 : 0.9);
      this.sacX = awake ? (Math.random() - 0.5) * 0.45 : 0;
      this.sacY = awake ? (Math.random() - 0.5) * 0.35 : 0;
    }
    this.glT -= dt;
    if (this.glT <= 0 && awake) {
      // olhadela: de relance para outro lado (para cima, para o lado, para baixo) e de volta, mesmo com algo interessante à frente
      this.glT = (1.4 + Math.random() * 2.4) * (i.busy ? 1.8 : 1);
      this.glOn = 0.3 + Math.random() * 0.55;
      const a = Math.random() * Math.PI * 2;
      this.glX = Math.cos(a) * (0.55 + Math.random() * 0.35);
      this.glY = Math.sin(a) * (0.35 + Math.random() * 0.35);
    }
    if (this.glOn > 0) this.glOn -= dt;
    const gx = this.glOn > 0 ? this.glX : 0;
    const gyy = this.glOn > 0 ? this.glY : 0;
    // alvo dos olhos = olhar do dado + sacada + olhadela; mola rápida
    const tx = clamp(this.gy / 0.7 + this.sacX + gx, -1, 1);
    const tyy = clamp(-this.gp / 0.45 + this.sacY + gyy, -1, 1);
    const ke = 260;
    const ce = 30;
    this.eyeVX += ((tx - this.eyeX) * ke - this.eyeVX * ce) * dt;
    this.eyeVY += ((tyy - this.eyeY) * ke - this.eyeVY * ce) * dt;
    this.eyeX += this.eyeVX * dt;
    this.eyeY += this.eyeVY * dt;
    void f;

    // ── resultado ──
    const sh = this.shake;
    const tr = Math.sin(this.time * 61) * sh;
    const roll = tr * 0.12 + Math.sin(this.time * 17) * this.wiggle * 0.35;
    this.e.set(this.gp + Math.sin(this.time * 47) * sh * 0.05, this.gy + Math.sin(this.time * 53) * sh * 0.06 + (this.wiggle * Math.sin(this.time * 14) * 0.25), roll);
    // o rosto à vista: o dado quase não se inclina nem anda; só os olhos e o rosto olham em volta
    const calm = 1 - 0.72 * Math.min(1, i.face ?? 0); // (um pouco do olhar ainda vira o dado inteiro: a cabeça acompanha os olhos)
    this.e.x *= calm;
    this.e.y *= calm;
    this.q.setFromEuler(this.e);
    const breathe = Math.sin(this.time * 1.7) * 0.012 * (1 - 0.5 * this.sleep);
    const eagerPulse = this.lean * (0.5 + 0.5 * Math.sin(this.time * 7)) * 0.35;
    this.out.dx = ((i.target ? clamp(i.target.dx, -1, 1) * 0.035 * this.lean : 0) + tr * 0.012) * (0.2 + 0.8 * calm);
    this.out.dy = this.hopY * 0.045 - this.droop * 0.07 - this.sleep * 0.05 + breathe + (i.target ? clamp(i.target.dy, -1, 1) * 0.02 * this.lean : 0) * (0.2 + 0.8 * calm);
    this.out.scale = 1 + breathe * 0.6 - this.squash * 0.1 + this.lean * 0.04;
    const eyelid = 1 - 0.85 * this.blink;
    this.out.glow = Math.max(0.05, (1 + this.boost + eagerPulse) * eyelid * (1 - 0.55 * this.sleep));
    // o olhar do rosto: os olhos acompanham o alvo; as sobrancelhas sobem com interesse, alegria e susto e descem com o cansaço
    this.out.look.x = clamp(this.eyeX, -1, 1);
    this.out.look.y = clamp(this.eyeY, -1, 1);
    this.out.look.brow = clamp(this.boost * 0.9 + this.lean * 0.8 + this.out.look.y * 0.5 - this.sleep * 0.8 - this.droop, -1, 1);
    this.out.look.closed = this.blink > 0.5 || this.sleep > 0.6;
    // rede de segurança: se algum número virar NaN, a vida reinicia em vez de contaminar o resto
    if (!Number.isFinite(this.out.dx + this.out.dy + this.out.scale + this.out.glow + this.q.x + this.q.y + this.q.z + this.q.w + this.eyeX + this.eyeY + this.out.look.brow)) {
      this.eyeX = this.eyeY = this.eyeVX = this.eyeVY = 0;
      this.gy = this.gp = this.vy = this.vp = this.hopY = this.hopV = this.shake = this.squash = this.boost = this.droop = this.wiggle = this.lean = 0;
      this.q.identity();
      this.out.dx = this.out.dy = 0;
      this.out.scale = this.out.glow = 1;
    }
    return this.out;
  }
}
