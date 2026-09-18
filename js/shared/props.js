// Prop catalogue: each prop is a list of flat-coloured primitive parts that doubles as its visual and its collider set.

const P = {
  wood: "#c8742b", woodDark: "#8f4a1c", woodLight: "#f0a441",
  leaf: "#3fae3a", leafDark: "#1f7f3a", leafLight: "#8fd628",
  stone: "#a9adb8", stoneDark: "#6f7485",
  red: "#ef2f3c", coral: "#ff5a3c", pink: "#ff5fa2", yellow: "#ffd21f", cream: "#fff1c4",
  blue: "#1e9bf0", navy: "#2541b2", white: "#ffffff", black: "#26222b", char: "#2b2526",
  metal: "#8d99ae", metalDark: "#56607a", orange: "#ff8a1f", green: "#17a35c", gsp: "#22b455"
};

const box = (w, h, d, x, y, z, color, o = {}) => ({ shape: "box", size: [w, h, d], pos: [x, y, z], rot: o.rot || [0, 0, 0], color, nc: !!o.nc, nv: !!o.nv });
const cyl = (r, h, x, y, z, color, o = {}) => ({ shape: "cyl", size: [r, h, o.rTop == null ? r : o.rTop], pos: [x, y, z], rot: o.rot || [0, 0, 0], color, nc: !!o.nc, seg: o.seg || 10 });
const cone = (r, h, x, y, z, color, o = {}) => ({ shape: "cone", size: [r, h], pos: [x, y, z], rot: o.rot || [0, 0, 0], color, nc: !!o.nc, seg: o.seg || 8 });
const ball = (r, x, y, z, color, o = {}) => ({ shape: "ball", size: [r], pos: [x, y, z], rot: [0, 0, 0], color, nc: !!o.nc, squash: o.squash || 1 });

const HALF_PI = Math.PI / 2;

