// S06, hook 1, bar 11 (frames 731-802): a GPU rack in layered card at night, with two empty bays. GPU
// sleds slide in from the camera side and seat (each soft shadow on the rack tightens as it lands);
// then their LEDs light as warm pinholes, one by one, and warm light shows through their vent holes.
// The help arrives as hardware. The camera pushes in slowly.
// Revision 2: data pulses run down the feed cables and into the units, and LED cascades run along
// the rack on the beats, pumping with the kicks.
// Revision 19 (Claire: the pulses read on 2 and 4): the main cascade lands on beats 1 and 3 (a faint
// one on 2 and 4), starting LEAD frames early so its brightest moment falls on the beat.
// Revision 21: both racks' cards, one on each of two beats; the code reads its bars and beats from
// the shot's own range, so it works at any length.
// Revision 22 (Claire picked the alternate hook order: S06 is bar 11, and S07 match-dissolves out of
// its last frame). Her timing note: the bar sounds like chord-kick-kick-kick, so the cards go in on
// beats 2 and 3. The chord on beat 1 shows the rack; card 1 slides in and lights on the beat-2 kick
// (749) and card 2 on the beat-3 kick (767); the beat-4 kick (785) pulses through both cards, and
// the rack's cascade rides the three kicks. No stop treatments. After the beat-4 pulse the rack
// settles over the last frames, so the frame S07 dissolves from is at rest, with both cards lit
// and the composition unchanged (MATCH.md: S06 -> S07).
import { createPaper, smooth, clamp, easeOut, easeInOut } from '../sets/paper-kit/kit.js';
import { rackScene, sledXf, RACK } from '../sets/paper-kit/rack.js';
const LEAD = 5;          // the cascade is fullest about five frames in

let E, R;                // R: the shot's bars and beats, in local frames (setup reads them)
const SLIDE = 8, LIGHT = 6, CARD_PULSE = 1.2, SETTLE = 10;
// a sled: its approach starts at `from` and eases in over SLIDE frames; its pinholes light one by
// one over LIGHT frames from `lightAt`
function sledState(fl, from, lightAt) {
  if (fl < from) return { op: 0, z: 520, t: 0, a: 1 };
  const p = clamp((fl - from) / SLIDE, 0, 1);
  const a = 1 - easeOut(p);
  const bump = fl > from + SLIDE ? 0.012 * Math.exp(-(fl - from - SLIDE) / 2.5) * Math.sin((fl - from - SLIDE) * 1.7) : 0;
  const xf = sledXf(Math.max(a + bump, 0));
  const t = clamp((fl - lightAt) / LIGHT, 0, 1);
  return Object.assign(xf, { op: 1, t, a });
}
// R22: the cards' times from the first bar's beats 2 and 3. Each card is 95% seated on its beat (its
// whole slide shows), and its pinholes start a frame before it, so the first ones show on the beat.
export function cardTimes(r) {
  const b1 = r.bars[0], at = (k) => r.beats.find((b) => b >= b1 + 18 * k - 6) ?? b1 + 18 * k;
  const b2 = at(1), b3 = at(2);
  return { c1: { from: b2 - 5, light: b2 - 1 }, c2: { from: b3 - 5, light: b3 - 1 } };
}
export function readRange(T, f0, f1) {
  const loc = (name) => T.events(name).filter((f) => f >= f0 - 2 && f < f1 - 2).map((f) => f - f0);
  const r = { bars: loc('bars'), beats: loc('beats') };
  if (!r.bars.length) r.bars = [0];
  return r;
}
// the beat wave at fl: frames since it started (LEAD before its beat) and where its beat sits. The
// accents are the kicks: beats 2-4 of the first bar (the chord is on 1); a later bar keeps R19's 1, 3.
export function waveAt(r, fl) {
  let b = null;
  for (const x of r.beats) if (x - LEAD <= fl) b = x;
  if (b === null) return { sb: Infinity, main: false, k: -1, bar: 0 };
  let bs = r.bars[0], bar = 0;
  r.bars.forEach((x, j) => { if (x <= b + 1) { bs = x; bar = j; } });
  const k = Math.round((b - bs) / 18);
  return { sb: fl - (b - LEAD), main: bar === 0 ? k >= 1 : k % 2 === 0, k, bar };
}
export function s06State(T, fr, r = R) {
  const fl = fr.fl, u = fl / (fr.n - 1), C = cardTimes(r);
  const A = sledState(fl, C.c1.from, C.c1.light), B = sledState(fl, C.c2.from, C.c2.light);
  // (revision 2) data pulses stream down the feeds into the rack, and an LED cascade runs along the
  // units on every beat, pumping with the kicks. They settle over the last SETTLE frames (after the
  // beat-4 pulse), so the frame S07 dissolves from is at rest.
  const kick = T.pulse('kicks', fr.f, 5), w = waveAt(r, fl);
  const settle = 1 - smooth(fr.n - SETTLE, fr.n - 2, fl);
  const accent = w.main ? 1.25 : 0.15, swell = w.sb === Infinity ? 0 : Math.exp(-Math.max(w.sb - LEAD, 0) / 7) * smooth(0, LEAD, w.sb);
  const servers = { cc: 1.9 * fr.t, cg: (0.35 + 0.8 * (w.main ? swell : 0.15 * swell)) * settle };
  const frame = { cc: w.sb === Infinity ? 1 : Math.min(w.sb / 18, 1), cg: accent * (0.5 + 0.5 * kick) * settle };
  // (R22) once both cards are in, the next kick pulses through both: their pinholes and the warm light
  // in front of them swell with the cascade (the first bar's beat 4; in any later bar its accents)
  const cp = w.main && (w.bar > 0 || w.k >= 3) ? swell * settle : 0;
  A.ew = 2.6 * (1 + CARD_PULSE * cp); B.ew = 2.6 * (1 + CARD_PULSE * cp);
  const st = { layers: { sledA: A, sledB: B, servers, frame } };
  // warm light: in front of each seated sled, growing as its pinholes come on
  st.light = { x: 960, y: RACK.bayA + 44, z: 40, I: 1.1e4 * smooth(0.1, 1, A.t) * (1 + 0.8 * cp) };
  st.fills = [{ x: 960, y: RACK.bayB + 44, z: 40, I: 1.1e4 * smooth(0.1, 1, B.t) * (1 + 0.8 * cp), a: 70, f: 420, h: 1 }];
  // the slow push and drift, both easing to rest on the last frame (the rows S07 matches, MATCH.md)
  st.cam = { c: [960, 470], tz: 420 + 200 * easeInOut(u), t: [16 - 32 * easeInOut(u), 0], pan: [0, 0] };
  return st;
}
export default {
  async setup(ctx) {
    E = createPaper(ctx.canvas, rackScene(), { k: ctx.scale, log: ctx.log });
    R = readRange(ctx.T, ctx.shot.f0, ctx.shot.f1);
    const C = cardTimes(R);
    ctx.log(`S06: ${ctx.shot.f1 - ctx.shot.f0} frames; bars at local ${R.bars.join(', ')}; beats ${R.beats.join(', ')}; cards from ${C.c1.from} and ${C.c2.from}`);
  },
  render(ctx, fr) { E.frame(s06State(ctx.T, fr, R)); },
};
