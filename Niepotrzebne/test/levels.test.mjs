// Every level must be finishable by brute force: park a big hole on each prop until the goal clears.
import RAPIER from "@dimforge/rapier3d-compat";
import { createSim } from "../../js/sim/world.js";
import { createRun } from "../../js/display/levelrun.js";
import { TUNE } from "../../js/shared/tune.js";
import { LEVELS } from "../../js/shared/levels.js";
import { PROPS } from "../../js/shared/props.js";

await RAPIER.init();
let failed = 0;
const check = (name, ok, info = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${info ? "  — " + info : ""}`);
  if (!ok) failed++;
};

for (const level of LEVELS) {
  const sim = createSim(RAPIER, level, TUNE);
  const run = createRun(level, sim);
  const h = sim.addHole("a", "#fff");
  const feed = () => { for (const e of sim.drainEvents()) run.onEvent(e); };
  for (let i = 0; i < 30; i++) sim.step();
  feed();

  const startStars = level.items.filter((i) => i.tag && i.tag.startsWith("star:")).length;
  check(`${level.id}: three hidden stars placed`, startStars === 3, String(startStars));
  check(`${level.id}: ten stars defined`, level.stars.length === 10);
  check(`${level.id}: spawns clear of props`, level.spawns.every(([sx, sz]) =>
    !level.items.some((it) => Math.hypot(it.x - sx, it.z - sz) < (PROPS[it.type].radius + 0.9))));

  const initialIds = new Set([...sim.props.keys()]);
  let rounds = 0;
  while (run.stats.remaining > 0 && rounds++ < 4) {
    for (const id of initialIds) {
      const p = sim.props.get(id);
      if (!p || p.def.star) continue;
      const t = p.body.translation();
      h.r = Math.max(h.r, p.def.radius * 1.4 + 0.2);
      h.area = Math.PI * h.r * h.r;
      h.x = t.x;
      h.z = t.z;
      for (let i = 0; i < 60; i++) sim.step();
      feed();
      run.tick(1);
    }
  }
  run.tick(0.016);
  feed();
  check(`${level.id}: goal reachable`, run.stats.done, `left ${run.stats.remaining}/${run.stats.total} after ${rounds} rounds, r=${h.r.toFixed(1)}`);

  for (const item of level.items.filter((i) => i.tag && i.tag.startsWith("star:"))) {
    const prop = [...sim.props.values()].find((p) => p.tag === item.tag);
    if (!prop) continue;
    h.x = item.x;
    h.z = item.z;
    for (let i = 0; i < 60; i++) sim.step();
    feed();
  }
  const ids = run.earned();
  check(`${level.id}: hidden stars collectable`, run.stats.starsFound === 3, `found ${run.stats.starsFound}`);
  check(`${level.id}: earns finish + clean + 3 hidden`, ["finish", "clean", "star1", "star2", "star3"].every((k) => ids.includes(k)), ids.join(","));
  sim.dispose();
}

console.log(failed ? `\n${failed} FAILED` : "\nALL PASS");
process.exit(failed ? 1 : 0);
