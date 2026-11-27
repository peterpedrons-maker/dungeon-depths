// O Escrivão ANIMADO (DESIGN.md §70). É o mesmo Escrivão de `scribe.ts`, assado numa malha só (`tools/escrivao_mixamo.ts`), com esqueleto e
// animações feitos no Mixamo pelo Pedro: "Start Walking" (andar) e "Standing Torch Inspect Downward" (olhar para baixo). Arquivo:
// `public/models/escrivao.glb` (gerado por `tools/escrivao_glb.py`).
//
// A interface é a mesma do Escrivão de código (`Scribe`): as cenas não mudam. O que cada parte da pose faz aqui:
// · walk  → o ciclo de passos recortado de dentro do "Start Walking" (a raiz não anda: quem move o Escrivão é o jogo), na velocidade pedida;
// · lean  → o "olhar para baixo" do começo até ele estar debruçado (0 = de pé, 1 = debruçado); parado, um vaivém lento no fundo da pose;
// · rest  → a mão esquerda pousada na borda à frente (a animação original segura uma tocha com essa mão: aqui ela fica sempre por código);
// · back / raise / reach → a mão direita vai às costas (para dentro do manto), sobe alta à frente ou se estende (dois ossos, por código);
// · open  → a mão direita se inclina e o que estava nela cai; headYaw / headPitch somam um giro à cabeça.
// Enquanto o arquivo não chega (ou se falhar), quem aparece é o Escrivão de código; `?escrivao=antigo` usa sempre o de código.
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { makeScribe, type Scribe, type ScribePose } from './scribe';

export const SCRIBE_RIG = typeof location === 'undefined' || new URLSearchParams(location.search).get('escrivao') !== 'antigo';

