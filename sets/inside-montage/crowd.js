// Small helpers shared by the inside-montage shots (S22, S25, S27, S30): camera rigs and crowd
// visibility. Plain JS, no GL.
import { camBasis, project, hillH } from '../hill/scene.js';
import { CLAWD_U } from './hillx.js';

const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);
const lerp = (a, b, t) => a + (b - a) * t;

export const CLAWD_W = CLAWD_U * 18;                     // Clawd's glyph width in metres

// a camera at pos looking at `at` (focal F in design px, principal point pp)
export function look(pos, at, F = 1400, pp = [960, 700]) {
  const d = [at[0] - pos[0], at[1] - pos[1], at[2] - pos[2]];
  return { pos, yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), F, pp };
}
export function lerpCam(a, b, t) {
  return { pos: a.pos.map((v, i) => lerp(v, b.pos[i], t)), yaw: lerp(a.yaw, b.yaw, t), pitch: lerp(a.pitch, b.pitch, t),
    F: lerp(a.F, b.F, t), pp: [lerp(a.pp[0], b.pp[0], t), lerp(a.pp[1], b.pp[1], t)] };
}
// a Clawd standing at (x, z) on the terrain: [screen x, screen y, width px, depth]
export function clawdOnScreen(cam, bumps, x, z, u = CLAWD_U) {
  const p = [x, hillH(bumps, x, z) + 5 * u, z];
  const [sx, sy, d] = project(camBasis(cam), p);
  return [sx, sy, d > 0 ? cam.F * u * 18 / d : Infinity, d];
}
// How far the sight line from the camera to (x, y, z) clears the terrain (m; negative when a ridge
// hides it). Fade a crowd member with it so one behind a crest never shows only its rays poking
// over the silhouette, and nothing pops.
export function clearance(bumps, cam, x, y, z) {
  const [cx, cy, cz] = cam.pos;
  let m = 1e9;
  for (let s = 1; s < 44; s++) {
    const t = s / 48, px = cx + (x - cx) * t, pz = cz + (z - cz) * t, py = cy + (y - cy) * t;
    m = Math.min(m, py - hillH(bumps, px, pz));
  }
  return m;
}
export const clearFade = (bumps, cam, x, z, u = CLAWD_U) => {
  const y = hillH(bumps, x, z) + 5 * u;
  return clamp((clearance(bumps, cam, x, y, z) + 0.02) / 0.2);
};
