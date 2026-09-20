// Loads assets/models.glb (built by Niepotrzebne/blender/build.py) and bakes each named asset into one vertex-coloured geometry.

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export async function loadModelGeometries(url) {
  const gltf = await new GLTFLoader().loadAsync(url);
  gltf.scene.updateMatrixWorld(true);
  const out = new Map();
  for (const root of gltf.scene.children) {
    const pieces = [];
    root.traverse((node) => {
      if (!node.isMesh) return;
      let geo = node.geometry.clone();
      geo.applyMatrix4(node.matrixWorld);
      if (geo.index) geo = geo.toNonIndexed();
      for (const name of Object.keys(geo.attributes)) if (name !== "position") geo.deleteAttribute(name);
      const c = node.material && node.material.color ? node.material.color : new THREE.Color(1, 1, 1);
      const n = geo.attributes.position.count;
      const colors = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b; }
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      pieces.push(geo);
    });
    if (!pieces.length) continue;
    const merged = mergeGeometries(pieces, false);
    merged.computeVertexNormals();
    merged.computeBoundingSphere();
    out.set(root.name, merged);
  }
  return out;
}
