// The valley's geometry, built once per shot in plain JS (no GL).
// Ported from style-frames/02b-environment-poly/frame-v2.html and reorganised for animation:
// - one ring mesh centred on Clawd's spawn (fine near him, coarse at the horizon), so the
//   camera can orbit and the S13 facet waves ride the rings outward;
// - every level-0 facet is pre-split 1-to-4 up to its max level, and every vertex stores its
//   height at each displayed level (y0, y1, y2). The vertex shader picks a continuous level
//   from the per-frame learned field, so facets subdivide in place with no cracks (geomorph).
// Units are metres. x right, y up, z downstream (away from the spawn, toward the sun).

export const S0 = 2.6;            // level-0 facet spacing in the core (m)
export const WATER = -0.55;       // water plane
export const CLAWD_S = 0.075;     // one glyph pixel-width in metres (the glyph is 1.35 m wide)

// ---------------------------------------------------------------- hashes and noise
// hashu / h2 match the GLSL versions bit for bit, so JS and shaders agree on noise.
export function hashu(x) { x ^= x >>> 16; x = Math.imul(x, 0x7feb352d); x ^= x >>> 15; x = Math.imul(x, 0x846ca68b); x ^= x >>> 16; return x >>> 0; }
export function h2(i, j) { return (hashu(Math.imul(i, 0x8da6b343) ^ hashu((Math.imul(j, 0xd8163841) + 0x9e3779b9) | 0)) >>> 8) / 16777216; }
export function h3(i, j, k) { return (hashu(Math.imul(i, 0x8da6b343) ^ hashu(Math.imul(j, 0xd8163841) ^ hashu((Math.imul(k, 0xcb1ab31f) + 0x9e3779b9) | 0))) >>> 8) / 16777216; }
export const hq = (x, z, k) => h3(Math.round(x * 512), Math.round(z * 512), k);
export function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function gnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10), uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const g = (i, j, dx, dy) => { const a = h2(i, j) * 6.2831853; return Math.cos(a) * dx + Math.sin(a) * dy; };
  const a = g(ix, iy, fx, fy), b = g(ix + 1, iy, fx - 1, fy), c = g(ix, iy + 1, fx, fy - 1), d = g(ix + 1, iy + 1, fx - 1, fy - 1);
  const ab = a + (b - a) * ux, cd = c + (d - c) * ux;
  return ab + (cd - ab) * uy;
}
export function fbmG(x, y, oct) { let s = 0, a = 0.5; for (let i = 0; i < oct; i++) { s += a * gnoise(x, y); const nx = (0.8 * x - 0.6 * y) * 2.03 + 17.3, ny = (0.6 * x + 0.8 * y) * 2.03 + 9.1; x = nx; y = ny; a *= 0.5; } return s; }
function ridged(x, y, oct) { let s = 0, a = 0.55, w = 1; for (let i = 0; i < oct; i++) { let n = 1 - Math.abs(gnoise(x, y) * 1.5); n *= n; s += a * n * w; w = Math.min(1, Math.max(0, n * 1.6)); const nx = (0.8 * x - 0.6 * y) * 2.02 + 11.7, ny = (0.6 * x + 0.8 * y) * 2.02 + 5.3; x = nx; y = ny; a *= 0.5; } return s; }
// value noise, identical to GLSL vnoise()
export function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = h2(ix, iy), b = h2(ix + 1, iy), c = h2(ix, iy + 1), d = h2(ix + 1, iy + 1);
  const ab = a + (b - a) * ux, cd = c + (d - c) * ux;
  return ab + (cd - ab) * uy;
}
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const gauss2 = (x, z, cx, cz, sx, sz) => { const u = (x - cx) / sx, v = (z - cz) / sz; return Math.exp(-(u * u + v * v)); };

// ---------------------------------------------------------------- the valley
// River centre line x(z): it passes 10 m to the right of the spawn and winds downstream to a
// lake under the low sun.
const RIVER = [[46, -330], [38, -220], [29, -130], [21, -60], [17, -20], [16, 8], [17.5, 34], [21, 58], [19.5, 84], [14, 112], [13, 142], [19, 175], [29, 208], [39, 240], [49, 275], [57, 320], [63, 380]];
export function riverX(z) {
  const N = RIVER.length;
  if (z <= RIVER[0][1]) return RIVER[0][0] + (z - RIVER[0][1]) * 0.1;
  if (z >= RIVER[N - 1][1]) return RIVER[N - 1][0] + (z - RIVER[N - 1][1]) * 0.1;
  let i = 0; while (RIVER[i + 1][1] < z) i++;
  const t = (z - RIVER[i][1]) / (RIVER[i + 1][1] - RIVER[i][1]);
  const p0 = RIVER[Math.max(0, i - 1)][0], p1 = RIVER[i][0], p2 = RIVER[i + 1][0], p3 = RIVER[Math.min(N - 1, i + 2)][0];
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
}
export function riverDist(x, z) { const s = riverX(z + 0.5) - riverX(z - 0.5); return (x - riverX(z)) / Math.sqrt(1 + s * s); }
export const LAKE = { c: [66, 300], r: [46, 40] };