export const PROPS = {
  tuft: {
    label: "Grass tuft", grow: 0.02, density: 0.4, flammable: true, burn: 0.8,
    parts: [
      box(0.12, 0.1, 0.12, 0, 0.05, 0, P.leafLight),
      cone(0.05, 0.34, 0, 0.17, 0, P.leafLight, { nc: true, seg: 4 }),
      cone(0.045, 0.26, 0.07, 0.13, 0.03, P.leaf, { nc: true, seg: 4, rot: [0, 0, -0.3] }),
      cone(0.045, 0.24, -0.06, 0.12, -0.04, P.leaf, { nc: true, seg: 4, rot: [0.2, 0, 0.35] })
    ]
  },
  flower: {
    label: "Flower", grow: 0.02, density: 0.4, flammable: true, burn: 0.8,
    parts: [
      box(0.1, 0.08, 0.1, 0, 0.04, 0, P.leaf),
      cyl(0.015, 0.3, 0, 0.2, 0, P.leafDark, { nc: true, seg: 5 }),
      ball(0.075, 0, 0.38, 0, P.pink, { nc: true }),
      ball(0.035, 0, 0.42, 0, P.yellow, { nc: true })
    ]
  },
  pebble: {
    label: "Pebble", grow: 0.03, density: 2.2,
    parts: [ball(0.12, 0, 0.1, 0, P.stone, { squash: 0.75 })]
  },
  mushroom: {
    label: "Mushroom", grow: 0.03, density: 0.6,
    parts: [cyl(0.05, 0.16, 0, 0.08, 0, P.cream, { seg: 7 }), cone(0.15, 0.13, 0, 0.22, 0, P.red, { seg: 8 })]
  },
  apple: {
    label: "Apple", grow: 0.02, density: 0.9,
    parts: [ball(0.09, 0, 0.09, 0, P.red), cyl(0.012, 0.06, 0, 0.2, 0, P.woodDark, { nc: true, seg: 4 })]
  },
  duck: {
    label: "Rubber duck", grow: 0.05, density: 0.3, floats: true,
    parts: [
      ball(0.15, 0, 0.13, 0, P.yellow, { squash: 0.8 }),
      ball(0.09, 0.09, 0.3, 0, P.yellow, { nc: true }),
      cone(0.04, 0.09, 0.2, 0.29, 0, P.orange, { nc: true, seg: 5, rot: [0, 0, -HALF_PI] })
    ]
  },
  bucket: {
    label: "Bucket", grow: 0.06, density: 0.5,
    parts: [cyl(0.13, 0.3, 0, 0.15, 0, P.blue, { rTop: 0.18, seg: 10 })]
  },
  ball: {
    label: "Beach ball", grow: 0.1, density: 0.08, floats: true, bounce: 0.75,
    parts: [ball(0.28, 0, 0.28, 0, P.white), ball(0.2, 0, 0.38, 0, P.red, { nc: true, squash: 0.8 })]
  },
  firework: {
    label: "Firework", grow: 0.05, density: 0.5, firework: true,
    parts: [
      cyl(0.07, 0.5, 0, 0.25, 0, P.red, { seg: 8 }),
      cone(0.1, 0.2, 0, 0.6, 0, P.yellow, { nc: true, seg: 8 }),
      box(0.26, 0.04, 0.26, 0, 0.02, 0, P.woodDark)
    ]
  },
  char: {
    label: "Charcoal", grow: 0.03, density: 0.5,
    parts: [box(0.2, 0.16, 0.18, 0, 0.08, 0, P.char)]
  },
  log: {
    label: "Log", grow: 0.15, density: 0.7, flammable: true, floats: true,
    parts: [
      box(1.0, 0.27, 0.27, 0, 0.145, 0, P.wood, { nv: true }),
      cyl(0.15, 1.0, 0, 0.15, 0, P.wood, { rot: [0, 0, HALF_PI], seg: 8, nc: true }),
      cyl(0.11, 1.02, 0, 0.15, 0, P.woodLight, { rot: [0, 0, HALF_PI], seg: 8, nc: true })
    ]
  },
  crate: {
    label: "Crate", grow: 0.25, density: 0.5, flammable: true, floats: true,
    parts: [
      box(0.6, 0.6, 0.6, 0, 0.3, 0, P.woodLight),
      box(0.64, 0.1, 0.64, 0, 0.06, 0, P.wood, { nc: true }),
      box(0.64, 0.1, 0.64, 0, 0.54, 0, P.wood, { nc: true })
    ]
  },
  campfire: {
    label: "Campfire", grow: 0.3, density: 1.2, fireSource: true,
    parts: [
      cyl(0.5, 0.16, 0, 0.08, 0, P.stoneDark, { seg: 9 }),
      cyl(0.36, 0.18, 0, 0.09, 0, P.char, { seg: 9, nc: true }),
      cyl(0.07, 0.7, 0, 0.26, 0, P.woodDark, { rot: [0, 0.4, 1.1], seg: 6, nc: true }),
      cyl(0.07, 0.7, 0, 0.26, 0, P.wood, { rot: [0, 2.5, 1.1], seg: 6, nc: true }),
      cyl(0.07, 0.7, 0, 0.26, 0, P.woodDark, { rot: [0, 4.6, 1.1], seg: 6, nc: true })
    ]
  },
  bench: {
    label: "Bench", grow: 0.35, density: 0.6, flammable: true, floats: true,
    parts: [
      box(1.5, 0.08, 0.4, 0, 0.45, 0, P.wood),
      box(0.1, 0.42, 0.34, -0.6, 0.21, 0, P.woodDark),
      box(0.1, 0.42, 0.34, 0.6, 0.21, 0, P.woodDark)
    ]
  },
  deckchair: {
    label: "Deckchair", grow: 0.4, density: 0.4, flammable: true,
    parts: [
      box(0.62, 0.06, 1.25, 0, 0.36, 0.1, P.coral, { rot: [-0.42, 0, 0] }),
      box(0.62, 0.06, 0.25, 0, 0.36, 0.1, P.white, { rot: [-0.42, 0, 0], nc: true }),
      box(0.66, 0.3, 0.08, 0, 0.15, 0.55, P.woodLight),
      box(0.66, 0.62, 0.08, 0, 0.31, -0.35, P.woodLight)
    ]
  },
  barrel: {
    label: "Barrel", grow: 0.4, density: 0.7, floats: true,
    parts: [
      cyl(0.36, 0.9, 0, 0.45, 0, P.navy, { seg: 12 }),
      cyl(0.38, 0.08, 0, 0.22, 0, P.metal, { seg: 12, nc: true }),
      cyl(0.38, 0.08, 0, 0.7, 0, P.metal, { seg: 12, nc: true })
    ]
  },
  grill: {
    label: "Grill", grow: 0.5, density: 0.8, fireSource: true,
    parts: [
      cyl(0.4, 0.3, 0, 0.78, 0, P.black, { rTop: 0.42, seg: 12 }),
      cyl(0.035, 0.66, 0.2, 0.33, 0.12, P.metalDark, { seg: 5 }),
      cyl(0.035, 0.66, -0.2, 0.33, 0.12, P.metalDark, { seg: 5 }),
      cyl(0.035, 0.66, 0, 0.33, -0.23, P.metalDark, { seg: 5 }),
      cyl(0.36, 0.04, 0, 0.95, 0, P.orange, { seg: 12, nc: true })
    ]
  },
  parasol: {
    label: "Parasol", grow: 0.6, density: 0.35, anchored: true, flammable: true,
    parts: [
      cyl(0.04, 2.3, 0, 1.15, 0, P.white, { seg: 6 }),
      cone(1.15, 0.5, 0, 2.3, 0, P.yellow, { seg: 8 }),
      cyl(0.22, 0.1, 0, 0.05, 0, P.stone, { seg: 8 })
    ]
  },
  bush: {
    label: "Bush", grow: 0.5, density: 0.3, flammable: true,
    parts: [
      ball(0.55, 0, 0.45, 0, P.leaf, { squash: 0.85 }),
      ball(0.38, 0.35, 0.4, 0.2, P.leafDark, { nc: true }),
      ball(0.34, -0.3, 0.38, -0.25, P.leafLight, { nc: true })
    ]
  },
  fence: {
    label: "Fence", grow: 0.4, density: 0.5, anchored: true, flammable: true,
    parts: [
      box(0.12, 0.95, 0.12, -0.95, 0.475, 0, P.woodDark),
      box(0.12, 0.95, 0.12, 0.95, 0.475, 0, P.woodDark),
      box(2.0, 0.12, 0.06, 0, 0.72, 0, P.wood),
      box(2.0, 0.12, 0.06, 0, 0.38, 0, P.wood)
    ]
  },
  table: {
    label: "Picnic table", grow: 0.9, density: 0.5, flammable: true, floats: true,
    parts: [
      box(1.8, 0.08, 0.8, 0, 0.75, 0, P.woodLight),
      box(1.8, 0.07, 0.3, 0, 0.44, 0.7, P.wood),
      box(1.8, 0.07, 0.3, 0, 0.44, -0.7, P.wood),
      box(0.1, 0.72, 1.5, -0.65, 0.36, 0, P.woodDark),
      box(0.1, 0.72, 1.5, 0.65, 0.36, 0, P.woodDark)
    ]
  },
  kayak: {
    label: "Kayak", grow: 0.9, density: 0.25, floats: true,
    parts: [
      box(2.2, 0.32, 0.7, 0, 0.16, 0, P.red),
      box(0.7, 0.26, 0.46, 1.4, 0.15, 0, P.red),
      box(0.7, 0.26, 0.46, -1.4, 0.15, 0, P.red),
      box(0.8, 0.05, 0.44, 0, 0.33, 0, P.black, { nc: true })
    ]
  },
  sign: {
    label: "Resort sign", grow: 0.8, density: 0.5, anchored: true, flammable: true,
    parts: [
      box(0.14, 1.9, 0.14, -1.1, 0.95, 0, P.woodDark),
      box(0.14, 1.9, 0.14, 1.1, 0.95, 0, P.woodDark),
      box(2.7, 0.9, 0.1, 0, 1.6, 0, P.cream),
      box(2.3, 0.12, 0.12, 0, 1.75, 0.02, P.red, { nc: true }),
      box(1.6, 0.1, 0.12, 0, 1.45, 0.02, P.navy, { nc: true })
    ]
  },
  pine: {
    label: "Pine", grow: 1.6, density: 0.4, anchored: true, flammable: true, burn: 5,
    parts: [
      cyl(0.18, 1.4, 0, 0.7, 0, P.woodDark, { seg: 6 }),
      cone(1.2, 1.7, 0, 1.75, 0, P.leafDark, { seg: 7 }),
      cone(0.95, 1.5, 0, 2.75, 0, P.leaf, { seg: 7, nc: true }),
      cone(0.65, 1.3, 0, 3.65, 0, P.leafDark, { seg: 7, nc: true })
    ]
  },
  rocket: {
    label: "GSP rocket", grow: 1.5, density: 0.5, anchored: true, bigRocket: true,
    parts: [
      cyl(0.36, 2.6, 0, 1.75, 0, P.gsp, { seg: 12 }),
      cone(0.36, 1.0, 0, 3.55, 0, P.white, { seg: 12 }),
      box(0.08, 0.9, 1.5, 0, 0.9, 0, P.white),
      box(1.5, 0.9, 0.08, 0, 0.9, 0, P.white),
      cyl(0.24, 0.45, 0, 0.3, 0, P.metalDark, { rTop: 0.3, seg: 10, nc: true })
    ]
  },
  car: {
    label: "Maluch", grow: 3.0, density: 0.6,
    parts: [
      box(3.0, 0.7, 1.4, 0, 0.6, 0, P.orange),
      box(1.7, 0.6, 1.26, -0.15, 1.22, 0, P.cream),
      box(1.5, 0.42, 1.3, -0.15, 1.2, 0, P.navy, { nc: true }),
      cyl(0.32, 1.5, 0.95, 0.32, 0, P.black, { rot: [HALF_PI, 0, 0], seg: 10 }),
      cyl(0.32, 1.5, -0.95, 0.32, 0, P.black, { rot: [HALF_PI, 0, 0], seg: 10 })
    ]
  },
  cabin: {
    label: "Cabin no. 7", grow: 8, density: 0.35, anchored: true,
    parts: [
      box(4.0, 2.3, 4.4, 0, 1.15, 0, P.cream),
      box(3.0, 0.2, 4.8, -1.15, 2.85, 0, P.coral, { rot: [0, 0, 0.62] }),
      box(3.0, 0.2, 4.8, 1.15, 2.85, 0, P.coral, { rot: [0, 0, -0.62] }),
      box(0.9, 1.7, 0.1, -0.7, 0.85, 2.22, P.wood, { nc: true }),
      box(1.0, 0.9, 0.1, 0.9, 1.35, 2.22, P.blue, { nc: true }),
      box(4.2, 0.18, 1.2, 0, 0.09, 2.7, P.woodDark)
    ]
  }
};

