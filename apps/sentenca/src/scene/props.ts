// OBJETOS DE CENA em modelo 3D (DESIGN.md §63): packs gratuitos tratados para o pixel.
//  · "q": Fantasy Props MegaKit (Standard), de Quaternius, CC0 (as texturas são quatro "trim sheets" compartilhadas, reduzidas a 256 px);
//  · "t": Medieval Tavern Props Pack, de System G6 (Qoma), CC0 (texturas reduzidas a 128 px).
// Os materiais viram Lambert (o mesmo das paredes), com o relevo do mapa de normais, cor de vértice quando o modelo tem, e filtro "nearest".
// Cada objeto é normalizado: centrado em x/z, pé em y = 0, e (no pack "t", que não tem escala real) na altura pedida no catálogo.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { adoptLayers } from './models';

const base = () => (import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL;
// q e t: só os objetos em uso (no repositório); qv: o pack inteiro da Quaternius, só para a vitrine (gerado à parte, fora do repositório)
export const PACK_URL: Record<string, string> = {
  q: 'models/props_q.glb',
  t: 'models/props_t.glb',
  qv: 'models/_vitrine/props_q.glb',
  bib: 'models/props_bib.glb', // a BIBLIOTECA: estantes com livros, atril, livros, velas, candelabro (tools/biblioteca_glb.mjs; DESIGN.md §71)
};

type Pack = Map<string, THREE.Object3D>;
const packs = new Map<string, Promise<Pack>>();
const lambertOf = new Map<THREE.Material, THREE.Material>();

function toLambert(src: THREE.Material, vertexColors: boolean): THREE.Material {
  const key = src;
  const hit = lambertOf.get(key);
  if (hit && (hit as THREE.MeshLambertMaterial).vertexColors === vertexColors) return hit;
  const s = src as THREE.MeshStandardMaterial;
  for (const t of [s.map, s.normalMap]) {
    if (!t) continue;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestMipmapNearestFilter;
    t.needsUpdate = true;
  }
  const m = new THREE.MeshLambertMaterial({
    map: s.map,
    normalMap: s.normalMap,
    normalScale: new THREE.Vector2(1.2, 1.2),
    color: s.color,
    side: s.side,
    vertexColors,
    alphaTest: s.alphaTest > 0 || s.transparent ? 0.5 : 0,
    name: s.name,
  });
  lambertOf.set(key, m);
  return m;
}

export function loadPack(id: string): Promise<Pack> {
  let p = packs.get(id);
  if (!p) {
    p = new Promise<Pack>((res, rej) =>
      new GLTFLoader().load(
        base() + PACK_URL[id],
        (g) => {
          const map: Pack = new Map();
          g.scene.updateMatrixWorld(true);
          g.scene.traverse((o) => {
            const m = o as THREE.Mesh;
            if (!m.isMesh) return;
            const hasVC = !!m.geometry.attributes.color;
            const mats = Array.isArray(m.material) ? m.material : [m.material];
            const conv = mats.map((x) => toLambert(x, hasVC));
            m.material = Array.isArray(m.material) ? conv : conv[0];
            m.castShadow = true;
            m.receiveShadow = true;
          });
          for (const o of g.scene.children) map.set(o.name.replace(/^Q_/, ''), o);
          res(map);
        },
        undefined,
        rej,
      ),
    );
    packs.set(id, p);
  }
  return p;
}

// uma cópia do objeto, normalizada (centro em x/z, pé em y = 0; `h` = altura desejada em metros, senão a escala do modelo)
export function propInstance(tpl: THREE.Object3D, h?: number): { obj: THREE.Group; size: THREE.Vector3 } {
  const c = tpl.clone(true);
  c.position.set(0, 0, 0);
  c.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(c);
  const size = box.getSize(new THREE.Vector3());
  const k = h ? h / Math.max(1e-3, size.y) : 1;
  const g = new THREE.Group();
  c.scale.multiplyScalar(k);
  c.position.set(-((box.min.x + box.max.x) / 2) * k, -box.min.y * k, -((box.min.z + box.max.z) / 2) * k);
  g.add(c);
  return { obj: g, size: size.multiplyScalar(k) };
}

// põe um objeto na sala assim que o pack carregar (o resto da sala não espera)
export function placeProp(parent: THREE.Object3D, pack: string, name: string, x: number, y: number, z: number, ry = 0, h?: number, onReady?: (o: THREE.Object3D, size: THREE.Vector3) => void) {
  const holder = new THREE.Group();
  holder.position.set(x, y, z);
  holder.rotation.y = ry;
  parent.add(holder);
  loadPack(pack).then((p) => {
    const tpl = p.get(name);
    if (!tpl) {
      console.warn('objeto não achado', pack, name);
      return;
    }
    const { obj, size } = propInstance(tpl, h);
    holder.add(obj);
    adoptLayers(parent, holder);
    onReady?.(obj, size);
  });
  return holder;
}

// JUNTA os objetos parados de uma sala numa malha por material (as texturas da Quaternius são folhas compartilhadas: dezenas de objetos viram
// poucos desenhos por quadro). Espera os packs carregarem (os objetos já colocados entram antes, na ordem das promessas) e substitui, em
// `root`, os objetos de `holders` pelas malhas juntas. Os atributos quantizados viram float antes de aplicar a posição.
export function bakeProps(root: THREE.Object3D, holders: THREE.Object3D[], packIds: string[]) {
  Promise.all(packIds.map(loadPack)).then(() => {
    root.updateWorldMatrix(true, true);
    const inv = root.matrixWorld.clone().invert();
    const groups = new Map<string, { mat: THREE.Material; geos: THREE.BufferGeometry[] }>();
    for (const h of holders) {
      h.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh || Array.isArray(m.material)) return;
        let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
        const f = new THREE.BufferGeometry();
        for (const [name, a] of Object.entries(g.attributes)) {
          if (name !== 'position' && name !== 'normal' && name !== 'uv' && name !== 'color') continue;
          const at = a as THREE.BufferAttribute;
          const arr = new Float32Array(at.count * at.itemSize);
          for (let i = 0; i < at.count; i++) for (let c = 0; c < at.itemSize; c++) arr[i * at.itemSize + c] = at.getComponent(i, c);
          f.setAttribute(name, new THREE.BufferAttribute(arr, at.itemSize));
        }
        g.dispose();
        g = f;
        g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
        const key = m.material.uuid + ':' + Object.keys(g.attributes).sort().join(',');
        const e = groups.get(key) ?? { mat: m.material, geos: [] };
        e.geos.push(g);
        groups.set(key, e);
      });
      h.removeFromParent();
    }
    for (const { mat, geos } of groups.values()) {
      const merged = geos.length > 1 ? mergeGeometries(geos) : geos[0];
      if (!merged) continue;
      const out = new THREE.Mesh(merged, mat);
      out.castShadow = true;
      out.receiveShadow = true;
      root.add(out);
      adoptLayers(root, out);
      if (merged !== geos[0]) geos.forEach((x) => x.dispose());
    }
  });
}

// alturas reais dos objetos do pack "t" (o modelo original não tem escala de metros)
export const T_HEIGHT: Record<string, number> = {
  bar_counter: 1.05,
  barrel: 0.9,
  basket: 0.62,
  bucket_wood: 0.34,
  candle_plate: 0.16,
  chair_wood: 0.95,
  chair_wood_2: 0.5,
  fireplace_2: 2.6,
  firewood: 0.16,
  firewood_burning: 0.4,
  lamp_wood: 0.55,
  plate_wood: 0.04,
  sack: 0.7,
  sack_2: 0.5,
  shelf_wood: 0.38,
  table_wood: 0.8,
  table_wood_round: 0.72,
  tankard_wood: 0.17,
  torch_2: 0.62,
};
