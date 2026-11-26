// A VITRINE (?vitrine=1): sala isolada, fora do jogo, que mostra os objetos dos packs já tratados para o pixel, iluminados como no
// Vestíbulo (tochas com sombra de verdade, chão de lajes, cantaria com relevo). Cada "baia" é uma fileira de objetos diante de um muro;
// `window.__vitrine()` devolve onde pôr a câmera em cada baia (para as capturas). Nada é salvo.
import * as THREE from 'three';
import { Kit } from '../kit';
import { flagstones, floorPlane, masonry, reliefMat, ST, stoneBox } from '../arch';
import { loadPack, propInstance, T_HEIGHT } from '../props';
import type { Ctx, Room } from '../types';

// [pack, nome] por baia (agrupados por tipo)
const BAYS: [string, string[]][] = [
  // só objetos do dia a dia (DESIGN.md §62): nada de armas, poções, equipamento, tesouro, chaves, boneco de treino, ferramentas de ofício,
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
// no máximo 4 objetos por baia (para a câmera chegar perto)
const CHUNKS: [string, string[]][] = BAYS.flatMap(([pk, ns]) => {
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
  const info: { bay: number; names: string[]; cam: [number, number, number, number] }[] = [];
  CHUNKS.forEach(([pack, names], i) => {
    const z = -2 - i * GAP;
    // o muro de fundo da baia (esconde as outras), duas tochas com sombra e uma luz de frente fraca
    kit.add(stoneBox(2 * X, 5, 0.5, wallM, 0, 2.5, z - 1.9));
    const e0 = kit.emitters.length;
    kit.torch(-3.6, 2.0, z - 1.65, 0, 1, i * 0.7);
    kit.torch(3.6, 2.0, z - 1.65, 0, 1, i * 0.7 + 1.3);
    kit.emitters.slice(e0).forEach((e) => (e.shadow = true));
    kit.light(0, 2.6, z + 2.2, 0xffd2a0, 14);
    loadPack(pack).then((p) => {
      const items = names.map((n) => {
        const tpl = p.get(n);
        if (!tpl) return null;
        return { n, ...propInstance(tpl, pack === 't' ? T_HEIGHT[n] : undefined) };
      });
      const ok = items.filter((x) => x) as { n: string; obj: THREE.Group; size: THREE.Vector3 }[];
      const maxH = Math.max(...ok.map((x) => x.size.y));
      const gap = Math.max(0.25, ok.reduce((a, x) => a + x.size.x, 0) * 0.12);
      const W = ok.reduce((a, x) => a + x.size.x, 0) + gap * (ok.length - 1);
      // objetos pequenos sobem num plinto de pedra (para ficarem na altura do olhar)
      const lift = maxH < 0.5 ? 0.8 : 0;
      if (lift) kit.add(stoneBox(W + 0.8, lift, 1.4, plinthM, 0, lift / 2, z));
      let x = -W / 2;
      for (const it of ok) {
        it.obj.position.set(x + it.size.x / 2, lift, z);
        kit.group.add(it.obj);
        x += it.size.x + gap;
      }
      const cy = lift + maxH / 2;
      const dist = Math.min(GAP - 3, Math.max(1.5, (W / 2) / 0.78, maxH * 1.25));
      info[i] = { bay: i, names: ok.map((o) => o.n), cam: [0, z + dist, 0, Math.atan2(cy - 1.55, dist)] };
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
    },
    reset() {},
    dispose() {},
  };
}
