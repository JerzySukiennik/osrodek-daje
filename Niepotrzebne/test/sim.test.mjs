// Headless physics checks for the hole rig: fit, teeter, growth, spit, fire, water, two-hole overlap, level stability.

import RAPIER from "@dimforge/rapier3d-compat";
import { createSim } from "../../js/sim/world.js";
import { TUNE } from "../../js/shared/tune.js";
import { buildLevel } from "../../js/shared/level.js";
import { PROPS } from "../../js/shared/props.js";

await RAPIER.init();

let failed = 0;
function check(name, ok, info = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${info ? "  — " + info : ""}`);
  if (!ok) failed++;
}

function run(sim, seconds, each) {
  const n = Math.round(seconds * 60);
  for (let i = 0; i < n; i++) { if (each) each(i); sim.step(); }
}

function place(sim, id, x, z, r) {
  const h = sim.addHole(id, "#f00");
  h.x = x; h.z = z;
  if (r) { h.r = r; h.area = Math.PI * r * r; }
  return h;
}

{
  const sim = createSim(RAPIER, [], TUNE);
  const crate = sim.spawnProp("crate", 0, 0, 0.3);
  run(sim, 1);
  const y0 = crate.body.translation().y;
  check("crate rests on plain ground", Math.abs(y0) < 0.03, `y=${y0.toFixed(3)}`);
  const h = place(sim, "a", 0, 0, 0.6);
  run(sim, 2);
  const ev = sim.drainEvents().filter((e) => e.type === "swallow");
  check("crate (0.6) falls into r=0.6 hole under it", ev.length === 1 && h.eaten === 1, `r now ${h.r.toFixed(3)}`);
}

{
  const sim = createSim(RAPIER, [], TUNE);
  const table = sim.spawnProp("table", 0, 0, 0);
  place(sim, "a", 0, 0, 0.5);
  run(sim, 3);
  const t = table.body.translation();
  check("table does NOT fall into r=0.5 hole", !table.dead && t.y > -0.2, `y=${t.y.toFixed(3)}`);
}

{
  const sim = createSim(RAPIER, [], TUNE);
  const crate = sim.spawnProp("crate", 0, 0, 0);
  const h = place(sim, "a", -3, 0, 0.5);
  run(sim, 0.5);
  let maxTilt = 0;
  run(sim, 4, () => {
    sim.setInput("a", { x: h.x < -0.42 ? 0.25 : 0, y: 0 });
    const q = crate.dead ? null : crate.body.rotation();
    if (q) maxTilt = Math.max(maxTilt, 2 * Math.acos(Math.min(1, Math.abs(q.w))));
  });
  check("crate teeters on the rim of a slightly small hole", maxTilt > 0.05, `max tilt ${(maxTilt * 57.3).toFixed(1)}°, swallowed=${crate.dead}`);
}

{
  const sim = createSim(RAPIER, [], TUNE);
  const log = sim.spawnProp("log", 0, 0, 0);
  place(sim, "a", 0.35, 0, 0.42);
  run(sim, 4);
  check("1 m log tips end-first into r=0.42 hole offset to one end", log.dead, log.dead ? "" : `y=${log.body.translation().y.toFixed(2)}`);
}

{
  const sim = createSim(RAPIER, [], TUNE);
  const h = place(sim, "a", 0, 0, 0.7);
  sim.spawnProp("crate", 0, 0, 0);
  run(sim, 2);
  sim.drainEvents();
  const before = h.r;
  sim.setInput("a", { x: 0, y: 0, b: 1 });
  run(sim, 0.5);
  sim.setInput("a", { x: 0, y: 0, b: 0 });
  run(sim, 0.1);
  sim.setInput("a", { x: 0, y: 0, b: 0 });
  const spat = sim.drainEvents().find((e) => e.type === "spit");
  let peak = 0;
  let drift = 0;
  const prop = spat ? sim.props.get(spat.id) : null;
  run(sim, 3, () => {
    if (prop && !prop.dead) {
      const t = prop.body.translation();
      peak = Math.max(peak, t.y);
      drift = Math.max(drift, Math.hypot(t.x - h.x, t.z - h.z));
    }
  });
  check("spit tosses the crate straight up", !!spat && peak > 1.5 && drift < 0.25, `peak ${peak.toFixed(2)} m, sideways drift ${drift.toFixed(2)} m`);
  check("it falls straight back into the hole with no growth", !!prop && prop.dead && h.belly.length === 1 && Math.abs(h.r - before) < 1e-6, `belly ${h.belly.length}, r ${before.toFixed(3)} → ${h.r.toFixed(3)}`);
}

{
  const sim = createSim(RAPIER, [], TUNE);
  const h = place(sim, "a", -8.6, 4.6, 0.9);
  run(sim, 0.2);
  h.x = 0; h.z = 0;
  run(sim, TUNE.waterTime - 1);
  const still = h.element === "water";
  run(sim, 1.5);
  check("water drains by itself a few seconds after leaving the pond", still && h.element === null);
}

{
  const sim = createSim(RAPIER, [], TUNE);
  const h = place(sim, "a", 0, 0, 0.8);
  sim.spawnProp("campfire", 0, 0, 0);
  run(sim, 2);
  check("swallowing the campfire sets the hole on fire", h.element === "fire");
  const crate = sim.spawnProp("crate", 3, 0, 0);
  const fw = sim.spawnProp("firework", 3, 1.2, 0);
  h.x = 2.0; h.z = 0.5;
  run(sim, 0.4);
  const evs = sim.drainEvents();
  check("fire hole ignites a nearby crate", evs.some((e) => e.type === "ignite" && e.id === crate.id));
  run(sim, 6);
  const evs2 = sim.drainEvents();
  check("burning crate turns into charcoal", evs2.some((e) => e.type === "burnout") && Array.from(sim.props.values()).some((p) => p.type === "char"));
  check("firework launches and explodes", evs.concat(evs2).some((e) => e.type === "explode") && fw.dead);
}

{
  const sim = createSim(RAPIER, [], TUNE);
  const h = place(sim, "a", -8.6, 4.6, 0.9);
  run(sim, 0.2);
  check("hole inside the pond fills with water", h.element === "water");
  const ball = sim.spawnProp("ball", -8.6, 4.6, 0, 0.5);
  const pebble = sim.spawnProp("pebble", -8.3, 4.6, 0, 0.5);
  run(sim, 3);
  check("beach ball floats in a water hole", !ball.dead && ball.body.translation().y > -0.6, `y=${ball.dead ? "dead" : ball.body.translation().y.toFixed(2)}`);
  check("pebble sinks in a water hole", pebble.dead);
  sim.setInput("a", { x: 0, y: 0, b: 1 });
  run(sim, 0.1);
  sim.setInput("a", { x: 0, y: 0, b: 0 });
  let top = 0;
  run(sim, 1.6, () => { if (!ball.dead) top = Math.max(top, ball.body.translation().y); });
  check("fountain tosses the ball and drains the water", top > 1 && h.element !== "water", `ball peak ${top.toFixed(2)}`);
}

{
  const sim = createSim(RAPIER, [], TUNE);
  place(sim, "a", 0, 0, 0.8);
  place(sim, "b", 1.9, 0, 0.8);
  const between = sim.spawnProp("pebble", 0.95, 0, 0, 0.3);
  const overB = sim.spawnProp("pebble", 1.9, 0, 0, 0.3);
  const table = sim.spawnProp("table", 0.95, 2.4, 0);
  run(sim, 2.5);
  check("pebble on the strip between two holes stays up", !between.dead && between.body.translation().y > -0.05, between.dead ? "swallowed" : `y=${between.body.translation().y.toFixed(3)}`);
  check("pebble over hole B falls although hole A's patch overlaps it", overB.dead);
  check("table next to two holes stays supported", !table.dead && table.body.translation().y > -0.05, `y=${table.dead ? "dead" : table.body.translation().y.toFixed(3)}`);
}

{
  const sim = createSim(RAPIER, buildLevel(), TUNE);
  const start = new Map();
  run(sim, 0.2);
  for (const p of sim.props.values()) { const t = p.body.translation(); start.set(p.id, [t.x, t.y, t.z]); }
  const t0 = performance.now();
  run(sim, 4);
  const ms = (performance.now() - t0) / 240;
  let moved = 0, sunk = 0, worst = "";
  for (const p of sim.props.values()) {
    const t = p.body.translation(); const s = start.get(p.id);
    const d = Math.hypot(t.x - s[0], t.y - s[1], t.z - s[2]);
    if (d > 0.15) { moved++; worst += ` ${p.type}:${d.toFixed(2)}`; }
    if (t.y < -0.1) sunk++;
  }
  check("level settles: nothing drifts or sinks with no holes", moved === 0 && sunk === 0, `${sim.props.size} props, moved=${moved}${worst}, sunk=${sunk}`);
  console.log(`INFO  step cost without holes — ${ms.toFixed(2)} ms/step`);

  for (let i = 0; i < 4; i++) sim.addHole("h" + i, "#fff");
  const t1 = performance.now();
  run(sim, 6, (i) => {
    for (let k = 0; k < 4; k++) sim.setInput("h" + k, { x: Math.sin(i * 0.02 + k * 1.7), y: Math.cos(i * 0.013 + k) });
  });
  const ms4 = (performance.now() - t1) / 360;
  let eaten = 0;
  for (const h of sim.holes.values()) eaten += h.eaten;
  let lost = 0;
  for (const p of sim.props.values()) if (p.body.translation().y < -0.3 && !p.thrust) lost++;
  check("4 wandering holes cost under 6x the idle level", ms4 < ms * 6, `${ms4.toFixed(2)} ms/step vs ${ms.toFixed(2)} idle`);
  check("4 wandering holes: nothing stuck below ground outside a hole", lost <= 2, `below ground: ${lost}`);
}

{
  let area = Math.PI * TUNE.holeStartR ** 2;
  const counts = {};
  for (const it of buildLevel()) counts[it.type] = (counts[it.type] || 0) + 1;
  const order = Object.keys(counts).sort((a, b) => PROPS[a].radius - PROPS[b].radius);
  console.log("\nGrowth ladder (whole level, one hole):");
  for (const type of order) {
    const r = Math.sqrt(area / Math.PI);
    console.log(`  r=${r.toFixed(2)}  next: ${type} ×${counts[type]} (bound radius ${PROPS[type].radius.toFixed(2)})`);
    area += PROPS[type].grow * counts[type];
  }
  console.log(`  final r=${Math.sqrt(area / Math.PI).toFixed(2)}`);
}

console.log(failed ? `\n${failed} FAILED` : "\nALL PASS");
process.exit(failed ? 1 : 0);
