// S05, hook 1 (bars 11-12): numbers going up, bridged to the transformer on both sides.
// In: it opens exactly where S04 ends (same camera, same six layers, same arcs), and on the bar-11
// downbeat the layers fall into the horizon line; their landing sends light along it. Then a loss
// curve falls in one sweep from the top-left down to the tiny orange figure, and odometers (tokens
// seen, FLOPs, steps) spin to his right. Beads of light run down the curve on every beat.
// Out: on the last beat of bar 12 the curve settles into the horizon and the layers begin to lift
// again. R19: brighter curve, beads and counters (the light layer blooms a little), S04's new snap
// state as the starting point, and his eyes follow the curve down, then glance at the counters.
import { createTokenWorld, HZ, SX } from '../sets/tokens/world.js';
import { headAt, speedAt, stepAt, lossAt, lossSmooth, chopLevel, tokensAt, flopAt } from '../sets/tokens/train.js';
import { drawFired } from '../sets/tokens/stack.js';
import { camS04, stackS04, eyesAt, laneOffAt, laneVAt } from '../sets/tokens/hook.js';
import { beatRipples, downbeat, breath } from '../sets/tokens/pulse.js';
import { drawOdometer, drawLabel } from '../sets/tokens/counters.js';
import { drawHUD } from '../sets/tokens/hud.js';
import { smoothstep, clamp, easeInOut, easeOut, easeIn, lerp } from '../lib/util.js';

let Wd;
const CY = HZ - 16;
const OFFS = [-8, -3.5, 4, 9, 15];
const FALL = 12;                                   // frames for the layers to fall into the line
const EYES = [{ at: 0 }, { at: 14, dc: -1 }, { at: 74 }, { at: 90, dc: 1 }, { at: 118 }];
const BLINKS = [82, 132];

