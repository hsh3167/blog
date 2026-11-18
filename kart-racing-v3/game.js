'use strict';
// =====================================================================
//  슈퍼 카트 그랑프리 V3
// =====================================================================
const $ = id => document.getElementById(id);
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
function angDiff(a, b) { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash2(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return lerp(lerp(hash2(xi, zi), hash2(xi + 1, zi), u), lerp(hash2(xi, zi + 1), hash2(xi + 1, zi + 1), u), v) * 2 - 1;
}
const fbm = (x, z) => vnoise(x, z) * 0.55 + vnoise(x * 2.07, z * 2.07) * 0.3 + vnoise(x * 4.3, z * 4.3) * 0.15;

// ================= 데이터 =================
const LAPS = 3;
const CC = [
  { name: '50cc', max: 48, acc: 30, ai: 0.86 },
  { name: '100cc', max: 60, acc: 36, ai: 0.93 },
  { name: '150cc', max: 72, acc: 42, ai: 0.98 },
];
const CHARS = [
  { name: '레오', emoji: '😎', look: 'helmet', color: 0xe53935, accent: 0xffffff, suit: 0xb71c1c },
  { name: '미아', emoji: '👩', look: 'hair', color: 0x1e88e5, accent: 0xffeb3b, suit: 0x0d47a1, hair: 0x6d4c41 },
  { name: '곰돌', emoji: '🐻', look: 'bear', color: 0x8d6e63, accent: 0xffcc80, suit: 0x5d4037 },
  { name: '냥냥', emoji: '🐱', look: 'cat', color: 0xff9800, accent: 0x212121, suit: 0xe65100 },
  { name: '로보', emoji: '🤖', look: 'robot', color: 0x90a4ae, accent: 0x00e5ff, suit: 0x455a64 },
  { name: '조이', emoji: '👽', look: 'alien', color: 0x64dd17, accent: 0x6a1b9a, suit: 0x33691e },
  { name: '펭구', emoji: '🐧', look: 'penguin', color: 0x263238, accent: 0xffa000, suit: 0x37474f },
  { name: '디노', emoji: '🦖', look: 'dino', color: 0x2e7d32, accent: 0xffeb3b, suit: 0x1b5e20 },
  { name: '카게', emoji: '🥷', look: 'ninja', color: 0x212121, accent: 0xd50000, suit: 0x111111 },
  { name: '판다', emoji: '🐼', look: 'panda', color: 0xf5f5f5, accent: 0x111111, suit: 0x424242 },
];
const VEHICLES = [
  { id: 'f1', name: '포뮬러 F1', icon: '🏎️', spd: 1.05, acc: 1.0, hnd: 1.1, off: 0.40, desc: '최고속 · 코너링' },
  { id: 'lmp', name: '르망 프로토', icon: '🏁', spd: 1.06, acc: 0.95, hnd: 1.0, off: 0.42, desc: '최고속 특화' },
  { id: 'gt', name: 'GT 스포츠카', icon: '🚗', spd: 1.02, acc: 1.03, hnd: 1.02, off: 0.45, desc: '밸런스형' },
  { id: 'muscle', name: '머슬카', icon: '🚙', spd: 1.07, acc: 1.07, hnd: 0.86, off: 0.45, desc: '파워 · 둔한 핸들' },
  { id: 'rally', name: '랠리카', icon: '🚘', spd: 0.98, acc: 1.08, hnd: 1.05, off: 0.70, desc: '오프로드 강함' },
  { id: 'buggy', name: '샌드 버기', icon: '🛻', spd: 0.95, acc: 1.15, hnd: 1.03, off: 0.85, desc: '가속 · 오프로드' },
];
const THEMES = {
  meadow: {
    skyTop: 0x2a74d8, skyHor: 0xcfeaff, fog: 0xcfe6f7, fogNear: 300, fogFar: 1700, sun: 0xfff1d6, sunI: 2.2, hemiS: 0xe3f2ff, hemiG: 0x55803f, hemiI: 0.75,
    low: 0x62c150, high: 0x3e8c34, rock: 0x8c8f78, snow: true, hills: 22, mount: 320, verge: 0x4fae3f, road: 0x8a8a92, curbA: 0xe53935, curbB: 0xffffff, wall: 'ads', sunDir: [0.5, 0.75, 0.35],
  },
  desert: {
    skyTop: 0x3c6fb8, skyHor: 0xffc58a, fog: 0xf5c090, fogNear: 250, fogFar: 1500, sun: 0xffd2a0, sunI: 2.4, hemiS: 0xffe0c0, hemiG: 0xb07a40, hemiI: 0.7,
    low: 0xe7c27f, high: 0xd29a55, rock: 0xa65a2e, snow: false, hills: 28, mount: 260, verge: 0xd8aa66, road: 0x9c8672, curbA: 0xff7043, curbB: 0xfff3e0, wall: 'adobe', sunDir: [-0.6, 0.35, -0.6],
  },
  castle: {
    skyTop: 0x050818, skyHor: 0x2a2468, fog: 0x1b1a48, fogNear: 180, fogFar: 1100, sun: 0xaab4ff, sunI: 0.9, hemiS: 0x8090ff, hemiG: 0x2a2050, hemiI: 0.65,
    low: 0x2f2858, high: 0x3d3272, rock: 0x201b40, snow: false, hills: 20, mount: 240, verge: 0x3a2f66, road: 0x5a5a78, curbA: 0xab47bc, curbB: 0x4fc3f7, wall: 'stone', night: true, sunDir: [0.3, 0.8, -0.5],
  },
  monza: {
    skyTop: 0x2f78d6, skyHor: 0xd8ecff, fog: 0xd6e6f2, fogNear: 350, fogFar: 1900, sun: 0xfff4e0, sunI: 2.3, hemiS: 0xe6f2ff, hemiG: 0x507a3c, hemiI: 0.75,
    low: 0x5aac46, high: 0x3f8a36, rock: 0x7d7d6c, snow: true, hills: 10, mount: 380, verge: 0x4ea83e, road: 0x7c7c86, curbA: 0xd32f2f, curbB: 0xffffff, wall: 'ads', fence: true, sunDir: [0.4, 0.7, 0.55],
  },
  spa: {
    skyTop: 0x5b86b8, skyHor: 0xdfe6ec, fog: 0xc9d3db, fogNear: 200, fogFar: 1300, sun: 0xfff0dc, sunI: 1.9, hemiS: 0xe0e8f0, hemiG: 0x40603a, hemiI: 0.85,
    low: 0x4e9540, high: 0x2f6a2c, rock: 0x6c6c5e, snow: false, hills: 45, mount: 300, verge: 0x46883a, road: 0x76767f, curbA: 0xd32f2f, curbB: 0xffffff, wall: 'ads', fence: true, sunDir: [-0.3, 0.6, 0.6],
  },
};
const TRACKS = [
  {
    name: '버섯 초원 서킷', desc: '★☆☆☆☆ 입문', theme: 'meadow', scale: 1.6, halfW: 13, off: 9, smooth: 150, music: 't0',
    pts: [[0, 0], [120, 0], [200, -20], [245, -90], [215, -170], [135, -195], [60, -155], [-5, -175], [-85, -215], [-175, -185], [-215, -105], [-185, -30], [-100, 0]],
    elev: [0, 0, 2, 6, 8, 5, 2, 0, 3, 6, 4, 1, 0],
    boxes: [0.16, 0.46, 0.74], dashes: [[0.30, -5], [0.60, 5], [0.88, 0]],
  },
  {
    name: '선셋 사막 캐년', desc: '★★☆☆☆ 헤어핀', theme: 'desert', scale: 1.6, halfW: 12, off: 9, smooth: 150, music: 't1',
    pts: [[0, 0], [150, 10], [260, -40], [285, -140], [225, -215], [160, -160], [115, -175], [90, -250], [-20, -295], [-150, -265], [-195, -180], [-115, -150], [-100, -90], [-195, -45], [-140, 25]],
    elev: [0, 0, 3, 8, 12, 10, 8, 5, 2, 0, 3, 6, 5, 2, 0],
    boxes: [0.12, 0.42, 0.70], dashes: [[0.25, 4], [0.55, -4], [0.84, 0]],
  },
  {
    name: '별빛 캐슬 (야간)', desc: '★★★☆☆ 테크니컬', theme: 'castle', scale: 1.6, halfW: 12, off: 8, smooth: 150, music: 't2',
    pts: [[0, 0], [140, 0], [220, 60], [305, 25], [325, -80], [255, -155], [150, -130], [60, -205], [-60, -225], [-155, -165], [-120, -85], [-205, -30], [-155, 55], [-60, 60]],
    elev: [0, 0, 4, 8, 6, 2, 0, 3, 7, 10, 6, 3, 1, 0],
    boxes: [0.10, 0.38, 0.66, 0.9], dashes: [[0.22, 0], [0.52, 4], [0.80, -4]],
  },
  {
    name: '몬차 스피드 서킷', desc: '★★★★☆ 난이도 상 · 초고속 직선과 시케인', theme: 'monza', scale: 1.35, halfW: 12, off: 7, smooth: 60, music: 't3', hard: 0.03,
    pts: [[0, 200], [0, -300], [0, -365], [12, -378], [34, -385], [40, -405], [36, -440], [40, -520], [80, -600], [160, -640], [215, -642], [235, -660], [258, -668], [280, -655], [330, -640], [358, -610], [372, -560], [368, -505], [355, -470], [330, -380], [292, -280], [292, -235], [275, -210], [255, -185], [250, -140], [220, -50], [180, 100], [160, 200], [150, 280], [110, 330], [50, 320], [10, 270]],
    elev: null,
    boxes: [0.08, 0.30, 0.52, 0.72, 0.9], dashes: [[0.03, 4], [0.62, -4], [0.8, 0]],
  },
  {
    name: '스파 아르덴 서킷', desc: '★★★★★ 난이도 최상 · 오 루즈 & 큰 고저차', theme: 'spa', scale: 1.1, halfW: 12, off: 7, smooth: 60, music: 't4', hard: 0.04,
    pts: [[0, 200], [0, -40], [10, -90], [45, -105], [75, -80], [85, 0], [85, 150], [90, 240], [120, 275], [125, 315], [160, 350], [300, 400], [480, 450], [520, 462], [540, 485], [565, 490], [590, 515], [595, 550], [590, 610], [570, 640], [540, 625], [500, 600], [460, 610], [430, 650], [425, 700], [410, 740], [380, 760], [340, 800], [280, 800], [180, 760], [80, 650], [20, 520], [-20, 400], [-25, 340], [5, 300], [5, 265]],
    elev: [9, 12, 13, 13, 12, 8, 3, 0, 5, 13, 19, 25, 29, 29, 28, 27, 25, 23, 19, 17, 16, 14, 12, 9, 7, 6, 5, 4, 4, 5, 7, 8, 9, 9, 9, 9],
    boxes: [0.10, 0.33, 0.55, 0.78], dashes: [[0.28, 0], [0.86, 4]],
  },
];
const ITEMS = {
  mushroom: { icon: '🍄' }, banana: { icon: '🍌' },
  green: { icon: '<span class="shell g"></span>' }, red: { icon: '<span class="shell r"></span>' }, star: { icon: '⭐' },
};
function rollItem(rank, total) {
  const r = rank / Math.max(1, total - 1);
  let table;
  if (r < 0.2) table = [['banana', 45], ['green', 40], ['mushroom', 15]];
  else if (r < 0.6) table = [['green', 25], ['red', 30], ['mushroom', 25], ['banana', 15], ['star', 5]];
  else table = [['red', 30], ['mushroom3', 30], ['star', 22], ['mushroom', 18]];
  let s = table.reduce((a, b) => a + b[1], 0), x = Math.random() * s;
  for (const [n, w] of table) { if ((x -= w) < 0) return n; }
  return table[0][0];
}

// ================= 상태 =================
let renderer, scene, camera, sun, skyMesh, envRT = null;
let track = null, theme = null, karts = [], player = null, projectiles = [], boxes = [], dashes = [], anims = [];
let state = 'menu', raceTime = 0, countT = 0, finishShowT = 0;
const QUALITY = {
  low: { name: '저사양', pr: 0.65, aa: false, shadow: 0, pbr: false, carPbr: false, deco: 0.18, clouds: 0, cell: 30, crowd: 60, fog: 0.55, treeShadow: false, fence: false, tone: false },
  mid: { name: '보통', pr: 1.0, aa: true, shadow: 1024, pbr: false, carPbr: true, deco: 0.6, clouds: 16, cell: 17, crowd: 220, fog: 0.85, treeShadow: false, fence: true },
  high: { name: '고화질', pr: 1.5, aa: true, shadow: 2048, pbr: true, carPbr: true, deco: 1.0, clouds: 45, cell: 12, crowd: 480, fog: 1.0, treeShadow: true, fence: true },
};
const Q_ORDER = ['low', 'mid', 'high'];
let savedQ = null; try { savedQ = localStorage.getItem('super-kart-v3-quality'); } catch (e) { }
let gpuName = '', softGPU = false;
const settings = { char: 0, veh: 0, track: 0, cc: 1, mode: 'race', q: QUALITY[savedQ] ? savedQ : 'mid' };
const autoQ = !QUALITY[savedQ];
let Q = QUALITY[settings.q];
let prScale = 1, fpsFrames = 0, fpsTime = 0;
let camHeading = 0, lookBack = false, lastCount = null, stateBefore = 'race';
let physicsLag = 0, hudLag = 0, minimapLag = 0;
let jumpQueued = false, itemQueued = false, itemBackQueued = false;
let raceLite = false, manualRaceQuality = false, lowFpsWindows = 0;
const FRAME_GAP_LIMIT = 0.25;
const frameSamples = [];
let frameWriteIndex = 0, frameStalls = 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ================= 입력 =================
const keys = {};
const KEY_HOP = ['Space', 'ShiftLeft', 'ShiftRight'];
const KEY_ITEM = ['KeyE', 'KeyQ', 'KeyF'];
const KEY_BRAKE = ['ArrowDown', 'KeyS', 'KeyZ'];
const isHeld = group => group.some(key => keys[key]);
const isDriving = () => state === 'race' || state === 'countdown';

addEventListener('keydown', e => {
  const code = e.code;
  if (state !== 'menu' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)
    && !e.target.closest?.('button')) e.preventDefault();
  if (isDriving() && !e.repeat && !e.target.closest?.('button')) {
    if (KEY_HOP.includes(code) && !isHeld(KEY_HOP)) jumpQueued = true;
    if (KEY_ITEM.includes(code) && !isHeld(KEY_ITEM) && !itemQueued) {
      itemQueued = true;
      itemBackQueued = isHeld(KEY_BRAKE);
    }
  }
  keys[code] = true;
  firstInteract();
  if (e.repeat) return;
  if (code === 'Escape' || code === 'KeyP') togglePause();
  if (code === 'KeyM') Sound.toggle();
  if (code === 'KeyB') Music.toggle();
  if (code === 'Enter' && state === 'menu' && !e.target.closest?.('button')) startRace();
});
addEventListener('keyup', e => { keys[e.code] = false; });
function clearQueuedInput() {
  jumpQueued = itemQueued = itemBackQueued = false;
}
function clearInput() {
  for (const key in keys) keys[key] = false;
  clearQueuedInput();
}
addEventListener('blur', clearInput);
addEventListener('visibilitychange', () => {
  if (document.hidden && isDriving()) togglePause('hidden');
  lastT = performance.now();
  physicsLag = 0;
});
addEventListener('pointerdown', () => firstInteract());
let interacted = false;
function firstInteract() {
  if (interacted) return; interacted = true;
  Sound.init();
  if (Sound.ctx && Sound.ctx.state === 'suspended') Sound.ctx.resume();
  if (state === 'menu') Music.play('menu');
}
let padPausePrev = false, padHopPrev = false, padItemPrev = false;
function readInput() {
  const k = keys;
  let steer = (k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0);
  let accel = !!(k.ArrowUp || k.KeyW || k.KeyX);
  let brake = isHeld(KEY_BRAKE), hop = isHeld(KEY_HOP);
  let back = !!(k.KeyC);
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  let padPaused = false, padHop = false, padItem = false;
  for (const gp of pads) {
    if (!gp) continue;
    const b = i => gp.buttons[i] && gp.buttons[i].pressed;
    const ax = gp.axes[0] || 0;
    if (Math.abs(ax) > 0.2) steer = ax;
    if (b(14)) steer = -1; if (b(15)) steer = 1;
    accel = accel || b(0) || b(7);
    brake = brake || b(1) || b(6) || (gp.axes[1] > 0.6);
    padHop = Boolean(b(5));
    padItem = Boolean(b(4) || b(3));
    hop ||= padHop;
    back = back || b(2);
    padPaused = Boolean(b(9));
    break;
  }
  if (padPaused && !padPausePrev) togglePause();
  padPausePrev = padPaused;
  const inp = { steer: clamp(steer, -1, 1), accel, brake, hop, back, hopPressed: padHop && !padHopPrev, itemPressed: padItem && !padItemPrev };
  padHopPrev = padHop; padItemPrev = padItem;
  return inp;
}

