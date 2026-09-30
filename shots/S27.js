// S27 (bars 71-72, frames 5051-5182; revision 11, agent I): the blueprint alone. The space elevator,
// drawn whole by a crowd of thousands, and its defining calculation laid across the ground. It opens
// on a hard cut from O's observatory (S26, bar 70); S29 opens at 5183, in the fill.
//   the crowd: on the salt flat at night (sets/inside-montage/saltflat.js) it grows from the drafting
//            ring round the base to thousands covering the flat to the horizon (each arrives in a
//            flash as the crowd's front, racing outward from the base, passes it). They draw the space
//            elevator in lines of light, every line of O's blueprint (sets/paper-kit/elevatorlines.js):
//            the anchor platform, the tower and its stays (71.1-71.2), the ribbon rising out of the
//            frame with its ties (71.3-71.4), the climber and the folded sails it carries (72.1-72.2).
//            Beams from the drafting ring to the live tips trade on the snares. The camera is level.
//   the code: the real lines of elevatorlines.js lie on the salt flat in rows, in perspective, under
//            and between the crowd, streaming toward the anchor from both sides and flowing into it
//            (hillx `decals`, sets/inside-montage/codeline.js; S03's line of tokens, rhymed).
//   the calculation: the foreground is the drafting table (the crowd leaves it clear), and from
//            71.1 the force balance about geostationary orbit is drawn on it in the same light, in
//            perspective, then held while the climber is drawn and gone as the crowd steps back:
//              - the Earth as a big arc at the left, the tether running out from it to the counterweight;
//              - force arrows along it: toward the Earth below GEO (gravity wins), shrinking to
//                nothing at GEO, outward beyond it (the spin wins), growing toward the tip;
//              - GEO as a warm dotted arc, S23's ring of satellites, which sits at GEO;
//              - the ribbon's taper, widest at GEO, and the tension curve beside it peaking there;
//              - the escape line at about 47,000 km, and the release arc curving away from the tip:
//                the path S29's climber flings the payload along (a payload runs it).
//            The drafting ring's beams work the diagram's live ends while it is drawn.
// Bar 72: beats 1-3 (the drums drop out) the drawing completes and the crowd steps back; for the last
// six frames (the fill, 5177-5182) the world goes dark and only the lines remain, exactly where
// elevatorlines.js puts them at S29's first frame (S29_CAM0: screen px = the elevator set's paper
// px). S29 lands them at 5183. The drawing's world geometry is the unprojection of those screen lines
// through the inside camera at rest, onto a plane standing on the crust, so the blueprint always
// stands at its true place; the camera's horizon at rest is the paper sea's (EL.horizon, y 690).
import { createHill, CLAWD_U } from '../sets/inside-montage/hillx.js';
import { HOT, WARM } from '../sets/inside-montage/draw.js';
import { WORLD, worldPal, starLines, SA, SB } from '../sets/inside-montage/saltflat.js';
import { readCode, codeAtlas, streamQuads } from '../sets/inside-montage/codeline.js';
import { toScreen } from '../sets/paper-kit/kit.js';
import { STROKES as ESTROKES, S29_CAM0, EL } from '../sets/paper-kit/elevatorlines.js';
import { camBasis, project } from '../sets/hill/scene.js';
import { clamp, lerp, smoothstep, hash } from '../lib/util.js';

