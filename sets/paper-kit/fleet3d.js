// The fleet in 3D (revision 11, after Claire: "a rigid grid of tiles, like a solar-panel array";
// revision 12, the physics: beamed sails face their beam, so every sail is parallel, its normal along
// the beam (SOURCE_DIR), the beam meets its hub, and the formation lies in the plane perpendicular to
// the beams; the organic look comes from position jitter and billow, never orientation jitter).
// A flock of thin square light sails: each is four translucent membrane panels stretched between an X
// of booms, billowing slightly under the light and scalloped between the boom tips, like a real
// light sail; the formation is a gently curved sheet with staggered rows and slight variations in
// spacing, turn and height, so it reads as a flock, not tiles. Plain JS (no GL): S29 draws it in 2D
// over its paper frames, and D's voyage imports it read-only to continue the same flock.
//
//   project(p, cam = CAM)     world -> [sx, sy, depth] (screen px, 1920x1080, y down)
//   CAM                       S29's fleet camera: close, among the sails (the formation reads vast)
//   SHEET                     centre c, in-plane axes U (along a row) and V (row to row), normal N
//                             (N points toward the beams' sources below; light pushes the sails -N)
//   slotAt(i)                 sail i's centre (curved sheet, staggered rows, jittered)
//   sailCorners(c, side, open, spin)   the four boom tips (as in revision 10; D uses it)
//   sailMesh(i, o)            { hub, tips[4], panels[4]: { tip0, tip1, edge (the scalloped outer
//                             edge's control point), belly (the billow's deepest point), n } }
//                             o: { c (centre override), side, open 0..1, spin, billow }
//   drawSail(g, k, proj, mesh, look)   draws one sail in 2D: proj(p3) -> [x, y, z] screen px;
//                             look: { lit 0..1, alpha, light: [x, y, z] direction to the light,
//                             hot 0..1 (the beam's hot spot at the hub) }
//   beamSource(i)             where sail i's beam comes from: far below, out of frame
//   FLEET_COLOURS             agreed with D (MATCH.md)
export const COLS = 14, ROWS = 10, N_SAILS = COLS * ROWS;
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rnd = (i, k) => { const x = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };

// ---------------------------------------------------------------- the camera
export const CAM = { pos: [0, 0, 0], yaw: 0.06, pitch: 0.3, f: 1150, pp: [960, 560] };
export function camBasis(cam = CAM) {
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const fw = [sy * cp, sp, cy * cp], rt = [cy, 0, -sy];
  return { pos: cam.pos, fw, rt, up: cross(fw, rt), f: cam.f, pp: cam.pp };
}
const B0 = camBasis(CAM);
export function project(p, cam = CAM) {
  const B = cam === CAM ? B0 : camBasis(cam), d = sub(p, B.pos), z = dot(d, B.fw);
  return [B.pp[0] + B.f * dot(d, B.rt) / z, B.pp[1] - B.f * dot(d, B.up) / z, z];
}

