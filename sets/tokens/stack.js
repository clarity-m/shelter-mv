// The transformer stack for S04 and S07: the token line lifts into stacked layers of hidden-state
// dashes; every beat sends a forward pass up the stack (and a dimmer backward pass down); every
// vocal-chop note fires one attention head: arcs from earlier tokens in layer l-1 converge on a
// query token in layer l, where l follows the note's pitch (the melody climbs the stack).
import { hash, clamp, easeOut } from '../../lib/util.js';
import { headAt, chopLevel } from './train.js';

const easeOutBack = (t) => { t = clamp(t); const c = 1.35; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

// f: the frame the picture shows (after stop holds). opts: n layers, gap (world px), lift0 (frame the
// lift starts), liftDur, tau (weight churn time), beats (frames), qOff (query offset, chars).
export function stackState(T, W, f, opts) {
  const { n, gap, lift0, liftDur = 12, tau = 0 } = opts;
  const HZ = 664;
  const y = [HZ], a = [1], pulse = [0], e = [1];
  for (let l = 1; l <= n; l++) {
    const t = (f - lift0 - (l - 1) * (opts.stagger ?? 1.4)) / liftDur;
    const el = t <= 0 ? 0 : easeOutBack(t);
    e.push(el);
    const r = opts.shrink ?? 1;                       // mild perspective: upper layers pack closer
    const off = r === 1 ? l : (1 - Math.pow(r, l)) / (1 - r);
    y.push(HZ - off * gap * el);
    a.push(clamp(t * 3));
  }
  // forward pass up on every beat, backward pass down right after it
  const beats = opts.beats || T.events('beats');
  const up = opts.passSpeed ?? 1.5;
  for (let l = 1; l <= n; l++) {
    let p = 0;
    for (const fb of beats) {
      const d = f - fb;
      if (d < -2 || d > 60) continue;
      p += Math.exp(-Math.pow((d - l * up) / 2.4, 2));
      p += 0.45 * Math.exp(-Math.pow((d - (n * up + 3) - (n - l) * up) / 3.0, 2));
    }
    pulse.push(Math.min(p, 1.6));
  }
  // attention heads fired by chop notes
  const fired = [], lit = new Map();
  for (const fc of T.events('chops')) {
    const age = f - fc;
    if (age < 0 || age > 40 || fc < (opts.from ?? 0)) continue;
    const lq = Math.min(n, 1 + chopLevel(fc) + (opts.levelShift ?? 0));
    if (lq < 1 || a[lq] <= 0) continue;
    const q = W.tokAtS(headAt(fc) - (opts.qOff ?? 2.5));
    const keys = [];
    const K = opts.keys ?? 9;
    for (let j = 0; j < K; j++) {
      const span = 1 + Math.floor(Math.pow(hash(fc, j, 41), 2.2) * (opts.span ?? 70));
      const w = j === 0 ? 1 : 0.15 + 0.85 * Math.pow(hash(fc, j, 42), 2.5);
      keys.push({ i: q - span, w });
    }
    const amp = Math.pow(0.5, age / (opts.halfLife ?? 8));
    fired.push({ fc, age, lq, q, keys, amp });
    lit.set(q * 64 + lq, Math.max(lit.get(q * 64 + lq) || 0, amp));
    for (const kk of keys) lit.set(kk.i * 64 + lq - 1, Math.max(lit.get(kk.i * 64 + lq - 1) || 0, amp * kk.w * 0.6));
  }
  const act = (i, l) => {
    const tt = tau + hash(i, l, 5) * 4;
    const k0 = Math.floor(tt), fr = tt - k0, s = fr * fr * (3 - 2 * fr);
    const v = hash(i, l, 11 + k0) * (1 - s) + hash(i, l, 12 + k0) * s;
    return Math.pow(v, 1.6);
  };
  return { layers: { n, y, a, e, pulse, act, lit }, fired };
}

// Arcs of the fired heads, drawn on the light layer in world coordinates.
export function drawFired(g, api, st, gain = 1) {
  const { layers, fired } = st;
  for (const h of fired) {
    const yq = layers.y[h.lq], yk = layers.y[h.lq - 1];
    const xq = api.tokX(h.q);
    const p = easeOut(clamp((h.age + 1) / 4));
    for (const kk of h.keys) {
      const xk = api.tokX(kk.i);
      const s = xq - xk;
      if (s < 2) continue;
      const a = (0.10 + 0.55 * kk.w) * h.amp * gain;
      const hh = Math.min(22 + s * 0.2, 260) * (0.8 + 0.4 * hash(h.fc, kk.i, 3));
      api.arc(g, xk, yk - 2, xq, yq - 2, hh, 0.85, a * 0.35, a, 1.0 + 0.6 * kk.w, 0, p);
      if (kk.w > 0.6) api.arc(g, xk, yk - 2, xq, yq - 2, hh, 0.85, a * 0.03, a * 0.10, 5, 0, p);
    }
  }
}
