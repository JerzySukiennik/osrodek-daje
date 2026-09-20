// Menu, lobby and shop as playable dioramas. Three layout variants (A/B/C) of each, all Donut County flavoured.
// A tagged prop is a button: swallow it and its action fires. Nothing here knows about three.js or the DOM.

import { PROPS } from "./props.js";

const GRASS = { grass: "#c6e344", grassEdge: "#9dc734", outside: "#77a83a" };
const SAND = { grass: "#ffdf8e", grassEdge: "#f0b93f", outside: "#8fbb3c" };
const DUSK = { grass: "#b6d15a", grassEdge: "#96b53f", outside: "#6f9a3a", pond: "#2a6fd0", pondLight: "#4a97e8" };

const ring = (x, z, r, color, seed) => ({ kind: "ring", x, z, r, color, seed });
const blob = (x, z, r, color, seed) => ({ kind: "blob", x, z, r, color, seed });
const path = (pts, color, over) => ({ kind: "path", pts, color, over });

function scatter(seed, count, types, hx, hz, avoid = []) {
  let a = seed >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < 3000) {
    const x = (rnd() * 2 - 1) * hx;
    const z = (rnd() * 2 - 1) * hz;
    if (avoid.some((s) => Math.hypot(s[0] - x, s[1] - z) < s[2])) continue;
    out.push({ type: types[(rnd() * types.length) | 0], x, z, rot: rnd() * 6.28 });
  }
  return out;
}

// --- MENU ---------------------------------------------------------------

const MENU_BUTTONS = [
  { tag: "menu:play", type: "sign", label: "PLAY", sub: "swallow to start" },
  { tag: "menu:shop", type: "crate", label: "SHOP", sub: "spend your stars" },
  { tag: "menu:levels", type: "barrel", label: "LEVELS", sub: "pick a diorama" }
];

const menuA = {
  id: "menu-a", kind: "menu", variant: "A", title: "Menu A — Aleja",
  blurb: "Options stand along the resort's main path. You drive straight down the middle and pick one.",
  arena: { hx: 13, hz: 5.5 }, spawns: [[0, 4.2], [-2.5, 4.2], [2.5, 4.2], [0, 3.2]], colors: GRASS,
  decals: [path([[-13, 0.6], [13, 0.6], [13, -1.4], [-13, -1.4]], "#f6c453"), blob(-8, 3, 3, "#d3e655", 3), blob(9, -3, 3.4, "#d3e655", 9)],
  items: [
    { type: "sign", x: -6.8, z: -0.4, tag: "menu:play" },
    { type: "crate", x: 0, z: -0.8, tag: "menu:shop" },
    { type: "barrel", x: 6.8, z: -0.4, tag: "menu:levels" },
    { type: "parasol", x: -10.5, z: -2.6 }, { type: "parasol", x: 10.5, z: 2.6 },
    { type: "pine", x: -12, z: -4.2 }, { type: "pine", x: 12, z: -4.4 }, { type: "pine", x: -3, z: -4.6 }, { type: "pine", x: 3.4, z: -4.6 },
    { type: "deckchair", x: -9.4, z: -2.2, rot: 0.4 }, { type: "deckchair", x: 9.6, z: 3, rot: -2.4 },
    { type: "ball", x: -4, z: 3 }, { type: "duck", x: 4.6, z: 3.4 },
    ...scatter(11, 26, ["tuft", "flower", "pebble", "mushroom"], 12.4, 5, [[-6.2, -0.4, 2.6], [0, -0.4, 2.4], [6.2, -0.4, 2.4]])
  ]
};

