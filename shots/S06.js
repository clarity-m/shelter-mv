// S06, hook 1, bars 13-14 (frames 875-1018): a GPU rack in layered card at night, with two empty
// bays. On each bass stutter-stop (T.events('stops'): bar 13 and bar 14, beat 4) a GPU sled slides
// in from the camera side and seats (its soft shadow on the rack tightens as it lands); then its
// LEDs light as warm pinholes, one by one, and warm light shows through its vent holes. The help
// arrives as hardware. The camera pushes in slowly.
// Revision 2: data pulses run down the feed cables and into the units, and LED cascades run along
// the rack on the beats, pumping with the kicks; the motion calms down over the last frames.
// Revision 19 (Claire: the pulses read on 2 and 4): the main cascade lands on beats 1 and 3 (a faint
// one on 2 and 4), starting LEAD frames early so its brightest moment falls on the beat; the feeds'
// data pulses swell on 1 and 3 too.
// Revision 21 (Claire): two bars again (13-14, frames 875-1018), keeping both racks' cards. Card 1
// slides in and lights on beat 1 and card 2 on beat 3 (both in the first bar), each seating on its
// beat with its pinholes coming on from the beat; in the second bar both cards pulse on beats 1 and 3
// with the rack, the bass stops at 13.4 and 14.4 hush them, and the shot hard-cuts to the lab at
// bar 15.
// The code is length-agnostic (the lead's A/B): the bars, beats and stops come from the timeline in
// the shot's own range. At one bar (bar 11, frames 731-802, before S07) there is no second bar and no
// stop: the cards light as above, then the rack calms to rest over the last frames with both cards
// lit, for S07's match-dissolve (MATCH.md: S06 -> S07). The camera ends where it always has.
import { createPaper, smooth, clamp, easeOut, easeInOut } from '../sets/paper-kit/kit.js';
import { rackScene, sledXf, RACK, beatWave } from '../sets/paper-kit/rack.js';
const LEAD = 5;          // the cascade is fullest about five frames in

let E, R;                // R: the shot's bars, beats and stops, in local frames (setup reads them)
const SLIDE = 8, LIGHT = 6, CARD_PULSE = 0.9;
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
// R21: the cards' times from the first bar's beats. Card 2 is 95% seated on beat 3 (its whole slide
// shows); card 1 is caught at the cut still sliding (23% out) and seats just after the downbeat. Each
// card's pinholes start a frame before its beat, so the first ones show on the beat.
export function cardTimes(r) {
  const b1 = r.bars[0], b3 = r.beats.find((b) => b >= b1 + 30) ?? b1 + 36;
  return { c1: { from: b1 - 3, light: b1 - 1 }, c2: { from: b3 - 5, light: b3 - 1 } };
}
export function readRange(T, f0, f1) {
  const loc = (name, lo, hi) => T.events(name).filter((f) => f >= lo && f < hi).map((f) => f - f0);
  const r = { bars: loc('bars', f0 - 2, f1 - 2), beats: loc('beats', f0 - 2, f1 - 2), stops: loc('stops', f0, f1) };
  if (!r.bars.length) r.bars = [0];
  return r;
}
export function s06State(T, fr, r = R) {
  const fl = fr.fl, u = fl / (fr.n - 1), C = cardTimes(r);
  const A = sledState(fl, C.c1.from, C.c1.light), B = sledState(fl, C.c2.from, C.c2.light);
  // (revision 2) data pulses stream down the feeds into the rack, and an LED cascade runs along
  // the units on every beat; both pump with the kicks and hush in the bass stops (those in range)
  const kick = T.pulse('kicks', fr.f, 5), w = beatWave(T, fr.f, LEAD);
  let ss = Infinity; for (const s of r.stops) if (s <= fl + 1) ss = fl - s;
  const stopDim = 1 - 0.75 * (ss === Infinity ? 0 : smooth(-1, 1, ss) * (1 - smooth(9, 13, ss)));
  // (R21) with a second bar the pulses run to the cut (the lab follows); with one bar the rack calms
  // to rest over the last frames (S07 match-dissolves out of the final frame)
  const second = r.bars.length > 1 ? r.bars[1] : Infinity;
  const calm = second === Infinity ? 1 - smooth(fr.n - 20, fr.n - 5, fl) : 1;
  const accent = w.main ? 1.25 : 0.15, swell = w.sb === Infinity ? 0 : Math.exp(-Math.max(w.sb - LEAD, 0) / 7) * smooth(0, LEAD, w.sb);
  const servers = { cc: 1.9 * fr.t, cg: (0.35 + 0.8 * (w.main ? swell : 0.15 * swell)) * stopDim * calm };
  const frame = { cc: w.sb === Infinity ? 1 : Math.min(w.sb / 18, 1), cg: accent * (0.5 + 0.5 * kick) * stopDim * calm };
  // (R21) from the second bar both cards pulse too, on beats 1 and 3: their pinholes and the warm
  // light in front of them swell with the cascade (not for a beat past the cut: the lab has it)
  const wBeat = fl - w.sb + LEAD;
  const cp = fl >= second - LEAD && w.main && wBeat < fr.n ? swell * stopDim : 0;
  A.ew = 2.6 * (1 + CARD_PULSE * cp); B.ew = 2.6 * (1 + CARD_PULSE * cp);
  const st = { layers: { sledA: A, sledB: B, servers, frame } };
  // warm light: in front of each seated sled, growing as its pinholes come on
  st.light = { x: 960, y: RACK.bayA + 44, z: 40, I: 1.1e4 * smooth(0.1, 1, A.t) * (1 + 0.6 * cp) };
  st.fills = [{ x: 960, y: RACK.bayB + 44, z: 40, I: 1.1e4 * smooth(0.1, 1, B.t) * (1 + 0.6 * cp), a: 70, f: 420, h: 1 }];
  // the slow push and drift; at one bar the drift eases to rest as well, so the last frames are still
  const drift = second === Infinity ? easeInOut(u) : u;
  st.cam = { c: [960, 470], tz: 420 + 200 * easeInOut(u), t: [16 - 32 * drift, 0], pan: [0, 0] };
  return st;
}
export default {
  async setup(ctx) {
    E = createPaper(ctx.canvas, rackScene(), { k: ctx.scale, log: ctx.log });
    R = readRange(ctx.T, ctx.shot.f0, ctx.shot.f1);
    const C = cardTimes(R);
    ctx.log(`S06: ${ctx.shot.f1 - ctx.shot.f0} frames; bars at local ${R.bars.join(', ')}; stops at ${R.stops.join(', ') || 'none'}; cards from ${C.c1.from} and ${C.c2.from}`);
  },
  render(ctx, fr) { E.frame(s06State(ctx.T, fr, R)); },
};
