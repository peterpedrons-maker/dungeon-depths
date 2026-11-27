# uso: python3 tools/tocha_glb.py <pasta do zip do Sketchfab> public/models/tocha.glb 128
# Gera a tocha de parede do jogo a partir do glTF "Medieval Wall Torch" (Kigha, Sketchfab, CC BY 4.0): junta a hierarquia de nós numa
# matriz só, escurece a cor pela oclusão do próprio modelo (o canal R do mapa ORM), reduz as texturas à densidade de pixel do jogo e
# grava um .glb com filtro "nearest". O modelo não tem chama: o jogo põe a dele dentro da gaiola de ferro.
import json, sys, struct, io
import numpy as np
from PIL import Image, ImageEnhance, ImageChops
src, out, res = sys.argv[1], sys.argv[2], int(sys.argv[3])
g = json.load(open(src + '/scene.gltf'))
binbuf = bytearray(open(src + '/scene.bin', 'rb').read())

def mat_of(n):
    return np.array(n['matrix']).reshape(4, 4).T if 'matrix' in n else np.eye(4)
nodes = g['nodes']
parent = {c: i for i, n in enumerate(nodes) for c in n.get('children', [])}
mi = [i for i, n in enumerate(nodes) if 'mesh' in n][0]
W = np.eye(4)
i = mi
while True:
    W = mat_of(nodes[i]) @ W
    if i not in parent:
        break
    i = parent[i]

d = src + '/textures/'
base = Image.open(d + 'Wall_Torch_baseColor.png').convert('RGB')
orm = Image.open(d + 'Wall_Torch_metallicRoughness.png').convert('RGB').resize(base.size, Image.BILINEAR)
ao = orm.split()[0]
base = ImageChops.multiply(base, Image.merge('RGB', (ao, ao, ao)))
base = ImageEnhance.Color(base).enhance(0.8)  # a madeira um pouco menos saturada (o jogo é de pedra fria)
nrm = Image.open(d + 'Wall_Torch_normal.png').convert('RGB')

images, textures = [], []
bvs = g['bufferViews']
def add_image(im):
    im = im.resize((res, res), Image.BOX)
    b = io.BytesIO()
    im.save(b, 'PNG', optimize=True)
    data = b.getvalue()
    while len(binbuf) % 4:
        binbuf.append(0)
    off = len(binbuf)
    binbuf.extend(data)
    bvs.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(data)})
    images.append({'bufferView': len(bvs) - 1, 'mimeType': 'image/png'})
    textures.append({'source': len(images) - 1, 'sampler': 0})
    return len(textures) - 1
c = add_image(base)
n = add_image(nrm)
mesh = g['meshes'][nodes[mi]['mesh']]
prim = mesh['primitives'][0]
prim['material'] = 0
prim['attributes'] = {k: v for k, v in prim['attributes'].items() if k in ('POSITION', 'NORMAL', 'TEXCOORD_0')}
out_g = {
    'asset': {'version': '2.0', 'generator': 'sentenca tools/tocha_glb.py (de Medieval Wall Torch, Kigha, CC BY 4.0)'},
    'scene': 0,
    'scenes': [{'nodes': [0]}],
    'nodes': [{'name': 'tocha', 'matrix': [float(v) for v in W.T.reshape(-1)], 'mesh': 0}],
    'meshes': [{'name': 'tocha', 'primitives': [prim]}],
    'materials': [{'name': 'tocha', 'pbrMetallicRoughness': {'baseColorTexture': {'index': c}, 'metallicFactor': 0, 'roughnessFactor': 1}, 'normalTexture': {'index': n}, 'doubleSided': True}],
    'accessors': g['accessors'],
    'bufferViews': bvs,
    'buffers': [{'byteLength': len(binbuf)}],
    'images': images,
    'textures': textures,
    'samplers': [{'magFilter': 9728, 'minFilter': 9984, 'wrapS': 10497, 'wrapT': 10497}],
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
