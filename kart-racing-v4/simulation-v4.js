'use strict';

const ARCADE = 'arcade';
const SIMULATION = 'simulation';
const arcadeMode = () => settings.driving === ARCADE;
const simulationMode = () => settings.driving === SIMULATION;
const SIM_AI_CLASSES = [
  { name: '클럽', grip: 5.3, brake: 5.0, pace: 0.84, pass: 0.8 },
  { name: '프로', grip: 7.0, brake: 6.3, pace: 0.95, pass: 1.0 },
  { name: '엘리트', grip: 7.8, brake: 7.2, pace: 1.0, pass: 1.13 },
];

// SI units. Aerodynamic areas combine the coefficient with reference area.
const RACE_CARS = {
  f1:     { mass: 810,  kw: 575, wheelbase: 3.18, front: 0.46, cg: 0.32, mu: 1.39, aero: 1.40, drag: 0.82, vmax: 82, rearDrive: 1 },
  lmp:    { mass: 950,  kw: 510, wheelbase: 3.05, front: 0.46, cg: 0.38, mu: 1.36, aero: 1.18, drag: 0.70, vmax: 84, rearDrive: 0.78 },
  gt:     { mass: 1330, kw: 398, wheelbase: 2.73, front: 0.51, cg: 0.49, mu: 1.28, aero: 0.66, drag: 0.82, vmax: 75, rearDrive: 1 },
  muscle: { mass: 1590, kw: 490, wheelbase: 2.82, front: 0.55, cg: 0.54, mu: 1.15, aero: 0.21, drag: 0.94, vmax: 79, rearDrive: 1 },
  rally:  { mass: 1210, kw: 292, wheelbase: 2.58, front: 0.56, cg: 0.55, mu: 1.25, aero: 0.45, drag: 0.85, vmax: 65, rearDrive: 0.52 },
  buggy:  { mass: 990,  kw: 255, wheelbase: 2.46, front: 0.45, cg: 0.61, mu: 1.13, aero: 0.02, drag: 1.07, vmax: 57, rearDrive: 0.65 },
};
const SIX_GEARS = [0.21, 0.34, 0.48, 0.64, 0.82, 1];
const G = 9.81;

function simSteeringLimit(speed) {
  return lerp(0.53, 0.095, smooth(5, 67, Math.abs(speed)));
}

function initializeSimKart(k) {
  k.spec = RACE_CARS[k.v.id];
  k.steerAngle = 0;
  k.yawRate = 0;
  k.longAccel = 0;
  k.latAccel = 0;
  k.tyreUse = 0;
  k.brakePedal = 0;
  k.brakePressure = 0;
  k.reverseDelay = 0;
  k.absAssist = false;
  k.cornerAssist = false;
  k.gear = 1;
  k.rpm = 1100;
  k.resetHold = 0;
}

function returnToCourse(k) {
  if (!k.spec || k.finished || k.resetHold > 0) return;

  const lanes = [0, -track.halfW * .35, track.halfW * .35, -track.halfW * .60, track.halfW * .60];
  const center = track.P[k.idx], right = track.R[k.idx];
  const slot = lanes.find(lane => {
    const x = center.x + right.x * lane, z = center.z + right.z * lane;
    return karts.every(other => other === k || (other.pos.x - x) ** 2 + (other.pos.z - z) ** 2 > 20);
  });
  if (slot === undefined) return;
  if (k.isPlayer) invalidateTimeTrial(k);
  k.pos.set(center.x + right.x * slot, 0, center.z + right.z * slot);
  k.heading = track.H[k.idx]; k.lat = slot; k.gy = track.Y[k.idx];
  k.speed = k.sideSpeed = k.yawRate = k.steerAngle = k.longAccel = k.latAccel = k.slip = 0;
  k.brakePressure = k.reverseDelay = 0;
  k.absAssist = false;
  k.cornerAssist = false;
  k.stuck = 0; k.aiLane = k.aiLaneTarget = slot;
  k.resetHold = 1.25;
  snapshotKart(k);
  if (k.isPlayer) toast('차량을 코스로 복귀시켰습니다');
}

function shiftTransmission(k, speed, throttle, dt) {
  const last = SIX_GEARS.length;
  const limit = k.spec.vmax * SIX_GEARS[k.gear - 1];
  if (k.gear < last && speed > limit * 0.95) k.gear++;
  else if (k.gear > 1 && speed < k.spec.vmax * SIX_GEARS[k.gear - 2] * 0.77) k.gear--;
  const inGear = speed / (k.spec.vmax * SIX_GEARS[k.gear - 1]);
  const target = clamp(1000 + inGear * 7150 + throttle * 280, 1000, 8500);
  k.rpm = lerp(k.rpm, target, 1 - Math.exp(-15 * dt));
}

