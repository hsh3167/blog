'use strict';

let effects = null;
let cameraShake = 0, speedEffect = 0;
const fxColor = new THREE.Color();

function initEffects() {
  const count = Q === QUALITY.low ? 72 : 240;
  const coords = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(coords, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setDrawRange(0, 0);
  const points = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.42, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  points.frustumCulled = false;
  scene.add(points);

  const markCount = Q === QUALITY.low ? 124 : 360;
  const marks = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
    color: 0x201a20, opacity: 0.44, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
  }), markCount);
  marks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  marks.count = 0;
  marks.frustumCulled = false;
  scene.add(marks);
  effects = { points, coords, colors, parts: [], count, marks, markCount, markIndex: 0, stamp: new THREE.Object3D() };
  cameraShake = 0;
  speedEffect = 0;
  $('speedLines').style.opacity = 0;
}

function emitV3(k, count, hex, kind) {
  if (!effects) return;
  const { parts } = effects;
  fxColor.setHex(hex);
  const angle = k.heading;
  const rear = kind === 'impact' ? 0 : 1.8;
  for (let i = 0; i < count; i++) {
    if (parts.length === effects.count) break;
    const side = rand(-1.2, 1.2);
    parts.push({
      x: k.pos.x - Math.sin(angle) * rear + Math.cos(angle) * side,
      y: k.gy + k.y + (kind === 'boost' ? 0.54 : 0.28),
      z: k.pos.z - Math.cos(angle) * rear - Math.sin(angle) * side,
      vx: -Math.sin(angle) * (kind === 'boost' ? 14 : 2) + rand(-6, 6),
      vy: rand(0.6, kind === 'impact' ? 8 : 3.5),
      vz: -Math.cos(angle) * (kind === 'boost' ? 14 : 2) + rand(-6, 6),
      r: fxColor.r, g: fxColor.g, b: fxColor.b, life: rand(0.13, kind === 'impact' ? 0.5 : 0.33),
    });
  }
}

function impactV3(k, force) {
  if (k.impactCooldown > 0) return;
  k.impactCooldown = 0.24;
  emitV3(k, Math.round(clamp(force * 0.6, 4, Q === QUALITY.low ? 9 : 24)), 0xffa63b, 'impact');
  if (k.isPlayer) {
    cameraShake = Math.max(cameraShake, clamp(force / 34, 0.14, 0.85));
    Sound.beep(125 - Math.min(35, force), 0.12, 'square', 0.06);
  }
}

function stampMark(k, stamp, x, z, last) {
  const dx = x - last.x, dz = z - last.z;
  const length = Math.hypot(dx, dz);
  if (length < 0.15 || length > 5.5) return;
  const y = groundY({ pos: { x, z }, idx: k.idx });
  stamp.position.set((x + last.x) * 0.5, (y + last.y) * 0.5 + 0.055, (z + last.z) * 0.5);
  stamp.rotation.set(-Math.PI / 2 + Math.atan2(y - last.y, length), Math.atan2(dx, dz), 0, 'YXZ');
  stamp.scale.set(0.26, Math.hypot(length, y - last.y) * 1.06, 1);
  stamp.updateMatrix();
  effects.marks.setMatrixAt(effects.markIndex, stamp.matrix);
  effects.markIndex = (effects.markIndex + 1) % effects.markCount;
  effects.marks.count = Math.min(effects.markCount, effects.marks.count + 1);
  effects.marks.instanceMatrix.needsUpdate = true;
}

function recordSkid(k) {
  const shouldMark = k.y === 0 && k.speed > 17 && Math.abs(k.lat) < track.halfW - 1.2
    && (k.drift || Math.abs(k.slip) > 0.12);
  if (!shouldMark) { k.skidWheels = null; return; }
  if (!k.skidWheels) k.skidWheels = [null, null];
  const sin = Math.sin(k.heading), cos = Math.cos(k.heading);
  for (let i = 0; i < 2; i++) {
    const side = i ? 1.02 : -1.02;
    const x = k.pos.x - sin * 1.45 + cos * side;
    const z = k.pos.z - cos * 1.45 - sin * side;
    const last = k.skidWheels[i];
    if (last) stampMark(k, effects.stamp, x, z, last);
    k.skidWheels[i] = { x, y: groundY({ pos: { x, z }, idx: k.idx }), z };
  }
}

function updateEffects(dt) {
  const { parts, coords, colors, points } = effects;
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    part.life -= dt;
    if (part.life <= 0) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
    part.x += part.vx * dt; part.y += part.vy * dt; part.z += part.vz * dt;
    part.vy -= 14 * dt;
  }
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i], j = i * 3, glow = Math.min(1, part.life * 7);
    coords[j] = part.x; coords[j + 1] = part.y; coords[j + 2] = part.z;
    colors[j] = part.r * glow; colors[j + 1] = part.g * glow; colors[j + 2] = part.b * glow;
  }
  points.geometry.setDrawRange(0, parts.length);
  if (parts.length) {
    points.geometry.attributes.position.updateRange.count = parts.length * 3;
    points.geometry.attributes.color.updateRange.count = parts.length * 3;
    points.geometry.attributes.position.needsUpdate = points.geometry.attributes.color.needsUpdate = true;
  }
}

function disposeScene(root) {
  if (!root) return;
  const sharedTextures = new Set(Object.values(TEX));
  const geometries = new Set(), materials = new Set(), textures = new Set();
  root.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.isInstancedMesh) object.dispose();
    if (object.shadow?.map) object.shadow.map.dispose();
    if (object.material) for (const material of [object.material].flat()) materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) {
    for (const value of Object.values(material)) if (value?.isTexture && !sharedTextures.has(value)) textures.add(value);
    material.dispose();
  }
  for (const texture of textures) texture.dispose();
}
