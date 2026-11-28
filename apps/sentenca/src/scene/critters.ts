// OS BICHOS (DESIGN.md §100, pedido do Pedro: "algum pequeno animal que apareça no fundo, que o jogador até vê passando"). São figuras 2D em
// pixel, pequenas e escuras, sempre LONGE: um rato que corre rente à parede de um buraco a outro, um morcego que cruza o alto de uma sala
// alta. Nunca chegam perto (o rato espera o jogador estar longe para sair, e foge se ele se aproxima), nunca tocam em coisa de puzzle e não
// fazem som. Aparecem de vez em quando, não em laço: a graça é o jogador achar que viu alguma coisa.
import * as THREE from 'three';
import { fxEye } from './fx';
import { lightEnv, type Kit } from './kit';
import type { Box } from './types';

const tex = (c: HTMLCanvasElement, flip = false) => {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  if (flip) {
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.x = -1;
    t.offset.x = 1;
  }
  return t;
};
const canvas = (w: number, h: number, rows: string[], pal: Record<string, string>) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) {
      const col = pal[r[x]];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    }
  });
  return c;
};

// o rato, de perfil, olhando para a direita (16 × 8): b corpo, d sombra do corpo, e orelha, n focinho, t rabo, l pata
const RAT_PAL = { b: '#8a7a70', d: '#5c4e4a', e: '#b08a86', n: '#c89a98', t: '#a88480', l: '#3a2e2c' };
const RAT_FRAMES = [
  // esticado (patas abertas)
  ['................', '..........e.....', '....bbbbbbbbb...', '...bbbbbbbbbbbb.', 't.bbbbbbbbbbbbbn', '.ttddddddddddb..', '..l...l..l...l..', '................'],
  // recolhido (patas juntas, dorso arqueado)
  ['................', '.....bbbb..e....', '...bbbbbbbbbb...', '..bbbbbbbbbbbbb.', '.tbbbbbbbbbbbbbn', 't..dddddddddbb..', '....ll...ll.....', '................'],
  // parado, farejando (cabeça erguida)
  ['...........e....', '..........bbb...', '....bbbbbbbbbbn.', '...bbbbbbbbbbb..', '..bbbbbbbbbbb...', 'tttdddddddddd...', '...ll.....ll....', '................'],
];
let ratTex: { r: THREE.Texture[]; l: THREE.Texture[] } | null = null;
const ratTextures = () => (ratTex ??= { r: RAT_FRAMES.map((f) => tex(canvas(16, 8, f, RAT_PAL))), l: RAT_FRAMES.map((f) => tex(canvas(16, 8, f, RAT_PAL), true)) });

// o morcego (16 × 8), asas para cima e para baixo
const BAT_PAL = { b: '#2a2430', w: '#3a3040' };
const BAT_FRAMES = [
  ['w..............w', 'ww............ww', '.www........www.', '..wwww.bb.wwww..', '....wwwbbwww....', '.......bb.......', '................', '................'],
  ['................', '................', '.......bb.......', '....wwwbbwww....', '..wwwwwbbwwwww..', '.www...bb...www.', 'ww............ww', 'w..............w'],
];
let batTex: THREE.Texture[] | null = null;
const batTextures = () => (batTex ??= BAT_FRAMES.map((f) => tex(canvas(16, 8, f, BAT_PAL))));

// a toca: um arco escuro pequeno no pé da parede (de onde o rato sai e onde some)
let holeTex: THREE.Texture | null = null;
function holeTexture() {
  if (holeTex) return holeTex;
  holeTex = tex(canvas(8, 6, ['..dddd..', '.dkkkkd.', 'dkkkkkkd', 'dkkkkkkd', 'dkkkkkkd', 'dkkkkkkd'], { d: '#2a2226', k: '#0c090b' }));
  return holeTex;
}

const tmp = new THREE.Vector3();

