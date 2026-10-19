// ─── GSAP-driven HUD "juice" ─────────────────────────────────────────────────
// Pure DOM/React-overlay polish — title/round-end entrances, a smoothly
// tweened score counter, combo punches, urgency pulses, tap feedback. This
// never touches the canvas: the game's own RAF loop (engine.ts/render.ts)
// stays the single source of truth for gameplay timing. GSAP only animates
// the HTML overlay sitting on top of it, which until now just snapped
// between states with bare Tailwind classes.

import gsap from 'gsap';

export function tweenNumber(obj: { value: number }, target: number, onUpdate: (rounded: number) => void, duration = 0.45) {
  gsap.to(obj, {
    value: target,
    duration,
    ease: 'power2.out',
    onUpdate: () => onUpdate(Math.round(obj.value)),
  });
}

export function resetNumber(obj: { value: number }, onUpdate: (rounded: number) => void) {
  gsap.killTweensOf(obj);
  obj.value = 0;
  onUpdate(0);
}

export function punch(el: Element | null, fromScale = 1.4) {
  if (!el) return;
  gsap.killTweensOf(el);
  gsap.fromTo(el, { scale: fromScale, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(3)' });
}

export function comboFlash(el: HTMLElement | null, color: string) {
  if (!el) return;
  gsap.killTweensOf(el);
  el.style.background = `radial-gradient(circle, ${color}55, transparent 70%)`;
  gsap.fromTo(el, { opacity: 0.6, scale: 0.85 }, { opacity: 0, scale: 1.5, duration: 0.6, ease: 'power1.out' });
}

export function tapPunch(el: Element | null) {
  if (!el) return;
  gsap.killTweensOf(el);
  gsap.fromTo(el, { scale: 0.86 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
}

export function startUrgencyPulse(el: Element | null): gsap.core.Tween | null {
  if (!el) return null;
  return gsap.to(el, { opacity: 0.35, duration: 0.3, repeat: -1, yoyo: true, ease: 'power1.inOut' });
}

export function stopUrgencyPulse(tween: gsap.core.Tween | null, el: Element | null) {
  tween?.kill();
  if (el) gsap.set(el, { opacity: 1 });
}

export function slideDownIn(el: Element | null) {
  if (!el) return;
  gsap.fromTo(el, { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
}

export function slideUpIn(el: Element | null) {
  if (!el) return;
  gsap.fromTo(el, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', delay: 0.15 });
}

interface TitleRefs {
  ball: Element | null;
  heading: Element | null;
  subtitle: Element | null;
  button: Element | null;
  tip: Element | null;
}

export function titleEntrance(refs: TitleRefs): gsap.core.Timeline {
  const tl = gsap.timeline();
  tl.fromTo(refs.ball, { y: -160, scale: 0.6, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.7, ease: 'bounce.out' })
    .fromTo(refs.heading, { opacity: 0, scale: 0.8, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(2)' }, '-=0.15')
    .fromTo(refs.subtitle, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35 }, '-=0.15')
    .fromTo(refs.button, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(3)' }, '-=0.1')
    .fromTo(refs.tip, { opacity: 0 }, { opacity: 1, duration: 0.4 }, '-=0.15');
  return tl;
}

export function idlePulse(el: Element | null): gsap.core.Tween | null {
  if (!el) return null;
  return gsap.to(el, { scale: 1.05, duration: 0.85, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}

interface RoundEndRefs {
  flag: Element | null;
  heading: Element | null;
  scoreWrap: Element | null;
  blocksLine: Element | null;
  button: Element | null;
}

export function roundEndEntrance(
  refs: RoundEndRefs,
  scoreObj: { value: number },
  finalScore: number,
  onScoreUpdate: (rounded: number) => void,
): gsap.core.Timeline {
  scoreObj.value = 0;
  onScoreUpdate(0);
  const tl = gsap.timeline();
  tl.fromTo(refs.flag, { y: -60, opacity: 0, rotate: -15 }, { y: 0, opacity: 1, rotate: 0, duration: 0.5, ease: 'bounce.out' })
    .fromTo(refs.heading, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.15')
    .fromTo(refs.scoreWrap, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, '-=0.1')
    .to(scoreObj, { value: finalScore, duration: 0.9, ease: 'power2.out', onUpdate: () => onScoreUpdate(Math.round(scoreObj.value)) }, '-=0.1')
    .fromTo(refs.blocksLine, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.3')
    .fromTo(refs.button, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(3)' }, '-=0.1');
  return tl;
}
