// S34's world (revision 8): the fields Clawd paints for growing things, in golden light. Built on the
// valley engine (sets/valley) with its own land (terrain.js setLand), hedgerow trees, the field
// patchwork as brush strokes (strokes.js) and the plant he designs, drawn in lines of light.
// Metres; x right, y up, z away from the lens (the rows run along +z, up a gentle rise).
import { fbmG, sstep } from '../valley/terrain.js';
import { rng } from '../../lib/util.js';

// ---------------------------------------------------------------- the land
export function fieldsLand(x, z) {
  const r = Math.hypot(x, z);
  // the near fields: a broad rise away from the lens, soft swells to either side
  let h = 3.2 * sstep(-10, 140, z) + 0.022 * Math.max(0, z - 140);
  h += 1.5 * sstep(14, 60, Math.abs(x)) * (0.6 + 0.4 * Math.sin(z * 0.035 + (x > 0 ? 1.3 : 4.1)));
  h += 0.7 * fbmG(x * 0.018 + 5.1, z * 0.018 + 2.3, 3);
  // rolling hills beyond, and a far range in the haze
  h += 10 * sstep(110, 260, r) * (0.55 + 0.6 * fbmG(x * 0.006 + 1.7, z * 0.006 + 9.1, 4));
  h += 85 * sstep(520, 1000, r) * (1 - sstep(2600, 3600, r)) * Math.max(0, 0.45 + fbmG(x * 0.0021 + 3.3, z * 0.0021 + 7.7, 5));
  return h;
}

// hedgerow trees along the field edges and a few in the fields: [x, z, scale, kind (0 round, 1 pine)]
export const FIELD_TREES = [
  [-15.5, 22, 1.3, 0], [-16, 38, 1.1, 0], [-15, 55, 1.4, 0], [-16.5, 74, 1.2, 0], [-15.5, 96, 1.3, 1],
  [16, 30, 1.2, 0], [15.5, 50, 1.4, 0], [16.5, 68, 1.1, 1], [15.5, 90, 1.3, 0],
  [-34, 60, 1.5, 0], [38, 44, 1.4, 0], [-42, 120, 1.6, 0], [46, 130, 1.5, 1], [4, 150, 1.4, 0], [-22, 170, 1.5, 0],
];

// ---------------------------------------------------------------- the patchwork, as brush strokes
// Pigment bins (glsl.js strokeAlb, uStrokePal 1): tint -> fract(tint*5.37):
// [0, .2) ripe wheat, [.2, .4) ochre, [.4, .6) young green, [.6, .8) olive, [.8, 1) straw
export const PIG = { wheat: 0.02, ochre: 0.056, green: 0.093, olive: 0.13, straw: 0.168 };
// last: local frame by which the last strokes land (the rest are painted before the shot opens)
export function fieldStrokes() {
  const R = rng(5834), S = [];
  const add = (pts, w, pig, t0, dur, o = {}) => S.push(Object.assign({ pts, w, t0, dur, tint: PIG[pig] + (R() - 0.5) * 0.004, seed: R() * 10, dry: 0.4 + 0.3 * R(), taper: 0.2 }, o));
  // the near strips, along the rows (x centre, width, pigment); the four nearest land as we arrive
  const STRIPS = [
    [-40, 7, 'olive'], [-32, 6, 'wheat'], [-25.5, 5.5, 'green'], [-19.5, 5, 'straw'], [-12.5, 7, 'wheat'],
    [-5.5, 6, 'green'], [1.2, 7, 'wheat'], [8.2, 6.5, 'ochre'], [14.5, 5, 'green'], [20, 5.5, 'wheat'],
    [26.5, 6, 'olive'], [33, 6, 'straw'], [40, 7, 'green'],
  ];
  const LAST = { '-5.5': 0, '1.2': 1, '8.2': 2, '-12.5': 3 };
  STRIPS.forEach(([x, w, pig], i) => {
    const wob = (z) => x + 0.8 * Math.sin(z * 0.05 + i);
    const pts = [[wob(-18), -18], [wob(30), 30], [wob(80), 80], [wob(130), 130], [wob(175), 175]];
    const k = LAST[String(x)];
    if (k !== undefined) add(k % 2 ? pts.slice().reverse() : pts, w * 0.62, pig, 2 + 7 * k, 26, { dry: 0.25, cur: k });
    else add(pts, w * 0.62, pig, -200 + i, 30);
  });
  // cross bands beyond the strips (the rolling hills) and far bands to the horizon, all done before
  const band = (D, pig, w) => { const P = []; for (let j = 0; j < 9; j++) { const a = (-75 + 150 * j / 8) * Math.PI / 180, rr = D * (1 + 0.06 * Math.sin(a * 3 + D)); P.push([Math.sin(a) * rr, 40 + Math.cos(a) * rr]); } add(P, w, pig, -180, 30, { dry: 0.6, taper: 0.3 }); };
  [[150, 'olive', 22], [185, 'wheat', 26], [225, 'green', 30], [275, 'ochre', 36], [340, 'olive', 48], [420, 'straw', 60],
    [520, 'green', 80], [660, 'olive', 110], [860, 'wheat', 150], [1150, 'green', 210], [1550, 'olive', 290], [2100, 'straw', 400]]
    .forEach(([D, pig, w]) => band(D, pig, w));
  // the sides: long bands up the swells left and right
  [[-58, 'green'], [-74, 'wheat'], [58, 'olive'], [76, 'wheat']].forEach(([x, pig]) => add([[x, -30], [x * 1.05, 60], [x * 1.1, 150]], 9, pig, -170, 30, { dry: 0.5 }));
  return S;
}

