// The rocket's blueprint, every line of it, in the launch set's paper coordinates (revision 8).
// S27 (agent I) draws these in light, and on 72.4 only they remain; S29's first frame (the drop,
// 5195) lands them on the paper rocket and burns them off into the exhaust (sets/paper-kit/MATCH.md).
//
//   STROKES          [{ part, pts: [[X, Y], ...], z, t0, t1, w, I }] in launch-set world px. part is
//                    body | booster | engine | fin | fairing | sail. z is the launch layer's depth
//                    (rocket 0, fairing 12; the sail folds inside the fairing). t0..t1 is the
//                    suggested draw window (0..1 over the whole drawing: body, boosters, engines,
//                    fins, fairing, then the sail). w is the stroke weight (1 = an edge; rings,
//                    meridians and seams are finer), I the relative brightness.
//   screenStrokes(cam, rise)   the strokes in screen px through a launch camera (kit.js camera
//                    object, as launch.js shots use), with the rocket risen by `rise` world px.
//   S29_CAM0         S29's camera at its first frame: the rest view, so screen = paper coordinates.
//   heat(part)       the burn order for the landing: outer parts first, the heart (the sail) last.
import { toScreen, lerp } from './kit.js';
import { RK } from './launch.js';

export const S29_CAM0 = { Zc: 2400, zref: 0, c: [960, 540], t: [0, 0], tz: 0, pan: [0, 0] };
const cx = RK.x;
const ZR = 0, ZF = 12;
const ell = (x, y, rx, ry, n = 28) => [...Array(n + 1)].map((_, k) => { const a = 2 * Math.PI * k / n; return [x + rx * Math.cos(a), y + ry * Math.sin(a)]; });
const vline = (x, y0, y1, n = 12) => [...Array(n + 1)].map((_, k) => [x, lerp(y0, y1, k / n)]);

export const STROKES = (() => {
  const S = [];
  const add = (part, pts, z, t0, t1, w = 1, I = 1) => S.push({ part, pts, z, t0, t1, w, I });
  // the body (core stage): its two edges rise, rings as they pass, two front meridians, the boat-tail
  const coreT = (Y) => lerp(0.02, 0.25, (816 - Y) / (816 - 316));
  add('body', vline(cx - 28, 816, 316, 20), ZR, 0.02, 0.25, 1.2);
  add('body', vline(cx + 28, 816, 316, 20), ZR, 0.02, 0.25, 1.2);
  add('body', vline(cx - 14, 800, 318, 16), ZR, 0.04, 0.27, 0.7, 0.55);
  add('body', vline(cx + 14, 800, 318, 16), ZR, 0.04, 0.27, 0.7, 0.55);
  for (const Y of [800, 700, 560, 420, 318]) add('body', ell(cx, Y, 28, 4.5), ZR, coreT(Y), coreT(Y) + 0.04, 0.8, 0.85);
  add('body', [[cx - 28, 800], [cx - 20, 816], [cx + 20, 816], [cx + 28, 800]], ZR, 0.0, 0.04, 1);
  // the boosters: edges, rings, nose cones, the struts to the core
  for (const s of [-1, 1]) {
    const bx = cx + s * 46, bt = (Y) => lerp(0.27, 0.42, (810 - Y) / (810 - 522));
    add('booster', vline(bx - 15, 810, 522, 12), ZR, 0.27, 0.42, 1.1);
    add('booster', vline(bx + 15, 810, 522, 12), ZR, 0.27, 0.42, 1.1);
    for (const Y of [808, 640, 530]) add('booster', ell(bx, Y, 15, 2.6, 20), ZR, bt(Y), bt(Y) + 0.03, 0.8, 0.8);
    add('booster', [[bx - 15, 522], [bx - 12, 504], [bx - 8, 490], [bx - 4, 482], [bx, 478], [bx + 4, 482], [bx + 8, 490], [bx + 12, 504], [bx + 15, 522]], ZR, 0.41, 0.46, 1.1);
    for (const Y of [562.5, 762.5]) add('booster', [[s > 0 ? bx - 15 : bx + 15, Y], [s > 0 ? cx + 28 : cx - 28, Y]], ZR, 0.44, 0.47, 0.7, 0.75);
  }
  // the engines: three on the core, one under each booster
  for (const nx of [-12, 0, 12]) add('engine', [[cx + nx - 4, 814], [cx + nx - 6.5, 826], [cx + nx + 6.5, 826], [cx + nx + 4, 814]], ZR, 0.48, 0.53, 0.9);
  for (const s of [-1, 1]) { const bx = cx + s * 46; add('engine', [[bx - 10, 808], [bx - 8, 826], [bx + 8, 826], [bx + 10, 808]], ZR, 0.5, 0.55, 0.9); }
  // the fins
  for (const s of [-1, 1]) { const bx = cx + s * 46; add('fin', [[bx + s * 15, 760], [bx + s * 34, 800], [bx + s * 34, 816], [bx + s * 15, 806]], ZR, 0.54, 0.6, 1.1); }
  // the fairing: two ogive edges rising to the tip, three rings, two meridians
  const half = (side, k = 1) => [...Array(21)].map((_, i) => { const t = i / 20; return [cx + side * k * 36 * Math.pow(1 - t, 0.55) * (1 - 0.12 * t), lerp(RK.fairBase, RK.top, t)]; });
  add('fairing', half(-1), ZF, 0.6, 0.74, 1.2); add('fairing', half(1), ZF, 0.6, 0.74, 1.2);
  add('fairing', half(-1, 0.5), ZF, 0.62, 0.75, 0.7, 0.5); add('fairing', half(1, 0.5), ZF, 0.62, 0.75, 0.7, 0.5);
  for (const Y of [318, 292, 258]) {
    const t = (RK.fairBase - Y) / (RK.fairBase - RK.top), hw = 36 * Math.pow(1 - t, 0.55) * (1 - 0.12 * t), tt = lerp(0.6, 0.74, t);
    add('fairing', ell(cx, Y, hw, hw * 0.16, 24), ZF, tt, tt + 0.03, 0.8, 0.85);
  }
  // the sail, folded in the nose: a stack of zig-zag folds (sail.js unfurls it in S29)
  for (let k = 0; k < 5; k++) {
    const Y = 300 - k * 12, hw = 18 - k * 2.6, zz = [];
    for (let i = 0; i <= 8; i++) zz.push([cx - hw + 2 * hw * i / 8, Y + (i % 2 ? -4 : 4)]);
    add('sail', zz, ZF, 0.8 + 0.03 * k, 0.86 + 0.03 * k, 1.0, 1.25);
  }
  return S;
})();

// the landing's burn order (frames after the drop at which a part starts to burn): outer first,
// the heart (the folded sail, the payload) last
const HEAT = { fin: 1, engine: 2, booster: 3, body: 5, fairing: 7, sail: 10 };
export const heat = (part) => HEAT[part] ?? 4;

export function screenStrokes(cam, rise = 0) {
  return STROKES.map((s) => Object.assign({}, s, { pts: s.pts.map(([X, Y]) => toScreen(cam, [X, Y - rise], s.z)) }));
}
