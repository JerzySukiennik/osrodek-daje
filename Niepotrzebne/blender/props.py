# Prop models. Every builder returns a kit.Model whose footprint matches the collider parts in js/shared/props.js.

import math
from kit import Model

H = math.pi / 2


def tuft():
    m = Model("tuft")
    for i, (x, z, h, lean, c) in enumerate([(0, 0, 0.38, 0, "leafLight"), (0.07, 0.03, 0.3, -0.35, "leaf"), (-0.06, -0.04, 0.27, 0.4, "leaf"),
                                            (0.02, -0.07, 0.24, 0.2, "leafLight"), (-0.04, 0.07, 0.22, -0.25, "leafDark")]):
        m.cone(0.045, h, 3, (x, h / 2, z), c, rot=(lean * 0.6, i, lean))
    return m


def flower():
    m = Model("flower")
    m.cyl(0.016, 0.012, 0.34, 4, (0, 0.17, 0), "leafDark")
    m.cone(0.05, 0.12, 3, (0.05, 0.08, 0), "leaf", rot=(0, 0, -0.9))
    for i in range(5):
        a = i / 5 * math.tau
        m.ico(0.05, (math.cos(a) * 0.06, 0.36, math.sin(a) * 0.06), "pink", scale=(1, 0.45, 1), sub=1)
    m.ico(0.04, (0, 0.38, 0), "yellow", scale=(1, 0.7, 1))
    return m


def pebble():
    m = Model("pebble")
    m.ico(0.13, (0, 0.09, 0), "stone", scale=(1.1, 0.7, 0.9), jitter=0.18)
    return m


def mushroom():
    m = Model("mushroom")
    m.cyl(0.055, 0.04, 0.17, 6, (0, 0.085, 0), "cream")
    m.cyl(0.16, 0.03, 0.12, 8, (0, 0.22, 0), "red", cap_color="cream")
    for a, r in [(0.5, 0.08), (2.4, 0.09), (4.3, 0.07)]:
        m.ico(0.022, (math.cos(a) * r, 0.245 - r * 0.25, math.sin(a) * r), "white", scale=(1, 0.5, 1))
    return m


def apple():
    m = Model("apple")
    m.ico(0.095, (0, 0.09, 0), "red", scale=(1, 0.92, 1), jitter=0.05)
    m.cyl(0.012, 0.01, 0.07, 4, (0, 0.2, 0), "woodDark", rot=(0, 0, 0.3))
    m.ico(0.035, (0.04, 0.21, 0), "leaf", scale=(1.3, 0.3, 0.7))
    return m


def duck():
    m = Model("duck")
    m.ico(0.16, (0, 0.13, 0), "yellow", scale=(1.15, 0.78, 0.9))
    m.cone(0.07, 0.14, 4, (-0.17, 0.2, 0), "yellow", rot=(0, 0, 0.9))
    m.ico(0.095, (0.1, 0.31, 0), "yellow")
    m.box(0.09, 0.03, 0.08, (0.2, 0.29, 0), "orange", top=(0.6, 0.8))
    m.ico(0.017, (0.15, 0.34, 0.07), "black")
    m.ico(0.017, (0.15, 0.34, -0.07), "black")
    return m


def bucket():
    m = Model("bucket")
    m.cyl(0.13, 0.185, 0.3, 10, (0, 0.15, 0), "blue", cap_color="navy")
    m.cyl(0.19, 0.195, 0.03, 10, (0, 0.295, 0), "white", cap_color="navy")
    for x in (-0.19, 0.19):
        m.box(0.015, 0.16, 0.015, (x, 0.36, 0), "metal")
    m.box(0.4, 0.015, 0.015, (0, 0.44, 0), "metal")
    return m


