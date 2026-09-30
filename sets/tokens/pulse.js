// Music-timed light for the pretraining shots (revision 1: "flashes of light timed on the beats").
// Never a full-frame flash: light runs along the token line and up the stack, the halo breathes,
// and on downbeats the attention arcs ignite (a bead of light races out of him along each arc).
import { clamp, smoothstep } from '../../lib/util.js';

// Ripples for world.render: one per recent beat, amplitude from the kick envelope at that beat
// (intro B has only light percussion, so its weak beats stay faint), downbeats stronger.
export function beatRipples(T, f, { from = -Infinity, base = 0.2, gain = 0.8, down = 1.1, halves = null, extra = [] } = {}) {
  const bars = new Set(T.events('bars'));
  const out = [];
  const add = (b, amp) => { const age = f - b; if (age >= 0 && age <= 40 && b >= from && amp > 0.03) out.push({ age, amp }); };
  for (const b of T.events('beats')) {
    if (b > f) break;
    if (f - b > 40) continue;
    let k = 0;
    for (let j = 0; j < 4; j++) k = Math.max(k, T.env('kick', b + j));
    add(b, bars.has(b) ? down : base + gain * k);
  }
  if (halves) for (const b of halves) add(b, 0.45);
  for (const e of extra) add(e.f, e.amp);
  out.sort((a, b) => a.age - b.age);
  return out.slice(0, 8);
}

// Downbeat ignition of the attention bundle: {t, amp} with t running 1 -> 0 (out of him, along the
// arcs to the tokens) over ~14 frames, plus a brightness boost for the whole bundle.
export function downbeat(T, f, from = -Infinity) {
  const s = T.since('bars', f);
  if (s === Infinity || f - s < from) return { comet: null, boost: 0, flare: 0 };
  const t = 1 - Math.pow(clamp(s / 14), 0.75);
  return {
    comet: s <= 16 ? { t: Math.max(0.02, t), amp: 0.85 * (1 - smoothstep(9, 16, s)) } : null,
    boost: 0.9 * Math.pow(0.5, s / 7),
    flare: Math.pow(0.5, s / 5),
  };
}

// Slow breathing of the horizon glow with the music (the bass pump in the hook, the pad in intro B).
export const breath = (T, f, ch = 'bass', r = 3) => 0.88 + 0.28 * T.envSmooth(ch, f, r);