export default {
  async setup(ctx) { Wd = createTokenWorld(ctx.canvas, { W: ctx.W, H: ctx.H, log: ctx.log }); },
  render(ctx, fr) {
    const T = ctx.T, f = fr.f, fl = fr.fl, k = ctx.W / 1920;
    // camera: from S04's last framing to this shot's, during the fall
    const camT = easeInOut(clamp(fl / 22));
    const z5 = 0.94 + 0.04 * easeInOut(clamp(fl / 143));
    const c4 = camS04(143);
    const cam = { z: lerp(c4.z, z5, camT), fx: SX, fy: CY, px: lerp(c4.px, SX - 20, camT), py: lerp(c4.py, CY + 70, camT) };
    const beatP = T.pulse('beats', f, 4);
    const db = downbeat(T, f, fr.f - fl);
    const head = headAt(f), step = stepAt(f), rate = stepAt(f + 1) - step;
    // S04's stack, continued: it falls into the line on the downbeat, and begins to lift in the last beat
    const st = stackS04(T, Wd, f);
    const fall = easeIn(clamp(fl / FALL));
    const rise = clamp((fl - 127) / 16);
    for (let l = 1; l <= 6; l++) {
      const full = HZ - st.layers.y[l];
      const reLift = easeOut(clamp(rise * 1.25 - (l - 1) * 0.05)) * 0.55;
      const h = fl < FALL + 2 ? full * (1 - fall) : full * reLift;
      st.layers.y[l] = HZ - h;
      st.layers.a[l] = fl < FALL + 2 ? 1 - smoothstep(0.75, 1, fall) : smoothstep(0, 0.35, reLift);
    }
    const stackOn = fl < FALL + 2 || rise > 0;
    // chop notes light tokens, as in S03
    const lit = new Map();
    for (const fc of T.events('chops')) {
      if (fc > f || fc < f - 30 || fc < f - fl - 2) continue;
      const age = f - fc, amp = Math.min(1, (age + 1) / 2) * Math.pow(0.5, age / 6);
      const idx = Wd.tokAtS(headAt(fc) + OFFS[chopLevel(fc)]);
      lit.set(idx, Math.max(lit.get(idx) || 0, amp));
    }
    for (const h of st.fired) lit.set(h.q, Math.max(lit.get(h.q) || 0, h.amp * 0.8));
    const chopP = T.pulse('chops', f, 5);
    // the landing of the layers sends one strong ripple
    const ripples = beatRipples(T, f, { base: 0.55, gain: 0.2, down: 1.0, extra: [{ f: fr.f - fl + FALL, amp: 1.2 }] });
    // the curve: sweeps down in bar 11, settles into the horizon in the last beat of bar 12
    const sweep = easeInOut(clamp((fl - 8) / 64));
    const settle = easeInOut(clamp((fl - 124) / 19));
    const Lnow = lossSmooth(step);
    Wd.render({
      f, cam, head, speed: speedAt(f), expo: lerp(1.5, 1.2, camT), tau: 20 + fl * 0.07, reflG: 0.6, profile: 48, laneOff: laneOffAt(f), laneV: laneVAt(f),
      lit, arcsA: lerp(0.45, 0.35, camT), arcBoost: db.boost, comet: db.comet,
      tokG: lerp(1.35, 1.2, camT), skyG: lerp(0.8, 0.86, camT), lightG: lerp(1.7, 1.35, camT),
      layers: stackOn ? st.layers : null, thread: 0.8,
      glow: { amp: lerp(1.3, 1.2, camT) + 0.25 * beatP + 0.3 * chopP + 0.25 * db.flare, r: 1, burst: lerp(0.9, 0.85, camT) + 0.2 * beatP, rot: 0.03 * 287 / 30 + 0.004 * (143 + fl) },
      lineG: lerp(1.15, 1.08, camT) + 0.2 * beatP, laneA: lerp(1.7, 1.4, camT), ripples, haloG: breath(T, f) * lerp(1.2, 1, camT),
      bloom: lerp(1.15, 1.05, camT), eyes: eyesAt(fl, EYES, BLINKS),
      drawLight: (g, api) => {
        const { X, Y } = api;
        if (fl < 30) drawFired(g, api, st, (1 - fall) * (1.7 + db.boost), 1 - fall);
        if (sweep <= 0) return;
        // ---- the loss curve: x ~ (step / now)^0.4, y rescaled so the live value sits at his head
        const x0 = 150, x1 = SX - 4, yTop = 150, yEnd = HZ - 36;
        const xOf = (s) => x0 + (x1 - x0) * Math.pow(s / step, 0.4);
        const yOf = (L) => lerp(yEnd - (L - Lnow) / (10.8 - Lnow) * (yEnd - yTop), HZ - 3, settle);
        const n = 260, nHead = Math.max(1, Math.round(n * sweep));
        const pts = [];
        for (let i = 0; i <= nHead; i++) {
          const s = step * Math.pow(i / n, 1 / 0.4);
          pts.push([X(xOf(s)), Y(yOf(lossAt(s)))]);
        }
        g.lineJoin = 'round'; g.lineCap = 'round';
        const fade = 1 - 0.45 * settle;
        const line = (w, a, i0 = 0, i1 = pts.length - 1) => {
          if (i1 - i0 < 1) return;
          g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = w * k;
          g.beginPath(); for (let i = i0; i <= i1; i++) (i > i0 ? g.lineTo(pts[i][0], pts[i][1]) : g.moveTo(pts[i][0], pts[i][1])); g.stroke();
        };
        line(8, 0.045 * fade); line(2.8, 0.16 * fade); line(1.4, 0.9 * fade);
        // beads of light run down the curve on every beat
        for (const b of T.events('beats')) {
          const age = f - b;
          if (age < 0 || age > 13 || b < fr.f - fl + 10) continue;
          const t = easeIn(clamp(age / 12));
          const i1 = Math.round(t * (pts.length - 1)), i0 = Math.max(0, i1 - 14);
          const a = Math.min(1, 1.0 * (1 - smoothstep(8, 13, age)) * fade);
          line(2.6, a * 0.4, i0, i1); line(1.5, a, Math.max(i0, i1 - 6), i1);
        }
        // the head: a bright point with a short comet glow
        const [hx, hy] = pts[pts.length - 1];
        const ha = Math.min(1, (1.0 * (1 - 0.5 * smoothstep(60, 80, fl)) + 0.35 * chopP) * fade);
        const gr = g.createRadialGradient(hx, hy, 0, hx, hy, 26 * k);
        gr.addColorStop(0, `rgba(255,255,255,${0.55 * ha})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(hx - 26 * k, hy - 26 * k, 52 * k, 52 * k);
        g.fillStyle = `rgba(255,255,255,${ha})`; g.beginPath(); g.arc(hx, hy, 2.6 * k, 0, 7); g.fill();
        // axis ticks: faint loss gridlines with labels on the left
        const ga = smoothstep(10, 24, fl) * (1 - settle);
        for (const Lg of [10, 8, 6, 4]) {
          if (Lg <= Lnow + 0.2 || ga <= 0) continue;
          const yy = Y(yOf(Lg));
          g.fillStyle = `rgba(255,255,255,${0.065 * ga})`; g.fillRect(X(x0), yy, X(x1) - X(x0), Math.max(1, k * 0.8));
          drawLabel(g, Lg.toFixed(1), X(x0) - 44 * k, yy + 4 * k, 12 * k, 0.4 * ga);
        }
        // live loss readout riding the head
        const la = smoothstep(12, 22, fl) * (1 - settle);
        if (la > 0) {
          drawLabel(g, 'LOSS', hx - 150 * k, hy - 34 * k, 12 * k, 0.5 * la);
          g.font = `${(22 * k).toFixed(2)}px Consolas, monospace`;
          g.fillStyle = `rgba(255,255,255,${Math.min(1, 1.0 * la)})`;
          g.fillText(lossAt(step * Math.pow(nHead / n, 1 / 0.4)).toFixed(4), hx - 150 * k, hy - 10 * k);
        }
        // ---- odometers to his right
        const cx = X(SX + 120);
        const rows = [
          { label: 'TOKENS', value: tokensAt(step), rate: tokensAt(rate), size: 34, y: 395 },
          { label: 'FLOP', value: flopAt(step), rate: flopAt(rate), size: 24, y: 480 },
          { label: 'STEP', value: step, rate, size: 34, y: 565 },
        ];
        rows.forEach((r, i) => {
          const a = smoothstep(10 + i * 5, 20 + i * 5, fl) * (1 - 0.3 * settle) * (1 - 0.7 * rise);
          const y = Y(r.y);
          drawLabel(g, r.label, cx, y - r.size * k * 1.05, 12 * k, 0.5 * a);
          drawOdometer(g, { value: r.value, rate: r.rate, x: cx, y, size: r.size * k * cam.z, alpha: Math.min(1, 0.95 * a * (1 + 0.12 * beatP)) });
        });
      },
      // S04's corner HUD fades as the big counters take over
      drawUI: fl < 12 ? (g, api) => drawHUD(g, api, { step, a: 1 - smoothstep(0, 10, fl) }) : null,
    });
  },
};
