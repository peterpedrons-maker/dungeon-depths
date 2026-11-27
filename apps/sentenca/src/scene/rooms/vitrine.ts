// A VITRINE (?vitrine=1): sala isolada, fora do jogo, que mostra os objetos dos packs já tratados para o pixel, iluminados como no
// Vestíbulo (tochas com sombra de verdade, chão de lajes, cantaria com relevo). Cada "baia" é uma fileira de objetos diante de um muro;
// `window.__vitrine()` devolve onde pôr a câmera em cada baia (para as capturas). Nada é salvo.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Kit } from '../kit';
import { makeScribe } from '../scribe';
import { makeScribeRig } from '../scribeRig';
import { flagstones, floorPlane, masonry, reliefMat, ST, stoneBox } from '../arch';
import { loadPack, propInstance, T_HEIGHT } from '../props';
import { adoptLayers } from '../models';
import type { Ctx, Room } from '../types';

// [pack, nome] por baia (agrupados por tipo)
const BAYS: [string, string[]][] = [
  // só objetos do dia a dia (DESIGN.md §63): nada de armas, poções, equipamento, tesouro, chaves, boneco de treino, ferramentas de ofício,
  // comida e feira; nem o que imita a gramática dos puzzles: tochas e lanternas (chama na parede pode contar para um puzzle), estandartes e
  // panos pendurados (pano queima e revela o boato), lenha em brasa
  ['qv', ['Bench', 'Stool', 'Chair_1', 'Table_Large', 'Nightstand_Shelf', 'Cabinet']],
  ['qv', ['Bookcase_2', 'Shelf_Arch', 'Shelf_Simple', 'BookStand', 'Peg_Rack']],
  ['qv', ['Bed_Twin1', 'Bed_Twin2', 'Crate_Wooden', 'Crate_Metal', 'Barrel', 'Barrel_Holder']],
  ['qv', ['FarmCrate_Empty', 'Bag', 'Cage_Small', 'Chain_Coil']],
  ['qv', ['Candle_1', 'Candle_2', 'CandleStick', 'CandleStick_Triple', 'CandleStick_Stand', 'Chandelier']],
  ['qv', ['Pot_1', 'Pot_1_Lid', 'Bucket_Metal', 'Bucket_Wooden_1', 'Mug', 'Chalice']],
  ['qv', ['Table_Plate', 'Table_Fork', 'Table_Knife', 'Table_Spoon']],
  ['qv', ['Book_5', 'Book_7', 'Book_Simplified_Single', 'Book_Stack_1', 'Book_Stack_2', 'Scroll_1', 'Scroll_2']],
  ['qv', ['BookGroup_Small_1', 'BookGroup_Small_2', 'BookGroup_Small_3', 'BookGroup_Medium_1', 'BookGroup_Medium_2', 'BookGroup_Medium_3']],
  ['qv', ['Vase_2', 'Vase_4', 'Vase_Rubble_Medium', 'Rope_1', 'Rope_2', 'Rope_3']],
  ['t', ['barrel', 'basket', 'bucket_wood', 'sack', 'sack_2', 'chair_wood_2']],
  ['t', ['table_wood', 'table_wood_round', 'chair_wood', 'shelf_wood', 'bar_counter']],
  ['t', ['candle_plate', 'plate_wood', 'tankard_wood']],
];
// ?vitrine=bib: a prévia da BIBLIOTECA (pedido do Pedro): estantes com livros, livros, velas e candelabros, e os candidatos a Escrivão em
// modelo 3D com animação. Os nomes com "pack:" escolhem o pack de cada objeto; "char:arquivo:animação" é um personagem animado
const BIB_BAYS: [string, string[]][] = [
  ['*', ['bib:Estante_Livros_1', 'bib:Estante_Livros_2', 'bib:Estante_Livros_3', 'bib:Estante_Livros_4']],
  ['*', ['qv:Bookcase_2', 'qv:Shelf_Arch', 'qv:BookStand', 'qv:Table_Large']],
  ['*', ['qv:BookGroup_Medium_1', 'qv:BookGroup_Medium_3', 'qv:Book_Stack_1', 'qv:Book_7', 'qv:Scroll_2']],
  ['*', ['bib:Vela_Pires', 'bib:Vela_Curta', 'bib:Vela_Alta', 'qv:Candle_1', 'qv:Candle_2', 'qv:CandleStick']],
  ['*', ['bib:Candelabro', 'qv:CandleStick_Stand', 'qv:CandleStick_Triple', 'qv:Chandelier']],
  ['*', ['scribe:atual', 'char:escrivao_rogue:Idle', 'char:escrivao_rogue:Walk', 'char:rpg_wizard:Idle']],
  ['*', ['char:escrivao_rogue:PickUp', 'char:escrivao_rogue:Run', 'char:rpg_wizard:Spell1', 'char:rpg_wizard:Walk']],
];
// alturas em metros (os modelos desses packs não têm escala de verdade)
const BIB_H: Record<string, number> = { Estante_Livros_1: 2.1, Estante_Livros_2: 2.1, Estante_Livros_3: 2.1, Estante_Livros_4: 2.2, Vela_Pires: 0.2, Vela_Curta: 0.24, Vela_Alta: 0.42, Candelabro: 1.75 };
// ?vitrine=escrivao: o Escrivão de código ao lado do ANIMADO (DESIGN.md §70): parado, andando, debruçado, erguendo o dado, e os dois girando
const ESC_BAYS: [string, string[]][] = [
  ['*', ['scribe:parado', 'rig:parado', 'rig:andando', 'rig:debrucado']],
  ['*', ['scribe:gira', 'rig:gira', 'rig:ergue']],
];
const MODE = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('vitrine') : null;
const ALL_BAYS = MODE === 'bib' ? BIB_BAYS : MODE === 'escrivao' ? ESC_BAYS : BAYS;

