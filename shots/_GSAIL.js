// Test shot (brief G): the standalone sail element. The global frame picks a test state:
//   f < 1000: the open sail; 1000..1999: unfurl = (f - 1000) / 1000.
import { createSail } from '../sets/paper-kit/sail.js';
let S;
export default {
  async setup(ctx) { S = createSail(ctx.canvas, { k: ctx.scale, log: ctx.log }); },
  render(ctx, fr) {
    const unfurl = fr.f < 1000 ? 1 : Math.min((fr.f - 1000) / 1000, 1);
    const t0 = performance.now();
    S.render({ x: 1000, y: 470, size: 1, rot: 0.03, glow: 1, beam: 1, beamAng: 0.32, off: [0, 0], sun: [330, 850], unfurl });
    S.sync();
    ctx.log(`sail frame ${(performance.now() - t0).toFixed(0)} ms`);
  },
};
