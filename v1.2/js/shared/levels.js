// Hand-built puzzle levels: layout, goal and ten stars each. Star rules read the run stats that
// js/display/levelrun.js keeps, so nothing here needs three.js, Rapier or the DOM.

import { PROPS } from "./props.js";

const GRASS = { grass: "#c6e344", grassEdge: "#9dc734", outside: "#77a83a" };
const SAND = { grass: "#ffdf8e", grassEdge: "#f0b93f", outside: "#8fbb3c" };
const EVENING = { grass: "#bcd94a", grassEdge: "#9dc734", outside: "#6f9a3a", pond: "#1c8df0", pondLight: "#55bcff" };

const blob = (x, z, r, color, seed) => ({ kind: "blob", x, z, r, color, seed });
const ring = (x, z, r, color, seed) => ({ kind: "ring", x, z, r, color, seed });
const path = (pts, color, over) => ({ kind: "path", pts, color, over });

function rnd(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function scatter(seed, count, types, hx, hz, avoid = [], spawns = []) {
  const r = rnd(seed);
  avoid = avoid.concat(spawns.map(([x, z]) => [x, z, 2.2]));
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < 4000) {
    const x = (r() * 2 - 1) * hx;
    const z = (r() * 2 - 1) * hz;
    if (avoid.some((s) => Math.hypot(s[0] - x, s[1] - z) < s[2])) continue;
    out.push({ type: types[(r() * types.length) | 0], x, z, rot: r() * 6.28 });
  }
  return out;
}

// --- star rules ---------------------------------------------------------

const finish = { id: "finish", label: "Finish the level", test: (s) => s.done };
const clean = { id: "clean", label: "Swallow everything", test: (s) => s.remaining === 0 };
const collected = (n) => ({ id: "star" + n, label: "Hidden star " + n, test: (s) => s.starsFound >= n, hidden: true });
const under = (sec) => ({ id: "fast", label: `Finish under ${sec}s`, test: (s) => s.done && s.time <= sec });
const combo = (n) => ({ id: "combo", label: `Swallow ${n} things in 4 s`, test: (s) => s.maxCombo >= n });
const usedFire = { id: "fire", label: "Carry fire in your hole", test: (s) => s.usedFire };
const usedWater = { id: "water", label: "Use the fountain", test: (s) => s.usedFountain };
const spatOut = { id: "spit", label: "Spit something back out", test: (s) => s.spat > 0 };
const ate = (type, label) => ({ id: "ate-" + type, label, test: (s) => (s.types[type] || 0) > 0 });
const spared = (type, label) => ({ id: "spare-" + type, label, test: (s) => s.done && !(s.types[type] > 0) });
const burned = (n) => ({ id: "burned", label: `Burn ${n} things`, test: (s) => s.burned >= n });

// --- level 1 ------------------------------------------------------------

const picnic = {
  id: "picnic", kind: "level", title: "1 · Piknik", number: 1,
  blurb: "Everything on the lawn has to go. Start with the crumbs, end with the table.",
  arena: { hx: 12, hz: 8 }, spawns: [[-1.5, 6.4], [1.5, 6.4], [-4, 6.8], [4, 6.8]], colors: GRASS,
  goal: { type: "clear" }, par: 110,
  decals: [blob(0, -0.5, 5.2, "#e7a63c", 3), path([[-12, 4.4], [12, 4.4], [12, 2.8], [-12, 2.8]], "#f6c453"), blob(-8, -4, 3, "#d3e655", 7), blob(8, -4, 3, "#d3e655", 11)],
  items: [
    { type: "table", x: 0, z: -0.5 },
    { type: "bench", x: -3.4, z: 1.4, rot: 0.2 }, { type: "bench", x: 3.4, z: 1.4, rot: -0.2 },
    { type: "grill", x: -5.6, z: -2.4 }, { type: "barrel", x: 6.4, z: -2.2 },
    { type: "crate", x: 5.2, z: 0.6 }, { type: "crate", x: 5.25, z: 0.65, y: 0.65 },
    { type: "bucket", x: -6.6, z: 1.2 }, { type: "bucket", x: 7.2, z: 2.2 },
    { type: "ball", x: -2.2, z: 4.2 }, { type: "ball", x: 2.6, z: 5 },
    { type: "duck", x: -8.2, z: 3.4 }, { type: "apple", x: 0.4, z: -0.3, y: 0.95 }, { type: "apple", x: -0.6, z: -0.8, y: 0.95 },
    { type: "log", x: -9.4, z: -1.4, rot: 0.3 }, { type: "log", x: 9.4, z: -1.2, rot: -0.4 },
    { type: "deckchair", x: -10, z: 3.4, rot: 0.5 }, { type: "deckchair", x: 10, z: 3.6, rot: -0.5 },
    { type: "parasol", x: -7.8, z: -0.4 }, { type: "parasol", x: 8.4, z: 0.4 },
    { type: "bush", x: -11, z: -5.4 }, { type: "bush", x: 11, z: -5.4 }, { type: "bush", x: 0, z: -6.4 },
    { type: "pine", x: -11.4, z: -7 }, { type: "pine", x: -5.4, z: -7.2 }, { type: "pine", x: 5.4, z: -7.2 }, { type: "pine", x: 11.4, z: -7 },
    { type: "star", x: -9.8, z: -5.6, tag: "star:1" },
    { type: "star", x: 9.9, z: 5.6, tag: "star:2" },
    { type: "star", x: 0.1, z: -4.9, tag: "star:3" },
    ...scatter(101, 26, ["tuft", "flower", "pebble", "mushroom", "apple"], 11.2, 7.2, [[0, -0.5, 2.4], [0, 6.6, 2]], [[-1.5, 6.4], [1.5, 6.4], [-4, 6.8], [4, 6.8]])
  ],
  stars: [finish, clean, collected(1), collected(2), collected(3), under(110), combo(5), spatOut, ate("table", "Swallow the picnic table"), ate("grill", "Swallow the grill")]
};

