// The hill set: scene description shared by every lens (plain JS, no GL).
// Ported from style-frames/10-world-ladder/ladder.html and generalised: the camera, the
// terrain, the tree's growth, the figure, Clawd, the towers and the sky ring are all
// per-frame parameters instead of baked constants.
//
// Units are metres. x right, y up, z away from the default camera. Screen coordinates are
// always in 1920x1080 "design pixels" (y down); the renderer scales to the real canvas.

export const MAT = { SKY: 0, FLOOR: 1, HILL: 2, TRUNK: 3, LEAF: 4, SKIN: 5, HAIR: 6, SWEATER: 7, PANTS: 8, SHOE: 9, CLAWD: 10, CLOUD: 11, TOWER: 12 };

export const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
};
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const ease = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
const easeOutBack = (t) => { t = clamp(t); const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

// ---------------------------------------------------------------- camera
// The ladder camera: at (0, 0.7, 0) looking down +z, focal 1400 px, principal point
// (960, 780) so the horizon sits low (anime background convention). yaw turns right,
// pitch tilts up; the lens shift stays, so a level camera keeps verticals vertical.
export const LADDER_CAM = { pos: [0, 0.7, 0], yaw: 0, pitch: 0, F: 1400, pp: [960, 780] };

export function camBasis(cam) {
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const fw = [sy * cp, sp, cy * cp];
  const right = [cy, 0, -sy];
  const up = v3.cross(fw, right);
  return { pos: cam.pos, fw, right, up, F: cam.F || 1400, pp: cam.pp || [960, 780] };
}
// world point -> [x, y, depth] in design pixels (y down); depth <= 0 means behind the camera
export function project(B, p) {
  const d = v3.sub(p, B.pos);
  const z = v3.dot(d, B.fw);
  return [B.pp[0] + B.F * v3.dot(d, B.right) / z, B.pp[1] - B.F * v3.dot(d, B.up) / z, z];
}
export function rayDir(B, px, py) {
  return v3.norm(v3.add(B.fw, v3.add(v3.mul(B.right, (px - B.pp[0]) / B.F), v3.mul(B.up, (B.pp[1] - py) / B.F))));
}
export const sunDir = (azDeg, elDeg) => {
  const a = azDeg * Math.PI / 180, e = elDeg * Math.PI / 180;
  return [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];
};
// the ladder's sun: pixel (1500, 664) through the ladder camera
export const LADDER_SUN = { az: 21.09, el: 4.42 };

// ---------------------------------------------------------------- terrain
// Gaussian bumps [amplitude, cx, cz, sx, sz]: a broad mound with a crest on the right
// and a shoulder on the left. Scale the amplitudes to grow it.
export const HILL = [
  [1.618, 1.621, 12.597, 1.657, 4.959],
  [0.935, -5.269, 10.239, 4.032, 1.825],
  [1.138, 0.370, 7.926, 6.181, 3.047],
];
export const HILL_EPS = 0.00002;
export function hillH(bumps, x, z) {
  let h = 0;
  for (const [a, cx, cz, sx, sz] of bumps) { const dx = (x - cx) / sx, dz = (z - cz) / sz; h += a * Math.exp(-(dx * dx + dz * dz)); }
  return 0.5 * (h + Math.sqrt(h * h + HILL_EPS));
}
export const growHill = (g) => HILL.map((b, i) => [b[0] * (Array.isArray(g) ? g[i] : g), b[1], b[2], b[3], b[4]]);

// ---------------------------------------------------------------- the figure (seated, hugging her knees)
// Local frame: x forward, y up, z toward her right hand; origin on the ground at the seat.
export const HUMAN_PRIMS = (() => {
  const P = [], add = (o) => P.push(o);
  add({ t: 'ell', c: [-0.03, 0.13, 0], rad: [0.13, 0.11, 0.165], mat: MAT.PANTS, part: 1, k: 0.02 });
  for (const s of [-1, 1]) add({ t: 'rc', a: [-0.03, 0.18, 0.06 * s], b: [0.07, 0.49, 0.075 * s], r: 0.118, r2: 0.112, mat: MAT.SWEATER, part: 2, k: 0.06 });
  for (const s of [-1, 1]) add({ t: 'sph', c: [0.07, 0.505, 0.15 * s], r: 0.075, mat: MAT.SWEATER, part: 2, k: 0.07 });
  add({ t: 'cap', a: [0.08, 0.54, 0], b: [0.105, 0.655, 0], r: 0.046, mat: MAT.SKIN, part: 3, k: 0.03 });
  const turn = (c) => { const a = -0.30, f = c[0] - 0.1, z = c[2]; return [0.1 + f * Math.cos(a) - z * Math.sin(a), c[1], f * Math.sin(a) + z * Math.cos(a)]; };
  add({ t: 'ell', c: turn([0.125, 0.755, 0]), rad: [0.098, 0.116, 0.086], mat: MAT.SKIN, part: 3, k: 0.02 });
  add({ t: 'ell', c: turn([0.102, 0.772, 0]), rad: [0.106, 0.124, 0.1], mat: MAT.HAIR, part: 4, k: 0.01 });
  add({ t: 'ell', c: turn([0.08, 0.69, 0]), rad: [0.088, 0.06, 0.106], mat: MAT.HAIR, part: 4, k: 0.04 });
  for (const s of [-1, 1]) {
    const hip = [0.0, 0.12, 0.085 * s], knee = [0.35, 0.44, 0.08 * s], ankle = [0.41, 0.075, 0.075 * s];
    add({ t: 'rc', a: hip, b: knee, r: 0.078, r2: 0.058, mat: MAT.PANTS, part: 5 + (s > 0 ? 1 : 0), k: 0.03 });
    add({ t: 'rc', a: knee, b: ankle, r: 0.056, r2: 0.04, mat: MAT.PANTS, part: 5 + (s > 0 ? 1 : 0), k: 0.02 });
    add({ t: 'rc', a: [0.39, 0.05, 0.075 * s], b: [0.53, 0.035, 0.085 * s], r: 0.045, r2: 0.036, mat: MAT.SHOE, part: 7, k: 0.02 });
  }
  for (const s of [-1, 1]) {
    const sh = [0.07, 0.5, 0.165 * s], el = [0.25, 0.33, 0.205 * s], wr = [0.45, 0.37, 0.045 * s];
    add({ t: 'rc', a: sh, b: el, r: 0.058, r2: 0.05, mat: MAT.SWEATER, part: 8 + (s > 0 ? 1 : 0), k: 0.03 });
    add({ t: 'rc', a: el, b: wr, r: 0.049, r2: 0.037, mat: MAT.SWEATER, part: 8 + (s > 0 ? 1 : 0), k: 0.02 });
    add({ t: 'ell', c: [0.475, 0.37, 0.018 * s], rad: [0.05, 0.036, 0.04], mat: MAT.SKIN, part: 10, k: 0.02 });
  }
  return P;
})();
export function boundOf(prims) {
  let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  const grow = (c, r) => { for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], c[i] - r); hi[i] = Math.max(hi[i], c[i] + r); } };
  for (const q of prims) {
    if (q.t === 'sph') grow(q.c, q.r);
    else if (q.t === 'ell') grow(q.c, Math.max(...q.rad));
    else { grow(q.a, Math.max(q.r, q.r2 || 0)); grow(q.b, Math.max(q.r, q.r2 || 0)); }
  }
  return { c: v3.mul(v3.add(lo, hi), 0.5), r: v3.len(v3.sub(hi, lo)) * 0.5 + 0.05 };
}
export const HUMAN_BOUND = boundOf(HUMAN_PRIMS);

