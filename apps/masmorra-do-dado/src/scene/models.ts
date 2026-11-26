// MODELOS 3D de fora (DESIGN.md §61 e §65). O braseiro, a partir de "Stone Column Brazier" de Amarveer (Sketchfab, CC BY 4.0: o
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

// ── A TOCHA DE PAREDE (DESIGN.md §65): "Medieval Wall Torch", de Kigha (Sketchfab, CC BY 4.0; crédito na tela de Créditos), tratada por
// `tools/tocha_glb.py` (texturas de 128 px com a oclusão do próprio modelo, filtro "nearest"). Entra em TODA tocha de parede, no lugar do
// suporte e do cabo de caixas. O modelo é normalizado assim: a placa de trás na parede em x = 0 (a frente da tocha é +x), o alto da gaiola
// de ferro em y = 0, e a escala que põe o meio da gaiola a 0,26 m da parede, isto é, exatamente embaixo da chama de sempre (o ponto onde o
// dado acende as tochas dos puzzles não muda).
export const TORCH_REACH = 0.26;

// o que chega DEPOIS de a sala estar montada (modelos carregados à parte) entra na mesma camada de desenho das outras peças dela (o motor
// tira as salas longe do desenho trocando a camada das malhas; sem isto, o objeto novo seria desenhado mesmo com a sala longe)
export function adoptLayers(room: THREE.Object3D, obj: THREE.Object3D) {
  let mask = -1;
  for (const c of room.children) {
    if ((c as THREE.Mesh).isMesh) {
      mask = c.layers.mask;
      break;
    }
  }
  if (mask < 0) return;
  obj.traverse((o) => {
    if ((o as THREE.Mesh).isMesh || (o as THREE.Sprite).isSprite || (o as THREE.Points).isPoints) o.layers.mask = mask;
  });
}
let torch: THREE.Group | null = null;
let torchFailed = false;
const torchWaiting: ((m: THREE.Group | null) => void)[] = [];
{
  const base = (import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL;
  new GLTFLoader().load(
    `${base}models/tocha.glb`,
    (gltf) => {
      const root = gltf.scene;
      root.updateMatrixWorld(true);
      const v = new THREE.Vector3();
      const pts: THREE.Vector3[] = [];
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
        m.material = new THREE.MeshLambertMaterial({ map: src.map, normalMap: src.normalMap, normalScale: new THREE.Vector2(1.3, 1.3), side: THREE.DoubleSide, name: 'tocha' });
        m.castShadow = false; // (a tocha não faz sombra: a chama dela ficaria com uma barra preta na parede)
        m.receiveShadow = true;
        m.userData.noShadow = true;
        const pos = m.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) pts.push(v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).clone());
      });
      const box = new THREE.Box3().setFromPoints(pts);
      const h = box.max.y - box.min.y;
      const cup = pts.filter((p) => p.y > box.max.y - 0.22 * h);
      const cupX = (Math.min(...cup.map((p) => p.x)) + Math.max(...cup.map((p) => p.x))) / 2;
      const k = TORCH_REACH / (cupX - box.min.x);
      root.scale.multiplyScalar(k);
      root.position.set(-box.min.x * k, -box.max.y * k, -((box.min.z + box.max.z) / 2) * k);
      const g = new THREE.Group();
      g.add(root);
      torch = g;
      torchWaiting.splice(0).forEach((f) => f(g));
    },
    undefined,
    () => {
      torchFailed = true;
      torchWaiting.splice(0).forEach((f) => f(null));
    },
  );
}

// chama `cb` com o modelo da tocha (uma cópia por tocha) assim que ele carregar; com `null` se o arquivo falhar (a tocha de caixas volta)
export function onTorchModel(cb: (m: THREE.Group | null) => void) {
  if (torch) cb(torch);
  else if (torchFailed) cb(null);
  else torchWaiting.push(cb);
}

// põe a tocha de parede: `x, y, z` é o ponto de sempre das tochas do jogo (10 cm à frente da parede, na altura do suporte), `nx, nz` a
// frente; o topo da gaiola fica 0,47 m acima (a chama do jogo, de 0,42 a 0,72, sai de dentro dela). `fallback` monta a tocha antiga.
export function wallTorch(parent: THREE.Object3D, x: number, y: number, z: number, nx: number, nz: number, fallback: (holder: THREE.Group) => void) {
  const holder = new THREE.Group();
  holder.position.set(x - nx * 0.1, y + 0.47, z - nz * 0.1);
  holder.rotation.y = Math.atan2(-nz, nx);
  parent.add(holder);
  onTorchModel((m) => {
    if (m) holder.add(m.clone());
    else {
      holder.position.set(0, 0, 0);
      holder.rotation.set(0, 0, 0);
      fallback(holder);
    }
    adoptLayers(parent, holder);
  });
  return holder;
}
