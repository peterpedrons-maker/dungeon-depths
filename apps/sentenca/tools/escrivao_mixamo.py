# uso: blender -b --python tools/escrivao_mixamo.py -- <escrivao_poseA.glb> <saída.fbx> <textura.png> [prévia.png]
# Transforma o Escrivão exportado do jogo (tools/escrivao_mixamo.ts, pose A) num FBX para o MIXAMO: uma malha só, com UMA textura onde
# ficam "assadas" todas as cores (as texturas de pano, o debrum, a estola com o glifo e o tom facetado de cada face, que vinha nas cores
# dos vértices). O Mixamo põe o esqueleto e as animações; o jogo depois troca o material de volta para o Lambert do pixel.
import bpy, sys, os
a = sys.argv[sys.argv.index('--') + 1:]
src, out, texp = a[0], a[1], a[2]
prev = a[3] if len(a) > 3 else None
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
sc = bpy.context.scene
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
body = meshes[0]
body.name = 'Escrivao'
bpy.ops.object.select_all(action='DESELECT')
body.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
me = body.data
for m in me.materials:
    b = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if b:
        b.inputs['Metallic'].default_value = 0.0
        b.inputs['Roughness'].default_value = 1.0
    t = next((n for n in m.node_tree.nodes if n.type == 'TEX_IMAGE'), None)
    if t:
        t.image.filepath_raw = texp
        t.image.file_format = 'PNG'
        t.image.save()
sc = bpy.context.scene
import mathutils
pts = [body.matrix_world @ v.co for v in me.vertices]
print('ALTURA', round(max(p.z for p in pts) - min(p.z for p in pts), 3), 'LARGURA', round(max(p.x for p in pts) - min(p.x for p in pts), 3), 'TRIS', sum(len(p.vertices) - 2 for p in me.polygons))
bpy.ops.export_scene.fbx(filepath=out, use_selection=False, path_mode='COPY', embed_textures=True, object_types={'MESH'}, apply_scale_options='FBX_SCALE_ALL', mesh_smooth_type='FACE')
print('FBX', out)
if prev:
    # prévia: de frente, luz uniforme
    world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[1].default_value = 1.2
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
    sc.cycles.samples = 16; sc.cycles.use_denoising = False
    sc.render.resolution_x = 900; sc.render.resolution_y = 900
    cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = 2.3
    cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
    for k, (loc, rot) in enumerate([((0, -6, 0.95), (1.5708, 0, 0)), ((6, 0, 0.95), (1.5708, 0, 1.5708))]):
        cam.location = loc; cam.rotation_euler = rot
        sc.render.filepath = prev.replace('.png', '_%d.png' % k)
        bpy.ops.render.render(write_still=True)
