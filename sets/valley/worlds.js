// Revision 11: the training worlds, JS mirror of glsl.js (craterH, iceH, saltH, gridH, worldY), for
// Clawd's feet and the cameras. World 0 is the valley's own mesh (V.heightAt); 1 funnel crater,
// 2 icy shore, 3 salt flat, 4 grid plain. P.world = { a, b, front, width }: world B inside the
// front (radius from the spawn), world A outside.
import { vnoise, h2, sstep } from './terrain.js';
import { sweepCover } from './sweep.js';

export const WORLD = { valley: 0, crater: 1, ice: 2, salt: 3, grid: 4 };
export const CRATER_C = [0, 52];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const mix = (a, b, t) => a + (b - a) * t;
const ss = (a, b, x) => sstep(a, b, x);
// GLSL fbmV (value noise with the same rotation and offsets)
function fbmV(x, y, oct) {
  let s = 0, a = 0.5, n = 0;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x, y); n += a; const nx = (0.8 * x + -0.6 * y) * 2.03 + 17.3, ny = (0.6 * x + 0.8 * y) * 2.03 + 9.1; x = nx; y = ny; a *= 0.5; }
  return s / n;
}
function farRange(x, z, amp) {
  const r = Math.hypot(x, z);
  return amp * ss(420, 900, r) * (1 - ss(2400, 3400, r)) * Math.max(0, 0.35 + fbmV(x * 0.0021 + 3.3, z * 0.0021 + 3.3, 4) - 0.5);
}
const hash21 = (i, j) => h2(i, j);
export function craterH(x, z) {
  const dx = x - CRATER_C[0], dz = z - CRATER_C[1], r = Math.hypot(dx, dz), th = Math.atan2(dz, dx);
  const k = clamp(Math.floor((29 - r) / 2.6 + th / 6.2831853 + 0.5), 0, 10);
  const hin = mix(6.0 - k * 0.58, -2.4, 1 - ss(5, 6.5, r));
  const flank = 6.4 * ss(46, 31, r);
  let h = mix(flank, hin, ss(31, 29, r));
  h += 0.4 * ss(28.5, 30, r) * ss(32.5, 30.5, r);
  h += 0.35 * (vnoise(x * 0.12, z * 0.12) - 0.5) * ss(46, 60, r);
  h += 14 * ss(150, 260, Math.hypot(x, z)) * vnoise(x * 0.012 + 7, z * 0.012 + 7);
  h = mix(h, 0, ss(8, 3.5, Math.hypot(x, z)));
  return h + farRange(x, z, 70);
}
export function iceH(x, z) {
  const shore = -6 + 2 * Math.sin(z * 0.045) + 1.2 * Math.sin(z * 0.11 + 1);
  const sea = ss(shore + 1.5, shore - 2, x);
  let h = 0.25 + 0.18 * (vnoise(x * 0.2, z * 0.2) - 0.5);
  const bx = 11 + 3 * Math.sin(z * 0.06 + 2);
  h += 9.5 * ss(bx, bx + 14, x) * (0.8 + 0.4 * vnoise(x * 0.05, z * 0.05)) + 4 * ss(bx + 14, bx + 40, x) * vnoise(x * 0.03, z * 0.03);
  // GLSL mat2(0.88, 0.47, -0.47, 0.88) * q (column-major): (0.88x - 0.47z, 0.47x + 0.88z)
  const qx = 0.88 * x - 0.47 * z, qz = 0.47 * x + 0.88 * z;
  const cx = Math.floor(qx / 7), cz = Math.floor(qz / 7), fx = qx / 7 - cx, fz = qz / 7 - cz;
  const e1 = hash21(cx, cz), e2 = hash21(cx + 3, cz + 7), e3 = hash21(cx + 11, cz + 5);
  const ox = Math.abs(fx - (0.35 + 0.3 * e2)), oz = Math.abs(fz - (0.35 + 0.3 * e3));
  const plate = (e1 >= 0.42 ? 1 : 0) * (1 - ss(0.30, 0.36, Math.max(ox, oz)));
  let floe = mix(-2.2, -0.32 + 0.1 * e2, plate);
  floe += plate * 9 * (hash21(cx + 9, cz + 1) >= 0.9 ? 1 : 0) * ss(110, 200, Math.hypot(x, z));
  h = mix(h, floe, sea);
  h = mix(h, 0, ss(8, 3.5, Math.hypot(x, z)));
  return h + farRange(x, z, 90) * ss(-60, 40, x);
}
export function saltH(x, z) { return mix(0.06 * (vnoise(x * 0.3, z * 0.3) - 0.5), 0, ss(8, 3.5, Math.hypot(x, z))) + farRange(x, z, 80); }
export function gridH(x, z) { return 0.04 * (vnoise(x * 0.3, z * 0.3) - 0.5) * ss(3.5, 8, Math.hypot(x, z)) + farRange(x, z, 60); }
export function worldH(w, x, z) { return w < 1.5 ? craterH(x, z) : w < 2.5 ? iceH(x, z) : w < 3.5 ? saltH(x, z) : gridH(x, z); }
// the ground at (x, z) under P.world, given the valley's own height function
export function worldY(Wd, x, z, valleyH) {
  if (!Wd || (!(Wd.a > 0.5) && !(Wd.b > 0.5))) return valleyH(x, z);
  const b = Wd.b === undefined ? Wd.a : Wd.b, front = Wd.front === undefined ? 1e6 : Wd.front, w = Wd.width || 1;
  let m = 1 - ss(front - w, front, Math.hypot(x, z));
  if (Wd.sweep) m = Math.max(m, sweepCover(Wd.sweep, x, z));     // revision 13: drawn in by the cursor
  const yA = Wd.a > 0.5 ? worldH(Wd.a, x, z) : valleyH(x, z), yB = b > 0.5 ? worldH(b, x, z) : valleyH(x, z);
  return mix(yA, yB, m);
}
