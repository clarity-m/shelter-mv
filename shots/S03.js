// S03, intro B (bars 5-8): the 1D token world, building with the riser into the bar-9 drop (R19).
// We arrive through S02's light (xin 9): his warm wash collapses back into him within the first beat
// and leaves the grey token horizon. He stands on one line of tokens streaming right to left through
// him; each vocal-chop note lights one token (its pitch picks which) with an arc to him, and he
// glances at it. Bars 5-6 read: the tokens near him are large and legible. From bar 7 the build:
// the stream speeds up, the lens around him swells the tokens larger, the line and the other
// sequences brighten, the sky darkens for contrast, and the camera creeps along the line. Bar 8's
// drum-out swells; on 8.4 the riser cuts, and in that gap the light gathers along the line into him.
// Colour stays his alone: the build is light, contrast and motion.
// R20: the shot starts at 5.2 (frame 317; S02 took its first beat). The arrival out of the wash is
// keyed to the shot's first frame; everything locked to the music (the creep, the build, the
// glances) is keyed to global frames, so the build to 9.1 is unchanged.
// R23 (Claire: the visualization stands on its own): no corner STEP / LOSS HUD.
import { createTokenWorld, HZ, SX } from '../sets/tokens/world.js';
import { headAt, speedAt, chopLevel } from '../sets/tokens/train.js';
import { beatRipples, downbeat, breath } from '../sets/tokens/pulse.js';
import { camS03, phasesS03, magS03, eyesAt, F04, laneOffAt, laneVAt } from '../sets/tokens/hook.js';
import { smoothstep, clamp, easeOut } from '../lib/util.js';

let Wd;
const OFFS = [-8, -3.5, 4, 9, 15];      // chop pitch level -> text offset (chars) of the token it lights
const GATHER = 571;                      // the riser cuts: light runs in along the line, arriving on 9.1
// glances in global frames, each just after a chop lights a token on that side
const EYES = [
  { at: 0 }, { at: 356, dc: -1 }, { at: 377 }, { at: 397, dc: 1 }, { at: 419 },
  { at: 469, dc: 1 }, { at: 489 }, { at: 507, dc: 1 }, { at: 561 },
];
const BLINKS = [437, 531];

export default {
  async setup(ctx) { Wd = createTokenWorld(ctx.canvas, { W: ctx.W, H: ctx.H, log: ctx.log }); },
  render(ctx, fr) {
    const T = ctx.T, f = fr.f, fl = fr.fl, f0 = fr.f - fr.fl;
    const cam = camS03(f, f0);
    const { build, swell, inhale } = phasesS03(f);
    // the light we came through collapses into him during the first beat
    const wr = 2600 * Math.pow(1 - smoothstep(0, 17, fl), 1.6) + 40;
    const wash = { amp: 1 - smoothstep(11, 19, fl), r: wr };
    const settle = Math.exp(-Math.max(0, fl - 10) / 14);
    const kick = T.pulse('kicks', f, 5);
    const db = downbeat(T, f, 360);          // the arcs ignite on the downbeats of bars 6-8
    const glow = {
      amp: 1 + 2.2 * settle + 0.2 * kick + 0.25 * db.flare + 0.3 * build + 0.45 * inhale,
      r: 1 + 0.6 * settle - 0.15 * inhale,
      burst: 0.55 + 0.9 * settle + 0.12 * kick + 0.4 * build + 0.4 * inhale,
      rot: 0.001 * (f - 299),
    };
    // chop notes light tokens
    const head = headAt(f);
    const lit = new Map(), fired = [];
    for (const fc of T.events('chops')) {
      if (fc > f || fc < f - 45 || fc < fr.f - fl - 12) continue;
      const age = f - fc;
      const amp = Math.min(1, (age + 1) / 2) * Math.pow(0.5, age / 7);
      const idx = Wd.tokAtS(headAt(fc) + OFFS[chopLevel(fc)]);
      lit.set(idx, Math.max(lit.get(idx) || 0, amp));
      fired.push({ idx, age });
    }
    // light on the music: ripples on the light percussion (scaled by the kick envelope), the fill's
    // hits on 8.4, and after the riser cuts one front of light converging on him from both sides
    const ripples = beatRipples(T, f, {
      base: 0.1, gain: 0.8 + 0.4 * build, down: 0.9, from: fr.f - fl + 17,
      extra: [{ f: 569, amp: 0.9 }, { f: 574, amp: 0.55 }],
    });
    if (f >= GATHER) ripples.unshift({ age: f - GATHER, amp: 1.25, speed: -1500 / (F04 - GATHER), width: 70 });
    Wd.render({
      f, cam, head, speed: speedAt(f), mag: magS03(f), expo: 1 + 0.9 * build, tau: (f - 299) * 0.02, laneOff: laneOffAt(f), laneV: laneVAt(f),
      lit, tokG: 1.45 + 0.35 * build, skyG: 1 - 0.12 * build - 0.1 * inhale, lightG: 1 + 0.3 * build,
      arcsA: 0.3 + 0.7 * smoothstep(10, 130, fl) + 0.5 * swell, arcBoost: db.boost * 0.8, comet: db.comet,
      glow, wash, bloom: 1 + 0.35 * build + 0.2 * inhale,
      lineG: 1 + 0.15 * kick + 0.5 * build + 0.3 * swell, laneA: 1 + 1.1 * build,
      haloG: breath(T, f, 'mix', 6) * (1 + 0.35 * build),
      ripples: ripples.slice(0, 8),
      eyes: eyesAt(f, EYES, BLINKS),
      drawLight: (g, api) => {
        // each lit token reaches back to him with one bright arc (drawn on, then fading)
        for (const { idx, age } of fired) {
          const x0 = api.tokX(idx), top = HZ - api.tokCap(idx) - 4;
          const s = Math.abs(SX - x0);
          if (s < 30) continue;
          const p = easeOut(clamp(age / 5));
          const a = (0.55 + 0.25 * build) * Math.pow(0.5, age / 9);
          const h = s * (0.16 + 0.27 * Math.pow(s / SX, 0.7));
          if (x0 < SX) api.arc(g, x0, top, SX, HZ - 3, h, 0.8, a * 0.5, a, 1.2, 0, p);
          else api.arc(g, SX, HZ - 3, x0, top, h, 0.8, a, a * 0.5, 1.2, 1 - p, 1);
        }
      },
    });
  },
};
