// Staging shared by S17 (the dive into one world) and S18 (the breakdown), so S17 ends on
// exactly S18's first frame, and S18 ends on S19's opening composition (out/shots/S19.mp4
// frame 0: flat painted floor at dusk, horizon at y ~780, Clawd centred at x ~1140 with his
// feet at y ~851 and 116 px wide, the low sun at (1465, 650)).
import { clamp, lerp, ss, easeInOut } from './shotkit.js';

const DEG = Math.PI / 180;
export const HX = -1.2, HZ = 40;                        // where he stands, alone
export const TH_V = -10 * DEG;                          // S19-matched view direction
export const TH_C = TH_V + 7.3 * DEG;                   // direction from the lens to him (180 px right)
export const D_END = 16.3, H_END = 0.83;                // his glyph 116 px wide, feet 71 px under the horizon
export const YAW = TH_C + Math.PI;                      // he faces the lens
export const PP_END = [0, -240 / 540];                  // horizon at y = 780
export const FOVY_END = 2 * Math.atan(540 / 1400) / DEG;  // S19's 1400 px focal length
export const SUN_END = [TH_V / DEG + 19.8, 5.3];        // S19's sun at (1465, 650)
export const PHI0 = TH_C + Math.PI - 34 * DEG, D0 = 13.5, H0 = 5.4;

// S18's camera at progress u (0..1); u = 0 is also S17's last frame
export function breakdownCam(u, gy) {
  const a = easeInOut(clamp(u / 0.94));
  const phi = lerp(PHI0, TH_C + Math.PI, a);
  const d = lerp(D0, D_END, a), h = lerp(H0 + gy, H_END, Math.pow(a, 0.8));
  const pos = [HX + Math.sin(phi) * d, h, HZ + Math.cos(phi) * d];
  // look: at him, then the level S19 direction with him off to the right
  const tgt = [HX, lerp(gy + 2.6, 0.38, Math.pow(a, 0.7)), HZ];
  let dir = [tgt[0] - pos[0], tgt[1] - pos[1], tgt[2] - pos[2]];
  const l = Math.hypot(...dir); dir = dir.map((v) => v / l);
  const k = ss(0.45, 1, a);
  const fin = [Math.sin(TH_V), 0, Math.cos(TH_V)];
  const fw = [lerp(dir[0], fin[0], k), lerp(dir[1], fin[1], k), lerp(dir[2], fin[2], k)];
  return { pos, fwd: fw, fovy: lerp(38, FOVY_END, ss(0.3, 1, a)), pp: [0, lerp(0, PP_END[1], ss(0.35, 1, a))] };
}
