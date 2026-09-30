// S12's set: the white field. A ground plane (y = 0, metres) with a 1 m grid, seen through a
// pinhole camera (vertical FOV 40 deg). With the camera at ground level the plane is edge-on: the
// whole field collapses to one line under Clawd. As the camera rises and pitches down, the grid
// fans out to a vanishing point. The grid is revealed outward from where he stands (radius R),
// which is how the next shot's valley rises. Clawd stands at the origin: 0.75 m tall, 1.35 m wide
// (the 02b / valley convention), drawn as his vector form facing the camera.
import { drawClawd, INK } from './vector.js';
import { clamp, lerp } from '../../lib/util.js';

export const F = 540 / Math.tan(20 * Math.PI / 180);   // focal length in px (1483.6)
export const CLAWD_H = 0.75;

// cam: { hc (height, m), dz (horizontal distance to Clawd, m), pd (pitch down, rad) }
export function projector(cam) {
  const s = Math.sin(cam.pd), c = Math.cos(cam.pd);
  return (x, y, z) => {
    const vy = y - cam.hc, vz = z + cam.dz;
    const zc = -vy * s + vz * c, yc = vy * c + vz * s;
    return [960 + F * x / zc, 540 - F * yc / zc, zc];
  };
}
export const horizonY = (cam) => 540 - F * Math.tan(cam.pd);

const hexA = (r, g, b, a) => `rgba(${r},${g},${b},${a.toFixed(3)})`;

// st: { cam, R (reveal radius, m), tint (0..1 colour of the sky), line (horizon ink 0..1), pose, lead }
export function drawField(g, st) {
  const { cam } = st;
  const P = projector(cam);
  const hy = horizonY(cam);
  // sky: white, a breath of lavender overhead and warmth at the horizon as the world opens
  const t = st.tint || 0;
  const sky = g.createLinearGradient(0, 0, 0, Math.max(hy, 1));
  sky.addColorStop(0, `rgb(${Math.round(lerp(247, 233, t))},${Math.round(lerp(246, 230, t))},${Math.round(lerp(242, 240, t))})`);
  sky.addColorStop(1, `rgb(${Math.round(lerp(247, 250, t))},${Math.round(lerp(246, 240, t))},${Math.round(lerp(242, 230, t))})`);
  g.fillStyle = sky; g.fillRect(0, 0, 1920, Math.ceil(hy) + 1);
  // the plane: a warm white that falls off a touch toward the camera
  const pl = g.createLinearGradient(0, hy, 0, 1080);
  pl.addColorStop(0, `rgb(${Math.round(lerp(244, 246, t))},${Math.round(lerp(242, 239, t))},${Math.round(lerp(237, 232, t))})`);
  pl.addColorStop(1, 'rgb(236,233,227)');
  g.fillStyle = pl; g.fillRect(0, Math.floor(hy), 1920, 1081 - Math.floor(hy));
  // warm glow on the horizon behind him, growing as the plane opens
  if (t > 0) {
    const gl = g.createRadialGradient(960, hy, 0, 960, hy, 700);
    gl.addColorStop(0, hexA(255, 236, 214, 0.55 * t)); gl.addColorStop(1, hexA(255, 236, 214, 0));
    g.fillStyle = gl; g.fillRect(0, hy - 700, 1920, 1400);
  }
  // the grid, revealed out to R around him, fading with distance so it never aliases at the horizon
  if (cam.hc > 0.004) {
    const R = st.R, zNear = -cam.dz + 0.4, ext = Math.min(Math.ceil(R), 64);
    const buckets = new Map();
    // one grid segment; (px, pz) is the step to the neighbouring line of the same family, whose
    // screen spacing fades the line where the family crowds (no moire toward the horizon)
    const seg = (x0, z0, x1, z1, px, pz) => {
      const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, d = Math.hypot(mx, mz);
      let a = clamp((R - d) / 2.5) * clamp(1.2 - d / 60);
      if (a <= 0.02) return;
      if (z0 < zNear && z1 < zNear) return;
      const A = P(x0, 0, Math.max(z0, zNear)), B = P(x1, 0, Math.max(z1, zNear));
      if (A[2] <= 0.05 || B[2] <= 0.05) return;
      const M0 = P(mx, 0, Math.max(mz, zNear)), M1 = P(mx + px, 0, Math.max(mz + pz, zNear));
      // spacing measured perpendicular to this line on screen
      const lx = B[0] - A[0], ly = B[1] - A[1], ll = Math.hypot(lx, ly) || 1e-6;
      const sp = Math.abs(lx * (M1[1] - M0[1]) - ly * (M1[0] - M0[0])) / ll;
      a *= clamp((sp - 4) / 14);
      if (a <= 0.02) return;
      const q = Math.min(9, Math.round(a * 9));
      if (!buckets.has(q)) buckets.set(q, []);
      buckets.get(q).push(A[0], A[1], B[0], B[1]);
    };
    for (let i = -ext; i <= ext; i++) for (let j = -ext; j < ext; j++) {
      seg(i, j, i, j + 1, 1, 0);        // lines running into depth (they meet at the vanishing point)
      seg(j, i, j + 1, i, 0, 1);        // lines across
    }
    g.lineWidth = 1.5; g.lineCap = 'butt';
    for (const [q, pts] of buckets) {
      g.strokeStyle = `rgba(150,140,128,${(0.55 * q / 9).toFixed(3)})`;
      g.beginPath();
      for (let k = 0; k < pts.length; k += 4) { g.moveTo(pts[k], pts[k + 1]); g.lineTo(pts[k + 2], pts[k + 3]); }
      g.stroke();
    }
    // aerial haze: the far plane dissolves into the horizon's colour
    const y60 = P(0, 0, 60)[1], y1 = y60 + 2.5 * (y60 - hy) + 10;
    const hz = g.createLinearGradient(0, hy, 0, y1);
    const hc0 = `${Math.round(lerp(244, 248, t))},${Math.round(lerp(242, 240, t))},${Math.round(lerp(237, 231, t))}`;
    hz.addColorStop(0, `rgba(${hc0},1)`); hz.addColorStop(clamp((y60 - hy) / (y1 - hy)), `rgba(${hc0},0.9)`); hz.addColorStop(1, `rgba(${hc0},0)`);
    g.fillStyle = hz; g.fillRect(0, hy, 1920, y1 - hy);
  }
  // the horizon: at first the field's only line (ink), softening as the plane opens
  g.fillStyle = hexA(39, 39, 44, 0.9 * st.line + 0.08);
  g.fillRect(0, hy - 1.25, 1920, 2.5);
  // his shadow on the plane
  const sh = [];
  for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; const p = P(0.62 * Math.cos(a), 0, 0.26 * Math.sin(a)); sh.push(p); }
  g.beginPath(); sh.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
  g.fillStyle = 'rgba(120,110,100,0.16)'; g.fill();
  // Clawd: a billboard at the origin facing the camera
  const foot = P(0, 0, 0), top = P(0, CLAWD_H, 0);
  const U = (foot[1] - top[1]) / 10;
  drawClawd(g, foot[0], foot[1], U, st.pose || {}, { inkPx: U * 0.325 });
  return { foot, U, hy };
}