// um personagem animado (cópia com esqueleto próprio), na altura de uma pessoa, com o material Lambert do jogo (nearest)
const EYE_Y = Number(new URLSearchParams(location.search).get('oy') ?? 0.42);
const EYE_Z = Number(new URLSearchParams(location.search).get('oz') ?? 0.22);
const charCache = new Map<string, Promise<{ scene: THREE.Group; clips: THREE.AnimationClip[] }>>();
function loadChar(file: string) {
  let p = charCache.get(file);
  if (!p) {
    const base = (import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL;
    p = new Promise((res, rej) => new GLTFLoader().load(`${base}models/_vitrine/${file}.glb`, (g) => res({ scene: g.scene, clips: g.animations }), undefined, rej));
    charCache.set(file, p);
  }
  return p;
}
function charInstance(src: THREE.Group, file: string) {
  const c = cloneSkinned(src) as THREE.Group;
  c.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const sm = m.material as THREE.MeshStandardMaterial;
    if (sm.map) {
      sm.map.magFilter = THREE.NearestFilter;
      sm.map.minFilter = THREE.NearestMipmapNearestFilter;
    }
    m.material = new THREE.MeshLambertMaterial({ map: sm.map, side: THREE.DoubleSide });
    m.castShadow = true;
    m.receiveShadow = true;
    m.frustumCulled = false;
  });
  c.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(c);
  // o Escrivão: dois olhos quadrados acesos dentro do capuz, presos ao osso da cabeça (seguem a animação)
  if (file.startsWith('escrivao')) {
    let head: THREE.Bone | null = null;
    c.traverse((o) => {
      if ((o as THREE.Bone).isBone && /^head$/i.test(o.name)) head = o as THREE.Bone;
    });
    const face = c.getObjectByName('Face');
    if (head && face) {
      const fb = new THREE.Box3().setFromObject(face);
      const eyeM = new THREE.MeshBasicMaterial({ color: 0xffe9a0, fog: false });
      const hb = head as THREE.Bone;
      const s = (fb.max.y - fb.min.y) * 0.075;
      for (const sx of [-1, 1]) {
        const e = new THREE.Mesh(new THREE.BoxGeometry(s, s, s * 0.4), eyeM);
        const wp = new THREE.Vector3((fb.min.x + fb.max.x) / 2 + sx * s * 1.1, fb.min.y + (fb.max.y - fb.min.y) * EYE_Y, fb.max.z - (fb.max.z - fb.min.z) * EYE_Z);
        hb.add(e);
        e.position.copy(hb.worldToLocal(wp));
        e.scale.divide(hb.getWorldScale(new THREE.Vector3()));
      }
    }
  }
  const k = 1.8 / Math.max(0.01, box.max.y - box.min.y);
  c.scale.multiplyScalar(k);
  const g = new THREE.Group();
  c.position.y = -box.min.y * k;
  g.add(c);
  return { obj: g, root: c, size: new THREE.Vector3((box.max.x - box.min.x) * k, 1.8, (box.max.z - box.min.z) * k) };
}

