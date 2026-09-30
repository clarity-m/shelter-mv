// S22, verse 2b (bars 58-59, frames 4115-4258; revision 5: a bar earlier), rung 4: Clawd reroutes a river
// through his valley, and lines of light are laid along it. In quick motion he trots a line across
// the low meadow in front of his hill, left to right, and the painted water follows him along it
// (the fork's `river` option): a narrow tongue at his heels that widens behind him into a broad river.
// Revision 3: S20's light follows the water a beat behind it (the fork's `lines`): a line along each
// bank, hot at the tip being drawn and settling warm, meeting at the water's tongue; then on the
// beats of bar 59 four clean risers branch up off the far bank's line and a cross line joins them,
// like a grid being laid. Over the last beats the world dims toward night under the lines.
// Revision 7: on the last beat a current of light starts along the far bank's line from the left
// (`current`, exported), foreshadowing S23's run; S24 continues this frame's state and the current.
// The match (sets/paper-kit/MATCH.md, S23): in the last frame, through the resting camera, the far
// bank's line lies on y 722.5 edge to edge, the water's far edge on y 733 and its near edge on 977,
// the risers stand at x 1039, 1177, 1345 and 1479 from the line up to y 622, and the cross line
// runs at y 662. The river's visible reach is fitted to those rows, and every mark is placed by
// casting its screen point back into the world through that camera.
// Clawd acts in the sprite canon's poses (exact cells; style-frames/05-clawd-sprites): a walk
// cycle with his eyes forward, glances back at the water on the sung onsets, a skip of joy.
// Two angles, a hard cut on the bar-59 downbeat (4187):
//   bar 58  a long lens from the front, high enough to see the river wind in from a trickle on the
//           left; he crosses the frame, easing right with him.
//   bar 59  lower, across the broad reach. He slows and stops at the right, looks back as the water
//           catches up to his feet, hops twice with joy (arms up, happy eyes), then turns and trots
//           off to the right, the river after him. The frame settles on the finished river and its
//           lines, laid out on S23's paper river and grid (sets/paper-kit/MATCH.md) for the match
//           dissolve into it.
// The valley: the hill set's terrain plus a broad, low apron (a fourth bump), so the river runs on
// grass and the environment's reflective floor stays in the distance.
import { createHill } from '../sets/inside-montage/hillx.js';
import { look, lerpCam } from '../sets/inside-montage/crowd.js';
import { polyline, drawPolyline } from '../sets/inside-montage/draw.js';
import { HILL, hillH, camBasis, project, rayDir } from '../sets/hill/scene.js';
import { clamp, lerp, smoothstep } from '../lib/util.js';

const F0 = 4115, CUT = 4187, N = 144, FL = F0 + N - 1;
const TERRAIN = HILL.concat([[0.22, 0, 9, 16, 12]]);
// the line he walks (x, z, half width): in from the left as a trickle, a broad straight reach in
// front of the hill, and away to the right
const PATH = [
  // fitted (see the header) so that through the resting camera the far edge lies on y 733 and, where
  // it is in frame, the near edge on y 977
  [-14.0, 2.6, 0.3], [-11.8, 3.3, 0.8], [-9.2, 4.0, 2.0], [-7.0, 4.04, 2.2], [-4.8, 3.18, 2.4], [-2.6, 2.8, 2.36],
  [-0.4, 2.66, 2.23], [1.8, 2.58, 2.15], [4.0, 2.82, 2.37], [6.2, 3.08, 2.68], [8.4, 4.1, 2.4], [10.6, 5.07, 2.2],
  [13.2, 6.0, 1.8], [16.4, 7.4, 1.3],
];
const ARC = (() => { const a = [0]; for (let i = 1; i < PATH.length; i++) a.push(a[i - 1] + Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1])); return a; })();
const LEN = ARC[ARC.length - 1];
function seg(s) { s = clamp(s, 0, LEN - 1e-3); let i = 0; while (ARC[i + 1] < s) i++; return [i, (s - ARC[i]) / (ARC[i + 1] - ARC[i])]; }
function along(s) {                      // point on the path at arc length s
  const [i, t] = seg(s), A = PATH[i], B = PATH[i + 1];
  return [lerp(A[0], B[0], t), lerp(A[1], B[1], t)];
}
// the path's left normal (toward the far bank), eased across each vertex so offsets stay smooth
const NRM = PATH.slice(1).map((B, i) => { const A = PATH[i], l = Math.hypot(B[0] - A[0], B[1] - A[1]); return [-(B[1] - A[1]) / l, (B[0] - A[0]) / l]; });
function normalAt(s) {
  const [i, t] = seg(s), L = ARC[i + 1] - ARC[i], d0 = t * L, d1 = (1 - t) * L, R = 0.9;
  let n = NRM[i];
  if (i > 0 && d0 < R) { const w = 0.5 * (1 - d0 / R); n = [lerp(n[0], NRM[i - 1][0], w), lerp(n[1], NRM[i - 1][1], w)]; }
  if (i < NRM.length - 1 && d1 < R) { const w = 0.5 * (1 - d1 / R); n = [lerp(n[0], NRM[i + 1][0], w), lerp(n[1], NRM[i + 1][1], w)]; }
  const l = Math.hypot(n[0], n[1]); return [n[0] / l, n[1] / l];
}
const halfW = (s) => { const [i, t] = seg(s); return lerp(PATH[i][2], PATH[i + 1][2], t); };
const ease = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);

