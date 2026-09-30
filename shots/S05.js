// S05: numbers going up. Keyed to its own shot start and length, with the music read by global frame,
// so the same code serves both hook-1 orders:
// - main (cut 18): bars 11-12, after S04 (it opens on S04's last frame, xin 6), no bass stops, and in
//   the last beat the curve settles into the horizon as the layers begin to lift, into the rack;
// - alternate (A/B): bars 13-14, after S07 (it opens on S07's last frame, xin 6), and the bass stops
//   on 13.4 and 14.4 step the loss down, each a held breath (as S04's), the last one into the cut.
// In: the previous shot's stack falls into the horizon line on the downbeat. Then a loss curve falls
// in one sweep from the top-left down to the tiny orange figure, and odometers (tokens seen, FLOPs,
// steps) spin to his right. Beads of light run down the curve on every beat, and his eyes follow the
// curve down, then glance at the counters.
import { createTokenWorld, HZ, SX } from '../sets/tokens/world.js';
import { headAt, speedAt, stepAt, lossAt, lossSmooth, chopLevel, tokensAt, flopAt } from '../sets/tokens/train.js';
import { drawFired } from '../sets/tokens/stack.js';
import { camS04, stackS04, eyesAt, laneOffAt, laneVAt, breathAt, stopsIn } from '../sets/tokens/hook.js';
import { s07State } from '../sets/tokens/s07.js';
import { beatRipples, downbeat, breath } from '../sets/tokens/pulse.js';
import { drawOdometer, drawLabel } from '../sets/tokens/counters.js';
import { drawHUD } from '../sets/tokens/hud.js';
import { smoothstep, clamp, easeInOut, easeOut, easeIn, lerp } from '../lib/util.js';

let Wd;
const CY = HZ - 16;
const OFFS = [-8, -3.5, 4, 9, 15];
const FALL = 12;                                   // frames for the layers to fall into the line
const DROP = 0.2;                                  // the loss steps down this much on each bass stop
const EYES = [{ at: 0 }, { at: 14, dc: -1 }, { at: 74 }, { at: 90, dc: 1 }, { at: 118 }];
const BLINKS = [82, 132];
// a camera in S07's form (focus on the line) expressed in S04's form (focus on his middle)
const toCY = (c) => ({ z: c.z, fx: SX, fy: CY, px: c.px, py: c.py + (CY - c.fy) * c.z });