// no máximo 4 objetos por baia (para a câmera chegar perto)
const CHUNKS: [string, string[]][] = ALL_BAYS.flatMap(([pk, ns]) => {
  const out: [string, string[]][] = [];
  const n = Math.ceil(ns.length / 4);
  const per = Math.ceil(ns.length / n);
  for (let i = 0; i < ns.length; i += per) out.push([pk, ns.slice(i, i + per)]);
  return out;
});
export const VITRINE_BAYS = CHUNKS;

export function buildVitrine(_ctx: Ctx): Room {
  const kit = new Kit('ruin');
  kit.lively = true;
  const anims: ((dt: number, t: number) => void)[] = []; // (os personagens animados)
  const GAP = 14;
  const N = CHUNKS.length;
  const Z1 = 14;
  const Z0 = -6 - N * GAP;
  const X = 9;
  const wallM = reliefMat(masonry({ rows: [16, 24], blocks: [26, 60], seed: 311, theme: 'ruin' }), 4.5);
  const plinthM = reliefMat(masonry({ rows: [22, 30], blocks: [44, 72], seed: 312, theme: 'ruin', tint: 1.12 }), 2.5);
  kit.add(floorPlane(-X, X, Z0, Z1, 0, reliefMat(flagstones(313, 'ruin'), 4.5), 2 * ST));
  kit.add(stoneBox(0.5, 5, Z1 - Z0, wallM, -X - 0.25, 2.5, (Z0 + Z1) / 2));
  kit.add(stoneBox(0.5, 5, Z1 - Z0, wallM, X + 0.25, 2.5, (Z0 + Z1) / 2));
  const ceil = floorPlane(-X, X, Z0, Z1, 5, reliefMat(masonry({ rows: [12, 16], blocks: [22, 42], seed: 314, theme: 'ruin', tint: 0.8 }), 2), ST);
  ceil.rotation.x = Math.PI; // (olhando para baixo)
  ceil.position.set(0, 10, Z0 + Z1);
  kit.add(ceil);
  const info: { bay: number; names: string[]; cam: [number, number, number, number]; xs: number[]; z: number }[] = [];
  CHUNKS.forEach(([pack, names], i) => {
    const z = -2 - i * GAP;
    // o muro de fundo da baia (esconde as outras), duas tochas com sombra e uma luz de frente fraca
    kit.add(stoneBox(2 * X, 5, 0.5, wallM, 0, 2.5, z - 1.9));
    const e0 = kit.emitters.length;
    kit.torch(-3.6, 2.0, z - 1.65, 0, 1, i * 0.7);
    kit.torch(3.6, 2.0, z - 1.65, 0, 1, i * 0.7 + 1.3);
    kit.emitters.slice(e0).forEach((e) => (e.shadow = true));
    kit.light(0, 2.6, z + 2.2, 0xffd2a0, 14);
    const one = async (n: string): Promise<{ n: string; obj: THREE.Group; size: THREE.Vector3 } | null> => {
      const [pk, nm, clip] = pack === '*' ? (n.split(':') as [string, string, string?]) : [pack, n];
      if (pk === 'scribe') {
        const sc = makeScribe();
        if (MODE !== 'escrivao') sc.group.scale.setScalar(0.92);
        const spin = nm === 'gira';
        anims.push((dt, t) => {
          sc.animate(dt, t, { walk: 0, lean: MODE === 'escrivao' ? 0 : 0.1, headPitch: 0.1, reach: 0 });
          if (spin) sc.group.rotation.y = t * 0.6;
        });
        return { n: 'Escrivão de código', obj: sc.group as THREE.Group, size: new THREE.Vector3(0.9, MODE === 'escrivao' ? 2.25 : 1.8, 0.6) };
      }
      if (pk === 'rig') {
        const sc = makeScribeRig();
        const holder = new THREE.Group();
        holder.add(sc.group);
        void sc.ready.then((ok) => ok && adoptLayers(kit.group, sc.group));
        anims.push((dt, t) => {
          const k = (t * 0.25) % 1;
          if (nm === 'andando') sc.animate(dt, t, { walk: 0.8 });
          else if (nm === 'debrucado') sc.animate(dt, t, { lean: 1, rest: 1, headPitch: 0 });
          else if (nm === 'ergue') sc.animate(dt, t, { lean: 0.8, rest: 0.6, raise: k > 0.5 ? 1 : 0, back: k < 0.25 ? 1 : 0 });
          else sc.animate(dt, t, { walk: 0, headPitch: 0.1 });
          if (nm === 'gira') sc.group.rotation.y = t * 0.6;
        });
        return { n: `Escrivão animado · ${nm}`, obj: holder, size: new THREE.Vector3(0.9, 2.25, 0.6) };
      }
      if (pk === 'char') {
        const src = await loadChar(nm);
        const inst = charInstance(src.scene, nm);
        const mixer = new THREE.AnimationMixer(inst.root);
        const c = src.clips.find((x) => x.name === clip) ?? src.clips[0];
        if (c) mixer.clipAction(c).play();
        anims.push((dt) => mixer.update(dt));
        return { n: `${nm} · ${clip}`, obj: inst.obj, size: inst.size };
      }
      const p = await loadPack(pk);
      const tpl = p.get(nm);
      if (!tpl) return null;
      return { n: nm, ...propInstance(tpl, pk === 't' ? T_HEIGHT[nm] : BIB_H[nm]) };
    };
    Promise.all(names.map(one)).then((items) => {
      const ok = items.filter((x) => x) as { n: string; obj: THREE.Group; size: THREE.Vector3 }[];
      const maxH = Math.max(...ok.map((x) => x.size.y));
      const gap = Math.max(0.25, ok.reduce((a, x) => a + x.size.x, 0) * 0.12);
      const W = ok.reduce((a, x) => a + x.size.x, 0) + gap * (ok.length - 1);
      // objetos pequenos sobem num plinto de pedra (para ficarem na altura do olhar)
      const lift = maxH < 0.5 ? 0.8 : 0;
      if (lift) kit.add(stoneBox(W + 0.8, lift, 1.4, plinthM, 0, lift / 2, z));
      let x = -W / 2;
      const xs: number[] = [];
      for (const it of ok) {
        it.obj.position.set(x + it.size.x / 2, lift, z);
        xs.push(+(x + it.size.x / 2).toFixed(2));
        kit.group.add(it.obj);
        x += it.size.x + gap;
      }
      const cy = lift + maxH / 2;
      const dist = Math.min(GAP - 3, Math.max(1.5, (W / 2) / 0.78, maxH * 1.25));
      info[i] = { bay: i, names: ok.map((o) => o.n), cam: [0, z + dist, 0, Math.atan2(cy - 1.55, dist)], xs, z };
    });
  });
  (window as unknown as { __vitrine: () => unknown }).__vitrine = () => info;
  kit.bake();
  kit.group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.receiveShadow = true;
  });
  return {
    name: 'Vitrine',
    subtitle: 'Objetos tratados para o pixel.',
    group: kit.group,
    surfaces: kit.surfaces,
    emitters: kit.emitters,
    inscriptions: [],
    doorZ: Z0,
    entranceZ: Z1,
    start: new THREE.Vector3(0, 0, 1),
    startYaw: 0,
    fog: { color: '#07070c', near: 6, far: 26 },
    ambient: { color: 0x5a567e, intensity: 0.75 },
    boxes: [],
    rects: () => [],
    clampDie(p, vel, e, R) {
      if (p.y < R) {
        p.y = R;
        if (vel.y < 0) vel.y = -vel.y * e;
      }
    },
    groundY: () => 0,
    dieFloor: () => 0,
    holdsDie: () => false,
    update(dt, t) {
      kit.tick(dt, t);
      for (const a of anims) a(dt, t);
    },
    reset() {},
    dispose() {},
  };
}