// Clawd's run (S14): down the left bank, in world xz, with arc length. Kept gentle in Tbase.
export const PATH = [[0, 0], [-0.6, 6], [-1.4, 13], [-0.8, 20], [0.8, 27], [1.6, 34], [0.6, 41], [-1.2, 48], [-2.4, 55], [-2.0, 62], [-0.4, 69], [1.2, 76], [1.6, 83], [0.4, 90], [-1.4, 97], [-2.2, 104]];
export const PATH_S = (() => { const s = [0]; for (let i = 1; i < PATH.length; i++) s.push(s[i - 1] + Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1])); return s; })();
export function pathAt(s) {   // position and heading at arc length s
  const N = PATH.length;
  s = Math.max(0, Math.min(PATH_S[N - 1], s));
  let i = 0; while (i < N - 2 && PATH_S[i + 1] < s) i++;
  const t = (s - PATH_S[i]) / (PATH_S[i + 1] - PATH_S[i]);
  // Catmull-Rom for a smooth line
  const P = (k) => PATH[Math.max(0, Math.min(N - 1, k))];
  const cr = (a, b, c, d, u) => 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  const x = cr(P(i - 1)[0], P(i)[0], P(i + 1)[0], P(i + 2)[0], t), z = cr(P(i - 1)[1], P(i)[1], P(i + 1)[1], P(i + 2)[1], t);
  const t2 = Math.min(1, t + 0.02), x2 = cr(P(i - 1)[0], P(i)[0], P(i + 1)[0], P(i + 2)[0], t2), z2 = cr(P(i - 1)[1], P(i)[1], P(i + 1)[1], P(i + 2)[1], t2);
  const t1 = Math.max(0, t - 0.02), x1 = cr(P(i - 1)[0], P(i)[0], P(i + 1)[0], P(i + 2)[0], t1), z1 = cr(P(i - 1)[1], P(i)[1], P(i + 1)[1], P(i + 2)[1], t1);
  return { x, z, heading: Math.atan2(x2 - x1, z2 - z1) };
}
function pathDist(x, z) {
  let best = 1e9;
  for (let i = 0; i < PATH.length - 1; i++) {
    const ax = PATH[i][0], az = PATH[i][1], bx = PATH[i + 1][0], bz = PATH[i + 1][1];
    const abx = bx - ax, abz = bz - az, L2 = abx * abx + abz * abz;
    const t = clamp01(((x - ax) * abx + (z - az) * abz) / L2);
    best = Math.min(best, Math.hypot(x - ax - abx * t, z - az - abz * t));
  }
  return best;
}

// Another world's land for this page (S34's fields, sets/fields): replaces the valley's everywhere
// the set samples height (mesh, normals, height index, water, props). Unset: the valley.
let LAND = null;
export function setLand(fn) { LAND = fn; }
export function Tbase(x, z) {
  if (LAND) return LAND(x, z);
  const r = Math.hypot(x, z);
  const dx = riverDist(x, z);
  const zz = Math.max(z, 0);
  const wv = 20 + zz * 0.05, fl = Math.max(0, Math.abs(dx) - 20);
  const valley = 1 - Math.exp(-fl * fl / (wv * wv));
  let h = -0.25 + 9.0 * valley;
  h += 2.2 * fbmG(x * 0.035 + 3.1, z * 0.035 + 7.7, 5);
  h += 6.5 * gauss2(x, z, -30, -14, 12, 11);      // a hill behind-left of the spawn
  h += 4.5 * gauss2(x, z, 36, -30, 16, 14);       // across the river, upstream
  h += 5.0 * gauss2(x, z, -34, 60, 16, 22);       // the left valley wall, downstream
  h += 6.0 * gauss2(x, z, 40, 96, 20, 18);        // right wall
  h += 3.2 * gauss2(x, z, -16, 126, 12, 12);
  // the run corridor stays gentle (no cliffs under his feet)
  { const pd = pathDist(x, z); const k = sstep(7, 2.5, pd) * sstep(-4, 4, z) * (1 - sstep(100, 112, z)); h = mix(h, 0.35 + 0.28 * Math.sin(z * 0.11) + 0.9 * sstep(0, 60, z) * (0.5 + 0.5 * Math.sin(z * 0.045 + 1)), k * 0.8); }
  // the spawn knoll: flat at 0 within 3.2 m
  h = mix(h, 0.0, sstep(15, 4.0, r));
  // river channel
  { const rw = 1.4 + zz * 0.011; h = mix(h, -2.0, sstep(rw + 2.4, rw, Math.abs(dx))); }
  // lake far downstream
  if (z > 200) { const u = (x - LAKE.c[0]) / LAKE.r[0], v = (z - LAKE.c[1]) / LAKE.r[1]; h = mix(h, -2.8, sstep(1.0, 0.72, Math.sqrt(u * u + v * v))); }
  // the mountain ring, lowest in a notch toward the sun (downstream)
  if (r > 260) {
    const az = Math.atan2(x, z);
    const rg = ridged(x * 0.0042 + 1.3, z * 0.0042 + 4.1, 5);
    const notch = 1 - 0.78 * Math.exp(-Math.pow((az - 0.17) / 0.2, 2));
    const band = sstep(300, 520, r) * (1 - sstep(1500, 2300, r));
    const amp = 52 + 30 * Math.sin(az * 2.0 + 0.6) + 18 * Math.sin(az * 5.0 + 2.1);
    h += amp * rg * band * notch;
    // a snow massif upstream (behind the spawn), and a far range on the right
    h += 150 * gauss2(x, z, -260, -1200, 420, 260) * (0.62 + 0.5 * ridged(x * 0.004 + 7.1, z * 0.004 + 2.2, 5));
    h += 110 * gauss2(x, z, 1100, 300, 300, 420) * (0.6 + 0.5 * ridged(x * 0.004 + 3.3, z * 0.004 + 9.2, 5));
    h += 90 * gauss2(x, z, -1150, 420, 300, 380) * (0.6 + 0.5 * ridged(x * 0.004 + 5.3, z * 0.004 + 1.2, 5));
  }
  return h;
}
export function Tnormal(x, z) {
  const e = 0.35;
  const hx = (Tbase(x + e, z) - Tbase(x - e, z)) / (2 * e), hz = (Tbase(x, z + e) - Tbase(x, z - e)) / (2 * e);
  const l = Math.hypot(hx, 1, hz); return [-hx / l, 1 / l, -hz / l];
}

