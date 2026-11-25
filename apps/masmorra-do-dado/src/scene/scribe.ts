// O Escrivão: uma criatura encapuzada e decrépita, de rosto coberto (só o vazio do capuz).
// Feito à mão com formas simples, no mesmo estilo do resto do jogo (nada de arquivos de modelo).
// Origem nos pés; a frente é +z. Aparece e some como névoa (opacidade).

import * as THREE from 'three';

export interface Scribe {
  group: THREE.Group;
  setAlpha(v: number): void;
  // t: tempo; arm: 0 braço caído … 1 braço erguido escrevendo; look: 0..1 quanto o capuz acompanha o jogador
  update(t: number, arm: number): void;
  hand: THREE.Object3D; // a mão do braço direito (para segurar coisas, como o dado na abertura)
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
  const hoodMat = cloth(0x3b3446, 0x16111f);
  const boneMat = cloth(0xb9b09b, 0x1e1a14);
  const voidMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true });
  mats.push(voidMat);

  // manto: um cone arredondado, curvado para a frente, com a barra esfarrapada
  const prof: [number, number][] = [[0.0, 0], [0.5, 0], [0.46, 0.14], [0.38, 0.5], [0.3, 0.95], [0.26, 1.18], [0.3, 1.32], [0.2, 1.46], [0.0, 1.5]];
  const robeGeo = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 16);
  const r = rng(11);
  const pos = robeGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < 0.16) {
      pos.setY(i, y + r() * 0.2); // barra rasgada: pontas e falhas
      pos.setX(i, pos.getX(i) * (0.92 + r() * 0.16));
    }
  }
  robeGeo.computeVertexNormals();
  const robe = new THREE.Mesh(robeGeo, robeMat);
  group.add(robe);

  // tiras de pano pendurando da cintura
  const rags: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.1 + r() * 0.06, 0.3 + r() * 0.25), robeMat);
    m.position.set(Math.sin(a) * 0.43, 0.14, Math.cos(a) * 0.43);
    m.rotation.y = a;
    m.geometry.translate(0, -0.12, 0);
    group.add(m);
    rags.push(m);
  }

  // parte de cima: corcunda, inclinada pra frente
  const upper = new THREE.Group();
  upper.position.set(0, 1.0, 0);
  upper.rotation.x = 0.34;
  group.add(upper);

  // capuz: casca alongada com ponta caída pra trás; o "rosto" é só um vazio preto
  const hood = new THREE.Group();
  hood.position.set(0, 0.62, 0.04);
  upper.add(hood);
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

  // braço esquerdo caído, com a mão ossuda
  const armL = new THREE.Group();
  armL.position.set(0.27, 0.3, 0.02);
  upper.add(armL);
  const sleeveL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 0.62, 8), robeMat);
  sleeveL.position.y = -0.3;
  armL.add(sleeveL);
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), boneMat);
  handL.position.y = -0.64;
  armL.add(handL);
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.12, 0.014), boneMat);
    f.position.set((i - 1) * 0.022, -0.72, 0.01);
    f.rotation.z = (i - 1) * 0.12;
    armL.add(f);
  }

  // braço direito: ergue e escreve com um toco de giz
  const armR = new THREE.Group();
  armR.position.set(-0.27, 0.3, 0.02);
  upper.add(armR);
  const sleeveR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 0.7, 8), robeMat);
  sleeveR.position.y = -0.34;
  armR.add(sleeveR);
  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), boneMat);
  handR.position.y = -0.72;
  armR.add(handR);
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.11, 0.014), boneMat);
    f.position.set((i - 1) * 0.022, -0.8, 0.012);
    armR.add(f);
  }
  const chalkMat = new THREE.MeshBasicMaterial({ color: 0xf1ebd9, transparent: true });
  mats.push(chalkMat);
  const chalk = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.09), chalkMat);
  chalk.position.set(0, -0.83, 0.05);
  armR.add(chalk);

  let alpha = 1;
  return {
    group,
    hand: handR,
    setAlpha(v) {
      alpha = Math.max(0, Math.min(1, v));
      group.visible = alpha > 0.01;
      for (const m of mats) {
        m.opacity = alpha;
        m.depthWrite = alpha > 0.98;
      }
    },
    update(t, arm) {
      // respira devagar, balança as tiras, arma o braço
      upper.rotation.x = 0.34 + Math.sin(t * 1.3) * 0.012;
      hood.rotation.y = Math.sin(t * 0.5) * 0.12;
      hood.rotation.x = 0.1 + Math.sin(t * 0.9) * 0.03;
      rags.forEach((m, i) => (m.rotation.x = Math.sin(t * 1.4 + i * 1.7) * 0.07));
      armL.rotation.x = Math.sin(t * 1.1) * 0.03;
      // erguido: o braço aponta pra frente e pra cima, com traços curtos
      const stroke = Math.sin(t * 9) * 0.1 * arm;
      armR.rotation.x = -(0.15 + arm * 1.2) + stroke;
      armR.rotation.z = -0.08 * arm + Math.sin(t * 4.5) * 0.06 * arm;
      void alpha;
    },
  };
}
