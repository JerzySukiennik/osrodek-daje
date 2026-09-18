// Hole rig: a teleported fixed body of overlapping cuboids that stands in for the ground around one hole, leaving a polygonal void.

export const GROUP = { GROUND: 1, FAR: 2, NEAR: 4, PATCH: 8, WALL: 16 };

export const pack = (member, filter) => ((member << 16) | filter) >>> 0;

export const GROUPS = {
  ground: pack(GROUP.GROUND, GROUP.FAR),
  patch: pack(GROUP.PATCH, GROUP.NEAR),
  wall: pack(GROUP.WALL, GROUP.FAR | GROUP.NEAR),
  far: pack(GROUP.FAR, GROUP.GROUND | GROUP.FAR | GROUP.NEAR | GROUP.WALL),
  near: pack(GROUP.NEAR, GROUP.PATCH | GROUP.FAR | GROUP.NEAR | GROUP.WALL),
  ghost: pack(GROUP.NEAR, 0)
};

const COUNTS = [40, 32, 24, 18, 14, 12, 10, 8, 8, 8];
const DEPTH = 3;

function growthFor(t0, total, n) {
  let lo = 1.0001, hi = 6;
  for (let i = 0; i < 40; i++) {
    const g = (lo + hi) / 2;
    const sum = t0 * (Math.pow(g, n) - 1) / (g - 1);
    if (sum < total) lo = g; else hi = g;
  }
  return hi;
}

export function createHoleRig(RAPIER, world, margin, friction) {
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  const pieces = [];
  COUNTS.forEach((n, ring) => {
    for (let k = 0; k < n; k++) {
      const desc = RAPIER.ColliderDesc.cuboid(0.5, DEPTH / 2, 0.5)
        .setCollisionGroups(GROUPS.patch)
        .setFriction(friction)
        .setRestitution(0)
        .setEnabled(false);
      const col = world.createCollider(desc, body);
      const ang = ((k + (ring % 2) * 0.5) / n) * Math.PI * 2;
      pieces.push({ col, ring, n, ang, cos: Math.cos(ang), sin: Math.sin(ang), lx: 0, lz: 0, hr: 0, hw: 0, reach: 0, enabled: false });
    }
  });
  let laidR = -1;
  let lastX = NaN;
  let lastZ = NaN;

  function layout(r) {
    laidR = r;
    const t0 = Math.max(0.07, r * 0.1);
    const g = growthFor(t0, margin, COUNTS.length);
    const edges = [r];
    for (let i = 0; i < COUNTS.length; i++) edges.push(edges[i] + t0 * Math.pow(g, i));
    for (const p of pieces) {
      let rin = edges[p.ring];
      const rout = edges[p.ring + 1];
      if (p.ring > 0) rin *= Math.cos(Math.PI / p.n) * 0.97;
      p.hr = (rout - rin) / 2;
      p.hw = rout * Math.tan(Math.PI / p.n) * 1.02;
      const cd = rin + p.hr;
      p.lx = p.cos * cd;
      p.lz = p.sin * cd;
      p.reach = Math.hypot(p.hr, p.hw);
      p.col.setHalfExtents({ x: p.hr, y: DEPTH / 2, z: p.hw });
      p.col.setTranslationWrtParent({ x: p.lx, y: -DEPTH / 2, z: p.lz });
      p.col.setRotationWrtParent({ x: 0, y: Math.sin(-p.ang / 2), z: 0, w: Math.cos(-p.ang / 2) });
    }
  }

  function rectHitsCircle(p, dx, dz, radius) {
    const u = dx * p.cos + dz * p.sin;
    const v = -dx * p.sin + dz * p.cos;
    const qu = Math.max(0, Math.abs(u) - p.hr);
    const qv = Math.max(0, Math.abs(v) - p.hw);
    return qu * qu + qv * qv < radius * radius;
  }

  return {
    body,
    radius() { return laidR; },
    update(x, z, r, others, near) {
      if (laidR < 0 || Math.abs(r - laidR) > laidR * 0.012) layout(r);
      if (x !== lastX || z !== lastZ) {
        body.setTranslation({ x, y: 0, z }, false);
        lastX = x;
        lastZ = z;
      }
      for (const p of pieces) {
        const wx = x + p.lx;
        const wz = z + p.lz;
        let on = false;
        for (const n of near) {
          if (rectHitsCircle(p, n.x - wx, n.z - wz, n.rad)) { on = true; break; }
        }
        if (on) {
          for (const o of others) {
            if (rectHitsCircle(p, o.x - wx, o.z - wz, o.r * 0.985)) { on = false; break; }
          }
        }
        if (on !== p.enabled) {
          p.enabled = on;
          p.col.setEnabled(on);
        }
      }
    },
    dispose() {
      world.removeRigidBody(body);
    }
  };
}
