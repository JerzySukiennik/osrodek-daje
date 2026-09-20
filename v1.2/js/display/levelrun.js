// Tracks one level attempt: what is left, which stars are earned, how long it took.
// Reads simulation events and the live prop map; knows nothing about rendering.

import { swallowableCount } from "../shared/levels.js";
import { PROPS } from "../shared/props.js";

export function createRun(level, sim) {
  const initial = new Set();
  const core = new Set();
  for (const [id, prop] of sim.props) {
    if (prop.def.star) continue;
    initial.add(id);
    if (!prop.def.anchored) core.add(id);
  }

  const stats = {
    time: 0, swallowed: 0, types: {}, starsFound: 0, spat: 0, burned: 0, maxCombo: 0,
    usedFire: false, usedFountain: false, done: false, doneAt: 0,
    total: core.size, totalAll: initial.size, remaining: core.size, remainingAll: initial.size
  };
  const burnedIds = new Set();
  let window = [];

  function onEvent(e) {
    if (e.type === "swallow") {
      const def = PROPS[e.prop];
      if (def && def.star) {
        stats.starsFound++;
        return;
      }
      if (e.counted) return;
      stats.swallowed++;
      stats.types[e.prop] = (stats.types[e.prop] || 0) + 1;
      window.push(stats.time);
      window = window.filter((t) => stats.time - t <= 4);
      stats.maxCombo = Math.max(stats.maxCombo, window.length);
    } else if (e.type === "spit") {
      stats.spat++;
    } else if (e.type === "ignite") {
      if (!burnedIds.has(e.id)) { burnedIds.add(e.id); stats.burned = burnedIds.size; }
    } else if (e.type === "element" && e.element === "fire") {
      stats.usedFire = true;
    } else if (e.type === "fountain") {
      stats.usedFountain = true;
    }
  }

  function tick(dt) {
    if (!stats.done) stats.time += dt;
    let left = 0;
    let leftAll = 0;
    for (const id of initial) {
      if (!sim.props.has(id)) continue;
      leftAll++;
      if (core.has(id)) left++;
    }
    stats.remaining = left;
    stats.remainingAll = leftAll;
    if (!stats.done && left === 0) {
      stats.done = true;
      stats.doneAt = stats.time;
      return true;
    }
    return false;
  }

  function earned() {
    const view = { ...stats, time: stats.done ? stats.doneAt : stats.time };
    return level.stars.filter((s) => {
      try { return !!s.test(view); } catch (e) { return false; }
    }).map((s) => s.id);
  }

  return { level, stats, onEvent, tick, earned };
}

export function createResults(root) {
  const el = document.createElement("div");
  el.className = "results";
  el.hidden = true;
  root.appendChild(el);
  let onContinue = null;

  function show(level, earnedIds, totals, cb) {
    onContinue = cb;
    const got = level.stars.filter((s) => earnedIds.includes(s.id));
    const rows = level.stars.map((s) => {
      const on = earnedIds.includes(s.id);
      return `<li class="${on ? "on" : ""}"><i>${on ? "★" : "☆"}</i><span>${s.label}</span></li>`;
    }).join("");
    el.innerHTML = `
      <div class="results-card">
        <h2>${level.title}</h2>
        <div class="score"><b>${got.length}</b><span>/ ${level.stars.length} ★</span></div>
        <ul class="star-list">${rows}</ul>
        <p class="crew">Crew total: <b>${totals.stars}</b> ★</p>
        <button id="rs-go">Next</button>
      </div>`;
    el.hidden = false;
    el.querySelector("#rs-go").onclick = () => hide();
  }

  function hide() {
    if (el.hidden) return;
    el.hidden = true;
    const cb = onContinue;
    onContinue = null;
    if (cb) cb();
  }

  return { show, hide, isOpen: () => !el.hidden };
}
