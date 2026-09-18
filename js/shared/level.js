// Lab baseplate layout: arena bounds, pond, ground decals and a seeded prop scatter around hand-placed set pieces.

import { PROPS } from "./props.js";

export const ARENA = { hx: 14, hz: 9 };

export const POND = { x: -8.6, z: 4.6, rx: 4.1, rz: 3.0 };

export const SPAWNS = [[-1.5, 6.6], [1.5, 6.6], [-4, 7.2], [4, 7.2]];

export const DECALS = [
  { kind: "path", pts: [[14, 2.2], [6, 2.6], [2, 0.2], [2.4, -5.2], [6.2, -6.2], [6.4, -4.4], [4, -4], [3.9, -0.4], [6.6, 4.2], [14, 4.2]], color: "#f6c453" },
  { kind: "blob", x: 0.4, z: 1.2, r: 2.6, color: "#e7a63c", seed: 3 },
  { kind: "blob", x: -11, z: -5.2, r: 2.0, color: "#c9cbdc", seed: 5 },
  { kind: "blob", x: 5, z: 4, r: 3.0, color: "#d3e655", seed: 8 },
  { kind: "blob", x: -4, z: -3, r: 3.6, color: "#d3e655", seed: 11 },
  { kind: "blob", x: 9, z: -6, r: 3.4, color: "#9fca34", seed: 14 },
  { kind: "blob", x: -9, z: -1.5, r: 3.2, color: "#9fca34", seed: 17 },
  { kind: "blob", x: 1, z: 6.4, r: 2.8, color: "#cfe24f", seed: 19 },
  { kind: "blob", x: 11.5, z: 6.5, r: 2.4, color: "#9fca34", seed: 23 }
];

export function inPond(x, z, pad = 0) {
  const dx = (x - POND.x) / (POND.rx + pad);
  const dz = (z - POND.z) / (POND.rz + pad);
  return dx * dx + dz * dz < 1;
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIXED = [
  ["ks", 5.4, -0.4, 0.2], ["jurek", -8.6, -2.6, 0.5], ["dropsik", -7.6, -2.2, 0.9], ["rys", -1.9, 3.6, 0.4],
  ["cabin", 8.6, -4.6, 0],
  ["sign", 1.4, -7.2, 0],
  ["rocket", -11, -5.2, 0.4],
  ["firework", -9.2, -4.2, 0], ["firework", -9.0, -5.4, 0],
  ["firework", -12.4, -3.6, 0],
  ["campfire", 0.4, 1.2, 0],
  ["bench", 0.4, -0.7, 0], ["bench", -1.5, 1.4, 1.35], 
  ["log", 1.6, 2.9, 0.5], ["log", -0.7, 3.0, -0.4],
  ["deckchair", -6.2, 0.4, 0.3], ["deckchair", -8.2, 0.2, 0],
  ["deckchair", -3.4, 3.0, 1.2],
  ["parasol", -7.2, 0.1, 0], ["parasol", -3.0, 4.2, 0],
  ["kayak", -11.6, 7.6, 0.25], ["kayak", -6.4, 8.1, -0.1],
  ["table", 5.2, 4.2, 0.2], ["grill", 7.4, 5.6, 0],
  ["crate", 3.4, 5.6, 0.3], ["crate", 3.5, 6.3, 0.1], ["crate", 3.45, 5.95, 0.2, 0.6],
  ["crate", 6.6, 2.0, 0.6], 
  ["barrel", 8.8, 5.2, 0], ["barrel", 5.0, -6.6, 0],
  ["car", 10.8, 3.2, 0.12],
  ["bucket", -5.4, 2.6, 0], ["bucket", 7.9, 4.4, 0],
  ["bush", 4.6, -2.2, 0], ["bush", 12.6, -1.2, 0],
  ["bush", -13, -1, 0], ["bush", 6.2, 7.8, 0],
  ["pine", -13, -7.6, 0], ["pine", -7.6, -7.8, 0], ["pine", 4.6, -8, 0],
  ["pine", 12.6, -7.8, 0], ["pine", 13, -3.6, 0], ["pine", -13.2, -3, 0],
  ["duck", -9.4, 4.2, 0.4], ["duck", -7.4, 5.4, 2.2], ["duck", -8.2, 3.4, 4],
  ["ball", -5.6, 6.6, 0], ["ball", -2.2, 7.4, 0],
];

for (let i = 0; i < 8; i++) FIXED.push(["fence", -11.6 + i * 2.05, -8.55, 0]);

const SCATTER = [["tuft", 14], ["flower", 9], ["pebble", 7], ["mushroom", 5], ["apple", 6]];

export function buildLevel(seed = 7) {
  const rnd = mulberry(seed);
  const items = FIXED.map(([type, x, z, rot, y]) => ({ type, x, z, rot: rot || 0, y: y || 0 }));
  const taken = items.map((it) => ({ x: it.x, z: it.z, r: PROPS[it.type].radius * 0.8 + 0.25 }));
  for (const [sx, sz] of SPAWNS) taken.push({ x: sx, z: sz, r: 1.1 });
  for (const [type, count] of SCATTER) {
    let placed = 0;
    let guard = 0;
    while (placed < count && guard++ < 4000) {
      const x = (rnd() * 2 - 1) * (ARENA.hx - 0.8);
      const z = (rnd() * 2 - 1) * (ARENA.hz - 0.8);
      if (inPond(x, z, 0.3)) continue;
      if (taken.some((t) => Math.hypot(t.x - x, t.z - z) < t.r + 0.2)) continue;
      taken.push({ x, z, r: 0.18 });
      items.push({ type, x, z, rot: rnd() * Math.PI * 2, y: 0 });
      placed++;
    }
  }
  return items;
}
