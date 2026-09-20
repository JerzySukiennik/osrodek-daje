// Every button on every screen must be pressable by a starting-size hole that drives to it.
// No teleporting and no cheating the radius: this is the way a player actually reaches it.

import RAPIER from "@dimforge/rapier3d-compat";
import { createSim } from "../../js/sim/world.js";
import { TUNE } from "../../js/shared/tune.js";
import { SCENES, buildSelectScene } from "../../js/shared/scenes.js";
import { LEVELS } from "../../js/shared/levels.js";

await RAPIER.init();
let failed = 0;
const check = (name, ok, info = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${info ? "  — " + info : ""}`);
  if (!ok) failed++;
};

const scenes = [...SCENES.menu, ...SCENES.lobby, ...SCENES.shop, buildSelectScene(LEVELS, {})];

for (const scene of scenes) {
  const tags = scene.items.filter((i) => i.tag).map((i) => i.tag);
  const stuck = [];
  let slowest = 0;
  for (const tag of tags) {
    const sim = createSim(RAPIER, scene, TUNE);
    const hole = sim.addHole("a", "#fff");
    const item = scene.items.find((i) => i.tag === tag);
    let pressed = false;
    const near = scene.spawns.map(([sx, sz]) => Math.hypot(item.x - sx, item.z - sz)).sort((x, y) => x - y)[0];
    if (near < 2.5) stuck.push(`${tag} sits ${near.toFixed(1)}m from a spawn`);
    let t = 0;
    for (let i = 0; i < 60 * 30 && !pressed; i++) {
      const dx = item.x - hole.x;
      const dz = item.z - hole.z;
      const d = Math.hypot(dx, dz) || 1;
      sim.setInput("a", { x: dx / d, y: -dz / d });
      sim.step();
      t = i / 60;
      for (const e of sim.drainEvents()) if (e.type === "swallow" && e.tag === tag) pressed = true;
    }
    if (!pressed) stuck.push(`${tag}(${item.type})`);
    slowest = Math.max(slowest, t);
    sim.dispose();
  }
  check(`${scene.id}: all ${tags.length} buttons pressable by a fresh hole`, stuck.length === 0, stuck.length ? stuck.join(", ") : `slowest drive ${slowest.toFixed(1)}s`);
}

console.log(failed ? `\n${failed} FAILED` : "\nALL PASS");
process.exit(failed ? 1 : 0);
