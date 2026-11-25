// O Escrivão: um ser FANTASMAGÓRICO, sem membros. Um manto só, fluido, que se alarga e se espalha pelo chão e se desfaz em névoa embaixo;
// um capuz com um vazio preto e dois brilhos fracos; duas mangas longas e vazias (nenhuma mão) feitas de pano simulado, que pendem, ondulam
// e se esticam. O que ele segura flutua na boca da manga. Transparência em PONTILHADO (`alphaHash`), o mesmo pontilhado do resto do jogo.
// Origem no chão; a frente é +z. `animate` recebe a pose desejada e o corpo chega nela com atraso (peso de pano, não de osso).

import * as THREE from 'three';

export interface ScribePose {
  walk?: number; // velocidade com que desliza (m/s); 0 = parado
  lean?: number; // 0 de pé (curvado) … 1 debruçado (o corpo dobra como pano)
  headYaw?: number; // para onde o capuz vira (rad, + = para a esquerda dele)
  headPitch?: number; // + = olha para baixo
  reach?: number; // 0..1 manga direita estendida à frente
  back?: number; // 0..1 manga direita volta para dentro do manto (de onde sai o dado)
  open?: number; // 0..1 a manga se abre e solta o que segura
  rest?: number; // 0..1 manga esquerda pousada à frente (na borda do poço)
  raise?: number; // 0..1 manga direita erguida ALTO, à frente e acima do capuz
}

export interface Scribe {
  group: THREE.Group;
  setAlpha(v: number): void;
  // compatível com a cena antiga (A Entrada): t = tempo; arm: 0 manga caída … 1 manga erguida escrevendo
  update(t: number, arm: number): void;
  animate(dt: number, t: number, pose: ScribePose): void;
  hand: THREE.Object3D; // a boca da manga direita (onde o dado flutua)
  head: THREE.Object3D; // o capuz (para a câmera mirar)
}

const H_BODY = 1.42; // altura do manto até a base do capuz
const HEM = 0.7; // raio da barra espalhada no chão

// gradiente vertical da opacidade: a barra é quase névoa, o peito é quase sólido
function fadeTexture() {
  const cv = document.createElement('canvas');
  cv.width = 2;
  cv.height = 32;
  const g = cv.getContext('2d')!;
  for (let y = 0; y < 32; y++) {
    const v = 1 - y / 31; // UV: v=0 embaixo (a barra), v=1 em cima
    const a = Math.min(1, 0.12 + Math.pow(v, 0.7) * 1.05);
    const c = Math.round(a * 255);
    g.fillStyle = `rgb(${c},${c},${c})`;
    g.fillRect(0, y, 2, 1);
  }
  const t = new THREE.CanvasTexture(cv);
  t.magFilter = THREE.NearestFilter;
  return t;
}

