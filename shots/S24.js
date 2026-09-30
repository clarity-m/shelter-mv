// S24, verse 2b (bars 60-61, frames 4259-4402), rung 4 (revision 7): the grid becomes a town.
// S24 continues S22's view without a cut: the same resting camera, the river and its lines, the four
// risers and the cross line exactly as S22 left them (S22.js exports its end state). The current S22
// started runs on along the far bank's line; as it reaches each riser it climbs it, and the riser
// grows up into a slender tower of light: its wall rises to the tower's roofline, the roof is drawn
// across and the far wall comes down to the bank (with its rooftop: a setback, a spire, an antenna,
// a setback). On bar 60's sung onsets the lower buildings between them are drawn in more softly, and
// through bar 61 the windows warm, building by building, while the world goes toward night. Clawd
// trots back in from the right along the near bank, stops, raises an arm toward his town and
// watches with joy (the sprite canon's poses, kept from S24's acting: the wave, looking up, hops,
// content, wonder).
// The last frame puts the towers and lines on S23's paper district (sets/paper-kit/MATCH.md: the
// buildings on the four risers, through S23's opening camera, which is S22's resting camera's twin);
// S23 opens with a 12-frame dissolve from it.
import { createHill } from '../sets/inside-montage/hillx.js';
import { polyline, drawPolyline, WARM, HOT } from '../sets/inside-montage/draw.js';
import { nightPal } from '../sets/inside-montage/night.js';
import { act } from '../sets/hill/clawd-pose.js';
import { hillH, camBasis } from '../sets/hill/scene.js';
import { TERRAIN, PATH, REST, cast, atDepth, M, LIFT, motion, lightLines, dimAt, seedAt, current, currentX, S22_LAST, S22_FIRST } from './S22.js';
import { clamp, lerp, smoothstep } from '../lib/util.js';

const F0 = 4259, N = 144, FL = F0 + N - 1, BAR2 = 4331;
const ease = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);

