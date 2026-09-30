// Revision 8: the salt flat, a night world Clawd makes for looking up and launching (S25c, and S27's
// inside beats). A flat crust to the horizon in S18's painted look (hillx `salt`: pale brush rows,
// polygon cracks, a sheen that mirrors the night sky), no trees, dark peaks on the horizon, faint
// stars, and the two stars the crowd marks (Alpha Centauri A and B), placed on the rays through the
// observatory's pinholes (MATCH.md) from S25c's resting camera. Plain JS, no GL.
import { rayDir, camBasis } from '../hill/scene.js';
import { nightPal } from './night.js';
import { hash } from '../../lib/util.js';

export const FLAT = [];                                    // no bumps: the crust at y 0
export const DRIFT = 0.95;                                 // the look, almost at the shelter's palette (S31)
// the world's light: night (k 0 = the painted look's dusk .. 1 = night); S25c starts at 0.86
export const worldPal = (k) => nightPal(k, DRIFT);
export const WORLD = { hill: FLAT, salt: 1, props: false, drift: DRIFT, tree: null, grid: 0.12, haze: 0.7 };

// S25c's resting camera (its last frame is on the pinholes)
const deg = Math.PI / 180;
export const CAM_REST = { pos: [7.0, 2.2, -17.0], yaw: -22 * deg, pitch: 8.5 * deg, F: 1600, pp: [960, 540] };
export const PIN = { A: [452.5, 321.6], B: [487.2, 339.9] };  // MATCH.md
const B1 = camBasis(CAM_REST), STAR_D = 420;
export const starAt = ([sx, sy]) => { const d = rayDir(B1, sx, sy); return [CAM_REST.pos[0] + d[0] * STAR_D, CAM_REST.pos[1] + d[1] * STAR_D, CAM_REST.pos[2] + d[2] * STAR_D]; };
export const SA = starAt(PIN.A), SB = starAt(PIN.B);
// the night's own stars: fixed directions all over the upper sky (clear of the pair)
export const FAINT = (() => {
  const out = [];
  for (let i = 0; out.length < 90 && i < 900; i++) {
    const sx = -400 + 2700 * hash(i, 1), sy = -500 + 1180 * Math.pow(hash(i, 2), 1.25);
    if (Math.hypot(sx - 470, sy - 331) < 90) continue;
    out.push({ p: starAt([sx, sy]), I: 0.08 + 0.26 * Math.pow(hash(i, 3), 2.2), tw: hash(i, 4), w: 1.0 + 0.8 * hash(i, 5) });
  }
  return out;
})();
// the stars as lines of light (points), twinkling; k 0..1 fades them in
export function starLines(out, t, k = 1) {
  if (k <= 0.01) return out;
  for (const s of FAINT) {
    const tw = 0.78 + 0.22 * Math.sin(t * (2 + 3 * s.tw) + 6.28 * s.tw);
    out.push([...s.p, ...s.p, s.w, s.I * k * tw, 0.9, 0.93, 1.0, 1.4]);
  }
  return out;
}