// ---------------------------------------------------------------- the formation
const YAW = 0.9, TILT = -0.46;
const U = norm([Math.cos(YAW), 0, Math.sin(YAW)]);
const H = [-Math.sin(YAW), 0, Math.cos(YAW)];
const V = norm(add(mul(H, Math.cos(TILT)), [0, Math.sin(TILT), 0]));
const NRM = norm(cross(U, V));
export const SHEET = { c: [3.2, 4.4, 19], U, V, N: NRM, du: 1.85, dv: 1.9, side: 1.22, curve: 0.011 };
// the hero: the flock's nearest member (index N_SAILS), same mesh and orientation, just nearer (it
// sits about 5 units off the plane on the beam side, low left in S29's frame)
export const HERO = { i: N_SAILS, c: [-2.47, -0.06, 5.83] };
export function slotAt(i) {
  if (i === N_SAILS) return HERO.c.slice();
  const r = Math.floor(i / COLS), c = i % COLS;
  const u = (c - (COLS - 1) / 2 + (r % 2 ? 0.5 : 0) - 0.25) * SHEET.du * (1 + 0.1 * (rnd(i, 1) - 0.5)) + 0.3 * (rnd(i, 2) - 0.5);
  const v = (r - (ROWS - 1) / 2) * SHEET.dv + 0.35 * (rnd(i, 3) - 0.5);
  // gently curved: the edges lift away from the beams (-N), like a canopy; plus a little height play
  const n = -SHEET.curve * (u * u + 1.4 * v * v) + 0.45 * (rnd(i, 4) - 0.5);
  return add(add(SHEET.c, mul(U, u)), add(mul(V, v), mul(NRM, n)));
}
// a sail's own frame: its normal leans a little off the sheet's and it is turned about it
// (revision 12: no orientation jitter: every sail's normal is SOURCE_DIR exactly, and every sail has the
//  same turn; `spin` only animates a folded sail turning as it opens)
function frameOf(i, spin = 0) {
  const n = NRM, a0 = U, b0 = cross(n, a0);
  const cs = Math.cos(spin), sn = Math.sin(spin);
  return { n, a: add(mul(a0, cs), mul(b0, sn)), b: add(mul(b0, cs), mul(a0, -sn)) };
}
// the four boom tips (compatible with revision 10: a square in the sheet's plane)
export function sailCorners(c, side = SHEET.side, open = 1, spin = 0) {
  const h = side / 2, w = h * (0.06 + 0.94 * open);
  const cs = Math.cos(spin), sn = Math.sin(spin);
  const a = add(mul(U, cs), mul(V, sn)), b = add(mul(V, cs), mul(U, -sn));
  return [[-w, -h], [w, -h], [w, h], [-w, h]].map(([x, y]) => add(c, add(mul(a, x), mul(b, y))));
}
// the sail as a light sail: an X of booms (hub to the four tips, the tips on the diagonals) and four
// triangular membrane panels between them, each billowing a little away from the light (-N) and
// scalloped along its outer edge. open 0..1 unfurls it: the booms extend and the panels fan out.
export function sailMesh(i, o = {}) {
  const c = o.c || slotAt(i), side = (o.side || SHEET.side) * (1 + 0.12 * (rnd(i, 8) - 0.5)), open = o.open === undefined ? 1 : o.open;
  const breathe = o.t === undefined ? 1 : 1 + 0.18 * Math.sin(1.7 * o.t + 6.283 * rnd(i, 14));
  const F = frameOf(i, o.spin || 0), R = side * 0.7071 * (0.12 + 0.88 * open), bil = (o.billow === undefined ? 0.1 : o.billow) * side * open * (0.7 + 0.6 * rnd(i, 13)) * breathe;
  const hub = c;
  // the booms point to the corners of the square (its diagonals); folded, the panels close up
  const ang = [0, 1, 2, 3].map((k) => Math.PI / 4 + k * Math.PI / 2 + (1 - open) * 0.6 * (k % 2 ? 1 : -1));
  const tips = ang.map((t) => add(hub, add(mul(F.a, R * Math.cos(t)), mul(F.b, R * Math.sin(t)))));
  const panels = [0, 1, 2, 3].map((k) => {
    const t0 = tips[k], t1 = tips[(k + 1) % 4], mid = lerp3(t0, t1, 0.5);
    const edge = add(lerp3(mid, hub, 0.16), mul(F.n, -bil * 0.4));                        // scallop, pulled in
    const belly = add(lerp3(hub, mid, 0.55), mul(F.n, -bil));                             // the billow
    const n = norm(cross(sub(t0, belly), sub(t1, belly)));
    return { tip0: t0, tip1: t1, edge, belly, n };
  });
  return { hub, tips, panels, n: F.n };
}
// the beams (revision 12): the source (the Earth's laser array) is far away along SOURCE_DIR, so every
// beam is parallel and meets its sail's hub at normal incidence. beamSource(i) is a far point on sail
// i's beam (L units upstream); TRAVEL is the direction the light, and the pushed sails, go.
export const SOURCE_DIR = NRM, TRAVEL = mul(NRM, -1);
export const beamFrom = (p, L = 60) => add(p, mul(SOURCE_DIR, L));
export function beamSource(i, L = 60) { return beamFrom(slotAt(i), L); }
// the colours (agreed with D, MATCH.md): unlit pale tissue, lit Claude's orange, the beams
export const FLEET_COLOURS = { pale: [150, 168, 206], paleA: 0.5, lit: [255, 158, 104], litA: 0.92, beam: [255, 150, 96] };