// ---------------------------------------------------------------- the town (MATCH.md, S23's district)
// screen px through the resting camera: walls [x0, x1], wall top, the rooftop; `riser` is the wall
// the tower grows from (a tower's twin is the taller building at each riser)
const LINE_Y = M.line;
const TOWERS = [
  { x0: 1038.5, x1: 1126.5, top: 430, riser: 1039, side: 1, roof: { kind: 'block', x0: 1056, x1: 1109, top: 398 } },
  { x0: 1176.5, x1: 1252.5, top: 330, riser: 1177, side: 1, roof: { kind: 'spire', x: 1214.5, w: 4, tip: 263 } },
  { x0: 1344.5, x1: 1402.5, top: 400, riser: 1345, side: 1, roof: { kind: 'antenna', x: 1386, tip: 366 } },
  { x0: 1400.5, x1: 1480.5, top: 520, riser: 1479, side: -1, roof: { kind: 'block', x0: 1416.5, x1: 1464.5, top: 495 } },
];
const LOWER = [
  { x0: 978.5, x1: 1040.5, top: 520, roof: { kind: 'tank', x0: 1003, x1: 1021, top: 500 }, t0: 4305 },
  { x0: 1124.5, x1: 1178.5, top: 560, roof: { kind: 'saw', n: 3, top: 550 }, t0: 4313 },
  { x0: 1250.5, x1: 1346.5, top: 470, roof: { kind: 'dome', cx: 1298.5, hw: 31, top: 452 }, t0: 4305 },
  { x0: 1478.5, x1: 1538.5, top: 580, roof: { kind: 'saw', n: 3, top: 570 }, t0: 4323 },
];
// a building's facade stands on the far bank under its middle: every point of it is at that depth
const facade = (b) => { const base = cast((b.x0 + b.x1) / 2, LINE_Y, LIFT); return (sx, sy) => atDepth(sx, sy, base); };
// the tower's outline, in drawing order from the top of its riser (its wall up to the roofline, the
// roof across, the far wall down to the bank), then its rooftop
function towerPaths(b) {
  const P = facade(b), near = b.side > 0 ? b.x0 : b.x1, far = b.side > 0 ? b.x1 : b.x0;
  const wall = polyline([P(near, 622), P(near, b.top)]);
  const shell = polyline([P(near, b.top), P(far, b.top), P(far, LINE_Y)]);
  return { wall, shell, roof: roofPath(b.roof, P) };
}
function lowerPaths(b) {
  const P = facade(b);
  return { shell: polyline([P(b.x0, LINE_Y), P(b.x0, b.top), P(b.x1, b.top), P(b.x1, LINE_Y)]), roof: roofPath(b.roof, P) };
}
function roofPath(r, P) {
  if (r.kind === 'block') return [polyline([P(r.x0, r.top + (r.top < 420 ? 32 : 25)), P(r.x0, r.top), P(r.x1, r.top), P(r.x1, r.top + (r.top < 420 ? 32 : 25))])];
  if (r.kind === 'spire') return [polyline([P(r.x - 8, 330), P(r.x, r.tip), P(r.x + 8, 330)])];
  if (r.kind === 'antenna') return [polyline([P(r.x, 400), P(r.x, r.tip)])];
  if (r.kind === 'tank') return [polyline([P(r.x0, 520), P(r.x0, r.top), P(r.x1, r.top), P(r.x1, 520)])];
  if (r.kind === 'dome') {
    const pts = [];
    for (let k = 0; k <= 12; k++) { const a = Math.PI * k / 12; pts.push(P(r.cx - r.hw * Math.cos(a), 470 - (470 - r.top) * Math.sin(a))); }
    return [polyline(pts)];
  }
  if (r.kind === 'saw') return [];                            // (filled in per building below)
  return [];
}
const TW = TOWERS.map((b) => Object.assign({}, b, towerPaths(b)));
const LW = LOWER.map((b) => {
  const o = Object.assign({}, b, lowerPaths(b));
  if (b.roof.kind === 'saw') {
    const P = facade(b), w = (b.x1 - b.x0) / b.roof.n, pts = [];
    for (let k = 0; k < b.roof.n; k++) { pts.push(P(b.x0 + k * w, b.top)); pts.push(P(b.x0 + (k + 1) * w, b.roof.top)); pts.push(P(b.x0 + (k + 1) * w, b.top)); }
    o.roof = [polyline(pts)];
  }
  return o;
});
// the current reaches each riser (currentX, shared with S22), then climbs it at 16 px a frame
const CLIMB = 16;
TW.forEach((t) => {
  let f = 4241; while (currentX(f) < t.riser) f++; t.reach = f;
  t.upDur = Math.max(4, Math.round((622 - t.top) / CLIMB));
  t.shellDur = Math.max(6, Math.round(((t.x1 - t.x0) + (LINE_Y - t.top)) / 30));
});
// the windows: O's window grid on each building (12 x 15 px pitch, 5 x 7 px panes), a deterministic
// four in five of the slots, each lighting at its own moment in bar 61, building by building
const WIN_ORDER = [1, 5, 2, 7, 0, 3, 6, 4];                  // tower 0..3 = buildings 1, 3, 5, 6; lower 0..3 = 0, 2, 4, 7
const hashf = (a, b, c) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const WINDOWS = (() => {
  const all = [...TOWERS.map((b, i) => ({ b, id: [1, 3, 5, 6][i] })), ...LOWER.map((b, i) => ({ b, id: [0, 2, 4, 7][i] }))];
  const out = [];
  for (const { b, id } of all) {
    const P = facade(b), w = b.x1 - b.x0, nx = Math.max(1, Math.floor((w - 8) / 12)), ox = b.x0 + (w - (nx - 1) * 12 - 5) / 2;
    const order = WIN_ORDER.indexOf(id), t0 = BAR2 + 2 + order * 7;
    let j = 0;
    for (let y = b.top + 12; y < LINE_Y - 4; y += 15, j++) for (let i = 0; i < nx; i++) {
      if (hashf(id, i, j) > 0.8) continue;
      out.push({ p: P(ox + i * 12 + 2.5, y + 3.5), t: t0 + 18 * Math.pow(hashf(i, j, id + 9), 0.8), id });
    }
  }
  return out;
})();

