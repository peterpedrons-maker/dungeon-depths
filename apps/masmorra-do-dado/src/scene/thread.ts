// "Fio de luz": quando uma palavra da parede brilha porque algo aconteceu, um fio de brasas corre do glifo até o objeto que ela nomeia.
// Pontos (não linhas) em arco: ficam legíveis na tela de baixa resolução e dão a sensação de faíscas viajando. Ver DESIGN.md §25.

import * as THREE from 'three';

const N = 28; // pontos por fio

export class LightThread {
  readonly points: THREE.Points;
  private pos: Float32Array;
  private mat: THREE.PointsMaterial;
  private from = new THREE.Vector3();
  private to = new THREE.Vector3();
  private age = 99;
  private life = 1.8;

  constructor(group: THREE.Group) {
    this.pos = new Float32Array(N * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.mat = new THREE.PointsMaterial({ color: 0xffa040, size: 3, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 4;
    this.points.visible = false;
    group.add(this.points);
  }

  // dispara um fio de `from` até `to` (coordenadas locais da sala)
  fire(from: THREE.Vector3, to: THREE.Vector3, life = 1.8) {
    this.from.copy(from);
    this.to.copy(to);
    this.age = 0;
    this.life = life;
    this.points.visible = true;
  }

  get active() {
    return this.age < this.life;
  }

  update(dt: number) {
    if (!this.active) {
      this.points.visible = false;
      return;
    }
    this.age += dt;
    const k = this.age / this.life;
    // as faíscas viajam do glifo ao objeto; o arco sobe um pouco (o fio "voa")
    const head = Math.min(1, k * 2.2); // a ponta do fio avança rápido e depois ele se apaga
    const tail = Math.max(0, (k - 0.35) * 1.5);
    for (let i = 0; i < N; i++) {
      const u = tail + ((head - tail) * i) / (N - 1);
      const x = this.from.x + (this.to.x - this.from.x) * u;
      const z = this.from.z + (this.to.z - this.from.z) * u;
      const y = this.from.y + (this.to.y - this.from.y) * u + Math.sin(u * Math.PI) * 0.5 + Math.sin(u * 40 + this.age * 18) * 0.03;
      this.pos[i * 3] = x;
      this.pos[i * 3 + 1] = y;
      this.pos[i * 3 + 2] = z;
    }
    (this.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.mat.opacity = k < 0.7 ? 1 : Math.max(0, (1 - k) / 0.3);
  }
}
