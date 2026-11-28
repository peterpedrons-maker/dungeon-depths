// A CENA DA GEMA (DESIGN.md §69, pedido do Pedro). Ao pegar uma gema: ela sai do nicho e vem até perto dos olhos, brilha, encolhe um pouco
// e se desfaz num pó de luz pontilhado; o caderno sai sozinho, aberto no FUNDO (a parte dura da capa de trás com o dado aberto), e o pó corre
// em fio até o próximo furo, onde a gema se refaz e encaixa com um anel de luz. A 1ª vez é a cena inteira (~4,5 s); nas outras, a mesma coisa
// mais rápida (~2,5 s). Qualquer toque ou tecla pula para o encaixe.
// Tudo acontece na cena do LIVRO (o canvas em resolução cheia, por cima do jogo), com a câmera do HUD: a gema começa no ponto da tela onde
// estava no nicho.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { diary, diaryStore } from '../story/diary';
import { facesDone } from '../story/gems';

type Sfx = 'gemShine' | 'gemBreak' | 'gemSet' | 'gemFace';
export interface GemBook {
  present(on: boolean, fast?: boolean): void;
  board(o: null | { n: number; flash: number; fk: number }): void;
  socketWorld(k: number, out: THREE.Vector3): THREE.Vector3;
  opened(): number;
}

const N = 96; // grãos do pó de luz
const ease = (u: number) => u * u * (3 - 2 * u);
const clamp01 = (u: number) => Math.min(1, Math.max(0, u));

// a gema lapidada: a coroa (com a mesa em cima) e a ponta, em oito facetas (de longe, no nicho, ela é o octaedro de sempre)
function cutGem() {
  const crown = new THREE.CylinderGeometry(0.6, 1, 0.4, 8, 1);
  crown.translate(0, 0.2, 0);
  const pav = new THREE.ConeGeometry(1, 1.05, 8, 1, true);
  pav.rotateX(Math.PI);
  pav.translate(0, -0.525, 0);
  const g = mergeGeometries([crown.toNonIndexed(), pav.toNonIndexed()])!;
  g.computeVertexNormals();
  return g;
}

