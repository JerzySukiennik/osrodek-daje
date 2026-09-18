# The four characters, chunky and angular, facing +z (toward the camera). Origin at the feet.

import math
from kit import Model

H = math.pi / 2


def face(m, y, z, eye_dx=0.075, eye="black", smile=True, brow=None):
    for s in (-1, 1):
        m.ico(0.024, (s * eye_dx, y, z), eye, scale=(1, 1.25, 0.6))
    if brow:
        for s in (-1, 1):
            m.box(0.07, 0.018, 0.02, (s * eye_dx, y + 0.055, z), brow, rot=(0, 0, -s * 0.18))
    m.box(0.035, 0.05, 0.05, (0, y - 0.045, z + 0.015), "skinDark", top=(0.5, 0.4))
    if smile:
        m.box(0.11, 0.028, 0.02, (0, y - 0.105, z - 0.005), "white")
        for s in (-1, 1):
            m.box(0.03, 0.025, 0.02, (s * 0.065, y - 0.093, z - 0.008), "white", rot=(0, 0, s * 0.6))


def ks():
    m = Model("ks")
    for s in (-1, 1):
        x = s * 0.12
        m.cyl(0.082, 0.098, 0.56, 8, (x, 0.36, 0), "crocLeather")
        m.cyl(0.105, 0.1, 0.05, 8, (x, 0.64, 0), "crocSole")
        m.box(0.19, 0.11, 0.36, (x, 0.075, 0.07), "crocLeather", top=(0.82, 0.78))
        m.box(0.2, 0.04, 0.38, (x, 0.02, 0.07), "crocSole")
        m.box(0.13, 0.05, 0.1, (x, 0.025, -0.08), "crocSole")
        for row in range(5):
            y = 0.17 + row * 0.095
            for col in range(3):
                a = (col - 1) * 0.62 + (0.31 if row % 2 else 0)
                r = 0.088 + (0.61 - y) * -0.0 + 0.004
                rr = 0.082 + (y - 0.08) / 0.56 * 0.016
                m.box(0.05, 0.062, 0.022, (x + math.sin(a) * rr, y, math.cos(a) * rr), "crocScale" if (row + col) % 3 else "crocShine", rot=(0, a, 0), top=(0.7, 0.6))
        for k in range(3):
            for j in range(2):
                m.box(0.055, 0.02, 0.06, (x + (j - 0.5) * 0.07, 0.128 - k * 0.004, 0.06 + k * 0.075), "crocScale" if (k + j) % 2 else "crocShine", top=(0.7, 0.7))
        m.cyl(0.07, 0.075, 0.16, 6, (x, 0.74, 0), "navy")
    m.cyl(0.41, 0.26, 0.98, 10, (0, 1.13, 0), "furDeep")
    m.cyl(0.26, 0.19, 0.12, 10, (0, 1.66, 0), "furDeep")
    cols = ["fur", "furWarm", "fur", "furShade"]
    y = 1.6
    k = 0
    while y > 0.86:
        t = (1.66 - y) / 1.0
        r = 0.255 + t * 0.15
        m.strands(18 + int(t * 8), r, r + 0.05 + t * 0.02, y, 0.46, 0.115, cols, phase=k * 0.41, yvar=0.05, thick=0.02, vary=0.5)
        y -= 0.12
        k += 1
    m.strands(18, 0.2, 0.36, 1.69, 0.36, 0.12, cols, phase=0.2, thick=0.02, yvar=0.02, vary=0.4)
    m.strands(14, 0.16, 0.3, 1.71, 0.24, 0.11, ["fur", "furWarm", "fur"], phase=0.55, thick=0.02, yvar=0.015, vary=0.4)
    for s in (-1, 1):
        ax = s * 0.37
        m.cyl(0.08, 0.105, 0.6, 7, (ax, 1.3, 0.02), "furDeep", rot=(0, 0, s * 0.3))
        for j in range(5):
            yy = 1.58 - j * 0.1
            m.strands(9, 0.095, 0.13, yy, 0.3, 0.085, cols, center=(s * (0.285 + j * 0.031), 0.02), phase=j * 0.5, yvar=0.03, thick=0.02, vary=0.5)
        m.ico(0.065, (s * 0.47, 0.97, 0.03), "skin")
    m.cyl(0.07, 0.07, 0.1, 6, (0, 1.69, 0), "skin")
    m.ico(0.15, (0, 1.85, 0.0), "skin", scale=(0.95, 1.12, 0.95))
    m.ico(0.165, (0, 1.9, -0.03), "hairBrown", scale=(1.0, 0.95, 1.0))
    m.box(0.3, 0.06, 0.2, (0, 2.0, -0.02), "hairBrown", top=(0.7, 0.7))
    for s in (-1, 1):
        m.box(0.07, 0.42, 0.2, (s * 0.16, 1.72, -0.03), "hairBrown", top=(0.8, 0.9), rot=(0, 0, s * 0.06))
        m.box(0.06, 0.16, 0.12, (s * 0.175, 1.5, -0.02), "hairBrown", top=(1.4, 1.2), rot=(0, 0, -s * 0.2))
    m.box(0.3, 0.46, 0.07, (0, 1.7, -0.14), "hairBrown", top=(0.9, 1))
    face(m, 1.87, 0.135, brow="hairDark")
    for s in (-1, 1):
        m.box(0.105, 0.075, 0.02, (s * 0.075, 1.87, 0.15), "glass")
        m.box(0.075, 0.045, 0.025, (s * 0.075, 1.87, 0.152), "white")
        m.ico(0.018, (s * 0.075, 1.87, 0.166), "black")
    m.box(0.05, 0.015, 0.02, (0, 1.875, 0.15), "glass")
    return m