// ================= 사운드 / BGM =================
const Sound = {
  ctx: null, on: true, master: null, sfx: null, eng: null, engGain: null, filt: null,
  init() {
    if (this.ctx) return;
    try {
      const c = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = c.createGain(); this.master.connect(c.destination);
      this.sfx = c.createGain(); this.sfx.gain.value = 0.9; this.sfx.connect(this.master);
      this.eng = c.createOscillator(); this.eng.type = 'sawtooth';
      this.filt = c.createBiquadFilter(); this.filt.type = 'lowpass'; this.filt.frequency.value = 500;
      this.engGain = c.createGain(); this.engGain.gain.value = 0;
      this.eng.connect(this.filt); this.filt.connect(this.engGain); this.engGain.connect(this.sfx); this.eng.start();
      Music.setup(c, this.master);
    } catch (e) { this.ctx = null; }
  },
  engine(speed, active) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.eng.frequency.setTargetAtTime(50 + Math.abs(speed) * 2.3, t, 0.05);
    this.filt.frequency.setTargetAtTime(300 + Math.abs(speed) * 12, t, 0.1);
    this.engGain.gain.setTargetAtTime(active ? 0.035 : 0, t, 0.1);
  },
  beep(freq, dur = 0.12, type = 'square', vol = 0.08, slide = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.linearRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + dur + 0.02);
  },
  toggle() { this.on = !this.on; if (this.sfx) this.sfx.gain.value = this.on ? 0.9 : 0; toast(this.on ? '🔊 효과음 ON' : '🔇 효과음 OFF'); updateOptBtns(); },
};
const SONG_DEFS = {
  menu: { seed: 11, root: 60, bpm: 116, minor: false, prog: [0, 4, 5, 3, 0, 4, 3, 4], style: 'pop', arp: true },
  t0: { seed: 23, root: 62, bpm: 142, minor: false, prog: [0, 3, 4, 0, 5, 3, 4, 4], style: 'rock', arp: false },
  t1: { seed: 37, root: 57, bpm: 128, minor: true, prog: [0, 0, 5, 4, 0, 3, 6, 4], style: 'rock', arp: true },
  t2: { seed: 53, root: 59, bpm: 150, minor: true, prog: [0, 5, 2, 6, 0, 5, 3, 4], style: 'dance', arp: true },
  t3: { seed: 77, root: 64, bpm: 160, minor: false, prog: [0, 4, 5, 3, 0, 4, 3, 4], style: 'dance', arp: true },
  t4: { seed: 91, root: 62, bpm: 152, minor: true, prog: [0, 6, 5, 6, 0, 3, 4, 4], style: 'rock', arp: true },
};
const SONGS = {};
function genSong(def) {
  const R = mulberry32(def.seed);
  const scale = def.minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  const d2m = (deg, base) => { const o = Math.floor(deg / 7), i = ((deg % 7) + 7) % 7; return base + o * 12 + scale[i]; };
  const chords = def.prog.map(d => [d, d + 2, d + 4]);
  const bars = 8, mel = new Array(bars * 16).fill(null);
  const rhythms = [[0, 3, 6, 8, 10, 12, 14], [0, 2, 4, 6, 8, 11, 12, 14], [0, 4, 6, 8, 12, 14], [0, 3, 6, 10, 12], [0, 2, 3, 6, 8, 10, 11, 14], [0, 6, 8, 10, 12, 13, 14], [0, 2, 4, 8, 10, 12]];
  const phrase = () => {
    const r1 = rhythms[Math.floor(R() * rhythms.length)], r2 = rhythms[Math.floor(R() * rhythms.length)];
    const steps = [...r1, ...r2.map(s => s + 16)];
    let deg = 7 + [0, 2, 4][Math.floor(R() * 3)];
    return steps.map((s, i) => { deg = clamp(deg + [-2, -1, -1, 1, 1, 2, 0, 3, -3][Math.floor(R() * 9)], 4, 14); return { s, deg, len: (i < steps.length - 1 ? steps[i + 1] : 32) - s }; });
  };
  const A = phrase(), B = phrase(), C = phrase();
  [A, B, A, C].forEach((ph, pi) => ph.forEach(n => {
    const bar = pi * 2 + Math.floor(n.s / 16); let deg = n.deg;
    if (n.s % 8 === 0) { let best = deg, bd = 99; for (const c of chords[bar]) for (const o of [0, 7, 14]) { const cd = c + o; if (Math.abs(cd - deg) < bd) { bd = Math.abs(cd - deg); best = cd; } } deg = best; }
    mel[pi * 32 + n.s] = { deg, len: Math.min(n.len, 8) };
  }));
  return { bpm: def.bpm, bars, root: def.root, chords, mel, style: def.style, arp: def.arp, d2m };
}
const Music = {
  ctx: null, out: null, on: true, cur: null, curName: null, src: null, noise: null, pending: null, buffers: {}, jobs: {},
  setup(c, dest) {
    this.live = c; this.liveOut = c.createGain(); this.liveOut.gain.value = this.on ? 0.5 : 0; this.liveOut.connect(dest);
    if (this.pending) { const p = this.pending; this.pending = null; this.play(p); }
  },
  // 곡 전체를 미리 오디오 버퍼로 렌더링 → 화면이 버벅여도 음악은 끊기지 않음
  render(name) {
    if (this.buffers[name]) return Promise.resolve(this.buffers[name]);
    if (this.jobs[name]) return this.jobs[name];
    const song = SONGS[name] || (SONGS[name] = genSong(SONG_DEFS[name]));
    const sd = 60 / song.bpm / 4, steps = song.bars * 16, sr = 32000;
    const oc = new OfflineAudioContext(1, Math.ceil(steps * sd * sr), sr);
    this.ctx = oc; this.cur = song;
    this.out = oc.createGain(); this.out.gain.value = 0.8;
    const comp = oc.createDynamicsCompressor(); this.out.connect(comp); comp.connect(oc.destination);
    const nb = oc.createBuffer(1, sr, sr), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; this.noise = nb;
    for (let st = 0; st < steps; st++) this.playStep(st, st * sd, sd);
    this.ctx = null; this.out = null; this.cur = null;
    return this.jobs[name] = oc.startRendering().then(buf => { this.buffers[name] = buf; return buf; });
  },
  play(name) {
    if (!this.live) { this.pending = name; return; }
    if (this.curName === name) return;
    this.stop(); this.curName = name;
    this.render(name).then(buf => {
      if (this.curName !== name) return;
      const s = this.live.createBufferSource(); s.buffer = buf; s.loop = true; s.connect(this.liveOut); s.start(); this.src = s;
    }).catch(() => { });
  },
  setRate(r) { if (this.src) this.src.playbackRate.setTargetAtTime(r, this.live.currentTime, 0.3); },
  stop() { this.curName = null; this.pending = null; if (this.src) { try { this.src.stop(); } catch (e) { } this.src = null; } },
  toggle() { this.on = !this.on; if (this.liveOut) this.liveOut.gain.value = this.on ? 0.5 : 0; toast(this.on ? '🎵 BGM ON' : '🎵 BGM OFF'); updateOptBtns(); },
  tone(freq, t, dur, type, vol, cut = 4000, det = 0) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = type; o.frequency.value = freq; o.detune.value = det;
    f.type = 'lowpass'; f.frequency.value = cut;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.setValueAtTime(vol, t + Math.max(0.02, dur * 0.6)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(this.out); o.start(t); o.stop(t + dur + 0.05);
  },
  drum(kind, t) {
    const c = this.ctx;
    if (kind === 'kick') {
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.connect(g); g.connect(this.out); o.start(t); o.stop(t + 0.3); return;
    }
    const s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(), g = c.createGain();
    if (kind === 'snare') { f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8; g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16); this.tone(190, t, 0.08, 'triangle', 0.25); }
    else { f.type = 'highpass'; f.frequency.value = 7000; const l = kind === 'ohat' ? 0.15 : 0.04; g.gain.setValueAtTime(kind === 'ohat' ? 0.18 : 0.14, t); g.gain.exponentialRampToValueAtTime(0.001, t + l); }
    s.connect(f); f.connect(g); g.connect(this.out); s.start(t, Math.random() * 0.5, 0.3);
  },
  playStep(step, t, sd) {
    const s = this.cur, bar = Math.floor(step / 16), st = step % 16;
    const ch = s.chords[bar], mf = m => 440 * Math.pow(2, (m - 69) / 12);
    if (s.style === 'dance') { if (st % 4 === 0) this.drum('kick', t); if (st === 4 || st === 12) this.drum('snare', t); if (st % 4 === 2) this.drum('ohat', t); else if (st % 2 === 1) this.drum('hat', t); }
    else if (s.style === 'rock') { if (st === 0 || st === 8 || st === 10) this.drum('kick', t); if (st === 4 || st === 12) this.drum('snare', t); if (st % 2 === 0) this.drum('hat', t); if (bar === 7 && st >= 12) this.drum('snare', t); }
    else { if (st === 0 || st === 10) this.drum('kick', t); if (st === 8) this.drum('snare', t); if (st % 4 === 2) this.drum('hat', t); }
    if (st === 0) for (const d of ch) { const m = s.d2m(d, s.root - 12); this.tone(mf(m), t, sd * 16, 'sawtooth', 0.03, 1100, -8); this.tone(mf(m), t, sd * 16, 'sawtooth', 0.03, 1100, 8); }
    if (st % 2 === 0) { const pat = s.style === 'pop' ? [0, 0, 7, 0, 12, 0, 7, 0] : [0, 0, 12, 0, 0, 12, 7, 12]; const m = s.d2m(ch[0], s.root - 24) + pat[st / 2]; this.tone(mf(m), t, sd * 1.8, 'sawtooth', 0.16, 500); }
    if (s.arp && st % 2 === 1) { const m = s.d2m(ch[(st >> 1) % 3], s.root + 12); this.tone(mf(m), t, sd * 0.9, 'triangle', 0.04, 5000); }
    const n = s.mel[step];
    if (n) { const m = s.d2m(n.deg, s.root); const dur = n.len * sd * 0.92; this.tone(mf(m), t, dur, 'square', 0.05, 2600, -6); this.tone(mf(m), t, dur, 'square', 0.036, 2600, 7); }
  },
};