const menuB = {
  id: "menu-b", kind: "menu", variant: "B", title: "Menu B — Ognisko",
  blurb: "A campfire circle. The three options sit around the fire, so any hole is the same distance from each.",
  arena: { hx: 9, hz: 8 }, spawns: [[0, 6.4], [-2.4, 6.4], [2.4, 6.4], [0, 5.2]], colors: GRASS,
  decals: [ring(0, 0, 5.2, "#e7a63c", 4), ring(0, 0, 3.0, "#f6c453", 7), blob(-7, -5, 2.6, "#d3e655", 5), blob(7, 5, 2.8, "#d3e655", 12)],
  items: [
    { type: "campfire", x: 0, z: 0 },
    { type: "sign", x: 0, z: -3.6, tag: "menu:play" },
    { type: "crate", x: -3.4, z: 2.1, tag: "menu:shop" },
    { type: "barrel", x: 3.4, z: 2.1, tag: "menu:levels" },
    { type: "log", x: -2.9, z: -1.7, rot: 0.6 }, { type: "log", x: 2.9, z: -1.7, rot: -0.6 }, { type: "log", x: 0, z: 3.3, rot: 0 },
    { type: "bench", x: -4.6, z: -0.6, rot: 1.2 }, { type: "bench", x: 4.6, z: -0.6, rot: -1.2 },
    { type: "pine", x: -8, z: -6.6 }, { type: "pine", x: 8, z: -6.6 }, { type: "pine", x: -8.2, z: 6.4 }, { type: "pine", x: 8.2, z: 6.4 },
    { type: "bush", x: -6.4, z: 3.6 }, { type: "bush", x: 6.4, z: 3.6 }, { type: "grill", x: 6.2, z: -3.6 },
    ...scatter(23, 22, ["tuft", "flower", "mushroom", "apple"], 8.4, 7.4, [[0, 0, 3.4], [0, -3.6, 2.4], [-3.4, 2.1, 2.2], [3.4, 2.1, 2.2]])
  ]
};

const menuC = {
  id: "menu-c", kind: "menu", variant: "C", title: "Menu C — Pomost",
  blurb: "A pier over the pond. Options sit at the far end, so you cross water (and turn blue) on the way.",
  arena: { hx: 10, hz: 7 }, spawns: [[0, 5.6], [-2.2, 5.6], [2.2, 5.6], [0, 4.6]], colors: DUSK,
  pond: { x: 0, z: -1.2, rx: 8.6, rz: 4.2 },
  decals: [path([[-2.4, 6.6], [2.4, 6.6], [2.4, -5.6], [-2.4, -5.6]], "#c8742b", true), path([[-2.9, 5.2], [2.9, 5.2], [2.9, 3.6], [-2.9, 3.6]], "#8f4a1c", true), blob(-7.5, 5, 2.6, "#d3e655", 8), blob(7.5, 5, 2.6, "#d3e655", 15)],
  items: [
    { type: "sign", x: 0, z: -4.4, tag: "menu:play" },
    { type: "crate", x: -1.5, z: -1.2, tag: "menu:shop" },
    { type: "barrel", x: 1.6, z: 1.6, tag: "menu:levels" },
    { type: "kayak", x: -5.6, z: -1.4, rot: 0.2 }, { type: "kayak", x: 5.6, z: -1, rot: -0.3 },
    { type: "duck", x: -3.8, z: 0.6 }, { type: "duck", x: 4.2, z: -2.6 }, { type: "duck", x: -4.6, z: -3.2 }, { type: "duck", x: 3.4, z: 1.2 },
    { type: "ball", x: -6.8, z: 2.4 }, { type: "parasol", x: -7.4, z: 5 }, { type: "parasol", x: 7.4, z: 5 },
    { type: "deckchair", x: -5.6, z: 5.2, rot: 0.2 }, { type: "deckchair", x: 5.6, z: 5.2, rot: -0.2 },
    { type: "pine", x: -9, z: -5.6 }, { type: "pine", x: 9, z: -5.6 }, { type: "bush", x: -8.6, z: 2 }, { type: "bush", x: 8.6, z: 2 },
    ...scatter(31, 14, ["tuft", "flower", "pebble"], 9.4, 6.4, [[0, 0, 9.2]])
  ]
};

// --- LOBBY --------------------------------------------------------------

function lobbySlots(layout) {
  return layout.map((p, i) => ({ type: p.type || "bucket", x: p.x, z: p.z, rot: p.rot || 0, tag: "lobby:slot" + i }));
}

