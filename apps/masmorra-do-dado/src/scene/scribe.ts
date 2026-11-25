// O Escrivão: uma criatura encapuzada e decrépita, de rosto coberto (só o vazio do capuz, com dois brilhos fracos que piscam).
// Feito à mão com formas simples, no mesmo estilo do resto do jogo (nada de arquivos de modelo), mas com um ESQUELETO de verdade:
// pés que pisam, quadril que sobe e desce, coluna curvada que se inclina e respira, cabeça que olha, braços com cotovelo e dedos.
// Origem nos pés; a frente é +z. `animate` recebe a pose desejada e o corpo chega nela com suavidade (peso, atraso, respiração).

import * as THREE from 'three';

export interface ScribePose {
  walk?: number; // velocidade de caminhada (m/s); 0 = parado
  lean?: number; // 0 de pé (corcunda) … 1 debruçado (sobre o poço)
  headYaw?: number; // para onde a cabeça vira (rad, + = para a esquerda dele)
  headPitch?: number; // + = olha para baixo
  reach?: number; // 0..1 braço direito estendido para a frente (oferecendo / soltando)
  back?: number; // 0..1 mão direita vai às costas, dentro do manto
  open?: number; // 0..1 dedos da mão direita abertos (soltar)
  rest?: number; // 0..1 mão esquerda apoiada à frente (na borda do poço)
}