// ---------------------------------------------------------------- the town's light at frame f
const LINE = { w: 2.0, I: 0.95, hotI: 1.0, glow: 3.4, hotGlow: 2.2, fresh: 0.5 };
function townLines(f, out) {
  const grow = (pl, t0, dur, k = 1) => {
    const r = clamp((f - t0) / dur);
    if (r <= 0) return false;
    const settle = r < 1 ? 1 : Math.exp(-(f - t0 - dur) / 6);
    drawPolyline(out, pl, pl.len * (r < 1 ? r : 1), Object.assign({}, LINE, { spark: r < 1 ? 1.3 : 0, settle, k }));
    return r >= 1;
  };
  for (const t of TW) {
    // the riser climbs to the roofline with the current, then the roof and the far wall are drawn
    if (!grow(t.wall, t.reach + 1, t.upDur)) continue;
    const s0 = t.reach + 1 + t.upDur;
    if (!grow(t.shell, s0, t.shellDur)) continue;
    for (const r of t.roof) grow(r, s0 + t.shellDur, 6);
  }
  for (const l of LW) {
    if (!grow(l.shell, l.t0, 14, 0.75)) continue;
    for (const r of l.roof) grow(r, l.t0 + 14, 6, 0.75);
  }
  // the windows warm (a small flare as each lights)
  for (const w of WINDOWS) {
    const r = f - w.t;
    if (r < 0) continue;
    const k = smoothstep(0, 5, r), fl = Math.exp(-r / 6);
    out.push([...w.p, ...w.p, 3.2 + 1.2 * fl, (0.75 + 0.9 * fl) * k, 1.0, 0.82, 0.55, 3.5 + 2 * fl]);
  }
  return out;
}

// the facades: as each outline closes, its face fills in with a dark, faintly warm glaze (the fork's
// `ribbons`, flat), so the town reads as solid towers against the hill and hides what stands behind
// it, as S23's paper buildings do; the lines and windows are drawn over it
const FACADES = [...TW.map((t) => ({ b: t, t0: () => t.reach + 1 + t.upDur + t.shellDur })), ...LW.map((l) => ({ b: l, t0: () => l.t0 + 14 }))].map((o) => {
  const P = facade(o.b), L0 = P(o.b.x0, LINE_Y), R0 = P(o.b.x1, LINE_Y), L1 = P(o.b.x0, o.b.top), R1 = P(o.b.x1, o.b.top);
  const mid = (a, c) => [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2];
  const side = [R0[0] - L0[0], R0[1] - L0[1], R0[2] - L0[2]], hw = Math.hypot(...side) / 2 * 1.04;
  return { P: [mid(L0, R0), mid(L1, R1)], S: [side, side], hw, t0: o.t0() };
});
function facadeRibbons(f, glowK) {
  const out = [];
  for (const q of FACADES) {
    const a = 0.86 * smoothstep(q.t0 - 2, q.t0 + 8, f);
    if (a <= 0.01) continue;
    const c = [0.012 + 0.03 * glowK, 0.011 + 0.018 * glowK, 0.024 + 0.012 * glowK];
    out.push({ P: q.P, S: q.S, w: [q.hw, q.hw], bb: [0, 0], col: c, a, seed: 0.2 });
  }
  return out;
}