def ball():
    m = Model("ball")
    cols = ["red", "white", "yellow", "white", "blue", "white"]
    seg, rings, r = 12, 6, 0.28
    for s in range(seg):
        a0, a1 = s / seg * math.tau, (s + 1) / seg * math.tau
        for k in range(rings):
            p0, p1 = k / rings * math.pi, (k + 1) / rings * math.pi
            pts = []
            for (p, a) in [(p0, a0), (p0, a1), (p1, a1), (p1, a0)]:
                pts.append((math.sin(p) * math.cos(a) * r, math.cos(p) * r + r, math.sin(p) * math.sin(a) * r))
            m.add(pts, [(0, 1, 2, 3)], cols[(s // 2) % 6])
    m.ico(0.05, (0, 0.56, 0), "white", scale=(1, 0.3, 1))
    return m


def firework():
    m = Model("firework")
    m.box(0.26, 0.04, 0.26, (0, 0.02, 0), "woodDark")
    m.cyl(0.07, 0.07, 0.5, 8, (0, 0.29, 0), "red")
    for y in (0.16, 0.3, 0.44):
        m.cyl(0.074, 0.074, 0.05, 8, (0, y, 0), "white")
    m.cone(0.105, 0.22, 8, (0, 0.65, 0), "yellow")
    m.cyl(0.008, 0.008, 0.16, 4, (0.05, 0.08, 0.05), "black", rot=(0.4, 0, 0.3))
    return m


def char():
    m = Model("char")
    m.ico(0.13, (0, 0.08, 0), "char", scale=(1, 0.62, 0.85), jitter=0.25)
    return m


def log():
    m = Model("log")
    m.cyl(0.15, 0.14, 1.0, 8, (0, 0.15, 0), "wood", rot=(0, 0, H), cap_color="woodLight")
    m.cyl(0.05, 0.04, 0.14, 5, (0.2, 0.3, 0.02), "wood", rot=(0.3, 0, 0.2), cap_color="woodLight")
    m.cyl(0.075, 0.07, 1.01, 8, (0, 0.15, 0), "woodLight", rot=(0, 0, H))
    return m


def crate():
    m = Model("crate")
    m.box(0.56, 0.56, 0.56, (0, 0.3, 0), "woodLight")
    for y in (0.06, 0.54):
        m.box(0.64, 0.09, 0.64, (0, y, 0), "wood")
    for x in (-0.28, 0.28):
        for z in (-0.28, 0.28):
            m.box(0.09, 0.6, 0.09, (x, 0.3, z), "wood")
    for z, s in ((0.285, 1), (-0.285, -1)):
        m.box(0.7, 0.07, 0.02, (0, 0.3, z), "woodDark", rot=(0, 0, 0.78 * s))
    return m


def campfire():
    m = Model("campfire")
    for i in range(9):
        a = i / 9 * math.tau
        m.ico(0.13, (math.cos(a) * 0.4, 0.08, math.sin(a) * 0.4), "stoneDark" if i % 2 else "stone", scale=(1, 0.75, 1), jitter=0.2)
    m.cyl(0.34, 0.34, 0.05, 9, (0, 0.03, 0), "char")
    for a in (0.4, 2.5, 4.6):
        m.cyl(0.07, 0.06, 0.72, 6, (math.cos(a) * 0.05, 0.27, math.sin(a) * 0.05), "woodDark", rot=(0, a, 1.05), cap_color="woodLight")
    return m


def bench():
    m = Model("bench")
    for z in (-0.13, 0, 0.13):
        m.box(1.5, 0.06, 0.115, (0, 0.46, z), "wood" if z else "woodLight")
    for x in (-0.6, 0.6):
        m.box(0.1, 0.43, 0.34, (x, 0.215, 0), "woodDark", top=(1, 0.75))
    m.box(1.1, 0.06, 0.06, (0, 0.2, 0), "woodDark")
    return m


def deckchair():
    m = Model("deckchair")
    rot = (-0.42, 0, 0)
    for i in range(5):
        y_off = (i - 2) * 0.25
        m.box(0.6, 0.05, 0.25, (0, 0.36 + math.sin(0.42) * y_off, 0.1 + math.cos(0.42) * y_off), "coral" if i % 2 == 0 else "white", rot=rot)
    for x in (-0.33, 0.33):
        m.box(0.05, 0.05, 1.4, (x, 0.36, 0.1), "woodLight", rot=rot)
        m.box(0.05, 0.72, 0.05, (x, 0.33, 0.5), "woodLight", rot=(0.5, 0, 0))
    m.box(0.7, 0.05, 0.05, (0, 0.06, -0.56), "woodLight")
    m.box(0.7, 0.05, 0.05, (0, 0.67, 0.74), "woodLight")
    m.box(0.7, 0.05, 0.05, (0, 0.03, 0.33), "woodLight")
    return m


def barrel():
    m = Model("barrel")
    m.cyl(0.31, 0.37, 0.3, 12, (0, 0.15, 0), "navy")
    m.cyl(0.37, 0.37, 0.3, 12, (0, 0.45, 0), "navy")
    m.cyl(0.37, 0.31, 0.3, 12, (0, 0.75, 0), "navy", cap_color="blue")
    for y in (0.28, 0.62):
        m.cyl(0.385, 0.385, 0.06, 12, (0, y, 0), "metal")
    return m


def grill():
    m = Model("grill")
    m.cyl(0.2, 0.42, 0.26, 12, (0, 0.77, 0), "black", cap_color="orange")
    m.cyl(0.42, 0.18, 0.2, 12, (0, 1.0, 0), "red")
    m.box(0.12, 0.04, 0.05, (0, 1.12, 0), "woodLight")
    for a in (0.5, 2.6, 4.7):
        x, z = math.cos(a) * 0.24, math.sin(a) * 0.24
        m.cyl(0.03, 0.025, 0.7, 5, (x * 1.1, 0.33, z * 1.1), "metalDark", rot=(math.sin(a) * 0.18, 0, -math.cos(a) * 0.18))
    m.cyl(0.3, 0.3, 0.02, 10, (0, 0.3, 0), "metalDark")
    return m


def parasol():
    m = Model("parasol")
    m.cyl(0.24, 0.2, 0.1, 8, (0, 0.05, 0), "stone")
    m.cyl(0.04, 0.035, 2.35, 6, (0, 1.2, 0), "white")
    seg, r, y0, y1 = 8, 1.15, 2.08, 2.58
    for i in range(seg):
        a0, a1 = i / seg * math.tau, (i + 1) / seg * math.tau
        p0 = (math.cos(a0) * r, y0, math.sin(a0) * r)
        p1 = (math.cos(a1) * r, y0, math.sin(a1) * r)
        col = "yellow" if i % 2 == 0 else "white"
        m.add([p0, p1, (0, y1, 0)], [(0, 1, 2)], col)
        m.add([p0, p1, (math.cos(a1) * r * 0.98, y0 - 0.14, math.sin(a1) * r * 0.98), (math.cos(a0) * r * 0.98, y0 - 0.14, math.sin(a0) * r * 0.98)], [(0, 1, 2, 3)], col)
    m.ico(0.06, (0, 2.62, 0), "red")
    return m


def bush():
    m = Model("bush")
    for (x, y, z, r, c) in [(0, 0.42, 0, 0.52, "leaf"), (0.36, 0.36, 0.18, 0.36, "leafDark"), (-0.32, 0.34, -0.22, 0.34, "leafLight"),
                            (-0.1, 0.62, 0.2, 0.3, "leafLight"), (0.12, 0.3, -0.34, 0.3, "leafDark")]:
        m.ico(r, (x, y, z), c, scale=(1, 0.85, 1), jitter=0.12)
    for (x, y, z) in [(0.3, 0.62, 0.3), (-0.35, 0.55, 0.1), (0.05, 0.85, 0.05)]:
        m.ico(0.04, (x, y, z), "red")
    return m


def fence():
    m = Model("fence")
    for x in (-0.95, 0.95):
        m.box(0.13, 0.86, 0.13, (x, 0.43, 0), "woodDark")
        m.cone(0.1, 0.14, 4, (x, 0.93, 0), "woodDark", rot=(0, math.pi / 4, 0))
    for y, tilt in ((0.72, 0.02), (0.38, -0.025)):
        m.box(2.0, 0.12, 0.06, (0, y, 0.02), "wood", rot=(0, 0, tilt))
    return m


def table():
    m = Model("table")
    for z in (-0.3, -0.1, 0.1, 0.3):
        m.box(1.8, 0.07, 0.185, (0, 0.76, z), "woodLight" if abs(z) > 0.2 else "wood")
    for z in (-0.7, 0.7):
        m.box(1.8, 0.07, 0.3, (0, 0.44, z), "wood")
    for x in (-0.65, 0.65):
        m.box(0.09, 0.09, 1.55, (x, 0.4, 0), "woodDark")
        for s in (-1, 1):
            m.box(0.09, 0.86, 0.09, (x, 0.38, s * 0.33), "woodDark", rot=(s * 0.5, 0, 0))
    return m


def kayak():
    m = Model("kayak")
    plan = [(-1.75, 0), (-1.1, 0.3), (0, 0.36), (1.1, 0.3), (1.75, 0), (1.1, -0.3), (0, -0.36), (-1.1, -0.3)]
    m.prism([(p[0], p[1]) for p in plan], 0.3, (0, 0.16, 0), "red", rot=(H, 0, 0))
    m.prism([(p[0] * 0.93, p[1] * 0.8) for p in plan], 0.04, (0, 0.325, 0), "coral", rot=(H, 0, 0))
    m.prism([(-0.45, 0), (-0.25, 0.2), (0.35, 0.2), (0.5, 0), (0.35, -0.2), (-0.25, -0.2)], 0.05, (0, 0.34, 0), "black", rot=(H, 0, 0))
    m.box(0.3, 0.12, 0.3, (-0.18, 0.38, 0), "yellow")
    m.cyl(0.02, 0.02, 1.7, 5, (0.55, 0.37, 0.12), "woodLight", rot=(0, 0, H))
    for s in (-1, 1):
        m.box(0.34, 0.02, 0.16, (0.55 + s * 0.95, 0.37, 0.12), "yellow")
    return m


def sign():
    m = Model("sign")
    YAW = -0.5
    POS = (0, 1.5, 0.22)
    m.cyl(0.22, 0.18, 0.14, 8, (0, 0.07, 0), "stoneDark")
    m.box(0.16, 1.75, 0.16, (0, 0.87, 0), "woodDark")
    board = [(-0.82, 0.6), (0.82, 0.6), (0.82, -0.22), (0.0, -0.86), (-0.82, -0.22)]
    m.prism(board, 0.12, POS, "cream", rot=(0, YAW, 0))
    m.prism([(p[0] * 0.88, p[1] * 0.88) for p in board], 0.15, POS, "red", rot=(0, YAW, 0))
    m.prism([(p[0] * 0.74, p[1] * 0.74) for p in board], 0.17, POS, "cream", rot=(0, YAW, 0))
    sun = [(math.cos(i / 9 * math.tau) * 0.21, 0.16 + math.sin(i / 9 * math.tau) * 0.21) for i in range(9)]
    m.prism(sun, 0.21, POS, "yellow", rot=(0, YAW, 0))
    for i in range(8):
        a = i / 8 * math.tau
        ray = [(math.cos(a) * 0.26, 0.16 + math.sin(a) * 0.26), (math.cos(a) * 0.36, 0.16 + math.sin(a) * 0.36),
               (math.cos(a + 0.22) * 0.34, 0.16 + math.sin(a + 0.22) * 0.34), (math.cos(a + 0.22) * 0.25, 0.16 + math.sin(a + 0.22) * 0.25)]
        m.prism(ray, 0.2, POS, "yellow", rot=(0, YAW, 0))
    return m


def pine():
    m = Model("pine")
    m.cyl(0.19, 0.13, 1.5, 6, (0, 0.75, 0), "woodDark")
    tiers = [(1.2, 1.7, 1.75, "leafDark"), (0.98, 1.5, 2.7, "leaf"), (0.72, 1.35, 3.55, "leafDark"), (0.42, 0.9, 4.2, "leaf")]
    for i, (r, h, y, c) in enumerate(tiers):
        m.cyl(r, 0.0, h, 7, (0, y, 0), c, rot=(0, i * 0.45, 0), cap_color="leafDark")
    return m


def rocket():
    m = Model("rocket")
    m.cyl(0.26, 0.34, 0.4, 10, (0, 0.34, 0), "metalDark", cap_color="orange")
    m.cyl(0.36, 0.36, 2.5, 12, (0, 1.8, 0), "gsp")
    m.cyl(0.365, 0.365, 0.22, 12, (0, 2.55, 0), "white")
    m.cyl(0.365, 0.365, 0.1, 12, (0, 1.0, 0), "white")
    m.cyl(0.36, 0.0, 1.05, 12, (0, 3.57, 0), "white")
    m.cyl(0.11, 0.11, 0.06, 8, (0, 2.1, 0.35), "cyan", rot=(H, 0, 0))
    fin = [(0, 0), (0.62, -0.35), (0.62, 0.15), (0, 0.95)]
    for k in range(4):
        a = k * H
        m.prism(fin, 0.07, (math.cos(a) * 0.35, 0.72, -math.sin(a) * 0.35), "white", rot=(0, a, 0))
    for y in (1.5, 1.75):
        m.box(0.3, 0.12, 0.02, (0, y, 0.362), "white")
    return m


def car():
    m = Model("car")
    body = [(-1.5, 0.28), (1.5, 0.28), (1.5, 0.78), (1.38, 0.95), (0.72, 1.0), (0.42, 1.5), (-0.95, 1.52), (-1.32, 1.0), (-1.5, 0.92)]
    m.prism(body, 1.4, (0, 0, 0), "carBody")
    glass = [(0.66, 1.02), (0.4, 1.44), (-0.92, 1.46), (-1.2, 1.02)]
    m.prism(glass, 1.42, (0, 0, 0), "window")
    m.prism([(0.2, 1.0), (0.14, 1.48), (0.06, 1.48), (0.1, 1.0)], 1.44, (0, 0, 0), "carBody")
    m.prism([(-0.4, 1.0), (-0.42, 1.48), (-0.5, 1.48), (-0.5, 1.0)], 1.44, (0, 0, 0), "carBody")
    m.box(0.95, 0.06, 1.0, (-0.3, 1.53, 0), "cream")
    for x in (-0.95, 0.95):
        for z in (-0.66, 0.66):
            m.cyl(0.33, 0.33, 0.2, 10, (x, 0.33, z), "tyre", rot=(H, 0, 0), cap_color="metal")
    m.box(0.1, 0.12, 1.5, (1.53, 0.4, 0), "metal")
    m.box(0.1, 0.12, 1.5, (-1.53, 0.4, 0), "metal")
    for z in (-0.45, 0.45):
        m.cyl(0.12, 0.12, 0.05, 8, (1.5, 0.72, z), "yellow", rot=(0, 0, H))
        m.box(0.04, 0.12, 0.2, (-1.51, 0.72, z), "red")
    return m


def cabin():
    m = Model("cabin")
    m.box(4.0, 2.3, 4.4, (0, 1.15, 0), "wall")
    m.box(4.06, 0.3, 4.46, (0, 0.15, 0), "woodDark")
    gable = [(-2.0, 2.3), (2.0, 2.3), (0, 3.75)]
    m.prism(gable, 4.38, (0, 0, 0), "wall")
    for s in (-1, 1):
        m.box(3.1, 0.2, 5.0, (s * 1.2, 2.93, 0), "roof", rot=(0, 0, -s * 0.62))
    m.box(0.3, 0.26, 5.06, (0, 3.86, 0), "coral")
    m.box(0.5, 1.0, 0.5, (1.1, 3.5, -1.2), "stoneDark")
    m.box(0.6, 0.12, 0.6, (1.1, 4.02, -1.2), "stone")
    m.box(0.95, 1.75, 0.08, (-0.7, 1.05, 2.22), "wood")
    m.box(1.1, 1.9, 0.05, (-0.7, 1.1, 2.2), "woodDark")
    m.ico(0.05, (-0.4, 1.0, 2.28), "yellow")
    m.box(1.1, 1.0, 0.05, (0.95, 1.4, 2.2), "white")
    m.box(0.92, 0.82, 0.08, (0.95, 1.4, 2.2), "window")
    m.box(0.06, 0.82, 0.1, (0.95, 1.4, 2.2), "white")
    m.box(0.92, 0.06, 0.1, (0.95, 1.4, 2.2), "white")
    m.box(1.2, 0.12, 0.2, (0.95, 0.84, 2.28), "coral")
    for z in (-1.0, 1.0):
        m.box(0.05, 1.0, 1.0, (2.0, 1.4, z), "white")
        m.box(0.08, 0.82, 0.82, (2.0, 1.4, z), "window")
    m.box(4.2, 0.18, 1.2, (0, 0.09, 2.7), "woodDark")
    for x in (-1.9, 1.9):
        m.box(0.14, 2.1, 0.14, (x, 1.2, 3.15), "wood")
    m.box(4.3, 0.14, 1.3, (0, 2.3, 2.75), "roof", rot=(0.12, 0, 0))
    m.cyl(0.2, 0.2, 0.04, 10, (-0.7, 2.12, 2.24), "cream", rot=(H, 0, 0))
    m.box(0.16, 0.035, 0.03, (-0.7, 2.19, 2.27), "navy")
    m.box(0.035, 0.18, 0.03, (-0.66, 2.11, 2.27), "navy", rot=(0, 0, -0.35))
    return m


def star():
    m = Model("star")
    pts = []
    import math as _m
    for i in range(10):
        a = i / 10 * _m.tau + _m.pi / 2
        r = 0.3 if i % 2 == 0 else 0.13
        pts.append((_m.cos(a) * r, _m.sin(a) * r))
    m.prism(pts, 0.09, (0, 0.32, 0), "yellow", rot=(H, 0, 0))
    inner = [(p[0] * 0.62, p[1] * 0.62) for p in pts]
    m.prism(inner, 0.12, (0, 0.32, 0), "cream", rot=(H, 0, 0))
    m.cyl(0.11, 0.07, 0.06, 8, (0, 0.03, 0), "woodDark")
    return m


BUILDERS = [star, tuft, flower, pebble, mushroom, apple, duck, bucket, ball, firework, char, log, crate, campfire, bench,
            deckchair, barrel, grill, parasol, bush, fence, table, kayak, sign, pine, rocket, car, cabin]