// UM RATO que corre de (x0, z0) a (x1, z1), rente a uma parede que olha para (nx, nz), no chão de altura `y`. As duas pontas ganham uma toca.
// `every` = de quantos em quantos segundos ele pode aparecer (o tempo é sorteado em volta disso).
// `off` = quanto o rodapé sai da parede (as tocas ficam na face dele; o rato corre um palmo à frente)
export function rat(kit: Kit, x0: number, z0: number, x1: number, z1: number, nx: number, nz: number, y = 0, every = 55, off = 0.1) {
  const T = ratTextures();
  const mat = new THREE.SpriteMaterial({ map: T.r[0], transparent: true, alphaTest: 0.5, depthWrite: false, fog: true });
  const s = new THREE.Sprite(mat);
  s.scale.set(0.34, 0.17, 1);
  s.center.set(0.5, 0);
  s.visible = false;
  kit.group.add(s);
  for (const [hx, hz] of [[x0, z0], [x1, z1]] as const) {
    const h = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.15), new THREE.MeshBasicMaterial({ map: holeTexture(), transparent: true, alphaTest: 0.5, fog: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    h.position.set(hx + nx * (off + 0.012), y + 0.075, hz + nz * (off + 0.012));
    h.rotation.y = Math.atan2(nx, nz);
    kit.group.add(h);
  }
  const len = Math.hypot(x1 - x0, z1 - z0);
  const dx = (x1 - x0) / len;
  const dz = (z1 - z0) / len;
  let wait = 6 + Math.random() * every * 0.5; // a primeira vez vem mais cedo
  let d = -1; // quanto já correu (m); < 0 = na toca
  let dir = 1; // 1 = de 0 para 1; -1 = de volta
  let pause = 0;
  let pauseAt = -1;
  return (dt: number, t: number) => {
    const eye = kit.group.worldToLocal(tmp.copy(fxEye));
    if (d < 0) {
      const force = import.meta.env.DEV && (globalThis as Record<string, unknown>).__bichosJa; // (testes: sair já)
      if ((wait -= dt) > 0 && !force) return;
      // só sai com o jogador longe da corrida inteira (senão espera mais um pouco)
      const mx = (x0 + x1) / 2;
      const mz = (z0 + z1) / 2;
      if (!force && (Math.hypot(eye.x - mx, eye.z - mz) < len / 2 + 4.5 || lightEnv.scale < 0.5)) {
        wait = 4;
        return;
      }
      d = 0;
      dir = Math.random() < 0.5 ? 1 : -1;
      pauseAt = Math.random() < 0.6 ? len * (0.3 + Math.random() * 0.4) : -1;
      pause = 0;
      s.visible = true;
    }
    const along = dir > 0 ? d : len - d;
    const px = x0 + dx * along + nx * (off + 0.13);
    const pz = z0 + dz * along + nz * (off + 0.13);
    const near = Math.hypot(eye.x - px, eye.z - pz);
    let frame: number;
    if (pause > 0 && near > 3.2) {
      pause -= dt;
      frame = 2; // parado, farejando
    } else {
      pause = 0;
      const sp = near < 3.2 ? 4.6 : 2.7; // foge mais depressa se o jogador chega perto
      const d0 = d;
      d += sp * dt;
      if (pauseAt > 0 && d0 < pauseAt && d >= pauseAt) {
        pause = 0.7 + Math.random() * 1.1;
        pauseAt = -1;
      }
      frame = Math.floor(t * 11) % 2;
    }
    if (d >= len) {
      d = -1;
      s.visible = false;
      wait = every * (0.6 + Math.random() * 0.9);
      return;
    }
    s.position.set(px, y, pz);
    // para que lado da TELA ele corre (a figura é um cartaz virado para o jogador)
    const fx = px - eye.x;
    const fz = pz - eye.z;
    const right = (dx * -fz + dz * fx) * dir > 0;
    mat.map = (right ? T.r : T.l)[frame];
    const v = 0.8 * lightEnv.scale;
    mat.color.setRGB(v, v * 0.92, v * 0.84); // (a luz das salas é quente)
  };
}

// UM MORCEGO que cruza o alto da sala de `a` a `b` (pontos perto do teto), batendo as asas, com um mergulho no meio. Raro.
export function bat(kit: Kit, a: THREE.Vector3, b: THREE.Vector3, every = 80) {
  const T = batTextures();
  const mat = new THREE.SpriteMaterial({ map: T[0], transparent: true, alphaTest: 0.5, depthWrite: false, fog: true });
  const s = new THREE.Sprite(mat);
  s.scale.set(0.5, 0.25, 1);
  s.visible = false;
  kit.group.add(s);
  const len = a.distanceTo(b);
  let wait = 10 + Math.random() * every * 0.6;
  let k = -1;
  let back = false;
  return (dt: number, t: number) => {
    if (k < 0) {
      const force = import.meta.env.DEV && (globalThis as Record<string, unknown>).__bichosJa;
      if ((wait -= dt) > 0 && !force) return;
      if (lightEnv.scale < 0.5) {
        wait = 4;
        return;
      }
      k = 0;
      back = Math.random() < 0.5;
      s.visible = true;
    }
    k += (dt * 5.2) / len;
    if (k >= 1) {
      k = -1;
      s.visible = false;
      wait = every * (0.6 + Math.random() * 0.9);
      return;
    }
    const u = back ? 1 - k : k;
    s.position.lerpVectors(a, b, u);
    s.position.y -= Math.sin(k * Math.PI) * 0.9 - Math.sin(k * Math.PI * 5) * 0.12; // mergulha no meio, tremendo
    mat.map = T[Math.floor(t * 13) % 2];
    const v = 0.6 * lightEnv.scale;
    mat.color.setRGB(v, v, v);
  };
}

// UM RATO NA PAREDE MAIS LIVRE: procura, no pé de uma parede reta (em x = `x`, que olha para `nx`; de zA a zB), o trecho mais comprido sem
// nada encostado (caixas de colisão da sala a menos de 60 cm, e os trechos de `avoid`: portas, fossos) e põe o rato a correr nele. Devolve
// null se não houver 3,5 m livres.
// Além das caixas, SONDA a sala já montada: um raio de 90 cm para a parede (se bate antes de 70 cm, há alguma coisa encostada: um móvel, uma
// escada, um pedestal) e um para baixo (tem de haver chão).
export function ratAlongWall(kit: Kit, boxes: Box[], x: number, nx: number, zA: number, zB: number, avoid: [number, number][] = [], y = 0, every = 55) {
  kit.group.updateMatrixWorld(true);
  const solid: THREE.Object3D[] = [];
  kit.group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && m.visible && !(Array.isArray(m.material) ? m.material[0] : m.material)?.transparent) solid.push(m);
  });
  const ray = new THREE.Raycaster();
  const o = new THREE.Vector3();
  const toWall = new THREE.Vector3(-nx, 0, 0).transformDirection(kit.group.matrixWorld);
  const down = new THREE.Vector3(0, -1, 0);
  const probe = (z: number) => {
    ray.set(kit.group.localToWorld(o.set(x + nx * 0.9, y + 0.12, z)), toWall);
    ray.far = 1.0;
    const h = ray.intersectObjects(solid, false)[0];
    if (!h || h.distance < 0.7) return false; // (sem parede ali, ou com alguma coisa na frente dela)
    ray.set(kit.group.localToWorld(o.set(x + nx * 0.25, y + 0.3, z)), down);
    ray.far = 0.6;
    return ray.intersectObjects(solid, false).length > 0;
  };
  const free = (z: number) =>
    !avoid.some(([a, b]) => z > a - 0.4 && z < b + 0.4) &&
    !boxes.some((b) => b.min.y < y + 0.5 && b.max.y > y - 0.05 && z > b.min.z - 0.35 && z < b.max.z + 0.35 && (nx > 0 ? b.min.x < x + 0.6 && b.max.x > x - 0.2 : b.max.x > x - 0.6 && b.min.x < x + 0.2)) &&
    probe(z);
  let best: [number, number] | null = null;
  let start: number | null = null;
  for (let z = zA; z <= zB + 1e-6; z += 0.25) {
    const ok = free(z);
    if (ok && start === null) start = z;
    if (start !== null && (!ok || z + 0.25 > zB + 1e-6)) {
      const end = ok ? z : z - 0.25;
      if (!best || end - start > best[1] - best[0]) best = [start, end];
      start = null;
    }
  }
  if (!best || best[1] - best[0] < 3.5) return null;
  let [a, b] = best;
  if (b - a > 9) {
    const m = (a + b) / 2;
    a = m - 4.5;
    b = m + 4.5;
  }
  if (import.meta.env.DEV) {
    const g = globalThis as Record<string, unknown>;
    ((g.__ratos ??= []) as unknown[]).push([g.__salaMontando, x, +a.toFixed(2), +b.toFixed(2)]);
  }
  return rat(kit, x, a, x, b, nx, 0, y, every);
}
