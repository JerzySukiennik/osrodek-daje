import RAPIER from "@dimforge/rapier3d-compat";
import { createSim } from "../../js/sim/world.js";
import { TUNE } from "../../js/shared/tune.js";
import { buildLevel } from "../../js/shared/level.js";
await RAPIER.init();
const sim = createSim(RAPIER, buildLevel(), TUNE);
for (let i = 0; i < 4; i++) sim.addHole("h" + i, "#fff");
const ws = sim.world.step.bind(sim.world); let tw = 0;
sim.world.step = () => { const t = performance.now(); ws(); tw += performance.now() - t; };
const t = performance.now();
for (let i = 0; i < 600; i++) {
  for (let k = 0; k < 4; k++) sim.setInput("h" + k, { x: Math.sin(i * 0.02 + k * 1.7), y: Math.cos(i * 0.013 + k) });
  sim.step();
}
const tot = performance.now() - t;
console.log("total", (tot / 600).toFixed(2), "world.step", (tw / 600).toFixed(2));
for (const h of sim.holes.values()) console.log(h.id, h.x.toFixed(1), h.z.toFixed(1), "r", h.r.toFixed(2), "eaten", h.eaten);
let awake = 0; for (const p of sim.props.values()) if (!p.body.isSleeping() && !p.body.isFixed()) awake++;
console.log("awake", awake, "props", sim.props.size);