// ---------------------------------------------------------------- the match frame
// The resting camera of bar 60 (the match frame): every mark of MATCH.md is cast back through it.
const REST = look([1.6, 2.7, -6.6], [1.6, 0.2, 6.0], 1400, [960, 760]), RB = camBasis(REST);
const LIFT = 0.03;                                          // the lines ride just above the grass
function cast(sx, sy, dy = LIFT) {                          // screen point -> the terrain (+dy) under it
  const d = rayDir(RB, sx, sy), o = REST.pos;
  const g = (t) => o[1] + d[1] * t - (hillH(TERRAIN, o[0] + d[0] * t, o[2] + d[2] * t) + dy);
  for (let t = 0.3; t < 200; t += 0.05) {
    if (g(t) < 0) { let lo = t - 0.05, hi = t; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (g(m) > 0) lo = m; else hi = m; } const tt = (lo + hi) / 2; return [o[0] + d[0] * tt, o[1] + d[1] * tt, o[2] + d[2] * tt]; }
  }
  return null;
}
// the point on the ray through (sx, sy) at the camera depth of world point p (so a segment from p to
// it stands exactly upright on screen)
function atDepth(sx, sy, p) {
  const d = rayDir(RB, sx, sy), o = REST.pos, z = (p[0] - o[0]) * RB.fw[0] + (p[1] - o[1]) * RB.fw[1] + (p[2] - o[2]) * RB.fw[2];
  const t = z / (d[0] * RB.fw[0] + d[1] * RB.fw[1] + d[2] * RB.fw[2]);
  return [o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t];
}
const M = { line: 722.5, water: 733, risers: [1039, 1177, 1345, 1479], top: 622, cross: 662 };

// the arc length (on the river) nearest a world point
function arcOf(p) {
  let best = 1e9, sb = 0;
  for (let i = 0; i + 1 < PATH.length; i++) {
    const A = PATH[i], Bv = PATH[i + 1], ax = Bv[0] - A[0], az = Bv[1] - A[1], L2 = ax * ax + az * az;
    const t = clamp(((p[0] - A[0]) * ax + (p[2] - A[1]) * az) / L2), qx = A[0] + ax * t, qz = A[1] + az * t;
    const d = Math.hypot(p[0] - qx, p[2] - qz);
    if (d < best) { best = d; sb = ARC[i] + t * Math.sqrt(L2); }
  }
  return sb;
}
// ---------------------------------------------------------------- where he is, where the water is
// (revision 3: he stops just past the last riser's root on the far bank, so the water has reached
// all four roots while he hops; the trot of bar 59 keeps its speed and simply ends there)
// (revision 5: re-keyed to bar 59's sung onsets: he stops, hops as the 4209 onset lands, goes on)
const T_STOP = 4200, T_GO = 4223;                        // bar 59: slows to a stop, then goes on
const S_STOP = arcOf(cast(M.risers[3], M.line)) + 0.45;
const V0 = 16.5 / 2.4, S_CUT = S_STOP - V0 * ((T_STOP - CUT) / 30) / 2, S0 = S_CUT - V0 * 2.4;   // bar 58: a steady 6.9 m/s trot
function motion(f) {
  if (f < F0) return { s: S0, head: -1, moving: true };
  if (f < CUT) { const s = S0 + V0 * (f - F0) / 30; return { s, head: s - 1.4, moving: true }; }
  if (f < T_STOP) {
    const tau = (f - CUT) / 30, T = (T_STOP - CUT) / 30;
    const s = S_CUT + V0 * (tau - tau * tau / (2 * T));
    return { s, head: s - 1.4, moving: true };
  }
  if (f < T_GO) return { s: S_STOP, head: S_STOP - 1.4 + 1.1 * easeOut((f - T_STOP) / 10), moving: false };
  const tau = (f - T_GO) / 30, s = S_STOP + (tau < 0.5 ? 10 * tau * tau : 2.5 + 10 * (tau - 0.5));
  return { s, head: s - 0.3 - 1.1 * ease(tau / 0.45), moving: true };
}

