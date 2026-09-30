// S16, drop 1, bars 45-46 (frames 3179-3322): the rack is now a hall of racks, a tunnel book of
// card layers down an aisle. On each bass stop a row of pinhole LEDs lights, chasing from the
// nearest rack to the farthest (left row on bar 45's stop, right row on bar 46's); warm light
// gathers on the floor along each lit row. The camera dollies slowly down the aisle.
// Revision 2: on every beat a wave of light runs down the hall along the ceiling trays and the
// racks' activity columns, pumping with the kicks.
import { createPaper, smooth, easeInOut } from '../sets/paper-kit/kit.js';
import { hallScene, HALL } from '../sets/paper-kit/rack.js';

let E, STOPS;
export function s16State(T, fr, stops) {
  const fl = fr.fl, u = fl / (fr.n - 1);
  // (revision 2) on every beat a wave of light runs away down the hall along the ceiling trays and
  // the racks' activity columns; it pumps with the kicks and hushes in the bass stops
  const kick = T.pulse('kicks', fr.f, 6), sb = T.since('beats', fr.f), ss = T.since('stops', fr.f);
  const stopDim = 1 - 0.75 * (ss === Infinity ? 0 : smooth(-1, 1, ss) * (1 - smooth(9, 13, ss)));
  const cc = sb === Infinity ? 1 : Math.min(sb / 18, 1), cg = (0.45 + 0.7 * kick) * stopDim;
  const layers = {};
  for (let i = 0; i < HALL.n; i++) layers['bay' + i] = { t: u, cc, cg };
  const l1 = smooth(stops[0], stops[0] + 14, fl), l2 = smooth(stops[1], stops[1] + 10, fl);
  const [vx, vy] = HALL.vp;
  const st = { layers };
  st.fills = [
    { x: vx - 420, y: vy + 40, z: 200, I: 1.3e4 * l1, a: 260, f: 700, h: 0.3 },
    { x: vx + 420, y: vy + 110, z: 200, I: 1.3e4 * l2, a: 260, f: 700, h: 0.3 },
  ];
  st.cam = { tz: 420 * easeInOut(u), t: [0, 0], pan: [0, 0] };
  return st;
}
export default {
  async setup(ctx) {
    E = createPaper(ctx.canvas, hallScene(), { k: ctx.scale, log: ctx.log });
    const f0 = ctx.shot.f0, f1 = ctx.shot.f1;
    STOPS = ctx.T.events('stops').filter(f => f >= f0 && f < f1).map(f => f - f0);
    if (STOPS.length < 2) STOPS = [59, 131];
  },
  render(ctx, fr) { E.frame(s16State(ctx.T, fr, STOPS)); },
};
