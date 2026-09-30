// Drawing in light (revision 3): helpers that turn world-space polylines into the fork's `lines`
// (hillx.js: [ax, ay, az, bx, by, bz, widthPx, I, r, g, b, glowPx]). The light is S20's: a thin
// core that runs hot at the tip being drawn, settling to a warm glow behind it. Plain JS, no GL.
import { hillH } from '../hill/scene.js';

export const WARM = [1.0, 0.84, 0.64], HOT = [1.0, 0.95, 0.86];
const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);
const lerp = (a, b, t) => a + (b - a) * t;
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// a polyline [[x, y, z], ...] with its cumulative arc lengths
export function polyline(pts) {
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  return { pts, s, len: s[s.length - 1] };
}
// the point at arc length a
export function pointAt(pl, a) {
  const { pts, s } = pl;
  a = clamp(a, 0, pl.len);
  let i = 0; while (i < s.length - 2 && s[i + 1] < a) i++;
  const t = (a - s[i]) / Math.max(s[i + 1] - s[i], 1e-9);
  return [lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t), lerp(pts[i][2], pts[i + 1][2], t)];
}

// Emit the polyline drawn from its start up to arc length `head` (metres) into `out`. Behind the
// tip the light settles from hot to warm over `fresh` metres; the tip itself is a small spark.
// o: { w: core px, I: settled intensity, hotI: extra at the tip, glow: px, hotGlow: extra px,
//      fresh: m, settle: 0..1 how hot the tip still is (1 while drawing; let it decay once done),
//      spark: tip point intensity (0: none), k: overall fade 0..1 }
export function drawPolyline(out, pl, head, o = {}) {
  const w = o.w ?? 1.6, I = o.I ?? 0.8, hotI = o.hotI ?? 0.9, glow = o.glow ?? 3.2, hotGlow = o.hotGlow ?? 2;
  const fresh = o.fresh ?? 1.5, k = o.k ?? 1, spark = o.spark ?? 0, settle = o.settle ?? 1;
  if (head <= 0 || k <= 0) return null;
  const { pts, s } = pl;
  let tip = null;
  for (let i = 0; i + 1 < pts.length; i++) {
    if (s[i] >= head) break;
    const b = s[i + 1] <= head ? pts[i + 1] : pointAt(pl, head);
    const sb = Math.min(s[i + 1], head);
    const f = Math.exp(-Math.max(0, head - sb) / fresh) * settle;
    const c = mixc(WARM, HOT, clamp(f * 1.4));
    out.push([...pts[i], ...b, w, (I + hotI * f) * k, c[0], c[1], c[2], glow + hotGlow * f]);
    tip = b;
  }
  if (tip && spark > 0 && head < pl.len) out.push([...tip, ...tip, 2.4, spark * k, ...HOT, 5]);
  return tip;
}

// a straight world segment as n pieces spaced for depth: the line pass interpolates depth linearly
// in screen space, so a beam from a near glyph to a far point is cut into short pieces (geometric
// spacing) to keep the occlusion test honest along it
export function beam(out, a, b, n, w, I, col, glow) {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  let prev = a;
  for (let k = 1; k <= n; k++) {
    const t = n === 1 ? 1 : (Math.pow(1 + d, k / n) - 1) / d;
    const p = [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
    out.push([...prev, ...p, w, I, col[0], col[1], col[2], glow]);
    prev = p;
  }
}

// a ground polyline sampled on the terrain every `step` metres between 2D points [[x, z], ...],
// lifted `dy` above it
export function groundLine(bumps, xz, step = 0.35, dy = 0.03) {
  const out = [];
  for (let i = 0; i + 1 < xz.length; i++) {
    const [ax, az] = xz[i], [bx, bz] = xz[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
    for (let k = 0; k < n; k++) { const t = k / n, x = lerp(ax, bx, t), z = lerp(az, bz, t); out.push([x, hillH(bumps, x, z) + dy, z]); }
  }
  const [x, z] = xz[xz.length - 1];
  out.push([x, hillH(bumps, x, z) + dy, z]);
  return polyline(out);
}
