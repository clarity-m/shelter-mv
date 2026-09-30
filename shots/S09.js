// S09, verse 1, bars 21-24 (frames 1451-1738): the hands, human scene 2. The one time in the
// film a human holds Claude. Opens on the approved detail frame (style-frames/11-paper-lab/
// detail.png): silhouette hands cup glowing Clawd, the harness waiting on the bench at right.
//  - bars 21-23: the hands carry him in a low arc to the harness (the camera follows, with
//    parallax) and lower him over it; at the release the hands open like a flower and slide
//    away beneath him, and he drifts down into the cage (his light sinks behind the band);
//  - bars 23-24: the harness ribs curl closed over him (its giant shadow hands on the wall
//    close with them) as the hands withdraw out of frame;
//  - bar 24: the camera pushes into the glow; the light swells until warm light fills the
//    frame on the final beat (frame 1721). Hard cut to the first environment after.
// Clawd stays crisp #D97757 throughout (exact cells, composited last).
import { createPaper, panFor } from '../sets/paper-lab/paper.js';
import { sceneHands, HANDS_REST } from '../sets/paper-lab/scenes.js';
import { clamp, lerp, easeInOut, easeIn } from '../lib/util.js';

const P0 = [820, 567];      // Clawd's centre in the detail frame (world px)
const DROP = [1540, 772];   // where the hands let him go, above the harness
const SEAT = [1540, 917];   // seated in the harness: feet on the band (y 982)
const BEAT_LAST = 270;      // local frame of bar 24 beat 4 (frame 1721)
const ez = (fl, a, b) => easeInOut(clamp((fl - a) / (b - a), 0, 1));
const rot = (p, c, a) => { const s = Math.sin(a), co = Math.cos(a), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * co - y * s, c[1] + x * s + y * co]; };

// the hands' path: a small offering lift, then a low arc to the drop point
function carry(fl) {
  const lift = -6 * ez(fl, 0, 24), u = ez(fl, 24, 176);
  return [lerp(P0[0], DROP[0], u), lerp(P0[1] + lift, DROP[1], u) - 34 * Math.sin(Math.PI * u)];
}
function clawdAt(fl) {
  const c = carry(fl);
  return [c[0], lerp(c[1], SEAT[1], ez(fl, 180, 218))];
}
function handsPose(fl) {
  const u = ez(fl, 24, 176), lean = 0.07 * Math.sin(Math.PI * u);
  const open = ez(fl, 172, 212), part = ez(fl, 176, 220), down = ez(fl, 186, 246);
  const a = carry(fl), D = [a[0] - P0[0], a[1] - P0[1] + 600 * down];
  const out = {};
  for (const k of ['L', 'R']) {
    const b = HANDS_REST[k], sd = b.side;
    // open the cup: the palms turn outward, the fingers straighten and fan, the hands part
    let w = [b.wx + sd * (80 * part + 70 * down), b.wy];
    let pa = b.pa + sd * 0.45 * open, fa = b.fa + sd * 0.2 * open;
    // carry: the pair leans toward the harness mid-arc, pivoting on Clawd
    w = rot(w, P0, lean); pa += lean; fa += lean;
    out[k] = {
      ...b, wx: w[0] + D[0], wy: w[1] + D[1], pa, fa,
      spread: b.spread.map(v => v * (1 + 0.35 * open)),
      flex: b.flex.map(f => f.map(v => v * (1 - 0.38 * open))),
      thumb: { spread: b.thumb.spread * (1 + 0.5 * open), flex: b.thumb.flex.map(v => v * (1 - 0.4 * open)) },
    };
  }
  return out;
}

let E, SC;
export function s09State(T, fr) {
  const fl = fr.fl;
  const C = clawdAt(fl);
  const z = lerp(520, 420, ez(fl, 180, 218));
  // Clawd's glow breathes with the voice, then swells into the push
  const v = T.envSmooth('vocals', fr.f, 8);
  const swell = easeIn(clamp((fl - 226) / (BEAT_LAST - 226), 0, 1));
  const light = { x: C[0], y: C[1], z, I: 2.3e5 * (0.84 + 0.22 * v) * (1 + 0.9 * swell) };
  // camera: still at first, then follows the carry (with parallax), then pushes into the glow
  const w = ez(fl, 16, 90);
  let S = [lerp(820, 1150, ez(fl, 24, 176)), lerp(567, 610, ez(fl, 24, 176))];
  S[1] = lerp(S[1], 690, ez(fl, 180, 218));
  const push = ez(fl, 214, BEAT_LAST + 22);   // still easing in over the last frames, so the held light stays alive
  S = [lerp(S[0], 960, push), lerp(S[1], 560, push)];
  S = [lerp(C[0], S[0], w), lerp(C[1], S[1], w)];
  const cam = { Zc: SC.cam.Zc, zref: SC.cam.zref, t: [0.4 * (C[0] - P0[0]) * w, 0.3 * (C[1] - P0[1]) * w], tz: 30 * ez(fl, 24, 176) + 530 * push };
  cam.pan = panFor(cam, C, z, S);
  const fill = Math.pow(clamp((fl - 222) / (BEAT_LAST - 222), 0, 1), 2);   // gathers on beats 2-3, fills on beat 4
  const sc = toScreenC(cam, C, z);
  return {
    cam, light,
    pose: { hands: handsPose(fl), curl: ez(fl, 198, 262) },
    clawd: { x0: C[0] - 117, y0: C[1] - 65, cell: 13, z },
    post: { expo: 1 + 0.15 * ez(fl, 240, BEAT_LAST), fill: [sc[0], sc[1], 480, fill] },
  };
}
function toScreenC(cam, p, z) {
  const d = cam.Zc - z, e = Math.max(d - cam.tz, 1), s = d / e, Dref = cam.Zc - cam.zref;
  return [960 + (p[0] - 960) * s + cam.pan[0] - cam.t[0] * Dref / e, 540 + (p[1] - 540) * s + cam.pan[1] - cam.t[1] * Dref / e];
}

export default {
  async setup(ctx) {
    SC = sceneHands();
    E = createPaper(ctx.canvas, SC, { k: ctx.scale, log: ctx.log });
  },
  render(ctx, fr) {
    E.frame(s09State(ctx.T, fr));
  },
};