def rys():
    m = Model("rys")
    for s in (-1, 1):
        m.cyl(0.06, 0.075, 0.52, 6, (s * 0.085, 0.37, 0), "jeans")
        m.box(0.13, 0.09, 0.24, (s * 0.085, 0.065, 0.04), "white", top=(0.9, 0.8))
        m.box(0.135, 0.03, 0.25, (s * 0.085, 0.015, 0.04), "red")
    m.cyl(0.2, 0.23, 0.22, 9, (0, 0.72, 0), "spider")
    m.cyl(0.23, 0.18, 0.34, 9, (0, 0.98, 0), "spider")
    for i, (yy, rt, rb) in enumerate([(1.12, 0.19, 0.22), (0.98, 0.215, 0.24), (0.84, 0.225, 0.25), (0.72, 0.215, 0.235)]):
        m.strands(11, rt, rb, yy, 0.17, 0.13, ["spider", "coral"] if i % 2 else ["coral", "spider"], phase=i * 0.4, thick=0.025)
    m.ico(0.13, (0, 1.12, -0.13), "spider", scale=(1.2, 0.8, 0.8))
    for s in (-1, 1):
        eye = [(0.0, 0.0), (0.11, 0.06), (0.1, -0.03), (0.03, -0.07)]
        m.prism([(s * p[0] * 1.25, p[1] * 1.25) for p in eye], 0.03, (s * 0.025, 0.93, 0.275), "black", rot=(-0.1, 0, 0))
        m.prism([(s * (p[0] * 0.78 + 0.025), p[1] * 0.78 - 0.004) for p in eye], 0.04, (s * 0.025, 0.93, 0.28), "white", rot=(-0.1, 0, 0))
    for s in (-1, 1):
        m.cyl(0.06, 0.08, 0.42, 6, (s * 0.3, 1.13, 0.02), "spider", rot=(0, 0, s * 2.35))
        m.strands(7, 0.075, 0.1, 1.25, 0.11, 0.09, ["coral", "spider"], center=(s * 0.41, 0.02), thick=0.02)
        m.ico(0.055, (s * 0.47, 1.31, 0.03), "skin")
    m.cyl(0.055, 0.055, 0.07, 6, (0, 1.17, 0), "skin")
    m.ico(0.14, (0, 1.31, 0), "skin", scale=(1, 1.05, 0.96))
    m.ico(0.15, (0, 1.37, -0.02), "hairBlond", scale=(1.04, 0.7, 1.04))
    m.box(0.27, 0.06, 0.1, (0, 1.385, 0.105), "hairBlond", rot=(0.25, 0, 0))
    face(m, 1.31, 0.125, eye_dx=0.065, brow="hairBlond")
    return m