// ---------------------------------------------------------------- the lines of light
// The bank lines follow the water a beat behind it (18 frames), closing to a few frames as he stops
// in bar 59, so by the last frame they run the whole visible reach. Each hugs its bank just outside
// the water, and the two meet where the water's tongue narrows. The far line's margin is solved per
// point so that, through the resting camera, it lies on y 722.5 (it defaults to 0.12 m off screen).
const lag = (f) => lerp(18, 4, smoothstep(4190, 4224, f));
const lineHead = (f) => motion(f - lag(f)).head;
const MARGIN = 0.12, STEP = 0.3;
const FAR_M = (() => {
  const m = [];
  for (let s = 0; s <= LEN + 1e-6; s += STEP) {
    const [x, z] = along(s), n = normalAt(s), hw = halfW(s);
    const at = (k) => { const px = x + n[0] * (hw + k), pz = z + n[1] * (hw + k); return project(RB, [px, hillH(TERRAIN, px, pz) + LIFT, pz]); };
    const p0 = at(MARGIN);
    if (p0[2] <= 0 || p0[0] < -120 || p0[0] > 2040) { m.push(null); continue; }
    let lo = -0.2, hi = 0.8;                                 // y falls as the margin grows (farther up the bank)
    for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (at(mid)[1] > M.line) lo = mid; else hi = mid; }
    m.push((lo + hi) / 2);
  }
  // off screen: ease from the solved margins back to the default over a few samples
  const out = m.map((v) => v ?? MARGIN);
  for (let pass = 0; pass < 6; pass++) for (let i = 0; i < m.length; i++) if (m[i] === null) out[i] = (out[Math.max(0, i - 1)] + out[Math.min(out.length - 1, i + 1)] + out[i]) / 3;
  return out;
})();
function bankPolyline(side, head, water) {
  const pts = [];
  for (let s = 0; ; s += STEP) {
    const sc = Math.min(s, head);
    const [x, z] = along(sc), n = normalAt(sc), hw = halfW(sc);
    const tongue = ease((water - sc + 0.25) / (1.65 + 0.8 * hw));
    const k = side > 0 ? FAR_M[Math.min(FAR_M.length - 1, Math.round(sc / STEP))] : MARGIN;
    const off = side * (hw + k) * Math.max(tongue, 0.02);
    const px = x + n[0] * off, pz = z + n[1] * off;
    pts.push([px, hillH(TERRAIN, px, pz) + LIFT, pz]);
    if (sc >= head) break;
  }
  return polyline(pts);
}
// The risers: once the far line has passed its root, each stands up off it on a beat of bar 59,
// upright on screen from y 722.5 to 622; the cross line then joins them at y 662, left to right.
const RISERS = M.risers.map((sx, k) => {
  const root = cast(sx, M.line), top = atDepth(sx, M.top, root);
  return { sx, root, top, s: arcOf(root), beat: [4205, 4214, 4223, 4241][k], pl: polyline([root, top]) };
});
const CROSS = { pl: polyline(RISERS.map((r) => atDepth(r.sx, M.cross, r.root))), dur: 12 };
const LINE = { w: 1.6, I: 0.95, hotI: 1.0, glow: 3.4, hotGlow: 2.2, fresh: 1.4 };
// the first frame the far line's tip has passed arc length s (a riser never starts ahead of it)
const ROOT = new Map();
function rootFrame(s) {
  if (!ROOT.has(s)) { let f = F0; while (f < FL + 40 && lineHead(f) < s + 0.1) f++; ROOT.set(s, f); }
  return ROOT.get(s);
}
RISERS.forEach((r) => { r.t0 = Math.max(r.beat, rootFrame(r.s)); });
CROSS.t0 = Math.max(4242, RISERS[3].t0 + 2);

