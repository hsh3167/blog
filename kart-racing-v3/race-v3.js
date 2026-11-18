'use strict';

const PHYSICS_DT = 1 / 120;
const TRIAL = 'trial';
const AI_DRIVERS = [
  { pace: 1.025, grip: 1.06, attack: 1.2, apex: 0.56, side: 1 },
  { pace: 0.985, grip: 0.96, attack: 0.65, apex: 0.29, side: -1 },
  { pace: 1.015, grip: 1.12, attack: 1.05, apex: 0.57, side: -1 },
  { pace: 1.035, grip: 0.91, attack: 1.35, apex: 0.38, side: 1 },
  { pace: 1.0, grip: 1.03, attack: 0.9, apex: 0.45, side: -1 },
  { pace: 0.975, grip: 1.02, attack: 0.78, apex: 0.34, side: 1 },
  { pace: 1.006, grip: 1.08, attack: 0.94, apex: 0.49, side: 1 },
  { pace: 0.995, grip: 0.98, attack: 1.14, apex: 0.35, side: -1 },
  { pace: 1.018, grip: 1.01, attack: 1.27, apex: 0.51, side: 1 },
  { pace: 0.991, grip: 1.09, attack: 0.82, apex: 0.48, side: -1 },
];
const AI_CLASSES = [
  { grip: 90, brake: 28, catchUp: 0.018, pass: 0.75 },
  { grip: 105, brake: 37, catchUp: 0.027, pass: 1 },
  { grip: 120, brake: 45, catchUp: 0.035, pass: 1.2 },
];
const DRIFT_COLORS = [0xffe2a1, 0x40c4ff, 0xff9100, 0xe040fb];

function stepHandling(k, inp, dt, onRoad, grounded) {
  const speed = Math.abs(k.speed);
  const turnControl = 1 - 0.41 * smooth(17, 82, speed);
  const response = k.drift ? 12 : 16;
  k.steerVis = lerp(k.steerVis, inp.steer, 1 - Math.exp(-response * dt));
  const turn = k.drift
    ? k.drift * (1.28 + 0.76 * k.steerVis * k.drift)
    : k.steerVis * 2.46 * turnControl;
  const surface = onRoad ? 1 : 0.68 + k.v.off * 0.25;
  const traction = (grounded ? 1 : 0.34) * surface;
  const direction = k.speed < 0 ? -1 : 1;
  const yaw = -turn * clamp(speed / 15, 0, 1) * k.v.hnd * dt * direction * (grounded ? 1 : 0.62);
  k.heading = Math.atan2(Math.sin(k.heading + yaw), Math.cos(k.heading + yaw));

  // Keep the velocity's direction as the body turns, then recover lateral grip.
  const sinYaw = Math.sin(yaw), cosYaw = Math.cos(yaw);
  const side = k.sideSpeed * cosYaw + k.speed * sinYaw;
  k.speed = k.speed * cosYaw - k.sideSpeed * sinYaw;
  const target = k.drift ? -k.drift * speed * (0.108 + 0.045 * k.steerVis * k.drift) : 0;
  const grip = (k.drift ? 98 : 150) * k.v.hnd * traction;
  const correction = (target - side) * (1 - Math.exp(-(k.drift ? 9 : 17) * traction * dt));
  k.sideSpeed = side + clamp(correction, -grip * dt, grip * dt);
  k.slip = Math.atan2(k.sideSpeed, Math.max(3, Math.abs(k.speed)));
  const sx = Math.sin(k.heading), cz = Math.cos(k.heading);
  k.pos.x += (sx * k.speed - cz * k.sideSpeed) * dt;
  k.pos.z += (cz * k.speed + sx * k.sideSpeed) * dt;
}