const F0 = 5051, N = 132, FL = F0 + N - 1;
const DARK = 5177;                                          // the fill: only the lines remain
const ease = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- the inside camera
// level, principal point on the tether's axis and on the paper sea's horizon, so the paper
// blueprint's verticals stay vertical; the elevator stands on the crust at depth D, its legs' feet
// on the ground; the camera looks out toward the two stars. A gentle push, at rest from 5142.
const deg = Math.PI / 180;
const F3 = 1600, D = 20.3, PPX = EL.ribbon.x, PPY = EL.horizon;
const GROUND = toScreen(S29_CAM0, [EL.ribbon.x, EL.legBot], 0)[1];   // the legs' feet at S29's first frame
const CAM_Y = (GROUND - PPY) * D / F3;
const CAM3 = { pos: [7.0, CAM_Y, -17.0], yaw: -34 * deg, pitch: 0, F: F3, pp: [PPX, PPY] };
const B3 = camBasis(CAM3);
const camAt = (fl) => (fl >= 91 ? CAM3 : Object.assign({}, CAM3, { F: lerp(1450, F3, ease(fl / 91)) }));
// screen px (through S29's first frame, = the inside camera's at rest) -> the drawing plane
const un = (sx, sy) => {
  const z = D, x = (sx - B3.pp[0]) * z / F3, y = (B3.pp[1] - sy) * z / F3;
  return [B3.pos[0] + B3.fw[0] * z + B3.right[0] * x + B3.up[0] * y, B3.pos[1] + B3.fw[1] * z + B3.right[1] * x + B3.up[1] * y, B3.pos[2] + B3.fw[2] * z + B3.right[2] * x + B3.up[2] * y];
};
const AXIS = un(PPX, GROUND);                               // the tether's foot on the crust
// the ground in the camera's own terms: x across (m, right of the tether's axis), z out along the view
const G = (x, z, y = 0.02) => [B3.pos[0] + B3.fw[0] * z + B3.right[0] * x, y, B3.pos[2] + B3.fw[2] * z + B3.right[2] * x];
const lat = (p) => { const d = [p[0] - B3.pos[0], p[2] - B3.pos[2]]; return [d[0] * B3.right[0] + d[1] * B3.right[2], d[0] * B3.fw[0] + d[1] * B3.fw[2]]; };

// ---------------------------------------------------------------- the drawing's progress
// 0..1 over elevatorlines' windows: the anchor, tower and stays on 71.1-2, the ribbon on 71.3-4, the
// climber and the sails on 72.1-2 (as in cut 10, the second half on the same frames)
const PROG = [[0, 0.0], [36, 0.34], [71, 0.58], [78, 0.62], [104, 1.0]];
function progress(fl) {
  if (fl <= PROG[0][0]) return 0;
  for (let i = 1; i < PROG.length; i++) if (fl <= PROG[i][0]) { const [a, pa] = PROG[i - 1], [b, pb] = PROG[i]; return lerp(pa, pb, (fl - a) / (b - a)); }
  return 1;
}

// ---------------------------------------------------------------- the blueprint
// every stroke of elevatorlines.js, in screen px at S29's first frame, unprojected onto the plane;
// drawn from its first point to its last over its window of the drawing's progress
const STROKES = ESTROKES.map((s) => {
  const scr = s.pts.map(([X, Y]) => toScreen(S29_CAM0, [X, Y], s.z));
  const pts = scr.map(([x, y]) => un(x, y));
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  return Object.assign({}, s, { scr, pts, L });
});

