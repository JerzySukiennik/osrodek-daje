// Renderer, fixed diorama camera, lights and the stencil-cut ground (grass, decals, pond) of the lab baseplate.

import * as THREE from "three";
import { LAB_LEVEL } from "../shared/level.js";

export const COLORS = {
  skyTop: "#6ec6ff", skyLow: "#ffe3b8", outside: "#a4cf3e", grass: "#c6e344", grassEdge: "#aed53c",
  pond: "#1c8df0", pondLight: "#55bcff", pondShore: "#ffdf8e",
  hills: ["#7fae3c", "#9cc48f", "#c3dcd6"]
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

function arenaShape(arena, grow) {
  const hx = arena.hx + grow;
  const hz = arena.hz + grow;
  const c = Math.min(2.2, arena.hx * 0.25, arena.hz * 0.25);
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
  const skyCanvas = document.createElement("canvas");
  skyCanvas.width = 4;
  skyCanvas.height = 256;
  const skyCtx = skyCanvas.getContext("2d");
  const grad = skyCtx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, COLORS.skyTop);
  grad.addColorStop(0.42, COLORS.skyLow);
  grad.addColorStop(1, COLORS.skyLow);
  skyCtx.fillStyle = grad;
  skyCtx.fillRect(0, 0, 4, 256);
  const skyTex = new THREE.CanvasTexture(skyCanvas);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyTex;
  scene.fog = new THREE.Fog(COLORS.skyLow, 78, 190);

  const camera = new THREE.PerspectiveCamera(26, 16 / 9, 1, 300);
  const camDir = new THREE.Vector3(0, 0.66, 0.75).normalize();
  const camTarget = new THREE.Vector3(0, 0, 0.6);
  const shake = { t: 0, amp: 0 };

  scene.add(new THREE.HemisphereLight(0xf3eeff, 0xb7a2ff, 1.75));
  const sun = new THREE.DirectionalLight(0xffe2b5, 1.9);
  sun.position.set(-19, 15, 11);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -24;
  sun.shadow.camera.right = 24;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 90;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 8;
  scene.add(sun);

  const ground = new THREE.Group();
  scene.add(ground);

  let current = LAB_LEVEL;
  let pondInner = null;

  function setLevel(level) {
    current = level;
    for (const child of [...ground.children]) {
      ground.remove(child);
      child.geometry.dispose();
      child.material.dispose();
    }
    const col = { ...COLORS, ...(level.colors || {}) };
    const outsideGeo = new THREE.PlaneGeometry(900, 900);
    outsideGeo.rotateX(-Math.PI / 2);
    const outside = new THREE.Mesh(outsideGeo, groundMaterial(col.outside));
    outside.position.y = -0.03;
    outside.renderOrder = -9;
    outside.receiveShadow = true;
    ground.add(outside);
    ground.add(flat(arenaShape(level.arena, 0.45), -0.015, col.grassEdge, -8));
    ground.add(flat(arenaShape(level.arena, 0), 0, col.grass, -7));
    let y = 0.012;
    for (const d of (level.decals || []).filter((d) => !d.over)) {
      if (d.kind === "blob") ground.add(flat(blobShape(d.x, d.z, d.r, d.seed), y, d.color, -6));
      if (d.kind === "ring") ground.add(flat(ellipseShape(d.x, d.z, d.r, d.r * 0.8, 18, 0.04, d.seed || 1), y, d.color, -6));
      if (d.kind === "path") {
        const shape = new THREE.Shape();
        d.pts.forEach(([px, pz], i) => (i === 0 ? shape.moveTo(px, pz) : shape.lineTo(px, pz)));
        ground.add(flat(shape, y, d.color, -6));
      }
      y += 0.004;
    }
    pondInner = null;
    const P = level.pond;
    if (P) {
      ground.add(flat(ellipseShape(P.x, P.z, P.rx + 0.5, P.rz + 0.5, 14, 0.12, 21), 0.04, col.pondShore, -5));
      ground.add(flat(ellipseShape(P.x, P.z, P.rx, P.rz, 14, 0.1, 22), 0.05, col.pond, -4));
      pondInner = flat(ellipseShape(P.x - 0.5, P.z - 0.3, P.rx * 0.55, P.rz * 0.5, 9, 0.2, 23), 0.06, col.pondLight, -3);
      ground.add(pondInner);
    }
    let yOver = 0.075;
    for (const d of (level.decals || []).filter((d) => d.over)) {
      if (d.kind === "blob") ground.add(flat(blobShape(d.x, d.z, d.r, d.seed), yOver, d.color, -2));
      if (d.kind === "path") {
        const shape = new THREE.Shape();
        d.pts.forEach(([px, pz], i) => (i === 0 ? shape.moveTo(px, pz) : shape.lineTo(px, pz)));
        ground.add(flat(shape, yOver, d.color, -2));
      }
      yOver += 0.004;
    }
    resize();
  }

  const hillRnd = mulberry(77);
  COLORS.hills.forEach((color, i) => {
    const shape = new THREE.Shape();
    const half = 170 + i * 60;
    shape.moveTo(-half, -2);
    const n = 16 - i * 3;
    for (let k = 0; k <= n; k++) {
      const x = -half + (k / n) * half * 2;
      const peak = (k % 2 ? 1 : 0.45) * (7 + i * 9) * (0.6 + hillRnd() * 0.8);
      shape.lineTo(x, peak);
    }
    shape.lineTo(half, -2);
    const hill = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color, fog: true }));
    hill.position.set(0, 0, -34 - i * 38);
    scene.add(hill);
  });

  const fitPoint = new THREE.Vector3();

  function project(dist, corners) {
    camera.position.copy(camTarget).addScaledVector(camDir, dist);
    camera.lookAt(camTarget);
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();
    const box = { minX: 1e9, maxX: -1e9, minY: 1e9, maxY: -1e9, behind: false };
    for (const c of corners) {
      fitPoint.copy(c).project(camera);
      if (fitPoint.z > 1) box.behind = true;
      box.minX = Math.min(box.minX, fitPoint.x);
      box.maxX = Math.max(box.maxX, fitPoint.x);
      box.minY = Math.min(box.minY, fitPoint.y);
      box.maxY = Math.max(box.maxY, fitPoint.y);
    }
    return box;
  }

  function frameFits(dist, corners) {
    const b = project(dist, corners);
    return !b.behind && Math.max(-b.minX, b.maxX) <= 0.94 && Math.max(-b.minY, b.maxY) <= 0.9;
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(fitRatio());
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const a = current.arena;
    const pad = 1.2;
    const top = current.tall == null ? 3.2 : current.tall;
    const corners = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [0, top]) {
      corners.push(new THREE.Vector3(sx * (a.hx + pad), y, sz * (a.hz + pad)));
    }
    camTarget.set(0, top * 0.22, 0);
    let lo = 8;
    let hi = 40;
    while (!frameFits(hi, corners) && hi < 400) hi *= 1.5;
    for (let i = 0; i < 22; i++) {
      const mid = (lo + hi) / 2;
      if (frameFits(mid, corners)) hi = mid; else lo = mid;
    }
    for (let pass = 0; pass < 4; pass++) {
      const b = project(hi, corners);
      const offset = (b.maxY + b.minY) / 2;
      if (Math.abs(offset) < 0.006) break;
      camTarget.y += offset * hi * 0.22;
    }
    project(hi, corners);
    camera.userData.base = camera.position.clone();
  }
  window.addEventListener("resize", resize);
  setLevel(LAB_LEVEL);

  return {
    renderer, scene, camera, setLevel,
    kick(amp) { shake.amp = Math.max(shake.amp, amp); shake.t = 0.25; },
    render(dt, t) {
      if (pondInner) {
        pondInner.position.x = Math.sin(t * 0.6) * 0.18;
        pondInner.position.z = Math.cos(t * 0.45) * 0.12;
      }
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
