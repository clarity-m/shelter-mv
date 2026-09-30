// S07 (used in the alternate hook-1 order, bar 12): cause and effect after the rack's new cards. The
// new hardware becomes new layers: it opens on S06's last frame (the stack's rows on the rack's rows,
// the lit cards' rows warm), pulls back to a stack growing a layer per beat with attention firing
// faster, and flows into S05 (which dissolves from its last frame). Keyed to its own shot start and
// length, with the music read by global frame (a bass stop inside it would be a held breath, as in
// S04). The state lives in sets/tokens/s07.js so S05 can open on its last frame.
import { createTokenWorld } from '../sets/tokens/world.js';
import { headAt, speedAt, stepAt } from '../sets/tokens/train.js';
import { drawFired } from '../sets/tokens/stack.js';
import { beatRipples, downbeat, breath } from '../sets/tokens/pulse.js';
import { drawHUD } from '../sets/tokens/hud.js';
import { eyesAt, laneOffAt, laneVAt } from '../sets/tokens/hook.js';
import { s07State, MATCH07 } from '../sets/tokens/s07.js';
import { smoothstep } from '../lib/util.js';

let Wd;
const EYES = [{ at: 0 }, { at: 11, dc: -1 }, { at: 29 }, { at: 41, dc: -1 }, { at: 55 }];   // shot-local
const BLINKS = [49];

export default {
  async setup(ctx) { Wd = createTokenWorld(ctx.canvas, { W: ctx.W, H: ctx.H, log: ctx.log }); },
  render(ctx, fr) {
    const T = ctx.T, f0 = fr.f - fr.fl;
    const s = s07State(T, Wd, fr.f, ctx.shot);
    const f = s.f, fl = s.fl;
    const snap = s.sinceSnap < 12 ? Math.pow(0.5, s.sinceSnap / 2.2) : 0;
    const kick = T.pulse('beats', f, 4);
    const db = downbeat(T, f, f0 + 6);
    const lit = new Map();
    for (const h of s.st.fired) lit.set(h.q, Math.max(lit.get(h.q) || 0, h.amp * 0.8));
    const ripples = beatRipples(T, f, { base: 0.6, gain: 0.2, down: 1.1, from: f0 + 6 });
    if (s.sinceSnap < 40) ripples.unshift({ age: s.sinceSnap, amp: 1.3, speed: 150, width: 80 });
    // the levels end on S04's (so S05 opens the same in either order)
    Wd.render({
      f, grainF: fr.f, cam: s.cam, head: headAt(f), speed: speedAt(f), mag: 1, expo: 1.5, tau: 30 + fl * 0.1,
      laneOff: laneOffAt(f), laneV: laneVAt(f), flash: 0.28 * snap, dim: s.held,
      lit, tokG: 1.35, skyG: 0.8, lightG: 1.7, arcsA: 0.4, arcBoost: db.boost, comet: db.comet,
      layers: s.st.layers, thread: 0.8, hot: { layers: MATCH07.hot, amp: s.hotAmp, hw: MATCH07.hw },
      glow: { amp: 1.3 + 0.25 * kick + 0.25 * db.flare + 0.4 * snap, r: 1, burst: 0.9 + 0.2 * kick, rot: s.rot },
      lineG: 1.15 + 0.2 * kick + 0.4 * snap, laneA: 1.7, haloG: breath(T, f) * 1.2, bloom: 1.15,
      ripples: ripples.slice(0, 8), ripLayer: 0.8,
      eyes: eyesAt(fl, EYES, BLINKS),
      drawLight: (g, api) => drawFired(g, api, s.st, 1.7 + db.boost, 1),
      drawUI: (g, api) => drawHUD(g, api, { step: stepAt(f), a: smoothstep(4, 12, fl) }),
    });
  },
};