const lobbyA = {
  id: "lobby-a", kind: "lobby", variant: "A", title: "Lobby A — Cztery leżaki",
  blurb: "One deckchair per player, in a row. Your hole parks in front of a chair to claim the colour.",
  arena: { hx: 11, hz: 6 }, spawns: [[-4.5, 4.4], [-1.5, 4.4], [1.5, 4.4], [4.5, 4.4]], colors: SAND,
  decals: [path([[-11, 1.4], [11, 1.4], [11, -0.6], [-11, -0.6]], "#f0a441"), blob(0, -3.5, 5, "#c6e344", 6)],
  items: [
    ...lobbySlots([{ x: -4.5, z: 0.4, type: "deckchair" }, { x: -1.5, z: 0.4, type: "deckchair" }, { x: 1.5, z: 0.4, type: "deckchair" }, { x: 4.5, z: 0.4, type: "deckchair" }]),
    { type: "sign", x: 8.6, z: 0.2, tag: "lobby:start" },
    { type: "parasol", x: -7.4, z: 0.6 }, { type: "table", x: 7.6, z: -3.4, rot: 0.2 },
    { type: "pine", x: -10, z: -4.6 }, { type: "pine", x: 10, z: -4.6 }, { type: "bush", x: -8.8, z: -3 },
    { type: "ball", x: -6.2, z: 3.6 }, { type: "bucket", x: 6.4, z: 3.2 },
    ...scatter(41, 18, ["tuft", "flower", "pebble", "mushroom"], 10.4, 5.4, [[-4.5, 0.4, 1.8], [-1.5, 0.4, 1.8], [1.5, 0.4, 1.8], [4.5, 0.4, 1.8], [8.6, 0.2, 2.2]])
  ]
};

const lobbyB = {
  id: "lobby-b", kind: "lobby", variant: "B", title: "Lobby B — Stół",
  blurb: "Everyone gathers around the picnic table; slots sit on its four sides and START is the grill.",
  arena: { hx: 8, hz: 7 }, spawns: [[0, 5.6], [-2.4, 5.6], [2.4, 5.6], [0, 4.6]], colors: GRASS,
  decals: [blob(0, 0, 4.4, "#e7a63c", 2), blob(-6, 4, 2.4, "#d3e655", 17), blob(6, -4, 2.6, "#d3e655", 19)],
  items: [
    { type: "table", x: 0, z: 0 },
    ...lobbySlots([{ x: -2.7, z: -1.9, type: "bucket" }, { x: 2.7, z: -1.9, type: "bucket" }, { x: -2.7, z: 1.9, type: "bucket" }, { x: 2.7, z: 1.9, type: "bucket" }]),
    { type: "grill", x: 0, z: -4.4, tag: "lobby:start" },
    { type: "bench", x: -5.2, z: 0, rot: 1.57 }, { type: "bench", x: 5.2, z: 0, rot: 1.57 },
    { type: "parasol", x: -6.4, z: -3.4 }, { type: "pine", x: -7.4, z: 5.4 }, { type: "pine", x: 7.4, z: 5.4 },
    { type: "bush", x: 6.8, z: 3.4 }, { type: "apple", x: 0.6, z: 0.3, y: 0.9 }, { type: "apple", x: -0.5, z: -0.2, y: 0.9 },
    ...scatter(43, 16, ["tuft", "flower", "mushroom"], 7.4, 6.4, [[0, 0, 3.4], [0, -4.4, 2.2], [-2.7, -1.9, 1.2], [2.7, -1.9, 1.2], [-2.7, 1.9, 1.2], [2.7, 1.9, 1.2]])
  ]
};

