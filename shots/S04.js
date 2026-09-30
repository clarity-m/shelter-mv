// S04, hook 1 (bars 9-10): the first drop, in fast motion. On the downbeat the camera tilts up and
// the token line lifts into a stack of six transformer layers. Every beat a forward pass runs up the
// stack and a backward pass runs down; every chop note fires an attention head whose layer follows
// the note's pitch. The bass stutter-stop on beat 4 of bar 9 freezes the whole picture, which then
// snaps back on at the real time.
import { createTokenWorld, HZ, SX } from '../sets/tokens/world.js';
import { headAt, speedAt, stepAt, holdFrame } from '../sets/tokens/train.js';
import { stackState, drawFired } from '../sets/tokens/stack.js';
import { beatRipples, downbeat, breath } from '../sets/tokens/pulse.js';
import { drawHUD } from '../sets/tokens/hud.js';
import { smoothstep, clamp, easeOut, easeInOut } from '../lib/util.js';

let Wd;
const CY = HZ - 16;

export default {
  async setup(ctx) { Wd = createTokenWorld(ctx.canvas, { W: ctx.W, H: ctx.H, log: ctx.log }); },
  render(ctx, fr) {
    const T = ctx.T, f0 = fr.f - fr.fl;
    const f = holdFrame(T, fr.f);            // the stutter-stop holds the picture
    const fl = f - f0;
    // camera: tilt up as the stack rises (fast, on the downbeat), then a slow push
    const tilt = easeOut(clamp(fl / 16));
    const z = 1.045 - 0.075 * tilt + 0.05 * easeInOut(clamp(fl / 143));
    const cam = { z, fx: SX, fy: CY, px: SX - 60 * tilt, py: CY + 125 * tilt };
    const st = stackState(T, Wd, f, { n: 6, gap: 62, shrink: 0.95, lift0: f0, liftDur: 13, tau: fl * 0.06, from: f0 - 2 });
    const kick = T.pulse('beats', f, 4);
    const db = downbeat(T, f, f0);
    const step = stepAt(f);
    const lit = new Map();
    for (const h of st.fired) lit.set(h.q, Math.max(lit.get(h.q) || 0, h.amp * 0.8));
    Wd.render({
      f, grainF: fr.f, cam, head: headAt(f), speed: speedAt(f), expo: 1.4, tau: 8 + fl * 0.05, profile: 48,
      lit, arcsA: 0.45 + 0.55 * (1 - smoothstep(0, 12, fl)), arcBoost: db.boost, comet: db.comet,
      layers: st.layers, thread: 0.7,
      glow: { amp: 1.12 + 0.25 * kick + 0.25 * db.flare, r: 1, burst: 0.82 + 0.2 * kick, rot: 0.2 + fl * 0.004 },
      lineG: 1.05 + 0.2 * kick, laneA: 1.3, haloG: breath(T, f),
      ripples: beatRipples(T, f, { base: 0.55, gain: 0.2, down: 1.1, from: f0 }),
      drawLight: (g, api) => drawFired(g, api, st, 1 + db.boost),
      drawUI: (g, api) => drawHUD(g, api, { step }),
    });
  },
};