// ---------------------------------------------------------------- the tree
// A trunk leaning a little toward the figure, forking into three limbs, and eleven canopy
// clumps. treeGrow(g) turns a growth value 0..1 into the primitive lists the shader reads:
// the trunk rises, the limbs reach out, then the clumps bloom from the limb tips.
export const TREE_TRUNK = [ // a, b, r1, r2 (tree-local)
  [[0, -0.3, 0], [0.12, 1.0, 0.0], 0.16, 0.105],
  [[0.12, 1.0, 0.0], [-0.42, 1.85, 0.05], 0.085, 0.05],
  [[0.12, 1.0, 0.0], [0.78, 1.78, -0.05], 0.08, 0.045],
  [[0.12, 1.0, 0.0], [0.2, 2.15, 0.0], 0.08, 0.05],
];
export const TREE_CANOPY = [ // x, y, z, r
  [-0.6, 2.2, 0.1, 0.6], [-1.05, 2.0, 0.0, 0.4], [-0.35, 2.52, 0.0, 0.48],
  [0.2, 2.76, 0.0, 0.6], [-0.15, 2.95, 0.1, 0.44], [0.56, 2.9, -0.05, 0.44],
  [0.98, 2.1, -0.05, 0.54], [1.4, 1.96, 0.0, 0.37], [0.72, 2.36, 0.0, 0.44],
  [0.2, 2.3, 0.45, 0.58], [0.12, 2.08, -0.3, 0.42],
];
const CAN_TIP = TREE_CANOPY.map(([x, y, z]) => {   // which limb tip each clump grows from
  let best = 1, bd = 1e9;
  for (let i = 1; i < 4; i++) { const d = v3.len(v3.sub([x, y, z], TREE_TRUNK[i][1])); if (d < bd) { bd = d; best = i; } }
  return best;
});
const CAN_ORDER = (() => {   // inner clumps first
  const d = TREE_CANOPY.map(([x, y, z]) => Math.hypot(x - 0.1, y - 2.3, z));
  const idx = d.map((_, i) => i).sort((a, b) => d[a] - d[b]);
  const rank = new Array(d.length); idx.forEach((i, r) => { rank[i] = r; });
  return rank;
})();
export const TREE_BOUND = (() => {
  const P = TREE_TRUNK.map(([a, b, r, r2]) => ({ t: 'rc', a, b, r, r2 })).concat(TREE_CANOPY.map(([x, y, z, r]) => ({ t: 'sph', c: [x, y, z], r })));
  const b = boundOf(P); b.r += 0.2; return b;
})();
export function treeGrow(g) {
  const trA = new Float32Array(16), trB = new Float32Array(16), can = new Float32Array(44), canG = new Float32Array(44);
  const gT = ease(g / 0.35);
  const a0 = TREE_TRUNK[0][0], b0 = TREE_TRUNK[0][1];
  const top = v3.lerp(a0, b0, Math.max(gT, 0.02));
  const sT = gT > 0 ? 0.35 + 0.65 * gT : 0;
  trA.set([...a0, TREE_TRUNK[0][2] * sT], 0); trB.set([...top, TREE_TRUNK[0][3] * sT], 0);
  const gL = ease((g - 0.2) / 0.35);
  const tips = [];
  for (let i = 1; i < 4; i++) {
    const [a, b, r1, r2] = TREE_TRUNK[i];
    const dir = v3.sub(b, a);
    const tip = v3.add(top, v3.mul(dir, Math.max(gL, 0.02)));
    tips[i] = tip;
    const s = gL > 0 ? 0.3 + 0.7 * gL : 0;
    trA.set([...top, r1 * s], i * 4); trB.set([...tip, r2 * s], i * 4);
  }
  let canSum = 0;
  TREE_CANOPY.forEach(([x, y, z, r], i) => {
    const st = 0.42 + 0.3 * CAN_ORDER[i] / (TREE_CANOPY.length - 1);
    const gi = clamp((g - st) / 0.3);
    const rr = r * easeOutBack(gi);
    const c = v3.lerp(tips[CAN_TIP[i]], [x, y, z], easeOut(gi * 1.2));
    can.set([...c, gi > 0 ? Math.max(rr, 0.004) : 0], i * 4);
    canG.set([gi, r, 0, 0], i * 4);
    canSum += gi;
  });
  const canAvg = canSum / TREE_CANOPY.length;
  return { trA, trB, can, canG, canK: 0.012 + 0.188 * clamp(canAvg * 1.6), leafAmp: clamp(canAvg * 1.4) };
}