const lobbyC = {
  id: "lobby-c", kind: "lobby", variant: "C", title: "Lobby C — Domki",
  blurb: "Four cabin doorsteps as slots, spread wide. More walking, but everyone gets their own corner.",
  arena: { hx: 12, hz: 7 }, spawns: [[0, 5.4], [-3, 5.4], [3, 5.4], [0, 4.4]], colors: GRASS,
  decals: [path([[-12, 2.6], [12, 2.6], [12, 1.2], [-12, 1.2]], "#f6c453"), blob(-6, -3, 3, "#d3e655", 21), blob(6, -3, 3, "#d3e655", 27)],
  items: [
    ...lobbySlots([{ x: -8.2, z: -1.2, type: "crate" }, { x: -2.8, z: -1.2, type: "crate" }, { x: 2.8, z: -1.2, type: "crate" }, { x: 8.2, z: -1.2, type: "crate" }]),
    { type: "cabin", x: -8.2, z: -4.6 }, { type: "cabin", x: 8.2, z: -4.6 },
    { type: "sign", x: 0, z: 4.2, tag: "lobby:start" },
    { type: "fence", x: -5.5, z: -6.2 }, { type: "fence", x: -3.4, z: -6.2 }, { type: "fence", x: 3.4, z: -6.2 }, { type: "fence", x: 5.5, z: -6.2 },
    { type: "bench", x: -5.6, z: 0.4, rot: 0 }, { type: "bench", x: 5.6, z: 0.4, rot: 0 },
    { type: "pine", x: -11.4, z: 5 }, { type: "pine", x: 11.4, z: 5 }, { type: "bush", x: 0, z: -2.4 },
    ...scatter(47, 20, ["tuft", "flower", "pebble"], 11.4, 6.4, [[-8.2, -3, 4.4], [8.2, -3, 4.4], [0, 4.2, 2.2]])
  ]
};

// --- SHOP ---------------------------------------------------------------

export const SHOP_ITEMS = [
  { id: "spit", name: "Katapulta", cost: 3, desc: "Spit things back out", type: "firework" },
  { id: "dash", name: "Zryw", cost: 5, desc: "Short burst of speed", type: "duck" },
  { id: "magnes", name: "Magnes", cost: 8, desc: "Pulls small things in", type: "bucket" },
  { id: "skin", name: "Obwódka", cost: 2, desc: "Cosmetic hole rim", type: "ball" }
];

const shopA = {
  id: "shop-a", kind: "shop", variant: "A", title: "Sklep A — Półka",
  blurb: "Goods on one long counter, price tags above. Swallow an item to buy it, swallow the sign to leave.",
  arena: { hx: 13, hz: 6.5 }, spawns: [[0, 5], [-3, 5], [3, 5], [0, 4]], colors: SAND,
  decals: [path([[-13, -0.2], [13, -0.2], [13, -2.6], [-13, -2.6]], "#c8742b"), blob(0, 3.6, 7, "#f6c453", 33)],
  items: [
    ...SHOP_ITEMS.map((it, i) => ({ type: it.type, x: -7.8 + i * 5.2, z: i % 2 ? -2.4 : -0.6, tag: "shop:" + it.id })),
    { type: "table", x: -7.8, z: -1.5, y: -0.72 }, { type: "table", x: 2.6, z: -1.5, y: -0.72 },
    { type: "sign", x: 0, z: 4.4, tag: "shop:exit" },
    { type: "parasol", x: -11.4, z: -1 }, { type: "parasol", x: 11.4, z: -1 },
    { type: "pine", x: -12.4, z: -5.4 }, { type: "pine", x: 12.4, z: -5.4 },
    { type: "barrel", x: -10.2, z: 3.4 }, { type: "crate", x: 9.6, z: 3.4 },
    ...scatter(51, 14, ["tuft", "flower", "pebble"], 12.4, 5.8, [[-7.8, -1.5, 2.6], [-2.6, -1.5, 2.6], [2.6, -1.5, 2.6], [7.8, -1.5, 2.6], [0, 4.4, 2.4]])
  ]
};

const shopB = {
  id: "shop-b", kind: "shop", variant: "B", title: "Sklep B — Krąg",
  blurb: "Items on crates in a circle around KS. Exit is behind you, so nothing blocks the view of the goods.",
  arena: { hx: 9, hz: 8 }, spawns: [[0, 6.6], [-2.4, 6.6], [2.4, 6.6], [0, 5.6]], colors: GRASS,
  decals: [ring(0, -0.6, 4.8, "#e7a63c", 6), blob(0, -0.6, 2.2, "#f6c453", 11)],
  items: [
    { type: "ks", x: 0, z: -0.6 },
    ...SHOP_ITEMS.map((it, i) => {
      const a = (i / SHOP_ITEMS.length) * Math.PI * 2 + Math.PI * 0.75;
      return { type: it.type, x: Math.cos(a) * 4.1, z: -0.6 + Math.sin(a) * 3.5, tag: "shop:" + it.id };
    }),
    { type: "sign", x: 0, z: 6.2, tag: "shop:exit" },
    { type: "parasol", x: -6.4, z: -3.8 }, { type: "parasol", x: 6.4, z: -3.8 },
    { type: "pine", x: -7.4, z: -6 }, { type: "pine", x: 7.4, z: -6 }, { type: "bush", x: -6.8, z: 3.4 }, { type: "bush", x: 6.8, z: 3.4 },
    ...scatter(53, 16, ["tuft", "flower", "mushroom"], 7.4, 6.4, [[0, -0.6, 5]])
  ]
};