function resolveTrackWall(k) {
  const limit = track.wallD - 1.7;
  if (Math.abs(k.lat) <= limit) return;
  const side = Math.sign(k.lat), over = Math.abs(k.lat) - limit;
  const normal = track.R[k.idx], nx = normal.x * side, nz = normal.z * side;
  k.pos.x -= nx * over;
  k.pos.z -= nz * over;
  k.lat = side * limit;
  const sin = Math.sin(k.heading), cos = Math.cos(k.heading);
  const vx = sin * k.speed - cos * k.sideSpeed, vz = cos * k.speed + sin * k.sideSpeed;
  const into = vx * nx + vz * nz;
  if (into <= 0) return;
  const bounce = into > 9 ? 0.2 : 0;
  const retention = clamp(0.99 - into * 0.0065, 0.68, 0.98);
  const tangentX = (vx - into * nx) * retention, tangentZ = (vz - into * nz) * retention;
  const outX = tangentX - bounce * into * nx, outZ = tangentZ - bounce * into * nz;
  k.speed = outX * sin + outZ * cos;
  k.sideSpeed = -outX * cos + outZ * sin;
  if (into < 7) return;
  const tangent = track.H[k.idx];
  const target = Math.abs(angDiff(k.heading, tangent)) < Math.PI / 2 ? tangent : tangent + Math.PI;
  const turn = angDiff(k.heading, target) * clamp(into * 0.006, 0.05, 0.2);
  k.heading += turn;
  k.speed = outX * Math.sin(k.heading) + outZ * Math.cos(k.heading);
  k.sideSpeed = -outX * Math.cos(k.heading) + outZ * Math.sin(k.heading);
  if (into > 17) cancelDrift(k);
  impactV3(k, into);
}

function cancelDrift(k) {
  k.drift = 0;
  k.driftCharge = 0;
  k.driftIntent = 0;
  k._lastLvl = 0;
}

function resolveKartContacts() {
  for (let i = 0; i < karts.length; i++) {
    const a = karts[i];
    if (a.finished) continue;
    for (let j = i + 1; j < karts.length; j++) {
      const b = karts[j];
      if (b.finished || Math.abs(a.gy + a.y - b.gy - b.y) > 1.3) continue;
      const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d2 = dx * dx + dz * dz;
      if (d2 >= 10.89 || d2 < 1e-9) continue;
      const d = Math.sqrt(d2), nx = dx / d, nz = dz / d;
      const push = (3.3 - d) * 0.5;
      a.pos.x -= nx * push; a.pos.z -= nz * push;
      b.pos.x += nx * push; b.pos.z += nz * push;
      if (a.star > 0 && b.star <= 0) hitKart(b);
      else if (b.star > 0 && a.star <= 0) hitKart(a);
      const af = nx * Math.sin(a.heading) + nz * Math.cos(a.heading);
      const ar = -nx * Math.cos(a.heading) + nz * Math.sin(a.heading);
      const bf = nx * Math.sin(b.heading) + nz * Math.cos(b.heading);
      const br = -nx * Math.cos(b.heading) + nz * Math.sin(b.heading);
      const closing = a.speed * af + a.sideSpeed * ar - b.speed * bf - b.sideSpeed * br;
      if (closing <= 0) continue;
      const impulse = closing * 0.59;
      a.speed -= af * impulse; a.sideSpeed -= ar * impulse;
      b.speed += bf * impulse; b.sideSpeed += br * impulse;
      if (closing > 5) { impactV3(a, closing); impactV3(b, closing); }
    }
  }
}

function prepareRacingLine(tr) {
  const { N, H, sp } = tr;
  const span = Math.max(2, Math.round(7 / sp));
  tr.curvature = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    tr.curvature[i] = angDiff(H[wrapIndex(i - span, N)], H[wrapIndex(i + span, N)]) / (2 * span * sp);
  }
}

function wrapIndex(i, n) { return ((i % n) + n) % n; }

