import RAPIER from "@dimforge/rapier3d-compat";
await RAPIER.init();
function trial(name, groups, enabled, fn) {
  const w = new RAPIER.World({ x: 0, y: -20, z: 0 });
  const g = w.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  w.createCollider(RAPIER.ColliderDesc.cuboid(50, 1, 50).setTranslation(0, -1, 0), g);
  const bodies = [];
  for (let i = 0; i < 30; i++) { const b = w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(i * 2 - 30, 0.3, 0)); w.createCollider(RAPIER.ColliderDesc.cuboid(0.3, 0.3, 0.3).setCollisionGroups(0x00020003), b); bodies.push(b); }
  const rig = w.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  const c = w.createCollider(RAPIER.ColliderDesc.cuboid(40, 1.5, 3).setTranslation(0, -1.5, 0).setCollisionGroups(groups).setEnabled(enabled), rig);
  for (let i = 0; i < 300; i++) w.step();
  const before = bodies.filter((b) => !b.isSleeping()).length;
  for (let i = 0; i < 60; i++) { fn(rig, c, i); w.step(); }
  console.log(name, "awake before", before, "after", bodies.filter((b) => !b.isSleeping()).length);
}
const tp = (rig, c, i) => rig.setTranslation({ x: i * 0.01, y: 0, z: 0 }, false);
trial("overlapping, filtered out, enabled, teleport", 0x00080004, true, tp);
trial("overlapping, filtered out, disabled, teleport", 0x00080004, false, tp);
trial("overlapping, filtered out, enabled, toggle", 0x00080004, true, (r, c, i) => c.setEnabled(i % 2 === 0));
