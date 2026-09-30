// Shared helpers for the valley shots: output canvas plumbing, stop freezes, easing, HUD.
import { createValley } from './valley.js';

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeOutBack = (t, c = 1.6) => { t = clamp(t); return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

// The GL canvas is private and the shot's canvas gets a 2D context (for the HUD).
export function makeStage(ctx, opts = {}) {
  const glc = document.createElement('canvas'); glc.width = ctx.W; glc.height = ctx.H;
  const V = createValley(glc, Object.assign({ log: ctx.log }, opts));
  const g2 = ctx.canvas.getContext('2d');
  return { V, glc, g2, k: ctx.H / 1080 };
}

// Stutter-stops: the frame a stop holds (the stop's first frame) and whether f is frozen.
export function freezeOf(T, f) {
  const stops = T.events('stops'), len = T.data().events.stop_len;
  let s = -1;
  for (const x of stops) if (x <= f) s = x;
  if (s >= 0 && f - s < len) return { frozen: true, fe: s, stop: s };
  return { frozen: false, fe: f, stop: s };
}
// "motion time": frames of motion so far, with every stop in [f0, f] paused
export function motionFrames(T, f0, f) {
  const stops = T.events('stops'), len = T.data().events.stop_len;
  let m = f - f0;
  for (const s of stops) {
    if (s < f0 || s > f) continue;
    m -= Math.min(len, f - s + 0);
  }
  return m;
}
// events (global frames) within [a, b)
export const eventsIn = (T, name, a, b) => T.events(name).filter((x) => x >= a && x < b);