// ---------------------------------------------------------------- learned-state albedo
// The colour a facet takes once learned (painted). Untouched facets are grey in the shader.
function learnedAlbedo(cx, cy, cz, ny, far, r1, r2, r3) {
  let col;
  if (far) {
    const fm = sstep(0.48, 0.62, 0.5 + fbmG(cx * 0.02, cz * 0.02, 3)) * (1 - sstep(18, 50, cy));
    col = mix3([0.47, 0.63, 0.36], [0.24, 0.38, 0.28], fm);
    col = mix3(col, [0.56, 0.52, 0.50], sstep(0.82, 0.62, ny));
    const sl = 58 + 16 * fbmG(cx * 0.01, cz * 0.01, 3);
    col = mix3(col, [0.96, 0.95, 0.97], sstep(sl, sl + 6, cy) * sstep(0.45, 0.7, ny));
    if (cy < -1.5) col = [0.80, 0.74, 0.60];
    return col;
  }
  const gA = [0.42, 0.62, 0.36], gB = [0.54, 0.68, 0.37], gC = [0.30, 0.50, 0.40];
  const gr = mix3(mix3(gA, gB, r1), gC, r2 * 0.6);
  col = gr;
  if (cy < 0.2) col = mix3([0.88, 0.80, 0.62], gr, sstep(-0.5, 0.2, cy));             // sandy banks
  if (cy < WATER + 0.15) col = [0.62, 0.57, 0.46];                                     // river bed
  col = mix3(col, [0.62, 0.52, 0.42], sstep(0.66, 0.46, ny) * 0.75 * (1 - sstep(0.8, 2.2, cy)));   // earth banks
  col = mix3(col, mix3(col, [0.26, 0.42, 0.30], 0.5), sstep(0.7, 0.45, ny) * sstep(1.2, 2.2, cy));  // steep grass
  if (cy > 0.25 && ny > 0.93 && r3 < 0.035 && Math.hypot(cx, cz) > 4.5) col = r1 < 0.45 ? [0.98, 0.72, 0.80] : (r1 < 0.8 ? [1.0, 0.97, 0.90] : [0.99, 0.86, 0.45]);   // flowers
  return col;
}

// ---------------------------------------------------------------- the ring mesh
// Per vertex (non-indexed, 3 per facet), 44 bytes:
//   A: f32 x4  x, z, y0, y1
//   B: f32 x4  y2, facet centroid x, z, r0 (level-0 facet random)
//   C: u8  x4  bary to the level-0 facet (3), r2 (fine facet random)
//   D: u8  x4  learned albedo (sRGB, 3), th (flip threshold)
//   E: i8  x4  smooth normal (3), far flag
export function buildTerrain(opts = {}) {
  const t0 = performance.now();
  const rings = [];
  let r = 1.6, k = 0;
  while (r < 3800) {
    const s = r < 72 ? S0 : S0 * Math.pow(r / 72, 1.28);
    const n = Math.max(6, Math.round(2 * Math.PI * r / s));
    const phi = h2(k, 77) * 6.2831853;
    const ring = [];
    for (let i = 0; i < n; i++) {
      const ja = (h3(i, k, 1) - 0.5) * 0.62, jr = k > 0 ? (h3(i, k, 2) - 0.5) * 0.6 * s : 0;
      const a = phi + (i + ja) * 2 * Math.PI / n, rr = r + jr;
      ring.push({ a, x: Math.sin(a) * rr, z: Math.cos(a) * rr });
    }
    rings.push({ r, s, pts: ring });
    r += s; k++;
  }
  let vid = 0;
  const mkV = (x, z) => { const h = Tbase(x, z); return { x, z, y: [h, h, h], id: vid++ }; };
  const centre = mkV(0, 0);
  for (const R of rings) for (const p of R.pts) Object.assign(p, mkV(p.x, p.z));
  const tris = [];
  { const A = rings[0].pts; for (let i = 0; i < A.length; i++) tris.push([centre, A[i], A[(i + 1) % A.length]]); }
  for (let q = 0; q < rings.length - 1; q++) {
    const A = rings[q].pts, B = rings[q + 1].pts, NA = A.length, NB = B.length;
    const al = (i) => A[i % NA].a + 2 * Math.PI * Math.floor(i / NA);
    // B's start: the largest angle not above A[0]
    const a0 = A[0].a;
    let j0 = 0, bestA = -1e9;
    for (let j = 0; j < NB; j++) { let b = B[j].a; while (b > a0) b -= 2 * Math.PI; if (b > bestA) { bestA = b; j0 = j; } }
    const base = bestA - B[j0].a;
    const bl = (m) => { const j = j0 + m; return B[j % NB].a + base + 2 * Math.PI * Math.floor(j / NB); };
    let i = 0, m = 0;
    while (i < NA || m < NB) {
      const advA = m >= NB ? true : (i >= NA ? false : al(i + 1) < bl(m + 1));
      if (advA) { tris.push([A[i % NA], A[(i + 1) % NA], B[(j0 + m) % NB]]); i++; }
      else { tris.push([A[i % NA], B[(j0 + m + 1) % NB], B[(j0 + m) % NB]]); m++; }
    }
  }
  // levels: fine near the action, coarse at the horizon
  const Lmax = opts.lmax || ((cr) => (cr < 92 ? 2 : cr < 230 ? 1 : 0));
  const L = new Int8Array(tris.length);
  tris.forEach((t, ti) => { const cx = (t[0].x + t[1].x + t[2].x) / 3, cz = (t[0].z + t[1].z + t[2].z) / 3; L[ti] = Lmax(Math.hypot(cx, cz)); });
  const ek = (a, b) => (a.id < b.id ? a.id * 4194304 + b.id : b.id * 4194304 + a.id);
  const cap = new Map();
  tris.forEach((t, ti) => { for (let e = 0; e < 3; e++) { const key = ek(t[e], t[(e + 1) % 3]); const prev = cap.get(key); cap.set(key, prev === undefined ? L[ti] : Math.min(prev, L[ti])); } });
  // count facets
  let nf = 0; for (let ti = 0; ti < tris.length; ti++) nf += 1 << (2 * L[ti]);
  const NV = nf * 3;
  const A = new Float32Array(NV * 4), B = new Float32Array(NV * 4), C = new Uint8Array(NV * 4), D = new Uint8Array(NV * 4), E = new Int8Array(NV * 4);
  let fi = 0;
  const midV = (p, q, e, cp) => {
    let s = p, t = q; if (p.x > q.x || (p.x === q.x && p.z > q.z)) { s = q; t = p; }
    const j = 0.5 + (hq(s.x + t.x, s.z + t.z, 3) - 0.5) * 0.26;
    const x = s.x + (t.x - s.x) * j, z = s.z + (t.z - s.z) * j;
    const y = [s.y[0] + (t.y[0] - s.y[0]) * j, s.y[1] + (t.y[1] - s.y[1]) * j, s.y[2] + (t.y[2] - s.y[2]) * j];
    if (e <= cp) { const h = Tbase(x, z); for (let l = e; l < 3; l++) y[l] = h; }
    return { x, z, y };
  };
  let anc = null, r0 = 0, ancFar = false;
  const bary = (p) => {
    const [a, b, c] = anc;
    const den = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z);
    const w0 = ((b.z - c.z) * (p.x - c.x) + (c.x - b.x) * (p.z - c.z)) / den, w1 = ((c.z - a.z) * (p.x - c.x) + (a.x - c.x) * (p.z - c.z)) / den;
    return [clamp01(w0), clamp01(w1), clamp01(1 - w0 - w1)];
  };
  const emit = (a, b, c) => {
    const cx = (a.x + b.x + c.x) / 3, cz = (a.z + b.z + c.z) / 3, cy = (a.y[2] + b.y[2] + c.y[2]) / 3;
    // true facet normal at the finest level, for colour decisions
    const ux = b.x - a.x, uy = b.y[2] - a.y[2], uz = b.z - a.z, vx = c.x - a.x, vy = c.y[2] - a.y[2], vz = c.z - a.z;
    const nx = uy * vz - uz * vy, ny0 = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const ny = Math.abs(ny0) / (Math.hypot(nx, ny0, nz) || 1);
    const r1 = hq(cx, cz, 11), r2 = hq(cx, cz, 12), r3 = hq(cx, cz, 13), th = hq(cx, cz, 14), rnd = hq(cx, cz, 15);
    const far = ancFar;
    const alb = learnedAlbedo(cx, cy, cz, ny, far, r1, r2, r3);
    const verts = [a, b, c];
    for (let k2 = 0; k2 < 3; k2++) {
      const v = verts[k2], o = (fi * 3 + k2) * 4;
      A[o] = v.x; A[o + 1] = v.z; A[o + 2] = v.y[0]; A[o + 3] = v.y[1];
      B[o] = v.y[2]; B[o + 1] = cx; B[o + 2] = cz; B[o + 3] = r0;
      const w = bary(v);
      C[o] = Math.round(w[0] * 255); C[o + 1] = Math.round(w[1] * 255); C[o + 2] = Math.round(w[2] * 255); C[o + 3] = Math.round(rnd * 255);
      const g = (x) => Math.round(clamp01(x) * 255);   // albedos are sRGB already
      D[o] = g(alb[0]); D[o + 1] = g(alb[1]); D[o + 2] = g(alb[2]); D[o + 3] = Math.round(th * 255);
      const n = Tnormal(v.x, v.z);
      E[o] = Math.round(n[0] * 127); E[o + 1] = Math.round(n[1] * 127); E[o + 2] = Math.round(n[2] * 127); E[o + 3] = far ? 127 : 0;
    }
    fi++;
  };
  const sub = (a, b, c, d, Lv, cab, cbc, cca) => {
    if (d === Lv) { emit(a, b, c); return; }
    const e = d + 1;
    const mab = midV(a, b, e, cab), mbc = midV(b, c, e, cbc), mca = midV(c, a, e, cca);
    sub(a, mab, mca, e, Lv, cab, Lv, cca);
    sub(mab, b, mbc, e, Lv, cab, cbc, Lv);
    sub(mca, mbc, c, e, Lv, Lv, cbc, cca);
    sub(mab, mbc, mca, e, Lv, Lv, Lv, Lv);
  };
  tris.forEach((t, ti) => {
    anc = t; const cx = (t[0].x + t[1].x + t[2].x) / 3, cz = (t[0].z + t[1].z + t[2].z) / 3;
    r0 = hq(cx, cz, 21); ancFar = Math.hypot(cx, cz) > 300;
    sub(t[0], t[1], t[2], 0, L[ti], cap.get(ek(t[0], t[1])), cap.get(ek(t[1], t[2])), cap.get(ek(t[2], t[0])));
  });
  const stats = { l0: tris.length, facets: fi, rings: rings.length, ms: Math.round(performance.now() - t0) };
  return { A, B, C, D, E, n: NV, stats };
}

