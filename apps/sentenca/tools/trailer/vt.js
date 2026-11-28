// relógio virtual: o jogo só anda quando __vtStep(ms) é chamado (performance.now, Date.now, requestAnimationFrame, setTimeout/setInterval)
(() => {
  const nNow = performance.now.bind(performance);
  const nDate = Date.now;
  const nRAF = window.requestAnimationFrame.bind(window);
  const nCAF = window.cancelAnimationFrame.bind(window);
  const nST = window.setTimeout.bind(window);
  const nCT = window.clearTimeout.bind(window);
  const nSI = window.setInterval.bind(window);
  const nCI = window.clearInterval.bind(window);
  let on = false;
  let vt = 0; // ms virtuais desde o começo do modo virtual
  let base = 0;
  let dbase = 0;
  let raf = [];
  let rid = 1e6;
  let timers = new Map();
  let tid = 1e6;
  performance.now = () => (on ? base + vt : nNow());
  Date.now = () => (on ? dbase + vt : nDate());
  window.requestAnimationFrame = (cb) => {
    if (!on) return nRAF(cb);
    const id = ++rid;
    raf.push([id, cb]);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    raf = raf.filter((r) => r[0] !== id);
    nCAF(id);
  };
  window.setTimeout = (fn, ms = 0, ...a) => {
    if (!on) return nST(fn, ms, ...a);
    const id = ++tid;
    timers.set(id, { at: vt + Math.max(0, +ms || 0), fn, a, every: 0 });
    return id;
  };
  window.clearTimeout = (id) => {
    timers.delete(id);
    nCT(id);
  };
  window.setInterval = (fn, ms = 0, ...a) => {
    if (!on) return nSI(fn, ms, ...a);
    const id = ++tid;
    timers.set(id, { at: vt + Math.max(1, +ms || 1), fn, a, every: Math.max(1, +ms || 1) });
    return id;
  };
  window.clearInterval = (id) => {
    timers.delete(id);
    nCI(id);
  };
  window.__vtStart = () => {
    if (on) return;
    base = nNow();
    dbase = nDate();
    vt = 0;
    on = true;
  };
  window.__vtStep = (ms) => {
    const end = vt + ms;
    // os temporizadores que vencem neste passo, em ordem
    for (let guard = 0; guard < 10000; guard++) {
      let best = null;
      for (const [id, t] of timers) if (t.at <= end && (!best || t.at < best[1].at)) best = [id, t];
      if (!best) break;
      const [id, t] = best;
      vt = Math.max(vt, t.at);
      if (t.every) t.at += t.every;
      else timers.delete(id);
      try {
        typeof t.fn === 'function' ? t.fn(...t.a) : eval(t.fn);
      } catch (e) {
        console.error('vt timer', e);
      }
    }
    vt = end;
    const list = raf;
    raf = [];
    for (const [, cb] of list) {
      try {
        cb(base + vt);
      } catch (e) {
        console.error('vt raf', e);
      }
    }
    return vt;
  };
  window.__vtNow = () => vt;
})();
