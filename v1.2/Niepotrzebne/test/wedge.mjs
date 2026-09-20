import RAPIER from "@dimforge/rapier3d-compat";
import { createSim } from "../../js/sim/world.js";
import { TUNE } from "../../js/shared/tune.js";
import { PROPS } from "../../js/shared/props.js";
await RAPIER.init();
const types = ["crate", "log", "bench", "deckchair", "barrel", "bucket", "table", "kayak", "bush", "campfire", "grill", "fence", "parasol", "pine"];
let bad = 0;
for (const type of types) {
  const need = PROPS[type].radius;
  for (const scale of [1.05, 1.3]) {
    for (const off of [0, 0.5]) {
      const sim = createSim(RAPIER, [], TUNE);
      const p = sim.spawnProp(type, 0, 0, 0.7, 0, { loose: true });
      for (let i = 0; i < 60; i++) sim.step();
      const r = need * scale;
      const h = sim.addHole("a", "#fff"); h.r = r; h.area = Math.PI * r * r; h.x = -r - need - 0.5; h.z = off * need;
      let t = 0;
      for (let i = 0; i < 60 * 9 && !p.dead; i++) { sim.setInput("a", { x: h.x < 0 ? 0.5 : 0, y: 0 }); sim.step(); t = i / 60; }
      if (!p.dead) { bad++; const tr = p.body.translation(); console.log(`STUCK ${type} hole=${scale}x off=${off} y=${tr.y.toFixed(2)}`); }
    }
  }
}
console.log(bad ? `${bad} wedged` : "nothing wedged: every prop that fits goes in");