export default {
  async setup(ctx) { Wd = createTokenWorld(ctx.canvas, { W: ctx.W, H: ctx.H, log: ctx.log }); },
  render(ctx, fr) {
    const T = ctx.T, k = ctx.W / 1920, sh = ctx.shot, f0 = sh.f0, f1 = sh.f1, n = f1 - f0;
    const br = breathAt(T, fr.f, f0, f1);              // bass stops inside the shot: held breaths
    const f = br.fe, fl = f - f0;
    const snap = br.sinceSnap < 12 ? Math.pow(0.5, br.sinceSnap / 2.2) : 0;
    // the shot before sets the opening: S04 (main order) or S07 (alternate)
    const shots = T.shots(), prev = shots[shots.findIndex((s) => s.id === sh.id) - 1];
    const fromS07 = prev && prev.id === 'S07';
    const c0 = fromS07 ? toCY(s07State(T, Wd, prev.f1 - 1, prev).cam) : camS04(143);
    const st = fromS07 ? s07State(T, Wd, f, prev).st : stackS04(T, Wd, f);
    // camera: from the previous shot's last framing to this shot's, during the fall
    const camT = easeInOut(clamp(fl / 22));
    const z5 = 0.94 + 0.04 * easeInOut(clamp(fl / (n - 1)));
    const cam = { z: lerp(c0.z, z5, camT), fx: SX, fy: CY, px: lerp(c0.px, SX - 20, camT), py: lerp(c0.py, CY + 70, camT) };
    const beatP = T.pulse('beats', f, 4);
    const db = downbeat(T, f, f0);
    // the odometers turn at the shown time's pace (slow inside a breath, still once training ends)
    const head = headAt(f), step = stepAt(f), rate = stepAt(breathAt(T, fr.f + 1, f0, f1).fe) - step;
    // the ending: with a stop in the last beat (alternate) the breath carries it into the cut;
    // otherwise (main) the curve settles into the horizon as the layers begin to lift again
    const endStop = stopsIn(T, f1 - 24, f1).length > 0;
    const settle = endStop ? 0 : easeInOut(clamp((fl - (n - 20)) / 19));
    const rise = endStop ? 0 : clamp((fl - (n - 17)) / 16);
    const L = st.layers;
    const fall = easeIn(clamp(fl / FALL));
    for (let l = 1; l <= L.n; l++) {
      const full = HZ - L.y[l];
      const reLift = easeOut(clamp(rise * 1.25 - (l - 1) * 0.05)) * 0.55;
      const h = fl < FALL + 2 ? full * (1 - fall) : full * reLift;
      L.y[l] = HZ - h;
      L.a[l] = (fl < FALL + 2 ? 1 - smoothstep(0.75, 1, fall) : smoothstep(0, 0.35, reLift)) * (L.a[l] > 0 ? 1 : 0);
    }
    const stackOn = fl < FALL + 2 || rise > 0;
    // chop notes light tokens, as in S03
    const lit = new Map();
    for (const fc of T.events('chops')) {
      if (fc > f || fc < f - 30 || fc < f0 - 2) continue;
      const age = f - fc, amp = Math.min(1, (age + 1) / 2) * Math.pow(0.5, age / 6);
      const idx = Wd.tokAtS(headAt(fc) + OFFS[chopLevel(fc)]);
      lit.set(idx, Math.max(lit.get(idx) || 0, amp));
    }
    for (const h of st.fired) lit.set(h.q, Math.max(lit.get(h.q) || 0, h.amp * 0.8));
    const chopP = T.pulse('chops', f, 5);
    // the landing of the layers sends one strong ripple; each snap back from a breath another
    const ripples = beatRipples(T, f, { base: 0.55, gain: 0.2, down: 1.0, extra: [{ f: f0 + FALL, amp: 1.2 }] });
    if (br.sinceSnap < 40) ripples.unshift({ age: br.sinceSnap, amp: 1.3, speed: 150, width: 80 });
    // the loss steps down on each bass stop inside the shot, as the bass cuts (in the 3 frames before it)
    const drops = stopsIn(T, f0, f1).map((s) => [stepAt(s - 3), stepAt(s - 1)]);
    const lossD = (sv) => lossAt(sv) - drops.reduce((a, [s0, s1]) => a + DROP * smoothstep(s0, s1 + 1e-6, sv), 0);
    // the curve: sweeps down in its first bar; in the main order it settles into the horizon at the end
    const sweep = easeInOut(clamp((fl - 8) / 64));
    const Lnow = lossSmooth(step);
    Wd.render({
      f, grainF: fr.f, cam, head, speed: speedAt(f), expo: lerp(1.5, 1.2, camT), tau: 20 + fl * 0.07, reflG: 0.6, profile: 48,
      laneOff: laneOffAt(f), laneV: laneVAt(f), dim: br.b, flash: 0.28 * snap,
      lit, arcsA: lerp(0.45, 0.35, camT), arcBoost: db.boost, comet: db.comet,
      tokG: lerp(1.35, 1.2, camT), skyG: lerp(0.8, 0.86, camT), lightG: lerp(1.7, 1.35, camT),
      layers: stackOn ? L : null, thread: 0.8,
      glow: { amp: lerp(1.3, 1.2, camT) + 0.25 * beatP + 0.3 * chopP + 0.25 * db.flare + 0.4 * snap, r: 1, burst: lerp(0.9, 0.85, camT) + 0.2 * beatP, rot: 0.03 * 287 / 30 + 0.004 * (143 + fl) },
      lineG: lerp(1.15, 1.08, camT) + 0.2 * beatP + 0.4 * snap, laneA: lerp(1.7, 1.4, camT), ripples: ripples.slice(0, 8),
      haloG: breath(T, f) * lerp(1.2, 1, camT), bloom: lerp(1.15, 1.05, camT), eyes: eyesAt(fl, EYES, BLINKS),
      drawLight: (g, api) => {
        const { X, Y } = api;
        if (fl < 30) drawFired(g, api, st, (1 - fall) * (1.7 + db.boost), 1 - fall);
        if (sweep <= 0) return;
        // ---- the loss curve: x ~ (step / now)^0.4; y keeps the smooth live value at his head, so a
        // step down shows as the head dropping below it
        const x0 = 150, x1 = SX - 4, yTop = 150, yEnd = HZ - 36;
        const xOf = (s) => x0 + (x1 - x0) * Math.pow(s / step, 0.4);
        const yOf = (Lv) => lerp(yEnd - (Lv - Lnow) / (10.8 - Lnow) * (yEnd - yTop), HZ - 3, settle);
        const np = 260, nHead = Math.max(1, Math.round(np * sweep));
        const pts = [];
        for (let i = 0; i <= nHead; i++) {
          const s = step * Math.pow(i / np, 1 / 0.4);
          pts.push([X(xOf(s)), Y(yOf(lossD(s)))]);
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
          if (age < 0 || age > 13 || b < f0 + 10) continue;
          const t = easeIn(clamp(age / 12));
          const i1 = Math.round(t * (pts.length - 1)), i0 = Math.max(0, i1 - 14);
          const a = Math.min(1, 1.0 * (1 - smoothstep(8, 13, age)) * fade);
          line(2.6, a * 0.4, i0, i1); line(1.5, a, Math.max(i0, i1 - 6), i1);
        }
        // the head: a bright point with a short comet glow
        const [hx, hy] = pts[pts.length - 1];
        const ha = Math.min(1, (1.0 * (1 - 0.5 * smoothstep(60, 80, fl)) + 0.35 * chopP + 0.5 * snap) * fade);
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
          g.fillText(lossD(step * Math.pow(nHead / np, 1 / 0.4)).toFixed(4), hx - 150 * k, hy - 10 * k);
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
      // the previous shot's corner HUD fades as the big counters take over
      drawUI: fl < 12 ? (g, api) => drawHUD(g, api, { step, a: 1 - smoothstep(0, 10, fl) }) : null,
    });
  },
};