export interface Scribe {
  group: THREE.Group;
  setAlpha(v: number): void;
  // compatível com a cena antiga (A Entrada): t = tempo; arm: 0 braço caído … 1 braço erguido escrevendo
  update(t: number, arm: number): void;
  animate(dt: number, t: number, pose: ScribePose): void;
  hand: THREE.Object3D; // a palma da mão direita (onde o dado fica preso)
  head: THREE.Object3D; // o capuz (para a câmera mirar)
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeScribe(): Scribe {
  const group = new THREE.Group();
  const mats: THREE.Material[] = [];
  const cloth = (color: number, emissive = 0x120d18) => {
    const m = new THREE.MeshLambertMaterial({ color, emissive, transparent: true, side: THREE.DoubleSide });
    mats.push(m);
    return m;
  };
  const robeMat = cloth(0x4a4256, 0x1c1626);
  const robeDark = cloth(0x3a3346, 0x15101d);
  const hoodMat = cloth(0x3b3446, 0x16111f);
  const boneMat = cloth(0xb9b09b, 0x1e1a14);
  const bootMat = cloth(0x262029, 0x0c090e);
  const voidMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true });
  mats.push(voidMat);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, fog: false });
  mats.push(eyeMat);
  const r = rng(11);

  // ── pés (aparecem sob a barra quando ele anda) ──
  const mkFoot = (x: number) => {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.24), bootMat);
    f.position.set(x, 0.035, 0.03);
    group.add(f);
    return f;
  };
  const footL = mkFoot(0.11);
  const footR = mkFoot(-0.11);

  // ── quadril: a saia do manto (barra rasgada) e as tiras de pano ──
  const hips = new THREE.Group();
  group.add(hips);
  const skirtProf: [number, number][] = [[0.0, 0.04], [0.44, 0.04], [0.42, 0.16], [0.35, 0.52], [0.28, 0.88], [0.24, 1.0], [0.0, 1.0]];
  const skirtGeo = new THREE.LatheGeometry(skirtProf.map(([rr, y]) => new THREE.Vector2(rr, y)), 16);
  const sp = skirtGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const y = sp.getY(i);
    if (y < 0.2) {
      sp.setY(i, y + r() * 0.16); // barra rasgada: pontas e falhas
      sp.setX(i, sp.getX(i) * (0.92 + r() * 0.16));
    }
  }
  skirtGeo.computeVertexNormals();
  const skirt = new THREE.Mesh(skirtGeo, robeMat);
  hips.add(skirt);
  const rags: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.1 + r() * 0.06, 0.3 + r() * 0.25), robeDark);
    m.geometry.translate(0, -0.12, 0);
    m.position.set(Math.sin(a) * 0.44, 0.2, Math.cos(a) * 0.44);
    m.rotation.y = a;
    hips.add(m);
    rags.push(m);
  }
  // cinto de corda
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.025, 5, 14), robeDark);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.9;
  hips.add(belt);

  // ── coluna (corcunda): tronco, ombros e cabeça penduram dela ──
  const spine = new THREE.Group();
  spine.position.set(0, 0.92, 0);
  hips.add(spine);
  const torsoProf: [number, number][] = [[0.0, 0.0], [0.25, 0.0], [0.28, 0.16], [0.27, 0.36], [0.2, 0.52], [0.0, 0.58]];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoProf.map(([rr, y]) => new THREE.Vector2(rr, y)), 14), robeMat);
  torso.scale.set(1, 1, 0.9);
  spine.add(torso);
  // a corcova nas costas
  const hump = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), robeMat);
  hump.position.set(0, 0.4, -0.12);
  hump.scale.set(1.15, 0.9, 0.8);
  spine.add(hump);

  // capuz: casca alongada com ponta caída para trás; o "rosto" é um vazio preto com dois brilhos fracos
  const neck = new THREE.Group();
  neck.position.set(0, 0.5, 0.07);
  spine.add(neck);
  const hood = new THREE.Group();
  hood.position.set(0, 0.13, 0.02);
  neck.add(hood);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 12), hoodMat);
  shell.scale.set(1, 1.2, 1.05);
  hood.add(shell);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 10), hoodMat);
  tip.position.set(0, 0.2, -0.15);
  tip.rotation.x = -0.9;
  hood.add(tip);
  const hole = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), voidMat);
  hole.scale.set(0.92, 1.12, 0.65);
  hole.position.set(0, -0.01, 0.15);
  hood.add(hole);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 6, 14), hoodMat);
  rim.scale.set(0.95, 1.2, 1);
  rim.position.set(0, -0.01, 0.2);
  hood.add(rim);
  const eyes: THREE.Mesh[] = [];
  for (const x of [-0.045, 0.045]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.012, 0.01), eyeMat);
    e.position.set(x, 0.01, 0.24);
    hood.add(e);
    eyes.push(e);
  }

  // braços: ombro → manga de cima → cotovelo → manga de baixo → mão (osso) → dedos
  const mkArm = (side: 1 | -1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.27, 0.42, 0.02);
    spine.add(shoulder);
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.1, 0.36, 8), robeMat);
    upper.position.y = -0.17;
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.34;
    shoulder.add(elbow);
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.075, 0.32, 8), robeMat); // a manga alarga no punho
    lower.position.y = -0.15;
    elbow.add(lower);
    const wrist = new THREE.Group();
    wrist.position.y = -0.33;
    elbow.add(wrist);
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.08, 0.035), boneMat);
    palm.position.y = -0.04;
    wrist.add(palm);
    const fingers = new THREE.Group();
    fingers.position.set(0, -0.08, 0);
    wrist.add(fingers);
    for (let i = 0; i < 4; i++) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.11, 0.014), boneMat);
      f.geometry.translate(0, -0.055, 0);
      f.position.set((i - 1.5) * 0.02, 0, 0.004);
      f.rotation.z = (i - 1.5) * 0.08;
      fingers.add(f);
    }
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.07, 0.014), boneMat);
    thumb.geometry.translate(0, -0.035, 0);
    thumb.position.set(-side * 0.045, -0.03, 0.02);
    thumb.rotation.z = -side * 0.6;
    wrist.add(thumb);
    return { shoulder, elbow, wrist, fingers };
  };
  const armL = mkArm(1);
  const armR = mkArm(-1);
  // toco de giz na mão esquerda (ele é o Escrivão)
  const chalkMat = new THREE.MeshBasicMaterial({ color: 0xf1ebd9, transparent: true });
  mats.push(chalkMat);
  const chalk = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.09), chalkMat);
  chalk.position.set(0, -0.1, 0.04);
  armL.wrist.add(chalk);
  // ponto onde o dado fica preso na palma direita
  const hand = new THREE.Group();
  hand.position.set(0, -0.13, 0.05);
  armR.wrist.add(hand);

  // ── estado animado (cada valor persegue o alvo com atraso, como um corpo com peso) ──
  const cur = { walk: 0, lean: 0, headYaw: 0, headPitch: 0, reach: 0, back: 0, open: 0, rest: 0 };
  let phase = 0;
  let blinkT = 1.5;
  let blink = 0;
  let glanceT = 2;
  let glance = 0;
  let glanceTo = 0;
  const follow = (k: keyof typeof cur, target: number, rate: number, dt: number) => {
    cur[k] += (target - cur[k]) * (1 - Math.exp(-dt * rate));
  };
  const mix = (a: number, b: number, k: number) => a + (b - a) * k;

  const animate = (dt: number, t: number, P: ScribePose) => {
    follow('walk', P.walk ?? 0, 6, dt);
    follow('lean', P.lean ?? 0, 2.6, dt);
    follow('headYaw', P.headYaw ?? 0, 3.5, dt);
    follow('headPitch', P.headPitch ?? 0, 3.5, dt);
    follow('reach', P.reach ?? 0, 4.2, dt);
    follow('back', P.back ?? 0, 4.5, dt);
    follow('open', P.open ?? 0, 9, dt);
    follow('rest', P.rest ?? 0, 3, dt);
    const w = Math.min(1, cur.walk / 0.8); // quanto está andando
    phase += dt * (cur.walk / 0.95) * Math.PI; // um passo a cada ~0,95 m
    const s = Math.sin(phase);
    const c = Math.cos(phase);
    const breathe = Math.sin(t * 1.25);

    // pés: um de cada vez, levantando a ponta
    footL.position.z = 0.03 + s * 0.17 * w;
    footL.position.y = 0.035 + Math.max(0, c) * 0.07 * w;
    footL.rotation.x = -Math.max(0, c) * 0.35 * w;
    footR.position.z = 0.03 - s * 0.17 * w;
    footR.position.y = 0.035 + Math.max(0, -c) * 0.07 * w;
    footR.rotation.x = -Math.max(0, -c) * 0.35 * w;
    // quadril: sobe e desce a cada passo, balança de um lado para o outro (o peso passa de um pé ao outro)
    hips.position.y = Math.abs(s) * 0.035 * w - 0.02 * w + breathe * 0.004;
    hips.rotation.z = s * 0.05 * w;
    hips.rotation.y = s * 0.07 * w;
    skirt.rotation.x = Math.sin(phase * 2) * 0.03 * w;
    rags.forEach((m, i) => (m.rotation.x = Math.sin(t * 1.4 + i * 1.7) * 0.07 + Math.sin(phase + i) * 0.2 * w));

    // coluna: corcunda, respira, inclina ao andar e ao se debruçar; gira um pouco quando a mão vai às costas
    spine.rotation.x = 0.3 + cur.lean * 0.8 + w * 0.1 + breathe * 0.02;
    spine.rotation.z = -hips.rotation.z * 0.7;
    spine.rotation.y = -hips.rotation.y * 0.6 - cur.back * 0.35;
    spine.scale.y = 1 + breathe * 0.012;

    // cabeça: segue o alvo e, parada, dá olhadas curtas para os lados (está viva, atenta)
    glanceT -= dt;
    if (glanceT < 0) {
      glanceT = 2 + Math.random() * 3.5;
      glanceTo = (Math.random() - 0.5) * 0.7 * (1 - cur.lean * 0.7);
    }
    glance += (glanceTo - glance) * (1 - Math.exp(-dt * 5));
    neck.rotation.y = cur.headYaw + glance * (1 - w * 0.6) + Math.sin(t * 0.7) * 0.03;
    neck.rotation.x = cur.headPitch + cur.lean * 0.35 - 0.12 + Math.sin(t * 0.9) * 0.025 + Math.abs(s) * 0.03 * w;
    neck.rotation.z = Math.sin(t * 0.5) * 0.04;
    // os brilhos no fundo do capuz piscam
    blinkT -= dt;
    if (blinkT < 0) {
      blinkT = 2.2 + Math.random() * 3;
      blink = 1;
    }
    blink = Math.max(0, blink - dt * 7);
    const eyeH = 1 - Math.sin(Math.min(1, blink) * Math.PI);
    eyes.forEach((e) => (e.scale.y = Math.max(0.05, eyeH)));

    // braço esquerdo: balança ao andar; com `rest` apoia a mão à frente (na borda)
    armL.shoulder.rotation.x = mix(-s * 0.32 * w + 0.05, -0.9, cur.rest);
    armL.shoulder.rotation.z = mix(0.08, 0.15, cur.rest);
    armL.elbow.rotation.x = mix(-0.35 - Math.max(0, s) * 0.3 * w, -0.5, cur.rest);
    armL.fingers.rotation.x = 0.7;

    // braço direito: balança; vai às costas (dentro do manto); estende-se para a frente; os dedos fecham/abrem
    let sx = s * 0.32 * w + 0.05;
    let sz = -0.08;
    let ex = -0.35 - Math.max(0, -s) * 0.3 * w;
    sx = mix(sx, 0.85, cur.back);
    sz = mix(sz, -0.45, cur.back);
    ex = mix(ex, -1.5, cur.back);
    sx = mix(sx, -1.35, cur.reach);
    sz = mix(sz, -0.05, cur.reach);
    ex = mix(ex, -0.12, cur.reach);
    armR.shoulder.rotation.set(sx + Math.sin(t * 1.1) * 0.02, 0, sz);
    armR.elbow.rotation.x = ex;
    armR.wrist.rotation.x = mix(0.1, 0.5, cur.reach); // a palma vira para baixo, sobre o poço
    armR.fingers.rotation.x = mix(0.9, -0.25, cur.open);
  };

  let lastT = -1;
  let alpha = 1;
  return {
    group,
    hand,
    head: hood,
    animate,
    setAlpha(v) {
      alpha = Math.max(0, Math.min(1, v));
      group.visible = alpha > 0.01;
      for (const m of mats) {
        m.opacity = alpha;
        m.depthWrite = alpha > 0.98;
      }
    },
    update(t, arm) {
      // a cena antiga (A Entrada): parado, com o braço direito erguido escrevendo na parede
      const dt = lastT < 0 ? 0.016 : Math.min(0.1, Math.max(0, t - lastT));
      lastT = t;
      animate(dt, t, { reach: arm * 0.75, open: 0 });
      armR.elbow.rotation.x += Math.sin(t * 9) * 0.1 * arm; // traços curtos
      void alpha;
    },
  };
}