// ---------------------------------------------------------------- clouds
function cloudAt(az, el, dist) {
  const a = az * Math.PI / 180, e = el * Math.PI / 180;
  return [dist * Math.sin(a) * Math.cos(e), 0.7 + dist * Math.sin(e), dist * Math.cos(a) * Math.cos(e)];
}
export const CLOUDS = (() => {
  const C = [];
  const blob = (az, el, dist, parts) => {
    const c0 = cloudAt(az, el, dist);
    for (const [dx, dy, dz, rx, ry, rz] of parts) C.push({ c: [c0[0] + dx, c0[1] + dy, c0[2] + dz], rad: [rx, ry, rz] });
  };
  blob(-12, 23, 150, [[0, 0, 0, 12, 6, 8], [-11, -1.5, 2, 8, 4.5, 6], [10, -2, -1, 9, 4.2, 6], [-3, 4.5, 1, 7.5, 5, 6], [5, 3.5, 0, 6, 4.5, 5], [19, -3.2, 0, 6, 2.6, 4.5]]);
  blob(26, 15.5, 175, [[0, 0, 0, 26, 2.4, 10], [27, -1.0, 4, 18, 2.0, 8], [-24, 1.0, -3, 14, 1.8, 7], [47, -1.8, 8, 13, 1.6, 6]]);
  blob(22, 29, 160, [[0, 0, 0, 7, 3.6, 5], [6, -0.8, 1, 5, 2.8, 4], [-5.5, -1.0, 0, 4.5, 2.6, 4]]);
  return C;
})();
// cloud drift in m/s (clouds are ~150 m out: 0.35 m/s is ~3 px/s on screen)
export const CLOUD_DRIFT = [0.35, 0, 0.05];

