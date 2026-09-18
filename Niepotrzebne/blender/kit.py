# Low-poly modelling kit for Blender: primitives are authored in GAME space (x right, y up, z toward camera) and
# converted to Blender space on write, so dimensions match js/shared/props.js one to one.

import bpy
import bmesh
import math
import random
from mathutils import Vector, Euler, Matrix

PAL = {
    "wood": "#c8742b", "woodDark": "#8f4a1c", "woodLight": "#f0a441",
    "leaf": "#3fae3a", "leafDark": "#1f7f3a", "leafLight": "#8fd628",
    "stone": "#a9adb8", "stoneDark": "#6f7485",
    "red": "#ef2f3c", "coral": "#ff5a3c", "pink": "#ff5fa2", "yellow": "#ffd21f", "cream": "#fff1c4",
    "blue": "#1e9bf0", "navy": "#2541b2", "white": "#ffffff", "black": "#26222b", "char": "#2b2526",
    "metal": "#8d99ae", "metalDark": "#56607a", "orange": "#ff8a1f", "green": "#17a35c", "gsp": "#22b455",
    "skin": "#f2b48a", "skinDark": "#d9956b", "hairBrown": "#a9773f", "hairDark": "#6b4423", "hairBlond": "#f4d35e",
    "fur": "#fbf8f0", "furShade": "#ddd6c8", "croc": "#7bd21c", "crocDark": "#4f9a12", "glass": "#5c7c9c",
    "hoodie": "#2c2833", "jogger": "#3a3542", "jeans": "#2f6fd6", "spider": "#e0202e", "caramel": "#d98a3a",
    "dogBlack": "#2a2428", "tongue": "#ff6f91", "cyan": "#35e0ff", "window": "#2a5fb0", "roof": "#ff5a3c",
    "wall": "#fff1c4", "tyre": "#26222b", "carBody": "#ff8a1f", "sand": "#ffdf8e",
}


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_rgb(h):
    h = PAL.get(h, h).lstrip("#")
    return tuple(srgb_to_linear(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4))


def to_blender(v):
    return Vector((v[0], -v[2], v[1]))


def rot_matrix(rot):
    return Euler((rot[0], rot[1], rot[2]), "ZYX").to_matrix()


class Model:
    def __init__(self, name):
        self.name = name
        self.verts = []
        self.faces = []
        self.colors = []
        self.rng = random.Random(hash(name) & 0xffff)

    def add(self, verts, faces, color, pos=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
        m = rot_matrix(rot)
        base = len(self.verts)
        for v in verts:
            p = m @ Vector((v[0] * scale[0], v[1] * scale[1], v[2] * scale[2]))
            self.verts.append((p.x + pos[0], p.y + pos[1], p.z + pos[2]))
        for f in faces:
            self.faces.append([base + i for i in f])
            self.colors.append(color)

    def box(self, w, h, d, pos, color, rot=(0, 0, 0), top=(1, 1), shift=(0, 0)):
        hw, hh, hd = w / 2, h / 2, d / 2
        tw, td = hw * top[0], hd * top[1]
        sx, sz = shift
        v = [(-hw, -hh, -hd), (hw, -hh, -hd), (hw, -hh, hd), (-hw, -hh, hd),
             (-tw + sx, hh, -td + sz), (tw + sx, hh, -td + sz), (tw + sx, hh, td + sz), (-tw + sx, hh, td + sz)]
        f = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
        self.add(v, f, color, pos, rot)

    def cyl(self, rb, rt, h, seg, pos, color, rot=(0, 0, 0), cap_color=None, twist=0.0):
        v = []
        for i in range(seg):
            a = i / seg * math.tau
            v.append((math.cos(a) * rb, -h / 2, math.sin(a) * rb))
        if rt > 1e-5:
            for i in range(seg):
                a = i / seg * math.tau + twist
                v.append((math.cos(a) * rt, h / 2, math.sin(a) * rt))
        else:
            v.append((0, h / 2, 0))
        side = []
        for i in range(seg):
            j = (i + 1) % seg
            if rt > 1e-5:
                side.append((i, seg + i, seg + j, j))
            else:
                side.append((i, seg, j))
        self.add(v, side, color, pos, rot)
        caps = [tuple(range(seg))]
        if rt > 1e-5:
            caps.append(tuple(reversed(range(seg, 2 * seg))))
        self.add(v, caps, cap_color or color, pos, rot)

    def cone(self, r, h, seg, pos, color, rot=(0, 0, 0)):
        self.cyl(r, 0, h, seg, pos, color, rot)

    def ico(self, r, pos, color, scale=(1, 1, 1), sub=1, jitter=0.0, rot=(0, 0, 0)):
        bm = bmesh.new()
        bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
        verts = []
        for bv in bm.verts:
            k = 1 + (self.rng.random() - 0.5) * 2 * jitter
            verts.append((bv.co.x * k, bv.co.z * k, -bv.co.y * k))
        faces = [[lv.index for lv in f.verts] for f in bm.faces]
        bm.free()
        self.add(verts, faces, color, pos, rot, scale)

    def prism(self, pts, depth, pos, color, rot=(0, 0, 0)):
        n = len(pts)
        v = [(p[0], p[1], -depth / 2) for p in pts] + [(p[0], p[1], depth / 2) for p in pts]
        f = [tuple(reversed(range(n))), tuple(range(n, 2 * n))]
        for i in range(n):
            j = (i + 1) % n
            f.append((i, j, n + j, n + i))
        self.add(v, f, color, pos, rot)

    def spikes(self, count, ring_r, y, size, length, color, center=(0, 0), tilt=1.1, phase=0.0, jitter=0.25):
        for i in range(count):
            a = i / count * math.tau + phase
            k = 1 + (self.rng.random() - 0.5) * jitter
            x = center[0] + math.cos(a) * ring_r
            z = center[1] + math.sin(a) * ring_r
            self.cone(size * k, length * k, 4, (x, y, z), color, rot=(math.sin(a) * tilt, 0, -math.cos(a) * tilt))

    def build(self, collection=None):
        mesh = bpy.data.meshes.new(self.name)
        mesh.from_pydata([to_blender(v) for v in self.verts], [], self.faces)
        mats = {}
        for c in self.colors:
            if c not in mats:
                mat = bpy.data.materials.get("c_" + c)
                if not mat:
                    mat = bpy.data.materials.new("c_" + c)
                    mat.use_nodes = True
                    rgb = hex_rgb(c)
                    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
                    bsdf.inputs["Base Color"].default_value = (*rgb, 1)
                    bsdf.inputs["Roughness"].default_value = 1.0
                    mat.diffuse_color = (*rgb, 1)
                mats[c] = len(mesh.materials)
                mesh.materials.append(mat)
        for poly, c in zip(mesh.polygons, self.colors):
            poly.material_index = mats[c]
            poly.use_smooth = False
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(mesh)
        bm.free()
        mesh.update()
        obj = bpy.data.objects.new(self.name, mesh)
        (collection or bpy.context.scene.collection).objects.link(obj)
        return obj