// ---------------------------------------------------------------- drawing one sail in 2D
const rgba = (c, a) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
export function drawSail(g, k, proj, mesh, look = {}) {
  const lit = look.lit || 0, A = look.alpha === undefined ? 1 : look.alpha, hot = look.hot === undefined ? lit : look.hot;
  const L = norm(look.light || NRM), col = FLEET_COLOURS.pale.map((v, j) => v + (FLEET_COLOURS.lit[j] - v) * lit);
  const H2 = proj(mesh.hub);
  if (H2[2] <= 0.3) return false;
  const P = (p) => { const q = proj(p); return [q[0] * k, q[1] * k]; };
  const hub = P(mesh.hub);
  const size = Math.hypot(...[0, 1].map((j) => P(mesh.tips[0])[j] - P(mesh.tips[2])[j]));
  if (size < 1.2) return false;
  // the membrane: each panel shaded by how squarely it faces the light (its billow gives the four
  // panels four tones), dense and bright at the hub, thinning to translucent at its scalloped edge
  for (const pn of mesh.panels) {
    const t0 = P(pn.tip0), t1 = P(pn.tip1), e = P(pn.edge), bl = P(pn.belly);
    const face = 0.55 + 0.45 * Math.abs(dot(pn.n, L));
    const a0 = A * (lerp(0.34, 0.9, lit)) * face, a1 = A * lerp(0.1, 0.3, lit) * face;
    const gr = g.createLinearGradient(hub[0], hub[1], (t0[0] + t1[0]) / 2, (t0[1] + t1[1]) / 2);
    const bright = col.map((v) => Math.min(255, v + 45 * face * (0.4 + 0.6 * lit)));
    gr.addColorStop(0, rgba(bright, a0)); gr.addColorStop(0.6, rgba(col, (a0 + a1) / 2)); gr.addColorStop(1, rgba(col, a1));
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(hub[0], hub[1]); g.lineTo(t0[0], t0[1]); g.quadraticCurveTo(e[0], e[1], t1[0], t1[1]); g.closePath(); g.fill();
    // the thin bright rim along the scalloped edge
    g.strokeStyle = rgba(col.map((v) => Math.min(255, v + 70)), A * lerp(0.4, 0.75, lit)); g.lineWidth = Math.max(0.6, 0.9 * k);
    g.beginPath(); g.moveTo(t0[0], t0[1]); g.quadraticCurveTo(e[0], e[1], t1[0], t1[1]); g.stroke();
    void bl;
  }
  // the booms: a fine X from the hub to the tips, dark against the lit film
  g.strokeStyle = rgba(lit > 0.5 ? [40, 26, 30] : [200, 212, 236], A * lerp(0.32, 0.45, lit)); g.lineWidth = Math.max(0.6, (size > 60 ? 1.3 : 0.8) * k);
  g.beginPath(); for (const t of mesh.tips) { const q = P(t); g.moveTo(hub[0], hub[1]); g.lineTo(q[0], q[1]); } g.stroke();
  // the beam's hot spot at the hub, where the light presses through
  if (hot > 0.01 && size > 8) {
    const r = size * 0.2, gr = g.createRadialGradient(hub[0], hub[1], 0, hub[0], hub[1], r);
    gr.addColorStop(0, rgba([255, 230, 204], 0.42 * hot * A)); gr.addColorStop(1, rgba([255, 170, 110], 0));
    g.fillStyle = gr; g.beginPath(); g.arc(hub[0], hub[1], r, 0, 2 * Math.PI); g.fill();
  }
  return true;
}
const lerp = (a, b, t) => a + (b - a) * t;
