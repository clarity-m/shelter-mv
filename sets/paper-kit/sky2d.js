// The sky as a celestial sphere (revision 12, S29): the stars are too far away for the climber's motion
// to move them; what moves them is the tether turning with the Earth. A climb takes days, so compressed
// into seconds the sky wheels about the Earth's axis in time-lapse trails. The tether is on the equator
// and the camera faces due north, so the celestial pole is on the horizon straight ahead, behind the
// tether's line: the trails are concentric circles centred on the elevator (the pole projects to
// screen x = the principal point, and to the height the camera's pitch gives the horizon).
// World frame: +x east (the camera's right), +y up (zenith), +z north (the Earth's axis, the pole). A
// positive sky angle turns the sphere about +z the way the sky goes as seen facing north: stars rise
// on the right (east), pass over the pole right to left, and set on the left (west). Stars below the
// horizon, less the dip (the horizon falls away as the climber rises), are hidden by the Earth.
// Drawn in 2D over the paper frame (additively), in the 1920x1080 frame's px; pure per call.
//   const stars = makeSky(n, seed)                 unit directions, uniform on the sphere
//   const C = skyCam(yaw, pitch, f, pp)            yaw 0 faces north; pitch > 0 tilts up (the pole
//                                                  then sits f tan(pitch) below the principal point)
//   turn(d, a), projectDir(C, d), unprojectDir(C, sx, sy)
//   drawSky3(g, s, stars, C, { angle, trail, gain, minB, dip })
//     angle: the sphere's turn so far; trail: the turn the exposure spans (0 = points)
//     gain: brightness scale; minB: hide stars fainter than this (the atmosphere); dip: radians of sky
//     visible below the horizon
import { mulberry32 } from './kit.js';

export function makeSky(n, seed) {
  const R = mulberry32(seed), out = [];
  for (let i = 0; i < n; i++) {
    const z = 2 * R() - 1, a = 2 * Math.PI * R(), r = Math.sqrt(1 - z * z);
    out.push({ d: [r * Math.cos(a), r * Math.sin(a), z], b: 0.1 + 0.9 * Math.pow(R(), 3.2), w: 0.7 + 1.0 * Math.pow(R(), 3), tint: R() });
  }
  return out;
}
export function skyCam(yaw = 0, pitch = 0, f = 1500, pp = [960, 540]) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const fw = [sy * cp, sp, cy * cp], rt = [cy, 0, -sy];
  const up = [fw[1] * rt[2] - fw[2] * rt[1], fw[2] * rt[0] - fw[0] * rt[2], fw[0] * rt[1] - fw[1] * rt[0]];
  return { fw, rt, up, f, pp };
}
export const turn = (d, a) => { const c = Math.cos(a), s = Math.sin(a); return [d[0] * c - d[1] * s, d[0] * s + d[1] * c, d[2]]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export function projectDir(C, d) {
  const z = dot(d, C.fw);
  if (z <= 0.05) return null;
  return [C.pp[0] + C.f * dot(d, C.rt) / z, C.pp[1] - C.f * dot(d, C.up) / z];
}
export function unprojectDir(C, sx, sy) {
  const a = (sx - C.pp[0]) / C.f, b = (C.pp[1] - sy) / C.f;
  const d = [0, 1, 2].map((j) => C.fw[j] + C.rt[j] * a + C.up[j] * b), l = Math.hypot(d[0], d[1], d[2]);
  return d.map((v) => v / l);
}
const K = 8;                                                   // samples along a trail
export function drawSky3(g, s, stars, C, o = {}) {
  const angle = o.angle || 0, L = o.trail || 0, gain = o.gain === undefined ? 1 : o.gain, minB = o.minB || 0;
  const W = 1920, H = 1080, minY = -Math.sin(Math.min(o.dip || 0, 1.5));
  g.lineCap = 'round'; g.lineJoin = 'round';
  let n = 0;
  for (const st of stars) {
    if (st.b < minB) continue;
    const dh = turn(st.d, angle);
    if (dh[1] < minY) continue;                                 // below the (dipped) horizon: behind the Earth
    const h = projectDir(C, dh);
    if (!h || h[0] < -200 || h[0] > W + 200 || h[1] < -40 || h[1] > H + 900) continue;
    const b = Math.min(1, st.b * gain * (minB > 0 ? (st.b - minB) / (1 - minB) * 1.4 : 1));
    if (b <= 0.01) continue;
    const c = st.tint < 0.12 ? [248, 232, 214] : st.tint < 0.55 ? [214, 224, 248] : [232, 236, 248];
    const w = st.w * s;
    if (L > 1e-4) {
      // the path the star swept in the exposure, back from its head
      const pts = [h];
      for (let k = 1; k <= K; k++) { const p = projectDir(C, turn(st.d, angle - L * k / K)); if (!p) break; pts.push(p); }
      if (pts.length > 1 && Math.hypot(pts[pts.length - 1][0] - h[0], pts[pts.length - 1][1] - h[1]) > 1.2) {
        for (const [k0, k1, al] of [[0, 3, 0.8], [3, 6, 0.42], [6, 8, 0.18]]) {
          if (k0 + 1 >= pts.length) break;
          g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${(al * b).toFixed(3)})`; g.lineWidth = w;
          g.beginPath(); g.moveTo(pts[k0][0] * s, pts[k0][1] * s);
          for (let k = k0 + 1; k <= Math.min(k1, pts.length - 1); k++) g.lineTo(pts[k][0] * s, pts[k][1] * s);
          g.stroke();
        }
      }
    }
    if (h[1] <= H + 10) {
      g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${Math.min(1, 0.95 * b).toFixed(3)})`;
      g.beginPath(); g.arc(h[0] * s, h[1] * s, Math.max(0.55, 0.75 * st.w) * s, 0, 2 * Math.PI); g.fill();
    }
    n++;
  }
  return n;
}
