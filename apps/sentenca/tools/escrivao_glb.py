"""O Escrivão ANIMADO (DESIGN.md §70): junta as animações do Mixamo num .glb para o jogo (public/models/escrivao.glb).

O caminho todo:
  1. tools/escrivao_mixamo.ts exporta o Escrivão de código em pose A, numa malha só com a textura assada (Escrivao_cor.png),
     e tools/escrivao_mixamo.py faz o FBX que vai para o Mixamo.
  2. No Mixamo: auto-rig e as animações. Baixar cada uma em FBX, "With Skin", 30 fps.
  3. Textura (fora do Blender):
        python3 tools/escrivao_glb.py textura Escrivao_cor.png cor_1024.png
     pinta com o roxo do capuz as casas que saíram cinza (a tampa de trás do capuz, que no Escrivão de código não tem mapeamento) e
     reduz para 1024 px sem suavizar. (A imagem dentro do arquivo está de cabeça para baixo em relação à grade das casas do atlas.)
  4. No Blender (4.x):
        blender -b --python tools/escrivao_glb.py -- andar.fbx olhar.fbx cor_1024.png escrivao_raw.glb
     lê os dois FBX, dá às ações os nomes que o jogo usa ("andar" e "olhar"), troca a textura e exporta um .glb com as duas.
  5. Compactar:
        npx @gltf-transform/cli prune escrivao_raw.glb e1.glb && npx @gltf-transform/cli quantize e1.glb public/models/escrivao.glb
O jogo recorta o ciclo de passos de dentro do "andar" e usa o trecho debruçado do "olhar" (src/scene/scribeRig.ts).
"""
import sys

try:
    import bpy  # type: ignore
except ImportError:
    bpy = None

ATLAS, COLS, CELL, TRIS = 2048, 44, 46, 1934  # a grade do atlas de tools/escrivao_mixamo.ts
HOOD = (70, 41, 97, 255)


def fix_texture(src, out):
    from PIL import Image

    im = Image.open(src).convert('RGBA')
    grey = []
    for k in range(TRIS):
        cx, cy = (k % COLS) * CELL, (k // COLS) * CELL
        r, g, b, _ = im.getpixel((cx + 16, ATLAS - 1 - (cy + 16)))
        if min(r, g, b) > 90 and max(r, g, b) - min(r, g, b) < 25:
            grey.append(k)
    for k in grey:
        cx, cy = (k % COLS) * CELL, (k // COLS) * CELL
        for y in range(ATLAS - (cy + CELL), ATLAS - cy):
            for x in range(cx, cx + CELL):
                im.putpixel((x, y), HOOD)
    im.convert('RGB').resize((1024, 1024), Image.NEAREST).save(out, optimize=True)
    print('casas cinza repintadas:', grey)


def build_glb(walk, look, tex, out):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = 60
    bpy.ops.import_scene.fbx(filepath=walk)
    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    a_walk = arm.animation_data.action
    a_walk.name = 'andar'
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=look)
    new = [o for o in bpy.data.objects if o not in before]
    a_look = [o for o in new if o.type == 'ARMATURE'][0].animation_data.action
    a_look.name = 'olhar'
    for o in new:
        bpy.data.objects.remove(o, do_unlink=True)
    # uma faixa de NLA por ação: o exportador grava cada uma como uma animação
    arm.animation_data.action = None
    for a in (a_walk, a_look):
        a.use_fake_user = True
        tr = arm.animation_data.nla_tracks.new()
        tr.name = a.name
        tr.strips.new(a.name, int(a.frame_range[0]), a).name = a.name
    img = bpy.data.images.load(tex)
    img.pack()
    for m in bpy.data.materials:
        if not m.use_nodes:
            continue
        for n in m.node_tree.nodes:
            if n.type == 'TEX_IMAGE':
                n.image = img
            if n.type == 'BSDF_PRINCIPLED':  # fosco e sem metal (o jogo usa Lambert)
                n.inputs['Metallic'].default_value = 0.0
                n.inputs['Roughness'].default_value = 1.0
    bpy.ops.export_scene.gltf(
        filepath=out, export_format='GLB', export_animations=True, export_animation_mode='NLA_TRACKS', export_frame_step=2,
        export_force_sampling=True, export_skins=True, export_morph=False, export_yup=True, export_apply=False,
    )
    print('OK', out)


if __name__ == '__main__':
    if bpy is not None:
        build_glb(*sys.argv[sys.argv.index('--') + 1:][:4])
    elif len(sys.argv) == 4 and sys.argv[1] == 'textura':
        fix_texture(sys.argv[2], sys.argv[3])
    else:
        print(__doc__)
