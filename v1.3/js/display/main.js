// Display entry: owns the simulation, renders it, hosts the room for phone pads, plus mouse dev hole and bots.

import * as THREE from "three";
import { TUNE, loadTune } from "../shared/tune.js";
import { buildLevel } from "../shared/level.js";
import { PROPS } from "../shared/props.js";
import { MSG, PROTO, MAX_PLAYERS, PLAYER_COLORS, PLAYER_NAMES } from "../shared/protocol.js";
import { createSim } from "../sim/world.js";
import { createView } from "../view/scene.js";
import { createPropMesh, propMaterial, burnMaterial, useModelGeometries } from "../view/propmesh.js";
import { loadModelGeometries } from "../view/models.js";
import { createHoleView } from "../view/holes.js";
import { createFx } from "../view/fx.js";
import { sfx, unlockAudio, loadAudio, audio, playMusic, stopMusic } from "../view/audio.js";
import { createShell } from "./shell.js";
import { createRun, createResults } from "./levelrun.js";
import { createPanel } from "./panel.js";

const RAPIER_URL = "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.14.0/+esm";

export async function startDisplay(root, canvas) {
  loadTune();
  const params = new URLSearchParams(location.search);

  root.innerHTML = `
    <div class="tv-title"><b>OŚRODEK DAJE</b><span id="tv-scene">LAB 03 · screens & sound</span></div>
    <div class="tv-goal" id="tv-goal" hidden></div>
    <div class="tv-stars" id="tv-stars"></div>
    <div class="tv-players" id="tv-players"></div>
    <div class="tv-join" id="tv-join"><div class="qr" id="tv-qr"></div><div class="join-text"><span>JOIN</span><b id="tv-code">····</b><small id="tv-net">starting…</small></div></div>
    <div class="tv-hint" id="tv-hint">Click the grass for a mouse hole · SPACE spits · 1/2/3 menu·lobby·shop · [ ] swap layout · B bot · P panel</div>
    <div class="tv-overlay" id="tv-overlay"></div>
    <div class="tv-loading" id="tv-loading">Loading physics…</div>`;
  root.hidden = false;
  canvas.hidden = false;

  const RAPIER = (await import(RAPIER_URL)).default;
  await RAPIER.init();

  let modelCount = 0;
  try {
    const models = await loadModelGeometries("assets/models.glb");
    useModelGeometries(models);
    modelCount = models.size;
  } catch (e) {
    console.warn("models.glb failed to load, falling back to primitives", e);
  }

  const audioInfo = await loadAudio();
  import("./agentation.js").then((m) => m.mountAgentation()).catch(() => {});

  const view = createView(canvas);
  const fx = createFx(view.scene, view.camera, root.querySelector("#tv-overlay"));
  root.querySelector("#tv-loading").remove();

  let sim = null;
  const propViews = new Map();
  const holeViews = new Map();
  const players = new Map();
  const burning = new Map();
  const trails = new Map();
  let botCount = 0;
  const stats = { fps: 0, stepMs: 0, props: 0, awake: 0 };

  function freeSlot() {
    const used = new Set(Array.from(players.values()).map((p) => p.slot));
    for (let i = 0; i < MAX_PLAYERS; i++) if (!used.has(i)) return i;
    return -1;
  }

  function addPlayer(id, kind) {
    if (players.has(id)) return players.get(id);
    const slot = freeSlot();
    if (slot < 0) return null;
    const player = { id, kind, slot, color: PLAYER_COLORS[slot], name: PLAYER_NAMES[slot], bot: null };
    players.set(id, player);
    sim.addHole(id, player.color);
    sfx.join();
    renderPlayers();
    return player;
  }

  function removePlayer(id) {
    if (!players.has(id)) return;
    players.delete(id);
    sim.removeHole(id);
    sfx.leave();
    renderPlayers();
  }

  let shell = null;
  let currentScene = null;
  let run = null;
  let results = null;

  function loadScene(scene) {
    currentScene = scene;
    for (const v of propViews.values()) view.scene.remove(v);
    propViews.clear();
    burning.clear();
    trails.clear();
    for (const hv of holeViews.values()) hv.dispose();
    holeViews.clear();
    if (sim) sim.dispose();
    view.setLevel(scene);
    sim = createSim(RAPIER, scene, TUNE);
    for (const p of sim.props.values()) attachProp(p.id, p.type);
    for (const p of players.values()) sim.addHole(p.id, p.color);
    handleEvents(sim.drainEvents());
    run = scene.kind === "level" && scene.stars ? createRun(scene, sim) : null;
    renderGoal();
    const el = root.querySelector("#tv-scene");
    if (el) el.textContent = scene.title || "Baseplate";
    const hint = root.querySelector("#tv-hint");
    if (hint) hint.textContent = scene.blurb || "Baseplate · 1 menu · 2 lobby · 3 shop · [ ] swap layout · SPACE spits · B bot · P panel";
  }

  function resetLevel() {
    if (currentScene) loadScene(currentScene);
  }

  function attachProp(id, type) {
    if (propViews.has(id)) return;
    const mesh = createPropMesh(type);
    view.scene.add(mesh);
    propViews.set(id, mesh);
  }

  function handleEvents(events) {
    for (const e of events) {
      if (run) run.onEvent(e);
      if (e.type === "spawn") attachProp(e.id, e.prop);
      else if (e.type === "holeAdd") {
        const p = players.get(e.hole);
        holeViews.set(e.hole, createHoleView(view.scene, p ? p.color : "#ffffff"));
      } else if (e.type === "holeRemove") {
        const hv = holeViews.get(e.hole);
        if (hv) hv.dispose();
        holeViews.delete(e.hole);
      } else if (e.type === "swallow") {
        const mesh = propViews.get(e.id);
        propViews.delete(e.id);
        burning.delete(e.id);
        if (mesh) fx.ghost(mesh, e.vel);
        const hv = holeViews.get(e.hole);
        if (hv) hv.bump(0.08 + e.size * 0.12);
        sfx.swallow(e.size);
        if (e.wet) { fx.burst(e.pos[0], 0.1, e.pos[2], 10, { color: ["#7fd0ff", "#ffffff"], speed: 2, up: 4, size: 0.1 }); sfx.splash(); }
        if (e.size > 1.2) view.kick(0.12 + e.size * 0.05);
        if (e.tag) shell.onSwallow(e.tag, e.hole, e.pos);
        else if (e.size > 0.3 && !e.counted) {
          const pl = players.get(e.hole);
          fx.popup(PROPS[e.prop].label, e.pos[0], 0.6, e.pos[2], pl ? pl.color : "#fff");
        }
        renderPlayers();
      } else if (e.type === "spit") {
        sfx.spit(e.power);
        fx.burst(e.x, 0.1, e.z, 8, { color: "#ffffff", speed: 2.5, up: 3, size: 0.09 });
        const hv = holeViews.get(e.hole);
        if (hv) hv.bump(0.15);
        renderPlayers();
      } else if (e.type === "burp") {
        sfx.burp();
        fx.burst(e.x, 0.1, e.z, 5, { color: "#d9b3ff", speed: 1, up: 2, size: 0.08, g: 2 });
      } else if (e.type === "ignite") {
        burning.set(e.id, e.size);
        const mesh = propViews.get(e.id);
        if (mesh) mesh.material = burnMaterial;
        sfx.ignite();
      } else if (e.type === "extinguish") {
        burning.delete(e.id);
        const mesh = propViews.get(e.id);
        if (mesh) {
          mesh.material = propMaterial;
          fx.burst(mesh.position.x, 0.6, mesh.position.z, 12, { color: "#ffffff", speed: 1, up: 2.5, g: -2, size: 0.16, life: 0.9 });
        }
      } else if (e.type === "burnout") {
        dropProp(e.id);
        fx.burst(e.x, e.y + 0.3, e.z, 16, { color: ["#2b2526", "#ff9100", "#6b6b6b"], speed: 2.5, up: 3, size: 0.13, radius: e.size * 0.5 });
        sfx.burnout();
      } else if (e.type === "steam") {
        fx.burst(e.x, 0.2, e.z, 40, { color: ["#ffffff", "#dff4ff"], speed: 1.6, up: 3.5, g: -3, size: 0.24, life: 1.3, radius: e.r, drag: 1.2 });
        sfx.steam();
      } else if (e.type === "element") {
        if (e.element === "water") sfx.splash();
        if (e.element === "fire") sfx.ignite();
      } else if (e.type === "drained") {
        fx.burst(e.x, 0.05, e.z, 14, { color: ["#1e9bf0", "#7fd0ff"], speed: 1.5, up: 1.5, size: 0.09, radius: e.r });
      } else if (e.type === "fountain") {
        sfx.fountain();
      } else if (e.type === "fuse") {
        sfx.fuse();
      } else if (e.type === "liftoff") {
        trails.set(e.id, "small");
        sfx.liftoff();
      } else if (e.type === "launch") {
        trails.set(e.id, "big");
        view.kick(0.35);
        sfx.launch();
      } else if (e.type === "explode") {
        dropProp(e.id);
        const pal = [["#ff2e63", "#ffc400", "#ffffff"], ["#08b2ff", "#9b4dff", "#ffffff"], ["#00e676", "#ffea00", "#ffffff"]][(Math.random() * 3) | 0];
        fx.burst(e.x, e.y, e.z, 90, { color: pal, speed: 9, up: 2, g: 5, size: 0.17, life: 1.2, drag: 1.5 });
        view.kick(0.25);
        sfx.explode();
      } else if (e.type === "gone") {
        dropProp(e.id);
      } else if (e.type === "uproot") {
        sfx.uproot();
      }
    }
  }

  function dropProp(id) {
    if (shell) shell.refreshLabels();
    const mesh = propViews.get(id);
    if (mesh) view.scene.remove(mesh);
    propViews.delete(id);
    burning.delete(id);
    trails.delete(id);
  }

  function syncMeshes() {
    for (const [id, mesh] of propViews) {
      const prop = sim.props.get(id);
      if (!prop) { dropProp(id); continue; }
      const t = prop.body.translation();
      const q = prop.body.rotation();
      mesh.position.set(t.x, t.y, t.z);
      mesh.quaternion.set(q.x, q.y, q.z, q.w);
    }
  }

  function emitContinuous(dt) {
    for (const [id, size] of burning) {
      const mesh = propViews.get(id);
      if (!mesh) continue;
      const n = Math.random() < dt * 60 * Math.min(1, 0.35 + size * 0.4) ? 1 : 0;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.28, d = Math.random() * size * 0.6;
        fx.emit({
          x: mesh.position.x + Math.cos(a) * d, y: mesh.position.y + 0.2 + Math.random() * size, z: mesh.position.z + Math.sin(a) * d,
          vy: 2 + Math.random() * 2, g: -3, life: 0.5 + Math.random() * 0.3, size: 0.12 + size * 0.1,
          color: ["#ff3d00", "#ff9100", "#ffea00"][(Math.random() * 3) | 0]
        });
      }
    }
    for (const [id, kind] of trails) {
      const mesh = propViews.get(id);
      if (!mesh) continue;
      const big = kind === "big";
      for (let i = 0; i < (big ? 3 : 1); i++) {
        fx.emit({
          x: mesh.position.x + (Math.random() - 0.5) * (big ? 0.5 : 0.1), y: mesh.position.y + (big ? 0.2 : 0), z: mesh.position.z + (Math.random() - 0.5) * (big ? 0.5 : 0.1),
          vx: (Math.random() - 0.5) * (big ? 4 : 1), vy: big ? -6 : -2, vz: (Math.random() - 0.5) * (big ? 4 : 1),
          g: big ? -1 : 2, drag: 2, life: big ? 1.6 : 0.5, size: big ? 0.5 : 0.1,
          color: big ? ["#ffffff", "#ffe9c4", "#ff9100"][(Math.random() * 3) | 0] : ["#ffea00", "#ffffff"][(Math.random() * 2) | 0]
        });
      }
    }
    for (const h of sim.holes.values()) {
      if (h.fountainT > 0) {
        for (let i = 0; i < 5; i++) {
          const a = Math.random() * 6.28, d = Math.random() * h.r * 0.6;
          fx.emit({
            x: h.x + Math.cos(a) * d, y: 0, z: h.z + Math.sin(a) * d,
            vx: Math.cos(a) * 2.2, vy: 11 + Math.random() * 4, vz: Math.sin(a) * 2.2,
            g: 20, life: 1.1, size: 0.16, color: ["#1e9bf0", "#7fd0ff", "#ffffff"][(Math.random() * 3) | 0]
          });
        }
      }
    }
  }

  const goalEl = root.querySelector("#tv-goal");
  function renderGoal() {
    if (!goalEl) return;
    if (!run) { goalEl.hidden = true; return; }
    goalEl.hidden = false;
    const s = run.stats;
    const mins = Math.floor(s.time / 60);
    const secs = String(Math.floor(s.time % 60)).padStart(2, "0");
    goalEl.innerHTML = `<b>${s.total - s.remaining} / ${s.total}</b><span>swallowed</span><i>${mins}:${secs}</i>`;
  }

  const starsEl = root.querySelector("#tv-stars");
  function renderStars() {
    if (!starsEl || !shell) return;
    starsEl.innerHTML = `<b>${shell.stars()}</b> ★<small>${shell.state.owned.length ? shell.state.owned.join(" · ") : "nothing bought"}</small>`;
  }

  const playersEl = root.querySelector("#tv-players");
  function renderPlayers() {
    renderStars();
    playersEl.innerHTML = "";
    for (const p of players.values()) {
      const h = sim.holes.get(p.id);
      if (!h) continue;
      const top = h.belly.length ? PROPS[h.belly[h.belly.length - 1]].label : "empty";
      const el = document.createElement("div");
      el.className = "chip";
      el.style.setProperty("--pc", p.color);
      el.innerHTML = `<i></i><b>${p.name}</b><span>${h.eaten} eaten · ⌀ ${(h.r * 2).toFixed(1)} m</span><small>${p.kind === "pad" ? "📱" : p.kind === "bot" ? "🤖" : "🖱"} belly: ${top}${h.belly.length > 1 ? " +" + (h.belly.length - 1) : ""}</small>`;
      playersEl.appendChild(el);
    }
  }

  const mouse = { active: false, x: 0, z: 0, space: false };
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();

  function pointerToGround(ev) {
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -(((ev.clientY - r.top) / r.height) * 2 - 1)), view.camera);
    if (ray.ray.intersectPlane(plane, hit)) { mouse.x = hit.x; mouse.z = hit.z; }
  }

  canvas.addEventListener("pointermove", pointerToGround);
  canvas.addEventListener("pointerdown", (ev) => {
    unlockAudio();
    pointerToGround(ev);
    if (!mouse.active) {
      const pl = addPlayer("mouse", "mouse");
      if (pl) {
        mouse.active = true;
        const h = sim.holes.get("mouse");
        h.x = Math.max(-ARENA.hx + 1, Math.min(ARENA.hx - 1, mouse.x));
        h.z = Math.max(-ARENA.hz + 1, Math.min(ARENA.hz - 1, mouse.z));
      }
    }
  });

  function addBot() {
    const id = "bot" + ++botCount;
    const pl = addPlayer(id, "bot");
    if (pl) pl.bot = { tx: 0, tz: 0, until: 0 };
  }

  function removeBots() {
    for (const p of Array.from(players.values())) if (p.kind === "bot") removePlayer(p.id);
  }

  window.addEventListener("keydown", (ev) => {
    if (ev.target && /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) return;
    unlockAudio();
    if (ev.code === "Space") {
      if (results && results.isOpen()) { results.hide(); ev.preventDefault(); return; }
      mouse.space = true;
      ev.preventDefault();
    }
    if (ev.code === "KeyB") addBot();
    if (ev.code === "KeyN") removeBots();
    if (ev.code === "KeyM" && mouse.active) { removePlayer("mouse"); mouse.active = false; }
    if (ev.code === "KeyR") resetLevel();
    if (ev.code === "Digit1") shell.show("menu");
    if (ev.code === "Digit2") shell.show("select");
    if (ev.code === "Digit3") shell.show("shop");
    if (ev.code === "Digit4") shell.show("level");
    if (ev.code === "BracketLeft") shell.cycleVariant(-1);
    if (ev.code === "BracketRight") shell.cycleVariant(1);
    if (ev.code === "KeyP") panel.toggle();
  });
  window.addEventListener("keyup", (ev) => { if (ev.code === "Space") mouse.space = false; });

  function driveLocal() {
    if (mouse.active) {
      const h = sim.holes.get("mouse");
      if (h) {
        const dx = mouse.x - h.x, dz = mouse.z - h.z;
        const d = Math.hypot(dx, dz);
        const m = d < 0.08 ? 0 : Math.min(1, d / 1.4);
        sim.setInput("mouse", { x: d ? (dx / d) * m : 0, y: d ? (-dz / d) * m : 0, b: mouse.space });
      }
    }
    const now = sim.time();
    for (const p of players.values()) {
      if (!p.bot) continue;
      const h = sim.holes.get(p.id);
      if (!h) continue;
      const b = p.bot;
      if (now > b.until || Math.hypot(b.tx - h.x, b.tz - h.z) < 0.3) {
        let best = null, bestD = 1e9;
        for (const prop of sim.props.values()) {
          if (prop.def.radius > h.r * 0.95 || prop.body.isFixed()) continue;
          const t = prop.body.translation();
          const d = Math.hypot(t.x - h.x, t.z - h.z) * (0.6 + Math.random());
          if (d < bestD) { bestD = d; best = t; }
        }
        b.tx = best ? best.x : (Math.random() * 2 - 1) * ARENA.hx;
        b.tz = best ? best.z : (Math.random() * 2 - 1) * ARENA.hz;
        b.until = now + 2.5;
      }
      const dx = b.tx - h.x, dz = b.tz - h.z;
      const d = Math.hypot(dx, dz) || 1;
      sim.setInput(p.id, { x: dx / d, y: -dz / d, b: false });
    }
  }

  shell = createShell({
    load: loadScene,
    respawn: (item) => {
      setTimeout(() => {
        if (!sim || currentScene !== shell.state.scene) return;
        const prop = sim.spawnProp(item.type, item.x, item.z, item.rot || 0, (item.y || 0) + 0.4, { tag: item.tag, counted: true });
        if (prop) prop.noSwallowUntil = sim.time() + 1.2;
        shell.refreshLabels();
      }, 450);
    },
    fx, sfx, players, music: () => playMusic()
  });

  const panel = createPanel(root, {
    getStats: () => stats,
    audio,
    shell,
    scenes: () => ({ screen: shell.state.screen, variant: shell.state.variant }),
    show: (screen, variant) => shell.show(screen, variant),
    getSnapshot: () => ({
      screen: shell.state.screen,
      variant: shell.state.scene ? shell.state.scene.id : null,
      stars: shell.stars(),
      progress: { ...shell.state.progress },
      owned: [...shell.state.owned],
      audioPicks: Object.fromEntries((audio.categories() || []).map((c) => [c.id, audio.pick(c.id)])),
      players: Array.from(players.values()).map((p) => { const h = sim.holes.get(p.id); return { kind: p.kind, eaten: h ? h.eaten : 0, r: h ? h.r : 0 }; }),
      propsLeft: sim.props.size
    }),
    resetLevel,
    addBot,
    removeBots,
    spawn(type) {
      const h = sim.holes.get("mouse") || Array.from(sim.holes.values())[0];
      const x = h ? h.x + h.dirX * (h.r + PROPS[type].radius + 0.8) : 0;
      const z = h ? h.z + h.dirZ * (h.r + PROPS[type].radius + 0.8) : 0;
      sim.spawnProp(type, x, z, Math.random() * 6.28, 1.5, { loose: true });
    },
    element(el) {
      const h = sim.holes.get("mouse") || Array.from(sim.holes.values())[0];
      if (!h) return;
      h.element = el;
      h.elT = TUNE.fireTime;
      h.elLock = 1;
    }
  });

  results = createResults(root);
  shell.show("menu");

  let host = null;
  const lastPad = new Map();

  function padState(id) {
    const h = sim.holes.get(id);
    const p = players.get(id);
    if (!h || !p) return null;
    return {
      n: h.belly.length, top: h.belly.length ? PROPS[h.belly[h.belly.length - 1]].label : "",
      el: h.element || "", eaten: h.eaten, d: Math.round(h.r * 20) / 10
    };
  }

  async function startNet() {
    const netEl = root.querySelector("#tv-net");
    try {
      const { createHost } = await import("../net/nethost.js");
      host = await createHost({
        roomCode: params.get("room") || sessionStorage.getItem("osrodek.room") || "",
        handlers: {
          onPeerJoin() {},
          onPeerLeave(cid) { removePlayer(cid); lastPad.delete(cid); },
          onEvent(cid, msg) {
            if (msg.type !== MSG.JOIN) return;
            if (msg.proto !== PROTO) return;
            const pl = addPlayer(cid, "pad");
            if (!pl) { host.sendEvent(cid, { type: MSG.REJECT, reason: "full" }); return; }
            host.sendEvent(cid, { type: MSG.WELCOME, slot: pl.slot, color: pl.color, name: pl.name });
          },
          onInput(cid, v) {
            if (v.b && results && results.isOpen()) results.hide();
            if (players.has(cid)) sim.setInput(cid, v);
          }
        }
      });
      sessionStorage.setItem("osrodek.room", host.roomCode);
      root.querySelector("#tv-code").textContent = host.roomCode;
      let origin = location.origin;
      if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
        try {
          const r = await fetch("/lanip");
          if (r.ok) { const j = await r.json(); if (j.ip) origin = `${location.protocol}//${j.ip}:${location.port}`; }
        } catch (e) {}
      }
      const url = `${origin}${location.pathname}?role=pad&room=${host.roomCode}`;
      const qrBox = root.querySelector("#tv-qr");
      qrBox.innerHTML = "";
      if (window.QRCode) new window.QRCode(qrBox, { text: url, width: 132, height: 132, correctLevel: window.QRCode.CorrectLevel.M });
      netEl.textContent = url.replace(/^https?:\/\//, "").replace(/\?.*$/, "");
      netEl.title = url;
    } catch (e) {
      netEl.textContent = "offline — mouse & bots only";
      root.querySelector("#tv-code").textContent = "—";
    }
  }
  if (params.get("net") !== "0") startNet();
  else { root.querySelector("#tv-net").textContent = "net off — mouse & bots only"; root.querySelector("#tv-code").textContent = "—"; }

  function pushPads() {
    if (!host) return;
    for (const p of players.values()) {
      if (p.kind !== "pad") continue;
      const st = padState(p.id);
      if (!st) continue;
      const key = JSON.stringify(st);
      if (lastPad.get(p.id) === key) continue;
      lastPad.set(p.id, key);
      host.sendPad(p.id, st);
    }
  }

  let last = performance.now();
  let acc = 0;
  let frames = 0;
  let fpsClock = 0;
  let hudClock = 0;
  const clock = { t: 0 };

  function stepSim(n) {
    for (let i = 0; i < n; i++) {
      driveLocal();
      const t0 = performance.now();
      sim.step();
      stats.stepMs = stats.stepMs * 0.95 + (performance.now() - t0) * 0.05;
      handleEvents(sim.drainEvents());
    }
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    clock.t += dt;
    acc += dt;
    let n = 0;
    while (acc >= sim.STEP && n < 4) { acc -= sim.STEP; n++; }
    if (n === 4) acc = 0;
    stepSim(n);
    if (run && !results.isOpen()) {
      const justDone = run.tick(dt);
      if (justDone) {
        const level = run.level;
        const earnedIds = run.earned();
        const res = shell.finishLevel(level.id, earnedIds);
        sfx.jingle();
        view.kick(0.2);
        renderStars();
        results.show(level, earnedIds, { stars: shell.stars(), gained: res.gained }, () => shell.show("select"));
      }
    }
    syncMeshes();
    emitContinuous(dt);
    for (const [id, hv] of holeViews) {
      const h = sim.holes.get(id);
      if (h) hv.update(h, dt, clock.t);
    }
    fx.update(dt, TUNE.gravity);
    view.render(dt, clock.t);

    frames++;
    fpsClock += dt;
    hudClock += dt;
    if (fpsClock >= 0.5) {
      stats.fps = Math.round(frames / fpsClock);
      frames = 0;
      fpsClock = 0;
      stats.props = sim.props.size;
      let awake = 0;
      for (const p of sim.props.values()) if (!p.body.isFixed() && !p.body.isSleeping()) awake++;
      stats.awake = awake;
      panel.tick();
    }
    if (hudClock >= 0.25) { hudClock = 0; pushPads(); renderPlayers(); renderGoal(); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.__lab = {
    get sim() { return sim; },
    players, stats, view, modelCount, addBot,
    get shellRef() { return shell; },
    get runRef() { return run; }, removeBots, resetLevel, addPlayer, removePlayer,
    advance(seconds) {
      stepSim(Math.round(seconds * 60));
      if (run && !results.isOpen()) {
        if (run.tick(seconds)) {
          const level = run.level;
          const earnedIds = run.earned();
          const res = shell.finishLevel(level.id, earnedIds);
          renderStars();
          results.show(level, earnedIds, { stars: shell.stars(), gained: res.gained }, () => shell.show("select"));
        }
      }
      syncMeshes();
    }
  };
}
