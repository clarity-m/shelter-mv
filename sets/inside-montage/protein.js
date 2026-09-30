// S25's protein: an abstract ribbon of luminous paint that folds into a compact knot. Plain JS.
// The chain is a row of secondary-structure elements (SSEs): helices (coiled bands, right-handed)
// and strands (broad flat bands ending in arrowheads), joined by thin loops. A conformation places
// every SSE as a rigid body (centre + rotation) in the knot's frame; a fold eases between
// placements (lerp centres, slerp rotations) and re-threads each loop as a Hermite curve between
// the ends it joins, so helices and arrows keep their shape while the loops flex.
// ribbon(t, opts) returns a ribbon for hillx's `ribbons` option, plus the points the crowd's
// beams can hold (by chain fraction).

// ---------------------------------------------------------------- small vector / quaternion kit
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);

// quaternions [w, x, y, z]
function qFromAxes(yDir, xHint) {           // rotation taking local +y to yDir, local +x toward xHint
  const Y = norm(yDir);
  let X = sub(xHint, mul(Y, dot(xHint, Y)));
  if (len(X) < 1e-6) X = Math.abs(Y[0]) < 0.9 ? sub([1, 0, 0], mul(Y, Y[0])) : sub([0, 0, 1], mul(Y, Y[2]));
  X = norm(X);
  const Z = cross(X, Y);
  // rotation matrix columns X, Y, Z -> quaternion
  const m00 = X[0], m01 = Y[0], m02 = Z[0], m10 = X[1], m11 = Y[1], m12 = Z[1], m20 = X[2], m21 = Y[2], m22 = Z[2];
  const tr = m00 + m11 + m22;
  let q;
  if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; q = [0.25 * s, (m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s]; }
  else if (m00 > m11 && m00 > m22) { const s = Math.sqrt(1 + m00 - m11 - m22) * 2; q = [(m21 - m12) / s, 0.25 * s, (m01 + m10) / s, (m02 + m20) / s]; }
  else if (m11 > m22) { const s = Math.sqrt(1 + m11 - m00 - m22) * 2; q = [(m02 - m20) / s, (m01 + m10) / s, 0.25 * s, (m12 + m21) / s]; }
  else { const s = Math.sqrt(1 + m22 - m00 - m11) * 2; q = [(m10 - m01) / s, (m02 + m20) / s, (m12 + m21) / s, 0.25 * s]; }
  return qNorm(q);
}
const qNorm = (q) => { const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return q.map((v) => v / l); };
const qMul = (a, b) => [
  a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
  a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
const qAxis = (ax, ang) => { const s = Math.sin(ang / 2), n = norm(ax); return [Math.cos(ang / 2), n[0] * s, n[1] * s, n[2] * s]; };
function qRot(q, v) {
  const [w, x, y, z] = q, u = [x, y, z];
  const t = mul(cross(u, v), 2);
  return add(add(v, mul(t, w)), cross(u, t));
}
function qSlerp(a, b, t) {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  if (d < 0) { b = b.map((v) => -v); d = -d; }
  if (d > 0.9995) return qNorm(a.map((v, i) => lerp(v, b[i], t)));
  const th = Math.acos(d), s = Math.sin(th);
  const ka = Math.sin((1 - t) * th) / s, kb = Math.sin(t * th) / s;
  return a.map((v, i) => v * ka + b[i] * kb);
}

// ---------------------------------------------------------------- the chain
// k: H helix, E strand, L loop; n residues
export const CHAIN = [
  { k: 'L', n: 4 },     // N tail
  { k: 'H', n: 17 },    // H1
  { k: 'L', n: 4 },
  { k: 'E', n: 7 },     // E1
  { k: 'L', n: 3 },     // hairpin
  { k: 'E', n: 7 },     // E2
  { k: 'L', n: 5 },
  { k: 'H', n: 17 },    // H2
  { k: 'L', n: 4 },
  { k: 'E', n: 7 },     // E3
  { k: 'L', n: 3 },     // hairpin
  { k: 'E', n: 7 },     // E4
  { k: 'L', n: 4 },     // C tail
];
const NRES = CHAIN.reduce((a, e) => a + e.n, 0);
const SSE = CHAIN.map((e, i) => Object.assign({ i }, e)).filter((e) => e.k !== 'L');
// geometry (metres in the knot's frame)
export const G = { rH: 0.12, riseH: 0.075, hwH: 0.092, riseE: 0.18, hwE: 0.1, hwA: 0.19, hwL: 0.03, loopStep: 0.045 };
const TURN = 100 * Math.PI / 180;

// an SSE's local shape: points along its local +y axis, centred on the origin, with each point's
// side vector (the band's width direction) and half width
function sseLocal(e) {
  const pts = [];
  if (e.k === 'H') {
    const nS = (e.n - 1) * 4;
    for (let j = 0; j <= nS; j++) {
      const r = j / 4, th = r * TURN, y = (r - (e.n - 1) / 2) * G.riseH;
      // right-handed on screen (x right, y up, z away): the near side runs from lower left to upper right
      pts.push({ p: [G.rH * Math.sin(th), y, -G.rH * Math.cos(th)], s: [0, 1, 0], w: G.hwH, r });
    }
  } else {
    const L = (e.n - 1) * G.riseE, y0 = -L / 2, head = 0.24;      // arrowhead length (m)
    const ys = [];
    for (let j = 0; j <= (e.n - 1) * 2; j++) ys.push(y0 + j * G.riseE / 2);
    for (const y of ys) {
      const toEnd = y0 + L - y;
      if (toEnd > head + 1e-6) pts.push({ p: [0, y, 0], s: [1, 0, 0], w: G.hwE, r: (y - y0) / G.riseE });
    }
    // the arrow: a step out to the barbs, then a straight taper to the point
    const yb = y0 + L - head;
    pts.push({ p: [0, yb, 0], s: [1, 0, 0], w: G.hwE, r: (yb - y0) / G.riseE });
    pts.push({ p: [0, yb + 1e-4, 0], s: [1, 0, 0], w: G.hwA, r: (yb - y0) / G.riseE });
    for (let k = 1; k <= 4; k++) { const y = yb + head * k / 4; pts.push({ p: [0, y, 0], s: [1, 0, 0], w: G.hwA * (1 - k / 4) + 0.004, r: (y - y0) / G.riseE }); }
  }
  return pts;
}
const LOCAL = SSE.map(sseLocal);

// ---------------------------------------------------------------- conformations
// place(e) -> { c, q } for each SSE, in chain order (H1 E1 E2 H2 E3 E4)
const Y = [0, 1, 0], X = [1, 0, 0];
const DOWN = [0, -1, 0];
// the folded knot: a four-stranded sheet behind two helices, upright (about 0.9 x 1.5 m). The sheet
// has a propeller twist (each strand turned a little more than the last about the vertical) and the
// helices lean across it, as real ones pack, so it reads as a made thing rather than a diagram.
const tw = (a) => qAxis(Y, a), lean = (a) => qAxis([0, 0, 1], a);
const FOLD = [
  { c: [-0.17, 0.02, -0.25], q: qMul(lean(0.16), qFromAxes(DOWN, X)) },           // H1, front left, running down
  { c: [-0.36, 0.0, 0.14], q: qMul(tw(-0.3), qFromAxes(Y, X)) },                 // E1 up
  { c: [-0.12, 0.02, 0.16], q: qMul(tw(-0.1), qFromAxes(DOWN, X)) },             // E2 down
  { c: [0.19, -0.02, -0.23], q: qMul(lean(-0.2), qFromAxes(Y, X)) },             // H2, front right, running up
  { c: [0.12, -0.02, 0.16], q: qMul(tw(0.1), qFromAxes(DOWN, X)) },              // E3 down
  { c: [0.36, 0.0, 0.14], q: qMul(tw(0.3), qFromAxes(Y, X)) },                   // E4 up
];
// extended: laid out along a long gentle arc, each element along the chain's direction, broad
// faces to the camera (the arc runs left to right, N to C)
function extended(span, sag, depth) {
  // chain-order arc positions of the SSE centres by nominal lengths
  const lens = CHAIN.map((e) => (e.k === 'H' ? (e.n - 1) * G.riseH : e.k === 'E' ? (e.n - 1) * G.riseE : e.n * 0.3));
  const total = lens.reduce((a, b) => a + b, 0);
  const out = []; let a = 0;
  CHAIN.forEach((e, i) => {
    const mid = a + lens[i] / 2; a += lens[i];
    if (e.k === 'L') return;
    const t = mid / total - 0.5;                                  // -0.5 .. 0.5
    const x = t * span, y = sag * (1 - 4 * t * t) + 0.18 * Math.sin(t * 9.0), z = -depth * 2 * t + 0.3 * Math.sin(t * 6.0);
    const dx = span, dy = sag * (-8 * t) + 0.18 * 9.0 * Math.cos(t * 9.0), dz = -depth * 2 + 1.8 * Math.cos(t * 6.0);
    const dir = norm([dx, dy, dz]);
    // helices keep their band's broad side up the arc; strands lie flat to the camera
    out.push({ c: [x, y, z], q: qFromAxes(dir, e.k === 'E' ? [0, 1, 0] : [0, 0, -1]) });
  });
  return out;
}
export const EXT = extended(8.0, 1.0, 1.1);
// (revision 6: exported, so a shot can lay out shorter extended chains: extended(span, sag, depth))
export { extended };
// in between: the fold's own arrangement opened out into a pleated row (x and depth spread, the
// elements already upright, each leaning a little), which then closes up
function opened(sx, sz, leanK, seed) {
  return FOLD.map((p, i) => {
    const h = (k) => { const x = Math.sin((i + 1) * 12.9898 + k * 78.233 + seed * 37.719) * 43758.5453; return x - Math.floor(x); };
    return { c: [p.c[0] * sx, p.c[1] + 0.12 * (h(2) - 0.5) * sx, p.c[2] * sz], q: qMul(lean(leanK * (h(1) - 0.5)), p.q) };
  });
}
export const LOOSE = opened(3.3, 2.2, 0.9, 1), NEAR = opened(1.6, 1.4, 0.35, 2);
export { FOLD };

// blend two conformations
export function blendConf(A, B, t) {
  return A.map((a, i) => ({ c: lerp3(a.c, B[i].c, t), q: qSlerp(a.q, B[i].q, t) }));
}

// ---------------------------------------------------------------- threading the chain
function hermite(p0, m0, p1, m1, t) {
  const t2 = t * t, t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
  return add(add(mul(p0, h00), mul(m0, h10)), add(mul(p1, h01), mul(m1, h11)));
}
// The whole chain for a conformation `conf` (knot frame), mapped to the world by `toWorld`
// (a function of a knot-frame point) and `dirWorld` (of a direction). Returns per-point arrays and
// the residue index of every point (for the colour and for the beams).
export function chainPoints(conf, toWorld, dirWorld) {
  const P = [], S = [], W = [], BB = [], R = [];
  // SSE world points
  const placed = SSE.map((e, k) => {
    const { c, q } = conf[k];
    return LOCAL[k].map((pt) => ({ p: add(c, qRot(q, pt.p)), s: qRot(q, pt.s), w: pt.w, r: pt.r }));
  });
  const resStart = []; { let r = 0; CHAIN.forEach((e) => { resStart.push(r); r += e.n; }); }
  const tanAt = (arr, end) => { const n = arr.length; return end ? norm(sub(arr[n - 1].p, arr[n - 2].p)) : norm(sub(arr[1].p, arr[0].p)); };
  let k = 0;
  CHAIN.forEach((e, ci) => {
    if (e.k !== 'L') {
      for (const pt of placed[k]) { P.push(pt.p); S.push(pt.s); W.push(pt.w); BB.push(0); R.push(resStart[ci] + pt.r); }
      k++;
      return;
    }
    // a loop: from the previous SSE's end to the next SSE's start (tails hang free)
    const prev = k > 0 ? placed[k - 1] : null, next = k < placed.length ? placed[k] : null;
    let p0, m0, p1, m1;
    const tail = e.n * 0.12;
    if (prev && next) {
      p0 = prev[prev.length - 1].p; p1 = next[0].p;
      const ch = Math.max(len(sub(p1, p0)), 0.15) * 1.1 + e.n * 0.02;
      m0 = mul(tanAt(prev, true), ch); m1 = mul(tanAt(next, false), ch);
    } else if (next) {
      // a free end that hooks in from the side
      const t1 = tanAt(next, false), sd = norm(cross(t1, [0, 0, -1]));
      p1 = next[0].p; p0 = add(p1, add(mul(t1, -0.35 * tail), mul(sd, 0.55 * tail))); m0 = mul(sd, -1.5 * tail); m1 = mul(t1, tail);
    } else {
      const t0 = tanAt(prev, true), sd = norm(cross(t0, [0, 0, -1]));
      p0 = prev[prev.length - 1].p; p1 = add(p0, add(mul(t0, 0.35 * tail), mul(sd, -0.55 * tail))); m0 = mul(t0, tail); m1 = mul(sd, -1.5 * tail);
    }
    // sample by length, keeping the sample count fixed per loop (so nothing pops as it stretches)
    const nS = Math.max(6, e.n * 5);
    const s0 = prev ? prev[prev.length - 1].s : null, s1 = next ? next[0].s : null;
    for (let j = 1; j < nS; j++) {
      const t = j / nS, p = hermite(p0, m0, p1, m1, t);
      // the band narrows into the loop and turns to face the camera, then back out
      const eIn = clamp(t / 0.28), eOut = clamp((1 - t) / 0.28);
      const eb = Math.min(prev ? eIn : 1, next ? eOut : 1);
      const wIn = prev ? prev[prev.length - 1].w : G.hwL, wOut = next ? next[0].w : G.hwL;
      const w = lerp(t < 0.5 ? wIn : wOut, G.hwL, eb);
      P.push(p); S.push(t < 0.5 ? (s0 || s1) : (s1 || s0)); W.push(w); BB.push(eb); R.push(resStart[ci] + t * e.n);
    }
  });
  return { P: P.map(toWorld), S: S.map(dirWorld), W, BB, R };
}
export { NRES };

// the paint's colour along the chain: a warm spectrum from Clawd's orange to pale gold (linear)
const STOPS = [[0, [0.86, 0.30, 0.19]], [0.3, [0.94, 0.47, 0.21]], [0.6, [0.98, 0.64, 0.26]], [0.85, [0.99, 0.78, 0.36]], [1, [1.0, 0.86, 0.5]]];
const toLin = (c) => c.map((v) => Math.pow(v, 2.2));
export function chainColour(f) {
  f = clamp(f);
  for (let i = 0; i + 1 < STOPS.length; i++) {
    const [a, ca] = STOPS[i], [b, cb] = STOPS[i + 1];
    if (f <= b) return toLin(lerp3(ca, cb, (f - a) / (b - a)));
  }
  return toLin(STOPS[STOPS.length - 1][1]);
}
