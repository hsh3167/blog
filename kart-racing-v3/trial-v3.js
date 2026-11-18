'use strict';

const TRIAL_RECORDS = 'super-kart-v3-time-trial-2';
const LEGACY_TRIAL_RECORDS = 'super-kart-v3-time-trial-1';
const GHOST_SAMPLE_INTERVAL = 0.1;
const GHOST_MAX_SAMPLES = 2402;
let ghostEnabled = true;
try { ghostEnabled = localStorage.getItem('super-kart-v3-ghost') !== 'off'; } catch (error) { }

function setGhostEnabled(enabled) {
  ghostEnabled = enabled;
  try { localStorage.setItem('super-kart-v3-ghost', enabled ? 'on' : 'off'); } catch (error) { }
}

function trialKey() {
  return TRACKS[settings.track].theme + ':' + CC[settings.cc].name;
}

function readRecordStore(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch (error) { return {}; }
}

function recordTime(value) {
  return Number.isFinite(value) && value > 0 ? value : null;
}

function readTrialRecords(store = readRecordStore(TRIAL_RECORDS)) {
  const course = store[trialKey()];
  const overall = course?.overall;
  const machine = course?.machines?.[VEHICLES[settings.veh].id];
  const legacy = readRecordStore(LEGACY_TRIAL_RECORDS)[trialKey()];
  const splits = machine?.splits;
  return {
    overall: {
      lap: recordTime(overall?.lap), total: recordTime(overall?.total),
      lapMachine: overall?.lapMachine, totalMachine: overall?.totalMachine,
    },
    machine: {
      lap: recordTime(machine?.lap), total: recordTime(machine?.total),
      splits: Array.isArray(splits) && splits.length === 4
        && splits.every((time, i) => recordTime(time) && (!i || time > splits[i - 1])) ? splits : null,
      replay: typeof machine?.replay === 'string' ? machine.replay : null,
    },
    legacy: { lap: recordTime(legacy?.lap), total: recordTime(legacy?.total) },
  };
}

function recordDelta(value, reference) {
  if (reference === null) return '';
  const diff = Math.round((value - reference) * 1000) / 1000;
  return ' (' + (diff >= 0 ? '+' : '−') + Math.abs(diff).toFixed(3) + '초)';
}

function initTimeTrial(k) {
  const { machine } = readTrialRecords();
  k.trialBaseline = machine;
  k.trialRunValid = true;
  k.trialLapValid = true;
  k.trialLapValidity = [];
  k.lastTrialSector = null;
  k.trialReplay = ghostEnabled ? loadTrialGhost(k, machine) : null;
}

function invalidateTimeTrial(k) {
  if (settings.mode !== TRIAL || !k || k.finished) return;
  k.trialRunValid = false;
  if (k.lap > 0) {
    k.trialLapValid = false;
    k.trialSamples = null;
  }
}

function beginTrialLap(k) {
  k.trialLapValid = true;
  k.trialSplits = [];
  k.trialSamples = [];
  k.nextGhostSample = 0;
  sampleTrialLap(k);
}

function recordTrialSector(k, sector) {
  if (!k.trialSplits) return;
  const time = raceTime - k.lapStart;
  k.trialSplits[sector - 1] = time;
  k.lastTrialSector = { sector, time };
}

function trialSectorLabel(k) {
  if (k.lap > 0 && !k.trialLapValid) return '이번 랩 기록 제외';
  const split = k.lastTrialSector;
  if (!split) return k.trialReplay ? '👻 머신 최고 랩 고스트' : '';
  const benchmark = k.trialBaseline.splits?.[split.sector - 1] ?? null;
  return '구간 ' + split.sector + '/4 누적 ' + fmt(split.time) + recordDelta(split.time, benchmark);
}

function finishTrialLap(k, lapTime) {
  recordTrialSector(k, 4);
  k.trialLapValidity.push(k.trialLapValid);
  if (k.trialLapValid && (k.bestLap === null || lapTime < k.bestLap)) k.bestLap = lapTime;
  if (!window.__autopilot) saveTrialLap(k, lapTime);
}

function saveTrialLap(k, lapTime) {
  const store = readRecordStore(TRIAL_RECORDS);
  const { overall, machine } = readTrialRecords(store);
  const faster = (time, record) => record === null || time < record - 1e-6;
  const machineLap = k.trialLapValid && faster(lapTime, machine.lap);
  const overallLap = k.trialLapValid && faster(lapTime, overall.lap);
  const totalEligible = k.finished && k.trialRunValid;
  const machineTotal = totalEligible && faster(k.finishTime, machine.total);
  const overallTotal = totalEligible && faster(k.finishTime, overall.total);
  if (!machineLap && !overallLap && !machineTotal && !overallTotal) return;

  const id = k.v.id;
  if (machineLap) {
    machine.lap = lapTime;
    machine.splits = k.trialSplits.slice();
    appendGhostPose(k);
    machine.replay = k.trialSamples ? encodeGhost(k.trialSamples) : null;
  }
  if (overallLap) { overall.lap = lapTime; overall.lapMachine = id; }
  if (machineTotal) machine.total = k.finishTime;
  if (overallTotal) { overall.total = k.finishTime; overall.totalMachine = id; }
  const key = trialKey();
  store[key] = { overall, machines: { ...store[key]?.machines, [id]: machine } };
  try {
    persistTrialRecords(store);
  } catch (error) {
    if (!machineLap || !machine.replay) { k.recordUnavailable = true; return; }
    machine.replay = null;
    try {
      persistTrialRecords(store);
      k.ghostUnavailable = true;
    } catch (retryError) { k.recordUnavailable = true; return; }
  }
  k.newMachineLap ||= machineLap;
  k.newOverallLap ||= overallLap;
  k.newMachineTotal ||= machineTotal;
  k.newOverallTotal ||= overallTotal;
}