// Heights of the displayed surface at every level, at any point in the core (bary-interpolated
// over the containing finest facet). Used to seat props, Clawd and the tile skirt.
export function heightIndex(T, x0, x1, z0, z1, cs) {
  const nx = Math.ceil((x1 - x0) / cs), nz = Math.ceil((z1 - z0) / cs);
  const cells = new Array(nx * nz); for (let i = 0; i < cells.length; i++) cells[i] = [];
  const A = T.A, B = T.B, nfac = T.n / 3;
  for (let f = 0; f < nfac; f++) {
    const o = f * 12;
    const xs = [A[o], A[o + 4], A[o + 8]], zs = [A[o + 1], A[o + 5], A[o + 9]];
    const mnx = Math.min(...xs), mxx = Math.max(...xs), mnz = Math.min(...zs), mxz = Math.max(...zs);
    if (mxx < x0 || mnx > x1 || mxz < z0 || mnz > z1) continue;
    const i0 = Math.max(0, Math.floor((mnx - x0) / cs)), i1 = Math.min(nx - 1, Math.floor((mxx - x0) / cs));
    const j0 = Math.max(0, Math.floor((mnz - z0) / cs)), j1 = Math.min(nz - 1, Math.floor((mxz - z0) / cs));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) cells[j * nx + i].push(f);
  }
  return (x, z) => {
    const i = Math.floor((x - x0) / cs), j = Math.floor((z - z0) / cs);
    if (i >= 0 && j >= 0 && i < nx && j < nz) {
      for (const f of cells[j * nx + i]) {
        const o = f * 12;
        const ax = A[o], az = A[o + 1], bx = A[o + 4], bz = A[o + 5], cx = A[o + 8], cz = A[o + 9];
        const den = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
        if (Math.abs(den) < 1e-12) continue;
        const w0 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / den, w1 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / den, w2 = 1 - w0 - w1;
        if (w0 >= -1e-6 && w1 >= -1e-6 && w2 >= -1e-6) {
          const y = (l) => { const pa = l < 2 ? A[o + 2 + l] : B[o], pb = l < 2 ? A[o + 6 + l] : B[o + 4], pc = l < 2 ? A[o + 10 + l] : B[o + 8]; return w0 * pa + w1 * pb + w2 * pc; };
          return [y(0), y(1), y(2)];
        }
      }
    }
    const h = Tbase(x, z); return [h, h, h];
  };
}

