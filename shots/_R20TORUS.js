// Test (agent I, revision 20): the A/B still of the final shelter with the habitat's land curving up
// overhead (a Stanford-torus band of fields, a river and settlement lights) in place of the abstract
// ring, the vocal drop's wave running along it. S31's own state at the frame asked for (shots/S31.js
// s31Params), plus `ringLand`. A still only: node render/render.mjs _R20TORUS --still 5830
import { createShelter } from '../sets/hill/shelter.js';
import { s31Params } from './S31.js';

let sh, glCv, g2, W, H;
export default {
  async setup(ctx) {
    W = ctx.W; H = ctx.H; g2 = ctx.canvas.getContext('2d');
    glCv = document.createElement('canvas'); glCv.width = W; glCv.height = H;
    sh = createShelter(glCv, { log: ctx.log });
    sh.hill.warm([5]);
  },
  render(ctx, fr) {
    const S = ctx.T.shot('S31');
    const p = s31Params(ctx.T, fr.f, S.f0, S.f1 - S.f0);
    // the wave climbs the band from both feet toward the crown (arc length from the crown, m)
    const t = Math.max(0, p.waveT);
    const wave = Math.max(0, 560 - 9.5 * Math.max(0, t - 30));
    sh.render(Object.assign(p, { ringLand: { k: 1, w: 70, wave, waveK: t > 30 && wave > 0 ? 0.9 : 0 } }));
    g2.drawImage(glCv, 0, 0, W, H);
  },
};
