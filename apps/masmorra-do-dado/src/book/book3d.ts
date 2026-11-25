import * as THREE from 'three';
import { diary, diaryStore } from '../story/diary';
import { ui } from '../story/ui';
import { diaryCoverArt, diaryEdgeArt, diaryLeatherArt, diarySpineArt } from './bookart';
import { currentFloor, ERASER_PEN, FREE_MAX, layout, MAP_AREA, NOTE_MAX, PH, PW, renderPage, stampBox, stampChoice, STAMP_PEN, TRAY_N, trayStart, type Region, type View } from './pages';

// O diário: um livro de verdade, no HUD. Duas metades presas ao lombo, folhas que viram, e as páginas
// (desenhadas em pixels no próprio papel) que se escolhem pelo índice da contracapa.
const BW = 0.5; // largura de cada metade
const BH = 0.68;
const GAP = 0.015; // folga entre o lombo e o papel
const PWD = BW - 0.03; // largura do papel
const PHD = BH - 0.05;
const SEG = 12;
const curve = (u: number) => -0.03 * (1 - u) ** 2; // o papel desce em direção ao lombo

export interface BookEnv {
  scene: THREE.Scene;
  cam: THREE.PerspectiveCamera;
  dom: HTMLElement;
  sound(name: 'uiopen' | 'uiclose' | 'uiflip' | 'uiblip'): void;
  halfW(): number;
}

const POSE = {
  start: { x: 0.62, y: -1.0, rx: -1.0, ry: -0.55, rz: 0.45, s: 0.62 },
  mid: { x: 0.3, y: -0.3, rx: -0.8, ry: -0.35, rz: 0.22, s: 0.8 },
  end: { x: 0, y: 0.0, rx: -0.15, ry: 0, rz: 0, s: 1.2 }, // aberto: ocupa quase a tela toda (mais espaço para ler)
};

const clamp01 = (u: number) => Math.min(1, Math.max(0, u));
const ease = (u: number) => u * u * (3 - 2 * u);