// --- level 2 ------------------------------------------------------------

const bonfire = {
  id: "bonfire", kind: "level", title: "2 · Ognisko", number: 2,
  blurb: "Swallow the campfire, carry the flame to the woodpile — but the cabin is not yours to burn.",
  arena: { hx: 13, hz: 8.5 }, spawns: [[-1.5, 6.8], [1.5, 6.8], [-4.2, 7], [4.2, 7]], colors: SAND,
  goal: { type: "clear" }, par: 150,
  decals: [ring(-3, -1, 4.4, "#e7a63c", 5), blob(6, 1, 4.6, "#d3e655", 9), path([[-13, 5], [13, 5], [13, 3.4], [-13, 3.4]], "#f6c453"), blob(9, -5, 3, "#c6e344", 13)],
  items: [
    { type: "campfire", x: -3, z: -1 },
    { type: "log", x: -5.2, z: 0.6, rot: 0.4 }, { type: "log", x: -4.8, z: 1.4, rot: 0.1 }, { type: "log", x: -5.6, z: 2.1, rot: -0.3 },
    { type: "log", x: -1.2, z: 0.9, rot: 1.2 }, { type: "crate", x: -0.4, z: -2.6 }, { type: "crate", x: -6.4, z: -2.8 },
    { type: "firework", x: 2.2, z: -3.4 }, { type: "firework", x: 2.9, z: -3.9 }, { type: "firework", x: 2.5, z: -4.6 },
    { type: "rocket", x: 6.4, z: -5.4 },
    { type: "cabin", x: 9.4, z: -3.6 },
    { type: "bench", x: -0.6, z: 1.9, rot: 0 }, { type: "bench", x: -5.6, z: -3.6, rot: 0.6 },
    { type: "barrel", x: 4.4, z: 1.2 }, { type: "bucket", x: 5.6, z: 2.4 }, { type: "bucket", x: -8.6, z: 1.6 },
    { type: "grill", x: 3.2, z: 2.6 }, { type: "table", x: 7.4, z: 2.4, rot: 0.2 },
    { type: "deckchair", x: -9.6, z: 3.6, rot: 0.4 }, { type: "parasol", x: -10.4, z: -0.6 },
    { type: "fence", x: -11.4, z: -6.4 }, { type: "fence", x: -9.3, z: -6.4 }, { type: "fence", x: -7.2, z: -6.4 },
    { type: "bush", x: 12, z: 4 }, { type: "bush", x: -12, z: 5.4 }, { type: "bush", x: 0.4, z: -6.6 },
    { type: "pine", x: -12.4, z: -7.4 }, { type: "pine", x: -3.4, z: -7.6 }, { type: "pine", x: 3.4, z: -7.6 }, { type: "pine", x: 12.4, z: -7.4 },
    { type: "car", x: 11, z: 6 },
    { type: "star", x: -11.6, z: 1.4, tag: "star:1" },
    { type: "star", x: 11.8, z: -7.1, tag: "star:2" },
    { type: "star", x: 0.2, z: 7.6, tag: "star:3" },
    ...scatter(202, 22, ["tuft", "flower", "pebble", "mushroom"], 12.2, 7.6, [[-3, -1, 2.6], [9.4, -3.6, 5.4], [0, 6.8, 2]], [[-1.5, 6.8], [1.5, 6.8], [-4.2, 7], [4.2, 7]])
  ],
  stars: [finish, clean, collected(1), collected(2), collected(3), under(150), usedFire, burned(4), ate("rocket", "Launch the GSP rocket"), spared("cabin", "Leave cabin no. 7 standing")]
};