function persistTrialRecords(store) {
  localStorage.setItem(TRIAL_RECORDS, JSON.stringify(store));
}

function sampleTrialLap(k) {
  if (!k.trialSamples || k.finished) return;
  const elapsed = raceTime - k.lapStart;
  if (elapsed + 1e-7 < k.nextGhostSample) return;
  appendGhostPose(k);
  k.nextGhostSample += GHOST_SAMPLE_INTERVAL;
}

function appendGhostPose(k) {
  if (!k.trialSamples) return;
  const heading = k.heading + k.spinAng;
  const frame = [
    Math.round(k.pos.x * 10), Math.round((groundY(k) + k.y) * 10), Math.round(k.pos.z * 10),
    Math.round(Math.atan2(Math.sin(heading), Math.cos(heading)) * 10000),
  ];
  if (k.trialSamples.length / 4 >= GHOST_MAX_SAMPLES || frame.some(value => !Number.isFinite(value) || Math.abs(value) > 32767)) {
    k.trialSamples = null;
    return;
  }
  k.trialSamples.push(...frame);
}

function encodeGhost(values) {
  let bytes = '';
  for (const value of values) bytes += String.fromCharCode(value & 255, (value >> 8) & 255);
  return btoa(bytes);
}

function decodeGhost(encoded, lapTime) {
  if (!encoded || encoded.length > Math.ceil(GHOST_MAX_SAMPLES * 8 / 3) * 4) return null;
  try {
    const bytes = atob(encoded);
    const expected = Math.ceil((lapTime - 1e-6) / GHOST_SAMPLE_INTERVAL) + 1;
    if (bytes.length !== expected * 8 || expected < 2) return null;
    const data = new Int16Array(bytes.length / 2);
    for (let i = 0; i < data.length; i++) data[i] = bytes.charCodeAt(i * 2) | (bytes.charCodeAt(i * 2 + 1) << 8);
    return data;
  } catch (error) { return null; }
}

function loadTrialGhost(k, machine) {
  const samples = decodeGhost(machine.replay, machine.lap);
  if (!samples) return null;
  const model = buildCar(k.v.id, k.ch);
  const { group, shadowBlob } = model;
  const materials = new Map();
  group.traverse(mesh => {
    if (!mesh.isMesh || mesh === shadowBlob || mesh === model.flame || model.sparks.includes(mesh)) return;
    mesh.castShadow = mesh.receiveShadow = false;
    if (materials.has(mesh.material)) return;
    mesh.material.transparent = true;
    mesh.material.depthWrite = false;
    mesh.material.color.lerp(new THREE.Color(0x48dfff), 0.55);
    materials.set(mesh.material, mesh.material.opacity);
  });
  shadowBlob.visible = false;
  group.visible = false;
  scene.add(group);
  return { group, samples, duration: machine.lap, materials };
}

function drawTrialGhost(k) {
  const ghost = k.trialReplay;
  if (!ghost) return;
  const time = raceTime - k.lapStart;
  ghost.group.visible = k.lap > 0 && !k.finished && time >= 0 && time < ghost.duration;
  if (!ghost.group.visible) return;
  const { group, samples } = ghost;
  const last = samples.length / 4 - 1;
  const a = Math.min(last - 1, Math.floor(time / GHOST_SAMPLE_INTERVAL));
  const b = a + 1;
  const t0 = a * GHOST_SAMPLE_INTERVAL;
  const t1 = b === last ? ghost.duration : b * GHOST_SAMPLE_INTERVAL;
  const ratio = clamp((time - t0) / Math.max(1e-6, t1 - t0), 0, 1);
  const i = a * 4, j = b * 4;
  group.position.set(
    lerp(samples[i], samples[j], ratio) / 10,
    lerp(samples[i + 1], samples[j + 1], ratio) / 10,
    lerp(samples[i + 2], samples[j + 2], ratio) / 10,
  );
  const heading = samples[i + 3] / 10000;
  group.rotation.y = heading + angDiff(heading, samples[j + 3] / 10000) * ratio;
  const dist = Math.hypot(group.position.x - k.pos.x, group.position.z - k.pos.z);
  const opacity = 0.08 + 0.38 * smooth(2.5, 7, dist);
  for (const [material, baseOpacity] of ghost.materials) material.opacity = baseOpacity * opacity;
}