export const PROP_ORDER = [
  "tuft", "flower", "pebble", "mushroom", "apple", "duck", "bucket", "ball", "firework", "log", "crate",
  "campfire", "bench", "deckchair", "barrel", "grill", "parasol", "bush", "fence", "table", "kayak",
  "sign", "pine", "rocket", "car", "cabin"
];

export function eulerToQuat(rx, ry, rz) {
  const c1 = Math.cos(rx / 2), c2 = Math.cos(ry / 2), c3 = Math.cos(rz / 2);
  const s1 = Math.sin(rx / 2), s2 = Math.sin(ry / 2), s3 = Math.sin(rz / 2);
  return {
    x: s1 * c2 * c3 + c1 * s2 * s3,
    y: c1 * s2 * c3 - s1 * c2 * s3,
    z: c1 * c2 * s3 + s1 * s2 * c3,
    w: c1 * c2 * c3 - s1 * s2 * s3
  };
}

function partReach(p) {
  const s = p.size;
  if (p.shape === "box") return Math.hypot(s[0], s[1], s[2]) / 2;
  if (p.shape === "ball") return s[0];
  if (p.shape === "cyl") return Math.hypot(Math.max(s[0], s[2]), s[1] / 2);
  return Math.hypot(s[0], s[1] / 2);
}

for (const key of Object.keys(PROPS)) {
  const def = PROPS[key];
  def.type = key;
  let flat = 0;
  let top = 0;
  let base = 0;
  for (const p of def.parts) {
    if (p.nc) continue;
    const reach = partReach(p);
    flat = Math.max(flat, Math.hypot(p.pos[0], p.pos[2]) + reach);
    top = Math.max(top, p.pos[1] + reach);
    const s = p.size;
    const halfH = p.shape === "ball" ? s[0] : s[1] / 2;
    const footprint = p.shape === "box" ? Math.hypot(s[0], s[2]) / 2 : Math.max(s[0], p.shape === "cyl" ? s[2] : 0);
    if (p.pos[1] - halfH < 0.25) base = Math.max(base, Math.hypot(p.pos[0], p.pos[2]) + footprint);
  }
  def.radius = flat;
  def.height = top;
  def.base = base || flat;
}

export const MAX_PROP_RADIUS = Math.max(...Object.values(PROPS).map((d) => d.radius));
