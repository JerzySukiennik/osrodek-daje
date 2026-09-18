# Headless asset build: blender -b -P build.py -- <out_glb> <render_dir>
# Builds every prop and character, exports one GLB (one named object per asset, origin at its base),
# then lays them out and renders review sheets + character portraits with Workbench.

import bpy
import bmesh
import sys
import os
import math
import importlib
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import kit
import props
import characters
for mod in (kit, props, characters):
    importlib.reload(mod)

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT_GLB = argv[0] if argv else os.path.join(HERE, "models.glb")
RENDER_DIR = argv[1] if len(argv) > 1 else os.path.join(HERE, "renders")
os.makedirs(RENDER_DIR, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

objects = {}
for builder in props.BUILDERS + characters.BUILDERS:
    model = builder()
    obj = model.build()
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(obj.data)
    bm.free()
    objects[model.name] = obj

tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objects.values())
print(f"BUILT {len(objects)} assets, {tris} triangles")

bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format="GLB", export_yup=True, export_apply=True, use_selection=False)
print("EXPORTED", OUT_GLB, os.path.getsize(OUT_GLB), "bytes")


def setup_render(width, height):
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.film_transparent = False
    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "MATERIAL"
    shading.show_shadows = True
    shading.shadow_intensity = 0.35
    shading.show_cavity = True
    shading.cavity_type = "WORLD"
    shading.background_type = "VIEWPORT"
    shading.background_color = (0.72, 0.85, 0.22)
    shading.studio_light = "paint.sl" if "paint.sl" in [s.name for s in bpy.context.preferences.studio_lights] else shading.studio_light
    scene.display.light_direction = (-0.5, 0.35, 0.8)
    scene.view_settings.view_transform = "Standard"
    try:
        scene.display.render_aa = "8"
    except Exception:
        pass


def aim_camera(cam, target, direction, distance):
    d = Vector(direction).normalized()
    cam.location = Vector(target) + d * distance
    cam.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()


cam_data = bpy.data.cameras.new("cam")
cam = bpy.data.objects.new("cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

floor_mesh = bpy.data.meshes.new("floor")
floor_mesh.from_pydata([(-80, -80, 0), (80, -80, 0), (80, 80, 0), (-80, 80, 0)], [], [(0, 1, 2, 3)])
floor_mat = bpy.data.materials.new("floor")
floor_mat.diffuse_color = (*kit.hex_rgb("#c6e344"), 1)
floor_mesh.materials.append(floor_mat)
floor = bpy.data.objects.new("floor", floor_mesh)
scene.collection.objects.link(floor)


def hide_all():
    for o in objects.values():
        o.hide_render = True
        o.location = (0, 0, 0)


def sheet(names, path, spacing, per_row, cam_dir, fov_deg, size):
    hide_all()
    rows = math.ceil(len(names) / per_row)
    for i, name in enumerate(names):
        o = objects[name]
        o.hide_render = False
        col, row = i % per_row, i // per_row
        o.location = ((col - (per_row - 1) / 2) * spacing[0], ((rows - 1) / 2 - row) * spacing[1], 0)
    setup_render(*size)
    cam_data.type = "PERSP"
    cam_data.angle = math.radians(fov_deg)
    width = per_row * spacing[0]
    depth = rows * spacing[1]
    dist = max(width / (2 * math.tan(cam_data.angle / 2)), depth * 1.2) * 1.12
    aim_camera(cam, (0, 0, 0.6), cam_dir, dist)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("RENDERED", path)


CHARS = ["ks", "jurek", "rys", "dropsik"]
SMALL = ["tuft", "flower", "pebble", "mushroom", "apple", "duck", "bucket", "ball", "firework", "char", "log", "crate", "campfire"]
MEDIUM = ["bench", "deckchair", "barrel", "grill", "bush", "parasol", "fence", "table", "kayak"]
LARGE = ["sign", "pine", "rocket", "car", "cabin"]

sheet(CHARS, os.path.join(RENDER_DIR, "characters-front.png"), (1.1, 1.5), 4, (0.0, -1.0, 0.28), 24, (1600, 1000))
sheet(CHARS, os.path.join(RENDER_DIR, "characters-side.png"), (1.1, 1.5), 4, (0.75, -0.7, 0.4), 24, (1600, 1000))
sheet(CHARS, os.path.join(RENDER_DIR, "characters-back.png"), (1.1, 1.5), 4, (0.35, 1.0, 0.45), 24, (1600, 1000))
sheet(SMALL, os.path.join(RENDER_DIR, "props-small.png"), (1.0, 1.1), 7, (0.0, -0.75, 0.62), 26, (1600, 900))
sheet(MEDIUM, os.path.join(RENDER_DIR, "props-medium.png"), (3.3, 3.4), 5, (0.0, -0.75, 0.62), 26, (1600, 900))
sheet(LARGE, os.path.join(RENDER_DIR, "props-large.png"), (5.2, 6.0), 5, (0.2, -0.78, 0.55), 26, (1600, 900))

hide_all()
floor.hide_render = True
scene.render.film_transparent = True
for name, head_y, zoom in [("ks", 1.84, 0.62), ("jurek", 1.64, 0.62), ("rys", 1.3, 0.6), ("dropsik", 0.5, 0.7)]:
    hide_all()
    objects[name].hide_render = False
    setup_render(512, 512)
    scene.display.shading.show_shadows = False
    scene.render.film_transparent = True
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = zoom
    aim_camera(cam, (0, 0, head_y), (0.22, -1.0, 0.1), 4)
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.filepath = os.path.join(RENDER_DIR, f"portrait-{name}.png")
    bpy.ops.render.render(write_still=True)
    print("RENDERED portrait", name)