// ---------------------------------------------------------------- water: flat, faceted shading normals
// Per vertex: f32 x4 (x, y, z, depth) | i8 x4 facet normal | u8 x4 (body colour rgb, rnd) | f32 x4 (cx, cz, 0, 0)
export function buildWater(opts = {}) {
  const P = [], N = [], C = [], F = [];
  const rows = [];
  let z = -340, k = 0;
  while (z < 420) {
    const dz = 1.0 + Math.max(0, Math.abs(z) - 60) * 0.03;
    const xc = riverX(z), half = z > 200 ? 70 : 9 + Math.max(0, z) * 0.02;
    const x0 = xc - half, x1 = xc + half + (z > 200 ? 30 : 0);
    const dx = dz * 0.9;
    const n = Math.max(2, Math.ceil((x1 - x0) / dx));
    const row = [];
    for (let i = 0; i <= n; i++) {
      const jx = (i > 0 && i < n) ? (h3(i, k, 21) - 0.5) * 0.7 * dx : 0;
      const jz = k > 0 ? (h3(i, k, 22) - 0.5) * 0.5 * dz : 0;
      const x = x0 + i * (x1 - x0) / n + jx, zz = z + jz;
      row.push([x, zz, Tbase(x, zz)]);
    }
    rows.push(row); z += dz; k++;
  }
  const emit = (a, b, c) => {
    if (Math.min(a[2], b[2], c[2]) > WATER + 0.3) return;
    const cx = (a[0] + b[0] + c[0]) / 3, cz = (a[1] + b[1] + c[1]) / 3;
    const depth = Math.max(0, WATER - Tbase(cx, cz));
    const rnd = hq(cx, cz, 32);
    const wv = Math.sin(cz * 0.9 + 1.7 * Math.sin(cx * 0.35)) * 0.035;
    const tx = (hq(cx, cz, 33) - 0.5) * 0.13 + wv * 0.4, tz = (hq(cx, cz, 34) - 0.5) * 0.10 + wv;
    const l = Math.hypot(tx, 1, tz);
    const body = mix3([0.50, 0.62, 0.56], [0.13, 0.26, 0.36], sstep(0.15, 2.0, depth));
    for (const v of [a, b, c]) {
      P.push(v[0], WATER, v[1], clamp01(depth / 3));
      N.push(Math.round(tx / l * 127), Math.round(1 / l * 127), Math.round(tz / l * 127), 0);
      C.push(Math.round(body[0] * 255), Math.round(body[1] * 255), Math.round(body[2] * 255), Math.round(rnd * 255));
      F.push(cx, cz, 0, 0);
    }
  };
  // pools: still water over disks { x, z, r } (S18's crater lake), shown wherever the ground dips
  // below the water line (the basin is carved in the shader, so no height filter here)
  for (const pl of opts.pools || []) {
    const st = 1.0, n = Math.ceil(pl.r / st);
    for (let j = -n; j < n; j++) for (let i = -n; i < n; i++) {
      const x0 = pl.x + i * st, z0 = pl.z + j * st, x1 = x0 + st, z1 = z0 + st;
      if (Math.hypot(x0 + st / 2 - pl.x, z0 + st / 2 - pl.z) > pl.r) continue;
      const body = [0.16, 0.30, 0.40], rnd = hq(x0, z0, 32);
      for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z0], [x1, z1], [x0, z1]]) {
        P.push(x, WATER, z, 0.7); N.push(0, 127, 0, 0);
        C.push(Math.round(body[0] * 255), Math.round(body[1] * 255), Math.round(body[2] * 255), Math.round(rnd * 255));
        F.push(x0 + st / 2, z0 + st / 2, 0, 0);
      }
    }
  }
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  for (let q = 0; q < rows.length - 1; q++) {
    const A = rows[q], B = rows[q + 1];
    let i = 0, j = 0;
    while (i < A.length - 1 || j < B.length - 1) {
      let advA;
      if (i >= A.length - 1) advA = false; else if (j >= B.length - 1) advA = true; else advA = d2(A[i + 1], B[j]) < d2(A[i], B[j + 1]);
      if (advA) { emit(A[i], A[i + 1], B[j]); i++; } else { emit(A[i], B[j + 1], B[j]); j++; }
    }
  }
  return { P: new Float32Array(P), N: new Int8Array(N), C: new Uint8Array(C), F: new Float32Array(F), n: P.length / 4 };
}

// ---------------------------------------------------------------- props (trees, rocks, agents, pad) and clouds
// Per vertex: f32 x4 local offset (x, y, z, kind) | f32 x4 anchor (x, z, y0, y1) | f32 x4 (y2, grey, emission, rnd)
//             | i8 x4 normal | u8 x4 learned albedo (sRGB) + paint amount
// kind: 0 prop on the ground, 1 cloud (absolute position), 2 spawn pad (always learned), 3 agent (hidden in S18)
const ICOS = (() => {
  const t = (1 + Math.sqrt(5)) / 2;
  const nrm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(nrm);
  let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const out = [{ V, F }];
  for (let s = 0; s < 2; s++) {
    const V2 = V.slice(), F2 = [], cache = new Map();
    const mid = (a, b) => { const k = a < b ? a * 65536 + b : b * 65536 + a; if (cache.has(k)) return cache.get(k); const m = nrm([(V[a][0] + V[b][0]) / 2, (V[a][1] + V[b][1]) / 2, (V[a][2] + V[b][2]) / 2]); V2.push(m); cache.set(k, V2.length - 1); return V2.length - 1; };
    for (const [a, b, c] of F) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); F2.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
    V = V2; F = F2; out.push({ V, F });
  }
  return out;
})();