function tyreForce(slip, longitudinalDemand, grip) {
  const lateralDemand = Math.tanh(slip * 9.5) * grip;
  const demand = Math.hypot(longitudinalDemand, lateralDemand);
  const ratio = Math.min(1, grip / Math.max(1, demand));
  return [longitudinalDemand * ratio, lateralDemand * ratio, Math.min(1, demand / Math.max(1, grip))];
}

// Reserve steering grip early when a player presses a direction and the brake together.
function assistedBrake(k, demand, frontLimit, rearLimit, frontSlip, rearSlip, steer) {
  if (demand <= 0) return [0, 0, false];
  const corner = smooth(0.014, 0.115, Math.abs(k.steerAngle));
  const support = k.isPlayer ? Math.max(corner, Math.abs(steer)) * smooth(6, 20, k.speed) : 0;
  const frontReserve = Math.max(0.54 * corner, 0.78 * support, (support > 0 ? 0.93 : 0.87) * Math.abs(Math.tanh(frontSlip * 9.5)));
  const rearReserve = Math.max(0.23 * corner, 0.36 * support, 0.86 * Math.abs(Math.tanh(rearSlip * 9.5)));
  const frontCap = frontLimit * Math.sqrt(0.96 ** 2 - frontReserve ** 2);
  const rearCap = rearLimit * Math.sqrt(0.96 ** 2 - rearReserve ** 2);
  const total = Math.min(demand, frontCap + rearCap);
  const bias = clamp(frontLimit / (frontLimit + rearLimit) - 0.12 * support, 0.38, 0.74);
  const front = clamp(total * bias, Math.max(0, total - rearCap), frontCap);
  return [front, total - front, demand - total > k.spec.mass * 0.06];
}

function cornerSpeedLimit(k) {
  const { curvature, sp, N } = track;
  if (!curvature) return Infinity;
  const decel = 3.8;
  const sight = Math.min(N * sp * 0.45, k.speed ** 2 / (2 * decel) + 22);
  const stride = Math.max(1, Math.round(Math.max(5, sight / 48) / sp));
  const reach = Math.ceil(sight / sp);
  const lateralBudget = 5.7 * k.spec.mu / RACE_CARS.gt.mu;
  let limitSquared = Infinity;
  for (let offset = 0; offset <= reach; offset += stride) {
    const bend = Math.abs(curvature[(k.idx + offset) % N]);
    const cornerSpeedSquared = lateralBudget / Math.max(0.0004, bend);
    const distance = Math.max(0, offset * sp - 12);
    limitSquared = Math.min(limitSquared, cornerSpeedSquared + 2 * decel * distance);
  }
  return Math.sqrt(limitSquared);
}

