// Hole visuals: stencil mask that cuts the ground, dark interior, player-coloured rim, charge arc, water surface and flames.

import * as THREE from "three";

const SEG = 48;

const maskGeo = new THREE.CircleGeometry(1, SEG).rotateX(-Math.PI / 2);
const maskMat = new THREE.MeshBasicMaterial({
  colorWrite: false, depthWrite: false, depthTest: false,
  stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc,
  stencilZPass: THREE.ReplaceStencilOp, stencilZFail: THREE.ReplaceStencilOp, stencilFail: THREE.ReplaceStencilOp
});

function interiorGeometry() {
  const geo = new THREE.CylinderGeometry(1, 0.92, 1, SEG, 1, true);
  geo.translate(0, -0.5, 0);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const top = new THREE.Color("#5b2a86");
  const bottom = new THREE.Color("#07030f");
  for (let i = 0; i < pos.count; i++) {
    const c = pos.getY(i) > -0.5 ? top : bottom;
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

const interiorGeo = interiorGeometry();
const interiorMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
const floorGeo = new THREE.CircleGeometry(0.92, SEG).rotateX(-Math.PI / 2);
const floorMat = new THREE.MeshBasicMaterial({ color: "#07030f" });
const rimGeo = new THREE.RingGeometry(1, 1.1, SEG).rotateX(-Math.PI / 2);
const waterGeo = new THREE.CircleGeometry(0.99, SEG).rotateX(-Math.PI / 2);
const waterMat = new THREE.MeshBasicMaterial({ color: "#1e9bf0" });
const waterShineGeo = new THREE.CircleGeometry(0.45, 7).rotateX(-Math.PI / 2);
const waterShineMat = new THREE.MeshBasicMaterial({ color: "#7fd0ff" });
const flameGeo = new THREE.ConeGeometry(0.22, 1, 5);
flameGeo.translate(0, 0.5, 0);
const flameMats = [
  new THREE.MeshBasicMaterial({ color: "#ff3d00" }),
  new THREE.MeshBasicMaterial({ color: "#ff9100" }),
  new THREE.MeshBasicMaterial({ color: "#ffea00" })
];

export function createHoleView(scene, color) {
  const group = new THREE.Group();
  const scaled = new THREE.Group();
  group.add(scaled);

  const mask = new THREE.Mesh(maskGeo, maskMat);
  mask.position.y = 0.08;
  mask.renderOrder = -20;
  scaled.add(mask);

  const interior = new THREE.Mesh(interiorGeo, interiorMat);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  group.add(interior, floor);

  const rim = new THREE.Mesh(rimGeo, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
  rim.position.y = 0.085;
  rim.renderOrder = -1;
  scaled.add(rim);

  const chargeMat = new THREE.MeshBasicMaterial({ color: "#ffffff", side: THREE.DoubleSide });
  let charge = new THREE.Mesh(new THREE.BufferGeometry(), chargeMat);
  charge.position.y = 0.09;
  charge.visible = false;
  scaled.add(charge);
  let chargeShown = -1;

  const water = new THREE.Mesh(waterGeo, waterMat);
  const shine = new THREE.Mesh(waterShineGeo, waterShineMat);
  water.visible = shine.visible = false;
  scaled.add(water, shine);

  const flames = [];
  for (let i = 0; i < 7; i++) {
    const f = new THREE.Mesh(flameGeo, flameMats[i % 3]);
    const a = (i / 7) * Math.PI * 2;
    const d = i === 0 ? 0 : 0.55;
    f.position.set(Math.cos(a) * d, -0.15, Math.sin(a) * d);
    f.userData.phase = i * 1.7;
    f.visible = false;
    scaled.add(f);
    flames.push(f);
  }

  scene.add(group);

  let pulse = 0;
  let shownR = 0.01;
  let waterLevel = 0;
  let fireLevel = 0;

  return {
    group,
    bump(amount) { pulse = Math.min(0.35, pulse + amount); },
    update(hole, dt, t) {
      shownR += (hole.r - shownR) * Math.min(1, dt * 9);
      pulse = Math.max(0, pulse - dt * 1.6);
      const wob = 1 + Math.sin(t * 30) * pulse * 0.25 + pulse * 0.2;
      const r = shownR * wob;
      group.position.set(hole.x, 0, hole.z);
      scaled.scale.set(r, 1, r);
      const depth = Math.max(2.2, shownR * 2.2);
      interior.scale.set(r, depth, r);
      floor.scale.set(r, 1, r);
      floor.position.y = -depth;

      if (hole.charge > 0.02) {
        const step = Math.round(hole.charge * 24);
        if (step !== chargeShown) {
          chargeShown = step;
          charge.geometry.dispose();
          charge.geometry = new THREE.RingGeometry(1.16, 1.3, SEG, 1, Math.PI / 2, -Math.PI * 2 * hole.charge).rotateX(-Math.PI / 2);
        }
        charge.visible = true;
      } else charge.visible = false;

      waterLevel += ((hole.element === "water" ? 1 : 0) - waterLevel) * Math.min(1, dt * 5);
      water.visible = shine.visible = waterLevel > 0.02;
      water.position.y = -1.2 + waterLevel * 1.12 + Math.sin(t * 2.4) * 0.015;
      shine.position.set(Math.sin(t * 0.9) * 0.2, water.position.y + 0.01, Math.cos(t * 0.7) * 0.2);

      fireLevel += ((hole.element === "fire" ? 1 : 0) - fireLevel) * Math.min(1, dt * 6);
      const ending = hole.element === "fire" && hole.elT < 3 ? 0.55 + 0.45 * Math.sin(t * 18) : 1;
      for (const f of flames) {
        f.visible = fireLevel > 0.03;
        const flick = 0.75 + 0.35 * Math.sin(t * 13 + f.userData.phase) + 0.2 * Math.sin(t * 29 + f.userData.phase * 2);
        const h = (1.0 + shownR * 0.9) * flick * fireLevel * ending;
        const inv = 1 / Math.max(0.3, r);
        f.scale.set((0.6 + shownR * 0.5) * inv * Math.min(1.4, r), h, (0.6 + shownR * 0.5) * inv * Math.min(1.4, r));
      }
    },
    dispose() {
      scene.remove(group);
      rim.material.dispose();
      charge.geometry.dispose();
    }
  };
}
