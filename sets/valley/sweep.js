// Revision 13: the humans' cursor draws land in (S13's valley, S14's worlds). A sweep is a polyline
// on the ground ([x, z, halfWidth] points) drawn up to an arc length `reach`: the land inside the
// band forms (target 1: the valley rises, S13; target 2: world B forms, S14) where the cursor's tip
// has passed, ahead of the radial front. The shader side is glsl.js sweepCover (uSweep*); this is
// the JS mirror (worlds.js worldY uses it for heights) and the helpers the shots use.
export const SWEEP_MAX = 24;

// { pts: [[x, z, w], ..], reach, target, tip: [x, z, radius, glow] } -> the renderer's P.sweep
export function makeSweep(pts, reach, target, glow = 0.35) {
  const P = pts.slice(0, SWEEP_MAX), buf = new Float32Array(SWEEP_MAX * 4), S = [0];
  for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  P.forEach((p, i) => buf.set([p[0], p[1], S[i], p[2]], i * 4));
  const tp = sweepPoint({ pts: P, S }, reach);
  return { pts: P, S, n: P.length, buf, reach, target, len: S[S.length - 1], tip: [tp[0], tp[1], Math.max(2, tp[2] * 0.8), glow] };
}
// the point (x, z, halfWidth) at arc length s
export function sweepPoint(Sw, s) {
  const { pts, S } = Sw;
  if (s <= 0) return pts[0];
  for (let i = 1; i < pts.length; i++) {
    if (s <= S[i]) {
      const t = (s - S[i - 1]) / Math.max(1e-6, S[i] - S[i - 1]), a = pts[i - 1], b = pts[i];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    }
  }
  return pts[pts.length - 1];
}
// 0..1: how much of (x, z) the band has covered (as glsl.js sweepCover)
export function sweepCover(Sw, x, z) {
  if (!Sw || Sw.n < 2 || !(Sw.reach > 0)) return 0;
  let best = 1e9;
  for (let i = 0; i < Sw.n - 1; i++) {
    const A = Sw.pts[i], B = Sw.pts[i + 1], sA = Sw.S[i];
    if (sA > Sw.reach) break;
    const abx = B[0] - A[0], abz = B[1] - A[1], L = Math.max(Math.hypot(abx, abz), 1e-4);
    const tmax = Math.min(1, Math.max(0, (Sw.reach - sA) / L));
    const t = Math.min(tmax, Math.max(0, ((x - A[0]) * abx + (z - A[1]) * abz) / (L * L)));
    const w = L < 1e-3 ? Math.max(A[2], B[2]) : A[2] + (B[2] - A[2]) * t;     // (a zero-length segment is a disc)
    best = Math.min(best, Math.hypot(x - A[0] - abx * t, z - A[1] - abz * t) / Math.max(w, 1e-3));
  }
  const u = Math.min(1, Math.max(0, (best - 0.6) / 0.4));
  return 1 - u * u * (3 - 2 * u);
}