let rigP: Promise<GLTF | null> | null = null;
// começa a baixar já (a cena do poço acontece logo no começo do jogo)
export function preloadScribeRig() {
  if (!SCRIBE_RIG) return Promise.resolve(null);
  if (!rigP) {
    const base = (import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL;
    rigP = new Promise((res) =>
      new GLTFLoader().load(`${base}models/escrivao.glb`, res, undefined, () => {
        console.warn('Escrivão animado: o arquivo não carregou; fica o de código');
        res(null);
      }),
    );
  }
  return rigP;
}

// ── os recortes das animações (medidos no arquivo; ver DESIGN.md §70) ──
// O ciclo de passos estável: 1,067 s … 2,551 s do "Start Walking". O período do passo é ~1,48 s (achado por busca: é o recorte em que a pose do
// fim mais se parece com a do começo; o antigo, 1,15 + 1,333 s, era curto demais e as pernas pulavam de fase a cada volta).
const WALK_A = 1.067;
const WALK_L = 1.484;
const SEAM = 0.35; // os últimos 0,35 s do ciclo se fundem com o começo dele (a volta não dá pulo)
// no "olhar para baixo", aos 1,78 s ele já está debruçado e quase parado (depois varre de um lado ao outro e levanta); parado debruçado, um
// vaivém lento dentro deste trecho
const LOOK_SWAY: [number, number] = [1.78, 2.35];
const IDLE_T = 0.2; // a pose de pé, do começo do "Start Walking"
// os olhos do Escrivão de código (mesmas medidas do modelo assado: mesma origem, pose A)
const EYES: [number, number, number][] = [
  [-0.077, 1.703, 0.17],
  [0.067, 1.703, 0.175],
];
const EYE_S = 0.042;

// (os tipos do three não mostram o `createInterpolant` das trilhas, que existe)
const interp = (tr: THREE.KeyframeTrack) => (tr as unknown as { createInterpolant(): THREE.Interpolant }).createInterpolant();
// o ciclo de passos: recorte, costura e a raiz parada (só o balanço de lado e de altura ficam)
function walkLoop(src: THREE.AnimationClip) {
  const fps = 30;
  const n = Math.round(WALK_L * fps);
  const tracks: THREE.KeyframeTrack[] = [];
  let speed = 0.8;
  // quanto o quadril anda para a frente num ciclo (no arquivo, a frente é o eixo y do osso da raiz)
  const hipsTr = src.tracks.find((tr) => tr.name.endsWith('Hips.position'));
  const stride = hipsTr ? (interp(hipsTr).evaluate(WALK_A + WALK_L) as ArrayLike<number>)[1] - (interp(hipsTr).evaluate(WALK_A) as ArrayLike<number>)[1] : 0;
  for (const tr of src.tracks) {
    if (tr.name.endsWith('.scale')) continue;
    const f = interp(tr);
    const size = tr.getValueSize();
    const times = new Float32Array(n + 1);
    const vals = new Float32Array((n + 1) * size);
    const isQ = tr.name.endsWith('.quaternion');
    const qa = new THREE.Quaternion();
    const qb = new THREE.Quaternion();
    for (let i = 0; i <= n; i++) {
      const t = WALK_A + (i / n) * WALK_L;
      times[i] = (i / n) * WALK_L;
      const v = Array.from(f.evaluate(t) as ArrayLike<number>);
      const k = THREE.MathUtils.smoothstep((t - (WALK_A + WALK_L - SEAM)) / SEAM, 0, 1);
      if (k > 0) {
        const w = Array.from(f.evaluate(t - WALK_L) as ArrayLike<number>);
        // O QUADRIL do ciclo anterior está um passo inteiro atrás: soma o passo antes de misturar. (Sem isso, na costura o corpo escorregava
        // ~1,1 m para trás e, na volta do ciclo, pulava de novo para a frente num quadro só: o "travando" que o Pedro viu, DESIGN.md §78.)
        if (tr === hipsTr) w[1] += stride;
        if (isQ) {
          qa.fromArray(v);
          qb.fromArray(w);
          if (qa.dot(qb) < 0) qb.set(-qb.x, -qb.y, -qb.z, -qb.w);
          qa.slerp(qb, k).toArray(v);
        } else for (let c = 0; c < size; c++) v[c] += (w[c] - v[c]) * k;
      }
      vals.set(v, i * size);
    }
    if (tr.name.endsWith('Hips.position')) {
      // (no arquivo, a frente do corpo é o eixo y do osso da raiz: tira o avanço e centra o corpo sobre a origem)
      const y0 = vals[1];
      const y1 = (Array.from(f.evaluate(WALK_A + WALK_L) as ArrayLike<number>) as number[])[1];
      speed = Math.abs(y1 - y0) / WALK_L;
      let mean = 0;
      for (let i = 0; i <= n; i++) {
        vals[i * 3 + 1] -= ((y1 - y0) * i) / n;
        mean += vals[i * 3 + 1];
      }
      mean /= n + 1;
      const idleY = (Array.from(f.evaluate(IDLE_T) as ArrayLike<number>) as number[])[1];
      for (let i = 0; i <= n; i++) vals[i * 3 + 1] += idleY - mean;
    }
    tracks.push(isQ ? new THREE.QuaternionKeyframeTrack(tr.name, times, vals) : new THREE.VectorKeyframeTrack(tr.name, times, vals));
  }
  return { clip: new THREE.AnimationClip('passos', WALK_L, tracks), speed };
}
// um quadro só de uma animação (a pose de pé)
function stillClip(src: THREE.AnimationClip, t: number, name: string) {
  const tracks = src.tracks
    .filter((tr) => !tr.name.endsWith('.scale'))
    .map((tr) => {
      const v = Array.from(interp(tr).evaluate(t) as ArrayLike<number>);
      // (dois quadros iguais: com duração zero, o relógio da ação vira NaN e o esqueleto se desfaz)
      return tr.name.endsWith('.quaternion') ? new THREE.QuaternionKeyframeTrack(tr.name, [0, 1], [...v, ...v]) : new THREE.VectorKeyframeTrack(tr.name, [0, 1], [...v, ...v]);
    });
  return new THREE.AnimationClip(name, 1, tracks);
}

// dois ossos (braço e antebraço) apontados para que a mão chegue em `target` (mundo); `pole` puxa o cotovelo para o lado certo.
// O resultado é misturado com a pose da animação por `w`.
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _d = new THREE.Vector3();
const _e = new THREE.Vector3();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _q3 = new THREE.Quaternion();
function aimBone(bone: THREE.Bone, from: THREE.Vector3, to: THREE.Vector3) {
  // gira o osso (no mundo) para que a direção `from` vire `to`, e devolve isso em coordenadas do pai
  _q.setFromUnitVectors(from, to);
  bone.getWorldQuaternion(_q2);
  _q2.premultiply(_q);
  bone.parent!.getWorldQuaternion(_q3);
  bone.quaternion.copy(_q3.invert().multiply(_q2));
  bone.updateMatrixWorld(true);
}
function twoBoneIK(up: THREE.Bone, low: THREE.Bone, end: THREE.Bone, target: THREE.Vector3, pole: THREE.Vector3, w: number) {
  if (w <= 0.001) return;
  const keepU = up.quaternion.clone();
  const keepL = low.quaternion.clone();
  up.getWorldPosition(_a);
  low.getWorldPosition(_b);
  end.getWorldPosition(_c);
  const l1 = _a.distanceTo(_b);
  const l2 = _b.distanceTo(_c);
  _d.subVectors(target, _a);
  const dist = THREE.MathUtils.clamp(_d.length(), Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
  _d.normalize();
  const cosA = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist);
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  _p.subVectors(pole, _a);
  _p.addScaledVector(_d, -_p.dot(_d));
  if (_p.lengthSq() < 1e-6) _p.set(0, -1, 0);
  _p.normalize();
  const elbow = _e.copy(_a).addScaledVector(_d, l1 * cosA).addScaledVector(_p, l1 * sinA);
  aimBone(up, _b.sub(_a).normalize(), elbow.clone().sub(_a).normalize());
  low.getWorldPosition(_b);
  end.getWorldPosition(_c);
  const want = _a.copy(_d).multiplyScalar(dist).add(up.getWorldPosition(new THREE.Vector3())).sub(_b).normalize();
  aimBone(low, _c.sub(_b).normalize(), want);
  if (w < 0.999) {
    up.quaternion.copy(keepU.slerp(up.quaternion, w));
    low.quaternion.copy(keepL.slerp(low.quaternion, w));
    up.updateMatrixWorld(true);
  }
}

export function makeScribeRig(o: { fog?: boolean } = {}): Scribe & { ready: Promise<boolean> } {
  const fallback = makeScribe();
  if (!SCRIBE_RIG) return { ...fallback, ready: Promise.resolve(false) };
  const group = new THREE.Group();
  group.add(fallback.group);
  fallback.group.visible = true;
  // as âncoras que as cenas usam (o dado na mão, a câmera mirando o capuz): ficam no Escrivão de código até o modelo chegar
  const hand = new THREE.Group();
  const head = new THREE.Group();
  fallback.hand.add(hand);
  fallback.head.add(head);
  let alpha = 1;
  const mats: THREE.Material[] = [];
  let rig: null | {
    root: THREE.Object3D;
    mixer: THREE.AnimationMixer;
    walk: THREE.AnimationAction;
    idle: THREE.AnimationAction;
    look: THREE.AnimationAction;
    walkSpeed: number;
    lookDur: number;
    b: Record<string, THREE.Bone>;
    touched: THREE.Bone[];
    base: THREE.Quaternion[];
  } = null;
  const applyAlpha = () => {
    group.visible = alpha > 0.01;
    for (const m of mats) {
      m.opacity = alpha;
      m.transparent = alpha < 0.99 || (m as THREE.MeshBasicMaterial).blending === THREE.AdditiveBlending;
      m.depthWrite = alpha > 0.98 && (m as THREE.MeshBasicMaterial).blending !== THREE.AdditiveBlending;
    }
  };

  const ready = preloadScribeRig().then((g) => {
    if (!g) return false;
    const root = cloneSkinned(g.scene);
    const b: Record<string, THREE.Bone> = {};
    root.traverse((x) => {
      if ((x as THREE.Bone).isBone) b[x.name.replace('mixamorig', '')] = x as THREE.Bone;
      const m = x as THREE.SkinnedMesh;
      if (!m.isMesh) return;
      const sm = m.material as THREE.MeshStandardMaterial;
      if (sm.map) {
        sm.map.magFilter = THREE.NearestFilter;
        sm.map.minFilter = THREE.NearestFilter;
        sm.map.generateMipmaps = false;
        sm.map.needsUpdate = true;
      }
      // (como no Escrivão de código: o pano tem um brilho próprio de ~25% da cor, para a silhueta não sumir no escuro)
      const lm = new THREE.MeshLambertMaterial({ map: sm.map, emissive: 0xffffff, emissiveMap: sm.map, emissiveIntensity: 0.25, side: THREE.DoubleSide, fog: o.fog ?? true });
      m.material = lm;
      mats.push(lm);
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false; // (a caixa do esqueleto parado não acompanha a animação)
    });
    if (!b.Head || !b.RightHand || !b.LeftHand) return false;
    root.updateMatrixWorld(true);
    // os olhos quadrados acesos e o halo deles, presos ao osso da cabeça (posições da pose de ligação = as do Escrivão de código)
    const eyeM = new THREE.MeshBasicMaterial({ color: 0xfff2cc, fog: false });
    const haloCv = document.createElement('canvas');
    haloCv.width = haloCv.height = 16;
    {
      const gx = haloCv.getContext('2d')!;
      const img = gx.createImageData(16, 16);
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          const d = Math.hypot(x - 7.5, y - 7.5) / 8;
          const k = (y * 16 + x) * 4;
          img.data.set([255, 200, 120, Math.round(255 * Math.max(0, 1 - d) ** 2 * 0.75)], k);
        }
      gx.putImageData(img, 0, 0);
    }
    const haloT = new THREE.CanvasTexture(haloCv);
    haloT.magFilter = haloT.minFilter = THREE.NearestFilter;
    const haloM = new THREE.MeshBasicMaterial({ map: haloT, transparent: true, opacity: 0.9, depthWrite: false, fog: false, blending: THREE.AdditiveBlending });
    mats.push(eyeM, haloM);
    const hb = b.Head;
    const inv = new THREE.Matrix4().copy(hb.matrixWorld).invert();
    const hs = hb.getWorldScale(new THREE.Vector3());
    for (const [x, y, z] of EYES) {
      const e = new THREE.Mesh(new THREE.BoxGeometry(EYE_S, EYE_S, EYE_S * 0.4), eyeM);
      e.position.set(x, y, z).applyMatrix4(inv);
      e.scale.set(1 / hs.x, 1 / hs.y, 1 / hs.z);
      hb.add(e);
      const h = new THREE.Mesh(new THREE.PlaneGeometry(EYE_S * 3.2, EYE_S * 3.2), haloM);
      h.position.set(x, y, z + 0.012).applyMatrix4(inv);
      h.quaternion.copy(hb.getWorldQuaternion(new THREE.Quaternion()).invert());
      h.scale.copy(e.scale);
      hb.add(h);
    }
    // a âncora do capuz (para a câmera): entre os olhos, um pouco para trás
    hb.add(head);
    head.position.set(0, 1.7, 0.1).applyMatrix4(inv);
    head.scale.set(1 / hs.x, 1 / hs.y, 1 / hs.z);
    head.quaternion.copy(hb.getWorldQuaternion(new THREE.Quaternion()).invert());
    // a âncora do dado: no grupo, reposta a cada quadro em cima da palma (o dado fica sempre de pé, apoiado nela)
    group.add(hand);
    hand.position.set(0, 1, 0);
    hand.rotation.set(0, 0, 0);
    hand.scale.setScalar(1);
    const andar = g.animations.find((c) => c.name === 'andar');
    const olhar = g.animations.find((c) => c.name === 'olhar');
    if (!andar || !olhar) return false;
    const mixer = new THREE.AnimationMixer(root);
    const loop = walkLoop(andar);
    const walk = mixer.clipAction(loop.clip);
    const idle = mixer.clipAction(stillClip(andar, IDLE_T, 'de_pe'));
    const lookClip = olhar.clone();
    lookClip.tracks = lookClip.tracks.filter((tr) => !tr.name.endsWith('.scale'));
    const look = mixer.clipAction(lookClip);
    for (const a of [walk, idle, look]) {
      a.play();
      a.setEffectiveWeight(0);
    }
    look.timeScale = 0; // o tempo dele é posto à mão (pela inclinação)
    idle.setEffectiveWeight(1);
    group.add(root);
    group.remove(fallback.group);
    // os ossos que o código mexe por cima da animação (cabeça, braços, mão direita)
    const touched = [b.Head, b.LeftArm, b.LeftForeArm, b.RightArm, b.RightForeArm, b.RightHand];
    rig = { root, mixer, walk, idle, look, walkSpeed: loop.speed, lookDur: olhar.duration, b, touched, base: touched.map((x) => x.quaternion.clone()) };
    applyAlpha();
    return true;
  });

  // ── estado (cada parte da pose chega no alvo com um atraso: peso de pano) ──
  const cur = { walk: 0, lean: 0, headYaw: 0, headPitch: 0, reach: 0, back: 0, open: 0, rest: 0, raise: 0, wW: 0 };
  const follow = (k: keyof typeof cur, target: number, rate: number, dt: number) => {
    cur[k] += (target - cur[k]) * (1 - Math.exp(-dt * rate));
  };
  const tv = new THREE.Vector3();
  const pole = new THREE.Vector3();
  const qh = new THREE.Quaternion();
  const qp = new THREE.Quaternion();
  const ax = new THREE.Vector3();
  let sway = 0;

  const animate = (dt: number, t: number, pose: ScribePose) => {
    if (!rig) {
      fallback.animate(dt, t, pose);
      return;
    }
    const { mixer, walk, idle, look, b } = rig;
    const walking = (pose.walk ?? 0) > 0.05;
    follow('wW', walking ? 1 : 0, 6, dt);
    follow('lean', Math.min(1, pose.lean ?? 0), 1.6, dt);
    follow('headYaw', pose.headYaw ?? 0, 4, dt);
    follow('headPitch', pose.headPitch ?? 0, 4, dt);
    follow('rest', pose.rest ?? 0, 3, dt);
    follow('back', pose.back ?? 0, 4, dt);
    follow('raise', pose.raise ?? 0, 3, dt);
    follow('reach', pose.reach ?? 0, 4, dt);
    follow('open', pose.open ?? 0, 8, dt);
    // andar: o passo na velocidade pedida
    walk.timeScale = THREE.MathUtils.clamp((pose.walk ?? 0) / rig.walkSpeed, 0.6, 1.7);
    // debruçar: a inclinação escolhe o quadro do "olhar para baixo"; no fundo, um vaivém lento
    if (cur.lean > 0.97) sway += dt;
    else sway = 0;
    look.time = Math.min(rig.lookDur, cur.lean > 0.97 ? LOOK_SWAY[0] + (LOOK_SWAY[1] - LOOK_SWAY[0]) * (0.5 - 0.5 * Math.cos(sway * 0.9)) : LOOK_SWAY[0] * cur.lean);
    const lw = (1 - cur.wW) * THREE.MathUtils.smoothstep(cur.lean, 0, 0.35);
    walk.setEffectiveWeight(cur.wW);
    look.setEffectiveWeight(lw);
    idle.setEffectiveWeight(Math.max(0, 1 - cur.wW - lw));
    // (o mixer só reescreve um osso quando o valor da animação MUDA: numa pose parada, o giro somado por código no quadro anterior ficaria e
    // se acumularia. Antes de cada quadro, os ossos mexidos voltam à pose da animação.)
    rig.touched.forEach((bn, i) => bn.quaternion.copy(rig!.base[i]));
    mixer.update(dt);
    rig.touched.forEach((bn, i) => rig!.base[i].copy(bn.quaternion));
    rig.root.updateMatrixWorld(true);

    // a cabeça: soma o giro pedido (no eixo do corpo: de lado = vira, para baixo = inclina)
    if (Math.abs(cur.headYaw) + Math.abs(cur.headPitch) > 1e-3) {
      const hd = b.Head;
      group.getWorldQuaternion(qp);
      ax.set(1, 0, 0).applyQuaternion(qp);
      qh.setFromAxisAngle(ax, cur.headPitch * 0.8);
      ax.set(0, 1, 0).applyQuaternion(qp);
      qh.premultiply(new THREE.Quaternion().setFromAxisAngle(ax, cur.headYaw));
      hd.getWorldQuaternion(_q2).premultiply(qh);
      hd.parent!.getWorldQuaternion(_q3);
      hd.quaternion.copy(_q3.invert().multiply(_q2));
      hd.updateMatrixWorld(true);
    }
    // a mão ESQUERDA: a animação segurava uma tocha; aqui ela fica junto do corpo ou pousada na borda à frente (rest)
    {
      const side = tv.set(0.3, 0.86, 0.08);
      const ledge = new THREE.Vector3(0.22, 0.86, (pose.press ?? 0.12) + 0.14);
      side.lerp(ledge, cur.rest);
      group.localToWorld(side);
      pole.set(0.7, 0.9, -0.5);
      group.localToWorld(pole);
      twoBoneIK(b.LeftArm, b.LeftForeArm, b.LeftHand, side, pole, Math.max(lw, cur.rest));
    }
    // a mão DIREITA: às costas (para dentro do manto), estendida à frente, ou erguida alta sobre o que está à frente
    {
      const wR = Math.max(cur.back, cur.raise, cur.reach);
      if (wR > 0.001) {
        const tgt = new THREE.Vector3();
        const s = cur.back + cur.raise + cur.reach + 1e-6;
        tgt.addScaledVector(new THREE.Vector3(-0.22, 1.02, -0.2), cur.back / s);
        // (erguido = estendido à frente, sobre o meio da boca do poço: a 1 m do corpo e 1,5 m do chão; é de lá que o dado cai)
        tgt.addScaledVector(new THREE.Vector3(-0.1, 1.5, 1.0), cur.raise / s);
        tgt.addScaledVector(new THREE.Vector3(-0.2, 1.25, 0.55), cur.reach / s);
        group.localToWorld(tgt);
        pole.set(-0.9, cur.raise > cur.back ? -0.4 : 0.6, cur.back > cur.raise ? 0.4 : -0.3);
        group.localToWorld(pole);
        twoBoneIK(b.RightArm, b.RightForeArm, b.RightHand, tgt, pole, wR);
      }
      // abrir: a palma se inclina para fora
      if (cur.open > 0.01) {
        group.getWorldQuaternion(qp);
        ax.set(0, 0, 1).applyQuaternion(qp);
        qh.setFromAxisAngle(ax, -cur.open * 0.9);
        b.RightHand.getWorldQuaternion(_q2).premultiply(qh);
        b.RightHand.parent!.getWorldQuaternion(_q3);
        b.RightHand.quaternion.copy(_q3.invert().multiply(_q2));
        b.RightHand.updateMatrixWorld(true);
      }
    }
    // o dado: em cima da palma (o meio entre o pulso e a base dos dedos, um pouco acima)
    b.RightHand.getWorldPosition(tv);
    const fing = (b.RightHandIndex1 ?? b.RightHand).getWorldPosition(new THREE.Vector3());
    tv.lerp(fing, 0.6);
    group.worldToLocal(tv);
    hand.position.copy(tv).add(new THREE.Vector3(0, 0.055, 0));
  };

  return {
    group,
    hand,
    head,
    ready,
    animate,
    setAlpha(v) {
      alpha = Math.max(0, Math.min(1, v));
      fallback.setAlpha(alpha);
      group.visible = alpha > 0.01;
      if (rig) applyAlpha();
    },
    update(t, arm) {
      fallback.update(t, arm);
    },
  };
}
