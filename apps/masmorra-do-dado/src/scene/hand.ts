// A MÃO do jogador (DIRECAO_DE_ARTE.md §4.9): a mão direita, com a palma para cima, segura o dado no canto de baixo à direita da tela.
// Simples e escura, para o dado brilhar: pele morena na sombra, unhas curtas, e a manga de lã grossa com um punho dobrado.
// Fica na cena do HUD (a mesma do dado), em unidades do tamanho do dado (o dado é um cubo de 1, centrado na origem).
import * as THREE from 'three';

function px(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// lã grossa: trama em diagonal, dois tons de marrom-acinzentado, e um fio solto aqui e ali
function woolTexture() {
  return px(16, 16, (g) => {
    g.fillStyle = '#3a3446';
    g.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        if ((x + y * 2) % 4 === 0) {
          g.fillStyle = '#4e4660';
          g.fillRect(x, y, 1, 1);
        } else if ((x * 3 + y) % 7 === 0) {
          g.fillStyle = '#28233a';
          g.fillRect(x, y, 1, 1);
        }
      }
  });
}
// pele: tom quente, poros, e um sombreado de baixo para cima (o que fica embaixo é mais escuro)
function skinTexture() {
  return px(8, 8, (g) => {
    g.fillStyle = '#b8784a';
    g.fillRect(0, 0, 8, 8);
    const dots: [number, number, string][] = [[1, 2, '#a0663c'], [5, 1, '#c8864f'], [3, 5, '#a0663c'], [6, 6, '#c8864f'], [2, 7, '#985f38']];
    for (const [x, y, c] of dots) {
      g.fillStyle = c;
      g.fillRect(x, y, 1, 1);
    }
  });
}

export interface Hand {
  group: THREE.Group;
  // `hold` 1 = segurando o dado, 0 = mão vazia (o dado foi arremessado); `walk` = quanto anda (0..1); `away` 0..1 = some para baixo (cena, livro)
  update(dt: number, t: number, o: { hold: number; walk: number; bob: number; away: number; glow?: THREE.Color }): void;
}

// uma peça entre dois pontos (osso de dedo, antebraço): caixa (ou tubo) de comprimento |b - a| alinhada com o segmento
const UP = new THREE.Vector3(0, 1, 0);
function place(m: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) {
  const d = new THREE.Vector3().subVectors(b, a);
  const len = d.length();
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(UP, d.divideScalar(len || 1));
  m.scale.y = len;
}
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const WARM = new THREE.Color(0xffc890);

export function makeHand(): Hand {
  const group = new THREE.Group();
  const skin = new THREE.MeshLambertMaterial({ map: skinTexture() });
  const skinDark = new THREE.MeshLambertMaterial({ map: skinTexture(), color: 0xb89a8a });
  const nail = new THREE.MeshLambertMaterial({ color: 0xd8b8a0 });
  const wool = new THREE.MeshLambertMaterial({ map: woolTexture() });
  const cuff = new THREE.MeshLambertMaterial({ color: 0x6a5e78 });
  const unitBox = (w: number, d: number, m: THREE.Material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), m);
    group.add(mesh);
    return mesh;
  };
  const block = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };
  // a palma (por baixo do dado) e o calcanhar da mão, mais grosso, do lado do pulso
  block(1.0, 0.2, 0.86, skinDark, -0.03, -0.66, 0.0);
  block(0.72, 0.26, 0.42, skin, 0.16, -0.74, 0.3);
  // os quatro dedos sobem pelo lado ESQUERDO do dado (dois ossos cada); o da frente é o que mais se vê
  const fingers = [0, 1, 2, 3].map((k) => {
    const z = -0.33 + k * 0.205;
    const w = k === 0 ? 0.15 : 0.175;
    return { z, a: unitBox(w, 0.17, skin), b: unitBox(w * 0.94, 0.16, skin), n: block(0.05, 0.1, 0.12, nail, 0, 0, 0), len: k === 0 ? 0.24 : k === 3 ? 0.28 : 0.32 };
  });
  // o polegar: pela quina de baixo da face DIREITA (sem cobrir o rosto do dado)
  const th1 = unitBox(0.2, 0.21, skin);
  const th2 = unitBox(0.18, 0.19, skin);
  const thN = block(0.12, 0.05, 0.12, nail, 0, 0, 0);
  // o pulso e a manga, descendo para o canto de baixo à direita (para perto da câmera)
  const wrist = unitBox(0.5, 0.5, skin);
  place(wrist, V(0.25, -0.8, 0.32), V(0.7, -1.22, 0.7));
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 1, 8, 1), wool);
  group.add(sleeve);
  place(sleeve, V(0.72, -1.22, 0.72), V(1.7, -2.9, 1.75));
  const cuffM = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 1, 8, 1), cuff);
  group.add(cuffM);
  place(cuffM, V(0.68, -1.15, 0.68), V(0.86, -1.46, 0.86));

  // o dado ilumina a mão que o segura (a luz da face escolhida, de leve): é o que separa a mão do chão escuro
  const glow = new THREE.PointLight(0xffc890, 2.2, 0, 0);
  glow.position.set(-0.1, -0.25, 0.75);
  group.add(glow);
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  let sag = 0;
  let sagV = 0;
  let lastWalk = 0;
  let hold = 1;
  const pose = (open: number) => {
    for (const f of fingers) {
      // fechado: sobe colado na face esquerda; aberto: o dedo se estica para fora, para a esquerda
      p0.set(-0.48, -0.66, f.z);
      p1.set(-0.66 - 0.06 * open, -0.52 + 0.04 * open, f.z);
      p2.set(-0.62 - 0.36 * open, -0.52 + f.len * (1 - 0.55 * open), f.z);
      place(f.a, p0, p1);
      place(f.b, p1, p2);
      f.n.position.copy(p2).add(V(0.07 - 0.1 * open, -0.02, 0));
    }
    p0.set(0.36, -0.64, 0.34);
    p1.set(0.6 + 0.08 * open, -0.5, 0.38);
    p2.set(0.62 + 0.22 * open, -0.27 + 0.05 * open, 0.32);
    place(th1, p0, p1);
    place(th2, p1, p2);
    thN.position.copy(p2).add(V(-0.06, 0.02, 0.06));
  };
  pose(0);
  return {
    group,
    update(dt, t, o) {
      // PESO ao parar: quando o andar cai de repente, a mão afunda um pouco e volta (mola)
      const decel = Math.max(0, lastWalk - o.walk) / Math.max(dt, 1e-3);
      lastWalk = o.walk;
      sagV += -decel * 0.004 - sag * 90 * dt - sagV * 9 * dt;
      sag += sagV * dt;
      const h0 = hold;
      hold += (o.hold - hold) * Math.min(1, dt * 8);
      if (Math.abs(hold - h0) > 1e-4 || dt === 0) pose(1 - hold);
      // vazia (o dado foi arremessado), a mão baixa e quase sai da tela: só a ponta dos dedos fica à vista
      group.position.y = sag + o.bob - (1 - hold) * 0.75 - o.away * 3;
      group.rotation.z = Math.sin(t * 1.3) * 0.015;
      group.visible = o.away < 0.98;
      if (o.glow) glow.color.copy(o.glow).lerp(WARM, 0.6);
      glow.intensity = 2.2 * hold;
    },
  };
}
