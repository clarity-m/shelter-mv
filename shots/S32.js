// S32, bars 86-88 (frames 6131-6346; Revision 4 gave the reveal bar 86): one unbroken pull-back, log-scale,
// released from S31's held moment on the bar-86 downbeat and carried out by the held note. It starts inside the
// world the swarm hosts (the shelter), pulls back through the bubble's skin to find the bubble is the hub
// of a slowly turning paper wheel habitat (ring, warm windows, spokes), then out along its band, a
// stream of countless glittering wheels and vellum collectors, until the bands resolve into the
// swarm's shape: crossing orbital rings around Alpha Centauri B, its eleven shafts, A bright beside it,
// the Sun a faint pinhole. Its last frame is S33's first.
// Camera (sets/paper-swarm/swarm.js): a pinhole looking down -z. Z is the magnification of the hero's
// plane; log Z eases in (a smooth start out of S31's frame), runs fast, and decelerates into the icon
// (a Beta-shaped speed profile with a dip while the turning wheel fills the frame). The look-at point
// drifts from the hero to the star.
// The sim world is sets/hill's real shelter (brief H's swap, sets/inside-montage/seam.js): S31's
// last frame, continued by a wider view of the same instant, pre-warped against the bubble's lens
// so that frame 6203 lands on S31's frame 6202 pixel for pixel (bubble radius 1240 px, centred). The seam
// fade: exposure (the warm light only: the bubble's highlight, film glow and haze; the picture itself is
// the base layer) eases in over the first 5 frames, so nothing pops on the cut.
import { createSwarm, GEOM } from '../sets/paper-swarm/swarm.js';
import { buildShelterSeam } from '../sets/inside-montage/seam.js';
import { smoothstep, clamp } from '../lib/util.js';

const R_SEAM = 1240;                               // the bubble's radius on screen at frame 6203 (seam.js)
const Z0 = R_SEAM / (GEOM.hubR * GEOM.nodeR), U_END = 0.88, SEAM_FADE = 5;
// The grade seam: the bubble already carries S31's own grade (its vignette and grain are baked into
// the seam frame), so the swarm's vignette starts at 0 and its grain light, easing to the swarm's
// normal grade (vig 0.18, grain 0.03, as in S33) over the first GRADE_RAMP frames.
const GRADE_RAMP = 12, VIG = 0.18, GRAIN0 = 0.01, GRAIN = 0.03;
// log-zoom progress: the integral of a Beta-shaped speed v^A (1 - v)^B, normalised (tabulated), with a
// brief slowdown (DIP) while the hero wheel fills the frame, so it can be seen turning
const A = 0.8, B = 1.7, NT = 2048, DIP = [0.55, 0.17, 0.07];
const EASE = (() => {
  const t = new Float64Array(NT + 1); let acc = 0;
  for (let i = 1; i <= NT; i++) { const v = (i - 0.5) / NT; acc += Math.pow(v, A) * Math.pow(1 - v, B) * (1 - DIP[0] * Math.exp(-(((v - DIP[1]) / DIP[2]) ** 2))); t[i] = acc; }
  for (let i = 0; i <= NT; i++) t[i] /= acc;
  return t;
})();
const ease = (v) => { v = clamp(v) * NT; const i = Math.min(Math.floor(v), NT - 1), f = v - i; return EASE[i] + (EASE[i + 1] - EASE[i]) * f; };
// the drift of the look-at point from the hero to the star, keyed to the magnification (a drift at high
// magnification would throw the band out of frame): it happens as Z falls from DRIFT_Z to 1
const DRIFT_Z = 8;
// Revision 4 (three bars): a gentle time warp on the whole profile, so the camera leaves S31's held moment
// slowly through bar 86 (the shelter into the bubble takes half a bar, not a beat), rides the held note
// out through the wheels and the band in bar 87, and the swarm still hangs a good while in bar 88.
const WARP = 1.35;

let S, glCanvas, g2, ring;
export default {
  async setup(ctx) {
    if (ctx.scale === 1) glCanvas = ctx.canvas;
    else { glCanvas = document.createElement('canvas'); glCanvas.width = 1920; glCanvas.height = 1080; g2 = ctx.canvas.getContext('2d'); }
    const simSource = await buildShelterSeam(ctx);
    S = createSwarm(glCanvas, ctx.log, { simSource });
    ring = S.HERO_P;                                             // the hero wheel's position (px at the icon)
  },
  render(ctx, fr) {
    const u = clamp(fr.fl / (fr.n - 1));
    const e = ease(Math.pow(clamp(u / U_END), WARP));
    const Z = Math.exp(Math.log(Z0) * (1 - e));
    const w = Math.pow(smoothstep(Math.log(DRIFT_Z), 0, Math.log(Z)), 1.2);
    const cam = [ring[0] * (1 - w), ring[1] * (1 - w)];
    const out = smoothstep(40, 5, Z);                            // the shafts' light comes up as the rings resolve
    const exposure = smoothstep(0, SEAM_FADE, fr.fl);            // the seam fade (see above)
    const gr = smoothstep(0, GRADE_RAMP, fr.fl);                 // the grade seam (see above)
    S.render({ Z, cam, haze: 0.15 + 0.85 * out, bubGain: 0.55 + 0.45 * (1 - out), diffuse: 0.3 + 0.7 * out,
      t: fr.t, seed: fr.f % 97, exposure, vig: VIG * gr, grain: GRAIN0 + (GRAIN - GRAIN0) * gr });
    if (g2) g2.drawImage(glCanvas, 0, 0, ctx.W, ctx.H);
  },
};
