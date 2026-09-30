// S16, drop 1, bars 45-46 (frames 3179-3322): the rack is now a hall of racks, a tunnel book of
// card layers down an aisle. On each bass stop a row of pinhole LEDs lights, chasing from the
// nearest rack to the farthest (left row on bar 45's stop, right row on bar 46's); warm light
// gathers on the floor along each lit row. The camera dollies slowly down the aisle.
// Revision 2: on every beat a wave of light runs down the hall along the ceiling trays and the
// racks' activity columns, pumping with the kicks.
// Revision 19 (Claire: the pulses read on 2 and 4): the main pulse lands on beats 1 and 3, a faint
// echo on 2 and 4. Each wave starts LEAD frames early, so its brightest moment (the near trays'
// dashes) falls on the beat. The rows light on 1 (left) and 3 (right), chasing near to far.
import { createPaper, smooth, easeInOut } from '../sets/paper-kit/kit.js';
import { hallScene, HALL, beatWave } from '../sets/paper-kit/rack.js';
const LEAD = 4;

let E, STOPS;
export function s16State(T, fr, stops) {
  const fl = fr.fl, u = fl / (fr.n - 1);
  // (revision 2) on every beat a wave of light runs away down the hall along the ceiling trays and
  // the racks' activity columns; it pumps with the kicks and hushes in the bass stops
  const kick = T.pulse('kicks', fr.f, 6), w = beatWave(T, fr.f, LEAD), ss = T.since('stops', fr.f);
  const stopDim = 1 - 0.75 * (ss === Infinity ? 0 : smooth(-1, 1, ss) * (1 - smooth(9, 13, ss)));
  const cc = w.sb === Infinity ? 1 : Math.min(w.sb / 18, 1), cg = (w.main ? 1 : 0.28) * (0.45 + 0.7 * kick) * stopDim;
  // the rows' clock: the left row's codes are 0.413-0.468, the right's 0.916-0.971 (near to far)
  const t = fl < 20 ? 0.40 + 0.08 * smooth(-LEAD, 6, fl) : 0.90 + 0.08 * smooth(36 - LEAD, 42, fl);
  const layers = {};
  for (let i = 0; i < HALL.n; i++) layers['bay' + i] = { t, cc, cg };
  const l1 = smooth(-2, 10, fl), l2 = smooth(34, 46, fl);
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
