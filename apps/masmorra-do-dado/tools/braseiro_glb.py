# uso: python3 tools/braseiro_glb.py <pasta do zip do Sketchfab> public/models/braseiro.glb 128
# Gera o braseiro do jogo a partir do glTF do Sketchfab: tira a chama de foto, reduz as texturas à densidade de pixel do jogo e grava um .glb
import json, sys, struct, io
from PIL import Image, ImageEnhance
src, out, res = sys.argv[1], sys.argv[2], int(sys.argv[3])
g = json.load(open(src + '/scene.gltf'))
binbuf = bytearray(open(src + '/scene.bin', 'rb').read())

def png_bytes(path, kind):
    im = Image.open(path).convert('RGB')
    im = im.resize((res, res), Image.BOX)
    if kind == 'stone':
        im = ImageEnhance.Color(im).enhance(0.55)  # musgo mais discreto (o jogo é de pedra fria)
    if kind == 'iron':
        im = ImageEnhance.Color(im).enhance(0.8)
    b = io.BytesIO()
    im.save(b, 'PNG', optimize=True)
    return b.getvalue()

tex = {}
def add_image(path, kind):
    data = png_bytes(path, kind)
    while len(binbuf) % 4:
        binbuf.append(0)
    off = len(binbuf)
    binbuf.extend(data)
    bvs.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(data)})
    images.append({'bufferView': len(bvs) - 1, 'mimeType': 'image/png'})
    textures.append({'source': len(images) - 1, 'sampler': 0})
    return len(textures) - 1

bvs = g['bufferViews']
images, textures = [], []
d = src + '/textures/'
iron_c = add_image(d + 'fire_pillar_06lambert2.001_baseColor.png', 'iron')
iron_n = add_image(d + 'fire_pillar_06lambert2.001_normal.png', 'normal')
stone_c = add_image(d + 'stone_column_baseColor.png', 'stone')
stone_n = add_image(d + 'stone_column_normal.png', 'normal')
mats = [
    {'name': 'cesta', 'pbrMetallicRoughness': {'baseColorTexture': {'index': iron_c}, 'metallicFactor': 0, 'roughnessFactor': 1}, 'normalTexture': {'index': iron_n}, 'doubleSided': True},
    {'name': 'coluna', 'pbrMetallicRoughness': {'baseColorTexture': {'index': stone_c}, 'metallicFactor': 0, 'roughnessFactor': 1}, 'normalTexture': {'index': stone_n}},
]
mesh_cesta = g['meshes'][0]
mesh_col = g['meshes'][2]
mesh_cesta['primitives'][0]['material'] = 0
mesh_col['primitives'][0]['material'] = 1
mesh_cesta['name'] = 'cesta'
mesh_col['name'] = 'coluna'
out_g = {
    'asset': {'version': '2.0', 'generator': 'masmorra-do-dado tools/braseiro (de Stone Column Brazier, Amarveer, CC BY 4.0)'},
    'scene': 0,
    'scenes': [{'nodes': [0]}],
    'nodes': [{'name': 'braseiro', 'matrix': g['nodes'][0]['matrix'], 'children': [1, 2]}, {'mesh': 0, 'name': 'cesta'}, {'mesh': 1, 'name': 'coluna'}],
    'meshes': [mesh_cesta, mesh_col],
    'materials': mats,
    'accessors': g['accessors'],
    'bufferViews': bvs,
    'buffers': [{'byteLength': len(binbuf)}],
    'images': images,
    'textures': textures,
    'samplers': [{'magFilter': 9728, 'minFilter': 9984, 'wrapS': 10497, 'wrapT': 10497}],  # nearest (pixel)
}
js = json.dumps(out_g, separators=(',', ':')).encode()
while len(js) % 4:
    js += b' '
while len(binbuf) % 4:
    binbuf.append(0)
total = 12 + 8 + len(js) + 8 + len(binbuf)
with open(out, 'wb') as f:
    f.write(struct.pack('<III', 0x46546C67, 2, total))
    f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
    f.write(struct.pack('<II', len(binbuf), 0x004E4942)); f.write(binbuf)
print(out, total, 'bytes')
