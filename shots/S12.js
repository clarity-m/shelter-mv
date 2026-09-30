// S12, pre-chorus 1b (bars 31-32, frames 2171-2314): the drums cut out. Clawd stands alone in a flat
// white field: the camera is at ground level, so the whole field is one line under him (he keeps
// the size and place he had through S11's flicks). He looks around, then up, and rises on tiptoe.
// From the bar-32 downbeat the camera starts to rise and pitch down: the plane tilts open, its grid
// fanning out from under his feet toward a vanishing point; the drum fill carries the tilt home.
// Last frame (the hand-off to S13 on the bar-33 downbeat): Clawd centred, feet at (960, 604),
// 128 px tall, on the ground plane in perspective with the vanishing point at (960, 331.5).
import { drawField, F } from '../sets/early-env/field.js';
import { clamp, lerp, easeInOut, easeOut, smoothstep } from '../lib/util.js';
// revision 20 (P): the humans' cursor swoops in over the last beat, into S13's first click (sets/valley/swoop.js)
import { createPaperCursor, PAPER } from '../sets/valley/papercursor.js';
import { swoopAt } from '../sets/valley/swoop.js';

const END = 140;                              // the tilt settles here; the last frames hold
const HC1 = 1.572, DZ0 = 13.9, DZ1 = 8.516, HY0 = 620, HY1 = 331.5;

function tilt(fl) { return 0.3 * smoothstep(72, 108, fl) + 0.7 * easeInOut(clamp((fl - 104) / (END - 104))); }

function camAt(fl) {
  const u = tilt(fl);
  const dz = lerp(DZ0, DZ1, easeInOut(clamp(fl / END)));
  const hc = HC1 * Math.pow(u, 1.2);
  const hy = lerp(HY0, HY1, u);
  return { cam: { hc, dz, pd: Math.atan((540 - hy) / F) }, u };
}

function poseAt(fl) {
  const e = (a, b) => easeInOut(clamp((fl - a) / (b - a)));
  // eyes: still looking ahead from the walk, then left, right, up
  let dx = lerp(0.6, 0, e(2, 12));
  dx = lerp(dx, -0.75, e(20, 27)); dx = lerp(dx, 0.75, e(34, 40)); dx = lerp(dx, 0, e(46, 52));
  const up = e(48, 58) * (1 - 0.7 * e(100, 118)) * (1 - e(126, 134));
  const head = 1.0 * up;
  const lift = 0.75 * e(60, 70) * (1 - e(98, 112));
  let eyes = { dx, dy: -1.3 * up };
  if ((fl >= 12 && fl < 15) || (fl >= 88 && fl < 91)) eyes = { kind: 'closed', dy: eyes.dy };
  // the plane opening under him: wide eyes; then settle, with a small crouch before the drop
  if (fl >= 112 && fl < 128) eyes = { ...eyes, kind: 'tall' };
  const sy = 1 - 0.06 * e(134, 143);
  return { head, lift, eyes, sy };
}

let g, k, CUR;
export default {
  async setup(ctx) { g = ctx.canvas.getContext('2d'); k = ctx.W / 1920; CUR = createPaperCursor(23); },
  render(ctx, fr) {
    const fl = fr.fl;
    g.setTransform(k, 0, 0, k, 0, 0);
    const { cam, u } = camAt(fl);
    const R = fl < 72 ? 0 : 1 + 72 * Math.pow(u, 1.5);
    drawField(g, { cam, R, tint: 0.9 * u, line: 1 - 0.75 * u, pose: poseAt(fl) });
    const sw = swoopAt(fr.f);
    if (sw) { g.setTransform(k, 0, 0, k, 0, 0); CUR.draw(g, sw.x, sw.y, { s: 2.0, rot: sw.rot, fill: PAPER.slate, bs: 2.0 * k / 1.45 }); }
  },
};