function lightLines(f) {
  const out = [];
  const head = lineHead(f), water = motion(f).head;
  // near the end the match lines thicken a little (S23's are about 3 px); the near bank's line stays
  // lit too (S23 has its twin at y 978.5 since MATCH.md's 14:44 change)
  const fin = smoothstep(4228, FL, f);
  const L = Object.assign({}, LINE, { w: 1.6 + 0.6 * fin });
  if (head > 0.05) {
    // each bank line runs hot at its tip, a spark drawing it a beat behind the water
    for (const side of [1, -1]) {
      const pl = bankPolyline(side, head, water);
      const tip = drawPolyline(out, pl, pl.len, L);
      if (tip && head < LEN - 0.5) out.push([...tip, ...tip, 2.6, 1.4, 1.0, 0.95, 0.86, 5]);
    }
  }
  // (hot while being drawn, then settling warm over a few frames, as S20's edges do)
  const grow = (pl, t0, dur) => {
    const r = clamp((f - t0) / dur);
    if (r <= 0) return;
    const settle = r < 1 ? 1 : Math.exp(-(f - t0 - dur) / 6);
    drawPolyline(out, pl, pl.len * easeOut(r), Object.assign({}, L, { spark: r < 1 ? 1.3 : 0, fresh: 0.5, settle }));
  };
  for (const r of RISERS) grow(r.pl, r.t0, 7);
  grow(CROSS.pl, CROSS.t0, CROSS.dur);
  return out;
}
// revision 7: the current. A pulse of light runs along the far bank's line from the left edge at
// 44 px a frame (screen x through the resting camera), starting on the last beat of bar 59; it
// reaches the risers at 1039, 1177, 1345 and 1479 in S24's first beats. Each point is cast onto the
// land under the line, so it rides the line exactly.
export const CURRENT = { f0: 4241, x0: -61, v: 44 };
export const currentX = (f) => CURRENT.x0 + CURRENT.v * (f - CURRENT.f0);
export function current(f, out = []) {
  if (f < CURRENT.f0) return out;
  const xh = currentX(f);
  if (xh - 200 > 1990) return out;
  let prev = null;
  for (let k = 0; k <= 20; k++) {
    const x = xh - 200 + 10 * k;                              // a tail 200 px long, brightening to the head
    if (x < -40 || x > 1990) { prev = null; continue; }
    const p = cast(x, M.line, LIFT + 0.01);
    if (prev) { const t = k / 20; out.push([...prev, ...p, 1.8 + 1.4 * t, 0.3 + 1.9 * t * t, 1.0, 0.92, 0.8, 3 + 5 * t]); }
    prev = p;
  }
  if (xh > -30 && xh < 1960) { const p = cast(xh, M.line, LIFT + 0.01); out.push([...p, ...p, 4.2, 2.2, 1.0, 0.95, 0.86, 9]); }
  return out;
}

// ---------------------------------------------------------------- how he moves (sprite canon)
const LEGS = { spread: [4.5, 6.5, 11.5, 13.5], pass: [5.5, 6.5, 12.5, 13.5], apex: [3.5, 5.5, 12.5, 14.5] };
// walk: spread, pass A, spread, pass B at 15 fps, the arms swinging on the passes
function walkPose(f) {
  const k = Math.floor((f - F0) / 2) % 4;
  if (k % 2 === 0) return { legs: LEGS.spread, armL: 0, armR: 0, bob: 0 };
  return { legs: LEGS.pass, armL: k === 1 ? -1 : 1, armR: k === 1 ? 1 : -1, bob: 0.025 };
}
// a hop of joy starting at frame h0: arms up, happy eyes, legs spread in the air
function joyHop(f, h0, len = 9) {
  const t = (f - h0) / len;
  if (t < 0 || t >= 1) return null;
  const air = t > 0.12 && t < 0.88;
  return { hop: 0.2 * Math.sin(Math.PI * t), armL: -2, armR: -2, arch: true, legs: air ? LEGS.apex : LEGS.spread };
}
const GLANCES = [[4130, 4139], [4143, 4150]];              // looks back at the water (bar 58's sung onsets)
const SKIP = 4171;                                         // bar 58, beat 4: a skip of joy
const HOPS = [4207, 4216];                                 // bar 59: two hops as the water reaches him (sung 4209)
function pose(f, moving) {
  let p;
  const j = joyHop(f, SKIP) || joyHop(f, HOPS[0]) || joyHop(f, HOPS[1]);
  if (j) p = Object.assign({ look: 0 }, j);
  else if (moving) {
    const w = walkPose(f);
    const back = GLANCES.some(([a, b]) => f >= a && f < b);
    p = { look: back ? -1 : 1, legs: w.legs, armL: w.armL, armR: w.armR, hop: w.bob, arch: false };
  } else {
    // stopped: turned to watch the water come to his feet
    p = { look: -1, legs: LEGS.spread, armL: 0, armR: 0, hop: 0, arch: false };
  }
  return p;
}