export function createDiaryBook(env: BookEnv) {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  root.add(inner);
  root.visible = false;
  env.scene.add(root);

  // ── texturas das páginas (quatro: esquerda, direita e as duas faces da folha que vira) ──
  const mkPage = () => {
    const c = document.createElement('canvas');
    c.width = PW;
    c.height = PH;
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter; // de perto, pixels quadrados
    t.minFilter = THREE.LinearFilter; // de longe, o texto se funde em vez de perder traços
    t.generateMipmaps = false;
    t.colorSpace = THREE.SRGBColorSpace;
    return { c, ctx: c.getContext('2d', { willReadFrequently: false })!, t };
  };
  const pgL = mkPage();
  const pgR = mkPage();
  const lfF = mkPage();
  const lfB = mkPage();
  lfB.t.wrapS = THREE.RepeatWrapping; // o verso da folha é lido de trás para a frente
  lfB.t.repeat.x = -1;
  lfB.t.offset.x = 1;

  const paperMat = (t: THREE.Texture, side: THREE.Side = THREE.FrontSide) => new THREE.MeshBasicMaterial({ map: t, side, fog: false });
  const matL = paperMat(pgL.t);
  const matR = paperMat(pgR.t);
  const matLeafF = paperMat(lfF.t, THREE.FrontSide);
  const matLeafB = paperMat(lfB.t, THREE.BackSide);

  const edgeMap = diaryEdgeArt();
  edgeMap.repeat.set(1, 1);
  const edge = new THREE.MeshLambertMaterial({ map: edgeMap, emissive: 0xffffff, emissiveMap: edgeMap, emissiveIntensity: 0.18 });
  const leatherMap = diaryLeatherArt();
  leatherMap.repeat.set(2, 2.6);
  const leather = new THREE.MeshLambertMaterial({ map: leatherMap, emissive: 0xffffff, emissiveMap: leatherMap, emissiveIntensity: 0.22 });
  const frontMap = diaryCoverArt();
  const front = new THREE.MeshLambertMaterial({ map: frontMap, emissive: 0xffffff, emissiveMap: frontMap, emissiveIntensity: 0.3 });
  const brass = new THREE.MeshLambertMaterial({ color: 0xc89a48, emissive: 0x5a3a10, emissiveIntensity: 0.6 });

  // metade do livro: bloco de folhas + capa
  const makeHalf = (left: boolean) => {
    const g = new THREE.Group();
    const s = left ? -1 : 1;
    // bloco de folhas: o topo acompanha a curva do papel (mais fino junto ao lombo)
    const bg = new THREE.BoxGeometry(PWD, PHD, 0.06, SEG, 1, 1);
    bg.translate(s * (GAP + PWD / 2), 0, 0);
    const bp = bg.attributes.position;
    for (let i = 0; i < bp.count; i++) {
      const u = (Math.abs(bp.getX(i)) - GAP) / PWD;
      bp.setZ(i, bp.getZ(i) > 0 ? curve(u) - 0.0012 : -0.04);
    }
    bg.computeVertexNormals();
    const block = new THREE.Mesh(bg, edge);
    const cover = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, 0.03), [leather, leather, leather, leather, leather, left ? front : leather]);
    cover.position.set((s * BW) / 2, 0, -0.055);
    g.add(block, cover);
    // cantoneiras de latão nas duas pontas de fora: dobram por cima da beirada da capa
    for (const sy of [1, -1]) {
      const cx = s * (BW - 0.022);
      const cy = sy * (BH / 2 - 0.022);
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.036), brass);
      a.position.set(cx, sy * (BH / 2 - 0.004), -0.055);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.05, 0.036), brass);
      b.position.set(s * (BW - 0.004), cy, -0.055);
      const rivet = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.006), brass);
      rivet.position.set(cx, cy, -0.037);
      g.add(a, b, rivet);
    }
    return g;
  };
  const rightHalf = makeHalf(false);
  const leftPivot = new THREE.Group();
  leftPivot.add(makeHalf(true));
  inner.add(rightHalf, leftPivot);

  // o papel que se lê, ligeiramente curvo em direção ao lombo
  const pageGeo = (left: boolean) => {
    const geo = new THREE.PlaneGeometry(PWD, PHD, SEG, 1);
    geo.translate((left ? -1 : 1) * (GAP + PWD / 2), 0, 0);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = (Math.abs(p.getX(i)) - GAP) / PWD;
      p.setZ(i, curve(u));
    }
    return geo;
  };
  const meshL = new THREE.Mesh(pageGeo(true), matL);
  const meshR = new THREE.Mesh(pageGeo(false), matR);
  leftPivot.add(meshL);
  inner.add(meshR);

  // folha que vira (articulada no lombo)
  const leafGeo = new THREE.PlaneGeometry(PWD, PHD, 18, 1);
  leafGeo.translate(PWD / 2, 0, 0);
  const leafBase = Float32Array.from(leafGeo.attributes.position.array as Float32Array);
  const leafF = new THREE.Mesh(leafGeo, matLeafF);
  const leafB = new THREE.Mesh(leafGeo, matLeafB);
  const leaf = new THREE.Group();
  leaf.add(leafF, leafB);
  leaf.visible = false;
  inner.add(leaf);
  const bend = (theta: number, lag: number) => {
    const p = leafGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = leafBase[i * 3] / PWD;
      const phi = theta - lag * u;
      p.setXYZ(i, GAP + u * PWD * Math.cos(phi), leafBase[i * 3 + 1], 0.003 + u * PWD * Math.sin(phi) + curve(u) * Math.abs(Math.cos(theta)) ** 3);
    }
    p.needsUpdate = true;
    leafGeo.computeBoundingSphere();
  };

  // a lombada: meia-cana de couro atrás do dobra, com as nervuras e o ouro
  const spineGeo = new THREE.CylinderGeometry(0.04, 0.04, BH, 14, 1, true, Math.PI / 2, Math.PI);
  const spine = new THREE.Mesh(spineGeo, new THREE.MeshLambertMaterial({ map: diarySpineArt(), side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: diarySpineArt(), emissiveIntensity: 0.22 }));
  spine.position.set(0, 0, -0.055);
  inner.add(spine);
  // cabeceado: o cordão listrado no alto e embaixo do miolo, junto do lombo
  const hbTex = (() => {
    const c = document.createElement('canvas');
    c.width = 8;
    c.height = 2;
    const g = c.getContext('2d')!;
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#c89a48' : '#8a2418';
      g.fillRect(i, 0, 1, 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  for (const sy of [1, -1]) {
    const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 6), new THREE.MeshLambertMaterial({ map: hbTex, emissive: 0x401008 }));
    hb.rotation.z = Math.PI / 2;
    hb.position.set(0, sy * (PHD / 2 + 0.002), -0.012);
    inner.add(hb);
  }
  // duas fitas marcadoras que pendem do lombo (vermelha e verde-escura), com a ponta em V
  const ribbonGeo = (() => {
    const sh = new THREE.Shape();
    const w = 0.009;
    sh.moveTo(-w, 0);
    sh.lineTo(w, 0);
    sh.lineTo(w, -0.18);
    sh.lineTo(0, -0.165);
    sh.lineTo(-w, -0.18);
    sh.closePath();
    return new THREE.ShapeGeometry(sh);
  })();
  const ribbon = new THREE.Group();
  const rib1 = new THREE.Mesh(ribbonGeo, new THREE.MeshLambertMaterial({ color: 0xa8321a, emissive: 0x5a1a10, side: THREE.DoubleSide }));
  rib1.position.set(0.05, -BH / 2 + 0.03, 0.004);
  rib1.rotation.z = 0.12;
  const rib2 = new THREE.Mesh(ribbonGeo, new THREE.MeshLambertMaterial({ color: 0x2a5a3a, emissive: 0x0e2a18, side: THREE.DoubleSide }));
  rib2.position.set(0.085, -BH / 2 + 0.03, 0.003);
  rib2.rotation.z = 0.32;
  rib2.scale.y = 0.8;
  ribbon.add(rib1, rib2);
  inner.add(ribbon);
  // a presilha: uma tira de couro solta na beirada da capa de trás, com a fivela de latão na ponta
  const strap = new THREE.Group();
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.007), leather);
  band.position.set(0.055, 0, 0);
  strap.add(band);
  const fr = (w: number, h: number, x: number, y: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.012), brass);
    m.position.set(x, y, 0.002);
    strap.add(m);
  };
  fr(0.008, 0.074, 0.11, 0);
  fr(0.008, 0.074, 0.142, 0);
  fr(0.04, 0.008, 0.126, 0.033);
  fr(0.04, 0.008, 0.126, -0.033);
  fr(0.03, 0.005, 0.124, 0); // a lingueta
  strap.position.set(BW - 0.01, -0.06, -0.072);
  strap.rotation.z = -0.18;
  inner.add(strap);

  // ── estado ──
  let T = 0; // 0 = guardado, 1 = aberto
  let open = 0;
  const view: View = { spread: 0, sel: null, pen: 0, floor: null, stamp: -1, trayAt: 9999, live: null, editing: null, hover: null, caret: true };
  let drawing: null | { erase: boolean } = null;
  let regL: Region[] = [];
  let regR: Region[] = [];
  let target = 0;
  let flip: { s: number; dir: 1 | -1; t: number; dur: number } | null = null;
  let caretT = 0;
  let lastWant = 0;
  let seenNews = false;
  const dState = () => diaryStore.get();

  const draw = (pg: ReturnType<typeof mkPage>, side: 'L' | 'R', spread: number) => {
    const v: View = { ...view, spread, hover: null };
    const regs = renderPage(pg.ctx, side, v, dState(), layout(dState()));
    pg.t.needsUpdate = true;
    return regs;
  };
  const refresh = () => {
    if (flip) return;
    const d = dState();
    const lay = layout(d);
    view.spread = Math.min(view.spread, lay.total - 1);
    const vv = { ...view };
    regL = renderPage(pgL.ctx, 'L', vv, d, lay);
    regR = renderPage(pgR.ctx, 'R', vv, d, lay);
    pgL.t.needsUpdate = true;
    pgR.t.needsUpdate = true;
  };
  const unsub = diaryStore.subscribe(() => {
    if (T > 0.01) refresh();
  });
  refresh();

  // ── edição de texto (teclado do aparelho) ──
  const ta = document.createElement('textarea');
  ta.setAttribute('autocomplete', 'off');
  ta.setAttribute('autocapitalize', 'sentences');
  ta.setAttribute('spellcheck', 'false');
  ta.setAttribute('aria-label', 'Anotação do diário');
  ta.style.cssText = 'position:fixed;left:0;bottom:0;width:2px;height:2px;opacity:0;border:0;padding:0;resize:none;z-index:-1;';
  document.body.appendChild(ta);
  const stopEdit = () => {
    if (!view.editing) return;
    view.editing = null;
    if (document.activeElement === ta) ta.blur();
    refresh();
  };
  const startEdit = (kind: 'note' | 'free') => {
    const d = dState();
    const cur = view.sel && d.seen[view.sel] ? view.sel : (d.order[0] ?? null);
    if (kind === 'note' && !cur) return;
    view.sel = cur;
    view.editing = kind;
    ta.maxLength = kind === 'note' ? NOTE_MAX : FREE_MAX;
    ta.value = kind === 'note' ? (d.notes[cur!] ?? '') : d.free;
    ta.focus({ preventScroll: true });
    ta.setSelectionRange(ta.value.length, ta.value.length);
    caretT = 0;
    view.caret = true;
    refresh();
  };
  ta.addEventListener('input', () => {
    if (view.editing === 'note' && view.sel) diary.setNote(view.sel, ta.value.replace(/\n/g, ' '));
    else if (view.editing === 'free') diary.setFree(ta.value);
  });
  ta.addEventListener('blur', () => {
    if (view.editing) {
      view.editing = null;
      refresh();
    }
  });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || (e.key === 'Enter' && view.editing === 'note')) {
      e.preventDefault();
      e.stopPropagation();
      stopEdit();
    }
    e.stopPropagation(); // J, W, A, S, D... são letras do texto, não comandos do jogo
  });

  // ── virar páginas ──
  const startFlip = (s: number, dir: 1 | -1, quick: boolean) => {
    // a folha fica entre os spreads s e s+1
    const d = dState();
    const lay = layout(d);
    draw(pgL, 'L', s);
    draw(pgR, 'R', s + 1);
    draw(lfF, 'R', s);
    draw(lfB, 'L', s + 1);
    void lay;
    flip = { s, dir, t: 0, dur: quick ? 0.26 : 0.46 };
    leaf.visible = true;
    env.sound('uiflip');
  };
  const goTo = (n: number) => {
    stopEdit();
    const lay = layout(dState());
    target = Math.max(0, Math.min(lay.total - 1, n));
  };

  // ── ponteiro ──
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const toNdc = (e: { clientX: number; clientY: number }) => {
    const r = env.dom.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
  };
  const pick = (e: { clientX: number; clientY: number }): { side: 'L' | 'R'; region: Region | null; px: number; py: number } | null => {
    if (flip) return null;
    toNdc(e);
    ray.setFromCamera(ndc, env.cam);
    const hit = ray.intersectObjects([meshL, meshR], false)[0];
    if (!hit || !hit.uv) return null;
    const side = hit.object === meshL ? 'L' : 'R';
    const px = hit.uv.x * PW;
    const py = (1 - hit.uv.y) * PH;
    const list = side === 'L' ? regL : regR;
    let found: Region | null = null;
    for (const r of list) if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) found = r;
    return { side, region: found, px, py };
  };
  const overBook = (e: { clientX: number; clientY: number }) => {
    toNdc(e);
    ray.setFromCamera(ndc, env.cam);
    return ray.intersectObject(root, true).length > 0;
  };
  const act = (id: string) => {
    const d = dState();
    const lay = layout(d);
    if (id === 'prev') goTo(view.spread - 1);
    else if (id === 'next') goTo(view.spread + 1);
    else if (id === 'close') close();
    else if (id.startsWith('goto:')) goTo(Number(id.slice(5)));
    else if (id.startsWith('sel:')) {
      stopEdit();
      view.sel = id.slice(4);
      refresh();
    } else if (id === 'edit:note') startEdit('note');
    else if (id === 'edit:free') startEdit('free');
    else if (id.startsWith('floor:')) {
      view.floor = Number(id.slice(6));
      refresh();
    } else if (id.startsWith('pen:')) {
      view.pen = Number(id.slice(4));
      refresh();
    } else if (id.startsWith('stamp:')) {
      view.stamp = Number(id.slice(6));
      refresh();
    } else if (id.startsWith('stampnav:')) {
      // a bandeja anda de TRAY_N em TRAY_N símbolos
      const n = dState().order.length;
      const cur = trayStart(view, dState());
      view.trayAt = Math.max(0, Math.min(n - TRAY_N, cur + Number(id.slice(9)) * TRAY_N));
      refresh();
    } else if (id === 'map') {
      // (a escrita livre e os carimbos são tratados no ponteiro: ver beginDraw)
    }
    void lay;
  };
  const close = () => {
    stopEdit();
    ui.setDiary(false);
  };
  const ready = () => T >= 0.99 && ui.diaryOpen();
  const inHud = (e: Event) => !!(e.target as HTMLElement | null)?.closest?.('.corner');

  // ── escrita livre no mapa ──
  const mapXY = (p: { side: 'L' | 'R'; px: number; py: number }) => ({ x: p.px + (p.side === 'R' ? PW : 0), y: p.py });
  const inMap = (x: number, y: number) => x >= MAP_AREA.x && x <= MAP_AREA.x + MAP_AREA.w && y >= MAP_AREA.y && y <= MAP_AREA.y + MAP_AREA.h;
  const eraseAt = (x: number, y: number) => {
    const fl = currentFloor(view, dState());
    const hit: number[] = [];
    dState().strokes.forEach((st, i) => {
      if (st.f !== fl) return;
      for (let k = 0; k < st.p.length; k += 2) {
        if ((st.p[k] / 2 - x) ** 2 + (st.p[k + 1] / 2 - y) ** 2 < 25) {
          hit.push(i);
          break;
        }
      }
    });
    diary.removeStrokes(hit);
    // a borracha também tira carimbos (o ponto tocado cai dentro da caixa do símbolo, com folga)
    const gone: number[] = [];
    dState().stamps.forEach((st, i) => {
      if (st.f !== fl) return;
      const b = stampBox(st.id);
      if (Math.abs(st.x - x) <= b.w / 2 + 2 && Math.abs(st.y - y) <= b.h / 2 + 2) gone.push(i);
    });
    diary.removeStamps(gone);
  };
  const beginDraw = (side: 'L' | 'R', px: number, py: number) => {
    stopEdit();
    const { x, y } = mapXY({ side, px, py });
    if (view.pen === ERASER_PEN) {
      drawing = { erase: true };
      eraseAt(x, y);
      return;
    }
    if (view.pen === STAMP_PEN) {
      // carimbo: um toque = um símbolo (nada de arrastar); só os avistados chegam aqui
      const d = dState();
      const i = stampChoice(view, d);
      if (i >= 0 && d.order[i]) {
        diary.addStamp({ f: currentFloor(view, d), id: d.order[i], x: Math.round(x), y: Math.round(y) });
        env.sound('uiblip');
      }
      return;
    }
    drawing = { erase: false };
    view.live ={ f: currentFloor(view, dState()), c: view.pen, p: [Math.round(x * 2), Math.round(y * 2)] };
    refresh();
  };
  const endDraw = () => {
    if (!drawing) return;
    if (!drawing.erase && view.live) diary.addStroke(view.live);
    drawing = null;
    view.live = null;
    refresh();
  };
  const onMove = (e: PointerEvent) => {
    if (drawing) {
      const p = pick(e);
      if (!p) return;
      const { x, y } = mapXY(p);
      if (!inMap(x, y)) return;
      if (drawing.erase) eraseAt(x, y);
      else if (view.live) {
        const n = view.live.p.length;
        const nx = Math.round(x * 2);
        const ny = Math.round(y * 2);
        if (nx !== view.live.p[n - 2] || ny !== view.live.p[n - 1]) {
          view.live = { ...view.live, p: [...view.live.p, nx, ny] };
          refresh();
        }
      }
      return;
    }
    if (!ready() || inHud(e)) return;
    const p = pick(e);
    const id = p?.region?.id ?? null;
    if (id !== view.hover) {
      view.hover = id;
      refresh();
    }
    env.dom.style.cursor = id ? 'pointer' : '';
  };
  const onDown = (e: PointerEvent) => {
    if (!ui.diaryOpen() || inHud(e)) return;
    e.stopPropagation();
    e.preventDefault();
    if (!ready()) return;
    const p = pick(e);
    if (p?.region) {
      if (p.region.id === 'map') beginDraw(p.side, p.px, p.py);
      else act(p.region.id);
      return;
    }
    if (p) {
      stopEdit(); // tocou numa parte vazia do papel
      return;
    }
    if (!overBook(e)) close(); // tocou fora do livro: guarda
  };
  const onKey = (e: KeyboardEvent) => {
    if (!ui.diaryOpen() || e.repeat) return;
    if (document.activeElement === ta) return;
    const k = e.key.toLowerCase();
    if (k === 'j' || k === 'escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (ready()) {
      if (k === 'arrowright' || k === 'pagedown' || k === 'd') goTo(view.spread + 1);
      else if (k === 'arrowleft' || k === 'pageup' || k === 'a') goTo(view.spread - 1);
      else if (k === 'home') goTo(0);
      else return;
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const onWheel = (e: WheelEvent) => {
    if (!ready()) return;
    e.preventDefault();
    e.stopPropagation();
    if (!flip && Math.abs(e.deltaY) > 4) goTo(view.spread + (e.deltaY > 0 ? 1 : -1));
  };
  window.addEventListener('pointermove', onMove, true);
  window.addEventListener('pointerup', endDraw, true);
  window.addEventListener('pointercancel', endDraw, true);
  window.addEventListener('pointerdown', onDown, true);
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('wheel', onWheel, { capture: true, passive: false });

  // ── a cada quadro ──
  return {
    isOut: () => T > 0.01,
    click: (id: string) => act(id), // (também usado nos testes)
    update(dt: number, t: number) {
      const want = ui.diaryOpen() ? 1 : 0;
      if (want !== lastWant) {
        lastWant = want;
        env.sound(want ? 'uiopen' : 'uiclose');
      }
      if (!want && view.editing) stopEdit();
      const dir = want - T;
      if (Math.abs(dir) > 1e-4) {
        const was = T;
        T = Math.min(1, Math.max(0, T + Math.sign(dir) * dt * (want ? 1 / 0.95 : 1 / 0.7)));
        if (want && was < 0.001) refresh();
        if (!want && T < 0.0005) T = 0;
      }
      ui.setBookOut(T > 0.002);
      if (want && T >= 0.99 && !seenNews) {
        seenNews = true;
        diary.clearUnread(); // abriu o livro: as novidades foram lidas
      }
      if (!want) seenNews = false;
      root.visible = T > 0.002;
      if (!root.visible) {
        if (view.hover) view.hover = null;
        return 0;
      }
      const rise = ease(clamp01(T / 0.45));
      const frame = ease(clamp01((T - 0.25) / 0.5));
      open = ease(clamp01((T - 0.45) / 0.55));
      leftPivot.rotation.y = -Math.PI * (1 - open);
      // a lombada acompanha: aberto, é a meia-cana atrás do dobra; fechado, vira a lateral redonda que une as duas capas
      spine.rotation.y = (Math.PI / 2) * (1 - open);
      spine.position.z = -0.055 * open;
      spine.scale.x = spine.scale.z = 1 + 0.8 * (1 - open);
      inner.position.x = (-BW / 2) * (1 - open);
      const mx = (a: number, b: number, k: number) => a + (b - a) * k;
      const f = (key: 'x' | 'y' | 'rx' | 'ry' | 'rz' | 's') => mx(mx(POSE.start[key], POSE.mid[key], rise), POSE.end[key], frame);
      const sway = Math.sin(t * 1.7) * 0.012 * (1 - frame);
      const endS = Math.min(POSE.end.s, env.halfW() * 1.9);
      root.position.set(f('x'), f('y') + sway, -1);
      root.rotation.set(f('rx') + sway, f('ry'), f('rz'));
      root.scale.setScalar(mx(mx(POSE.start.s, POSE.mid.s, rise), endS, frame));
      ribbon.visible = open > 0.8;
      strap.visible = open > 0.3;

      // virada de página
      if (ready() && !flip && view.spread !== target) {
        const step = Math.sign(target - view.spread) as 1 | -1;
        const s = step > 0 ? view.spread : view.spread - 1;
        startFlip(s, step, Math.abs(target - view.spread) > 1);
      }
      if (flip) {
        flip.t += dt / flip.dur;
        const p = clamp01(flip.t);
        const e = ease(p);
        const theta = flip.dir > 0 ? Math.PI * e : Math.PI * (1 - e);
        bend(theta, 0.55 * Math.sin(Math.PI * p));
        const shade = 0.72 + 0.28 * Math.abs(Math.cos(theta));
        matLeafF.color.setScalar(shade);
        matLeafB.color.setScalar(shade);
        if (p >= 1) {
          view.spread = flip.dir > 0 ? flip.s + 1 : flip.s;
          flip = null;
          leaf.visible = false;
          refresh();
        }
      }
      // cursor piscando ao escrever
      if (view.editing) {
        caretT += dt;
        if (caretT > 0.45) {
          caretT = 0;
          view.caret = !view.caret;
          refresh();
        }
      }
      return ease(clamp01(T * 3)); // quanto o dado e o giz saem da frente
    },
    dispose() {
      unsub();
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', endDraw, true);
      window.removeEventListener('pointercancel', endDraw, true);
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('wheel', onWheel, true);
      ta.remove();
      env.scene.remove(root);
    },
  };
}
