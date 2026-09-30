// S05, hook 1 (bars 13-14, after S07): numbers going up.
// In (R22, Claire: the lead-in must connect to the frame before): it grows out of S07's last frame
// (xin 6). S07's attention arcs, frozen where S07 left them, gather into one arc that rises from the
// stack's hub to the top-left, and a bead of light rides it there, landing (about local 13) where
// the loss curve begins. From there the curve falls in one sweep as before: the head with its live
// readout ticking down, the curve drawing behind it, while the arc's residue fades and the stack
// falls into the horizon line. Odometers (tokens seen, FLOPs, steps) spin to his right, and beads of
// light run down the curve on every beat. His eyes follow the curve down, then glance at the counters.
// The bass stops on 13.4 and 14.4 play straight through (R22: no freeze, slow motion or hush). The
// counters land on 131 072 steps and loss 2.8416 on the last frame, the hard cut to the lab.
import { createTokenWorld, HZ, SX, fishM } from '../sets/tokens/world.js';
import { headAt, speedAt, stepAt, lossAt, lossSmooth, chopLevel, tokensAt, flopAt } from '../sets/tokens/train.js';
import { eyesAt, laneOffAt, laneVAt } from '../sets/tokens/hook.js';
import { s07State, s07LastArcs } from '../sets/tokens/s07.js';
import { beatRipples, downbeat, breath } from '../sets/tokens/pulse.js';
import { drawOdometer, drawLabel } from '../sets/tokens/counters.js';
import { drawHUD } from '../sets/tokens/hud.js';
import { hash, smoothstep, clamp, easeInOut, easeOut, easeIn, lerp } from '../lib/util.js';

let Wd, PREV;
const CY = HZ - 16;
const OFFS = [-8, -3.5, 4, 9, 15];
const FALL = 16;                                   // frames for S07's stack to fall into the line
const EYES = [{ at: 0 }, { at: 14, dc: -1 }, { at: 74 }, { at: 90, dc: 1 }, { at: 118 }];
const BLINKS = [82, 132];
// a camera in S07's form (focus on the line) expressed in this shot's form (focus on his middle)
const toCY = (c) => ({ z: c.z, fx: SX, fy: CY, px: c.px, py: c.py + (CY - c.fy) * c.z });