const shopC = {
  id: "shop-c", kind: "shop", variant: "C", title: "Sklep C — Kramy",
  blurb: "Four separate stalls with parasols. Feels like a market: you walk between them instead of scanning a shelf.",
  arena: { hx: 12, hz: 7.5 }, spawns: [[0, 6], [-3, 6], [3, 6], [0, 5]], colors: GRASS,
  decals: [path([[-12, 2.2], [12, 2.2], [12, 0.4], [-12, 0.4]], "#f6c453"), blob(-6, -3.4, 3.2, "#e7a63c", 13), blob(6, -3.4, 3.2, "#e7a63c", 29)],
  items: [
    ...SHOP_ITEMS.flatMap((it, i) => {
      const x = -8.1 + i * 5.4;
      return [
        { type: it.type, x, z: -2.4, tag: "shop:" + it.id },
        { type: "parasol", x, z: -4.4 },
        { type: "crate", x: x - 1.6, z: -3.4 }
      ];
    }),
    { type: "sign", x: 0, z: 5, tag: "shop:exit" },
    { type: "pine", x: -11.4, z: -6.4 }, { type: "pine", x: 11.4, z: -6.4 }, { type: "bush", x: 0, z: -6.2 },
    { type: "bench", x: -4, z: 3.4, rot: 0 }, { type: "bench", x: 4, z: 3.4, rot: 0 },
    ...scatter(59, 18, ["tuft", "flower", "pebble"], 11.4, 6.8, [[-8.1, -3.4, 2.6], [-2.7, -3.4, 2.6], [2.7, -3.4, 2.6], [8.1, -3.4, 2.6]])
  ]
};

export const SCENES = { menu: [menuA, menuB, menuC], lobby: [lobbyA, lobbyB, lobbyC], shop: [shopA, shopB, shopC] };

export function labelsFor(scene, state = {}) {
  const out = [];
  const at = (item) => ({ x: item.x, z: item.z, y: (PROPS[item.type] ? PROPS[item.type].height : 1) + 0.45 });
  for (const item of scene.items) {
    if (!item.tag) continue;
    const pos = at(item);
    const [kind, key] = item.tag.split(":");
    if (kind === "menu") {
      const b = MENU_BUTTONS.find((m) => m.tag === item.tag);
      if (b) out.push({ tag: item.tag, ...pos, text: b.label, sub: b.sub, tone: key === "play" ? "go" : "" });
    } else if (kind === "lobby") {
      if (key === "start") out.push({ tag: item.tag, ...pos, text: "START", sub: (state.ready || 0) + " ready", tone: "go" });
      else {
        const idx = Number(key.replace("slot", ""));
        const taken = (state.slots || [])[idx];
        out.push({ tag: item.tag, ...pos, text: taken ? taken.name : "FREE", sub: taken ? "claimed" : "swallow to claim", color: taken ? taken.color : null });
      }
    } else if (kind === "shop") {
      if (key === "exit") out.push({ tag: item.tag, ...pos, text: "BACK", sub: "to the menu" });
      else {
        const it = SHOP_ITEMS.find((s) => s.id === key);
        const owned = (state.owned || []).includes(key);
        out.push({ tag: item.tag, ...pos, text: it.name, sub: owned ? "owned" : `${it.cost} ★ · ${it.desc}`, tone: owned ? "owned" : (state.stars || 0) >= it.cost ? "go" : "poor" });
      }
    }
  }
  return out;
}
