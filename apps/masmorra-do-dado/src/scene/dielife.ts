// O dado da mão tem vida: olha para as coisas, pisca, se assusta, vibra de alegria, cochila quando o jogador fica parado; olha de canto,
// mexe as sobrancelhas e suspira de leve, sempre com a expressão NEUTRA (DESIGN.md §51 e §78).
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
  talking?: boolean; // o dado está escrevendo uma fala no balão: a boca mexe
  lively?: boolean; // tela inicial e tela de carregamento: o dado está "sozinho" e mexe mais o rosto (olha de canto, suspira mais vezes)
  glare?: boolean; // há uma luz forte no alto (o feixe do poço): olhando para cima, a íris se fecha
}

export interface LifeOut {
  quat: THREE.Quaternion; // inclinação do dado (olhar), a multiplicar pela orientação normal
  dx: number; // deslocamentos na tela (unidades do HUD)
  dy: number;
  scale: number;
  glow: number; // multiplicador do brilho das gemas (pisca, cochila, vibra)
  // o olhar do ROSTO: para onde os olhos apontam (-1 a 1; +x direita, +y cima), quanto as sobrancelhas sobem (-1 a 1) e se os olhos estão fechados (piscar, cochilo)
  look: RostoMove;
}

// O ROSTO VIVO (pedido do Pedro): tudo mexe, mas a expressão é SEMPRE NEUTRA. A boca é sempre uma linha reta (abre e fecha como fenda, aperta,
// desliza para o lado), nunca vira sorriso nem tristeza; as pálpebras semicerram (foco, sono, piscar pela metade), o nariz funga, as
// sobrancelhas sobem num lampejo de atenção. Nada disso diz "feliz" ou "triste": só que ele está vivo.
export interface RostoMove {
  x: number; // para onde os olhos apontam (-1 a 1; +x direita, +y cima)
  y: number;
  brow: number; // sobrancelhas (-1 a 1, + = sobem)
  closed: boolean; // olhos fechados (piscar, cochilo)
  mouth: number; // 0..1: quanto a boca abre (fenda reta)
  mx: number; // -1..1: a boca desliza para um lado
  mw: number; // -1..1: a boca aperta (-) ou relaxa (+)
  squint: number; // 0..1: pálpebras de cima descendo (foco, sono, meio piscar)
  nose: boolean; // narinas abertas (uma fungada)
  bl: number; // -1..1: cada sobrancelha sobe (+) ou desce um pouco por conta própria (a esquerda e a direita da tela); as duas ficam RETAS
  br: number;
  side: number; // -1..1: olhar DE CANTO (só as íris vão ao canto; o rosto não acompanha)
  iris: number; // -1..0: a íris se fecha (luz forte)
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
  // a boca e o resto do rosto
  private mouth = 0;
  private mouthGoal = 0;
  private sylT = 0; // a próxima "sílaba" enquanto fala
  private tic: 'none' | 'shift' | 'press' | 'part' = 'none'; // um gesto pequeno da boca quando está quieto
  private ticT = 2.5; // até o próximo gesto
  private ticOn = 0; // quanto falta do gesto atual
  private ticSide = 1;
  private mx = 0;
  private mw = 0;
  private noseT = 5;
  private noseOn = 0;
  private yawn = 0; // > 0: bocejando (segundos que faltam)
  private yawned = false;
  private flash = 0; // lampejo das sobrancelhas
  private squint = 0;
  // o rosto mais vivo (DESIGN.md §78; pedido do Pedro): sem mudar a emoção, que continua NEUTRA
  private sideT = 6; // olhar de canto
  private sideOn = 0;
  private sideDir = 1;
  private sideK = 0;
  private relaxT = 8; // o olho "descansa": a pálpebra de cima desce 1 px por uns segundos e volta
  private relaxOn = 0;
  private relaxK = 0;
  private browT = 4; // uma sobrancelha (ou as duas) sobe 1 px e volta
  private browOn = 0;
  private browSide = 0; // -1 esquerda, 1 direita, 0 as duas
  private bl = 0;
  private br = 0;
  private irisK = 0;
  private sighT = 22; // o leve suspiro
  private sighS = -1; // > = 0: segundos dentro do suspiro
  private sighBody = 0; // o peito do suspiro (sobe ao puxar o ar, desce ao soltar)
  private q = new THREE.Quaternion();
  private e = new THREE.Euler();
  out: LifeOut = { quat: this.q, dx: 0, dy: 0, scale: 1, glow: 1, look: { x: 0, y: 0, brow: 0, closed: false, mouth: 0, mx: 0, mw: 0, squint: 0, nose: false, bl: 0, br: 0, side: 0, iris: 0 } };

