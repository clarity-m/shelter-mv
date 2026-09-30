// S08, hook 1, bars 15-16 (frames 1019-1162): the night lab, human scene 1.
// Revision 5 (Claire, cut 5: start the story earlier): the lab moves into the hook, straight after
// the GPU rack (S06), in place of the transformer reprise. It rides the drop a little while staying
// calm: the screen's glow breathes on the kicks and swells on the chop notes, the dolly runs at twice
// its old speed, and the cursor's small moves land on the chops (3, 24, 64). The push through the
// glass and the fill land on the drop-out at the end of bar 16: the fill is complete on local 131,
// where the music falls silent, then the camera creeps on to the last frame. That last frame is the
// four-bar cut's last frame (cuts 3-4, frame 1450), pixel for pixel: S10 opens on it. To keep it so,
// the ending runs on that cut's clock (REF below), the dust on its time, and in the fill the glow
// settles on that frame's value.
// Revision 2 (Claire, cut 2): the harness is replaced by a computer screen. Clawd lives inside it,
// standing on a grey pixel horizon (a hint of the worlds to come), and his warm glow through the
// screen is the room's light. The approved lab of style-frames/11-paper-lab in motion, kept calm:
//  - a lateral dolly (the camera tracks right and turns to hold the wall), so the paper layers part
//    in parallax: the foreground leaves and researcher A slide, the wall holds, the city through the
//    window slides the other way;
//  - researcher A leans in at the mouse and makes small, careful adjustments; the outside paper
//    cursor (the one that later edits his worlds in S10 and S11) moves beside Clawd on the screen,
//    then eases away as the push begins;
//  - dust drifts in the moonlight shaft;
//  - researcher B stands with the mug, still but for one small head turn toward the glow;
//  - the ending: the camera pushes into the screen's glow, through the glass, and the light blooms
//    until warm light fills the frame. S10 opens from a warm iris; the fill keeps the colour of the
//    previous cut's last frame.
import { createPaper, panFor, toScreen } from '../sets/paper-lab/paper.js';
import { sceneLab, labDust, CURSOR_REST, HAND_REST, MON } from '../sets/paper-lab/scenes.js';
import { clamp, lerp, easeInOut, easeIn } from '../lib/util.js';

let E, SC;
// the cursor's moves: [local frame from, to, dx, dy] (world px from its rest), holds in between;
// A's hand on the mouse makes the same moves, scaled down
const MOVES = [
  [3, 20, -16, -6],       // chop: it drifts in toward Clawd
  [24, 42, -10, -13],     // chop: up beside his head
  [64, 78, -21, -9],      // chop: a last small touch, close to him
  [86, 110, 6, 10],       // it eases away as A sits back and the push begins
];
function cursorOffset(fl) {
  let cur = [0, 0];
  for (const [f0, f1, dx, dy] of MOVES) {
    if (fl <= f0) break;
    const u = easeInOut(clamp((fl - f0) / (f1 - f0), 0, 1));
    cur = [lerp(cur[0], dx, u), lerp(cur[1], dy, u)];
  }
  return cur;
}
const TURN = [37, 79];     // B's head turn toward the glow (from the kick at 37), done before the push
const TURN_HEAD = 0.45;    // (R19) the head alone: the first part of people.js's turn (S20's coda turns him fully)
const FILL_R = 690;        // fill radius: wider than S09's 480 (Clawd covers its hot centre); frame mean matches cut 2
const TZ = 1650;           // push depth: through the glass (the screen fills the frame, about 6.3x)
// the four-bar cut's ending, on its own clock (its local frames 0-287, global 1163-1450): the push,
// the fill (complete from 284), the light's swell and the exposure lift
const REF = { f0: 1163, last: 287, push: [238, 292], fill: [252, 284], swell0: 246, expo0: 258 };
const DROP = 131;          // the drop-out at the end of bar 16: the fill completes here
function refClock(fl, last) {   // this shot's local frame -> the four-bar cut's
  return fl <= DROP ? fl + (REF.fill[1] - DROP) : REF.fill[1] + (REF.last - REF.fill[1]) * (fl - DROP) / (last - DROP);
}

export function s08State(T, fr) {
  const fl = fr.fl, last = fr.n - 1, u = fl / last, fR = refClock(fl, last);
  // camera: constant-speed track (it is cut in and out of), turning to hold the wall still
  const tx = lerp(-80, 80, u);
  const cam = { Zc: SC.cam.Zc, zref: SC.cam.zref, t: [tx, 0], pan: [0.75 * tx, 0], tz: 40 * u };
  // the glow breathes on the kicks and swells on the chop notes; as the light swells into the fill
  // it settles on the four-bar cut's last value
  const swell = easeIn(clamp((fR - REF.swell0) / (REF.fill[1] - REF.swell0), 0, 1));
  const hook = 0.5 + 0.5 * T.pulse('kicks', fr.f, 6) + 0.7 * T.pulse('chops', fr.f, 12);
  const v = hook * (1 - swell) + T.envSmooth('vocals', REF.f0 + REF.last, 8) * swell;
  const light = { I: SC.light.I * (0.84 + 0.22 * v) };
  const [dx, dy] = cursorOffset(fl);
  const turn = easeInOut(clamp((fl - TURN[0]) / (TURN[1] - TURN[0]), 0, 1));
  const pose = {
    A: { hand: [HAND_REST[0] + dx / 3.2, HAND_REST[1] + dy / 8] },
    cursor: [CURSOR_REST[0] + dx, CURSOR_REST[1] + dy],
    B: { turn: TURN_HEAD * turn },
  };
  // the dust on the four-bar cut's time, so the last frame is its last frame
  const st = { cam, light, pose, clawd: SC.clawd, screen: { glow: 0.5 + 0.2 * v }, dust: labDust((REF.f0 + REF.last - (last - fl)) / 30) };
  // the ending: push into the screen's glow, which swells and fills the frame
  const push = easeInOut(clamp((fR - REF.push[0]) / (REF.push[1] - REF.push[0]), 0, 1));
  if (push > 0) {
    const c = SC.clawd, C = [c.x0 + 9 * c.cell, c.y0 + 5 * c.cell], z = c.z;
    const F = [MON.hole[0] + MON.hole[2] / 2, MON.hole[1] + MON.hole[3] / 2];   // the screen's centre
    const S0 = toScreen(cam, F, z);            // where the dolly alone would put it
    cam.tz += TZ * push;
    cam.pan = panFor(cam, F, z, [lerp(S0[0], 960, push), lerp(S0[1], 540, push)]);
    light.I *= 1 + 0.9 * swell;
    st.screen.glow *= 1 + 0.5 * swell;
    const fill = Math.pow(clamp((fR - REF.fill[0]) / (REF.fill[1] - REF.fill[0]), 0, 1), 2);
    const sc = toScreen(cam, C, z);
    st.post = { expo: 1 + 0.15 * easeInOut(clamp((fR - REF.expo0) / (REF.fill[1] - REF.expo0), 0, 1)), fill: [sc[0], sc[1], FILL_R, fill] };
  }
  return st;
}

export default {
  async setup(ctx) {
    SC = sceneLab();
    E = createPaper(ctx.canvas, SC, { k: ctx.scale, log: ctx.log });
  },
  render(ctx, fr) {
    E.frame(s08State(ctx.T, fr));
  },
};
