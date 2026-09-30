// S04, hook 1 (bars 9-10): the first drop (R19: a decisive snap). On 9.1 the light that gathered
// into Clawd at the end of S03 bursts out as a white bloom flash along the line; in that flash the
// token line lifts into a stack of six transformer layers, and the camera makes one clean move, a
// pull-back and tilt-up that opens the sky for the stack. The first chops (611, 620) fire attention
// heads across the whole stack, cascading up every layer onto one token column; the chops between
// fire the pitch's layer and the one above. Arcs are brighter, with a small bloom where each fan
// lands. Every beat runs a forward pass up the stack and a backward pass down.
// R22 (Claire: the stop treatments interrupted the flow): the bass stop on 9.4 plays straight
// through at full speed. The shot now hard-cuts to the rack at bar 11, so it ends on a clean hit:
// the last chop (725) fans across the whole stack and lands, blooming, just before the cut, as the
// camera's slow push comes to rest.
// R23 (Claire: the visualization stands on its own): no corner STEP / LOSS HUD.
import { createTokenWorld } from '../sets/tokens/world.js';
import { headAt, speedAt } from '../sets/tokens/train.js';
import { drawFired } from '../sets/tokens/stack.js';
import { beatRipples, downbeat, breath } from '../sets/tokens/pulse.js';
import { camS04, magS04, flashS04, stackS04, eyesAt, phasesS03, laneOffAt, laneVAt } from '../sets/tokens/hook.js';
import { clamp, easeOut, lerp } from '../lib/util.js';

let Wd;
const EYES = [{ at: 0 }, { at: 25, dc: -1 }, { at: 46 }, { at: 96, dc: -1 }, { at: 113 }, { at: 139, dc: -1 }];
const BLINKS = [124];
const END3 = phasesS03(586);             // S03's last state, which S04 leaves in its first half-second

export default {
  async setup(ctx) { Wd = createTokenWorld(ctx.canvas, { W: ctx.W, H: ctx.H, log: ctx.log }); },
  render(ctx, fr) {
    const T = ctx.T, f = fr.f, fl = fr.fl, f0 = fr.f - fr.fl;
    const m = easeOut(clamp(fl / 16));       // the one camera move out of the snap
    const flash = flashS04(fl);
    const st = stackS04(T, Wd, f);
    for (let l = 1; l <= st.layers.n; l++) st.layers.pulse[l] = Math.min(2.2, st.layers.pulse[l] + 1.4 * flash);
    const kick = T.pulse('beats', f, 4);
    const db = downbeat(T, f, f0);
    const lit = new Map();
    for (const h of st.fired) lit.set(h.q, Math.max(lit.get(h.q) || 0, h.amp * 0.8));
    // the burst out of him on 9.1 runs along the line; then the beats
    const ripples = beatRipples(T, f, { base: 0.55, gain: 0.2, down: 1.1, from: f0 + 1 });
    if (fl >= 0 && fl < 40) ripples.unshift({ age: fl, amp: 1.8, speed: 150, width: 90 });
    Wd.render({
      f, cam: camS04(fl), head: headAt(f), speed: speedAt(f), mag: magS04(fl), profile: 48,
      expo: lerp(1.9, 1.5, m), tau: 8 + fl * 0.05, flash, laneOff: laneOffAt(f), laneV: laneVAt(f),
      // every level starts at S03's last value and eases to the drop's during the camera move
      lit, tokG: lerp(1.8, 1.35, m), skyG: lerp(1 - 0.12 * END3.build - 0.1 * END3.inhale, 0.8, m), lightG: lerp(1.3, 1.7, m),
      arcsA: lerp(1.5, 0.45, m), arcBoost: db.boost, comet: db.comet,
      layers: st.layers, thread: 0.8,
      glow: {
        amp: lerp(1.75, 1.3, m) + 0.25 * kick + 0.25 * db.flare + 1.2 * flash, r: lerp(0.85, 1, m) + 0.4 * flash,
        burst: lerp(1.35, 0.9, m) + 0.2 * kick + 0.8 * flash, rot: 0.03 * 287 / 30 + fl * 0.004,
      },
      lineG: lerp(1.8, 1.15, m) + 0.2 * kick + 1.5 * flash, laneA: lerp(2.1, 1.7, m), haloG: breath(T, f) * lerp(1.35, 1.2, m),
      bloom: lerp(1.55, 1.15, m),
      ripples: ripples.slice(0, 8),
      eyes: eyesAt(fl, EYES, BLINKS),
      drawLight: (g, api) => drawFired(g, api, st, 1.7 + db.boost, 1),
    });
  },
};