  // volta tudo ao repouso (a tela inicial ou a de carregamento acabaram de aparecer: nada de molas ainda chegando ao lugar)
  settle() {
    this.gy = this.gp = this.vy = this.vp = 0;
    this.eyeX = this.eyeY = this.eyeVX = this.eyeVY = 0;
    this.hopY = this.hopV = this.shake = this.squash = this.droop = this.wiggle = this.lean = this.boost = 0;
    this.sideOn = this.sideK = 0;
    this.sighS = -1;
    this.sighBody = 0;
    this.idleT = 0;
    this.sleep = 0;
  }
  // quanto do `dy` de agora é o peito do suspiro (no chão, a tela inicial tira: o dado não flutua, só "enche")
  get sighDy() {
    return this.sighBody * 0.022;
  }
  // um leve suspiro agora (a tela inicial pede quando o dado "desiste" de rolar)
  sighNow() {
    if (this.sighS < 0 && this.sleep < 0.3) this.sighS = 0;
  }
  // um pulinho (a tela inicial: o dado tenta sair do lugar)
  hop(v: number) {
    this.hopV = Math.max(this.hopV, v);
  }
  // força: aperta a boca e semicerra os olhos por `secs` (tentando rolar)
  effort(secs: number) {
    this.tic = 'press';
    this.ticOn = Math.max(this.ticOn, secs);
    this.relaxOn = Math.max(this.relaxOn, secs);
  }
  // olha para um ponto (-1..1 na face) por `secs`, mesmo com outra coisa à frente (olhar o feixe de luz lá em cima, o menu)
  glance(x: number, y: number, secs: number) {
    this.glX = x;
    this.glY = y;
    this.glOn = secs;
    this.glT = secs + 1.2 + Math.random() * 1.5;
  }

