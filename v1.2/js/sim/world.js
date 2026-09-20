// Headless simulation: Rapier world, props, holes, swallowing, growth, spitting, fire, water. No rendering or DOM in here.

import { PROPS, MAX_PROP_RADIUS, eulerToQuat } from "../shared/props.js";
import { LAB_LEVEL } from "../shared/level.js";
import { GROUPS, createHoleRig } from "./holerig.js";

const STEP = 1 / 60;
const RIG_MARGIN = MAX_PROP_RADIUS * 2 + 1;

export function createSim(RAPIER, levelArg, TUNE) {
  const level = Array.isArray(levelArg) ? { ...LAB_LEVEL, items: levelArg } : levelArg;
  const ARENA = level.arena;
  const SPAWNS = level.spawns;
  const inPond = (x, z) => {
    const p = level.pond;
    if (!p) return false;
    const dx = (x - p.x) / p.rx, dz = (z - p.z) / p.rz;
    return dx * dx + dz * dz < 1;
  };
  const world = new RAPIER.World({ x: 0, y: -TUNE.gravity, z: 0 });
  world.timestep = STEP;

  const props = new Map();
  const holes = new Map();
  let events = [];
  let nextId = 1;
  let time = 0;
  let spreadClock = 0;

  const ground = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(ARENA.hx + 30, 1.5, ARENA.hz + 30)
      .setTranslation(0, -1.5, 0).setCollisionGroups(GROUPS.ground).setFriction(TUNE.friction),
    ground
  );
  const wallH = 12;
  for (const [x, z, hx, hz] of [
    [ARENA.hx + 1, 0, 1, ARENA.hz + 2], [-ARENA.hx - 1, 0, 1, ARENA.hz + 2],
    [0, ARENA.hz + 1, ARENA.hx + 2, 1], [0, -ARENA.hz - 1, ARENA.hx + 2, 1]
  ]) {
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(hx, wallH, hz).setTranslation(x, wallH - 3, z).setCollisionGroups(GROUPS.wall),
      ground
    );
  }

  function emit(type, data) {
    events.push({ type, ...data });
  }

  function partCollider(part) {
    const s = part.size;
    let desc;
    if (part.shape === "box") desc = RAPIER.ColliderDesc.cuboid(s[0] / 2, s[1] / 2, s[2] / 2);
    else if (part.shape === "ball") desc = RAPIER.ColliderDesc.ball(s[0] * Math.min(1, part.squash || 1));
    else if (part.shape === "cyl") desc = RAPIER.ColliderDesc.cylinder(s[1] / 2, Math.max(s[0], s[2]));
    else desc = RAPIER.ColliderDesc.cone(s[1] / 2, s[0]);
    const q = eulerToQuat(part.rot[0], part.rot[1], part.rot[2]);
    return desc.setTranslation(part.pos[0], part.pos[1], part.pos[2]).setRotation(q);
  }

  function spawnProp(type, x, z, rot = 0, y = 0, opts = {}) {
    const def = PROPS[type];
    if (!def) return null;
    const anchored = !!def.anchored && !opts.loose;
    const desc = (anchored ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.dynamic())
      .setTranslation(x, y, z)
      .setRotation({ x: 0, y: Math.sin(rot / 2), z: 0, w: Math.cos(rot / 2) })
      .setLinearDamping(TUNE.propDamping)
      .setAngularDamping(TUNE.propDamping * 2);
    const body = world.createRigidBody(desc);
    for (const part of def.parts) {
      if (part.nc) continue;
      const cd = partCollider(part)
        .setDensity(def.density || 1)
        .setFriction(TUNE.friction)
        .setRestitution(def.bounce || 0.05)
        .setCollisionGroups(GROUPS.far);
      world.createCollider(cd, body);
    }
    const prop = {
      id: nextId++, type, def, body, anchored, near: false, ghostUntil: 0, noSwallowUntil: 0,
      tag: opts.tag || null, counted: !!opts.counted, burning: null, fuse: null, thrust: null, dead: false, stuck: 0
    };
    props.set(prop.id, prop);
    emit("spawn", { id: prop.id, prop: type, tag: prop.tag });
    return prop;
  }

  function setGroups(prop, groups) {
    const n = prop.body.numColliders();
    for (let i = 0; i < n; i++) prop.body.collider(i).setCollisionGroups(groups);
  }

  function removeProp(prop) {
    if (prop.dead) return;
    prop.dead = true;
    props.delete(prop.id);
    world.removeRigidBody(prop.body);
  }

  function addHole(id, color) {
    if (holes.has(id)) return holes.get(id);
    const used = new Set(Array.from(holes.values()).map((h) => h.slot));
    let slot = 0;
    while (used.has(slot)) slot++;
    const sp = SPAWNS[slot % SPAWNS.length];
    const r = TUNE.holeStartR;
    const hole = {
      id, color, slot, x: sp[0], z: sp[1], vx: 0, vz: 0, ix: 0, iy: 0, btn: false, wasBtn: false,
      charge: 0, r, area: Math.PI * r * r, dirX: 0, dirZ: -1, belly: [], eaten: 0,
      element: null, elT: 0, elLock: 0, fountainT: 0, moved: false,
      rig: createHoleRig(RAPIER, world, RIG_MARGIN, TUNE.rimFriction)
    };
    holes.set(id, hole);
    emit("holeAdd", { hole: id });
    return hole;
  }

  function removeHole(id) {
    const hole = holes.get(id);
    if (!hole) return;
    hole.rig.dispose();
    holes.delete(id);
    emit("holeRemove", { hole: id });
  }

  function setInput(id, input) {
    const hole = holes.get(id);
    if (!hole) return;
    let x = Number(input.x) || 0;
    let y = Number(input.y) || 0;
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    hole.ix = x;
    hole.iy = y;
    hole.btn = !!input.b;
  }

  function setElement(hole, element) {
    if (hole.element === element) return;
    hole.element = element;
    hole.elT = element === "fire" ? TUNE.fireTime : element === "water" ? TUNE.waterTime : 0;
    emit("element", { hole: hole.id, element });
  }

  function steam(hole) {
    setElement(hole, null);
    hole.elLock = 1.2;
    emit("steam", { hole: hole.id, x: hole.x, z: hole.z, r: hole.r });
  }

  function moveHole(hole, dt) {
    const speed = TUNE.holeSpeed * (1 + TUNE.speedPerR * (hole.r - TUNE.holeStartR));
    const tx = hole.ix * speed;
    const tz = -hole.iy * speed;
    const k = Math.min(1, TUNE.holeAccel * dt);
    hole.vx += (tx - hole.vx) * k;
    hole.vz += (tz - hole.vz) * k;
    const px = hole.x;
    const pz = hole.z;
    hole.x = Math.max(-ARENA.hx + hole.r * 0.3, Math.min(ARENA.hx - hole.r * 0.3, hole.x + hole.vx * dt));
    hole.z = Math.max(-ARENA.hz + hole.r * 0.3, Math.min(ARENA.hz - hole.r * 0.3, hole.z + hole.vz * dt));
    hole.moved = Math.abs(hole.x - px) + Math.abs(hole.z - pz) > 1e-5;
    const im = Math.hypot(hole.ix, hole.iy);
    if (im > 0.25) { hole.dirX = hole.ix / im; hole.dirZ = -hole.iy / im; }
  }

  function updateElement(hole, dt) {
    if (hole.elLock > 0) hole.elLock -= dt;
    if (hole.element === "fire") {
      hole.elT -= dt;
      if (hole.elT <= 0) setElement(hole, null);
    }
    const wet = inPond(hole.x, hole.z);
    if (hole.element === "water") {
      if (wet) hole.elT = TUNE.waterTime;
      else {
        hole.elT -= dt;
        if (hole.elT <= 0) { setElement(hole, null); emit("drained", { hole: hole.id, x: hole.x, z: hole.z, r: hole.r }); }
      }
    }
    if (hole.elLock <= 0 && wet) {
      if (hole.element === "fire") steam(hole);
      else if (hole.element !== "water") setElement(hole, "water");
    }
  }

  function spit(hole, power) {
    if (hole.element === "water") {
      hole.fountainT = TUNE.fountainS;
      emit("fountain", { hole: hole.id, x: hole.x, z: hole.z, r: hole.r });
      return;
    }
    const type = hole.belly.pop();
    if (!type) {
      emit("burp", { hole: hole.id, x: hole.x, z: hole.z });
      return;
    }
    const def = PROPS[type];
    const startY = -(def.height + 0.25);
    const apex = TUNE.spitApex + TUNE.spitApexCharge * power + def.height * 0.5;
    const g = TUNE.gravity;
    const vy = Math.sqrt(2 * g * (apex - startY));
    const tTotal = (vy + Math.sqrt(2 * g * apex)) / g;
    const side = TUNE.spitRange + TUNE.spitRangeCharge * power;
    const vh = side > 0.01 ? (hole.r + def.radius + side) / tTotal : 0;
    const prop = spawnProp(type, hole.x, hole.z, Math.random() * 6.28, startY, { loose: true, counted: true });
    prop.body.setLinvel({ x: hole.dirX * vh, y: vy, z: hole.dirZ * vh }, true);
    const spin = vh > 0 ? 5 : 1.2;
    prop.body.setAngvel({ x: (Math.random() - 0.5) * spin, y: (Math.random() - 0.5) * 3, z: (Math.random() - 0.5) * spin }, true);
    prop.ghostUntil = time + Math.min(0.35, (-startY + 0.15) / vy + 0.05);
    prop.noSwallowUntil = time + vy / g;
    prop.near = true;
    setGroups(prop, GROUPS.ghost);
    emit("spit", { hole: hole.id, id: prop.id, prop: type, x: hole.x, z: hole.z, power });
  }

  function updateButton(hole, dt) {
    if (hole.btn) hole.charge = Math.min(1, hole.charge + dt / TUNE.spitChargeS);
    if (!hole.btn && hole.wasBtn) {
      spit(hole, hole.charge);
      hole.charge = 0;
    }
    hole.wasBtn = hole.btn;
  }

  function ignite(prop) {
    if (prop.dead) return;
    if (prop.def.firework && !prop.fuse && !prop.thrust) {
      prop.fuse = 0.55;
      emit("fuse", { id: prop.id });
      return;
    }
    if (prop.def.bigRocket && !prop.thrust) {
      if (prop.anchored) { prop.anchored = false; prop.body.setBodyType(RAPIER.RigidBodyType.Dynamic, true); }
      prop.thrust = { t: 0, big: true };
      prop.body.setGravityScale(0, true);
      prop.body.setLinvel({ x: 0, y: 0.5, z: 0 }, true);
      prop.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      prop.body.lockRotations(true, true);
      setGroups(prop, GROUPS.ghost);
      emit("launch", { id: prop.id });
      return;
    }
    if (prop.def.flammable && !prop.burning) {
      prop.burning = { t: 0, dur: (prop.def.burn || TUNE.burnTime) * (0.85 + Math.random() * 0.3) };
      emit("ignite", { id: prop.id, size: prop.def.radius });
    }
  }

  function explode(prop) {
    const c = prop.body.translation();
    emit("explode", { id: prop.id, x: c.x, y: c.y, z: c.z });
    for (const other of props.values()) {
      if (other === prop || other.body.isFixed()) continue;
      const p = other.body.translation();
      const dx = p.x - c.x, dy = p.y - c.y + 0.4, dz = p.z - c.z;
      const d = Math.hypot(dx, dy, dz);
      if (d > 4) continue;
      const j = (other.body.mass() * 7) / (d + 0.6);
      other.body.applyImpulse({ x: (dx / (d + 0.01)) * j, y: Math.abs(dy / (d + 0.01)) * j + j * 0.4, z: (dz / (d + 0.01)) * j }, true);
      if (other.def.flammable && d < 2.2 && Math.random() < 0.5) ignite(other);
    }
    removeProp(prop);
  }

  function burnOut(prop) {
    const c = prop.body.translation();
    const n = Math.max(1, Math.min(7, Math.round(prop.def.grow * 5)));
    emit("burnout", { id: prop.id, x: c.x, y: c.y, z: c.z, size: prop.def.radius });
    removeProp(prop);
    if (prop.type === "tuft" || prop.type === "flower") return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28;
      const d = Math.random() * prop.def.radius * 0.5;
      const chunk = spawnProp("char", c.x + Math.cos(a) * d, c.z + Math.sin(a) * d, a, Math.max(0.05, c.y) + 0.1 + i * 0.12, { counted: false });
      if (chunk) chunk.noSwallowUntil = time + 0.2;
    }
  }

  function updateProps(dt) {
    const holeList = Array.from(holes.values());
    spreadClock += dt;
    const spreadTick = spreadClock >= 0.3;
    if (spreadTick) spreadClock = 0;

    for (const prop of Array.from(props.values())) {
      if (prop.dead) continue;
      const body = prop.body;
      const t = body.translation();

      if (prop.thrust) {
        prop.thrust.t += dt;
        if (prop.thrust.big) {
          const v = body.linvel();
          body.setLinvel({ x: 0, y: v.y + 14 * dt, z: 0 }, true);
          if (t.y > 70) { emit("gone", { id: prop.id }); removeProp(prop); }
        } else {
          const m = body.mass();
          const r = body.rotation();
          const ux = 2 * (r.x * r.y - r.w * r.z), uy = 1 - 2 * (r.x * r.x + r.z * r.z), uz = 2 * (r.y * r.z + r.w * r.x);
          const a = 46;
          body.applyImpulse({ x: ux * a * m * dt, y: uy * a * m * dt + TUNE.gravity * m * dt * 0.3, z: uz * a * m * dt }, true);
          if (prop.thrust.t > 1.0) explode(prop);
        }
        continue;
      }
      if (prop.fuse != null) {
        prop.fuse -= dt;
        if (prop.fuse <= 0) {
          prop.fuse = null;
          prop.thrust = { t: 0, big: false };
          body.setLinvel({ x: (Math.random() - 0.5) * 1.5, y: 4, z: (Math.random() - 0.5) * 1.5 }, true);
          emit("liftoff", { id: prop.id });
        }
      }

      if (prop.ghostUntil) {
        if (time < prop.ghostUntil) continue;
        prop.ghostUntil = 0;
        prop.near = false;
        setGroups(prop, GROUPS.far);
      }

      let near = false;
      let waker = false;
      for (const h of holeList) {
        const d = Math.hypot(t.x - h.x, t.z - h.z);
        const reach = h.r + prop.def.radius + 0.2;
        if (d < reach) {
          near = true;
          if (h.moved || Math.abs(h.r - h.rig.radius()) > 1e-4) waker = true;
          if (prop.anchored && d < h.r + prop.def.base * 0.45) {
            prop.anchored = false;
            body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
            emit("uproot", { id: prop.id });
          }
          if (h.element === "fire" && d < h.r + TUNE.fireReach && t.y < 2.5) ignite(prop);
          if (h.fountainT > 0 && d < h.r + 0.6 && !body.isFixed()) {
            const m = body.mass();
            const ox = t.x - h.x, oz = t.z - h.z;
            const od = Math.hypot(ox, oz) || 1;
            const push = TUNE.fountainPush * m * dt;
            body.applyImpulse({ x: (ox / od) * push, y: m * (TUNE.gravity + 30) * dt, z: (oz / od) * push }, true);
          }
        }
        if (h.fountainT > 0 && prop.burning && d < h.r + 3.2) {
          prop.burning = null;
          emit("extinguish", { id: prop.id });
        }
      }
      if (near !== prop.near) {
        prop.near = near;
        setGroups(prop, near ? GROUPS.near : GROUPS.far);
        body.wakeUp();
      } else if (waker && body.isSleeping()) {
        body.wakeUp();
      }

      if (prop.burning) {
        prop.burning.t += dt;
        if (spreadTick) {
          for (const other of props.values()) {
            if (other === prop || other.burning || !other.def.flammable) continue;
            const o = other.body.translation();
            const gap = Math.hypot(o.x - t.x, o.z - t.z) - prop.def.radius * 0.6 - other.def.radius * 0.6;
            if (gap < 0.45 && Math.abs(o.y - t.y) < 2 && Math.random() < TUNE.spreadChance) ignite(other);
          }
          for (const other of props.values()) {
            if ((other.def.firework || other.def.bigRocket) && !other.fuse && !other.thrust) {
              const o = other.body.translation();
              if (Math.hypot(o.x - t.x, o.z - t.z) < prop.def.radius + 0.8) ignite(other);
            }
          }
        }
        if (prop.burning.t >= prop.burning.dur) { burnOut(prop); continue; }
      }

      if (body.isFixed()) continue;

      const com = body.worldCom();
      let inside = null;
      for (const h of holeList) {
        if (Math.hypot(com.x - h.x, com.z - h.z) < h.r) { inside = h; break; }
      }
      if (inside && inside.element === "water" && prop.def.floats && com.y < 0.25) {
        const m = body.mass();
        const v = body.linvel();
        const lift = TUNE.gravity + (0.02 - com.y) * 60 - v.y * 9;
        body.applyImpulse({ x: -v.x * m * 2 * dt, y: m * Math.max(0, lift) * dt, z: -v.z * m * 2 * dt }, true);
        const w = body.angvel();
        body.setAngvel({ x: w.x * 0.94, y: w.y * 0.98, z: w.z * 0.94 }, true);
        continue;
      }
      let over = inside;
      if (!over && t.y < -0.04) {
        for (const h of holeList) if (Math.hypot(com.x - h.x, com.z - h.z) < h.r + prop.def.radius) { over = h; break; }
      }
      if (over && (com.y < 0.12 || t.y < -0.04) && time >= prop.noSwallowUntil && !(over.element === "water" && prop.def.floats)) {
        const m = body.mass();
        const dx = over.x - com.x, dz = over.z - com.z;
        const d = Math.hypot(dx, dz) || 1;
        const pull = TUNE.suction * Math.min(1, d / Math.max(0.15, over.r));
        body.applyImpulse({ x: (dx / d) * pull * m * dt, y: -TUNE.suction * 0.6 * m * dt, z: (dz / d) * pull * m * dt }, true);
        const v = body.linvel();
        if (Math.hypot(v.x, v.y, v.z) < 0.35) prop.stuck += dt; else prop.stuck = Math.max(0, prop.stuck - dt * 2);
        if (prop.stuck > 0.45) {
          prop.stuck = 0.2;
          const k = m * prop.def.radius * 3.5;
          body.applyTorqueImpulse({ x: (Math.random() - 0.5) * k, y: (Math.random() - 0.5) * k * 0.5, z: (Math.random() - 0.5) * k }, true);
          body.applyImpulse({ x: (dx / d) * m * 1.2, y: m * 1.5, z: (dz / d) * m * 1.2 }, true);
          emit("nudge", { id: prop.id });
        }
      } else prop.stuck = 0;
      const depth = Math.max(TUNE.swallowDepth, prop.def.radius * 0.55);
      if (inside && com.y < -depth && time >= prop.noSwallowUntil) {
        swallow(inside, prop, com);
        continue;
      }
      if (t.y < -12) removeProp(prop);
    }
  }

  function swallow(hole, prop, com) {
    const v = prop.body.linvel();
    const q = prop.body.rotation();
    const p = prop.body.translation();
    emit("swallow", {
      hole: hole.id, id: prop.id, prop: prop.type, size: prop.def.radius, counted: prop.counted, tag: prop.tag,
      pos: [p.x, p.y, p.z], quat: [q.x, q.y, q.z, q.w], vel: [v.x, v.y, v.z], wet: hole.element === "water"
    });
    const wasBurning = !!prop.burning;
    removeProp(prop);
    if (!prop.counted) {
      hole.area += prop.def.grow * TUNE.growth;
      hole.r = Math.sqrt(hole.area / Math.PI);
      hole.eaten++;
    }
    hole.belly.push(prop.type);
    if (hole.belly.length > 40) hole.belly.shift();
    if (prop.def.fireSource || wasBurning) {
      if (hole.element === "water") steam(hole);
      else { hole.element = null; setElement(hole, "fire"); }
    }
  }

  function step() {
    world.gravity = { x: 0, y: -TUNE.gravity, z: 0 };
    const list = Array.from(holes.values());
    for (const h of list) {
      moveHole(h, STEP);
      updateButton(h, STEP);
      updateElement(h, STEP);
    }
    if (list.length) {
      const nearLists = list.map(() => []);
      for (const prop of props.values()) {
        if (prop.body.isFixed() || prop.ghostUntil) continue;
        const t = prop.body.translation();
        for (let i = 0; i < list.length; i++) {
          const h = list[i];
          const reach = h.r + prop.def.radius + 0.6;
          const dx = t.x - h.x, dz = t.z - h.z;
          if (prop.near || dx * dx + dz * dz < reach * reach) nearLists[i].push({ x: t.x, z: t.z, rad: prop.def.radius + 0.35 });
        }
      }
      for (let i = 0; i < list.length; i++) {
        const h = list[i];
        h.rig.update(h.x, h.z, h.r, list.filter((o) => o !== h), nearLists[i]);
      }
    }
    updateProps(STEP);
    for (const h of list) {
      if (h.fountainT > 0) {
        h.fountainT -= STEP;
        if (h.fountainT <= 0) { setElement(h, null); h.elLock = 1.5; }
      }
    }
    world.step();
    time += STEP;
  }

  for (const it of level.items) spawnProp(it.type, it.x, it.z, it.rot || 0, it.y || 0, { tag: it.tag || null });
  events = [];

  return {
    STEP,
    world,
    props,
    holes,
    addHole,
    removeHole,
    setInput,
    spawnProp,
    ignite,
    step,
    time: () => time,
    drainEvents() {
      const out = events;
      events = [];
      return out;
    },
    dispose() {
      world.free();
    }
  };
}
