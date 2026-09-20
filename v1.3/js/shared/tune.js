// Live-tunable gameplay constants; the lab panel edits this object in place and saves overrides to localStorage.

export const TUNE_DEFAULTS = {
  gravity: 27.5,
  holeStartR: 0.45,
  holeSpeed: 4.6,
  holeAccel: 9,
  speedPerR: 0.22,
  growth: 1,
  swallowDepth: 0.55,
  spitApex: 2.2,
  spitApexCharge: 4.5,
  spitRange: 0,
  spitRangeCharge: 0,
  spitChargeS: 0.8,
  fireTime: 22,
  burnTime: 3.2,
  fireReach: 0.55,
  spreadChance: 0.22,
  fountainS: 1.1,
  fountainPush: 26,
  waterTime: 7,
  friction: 0.9,
  rimFriction: 0.25,
  suction: 16,
  propDamping: 0.15
};

export const TUNE_META = {
  gravity: { min: 8, max: 40, step: 0.5, label: "Gravity" },
  holeStartR: { min: 0.25, max: 1.5, step: 0.05, label: "Start radius (reset)" },
  holeSpeed: { min: 1.5, max: 10, step: 0.1, label: "Hole speed" },
  holeAccel: { min: 2, max: 30, step: 0.5, label: "Hole snappiness" },
  speedPerR: { min: 0, max: 0.8, step: 0.02, label: "Speed bonus per radius" },
  growth: { min: 0.2, max: 4, step: 0.05, label: "Growth multiplier" },
  swallowDepth: { min: 0.2, max: 1.5, step: 0.05, label: "Swallow depth" },
  spitApex: { min: 0.5, max: 6, step: 0.1, label: "Spit height (tap)" },
  spitApexCharge: { min: 0, max: 8, step: 0.1, label: "Spit height (+charged)" },
  spitRange: { min: 0, max: 4, step: 0.1, label: "Spit sideways (tap)" },
  spitRangeCharge: { min: 0, max: 12, step: 0.1, label: "Spit sideways (+charged)" },
  spitChargeS: { min: 0.2, max: 2, step: 0.05, label: "Charge time" },
  fireTime: { min: 4, max: 60, step: 1, label: "Fire duration" },
  burnTime: { min: 0.8, max: 10, step: 0.1, label: "Burn time" },
  fireReach: { min: 0.1, max: 2, step: 0.05, label: "Fire reach" },
  spreadChance: { min: 0, max: 1, step: 0.05, label: "Fire spread chance" },
  fountainS: { min: 0.3, max: 3, step: 0.1, label: "Fountain length" },
  waterTime: { min: 1, max: 30, step: 0.5, label: "Water lasts outside pond" },
  fountainPush: { min: 0, max: 80, step: 1, label: "Fountain pushes outward" },
  friction: { min: 0.1, max: 1.5, step: 0.05, label: "Friction (reset)" },
  rimFriction: { min: 0, max: 1, step: 0.05, label: "Rim slipperiness (reset)" },
  suction: { min: 0, max: 60, step: 1, label: "Suction on sunk props" },
  propDamping: { min: 0, max: 1, step: 0.05, label: "Prop damping (reset)" }
};

export const TUNE = { ...TUNE_DEFAULTS };

const KEY = "osrodek.lab1b.tune";

export function loadTune() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    for (const k of Object.keys(TUNE_DEFAULTS)) if (typeof saved[k] === "number") TUNE[k] = saved[k];
  } catch (e) {}
  return TUNE;
}

export function saveTune() {
  try { localStorage.setItem(KEY, JSON.stringify(TUNE)); } catch (e) {}
}

export function resetTune() {
  Object.assign(TUNE, TUNE_DEFAULTS);
  saveTune();
}
