// MODELOS 3D de fora (DESIGN.md §61). Por enquanto só o braseiro, a partir de "Stone Column Brazier" de Amarveer (Sketchfab, CC BY 4.0: o
// crédito está na tela de Créditos). O arquivo do jogo (`public/models/braseiro.glb`) já vem tratado para o pixel: sem a chama de foto
// (o jogo usa a própria chama), texturas reduzidas a 128 px (a densidade de pixel do resto) e filtro "nearest"; aqui os materiais viram
// Lambert (o mesmo das paredes) com o relevo do mapa de normais.
// PRÉVIA: por enquanto só entra com `?braseiro=novo` (o jogo segue com o braseiro antigo até o Pedro aprovar). O arquivo é gerado por
// `tools/braseiro_glb.py` a partir do .zip do Sketchfab.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('braseiro') : null;
export const brazierModelMode: 'novo' | null = q === 'novo' ? q : null;

export interface BrazierModel {
  group: THREE.Group; // o modelo já em metros, com o pé em y = 0 e o topo da cesta em y = 1,1
  bowlR: number; // meia-largura da cesta (m)
}
let model: BrazierModel | null = null;
const waiting: ((m: BrazierModel) => void)[] = [];
const TOP = 1.1; // o topo da cesta fica na altura da tigela dos braseiros do jogo (onde o dado acende): nada do puzzle muda

if (brazierModelMode) {
  const base = (import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL;
  const url = `${base}models/braseiro.glb`;
  new GLTFLoader().load(url, (gltf) => {
    const root = gltf.scene;
    root.updateMatrixWorld(true);
    {
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const src = m.material as THREE.MeshStandardMaterial;
        for (const t of [src.map, src.normalMap]) {
          if (!t) continue;
          t.magFilter = THREE.NearestFilter;
          t.minFilter = THREE.NearestMipmapNearestFilter;
          t.needsUpdate = true;
        }
        m.material = new THREE.MeshLambertMaterial({ map: src.map, normalMap: src.normalMap, normalScale: new THREE.Vector2(1.4, 1.4), side: src.side, name: src.name });
      });
    }
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const k = TOP / (box.max.y - box.min.y);
    let bowlR = 0.18;
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && /cesta|lambert2/.test((m.material as THREE.Material).name)) {
        const bb = new THREE.Box3().setFromObject(m);
        bowlR = ((bb.max.x - bb.min.x) / 2) * k;
      }
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    const g = new THREE.Group();
    root.scale.multiplyScalar(k);
    root.position.set(-((box.min.x + box.max.x) / 2) * k, -box.min.y * k, -((box.min.z + box.max.z) / 2) * k);
    g.add(root);
    model = { group: g, bowlR };
    waiting.splice(0).forEach((f) => f(model!));
  });
}

// chama `cb` com o modelo assim que ele estiver carregado (na hora, se já estiver)
export function onBrazierModel(cb: (m: BrazierModel) => void) {
  if (model) cb(model);
  else waiting.push(cb);
}