def jurek():
    m = Model("jurek")
    for s in (-1, 1):
        m.cyl(0.075, 0.095, 0.72, 6, (s * 0.105, 0.47, 0), "jogger")
        m.cyl(0.082, 0.082, 0.05, 6, (s * 0.105, 0.13, 0), "hoodie")
        m.box(0.17, 0.1, 0.3, (s * 0.105, 0.06, 0.05), "croc", top=(0.9, 0.85))
        m.ico(0.085, (s * 0.105, 0.09, 0.15), "croc", scale=(1, 0.7, 1))
        for k in range(3):
            m.ico(0.014, (s * 0.105 + (k - 1) * 0.04, 0.125, 0.17), "crocDark")
        m.box(0.18, 0.025, 0.31, (s * 0.105, 0.0125, 0.05), "crocDark")
    m.cyl(0.24, 0.27, 0.3, 9, (0, 0.95, 0), "hoodie")
    m.cyl(0.27, 0.21, 0.36, 9, (0, 1.28, 0), "hoodie")
    m.cyl(0.25, 0.245, 0.06, 9, (0, 0.8, 0), "jogger")
    m.box(0.3, 0.13, 0.04, (0, 0.95, 0.255), "jogger", top=(0.85, 1))
    m.ico(0.15, (0, 1.45, -0.14), "hoodie", scale=(1.25, 0.75, 0.8))
    m.prism([(0, 0), (0.13, 0.05), (0.04, 0.0), (0.12, -0.02)], 0.02, (-0.13, 1.3, 0.245), "yellow", rot=(-0.12, 0, 0))
    m.box(0.07, 0.07, 0.02, (0.11, 1.3, 0.243), "white", rot=(-0.12, 0, 0))
    m.box(0.03, 0.03, 0.025, (0.11, 1.3, 0.245), "black", rot=(-0.12, 0, 0))
    for s in (-1, 1):
        m.box(0.012, 0.16, 0.012, (s * 0.04, 1.36, 0.23), "white", rot=(-0.1, 0, 0))
    m.cyl(0.075, 0.095, 0.5, 6, (-0.33, 1.2, 0.0), "hoodie", rot=(0, 0, -0.25))
    m.ico(0.06, (-0.39, 0.93, 0.0), "skin")
    m.cyl(0.075, 0.095, 0.3, 6, (0.31, 1.3, 0.03), "hoodie", rot=(0, 0, 0.3))
    m.cyl(0.07, 0.08, 0.3, 6, (0.34, 1.12, 0.17), "hoodie", rot=(1.15, 0, 0))
    m.ico(0.06, (0.34, 1.18, 0.32), "skin")
    m.box(0.085, 0.16, 0.02, (0.34, 1.25, 0.36), "black", rot=(-0.5, 0, 0))
    m.box(0.07, 0.135, 0.022, (0.34, 1.252, 0.364), "cyan", rot=(-0.5, 0, 0))
    m.cyl(0.065, 0.065, 0.08, 6, (0, 1.5, 0), "skin")
    m.ico(0.15, (0, 1.65, 0), "skin", scale=(0.98, 1.08, 0.96))
    m.ico(0.162, (0, 1.71, -0.025), "hairDark", scale=(1.03, 0.78, 1.03), jitter=0.12)
    for (x, z, r) in [(-0.08, 0.1, 0.5), (0.03, 0.12, -0.3), (0.11, 0.08, -0.7), (-0.13, 0.02, 0.9), (0.0, -0.05, 0.1)]:
        m.cone(0.05, 0.13, 4, (x, 1.8, z), "hairDark", rot=(0.4, 0, r))
    m.box(0.26, 0.05, 0.08, (0.0, 1.745, 0.115), "hairDark", rot=(0.3, 0, 0.08))
    face(m, 1.65, 0.135, brow="hairDark")
    return m


def dropsik():
    m = Model("dropsik")
    m.box(0.22, 0.2, 0.46, (0, 0.27, -0.02), "dogBlack", top=(0.9, 0.95))
    m.box(0.16, 0.14, 0.12, (0, 0.23, 0.2), "caramel", top=(0.9, 0.8))
    for sx in (-1, 1):
        for sz, lean in ((0.15, 0.25), (-0.19, -0.3)):
            m.cyl(0.035, 0.045, 0.2, 5, (sx * 0.08, 0.11, sz), "dogBlack", rot=(lean, 0, 0))
            m.ico(0.045, (sx * 0.08, 0.03, sz + lean * 0.12), "caramel", scale=(1, 0.65, 1.25))
    m.cyl(0.07, 0.085, 0.14, 6, (0, 0.4, 0.2), "dogBlack", rot=(0.7, 0, 0))
    m.box(0.2, 0.18, 0.19, (0, 0.52, 0.27), "dogBlack", top=(0.85, 0.85))
    m.box(0.11, 0.09, 0.13, (0, 0.47, 0.4), "caramel", top=(0.8, 0.8))
    m.ico(0.03, (0, 0.5, 0.47), "black", scale=(1.2, 0.9, 0.8))
    m.box(0.05, 0.015, 0.09, (0.01, 0.41, 0.43), "tongue", rot=(0.5, 0, 0))
    for s in (-1, 1):
        m.ico(0.02, (s * 0.055, 0.555, 0.367), "white", scale=(1, 1.1, 0.6))
        m.ico(0.014, (s * 0.055, 0.553, 0.378), "black")
        m.ico(0.02, (s * 0.055, 0.6, 0.355), "caramel", scale=(1.3, 0.7, 0.6))
    m.prism([(0, 0), (0.1, 0.0), (0.06, 0.17)], 0.03, (-0.125, 0.6, 0.23), "dogBlack", rot=(0, 0.3, 0.2))
    m.prism([(0, 0), (0.06, 0.0), (0.035, 0.1)], 0.035, (-0.105, 0.61, 0.24), "caramel", rot=(0, 0.3, 0.2))
    m.prism([(0, 0), (0.1, 0.0), (0.13, -0.12)], 0.03, (0.04, 0.61, 0.23), "dogBlack", rot=(0, -0.3, -0.5))
    m.cyl(0.03, 0.022, 0.18, 5, (0, 0.43, -0.28), "dogBlack", rot=(-0.7, 0, 0))
    m.cyl(0.022, 0.012, 0.14, 5, (0, 0.55, -0.31), "caramel", rot=(0.5, 0, 0))
    m.box(0.23, 0.035, 0.05, (0, 0.4, 0.14), "red")
    m.cyl(0.025, 0.025, 0.015, 6, (0, 0.375, 0.215), "yellow", rot=(H, 0, 0))
    return m


BUILDERS = [ks, rys, jurek, dropsik]
