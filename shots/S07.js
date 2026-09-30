// S07, hook 1 (bar 14, frames 947-1018; R20): cause and effect after S06's new GPU card. The new
// hardware becomes new layers.
// - It opens on S06's last frame (agent O's MATCH.md, "Revision 20: S06 -> S07"): the stack's six
//   layer rows sit on the rack's six rows (y 171 ... 777, 121.2 px apart), the token line on the next
//   row down, and Clawd's column under the lit card's vents (x 981.5). The card's row (layer 5)
//   carries its warm light for the dissolve; the empty bay's row (layer 2) is dark and fills in on
//   the first eighth. Held still for the xin dissolve, at zoom 1, so Clawd keeps his 3 px cells.
// - Then one pull-back over a beat: the rows close up into the stack, which grows a layer on each
//   of beats 2-4 (to nine), with attention firing faster across the taller stack: every beat and the
//   two chops fire heads up the whole stack, every eighth between fires a pair.
// - The bass stop on 14.4 (1006) freezes the picture, with the step counter on 131 072 (the style
//   frame's value); the bass stays out to the bar line, so the freeze holds to the hard cut.
import { createTokenWorld, HZ, SX } from '../sets/tokens/world.js';
import { headAt, speedAt, stepAt } from '../sets/tokens/train.js';
import { stackState, drawFired } from '../sets/tokens/stack.js';
import { beatRipples, downbeat, breath } from '../sets/tokens/pulse.js';
import { drawHUD } from '../sets/tokens/hud.js';
import { eyesAt, laneOffAt, laneVAt } from '../sets/tokens/hook.js';
import { hash, smoothstep, clamp, easeOut, easeInOut, lerp } from '../lib/util.js';

let Wd;
const MATCH = { gap: 121.2, x: 981.5, y0: 898.2 };     // rows at y0 - 121.2 l = 777 ... 171 (l = 1..6)
const FREEZE = 1006;                                     // 14.4: the bass stop
const HOT = 5, EMPTY = 2;                                // the lit card's row, the empty bay's row
const N = 9;
const NEW = { 7: 965, 8: 983, 9: 1001 };                 // a layer per beat on 14.2-14.4
const EYES = [{ at: 0 }, { at: 958, dc: -1 }, { at: 976 }, { at: 988, dc: -1 }, { at: 1000 }];
const BLINKS = [994];

export default {
  async setup(ctx) { Wd = createTokenWorld(ctx.canvas, { W: ctx.W, H: ctx.H, log: ctx.log }); },
  render(ctx, fr) {
    const T = ctx.T, f0 = fr.f - fr.fl;
    const f = Math.min(fr.f, FREEZE);                    // the stop freezes the picture to the cut
    const fl = f - f0;
    // the match, held for the dissolve, then one pull-back over a beat and a slow push to the stop
    const m = easeInOut(clamp((fl - 5) / 20));
    const cam = {
      z: lerp(1.0, 0.9, m) + 0.03 * easeInOut(clamp((fl - 25) / 34)),
      fx: SX, fy: HZ, px: lerp(MATCH.x, 1110, m), py: lerp(MATCH.y0, 846, m),
    };
    const gap = lerp(MATCH.gap, 56, m), shrink = lerp(1, 0.95, m);
    // attention fires faster here: the whole stack on every beat and on the chops, pairs on the eighths
    const fires = [];
    for (let b = f0 + 18; b < f0 + 72; b += 18) fires.push({ f: b, level: 0, all: true });
    for (let b = f0 + 9; b < f0 + 72; b += 18) fires.push({ f: b, level: 1 + Math.floor(hash(b, 3, 7) * 5), all: false });
    const halves = [];
    for (let b = f0 - 18; b < f0 + 72; b += 9) halves.push(b);
    const st = stackState(T, Wd, f, {
      n: N, gap, shrink, lift0: f0 - 60, liftDur: 8, stagger: 0, tau: 40 + fl * 0.12, beats: halves,
      passSpeed: 0.7, keys: 7, span: 80, halfLife: 6, cascade: 0.8, from: f0 + 14,
      fireAll: [971, 986], fires,
    });
    const L = st.layers;
    const off = (l) => (shrink === 1 ? l : (1 - Math.pow(shrink, l)) / (1 - shrink));
    for (let l = 1; l <= N; l++) {
      if (l <= 6) { L.y[l] = HZ - gap * off(l); L.a[l] = 1; continue; }
      const ee = easeOut(clamp((f - NEW[l] + 2) / 7));      // rises out of the layer below, on its beat
      L.y[l] = HZ - gap * (off(l - 1) + Math.pow(shrink, l - 1) * ee);
      L.a[l] = ee;
    }
    L.a[EMPTY] = lerp(0.12, 1, easeOut(clamp((fl - 3) / 7)));
    st.fired = st.fired.filter((h) => L.a[h.lq] > 0.5 && (h.lq === 1 || L.a[h.lq - 1] > 0.5));
    for (let l = 1; l <= N; l++) L.pulse[l] = Math.min(1.8, L.pulse[l] + (l === EMPTY ? 1.2 * smoothstep(3, 6, fl) * (1 - smoothstep(8, 16, fl)) : 0));
    const kick = T.pulse('beats', f, 4);
    const db = downbeat(T, f, f0 + 6);
    const lit = new Map();
    for (const h of st.fired) lit.set(h.q, Math.max(lit.get(h.q) || 0, h.amp * 0.8));
    const still = fr.f >= FREEZE;
    Wd.render({
      f, grainF: fr.f, cam, head: headAt(f), speed: speedAt(f), mag: 1, expo: 1.6, tau: 30 + fl * 0.1,
      laneOff: laneOffAt(f), laneV: laneVAt(f),
      lit, tokG: 1.3, skyG: 0.8, lightG: 1.7, arcsA: 0.35, arcBoost: db.boost, comet: db.comet,
      layers: L, thread: 0.9, hot: { layer: HOT, amp: 1.4 * (1 - easeOut(clamp(fl / 16))), hw: 165 },
      glow: { amp: 1.35 + 0.3 * kick + 0.25 * db.flare, r: 1, burst: 1.0 + 0.25 * kick, rot: 0.6 + fl * 0.006 },
      lineG: 1.15 + 0.25 * kick, laneA: 1.6, haloG: breath(T, f) * 1.2, bloom: 1.15,
      ripples: beatRipples(T, f, { base: 0.6, gain: 0.2, down: 1.1, from: f0 + 6 }).slice(0, 8), ripLayer: 0.8,
      eyes: eyesAt(f, EYES, BLINKS),
      drawLight: (g, api) => drawFired(g, api, st, 1.7 + db.boost, 1),
      drawUI: (g, api) => drawHUD(g, api, { step: stepAt(f), a: still ? 1 : smoothstep(4, 12, fl) }),
    });
  },
};