function updateSimulation(k, input, dt) {
  if (k.resetHold > 0) { k.resetHold -= dt; return; }
  const p = k.spec, m = p.mass, l = p.wheelbase;
  const u = k.speed, v = k.sideSpeed, r = k.yawRate;
  const speed = Math.abs(u), a = l * (1 - p.front), b = l * p.front;
  const brake = input.brake ? clamp(input.brakeAmount ?? 1, 0, 1) : 0;
  const accelerator = input.accel && !brake ? clamp(input.throttle ?? 1, 0, 1) : 0;
  const fdot = Math.sin(k.heading) * track.T[k.idx].x + Math.cos(k.heading) * track.T[k.idx].z;
  const slope = trackSlope(k.idx) * fdot;
  const shoulder = smooth(track.halfW - 0.4, track.halfW + 3.2, Math.abs(k.lat));
  const cornerSpeed = k.isPlayer && !k.finished && accelerator > 0 && u > 10 && fdot > 0.65 && shoulder < 0.4
    ? cornerSpeedLimit(k) : Infinity;
  const excess = u - cornerSpeed;
  const throttle = accelerator * (1 - smooth(-1.8, 0.8, excess));
  const autoBrake = 0.37 * smooth(0.25, 3.2, excess);
  const brakeTarget = Math.max(brake, autoBrake);
  k.brakePedal = brake;
  k.cornerAssist = accelerator - throttle > 0.06;
  const turnInput = k.isPlayer ? Math.abs(input.steer) * smooth(8, 22, u) : 0;
  const applyRate = lerp(22, 11, turnInput);
  k.brakePressure = lerp(k.brakePressure, brakeTarget, 1 - Math.exp(-(brakeTarget > k.brakePressure ? applyRate : 29) * dt));
  k.reverseDelay = brake > 0.1 && speed < 0.36 ? k.reverseDelay + dt : 0;
  shiftTransmission(k, speed, throttle, dt);

  const grip = p.mu * lerp(1, 0.52 + k.v.off * 0.18, shoulder);
  const aero = 0.6125 * p.aero * speed ** 2;
  const steeringLimit = simSteeringLimit(u);
  const gripAngle = Math.atan(l * grip * (G + aero / m) / Math.max(1, speed ** 2));
  const playerLimit = k.isPlayer
    ? Math.min(steeringLimit, gripAngle + lerp(0.142, 0.091, smooth(15, 55, speed)))
    : steeringLimit;
  k.steerAngle = lerp(k.steerAngle, input.steer * playerLimit, 1 - Math.exp(-12 * dt));
  k.steerVis = k.steerAngle / 0.53;
  const loadShift = clamp(m * k.longAccel * p.cg / l, -m * G * 0.24, m * G * 0.24);
  const frontLimit = (m * G * p.front - loadShift + aero * 0.43) * grip;
  const rearLimit = (m * G * (1 - p.front) + loadShift + aero * 0.57) * grip;
  const reverse = input.reverse !== false && brake > 0 && (u < -0.15 || k.reverseDelay > (k.isPlayer ? 0.38 : 0.25));
  const power = p.kw * 1000 * lerp(0.6, 1, smooth(1400, 5200, k.rpm));
  const top = currentMax(k);
  const driveThrottle = k.isPlayer ? throttle * (1 - smooth(0.025, 0.16, k.brakePressure)) : throttle;
  const engine = Math.min(m * (6.8 + p.kw / m * 3.4), power / Math.max(9, speed))
    * driveThrottle * (1 - smooth(top * 0.93, top * 1.04, u));
  const reverseDrive = reverse && u > -7 ? -m * 2.5 * brake : 0;
  const brakeForce = reverse ? 0 : Math.min(m * 14.1 * k.brakePressure, m * speed / dt);
  const forward = Math.max(2.4, u);
  const frontSlip = k.steerAngle - Math.atan2(v + a * r, forward);
  const rearSlip = -Math.atan2(v - b * r, forward);
  const [frontBrake, rearBrake, limiting] = assistedBrake(k, brakeForce, frontLimit, rearLimit, frontSlip, rearSlip, input.steer);
  k.absAssist = brake > 0.04 && speed > 2 && limiting;
  const drive = engine + reverseDrive;
  const frontDemand = drive * (1 - p.rearDrive) - frontBrake * Math.sign(u);
  const rearDemand = drive * p.rearDrive - rearBrake * Math.sign(u);
  const [frontX, frontY, frontUse] = tyreForce(frontSlip, frontDemand, frontLimit);
  const [rearX, rearY, rearUse] = tyreForce(rearSlip, rearDemand, rearLimit);
  const sin = Math.sin(k.steerAngle), cos = Math.cos(k.steerAngle);
  const fyFront = frontY * cos + frontX * sin;
  const fxFront = frontX * cos - frontY * sin;
  const drag = (0.6125 * p.drag * speed ** 2 + m * (0.145 + shoulder * (0.6 + 0.035 * speed)))
    * clamp(u / 0.5, -1, 1);
  const inertia = m * (l * 0.48) ** 2;
  k.longAccel = (fxFront + rearX - drag) / m - G * slope;
  k.latAccel = (fyFront + rearY) / m;
  k.tyreUse = Math.max(frontUse, rearUse);

  const slow = 1 - smooth(3, 8, u);
  const roadYaw = u * Math.tan(k.steerAngle) / l;
  const fastYaw = r + (a * fyFront - b * rearY) / inertia * dt;
  k.yawRate = lerp(clamp(fastYaw, -2.8, 2.8), roadYaw, slow);
  k.sideSpeed = lerp(v + (k.latAccel - u * r) * dt, b * roadYaw, slow);
  k.speed = u + (k.longAccel + v * r * (1 - slow)) * dt;
  if (!reverse && (brake > 0 || k.brakePressure > 0.04) && Math.sign(k.speed) !== Math.sign(u)) k.speed = 0;
  if (brake > 0 && !reverse && Math.abs(u) < 0.3 && !throttle) k.speed = 0;
  if (speed < 0.18 && !throttle && !brake && Math.abs(slope) < 0.02) k.speed = 0;
  k.heading = Math.atan2(Math.sin(k.heading - k.yawRate * dt), Math.cos(k.heading - k.yawRate * dt));
  k.slip = Math.atan2(k.sideSpeed, Math.max(4, Math.abs(k.speed)));
  const x = Math.sin(k.heading), z = Math.cos(k.heading);
  k.pos.x += (x * k.speed - z * k.sideSpeed) * dt;
  k.pos.z += (z * k.speed + x * k.sideSpeed) * dt;

  if (k.impactCooldown > 0) k.impactCooldown -= dt;
  project(k, true);
  resolveTrackWall(k);
  k.gy = groundY(k);
  k.pitch = lerp(k.pitch, Math.atan(slope) + clamp(k.longAccel / G, -1.5, 1.0) * 0.04, 1 - Math.exp(-8 * dt));
}
