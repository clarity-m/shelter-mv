// S26, build 2, bar 68 (frames 4835-4906, one bar): the paper twin of S25c's two points of light.
// A paper observatory on a ridge. The two pinholes, Alpha Centauri A (brighter) and B, are lit
// from the first frame exactly where S25c's crowd marked its two points (MATCH.md). The dome's
// slit opens a notch on each chop in the bar, spilling warm light that climbs the haze toward
// them. The camera eases in a little.
import { createPaper, smooth, easeInOut } from '../sets/paper-kit/kit.js';
import { obsScene, obsState, OBS } from '../sets/paper-kit/observatory.js';

let E, CHOPS;
// the camera at the first frame (MATCH.md): the pinholes' screen positions follow from it
export const CAM0 = { c: [1180, 560], tz: 100, t: [0, 0], pan: [0, 0] };
export const PINS = [[OBS.stars[0][0], OBS.stars[0][1], 2.3, 1.75], [OBS.stars[1][0], OBS.stars[1][1], 1.8, 1.2]];
export function s26State(T, fr, chops) {
  const fl = fr.fl, u = fl / (fr.n - 1);
  // the shutters open a notch on each chop note, easing over 6 frames, with a faint crack first
  let open = 0;
  chops.forEach((c) => { open += smooth(c, c + 6, fl) / Math.max(chops.length, 1); });
  open = 0.06 * smooth(0, 6, fl) + 0.94 * open;
  const st = obsState({ open, glow: 0.2 + 0.8 * smooth(0, 1, open), breath: 1 + 0.06 * T.pulse('snares', fr.f, 4) });
  st.cam = { c: CAM0.c, tz: CAM0.tz + 130 * easeInOut(u), t: [0, -14 * u], pan: CAM0.pan };
  st.sky = { starD: 0.16, starB: 1.1, pins: PINS };
  return st;
}
export default {
  async setup(ctx) {
    E = createPaper(ctx.canvas, obsScene(), { k: ctx.scale, log: ctx.log });
    const f0 = ctx.shot.f0, f1 = ctx.shot.f1;
    CHOPS = ctx.T.events('chops').filter((f) => f >= f0 && f < f1 - 4).map((f) => f - f0);
    if (CHOPS.length < 2) CHOPS = [8, 44, 62];
    ctx.log(`S26 chops at local ${CHOPS.join(', ')}`);
  },
  render(ctx, fr) { E.frame(s26State(ctx.T, fr, CHOPS)); },
};