// ================= 텍스처 =================
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8;
  if (srgb) t.encoding = THREE.sRGBEncoding;
  return t;
}
function cloneTex(t, rx = 1, ry = 1) { const c = t.clone(); c.needsUpdate = true; c.repeat.set(rx, ry); return c; }
function shade(hex, l) { const c = new THREE.Color(hex); c.offsetHSL(0, 0, l / 255); return '#' + c.getHexString(); }
const TEX = {};
function makeTextures() {
  const rep = t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  TEX.asphalt = rep(canvasTex(512, 512, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { const v = 150 + (Math.random() - 0.5) * 60 + (Math.random() < 0.02 ? 40 : 0); img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(0,0,0,${rand(0.03, 0.08)})`; g.beginPath(); g.ellipse(rand(0, w), rand(0, h), rand(20, 80), rand(10, 40), rand(0, 3), 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(w * 0.3, 0, w * 0.12, h); g.fillRect(w * 0.58, 0, w * 0.12, h);
  }));
  TEX.detail = rep(canvasTex(256, 256, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; const n = fbm(x / 16, y / 16) * 0.5 + Math.random() * 0.5; const v = 205 + n * 50; img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0);
  }));
  TEX.dash = rep(canvasTex(16, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h / 2); }));
  TEX.fence = rep(canvasTex(64, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(210,210,210,0.9)'; g.lineWidth = 2;
    for (let i = -64; i < 128; i += 12) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke(); g.beginPath(); g.moveTo(i + 64, 0); g.lineTo(i, 64); g.stroke(); }
    g.fillStyle = '#999'; g.fillRect(0, 0, 3, h);
  }));
  const brands = [['TURBO COLA', '#e53935', '#fff'], ['NITRO OIL', '#212121', '#ffeb3b'], ['APEX TYRES', '#ffeb3b', '#111'], ['VELOCITY', '#1565c0', '#fff'], ['SUPER FUEL', '#2e7d32', '#fff'], ['HYPER DRIVE', '#6a1b9a', '#fff'], ['GRAND PRIX', '#ffffff', '#d32f2f'], ['KART-X', '#ff6f00', '#fff']];
  TEX.brands = brands;
  TEX.ads = rep(canvasTex(2048, 128, (g, w, h) => {
    brands.forEach((b, i) => {
      const x = i * w / 8; g.fillStyle = b[1]; g.fillRect(x, 0, w / 8, h);
      g.fillStyle = b[2]; g.font = 'bold italic 54px Arial Black, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(b[0], x + w / 16, h / 2 + 4);
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x, 0, w / 8, 8); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, h - 10, w / 8, 10);
    });
  }));
  const bricks = (base, mortar, v) => rep(canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = mortar; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 4; r++) for (let c = -1; c < 5; c++) { g.fillStyle = shade(base, rand(-v, v)); g.fillRect(c * 64 + (r % 2) * 32 + 2, r * 32 + 2, 60, 28); }
  }));
  TEX.stone = bricks('#6d6490', '#2c2544', 14);
  TEX.adobe = bricks('#c98a52', '#8d5a30', 16);
  TEX.blob = canvasTex(64, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,0.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.setTransform(1, 0, 0, 2, 0, -h / 2); g.fillStyle = gr; g.fillRect(0, 0, w, h * 2); });
  TEX.checker = canvasTex(256, 32, (g) => { for (let x = 0; x < 16; x++) for (let y = 0; y < 2; y++) { g.fillStyle = (x + y) % 2 ? '#111' : '#fff'; g.fillRect(x * 16, y * 16, 16, 16); } });
  TEX.cloud = canvasTex(256, 128, (g, w, h) => {
    for (let i = 0; i < 26; i++) { const x = rand(50, w - 50), y = rand(50, h - 30), r = rand(18, 42); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  });
  TEX.qbox = canvasTex(128, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h);
    ['#ff5252', '#ffeb3b', '#69f0ae', '#40c4ff', '#e040fb'].forEach((c, i) => gr.addColorStop(i / 4, c));
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
    g.font = 'bold 90px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.strokeStyle = '#333'; g.lineWidth = 6; g.strokeText('?', w / 2, h / 2 + 6); g.fillStyle = '#fff'; g.fillText('?', w / 2, h / 2 + 6);
  });
  TEX.arrow = canvasTex(64, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffeb3b'); gr.addColorStop(1, '#ff9800');
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#fff';
    for (let k = 0; k < 2; k++) { const y = 20 + k * 54; g.beginPath(); g.moveTo(8, y + 34); g.lineTo(32, y); g.lineTo(56, y + 34); g.lineTo(46, y + 40); g.lineTo(32, y + 20); g.lineTo(18, y + 40); g.fill(); }
  });
  TEX.windows = rep(canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 3; y++) for (let x = 0; x < 8; x++) { g.fillStyle = Math.random() < 0.3 ? '#9fd3ff' : '#2f4f6f'; g.fillRect(6 + x * 31, 10 + y * 40, 24, 28); }
  }));
}
function banner2(text, bg, fg) {
  return canvasTex(1024, 128, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = 'bold italic 76px Arial Black, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 4); });
}

// ================= 트랙 =================
function buildTrack(def) {
  const pts = def.pts.map(p => new THREE.Vector3(p[0] * def.scale, 0, p[1] * def.scale));
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  let N = 1400;
  let P = curve.getSpacedPoints(N); P.pop();
  for (let it = 0; it < def.smooth; it++) P = P.map((p, i) => { const a = P[(i - 1 + N) % N], b = P[(i + 1) % N]; return new THREE.Vector3((a.x + 2 * p.x + b.x) / 4, 0, (a.z + 2 * p.z + b.z) / 4); });
  const curve2 = new THREE.CatmullRomCurve3(P.filter((_, i) => i % 4 === 0), true);
  const len = curve2.getLength();
  N = Math.round(clamp(len / 2, 1000, 2000));
  P = curve2.getSpacedPoints(N); P.pop();
  const T = [], R = [], H = [], S = [];
  let acc = 0;
  for (let i = 0; i < N; i++) {
    const a = P[(i - 1 + N) % N], b = P[(i + 1) % N];
    const t = new THREE.Vector3().subVectors(b, a).normalize();
    T.push(t); R.push(new THREE.Vector3(-t.z, 0, t.x)); H.push(Math.atan2(t.x, t.z));
    S.push(acc); acc += P[i].distanceTo(P[(i + 1) % N]);
  }
  let Y = new Array(N).fill(0);
  if (def.elev) {
    for (let i = 0; i < N; i++) {
      let sw = 0, sh = 0;
      pts.forEach((p, j) => { const d2 = (P[i].x - p.x) ** 2 + (P[i].z - p.z) ** 2 + 1; const w = 1 / (d2 * d2); sw += w; sh += w * def.elev[j]; });
      Y[i] = sh / sw;
    }
    for (let it = 0; it < 200; it++) Y = Y.map((y, i) => (Y[(i - 1 + N) % N] + 2 * y + Y[(i + 1) % N]) / 4);
  }
  const tr = { def, N, P, T, R, H, S, Y, sp: len / N, halfW: def.halfW, off: def.off, wallD: def.halfW + def.off, len };
  let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
  for (const p of P) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); }
  tr.bounds = { minX, maxX, minZ, maxZ, cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2 };
  const cs = 40, map = new Map();
  for (let i = 0; i < N; i++) { const key = (Math.floor(P[i].x / cs) + 5000) * 10000 + Math.floor(P[i].z / cs) + 5000; let a = map.get(key); if (!a) map.set(key, a = []); a.push(i); }
  tr.hash = { cs, map };
  prepareRacingLine(tr);
  return tr;
}
function nearest(tr, x, z, rad = 2) {
  const { cs, map } = tr.hash; const cx = Math.floor(x / cs), cz = Math.floor(z / cs);
  let best = Infinity, bi = -1;
  for (let dx = -rad; dx <= rad; dx++) for (let dz = -rad; dz <= rad; dz++) {
    const a = map.get((cx + dx + 5000) * 10000 + cz + dz + 5000); if (!a) continue;
    for (const i of a) { const ex = x - tr.P[i].x, ez = z - tr.P[i].z, d = ex * ex + ez * ez; if (d < best) { best = d; bi = i; } }
  }
  return { d: Math.sqrt(best), i: bi };
}
function makeTerrainFn(tr, th) {
  const G = []; for (let i = 0; i < tr.N; i += 25) G.push({ x: tr.P[i].x, z: tr.P[i].z, y: tr.Y[i] });
  const b = tr.bounds, rad0 = Math.max(b.maxX - b.minX, b.maxZ - b.minZ) * 0.5 + 350;
  return (x, z) => {
    const nr = nearest(tr, x, z, 2);
    let sw = 0, sh = 0; for (const g of G) { const w = 1 / ((x - g.x) ** 2 + (z - g.z) ** 2 + 900); sw += w; sh += w * g.y; }
    const r = Math.hypot(x - b.cx, z - b.cz);
    const mt = smooth(rad0, rad0 + 600, r) * th.mount * (0.55 + 0.45 * fbm(x * 0.004 + 7, z * 0.004));
    const base = sh / sw + fbm(x * 0.006, z * 0.006) * th.hills + th.hills * 0.4 + mt;
    if (nr.i < 0) return base;
    return lerp(tr.Y[nr.i] - 0.35, base, smooth(tr.wallD + 3, tr.wallD + 70, nr.d));
  };
}
function ribbon(tr, a, b, yOff, mat, vScale, uFix) {
  const { N, P, R, Y, S } = tr; const pos = [], uv = [];
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N, p0 = P[i], p1 = P[j], r0 = R[i], r1 = R[j];
    const v0 = S[i] / vScale, v1 = (S[i] + p0.distanceTo(p1)) / vScale;
    const y0 = Y[i] + yOff, y1 = Y[j] + yOff;
    pos.push(p0.x + r0.x * a, y0, p0.z + r0.z * a, p0.x + r0.x * b, y0, p0.z + r0.z * b, p1.x + r1.x * a, y1, p1.z + r1.z * a,
      p0.x + r0.x * b, y0, p0.z + r0.z * b, p1.x + r1.x * b, y1, p1.z + r1.z * b, p1.x + r1.x * a, y1, p1.z + r1.z * a);
    const ua = uFix ? a / uFix : 0, ub = uFix ? b / uFix : 1;
    uv.push(ua, v0, ub, v0, ua, v1, ub, v0, ub, v1, ua, v1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m;
}
function wallMesh(tr, d, y0, h, mat, uScale) {
  const { N, P, R, Y, S } = tr; const pos = [], uv = [];
  const ok = new Array(N);
  for (let i = 0; i < N; i++) { const x = P[i].x + R[i].x * d, z = P[i].z + R[i].z * d; ok[i] = nearest(tr, x, z, 1).d > Math.abs(d) - 1.2; }
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N; if (!ok[i] || !ok[j]) continue;
    const x0 = P[i].x + R[i].x * d, z0 = P[i].z + R[i].z * d, x1 = P[j].x + R[j].x * d, z1 = P[j].z + R[j].z * d;
    const a0 = Y[i] + y0, a1 = Y[j] + y0;
    pos.push(x0, a0, z0, x1, a1, z1, x0, a0 + h, z0, x0, a0 + h, z0, x1, a1, z1, x1, a1 + h, z1);
    const u0 = S[i] / uScale, u1 = (S[i] + P[i].distanceTo(P[j])) / uScale;
    uv.push(u0, 0, u1, 0, u0, 1, u0, 1, u1, 0, u1, 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = Q.treeShadow; m.receiveShadow = true; return m;
}
function placeOnTrack(obj, tr, idx, lat, y = 0) {
  idx = ((idx % tr.N) + tr.N) % tr.N;
  obj.position.set(tr.P[idx].x + tr.R[idx].x * lat, tr.Y[idx] + y, tr.P[idx].z + tr.R[idx].z * lat);
  obj.rotation.y = tr.H[idx];
}
function std(color, o = {}) {
  if (Q.pbr) return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...o });
  const { roughness, metalness, envMapIntensity, ...r } = o;
  return new THREE.MeshLambertMaterial({ color, ...r });
}
function carMat(o) {
  if (Q.carPbr) return new THREE.MeshStandardMaterial(o);
  const { roughness, metalness, envMapIntensity, ...r } = o;
  return new THREE.MeshLambertMaterial(r);
}

// ================= 월드 =================
function makeSky(th) {
  const sd = new THREE.Vector3(...th.sunDir).normalize();
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(th.skyTop) }, hor: { value: new THREE.Color(th.skyHor) }, bot: { value: new THREE.Color(th.fog) }, sunCol: { value: new THREE.Color(th.sun) }, sunDir: { value: sd }, night: { value: th.night ? 1 : 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top, hor, bot, sunCol, sunDir; uniform float night; varying vec3 vP;
      void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(hor, top, pow(clamp(h,0.0,1.0), 0.5)) : mix(hor, bot, clamp(-h*8.0,0.0,1.0));
        float s = max(dot(normalize(vP), sunDir), 0.0);
        c += sunCol * (pow(s, 900.0) * 6.0 * (1.0-night) + pow(s, 14.0) * 0.35 * (1.0-night*0.7));
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(4500, 32, 16), mat);
}
function buildWorld(tr) {
  const def = tr.def, th = THEMES[def.theme]; theme = th;
  scene = new THREE.Scene();
  scene.userData.optionalScenery = [];
  scene.fog = new THREE.Fog(th.fog, th.fogNear * Q.fog, th.fogFar * Q.fog);
  anims = [];
  camera.far = th.fogFar * Q.fog + 200; camera.updateProjectionMatrix();
  skyMesh = makeSky(th); skyMesh.userData.dyn = true; scene.add(skyMesh);
  skyMesh.scale.setScalar((th.fogFar * Q.fog + 200) * 0.9 / 4500);
  if (Q.carPbr || Q.pbr) {
    const envScene = new THREE.Scene();
    envScene.add(makeSky(th));
    const pm = new THREE.PMREMGenerator(renderer);
    envRT = pm.fromScene(envScene, 0.04);
    pm.dispose();
    disposeScene(envScene);
    scene.environment = envRT.texture;
  }
  scene.add(new THREE.HemisphereLight(th.hemiS, th.hemiG, th.hemiI));
  sun = new THREE.DirectionalLight(th.sun, th.sunI);
  sun.userData.dir = new THREE.Vector3(...th.sunDir).normalize();
  sun.castShadow = Q.shadow > 0;
  sun.shadow.mapSize.set(Q.shadow || 512, Q.shadow || 512);
  const sr = Q.shadow >= 2048 ? 110 : 70; Object.assign(sun.shadow.camera, { left: -sr, right: sr, top: sr, bottom: -sr, near: 10, far: 900 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6;
  scene.add(sun); scene.add(sun.target);

  // 지형
  const terrainH = makeTerrainFn(tr, th); tr.terrainH = terrainH;
  const b = tr.bounds, pad = 1100;
  const W = b.maxX - b.minX + pad * 2, D = b.maxZ - b.minZ + pad * 2;
  const cell = Q.cell;
  const sx = Math.min(300, Math.round(W / cell)), sz = Math.min(300, Math.round(D / cell));
  const tg = new THREE.PlaneGeometry(W, D, sx, sz); tg.rotateX(-Math.PI / 2); tg.translate(b.cx, 0, b.cz);
  const pa = tg.attributes.position, cols = new Float32Array(pa.count * 3);
  const cLow = new THREE.Color(th.low), cHigh = new THREE.Color(th.high), cRock = new THREE.Color(th.rock), cSnow = new THREE.Color(0xf4f7fb), cV = new THREE.Color(th.verge), tmp = new THREE.Color();
  for (let i = 0; i < pa.count; i++) pa.setY(i, terrainH(pa.getX(i), pa.getZ(i)));
  tg.computeVertexNormals();
  const na = tg.attributes.normal;
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
    tmp.copy(cLow).lerp(cHigh, clamp(0.5 + fbm(x * 0.01, z * 0.01) * 0.9, 0, 1));
    tmp.lerp(cRock, smooth(0.12, 0.35, 1 - na.getY(i)));
    const nr = nearest(tr, x, z, 1); if (nr.i >= 0) tmp.lerp(cV, 1 - smooth(tr.wallD + 2, tr.wallD + 30, nr.d));
    if (th.snow) tmp.lerp(cSnow, smooth(170, 230, y + fbm(x * 0.02, z * 0.02) * 20));
    cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b;
  }
  tg.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const terrainMap = cloneTex(TEX.detail, W / 18, D / 18);
  const terrainMaterial = Q === QUALITY.low
    ? new THREE.MeshLambertMaterial({ vertexColors: true, map: terrainMap })
    : new THREE.MeshStandardMaterial({ vertexColors: true, map: terrainMap, roughness: 0.95 });
  const terrain = new THREE.Mesh(tg, terrainMaterial);
  terrain.receiveShadow = true; scene.add(terrain);

  // 도로
  scene.add(ribbon(tr, -tr.wallD - 1.5, tr.wallD + 1.5, -0.04, std(th.verge, { map: cloneTex(TEX.detail), roughness: 0.95 }), 18, 18));
  scene.add(ribbon(tr, -tr.halfW, tr.halfW, 0.0, std(th.road, { map: cloneTex(TEX.asphalt), roughness: 0.88 }), tr.halfW * 2));
  const curbTex = canvasTex(32, 64, (g, w, h) => { g.fillStyle = '#' + new THREE.Color(th.curbA).getHexString(); g.fillRect(0, 0, w, h / 2); g.fillStyle = '#' + new THREE.Color(th.curbB).getHexString(); g.fillRect(0, h / 2, w, h / 2); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, 0, 3, h); });
  curbTex.wrapT = THREE.RepeatWrapping;
  const curbM = std(0xffffff, { map: curbTex, roughness: 0.6 });
  scene.add(ribbon(tr, tr.halfW, tr.halfW + 1.8, 0.03, curbM, 7));
  scene.add(ribbon(tr, -tr.halfW - 1.8, -tr.halfW, 0.03, curbM, 7));
  const lineM = std(0xffffff, { roughness: 0.5, emissive: th.night ? 0x444466 : 0 });
  scene.add(ribbon(tr, tr.halfW - 0.9, tr.halfW - 0.5, 0.015, lineM, 10));
  scene.add(ribbon(tr, -tr.halfW + 0.5, -tr.halfW + 0.9, 0.015, lineM, 10));
  if (!/monza|spa/.test(def.theme)) scene.add(ribbon(tr, -0.25, 0.25, 0.015, std(0xffffff, { map: TEX.dash, transparent: true, emissive: th.night ? 0x444466 : 0 }), 14));

  // 벽
  let wmat;
  if (th.wall === 'ads') wmat = std(0xffffff, { map: cloneTex(TEX.ads), roughness: 0.5 });
  else wmat = std(0xffffff, { map: cloneTex(th.wall === 'stone' ? TEX.stone : TEX.adobe), roughness: 0.9, emissive: th.night ? 0x1a1030 : 0 });
  wmat.side = THREE.DoubleSide;
  const wh = th.wall === 'ads' ? 1.6 : 2.2, wu = th.wall === 'ads' ? 24 : 5;
  scene.add(wallMesh(tr, tr.wallD, 0, wh, wmat, wu));
  scene.add(wallMesh(tr, -tr.wallD, 0, wh, wmat, wu));
  if (th.fence && Q.fence) {
    const fm = new THREE.MeshStandardMaterial({ map: TEX.fence, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.6 });
    for (const s of [1, -1]) { const f = wallMesh(tr, s * (tr.wallD + 0.3), wh, 3.2, fm, 3.2); f.castShadow = false; scene.add(f); }
  }
  if (th.night) {
    scene.add(wallMesh(tr, tr.wallD - 0.05, wh, 0.25, new THREE.MeshBasicMaterial({ color: 0x4fc3f7, side: THREE.DoubleSide }), 5));
    scene.add(wallMesh(tr, -tr.wallD + 0.05, wh, 0.25, new THREE.MeshBasicMaterial({ color: 0xff66ff, side: THREE.DoubleSide }), 5));
  }

  // 출발선, 게이트, 관중석, 피트
  const sl = new THREE.Mesh(new THREE.PlaneGeometry(tr.halfW * 2, 3), std(0xffffff, { map: TEX.checker }));
  sl.rotation.x = -Math.PI / 2; sl.receiveShadow = true;
  const slg = new THREE.Group(); slg.add(sl); placeOnTrack(slg, tr, 0, 0, 0.05); scene.add(slg);
  scene.userData.startLights = null;
  addGantry(tr, 0, banner2('START  ·  FINISH', '#c62828', '#ffffff'), true);
  addGantry(tr, Math.floor(tr.N * 0.33), banner2(...TEX.brands[3]));
  addGantry(tr, Math.floor(tr.N * 0.66), banner2(...TEX.brands[1]));
  const gsN = def.theme === 'monza' ? 5 : def.theme === 'spa' ? 3 : 2;
  const gsStep = Math.round(64 / tr.sp);
  for (let k = 0; k < gsN; k++) addGrandstand(tr, (tr.N - Math.round(50 / tr.sp) - k * gsStep + tr.N * 2) % tr.N, 1);
  if (def.theme === 'monza') for (let k = 0; k < 3; k++) addGrandstand(tr, Math.floor(tr.N * 0.1) + k * gsStep, -1);
  if (def.theme === 'spa') addGrandstand(tr, Math.floor(tr.N * 0.14), -1);
  addPits(tr);

  // 대시 패널
  dashes = [];
  for (const [f, lat] of def.dashes) {
    const idx = Math.floor(f * tr.N);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(5, 8), std(0xffffff, { map: TEX.arrow, emissive: 0xffaa00, emissiveIntensity: 0.4, roughness: 0.4 }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = Math.PI; m.receiveShadow = true;
    const g = new THREE.Group(); g.add(m); placeOnTrack(g, tr, idx, lat, 0.06); scene.add(g);
    dashes.push({ idx, lat, mat: m.material });
  }
  // 아이템 박스
  boxes = [];
  const boxMat = std(0xffffff, { map: TEX.qbox, transparent: true, opacity: 0.88, emissive: 0xffffff, emissiveMap: TEX.qbox, emissiveIntensity: 0.25, roughness: 0.2, metalness: 0.1 });
  const boxGeo = new THREE.BoxGeometry(2.2, 2.2, 2.2);
  for (const f of settings.mode === TRIAL ? [] : def.boxes) {
    const idx = Math.floor(f * tr.N), n = 4, span = tr.halfW * 0.65;
    for (let k = 0; k < n; k++) {
      const m = new THREE.Mesh(boxGeo, boxMat); const lat = -span + 2 * span * k / (n - 1); placeOnTrack(m, tr, idx, lat, 1.6); m.castShadow = true;
      scene.add(m);
      m.userData.dyn = true; boxes.push({ mesh: m, idx, lat, x: m.position.x, z: m.position.z, y0: m.position.y, active: true, t: 0, ph: k * 0.7 });
    }
  }
  const decorationStart = scene.children.length;
  decorate(tr, th, def.theme);
  scene.userData.optionalScenery.push(...scene.children.slice(decorationStart));
  scene.traverse(o => { if (o !== sun && o !== sun.target && !o.userData.dyn) { o.updateMatrix(); o.matrixAutoUpdate = false; } });
  // 하늘 장식
  if (!th.night) {
    const cm = new THREE.SpriteMaterial({ map: TEX.cloud, fog: false, transparent: true, opacity: 0.9, depthWrite: false, color: def.theme === 'desert' ? 0xffe0c0 : 0xffffff });
    for (let i = 0; i < Q.clouds; i++) {
      const s = new THREE.Sprite(cm); const a = rand(0, TAU), r = rand(300, Math.min(2200, camera.far * 0.75));
      s.position.set(b.cx + Math.cos(a) * r, rand(250, 520), b.cz + Math.sin(a) * r); const w = rand(250, 600); s.scale.set(w, w * 0.45, 1); scene.add(s); scene.userData.optionalScenery.push(s);
    }
  } else {
    const sg = new THREE.BufferGeometry(), sp = [];
    for (let i = 0; i < 3000; i++) { const a = rand(0, TAU), e = rand(0.03, 1.5), r = 4000; sp.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r); }
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    skyMesh.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.5, fog: false, sizeAttenuation: false })));
    const moon = new THREE.Mesh(new THREE.SphereGeometry(120, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff9c4, fog: false }));
    moon.position.copy(sun.userData.dir).multiplyScalar(3500); skyMesh.add(moon);
  }
}
function addGantry(tr, idx, tex, main) {
  const g = new THREE.Group();
  const postMaterial = std(0xa7b4c6, { metalness: 0.55, roughness: 0.45 });
  const edge = tr.wallD + 1.5;
  const height = main ? 13.8 : 12.4;
  const postGeo = new THREE.BoxGeometry(0.55, height, 0.55);
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(postGeo, postMaterial);
    post.position.set(side * edge, height / 2, 0);
    g.add(post);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(edge * 2 + 0.6, 0.38, 0.38), postMaterial);
  beam.position.y = height;
  g.add(beam);
  const signGeometry = new THREE.PlaneGeometry(main ? 8.6 : 10, 1.35);
  const signMaterial = new THREE.MeshBasicMaterial({ map: tex });
  for (const side of [-1, 1]) {
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(-tr.halfW * 0.85, height + 0.75, side * 0.02);
    sign.rotation.y = side < 0 ? Math.PI : 0;
    g.add(sign);
  }
  if (main) {
    const lights = [];
    const lightGeo = new THREE.SphereGeometry(0.35, 12, 8);
    for (let i = 0; i < 5; i++) {
      const light = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0x330000 }));
      light.position.set((i - 2) * 0.89, height - 0.5, 0);
      g.add(light); lights.push(light);
    }
    scene.userData.startLights = lights;
  }
  placeOnTrack(g, tr, idx, 0, 0); scene.add(g);
}
function addGrandstand(tr, idx, side) {
  const g = new THREE.Group(), len = 60, rows = 8;
  const conc = std(0xbdbdbd, { roughness: 0.9 });
  for (let r = 0; r < rows; r++) { const s = new THREE.Mesh(new THREE.BoxGeometry(len, 1.1 * (r + 1), 1.6), conc); s.position.set(0, 0.55 * (r + 1), r * 1.6); s.castShadow = s.receiveShadow = true; g.add(s); }
  const n = Q.crowd;
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 1.0, 0.5), std(0xffffff, { roughness: 0.8 }), n);
  const mtx = new THREE.Matrix4(), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const r = Math.floor(Math.random() * rows);
    mtx.makeTranslation(rand(-len / 2 + 1, len / 2 - 1), 1.1 * (r + 1) + 0.5, r * 1.6 + rand(-0.3, 0.3)); im.setMatrixAt(i, mtx);
    c.setHSL(Math.random(), rand(0.5, 0.9), rand(0.35, 0.65)); im.setColorAt(i, c);
  }
  im.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 5, 6), 32);
  g.add(im);
  const roofM = std(0xffffff, { metalness: 0.3, roughness: 0.4 });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(len + 2, 0.4, rows * 1.6 + 3), roofM); roof.position.set(0, 1.1 * rows + 5, rows * 0.8 - 0.5); roof.castShadow = true; g.add(roof);
  for (let k = -2; k <= 2; k++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.1 * rows + 5, 8), roofM); p.position.set(k * len / 4.3, (1.1 * rows + 5) / 2, rows * 1.6); g.add(p); }
  const ad = new THREE.Mesh(new THREE.PlaneGeometry(len, 2), std(0xffffff, { map: cloneTex(TEX.ads, 0.5, 1) })); ad.position.set(0, 1.1 * rows + 6.3, -0.8); ad.rotation.y = Math.PI; g.add(ad);
  placeOnTrack(g, tr, idx, side * (tr.wallD + 8), -0.3);
  g.rotation.y = tr.H[idx] + (side > 0 ? -Math.PI / 2 : Math.PI / 2);
  // 트랙 반대쪽과 겹치면 생략
  const tp = new THREE.Vector3(0, 0, rows * 1.6 + 2).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y).add(g.position);
  if (nearest(tr, tp.x, tp.z, 1).d < tr.wallD + 3) return;
  scene.add(g);
}
function pitLocation(tr) {
  // Check the entire footprint against every nearby piece of the course.
  for (const meters of [80, 110, 145, 180, 220]) {
    const idx = Math.round(meters / tr.sp) % tr.N;
    const { P, R, T, wallD } = tr;
    for (const offset of [18, 25]) {
      for (const side of [-1, 1]) {
        const lat = side * (wallD + offset);
        const x = P[idx].x + R[idx].x * lat, z = P[idx].z + R[idx].z * lat;
        let clearance = Infinity;
        for (let length = -30; length <= 30; length += 5) {
          for (const width of [-6, 0, 6]) {
            const dx = x + T[idx].x * length + R[idx].x * width;
            const dz = z + T[idx].z * length + R[idx].z * width;
            clearance = Math.min(clearance, nearest(tr, dx, dz, 2).d);
          }
        }
        if (clearance >= wallD + 3) return { idx, lat, clearance };
      }
    }
  }
  return null;
}
function addPits(tr) {
  const location = pitLocation(tr);
  if (!location) return;
  const g = new THREE.Group();
  const structure = std(0xf0f2f4), windows = std(0xd7e1eb, { map: cloneTex(TEX.windows, 4, 1) });
  const body = new THREE.Mesh(new THREE.BoxGeometry(12, 4.4, 58), [windows, windows, structure, structure, structure, structure]);
  body.position.y = 2.2;
  body.receiveShadow = true;
  g.add(body);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(12, 0.55, 60), std(0x263238));
  roof.position.y = 4.65;
  g.add(roof);
  placeOnTrack(g, tr, location.idx, location.lat, -0.3);
  scene.add(g);
  scene.userData.optionalScenery.push(g);
}
function scatter(tr, count, minD, fn, maxR = 700) {
  const b = tr.bounds; let placed = 0, tries = 0;
  while (placed < count && tries < count * 8) {
    tries++;
    const x = rand(b.minX - maxR, b.maxX + maxR), z = rand(b.minZ - maxR, b.maxZ + maxR);
    const nr = nearest(tr, x, z, 2); if (nr.i >= 0 && nr.d < tr.wallD + minD) continue;
    if (fn(x, tr.terrainH(x, z), z, nr) !== false) placed++;
  }
}
function instanced(geo, mat, list, shadow = true) {
  if (!list.length) return null;
  geo.computeBoundingSphere();
  const gr = geo.boundingSphere.radius + geo.boundingSphere.center.length();
  const cs = 650, cells = new Map();
  for (const o of list) { const k = Math.floor(o.x / cs) + ',' + Math.floor(o.z / cs); let a = cells.get(k); if (!a) cells.set(k, a = []); a.push(o); }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  for (const arr of cells.values()) {
    const g2 = new THREE.BufferGeometry(); g2.index = geo.index;
    for (const n in geo.attributes) g2.setAttribute(n, geo.attributes[n]);
    const c = new THREE.Vector3(); arr.forEach(o => c.add(p.set(o.x, o.y, o.z))); c.multiplyScalar(1 / arr.length);
    let r = 0; arr.forEach(o => { r = Math.max(r, c.distanceTo(p.set(o.x, o.y, o.z)) + gr * Math.max(o.s || 1, o.sy || 0, o.sx || 0)); });
    g2.boundingSphere = new THREE.Sphere(c, r);
    const im = new THREE.InstancedMesh(g2, mat, arr.length);
    arr.forEach((o, i) => { e.set(0, o.ry || 0, 0); q.setFromEuler(e); p.set(o.x, o.y, o.z); s.set(o.sx || o.s, o.sy || o.s, o.sz || o.s); m.compose(p, q, s); im.setMatrixAt(i, m); if (o.c) im.setColorAt(i, o.c); });
    im.castShadow = shadow && Q.treeShadow; im.receiveShadow = Q.shadow > 0; im.matrixAutoUpdate = false;
    scene.add(im);
  }
  return true;
}
function mergeGeo(list) {
  const pos = [], nor = [], colors = [];
  for (const source of list) {
    const g = source.index ? source.toNonIndexed() : source;
    pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array);
    if (g.attributes.color) colors.push(...g.attributes.color.array);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  if (colors.length) geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}
function decorate(tr, th, kind) {
  const mult = Q.deco;
  const trunkG = new THREE.CylinderGeometry(0.35, 0.55, 4, 7); trunkG.translate(0, 2, 0);
  const pineG = new THREE.ConeGeometry(2.6, 7, 9); pineG.translate(0, 6.5, 0);
  const pine2G = new THREE.ConeGeometry(1.9, 5, 9); pine2G.translate(0, 9.5, 0);
  const leafG = new THREE.IcosahedronGeometry(3.2, 1); leafG.translate(0, 6.2, 0);
  const trunkM = std(0x6d4c41, { roughness: 1 }), leafM = std(0xffffff, { roughness: 0.9, flatShading: true });
  const trunks = [], leaves = [], pines = [], pines2 = [];
  const col = (h, s, l) => new THREE.Color().setHSL(h, s, l);
  const addTree = (x, y, z, type, s) => {
    trunks.push({ x, y, z, s });
    if (type === 'pine') { const c = col(rand(0.28, 0.36), rand(0.45, 0.6), rand(0.16, 0.26)); pines.push({ x, y, z, s, c, ry: rand(0, TAU) }); pines2.push({ x, y, z, s, c }); }
    else leaves.push({ x, y, z, s, sy: s * rand(0.9, 1.25), c: col(rand(0.2, 0.33), rand(0.5, 0.7), rand(0.26, 0.42)), ry: rand(0, TAU) });
  };
  if (kind === 'meadow') {
    const mushS = [], mushC = [], flowers = [];
    scatter(tr, 1400 * mult, 6, (x, y, z) => { const r = Math.random(), s = rand(0.8, 1.6); if (r < 0.1) { mushS.push({ x, y, z, s: s * 1.4 }); mushC.push({ x, y, z, s: s * 1.4, c: col(Math.random() < 0.7 ? 0.0 : 0.08, 0.8, 0.5) }); } else addTree(x, y, z, r < 0.35 ? 'pine' : 'leaf', s); });
    scatter(tr, 900 * mult, 3, (x, y, z) => { flowers.push({ x, y: y + 0.3, z, s: rand(0.25, 0.45), c: col([0, 0.14, 0.6, 0.83, 0.1][Math.floor(Math.random() * 5)], 0.85, 0.6) }); }, 250);
    const stemG = new THREE.CylinderGeometry(0.9, 1.2, 3, 10); stemG.translate(0, 1.5, 0);
    const capG = new THREE.SphereGeometry(3, 16, 10, 0, TAU, 0, Math.PI / 2); capG.translate(0, 2.8, 0);
    instanced(stemG, std(0xfff8e1), mushS); instanced(capG, std(0xffffff, { roughness: 0.5 }), mushC);
    instanced(new THREE.IcosahedronGeometry(1, 0), std(0xffffff, { roughness: 0.7 }), flowers, false);
    for (let k = 0; k < 3; k++) scatter(tr, 1, 40, (x, y, z) => {
      const g = new THREE.Group(); g.position.set(x, y, z);
      const tw = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 4, 18, 10), std(0xfafafa)); tw.position.y = 9; tw.castShadow = true; g.add(tw);
      const rf = new THREE.Mesh(new THREE.ConeGeometry(3.5, 5, 10), std(0xc62828)); rf.position.y = 20.5; g.add(rf);
      const hub = new THREE.Group(); hub.position.set(0, 17, 3.5); hub.userData.dyn = true; g.add(hub);
      for (let bl = 0; bl < 4; bl++) { const bm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 12, 0.2), std(0x8d6e63)); bm.position.y = 6; bm.castShadow = true; const p = new THREE.Group(); p.rotation.z = bl * Math.PI / 2; p.add(bm); hub.add(p); }
      g.rotation.y = rand(0, TAU); scene.add(g); anims.push(dt => { hub.rotation.z += dt * 0.8; });
    }, 300);
    for (let k = 0; k < 6; k++) {
      const g = new THREE.Group();
      const env = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), std(col(Math.random(), 0.8, 0.55), { roughness: 0.6 })); env.scale.y = 1.2; g.add(env);
      const bsk = new THREE.Mesh(new THREE.BoxGeometry(2, 1.6, 2), std(0x795548)); bsk.position.y = -9.5; g.add(bsk);
      const bb = tr.bounds; g.userData.dyn = true; g.position.set(rand(bb.minX - 200, bb.maxX + 200), rand(80, 160), rand(bb.minZ - 200, bb.maxZ + 200)); scene.add(g);
      const ph = rand(0, TAU), y0 = g.position.y; anims.push((dt, t) => { g.position.y = y0 + Math.sin(t * 0.3 + ph) * 6; g.position.x += dt * 1.5; });
    }
  } else if (kind === 'desert') {
    const cac = [], arms = [], rocks = [];
    scatter(tr, 900 * mult, 6, (x, y, z) => {
      const s = rand(0.8, 1.7);
      if (Math.random() < 0.6) { cac.push({ x, y, z, s, c: col(0.3, 0.45, rand(0.28, 0.38)) }); arms.push({ x, y, z, s, ry: rand(0, TAU), c: col(0.3, 0.45, 0.33) }); }
      else rocks.push({ x, y: y + 0.5, z, s: s * rand(1.5, 4), sy: s * rand(1, 2.5), ry: rand(0, TAU), c: col(0.06, rand(0.4, 0.6), rand(0.32, 0.45)) });
    });
    const cG = new THREE.CylinderGeometry(0.9, 1, 8, 10); cG.translate(0, 4, 0);
    const aG = new THREE.CylinderGeometry(0.55, 0.55, 3.5, 8); aG.translate(1.9, 5, 0);
    const aG2 = aG.clone(); aG2.rotateY(Math.PI); aG2.translate(0, -1.2, 0);
    instanced(cG, std(0xffffff, { roughness: 0.8 }), cac); instanced(mergeGeo([aG, aG2]), std(0xffffff, { roughness: 0.8 }), arms);
    instanced(new THREE.DodecahedronGeometry(1, 0), std(0xffffff, { roughness: 0.95, flatShading: true }), rocks);
    const stripe = canvasTex(64, 256, (g, w, h) => { for (let y = 0; y < h; y += 8) { g.fillStyle = shade('#b5653a', rand(-25, 25)); g.fillRect(0, y, w, 8); } });
    stripe.wrapS = THREE.RepeatWrapping; stripe.repeat.set(6, 1);
    for (let k = 0; k < 14; k++) scatter(tr, 1, 90, (x, y, z) => {
      const r = rand(40, 90), h = rand(60, 130);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, h, 9), std(0xffffff, { map: stripe, flatShading: true, roughness: 0.95 }));
      m.position.set(x, y + h / 2 - 5, z); m.castShadow = true; m.receiveShadow = true; scene.add(m);
    }, 900);
  } else if (kind === 'castle') {
    const crys = [], crys2 = [], pillars = [], lamps = [];
    scatter(tr, 700 * mult, 6, (x, y, z) => {
      if (Math.random() < 0.6) (Math.random() < 0.5 ? crys : crys2).push({ x, y: y + 3, z, s: rand(1.5, 3.2), sy: rand(3, 7), ry: rand(0, TAU) });
      else { pillars.push({ x, y, z, s: 1 }); lamps.push({ x, y: y + 11, z, s: 1 }); }
    });
    instanced(new THREE.OctahedronGeometry(1, 0), std(0x80deea, { emissive: 0x1a6aa0, roughness: 0.2, metalness: 0.3, flatShading: true }), crys);
    instanced(new THREE.OctahedronGeometry(1, 0), std(0xf48fb1, { emissive: 0x8a2050, roughness: 0.2, metalness: 0.3, flatShading: true }), crys2);
    const pG = new THREE.CylinderGeometry(1.1, 1.4, 10, 8); pG.translate(0, 5, 0);
    instanced(pG, std(0x5c5470, { roughness: 0.9 }), pillars); instanced(new THREE.SphereGeometry(1.1, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff59d }), lamps, false);
    const postG = new THREE.CylinderGeometry(0.2, 0.25, 8, 6); postG.translate(0, 4, 0);
    const posts = [], bulbs = [];
    for (let i = 0; i < tr.N; i += Math.round(40 / tr.sp)) for (const s of [-1, 1]) {
      const d = s * (tr.wallD + 2), x = tr.P[i].x + tr.R[i].x * d, z = tr.P[i].z + tr.R[i].z * d;
      if (nearest(tr, x, z, 1).d < tr.wallD) continue;
      posts.push({ x, y: tr.Y[i], z, s: 1 }); bulbs.push({ x, y: tr.Y[i] + 8.2, z, s: 0.6 });
    }
    instanced(postG, std(0x333344, { metalness: 0.6 }), posts); instanced(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff3b0 }), bulbs, false);
    let best = null; const bb = tr.bounds;
    for (let k = 0; k < 300; k++) { const x = rand(bb.minX, bb.maxX), z = rand(bb.minZ, bb.maxZ); const d = nearest(tr, x, z, 4).d; if (!best || d > best.d) best = { x, z, d }; }
    const castle = new THREE.Group(), cm = std(0x9e9ac8, { emissive: 0x201838, roughness: 0.85 }), roof = std(0xd81b60, { emissive: 0x300010, roughness: 0.5 }), win = new THREE.MeshBasicMaterial({ color: 0xffe082 });
    const keep = new THREE.Mesh(new THREE.BoxGeometry(40, 40, 40), cm); keep.position.y = 20; castle.add(keep);
    for (const [dx, dz] of [[-24, -24], [24, -24], [-24, 24], [24, 24], [0, 0]]) {
      const h = dx === 0 ? 70 : 50;
      const tw = new THREE.Mesh(new THREE.CylinderGeometry(7, 8, h, 16), cm); tw.position.set(dx, h / 2, dz); tw.castShadow = true; castle.add(tw);
      const rf = new THREE.Mesh(new THREE.ConeGeometry(9, 18, 16), roof); rf.position.set(dx, h + 9, dz); castle.add(rf);
      for (let w = 0; w < 4; w++) { const wm = new THREE.Mesh(new THREE.PlaneGeometry(2, 3), win); const a = w * Math.PI / 2; wm.position.set(dx + Math.sin(a) * 8.1, h * 0.7, dz + Math.cos(a) * 8.1); wm.rotation.y = a; castle.add(wm); }
    }
    castle.position.set(best.x, tr.terrainH(best.x, best.z) - 2, best.z);
    castle.scale.setScalar(clamp((best.d - tr.wallD - 5) / 45, 0.4, 1.2)); scene.add(castle);
  } else if (kind === 'monza') {
    scatter(tr, 2600 * mult, 7, (x, y, z) => { addTree(x, y, z, Math.random() < 0.2 ? 'pine' : 'leaf', rand(0.9, 1.7)); });
    addBillboards(tr, 16);
  } else if (kind === 'spa') {
    scatter(tr, 3600 * mult, 6, (x, y, z) => { addTree(x, y, z, Math.random() < 0.8 ? 'pine' : 'leaf', rand(1.0, 1.9)); });
    addBillboards(tr, 10);
  }
  instanced(trunkG, trunkM, trunks); instanced(leafG, leafM, leaves); instanced(pineG, leafM, pines); instanced(pine2G, leafM, pines2);
}
function addBillboards(tr, n) {
  for (let k = 0; k < n; k++) {
    const idx = Math.floor((k + 0.5) / n * tr.N), side = k % 2 ? 1 : -1;
    const x = tr.P[idx].x + tr.R[idx].x * side * (tr.wallD + 18), z = tr.P[idx].z + tr.R[idx].z * side * (tr.wallD + 18);
    if (nearest(tr, x, z, 2).d < tr.wallD + 14) continue;
    const br = TEX.brands[k % TEX.brands.length];
    const g = new THREE.Group();
    const bt = banner2(...br); const bm = new THREE.MeshStandardMaterial({ map: bt, roughness: 0.5, emissive: 0xffffff, emissiveMap: bt, emissiveIntensity: 0.35 });
    const gm = std(0x888888);
    const board = new THREE.Mesh(new THREE.BoxGeometry(22, 5.5, 0.4), [gm, gm, gm, gm, bm, bm]); board.position.y = 8; board.castShadow = true; g.add(board);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 6), std(0x777777, { metalness: 0.6 })); p.position.set(s * 8, 4, 0); g.add(p); }
    g.position.set(x, tr.terrainH(x, z) - 0.2, z);
    const j = (idx + Math.round(60 / tr.sp)) % tr.N;
    g.lookAt(tr.P[j].x, g.position.y, tr.P[j].z);
    scene.add(g);
  }
}

// ================= 차량 / 드라이버 =================
function carMats(ch) {
  return {
    paint: carMat({ color: ch.color, metalness: 0.45, roughness: 0.28, envMapIntensity: 1.2 }),
    accent: carMat({ color: ch.accent, metalness: 0.4, roughness: 0.3 }),
    carbon: carMat({ color: 0x1b1b1f, metalness: 0.3, roughness: 0.45 }),
    tire: carMat({ color: 0x151515, roughness: 0.92 }),
    rim: carMat({ color: 0xd0d0d0, metalness: 0.9, roughness: 0.25 }),
    glass: carMat({ color: 0x1a2a3a, metalness: 0.9, roughness: 0.05, transparent: true, opacity: 0.45 }),
    chrome: carMat({ color: 0xeeeeee, metalness: 1, roughness: 0.15 }),
    headL: carMat({ color: 0xffffff, emissive: 0xfff6d0, emissiveIntensity: 1.2 }),
    tailL: carMat({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 1.0 }),
  };
}
function buildCar(vid, ch) {
  const g = new THREE.Group(); g.rotation.order = 'YXZ';
  const body = new THREE.Group(); g.add(body);
  const M = carMats(ch);
  const box = (w, h, l, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); body.add(o); return o; };
  const cyl = (rt, rb, h, m, x, y, z, rx = 0, ry = 0, rz = 0, seg = 12) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); body.add(o); return o; };
  const wheels = [];
  const wheel = (x, z, r, w, front) => {
    const steer = new THREE.Group(); steer.position.set(x, r, z); body.add(steer);
    const spin = new THREE.Group(); steer.add(spin);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 22), M.tire); t.rotation.z = Math.PI / 2; spin.add(t);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, w + 0.02, 12), M.rim); rim.rotation.z = Math.PI / 2; spin.add(rim);
    spin.add(new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, r * 1.1, 0.12), M.rim));
    wheels.push({ steer, spin, front });
  };
  let seat, flameZ, flameY, rearZ;
  if (vid === 'f1') {
    box(1.6, 0.06, 3.4, M.carbon, 0, 0.14, -0.2);
    box(0.95, 0.55, 2.4, M.paint, 0, 0.5, 0.25);
    cyl(0.14, 0.34, 1.7, M.paint, 0, 0.42, 2.15, Math.PI / 2 - 0.08);
    box(2.4, 0.06, 0.55, M.accent, 0, 0.2, 2.95); box(2.3, 0.05, 0.3, M.paint, 0, 0.3, 2.78, -0.25);
    for (const s of [-1, 1]) { box(0.05, 0.36, 0.7, M.carbon, s * 1.2, 0.3, 2.9); box(0.62, 0.52, 1.9, M.paint, s * 0.75, 0.45, -0.45); box(0.5, 0.36, 0.08, M.carbon, s * 0.75, 0.5, 0.52); box(0.62, 0.08, 1.9, M.accent, s * 0.75, 0.73, -0.45); }
    box(0.7, 0.6, 1.9, M.paint, 0, 0.8, -1.05); box(0.38, 0.42, 0.5, M.carbon, 0, 1.2, -0.28);
    box(0.04, 0.45, 1.3, M.paint, 0, 1.25, -1.55);
    box(1.9, 0.08, 0.55, M.paint, 0, 1.45, -2.4); box(1.9, 0.06, 0.35, M.accent, 0, 1.62, -2.3, 0.3);
    for (const s of [-1, 1]) box(0.05, 0.75, 0.75, M.carbon, s * 0.95, 1.2, -2.35);
    box(0.1, 0.7, 0.12, M.carbon, 0, 1.05, -2.35); box(1.4, 0.25, 0.5, M.carbon, 0, 0.25, -2.3);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 8, 20, Math.PI), M.carbon); halo.rotation.set(-Math.PI / 2, 0, Math.PI); halo.position.set(0, 1.12, 0.15); body.add(halo);
    cyl(0.04, 0.04, 0.55, M.carbon, 0, 0.93, 0.62, 0.5);
    for (const z of [1.55, -1.6]) for (const s of [-1, 1]) box(0.9, 0.05, 0.06, M.carbon, s * 0.55, 0.45, z);
    box(0.3, 0.12, 0.05, M.tailL, 0, 0.45, -2.56);
    wheel(1.05, 1.55, 0.42, 0.42, true); wheel(-1.05, 1.55, 0.42, 0.42, true); wheel(1.05, -1.6, 0.5, 0.6, false); wheel(-1.05, -1.6, 0.5, 0.6, false);
    seat = { x: 0, y: 0.72, z: 0.05, s: 0.85, torso: false }; flameZ = -2.6; flameY = 0.55; rearZ = -1.6;
  } else if (vid === 'lmp') {
    box(2.1, 0.45, 4.9, M.paint, 0, 0.55, 0); box(1.1, 0.35, 1.4, M.paint, 0, 0.62, 2.2, 0.12);
    for (const [x, z] of [[1.05, 1.5], [-1.05, 1.5], [1.05, -1.5], [-1.05, -1.5]]) box(0.5, 0.45, 1.3, M.paint, x * 0.92, 0.85, z);
    const can = new THREE.Mesh(new THREE.SphereGeometry(0.75, 18, 12), M.glass); can.scale.set(1, 0.7, 1.7); can.position.set(0, 1.0, 0.2); body.add(can);
    box(0.06, 0.7, 1.8, M.accent, 0, 1.2, -1.5); box(2.1, 0.08, 0.55, M.carbon, 0, 1.45, -2.45);
    for (const s of [-1, 1]) { box(0.06, 0.6, 0.7, M.carbon, s * 1.05, 1.15, -2.45); box(0.4, 0.12, 0.06, M.headL, s * 0.65, 0.65, 2.47); box(0.5, 0.1, 0.05, M.tailL, s * 0.6, 0.8, -2.47); }
    box(2.2, 0.06, 0.6, M.accent, 0, 0.35, 2.6); box(0.32, 0.08, 4.9, M.accent, 0, 0.8, 0);
    wheel(1.0, 1.5, 0.45, 0.45, true); wheel(-1.0, 1.5, 0.45, 0.45, true); wheel(1.0, -1.5, 0.48, 0.5, false); wheel(-1.0, -1.5, 0.48, 0.5, false);
    seat = { x: 0, y: 0.72, z: 0.2, s: 0.75, torso: false }; flameZ = -2.7; flameY = 0.5; rearZ = -1.5;
  } else if (vid === 'gt') {
    box(2.1, 0.55, 4.5, M.paint, 0, 0.62, 0); box(2.0, 0.25, 1.4, M.paint, 0, 0.95, 1.4, 0.1);
    box(1.7, 0.55, 1.9, M.glass, 0, 1.15, -0.3); box(1.65, 0.07, 1.4, M.paint, 0, 1.44, -0.35);
    box(2.2, 0.06, 0.5, M.carbon, 0, 0.35, 2.3); box(1.9, 0.06, 0.45, M.carbon, 0, 1.45, -2.05);
    for (const s of [-1, 1]) { box(0.08, 0.35, 0.1, M.carbon, s * 0.7, 1.22, -2.05); box(0.45, 0.14, 0.05, M.headL, s * 0.7, 0.78, 2.26); box(0.5, 0.12, 0.05, M.tailL, s * 0.7, 0.8, -2.26); box(0.05, 0.12, 1.2, M.accent, s * 1.06, 0.72, 0.2); }
    box(0.4, 0.57, 4.52, M.accent, 0, 0.63, 0);
    wheel(1.0, 1.4, 0.45, 0.42, true); wheel(-1.0, 1.4, 0.45, 0.42, true); wheel(1.0, -1.4, 0.47, 0.48, false); wheel(-1.0, -1.4, 0.47, 0.48, false);
    seat = { x: 0.35, y: 0.65, z: -0.2, s: 0.7, torso: false }; flameZ = -2.5; flameY = 0.45; rearZ = -1.4;
  } else if (vid === 'muscle') {
    box(2.2, 0.7, 4.9, M.paint, 0, 0.72, 0); box(1.8, 0.6, 1.7, M.glass, 0, 1.35, -0.55); box(1.75, 0.08, 1.3, M.paint, 0, 1.66, -0.6);
    box(0.8, 0.25, 1.2, M.carbon, 0, 1.18, 1.3);
    for (const s of [-1, 1]) { box(0.3, 0.02, 4.92, M.accent, s * 0.3, 1.08, 0); box(0.35, 0.18, 0.05, M.headL, s * 0.75, 0.85, 2.46); box(0.55, 0.15, 0.05, M.tailL, s * 0.65, 0.9, -2.46); cyl(0.1, 0.1, 0.5, M.chrome, s * 0.5, 0.35, -2.55, Math.PI / 2); }
    box(2.3, 0.15, 0.2, M.chrome, 0, 0.45, 2.5); box(2.3, 0.15, 0.2, M.chrome, 0, 0.45, -2.5); box(2.0, 0.08, 0.35, M.paint, 0, 1.12, -2.25);
    wheel(1.02, 1.55, 0.46, 0.42, true); wheel(-1.02, 1.55, 0.46, 0.42, true); wheel(1.05, -1.5, 0.52, 0.6, false); wheel(-1.05, -1.5, 0.52, 0.6, false);
    seat = { x: 0.4, y: 0.85, z: -0.5, s: 0.7, torso: false }; flameZ = -2.8; flameY = 0.35; rearZ = -1.5;
  } else if (vid === 'rally') {
    box(2.0, 0.75, 3.9, M.paint, 0, 0.9, 0); box(1.8, 0.65, 2.0, M.glass, 0, 1.6, -0.35); box(1.82, 0.08, 2.05, M.paint, 0, 1.95, -0.35);
    box(0.5, 0.2, 0.8, M.carbon, 0, 2.05, 0.1); box(1.9, 0.08, 0.5, M.paint, 0, 2.05, -1.5);
    box(2.02, 0.3, 3.92, M.accent, 0, 0.95, 0);
    for (let k = 0; k < 4; k++) cyl(0.14, 0.14, 0.1, M.headL, -0.6 + k * 0.4, 1.05, 2.0, Math.PI / 2);
    for (const s of [-1, 1]) { box(0.5, 0.12, 0.05, M.tailL, s * 0.65, 1.1, -1.97); box(0.5, 0.45, 0.04, M.carbon, s * 0.95, 0.4, -1.45); }
    box(2.1, 0.25, 0.25, M.carbon, 0, 0.55, 2.0);
    wheel(1.0, 1.3, 0.5, 0.42, true); wheel(-1.0, 1.3, 0.5, 0.42, true); wheel(1.0, -1.3, 0.5, 0.42, false); wheel(-1.0, -1.3, 0.5, 0.42, false);
    seat = { x: 0.4, y: 1.0, z: -0.1, s: 0.7, torso: false }; flameZ = -2.2; flameY = 0.6; rearZ = -1.3;
  } else {
    box(1.6, 0.15, 3.2, M.carbon, 0, 0.6, 0); box(1.2, 0.35, 1.0, M.paint, 0, 0.8, 1.5, 0.2);
    const tube = (x1, y1, z1, x2, y2, z2) => { const a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2); const o = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, a.distanceTo(b), 6), M.accent); o.position.copy(a).add(b).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); body.add(o); };
    for (const s of [-1, 1]) { tube(s * 0.75, 0.65, 0.6, s * 0.6, 2.1, 0.1); tube(s * 0.6, 2.1, 0.1, s * 0.6, 2.1, -0.9); tube(s * 0.6, 2.1, -0.9, s * 0.75, 0.65, -1.2); tube(s * 0.75, 0.65, 0.6, s * 0.75, 0.65, 1.8); cyl(0.09, 0.09, 0.9, M.chrome, s * 0.3, 1.3, -1.9, 0.6); }
    tube(-0.6, 2.1, 0.1, 0.6, 2.1, 0.1); tube(-0.6, 2.1, -0.9, 0.6, 2.1, -0.9);
    box(1.0, 0.7, 0.9, M.carbon, 0, 0.95, -1.5); box(1.8, 0.2, 0.2, M.chrome, 0, 0.6, 2.0); box(1.2, 0.06, 0.6, M.paint, 0, 1.6, -1.5);
    wheel(1.05, 1.3, 0.6, 0.5, true); wheel(-1.05, 1.3, 0.6, 0.5, true); wheel(1.1, -1.3, 0.68, 0.65, false); wheel(-1.1, -1.3, 0.68, 0.65, false);
    seat = { x: 0, y: 0.75, z: -0.15, s: 0.85, torso: true }; flameZ = -2.3; flameY = 1.3; rearZ = -1.3;
  }
  const drv = buildDriver(ch, seat.torso); drv.position.set(seat.x, seat.y, seat.z); drv.scale.setScalar(seat.s); body.add(drv);
  const sparks = [];
  for (const x of [1.05, -1.05]) {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), new THREE.MeshBasicMaterial({ color: 0x40c4ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.position.set(x, 0.3, rearZ - 0.3); s.visible = false; g.add(s); sparks.push(s);
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.2, 12), new THREE.MeshBasicMaterial({ color: 0xff9100, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
  flame.rotation.x = -Math.PI / 2; flame.position.set(0, flameY, flameZ - 1.0); flame.visible = false; body.add(flame);
  flame.userData.keep = true;
  mergeCar(body, wheels, M.paint);
  const shadowBlob = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 5.2), new THREE.MeshBasicMaterial({ map: TEX.blob, transparent: true, depthWrite: false, opacity: 0.6 }));
  shadowBlob.rotation.x = -Math.PI / 2; shadowBlob.position.y = 0.06; shadowBlob.visible = !(Q.shadow > 0); g.add(shadowBlob);
  g.traverse(o => { if (o.isMesh && !o.material.transparent) o.castShadow = Q.shadow > 0; });
  return { group: g, body, wheels, sparks, flame, shadowBlob, paint: M.paint, baseColor: new THREE.Color(ch.color) };
}
function matKey(m) { return [m.type, m.color.getHex(), m.emissive ? m.emissive.getHex() : 0, m.emissiveIntensity || 0, m.metalness || 0, m.roughness || 0, m.transparent, m.opacity].join('|'); }
function mergeMeshes(root, meshes, parent, preserveMaterial) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(parent.matrixWorld).invert();
  const groups = new Map();
  for (const o of meshes) {
    const material = o.material;
    const batchColor = Q === QUALITY.low && material.isMeshLambertMaterial && !material.transparent
      && !material.map && material.emissive.getHex() === 0 && material !== preserveMaterial;
    const key = batchColor ? 'vertex-colors' : matKey(material);
    let group = groups.get(key);
    if (!group) {
      group = { mat: batchColor ? new THREE.MeshLambertMaterial({ vertexColors: true }) : material, geos: [] };
      groups.set(key, group);
    }
    const geometry = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    if (batchColor) {
      const colors = new Float32Array(geometry.attributes.position.count * 3);
      for (let i = 0; i < colors.length; i += 3) {
        colors[i] = material.color.r; colors[i + 1] = material.color.g; colors[i + 2] = material.color.b;
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }
    group.geos.push(geometry);
  }
  for (const o of meshes) o.parent.remove(o);
  for (const e of groups.values()) parent.add(new THREE.Mesh(mergeGeo(e.geos), e.mat));
}
function mergeCar(body, wheels, paint) {
  const wheelSet = new Set(wheels.map(w => w.steer));
  const stat = [];
  const walk = o => { for (const c of o.children.slice()) { if (wheelSet.has(c) || c.userData.keep) continue; if (c.isMesh) stat.push(c); else walk(c); } };
  walk(body);
  mergeMeshes(body, stat, body, paint);
  for (const o of body.children.slice()) if (!o.isMesh && !wheelSet.has(o) && o.children.length === 0) body.remove(o);
  for (const w of wheels) mergeMeshes(body, w.spin.children.slice(), w.spin);
}
function buildDriver(ch, torso) {
  const g = new THREE.Group();
  const sm = (c, o = {}) => carMat({ color: c, roughness: 0.55, ...o });
  const add = (geo, m, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(rx, ry, rz); g.add(o); return o; };
  const S = (r, w = 18, h = 14) => new THREE.SphereGeometry(r, w, h);
  const skin = sm(0xffd3a8), black = sm(0x111111, { roughness: 0.3 }), white = sm(0xffffff);
  if (torso) { add(new THREE.CylinderGeometry(0.42, 0.5, 0.9, 12), sm(ch.suit), 0, 0.3, 0); for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 8), sm(ch.suit), s * 0.4, 0.4, 0.3, 1, 1, 1, 1.2, 0, s * 0.3); }
  else add(new THREE.CylinderGeometry(0.35, 0.4, 0.5, 12), sm(ch.suit), 0, 0.2, 0);
  const hy = torso ? 1.1 : 0.78;
  const eyes = (y, z, sp = 0.17, r = 0.07, m = black) => { add(S(r, 8, 6), m, sp, y, z); add(S(r, 8, 6), m, -sp, y, z); };
  switch (ch.look) {
    case 'helmet':
      add(S(0.45), sm(ch.color, { metalness: 0.4, roughness: 0.25 }), 0, hy, 0);
      add(new THREE.TorusGeometry(0.43, 0.06, 8, 24), sm(ch.accent), 0, hy + 0.05, 0, 1, 1, 1, 0, 0, Math.PI / 2);
      add(S(0.36, 16, 10), sm(0x111122, { metalness: 0.9, roughness: 0.05 }), 0, hy + 0.02, 0.18, 1.05, 0.55, 0.9);
      break;
    case 'hair':
      add(S(0.42), skin, 0, hy, 0); add(S(0.45, 16, 12), sm(ch.hair), 0, hy + 0.08, -0.05, 1, 0.9, 1);
      add(S(0.2, 10, 8), sm(ch.hair), 0, hy - 0.05, -0.5, 1, 1.4, 1); add(new THREE.TorusGeometry(0.1, 0.04, 6, 10), sm(ch.accent), 0, hy + 0.1, -0.42);
      eyes(hy + 0.02, 0.37); add(S(0.05, 6, 6), sm(0xff8a80), 0, hy - 0.15, 0.39, 1.6, 0.6, 1);
      break;
    case 'bear': case 'panda': {
      const panda = ch.look === 'panda', fur = sm(panda ? 0xffffff : 0x8d6e63), dark = sm(panda ? 0x111111 : 0x5d4037);
      add(S(0.48), fur, 0, hy, 0);
      for (const s of [-1, 1]) add(S(0.16, 10, 8), dark, s * 0.34, hy + 0.36, -0.02);
      add(S(0.2, 12, 10), panda ? white : sm(0xffcc80), 0, hy - 0.1, 0.38, 1.1, 0.8, 0.8);
      add(S(0.07, 8, 6), black, 0, hy - 0.04, 0.53);
      if (panda) for (const s of [-1, 1]) add(S(0.13, 10, 8), black, s * 0.18, hy + 0.08, 0.36, 1, 1.3, 0.6, 0, 0, s * 0.5);
      eyes(hy + 0.1, 0.43, 0.18, 0.06, panda ? white : black);
      break;
    }
    case 'cat': {
      const fur = sm(0xff9800);
      add(S(0.46), fur, 0, hy, 0);
      for (const s of [-1, 1]) { add(new THREE.ConeGeometry(0.15, 0.3, 8), fur, s * 0.28, hy + 0.42, 0, 1, 1, 1, 0, 0, -s * 0.3); add(S(0.09, 8, 6), sm(0x9ccc65, { roughness: 0.2 }), s * 0.17, hy + 0.06, 0.38); }
      add(S(0.18, 10, 8), white, 0, hy - 0.12, 0.34, 1.2, 0.8, 0.8); add(S(0.05, 6, 6), sm(0xf06292), 0, hy - 0.05, 0.47);
      for (const s of [-1, 1]) for (const k of [-1, 1]) add(new THREE.CylinderGeometry(0.01, 0.01, 0.4, 3), black, s * 0.3, hy - 0.1 + k * 0.04, 0.38, 1, 1, 1, 0, 0, Math.PI / 2 + k * 0.15);
      break;
    }
    case 'robot': {
      const met = sm(0xb0bec5, { metalness: 0.9, roughness: 0.25 });
      add(new THREE.BoxGeometry(0.75, 0.65, 0.7), met, 0, hy, 0);
      add(new THREE.BoxGeometry(0.6, 0.16, 0.05), carMat({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 1.5 }), 0, hy + 0.06, 0.36);
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6), met, 0, hy + 0.5, 0); add(S(0.08, 8, 6), carMat({ color: 0xff1744, emissive: 0xff1744 }), 0, hy + 0.72, 0);
      for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 10), sm(0x546e7a, { metalness: 0.8 }), s * 0.42, hy, 0, 1, 1, 1, 0, 0, Math.PI / 2);
      break;
    }
    case 'alien': {
      const gr = sm(0x76ff03, { roughness: 0.35 });
      add(S(0.42), gr, 0, hy + 0.08, 0, 1, 1.3, 1);
      for (const s of [-1, 1]) { add(S(0.13, 12, 8), sm(0x000000, { roughness: 0.05, metalness: 0.5 }), s * 0.17, hy + 0.08, 0.33, 0.8, 1.3, 0.6, 0, 0, s * 0.4); add(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 5), gr, s * 0.15, hy + 0.65, 0, 1, 1, 1, 0, 0, -s * 0.3); add(S(0.07, 8, 6), sm(0xe040fb, { emissive: 0x6a1b9a }), s * 0.21, hy + 0.85, 0); }
      break;
    }
    case 'penguin':
      add(S(0.46), sm(0x263238), 0, hy, 0); add(S(0.33, 14, 10), white, 0, hy - 0.02, 0.2, 1, 1, 0.8);
      add(new THREE.ConeGeometry(0.1, 0.3, 8), sm(0xffa000), 0, hy - 0.05, 0.55, 1, 1, 1, Math.PI / 2);
      eyes(hy + 0.1, 0.44, 0.13, 0.06);
      break;
    case 'dino': {
      const gr = sm(0x43a047);
      add(S(0.42), gr, 0, hy, 0); add(new THREE.BoxGeometry(0.5, 0.3, 0.45), gr, 0, hy - 0.08, 0.35);
      for (let k = 0; k < 4; k++) add(new THREE.ConeGeometry(0.09, 0.25, 6), sm(0xffeb3b), 0, hy + 0.42 - k * 0.08, -0.05 - k * 0.15, 1, 1, 1, -0.5 - k * 0.3);
      eyes(hy + 0.12, 0.34, 0.18, 0.08, white); eyes(hy + 0.12, 0.4, 0.18, 0.04);
      for (let k = -1; k <= 1; k++) add(new THREE.ConeGeometry(0.03, 0.08, 4), white, k * 0.12, hy - 0.26, 0.55, 1, 1, 1, Math.PI);
      break;
    }
    case 'ninja':
      add(S(0.44), sm(0x1a1a1a), 0, hy, 0);
      add(new THREE.BoxGeometry(0.6, 0.14, 0.2), skin, 0, hy + 0.05, 0.33);
      eyes(hy + 0.05, 0.43, 0.13, 0.05);
      add(new THREE.TorusGeometry(0.44, 0.05, 6, 20), sm(0xd50000), 0, hy + 0.2, 0, 1, 1, 1, Math.PI / 2);
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.08, 0.04, 0.5), sm(0xd50000), s * 0.1, hy + 0.15, -0.65, 1, 1, 1, 0.3, s * 0.3);
      break;
  }
  return g;
}

// ================= 카트 로직 =================
class Kart {
  constructor(ch, veh, isPlayer) {
    this.ch = ch; this.v = veh; this.name = ch.name; this.isPlayer = isPlayer;
    this.m = buildCar(veh.id, ch); scene.add(this.m.group);
    this.pos = new THREE.Vector3(); this.heading = 0; this.speed = 0; this.y = 0; this.vy = 0; this.gy = 0; this.pitch = 0;
    this.idx = 0; this.lat = 0; this.lap = 0; this.courseProgress = 0; this.nextGate = 0; this.finished = false; this.finishTime = 0;
    this.item = null; this.itemCount = 0; this.roulette = 0; this.boost = 0; this.star = 0; this.spin = 0; this.spinAng = 0; this.ghost = 0; this.stall = 0;
    this.drift = 0; this.driftCharge = 0; this.statSpeed = 1; this.steerVis = 0;
    this.aiLane = 0; this.aiLaneTarget = 0; this.aiItemT = 0; this.stuck = 0; this.revT = 0; this.skill = 1;
    this.aiThinkT = 0; this.aiPassT = 0; this.aiSpeed = 0; this.aiCurve = 0;
    this.driver = AI_DRIVERS[CHARS.indexOf(ch) % AI_DRIVERS.length];
    this.sideSpeed = 0; this.slip = 0; this.driftIntent = 0; this.impactCooldown = 0; this.skidWheels = null;
    this.pose = { x: 0, y: 0, z: 0, heading: 0 };
    this.lapTimes = []; this.previousRecord = null;
    this.firstPress = null; this.bestLap = null; this.lapStart = 0; this.wheelRot = 0;
  }
}
function project(o, isKart) {
  const { N, P, R } = track;
  const prevIdx = o.idx;
  let best = Infinity, bi = prevIdx, nearestOffset = 0;
  // A 120 Hz step covers fewer than two samples, including a boosted shell.
  for (let offset = -9; offset <= 9; offset++) {
    const i = (prevIdx + offset + N) % N;
    const dx = o.pos.x - P[i].x, dz = o.pos.z - P[i].z, distance = dx * dx + dz * dz;
    if (distance < best) { best = distance; bi = i; nearestOffset = offset; }
  }
  o.idx = bi;
  o.lat = (o.pos.x - P[bi].x) * R[bi].x + (o.pos.z - P[bi].z) * R[bi].z;
  if (!isKart || o.finished) return;
  o.courseProgress += nearestOffset;
  if (o.courseProgress < o.nextGate) return;
  const quarter = Math.round(o.nextGate * 4 / N);
  o.nextGate = Math.round((quarter + 1) * N / 4);
  if (quarter % 4 !== 0) {
    if (o.isPlayer && settings.mode === TRIAL) recordTrialSector(o, quarter % 4);
    return;
  }
  o.lap++;
  onLap(o);
}
function groundY(o) {
  const { Y, T, P, N, sp } = track, i = o.idx;
  const s = ((o.pos.x - P[i].x) * T[i].x + (o.pos.z - P[i].z) * T[i].z) / sp;
  return s >= 0 ? lerp(Y[i], Y[(i + 1) % N], Math.min(s, 1)) : lerp(Y[i], Y[(i - 1 + N) % N], Math.min(-s, 1));
}
function trackSlope(i) { const { Y, N, sp } = track; return (Y[(i + 3) % N] - Y[(i - 3 + N) % N]) / (6 * sp); }
const progress = k => k.courseProgress;
function ranking() {
  return karts.slice().sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1; if (b.finished) return 1;
    return progress(b) - progress(a);
  });
}
function onLap(k) {
  const lapTime = raceTime - k.lapStart;
  if (k.lap > LAPS) { k.finished = true; k.finishTime = raceTime; }
  const trial = k.isPlayer && settings.mode === TRIAL;
  if (k.lap >= 2) {
    k.lapTimes.push(lapTime);
    if (trial) finishTrialLap(k, lapTime);
    else if (k.bestLap === null || lapTime < k.bestLap) k.bestLap = lapTime;
  }
  k.lapStart = raceTime;
  if (!k.isPlayer) return;
  if (k.finished) { playerFinished(); return; }
  if (trial) beginTrialLap(k);
  if (k.lap === LAPS) {
    banner('🔔 마지막 랩!', 1800);
    Sound.beep(880, 0.15); setTimeout(() => Sound.beep(1100, 0.25), 160);
    Music.setRate(1.07);
  } else if (k.lap > 1) {
    banner('LAP ' + k.lap + '/' + LAPS, 1200);
    Sound.beep(760, 0.15);
  }
}
const currentMax = k => CC[settings.cc].max * k.v.spd * k.statSpeed;
function updateKart(k, inp, dt) {
  const cc = CC[settings.cc];
  let maxS = currentMax(k);
  const onRoad = Math.abs(k.lat) <= track.halfW + 1.8;
  if (k.ghost > 0) k.ghost -= dt;
  if (k.impactCooldown > 0) k.impactCooldown -= dt;
  if (k.stall > 0) { k.stall -= dt; inp = { ...inp, accel: false }; }
  if (k.spin > 0) {
    k.spin -= dt; k.spinAng += dt * 13;
    inp = { steer: 0, accel: false, brake: false, hop: false, hopPressed: false };
    cancelDrift(k);
    k.speed *= Math.pow(0.25, dt);
    if (k.spin <= 0) k.spinAng = 0;
  }
  const boosting = k.boost > 0 || k.star > 0;
  if (!onRoad && !boosting) maxS *= k.v.off;
  if (k.boost > 0) { maxS *= 1.38; k.boost -= dt; }
  if (k.star > 0) { maxS *= k.boost > 0 ? 1.0 : 1.22; k.star -= dt; }
  const acc = cc.acc * k.v.acc * (boosting ? 2.5 : 1);
  if (boosting && k.speed < maxS) k.speed += acc * 1.5 * dt;
  if (inp.accel && !inp.brake) {
    if (k.speed < maxS) k.speed = Math.min(maxS, k.speed + acc * (inp.throttle ?? 1) * dt * (k.speed < 0 ? 2.5 : 1) * (1 - 0.35 * Math.max(0, k.speed) / maxS));
  } else if (inp.brake) {
    if (k.speed > 0) k.speed = Math.max(0, k.speed - 60 * (inp.brakeAmount ?? 1) * dt);
    else if (inp.reverse !== false) k.speed = Math.max(-16, k.speed - 22 * dt);
  } else if (!boosting) { const f = Math.min(Math.abs(k.speed), 14 * dt); k.speed -= Math.sign(k.speed) * f; }
  if (k.speed > maxS) k.speed = maxS + (k.speed - maxS) * Math.exp(-2.5 * dt);
  const fdot = Math.sin(k.heading) * track.T[k.idx].x + Math.cos(k.heading) * track.T[k.idx].z;
  const slope = trackSlope(k.idx) * fdot;
  if (!boosting) k.speed -= slope * 14 * dt;
  if (inp.hopPressed && k.y <= 0 && k.spin <= 0) {
    k.vy = 7.5; k.y = 0.001;
    k.driftIntent = Math.abs(inp.steer) > 0.22 ? Math.sign(inp.steer) : 0;
    if (k.isPlayer) Sound.beep(320, 0.07, 'triangle', 0.06, 200);
  }
  if (k.y > 0) {
    k.vy -= 38 * dt; k.y += k.vy * dt;
    if (inp.hop && !k.driftIntent && Math.abs(inp.steer) > 0.22) k.driftIntent = Math.sign(inp.steer);
    if (k.y <= 0) {
      k.y = 0; k.vy = 0;
      if (inp.hop && k.driftIntent && k.speed > 18 && k.spin <= 0) k.drift = k.driftIntent;
      k.driftIntent = 0;
    }
  }
  if (k.drift) {
    if (k.speed < 12) cancelDrift(k);
    else if (!inp.hop) releaseDrift(k);
    else {
      const slip = smooth(0.06, 0.22, Math.abs(k.slip));
      k.driftCharge += dt * (onRoad ? 1 : 0.30) * (0.45 + 1.12 * slip);
      const lvl = driftLevel(k.driftCharge);
      if (k.isPlayer && lvl !== k._lastLvl && lvl > 0) Sound.beep(500 + lvl * 250, 0.08, 'triangle', 0.05);
      k._lastLvl = lvl;
    }
  }
  stepHandling(k, inp, dt, onRoad, k.y <= 0);
  project(k, true);
  resolveTrackWall(k);
  k.gy = groundY(k);
  k.pitch = lerp(k.pitch, Math.atan(slope), 1 - Math.exp(-10 * dt));
  for (const d of dashes) {
    const di = (k.idx - d.idx + track.N) % track.N;
    if ((di < 5 || di > track.N - 3) && Math.abs(k.lat - d.lat) < 3.2 && k.y < 0.5 && k.boost < 0.9) { k.boost = 1.1; if (k.isPlayer) Sound.beep(600, 0.3, 'sawtooth', 0.07, 600); }
  }
  for (const b of boxes) {
    if (!b.active) continue;
    const dx = k.pos.x - b.x, dz = k.pos.z - b.z;
    if (dx * dx + dz * dz < 10) {
      b.active = false; b.t = 3; b.mesh.visible = false;
      if (!k.item && k.roulette <= 0) { k.roulette = k.isPlayer ? 1.3 : 0.9; if (k.isPlayer) Sound.beep(1200, 0.08, 'square', 0.05); }
    }
  }
  if (k.roulette > 0) {
    k.roulette -= dt;
    if (k.roulette <= 0) {
      const it = rollItem(ranking().indexOf(k), karts.length);
      k.itemCount = it === 'mushroom3' ? 3 : 1; k.item = it === 'mushroom3' ? 'mushroom' : it;
      k.aiItemT = rand(1.0, 5.0);
      if (k.isPlayer) Sound.beep(1500, 0.15, 'triangle', 0.08);
    }
  }
  if (inp.itemPressed && k.item && k.spin <= 0) useItem(k, inp);
}
function driftLevel(c) { return c > 3.0 ? 3 : c > 1.8 ? 2 : c > 0.8 ? 1 : 0; }
function releaseDrift(k) {
  const lvl = driftLevel(k.driftCharge);
  if (lvl) {
    k.boost = Math.max(k.boost, [0, 0.7, 1.2, 1.8][lvl]);
    emitV3(k, 5 + 3 * lvl, DRIFT_COLORS[lvl], 'boost');
    if (k.isPlayer) Sound.beep(300 + lvl * 150, 0.35, 'sawtooth', 0.07, 500);
  }
  cancelDrift(k);
}

// ================= 아이템 =================
function makeProjMesh(type) {
  const g = new THREE.Group();
  if (type === 'banana') {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.28, 10, 16, Math.PI * 1.1), std(0xffeb3b, { roughness: 0.4 }));
    m.rotation.z = Math.PI * 0.95; m.position.y = 0.9; m.castShadow = true; g.add(m);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), std(0x5d4037)); tip.position.set(0.7, 0.95, 0); g.add(tip);
  } else {
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.9, 18, 12, 0, TAU, 0, Math.PI / 2), std(type === 'green' ? 0x2ecc40 : 0xe53935, { roughness: 0.25, metalness: 0.1 })); sh.position.y = 0.5; sh.castShadow = true; g.add(sh);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.22, 8, 18), std(0xffffff)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.5; g.add(rim);
    const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.7, 0.4, 16), std(0xfff3c4)); bot.position.y = 0.3; g.add(bot);
  }
  scene.add(g); return g;
}
function spawnProj(type, owner, x, z, ang, speed) {
  const p = { type, owner, pos: new THREE.Vector3(x, 0, z), ang, speed, life: type === 'banana' ? 1e9 : (type === 'red' ? 12 : 10), age: 0, idx: owner.idx, lat: 0, mesh: makeProjMesh(type), target: null, bounces: 0 };
  project(p, false);
  if (type === 'banana') { const bs = projectiles.filter(q => q.type === 'banana'); if (bs.length > 24) removeProj(bs[0]); }
  if (type === 'red') { const rk = ranking(), i = rk.indexOf(owner); p.target = i > 0 ? rk[i - 1] : null; }
  projectiles.push(p); return p;
}
function removeProj(p) {
  const i = projectiles.indexOf(p);
  if (i < 0) return;
  projectiles.splice(i, 1);
  scene.remove(p.mesh);
  disposeScene(p.mesh);
}
function useItem(k, inp) {
  const fx = Math.sin(k.heading), fz = Math.cos(k.heading), it = k.item;
  if (it === 'mushroom') { k.boost = Math.max(k.boost, 1.4); k.speed = Math.max(k.speed, currentMax(k) * 0.9); if (k.isPlayer) Sound.beep(400, 0.4, 'sawtooth', 0.08, 700); }
  else if (it === 'star') { k.star = 7.5; if (k.isPlayer) { Sound.beep(988, 0.12); setTimeout(() => Sound.beep(1319, 0.2), 120); } }
  else if (it === 'banana') { spawnProj('banana', k, k.pos.x - fx * 4.2, k.pos.z - fz * 4.2, 0, 0); if (k.isPlayer) Sound.beep(300, 0.1, 'triangle', 0.07); }
  else {
    const back = inp.itemBack ?? inp.brake, dir = back ? -1 : 1;
    const p = spawnProj(it, k, k.pos.x + fx * 4 * dir, k.pos.z + fz * 4 * dir, back ? k.heading + Math.PI : k.heading, (it === 'red' ? 95 : 105) + Math.max(0, k.speed * dir) * 0.6);
    if (back) { p.target = null; p.rearShot = true; }
    if (k.isPlayer) Sound.beep(it === 'red' ? 700 : 500, 0.15, 'square', 0.07, -200);
  }
  if (--k.itemCount <= 0) { k.item = null; k.itemCount = 0; }
}
function hitKart(k) {
  if (k.star > 0 || k.ghost > 0) return false;
  k.spin = 1.25; k.ghost = 2.2; k.boost = 0;
  cancelDrift(k);
  impactV3(k, 22);
  if (k.isPlayer) Sound.beep(200, 0.5, 'sawtooth', 0.1, -150);
  return true;
}
function updateProjectiles(dt) {
  const { N, P, R } = track;
  for (const p of projectiles.slice()) {
    if (!p.mesh.parent) continue;
    p.age += dt; p.life -= dt;
    if (p.life <= 0) { removeProj(p); continue; }
    if (p.type !== 'banana') {
      if (p.type === 'red' && !p.rearShot) {
        let tx, tz, direct = false; const tg = p.target;
        if (tg && !tg.finished) { const d = Math.hypot(tg.pos.x - p.pos.x, tg.pos.z - p.pos.z), ahead = (tg.idx - p.idx + N) % N; if (d < 40 || (ahead < 20 && d < 60)) { tx = tg.pos.x; tz = tg.pos.z; direct = true; } }
        if (!direct) { const ti = (p.idx + 14) % N; tx = P[ti].x + R[ti].x * p.lat * 0.5; tz = P[ti].z + R[ti].z * p.lat * 0.5; }
        p.ang += clamp(angDiff(p.ang, Math.atan2(tx - p.pos.x, tz - p.pos.z)), -6 * dt, 6 * dt);
      }
      p.pos.x += Math.sin(p.ang) * p.speed * dt; p.pos.z += Math.cos(p.ang) * p.speed * dt;
      project(p, false);
      const limit = track.wallD - 1.0;
      if (Math.abs(p.lat) > limit) {
        const s = Math.sign(p.lat), r = R[p.idx], over = Math.abs(p.lat) - limit;
        p.pos.x -= r.x * over * s; p.pos.z -= r.z * over * s; p.lat = s * limit;
        if (p.type === 'green' || p.rearShot) { let dx = Math.sin(p.ang), dz = Math.cos(p.ang); const dot = dx * r.x + dz * r.z; dx -= 2 * dot * r.x; dz -= 2 * dot * r.z; p.ang = Math.atan2(dx, dz); if (++p.bounces > 7) { removeProj(p); continue; } }
      }
      p.mesh.rotation.y += dt * 12;
    }
    p.mesh.position.set(p.pos.x, groundY(p), p.pos.z);
    let hit = false;
    for (const k of karts) {
      if (k.finished || (k === p.owner && p.age < 0.5)) continue;
      const dx = k.pos.x - p.pos.x, dz = k.pos.z - p.pos.z;
      if (dx * dx + dz * dz < (p.type === 'banana' ? 6 : 7) && k.y < 1.5 && hitKart(k)) { hit = true; break; }
    }
    if (!hit) for (const q of projectiles) { if (q === p || (q.type === 'banana' && p.type === 'banana')) continue; const dx = q.pos.x - p.pos.x, dz = q.pos.z - p.pos.z; if (dx * dx + dz * dz < 4) { removeProj(q); hit = true; break; } }
    if (hit) removeProj(p);
  }
}

// ================= AI =================
function aiInput(k, dt) {
  const { N, P, R, sp } = track;
  const inp = { steer: 0, accel: true, brake: false, hop: false, hopPressed: false, itemPressed: false };
  k.aiThinkT -= dt;
  k.aiPassT -= dt;
  if (k.aiThinkT <= 0) {
    planAI(k);
    k.aiThinkT += 0.11;
  }
  k.aiLane = lerp(k.aiLane, k.aiLaneTarget, 1 - Math.exp(-dt * (2.45 + k.driver.attack * 0.45)));
  const look = Math.round((9 + Math.abs(k.speed) * 0.30) / sp);
  const ti = (k.idx + look) % N;
  const tx = P[ti].x + R[ti].x * k.aiLane;
  const tz = P[ti].z + R[ti].z * k.aiLane;
  const d = angDiff(k.heading + k.slip * -0.58, Math.atan2(tx - k.pos.x, tz - k.pos.z));
  inp.steer = clamp(-d * 2.7 - k.aiCurve * Math.abs(k.speed) * 0.23, -1, 1);
  const target = Math.abs(d) > 0.63 ? Math.min(k.aiSpeed, currentMax(k) * 0.44) : k.aiSpeed;
  const error = target - k.speed;
  inp.accel = error > -0.45;
  inp.throttle = clamp(0.27 + error * 0.16, 0.05, 1);
  inp.brake = error < -1.35 && (k.boost <= 0 || error < -9);
  inp.brakeAmount = clamp(-error * 0.1, 0.19, 1);
  inp.reverse = false;
  if (state === 'race' && raceTime > 1 && k.spin <= 0 && Math.abs(k.speed) < 4) k.stuck += dt;
  else k.stuck = 0;
  if (k.stuck > 0.9) { k.revT = 0.7; k.stuck = 0; }
  if (k.revT > 0) { k.revT -= dt; inp.accel = false; inp.brake = true; inp.brakeAmount = 1; inp.reverse = true; inp.steer = -inp.steer; }
  if (k.item) {
    k.aiItemT -= dt;
    if (k.aiItemT <= 0) {
      let use = true;
      if (k.item === 'green') { use = k.aiItemT < -6; for (const o of karts) { if (o === k) continue; const dx = o.pos.x - k.pos.x, dz = o.pos.z - k.pos.z; if (Math.hypot(dx, dz) < 55 && Math.abs(angDiff(k.heading, Math.atan2(dx, dz))) < 0.2) use = true; } }
      if (k.item === 'mushroom' && (Math.abs(k.aiCurve) > 0.009 || k.aiSpeed < currentMax(k) * 0.9)) use = false;
      if (use) { inp.itemPressed = true; k.aiItemT = rand(0.4, 1.5); }
    }
  }
  return inp;
}

// ================= 레이스 =================
function startRace() {
  if (state === 'loading') return;
  state = 'loading';
  firstInteract();
  ['menu', 'results', 'pause'].forEach(id => $(id).classList.add('hidden'));
  $('loading').classList.remove('hidden');
  setTimeout(() => { try { buildRace(); } catch (error) { showGameError(error); toMenu(); } }, 40);
}
function buildRace() {
  raceLite = manualRaceQuality = false;
  resetFrameStats();
  frameStalls = 0;
  applyQuality();
  if (Sound.ctx) Music.render(TRACKS[settings.track].music);
  physicsLag = hudLag = minimapLag = 0;
  clearQueuedInput();
  lookBack = false;
  disposeScene(scene);
  envRT?.dispose();
  envRT = null;
  const def = TRACKS[settings.track];
  track = previewCache[def.name] || (previewCache[def.name] = buildTrack(def));
  buildWorld(track);
  initEffects();
  $('posWrap').classList.toggle('hidden', settings.mode === TRIAL);
  $('itemBox').classList.toggle('hidden', settings.mode === TRIAL);
  $('center').classList.remove('show');
  $('banner').classList.remove('show');
  clearTimeout($('banner')._t);
  karts = []; projectiles = []; finishShowT = 0;
  const pc = CHARS[settings.char], pv = VEHICLES[settings.veh];
  const trial = settings.mode === TRIAL;
  const others = trial ? [] : shuffled(CHARS.filter((_, i) => i !== settings.char)).slice(0, 7);
  const vehPool = shuffled(VEHICLES);
  const order = trial ? [pc] : [...others.slice(0, 5), pc, ...others.slice(5)];
  let vi = 0;
  order.forEach((ch, i) => {
    const isP = ch === pc;
    const k = new Kart(ch, isP ? pv : vehPool[vi++ % vehPool.length], isP);
    const row = Math.floor(i / 2), col = i % 2;
    const idx = ((track.N - Math.round(12 / track.sp) - row * Math.round(14 / track.sp)) % track.N + track.N) % track.N;
    const lat = trial ? 0 : (col ? 1 : -1) * track.halfW * 0.42 + (row % 2 ? 1.5 : -1.5);
    k.pos.set(track.P[idx].x + track.R[idx].x * lat, 0, track.P[idx].z + track.R[idx].z * lat);
    k.heading = track.H[idx]; k.idx = idx; k.lat = lat; k.gy = track.Y[idx];
    k.courseProgress = idx - track.N;
    k.skill = (CC[settings.cc].ai + (TRACKS[settings.track].hard || 0)) * k.driver.pace;
    k.aiLane = k.aiLaneTarget = lat;
    k.aiThinkT = trial ? 0 : -i * 0.012;
    if (isP) {
      player = k;
      if (trial) initTimeTrial(k);
    }
    snapshotKart(k);
    karts.push(k);
    updateVisuals(k, 0, 0);
  });
  camHeading = player.heading;
  camera.fov = 66; camera.updateProjectionMatrix();
  camera.position.set(player.pos.x - Math.sin(camHeading) * 14.5, player.gy + 6.7, player.pos.z - Math.cos(camHeading) * 14.5);
  camera.lookAt(player.pos.x + Math.sin(camHeading) * 8, player.gy + 1.5, player.pos.z + Math.cos(camHeading) * 8);
  chasePosition.copy(camera.position);
  wasLookingBack = false;
  skidTime = 0;
  raceTime = 0; countT = -4.0; state = 'countdown'; lastCount = null;
  Music.stop();
  drawMinimapBase();
  renderer.compile(scene, camera);
  renderScene(0, performance.now() / 1000);
  $('loading').classList.add('hidden'); $('hud').classList.remove('hidden');
  updateHUD(0);
  updateFrameHUD();
  drawMinimap();
  lastT = performance.now();
}
function shuffled(values) {
  const result = values.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function playerFinished() {
  const rk = ranking().indexOf(player) + 1;
  const finishLabel = settings.mode === TRIAL ? fmt(player.finishTime) : rk + '위';
  $('center').innerHTML = '<div class="finish">FINISH!</div><div class="fin2">' + finishLabel + '</div>';
  $('center').classList.add('show');
  Music.stop();
  (rk <= 3 ? [523, 659, 784, 1047, 784, 1047] : [523, 494, 440, 392]).forEach((f, i) => setTimeout(() => Sound.beep(f, 0.22, 'square', 0.08), i * 160));
  finishShowT = 3.5;
}
function showResults() {
  state = 'results';
  $('center').classList.remove('show');
  Music.play('menu');
  if (settings.mode === TRIAL) { showTrialResults(); return; }
  $('resNote').textContent = '* 아직 완주하지 않은 레이서의 예상 기록';
  const rk = ranking();
  const rows = rk.map((k, i) => {
    let t;
    if (k.finished) t = fmt(k.finishTime);
    else { const remain = LAPS * track.N - progress(k); t = fmt(raceTime + remain / track.N * track.len / (CC[settings.cc].max * 0.85)) + '*'; }
    return `<tr class="${k.isPlayer ? 'me' : ''}"><td>${i + 1}</td><td><span class="dot" style="background:#${k.m.baseColor.getHexString()}"></span>${k.ch.emoji} ${k.name}${k.isPlayer ? ' (나)' : ''}</td><td>${k.v.icon} ${k.v.name}</td><td>${t}</td></tr>`;
  }).join('');
  const my = rk.indexOf(player) + 1;
  $('resTitle').textContent = my === 1 ? '🏆 우승!' : my <= 3 ? `🏅 ${my}위 입상!` : `${my}위`;
  $('resTable').innerHTML = `<tr><th>순위</th><th>레이서</th><th>머신</th><th>기록</th></tr>` + rows;
  $('resBest').textContent = player.bestLap ? '최고 랩 ' + fmt(player.bestLap) + ' · ' + player.lapTimes.map((time, i) => 'L' + (i + 1) + ' ' + fmt(time)).join('  /  ') : '';
  $('results').classList.remove('hidden');
}
function showTrialResults() {
  const previous = player.trialBaseline;
  const result = player.newOverallTotal || player.newOverallLap ? '🏆 종합 신기록!'
    : player.newMachineTotal || player.newMachineLap ? '🏆 머신 신기록!' : '타임어택 완주';
  $('resTitle').textContent = result;
  const rows = player.lapTimes.map((time, i) => {
    const valid = player.trialLapValidity[i];
    return '<tr><td>' + (i + 1) + '</td><td>' + fmt(time) + '</td><td>'
      + (valid ? recordDelta(time, previous.lap).trim() || '—' : '기록 제외') + '</td></tr>';
  });
  $('resTable').innerHTML = '<tr><th>랩</th><th>기록</th><th>머신 최고 랩 대비</th></tr>' + rows.join('');
  $('resBest').textContent = '완주 ' + fmt(player.finishTime)
    + (player.trialRunValid ? recordDelta(player.finishTime, previous.total) : ' · 기록 제외')
    + '\n유효 최고 랩 ' + (player.bestLap === null ? '—' : fmt(player.bestLap));
  const notes = [];
  if (!player.trialRunValid) notes.push('프레임 지연 또는 탭 이동이 포함된 완주 기록과 해당 랩을 제외했습니다.');
  if (player.recordUnavailable) notes.push('브라우저 저장소에 새 기록을 저장하지 못했습니다.');
  else if (player.ghostUnavailable) notes.push('새 기록은 저장했습니다. 고스트 데이터 저장 공간이 부족합니다.');
  $('resNote').textContent = notes.join(' ');
  $('results').classList.remove('hidden');
}
function toMenu() {
  state = 'menu';
  raceLite = false;
  resetFrameStats();
  prScale = 1;
  applyQuality();
  updateModeUI();
  $('speedLines').style.opacity = 0; ['results', 'pause', 'hud'].forEach(id => $(id).classList.add('hidden')); $('menu').classList.remove('hidden');
  Sound.engine(0, false); Music.play('menu');
}
function togglePause(reason = 'manual') {
  if (!isDriving() && state !== 'paused') return;
  physicsLag = 0;
  lastT = performance.now();
  clearInput();
  if (isDriving()) {
    if (state === 'race' && reason !== 'manual') invalidateTimeTrial(player);
    stateBefore = state; state = 'paused';
    $('pauseReason').textContent = reason === 'stall' ? '프레임 지연으로 주행을 멈췄습니다.'
      : reason === 'hidden' ? '게임 화면을 떠나 주행을 멈췄습니다.' : '';
    if (stateBefore === 'race' && settings.mode === TRIAL && !player.trialRunValid) {
      $('pauseReason').textContent += ' 이번 완주와 중단된 랩은 최고 기록에서 제외됩니다.';
    }
    updateRaceQualityLabel();
    $('pause').classList.remove('hidden');
    $('resumeBtn').focus();
    Sound.engine(0, false);
  } else {
    state = stateBefore; $('pause').classList.add('hidden');
    $('resumeBtn').blur();
    fpsFrames = 0; fpsTime = 0;
  }
}

// ================= HUD =================
function fmt(time) {
  const ms = Math.round(Math.max(0, time) * 1000);
  return Math.floor(ms / 60000) + ':' + String(Math.floor(ms / 1000) % 60).padStart(2, '0')
    + '.' + String(ms % 1000).padStart(3, '0');
}
function banner(txt, ms) { const b = $('banner'); b.textContent = txt; b.classList.add('show'); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('show'), ms); }
function toast(txt) { banner(txt, 900); }
let rouletteFlip = 0;
const HC = {};
function setT(id, v) { if (HC[id] !== v) { HC[id] = v; $(id).textContent = v; } }
function setH(id, v) { if (HC['h' + id] !== v) { HC['h' + id] = v; $(id).innerHTML = v; } }
function updateHUD(dt) {
  if (!player) return;
  if (settings.mode !== TRIAL) {
    const pos = ranking().indexOf(player) + 1;
    setT('pos', pos); if (HC.posC !== pos) { HC.posC = pos; $('pos').className = 'p' + Math.min(pos, 4); }
  }
  setT('lap', `LAP ${clamp(player.lap, 1, LAPS)}/${LAPS}`);
  const elapsed = player.finished ? player.finishTime : raceTime;
  setT('time', fmt(elapsed));
  const lapTime = player.finished ? player.lapTimes.at(-1) : Math.max(0, raceTime - player.lapStart);
  setT('lapClock', player.lap > 0 && !player.finished ? '현재 랩 ' + fmt(lapTime) : '');
  const lastLap = player.lapTimes.at(-1);
  const trial = settings.mode === TRIAL;
  const benchmark = trial ? player.trialBaseline.lap : null;
  const lastLapValid = !trial || player.trialLapValidity.at(-1);
  const comparison = lastLap === undefined ? '' : '직전 랩 ' + fmt(lastLap)
    + (lastLapValid ? recordDelta(lastLap, benchmark) : ' · 기록 제외');
  setT('lapCompare', comparison || (benchmark === null ? '' : '머신 최고 랩 ' + fmt(benchmark)));
  setT('sectorCompare', trial ? trialSectorLabel(player) : '');
  setT('speed', Math.round(Math.abs(player.speed) * 4.2));
  if (player.roulette > 0) {
    rouletteFlip -= dt;
    if (rouletteFlip <= 0) { rouletteFlip = 0.07; const ks = Object.keys(ITEMS); setH('itemIcon', ITEMS[ks[Math.floor(Math.random() * ks.length)]].icon); }
  } else setH('itemIcon', player.item ? ITEMS[player.item].icon + (player.itemCount > 1 ? `<span class="cnt">×${player.itemCount}</span>` : '') : '');
  const t = track.T[player.idx], fdot = (Math.sin(player.heading) * t.x + Math.cos(player.heading) * t.z) * Math.sign(player.speed);
  const wr = state === 'race' && fdot < -0.4 && Math.abs(player.speed) > 5 && !player.finished;
  if (HC.wrong !== wr) { HC.wrong = wr; $('wrong').classList.toggle('show', wr); }
}
let mmBase = null, mmTf = null;
function drawMinimapBase() {
  const c = $('minimap'), W = c.width, Hh = c.height, b = track.bounds, pad = 14;
  const s = Math.min((W - pad * 2) / (b.maxX - b.minX), (Hh - pad * 2) / (b.maxZ - b.minZ));
  const ox = (W - (b.maxX - b.minX) * s) / 2, oz = (Hh - (b.maxZ - b.minZ) * s) / 2;
  mmTf = (x, z) => [ox + (x - b.minX) * s, oz + (z - b.minZ) * s];
  const off = document.createElement('canvas'); off.width = W; off.height = Hh; const o = off.getContext('2d');
  o.lineJoin = 'round';
  const path = () => { o.beginPath(); track.P.forEach((p, i) => { const [x, y] = mmTf(p.x, p.z); i ? o.lineTo(x, y) : o.moveTo(x, y); }); o.closePath(); };
  path(); o.strokeStyle = 'rgba(0,0,0,0.55)'; o.lineWidth = 11; o.stroke();
  path(); o.strokeStyle = 'rgba(255,255,255,0.95)'; o.lineWidth = 6; o.stroke();
  const [sx, sy] = mmTf(track.P[0].x, track.P[0].z); o.fillStyle = '#111'; o.fillRect(sx - 4, sy - 4, 8, 8); o.fillStyle = '#fff'; o.fillRect(sx - 4, sy - 4, 4, 4); o.fillRect(sx, sy, 4, 4);
  mmBase = off;
}
function drawMinimap() {
  const c = $('minimap'), g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height); g.drawImage(mmBase, 0, 0);
  for (const p of projectiles) { const [x, y] = mmTf(p.pos.x, p.pos.z); g.fillStyle = p.type === 'banana' ? '#ffeb3b' : p.type === 'red' ? '#f44' : '#2ecc40'; g.fillRect(x - 2, y - 2, 4, 4); }
  for (const k of karts) { if (k === player) continue; const [x, y] = mmTf(k.pos.x, k.pos.z); g.beginPath(); g.arc(x, y, 4.5, 0, TAU); g.fillStyle = '#' + k.m.baseColor.getHexString(); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1.5; g.stroke(); }
  const [x, y] = mmTf(player.pos.x, player.pos.z);
  g.save(); g.translate(x, y); g.rotate(-player.heading + Math.PI);
  g.beginPath(); g.moveTo(0, 8); g.lineTo(6, -6); g.lineTo(-6, -6); g.closePath();
  g.fillStyle = '#' + player.m.baseColor.getHexString(); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.stroke(); g.restore();
}

// ================= 루프 =================
function updateVisuals(k, dt, t, alpha = 1) {
  const m = k.m;
  const pose = k.pose;
  m.group.position.set(lerp(pose.x, k.pos.x, alpha), lerp(pose.y, k.gy + k.y, alpha), lerp(pose.z, k.pos.z, alpha));
  m.group.rotation.y = pose.heading + angDiff(pose.heading, k.heading) * alpha + k.spinAng;
  m.group.rotation.x = -k.pitch + (k.y > 0 ? -0.08 : 0);
  m.body.rotation.z = lerp(m.body.rotation.z, k.drift ? k.drift * 0.11 : k.steerVis * 0.055 * clamp(k.speed / 40, 0, 1), 1 - Math.exp(-13 * dt));
  k.wheelRot += k.speed * dt / 0.45;
  m.wheels.forEach(w => { w.spin.rotation.x = k.wheelRot; if (w.front) w.steer.rotation.y = -k.steerVis * 0.35; });
  const lvl = k.drift ? driftLevel(k.driftCharge) : 0;
  m.sparks.forEach(s => { s.visible = !!k.drift; if (s.visible) { s.material.color.setHex(DRIFT_COLORS[lvl]); s.scale.setScalar((lvl ? 0.8 + lvl * 0.35 : 0.5) * (0.7 + Math.random() * 0.6)); s.rotation.y = t * 20; s.material.opacity = lvl ? 0.95 : 0.5; } });
  m.flame.visible = k.boost > 0 || k.star > 0;
  if (m.flame.visible) { m.flame.scale.set(1, 0.8 + Math.random() * 0.6, 1); m.flame.material.color.setHex(Math.random() < 0.5 ? 0xff9100 : 0xffea00); }
  if (k.star > 0) m.paint.color.setHSL((t * 3) % 1, 1, 0.55); else m.paint.color.copy(m.baseColor);
  m.group.visible = k.ghost > 0 && k.spin <= 0 ? (Math.floor(t * 20) % 2 === 0) : true;
}
let lastT = performance.now();
function snapshotKart(k) {
  const pose = k.pose;
  pose.x = k.pos.x; pose.y = k.gy + k.y; pose.z = k.pos.z; pose.heading = k.heading;
}

function loop(now) {
  requestAnimationFrame(loop);
  const elapsed = Math.max(0, (now - lastT) / 1000);
  const dt = Math.min(0.25, elapsed);
  const t = now / 1000;
  lastT = now;
  if (document.hidden) return;
  if (state === 'loading') return;
  if (state === 'menu' || !track) { renderMenuBG(t); return; }
  if (isDriving() && !player.finished && elapsed > FRAME_GAP_LIMIT) {
    frameStalls++;
    if (Q !== QUALITY.low && !raceLite && !manualRaceQuality) setRaceLite(true);
    if (state === 'race') {
      recordFrame(elapsed);
      updateFrameHUD();
      togglePause('stall');
      return;
    }
  }
  const wasPaused = state === 'paused';
  const currentFrameInput = readInput();
  if (wasPaused || state === 'paused') return;
  if (isDriving() && elapsed > 0) fpsTick(elapsed);

  jumpQueued ||= currentFrameInput.hopPressed;
  if (!itemQueued && currentFrameInput.itemPressed) {
    itemQueued = true;
    itemBackQueued = currentFrameInput.brake;
  }
  physicsLag += dt;
  while (physicsLag + 1e-9 >= PHYSICS_DT) {
    physicsLag -= PHYSICS_DT;
    for (const k of karts) snapshotKart(k);
    if (state === 'results') stepAIOnly(PHYSICS_DT);
    else {
      currentFrameInput.hopPressed = jumpQueued;
      currentFrameInput.itemPressed = itemQueued;
      currentFrameInput.itemBack = itemBackQueued || currentFrameInput.brake;
      clearQueuedInput();
      step(PHYSICS_DT, t, currentFrameInput);
    }
  }

  const alpha = clamp(physicsLag / PHYSICS_DT, 0, 1);
  for (const k of karts) updateVisuals(k, dt, t, alpha);
  if (!raceLite) for (const a of anims) a(dt, t);
  animateRace(dt, t);
  updateEffects(dt);
  hudLag += dt;
  minimapLag += dt;
  if (hudLag >= 0.075) { updateHUD(hudLag); hudLag = 0; }
  if (minimapLag >= 0.10) { drawMinimap(); minimapLag = 0; }
  renderScene(dt, t);
}
function step(dt, _t, pInp = readInput()) {
  lookBack = pInp.back;
  if (state === 'countdown') {
    countT += dt;
    const n = Math.ceil(-countT - 1);
    if (countT < -1 && n !== lastCount && n >= 1 && n <= 3) {
      lastCount = n; showCount(String(n)); Sound.beep(440, 0.2, 'square', 0.09);
      const L = scene.userData.startLights; if (L) L.forEach((l, i) => l.material.color.setHex(i < Math.round((4 - n) * 5 / 3) ? 0xff1744 : 0x330000));
    }
    if (pInp.accel && player.firstPress === null) player.firstPress = countT;
    if (!pInp.accel) player.firstPress = null;
    if (countT >= -1) {
      state = 'race'; showCount('GO!'); Sound.beep(880, 0.5, 'square', 0.1);
      const L = scene.userData.startLights; if (L) L.forEach(l => l.material.color.setHex(0x00e676));
      setTimeout(() => $('center').classList.remove('show'), 700);
      Music.play(TRACKS[settings.track].music);
      if (pInp.accel && player.firstPress !== null) {
        if (player.firstPress > -2.3 && player.firstPress < -1.2) { player.boost = 1.3; player.speed = 30; banner('🚀 로켓 스타트!', 1200); }
        else if (player.firstPress <= -3.0) { player.stall = 1.2; banner('💨 엔진 과열...', 1000); }
      }
      for (const k of karts) if (!k.isPlayer && Math.random() < 0.4) k.boost = 1.0;
      countT = 0;
    }
    return;
  }
  raceTime += dt;
  const pp = progress(player), level = AI_CLASSES[settings.cc];
  for (const k of karts) {
    if (k.finished) continue;
    if (!k.isPlayer) {
      const correction = clamp((pp - progress(k)) / track.N, -1, 1) * level.catchUp;
      k.statSpeed = k.skill * (1 + correction);
    }
    updateKart(k, k.isPlayer && !window.__autopilot ? pInp : aiInput(k, dt), dt);
  }
  if (settings.mode === TRIAL) sampleTrialLap(player);
  resolveKartContacts();
  updateProjectiles(dt);
  for (const b of boxes) {
    if (b.active) continue;
    b.t -= dt;
    if (b.t <= 0) { b.active = true; b.mesh.visible = true; b.mesh.scale.setScalar(0.1); }
  }
  if (finishShowT > 0) {
    finishShowT -= dt;
    if (finishShowT <= 0) showResults();
  }
}

function stepAIOnly(dt) {
  if (settings.mode === TRIAL || karts.every(k => k.finished)) return;
  raceTime += dt;
  for (const k of karts) if (!k.finished) updateKart(k, aiInput(k, dt), dt);
}

let skidTime = 0;
function animateRace(dt, t) {
  for (const b of boxes) {
    if (!b.active) continue;
    b.mesh.rotation.y += dt * 1.5;
    b.mesh.rotation.x += dt * 0.8;
    b.mesh.position.y = b.y0 + Math.sin(t * 2 + b.ph) * 0.3;
    const s = b.mesh.scale.x;
    if (s < 1) b.mesh.scale.setScalar(Math.min(1, s + dt * 2));
  }
  for (const d of dashes) d.mat.emissiveIntensity = 0.55 + 0.25 * Math.sin(t * 10);
  if (state === 'race') {
    skidTime += dt;
    if (skidTime >= 0.041) {
      skidTime = 0;
      for (const k of karts) {
        if (k.finished) continue;
        if (k.isPlayer || Q !== QUALITY.low) recordSkid(k);
        if (k.drift && Math.abs(k.slip) > 0.08 && (k.isPlayer || Q !== QUALITY.low)) {
          emitV3(k, 3, DRIFT_COLORS[driftLevel(k.driftCharge)], 'drift');
        }
        if (k.boost > 0 && (k.isPlayer || Q !== QUALITY.low)) emitV3(k, 2, 0xffaa38, 'boost');
      }
    }
  }
  Sound.engine(player.speed, state === 'race' && !player.finished);
}
function showCount(s) { const c = $('center'); c.innerHTML = `<div class="count">${s}</div>`; c.classList.remove('show'); void c.offsetWidth; c.classList.add('show'); }
const chasePosition = new THREE.Vector3();
let wasLookingBack = false;
function renderScene(dt, t) {
  const k = player;
  const position = k.m.group.position;
  const aligned = k.heading - k.slip * 0.72;
  camHeading += angDiff(camHeading, aligned) * (1 - Math.exp(-(k.drift ? 5.2 : 8.5) * dt));
  const back = lookBack ? -1 : 1;
  const fx = Math.sin(camHeading) * back, fz = Math.cos(camHeading) * back;
  const boosting = k.boost > 0 || k.star > 0;
  const pace = clamp(k.speed / 82, 0, 1);
  const dist = 11.1 + (boosting ? 2.4 : 0) + pace * 2.1;
  const tx = position.x - fx * dist, tz = position.z - fz * dist;
  const camG = Math.max(k.gy, groundY({ pos: { x: tx, z: tz }, idx: k.idx }));
  const height = camG + 4.5 - 0.55 * pace + k.y * 0.44;
  const blend = 1 - Math.exp(-(state === 'countdown' ? 3.2 : 17) * dt);
  if (wasLookingBack !== lookBack) chasePosition.set(tx, height, tz);
  else {
    chasePosition.x = lerp(chasePosition.x, tx, blend);
    chasePosition.z = lerp(chasePosition.z, tz, blend);
    chasePosition.y = lerp(chasePosition.y, height, blend);
  }
  wasLookingBack = lookBack;
  camera.position.copy(chasePosition);
  cameraShake *= Math.exp(-9 * dt);
  if (!reducedMotion) {
    camera.position.x += Math.sin(t * 103) * cameraShake * 0.48;
    camera.position.y += Math.cos(t * 127) * cameraShake * 0.30;
  }
  camera.lookAt(position.x + fx * (5 + pace * 3.5), position.y + 1.6, position.z + fz * (5 + pace * 3.5));
  if (!reducedMotion && back > 0) camera.rotateZ(clamp(-k.slip * 0.12, -0.048, 0.048));
  const fov = 65 + (reducedMotion ? 0 : (boosting ? 10 : 0) + pace * 7);
  const nextFov = lerp(camera.fov, fov, 1 - Math.exp(-5 * dt));
  if (Math.abs(nextFov - camera.fov) > 0.015) { camera.fov = nextFov; camera.updateProjectionMatrix(); }
  if (!reducedMotion && Q !== QUALITY.low && !raceLite) {
    const target = state === 'race' && !lookBack ? (boosting ? 0.48 : 0.16 * smooth(0.7, 1, pace)) : 0;
    speedEffect = lerp(speedEffect, target, 1 - Math.exp(-7 * dt));
    $('speedLines').style.opacity = speedEffect.toFixed(2);
  }
  skyMesh.position.copy(camera.position);
  sun.target.position.set(position.x + fx * 40, k.gy, position.z + fz * 40);
  sun.position.copy(sun.target.position).addScaledVector(sun.userData.dir, 400);
  if (settings.mode === TRIAL) drawTrialGhost(k);
  renderer.render(scene, camera);
}

// ================= 메뉴 =================
let menuScene = null, menuCar = null, menuCam = null, menuEnv = null, menuKey = '';
function renderMenuBG(t) {
  if (!menuScene) {
    menuScene = new THREE.Scene();
    const th = { ...THEMES.monza, sunDir: [0.5, 0.35, 0.7] };
    menuScene.add(makeSky(th));
    if (Q.carPbr) {
      const pm = new THREE.PMREMGenerator(renderer);
      const es = new THREE.Scene();
      es.add(makeSky(th));
      menuEnv = pm.fromScene(es, 0.04);
      menuScene.environment = menuEnv.texture;
      pm.dispose();
      disposeScene(es);
    }
    menuScene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 0.6));
    const dl = new THREE.DirectionalLight(0xffffff, 2.2); dl.position.set(6, 12, 8); dl.castShadow = true; dl.shadow.mapSize.set(1024, 1024);
    Object.assign(dl.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 }); menuScene.add(dl);
    const fl = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.3, 0.5, 64), new THREE.MeshStandardMaterial({ color: 0x222228, metalness: 0.6, roughness: 0.3 })); fl.position.y = -0.25; fl.receiveShadow = true; menuScene.add(fl);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(7.1, 0.08, 8, 80), new THREE.MeshBasicMaterial({ color: 0xffd54f })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.02; menuScene.add(ring);
    menuCam = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, 0.1, 6000);
  }
  const key = settings.char + '_' + settings.veh;
  if (menuKey !== key) {
    menuKey = key;
    if (menuCar) { menuScene.remove(menuCar.group); disposeScene(menuCar.group); }
    menuCar = buildCar(VEHICLES[settings.veh].id, CHARS[settings.char]);
    menuScene.add(menuCar.group);
  }
  const wide = innerWidth > 1000;
  menuCam.position.set(wide ? -4.2 : 0, 4.6, 14.5); menuCam.lookAt(wide ? -4.2 : 0, 0.9, 0);
  menuCar.group.rotation.y = t * 0.6;
  menuCar.wheels.forEach(w => w.spin.rotation.x = t * 4);
  const aspect = innerWidth / innerHeight;
  if (menuCam.aspect !== aspect) { menuCam.aspect = aspect; menuCam.updateProjectionMatrix(); }
  renderer.render(menuScene, menuCam);
}
function buildMenu() {
  const bars = v => ['spd', 'acc', 'hnd', 'off'].map((s, i) => { const val = s === 'off' ? v.off : (v[s] - 0.8) / 0.35 * 0.9; return `<div class="bar"><span>${['속도', '가속', '핸들', '험로'][i]}</span><i><b style="width:${clamp(val, 0.1, 1) * 100}%"></b></i></div>`; }).join('');
  $('chars').innerHTML = CHARS.map((c, i) => `<button class="card char ${i === settings.char ? 'sel' : ''}" data-i="${i}"><span class="emo" style="background:#${new THREE.Color(c.color).getHexString()}">${c.emoji}</span><b>${c.name}</b></button>`).join('');
  $('vehs').innerHTML = VEHICLES.map((v, i) => `<button class="card veh ${i === settings.veh ? 'sel' : ''}" data-i="${i}"><b>${v.icon} ${v.name}</b><small>${v.desc}</small><div class="bars">${bars(v)}</div></button>`).join('');
  $('tracks').innerHTML = TRACKS.map((tr, i) => `<button class="card trk ${i === settings.track ? 'sel' : ''} ${tr.hard ? 'hard' : ''}" data-i="${i}"><canvas width="120" height="80" data-t="${i}"></canvas><b>${tr.name}</b><small>${tr.desc}</small></button>`).join('');
  $('ccs').innerHTML = CC.map((c, i) => `<button class="card cc ${i === settings.cc ? 'sel' : ''}" data-i="${i}"><b>${c.name}</b></button>`).join('');
  const bind = (id, key) => $(id).querySelectorAll('button').forEach(b => b.onclick = () => { settings[key] = +b.dataset.i; buildMenu(); });
  bind('chars', 'char'); bind('vehs', 'veh'); bind('tracks', 'track'); bind('ccs', 'cc');
  $('tracks').querySelectorAll('canvas').forEach(cv => drawTrackPreview(cv, TRACKS[+cv.dataset.t]));
  updateModeUI();
  updateOptBtns();
}
function updateModeUI() {
  const trial = settings.mode === TRIAL;
  $('modes').innerHTML = [
    ['race', '그랑프리'], [TRIAL, '타임어택'],
  ].map(([value, label]) => {
    const selected = settings.mode === value;
    return '<button class="card' + (selected ? ' sel' : '') + '" data-mode="' + value + '" aria-pressed="' + selected + '"><b>' + label + '</b></button>';
  }).join('');
  $('modes').querySelectorAll('button').forEach(button => button.onclick = () => {
    settings.mode = button.dataset.mode;
    updateModeUI();
    $('modes').querySelector('[aria-pressed="true"]').focus();
  });
  $('modeDescription').textContent = trial ? '단독 주행 · 3랩 · 대시 패널 사용' : '8명의 레이서 · 3랩 · 아이템 배틀 레이스 · 5개 코스';
  $('startBtn').textContent = trial ? '타임어택 시작 (Enter)' : '레이스 시작! (Enter)';
  const record = $('menuRecord');
  record.classList.toggle('hidden', !trial);
  $('optGhost').classList.toggle('hidden', !trial);
  if (trial) {
    const { overall, machine, legacy } = readTrialRecords();
    const name = VEHICLES[settings.veh].name;
    const time = value => value === null ? '—' : fmt(value);
    const leader = (value, id) => value === null ? '—' : time(value) + ' (' + (VEHICLES.find(v => v.id === id)?.name || '—') + ')';
    const lines = [
      '종합 · 완주 ' + leader(overall.total, overall.totalMachine) + ' · 최고 랩 ' + leader(overall.lap, overall.lapMachine),
      name + ' · 완주 ' + time(machine.total) + ' · 최고 랩 ' + time(machine.lap),
    ];
    if (legacy.lap !== null || legacy.total !== null) {
      lines.push('이전 V3 기록 (머신 미상) · 완주 ' + time(legacy.total) + ' · 랩 ' + time(legacy.lap));
    }
    record.textContent = lines.join('\n');
  }
}
function updateOptBtns() {
  if (!$('optBgm')) return;
  $('optBgm').textContent = `🎵 BGM: ${Music.on ? 'ON' : 'OFF'}`;
  $('optSnd').textContent = `🔊 효과음: ${Sound.on ? 'ON' : 'OFF'}`;
  $('optHq').textContent = `🖥️ 그래픽: ${Q.name}`;
  $('optGhost').textContent = '고스트 ' + (ghostEnabled ? '켜짐' : '꺼짐');
  $('optGhost').setAttribute('aria-pressed', String(ghostEnabled));
}
const previewCache = {};
function drawTrackPreview(cv, def) {
  const tr = previewCache[def.name] || (previewCache[def.name] = buildTrack(def));
  const th = THEMES[def.theme];
  const g = cv.getContext('2d'), W = cv.width, H = cv.height, b = tr.bounds;
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#' + new THREE.Color(th.skyHor).getHexString()); gr.addColorStop(1, '#' + new THREE.Color(th.low).getHexString());
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const s = Math.min((W - 16) / (b.maxX - b.minX), (H - 16) / (b.maxZ - b.minZ));
  const ox = (W - (b.maxX - b.minX) * s) / 2, oz = (H - (b.maxZ - b.minZ) * s) / 2;
  g.beginPath(); tr.P.forEach((p, i) => { const x = ox + (p.x - b.minX) * s, y = oz + (p.z - b.minZ) * s; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath();
  g.lineJoin = 'round'; g.strokeStyle = '#222'; g.lineWidth = 6; g.stroke(); g.strokeStyle = '#eee'; g.lineWidth = 3; g.stroke();
}
function basePR() { return Math.min(devicePixelRatio || 1, Q.pr); }
function applyQuality() {
  const ratio = basePR() * prScale;
  if (renderer.getPixelRatio() !== ratio) renderer.setPixelRatio(ratio);
  renderer.shadowMap.enabled = Q.shadow > 0 && !raceLite;
  renderer.setSize(innerWidth, innerHeight);
}
function createRenderer() {
  if (renderer) {
    disposeScene(scene);
    disposeScene(menuScene);
    envRT?.dispose(); menuEnv?.dispose();
    renderer.domElement.remove();
    renderer.dispose();
    renderer.forceContextLoss();
    scene = track = menuScene = menuCar = envRT = menuEnv = null;
  }
  renderer = new THREE.WebGLRenderer({ antialias: Q.aa, powerPreference: 'high-performance' });
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = Q.tone === false ? THREE.LinearToneMapping : THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.type = Q.shadow >= 2048 ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  prScale = 1;
  applyQuality();
  renderer.domElement.addEventListener('webglcontextlost', event => {
    if (event.target !== renderer.domElement) return;
    if (state === 'race' || state === 'countdown') togglePause();
    showGameError(new Error('그래픽 장치 연결이 끊겼습니다.'));
  });
  document.body.prepend(renderer.domElement);
  menuScene = null; menuKey = '';
  try {
    const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    gpuName = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  } catch (e) { gpuName = '?'; }
  softGPU = /swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(gpuName);
  const w = $('gpuWarn'); if (w) w.classList.toggle('hidden', !softGPU);
  const gi = $('gpuInfo'); if (gi) gi.textContent = 'GPU: ' + gpuName.replace(/ANGLE \(|\)$/g, '').slice(0, 90);
}
function setQuality(q) {
  settings.q = q; Q = QUALITY[q];
  try { localStorage.setItem('super-kart-v3-quality', q); } catch (e) { }
  createRenderer(); updateOptBtns();
}
function updateRaceQualityLabel() {
  $('pauseQuality').textContent = raceLite ? '주행 그래픽: 저사양' : '주행 그래픽: ' + Q.name;
  $('pauseQuality').setAttribute('aria-pressed', String(raceLite || Q === QUALITY.low));
  $('pauseQuality').disabled = Q === QUALITY.low;
}
function setRaceLite(enabled, manual = false) {
  if (!scene || Q === QUALITY.low) return;
  raceLite = enabled;
  manualRaceQuality ||= manual;
  lowFpsWindows = 0;
  for (const scenery of scene.userData.optionalScenery) scenery.visible = !enabled;
  for (const k of karts) k.m.shadowBlob.visible = enabled;
  sun.castShadow = !enabled && Q.shadow > 0;
  prScale = enabled ? Math.min(prScale, 0.65) : Math.min(1, Math.max(prScale, 0.65));
  $('speedLines').style.opacity = 0;
  applyQuality();
  updateRaceQualityLabel();
  updateFrameHUD();
  if (state === 'paused') renderScene(0, performance.now() / 1000);
}
function resetFrameStats() {
  fpsFrames = fpsTime = lowFpsWindows = frameWriteIndex = 0;
  frameSamples.length = 0;
}
function recordFrame(dt) {
  frameSamples[frameWriteIndex] = dt * 1000;
  frameWriteIndex = (frameWriteIndex + 1) % 240;
}
function frameStats() {
  const sorted = frameSamples.slice().sort((a, b) => a - b);
  const percentile = p => sorted[Math.ceil(sorted.length * p) - 1] || 0;
  const total = sorted.reduce((sum, time) => sum + time, 0);
  return {
    fps: total ? sorted.length * 1000 / total : 0,
    p95: percentile(0.95), p99: percentile(0.99), stalls: frameStalls,
  };
}
function updateFrameHUD() {
  const { fps, p95, p99, stalls } = frameStats();
  const quality = raceLite ? '저사양' : Q.name;
  $('fps').textContent = (fps ? Math.round(fps) + ' FPS · ' : '') + quality
    + (prScale < 1 ? ' · 해상도 ' + Math.round(prScale * 100) + '%' : '');
  $('frameLatency').textContent = p95 ? 'P95 ' + Math.round(p95) + ' ms · P99 ' + Math.round(p99) + ' ms'
    + (stalls ? ' · 지연 ' + stalls + '회' : '') : '';
}
function fpsTick(dt) {
  recordFrame(dt);
  fpsFrames++; fpsTime += dt;
  if (fpsTime < 1.5) return;
  const fps = fpsFrames / fpsTime; fpsFrames = 0; fpsTime = 0;
  if (state === 'race' && !player.finished) {
    const maxScale = raceLite ? 0.65 : 1;
    const next = fps < 42 ? Math.max(0.4, prScale - (fps < 27 ? 0.15 : 0.08))
      : fps > 57 ? Math.min(maxScale, prScale + 0.04) : prScale;
    if (next !== prScale) { prScale = next; applyQuality(); }
    lowFpsWindows = fps < 35 && prScale <= 0.4 ? lowFpsWindows + 1 : 0;
    if (lowFpsWindows >= 2 && Q !== QUALITY.low && !raceLite && !manualRaceQuality) setRaceLite(true);
  }
  updateFrameHUD();
}

// ================= 초기화 =================
function showGameError(error) {
  console.error(error);
  const alert = $('bootError');
  alert.textContent = '게임을 실행할 수 없습니다. 그래픽 가속을 확인한 뒤 페이지를 새로고침하세요.';
  alert.classList.remove('hidden');
  $('loading').classList.add('hidden');
}

function init() {
  THREE.ColorManagement.legacyMode = false;
  createRenderer();
  if (autoQ && softGPU) setQuality('low');
  camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.5, 6000);
  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
  makeTextures();
  buildMenu();
  $('startBtn').onclick = startRace; $('retryBtn').onclick = startRace; $('menuBtn').onclick = toMenu;
  $('resumeBtn').onclick = () => togglePause(); $('restartBtn').onclick = startRace; $('quitBtn').onclick = toMenu;
  $('pauseQuality').onclick = () => setRaceLite(!raceLite, true);
  $('optGhost').onclick = () => { setGhostEnabled(!ghostEnabled); updateOptBtns(); };
  $('optBgm').onclick = () => { firstInteract(); Music.toggle(); };
  $('optSnd').onclick = () => { firstInteract(); Sound.toggle(); };
  $('optHq').onclick = () => { setQuality(Q_ORDER[(Q_ORDER.indexOf(settings.q) + 1) % 3]); };
  requestAnimationFrame(loop);
}
window.__game = { get physicsDt() { return PHYSICS_DT; }, get raceLite() { return raceLite; }, frameStats, get marks() { return effects?.marks.count || 0; }, get state() { return state; }, get player() { return player; }, get karts() { return karts; }, get raceTime() { return raceTime; }, get track() { return track; }, get projectiles() { return projectiles; }, startRace, buildRace, settings, keys, step, ranking, Music, renderScene, setQuality, renderer: () => renderer, scene: () => scene };
try { init(); } catch (error) { showGameError(error); }