// ---------------------------------------------------------------- the plant, in lines of light
// The plant is S35's paper plant's own lines (sets/paper-kit/greenhouse.js PLANT_LINES, screen px at
// S35's first frame): unprojected through S34's last camera onto a vertical plane through the stem's
// foot, so the last frame puts them exactly where they land. Each line grows from its root: the stem
// from the foot up; each closed leaf or head outline from the stem out to its tip along both edges.
// cam: camBasis of the last camera (1920 x 1080); foot: the world point under the stem's foot.
export function plantFromLines(lines, B, foot) {
  const n = [B.fwd[0], 0, B.fwd[2]], nl = Math.hypot(n[0], n[2]); n[0] /= nl; n[2] /= nl;
  const un = (q) => {
    const nx = (q[0] / 960 - 1 - B.pp[0]) * B.aspect / B.fy, ny = (1 - q[1] / 540 - B.pp[1]) / B.fy;
    const d = [0, 1, 2].map((k) => B.fwd[k] + B.right[k] * nx + B.up[k] * ny);
    const t = ((foot[0] - B.pos[0]) * n[0] + (foot[2] - B.pos[2]) * n[2]) / (d[0] * n[0] + d[2] * n[2]);
    return [B.pos[0] + d[0] * t - foot[0], B.pos[1] + d[1] * t - foot[1], B.pos[2] + d[2] * t - foot[2]];   // relative to the foot
  };
  const parts = [];
  const ORDER = { stem: [0, 0.34], leaf0: [0.2, 0.2], leaf1: [0.28, 0.2], leaf2: [0.36, 0.2], leaf3: [0.44, 0.2], leaf4: [0.52, 0.18], head: [0.66, 0.3] };
  for (const L of lines) {
    const P = L.pts.map(un), [at, len] = ORDER[L.part] || [0.5, 0.2];
    if (L.part === 'stem') parts.push({ part: L.part, edges: [P], at, len });
    else {
      // a closed outline: root on one edge -> tip -> back on the other edge; split at the tip
      const pts = P.slice(0, -1), m = Math.floor(pts.length / 2);
      parts.push({ part: L.part, edges: [pts.slice(0, m + 1), pts.slice(m).reverse()], at, len });
    }
  }
  return parts;
}
export const partDrawn = (part, g) => Math.max(0, Math.min(1, (g - part.at) / part.len));