export function buildProps(hl, opts = {}) {
  const O = [], An = [], X = [], Nn = [], Cc = [];
  const R = mulberry32(21);
  let cur = null;   // current anchor { x, z, y: [y0,y1,y2], kind, grey, em, paint, alb }
  const tri = (a, b, c, ref) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz); if (l < 1e-12) return;
    nx /= l; ny /= l; nz /= l;
    const mx = (a[0] + b[0] + c[0]) / 3 - ref[0], my = (a[1] + b[1] + c[1]) / 3 - ref[1], mz = (a[2] + b[2] + c[2]) / 3 - ref[2];
    if (nx * mx + ny * my + nz * mz < 0) { nx = -nx; ny = -ny; nz = -nz; }
    const g = (x) => Math.round(Math.pow(clamp01(x), 1 / 2.2) * 255);
    for (const p of [a, b, c]) {
      O.push(p[0], p[1], p[2], cur.kind);
      An.push(cur.x, cur.z, cur.y[0], cur.y[1]);
      X.push(cur.y[2], cur.grey, cur.em, R());
      Nn.push(Math.round(nx * 127), Math.round(ny * 127), Math.round(nz * 127), 0);
      Cc.push(g(cur.alb[0]), g(cur.alb[1]), g(cur.alb[2]), Math.round(cur.paint * 255));
    }
  };
  const anchor = (x, z, kind, alb, grey, em, paint) => { cur = { x, z, y: kind === 1 ? [0, 0, 0] : hl(x, z), kind, alb, grey, em: em || 0, paint: paint === undefined ? 0.8 : paint }; };
  const setCol = (alb, grey, em) => { cur.alb = alb; cur.grey = grey; if (em !== undefined) cur.em = em; };
  // shapes in local coordinates (relative to the anchor, y from the ground)
  const sphere = (c, r, sub, jit, rng, xform) => {
    const { V, F } = ICOS[sub];
    const pts = V.map((v) => { const s = 1 + (jit ? (rng() - 0.5) * jit : 0); let p = [c[0] + v[0] * r * s, c[1] + v[1] * r * s, c[2] + v[2] * r * s]; if (xform) p = xform(p); return p; });
    F.forEach((f) => tri(pts[f[0]], pts[f[1]], pts[f[2]], c));
  };
  const prism = (a, b, r, n, capA, capB, twist, rb) => {
    const ax = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const al = Math.hypot(...ax); const u = ax.map((v) => v / al);
    const t0 = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let e1 = [u[1] * t0[2] - u[2] * t0[1], u[2] * t0[0] - u[0] * t0[2], u[0] * t0[1] - u[1] * t0[0]]; const l1 = Math.hypot(...e1); e1 = e1.map((v) => v / l1);
    const e2 = [u[1] * e1[2] - u[2] * e1[1], u[2] * e1[0] - u[0] * e1[2], u[0] * e1[1] - u[1] * e1[0]];
    const ring = (c, rr) => { const o = []; for (let i = 0; i < n; i++) { const g = (i + 0.5) / n * 2 * Math.PI + (twist || 0); o.push([c[0] + e1[0] * Math.cos(g) * rr + e2[0] * Math.sin(g) * rr, c[1] + e1[1] * Math.cos(g) * rr + e2[1] * Math.sin(g) * rr, c[2] + e1[2] * Math.cos(g) * rr + e2[2] * Math.sin(g) * rr]); } return o; };
    const rbb = rb === undefined ? r : rb;
    const ra = ring(a, r), rB = ring(b, rbb); const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; tri(ra[i], ra[j], rB[j], mid); tri(ra[i], rB[j], rB[i], mid); }
    const cap = (rg, c, dir, kind, rr) => { if (rr <= 1e-6) return; const apex = kind ? [c[0] + u[0] * dir * rr * 0.9, c[1] + u[1] * dir * rr * 0.9, c[2] + u[2] * dir * rr * 0.9] : c; for (let i = 0; i < n; i++) tri(rg[i], rg[(i + 1) % n], apex, mid); };
    cap(ra, a, -1, capA, r); cap(rB, b, 1, capB, rbb);
  };
  const box = (c, half, rot) => {
    const cs = Math.cos(rot), sn = Math.sin(rot); const v = [];
    for (let i = 0; i < 8; i++) { const x = (i & 1 ? 1 : -1) * half[0], y = (i & 2 ? 1 : -1) * half[1], z = (i & 4 ? 1 : -1) * half[2]; v.push([c[0] + cs * x - sn * z, c[1] + y, c[2] + sn * x + cs * z]); }
    [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]].forEach((q) => { tri(v[q[0]], v[q[1]], v[q[2]], c); tri(v[q[0]], v[q[2]], v[q[3]], c); });
  };
  const S = (h) => { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map((v) => Math.pow(v, 2.2)); };

  // props a shot's camera must not fly through: [x, z, r] circles or [x0, z0, x1, z1] boxes.
  // Skipped props still consume their random numbers, so everything else stays identical.
  const cleared = (x, z) => (opts.clear || []).some((c) => (c.length === 3 ? Math.hypot(x - c[0], z - c[1]) < c[2] : x >= c[0] && x <= c[2] && z >= c[1] && z <= c[3]));
  // --- the spawn pad: a low hexagonal plinth with a warm ring (always "learned"; off in S34's fields)
  if (opts.pad !== false) {
  anchor(0, 0, 2, S('#c8bcaa'), 0.62, 0, 0.1);
  prism([0, -0.3, 0], [0, 0.07, 0], 1.25, 6, 0, 0, Math.PI / 6);
  setCol(S('#fff1dc'), 0.95, 0.9);
  for (let i = 0; i < 6; i++) {
    const g0 = (i / 6) * 2 * Math.PI + Math.PI / 6, g1 = ((i + 1) / 6) * 2 * Math.PI + Math.PI / 6;
    const r0 = 0.94, r1 = 1.1, y = 0.076;
    const p = (r, g) => [Math.cos(g) * r, y, Math.sin(g) * r];
    tri(p(r0, g0), p(r1, g0), p(r1, g1), [0, -1, 0]); tri(p(r0, g0), p(r1, g1), p(r0, g1), [0, -1, 0]);
  }
  }
  // --- trees
  // Revision 15 (Claire: Clawd's first creation, the sapling of S18, is the first living thing in his
  // worlds): the training worlds have no trees. Each tree's place holds low-poly boulders in the same
  // style instead: a round tree becomes a boulder with two stones leaning on it, a conifer a standing
  // stone with one at its foot. They paint as learned (warm stone). opts.treeStyle 'tree' restores
  // the old trees.
  const boulder = (x, z, s, kind) => {
    const rr = mulberry32(Math.round(x * 131 + z * 71) >>> 0);
    const warm = rr() < 0.5 ? S('#a89e8f') : S('#b3a896');
    anchor(x, z, 0, warm, 0.86, 0, 0.8);
    const squat = (p) => [p[0], Math.max(p[1], -0.08), p[2]];
    if (kind === 1) {
      sphere([0, 0.62 * s, 0], 0.46 * s, 1, 0.34, rr, (p) => squat([p[0], 0.62 * s + (p[1] - 0.62 * s) * 1.75, p[2]]));
      setCol(S('#9c9385'), 0.80);
      sphere([0.42 * s, 0.12 * s, 0.18 * s], 0.24 * s, 0, 0.45, rr, squat);
      return;
    }
    sphere([0, 0.32 * s, 0], 0.62 * s, 1, 0.34, rr, (p) => squat([p[0], 0.32 * s + (p[1] - 0.32 * s) * 0.78, p[2]]));
    setCol(S('#9c9385'), 0.80);
    sphere([0.58 * s, 0.14 * s, -0.22 * s], 0.3 * s, 0, 0.45, rr, squat);
    sphere([-0.5 * s, 0.1 * s, 0.3 * s], 0.24 * s, 0, 0.45, rr, squat);
  };
  const tree = (x, z, s, kind) => {
    if (opts.treeStyle !== 'tree') { boulder(x, z, s, kind); return; }
    const rr = mulberry32(Math.round(x * 131 + z * 71) >>> 0);
    const leaf = rr() < 0.5 ? S('#5f9a58') : S('#7fae62');
    anchor(x, z, 0, S('#80634a'), 0.70, 0, 0.85);
    if (kind === 1) {
      prism([0, -0.05, 0], [0, 0.5 * s, 0], 0.07 * s, 5, 0, 0);
      setCol(S('#4f8a5a'), 0.78);
      prism([0, 0.35 * s, 0], [0, 1.35 * s, 0], 0.48 * s, 7, 0, 0, rr() * 3, 0.0);
      prism([0, 0.95 * s, 0], [0, 1.95 * s, 0], 0.36 * s, 7, 0, 0, rr() * 3, 0.0);
      return;
    }
    prism([0, -0.05, 0], [0, 0.95 * s, 0], 0.075 * s, 5, 0, 0);
    setCol(leaf, 0.80);
    sphere([0, 1.18 * s, 0], 0.48 * s, 1, 0.22, rr);
    sphere([0.26 * s, 1.0 * s, -0.1 * s], 0.32 * s, 0, 0.2, rr);
    sphere([-0.22 * s, 1.03 * s, 0.12 * s], 0.3 * s, 0, 0.2, rr);
  };
  const T = opts.trees || [
    [-9.5, 4.5, 1.2, 1], [5.2, -9.5, 1.1, 0], [-11, -7, 1.3, 0], [-4.8, 9.5, 1.0, 0], [-7.5, 18, 1.3, 0], [4.5, 24, 1.0, 1],
    [-6.2, 33, 1.2, 0], [5.8, 45, 1.1, 0], [-7.0, 52, 1.4, 1], [6.0, 66, 1.2, 0], [-6.5, 78, 1.3, 0], [7.5, 88, 1.0, 1],
    [-17, 10, 1.4, 0], [-20, 34, 1.5, 1], [-24, 58, 1.3, 0], [25, 22, 1.4, 0], [30, 54, 1.2, 1], [-14, -16, 1.3, 1],
    [22, -12, 1.2, 0], [-28, 88, 1.4, 0], [28, 80, 1.3, 0], [-12, 100, 1.2, 1], [-3, -14, 1.0, 0], [12, -20, 1.3, 1],
  ];
  T.forEach((t) => { if ((opts.noRiver || Math.abs(riverDist(t[0], t[1])) > 4.2) && !cleared(t[0], t[1])) tree(t[0], t[1], t[2], t[3]); });
  // --- rocks
  const rocks = mulberry32(5);
  for (let i = 0; i < (opts.rocks === false ? 0 : 26); i++) {
    const x = (rocks() - 0.5) * 70, z = -20 + rocks() * 120;
    if (Math.abs(riverDist(x, z)) < 3.5 || Math.hypot(x, z) < 5 || pathDistXZ(x, z) < 2.2) continue;
    const s = 0.25 + rocks() * 0.5;
    if (cleared(x, z)) { for (let q = 0; q < 12; q++) rocks(); continue; }
    anchor(x, z, 0, S('#9a948a'), 0.62, 0, 0.5);
    sphere([0, s * 0.35, 0], s, 0, 0.5, rocks, (p) => [p[0], Math.max(p[1] * 0.7, -0.05), p[2]]);
  }
  // --- grey agents training on untouched ground (hidden in S18: he is alone there)
  if (opts.agents !== false) {
    const walker = (x, z, d) => {
      anchor(x, z, 3, S('#9cc3e6'), 0.86, 0, 0.1);
      const hip = [0, 0.78, 0], sh = [0.05 * d, 1.28, 0], head = [0.07 * d, 1.49, 0];
      const kneeL = [0.22 * d, 0.42, 0.05], footL = [0.30 * d, 0.05, 0.06], kneeR = [-0.12 * d, 0.40, -0.05], footR = [-0.36 * d, 0.08, -0.06];
      const elbL = [-0.12 * d, 1.02, 0.12], handL = [-0.2 * d, 0.82, 0.15], elbR = [0.22 * d, 1.05, -0.12], handR = [0.34 * d, 0.88, -0.12];
      prism(hip, sh, 0.09, 6, 1, 1); sphere(head, 0.12, 1);
      [[hip, kneeL, 0.062], [kneeL, footL, 0.052], [hip, kneeR, 0.062], [kneeR, footR, 0.052], [sh, elbL, 0.048], [elbL, handL, 0.042], [sh, elbR, 0.048], [elbR, handR, 0.042]].forEach(([a, b, r]) => prism(a, b, r, 5, 1, 1));
    };
    const ant = (x, z) => {
      anchor(x, z, 3, S('#b9a8dc'), 0.88, 0, 0.1);
      sphere([0, 0.42, 0], 0.21, 1);
      const ph = [0.3, -0.25, -0.2, 0.35];
      [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz], i) => {
        const hp = [sx * 0.16, 0.42, sz * 0.16], kn = [sx * 0.45, 0.58 + ph[i] * 0.2, sz * 0.45], ft = [sx * 0.72, 0.04 + Math.max(ph[i], 0) * 0.2, sz * 0.7];
        prism(hp, kn, 0.052, 5, 1, 1); prism(kn, ft, 0.046, 5, 1, 1);
      });
    };
    const capsule = (x, z, s) => {
      anchor(x, z, 3, S('#b9a8dc'), 0.88, 0, 0.1);
      prism([0, 0.05 * s, 0], [0, 0.8 * s, 0], 0.21 * s, 10, 1, 1);
    };
    const RA = mulberry32(99);
    let n = 0, tries = 0;
    while (n < 34 && tries < 2000) {
      tries++;
      const x = (RA() - 0.5) * 120, z = -40 + RA() * 170;
      if (Math.abs(riverDist(x, z)) < 5 || Math.hypot(x, z) < 14 || pathDistXZ(x, z) < 10) continue;
      const k = RA(), skip = cleared(x, z);
      if (k < 0.45) { const sc = 0.9 + RA() * 0.3; if (!skip) capsule(x, z, sc); }
      else if (k < 0.75) { const d = RA() < 0.5 ? 1 : -1; if (!skip) walker(x, z, d); }
      else if (!skip) ant(x, z);
      n++;
    }
  }
  // --- clouds: faceted cumulus far away (absolute positions, kind 1)
  if (opts.clouds !== false) {
    const RC = mulberry32(7);
    const dirAE = (az, el) => [Math.sin(az * Math.PI / 180) * Math.cos(el * Math.PI / 180), Math.sin(el * Math.PI / 180), Math.cos(az * Math.PI / 180) * Math.cos(el * Math.PI / 180)];
    const puff = (az, el, r, zc, D, base, sub, stretch, squash) => {
      anchor(0, 0, 1, [1, 1, 1], 1, 0, 0.85);
      const dir = dirAE(az, el), dist = D * (1 - zc * Math.PI / 180 * 0.9);
      const c = [dir[0] * dist, dir[1] * dist + 2, dir[2] * dist];
      const rw = r * Math.PI / 180 * dist;
      const baseY = 2 + dist * Math.tan(base * Math.PI / 180);
      const eaz = [Math.cos(az * Math.PI / 180), 0, -Math.sin(az * Math.PI / 180)];
      sphere(c, rw, sub, 0.12, RC, (p) => {
        let q = p;
        if (stretch) { const d = [p[0] - c[0], p[1] - c[1], p[2] - c[2]]; const a = d[0] * eaz[0] + d[2] * eaz[2]; q = [p[0] + eaz[0] * a * (stretch - 1), c[1] + (p[1] - c[1]) * (squash || 0.32), p[2] + eaz[2] * a * (stretch - 1)]; }
        if (q[1] < baseY) q = [q[0], baseY + (RC() - 0.5) * rw * 0.03, q[2]];
        return q;
      });
    };
    const cumulus = (azC, base, w, h, n, lean, D, sub) => {
      for (let i = 0; i < n; i++) {
        const v = Math.pow(RC(), 1.15);
        const half = 0.5 * w * Math.sqrt(Math.max(0.04, 1 - Math.pow(v, 1.7)));
        const u = RC() * 2 - 1;
        const r = w * (0.075 + 0.11 * RC()) * (1.12 - 0.5 * v);
        const az = azC + u * half * 0.82 + lean * v * h;
        const el = base + r * 0.55 + v * h;
        const zc = w * 0.34 * Math.sqrt(Math.max(0, 1 - u * u)) * (1 - 0.35 * v) + r * 0.35 * RC();
        puff(az, el, r * 1.15, zc, D, base, r > 1.0 ? (sub || 1) : 1);
      }
    };
    cumulus(25, 2.5, 11, 3.4, 15, -0.05, 5200, 2);
    cumulus(-24, 3.2, 8.5, 2.4, 10, 0.08, 5000, 2);
    cumulus(-6, 6.3, 3.6, 1.0, 6, 0.0, 5000, 1);
    cumulus(-43, 2.0, 6, 1.6, 7, 0.0, 5000, 1);
    cumulus(41, 1.6, 5, 1.4, 6, 0.0, 5000, 1);
    cumulus(160, 4.0, 12, 3.0, 14, 0.04, 5200, 2);     // behind the spawn (the S13 opening looks this way)
    cumulus(205, 6.5, 6, 1.6, 8, 0.0, 5000, 1);
    cumulus(118, 3.0, 8, 2.2, 10, -0.05, 5000, 2);
    cumulus(-120, 3.4, 9, 2.6, 11, 0.05, 5000, 2);
    cumulus(-165, 7.0, 5, 1.2, 6, 0.0, 5000, 1);
    [[17, 9.4, 1.4, 6.5], [27, 11.4, 1.2, 5.5], [34, 8.4, 1.0, 5.0], [8, 12.4, 0.9, 5.5], [150, 10, 1.3, 6], [190, 12, 1.1, 5], [-140, 9, 1.2, 6]].forEach(([az, el, r, st]) => puff(az, el, r, 0, 5600, el - 5, 1, st, 0.16));
    [[-6, 1.05, 1.1, 5.0], [6, 1.9, 0.8, 5.5], [15, 1.3, 0.9, 4.5], [-18, 1.6, 1.0, 4.0], [25, 2.2, 0.8, 4.0]].forEach(([az, el, r, st]) => puff(az, el, r, 0, 4800, el - 5, 1, st));
  }
  return { O: new Float32Array(O), An: new Float32Array(An), X: new Float32Array(X), N: new Int8Array(Nn), C: new Uint8Array(Cc), n: O.length / 4 };
}
function pathDistXZ(x, z) { return pathDist(x, z); }
