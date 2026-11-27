// Monta public/models/props_bib.glb: os objetos da BIBLIOTECA escolhidos na vitrine (?vitrine=bib; DESIGN.md §71).
// Entradas (fora do repositório, em public/models/_vitrine/): bib.glb (estantes de Paul Wortmann/System G6/yd, velas da AnyRPG, candelabro de
// Marco Antonio Meireles Carvalho; montado no Blender a partir dos downloads) e props_q.glb (o pack inteiro da Quaternius).
// Uso (com @gltf-transform/core, /extensions, /functions e sharp instalados):
//   node tools/biblioteca_glb.mjs public/models/_vitrine/bib.glb public/models/_vitrine/props_q.glb public/models/props_bib.glb
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, mergeDocuments, prune, quantize, textureCompress, unpartition } from '@gltf-transform/functions';
import sharp from 'sharp';

const [bibPath, qPath, out] = process.argv.slice(2);
const KEEP_BIB = ['Estante_Livros_1', 'Estante_Livros_2', 'Estante_Livros_3', 'Estante_Livros_4', 'Vela_Pires', 'Vela_Curta', 'Vela_Alta', 'Candelabro'];
const KEEP_Q = ['Q_BookStand', 'Q_BookGroup_Medium_1', 'Q_BookGroup_Medium_3', 'Q_Book_Stack_1', 'Q_Book_7', 'Q_Scroll_2'];

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const keepOnly = (doc, names) => {
  const scene = doc.getRoot().listScenes()[0];
  for (const n of scene.listChildren()) if (!names.includes(n.getName())) n.dispose();
};
const doc = await io.read(bibPath);
keepOnly(doc, KEEP_BIB);
const q = await io.read(qPath);
keepOnly(q, KEEP_Q);
mergeDocuments(doc, q);
// uma cena só, com os 14 objetos como filhos diretos (o jogo procura cada um pelo nome)
const [main, ...rest] = doc.getRoot().listScenes();
for (const s of rest) {
  for (const n of s.listChildren()) main.addChild(n);
  s.dispose();
}
doc.getRoot().setDefaultScene(main);
// (no pixel, o relevo dos livros quase não aparece: sem os mapas de relevo e de oclusão o arquivo cai pela metade)
for (const m of doc.getRoot().listMaterials()) {
  m.setNormalTexture(null);
  m.setOcclusionTexture(null);
  m.setMetallicRoughnessTexture(null);
}
await doc.transform(prune(), dedup(), quantize(), textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 92, resize: [256, 256] }), unpartition());
await io.write(out, doc);
console.log(
  'objetos:',
  main.listChildren().map((n) => n.getName()),
);
