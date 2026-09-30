// S33, outro bars 89-91 (frames 6347-6531), the film's last image: the opening in reverse.
//   bar 89   the swarm icon (S32's last frame). The eleven ports widen, the shafts swell, and the
//            lantern gives way to the black card: the shafts become the eleven cut rays of the
//            spark (same angles and proportions, lib/spark.js).
//   bar 90   the spark folds shut, one flap at a time counter-clockwise (the reverse of S01's
//            sweep), paced to the wavering vocal tail; the last ray closes on the bar-91 downbeat.
//   bar 91   one square of light; it goes out with the pad's decay; the final frames are black.
import { createSwarm } from '../sets/paper-swarm/swarm.js';
import { createCard } from '../sets/paper-card/card.js';
import { RANK } from '../sets/paper-card/opening.js';
import { smoothstep, clamp } from '../lib/util.js';

const F0 = 6347;
const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);
const easeInOut = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
// rays close counter-clockwise from the last-opened, clustered on the vocal tail's wavers (about 6416,
// 6434-6440, 6452, 6470-6482); the top ray starts at 6481 so it shuts on the bar-91 hit (6493)
const CLOSE_AT = { 10: 6419, 9: 6424, 8: 6433, 7: 6438, 6: 6443, 5: 6451, 4: 6456, 3: 6464, 2: 6470, 1: 6476, 0: 6481 };
const DUR_CLOSE = 16;
const X0 = 6368, X1 = 6404;          // swarm -> card crossfade

let S, Cd, cS, cC, g2;
export default {
  async setup(ctx) {
    cS = document.createElement('canvas'); cS.width = 1920; cS.height = 1080;
    cC = document.createElement('canvas'); cC.width = 1920; cC.height = 1080;
    S = createSwarm(cS, ctx.log);
    Cd = createCard(cC, ctx.log);
    g2 = ctx.canvas.getContext('2d');
  },
  render(ctx, fr) {
    const f = fr.f, { W, H } = ctx;
    const x = smoothstep(X0, X1, f);                    // 0 swarm .. 1 card
    // bar 89: ports widen, the swarm eases back a touch so its shafts match the card's rays
    const wide = easeInOut((f - F0) / (X1 - F0));
    if (x < 1) {
      S.render({ ports: new Array(11).fill(1 + 1.1 * wide), Z: 1 - 0.12 * wide, haze: 1 + 0.5 * wide, paper: 1 - 0.85 * wide,
        bg: 1 - 0.6 * wide, bubGain: 0.55 * (1 - 0.7 * wide), t: fr.t, seed: f % 97 });   // t: the glitter runs on from S32
    }
    // the card: rays open at first, closing through bar 90
    const rays = new Array(11).fill(1);
    for (const j in CLOSE_AT) rays[j] = 1 - easeOut((f - CLOSE_AT[j]) / DUR_CLOSE);
    const pad = ctx.T.envSmooth('other', f, 2);
    const out = f < 6496 ? 1 : clamp(1 - smoothstep(6496, 6521, f)) * (0.35 + 0.65 * clamp(pad / 0.7));   // goes out with the pad
    const breath = 0.95 + 0.06 * ctx.T.envSmooth('vocals', f, 3);
    const light = (0.9 + 0.1 * (1 - x)) * breath * out;
    const fade = 1 - smoothstep(6519, 6527, f);
    if (x > 0) Cd.render({ light, rays, rank: RANK, mc: 1, cc: [960, 540], haze: 0.045 + 0.04 * (1 - x), god: 0.12 + 0.2 * (1 - x),
      fade, floor: fade, seed: f % 97 });
    g2.globalAlpha = 1;
    if (x < 1) g2.drawImage(cS, 0, 0, W, H);
    if (x > 0) { g2.globalAlpha = x; g2.drawImage(cC, 0, 0, W, H); g2.globalAlpha = 1; }
  },
};
