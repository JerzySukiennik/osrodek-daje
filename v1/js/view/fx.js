// Pooled low-poly particles, falling "ghost" meshes for swallowed props and floating name popups.

import * as THREE from "three";

const MAX = 900;

export function createFx(scene, camera, overlay) {
  const geo = new THREE.TetrahedronGeometry(1, 0);
  const mat = new THREE.MeshBasicMaterial();
  const mesh = new THREE.InstancedMesh(geo, mat, MAX);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.setColorAt(0, new THREE.Color(1, 1, 1));
  mesh.frustumCulled = false;
  scene.add(mesh);

  const parts = [];
  for (let i = 0; i < MAX; i++) parts.push({ life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, g: 0, size: 0.1, spin: 0, drag: 0 });
  let cursor = 0;
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  const ghosts = [];
  const popups = [];
  const v3 = new THREE.Vector3();

  function emit(o) {
    const p = parts[cursor];
    const idx = cursor;
    cursor = (cursor + 1) % MAX;
    p.life = p.max = o.life || 0.6;
    p.x = o.x; p.y = o.y; p.z = o.z;
    p.vx = o.vx || 0; p.vy = o.vy || 0; p.vz = o.vz || 0;
    p.g = o.g == null ? 12 : o.g;
    p.size = o.size || 0.1;
    p.spin = Math.random() * 6;
    p.drag = o.drag || 0;
    mesh.setColorAt(idx, col.set(o.color || "#ffffff"));
    mesh.instanceColor.needsUpdate = true;
  }

  function burst(x, y, z, n, o) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (o.speed || 2) * (0.4 + Math.random() * 0.8);
      const up = (o.up == null ? 2 : o.up) * (0.5 + Math.random());
      const rr = (o.radius || 0) * Math.sqrt(Math.random());
      emit({
        x: x + Math.cos(a) * rr, y, z: z + Math.sin(a) * rr,
        vx: Math.cos(a) * sp, vy: up, vz: Math.sin(a) * sp,
        g: o.g, life: (o.life || 0.6) * (0.7 + Math.random() * 0.6),
        size: (o.size || 0.1) * (0.6 + Math.random() * 0.8),
        color: Array.isArray(o.color) ? o.color[(Math.random() * o.color.length) | 0] : o.color,
        drag: o.drag
      });
    }
  }

  function ghost(meshObj, vel) {
    ghosts.push({ mesh: meshObj, vx: vel[0] * 0.4, vy: Math.min(vel[1], -1), vz: vel[2] * 0.4, t: 0, s: meshObj.scale.x });
  }

  function popup(text, x, y, z, color) {
    if (!overlay) return;
    const el = document.createElement("div");
    el.className = "popup";
    el.textContent = text;
    if (color) el.style.setProperty("--pc", color);
    overlay.appendChild(el);
    popups.push({ el, x, y, z, t: 0 });
  }

  function update(dt, g) {
    for (let i = 0; i < MAX; i++) {
      const p = parts[i];
      if (p.life <= 0) {
        dummy.scale.setScalar(0);
        dummy.position.set(0, -50, 0);
      } else {
        p.life -= dt;
        p.vy -= p.g * dt;
        if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; p.vz *= k; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        const k = Math.max(0, p.life / p.max);
        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(p.spin + p.life * 3, p.spin * 2, 0);
        dummy.scale.setScalar(p.size * (0.3 + 0.7 * k));
      }
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    for (let i = ghosts.length - 1; i >= 0; i--) {
      const gh = ghosts[i];
      gh.t += dt;
      gh.vy -= g * dt;
      gh.mesh.position.x += gh.vx * dt;
      gh.mesh.position.y += gh.vy * dt;
      gh.mesh.position.z += gh.vz * dt;
      const k = Math.max(0, 1 - gh.t / 0.4);
      gh.mesh.scale.setScalar(gh.s * k);
      if (k <= 0) { scene.remove(gh.mesh); ghosts.splice(i, 1); }
    }

    for (let i = popups.length - 1; i >= 0; i--) {
      const p = popups[i];
      p.t += dt;
      v3.set(p.x, p.y + p.t * 1.4, p.z).project(camera);
      p.el.style.transform = `translate(-50%,-50%) translate(${((v3.x + 1) / 2) * overlay.clientWidth}px, ${((1 - v3.y) / 2) * overlay.clientHeight}px) scale(${Math.min(1, p.t * 8)})`;
      p.el.style.opacity = String(Math.max(0, 1 - Math.max(0, p.t - 0.7) / 0.4));
      if (p.t > 1.1) { p.el.remove(); popups.splice(i, 1); }
    }
  }

  return { emit, burst, ghost, popup, update };
}
