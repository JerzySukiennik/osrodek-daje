// Builds one merged, vertex-coloured, flat-shaded geometry per prop type from the shared part lists.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { PROPS } from "../shared/props.js";

const cache = new Map();

export function useModelGeometries(map) {
  for (const [type, geo] of map) if (PROPS[type]) cache.set(type, geo);
}

export const propMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide });
export const burnMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide, color: 0x6a3a2a, emissive: 0x551800 });

function partGeometry(part) {
  const s = part.size;
  let geo;
  if (part.shape === "box") geo = new THREE.BoxGeometry(s[0], s[1], s[2]);
  else if (part.shape === "cyl") geo = new THREE.CylinderGeometry(s[2], s[0], s[1], part.seg || 10);
  else if (part.shape === "cone") geo = new THREE.ConeGeometry(s[0], s[1], part.seg || 8);
  else {
    geo = new THREE.IcosahedronGeometry(s[0], 1);
    if (part.squash && part.squash !== 1) geo.scale(1, part.squash, 1);
  }
  if (geo.index) geo = geo.toNonIndexed();
  geo.deleteAttribute("uv");
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(part.pos[0], part.pos[1], part.pos[2]),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(part.rot[0], part.rot[1], part.rot[2], "XYZ")),
    new THREE.Vector3(1, 1, 1)
  );
  geo.applyMatrix4(m);
  const c = new THREE.Color(part.color);
  const n = geo.attributes.position.count;
  const colors = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b; }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

export function propGeometry(type) {
  if (cache.has(type)) return cache.get(type);
  const parts = PROPS[type].parts.filter((p) => !p.nv).map(partGeometry);
  const geo = mergeGeometries(parts, false);
  geo.computeVertexNormals();
  cache.set(type, geo);
  return geo;
}

export function createPropMesh(type) {
  const mesh = new THREE.Mesh(propGeometry(type), propMaterial);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
