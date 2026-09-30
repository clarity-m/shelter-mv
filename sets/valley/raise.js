// S19 (revision 5): the hill Clawd raises in the painted valley, continuing S18. The bumps are
// sets/hill/scene.js's HILL (the hill of the final scene, in hill units, Clawd ~1 unit wide), placed
// so the hill engine's Clawd spot lands on his spot in the valley and its axes follow S18's final
// view: hill x = screen right, hill z = away from the lens. glsl.js hillAt() is the same field.
import { HILL } from '../hill/scene.js';
import { HX, HZ, TH_V } from './breakdown.js';

export const HILL_CLAWD = [1.51, 9.6];                 // Clawd's spot in the hill engine (S19, S31)
export const HILL_TREE = [-5.6, 10.0];                 // the tree's seat on the left shoulder (hill engine: -4.1, 9.2; moved
                                                       // along the shoulder to clear the valley's own round tree at -6.2, 33)
export const M_PER_UNIT = 1.5;                         // valley metres per hill unit (Clawd 1.35 m wide)
const R = [Math.cos(TH_V), -Math.sin(TH_V)], F = [Math.sin(TH_V), Math.cos(TH_V)];

// hill (x, z) -> valley (x, z)
export function hillToValley(hx, hz) {
  const du = (hx - HILL_CLAWD[0]) * M_PER_UNIT, dv = (hz - HILL_CLAWD[1]) * M_PER_UNIT;
  return [HX + du * R[0] + dv * F[0], HZ + du * R[1] + dv * F[1]];
}
// the three bumps at growth g = [g0, g1, g2] (0..1 each) and their rates (per frame)
export function hillBumps(g, rate = [0, 0, 0]) {
  return HILL.map((b, i) => {
    const [a, cx, cz, sx, sz] = b, c = hillToValley(cx, cz);
    return { amp: a * M_PER_UNIT * g[i], x: c[0], z: c[1], rate: rate[i], su: sx * M_PER_UNIT, sv: sz * M_PER_UNIT, rx: R[0], rz: R[1] };
  });
}
// height of the bumps at (x, z), metres (as glsl.js hillAt)
export function hillHeight(bumps, x, z) {
  let h = 0;
  for (const b of bumps) {
    if (!b.amp) continue;
    const dx = x - b.x, dz = z - b.z;
    const lu = (dx * b.rx + dz * b.rz) / b.su, lv = (dx * -b.rz + dz * b.rx) / b.sv;
    h += b.amp * Math.exp(-(lu * lu + lv * lv));
  }
  return h;
}
