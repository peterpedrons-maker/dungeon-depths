// O DADO PEDE PARA APONTAR (e para FAZER) nas áreas livres (DESIGN.md §42): ele se inclina para uma frase da parede, "lê" (o balão repete a
// frase) e pergunta «X ONDE ?». O jogador responde COM O MUNDO: mira na coisa e aperta E/AGIR. Errou: o dado balança a cabeça; na 2ª vez,
// ele se inclina para a coisa certa (mostra). Sem tela cheia, sem menu, sem punição. Ensina ONDE e a marca PERGUNTA.
import * as THREE from 'three';
import type { Inscription } from './inscription';
import type { Ctx, Interactable } from './types';
import { quiz } from '../story/quiz';

export interface PointAskOpts {
  id: string; // chave para lembrar no aparelho que já foi respondida
  ins: Inscription; // a frase da parede que o dado lê
  read: string[]; // a frase (o balão a repete)
  ask: string[]; // a pergunta, p.ex. ['brasa', 'onde', 'perg']
  targets: () => THREE.Vector3[]; // as coisas certas (locais da sala)
  radius?: number; // folga da mira em volta do alvo (m)
  near?: number; // de quão perto da frase o dado a lê (m)
  // depois de apontar: o dado pede para FAZER (p.ex. «VOCÊ ACENDER BRASEIRO ?») e comemora quando o jogador faz
  then?: { ask: string[]; done: () => boolean };
}

export interface PointAsk {
  interactable: Interactable;
  update(dt: number): void;
  state(): string;
}

export function makePointAsk(ctx: Ctx, o: PointAskOpts): PointAsk {
  const near = o.near ?? 5;
  const radius = o.radius ?? 0.55;
  let st: 'wait' | 'reading' | 'asking' | 'sleep' | 'pause' | 'doing' | 'done' = quiz.flag(o.id) ? 'done' : 'wait';
  let gaze = 0;
  let timer = 0;
  let misses = 0;
  const pos = new THREE.Vector3();
  const v = new THREE.Vector3();
  const calm = () => !ctx.paused() && ctx.have().die && ctx.die.state === 'hand';
  // o jogador encara a frase, de perto?
  const looking = () => {
    const a = ctx.aim();
    v.copy(o.ins.center).sub(a.o);
    const d = v.length();
    return d < near && d > 0.4 && a.d.dot(v.divideScalar(d)) > 0.94 && v.dot(o.ins.normal) < -0.2;
  };
  const hit = (): THREE.Vector3 | null => {
    const a = ctx.aim();
    for (const p of o.targets()) {
      v.copy(p).sub(a.o);
      const along = v.dot(a.d);
      if (along < 0.3 || along > 24) continue;
      if (v.addScaledVector(a.d, -along).length() < radius + along * 0.035) return p;
    }
    return null;
  };
  const nearestTarget = () => {
    const a = ctx.aim();
    let best: THREE.Vector3 | null = null;
    let bd = Infinity;
    for (const p of o.targets()) {
      const d = p.distanceTo(a.o);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  };
  const finish = () => {
    st = 'done';
    quiz.setFlag(o.id);
  };
  return {
    interactable: {
      pos,
      r: 2.7,
      label: 'Apontar',
      enabled: () => st === 'asking' && calm(),
      use: () => {
        if (hit()) {
          ctx.sfx('piece'); // o dado comemora
          ctx.dieSay(['conf'], { joy: true });
          if (o.then && !o.then.done()) {
            st = 'pause';
            timer = 0;
          } else finish();
          return;
        }
        misses++;
        ctx.sfx('error'); // balança a cabeça
        if (misses >= 2) {
          // 2ª vez: ele MOSTRA (inclina-se para a coisa certa e diz o nome dela)
          const p = nearestTarget();
          if (p) ctx.dieLook(p, 5);
          ctx.dieSay([o.ask[0]], { delay: 0.5 });
        }
      },
    },
    update(dt) {
      // a "coisa" com que se interage fica sempre adiante da mira (mais longe que as outras: folhas e gemas ao alcance têm a vez)
      const a = ctx.aim();
      pos.copy(a.o).addScaledVector(a.d, 2.5);
      if (st === 'done') return;
      timer += dt;
      if (st === 'wait' || st === 'sleep') {
        gaze = calm() && looking() ? gaze + dt : 0;
        if (gaze > (st === 'wait' ? 0.9 : 1.6)) {
          gaze = 0;
          st = 'reading';
          ctx.dieLook(o.ins.center, 3.5);
          timer = -ctx.dieTalk([{ glyphs: o.read }, { glyphs: o.ask }], { delay: 0.3 }) / 1000;
        }
      } else if (st === 'reading') {
        if (timer > -3.2) {
          st = 'asking'; // (a pergunta já está sendo escrita)
          timer = 0;
        }
      } else if (st === 'asking') {
        if (timer > 70 && calm()) {
          ctx.dieSay(['eu', 'esperar']); // não insiste: volta a perguntar se o jogador olhar a frase de novo
          st = 'sleep';
        }
      } else if (st === 'pause') {
        if (timer > 4.2 && calm() && o.then) {
          ctx.dieTalk([{ glyphs: o.then.ask }]);
          st = 'doing';
          timer = 0;
        }
      } else if (st === 'doing') {
        if (o.then!.done()) {
          if (timer > 0.6) ctx.dieSay(['conf'], { joy: true, delay: 1.9 }); // (depois da cena do dado queimando)
          finish();
        }
      }
    },
    state: () => st,
  };
}
