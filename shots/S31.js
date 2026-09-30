// S31, drop 2 + vocal (bars 81-85), rung 5: the shelter. The final environment Claude built
// to shelter people: the hill, the tree, a faceless figure sitting at its foot and Clawd
// sitting beside her, radiant. Behind the hill a skyline of slender lit towers under a ring
// that arches across the sky. The camera cranes up slowly; every kick pulses the city's
// windows. On beat 4 of bar 85 the bass stops: the world holds its breath (time freezes, the
// lights ease down, Clawd's light draws in), and the shot ends on that held moment. S32's
// pull-back lets it go on the bar-86 downbeat (Revision 4: the reveal gets that bar).
// Revision 1: tiny figures gather out of the light on the far ridge and kites rise over the far
// slopes in bar 81; she leans back once, on the phrase at 6002; Clawd blinks and glances up at her.
import { createShelter, s31Anim } from '../sets/hill/shelter.js';
import { smoothstep, clamp } from '../lib/util.js';

let sh, glCanvas;
export const HOLD0 = 6118, HOLD1 = 6131;   // the stop on bar 85 beat 4 .. the bar-86 downbeat

// The shelter's render state at global frame f, for a shot starting at f0 that is nFrames long.
// Shared with the S32 seam (sets/inside-montage/seam.js), which renders S31's last frame wider.
export function s31Params(T, f, f0, nFrames) {
  // held time: frozen from the stop until the next downbeat
  const held = clamp(f - HOLD0, 0, HOLD1 - HOLD0);
  const fe = f - held;                                  // effective frame
  const n = nFrames - 1 - Math.max(0, Math.min(f0 + nFrames, HOLD1) - HOLD0);
  const u = clamp((fe - f0) / n, 0, 1);                 // crane progress
  const inHold = f >= HOLD0 && f < HOLD1;
  const breath = inHold ? smoothstep(HOLD0, HOLD0 + 8, f) : 0;
  // kicks pulse the city: a quick lift, a soft decay
  const kick = inHold ? 0 : T.pulse('kicks', f, 5);
  const vox = T.envSmooth('vocals', f, 5);
  return {
    time: 150 + fe / 30,
    crane: u,
    cityPulse: 0.5 * kick,
    towerWin: 0.9 * (1 - 0.25 * breath),
    clawdGlow: 1.0 + 0.12 * (vox - 0.5) + 0.12 * breath,
    // revision 1: the far slopes fill with people and kites during bar 81, she leans back on
    // the phrase at 6002, Clawd blinks and glances up at her (all frozen through the hold)
    ...s31Anim(fe),
  };
}

export default {
  async setup(ctx) {
    glCanvas = ctx.canvas;
    sh = createShelter(glCanvas, { log: ctx.log });
    sh.hill.warm([5]);
  },
  render(ctx, fr) {
    sh.render(s31Params(ctx.T, fr.f, fr.f - fr.fl, fr.n));
  },
};
