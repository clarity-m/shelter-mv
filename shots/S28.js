// S28, build 2, bar 72 (frames 5123-5194; revision 5: one bar): the launch gantry at night.
// It opens exactly on S27's last beat (the rocket dark beside its tower). The engines light on the
// bar-72 downbeat: the flame and the exhaust billows are tissue, and they glow orange as they
// grow; the tower's swing arms swing back just after. The camera pushes toward the pad.
// The black beat: in bar 72's second half the melodic parts drop out (the 'other' and 'vocals'
// stems fall away and only a drum fill remains until the bar-73 drop); the cut to black lands on
// the beat nearest that drop-out (frame 5177) and holds to the end of the shot.
import { createPaper, smooth, easeInOut, clamp } from '../sets/paper-kit/kit.js';
import { launchScene, launchState } from '../sets/paper-kit/launch.js';

let E, BLACK;
function findBlack(T) {
  // first frame in bar 72's second half where the melodic stems have fallen away
  const b72 = T.frameOf(T.barTime(72)), mid = b72 + 36, end = T.frameOf(T.barTime(73));
  let fd = end - 18;
  for (let f = mid; f < end; f++) if (T.env('other', f) < 0.5 && T.env('vocals', f) < 0.5 && T.env('mix', f) < 0.6) { fd = f; break; }
  const beats = T.events('beats');
  let best = fd, bd = 1e9;
  for (const b of beats) if (Math.abs(b - fd) < bd) { bd = Math.abs(b - fd); best = b; }
  return best;
}

// Local frame 0 is the bar-72 downbeat and must stay the dark opening state (S27's paper beats
// render this function at frame 0): every term below is exactly 0 there.
export function s28State(T, fr) {
  const fl = fr.fl;
  const eng = smooth(0, 12, fl) * 0.55 + smooth(8, 40, fl) * 0.5;       // ignition on the downbeat
  const breathe = 1 + 0.06 * (T.envSmooth('other', fr.f, 3) - 0.6);
  const st = launchState({
    eng: eng * breathe, rise: 0, arms: easeInOut(clamp((fl - 4) / 24, 0, 1)),   // the arms swing back
    clouds: smooth(0, 54, fl), plumeOn: 0, pulse: T.pulse('snares', fr.f, 4) * 0.5,
  });
  const u = clamp(fl / 54, 0, 1);                                         // (black from local 54)
  st.cam = { c: [1000, 720], tz: 330 + 110 * easeInOut(u), t: [0, 18 * u], pan: [0, 0] };
  st.sky = { starD: 0.12, moon: [300, 170, 15] };
  st.post = { fade: 1 };
  st.layers.farHills = { ew: 1.3 };                                       // the lit city on the horizon (revision 7)
  return st;
}

export default {
  async setup(ctx) {
    E = createPaper(ctx.canvas, launchScene({ city: true }), { k: ctx.scale, log: ctx.log });
    BLACK = findBlack(ctx.T);
    ctx.log(`S28 black beat from frame ${BLACK}`);
  },
  render(ctx, fr) {
    const st = s28State(ctx.T, fr);
    if (fr.f >= BLACK) st.post.fade = 0;
    E.frame(st);
  },
};
