// S06, hook 1, bars 13-14 (frames 875-1018): a GPU rack in layered card at night, with two empty
// bays. On each bass stutter-stop (T.events('stops'): bar 13 and bar 14, beat 4) a GPU sled slides
// in from the camera side and seats (its soft shadow on the rack tightens as it lands); then its
// LEDs light as warm pinholes, one by one, and warm light shows through its vent holes. The help
// arrives as hardware. The camera pushes in slowly.
// Revision 2: data pulses run down the feed cables and into the units, and LED cascades run along
// the rack on the beats, pumping with the kicks; the motion calms down over the last frames.
import { createPaper, smooth, clamp, easeOut, easeInOut, lerp } from '../sets/paper-kit/kit.js';
import { rackScene, sledXf, RACK } from '../sets/paper-kit/rack.js';

let E, STOPS;
const SLIDE = 8;
function sledState(fl, stop) {
  if (fl < stop) return { op: 0, z: 520, t: 0, a: 1 };
  const p = clamp((fl - stop) / SLIDE, 0, 1);
  const a = 1 - easeOut(p);
  const bump = fl > stop + SLIDE ? 0.012 * Math.exp(-(fl - stop - SLIDE) / 2.5) * Math.sin((fl - stop - SLIDE) * 1.7) : 0;
  const xf = sledXf(Math.max(a + bump, 0));
  const t = clamp((fl - stop - SLIDE + 1) / 8, 0, 1);
  return Object.assign(xf, { op: 1, t, a });
}
export function s06State(T, fr, stops) {
  const fl = fr.fl, u = fl / (fr.n - 1);
  const A = sledState(fl, stops[0]), B = sledState(fl, stops[1]);
  // (revision 2) data pulses stream down the feeds into the rack, and an LED cascade runs along
  // the units on every beat; both pump with the kicks, hush in the bass stops, and calm to nothing
  // over the last frames, so the final frame (S07 dissolves out of it) is the same as before
  const kick = T.pulse('kicks', fr.f, 5), sb = T.since('beats', fr.f), ss = T.since('stops', fr.f);
  const stopDim = 1 - 0.75 * (ss === Infinity ? 0 : smooth(-1, 1, ss) * (1 - smooth(9, 13, ss)));
  const calm = 1 - smooth(fr.n - 20, fr.n - 5, fl);
  const servers = { cc: 1.9 * fr.t, cg: (0.7 + 0.3 * kick) * stopDim * calm };
  const frame = { cc: sb === Infinity ? 1 : Math.min(sb / 18, 1), cg: (0.5 + 0.5 * kick) * stopDim * calm };
  const st = { layers: { sledA: A, sledB: B, servers, frame } };
  // warm light: in front of each seated sled, growing as its pinholes come on
  st.light = { x: 960, y: RACK.bayA + 44, z: 40, I: 1.1e4 * smooth(0.1, 1, A.t) };
  st.fills = [{ x: 960, y: RACK.bayB + 44, z: 40, I: 1.1e4 * smooth(0.1, 1, B.t), a: 70, f: 420, h: 1 }];
  st.cam = { c: [960, 470], tz: 420 + 200 * easeInOut(u), t: [16 - 32 * u, 0], pan: [0, 0] };
  return st;
}
export default {
  async setup(ctx) {
    E = createPaper(ctx.canvas, rackScene(), { k: ctx.scale, log: ctx.log });
    const f0 = ctx.shot.f0, f1 = ctx.shot.f1;
    STOPS = ctx.T.events('stops').filter(f => f >= f0 && f < f1).map(f => f - f0);
    if (STOPS.length < 2) STOPS = [59, 131];
    ctx.log(`S06 stops at local ${STOPS.join(', ')}`);
  },
  render(ctx, fr) { E.frame(s06State(ctx.T, fr, STOPS)); },
};