// ---------------------------------------------------------------- environment
export const DOME = { c: [0, 0, 10], R: 220 };

// Towers for the skyline: [x, z, w (apothem at the base), h, taper (fraction of w lost at the
// top), cap (height of the pointed top), rot]. Generated once from a fixed seed: slender
// towers far behind the hill, the tallest in the middle, a few carrying needles. The first
// SKYLINE_SEED entries are the small cluster S24 raises; the rest complete the city (S31).
function mulberry32(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export const SKYLINE_SEED = 6;
export const SKYLINE = (() => {
  const rnd = mulberry32(2029), T = [];
  const add = (x, z, h, w, needle) => {
    const taper = 0.08 + 0.22 * rnd(), cap = w * (0.5 + 1.1 * rnd()), rot = rnd() * 0.8;
    T.push([x, z, w, h, taper, cap, rot]);
    if (needle) T.push([x, z, w * 0.16, h + cap * 0.5 + needle, 0.35, needle * 0.45, rot]);
  };
  // the seed cluster (behind the hill's left shoulder and centre)
  add(-18, 104, 26, 2.3, 0); add(-9, 112, 31, 2.6, 0); add(-26, 118, 22, 2.1, 0);
  add(-3, 100, 19, 1.9, 0); add(-13, 126, 29, 2.4, 0); add(4, 117, 24, 2.0, 0);
  // the rest of the city, spreading right and back
  add(12, 132, 44, 3.2, 14); add(22, 118, 28, 2.4, 0); add(-34, 132, 30, 2.6, 0);
  add(31, 140, 36, 2.8, 0); add(-22, 146, 40, 3.0, 10); add(2, 150, 52, 3.4, 16);
  add(40, 126, 22, 2.2, 0); add(-45, 120, 20, 2.0, 0); add(50, 150, 30, 2.6, 0);
  add(-55, 150, 26, 2.4, 0); add(18, 165, 38, 3.0, 0);
  return T.slice(0, 24);
})();
// the shelter's land beyond the hill: a broad low ridge the city stands behind
export const FAR_RIDGE = [1.3, -4, 62, 55, 11];

// Stroke/mote seeding: the polar lattice for the terrain is laid around a fixed origin (the
// shot's camera home) so seeds stay put while the camera moves. See NOTES.md.
export const DEFAULT_SEEDING = { origin: [0, 0], yaw: 0, halfAngle: 0.95, d0: 1.2, d1: 140 };