function planAI(k) {
  const { N, sp, halfW, curvature } = track;
  const profile = k.driver, level = AI_CLASSES[settings.cc];
  const top = currentMax(k);
  const speed = Math.max(0, k.speed);
  let targetSpeed = top, curve = 0;
  const sight = clamp(speed * speed / (2 * level.brake) + 24, 30, 125);
  for (let d = 5; d <= sight; d += 5) {
    const c = curvature[(k.idx + Math.round(d / sp)) % N];
    const cornerSpeed = Math.sqrt(level.grip * profile.grip * k.v.hnd / Math.max(0.0004, Math.abs(c)));
    targetSpeed = Math.min(targetSpeed, Math.sqrt(cornerSpeed ** 2 + 2 * level.brake * Math.max(0, d - 9)));
    if (d <= 35) curve += c / 7;
  }
  k.aiCurve = curve;
  const apex = clamp(-curve * 60, -1, 1) * halfW * profile.apex;
  let desired = apex;
  let blocker = null, frontGap = Infinity;
  for (const other of karts) {
    if (other === k || other.finished) continue;
    const ahead = (other.idx - k.idx + N) % N * sp;
    if (ahead > 0 && ahead < frontGap && ahead < (12 + speed * 0.65) * profile.attack * level.pass
      && other.speed < speed + 2 && Math.abs(other.lat - k.lat) < 4.4) {
      blocker = other;
      frontGap = ahead;
    }
  }

  // Aim for the inside line, with a commitment penalty to prevent weaving.
  const edge = halfW - 2.6;
  const lanes = [apex, -edge * 0.67, edge * 0.67, 0];
  let costBest = Infinity;
  for (const lane of lanes) {
    let cost = Math.abs(lane - apex) * (0.31 + Math.abs(curve) * 12)
      + Math.abs(lane - k.aiLaneTarget) * (k.aiPassT > 0 ? 0.79 : 0.23)
      - lane * profile.side * 0.014;
    for (const other of karts) {
      if (other === k || other.finished) continue;
      const samples = (other.idx - k.idx + N) % N;
      const dist = (samples > N / 2 ? samples - N : samples) * sp;
      if (dist < -8 || dist > 26 + speed * 0.42) continue;
      const width = Math.max(0, 4.9 - Math.abs(lane - other.lat));
      const closing = Math.max(0, speed - other.speed);
      cost += width * (dist < 0 ? 0.45 : 0.35 + closing * 0.08) * (1 - Math.min(1, Math.abs(dist) / 65));
    }
    if (blocker) cost += Math.max(0, 5.6 - Math.abs(lane - blocker.lat)) * 2.6;
    for (const p of projectiles) {
      if (p.type !== 'banana') continue;
      const dist = (p.idx - k.idx + N) % N * sp;
      if (dist < 35) cost += Math.max(0, 4.5 - Math.abs(lane - p.lat)) * 2.2;
    }
    if (cost < costBest) { costBest = cost; desired = lane; }
  }
  if (!blocker && k.aiPassT <= 0 && !k.item && k.roulette <= 0 && Math.abs(curve) < 0.018) {
    let itemCost = Infinity;
    for (const b of boxes) {
      if (!b.active) continue;
      const d = (b.idx - k.idx + N) % N * sp;
      if (d < 8 || d > 40) continue;
      const c = Math.abs(k.lat - b.lat) + d * 0.06;
      if (c < itemCost) { itemCost = c; desired = b.lat; }
    }
  }
  if (blocker && Math.abs(desired - k.aiLaneTarget) > 1) k.aiPassT = 0.65 + 0.25 * profile.attack;
  if (blocker && frontGap < 12 && Math.abs(k.lat - blocker.lat) < 3.5) {
    targetSpeed = Math.min(targetSpeed, Math.max(12, blocker.speed + (frontGap - 6) * 1.55));
  }
  if (Math.abs(k.lat) > halfW - 0.5) targetSpeed = Math.min(targetSpeed, top * 0.67);
  k.aiLaneTarget = clamp(desired, -edge, edge);
  k.aiSpeed = clamp(targetSpeed, top * 0.28, top);
}