// ---------------------------------------------------------------- the calculation (the diagram)
// A uniform tether from the Earth's surface, per unit mass: the net pull g(r) = GM/r^2 - w^2 r (down
// below GEO, out above it) and the tension T(r) = GM (1/R - 1/r) - w^2 (r^2 - R^2) / 2, which peaks at
// GEO. Radii in Earth radii; laid out on the ground on a schematic (compressed) scale.
const GM = 398600, RE = 6378, OM = 7.2921e-5;
const gNet = (r) => GM / (r * RE) ** 2 - OM * OM * r * RE;              // km/s^2
const Tn = (r) => GM * (1 / RE - 1 / (r * RE)) - OM * OM * ((r * RE) ** 2 - RE * RE) / 2;
const R_GEO = Math.cbrt(GM / (OM * OM)) / RE, R_ESC = (RE + 47000) / RE, R_TIP = 15;
const T_MAX = Tn(R_GEO), G_SURF = gNet(1);
const DG = { zT: 15.4, xC: -11.0, rE: 4.6, len: 12.0 };
DG.xS = DG.xC + DG.rE;
const xOf = (r) => DG.xS + DG.len * Math.pow((r - 1) / (R_TIP - 1), 0.8);
const rOf = (x) => 1 + (R_TIP - 1) * Math.pow(clamp((x - DG.xS) / DG.len), 1.25);
const X_GEO = xOf(R_GEO), X_ESC = xOf(R_ESC), X_TIP = xOf(R_TIP);
const bez = (a, b, c, t) => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1]];
const ARC = [[X_TIP, DG.zT], [X_TIP + 0.5, DG.zT + 4.4], [X_TIP + 6.6, DG.zT + 9.6]];
const ARCPTS = [...Array(33)].map((_, i) => bez(...ARC, i / 32));
// its clock: the Earth and the tether's axis, then a front sweeping out along it (taper, tension,
// arrows, GEO, the escape line), the counterweight, the release arc, the payload; held through
// 72.1-72.2 while the climber is drawn, gone as the crowd steps back (before the fill)
const DCLK = { e0: 4, e1: 16, a0: 8, a1: 22, f0: 16, f1: 50, arc0: 50, arc1: 62, pay0: 60, pay1: 86, out0: 100, out1: 120 };
const COOL = [0.62, 0.8, 1.15], PALE = [0.9, 0.86, 0.8];
const tensionCol = (k) => [lerp(0.55, 1.25, k), lerp(0.75, 0.62, k), lerp(1.05, 0.3, k)];
function diagram(fl, T, f, lines, tips) {
  if (fl < DCLK.e0 || fl >= DCLK.out1) return 0;
  const fade = 1 - smoothstep(DCLK.out0, DCLK.out1, fl), snare = T.pulse('snares', f, 5);
  const I0 = 0.95 * fade, Pp = (x, z) => G(x, z, 0.03);
  const seg = (a, b, w, I, c, glow = 3) => lines.push([...a, ...b, w, I, c[0], c[1], c[2], glow]);
  const poly = (pts, w, I, c, glow) => { for (let i = 1; i < pts.length; i++) seg(pts[i - 1], pts[i], w, I, c, glow); };
  // the Earth: a big arc sweeping out both ways from the tether's foot, a fainter one inside it
  const ue = ease((fl - DCLK.e0) / (DCLK.e1 - DCLK.e0)), span = 82 * deg * ue;
  if (ue > 0) {
    for (const [k, I] of [[1, 1.0], [0.9, 0.35]]) {
      const pts = [];
      for (let i = 0; i <= 40; i++) { const a = -span + 2 * span * i / 40; pts.push(Pp(DG.xC + DG.rE * k * Math.cos(a), DG.zT + DG.rE * k * Math.sin(a))); }
      poly(pts, 1.6, I0 * I, COOL, 4);
    }
    if (ue < 1) tips.push({ p: Pp(DG.xC + DG.rE * Math.cos(span), DG.zT + DG.rE * Math.sin(span)) });
  }
  // the tether's axis, the Earth to the tip
  const ua = ease((fl - DCLK.a0) / (DCLK.a1 - DCLK.a0));
  if (ua > 0) {
    const xe = lerp(DG.xS, X_TIP, ua);
    seg(Pp(DG.xS, DG.zT), Pp(xe, DG.zT), 0.9, I0 * 0.6, PALE, 2.5);
    if (ua < 1) tips.push({ p: Pp(xe, DG.zT) });
  }
  // the front: taper, tension curve and arrows appear behind it
  const xF = lerp(DG.xS, X_TIP, clamp((fl - DCLK.f0) / (DCLK.f1 - DCLK.f0)));
  if (xF > DG.xS + 0.01) {
    const n = 64, top = [], bot = [], ten = [];
    for (let i = 0; i <= n; i++) {
      const x = lerp(DG.xS, xF, i / n), r = rOf(x), k = Math.max(0, Tn(r) / T_MAX);
      const w = 0.12 + 0.5 * Math.pow(k, 1.4);
      top.push([x, DG.zT + w]); bot.push([x, DG.zT - w]); ten.push([x, DG.zT - 0.8 - 2.5 * k, k]);
    }
    // the ribbon's taper: widest at GEO
    for (const e of [top, bot]) poly(e.map(([x, z]) => Pp(x, z)), 1.2, I0 * 0.9, PALE, 3);
    // the tension curve beside it, coloured by the load, on its baseline
    seg(Pp(DG.xS, DG.zT - 0.8), Pp(xF, DG.zT - 0.8), 0.7, I0 * 0.35, PALE, 2);
    for (let i = 1; i < ten.length; i++) seg(Pp(ten[i - 1][0], ten[i - 1][1]), Pp(ten[i][0], ten[i][1]), 1.7, I0 * (1.0 + 0.25 * snare), tensionCol(ten[i][2]), 4);
    tips.push({ p: Pp(xF, DG.zT + 0.12) }, { p: Pp(ten[n][0], ten[n][1]) });
    // the force arrows along the far side: toward the Earth below GEO, outward above it
    for (let i = 0; i < 15; i++) {
      const r = 1 + (R_TIP - 1) * Math.pow((i + 0.5) / 15, 1.25), x = xOf(r);
      if (x > xF) break;
      const g = gNet(r), grow = ease((xF - x) / 0.9), len = 1.55 * Math.pow(Math.abs(g) / G_SURF, 0.33) * grow;
      if (len < 0.05) continue;
      const dir = g > 0 ? -1 : 1, z = DG.zT + 1.0, x1 = x + dir * len;
      const c = g > 0 ? COOL : [1.2, 0.6, 0.3], I = I0 * (0.8 + 0.3 * snare);
      seg(Pp(x, z), Pp(x1, z), 1.4, I, c, 3);
      const hx = x1 - dir * Math.min(0.32, 0.45 * len);
      seg(Pp(x1, z), Pp(hx, z + 0.62), 1.3, I, c, 3); seg(Pp(x1, z), Pp(hx, z - 0.62), 1.3, I, c, 3);
    }
    // GEO: the warm dotted arc of S23's ring, placed outward from the crossing when the front passes
    if (xF >= X_GEO) {
      const fG = DCLK.f0 + (DCLK.f1 - DCLK.f0) * (X_GEO - DG.xS) / (X_TIP - DG.xS), age = fl - fG, rho = X_GEO - DG.xC;
      for (let i = -24; i <= 24; i++) {
        const born = Math.abs(i) * 0.3;
        if (age < born) continue;
        const a = i * 1.55 * deg, p = Pp(DG.xC + rho * Math.cos(a), DG.zT + rho * Math.sin(a));
        const fl2 = Math.exp(-(age - born) / 4);
        lines.push([...p, ...p, 3.2 + 2.5 * fl2, I0 * (0.85 + 2.0 * fl2), 1.25, 0.66, 0.34, 5]);
      }
    }
    // the escape line (about 47,000 km): beyond it a released payload leaves the Earth for good
    if (xF >= X_ESC) seg(Pp(X_ESC, DG.zT - 1.2), Pp(X_ESC, DG.zT + 1.5), 1.2, I0 * 0.9, [1.15, 0.8, 0.5], 3);
  }
  // the counterweight at the tip
  if (fl >= DCLK.f1) {
    const s = 0.34, h = 0.8, c = [X_TIP + 0.1, DG.zT];
    poly([[c[0], c[1] - h], [c[0] + 2 * s, c[1] - h], [c[0] + 2 * s, c[1] + h], [c[0], c[1] + h], [c[0], c[1] - h]].map(([x, z]) => Pp(x, z)), 1.3, I0, PALE, 3);
  }
  // the release arc, dashed, and the payload running it
  const ur = clamp((fl - DCLK.arc0) / (DCLK.arc1 - DCLK.arc0));
  if (ur > 0) {
    const m = Math.floor(ur * 32);
    for (let i = 0; i < m; i++) if (i % 3 !== 2) seg(Pp(...ARCPTS[i]), Pp(...ARCPTS[i + 1]), 1.3, I0 * 0.95, [1.2, 0.72, 0.4], 3.5);
    if (ur < 1) tips.push({ p: Pp(...ARCPTS[m]) });
  }
  const up = clamp((fl - DCLK.pay0) / (DCLK.pay1 - DCLK.pay0));
  if (up > 0 && up < 1) { const q = bez(...ARC, Math.pow(up, 0.7)), p = Pp(q[0], q[1]); lines.push([...p, ...p, 4.2, I0 * 2.2, ...HOT, 7]); }
  return fade;
}
// the ground the diagram needs: its table in the foreground and the release arc's corridor
const ARCLAT = ARCPTS;
function onTable(x, z) {
  if (z > 10.6 && z < 19.9 && x > -16 && x < X_TIP + 1.6) return true;
  for (const [ax, az] of ARCLAT) if (Math.hypot(x - ax, z - az) < 1.3) return true;
  return false;
}