  react(kind: Reaction) {
    this.idleT = 0;
    const wasAsleep = this.sleep > 0.5;
    this.sleep = 0;
    if (wasAsleep) this.hopV = Math.max(this.hopV, 2.2); // acordou assustado
    switch (kind) {
      case 'flinch': // acendeu: o dado recua, quente (fecha os olhos pela metade e a boca entreabre)
        this.squint = 1;
        this.mouthGoal = 0.35;
        this.squash = 1;
        this.hopV = Math.max(this.hopV, -1.5);
        this.boost = Math.max(this.boost, 0.7);
        this.shake = Math.max(this.shake, 0.35);
        break;
      case 'perk': // algo se abriu: levanta e olha para o jogador
        this.flash = 1;
        this.hopV = 3.4;
        this.boost = Math.max(this.boost, 0.8);
        this.lookPlayer = true;
        this.wanderT = 2.4;
        this.wy = 0;
        this.wp = 0.12;
        break;
      case 'joy':
        this.flash = 1;
        this.hopV = 4.2;
        this.boost = Math.max(this.boost, 1);
        this.wiggle = 1;
        this.lookPlayer = true;
        this.wanderT = 2.6;
        this.wy = 0;
        this.wp = 0.12;
        break;
      case 'shake': // errou: treme (aperta a boca)
        this.tic = 'press';
        this.ticOn = 0.9;
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

    // ── o rosto: boca, pálpebras, nariz, sobrancelhas (sempre neutro) ──
    const asleep = this.sleep > 0.6;
    // bocejo: uma vez, quando o sono chega
    if (this.sleep > 0.35 && !this.yawned) {
      this.yawned = true;
      this.yawn = 1.6;
    }
    if (this.sleep < 0.1) this.yawned = false;
    if (this.yawn > 0) this.yawn -= dt;
    // a fala: sílabas (abre e fecha em ritmo de escrita, com aberturas diferentes)
    if (i.talking && !asleep) {
      this.sylT -= dt;
      if (this.sylT <= 0) {
        this.sylT = 0.09 + Math.random() * 0.13;
        this.mouthGoal = this.mouthGoal > 0.2 ? (Math.random() < 0.35 ? 0.12 : 0) : 0.3 + Math.random() * 0.45; // sílabas de 1 a 3 px; o escancarado fica para o bocejo
      }
    } else if (this.yawn > 0) {
      const u = 1 - this.yawn / 1.6;
      this.mouthGoal = Math.sin(Math.PI * Math.min(1, u * 1.15)) * 1;
    } else if (this.mouthGoal > 0 && !(this.tic === 'part' && this.ticOn > 0)) {
      this.mouthGoal = Math.max(0, this.mouthGoal - dt * 1.5);
    }
    // gestos pequenos de quem está quieto: a boca desliza para o lado, aperta, entreabre (respira)
    if (!i.talking && awake && this.yawn <= 0) {
      this.ticT -= dt;
      if (this.ticT <= 0 && this.ticOn <= 0) {
        this.ticT = (2 + Math.random() * 4) * (i.busy ? 1.6 : 1);
        const r = Math.random();
        this.tic = r < 0.4 ? 'shift' : r < 0.7 ? 'press' : 'part';
        this.ticOn = 0.6 + Math.random() * 0.9;
        this.ticSide = Math.random() < 0.5 ? -1 : 1;
        if (this.tic === 'part') this.mouthGoal = 0.25;
      }
    }
    if (this.ticOn > 0) this.ticOn -= dt;
    const ticK = this.ticOn > 0 ? 1 : 0;
    const mxGoal = this.tic === 'shift' ? this.ticSide * ticK : 0;
    const mwGoal = i.talking ? 0 : this.tic === 'press' ? -ticK : this.yawn > 0 ? -0.6 : 0;
    this.mx += (mxGoal - this.mx) * Math.min(1, dt * 9);
    this.mw += (mwGoal - this.mw) * Math.min(1, dt * 9);
    // a boca: aproximação exponencial rápida (estável com qualquer taxa de quadros)
    this.mouth = clamp(this.mouth + (this.mouthGoal - this.mouth) * (1 - Math.exp(-dt * 24)), 0, 1);
    // nariz: uma fungada de vez em quando
    this.noseT -= dt;
    if (this.noseT <= 0 && awake) {
      this.noseT = 4 + Math.random() * 7;
      this.noseOn = 0.18;
      if (Math.random() < 0.35) this.noseT = 0.3; // duas fungadas seguidas
    }
    if (this.noseOn > 0) this.noseOn -= dt;
    const lively = !!i.lively;
    const free = awake && !i.talking && this.yawn <= 0 && this.sighS < 0;
    // OLHAR DE CANTO: só as íris correm até o canto do olho e ficam um tempo lá (o rosto não vira); a pálpebra de cima desce 1 px
    this.sideT -= dt;
    if (this.sideT <= 0 && free && this.glOn <= 0) {
      this.sideT = lively ? 5 + Math.random() * 6 : 8 + Math.random() * 10;
      this.sideOn = 0.8 + Math.random() * 1.1;
      this.sideDir = Math.random() < 0.5 ? -1 : 1;
      if (Math.random() < 0.5) this.blinkT = Math.min(this.blinkT, this.sideOn + 0.15); // às vezes pisca ao voltar
    }
    if (this.sideOn > 0) this.sideOn -= dt;
    if (!awake) this.sideOn = 0;
    this.sideK += ((this.sideOn > 0 ? this.sideDir : 0) - this.sideK) * Math.min(1, dt * 16); // o olho anda depressa e para
    // O OLHO DESCANSA: a pálpebra de cima desce um pouquinho por alguns segundos e volta (o olho muda de forma, sem mudar a expressão)
    this.relaxT -= dt;
    if (this.relaxT <= 0 && free) {
      this.relaxT = 6 + Math.random() * 8;
      this.relaxOn = 2 + Math.random() * 3;
    }
    if (this.relaxOn > 0) this.relaxOn -= dt;
    this.relaxK += ((this.relaxOn > 0 ? 1 : 0) - this.relaxK) * Math.min(1, dt * 3);
    // SOBRANCELHAS: de vez em quando uma delas (ou as duas) sobe 1 px e volta; a do lado para onde ele olha de canto sobe junto às vezes.
    // Elas só sobem e descem RETAS (nunca inclinam: inclinar é que faria cara de bravo ou de triste)
    this.browT -= dt;
    if (this.browT <= 0 && free) {
      this.browT = lively ? 3 + Math.random() * 4 : 4 + Math.random() * 6;
      this.browOn = 0.45 + Math.random() * 0.5;
      const r = Math.random();
      this.browSide = r < 0.35 ? -1 : r < 0.7 ? 1 : 0;
    }
    if (this.browOn > 0) this.browOn -= dt;
    const bOn = this.browOn > 0 ? 1 : 0;
    const sideBrow = this.sideOn > 0 && this.sideDir !== 0 ? 0.5 : 0;
    const blGoal = bOn * (this.browSide <= 0 ? 0.7 : 0) + (this.sideDir < 0 ? sideBrow : 0);
    const brGoal = bOn * (this.browSide >= 0 ? 0.7 : 0) + (this.sideDir > 0 ? sideBrow : 0);
    // O SUSPIRO: puxa o ar (o dado sobe e cresce um tiquinho, as sobrancelhas sobem, as narinas abrem) e solta devagar (desce, as pálpebras
    // caem um pouco, a boca entreabre 1 px). Leve, de vez em quando; não é tristeza nem cansaço, é só o dado respirando
    this.sighT -= dt;
    if (this.sighT <= 0 && free && !i.busy) {
      this.sighT = lively ? 14 + Math.random() * 14 : 24 + Math.random() * 26;
      this.sighS = 0;
    }
    let sighLid = 0;
    let sighBrow = 0;
    if (this.sighS >= 0) {
      const S = (this.sighS += dt);
      const ss = (a: number, b: number) => {
        const u = clamp((S - a) / (b - a), 0, 1);
        return u * u * (3 - 2 * u);
      };
      // o corpo: sobe até 1 em 0,9 s, desce até -0,5 em 2,1 s, volta a 0 em 2,7 s
      this.sighBody = S < 0.9 ? ss(0, 0.9) : S < 2.1 ? 1 - 1.5 * ss(0.9, 2.1) : -0.5 + 0.5 * ss(2.1, 2.7);
      if (S < 0.2) this.noseOn = Math.max(this.noseOn, 0.2);
      sighBrow = S < 0.9 ? 0.6 * ss(0, 0.6) : 0.6 - 1.1 * ss(0.9, 1.6) + 0.5 * ss(2.1, 2.7);
      sighLid = S < 0.9 ? 0 : 0.55 * ss(0.9, 1.5) * (1 - ss(2.0, 2.7));
      if (S > 1.0 && S < 1.9) this.mouthGoal = Math.max(this.mouthGoal, 0.22);
      if (S >= 2.7) {
        this.sighS = -1;
        this.sighBody = 0;
      }
    }
    this.bl += (clamp(blGoal + sighBrow * 0.6, -1, 1) - this.bl) * Math.min(1, dt * 12);
    this.br += (clamp(brGoal + sighBrow * 0.6, -1, 1) - this.br) * Math.min(1, dt * 12);
    // A ÍRIS: olhando para cima, para a luz forte do poço, ela se fecha um pouco
    this.irisK += ((i.glare && this.eyeY > 0.5 ? -1 : 0) - this.irisK) * Math.min(1, dt * 4);
    // pálpebras: piscar pela metade (descendo e subindo), foco quando quer muito alguma coisa, sono e bocejo
    const lidGoal = Math.max(this.lean * 0.5, clamp((this.sleep - 0.1) * 1.6, 0, 1), this.yawn > 0 ? 0.8 : 0, this.blink > 0.15 ? 0.7 : 0, this.sideK !== 0 ? Math.abs(this.sideK) * 0.34 : 0, this.relaxK * 0.34, sighLid);
    this.squint += (lidGoal - this.squint) * Math.min(1, dt * 10);
    this.flash = Math.max(0, this.flash - dt * 2.2);

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
    this.out.dy = this.hopY * 0.045 - this.droop * 0.07 - this.sleep * 0.05 + breathe + this.sighBody * 0.022 + (i.target ? clamp(i.target.dy, -1, 1) * 0.02 * this.lean : 0) * (0.2 + 0.8 * calm);
    this.out.scale = 1 + breathe * 0.6 - this.squash * 0.1 + this.lean * 0.04 + this.sighBody * 0.022;
    const eyelid = 1 - 0.85 * this.blink;
    this.out.glow = Math.max(0.05, (1 + this.boost + eagerPulse) * eyelid * (1 - 0.55 * this.sleep));
    // o olhar do rosto: os olhos acompanham o alvo; as sobrancelhas sobem com interesse, alegria e susto e descem com o cansaço
    this.out.look.x = clamp(this.eyeX, -1, 1);
    this.out.look.y = clamp(this.eyeY, -1, 1);
    this.out.look.brow = clamp(this.boost * 0.9 + this.lean * 0.8 + this.out.look.y * 0.5 - this.sleep * 0.8 - this.droop + this.flash * 1.2 + (this.yawn > 0 ? 0.6 : 0), -1, 1);
    this.out.look.closed = this.blink > 0.5 || this.sleep > 0.6;
    this.out.look.mouth = asleep && this.yawn <= 0 ? 0 : this.mouth;
    this.out.look.mx = this.mx;
    this.out.look.mw = this.mw;
    this.out.look.squint = this.squint;
    this.out.look.nose = this.noseOn > 0;
    this.out.look.bl = this.bl;
    this.out.look.br = this.br;
    this.out.look.side = this.sideK;
    this.out.look.iris = this.irisK;
    // rede de segurança: se algum número virar NaN, a vida reinicia em vez de contaminar o resto
    if (!Number.isFinite(this.out.dx + this.out.dy + this.out.scale + this.out.glow + this.q.x + this.q.y + this.q.z + this.q.w + this.eyeX + this.eyeY + this.out.look.brow)) {
      this.eyeX = this.eyeY = this.eyeVX = this.eyeVY = 0;
      this.gy = this.gp = this.vy = this.vp = this.hopY = this.hopV = this.shake = this.squash = this.boost = this.droop = this.wiggle = this.lean = 0;
      this.sighS = -1;
      this.sighBody = this.sideK = this.bl = this.br = this.irisK = 0;
      this.q.identity();
      this.out.dx = this.out.dy = 0;
      this.out.scale = this.out.glow = 1;
    }
    return this.out;
  }
}
