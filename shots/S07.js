// S07, hook 1 (bars 15-16): back inside, faster.
// In: a match dissolve out of S06's GPU rack (shots.json xin). The shot opens pushed in so its six
// layer rows sit on the rack's six sled rows (120 px apart, y 170..770) and his warm column lines up
// with the sleds' lit vents (x ~978); it then pulls back into the full stack. The new hardware
// becomes new layers: the stack grows one layer per beat of bar 15 up to twelve.
// Light on the music: ripples run out of him along the line and up the stack on every beat (and
// every half-beat in bar 16), the arcs ignite on downbeats, the halo breathes with the bass pump.
// Out: when the music drops out at the end of bar 16 (frames found from the mix envelope in setup)
// the picture cuts to near-black stillness, with Clawd alone and crisp and the counter at 131 072.
import { createTokenWorld, HZ, SX } from '../sets/tokens/world.js';
import { headAt, speedAt, stepAt } from '../sets/tokens/train.js';
import { stackState, drawFired } from '../sets/tokens/stack.js';
import { beatRipples, downbeat, breath } from '../sets/tokens/pulse.js';
import { drawHUD } from '../sets/tokens/hud.js';
import { smoothstep, clamp, easeOut, easeInOut, lerp, hash } from '../lib/util.js';

let Wd, STILL0 = Infinity;
const CY = HZ - 16;
const GAP = 46;
// S06's last frame: sled rows at y 170 + 120 i, lit vents centred near x 978
const MATCH = { z: 120 / GAP, fy: HZ - 3.5 * GAP, px: 978, py: 470 };

export default {
  async setup(ctx) {
    Wd = createTokenWorld(ctx.canvas, { W: ctx.W, H: ctx.H, log: ctx.log });
    // the dropout: first frame in the shot's last bar where the mix falls below 0.4 and stays low
    const s = ctx.shot, T = ctx.T;
    for (let f = s.f1 - 40; f < s.f1; f++) {
      if (T.env('mix', f) < 0.4 && T.env('mix', f + 1) < 0.4 && T.env('drums', f + 1) < 0.1) { STILL0 = f; break; }
    }
    ctx.log(`S07: dropout stillness from frame ${STILL0} to ${s.f1 - 1}`);
  },
  render(ctx, fr) {
    const T = ctx.T, f0 = fr.f - fr.fl;
    const still = fr.f >= STILL0;
    const f = still ? STILL0 - 1 : fr.f;          // stillness holds the last moving frame
    const fl = f - f0;
    // camera: the rack match, then a pull-back (zoom interpolated in log space) into the wide stack
    const pb = easeInOut(clamp((fl - 5) / 26));
    const wz = 0.9 + 0.07 * easeInOut(clamp(fl / 128));
    const z = Math.exp(lerp(Math.log(MATCH.z), Math.log(wz), pb));
    const cam = {
      z, fx: SX, fy: lerp(MATCH.fy, CY, pb),
      px: lerp(MATCH.px, SX - 70, pb), py: lerp(MATCH.py, CY + 205 - 30 * easeInOut(clamp(fl / 128)), pb),
    };
    const shrink = lerp(1, 0.95, pb);             // even rows while matching the rack, then perspective
    // beats of bar 15 add layers (6 -> 12), bar 16 runs passes on half-beats too
    const beats = T.events('beats').filter((b) => b >= f0 - 20 && b < fr.f + 20);
    const halves = [];
    for (const b of beats) { halves.push(b); if (b >= f0 + 72) halves.push(b + 9); }
    const n = 12;
    const st = stackState(T, Wd, f, {
      n, gap: GAP, shrink, lift0: f0 - 40, liftDur: 10, stagger: 0, tau: 40 + fl * 0.12, beats: halves, passSpeed: 0.9,
      keys: 11, span: 90, halfLife: 7, levelShift: 4, from: f0 - 2,
    });
    // layers 7..12 arrive one per beat through bar 15 (after the pull-back has begun)
    for (let l = 7; l <= n; l++) {
      const fb = f0 + 6 + (l - 7) * 12;
      const ee = easeOut(clamp((f - fb) / 7));
      const offPrev = shrink === 1 ? l - 1 : (1 - Math.pow(shrink, l - 1)) / (1 - shrink);
      st.layers.y[l] = HZ - GAP * (offPrev + Math.pow(shrink, l - 1) * ee);
      st.layers.a[l] = ee;
    }
    // extra small heads on every beat, in pseudo-random layers
    for (const b of beats) {
      const age = f - b;
      if (age < 0 || age > 30) continue;
      const lq = 2 + Math.floor(hash(b, 7, 7) * (n - 2));
      if (st.layers.a[lq] <= 0.2) continue;
      const q = Wd.tokAtS(headAt(b) - 2.5 - hash(b, 8, 8) * 6);
      const keys = [];
      for (let j = 0; j < 6; j++) keys.push({ i: q - 1 - Math.floor(Math.pow(hash(b, j, 9), 2) * 60), w: 0.15 + 0.6 * Math.pow(hash(b, j, 10), 2) });
      st.fired.push({ fc: b, age, lq, q, keys, amp: 0.6 * Math.pow(0.5, age / 5) });
    }
    const kick = T.pulse('beats', f, 4);
    const db = downbeat(T, f, f0 + 20);
    const rise = smoothstep(0, 1, fl / 128);
    const step = stepAt(fr.f >= STILL0 ? STILL0 : f);
    const lit = new Map();
    for (const h of st.fired) lit.set(h.q, Math.max(lit.get(h.q) || 0, h.amp * 0.8));
    const halfBeats = halves.filter((b) => b >= f0 + 72 && !beats.includes(b));
    Wd.render({
      f, grainF: still ? STILL0 : fr.f, cam, head: headAt(f), speed: speedAt(f), expo: 1.8, tau: 30 + fl * 0.1,
      lit, arcsA: 0.35, arcBoost: db.boost, comet: db.comet, layers: st.layers, thread: 0.9 + 0.6 * rise,
      glow: { amp: 1.3 + 0.6 * rise + 0.3 * kick + 0.3 * db.flare, r: 1 + 0.15 * rise, burst: 1.0 + 0.35 * rise + 0.25 * kick, rot: 0.6 + fl * 0.006 },
      lineG: 1.1 + 0.25 * kick, laneA: 1.5, bloom: 1 + 0.25 * rise, haloG: breath(T, f),
      ripples: beatRipples(T, f, { base: 0.6, gain: 0.2, down: 1.1, from: f0 + 8, halves: halfBeats }), ripLayer: 0.9,
      black: still ? 0.9935 : 0, uiA: still ? 0.5 : 1, grain: still ? 0.35 : 1,
      drawLight: (g, api) => drawFired(g, api, st, 1 + db.boost),
      drawUI: (g, api) => drawHUD(g, api, { step, a: smoothstep(6, 16, fl) }),
    });
  },
};
