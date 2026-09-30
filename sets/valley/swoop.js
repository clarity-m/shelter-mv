// Revision 20 (Claire: the humans' cursor swoops in rather than appearing): it rises in from below the
// frame over S12's last beat and lands on S13's first click point on frame 2316, the click of
// ground.raise() on 33.1. Shared by S12 (which draws it over the white field) and S13, so the motion
// runs on across the cut. Positions are in 1920-wide design pixels.
import { camBasis, projectPx } from './valley.js';

export const SWOOP_F = [2297, 2316];
// the click point through S13's hand-off camera (S12's last view)
const B = camBasis({ pos: [0, 1.572, 8.516], look: [0, 0.375, 0], fovy: 40 }, 1920, 1080);
const q = projectPx(B, [1.3, 0.05, 1.1]);
export const SWOOP_TGT = [q[0], q[1]];
const easeOut = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

// the cursor at absolute frame f: null before the swoop; done once it has landed
export function swoopAt(f) {
  const [F0, F1] = SWOOP_F;
  if (f < F0) return null;
  const u = Math.min(1, (f - F0) / (F1 - F0)), e = easeOut(u);
  const from = [SWOOP_TGT[0] - 430, 1270];                        // below the frame, to the left
  const x = from[0] + (SWOOP_TGT[0] - from[0]) * e + 170 * Math.sin(Math.PI * e) * (1 - e);   // curling in
  const y = from[1] + (SWOOP_TGT[1] - from[1]) * e;
  const rot = -0.06 - 0.55 * (1 - e) * (1 - e);                    // leaning into the swoop, settling upright
  return { x, y, rot, done: u >= 1 };
}