// textura da névoa (blocos de pixel com transparência em pontilhado)
function wispTexture() {
  const N = 24;
  const cv = document.createElement('canvas');
  cv.width = N;
  cv.height = N;
  const g = cv.getContext('2d')!;
  const img = g.createImageData(N, N);
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const d = Math.max(0, 1 - Math.hypot(x / N - 0.5, (y / N - 0.5) * 1.5) / 0.45);
      const on = d > (BAYER[(y % 4) * 4 + (x % 4)] / 16) * 0.85 + 0.08;
      const o = (y * N + x) * 4;
      img.data[o] = 200;
      img.data[o + 1] = 198;
      img.data[o + 2] = 220;
      img.data[o + 3] = on ? Math.round(40 + d * 80) : 0;
    }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeScribe(): Scribe {
  const group = new THREE.Group();
  const mats: { m: THREE.Material; base: number }[] = [];
  const fade = fadeTexture();
  const ghost = (color: number, emissive: number, opacity: number, fadeMap = false) => {
    const m = new THREE.MeshLambertMaterial({ color, emissive, transparent: false, alphaHash: true, opacity, side: THREE.DoubleSide, alphaMap: fadeMap ? fade : null });
    mats.push({ m, base: opacity });
    return m;
  };
  const robeMat = ghost(0x726c8c, 0x2a2338, 0.92, true);
  const mantleMat = ghost(0x5c5674, 0x221c30, 0.95);
  const hoodMat = ghost(0x5a5472, 0x201a2c, 0.97);
  const sleeveMat = ghost(0x6a6484, 0x261f34, 0.9);
  const voidMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  mats.push({ m: voidMat, base: 1 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffd98a, fog: false });
  mats.push({ m: eyeMat, base: 1 });

  // ── o MANTO: um só pano, do chão ao capuz. Os vértices guardam a forma em repouso e a cada quadro ondulam e se dobram ──
  const radiusAt = (y: number) => {
    // barra larga e rasa no chão → cintura → peito → ombros caídos
    if (y < 0.12) return HEM - (y / 0.12) * 0.16;
    if (y < 0.75) return 0.54 - ((y - 0.12) / 0.63) * 0.24;
    if (y < 1.2) return 0.3 + Math.sin(((y - 0.75) / 0.45) * Math.PI) * 0.03;
    return 0.3 - ((y - 1.2) / (H_BODY - 1.2)) * 0.18;
  };
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 22; i++) {
    const y = (i / 22) * H_BODY;
    prof.push(new THREE.Vector2(radiusAt(y), y));
  }
  const robeGeo = new THREE.LatheGeometry(prof, 28);
  const robe = new THREE.Mesh(robeGeo, robeMat);
  group.add(robe);
  const rp = robeGeo.attributes.position as THREE.BufferAttribute;
  const rest = Float32Array.from(rp.array as Float32Array);

  // capa curta sobre os ombros, com a barra em farrapos
  const mantleProf: THREE.Vector2[] = [];
  for (let i = 0; i <= 8; i++) {
    const k = i / 8;
    mantleProf.push(new THREE.Vector2(0.42 - k * 0.3, 0.98 + k * 0.42));
  }
  const mantleGeo = new THREE.LatheGeometry(mantleProf, 24);
  const mantle = new THREE.Mesh(mantleGeo, mantleMat);
  group.add(mantle);
  const mp = mantleGeo.attributes.position as THREE.BufferAttribute;
  const mRest = Float32Array.from(mp.array as Float32Array);
  const mRag = new Float32Array(mp.count).map((_, i) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1);

  // ── o capuz ──
  const head = new THREE.Group();
  group.add(head);
  const hood = new THREE.Group();
  head.add(hood);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), hoodMat);
  shell.scale.set(1, 1.25, 1.08);
  hood.add(shell);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.42, 10), hoodMat);
  tip.position.set(0, 0.22, -0.17);
  tip.rotation.x = -1.0;
  hood.add(tip);
  const hole = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 10), voidMat);
  hole.scale.set(0.92, 1.15, 0.65);
  hole.position.set(0, -0.02, 0.16);
  hood.add(hole);
  const brim = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 6, 16), hoodMat);
  brim.scale.set(0.95, 1.22, 1);
  brim.position.set(0, -0.02, 0.21);
  hood.add(brim);
  const eyes: THREE.Mesh[] = [];
  for (const x of [-0.048, 0.048]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.013, 0.01), eyeMat);
    e.position.set(x, 0.0, 0.245);
    hood.add(e);
    eyes.push(e);
  }

  // ── as MANGAS: corda de pano (verlet), presa no ombro; vazia na ponta (sem mão) ──
  const SEG = 7;
  interface Sleeve {
    side: 1 | -1;
    p: THREE.Vector3[];
    q: THREE.Vector3[]; // posições anteriores
    parts: THREE.Mesh[];
    cuff: THREE.Mesh;
    inner: THREE.Mesh;
  }
  const mkSleeve = (side: 1 | -1): Sleeve => {
    const p: THREE.Vector3[] = [];
    const q: THREE.Vector3[] = [];
    for (let i = 0; i <= SEG; i++) {
      p.push(new THREE.Vector3(side * 0.3, 1.25 - i * 0.12, 0.05));
      q.push(p[i].clone());
    }
    const parts: THREE.Mesh[] = [];
    for (let i = 0; i < SEG; i++) {
      const r0 = 0.075 + (i / SEG) * 0.06;
      const r1 = 0.075 + ((i + 1) / SEG) * 0.06;
      const g = new THREE.CylinderGeometry(r0, r1, 1, 8, 1, true);
      g.translate(0, -0.5, 0);
      const m = new THREE.Mesh(g, sleeveMat);
      group.add(m);
      parts.push(m);
    }
    // a boca da manga: um sino de pano, e dentro só escuro (nenhuma mão)
    const cuffGeo = new THREE.CylinderGeometry(0.135, 0.2, 0.16, 10, 1, true);
    cuffGeo.translate(0, -0.08, 0);
    const cuff = new THREE.Mesh(cuffGeo, sleeveMat);
    group.add(cuff);
    const inner = new THREE.Mesh(new THREE.CircleGeometry(0.15, 10), voidMat);
    group.add(inner);
    return { side, p, q, parts, cuff, inner };
  };
  const sleeveR = mkSleeve(-1);
  const sleeveL = mkSleeve(1);

  // o ponto onde o dado flutua: na boca da manga direita
  const hand = new THREE.Group();
  group.add(hand);

  // ── névoa em volta da barra e pó de giz caindo dele ──
  const wTex = wispTexture();
  const wisps: { s: THREE.Sprite; a: number; r: number; ph: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const m = new THREE.SpriteMaterial({ map: wTex, transparent: true, depthWrite: false, opacity: 0.85 });
    mats.push({ m, base: 0.85 });
    const s = new THREE.Sprite(m);
    s.scale.set(0.9, 0.45, 1);
    group.add(s);
    wisps.push({ s, a: (i / 7) * Math.PI * 2, r: 0.55 + (i % 3) * 0.12, ph: i * 1.3 });
  }
  const DUST = 40;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(DUST * 3);
  const dustLife = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) dustLife[i] = Math.random();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0xe8e2d0, size: 0.03, transparent: true, opacity: 0.8, depthWrite: false });
  mats.push({ m: dustMat, base: 0.8 });
  const dust = new THREE.Points(dustGeo, dustMat);
  group.add(dust);

  // ── estado animado ──
  const cur = { walk: 0, lean: 0, headYaw: 0, headPitch: 0, reach: 0, back: 0, open: 0, rest: 0, raise: 0 };
  const follow = (k: keyof typeof cur, target: number, rate: number, dt: number) => {
    cur[k] += (target - cur[k]) * (1 - Math.exp(-dt * rate));
  };
  const mix = (a: number, b: number, k: number) => a + (b - a) * k;
  let blinkT = 1.5;
  let blink = 0;
  let glanceT = 2;
  let glance = 0;
  let glanceTo = 0;

  // o corpo dobra como pano: acima da cintura, cada altura se desloca para a frente (e desce um pouco) conforme a inclinação
  const BEND0 = 0.55;
  const bendAt = (y: number, lean: number, out: THREE.Vector3) => {
    const k = Math.max(0, (y - BEND0) / (H_BODY - BEND0));
    const fwd = (0.12 + lean * 0.95) * k * k; // 0,12: sempre um pouco curvado
    out.set(0, y - lean * 0.38 * k * k, fwd);
    return out;
  };
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  const DOWN = new THREE.Vector3(0, -1, 0);
  const BACKZ = new THREE.Vector3(0, 0, -1);

  const stepSleeve = (sl: Sleeve, dt: number, t: number, anchor: THREE.Vector3, target: THREE.Vector3 | null, pull: number, len: number) => {
    const n = SEG;
    const segL = len / n;
    const damp = 0.9;
    const g = -2.2 * dt * dt * (1 - pull * 0.8); // pano leve: cai devagar
    for (let i = 1; i <= n; i++) {
      const p = sl.p[i];
      const q = sl.q[i];
      const vx = (p.x - q.x) * damp;
      const vy = (p.y - q.y) * damp;
      const vz = (p.z - q.z) * damp;
      q.copy(p);
      p.x += vx + Math.sin(t * 1.3 + i * 0.7 + sl.side) * 0.0006;
      p.y += vy + g;
      p.z += vz + Math.cos(t * 1.1 + i * 0.5) * 0.0005;
    }
    sl.p[0].copy(anchor);
    if (target && pull > 0.001) sl.p[n].lerp(target, Math.min(1, dt * 5 * pull)); // a ponta é puxada para o alvo (com atraso: é pano)
    for (let it = 0; it < 6; it++) {
      sl.p[0].copy(anchor);
      for (let i = 0; i < n; i++) {
        const a = sl.p[i];
        const b = sl.p[i + 1];
        tmp.subVectors(b, a);
        const d = tmp.length() || 1e-6;
        const diff = (d - segL) / d;
        if (i === 0) b.addScaledVector(tmp, -diff);
        else {
          a.addScaledVector(tmp, diff * 0.5);
          b.addScaledVector(tmp, -diff * 0.5);
        }
      }
      for (let i = 1; i <= n; i++) if (sl.p[i].y < 0.05) sl.p[i].y = 0.05; // não atravessa o chão
    }
    // malha: cada pedaço vai de p[i] a p[i+1]
    for (let i = 0; i < n; i++) {
      const a = sl.p[i];
      const b = sl.p[i + 1];
      tmp.subVectors(b, a);
      const d = tmp.length();
      const m = sl.parts[i];
      m.position.copy(a);
      m.quaternion.setFromUnitVectors(DOWN, tmp.normalize());
      m.scale.set(1, d, 1);
    }
    // a boca: continua a direção do último pedaço
    const last = sl.p[n];
    tmp.subVectors(last, sl.p[n - 1]).normalize();
    sl.cuff.position.copy(last);
    sl.cuff.quaternion.setFromUnitVectors(DOWN, tmp);
    sl.cuff.scale.setScalar(1 + cur.open * (sl.side < 0 ? 0.35 : 0));
    sl.inner.position.copy(last).addScaledVector(tmp, 0.1);
    sl.inner.quaternion.setFromUnitVectors(BACKZ, tmp);
    return tmp;
  };

  let bob = 0;
  const animate = (dt: number, t: number, P: ScribePose) => {
    dt = Math.min(dt, 0.05);
    follow('walk', P.walk ?? 0, 4, dt);
    follow('lean', P.lean ?? 0, 2.2, dt);
    follow('headYaw', P.headYaw ?? 0, 3, dt);
    follow('headPitch', P.headPitch ?? 0, 3, dt);
    follow('reach', P.reach ?? 0, 3.5, dt);
    follow('back', P.back ?? 0, 3.5, dt);
    follow('open', P.open ?? 0, 8, dt);
    follow('rest', P.rest ?? 0, 2.5, dt);
    follow('raise', P.raise ?? 0, 2.8, dt);
    const w = Math.min(1, cur.walk / 0.8);
    bob += dt * (1.2 + w * 1.6);
    const lift = 0.04 + Math.sin(bob) * 0.025; // flutua rente ao chão, respirando

    // manto: ondas que descem pelo pano; a barra se espalha e ondula no chão; deslizando, a barra fica para trás
    const arr = rp.array as Float32Array;
    for (let i = 0; i < rp.count; i++) {
      const x0 = rest[i * 3];
      const y0 = rest[i * 3 + 1];
      const z0 = rest[i * 3 + 2];
      const ang = Math.atan2(x0, z0);
      const low = 1 - Math.min(1, y0 / 0.8);
      const wave = Math.sin(ang * 3 + t * 1.6 - y0 * 5) * 0.025 * (0.4 + low) + Math.sin(ang * 7 - t * 2.3) * 0.05 * low * low;
      const rad = Math.hypot(x0, z0) || 1e-6;
      const rr = rad + wave + low * low * 0.06 * Math.sin(t * 0.9 + ang * 2);
      bendAt(y0, cur.lean, tmp2);
      arr[i * 3] = (x0 / rad) * rr;
      arr[i * 3 + 1] = tmp2.y + lift * (1 - low);
      arr[i * 3 + 2] = (z0 / rad) * rr + tmp2.z - low * low * w * 0.25;
    }
    rp.needsUpdate = true;
    robeGeo.computeVertexNormals();
    // capa: segue a dobra do corpo e balança os farrapos
    const ma = mp.array as Float32Array;
    for (let i = 0; i < mp.count; i++) {
      const x0 = mRest[i * 3];
      const y0 = mRest[i * 3 + 1];
      const z0 = mRest[i * 3 + 2];
      const ang = Math.atan2(x0, z0);
      bendAt(y0, cur.lean, tmp2);
      const tear = y0 < 1.0 ? -mRag[i] * 0.09 : 0; // pontas rasgadas
      const sway = 1 + Math.sin(ang * 5 + t * 2 + y0 * 3) * 0.04;
      ma[i * 3] = x0 * sway;
      ma[i * 3 + 1] = tmp2.y + tear + lift + Math.sin(ang * 6 + t * 2.4) * 0.012;
      ma[i * 3 + 2] = z0 * sway + tmp2.z;
    }
    mp.needsUpdate = true;
    mantleGeo.computeVertexNormals();

    // capuz: no topo do corpo dobrado; olha para o alvo, dá olhadas curtas; os brilhos piscam
    bendAt(H_BODY, cur.lean, tmp2);
    head.position.set(0, tmp2.y + 0.16 + lift, tmp2.z + 0.04);
    glanceT -= dt;
    if (glanceT < 0) {
      glanceT = 2 + Math.random() * 3.5;
      glanceTo = (Math.random() - 0.5) * 0.7 * (1 - cur.lean * 0.7);
    }
    glance += (glanceTo - glance) * (1 - Math.exp(-dt * 4));
    head.rotation.set(cur.headPitch + cur.lean * 0.9 + 0.1 + Math.sin(t * 0.9) * 0.03, cur.headYaw + glance + Math.sin(t * 0.6) * 0.04, Math.sin(t * 0.5) * 0.05, 'YXZ');
    blinkT -= dt;
    if (blinkT < 0) {
      blinkT = 2.2 + Math.random() * 3;
      blink = 1;
    }
    blink = Math.max(0, blink - dt * 7);
    const eyeH = 1 - Math.sin(Math.min(1, blink) * Math.PI);
    eyes.forEach((e) => (e.scale.y = Math.max(0.05, eyeH)));

    // mangas: presas nos ombros do corpo dobrado
    bendAt(1.24, cur.lean, tmp2);
    const shR = new THREE.Vector3(-0.28, tmp2.y + lift, tmp2.z + 0.02);
    const shL = new THREE.Vector3(0.28, tmp2.y + lift, tmp2.z + 0.02);
    // alvos da ponta (no espaço do corpo): para dentro do manto, à frente, erguida alto, pousada na borda
    const top = bendAt(H_BODY, cur.lean, new THREE.Vector3());
    let tgtR: THREE.Vector3 | null = null;
    let pullR = 0;
    if (cur.back > 0.02) {
      tgtR = new THREE.Vector3(-0.02, 0.95 + lift, bendAt(0.95, cur.lean, new THREE.Vector3()).z + 0.28);
      pullR = cur.back;
    }
    if (cur.reach > 0.02) {
      tgtR = new THREE.Vector3(-0.15, 1.15, top.z + 0.95);
      pullR = Math.max(pullR, cur.reach);
    }
    if (cur.raise > 0.02) {
      tgtR = new THREE.Vector3(-0.05, top.y + 0.9, top.z + 0.85);
      pullR = Math.max(pullR, cur.raise);
    }
    const lenR = mix(0.95, 1.65, Math.max(cur.reach, cur.raise)); // fantasma: a manga se ESTICA
    const dirR = stepSleeve(sleeveR, dt, t, shR, tgtR, pullR, lenR);
    hand.position.copy(sleeveR.p[SEG]).addScaledVector(dirR, 0.46 + Math.sin(t * 2.2) * 0.035); // o dado FLUTUA um pouco além da boca da manga
    hand.quaternion.setFromUnitVectors(UP, UP);
    const tgtL = cur.rest > 0.02 ? new THREE.Vector3(0.22, 0.85, top.z + 0.65) : null;
    stepSleeve(sleeveL, dt, t, shL, tgtL, cur.rest, mix(0.95, 1.2, cur.rest));

    // névoa em volta da barra
    for (const wp of wisps) {
      wp.a += dt * (0.15 + w * 0.4);
      wp.s.position.set(Math.sin(wp.a) * wp.r, 0.12 + Math.sin(t * 0.8 + wp.ph) * 0.06, Math.cos(wp.a) * wp.r - w * 0.3);
    }
    // pó de giz: cai do manto e some
    const dp = dustGeo.attributes.position as THREE.BufferAttribute;
    const da = dp.array as Float32Array;
    for (let i = 0; i < DUST; i++) {
      dustLife[i] += dt * 0.35;
      if (dustLife[i] > 1) dustLife[i] -= 1;
      const L = dustLife[i];
      const a = i * 2.399;
      const r0 = 0.22 + (i % 5) * 0.05;
      bendAt(1.1 - (i % 4) * 0.15, cur.lean, tmp2);
      da[i * 3] = Math.sin(a) * r0 + Math.sin(t + i) * 0.03;
      da[i * 3 + 1] = tmp2.y - L * 1.1;
      da[i * 3 + 2] = Math.cos(a) * r0 + tmp2.z;
    }
    dp.needsUpdate = true;
  };

  let lastT = -1;
  return {
    group,
    hand,
    head,
    animate,
    setAlpha(v) {
      const a = Math.max(0, Math.min(1, v));
      group.visible = a > 0.01;
      for (const { m, base } of mats) {
        m.opacity = base * a;
        if (m instanceof THREE.MeshBasicMaterial) m.transparent = a < 0.99;
      }
    },
    update(t, arm) {
      // a cena antiga (A Entrada): parado, com a manga direita erguida escrevendo na parede
      const dt = lastT < 0 ? 0.016 : Math.min(0.1, Math.max(0, t - lastT));
      lastT = t;
      animate(dt, t, { reach: arm * 0.8 });
    },
  };
}