// --- level 3 ------------------------------------------------------------

const pier = {
  id: "pier", kind: "level", title: "3 · Pomost", number: 3,
  blurb: "Half the resort floats. Fill up with water, spit things across, and clear the shore.",
  arena: { hx: 13, hz: 9 }, spawns: [[-5.4, 7.4], [-1.6, 7.6], [2.4, 7.6], [6.4, 7.6]], colors: EVENING,
  pond: { x: -5.4, z: -2.6, rx: 5.4, rz: 3.4 }, goal: { type: "clear" }, par: 170,
  decals: [path([[-6.9, 6.2], [-3.9, 6.2], [-3.9, -6.4], [-6.9, -6.4]], "#c8742b", true), path([[-7.6, 4.6], [-3.2, 4.6], [-3.2, 3.2], [-7.6, 3.2]], "#8f4a1c", true), blob(7, 1, 4.6, "#d3e655", 17), path([[-13, 5.6], [13, 5.6], [13, 4], [-13, 4]], "#f6c453"), blob(9, -5, 3.4, "#c6e344", 23)],
  items: [
    { type: "kayak", x: -5.6, z: -2.6, rot: 0.2 }, { type: "kayak", x: -10.4, z: 1.2, rot: -0.4 },
    { type: "duck", x: -5.0, z: -1.2 }, { type: "duck", x: -6.4, z: -3.6 }, { type: "duck", x: -3.8, z: -3.4 },
    { type: "ball", x: -1.2, z: -6.6 }, { type: "ball", x: 2.6, z: -6.2 },
    { type: "barrel", x: 1.4, z: -1.2 }, { type: "crate", x: 1.6, z: 1.4 }, { type: "crate", x: -10.6, z: -6.2 },
    { type: "campfire", x: 6.4, z: -1.4 },
    { type: "log", x: 4.6, z: -3.2, rot: 0.5 }, { type: "log", x: 5.4, z: -3.9, rot: 0.2 },
    { type: "grill", x: 8.4, z: -2.6 }, { type: "table", x: 7.8, z: 1.6, rot: 0.3 },
    { type: "bench", x: 4.4, z: 2.4, rot: 0 }, { type: "bucket", x: 10.4, z: 0.6 }, { type: "bucket", x: 3.2, z: 5.2 },
    { type: "deckchair", x: -10.2, z: 5.2, rot: 0.4 }, { type: "deckchair", x: -1.4, z: 5.2, rot: 0.2 },
    { type: "parasol", x: -11, z: 2.4 }, { type: "parasol", x: 11.2, z: 2.6 },
    { type: "sign", x: -10.6, z: 7.6 },
    { type: "bush", x: 12.2, z: -6.4 }, { type: "bush", x: -12.2, z: -6.6 }, { type: "bush", x: 9.6, z: 5.4 },
    { type: "pine", x: -12.6, z: -8 }, { type: "pine", x: -5.6, z: -8.2 }, { type: "pine", x: 5.6, z: -8.2 }, { type: "pine", x: 12.6, z: -8 },
    { type: "star", x: -11.8, z: -2, tag: "star:1" },
    { type: "star", x: 11.9, z: -7.8, tag: "star:2" },
    { type: "star", x: -5.4, z: -7.6, tag: "star:3" },
    ...scatter(303, 20, ["tuft", "flower", "pebble", "mushroom"], 12.2, 8.2, [[-3.5, -2, 8], [0, 7.4, 2.2]], [[-5.4, 7.4], [-1.6, 7.6], [2.4, 7.6], [6.4, 7.6]])
  ],
  stars: [finish, clean, collected(1), collected(2), collected(3), under(170), usedWater, spatOut, combo(6), ate("kayak", "Swallow a kayak")]
};

export const LEVELS = [picnic, bonfire, pier];

export const STARS_PER_LEVEL = LEVELS[0].stars.length;

export function levelById(id) {
  return LEVELS.find((l) => l.id === id) || LEVELS[0];
}

export function swallowableCount(level) {
  return level.items.filter((it) => {
    const def = PROPS[it.type];
    return def && !def.anchored && !def.star;
  }).length;
}