// ---------------------------------------------------------------- the crowd: thousands
// the drafting ring round the base (the beams come from them), and the sea: rows across the camera's
// wedge to the horizon, spacing growing with depth, each arriving (a flash, a hop) as the crowd's
// front, racing outward from the base (exponential in the radius), passes it; none stands in front
// of the platform, and none on the diagram's table.
const CLAWD_W = CLAWD_U * 18;
const RING = (() => {
  const out = [];
  for (let i = 0; out.length < 44 && i < 600; i++) {
    const a = 2 * Math.PI * hash(i, 1), r = 3.2 + 4.2 * Math.sqrt(hash(i, 2));
    const x = AXIS[0] + r * Math.cos(a), z = AXIS[2] + r * Math.sin(a);
    const p = project(B3, [x, 0.3, z]);
    if (p[2] < 11 || p[0] < 60 || p[0] > 1860) continue;
    if (p[2] < D + 2 && Math.abs(p[0] - PPX) < 250 + 0.5 * F3 * CLAWD_W / p[2]) continue;
    if (out.some((o) => Math.hypot(o.x - x, o.z - z) < 0.8)) continue;
    const [lx, lz] = lat([x, 0, z]);
    out.push({ x, z, ph: hash(i, 3), back: hash(i, 4), table: onTable(lx, lz) });
  }
  return out;
})();
const FRONT = [[0, 7.5], [34, 28], [70, 170], [96, 900]];
const bornAt = (r) => {
  for (let i = 1; i < FRONT.length; i++) if (r <= FRONT[i][1]) { const [a, ra] = FRONT[i - 1], [b, rb] = FRONT[i]; return a + (b - a) * Math.log(Math.max(r, ra) / ra) / Math.log(rb / ra); }
  return 1e9;
};
const SEA = (() => {
  const out = [];
  let z = 12.5, row = 0;
  while (z < 620) {
    const s = Math.max(2.0, 0.05 * z), half = 0.8 * z, n = Math.floor(2 * half / s), ph = hash(row, 40);
    for (let k = 0; k <= n; k++) {
      const xl = -half + (k + ph + 0.9 * (hash(row, k, 41) - 0.5)) * s, zl = z + 0.6 * (hash(row, k, 42) - 0.5) * s;
      const x = B3.pos[0] + B3.fw[0] * zl + B3.right[0] * xl, zz = B3.pos[2] + B3.fw[2] * zl + B3.right[2] * xl;
      const r = Math.hypot(x - AXIS[0], zz - AXIS[2]);
      if (r < 7.6) continue;                                   // the ring's ground
      if (zl < D + 3 && Math.abs(F3 * xl / zl) < 250 + 0.5 * F3 * CLAWD_W / zl) continue;   // the lane
      out.push({ x, z: zz, ph: hash(row, k, 43), born: bornAt(r) + 3 * (hash(row, k, 44) - 0.5), r, table: onTable(xl, zl) });
    }
    z += s; row++;
  }
  return out;
})();