function haloTexture() {
  // um brilho redondo em degraus (pixel), não um borrão
  const S = 48;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const d = Math.hypot(x + 0.5 - S / 2, y + 0.5 - S / 2) / (S / 2);
      if (d >= 1) continue;
      const a = Math.round((1 - d) ** 2.2 * 6) / 6;
      if (a <= 0) continue;
      g.fillStyle = `rgba(150,236,255,${a * 0.42})`;
      g.fillRect(x, y, 1, 1);
    }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeGemScene(env: { scene: THREE.Scene; cam: THREE.PerspectiveCamera; book: GemBook; sfx(n: Sfx): void; px(): number }) {
  const gemMat = new THREE.MeshLambertMaterial({ color: 0x5ad8f0, emissive: 0x1a90c0, emissiveIntensity: 0.4, flatShading: true });
  const gem = new THREE.Mesh(cutGem(), gemMat);
  gem.visible = false;
  gem.renderOrder = 10;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
  halo.visible = false;
  halo.renderOrder = 9;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const dust = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)).setAttribute('color', new THREE.BufferAttribute(col, 3)),
    new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }),
  );
  dust.frustumCulled = false;
  dust.visible = false;
  dust.renderOrder = 11;
  env.scene.add(gem, halo, dust);

  // o percurso de cada grão: estoura a partir da gema (b0 → b1) e depois corre até o furo por uma curva (b1 → ctrl → furo)
  const b0 = new THREE.Vector3();
  const b1 = Array.from({ length: N }, () => new THREE.Vector3());
  const ctrl = Array.from({ length: N }, () => new THREE.Vector3());
  const delay = new Float32Array(N);
  const tw = new Float32Array(N);
  const sockP = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();

  let s: null | {
    id: string;
    t: number;
    k: number; // o furo que a gema vai ocupar
    first: boolean;
    withBook: boolean;
    from: THREE.Vector3; // onde começa (na cena do livro)
    T: { fly: number; shine: number; squeeze: number; burst: number; spread: number; travel: number; hold: number; book: number };
    landed: boolean;
    closed: boolean;
    onDone?: () => void;
  } = null;
  let skip = false;
  let doneT = 0;

  const center = new THREE.Vector3();
  const timesOf = (first: boolean) =>
    first
      ? { fly: 0.9, shine: 0.6, squeeze: 0.3, burst: 0.3, spread: 0.55, travel: 0.85, hold: 1.0, book: 1.15 }
      : { fly: 0.45, shine: 0.25, squeeze: 0.15, burst: 0.18, spread: 0.25, travel: 0.55, hold: 0.5, book: 0.45 };

  const land = () => {
    if (!s || s.landed) return;
    s.landed = true;
    const before = (diaryStore.get().gems ?? []).length;
    diary.addGem(s.id);
    const after = (diaryStore.get().gems ?? []).length;
    env.sfx('gemSet');
    if (facesDone(after) > facesDone(before)) env.sfx('gemFace');
    doneT = s.t;
  };

  return {
    active: () => s !== null,
    // `ndc` = onde a gema estava na tela do jogo (x, y de -1 a 1); `first` = a cena inteira; `withBook` = o jogador já tem o caderno
    start(id: string, ndc: THREE.Vector2, first: boolean, withBook: boolean, onDone?: () => void) {
      if (s) return;
      const from = new THREE.Vector3(ndc.x, ndc.y, 0.5).unproject(env.cam).sub(env.cam.position).normalize();
      from.multiplyScalar(1.3 / Math.max(0.2, -from.z)).add(env.cam.position);
      s = {
        id,
        t: 0,
        k: (diaryStore.get().gems ?? []).length,
        first,
        withBook,
        from,
        T: timesOf(first),
        landed: false,
        closed: false,
        onDone,
      };
      skip = false;
      env.book.board({ n: s.k, flash: -1, fk: 1 });
      gem.visible = true;
      halo.visible = true;
      dust.visible = false;
      gemMat.opacity = 1;
      env.sfx('gemShine');
    },
    // um toque ou tecla NOVO pula para o encaixe. O mesmo aperto que pegou a gema (o E, ou o toque no AGIR do celular) também chega aqui, no
    // mesmo instante: por isso a cena só aceita pular depois de começar (antes, ela era pulada no mesmo aperto e não aparecia)
    skip() {
      if (s && s.t > 0.35) skip = true;
    },
    // encerra a cena na hora, com a gema guardada (um erro, ou a cena passou muito do tempo: nada pode prender o jogador nela)
    abort() {
      if (!s) return;
      try {
        land();
      } catch {
        /* a gema já pode ter sido guardada */
      }
      gem.visible = false;
      halo.visible = false;
      dust.visible = false;
      try {
        env.book.present(false);
        env.book.board(null);
      } catch {
        /* o caderno se arruma sozinho */
      }
      const cb = s.onDone;
      s = null;
      cb?.();
    },
    update(dt: number) {
      if (!s) return;
      // (rede de segurança: a cena inteira dura ~6 s; se passar de 20 s, algo a prendeu, e ela acaba)
      if (s.t > 20) {
        this.abort();
        return;
      }
      const T = s.T;
      if (skip && !s.landed) {
        // pulou: a gema vai direto para o furo
        gem.visible = false;
        halo.visible = false;
        dust.visible = false;
        if (s.withBook) env.book.present(true, true);
        land();
      }
      // pulou depois do encaixe: o caderno já volta
      if (skip && s.landed && !s.closed && s.t > doneT + 0.3) s.t = Math.max(s.t, doneT + s.T.hold);
      s.t += dt;
      const t = s.t;
      const tArrive = T.fly;
      const tSqueeze = tArrive + T.shine;
      const tBreak = tSqueeze + T.squeeze;
      const tStream = tBreak + T.burst;
      const tLand = tStream + T.spread + T.travel;
      // o caderno sai quando a gema já está diante dos olhos, para estar aberto quando o pó chegar
      if (s.withBook && !s.landed && t >= Math.max(0, tBreak + T.burst + T.spread * 0.5 - T.book)) env.book.present(true, !s.first);

      // a câmera do HUD olha para -z; o meio da tela fica um pouco acima do centro (o caderno, aberto, vem de baixo)
      center.set(0, 0.03, -0.75).applyQuaternion(env.cam.quaternion).add(env.cam.position);
      if (!s.landed && t < tBreak) {
        const u = ease(clamp01(t / tArrive));
        gem.position.lerpVectors(s.from, center, u);
        gem.position.y += Math.sin(u * Math.PI) * 0.08; // um arco, como quem joga para si
        // chega perto (cresce), brilha e, antes de quebrar, encolhe um pouco e clareia
        const sq = clamp01((t - tSqueeze) / T.squeeze);
        const r = (0.016 + 0.04 * u) * (1 - 0.35 * ease(sq)) * (1 + 0.04 * Math.sin(t * 9));
        gem.scale.setScalar(r);
        // a mesa meio virada para os olhos, girando devagar (as facetas acendem e apagam com a luz)
        gem.rotation.set(0.55 + 0.15 * Math.sin(t * 1.3), t * (1.6 + 2.4 * u), 0.12);
        const shine = clamp01((t - tArrive) / T.shine);
        gemMat.emissiveIntensity = 0.4 + 0.35 * shine + 0.6 * sq + 0.25 * shine * Math.max(0, Math.sin(t * 7));
        gemMat.color.setRGB(0.35 + 0.4 * sq, 0.85 + 0.1 * sq, 0.94 + 0.06 * sq);
        halo.position.copy(gem.position);
        halo.scale.setScalar(r * (2.2 + 1.4 * shine + 1.6 * sq) * (1 + 0.06 * Math.sin(t * 12)));
        halo.material.opacity = 0.35 + 0.5 * shine;
      }
      // quebra: um estalo, um clarão e o pó estoura
      if (!s.landed && t >= tBreak && gem.visible) {
        gem.visible = false;
        env.sfx('gemBreak');
        b0.copy(gem.position);
        for (let i = 0; i < N; i++) {
          const a = Math.random() * Math.PI * 2;
          const z = Math.random() * 2 - 1;
          const rr = 0.03 + Math.random() * 0.06;
          b1[i].set(Math.cos(a) * Math.sqrt(1 - z * z) * rr, Math.sin(a) * Math.sqrt(1 - z * z) * rr, z * rr * 0.5).add(b0);
          delay[i] = (i / N) * T.spread + Math.random() * 0.06; // saem em fio, um atrás do outro
          tw[i] = Math.random() * 6.28;
          ctrl[i].set((Math.random() - 0.5) * 0.25, 0.12 + Math.random() * 0.2, 0.05 + Math.random() * 0.1);
        }
        dust.visible = true;
      }
      if (dust.visible) {
        if (s.withBook) env.book.socketWorld(s.k, sockP);
        else sockP.set(0.55, -0.45, -1).applyQuaternion(env.cam.quaternion).add(env.cam.position); // sem caderno: o pó vai para a bolsa (embaixo, à direita)
        let alive = 0;
        for (let i = 0; i < N; i++) {
          let p: THREE.Vector3;
          let bright = 1;
          const tb = t - tBreak;
          if (tb < T.burst) {
            // o estouro: abre e fica pairando, cintilando
            const u = ease(clamp01(tb / T.burst));
            p = tmp.lerpVectors(b0, b1[i], u);
            bright = 1.2 - 0.4 * u;
          } else {
            const u = clamp01((t - tStream - delay[i]) / T.travel);
            if (u >= 1) {
              pos[i * 3] = 0;
              pos[i * 3 + 1] = 0;
              pos[i * 3 + 2] = 1; // atrás da câmera: some
              continue;
            }
            alive++;
            const e = u * u * (3 - 2 * u);
            // curva de Bézier: do ponto do estouro, passando por cima (o fio de fumaça), até o furo
            tmp2.copy(b1[i]).lerp(sockP, 0.5).add(ctrl[i]);
            p = tmp.copy(b1[i]).multiplyScalar((1 - e) * (1 - e)).addScaledVector(tmp2, 2 * (1 - e) * e).addScaledVector(sockP, e * e);
            if (u === 0) p.y += Math.sin(t * 6 + tw[i]) * 0.004; // os que ainda esperam, pairando
            bright = 0.65 + 0.35 * Math.sin(t * 14 + tw[i]);
          }
          pos[i * 3] = p.x;
          pos[i * 3 + 1] = p.y;
          pos[i * 3 + 2] = p.z;
          col[i * 3] = 0.55 * bright;
          col[i * 3 + 1] = 0.92 * bright;
          col[i * 3 + 2] = 1 * bright;
        }
        dust.geometry.attributes.position.needsUpdate = true;
        dust.geometry.attributes.color.needsUpdate = true;
        (dust.material as THREE.PointsMaterial).size = Math.max(2, Math.round(2 * env.px()));
        // o halo vai junto com o pó até o furo, cada vez menor
        const hu = clamp01((t - tStream) / (T.spread + T.travel));
        halo.position.lerpVectors(b0, sockP, ease(hu));
        halo.scale.setScalar(0.12 * (1 - 0.8 * hu));
        halo.material.opacity = 0.8 * (1 - hu);
        if (t >= tStream && alive === 0 && t > tStream + T.spread) {
          dust.visible = false;
          halo.visible = false;
        }
      }
      if (!s.landed && t >= tLand) land();
      // o encaixe: o anel de luz abre e some
      if (s.landed && s.withBook) {
        const fk = clamp01((t - doneT) / 0.7);
        env.book.board({ n: s.k + 1, flash: s.k, fk });
      }
      // depois de um tempo, o caderno volta para a bolsa e a cena acaba quando ele estiver guardado
      if (s.landed && t >= doneT + T.hold && !s.closed) {
        s.closed = true;
        env.book.present(false);
        dust.visible = false;
        halo.visible = false;
      }
      if (s.closed && (!s.withBook || env.book.opened() <= 0 || t > doneT + T.hold + 3)) {
        env.book.board(null);
        const cb = s.onDone;
        s = null;
        cb?.();
      }
    },
  };
}
