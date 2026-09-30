// S07's state as a pure function of the frame, keyed to its own shot (start f0, end f1), so it works
// wherever the shot list puts it (the alternate hook-1 order has it at bar 12, between the one-bar
// rack and S05) and so S05 can open on its last frame.
// - It opens on S06's last frame (agent O's MATCH.md): six layer rows on the rack's six rows (121.2 px
//   apart), the token line on the next row down, Clawd's column under the lit vents (x 981.5), at
//   zoom 1 (his cells stay 3 px). The rows of the lit cards (bays A and B: layers 5 and 2) carry
//   their warm light through the dissolve. Held still for the xin.
// - One pull-back closes the rows into a stack that grows a layer on each of beats 2-4 (to nine),
//   with attention firing faster: the whole stack on every beat and chop, pairs on the eighths.
// - A bass stop inside the shot is a held breath (as S04); with none (bar 12) it flows straight on.
import { HZ, SX } from './world.js';
import { stackState } from './stack.js';
import { breathAt } from './hook.js';
import { hash, smoothstep, clamp, easeOut, easeInOut, lerp } from '../../lib/util.js';

export const MATCH07 = { gap: 121.2, x: 981.5, y0: 898.2, hot: [5, 2], hw: 165 };
const N = 9;

// fr_f is the real frame; it may lie past the shot (S05 keeps this stack running while it falls).
export function s07State(T, W, fr_f, sh) {
  const f0 = sh.f0, f1 = sh.f1, n = f1 - f0;
  const br = breathAt(T, fr_f, f0, f1);
  const f = br.fe, fl = f - f0;
  const m = easeInOut(clamp((fl - 5) / 20));
  const cam = {
    z: lerp(1.0, 0.9, m) + 0.03 * easeInOut(clamp((fl - 25) / 34)),
    fx: SX, fy: HZ, px: lerp(MATCH07.x, 1110, m), py: lerp(MATCH07.y0, 846, m),
  };
  const gap = lerp(MATCH07.gap, 56, m), shrink = lerp(1, 0.95, m);
  // attention fires faster here: the whole stack on every beat and chop, pairs on the eighths
  const fires = [];
  for (let b = f0 + 18; b < f1; b += 18) fires.push({ f: b, level: 0, all: true });
  for (let b = f0 + 9; b < f1; b += 18) fires.push({ f: b, level: 1 + Math.floor(hash(b, 3, 7) * 5), all: false });
  const halves = [];                                             // passes start after the match hold
  for (let b = f0 + 9; b < f1; b += 9) halves.push(b);
  const st = stackState(T, W, f, {
    n: N, gap, shrink, lift0: f0 - 60, liftDur: 8, stagger: 0, tau: 40 + fl * 0.12, beats: halves,
    passSpeed: 0.7, keys: 7, span: 80, halfLife: 6, cascade: 0.8, from: f0 + 14, until: f1,
    fireAll: T.events('chops').filter((c) => c >= f0 + 14 && c < f1), fires,
  });
  const L = st.layers;
  const off = (l) => (shrink === 1 ? l : (1 - Math.pow(shrink, l)) / (1 - shrink));
  for (let l = 1; l <= N; l++) {
    if (l <= 6) { L.y[l] = HZ - gap * off(l); L.a[l] = 1; continue; }
    const at = f0 + 18 * (l - 6);                               // layers 7-9 on beats 2-4
    const ee = easeOut(clamp((f - at + 2) / 7));                // rises out of the layer below
    L.y[l] = HZ - gap * (off(l - 1) + Math.pow(shrink, l - 1) * ee);
    L.a[l] = ee;
  }
  st.fired = st.fired.filter((h) => L.a[h.lq] > 0.5 && (h.lq === 1 || L.a[h.lq - 1] > 0.5));
  return {
    cam, st, f, fl, n, held: br.b, sinceSnap: br.sinceSnap,
    hotAmp: 1.4 * (1 - easeOut(clamp(fl / 16))),
    rot: 0.859 - 0.004 * (n - 1 - fl),                          // ends where S05's rays start
  };
}
