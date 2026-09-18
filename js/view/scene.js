// Renderer, fixed diorama camera, lights and the stencil-cut ground (grass, decals, pond) of the lab baseplate.

import * as THREE from "three";
import { ARENA, POND, DECALS } from "../shared/level.js";

export const COLORS = {
  sky: "#19c2ff", outside: "#15a04a", grass: "#7ddc2c", grassEdge: "#52c234",
  pond: "#1786f2", pondLight: "#3fb3ff", pondShore: "#ffe08a"
};

export function groundMaterial(color, opts = {}) {
  return new THREE.MeshLambertMaterial({
    color,
    stencilWrite: true,
    stencilRef: 1,
    stencilFunc: THREE.NotEqualStencilFunc,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.KeepStencilOp,
    ...opts
  });
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function flat(shape, y, color, order) {
  const geo = new THREE.ShapeGeometry(shape, 1);
  geo.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(geo, groundMaterial(color, { side: THREE.DoubleSide }));
  mesh.position.y = y;
  mesh.renderOrder = order;
  mesh.receiveShadow = true;
  return mesh;
}

function blobShape(cx, cz, r, seed, points = 9) {
  const rnd = mulberry(seed);
  const shape = new THREE.Shape();
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const rr = r * (0.72 + rnd() * 0.5);
    const x = cx + Math.cos(a) * rr;
    const z = cz + Math.sin(a) * rr * 0.8;
    if (i === 0) shape.moveTo(x, z); else shape.lineTo(x, z);
  }
  return shape;
}

function ellipseShape(cx, cz, rx, rz, points, wobble, seed) {
  const rnd = mulberry(seed);
  const shape = new THREE.Shape();
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const k = 1 + (rnd() - 0.5) * wobble;
    const x = cx + Math.cos(a) * rx * k;
    const z = cz + Math.sin(a) * rz * k;
    if (i === 0) shape.moveTo(x, z); else shape.lineTo(x, z);
  }
  return shape;
}

function arenaShape(grow) {
  const hx = ARENA.hx + grow;
  const hz = ARENA.hz + grow;
  const c = 2.2;
  const shape = new THREE.Shape();
  shape.moveTo(-hx + c, -hz);
  shape.lineTo(hx - c, -hz);
  shape.lineTo(hx, -hz + c);
  shape.lineTo(hx, hz - c);
  shape.lineTo(hx - c, hz);
  shape.lineTo(-hx + c, hz);
  shape.lineTo(-hx, hz - c);
  shape.lineTo(-hx, -hz + c);
  shape.closePath();
  return shape;
}

export function createView(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: true, powerPreference: "high-performance" });
  const fitRatio = () => Math.min(window.devicePixelRatio || 1, 2, Math.max(1, Math.sqrt(2600000 / (window.innerWidth * window.innerHeight))));
  renderer.setPixelRatio(fitRatio());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.outside);

  const camera = new THREE.PerspectiveCamera(26, 16 / 9, 1, 300);
  const camDir = new THREE.Vector3(0, 0.8, 0.6).normalize();
  const camTarget = new THREE.Vector3(0, 0, 0.6);
  const shake = { t: 0, amp: 0 };

  scene.add(new THREE.HemisphereLight(0xffffff, 0x3aa84a, 1.35));
  const sun = new THREE.DirectionalLight(0xfff2d6, 2.1);
  sun.position.set(-10, 22, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 16;
  sun.shadow.camera.bottom = -16;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 70;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 5;
  scene.add(sun);

  const ground = new THREE.Group();
  scene.add(ground);

  const outsideGeo = new THREE.PlaneGeometry(400, 400);
  outsideGeo.rotateX(-Math.PI / 2);
  const outside = new THREE.Mesh(outsideGeo, groundMaterial(COLORS.outside));
  outside.position.y = -0.03;
  outside.renderOrder = -9;
  outside.receiveShadow = true;
  ground.add(outside);

  ground.add(flat(arenaShape(0.45), -0.015, COLORS.grassEdge, -8));
  ground.add(flat(arenaShape(0), 0, COLORS.grass, -7));

  let y = 0.012;
  for (const d of DECALS) {
    if (d.kind === "blob") ground.add(flat(blobShape(d.x, d.z, d.r, d.seed), y, d.color, -6));
    if (d.kind === "path") {
      const shape = new THREE.Shape();
      d.pts.forEach(([px, pz], i) => (i === 0 ? shape.moveTo(px, pz) : shape.lineTo(px, pz)));
      ground.add(flat(shape, y, d.color, -6));
    }
    y += 0.004;
  }

  ground.add(flat(ellipseShape(POND.x, POND.z, POND.rx + 0.5, POND.rz + 0.5, 14, 0.12, 21), 0.04, COLORS.pondShore, -5));
  const pond = flat(ellipseShape(POND.x, POND.z, POND.rx, POND.rz, 14, 0.1, 22), 0.05, COLORS.pond, -4);
  ground.add(pond);
  const pondInner = flat(ellipseShape(POND.x - 0.5, POND.z - 0.3, POND.rx * 0.55, POND.rz * 0.5, 9, 0.2, 23), 0.06, COLORS.pondLight, -3);
  ground.add(pondInner);

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(fitRatio());
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const vfov = (camera.fov * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const needW = (ARENA.hx + 1.6) / Math.tan(hfov / 2);
    const needH = ((ARENA.hz + 2.2) * 0.86) / Math.tan(vfov / 2);
    const dist = Math.max(needW, needH) + 6;
    camera.position.copy(camTarget).addScaledVector(camDir, dist);
    camera.lookAt(camTarget);
    camera.updateProjectionMatrix();
    camera.userData.base = camera.position.clone();
  }
  window.addEventListener("resize", resize);
  resize();

  return {
    renderer, scene, camera, pond: pondInner,
    kick(amp) { shake.amp = Math.max(shake.amp, amp); shake.t = 0.25; },
    render(dt, t) {
      pondInner.position.x = Math.sin(t * 0.6) * 0.18;
      pondInner.position.z = Math.cos(t * 0.45) * 0.12;
      if (shake.t > 0) {
        shake.t -= dt;
        const k = shake.amp * Math.max(0, shake.t / 0.25);
        camera.position.copy(camera.userData.base).add(new THREE.Vector3((Math.random() - 0.5) * k, (Math.random() - 0.5) * k, 0));
      } else if (camera.userData.base) camera.position.copy(camera.userData.base);
      renderer.render(scene, camera);
    },
    resize
  };
}
