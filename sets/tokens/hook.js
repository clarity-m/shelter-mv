// Hook 1 (R19, R20): one source of truth for the cameras and the stack across S03 -> S04 -> S05, so
// the build, the 9.1 snap and the handover into the numbers stay continuous frame to frame.
// R20: S03 starts at 5.2 (frame 317; its first beat went to S02), so everything locked to the music
// is keyed to global frames here; only the arrival out of the wash is keyed to the shot's start.
import { clamp, smoothstep, easeOut, easeInOut, lerp } from '../../lib/util.js';
import { stackState } from './stack.js';
import { HZ, SX } from './world.js';

export const CY = HZ - 16;
export const F03 = 317, F03_END = 586, F04 = 587, F05 = 731;

// ---- S03 (bars 5-8): the forward momentum out of the wash (from the shot's first frame f0), then a
// creep along the line (Clawd drifts from the style frame's spot toward centre) and a push that
// gathers pace into bar 8. The zoom stays <= 1.13, so his cells stay 3 px: the tokens grow, he
// does not.
export function camS03(f, f0 = F03) {
  const creep = easeInOut(clamp((f - 311) / 275));
  const push = Math.pow(smoothstep(359, 586, f), 1.4);
  return {
    z: 0.9 + 0.07 * easeOut(clamp((f - f0) / 80)) + 0.155 * push,
    fx: SX, fy: CY, px: lerp(SX, 1010, creep), py: lerp(CY, CY - 14, creep),
  };
}
// the riser's phases (global frames): the build (7.1 -> 8.3), the drum-out swell (bar 8) and the
// inhale after the riser cuts (8.4, 570-586)
export const phasesS03 = (f) => ({
  build: smoothstep(449, 567, f),
  swell: smoothstep(515, 569, f),
  inhale: smoothstep(570, 586, f),
});
export const magS03 = (f) => 1.25 + 0.35 * phasesS03(f).build;

// ---- S04 (bars 9-10): on 9.1 one clean move, a pull-back and tilt-up that opens the sky for the
// stack (fast out of the snap, settling in half a second), then a slow push.
const WIDE = { z: 0.93, px: SX - 40, py: CY + 130 };
export function camS04(fl) {
  const a = camS03(F03_END), m = easeOut(clamp(fl / 16));
  return {
    z: lerp(a.z, WIDE.z, m) + 0.045 * easeInOut(clamp(fl / 143)),
    fx: SX, fy: CY, px: lerp(a.px, WIDE.px, m), py: lerp(a.py, WIDE.py, m),
  };
}
export const magS04 = (fl) => lerp(magS03(F03_END), 1.0, easeOut(clamp(fl / 16)));
export const flashS04 = (fl) => (fl < 0 || fl > 12 ? 0 : Math.pow(0.5, fl / 2.2));

// The stack of S04 (also read by S05 while it falls back into the line). f is the frame shown.
export function stackS04(T, W, f) {
  return stackState(T, W, f, {
    n: 6, gap: 62, shrink: 0.95, lift0: F04, liftDur: 8, stagger: 0.8, tau: (f - F04) * 0.06,
    from: F04 - 2, fireAll: [611, 620], keys: 9, halfLife: 9,
  });
}

// ---- the other sequences in the batch (the lanes and long-exposure dashes along the line) race
// ahead of the main stream as the riser builds, and keep that pace through the hook. World px of
// extra scroll at frame f, summed from bar 5 (a pure function of f).
const LANE = new Float64Array(1300);
{
  let s = 0;
  for (let f = 0; f < LANE.length; f++) {
    LANE[f] = s;
    const v = f < F04 ? 1.5 + 44 * Math.pow(smoothstep(449, 567, f), 1.5) : 46;
    if (f >= 299) s += v;
  }
}
export const laneOffAt = (f) => LANE[Math.max(0, Math.min(LANE.length - 1, Math.round(f)))];
export const laneVAt = (f) => laneOffAt(f + 1) - laneOffAt(f);

// ---- Clawd acts with his eyes: keys [{ at, dc, row, open }] held until the next key; blinks [at]
// close them for 3 frames. `at` is in whatever frame units the caller passes (global in S03).
export function eyesAt(fl, keys, blinks = []) {
  let e = { dc: 0, row: 1, open: 1 };
  for (const k of keys) if (fl >= k.at) e = { dc: k.dc ?? 0, row: k.row ?? 1, open: k.open ?? 1 };
  for (const b of blinks) if (fl >= b && fl < b + 3) e = { ...e, open: 0 };
  return e;
}