// ---------------------------------------------------------------- the code on the flat
// Rows of elevatorlines.js lying on the ground across the view, sized to read (about 16 px capitals
// near the table, smaller toward the horizon), each streaming toward the anchor from both sides
// (1.4 characters a frame) and fading into it, from the table's back edge to the horizon.
const CODE_COL = [1.0, 0.42, 0.17];
let ATLAS = null;
const ROWS = (() => {
  const out = [], hF = F3 * CAM_Y;
  let z = 20.2, i = 0;
  while (z < 75) {
    const rowPx = 30 * Math.pow(13 / z, 0.8), gh = rowPx * z * z / hF;
    out.push({ z, gh, rowPx, start: Math.floor(hash(i, 91) * 997), h0: 2.0 + 6 * hash(i, 92) });
    z += gh * 1.3; i++;
  }
  return out;
})();
function codeQuads(fl) {
  const quads = [], t = fl / 30;
  for (const r of ROWS) {
    const a0 = 1;
    const gw = r.rowPx * (ATLAS.adv / ATLAS.rowH) * r.z / F3, v = 1.4 * 30 * gw;
    const u1 = r.z * 0.72 + 2, alpha = (u) => a0 * 0.55 * smoothstep(1.8, 4.2, u);
    for (const side of [1, -1]) {
      streamQuads(quads, ATLAS, {
        path: (u) => G(side * u, r.z), top: (u) => G(side * u, r.z + r.gh), read: side, head: r.h0 - v * t,
        u0: 1.5, u1, gw, start: r.start + (side > 0 ? 0 : 57), gap: 5, chunk: 8, alpha, col: CODE_COL,
      });
    }
  }
  return quads;
}

