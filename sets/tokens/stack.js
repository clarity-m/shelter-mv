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
  // opts.fireAll: chop frames that fire a head in every layer, cascading up the stack onto one token
  // column (R19: the first arcs fire across the whole stack); other chops fire the pitch's layer and
  // the one above it.
  // opts.fires: extra fire events [{ f, level, all }] (S07 fires on the beats and 8ths too)
  const fireAll = new Set(opts.fireAll || []);
  const events = T.events('chops').map((fc) => ({ f: fc, level: chopLevel(fc), all: fireAll.has(fc) }))
    .concat(opts.fires || []);
  // opts.defer [a, b]: events in [a, b) fire at b instead (S04: a chop inside the held breath fires
  // fresh on the snap back)
  const dfr = opts.defer;
  for (const ev of events) {
    const fc = dfr && ev.f >= dfr[0] && ev.f < dfr[1] ? dfr[1] : ev.f;
    const age0 = f - fc;
    if (age0 < 0 || age0 > 48 || fc < (opts.from ?? 0) || ev.f >= (opts.until ?? Infinity)) continue;
    const l0 = Math.min(n, 1 + ev.level + (opts.levelShift ?? 0));
    const all = ev.all;
    const ls = all ? Array.from({ length: n }, (_, i) => i + 1) : (opts.pair === false || l0 >= n ? [l0] : [l0, l0 + 1]);
    const q = W.tokAtS(headAt(fc) - (opts.qOff ?? 2.5));
    ls.forEach((lq, j) => {
      const age = age0 - (all ? (lq - 1) * (opts.cascade ?? 1.3) : j * 1.5);
      if (age < 0 || lq < 1 || a[lq] <= 0) return;
      const seed = fc + 97 * lq;
      const keys = [];
      const K = opts.keys ?? 9;
      for (let jj = 0; jj < K; jj++) {
        const span = 1 + Math.floor(Math.pow(hash(seed, jj, 41), 2.2) * (opts.span ?? 70));
        const w = jj === 0 ? 1 : 0.15 + 0.85 * Math.pow(hash(seed, jj, 42), 2.5);
        keys.push({ i: q - span, w });
      }
      const amp = Math.pow(0.5, age / (opts.halfLife ?? 8));
      fired.push({ fc: seed, age, lq, q, keys, amp });
      lit.set(q * 64 + lq, Math.max(lit.get(q * 64 + lq) || 0, amp));
      for (const kk of keys) lit.set(kk.i * 64 + lq - 1, Math.max(lit.get(kk.i * 64 + lq - 1) || 0, amp * kk.w * 0.6));
    });
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
export function drawFired(g, api, st, gain = 1, land = 0) {
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
    // a little bloom where the fan lands: a soft point of light on the query as the arcs arrive
    if (land > 0) {
      const e = clamp((h.age - 2) / 2) * Math.pow(0.5, Math.max(0, h.age - 4) / 5) * land;
      if (e > 0.01) {
        const X = api.X(xq), Y = api.Y(yq - 2), r = 20 * api.k * Math.sqrt(api.cam.z);
        const gr = g.createRadialGradient(X, Y, 0, X, Y, r);
        gr.addColorStop(0, `rgba(255,255,255,${Math.min(1, 0.95 * e).toFixed(3)})`);
        gr.addColorStop(0.25, `rgba(255,255,255,${Math.min(1, 0.35 * e).toFixed(3)})`);
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(X - r, Y - r, 2 * r, 2 * r);
      }
    }
  }
}