export default {
  async setup(ctx) {
    Wd = createTokenWorld(ctx.canvas, { W: ctx.W, H: ctx.H, log: ctx.log });
    const shots = ctx.T.shots();
    PREV = shots[shots.findIndex((s) => s.id === ctx.shot.id) - 1];            // S07
  },
  render(ctx, fr) {
    const T = ctx.T, f = fr.f, fl = fr.fl, f0 = f - fl, k = ctx.W / 1920;
    const n = ctx.shot.f1 - ctx.shot.f0;
    // camera: from S07's last framing to this shot's, during the fall
    const c0 = toCY(s07State(T, Wd, PREV.f1 - 1, PREV).cam);
    const camT = easeInOut(clamp(fl / 22));
    const z5 = 0.94 + 0.04 * easeInOut(clamp(fl / (n - 1)));
    const cam = { z: lerp(c0.z, z5, camT), fx: SX, fy: CY, px: lerp(c0.px, SX - 20, camT), py: lerp(c0.py, CY + 70, camT) };
    const beatP = T.pulse('beats', f, 4);
    const db = downbeat(T, f, f0 + 1);             // no ignition on the first downbeat: the gather is the event
    const head = headAt(f), step = stepAt(f), rate = stepAt(f + 1) - step;
    // S07's stack keeps running while it falls into the line
    const st = s07State(T, Wd, f, PREV).st, L = st.layers;
    const fall = easeIn(clamp(fl / FALL));
    for (let l = 1; l <= L.n; l++) {
      L.y[l] = HZ - (HZ - L.y[l]) * (1 - fall);
      L.a[l] = (1 - smoothstep(0.75, 1, fall)) * (L.a[l] > 0 ? 1 : 0);
    }
    const stackOn = fl < FALL + 2;
    // chop notes light tokens, as in S03
    const lit = new Map();
    for (const fc of T.events('chops')) {
      if (fc > f || fc < f - 30 || fc < f0 - 2) continue;
      const age = f - fc, amp = Math.min(1, (age + 1) / 2) * Math.pow(0.5, age / 6);
      const idx = Wd.tokAtS(headAt(fc) + OFFS[chopLevel(fc)]);
      lit.set(idx, Math.max(lit.get(idx) || 0, amp));
    }
    const chopP = T.pulse('chops', f, 5);
    // the stack's landing sends one strong ripple along the line
    const ripples = beatRipples(T, f, { base: 0.55, gain: 0.2, down: 1.0, extra: [{ f: f0 + FALL, amp: 1.2 }] });
    // the lead-in: S07's arcs gather into one arc (1-10), a bead rides it from the stack's hub to the
    // curve's start (4-13), and its residue fades while the curve falls (13-38)
    const gw = easeInOut(clamp((fl - 1) / 9));
    const bead = easeInOut(clamp((fl - 4) / 9));
    const resid = 1 - smoothstep(13, 38, fl);
    // the fall: the curve's head runs from the start down to him (the pre-R22 timing, from the landing)
    const sweep = easeInOut(clamp((fl - 12) / 60));
    const Lnow = lossSmooth(step);
    const arcs = fl < 40 ? s07LastArcs(T, Wd, PREV) : null;
    Wd.render({
      f, cam, head, speed: speedAt(f), expo: lerp(1.5, 1.2, camT), tau: 20 + fl * 0.07, reflG: 0.6, profile: 48,
      laneOff: laneOffAt(f), laneV: laneVAt(f),
      lit, arcsA: lerp(0.4, 0.35, camT), arcBoost: db.boost, comet: db.comet,
      tokG: lerp(1.35, 1.2, camT), skyG: lerp(0.8, 0.86, camT), lightG: lerp(1.7, 1.35, camT),
      layers: stackOn ? L : null, thread: 0.8 * (1 - fall),
      glow: { amp: lerp(1.3, 1.2, camT) + 0.25 * beatP + 0.3 * chopP + 0.25 * db.flare, r: 1, burst: lerp(0.9, 0.85, camT) + 0.2 * beatP, rot: 0.859 + 0.004 * fl },
      lineG: lerp(1.15, 1.08, camT) + 0.2 * beatP, laneA: lerp(1.7, 1.4, camT), ripples: ripples.slice(0, 8),
      haloG: breath(T, f) * lerp(1.2, 1, camT), bloom: lerp(1.15, 1.05, camT), eyes: eyesAt(fl, EYES, BLINKS),
      drawLight: (g, api) => {
        const { X, Y } = api;
        // ---- the loss curve (world): x linear in t, t = (s / step)^0.4; y keeps the live value at his head
        const x0 = 150, x1 = SX - 4, yTop = 150, yEnd = HZ - 36;
        const sAt = (t) => step * Math.pow(t, 1 / 0.4);
        const cW = (t) => [x0 + (x1 - x0) * t, yEnd - (lossAt(sAt(t)) - Lnow) / (10.8 - Lnow) * (yEnd - yTop)];
        g.lineJoin = 'round'; g.lineCap = 'round';
        // ---- the lead-in: S07's last arcs gather into one arc, from the stack's hub up to the curve's start
        const P0 = cW(0);
        if (arcs) {
          const xw = (i) => SX + fishM(Wd.TOKS[i].s0 + Wd.TOKS[i].n / 2 - arcs.head);
          let hx = 0, hy = 0, hw = 0;                                 // the hub: where S07's fans converge
          for (const a of arcs.arcs) { const wt = a.amp * (0.1 + 0.55 * a.w); hx += xw(a.qi) * wt; hy += a.yq * wt; hw += wt; }
          if (hw > 0) { hx /= hw; hy /= hw; } else { hx = SX - 200; hy = HZ - 200; }
          const ddx = P0[0] - hx, ddy = P0[1] - hy, dlen = Math.hypot(ddx, ddy);
          const D = (t) => [hx + ddx * t, hy + ddy * t - 0.28 * dlen * Math.sin(Math.PI * t)];
          const NS = 28;
          const polyPass = (Q, lw, a0, a1) => {
            const gr = g.createLinearGradient(Q[0][0], 0, Q[Q.length - 1][0] + 0.01, 0);
            gr.addColorStop(0, `rgba(255,255,255,${Math.min(1, a0).toFixed(4)})`);
            gr.addColorStop(1, `rgba(255,255,255,${Math.min(1, a1).toFixed(4)})`);
            g.strokeStyle = gr; g.lineWidth = lw * k * Math.sqrt(api.cam.z);
            g.beginPath(); Q.forEach(([px, py], u) => (u ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke();
          };
          // each arc bends onto the one arc: its key end toward the curve's start, its query end to the hub
          for (const a of arcs.arcs) {
            const xk = xw(a.ki), xq = xw(a.qi), sp = xq - xk;
            if (sp < 2) continue;
            const hh = Math.min(22 + sp * 0.2, 260) * (0.8 + 0.4 * hash(a.seed, a.ki, 3));
            const p = easeOut(clamp((a.age + fl + 1) / 4));            // arcs mid-draw finish drawing
            const alpha = (0.10 + 0.55 * a.w) * a.amp * Math.pow(0.5, fl / 9) * 1.7 * (1 - 0.85 * gw) * resid;
            if (alpha < 0.004) continue;
            const Q = [];
            for (let u = 0; u <= NS; u++) {
              const t = p * u / NS;
              const ax = xk + sp * t, ay = a.yk + (a.yq - a.yk) * t - hh * Math.pow(Math.sin(Math.PI * t), 0.85);
              const [ex, ey] = D(1 - t);
              Q.push([X(lerp(ax, ex, gw)), Y(lerp(ay, ey, gw))]);
            }
            // as S07 draws them (stack.js drawFired): dimmer at the key, full at the query, and a
            // wide faint glow on the strong ones
            polyPass(Q, 1.0 + 0.6 * a.w, alpha * 0.35, alpha);
            if (a.w > 0.6) polyPass(Q, 5, alpha * 0.03, alpha * 0.10);
          }
          // the one arc, and the bead of light it carries to the curve's start
          const da = 0.85 * gw * resid;
          if (da > 0.005) {
            const Q = [];
            for (let u = 0; u <= 40; u++) { const [ex, ey] = D(u / 40); Q.push([X(ex), Y(ey)]); }
            polyPass(Q, 1.6, da, da * 0.7);
            polyPass(Q, 6, da * 0.12, da * 0.08);
          }
          const ba = smoothstep(3, 6, fl) * (1 - smoothstep(13, 16, fl));
          if (ba > 0.005) {
            const Q = [];
            for (let u = 0; u <= 10; u++) { const [ex, ey] = D(Math.max(0, bead - 0.09 * (1 - u / 10))); Q.push([X(ex), Y(ey)]); }
            polyPass(Q, 2.2, 0, ba);                                   // its short comet tail
            const [bx, by] = Q[10];
            const gr = g.createRadialGradient(bx, by, 0, bx, by, 22 * k);
            gr.addColorStop(0, `rgba(255,255,255,${(0.7 * ba).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = gr; g.fillRect(bx - 22 * k, by - 22 * k, 44 * k, 44 * k);
            g.fillStyle = `rgba(255,255,255,${ba.toFixed(3)})`; g.beginPath(); g.arc(bx, by, 2.8 * k, 0, 7); g.fill();
          }
        }
        // ---- the loss curve falls in one sweep from where the bead landed, drawing behind its head
        const np = 260, nHead = Math.max(1, Math.round(np * sweep));
        const pts = [];
        for (let i = 0; i <= nHead; i++) { const [cx, cy] = cW(i / np); pts.push([X(cx), Y(cy)]); }
        const line = (w, a, i0 = 0, i1 = pts.length - 1) => {
          if (i1 - i0 < 1) return;
          g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = w * k;
          g.beginPath(); for (let i = i0; i <= i1; i++) (i > i0 ? g.lineTo(pts[i][0], pts[i][1]) : g.moveTo(pts[i][0], pts[i][1])); g.stroke();
        };
        if (sweep > 0) { line(8, 0.045); line(2.8, 0.16); line(1.4, 0.9); }
        // beads of light run down the curve on every beat
        for (const b of T.events('beats')) {
          const age = f - b;
          if (age < 0 || age > 13 || b < f0 + 18) continue;
          const t = easeIn(clamp(age / 12));
          const i1 = Math.round(t * (pts.length - 1)), i0 = Math.max(0, i1 - 14);
          const a = Math.min(1, 1 - smoothstep(8, 13, age));
          line(2.6, a * 0.4, i0, i1); line(1.5, a, Math.max(i0, i1 - 6), i1);
        }
        // the head: a bright point with a short comet glow; it takes over from the bead as it lands
        const [hx, hy] = pts[pts.length - 1];
        const ha = Math.min(1, (1.0 - 0.5 * smoothstep(60, 80, fl) + 0.35 * chopP) * smoothstep(11, 14, fl));
        if (ha > 0.005) {
          const gr = g.createRadialGradient(hx, hy, 0, hx, hy, 26 * k);
          gr.addColorStop(0, `rgba(255,255,255,${0.55 * ha})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = gr; g.fillRect(hx - 26 * k, hy - 26 * k, 52 * k, 52 * k);
          g.fillStyle = `rgba(255,255,255,${ha})`; g.beginPath(); g.arc(hx, hy, 2.6 * k, 0, 7); g.fill();
        }
        // axis ticks: faint loss gridlines with labels on the left
        const ga = smoothstep(14, 30, fl);
        for (const Lg of [10, 8, 6, 4]) {
          if (Lg <= Lnow + 0.2 || ga <= 0) continue;
          const yy = Y(yEnd - (Lg - Lnow) / (10.8 - Lnow) * (yEnd - yTop));
          g.fillStyle = `rgba(255,255,255,${0.065 * ga})`; g.fillRect(X(x0), yy, X(x1) - X(x0), Math.max(1, k * 0.8));
          drawLabel(g, Lg.toFixed(1), X(x0) - 44 * k, yy + 4 * k, 12 * k, 0.4 * ga);
        }
        // live loss readout riding the head, ticking down as it falls
        const la = smoothstep(12, 22, fl);
        if (la > 0) {
          drawLabel(g, 'LOSS', hx - 150 * k, hy - 34 * k, 12 * k, 0.5 * la);
          g.font = `${(22 * k).toFixed(2)}px Consolas, monospace`;
          g.fillStyle = `rgba(255,255,255,${Math.min(1, la)})`;
          g.fillText(lossAt(sAt(nHead / np)).toFixed(4), hx - 150 * k, hy - 10 * k);
        }
        // ---- odometers to his right
        const cx = X(SX + 120);
        const rows = [
          { label: 'TOKENS', value: tokensAt(step), rate: tokensAt(rate), size: 34, y: 395 },
          { label: 'FLOP', value: flopAt(step), rate: flopAt(rate), size: 24, y: 480 },
          { label: 'STEP', value: step, rate, size: 34, y: 565 },
        ];
        rows.forEach((r, i) => {
          const a = smoothstep(10 + i * 5, 20 + i * 5, fl);
          const y = Y(r.y);
          drawLabel(g, r.label, cx, y - r.size * k * 1.05, 12 * k, 0.5 * a);
          drawOdometer(g, { value: r.value, rate: r.rate, x: cx, y, size: r.size * k * cam.z, alpha: Math.min(1, 0.95 * a * (1 + 0.12 * beatP)) });
        });
      },
      // S07's corner HUD fades as the big counters take over
      drawUI: fl < 12 ? (g, api) => drawHUD(g, api, { step, a: 1 - smoothstep(0, 10, fl) }) : null,
    });
  },
};