// ---------------------------------------------------------------- render
let hill, cvH, g2, W, H, K;
function insideFrame(ctx, fr) {
  const { T } = ctx, f = fr.f, fl = fr.fl;
  const p = progress(fl);
  const chop = T.pulse('chops', f, 6), snare = T.pulse('snares', f, 5);
  const dark = f >= DARK;
  const lines = [], tips = [];
  const fin = smoothstep(0.97, 1.0, p);
  for (const s of STROKES) {
    const r = clamp((p - s.t0) / (s.t1 - s.t0));
    if (r <= 0) continue;
    const Lr = r * s.L[s.L.length - 1];
    const fresh = r < 1 ? 1 : Math.exp(-(p - s.t1) * 40);
    const I = s.I * (dark ? 1.25 : 0.75 + 0.8 * fresh + 0.25 * fin + 0.1 * snare) * (s.part === 'sails' ? 1 + 0.4 * chop : 1);
    const c = !dark && fresh > 0.35 ? HOT : WARM, w = 1.5 * s.w * (dark ? 1.15 : 1), glow = 3.4 + 1.8 * fresh + (s.part === 'sails' ? 1.5 : 0);
    for (let i = 1; i < s.pts.length; i++) {
      if (s.L[i - 1] >= Lr) break;
      const A = s.pts[i - 1], B0 = s.pts[i], t = Math.min(1, (Lr - s.L[i - 1]) / (s.L[i] - s.L[i - 1] || 1));
      const Bp = [lerp(A[0], B0[0], t), lerp(A[1], B0[1], t), lerp(A[2], B0[2], t)];
      lines.push([...A, ...Bp, w, I, c[0], c[1], c[2], glow]);
      if (t < 1 && r < 1) tips.push({ p: Bp, part: s.part });
    }
  }
  const cam = camAt(fl), B = camBasis(cam);
  const crowd = [];
  let decals = null;
  if (!dark) {
    const dtips = [];
    diagram(fl, T, f, lines, dtips);
    // the drafting ring: a third drafting at a time, each with a beam to a live tip (the diagram's
    // while it is being drawn, for every other one), trading on the snares; when the drawing is done
    // they step back from it
    const rot = T.events('snares').filter((x) => x <= f).length;
    const back = smoothstep(104, 122, fl);                          // stepping back (72.2-72.3)
    const sinceS = T.since('snares', f);
    const lookAt = (sx, tx) => (tx - sx > 50 ? 1 : tx - sx < -50 ? -1 : 0);
    const axisX = project(B, [AXIS[0], 4, AXIS[2]])[0];
    RING.forEach((c, i) => {
      if (c.table) return;
      const pool = dtips.length && i % 2 ? dtips : tips;
      const drafting = pool.length && (i + rot) % 3 === 0 && back < 0.5;
      const dx = c.x - AXIS[0], dz = c.z - AXIS[2], dl = Math.hypot(dx, dz) || 1;
      const x = c.x + (dx / dl) * 1.6 * back * (0.6 + 0.8 * c.back), z = c.z + (dz / dl) * 1.6 * back * (0.6 + 0.8 * c.back);
      const tip = drafting ? pool[(i * 7 + rot * 3) % pool.length].p : null;
      if (tip) lines.push([x, 0.32, z, ...tip, 0.8, 0.5 + 0.7 * chop, ...HOT, 2.4]);
      const hop = 0.06 * Math.max(0, Math.sin(Math.PI * clamp((sinceS - 3 * c.ph) / 7)));
      const sp = project(B, [x, 0.3, z]);
      crowd.push({ x, z, form: 'luminous', hop, glow: 0.95 + 0.3 * chop + (drafting ? 0.2 : 0), eyeLight: 0.4 + 0.4 * chop,
        look: lookAt(sp[0], tip ? project(B, tip)[0] : axisX), armL: drafting ? -2 : 0, armR: drafting ? -2 : 0 });
    });
    // the sea: each arrives in a flash and a hop, then hops on the snares with the rest
    for (const c of SEA) {
      const age = fl - c.born;
      if (age < 0 || c.table) continue;
      const sp = project(B, [c.x, 0.3, c.z]);
      if (sp[2] < 1 || sp[1] > 1130 || sp[1] < -60 || sp[0] < -120 || sp[0] > 2040) continue;
      const hop = 0.14 * Math.max(0, Math.sin(Math.PI * clamp(age / 7))) + 0.05 * Math.max(0, Math.sin(Math.PI * clamp((sinceS - 3 * c.ph) / 7)));
      crowd.push({ x: c.x, z: c.z, form: 'luminous', hop, alpha: clamp(age / 3), glow: 0.95 + 2.2 * Math.exp(-age / 5) + 0.25 * chop * (c.ph < 0.3 ? 1 : 0),
        eyeLight: 0.4 + 0.4 * chop, look: lookAt(sp[0], axisX) });
    }
    // the night's stars, and the two stars (A and B) out beyond the tether
    starLines(lines, fr.t, 1);
    for (const [S, k, w] of [[SA, 1.0, 3.6], [SB, 0.74, 3.0]]) lines.push([...S, ...S, w, k * 0.75, 0.96, 0.97, 1.0, 6]);
    if (ATLAS) decals = { src: ATLAS.canvas, key: ATLAS.key, quads: codeQuads(fl) };
  }
  hill.render(Object.assign({}, WORLD, {
    rung: 4, time: 112 + fr.tl, cam: dark ? CAM3 : cam, clawd: null, crowd, lines, decals,
    dim: dark ? [0, 0, 0] : [0.8, 0.8, 0.8], palLin: worldPal(1), grid: 0.04, lineDepth: dark ? 0 : 1,
  }));
  return cvH;
}
export default {
  async setup(ctx) {
    W = ctx.W; H = ctx.H; K = W / 1920; g2 = ctx.canvas.getContext('2d');
    cvH = document.createElement('canvas'); cvH.width = W; cvH.height = H;
    hill = createHill(cvH, { log: ctx.log, seeding: { origin: [CAM3.pos[0] + 5 * Math.sin(CAM3.yaw), CAM3.pos[2] + 5 * Math.cos(CAM3.yaw)], yaw: CAM3.yaw, halfAngle: 0.8, d0: 1.0, d1: 140, nearTree: 40, nearTower: 95, fref: F3 } });
    hill.warm([4]);
    const code = await readCode(['/sets/paper-kit/elevatorlines.js'], ctx.log);
    ATLAS = code.length ? codeAtlas(code, { px: 40 }) : null;
    if (!ATLAS) ctx.log('S27: WARNING no code on the flat (elevatorlines.js unreadable)');
    ctx.log(`S27: strokes ${STROKES.length}, ring ${RING.length} (${RING.filter((c) => c.table).length} kept off the table), sea ${SEA.length} (${SEA.filter((c) => c.table).length}), code ${code.length} lines in ${ROWS.length} rows, GEO at x ${X_GEO.toFixed(2)}, escape ${X_ESC.toFixed(2)}, tip ${X_TIP.toFixed(2)}, camera y ${CAM_Y.toFixed(2)} m, frames ${F0}-${FL}, dark from ${DARK}`);
  },
  render(ctx, fr) {
    g2.drawImage(insideFrame(ctx, fr), 0, 0, W, H);
  },
};