// ---------------------------------------------------------------- cameras
// bar 58: a long lens from the front, easing right with him
const A59 = [look([-6.5, 5.2, -11.0], [-4.2, 0.6, 4.0], 1450, [960, 560]), look([-5.6, 5.1, -10.6], [-3.0, 0.6, 4.2], 1450, [960, 560])];
// bar 59: across the broad reach, settling on the match frame for S23 (at rest from 4246)
const A60 = [look([1.1, 2.8, -7.0], [1.4, 0.2, 6.0], 1400, [960, 760]), REST];
const camAt = (f) => (f < CUT ? lerpCam(A59[0], A59[1], ease((f - F0) / (CUT - F0))) : lerpCam(A60[0], A60[1], easeOut((f - CUT) / (4246 - CUT))));

// each angle paints with its own stroke lattice, laid around its own camera (the polar lattice is
// only dense enough where its origin is nearer than the camera: 5 m ahead of it), so two hill instances
const seedAt = (a) => ({ origin: [a.pos[0] + 5 * Math.sin(a.yaw), a.pos[2] + 5 * Math.cos(a.yaw)], yaw: a.yaw, halfAngle: 1.1, d0: 1.0, d1: 140, nearTree: 14, nearTower: 95 });

// revision 4: the painted-valley look (hillx's rung 4), a fifth of the way toward the shelter's palette
const DRIFT = 0.2;
// the world dims toward night over the last beats (the lines stay full), into S23's night
const DIM_END = [0.36, 0.39, 0.58];
const dimAt = (f) => { const k = smoothstep(4226, FL, f); return [lerp(1, DIM_END[0], k), lerp(1, DIM_END[1], k), lerp(1, DIM_END[2], k)]; };

// (revision 7: S24 continues from this shot's last frame)
export { TERRAIN, PATH, REST, cast, atDepth, M, LIFT, motion, lightLines, dimAt, seedAt, FL as S22_LAST, F0 as S22_FIRST };

let h59, h60, c59, c60, g2, W, H;
export default {
  async setup(ctx) {
    W = ctx.W; H = ctx.H; g2 = ctx.canvas.getContext('2d');
    c59 = document.createElement('canvas'); c59.width = W; c59.height = H;
    c60 = document.createElement('canvas'); c60.width = W; c60.height = H;
    h59 = createHill(c59, { log: ctx.log, seeding: seedAt(A59[0]) }); h59.warm([4]);
    h60 = createHill(c60, { log: ctx.log, seeding: seedAt(A60[1]) }); h60.warm([4]);
    ctx.log(`S22: risers ${RISERS.map((r) => `x${r.sx} s${r.s.toFixed(2)} t0 ${r.t0}`).join(', ')}; cross t0 ${CROSS.t0}; stop s ${S_STOP.toFixed(2)}`);
  },
  render(ctx, fr) {
    const { T } = ctx, f = fr.f;
    const m = motion(f), [px, pz] = along(m.s), p = pose(f, m.moving);
    const vox = T.envSmooth('vocals', f, 4), sung = T.pulse('sung', f, 8);
    const [hill, cv] = f < CUT ? [h59, c59] : [h60, c60];
    hill.render({
      rung: 4, time: 70 + fr.tl, cam: camAt(f), hill: TERRAIN, fog: 0.009, drift: DRIFT,
      tree: { x: -4.1, z: 9.2, grow: 1 },
      clawd: {
        x: px, z: pz, form: 'luminous', hop: p.hop, look: p.look, legs: p.legs, armL: p.armL, armR: p.armR, arch: p.arch,
        glow: 1.0 + 0.1 * (vox - 0.5) + 0.12 * sung + (p.arch ? 0.15 : 0), eyeLight: 0.5 + 0.3 * sung, light: 1.15,
      },
      river: { pts: PATH, head: m.head, flow: 70 + fr.tl },
      lines: current(f, lightLines(f)), dim: dimAt(f),
    });
    g2.drawImage(cv, 0, 0, W, H);
  },
};
