// FERRAMENTA (fora do jogo): exporta o Escrivão de `src/scene/scribe.ts` em POSE A, sem os olhos acesos (o jogo os põe de volta, presos ao
// osso da cabeça), num .glb que o `tools/escrivao_mixamo.py` (Blender) transforma no FBX para o Mixamo. Uso (com o servidor de
// desenvolvimento rodando): no console da página, `await (await import('/tools/escrivao_mixamo.ts')).exportScribe()` devolve o .glb em base64.
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { makeScribe } from '../src/scene/scribe';

// "ASSA" tudo numa malha só com uma textura: cada triângulo ganha uma casa própria numa folha de 2048 px, onde se desenha o pedaço da
// textura de pano dele (transformação afim) multiplicado pela cor do material e pela cor dos vértices (o tom facetado de cada face).
// (O Blender deste ambiente não consegue assar texturas; e assim o resultado é igual ao que o jogo desenha.)
function bakeToAtlas(root: THREE.Object3D) {
  const ATLAS = 2048;
  const cv = document.createElement('canvas');
  cv.width = cv.height = ATLAS;
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, ATLAS, ATLAS);
  type Tri = { p: THREE.Vector3[]; n: THREE.Vector3[]; uv: THREE.Vector2[] | null; col: THREE.Color; img: CanvasImageSource | null; iw: number; ih: number };
  const tris: Tri[] = [];
  const nm = new THREE.Matrix3();
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.visible) return;
    let geo = m.geometry as THREE.BufferGeometry;
    if (geo.index) geo = geo.toNonIndexed();
    const mat = m.material as THREE.MeshLambertMaterial;
    const P = geo.attributes.position as THREE.BufferAttribute;
    const Nn = geo.attributes.normal as THREE.BufferAttribute | undefined;
    const U = geo.attributes.uv as THREE.BufferAttribute | undefined;
    const C = geo.attributes.color as THREE.BufferAttribute | undefined;
    nm.getNormalMatrix(m.matrixWorld);
    const map = (mat.map ?? null) as THREE.Texture | null;
    const img = map ? (map.image as CanvasImageSource & { width: number; height: number }) : null;
    for (let i = 0; i < P.count; i += 3) {
      const p = [0, 1, 2].map((k) => new THREE.Vector3().fromBufferAttribute(P, i + k).applyMatrix4(m.matrixWorld));
      const n = [0, 1, 2].map((k) => (Nn ? new THREE.Vector3().fromBufferAttribute(Nn, i + k).applyMatrix3(nm).normalize() : new THREE.Vector3(0, 1, 0)));
      const uv = U && img ? [0, 1, 2].map((k) => new THREE.Vector2().fromBufferAttribute(U, i + k)) : null;
      const col = mat.color ? mat.color.clone() : new THREE.Color(1, 1, 1);
      if (C && mat.vertexColors) {
        const c = new THREE.Color(0, 0, 0);
        for (let k = 0; k < 3; k++) c.add(new THREE.Color().fromBufferAttribute(C, i + k));
        col.multiply(c.multiplyScalar(1 / 3));
      }
      tris.push({ p, n, uv, col, img, iw: img ? (img as { width: number }).width : 1, ih: img ? (img as { height: number }).height : 1 });
    }
  });
  const cols = Math.ceil(Math.sqrt(tris.length));
  const cell = Math.floor(ATLAS / cols);
  const pad = 2;
  const pos: number[] = [];
  const nor: number[] = [];
  const uvs: number[] = [];
  tris.forEach((t, k) => {
    const cx = (k % cols) * cell;
    const cy = Math.floor(k / cols) * cell;
    const D = [new THREE.Vector2(cx + pad, cy + pad), new THREE.Vector2(cx + cell - pad, cy + pad), new THREE.Vector2(cx + pad, cy + cell - pad)];
    ctx.save();
    ctx.beginPath();
    // (a casa inteira: o pedaço desenhado passa um pouco da borda do triângulo, para não ficar fresta na hora de ler a textura)
    ctx.rect(cx, cy, cell, cell);
    ctx.clip();
    if (t.uv && t.img) {
      // afim: pixel da textura de origem → pixel da casa
      const S = t.uv.map((u) => new THREE.Vector2(u.x * t.iw, (1 - u.y) * t.ih));
      const [s0, s1, s2] = S;
      const [d0, d1, d2] = D;
      const den = (s1.x - s0.x) * (s2.y - s0.y) - (s2.x - s0.x) * (s1.y - s0.y);
      if (Math.abs(den) > 1e-9) {
        const a = ((d1.x - d0.x) * (s2.y - s0.y) - (d2.x - d0.x) * (s1.y - s0.y)) / den;
        const b = ((d1.y - d0.y) * (s2.y - s0.y) - (d2.y - d0.y) * (s1.y - s0.y)) / den;
        const c = ((d2.x - d0.x) * (s1.x - s0.x) - (d1.x - d0.x) * (s2.x - s0.x)) / den;
        const d = ((d2.y - d0.y) * (s1.x - s0.x) - (d1.y - d0.y) * (s2.x - s0.x)) / den;
        const e = d0.x - a * s0.x - c * s0.y;
        const f = d0.y - b * s0.x - d * s0.y;
        ctx.setTransform(a, b, c, d, e, f);
        ctx.drawImage(t.img, 0, 0);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else {
        // triângulo sem mapeamento (todos os cantos no mesmo ponto da textura, como a tampa de trás do capuz): a cor daquele ponto da
        // textura na casa inteira (antes era branco, e a tampa saía cinza; DESIGN.md §69)
        const sx = Math.min(t.iw - 1, Math.max(0, Math.floor(s0.x)));
        const sy = Math.min(t.ih - 1, Math.max(0, Math.floor(s0.y)));
        ctx.drawImage(t.img, sx, sy, 1, 1, cx, cy, cell, cell);
      }
      ctx.globalCompositeOperation = 'multiply';
    }
    const col = t.col.clone().convertLinearToSRGB();
    ctx.fillStyle = `rgb(${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)})`;
    ctx.fillRect(cx, cy, cell, cell);
    ctx.restore();
    for (let i = 0; i < 3; i++) {
      pos.push(t.p[i].x, t.p[i].y, t.p[i].z);
      nor.push(t.n[i].x, t.n[i].y, t.n[i].z);
      uvs.push(D[i].x / ATLAS, 1 - D[i].y / ATLAS);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = true;
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, metalness: 0, roughness: 1, side: THREE.DoubleSide }));
  mesh.name = 'Escrivao';
  return mesh;
}

