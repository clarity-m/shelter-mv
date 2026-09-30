// S03, intro B (bars 5-8): the 1D token world. We arrive through the Clawd-shaped hole of S02: the
// frame opens on his warm light, which collapses back into him within the first beat and leaves the
// gray token horizon. He stands on one line of large tokens streaming right to left through him;
// each vocal-chop note lights one token (its pitch picks which) and draws an attention arc to him.
// A small step counter starts. Through the bars 7-8 riser the stream accelerates toward the drop.
import { createTokenWorld, HZ, SX } from '../sets/tokens/world.js';
import { headAt, speedAt, stepAt, chopLevel } from '../sets/tokens/train.js';
import { drawHUD } from '../sets/tokens/hud.js';
import { beatRipples, downbeat, breath } from '../sets/tokens/pulse.js';
import { smoothstep, clamp, easeOut } from '../lib/util.js';

let Wd;
const CY = HZ - 16;
const OFFS = [-8, -3.5, 4, 9, 15];      // chop pitch level -> text offset (chars) of the token it lights

export default {
  async setup(ctx) { Wd = createTokenWorld(ctx.canvas, { W: ctx.W, H: ctx.H, log: ctx.log }); },
  render(ctx, fr) {
    const T = ctx.T, f = fr.f, fl = fr.fl;
    // camera: the flythrough's forward momentum, decelerating; then a slow push through the riser
    const z = 0.9 + 0.1 * easeOut(clamp(fl / 80)) + 0.045 * Math.pow(smoothstep(140, 287, fl), 1.5);
    const cam = { z, fx: SX, fy: CY, px: SX, py: CY };
    // the light we came through collapses into him during the first beat
    const wr = 2600 * Math.pow(1 - smoothstep(0, 17, fl), 1.6) + 40;
    const wash = { amp: 1 - smoothstep(11, 19, fl), r: wr };
    const settle = Math.exp(-Math.max(0, fl - 10) / 14);
    const kick = T.pulse('kicks', f, 5);
    const riser = smoothstep(144, 287, fl);
    const glow = { amp: 1 + 2.2 * settle + 0.2 * kick + 0.2 * riser, r: 1 + 0.6 * settle, burst: 0.8 + 0.8 * settle + 0.15 * kick + 0.1 * riser, rot: 0.03 * fl / 30 };
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
    const step = stepAt(f);
    // light on the music: faint ripples on the light percussion (scaled by the kick envelope),
    // the attention bundle igniting on the downbeats of bars 6-8, the halo breathing with the pad
    const db = downbeat(T, f, fr.f - fl + 60);
    glow.amp += 0.25 * db.flare;
    Wd.render({
      f, cam, head, speed: speedAt(f), expo: 1 + 0.5 * riser, tau: fl * 0.02,
      lit, arcsA: 0.3 + 0.7 * smoothstep(10, 130, fl), arcBoost: db.boost * 0.8, comet: db.comet, glow, wash,
      lineG: 1 + 0.15 * kick + 0.15 * riser, laneA: 1 + 0.4 * riser, haloG: breath(T, f, 'mix', 6),
      ripples: beatRipples(T, f, { base: 0.1, gain: 0.8 + 0.3 * riser, down: 0.9, from: fr.f - fl + 17 }),
      drawLight: (g, api) => {
        // each lit token reaches back to him with one bright arc (drawn on, then fading)
        for (const { idx, age } of fired) {
          const x0 = api.tokX(idx), top = HZ - api.tokCap(idx) - 4;
          const s = Math.abs(SX - x0);
          if (s < 30) continue;
          const p = easeOut(clamp(age / 5));
          const a = 0.55 * Math.pow(0.5, age / 9);
          const h = s * (0.16 + 0.27 * Math.pow(s / SX, 0.7));
          if (x0 < SX) api.arc(g, x0, top, SX, HZ - 3, h, 0.8, a * 0.5, a, 1.2, 0, p);
          else api.arc(g, SX, HZ - 3, x0, top, h, 0.8, a, a * 0.5, 1.2, 1 - p, 1);
        }
      },
      drawUI: (g, api) => drawHUD(g, api, { step, a: smoothstep(22, 40, fl) }),
    });
  },
};
