// A CAL (PUZZLES_PROPOSTAS Ficha 1): escrita fosforescente verde-limão pálida que só aparece no ESCURO da Casa (`ctx.blackout`).
// Opacidade = 1 − nível de luz, só abaixo de 25% de luz. Não calcula luz de verdade: segue o próprio escuro (`ctx.dark()`).
// Na parede (`nx`, `nz`) ou no TETO (`ceil: true`: a frase olha para baixo e se lê de pé, olhando para cima, de frente para a porta).
// Quando a cal aparece pela 1ª vez, as palavras vão para o diário (`ctx.seen`).
import * as THREE from 'three';
import { makeInscription, type Inscription } from './inscription';
import type { Kit } from './kit';
import type { Ctx } from './types';

export const CAL_COLOR = new THREE.Color('#c8f0a0');

export interface CalText {
  ins: Inscription;
  group: THREE.Group;
  v: number; // 0..1, quanto está visível agora
  seen: boolean;
  update(): void;
}

export function makeCal(kit: Kit, ctx: Ctx, o: { words: string[]; x: number; y: number; z: number; nx?: number; nz?: number; ceil?: boolean; size?: number; seed?: number }): CalText {
  const g = new THREE.Group();
  g.position.set(o.x, o.y, o.z);
  // no teto: olha para baixo; para quem está de frente para a porta (−z) e olha para cima, o alto da tela é +z e a direita é +x
  if (o.ceil) g.rotation.set(Math.PI / 2, 0, 0);
  kit.group.add(g);
  const ins = makeInscription(g, { words: o.words, x: 0, y: 0, z: 0, nx: o.ceil ? 0 : (o.nx ?? 0), nz: o.ceil ? 1 : (o.nz ?? 1), size: o.size ?? 0.3, age: 0.05, seed: o.seed ?? 51, hidden: true }, []);
  ins.center.set(o.x, o.y, o.z);
  for (const p of ins.panels) {
    p.mat.color.copy(CAL_COLOR);
    p.mat.emissive.copy(CAL_COLOR);
    p.mat.emissiveIntensity = 1.2;
    p.mat.fog = false;
  }
  ins.panels.forEach((_, i) => ins.setReveal(i, 0));
  const c: CalText = {
    ins,
    group: g,
    v: 0,
    seen: false,
    update() {
      const light = 1 - 0.92 * ctx.dark();
      c.v = light < 0.25 ? Math.min(1, (0.25 - light) / 0.12) : 0;
      ins.panels.forEach((_, i) => ins.setReveal(i, c.v));
      if (c.v > 0.6 && !c.seen) {
        c.seen = true;
        for (const w of ins.words) ctx.seen(w);
      }
    },
  };
  return c;
}