export async function exportScribe(): Promise<string> {
  const s = makeScribe();
  // uma pose neutra (de pé, olhando para a frente), e depois os braços abertos em A
  s.animate(1, 0, { walk: 0, lean: 0, headPitch: 0, headYaw: 0, reach: 0, back: 0, open: 0, rest: 0, raise: 0 });
  for (let i = 0; i < 60; i++) s.animate(0.1, 0, { walk: 0, lean: 0, headPitch: 0, headYaw: 0, reach: 0, back: 0, open: 0, rest: 0, raise: 0 });
  const g = s.group;
  g.updateMatrixWorld(true);
  // os ombros: os grupos filhos do tronco em x = ±0,29, y = 0,315
  const shoulders: THREE.Object3D[] = [];
  g.traverse((o) => {
    if (o.type === 'Group' && Math.abs(Math.abs(o.position.x) - 0.29) < 1e-3 && Math.abs(o.position.y - 0.315) < 1e-3) shoulders.push(o);
  });
  for (const sh of shoulders) {
    const side = Math.sign(sh.position.x);
    sh.rotation.set(0, 0, side * 0.85); // braço aberto ~49° (pose A)
    const elbow = sh.children.find((c) => c.type === 'Group');
    if (elbow) {
      elbow.rotation.set(0, 0, 0);
      const wrist = elbow.children.find((c) => c.type === 'Group');
      if (wrist) {
        wrist.rotation.set(0, 0, 0);
        // dedos abertos e retos
        wrist.traverse((f) => {
          if (f !== wrist && f.type === 'Group') {
            f.rotation.x = 0;
          }
        });
      }
    }
  }
  // fora: os olhos, o halo deles e a mão-âncora do dado (o jogo recoloca os olhos)
  const drop: THREE.Object3D[] = [];
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mat = m.material as THREE.MeshBasicMaterial;
    if (mat.isMeshBasicMaterial && (mat.blending === THREE.AdditiveBlending || mat.color.getHex() === 0xfff2cc)) drop.push(m);
  });
  drop.forEach((o) => o.removeFromParent());
  g.updateMatrixWorld(true);
  const one = bakeToAtlas(g);
  const out = await new GLTFExporter().parseAsync(one, { binary: true, onlyVisible: true });
  const bytes = new Uint8Array(out as ArrayBuffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