// ---------------------------------------------------------------- Clawd: back along the near bank
const SPOT = { x: -0.3, z: -0.35 }, ENTER = { x: 7.4 }, T_IN = 4287;   // stops on the 4287 onset
const LEGS = { spread: [4.5, 6.5, 11.5, 13.5], pass: [5.5, 6.5, 12.5, 13.5] };
function walkPose(f) {
  const k = Math.floor((f - F0) / 2) % 4;
  if (k % 2 === 0) return { legs: LEGS.spread, armL: 0, armR: 0, bob: 0 };
  return { legs: LEGS.pass, armL: k === 1 ? -1 : 1, armR: k === 1 ? 1 : -1, bob: 0.025 };
}
// his acting from the stop (local frames from T_IN): the wave reaches toward his town (screen right,
// so not mirrored), he looks up at the towers, hops, watches, beams, and ends in wonder
const SCRIPT = {
  keys: [
    { at: 0, pose: 'determined' }, { at: 14, pose: 'lookUp' }, { at: 30, pose: 'right' }, { at: 44, pose: 'happy' },
    { at: 56, pose: 'right' }, { at: 70, pose: 'content' }, { at: 84, pose: 'right' }, { at: 99, pose: 'wonder' },
  ],
  hops: [{ at: 26, scale: 0.5 }, { at: 63, scale: 0.45 }, { at: 108, scale: 0.5 }],
  waves: [{ at: 0, len: 14, mirror: false }, { at: 36, len: 9, mirror: false }],
  blinks: [22, 52, 78, 92],
};
function clawdAt(f, vox, sung) {
  const base = { form: 'luminous', z: SPOT.z, light: 1.1, eyeLight: 0.5 + 0.3 * sung, glow: 1.0 + 0.1 * (vox - 0.5) + 0.12 * sung };
  if (f < T_IN) {
    // trotting in from the right, easing to a stop
    const u = clamp((f - F0) / (T_IN - F0)), x = lerp(ENTER.x, SPOT.x, 1 - Math.pow(1 - u, 1.8));
    const w = walkPose(f);
    return Object.assign(base, { x, look: -1, legs: w.legs, armL: w.armL, armR: w.armR, hop: w.bob });
  }
  const a = act(SCRIPT, f - T_IN);
  const bob = a.dy > 0 ? 0 : 0.3 * (0.5 - 0.5 * Math.cos(2 * Math.PI * (f - T_IN) / 36));
  return Object.assign(base, { x: SPOT.x, grid: a.grid, dy: a.dy + bob, glow: base.glow + (a.dy > 0 ? 0.12 : 0) });
}

// ---------------------------------------------------------------- render
let hill;
const END22 = motion(S22_LAST);
const LINES22 = lightLines(S22_LAST);
export default {
  async setup(ctx) {
    hill = createHill(ctx.canvas, { log: ctx.log, seeding: seedAt(REST) });
    hill.warm([4]);
    ctx.log(`S24: towers reach ${TW.map((t) => t.reach).join(' ')}, windows ${WINDOWS.length}`);
  },
  render(ctx, fr) {
    const { T } = ctx, f = fr.f;
    const vox = T.envSmooth('vocals', f, 4), sung = T.pulse('sung', f, 8);
    // S22's last state, the current running on, and the town
    const lines = LINES22.slice();
    current(f, lines);
    townLines(f, lines);
    // night comes on through bar 61 (from exactly S22's last palette and dim)
    const k = 0.9 * ease((f - BAR2) / (FL - BAR2 - 4));
    hill.render({
      rung: 4, time: 70 + (f - S22_FIRST) / 30, cam: REST, hill: TERRAIN, fog: 0.009, drift: 0.2,
      tree: { x: -4.1, z: 9.2, grow: 1 },
      clawd: clawdAt(f, vox, sung),
      river: { pts: PATH, head: END22.head, flow: 70 + (f - S22_FIRST) / 30 },
      lines, dim: dimAt(S22_LAST), palLin: k > 0 ? nightPal(k, 0.2) : null,
      ribbons: facadeRibbons(f, smoothstep(BAR2, FL, f)), ribbonPaint: 0, ribbonCore: 0,
    });
  },
};
